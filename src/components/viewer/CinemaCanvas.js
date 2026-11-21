// src/components/viewer/CinemaCanvas.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { TRANSITIONS, FILTERS, computeClipMotion } from '../../engine/EffectsLibrary';
import { audioDSP } from '../../engine/AudioDSP';
import { generateCSSNativeFilter } from '../../engine/ColorMatrixEngine';
import { OpenCapReelsEngine } from '../../engine/OpenCapReelsEngine';
import { evaluateClipTransform } from '../../engine/KeyframeEngine';

const getTrackZIndex = (trackId = 'V1') => {
  if (trackId.startsWith('T')) {
    const num = parseInt(trackId.slice(1), 10) || 1;
    return 100 + num * 10;
  }
  if (trackId.startsWith('V')) {
    const num = parseInt(trackId.slice(1), 10) || 1;
    return num * 10;
  }
  return 10;
};

export default function CinemaCanvas() {
  const {
    entities,
    mediaPool,
    playhead,
    isPlaying,
    playbackRate = 1.0,
    setIsPlaying,
    setPlayhead,
    projectDuration = 10,
    selectedClipId,
    selectClip,
    updateClip,
    setKeyframe
  } = useNLEStore();

  const mediaRefs = useRef({});
  const audioRefs = useRef({});
  const requestRef = useRef();
  const playStartTimeRef = useRef(0);
  const playheadStartRef = useRef(0);
  const viewportRef = useRef(null);
  const lastTapRef = useRef(0);

  // 온스크린 기즈모 상태
  const [gizmoAction, setGizmoAction] = useState(null);
  const [snapGuideX, setSnapGuideX] = useState(false);
  const [snapGuideY, setSnapGuideY] = useState(false);
  const [grainSeed, setGrainSeed] = useState(1);

  const resolveClipUrl = useCallback(
    (clip) => {
      if (clip?.url) return clip.url;
      if (clip?.mediaId) {
        const foundInPool = mediaPool?.find((m) => m.id === clip.mediaId);
        if (foundInPool?.url) return foundInPool.url;
        const foundInEntities = entities?.media?.[clip.mediaId];
        if (foundInEntities?.url) return foundInEntities.url;
      }
      return clip?.url || '';
    },
    [mediaPool, entities]
  );

  // 60FPS 절대 시간 기반 재생 루프 (J-K-L 배속 및 역재생 지원)
  const animate = useCallback(
    (now) => {
      const state = useNLEStore.getState();
      if (!state.isPlaying) return;

      const rate = state.playbackRate || 1.0;
      const elapsedSec = ((now - playStartTimeRef.current) / 1000) * rate;
      const targetPlayhead = playheadStartRef.current + elapsedSec;
      const maxDur = Math.max(1, state.projectDuration || 10);

      if (targetPlayhead >= maxDur) {
        setIsPlaying(false);
        setPlayhead(0);
        return;
      }
      if (targetPlayhead < 0) {
        setIsPlaying(false);
        setPlayhead(0);
        return;
      }

      setPlayhead(Number(targetPlayhead.toFixed(3)));
      if (Math.random() > 0.65) {
        setGrainSeed(Math.floor(Math.random() * 100));
      }
      requestRef.current = requestAnimationFrame(animate);
    },
    [setPlayhead, setIsPlaying]
  );

  useEffect(() => {
    if (isPlaying) {
      const storeState = useNLEStore.getState();
      const maxDur = Math.max(1, storeState.projectDuration || 10);
      if (storeState.playhead >= maxDur - 0.05 && (storeState.playbackRate || 1) > 0) {
        setPlayhead(0);
        playheadStartRef.current = 0;
      } else {
        playheadStartRef.current = storeState.playhead;
      }
      playStartTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackRate, animate, setPlayhead]);

  // 모든 비주얼 클립 (숨김 트랙 제외, 조정 레이어 포함)
  const allVisualClips = useMemo(() => {
    if (!entities?.tracks || !entities?.clips) return [];
    return Object.values(entities.tracks).flatMap((track) => {
      if (!track?.clipIds || track.hidden) return [];
      return track.clipIds
        .map((id) => entities.clips[id])
        .filter(
          (clip) =>
            clip &&
            (clip.type === 'video' ||
              clip.type === 'image' ||
              clip.type === 'text' ||
              clip.type === 'adjustment')
        );
    });
  }, [entities]);

  // 모든 오디오 클립
  const allAudioClips = useMemo(() => {
    if (!entities?.tracks || !entities?.clips) return [];
    return Object.values(entities.tracks).flatMap((track) => {
      if (!track?.clipIds) return [];
      return track.clipIds
        .map((id) => entities.clips[id])
        .filter((clip) => clip && clip.type === 'audio')
        .map((clip) => ({ ...clip, _trackMuted: Boolean(track.muted) }));
    });
  }, [entities]);

  // 현재 활성 클립
  const activeClips = useMemo(() => {
    return allVisualClips.filter((clip) => {
      const start = clip.start || 0;
      const duration = clip.duration || 3.5;
      return playhead >= start - 0.001 && playhead < start + duration;
    });
  }, [allVisualClips, playhead]);

  // OpenCap 3.6초 주기 다이내믹 펀치 줌
  const punchZoom = useMemo(() => {
    return OpenCapReelsEngine.calculateDynamicPunchZoom(playhead, projectDuration);
  }, [playhead, projectDuration]);

  // AudioDSP 48kHz 오디오 동기화 (트랙 뮤트 반영)
  useEffect(() => {
    allAudioClips.forEach((clip) => {
      const aRef = audioRefs.current[clip.id];
      if (!aRef) return;

      if (typeof audioDSP?.connectMedia === 'function') {
        audioDSP.connectMedia(aRef, clip.trackId || 'A1');
      }

      const start = clip.start || 0;
      const duration = clip.duration || 3.5;
      const inPoint = clip.inPoint || clip.mediaOffset || 0;
      const isActive = playhead >= start && playhead < start + duration;
      const timeFromStart = playhead - start;
      const effectiveSpeed = Math.abs((clip.speed || 1.0) * (playbackRate || 1.0));

      if (isActive && !clip._trackMuted) {
        const targetTime = Math.max(0, inPoint + timeFromStart * (clip.speed || 1.0));
        aRef.playbackRate = Math.max(0.25, Math.min(4.0, effectiveSpeed));
        aRef.volume = Math.max(0, Math.min(1, (clip.volume ?? 100) / 100));
        aRef.muted = false;

        if (isPlaying && playbackRate > 0) {
          if (aRef.paused) aRef.play().catch(() => {});
          if (Math.abs(aRef.currentTime - targetTime) > 0.12) {
            aRef.currentTime = targetTime;
          }
        } else {
          if (!aRef.paused) aRef.pause();
          if (Math.abs(aRef.currentTime - targetTime) > 0.04) {
            aRef.currentTime = targetTime;
          }
        }
      } else {
        aRef.muted = true;
        if (!aRef.paused) aRef.pause();
      }
    });
  }, [allAudioClips, playhead, isPlaying, playbackRate]);

  const selectedClip = selectedClipId ? entities?.clips?.[selectedClipId] : null;
  const isSelectedClipActive = activeClips.some((c) => c.id === selectedClipId);

  // 선택된 클립의 현재 시점 키프레임 보간 Transform
  const selectedEvaluatedTf = useMemo(() => {
    if (!selectedClip) return null;
    return evaluateClipTransform(selectedClip, playhead);
  }, [selectedClip, playhead]);

  // 통합 Pointer 이벤트 기즈모 시작 (자동 키프레임 연동)
  const startGizmoAction = (e, mode, handleType = null) => {
    e.stopPropagation();
    if (!selectedClip || !viewportRef.current || !selectedEvaluatedTf) return;

    const vpRect = viewportRef.current.getBoundingClientRect();
    const centerX = vpRect.left + vpRect.width / 2 + selectedEvaluatedTf.x;
    const centerY = vpRect.top + vpRect.height / 2 + selectedEvaluatedTf.y;

    const initialAngleDeg = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;

    setGizmoAction({
      mode,
      handleType,
      startX: e.clientX,
      startY: e.clientY,
      centerX,
      centerY,
      initialAngleDeg,
      initialX: selectedEvaluatedTf.x,
      initialY: selectedEvaluatedTf.y,
      initialScale: selectedEvaluatedTf.scale,
      initialRotate: selectedEvaluatedTf.rotate
    });
  };

  useEffect(() => {
    if (!gizmoAction || !selectedClipId || !selectedClip) return;

    const handlePointerMove = (e) => {
      const deltaX = e.clientX - gizmoAction.startX;
      const deltaY = e.clientY - gizmoAction.startY;
      const currentTf = selectedClip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
      const localTime = Math.max(0, playhead - (selectedClip.start || 0));
      const kf = selectedClip.keyframes || {};

      if (gizmoAction.mode === 'move') {
        let nextX = Math.round(gizmoAction.initialX + deltaX);
        let nextY = Math.round(gizmoAction.initialY + deltaY);

        const isSnappedX = Math.abs(nextX) < 7;
        const isSnappedY = Math.abs(nextY) < 7;
        if (isSnappedX) nextX = 0;
        if (isSnappedY) nextY = 0;

        setSnapGuideX(isSnappedX);
        setSnapGuideY(isSnappedY);

        if (kf.x?.length > 0) setKeyframe(selectedClipId, 'x', localTime, nextX);
        if (kf.y?.length > 0) setKeyframe(selectedClipId, 'y', localTime, nextY);

        updateClip(selectedClipId, {
          positionX: nextX,
          positionY: nextY,
          transform: { ...currentTf, x: nextX, y: nextY }
        });
      } else if (gizmoAction.mode === 'scale') {
        const factor = 1 + (deltaX - deltaY) / 160;
        const nextScale = Math.max(10, Math.min(400, Math.round(gizmoAction.initialScale * factor)));

        if (kf.scale?.length > 0) setKeyframe(selectedClipId, 'scale', localTime, nextScale);

        updateClip(selectedClipId, {
          scale: nextScale,
          transform: { ...currentTf, scale: nextScale }
        });
      } else if (gizmoAction.mode === 'rotate') {
        const currentAngleDeg =
          (Math.atan2(e.clientY - gizmoAction.centerY, e.clientX - gizmoAction.centerX) * 180) / Math.PI;
        let nextRotate = Math.round((gizmoAction.initialRotate + (currentAngleDeg - gizmoAction.initialAngleDeg)) % 360);

        if (Math.abs(nextRotate) < 4 || Math.abs(nextRotate - 360) < 4) nextRotate = 0;
        else if (Math.abs(nextRotate - 90) < 4) nextRotate = 90;
        else if (Math.abs(nextRotate - 180) < 4) nextRotate = 180;
        else if (Math.abs(nextRotate - 270) < 4) nextRotate = 270;

        if (kf.rotate?.length > 0) setKeyframe(selectedClipId, 'rotate', localTime, nextRotate);

        updateClip(selectedClipId, {
          rotation: nextRotate,
          transform: { ...currentTf, rotate: nextRotate }
        });
      }
    };

    const handlePointerUp = () => {
      setGizmoAction(null);
      setSnapGuideX(false);
      setSnapGuideY(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gizmoAction, selectedClipId, selectedClip, playhead, updateClip, setKeyframe]);

  const isVideoSource = useCallback((clip, url) => {
    if (clip?.type === 'video') return true;
    if (clip?.type === 'image') return false;
    const name = clip?.name || '';
    if (/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(name)) return true;
    if (url && (url.startsWith('data:video') || /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/i.test(url))) return true;
    return false;
  }, []);

  const renderMediaElement = useCallback(
    (clip, sourceUrl, extraClass = '') => {
      const grid = clip.gridConfig || { mode: 'single' };
      const resolvedUrl = resolveClipUrl(clip) || sourceUrl;
      const isVideo = isVideoSource(clip, resolvedUrl);

      if (grid.mode === 'matrix' && (grid.rows > 1 || grid.cols > 1)) {
        const cellMedia = grid.cellMedia || {};
        const urls = [cellMedia[0] || resolvedUrl, cellMedia[1] || resolvedUrl, cellMedia[2] || resolvedUrl];
        return (
          <div className="w-full h-full flex flex-col gap-1.5 p-2 bg-[#020305]">
            <div className="flex-1 w-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
              {isVideoSource(clip, urls[0]) ? (
                <video src={urls[0]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={urls[0]} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="h-1/3 w-full flex gap-1.5">
              {[urls[1], urls[2]].map((u, idx) => (
                <div key={idx} className="flex-1 rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
                  {isVideoSource(clip, u) ? (
                    <video src={u} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (isVideo) {
        const isTrackMuted = Boolean(entities?.tracks?.[clip.trackId]?.muted);
        const clipVolume = isTrackMuted ? 0 : clip.volume ?? 100;

        return (
          <video
            ref={(el) => {
              if (el && resolvedUrl) {
                mediaRefs.current[clip.id] = el;
                if (typeof audioDSP?.connectMedia === 'function') {
                  audioDSP.connectMedia(el, clip.trackId || 'V1');
                }
              }
            }}
            src={resolvedUrl}
            className={`w-full h-full pointer-events-none select-none object-cover ${extraClass}`}
            playsInline
            muted={clipVolume === 0}
            loop
            preload="auto"
          />
        );
      }

      return (
        <img
          src={resolvedUrl}
          className={`w-full h-full pointer-events-none select-none object-cover ${extraClass}`}
          alt={clip.name || ''}
          loading="eager"
          decoding="async"
        />
      );
    },
    [resolveClipUrl, isVideoSource, entities?.tracks]
  );

  // Immer 동결 객체 안전: clip._wordTokens 직접 변조 제거
  const renderTextClip = (clip) => {
    const style = clip.style || {};
    const fontSize = style.fontSize || 22;
    const color = style.color || '#FFFFFF';
    const fontFamily = style.fontFamily || 'MaruBuri, sans-serif';
    const isBadgePreset = style.preset === 'sermon-badge';
    const isHeroTitle = clip.trackId === 'T2';
    const isHormozi = style.preset === 'hormozi' || !style.preset;

    if (isHeroTitle) {
      return (
        <div className="flex flex-col items-center justify-center text-center px-4 pointer-events-none select-none animate-fade-in">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#00E5FF] uppercase font-bold mb-1 opacity-90 drop-shadow">
            PROLOGUE
          </span>
          <h2
            style={{
              fontFamily,
              fontSize: `${Math.min(26, fontSize)}px`,
              letterSpacing: '0.08em',
              lineHeight: 1.25,
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 229, 255, 0.45)'
            }}
            className="break-keep font-black"
          >
            {clip.content || 'THE MOMENT'}
          </h2>
          <div className="w-10 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent mt-2 opacity-90 rounded-full" />
        </div>
      );
    }

    const tokens =
      clip._wordTokens ||
      (clip.content
        ? OpenCapReelsEngine.generateWordTokensFromSentence(clip.content, clip.start || 0, clip.duration || 3.5)
        : []);

    if (isBadgePreset) {
      return (
        <div
          className="relative w-[88%] max-w-[340px] px-4.5 py-3.5 rounded-2xl pointer-events-none select-none transition-all duration-300 shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.78) 0%, rgba(4, 6, 10, 0.90) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-pulse" />
            <span className="text-[#00E5FF] font-black text-[9.5px] tracking-widest font-mono">
              {style.badgeText || '말씀'}
            </span>
          </div>

          <p
            style={{ fontFamily, fontSize: `${Math.min(19, fontSize)}px`, lineHeight: 1.5, fontWeight: 700 }}
            className="break-keep text-left flex flex-wrap gap-x-1.5 gap-y-1"
          >
            {tokens.length > 0 ? (
              tokens.map((tok, tIdx) => {
                const isActive = playhead >= tok.start && playhead < tok.end;
                return (
                  <span
                    key={tok.id || tIdx}
                    className={`transition-all duration-100 inline-block ${
                      isActive ? 'text-[#00E5FF] scale-110 font-black drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]' : 'text-white/80'
                    }`}
                  >
                    {tok.word}
                    {tok.emoji && isActive && <span className="ml-0.5 animate-bounce inline-block">{tok.emoji}</span>}
                  </span>
                );
              })
            ) : (
              <span className="text-white">{clip.content}</span>
            )}
          </p>
        </div>
      );
    }

    if (isHormozi) {
      return (
        <div className="px-4 py-2 text-center pointer-events-none select-none max-w-[92%] flex flex-wrap justify-center gap-x-2 gap-y-1">
          {tokens.length > 0 ? (
            tokens.map((tok, tIdx) => {
              const isActive = playhead >= tok.start && playhead < tok.end;
              return (
                <span
                  key={tok.id || tIdx}
                  style={{
                    fontFamily,
                    fontSize: `${fontSize * (isActive ? 1.22 : 1.0)}px`,
                    fontWeight: 900,
                    color: isActive ? '#FFE600' : '#FFFFFF',
                    WebkitTextStroke: '2.5px #000000',
                    textShadow: isActive
                      ? '0 0 24px rgba(255, 230, 0, 0.9), 0 4px 8px rgba(0,0,0,0.9)'
                      : '0 3px 6px rgba(0,0,0,0.85)'
                  }}
                  className={`transition-all duration-100 inline-block ${isActive ? 'scale-115 z-20' : 'scale-100 z-10'}`}
                >
                  {tok.word}
                  {tok.emoji && isActive && <span className="ml-1 text-[1.2em] animate-bounce inline-block">{tok.emoji}</span>}
                </span>
              );
            })
          ) : (
            <span style={{ fontFamily, fontSize: `${fontSize}px`, fontWeight: 900, color: '#FFE600', WebkitTextStroke: '2px #000000' }}>
              {clip.content}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="px-4 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-center pointer-events-none select-none">
        <span style={{ fontFamily, fontSize: `${fontSize}px`, color, fontWeight: 800, textShadow: '0 2px 4px rgba(0, 0, 0, 0.85)' }}>
          {clip.content || '자막'}
        </span>
      </div>
    );
  };

  const handleViewportDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) setPlayhead(0);
    lastTapRef.current = now;
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-2 select-none overflow-hidden"
      onClick={() => selectClip(null)}
    >
      {/* 백그라운드 오디오 트랙 */}
      <div className="hidden">
        {allAudioClips.map((clip) => (
          <audio
            key={clip.id}
            ref={(el) => {
              if (el) audioRefs.current[clip.id] = el;
            }}
            src={resolveClipUrl(clip)}
            preload="auto"
          />
        ))}
      </div>

      {/* SVG 필름 그레인 필터 */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="cinematic-film-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed={grainSeed} result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0" in="noise" result="coloredNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="coloredNoise" />
        </filter>
      </svg>

      {/* 9:16 모니터 뷰포트 */}
      <div
        ref={viewportRef}
        data-cinema-viewport="true"
        onClick={(e) => {
          e.stopPropagation();
          handleViewportDoubleTap();
        }}
        style={{ isolation: 'isolate' }}
        className="relative z-0 h-full max-h-[660px] aspect-[9/16] bg-[#020305] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex items-center justify-center ring-1 ring-white/10 cursor-pointer"
        title="더블 탭 시 0초로 이동"
      >
        {activeClips.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 pointer-events-none z-0">
            <span className="text-3xl font-mono font-black text-zinc-700 tracking-wider">1080×1920</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#00E5FF] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              NO SIGNAL • 9:16
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">미디어 풀에서 영상이나 사진을 등록해주세요</p>
          </div>
        )}

        {/* 센터 스냅 가이드라인 */}
        {snapGuideX && <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] pointer-events-none z-[180]" />}
        {snapGuideY && <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] pointer-events-none z-[180]" />}

        {/* 다이내믹 카메라 스테이지 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 ease-out"
          style={{ transform: `translate(${punchZoom.offsetX}px, ${punchZoom.offsetY}px) scale(${punchZoom.scale})` }}
        >
          {[...allVisualClips]
            .sort((a, b) => getTrackZIndex(a.trackId) - getTrackZIndex(b.trackId))
            .map((clip) => {
              const start = clip.start || 0;
              const duration = clip.duration || 3.5;
              const inPoint = clip.inPoint || clip.mediaOffset || 0;
              const isActive = playhead >= start - 0.001 && playhead < start + duration;
              const zIndex = getTrackZIndex(clip.trackId);

              // 조정 레이어(Adjustment Layer) 합성 렌더링
              if (clip.type === 'adjustment') {
                if (!isActive) return null;
                const adjColorFilter = generateCSSNativeFilter(clip.color || {});
                const lutObj = clip.filterPreset && FILTERS?.[clip.filterPreset];
                const adjBlur = clip.fx?.blur ? `blur(${clip.fx.blur}px)` : '';
                const backdropVal = `${adjColorFilter} ${lutObj?.filter || ''} ${adjBlur}`.trim();
                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectClip(clip.id);
                    }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      zIndex,
                      backdropFilter: backdropVal || 'none',
                      WebkitBackdropFilter: backdropVal || 'none'
                    }}
                  />
                );
              }

              // 키프레임 보간 Transform 평가
              const tf = evaluateClipTransform(clip, playhead);
              const crop = clip.crop || { left: 0, right: 0, top: 0, bottom: 0, softness: 0 };
              const fx = clip.fx || {};
              const color = clip.color || {};
              const timeFromStart = Math.max(0, playhead - start);
              const timeToEnd = Math.max(0, start + duration - playhead);
              const currentClipUrl = resolveClipUrl(clip);
              const isVideo = isVideoSource(clip, currentClipUrl);

              // 비디오 하드웨어 싱크
              if (isVideo && mediaRefs.current[clip.id]) {
                const vRef = mediaRefs.current[clip.id];
                const targetTime = Math.max(0, inPoint + timeFromStart * (clip.speed || 1.0));
                const isTrackMuted = Boolean(entities?.tracks?.[clip.trackId]?.muted);
                const clipVolume = isTrackMuted ? 0 : clip.volume ?? 100;

                vRef.volume = Math.max(0, Math.min(1, clipVolume / 100));
                vRef.muted = clipVolume === 0;
                vRef.playbackRate = Math.max(0.25, Math.min(4.0, Math.abs((clip.speed || 1.0) * (playbackRate || 1.0))));

                if (isActive) {
                  if (isPlaying && playbackRate > 0) {
                    if (vRef.paused) {
                      vRef.play().catch(() => {
                        vRef.muted = true;
                        vRef.play().catch(() => {});
                      });
                    }
                    if (Math.abs(vRef.currentTime - targetTime) > 0.25) vRef.currentTime = targetTime;
                  } else {
                    if (!vRef.paused) vRef.pause();
                    if (Math.abs(vRef.currentTime - targetTime) > 0.04) vRef.currentTime = targetTime;
                  }
                } else if (!vRef.paused) {
                  vRef.pause();
                }
              }

              // 트랜지션 & 모션 연산
              let transTransform = '';
              let transOpacity = tf.opacity / 100;
              let transFilter = '';
              let transClipPath = '';
              const transDur = clip.transitionDuration || 0.4;

              if (isActive && clip.transition && clip.transition !== 'none' && timeToEnd <= transDur && timeToEnd >= 0) {
                const progress = 1 - timeToEnd / transDur;
                const transEngine = TRANSITIONS[clip.transition] || TRANSITIONS.none;
                if (transEngine && typeof transEngine.compute === 'function') {
                  const res = transEngine.compute(progress);
                  transTransform = res.transform || '';
                  if (res.opacity !== undefined) transOpacity = res.opacity;
                  if (res.filter) transFilter = res.filter;
                  if (res.clipPath) transClipPath = res.clipPath;
                }
              }

              const motionTransform =
                typeof computeClipMotion === 'function' ? computeClipMotion(clip.animation, timeFromStart, duration) : '';

              const totalScale = tf.scale / 100;
              const flipScaleX = tf.flipH ? -1 : 1;
              const flipScaleY = tf.flipV ? -1 : 1;
              const compTransform = `translate(${tf.x}px, ${tf.y}px) scale(${totalScale * flipScaleX}, ${totalScale * flipScaleY}) rotate(${tf.rotate}deg) ${transTransform} ${motionTransform}`.trim();

              const nativeColorFilter = generateCSSNativeFilter(color);
              const lutObj = clip.filterPreset && FILTERS?.[clip.filterPreset];
              const fxBlur = fx.blur ? `blur(${fx.blur}px)` : '';
              const compFilter = `${nativeColorFilter} ${lutObj?.filter || ''} ${fxBlur} ${transFilter}`.trim();
              const clipPathStyle = transClipPath || `inset(${crop.top}% ${crop.right}% ${crop.bottom}% ${crop.left}% round ${crop.softness || 0}px)`;
              const objectFitClass = clip.scaling === 'fit' ? 'object-contain' : 'object-cover';

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) selectClip(clip.id);
                  }}
                  className={`absolute inset-0 flex items-center justify-center select-none ${
                    isActive ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none opacity-0'
                  }`}
                  style={{
                    transform: compTransform,
                    filter: clip.type === 'text' ? 'none' : compFilter,
                    clipPath: clip.type === 'text' ? 'none' : clipPathStyle,
                    opacity: isActive ? transOpacity : 0,
                    mixBlendMode: tf.blendMode,
                    zIndex: isActive ? zIndex : 0
                  }}
                >
                  {clip.type === 'text' ? renderTextClip(clip) : renderMediaElement(clip, currentClipUrl, objectFitClass)}

                  {fx.letterbox && timeFromStart <= 2.0 && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between overflow-hidden">
                      <div className="w-full bg-black transition-all ease-out" style={{ height: `${Math.max(0, (1 - timeFromStart / 2.0) * 12)}%` }} />
                      <div className="w-full bg-black transition-all ease-out" style={{ height: `${Math.max(0, (1 - timeFromStart / 2.0) * 12)}%` }} />
                    </div>
                  )}

                  {fx.halation && clip.type !== 'text' && (
                    <div
                      className="absolute inset-0 pointer-events-none z-24 mix-blend-screen opacity-40"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.45) 0%, rgba(245,158,11,0.20) 45%, transparent 75%)',
                        filter: 'blur(22px)'
                      }}
                    />
                  )}

                  {clip.type !== 'text' && (
                    <div
                      className="absolute inset-0 pointer-events-none z-22"
                      style={{ background: 'radial-gradient(circle, transparent 65%, rgba(0,0,0,0.6) 100%)' }}
                    />
                  )}
                </div>
              );
            })}
        </div>

        {/* 선택 클립 통합 기즈모 (Pointer 이벤트 통합 · 키프레임 실시간 반영) */}
        {selectedClip && isSelectedClipActive && selectedClip.type !== 'adjustment' && selectedEvaluatedTf && (
          <div
            className="absolute inset-0 z-[170] pointer-events-none border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.6)]"
            style={{
              transform: `translate(${selectedEvaluatedTf.x}px, ${selectedEvaluatedTf.y}px) scale(${selectedEvaluatedTf.scale / 100}) rotate(${selectedEvaluatedTf.rotate}deg)`
            }}
          >
            <div
              onPointerDown={(e) => startGizmoAction(e, 'move')}
              className="absolute inset-4 cursor-move pointer-events-auto bg-[#00E5FF]/5 hover:bg-[#00E5FF]/15 touch-none"
              title="드래그하여 위치 이동"
            />

            {gizmoAction && (
              <div className="absolute top-2 left-2 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded font-mono text-[9px] text-[#00E5FF] font-black border border-white/20 pointer-events-none shadow-lg">
                X: {Math.round(selectedEvaluatedTf.x)}px • Y: {Math.round(selectedEvaluatedTf.y)}px • {Math.round(selectedEvaluatedTf.scale)}% • {Math.round(selectedEvaluatedTf.rotate)}°
              </div>
            )}

            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
              <div
                key={pos}
                onPointerDown={(e) => startGizmoAction(e, 'scale', pos)}
                className={`absolute w-4.5 h-4.5 bg-white border-2 border-[#00E5FF] rounded-xs cursor-nwse-resize pointer-events-auto shadow-md active:scale-125 transition-transform touch-none ${
                  pos === 'top-left'
                    ? '-top-2.5 -left-2.5'
                    : pos === 'top-right'
                    ? '-top-2.5 -right-2.5'
                    : pos === 'bottom-left'
                    ? '-bottom-2.5 -left-2.5'
                    : '-bottom-2.5 -right-2.5'
                }`}
              />
            ))}

            <div className="absolute left-1/2 -top-11 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
              <div
                onPointerDown={(e) => startGizmoAction(e, 'rotate')}
                className="w-5.5 h-5.5 rounded-full bg-[#00E5FF] border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center text-[10px] text-black font-black touch-none"
                title="회전 조절"
              >
                ↻
              </div>
              <div className="w-0.5 h-5.5 bg-[#00E5FF]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
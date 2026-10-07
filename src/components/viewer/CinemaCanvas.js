// src/components/viewer/CinemaCanvas.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { TRANSITIONS, FILTERS, computeClipMotion } from '../../engine/EffectsLibrary';
import { audioDSP } from '../../engine/AudioDSP';
import { generateCSSNativeFilter } from '../../engine/ColorMatrixEngine';

export default function CinemaCanvas() {
  const {
    entities, mediaPool, playhead, isPlaying, setIsPlaying, setPlayhead,
    projectDuration = 10, selectedClipId, selectClip, updateClip
  } = useNLEStore();

  const mediaRefs = useRef({});
  const audioRefs = useRef({});
  const requestRef = useRef();
  const playStartTimeRef = useRef(0);
  const playheadStartRef = useRef(0);
  const viewportRef = useRef(null);

  const [gizmoAction, setGizmoAction] = useState(null);
  const [snapGuideX, setSnapGuideX] = useState(false);
  const [snapGuideY, setSnapGuideY] = useState(false);
  const [grainSeed, setGrainSeed] = useState(1);

  // 클립 소스 URL 무결성 보장 역추적 헬퍼
  const resolveClipUrl = useCallback((clip) => {
    if (clip?.url) return clip.url;
    if (clip?.mediaId) {
      const foundInPool = mediaPool?.find(m => m.id === clip.mediaId);
      if (foundInPool?.url) return foundInPool.url;
      const foundInEntities = entities?.media?.[clip.mediaId];
      if (foundInEntities?.url) return foundInEntities.url;
    }
    return clip?.url || '';
  }, [mediaPool, entities]);

  // 절대 시간 기반 60FPS 타이머 루프 및 필름 그레인 난수 시드 업데이트
  const animate = useCallback((now) => {
    if (isPlaying) {
      const elapsedSec = (now - playStartTimeRef.current) / 1000;
      const targetPlayhead = playheadStartRef.current + elapsedSec;
      const maxDur = Math.max(1, useNLEStore.getState().projectDuration || 10);

      if (targetPlayhead >= maxDur) {
        setIsPlaying(false);
        setPlayhead(0);
      } else {
        setPlayhead(Number(targetPlayhead.toFixed(3)));
        if (Math.random() > 0.6) {
          setGrainSeed(Math.floor(Math.random() * 100));
        }
        requestRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isPlaying, setPlayhead, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) {
      const storeState = useNLEStore.getState();
      const maxDur = Math.max(1, storeState.projectDuration || 10);
      if (storeState.playhead >= maxDur - 0.05) {
        setPlayhead(0);
        playheadStartRef.current = 0;
      } else {
        playheadStartRef.current = storeState.playhead;
      }
      playStartTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate, setPlayhead]);

  // 모든 비주얼 클립
  const allVisualClips = useMemo(() => {
    if (!entities?.tracks || !entities?.clips) return [];
    return Object.values(entities.tracks).flatMap(track => {
      if (!track?.clipIds) return [];
      return track.clipIds
        .map(id => entities.clips[id])
        .filter(clip => clip && (clip.type === 'video' || clip.type === 'image' || clip.type === 'text'));
    });
  }, [entities]);

  // 모든 오디오 클립
  const allAudioClips = useMemo(() => {
    if (!entities?.tracks || !entities?.clips) return [];
    return Object.values(entities.tracks).flatMap(track => {
      if (!track?.clipIds) return [];
      return track.clipIds
        .map(id => entities.clips[id])
        .filter(clip => clip && clip.type === 'audio');
    });
  }, [entities]);

  // 현재 재생헤드 위치의 활성 클립
  const activeClips = useMemo(() => {
    return allVisualClips.filter(clip => {
      const start = clip.start || 0;
      const duration = clip.duration || 3.5;
      return playhead >= (start - 0.001) && playhead < (start + duration);
    });
  }, [allVisualClips, playhead]);

  // AudioDSP 48kHz 시그널 체인 연동
  useEffect(() => {
    allAudioClips.forEach(clip => {
      const aRef = audioRefs.current[clip.id];
      if (!aRef) return;

      if (typeof audioDSP?.connectMedia === 'function') {
        audioDSP.connectMedia(aRef, clip.trackId || 'A1');
      }

      const start = clip.start || 0;
      const duration = clip.duration || 3.5;
      const inPoint = clip.inPoint || clip.mediaOffset || 0;
      const isActive = playhead >= start && playhead < (start + duration);
      const timeFromStart = playhead - start;

      if (isActive) {
        const targetTime = Math.max(0, inPoint + (timeFromStart * (clip.speed || 1.0)));
        aRef.playbackRate = clip.speed || 1.0;
        aRef.volume = Math.max(0, Math.min(1, (clip.volume ?? 100) / 100));

        if (isPlaying) {
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
        if (!aRef.paused) aRef.pause();
      }
    });
  }, [allAudioClips, playhead, isPlaying]);

  const selectedClip = selectedClipId ? entities?.clips?.[selectedClipId] : null;
  const isSelectedClipActive = activeClips.some(c => c.id === selectedClipId);

  // 기즈모 조작 핸들러
  const startGizmoAction = (e, mode, handleType = null) => {
    e.stopPropagation();
    if (!selectedClip || !viewportRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const tf = selectedClip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };

    const vpRect = viewportRef.current.getBoundingClientRect();
    const centerX = vpRect.left + vpRect.width / 2 + (tf.x || 0);
    const centerY = vpRect.top + vpRect.height / 2 + (tf.y || 0);

    const initialAngleRad = Math.atan2(clientY - centerY, clientX - centerX);
    const initialAngleDeg = (initialAngleRad * 180) / Math.PI;

    setGizmoAction({
      mode,
      handleType,
      startX: clientX,
      startY: clientY,
      centerX,
      centerY,
      initialAngleDeg,
      initialX: tf.x || 0,
      initialY: tf.y || 0,
      initialScale: tf.scale ?? 100,
      initialRotate: tf.rotate || 0
    });
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!gizmoAction || !selectedClipId) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - gizmoAction.startX;
      const deltaY = clientY - gizmoAction.startY;
      const currentTf = selectedClip?.transform || { x: 0, y: 0, scale: 100, rotate: 0 };

      if (gizmoAction.mode === 'move') {
        let nextX = Math.round(gizmoAction.initialX + deltaX);
        let nextY = Math.round(gizmoAction.initialY + deltaY);

        let isSnappedX = false;
        let isSnappedY = false;

        if (Math.abs(nextX) < 7) {
          nextX = 0;
          isSnappedX = true;
        }
        if (Math.abs(nextY) < 7) {
          nextY = 0;
          isSnappedY = true;
        }

        setSnapGuideX(isSnappedX);
        setSnapGuideY(isSnappedY);

        updateClip(selectedClipId, {
          transform: {
            ...currentTf,
            x: nextX,
            y: nextY
          }
        });
      } else if (gizmoAction.mode === 'scale') {
        const factor = 1 + (deltaX - deltaY) / 160;
        const nextScale = Math.max(10, Math.min(400, Math.round(gizmoAction.initialScale * factor)));
        updateClip(selectedClipId, { transform: { ...currentTf, scale: nextScale } });
      } else if (gizmoAction.mode === 'rotate') {
        const currentAngleRad = Math.atan2(clientY - gizmoAction.centerY, clientX - gizmoAction.centerX);
        const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
        const angleDiff = currentAngleDeg - gizmoAction.initialAngleDeg;
        let nextRotate = Math.round((gizmoAction.initialRotate + angleDiff) % 360);

        if (Math.abs(nextRotate) < 4 || Math.abs(nextRotate - 360) < 4) nextRotate = 0;
        else if (Math.abs(nextRotate - 90) < 4) nextRotate = 90;
        else if (Math.abs(nextRotate - 180) < 4) nextRotate = 180;
        else if (Math.abs(nextRotate - 270) < 4) nextRotate = 270;

        updateClip(selectedClipId, { transform: { ...currentTf, rotate: nextRotate } });
      }
    };

    const handlePointerUp = () => {
      setGizmoAction(null);
      setSnapGuideX(false);
      setSnapGuideY(false);
    };

    if (gizmoAction) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [gizmoAction, selectedClipId, selectedClip, updateClip]);

  const hasVisuals = activeClips.length > 0;

  const isVideoSource = useCallback((clip, url) => {
    if (clip?.type === 'video') return true;
    if (clip?.type === 'image') return false;
    const name = clip?.name || '';
    if (/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(name)) return true;
    if (url && (url.startsWith('data:video') || /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/i.test(url))) return true;
    return false;
  }, []);

  // 🌟 [핵심 개선 1] CCTV 4분할 격자 박멸 ➔ 시네마틱 멀티-프레임 몽타주 렌더러
  const renderMediaElement = useCallback((clip, sourceUrl, extraClass = '') => {
    const grid = clip.gridConfig || { mode: 'single' };
    const resolvedUrl = resolveClipUrl(clip) || sourceUrl;
    const isVideo = isVideoSource(clip, resolvedUrl);

    // 클라이맥스 멀티 프레임 (CCTV식 4분할 대신 메인 1 + 서브 2 시네마틱 몽타주 레이아웃)
    if (grid.mode === 'matrix' && (grid.rows > 1 || grid.cols > 1)) {
      const cellMedia = grid.cellMedia || {};
      const urls = [
        cellMedia[0] || resolvedUrl,
        cellMedia[1] || resolvedUrl,
        cellMedia[2] || resolvedUrl
      ];

      return (
        <div className="w-full h-full flex flex-col gap-1.5 p-2 bg-[#020305]">
          {/* 상단 메인 프레임 */}
          <div className="flex-1 w-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
            {isVideoSource(clip, urls[0]) ? (
              <video src={urls[0]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={urls[0]} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>
          {/* 하단 2분할 서브 프레임 */}
          <div className="h-1/3 w-full flex gap-1.5">
            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
              {isVideoSource(clip, urls[1]) ? (
                <video src={urls[1]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={urls[1]} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
              {isVideoSource(clip, urls[2]) ? (
                <video src={urls[2]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={urls[2]} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        </div>
      );
    }

    if (isVideo) {
      const clipVolume = clip.volume ?? 100;
      const isMuted = clipVolume === 0;

      return (
        <video
          ref={el => {
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
          muted={isMuted}
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
  }, [resolveClipUrl, isVideoSource]);

  // 🌟 [핵심 개선 2 & 3] 13단계 워드아트 그림자 및 파란 박스 영구 퇴출
  const renderTextClip = (clip) => {
    const style = clip.style || {};
    const fontSize = style.fontSize || 20;
    const color = style.color || '#FFFFFF';
    const fontFamily = style.fontFamily || 'MaruBuri, sans-serif';
    const isBadgePreset = style.preset === 'sermon-badge';
    const isHeroTitle = clip.trackId === 'T2';

    // [A] T2 트랙: 인물 얼굴을 가리지 않는 상단 1/3 지점의 세련된 미니멀 타이틀
    if (isHeroTitle) {
      return (
        <div className="flex flex-col items-center justify-center text-center px-4 pointer-events-none select-none">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#00E5FF] uppercase font-bold mb-1 opacity-90 drop-shadow">
            PROLOGUE
          </span>
          <h2
            style={{
              fontFamily: fontFamily,
              fontSize: `${Math.min(24, fontSize)}px`,
              letterSpacing: '0.12em',
              lineHeight: 1.3,
              fontWeight: 900,
              color: '#FFFFFF',
              // 13단계 워드아트 그림자를 완전히 제거하고 깔끔한 필름 섀도우만 적용
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 229, 255, 0.35)'
            }}
            className="break-keep font-black"
          >
            {clip.content || 'THE MOMENT'}
          </h2>
          <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent mt-2 opacity-80 rounded-full" />
        </div>
      );
    }

    // [B] T1 트랙: 촌스러운 파란 플라스틱 박스 퇴출 ➔ 넷플릭스 숏폼 규격 반투명 딥 다크 스크림
    if (isBadgePreset) {
      return (
        <div 
          className="relative w-[88%] max-w-[340px] px-4.5 py-3.5 rounded-2xl pointer-events-none select-none transition-all duration-300"
          style={{
            // 답답한 파란색 대신 배경 영상을 온전히 살리는 딥 다크 아크릴 글래스
            background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.75) 0%, rgba(4, 6, 10, 0.88) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* 정제된 미니 뱃지 라벨 */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-pulse" />
            <span className="text-[#00E5FF] font-black text-[9.5px] tracking-widest font-mono">
              {style.badgeText || '말씀'}
            </span>
          </div>

          <p
            style={{
              fontFamily: fontFamily,
              fontSize: `${Math.min(18, fontSize)}px`,
              color: color,
              fontWeight: 700,
              lineHeight: 1.48,
              whiteSpace: 'pre-wrap',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)'
            }}
            className="break-keep text-left tracking-normal"
          >
            {clip.content || '여호와는 나의 목자시니 내게 부족함이 없으리로다'}
          </p>
        </div>
      );
    }

    // [C] 표준 자막
    return (
      <div className="px-4 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-center pointer-events-none select-none">
        <span
          style={{
            fontFamily: fontFamily,
            fontSize: `${fontSize}px`,
            color: color,
            fontWeight: 800,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.85)'
          }}
        >
          {clip.content || '자막'}
        </span>
      </div>
    );
  };

  const lastTapRef = useRef(0);
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
        {allAudioClips.map(clip => (
          <audio
            key={clip.id}
            ref={el => { if (el) audioRefs.current[clip.id] = el; }}
            src={resolveClipUrl(clip)}
            preload="auto"
          />
        ))}
      </div>

      {/* SVG 하드웨어 가속 필름 그레인 & 톤매핑 정의 */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="cinematic-film-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed={grainSeed} result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.14 0" in="noise" result="coloredNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="coloredNoise" />
        </filter>
      </svg>

      {/* 뷰포트 (9:16) */}
      <div 
        ref={viewportRef}
        onClick={(e) => { e.stopPropagation(); handleViewportDoubleTap(); }}
        style={{ isolation: 'isolate' }}
        className="relative z-0 h-full max-h-[660px] aspect-[9/16] bg-[#020305] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex items-center justify-center ring-1 ring-white/10 cursor-pointer"
        title="더블 탭 시 0초로 이동"
      >
        {!hasVisuals && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 pointer-events-none z-0">
            <span className="text-3xl font-mono font-black text-zinc-700 tracking-wider">1080×1920</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#00E5FF] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              NO SIGNAL • 9:16
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              미디어 풀에서 영상이나 사진을 등록해주세요
            </p>
          </div>
        )}

        {/* 스마트 센터 스냅 십자 가이드라인 */}
        {snapGuideX && (
          <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] pointer-events-none z-40" />
        )}
        {snapGuideY && (
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] pointer-events-none z-40" />
        )}

        {/* 모든 시각 에셋 렌더링 파이프라인 */}
        {allVisualClips
          .sort((a, b) => {
            const zMap = { V1: 10, V2: 20, V3: 30, V4: 40, T1: 50, T2: 60 };
            return (zMap[a.trackId] || 10) - (zMap[b.trackId] || 10);
          })
          .map(clip => {
            const start = clip.start || 0;
            const duration = clip.duration || 3.5;
            const inPoint = clip.inPoint || clip.mediaOffset || 0;
            const isActive = playhead >= (start - 0.001) && playhead < (start + duration);

            const tf = clip.transform || { x: 0, y: 0, scale: 100, rotate: 0, opacity: 100 };
            const crop = clip.crop || { left: 0, right: 0, top: 0, bottom: 0, softness: 0 };
            const fx = clip.fx || {};
            const color = clip.color || {};
            const timeFromStart = Math.max(0, playhead - start);
            const timeToEnd = Math.max(0, (start + duration) - playhead);
            const currentClipUrl = resolveClipUrl(clip);
            const isVideo = isVideoSource(clip, currentClipUrl);

            // 비디오 하드웨어 싱크
            if (isVideo && mediaRefs.current[clip.id]) {
              const vRef = mediaRefs.current[clip.id];
              const targetTime = Math.max(0, inPoint + (timeFromStart * (clip.speed || 1.0)));
              const clipVolume = clip.volume ?? 100;
              
              vRef.volume = Math.max(0, Math.min(1, clipVolume / 100));
              vRef.muted = clipVolume === 0;

              if (isActive) {
                if (isPlaying) {
                  if (vRef.paused) {
                    vRef.play().catch(() => {
                      vRef.muted = true;
                      vRef.play().catch(() => {});
                    });
                  }
                  if (Math.abs(vRef.currentTime - targetTime) > 0.25) {
                    vRef.currentTime = targetTime;
                  }
                } else {
                  if (!vRef.paused) vRef.pause();
                  if (Math.abs(vRef.currentTime - targetTime) > 0.04) {
                    vRef.currentTime = targetTime;
                  }
                }
              } else {
                if (!vRef.paused) vRef.pause();
              }
              vRef.playbackRate = clip.speed || 1.0;
            }

            // 트랜지션 연산
            let transTransform = '';
            let transOpacity = (clip.opacity ?? tf.opacity ?? 100) / 100;
            let transFilter = '';
            let transClipPath = '';
            const transDur = clip.transitionDuration || 0.4;

            if (isActive && clip.transition && clip.transition !== 'none' && timeToEnd <= transDur && timeToEnd >= 0) {
              const progress = 1 - (timeToEnd / transDur);
              const transEngine = TRANSITIONS[clip.transition] || TRANSITIONS.none;
              if (transEngine && typeof transEngine.compute === 'function') {
                const res = transEngine.compute(progress);
                transTransform = res.transform || '';
                if (res.opacity !== undefined) transOpacity = res.opacity;
                if (res.filter) transFilter = res.filter;
                if (res.clipPath) transClipPath = res.clipPath;
              }
            }

            // 인-모션 연산
            const motionTransform = typeof computeClipMotion === 'function'
              ? computeClipMotion(clip.animation, timeFromStart, duration)
              : '';

            const totalScale = (tf.scale || 100) / 100;
            const flipScaleX = tf.flipH ? -1 : 1;
            const flipScaleY = tf.flipV ? -1 : 1;
            const compTransform = `translate(${tf.x || 0}px, ${tf.y || 0}px) scale(${totalScale * flipScaleX}, ${totalScale * flipScaleY}) rotate(${tf.rotate || 0}deg) ${transTransform} ${motionTransform}`.trim();

            const nativeColorFilter = generateCSSNativeFilter(color);
            const lutObj = clip.filterPreset && FILTERS?.[clip.filterPreset];
            const lutFilter = lutObj ? lutObj.filter : '';
            const fxBlur = fx.blur ? `blur(${fx.blur}px)` : '';

            const compFilter = `${nativeColorFilter} ${lutFilter} ${fxBlur} ${transFilter}`.trim();
            const clipPathStyle = transClipPath || `inset(${crop.top}% ${crop.right}% ${crop.bottom}% ${crop.left}% round ${crop.softness || 0}px)`;
            const objectFitClass = clip.scaling === 'fit' ? 'object-contain' : 'object-cover';

            return (
              <div
                key={clip.id}
                onClick={(e) => { e.stopPropagation(); if (isActive) selectClip(clip.id); }}
                className={`absolute inset-0 flex items-center justify-center select-none ${
                  isActive ? 'cursor-pointer pointer-events-auto z-20' : 'pointer-events-none opacity-0 z-0'
                }`}
                style={{
                  transform: compTransform,
                  filter: clip.type === 'text' ? 'none' : compFilter,
                  clipPath: clip.type === 'text' ? 'none' : clipPathStyle,
                  opacity: isActive ? transOpacity : 0,
                  mixBlendMode: tf.blendMode || clip.blendMode || 'normal',
                  zIndex: clip.trackId === 'T2' ? 65 : clip.trackId === 'T1' ? 50 : clip.trackId === 'V4' ? 40 : clip.trackId === 'V3' ? 30 : clip.trackId === 'V2' ? 20 : 10
                }}
              >
                {/* 1. 비디오/이미지/자막 에셋 */}
                {clip.type === 'text' ? (
                  renderTextClip(clip)
                ) : (
                  renderMediaElement(clip, currentClipUrl, objectFitClass)
                )}

                {/* 2. 2.35:1 시네마 오프닝 레터박스 커튼 (0s~2s) */}
                {fx.letterbox && timeFromStart <= 2.0 && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between overflow-hidden">
                    <div 
                      className="w-full bg-black transition-all ease-out"
                      style={{
                        height: `${Math.max(0, (1 - timeFromStart / 2.0) * 12)}%`,
                        transitionDuration: '100ms'
                      }}
                    />
                    <div 
                      className="w-full bg-black transition-all ease-out"
                      style={{
                        height: `${Math.max(0, (1 - timeFromStart / 2.0) * 12)}%`,
                        transitionDuration: '100ms'
                      }}
                    />
                  </div>
                )}

                {/* 3. 35mm 필름 헐레이션 (고대비 경계면 소프트 글로우) */}
                {fx.halation && clip.type !== 'text' && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-24 mix-blend-screen opacity-40 overflow-hidden"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.45) 0%, rgba(245, 158, 11, 0.20) 45%, transparent 75%)',
                      filter: 'blur(22px)'
                    }}
                  />
                )}

                {/* 4. 부드러운 코너 라이트 리크 (가짜 1px 파란 막대기 제거 ➔ 유기적 35mm 빛 번짐) */}
                {timeFromStart <= 1.4 && clip.type !== 'text' && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-28 mix-blend-screen transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at 10% 10%, rgba(255, 185, 60, 0.45) 0%, rgba(255, 100, 40, 0.18) 35%, transparent 70%)',
                      opacity: Math.max(0, 1 - timeFromStart / 1.4),
                      filter: 'blur(18px)'
                    }}
                  />
                )}

                {/* 5. 은은한 필름 비네팅 */}
                {clip.type !== 'text' && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-22"
                    style={{
                      background: 'radial-gradient(circle, transparent 65%, rgba(0,0,0,0.6) 100%)'
                    }}
                  />
                )}
              </div>
            );
          })}

        {/* 선택 클립 기즈모 박스 */}
        {selectedClip && isSelectedClipActive && (selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div
            className="absolute inset-0 z-[70] pointer-events-none border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.6)]"
            style={{
              transform: `translate(${selectedClip.transform?.x || 0}px, ${selectedClip.transform?.y || 0}px) scale(${((selectedClip.transform?.scale || 100)) / 100}) rotate(${selectedClip.transform?.rotate || 0}deg)`
            }}
          >
            <div 
              onMouseDown={(e) => startGizmoAction(e, 'move')}
              onTouchStart={(e) => startGizmoAction(e, 'move')}
              className="absolute inset-4 cursor-move pointer-events-auto bg-[#00E5FF]/5 hover:bg-[#00E5FF]/15 active:bg-[#00E5FF]/20"
              title="드래그하여 위치 이동"
            />

            {gizmoAction && (
              <div className="absolute top-2 left-2 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded font-mono text-[9px] text-[#00E5FF] font-black border border-white/20 pointer-events-none shadow-lg">
                X: {selectedClip.transform?.x || 0}px • Y: {selectedClip.transform?.y || 0}px • {selectedClip.transform?.scale || 100}% • {selectedClip.transform?.rotate || 0}°
              </div>
            )}

            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
              <div
                key={pos}
                onMouseDown={(e) => startGizmoAction(e, 'scale', pos)}
                onTouchStart={(e) => startGizmoAction(e, 'scale', pos)}
                className={`absolute w-4.5 h-4.5 bg-white border-2 border-[#00E5FF] rounded-xs cursor-nwse-resize pointer-events-auto shadow-md active:scale-125 transition-transform ${
                  pos === 'top-left' ? '-top-2.5 -left-2.5' :
                  pos === 'top-right' ? '-top-2.5 -right-2.5' :
                  pos === 'bottom-left' ? '-bottom-2.5 -left-2.5' : '-bottom-2.5 -right-2.5'
                }`}
              />
            ))}

            <div className="absolute left-1/2 -top-11 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
              <div 
                onMouseDown={(e) => startGizmoAction(e, 'rotate')}
                onTouchStart={(e) => startGizmoAction(e, 'rotate')}
                className="w-5.5 h-5.5 rounded-full bg-[#00E5FF] border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing hover:scale-125 active:scale-125 transition-transform flex items-center justify-center text-[10px] text-black font-black"
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
// src/components/timeline/TimelineCore.js
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

const SvgEye = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SvgLock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const SvgVolumeMute = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export default function TimelineCore() {
  const {
    tracks, trackList, entities, playhead, zoomScale = 70, projectDuration = 10, isPlaying, selectedClipId,
    setPlayhead, setSelectedClipId, selectClip, moveAndTrimClip, isMagnetic = true, addTrack, updateClip,
    splitClip, deleteClip, setIsPlaying, setZoomScale, beatMarkers = []
  } = useNLEStore();

  const doSelectClip = selectClip || setSelectedClipId;

  const timelineRef = useRef(null);
  const trackContainerRef = useRef(null);
  const isDraggingPlayhead = useRef(false);
  const dragState = useRef(null);
  const rafRef = useRef(null); // 🌟 RAF 가속 락

  const [snapLineX, setSnapLineX] = useState(null);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);
  const [trackStates, setTrackStates] = useState({});
  const [trimDeltaBadge, setTrimDeltaBadge] = useState(null);

  // 트랙 목록 표준 정규화
  const normalizedTracks = useMemo(() => {
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    if (trackList && entities?.tracks) {
      return trackList.map(tId => entities.tracks[tId]).filter(Boolean);
    }
    return [
      { id: 'V2', name: 'V2', type: 'video', clips: [] },
      { id: 'V1', name: 'V1', type: 'video', clips: [] },
      { id: 'T1', name: 'T1', type: 'text', clips: [] },
      { id: 'A1', name: 'A1', type: 'audio', clips: [] },
      { id: 'A2', name: 'A2', type: 'audio', clips: [] }
    ];
  }, [tracks, trackList, entities?.tracks]);

  // 클립-트랙 드롭 가능 여부 검증
  const canDropInTrack = useCallback((clipType, targetTrackType) => {
    if (targetTrackType === 'video') return clipType === 'video' || clipType === 'image';
    if (targetTrackType === 'audio') return clipType === 'audio';
    if (targetTrackType === 'text') return clipType === 'text';
    return false;
  }, []);

  // 🌟 스냅 포인트 연산 (플레이헤드 변경 시 리렌더링 차단)
  const snapPoints = useMemo(() => {
    const points = [0];
    normalizedTracks.forEach(t => {
      const clipArray = t.clips || (t.clipIds?.map(id => entities?.clips?.[id]).filter(Boolean)) || [];
      clipArray.forEach(c => {
        points.push(c.start || 0);
        points.push(Number(((c.start || 0) + (c.duration || 0)).toFixed(3)));
      });
    });

    if (Array.isArray(beatMarkers)) {
      beatMarkers.forEach(bm => points.push(bm));
    }

    return Array.from(new Set(points.map(p => Number(p.toFixed(3))))).sort((a, b) => a - b);
  }, [normalizedTracks, entities?.clips, beatMarkers]);

  // 마그네틱 스냅 계산기
  const calculateSnap = useCallback((rawTime, excludeClipId = null) => {
    if (!isMagnetic) return { time: rawTime, snapped: false };
    const thresholdSec = 12 / (zoomScale || 70);
    const candidatePoints = [...snapPoints, playhead];

    for (const pt of candidatePoints) {
      if (Math.abs(rawTime - pt) <= thresholdSec) {
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
        return { time: pt, snapped: true };
      }
    }
    return { time: rawTime, snapped: false };
  }, [isMagnetic, zoomScale, snapPoints, playhead]);

  // 플레이헤드 위치 갱신
  const updatePlayhead = useCallback((clientX) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft || 0;
    const clickX = clientX - rect.left + scrollLeft;
    const targetSec = Math.max(0, clickX / (zoomScale || 70));
    setPlayhead(Number(targetSec.toFixed(2)));
  }, [setPlayhead, zoomScale]);

  // Y좌표 기반 트랙 감지
  const detectTrackByClientY = useCallback((clientY) => {
    if (!trackContainerRef.current) return null;
    const trackRows = trackContainerRef.current.querySelectorAll('[data-track-row-id]');
    for (const row of trackRows) {
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return row.getAttribute('data-track-row-id');
      }
    }
    return null;
  }, []);

  // 🌟 [핵심 개선: 데스크톱 Ctrl + 휠 타임라인 줌인/줌아웃 인터랙션]
  const handleWheelZoom = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const currentZoom = zoomScale || 70;
      const nextZoom = Math.max(25, Math.min(300, Math.round(currentZoom * zoomFactor)));
      if (typeof setZoomScale === 'function') {
        setZoomScale(nextZoom);
      }
    }
  }, [zoomScale, setZoomScale]);

  // 데스크톱 NLE 단축키 엔진
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'KeyB' || e.code === 'KeyS') {
        e.preventDefault();
        if (typeof splitClip === 'function') splitClip();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (selectedClipId && typeof deleteClip === 'function') {
          deleteClip(selectedClipId);
          if (doSelectClip) doSelectClip(null);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setPlayhead(Math.max(0, playhead - (1 / 30)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setPlayhead(Math.min(projectDuration, playhead + (1 / 30)));
      } else if (e.code === 'Home') {
        e.preventDefault();
        setPlayhead(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClipId, playhead, projectDuration, setIsPlaying, splitClip, deleteClip, setPlayhead, doSelectClip]);

  // 재생 중 플레이헤드 자동 스크롤 추적
  useEffect(() => {
    if (!isPlaying || !timelineRef.current || isDraggingPlayhead.current) return;
    const scrollLeft = timelineRef.current.scrollLeft;
    const clientWidth = timelineRef.current.clientWidth;
    const playheadPx = playhead * (zoomScale || 70);

    if (playheadPx > scrollLeft + clientWidth - 100) {
      timelineRef.current.scrollLeft = playheadPx - 80;
    } else if (playheadPx < scrollLeft) {
      timelineRef.current.scrollLeft = Math.max(0, playheadPx - 40);
    }
  }, [playhead, isPlaying, zoomScale]);

  // 🌟 [핵심 개선: RAF 기반 60FPS 하드웨어 가속 드래그 & 트리밍 엔진]
  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      if (isDraggingPlayhead.current) {
        updatePlayhead(clientX);
      } else if (dragState.current) {
        if (rafRef.current) return; // 프레임 스킵 락

        rafRef.current = requestAnimationFrame(() => {
          if (!dragState.current) {
            rafRef.current = null;
            return;
          }

          const { mode, clipId, clipType, startX, origStart, origDuration, origInPoint } = dragState.current;
          const deltaX = clientX - startX;
          const deltaTime = deltaX / (zoomScale || 70);

          // [A] 클립 위치 이동
          if (mode === 'move') {
            const rawStart = Math.max(0, origStart + deltaTime);
            const snap = calculateSnap(rawStart, clipId);

            const detectedTrackId = detectTrackByClientY(clientY);
            let targetTrackId = dragState.current.currentTrackId;

            if (detectedTrackId && detectedTrackId !== dragState.current.currentTrackId) {
              const targetTrack = normalizedTracks.find(t => t.id === detectedTrackId);
              if (targetTrack && canDropInTrack(clipType, targetTrack.type)) {
                targetTrackId = detectedTrackId;
                dragState.current.currentTrackId = detectedTrackId;
                setHoveredTrackId(detectedTrackId);
              }
            }

            setSnapLineX(snap.snapped ? snap.time * (zoomScale || 70) : null);

            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, targetTrackId, snap.time, origDuration);
            }
          } 
          // [B] 클립 좌측 인포인트 트리밍
          else if (mode === 'trim-left') {
            const rawStart = Math.max(0, origStart + deltaTime);
            const snap = calculateSnap(rawStart, clipId);
            const actualDelta = snap.time - origStart;
            const newDur = Math.max(0.3, origDuration - actualDelta);
            const nextInPoint = Math.max(0, (origInPoint || 0) + actualDelta);

            setSnapLineX(snap.snapped ? snap.time * (zoomScale || 70) : null);
            setTrimDeltaBadge({ delta: actualDelta, time: snap.time });

            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, dragState.current.startTrackId, snap.time, newDur);
            }
            if (typeof updateClip === 'function') {
              updateClip(clipId, { inPoint: nextInPoint, mediaOffset: nextInPoint });
            }
          } 
          // [C] 클립 우측 아웃포인트 트리밍
          else if (mode === 'trim-right') {
            const rawEnd = origStart + origDuration + deltaTime;
            const snap = calculateSnap(rawEnd, clipId);
            const newDur = Math.max(0.3, snap.time - origStart);
            const actualDelta = newDur - origDuration;

            setSnapLineX(snap.snapped ? snap.time * (zoomScale || 70) : null);
            setTrimDeltaBadge({ delta: actualDelta, time: snap.time });

            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, dragState.current.startTrackId, origStart, newDur);
            }
          }

          rafRef.current = null;
        });
      }
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      isDraggingPlayhead.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (dragState.current) {
        const storeState = useNLEStore.getState();
        const { clipId, currentTrackId } = dragState.current;
        
        if (typeof updateClip === 'function') {
          updateClip(clipId, { trackId: currentTrackId });
        }

        if (typeof storeState.recalculateDuration === 'function') {
          storeState.recalculateDuration();
        }
        dragState.current = null;
        setSnapLineX(null);
        setHoveredTrackId(null);
        setTrimDeltaBadge(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [zoomScale, normalizedTracks, moveAndTrimClip, updatePlayhead, calculateSnap, detectTrackByClientY, canDropInTrack, updateClip]);

  // 스마트 더킹 감지 음성 구간
  const speechIntervals = useMemo(() => {
    const list = [];
    normalizedTracks.forEach(t => {
      if (t.id.startsWith('V') || t.id === 'A1') {
        const clipArray = t.clips || (t.clipIds?.map(id => entities?.clips?.[id]).filter(Boolean)) || [];
        clipArray.forEach(c => {
          if (c.duration > 0) list.push({ start: c.start || 0, end: (c.start || 0) + (c.duration || 0) });
        });
      }
    });
    return list;
  }, [normalizedTracks, entities?.clips]);

  const totalPixelWidth = Math.max(1400, (projectDuration + 8) * (zoomScale || 70));
  const totalSeconds = Math.ceil(totalPixelWidth / (zoomScale || 70));
  const tickArray = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0A0B0E] relative border-t border-[#1C202B] select-none text-zinc-300 font-sans">
      
      {/* [1] 좌측 트랙 인덱스 헤더 (뮤트 Mute 토글 추가) */}
      <div className="w-24 md:w-28 bg-[#0D0E13] border-r border-[#1C202B] flex flex-col shrink-0 z-20 shadow-md">
        <div className="h-7 border-b border-[#1C202B] bg-[#090A0D] flex items-center justify-between px-2">
          <span className="font-mono text-[9.5px] font-black text-zinc-400">TRACKS</span>
          <div className="flex gap-1">
            <button onClick={() => addTrack && addTrack('video')} className="px-1.5 py-0.2 bg-sky-950 hover:bg-sky-900 border border-sky-600 text-sky-300 rounded text-[9px] font-black cursor-pointer">+V</button>
            <button onClick={() => addTrack && addTrack('text')} className="px-1.5 py-0.2 bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded text-[9px] font-black cursor-pointer">+T</button>
            <button onClick={() => addTrack && addTrack('audio')} className="px-1.5 py-0.2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded text-[9px] font-black cursor-pointer">+A</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {normalizedTracks.map(t => {
            const isHovered = hoveredTrackId === t.id;
            const isVideo = t.type === 'video' || t.id.startsWith('V');
            const isText = t.type === 'text' || t.id.startsWith('T');
            const isAudio = t.type === 'audio' || t.id.startsWith('A');
            const state = trackStates[t.id] || {};

            return (
              <div 
                key={t.id} 
                className={`h-11 border-b border-[#181B24] px-2 flex items-center justify-between transition-colors ${
                  isHovered ? 'bg-[#182330] border-[#00E5FF]' : 'bg-[#0E1016]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isVideo ? 'bg-sky-400' : isText ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="font-mono text-xs font-black text-white">{t.name || t.id}</span>
                </div>

                <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                  {/* 오디오 트랙 전용 뮤트(M) 버튼 */}
                  {isAudio && (
                    <button
                      onClick={() => setTrackStates(p => ({ ...p, [t.id]: { ...p[t.id], muted: !p[t.id]?.muted } }))}
                      className={`p-1 rounded cursor-pointer ${state.muted ? 'text-rose-400 bg-rose-950/50' : 'hover:text-zinc-300'}`}
                      title={state.muted ? '음소거 해제' : '트랙 음소거 (Mute)'}
                    >
                      <SvgVolumeMute />
                    </button>
                  )}
                  <button 
                    onClick={() => setTrackStates(p => ({ ...p, [t.id]: { ...p[t.id], locked: !p[t.id]?.locked } }))} 
                    className={`p-1 rounded cursor-pointer ${state.locked ? 'text-amber-400 bg-amber-950/40' : 'hover:text-zinc-300'}`}
                    title={state.locked ? '트랙 잠금 해제' : '트랙 잠금'}
                  >
                    <SvgLock />
                  </button>
                  <button 
                    onClick={() => setTrackStates(p => ({ ...p, [t.id]: { ...p[t.id], hidden: !p[t.id]?.hidden } }))} 
                    className={`p-1 rounded cursor-pointer ${state.hidden ? 'text-rose-400 bg-rose-950/40' : 'hover:text-zinc-300'}`}
                    title={state.hidden ? '트랙 보이기' : '트랙 숨기기'}
                  >
                    <SvgEye />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* [2] 우측 캔버스 (타임라인 눈금자 & 휠 줌 인터랙션) */}
      <div 
        ref={timelineRef} 
        onWheel={handleWheelZoom}
        onMouseDown={(e) => {
          if (!dragState.current) {
            isDraggingPlayhead.current = true;
            updatePlayhead(e.clientX);
            if (doSelectClip) doSelectClip(null);
          }
        }}
        onTouchStart={(e) => {
          if (!dragState.current && e.touches && e.touches[0]) {
            isDraggingPlayhead.current = true;
            updatePlayhead(e.touches[0].clientX);
            if (doSelectClip) doSelectClip(null);
          }
        }}
        className="flex-1 bg-[#060709] relative overflow-x-auto overflow-y-auto cursor-text gtc-scroll"
      >
        {/* 상단 타임 룰러 & 비트 닷(Beat Dots) 오버레이 */}
        <div 
          onMouseDown={(e) => {
            e.stopPropagation();
            isDraggingPlayhead.current = true;
            updatePlayhead(e.clientX);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.touches && e.touches[0]) {
              isDraggingPlayhead.current = true;
              updatePlayhead(e.touches[0].clientX);
            }
          }}
          className="h-7 relative flex items-end text-[9px] font-mono text-zinc-400 font-bold bg-[#0D0E13] border-b border-[#1C202B] sticky top-0 z-20 cursor-ew-resize select-none pointer-events-auto"
          style={{ width: `${totalPixelWidth}px` }}
        >
          {tickArray.map(i => (
            <div key={i} className="absolute bottom-0 border-l border-zinc-700 h-2.5 pl-1 pb-0.5 pointer-events-none" style={{ left: `${i * (zoomScale || 70)}px` }}>
              {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}
            </div>
          ))}

          {Array.isArray(beatMarkers) && beatMarkers.map((bm, bIdx) => (
            <div
              key={bIdx}
              className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] -translate-x-1/2 pointer-events-none"
              style={{ left: `${bm * (zoomScale || 70)}px` }}
              title={`비트 포인트: ${bm}s`}
            />
          ))}
        </div>

        {/* 재생헤드 실시간 수직선 */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-[#00E5FF] z-30 pointer-events-none shadow-[0_0_8px_#00E5FF]" 
          style={{ left: `${playhead * (zoomScale || 70)}px` }}
        >
          <div className="w-3 h-3 bg-[#00E5FF] absolute -top-1 -left-[5px] rotate-45 shadow-md" />
        </div>

        {/* 마그네틱 스냅 가이드라인 */}
        {snapLineX !== null && (
          <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#00E5FF] z-25 pointer-events-none shadow-[0_0_8px_#00E5FF]" style={{ left: `${snapLineX}px` }} />
        )}

        {/* 트리밍 시간 델타 뱃지 */}
        {trimDeltaBadge && (
          <div 
            className="absolute top-8 z-40 bg-black/90 border border-[#00E5FF] text-[#00E5FF] px-2 py-0.5 rounded font-mono text-[9px] font-black shadow-lg pointer-events-none -translate-x-1/2"
            style={{ left: `${trimDeltaBadge.time * (zoomScale || 70)}px` }}
          >
            {trimDeltaBadge.delta > 0 ? `+${trimDeltaBadge.delta.toFixed(2)}s` : `${trimDeltaBadge.delta.toFixed(2)}s`}
          </div>
        )}

        {/* [3] 트랙 컨테이너 및 클립 렌더링 */}
        <div ref={trackContainerRef} className="relative pt-1 flex flex-col" style={{ width: `${totalPixelWidth}px` }}>
          {normalizedTracks.map(t => {
            const clipList = t.clips || (t.clipIds?.map(id => entities?.clips?.[id]).filter(Boolean)) || [];
            const isHovered = hoveredTrackId === t.id;
            const isLocked = trackStates[t.id]?.locked;

            return (
              <div 
                key={t.id} 
                data-track-row-id={t.id}
                className={`h-11 border-b border-[#14161F] relative flex items-center transition-colors ${
                  isLocked ? 'opacity-40 pointer-events-none' : ''
                } ${
                  isHovered ? 'bg-[#152433] ring-1 ring-[#00E5FF] ring-inset' : 'bg-[#090A0E] hover:bg-[#0D0F14]'
                }`}
              >
                {clipList.map(clip => {
                  const isSelected = selectedClipId === clip.id;
                  const isAudio = clip.type === 'audio';
                  const isText = clip.type === 'text';

                  let bgStyle = 'bg-[#0B253A] border-[#0284C7] text-sky-100';
                  if (isAudio) bgStyle = 'bg-[#062D23] border-[#059669] text-emerald-100';
                  if (isText) bgStyle = 'bg-[#38200B] border-[#D97706] text-amber-100';

                  const isDucked = isAudio && (t.id === 'A2' || clip.trackId === 'A2') && speechIntervals.some(
                    s => ((clip.start || 0) < s.end && ((clip.start || 0) + (clip.duration || 0)) > s.start)
                  );

                  return (
                    <div
                      key={clip.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (isLocked) return;
                        if (doSelectClip) doSelectClip(clip.id);
                        dragState.current = {
                          mode: 'move', clipId: clip.id, clipType: clip.type, startTrackId: t.id,
                          currentTrackId: t.id, origStart: clip.start || 0, origDuration: clip.duration || 3.5,
                          origInPoint: clip.inPoint || clip.mediaOffset || 0,
                          startX: e.clientX
                        };
                        setHoveredTrackId(t.id);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (isLocked || !e.touches || !e.touches[0]) return;
                        if (doSelectClip) doSelectClip(clip.id);
                        dragState.current = {
                          mode: 'move', clipId: clip.id, clipType: clip.type, startTrackId: t.id,
                          currentTrackId: t.id, origStart: clip.start || 0, origDuration: clip.duration || 3.5,
                          origInPoint: clip.inPoint || clip.mediaOffset || 0,
                          startX: e.touches[0].clientX
                        };
                        setHoveredTrackId(t.id);
                      }}
                      className={`absolute top-[3px] bottom-[3px] rounded-md border flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing overflow-hidden shadow-md select-none group transition-all ${bgStyle} ${
                        isSelected ? 'ring-2 ring-white border-white brightness-125 z-20 shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'hover:brightness-110 opacity-95'
                      }`}
                      style={{ 
                        left: `${(clip.start || 0) * (zoomScale || 70)}px`, 
                        width: `${Math.max(26, (clip.duration || 3.5) * (zoomScale || 70))}px` 
                      }}
                    >
                      {/* 좌측 트리밍 핸들 */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (isLocked) return;
                          if (doSelectClip) doSelectClip(clip.id);
                          dragState.current = { 
                            mode: 'trim-left', clipId: clip.id, clipType: clip.type, startTrackId: t.id, 
                            currentTrackId: t.id, origStart: clip.start || 0, origDuration: clip.duration || 3.5, 
                            origInPoint: clip.inPoint || clip.mediaOffset || 0,
                            startX: e.clientX 
                          };
                        }}
                        className="w-3 h-full -ml-1.5 hover:bg-white/50 cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="좌측 길이 조절"
                      />

                      {/* 이미지/비디오 썸네일 포스터 */}
                      {(clip.type === 'image' || clip.type === 'video') && clip.url && (
                        <img src={clip.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
                      )}
                      
                      {/* 🌟 [핵심 개선: 초경량 SVG 벡터 오디오 파형 (Fairlight DSP Waveform)] */}
                      {isAudio && (
                        <div className="absolute inset-0 opacity-40 flex items-center pointer-events-none overflow-hidden px-1">
                          <svg className="w-full h-4/5 text-emerald-400" preserveAspectRatio="none" viewBox="0 0 100 24">
                            <path
                              d="M0 12 Q 10 2, 20 12 T 40 12 T 60 12 T 80 12 T 100 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M0 12 Q 15 20, 30 12 T 60 12 T 90 12 T 100 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeOpacity="0.6"
                            />
                          </svg>
                        </div>
                      )}

                      {/* 스마트 더킹 감쇄 라벨 */}
                      {isDucked && (
                        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-emerald-950/90 border-t border-dashed border-emerald-400 flex items-center justify-center pointer-events-none z-10">
                          <span className="text-[7.5px] font-mono text-emerald-300 font-black tracking-tighter">-18dB DUCKED</span>
                        </div>
                      )}

                      {/* 클립 명칭 */}
                      <span className="text-[10px] font-bold truncate leading-none z-10 pointer-events-none drop-shadow-md">
                        {clip.name || clip.content || t.name}
                      </span>

                      {/* 클립 재생 시간 */}
                      <span className="text-[9px] font-mono font-bold text-zinc-300/80 pointer-events-none pl-1 shrink-0 z-10">
                        {clip.duration?.toFixed(1)}s
                      </span>

                      {/* 우측 트리밍 핸들 */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (isLocked) return;
                          if (doSelectClip) doSelectClip(clip.id);
                          dragState.current = { 
                            mode: 'trim-right', clipId: clip.id, clipType: clip.type, startTrackId: t.id, 
                            currentTrackId: t.id, origStart: clip.start || 0, origDuration: clip.duration || 3.5, 
                            origInPoint: clip.inPoint || clip.mediaOffset || 0,
                            startX: e.clientX 
                          };
                        }}
                        className="w-3 h-full -mr-1.5 hover:bg-white/50 cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="우측 길이 조절"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
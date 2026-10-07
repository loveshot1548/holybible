// src/components/timeline/TimelineVirtualizer.js
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

const SvgZoomIn = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

const SvgZoomOut = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM7.5 10.5h6" />
  </svg>
);

export default function TimelineVirtualizer() {
  const {
    tracks, trackList, entities, playhead, projectDuration = 30, selectedClipId,
    selectClip, setSelectedClipId, isMagnetic = true, addTrack, updateClip,
    moveAndTrimClip, splitClip, deleteClip, setPlayhead, isPlaying, setIsPlaying,
    zoomScale = 70, setZoomScale, beatMarkers = []
  } = useNLEStore();

  const timelineRef = useRef(null);
  const trackContainerRef = useRef(null);
  const isDraggingPlayhead = useRef(false);
  const dragState = useRef(null);
  const rafRef = useRef(null);

  const [timelineZoom, setTimelineZoom] = useState(zoomScale || 70);
  const [snapLineX, setSnapLineX] = useState(null);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);
  const [trackStates, setTrackStates] = useState({});
  const [trimBadge, setTrimBadge] = useState(null);

  useEffect(() => {
    if (zoomScale && zoomScale !== timelineZoom) {
      setTimelineZoom(zoomScale);
    }
  }, [zoomScale]);

  const commitSelectClip = useCallback((id) => {
    if (typeof selectClip === 'function') {
      selectClip(id);
    } else if (typeof setSelectedClipId === 'function') {
      setSelectedClipId(id);
    }
  }, [selectClip, setSelectedClipId]);

  const normalizedTracks = useMemo(() => {
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    if (trackList && entities?.tracks) {
      return trackList.map(tId => entities.tracks[tId]).filter(Boolean);
    }
    return [
      { id: 'V4', name: 'V4', type: 'video', clipIds: [] },
      { id: 'V3', name: 'V3', type: 'video', clipIds: [] },
      { id: 'V2', name: 'V2', type: 'video', clipIds: [] },
      { id: 'V1', name: 'V1', type: 'video', clipIds: [] },
      { id: 'T2', name: 'T2', type: 'text', clipIds: [] },
      { id: 'T1', name: 'T1', type: 'text', clipIds: [] },
      { id: 'A1', name: 'A1', type: 'audio', clipIds: [] },
      { id: 'A2', name: 'A2', type: 'audio', clipIds: [] },
      { id: 'A3', name: 'A3', type: 'audio', clipIds: [] }
    ];
  }, [tracks, trackList, entities?.tracks]);

  const canDropInTrack = useCallback((clipType, targetTrackType) => {
    if (targetTrackType === 'video') return clipType === 'video' || clipType === 'image';
    if (targetTrackType === 'audio') return clipType === 'audio';
    if (targetTrackType === 'text') return clipType === 'text';
    return false;
  }, []);

  const snapPoints = useMemo(() => {
    const points = [0];
    if (Array.isArray(beatMarkers)) {
      beatMarkers.forEach(bm => points.push(bm));
    }
    normalizedTracks.forEach(t => {
      const clipArray = t.clips || (t.clipIds?.map(id => entities?.clips?.[id]).filter(Boolean)) || [];
      clipArray.forEach(c => {
        points.push(c.start || 0);
        points.push(Number(((c.start || 0) + (c.duration || 0)).toFixed(3)));
      });
    });
    return Array.from(new Set(points.map(p => Number(p.toFixed(3))))).sort((a, b) => a - b);
  }, [normalizedTracks, entities?.clips, beatMarkers]);

  const calculateSnap = useCallback((rawTime) => {
    if (!isMagnetic) return { time: rawTime, snapped: false };
    const thresholdSec = 12 / timelineZoom;
    const candidates = [...snapPoints, playhead];
    for (const pt of candidates) {
      if (Math.abs(rawTime - pt) <= thresholdSec) {
        if (typeof window !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(10); } catch (_) {}
        }
        return { time: pt, snapped: true };
      }
    }
    return { time: rawTime, snapped: false };
  }, [isMagnetic, timelineZoom, snapPoints, playhead]);

  const updatePlayheadFromClientX = useCallback((clientX) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft || 0;
    const clickX = clientX - rect.left + scrollLeft;
    const targetTime = Math.max(0, clickX / timelineZoom);
    setPlayhead(Number(targetTime.toFixed(2)));
  }, [setPlayhead, timelineZoom]);

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
          commitSelectClip(null);
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
  }, [isPlaying, selectedClipId, playhead, projectDuration, setIsPlaying, splitClip, deleteClip, setPlayhead, commitSelectClip]);

  useEffect(() => {
    if (!isPlaying || !timelineRef.current || isDraggingPlayhead.current) return;
    const scrollLeft = timelineRef.current.scrollLeft;
    const clientWidth = timelineRef.current.clientWidth;
    const playheadPx = playhead * timelineZoom;

    if (playheadPx > scrollLeft + clientWidth - 90) {
      timelineRef.current.scrollLeft = playheadPx - 70;
    } else if (playheadPx < scrollLeft) {
      timelineRef.current.scrollLeft = Math.max(0, playheadPx - 30);
    }
  }, [playhead, isPlaying, timelineZoom]);

  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      if (isDraggingPlayhead.current) {
        updatePlayheadFromClientX(clientX);
      } else if (dragState.current) {
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
          if (!dragState.current) {
            rafRef.current = null;
            return;
          }

          const { mode, clipId, clipType, startX, origStart, origDuration, origInPoint } = dragState.current;
          const deltaX = clientX - startX;
          const deltaTime = deltaX / timelineZoom;

          if (mode === 'move') {
            const rawStart = Math.max(0, origStart + deltaTime);
            const snap = calculateSnap(rawStart);
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

            setSnapLineX(snap.snapped ? snap.time * timelineZoom : null);
            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, targetTrackId, snap.time, origDuration);
            } else if (typeof updateClip === 'function') {
              updateClip(clipId, { start: snap.time, trackId: targetTrackId });
            }
          } else if (mode === 'trim-left') {
            const rawStart = Math.max(0, origStart + deltaTime);
            const snap = calculateSnap(rawStart);
            const actualDelta = snap.time - origStart;
            const newDur = Math.max(0.3, origDuration - actualDelta);
            const nextInPoint = Math.max(0, (origInPoint || 0) + actualDelta);

            setSnapLineX(snap.snapped ? snap.time * timelineZoom : null);
            setTrimBadge({ delta: actualDelta, time: snap.time });

            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, dragState.current.startTrackId, snap.time, newDur);
            } else if (typeof updateClip === 'function') {
              updateClip(clipId, { start: snap.time, duration: newDur, inPoint: nextInPoint, mediaOffset: nextInPoint });
            }
          } else if (mode === 'trim-right') {
            const rawEnd = origStart + origDuration + deltaTime;
            const snap = calculateSnap(rawEnd);
            const newDur = Math.max(0.3, snap.time - origStart);
            const actualDelta = newDur - origDuration;

            setSnapLineX(snap.snapped ? snap.time * timelineZoom : null);
            setTrimBadge({ delta: actualDelta, time: snap.time });

            if (typeof moveAndTrimClip === 'function') {
              moveAndTrimClip(clipId, dragState.current.startTrackId, origStart, newDur);
            } else if (typeof updateClip === 'function') {
              updateClip(clipId, { duration: newDur });
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
        const { clipId, currentTrackId, startTrackId } = dragState.current;
        
        if (currentTrackId !== startTrackId) {
          const tracksMap = { ...storeState.entities.tracks };
          if (tracksMap[startTrackId]?.clipIds) {
            tracksMap[startTrackId] = {
              ...tracksMap[startTrackId],
              clipIds: tracksMap[startTrackId].clipIds.filter(id => id !== clipId)
            };
          }
          if (!tracksMap[currentTrackId]) {
            const isAudio = currentTrackId.startsWith('A');
            const isText = currentTrackId.startsWith('T');
            tracksMap[currentTrackId] = {
              id: currentTrackId,
              name: currentTrackId,
              type: isAudio ? 'audio' : isText ? 'text' : 'video',
              clipIds: []
            };
          }
          tracksMap[currentTrackId] = {
            ...tracksMap[currentTrackId],
            clipIds: [...(tracksMap[currentTrackId].clipIds || []).filter(id => id !== clipId), clipId]
          };
          useNLEStore.setState({ entities: { ...storeState.entities, tracks: tracksMap } });
        }

        if (typeof updateClip === 'function') {
          updateClip(clipId, { trackId: currentTrackId });
        }
        if (typeof storeState.recalculateDuration === 'function') {
          storeState.recalculateDuration();
        }

        dragState.current = null;
        setSnapLineX(null);
        setHoveredTrackId(null);
        setTrimBadge(null);
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
  }, [timelineZoom, normalizedTracks, updatePlayheadFromClientX, calculateSnap, detectTrackByClientY, canDropInTrack, updateClip, moveAndTrimClip]);

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

  const totalPixelWidth = Math.max(1400, (projectDuration + 8) * timelineZoom);
  const totalSeconds = Math.ceil(totalPixelWidth / timelineZoom);
  const tickArray = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  const handleTimelineWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 15 : -15;
      const nextZoom = Math.max(30, Math.min(220, timelineZoom + delta));
      setTimelineZoom(nextZoom);
      if (typeof setZoomScale === 'function') {
        setZoomScale(nextZoom);
      }
    }
  }, [timelineZoom, setZoomScale]);

  const handleManualZoomChange = useCallback((newZoom) => {
    const clamped = Math.max(30, Math.min(220, newZoom));
    setTimelineZoom(clamped);
    if (typeof setZoomScale === 'function') {
      setZoomScale(clamped);
    }
  }, [setZoomScale]);

  return (
    <div 
      onWheel={handleTimelineWheel}
      className="flex-1 flex overflow-hidden bg-[#0A0B0E] relative border-t border-[#1C202B] select-none text-zinc-300 font-sans"
    >
      {/* [1] 좌측 트랙 인덱스 헤더 */}
      <div className="w-24 md:w-28 bg-[#0D0E13] border-r border-[#1C202B] flex flex-col shrink-0 z-20 shadow-md">
        <div className="h-7 border-b border-[#1C202B] bg-[#090A0D] flex items-center justify-between px-2">
          <span className="font-mono text-[9px] font-black text-zinc-400">TRACKS</span>
          <div className="flex gap-1">
            <button onClick={() => addTrack && addTrack('video')} className="px-1.5 py-0.2 bg-sky-950 hover:bg-sky-900 border border-sky-600 text-sky-300 rounded text-[8.5px] font-black cursor-pointer">+V</button>
            <button onClick={() => addTrack && addTrack('text')} className="px-1.5 py-0.2 bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded text-[8.5px] font-black cursor-pointer">+T</button>
            <button onClick={() => addTrack && addTrack('audio')} className="px-1.5 py-0.2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded text-[8.5px] font-black cursor-pointer">+A</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
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
                  {isAudio && (
                    <button
                      onClick={() => setTrackStates(prev => ({ ...prev, [t.id]: { ...prev[t.id], muted: !prev[t.id]?.muted } }))}
                      className={`p-1 rounded cursor-pointer ${state.muted ? 'text-rose-400 bg-rose-950/50' : 'hover:text-zinc-300'}`}
                      title={state.muted ? '음소거 해제' : '트랙 음소거'}
                    >
                      <SvgVolumeMute />
                    </button>
                  )}
                  <button 
                    onClick={() => setTrackStates(prev => ({ ...prev, [t.id]: { ...prev[t.id], locked: !prev[t.id]?.locked } }))}
                    className={`p-1 rounded cursor-pointer ${state.locked ? 'text-amber-400 bg-amber-950/40' : 'hover:text-zinc-300'}`}
                    title="트랙 잠금"
                  >
                    <SvgLock />
                  </button>
                  <button 
                    onClick={() => setTrackStates(prev => ({ ...prev, [t.id]: { ...prev[t.id], hidden: !prev[t.id]?.hidden } }))}
                    className={`p-1 rounded cursor-pointer ${state.hidden ? 'text-rose-400 bg-rose-950/40' : 'hover:text-zinc-300'}`}
                    title="트랙 표시/숨김"
                  >
                    <SvgEye />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* [2] 우측 캔버스 (타임 룰러 & 클립 렌더링 영역) */}
      <div 
        ref={timelineRef} 
        onMouseDown={(e) => {
          if (!dragState.current) {
            isDraggingPlayhead.current = true;
            updatePlayheadFromClientX(e.clientX);
            commitSelectClip(null);
          }
        }}
        onTouchStart={(e) => {
          if (!dragState.current && e.touches && e.touches[0]) {
            isDraggingPlayhead.current = true;
            updatePlayheadFromClientX(e.touches[0].clientX);
            commitSelectClip(null);
          }
        }}
        className="flex-1 bg-[#060709] relative overflow-x-auto overflow-y-auto cursor-text hide-scrollbar"
      >
        <div 
          onMouseDown={(e) => {
            e.stopPropagation();
            isDraggingPlayhead.current = true;
            updatePlayheadFromClientX(e.clientX);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.touches && e.touches[0]) {
              isDraggingPlayhead.current = true;
              updatePlayheadFromClientX(e.touches[0].clientX);
            }
          }}
          className="h-7 relative flex items-end text-[9px] font-mono text-zinc-400 font-bold bg-[#0D0E13] border-b border-[#1C202B] sticky top-0 z-20 cursor-ew-resize select-none pointer-events-auto"
          style={{ width: `${totalPixelWidth}px` }}
        >
          {tickArray.map(i => (
            <div 
              key={i} 
              className="absolute bottom-0 border-l border-zinc-700 h-2.5 pl-1 pb-0.5 pointer-events-none" 
              style={{ left: `${i * timelineZoom}px` }}
            >
              {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}
            </div>
          ))}

          {Array.isArray(beatMarkers) && beatMarkers.map((bmTime, idx) => (
            <div
              key={`bm_${idx}`}
              className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20"
              style={{ left: `${bmTime * timelineZoom}px` }}
              title={`비트 포인트: ${bmTime}s`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B] border border-amber-200" />
            </div>
          ))}
        </div>

        <div 
          className="absolute top-0 bottom-0 left-0 w-[2px] bg-[#00E5FF] z-30 pointer-events-none shadow-[0_0_8px_#00E5FF] will-change-transform" 
          style={{ 
            transform: `translate3d(${playhead * timelineZoom}px, 0, 0)`,
            height: '100%',
            minHeight: '100%'
          }}
        >
          <div className="w-3 h-3 bg-[#00E5FF] absolute -top-1 -left-[5px] rotate-45 shadow-md" />
        </div>

        {snapLineX !== null && (
          <div 
            className="absolute top-0 bottom-0 w-[1.5px] bg-[#00E5FF] z-25 pointer-events-none shadow-[0_0_8px_#00E5FF]" 
            style={{ left: `${snapLineX}px`, height: '100%' }} 
          />
        )}

        {trimBadge && (
          <div 
            className="absolute top-8 z-40 bg-black/90 border border-[#00E5FF] text-[#00E5FF] px-2 py-0.5 rounded font-mono text-[9px] font-black shadow-lg pointer-events-none -translate-x-1/2"
            style={{ left: `${trimBadge.time * timelineZoom}px` }}
          >
            {trimBadge.delta > 0 ? `+${trimBadge.delta.toFixed(2)}s` : `${trimBadge.delta.toFixed(2)}s`}
          </div>
        )}

        <div 
          ref={trackContainerRef}
          className="relative pt-1 flex flex-col min-h-full" 
          style={{ width: `${totalPixelWidth}px` }}
        >
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
                        commitSelectClip(clip.id);
                        dragState.current = {
                          mode: 'move',
                          clipId: clip.id,
                          clipType: clip.type,
                          startTrackId: t.id,
                          currentTrackId: t.id,
                          origStart: clip.start || 0,
                          origDuration: clip.duration || 3.5,
                          origInPoint: clip.inPoint || clip.mediaOffset || 0,
                          startX: e.clientX
                        };
                        setHoveredTrackId(t.id);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (isLocked || !e.touches || !e.touches[0]) return;
                        commitSelectClip(clip.id);
                        dragState.current = {
                          mode: 'move',
                          clipId: clip.id,
                          clipType: clip.type,
                          startTrackId: t.id,
                          currentTrackId: t.id,
                          origStart: clip.start || 0,
                          origDuration: clip.duration || 3.5,
                          origInPoint: clip.inPoint || clip.mediaOffset || 0,
                          startX: e.touches[0].clientX
                        };
                        setHoveredTrackId(t.id);
                      }}
                      className={`absolute top-[3px] bottom-[3px] rounded-lg border flex items-center justify-between px-2 cursor-grab active:cursor-grabbing overflow-hidden shadow-md select-none group transition-all ${bgStyle} ${
                        isSelected ? 'ring-2 ring-white border-white brightness-125 z-20 shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'hover:brightness-110 opacity-95'
                      }`}
                      style={{
                        left: `${(clip.start || 0) * timelineZoom}px`,
                        width: `${Math.max(28, (clip.duration || 3.5) * timelineZoom)}px`
                      }}
                    >
                      {/* 좌측 트리밍 핸들러 */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (isLocked) return;
                          commitSelectClip(clip.id);
                          dragState.current = {
                            mode: 'trim-left',
                            clipId: clip.id,
                            clipType: clip.type,
                            startTrackId: t.id,
                            currentTrackId: t.id,
                            origStart: clip.start || 0,
                            origDuration: clip.duration || 3.5,
                            origInPoint: clip.inPoint || clip.mediaOffset || 0,
                            startX: e.clientX
                          };
                        }}
                        className="w-2.5 h-full -ml-2 bg-white/30 hover:bg-white cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="w-0.5 h-3 bg-black rounded-full" />
                      </div>

                      {/* 🌟 [엑박 완치]: 이미지일 때만 img 태그 사용, 에러 시 즉시 숨김 */}
                      {clip.type === 'image' && clip.url && (
                        <img 
                          src={clip.url} 
                          alt="" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none" 
                        />
                      )}

                      {/* 🌟 [비디오 전용]: 엑박 없이 메타데이터 첫 프레임을 영상 배경으로 안전하게 표출 */}
                      {clip.type === 'video' && clip.url && (
                        <video
                          src={`${clip.url}#t=0.1`}
                          preload="metadata"
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                        />
                      )}

                      {isAudio && (
                        <div className="absolute inset-0 opacity-40 flex items-center pointer-events-none overflow-hidden px-1">
                          <svg className="w-full h-4/5 text-emerald-400" preserveAspectRatio="none" viewBox="0 0 100 24">
                            <path d="M0 12 Q 10 2, 20 12 T 40 12 T 60 12 T 80 12 T 100 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M0 12 Q 15 20, 30 12 T 60 12 T 90 12 T 100 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.6" />
                          </svg>
                        </div>
                      )}

                      {isDucked && (
                        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-emerald-950/90 border-t border-dashed border-emerald-400 flex items-center justify-center pointer-events-none">
                          <span className="text-[7.5px] font-mono text-emerald-300 font-bold tracking-tighter">-18dB DUCKED</span>
                        </div>
                      )}

                      {/* 클립 명칭과 비디오/사진 구분 뱃지 */}
                      <div className="flex items-center gap-1.5 z-10 pointer-events-none truncate pr-1">
                        <span className="text-[8px] font-mono font-black px-1 rounded bg-black/60 text-sky-300 border border-white/10 shrink-0">
                          {clip.type === 'video' ? '🎬 VID' : clip.type === 'image' ? '🖼️ IMG' : clip.type === 'audio' ? '🎵 AUD' : '💬 TXT'}
                        </span>
                        <span className="text-[10px] font-bold truncate leading-none drop-shadow-md text-white">
                          {clip.name || clip.content || t.name}
                        </span>
                      </div>

                      <span className="text-[8.5px] font-mono font-bold text-zinc-300/80 pointer-events-none pl-1 shrink-0 z-10">
                        {clip.duration?.toFixed(1)}s
                      </span>

                      {/* 우측 트리밍 핸들러 */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (isLocked) return;
                          commitSelectClip(clip.id);
                          dragState.current = {
                            mode: 'trim-right',
                            clipId: clip.id,
                            clipType: clip.type,
                            startTrackId: t.id,
                            currentTrackId: t.id,
                            origStart: clip.start || 0,
                            origDuration: clip.duration || 3.5,
                            origInPoint: clip.inPoint || clip.mediaOffset || 0,
                            startX: e.clientX
                          };
                        }}
                        className="w-2.5 h-full -mr-2 bg-white/30 hover:bg-white cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="w-0.5 h-3 bg-black rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측 하단 줌 컨트롤러 */}
      <div className="absolute bottom-2 right-4 z-40 bg-[#12141C]/90 backdrop-blur-md border border-white/10 rounded-xl p-1 flex items-center gap-1 shadow-xl">
        <button 
          onClick={() => handleManualZoomChange(timelineZoom - 15)}
          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white cursor-pointer"
          title="축소"
        >
          <SvgZoomOut />
        </button>
        <span className="text-[9.5px] font-mono font-bold text-[#00E5FF] px-1">
          {timelineZoom}px/s
        </span>
        <button 
          onClick={() => handleManualZoomChange(timelineZoom + 15)}
          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white cursor-pointer"
          title="확대"
        >
          <SvgZoomIn />
        </button>
        <button 
          onClick={() => handleManualZoomChange(70)}
          className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-white/5 hover:bg-white/15 text-zinc-300 ml-0.5 cursor-pointer"
          title="기본 배율 리셋"
        >
          FIT
        </button>
      </div>
    </div>
  );
}
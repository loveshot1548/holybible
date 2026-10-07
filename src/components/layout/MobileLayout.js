// src/components/layout/MobileLayout.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import CinemaCanvas from '../viewer/CinemaCanvas';
import GridSettings from '../inspector/GridSettings';
import ColorWheels from '../inspector/ColorWheels';
import TextAnimator from '../inspector/TextAnimator';
import AudioInspector from '../inspector/AudioInspector';
import CaptionManager from '../inspector/CaptionManager';
import EffectsInspector from '../inspector/EffectsInspector';
import DrawMaskOverlay from '../viewer/DrawMaskOverlay';
import { BeatSyncEngine } from '../../engine/BeatSyncEngine';
import { audioDSP } from '../../engine/AudioDSP';

// 모노크롬 엔터프라이즈 SVG 아이콘 세트
const IconSplit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887m0 0l1.536.887M9.384 9.137L5.062 16.62M9.384 9.137l5.232-9.062M14.616 9.137l1.536-.887m0 0l1.536-.887M16.152 8.25l4.322 7.483M16.152 8.25l-5.232-9.062" /><circle cx="6" cy="18" r="3" strokeWidth={2} /><circle cx="18" cy="18" r="3" strokeWidth={2} /></svg>;
const IconSpeed = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;
const IconTransform = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const IconDelete = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.68.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconText = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M12 6v14m-4 0h8" /></svg>;
const IconMagic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
const IconColor = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25a1.125 1.125 0 00-1.125-1.125h-4.072M10.5 8.197l9.804-9.804a2.828 2.828 0 114 4l-9.804 9.804" /></svg>;
const IconEffects = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const IconTrackMove = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>;
const IconGrid = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const IconRewind = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>;
const IconFullscreen = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const IconExitFullscreen = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>;

// 🌟 src 폴더 연동 서체 목록[cite: 15]
const FONT_OPTIONS = [
  { id: 'sans-serif', name: '기본 고딕' },
  { id: 'MaruBuri', name: '마루부리 명조' },
  { id: 'KyoboHandwriting', name: '교보손글씨 2025' },
  { id: 'NanumPen', name: '나눔손글씨 펜' },
  { id: 'NanumMyeongjo', name: '나눔명조' },
  { id: 'MYArirangGothic', name: '밀양아리랑 고딕' }
];

export default function MobileLayout({
  setActiveScreen,
  mediaPool = [],
  handleFileUpload,
  fileInputRef,
  selectedClip,
  handleAddText,
  applyGraceTemplate,
  setShowPrompter,
  splitClip,
  deleteClip,
  selectedClipId,
  moveClipToTrack,
  updateClip,
  uploadMode,
  setUploadMode,
  isMagnetic,
  toggleMagnetic,
  handleMagicWandAutoEdit,
  handleOpenDuckingModal,
  handleOpenGridWallModal,
  handleExport,
  undo,
  redo,
  historyIndex,
  handleTogglePlay,
  handleRewindToStart,
  handleAutoSequenceAllClips
}) {
  const { 
    playhead, 
    setPlayhead, 
    isPlaying, 
    setIsPlaying, 
    projectDuration = 10, 
    entities,
    zoomScale = 50,
    setZoomScale,
    moveAndTrimClip
  } = useNLEStore();
  
  const [activeBottomNav, setActiveBottomNav] = useState('none');
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  
  const containerRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const timelineTrackRef = useRef(null);
  const touchState = useRef({ isScrubbing: false, isPinching: false, initialDist: 0, initialZoom: 50 });
  const trimState = useRef(null);
  const rafRef = useRef(null);

  // 모바일 AudioDSP 터치 언락[cite: 15]
  useEffect(() => {
    const unlockAudio = () => {
      if (typeof audioDSP?.init === 'function') audioDSP.init();
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => window.removeEventListener('touchstart', unlockAudio);
  }, []);

  // 브라우저 기본 제스처 차단[cite: 15]
  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaultTouch);
  }, []);

  // 풀스크린 토글[cite: 15]
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const targetEl = containerRef.current || document.documentElement;
      if (targetEl.requestFullscreen) {
        targetEl.requestFullscreen().catch(() => {});
      } else if (targetEl.webkitRequestFullscreen) {
        targetEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const triggerHaptic = useCallback((pattern = 15) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }, []);

  const formatTimecode = (sec) => {
    const s = Math.max(0, sec || 0);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const remSec = Math.floor(s % 60).toString().padStart(2, '0');
    const frames = Math.floor((s % 1) * 30).toString().padStart(2, '0');
    return `${m}:${remSec}:${frames}`;
  };

  const allClips = useMemo(() => Object.values(entities?.clips || {}).sort((a, b) => (a.start || 0) - (b.start || 0)), [entities?.clips]);
  const videoTrackClips = useMemo(() => allClips.filter(c => c.type === 'video' || c.type === 'image'), [allClips]);
  const audioTrackClips = useMemo(() => allClips.filter(c => c.type === 'audio'), [allClips]);
  const textTrackClips = useMemo(() => allClips.filter(c => c.type === 'text'), [allClips]);

  const pxPerSec = zoomScale || 50;
  const totalDuration = useMemo(() => Math.max(10, projectDuration || 10), [projectDuration]);
  const timelineTotalWidth = useMemo(() => (totalDuration * pxPerSec) + 240, [totalDuration, pxPerSec]);

  const stepFrame = (delta) => {
    triggerHaptic(10);
    const target = Math.max(0, Math.min(totalDuration, playhead + (delta * (1 / 30))));
    setPlayhead(target);
  };

  const executeRewind = () => {
    triggerHaptic(25);
    if (typeof handleRewindToStart === 'function') {
      handleRewindToStart();
    } else {
      setIsPlaying(false);
      setPlayhead(0);
    }
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const executeTogglePlay = () => {
    triggerHaptic(20);
    if (typeof handleTogglePlay === 'function') {
      handleTogglePlay();
    } else {
      if (!isPlaying && playhead >= totalDuration - 0.1) {
        setPlayhead(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  };

  // 타임라인 재생헤드 스크러빙 탐색기[cite: 15]
  const handleScrubTimeline = useCallback((clientX) => {
    if (trimState.current || !timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const targetSec = Math.max(0, Math.min(totalDuration, offsetX / pxPerSec));
    setPlayhead(Number(targetSec.toFixed(2)));
  }, [totalDuration, setPlayhead, pxPerSec]);

  const onTimelineTouchStart = (e) => {
    if (trimState.current) return;

    if (e.touches.length === 2) {
      touchState.current.isPinching = true;
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchState.current.initialDist = dist;
      touchState.current.initialZoom = pxPerSec;
      return;
    }
    
    touchState.current.isScrubbing = true;
    triggerHaptic(10);
    handleScrubTimeline(e.touches[0].clientX);
  };

  const onTimelineTouchMove = (e) => {
    // 1. 트리밍 핸들 조작[cite: 15]
    if (trimState.current && e.touches.length === 1) {
      if (rafRef.current) return;
      const touchX = e.touches[0].clientX;
      rafRef.current = requestAnimationFrame(() => {
        const { mode, clipId, origStart, origDuration, origInPoint, startX } = trimState.current;
        const deltaX = touchX - startX;
        const deltaTime = deltaX / pxPerSec;

        if (mode === 'trim-left') {
          const rawStart = Math.max(0, origStart + deltaTime);
          const actualDelta = rawStart - origStart;
          const newDur = Math.max(0.3, origDuration - actualDelta);
          const nextInPoint = Math.max(0, origInPoint + actualDelta);

          if (typeof moveAndTrimClip === 'function') {
            moveAndTrimClip(clipId, null, rawStart, newDur);
          } else {
            updateClip(clipId, { start: rawStart, duration: newDur, inPoint: nextInPoint, mediaOffset: nextInPoint });
          }
        } else if (mode === 'trim-right') {
          const rawEnd = origStart + origDuration + deltaTime;
          const newDur = Math.max(0.3, rawEnd - origStart);

          if (typeof moveAndTrimClip === 'function') {
            moveAndTrimClip(clipId, null, origStart, newDur);
          } else {
            updateClip(clipId, { duration: newDur });
          }
        }
        rafRef.current = null;
      });
      return;
    }

    // 2. 핀치 줌[cite: 15]
    if (touchState.current.isPinching && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const scale = dist / touchState.current.initialDist;
      const nextZoom = Math.max(20, Math.min(250, touchState.current.initialZoom * scale));
      if (typeof setZoomScale === 'function') setZoomScale(Math.round(nextZoom));
      return;
    }

    // 3. 타임라인 재생헤드 스크러빙[cite: 15]
    if (touchState.current.isScrubbing && e.touches.length === 1) {
      handleScrubTimeline(e.touches[0].clientX);
    }
  };

  const onTimelineTouchEnd = () => {
    touchState.current.isScrubbing = false;
    touchState.current.isPinching = false;
    trimState.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // 자동 재생헤드 추적 스크롤[cite: 15]
  useEffect(() => {
    if (isPlaying && timelineScrollRef.current && !touchState.current.isScrubbing && !trimState.current) {
      const currentNeedleX = playhead * pxPerSec;
      const scrollLeft = timelineScrollRef.current.scrollLeft;
      const containerWidth = timelineScrollRef.current.clientWidth;

      if (currentNeedleX > scrollLeft + containerWidth - 80) {
        timelineScrollRef.current.scrollLeft = currentNeedleX - 60;
      } else if (currentNeedleX < scrollLeft) {
        timelineScrollRef.current.scrollLeft = Math.max(0, currentNeedleX - 20);
      }
    }
  }, [playhead, isPlaying, pxPerSec]);

  const handleMobileBeatCut = async () => {
    triggerHaptic(30);
    await BeatSyncEngine.analyzeAndAutoSync();
  };

  const currentTrackOfSelectedClip = useMemo(() => {
    if (!selectedClipId || !entities?.tracks) return null;
    if (entities.clips?.[selectedClipId]?.trackId) {
      return entities.clips[selectedClipId].trackId;
    }
    for (const [tId, track] of Object.entries(entities.tracks)) {
      if (track?.clipIds?.includes(selectedClipId)) return tId;
    }
    return selectedClip?.type === 'audio' ? 'A1' : selectedClip?.type === 'text' ? 'T1' : 'V1';
  }, [selectedClipId, entities?.tracks, entities?.clips, selectedClip?.type]);

  const availableTracksForClip = useMemo(() => {
    if (!selectedClip) return [];
    if (selectedClip.type === 'audio') return ['A1', 'A2', 'A3'];
    if (selectedClip.type === 'text') return ['T1', 'T2', 'T3'];
    return ['V1', 'V2', 'V3', 'V4'];
  }, [selectedClip]);

  const handleMobileMoveClip = (targetTrackId) => {
    triggerHaptic(30);
    if (typeof moveClipToTrack === 'function') {
      moveClipToTrack(selectedClipId, targetTrackId);
      return;
    }
    const state = useNLEStore.getState();
    const tracks = { ...state.entities.tracks };
    const clips = { ...state.entities.clips };
    const targetClip = clips[selectedClipId];
    if (!targetClip) return;

    let sourceTrackId = currentTrackOfSelectedClip;
    if (sourceTrackId === targetTrackId) return;

    if (sourceTrackId && tracks[sourceTrackId]) {
      tracks[sourceTrackId] = {
        ...tracks[sourceTrackId],
        clipIds: tracks[sourceTrackId].clipIds.filter(id => id !== selectedClipId)
      };
    }

    if (!tracks[targetTrackId]) {
      const isAudio = targetTrackId.startsWith('A');
      const isText = targetTrackId.startsWith('T');
      tracks[targetTrackId] = { id: targetTrackId, type: isAudio ? 'audio' : isText ? 'text' : 'video', name: targetTrackId, clipIds: [] };
    }

    tracks[targetTrackId] = {
      ...tracks[targetTrackId],
      clipIds: [...(tracks[targetTrackId].clipIds || []).filter(id => id !== selectedClipId), selectedClipId]
    };

    clips[selectedClipId] = { ...targetClip, trackId: targetTrackId };
    useNLEStore.setState({ entities: { ...state.entities, tracks, clips } });
    if (typeof updateClip === 'function') updateClip(selectedClipId, { trackId: targetTrackId });
  };

  const handleUpdateTransform = (prop, value) => {
    if (!selectedClipId || !selectedClip) return;
    const curTf = selectedClip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
    if (prop === 'scale') {
      updateClip(selectedClipId, { scale: value, transform: { ...curTf, scale: value } });
    } else if (prop === 'positionX') {
      updateClip(selectedClipId, { positionX: value, transform: { ...curTf, x: value } });
    } else if (prop === 'positionY') {
      updateClip(selectedClipId, { positionY: value, transform: { ...curTf, y: value } });
    } else if (prop === 'rotation') {
      updateClip(selectedClipId, { rotation: value, transform: { ...curTf, rotate: value } });
    } else if (prop === 'opacity') {
      updateClip(selectedClipId, { opacity: value });
    }
  };

  const handleClipSpeedChange = (newSpeed) => {
    if (!selectedClipId || !selectedClip) return;
    const baseDuration = selectedClip.mediaDuration || selectedClip.duration * (selectedClip.speed || 1.0);
    const newDuration = Math.max(0.3, baseDuration / newSpeed);
    updateClip(selectedClipId, { speed: newSpeed, duration: newDuration });
  };

  return (
    <div 
      ref={containerRef}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#000000] text-zinc-100 font-sans select-none z-50 overscroll-none touch-none pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)]"
    >
      {/* 1. 상단 프로 헤더[cite: 15] */}
      <header className="h-11 px-3 bg-[#111317] border-b border-white/10 flex items-center justify-between shrink-0 z-30 touch-none">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveScreen ? setActiveScreen('home') : window.history.back()}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 font-black text-xs cursor-pointer active:scale-95"
            title="나가기"
          >
            ✕
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
              isFullscreen ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-300'
            }`}
          >
            {isFullscreen ? <IconExitFullscreen/> : <IconFullscreen/>}
            <span className="hidden sm:inline">{isFullscreen ? '복원' : '풀스크린'}</span>
          </button>

          <button 
            onClick={() => { triggerHaptic(15); setShowSafeZone(!showSafeZone); }}
            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
              showSafeZone ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showSafeZone ? 'bg-rose-500 animate-pulse' : 'bg-zinc-500'}`} />
            가이드
          </button>

          <button
            onClick={() => { triggerHaptic(15); setUploadMode && setUploadMode(uploadMode === 'stack' ? 'sequence' : 'stack'); }}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 cursor-pointer hidden sm:block"
          >
            {uploadMode === 'stack' ? '레이어' : '순차'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => { triggerHaptic(10); undo(); }} disabled={historyIndex <= 0} className="w-6 h-6 rounded bg-white/5 text-zinc-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center cursor-pointer active:scale-90">↶</button>
          <button onClick={() => { triggerHaptic(10); redo(); }} className="w-6 h-6 rounded bg-white/5 text-zinc-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center cursor-pointer active:scale-90">↷</button>

          <button
            onClick={() => { triggerHaptic(30); handleExport(); }}
            className="ml-1 px-3 py-1 rounded-full bg-[#00E5FF] hover:bg-[#00d0e8] text-black font-black text-[11px] tracking-wider shadow-md active:scale-95 cursor-pointer"
          >
            내보내기
          </button>
        </div>
      </header>

      {/* 2. 뷰어 영역[cite: 15] */}
      <div 
        onClick={() => { 
          if (activeBottomNav === 'none') {
            triggerHaptic(10); 
            useNLEStore.setState({ selectedClipId: null }); 
          }
        }}
        className="flex-1 min-h-0 bg-[#050608] flex items-center justify-center relative p-1 overflow-hidden cursor-pointer"
      >
        <div className="relative aspect-[9/16] h-full max-h-full sm:max-w-[420px] overflow-hidden bg-black flex items-center justify-center rounded-lg shadow-2xl">
          <CinemaCanvas/>

          {/* 인스타그램 세이프존 가이드[cite: 15] */}
          {showSafeZone && (
            <div className="absolute inset-0 pointer-events-none z-30 select-none animate-fade-in flex flex-col justify-between p-2.5 overflow-hidden">
              <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-rose-500/40 shadow-lg shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-mono text-[9px] font-black text-rose-300 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    ◀ REELS HEADER
                  </span>
                </div>
                <span className="font-mono text-[8.5px] font-bold text-zinc-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  SEARCH ▶
                </span>
              </div>

              <div className="flex-1 my-1.5 border border-dashed border-rose-500/30 rounded-xl relative flex items-center justify-center pointer-events-none">
                <span className="font-mono text-[8px] font-bold text-rose-300 bg-black/60 px-2 py-0.5 rounded-full border border-rose-500/20 backdrop-blur-xs">
                  SAFE ZONE (9:16)
                </span>
              </div>

              <div className="w-full flex items-end justify-between gap-2 pb-1 shrink-0">
                <div className="flex-1 min-w-0 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-rose-500/40 shadow-xl space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-[9.5px] font-black text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                      @official_reels
                    </span>
                  </div>
                  <p className="text-[8.5px] text-zinc-200 font-medium leading-tight line-clamp-2 break-keep drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    여호와는 나의 목자시니... #은혜 #말씀
                  </p>
                </div>
                <div className="w-9 shrink-0 flex flex-col items-center gap-1 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-rose-500/40 shadow-xl">
                  <span className="text-[10px]">❤️</span>
                  <span className="text-[10px]">💬</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 뷰어 좌측 하단 전체화면 재생 버튼[cite: 15] */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic(15); setIsFullscreenPreview(true); }}
          className="absolute left-4 bottom-3 z-30 p-2 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-90 cursor-pointer"
          title="전체화면 재생"
        >
          <IconFullscreen />
        </button>
      </div>

      {/* 3. 정밀 셔틀 컨트롤러[cite: 15] */}
      <div className="h-10 px-3 bg-[#111317] border-y border-white/10 flex items-center justify-between shrink-0 text-xs shadow-md z-10 touch-none">
        <div 
          onClick={executeRewind}
          className="font-mono font-bold text-white flex items-center gap-1 cursor-pointer"
        >
          <span className="text-[#00E5FF] text-[11.5px] w-12 text-right">{formatTimecode(playhead)}</span>
          <span className="text-zinc-600 text-[10px]">/</span>
          <span className="text-zinc-400 text-[10px] w-12">{formatTimecode(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={executeRewind} className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center cursor-pointer active:scale-90" title="처음으로"><IconRewind/></button>
          <button onClick={() => stepFrame(-1)} className="w-7 h-7 rounded bg-white/5 text-zinc-300 font-mono text-[9px] font-bold flex items-center justify-center cursor-pointer active:scale-90" title="-1프레임">-1F</button>
          <button onClick={executeTogglePlay} className="w-8 h-8 rounded-full bg-[#00E5FF] hover:bg-[#00d0e8] text-black flex items-center justify-center text-sm font-black shadow-lg active:scale-90 cursor-pointer">{isPlaying ? '❚❚' : '▶'}</button>
          <button onClick={() => stepFrame(1)} className="w-7 h-7 rounded bg-white/5 text-zinc-300 font-mono text-[9px] font-bold flex items-center justify-center cursor-pointer active:scale-90" title="+1프레임">+1F</button>
        </div>

        <button 
          onClick={() => { triggerHaptic(15); toggleMagnetic(); }} 
          className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-colors ${isMagnetic ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'border-zinc-800 text-zinc-500'}`}
        >
          SNAP
        </button>
      </div>

      {/* 4. 타임라인[cite: 15] */}
      <div 
        ref={timelineScrollRef}
        style={{ overscrollBehavior: 'none' }}
        className="h-36 bg-[#0C0D11] relative overflow-x-auto overflow-y-hidden hide-scrollbar border-b border-white/10 shrink-0 select-none touch-pan-x"
      >
        <div 
          ref={timelineTrackRef}
          onTouchStart={onTimelineTouchStart}
          onTouchMove={onTimelineTouchMove}
          onTouchEnd={onTimelineTouchEnd}
          onClick={(e) => handleScrubTimeline(e.clientX)}
          style={{ width: `${timelineTotalWidth}px`, touchAction: 'pan-x' }}
          className="relative h-full flex flex-col justify-start pt-1.5 cursor-pointer pl-4"
        >
          {/* 상단 눈금자[cite: 15] */}
          <div className="h-4 w-full relative pointer-events-none select-none">
            {Array.from({ length: Math.ceil(totalDuration) + 2 }).map((_, sec) => (
              <div 
                key={sec} 
                style={{ left: `${sec * pxPerSec}px` }}
                className="absolute top-0 bottom-0 flex flex-col items-center"
              >
                <div className="w-px h-1.5 bg-white/30" />
                <span className="font-mono text-[7.5px] text-zinc-500 font-bold mt-0.5">{sec}s</span>
              </div>
            ))}
          </div>

          {/* 화이트 플레이헤드 바늘[cite: 15] */}
          <div 
            style={{ transform: `translate3d(${playhead * pxPerSec}px, 0, 0)` }}
            className="absolute top-0 bottom-0 left-4 w-[2px] bg-white z-30 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.9)] will-change-transform"
          >
            <div className="w-2.5 h-3 bg-white rounded-xs -translate-x-[4px] -translate-y-0.5 shadow-md" />
          </div>

          {/* 트랙 1: 비디오/이미지 트랙[cite: 15] */}
          <div className="h-12 flex items-center relative z-10 mt-1">
            {videoTrackClips.length === 0 ? (
              <label onClick={(e) => e.stopPropagation()} className="h-10 w-48 border border-dashed border-white/20 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] active:scale-98">
                <span className="text-base font-black text-[#00E5FF]">+</span>
                <span className="text-[10px] font-bold text-zinc-300">미디어 등록</span>
                <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="relative h-11 w-full">
                {videoTrackClips.map((c) => {
                  const isSelected = selectedClipId === c.id;
                  const startPx = (c.start || 0) * pxPerSec;
                  const widthPx = Math.max(28, (c.duration || 3.5) * pxPerSec);

                  return (
                    <div
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(20);
                        useNLEStore.setState({ selectedClipId: c.id });
                        setPlayhead(c.start || 0);
                      }}
                      style={{ 
                        transform: `translate3d(${startPx}px, 0, 0)`, 
                        width: `${widthPx}px`,
                        touchAction: 'none'
                      }}
                      className={`absolute top-0 h-10.5 rounded-lg overflow-hidden cursor-pointer border transition-colors flex flex-col justify-between p-1 select-none will-change-transform touch-none ${
                        isSelected 
                          ? 'border-white bg-[#14232B] shadow-[0_0_12px_rgba(0,229,255,0.6)] ring-2 ring-[#00E5FF] z-20' 
                          : 'border-white/10 bg-[#161820] hover:border-zinc-500 z-10'
                      }`}
                    >
                      {/* 좌측 와이드 트리밍 핸들러[cite: 15] */}
                      <div
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          trimState.current = { mode: 'trim-left', clipId: c.id, origStart: c.start || 0, origDuration: c.duration || 3.5, origInPoint: c.inPoint || c.mediaOffset || 0, startX: e.touches[0].clientX };
                        }}
                        style={{ touchAction: 'none' }}
                        className="absolute left-0 top-0 bottom-0 w-8 z-40 flex items-center justify-start pl-1 touch-none"
                      >
                        <div className="w-1.5 h-5 bg-white rounded-full shadow-md" />
                      </div>

                      {c.type === 'image' && c.url && (
                        <img src={c.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none" />
                      )}
                      
                      <div className="flex justify-between items-center z-10 pointer-events-none px-2">
                        <span className="text-[8.5px] font-black text-white truncate max-w-[65%]">{c.name || '클립'}</span>
                        <span className="text-[7.5px] font-mono text-zinc-300 font-bold">{c.duration?.toFixed(1)}s</span>
                      </div>
                      
                      <div className="flex justify-between items-center z-10 mt-auto pointer-events-none px-2">
                        <span className="text-[7.5px] font-mono font-bold text-[#00E5FF] uppercase">{c.type}</span>
                        <span className="text-[7.5px] font-mono font-black px-1 bg-black/70 rounded border border-white/20 text-[#00E5FF]">
                          {c.trackId || 'V1'}
                        </span>
                      </div>

                      {/* 우측 와이드 트리밍 핸들러[cite: 15] */}
                      <div
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          trimState.current = { mode: 'trim-right', clipId: c.id, origStart: c.start || 0, origDuration: c.duration || 3.5, origInPoint: c.inPoint || c.mediaOffset || 0, startX: e.touches[0].clientX };
                        }}
                        style={{ touchAction: 'none' }}
                        className="absolute right-0 top-0 bottom-0 w-8 z-40 flex items-center justify-end pr-1 touch-none"
                      >
                        <div className="w-1.5 h-5 bg-white rounded-full shadow-md" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 트랙 2: 오디오 트랙[cite: 15] */}
          <div className="h-6 relative z-10 mt-1">
            {audioTrackClips.map(a => {
              const startPx = (a.start || 0) * pxPerSec;
              const widthPx = Math.max(24, (a.duration || 3.5) * pxPerSec);
              const isSelected = selectedClipId === a.id;

              return (
                <div 
                  key={a.id} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    triggerHaptic(20); 
                    useNLEStore.setState({ selectedClipId: a.id }); 
                    setPlayhead(a.start || 0); 
                  }} 
                  style={{ transform: `translate3d(${startPx}px, 0, 0)`, width: `${widthPx}px`, touchAction: 'none' }}
                  className={`absolute top-0 h-5 rounded px-1.5 flex items-center justify-between cursor-pointer border will-change-transform touch-none ${
                    isSelected ? 'bg-emerald-800 border-white ring-1 ring-emerald-400 z-20' : 'bg-emerald-950/80 border-emerald-500/60 z-10'
                  }`}
                >
                  <span className="text-[8px] font-bold text-emerald-200 truncate pr-1 pointer-events-none">{a.name}</span>
                  <span className="text-[7px] font-mono font-black px-0.5 bg-black/60 rounded text-emerald-300 pointer-events-none">{a.trackId || 'A1'}</span>
                </div>
              );
            })}
          </div>

          {/* 트랙 3: 자막 텍스트 트랙[cite: 15] */}
          <div className="h-6 relative z-10 mt-0.5">
            {textTrackClips.map(t => {
              const startPx = (t.start || 0) * pxPerSec;
              const widthPx = Math.max(24, (t.duration || 3.5) * pxPerSec);
              const isSelected = selectedClipId === t.id;

              return (
                <div 
                  key={t.id} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    triggerHaptic(20); 
                    useNLEStore.setState({ selectedClipId: t.id }); 
                    setActiveBottomNav('text-edit');
                    setPlayhead(t.start || 0); 
                  }} 
                  style={{ transform: `translate3d(${startPx}px, 0, 0)`, width: `${widthPx}px`, touchAction: 'none' }}
                  className={`absolute top-0 h-5.5 rounded px-2 flex items-center justify-between cursor-pointer border will-change-transform touch-none ${
                    isSelected ? 'bg-amber-800 border-white ring-2 ring-amber-400 z-20 shadow-md' : 'bg-amber-950/80 border-amber-500/60 z-10'
                  }`}
                >
                  <span className="text-[8.5px] font-bold text-amber-100 truncate pr-1 pointer-events-none">{t.content || '자막'}</span>
                  <span className="text-[7px] font-mono font-black px-1 bg-black/60 rounded text-amber-300 pointer-events-none">{t.trackId || 'T1'}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 5. 캡컷 프로 툴 독[cite: 15] */}
      <div className="h-16 px-1.5 bg-[#111317] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0 z-30 pb-[env(safe-area-inset-bottom,4px)] touch-pan-x">
        {selectedClip ? (
          selectedClip.type === 'text' ? (
            // 자막 클립 전용 액션 독[cite: 15]
            <>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'text-edit' ? 'none' : 'text-edit'); }} className={`min-w-[54px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'text-edit' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconText /><span className="text-[9px] font-bold">텍스트</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'text-badge' ? 'none' : 'text-badge'); }} className={`min-w-[54px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'text-badge' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><span className="text-sm">🏷️</span><span className="text-[9px] font-bold">뱃지 폼</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'text-font' ? 'none' : 'text-font'); }} className={`min-w-[54px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'text-font' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><span className="text-sm">🔤</span><span className="text-[9px] font-bold">폰트</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'text' ? 'none' : 'text'); }} className={`min-w-[54px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'text' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><span className="text-sm">✨</span><span className="text-[9px] font-bold">애니메이션</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'track' ? 'none' : 'track'); }} className={`min-w-[54px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'track' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconTrackMove /><span className="text-[9px] font-bold">트랙</span></button>
              <button onClick={() => { triggerHaptic(30); deleteClip(selectedClipId); setActiveBottomNav('none'); }} className="min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 text-rose-400 active:scale-90 cursor-pointer"><IconDelete /><span className="text-[9px] font-bold">삭제</span></button>
              <button onClick={() => { triggerHaptic(10); useNLEStore.setState({ selectedClipId: null }); setActiveBottomNav('none'); }} className="min-w-[48px] py-1.5 flex flex-col items-center justify-center gap-1 text-zinc-500 cursor-pointer"><span className="text-sm font-bold">✕</span><span className="text-[8.5px]">완료</span></button>
            </>
          ) : (
            // 비디오/이미지/오디오 클립 전용 액션 독[cite: 15]
            <>
              <button onClick={() => { triggerHaptic(30); splitClip(); }} className="min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 text-white active:scale-90 cursor-pointer"><IconSplit/><span className="text-[9px] font-bold">분할</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'transform' ? 'none' : 'transform'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'transform' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconTransform/><span className="text-[9px] font-bold">변형</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'grid' ? 'none' : 'grid'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'grid' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconGrid/><span className="text-[9px] font-bold">그리드</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'speed' ? 'none' : 'speed'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'speed' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconSpeed/><span className="text-[9px] font-bold">속도</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'volume' ? 'none' : 'volume'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'volume' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconVolume/><span className="text-[9px] font-bold">음량</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'color' ? 'none' : 'color'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'color' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconColor/><span className="text-[9px] font-bold">색보정</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'effects' ? 'none' : 'effects'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'effects' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconEffects/><span className="text-[9px] font-bold">효과</span></button>
              <button onClick={() => { triggerHaptic(15); setActiveBottomNav(activeBottomNav === 'track' ? 'none' : 'track'); }} className={`min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer ${activeBottomNav === 'track' ? 'text-[#00E5FF] font-black' : 'text-zinc-300'}`}><IconTrackMove/><span className="text-[9px] font-bold">트랙</span></button>
              <button onClick={() => { triggerHaptic(30); deleteClip(selectedClipId); setActiveBottomNav('none'); }} className="min-w-[52px] py-1.5 flex flex-col items-center justify-center gap-1 text-rose-400 active:scale-90 cursor-pointer"><IconDelete/><span className="text-[9px] font-bold">삭제</span></button>
              <button onClick={() => { triggerHaptic(10); useNLEStore.setState({ selectedClipId: null }); setActiveBottomNav('none'); }} className="min-w-[48px] py-1.5 flex flex-col items-center justify-center gap-1 text-zinc-500 cursor-pointer"><span className="text-sm font-bold">✕</span><span className="text-[8.5px]">완료</span></button>
            </>
          )
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-white active:scale-95 cursor-pointer"><span className="w-6 h-6 flex items-center justify-center text-lg font-black text-[#00E5FF] bg-[#00E5FF]/10 rounded-full">+</span><span className="text-[9px] font-bold">미디어</span><input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileUpload} className="hidden" /></button>
            <button onClick={() => { triggerHaptic(15); handleAddText(); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-zinc-300 active:scale-95 cursor-pointer"><IconText/><span className="text-[9px] font-bold">텍스트</span></button>
            <button onClick={() => { triggerHaptic(15); handleMagicWandAutoEdit(); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-[#C59B51] active:scale-95 cursor-pointer"><IconMagic/><span className="text-[9px] font-black">AI마법봉</span></button>
            <button onClick={handleMobileBeatCut} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-amber-400 active:scale-95 cursor-pointer"><span className="text-base">🎵</span><span className="text-[9px] font-bold">비트싱크</span></button>
            <button onClick={() => { triggerHaptic(15); handleOpenDuckingModal(); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-emerald-400 active:scale-95 cursor-pointer"><span className="text-base">🎛️</span><span className="text-[9px] font-bold">더킹</span></button>
            <button onClick={() => { triggerHaptic(15); handleOpenGridWallModal(); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-sky-400 active:scale-95 cursor-pointer"><span className="text-base">📐</span><span className="text-[9px] font-bold">그리드</span></button>
            <button onClick={() => { triggerHaptic(15); if(typeof handleAutoSequenceAllClips === 'function') handleAutoSequenceAllClips(); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-zinc-300 active:scale-95 cursor-pointer"><span className="text-base">🎞</span><span className="text-[9px] font-bold">순차정렬</span></button>
            <button onClick={() => { triggerHaptic(15); setShowPrompter(true); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-rose-300 active:scale-95 cursor-pointer"><span className="text-base">🎙</span><span className="text-[9px] font-bold">프롬프터</span></button>
            <button onClick={() => { triggerHaptic(15); if(mediaPool?.length > 0) applyGraceTemplate(mediaPool[0]); else alert("미디어를 먼저 등록하세요."); }} className="min-w-[56px] py-1.5 flex flex-col items-center justify-center gap-1 text-amber-300 active:scale-95 cursor-pointer"><span className="text-base">✨</span><span className="text-[9px] font-bold">템플릿</span></button>
          </>
        )}
      </div>

      {/* 6. 바텀 시트 인스펙터 패널[cite: 15] */}
      {activeBottomNav !== 'none' && (
        <>
          <div 
            onTouchStart={(e) => { e.stopPropagation(); setActiveBottomNav('none'); }}
            onClick={(e) => { e.stopPropagation(); setActiveBottomNav('none'); }}
            className="fixed inset-0 z-40 touch-none bg-black/40"
          />

          <div 
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-14 max-h-[55vh] bg-[#14161E]/98 backdrop-blur-2xl border-t border-white/15 z-50 flex flex-col shadow-2xl animate-fade-in-up pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="h-10 px-3 border-b border-white/10 flex items-center justify-between bg-[#181B24] shrink-0 touch-none">
              <span className="text-[11px] font-black text-[#00E5FF] uppercase font-mono tracking-wider truncate">
                {activeBottomNav === 'text-edit' ? '자막 문구 수정' :
                 activeBottomNav === 'text-badge' ? '성경·설교 뱃지 폼' :
                 activeBottomNav === 'text-font' ? '서체 폰트 선택' :
                 activeBottomNav === 'transform' ? '변형 (Transform)' :
                 activeBottomNav === 'grid' ? '그리드 매트릭스' :
                 activeBottomNav === 'speed' ? '속도 조절' :
                 activeBottomNav === 'volume' ? '음량 볼륨' :
                 activeBottomNav === 'track' ? '트랙 변경' :
                 activeBottomNav === 'color' ? '색보정 (Color Grade)' :
                 activeBottomNav === 'text' ? '자막 매니저' :
                 activeBottomNav === 'audio' ? '오디오 설정' : '효과 (Effects)'}
              </span>
              <button onClick={() => setActiveBottomNav('none')} className="text-zinc-400 hover:text-white font-bold text-xs px-2.5 py-1 rounded bg-white/5 cursor-pointer">
                닫기 ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar touch-pan-y overscroll-contain">
              
              {/* 텍스트 내용 즉시 수정 패널[cite: 15] */}
              {activeBottomNav === 'text-edit' && selectedClip && (
                <div className="space-y-3 text-xs">
                  <span className="text-zinc-300 font-bold block">표시할 자막 텍스트 내용</span>
                  <textarea
                    rows={3}
                    value={selectedClip.content || ''}
                    onChange={(e) => updateClip(selectedClip.id, { content: e.target.value })}
                    placeholder="자막 내용을 입력하세요..."
                    className="w-full p-3 bg-black border border-white/15 rounded-xl text-white font-medium text-xs outline-none focus:border-[#00E5FF]"
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">글자 크기 (Font Size)</span>
                      <span className="text-[#00E5FF] font-mono">{selectedClip.style?.fontSize || 22}px</span>
                    </div>
                    <input 
                      type="range" min="14" max="44" step="1"
                      value={selectedClip.style?.fontSize || 22}
                      onChange={(e) => updateClip(selectedClip.id, { style: { ...(selectedClip.style || {}), fontSize: Number(e.target.value) } })}
                      className="w-full accent-[#00E5FF] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 설교 적용질문 뱃지 폼[cite: 15] */}
              {activeBottomNav === 'text-badge' && selectedClip && (
                <div className="space-y-3 text-xs">
                  <span className="text-zinc-300 font-bold block">자막 폼 프리셋 선택</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateClip(selectedClip.id, { style: { ...(selectedClip.style || {}), preset: 'sermon-badge', badgeText: '적용질문' } })}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer ${
                        selectedClip.style?.preset === 'sermon-badge' ? 'border-[#00E5FF] bg-sky-950/70 shadow-md' : 'border-white/10 bg-black'
                      }`}
                    >
                      <span className="text-[11px] font-black text-sky-300">🏷️ 설교 적용질문 뱃지 폼</span>
                      <span className="text-[9px] text-zinc-400">네이비 뱃지 + 블루 그라데이션 박스</span>
                    </button>
                    <button
                      onClick={() => updateClip(selectedClip.id, { style: { ...(selectedClip.style || {}), preset: 'standard' } })}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer ${
                        selectedClip.style?.preset === 'standard' || !selectedClip.style?.preset ? 'border-[#00E5FF] bg-zinc-800 shadow-md' : 'border-white/10 bg-black'
                      }`}
                    >
                      <span className="text-[11px] font-black text-white">기본 릴스 자막</span>
                      <span className="text-[9px] text-zinc-400">외곽선 섀도우 텍스트</span>
                    </button>
                  </div>

                  {selectedClip.style?.preset === 'sermon-badge' && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold text-sky-400">상단 뱃지 문구 (예: 적용질문, 말씀나눔, 기도제목)</span>
                      <input 
                        type="text"
                        value={selectedClip.style?.badgeText || '적용질문'}
                        onChange={(e) => updateClip(selectedClip.id, { style: { ...(selectedClip.style || {}), badgeText: e.target.value } })}
                        className="w-full p-2.5 bg-black border border-sky-500/50 rounded-lg text-white font-bold text-xs outline-none focus:border-sky-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* src 폴더 연동 서체 폰트 선택기[cite: 15] */}
              {activeBottomNav === 'text-font' && selectedClip && (
                <div className="space-y-2 text-xs">
                  <span className="text-zinc-300 font-bold block">서체 (Font Family)</span>
                  <div className="grid grid-cols-1 gap-2">
                    {FONT_OPTIONS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => updateClip(selectedClip.id, { style: { ...(selectedClip.style || {}), fontFamily: f.id } })}
                        className={`p-3 rounded-xl border text-left flex justify-between items-center cursor-pointer transition-all ${
                          (selectedClip.style?.fontFamily || 'sans-serif') === f.id
                            ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF] font-black shadow-sm'
                            : 'border-white/10 bg-black text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <span style={{ fontFamily: f.id }} className="text-sm">{f.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{f.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 변형 패널[cite: 15] */}
              {activeBottomNav === 'transform' && selectedClip && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-300">확대/축소 (Scale)</span>
                      <span className="text-[#00E5FF] font-mono">{selectedClip.transform?.scale ?? selectedClip.scale ?? 100}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="300" step="1"
                      value={selectedClip.transform?.scale ?? selectedClip.scale ?? 100}
                      onChange={e => handleUpdateTransform('scale', Number(e.target.value))}
                      className="w-full accent-[#00E5FF] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-zinc-400 font-bold block mb-1 text-[10px]">X축 위치 (px)</span>
                      <input 
                        type="number"
                        value={selectedClip.transform?.x ?? selectedClip.positionX ?? 0}
                        onChange={e => handleUpdateTransform('positionX', Number(e.target.value))}
                        className="w-full p-2 bg-black border border-white/15 rounded-lg text-white font-mono text-center outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block mb-1 text-[10px]">Y축 위치 (px)</span>
                      <input 
                        type="number"
                        value={selectedClip.transform?.y ?? selectedClip.positionY ?? 0}
                        onChange={e => handleUpdateTransform('positionY', Number(e.target.value))}
                        className="w-full p-2 bg-black border border-white/15 rounded-lg text-white font-mono text-center outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-300">회전 각도 (Rotation)</span>
                      <span className="text-[#00E5FF] font-mono">{selectedClip.transform?.rotate ?? selectedClip.rotation ?? 0}°</span>
                    </div>
                    <input 
                      type="range" min="-180" max="180" step="1"
                      value={selectedClip.transform?.rotate ?? selectedClip.rotation ?? 0}
                      onChange={e => handleUpdateTransform('rotation', Number(e.target.value))}
                      className="w-full accent-[#00E5FF] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-300">불투명도 (Opacity)</span>
                      <span className="text-[#00E5FF] font-mono">{selectedClip.opacity ?? 100}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={selectedClip.opacity ?? 100}
                      onChange={e => handleUpdateTransform('opacity', Number(e.target.value))}
                      className="w-full accent-[#00E5FF] cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleUpdateTransform('scale', 100);
                        handleUpdateTransform('positionX', 0);
                        handleUpdateTransform('positionY', 0);
                        handleUpdateTransform('rotation', 0);
                      }}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-zinc-300 active:scale-95 cursor-pointer"
                    >
                      위치/크기 리셋
                    </button>
                    <button
                      onClick={() => setShowMaskEditor(true)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      ✨ 마스크 편집
                    </button>
                  </div>
                </div>
              )}

              {/* 그리드 패널[cite: 15] */}
              {activeBottomNav === 'grid' && selectedClip && (
                <GridSettings clip={selectedClip} />
              )}

              {/* 속도 패널[cite: 15] */}
              {activeBottomNav === 'speed' && selectedClip && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-300">현재 배속</span>
                    <span className="text-[#00E5FF] font-mono font-black text-sm">{(selectedClip.speed || 1.0).toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    {[0.5, 0.8, 1.0, 1.2, 1.5, 2.0].map(s => (
                      <button
                        key={s}
                        onClick={() => handleClipSpeedChange(s)}
                        className={`flex-1 py-2 rounded-lg font-mono font-bold text-xs border cursor-pointer ${
                          (selectedClip.speed || 1.0) === s ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-sm' : 'bg-white/5 border-white/10 text-zinc-300'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" min="0.2" max="3.0" step="0.1"
                    value={selectedClip.speed || 1.0}
                    onChange={e => handleClipSpeedChange(Number(e.target.value))}
                    className="w-full accent-[#00E5FF] cursor-pointer mt-3"
                  />
                </div>
              )}

              {/* 음량 패널[cite: 15] */}
              {activeBottomNav === 'volume' && selectedClip && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-300">클립 음량</span>
                    <span className="text-emerald-400 font-mono font-black text-sm">{selectedClip.volume ?? 100}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" step="1"
                    value={selectedClip.volume ?? 100}
                    onChange={e => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateClip(selectedClip.id, { volume: 0 })} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 cursor-pointer">0%</button>
                    <button onClick={() => updateClip(selectedClip.id, { volume: 100 })} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 cursor-pointer">100%</button>
                    <button onClick={() => updateClip(selectedClip.id, { volume: 150 })} className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold cursor-pointer">150%</button>
                  </div>
                </div>
              )}

              {/* 트랙 이동 패널[cite: 15] */}
              {activeBottomNav === 'track' && selectedClip && (
                <div className="space-y-3 text-xs">
                  <span className="text-zinc-400 font-bold block mb-2">
                    현재 트랙 : <strong className="text-[#00E5FF] text-sm ml-1">{currentTrackOfSelectedClip}</strong>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTracksForClip.map(tId => (
                      <button
                        key={tId}
                        onClick={() => handleMobileMoveClip(tId)}
                        className={`py-3 rounded-xl font-bold border transition-all cursor-pointer ${
                          currentTrackOfSelectedClip === tId
                            ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-md font-black'
                            : 'bg-white/5 border-white/10 text-zinc-300 active:bg-white/10'
                        }`}
                      >
                        {tId}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 색보정 패널[cite: 15] */}
              {activeBottomNav === 'color' && selectedClip && (
                <ColorWheels clip={selectedClip} />
              )}

              {/* 자막 애니메이션 패널[cite: 15] */}
              {activeBottomNav === 'text' && (
                <div className="space-y-4">
                  <CaptionManager />
                  {selectedClip?.type === 'text' && <TextAnimator clip={selectedClip} />}
                </div>
              )}

              {/* 오디오 설정 패널[cite: 15] */}
              {activeBottomNav === 'audio' && (
                selectedClip?.type === 'audio' ? (
                  <AudioInspector clip={selectedClip} />
                ) : (
                  <div className="py-8 text-center text-zinc-400 text-xs font-bold">오디오 클립을 먼저 선택해주세요.</div>
                )
              )}

              {/* 효과 패널[cite: 15] */}
              {activeBottomNav === 'effects' && selectedClip && (
                <EffectsInspector clip={selectedClip} />
              )}
            </div>
          </div>
        </>
      )}

      {/* 스마트 마스크 펜툴 오버레이[cite: 15] */}
      {showMaskEditor && selectedClipId && (
        <DrawMaskOverlay clipId={selectedClipId} onClose={() => setShowMaskEditor(false)} />
      )}

      {/* 캡컷 규격 풀스크린 전체화면 재생 모달[cite: 15] */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in select-none">
          <div className="relative aspect-[9/16] h-full max-h-[92vh] w-auto overflow-hidden">
            <CinemaCanvas />
          </div>

          <div className="absolute inset-x-0 bottom-6 px-6 flex items-center justify-between z-20">
            <button 
              onClick={executeRewind} 
              className="text-white font-mono text-xs font-bold bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 active:scale-95 cursor-pointer"
            >
              ⏮ 0초
            </button>
            <button 
              onClick={executeTogglePlay} 
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-lg font-black shadow-2xl active:scale-95 cursor-pointer"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button 
              onClick={() => setIsFullscreenPreview(false)} 
              className="text-white text-xs font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 active:scale-95 cursor-pointer"
            >
              닫기 ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
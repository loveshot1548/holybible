// src/components/layout/ReelsStudio.js
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { useExportEngine } from '../../engine/ExportEngine';
import { checkAndFetchScripture } from '../../engine/AutoScripture';
import { applyGraceTemplate } from '../../engine/TemplateMacro';
import { ProjectSerializer } from '../../engine/ProjectSerializer';
import { BeatSyncEngine } from '../../engine/BeatSyncEngine';
import { aiVisionEngine } from '../../engine/AIVisionEngine';
import { storageEngine } from '../../engine/StorageEngine';
import { audioDSP } from '../../engine/AudioDSP';
import Teleprompter from '../viewer/Teleprompter';

// 🌟 블록버스터 오토-디렉터 엔진 연동
import { BlockbusterDirectorEngine, BLOCKBUSTER_STYLES } from '../../engine/BlockbusterDirector';

import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

const SvgMagicWand = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
const SvgVolumeDucking = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);
const SvgGridWall = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);
const SvgText = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SCRIPTURE_PRESETS = [
  { label: '요 3:16', code: '요 3:16' },
  { label: '시 23:1', code: '시 23:1' },
  { label: '빌 4:13', code: '빌 4:13' },
  { label: '마 6:33', code: '마 6:33' },
  { label: '사 41:10', code: '사 41:10' },
  { label: '롬 8:28', code: '롬 8:28' }
];

const REELS_CAPTION_STYLES = [
  { id: 'sermon_badge', label: '🏷️ 설교 적용질문 뱃지 폼 (블루 그라데이션)', preset: 'sermon-badge', bg: 'linear-gradient(135deg, rgba(3,105,161,0.9), rgba(14,116,144,0.95))', color: '#FFFFFF', stroke: '#000000' },
  { id: 'reels_caption', label: '릴스 표준 하단바 (반투명 블랙)', preset: 'standard', bg: 'rgba(0,0,0,0.65)', color: '#FFFFFF', stroke: '#000000' },
  { id: 'bold_yellow', label: '바이럴 볼드 (옐로우 + 외곽선)', preset: 'standard', bg: 'transparent', color: '#FFE600', stroke: '#000000' },
  { id: 'clean_white', label: '클린 시네마틱 (화이트 + 소프트 섀도우)', preset: 'standard', bg: 'transparent', color: '#FFFFFF', stroke: 'rgba(0,0,0,0.8)' },
  { id: 'gradient_gold', label: '은혜 골드 (골드 텍스트 + 박스)', preset: 'standard', bg: 'rgba(20,15,5,0.75)', color: '#FFD700', stroke: '#5A4500' }
];

const STUDIO_FONTS = [
  { id: 'sans-serif', name: '기본 고딕' },
  { id: 'MaruBuri', name: '마루부리 명조' },
  { id: 'KyoboHandwriting', name: '교보손글씨 2025' },
  { id: 'NanumPen', name: '나눔손글씨 펜' },
  { id: 'NanumMyeongjo', name: '나눔명조' },
  { id: 'MYArirangGothic', name: '밀양아리랑 고딕' }
];

export default function ReelsStudio({ setActiveScreen = () => {} }) {
  const {
    entities, mediaPool, projectDuration, historyIndex, selectedClipId,
    addMedia, addClipToTrack, updateClip, deleteClip, undo, redo,
    isMagnetic, toggleMagnetic, playhead, setPlayhead, isPlaying, setIsPlaying,
    getAvailableTrackId, selectClip
  } = useNLEStore();

  const { isLoaded, exportProgress, statusText, renderProject } = useExportEngine();
  const [showPrompter, setShowPrompter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [uploadMode, setUploadMode] = useState('sequence');
  const [reelsFrameMode, setReelsFrameMode] = useState(true);
  
  // 모달 상태 관리
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showDuckingModal, setShowDuckingModal] = useState(false);
  const [showGridWallModal, setShowGridWallModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  
  // 🌟 [핵심] 영적 사역 소스 선택 상태 ('auto' | 'qt' | 'sermon' | 'cell' | 'diary')
  const [magicSourceMode, setMagicSourceMode] = useState('auto');

  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg, duration = 2400) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const [captionInput, setCaptionInput] = useState('');
  const [captionStylePreset, setCaptionStylePreset] = useState('sermon_badge');
  const [captionFontFamily, setCaptionFontFamily] = useState('MaruBuri');
  const [captionBadgeText, setCaptionBadgeText] = useState('적용질문');
  const [captionDuration, setCaptionDuration] = useState(4.0);
  const [isFetchingScripture, setIsFetchingScripture] = useState(false);

  const fileInputRef = useRef(null);

  const [duckingSettings, setDuckingSettings] = useState({
    enabled: true,
    reductionDb: -18,
    attackTimeMs: 120,
    releaseTimeMs: 350,
    triggerTracks: ['V1', 'A1'],
    targetTracks: ['A2']
  });

  const [activeGridWallLayout, setActiveGridWallLayout] = useState('single');

  useEffect(() => {
    const checkResolution = () => setIsMobile(window.innerWidth < 820);
    checkResolution();
    window.addEventListener('resize', checkResolution);
    return () => window.removeEventListener('resize', checkResolution);
  }, []);

  // 총 재생 시간 동기화
  useEffect(() => {
    const allClips = Object.values(entities?.clips || {});
    if (allClips.length > 0) {
      const maxEndTime = allClips.reduce((max, c) => Math.max(max, (c.start || 0) + (c.duration || 0)), 0);
      const roundedMax = Math.max(3.5, Math.ceil(maxEndTime * 10) / 10);
      const curDur = projectDuration || 10;
      if (roundedMax > 0 && Math.abs(roundedMax - curDur) > 0.2) {
        useNLEStore.setState({ projectDuration: roundedMax });
      }
    }
  }, [entities?.clips, projectDuration]);

  // 트랙 간 이동 처리 로직
  const moveClipToTrack = useCallback((clipId, targetTrackId) => {
    const state = useNLEStore.getState();
    const currentTracks = { ...state.entities.tracks };
    const currentClips = { ...state.entities.clips };
    const targetClip = currentClips[clipId];
    if (!targetClip) return;

    const clipType = targetClip.type;
    if (clipType === 'audio' && !targetTrackId.startsWith('A')) {
      return showToast('⚠️ 오디오 클립은 A1~A3 트랙으로만 이동 가능합니다.');
    }
    if (clipType === 'text' && !targetTrackId.startsWith('T')) {
      return showToast('⚠️ 자막 클립은 T1~T3 트랙으로만 이동 가능합니다.');
    }
    if ((clipType === 'video' || clipType === 'image') && !targetTrackId.startsWith('V')) {
      return showToast('⚠️ 미디어 클립은 V1~V6 트랙으로만 이동 가능합니다.');
    }

    let sourceTrackId = targetClip.trackId || null;
    if (!sourceTrackId) {
      for (const [tId, track] of Object.entries(currentTracks)) {
        if (track?.clipIds?.includes(clipId)) {
          sourceTrackId = tId;
          break;
        }
      }
    }

    if (sourceTrackId === targetTrackId) return;

    if (sourceTrackId && currentTracks[sourceTrackId]) {
      currentTracks[sourceTrackId] = {
        ...currentTracks[sourceTrackId],
        clipIds: currentTracks[sourceTrackId].clipIds.filter(id => id !== clipId)
      };
    }

    if (!currentTracks[targetTrackId]) {
      const isAudio = targetTrackId.startsWith('A');
      const isText = targetTrackId.startsWith('T');
      currentTracks[targetTrackId] = {
        id: targetTrackId,
        type: isAudio ? 'audio' : isText ? 'text' : 'video',
        name: targetTrackId,
        clipIds: []
      };
    }

    currentTracks[targetTrackId] = {
      ...currentTracks[targetTrackId],
      clipIds: [...(currentTracks[targetTrackId].clipIds || []).filter(id => id !== clipId), clipId]
    };

    currentClips[clipId] = { ...targetClip, trackId: targetTrackId };

    useNLEStore.setState({
      entities: { ...state.entities, tracks: currentTracks, clips: currentClips }
    });

    if (typeof updateClip === 'function') {
      updateClip(clipId, { trackId: targetTrackId });
    }
    showToast(`클립이 ${targetTrackId} 트랙으로 이동되었습니다.`);
  }, [updateClip, showToast]);

  // 스마트 분할 핸들러
  const handleSmartSplit = useCallback(() => {
    const allClips = Object.values(entities?.clips || {});
    let targetClip = selectedClipId ? entities.clips[selectedClipId] : null;

    if (!targetClip) {
      targetClip = allClips.find(c => playhead > c.start && playhead < (c.start + c.duration));
    }

    if (!targetClip) {
      return showToast('분할할 위치의 클립을 선택하거나 바늘을 클립 위로 이동하세요.');
    }

    if (playhead <= targetClip.start || playhead >= (targetClip.start + targetClip.duration)) {
      return showToast('클립의 재생 범위 내부에서만 분할할 수 있습니다.');
    }

    const firstDuration = Number((playhead - targetClip.start).toFixed(3));
    const secondDuration = Number((targetClip.duration - firstDuration).toFixed(3));
    const secondClipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    updateClip(targetClip.id, { duration: firstDuration });

    const trackId = targetClip.trackId || 
      Object.keys(entities.tracks).find(tId => entities.tracks[tId]?.clipIds?.includes(targetClip.id)) || 
      (targetClip.type === 'audio' ? 'A1' : targetClip.type === 'text' ? 'T1' : 'V1');

    addClipToTrack(trackId, {
      ...targetClip,
      id: secondClipId,
      start: playhead,
      duration: secondDuration,
      trackId,
      inPoint: (targetClip.inPoint || targetClip.mediaOffset || 0) + firstDuration,
      mediaOffset: (targetClip.inPoint || targetClip.mediaOffset || 0) + firstDuration
    });

    selectClip(secondClipId);
    showToast('✂️ 클립이 성공적으로 분할되었습니다.');
  }, [entities.clips, entities.tracks, playhead, selectedClipId, updateClip, addClipToTrack, selectClip, showToast]);

  // 재생 토글
  const handleTogglePlay = useCallback(() => {
    const state = useNLEStore.getState();
    const currentHead = state.playhead;
    const maxDur = Math.max(1, state.projectDuration || 10);
    
    if (!state.isPlaying && currentHead >= maxDur - 0.1) {
      setPlayhead(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(!state.isPlaying);
  }, [setIsPlaying, setPlayhead]);

  // 0초 리와인드
  const handleRewindToStart = useCallback(() => {
    setIsPlaying(false);
    setPlayhead(0);
    showToast('⏮ 0초로 이동했습니다.');
  }, [setIsPlaying, setPlayhead, showToast]);

  // 데스크톱 단축키 체계
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
      const isModalOpen = showMagicModal || showDuckingModal || showGridWallModal || showCaptionModal;
      if (isInput || isModalOpen) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const cur = useNLEStore.getState().selectedClipId;
        if (cur) {
          e.preventDefault();
          deleteClip(cur);
          showToast('클립이 삭제되었습니다.');
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ProjectSerializer.exportProject();
        showToast('💾 프로젝트가 저장되었습니다.');
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleSmartSplit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteClip, undo, redo, handleSmartSplit, handleTogglePlay, showMagicModal, showDuckingModal, showGridWallModal, showCaptionModal, showToast]);

  const selectedClip = selectedClipId ? entities.clips[selectedClipId] : null;

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let currentVIndex = 1;
    const currentClips = Object.values(entities?.clips || {});
    const hasVisualClips = currentClips.some(c => c.type === 'video' || c.type === 'image');
    
    let sequenceCursor = hasVisualClips ? playhead : 0;
    if (hasVisualClips && playhead >= (projectDuration || 10) - 0.2) {
      sequenceCursor = currentClips.reduce((max, c) => Math.max(max, (c.start || 0) + (c.duration || 0)), 0);
    }

    const state = useNLEStore.getState();
    const updatedTracks = JSON.parse(JSON.stringify(state.entities.tracks || {}));
    const updatedClips = { ...(state.entities.clips || {}) };

    showToast(`미디어 ${files.length}개 업로드 및 디코딩 중...`);

    for (const f of files) {
      const isVideo = f.type.startsWith('video');
      const isAudio = f.type.startsWith('audio');
      const type = isVideo ? 'video' : isAudio ? 'audio' : 'image';
      const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      let savedResult;
      try {
        savedResult = await storageEngine.saveMedia(f, mediaId);
      } catch (_) {
        savedResult = {
          url: URL.createObjectURL(f),
          duration: type === 'image' ? 3.5 : 5.0,
          type,
          name: f.name
        };
      }

      const fileUrl = savedResult.url;
      const measuredDuration = savedResult.duration || (type === 'image' ? 3.5 : 5.0);

      const mediaItem = {
        id: mediaId,
        file: f,
        url: fileUrl,
        name: f.name,
        type,
        duration: measuredDuration
      };

      addMedia([mediaItem]);

      if (type !== 'audio') {
        const trackId = uploadMode === 'stack' ? `V${currentVIndex}` : 'V1';
        if (!updatedTracks[trackId]) {
          updatedTracks[trackId] = { id: trackId, name: trackId, type: 'video', clipIds: [] };
        }
        if (!updatedTracks[trackId].clipIds) updatedTracks[trackId].clipIds = [];

        const startPos = uploadMode === 'stack' ? playhead : sequenceCursor;

        const newClip = {
          id: clipId,
          mediaId,
          url: fileUrl,
          type,
          name: f.name,
          start: startPos,
          duration: measuredDuration,
          inPoint: 0,
          mediaOffset: 0,
          speed: 1.0,
          scaling: 'fill',
          scale: 100,
          positionX: 0,
          positionY: 0,
          opacity: 100,
          transform: { x: 0, y: 0, scale: 100, rotate: 0 },
          crop: { left: 0, right: 0, top: 0, bottom: 0 },
          gridConfig: { mode: 'single', rows: 2, cols: 2, gap: 4 },
          color: { lift: 0, gamma: 100, gain: 100, saturation: 100, temperature: 6500, tint: 0 },
          animation: 'none',
          transition: 'none',
          trackId
        };

        updatedTracks[trackId].clipIds.push(clipId);
        updatedClips[clipId] = newClip;

        if (uploadMode === 'stack') {
          currentVIndex = (currentVIndex % 4) + 1;
        } else {
          sequenceCursor += measuredDuration;
        }
      } else {
        const trackId = 'A1';
        if (!updatedTracks[trackId]) {
          updatedTracks[trackId] = { id: trackId, name: trackId, type: 'audio', clipIds: [] };
        }
        if (!updatedTracks[trackId].clipIds) updatedTracks[trackId].clipIds = [];

        const newClip = {
          id: clipId,
          mediaId,
          url: fileUrl,
          type: 'audio',
          name: f.name,
          start: playhead,
          duration: measuredDuration,
          inPoint: 0,
          mediaOffset: 0,
          volume: 100,
          trackId
        };

        updatedTracks[trackId].clipIds.push(clipId);
        updatedClips[clipId] = newClip;
      }
    }

    useNLEStore.setState({
      entities: { ...state.entities, tracks: updatedTracks, clips: updatedClips }
    });

    setPlayhead(0);
    setIsPlaying(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast(`✨ 미디어 ${files.length}개가 타임라인에 등록되었습니다.`);
  }, [addMedia, entities, playhead, projectDuration, uploadMode, setPlayhead, setIsPlaying, showToast]);

  // 자동 순차 정렬
  const handleAutoSequenceAllClips = useCallback(() => {
    const state = useNLEStore.getState();
    const clips = Object.values(state.entities.clips || {}).filter(
      c => c.type === 'video' || c.type === 'image'
    );
    if (clips.length === 0) return showToast('시퀀스를 구성할 사진이나 영상이 없습니다.');

    const sortedClips = [...clips].sort((a, b) => {
      if ((a.start || 0) !== (b.start || 0)) return (a.start || 0) - (b.start || 0);
      return (a.id || '').localeCompare(b.id || '');
    });

    let cursor = 0;
    const defaultDuration = 3.5;
    sortedClips.forEach((c, idx) => {
      const clipDur = c.duration || defaultDuration;
      updateClip(c.id, {
        start: cursor,
        duration: clipDur,
        trackId: 'V1',
        scaling: 'fill',
        scale: 100,
        positionX: 0,
        positionY: 0,
        transform: { x: 0, y: 0, scale: 100, rotate: 0 },
        animation: idx % 2 === 0 ? 'zoomIn' : 'slideUp'
      });
      cursor += clipDur;
    });

    useNLEStore.setState({ projectDuration: Math.max(cursor, 3.5), playhead: 0, isPlaying: false });
    showToast(`🎞️️ 총 ${sortedClips.length}장의 사진이 0초부터 ${cursor.toFixed(1)}초까지 순차 정렬되었습니다.`);
  }, [updateClip, showToast]);

  // 비디오월 레이아웃 적용
  const applyVideoWallLayout = useCallback((mode) => {
    setActiveGridWallLayout(mode);
    const state = useNLEStore.getState();
    const allVideoClips = Object.values(state.entities.clips || {}).filter(c => c.type === 'video' || c.type === 'image');
    if (allVideoClips.length === 0) return showToast('배치할 영상이나 사진이 없습니다.');

    const targetClipId = state.selectedClipId || allVideoClips[0]?.id;
    if (!targetClipId) return;

    let gridConfig = { mode: 'matrix', rows: 2, cols: 2, gap: 4 };

    if (mode === 'single') {
      gridConfig = { mode: 'single', rows: 1, cols: 1, gap: 0 };
    } else if (mode === 'split-vertical') {
      gridConfig = { mode: 'matrix', rows: 2, cols: 1, gap: 4 };
    } else if (mode === 'split-triple') {
      gridConfig = { mode: 'matrix', rows: 3, cols: 1, gap: 4 };
    } else if (mode === 'grid-4') {
      gridConfig = { mode: 'matrix', rows: 2, cols: 2, gap: 4 };
    } else if (mode === 'pip') {
      gridConfig = { mode: 'single' };
    }

    const totalSlots = (gridConfig.rows || 1) * (gridConfig.cols || 1);
    const cellMedia = {};
    for (let i = 0; i < totalSlots; i++) {
      cellMedia[i] = allVideoClips[i % allVideoClips.length]?.url || allVideoClips[0]?.url;
    }
    gridConfig.cellMedia = cellMedia;

    updateClip(targetClipId, {
      gridConfig,
      scaling: 'fill',
      scale: 100,
      positionX: 0,
      positionY: 0,
      transform: { x: 0, y: 0, scale: 100, rotate: 0 },
      crop: { left: 0, right: 0, top: 0, bottom: 0 }
    });

    setShowGridWallModal(false);
    showToast(`📐 그리드 레이아웃(${mode})이 적용되었습니다.`);
  }, [updateClip, showToast]);

  // 🌟 [핵심] 사역 DB 연동 자율형 AI 릴스 오케스트레이션 실행 파이프라인
  const runMagicAction = useCallback(async (actionType, stylePresetKey = 'HOLY_CINEMATIC', chosenSource = magicSourceMode) => {
    const allClips = Object.values(entities?.clips || {});
    if (allClips.length === 0 && (mediaPool?.length || 0) === 0) {
      return showToast('편집할 영상이나 사진을 먼저 등록해주세요.');
    }

    if (actionType === 'all' || actionType === 'blockbuster') {
      setShowMagicModal(false);
      showToast('🎬 사역 데이터 연동 블록버스터 릴스 오케스트레이션 실행 중...');
      try {
        const result = await BlockbusterDirectorEngine.directBlockbusterReels({
          stylePreset: stylePresetKey,
          sourceMode: chosenSource,
          scriptureQuery: captionInput.trim(),
          onProgress: (pct, msg) => showToast(msg)
        });
        showToast(`✨ [${result.badge || '사역'}: ${result.hook || '은혜'}] 릴스 제작 완료!`);
      } catch (err) {
        showToast('연출 오류: ' + err.message);
      }
      return;
    }

    if (actionType === 'reframe') {
      await aiVisionEngine.autoReframeAllClips();
      showToast('📐 피사체 중심 9:16 스마트 리프레이밍 완료');
    } else if (actionType === 'beat') {
      await BeatSyncEngine.analyzeAndAutoSync();
      showToast('🎵 10ms 단위 비트 칼박 점프컷 정렬 완료');
    } else if (actionType === 'grade') {
      allClips.filter(c => c.type === 'video' || c.type === 'image').forEach(c => {
        updateClip(c.id, {
          filterPreset: 'tealAndOrange',
          color: { lift: -4, gamma: 110, gain: 108, saturation: 125, temperature: 6200, tint: 4 }
        });
      });
      showToast('🎨 할리우드 틸 앤 오렌지 필름 룩 적용 완료');
    } else if (actionType === 'hook') {
      const firstClip = allClips.find(c => c.start === 0 && (c.type === 'video' || c.type === 'image'));
      if (firstClip) {
        updateClip(firstClip.id, {
          scale: 114,
          transform: { ...(firstClip.transform || {}), scale: 114, x: 0, y: 0 },
          animation: 'popIn',
          transition: 'filmBurn'
        });
      }
      showToast('🎯 3초 바이럴 펀치 후크 연출 완료');
    }

    setShowMagicModal(false);
  }, [entities?.clips, mediaPool, captionInput, magicSourceMode, updateClip, showToast]);

  // 스마트 오디오 더킹 DSP 적용
  const handleApplyDuckingSettings = () => {
    const state = useNLEStore.getState();
    const a2Track = state.entities.tracks['A2'];
    if (a2Track && a2Track.clipIds) {
      a2Track.clipIds.forEach(cId => {
        updateClip(cId, {
          autoDucking: duckingSettings.enabled,
          duckingAmount: duckingSettings.reductionDb,
          duckingAttack: duckingSettings.attackTimeMs,
          duckingRelease: duckingSettings.releaseTimeMs
        });
      });
    }

    if (typeof audioDSP?.setDucking === 'function') {
      audioDSP.setDucking(duckingSettings.enabled, 'A2', duckingSettings.reductionDb);
    }

    setShowDuckingModal(false);
    showToast('🎛️ 오디오 더킹 DSP 설정이 적용되었습니다.');
  };

  // 내보내기 렌더러 트리거
  const handleExport = useCallback(() => {
    if (!isLoaded) return showToast('렌더링 엔진 로딩 중입니다. 잠시 후 시도하세요.');
    
    const targetElement = document.querySelector('canvas') || document.querySelector('[data-cinema-viewport]') || document.querySelector('video');
    if (!targetElement) return showToast('렌더링할 화면 요소를 찾을 수 없습니다.');
    
    renderProject(targetElement, null, projectDuration);
  }, [isLoaded, projectDuration, renderProject, showToast]);

  const handleAddText = useCallback(() => {
    setShowCaptionModal(true);
  }, []);

  // 자막/성경 구절 생성 확정
  const handleConfirmAddCaption = async () => {
    if (!captionInput.trim()) return showToast('자막 또는 성경 구절을 입력하세요.');

    setIsFetchingScripture(true);
    try {
      const processedText = await checkAndFetchScripture(captionInput.trim());
      const targetTrackId = getAvailableTrackId('text', playhead, captionDuration) || 'T1';
      const selectedStyle = REELS_CAPTION_STYLES.find(s => s.id === captionStylePreset) || REELS_CAPTION_STYLES[0];

      addClipToTrack(targetTrackId, {
        content: processedText,
        type: 'text',
        start: playhead,
        duration: Number(captionDuration) || 4.0,
        trackId: targetTrackId,
        style: {
          fontSize: 22,
          preset: selectedStyle.preset || 'standard',
          badgeText: captionBadgeText || '적용질문',
          fontFamily: captionFontFamily || 'MaruBuri',
          color: selectedStyle.color,
          strokeWidth: 2.5,
          strokeColor: selectedStyle.stroke,
          backgroundColor: selectedStyle.bg,
          align: 'center',
          lineHeight: 1.35
        },
        transform: { x: 0, y: 0, scale: 100, rotate: 0 },
        animation: 'popIn'
      });

      setCaptionInput('');
      setShowCaptionModal(false);
      showToast('💬 새 자막이 타임라인에 배치되었습니다.');
    } catch (e) {
      showToast('자막 생성 실패: ' + e.message);
    } finally {
      setIsFetchingScripture(false);
    }
  };

  const commonProps = useMemo(() => ({
    setActiveScreen,
    mediaPool,
    handleFileUpload,
    fileInputRef,
    selectedClip,
    handleAddText,
    applyGraceTemplate,
    setShowPrompter,
    splitClip: handleSmartSplit,
    deleteClip,
    selectedClipId,
    moveClipToTrack,
    updateClip,
    uploadMode,
    setUploadMode,
    reelsFrameMode,
    setReelsFrameMode,
    handleMagicWandAutoEdit: () => setShowMagicModal(true),
    handleOpenDuckingModal: () => setShowDuckingModal(true),
    handleOpenGridWallModal: () => setShowGridWallModal(true),
    duckingSettings,
    activeGridWallLayout,
    applyVideoWallLayout,
    handleExport,
    undo,
    redo,
    historyIndex,
    isMagnetic,
    toggleMagnetic,
    handleAutoSequenceAllClips,
    handleTogglePlay,
    handleRewindToStart,
    playhead,
    setPlayhead,
    isPlaying,
    setIsPlaying,
    projectDuration
  }), [
    setActiveScreen, mediaPool, handleFileUpload, selectedClip, handleAddText,
    handleSmartSplit, deleteClip, selectedClipId, moveClipToTrack, updateClip,
    uploadMode, reelsFrameMode, duckingSettings, activeGridWallLayout,
    applyVideoWallLayout, handleExport, undo, redo, historyIndex, isMagnetic, toggleMagnetic,
    handleAutoSequenceAllClips, handleTogglePlay, handleRewindToStart, playhead, setPlayhead, isPlaying, setIsPlaying, projectDuration
  ]);

  return (
    <div className="w-full h-full flex flex-col bg-[#08090C] text-zinc-100 font-sans select-none overflow-hidden text-xs relative">
      
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-zinc-900/90 text-white font-bold text-xs rounded-full border border-white/20 shadow-2xl backdrop-blur-md pointer-events-none animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 1. AI DIRECTING STUDIO PRO (앱 내부 사역 DB 연동 선택 모달) */}
      {showMagicModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-lg bg-[#11131A] border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto hide-scrollbar">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#C59B51]/20 text-[#C59B51]"><SvgMagicWand /></span>
                <div>
                  <h3 className="text-sm font-black text-white">AI MINISTRY REELS DIRECTOR 2.0</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">AUTONOMOUS SPIRITUAL ASSETS SCANNER</span>
                </div>
              </div>
              <button onClick={() => setShowMagicModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer"><SvgClose /></button>
            </div>

            {/* 🌟 [신규] 영적 사역 데이터 소스 연동 셀렉터 */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-[#00E5FF] font-black tracking-wider">
                  1. 영적 사역 데이터 소스 (MINISTRY CONTEXT SOURCE)
                </span>
                <span className="text-[9.5px] text-zinc-500 font-bold">우리 앱 DB 1000% 연동</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {[
                  { id: 'auto', label: '⚡ 스마트 자동', desc: '오늘 작성 기록 감지' },
                  { id: 'qt', label: '🌿 오늘 나의 QT', desc: '황금구절 & 한줄은혜' },
                  { id: 'sermon', label: '🏛️ 주일 강단설교', desc: '나를 찌른 말씀·3대지' },
                  { id: 'cell', label: '💌 목장 감사나눔', desc: '감사피드 & 모임지' },
                ].map(src => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setMagicSourceMode(src.id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      magicSourceMode === src.id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white shadow-sm ring-1 ring-[#00E5FF]/50'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[11px] font-black block text-white">{src.label}</span>
                    <span className="text-[9px] text-zinc-400 block truncate">{src.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🌟 2. 헐리우드 극장판 스타일 선택 & 즉시 실행 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-wider block">
                2. 헐리우드 시네마틱 스타일 선택 & 1-클릭 실행
              </span>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => runMagicAction('blockbuster', 'HOLY_CINEMATIC', magicSourceMode)}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/80 via-[#0e3b5e]/90 to-cyan-900/80 border border-[#00E5FF]/50 text-white font-bold text-left flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-[#00E5FF]"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="text-xs font-black text-[#00E5FF] flex items-center gap-1.5">
                      <span>🎬 신성한 영화 예고편 (Holy Cinematic)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-cyan-200 border border-[#00E5FF]/30 font-mono">BRAAM SFX</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 leading-tight">
                      2.35:1 레터박스 + 틸&오렌지 + 인셉션 브람 타격음 + 오로라 앰비언트 + 코닥 헐레이션
                    </div>
                  </div>
                  <span className="text-base text-[#00E5FF] font-black">▶</span>
                </button>

                <button
                  onClick={() => runMagicAction('blockbuster', 'EPIC_TRAILER', magicSourceMode)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 via-amber-950/80 to-zinc-900 border border-rose-500/40 text-white font-bold text-left flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-rose-400"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                      <span>⚡ 에픽 할리우드 임팩트 (Epic Impact)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 font-mono">SUB-DROP</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 leading-tight">
                      블리치 바이패스 + 서브우퍼 붐 타격 + 줌 블러 + 3D 플립 + 텐션 라이저
                    </div>
                  </div>
                  <span className="text-base text-rose-300 font-black">▶</span>
                </button>

                <button
                  onClick={() => runMagicAction('blockbuster', 'VIRAL_REELS_PRO', magicSourceMode)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 via-yellow-950/80 to-zinc-900 border border-yellow-500/40 text-white font-bold text-left flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-yellow-400"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>🚀 바이럴 릴스 프로 100만뷰 (Viral Hook)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 font-mono">3초 펀치</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 leading-tight">
                      상단 미니멀 타이틀 + 네온 글로우 + 코닥 골드 + 시네마틱 몽타주 분할
                    </div>
                  </div>
                  <span className="text-base text-amber-300 font-black">▶</span>
                </button>

                <button
                  onClick={() => runMagicAction('blockbuster', 'GRACE_SANCTUARY', magicSourceMode)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-zinc-900 border border-emerald-500/40 text-white font-bold text-left flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-emerald-400"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <span>🕊️ 따뜻한 은혜 다큐 (Warm Sanctuary)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-mono">35mm VINTAGE</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 leading-tight">
                      35mm 아날로그 필름 번 + 앰비언트 더스트 + 손글씨 감성 뱃지 + 소프트 디졸브
                    </div>
                  </div>
                  <span className="text-base text-emerald-300 font-black">▶</span>
                </button>
              </div>
            </div>

            {/* 보조 원클릭 도구들 */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 font-bold block">INDIVIDUAL AI MACROS</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setShowMagicModal(false); handleAutoSequenceAllClips(); }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] text-left cursor-pointer"
                >
                  🎞️ 사진 전원 순차 나열
                </button>
                <button
                  onClick={() => runMagicAction('reframe')}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] text-left cursor-pointer"
                >
                  📐 9:16 스마트 리프레이밍
                </button>
                <button
                  onClick={() => runMagicAction('beat')}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] text-left cursor-pointer"
                >
                  🎵 10ms 비트 칼박 점프컷
                </button>
                <button
                  onClick={() => runMagicAction('hook')}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] text-left cursor-pointer"
                >
                  🎯 3초 바이럴 펀치 후크
                </button>
              </div>
            </div>

            <button onClick={() => setShowMagicModal(false)} className="w-full py-2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer">
              창 닫기
            </button>
          </div>
        </div>
      )}

      {/* 2. SMART AUDIO DUCKING DSP 모달 */}
      {showDuckingModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-md bg-[#13151D] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"><SvgVolumeDucking /></span>
                <div>
                  <h3 className="text-sm font-black text-white">SMART AUDIO DUCKING DSP</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">AUTOMATIC BGM ATTENUATION</span>
                </div>
              </div>
              <button onClick={() => setShowDuckingModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer"><SvgClose /></button>
            </div>

            <div className="space-y-3.5 bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-white block">스마트 더킹 엔진 활성화</span>
                  <span className="text-[10px] text-zinc-400">목회자/나레이션 음성 감지 시 BGM 자동 감쇄</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={duckingSettings.enabled} 
                  onChange={e => setDuckingSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-zinc-400">BGM 볼륨 감쇄량 (Gain Reduction)</span>
                  <span className="text-[#00E5FF] font-mono">{duckingSettings.reductionDb} dB</span>
                </div>
                <input 
                  type="range" 
                  min="-36" 
                  max="-6" 
                  step="1"
                  value={duckingSettings.reductionDb}
                  onChange={e => setDuckingSettings(prev => ({ ...prev, reductionDb: Number(e.target.value) }))}
                  className="w-full accent-[#00E5FF] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10.5px]">
                <div>
                  <span className="text-zinc-400 block mb-1">어택 타임 (Attack)</span>
                  <span className="font-mono text-white font-bold">{duckingSettings.attackTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">릴리즈 타임 (Release)</span>
                  <span className="font-mono text-white font-bold">{duckingSettings.releaseTimeMs} ms</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleApplyDuckingSettings}
              className="w-full py-3 rounded-xl bg-[#00E5FF] text-black font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
            >
              설정 저장 및 오디오 트랙 적용
            </button>
          </div>
        </div>
      )}

      {/* 3. VIDEO WALL GRID STUDIO 모달 */}
      {showGridWallModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-lg bg-[#13151D] border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto hide-scrollbar">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-[#00E5FF]"><SvgGridWall /></span>
                <div>
                  <h3 className="text-sm font-black text-white">VIDEO WALL GRID STUDIO</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">네이티브 9:16 매트릭스 분할</span>
                </div>
              </div>
              <button onClick={() => setShowGridWallModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer"><SvgClose /></button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-mono text-zinc-400 font-bold block">QUICK TEMPLATES</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'single', name: '단일 9:16', desc: '1개 전체' },
                  { id: 'split-vertical', name: '상/하 2분할', desc: '2등분 꽉 채움' },
                  { id: 'split-triple', name: '3단 스택', desc: '3등분 꽉 채움' },
                  { id: 'grid-4', name: '4분할 쿼드', desc: '2×2 꽉 채움' },
                  { id: 'pip', name: 'PIP 오버레이', desc: '화면 속 화면' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => applyVideoWallLayout(item.id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      activeGridWallLayout === item.id 
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white shadow-sm' 
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-xs block text-white">{item.name}</span>
                    <span className="text-[9.5px] text-zinc-500 block truncate">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowGridWallModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
            >
              설정 완료 및 닫기
            </button>
          </div>
        </div>
      )}

      {/* 4. PRO REELS CAPTION & SCRIPTURE STUDIO 모달 */}
      {showCaptionModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-lg bg-[#13151D] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto hide-scrollbar">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#00E5FF]/20 text-[#00E5FF]"><SvgText /></span>
                <div>
                  <h3 className="text-sm font-black text-white">REELS CAPTION & SCRIPTURE</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">AUTO SCRIPTURE PARSER & STYLER</span>
                </div>
              </div>
              <button onClick={() => setShowCaptionModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer"><SvgClose /></button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold text-zinc-400 block">원클릭 성경 구절 자동 검색:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SCRIPTURE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setCaptionInput(p.code)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[#00E5FF] text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold text-zinc-400 block">자막 문구 또는 성경 장절:</span>
              <textarea
                rows={3}
                value={captionInput}
                onChange={e => setCaptionInput(e.target.value)}
                placeholder="예: 요 3:16 또는 오늘 설교 말씀의 핵심 나눔 질문을 입력하세요..."
                className="w-full p-3 bg-black/50 border border-white/15 rounded-xl text-white text-xs leading-relaxed outline-none focus:border-[#00E5FF] transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold text-zinc-400 block">서체 (Font Family):</span>
              <div className="grid grid-cols-3 gap-1.5">
                {STUDIO_FONTS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCaptionFontFamily(f.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      captionFontFamily === f.id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] font-black shadow-xs'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span style={{ fontFamily: f.id }} className="text-xs truncate block">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold text-zinc-400 block">릴스 자막 스타일 프리셋:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {REELS_CAPTION_STYLES.map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setCaptionStylePreset(style.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      captionStylePreset === style.id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white shadow-sm font-black'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] block">{style.label}</span>
                    {captionStylePreset === style.id && <span className="text-[#00E5FF]">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {captionStylePreset === 'sermon_badge' && (
              <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-sky-500/30">
                <span className="text-[10px] font-bold text-sky-400 block">상단 뱃지 텍스트:</span>
                <input
                  type="text"
                  value={captionBadgeText}
                  onChange={e => setCaptionBadgeText(e.target.value)}
                  placeholder="적용질문"
                  className="w-full px-2.5 py-1.5 bg-black border border-white/20 rounded-lg text-white font-bold text-xs outline-none focus:border-[#00E5FF]"
                />
              </div>
            )}

            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10 text-xs">
              <span className="text-zinc-400 font-bold">노출 지속 시간:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.5"
                  value={captionDuration}
                  onChange={e => setCaptionDuration(e.target.value)}
                  className="w-16 px-2 py-1 bg-black border border-white/20 rounded text-right font-bold text-white outline-none"
                />
                <span className="text-zinc-400">초</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCaptionModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isFetchingScripture || !captionInput.trim()}
                onClick={handleConfirmAddCaption}
                className="flex-2 py-2.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:opacity-90 text-black font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-40"
              >
                {isFetchingScripture ? '성경 구절 검색 중...' : '타임라인에 자막 생성'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. H.264 하드웨어 가속 인코딩 프로그레스 */}
      {exportProgress > 0 && (
        <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 select-none animate-fade-in">
          <div className="w-full max-w-sm bg-[#161821] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <span className="font-bold text-xs text-[#00E5FF] uppercase font-mono tracking-wider block">H.264 REELS HARDWARE ENCODING</span>
            <div className="text-4xl font-black text-white font-mono">{exportProgress}%</div>
            <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-[#00E5FF] to-blue-600 transition-all duration-150 rounded-full" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-xs text-zinc-400 font-mono truncate">{statusText || '고해상도 캔버스 프레임 인코딩 중...'}</p>
          </div>
        </div>
      )}

      {/* 6. 메인 작업 레이아웃 분기 (모바일 / 데스크톱) */}
      {isMobile ? (
        <MobileLayout {...commonProps} />
      ) : (
        <DesktopLayout {...commonProps} />
      )}

      {/* 7. 텔레프롬프터 */}
      {showPrompter && (
        <Teleprompter 
          scriptText="오늘 전하는 메시지가 많은 이들에게 큰 울림과 평안으로 전달되기를 소망합니다." 
          onClose={() => setShowPrompter(false)} 
        />
      )}
    </div>
  );
}
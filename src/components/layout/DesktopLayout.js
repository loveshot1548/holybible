// src/components/layout/DesktopLayout.js
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import CinemaCanvas from '../viewer/CinemaCanvas';
import TimelineVirtualizer from '../timeline/TimelineVirtualizer';
import FairlightMixer from '../timeline/FairlightMixer';
import GridSettings from '../inspector/GridSettings';
import ColorWheels from '../inspector/ColorWheels';
import TextAnimator from '../inspector/TextAnimator';
import AudioInspector from '../inspector/AudioInspector';
import CaptionManager from '../inspector/CaptionManager';
import EffectsInspector from '../inspector/EffectsInspector';
import DrawMaskOverlay from '../viewer/DrawMaskOverlay';
import { ProjectSerializer } from '../../engine/ProjectSerializer';
import { BeatSyncEngine } from '../../engine/BeatSyncEngine';

export default function DesktopLayout({
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
  isMagnetic,
  toggleMagnetic,
  updateClip,
  uploadMode,
  setUploadMode,
  reelsFrameMode,
  setReelsFrameMode,
  handleMagicWandAutoEdit,
  handleOpenDuckingModal,
  handleOpenGridWallModal,
  // 🌟 모달 에러 방지를 위한 완전한 duckingSettings 기본값 주입
  duckingSettings = { enabled: false, reductionDb: -18, attackTimeMs: 120, releaseTimeMs: 350 },
  activeGridWallLayout = 'single',
  applyVideoWallLayout,
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
    addClipToTrack, 
    addTrack, 
    entities,
    selectClip
  } = useNLEStore();

  // 우측 인스펙터 마스터 6대 탭: [속성 | 그리드 | 색보정 | 효과 | 자막 | 오디오]
  const [activeInspectorTab, setActiveInspectorTab] = useState('properties');
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [mediaFilterType, setMediaFilterType] = useState('all');

  const executeRewind = useCallback(() => {
    if (typeof handleRewindToStart === 'function') {
      handleRewindToStart();
    } else {
      setIsPlaying(false);
      setPlayhead(0);
    }
  }, [handleRewindToStart, setIsPlaying, setPlayhead]);

  const executeTogglePlay = useCallback(() => {
    if (typeof handleTogglePlay === 'function') {
      handleTogglePlay();
    } else {
      const maxDur = Math.max(1, projectDuration || 10);
      if (!isPlaying && playhead >= maxDur - 0.1) {
        setPlayhead(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  }, [handleTogglePlay, isPlaying, playhead, projectDuration, setIsPlaying, setPlayhead]);

  const stepFrame = useCallback((direction) => {
    const frameTime = 1 / 30;
    const maxDur = Math.max(1, projectDuration || 10);
    const target = direction === 'forward' 
      ? Math.min(maxDur, playhead + frameTime) 
      : Math.max(0, playhead - frameTime);
    setPlayhead(target);
  }, [playhead, projectDuration, setPlayhead]);

  const formatTimecode = (sec) => {
    const s = Math.max(0, sec || 0);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const remSec = Math.floor(s % 60).toString().padStart(2, '0');
    const frames = Math.floor((s % 1) * 30).toString().padStart(2, '0');
    return `${m}:${remSec}:${frames}`;
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
    return ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  }, [selectedClip]);

  // 🌟 [핵심 개선] 트랙 이동 시 미디어 타입 엄격 검증 및 스토어 동기화 로직 보강
  const handleMoveClipToTrack = (targetTrackId) => {
    if (!selectedClipId) return;
    const state = useNLEStore.getState();
    const tracks = { ...state.entities.tracks };
    const clips = { ...state.entities.clips };
    const targetClip = clips[selectedClipId];
    if (!targetClip) return;

    // 미디어 타입에 따른 타겟 트랙 허용 여부 철저 검증
    if (targetClip.type === 'audio' && !targetTrackId.startsWith('A')) return alert('오디오 클립은 A1~A3 오디오 트랙으로만 이동 가능합니다.');
    if (targetClip.type === 'text' && !targetTrackId.startsWith('T')) return alert('자막 클립은 T1~T3 자막 트랙으로만 이동 가능합니다.');
    if ((targetClip.type === 'video' || targetClip.type === 'image') && !targetTrackId.startsWith('V')) return alert('영상/사진 클립은 V1~V6 비디오 트랙으로만 이동 가능합니다.');

    let sourceTrackId = currentTrackOfSelectedClip;
    if (sourceTrackId === targetTrackId) return;

    // 기존 트랙에서 제거
    if (sourceTrackId && tracks[sourceTrackId]) {
      tracks[sourceTrackId] = {
        ...tracks[sourceTrackId],
        clipIds: tracks[sourceTrackId].clipIds.filter(id => id !== selectedClipId)
      };
    }

    // 새 트랙 생성 혹은 기존 트랙에 삽입
    if (!tracks[targetTrackId]) {
      const isAudio = targetTrackId.startsWith('A');
      const isText = targetTrackId.startsWith('T');
      tracks[targetTrackId] = {
        id: targetTrackId,
        type: isAudio ? 'audio' : isText ? 'text' : 'video',
        name: targetTrackId,
        clipIds: []
      };
    }

    tracks[targetTrackId] = {
      ...tracks[targetTrackId],
      clipIds: [...(tracks[targetTrackId].clipIds || []).filter(id => id !== selectedClipId), selectedClipId]
    };

    clips[selectedClipId] = {
      ...targetClip,
      trackId: targetTrackId
    };

    useNLEStore.setState({ entities: { ...state.entities, tracks, clips } });

    if (typeof updateClip === 'function') {
      updateClip(selectedClipId, { trackId: targetTrackId });
    }
  };

  // 🌟 [핵심 개선] 미디어 타임라인 추가 시 겹침 방지 스태킹 알고리즘 및 빈 구간 탐색
  const handleAddMediaToTimeline = (mediaItem) => {
    const state = useNLEStore.getState();
    const isAudio = mediaItem.type === 'audio';

    let targetTrack = 'V1';
    let startPos = playhead;
    const itemDuration = mediaItem.duration || 3.5;

    if (isAudio) {
      targetTrack = 'A1';
    } else if (uploadMode === 'stack') {
      // 레이어 모드: 플레이헤드 위치에서 V1~V6 중 클립이 겹치지 않는 빈 트랙 탐색
      const vTracks = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
      let foundEmptyTrack = null;

      for (const tId of vTracks) {
        const trackClips = (state.entities.tracks[tId]?.clipIds || []).map(cId => state.entities.clips[cId]).filter(Boolean);
        const hasOverlap = trackClips.some(c => {
          const cStart = c.start || 0;
          const cEnd = cStart + (c.duration || 3.5);
          return (startPos < cEnd && startPos + itemDuration > cStart);
        });

        if (!hasOverlap) {
          foundEmptyTrack = tId;
          break;
        }
      }
      targetTrack = foundEmptyTrack || 'V6';
    } else {
      // 순차 모드: V1 트랙의 가장 마지막 클립 뒤에 이어붙이기
      targetTrack = 'V1';
      const clipsOnV1 = (state.entities.tracks['V1']?.clipIds || [])
        .map(id => state.entities.clips[id])
        .filter(Boolean);
      if (clipsOnV1.length > 0) {
        const maxEnd = clipsOnV1.reduce((max, c) => Math.max(max, (c.start || 0) + (c.duration || 3.5)), 0);
        if (maxEnd > playhead) startPos = maxEnd;
      }
    }

    if (!state.entities.tracks[targetTrack]) {
      if (typeof addTrack === 'function') addTrack(isAudio ? 'audio' : 'video');
    }

    addClipToTrack(targetTrack, {
      mediaId: mediaItem.id,
      url: mediaItem.url,
      type: mediaItem.type,
      name: mediaItem.name,
      start: startPos,
      duration: itemDuration,
      speed: 1.0,
      scaling: 'fill',
      scale: 100,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 100,
      transform: { x: 0, y: 0, scale: 100, rotate: 0 },
      crop: { left: 0, right: 0, top: 0, bottom: 0 },
      gridConfig: { mode: 'single', rows: 2, cols: 2, gap: 4 },
      color: { lift: 0, gamma: 100, gain: 100, saturation: 100 },
      animation: 'none',
      transition: 'none'
    });
  };

  const handleAutoBeatCut = async () => {
    await BeatSyncEngine.analyzeAndAutoSync();
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

  const filteredMediaPool = useMemo(() => {
    if (!mediaPool) return [];
    if (mediaFilterType === 'all') return mediaPool;
    return mediaPool.filter(m => m.type === mediaFilterType);
  }, [mediaPool, mediaFilterType]);

  // 🌟 [핵심 개선] 입력 필드 포커스 시 단축키 동작 100% 억제 및 분할(Split) 액션 보완
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 텍스트 인풋, 텍스트에어리어, contenteditable 등 타이핑 중엔 무조건 억제
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      
      if (isInputFocused) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const storeState = useNLEStore.getState();
        if (storeState.selectedClipId && typeof deleteClip === 'function') {
          e.preventDefault();
          deleteClip(storeState.selectedClipId);
          if (typeof selectClip === 'function') selectClip(null);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ProjectSerializer.exportProject();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      if (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (typeof splitClip === 'function') splitClip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteClip, undo, redo, handleTogglePlay, splitClip, selectClip]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0C0E] text-zinc-100 text-sm font-sans select-none relative">
      
      {/* =====================================================================
          1. 상단 마스터 네비게이션 헤더
          ===================================================================== */}
      <header className="h-11 px-3 bg-[#13151B] border-b border-white/10 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveScreen ? setActiveScreen('home') : null}
            title="홈 화면으로 나가기"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs border border-white/10 cursor-pointer transition-colors"
          >
            ✕
          </button>

          <span className="font-mono font-black text-xs text-[#00E5FF] tracking-wider">REELS STUDIO PRO</span>
          <span className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* 9:16 프레임 가이드 스위처 */}
          <button
            onClick={() => setReelsFrameMode(!reelsFrameMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              reelsFrameMode ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] shadow-2xs' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            9:16 프레임 {reelsFrameMode ? 'ON' : 'OFF'}
          </button>

          {/* AI 마법봉 릴스 디렉터 */}
          <button
            onClick={handleMagicWandAutoEdit}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#C59B51] to-amber-600 text-black text-xs font-black cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            🪄 마법봉 AI 디렉터
          </button>

          {/* 스마트 오디오 더킹 DSP */}
          <button
            onClick={handleOpenDuckingModal}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
              duckingSettings?.enabled 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
            title="목회자 음성 인식 BGM 자동 감쇠 엔진"
          >
            🎛️ 오디오 더킹 {duckingSettings?.enabled ? 'ACTIVE' : 'OFF'}
          </button>

          {/* 🌟 그리드 튜너 탭 직결 패널 활성화 버튼 */}
          <button
            onClick={() => setActiveInspectorTab('grid')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
              activeInspectorTab === 'grid'
                ? 'bg-[#00E5FF] text-black border-[#00E5FF] font-black shadow-sm'
                : 'bg-sky-500/20 border-sky-500/40 text-[#00E5FF] hover:bg-sky-500/30'
            }`}
            title="인스펙터 그리드 튜너 패널 활성화"
          >
            📐 그리드 튜너
          </button>

          {typeof handleAutoSequenceAllClips === 'function' && (
            <button
              onClick={handleAutoSequenceAllClips}
              className="px-2.5 py-1 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-bold cursor-pointer hover:bg-[#00E5FF]/25 transition-all"
              title="타임라인 사진들을 0초부터 차례대로 나열"
            >
              순차 정렬
            </button>
          )}

          {/* 업로드 모드 스위처 */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setUploadMode('stack')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                uploadMode === 'stack' ? 'bg-[#00E5FF] text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="미디어를 현재 재생헤드 위치의 빈 트랙에 위로 쌓습니다."
            >
              레이어 적층
            </button>
            <button
              onClick={() => setUploadMode('sequence')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                uploadMode === 'sequence' ? 'bg-[#00E5FF] text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="미디어를 V1 트랙의 맨 끝에 차례대로 이어붙입니다."
            >
              순차 이어붙이기
            </button>
          </div>
        </div>

        {/* 상단 우측: 파일 입출력 및 내보내기 */}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="import-gtc-desktop" 
            accept=".gtc,application/json" 
            className="hidden" 
            onChange={(e) => { 
              if (e.target.files && e.target.files.length > 0) ProjectSerializer.importProject(e.target.files[0]);
            }} 
          />
          <label 
            htmlFor="import-gtc-desktop" 
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-white/10"
          >
            열기
          </label>

          <button 
            onClick={() => ProjectSerializer.exportProject()}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-white/10"
          >
            저장
          </button>

          <span className="w-px h-3.5 bg-white/10 mx-0.5" />

          <button onClick={undo} disabled={historyIndex <= 0} className="w-7 h-7 rounded-lg bg-white/5 text-zinc-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-white/10">↶</button>
          <button onClick={redo} className="w-7 h-7 rounded-lg bg-white/5 text-zinc-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-white/10">↷</button>

          <button 
            onClick={handleExport}
            className="ml-1 px-4 py-1.5 rounded-lg bg-[#00E5FF] hover:bg-[#00d0e8] text-black font-black text-xs tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            영상 내보내기 💾
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. 메인 3단 NLE 작업 영역 (미디어풀 / 뷰어 / 인스펙터)
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden border-b border-white/10">
        
        {/* [A] 좌측 미디어 풀 */}
        <div className="w-80 bg-[#101217] border-r border-white/10 flex flex-col shrink-0">
          <div className="h-10 border-b border-white/10 flex items-center justify-between px-3.5 bg-[#14161F]">
            <span className="font-bold text-xs text-zinc-200">미디어 풀 ({mediaPool?.length || 0})</span>
            <label className="px-2.5 py-0.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded text-xs cursor-pointer border border-white/10 transition-colors">
              + 가져오기
              <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="px-3 py-1.5 bg-[#0D0F14] border-b border-white/5 flex items-center gap-1 text-[11px] font-bold">
            {[
              { id: 'all', label: '전체' },
              { id: 'video', label: '영상' },
              { id: 'image', label: '사진' },
              { id: 'audio', label: '음원' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMediaFilterType(tab.id)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  mediaFilterType === tab.id ? 'bg-[#00E5FF] text-black font-black' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 hide-scrollbar">
            {(!filteredMediaPool || filteredMediaPool.length === 0) ? (
              <label className="h-48 border-2 border-dashed border-white/10 hover:border-zinc-500 rounded-2xl flex flex-col items-center justify-center text-center p-4 cursor-pointer bg-white/[0.01]">
                <span className="text-2xl mb-1 text-zinc-400">📁</span>
                <span className="text-xs font-bold text-zinc-300">미디어 파일 등록</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">영상, 사진, 음악 파일 선택</span>
                <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredMediaPool.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleAddMediaToTimeline(m)}
                    className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 hover:border-[#00E5FF] cursor-pointer flex flex-col justify-end p-2 transition-all shadow-md"
                    title="클릭 시 타임라인 현재 재생헤드 위치에 배치됩니다."
                  >
                    {m.type === 'image' && <img src={m.url} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />}
                    {m.type === 'video' && <video src={m.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                    <span className="relative z-10 text-[10.5px] font-bold text-white truncate bg-black/75 px-1.5 py-0.5 rounded">{m.name}</span>
                    <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-[#00E5FF] text-black font-bold text-[8.5px] px-1 rounded transition-opacity">
                      +추가
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [B] 중앙 9:16 모니터 뷰어 */}
        <div className="flex-1 bg-[#060709] flex flex-col items-center justify-center p-3 relative overflow-hidden">
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
            <div className={`relative flex items-center justify-center h-full transition-all ${reelsFrameMode ? 'aspect-[9/16] border-2 border-[#00E5FF]/40 rounded-2xl overflow-hidden shadow-2xl bg-black my-auto' : 'w-full h-full'}`}>
              <CinemaCanvas />
              {reelsFrameMode && (
                <span className="absolute top-2 left-2.5 bg-black/70 backdrop-blur-md text-[#00E5FF] font-mono text-[9px] px-2 py-0.5 rounded-full border border-white/10 pointer-events-none z-20">
                  REELS 9:16
                </span>
              )}
            </div>
          </div>

          {/* 뷰어 하단 셔틀 컨트롤 바 */}
          <div className="w-full max-w-lg h-10 bg-[#12141A] border border-white/10 rounded-xl flex items-center justify-between px-4 mt-2.5 shadow-lg select-none shrink-0">
            <span 
              onClick={executeRewind}
              className="font-mono text-xs font-bold text-white cursor-pointer hover:underline"
              title="클릭 시 0초로 이동"
            >
              <span className="text-[#00E5FF]">{formatTimecode(playhead)}</span> <span className="text-zinc-600">/</span> <span className="text-zinc-400">{formatTimecode(projectDuration)}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={executeRewind} 
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer"
                title="처음으로 (0초)"
              >
                ⏮
              </button>

              <button 
                onClick={() => stepFrame('backward')} 
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer"
                title="1프레임 뒤로 (-1/30s)"
              >
                ◀
              </button>

              <button 
                onClick={executeTogglePlay}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-black shadow-md cursor-pointer active:scale-95 mx-0.5"
                title={isPlaying ? '일시정지 (Space)' : '재생 (Space)'}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>

              <button 
                onClick={() => stepFrame('forward')} 
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer"
                title="1프레임 앞으로 (+1/30s)"
              >
                ▶
              </button>

              <button 
                onClick={() => setPlayhead(projectDuration)} 
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs cursor-pointer" 
                title="끝으로 이동"
              >
                ⏭
              </button>
            </div>

            <button onClick={toggleMagnetic} className="text-xs font-mono font-bold text-[#00E5FF] cursor-pointer">
              SNAP {isMagnetic ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* [C] 🌟 우측 마스터 인스펙터 패널 (6대 탭 탑재) */}
        <div className="w-96 bg-[#101217] border-l border-white/10 flex flex-col shrink-0">
          
          <div className="h-10 border-b border-white/10 grid grid-cols-6 bg-[#14161F] text-[10.5px] font-bold text-zinc-400">
            {[
              { id: 'properties', label: '속성' },
              { id: 'grid', label: '그리드' },
              { id: 'color', label: '색보정' },
              { id: 'effects', label: '효과' },
              { id: 'captions', label: '자막' },
              { id: 'audio', label: '오디오' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveInspectorTab(tab.id)}
                className={`flex items-center justify-center cursor-pointer transition-colors border-b-2 ${
                  activeInspectorTab === tab.id
                    ? 'text-[#00E5FF] border-[#00E5FF] bg-white/5 font-black'
                    : 'border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5 hide-scrollbar">
            
            {selectedClip && (
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-xs text-white truncate max-w-[70%]">
                  {selectedClip.name || selectedClip.content || '선택 에셋'}
                </span>
                <button onClick={() => deleteClip(selectedClip.id)} className="text-xs text-rose-400 font-bold hover:underline cursor-pointer">
                  삭제
                </button>
              </div>
            )}

            {/* 트랙 이동 셀렉터 */}
            {selectedClip && (
              <div className="bg-[#151821] p-3 rounded-xl border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                    {selectedClip.type === 'audio' ? '🎵 오디오 트랙 변경 (A)' :
                     selectedClip.type === 'text' ? '💬 자막 트랙 변경 (T)' :
                     '🎬 비디오/이미지 트랙 변경 (V)'}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedClip.type === 'audio' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedClip.type === 'text' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}>
                    현재: {currentTrackOfSelectedClip}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableTracksForClip.map(tId => {
                    const isCurrent = currentTrackOfSelectedClip === tId;
                    const activeTheme = 
                      selectedClip.type === 'audio' ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' :
                      selectedClip.type === 'text' ? 'bg-amber-500 text-black border-amber-500 shadow-sm' :
                      'bg-[#00E5FF] text-black border-[#00E5FF] shadow-sm';

                    return (
                      <button
                        key={tId}
                        onClick={() => handleMoveClipToTrack(tId)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                          isCurrent ? activeTheme : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        {tId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* [1. 속성 탭] 정밀 트랜스폼 패널 */}
            {activeInspectorTab === 'properties' && (
              <div className="space-y-3.5">
                {!selectedClip ? (
                  <div className="py-12 text-center bg-black/40 border border-white/10 rounded-xl p-4">
                    <span className="text-xs font-bold text-zinc-400 block mb-1">선택된 클립 없음</span>
                    <span className="text-[11px] text-zinc-600">타임라인의 클립을 클릭하여 위치, 스케일, 투명도를 조절하세요.</span>
                  </div>
                ) : (
                  <>
                    {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
                      <div className="bg-[#151821] p-3.5 rounded-xl border border-white/10 space-y-3">
                        <span className="text-xs font-black text-white block pb-1 border-b border-white/10">📐 정밀 트랜스폼</span>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400 font-bold">확대/축소 (Scale)</span>
                            <span className="font-mono text-[#00E5FF]">{selectedClip.transform?.scale ?? selectedClip.scale ?? 100}%</span>
                          </div>
                          <input 
                            type="range" min="10" max="300" step="1"
                            value={selectedClip.transform?.scale ?? selectedClip.scale ?? 100}
                            onChange={e => handleUpdateTransform('scale', Number(e.target.value))}
                            className="w-full h-1.5 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-zinc-400 block mb-0.5">X축 위치 (px)</span>
                            <input 
                              type="number"
                              value={selectedClip.transform?.x ?? selectedClip.positionX ?? 0}
                              onChange={e => handleUpdateTransform('positionX', Number(e.target.value))}
                              className="w-full p-1.5 bg-black border border-white/15 rounded text-white font-mono text-center outline-none focus:border-[#00E5FF]"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block mb-0.5">Y축 위치 (px)</span>
                            <input 
                              type="number"
                              value={selectedClip.transform?.y ?? selectedClip.positionY ?? 0}
                              onChange={e => handleUpdateTransform('positionY', Number(e.target.value))}
                              className="w-full p-1.5 bg-black border border-white/15 rounded text-white font-mono text-center outline-none focus:border-[#00E5FF]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400 font-bold">회전 각도 (Rotation)</span>
                            <span className="font-mono text-[#00E5FF]">{selectedClip.transform?.rotate ?? selectedClip.rotation ?? 0}°</span>
                          </div>
                          <input 
                            type="range" min="-180" max="180" step="1"
                            value={selectedClip.transform?.rotate ?? selectedClip.rotation ?? 0}
                            onChange={e => handleUpdateTransform('rotation', Number(e.target.value))}
                            className="w-full h-1.5 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400 font-bold">불투명도 (Opacity)</span>
                            <span className="font-mono text-[#00E5FF]">{selectedClip.opacity ?? 100}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" step="1"
                            value={selectedClip.opacity ?? 100}
                            onChange={e => handleUpdateTransform('opacity', Number(e.target.value))}
                            className="w-full h-1.5 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                          />
                        </div>

                        <button
                          onClick={() => setShowMaskEditor(true)}
                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00E5FF] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          ✨ 스마트 마스크 펜툴 & 브러시 편집
                        </button>
                      </div>
                    )}
                    {selectedClip.type === 'text' && <TextAnimator clip={selectedClip} />}
                  </>
                )}
              </div>
            )}

            {/* 🌟 [2. 그리드 탭] 독립 카테고리 메뉴 복원 */}
            {activeInspectorTab === 'grid' && (
              selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image') ? (
                <GridSettings clip={selectedClip} />
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs bg-black/40 border border-white/10 rounded-xl">
                  그리드 매트릭스를 적용할 영상/사진을 선택하세요.
                </div>
              )
            )}

            {/* [3. 색보정 탭] */}
            {activeInspectorTab === 'color' && (
              selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image') ? (
                <ColorWheels clip={selectedClip} />
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs bg-black/40 border border-white/10 rounded-xl">
                  색보정을 적용할 영상/사진을 선택하세요.
                </div>
              )
            )}

            {/* [4. 효과 탭] */}
            {activeInspectorTab === 'effects' && (
              selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image') ? (
                <EffectsInspector clip={selectedClip} />
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs bg-black/40 border border-white/10 rounded-xl">
                  이펙트를 적용할 영상/사진을 선택하세요.
                </div>
              )
            )}

            {/* [5. 자막 탭] */}
            {activeInspectorTab === 'captions' && (
              <div className="space-y-4">
                <CaptionManager />
                {selectedClip?.type === 'text' && <TextAnimator clip={selectedClip} />}
              </div>
            )}

            {/* [6. 오디오 탭] */}
            {activeInspectorTab === 'audio' && (
              selectedClip?.type === 'audio' ? (
                <AudioInspector clip={selectedClip} />
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs bg-black/40 border border-white/10 rounded-xl">
                  오디오 클립을 선택하여 볼륨 및 페이드 속성을 조절하세요.
                </div>
              )
            )}

          </div>
        </div>

      </div>

      {/* =====================================================================
          3. 하단 멀티트랙 타임라인 및 툴바
          ===================================================================== */}
      <div className="h-72 bg-[#0C0D11] flex flex-col shrink-0">
        <div className="h-9 px-3 border-b border-white/10 flex items-center bg-[#111317] gap-2 overflow-x-auto shrink-0">
          
          <button onClick={splitClip} className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer">
            ✂️ 분할 (B)
          </button>
          
          <button 
            onClick={() => deleteClip(selectedClipId)} 
            disabled={!selectedClipId} 
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-bold text-xs cursor-pointer disabled:opacity-30"
          >
            삭제 (Del)
          </button>

          <span className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* BeatSyncEngine 비트 자동 컷팅 */}
          <button 
            onClick={handleAutoBeatCut}
            className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold text-xs rounded-lg cursor-pointer transition-colors"
          >
            🎵 비트 자동 컷팅
          </button>

          <button 
            onClick={toggleMagnetic} 
            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
              isMagnetic ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            자석 {isMagnetic ? 'ON' : 'OFF'}
          </button>

          <button 
            onClick={handleAddText} 
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
          >
            + 자막 / 성경
          </button>

          <span className="w-px h-3.5 bg-white/10 mx-0.5" />

          <button 
            onClick={() => { if(mediaPool?.length > 0) applyGraceTemplate(mediaPool[0]); else alert("미디어를 먼저 등록하세요."); }} 
            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold text-xs rounded-lg cursor-pointer"
          >
            ✨ 오늘의 은혜 템플릿
          </button>

          <button 
            onClick={() => setShowPrompter(true)} 
            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs rounded-lg cursor-pointer"
          >
            🎙️ 프롬프터
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <TimelineVirtualizer />
          <FairlightMixer />
        </div>
      </div>

      {/* 스마트 마스크 에디터 오버레이 */}
      {showMaskEditor && selectedClipId && (
        <DrawMaskOverlay clipId={selectedClipId} onClose={() => setShowMaskEditor(false)} />
      )}

    </div>
  );
}
// src/components/inspector/GridSettings.js (또는 해당 경로)
import React, { useState, useEffect } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// =====================================================================
// 🎬 엔터프라이즈 모노크롬 SVG 아이콘 (DaVinci Resolve & Linear SaaS Style)
// =====================================================================
const IconMatrix = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);
const IconSequencer = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
  </svg>
);
const IconSlotDVE = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M9 12l2.25 2.25L15 9.75" />
  </svg>
);
const IconBezel = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693l-1.57-.393m15.6 0l1.4 3.5a2.25 2.25 0 01-1.4 2.9l-1.6.4a24.08 24.08 0 01-15.6 0l-1.6-.4a2.25 2.25 0 01-1.4-2.9l1.4-3.5" />
  </svg>
);
const IconReset = () => (
  <svg className="w-3 h-3 text-zinc-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const IconVolume = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

// =====================================================================
// 🎬 헐리우드 비디오월 토폴로지 마스터 프리셋 (비대칭 Span 완벽 지원)
// =====================================================================
const TOPOLOGY_PRESETS = [
  { id: '3x3_hollywood', name: '3×3 헐리우드 콜라주', rows: 3, cols: 3, slotCount: 9, desc: '9분할 다빈치 리졸브 시그니처 그리드' },
  { id: '2x2_quad', name: '2×2 쿼드 비디오월', rows: 2, cols: 2, slotCount: 4, desc: '대칭형 4분할 클래식 멀티스크린' },
  { id: '1top_2bot', name: '1 상단 + 2 하단 분할', rows: 2, cols: 2, slotCount: 3, isAsymmetric: true, heroIndex: 0, desc: '메인 상단 와이드 + 하단 서브 2분할' },
  { id: '2top_1bot', name: '2 상단 + 1 하단 분할', rows: 2, cols: 2, slotCount: 3, isAsymmetric: true, heroIndex: 2, desc: '비교 영상 2개 + 하단 와이드 해설 1개' },
  { id: '1x3_vertical', name: '1×3 릴스 3단 스택', rows: 3, cols: 1, slotCount: 3, desc: '9:16 모바일 세로 3단 시네마틱 스택' },
  { id: '2x1_horizontal', name: '2×1 좌우 대칭 스플릿', rows: 1, cols: 2, slotCount: 2, desc: '와이드 인터뷰 및 전후 비교' },
  { id: 'center_hero_5', name: '1 메인 + 4 코너 그리드', rows: 3, cols: 2, slotCount: 5, isAsymmetric: true, heroIndex: 0, desc: '상단 와이드 1개 + 하단 4분할 콜라주' },
  { id: '4x4_mega', name: '4×4 메가 매트릭스', rows: 4, cols: 4, slotCount: 16, desc: '16분할 웅장한 합창·이벤트 쇼케이스' }
];

// 🎨 슬롯별 LUT / 컬러 필터 프리셋
const SLOT_LUT_PRESETS = [
  { id: 'none', name: '원본 (Bypass)', filter: 'none' },
  { id: 'cinema_warm', name: '웜 시네마 (Gold)', filter: 'contrast(1.08) saturate(1.18) sepia(0.15)' },
  { id: 'teal_orange', name: '틸 앤 오렌지', filter: 'contrast(1.15) saturate(1.25) hue-rotate(-5deg)' },
  { id: 'noir_bw', name: '느와르 흑백 (B&W)', filter: 'grayscale(1) contrast(1.25)' },
  { id: 'vintage_fade', name: '빈티지 필름', filter: 'contrast(0.92) brightness(1.05) sepia(0.25)' },
  { id: 'vivid_pop', name: '바이럴 비비드', filter: 'contrast(1.12) saturate(1.45)' }
];

// 🔢 시퀀스 패턴에 따른 슬롯 점등 순서 계산 헬퍼
export function computeSequenceOrder(totalCells, rows, cols, pattern = 'cascade_lr') {
  const indices = Array.from({ length: totalCells }, (_, i) => i);
  if (pattern === 'cascade_lr') return indices;
  if (pattern === 'wave') {
    // 열(Column) 우선 또는 대각선 파도타기
    return [...indices].sort((a, b) => {
      const rA = Math.floor(a / cols), cA = a % cols;
      const rB = Math.floor(b / cols), cB = b % cols;
      return (rA + cA) - (rB + cB);
    });
  }
  if (pattern === 'spiral_in') {
    // 외곽에서 중심으로 회전하며 유입
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    return [...indices].sort((a, b) => {
      const dA = Math.hypot((a % cols) - cx, Math.floor(a / cols) - cy);
      const dB = Math.hypot((b % cols) - cx, Math.floor(b / cols) - cy);
      return dB - dA;
    });
  }
  if (pattern === 'center_out') {
    // 중심에서 외곽으로 폭발하듯 점등
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    return [...indices].sort((a, b) => {
      const dA = Math.hypot((a % cols) - cx, Math.floor(a / cols) - cy);
      const dB = Math.hypot((b % cols) - cx, Math.floor(b / cols) - cy);
      return dA - dB;
    });
  }
  if (pattern === 'random') {
    // 고정 시드 의사 랜덤 (일관된 프리뷰 보장)
    return [...indices].sort((a, b) => ((a * 7 + 3) % 13) - ((b * 7 + 3) % 13));
  }
  return indices;
}

export default function GridSettings({ clip }) {
  const { updateClip, mediaPool } = useNLEStore();

  // 인스펙터 워크플로우 탭: topology | sequencer | slotDVE | bezelStyle
  const [activeTab, setActiveTab] = useState('topology');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [draggedSlotIdx, setDraggedSlotIdx] = useState(null);

  // 시퀀서 실시간 시뮬레이션 프리뷰 상태
  const [isSimulatingSeq, setIsSimulatingSeq] = useState(false);
  const [activeSeqStep, setActiveSeqStep] = useState(999);

  // 🌟 그리드 비디오월 마스터 설정 객체
  const grid = clip ? {
    mode: 'matrix',
    rows: 3,
    cols: 3,
    topologyPreset: '3x3_hollywood',
    gap: 4,
    outerMargin: 6,
    cellRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
    canvasBgColor: '#050507',
    borderTheme: 'titanium',
    shadowIntensity: 40,
    
    // 시퀀서 엔진
    sequentialPlay: true,
    sequencePattern: 'cascade_lr',
    staggerDelay: 0.18,
    motionDuration: 0.45,
    motionEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    entranceFx: 'punch_in',
    dimInactiveSlots: false, // 켜지기 전 슬롯 어둡게 대기
    
    // 글로벌 카메라 리그 모션
    globalPushIn: true,
    globalPushSpeed: 4,
    masterAudioSlot: 0,
    
    // 슬롯별 독립 데이터
    cellMedia: {},
    cellTransforms: {},
    ...(clip.gridConfig || {})
  } : null;

  const activePresetObj = TOPOLOGY_PRESETS.find(p => p.id === grid?.topologyPreset);
  const totalCells = activePresetObj?.isAsymmetric
    ? activePresetObj.slotCount
    : ((grid?.rows || 1) * (grid?.cols || 1));

  // 시퀀서 점등 시뮬레이션 타이머
  useEffect(() => {
    if (!isSimulatingSeq || !grid) return;
    setActiveSeqStep(0);
    const delayMs = Math.max(80, (grid.staggerDelay || 0.18) * 1000);
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setActiveSeqStep(step);
      if (step >= totalCells + 1) {
        clearInterval(timer);
        setTimeout(() => {
          setIsSimulatingSeq(false);
          setActiveSeqStep(999);
        }, 500);
      }
    }, delayMs);
    return () => clearInterval(timer);
  }, [isSimulatingSeq, totalCells, grid?.staggerDelay]);

  if (!clip || !grid) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-mono select-none">
        타임라인에서 클립을 선택하면 프로페셔널 비디오월 매트릭스 인스펙터가 활성화됩니다.
      </div>
    );
  }

  const seqOrderArr = computeSequenceOrder(totalCells, grid.rows || 3, grid.cols || 3, grid.sequencePattern);

  // 현재 선택된 슬롯의 독립 DVE 상태
  const currentSlotDVE = grid.cellTransforms?.[selectedSlotIndex] || {
    scale: 100,
    x: 0,
    y: 0,
    rotate: 0,
    flipX: false,
    fit: 'cover',
    lut: 'none',
    volume: selectedSlotIndex === (grid.masterAudioSlot ?? 0) ? 100 : 0,
    mute: selectedSlotIndex !== (grid.masterAudioSlot ?? 0),
    inPoint: 0,
    opacity: 100,
    label: ''
  };

  // 갱신 핸들러
  const handleGridKey = (key, val) => {
    updateClip(clip.id, {
      gridConfig: { ...grid, [key]: val }
    });
  };

  // 다중 키 동시 갱신 핸들러
  const handleGridPatch = (patchObj) => {
    updateClip(clip.id, {
      gridConfig: { ...grid, ...patchObj }
    });
  };

  // 슬롯별 DVE 속성 업데이트
  const handleSlotDVE = (propKey, propVal) => {
    const nextTransforms = {
      ...(grid.cellTransforms || {}),
      [selectedSlotIndex]: {
        ...currentSlotDVE,
        [propKey]: propVal
      }
    };
    handleGridKey('cellTransforms', nextTransforms);
  };

  // 현재 슬롯의 DVE 설정을 모든 슬롯에 일괄 동기화
  const syncCurrentDVEToAllSlots = () => {
    const nextTransforms = {};
    for (let i = 0; i < totalCells; i++) {
      nextTransforms[i] = {
        ...(grid.cellTransforms?.[i] || {}),
        scale: currentSlotDVE.scale,
        fit: currentSlotDVE.fit,
        lut: currentSlotDVE.lut,
        opacity: currentSlotDVE.opacity
      };
    }
    handleGridKey('cellTransforms', nextTransforms);
  };

  // 미디어풀 영상들로 전체 슬롯 원클릭 자동 배정 (Auto-Populate)
  const autoFillSlotsFromMediaPool = () => {
    const pool = Array.isArray(mediaPool) && mediaPool.length > 0 ? mediaPool : [{ url: clip.url }];
    const nextMediaMap = {};
    for (let i = 0; i < totalCells; i++) {
      nextMediaMap[i] = pool[i % pool.length]?.url || clip.url;
    }
    handleGridKey('cellMedia', nextMediaMap);
  };

  // 슬롯 간 드래그 앤 드롭 스왑(Swap) 핸들러
  const swapSlots = (fromIdx, toIdx) => {
    if (fromIdx === null || fromIdx === toIdx) return;
    const nextMedia = { ...(grid.cellMedia || {}) };
    const tempM = nextMedia[fromIdx] || clip.url;
    nextMedia[fromIdx] = nextMedia[toIdx] || clip.url;
    nextMedia[toIdx] = tempM;

    const nextTransforms = { ...(grid.cellTransforms || {}) };
    const tempT = nextTransforms[fromIdx];
    nextTransforms[fromIdx] = nextTransforms[toIdx];
    nextTransforms[toIdx] = tempT;

    handleGridPatch({ cellMedia: nextMedia, cellTransforms: nextTransforms });
    setSelectedSlotIndex(toIdx);
  };

  // 슬롯 미디어 소스 할당
  const assignSlotMedia = (slotIdx, mediaUrl) => {
    const nextMediaMap = { ...(grid.cellMedia || {}), [slotIdx]: mediaUrl };
    handleGridKey('cellMedia', nextMediaMap);
  };

  // 토폴로지 프리셋 적용 매크로
  const applyPreset = (preset) => {
    setSelectedSlotIndex(0);
    handleGridPatch({
      rows: preset.rows,
      cols: preset.cols,
      topologyPreset: preset.id,
      cellRadius: preset.rows >= 3 ? 4 : 8
    });
  };

  // 슬롯 트랜스폼 리셋
  const resetSlotDVE = () => {
    const nextTransforms = {
      ...(grid.cellTransforms || {}),
      [selectedSlotIndex]: {
        ...currentSlotDVE,
        scale: 100,
        x: 0,
        y: 0,
        rotate: 0,
        flipX: false,
        lut: 'none',
        opacity: 100,
        fit: 'cover'
      }
    };
    handleGridKey('cellTransforms', nextTransforms);
  };

  // 비대칭 프리셋의 개별 슬롯 CSS Grid Span 계산
  const getSlotSpanStyle = (idx) => {
    if (grid.topologyPreset === '1top_2bot' && idx === 0) {
      return { gridColumn: 'span 2 / span 2' };
    }
    if (grid.topologyPreset === '2top_1bot' && idx === 2) {
      return { gridColumn: 'span 2 / span 2' };
    }
    if (grid.topologyPreset === 'center_hero_5' && idx === 0) {
      return { gridColumn: 'span 2 / span 2' };
    }
    return {};
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#0B0C10] border-l border-zinc-800/90 text-zinc-300 font-sans select-none text-[12px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. 최상단 인스펙터 헤더 */}
      <div className="px-3.5 py-2.5 bg-[#12141C] border-b border-zinc-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="font-mono font-bold text-zinc-100 text-[11px] uppercase tracking-wider">
            Video Wall Studio Pro
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
            {grid.cols}×{grid.rows} ({totalCells} Cells)
          </span>
        </div>
      </div>

      {/* 2. 시각적 인터랙티브 비디오월 모니터 (드래그 스왑 & 실시간 시퀀서 프리뷰) */}
      <div className="p-3 bg-[#0E1017] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span>INTERACTIVE MATRIX</span>
            <span className="text-[9px] text-zinc-500">(드래그하여 위치교환)</span>
          </span>
          <span className="text-amber-400 font-bold">Slot #{selectedSlotIndex + 1} 편집중</span>
        </div>

        {/* 9:16 세로 릴스 뷰포트 내 가상 그리드 월 모니터 */}
        <div 
          className="w-full aspect-[9/16] max-h-48 rounded-xl border border-zinc-800 grid mx-auto shadow-inner transition-all duration-300 relative overflow-hidden"
          style={{
            backgroundColor: grid.canvasBgColor || '#050507',
            padding: `${Math.min(16, (grid.outerMargin ?? 6) * 0.6)}px`,
            gap: `${Math.min(12, (grid.gap ?? 4) * 0.7)}px`,
            gridTemplateRows: `repeat(${grid.rows || 3}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${grid.cols || 3}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalCells }).map((_, idx) => {
            const isSelected = selectedSlotIndex === idx;
            const isMasterAudio = (grid.masterAudioSlot ?? 0) === idx;
            const slotMediaUrl = grid.cellMedia?.[idx] || clip.url;
            const slotT = grid.cellTransforms?.[idx] || {};
            const lutObj = SLOT_LUT_PRESETS.find(l => l.id === slotT.lut) || SLOT_LUT_PRESETS[0];

            // 시퀀서 점등 순서 계산
            const seqRank = seqOrderArr.indexOf(idx);
            const isLitInSim = !isSimulatingSeq || seqRank < activeSeqStep;

            return (
              <div
                key={idx}
                draggable
                onDragStart={() => setDraggedSlotIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  swapSlots(draggedSlotIdx, idx);
                  setDraggedSlotIdx(null);
                }}
                onClick={() => setSelectedSlotIndex(idx)}
                style={{
                  ...getSlotSpanStyle(idx),
                  borderRadius: `${Math.min(14, (grid.cellRadius ?? 6) * 0.8)}px`,
                  borderWidth: `${Math.min(3, grid.borderWidth ?? 1)}px`,
                  borderColor: isSelected ? '#F59E0B' : (grid.borderColor || '#27272A'),
                  opacity: isLitInSim ? (slotT.opacity ?? 100) / 100 : 0.12,
                  transform: isLitInSim ? 'scale(1)' : 'scale(0.82)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className={`relative overflow-hidden flex flex-col items-center justify-between p-1 cursor-pointer select-none ${
                  isSelected 
                    ? 'ring-2 ring-amber-400/90 bg-amber-500/15 z-20 shadow-lg' 
                    : 'bg-zinc-900/75 hover:border-zinc-500'
                }`}
              >
                {slotMediaUrl && (
                  <div 
                    className="absolute inset-0 opacity-50 bg-cover bg-center pointer-events-none transition-transform duration-200" 
                    style={{
                      backgroundImage: `url(${slotMediaUrl})`,
                      filter: lutObj.filter,
                      transform: `scale(${(slotT.scale || 100) / 100}) rotate(${slotT.rotate || 0}deg) scaleX(${slotT.flipX ? -1 : 1})`
                    }} 
                  />
                )}
                <div className="w-full flex justify-between items-center relative z-10 pointer-events-none">
                  <span className="font-mono text-[8.5px] font-black text-white bg-black/80 px-1 py-0.2 rounded">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {grid.sequentialPlay && (
                      <span className="text-[7.5px] font-mono text-amber-300 bg-black/75 px-1 rounded" title="점등 순서">
                        {seqRank + 1}st
                      </span>
                    )}
                    {isMasterAudio && (
                      <span className="text-[9px] text-amber-400 font-bold drop-shadow" title="마스터 오디오 채널">🔊</span>
                    )}
                  </div>
                </div>

                {slotT.label && (
                  <span className="relative z-10 text-[8px] font-bold text-white bg-black/70 px-1.5 py-0.2 rounded truncate max-w-full">
                    {slotT.label}
                  </span>
                )}

                <div className="relative z-10 text-[8px] font-mono text-zinc-300 truncate w-full text-center bg-black/40 rounded">
                  {slotT.scale ? `${slotT.scale}%` : '100%'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 퀵 매크로 툴바 (자동 채우기 / 시퀀스 테스트 / 전체 동기화) */}
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={autoFillSlotsFromMediaPool}
            className="py-1.5 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-[10.5px] border border-zinc-700/60 transition-colors cursor-pointer truncate"
            title="미디어풀의 영상들을 각 슬롯에 순서대로 자동 배치합니다"
          >
            ⚡ 자동 채우기
          </button>
          <button
            type="button"
            onClick={() => setIsSimulatingSeq(true)}
            className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-[10.5px] border border-amber-500/40 transition-colors cursor-pointer truncate"
          >
            ▶️ 점등 프리뷰
          </button>
          <button
            type="button"
            onClick={syncCurrentDVEToAllSlots}
            className="py-1.5 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-[10.5px] border border-zinc-700/60 transition-colors cursor-pointer truncate"
            title="현재 슬롯의 줌·필터·비율 설정을 모든 슬롯에 똑같이 복사합니다"
          >
            📋 전체 동기화
          </button>
        </div>
      </div>

      {/* 3. 인스펙터 4대 탭 바 */}
      <div className="flex border-b border-zinc-800 bg-[#12141C] px-1.5 pt-1 gap-0.5 shrink-0">
        {[
          { id: 'topology', label: '레이아웃', icon: <IconMatrix /> },
          { id: 'sequencer', label: '시퀀서', icon: <IconSequencer /> },
          { id: 'slotDVE', label: '슬롯 DVE', icon: <IconSlotDVE /> },
          { id: 'bezelStyle', label: '베젤·배경', icon: <IconBezel /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border-b-2 transition-colors -mb-[1px] cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-white bg-zinc-800/50 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. 탭별 세부 제어 패널 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 hide-scrollbar">

        {/* ================= TAB 1: TOPOLOGY & LAYOUT ================= */}
        {activeTab === 'topology' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                HOLLYWOOD TOPOLOGY PRESETS
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {TOPOLOGY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`p-2 text-left rounded-lg border transition-all flex flex-col gap-0.5 cursor-pointer ${
                      grid.topologyPreset === preset.id
                        ? 'bg-amber-500/15 border-amber-500/90 text-amber-200 shadow-sm'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-zinc-100">{preset.name}</span>
                      {preset.isAsymmetric && (
                        <span className="text-[8.5px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">비대칭</span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-zinc-400 line-clamp-1">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 정밀 행/열 수치 다이얼 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <span className="text-[10.5px] font-mono text-zinc-300 font-bold block uppercase">
                Custom Matrix Dimension
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>COLUMNS (열)</span>
                    <span className="text-amber-400 font-bold">{grid.cols}열</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" value={grid.cols || 3}
                    onChange={(e) => handleGridPatch({ cols: Number(e.target.value), topologyPreset: 'custom' })}
                    className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>ROWS (행)</span>
                    <span className="text-amber-400 font-bold">{grid.rows}행</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" value={grid.rows || 3}
                    onChange={(e) => handleGridPatch({ rows: Number(e.target.value), topologyPreset: 'custom' })}
                    className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 글로벌 카메라 리그 모션 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] font-bold text-zinc-100 block">시네마틱 슬로우 푸시인 (Push-In)</span>
                  <span className="text-[10px] text-zinc-400">비디오월 전체가 서서히 클로즈업되는 다빈치 카메라 무빙</span>
                </div>
                <input 
                  type="checkbox"
                  checked={!!grid.globalPushIn}
                  onChange={(e) => handleGridKey('globalPushIn', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {grid.globalPushIn && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>CAMERA PUSH INTENSITY</span>
                    <span className="text-amber-400 font-bold">+{grid.globalPushSpeed || 4}%</span>
                  </div>
                  <input 
                    type="range" min="1" max="20" value={grid.globalPushSpeed || 4}
                    onChange={(e) => handleGridKey('globalPushSpeed', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SEQUENCER & ENTRANCE FX ================= */}
        {activeTab === 'sequencer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#14161F] p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-[11.5px] font-bold text-zinc-100 block">순차 점등 시퀀서 활성화</span>
                <span className="text-[10px] text-zinc-400">박스가 박자에 맞춰 차례대로 켜지는 리듬 연출</span>
              </div>
              <input 
                type="checkbox"
                checked={!!grid.sequentialPlay}
                onChange={(e) => handleGridKey('sequentialPlay', e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 등장 시퀀스 패턴 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                SEQUENCE ORDER PATTERN
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'cascade_lr', name: '좌→우 순차 캐스케이드' },
                  { id: 'spiral_in', name: '외곽→중심 나선형 유입' },
                  { id: 'center_out', name: '중심→외곽 버스트 확장' },
                  { id: 'wave', name: '대각선 파도 웨이브' },
                  { id: 'random', name: '랜덤 바이럴 팝' }
                ].map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => {
                      handleGridKey('sequencePattern', pat.id);
                      setIsSimulatingSeq(true);
                    }}
                    className={`py-2 px-2.5 text-left rounded-lg border text-[11px] transition-colors cursor-pointer ${
                      grid.sequencePattern === pat.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {pat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 슬롯 인-이펙트 FX */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                SLOT ENTRANCE MOTION FX
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'punch_in', name: '시네마틱 펀치 줌인' },
                  { id: 'film_flash', name: '필름 셔터 화이트 플래시' },
                  { id: 'slide_up', name: '슬라이드 업 스프링' },
                  { id: 'dissolve', name: '소프트 크로스 디졸브' },
                  { id: 'anamorphic_wipe', name: '아나모픽 블라인드 와이프' },
                  { id: 'instant', name: '이펙트 없음 (하드 컷)' }
                ].map((fx) => (
                  <button
                    key={fx.id}
                    onClick={() => handleGridKey('entranceFx', fx.id)}
                    className={`py-2 px-2.5 text-left rounded-lg border text-[11px] transition-colors cursor-pointer ${
                      grid.entranceFx === fx.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {fx.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 타이밍 제어 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>STAGGER INTERVAL (점등 간격)</span>
                  <span className="text-amber-400 font-bold">{grid.staggerDelay || 0.18}초</span>
                </div>
                <input 
                  type="range" min="0.05" max="0.8" step="0.02" value={grid.staggerDelay || 0.18}
                  onChange={(e) => handleGridKey('staggerDelay', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>MOTION DURATION (등장 모션 길이)</span>
                  <span className="text-zinc-100 font-bold">{grid.motionDuration || 0.45}초</span>
                </div>
                <input 
                  type="range" min="0.1" max="1.5" step="0.05" value={grid.motionDuration || 0.45}
                  onChange={(e) => handleGridKey('motionDuration', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SLOT INDEPENDENT DVE ================= */}
        {activeTab === 'slotDVE' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
              <span className="font-mono text-amber-400 font-bold text-[11px]">
                SLOT #{selectedSlotIndex + 1} DVE & COLOR LUT
              </span>
              <button 
                onClick={resetSlotDVE} 
                className="text-[10.5px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-800 px-2 py-0.5 rounded"
              >
                <IconReset /> 초기화
              </button>
            </div>

            {/* 슬롯 미디어 소스 할당 */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 block font-bold">ASSIGNED MEDIA SOURCE</label>
              <select
                value={grid.cellMedia?.[selectedSlotIndex] || clip.url}
                onChange={(e) => assignSlotMedia(selectedSlotIndex, e.target.value)}
                className="w-full bg-[#14161F] border border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-100 text-[11.5px] font-semibold outline-none cursor-pointer focus:border-amber-500"
              >
                <option value={clip.url}>기본 클립 마스터 소스 (Default Clip)</option>
                {mediaPool?.map(m => (
                  <option key={m.id} value={m.url}>{m.name} ({m.type?.toUpperCase() || 'MEDIA'})</option>
                ))}
              </select>
            </div>

            {/* 슬롯 캡션 라벨 & 시작 트리밍(In-Point) */}
            <div className="grid grid-cols-3 gap-2 bg-[#14161F] p-2.5 rounded-xl border border-zinc-800">
              <div className="col-span-2">
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">SLOT BADGE LABEL</label>
                <input
                  type="text"
                  value={currentSlotDVE.label || ''}
                  onChange={(e) => handleSlotDVE('label', e.target.value)}
                  placeholder="슬롯 캡션 (예: CAM 1)"
                  className="w-full bg-black/50 border border-zinc-700/80 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">IN-POINT (초)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={currentSlotDVE.inPoint || 0}
                  onChange={(e) => handleSlotDVE('inPoint', Number(e.target.value))}
                  className="w-full bg-black/50 border border-zinc-700/80 rounded px-2 py-1 text-[11px] font-mono text-amber-300 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 슬롯 컬러 LUT 필터 */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">SLOT COLOR LUT FILTER</span>
              <div className="grid grid-cols-3 gap-1">
                {SLOT_LUT_PRESETS.map((lut) => (
                  <button
                    key={lut.id}
                    type="button"
                    onClick={() => handleSlotDVE('lut', lut.id)}
                    className={`py-1.5 px-2 rounded border text-[10.5px] font-semibold transition-all cursor-pointer truncate ${
                      (currentSlotDVE.lut || 'none') === lut.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#14161F] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lut.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 슬롯 오디오 라우팅 */}
            <div className="flex items-center justify-between bg-[#14161F] p-2.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <IconVolume />
                <div>
                  <span className="text-[11px] font-bold text-zinc-100 block">마스터 오디오 채널로 지정</span>
                  <span className="text-[9.5px] text-zinc-400">재생 시 이 슬롯의 오디오를 메인으로 출력</span>
                </div>
              </div>
              <input 
                type="radio"
                name="masterAudioGroup"
                checked={(grid.masterAudioSlot ?? 0) === selectedSlotIndex}
                onChange={() => handleGridKey('masterAudioSlot', selectedSlotIndex)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 슬롯 줌(Scale) & 회전(Rotation) & 좌우반전 */}
            <div className="bg-[#14161F] p-2.5 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>SLOT ZOOM</span>
                    <span className="text-amber-400 font-bold">{currentSlotDVE.scale || 100}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="300" value={currentSlotDVE.scale || 100}
                    onChange={(e) => handleSlotDVE('scale', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>ROTATION</span>
                    <span className="text-zinc-200 font-bold">{currentSlotDVE.rotate || 0}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" value={currentSlotDVE.rotate || 0}
                    onChange={(e) => handleSlotDVE('rotate', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>PAN (X 이동)</span>
                    <span className="font-mono text-zinc-200">{currentSlotDVE.x || 0}px</span>
                  </div>
                  <input 
                    type="range" min="-200" max="200" value={currentSlotDVE.x || 0}
                    onChange={(e) => handleSlotDVE('x', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>TILT (Y 이동)</span>
                    <span className="font-mono text-zinc-200">{currentSlotDVE.y || 0}px</span>
                  </div>
                  <input 
                    type="range" min="-200" max="200" value={currentSlotDVE.y || 0}
                    onChange={(e) => handleSlotDVE('y', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 슬롯 피팅 모드 & 좌우 미러 반전 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-3 gap-1 bg-[#14161F] p-1 border border-zinc-800 rounded-lg">
                {[
                  { id: 'cover', label: '채움(Cover)' },
                  { id: 'contain', label: '맞춤(Fit)' },
                  { id: 'fill', label: '스트레치' }
                ].map((fitMode) => (
                  <button
                    key={fitMode.id}
                    onClick={() => handleSlotDVE('fit', fitMode.id)}
                    className={`py-1 text-[10.5px] rounded transition-colors cursor-pointer ${
                      (currentSlotDVE.fit || 'cover') === fitMode.id
                        ? 'bg-zinc-700 text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fitMode.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleSlotDVE('flipX', !currentSlotDVE.flipX)}
                className={`px-3 py-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                  currentSlotDVE.flipX
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#14161F] border-zinc-800 text-zinc-400'
                }`}
              >
                ↔ 좌우반전
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BEZEL, GUTTER & MATTE ================= */}
        {activeTab === 'bezelStyle' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                BEZEL FINISH THEMES
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'borderless', name: '무여백 클린 (Seamless)', gap: 0, margin: 0, border: 0, color: 'transparent', radius: 0 },
                  { id: 'film_strip', name: '필름 스트립 블랙 매트', gap: 6, margin: 8, border: 2, color: '#000000', radius: 4 },
                  { id: 'titanium', name: '티타늄 모노크롬 라인', gap: 4, margin: 6, border: 1, color: '#27272A', radius: 6 },
                  { id: 'amber_gold', name: '스튜디오 앰버 골드', gap: 5, margin: 8, border: 1.5, color: '#D97706', radius: 8 },
                  { id: 'white_gallery', name: '화이트 매거진 프레임', gap: 8, margin: 12, border: 2, color: '#F4F4F5', radius: 10 },
                  { id: 'neon_cyber', name: '사이버 시안 글로우', gap: 6, margin: 8, border: 1.5, color: '#06B6D4', radius: 8 }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      handleGridPatch({
                        borderTheme: theme.id,
                        gap: theme.gap,
                        outerMargin: theme.margin,
                        borderWidth: theme.border,
                        borderColor: theme.color,
                        cellRadius: theme.radius
                      });
                    }}
                    className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                      grid.borderTheme === theme.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] block text-zinc-100">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 칸 간격 (Gutter) & 외곽 여백 (Safe Margin) & 라운드 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>GUTTER (셀 사이 간격)</span>
                  <span className="text-amber-400 font-bold">{grid.gap ?? 4}px</span>
                </div>
                <input 
                  type="range" min="0" max="40" value={grid.gap ?? 4}
                  onChange={(e) => handleGridKey('gap', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>OUTER MARGIN (외곽 베젤 여백)</span>
                  <span className="text-zinc-100 font-bold">{grid.outerMargin ?? 6}px</span>
                </div>
                <input 
                  type="range" min="0" max="48" value={grid.outerMargin ?? 6}
                  onChange={(e) => handleGridKey('outerMargin', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>CORNER RADIUS (모서리 둥글기)</span>
                  <span className="text-zinc-100 font-bold">{grid.cellRadius ?? 6}px</span>
                </div>
                <input 
                  type="range" min="0" max="36" value={grid.cellRadius ?? 6}
                  onChange={(e) => handleGridKey('cellRadius', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 보더 두께 및 프레임/배경 컬러 픽커 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                  <span>BORDER WIDTH (테두리 두께)</span>
                  <span className="text-zinc-100 font-bold">{grid.borderWidth ?? 1}px</span>
                </div>
                <input 
                  type="range" min="0" max="8" step="0.5" value={grid.borderWidth ?? 1}
                  onChange={(e) => handleGridKey('borderWidth', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400">테두리색</span>
                  <input 
                    type="color" 
                    value={grid.borderColor === 'transparent' ? '#27272A' : (grid.borderColor || '#27272A')}
                    onChange={(e) => handleGridKey('borderColor', e.target.value)}
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0"
                  />
                </div>
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400">배경매트</span>
                  <input 
                    type="color" 
                    value={grid.canvasBgColor || '#050507'}
                    onChange={(e) => handleGridKey('canvasBgColor', e.target.value)}
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
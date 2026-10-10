import React, { useState } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// =====================================================================
// 🎬 엔터프라이즈 모노크롬 SVG 아이콘 (DaVinci Resolve Style)
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
  <svg className="w-3 h-3 text-zinc-500 hover:text-zinc-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const IconVolume = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

// =====================================================================
// 🎬 헐리우드 비디오월 토폴로지 마스터 프리셋
// =====================================================================
const TOPOLOGY_PRESETS = [
  { id: '3x3_hollywood', name: '3×3 헐리우드 콜라주', rows: 3, cols: 3, desc: '9분할 다빈치 리졸브 시그니처 그리드' },
  { id: '2x2_quad', name: '2×2 쿼드 비디오월', rows: 2, cols: 2, desc: '대칭형 4분할 클래식 멀티스크린' },
  { id: '1top_2bot', name: '1 상단 + 2 하단 분할', rows: 2, cols: 2, isAsymmetric: true, desc: '메인 상단 와이드 + 하단 서브 2분할' },
  { id: '2top_1bot', name: '2 상단 + 1 하단 분할', rows: 2, cols: 2, isAsymmetric: true, desc: '비교 영상 2개 + 하단 해설 1개' },
  { id: '1x3_vertical', name: '1×3 릴스 3단 스택', rows: 3, cols: 1, desc: '9:16 모바일 세로 3단 시네마틱 스택' },
  { id: '2x1_horizontal', name: '2×1 좌우 대칭 스플릿', rows: 1, cols: 2, desc: '와이드 인터뷰 및 전후 비교' }
];

export default function GridSettings({ clip }) {
  const { updateClip, mediaPool } = useNLEStore();

  // 인스펙터 워크플로우 탭: topology | sequencer | slotDVE | bezelStyle
  const [activeTab, setActiveTab] = useState('topology');
  // 현재 포커스된 슬롯 인덱스 (기본: 0번 슬롯)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  if (!clip) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-mono select-none">
        클립을 선택하면 비디오월 매트릭스 인스펙터가 활성화됩니다.
      </div>
    );
  }

  // 🌟 그리드 비디오월 마스터 설정 객체 (기본값 무결성 보장)
  const grid = {
    mode: 'matrix',          // 'single' | 'matrix'
    rows: 3,
    cols: 3,
    topologyPreset: '3x3_hollywood',
    gap: 4,                  // 거터 간격 (px)
    outerMargin: 0,          // 외곽 세이프존 여백 (px)
    cellRadius: 6,           // 모서리 둥글기 (px)
    borderWidth: 1,          // 프레임 두께 (px)
    borderColor: '#27272A',  // 다크 티타늄 기본
    borderTheme: 'titanium', // 'borderless' | 'film_strip' | 'titanium' | 'amber_gold'
    
    // 시퀀서 엔진
    sequentialPlay: true,    // 순차 점등 활성화 여부
    sequencePattern: 'cascade_lr', // 'cascade_lr' | 'spiral_in' | 'wave' | 'random'
    staggerDelay: 0.18,      // 박스당 점등 딜레이 (초)
    motionDuration: 0.45,    // 개별 박스 등장 지속시간 (초)
    motionEasing: 'cubic-bezier(0.16, 1, 0.3, 1)', // 시네마틱 감속 베지어
    entranceFx: 'punch_in',  // 'punch_in' | 'film_flash' | 'slide_up' | 'dissolve' | 'anamorphic_wipe'
    
    // 글로벌 카메라 리그 모션
    globalPushIn: true,      // 월 전체 슬로우 푸시인 줌
    globalPushSpeed: 4,      // 줌 속도 (%)
    masterAudioSlot: 0,      // 오디오 마스터 슬롯 (나머지는 음소거)
    
    // 슬롯별 독립 데이터
    cellMedia: {},           // { [idx]: mediaUrl }
    cellTransforms: {},      // { [idx]: { scale, x, y, rotate, fit, mute, inPoint, opacity } }
    ...(clip.gridConfig || {})
  };

  const totalCells = (grid.rows || 1) * (grid.cols || 1);

  // 현재 선택된 슬롯의 독립 DVE 상태
  const currentSlotDVE = grid.cellTransforms?.[selectedSlotIndex] || {
    scale: 100,
    x: 0,
    y: 0,
    rotate: 0,
    fit: 'cover',   // 'cover' | 'contain' | 'fill'
    mute: selectedSlotIndex !== (grid.masterAudioSlot ?? 0),
    inPoint: 0,
    opacity: 100
  };

  // 갱신 핸들러
  const handleGridKey = (key, val) => {
    updateClip(clip.id, {
      gridConfig: { ...grid, [key]: val }
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

  // 슬롯 미디어 소스 할당
  const assignSlotMedia = (slotIdx, mediaUrl) => {
    const nextMediaMap = { ...(grid.cellMedia || {}), [slotIdx]: mediaUrl };
    handleGridKey('cellMedia', nextMediaMap);
  };

  // 토폴로지 프리셋 적용 매크로
  const applyPreset = (preset) => {
    setSelectedSlotIndex(0);
    updateClip(clip.id, {
      gridConfig: {
        ...grid,
        rows: preset.rows,
        cols: preset.cols,
        topologyPreset: preset.id,
        cellRadius: preset.rows === 3 ? 4 : 8
      }
    });
  };

  // 슬롯 트랜스폼 리셋
  const resetSlotDVE = () => {
    handleSlotDVE('scale', 100);
    handleSlotDVE('x', 0);
    handleSlotDVE('y', 0);
    handleSlotDVE('rotate', 0);
    handleSlotDVE('opacity', 100);
    handleSlotDVE('fit', 'cover');
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#0F1015] border-l border-zinc-800 text-zinc-300 font-sans select-none text-[12px]"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* 1. 최상단 인스펙터 헤더 */}
      <div className="px-3.5 py-2.5 bg-[#14161F] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="font-mono font-semibold text-zinc-200 text-[11px] uppercase tracking-wider">
            Video Wall Studio : DVE Matrix
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/40">
            {grid.cols}×{grid.rows} ({totalCells} Slots)
          </span>
        </div>
      </div>

      {/* 2. 시각적 인터랙티브 비디오월 모니터 (실시간 슬롯 네비게이션) */}
      <div className="p-3 bg-[#11131A] border-b border-zinc-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
          <span>INTERACTIVE CELL TOPOLOGY</span>
          <span className="text-amber-400 font-bold">Slot #{selectedSlotIndex + 1} Active</span>
        </div>

        {/* 9:16 세로 릴스 뷰포트 내 가상 그리드 월 모니터 */}
        <div 
          className="w-full aspect-[9/16] max-h-40 bg-[#07080B] rounded-lg p-1.5 border border-zinc-800 grid gap-1 mx-auto shadow-inner"
          style={{
            gridTemplateRows: `repeat(${grid.rows || 3}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${grid.cols || 3}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalCells }).map((_, idx) => {
            const isSelected = selectedSlotIndex === idx;
            const isMasterAudio = (grid.masterAudioSlot ?? 0) === idx;
            const slotMediaUrl = grid.cellMedia?.[idx] || clip.url;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSlotIndex(idx)}
                className={`relative rounded overflow-hidden border flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-amber-400 ring-1 ring-amber-400/80 bg-amber-500/15 shadow-md' 
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
                }`}
              >
                {slotMediaUrl && (
                  <div 
                    className="absolute inset-0 opacity-35 bg-cover bg-center pointer-events-none" 
                    style={{ backgroundImage: `url(${slotMediaUrl})` }} 
                  />
                )}
                <div className="w-full flex justify-between items-center relative z-10 pointer-events-none">
                  <span className="font-mono text-[8.5px] font-bold text-zinc-300 bg-black/70 px-1 rounded">
                    #{idx + 1}
                  </span>
                  {isMasterAudio && (
                    <span className="text-[9px] text-amber-400 font-bold" title="마스터 오디오 채널">🔊</span>
                  )}
                </div>
                <div className="relative z-10 text-[8px] font-mono text-zinc-400 truncate w-full text-center">
                  {grid.cellTransforms?.[idx]?.scale ? `${grid.cellTransforms[idx].scale}%` : '100%'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 인스펙터 4대 탭 바 */}
      <div className="flex border-b border-zinc-800 bg-[#13151C] px-2 pt-1 gap-1">
        {[
          { id: 'topology', label: '레이아웃', icon: <IconMatrix /> },
          { id: 'sequencer', label: '시퀀서', icon: <IconSequencer /> },
          { id: 'slotDVE', label: '슬롯 DVE', icon: <IconSlotDVE /> },
          { id: 'bezelStyle', label: '스타일·베젤', icon: <IconBezel /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === tab.id
                ? 'border-amber-500 text-zinc-100 bg-zinc-800/40 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. 탭별 세부 제어 패널 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* ================= TAB 1: TOPOLOGY & LAYOUT ================= */}
        {activeTab === 'topology' && (
          <div className="space-y-4">
            {/* 헐리우드 토폴로지 프리셋 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                HOLLYWOOD TOPOLOGY PRESETS
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {TOPOLOGY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`p-2 text-left rounded border transition-all flex flex-col gap-0.5 cursor-pointer ${
                      grid.topologyPreset === preset.id
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-200'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="font-semibold text-[11px] text-zinc-100">{preset.name}</span>
                    <span className="text-[9.5px] text-zinc-500 line-clamp-1">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 정밀 행/열 수치 다이얼 */}
            <div className="bg-[#14161F] p-2.5 rounded-lg border border-zinc-800 space-y-2.5">
              <span className="text-[10.5px] font-mono text-zinc-400 font-semibold block uppercase">
                Custom Matrix Dimension
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>COLUMNS (열)</span>
                    <span className="text-zinc-100 font-bold">{grid.cols}열</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" value={grid.cols || 3}
                    onChange={(e) => handleGridKey('cols', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>ROWS (행)</span>
                    <span className="text-zinc-100 font-bold">{grid.rows}행</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" value={grid.rows || 3}
                    onChange={(e) => handleGridKey('rows', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 글로벌 카메라 리그 모션 (전체 비디오월 슬로우 줌인) */}
            <div className="bg-[#14161F] p-2.5 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-200 block">시네마틱 슬로우 푸시인 (Push-In)</span>
                  <span className="text-[9.5px] text-zinc-500">전체 비디오월이 재생되며 서서히 클로즈업되는 카메라 무빙</span>
                </div>
                <input 
                  type="checkbox"
                  checked={!!grid.globalPushIn}
                  onChange={(e) => handleGridKey('globalPushIn', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {grid.globalPushIn && (
                <div className="pt-1.5 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>CAMERA PUSH SPEED</span>
                    <span className="text-amber-400 font-bold">+{grid.globalPushSpeed || 4}%</span>
                  </div>
                  <input 
                    type="range" min="1" max="15" value={grid.globalPushSpeed || 4}
                    onChange={(e) => handleGridKey('globalPushSpeed', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SEQUENCER & ENTRANCE FX ================= */}
        {activeTab === 'sequencer' && (
          <div className="space-y-4">
            {/* 순차 점등 마스터 토글 */}
            <div className="flex items-center justify-between bg-[#14161F] p-2.5 rounded-lg border border-zinc-800">
              <div>
                <span className="text-[11px] font-semibold text-zinc-200 block">순차 점등 시퀀서 활성화</span>
                <span className="text-[9.5px] text-zinc-500">1번 박스부터 딜레이를 두고 시네마틱하게 켜지는 연출</span>
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
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                SEQUENCE ORDER PATTERN
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'cascade_lr', name: '좌→우 순차 캐스케이드' },
                  { id: 'spiral_in', name: '외곽→중심 나선형 유입' },
                  { id: 'wave', name: '상→하 수직 파도 웨이브' },
                  { id: 'random', name: '랜덤 바이럴 팝' }
                ].map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => handleGridKey('sequencePattern', pat.id)}
                    className={`py-2 px-2 text-left rounded border text-[11px] transition-colors ${
                      grid.sequencePattern === pat.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-semibold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {pat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 슬롯 인-이펙트 FX */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                SLOT ENTRANCE MOTION FX
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'punch_in', name: '시네마틱 펀치 줌인' },
                  { id: 'film_flash', name: '필름 셔터 화이트 플래시' },
                  { id: 'slide_up', name: '슬라이드 업 댐핑' },
                  { id: 'dissolve', name: '소프트 크로스 디졸브' },
                  { id: 'anamorphic_wipe', name: '아나모픽 블라인드 와이프' },
                  { id: 'instant', name: '이펙트 없음 (Instant Cut)' }
                ].map((fx) => (
                  <button
                    key={fx.id}
                    onClick={() => handleGridKey('entranceFx', fx.id)}
                    className={`py-2 px-2 text-left rounded border text-[11px] transition-colors ${
                      grid.entranceFx === fx.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-semibold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fx.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 타이밍 제어 (간격 & 모션 지속시간) */}
            <div className="bg-[#14161F] p-2.5 rounded-lg border border-zinc-800 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>STAGGER INTERVAL (간격 딜레이)</span>
                  <span className="text-amber-400 font-bold">{grid.staggerDelay || 0.18}s</span>
                </div>
                <input 
                  type="range" min="0.05" max="0.6" step="0.02" value={grid.staggerDelay || 0.18}
                  onChange={(e) => handleGridKey('staggerDelay', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1.5 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>MOTION DURATION (이펙트 길이)</span>
                  <span className="text-zinc-200 font-bold">{grid.motionDuration || 0.45}s</span>
                </div>
                <input 
                  type="range" min="0.1" max="1.2" step="0.05" value={grid.motionDuration || 0.45}
                  onChange={(e) => handleGridKey('motionDuration', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SLOT INDEPENDENT DVE ================= */}
        {activeTab === 'slotDVE' && (
          <div className="space-y-3.5">
            {/* 현재 편집 중인 슬롯 인디케이터 및 리셋 */}
            <div className="flex items-center justify-between bg-zinc-900/90 px-2.5 py-1.5 rounded border border-zinc-800">
              <span className="font-mono text-amber-400 font-bold text-[11px]">
                SLOT #{selectedSlotIndex + 1} INDEPENDENT CONTROLS
              </span>
              <button 
                onClick={resetSlotDVE} 
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <IconReset /> DVE 초기화
              </button>
            </div>

            {/* 슬롯 미디어 소스 할당 */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono text-zinc-400 block">ASSIGNED MEDIA SOURCE</label>
              <select
                value={grid.cellMedia?.[selectedSlotIndex] || clip.url}
                onChange={(e) => assignSlotMedia(selectedSlotIndex, e.target.value)}
                className="w-full bg-[#14161F] border border-zinc-700/60 rounded px-2 py-1.5 text-zinc-200 text-[11.5px] outline-none cursor-pointer focus:border-amber-500"
              >
                <option value={clip.url}>기본 클립 마스터 소스 (Default Clip)</option>
                {mediaPool?.map(m => (
                  <option key={m.id} value={m.url}>{m.name} ({m.type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {/* 슬롯 오디오 라우팅 (마스터 슬롯 설정) */}
            <div className="flex items-center justify-between bg-[#14161F] p-2 rounded border border-zinc-800">
              <div className="flex items-center gap-2">
                <IconVolume />
                <div>
                  <span className="text-[11px] font-semibold text-zinc-200 block">이 슬롯을 마스터 오디오로 지정</span>
                  <span className="text-[9.5px] text-zinc-500">영상 분할 시 이 박스의 소리만 메인 스피커로 출력</span>
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

            {/* 슬롯 줌(Scale) & 회전(Rotation) */}
            <div className="grid grid-cols-2 gap-2 bg-[#14161F] p-2.5 rounded-lg border border-zinc-800">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                  <span>SLOT ZOOM</span>
                  <span className="text-amber-400 font-bold">{currentSlotDVE.scale || 100}%</span>
                </div>
                <input 
                  type="range" min="50" max="300" value={currentSlotDVE.scale || 100}
                  onChange={(e) => handleSlotDVE('scale', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
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
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 슬롯 팬(X) & 틸트(Y) 오프셋 */}
            <div className="grid grid-cols-2 gap-2 bg-[#14161F] p-2.5 rounded-lg border border-zinc-800">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                  <span>PAN (X OFFSET)</span>
                  <span className="font-mono text-zinc-200">{currentSlotDVE.x || 0}px</span>
                </div>
                <input 
                  type="range" min="-200" max="200" value={currentSlotDVE.x || 0}
                  onChange={(e) => handleSlotDVE('x', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                  <span>TILT (Y OFFSET)</span>
                  <span className="font-mono text-zinc-200">{currentSlotDVE.y || 0}px</span>
                </div>
                <input 
                  type="range" min="-200" max="200" value={currentSlotDVE.y || 0}
                  onChange={(e) => handleSlotDVE('y', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 슬롯 피팅 모드 (Fill / Fit / Stretch) */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">ASPECT RATIO FIT</span>
              <div className="grid grid-cols-3 gap-1 bg-[#14161F] p-1 border border-zinc-800 rounded">
                {[
                  { id: 'cover', label: '채움 (Cover)' },
                  { id: 'contain', label: '맞춤 (Fit)' },
                  { id: 'fill', label: '스트레치' }
                ].map((fitMode) => (
                  <button
                    key={fitMode.id}
                    onClick={() => handleSlotDVE('fit', fitMode.id)}
                    className={`py-1 text-[11px] rounded transition-colors ${
                      (currentSlotDVE.fit || 'cover') === fitMode.id
                        ? 'bg-zinc-700 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fitMode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BEZEL, GUTTER & MATTE ================= */}
        {activeTab === 'bezelStyle' && (
          <div className="space-y-4">
            {/* 베젤 피니시 테마 프리셋 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                BEZEL FINISH THEMES
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'borderless', name: '무여백 클린 (Seamless)', gap: 0, border: 0, color: 'transparent', radius: 0 },
                  { id: 'film_strip', name: '필름 스트립 블랙 매트', gap: 6, border: 2, color: '#000000', radius: 4 },
                  { id: 'titanium', name: '티타늄 모노크롬 라인', gap: 4, border: 1, color: '#27272A', radius: 6 },
                  { id: 'amber_gold', name: '스튜디오 앰버 골드', gap: 5, border: 1.5, color: '#D97706', radius: 8 }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      updateClip(clip.id, {
                        gridConfig: {
                          ...grid,
                          borderTheme: theme.id,
                          gap: theme.gap,
                          borderWidth: theme.border,
                          borderColor: theme.color,
                          cellRadius: theme.radius
                        }
                      });
                    }}
                    className={`p-2 text-left rounded border transition-all cursor-pointer ${
                      grid.borderTheme === theme.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-semibold text-[11px] block text-zinc-100">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 칸 간격 (Gutter) & 외곽 패딩 */}
            <div className="bg-[#14161F] p-2.5 rounded-lg border border-zinc-800 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>GUTTER (칸 간격)</span>
                  <span className="text-zinc-100 font-bold">{grid.gap || 0}px</span>
                </div>
                <input 
                  type="range" min="0" max="40" value={grid.gap || 0}
                  onChange={(e) => handleGridKey('gap', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1.5 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>CORNER RADIUS (모서리 둥글기)</span>
                  <span className="text-zinc-100 font-bold">{grid.cellRadius || 0}px</span>
                </div>
                <input 
                  type="range" min="0" max="32" value={grid.cellRadius || 0}
                  onChange={(e) => handleGridKey('cellRadius', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 보더 두께 및 컬러 픽커 */}
            <div className="bg-[#14161F] p-2.5 rounded-lg border border-zinc-800 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>BORDER WIDTH (프레임 두께)</span>
                  <span className="text-zinc-100 font-bold">{grid.borderWidth || 0}px</span>
                </div>
                <input 
                  type="range" min="0" max="8" step="0.5" value={grid.borderWidth || 0}
                  onChange={(e) => handleGridKey('borderWidth', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-400">BORDER COLOR</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={grid.borderColor || '#27272A'}
                    onChange={(e) => handleGridKey('borderColor', e.target.value)}
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0"
                  />
                  <span className="font-mono text-[10.5px] text-zinc-300 uppercase">
                    {grid.borderColor || '#27272A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
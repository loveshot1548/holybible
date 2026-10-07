// src/components/inspector/GridSettings.js
import React, { useState } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgReset = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const SvgFlipH = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
  </svg>
);
const SvgFlipV = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-4.5L21 16.5m0 0l-4.5 4.5M21 16.5V3" />
  </svg>
);

export default function GridSettings({ clip }) {
  const { updateClip, mediaPool } = useNLEStore();

  // 🌟 현재 상세 조율 중인 활성 슬롯 인덱스 (기본: 0번 슬롯)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  if (!clip) return null;

  // 1. 단일 변형(Transform) 상태 객체 무결성 확보
  const transform = {
    x: 0,
    y: 0,
    scale: 100,
    rotate: 0,
    opacity: 100,
    borderRadius: 0,
    shadowBlur: 0,
    flipH: false,
    flipV: false,
    blendMode: 'normal',
    ...(clip.transform || {})
  };

  // 2. 크롭(Crop) 상태 객체 무결성 확보
  const crop = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    softness: 0,
    ...(clip.crop || {})
  };

  // 3. 그리드 비디오월 설정 객체 (고도화 파라미터 통합)
  const grid = {
    mode: 'single', // 'single' | 'matrix'
    rows: 2,
    cols: 2,
    gap: 4,
    borderWidth: 0,
    borderColor: '#00E5FF',
    cellRadius: 0,
    staggerDelay: 0.2,
    sequentialPlay: false, // 1번 박스부터 차례대로 켜지는 순차 재생 여부
    cellMedia: {},         // 슬롯별 소스 매핑 { [idx]: url }
    cellTransforms: {},    // 🌟 슬롯별 독립 위치/스케일 { [idx]: { scale, x, y, delay } }
    ...(clip.gridConfig || {})
  };

  // 슬롯별 독립 트랜스폼 기본값
  const currentSlotTransform = grid.cellTransforms?.[selectedSlotIndex] || {
    scale: 100,
    x: 0,
    y: 0,
    delay: 0,
    fit: 'cover' // 'cover' | 'contain'
  };

  // 핸들러 함수군
  const handleTransform = (key, val) => {
    updateClip(clip.id, {
      transform: { ...transform, [key]: val }
    });
  };

  const handleCrop = (key, val) => {
    updateClip(clip.id, {
      crop: { ...crop, [key]: Number(val) }
    });
  };

  const handleGrid = (key, val) => {
    updateClip(clip.id, {
      gridConfig: { ...grid, [key]: val }
    });
  };

  const handleCellMediaAssign = (cellIdx, mediaUrl) => {
    const nextCells = { ...(grid.cellMedia || {}), [cellIdx]: mediaUrl };
    handleGrid('cellMedia', nextCells);
  };

  // 🌟 슬롯별 독립 변형 업데이트
  const handleSlotTransform = (key, val) => {
    const nextSlotTransforms = {
      ...(grid.cellTransforms || {}),
      [selectedSlotIndex]: {
        ...currentSlotTransform,
        [key]: val
      }
    };
    handleGrid('cellTransforms', nextSlotTransforms);
  };

  // 🌟 원클릭 캔버스 정렬 매크로
  const applyQuickAlign = (alignType) => {
    let updates = {};
    if (alignType === 'center') {
      updates = { x: 0, y: 0 };
    } else if (alignType === 'top') {
      updates = { x: 0, y: -260 };
    } else if (alignType === 'bottom') {
      updates = { x: 0, y: 260 };
    } else if (alignType === 'fill') {
      updates = { x: 0, y: 0, scale: 100 };
      updateClip(clip.id, { scaling: 'fill' });
    } else if (alignType === 'fit') {
      updates = { x: 0, y: 0, scale: 100 };
      updateClip(clip.id, { scaling: 'fit' });
    }
    updateClip(clip.id, { transform: { ...transform, ...updates } });
  };

  // 🌟 비디오월 퀵 프리셋 매크로
  const applyGridPreset = (r, c) => {
    setSelectedSlotIndex(0);
    updateClip(clip.id, {
      gridConfig: { ...grid, rows: r, cols: c, mode: 'matrix' }
    });
  };

  // 초기화 핸들러
  const resetTransform = () => {
    updateClip(clip.id, {
      transform: {
        x: 0, y: 0, scale: 100, rotate: 0, opacity: 100,
        borderRadius: 0, shadowBlur: 0, flipH: false, flipV: false, blendMode: 'normal'
      }
    });
  };

  const resetCrop = () => {
    updateClip(clip.id, {
      crop: { left: 0, right: 0, top: 0, bottom: 0, softness: 0 }
    });
  };

  const resetCurrentSlot = () => {
    handleSlotTransform('scale', 100);
    handleSlotTransform('x', 0);
    handleSlotTransform('y', 0);
    handleSlotTransform('delay', 0);
  };

  const totalCells = (grid.rows || 1) * (grid.cols || 1);

  return (
    <div 
      className="p-3.5 bg-[#12141C] border border-white/10 rounded-2xl space-y-4 select-none text-zinc-300 font-sans shadow-xl text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* 1. 인스펙터 탭 헤더: 모드 전환 (단일 자유배치 vs 비디오월 매트릭스) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <span className="font-mono font-black text-xs text-white tracking-wider">
            TRANSFORM & COMPOSITOR
          </span>
        </div>
        <select
          value={grid.mode || 'single'}
          onChange={(e) => handleGrid('mode', e.target.value)}
          className="bg-[#0A0B0E] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-[#00E5FF] font-bold outline-none cursor-pointer"
        >
          <option value="single">단일 화면 (자유 배치)</option>
          <option value="matrix">분할 매트릭스 (비디오 월)</option>
        </select>
      </div>

      {grid.mode === 'single' ? (
        <div className="space-y-3.5">
          
          {/* 🌟 원터치 퀵 캔버스 정렬 스냅 바 */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold block">CANVAS QUICK SNAP</span>
            <div className="grid grid-cols-5 gap-1 bg-[#0A0B0E] p-1 rounded-xl border border-white/5">
              <button onClick={() => applyQuickAlign('center')} className="py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">중앙</button>
              <button onClick={() => applyQuickAlign('top')} className="py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">상단</button>
              <button onClick={() => applyQuickAlign('bottom')} className="py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">하단</button>
              <button onClick={() => applyQuickAlign('fill')} className="py-1 rounded bg-white/5 hover:bg-white/10 text-[#00E5FF] font-black text-[10px] cursor-pointer">채움(Fill)</button>
              <button onClick={() => applyQuickAlign('fit')} className="py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">맞춤(Fit)</button>
            </div>
          </div>

          {/* 2. 위치 좌표 (Position X, Y) */}
          <div className="space-y-2 bg-[#090A0E] p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>POSITION (COORDINATES)</span>
              <button onClick={resetTransform} className="text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer">
                <SvgReset /> 리셋
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                  <span>POS X</span>
                  <span className="font-mono text-white font-bold">{transform.x}px</span>
                </div>
                <input 
                  type="range" min="-720" max="720" value={transform.x}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleTransform('x', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                  <span>POS Y</span>
                  <span className="font-mono text-white font-bold">{transform.y}px</span>
                </div>
                <input 
                  type="range" min="-1280" max="1280" value={transform.y}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleTransform('y', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. 줌(Scale), 회전(Rotation) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>ZOOM (SCALE)</span>
                <span className="font-mono text-[#00E5FF] font-black">{transform.scale}%</span>
              </div>
              <input 
                type="range" min="10" max="400" value={transform.scale}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleTransform('scale', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>ROTATION</span>
                <span className="font-mono text-white font-bold">{transform.rotate}°</span>
              </div>
              <input 
                type="range" min="-180" max="180" value={transform.rotate}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleTransform('rotate', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 4. 불투명도(Opacity) & 블렌드 합성 모드 */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>OPACITY (투명도)</span>
                <span className="font-mono text-white font-bold">{transform.opacity ?? 100}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={transform.opacity ?? 100}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleTransform('opacity', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-0.5 font-bold">BLEND MODE</span>
              <select
                value={transform.blendMode || 'normal'}
                onChange={(e) => handleTransform('blendMode', e.target.value)}
                className="w-full bg-[#0A0B0E] border border-white/10 rounded-lg p-1 text-white text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="normal">Normal (표준)</option>
                <option value="screen">Screen (빛 합성/투과)</option>
                <option value="multiply">Multiply (어두운 합성)</option>
                <option value="overlay">Overlay (대비 강조)</option>
                <option value="color-dodge">Color Dodge (글로우)</option>
                <option value="difference">Difference (반전 대비)</option>
              </select>
            </div>
          </div>

          {/* 5. 반전 스위치 (Flip H/V) */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <button
              onClick={() => handleTransform('flipH', !transform.flipH)}
              className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                transform.flipH ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <SvgFlipH /> 좌우 대칭 (Mirror)
            </button>

            <button
              onClick={() => handleTransform('flipV', !transform.flipV)}
              className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                transform.flipV ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <SvgFlipV /> 상하 반전 (Invert)
            </button>
          </div>

          {/* 6. 모서리 둥글기 & 그림자 */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>CORNER RADIUS</span>
                <span className="font-mono text-white font-bold">{transform.borderRadius || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="60" value={transform.borderRadius || 0}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleTransform('borderRadius', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>DROP SHADOW</span>
                <span className="font-mono text-white font-bold">{transform.shadowBlur || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="50" value={transform.shadowBlur || 0}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleTransform('shadowBlur', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 7. 정밀 크롭(Crop) 패널 */}
          <div className="pt-2 border-t border-white/10 space-y-2.5 bg-[#090A0E] p-3 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-zinc-300 tracking-wider text-[11px]">
                PRECISION CROPPING & FEATHER
              </span>
              <button onClick={resetCrop} className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer">
                <SvgReset /> 크롭 리셋
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>CROP LEFT</span>
                  <span className="font-mono text-white font-bold">{crop.left}%</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={crop.left}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleCrop('left', e.target.value)}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>CROP RIGHT</span>
                  <span className="font-mono text-white font-bold">{crop.right}%</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={crop.right}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleCrop('right', e.target.value)}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>CROP TOP</span>
                  <span className="font-mono text-white font-bold">{crop.top}%</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={crop.top}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleCrop('top', e.target.value)}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>CROP BOTTOM</span>
                  <span className="font-mono text-white font-bold">{crop.bottom}%</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={crop.bottom}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleCrop('bottom', e.target.value)}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-white/5">
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                <span>EDGE SOFTNESS (페더링)</span>
                <span className="font-mono text-[#00E5FF] font-bold">{crop.softness || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="50" value={crop.softness || 0}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleCrop('softness', e.target.value)}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>
      ) : (
        /* =========================================================================
            🌟 [초고도화] 비디오 월 매트릭스 그리드 설정 (자율 튜닝 스위트 완비)
            ========================================================================= */
        <div className="space-y-4">
          
          {/* 1. 퀵 프리셋 바 */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold block">VIDEO WALL QUICK PRESETS</span>
            <div className="grid grid-cols-4 gap-1 bg-[#0A0B0E] p-1 rounded-xl border border-white/5">
              <button onClick={() => applyGridPreset(2, 1)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">상하 2분할</button>
              <button onClick={() => applyGridPreset(1, 2)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">좌우 2분할</button>
              <button onClick={() => applyGridPreset(3, 1)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer">3단 스트립</button>
              <button onClick={() => applyGridPreset(2, 2)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-[#00E5FF] font-black text-[10px] cursor-pointer">2×2 쿼드월</button>
            </div>
          </div>

          {/* 2. 행/열 매트릭스 차원 설정 */}
          <div className="grid grid-cols-2 gap-2.5 bg-[#090A0E] p-2.5 rounded-xl border border-white/5">
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>열 (가로 칸 수)</span>
                <span className="font-mono text-[#00E5FF] font-black">{grid.cols || 2}열</span>
              </div>
              <input 
                type="range" min="1" max="4" value={grid.cols || 2}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleGrid('cols', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5 text-[10.5px]">
                <span>행 (세로 칸 수)</span>
                <span className="font-mono text-[#00E5FF] font-black">{grid.rows || 2}행</span>
              </div>
              <input 
                type="range" min="1" max="4" value={grid.rows || 2}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ touchAction: 'pan-x' }}
                onChange={(e) => handleGrid('rows', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 🌟 3. 시각적 인터랙티브 미니 그리드 맵 (클릭 시 해당 슬롯 튜닝 모드 진입) */}
          <div className="space-y-1.5 bg-[#090A0E] p-3 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-zinc-400">VISUAL SLOT SELECTOR</span>
              <span className="text-[#00E5FF]">Slot {selectedSlotIndex + 1} 튜닝 중</span>
            </div>
            
            <div 
              className="w-full aspect-[9/16] max-h-36 bg-black rounded-xl p-1.5 border border-white/10 grid gap-1.5 mx-auto"
              style={{
                gridTemplateRows: `repeat(${grid.rows || 2}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${grid.cols || 2}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: totalCells }).map((_, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const slotUrl = grid.cellMedia?.[idx] || clip.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlotIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#00E5FF] ring-2 ring-[#00E5FF] bg-[#00E5FF]/20 shadow-lg' 
                        : 'border-white/10 bg-white/5 hover:border-zinc-500'
                    }`}
                  >
                    {slotUrl && (
                      <div className="absolute inset-0 opacity-40 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${slotUrl})` }} />
                    )}
                    <span className="relative z-10 font-mono font-black text-[9px] text-white bg-black/70 px-1 rounded">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="text-[9.5px] text-zinc-500 block text-center mt-1">박스를 클릭하여 해당 위치의 미디어와 시작 시간을 튜닝하세요.</span>
          </div>

          {/* 🌟 4. 선택한 슬롯 독립 정밀 튜닝 패널 (선택된 박스 전용) */}
          <div className="space-y-3 bg-[#0D0F16] p-3.5 rounded-2xl border border-[#00E5FF]/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-black text-xs text-[#00E5FF]">
                SLOT #{selectedSlotIndex + 1} FINE-TUNING
              </span>
              <button onClick={resetCurrentSlot} className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer">
                <SvgReset /> 슬롯 리셋
              </button>
            </div>

            {/* 미디어 소스 교체 */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 block">할당된 미디어 소스</span>
              <select
                value={grid.cellMedia?.[selectedSlotIndex] || clip.url}
                onChange={(e) => handleCellMediaAssign(selectedSlotIndex, e.target.value)}
                className="w-full bg-black border border-white/15 rounded-xl p-2 text-white text-[11px] font-bold outline-none cursor-pointer focus:border-[#00E5FF]"
              >
                <option value={clip.url}>기본 클립 소스 (Default)</option>
                {mediaPool?.map(m => (
                  <option key={m.id} value={m.url}>{m.name} ({m.type})</option>
                ))}
              </select>
            </div>

            {/* 슬롯 개별 줌(Scale) & 재생 오프셋(Start Delay) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>SLOT ZOOM</span>
                  <span className="font-mono text-white font-bold">{currentSlotTransform.scale || 100}%</span>
                </div>
                <input 
                  type="range" min="50" max="250" value={currentSlotTransform.scale || 100}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleSlotTransform('scale', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>START OFFSET</span>
                  <span className="font-mono text-[#00E5FF] font-bold">{currentSlotTransform.delay || 0}s</span>
                </div>
                <input 
                  type="range" min="0" max="5" step="0.2" value={currentSlotTransform.delay || 0}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleSlotTransform('delay', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 슬롯 개별 위치 미세조정 (X, Y) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>SLOT POS X</span>
                  <span className="font-mono text-white font-bold">{currentSlotTransform.x || 0}px</span>
                </div>
                <input 
                  type="range" min="-150" max="150" value={currentSlotTransform.x || 0}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleSlotTransform('x', Number(e.target.value))}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>SLOT POS Y</span>
                  <span className="font-mono text-white font-bold">{currentSlotTransform.y || 0}px</span>
                </div>
                <input 
                  type="range" min="-150" max="150" value={currentSlotTransform.y || 0}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleSlotTransform('y', Number(e.target.value))}
                  className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 🌟 5. 전역 그리드 스타일링 (간격, 테두리, 셀 모서리 둥글기, 순차 재생 토글) */}
          <div className="space-y-3 bg-[#090A0E] p-3 rounded-2xl border border-white/5">
            <span className="text-[10.5px] font-mono text-zinc-300 font-bold block">GLOBAL GRID STYLING</span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>칸 간격 (Gap)</span>
                  <span className="font-mono text-white font-bold">{grid.gap || 4}px</span>
                </div>
                <input 
                  type="range" min="0" max="32" value={grid.gap || 4}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleGrid('gap', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>셀 둥글기 (Radius)</span>
                  <span className="font-mono text-white font-bold">{grid.cellRadius || 0}px</span>
                </div>
                <input 
                  type="range" min="0" max="30" value={grid.cellRadius || 0}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleGrid('cellRadius', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 테두리 두께 및 테두리 색상 */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
              <div>
                <div className="flex justify-between text-zinc-400 mb-0.5 text-[10px]">
                  <span>테두리 두께 (Border)</span>
                  <span className="font-mono text-white font-bold">{grid.borderWidth || 0}px</span>
                </div>
                <input 
                  type="range" min="0" max="10" value={grid.borderWidth || 0}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ touchAction: 'pan-x' }}
                  onChange={(e) => handleGrid('borderWidth', Number(e.target.value))}
                  className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">테두리 색상</span>
                <div className="flex items-center gap-1.5">
                  {['#00E5FF', '#FFFFFF', '#FFE600', '#FF3B30', '#10B981'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleGrid('borderColor', c)}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-full border cursor-pointer ${grid.borderColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 순차 점등 재생 토글 스위치 */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="font-bold text-[11px] text-white block">순차 점등 재생 (Sequential Stagger)</span>
                <span className="text-[9.5px] text-zinc-400">1번 박스부터 차례대로 켜지는 시네마틱 릴스 연출</span>
              </div>
              <input 
                type="checkbox"
                checked={!!grid.sequentialPlay}
                onChange={(e) => handleGrid('sequentialPlay', e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
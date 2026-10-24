import React, { useRef, useCallback, useState, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// =====================================================================
// 🎬 다빈치 리졸브 표준 SVG 모노크롬 아이콘 세트
// =====================================================================
const IconWheelMode = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconBarsMode = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const IconHslMode = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25a1.125 1.125 0 00-1.125-1.125h-4.072M10.5 8.197l9.804-9.804a2.828 2.828 0 114 4l-9.804 9.804" />
  </svg>
);
const IconScope = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconReset = () => (
  <svg className="w-3 h-3 text-zinc-500 hover:text-zinc-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// =====================================================================
// 🎞️ 필름 프린트 에뮬레이션 LUT 마스터 (3D PFE LUTs)
// =====================================================================
const PRINT_LUTS = [
  { id: 'none', name: 'Rec.709 Direct', desc: '표준 모니터 색역' },
  { id: 'kodak_2383', name: 'Kodak 2383 D65 Film Print', desc: '영화관 상영용 표준 필름 룩 (깊은 블랙 & 따뜻한 하이라이트)' },
  { id: 'fuji_3513', name: 'Fujifilm 3513 Eterna Print', desc: '은은한 섀도우 청록과 부드러운 하이라이트 롤오프' },
  { id: 'arri_709', name: 'ARRI Alexa Wide Gamut', desc: '자연스럽고 정밀한 인물 톤과 상업 광고 표준' },
  { id: 'teal_orange', name: 'Hollywood Teal & Orange DI', desc: '블록버스터 보색 대비 분할 그레이딩' },
  { id: 'vintage_monochrome', name: 'Classic Silver Halide B&W', desc: '은염 입자 질감의 고대비 흑백' }
];

export default function ColorWheels({ clip }) {
  const { updateClip } = useNLEStore();

  // 워크플로우 서브 모드: 'wheels' | 'bars' | 'hsl' | 'lut'
  const [activeMode, setActiveMode] = useState('wheels');
  // 원본 전후 비교 (A/B Bypass)
  const [isBypassed, setIsBypassed] = useState(false);
  // HSL 선택 채널
  const [selectedHslChannel, setSelectedHslChannel] = useState('skin');
  // 스코프 모드 토글
  const [showScopes, setShowScopes] = useState(true);

  if (!clip) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-mono select-none">
        클립을 선택하면 컬러 그레이딩 콘솔이 활성화됩니다.
      </div>
    );
  }

  // 🌟 다빈치 리졸브 4-Way 컬러 파라미터 무결성 보장
  const color = {
    // 4-Way Wheels (Lift, Gamma, Gain, Offset)
    lift: 0, liftTint: { x: 0, y: 0 },
    gamma: 100, gammaTint: { x: 0, y: 0 },
    gain: 100, gainTint: { x: 0, y: 0 },
    offset: 100, offsetTint: { x: 0, y: 0 },
    
    // Primary Tuning
    temperature: 6500,  // 2500K ~ 10000K (6500K 기준 주광)
    tint: 0,            // -100 ~ +100
    exposure: 0,        // -3.00 ~ +3.00 EV
    contrast: 1.0,      // 0.5 ~ 2.0
    pivot: 0.435,       // 0.0 ~ 1.0
    saturation: 100,    // 0 ~ 200%
    colorBoost: 0,      // -100 ~ +100 (Vibrance)
    shadows: 0,         // -100 ~ +100
    highlights: 0,      // -100 ~ +100
    midtoneDetail: 0,   // -100 ~ +100 (피부결 부드러움 / 텍스처 강화)
    
    // 8-Vector HSL Qualifier
    hsl: {
      skin: { hue: 0, sat: 0, lum: 0 },
      red: { hue: 0, sat: 0, lum: 0 },
      yellow: { hue: 0, sat: 0, lum: 0 },
      green: { hue: 0, sat: 0, lum: 0 },
      cyan: { hue: 0, sat: 0, lum: 0 },
      blue: { hue: 0, sat: 0, lum: 0 },
      magenta: { hue: 0, sat: 0, lum: 0 }
    },
    
    // Film Print LUT
    lut: 'none',
    lutMix: 100,
    ...(clip.color || {})
  };

  const handleUpdate = useCallback((key, value) => {
    updateClip(clip.id, {
      color: { ...color, [key]: typeof value === 'number' ? value : value }
    });
  }, [clip.id, color, updateClip]);

  const handleHslUpdate = (prop, val) => {
    updateClip(clip.id, {
      color: {
        ...color,
        hsl: {
          ...color.hsl,
          [selectedHslChannel]: {
            ...color.hsl[selectedHslChannel],
            [prop]: Number(val)
          }
        }
      }
    });
  };

  // 휠 터치/마우스 좌표 연산기
  const calculateWheelCoord = useCallback((key, clientX, clientY, targetRect) => {
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;
    const radius = targetRect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(radius, distance);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * (clampedDist / radius);
    const ny = Math.sin(angle) * (clampedDist / radius);

    updateClip(clip.id, {
      color: {
        ...color,
        [`${key}Tint`]: {
          x: Math.round(nx * 100) / 100,
          y: Math.round(ny * 100) / 100
        }
      }
    });
  }, [clip.id, color, updateClip]);

  // 개별 휠 리셋
  const resetWheel = (wheelKey) => {
    const defaultVal = wheelKey === 'lift' ? 0 : 100;
    updateClip(clip.id, {
      color: {
        ...color,
        [wheelKey]: defaultVal,
        [`${wheelKey}Tint`]: { x: 0, y: 0 }
      }
    });
  };

  // 전역 초기화
  const resetAllColor = () => {
    updateClip(clip.id, {
      color: {
        lift: 0, liftTint: { x: 0, y: 0 },
        gamma: 100, gammaTint: { x: 0, y: 0 },
        gain: 100, gainTint: { x: 0, y: 0 },
        offset: 100, offsetTint: { x: 0, y: 0 },
        temperature: 6500,
        tint: 0,
        exposure: 0,
        contrast: 1.0,
        pivot: 0.435,
        saturation: 100,
        colorBoost: 0,
        shadows: 0,
        highlights: 0,
        midtoneDetail: 0,
        hsl: {
          skin: { hue: 0, sat: 0, lum: 0 },
          red: { hue: 0, sat: 0, lum: 0 },
          yellow: { hue: 0, sat: 0, lum: 0 },
          green: { hue: 0, sat: 0, lum: 0 },
          cyan: { hue: 0, sat: 0, lum: 0 },
          blue: { hue: 0, sat: 0, lum: 0 },
          magenta: { hue: 0, sat: 0, lum: 0 }
        },
        lut: 'none',
        lutMix: 100
      }
    });
  };

  // 10비트 RGB 파라레이드 시뮬레이터 실시간 계측치
  const scopeValues = useMemo(() => {
    const rLvl = Math.min(100, Math.max(5, (color.gain / 150) * 82 + ((color.temperature - 6500) / 120)));
    const gLvl = Math.min(100, Math.max(5, (color.gamma / 150) * 86 - (color.tint * 0.4)));
    const bLvl = Math.min(100, Math.max(5, (color.lift + 100) * 0.4 + ((6500 - color.temperature) / 120)));
    return { r: rLvl, g: gLvl, b: bLvl };
  }, [color.gain, color.gamma, color.lift, color.temperature, color.tint]);

  // =========================================================================
  // 🎨 다빈치 리졸브 4-Way 컬러 휠 단일 유닛
  // =========================================================================
  const ColorWheelModule = ({ label, wheelKey, minVal, maxVal, currentVal, tintVal }) => {
    const padRef = useRef(null);
    const radius = 34; // 휠 반지름 px
    const posX = ((tintVal?.x || 0) * radius) + radius;
    const posY = ((tintVal?.y || 0) * radius) + radius;

    const handleMouseDown = (e) => {
      e.preventDefault();
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      calculateWheelCoord(wheelKey, e.clientX, e.clientY, rect);

      const onMouseMove = (ev) => calculateWheelCoord(wheelKey, ev.clientX, ev.clientY, rect);
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const handleTouchStart = (e) => {
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      calculateWheelCoord(wheelKey, touch.clientX, touch.clientY, rect);

      const onTouchMove = (ev) => {
        ev.preventDefault();
        calculateWheelCoord(wheelKey, ev.touches[0].clientX, ev.touches[0].clientY, rect);
      };
      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    };

    return (
      <div className="flex flex-col items-center bg-[#11131A] p-2 rounded-xl border border-zinc-800 space-y-1.5 select-none">
        {/* 헤더 & 개별 리셋 */}
        <div className="w-full flex items-center justify-between px-0.5">
          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">{label}</span>
          <button 
            onClick={() => resetWheel(wheelKey)}
            className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
            title={`${label} 리셋`}
          >
            <IconReset />
          </button>
        </div>

        {/* 원형 색상환 (DaVinci Resolve Conic Gradient Wheel) */}
        <div
          ref={padRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={() => resetWheel(wheelKey)}
          className="w-17 h-17 rounded-full relative cursor-crosshair border border-zinc-700/80 shadow-inner overflow-hidden active:scale-98 transition-transform"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.08) 55%), conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
          }}
          title="더블클릭 시 틴트 중앙 리셋"
        >
          {/* 정밀 십자선 */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
            <div className="w-full h-px bg-white" />
            <div className="h-full w-px bg-white absolute" />
          </div>

          {/* 틴트 인디케이터 노즐 */}
          <div
            className="w-3 h-3 rounded-full border-2 border-white bg-black/90 shadow-[0_0_6px_rgba(0,0,0,0.9)] absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${posX}px`, top: `${posY}px` }}
          />
        </div>

        {/* 틴트 수치 */}
        <div className="text-[8.5px] font-mono text-zinc-400">
          X: {tintVal?.x > 0 ? `+${tintVal.x}` : tintVal?.x || 0} Y: {tintVal?.y > 0 ? `+${tintVal.y}` : tintVal?.y || 0}
        </div>

        {/* 마스터 휘도 다이얼 (Master Wheel Ring) */}
        <div className="w-full space-y-0.5 pt-1 border-t border-zinc-800">
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-zinc-500">MASTER</span>
            <span className="text-amber-400 font-bold">{currentVal}</span>
          </div>
          <input
            type="range" min={minVal} max={maxVal} value={currentVal}
            onChange={(e) => handleUpdate(wheelKey, Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#0D0E13] border-l border-zinc-800 text-zinc-300 font-sans select-none text-[12px]"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* 1. 최상단 인스펙터 마스터 헤더 */}
      <div className="px-3.5 py-2.5 bg-[#12141C] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <span className="font-mono font-semibold text-zinc-100 text-[11px] uppercase tracking-wider">
            DaVinci Color Studio : Primary Grading
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* A/B 바이패스 토글 */}
          <button
            type="button"
            onClick={() => setIsBypassed(!isBypassed)}
            className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
              isBypassed 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {isBypassed ? 'BYPASS ON' : 'GRADE ACTIVE'}
          </button>

          <button
            onClick={resetAllColor}
            className="text-[10.5px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 bg-zinc-800/80 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="모든 컬러 그레이딩 초기화"
          >
            <IconReset /> RESET
          </button>
        </div>
      </div>

      {/* 2. 10비트 실시간 RGB 파라레이드 비디오 스코프 */}
      {showScopes && (
        <div className="p-3 bg-[#0B0C10] border-b border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500">
            <span className="flex items-center gap-1 text-zinc-400 font-bold">
              <IconScope /> 10-BIT RGB PARADE SCOPES
            </span>
            <span>100 IRE (PEAK 1023)</span>
          </div>

          <div className="h-10 grid grid-cols-3 gap-1.5 bg-[#050608] rounded-md p-1 border border-zinc-800/80">
            {/* Red 채널 */}
            <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden relative">
              <div className="absolute top-1/4 w-full border-t border-red-500/20" />
              <div 
                className="w-full bg-gradient-to-t from-red-950 via-red-700 to-red-400 transition-all duration-100"
                style={{ height: `${scopeValues.r}%` }}
              />
            </div>
            {/* Green 채널 */}
            <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden relative">
              <div className="absolute top-1/4 w-full border-t border-emerald-500/20" />
              <div 
                className="w-full bg-gradient-to-t from-emerald-950 via-emerald-700 to-emerald-400 transition-all duration-100"
                style={{ height: `${scopeValues.g}%` }}
              />
            </div>
            {/* Blue 채널 */}
            <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden relative">
              <div className="absolute top-1/4 w-full border-t border-sky-500/20" />
              <div 
                className="w-full bg-gradient-to-t from-sky-950 via-sky-700 to-sky-400 transition-all duration-100"
                style={{ height: `${scopeValues.b}%` }}
              />
            </div>
          </div>

          <div className="flex justify-around text-[8.5px] font-mono font-bold">
            <span className="text-red-400">RED ({Math.round(scopeValues.r * 10.23)})</span>
            <span className="text-emerald-400">GREEN ({Math.round(scopeValues.g * 10.23)})</span>
            <span className="text-sky-400">BLUE ({Math.round(scopeValues.b * 10.23)})</span>
          </div>
        </div>
      )}

      {/* 3. 워크플로우 탭 바 (Wheels / Bars / HSL / LUT) */}
      <div className="flex border-b border-zinc-800 bg-[#101217] px-2 pt-1 gap-1">
        {[
          { id: 'wheels', label: '4-Way 컬러 휠', icon: <IconWheelMode /> },
          { id: 'bars', label: '프라이머리 바', icon: <IconBarsMode /> },
          { id: 'hsl', label: 'HSL 퀄리파이어', icon: <IconHslMode /> },
          { id: 'lut', label: '필름 프린트 LUT', icon: <IconScope /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap cursor-pointer ${
              activeMode === tab.id
                ? 'border-amber-500 text-amber-300 bg-zinc-800/40 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. 세부 컨트롤 패널 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* =====================================================================
            TAB 1: 4-WAY COLOR WHEELS (LIFT / GAMMA / GAIN / OFFSET)
            ===================================================================== */}
        {activeMode === 'wheels' && (
          <div className="space-y-4">
            {/* 4개 휠 2x2 매트릭스 레이아웃 */}
            <div className="grid grid-cols-2 gap-2">
              <ColorWheelModule label="LIFT (SHADOWS)" wheelKey="lift" minVal={-100} maxVal={100} currentVal={color.lift} tintVal={color.liftTint} />
              <ColorWheelModule label="GAMMA (MIDTONES)" wheelKey="gamma" minVal={50} maxVal={150} currentVal={color.gamma} tintVal={color.gammaTint} />
              <ColorWheelModule label="GAIN (HIGHLIGHTS)" wheelKey="gain" minVal={50} maxVal={150} currentVal={color.gain} tintVal={color.gainTint} />
              <ColorWheelModule label="OFFSET (MASTER)" wheelKey="offset" minVal={50} maxVal={150} currentVal={color.offset} tintVal={color.offsetTint} />
            </div>

            {/* 마스터 하단 퀵 슬라이더 바 (대비 / 채도 / 색온도) */}
            <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
                Quick Primary Controls
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>CONTRAST</span>
                    <span className="text-zinc-200 font-bold">{color.contrast.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range" min="0.5" max="2.0" step="0.02" value={color.contrast}
                    onChange={(e) => handleUpdate('contrast', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>SATURATION</span>
                    <span className="text-zinc-200 font-bold">{color.saturation}%</span>
                  </div>
                  <input
                    type="range" min="0" max="200" value={color.saturation}
                    onChange={(e) => handleUpdate('saturation', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: PRIMARY BARS & CALIBRATION (다빈치 프라이머리 슬라이더)
            ===================================================================== */}
        {activeMode === 'bars' && (
          <div className="space-y-4">
            
            {/* 색온도 Kelvin & 틴트 */}
            <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-3">
              <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase block border-b border-zinc-800 pb-1.5">
                White Balance Calibration
              </span>

              {/* 켈빈 색온도 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">COLOR TEMPERATURE</span>
                  <span className={`font-bold ${color.temperature > 6500 ? 'text-amber-400' : color.temperature < 6500 ? 'text-sky-400' : 'text-zinc-200'}`}>
                    {color.temperature}K
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-0 h-1.5 rounded bg-gradient-to-r from-sky-500 via-white to-amber-500 opacity-30 pointer-events-none" />
                  <input
                    type="range" min="2500" max="10000" step="50" value={color.temperature}
                    onChange={(e) => handleUpdate('temperature', Number(e.target.value))}
                    className="w-full h-1.5 bg-transparent accent-amber-400 rounded cursor-pointer relative z-10"
                  />
                </div>
              </div>

              {/* 틴트 (그린 / 마젠타) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">TINT (GREEN / MAGENTA)</span>
                  <span className={`font-bold ${color.tint > 0 ? 'text-fuchsia-400' : color.tint < 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {color.tint > 0 ? `+${color.tint}` : color.tint}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-0 h-1.5 rounded bg-gradient-to-r from-emerald-500 via-white to-fuchsia-500 opacity-30 pointer-events-none" />
                  <input
                    type="range" min="-100" max="100" value={color.tint}
                    onChange={(e) => handleUpdate('tint', Number(e.target.value))}
                    className="w-full h-1.5 bg-transparent accent-fuchsia-400 rounded cursor-pointer relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* 노출, 콘트라스트, 피벗 */}
            <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-3">
              <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase block border-b border-zinc-800 pb-1.5">
                Tone Mapping & Pivot
              </span>

              {/* 노출 EV */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">EXPOSURE (노출 오프셋)</span>
                  <span className="text-zinc-100 font-bold">{color.exposure > 0 ? `+${color.exposure.toFixed(2)}` : color.exposure.toFixed(2)} EV</span>
                </div>
                <input
                  type="range" min="-3.0" max="3.0" step="0.05" value={color.exposure}
                  onChange={(e) => handleUpdate('exposure', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* 피벗 (Contrast Pivot) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">CONTRAST PIVOT</span>
                  <span className="text-zinc-200 font-bold">{color.pivot.toFixed(3)}</span>
                </div>
                <input
                  type="range" min="0.0" max="1.0" step="0.005" value={color.pivot}
                  onChange={(e) => handleUpdate('pivot', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 미드톤 디테일 & 컬러 부스트 */}
            <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-3">
              <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase block border-b border-zinc-800 pb-1.5">
                Texture & Vibrance
              </span>

              {/* 미드톤 디테일 (헐리우드 피부결/질감 튜너) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">MIDTONE DETAIL (피부결 부드러움 / 텍스처)</span>
                  <span className={`font-bold ${color.midtoneDetail > 0 ? 'text-amber-400' : color.midtoneDetail < 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                    {color.midtoneDetail > 0 ? `+${color.midtoneDetail}` : color.midtoneDetail}
                  </span>
                </div>
                <input
                  type="range" min="-100" max="100" value={color.midtoneDetail}
                  onChange={(e) => handleUpdate('midtoneDetail', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* 컬러 부스트 (Vibrance) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">COLOR BOOST (비선형 채도 가속)</span>
                  <span className="text-zinc-200 font-bold">{color.colorBoost > 0 ? `+${color.colorBoost}` : color.colorBoost}</span>
                </div>
                <input
                  type="range" min="-100" max="100" value={color.colorBoost}
                  onChange={(e) => handleUpdate('colorBoost', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 3: 8-VECTOR HSL QUALIFIER CURVES
            ===================================================================== */}
        {activeMode === 'hsl' && (
          <div className="space-y-4">
            
            {/* 8대 색상 벡터 채널 셀렉터 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                Target Color Vector
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'skin', name: '스킨톤', color: '#FBBF24' },
                  { id: 'red', name: '레드', color: '#EF4444' },
                  { id: 'yellow', name: '옐로우', color: '#EAB308' },
                  { id: 'green', name: '그린', color: '#10B981' },
                  { id: 'cyan', name: '시안', color: '#06B6D4' },
                  { id: 'blue', name: '블루', color: '#3B82F6' },
                  { id: 'magenta', name: '마젠타', color: '#D946EF' }
                ].map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedHslChannel(channel.id)}
                    className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      selectedHslChannel === channel.id
                        ? 'bg-zinc-800 border-amber-500 text-white font-bold'
                        : 'bg-[#11131A] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                    <span>{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 벡터 정밀 HSL 튜닝 (Hue vs Hue / Sat / Lum) */}
            <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                <span className="font-mono text-[10.5px] text-amber-400 font-bold uppercase">
                  [{selectedHslChannel.toUpperCase()}] VECTOR CURVE OFFSET
                </span>
                <button
                  onClick={() => {
                    handleHslUpdate('hue', 0);
                    handleHslUpdate('sat', 0);
                    handleHslUpdate('lum', 0);
                  }}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  채널 리셋
                </button>
              </div>

              {/* Hue Shift (색상 변환) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">HUE SHIFT (색상 변환)</span>
                  <span className="text-zinc-200 font-bold">{color.hsl[selectedHslChannel]?.hue || 0}°</span>
                </div>
                <input
                  type="range" min="-180" max="180" step="2"
                  value={color.hsl[selectedHslChannel]?.hue || 0}
                  onChange={(e) => handleHslUpdate('hue', e.target.value)}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Saturation (채도) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">SATURATION (선명도)</span>
                  <span className="text-zinc-200 font-bold">{color.hsl[selectedHslChannel]?.sat > 0 ? `+${color.hsl[selectedHslChannel].sat}` : color.hsl[selectedHslChannel]?.sat || 0}%</span>
                </div>
                <input
                  type="range" min="-100" max="100" step="2"
                  value={color.hsl[selectedHslChannel]?.sat || 0}
                  onChange={(e) => handleHslUpdate('sat', e.target.value)}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Luminance (명도) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">LUMINANCE (휘도)</span>
                  <span className="text-zinc-200 font-bold">{color.hsl[selectedHslChannel]?.lum > 0 ? `+${color.hsl[selectedHslChannel].lum}` : color.hsl[selectedHslChannel]?.lum || 0}%</span>
                </div>
                <input
                  type="range" min="-100" max="100" step="2"
                  value={color.hsl[selectedHslChannel]?.lum || 0}
                  onChange={(e) => handleHslUpdate('lum', e.target.value)}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 4: FILM PRINT LUTS (영화관 표준 3D 룩업 테이블)
            ===================================================================== */}
        {activeMode === 'lut' && (
          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                PRINT FILM EMULATION (PFE LUTS)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRINT_LUTS.map((p) => {
                  const isSelected = (color.lut || 'none') === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleUpdate('lut', p.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : 'bg-[#11131A] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-[11.5px] text-zinc-100 block">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 block">{p.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="font-mono text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">ACTIVE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LUT Mix 강도 */}
            {color.lut && color.lut !== 'none' && (
              <div className="bg-[#11131A] p-3 rounded-xl border border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">PRINT LUT INTENSITY (믹스 강도)</span>
                  <span className="text-amber-400 font-bold">{color.lutMix || 100}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={color.lutMix || 100}
                  onChange={(e) => handleUpdate('lutMix', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
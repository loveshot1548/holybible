// src/components/inspector/ColorWheels.js
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// ==========================================
// 🎨 정밀 엔터프라이즈 모노크롬 SVG 아이콘 세트
// ==========================================
const SvgReset = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const SvgColorWheel = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25a1.125 1.125 0 00-1.125-1.125h-4.072M10.5 8.197l9.804-9.804a2.828 2.828 0 114 4l-9.804 9.804" />
  </svg>
);

const SvgEye = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SvgHistogram = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

export default function ColorWheels({ clip }) {
  const { updateClip } = useNLEStore();

  // 원본 전후 비교 (Bypass) 상태
  const [isBypassed, setIsBypassed] = useState(false);
  
  // HSL 컬러 셀렉터 선택된 색상군 ('skin' | 'red' | 'green' | 'blue' | 'yellow')
  const [selectedHslColor, setSelectedHslColor] = useState('skin');

  if (!clip) return null;

  // 1. 색보정 파라미터 무결성 보장
  const color = {
    lift: 0, liftTint: { x: 0, y: 0 },
    gamma: 100, gammaTint: { x: 0, y: 0 },
    gain: 100, gainTint: { x: 0, y: 0 },
    saturation: 100,
    contrast: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 6500, // 2500K ~ 9500K (6500K 주광)
    tint: 0,           // -50 ~ +50 (그린 ~ 마젠타)
    hsl: {
      skin: { hue: 0, sat: 0, lum: 0 },
      red: { hue: 0, sat: 0, lum: 0 },
      green: { hue: 0, sat: 0, lum: 0 },
      blue: { hue: 0, sat: 0, lum: 0 },
      yellow: { hue: 0, sat: 0, lum: 0 }
    },
    ...(clip.color || {})
  };

  // 2. 파라미터 업데이트 핸들러
  const handleSlider = useCallback((key, value) => {
    updateClip(clip.id, {
      color: { ...color, [key]: Number(value) }
    });
  }, [clip.id, color, updateClip]);

  // HSL 개별 색상 조절기
  const handleHslSlider = (subProp, value) => {
    updateClip(clip.id, {
      color: {
        ...color,
        hsl: {
          ...color.hsl,
          [selectedHslColor]: {
            ...color.hsl[selectedHslColor],
            [subProp]: Number(value)
          }
        }
      }
    });
  };

  // 3. 색상환 패드 터치/마우스 좌표 계산기 (반지름 1로 클램핑)
  const handleWheelPadCoord = useCallback((key, clientX, clientY, targetRect) => {
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

  // 4. 개별 휠 틴트 초기화
  const resetSingleWheel = (propKey) => {
    const defaultMaster = propKey === 'lift' ? 0 : 100;
    updateClip(clip.id, {
      color: {
        ...color,
        [propKey]: defaultMaster,
        [`${propKey}Tint`]: { x: 0, y: 0 }
      }
    });
  };

  // 5. 전역 마스터 초기화
  const resetAll = () => {
    updateClip(clip.id, {
      color: {
        lift: 0, liftTint: { x: 0, y: 0 },
        gamma: 100, gammaTint: { x: 0, y: 0 },
        gain: 100, gainTint: { x: 0, y: 0 },
        saturation: 100,
        contrast: 0,
        exposure: 0,
        highlights: 0,
        shadows: 0,
        temperature: 6500,
        tint: 0,
        hsl: {
          skin: { hue: 0, sat: 0, lum: 0 },
          red: { hue: 0, sat: 0, lum: 0 },
          green: { hue: 0, sat: 0, lum: 0 },
          blue: { hue: 0, sat: 0, lum: 0 },
          yellow: { hue: 0, sat: 0, lum: 0 }
        }
      },
      filterPreset: 'Standard'
    });
  };

  // 🌟 [RGB 파라레이드 시뮬레이터 실시간 계측치]
  const scopeHeights = useMemo(() => {
    const rBase = Math.min(100, Math.max(10, (color.gain / 150) * 80 + (color.temperature > 6500 ? (color.temperature - 6500) / 150 : 0)));
    const gBase = Math.min(100, Math.max(10, (color.gamma / 150) * 85 - (color.tint > 0 ? color.tint * 0.4 : 0)));
    const bBase = Math.min(100, Math.max(10, (color.lift + 100) * 0.4 + (color.temperature < 6500 ? (6500 - color.temperature) / 150 : 0)));
    return { r: rBase, g: gBase, b: bBase };
  }, [color.gain, color.gamma, color.lift, color.temperature, color.tint]);

  // =========================================================================
  // 색상환 개별 유닛 (다빈치 리졸브 3-Way 휠)
  // =========================================================================
  const ColorWheelUnit = ({ label, propKey, sliderMin, sliderMax, sliderVal, tintVal }) => {
    const padRef = useRef(null);

    // 원형 반지름 38px 기준 중앙 오프셋 계산
    const posX = ((tintVal?.x || 0) * 38) + 38;
    const posY = ((tintVal?.y || 0) * 38) + 38;

    // 마우스 드래그 핸들러
    const handleMouseDown = (e) => {
      e.preventDefault();
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      handleWheelPadCoord(propKey, e.clientX, e.clientY, rect);

      const onMouseMove = (ev) => handleWheelPadCoord(propKey, ev.clientX, ev.clientY, rect);
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    // 모바일 터치 드래그 핸들러
    const handleTouchStart = (e) => {
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      handleWheelPadCoord(propKey, touch.clientX, touch.clientY, rect);

      const onTouchMove = (ev) => {
        ev.preventDefault();
        const t = ev.touches[0];
        handleWheelPadCoord(propKey, t.clientX, t.clientY, rect);
      };
      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    };

    return (
      <div className="flex flex-col items-center bg-[#090A0E] p-2.5 rounded-xl border border-white/5 space-y-2 select-none">
        
        {/* 라벨 및 리셋 버튼 */}
        <div className="w-full flex items-center justify-between px-0.5">
          <span className="text-[10px] font-black text-white font-mono tracking-wider">{label}</span>
          <button 
            onClick={() => resetSingleWheel(propKey)}
            className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
            title={`${label} 휠 리셋`}
          >
            <SvgReset />
          </button>
        </div>
        
        {/* 🎨 다빈치 리졸브 원형 색상환 패드 (터치 & 마우스 하이브리드) */}
        <div 
          ref={padRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={() => resetSingleWheel(propKey)}
          className="w-19 h-19 rounded-full relative cursor-crosshair border border-white/20 shadow-inner overflow-hidden active:scale-98 transition-transform"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.05) 60%), conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
          }}
          title="더블클릭 시 틴트 중앙 리셋"
        >
          {/* 중앙 기준 십자선 */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
            <div className="w-full h-px bg-white" />
            <div className="h-full w-px bg-white absolute" />
          </div>

          {/* 실시간 틴트 조작 노즐 포인트 */}
          <div 
            className="w-3.5 h-3.5 rounded-full border-2 border-white bg-black/90 shadow-[0_0_8px_rgba(0,0,0,0.9)] absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
            style={{ left: `${posX}px`, top: `${posY}px` }}
          />
        </div>

        {/* 틴트 X/Y 수치 인디케이터 */}
        <div className="text-[9px] font-mono text-zinc-400 font-bold">
          X: {tintVal?.x > 0 ? `+${tintVal.x}` : tintVal?.x || 0} Y: {tintVal?.y > 0 ? `+${tintVal.y}` : tintVal?.y || 0}
        </div>

        {/* 마스터 밝기 슬라이더 */}
        <div className="w-full space-y-0.5 pt-0.5 border-t border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-zinc-400 font-bold">
            <span>MASTER</span>
            <span className="text-[#00E5FF]">{sliderVal}</span>
          </div>
          <input 
            type="range" min={sliderMin} max={sliderMax} value={sliderVal}
            onChange={(e) => handleSlider(propKey, e.target.value)}
            className="w-full h-1 bg-zinc-800 rounded accent-[#00E5FF] cursor-pointer"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-3.5 bg-[#12141C] border border-white/10 rounded-2xl space-y-3.5 select-none text-zinc-300 font-sans shadow-xl text-xs">
      
      {/* =========================================================================
          [1] 상단 헤더, A/B 전후 비교 바이패스, 전체 리셋
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-[#00E5FF]/10 text-[#00E5FF]"><SvgColorWheel /></span>
          <span className="font-mono font-black text-xs text-white tracking-wider">
            DAVINCI COLOR STUDIO PRO
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 전후 비교 A/B 바이패스 버튼 */}
          <button
            type="button"
            onClick={() => setIsBypassed(!isBypassed)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
              isBypassed 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="원본과 색보정 결과 비교 토글"
          >
            <SvgEye /> {isBypassed ? 'BYPASS' : 'GRADE'}
          </button>

          <button 
            onClick={resetAll}
            className="text-[10px] font-bold text-zinc-400 hover:text-white px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <SvgReset /> RESET
          </button>
        </div>
      </div>

      {/* =========================================================================
          [2] 🌟 RGB 파라레이드 & 히스토그램 실시간 비디오 스코프
          ========================================================================= */}
      <div className="bg-[#08090C] p-2.5 rounded-xl border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-300 font-bold">
            <SvgHistogram /> RGB PARADE SCOPES
          </span>
          <span>100 IRE (PEAK)</span>
        </div>

        <div className="h-10 grid grid-cols-3 gap-2 bg-black/60 rounded-lg p-1.5 border border-white/5">
          {/* R 채널 */}
          <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-red-900 to-red-500 transition-all duration-150"
              style={{ height: `${scopeHeights.r}%` }}
            />
          </div>

          {/* G 채널 */}
          <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-emerald-900 to-emerald-400 transition-all duration-150"
              style={{ height: `${scopeHeights.g}%` }}
            />
          </div>

          {/* B 채널 */}
          <div className="h-full flex items-end justify-center bg-zinc-950 rounded overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-blue-900 to-sky-400 transition-all duration-150"
              style={{ height: `${scopeHeights.b}%` }}
            />
          </div>
        </div>

        <div className="flex justify-around text-[8.5px] font-mono font-bold">
          <span className="text-red-400">RED</span>
          <span className="text-emerald-400">GREEN</span>
          <span className="text-sky-400">BLUE</span>
        </div>
      </div>

      {/* =========================================================================
          [3] 3-Way 색상환 3분할 랙 (LIFT, GAMMA, GAIN)
          ========================================================================= */}
      <div className="grid grid-cols-3 gap-2">
        <ColorWheelUnit label="LIFT (SHADOW)" propKey="lift" sliderMin={-100} sliderMax={100} sliderVal={color.lift} tintVal={color.liftTint} />
        <ColorWheelUnit label="GAMMA (MID)" propKey="gamma" sliderMin={50} sliderMax={150} sliderVal={color.gamma} tintVal={color.gammaTint} />
        <ColorWheelUnit label="GAIN (HILIGHT)" propKey="gain" sliderMin={50} sliderMax={150} sliderVal={color.gain} tintVal={color.gainTint} />
      </div>

      {/* =========================================================================
          [4] 화이트 밸런스 정밀 캘리브레이션 (색온도 Kelvin & 틴트)
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <span className="text-[10px] font-mono font-black text-zinc-400 tracking-wider block">
          WHITE BALANCE & TEMPERATURE
        </span>

        {/* 색온도 슬라이더 (2500K ~ 9500K) */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10.5px] font-bold">
            <span className="text-zinc-400">COLOR TEMP (색온도)</span>
            <span className={`font-mono ${color.temperature > 6500 ? 'text-amber-400' : color.temperature < 6500 ? 'text-sky-400' : 'text-white'}`}>
              {color.temperature}K
            </span>
          </div>
          <input 
            type="range" min="2500" max="9500" step="50"
            value={color.temperature}
            onChange={(e) => handleSlider('temperature', e.target.value)}
            className="w-full h-1.5 rounded cursor-pointer accent-amber-400"
            style={{
              background: 'linear-gradient(to right, #60A5FA 0%, #FFFFFF 50%, #F59E0B 100%)'
            }}
          />
        </div>

        {/* 틴트 슬라이더 (-50 ~ +50) */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10.5px] font-bold">
            <span className="text-zinc-400">TINT (틴트/색조)</span>
            <span className={`font-mono ${color.tint > 0 ? 'text-fuchsia-400' : color.tint < 0 ? 'text-emerald-400' : 'text-white'}`}>
              {color.tint > 0 ? `+${color.tint}` : color.tint}
            </span>
          </div>
          <input 
            type="range" min="-50" max="50" step="1"
            value={color.tint}
            onChange={(e) => handleSlider('tint', e.target.value)}
            className="w-full h-1.5 rounded cursor-pointer accent-fuchsia-400"
            style={{
              background: 'linear-gradient(to right, #10B981 0%, #FFFFFF 50%, #EC4899 100%)'
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          [5] 🌟 HSL 셀렉티브 컬러 튜너 (인물 피부톤 & 자연풍경 추출)
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-zinc-400 tracking-wider">
            HSL SELECTIVE COLOR TUNER
          </span>
          <span className="text-[9px] font-mono text-[#00E5FF] uppercase font-bold">
            {selectedHslColor}
          </span>
        </div>

        {/* 5대 색상군 탭 셀렉터 */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'skin', label: '인물 피부', color: 'bg-amber-400' },
            { id: 'red', label: '레드/립', color: 'bg-rose-500' },
            { id: 'yellow', label: '옐로우', color: 'bg-yellow-400' },
            { id: 'green', label: '그린/배경', color: 'bg-emerald-500' },
            { id: 'blue', label: '블루/하늘', color: 'bg-sky-500' }
          ].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedHslColor(c.id)}
              className={`flex-1 py-1 rounded-md text-[9.5px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                selectedHslColor === c.id 
                  ? 'bg-white/15 border-white text-white font-black' 
                  : 'bg-black/40 border-white/5 text-zinc-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
              {c.label}
            </button>
          ))}
        </div>

        {/* HSL 슬라이더 (색조/채도/휘도) */}
        <div className="space-y-1.5 pt-1">
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-zinc-400">HUE (색상 변환)</span>
              <span className="text-[#00E5FF] font-mono">{color.hsl[selectedHslColor]?.hue || 0}°</span>
            </div>
            <input 
              type="range" min="-180" max="180" step="5"
              value={color.hsl[selectedHslColor]?.hue || 0}
              onChange={e => handleHslSlider('hue', e.target.value)}
              className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-zinc-400">SATURATION (선명도)</span>
              <span className="text-[#00E5FF] font-mono">{color.hsl[selectedHslColor]?.sat || 0}%</span>
            </div>
            <input 
              type="range" min="-100" max="100" step="2"
              value={color.hsl[selectedHslColor]?.sat || 0}
              onChange={e => handleHslSlider('sat', e.target.value)}
              className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          [6] 다이내믹 레인지 & 콘트라스트 (채도, 대비, 하이라이트, 섀도우)
          ========================================================================= */}
      <div className="space-y-2.5 pt-1 border-t border-white/5">
        
        {/* 채도(Saturation) & 대비(Contrast) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 mb-0.5">
              <span>SATURATION (채도)</span>
              <span className="font-mono text-[#00E5FF]">{color.saturation}%</span>
            </div>
            <input 
              type="range" min="0" max="200" value={color.saturation}
              onChange={(e) => handleSlider('saturation', e.target.value)}
              className="w-full h-1 bg-zinc-800 rounded accent-[#00E5FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 mb-0.5">
              <span>CONTRAST (대비)</span>
              <span className="font-mono text-[#00E5FF]">{color.contrast > 0 ? `+${color.contrast}` : color.contrast}</span>
            </div>
            <input 
              type="range" min="-50" max="50" value={color.contrast}
              onChange={(e) => handleSlider('contrast', e.target.value)}
              className="w-full h-1 bg-zinc-800 rounded accent-[#00E5FF] cursor-pointer"
            />
          </div>
        </div>

        {/* 하이라이트(Highlights) & 섀도우(Shadows) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 mb-0.5">
              <span>HIGHLIGHTS</span>
              <span className="font-mono text-white">{color.highlights > 0 ? `+${color.highlights}` : color.highlights || 0}</span>
            </div>
            <input 
              type="range" min="-50" max="50" value={color.highlights || 0}
              onChange={(e) => handleSlider('highlights', e.target.value)}
              className="w-full h-1 bg-zinc-800 rounded accent-[#00E5FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 mb-0.5">
              <span>SHADOWS</span>
              <span className="font-mono text-white">{color.shadows > 0 ? `+${color.shadows}` : color.shadows || 0}</span>
            </div>
            <input 
              type="range" min="-50" max="50" value={color.shadows || 0}
              onChange={(e) => handleSlider('shadows', e.target.value)}
              className="w-full h-1 bg-zinc-800 rounded accent-[#00E5FF] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          [7] 시네마틱 LUT 퀵 셀렉터 (8종 확장 프리셋)
          ========================================================================= */}
      <div className="pt-2 border-t border-white/10 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-zinc-400 tracking-wider">
            CINEMATIC FILM LUT PROFILES
          </span>
          <span className="text-[10px] font-mono text-[#00E5FF] font-bold">{clip.filterPreset || 'Standard'}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'Standard', label: 'Rec.709' },
            { id: 'Teal & Orange', label: '틸&오렌지' },
            { id: 'Warm Moody', label: '웜 샌추어리' },
            { id: 'Vibrant Film', label: '코닥 200' },
            { id: 'Fuji Pastel', label: '후지 에테르나' },
            { id: 'Cinema Noir', label: '시네마 느와르' },
            { id: 'Golden Hour', label: '골든 아워' },
            { id: 'Bleach Bypass', label: '블리치 룩' }
          ].map((preset) => {
            const isSelected = (clip.filterPreset || 'Standard') === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  updateClip(clip.id, { filterPreset: preset.id });
                  // 룩에 맞춘 기본 틴트/온도 지능형 동기화
                  if (preset.id === 'Warm Moody' || preset.id === 'Golden Hour') {
                    handleSlider('temperature', 7200);
                  } else if (preset.id === 'Teal & Orange') {
                    handleSlider('temperature', 6200);
                    handleSlider('contrast', 15);
                  } else if (preset.id === 'Standard') {
                    handleSlider('temperature', 6500);
                    handleSlider('contrast', 0);
                  }
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all truncate cursor-pointer ${
                  isSelected 
                    ? 'bg-[#00E5FF] border-[#00E5FF] text-black font-black shadow-sm' 
                    : 'bg-[#090A0E] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
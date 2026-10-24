import React, { useState } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// =====================================================================
// 🎬 엔터프라이즈 모노크롬 SVG 아이콘 (DaVinci Resolve / CapCut Pro)
// =====================================================================
const IconColorWheel = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconFilm = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M12 10.875v7.5" />
  </svg>
);
const IconOptics = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconCamera = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);
const IconTransition = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
  </svg>
);
const IconReset = () => (
  <svg className="w-3 h-3 text-zinc-500 hover:text-zinc-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const IconCopyAll = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

// =====================================================================
// 🎞️ 헐리우드 3D 룩업 테이블(LUT) 및 필름 에뮬레이션 프리셋
// =====================================================================
const FILM_STOCKS = [
  { id: 'none', name: 'Rec.709 표준 (Unprocessed)', temp: 0, contrast: 1.0, swatch: 'from-zinc-700 to-zinc-500', desc: '자연스러운 원본 색역' },
  { id: 'kodak_vision3', name: 'Kodak Vision3 500T (5219)', temp: -8, contrast: 1.18, swatch: 'from-amber-700 to-yellow-500', desc: '헐리우드 블록버스터 영화 표준 텅스텐 룩' },
  { id: 'kodak_portra', name: 'Kodak Portra 400 (Warm Skin)', temp: 12, contrast: 1.08, swatch: 'from-orange-600 to-rose-400', desc: '풍부하고 부드러운 인물 피부톤과 골든 글로우' },
  { id: 'fuji_eterna', name: 'Fujifilm Eterna 250D', temp: -5, contrast: 0.95, swatch: 'from-teal-700 to-emerald-500', desc: '소프트한 파스텔 톤과 차분한 그린 섀도우' },
  { id: 'arri_alexa', name: 'ARRI Alexa 709 Commercial', temp: 0, contrast: 1.12, swatch: 'from-sky-700 to-indigo-500', desc: '정밀하고 세련된 상업 광고 표준 콘트라스트' },
  { id: 'bleach_bypass', name: 'Bleach Bypass (Silver Retention)', temp: -15, contrast: 1.45, swatch: 'from-stone-800 to-zinc-400', desc: '탈색 은염 잔류 기법의 강렬하고 거친 드라마 룩' },
  { id: 'cinema_noir', name: 'Cinema Noir Panatomic-X', temp: 0, contrast: 1.35, swatch: 'from-black to-zinc-200', desc: '깊은 흑색 계조의 헐리우드 클래식 흑백 필름' }
];

// =====================================================================
// ⚡ 브로드캐스트 A/B 트랜지션 프리셋
// =====================================================================
const PRO_TRANSITIONS = [
  { id: 'none', name: '하드 컷 (Hard Cut)', type: 'cut', desc: '지연 없는 직접 편집 컷' },
  { id: 'cross_dissolve', name: '크로스 디졸브 (Film Fade)', type: 'blend', desc: '두 클립의 부드러운 광학 중첩' },
  { id: 'whip_pan_left', name: '휩 팬 좌측 (Optical Whip Pan)', type: 'motion', desc: '초고속 카메라 패닝과 모션 블러' },
  { id: 'zoom_punch', name: '줌 블러 충격파 (Punch In)', type: 'motion', desc: '비트 타격 중심 시네마틱 줌' },
  { id: 'film_burn', name: '아날로그 필름 번 (Light Leak)', type: 'light', desc: '빈티지 영사기 빛샘 및 번 현상' },
  { id: 'rgb_glitch', name: 'RGB 슬라이스 글리치 (Digital Error)', type: 'digital', desc: '수평 비트 왜곡 및 채널 분리' },
  { id: 'anamorphic_flash', name: '아나모픽 화이트 플래시', type: 'light', desc: '강렬한 렌즈 플레어 화이트아웃' }
];

export default function EffectsInspector({ clip }) {
  const { updateClip, entities } = useNLEStore();
  const [activeTab, setActiveTab] = useState('grading'); // grading | filmic | optics | camera | transitions

  if (!clip) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-mono select-none">
        클립을 선택하면 전문 컬러 & VFX 인스펙터가 활성화됩니다.
      </div>
    );
  }

  // 1. 프라이머리 컬러 그레이딩 파라미터 (Lift/Gamma/Gain & White Balance)
  const color = {
    temperature: 0,       // -100 (Cool/Blue) ~ +100 (Warm/Amber)
    tint: 0,              // -100 (Green) ~ +100 (Magenta)
    exposure: 0,          // -3.0 EV ~ +3.0 EV (step 0.05)
    contrast: 1.0,        // 0.5 ~ 2.0 (step 0.02)
    pivot: 0.5,           // 0.0 ~ 1.0
    saturation: 100,      // 0 ~ 200%
    vibrance: 0,          // -100 ~ +100% (피부톤 보호 채도 부스트)
    shadows: 0,           // -100 ~ +100 (Lift 영역)
    highlights: 0,        // -100 ~ +100 (Gain 영역)
    ...(clip.colorGrade || {})
  };

  // 2. 필름 에뮬레이션 & 할레이션 (Filmic OFX)
  const filmic = {
    stock: 'none',
    lutMix: 100,          // 0 ~ 100%
    halationStrength: 0,  // 0 ~ 100% (헐리우드 붉은빛 유제 번짐)
    halationRadius: 12,   // 2 ~ 40px
    halationThreshold: 65,// 30 ~ 95%
    grainAmount: 0,       // 0 ~ 100%
    grainSize: 1.0,       // 0.5 (35mm) ~ 2.5 (Super 8)
    grainRoughness: 50,   // 0 ~ 100%
    ...(clip.filmic || {})
  };

  // 3. 광학 렌즈 아티팩트 (Optical & Anamorphic VFX)
  const optics = {
    distortion: 0,        // -50 (배럴 왜곡) ~ +50 (핀쿠션 왜곡)
    chromatic: 0,         // 0 ~ 25px (RGB 채널 분리)
    anamorphicStreak: 0,  // 0 ~ 100% (수평 블루 플레어 확산광)
    streakColor: '#38BDF8',// 블루/골드 선택
    vignetteAmount: 0,    // 0 ~ 100%
    vignetteFeather: 60,  // 10 ~ 100%
    vignetteRoundness: 0, // -50 ~ +50
    blurRadius: 0,        // 0 ~ 30px (가우시안 초점 이탈)
    ...(clip.optics || {})
  };

  // 4. 카메라 다이내믹스 (Shake & Motion Dynamics)
  const dynamics = {
    shakeType: 'none',    // 'none' | 'handheld' | 'chase' | 'heartbeat' | 'earthquake'
    shakeSpeed: 1.0,      // 0.2 ~ 3.0x
    shakeIntensity: 0,    // 0 ~ 100%
    motionBlur: false,    // 180° 로터리 셔터 블러
    shutterAngle: 180,    // 90° ~ 360°
    blendMode: 'normal',  // 16종 합성 모드
    opacity: 100,
    ...(clip.dynamics || {})
  };

  // 5. 트랜지션
  const transition = {
    id: clip.transition || 'none',
    duration: clip.transitionDuration ?? 0.45,
    alignment: clip.transitionAlign || 'center', // 'center' | 'start' | 'end'
    easing: clip.transitionEasing || 'cubic-bezier(0.16, 1, 0.3, 1)'
  };

  // 속성 업데이트 헬퍼
  const updateSection = (sectionName, key, value) => {
    updateClip(clip.id, {
      [sectionName]: {
        ...(clip[sectionName] || {}),
        [key]: value
      }
    });
  };

  // 필름 스톡 원클릭 매칭
  const applyFilmStock = (stock) => {
    const nextFilmic = {
      ...filmic,
      stock: stock.id,
      lutMix: stock.id === 'none' ? 0 : 100,
      halationStrength: stock.id.includes('kodak') ? 45 : stock.id === 'bleach_bypass' ? 20 : 0,
      grainAmount: stock.id === 'none' ? 0 : stock.id === 'cinema_noir' ? 40 : 25
    };
    updateClip(clip.id, {
      filmic: nextFilmic,
      colorGrade: {
        ...color,
        temperature: stock.temp,
        contrast: stock.contrast
      }
    });
  };

  // 타임라인 내 모든 비디오 클립에 현재 그레이딩/FX 일괄 복사 (Batch Grade)
  const handleBatchApplyAll = () => {
    const clipsMap = entities?.clips || {};
    const visualClips = Object.values(clipsMap).filter(c => c.type === 'video' || c.type === 'image');
    if (visualClips.length <= 1) {
      return alert('일괄 적용할 다른 비디오/사진 클립이 없습니다.');
    }
    if (!window.confirm(`현재 클립의 컬러 그레이딩 및 필름 FX 설정을 타임라인 전체(${visualClips.length}개)에 복사하시겠습니까?`)) {
      return;
    }
    visualClips.forEach(c => {
      updateClip(c.id, {
        colorGrade: { ...color },
        filmic: { ...filmic },
        optics: { ...optics }
      });
    });
    alert(`✨ ${visualClips.length}개 클립에 다빈치 시네마틱 룩이 일괄 적용되었습니다.`);
  };

  // 리셋 헬퍼
  const resetSection = (sectionName, defaultValues) => {
    updateClip(clip.id, { [sectionName]: defaultValues });
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
            Cinema FX Studio : Grade & Optics
          </span>
        </div>
        <button
          onClick={handleBatchApplyAll}
          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          title="현재 컬러 및 룩을 전체 클립에 일괄 적용"
        >
          <IconCopyAll /> 일괄 적용
        </button>
      </div>

      {/* 2. 전문 워크플로우 5대 탭 바 */}
      <div className="flex border-b border-zinc-800 bg-[#101217] px-2 pt-1 gap-1">
        {[
          { id: 'grading', label: '컬러 그레이딩', icon: <IconColorWheel /> },
          { id: 'filmic', label: '필름 룩 & 할레이션', icon: <IconFilm /> },
          { id: 'optics', label: '렌즈 왜곡 & 광학', icon: <IconOptics /> },
          { id: 'camera', label: '카메라 셰이크', icon: <IconCamera /> },
          { id: 'transitions', label: '트랜지션', icon: <IconTransition /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-300 bg-zinc-800/40 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. 인스펙터 바디 패널 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* =====================================================================
            TAB 1: PRIMARY COLOR GRADING (다빈치 리졸브 프라이머리 휠/다이얼)
            ===================================================================== */}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            
            {/* 화이트 밸런스 (화씨 온도 & 틴트) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase">
                  White Balance & Exposure
                </span>
                <button 
                  onClick={() => resetSection('colorGrade', { temperature: 0, tint: 0, exposure: 0, contrast: 1.0, saturation: 100, vibrance: 0, shadows: 0, highlights: 0 })}
                  className="text-zinc-500 hover:text-zinc-200 p-0.5"
                  title="컬러 그레이딩 리셋"
                >
                  <IconReset />
                </button>
              </div>

              {/* 색온도 Slider (Cool - Warm) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">COLOR TEMP (쿨 / 웜)</span>
                  <span className={color.temperature > 0 ? 'text-amber-400 font-bold' : color.temperature < 0 ? 'text-sky-400 font-bold' : 'text-zinc-300'}>
                    {color.temperature > 0 ? `+${color.temperature}` : color.temperature}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-0 h-1 rounded bg-gradient-to-r from-sky-600 via-zinc-700 to-amber-600 pointer-events-none opacity-40" />
                  <input
                    type="range" min="-100" max="100" value={color.temperature}
                    onChange={(e) => updateSection('colorGrade', 'temperature', Number(e.target.value))}
                    className="w-full h-1 bg-transparent accent-amber-400 rounded cursor-pointer relative z-10"
                  />
                </div>
              </div>

              {/* 틴트 Slider (Green - Magenta) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">TINT (그린 / 마젠타)</span>
                  <span className={color.tint > 0 ? 'text-fuchsia-400 font-bold' : color.tint < 0 ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                    {color.tint > 0 ? `+${color.tint}` : color.tint}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-0 h-1 rounded bg-gradient-to-r from-emerald-600 via-zinc-700 to-fuchsia-600 pointer-events-none opacity-40" />
                  <input
                    type="range" min="-100" max="100" value={color.tint}
                    onChange={(e) => updateSection('colorGrade', 'tint', Number(e.target.value))}
                    className="w-full h-1 bg-transparent accent-fuchsia-400 rounded cursor-pointer relative z-10"
                  />
                </div>
              </div>

              {/* 노출 (EV 단위) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">EXPOSURE (노출 오프셋)</span>
                  <span className="text-zinc-100 font-bold">{color.exposure > 0 ? `+${color.exposure.toFixed(2)}` : color.exposure.toFixed(2)} EV</span>
                </div>
                <input
                  type="range" min="-3.0" max="3.0" step="0.05" value={color.exposure}
                  onChange={(e) => updateSection('colorGrade', 'exposure', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 톤 매핑 (콘트라스트, 섀도우, 하이라이트) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-3">
              <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase block border-b border-zinc-800/80 pb-1.5">
                Tone Mapping & Dynamic Range
              </span>

              {/* 콘트라스트 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">CONTRAST</span>
                  <span className="text-zinc-100 font-bold">{color.contrast.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.02" value={color.contrast}
                  onChange={(e) => updateSection('colorGrade', 'contrast', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* 섀도우 (Lift) & 하이라이트 (Gain) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>SHADOWS</span>
                    <span className="font-bold text-zinc-200">{color.shadows > 0 ? `+${color.shadows}` : color.shadows}</span>
                  </div>
                  <input
                    type="range" min="-100" max="100" value={color.shadows}
                    onChange={(e) => updateSection('colorGrade', 'shadows', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>HIGHLIGHTS</span>
                    <span className="font-bold text-zinc-200">{color.highlights > 0 ? `+${color.highlights}` : color.highlights}</span>
                  </div>
                  <input
                    type="range" min="-100" max="100" value={color.highlights}
                    onChange={(e) => updateSection('colorGrade', 'highlights', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 채도(Saturation) & 컬러 부스트(Vibrance) */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>SATURATION</span>
                    <span className="font-bold text-zinc-200">{color.saturation}%</span>
                  </div>
                  <input
                    type="range" min="0" max="200" value={color.saturation}
                    onChange={(e) => updateSection('colorGrade', 'saturation', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>COLOR BOOST</span>
                    <span className="font-bold text-zinc-200">{color.vibrance > 0 ? `+${color.vibrance}` : color.vibrance}</span>
                  </div>
                  <input
                    type="range" min="-100" max="100" value={color.vibrance}
                    onChange={(e) => updateSection('colorGrade', 'vibrance', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 2: FILMIC LOOK & HALATION (헐리우드 필름 스톡 & 할레이션 유제 번짐)
            ===================================================================== */}
        {activeTab === 'filmic' && (
          <div className="space-y-4">
            
            {/* 필름 스톡 셀렉터 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                HOLLYWOOD 3D FILM STOCKS (OFX EMULATION)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {FILM_STOCKS.map((stock) => {
                  const isSelected = filmic.stock === stock.id;
                  return (
                    <button
                      key={stock.id}
                      onClick={() => applyFilmStock(stock)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-200 shadow-sm'
                          : 'bg-[#14161F] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${stock.swatch} shrink-0 border border-white/20`} />
                        <div>
                          <span className="font-semibold text-[11.5px] text-zinc-100 block">{stock.name}</span>
                          <span className="text-[10px] text-zinc-500 block leading-tight">{stock.desc}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="font-mono text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">ACTIVE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 필름 믹스 강도 (LUT Mix) */}
            {filmic.stock !== 'none' && (
              <div className="bg-[#14161F] p-2.5 rounded-xl border border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="text-zinc-400">FILM STOCK MIX (강도)</span>
                  <span className="text-amber-400 font-bold">{filmic.lutMix}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={filmic.lutMix}
                  onChange={(e) => updateSection('filmic', 'lutMix', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            )}

            {/* 🌟 다빈치 리졸브 할레이션 엔진 (Halation Red Bleed) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div>
                  <span className="text-[11px] font-semibold text-rose-300 block">시네마틱 할레이션 (Halation Glow)</span>
                  <span className="text-[9.5px] text-zinc-500">필름 유제층 빛 반사로 고광도 경계에 붉은빛이 번지는 아날로그 광학 효과</span>
                </div>
                <span className="font-mono text-[10px] text-rose-400 font-bold">{filmic.halationStrength}%</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>HALATION INTENSITY (붉은 번짐 강도)</span>
                  <span className="text-rose-400">{filmic.halationStrength}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={filmic.halationStrength}
                  onChange={(e) => updateSection('filmic', 'halationStrength', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {filmic.halationStrength > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>GLOW RADIUS</span>
                      <span>{filmic.halationRadius}px</span>
                    </div>
                    <input
                      type="range" min="4" max="40" value={filmic.halationRadius}
                      onChange={(e) => updateSection('filmic', 'halationRadius', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>THRESHOLD</span>
                      <span>{filmic.halationThreshold}%</span>
                    </div>
                    <input
                      type="range" min="30" max="95" value={filmic.halationThreshold}
                      onChange={(e) => updateSection('filmic', 'halationThreshold', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 필름 그레인 시뮬레이터 (Film Grain ISO) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase">
                  Film Grain Emulation (ISO Noise)
                </span>
                <span className="font-mono text-[10px] text-zinc-300 font-bold">{filmic.grainAmount}%</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>GRAIN AMOUNT (입자 밀도)</span>
                  <span>{filmic.grainAmount}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={filmic.grainAmount}
                  onChange={(e) => updateSection('filmic', 'grainAmount', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {filmic.grainAmount > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>GRAIN SIZE</span>
                      <span>{filmic.grainSize.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2.5" step="0.1" value={filmic.grainSize}
                      onChange={(e) => updateSection('filmic', 'grainSize', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>ROUGHNESS</span>
                      <span>{filmic.grainRoughness}%</span>
                    </div>
                    <input
                      type="range" min="10" max="100" value={filmic.grainRoughness}
                      onChange={(e) => updateSection('filmic', 'grainRoughness', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 3: LENS DISTORTION & OPTICAL VFX (광학 왜곡 & 아나모픽 플레어)
            ===================================================================== */}
        {activeTab === 'optics' && (
          <div className="space-y-4">
            
            {/* 렌즈 배럴/핀쿠션 왜곡 (Lens Distortion) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-200 block">렌즈 곡률 왜곡 (Lens Distortion)</span>
                  <span className="text-[9.5px] text-zinc-500">배럴(볼록 어안) / 핀쿠션(오목 광학) 왜곡</span>
                </div>
                <span className="font-mono text-[10px] text-sky-400 font-bold">{optics.distortion}</span>
              </div>
              <input
                type="range" min="-50" max="50" value={optics.distortion}
                onChange={(e) => updateSection('optics', 'distortion', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* 방사형 RGB 색수차 (Radial Chromatic Aberration) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-200 block">RGB 색수차 (Chromatic Aberration)</span>
                  <span className="text-[9.5px] text-zinc-500">렌즈 가장자리에서 빛 파장이 분리되는 광학 분산</span>
                </div>
                <span className="font-mono text-[10px] text-rose-400 font-bold">{optics.chromatic}px</span>
              </div>
              <input
                type="range" min="0" max="25" value={optics.chromatic}
                onChange={(e) => updateSection('optics', 'chromatic', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-rose-500 rounded cursor-pointer"
              />
            </div>

            {/* 🌟 아나모픽 수평 스트릭 블룸 (Anamorphic Streak Flare) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div>
                  <span className="text-[11px] font-semibold text-cyan-300 block">아나모픽 플레어 스트릭 (Anamorphic Flare)</span>
                  <span className="text-[9.5px] text-zinc-500">하이라이트에서 양옆으로 뻗어나가는 시네마틱 수평 광선</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {['#38BDF8', '#F59E0B', '#FFFFFF'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSection('optics', 'streakColor', c)}
                      style={{ backgroundColor: c }}
                      className={`w-3.5 h-3.5 rounded-full border cursor-pointer ${optics.streakColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <input
                type="range" min="0" max="100" value={optics.anamorphicStreak}
                onChange={(e) => updateSection('optics', 'anamorphicStreak', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* 시네마틱 비네팅 (Vignette) */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="font-mono text-[10.5px] text-zinc-400 font-semibold uppercase">
                  Cinematic Vignette (주변부 감광)
                </span>
                <span className="font-mono text-[10px] text-zinc-200 font-bold">{optics.vignetteAmount}%</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>AMOUNT (암부 강도)</span>
                  <span>{optics.vignetteAmount}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={optics.vignetteAmount}
                  onChange={(e) => updateSection('optics', 'vignetteAmount', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {optics.vignetteAmount > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>FEATHER (부드러움)</span>
                      <span>{optics.vignetteFeather}%</span>
                    </div>
                    <input
                      type="range" min="10" max="100" value={optics.vignetteFeather}
                      onChange={(e) => updateSection('optics', 'vignetteFeather', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>ROUNDNESS</span>
                      <span>{optics.vignetteRoundness}</span>
                    </div>
                    <input
                      type="range" min="-50" max="50" value={optics.vignetteRoundness}
                      onChange={(e) => updateSection('optics', 'vignetteRoundness', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 4: CAMERA SHAKE & MOTION DYNAMICS (카메라 셰이크 & 셔터 블러)
            ===================================================================== */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            
            {/* 카메라 흔들림 모드 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                CAMERA SHAKE DYNAMICS (OFX)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', name: '삼각대 고정 (Static Tripod)' },
                  { id: 'handheld', name: '헐리우드 핸드헬드 (Handheld)' },
                  { id: 'chase', name: '격렬한 추격 (Action Chase)' },
                  { id: 'heartbeat', name: '심장박동 펄스 (Pulse)' },
                  { id: 'earthquake', name: '비트 충격 지진 (Impact)' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateSection('dynamics', 'shakeType', s.id)}
                    className={`py-2 px-2 text-left rounded border text-[11px] transition-colors cursor-pointer ${
                      dynamics.shakeType === s.id
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-semibold'
                        : 'bg-[#14161F] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 셰이크 속도 & 진폭 */}
            {dynamics.shakeType !== 'none' && (
              <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>SHAKE INTENSITY (진폭)</span>
                    <span className="text-amber-400 font-bold">{dynamics.shakeIntensity}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={dynamics.shakeIntensity}
                    onChange={(e) => updateSection('dynamics', 'shakeIntensity', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1 pt-1.5 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>MOTION SPEED (속도)</span>
                    <span className="text-zinc-200">{dynamics.shakeSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range" min="0.2" max="3.0" step="0.1" value={dynamics.shakeSpeed}
                    onChange={(e) => updateSection('dynamics', 'shakeSpeed', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-zinc-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 180° 로터리 셔터 모션 블러 */}
            <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-200 block">180° 광학 셔터 모션 블러</span>
                  <span className="text-[9.5px] text-zinc-500">빠른 카메라 무빙 시 헐리우드 필름 카메라의 잔상 모션 블러 연산</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!dynamics.motionBlur}
                  onChange={(e) => updateSection('dynamics', 'motionBlur', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {dynamics.motionBlur && (
                <div className="pt-1.5 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>SHUTTER ANGLE</span>
                    <span className="text-amber-400 font-bold">{dynamics.shutterAngle}°</span>
                  </div>
                  <input
                    type="range" min="90" max="360" step="45" value={dynamics.shutterAngle}
                    onChange={(e) => updateSection('dynamics', 'shutterAngle', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 비디오 그래픽 블렌드 모드 */}
            <div className="bg-[#14161F] p-2.5 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Compositing Blend Mode</span>
              <select
                value={dynamics.blendMode || 'normal'}
                onChange={(e) => updateSection('dynamics', 'blendMode', e.target.value)}
                className="w-full bg-[#0D0E13] border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-100 text-[11px] font-medium outline-none cursor-pointer focus:border-amber-500"
              >
                <option value="normal">Normal (표준 100%)</option>
                <option value="screen">Screen (빛/글로우 투과)</option>
                <option value="overlay">Overlay (드라마틱 대비 강화)</option>
                <option value="multiply">Multiply (깊은 음영 합성)</option>
                <option value="color-dodge">Color Dodge (하이라이트 펀치)</option>
                <option value="soft-light">Soft Light (은은한 확산광)</option>
              </select>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 5: BROADCAST A/B TRANSITIONS (컷 트랜지션)
            ===================================================================== */}
        {activeTab === 'transitions' && (
          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                A/B CUT TRANSITION PRESETS
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRO_TRANSITIONS.map((t) => {
                  const isSelected = transition.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => updateClip(clip.id, { transition: t.id })}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-200 shadow-sm'
                          : 'bg-[#14161F] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-[11.5px] text-zinc-100 block">{t.name}</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight">{t.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="font-mono text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">SELECTED</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {transition.id !== 'none' && (
              <div className="bg-[#14161F] p-3 rounded-xl border border-zinc-800 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px] font-mono">
                    <span className="text-zinc-400">TRANSITION DURATION</span>
                    <span className="text-amber-400 font-bold">{transition.duration.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range" min="0.1" max="2.0" step="0.05" value={transition.duration}
                    onChange={(e) => updateClip(clip.id, { transitionDuration: Number(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1 pt-1.5 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-400 block uppercase">CUT ALIGNMENT</span>
                  <div className="grid grid-cols-3 gap-1 bg-[#0D0E13] p-1 border border-zinc-800 rounded">
                    {[
                      { id: 'center', label: '컷 중심 (Center)' },
                      { id: 'start', label: '컷 시작 (Start)' },
                      { id: 'end', label: '컷 끝 (End)' }
                    ].map((align) => (
                      <button
                        key={align.id}
                        onClick={() => updateClip(clip.id, { transitionAlign: align.id })}
                        className={`py-1 text-[10.5px] rounded transition-colors ${
                          transition.alignment === align.id
                            ? 'bg-zinc-700 text-white font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
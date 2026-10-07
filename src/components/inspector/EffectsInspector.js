// src/components/inspector/EffectsInspector.js
import React, { useState } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgTransition = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
  </svg>
);
const SvgMotion = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const SvgLut = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25a1.125 1.125 0 00-1.125-1.125h-4.072M10.5 8.197l9.804-9.804a2.828 2.828 0 114 4l-9.804 9.804" />
  </svg>
);
const SvgFx = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
const SvgReset = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const SvgSparkles = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

// 1. 프로급 트랜지션 프리셋 풀 (10종 완비)
const TRANSITIONS = [
  { id: 'none', label: '하드 컷 (Hard Cut)', desc: '즉각 컷 전환' },
  { id: 'dissolveCross', label: '크로스 디졸브', desc: '부드러운 페이드' },
  { id: 'dipBlack', label: '디졸브 투 블랙', desc: '암전 후 전환' },
  { id: 'flashWhite', label: '화이트 플래시', desc: '빛 폭발 임팩트' },
  { id: 'whipLeft', label: '휩 팬 좌측 이동', desc: '고속 카메라 무빙' },
  { id: 'zoomBlur', label: '줌 블러 충격파', desc: '비트 충격 줌' },
  { id: 'flip3D', label: '3D 큐브 뒤집기', desc: '공간 입체 회전' },
  { id: 'glitch', label: 'RGB 글리치 왜곡', desc: '디지털 신호 에러' },
  { id: 'filmBurn', label: '빈티지 필름 번', desc: '아날로그 빛샘' },
  { id: 'splitDoor', label: '문열림 스플릿 도어', desc: '양방향 개폐' }
];

// 2. 시네마틱 필름 LUT 프리셋 풀 (8종 + 듀오톤 비주얼 스와치 칩)
const FILTERS = [
  { id: 'none', label: '표준 원본 (Rec.709)', swatch: 'from-zinc-600 to-zinc-400' },
  { id: 'warmGrace', label: '따뜻한 은혜 (Warm Sanctuary)', swatch: 'from-amber-600 to-orange-400' },
  { id: 'tealAndOrange', label: '할리우드 틸 앤 오렌지', swatch: 'from-cyan-600 to-amber-500' },
  { id: 'kodakGold', label: '코닥 골드 200 (Vintage Film)', swatch: 'from-yellow-600 to-amber-600' },
  { id: 'fujiAstia', label: '후지 에테르나 (Soft Pastel)', swatch: 'from-rose-400 to-teal-500' },
  { id: 'cinematicNoir', label: '시네마틱 흑백 (Film Noir)', swatch: 'from-zinc-950 to-zinc-300' },
  { id: 'moodySunset', label: '골든 아워 앰버 선셋', swatch: 'from-purple-600 to-amber-500' },
  { id: 'bleachBypass', label: '블리치 바이패스 (거친 질감)', swatch: 'from-stone-700 to-zinc-300' }
];

// 3. 다이내믹 클립 모션 프리셋 풀 (인-모션 8종 + 상시 루프 2종)
const ANIMATION_PRESETS = [
  { id: 'none', label: '모션 없음 (Static)', type: 'in' },
  { id: 'popIn', label: '바운스 팝인 (Pop In)', type: 'in' },
  { id: 'slideUp', label: '하단 슬라이드 업', type: 'in' },
  { id: 'zoomIn', label: '슬로우 줌인 (Ken-Burns In)', type: 'in' },
  { id: 'zoomOut', label: '슬로우 줌아웃 (Ken-Burns Out)', type: 'in' },
  { id: 'shakeImpact', label: '비트 타격 셰이크 (Shake)', type: 'in' },
  { id: 'wobble', label: '핸드헬드 카메라 무빙', type: 'loop' },
  { id: 'strobe', label: '스트로브 비트 플래시', type: 'in' }
];

// 4. 그래픽 합성 블렌드 모드 풀 (8종)
const BLEND_MODES = [
  { id: 'normal', label: '표준 합성 (Normal)' },
  { id: 'screen', label: '스크린 (Screen - 빛/글로우 투과)' },
  { id: 'overlay', label: '오버레이 (Overlay - 극적 대비 강화)' },
  { id: 'multiply', label: '곱하기 (Multiply - 어두운 음영 합성)' },
  { id: 'color-dodge', label: '컬러 닷지 (Color Dodge - 하이라이트 펀치)' },
  { id: 'hard-light', label: '하드 라이트 (Hard Light - 강렬한 조명)' },
  { id: 'soft-light', label: '소프트 라이트 (Soft Light - 은은한 확산)' },
  { id: 'difference', label: '차이 (Difference - 네온 색상 반전)' }
];

export default function EffectsInspector({ clip }) {
  const { updateClip, entities } = useNLEStore();

  // 🌟 [역제안 1] 캡컷 스타일 퀵 서브 세그먼트 탭 ('all' | 'transition' | 'motion' | 'lut' | 'vfx' | 'blend')
  const [activeSubTab, setActiveSubTab] = useState('all');

  if (!clip) return null;

  // 비주얼 FX 기본 객체 무결성 확보 (신규 3종: glow, flicker, lensFlare 확장 탑재)
  const fx = {
    vignette: 0,        // 0 ~ 100%
    filmGrain: 0,       // 0 ~ 100%
    blur: 0,            // 0 ~ 30px
    chromatic: 0,       // 0 ~ 20px (RGB 색수차)
    glow: 0,            // 0 ~ 100% (시네마틱 네온 블룸)
    flicker: 0,         // 0 ~ 100% (영사기 조명 플리커)
    motionBlur: false,  // 셔터 모션 블러 토글
    ...(clip.fx || {})
  };

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  };

  // 단일 키 업데이트 핸들러
  const handleUpdate = (key, value) => {
    triggerHaptic(10);
    updateClip(clip.id, { [key]: value });
  };

  // FX 객체 업데이트 핸들러
  const handleFxUpdate = (fxKey, value) => {
    updateClip(clip.id, {
      fx: { ...fx, [fxKey]: value }
    });
  };

  // 🌟 [역제안 4] 현재 클립의 LUT 및 FX 설정을 타임라인 내 모든 미디어 클립에 일괄 적용
  const handleApplyToAllClips = () => {
    const clipsMap = entities?.clips || {};
    const visualClips = Object.values(clipsMap).filter(c => c.type === 'video' || c.type === 'image');
    
    if (visualClips.length <= 1) {
      return alert('일괄 적용할 다른 비디오/사진 클립이 없습니다.');
    }

    if (!window.confirm(`현재 클립의 필터/FX 효과를 타임라인 전체(${visualClips.length}개)에 복사하시겠습니까?`)) {
      return;
    }

    triggerHaptic(30);
    visualClips.forEach(c => {
      updateClip(c.id, {
        filterPreset: clip.filterPreset || 'none',
        filterIntensity: clip.filterIntensity ?? 100,
        fx: { ...fx }
      });
    });
    alert('✨ 모든 클립에 시네마틱 룩이 일괄 적용되었습니다.');
  };

  // 섹션별 리셋 핸들러
  const resetTransitions = () => {
    triggerHaptic(15);
    updateClip(clip.id, { transition: 'none', transitionDuration: 0.4 });
  };

  const resetFilters = () => {
    triggerHaptic(15);
    updateClip(clip.id, { filterPreset: 'none', filterIntensity: 100 });
  };

  const resetFx = () => {
    triggerHaptic(15);
    updateClip(clip.id, {
      fx: { vignette: 0, filmGrain: 0, blur: 0, chromatic: 0, glow: 0, flicker: 0, motionBlur: false }
    });
  };

  return (
    <div 
      className="p-3.5 bg-[#12141C] border border-white/10 rounded-2xl space-y-4 select-none text-zinc-300 font-sans shadow-xl text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* =========================================================================
          🌟 캡컷 프로 규격 서브 카테고리 퀵 세그먼트 네비게이터
          ========================================================================= */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1 border-b border-white/10">
        {[
          { id: 'all', label: '전체' },
          { id: 'transition', label: '트랜지션' },
          { id: 'motion', label: '모션' },
          { id: 'lut', label: '필름 LUT' },
          { id: 'vfx', label: '비주얼 FX' },
          { id: 'blend', label: '블렌드' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { triggerHaptic(10); setActiveSubTab(tab.id); }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[#00E5FF] text-black font-black shadow-sm'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          [1] 시네마틱 트랜지션 (Transitions)
          ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'transition') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-[#00E5FF]/10 text-[#00E5FF]"><SvgTransition /></span>
              <span className="font-mono font-black text-xs text-white tracking-wider">
                TRANSITIONS & DISSOLVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                {clip.transitionDuration ? `${clip.transitionDuration.toFixed(2)}s` : '0.40s'}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); resetTransitions(); }} 
                className="text-zinc-500 hover:text-white p-0.5 cursor-pointer active:scale-90" 
                title="트랜지션 리셋"
              >
                <SvgReset />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {TRANSITIONS.map((t) => {
              const isSelected = (clip.transition || 'none') === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleUpdate('transition', t.id)}
                  className={`p-2 rounded-xl text-left transition-all border cursor-pointer active:scale-98 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-sm font-black'
                      : 'bg-[#0A0B0E] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px] font-bold truncate block">{t.label}</span>
                  <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-black/70 font-bold' : 'text-zinc-500'}`}>
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {clip.transition && clip.transition !== 'none' && (
            <div className="p-3 bg-[#0A0B0E] rounded-xl border border-white/5 space-y-1 mt-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>TRANSITION DURATION</span>
                <span className="text-[#00E5FF]">{clip.transitionDuration || 0.4}s</span>
              </div>
              <input 
                type="range" min="0.1" max="1.5" step="0.05"
                value={clip.transitionDuration || 0.4}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleUpdate('transitionDuration', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          [2] 클립 모션 애니메이션 (Dynamic Clip Motion)
          ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'motion') && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-[#C59B51]/10 text-[#C59B51]"><SvgMotion /></span>
              <span className="font-mono font-black text-xs text-white tracking-wider">
                DYNAMIC CLIP MOTION
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">IN & LOOP MOTION</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ANIMATION_PRESETS.map((anim) => {
              const isSelected = (clip.animation || 'none') === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => handleUpdate('animation', anim.id)}
                  className={`p-2 rounded-xl text-left transition-all border cursor-pointer active:scale-98 flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#C59B51] text-black border-[#C59B51] shadow-sm font-black'
                      : 'bg-[#0A0B0E] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px] font-bold truncate">{anim.label}</span>
                  <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${
                    anim.type === 'loop' 
                      ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                      : 'bg-white/10 text-zinc-400'
                  }`}>
                    {anim.type === 'loop' ? 'LOOP' : 'IN'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          [3] 시네마틱 필름 LUT 필터 (Cinematic Film LUTs + 비주얼 스와치 칩)
          ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'lut') && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-purple-500/10 text-purple-400"><SvgLut /></span>
              <span className="font-mono font-black text-xs text-white tracking-wider">
                CINEMATIC FILM LUTS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                {clip.filterIntensity ?? 100}%
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); resetFilters(); }} 
                className="text-zinc-500 hover:text-white p-0.5 cursor-pointer active:scale-90" 
                title="필터 리셋"
              >
                <SvgReset />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {FILTERS.map((f) => {
              const isSelected = (clip.filterPreset || 'none') === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleUpdate('filterPreset', f.id)}
                  className={`p-2 rounded-xl text-left transition-all border cursor-pointer active:scale-98 flex items-center gap-2 truncate ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-sm font-black'
                      : 'bg-[#0A0B0E] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {/* 🌟 캡컷 규격 비주얼 듀오톤 컬러 스와치 칩 */}
                  <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${f.swatch} shrink-0 border border-white/20 shadow-xs`} />
                  <span className="text-[11px] font-bold truncate">{f.label}</span>
                </button>
              );
            })}
          </div>

          {clip.filterPreset && clip.filterPreset !== 'none' && (
            <div className="p-3 bg-[#0A0B0E] rounded-xl border border-white/5 space-y-1 mt-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>LUT BLEND INTENSITY</span>
                <span className="text-purple-300">{clip.filterIntensity ?? 100}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={clip.filterIntensity ?? 100}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleUpdate('filterIntensity', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-purple-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          [4] 🌟 프로 비주얼 FX 스위트 (Visual FX Suite: 비네팅, 그레인, 블러, 색수차, 글로우, 플리커)
          ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'vfx') && (
        <div className="pt-2 border-t border-white/10 space-y-2.5 bg-[#090A0E] p-3 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-rose-500/10 text-rose-400"><SvgFx /></span>
              <span className="font-mono font-black text-xs text-white tracking-wider">
                PRO VISUAL FX SUITE
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); resetFx(); }} 
              className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer active:scale-90"
            >
              <SvgReset /> FX 리셋
            </button>
          </div>

          {/* 비네팅 & 필름 그레인 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>VIGNETTE (암부)</span>
                <span className="text-rose-400 font-mono">{fx.vignette || 0}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={fx.vignette || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('vignette', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>FILM GRAIN (입자)</span>
                <span className="text-rose-400 font-mono">{fx.filmGrain || 0}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={fx.filmGrain || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('filmGrain', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 가우시안 블러 & RGB 색수차 */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>GAUSSIAN BLUR</span>
                <span className="text-rose-400 font-mono">{fx.blur || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="30" value={fx.blur || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('blur', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>CHROMATIC ABERRATION</span>
                <span className="text-rose-400 font-mono">{fx.chromatic || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="20" value={fx.chromatic || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('chromatic', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 🌟 [역제안 3] 시네마틱 네온 글로우(Glow) & 필름 영사기 플리커(Flicker) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>NEON GLOW (블룸)</span>
                <span className="text-amber-400 font-mono">{fx.glow || 0}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={fx.glow || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('glow', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-amber-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>FILM FLICKER (빛깜빡임)</span>
                <span className="text-amber-400 font-mono">{fx.flicker || 0}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={fx.flicker || 0}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleFxUpdate('flicker', Number(e.target.value))}
                style={{ touchAction: 'pan-x' }}
                className="w-full h-1 accent-amber-500 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 셔터 모션 블러 토글 */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
            <span className="text-[11px] font-bold text-zinc-300">자연스러운 셔터 모션 블러 (180° Shutter)</span>
            <input 
              type="checkbox"
              checked={!!fx.motionBlur}
              onChange={(e) => { e.stopPropagation(); handleFxUpdate('motionBlur', e.target.checked); }}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          [5] 그래픽 합성 블렌드 모드 (Blend Modes)
          ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'blend') && (
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-black text-xs text-zinc-300 tracking-wider">
              COMPOSITING BLEND MODES
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{clip.blendMode || 'normal'}</span>
          </div>

          <select 
            value={clip.blendMode || 'normal'}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleUpdate('blendMode', e.target.value)}
            className="w-full bg-[#0A0B0E] border border-white/10 rounded-xl p-2.5 text-white text-xs font-bold outline-none cursor-pointer focus:border-[#00E5FF] transition-colors"
          >
            {BLEND_MODES.map(bm => (
              <option key={bm.id} value={bm.id}>{bm.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* =========================================================================
          🌟 [역제안 4] 타임라인 전체 클립 일괄 적용 매크로 버튼 (Apply to All Clips)
          ========================================================================= */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={handleApplyToAllClips}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00E5FF] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
        >
          <SvgSparkles /> 현재 필터 & FX 설정을 모든 클립에 일괄 적용
        </button>
      </div>

    </div>
  );
}
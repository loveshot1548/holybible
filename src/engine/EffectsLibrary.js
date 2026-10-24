// src/engine/EffectsLibrary.js

// =====================================================================
// 🎬 1. 할리우드 & 캡컷 규격 프로 트랜지션 (수학적 실시간 렌더 연산 내장)
// =====================================================================
export const TRANSITIONS = {
  none: { 
    id: 'none', 
    name: '없음 (Hard Cut)', 
    duration: 0,
    compute: () => ({ transform: '', opacity: 1, filter: '', clipPath: '' })
  },
  // 인스펙터의 dissolveCross와 엔진의 crossDissolve 양방향 키 완벽 지원
  crossDissolve: {
    id: 'crossDissolve',
    name: '크로스 디졸브 (Fade)',
    duration: 0.45,
    compute: (p) => ({
      transform: '',
      opacity: 1 - p,
      filter: '',
      clipPath: ''
    })
  },
  dissolveCross: {
    id: 'dissolveCross',
    name: '크로스 디졸브 (Fade)',
    duration: 0.45,
    compute: (p) => ({
      transform: '',
      opacity: 1 - p,
      filter: '',
      clipPath: ''
    })
  },
  dipBlack: { 
    id: 'dipBlack', 
    name: '디졸브 투 블랙 (Dip Black)', 
    duration: 0.4,
    compute: (p) => ({
      transform: '',
      opacity: Math.max(0, 1 - p * 1.5),
      filter: `brightness(${Math.max(0, 1 - p)})`,
      clipPath: ''
    })
  },
  flashWhite: {
    id: 'flashWhite',
    name: '시네마틱 화이트 플래시',
    duration: 0.35,
    compute: (p) => ({
      transform: `scale(${1 + p * 0.08})`,
      opacity: 1,
      filter: `brightness(${1 + p * 3.5}) contrast(${1 + p * 0.5})`,
      clipPath: ''
    })
  },
  whipLeft: { 
    id: 'whipLeft', 
    name: '휩 팬 좌측 이동 (Whip Left)', 
    duration: 0.35,
    compute: (p) => ({
      transform: `translateX(-${p * 100}%) skewX(-${p * 14}deg) scale(${1 - p * 0.1})`,
      opacity: 1 - p * 0.4,
      filter: `blur(${p * 6}px)`,
      clipPath: ''
    })
  },
  wipeRight: {
    id: 'wipeRight',
    name: '스무스 와이프 우측 (Wipe Right)',
    duration: 0.4,
    compute: (p) => ({
      transform: `translateX(${p * 100}%) scale(${1 - p * 0.05})`,
      opacity: 1 - p * 0.3,
      filter: '',
      clipPath: ''
    })
  },
  zoomBlur: { 
    id: 'zoomBlur', 
    name: '줌 블러 충격파 (Zoom Shock)', 
    duration: 0.4,
    compute: (p) => ({
      transform: `scale(${1 + p * 1.6})`,
      opacity: Math.max(0, 1 - p * 1.2),
      filter: `blur(${p * 12}px) brightness(${1 + p * 0.8})`,
      clipPath: ''
    })
  },
  spinZoom: {
    id: 'spinZoom',
    name: '스핀 회전 줌 (Spin Zoom)',
    duration: 0.45,
    compute: (p) => ({
      transform: `scale(${1 + p * 1.2}) rotate(${p * 45}deg)`,
      opacity: 1 - p,
      filter: `blur(${p * 8}px)`,
      clipPath: ''
    })
  },
  flip3D: { 
    id: 'flip3D', 
    name: '3D 공간 뒤집기 (3D Flip)', 
    duration: 0.45,
    compute: (p) => ({
      transform: `perspective(800px) rotateY(${p * 90}deg) scale(${1 - p * 0.2})`,
      opacity: 1 - p * 0.7,
      filter: `brightness(${1 - p * 0.4})`,
      clipPath: ''
    })
  },
  glitch: { 
    id: 'glitch', 
    name: 'RGB 글리치 왜곡 (Digital Glitch)', 
    duration: 0.3,
    compute: (p) => {
      const offsetX = (Math.sin(p * 40) * 18 * p).toFixed(1);
      const skew = (Math.cos(p * 30) * 12 * p).toFixed(1);
      return {
        transform: `translate(${offsetX}px, ${-offsetX * 0.5}px) skewX(${skew}deg)`,
        opacity: 1,
        filter: `contrast(${1 + p * 1.5}) hue-rotate(${p * 180}deg) saturate(${1 + p * 2})`,
        clipPath: ''
      };
    }
  },
  filmBurn: { 
    id: 'filmBurn', 
    name: '빈티지 필름 번 (Film Burn)', 
    duration: 0.45,
    compute: (p) => ({
      transform: `scale(${1 + p * 0.15})`,
      opacity: 1,
      filter: `sepia(${p * 0.7}) brightness(${1 + p * 2.2}) saturate(${1 + p * 1.5}) contrast(${1 + p * 0.6})`,
      clipPath: ''
    })
  },
  // 🌟 [추가] 인스펙터의 문열림 스플릿 도어 수학적 CSS Clip-Path 렌더링 공식
  splitDoor: {
    id: 'splitDoor',
    name: '문열림 스플릿 도어 (Split Door)',
    duration: 0.45,
    compute: (p) => ({
      transform: `scale(${1 - p * 0.08})`,
      opacity: 1,
      filter: '',
      clipPath: `inset(0 ${p * 50}% 0 ${p * 50}%)`
    })
  }
};

// =====================================================================
// 🎨 2. Rec.709 & 다빈치 리졸브 21 규격 듀얼 컬러 사이언스 필터
// CSS Native 필터와 WebGL GPU 셰이더용 CDL 파라미터를 동시 제공
// =====================================================================
export const FILTERS = {
  none: { 
    id: 'none', 
    name: '원본 (Rec.709 Standard)', 
    filter: '',
    cdl: { lift: 0, gamma: 100, gain: 100, saturation: 100, temperature: 6500, tint: 0 }
  },
  tealAndOrange: { 
    id: 'tealAndOrange', 
    name: '할리우드 틸 앤 오렌지 (Blockbuster)', 
    filter: 'contrast(1.18) saturate(1.35) hue-rotate(-10deg) brightness(0.98)',
    cdl: { lift: -4, gamma: 112, gain: 108, saturation: 135, temperature: 5900, tint: 8 }
  },
  warmGrace: { 
    id: 'warmGrace', 
    name: '따뜻한 은혜 (Warm Sanctuary)', 
    filter: 'sepia(0.2) saturate(1.22) brightness(1.05) contrast(0.96)',
    cdl: { lift: 2, gamma: 106, gain: 96, saturation: 115, temperature: 7200, tint: 4 }
  },
  cinematicNoir: { 
    id: 'cinematicNoir', 
    name: '시네마틱 흑백 (Film Noir)', 
    filter: 'grayscale(100%) contrast(1.4) brightness(0.92)',
    cdl: { lift: -6, gamma: 120, gain: 90, saturation: 0, temperature: 6500, tint: 0 }
  },
  kodakGold: { 
    id: 'kodakGold', 
    name: '코닥 골드 200 (Kodak 200 Film)', 
    filter: 'sepia(0.25) contrast(1.12) saturate(1.28) brightness(1.02)',
    cdl: { lift: 3, gamma: 104, gain: 106, saturation: 125, temperature: 6900, tint: -2 }
  },
  // fujiVelvia와 fujiAstia 키 완벽 동시 지원
  fujiVelvia: { 
    id: 'fujiVelvia', 
    name: '후지 벨비아 (고채도 비비드)', 
    filter: 'saturate(1.65) contrast(1.22) brightness(0.96)',
    cdl: { lift: -2, gamma: 110, gain: 114, saturation: 160, temperature: 6300, tint: 5 }
  },
  fujiAstia: { 
    id: 'fujiAstia', 
    name: '후지 에테르나 (Soft Pastel)', 
    filter: 'saturate(1.2) contrast(1.05) brightness(1.02) sepia(0.1)',
    cdl: { lift: -1, gamma: 105, gain: 102, saturation: 120, temperature: 6400, tint: 2 }
  },
  bleachBypass: {
    id: 'bleachBypass',
    name: '블리치 바이패스 (거친 질감)',
    filter: 'contrast(1.45) saturate(0.65) brightness(1.05)',
    cdl: { lift: -5, gamma: 125, gain: 118, saturation: 65, temperature: 6200, tint: -4 }
  },
  // moodyMoody와 moodySunset 키 완벽 동시 지원
  moodyMoody: {
    id: 'moodyMoody',
    name: '무디 딥 그린 (Moody Forest)',
    filter: 'contrast(1.25) saturate(0.9) hue-rotate(15deg) brightness(0.92)',
    cdl: { lift: -6, gamma: 118, gain: 88, saturation: 90, temperature: 5600, tint: -10 }
  },
  moodySunset: {
    id: 'moodySunset',
    name: '골든 아워 앰버 선셋',
    filter: 'contrast(1.2) saturate(1.3) hue-rotate(-15deg) sepia(0.2)',
    cdl: { lift: -4, gamma: 115, gain: 95, saturation: 130, temperature: 5800, tint: -8 }
  },
  cyberpunkNeon: {
    id: 'cyberpunkNeon',
    name: '사이버펑크 네온 (Neon City)',
    filter: 'contrast(1.3) saturate(1.75) hue-rotate(-25deg) brightness(1.05)',
    cdl: { lift: -8, gamma: 130, gain: 125, saturation: 175, temperature: 8000, tint: 25 }
  }
};

// =====================================================================
// ✨ 3. 방송용 VFX 다이내믹 이펙트 정의서
// =====================================================================
export const VFX_EFFECTS = {
  vignette: {
    id: 'vignette',
    name: '비네팅 (Vignette)',
    getStyle: (intensity = 50) => ({
      background: `radial-gradient(circle, transparent ${Math.max(10, 100 - intensity)}%, rgba(0,0,0,${intensity / 100 * 0.95}) 100%)`
    })
  },
  filmGrain: {
    id: 'filmGrain',
    name: '35mm 필름 그레인',
    getStyle: (intensity = 30) => ({
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)',
      backgroundSize: '3px 3px',
      opacity: (intensity / 100) * 0.6,
      mixBlendMode: 'overlay'
    })
  },
  cameraShake: {
    id: 'cameraShake',
    name: '카메라 핸드헬드 셰이크',
    compute: (time, intensity = 1.0) => {
      const x = Math.sin(time * 12) * 4 * intensity;
      const y = Math.cos(time * 15) * 3 * intensity;
      const rot = Math.sin(time * 8) * 0.8 * intensity;
      return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
    }
  }
};

// =====================================================================
// 🎬 4. 클립 인-모션 애니메이션 연산 엔진 (EffectsInspector 8종 완비)
// =====================================================================
export const CLIP_ANIMATIONS = {
  none: { id: 'none', label: '모션 없음 (Static)', compute: () => '' },
  popIn: {
    id: 'popIn',
    label: '바운스 팝인 (Pop In)',
    compute: (timeFromStart, duration) => {
      const p = Math.min(1, Math.max(0, timeFromStart / Math.min(duration, 0.4)));
      if (p >= 1) return 'scale(1)';
      const s = Math.sin(p * Math.PI * 0.5) * 1.15;
      return `scale(${s.toFixed(3)})`;
    }
  },
  slideUp: {
    id: 'slideUp',
    label: '하단 슬라이드 업',
    compute: (timeFromStart, duration) => {
      const p = Math.min(1, Math.max(0, timeFromStart / Math.min(duration, 0.4)));
      if (p >= 1) return 'translateY(0)';
      const y = (1 - p) * 60;
      return `translateY(${y.toFixed(1)}px)`;
    }
  },
  zoomIn: {
    id: 'zoomIn',
    label: '슬로우 줌인 (Ken-Burns In)',
    compute: (timeFromStart, duration) => {
      const p = Math.min(1, Math.max(0, timeFromStart / (duration || 3.5)));
      return `scale(${(1 + p * 0.15).toFixed(3)})`;
    }
  },
  zoomOut: {
    id: 'zoomOut',
    label: '슬로우 줌아웃 (Ken-Burns Out)',
    compute: (timeFromStart, duration) => {
      const p = Math.min(1, Math.max(0, timeFromStart / (duration || 3.5)));
      return `scale(${(1.15 - p * 0.15).toFixed(3)})`;
    }
  },
  shakeImpact: {
    id: 'shakeImpact',
    label: '비트 타격 셰이크 (Shake)',
    compute: (timeFromStart) => {
      if (timeFromStart > 0.35) return '';
      const decay = 1 - timeFromStart / 0.35;
      const offset = Math.sin(timeFromStart * 60) * 10 * decay;
      return `translate(${offset.toFixed(1)}px, ${(-offset * 0.4).toFixed(1)}px)`;
    }
  },
  wobble: {
    id: 'wobble',
    label: '핸드헬드 카메라 무빙',
    compute: (timeFromStart) => {
      const x = Math.sin(timeFromStart * 3) * 4;
      const y = Math.cos(timeFromStart * 2.5) * 3;
      return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  },
  strobe: {
    id: 'strobe',
    label: '스트로브 비트 플래시',
    compute: (timeFromStart) => {
      if (timeFromStart > 0.45) return '';
      const flash = Math.sin(timeFromStart * 45) > 0;
      return flash ? 'brightness(2.2)' : '';
    }
  }
};

export const computeClipMotion = (animationType, timeFromStart, duration) => {
  const anim = CLIP_ANIMATIONS[animationType] || CLIP_ANIMATIONS.none;
  return anim.compute(timeFromStart, duration);
};

// =====================================================================
// 🔤 5. 릴스 / 쇼츠 타이포그래피 애니메이션 정의서
// =====================================================================
export const TEXT_ANIMATIONS = {
  none: {
    id: 'none',
    name: '정적 자막 (Static)',
    compute: () => ''
  },
  popIn: {
    id: 'popIn',
    name: '탄성 팝인 (Pop In)',
    compute: (progress) => {
      if (progress > 0.25) return 'scale(1)';
      const p = progress / 0.25;
      const s = Math.sin(p * Math.PI * 0.5) * 1.15;
      return `scale(${s.toFixed(3)})`;
    }
  },
  slideUp: {
    id: 'slideUp',
    name: '슬라이드 업 (Slide Up)',
    compute: (progress) => {
      if (progress > 0.2) return 'translateY(0)';
      const y = (1 - (progress / 0.2)) * 40;
      return `translateY(${y.toFixed(1)}px)`;
    }
  },
  cinematicTracking: {
    id: 'cinematicTracking',
    name: '시네마틱 트래킹 (자간 확장)',
    compute: (progress) => {
      return `scale(${1 + progress * 0.04})`;
    }
  }
};

// =====================================================================
// 🛠️ 6. 트랜지션 스타일 실시간 계산 헬퍼
// =====================================================================
export const getTransitionResult = (transitionId, progress) => {
  const trans = TRANSITIONS[transitionId] || TRANSITIONS.none;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return trans.compute(clampedProgress);
};
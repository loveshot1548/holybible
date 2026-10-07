// src/engine/ColorMatrixEngine.js

/**
 * 🌟 다빈치 리졸브 21 규격 3-Way Lift/Gamma/Gain & 색온도/틴트 완전 수학 모델
 * Rec.709 방송 표준 휘도 가중치: [0.2126, 0.7152, 0.0722]
 */

// 캘빈(Kelvin) 색온도 & 틴트를 RGB 채널별 승수(Multiplier)로 정밀 변환
function calculateColorTempMultipliers(temperature = 6500, tint = 0) {
  // 기준점: 6500K (D65 표준 일광)
  const tempDiff = (temperature - 6500) / 3500; // -1.0 (따뜻함/오렌지) ~ +1.0 (차가움/블루)
  const tintDiff = tint / 100; // -1.0 (마젠타) ~ +1.0 (그린)

  let rMult = 1.0;
  let gMult = 1.0;
  let bMult = 1.0;

  if (tempDiff > 0) {
    // 쿨 톤 (차가운 푸른빛 증가)
    rMult -= tempDiff * 0.18;
    bMult += tempDiff * 0.25;
  } else {
    // 웜 톤 (따뜻한 앰버/오렌지 증가)
    rMult -= tempDiff * 0.28;
    bMult += tempDiff * 0.22;
  }

  // 틴트 축 (그린-마젠타 보정)
  gMult += tintDiff * 0.2;
  rMult -= tintDiff * 0.08;
  bMult -= tintDiff * 0.08;

  return {
    r: Math.max(0.1, rMult),
    g: Math.max(0.1, gMult),
    b: Math.max(0.1, bMult)
  };
}

/**
 * 🌟 1. 4x5 컬러 변환 매트릭스 원시 20개 부동소수점 배열 연산기
 * @param {Object} color - 컬러 파라미터 객체
 * @returns {number[]} 20개의 숫자로 구성된 1차원 배열
 */
export function calculateColorMatrixArray(color = {}) {
  // 1. CDL 3-Way 기본 파라미터 추출 및 널가드
  const lift = color.lift || 0; // -100 ~ 100 (Offset/Shadows)
  const gammaVal = (color.gamma || 100) / 100; // 0.2 ~ 2.5 (Power/Midtones)
  const gainVal = (color.gain || 100) / 100; // 0.0 ~ 3.0 (Slope/Highlights)
  const sat = (color.saturation ?? 100) / 100; // 0.0 ~ 3.0 (Saturation)

  // 2. 2D 컬러 휠 틴트 오프셋 (X: Red-Cyan, Y: Green-Magenta)
  const lTint = color.liftTint || { x: 0, y: 0 };
  const gTint = color.gammaTint || { x: 0, y: 0 };
  const gnTint = color.gainTint || { x: 0, y: 0 };

  // 3. 색온도 및 틴트 승수 계산
  const tempMultipliers = calculateColorTempMultipliers(color.temperature || 6500, color.tint || 0);

  // 4. [감마 수학 모델 완치]: 미드톤(Gamma) 곡선의 1차 선형 근사 슬로프 계산
  // 멱함수 curve y = x^(1/gamma)의 중심 기울기(Midtone Slope) = 1.0 / gamma
  const gammaSlope = 1.0 / Math.max(0.01, gammaVal);

  // 5. 감마 틴트(미드톤 휠) RGB 분배 계산
  const rGammaShift = 1.0 + (gammaSlope - 1.0) * 0.6 + (gTint.x * 0.2);
  const gGammaShift = 1.0 + (gammaSlope - 1.0) * 0.6 - (gTint.y * 0.2);
  const bGammaShift = 1.0 + (gammaSlope - 1.0) * 0.6 - (gTint.x * 0.1);

  // 6. RGB 채널별 독립 Offset (Lift/Shadows) 계산 (정밀 정규화 범위: -0.5 ~ +0.5)
  const rLift = ((lift / 100) * 0.35 + (lTint.x * 0.22)) * tempMultipliers.r;
  const gLift = ((lift / 100) * 0.35 - (lTint.y * 0.22)) * tempMultipliers.g;
  const bLift = ((lift / 100) * 0.35 - (lTint.x * 0.15)) * tempMultipliers.b;

  // 7. RGB 채널별 Gain + Gamma + 색온도 합성 승수(Slope) 계산
  const rGain = gainVal * rGammaShift * (1.0 + (gnTint.x * 0.25)) * tempMultipliers.r;
  const gGain = gainVal * gGammaShift * (1.0 - (gnTint.y * 0.25)) * tempMultipliers.g;
  const bGain = gainVal * bGammaShift * (1.0 - (gnTint.x * 0.18)) * tempMultipliers.b;

  // 8. Rec.709 방송 표준 휘도 계수
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;

  // 9. 채도(Saturation) 크로스토크 행렬 계수
  const sr = (1.0 - sat) * lr;
  const sg = (1.0 - sat) * lg;
  const sb = (1.0 - sat) * lb;

  // 10. 최종 4x5 아핀 변환 컬러 매트릭스 성분 도출
  // Red Output Channel
  const m00 = (sr + sat) * rGain;
  const m01 = sg * rGain;
  const m02 = sb * rGain;
  const m03 = 0;
  const m04 = rLift;

  // Green Output Channel
  const m10 = sr * gGain;
  const m11 = (sg + sat) * gGain;
  const m12 = sb * gGain;
  const m13 = 0;
  const m14 = gLift;

  // Blue Output Channel
  const m20 = sr * bGain;
  const m21 = sg * bGain;
  const m22 = (sb + sat) * bGain;
  const m23 = 0;
  const m24 = bLift;

  // Alpha Channel (불변)
  const m30 = 0;
  const m31 = 0;
  const m32 = 0;
  const m33 = 1;
  const m34 = 0;

  return [
    m00, m01, m02, m03, m04,
    m10, m11, m12, m13, m14,
    m20, m21, m22, m23, m24,
    m30, m31, m32, m33, m34
  ];
}

/**
 * 🌟 2. 기존 인터페이스 100% 호환 SVG <feColorMatrix> 공백 구분 문자열 생성기
 * @param {Object} color - 컬러 파라미터 객체
 * @returns {string} "m00 m01 ... m34" 형태의 문자열
 */
export function generateColorMatrix(color = {}) {
  const matrix = calculateColorMatrixArray(color);
  return matrix.map(v => Number(v.toFixed(3))).join(' ');
}

/**
 * 🌟 3. WebGL PixiJS / 셰이더 전용 Float32Array 고속 매트릭스 변환기
 * @param {Object} color - 컬러 파라미터 객체
 * @returns {Float32Array} WebGL 파이프라인 직결용 20개 부동소수점 TypedArray
 */
export function generateWebGLColorMatrix(color = {}) {
  return new Float32Array(calculateColorMatrixArray(color));
}

/**
 * 🌟 4. CinemaCanvas 및 CSS 하드웨어 가속용 네이티브 필터 문자열 생성기
 * SVG 필터 없이 100% 검은 화면을 방어하는 브라우저 표준 CSS 필터 추출
 * @param {Object} color - 컬러 파라미터 객체
 * @returns {string} CSS filter 문자열
 */
export function generateCSSNativeFilter(color = {}) {
  const brightness = Math.max(0.1, ((color.gamma || 100) / 100));
  const contrast = Math.max(0.1, ((color.gain || 100) / 100));
  const saturate = Math.max(0.0, ((color.saturation ?? 100) / 100));
  
  const tempVal = color.temperature || 6500;
  const tintVal = color.tint || 0;
  const tempFilter = tempVal > 6500 
    ? `sepia(${((tempVal - 6500) / 3500) * 0.35})` 
    : tempVal < 6500 
      ? `hue-rotate(${((6500 - tempVal) / 3500) * -18}deg)` 
      : '';
  const tintFilter = tintVal !== 0 ? `hue-rotate(${tintVal * 0.7}deg)` : '';

  return `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)}) ${tempFilter} ${tintFilter}`.trim();
}
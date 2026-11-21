// src/engine/KeyframeEngine.js

export const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  spring: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * 특정 클립 내 로컬 시간(localTime)에서의 속성값 보간
 * @param {Array} keyframes - [{ time: 0, value: 100, easing: 'easeInOut' }, ...]
 * @param {number} localTime - 클립 시작점 기준 경과 시간(초)
 * @param {number} defaultValue - 키프레임이 없을 때 기본값
 */
export function interpolateProperty(keyframes, localTime, defaultValue) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return defaultValue;
  if (keyframes.length === 1) return keyframes[0].value;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (localTime <= sorted[0].time) return sorted[0].value;
  if (localTime >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    if (localTime >= k1.time && localTime <= k2.time) {
      const span = k2.time - k1.time;
      if (span <= 0.0001) return k2.value;
      const rawT = (localTime - k1.time) / span;
      const easeFn = EASING_FUNCTIONS[k2.easing || k1.easing || 'easeInOut'] || EASING_FUNCTIONS.linear;
      const easedT = easeFn(Math.max(0, Math.min(1, rawT)));
      return k1.value + (k2.value - k1.value) * easedT;
    }
  }
  return defaultValue;
}

/**
 * 클립의 현재 시점 Transform & Opacity 통합 평가
 */
export function evaluateClipTransform(clip, playhead) {
  const baseTf = clip?.transform || {};
  const localTime = Math.max(0, (playhead || 0) - (clip?.start || 0));
  const kf = clip?.keyframes || {};

  return {
    x: interpolateProperty(kf.x, localTime, baseTf.x ?? clip?.positionX ?? 0),
    y: interpolateProperty(kf.y, localTime, baseTf.y ?? clip?.positionY ?? 0),
    scale: interpolateProperty(kf.scale, localTime, baseTf.scale ?? clip?.scale ?? 100),
    rotate: interpolateProperty(kf.rotate, localTime, baseTf.rotate ?? clip?.rotation ?? 0),
    opacity: interpolateProperty(kf.opacity, localTime, clip?.opacity ?? baseTf.opacity ?? 100),
    flipH: Boolean(baseTf.flipH),
    flipV: Boolean(baseTf.flipV),
    blendMode: baseTf.blendMode || clip?.blendMode || 'normal'
  };
}
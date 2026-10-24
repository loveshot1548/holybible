// src/engine/KeyframeCurveEngine.js
import BezierEasing from 'bezier-easing';

export const CURVE_PRESETS = {
  LINEAR: [0, 0, 1, 1],
  EASE_IN_OUT: [0.42, 0, 0.58, 1],
  PREMIERE_EXPONENTIAL: [0.16, 1, 0.3, 1],
  DAVINCI_DYNAMIC: [0.25, 0.1, 0.25, 1],
  SPEED_RAMP_FAST_OUT: [0.7, 0, 0.84, 0],
  SPEED_RAMP_SLOW_IN: [0.16, 1, 0.3, 1]
};

export class KeyframeCurveEngine {
  constructor() {
    this.easingCache = new Map();
  }

  getEasing(curve = CURVE_PRESETS.EASE_IN_OUT) {
    const key = curve.join(',');
    if (!this.easingCache.has(key)) {
      this.easingCache.set(key, BezierEasing(...curve));
    }
    return this.easingCache.get(key);
  }

  interpolateKeyframe(keyframes, currentTime, defaultValue = 0, curve = CURVE_PRESETS.DAVINCI_DYNAMIC) {
    if (!keyframes || keyframes.length === 0) return defaultValue;
    if (keyframes.length === 1) return keyframes[0].value;

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    if (currentTime <= sorted[0].time) return sorted[0].value;
    if (currentTime >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

    let prev = sorted[0];
    let next = sorted[1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (currentTime >= sorted[i].time && currentTime <= sorted[i + 1].time) {
        prev = sorted[i];
        next = sorted[i + 1];
        break;
      }
    }

    const t = (currentTime - prev.time) / (next.time - prev.time);
    const easingFn = this.getEasing(prev.curve || curve);
    const progress = easingFn(Math.max(0, Math.min(1, t)));

    return prev.value + (next.value - prev.value) * progress;
  }

  calculateTimeRemap(speedPoints, localClipTime) {
    if (!speedPoints || speedPoints.length === 0) return localClipTime;

    let accumulatedSourceTime = 0;
    let prevWallTime = 0;

    for (let i = 0; i < speedPoints.length; i++) {
      const pt = speedPoints[i];
      if (localClipTime <= pt.wallTime) {
        const delta = localClipTime - prevWallTime;
        const currentSpeed = pt.speed;
        return accumulatedSourceTime + delta * currentSpeed;
      }
      accumulatedSourceTime += (pt.wallTime - prevWallTime) * pt.speed;
      prevWallTime = pt.wallTime;
    }

    const last = speedPoints[speedPoints.length - 1];
    return accumulatedSourceTime + (localClipTime - last.wallTime) * last.speed;
  }
}

export const keyframeEngine = new KeyframeCurveEngine();
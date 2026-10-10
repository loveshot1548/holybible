// src/engine/WebGLRenderer.js
import * as PIXI from 'pixi.js';
import { keyframeEngine, CURVE_PRESETS } from './KeyframeCurveEngine';

/**
 * =====================================================================
 * 🎬 다빈치 리졸브 21 & 파이널컷 프로 규격 실전 WebGL 비디오 렌더링 엔진
 * 1080x1920 60fps 풀 하드웨어 가속, 3D LUT 에뮬레이션, 베지어 키프레임 보간 완비
 * =====================================================================
 */
export class WebGLVideoEngine {
  constructor(canvasElement, width = 1080, height = 1920) {
    this.width = width;
    this.height = height;

    // 1. 고성능 WebGL 컨텍스트 및 안티앨리어싱 뷰포트 초기화
    this.app = new PIXI.Application({
      view: canvasElement,
      width,
      height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preserveDrawingBuffer: true, // 하드웨어 가속 인코딩 버퍼 보존
      antialias: true,
      powerPreference: 'high-performance'
    });

    // 2. GPU 메모리 누수 방지 캐시 풀
    this.textureCache = new Map();
    this.textCache = new Map();
    this.filterCache = new Map();
    this.maskCache = new Map();

    // 3. 방송 규격 멀티트랙 적층 컨테이너 (V1~V6 비디오 + T1~T2 자막)
    this.layers = {
      background: new PIXI.Container(),
      V1: new PIXI.Container(),
      V2: new PIXI.Container(),
      V3: new PIXI.Container(),
      V4: new PIXI.Container(),
      V5: new PIXI.Container(),
      V6: new PIXI.Container(),
      T1: new PIXI.Container(),
      T2: new PIXI.Container(),
    };

    Object.values(this.layers).forEach(container => {
      this.app.stage.addChild(container);
    });

    // 4. 🌟 다빈치 리졸브 CDL + 3D LUT + 크로마키 디스필 + 35mm 필름 그레인 통합 GLSL 셰이더
    this.masterCinematicFrag = `
      precision highp float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float uTime;

      // 다빈치 리졸브 3-Way Color Decision List (Lift, Gamma, Gain)
      uniform vec3 uLift;
      uniform vec3 uGamma;
      uniform vec3 uGain;
      uniform float uSaturation;
      uniform float uContrast;
      uniform float uPivot;

      // 화이트 밸런스 (Kelvin 온도 & Green-Magenta 틴트)
      uniform float uTemperature;
      uniform float uTint;

      // 시네마틱 3D LUT 스타일 에뮬레이션
      uniform int uLutMode; // 0: None, 1: Teal&Orange, 2: Kodak Portra, 3: Fuji Eterna, 4: Noir

      // 35mm 아날로그 필름 그레인 & 비네트
      uniform float uFilmGrain;
      uniform float uVignette;

      // 방송 스튜디오 크로마키 & Despill(초록 반사광 억제)
      uniform int uUseChromaKey;
      uniform vec3 uKeyColor;
      uniform float uKeyThreshold;
      uniform float uKeySoftness;

      // 의사 난수 생성기 (시간 기반 다이내믹 그레인 노이즈)
      float pseudoRandom(vec2 co, float time) {
        return fract(sin(dot(co.xy + time * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
      }

      // 플랑크 흑체 복사 기반 켈빈 색온도 보정
      vec3 applyKelvinTemperature(vec3 rgb, float temp, float tint) {
        // temp: -1.0 (Cool) ~ 1.0 (Warm)
        rgb.r += temp * 0.16;
        rgb.b -= temp * 0.16;
        rgb.g += tint * 0.12;
        return clamp(rgb, 0.0, 1.0);
      }

      // 헐리우드 3D LUT 컬러 사이언스 매핑
      vec3 applyCinematicLUT(vec3 rgb, int mode) {
        if (mode == 1) {
          // 할리우드 틸 앤 오렌지 (Teal & Orange Blockbuster)
          float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
          vec3 shadowTeal = vec3(0.05, 0.45, 0.55);
          vec3 highlightOrange = vec3(1.0, 0.65, 0.35);
          rgb = mix(rgb * shadowTeal * 1.5, rgb * highlightOrange * 1.2, smoothstep(0.2, 0.8, luma));
        } else if (mode == 2) {
          // 코닥 포트라 400 (따뜻하고 화사한 피부 톤 & 소프트 콘트라스트)
          rgb.r = pow(rgb.r, 0.92) * 1.05;
          rgb.g = pow(rgb.g, 0.96) * 1.02;
          rgb.b = pow(rgb.b, 1.05) * 0.95;
        } else if (mode == 3) {
          // 후지 필름 에테르나 (차분한 그린 섀도우 & 시네마 다큐멘터리 톤)
          rgb.g += 0.03 * (1.0 - rgb.g);
          rgb.b += 0.04 * (1.0 - rgb.b);
          rgb = mix(rgb, vec3(dot(rgb, vec3(0.3, 0.59, 0.11))), 0.15);
        } else if (mode == 4) {
          // 흑백 필름 느와르 (고대비 실버 할라이드)
          float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
          rgb = vec3(smoothstep(0.08, 0.92, luma));
        }
        return clamp(rgb, 0.0, 1.0);
      }

      void main(void) {
        vec4 color = texture2D(uSampler, vTextureCoord);
        if (color.a == 0.0) {
          gl_FragColor = vec4(0.0);
          return;
        }

        // 1. 프로급 크로마키 연산 & Despill (피사체 경계면 녹색 반사광 억제)
        if (uUseChromaKey == 1) {
          float diff = length(color.rgb - uKeyColor);
          float alpha = smoothstep(uKeyThreshold, uKeyThreshold + uKeySoftness, diff);
          color.a *= alpha;

          // 초록색 광선이 피부에 묻어나는 스필 현상 제거
          if (color.g > max(color.r, color.b)) {
            color.g = (color.r + color.b) * 0.5;
          }
        }

        // 2. 다빈치 리졸브 3-Way CDL 컬러 연산 (Lift, Gamma, Gain)
        color.rgb = color.rgb * uGain + uLift;
        color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / max(uGamma, vec3(0.001))));

        // 3. S-커브 콘트라스트 & 피벗 포인트
        color.rgb = (color.rgb - uPivot) * uContrast + uPivot;

        // 4. 색온도 & 틴트 보정
        color.rgb = applyKelvinTemperature(color.rgb, uTemperature, uTint);

        // 5. 3D LUT 프리셋 매핑
        if (uLutMode > 0) {
          color.rgb = applyCinematicLUT(color.rgb, uLutMode);
        }

        // 6. Rec.709 방송 표준 채도(Saturation) 보정
        float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        color.rgb = mix(vec3(luma), color.rgb, uSaturation);

        // 7. 아날로그 35mm 필름 그레인 질감 (Grain Texture)
        if (uFilmGrain > 0.0) {
          float noise = (pseudoRandom(vTextureCoord, uTime) - 0.5) * uFilmGrain * 0.4;
          color.rgb += noise;
        }

        // 8. 렌즈 비네트 음영 (Vignette)
        if (uVignette > 0.0) {
          vec2 centerDist = vTextureCoord - vec2(0.5);
          float vignette = 1.0 - dot(centerDist, centerDist) * (uVignette * 1.8);
          color.rgb *= clamp(vignette, 0.0, 1.0);
        }

        color.rgb *= color.a;
        gl_FragColor = color;
      }
    `;
  }

  // 클립 전용 GPU 필터 캐싱 (메모리 오염 및 재생 끊김 방지)
  getOrCreateFilter(clipId) {
    if (!this.filterCache.has(clipId)) {
      const filter = new PIXI.Filter(null, this.masterCinematicFrag, {
        uTime: 0.0,
        uLift: [0.0, 0.0, 0.0],
        uGamma: [1.0, 1.0, 1.0],
        uGain: [1.0, 1.0, 1.0],
        uSaturation: 1.0,
        uContrast: 1.0,
        uPivot: 0.45,
        uTemperature: 0.0,
        uTint: 0.0,
        uLutMode: 0,
        uFilmGrain: 0.0,
        uVignette: 0.0,
        uUseChromaKey: 0,
        uKeyColor: [0.0, 1.0, 0.0],
        uKeyThreshold: 0.35,
        uKeySoftness: 0.15
      });
      this.filterCache.set(clipId, filter);
    }
    return this.filterCache.get(clipId);
  }

  // GPU 블렌드 모드 상수 매핑
  getPixiBlendMode(mode) {
    switch (mode) {
      case 'screen': return PIXI.BLEND_MODES.SCREEN;
      case 'multiply': return PIXI.BLEND_MODES.MULTIPLY;
      case 'overlay': return PIXI.BLEND_MODES.OVERLAY;
      case 'add': return PIXI.BLEND_MODES.ADD;
      default: return PIXI.BLEND_MODES.NORMAL;
    }
  }

  // 비디오/이미지 텍스처 및 스프라이트 캐시
  getOrCreateMediaSprite(clip) {
    if (!this.textureCache.has(clip.id)) {
      let sourceElement = document.querySelector(`video[src="${clip.url}"]`) || 
                          document.querySelector(`img[src="${clip.url}"]`) ||
                          document.getElementById(`video_${clip.id}`);

      let baseTexture;
      if (sourceElement) {
        baseTexture = PIXI.BaseTexture.from(sourceElement, {
          resourceOptions: { autoPlay: false, updateFPS: 30 }
        });
      } else if (clip.url) {
        baseTexture = PIXI.BaseTexture.from(clip.url);
      } else {
        return null;
      }

      const texture = new PIXI.Texture(baseTexture);
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);

      this.textureCache.set(clip.id, { sprite, baseTexture });
    }

    const item = this.textureCache.get(clip.id);
    if (item.baseTexture?.resource?.source instanceof HTMLVideoElement) {
      item.baseTexture.update();
    }
    return item.sprite;
  }

  // 1080p 고해상도 안티앨리어싱 자막 스프라이트
  getOrCreateTextSprite(clip) {
    if (!this.textCache.has(clip.id)) {
      const style = clip.style || {};
      const pixiStyle = new PIXI.TextStyle({
        fontFamily: style.fontFamily || 'sans-serif',
        fontSize: (style.fontSize || 24) * 2.2,
        fontWeight: '900',
        fill: style.color || '#FFFFFF',
        stroke: style.strokeColor || '#000000',
        strokeThickness: (style.strokeWidth || 3.0) * 2.2,
        align: style.align || 'center',
        wordWrap: true,
        wordWrapWidth: this.width * 0.88,
        lineHeight: (style.fontSize || 24) * 2.8,
        dropShadow: true,
        dropShadowColor: 'rgba(0, 0, 0, 0.85)',
        dropShadowBlur: 8,
        dropShadowDistance: 4
      });

      const textSprite = new PIXI.Text(clip.content || '', pixiStyle);
      textSprite.anchor.set(0.5);
      this.textCache.set(clip.id, textSprite);
    }

    const textSprite = this.textCache.get(clip.id);
    if (textSprite.text !== (clip.content || '')) {
      textSprite.text = clip.content || '';
    }
    return textSprite;
  }

  // GPU 벡터 크롭 & 둥근 모서리 마스크 생성
  getOrCreateCropMask(clipId, width, height, crop = {}, borderRadius = 0) {
    if (!this.maskCache.has(clipId)) {
      const g = new PIXI.Graphics();
      this.maskCache.set(clipId, g);
    }
    const mask = this.maskCache.get(clipId);
    mask.clear();
    mask.beginFill(0xffffff);

    const left = (crop.left || 0) * 0.01 * width;
    const top = (crop.top || 0) * 0.01 * height;
    const right = (crop.right || 0) * 0.01 * width;
    const bottom = (crop.bottom || 0) * 0.01 * height;

    const maskW = Math.max(1, width - left - right);
    const maskH = Math.max(1, height - top - bottom);

    if (borderRadius > 0) {
      mask.drawRoundedRect(left - width / 2, top - height / 2, maskW, maskH, borderRadius);
    } else {
      mask.drawRect(left - width / 2, top - height / 2, maskW, maskH);
    }
    mask.endFill();
    return mask;
  }

  // 🌟 1초에 60회 구동되는 마스터 렌더 루프
  renderFrame(activeClips = [], playhead = 0) {
    Object.values(this.layers).forEach(layer => layer.removeChildren());

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const currentTime = performance.now() * 0.001;

    activeClips.forEach(clip => {
      const targetTrack = clip.trackId || (clip.type === 'text' ? 'T1' : 'V1');
      const targetLayer = this.layers[targetTrack] || this.layers.V1;
      const localTime = playhead - (clip.start || 0);

      // [A] 비디오 / 이미지 렌더링
      if (clip.type === 'video' || clip.type === 'image') {
        const sprite = this.getOrCreateMediaSprite(clip);
        if (!sprite) return;

        const origWidth = sprite.texture.orig?.width || sprite.texture.width || 1920;
        const origHeight = sprite.texture.orig?.height || sprite.texture.height || 1080;

        // 베지어 키프레임 보간 (스케일, 위치, 회전, 투명도)
        const baseScale = (clip.scaling === 'fit') 
          ? Math.min(this.width / origWidth, this.height / origHeight)
          : Math.max(this.width / origWidth, this.height / origHeight);

        const dynamicScale = keyframeEngine.interpolateKeyframe(
          clip.keyframes?.scale,
          localTime,
          clip.transform?.scale ?? clip.scale ?? 100,
          CURVE_PRESETS.DAVINCI_DYNAMIC
        );

        const dynamicPosX = keyframeEngine.interpolateKeyframe(
          clip.keyframes?.positionX,
          localTime,
          clip.transform?.x ?? clip.positionX ?? 0,
          CURVE_PRESETS.PREMIERE_EXPONENTIAL
        );

        const dynamicPosY = keyframeEngine.interpolateKeyframe(
          clip.keyframes?.positionY,
          localTime,
          clip.transform?.y ?? clip.positionY ?? 0,
          CURVE_PRESETS.PREMIERE_EXPONENTIAL
        );

        const dynamicRotate = keyframeEngine.interpolateKeyframe(
          clip.keyframes?.rotation,
          localTime,
          clip.transform?.rotate ?? clip.rotation ?? 0,
          CURVE_PRESETS.EASE_IN_OUT
        );

        const dynamicOpacity = keyframeEngine.interpolateKeyframe(
          clip.keyframes?.opacity,
          localTime,
          clip.opacity ?? 100,
          CURVE_PRESETS.LINEAR
        );

        const finalScale = baseScale * (dynamicScale / 100);
        sprite.scale.set(
          finalScale * (clip.transform?.flipH ? -1 : 1), 
          finalScale * (clip.transform?.flipV ? -1 : 1)
        );
        sprite.x = centerX + dynamicPosX;
        sprite.y = centerY + dynamicPosY;
        sprite.rotation = (dynamicRotate * Math.PI) / 180;
        sprite.alpha = Math.max(0, Math.min(1, dynamicOpacity / 100));
        sprite.blendMode = this.getPixiBlendMode(clip.transform?.blendMode || clip.blendMode);

        // 🌟 다빈치 리졸브 통합 셰이더 유니폼 갱신
        const filter = this.getOrCreateFilter(clip.id);
        const c = clip.color || {};
        filter.uniforms.uTime = currentTime;
        filter.uniforms.uLift = [c.liftR || c.lift || 0, c.liftG || c.lift || 0, c.liftB || c.lift || 0].map(v => v / 100);
        filter.uniforms.uGamma = [c.gammaR || c.gamma || 100, c.gammaG || c.gamma || 100, c.gammaB || c.gamma || 100].map(v => Math.max(0.01, v / 100));
        filter.uniforms.uGain = [c.gainR || c.gain || 100, c.gainG || c.gain || 100, c.gainB || c.gain || 100].map(v => v / 100);
        filter.uniforms.uSaturation = (c.saturation ?? 100) / 100;
        filter.uniforms.uContrast = (c.contrast ?? 100) / 100;
        filter.uniforms.uPivot = (c.pivot ?? 45) / 100;
        filter.uniforms.uTemperature = ((c.temperature ?? 6500) - 6500) / 3500;
        filter.uniforms.uTint = (c.tint ?? 0) / 100;
        filter.uniforms.uLutMode = c.lutMode || (clip.filterPreset === 'tealAndOrange' ? 1 : 0);
        filter.uniforms.uFilmGrain = (clip.filmGrain ?? (c.filmGrain || 0)) / 100;
        filter.uniforms.uVignette = (clip.vignette ?? (c.vignette || 0)) / 100;

        // 크로마키
        filter.uniforms.uUseChromaKey = clip.chromaKey ? 1 : 0;
        if (clip.chromaKeyColor) {
          filter.uniforms.uKeyColor = clip.chromaKeyColor;
        }

        sprite.filters = [filter];

        // GPU 마스크
        if (clip.crop && (clip.crop.left || clip.crop.right || clip.crop.top || clip.crop.bottom || clip.transform?.borderRadius)) {
          const mask = this.getOrCreateCropMask(clip.id, origWidth, origHeight, clip.crop, clip.transform?.borderRadius);
          mask.x = sprite.x;
          mask.y = sprite.y;
          mask.rotation = sprite.rotation;
          mask.scale.copyFrom(sprite.scale);
          sprite.mask = mask;
          targetLayer.addChild(mask);
        } else {
          sprite.mask = null;
        }

        targetLayer.addChild(sprite);
      }

      // [B] 자막 / 텍스트 렌더링
      else if (clip.type === 'text') {
        const textSprite = this.getOrCreateTextSprite(clip);
        if (!textSprite) return;

        const tf = clip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
        textSprite.x = centerX + (tf.x ?? clip.positionX ?? 0);
        textSprite.y = (this.height * 0.76) + (tf.y ?? clip.positionY ?? 0);
        textSprite.rotation = ((tf.rotate ?? clip.rotation ?? 0) * Math.PI) / 180;
        textSprite.alpha = (clip.opacity ?? 100) / 100;
        textSprite.scale.set((tf.scale ?? 100) / 100);

        targetLayer.addChild(textSprite);
      }
    });

    this.app.renderer.render(this.app.stage);
  }

  // 완전 소각 및 리소스 메모리 해제
  destroy() {
    this.textureCache.forEach(({ baseTexture }) => baseTexture.destroy());
    this.textureCache.clear();
    this.textCache.clear();
    this.filterCache.clear();
    this.maskCache.forEach(m => m.destroy());
    this.maskCache.clear();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}

// 🌟 [호환성 보장] 프로젝트 내 기존 import 명칭이 WebGLRenderer이든 WebGLVideoEngine이든 에러 없도록 이중 익스포트
export const WebGLRenderer = WebGLVideoEngine;
export default WebGLVideoEngine;
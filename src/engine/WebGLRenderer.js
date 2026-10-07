// src/engine/WebGLVideoEngine.js
import * as PIXI from 'pixi.js';

export class WebGLVideoEngine {
  constructor(canvasElement, width = 1080, height = 1920) {
    this.width = width;
    this.height = height;

    // PixiJS 렌더러 엔진 초기화 (하드웨어 가속 및 안티앨리어싱 보존)
    this.app = new PIXI.Application({
      view: canvasElement,
      width,
      height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preserveDrawingBuffer: true, // 하드웨어 가속 인코딩 프레임 버퍼 유지
      antialias: true
    });
    
    // 메모리 누수 방지 캐시 풀
    this.textureCache = new Map();
    this.textCache = new Map();
    this.filterCache = new Map();
    this.maskCache = new Map();

    // 🌟 V1~V6 비디오 트랙 및 T1~T2 자막 트랙 동적 레이어 트리
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

    // zIndex 적층 순서 등록
    Object.values(this.layers).forEach(container => {
      this.app.stage.addChild(container);
    });

    // 🌟 다빈치 리졸브 21 규격 풀 스펙트럼 컬러 사이언스 & Despill 크로마키 GLSL 셰이더
    this.colorShaderFrag = `
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float uLift;
      uniform float uGamma;
      uniform float uGain;
      uniform float uSaturation;
      uniform float uTemperature;
      uniform float uTint;
      uniform int uUseChromaKey;
      uniform vec3 uKeyColor;
      uniform float uKeyThreshold;
      uniform float uKeySoftness;

      vec3 adjustColorTemp(vec3 color, float temp, float tint) {
        color.r += temp * 0.12;
        color.b -= temp * 0.12;
        color.g += tint * 0.12;
        return clamp(color, 0.0, 1.0);
      }

      void main(void) {
        vec4 color = texture2D(uSampler, vTextureCoord);
        
        // 1. 프로급 크로마키 & 디스필(녹색 반사광 자동 제거) 연산
        if (uUseChromaKey == 1) {
          float diff = length(color.rgb - uKeyColor);
          float alpha = smoothstep(uKeyThreshold, uKeyThreshold + uKeySoftness, diff);
          color.a *= alpha;
          
          // Despill 처리: 피사체 경계면의 초록색을 적/청 평균으로 억제
          if (color.g > max(color.r, color.b)) {
            color.g = (color.r + color.b) * 0.5;
          }
          color.rgb *= color.a;
        }

        // 2. 다빈치 리졸브 CDL 3-Way Color Wheels (Lift, Gamma, Gain)
        color.rgb = color.rgb * uGain + uLift;
        color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / max(uGamma, 0.001)));

        // 3. 색온도 & 틴트 보정
        color.rgb = adjustColorTemp(color.rgb, uTemperature, uTint);

        // 4. Rec.709 방송 표준 휘도 기반 채도(Saturation) 연산
        float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        color.rgb = mix(vec3(luma), color.rgb, uSaturation);

        gl_FragColor = color;
      }
    `;
  }

  // 클립별 전용 셰이더 필터 캐싱 (필터 오염 및 메모리 누수 방지)
  getOrCreateFilter(clipId) {
    if (!this.filterCache.has(clipId)) {
      const filter = new PIXI.Filter(null, this.colorShaderFrag, {
        uLift: 0.0,
        uGamma: 1.0,
        uGain: 1.0,
        uSaturation: 1.0,
        uTemperature: 0.0,
        uTint: 0.0,
        uUseChromaKey: 0,
        uKeyColor: [0.0, 1.0, 0.0],
        uKeyThreshold: 0.35,
        uKeySoftness: 0.15
      });
      this.filterCache.set(clipId, filter);
    }
    return this.filterCache.get(clipId);
  }

  // 블렌드 모드 GPU 상수 매핑
  getPixiBlendMode(mode) {
    switch (mode) {
      case 'screen': return PIXI.BLEND_MODES.SCREEN;
      case 'multiply': return PIXI.BLEND_MODES.MULTIPLY;
      case 'overlay': return PIXI.BLEND_MODES.OVERLAY;
      case 'add': return PIXI.BLEND_MODES.ADD;
      default: return PIXI.BLEND_MODES.NORMAL;
    }
  }

  // GPU 크롭 마스크 생성 및 캐싱
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

  // 미디어 소스(비디오/이미지) 스프라이트 생성
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
    
    // 비디오 텍스처 프레임 GPU 실시간 갱신
    if (item.baseTexture?.resource?.source instanceof HTMLVideoElement) {
      item.baseTexture.update();
    }

    return item.sprite;
  }

  // 방송 규격 1080p 안티앨리어싱 자막 스프라이트 생성
  getOrCreateTextSprite(clip) {
    if (!this.textCache.has(clip.id)) {
      const style = clip.style || {};
      const pixiStyle = new PIXI.TextStyle({
        fontFamily: 'sans-serif',
        fontSize: (style.fontSize || 24) * 2.4,
        fontWeight: '900',
        fill: style.color || '#FFFFFF',
        stroke: style.strokeColor || '#000000',
        strokeThickness: (style.strokeWidth || 2.5) * 2.4,
        align: style.align || 'center',
        wordWrap: true,
        wordWrapWidth: this.width * 0.88,
        lineHeight: (style.fontSize || 24) * 3.1,
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

  // 🌟 1초에 60회 가동되는 하드웨어 가속 마스터 렌더 루프
  renderFrame(activeClips = [], playhead = 0) {
    // 이전 프레임 레이어 컨테이너 클리어
    Object.values(this.layers).forEach(layer => layer.removeChildren());

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    activeClips.forEach(clip => {
      const targetTrack = clip.trackId || (clip.type === 'text' ? 'T1' : 'V1');
      const targetLayer = this.layers[targetTrack] || this.layers.V1;
      const tf = clip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
      const duration = clip.duration || 3.5;
      const timeFromStart = playhead - (clip.start || 0);
      const progress = Math.max(0, Math.min(1, timeFromStart / duration));

      // [A] 비디오 / 이미지 렌더링
      if (clip.type === 'video' || clip.type === 'image') {
        const sprite = this.getOrCreateMediaSprite(clip);
        if (!sprite) return;

        // 원본 불변 해상도 기준 연산 (스케일 누적 폭발 방지)
        const origWidth = sprite.texture.orig?.width || sprite.texture.width || 1920;
        const origHeight = sprite.texture.orig?.height || sprite.texture.height || 1080;

        let baseScale = 1.0;
        if (clip.scaling === 'fit') {
          baseScale = Math.min(this.width / origWidth, this.height / origHeight);
        } else {
          baseScale = Math.max(this.width / origWidth, this.height / origHeight);
        }

        // 다이내믹 줌 애니메이션
        let animScaleBonus = 1.0;
        if (clip.animation === 'zoomIn') animScaleBonus = 1.0 + (0.15 * progress);
        if (clip.animation === 'zoomOut') animScaleBonus = 1.15 - (0.15 * progress);

        // 비트 임팩트 펄스 연산
        let beatPulse = 1.0;
        if (clip.beatImpact && timeFromStart <= 0.15 && timeFromStart >= 0) {
          beatPulse = 1.0 + ((1.0 - (timeFromStart / 0.15)) * 0.12);
        }

        // 트랜스폼 최종 계산
        const finalScale = baseScale * animScaleBonus * beatPulse * ((tf.scale ?? clip.scale ?? 100) / 100);
        const flipX = tf.flipH ? -1 : 1;
        const flipY = tf.flipV ? -1 : 1;
        sprite.scale.set(finalScale * flipX, finalScale * flipY);

        sprite.x = centerX + (tf.x ?? clip.positionX ?? 0);
        sprite.y = centerY + (tf.y ?? clip.positionY ?? 0);
        sprite.rotation = ((tf.rotate ?? clip.rotation ?? 0) * Math.PI) / 180;
        sprite.alpha = (clip.opacity ?? tf.opacity ?? 100) / 100;
        sprite.blendMode = this.getPixiBlendMode(tf.blendMode || clip.blendMode);

        // 🌟 다빈치 리졸브 셰이더 유니폼 실시간 동기화
        const filter = this.getOrCreateFilter(clip.id);
        const color = clip.color || {};
        filter.uniforms.uLift = (color.lift || 0) / 100;
        filter.uniforms.uGamma = (color.gamma || 100) / 100;
        filter.uniforms.uGain = (color.gain || 100) / 100;
        filter.uniforms.uSaturation = (color.saturation || 100) / 100;
        filter.uniforms.uTemperature = ((color.temperature || 6500) - 6500) / 3500;
        filter.uniforms.uTint = (color.tint || 0) / 100;
        
        filter.uniforms.uUseChromaKey = clip.chromaKey ? 1 : 0;
        if (clip.chromaKeyColor) {
          filter.uniforms.uKeyColor = clip.chromaKeyColor; // [r, g, b]
        }

        sprite.filters = [filter];

        // GPU 크롭 마스크 적용
        if (clip.crop && (clip.crop.left || clip.crop.right || clip.crop.top || clip.crop.bottom || tf.borderRadius)) {
          const mask = this.getOrCreateCropMask(clip.id, origWidth, origHeight, clip.crop, tf.borderRadius);
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

        textSprite.x = centerX + (tf.x ?? clip.positionX ?? 0);
        textSprite.y = (this.height * 0.78) + (tf.y ?? clip.positionY ?? 0);
        textSprite.rotation = ((tf.rotate ?? clip.rotation ?? 0) * Math.PI) / 180;
        textSprite.alpha = (clip.opacity ?? 100) / 100;
        textSprite.scale.set((tf.scale ?? 100) / 100);

        targetLayer.addChild(textSprite);
      }
    });

    // WebGL 파이프라인 즉시 렌더
    this.app.renderer.render(this.app.stage);
  }

  // 메모리 누수 방지 및 리소스 완전 해제
  destroy() {
    this.textureCache.forEach(({ baseTexture }) => baseTexture.destroy());
    this.textureCache.clear();
    this.textCache.clear();
    this.filterCache.clear();
    this.maskCache.forEach(mask => mask.destroy());
    this.maskCache.clear();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}
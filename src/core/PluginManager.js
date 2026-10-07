// src/core/PluginManager.js
import { TRANSITIONS, FILTERS } from '../engine/EffectsLibrary';

export class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  // 🌐 외부 플러그인 등록 (GitHub 커뮤니티 확장용)
  register(pluginDefinition) {
    const { id, name, type, cssKeyframes, filterString, uiComponent } = pluginDefinition;
    
    if (this.plugins.has(id)) {
      console.warn(`Plugin [${id}] is already registered.`);
      return;
    }

    // 1. 트랜지션 셰이더 플러그인일 경우
    if (type === 'transition') {
      TRANSITIONS[id] = { name, class: `trans-plugin-${id}` };
      this._injectCSS(`
        @keyframes plugin_anim_${id} { ${cssKeyframes} }
        .trans-plugin-${id} { animation: plugin_anim_${id} 0.4s ease-in-out forwards; }
      `);
    }

    // 2. 3D LUT 컬러 필터 플러그인일 경우
    if (type === 'filter') {
      FILTERS[id] = { name, filter: filterString };
    }

    this.plugins.set(id, pluginDefinition);
    console.log(`🚀 GTC STUDIO Plugin Loaded: ${name}`);
  }

  // 동적 CSS 주입기
  _injectCSS(cssString) {
    const style = document.createElement('style');
    style.innerHTML = cssString;
    document.head.appendChild(style);
  }
}

export const pluginManager = new PluginManager();

// ========================================================
// 💡 커뮤니티 개발자가 작성하게 될 플러그인 예시 코드
// ========================================================
/*
pluginManager.register({
  id: 'matrix_hacker',
  name: '매트릭스 해커 룩',
  type: 'filter',
  filterString: 'hue-rotate(120deg) contrast(150%) saturate(200%) brightness(0.8)'
});
*/
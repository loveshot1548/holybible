// src/games/jerusalem/components/GameEngine.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_W = 88;
const TILE_H = 44;
const ORIG_X = 0;
const ORIG_Y = -210;

// =====================================================================
// 📐 28대 건축물 타일 규격 및 SVG 바닥 앵커(기준점) 정밀 메트릭
// =====================================================================
const BUILDING_METRICS = {
  road: { w: 88, h: 44, anchorX: 0.5, anchorY: 0.5 },
  plaza: { w: 88, h: 44, anchorX: 0.5, anchorY: 0.5 },
  aqueduct: { w: 88, h: 96, anchorX: 0.5, anchorY: 0.92 },
  house_1: { w: 88, h: 90, anchorX: 0.5, anchorY: 0.88 },
  house_2: { w: 88, h: 100, anchorX: 0.5, anchorY: 0.90 },
  house_3: { w: 88, h: 110, anchorX: 0.5, anchorY: 0.91 },
  house_4: { w: 88, h: 120, anchorX: 0.5, anchorY: 0.91 },
  house_5: { w: 88, h: 130, anchorX: 0.5, anchorY: 0.92 },
  wall: { w: 88, h: 86, anchorX: 0.5, anchorY: 0.91 },
  tower: { w: 88, h: 116, anchorX: 0.5, anchorY: 0.93 },
  well: { w: 88, h: 86, anchorX: 0.5, anchorY: 0.91 },

  gate: { w: 176, h: 130, anchorX: 0.5, anchorY: 0.91 },

  golgotha: { w: 176, h: 160, anchorX: 0.5, anchorY: 0.91 },
  synagogue: { w: 176, h: 156, anchorX: 0.5, anchorY: 0.92 },
  bread_market: { w: 176, h: 150, anchorX: 0.5, anchorY: 0.91 },
  fish_market: { w: 176, h: 150, anchorX: 0.5, anchorY: 0.91 },
  wheat_farm: { w: 176, h: 160, anchorX: 0.5, anchorY: 0.90 },
  fountain: { w: 176, h: 126, anchorX: 0.5, anchorY: 0.91 },
  vineyard: { w: 176, h: 136, anchorX: 0.5, anchorY: 0.91 },
  olive_grove: { w: 176, h: 136, anchorX: 0.5, anchorY: 0.91 },
  fishery: { w: 176, h: 136, anchorX: 0.5, anchorY: 0.91 },

  temple: { w: 264, h: 230, anchorX: 0.5, anchorY: 0.92 },

  caravan: { w: 176, h: 150, anchorX: 0.5, anchorY: 0.91 },
  sacrifice_market: { w: 176, h: 150, anchorX: 0.5, anchorY: 0.91 },
  money_changer: { w: 176, h: 150, anchorX: 0.5, anchorY: 0.91 },
  beatitudes: { w: 176, h: 136, anchorX: 0.5, anchorY: 0.91 },
  gethsemane: { w: 176, h: 136, anchorX: 0.5, anchorY: 0.91 },
  granary: { w: 176, h: 160, anchorX: 0.5, anchorY: 0.91 }
};

// 🏛️ 시저 3식 배회자(Walker) 대사 풀
const WALKER_THOUGHTS = {
  jesus: {
    name: '예수 그리스도',
    thoughts: [
      '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.',
      '나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요.',
      '누구든지 목마르거든 내게로 와서 마시라!'
    ]
  },
  disciple: {
    name: '열두 제자 & 물동이 배급원',
    thoughts: [
      '생명의 빵과 갈릴리 생선을 백성들의 집으로 나르고 있습니다!',
      '실로암 우물물이 이 거리까지 시원하게 공급되고 있군요.',
      '성전 예배의 기쁨이 온 예루살렘 거리에 가득합니다!'
    ]
  },
  merchant: {
    name: '예루살렘 무역 대상',
    thoughts: [
      '감람산의 순수한 올리브 기름과 가나의 포도주를 싣고 갑니다.',
      '장터마다 곡식과 물고기가 넘쳐나니 성읍이 날마다 번창합니다!',
      '다윗의 성문 안으로 평안을 비는 순례자들이 몰려옵니다.'
    ]
  }
};

// 🏛️ 고속 텍스처 캐시
const textureCache = new Map();
const pendingLoads = new Set();

const getBuildingTexture = (assetKey) => {
  if (textureCache.has(assetKey)) return textureCache.get(assetKey);

  if (!pendingLoads.has(assetKey)) {
    pendingLoads.add(assetKey);
    const img = new Image();
    img.src = `/assets/buildings/${assetKey}.svg`;
    img.onload = () => {
      try {
        const tex = PIXI.Texture.from(img);
        textureCache.set(assetKey, tex);
      } catch (_) {}
    };
  }
  return null;
};

// =====================================================================
// ⛰️ 2.5D 지형 고도(Elevation) 및 자연 생태계 판별기
// - 성전산 고지대(Acropolis): +14px 융기
// - 유대 평야: 0px
// - 갈릴리 호수 & 요단강 수변: -10px 침강 (해안 절벽 형성)
// =====================================================================
const getNaturalTerrainType = (r, c) => {
  if (c === MAP_SIZE - 1 || (r >= MAP_SIZE - 2 && c >= MAP_SIZE - 3)) {
    return 'water';
  }
  if (r >= 2 && r <= 6 && c >= 2 && c <= 6) {
    return 'zion_plateau'; // 시온산 / 성전산 고지대 단상
  }
  if (c === MAP_SIZE - 2 || (r >= MAP_SIZE - 3 && c >= MAP_SIZE - 4)) {
    return 'meadow';
  }
  const hash = (r * 31 + c * 17) % 19;
  if (hash === 0) return 'palm_tree';
  if (hash === 1) return 'olive_tree';
  if (hash === 2) return 'cypress_tree';
  if (hash === 3) return 'desert_rock';
  return 'sand';
};

const getTileElevation = (r, c, cell) => {
  const terrain = getNaturalTerrainType(r, c);
  if (!cell && terrain === 'water') return -10; // 수면은 대지보다 10px 아래에 위치
  if (terrain === 'zion_plateau') return 12;    // 시온산 성전 구역은 12px 높게 융기
  return 0;
};

// =====================================================================
// 🧱 2.5D 아이소메트릭 프리즘(육면체 블록) 드로잉 유틸리티
// =====================================================================
const drawIsoPrism = (gfx, baseN, baseE, baseS, baseW, height, topColor, leftColor, rightColor, strokeColor = 0x3E2723, alpha = 1.0) => {
  // 좌측 벽 (서남향 양지)
  gfx.poly([
    baseW.x, baseW.y - height,
    baseS.x, baseS.y - height,
    baseS.x, baseS.y,
    baseW.x, baseW.y
  ]);
  gfx.fill({ color: leftColor, alpha });
  if (strokeColor !== null) gfx.stroke({ width: 1, color: strokeColor, alpha: alpha * 0.65 });

  // 우측 벽 (동남향 음지)
  gfx.poly([
    baseS.x, baseS.y - height,
    baseE.x, baseE.y - height,
    baseE.x, baseE.y,
    baseS.x, baseS.y
  ]);
  gfx.fill({ color: rightColor, alpha });
  if (strokeColor !== null) gfx.stroke({ width: 1, color: strokeColor, alpha: alpha * 0.65 });

  // 상단 면 (옥상/지붕 바닥)
  gfx.poly([
    baseN.x, baseN.y - height,
    baseE.x, baseE.y - height,
    baseS.x, baseS.y - height,
    baseW.x, baseW.y - height
  ]);
  gfx.fill({ color: topColor, alpha });
  if (strokeColor !== null) gfx.stroke({ width: 1.1, color: strokeColor, alpha: alpha * 0.8 });
};

// =====================================================================
// 🏛️ 프로시저럴 2.5D 입체 건축물 조형기 (건물이 절대 평면이나 공중부양처럼 안 보이도록!)
// =====================================================================
const drawProcedural25DBuilding = (gfx, type, level, base, simTick) => {
  const shrinkBase = (b, ratio) => {
    const cx = (b.N.x + b.S.x) / 2;
    const cy = (b.E.y + b.W.y) / 2;
    return {
      N: { x: cx + (b.N.x - cx) * ratio, y: cy + (b.N.y - cy) * ratio },
      E: { x: cx + (b.E.x - cx) * ratio, y: cy + (b.E.y - cy) * ratio },
      S: { x: cx + (b.S.x - cx) * ratio, y: cy + (b.S.y - cy) * ratio },
      W: { x: cx + (b.W.x - cx) * ratio, y: cy + (b.W.y - cy) * ratio }
    };
  };

  const shiftBaseY = (b, dy) => ({
    N: { x: b.N.x, y: b.N.y - dy },
    E: { x: b.E.x, y: b.E.y - dy },
    S: { x: b.S.x, y: b.S.y - dy },
    W: { x: b.W.x, y: b.W.y - dy }
  });

  // 1) 모든 건물 공통: 지면에 단단히 뿌리내린 3D 석회암 기단(Plinth)
  const plinthH = type === 'temple' ? 14 : 6;
  drawIsoPrism(gfx, base.N, base.E, base.S, base.W, plinthH, 0xE7D8C1, 0xD6C1A0, 0xB59D7B, 0x5C4028);

  const onPlinth = shiftBaseY(base, plinthH);
  const inner = shrinkBase(onPlinth, 0.82);

  if (type === 'house') {
    const wallH = 16 + level * 9;
    const topC = level >= 4 ? 0xD97706 : 0xE6D2B5;
    const leftC = level >= 5 ? 0xFFFBEB : 0xF5EBE0;
    const rightC = level >= 5 ? 0xE2E8F0 : 0xD5BDAF;
    drawIsoPrism(gfx, inner.N, inner.E, inner.S, inner.W, wallH, topC, leftC, rightC, 0x4A3525);

    // 3단계 이상 가옥은 2층 테라코타 다락방 & 지붕 돔 추가
    if (level >= 3) {
      const roofBase = shiftBaseY(shrinkBase(inner, 0.65), wallH);
      drawIsoPrism(gfx, roofBase.N, roofBase.E, roofBase.S, roofBase.W, 12, 0xB45309, 0xFEF3C7, 0xD97706, 0x4A3525);
    }
  } else if (type === 'temple') {
    // 솔로몬/헤롯 대성전: 외소 뜰 성벽 + 황금 성소 본관
    const outerCourt = shrinkBase(onPlinth, 0.92);
    drawIsoPrism(gfx, outerCourt.N, outerCourt.E, outerCourt.S, outerCourt.W, 18, 0xF8FAFC, 0xF1F5F9, 0xCBD5E1, 0x475569);
    const sanctuary = shiftBaseY(shrinkBase(onPlinth, 0.56), 18);
    drawIsoPrism(gfx, sanctuary.N, sanctuary.E, sanctuary.S, sanctuary.W, 56, 0xFACC15, 0xFFFBEB, 0xE2E8F0, 0x92400E);
    const crown = shiftBaseY(shrinkBase(sanctuary, 0.85), 56);
    drawIsoPrism(gfx, crown.N, crown.E, crown.S, crown.W, 10, 0xFDE047, 0xF59E0B, 0xB45309, 0x78350F);
  } else if (type === 'synagogue') {
    drawIsoPrism(gfx, inner.N, inner.E, inner.S, inner.W, 34, 0xE2E8F0, 0xF8FAFC, 0xCBD5E1, 0x334155);
    const domeCenter = { x: (inner.N.x + inner.S.x) / 2, y: (inner.E.y + inner.W.y) / 2 - 34 };
    gfx.arc(domeCenter.x, domeCenter.y, 22, Math.PI, 0, false);
    gfx.fill(0x38BDF8);
    gfx.stroke({ width: 1.5, color: 0x0369A1 });
  } else if (type === 'wall' || type === 'tower' || type === 'gate') {
    const h = type === 'tower' ? 48 : type === 'gate' ? 38 : 26;
    const bBox = shrinkBase(onPlinth, type === 'wall' ? 0.92 : 0.88);
    drawIsoPrism(gfx, bBox.N, bBox.E, bBox.S, bBox.W, h, 0xD6C7B2, 0xE5D9C5, 0xB8A68E, 0x443727);
  } else if (type === 'aqueduct') {
    drawIsoPrism(gfx, inner.N, inner.E, inner.S, inner.W, 30, 0x38BDF8, 0xE2E8F0, 0x94A3B8, 0x475569);
  } else if (['bread_market', 'fish_market', 'sacrifice_market', 'money_changer', 'caravan'].includes(type)) {
    const awningC = type === 'fish_market' ? 0x0284C7 : type === 'bread_market' ? 0xD97706 : 0xE11D48;
    drawIsoPrism(gfx, inner.N, inner.E, inner.S, inner.W, 20, awningC, 0xFDE68A, 0xD97706, 0x5C2E0B);
  } else if (['wheat_farm', 'vineyard', 'olive_grove', 'fishery'].includes(type)) {
    const fieldC = type === 'wheat_farm' ? 0xFACC15 : type === 'vineyard' ? 0x86EFAC : type === 'fishery' ? 0x38BDF8 : 0xA3E635;
    const plot = shrinkBase(onPlinth, 0.9);
    drawIsoPrism(gfx, plot.N, plot.E, plot.S, plot.W, 5, fieldC, 0x65A30D, 0x3F6212, 0x365314);
  } else {
    drawIsoPrism(gfx, inner.N, inner.E, inner.S, inner.W, 24, 0xE7D8C1, 0xF5EBE0, 0xC8B6A6, 0x5C4028);
  }
};

export default function GameEngine({
  overlayMode = 'normal',
  timeOfDay = 'day',
  floatingEvents = [],
  onWalkerClick
}) {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const viewportRef = useRef(null);

  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const stateRef = useRef({ grid, walkers, selectedTool, overlayMode, timeOfDay, floatingEvents, onWalkerClick });
  stateRef.current = { grid, walkers, selectedTool, overlayMode, timeOfDay, floatingEvents, onWalkerClick };

  const walkerInterpRef = useRef(new Map());
  const floatTextPoolRef = useRef(new Map());

  const getTileCenter = (r, c, elev = 0) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y - elev
  });

  const getMultiTileBase = (r, c, w = 1, h = 1, elev = 0) => {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    return {
      N: { x: (c - r) * hw + ORIG_X, y: (c + r) * hh - hh + ORIG_Y - elev },
      E: { x: (c + w - r) * hw + ORIG_X, y: (c + w + r) * hh - hh + ORIG_Y - elev },
      S: { x: (c + w - (r + h)) * hw + ORIG_X, y: (c + w + r + h) * hh - hh + ORIG_Y - elev },
      W: { x: (c - (r + h)) * hw + ORIG_X, y: (c + r + h) * hh - hh + ORIG_Y - elev }
    };
  };

  const worldToTile = (wx, wy) => {
    const dx = wx - ORIG_X;
    const dy = wy - ORIG_Y;
    const yTerm = dy / (TILE_H / 2);
    const xTerm = dx / (TILE_W / 2);
    const c = Math.floor((yTerm + xTerm) / 2 + 0.5);
    const r = Math.floor((yTerm - xTerm) / 2 + 0.5);
    return { r, c };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    Object.keys(BUILDING_METRICS).forEach(key => getBuildingTexture(key));

    const app = new PIXI.Application();
    let viewport = null;

    app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0x1E1610,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true
    }).then(() => {
      if (!isMounted || !containerRef.current) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      pixiAppRef.current = app;

      viewport = new Viewport({
        screenWidth: containerRef.current.clientWidth,
        screenHeight: containerRef.current.clientHeight,
        worldWidth: MAP_SIZE * TILE_W * 3,
        worldHeight: MAP_SIZE * TILE_H * 3,
        events: app.renderer.events
      });

      viewportRef.current = viewport;
      window.tycoonViewport = viewport;

      app.stage.addChild(viewport);
      viewport
        .drag({ clampWheel: true })
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({ minScale: 0.42, maxScale: 2.35 });

      viewport.moveCenter(0, 120);

      // 🌟 2.5D 다층 렌더링 파이프라인 레이어
      const bedrockGfx = new PIXI.Graphics();    // 1. 3D 디오라마 대지 단면 (지각 두께)
      const groundGfx = new PIXI.Graphics();     // 2. 고도차 타일 & 수면 & 도로
      const overlayGfx = new PIXI.Graphics();    // 3. 시저3 보급망 오라
      const castShadowGfx = new PIXI.Graphics(); // 4. 입체 투영 그림자 + 접지 AO
      const bldg3DGfx = new PIXI.Graphics();     // 5. 2.5D 프로시저럴 입체 기단 & 건축 블록
      const bldgContainer = new PIXI.Container();// 6. 정밀 SVG 스프라이트
      const animPartsGfx = new PIXI.Graphics();  // 7. 풍차 날개, 분수 물줄기, 게이지
      const walkerGfx = new PIXI.Graphics();     // 8. 입체 시민 & 낙타 상단
      const previewGfx = new PIXI.Graphics();    // 9. 3D 반투명 건설 홀로그램 박스
      const fxGfx = new PIXI.Graphics();         // 10. 성전 연기 & 구름
      const floatTextContainer = new PIXI.Container(); // 11. 떠오르는 생산 텍스트 (+12 🍞)
      const nightGlowGfx = new PIXI.Graphics();  // 12. 야간 등불 조명

      viewport.addChild(bedrockGfx);
      viewport.addChild(groundGfx);
      viewport.addChild(overlayGfx);
      viewport.addChild(castShadowGfx);
      viewport.addChild(bldg3DGfx);
      viewport.addChild(bldgContainer);
      viewport.addChild(animPartsGfx);
      viewport.addChild(walkerGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(fxGfx);
      viewport.addChild(floatTextContainer);
      viewport.addChild(nightGlowGfx);

      let hoverTile = null;
      let isDragBuilding = false;
      let lastDragBuiltKey = '';

      viewport.on('pointermove', (e) => {
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const tile = worldToTile(worldPos.x, worldPos.y);
        if (tile.r >= 0 && tile.r < MAP_SIZE && tile.c >= 0 && tile.c < MAP_SIZE) {
          hoverTile = tile;

          const { selectedTool: curTool } = stateRef.current;
          if (isDragBuilding && ['road', 'plaza', 'wall'].includes(curTool)) {
            const tileKey = `${tile.r}-${tile.c}`;
            if (tileKey !== lastDragBuiltKey) {
              lastDragBuiltKey = tileKey;
              const bMeta = BUILDINGS[curTool];
              if (bMeta) buildAt(tile.r, tile.c, bMeta);
            }
          }
        } else {
          hoverTile = null;
        }
      });

      let touchStartTime = 0;
      let touchStartPos = { x: 0, y: 0 };

      viewport.on('pointerdown', (e) => {
        touchStartTime = Date.now();
        touchStartPos = { x: e.global.x, y: e.global.y };

        const { selectedTool: curTool } = stateRef.current;
        if (['road', 'plaza', 'wall'].includes(curTool) && hoverTile) {
          isDragBuilding = true;
          lastDragBuiltKey = `${hoverTile.r}-${hoverTile.c}`;
          viewport.plugins.pause('drag');
          const bMeta = BUILDINGS[curTool];
          if (bMeta) buildAt(hoverTile.r, hoverTile.c, bMeta);
        }
      });

      viewport.on('pointerup', (e) => {
        if (isDragBuilding) {
          isDragBuilding = false;
          viewport.plugins.resume('drag');
          return;
        }

        const elapsed = Date.now() - touchStartTime;
        const dist = Math.hypot(e.global.x - touchStartPos.x, e.global.y - touchStartPos.y);

        if (elapsed < 350 && dist < 10) {
          const worldPos = viewport.toWorld(e.global.x, e.global.y);

          const { walkers: curWalkers, onWalkerClick: walkerCb, grid: curGrid } = stateRef.current;
          for (let i = 0; i < curWalkers.length; i++) {
            const wk = curWalkers[i];
            const interp = walkerInterpRef.current.get(wk.id || i) || { r: wk.r, c: wk.c };
            const elev = getTileElevation(Math.round(interp.r), Math.round(interp.c), curGrid[Math.round(interp.r)]?.[Math.round(interp.c)]);
            const wPos = getTileCenter(interp.r, interp.c, elev);
            if (Math.hypot(worldPos.x - wPos.x, worldPos.y - (wPos.y - 12)) < 24) {
              if (walkerCb) {
                const pool = WALKER_THOUGHTS[wk.type] || WALKER_THOUGHTS.merchant;
                const randomThought = pool.thoughts[i % pool.thoughts.length];
                walkerCb({ type: wk.type, name: pool.name, thought: randomThought });
              }
              return;
            }
          }

          if (hoverTile) {
            const { r, c } = hoverTile;
            const { selectedTool: curTool } = stateRef.current;
            const clicked = curGrid[r]?.[c];

            if (curTool === 'inspect') {
              if (clicked) {
                const rootR = clicked.isRoot ? r : clicked.rootR;
                const rootC = clicked.isRoot ? c : clicked.rootC;
                const rootCell = curGrid[rootR]?.[rootC];
                if (rootCell) setInspectedTile({ ...rootCell, r: rootR, c: rootC });
              }
              return;
            }

            if (curTool === 'demolish') {
              demolishAt(r, c);
              return;
            }

            const bMeta = BUILDINGS[curTool];
            if (bMeta) {
              buildAt(r, c, bMeta);
            }
          }
        }
      });

      let simTick = 0;

      // ── 🔄 60FPS 2.5D 디오라마 메인 렌더링 루프 ──
      app.ticker.add((time) => {
        simTick += time.deltaTime * 0.05;
        const {
          grid: curGrid,
          walkers: curWalkers,
          selectedTool: curTool,
          overlayMode: curOverlay,
          timeOfDay: curTimeOfDay,
          floatingEvents: curFloating
        } = stateRef.current;

        if (curTimeOfDay === 'night') app.renderer.background.color = 0x090D16;
        else if (curTimeOfDay === 'sunset') app.renderer.background.color = 0x2B1206;
        else app.renderer.background.color = 0x1E1610;

        // ===============================================================
        // [1] ⛰️ 3D 디오라마 대지 암반 두께(Bedrock Cross-Section) 렌더링
        // ===============================================================
        bedrockGfx.clear();
        const wholeMapBase = getMultiTileBase(0, 0, MAP_SIZE, MAP_SIZE, 0);
        const slabDepth = 44;

        // 디오라마 하단 대지 그림자
        bedrockGfx.poly([
          wholeMapBase.N.x, wholeMapBase.N.y + slabDepth + 18,
          wholeMapBase.E.x + 12, wholeMapBase.E.y + slabDepth + 18,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth + 26,
          wholeMapBase.W.x - 12, wholeMapBase.W.y + slabDepth + 18
        ]);
        bedrockGfx.fill({ color: 0x000000, alpha: 0.55 });

        // 남서쪽(좌측) 지각 단면 암벽
        bedrockGfx.poly([
          wholeMapBase.W.x, wholeMapBase.W.y,
          wholeMapBase.S.x, wholeMapBase.S.y,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth,
          wholeMapBase.W.x, wholeMapBase.W.y + slabDepth
        ]);
        bedrockGfx.fill(0x8C6D46);
        bedrockGfx.stroke({ width: 1.5, color: 0x4A3520 });

        // 남동쪽(우측) 지각 단면 암벽 (갈릴리 호수 수면 단면 포함)
        bedrockGfx.poly([
          wholeMapBase.S.x, wholeMapBase.S.y,
          wholeMapBase.E.x, wholeMapBase.E.y,
          wholeMapBase.E.x, wholeMapBase.E.y + slabDepth,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth
        ]);
        bedrockGfx.fill(0x5C4328);
        bedrockGfx.stroke({ width: 1.5, color: 0x3A2817 });

        // ===============================================================
        // [2] 3단 고도차 지형 타일 (성전산 고지대 · 평야 · 갈릴리 수변 절벽)
        // ===============================================================
        groundGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            const terrain = getNaturalTerrainType(r, c);
            const elev = getTileElevation(r, c, cell);
            const { x: cx, y: cy } = getTileCenter(r, c, elev);
            const isHov = hoverTile && hoverTile.r === r && hoverTile.c === c;

            // 고지대(성전산) 또는 해안 절벽의 3D 측면 옹벽(Cliff Skirt) 렌더링
            if (elev !== 0) {
              const tileBase = getMultiTileBase(r, c, 1, 1, 0);
              if (elev > 0) {
                drawIsoPrism(
                  groundGfx,
                  tileBase.N, tileBase.E, tileBase.S, tileBase.W,
                  elev,
                  0xF5EBE0, 0xD6C1A0, 0xA68A64, 0x785A3C
                );
              } else {
                // 갈릴리 호수 해안 절벽 내벽
                groundGfx.poly([
                  cx, cy + TILE_H / 2 + elev,
                  cx - TILE_W / 2, cy + elev,
                  cx - TILE_W / 2, cy,
                  cx, cy + TILE_H / 2
                ]);
                groundGfx.fill(0x785A3C);
              }
            }

            let tileColor = (r + c) % 2 === 0 ? 0xEFE2C8 : 0xE7D6B7;
            if (terrain === 'zion_plateau') {
              tileColor = (r + c) % 2 === 0 ? 0xF8F1E5 : 0xEFE5D4;
            }
            if (!cell) {
              if (terrain === 'water') tileColor = 0x0369A1;
              else if (terrain === 'meadow') tileColor = 0xA7F3D0;
            } else if (cell.type === 'road') {
              tileColor = 0xB89F7D;
            } else if (cell.type === 'plaza') {
              tileColor = 0xF8FAFC;
            }

            if (isHov) tileColor = 0xFDE047;

            groundGfx.poly([
              cx, cy - TILE_H / 2,
              cx + TILE_W / 2, cy,
              cx, cy + TILE_H / 2,
              cx - TILE_W / 2, cy
            ]);
            groundGfx.fill(tileColor);
            groundGfx.stroke({
              width: isHov ? 2 : 1,
              color: isHov ? 0xD97706 : terrain === 'water' ? 0x0284C7 : 0xD4C09E
            });

            // 🌊 갈릴리 호수 입체 수면 하이라이트 & 고깃배 물결
            if (!cell && terrain === 'water') {
              const wave = Math.sin(simTick * 2.2 + r * 0.8 + c) * 5;
              groundGfx.poly([
                cx, cy - TILE_H / 2 + 3,
                cx + TILE_W / 2 - 4, cy,
                cx, cy + TILE_H / 2 - 3,
                cx - TILE_W / 2 + 4, cy
              ]);
              groundGfx.fill({ color: 0x0EA5E9, alpha: 0.45 });

              groundGfx.moveTo(cx - 12 + wave, cy - 3);
              groundGfx.lineTo(cx + 4 + wave, cy - 3);
              groundGfx.moveTo(cx - 6 - wave, cy + 4);
              groundGfx.lineTo(cx + 10 - wave, cy + 4);
              groundGfx.stroke({ width: 1.5, color: 0xBAE6FD, alpha: 0.8 });
            }

            // 🌴 입체 자연 식생 (야자수, 감람나무, 사이프러스 삼나무, 바위)
            if (!cell && terrain === 'palm_tree') {
              const sway = Math.sin(simTick * 1.6 + r) * 2.5;
              groundGfx.ellipse(cx + 4, cy + 2, 9, 4.5);
              groundGfx.fill({ color: 0x1E140A, alpha: 0.28 });
              groundGfx.moveTo(cx, cy + 2);
              groundGfx.quadraticCurveTo(cx + 3, cy - 10, cx + sway, cy - 22);
              groundGfx.stroke({ width: 3.5, color: 0x78350F });
              [-7, 0, 7].forEach((dx, i) => {
                groundGfx.ellipse(cx + sway + dx, cy - 22 + Math.abs(dx) * 0.3, 6, 3);
                groundGfx.fill(i === 1 ? 0x22C55E : 0x15803D);
              });
            } else if (!cell && terrain === 'olive_tree') {
              groundGfx.ellipse(cx + 3, cy + 2, 10, 5);
              groundGfx.fill({ color: 0x1E140A, alpha: 0.28 });
              groundGfx.rect(cx - 2.5, cy - 12, 5, 14);
              groundGfx.fill(0x5C2E0B);
              groundGfx.circle(cx - 4, cy - 15, 8);
              groundGfx.fill(0x3F6212);
              groundGfx.circle(cx + 4, cy - 14, 7.5);
              groundGfx.fill(0x4D7C0F);
              groundGfx.circle(cx, cy - 19, 8);
              groundGfx.fill(0x84CC16);
            } else if (!cell && terrain === 'cypress_tree') {
              groundGfx.ellipse(cx + 3, cy + 2, 7, 3.5);
              groundGfx.fill({ color: 0x1E140A, alpha: 0.28 });
              groundGfx.poly([cx, cy - 30, cx + 7, cy - 2, cx - 7, cy - 2]);
              groundGfx.fill(0x14532D);
              groundGfx.poly([cx, cy - 30, cx, cy - 2, cx - 7, cy - 2]);
              groundGfx.fill(0x166534);
            } else if (!cell && terrain === 'desert_rock') {
              const rBase = getMultiTileBase(r, c, 0.45, 0.45, elev - 4);
              drawIsoPrism(groundGfx, rBase.N, rBase.E, rBase.S, rBase.W, 9, 0xD6D3D1, 0xA8A29E, 0x78716C, 0x44403C);
            }

            // 🛣️ 입체 연석(Curb)이 살아있는 로마식 돌포장 도로 & 대리석 광장
            if (cell?.type === 'road') {
              const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              dirs.forEach(([dr, dc]) => {
                if (curGrid[r + dr]?.[c + dc]?.type === 'road' || curGrid[r + dr]?.[c + dc]?.type === 'plaza') {
                  const nElev = getTileElevation(r + dr, c + dc, curGrid[r + dr]?.[c + dc]);
                  const nPos = getTileCenter(r + dr, c + dc, nElev);
                  groundGfx.moveTo(cx, cy);
                  groundGfx.lineTo((cx + nPos.x) / 2, (cy + nPos.y) / 2);
                  groundGfx.stroke({ width: 16, color: 0x9C8260 });
                  groundGfx.moveTo(cx, cy);
                  groundGfx.lineTo((cx + nPos.x) / 2, (cy + nPos.y) / 2);
                  groundGfx.stroke({ width: 11, color: 0xDFCBB0 });
                }
              });
              groundGfx.ellipse(cx, cy, 8, 4.5);
              groundGfx.fill(0xE7D8C1);
              groundGfx.stroke({ width: 1, color: 0x785A3C });
            } else if (cell?.type === 'plaza') {
              const pBase = getMultiTileBase(r, c, 1, 1, elev);
              drawIsoPrism(groundGfx, pBase.N, pBase.E, pBase.S, pBase.W, 4, 0xF8FAFC, 0xE2E8F0, 0xCBD5E1, 0x94A3B8);
            }
          }
        }

        // ===============================================================
        // [3] 시저 3식 5대 오버레이 히트맵 & 보급 반경 링
        // ===============================================================
        overlayGfx.clear();
        if (curOverlay !== 'normal') {
          for (let r = 0; r < MAP_SIZE; r++) {
            for (let c = 0; c < MAP_SIZE; c++) {
              const cell = curGrid[r]?.[c];
              if (!cell || !cell.isRoot) continue;
              const elev = getTileElevation(r, c, cell);
              const { x: cx, y: cy } = getTileCenter(r, c, elev);

              let radiusTiles = 0;
              let auraColor = 0x38BDF8;

              if (curOverlay === 'water' && ['well', 'aqueduct', 'fountain'].includes(cell.type)) {
                radiusTiles = cell.type === 'fountain' ? 4 : 3;
                auraColor = 0x0284C7;
              } else if (curOverlay === 'food' && ['bread_market', 'fish_market', 'wheat_farm', 'fishery', 'granary'].includes(cell.type)) {
                radiusTiles = 4;
                auraColor = 0x16A34A;
              } else if (curOverlay === 'faith' && ['synagogue', 'temple', 'golgotha', 'beatitudes'].includes(cell.type)) {
                radiusTiles = cell.type === 'temple' ? 6 : 4;
                auraColor = 0x9333EA;
              }

              if (radiusTiles > 0) {
                overlayGfx.ellipse(cx, cy, radiusTiles * (TILE_W * 0.65), radiusTiles * (TILE_H * 0.65));
                overlayGfx.fill({ color: auraColor, alpha: 0.18 });
                overlayGfx.stroke({ width: 2.2, color: auraColor, alpha: 0.8 });
              }
            }
          }
        }

        // ===============================================================
        // [4] 🌑 지면 밀착 그림자(Ambient Occlusion) & 사선 투영 그림자
        // ===============================================================
        castShadowGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (!cell || !cell.isRoot || cell.type === 'road' || cell.type === 'plaza') continue;

            const w = cell.w || 1;
            const h = cell.h || 1;
            const elev = getTileElevation(r, c, cell);
            const base = getMultiTileBase(r, c, w, h, elev);

            // 1) 건물 밑바닥 밀착 앰비언트 오클루전(AO) 다크 링 (공중부양 느낌 100% 제거!)
            castShadowGfx.poly([
              base.N.x, base.N.y - 2,
              base.E.x + 5, base.E.y + 2,
              base.S.x, base.S.y + 6,
              base.W.x - 5, base.W.y + 2
            ]);
            castShadowGfx.fill({ color: 0x0F0904, alpha: 0.48 });

            // 2) 태양광 사선 롱 섀도우
            let bH = 28;
            if (cell.type === 'temple') bH = 85;
            else if (cell.type === 'golgotha') bH = 52;
            else if (cell.type === 'aqueduct') bH = 36;
            else if (cell.type === 'house') bH = 18 + (cell.level || 1) * 12;

            const sDx = bH * 0.72;
            const sDy = bH * 0.36;

            castShadowGfx.poly([
              base.W.x, base.W.y,
              base.S.x, base.S.y,
              base.E.x + sDx, base.E.y + sDy,
              base.N.x + sDx, base.N.y + sDy
            ]);
            castShadowGfx.fill({ color: 0x1A0F07, alpha: curTimeOfDay === 'sunset' ? 0.38 : 0.24 });
          }
        }

        // ===============================================================
        // [5 & 6] 🏛️ Z-Sorting 후 2.5D 입체 기단/블록 + SVG 스프라이트 결합 렌더링
        // ===============================================================
        bldg3DGfx.clear();
        bldgContainer.removeChildren();
        animPartsGfx.clear();
        nightGlowGfx.clear();

        const renderQueue = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell && cell.isRoot && cell.type !== 'road' && cell.type !== 'plaza') {
              renderQueue.push({
                r,
                c,
                cell,
                depth: (r + (cell.h || 1)) + (c + (cell.w || 1))
              });
            }
          }
        }
        renderQueue.sort((a, b) => a.depth - b.depth);

        renderQueue.forEach(({ r, c, cell }) => {
          const { type, level = 1, w = 1, h = 1 } = cell;
          const elev = getTileElevation(r, c, cell);
          const base = getMultiTileBase(r, c, w, h, elev);

          // Step A: 모든 건물 하단에 2.5D 입체 석재 기단(Plinth) 및 3D 매스 렌더링
          drawProcedural25DBuilding(bldg3DGfx, type, level, base, simTick);

          // Step B: 고화질 SVG 스프라이트를 3D 기단 상단(plinthOffset)에 정확히 안착
          const assetKey = type === 'house' ? `house_${level}` : type;
          const metrics = BUILDING_METRICS[assetKey] || BUILDING_METRICS[type] || BUILDING_METRICS.house_1;
          const tex = getBuildingTexture(assetKey);
          const plinthOffset = type === 'temple' ? 12 : 5;

          if (tex) {
            const spr = new PIXI.Sprite(tex);
            spr.anchor.set(metrics.anchorX, metrics.anchorY);
            spr.x = base.S.x;
            spr.y = base.S.y - plinthOffset;

            if (curTimeOfDay === 'night') spr.tint = 0x8BA3C7;
            else if (curTimeOfDay === 'sunset') spr.tint = 0xFDBA74;
            else spr.tint = 0xFFFFFF;

            bldgContainer.addChild(spr);
          }

          // 🎡 1) 밀밭 풍차 날개 실시간 회전
          if (type === 'wheat_farm' || type === 'granary') {
            const hubX = base.S.x - 8;
            const hubY = base.S.y - 96;
            for (let bIdx = 0; bIdx < 4; bIdx++) {
              const angle = simTick * 1.5 + (bIdx * Math.PI) / 2;
              const tipX = hubX + Math.cos(angle) * 28;
              const tipY = hubY + Math.sin(angle) * 28;
              const sideX = hubX + Math.cos(angle + 0.25) * 22;
              const sideY = hubY + Math.sin(angle + 0.25) * 22;

              animPartsGfx.moveTo(hubX, hubY);
              animPartsGfx.lineTo(tipX, tipY);
              animPartsGfx.stroke({ width: 2.5, color: 0x451A03 });

              animPartsGfx.poly([hubX, hubY, tipX, tipY, sideX, sideY]);
              animPartsGfx.fill({ color: 0xFFFBEB, alpha: 0.92 });
            }
          }

          // ⛲ 2) 대리석 분수대 물줄기 아치
          if (type === 'fountain') {
            const fX = base.S.x;
            const fY = base.S.y - 62;
            for (let d = 0; d < 4; d++) {
              const t = (simTick * 1.8 + d * 0.25) % 1;
              const dropX = fX + (d % 2 === 0 ? 1 : -1) * (t * 18);
              const dropY = fY - Math.sin(t * Math.PI) * 16 + t * 14;
              animPartsGfx.circle(dropX, dropY, 2.8);
              animPartsGfx.fill({ color: 0xE0F2FE, alpha: 1 - t * 0.65 });
            }
          }

          // 📊 3) 오버레이 모드 시 주택 번영도 게이지 바
          if (type === 'house' && curOverlay !== 'normal') {
            const barW = 36;
            const barH = 6;
            const bx = base.S.x - barW / 2;
            const by = base.S.y - (60 + level * 8);
            const ratio = level / 5;

            animPartsGfx.rect(bx, by, barW, barH);
            animPartsGfx.fill({ color: 0x1C1917, alpha: 0.9 });
            animPartsGfx.rect(bx + 1, by + 1, (barW - 2) * ratio, barH - 2);
            animPartsGfx.fill(curOverlay === 'water' ? 0x38BDF8 : curOverlay === 'food' ? 0x4ADE80 : 0xFACC15);
          }

          // 🕯️ 4) 야간/황혼 창문 등불 글로우
          if (curTimeOfDay === 'night' || curTimeOfDay === 'sunset') {
            nightGlowGfx.circle(base.S.x, base.S.y - 38, type === 'temple' ? 62 : 24);
            nightGlowGfx.fill({ color: 0xF59E0B, alpha: curTimeOfDay === 'night' ? 0.26 : 0.15 });
          }
        });

        // ===============================================================
        // [7] 🚶 입체 보행자(Walker) 스무스 보간 이동 & 고도(Elevation) 동기화
        // ===============================================================
        walkerGfx.clear();
        curWalkers.forEach((w, wIdx) => {
          const wKey = w.id || wIdx;
          const prevInterp = walkerInterpRef.current.get(wKey) || { r: w.r, c: w.c };
          const nextR = prevInterp.r + (w.r - prevInterp.r) * 0.08;
          const nextC = prevInterp.c + (w.c - prevInterp.c) * 0.08;
          walkerInterpRef.current.set(wKey, { r: nextR, c: nextC });

          const gridR = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(nextR)));
          const gridC = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(nextC)));
          const elev = getTileElevation(gridR, gridC, curGrid[gridR]?.[gridC]);
          const { x: cx, y: cy } = getTileCenter(nextR, nextC, elev);
          const bounce = Math.abs(Math.sin(simTick * 4.5 + wIdx)) * 3;
          const charY = cy - bounce;

          // 발밑 접지 그림자
          walkerGfx.ellipse(cx, cy + 2, 7, 3.5);
          walkerGfx.fill({ color: 0x1A0F07, alpha: 0.4 });

          if (w.type === 'jesus') {
            walkerGfx.circle(cx, charY - 21, 10);
            walkerGfx.fill({ color: 0xFBBF24, alpha: 0.85 });
            walkerGfx.circle(cx, charY - 18, 5.5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 4.5, charY - 12, 9, 13);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.stroke({ width: 1.4, color: 0x361F12 });

            walkerGfx.rect(cx - 1.5, charY - 12, 3, 13);
            walkerGfx.fill(0xEF4444);
          } else if (w.type === 'disciple') {
            walkerGfx.circle(cx, charY - 16, 5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 3.5, charY - 11, 7, 11);
            walkerGfx.fill(0x0284C7);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.moveTo(cx + 5, charY - 18);
            walkerGfx.lineTo(cx + 5, charY + 1);
            walkerGfx.stroke({ width: 1.6, color: 0x78350F });
          } else {
            walkerGfx.rect(cx - 5.5, charY - 8, 11, 7);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx + 6, charY - 9, 4);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx - 1, charY - 10, 3.8);
            walkerGfx.fill(0xF59E0B);
            walkerGfx.stroke({ width: 1, color: 0x361F12 });
          }
        });

        // ===============================================================
        // [8] 🟩 3D 반투명 건설 홀로그램 프리뷰 박스 (3D Ghost Prism)
        // ===============================================================
        previewGfx.clear();
        if (hoverTile && curTool !== 'demolish' && curTool !== 'inspect') {
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const { r, c } = hoverTile;
            const w = bMeta.w || 1;
            const h = bMeta.h || 1;
            const elev = getTileElevation(r, c, curGrid[r]?.[c]);
            const base = getMultiTileBase(r, c, w, h, elev);

            // 건설 가능 여부 검사
            let canBuild = true;
            for (let dr = 0; dr < h; dr++) {
              for (let dc = 0; dc < w; dc++) {
                if (r + dr >= MAP_SIZE || c + dc >= MAP_SIZE || curGrid[r + dr]?.[c + dc]) {
                  canBuild = false;
                }
              }
            }

            const ghostH = curTool === 'road' || curTool === 'plaza' ? 4 : curTool === 'temple' ? 70 : 28;
            const topCol = canBuild ? 0x34D399 : 0xF87171;
            const leftCol = canBuild ? 0x10B981 : 0xEF4444;
            const rightCol = canBuild ? 0x059669 : 0xDC2626;

            drawIsoPrism(previewGfx, base.N, base.E, base.S, base.W, ghostH, topCol, leftCol, rightCol, 0xFFFFFF, 0.45);
          }
        }

        // ===============================================================
        // [9] 🔥 성전 번제단 연기 & 실시간 떠오르는 자원 텍스트 (+12 🍞)
        // ===============================================================
        fxGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell?.type === 'temple' && cell.isRoot) {
              const elev = getTileElevation(r, c, cell);
              const tBase = getMultiTileBase(r, c, 3, 3, elev);
              const altarX = tBase.S.x + 22;
              const altarY = tBase.S.y - 34;

              for (let i = 1; i <= 5; i++) {
                const progress = (simTick * 0.4 + i * 0.2) % 1;
                const py = altarY - progress * 68;
                const px = altarX + Math.sin(simTick + i) * (progress * 15);
                const pRadius = 4.5 + progress * 9;

                fxGfx.circle(px, py, pRadius);
                fxGfx.fill({ color: 0xFFFFFF, alpha: 0.78 - progress * 0.58 });
              }
            }
          }
        }

        // 실시간 부유 자원 텍스트(floatingEvents) 렌더링
        const now = Date.now();
        const activeIds = new Set();
        (curFloating || []).forEach(ev => {
          const age = now - ev.createdAt;
          if (age > 2400) return;
          activeIds.add(ev.id);

          let txtSpr = floatTextPoolRef.current.get(ev.id);
          if (!txtSpr) {
            txtSpr = new PIXI.Text({
              text: ev.text,
              style: {
                fontFamily: 'sans-serif',
                fontSize: 13,
                fontWeight: '900',
                fill: ev.color || '#FDE047',
                stroke: { color: '#1E140A', width: 3.5 }
              }
            });
            txtSpr.anchor.set(0.5, 0.5);
            floatTextContainer.addChild(txtSpr);
            floatTextPoolRef.current.set(ev.id, txtSpr);
          }

          const progress = age / 2400;
          const elev = getTileElevation(ev.r, ev.c, curGrid[ev.r]?.[ev.c]);
          const pos = getTileCenter(ev.r, ev.c, elev);
          txtSpr.x = pos.x;
          txtSpr.y = pos.y - 45 - progress * 38;
          txtSpr.alpha = 1 - Math.pow(progress, 2);
        });

        // 수명이 다한 텍스트 스프라이트 정리
        floatTextPoolRef.current.forEach((spr, id) => {
          if (!activeIds.has(id)) {
            floatTextContainer.removeChild(spr);
            spr.destroy();
            floatTextPoolRef.current.delete(id);
          }
        });
      });
    });

    return () => {
      isMounted = false;
      floatTextPoolRef.current.clear();
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing touch-none">
      <div className="absolute bottom-3 left-3 bg-[#2A1B12]/90 text-amber-200 text-[10.5px] font-black px-3 py-1.5 rounded-full pointer-events-none z-10 backdrop-blur-md border border-amber-500/40 shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          {overlayMode === 'normal' && '⛰️ 2.5D 시온산 고지대 & 갈릴리 해안 절벽 디오라마 가동 중'}
          {overlayMode === 'water' && '💧 수자원 공급망 오버레이 (파란 원 안의 주택 진화)'}
          {overlayMode === 'food' && '🍞 식량·장터 보급망 오버레이 (초록 원 안의 주택 진화)'}
          {overlayMode === 'faith' && '🕊️ 성전·회당 교화망 오버레이 (보라 원 안의 신앙 공급)'}
          {overlayMode === 'prosperity' && '👑 주택 등급 및 번영도 오버레이'}
        </span>
      </div>
    </div>
  );
}
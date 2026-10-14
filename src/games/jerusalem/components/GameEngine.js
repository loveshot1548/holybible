// src/games/jerusalem/components/GameEngine.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_W = 84;
const TILE_H = 42;
const ORIG_X = 0;
const ORIG_Y = -180;

// =====================================================================
// 📐 28대 건축물 타일 규격 및 SVG 바닥 앵커(기준점) 정밀 메트릭
// =====================================================================
const BUILDING_METRICS = {
  road: { w: 84, h: 42, anchorX: 0.5, anchorY: 0.5 },
  plaza: { w: 84, h: 42, anchorX: 0.5, anchorY: 0.5 },
  aqueduct: { w: 84, h: 96, anchorX: 0.5, anchorY: 90 / 96 },
  house_1: { w: 84, h: 90, anchorX: 0.5, anchorY: 80 / 90 },
  house_2: { w: 84, h: 100, anchorX: 0.5, anchorY: 92 / 100 },
  house_3: { w: 84, h: 110, anchorX: 0.5, anchorY: 102 / 110 },
  house_4: { w: 84, h: 120, anchorX: 0.5, anchorY: 110 / 120 },
  house_5: { w: 84, h: 130, anchorX: 0.5, anchorY: 120 / 130 },
  wall: { w: 84, h: 86, anchorX: 0.5, anchorY: 80 / 86 },
  tower: { w: 84, h: 116, anchorX: 0.5, anchorY: 110 / 116 },
  well: { w: 84, h: 86, anchorX: 0.5, anchorY: 80 / 86 },

  gate: { w: 168, h: 130, anchorX: 0.5, anchorY: 120 / 130 },

  golgotha: { w: 168, h: 160, anchorX: 0.5, anchorY: 148 / 160 },
  synagogue: { w: 168, h: 156, anchorX: 0.5, anchorY: 146 / 156 },
  bread_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  fish_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  wheat_farm: { w: 168, h: 160, anchorX: 0.5, anchorY: 146 / 160 },
  fountain: { w: 168, h: 126, anchorX: 0.5, anchorY: 116 / 126 },
  vineyard: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  olive_grove: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  fishery: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },

  temple: { w: 252, h: 230, anchorX: 0.5, anchorY: 215 / 230 },

  caravan: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  sacrifice_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  money_changer: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  beatitudes: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  gethsemane: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  granary: { w: 168, h: 160, anchorX: 0.5, anchorY: 146 / 160 }
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
    name: '열두 제자 & 물동이 일꾼',
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

// 자연 지형 판별기 (강/호수, 초지, 야자수 식생)
const getNaturalTerrainType = (r, c) => {
  if (c === MAP_SIZE - 1 || (r >= MAP_SIZE - 2 && c >= MAP_SIZE - 3)) {
    return 'water'; // 갈릴리 호수 & 요단강 수변
  }
  if (c === MAP_SIZE - 2 || (r >= MAP_SIZE - 3 && c >= MAP_SIZE - 4)) {
    return 'meadow'; // 강변 비옥한 목초지
  }
  const hash = (r * 31 + c * 17) % 19;
  if (hash === 0) return 'palm_tree';
  if (hash === 1) return 'olive_tree';
  if (hash === 2) return 'desert_rock';
  return 'sand';
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

  // 보행자 부드러운 보간(Lerp) 위치 추적기
  const walkerInterpRef = useRef(new Map());

  const getTileCenter = (r, c) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y
  });

  const getMultiTileBase = (r, c, w = 1, h = 1) => {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    return {
      N: { x: (c - r) * hw + ORIG_X, y: (c + r) * hh - hh + ORIG_Y },
      E: { x: (c + w - r) * hw + ORIG_X, y: (c + w + r) * hh - hh + ORIG_Y },
      S: { x: (c + w - (r + h)) * hw + ORIG_X, y: (c + w + r + h) * hh - hh + ORIG_Y },
      W: { x: (c - (r + h)) * hw + ORIG_X, y: (c + r + h) * hh - hh + ORIG_Y }
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
      backgroundColor: 0xDFD1B8,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
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
        .clampZoom({ minScale: 0.45, maxScale: 2.3 });

      viewport.moveCenter(0, 100);

      const groundGfx = new PIXI.Graphics();
      const overlayGfx = new PIXI.Graphics();
      const castShadowGfx = new PIXI.Graphics();
      const previewGfx = new PIXI.Graphics();
      const bldgContainer = new PIXI.Container();
      const animPartsGfx = new PIXI.Graphics();
      const fxGfx = new PIXI.Graphics();
      const walkerGfx = new PIXI.Graphics();
      const nightGlowGfx = new PIXI.Graphics();

      viewport.addChild(groundGfx);
      viewport.addChild(overlayGfx);
      viewport.addChild(castShadowGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(bldgContainer);
      viewport.addChild(animPartsGfx);
      viewport.addChild(fxGfx);
      viewport.addChild(walkerGfx);
      viewport.addChild(nightGlowGfx);

      let hoverTile = null;
      let isDragBuilding = false;
      let lastDragBuiltKey = '';

      viewport.on('pointermove', (e) => {
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const tile = worldToTile(worldPos.x, worldPos.y);
        if (tile.r >= 0 && tile.r < MAP_SIZE && tile.c >= 0 && tile.c < MAP_SIZE) {
          hoverTile = tile;

          // 🛣️ 시저 3식 도로·광장·성벽 드래그 연속 시공
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

        if (elapsed < 350 && dist < 8) {
          const worldPos = viewport.toWorld(e.global.x, e.global.y);

          // 1) 보행자(Walker) 클릭 감지 -> 시저 3식 생각 말풍선 오픈
          const { walkers: curWalkers, onWalkerClick: walkerCb } = stateRef.current;
          for (let i = 0; i < curWalkers.length; i++) {
            const wk = curWalkers[i];
            const interp = walkerInterpRef.current.get(wk.id || i) || { r: wk.r, c: wk.c };
            const wPos = getTileCenter(interp.r, interp.c);
            if (Math.hypot(worldPos.x - wPos.x, worldPos.y - (wPos.y - 10)) < 22) {
              if (walkerCb) {
                const pool = WALKER_THOUGHTS[wk.type] || WALKER_THOUGHTS.merchant;
                const randomThought = pool.thoughts[i % pool.thoughts.length];
                walkerCb({ type: wk.type, name: pool.name, thought: randomThought });
              }
              return;
            }
          }

          // 2) 타일 클릭 (조사 / 철거 / 건설)
          if (hoverTile) {
            const { r, c } = hoverTile;
            const { grid: curGrid, selectedTool: curTool } = stateRef.current;
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

      // ── 🔄 60FPS 메인 렌더링 루프 ──
      app.ticker.add((time) => {
        simTick += time.deltaTime * 0.05;
        const {
          grid: curGrid,
          walkers: curWalkers,
          selectedTool: curTool,
          overlayMode: curOverlay,
          timeOfDay: curTimeOfDay
        } = stateRef.current;

        // 배경색 시간대 연동
        if (curTimeOfDay === 'night') app.renderer.background.color = 0x0F172A;
        else if (curTimeOfDay === 'sunset') app.renderer.background.color = 0x451A03;
        else app.renderer.background.color = 0xDFD1B8;

        // [1] 자연 지형(강, 초지, 사막, 야자수) & 자동 연결 도로 렌더링
        groundGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const { x: cx, y: cy } = getTileCenter(r, c);
            const cell = curGrid[r]?.[c];
            const isHov = hoverTile && hoverTile.r === r && hoverTile.c === c;
            const terrain = getNaturalTerrainType(r, c);

            let tileColor = (r + c) % 2 === 0 ? 0xF3E7CF : 0xEFE1C6;
            if (!cell) {
              if (terrain === 'water') tileColor = 0x0284C7;
              else if (terrain === 'meadow') tileColor = 0xBBF7D0;
            } else if (cell.type === 'road') {
              tileColor = 0xC7B293;
            } else if (cell.type === 'plaza') {
              tileColor = 0xF8FAFC;
            }

            if (isHov) tileColor = 0xFDE68A;

            groundGfx.poly([
              cx, cy - TILE_H / 2,
              cx + TILE_W / 2, cy,
              cx, cy + TILE_H / 2,
              cx - TILE_W / 2, cy
            ]);
            groundGfx.fill(tileColor);
            groundGfx.stroke({ width: 1.1, color: isHov ? 0xD97706 : 0xDECBA8 });

            // 🌊 갈릴리 호수 / 요단강 물결 애니메이션
            if (!cell && terrain === 'water') {
              const waveOffset = Math.sin(simTick * 2 + r + c) * 4;
              groundGfx.moveTo(cx - 14 + waveOffset, cy - 2);
              groundGfx.lineTo(cx + 2 + waveOffset, cy - 2);
              groundGfx.moveTo(cx - 4 - waveOffset, cy + 5);
              groundGfx.lineTo(cx + 12 - waveOffset, cy + 5);
              groundGfx.stroke({ width: 1.5, color: 0x7DD3FC, alpha: 0.75 });
            }

            // 🌴 빈 타일의 자연 식생 (야자수, 올리브 나무, 사막 바위)
            if (!cell && terrain === 'palm_tree') {
              const sway = Math.sin(simTick * 1.5 + r) * 2;
              groundGfx.ellipse(cx, cy + 2, 8, 4);
              groundGfx.fill({ color: 0x361F12, alpha: 0.22 });
              groundGfx.moveTo(cx, cy + 2);
              groundGfx.lineTo(cx + sway, cy - 18);
              groundGfx.stroke({ width: 3, color: 0x78350F });
              groundGfx.circle(cx + sway - 5, cy - 18, 5);
              groundGfx.circle(cx + sway + 5, cy - 18, 5);
              groundGfx.circle(cx + sway, cy - 22, 5.5);
              groundGfx.fill(0x15803D);
            } else if (!cell && terrain === 'olive_tree') {
              groundGfx.ellipse(cx, cy + 2, 9, 4.5);
              groundGfx.fill({ color: 0x361F12, alpha: 0.22 });
              groundGfx.rect(cx - 2, cy - 10, 4, 12);
              groundGfx.fill(0x5C2E0B);
              groundGfx.circle(cx, cy - 14, 9);
              groundGfx.fill(0x4D7C0F);
              groundGfx.circle(cx - 2, cy - 16, 6);
              groundGfx.fill(0x84CC16);
            } else if (!cell && terrain === 'desert_rock') {
              groundGfx.poly([cx - 8, cy + 3, cx - 2, cy - 5, cx + 7, cy + 2]);
              groundGfx.fill(0xA8A29E);
              groundGfx.stroke({ width: 1, color: 0x57534E });
            }

            // 🛣️ 스마트 자동 연결 포장도로 (이웃 도로와 매끄럽게 연결)
            if (cell?.type === 'road') {
              groundGfx.ellipse(cx - 9, cy - 2, 7, 3.5);
              groundGfx.fill(0xE7D8C1);
              groundGfx.ellipse(cx + 8, cy + 2, 8, 4);
              groundGfx.fill(0xB59D7B);

              // 인접 도로 연결선 표시
              const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              dirs.forEach(([dr, dc]) => {
                if (curGrid[r + dr]?.[c + dc]?.type === 'road') {
                  const nPos = getTileCenter(r + dr, c + dc);
                  groundGfx.moveTo(cx, cy);
                  groundGfx.lineTo((cx + nPos.x) / 2, (cy + nPos.y) / 2);
                  groundGfx.stroke({ width: 10, color: 0xD6C1A0, alpha: 0.65 });
                }
              });
            }
          }
        }

        // [2] 시저 3식 5대 오버레이 히트맵 & 보급 반경 링 렌더링
        overlayGfx.clear();
        if (curOverlay !== 'normal') {
          for (let r = 0; r < MAP_SIZE; r++) {
            for (let c = 0; c < MAP_SIZE; c++) {
              const cell = curGrid[r]?.[c];
              if (!cell || !cell.isRoot) continue;
              const { x: cx, y: cy } = getTileCenter(r, c);

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
                overlayGfx.fill({ color: auraColor, alpha: 0.16 });
                overlayGfx.stroke({ width: 2, color: auraColor, alpha: 0.7 });
              }
            }
          }
        }

        // [3] 건설 가이드 프리뷰
        previewGfx.clear();
        if (hoverTile && curTool !== 'demolish' && curTool !== 'inspect') {
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const { r, c } = hoverTile;
            const w = bMeta.w || 1;
            const h = bMeta.h || 1;
            const base = getMultiTileBase(r, c, w, h);

            previewGfx.poly([base.N.x, base.N.y, base.E.x, base.E.y, base.S.x, base.S.y, base.W.x, base.W.y]);
            previewGfx.fill({ color: 0xFBBF24, alpha: 0.45 });
            previewGfx.stroke({ width: 3, color: 0xD97706 });
          }
        }

        // [4] 부드러운 사선 투영 그림자
        castShadowGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (!cell || !cell.isRoot || cell.type === 'road' || cell.type === 'plaza') continue;

            const w = cell.w || 1;
            const h = cell.h || 1;
            const base = getMultiTileBase(r, c, w, h);
            
            let bH = 26;
            if (cell.type === 'temple') bH = 80;
            else if (cell.type === 'golgotha') bH = 50;
            else if (cell.type === 'aqueduct') bH = 34;
            else if (cell.type === 'house') bH = 16 + (cell.level || 1) * 12;

            const sDx = bH * 0.75;
            const sDy = bH * 0.38;

            castShadowGfx.poly([
              base.W.x, base.W.y,
              base.S.x, base.S.y,
              base.E.x + sDx, base.E.y + sDy,
              base.N.x + sDx, base.N.y + sDy
            ]);
            castShadowGfx.fill({ color: 0x241409, alpha: curTimeOfDay === 'sunset' ? 0.35 : 0.22 });
          }
        }

        // [5] Z-Sorting 후 건축물 스프라이트 및 실시간 동적 파츠(풍차 날개, 분수 물줄기, 오버레이 기둥) 렌더링
        bldgContainer.removeChildren();
        animPartsGfx.clear();
        nightGlowGfx.clear();

        const renderQueue = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell && cell.isRoot && cell.type !== 'road') {
              renderQueue.push({ r, c, cell, depth: r + c + (cell.w || 1) + (cell.h || 1) });
            }
          }
        }
        renderQueue.sort((a, b) => a.depth - b.depth);

        renderQueue.forEach(({ r, c, cell }) => {
          const { type, level = 1, w = 1, h = 1 } = cell;
          const base = getMultiTileBase(r, c, w, h);

          const assetKey = type === 'house' ? `house_${level}` : type;
          const metrics = BUILDING_METRICS[assetKey] || BUILDING_METRICS[type] || BUILDING_METRICS.house_1;
          const tex = getBuildingTexture(assetKey);

          if (tex) {
            const spr = new PIXI.Sprite(tex);
            spr.anchor.set(metrics.anchorX, metrics.anchorY);
            spr.x = base.S.x;
            spr.y = base.S.y;

            // 시간대별 색조 필터 (낮 / 노을 / 밤)
            if (curTimeOfDay === 'night') spr.tint = 0x8BA3C7;
            else if (curTimeOfDay === 'sunset') spr.tint = 0xFDBA74;
            else spr.tint = 0xFFFFFF;

            bldgContainer.addChild(spr);
          }

          // 🎡 1) 밀밭 풍차 날개 실시간 360도 회전 애니메이션
          if (type === 'wheat_farm' || type === 'granary') {
            const hubX = base.S.x - 8;
            const hubY = base.S.y - 92;
            for (let bIdx = 0; bIdx < 4; bIdx++) {
              const angle = simTick * 1.4 + (bIdx * Math.PI) / 2;
              const tipX = hubX + Math.cos(angle) * 28;
              const tipY = hubY + Math.sin(angle) * 28;
              const sideX = hubX + Math.cos(angle + 0.25) * 22;
              const sideY = hubY + Math.sin(angle + 0.25) * 22;

              animPartsGfx.moveTo(hubX, hubY);
              animPartsGfx.lineTo(tipX, tipY);
              animPartsGfx.stroke({ width: 2.5, color: 0x451A03 });

              animPartsGfx.poly([hubX, hubY, tipX, tipY, sideX, sideY]);
              animPartsGfx.fill({ color: 0xFFFBEB, alpha: 0.9 });
            }
          }

          // ⛲ 2) 대리석 분수대 & 수로교 물방울 점프 애니메이션
          if (type === 'fountain') {
            const fX = base.S.x;
            const fY = base.S.y - 58;
            for (let d = 0; d < 4; d++) {
              const t = (simTick * 1.8 + d * 0.25) % 1;
              const dropX = fX + (d % 2 === 0 ? 1 : -1) * (t * 18);
              const dropY = fY - Math.sin(t * Math.PI) * 16 + t * 14;
              animPartsGfx.circle(dropX, dropY, 2.5);
              animPartsGfx.fill({ color: 0xE0F2FE, alpha: 1 - t * 0.7 });
            }
          }

          // 📊 3) 시저 3식 주택 번영도/보급 상태 게이지 바 (오버레이 켜졌을 때)
          if (type === 'house' && curOverlay !== 'normal') {
            const barW = 34;
            const barH = 6;
            const bx = base.S.x - barW / 2;
            const by = base.S.y - (55 + level * 8);
            const ratio = level / 5;

            animPartsGfx.rect(bx, by, barW, barH);
            animPartsGfx.fill({ color: 0x1C1917, alpha: 0.85 });
            animPartsGfx.rect(bx + 1, by + 1, (barW - 2) * ratio, barH - 2);
            animPartsGfx.fill(curOverlay === 'water' ? 0x38BDF8 : curOverlay === 'food' ? 0x4ADE80 : 0xFACC15);
          }

          // 🕯️ 4) 야간/황혼 모드 시 주택 창문 & 성전 횃불 따뜻한 조명 글로우
          if (curTimeOfDay === 'night' || curTimeOfDay === 'sunset') {
            nightGlowGfx.circle(base.S.x, base.S.y - 35, type === 'temple' ? 55 : 22);
            nightGlowGfx.fill({ color: 0xF59E0B, alpha: curTimeOfDay === 'night' ? 0.25 : 0.14 });
          }
        });

        // [6] 성전 번제단 연기 파티클 & 플로팅 생산 이펙트
        fxGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell?.type === 'temple' && cell.isRoot) {
              const tBase = getMultiTileBase(r, c, 3, 3);
              const altarX = tBase.S.x + 22;
              const altarY = tBase.S.y - 25;

              for (let i = 1; i <= 5; i++) {
                const progress = (simTick * 0.4 + i * 0.2) % 1;
                const py = altarY - progress * 65;
                const px = altarX + Math.sin(simTick + i) * (progress * 15);
                const pRadius = 4 + progress * 8.5;

                fxGfx.circle(px, py, pRadius);
                fxGfx.fill({ color: 0xFFFFFF, alpha: 0.75 - progress * 0.55 });
              }
            }
          }
        }

        // [7] 🚶 보행자(Walker) 스무스 보간 이동 & 디테일 렌더링
        walkerGfx.clear();
        curWalkers.forEach((w, wIdx) => {
          const wKey = w.id || wIdx;
          const prevInterp = walkerInterpRef.current.get(wKey) || { r: w.r, c: w.c };
          const nextR = prevInterp.r + (w.r - prevInterp.r) * 0.08;
          const nextC = prevInterp.c + (w.c - prevInterp.c) * 0.08;
          walkerInterpRef.current.set(wKey, { r: nextR, c: nextC });

          const { x: cx, y: cy } = getTileCenter(nextR, nextC);
          const bounce = Math.abs(Math.sin(simTick * 4.5 + wIdx)) * 3;
          const charY = cy - bounce;

          // 발밑 그림자
          walkerGfx.ellipse(cx, cy + 2, 6.5, 3.2);
          walkerGfx.fill({ color: 0x241409, alpha: 0.32 });

          if (w.type === 'jesus') {
            // 예수님 후광 & 세마포 옷
            walkerGfx.circle(cx, charY - 20, 9.5);
            walkerGfx.fill({ color: 0xFBBF24, alpha: 0.85 });
            walkerGfx.circle(cx, charY - 18, 5.5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 4, charY - 12, 8, 13);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.stroke({ width: 1.4, color: 0x361F12 });

            walkerGfx.rect(cx - 1.5, charY - 12, 3, 13);
            walkerGfx.fill(0xEF4444);
          } else if (w.type === 'disciple') {
            // 제자 / 물동이 배급원
            walkerGfx.circle(cx, charY - 16, 5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 3.5, charY - 11, 7, 11);
            walkerGfx.fill(0x0284C7);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            // 지팡이
            walkerGfx.moveTo(cx + 5, charY - 18);
            walkerGfx.lineTo(cx + 5, charY + 1);
            walkerGfx.stroke({ width: 1.5, color: 0x78350F });
          } else {
            // 무역 낙타/나귀 상단
            walkerGfx.rect(cx - 5, charY - 8, 11, 7);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx + 6, charY - 9, 4);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx - 1, charY - 10, 3.5);
            walkerGfx.fill(0xF59E0B);
            walkerGfx.stroke({ width: 1, color: 0x361F12 });
          }
        });
      });
    });

    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing touch-none">
      {/* 하단 좌측 현재 오버레이 모드 상태 배지 */}
      <div className="absolute bottom-3 left-3 bg-[#2A1B12]/90 text-amber-200 text-[10.5px] font-black px-3 py-1.5 rounded-full pointer-events-none z-10 backdrop-blur-md border border-amber-500/40 shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          {overlayMode === 'normal' && '🏛️ 디오라마 표준 뷰 (보행자 클릭 시 대화 가능)'}
          {overlayMode === 'water' && '💧 수자원 공급망 오버레이 (파란 원 안의 주택 진화)'}
          {overlayMode === 'food' && '🍞 식량·장터 보급망 오버레이 (초록 원 안의 주택 진화)'}
          {overlayMode === 'faith' && '🕊️ 성전·회당 교화망 오버레이 (보라 원 안의 신앙 공급)'}
          {overlayMode === 'prosperity' && '👑 주택 등급 및 번영도 오버레이'}
        </span>
      </div>
    </div>
  );
}
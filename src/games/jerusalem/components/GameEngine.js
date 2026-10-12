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
  // 1x1 타일 (W: 84px)
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

  // 2x1 타일
  gate: { w: 168, h: 130, anchorX: 0.5, anchorY: 120 / 130 },

  // 2x2 타일 (W: 168px)
  golgotha: { w: 168, h: 160, anchorX: 0.5, anchorY: 148 / 160 },
  synagogue: { w: 168, h: 156, anchorX: 0.5, anchorY: 146 / 156 },
  bread_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  fish_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  wheat_farm: { w: 168, h: 160, anchorX: 0.5, anchorY: 146 / 160 },
  fountain: { w: 168, h: 126, anchorX: 0.5, anchorY: 116 / 126 },
  vineyard: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  olive_grove: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  fishery: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },

  // 3x3 타일 (W: 252px)
  temple: { w: 252, h: 230, anchorX: 0.5, anchorY: 215 / 230 },

  // 별칭 매핑
  caravan: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  sacrifice_market: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  money_changer: { w: 168, h: 150, anchorX: 0.5, anchorY: 138 / 150 },
  beatitudes: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  gethsemane: { w: 168, h: 136, anchorX: 0.5, anchorY: 126 / 136 },
  granary: { w: 168, h: 160, anchorX: 0.5, anchorY: 146 / 160 }
};

// 🏛️ 고속 텍스처 캐시
const textureCache = new Map();
const pendingLoads = new Set();

/**
 * ⚡ public/assets/buildings/ 폴더에서 실제 SVG 파일을 비동기 안전 로드
 */
const getBuildingTexture = (assetKey) => {
  if (textureCache.has(assetKey)) return textureCache.get(assetKey);

  if (!pendingLoads.has(assetKey)) {
    pendingLoads.add(assetKey);
    const img = new Image();
    img.src = `/assets/buildings/${assetKey}.svg?v=${Date.now()}`; // 브라우저 캐시 무효화
    img.onload = () => {
      try {
        const tex = PIXI.Texture.from(img);
        textureCache.set(assetKey, tex);
      } catch (_) {}
    };
  }

  return null;
};

export default function GameEngine() {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const viewportRef = useRef(null);

  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const stateRef = useRef({ grid, walkers, selectedTool });
  stateRef.current = { grid, walkers, selectedTool };

  // 타일 중심 화면 좌표 변환
  const getTileCenter = (r, c) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y
  });

  // 다중 타일 바닥 꼭짓점 좌표 계산
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

  // 마우스 월드 좌표 -> 타일 그리드 인덱스 역산
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

    // 🚀 마운트 시 28개 에셋 백그라운드 사전 로딩
    Object.keys(BUILDING_METRICS).forEach(key => getBuildingTexture(key));

    const app = new PIXI.Application();
    let viewport = null;

    app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0xEDE2CE,
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
        .clampZoom({ minScale: 0.5, maxScale: 2.4 });

      viewport.moveCenter(0, 100);

      const groundGfx = new PIXI.Graphics();
      const castShadowGfx = new PIXI.Graphics();
      const previewGfx = new PIXI.Graphics();
      const bldgContainer = new PIXI.Container();
      const fxGfx = new PIXI.Graphics();
      const walkerGfx = new PIXI.Graphics();

      viewport.addChild(groundGfx);
      viewport.addChild(castShadowGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(bldgContainer);
      viewport.addChild(fxGfx);
      viewport.addChild(walkerGfx);

      let hoverTile = null;

      viewport.on('pointermove', (e) => {
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const tile = worldToTile(worldPos.x, worldPos.y);
        if (tile.r >= 0 && tile.r < MAP_SIZE && tile.c >= 0 && tile.c < MAP_SIZE) {
          hoverTile = tile;
        } else {
          hoverTile = null;
        }
      });

      let touchStartTime = 0;
      let touchStartPos = { x: 0, y: 0 };

      viewport.on('pointerdown', (e) => {
        touchStartTime = Date.now();
        touchStartPos = { x: e.global.x, y: e.global.y };
      });

      viewport.on('pointerup', (e) => {
        const elapsed = Date.now() - touchStartTime;
        const dist = Math.hypot(e.global.x - touchStartPos.x, e.global.y - touchStartPos.y);

        if (elapsed < 350 && dist < 8 && hoverTile) {
          const { r, c } = hoverTile;
          const { grid: curGrid, selectedTool: curTool } = stateRef.current;
          const clicked = curGrid[r]?.[c];

          if (curTool === 'inspect') {
            if (clicked) {
              const rootR = clicked.isRoot ? r : clicked.rootR;
              const rootC = clicked.isRoot ? c : clicked.rootC;
              setInspectedTile(curGrid[rootR]?.[rootC]);
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
      });

      let simTick = 0;

      // ── 🔄 메인 렌더링 루프 ──
      app.ticker.add((time) => {
        simTick += time.deltaTime * 0.05;
        const { grid: curGrid, walkers: curWalkers, selectedTool: curTool } = stateRef.current;

        // [1] 바닥 타일 & 도로
        groundGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const { x: cx, y: cy } = getTileCenter(r, c);
            const cell = curGrid[r]?.[c];
            const isHov = hoverTile && hoverTile.r === r && hoverTile.c === c;

            groundGfx.poly([
              cx, cy - TILE_H / 2,
              cx + TILE_W / 2, cy,
              cx, cy + TILE_H / 2,
              cx - TILE_W / 2, cy
            ]);
            groundGfx.fill(cell?.type === 'road' ? 0xD6C1A0 : isHov ? 0xFDE68A : 0xF3E7CF);
            groundGfx.stroke({ width: 1.2, color: isHov ? 0xF59E0B : 0xE0CFB4 });

            if (cell?.type === 'road') {
              groundGfx.ellipse(cx - 10, cy - 3, 7, 3.5);
              groundGfx.fill(0xECE0CD);
              groundGfx.stroke({ width: 0.8, color: 0x6E4C32 });
              groundGfx.ellipse(cx + 8, cy - 2, 8, 4);
              groundGfx.fill(0xB59D7B);
              groundGfx.stroke({ width: 0.8, color: 0x6E4C32 });
            }
          }
        }

        // [2] 건설 가이드 프리뷰
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

        // [3] 부드러운 사선 투영 그림자
        castShadowGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (!cell || !cell.isRoot || cell.type === 'road') continue;

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
            castShadowGfx.fill({ color: 0x382215, alpha: 0.22 });
          }
        }

        // [4] 🌟 실제 고화질 SVG 파일 렌더링 (하드코딩 제거 완료)
        bldgContainer.removeChildren();

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
            bldgContainer.addChild(spr);
          }
        });

        // [5] 성전 번제단 피어오르는 연기 파티클
        fxGfx.clear();
        const templeCell = curGrid.flat().find(c => c?.type === 'temple' && c.isRoot);
        if (templeCell) {
          const tBase = getMultiTileBase(templeCell.r || 4, templeCell.c || 4, 3, 3);
          const altarX = tBase.S.x + 22;
          const altarY = tBase.S.y - 25;

          for (let i = 1; i <= 5; i++) {
            const progress = (simTick * 0.4 + i * 0.2) % 1;
            const py = altarY - progress * 65;
            const px = altarX + Math.sin(simTick + i) * (progress * 15);
            const pRadius = 4 + progress * 8.5;

            fxGfx.circle(px, py, pRadius);
            fxGfx.fill({ color: 0xFFFFFF, alpha: 0.75 - progress * 0.55 });
            fxGfx.stroke({ width: 1, color: 0x361F12, alpha: 0.35 - progress * 0.25 });
          }
        }

        // [6] 깡총깡총 걷는 순례자 & 일꾼
        walkerGfx.clear();
        curWalkers.forEach((w, wIdx) => {
          const { x: cx, y: cy } = getTileCenter(w.r, w.c);
          const bounce = Math.abs(Math.sin(simTick * 4 + wIdx)) * 3;
          const charY = cy - bounce;

          walkerGfx.ellipse(cx, cy + 2, 6, 3);
          walkerGfx.fill({ color: 0x361F12, alpha: 0.28 });

          if (w.type === 'jesus') {
            walkerGfx.circle(cx, charY - 20, 9);
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
            walkerGfx.circle(cx, charY - 16, 5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 3.5, charY - 11, 7, 11);
            walkerGfx.fill(0x0284C7);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.poly([cx + 5, charY - 18, cx + 5, charY + 1]);
            walkerGfx.stroke({ width: 1.4, color: 0x78350F });
          } else {
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
      <div className="absolute top-2 left-2 bg-stone-900/80 text-amber-300 text-[10.5px] font-black px-3 py-1.5 rounded-full pointer-events-none z-10 backdrop-blur-xs border border-amber-400/30 shadow-lg">
        🏛️ 예루살렘 타이쿤 (고대 정밀 디오라마 렌더러 가동 중)
      </div>
    </div>
  );
}
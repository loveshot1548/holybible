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

export default function GameEngine() {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const viewportRef = useRef(null);

  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const stateRef = useRef({ grid, walkers, selectedTool });
  stateRef.current = { grid, walkers, selectedTool };

  // 타일 중심 좌표
  const getTileCenter = (r, c) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y
  });

  // 멀티타일 바닥 4꼭짓점 (N, E, S, W)
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

  // 0.0001px 타일 역행렬 변환
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

    const app = new PIXI.Application();
    let viewport = null;

    app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0xE2D4BE,
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
        .clampZoom({ minScale: 0.45, maxScale: 2.2 });

      viewport.moveCenter(0, 100);

      // 영구 버퍼 재사용 레이어 (메모리 누수 0)
      const groundGfx = new PIXI.Graphics();
      const previewGfx = new PIXI.Graphics();
      const shadowGfx = new PIXI.Graphics();
      const bldgGfx = new PIXI.Graphics();
      const fxGfx = new PIXI.Graphics();
      const walkerGfx = new PIXI.Graphics();

      viewport.addChild(groundGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(shadowGfx);
      viewport.addChild(bldgGfx);
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

      // =====================================================================
      // 🌿 생활감 & 비대칭 디테일 서브루틴 (A안 전용)
      // =====================================================================

      // 1. 소품: 테라코타 항아리 (Amphora)
      const drawAmphora = (gfx, x, y, size = 3) => {
        gfx.ellipse(x, y - size, size, size * 1.5);
        gfx.fill(0xB45309);
        gfx.stroke({ width: 0.5, color: 0x78350F });
        gfx.ellipse(x, y - size * 2.2, size * 0.7, size * 0.4);
        gfx.fill(0xD97706);
      };

      // 2. 소품: 나무 궤짝 (Wooden Crate)
      const drawCrate = (gfx, x, y, w = 6, h = 6) => {
        gfx.rect(x - w / 2, y - h, w, h);
        gfx.fill(0x78350F);
        gfx.stroke({ width: 0.6, color: 0x451A03 });
        gfx.poly([x - w / 2, y - h, x + w / 2, y]);
        gfx.stroke({ width: 0.4, color: 0x3E1C03 });
      };

      // 3. 소품: 올리브/야자 관목 (Vegetation Clump)
      const drawFoliageBush = (gfx, x, y, radius = 6) => {
        gfx.circle(x - 2, y - radius, radius * 0.8);
        gfx.fill(0x4D7C0F);
        gfx.circle(x + 2, y - radius * 1.1, radius * 0.9);
        gfx.fill(0x65A30D);
        gfx.circle(x, y - radius * 0.7, radius * 0.7);
        gfx.fill(0x365314);
      };

      // 4. 벽면을 타고 오르는 포도 덩굴 (Creeping Grapevine)
      const drawCreepingVine = (gfx, x1, y1, height) => {
        gfx.poly([x1, y1, x1 + 3, y1 - height * 0.3, x1 - 2, y1 - height * 0.6, x1 + 2, y1 - height * 0.9]);
        gfx.stroke({ width: 1.2, color: 0x3F6212 });
        // 잎사귀 점들
        gfx.circle(x1 + 3, y1 - height * 0.3, 2);
        gfx.fill(0x65A30D);
        gfx.circle(x1 - 2, y1 - height * 0.6, 2.2);
        gfx.fill(0x4D7C0F);
        gfx.circle(x1 + 2, y1 - height * 0.9, 1.8);
        gfx.fill(0x65A30D);
      };

      // 5. 외벽 석조 돌계단 (External Stone Staircase)
      const drawExternalStairs = (gfx, base, wallH, steps = 5) => {
        const startX = base.W.x;
        const startY = base.W.y;
        const endX = base.S.x - 6;
        const endY = base.S.y - 3;

        for (let i = 0; i < steps; i++) {
          const r = i / steps;
          const stepX = startX + (endX - startX) * r;
          const stepY = startY + (endY - startY) * r;
          const stepH = (wallH * 0.85) * r;

          gfx.poly([
            stepX - 4, stepY - stepH,
            stepX, stepY - stepH - 2,
            stepX + 4, stepY - stepH,
            stepX, stepY - stepH + 2
          ]);
          gfx.fill(0xD1BE9F);
          gfx.stroke({ width: 0.6, color: 0x78654B });

          gfx.poly([
            stepX - 4, stepY - stepH,
            stepX, stepY - stepH + 2,
            stepX, stepY,
            stepX - 4, stepY
          ]);
          gfx.fill(0xB8A484);
        }
      };

      // 6. 석조 벽체 빌더 (줄눈, 아치문, 창문 슬릿, 덩굴 포함)
      const drawMasonryWalls = (gfx, base, height, opt = {}) => {
        const {
          sunColor = 0xFAF2E6,
          shadeColor = 0xC9B69C,
          lineColor = 0x8C7860,
          courses = 4,
          door = true,
          doorSide = 'left',
          hasVine = true,
          windowSlit = true
        } = opt;

        const S_top = { x: base.S.x, y: base.S.y - height };
        const W_top = { x: base.W.x, y: base.W.y - height };
        const E_top = { x: base.E.x, y: base.E.y - height };

        // 좌벽 (Sunlit)
        gfx.poly([base.W.x, base.W.y, base.S.x, base.S.y, S_top.x, S_top.y, W_top.x, W_top.y]);
        gfx.fill(sunColor);
        gfx.stroke({ width: 0.8, color: lineColor });

        // 우벽 (Shaded)
        gfx.poly([base.S.x, base.S.y, base.E.x, base.E.y, E_top.x, E_top.y, S_top.x, S_top.y]);
        gfx.fill(shadeColor);
        gfx.stroke({ width: 0.8, color: lineColor });

        // 엇갈린 벽돌 줄눈
        for (let i = 1; i < courses; i++) {
          const ratio = i / courses;
          const ly1 = base.W.y - height * ratio;
          const ly2 = base.S.y - height * ratio;
          gfx.poly([base.W.x, ly1, base.S.x, ly2]);
          gfx.stroke({ width: 0.6, color: lineColor });

          const cuts = 3;
          for (let j = 1; j < cuts; j++) {
            const cr = (j + (i % 2 === 0 ? 0.5 : 0)) / cuts;
            if (cr > 0.15 && cr < 0.85) {
              const cx = base.W.x + (base.S.x - base.W.x) * cr;
              const cy = ly1 + (ly2 - ly1) * cr;
              gfx.poly([cx, cy, cx, cy - height / courses]);
              gfx.stroke({ width: 0.5, color: lineColor });
            }
          }

          const ry1 = base.S.y - height * ratio;
          const ry2 = base.E.y - height * ratio;
          gfx.poly([base.S.x, ry1, base.E.x, ry2]);
          gfx.stroke({ width: 0.6, color: lineColor });
        }

        // 통나무 서까래 (Vigas)
        const vigasCount = 4;
        for (let i = 0; i < vigasCount; i++) {
          const vr = (i + 0.5) / vigasCount;
          const vx = base.W.x + (base.S.x - base.W.x) * vr;
          const vy = W_top.y + (S_top.y - W_top.y) * vr + 4;
          gfx.circle(vx, vy, 1.8);
          gfx.fill(0x5C381E);
          gfx.stroke({ width: 0.5, color: 0x3B1C0B });
        }

        // 아치형 출입문
        if (door) {
          const dw = 10;
          const dh = 15;
          const dx = doorSide === 'left' ? (base.W.x + base.S.x) / 2 : (base.S.x + base.E.x) / 2;
          const dy = doorSide === 'left' ? (base.W.y + base.S.y) / 2 : (base.S.y + base.E.y) / 2;

          gfx.rect(dx - dw / 2, dy - dh, dw, dh);
          gfx.fill(0x3B1C0B);
          gfx.stroke({ width: 1.2, color: 0x785A3C });
          gfx.ellipse(dx, dy - dh, dw / 2, 4);
          gfx.fill(0x3B1C0B);

          // 출입문 옆 세워둔 항아리
          drawAmphora(gfx, dx + dw / 2 + 3, dy - 1, 2.5);
        }

        // 상부 창문 슬릿 (깊이감 부여)
        if (windowSlit && height > 28) {
          const wx = base.W.x + (base.S.x - base.W.x) * 0.75;
          const wy = W_top.y + (S_top.y - W_top.y) * 0.75 + 10;
          gfx.rect(wx - 2, wy - 5, 4, 7);
          gfx.fill(0x2A180E);
          gfx.stroke({ width: 0.6, color: 0x785A3C });
        }

        // 벽면 덩굴
        if (hasVine) {
          drawCreepingVine(gfx, base.W.x + 8, base.W.y - 2, height * 0.7);
        }
      };

      // 7. 옥상 난간 테라스 + 마가의 다락방 부스 + 그늘막
      const drawLivedInRooftop = (gfx, base, wallH, opt = {}) => {
        const { hasAttic = false, hasPergola = true } = opt;
        const N_top = { x: base.N.x, y: base.N.y - wallH };
        const E_top = { x: base.E.x, y: base.E.y - wallH };
        const S_top = { x: base.S.x, y: base.S.y - wallH };
        const W_top = { x: base.W.x, y: base.W.y - wallH };

        // 옥상 바닥
        gfx.poly([N_top.x, N_top.y, E_top.x, E_top.y, S_top.x, S_top.y, W_top.x, W_top.y]);
        gfx.fill(0xD9C6AA);
        gfx.stroke({ width: 0.8, color: 0x8C7456 });

        // 둘레 흉벽 난간
        const parapetH = 5;
        gfx.poly([W_top.x, W_top.y, S_top.x, S_top.y, S_top.x, S_top.y - parapetH, W_top.x, W_top.y - parapetH]);
        gfx.fill(0xFAF2E6);
        gfx.stroke({ width: 0.6, color: 0x8C7860 });

        gfx.poly([S_top.x, S_top.y, E_top.x, E_top.y, E_top.x, E_top.y - parapetH, S_top.x, S_top.y - parapetH]);
        gfx.fill(0xC9B69C);
        gfx.stroke({ width: 0.6, color: 0x8C7860 });

        // 옥상 디테일: 흙항아리 2개
        drawAmphora(gfx, S_top.x - 7, S_top.y - 6, 2.5);
        drawAmphora(gfx, S_top.x - 12, S_top.y - 4, 2);

        // 옥상 나무 기둥 차양 (Pergola with Fabric)
        if (hasPergola && !hasAttic) {
          const px = W_top.x + 10;
          const py = W_top.y - 2;
          // 4대 나무 기둥
          gfx.poly([px, py, px, py - 12]);
          gfx.stroke({ width: 1.2, color: 0x5C381E });
          gfx.poly([px + 12, py + 5, px + 12, py - 7]);
          gfx.stroke({ width: 1.2, color: 0x5C381E });
          // 스트라이프 차양 천막
          gfx.poly([px - 2, py - 12, px + 14, py - 7, px + 22, py - 11, px + 6, py - 16]);
          gfx.fill(0xD97706);
          gfx.stroke({ width: 0.8, color: 0x78350F });
        }

        // 옥상 상층 부스 (마가의 다락방 - Upper Attic Room)
        if (hasAttic) {
          const atticBase = {
            N: { x: N_top.x + 4, y: N_top.y - 2 },
            E: { x: (N_top.x + E_top.x) / 2 + 2, y: (N_top.y + E_top.y) / 2 - 2 },
            S: { x: (W_top.x + S_top.x) / 2 + 4, y: (W_top.y + S_top.y) / 2 - 2 },
            W: { x: W_top.x + 6, y: W_top.y - 2 }
          };
          drawMasonryWalls(gfx, atticBase, 15, { courses: 2, door: true, hasVine: false, windowSlit: false });
          // 다락방 지붕
          gfx.poly([
            atticBase.W.x, atticBase.W.y - 15,
            atticBase.N.x, atticBase.N.y - 15,
            atticBase.E.x, atticBase.E.y - 15,
            atticBase.S.x, atticBase.S.y - 15
          ]);
          gfx.fill(0x8C6239);
          gfx.stroke({ width: 0.8, color: 0x5C381E });
        }
      };

      // 8. 붉은 테라코타 기와 박공지붕
      const drawTerracottaRoof = (gfx, base, wallH, pitchH = 16) => {
        const apexY = base.N.y - wallH - pitchH;
        const apexX = (base.W.x + base.E.x) / 2;
        const frontRidgeY = base.S.y - wallH - pitchH + 8;
        const frontRidgeX = base.S.x;

        gfx.poly([
          base.W.x - 2, base.W.y - wallH,
          apexX, apexY,
          frontRidgeX, frontRidgeY,
          base.S.x, base.S.y - wallH
        ]);
        gfx.fill(0xC85A32);
        gfx.stroke({ width: 1, color: 0x8C3518 });

        for (let i = 1; i <= 4; i++) {
          const r = i / 5;
          const startX = base.W.x + (base.S.x - base.W.x) * r;
          const startY = base.W.y - wallH + (base.S.y - base.W.y) * r;
          const endX = apexX + (frontRidgeX - apexX) * r;
          const endY = apexY + (frontRidgeY - apexY) * r;
          gfx.poly([startX, startY, endX, endY]);
          gfx.stroke({ width: 0.8, color: 0x8C3518 });
        }

        gfx.poly([
          frontRidgeX, frontRidgeY,
          apexX, apexY,
          base.E.x + 2, base.E.y - wallH,
          base.S.x, base.S.y - wallH
        ]);
        gfx.fill(0xA0401E);
        gfx.stroke({ width: 1, color: 0x70250D });

        gfx.poly([apexX, apexY, frontRidgeX, frontRidgeY]);
        gfx.stroke({ width: 2, color: 0x5C1D08 });
      };

      // 9. 아치형 석조 수로교 (Open Arch Aqueduct)
      const drawRealAqueduct = (gfx, base, height = 24) => {
        const S_top = { x: base.S.x, y: base.S.y - height };
        const W_top = { x: base.W.x, y: base.W.y - height };
        const E_top = { x: base.E.x, y: base.E.y - height };
        const N_top = { x: base.N.x, y: base.N.y - height };

        const pw = 6;
        gfx.rect(base.W.x + 4, base.W.y - height, pw, height);
        gfx.fill(0xFAF2E6);
        gfx.stroke({ width: 0.8, color: 0x8C7860 });

        gfx.rect(base.S.x - 4, base.S.y - height, pw, height);
        gfx.fill(0xC9B69C);
        gfx.stroke({ width: 0.8, color: 0x8C7860 });

        const archCenter = { x: (base.W.x + base.S.x) / 2, y: (base.W.y + base.S.y) / 2 };
        gfx.poly([
          base.W.x + 4 + pw, base.W.y - 2,
          base.W.x + 4 + pw, base.W.y - height + 8,
          archCenter.x, base.W.y - height + 4,
          base.S.x - 4, base.S.y - height + 8,
          base.S.x - 4, base.S.y - 2
        ]);
        gfx.stroke({ width: 1, color: 0x78654B });

        gfx.poly([W_top.x, W_top.y, S_top.x, S_top.y, S_top.x, S_top.y - 6, W_top.x, W_top.y - 6]);
        gfx.fill(0xFAF2E6);
        gfx.stroke({ width: 0.8, color: 0x8C7860 });

        gfx.poly([S_top.x, S_top.y, E_top.x, E_top.y, E_top.x, E_top.y - 6, S_top.x, S_top.y - 6]);
        gfx.fill(0xC9B69C);
        gfx.stroke({ width: 0.8, color: 0x8C7860 });

        gfx.poly([N_top.x, N_top.y - 6, E_top.x, E_top.y - 6, S_top.x, S_top.y - 6, W_top.x, W_top.y - 6]);
        gfx.fill(0x38BDF8);
        gfx.stroke({ width: 0.8, color: 0x0284C7 });
      };

      // 60FPS 메인 렌더 루프
      let smokeAngle = 0;
      let windmillAngle = 0;

      app.ticker.add(() => {
        const { grid: curGrid, walkers: curWalkers, selectedTool: curTool } = stateRef.current;

        // [A] 바닥 레이어
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
            groundGfx.fill(cell?.type === 'road' ? 0xC2B095 : isHov ? 0xFDE68A : 0xE0D0B6);
            groundGfx.stroke({ width: 0.8, color: 0xC7B59A });

            if (cell?.type === 'road') {
              groundGfx.poly([cx - 16, cy - 4, cx - 4, cy - 9, cx + 10, cy - 3, cx - 2, cy + 4]);
              groundGfx.fill(0x9C876E);
              groundGfx.stroke({ width: 0.6, color: 0x7D674B });

              groundGfx.poly([cx - 6, cy + 5, cx + 6, cy + 2, cx + 18, cy + 7, cx + 6, cy + 12]);
              groundGfx.fill(0x8C7459);
              groundGfx.stroke({ width: 0.6, color: 0x6E573B });

              groundGfx.poly([cx - TILE_W / 2 + 6, cy - 2, cx - 2, cy + TILE_H / 2 - 4]);
              groundGfx.stroke({ width: 1.5, color: 0x6E573B });
            }
          }
        }

        // [B] 건설 프리뷰 가이드
        previewGfx.clear();
        if (hoverTile && curTool !== 'demolish' && curTool !== 'inspect') {
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const { r, c } = hoverTile;
            const w = bMeta.w || 1;
            const h = bMeta.h || 1;
            const base = getMultiTileBase(r, c, w, h);

            previewGfx.poly([base.N.x, base.N.y, base.E.x, base.E.y, base.S.x, base.S.y, base.W.x, base.W.y]);
            previewGfx.fill({ color: 0xF59E0B, alpha: 0.38 });
            previewGfx.stroke({ width: 2.5, color: 0xF59E0B });
          }
        }

        // [C] 깊이 정렬된 시저 3 건축물
        shadowGfx.clear();
        bldgGfx.clear();

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
          const center = getTileCenter(r + h / 2 - 0.5, c + w / 2 - 0.5);

          shadowGfx.ellipse(center.x + 8, center.y + 6, (TILE_W / 2) * w * 0.85, (TILE_H / 2) * h * 0.85);
          shadowGfx.fill({ color: 0x5C381E, alpha: 0.28 });

          // ── 헤롯 제2성전 (3x3) ──
          if (type === 'temple') {
            drawMasonryWalls(bldgGfx, base, 16, { sunColor: 0xD1BE9F, shadeColor: 0xB8A484, lineColor: 0x78654B, courses: 2, door: false, hasVine: false });

            const t2Base = getMultiTileBase(r + 0.3, c + 0.3, 2.4, 2.4);
            t2Base.N.y -= 16; t2Base.E.y -= 16; t2Base.S.y -= 16; t2Base.W.y -= 16;
            drawMasonryWalls(bldgGfx, t2Base, 22, { sunColor: 0xFAF2E6, shadeColor: 0xC9B69C, courses: 3, door: false, hasVine: false });

            const t3Base = getMultiTileBase(r + 0.7, c + 0.7, 1.6, 1.6);
            t3Base.N.y -= 38; t3Base.E.y -= 38; t3Base.S.y -= 38; t3Base.W.y -= 38;
            drawMasonryWalls(bldgGfx, t3Base, 65, { sunColor: 0xFFFFFF, shadeColor: 0xCBD5E1, courses: 5, door: true, doorSide: 'left', hasVine: false });

            bldgGfx.poly([t3Base.W.x - 2, t3Base.W.y - 65, t3Base.S.x, t3Base.S.y - 65, t3Base.S.x, t3Base.S.y - 74, t3Base.W.x - 2, t3Base.W.y - 74]);
            bldgGfx.fill(0xF59E0B);
            bldgGfx.stroke({ width: 1, color: 0xD97706 });

            bldgGfx.poly([t3Base.S.x, t3Base.S.y - 65, t3Base.E.x + 2, t3Base.E.y - 65, t3Base.E.x + 2, t3Base.E.y - 74, t3Base.S.x, t3Base.S.y - 74]);
            bldgGfx.fill(0xD97706);

            for (let i = 0; i < 6; i++) {
              const ratio = (i + 0.5) / 6;
              const px = t2Base.W.x + (t2Base.S.x - t2Base.W.x) * ratio;
              const py = t2Base.W.y + (t2Base.S.y - t2Base.W.y) * ratio;
              bldgGfx.rect(px - 2.5, py - 36, 5, 36);
              bldgGfx.fill(0xFFFFFF);
              bldgGfx.stroke({ width: 0.8, color: 0x94A3B8 });
              bldgGfx.rect(px - 3.5, py - 37, 7, 3);
              bldgGfx.fill(0xF59E0B);
            }

            const altarX = t2Base.S.x + 10;
            const altarY = t2Base.S.y + 4;
            bldgGfx.rect(altarX - 8, altarY - 14, 16, 12);
            bldgGfx.fill(0x5C381E);
            bldgGfx.circle(altarX, altarY - 14, 4);
            bldgGfx.fill(0xEF4444);
            return;
          }

          // ── 골고다 언덕 (2x2) ──
          if (type === 'golgotha') {
            const H = 38;
            drawMasonryWalls(bldgGfx, base, H, { sunColor: 0x57534E, shadeColor: 0x292524, lineColor: 0x1C1917, courses: 4, door: false, hasVine: false });
            bldgGfx.poly([base.W.x + 8, base.W.y - 14, base.S.x - 8, base.S.y - 12]);
            bldgGfx.stroke({ width: 1.8, color: 0x1C1917 });

            const topC = { x: (base.N.x + base.S.x) / 2, y: (base.N.y + base.S.y) / 2 - H };
            bldgGfx.rect(topC.x - 2.5, topC.y - 38, 5, 40);
            bldgGfx.fill(0x78350F);
            bldgGfx.rect(topC.x - 14, topC.y - 32, 28, 4.5);
            bldgGfx.fill(0x78350F);
            bldgGfx.stroke({ width: 0.8, color: 0x2D1302 });
            bldgGfx.rect(topC.x - 3.5, topC.y - 36, 7, 3);
            bldgGfx.fill(0xF5EBE0);

            bldgGfx.rect(topC.x - 22, topC.y - 24, 3.5, 26);
            bldgGfx.fill(0x5C381E);
            bldgGfx.rect(topC.x - 30, topC.y - 20, 16, 3.5);
            bldgGfx.fill(0x5C381E);

            bldgGfx.rect(topC.x + 18, topC.y - 24, 3.5, 26);
            bldgGfx.fill(0x5C381E);
            bldgGfx.rect(topC.x + 14, topC.y - 20, 16, 3.5);
            bldgGfx.fill(0x5C381E);
            return;
          }

          // ── 가버나움 백색 회당 (2x2) ──
          if (type === 'synagogue') {
            const H = 54;
            drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xFFFFFF, shadeColor: 0xCBD5E1, lineColor: 0x64748B, courses: 4, door: true, hasVine: false });

            const topP = { x: base.S.x, y: base.S.y - H };
            bldgGfx.poly([base.W.x, base.W.y - H, topP.x, topP.y - 18, base.S.x, base.S.y - H]);
            bldgGfx.fill(0xF1F5F9);
            bldgGfx.stroke({ width: 1.2, color: 0x64748B });

            for (let i = 0; i < 4; i++) {
              const ratio = (i + 0.5) / 4;
              const colX = base.W.x + (base.S.x - base.W.x) * ratio;
              const colY = base.W.y + (base.S.y - base.W.y) * ratio;
              bldgGfx.rect(colX - 2.5, colY - H + 8, 5, H - 12);
              bldgGfx.fill(0xF8FAFC);
              bldgGfx.stroke({ width: 0.8, color: 0x94A3B8 });
            }

            // 회당 앞 올리브 나무 한 그루
            drawFoliageBush(bldgGfx, base.W.x - 4, base.W.y + 2, 8);
            return;
          }

          // ── 갈릴리 밀밭 & 풍차 (2x2) ──
          if (type === 'wheat_farm') {
            for (let i = 0; i < 5; i++) {
              const r = (i + 1) / 6;
              const x1 = base.W.x + (base.N.x - base.W.x) * r;
              const y1 = base.W.y + (base.N.y - base.W.y) * r;
              const x2 = base.S.x + (base.E.x - base.S.x) * r;
              const y2 = base.S.y + (base.E.y - base.S.y) * r;
              bldgGfx.poly([x1, y1, x2, y2]);
              bldgGfx.stroke({ width: 2.5, color: 0xEAB308 });
            }

            const millBase = getMultiTileBase(r + 0.4, c + 0.4, 1.2, 1.2);
            drawMasonryWalls(bldgGfx, millBase, 34, { sunColor: 0xE5D8C5, shadeColor: 0xC7B59A, courses: 3, door: true, hasVine: false });

            const mTop = { x: (millBase.W.x + millBase.E.x) / 2, y: (millBase.W.y + millBase.E.y) / 2 - 34 };
            bldgGfx.poly([millBase.W.x, millBase.W.y - 34, mTop.x, mTop.y - 14, millBase.E.x, millBase.E.y - 34, millBase.S.x, millBase.S.y - 34]);
            bldgGfx.fill(0xA16207);
            bldgGfx.stroke({ width: 1, color: 0x78350F });

            // 방앗간 옆 곡물 포대와 나무 상자
            drawCrate(bldgGfx, millBase.S.x - 12, millBase.S.y - 2, 7, 7);
            drawCrate(bldgGfx, millBase.S.x - 6, millBase.S.y - 2, 6, 6);

            windmillAngle += 0.04;
            const hubX = mTop.x;
            const hubY = mTop.y - 4;
            const armLen = 22;
            for (let i = 0; i < 4; i++) {
              const ang = windmillAngle + (i * Math.PI) / 2;
              const ex = hubX + Math.cos(ang) * armLen;
              const ey = hubY + Math.sin(ang) * armLen;
              bldgGfx.poly([hubX, hubY, ex, ey]);
              bldgGfx.stroke({ width: 1.8, color: 0x5C381E });
              bldgGfx.circle(ex, ey, 2.5);
              bldgGfx.fill(0xF8FAFC);
            }
            return;
          }

          // ── 갈릴리 어선 선착장 (2x2) ──
          if (type === 'fishery') {
            drawMasonryWalls(bldgGfx, base, 8, { sunColor: 0x854D0E, shadeColor: 0x713F12, lineColor: 0x451A03, courses: 1, door: false, hasVine: false });

            const boatX = base.S.x + 8;
            const boatY = base.S.y - 6;
            bldgGfx.ellipse(boatX, boatY, 16, 8);
            bldgGfx.fill(0x78350F);
            bldgGfx.stroke({ width: 1.2, color: 0x3E1C03 });

            bldgGfx.poly([boatX, boatY, boatX, boatY - 26]);
            bldgGfx.stroke({ width: 2, color: 0x3E1C03 });
            bldgGfx.poly([boatX, boatY - 24, boatX + 12, boatY - 14, boatX, boatY - 10]);
            bldgGfx.fill(0xF8FAFC);
            bldgGfx.stroke({ width: 0.6, color: 0xCBD5E1 });

            // 어구 상자와 어망
            drawCrate(bldgGfx, base.W.x + 10, base.W.y - 4, 6, 6);
            return;
          }

          // ── 시장 복합체 (2x2 차양 & 가판대) ──
          if (['bread_market', 'fish_market', 'sacrifice_market'].includes(type)) {
            const H = 28;
            drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xFAF2E6, shadeColor: 0xC9B69C, courses: 2, door: true, hasVine: false });

            const N_top = { x: base.N.x, y: base.N.y - H - 10 };
            const E_top = { x: base.E.x, y: base.E.y - H - 10 };
            const S_top = { x: base.S.x, y: base.S.y - H };
            const W_top = { x: base.W.x, y: base.W.y - H };

            bldgGfx.poly([W_top.x, W_top.y, N_top.x, N_top.y, E_top.x, E_top.y, S_top.x, S_top.y]);
            bldgGfx.fill(type === 'bread_market' ? 0xD97706 : 0x0284C7);
            bldgGfx.stroke({ width: 1, color: 0x3B1C0B });

            for (let i = 1; i <= 3; i++) {
              const r = i / 4;
              const x1 = W_top.x + (S_top.x - W_top.x) * r;
              const y1 = W_top.y + (S_top.y - W_top.y) * r;
              const x2 = N_top.x + (E_top.x - N_top.x) * r;
              const y2 = N_top.y + (E_top.y - N_top.y) * r;
              bldgGfx.poly([x1, y1, x2, y2]);
              bldgGfx.stroke({ width: 3, color: 0xF8FAFC });
            }

            // 가판대 상품 바구니
            drawCrate(bldgGfx, base.S.x + 6, base.S.y - 2, 7, 6);
            drawAmphora(bldgGfx, base.S.x + 14, base.S.y - 2, 3);
            return;
          }

          // ── 5단계 주택 진화 (1x1 Caesar III - 생활감 극대화) ──
          if (type === 'house') {
            const H = 16 + level * 10;

            // Lv.1 텐트: 모닥불, 말뚝, 널브러진 짐
            if (level === 1) {
              const apex = { x: (base.N.x + base.S.x) / 2, y: (base.N.y + base.S.y) / 2 - H };
              bldgGfx.poly([base.W.x, base.W.y, apex.x, apex.y, base.S.x, base.S.y]);
              bldgGfx.fill(0x5C4033);
              bldgGfx.stroke({ width: 1, color: 0x2D1E12 });

              bldgGfx.poly([base.S.x, base.S.y, apex.x, apex.y, base.E.x, base.E.y]);
              bldgGfx.fill(0x3E2723);
              bldgGfx.stroke({ width: 1, color: 0x2D1E12 });

              bldgGfx.poly([apex.x, apex.y, base.S.x, base.S.y + 4]);
              bldgGfx.stroke({ width: 1.5, color: 0x2D1E12 });
              bldgGfx.circle(base.S.x - 8, base.S.y + 2, 3);
              bldgGfx.fill(0xEF4444);

              drawAmphora(bldgGfx, base.S.x + 6, base.S.y + 1, 2.5);
              return;
            }

            // Lv.2 흙벽돌집: 옥상 차양막 + 모퉁이 작은 관목
            if (level === 2) {
              drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xD4A373, shadeColor: 0xA45A17, courses: 3, door: true, hasVine: false });
              drawLivedInRooftop(bldgGfx, base, H, { hasAttic: false, hasPergola: true });
              drawFoliageBush(bldgGfx, base.W.x - 3, base.W.y + 1, 5);
              return;
            }

            // Lv.3 석회암 평지붕 가옥: 🌟 [외벽 돌계단 + 옥상 다락방 + 덩굴]
            if (level === 3) {
              drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xFAF2E6, shadeColor: 0xC9B69C, courses: 4, door: true, hasVine: true });
              drawExternalStairs(bldgGfx, base, H, 5);
              drawLivedInRooftop(bldgGfx, base, H, { hasAttic: true, hasPergola: false });
              drawFoliageBush(bldgGfx, base.E.x + 3, base.E.y + 1, 6);
              return;
            }

            // Lv.4 2층 테라스 저택: 외벽 계단 + 테라코타 기와 + 창문 + 올리브 나무
            if (level === 4) {
              drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xFAF2E6, shadeColor: 0xC9B69C, courses: 5, door: true, hasVine: true });
              drawTerracottaRoof(bldgGfx, base, H, 14);
              drawExternalStairs(bldgGfx, base, H * 0.7, 4);
              drawFoliageBush(bldgGfx, base.W.x - 4, base.W.y + 2, 7);
              drawAmphora(bldgGfx, base.S.x + 10, base.S.y - 2, 3);
              return;
            }

            // Lv.5 대리석 궁정: 순백 대리석 기둥 + 호화 테라코타 + 좌우 정원수
            if (level === 5) {
              drawMasonryWalls(bldgGfx, base, H, { sunColor: 0xFFFFFF, shadeColor: 0xE2E8F0, lineColor: 0x94A3B8, courses: 5, door: true, hasVine: false });
              drawTerracottaRoof(bldgGfx, base, H, 18);
              bldgGfx.rect(base.W.x + 4, base.W.y - H + 6, 4, H - 8);
              bldgGfx.fill(0xFFFFFF);
              bldgGfx.rect(base.S.x - 6, base.S.y - H + 6, 4, H - 8);
              bldgGfx.fill(0xFFFFFF);
              drawFoliageBush(bldgGfx, base.W.x - 5, base.W.y + 1, 8);
              drawFoliageBush(bldgGfx, base.E.x + 5, base.E.y + 1, 8);
              return;
            }
          }

          // ── 실로암 수로 (1x1 뚫린 아치) ──
          if (type === 'aqueduct') {
            drawRealAqueduct(bldgGfx, base, 22);
            return;
          }

          // ── 야곱의 우물 (1x1 도르래와 목조 버킷) ──
          if (type === 'well') {
            bldgGfx.circle(center.x, center.y - 4, 11);
            bldgGfx.fill(0x78716C);
            bldgGfx.stroke({ width: 1.2, color: 0x292524 });
            bldgGfx.circle(center.x, center.y - 4, 7);
            bldgGfx.fill(0x0284C7);

            bldgGfx.poly([center.x - 8, center.y - 4, center.x, center.y - 22, center.x + 8, center.y - 4]);
            bldgGfx.stroke({ width: 2, color: 0x78350F });
            bldgGfx.rect(center.x - 3, center.y - 14, 6, 5);
            bldgGfx.fill(0x5C381E);
            drawAmphora(bldgGfx, center.x + 11, center.y - 2, 3);
            return;
          }

          // 기본 성벽
          drawMasonryWalls(bldgGfx, base, 28, { sunColor: 0x94A3B8, shadeColor: 0x64748B, lineColor: 0x334155, courses: 3, door: false, hasVine: false });
          drawLivedInRooftop(bldgGfx, base, 28, { hasAttic: false, hasPergola: false });
        });

        // [D] 실시간 파티클 (성전 번제단 연기)
        fxGfx.clear();
        smokeAngle += 0.04;
        const templeCell = curGrid.flat().find(c => c?.type === 'temple' && c.isRoot);
        if (templeCell) {
          const tBase = getMultiTileBase(templeCell.r || 4, templeCell.c || 4, 3, 3);
          const altarX = tBase.S.x + 10;
          const altarY = tBase.S.y - 14;
          for (let i = 1; i <= 5; i++) {
            const py = altarY - i * 15;
            const px = altarX + Math.sin(smokeAngle + i) * 7;
            fxGfx.circle(px, py, 4 + i * 2.2);
            fxGfx.fill({ color: 0xE2D4BE, alpha: 0.5 - i * 0.08 });
          }
        }

        // [E] 도로 위 보행자 (예수님 & 제자 & 나귀)
        walkerGfx.clear();
        curWalkers.forEach(w => {
          const { x: cx, y: cy } = getTileCenter(w.r, w.c);

          if (w.type === 'jesus') {
            walkerGfx.circle(cx, cy - 18, 9);
            walkerGfx.fill({ color: 0xF59E0B, alpha: 0.85 });
            walkerGfx.circle(cx, cy - 18, 5.5);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.rect(cx - 3.5, cy - 12, 7, 14);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.rect(cx - 1.5, cy - 12, 3, 14);
            walkerGfx.fill(0xDC2626);
            walkerGfx.poly([cx + 5, cy - 20, cx + 5, cy + 3]);
            walkerGfx.stroke({ width: 1.5, color: 0x78350F });
          } else if (w.type === 'disciple') {
            walkerGfx.circle(cx - 8, cy - 12, 4.5);
            walkerGfx.fill(0x0284C7);
            walkerGfx.rect(cx - 11, cy - 7, 6, 11);
            walkerGfx.fill(0x0284C7);
          } else {
            walkerGfx.rect(cx + 2, cy - 7, 11, 7);
            walkerGfx.fill(0x8D6E63);
            walkerGfx.rect(cx + 11, cy - 12, 4, 7);
            walkerGfx.fill(0x8D6E63);
            walkerGfx.poly([cx + 12, cy - 16, cx + 11, cy - 12, cx + 13, cy - 12]);
            walkerGfx.fill(0x5D4037);
            walkerGfx.rect(cx + 3, cy, 2, 5);
            walkerGfx.rect(cx + 10, cy, 2, 5);
            walkerGfx.fill(0x5D4037);
            walkerGfx.rect(cx + 4, cy - 9, 7, 5);
            walkerGfx.fill(0xD7CCC8);
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
      <div className="absolute top-2 left-2 bg-black/75 text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none z-10 backdrop-blur-xs">
        💡 PixiJS 2.5D 고대 도시 엔진 (외벽 계단 • 다락방 • 식생 디테일 완비)
      </div>
    </div>
  );
}
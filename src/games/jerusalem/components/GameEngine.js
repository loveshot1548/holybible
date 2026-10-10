// src/games/jerusalem/components/GameEngine.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_W = 80;
const TILE_H = 40;

export default function GameEngine() {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const { grid, walkers, selectedTool, buildAt, demolishAt } = useTycoonStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // PixiJS v8+ 초기화
    const app = new PIXI.Application();
    let viewport = null;

    app.init({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0xE2D4BE,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    }).then(() => {
      if (!containerRef.current) return;
      containerRef.current.appendChild(app.canvas);
      pixiAppRef.current = app;

      // 뷰포트 설정 (드래그 패닝 & 핀치 줌)
      viewport = new Viewport({
        screenWidth: app.canvas.width,
        screenHeight: app.canvas.height,
        worldWidth: MAP_SIZE * TILE_W * 2,
        worldHeight: MAP_SIZE * TILE_H * 2,
        events: app.renderer.events
      });

      app.stage.addChild(viewport);
      viewport.drag().pinch().wheel().decelerate();
      viewport.moveCenter(0, 100);

      // 월드 컨테이너 생성
      const worldContainer = new PIXI.Container();
      viewport.addChild(worldContainer);

      // 60FPS 렌더 루프 (requestAnimationFrame)
      app.ticker.add(() => {
        worldContainer.removeChildren();

        const origX = 0;
        const origY = -200;

        // 1. 바닥 타일 그리기
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const x = (c - r) * (TILE_W / 2) + origX;
            const y = (c + r) * (TILE_H / 2) + origY;

            const tileGfx = new PIXI.Graphics();
            tileGfx.poly([
              x, y - TILE_H / 2,
              x + TILE_W / 2, y,
              x, y + TILE_H / 2,
              x - TILE_W / 2, y
            ]);
            tileGfx.fill(0xE0D0B6);
            tileGfx.stroke({ width: 0.8, color: 0xC7B59A });
            worldContainer.addChild(tileGfx);
          }
        }

        // 2. 건물 스프라이트 렌더링 (Z-Sorting 적용)
        const queue = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = grid[r][c];
            if (cell && cell.isRoot) {
              queue.push({ r, c, cell, depth: r + c + (cell.w || 1) + (cell.h || 1) });
            }
          }
        }
        queue.sort((a, b) => a.depth - b.depth);

        queue.forEach(({ r, c, cell }) => {
          const x = (c - r) * (TILE_W / 2) + origX;
          const y = (c + r) * (TILE_H / 2) + origY;

          const bldgGfx = new PIXI.Graphics();
          // 시저 3 스타일 입체 석조 블록 베이스
          bldgGfx.rect(x - 20, y - 35, 40, 45);
          bldgGfx.fill(cell.type === 'temple' ? 0xF59E0B : 0xFAF2E6);
          bldgGfx.stroke({ width: 1.5, color: 0x78654B });
          worldContainer.addChild(bldgGfx);
        });
      });
    });

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing">
      <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none z-10">
        💡 PixiJS WebGL 하드웨어 가속 렌더러 가동 중 (60 FPS)
      </div>
    </div>
  );
}
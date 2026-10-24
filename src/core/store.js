// src/games/jerusalem/core/store.js
import { create } from 'zustand';
import { BUILDINGS } from '../data/buildings';
import { MATTHEW_CAMPAIGN } from '../data/matthewQuests';

export const MAP_SIZE = 16;

export const useTycoonStore = create((set, get) => ({
  // 6대 핵심 자원
  shekels: 500,
  food: 80,
  fish: 40,
  oil: 30,
  wine: 20,
  faith: 40,
  population: 0,
  year: 30,
  seasonIdx: 0,
  simSpeed: 1,

  // 맵 & 카메라
  grid: (() => {
    const init = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));
    init[7][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[6][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[8][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[7][6] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[7][8] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[6][6] = { type: 'house', level: 1, isRoot: true, w: 1, h: 1 };
    init[8][8] = { type: 'aqueduct', isRoot: true, w: 1, h: 1 };
    return init;
  })(),

  // 보행자 (예수님, 제자, 나귀 캐러밴)
  walkers: [
    { id: 'jesus', type: 'jesus', r: 7, c: 7 },
    { id: 'peter', type: 'disciple', r: 7, c: 7 },
    { id: 'donkey_1', type: 'donkey', r: 6, c: 7 }
  ],

  // 퀘스트 & UI 상태
  currentQuestIdx: 0,
  showQuestModal: false,
  selectedTool: 'road',
  activeCategory: 'infra',
  inspectedTile: null,
  hoverTile: null,

  // 액션
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setInspectedTile: (tile) => set({ inspectedTile: tile }),
  setShowQuestModal: (show) => set({ showQuestModal: show }),
  setHoverTile: (tile) => set({ hoverTile: tile }),

  // 건물 배치 검증 및 건설
  buildAt: (r, c) => {
    const { grid, selectedTool, shekels } = get();
    const b = BUILDINGS[selectedTool];
    if (!b) return false;

    if (r + b.h > MAP_SIZE || c + b.w > MAP_SIZE) return false;
    for (let dr = 0; dr < b.h; dr++) {
      for (let dc = 0; dc < b.w; dc++) {
        if (grid[r + dr][c + dc] !== null) return false;
      }
    }

    if (shekels < b.cost) return false;

    const next = grid.map(row => [...row]);
    for (let dr = 0; dr < b.h; dr++) {
      for (let dc = 0; dc < b.w; dc++) {
        if (dr === 0 && dc === 0) {
          next[r][c] = { type: selectedTool, level: 1, isRoot: true, w: b.w, h: b.h };
        } else {
          next[r + dr][c + dc] = { isOccupied: true, rootR: r, rootC: c };
        }
      }
    }

    set({ grid: next, shekels: shekels - b.cost });
    return true;
  },

  // 철거
  demolishAt: (r, c) => {
    const { grid } = get();
    const clicked = grid[r][c];
    if (!clicked) return;

    const rootR = clicked.isRoot ? r : clicked.rootR;
    const rootC = clicked.isRoot ? c : clicked.rootC;
    const rootB = grid[rootR][rootC];
    const w = rootB.w || 1;
    const h = rootB.h || 1;

    const next = grid.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri >= rootR && ri < rootR + h && ci >= rootC && ci < rootC + w) return null;
        return cell;
      })
    );
    set({ grid: next });
  },

  // 경제 시뮬레이션 틱
  tickSimulation: () => {
    const { grid, food, fish, oil, wine, faith, currentQuestIdx, shekels } = get();
    let totalPop = 0;
    let totalTax = 0;
    let foodProd = 0;
    let fishProd = 0;
    let oilProd = 0;
    let wineProd = 0;
    let faithGain = 25;

    const roadCoords = [];
    const waterCoords = [];
    const marketCoords = [];
    const holyCoords = [];

    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const cell = grid[r][c];
        if (!cell || !cell.isRoot) continue;

        if (cell.type === 'road') roadCoords.push([r, c]);
        if (['aqueduct', 'well', 'fountain'].includes(cell.type)) waterCoords.push([r, c]);
        if (['bread_market', 'fish_market', 'sacrifice_market'].includes(cell.type)) marketCoords.push([r, c]);
        if (['synagogue', 'beatitudes', 'temple', 'golgotha'].includes(cell.type)) holyCoords.push([r, c]);

        if (cell.type === 'wheat_farm') foodProd += 14;
        if (cell.type === 'fishery') fishProd += 12;
        if (cell.type === 'olive_grove') oilProd += 9;
        if (cell.type === 'vineyard') wineProd += 7;
        if (cell.type === 'caravan') totalTax += 30;
        if (cell.type === 'money_changer') totalTax += 40;
        if (cell.type === 'temple') {
          faithGain += 60;
          totalTax += 60;
        }
      }
    }

    // 주택 5단계 진화 판정
    const nextGrid = grid.map((row, r) =>
      row.map((cell, c) => {
        if (!cell || !cell.isRoot || cell.type !== 'house') return cell;

        const hasRoad = roadCoords.some(([rr, rc]) => Math.abs(rr - r) + Math.abs(rc - c) === 1);
        const hasWater = waterCoords.some(([wr, wc]) => Math.hypot(wr - r, wc - c) <= 3.8);
        const hasMarket = marketCoords.some(([mr, mc]) => Math.hypot(mr - r, mc - c) <= 4.8);
        const hasHoly = holyCoords.some(([hr, hc]) => Math.hypot(hr - r, hc - c) <= 5.8);
        const hasFountain = waterCoords.some(([wr, wc]) => grid[wr][wc]?.type === 'fountain' && Math.hypot(wr - r, wc - c) <= 3.8);

        let targetLvl = 1;
        if (hasRoad && hasWater) targetLvl = 2;
        if (hasRoad && hasWater && hasMarket && food >= 8) targetLvl = 3;
        if (hasRoad && hasWater && hasMarket && hasHoly && fish >= 5 && oil >= 4) targetLvl = 4;
        if (hasRoad && hasWater && hasMarket && hasHoly && hasFountain && wine >= 3 && faith >= 70) targetLvl = 5;

        const curLvl = cell.level || 1;
        const nextLvl = curLvl < targetLvl ? curLvl + 1 : curLvl > targetLvl ? curLvl - 1 : curLvl;

        const popTable = [4, 10, 25, 55, 120];
        const taxTable = [3, 8, 22, 55, 130];
        totalPop += popTable[nextLvl - 1];
        totalTax += taxTable[nextLvl - 1];

        return { ...cell, level: nextLvl };
      })
    );

    // 자원 차감 및 반영
    set((state) => ({
      grid: nextGrid,
      population: totalPop,
      shekels: shekels + totalTax,
      food: Math.max(0, food + foodProd - Math.floor(totalPop * 0.35)),
      fish: Math.max(0, fish + fishProd - Math.floor(totalPop * 0.25)),
      oil: Math.max(0, oil + oilProd - Math.floor(totalPop * 0.15)),
      wine: Math.max(0, wine + wineProd - Math.floor(totalPop * 0.1)),
      faith: Math.min(100, Math.max(10, faithGain)),
      seasonIdx: (state.seasonIdx + 1) % 4,
      year: state.seasonIdx === 3 ? state.year + 1 : state.year
    }));
  }
}));
// src/games/jerusalem/core/store.js
import { create } from 'zustand';

export const MAP_SIZE = 16;

export const useTycoonStore = create((set, get) => ({
  shekels: 600,
  food: 90,
  fish: 50,
  oil: 35,
  wine: 25,
  faith: 45,
  population: 0,
  year: 30,
  seasonIdx: 0,
  simSpeed: 1,

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

  walkers: [
    { id: 'jesus', type: 'jesus', x: 7, y: 7 },
    { id: 'donkey', type: 'donkey', x: 6, y: 7 }
  ],

  currentQuestIdx: 0,
  showQuestModal: false,
  selectedTool: 'road',
  activeCategory: 'infra',
  inspectedTile: null,

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setInspectedTile: (tile) => set({ inspectedTile: tile }),
  setShowQuestModal: (show) => set({ showQuestModal: show }),

  buildAt: (r, c, buildingMeta) => {
    const { grid, shekels } = get();
    if (!buildingMeta) return false;
    const { w = 1, h = 1, cost } = buildingMeta;

    if (r + h > MAP_SIZE || c + w > MAP_SIZE) return false;
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (grid[r + dr][c + dc] !== null) return false;
      }
    }
    if (shekels < cost) return false;

    const next = grid.map(row => [...row]);
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (dr === 0 && dc === 0) {
          next[r][c] = { type: buildingMeta.id, level: 1, isRoot: true, w, h };
        } else {
          next[r + dr][c + dc] = { isOccupied: true, rootR: r, rootC: c };
        }
      }
    }
    set({ grid: next, shekels: shekels - cost });
    return true;
  },

  demolishAt: (r, c) => {
    const { grid } = get();
    const cell = grid[r][c];
    if (!cell) return;

    const rootR = cell.isRoot ? r : cell.rootR;
    const rootC = cell.isRoot ? c : cell.rootC;
    const rootB = grid[rootR][rootC];
    const w = rootB?.w || 1;
    const h = rootB?.h || 1;

    const next = grid.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri >= rootR && ri < rootR + h && ci >= rootC && ci < rootC + w) return null;
        return cell;
      })
    );
    set({ grid: next });
  }
}));
// src/games/jerusalem/core/store.js
import { create } from 'zustand';
import { BUILDINGS, HOUSE_TIERS } from '../data/buildings';
import { MATTHEW_CAMPAIGN } from '../data/quests';

export const MAP_SIZE = 16;
const SAVE_KEY = 'jerusalem_master_game_v13';

// =====================================================================
// 🎵 1. Web Audio API 싱글톤 사운드 신시사이저 (메모리 누수 완전 차단)
// =====================================================================
let cachedAudioCtx = null;
const getAudioContext = () => {
  if (!cachedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) cachedAudioCtx = new AudioCtx();
  }
  if (cachedAudioCtx && cachedAudioCtx.state === 'suspended') {
    cachedAudioCtx.resume().catch(() => {});
  }
  return cachedAudioCtx;
};

export const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'hammer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'evolve') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.045);
        gain.gain.setValueAtTime(0.2, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.045 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.2);
      });
    } else if (type === 'coin') {
      [1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.2, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.18);
      });
    } else if (type === 'shofar') {
      [220, 293.66, 369.99, 440, 587.33].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.16);
        gain.gain.setValueAtTime(0.3, now + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.16 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.55);
      });
    } else if (type === 'demolish') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (_) {}
};

// =====================================================================
// 🛤️ 2. BFS 도로망 경로 탐색기 (OpenTTD Logistics Engine)
// =====================================================================
const findRoadPath = (grid, start, end) => {
  const queue = [[start]];
  const visited = new Set([`${start.r},${start.c}`]);

  while (queue.length > 0) {
    const path = queue.shift();
    const curr = path[path.length - 1];

    if (curr.r === end.r && curr.c === end.c) return path;

    const dirs = [
      { r: curr.r - 1, c: curr.c },
      { r: curr.r + 1, c: curr.c },
      { r: curr.r, c: curr.c - 1 },
      { r: curr.r, c: curr.c + 1 }
    ];

    for (const d of dirs) {
      if (
        d.r >= 0 && d.r < MAP_SIZE &&
        d.c >= 0 && d.c < MAP_SIZE &&
        grid[d.r]?.[d.c]?.type === 'road' &&
        !visited.has(`${d.r},${d.c}`)
      ) {
        visited.add(`${d.r},${d.c}`);
        queue.push([...path, d]);
      }
    }
  }
  return null;
};

// =====================================================================
// 🏛️ 3. 초기 그리드 맵 생성 팩토리 (안전 마이그레이션)
// =====================================================================
const createInitialGrid = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === MAP_SIZE && parsed[0]?.length === MAP_SIZE) {
        return parsed;
      }
    }
  } catch (_) {}

  const init = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));

  // 시작 기본 십자로 판석 도로
  init[7][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
  init[6][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
  init[8][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
  init[7][6] = { type: 'road', isRoot: true, w: 1, h: 1 };
  init[7][8] = { type: 'road', isRoot: true, w: 1, h: 1 };

  // 시작 기본 가옥 & 인프라
  init[6][6] = { type: 'house', level: 1, isRoot: true, w: 1, h: 1 };
  init[5][6] = { type: 'house', level: 2, isRoot: true, w: 1, h: 1 };
  init[8][8] = { type: 'aqueduct', isRoot: true, w: 1, h: 1 };
  init[7][5] = { type: 'well', isRoot: true, w: 1, h: 1 };

  // 시작 2x2 밀밭 & 풍차 단지
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      init[4 + dr][7 + dc] = dr === 0 && dc === 0
        ? { type: 'wheat_farm', isRoot: true, w: 2, h: 2 }
        : { isOccupied: true, rootR: 4, rootC: 7 };
    }
  }

  return init;
};

// =====================================================================
// 🌟 4. Zustand 타이쿤 마스터 스토어
// =====================================================================
export const useTycoonStore = create((set, get) => ({
  // ── 7대 핵심 자원 & 경제 지표 ──
  shekels: 600,
  food: 90,
  fish: 50,
  oil: 35,
  wine: 25,
  faith: 45,
  population: 14,
  availableWorkers: 7,
  requiredWorkers: 8,
  workEfficiency: 0.88,

  // ── 시간 & 계절 ──
  year: 30,
  seasonIdx: 0,
  simSpeed: 1,

  // ── 16x16 월드 그리드 ──
  grid: createInitialGrid(),

  // ── 살아 움직이는 보행자 AI (Walkers) ──
  walkers: [
    { id: 'jesus', type: 'jesus', r: 7, c: 7, path: [] },
    { id: 'peter', type: 'disciple', r: 6, c: 7, path: [] },
    { id: 'donkey_1', type: 'donkey', r: 7, c: 8, path: [] }
  ],

  // ── 마태복음 퀘스트 & UI 상태 ──
  currentQuestIdx: 0,
  showQuestModal: false,
  selectedTool: 'road',
  activeCategory: 'infra',
  inspectedTile: null,
  notification: null,

  // ── UI 액션 ──
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setInspectedTile: (tile) => set({ inspectedTile: tile }),
  setShowQuestModal: (show) => set({ showQuestModal: show }),
  setNotification: (msg) => set({ notification: msg }),

  // ── 멀티타일(1x1, 2x2, 3x3) 원자적 건설 엔진 ──
  buildAt: (r, c, buildingMeta) => {
    const { grid, shekels } = get();
    if (!buildingMeta) return false;
    const { id, w = 1, h = 1, cost, category } = buildingMeta;

    // 타일 경계 및 점유 충돌 검증
    if (r + h > MAP_SIZE || c + w > MAP_SIZE || r < 0 || c < 0) return false;
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (!grid[r + dr] || grid[r + dr][c + dc] !== null) return false;
      }
    }

    if (shekels < cost) {
      get().setNotification('세겔이 부족합니다!');
      return false;
    }

    playSound(category === 'holy' ? 'shofar' : 'hammer');

    const nextGrid = grid.map(row => [...row]);
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (dr === 0 && dc === 0) {
          nextGrid[r][c] = { type: id, level: 1, isRoot: true, w, h };
        } else {
          nextGrid[r + dr][c + dc] = { isOccupied: true, rootR: r, rootC: c };
        }
      }
    }

    const nextShekels = shekels - cost;
    set({ grid: nextGrid, shekels: nextShekels });

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(nextGrid));
    } catch (_) {}

    return true;
  },

  // ── 멀티타일 완전 철거 엔진 ──
  demolishAt: (r, c) => {
    const { grid } = get();
    const cell = grid?.[r]?.[c];
    if (!cell) return;

    playSound('demolish');

    const rootR = cell.isRoot ? r : cell.rootR;
    const rootC = cell.isRoot ? c : cell.rootC;
    const rootB = grid?.[rootR]?.[rootC];
    const w = rootB?.w || 1;
    const h = rootB?.h || 1;

    const nextGrid = grid.map((row, ri) =>
      row.map((tile, ci) => {
        if (ri >= rootR && ri < rootR + h && ci >= rootC && ci < rootC + w) return null;
        return tile;
      })
    );

    set({ grid: nextGrid, inspectedTile: null });

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(nextGrid));
    } catch (_) {}
  },

  // =====================================================================
  // ⏱️ 5. 시저 3 / OpenTTD 고증 경제 및 시뮬레이션 틱
  // =====================================================================
  tickSimulation: () => {
    const state = get();
    if (state.simSpeed === 0) return;

    const { grid, shekels, food, fish, oil, wine, faith, currentQuestIdx } = state;

    let totalPop = 0;
    let totalTax = 0;
    let totalUpkeep = 0;
    let totalRequiredWorkers = 0;

    let rawFoodProd = 0;
    let rawFishProd = 0;
    let rawOilProd = 0;
    let rawWineProd = 0;
    let faithGain = 25;
    let tradeBonus = 0;

    const roadCoords = [];
    const waterSources = [];
    const marketSources = [];
    const holySources = [];

    // [1단계] 도시 그리드 스캔 및 인프라 매핑
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const cell = grid[r]?.[c];
        if (!cell || !cell.isRoot) continue;

        const bMeta = BUILDINGS[cell.type];
        if (bMeta) {
          totalUpkeep += bMeta.upkeep || 0;
          totalRequiredWorkers += bMeta.workers || 0;
          if (bMeta.tradeTaxBonus) tradeBonus += bMeta.tradeTaxBonus;
          if (bMeta.faithBonus) faithGain += bMeta.faithBonus;
        }

        if (cell.type === 'road') roadCoords.push([r, c]);
        if (['aqueduct', 'well', 'fountain'].includes(cell.type)) {
          waterSources.push({ r, c, type: cell.type, radius: bMeta?.serviceRadius || 3.8 });
        }
        if (['bread_market', 'fish_market', 'sacrifice_market'].includes(cell.type)) {
          marketSources.push({ r, c, type: cell.type, radius: bMeta?.serviceRadius || 4.8 });
        }
        if (['synagogue', 'beatitudes', 'temple', 'golgotha', 'gethsemane'].includes(cell.type)) {
          holySources.push({ r, c, type: cell.type, radius: bMeta?.serviceRadius || 5.8 });
        }

        // 기본 생산량
        if (cell.type === 'wheat_farm') rawFoodProd += 14;
        if (cell.type === 'fishery') rawFishProd += 12;
        if (cell.type === 'olive_grove') rawOilProd += 9;
        if (cell.type === 'vineyard') rawWineProd += 7;
      }
    }

    // [2단계] 시저 3식 5단계 주택 진화 및 퇴보 판정
    let evolvedAny = false;
    const nextGrid = grid.map((row, r) =>
      row.map((cell, c) => {
        if (!cell || !cell.isRoot || cell.type !== 'house') return cell;

        const hasRoad = roadCoords.some(([rr, rc]) => Math.abs(rr - r) + Math.abs(rc - c) === 1);
        const hasWater = waterSources.some(ws => Math.hypot(ws.r - r, ws.c - c) <= ws.radius);
        const hasMarket = marketSources.some(ms => Math.hypot(ms.r - r, ms.c - c) <= ms.radius);
        const hasHoly = holySources.some(hs => Math.hypot(hs.r - r, hs.c - c) <= hs.radius);
        const hasFountain = waterSources.some(ws => ws.type === 'fountain' && Math.hypot(ws.r - r, ws.c - c) <= ws.radius);

        let targetLvl = 1;
        if (hasRoad && hasWater) targetLvl = 2;
        if (hasRoad && hasWater && hasMarket && food >= 8) targetLvl = 3;
        if (hasRoad && hasWater && hasMarket && hasHoly && fish >= 5 && oil >= 4) targetLvl = 4;
        if (hasRoad && hasWater && hasMarket && hasHoly && hasFountain && wine >= 3 && faith >= 70) targetLvl = 5;

        const curLvl = cell.level || 1;
        let nextLvl = curLvl;

        if (curLvl < targetLvl) {
          nextLvl = curLvl + 1;
          evolvedAny = true;
        } else if (curLvl > targetLvl) {
          nextLvl = curLvl - 1;
        }

        const tierMeta = HOUSE_TIERS[nextLvl - 1] || HOUSE_TIERS[0];
        totalPop += tierMeta.pop;
        totalTax += tierMeta.tax;

        return { ...cell, level: nextLvl };
      })
    );

    if (evolvedAny) playSound('evolve');

    // [3단계] 노동력 고용률 연동 생산성 계산
    const availableWorkers = Math.max(1, Math.floor(totalPop * 0.5));
    const workEfficiency = totalRequiredWorkers > 0
      ? Math.min(1.0, availableWorkers / totalRequiredWorkers)
      : 1.0;

    const actualFoodProd = Math.floor(rawFoodProd * workEfficiency);
    const actualFishProd = Math.floor(rawFishProd * workEfficiency);
    const actualOilProd = Math.floor(rawOilProd * workEfficiency);
    const actualWineProd = Math.floor(rawWineProd * workEfficiency);

    // [4단계] 인구 소비량 및 경제 결산
    const foodNeed = Math.floor(totalPop * 0.35);
    const fishNeed = Math.floor(totalPop * 0.25);
    const oilNeed = Math.floor(totalPop * 0.15);
    const wineNeed = Math.floor(totalPop * 0.1);

    const nextShekels = Math.max(0, shekels + totalTax + tradeBonus - totalUpkeep);
    const nextFood = Math.max(0, food + actualFoodProd - foodNeed);
    const nextFish = Math.max(0, fish + actualFishProd - fishNeed);
    const nextOil = Math.max(0, oil + actualOilProd - oilNeed);
    const nextWine = Math.max(0, wine + actualWineProd - wineNeed);
    const nextFaith = Math.min(100, Math.max(10, faithGain));

    // [5단계] 계절 및 연도 전환
    const nextSeasonIdx = (state.seasonIdx + 1) % 4;
    const nextYear = nextSeasonIdx === 0 ? state.year + 1 : state.year;

    // [6단계] 마태복음 퀘스트 검증
    const curQuest = MATTHEW_CAMPAIGN[currentQuestIdx];
    let nextQuestIdx = currentQuestIdx;
    let shouldShowModal = state.showQuestModal;

    if (curQuest && curQuest.checkTarget(nextGrid, { population: totalPop, food: nextFood, faith: nextFaith, shekels: nextShekels })) {
      playSound('shofar');
      shouldShowModal = true;
      if (currentQuestIdx < MATTHEW_CAMPAIGN.length - 1) {
        nextQuestIdx = currentQuestIdx + 1;
      }
    }

    // [7단계] 보행자 & 나귀 캐러밴 도로 순회 AI
    const nextWalkers = state.walkers.map((w) => {
      if (roadCoords.length < 2) return w;

      let curPath = w.path || [];
      if (curPath.length === 0) {
        const randomTarget = roadCoords[Math.floor(Math.random() * roadCoords.length)];
        const generatedPath = findRoadPath(nextGrid, { r: w.r, c: w.c }, { r: randomTarget[0], c: randomTarget[1] });
        if (generatedPath && generatedPath.length > 1) {
          curPath = generatedPath.slice(1);
        }
      }

      if (curPath.length > 0) {
        const nextStep = curPath[0];
        return {
          ...w,
          r: nextStep.r,
          c: nextStep.c,
          path: curPath.slice(1)
        };
      }

      return w;
    });

    set({
      grid: nextGrid,
      shekels: nextShekels,
      food: nextFood,
      fish: nextFish,
      oil: nextOil,
      wine: nextWine,
      faith: nextFaith,
      population: totalPop,
      availableWorkers,
      requiredWorkers: totalRequiredWorkers,
      workEfficiency: Math.round(workEfficiency * 100) / 100,
      seasonIdx: nextSeasonIdx,
      year: nextYear,
      walkers: nextWalkers,
      currentQuestIdx: nextQuestIdx,
      showQuestModal: shouldShowModal
    });

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(nextGrid));
    } catch (_) {}
  },

  // ── 새 게임 초기화 ──
  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    const freshGrid = createInitialGrid();
    set({
      shekels: 600,
      food: 90,
      fish: 50,
      oil: 35,
      wine: 25,
      faith: 45,
      population: 14,
      availableWorkers: 7,
      requiredWorkers: 8,
      workEfficiency: 0.88,
      year: 30,
      seasonIdx: 0,
      grid: freshGrid,
      currentQuestIdx: 0,
      showQuestModal: false,
      inspectedTile: null,
      notification: '새로운 예루살렘 도성이 시작되었습니다!'
    });
  }
}));
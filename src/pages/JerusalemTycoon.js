// src/pages/JerusalemTycoon.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// =====================================================================
// 🎵 1. Web Audio API 고대 성경 입체 사운드 신시사이저 (무설치 자체 합성)
// =====================================================================
const playTycoonAudio = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'hammer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'evolve') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.25);
      });
    } else if (type === 'coin') {
      [1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.2);
      });
    } else if (type === 'shofar') {
      [220, 293.66, 369.99, 440, 587.33].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.18 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.6);
      });
    } else if (type === 'demolish') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_) {}
};

// =====================================================================
// 📜 2. 신약성경 마태복음 7대 연대기 캠페인 퀘스트 정의
// =====================================================================
const MATTHEW_CAMPAIGN = [
  {
    chapter: 1,
    title: '마태복음 3장: 요단강의 세례와 회개의 외침',
    verse: '마 3:16~17',
    summary: '세례 요한이 요단강에서 회개를 선포하고, 예수님께서 세례를 받으실 때 하늘이 열리고 성령이 비둘기같이 임하십니다.',
    targetDesc: '실로암 수로 2개와 야곱의 우물 1개를 건설하여 도성에 생명수를 공급하세요.',
    checkTarget: (grid) => {
      let aqua = 0; let wells = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'aqueduct') aqua++;
          if (grid?.[r]?.[c]?.type === 'well') wells++;
        }
      }
      return aqua >= 2 && wells >= 1;
    },
    rewardShekels: 150,
    rewardFaith: 25
  },
  {
    chapter: 2,
    title: '마태복음 4장: 갈릴리 어부 제자들을 부르심',
    verse: '마 4:19',
    summary: '갈릴리 해변에서 그물을 던지던 베드로와 안드레에게 "나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라" 부르십니다.',
    targetDesc: '갈릴리 선착장(2x2) 1개와 주거 구역 3채를 지어 순례자 어부들을 정착시키세요.',
    checkTarget: (grid) => {
      let boats = 0; let houses = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'fishery' && grid?.[r]?.[c]?.isRoot) boats++;
          if (grid?.[r]?.[c]?.type === 'house') houses++;
        }
      }
      return boats >= 1 && houses >= 3;
    },
    rewardShekels: 200,
    rewardFaith: 30
  },
  {
    chapter: 3,
    title: '마태복음 5~7장: 팔복산의 산상수훈 선포',
    verse: '마 5:3, 14',
    summary: '산에 올라 가르치십니다: "심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요. 너희는 세상의 빛이라"',
    targetDesc: '팔복 기도 동산(2x2) 1개와 가버나움 백색회당(2x2) 1개를 봉헌하세요.',
    checkTarget: (grid) => {
      let garden = 0; let syn = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'beatitudes' && grid?.[r]?.[c]?.isRoot) garden++;
          if (grid?.[r]?.[c]?.type === 'synagogue' && grid?.[r]?.[c]?.isRoot) syn++;
        }
      }
      return garden >= 1 && syn >= 1;
    },
    rewardShekels: 260,
    rewardFaith: 35
  },
  {
    chapter: 4,
    title: '마태복음 9장: 세리 마태의 회심과 나눔의 큰 잔치',
    verse: '마 9:9, 13',
    summary: '세관에 앉은 마태를 보시고 "나를 따르라" 부르시니 따릅니다. "내가 긍휼을 원하고 제사를 원하지 아니하노라"',
    targetDesc: '나귀 캐러밴 기지(2x2) 1개와 생명의 빵 장터(2x2) 2개를 구축하여 물류를 연결하세요.',
    checkTarget: (grid) => {
      let caravan = 0; let markets = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'caravan' && grid?.[r]?.[c]?.isRoot) caravan++;
          if (grid?.[r]?.[c]?.type === 'bread_market' && grid?.[r]?.[c]?.isRoot) markets++;
        }
      }
      return caravan >= 1 && markets >= 2;
    },
    rewardShekels: 320,
    rewardFaith: 35
  },
  {
    chapter: 5,
    title: '마태복음 14장: 오병이어 5천 명 급식의 대기적',
    verse: '마 14:19~20',
    summary: '떡 다섯 개와 물고기 두 마리를 축사하사 떼어 주시매 오천 명이 배불리 먹고 열두 바구니가 남았습니다.',
    targetDesc: '도시 인구를 70명 이상으로 번영시키고 식량 60 이상을 비축하세요.',
    checkTarget: (grid, res) => res.population >= 70 && res.food >= 60,
    rewardShekels: 450,
    rewardFaith: 45
  },
  {
    chapter: 6,
    title: '마태복음 21장: 나귀 타고 입성 & 성전 정화',
    verse: '마 21:9, 12',
    summary: '"호산나 다윗의 자손이여 찬송하리로다!" 성전에 들어가 매매하는 자들의 상을 엎으시며 거룩함을 회복하십니다.',
    targetDesc: '헤롯 제2성전(3x3)을 완공하고 도시 신앙도를 80% 이상으로 유지하세요.',
    checkTarget: (grid, res) => {
      let temple = false;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'temple' && grid?.[r]?.[c]?.isRoot) temple = true;
        }
      }
      return temple && res.faith >= 80;
    },
    rewardShekels: 700,
    rewardFaith: 50
  },
  {
    chapter: 7,
    title: '마태복음 28장: 빈 무덤과 부활의 대위임령',
    verse: '마 28:19~20',
    summary: '"그가 여기 계시지 않고 살아나셨느니라! 너희는 가서 모든 민족을 제자로 삼으라 내가 세상 끝날까지 항상 함께 있으리라!"',
    targetDesc: '골고다 십자가 언덕(2x2)을 세우고 도시 인구를 150명 이상으로 번영시키세요.',
    checkTarget: (grid, res) => {
      let golgotha = false;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid?.[r]?.[c]?.type === 'golgotha' && grid?.[r]?.[c]?.isRoot) golgotha = true;
        }
      }
      return golgotha && res.population >= 150;
    },
    rewardShekels: 1200,
    rewardFaith: 100
  }
];

const MAP_SIZE = 16;

const CATEGORIES = [
  { id: 'infra', label: '인프라/도로', icon: '🛤️' },
  { id: 'housing', label: '주거 구역', icon: '⛺' },
  { id: 'industry', label: '농업/물류', icon: '🌾' },
  { id: 'market', label: '상업/장터', icon: '🏺' },
  { id: 'holy', label: '성지/성전', icon: '🏛️' },
  { id: 'defense', label: '성벽/치안', icon: '🧱' }
];

const BUILDINGS = {
  road: { category: 'infra', id: 'road', name: '로마식 석조도로', cost: 5, emoji: '🛤️', w: 1, h: 1, desc: '로마 판석 포장도로. 순례자와 나귀 캐러밴이 다닙니다.' },
  aqueduct: { category: 'infra', id: 'aqueduct', name: '실로암 수로', cost: 12, emoji: '💧', w: 1, h: 1, desc: '기혼샘의 맑은 물을 도성으로 공급합니다. 주택 2단계 진화 필수!' },
  well: { category: 'infra', id: 'well', name: '야곱의 우물', cost: 25, emoji: '🪣', w: 1, h: 1, desc: '반경 3.5타일 안의 가옥에 식수를 공급합니다.' },
  fountain: { category: 'infra', id: 'fountain', name: '광장 대리석 분수', cost: 75, emoji: '⛲', w: 2, h: 2, desc: '귀족 대리석 궁정 진화에 필수적인 2x2 분수 광장입니다.' },

  house: { category: 'housing', id: 'house', name: '주거 지정 구역', cost: 15, emoji: '⛺', w: 1, h: 1, desc: '순례자가 정착합니다. 물, 빵, 생선, 회당, 포도주에 따라 5단계 진화!' },

  wheat_farm: { category: 'industry', id: 'wheat_farm', name: '갈릴리 밀밭', cost: 30, emoji: '🌾', w: 2, h: 2, desc: '2x2 대형 밀밭. 매 턴 식량을 수확하여 빵 장터로 보냅니다.' },
  fishery: { category: 'industry', id: 'fishery', name: '갈릴리 어선 선착장', cost: 40, emoji: '⛵', w: 2, h: 2, desc: '2x2 선착장. 그물을 던져 신선한 물고기를 수확합니다.' },
  olive_grove: { category: 'industry', id: 'olive_grove', name: '감람산 올리브원', cost: 45, emoji: '🫒', w: 2, h: 2, desc: '2x2 올리브 농원. 성전 등잔대와 고급 저택에 필요한 기름을 생산합니다.' },
  vineyard: { category: 'industry', id: 'vineyard', name: '가나의 포도원', cost: 50, emoji: '🍇', w: 2, h: 2, desc: '2x2 포도원. 유월절 만찬과 5단계 궁정 저택에 필요한 포도주를 생산합니다.' },
  caravan: { category: 'industry', id: 'caravan', name: '나귀 캐러밴 기지', cost: 85, emoji: '🐪', w: 2, h: 2, desc: '2x2 물류 기지! OpenTTD 무역망으로 식량 수송 속도를 2배로 가속합니다.' },

  bread_market: { category: 'market', id: 'bread_market', name: '생명의 빵 장터', cost: 50, emoji: '🍞', w: 2, h: 2, desc: '2x2 장터. 밀가루를 빵으로 구워 주민들에게 배급하고 세겔을 거둡니다.' },
  fish_market: { category: 'market', id: 'fish_market', name: '가버나움 생선전', cost: 65, emoji: '🐟', w: 2, h: 2, desc: '2x2 수산시장. 갈릴리 물고기를 공급하여 주택을 3단계로 진화시킵니다.' },
  sacrifice_market: { category: 'market', id: 'sacrifice_market', name: '성전 제물 시장', cost: 85, emoji: '🏺', w: 2, h: 2, desc: '2x2 제물 장터. 비둘기와 양을 판매하여 막대한 무역세를 거둡니다.' },
  money_changer: { category: 'market', id: 'money_changer', name: '성전 환전소', cost: 115, emoji: '🪙', w: 1, h: 1, desc: '로마 은전을 성전 반 세겔로 환전하는 금융 거점입니다.' },

  synagogue: { category: 'holy', id: 'synagogue', name: '가버나움 백색회당', cost: 130, emoji: '📜', w: 2, h: 2, desc: '2x2 열주식 회당. 율법을 강론하고 주택을 4단계로 진화시킵니다.' },
  beatitudes: { category: 'holy', id: 'beatitudes', name: '팔복 기도 동산', cost: 160, emoji: '🌸', w: 2, h: 2, desc: '2x2 동산. 산상수훈의 복을 기념하며 도시 신앙도를 크게 올립니다.' },
  gethsemane: { category: 'holy', id: 'gethsemane', name: '겟세마네 동산', cost: 190, emoji: '🌿', w: 2, h: 2, desc: '2x2 고목 올리브 동산. 눈물의 기도로 도시 신앙도를 극대화합니다.' },
  golgotha: { category: 'holy', id: 'golgotha', name: '골고다 십자가 언덕', cost: 250, emoji: '✝️', w: 2, h: 2, desc: '2x2 갈보리 암반. 인류 대속의 십자가로 도시 전체에 영원한 평안을 선포합니다.' },
  temple: { category: 'holy', id: 'temple', name: '헤롯 제2성전 (대성전)', cost: 500, emoji: '🏛️', w: 3, h: 3, desc: '3x3 초대형 복합체! 회랑과 번제단, 지성소를 갖춘 예루살렘의 영원한 심장!' },

  wall: { category: 'defense', id: 'wall', name: '다윗성 성벽', cost: 20, emoji: '🧱', w: 1, h: 1, desc: '견고한 석회암 성벽으로 외적의 침입을 방어합니다.' },
  gate: { category: 'defense', id: 'gate', name: '다마스커스 성문', cost: 45, emoji: '🚪', w: 2, h: 1, desc: '2x1 요새화 성문. 순례자들의 통행세를 징수합니다.' },
  tower: { category: 'defense', id: 'tower', name: '안토니아 망대', cost: 80, emoji: '🗼', w: 1, h: 1, desc: '파수꾼이 화재를 신속하게 진압하고 치안을 유지합니다.' }
};

const HOUSE_TIERS = [
  { level: 1, name: '베두인 텐트', pop: 4, tax: 3, emoji: '⛺' },
  { level: 2, name: '갈릴리 흙벽돌집', pop: 10, tax: 8, emoji: '🛖' },
  { level: 3, name: '석회암 평지붕 가옥', pop: 25, tax: 22, emoji: '🏠' },
  { level: 4, name: '다윗성 2층 저택', pop: 55, tax: 55, emoji: '🏡' },
  { level: 5, name: '로마식 대리석 궁정', pop: 120, tax: 130, emoji: '🏰' }
];

export default function JerusalemTycoon({ setActiveScreen }) {
  const [shekels, setShekels] = useState(500);
  const [food, setFood] = useState(80);
  const [fish, setFish] = useState(40);
  const [oil, setOil] = useState(30);
  const [wine, setWine] = useState(20);
  const [faith, setFaith] = useState(40);
  const [population, setPopulation] = useState(0);
  const [year, setYear] = useState(30);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const SEASONS = ['유월절 (봄)', '오순절 (여름)', '초막절 (가을)', '수전절 (겨울)'];

  const [currentQuestIdx, setCurrentQuestIdx] = useState(0);
  const [showQuestModal, setShowQuestModal] = useState(false);

  const [activeCategory, setActiveCategory] = useState('infra');
  const [selectedTool, setSelectedTool] = useState('road');
  const [simSpeed, setSimSpeed] = useState(1);
  const [inspectedTile, setInspectedTile] = useState(null);

  // 16x16 맵 데이터 초기화
  const [grid, setGrid] = useState(() => {
    try {
      const saved = localStorage.getItem('jerusalem_master_game_v9');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === MAP_SIZE && parsed[0]?.length === MAP_SIZE) {
          return parsed;
        }
      }
    } catch (_) {}

    const init = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));
    init[7][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[6][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[8][7] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[7][6] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[7][8] = { type: 'road', isRoot: true, w: 1, h: 1 };
    init[7][5] = { type: 'house', level: 1, isRoot: true, w: 1, h: 1 };

    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        init[4 + dr][7 + dc] = dr === 0 && dc === 0
          ? { type: 'wheat_farm', isRoot: true, w: 2, h: 2 }
          : { isOccupied: true, rootR: 4, rootC: 7 };
      }
    }
    init[8][8] = { type: 'aqueduct', isRoot: true, w: 1, h: 1 };
    return init;
  });

  const [walkers, setWalkers] = useState([
    { id: 'jesus', type: 'jesus', r: 7, c: 7 },
    { id: 'peter', type: 'disciple', r: 7, c: 7 },
    { id: 'donkey_1', type: 'donkey', r: 6, c: 7 }
  ]);

  const [hoverTile, setHoverTile] = useState(null);
  const [viewBoxOrigin, setViewBoxOrigin] = useState({ x: 0, y: -40, zoom: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const saveGameState = useCallback(() => {
    try {
      localStorage.setItem('jerusalem_master_game_v9', JSON.stringify(grid));
    } catch (_) {}
  }, [grid]);

  const TILE_W = 80;
  const TILE_H = 40;

  const getTileCenter = useCallback((r, c) => ({
    x: (c - r) * (TILE_W / 2),
    y: (c + r) * (TILE_H / 2)
  }), []);

  const getRoadNeighbors = useCallback((r, c) => {
    const isRoad = (nr, nc) => nr >= 0 && nr < MAP_SIZE && nc >= 0 && nc < MAP_SIZE && grid?.[nr]?.[nc]?.type === 'road';
    return {
      n: isRoad(r - 1, c),
      s: isRoad(r + 1, c),
      w: isRoad(r, c - 1),
      e: isRoad(r, c + 1)
    };
  }, [grid]);

  const canBuildAt = useCallback((r, c, w, h) => {
    if (r + h > MAP_SIZE || c + w > MAP_SIZE || r < 0 || c < 0) return false;
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (!grid?.[r + dr] || grid[r + dr][c + dc] !== null) return false;
      }
    }
    return true;
  }, [grid]);

  // 경제 시뮬레이션 루프
  useEffect(() => {
    if (simSpeed === 0) return;

    const intervalTime = 3000 / simSpeed;
    const timer = setInterval(() => {
      let totalPop = 0;
      let totalTax = 0;
      let foodProduced = 0;
      let fishProduced = 0;
      let oilProduced = 0;
      let wineProduced = 0;
      let totalFaith = 25;

      const roadCoords = [];
      const waterCoords = [];
      const marketCoords = [];
      const holyCoords = [];

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const cell = grid?.[r]?.[c];
          if (!cell || !cell.isRoot) continue;

          if (cell.type === 'road') roadCoords.push([r, c]);
          if (['aqueduct', 'well', 'fountain'].includes(cell.type)) waterCoords.push([r, c]);
          if (['bread_market', 'fish_market', 'sacrifice_market'].includes(cell.type)) marketCoords.push([r, c]);
          if (['synagogue', 'beatitudes', 'temple', 'golgotha'].includes(cell.type)) holyCoords.push([r, c]);

          if (cell.type === 'wheat_farm') foodProduced += 14;
          if (cell.type === 'fishery') fishProduced += 12;
          if (cell.type === 'olive_grove') oilProduced += 9;
          if (cell.type === 'vineyard') wineProduced += 7;
          if (cell.type === 'caravan') totalTax += 30;
          if (cell.type === 'money_changer') totalTax += 40;
          if (cell.type === 'temple') {
            totalFaith += 60;
            totalTax += 60;
          }
        }
      }

      let evolvedAny = false;
      const nextGrid = grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell || !cell.isRoot || cell.type !== 'house') return cell;

          const hasRoad = roadCoords.some(([rr, rc]) => Math.abs(rr - r) + Math.abs(rc - c) === 1);
          const hasWater = waterCoords.some(([wr, wc]) => Math.hypot(wr - r, wc - c) <= 3.8);
          const hasMarket = marketCoords.some(([mr, mc]) => Math.hypot(mr - r, mc - c) <= 4.8);
          const hasHoly = holyCoords.some(([hr, hc]) => Math.hypot(hr - r, hc - c) <= 5.8);
          const hasFountain = waterCoords.some(([wr, wc]) => grid?.[wr]?.[wc]?.type === 'fountain' && Math.hypot(wr - r, wc - c) <= 3.8);

          let targetLevel = 1;
          if (hasRoad && hasWater) targetLevel = 2;
          if (hasRoad && hasWater && hasMarket && food >= 8) targetLevel = 3;
          if (hasRoad && hasWater && hasMarket && hasHoly && fish >= 5 && oil >= 4) targetLevel = 4;
          if (hasRoad && hasWater && hasMarket && hasHoly && hasFountain && wine >= 3 && faith >= 70) targetLevel = 5;

          const curLevel = cell.level || 1;
          let nextLevel = curLevel;

          if (curLevel < targetLevel) {
            nextLevel = curLevel + 1;
            evolvedAny = true;
          } else if (curLevel > targetLevel) {
            nextLevel = curLevel - 1;
          }

          const tier = HOUSE_TIERS[nextLevel - 1] || HOUSE_TIERS[0];
          totalPop += tier.pop;
          totalTax += tier.tax;

          return { ...cell, level: nextLevel };
        })
      );

      if (evolvedAny) playTycoonAudio('evolve');

      const foodNeed = Math.floor(totalPop * 0.35);
      const fishNeed = Math.floor(totalPop * 0.25);
      const oilNeed = Math.floor(totalPop * 0.15);
      const wineNeed = Math.floor(totalPop * 0.1);

      setFood(prev => Math.max(0, prev + foodProduced - foodNeed));
      setFish(prev => Math.max(0, prev + fishProduced - fishNeed));
      setOil(prev => Math.max(0, prev + oilProduced - oilNeed));
      setWine(prev => Math.max(0, prev + wineProduced - wineNeed));
      setShekels(prev => prev + totalTax);
      setFaith(prev => Math.min(100, Math.max(10, totalFaith)));
      setPopulation(totalPop);
      setGrid(nextGrid);

      setSeasonIdx(prev => {
        const next = (prev + 1) % 4;
        if (next === 0) setYear(y => y + 1);
        return next;
      });

      const currentQ = MATTHEW_CAMPAIGN[currentQuestIdx];
      if (currentQ && currentQ.checkTarget(nextGrid, { population: totalPop, food, faith })) {
        playTycoonAudio('shofar');
        setShekels(s => s + currentQ.rewardShekels);
        setFaith(f => f + currentQ.rewardFaith);
        setShowQuestModal(true);
        if (currentQuestIdx < MATTHEW_CAMPAIGN.length - 1) {
          setCurrentQuestIdx(idx => idx + 1);
        }
      }

      if (roadCoords.length > 2) {
        setWalkers(prev =>
          prev.map((w, idx) => {
            const nextCoord = roadCoords[(Math.floor(Math.random() * roadCoords.length) + idx) % roadCoords.length];
            return { ...w, r: nextCoord[0], c: nextCoord[1] };
          })
        );
      }

    }, intervalTime);

    return () => clearInterval(timer);
  }, [grid, simSpeed, food, fish, oil, wine, faith, currentQuestIdx]);

  // 클릭 이벤트 핸들러
  const handleTileAction = (r, c) => {
    const clickedCell = grid?.[r]?.[c];

    if (selectedTool === 'inspect') {
      if (clickedCell) {
        const rootR = clickedCell.isRoot ? r : clickedCell.rootR;
        const rootC = clickedCell.isRoot ? c : clickedCell.rootC;
        const rootBuilding = grid?.[rootR]?.[rootC];
        if (rootBuilding) {
          setInspectedTile({ r: rootR, c: rootC, ...rootBuilding });
          playTycoonAudio('coin');
        }
      }
      return;
    }

    if (selectedTool === 'demolish') {
      if (clickedCell) {
        playTycoonAudio('demolish');
        const rootR = clickedCell.isRoot ? r : clickedCell.rootR;
        const rootC = clickedCell.isRoot ? c : clickedCell.rootC;
        const rootB = grid?.[rootR]?.[rootC];
        const w = rootB?.w || 1;
        const h = rootB?.h || 1;

        const next = grid.map((row, ri) =>
          row.map((cell, ci) => {
            if (ri >= rootR && ri < rootR + h && ci >= rootC && ci < rootC + w) return null;
            return cell;
          })
        );
        setGrid(next);
        saveGameState();
      }
      return;
    }

    const b = BUILDINGS[selectedTool];
    if (!b) return;

    if (!canBuildAt(r, c, b.w, b.h)) {
      alert(`공간이 부족하거나 다른 건물이 자리 잡고 있습니다! (필요 크기: ${b.w}x${b.h})`);
      return;
    }

    if (shekels < b.cost) {
      alert(`세겔이 부족합니다! (필요: ${b.cost} 세겔)`);
      return;
    }

    playTycoonAudio(b.category === 'holy' ? 'shofar' : 'hammer');
    setShekels(prev => prev - b.cost);

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
    setGrid(next);
    saveGameState();
  };

  const handlePointerDown = (e) => {
    if (e.target.tagName !== 'svg' && e.target.tagName !== 'rect') return;
    isDraggingRef.current = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    dragStartRef.current = { x: clientX, y: clientY, origX: viewBoxOrigin.x, origY: viewBoxOrigin.y };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dx = (clientX - dragStartRef.current.x) * 1.2;
    const dy = (clientY - dragStartRef.current.y) * 1.2;

    setViewBoxOrigin(prev => ({
      ...prev,
      x: dragStartRef.current.origX - dx,
      y: dragStartRef.current.origY - dy
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const renderList = useMemo(() => {
    const list = [];
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const cell = grid?.[r]?.[c];
        if (cell && cell.isRoot) {
          const depth = (r + (cell.h || 1) - 1) + (c + (cell.w || 1) - 1);
          list.push({ r, c, cell, depth });
        }
      }
    }
    return list.sort((a, b) => a.depth - b.depth);
  }, [grid]);

  const activeQuest = MATTHEW_CAMPAIGN[currentQuestIdx] || MATTHEW_CAMPAIGN[0];
  const selectedMeta = BUILDINGS[selectedTool] || BUILDINGS.road;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans bg-[#EDE3D1] text-stone-900">
      
      {/* ── 1. 마태복음 타이쿤 HUD ── */}
      <header className="px-3 py-2 bg-[#D1BE9F] border-b-2 border-[#AC9471] flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveScreen('interlinear_kids')} 
            className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#78350F] text-white shadow-xs hover:bg-[#92400E] cursor-pointer"
          >
            ◀ 탐험관
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-[#78350F] flex items-center gap-1">
              <span>🏛️</span> 예루살렘 타이쿤 : 마태복음 연대기
            </h1>
            <span className="text-[10px] font-bold text-stone-600 block">
              A.D. {year}년 • {SEASONS[seasonIdx]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <span className="text-xs font-black text-amber-900 bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-amber-300 shrink-0">
            💰 {shekels} 세겔
          </span>
          <span className="text-xs font-black text-blue-900 bg-[#E0F2FE] px-2 py-0.5 rounded-lg border border-blue-300 shrink-0">
            👥 {population}명
          </span>
          <span className="text-xs font-black text-emerald-900 bg-[#DCFCE7] px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
            🍞 {food} 빵
          </span>
          <span className="text-xs font-black text-sky-900 bg-[#E0F2FE] px-2 py-0.5 rounded-lg border border-sky-300 shrink-0">
            🐟 {fish} 생선
          </span>
          <span className="text-xs font-black text-purple-900 bg-[#F3E8FF] px-2 py-0.5 rounded-lg border border-purple-300 shrink-0">
            🍇 {wine} 포도주
          </span>
          <span className="text-xs font-black text-rose-900 bg-[#FFE4E6] px-2 py-0.5 rounded-lg border border-rose-300 shrink-0">
            🕊️ 신앙 {faith}%
          </span>

          <div className="flex items-center gap-1 bg-[#C0AB8B] p-0.5 rounded-lg border border-[#9E8767]">
            <button
              onClick={() => setSimSpeed(s => s === 0 ? 1 : 0)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${simSpeed === 0 ? 'bg-rose-500 text-white' : 'text-stone-800'}`}
            >
              {simSpeed === 0 ? '▶' : '❚❚'}
            </button>
            <button
              onClick={() => setSimSpeed(s => s === 2 ? 1 : 2)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${simSpeed === 2 ? 'bg-amber-700 text-white font-black' : 'text-stone-800'}`}
            >
              {simSpeed === 2 ? '2x' : '1x'}
            </button>
            <button
              onClick={() => setViewBoxOrigin(v => ({ ...v, zoom: Math.min(1.5, v.zoom + 0.15) }))}
              className="px-1 text-xs font-black text-stone-800 hover:text-white"
            >
              +
            </button>
            <button
              onClick={() => setViewBoxOrigin(v => ({ ...v, zoom: Math.max(0.65, v.zoom - 0.15) }))}
              className="px-1 text-xs font-black text-stone-800 hover:text-white"
            >
              -
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 마태복음 퀘스트 배너 ── */}
      <div className="bg-[#FFFDF7] border-b border-[#D8C7B0] px-3 py-1.5 flex items-center justify-between text-xs shrink-0 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">📜</span>
          <div className="truncate">
            <span className="font-black text-[#78350F] mr-1.5">[{activeQuest?.title}]</span>
            <span className="text-stone-600 font-bold">{activeQuest?.targetDesc}</span>
          </div>
        </div>
        <button
          onClick={() => setShowQuestModal(true)}
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500 hover:bg-amber-600 text-white shrink-0 cursor-pointer"
        >
          말씀 보기 📖
        </button>
      </div>

      {/* ── 3. 🌟 시저 3 & 파라오급 2.5D 아이소메트릭 벡터 월드 (플라스틱 박스 완전 퇴출) ── */}
      <div 
        className="flex-1 relative overflow-hidden bg-[#E2D4BE] cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg 
          viewBox={`${viewBoxOrigin.x - 620 * viewBoxOrigin.zoom} ${viewBoxOrigin.y - 140 * viewBoxOrigin.zoom} ${1240 * viewBoxOrigin.zoom} ${760 * viewBoxOrigin.zoom}`}
          className="w-full h-full pointer-events-auto select-none"
        >
          <defs>
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECE0CD" />
              <stop offset="100%" stopColor="#D9C7AC" />
            </linearGradient>
            
            <linearGradient id="wallSun" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FAF2E6" />
              <stop offset="100%" stopColor="#DFD0BC" />
            </linearGradient>
            <linearGradient id="wallShade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C9B69C" />
              <stop offset="100%" stopColor="#9C876E" />
            </linearGradient>
            <linearGradient id="terracottaRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C85A32" />
              <stop offset="100%" stopColor="#8C3518" />
            </linearGradient>
            <linearGradient id="goldFrieze" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <filter id="tileGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.95" />
            </filter>
            <filter id="buildingShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="5" dy="9" stdDeviation="6" floodColor="#5C381E" floodOpacity="0.35" />
            </filter>
          </defs>

          <rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#groundGrad)" />

          {/* 1. 바닥 타일 & 판석 도로 렌더링 */}
          {Array.from({ length: MAP_SIZE }).map((_, r) =>
            Array.from({ length: MAP_SIZE }).map((_, c) => {
              const { x: cx, y: cy } = getTileCenter(r, c);
              const isHovered = hoverTile && hoverTile.r === r && hoverTile.c === c;
              const cell = grid?.[r]?.[c];
              const hw = TILE_W / 2;
              const hh = TILE_H / 2;
              const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;

              return (
                <g key={`tile_${r}_${c}`}>
                  <polygon
                    points={points}
                    fill={cell?.type === 'road' ? '#C2B095' : isHovered ? '#FDE68A' : '#E0D0B6'}
                    stroke={isHovered ? '#F59E0B' : '#C7B59A'}
                    strokeWidth={isHovered ? 2.5 : 0.8}
                    className="cursor-pointer transition-colors"
                    onPointerEnter={() => setHoverTile({ r, c })}
                    onClick={() => handleTileAction(r, c)}
                  />

                  {cell?.type === 'road' && (() => {
                    const { n, s, w, e } = getRoadNeighbors(r, c);
                    return (
                      <g stroke="#7D674B" strokeWidth="5" strokeLinecap="round" pointerEvents="none">
                        {n && <line x1={cx} y1={cy} x2={cx} y2={cy - hh} />}
                        {s && <line x1={cx} y1={cy} x2={cx} y2={cy + hh} />}
                        {w && <line x1={cx} y1={cy} x2={cx - hw} y2={cy} />}
                        {e && <line x1={cx} y1={cy} x2={cx + hw} y2={cy} />}
                        <circle cx={cx} cy={cy} r="3.5" fill="#5E4C34" stroke="none" />
                      </g>
                    );
                  })()}
                </g>
              );
            })
          )}

          {/* 2. 건설 프리뷰 */}
          {hoverTile && selectedMeta && selectedTool !== 'demolish' && selectedTool !== 'inspect' && (() => {
            const { r, c } = hoverTile;
            const w = selectedMeta.w || 1;
            const h = selectedMeta.h || 1;
            const isValid = canBuildAt(r, c, w, h);

            const topPt = `${(c - r) * (TILE_W / 2)},${(c + r) * (TILE_H / 2) - TILE_H / 2}`;
            const rightPt = `${(c + w - r) * (TILE_W / 2)},${(c + w - 1 + r) * (TILE_H / 2)}`;
            const botPt = `${(c + w - r - h) * (TILE_W / 2)},${(c + r + w + h - 1) * (TILE_H / 2)}`;
            const leftPt = `${(c - r - h) * (TILE_W / 2)},${(c + r + h - 1) * (TILE_H / 2)}`;

            return (
              <polygon
                points={`${topPt} ${rightPt} ${botPt} ${leftPt}`}
                fill={isValid ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.5)'}
                stroke={isValid ? '#F59E0B' : '#EF4444'}
                strokeWidth="2.5"
                filter="url(#tileGlow)"
                pointerEvents="none"
              />
            );
          })()}

          {/* 3. Z-Order 깊이 우선 정렬 건축물 */}
          {renderList.map(({ r, c, cell }) => {
            const w = cell.w || 1;
            const h = cell.h || 1;

            const topX = (c - r) * (TILE_W / 2);
            const topY = (c + r) * (TILE_H / 2) - TILE_H / 2;
            const rightX = (c + w - r) * (TILE_W / 2);
            const rightY = (c + w - 1 + r) * (TILE_H / 2);
            const botX = (c + w - r - h) * (TILE_W / 2);
            const botY = (c + r + w + h - 1) * (TILE_H / 2);
            const leftX = (c - r - h) * (TILE_W / 2);
            const leftY = (c + r + h - 1) * (TILE_H / 2);

            const floorPoly = `${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}`;

            return (
              <g 
                key={`bldg_${r}_${c}`}
                filter="url(#buildingShadow)"
                className="cursor-pointer"
                onClick={() => handleTileAction(r, c)}
                onPointerEnter={() => setHoverTile({ r, c })}
              >
                {/* 3x3 헤롯 제2성전 */}
                {cell.type === 'temple' && (() => {
                  const H = 105;
                  return (
                    <g>
                      <polygon points={floorPoly} fill="#D1BE9F" stroke="#8C7A5D" strokeWidth="1.2" />
                      <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - 14} ${leftX},${leftY - 14}`} fill="url(#wallSun)" />
                      <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - 14} ${botX},${botY - 14}`} fill="url(#wallShade)" />
                      
                      <polygon points={`${leftX + 20},${leftY - 14} ${botX},${botY - 14} ${botX},${botY - H} ${leftX + 20},${leftY - H}`} fill="url(#wallSun)" stroke="#78654B" strokeWidth="1" />
                      <polygon points={`${botX},${botY - 14} ${rightX - 20},${rightY - 14} ${rightX - 20},${rightY - H} ${botX},${botY - H}`} fill="url(#wallShade)" stroke="#78654B" strokeWidth="1" />
                      <polygon points={`${topX},${topY - H} ${rightX - 20},${rightY - H} ${botX},${botY - H} ${leftX + 20},${leftY - H}`} fill="url(#goldFrieze)" stroke="#B45309" strokeWidth="1.5" />
                      
                      {[-24, -12, 0, 12, 24].map((offset, i) => (
                        <g key={i}>
                          <rect x={botX - 3 + offset} y={botY - H + 26} width="6" height={H - 42} fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" rx="1.5" />
                          <circle cx={botX + offset} cy={botY - H + 26} r="4" fill="#F59E0B" />
                        </g>
                      ))}

                      <rect x={botX - 12} y={botY - 26} width="24" height="12" fill="#78350F" stroke="#451A03" strokeWidth="1" rx="2" />
                      <circle cx={botX} cy={botY - 22} r="4" fill="#EF4444" />
                      <path d={`M ${botX} ${botY - 26} Q ${botX - 6} ${botY - 42} ${botX} ${botY - 58} Q ${botX + 8} ${botY - 74} ${botX} ${botY - 90}`} stroke="rgba(240, 230, 220, 0.75)" strokeWidth="6" strokeLinecap="round" fill="none" />

                      <rect x={botX - 26} y={botY - H + 10} width="52" height="16" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" rx="3" />
                      <text x={botX} y={botY - H + 22} fontSize="11" fontWeight="900" textAnchor="middle" fill="#000" pointerEvents="none">헤롯 제2성전</text>
                    </g>
                  );
                })()}

                {/* 2x2 가버나움 백색 회당 */}
                {cell.type === 'synagogue' && (() => {
                  const H = 60;
                  return (
                    <g>
                      <polygon points={floorPoly} fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                      <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - H} ${leftX},${leftY - H}`} fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                      <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - H} ${botX},${botY - H}`} fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                      <polygon points={`${topX},${topY - H} ${rightX},${rightY - H} ${botX},${botY - H} ${leftX},${leftY - H}`} fill="#94A3B8" stroke="#475569" strokeWidth="1" />
                      
                      <polygon points={`${botX - 24},${botY - H} ${botX},${botY - H - 18} ${botX + 24},${botY - H}`} fill="#F1F5F9" stroke="#64748B" strokeWidth="1" />
                      {[-18, -6, 6, 18].map((offset, i) => (
                        <rect key={i} x={botX - 2.5 + offset} y={botY - H + 12} width="5" height={H - 16} fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" rx="1" />
                      ))}
                      <text x={botX} y={botY - H - 2} fontSize="12" textAnchor="middle" pointerEvents="none">🕎</text>
                    </g>
                  );
                })()}

                {/* 2x2 대리석 분수 광장 */}
                {cell.type === 'fountain' && (
                  <g>
                    <polygon points={floorPoly} fill="#E2E8F0" stroke="#0284C7" strokeWidth="1.5" />
                    <line x1={topX} y1={topY} x2={botX} y2={botY} stroke="#38BDF8" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1={leftX} y1={leftY} x2={rightX} y2={rightY} stroke="#38BDF8" strokeWidth="1" strokeDasharray="4,4" />
                    <ellipse cx={botX} cy={botY - 14} rx="26" ry="14" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
                    <ellipse cx={botX} cy={botY - 18} rx="16" ry="8" fill="#38BDF8" />
                    
                    <rect x={botX - 3} y={botY - 36} width="6" height="18" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" rx="2" />
                    <ellipse cx={botX} cy={botY - 40} rx="5" ry="3" fill="#E0F2FE" />
                    <line x1={botX} y1={botY - 38} x2={botX} y2={botY - 20} stroke="#E0F2FE" strokeWidth="2" />
                    
                    {[-26, 26].map((ox, i) => (
                      <g key={i}>
                        <line x1={botX + ox} y1={botY - 8} x2={botX + ox} y2={botY - 26} stroke="#5C381E" strokeWidth="2.5" />
                        <ellipse cx={botX + ox} cy={botY - 28} rx="5" ry="12" fill="#15803D" />
                      </g>
                    ))}
                  </g>
                )}

                {/* 2x2 갈릴리 밀밭 & 방앗간 */}
                {cell.type === 'wheat_farm' && (
                  <g>
                    <polygon points={floorPoly} fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.2" />
                    {[-10, 0, 10].map((dy, i) => (
                      <line key={i} x1={leftX + 8} y1={leftY + dy} x2={rightX - 8} y2={rightY + dy} stroke="#EAB308" strokeWidth="1.5" strokeDasharray="6,4" />
                    ))}
                    <polygon points={`${botX - 16},${botY - 8} ${botX},${botY} ${botX + 16},${botY - 8} ${botX},${botY - 16}`} fill="#B45309" />
                    <rect x={botX - 9} y={botY - 40} width="18" height="26" fill="#E5D8C5" stroke="#78350F" strokeWidth="1" rx="2" />
                    
                    <line x1={botX - 20} y1={botY - 42} x2={botX + 20} y2={botY - 18} stroke="#78350F" strokeWidth="2.5" />
                    <line x1={botX - 20} y1={botY - 18} x2={botX + 20} y2={botY - 42} stroke="#78350F" strokeWidth="2.5" />
                    <circle cx={botX} cy={botY - 30} r="3" fill="#D97706" />
                  </g>
                )}

                {/* 2x2 갈릴리 어선 선착장 */}
                {cell.type === 'fishery' && (
                  <g>
                    <polygon points={floorPoly} fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
                    <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - 12} ${leftX},${leftY - 12}`} fill="#854D0E" stroke="#451A03" strokeWidth="1" />
                    <line x1={leftX + 10} y1={leftY + 4} x2={botX - 10} y2={botY + 4} stroke="#A16207" strokeWidth="1" />
                    
                    <ellipse cx={botX + 6} cy={botY - 16} rx="18" ry="9" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
                    <line x1={botX + 6} y1={botY - 16} x2={botX + 6} y2={botY - 36} stroke="#B45309" strokeWidth="2.5" />
                    <polygon points={`${botX + 6},${botY - 36} ${botX + 20},${botY - 26} ${botX + 6},${botY - 20}`} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                    <circle cx={botX - 8} cy={botY - 12} r="4" fill="#0284C7" />
                    <text x={botX - 18} y={botY - 8} fontSize="14" pointerEvents="none">🐟</text>
                  </g>
                )}

                {/* 2x2 시장 복합체 */}
                {['bread_market', 'fish_market', 'sacrifice_market'].includes(cell.type) && (() => {
                  const H = 38;
                  return (
                    <g>
                      <polygon points={floorPoly} fill="#D4C3A3" stroke="#8C7A5D" strokeWidth="1" />
                      <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - H} ${leftX},${leftY - H}`} fill="url(#wallSun)" stroke="#8C7A5D" strokeWidth="1" />
                      <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - H} ${botX},${botY - H}`} fill="url(#wallShade)" stroke="#8C7A5D" strokeWidth="1" />
                      <polygon points={`${topX},${topY - H} ${rightX},${rightY - H} ${botX},${botY - H} ${leftX},${leftY - H}`} fill={cell.type === 'bread_market' ? '#D97706' : cell.type === 'fish_market' ? '#0284C7' : '#9333EA'} stroke="#3B1C0B" strokeWidth="1" />
                      
                      {[-18, -6, 6, 18].map((ox, i) => (
                        <circle key={i} cx={botX + ox} cy={botY - H + 2} r="3" fill="#FFFFFF" />
                      ))}
                      <text x={botX} y={botY - 14} fontSize="18" textAnchor="middle" pointerEvents="none">
                        {cell.type === 'bread_market' ? '🍞' : cell.type === 'fish_market' ? '🐟' : '🏺'}
                      </text>
                    </g>
                  );
                })()}

                {/* 2x2 골고다 언덕 */}
                {cell.type === 'golgotha' && (
                  <g>
                    <polygon points={floorPoly} fill="#57534E" stroke="#292524" strokeWidth="1.2" />
                    <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - 32} ${leftX},${leftY - 32}`} fill="#44403C" />
                    <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - 32} ${botX},${botY - 32}`} fill="#292524" />
                    <polygon points={`${topX},${topY - 32} ${rightX},${rightY - 32} ${botX},${botY - 32} ${leftX},${leftY - 32}`} fill="#1C1917" />
                    
                    <text x={botX} y={botY - 38} fontSize="26" textAnchor="middle" pointerEvents="none">✝️</text>
                    <text x={botX - 20} y={botY - 26} fontSize="16" textAnchor="middle" pointerEvents="none">✝️</text>
                    <text x={botX + 20} y={botY - 26} fontSize="16" textAnchor="middle" pointerEvents="none">✝️</text>
                  </g>
                )}

                {/* 1x1 주택 5단계 진화형 가옥 */}
                {cell.type === 'house' && (() => {
                  const lvl = cell.level || 1;
                  const H = 16 + lvl * 10;
                  const tier = HOUSE_TIERS[lvl - 1] || HOUSE_TIERS[0];

                  return (
                    <g>
                      {lvl === 1 && (
                        <g>
                          <polygon points={`${leftX + 6},${botY - 2} ${botX},${botY - H} ${rightX - 6},${botY - 2}`} fill="#5C4033" stroke="#2D1E12" strokeWidth="1" />
                          <line x1={botX} y1={botY - H} x2={botX} y2={botY + 2} stroke="#3E2723" strokeWidth="2" />
                          <circle cx={botX - 10} cy={botY + 2} r="3" fill="#EF4444" />
                        </g>
                      )}

                      {lvl >= 2 && (
                        <g>
                          <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - H} ${leftX},${leftY - H}`} fill={lvl === 5 ? '#FFFFFF' : 'url(#wallSun)'} stroke="#7D674B" strokeWidth="0.8" />
                          <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - H} ${botX},${botY - H}`} fill={lvl === 5 ? '#E2E8F0' : 'url(#wallShade)'} stroke="#7D674B" strokeWidth="0.8" />
                          <polygon points={`${topX},${topY - H} ${rightX},${rightY - H} ${botX},${botY - H} ${leftX},${leftY - H}`} fill={lvl === 5 ? 'url(#goldFrieze)' : lvl >= 4 ? 'url(#terracottaRoof)' : '#8C6239'} stroke="#451A03" strokeWidth="1" />
                          
                          {lvl === 2 && (
                            <g>
                              {[-8, -2, 4].map((ox, i) => (
                                <circle key={i} cx={botX + ox} cy={botY - H + 6} r="1.5" fill="#5C381E" />
                              ))}
                              <rect x={botX - 6} y={botY - H + 12} width="5" height="8" fill="#3B1C0B" rx="1" />
                            </g>
                          )}

                          {lvl >= 3 && (
                            <g>
                              <line x1={leftX + 4} y1={leftY} x2={leftX + 16} y2={leftY - H + 10} stroke="#5C4033" strokeWidth="2.5" />
                              <rect x={botX + 4} y={botY - H + 8} width="6" height="6" fill="#3B1C0B" rx="1" />
                              <ellipse cx={botX - 4} cy={botY - H - 2} rx="2.5" ry="4" fill="#B45309" />
                            </g>
                          )}

                          {lvl >= 4 && (
                            <g>
                              <rect x={botX - 12} y={botY - H + 4} width="24" height="6" fill="#A16207" rx="1" />
                              <line x1={botX - 12} y1={botY - H + 4} x2={botX + 12} y2={botY - H + 4} stroke="#F59E0B" strokeWidth="1.5" />
                            </g>
                          )}

                          {lvl === 5 && (
                            <g>
                              <rect x={botX - 10} y={botY - H + 12} width="4" height={H - 16} fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.8" rx="1" />
                              <rect x={botX + 8} y={botY - H + 12} width="4" height={H - 16} fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.8" rx="1" />
                              <polygon points={`${botX - 14},${botY - H + 12} ${botX},${botY - H + 2} ${botX + 14},${botY - H + 12}`} fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })()}

                {/* 1x1 수로 및 우물 */}
                {cell.type === 'aqueduct' && (
                  <g>
                    <rect x={botX - 8} y={botY - 16} width="16" height="20" fill="url(#wallSun)" stroke="#78654B" strokeWidth="1" rx="2" />
                    <path d={`M ${botX - 5} ${botY} Q ${botX} ${botY - 8} ${botX + 5} ${botY} Z`} fill="#C2B095" />
                    <rect x={botX - 7} y={botY - 18} width="14" height="5" fill="#0284C7" rx="1.5" />
                  </g>
                )}
                {cell.type === 'well' && (
                  <g>
                    <ellipse cx={botX} cy={botY - 6} rx="10" ry="6" fill="#78716C" stroke="#292524" strokeWidth="1.2" />
                    <ellipse cx={botX} cy={botY - 7} rx="7" ry="3.5" fill="#0284C7" />
                    <line x1={botX - 8} y1={botY - 6} x2={botX - 8} y2={botY - 20} stroke="#78350F" strokeWidth="2" />
                    <line x1={botX + 8} y1={botY - 6} x2={botX + 8} y2={botY - 20} stroke="#78350F" strokeWidth="2" />
                    <line x1={botX - 8} y1={botY - 20} x2={botX + 8} y2={botY - 20} stroke="#78350F" strokeWidth="2" />
                    <text x={botX} y={botY - 14} fontSize="12" textAnchor="middle" pointerEvents="none">🪣</text>
                  </g>
                )}

                {/* 성벽 / 망대 / 성문 */}
                {['wall', 'tower', 'gate'].includes(cell.type) && (() => {
                  const H = 40;
                  return (
                    <g>
                      <polygon points={`${leftX},${leftY} ${botX},${botY} ${botX},${botY - H} ${leftX},${leftY - H}`} fill="#94A3B8" stroke="#334155" strokeWidth="1.2" />
                      <polygon points={`${botX},${botY} ${rightX},${rightY} ${rightX},${rightY - H} ${botX},${botY - H}`} fill="#64748B" stroke="#334155" strokeWidth="1.2" />
                      {[-10, 0, 10].map((ox, i) => (
                        <rect key={i} x={botX - 3 + ox} y={botY - H - 4} width="6" height="5" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                      ))}
                      <text x={botX} y={botY - 16} fontSize="14" textAnchor="middle" pointerEvents="none">
                        {cell.type === 'tower' ? '🗼' : cell.type === 'gate' ? '🚪' : '🧱'}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* 4. 도로 위 살아 움직이는 보행자 (예수님 & 제자 & 나귀) */}
          {walkers.map(w => {
            const { x: cx, y: cy } = getTileCenter(w.r, w.c);
            if (w.type === 'jesus') {
              return (
                <g key={w.id} pointerEvents="none">
                  <circle cx={cx} cy={cy - 18} r="11" fill="#FBBF24" opacity="0.85" filter="url(#tileGlow)" />
                  <circle cx={cx} cy={cy - 18} r="6.5" fill="#FFFFFF" />
                  <rect x={cx - 5.5} y={cy - 10} width="11" height="16" fill="#FFFFFF" rx="2.5" />
                  <rect x={cx - 2} y={cy - 10} width="4" height="16" fill="#DC2626" />
                </g>
              );
            } else if (w.type === 'disciple') {
              return (
                <g key={w.id} pointerEvents="none">
                  <circle cx={cx - 12} cy={cy - 12} r="5.5" fill="#FBBF24" />
                  <rect x={cx - 15} y={cy - 5} width="8" height="13" fill="#0284C7" rx="2" />
                </g>
              );
            } else {
              return (
                <g key={w.id} pointerEvents="none">
                  <text x={cx + 12} y={cy + 4} fontSize="18">🐪</text>
                </g>
              );
            }
          })}
        </svg>

        <div className="absolute top-2 left-2 bg-black/65 text-white text-[10px] px-2.5 py-1 rounded-md backdrop-blur-xs pointer-events-none">
          💡 원하는 건물을 고르고 타일을 터치하세요! (1x1, 2x2, 3x3 복합 대형 건축 지원)
        </div>
      </div>

      {/* ── 4. 하단 건축 카탈로그 (Pharaoh & Caesar III 스타일) ── */}
      <div className="bg-[#D1BE9F] border-t-2 border-[#AC9471] p-2 shrink-0 z-20 space-y-1.5 shadow-xl">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                playTycoonAudio('hammer');
                setActiveCategory(cat.id);
                const first = Object.values(BUILDINGS).find(b => b.category === cat.id);
                if (first) setSelectedTool(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#78350F] text-white shadow-sm scale-102'
                  : 'bg-[#EAE0CD] text-stone-700 hover:bg-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}

          <button
            onClick={() => { playTycoonAudio('coin'); setSelectedTool('inspect'); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedTool === 'inspect' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-100 text-indigo-900'
            }`}
          >
            🔍 정보조회
          </button>

          <button
            onClick={() => { playTycoonAudio('demolish'); setSelectedTool('demolish'); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedTool === 'demolish' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-100 text-rose-800'
            }`}
          >
            🚜 철거
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 overflow-x-auto hide-scrollbar max-h-24 py-0.5">
          {Object.values(BUILDINGS)
            .filter(b => b.category === activeCategory)
            .map(b => (
              <button
                key={b.id}
                onClick={() => { playTycoonAudio('hammer'); setSelectedTool(b.id); }}
                className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                  selectedTool === b.id
                    ? 'bg-[#78350F] text-white border-[#5A250B] scale-105 shadow-md font-black'
                    : 'bg-[#F4ECE1] hover:bg-white text-stone-800 border-[#C4B094]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-[9px] bg-black/10 px-1 rounded font-mono font-bold">{b.w}x{b.h}</span>
                </div>
                <span className="text-[10px] font-black truncate w-full mt-0.5">{b.name}</span>
                <span className="text-[9px] opacity-80 font-mono">{b.cost} 세겔</span>
              </button>
            ))}
        </div>

        {selectedMeta && (
          <div className="text-[10.5px] font-bold text-stone-700 px-1 truncate flex items-center justify-between">
            <span>ℹ️ {selectedMeta.name}: {selectedMeta.desc}</span>
            <span className="font-mono text-[#78350F] font-black">크기: {selectedMeta.w}x{selectedMeta.h} 타일</span>
          </div>
        )}
      </div>

      {/* ── 5. 마태복음 말씀 퀘스트 모달 ── */}
      {showQuestModal && activeQuest && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-[32px] bg-[#FFFDF7] border-4 border-[#B45309] p-5 shadow-2xl text-left space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-amber-200 pb-2">
              <span className="text-3xl">📜</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#78350F]">{activeQuest.title}</h3>
                <span className="text-[10.5px] text-amber-700 font-mono font-bold">{activeQuest.verse}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold leading-relaxed text-stone-800 break-keep">
              "{activeQuest.summary}"
            </p>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[11px] font-black text-amber-900 block">🎯 도시 건설 사명:</span>
              <p className="text-xs font-bold text-stone-700">{activeQuest.targetDesc}</p>
            </div>

            <button
              onClick={() => setShowQuestModal(false)}
              className="w-full py-3 rounded-2xl bg-[#B45309] hover:bg-[#78350F] text-white font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
            >
              순종하여 건설하기 (아멘)
            </button>
          </div>
        </div>
      )}

      {/* ── 6. 시민 자문관 & 건물 인스펙터 모달 ── */}
      {inspectedTile && (
        <div className="fixed inset-0 z-[1150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="w-full max-w-xs rounded-3xl bg-[#FFFDF7] border-2 border-[#78350F] p-4 shadow-xl text-left space-y-2.5">
            <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
              <span className="font-black text-xs text-[#78350F]">🏛️ 건물 상세 인스펙터</span>
              <button onClick={() => setInspectedTile(null)} className="text-xs font-bold text-stone-400 p-1 cursor-pointer">✕</button>
            </div>

            {inspectedTile.type === 'house' ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.emoji}</span>
                  <div>
                    <span className="font-black text-stone-900 block">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono">Tier {inspectedTile.level || 1} / 5</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-[11px] font-bold text-stone-700">
                  <p>👥 거주민: {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.pop}명</p>
                  <p>💰 세금 수입: 매 턴 {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.tax} 세겔</p>
                  <p className="text-amber-800">
                    {inspectedTile.level === 1 && "👉 수로나 우물을 연결하면 흙벽돌집으로 진화합니다!"}
                    {inspectedTile.level === 2 && "👉 빵 장터를 지어 식량을 공급하면 석회암 가옥으로 진화합니다!"}
                    {inspectedTile.level === 3 && "👉 생선 시장과 회당을 공급하면 2층 저택으로 진화합니다!"}
                    {inspectedTile.level === 4 && "👉 광장 분수대와 포도주, 성전 예배가 갖춰지면 대리석 궁정으로 진화합니다!"}
                    {inspectedTile.level === 5 && "🌟 최고 등급의 대리석 궁정입니다!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 block">{BUILDINGS[inspectedTile.type]?.name}</span>
                  <span className="font-mono text-[10px] bg-stone-200 px-1 rounded font-bold">
                    {BUILDINGS[inspectedTile.type]?.w}x{BUILDINGS[inspectedTile.type]?.h}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] font-medium">{BUILDINGS[inspectedTile.type]?.desc}</p>
              </div>
            )}

            <button
              onClick={() => setInspectedTile(null)}
              className="w-full py-2 rounded-xl bg-[#78350F] text-white text-xs font-bold cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
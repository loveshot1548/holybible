// src/pages/JerusalemTycoon.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTycoonStore, MAP_SIZE } from '../games/jerusalem/core/store';
import GameEngine from '../games/jerusalem/components/GameEngine';
import { BUILDINGS, CATEGORIES, HOUSE_TIERS } from '../games/jerusalem/data/buildings';
import { MATTHEW_CAMPAIGN } from '../games/jerusalem/data/quests';

// =====================================================================
// 🎵 1. 고전 하프(Lyre) & 효과음 Web Audio 신시사이저
// =====================================================================
const playTycoonAudio = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'hammer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === 'coin') {
      [1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.18);
      });
    } else if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.35);
      });
    }
  } catch (_) {}
};

const TRADE_ROUTES = [
  { id: 'capernaum', city: '가버나움 어시장', resource: 'fish', name: '생선', icon: '🐟', buyPrice: 18, sellPrice: 12, batch: 10, desc: '갈릴리 호수의 싱싱한 물고기 교역' },
  { id: 'bethlehem', city: '베들레헴 곡창지대', resource: 'food', name: '생명의 빵', icon: '🍞', buyPrice: 15, sellPrice: 10, batch: 10, desc: '유대 들녘의 밀과 보리떡 교역' },
  { id: 'gethsemane', city: '감람산 기름틀 조합', resource: 'oil', name: '감람유', icon: '🫒', buyPrice: 28, sellPrice: 20, batch: 10, desc: '성전 등불과 치유를 위한 순수 올리브유' },
  { id: 'cana', city: '가나 포도원 상단', resource: 'wine', name: '포도주', icon: '🍇', buyPrice: 35, sellPrice: 25, batch: 10, desc: '혼인 잔치와 절기 축제를 위한 최상급 포도주' }
];

const SACRED_MIRACLES = [
  {
    id: 'five_loaves',
    title: '오병이어의 기적 (마 14:19)',
    costShekels: 80,
    desc: '하늘을 우러러 축사하시니 빵 +80, 생선 +60이 창고에 즉시 가득 찹니다.',
    effect: (state) => ({
      shekels: state.shekels - 80,
      food: (state.food || 0) + 80,
      fish: (state.fish || 0) + 60,
      faith: Math.min(100, (state.faith || 50) + 10)
    })
  },
  {
    id: 'cana_wedding',
    title: '가나의 혼인잔치 축복 (요 2:9)',
    costShekels: 120,
    desc: '물 항아리가 변하여 최상급 포도주 +70, 감람유 +50이 공급되고 신앙이 상승합니다.',
    effect: (state) => ({
      shekels: state.shekels - 120,
      wine: (state.wine || 0) + 70,
      oil: (state.oil || 0) + 50,
      faith: Math.min(100, (state.faith || 50) + 15)
    })
  },
  {
    id: 'pentecost_revival',
    title: '절기 대부흥과 성전 봉헌 (마 21:9)',
    costShekels: 200,
    desc: '도시의 모든 주택 중 진화 가능한 가옥들을 즉시 1단계씩 격상시키고 신앙을 100%로 채웁니다.',
    isHouseUpgrade: true
  }
];

export default function JerusalemTycoon({ setActiveScreen }) {
  const store = useTycoonStore();
  const {
    grid, walkers, shekels, food, fish, oil, wine, faith, population, year, seasonIdx,
    simSpeed, setSimSpeed, selectedTool, setSelectedTool,
    activeCategory, setActiveCategory, tickSimulation,
    currentQuestIdx, showQuestModal, setShowQuestModal,
    inspectedTile, setInspectedTile, notification, setNotification
  } = store;

  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(true);
  const [overlayMode, setOverlayMode] = useState('normal');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [advisorModalTab, setAdvisorModalTab] = useState(null);
  const [taxRate, setTaxRate] = useState(9);
  const [selectedWalker, setSelectedWalker] = useState(null);
  const [floatingEvents, setFloatingEvents] = useState([]);
  const [harvestBubbles, setHarvestBubbles] = useState([]); // 💬 모바일 게임식 터치 수확 버블!

  const minimapCanvasRef = useRef(null);

  const SEASONS = ['유월절 (봄)', '오순절 (여름)', '초막절 (가을)', '수전절 (겨울)'];
  const activeQuest = MATTHEW_CAMPAIGN[currentQuestIdx] || MATTHEW_CAMPAIGN[0];
  const selectedMeta = BUILDINGS[selectedTool] || BUILDINGS.road;

  const spawnFloatingText = useCallback((r, c, text, color = '#FBBF24') => {
    const id = Date.now() + Math.random();
    setFloatingEvents(prev => [...prev.slice(-18), { id, r, c, text, color, createdAt: Date.now() }]);
  }, []);

  // 💬 수확 버블 단일 터치 수확 핸들러
  const handleHarvestBubbleClick = useCallback((bubble) => {
    playTycoonAudio('coin');
    setHarvestBubbles(prev => prev.filter(b => b.id !== bubble.id));

    const cur = useTycoonStore.getState();
    const rewardShekels = bubble.bonusShekels || 12;
    const resKey = bubble.resource;
    const resAmt = bubble.amount || 10;

    const nextState = {
      shekels: cur.shekels + rewardShekels
    };
    if (resKey && cur[resKey] !== undefined) {
      nextState[resKey] = Math.min(999, (cur[resKey] || 0) + resAmt);
    }
    useTycoonStore.setState(nextState);
    spawnFloatingText(bubble.r, bubble.c, `+${resAmt} ${bubble.icon} (+${rewardShekels}💰)`, '#34D399');
  }, [spawnFloatingText]);

  // ⚡ 원터치 전체 수확 핸들러
  const handleHarvestAllBubbles = useCallback(() => {
    if (harvestBubbles.length === 0) return;
    playTycoonAudio('fanfare');
    const cur = useTycoonStore.getState();
    let addShekels = 0;
    const addRes = { food: 0, fish: 0, oil: 0, wine: 0, faith: 0 };

    harvestBubbles.forEach(b => {
      addShekels += b.bonusShekels || 12;
      if (b.resource && addRes[b.resource] !== undefined) {
        addRes[b.resource] += b.amount || 10;
      }
      spawnFloatingText(b.r, b.c, `+${b.amount || 10} ${b.icon}`, '#FDE047');
    });

    useTycoonStore.setState({
      shekels: cur.shekels + addShekels,
      food: cur.food + addRes.food,
      fish: cur.fish + addRes.fish,
      oil: cur.oil + addRes.oil,
      wine: cur.wine + addRes.wine,
      faith: Math.min(100, cur.faith + addRes.faith)
    });
    setHarvestBubbles([]);
    setNotification(`⚡ 도시 전체 생산물 일괄 수확 완료! (+${addShekels} 세겔 보너스)`);
  }, [harvestBubbles, spawnFloatingText, setNotification]);

  // 🏰 원클릭 ‘솔로몬의 2.5D 왕립 성읍’ 샘플 조경 생성기
  const handleBuildRoyalShowcaseCity = () => {
    const newGrid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null));
    const placeOnGrid = (r, c, type, w = 1, h = 1, level = 1) => {
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (r + dr < MAP_SIZE && c + dc < MAP_SIZE) {
            newGrid[r + dr][c + dc] = dr === 0 && dc === 0
              ? { type, w, h, level, isRoot: true, r, c }
              : { isOccupied: true, rootR: r, rootC: c, r: r + dr, c: c + dc };
          }
        }
      }
    };

    placeOnGrid(3, 3, 'temple', 3, 3, 1);

    for (let i = 1; i < MAP_SIZE - 2; i++) {
      if (!newGrid[7][i]) placeOnGrid(7, i, 'road', 1, 1);
      if (!newGrid[i][7]) placeOnGrid(i, 7, 'road', 1, 1);
      if (!newGrid[11][i]) placeOnGrid(11, i, 'road', 1, 1);
    }
    placeOnGrid(7, 7, 'plaza', 1, 1);
    placeOnGrid(6, 7, 'plaza', 1, 1);

    placeOnGrid(5, 8, 'fountain', 2, 2);
    placeOnGrid(2, 8, 'synagogue', 2, 2);
    placeOnGrid(8, 4, 'bread_market', 2, 2);
    placeOnGrid(8, 8, 'fish_market', 2, 2);
    placeOnGrid(12, 2, 'wheat_farm', 2, 2);
    placeOnGrid(12, 5, 'olive_grove', 2, 2);
    placeOnGrid(12, 8, 'vineyard', 2, 2);
    placeOnGrid(1, 2, 'aqueduct', 1, 1);
    placeOnGrid(1, 3, 'aqueduct', 1, 1);
    placeOnGrid(1, 4, 'aqueduct', 1, 1);
    placeOnGrid(1, 5, 'well', 1, 1);

    placeOnGrid(0, 0, 'tower', 1, 1);
    placeOnGrid(0, 7, 'gate', 2, 1);

    const houseSpots = [
      [8, 1, 3], [8, 2, 4], [9, 1, 2], [9, 2, 5],
      [8, 10, 4], [8, 11, 5], [9, 10, 3], [9, 11, 4],
      [4, 1, 3], [5, 1, 4]
    ];
    houseSpots.forEach(([hr, hc, hlvl]) => {
      if (!newGrid[hr]?.[hc]) placeOnGrid(hr, hc, 'house', 1, 1, hlvl);
    });

    useTycoonStore.setState({
      grid: newGrid,
      population: 145,
      shekels: Math.max(shekels, 650),
      food: Math.max(food, 120),
      fish: Math.max(fish, 95),
      oil: Math.max(oil, 80),
      wine: Math.max(wine, 75),
      faith: 98
    });

    playTycoonAudio('fanfare');
    setNotification('🏰 시온산 대성전과 2.5D 카툰 예루살렘 성읍이 입체 조경되었습니다!');
  };

  // 📊 도시 통계 분석 엔진
  const cityMetrics = useMemo(() => {
    let totalHouses = 0;
    let totalWorkersNeeded = 0;
    let totalUpkeep = 0;
    let totalTaxBase = 0;
    let waterBldgs = 0;
    let foodBldgs = 0;
    let faithBldgs = 0;
    let maxTierHouse = 0;

    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const cell = grid?.[r]?.[c];
        if (!cell || !cell.isRoot) continue;
        if (cell.type === 'house') {
          totalHouses++;
          const lvl = cell.level || 1;
          if (lvl > maxTierHouse) maxTierHouse = lvl;
          const tierInfo = HOUSE_TIERS[lvl - 1] || HOUSE_TIERS[0];
          totalTaxBase += tierInfo.tax || 2;
        } else if (cell.type !== 'road') {
          const bMeta = BUILDINGS[cell.type];
          if (bMeta) {
            totalWorkersNeeded += bMeta.workers || 0;
            totalUpkeep += bMeta.upkeep || 0;
          }
          if (['well', 'aqueduct', 'fountain'].includes(cell.type)) waterBldgs++;
          if (['wheat_farm', 'bread_market', 'fishery', 'fish_market', 'granary'].includes(cell.type)) foodBldgs++;
          if (['synagogue', 'temple', 'golgotha', 'beatitudes', 'gethsemane'].includes(cell.type)) faithBldgs++;
        }
      }
    }

    const employmentRate = totalWorkersNeeded === 0
      ? 100
      : Math.min(100, Math.round(((population || 10) / totalWorkersNeeded) * 100));

    const prosperityScore = Math.min(
      100,
      Math.round((population * 0.4) + (faith * 0.3) + (maxTierHouse * 8) + (waterBldgs * 3) + (foodBldgs * 3))
    );

    let cityTitle = '광야 유목 정착지';
    if (prosperityScore >= 85) cityTitle = '👑 거룩한 새 예루살렘 대도시';
    else if (prosperityScore >= 65) cityTitle = '🏛️ 솔로몬의 황금 성읍';
    else if (prosperityScore >= 40) cityTitle = '🛡️ 다윗의 요새 성읍';
    else if (prosperityScore >= 20) cityTitle = '🌿 갈릴리 협동 마을';

    return {
      totalHouses,
      totalWorkersNeeded,
      totalUpkeep,
      totalTaxBase,
      waterBldgs,
      foodBldgs,
      faithBldgs,
      employmentRate,
      prosperityScore,
      cityTitle
    };
  }, [grid, population, faith]);

  // ⏱️ 시뮬레이션 루프 및 모바일 수확 버블 스폰
  useEffect(() => {
    if (simSpeed === 0) return;
    const intervalTime = 3000 / simSpeed;
    const timer = setInterval(() => {
      tickSimulation();

      const curGrid = useTycoonStore.getState().grid;
      const newBubbles = [];

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const cell = curGrid?.[r]?.[c];
          if (!cell || !cell.isRoot) continue;
          const bId = `${r}-${c}`;

          if (cell.type === 'wheat_farm' && Math.random() < 0.55) {
            newBubbles.push({ id: bId, r, c, icon: '🍞', resource: 'food', amount: 15, bonusShekels: 10 });
          } else if (cell.type === 'fishery' && Math.random() < 0.55) {
            newBubbles.push({ id: bId, r, c, icon: '🐟', resource: 'fish', amount: 12, bonusShekels: 12 });
          } else if (cell.type === 'olive_grove' && Math.random() < 0.5) {
            newBubbles.push({ id: bId, r, c, icon: '🫒', resource: 'oil', amount: 10, bonusShekels: 15 });
          } else if (cell.type === 'vineyard' && Math.random() < 0.5) {
            newBubbles.push({ id: bId, r, c, icon: '🍇', resource: 'wine', amount: 10, bonusShekels: 18 });
          } else if (cell.type === 'temple' && Math.random() < 0.65) {
            newBubbles.push({ id: bId, r, c, icon: '🕊️', resource: 'faith', amount: 12, bonusShekels: 25 });
          } else if (cell.type === 'house' && (cell.level || 1) >= 2 && Math.random() < 0.35) {
            newBubbles.push({ id: bId, r, c, icon: '🪙', resource: null, amount: 0, bonusShekels: (cell.level || 1) * 8 });
          }
        }
      }

      if (newBubbles.length > 0) {
        setHarvestBubbles(prev => {
          const map = new Map(prev.map(item => [item.id, item]));
          newBubbles.forEach(nb => {
            if (map.size < 14) map.set(nb.id, nb);
          });
          return Array.from(map.values());
        });
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [simSpeed, tickSimulation]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2600);
    return () => clearTimeout(timer);
  }, [notification, setNotification]);

  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w - 4, h / 2);
    ctx.lineTo(w / 2, h - 4);
    ctx.lineTo(4, h / 2);
    ctx.closePath();
    ctx.fillStyle = '#291D12';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tileW = (w - 16) / MAP_SIZE;
    const tileH = (h - 16) / MAP_SIZE;

    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const px = w / 2 + (c - r) * (tileW / 2);
        const py = 8 + (c + r) * (tileH / 2);
        const cell = grid[r]?.[c];

        let color = '#D6C5A9';
        if (c === MAP_SIZE - 1 || (r >= MAP_SIZE - 2 && c >= MAP_SIZE - 3)) {
          color = '#0284C7';
        } else if (cell) {
          if (cell.type === 'road' || cell.type === 'plaza') color = '#78716C';
          else if (cell.type === 'house') color = '#F97316';
          else if (cell.type === 'temple' || cell.type === 'synagogue' || cell.type === 'golgotha') color = '#FACC15';
          else if (['well', 'aqueduct', 'fountain'].includes(cell.type)) color = '#38BDF8';
          else color = '#22C55E';
        }

        ctx.fillStyle = color;
        ctx.fillRect(px - 2, py - 1.5, 4, 3);
      }
    }
    ctx.restore();
  }, [grid, walkers]);

  const handleMinimapClick = (e) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !window.tycoonViewport) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = (clickX - canvas.width / 2) / (canvas.width / 2);
    const normY = (clickY - canvas.height / 2) / (canvas.height / 2);

    const worldX = normX * (MAP_SIZE * 44);
    const worldY = normY * (MAP_SIZE * 22) + 100;
    window.tycoonViewport.moveCenter(worldX, worldY);
    playTycoonAudio('coin');
  };

  const handleZoom = (delta) => {
    if (window.tycoonViewport) {
      const curScale = window.tycoonViewport.scale.x;
      const nextScale = Math.min(2.2, Math.max(0.45, curScale + delta));
      window.tycoonViewport.scale.set(nextScale);
    }
  };

  const handleExecuteTrade = (route, mode) => {
    const curState = useTycoonStore.getState();
    const currentAmount = curState[route.resource] || 0;

    if (mode === 'Import') {
      if (curState.shekels < route.buyPrice) {
        setNotification(`세겔이 부족합니다! (필요: ${route.buyPrice} 세겔)`);
        return;
      }
      useTycoonStore.setState({
        shekels: curState.shekels - route.buyPrice,
        [route.resource]: currentAmount + route.batch
      });
      playTycoonAudio('coin');
      setNotification(`[${route.city}]에서 ${route.name} +${route.batch} 수입 완료!`);
    } else {
      if (currentAmount < route.batch) {
        setNotification(`수출할 ${route.name} 재고가 부족합니다! (최소 ${route.batch} 필요)`);
        return;
      }
      useTycoonStore.setState({
        shekels: curState.shekels + route.sellPrice,
        [route.resource]: currentAmount - route.batch
      });
      playTycoonAudio('coin');
      setNotification(`[${route.city}]에 ${route.name} ${route.batch}개 수출 완료! (+${route.sellPrice} 세겔)`);
    }
  };

  const handleInvokeMiracle = (miracle) => {
    const curState = useTycoonStore.getState();
    if (curState.shekels < miracle.costShekels) {
      setNotification(`봉헌 예물이 부족합니다! (${miracle.costShekels} 세겔 필요)`);
      return;
    }

    if (miracle.isHouseUpgrade) {
      const nextGrid = curState.grid.map(row => row.map(cell => {
        if (cell && cell.type === 'house' && (cell.level || 1) < 5) {
          return { ...cell, level: (cell.level || 1) + 1 };
        }
        return cell;
      }));
      useTycoonStore.setState({
        shekels: curState.shekels - miracle.costShekels,
        grid: nextGrid,
        faith: 100,
        population: curState.population + 35
      });
    } else if (miracle.effect) {
      useTycoonStore.setState(miracle.effect(curState));
    }

    playTycoonAudio('fanfare');
    setNotification(`✨ [${miracle.title}] 축복이 예루살렘 온 성읍에 임했습니다!`);
    setAdvisorModalTab(null);
  };

  const handleDirectUpgradeHouse = () => {
    if (!inspectedTile || inspectedTile.type !== 'house') return;
    const curLvl = inspectedTile.level || 1;
    if (curLvl >= 5) return;
    const upgradeCost = curLvl * 25;

    if (shekels < upgradeCost) {
      setNotification(`증축 비용이 부족합니다! (${upgradeCost} 세겔 필요)`);
      return;
    }

    const nextGrid = grid.map(row => row.map(cell => {
      if (cell && cell.r === inspectedTile.r && cell.c === inspectedTile.c) {
        return { ...cell, level: curLvl + 1 };
      }
      return cell;
    }));

    const nextTier = HOUSE_TIERS[curLvl] || HOUSE_TIERS[HOUSE_TIERS.length - 1];
    useTycoonStore.setState({
      shekels: shekels - upgradeCost,
      grid: nextGrid,
      population: population + 8
    });
    setInspectedTile({ ...inspectedTile, level: curLvl + 1 });
    spawnFloatingText(inspectedTile.r, inspectedTile.c, `🏠 ${nextTier.name} 승급!`, '#34D399');
    playTycoonAudio('fanfare');
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-full h-full overflow-hidden select-none font-sans bg-[#18120C] text-stone-900 relative">
      
      {/* ── 1. 모바일 게임형 황금 상단 HUD 바 ── */}
      <header className="w-full max-w-full px-2.5 sm:px-4 py-1.5 bg-gradient-to-b from-[#3E2723] to-[#271815] border-b-2 border-[#D97706] text-amber-100 flex items-center justify-between gap-1.5 z-30 shrink-0 shadow-lg">
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => setActiveScreen('home')} 
            className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#78350F] hover:bg-[#92400E] text-amber-100 border border-amber-400/50 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            ◀ 홈
          </button>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-black text-amber-300 tracking-tight">{cityMetrics.cityTitle}</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-200 px-1.5 py-0.2 rounded border border-amber-400/30 tabular-nums">
                번영도 {cityMetrics.prosperityScore}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-200/70 block whitespace-nowrap">
              A.D. {year}년 • {SEASONS[seasonIdx]} • 세율 {taxRate}%
            </span>
          </div>
        </div>

        {/* 중앙: 7대 자원 필(Pill) 게이지 */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          <button
            onClick={() => setAdvisorModalTab('trade')}
            className="text-[11px] font-black text-amber-200 bg-black/50 hover:bg-black/70 px-2.5 py-1 rounded-full border border-amber-400/50 shrink-0 cursor-pointer flex items-center gap-1 tabular-nums"
          >
            <span>💰</span> <span>{shekels}</span>
          </button>

          <button
            onClick={() => setAdvisorModalTab('labor')}
            className="text-[11px] font-black text-sky-200 bg-black/50 hover:bg-black/70 px-2.5 py-1 rounded-full border border-sky-400/40 shrink-0 cursor-pointer flex items-center gap-1 tabular-nums"
          >
            <span>👥</span> <span>{population}명</span>
          </button>

          <span className="text-[11px] font-black text-emerald-200 bg-black/50 px-2 py-1 rounded-full border border-emerald-500/30 shrink-0 tabular-nums">
            🍞 {food}
          </span>
          <span className="text-[11px] font-black text-cyan-200 bg-black/50 px-2 py-1 rounded-full border border-cyan-500/30 shrink-0 tabular-nums">
            🐟 {fish}
          </span>
          <span className="text-[11px] font-black text-lime-200 bg-black/50 px-2 py-1 rounded-full border border-lime-500/30 shrink-0 tabular-nums hidden xs:inline-block">
            🫒 {oil}
          </span>
          <span className="text-[11px] font-black text-purple-200 bg-black/50 px-2 py-1 rounded-full border border-purple-500/30 shrink-0 tabular-nums hidden sm:inline-block">
            🍇 {wine}
          </span>
          <button
            onClick={() => setAdvisorModalTab('temple')}
            className="text-[11px] font-black text-rose-200 bg-black/50 hover:bg-black/70 px-2.5 py-1 rounded-full border border-rose-500/40 shrink-0 cursor-pointer tabular-nums"
          >
            🕊️ {faith}%
          </button>
        </div>

        {/* 우측: 시간대 조명 & 배속 컨트롤 */}
        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          <button
            onClick={() => {
              playTycoonAudio('coin');
              setTimeOfDay(prev => prev === 'day' ? 'sunset' : prev === 'sunset' ? 'night' : 'day');
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-black/45 border border-amber-500/30 hover:bg-black/65 cursor-pointer"
          >
            {timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}
          </button>

          <div className="flex items-center bg-black/45 p-0.5 rounded-lg border border-amber-500/30">
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 0 ? 1 : 0); }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${simSpeed === 0 ? 'bg-rose-600 text-white' : 'text-amber-200'}`}
            >
              {simSpeed === 0 ? '▶' : '❚❚'}
            </button>
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1); }}
              className="px-1.5 py-0.5 text-[10px] font-black text-amber-300 cursor-pointer tabular-nums"
            >
              {simSpeed || 1}x
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 마태복음 캠페인 & 원터치 수확/왕립조경 액션 바 ── */}
      <div className="bg-[#EFE5D4] border-b border-[#BBA585] px-2.5 sm:px-4 py-1 flex items-center justify-between gap-2 text-xs z-20 shrink-0 shadow-2xs">
        <div 
          onClick={() => setShowQuestModal(true)}
          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer hover:opacity-80"
        >
          <span className="text-sm shrink-0">📜</span>
          <div className="truncate">
            <span className="font-black text-[#78350F] mr-1.5">[{activeQuest?.title}]</span>
            <span className="text-stone-700 font-bold text-[11px]">{activeQuest?.targetDesc}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          {harvestBubbles.length > 0 && (
            <button
              onClick={handleHarvestAllBubbles}
              className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm animate-bounce"
            >
              ⚡ 전체 수확 ({harvestBubbles.length})
            </button>
          )}
          <button
            onClick={handleBuildRoyalShowcaseCity}
            className="px-2.5 py-0.5 rounded-md text-[10.5px] font-black bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 cursor-pointer shadow-xs"
          >
            🏰 왕립 도시 조경
          </button>
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('labor'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-[#78350F] text-amber-100 hover:bg-[#92400E] cursor-pointer"
          >
            👑 내각
          </button>
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('trade'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-700 text-white hover:bg-amber-600 cursor-pointer"
          >
            🐪 무역
          </button>
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('temple'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-indigo-700 text-white hover:bg-indigo-600 cursor-pointer hidden sm:inline-block"
          >
            🔥 기적
          </button>
        </div>
      </div>

      {/* ── 3. 메인 2.5D 카툰 시티빌더 뷰포트 ── */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* 좌측 상단: 오버레이 & 줌 컨트롤 독 */}
        <div className="absolute top-3 left-2.5 z-30 flex flex-col gap-1 bg-[#2A1B12]/90 backdrop-blur-md p-1.5 rounded-2xl border border-amber-500/40 shadow-xl">
          {[
            { id: 'normal', icon: '🌍', label: '일반' },
            { id: 'water', icon: '💧', label: '수자원' },
            { id: 'food', icon: '🍞', label: '식량망' },
            { id: 'faith', icon: '🕊️', label: '신앙망' }
          ].map(ov => (
            <button
              key={ov.id}
              onClick={() => { playTycoonAudio('coin'); setOverlayMode(ov.id); }}
              className={`px-2 py-1.5 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                overlayMode === ov.id
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-amber-100/80 hover:bg-white/10'
              }`}
            >
              <span>{ov.icon}</span>
              <span className="hidden sm:inline">{ov.label}</span>
            </button>
          ))}

          <div className="h-[1px] bg-amber-500/20 my-0.5" />
          <button onClick={() => handleZoom(0.25)} className="py-1 rounded-lg bg-black/40 text-amber-200 hover:bg-black/60 text-xs font-black cursor-pointer">＋</button>
          <button onClick={() => handleZoom(-0.25)} className="py-1 rounded-lg bg-black/40 text-amber-200 hover:bg-black/60 text-xs font-black cursor-pointer">－</button>
        </div>

        {/* 우측 상단: 다이아몬드 미니맵 레이더 */}
        <div className="absolute top-3 right-2.5 z-30 flex flex-col items-center bg-[#2A1B12]/90 backdrop-blur-md p-2 rounded-2xl border border-amber-500/40 shadow-xl">
          <canvas
            ref={minimapCanvasRef}
            width={108}
            height={62}
            onClick={handleMinimapClick}
            className="cursor-pointer rounded-lg"
          />
          <div className="flex items-center justify-between w-full px-1 mt-1 text-[9px] font-bold text-amber-200/80 whitespace-nowrap">
            <span>🗺️ 레이더</span>
            <button
              onClick={() => window.tycoonViewport && window.tycoonViewport.moveCenter(0, 110)}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              중앙
            </button>
          </div>
        </div>

        {/* 보행자(Walker) 말풍선 배너 */}
        {selectedWalker && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#FFFDF7] border-2 border-[#78350F] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-xs w-[88vw]">
            <span className="text-2xl">
              {selectedWalker.type === 'jesus' ? '👑' : selectedWalker.type === 'disciple' ? '🧔🏻' : '🐪'}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                {selectedWalker.name || '예루살렘 순례자'}
              </span>
              <p className="text-xs font-bold text-stone-800 break-keep">
                "{selectedWalker.thought}"
              </p>
            </div>
            <button onClick={() => setSelectedWalker(null)} className="text-xs text-stone-400 hover:text-stone-800 p-1 cursor-pointer">✕</button>
          </div>
        )}

        {/* 토스트 알림 */}
        {notification && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-stone-950/95 text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-amber-400/50 animate-bounce whitespace-nowrap">
            ✨ {notification}
          </div>
        )}

        {/* 🌟 2.5D 카툰 아키텍처 엔진 */}
        <GameEngine
          overlayMode={overlayMode}
          timeOfDay={timeOfDay}
          floatingEvents={floatingEvents}
          harvestBubbles={harvestBubbles}
          onHarvestBubbleClick={handleHarvestBubbleClick}
          onWalkerClick={(wInfo) => {
            playTycoonAudio('coin');
            setSelectedWalker(wInfo);
          }}
        />
      </div>

      {/* ── 4. 모바일 시티빌더 표준 하단 슬라이드 카드형 건설 독(Bottom Build Dock) ── */}
      <div className="w-full max-w-full z-30 shrink-0 bg-gradient-to-t from-[#1F140E] via-[#2A1B12]/98 to-[#2A1B12]/95 border-t-2 border-[#D97706] px-2.5 sm:px-4 py-2 shadow-2xl">
        <div className="max-w-5xl mx-auto w-full space-y-2">
          
          {/* 카테고리 탭 & 도구 바 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playTycoonAudio('hammer');
                    setIsBuildMenuOpen(true);
                    setActiveCategory(cat.id);
                    const first = Object.values(BUILDINGS).find(b => b.category === cat.id);
                    if (first) setSelectedTool(first.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id && selectedTool !== 'inspect' && selectedTool !== 'demolish'
                      ? 'bg-amber-500 text-stone-950 shadow-sm scale-102'
                      : 'bg-black/45 text-amber-100/85 hover:bg-white/10'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
              <button
                onClick={() => { playTycoonAudio('coin'); setSelectedTool('inspect'); }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedTool === 'inspect' ? 'bg-sky-400 text-slate-950 shadow-sm' : 'bg-sky-950/80 text-sky-200 border border-sky-500/30'
                }`}
              >
                🔍 조사
              </button>
              <button
                onClick={() => { playTycoonAudio('hammer'); setSelectedTool('demolish'); }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedTool === 'demolish' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-950/80 text-rose-200 border border-rose-500/30'
                }`}
              >
                🚜 철거
              </button>
            </div>

            <button
              onClick={() => setIsBuildMenuOpen(prev => !prev)}
              className="px-2.5 py-1 rounded-xl bg-black/50 text-amber-300 text-[11px] font-black border border-amber-500/30 shrink-0 cursor-pointer whitespace-nowrap"
            >
              {isBuildMenuOpen ? '▼ 접기' : '▲ 카탈로그 열기'}
            </button>
          </div>

          {/* 가로 슬라이드 건물 카드 덱 */}
          {isBuildMenuOpen && (
            <>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
                {Object.values(BUILDINGS)
                  .filter(b => b.category === activeCategory)
                  .map(b => {
                    const isSelected = selectedTool === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          playTycoonAudio('hammer');
                          setSelectedTool(b.id);
                        }}
                        className={`w-28 sm:w-32 shrink-0 p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-stone-950 border-white shadow-lg -translate-y-0.5 font-black'
                            : 'bg-black/50 text-amber-100 border-amber-500/30 hover:border-amber-400/70'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-xl">{b.emoji || '🏛️'}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold ${isSelected ? 'bg-black/20 text-stone-950' : 'bg-white/10 text-amber-300'}`}>
                            {b.w}x{b.h}
                          </span>
                        </div>
                        <span className="text-[11px] font-black truncate w-full mt-1">{b.name}</span>
                        <span className={`text-[10px] font-mono font-bold mt-0.5 ${isSelected ? 'text-stone-900' : 'text-amber-300'}`}>
                          💰 {b.cost} 세겔
                        </span>
                      </button>
                    );
                  })}
              </div>

              {selectedMeta && (
                <div className="text-[11px] font-bold text-amber-200/90 flex justify-between items-center gap-2 px-1">
                  <span className="truncate">💡 <b>{selectedMeta.name}:</b> {selectedMeta.desc}</span>
                  <span className="font-mono text-stone-950 font-black shrink-0 bg-amber-400 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                    일손 {selectedMeta.workers || 0}명 • 유지비 {selectedMeta.upkeep || 0}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 5. 4대 수석 자문관 내각 모달 ── */}
      {advisorModalTab && (
        <div className="fixed inset-0 z-[1250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#2A1B12] border-2 border-[#D97706] p-5 shadow-2xl text-amber-100 space-y-4 max-h-[88vh] overflow-y-auto hide-scrollbar text-left">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">ROYAL COUNCIL OF JERUSALEM</span>
                <h3 className="text-base font-black text-white">👑 예루살렘 4대 수석 자문관 내각</h3>
              </div>
              <button onClick={() => setAdvisorModalTab(null)} className="text-sm text-amber-300 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'labor', label: '👷 노동·인구' },
                { id: 'trade', label: '🐪 재무·무역' },
                { id: 'temple', label: '🔥 성전·기적' }
              ].map(tItem => (
                <button
                  key={tItem.id}
                  onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab(tItem.id); }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer truncate ${
                    advisorModalTab === tItem.id
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/80'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            {advisorModalTab === 'labor' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300/70 block">총 시민 인구</span>
                    <span className="text-base font-black text-white">{population}명</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300/70 block">필요 일꾼 수</span>
                    <span className="text-base font-black text-sky-300">{cityMetrics.totalWorkersNeeded}명</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300/70 block">도시 고용률</span>
                    <span className="text-base font-black text-emerald-400">{cityMetrics.employmentRate}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300/70 block">도시 번영도</span>
                    <span className="text-base font-black text-amber-400">{cityMetrics.prosperityScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {advisorModalTab === 'trade' && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-2">
                  <span className="font-black text-amber-300 block">🐪 4대 이웃 성읍 무역 교역소</span>
                  {TRADE_ROUTES.map(route => (
                    <div key={route.id} className="p-3 rounded-xl bg-black/40 border border-amber-500/20 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-black text-white flex items-center gap-1.5">
                          <span>{route.icon}</span>
                          <span>{route.city}</span>
                          <span className="text-[10px] font-mono text-amber-300">
                            (보유: {store[route.resource] || 0})
                          </span>
                        </div>
                        <span className="text-[10.5px] text-amber-200/70">{route.desc}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleExecuteTrade(route, 'Import')}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10.5px] cursor-pointer"
                        >
                          수입 (+{route.batch} / -{route.buyPrice}💰)
                        </button>
                        <button
                          onClick={() => handleExecuteTrade(route, 'Export')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] cursor-pointer"
                        >
                          수출 (-{route.batch} / +{route.sellPrice}💰)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {advisorModalTab === 'temple' && (
              <div className="space-y-3 text-xs">
                {SACRED_MIRACLES.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-black text-sm text-amber-300 block">✨ {m.title}</span>
                      <p className="text-[11px] text-amber-100/85 leading-relaxed">{m.desc}</p>
                    </div>
                    <button
                      onClick={() => handleInvokeMiracle(m)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-xs shrink-0 cursor-pointer shadow-lg"
                    >
                      봉헌 ({m.costShekels} 세겔)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. 마태복음 말씀 퀘스트 모달 ── */}
      {showQuestModal && activeQuest && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
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
              onClick={() => { playTycoonAudio('coin'); setShowQuestModal(false); }}
              className="w-full py-3 rounded-2xl bg-[#B45309] hover:bg-[#78350F] text-white font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
            >
              순종하여 건설하기 (아멘)
            </button>
          </div>
        </div>
      )}

      {/* ── 7. 건물 상세 인스펙터 모달 ── */}
      {inspectedTile && (
        <div className="fixed inset-0 z-[1150] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 select-none">
          <div className="w-full max-w-xs rounded-3xl bg-[#FFFDF7] border-2 border-[#78350F] p-4 shadow-2xl text-left space-y-3">
            <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
              <span className="font-black text-xs text-[#78350F]">🏛️ 왕립 건축물 감독관 보고서</span>
              <button onClick={() => setInspectedTile(null)} className="text-xs font-bold text-stone-400 hover:text-stone-700 p-1 cursor-pointer">✕</button>
            </div>

            {inspectedTile.type === 'house' ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-bold">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.emoji || '🏠'}</span>
                  <div>
                    <span className="font-black text-stone-900 text-sm block">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.name}</span>
                    <span className="text-[10.5px] text-amber-700 font-mono font-bold">주택 등급 Tier {inspectedTile.level || 1} / 5</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-[11px] font-bold text-stone-700">
                  <p>👥 거주 시민: {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.pop}명</p>
                  <p>💰 납부 세금: 매 턴 {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.tax} 세겔</p>
                  <p className="text-amber-900 pt-1.5 border-t border-amber-200/80 text-[10.5px] leading-snug">
                    {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.nextRequirementDesc}
                  </p>
                </div>

                {(inspectedTile.level || 1) < 5 && (
                  <button
                    onClick={handleDirectUpgradeHouse}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    ⚡ 왕립 특별 증축 지원 ({(inspectedTile.level || 1) * 25} 세겔)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-stone-900 block">{BUILDINGS[inspectedTile.type]?.name}</span>
                  <span className="font-mono text-[10px] bg-stone-200 px-2 py-0.5 rounded font-bold">
                    {BUILDINGS[inspectedTile.type]?.w}x{BUILDINGS[inspectedTile.type]?.h} 타일
                  </span>
                </div>
                <p className="text-stone-600 text-[11.5px] font-medium leading-relaxed">{BUILDINGS[inspectedTile.type]?.desc}</p>
                
                {BUILDINGS[inspectedTile.type]?.archeology && (
                  <p className="text-stone-700 text-[10.5px] bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-relaxed">
                    📜 <b>고고학 노트:</b> {BUILDINGS[inspectedTile.type].archeology}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => { playTycoonAudio('coin'); setInspectedTile(null); }}
              className="w-full py-2 rounded-xl bg-[#78350F] hover:bg-[#92400E] text-white text-xs font-bold cursor-pointer transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
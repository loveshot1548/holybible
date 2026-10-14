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

// =====================================================================
// 🐪 2. 파라오/시저 3식 지중해 & 갈릴리 4대 무역 교역로 정의
// =====================================================================
const TRADE_ROUTES = [
  { id: 'capernaum', city: '가버나움 어시장', resource: 'fish', name: '생선', icon: '🐟', buyPrice: 18, sellPrice: 12, batch: 10, desc: '갈릴리 호수의 싱싱한 물고기 교역' },
  { id: 'bethlehem', city: '베들레헴 곡창지대', resource: 'food', name: '생명의 빵', icon: '🍞', buyPrice: 15, sellPrice: 10, batch: 10, desc: '유대 들녘의 밀과 보리떡 교역' },
  { id: 'gethsemane', city: '감람산 기름틀 조합', resource: 'oil', name: '감람유', icon: '🫒', buyPrice: 28, sellPrice: 20, batch: 10, desc: '성전 등불과 치유를 위한 순수 올리브유' },
  { id: 'cana', city: '가나 포도원 상단', resource: 'wine', name: '포도주', icon: '🍇', buyPrice: 35, sellPrice: 25, batch: 10, desc: '혼인 잔치와 절기 축제를 위한 최상급 포도주' }
];

// =====================================================================
// ✨ 3. 성전 절기 봉헌 & 성경적 기적(Miracles) 정의
// =====================================================================
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

  // UI & 시저 3 고도화 상태
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(true);
  const [overlayMode, setOverlayMode] = useState('normal'); // 'normal' | 'water' | 'food' | 'faith' | 'prosperity'
  const [timeOfDay, setTimeOfDay] = useState('day');        // 'day' | 'sunset' | 'night'
  const [advisorModalTab, setAdvisorModalTab] = useState(null); // null | 'labor' | 'trade' | 'temple' | 'chronicle'
  const [taxRate, setTaxRate] = useState(9); // 기본 세율 9%
  const [selectedWalker, setSelectedWalker] = useState(null);
  const [floatingEvents, setFloatingEvents] = useState([]);

  const minimapCanvasRef = useRef(null);

  const SEASONS = ['유월절 (봄)', '오순절 (여름)', '초막절 (가을)', '수전절 (겨울)'];
  const activeQuest = MATTHEW_CAMPAIGN[currentQuestIdx] || MATTHEW_CAMPAIGN[0];
  const selectedMeta = BUILDINGS[selectedTool] || BUILDINGS.road;

  // =====================================================================
  // 📊 시저 3식 도시 통계 & 고용/번영도 실시간 분석 엔진
  // =====================================================================
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

  // 플로팅 텍스트 알림 생성기
  const spawnFloatingText = useCallback((r, c, text, color = '#FBBF24') => {
    const id = Date.now() + Math.random();
    setFloatingEvents(prev => [...prev.slice(-18), { id, r, c, text, color, createdAt: Date.now() }]);
  }, []);

  // ⏱️ 메인 경제 & 퀘스트 & 세율 시뮬레이션 타이머
  useEffect(() => {
    if (simSpeed === 0) return;
    const intervalTime = 3000 / simSpeed;
    const timer = setInterval(() => {
      tickSimulation();

      // 세율 보정 및 플로팅 생산 이펙트 트리거
      const taxDiff = taxRate - 9;
      if (taxDiff !== 0 && cityMetrics.totalHouses > 0) {
        const extraGold = Math.round((cityMetrics.totalTaxBase * taxDiff) / 10);
        const faithDelta = taxDiff > 4 ? -2 : taxDiff < 0 ? 1 : 0;
        useTycoonStore.setState(s => ({
          shekels: Math.max(0, s.shekels + extraGold),
          faith: Math.min(100, Math.max(10, s.faith + faithDelta))
        }));
      }

      // 생산 건물 위 떠오르는 자원 애니메이션 샘플링
      const curGrid = useTycoonStore.getState().grid;
      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const cell = curGrid?.[r]?.[c];
          if (!cell || !cell.isRoot) continue;
          if (cell.type === 'wheat_farm' && Math.random() < 0.45) spawnFloatingText(r, c, '+12 🍞', '#FDE047');
          else if (cell.type === 'fishery' && Math.random() < 0.45) spawnFloatingText(r, c, '+10 🐟', '#38BDF8');
          else if (cell.type === 'olive_grove' && Math.random() < 0.4) spawnFloatingText(r, c, '+8 🫒', '#A3E635');
          else if (cell.type === 'vineyard' && Math.random() < 0.4) spawnFloatingText(r, c, '+8 🍇', '#C084FC');
          else if (cell.type === 'temple' && Math.random() < 0.6) spawnFloatingText(r, c, '+예배 은혜 🕊️', '#F43F5E');
          else if (cell.type === 'house' && (cell.level || 1) >= 3 && Math.random() < 0.25) {
            spawnFloatingText(r, c, `+${HOUSE_TIERS[(cell.level || 1) - 1]?.tax || 5} 💰`, '#FBBF24');
          }
        }
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [simSpeed, tickSimulation, taxRate, cityMetrics, spawnFloatingText]);

  // 토스트 알림 자동 소멸
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2600);
    return () => clearTimeout(timer);
  }, [notification, setNotification]);

  // =====================================================================
  // 🗺️ 우측 상단 시저 3식 다이아몬드 미니맵 실시간 렌더링
  // =====================================================================
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 다이아몬드 배경
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w - 4, h / 2);
    ctx.lineTo(w / 2, h - 4);
    ctx.lineTo(4, h / 2);
    ctx.closePath();
    ctx.fillStyle = '#291D12';
    ctx.fill();
    ctx.strokeStyle = '#B45309';
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
          color = '#0284C7'; // 갈릴리 호수 / 강
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

    // 워커(시민) 점 표시
    (walkers || []).forEach(wk => {
      const px = w / 2 + (wk.c - wk.r) * (tileW / 2);
      const py = 8 + (wk.c + wk.r) * (tileH / 2);
      ctx.fillStyle = wk.type === 'jesus' ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    });

    ctx.restore();
  }, [grid, walkers]);

  // 미니맵 클릭 시 해당 위치로 뷰포트 즉시 점프
  const handleMinimapClick = (e) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !window.tycoonViewport) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = (clickX - canvas.width / 2) / (canvas.width / 2);
    const normY = (clickY - canvas.height / 2) / (canvas.height / 2);

    const worldX = normX * (MAP_SIZE * 42);
    const worldY = normY * (MAP_SIZE * 21) + 100;
    window.tycoonViewport.moveCenter(worldX, worldY);
    playTycoonAudio('coin');
  };

  // 줌 핸들러
  const handleZoom = (delta) => {
    if (window.tycoonViewport) {
      const curScale = window.tycoonViewport.scale.x;
      const nextScale = Math.min(2.2, Math.max(0.45, curScale + delta));
      window.tycoonViewport.scale.set(nextScale);
    }
  };

  // =====================================================================
  // 🐪 무역 수출 / 수입 실행 핸들러
  // =====================================================================
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

  // =====================================================================
  // ✨ 절기 봉헌 & 성경적 기적 발동 핸들러
  // =====================================================================
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

  // 인스펙터 창에서 해당 건물 즉시 축복/승급
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
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans bg-[#241911] text-stone-900 relative">
      
      {/* ── 1. 파라오 & 시저 3 스타일 황금 상단 왕실 상태바 (Top Royal HUD) ── */}
      <header className="px-2.5 sm:px-4 py-1.5 bg-gradient-to-b from-[#3E2723] to-[#271815] border-b-2 border-[#B45309] text-amber-100 flex items-center justify-between gap-2 z-30 shrink-0 shadow-lg">
        
        {/* 좌측: 나가기 & 도시 칭호/연대기 */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setActiveScreen('home')} 
            className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#78350F] hover:bg-[#92400E] text-amber-100 border border-amber-500/40 shadow-xs cursor-pointer active:scale-95"
          >
            ◀ 홈
          </button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-300 tracking-tight">{cityMetrics.cityTitle}</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-200 px-1.5 py-0.2 rounded border border-amber-400/30">
                번영도 {cityMetrics.prosperityScore}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-200/70 block">
              A.D. {year}년 • {SEASONS[seasonIdx]} • 세율 {taxRate}%
            </span>
          </div>
        </div>

        {/* 중앙: 7대 자원 & 고용 지표 티커 */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          <button
            onClick={() => setAdvisorModalTab('trade')}
            className="text-[11px] font-black text-amber-200 bg-black/40 hover:bg-black/60 px-2 py-1 rounded-lg border border-amber-500/30 shrink-0 cursor-pointer flex items-center gap-1"
            title="클릭하여 재무 및 무역 자문관 열기"
          >
            <span>💰</span> <span>{shekels}</span>
          </button>

          <button
            onClick={() => setAdvisorModalTab('labor')}
            className="text-[11px] font-black text-sky-200 bg-black/40 hover:bg-black/60 px-2 py-1 rounded-lg border border-sky-500/30 shrink-0 cursor-pointer flex items-center gap-1"
            title="클릭하여 인구 및 노동 자문관 열기"
          >
            <span>👥</span> <span>{population}명</span>
            <span className={`text-[9.5px] font-mono px-1 rounded ${cityMetrics.employmentRate >= 80 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/40 text-rose-200'}`}>
              고용 {cityMetrics.employmentRate}%
            </span>
          </button>

          <span className="text-[11px] font-black text-emerald-200 bg-black/40 px-2 py-1 rounded-lg border border-emerald-500/30 shrink-0">
            🍞 {food}
          </span>
          <span className="text-[11px] font-black text-cyan-200 bg-black/40 px-2 py-1 rounded-lg border border-cyan-500/30 shrink-0">
            🐟 {fish}
          </span>
          <span className="text-[11px] font-black text-lime-200 bg-black/40 px-2 py-1 rounded-lg border border-lime-500/30 shrink-0">
            🫒 {oil}
          </span>
          <span className="text-[11px] font-black text-purple-200 bg-black/40 px-2 py-1 rounded-lg border border-purple-500/30 shrink-0">
            🍇 {wine}
          </span>
          <button
            onClick={() => setAdvisorModalTab('temple')}
            className="text-[11px] font-black text-rose-200 bg-black/40 hover:bg-black/60 px-2 py-1 rounded-lg border border-rose-500/30 shrink-0 cursor-pointer"
            title="성전 및 절기 축복 자문관 열기"
          >
            🕊️ {faith}%
          </button>
        </div>

        {/* 우측: 시간대 조명 & 배속 컨트롤 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 낮/황혼/밤 조명 토글 */}
          <button
            onClick={() => {
              playTycoonAudio('coin');
              setTimeOfDay(prev => prev === 'day' ? 'sunset' : prev === 'sunset' ? 'night' : 'day');
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-black/40 border border-amber-500/30 hover:bg-black/60 cursor-pointer"
            title="도시 시간대 조명 전환 (낮 / 황혼 / 밤)"
          >
            {timeOfDay === 'day' ? '☀️ 낮' : timeOfDay === 'sunset' ? '🌅 황혼' : '🌙 밤'}
          </button>

          {/* 배속 & 일시정지 */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-amber-500/30">
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 0 ? 1 : 0); }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${simSpeed === 0 ? 'bg-rose-600 text-white' : 'text-amber-200'}`}
            >
              {simSpeed === 0 ? '▶' : '❚❚'}
            </button>
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1); }}
              className="px-1.5 py-0.5 text-[10px] font-black text-amber-300 cursor-pointer"
            >
              {simSpeed || 1}x
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 마태복음 연대기 퀘스트 & 4대 자문관 바로가기 서브 바 ── */}
      <div className="bg-[#EFE5D4] border-b border-[#BBA585] px-3 py-1 flex items-center justify-between gap-2 text-xs z-20 shrink-0 shadow-xs">
        <div 
          onClick={() => setShowQuestModal(true)}
          className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-80"
        >
          <span className="text-sm shrink-0">📜</span>
          <div className="truncate">
            <span className="font-black text-[#78350F] mr-1.5">[{activeQuest?.title}]</span>
            <span className="text-stone-700 font-bold text-[11px]">{activeQuest?.targetDesc}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('labor'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-[#78350F] text-amber-100 hover:bg-[#92400E] cursor-pointer shadow-2xs"
          >
            👑 내각 자문관
          </button>
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('trade'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-700 text-white hover:bg-amber-600 cursor-pointer shadow-2xs"
          >
            🐪 무역소
          </button>
          <button
            onClick={() => { playTycoonAudio('coin'); setAdvisorModalTab('temple'); }}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-indigo-700 text-white hover:bg-indigo-600 cursor-pointer shadow-2xs hidden sm:inline-block"
          >
            🔥 절기 기적
          </button>
        </div>
      </div>

      {/* ── 3. 메인 뷰포트 컨테이너 (좌측 시저3 오버레이 독 + 우측 미니맵 + PixiJS 엔진) ── */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* 좌측 상단: 시저 3식 5대 오버레이 맵 전환 독 */}
        <div className="absolute top-3 left-2.5 z-30 flex flex-col gap-1.5 bg-[#2A1B12]/90 backdrop-blur-md p-1.5 rounded-2xl border border-amber-500/40 shadow-xl">
          <span className="text-[9px] font-mono font-black text-amber-300/80 text-center uppercase tracking-tighter px-1">
            OVERLAY
          </span>
          {[
            { id: 'normal', icon: '🌍', label: '일반' },
            { id: 'water', icon: '💧', label: '수자원' },
            { id: 'food', icon: '🍞', label: '식량망' },
            { id: 'faith', icon: '🕊️', label: '신앙망' },
            { id: 'prosperity', icon: '👑', label: '번영도' }
          ].map(ov => (
            <button
              key={ov.id}
              onClick={() => { playTycoonAudio('coin'); setOverlayMode(ov.id); }}
              className={`px-2 py-1.5 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                overlayMode === ov.id
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-amber-100/80 hover:bg-white/10'
              }`}
              title={`${ov.label} 오버레이 보기`}
            >
              <span>{ov.icon}</span>
              <span className="hidden sm:inline">{ov.label}</span>
            </button>
          ))}

          <div className="h-[1px] bg-amber-500/20 my-0.5" />
          <button
            onClick={() => handleZoom(0.25)}
            className="py-1 rounded-lg bg-black/40 text-amber-200 hover:bg-black/60 text-xs font-black cursor-pointer"
            title="화면 확대"
          >
            ＋
          </button>
          <button
            onClick={() => handleZoom(-0.25)}
            className="py-1 rounded-lg bg-black/40 text-amber-200 hover:bg-black/60 text-xs font-black cursor-pointer"
            title="화면 축소"
          >
            －
          </button>
        </div>

        {/* 우측 상단: 시저 3식 다이아몬드 미니맵 레이더 */}
        <div className="absolute top-3 right-2.5 z-30 flex flex-col items-center bg-[#2A1B12]/90 backdrop-blur-md p-2 rounded-2xl border border-amber-500/40 shadow-xl">
          <canvas
            ref={minimapCanvasRef}
            width={116}
            height={68}
            onClick={handleMinimapClick}
            className="cursor-pointer rounded-lg"
            title="클릭하여 해당 구역으로 카메라 이동"
          />
          <div className="flex items-center justify-between w-full px-1 mt-1 text-[9px] font-bold text-amber-200/80">
            <span>🗺️ 미니맵</span>
            <button
              onClick={() => window.tycoonViewport && window.tycoonViewport.moveCenter(0, 100)}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              중앙으로
            </button>
          </div>
        </div>

        {/* 시저 3식 보행자(Walker) 실시간 생각 말풍선 배너 */}
        {selectedWalker && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#FFFDF7] border-2 border-[#78350F] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-xs w-[88vw]">
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

        {/* 토스트 알림 배너 */}
        {notification && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-stone-950/95 text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-amber-400/50 animate-bounce whitespace-nowrap">
            ✨ {notification}
          </div>
        )}

        {/* 🌟 업그레이드된 PixiJS 2.5D 시저 3 디오라마 엔진 */}
        <GameEngine
          overlayMode={overlayMode}
          timeOfDay={timeOfDay}
          floatingEvents={floatingEvents}
          onWalkerClick={(wInfo) => {
            playTycoonAudio('coin');
            setSelectedWalker(wInfo);
          }}
        />
      </div>

      {/* ── 4. 하단 플로팅 건축 카탈로그 독 ── */}
      <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-2">
        {isBuildMenuOpen && (
          <div className="bg-[#2A1B12]/95 backdrop-blur-md border-2 border-[#B45309] p-3 rounded-2xl shadow-2xl max-w-lg w-[92vw] sm:w-[510px] space-y-2 animate-fade-in text-amber-100">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300">🏛️ 왕립 건축 카탈로그</span>
                <span className="text-[10px] text-amber-200/70 font-medium hidden sm:inline">
                  (도로·성벽은 드래그하여 연속 건설 가능)
                </span>
              </div>
              <button 
                onClick={() => setIsBuildMenuOpen(false)}
                className="text-xs font-bold text-amber-300/70 hover:text-white px-1.5 cursor-pointer"
              >
                ✕ 접기
              </button>
            </div>

            {/* 카테고리 탭 바 */}
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playTycoonAudio('hammer');
                    setActiveCategory(cat.id);
                    const first = Object.values(BUILDINGS).find(b => b.category === cat.id);
                    if (first) setSelectedTool(first.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                    activeCategory === cat.id && selectedTool !== 'inspect' && selectedTool !== 'demolish'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-black/40 text-amber-100/80 hover:bg-white/10'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
              <button
                onClick={() => { playTycoonAudio('coin'); setSelectedTool('inspect'); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 cursor-pointer ${
                  selectedTool === 'inspect' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'bg-sky-950/80 text-sky-200 border border-sky-500/30'
                }`}
              >
                🔍 조사
              </button>
              <button
                onClick={() => { playTycoonAudio('hammer'); setSelectedTool('demolish'); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 cursor-pointer ${
                  selectedTool === 'demolish' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-950/80 text-rose-200 border border-rose-500/30'
                }`}
              >
                🚜 철거
              </button>
            </div>

            {/* 세부 건축물 그리드 */}
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
              {Object.values(BUILDINGS)
                .filter(b => b.category === activeCategory)
                .map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      playTycoonAudio('hammer');
                      setSelectedTool(b.id);
                    }}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                      selectedTool === b.id
                        ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md scale-102 font-black'
                        : 'bg-black/45 text-amber-100 border-amber-500/25 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base">{b.emoji || '🏛️'}</span>
                      <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">{b.w}x{b.h}</span>
                    </div>
                    <span className="text-[10px] font-black truncate w-full mt-0.5">{b.name}</span>
                    <span className="text-[9px] opacity-85 font-mono">{b.cost} 세겔</span>
                  </button>
                ))}
            </div>

            {selectedMeta && (
              <div className="text-[10.5px] font-bold text-amber-200/90 pt-1 border-t border-amber-500/30 flex justify-between items-center gap-2">
                <span className="truncate">ℹ️ {selectedMeta.name}: {selectedMeta.desc}</span>
                <span className="font-mono text-stone-950 font-black shrink-0 bg-amber-400 px-1.5 py-0.5 rounded text-[9.5px]">
                  일손 {selectedMeta.workers || 0}명
                </span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { playTycoonAudio('coin'); setIsBuildMenuOpen(prev => !prev); }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#92400E] to-[#78350F] hover:from-[#B45309] hover:to-[#92400E] text-amber-100 font-black text-xs shadow-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border-2 border-amber-400/60"
        >
          <span>{isBuildMenuOpen ? '✕ 카탈로그 접기' : '🔨 왕립 건축 카탈로그'}</span>
          {!isBuildMenuOpen && selectedMeta && (
            <span className="text-[10px] font-normal text-amber-300">({selectedMeta.name})</span>
          )}
        </button>
      </div>

      {/* ── 5. 👑 시저 3 & 파라오식 4대 수석 자문관 내각 모달 ── */}
      {advisorModalTab && (
        <div className="fixed inset-0 z-[1250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#2A1B12] border-2 border-[#D97706] p-5 shadow-2xl text-amber-100 space-y-4 max-h-[88vh] overflow-y-auto hide-scrollbar text-left">
            
            {/* 모달 헤더 & 탭 전환 */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">ROYAL COUNCIL OF JERUSALEM</span>
                <h3 className="text-base font-black text-white">👑 예루살렘 4대 수석 자문관 내각</h3>
              </div>
              <button onClick={() => setAdvisorModalTab(null)} className="text-sm text-amber-300 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'labor', label: '👷 노동·인구 (느헤미야)' },
                { id: 'trade', label: '🐪 재무·무역 (마태·요셉)' },
                { id: 'temple', label: '🔥 성전·기적 (니고데모)' }
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

            {/* 탭 1: 노동·인구 및 도시 진화 진단 */}
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

                <div className="p-3.5 rounded-2xl bg-black/35 border border-amber-500/25 space-y-2">
                  <span className="font-black text-amber-300 block">📋 수석 자문관 느헤미야의 도시 진단 보고:</span>
                  <p className="text-[11.5px] leading-relaxed text-amber-100/90">
                    {cityMetrics.totalHouses === 0 && '• 아직 거주민 주택이 없습니다. 유목민 천막(주택)을 먼저 건설하여 백성들을 정착시키십시오.'}
                    {cityMetrics.totalHouses > 0 && cityMetrics.waterBldgs === 0 && '• 식수가 부족합니다! 야곱의 우물이나 실로암 수로교를 주택 근처에 지어야 가옥이 2단계로 진화합니다.'}
                    {cityMetrics.waterBldgs > 0 && cityMetrics.foodBldgs === 0 && '• 식량 보급망이 없습니다! 갈릴리 밀밭과 생명의 빵 장터를 세워 백성들을 먹이십시오.'}
                    {cityMetrics.waterBldgs > 0 && cityMetrics.foodBldgs > 0 && cityMetrics.faithBldgs === 0 && '• 영적 갈급함이 큽니다! 백색 회당과 헤롯 대성전을 세워 신앙 지수를 높이십시오.'}
                    {cityMetrics.waterBldgs > 0 && cityMetrics.foodBldgs > 0 && cityMetrics.faithBldgs > 0 && '• 수자원, 식량, 성전 예배가 균형 있게 공급되고 있습니다! 분수대와 포도원을 확충하면 최고급 대리석 궁정으로 진화합니다.'}
                  </p>
                </div>
              </div>
            )}

            {/* 탭 2: 재무(세율) 및 지중해 무역 교역소 */}
            {advisorModalTab === 'trade' && (
              <div className="space-y-3.5 text-xs">
                {/* 세율 조절기 */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-300">⚖️ 왕립 세율 설정 (마태 세무관)</span>
                    <span className="font-mono font-bold text-white">현재 세율: {taxRate}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { rate: 5, label: '5% (선정)', desc: '신앙 +1/턴' },
                      { rate: 9, label: '9% (표준)', desc: '기본 세수' },
                      { rate: 14, label: '14% (중과)', desc: '세수 증가' },
                      { rate: 20, label: '20% (가렴)', desc: '신앙 감소' }
                    ].map(tr => (
                      <button
                        key={tr.rate}
                        onClick={() => { playTycoonAudio('coin'); setTaxRate(tr.rate); }}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                          taxRate === tr.rate ? 'bg-amber-500 text-stone-950 border-amber-300 font-black' : 'bg-black/40 border-white/10 text-amber-100'
                        }`}
                      >
                        <div className="text-[11px]">{tr.label}</div>
                        <div className="text-[9.5px] opacity-75">{tr.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4대 도시 무역 교역로 */}
                <div className="space-y-2">
                  <span className="font-black text-amber-300 block">🐪 4대 이웃 성읍 무역 교역소 (요셉 총리관)</span>
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

            {/* 탭 3: 성전 절기 봉헌 & 성경적 기적 */}
            {advisorModalTab === 'temple' && (
              <div className="space-y-3 text-xs">
                <p className="text-[11.5px] text-amber-200/80 leading-relaxed">
                  성전에 감사의 예물을 봉헌하여 예루살렘 성읍 전체에 하늘의 풍성한 기적과 주택 승급의 은혜를 선포합니다.
                </p>
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

      {/* ── 7. 시저 3식 건물 상세 인스펙터 모달 (즉시 증축 지원) ── */}
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
                  <span className="text-3xl font-bold">🏠</span>
                  <div>
                    <span className="font-black text-stone-900 text-sm block">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.name}</span>
                    <span className="text-[10.5px] text-amber-700 font-mono font-bold">주택 등급 Tier {inspectedTile.level || 1} / 5</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-[11px] font-bold text-stone-700">
                  <p>👥 거주 시민: {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.pop}명</p>
                  <p>💰 납부 세금: 매 턴 {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.tax} 세겔</p>
                  <p className="text-amber-900 pt-1.5 border-t border-amber-200/80 text-[10.5px] leading-snug">
                    {inspectedTile.level === 1 && "💧 우물이나 수로교를 근처에 지으면 [갈릴리 흙벽돌집]으로 진화합니다."}
                    {inspectedTile.level === 2 && "🍞 생명의 빵 장터를 통해 식량을 공급하면 [석회암 가옥]으로 진화합니다."}
                    {inspectedTile.level === 3 && "🐟 생선전과 백색 회당이 공급되면 [테라코타 2층 저택]으로 진화합니다."}
                    {inspectedTile.level === 4 && "🍇 분수대, 포도주, 대성전 예배가 충족되면 [헤롯 대리석 궁정]으로 완성됩니다."}
                    {inspectedTile.level === 5 && "👑 최고 등급의 왕립 대리석 궁정입니다!"}
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
                
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px] bg-stone-100 p-2.5 rounded-xl font-bold text-stone-700">
                  <span>🛠️ 필요 일꾼: {BUILDINGS[inspectedTile.type]?.workers || 0}명</span>
                  <span>🪙 유지비: {BUILDINGS[inspectedTile.type]?.upkeep || 0} 세겔</span>
                  <span className="col-span-2 text-emerald-700">
                    ⚙️ 가동 효율: {cityMetrics.employmentRate}% (정상 가동 중)
                  </span>
                </div>

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
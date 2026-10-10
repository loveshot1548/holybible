// src/pages/JerusalemTycoon.js
import React, { useState, useEffect } from 'react';
import { useTycoonStore } from '../games/jerusalem/core/store';
import GameEngine from '../games/jerusalem/components/GameEngine';
import { BUILDINGS, CATEGORIES, HOUSE_TIERS } from '../games/jerusalem/data/buildings';
import { MATTHEW_CAMPAIGN } from '../games/jerusalem/data/quests';

// =====================================================================
// 🎵 1. Web Audio API 사운드 신시사이저
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
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
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
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.18);
      });
    }
  } catch (_) {}
};

export default function JerusalemTycoon({ setActiveScreen }) {
  const {
    shekels, food, fish, oil, wine, faith, population, year, seasonIdx,
    simSpeed, setSimSpeed, selectedTool, setSelectedTool,
    activeCategory, setActiveCategory, tickSimulation,
    currentQuestIdx, showQuestModal, setShowQuestModal,
    inspectedTile, setInspectedTile, notification, setNotification
  } = useTycoonStore();

  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(true);

  const SEASONS = ['유월절 (봄)', '오순절 (여름)', '초막절 (가을)', '수전절 (겨울)'];
  const activeQuest = MATTHEW_CAMPAIGN[currentQuestIdx] || MATTHEW_CAMPAIGN[0];
  const selectedMeta = BUILDINGS[selectedTool] || BUILDINGS.road;

  // ⏱️ [핵심 복구] 경제 & 퀘스트 & 진화 시뮬레이션 메인 타이머
  useEffect(() => {
    if (simSpeed === 0) return;
    const intervalTime = 3000 / simSpeed;
    const timer = setInterval(() => {
      tickSimulation();
    }, intervalTime);
    return () => clearInterval(timer);
  }, [simSpeed, tickSimulation]);

  // 토스트 알림 자동 소멸
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(timer);
  }, [notification, setNotification]);

  // 줌인 / 줌아웃 안전 핸들러
  const handleZoom = (delta) => {
    if (window.tycoonViewport) {
      const curScale = window.tycoonViewport.scale.x;
      const nextScale = Math.min(2.0, Math.max(0.5, curScale + delta));
      if (typeof window.tycoonViewport.animate === 'function') {
        window.tycoonViewport.animate({ scale: nextScale, time: 180 });
      } else {
        window.tycoonViewport.scale.set(nextScale);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans bg-[#EDE3D1] text-stone-900 relative">
      
      {/* ── 1. 마태복음 타이쿤 상단 HUD ── */}
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

        {/* 7대 핵심 자원 티커 HUD (기름 추가 완비) */}
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
          <span className="text-xs font-black text-lime-900 bg-[#ECFCCB] px-2 py-0.5 rounded-lg border border-lime-300 shrink-0">
            🫒 {oil} 기름
          </span>
          <span className="text-xs font-black text-purple-900 bg-[#F3E8FF] px-2 py-0.5 rounded-lg border border-purple-300 shrink-0">
            🍇 {wine} 포도주
          </span>
          <span className="text-xs font-black text-rose-900 bg-[#FFE4E6] px-2 py-0.5 rounded-lg border border-rose-300 shrink-0">
            🕊️ 신앙 {faith}%
          </span>

          {/* 배속 & 줌 컨트롤 */}
          <div className="flex items-center gap-1 bg-[#C0AB8B] p-0.5 rounded-lg border border-[#9E8767] shrink-0">
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 0 ? 1 : 0); }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${simSpeed === 0 ? 'bg-rose-500 text-white' : 'text-stone-800'}`}
              title="일시정지 / 재생"
            >
              {simSpeed === 0 ? '▶' : '❚❚'}
            </button>
            <button
              onClick={() => { playTycoonAudio('coin'); setSimSpeed(simSpeed === 2 ? 1 : 2); }}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${simSpeed === 2 ? 'bg-amber-700 text-white font-black' : 'text-stone-800'}`}
              title="2배속"
            >
              {simSpeed === 2 ? '2x' : '1x'}
            </button>
            <button
              onClick={() => handleZoom(0.25)}
              className="px-1.5 text-xs font-black text-stone-800 hover:text-white cursor-pointer"
              title="확대"
            >
              +
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="px-1.5 text-xs font-black text-stone-800 hover:text-white cursor-pointer"
              title="축소"
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
          onClick={() => { playTycoonAudio('coin'); setShowQuestModal(true); }}
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500 hover:bg-amber-600 text-white shrink-0 cursor-pointer shadow-xs"
        >
          말씀 보기 📖
        </button>
      </div>

      {/* ── 3. 토스트 알림 배너 ── */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-stone-900/90 text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-amber-400/40 animate-bounce">
          ⚠️ {notification}
        </div>
      )}

      {/* ── 4. 🌟 PixiJS WebGL 2.5D 하드웨어 가속 뷰포트 ── */}
      <GameEngine />

      {/* ── 5. 하단 플로팅 건축 메뉴 & 접이식 드로어 ── */}
      <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        {isBuildMenuOpen && (
          <div className="bg-[#D1BE9F]/95 backdrop-blur-md border-2 border-[#AC9471] p-3 rounded-2xl shadow-2xl max-w-lg w-[90vw] sm:w-[500px] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-[#AC9471]/50">
              <span className="text-xs font-black text-[#78350F]">🏛️ 고대 건축 카탈로그</span>
              <button 
                onClick={() => setIsBuildMenuOpen(false)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 p-1 cursor-pointer"
              >
                ✕ 닫기
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
                    activeCategory === cat.id
                      ? 'bg-[#78350F] text-white shadow-sm'
                      : 'bg-[#EAE0CD] text-stone-700 hover:bg-white'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
              <button
                onClick={() => { playTycoonAudio('coin'); setSelectedTool('inspect'); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 cursor-pointer ${
                  selectedTool === 'inspect' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-100 text-indigo-900'
                }`}
              >
                🔍 정보
              </button>
              <button
                onClick={() => { playTycoonAudio('hammer'); setSelectedTool('demolish'); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 cursor-pointer ${
                  selectedTool === 'demolish' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-100 text-rose-800'
                }`}
              >
                🚜 철거
              </button>
            </div>

            {/* 세부 건축물 그리드 */}
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
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
                        ? 'bg-[#78350F] text-white border-[#5A250B] shadow-md scale-102'
                        : 'bg-[#F4ECE1] text-stone-800 border-[#C4B094] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{b.emoji || '🏛️'}</span>
                      <span className="text-[9px] bg-black/10 px-1 rounded font-mono font-bold">{b.w}x{b.h}</span>
                    </div>
                    <span className="text-[10px] font-black truncate w-full mt-0.5">{b.name}</span>
                    <span className="text-[9px] opacity-80 font-mono">{b.cost} 세겔</span>
                  </button>
                ))}
            </div>

            {selectedMeta && (
              <div className="text-[10px] font-bold text-stone-700 pt-1 border-t border-[#AC9471]/30 flex justify-between items-center">
                <span className="truncate">ℹ️ {selectedMeta.name}: {selectedMeta.desc}</span>
                <span className="font-mono text-[#78350F] font-black shrink-0 ml-1 bg-amber-100 px-1.5 py-0.5 rounded">
                  {selectedMeta.w}x{selectedMeta.h}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { playTycoonAudio('coin'); setIsBuildMenuOpen(prev => !prev); }}
          className="px-4 py-2.5 rounded-2xl bg-[#78350F] hover:bg-[#92400E] text-white font-black text-xs shadow-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border-2 border-amber-300/40"
        >
          <span>{isBuildMenuOpen ? '✕ 창 닫기' : '🔨 건축 메뉴'}</span>
          {!isBuildMenuOpen && selectedMeta && (
            <span className="text-[10px] font-normal opacity-80">({selectedMeta.name})</span>
          )}
        </button>
      </div>

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

      {/* ── 7. 건물 인스펙터 모달 (시저 3식 고도화) ── */}
      {inspectedTile && (
        <div className="fixed inset-0 z-[1150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none">
          <div className="w-full max-w-xs rounded-3xl bg-[#FFFDF7] border-2 border-[#78350F] p-4 shadow-xl text-left space-y-2.5">
            <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
              <span className="font-black text-xs text-[#78350F]">🏛️ 건물 상세 인스펙터</span>
              <button onClick={() => setInspectedTile(null)} className="text-xs font-bold text-stone-400 hover:text-stone-700 p-1 cursor-pointer">✕</button>
            </div>

            {inspectedTile.type === 'house' ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">🏠</span>
                  <div>
                    <span className="font-black text-stone-900 block">{HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono font-bold">Tier {inspectedTile.level || 1} / 5</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-[11px] font-bold text-stone-700">
                  <p>👥 거주민: {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.pop}명</p>
                  <p>💰 세금 수입: 매 턴 {HOUSE_TIERS[(inspectedTile.level || 1) - 1]?.tax} 세겔</p>
                  <p className="text-amber-800 pt-1 border-t border-amber-200/60 text-[10.5px]">
                    {inspectedTile.level === 1 && "👉 수로나 우물을 연결하면 흙벽돌집으로 진화합니다!"}
                    {inspectedTile.level === 2 && "👉 빵 장터를 지어 식량을 공급하면 석회암 가옥으로 진화합니다!"}
                    {inspectedTile.level === 3 && "👉 생선 시장과 회당을 공급하면 2층 저택으로 진화합니다!"}
                    {inspectedTile.level === 4 && "👉 광장 분수대와 포도주, 성전 예배가 갖춰지면 대리석 궁정으로 진화합니다!"}
                    {inspectedTile.level === 5 && "🌟 최고 등급의 대리석 궁정입니다!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 block">{BUILDINGS[inspectedTile.type]?.name}</span>
                  <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded font-bold">
                    {BUILDINGS[inspectedTile.type]?.w}x{BUILDINGS[inspectedTile.type]?.h} 타일
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] font-medium leading-relaxed">{BUILDINGS[inspectedTile.type]?.desc}</p>
                
                {/* 시저 3식 상세 스펙 */}
                <div className="grid grid-cols-2 gap-1 text-[10px] bg-stone-100 p-2 rounded-lg font-bold text-stone-700">
                  <span>🛠️ 필요 일손: {BUILDINGS[inspectedTile.type]?.workers || 0}명</span>
                  <span>🪙 유지 비용: {BUILDINGS[inspectedTile.type]?.upkeep || 0} 세겔</span>
                </div>

                {BUILDINGS[inspectedTile.type]?.archeology && (
                  <p className="text-stone-600 text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-200 leading-normal">
                    📜 {BUILDINGS[inspectedTile.type].archeology}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => { playTycoonAudio('coin'); setInspectedTile(null); }}
              className="w-full py-2 rounded-xl bg-[#78350F] hover:bg-[#92400E] text-white text-xs font-bold cursor-pointer transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
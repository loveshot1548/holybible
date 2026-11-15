// src/metaverse/MetaverseHub.js
import React, { useState, useEffect } from 'react';
import VirtualChurchLobby from '../pages/VirtualChurchLobby';
import CafeOffice2F from './CafeOffice2F';
import Sanctuary3F from './Sanctuary3F';
import MediaParents4F from './MediaParents4F';
import Fellowship5F from './Dining5F';
import Education6F from './Education6F';
import SkyGarden7F from './SkyGarden7F';
import { supabase } from '../lib/supabase';

const ACTIVE_FLOORS = [
  { id: '1F', label: '1F 로비', channel: 'metaverse_lobby_1f' },
  { id: '2F', label: '2F 카페·목양', channel: 'metaverse_cafe_2f' },
  { id: '3F', label: '3F 본당', channel: 'metaverse_sanctuary_3f' },
  { id: '4F', label: '4F 유아실', channel: 'metaverse_parents_4f' },
  { id: '5F', label: '5F 친교·찬양', channel: 'metaverse_dining_5f' },
  { id: '6F', label: '6F 교육관', channel: 'metaverse_edu_6f' },
  { id: '7F', label: '7F 하늘정원', channel: 'metaverse_skygarden_7f' }
];

const playHubElevatorChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [659.25, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.2);
      gain.gain.setValueAtTime(0.06, now + idx * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.2);
      osc.stop(now + idx * 0.2 + 0.4);
    });
  } catch (_) {}
};

export default function MetaverseHub({ setActiveScreen }) {
  // 🌟 메타버스 최초 진입 시 무조건 '1F'(1층 정문 로비)에서 시작하도록 고정!
  const [currentFloor, setCurrentFloor] = useState('1F');
  const [isFloorBarOpen, setIsFloorBarOpen] = useState(true);
  const [transitionBanner, setTransitionBanner] = useState(null);
  const [floorCounts, setFloorCounts] = useState({});

  // 최초 진입 시 세션 플래그 기록
  useEffect(() => {
    sessionStorage.setItem('gtc_metaverse_session_entered', '1');
    localStorage.setItem('metaverse_active_floor', '1F');
  }, []);

  // 📡 1F ~ 7F 전 층 실시간 접속자 수 모니터링 (다른 층에 있는 성도 수 실시간 집계)
  useEffect(() => {
    if (!supabase) return;

    const watchers = ACTIVE_FLOORS.filter((fl) => fl.id !== currentFloor).map((fl) => {
      const ch = supabase.channel(fl.channel);
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const count = Object.keys(state).length;
        setFloorCounts((prev) => (prev[fl.id] === count ? prev : { ...prev, [fl.id]: count }));
      }).subscribe();
      return ch;
    });

    return () => {
      watchers.forEach((ch) => {
        supabase.removeChannel(ch);
      });
    };
  }, [currentFloor]);

  const handleExitHome = () => {
    sessionStorage.removeItem('gtc_metaverse_session_entered');
    if (setActiveScreen) setActiveScreen('home');
  };

  const handleFloorChange = (targetFl) => {
    const found = ACTIVE_FLOORS.find((f) => f.id === targetFl);
    if (found) {
      if (targetFl !== currentFloor) {
        playHubElevatorChime();
        setTransitionBanner(`${found.label}으로 이동했습니다`);
        setTimeout(() => setTransitionBanner(null), 1800);
      }
      setCurrentFloor(targetFl);
      localStorage.setItem('metaverse_active_floor', targetFl);
    } else {
      alert(`🚧 ${targetFl} 공간은 순차 오픈 예정입니다!`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* 층간 이동 알림 배너 */}
      {transitionBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 text-emerald-200 text-xs font-black shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <span>🛗</span>
          <span>{transitionBanner}</span>
        </div>
      )}

      {/* 우측 하단: 1F · 2F · 3F · 4F · 5F · 6F · 7F 즉시 전환 스마트 리모컨 */}
      <div className="fixed bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-40 flex items-center">
        {isFloorBarOpen ? (
          <div
            style={{ backgroundColor: 'rgba(20, 22, 28, 0.96)', borderColor: 'rgba(255,255,255,0.2)' }}
            className="backdrop-blur-xl border p-1 rounded-2xl shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar max-w-[95vw] animate-fade-in"
          >
            {ACTIVE_FLOORS.map((fl) => {
              const isActive = currentFloor === fl.id;
              const cnt = floorCounts[fl.id] || 0;
              return (
                <button
                  key={fl.id}
                  onClick={() => handleFloorChange(fl.id)}
                  style={{
                    backgroundColor: isActive ? '#10B981' : 'transparent',
                    color: isActive ? '#030712' : '#E5E7EB'
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all whitespace-nowrap flex items-center gap-1"
                >
                  <span>{fl.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse" />
                  )}
                  {!isActive && cnt > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-mono">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setIsFloorBarOpen(false)}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              className="w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer ml-0.5 shrink-0"
              title="층별 이동 바 숨기기"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFloorBarOpen(true)}
            style={{ backgroundColor: 'rgba(20, 22, 28, 0.94)', color: '#34D399', borderColor: 'rgba(255,255,255,0.2)' }}
            className="px-3 py-2 rounded-full border shadow-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <span>🛗 {currentFloor} 층이동 ▲</span>
          </button>
        )}
      </div>

      <div className="flex-1 w-full h-full relative">
        {currentFloor === '1F' && (
          <VirtualChurchLobby
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
          />
        )}
        {currentFloor === '2F' && (
          <CafeOffice2F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '3F' && (
          <Sanctuary3F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '4F' && (
          <MediaParents4F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '5F' && (
          <Fellowship5F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '6F' && (
          <Education6F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '7F' && (
          <SkyGarden7F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
      </div>
    </div>
  );
}
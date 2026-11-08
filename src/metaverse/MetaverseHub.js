// src/metaverse/MetaverseHub.js
import React, { useState } from 'react';
import VirtualChurchLobby from '../pages/VirtualChurchLobby';
import Sanctuary3F from './Sanctuary3F';

const ACTIVE_FLOORS = [
  { id: '1F', label: '1F 메인 로비 · 주차장' },
  { id: '3F', label: '3F 대예배당 (본당)' }
];

export default function MetaverseHub({ setActiveScreen }) {
  const [currentFloor, setCurrentFloor] = useState('1F');

  const handleExitHome = () => {
    if (setActiveScreen) setActiveScreen('home');
  };

  // 엘리베이터에서 다른 층을 눌렀을 때 처리 (현재는 1F <-> 3F 집중 연동)
  const handleFloorChange = (targetFl) => {
    if (targetFl === '1F' || targetFl === '3F') {
      setCurrentFloor(targetFl);
    } else {
      alert(`🚧 ${targetFl} 공간은 순차 오픈 예정입니다! 먼저 완성된 1F 로비와 3F 대예배당으로 이동합니다.`);
      setCurrentFloor('3F');
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* 🛗 우측 하단 고정: 1층 로비 <-> 3층 대예배당 즉시 전환 리모컨 */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-950/92 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5">
        <span className="text-[10.5px] font-mono font-bold text-emerald-400 px-2">🛗 층별이동</span>
        {ACTIVE_FLOORS.map(fl => (
          <button
            key={fl.id}
            onClick={() => setCurrentFloor(fl.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
              currentFloor === fl.id
                ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {/* 🏛️ 1층 로비 ↔ 3층 대예배당 3D 렌더링 */}
      <div className="flex-1 w-full h-full relative">
        {currentFloor === '1F' && (
          <VirtualChurchLobby
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
          />
        )}
        {currentFloor === '3F' && (
          <Sanctuary3F
            setActiveScreen={setActiveScreen}
            onChangeFloor={handleFloorChange}
            onExitHome={handleExitHome}
          />
        )}
      </div>
    </div>
  );
}
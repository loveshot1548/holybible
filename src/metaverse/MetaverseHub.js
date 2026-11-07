// src/metaverse/MetaverseHub.js
import React, { useState } from 'react';
import VirtualChurchLobby from '../pages/VirtualChurchLobby';
import Sanctuary3F from './Sanctuary3F';
import MediaParents4F from './MediaParents4F';
import Dining5F from './Dining5F';
import Education6F from './Education6F';
import SkyGarden7F from './SkyGarden7F';

const ALL_FLOORS = [
  { id: '1F', label: '1F 로비·주차장' },
  { id: '3F', label: '3F 대예배당' },
  { id: '4F', label: '4F 방송·영유아' },
  { id: '5F', label: '5F 식당·연습실' },
  { id: '6F', label: '6F 교육관' },
  { id: '7F', label: '7F 하늘정원' }
];

export default function MetaverseHub({ setActiveScreen }) {
  // 처음 입장 시 시작할 층 ('1F' 로비 또는 '3F' 본당 등 원하는 층으로 설정 가능)
  const [currentFloor, setCurrentFloor] = useState('1F');

  const handleExitHome = () => {
    if (setActiveScreen) setActiveScreen('home');
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* 🛗 우측 하단 고정: 전 층(1F, 3F~7F) 즉시 전환 스마트 엘리베이터 리모컨 */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-950/92 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-2xl flex flex-wrap items-center gap-1 max-w-[92vw]">
        <span className="text-[10px] font-mono font-bold text-emerald-400 px-2">🛗 층별이동</span>
        {ALL_FLOORS.map(fl => (
          <button
            key={fl.id}
            onClick={() => setCurrentFloor(fl.id)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
              currentFloor === fl.id
                ? 'bg-emerald-500 text-slate-950 shadow-sm scale-105'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {/* 🏛️ 선택된 층의 메타버스 공간 렌더링 */}
      <div className="flex-1 w-full h-full relative">
        {currentFloor === '1F' && (
          <VirtualChurchLobby
            setActiveScreen={setActiveScreen}
            onChangeFloor={(fl) => setCurrentFloor(fl)}
          />
        )}
        {currentFloor === '3F' && (
          <Sanctuary3F
            setActiveScreen={setActiveScreen}
            onChangeFloor={(fl) => setCurrentFloor(fl)}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '4F' && (
          <MediaParents4F
            onChangeFloor={(fl) => setCurrentFloor(fl)}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '5F' && (
          <Dining5F
            onChangeFloor={(fl) => setCurrentFloor(fl)}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '6F' && (
          <Education6F
            onChangeFloor={(fl) => setCurrentFloor(fl)}
            onExitHome={handleExitHome}
          />
        )}
        {currentFloor === '7F' && (
          <SkyGarden7F
            setActiveScreen={setActiveScreen}
            onChangeFloor={(fl) => setCurrentFloor(fl)}
          />
        )}
      </div>
    </div>
  );
}
// src/metaverse/MetaverseHub.js
import React, { useState } from 'react';
import VirtualChurchLobby from '../pages/VirtualChurchLobby';
import Sanctuary3F from './Sanctuary3F';
import MediaParents4F from './MediaParents4F';
import Education6F from './Education6F';

const ACTIVE_FLOORS = [
  { id: '1F', label: '1F 로비' },
  { id: '3F', label: '3F 본당' },
  { id: '4F', label: '4F 유아실' },
  { id: '6F', label: '6F 교육관' }
];

export default function MetaverseHub({ setActiveScreen }) {
  // 방금 완성한 4층 영유아 마루 예배실을 바로 확인하실 수 있도록 초기값을 '4F'로 설정했습니다!
  const [currentFloor, setCurrentFloor] = useState('4F');

  const handleExitHome = () => {
    if (setActiveScreen) setActiveScreen('home');
  };

  const handleFloorChange = (targetFl) => {
    if (['1F', '3F', '4F', '6F'].includes(targetFl)) {
      setCurrentFloor(targetFl);
    } else {
      alert(`🚧 ${targetFl} 공간은 순차 오픈 예정입니다!`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* 우측 하단 고정: 1F · 3F · 4F · 6F 즉시 전환 캡슐 */}
      <div
        style={{ backgroundColor: 'rgba(20, 22, 28, 0.95)', borderColor: 'rgba(255,255,255,0.18)' }}
        className="fixed bottom-2.5 right-3 sm:bottom-4 sm:right-4 z-40 backdrop-blur-xl border p-1 sm:p-1.5 rounded-2xl shadow-2xl flex items-center gap-1"
      >
        <span style={{ color: '#34D399' }} className="text-[10px] font-mono font-bold px-1.5 hidden sm:inline">
          🛗 층별이동
        </span>
        {ACTIVE_FLOORS.map(fl => {
          const isActive = currentFloor === fl.id;
          return (
            <button
              key={fl.id}
              onClick={() => setCurrentFloor(fl.id)}
              style={{
                backgroundColor: isActive ? '#10B981' : 'transparent',
                color: isActive ? '#030712' : '#E5E7EB'
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black cursor-pointer transition-all"
            >
              {fl.label}
            </button>
          );
        })}
      </div>

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
        {currentFloor === '4F' && (
          <MediaParents4F
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
      </div>
    </div>
  );
}
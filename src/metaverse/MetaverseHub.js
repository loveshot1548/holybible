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
  const [currentFloor, setCurrentFloor] = useState('6F');
  // 하단 층간 이동 바 접기/펼치기 상태
  const [isFloorBarOpen, setIsFloorBarOpen] = useState(true);

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
      {/* 우측 하단: 접고 펼 수 있는 스마트 층별 이동 리모컨 */}
      <div className="fixed bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-40 flex items-center">
        {isFloorBarOpen ? (
          <div
            style={{ backgroundColor: 'rgba(20, 22, 28, 0.96)', borderColor: 'rgba(255,255,255,0.2)' }}
            className="backdrop-blur-xl border p-1 rounded-2xl shadow-2xl flex items-center gap-1 animate-fade-in"
          >
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
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all whitespace-nowrap"
                >
                  {fl.label}
                </button>
              );
            })}
            <button
              onClick={() => setIsFloorBarOpen(false)}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              className="w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer ml-0.5"
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
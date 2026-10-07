import React from 'react';
import { SubPageHeader } from '../components/Shared';
import { FireIcon, PrayingHandsIcon } from '../utils/icons';

export default function PrayerScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  globalPrayers, globalIntercessions, openModal
}) {
  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
       <SubPageHeader title="나의 기도 보관함" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
       <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-4">
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => openModal('globalPrayer')}>
             <h3 className={`font-extrabold text-sm mb-3 border-b pb-2 ${t.border} ${t.textMain} flex items-center gap-1.5`}><FireIcon className="w-5 h-5 text-blue-500" /> 나의 누적 기도 보드</h3>
             {globalPrayers.length > 0 ? globalPrayers.slice(0,3).map(p => <div key={p.id} className={`text-sm ${t.textMain} pl-1 mt-1.5 truncate`}>🔥 {p.text}</div>) : <div className={`text-sm ${t.textSub} mt-2 text-center`}>개인 기도제목을 기록하세요.</div>}
          </div>
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => openModal('globalIntercession')}>
             <h3 className={`font-extrabold text-sm mb-3 border-b pb-2 ${t.border} ${t.textMain} flex items-center gap-1.5`}><PrayingHandsIcon className="w-5 h-5 text-green-500" /> 중보 기도 보드</h3>
             {globalIntercessions.length > 0 ? globalIntercessions.slice(0,3).map(p => <div key={p.id} className={`text-sm ${t.textMain} pl-1 mt-1.5 truncate`}>🌱 {p.text}</div>) : <div className={`text-sm ${t.textSub} mt-2 text-center`}>교회와 이웃을 위한 중보기도.</div>}
          </div>
       </div>
    </div>
  );
}
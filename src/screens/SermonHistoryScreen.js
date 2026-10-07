import React from 'react';
import { SubPageHeader } from '../components/Shared';

export default function SermonHistoryScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  dailyData, setDailyData, setDate
}) {
  const history = Object.entries(dailyData || {})
    .filter(([d, data]) => data && (data.sermonTitle || data.sermonNotes || data.sermonPreacher))
    .sort(([d1], [d2]) => d2.localeCompare(d1));

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="예배노트 히스토리 목록" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-4">
          {history.length === 0 ? <div className={`text-center py-10 ${t.textSub}`}>작성된 예배노트 내역이 없습니다.</div> : (
              history.map(([histDate, data]) => (
                  <div key={histDate} className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm relative group hover:-translate-y-1 transition-transform cursor-pointer`} onClick={() => { setDate(histDate); setActiveScreen('sermon'); }}>
                      <div className="flex justify-between items-center mb-2"><span className={`text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded`}>{histDate}</span><div className="flex gap-2 items-center"><span className={`text-xs ${t.textSub} font-bold`}>{data.sermonPreacher || '설교자 미기록'}</span><button onClick={(e) => { e.stopPropagation(); if(window.confirm(`${histDate}의 기록을 정말 삭제하시겠습니까?`)) { const n = {...dailyData}; n[histDate] = { ...n[histDate], sermonTitle:'', sermonPreacher:'', sermonReference:'', sermonNotes:'' }; setDailyData(n); } }} className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded shadow-sm hover:bg-red-100">삭제</button></div></div>
                      <h3 className={`font-extrabold text-base ${t.textMain} truncate`}>{data.sermonTitle || '제목 없음'}</h3><p className={`text-sm ${t.textSub} mt-2 line-clamp-2`}>{data.sermonNotes ? data.sermonNotes.replace(/<[^>]+>/g, '') : ''}</p>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}
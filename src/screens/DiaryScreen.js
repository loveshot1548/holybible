import React from 'react';
import { DiaryIcon, HeartIcon, NotebookIcon } from '../utils/icons';
import SubPageHeader from '../components/SubPageHeader';

export default function DiaryScreen({ t, currDay, openModal, setActiveScreen, setIsSidebarOpen, isSidebarOpen, getArr, bibleNotes }) {
  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="감사/간증 일기" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-4">
        
        {/* 1. 오늘의 감사 리스트 박스 */}
        <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => openModal('thanks')}>
           <h3 className={`font-extrabold text-sm mb-3 border-b pb-2 ${t.border} ${t.textMain} flex items-center gap-1.5`}><HeartIcon className="w-5 h-5 text-pink-500" /> 오늘의 감사 리스트</h3>
           {getArr(currDay.thanks).length > 0 ? getArr(currDay.thanks).slice(0,3).map((th, i) => <div key={i} className={`text-sm ${t.textMain} pl-1 mt-1.5 truncate`}>💖 {th}</div>) : <div className={`text-sm ${t.textSub} mt-2 text-center`}>오늘의 감사를 기록해보세요.</div>}
        </div>

        {/* 2. 말씀 묵상 노트 박스 */}
        <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => openModal('bibleNoteList')}>
           <h3 className={`font-extrabold text-sm mb-3 border-b pb-2 ${t.border} ${t.textMain} flex items-center gap-1.5`}><NotebookIcon className="w-5 h-5 text-indigo-500" /> 말씀 묵상 노트</h3>
           {bibleNotes.length > 0 ? bibleNotes.slice(0,2).map(n => <div key={n.id} className={`text-sm ${t.textMain} pl-1 mt-1.5 truncate`}>📖 {n.note}</div>) : <div className={`text-sm ${t.textSub} mt-2 text-center`}>기록된 말씀 묵상이 없습니다.</div>}
        </div>

        {/* 3. 나의 묵상 간증 박스 */}
        <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => openModal('testimony')}>
           <h3 className={`font-extrabold text-sm mb-3 border-b pb-2 ${t.border} ${t.textMain} flex items-center gap-1.5`}><DiaryIcon className="w-5 h-5 text-purple-500" /> 나의 묵상 간증</h3>
           {currDay.testimony ? <div className={`text-sm ${t.textMain} pl-1 mt-1.5 line-clamp-2 whitespace-pre-wrap`}>{currDay.testimony}</div> : <div className={`text-sm ${t.textSub} mt-2 text-center`}>오늘의 묵상과 간증을 기록하세요.</div>}
        </div>

      </div>
    </div>
  );
}
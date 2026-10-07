import React, { useMemo } from 'react';
import { SubPageHeader, CanvasEngine } from '../components/Shared';
import { YoutubeIcon } from '../utils/icons';
import { cleanText } from '../utils/helpers';
import { bibles } from '../data/constants';
import { getMcheynePlan } from '../mcheyneData'; // 맥체인 데이터 파일이 존재해야 합니다

export default function McheyneScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  date, currDay, updateDay, tool, color, size,
  mcheynePlanIdx, setMcheynePlanIdx, isSpeaking, ttsRate, setTtsRate, toggleTTS, readVerses, setReadVerses
}) {
  const mcheyneActivePlan = useMemo(() => getMcheynePlan(date.substring(5, 10)), [date]);
  const mpList = mcheyneActivePlan || []; 
  const mp = mpList[mcheynePlanIdx] || mpList[0]; 
  const mBookD = mp ? (bibles.find(b => b.name === mp.book) || bibles[0]) : bibles[0]; 
  const mChaps = mp ? String(mp.chapterString).includes('-') ? Array.from({length: parseInt(String(mp.chapterString).split('-')[1]) - parseInt(String(mp.chapterString).split('-')[0]) + 1}, (_, i) => parseInt(String(mp.chapterString).split('-')[0]) + i) : [parseInt(String(mp.chapterString))] : [1]; 
  const mAllR = mChaps.every(ch => (mBookD.chapters[ch-1] || []).every((_, i) => (readVerses||{})[`${mBookD.name}-${ch}-${i}`]));

  const dateObj = new Date(date);
  const mdStr = `${dateObj.getMonth() + 1}월${dateObj.getDate()}일`;
  const ymdStr = `${dateObj.getFullYear()}년${dateObj.getMonth() + 1}월${dateObj.getDate()}일`;

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="오늘의 맥체인" onBack={()=>setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`${t.cardBg} px-6 pt-3 pb-4 shadow-sm z-20 border-b ${t.border} shrink-0`}>
        <div className="flex flex-col gap-3 relative mb-4">
          <div><p className={`text-sm font-bold ${t.textMain}`}>{mp ? cleanText(mp.title) : ''}</p></div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={()=>setTtsRate(r => r===1.0 ? 1.2 : r===1.2 ? 1.5 : r===1.5 ? 2.0 : 1.0)} className={`h-8 px-2 rounded text-xs font-bold border ${t.border} ${t.textMain} shadow-sm`}>{ttsRate}x 배속</button>
            <button onClick={()=>{ const q = [`${mp?.title} 말씀입니다.`]; mChaps.forEach(ch => { (mBookD.chapters[ch-1] || []).forEach(v => q.push(cleanText(v))); }); toggleTTS(q); }} className={`h-8 px-2.5 rounded text-xs font-bold ${isSpeaking?'bg-[#FFB7B2] text-slate-900 animate-pulse':`${t.primaryBg} text-white`} shadow-sm`}>{isSpeaking?'⏹️ 중지':'🔊 낭독'}</button>
            <button onClick={()=>window.open(`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경읽기+${ymdStr}`, '_blank')} className={`h-8 px-2.5 rounded text-xs font-bold bg-blue-500 text-white shadow-sm flex items-center`}><YoutubeIcon className="w-3.5 h-3.5 mr-1"/>듣기</button>
            <button onClick={()=>window.open(`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경+해설+${ymdStr}`, '_blank')} className={`h-8 px-2.5 rounded text-xs font-bold bg-slate-700 text-white shadow-sm`}>💡 해설</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {mpList.map((planItem, idx) => ( <button key={idx} onClick={() => setMcheynePlanIdx(idx)} className={`h-10 px-4 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-colors ${mcheynePlanIdx === idx ? `${t.primaryBg} text-white border-transparent` : `${t.appBg} ${t.textSub} hover:opacity-80`}`}>{cleanText(planItem.title)}</button> ))}
        </div>
      </div>
      <CanvasEngine saveKey={`mcheyne_${date}_${mcheynePlanIdx}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 md:gap-8 items-stretch pb-40 flex-1 relative z-10">
            <div className={`flex-1 break-words ${t.cardBg} border ${t.border} rounded-2xl p-5 shadow-sm`}>
               {mChaps.map(ch => ( <div key={ch} className="mb-8"><h4 className={`font-extrabold ${t.primaryText} text-sm mb-4 border-b ${t.border} pb-2`}>제 {ch} 장</h4>{(mBookD.chapters[ch - 1] || []).map((verse, idx) => { const vId = `${mBookD.name}-${ch}-${idx}`; const isRead = (readVerses||{})[vId]; return ( <p key={idx} onClick={() => { if(tool==='hand') setReadVerses(p => ({ ...p, [vId]: !p[vId] })); }} className={`flex gap-3 py-1.5 px-0 cursor-pointer text-sm sm:text-base transition-colors ${isRead ? 'opacity-40 grayscale text-slate-400' : `${t.textMain} hover:bg-slate-50 dark:hover:bg-slate-800`}`}><span className={`font-bold min-w-[1.5rem] text-right mt-0.5 ${t.primaryText}`}>{idx + 1}</span><span>{cleanText(verse)}</span></p> ); })}</div> ))}
               <button onClick={() => { const u = {}; const s = !mAllR; mChaps.forEach(ch => { (mBookD.chapters[ch-1] || []).forEach((_, i) => u[`${mBookD.name}-${ch}-${i}`] = s); }); setReadVerses(p => ({...p, ...u})); if (s) updateDay({ checks: { ...(currDay.checks||{}), '성경읽기': true } }); }} className={`w-full mt-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all ignore-draw ${mAllR ? `${t.appBg} ${t.textSub} border ${t.border}` : `${t.primaryBg} text-white shadow-md hover:opacity-90`}`}>{mAllR ? '🔄 전체 읽음 취소' : '📖 이 구절들을 모두 읽음 표시'}</button>
            </div>
            <div className={`hidden sm:flex flex-1 flex-col ${t.cardBg} border ${t.border} shadow-sm rounded-2xl overflow-hidden min-h-[500px]`}>
                <div className={`p-3 border-b ${t.border} ${t.appBg} flex justify-between items-center z-10 ignore-draw`}><span className={`text-xs font-bold ml-2 ${t.textSub}`}>📝 맥체인 묵상 노트</span></div>
                <textarea value={currDay.mcheyneNote||''} onChange={e=>updateDay({mcheyneNote:e.target.value})} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`w-full flex-1 p-5 bg-transparent outline-none resize-none text-sm z-10 ${t.textMain} h-auto overflow-hidden min-h-full note-lines`} placeholder="말씀을 보며 화살표를 긋거나 필기를 남겨보세요..." />
            </div>
        </div>
      </CanvasEngine>
    </div>
  );
}
import React from 'react';
import { FireIcon, YoutubeIcon, ReportIcon, BibleIcon, PrayingHandsIcon } from '../utils/icons';
import SubPageHeader from '../components/SubPageHeader';
import CanvasEngine from '../components/CanvasEngine';

export default function QtScreen({ t, currDay, updateDay, setActiveScreen, setIsSidebarOpen, isSidebarOpen, date, ymdStr, isWknd, globalSharedQt, handleUpdateSharedQt, triggerConfetti, tool, color, size, dailyData, extractVideoId }) {
  
  const sharedVidId = globalSharedQt[date]?.qt || currDay.qtVideoId;
  const qtStreak = (() => { let mx=0, cur=0; const sD=Object.keys(dailyData).sort(); if(!sD.length) return 0; let pD=new Date(sD[0]); pD.setDate(pD.getDate()-2); sD.forEach(d => { if(dailyData[d]?.checks?.['QTin']) { const cD=new Date(d); if(Math.ceil(Math.abs(cD-pD)/86400000)===1) cur++; else cur=1; if(cur>mx) mx=cur; pD=cD; } }); return mx; })();

  // 자동 높이 조절
  const handleAutoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };
  const findBibleText = () => alert("성경 찾기 기능이 호출되었습니다."); // 실제 함수는 상위에서 props로 받으세요

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="매일 QT 챌린지" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <CanvasEngine saveKey={`qt_${date}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-5 md:gap-8 pb-40 md:pb-20 items-stretch">
          <div className="flex-1 flex flex-col gap-5">
            <div className="flex justify-between items-center px-1"><span className={`text-sm font-bold ${t.textMain}`}>연속 달성 기록</span><span className={`text-2xl font-black ${t.primaryText}`}>{qtStreak}일</span></div>
            
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4 ignore-draw`}>
               <div className="flex justify-between items-center">
                  <h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><YoutubeIcon className={`w-5 h-5 ${t.pinkText}`} /> 오늘의 큐티 영상</h3>
                  <a href={`https://www.youtube.com/results?search_query=${isWknd ? '우리들교회+큐티인+새벽기도회' : '우리들교회+김양재+목사+큐티노트'}+${ymdStr}`} target="_blank" rel="noreferrer" className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded font-bold shadow-sm">검색하기 ↗</a>
               </div>
               <div className="flex gap-2">
                   <input type="text" placeholder="검색한 영상 링크 붙여넣기..." value={currDay.qtVideoUrl || ''} onChange={(e) => { const url = e.target.value; const vId = extractVideoId ? extractVideoId(url) : null; updateDay({ qtVideoUrl: url, qtVideoId: vId !== null ? vId : '', checks: { ...(currDay.checks||{}), 'QTin': true } }); }} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`flex-1 h-10 px-3 rounded-lg text-xs font-bold border outline-none ${t.inputBg} ${t.textMain}`} />
                   <button onClick={() => { if(!currDay.qtVideoId) return alert("먼저 올바른 유튜브 링크를 넣어주세요."); handleUpdateSharedQt(date, 'qt', currDay.qtVideoId); alert("앱을 사용하는 모든 사람에게 오늘의 QT 영상으로 공유되었습니다!"); }} className="bg-pink-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md hover:bg-pink-600 transition-colors shrink-0">앱 전체 공유</button>
               </div>
               <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
                  {sharedVidId ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${sharedVidId}?rel=0`} title="QT Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe> : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2"><YoutubeIcon className="w-8 h-8 opacity-40"/>영상을 검색해 링크를 넣으면 공유됩니다.</div>}
               </div>
               {globalSharedQt[date]?.qt && <p className="text-[10px] text-blue-500 font-bold text-center">✅ 이 영상은 앱 전체에 공유되고 있습니다.</p>}
               <button onClick={() => { updateDay({ checks: { ...(currDay.checks||{}), 'QTin': true } }); alert("시청 완료 체크가 되었습니다!"); }} className={`w-full py-2.5 rounded-lg text-xs font-bold ${t.appBg} ${t.textMain} border ${t.border} hover:opacity-80`}>✅ 영상 시청 완료 체크</button>
            </div>

            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}>
               <div className="flex flex-col gap-1.5"><span className={`text-xs font-bold ${t.textSub} uppercase`}>✍️ 큐티 제목</span><input type="text" value={currDay.qtTitle||''} onChange={e=>updateDay({qtTitle: e.target.value, checks: { ...(currDay.checks||{}), 'QTin': true }})} placeholder="큐티 제목..." className={`w-full h-12 px-4 rounded-xl text-sm font-bold border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} /></div>
               <div className="flex flex-col gap-1.5"><span className={`text-xs font-bold ${t.textSub} uppercase`}>📖 성경 본문</span>
                 <div className="flex gap-2"><input type="text" value={currDay.qtReference||''} onChange={e=>updateDay({qtReference: e.target.value, checks: { ...(currDay.checks||{}), 'QTin': true }})} placeholder="예: 요한복음 3장 16절" className={`flex-1 h-12 px-4 rounded-xl text-sm font-bold border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} /><button onClick={()=>findBibleText(currDay.qtReference)} className={`h-12 px-5 ${t.primaryBg} hover:opacity-80 text-white rounded-xl text-sm font-bold ignore-draw`}>찾기</button></div>
               </div>
            </div>

            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex-1 ignore-draw`}>
               <h3 className={`font-bold ${t.textMain} text-sm mb-4 border-b ${t.border} pb-3`}>📆 31일 큐티 스탬프 보드</h3>
               <div className="grid grid-cols-7 gap-2 text-center mb-3">{['일', '월', '화', '수', '목', '금', '토'].map((w, i) => <div key={w} className={`text-xs font-bold ${i===0 ? t.pinkText : i===6 ? t.primaryText : t.textSub}`}>{w}</div>)}</div>
               <div className="grid grid-cols-7 gap-2">
                  {Array.from({length: 3}, (_, i) => i).map(e => <div key={`empty-${e}`} />)}
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                     const dStr = `2026-07-${String(day).padStart(2, '0')}`; const isS = dailyData[dStr]?.checks?.['QTin'] === true; const isT = dStr === date; const dOw = (3 + day - 1) % 7;
                     return (
                       <div key={day} onClick={() => { const nS = !isS; updateDay({ checks: { ...(currDay.checks||{}), 'QTin': nS } }); if (nS && triggerConfetti) triggerConfetti(); }} onPointerDown={e=>e.stopPropagation()} className="relative flex items-center justify-center aspect-square transition-all cursor-pointer select-none group">
                          <div className={`absolute inset-0 rounded-full transition-colors ${isT ? `bg-slate-200 dark:bg-slate-700` : ``}`}></div>
                          <span className={`relative z-10 font-bold text-sm ${dOw === 0 ? t.pinkText : dOw === 6 ? t.primaryText : t.textSub} ${isT && !isS ? t.textMain : ''}`}>{day}</span>
                          {isS && <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"><div className={`w-[120%] h-[120%] border-4 border-[#FFB7B2] flex items-center justify-center rotate-[-15deg]`} style={{ borderRadius: '50% 60% 50% 40% / 40% 50% 60% 50%' }}><span className="text-[#FFB7B2] font-black text-[12px] bg-white/90 rounded-full px-1 py-0.5 leading-none shadow-sm">Good!</span></div></div>}
                       </div>
                     );
                  })}
               </div>
            </div>
          </div>
          
          <div className={`flex-1 flex flex-col ${t.cardBg} border ${t.border} shadow-sm rounded-2xl p-5 z-10 min-h-[500px] h-auto`}>
             <h3 className={`font-extrabold text-lg mb-6 border-b ${t.border} pb-3 ${t.primaryText} ignore-draw`}>📝 깊은 묵상 노트</h3>
             <div className="mb-6 flex flex-col"><span className={`text-xs font-bold ${t.textSub} uppercase tracking-wider mb-2 flex items-center gap-1.5 ignore-draw`}><ReportIcon className="w-4 h-4"/> 적용 질문</span><textarea rows={1} value={currDay.qtAppQuestion || ''} onChange={e => updateDay({qtAppQuestion: e.target.value})} onInput={handleAutoResize} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`w-full bg-transparent resize-none outline-none text-sm font-medium ${t.textMain} note-lines h-auto overflow-hidden`} placeholder="적용 질문을 적어보세요..." /></div>
             <div className="mb-6 flex flex-col"><span className={`text-xs font-bold ${t.textSub} uppercase tracking-wider mb-2 flex items-center gap-1.5 ignore-draw`}><BibleIcon className="w-4 h-4"/> 묵상하기</span><textarea rows={1} value={currDay.qtMeditation || ''} onChange={e => updateDay({qtMeditation: e.target.value})} onInput={handleAutoResize} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`w-full bg-transparent resize-none outline-none text-sm font-medium ${t.textMain} note-lines h-auto overflow-hidden`} placeholder="묵상 내용을 자유롭게 적어보세요..." /></div>
             <div className="flex flex-col flex-1"><span className={`text-xs font-bold ${t.textSub} uppercase tracking-wider mb-2 flex items-center gap-1.5 ignore-draw`}><PrayingHandsIcon className="w-4 h-4 text-orange-400"/> 적용하기</span><textarea rows={1} value={currDay.qtApplication || ''} onChange={e => updateDay({qtApplication: e.target.value})} onInput={handleAutoResize} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`w-full bg-transparent resize-none outline-none text-sm font-medium ${t.textMain} note-lines h-auto overflow-hidden min-h-full`} placeholder="오늘 하루 어떻게 적용할까요?" /></div>
          </div>
        </div>
      </CanvasEngine>
    </div>
  );
}
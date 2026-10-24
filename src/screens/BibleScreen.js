import React from 'react';
import { SubPageHeader, CanvasEngine } from '../components/Shared';
import { cleanText, getKoName, getLocalToday } from '../utils/helpers';
import { bibles } from '../data/constants';

export default function BibleScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  date, currDay, updateDay, tool, color, size,
  currentChapId, setCurrentChapId, bibleViewMode, setBibleViewMode,
  selVerses, setSelVerses, readVerses, setReadVerses, bibleHighlights, setBibleHighlights,
  readChallengeStart, setReadChallengeStart, bibleProgress, readChapsCount, openModal, setBibleNotes
}) {
  const [sBk, sCh] = currentChapId.split('-'); 
  const cBk = bibles.find(b=>b.name===sBk) || bibles[0]; 
  const cVs = cBk.chapters[parseInt(sCh)-1] || []; 
  const isAllR = cVs.length>0 && cVs.every((_, i)=>(readVerses||{})[`${sBk}-${sCh}-${i}`]);

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
       {bibleViewMode === 'index' ? (
          <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-6 pointer-events-auto">
             <div className="ignore-draw"><SubPageHeader title="성경 전체 66권" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} text-center shadow-sm ignore-draw`}>
                <span className={`text-xs font-bold ${t.primaryText} block mb-2`}>🗓️ 말씀과 함께하는 365일 기간 설정</span>
                <div className="flex items-center justify-center gap-2 mb-3"><input type="date" value={readChallengeStart} onChange={(e)=>setReadChallengeStart(e.target.value)} className={`${t.inputBg} border ${t.border} text-xs font-bold px-3 py-1.5 rounded-lg outline-none date-hidden`} /></div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden shadow-inner mb-2"><div className={`bg-gradient-to-r from-[#FFB7B2] to-[#9CB4D8] h-full transition-all duration-500`} style={{width:`${bibleProgress}%`}}></div></div>
                <div className={`flex justify-between text-xs font-bold ${t.textMain} px-1`}><span>완독: {readChapsCount}장</span><span className={t.primaryText}>진행도 {bibleProgress}%</span></div>
                <button onClick={() => { openModal('bibleChallenge'); }} className="w-full mt-3 py-3 bg-gradient-to-r from-[#9CB4D8] to-[#8FAADC] text-white text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">📖 365 통독표 상세보기</button>
             </div>
             <div className="mt-4"><h3 className={`font-extrabold ${t.textMain} text-lg mb-2 border-b ${t.border} pb-2 ignore-draw`}>구약 성경</h3><div className="flex flex-wrap gap-2">{bibles.slice(0, 39).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`px-4 py-2 rounded-xl text-sm font-bold border ${t.cardBg} ${t.textMain} ${t.border} shadow-sm hover:-translate-y-0.5 transition-transform ignore-draw`}>{getKoName(b.name)}</button>)}</div></div>
             <div className="mt-6"><h3 className={`font-extrabold ${t.textMain} text-lg mb-2 border-b ${t.border} pb-2 ignore-draw`}>신약 성경</h3><div className="flex flex-wrap gap-2">{bibles.slice(39, 66).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`px-4 py-2 rounded-xl text-sm font-bold border ${t.cardBg} ${t.textMain} ${t.border} shadow-sm hover:-translate-y-0.5 transition-transform ignore-draw`}>{getKoName(b.name)}</button>)}</div></div>
          </div>
       ) : (
          <div className="flex-1 flex flex-col h-full">
             <div className="ignore-draw"><SubPageHeader title="성경 본문" onBack={()=>{setBibleViewMode('index'); setSelVerses([]);}} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             <div className={`${t.cardBg} px-5 pt-3 pb-4 shadow-sm z-20 border-b ${t.border} flex flex-col gap-3 ignore-draw`}><div className="flex justify-between items-center"><span className={`font-bold ${t.textMain}`}>{getKoName(sBk)} {sCh}장</span><button onClick={()=>{setBibleViewMode('index'); setSelVerses([]);}} className={`h-8 px-3 rounded text-xs font-bold ${t.appBg} ${t.textMain}`}>☰ 목록</button></div></div>
             <CanvasEngine saveKey={`bible_read_${currentChapId}`} tool={tool} color={color} size={size} t={t}>
                 <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 md:gap-8 pb-40 items-stretch flex-1 relative z-10">
                     <div className="flex-1 break-words">
                         {cVs.length > 0 ? cVs.map((verse, idx) => { 
                            const vId=`${sBk}-${sCh}-${idx}`; const isR=(readVerses||{})[vId]; const isSel = selVerses.includes(vId); const hColor = (bibleHighlights||{})[vId];
                            return (
                              <p key={idx} onClick={() => { if(tool==='hand') { setReadVerses(p=>({...p, [vId]:!p[vId]})); setSelVerses(p => p.includes(vId) ? p.filter(id=>id!==vId) : [...p, vId]); } }} className={`flex gap-3 py-1.5 px-0 cursor-pointer text-sm sm:text-base transition-all ${isSel ? 'bg-slate-100 dark:bg-slate-800' : isR && (!hColor || hColor === 'transparent') ? 'opacity-40 grayscale text-slate-400' : `${t.textMain} hover:bg-slate-50 dark:hover:bg-slate-800`}`}>
                                <span className={`font-bold min-w-[1.5rem] text-right mt-0.5 ${isSel || (hColor && hColor !== 'transparent') ? t.primaryText : isR ? 'text-slate-400' : t.primaryText}`}>{idx + 1}</span>
                                <span style={hColor && hColor !== 'transparent' ? {backgroundColor: hColor, padding: '2px 4px', borderRadius: '4px', color: '#0f172a'} : {}} className={hColor && hColor !== 'transparent' ? "font-bold shadow-sm" : ""}>{cleanText(verse)}</span>
                              </p>
                            );
                         }) : <p className={`text-center ${t.textSub} mt-4 text-sm`}>데이터 없음</p>}
                         <div className="flex justify-between mt-6 gap-2 ignore-draw"><button onClick={()=>{if(parseInt(sCh)>1)setCurrentChapId(`${sBk}-${parseInt(sCh)-1}`)}} className={`w-14 h-14 ${t.appBg} border ${t.border} rounded-full font-black text-xl shadow-sm ${t.textMain}`}>{"<"}</button><button onClick={()=>{const u={}; const s=!isAllR; cVs.forEach((_, i)=>u[`${sBk}-${sCh}-${i}`]=s); setReadVerses(p=>({...p, ...u})); if(s) updateDay({ checks: { ...(currDay.checks||{}), '성경읽기': true } }); }} className={`flex-1 h-14 rounded-2xl font-bold text-sm ${isAllR ? `${t.appBg} ${t.textSub} border` : `${t.primaryBg} text-white shadow-md`}`}>장 모두 읽음 표시</button><button onClick={()=>{if(parseInt(sCh)<cBk.chapters.length)setCurrentChapId(`${sBk}-${parseInt(sCh)+1}`)}} className={`w-14 h-14 ${t.appBg} border ${t.border} rounded-full font-black text-xl shadow-sm ${t.textMain}`}>{">"}</button></div>
                     </div>
                     <div className={`hidden sm:flex flex-1 flex-col ${t.cardBg} border ${t.border} shadow-sm rounded-2xl overflow-hidden min-h-[500px]`}>
                        <div className={`p-3 border-b ${t.border} ${t.appBg} flex justify-between items-center z-10 ignore-draw`}><span className={`text-xs font-bold ml-2 ${t.textSub}`}>📝 자유 묵상 노트</span></div>
                        <textarea value={currDay.bibleFreeNote||''} onChange={e=>updateDay({bibleFreeNote:e.target.value})} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`w-full flex-1 p-5 bg-transparent outline-none resize-none text-sm z-10 ${t.textMain} h-auto overflow-hidden min-h-full note-lines`} placeholder="말씀을 보며 화살표를 긋거나 필기를 남겨보세요..." />
                     </div>
                 </div>
             </CanvasEngine>
          </div>
       )}

       {selVerses.length > 0 && bibleViewMode === 'read' && (
         <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl shadow-2xl rounded-full px-5 py-3 flex items-center gap-3 z-50 border border-slate-200 animate-fade-in-up ignore-draw">
           {['transparent', '#fef08a', '#bfdbfe', '#fecaca', '#e9d5ff', '#bbf7d0'].map(c => ( <button key={c} onClick={() => { const nH = {...bibleHighlights}; const nR = {...readVerses}; selVerses.forEach(id => { nH[id] = c; if(c!=='transparent') nR[id]=true; }); setBibleHighlights(nH); setReadVerses(nR); setSelVerses([]); }} className={`w-8 h-8 rounded-full shadow-inner border hover:scale-110 transition-transform flex items-center justify-center text-xs ${c === 'transparent' ? 'border-red-500' : 'border-slate-200'}`} style={{backgroundColor: c !== 'transparent' ? c : '#ffffff'}}>{c === 'transparent' ? '❌' : ''}</button> ))}
           <div className="w-px h-6 bg-slate-200 mx-1"></div>
           <button onClick={() => { const vData = selVerses.map(id => { const [b, ch, vIdx] = id.split('-'); const bD = bibles.find(x=>x.name===b); return { id, ref: `${getKoName(b)} ${ch}:${parseInt(vIdx)+1}`, text: cleanText(bD.chapters[ch-1][vIdx]) }; }); openModal('bibleNoteCreate', { verses: vData, note: '' }, (d) => { setBibleNotes(p => [{ id: Date.now(), date: getLocalToday(), ...d }, ...(Array.isArray(p) ? p : [])]); setSelVerses([]); }); }} className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md hover:bg-slate-800">📝 노트하기</button>
         </div>
       )}
    </div>
  );
}
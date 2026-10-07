import React from 'react';
import { ReportIcon, HeartIcon, YoutubeIcon } from '../utils/icons';
import SubPageHeader from '../components/SubPageHeader';
import CanvasEngine from '../components/CanvasEngine';
import RichTextEditor from '../components/RichTextEditor';

export default function SermonScreen({ t, currDay, updateDay, setActiveScreen, setIsSidebarOpen, isSidebarOpen, date, ymdStr, isSp, bibles, openModal, getArr, globalSharedQt, handleUpdateSharedQt, downloadSermonWord, extractVideoId, tool, color, size }) {
  
  const findBibleText = () => alert("성경 찾기 기능이 호출되었습니다.");

  return (
    <div className={`flex-1 flex flex-col h-full ${isSp ? 'bg-gradient-to-b from-[#A3C4F3] to-[#8FAADC] text-white' : t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="예배 노트" onBack={()=>setActiveScreen('home')} t={t} isSp={isSp} spTitle="✨ 기상오기" spDesc="(기적이 상식이 되는 5일의 기도)" toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <CanvasEngine saveKey={`sermon_${date}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-5 md:gap-8 pb-40 md:pb-20 items-stretch">
          <div className="flex-1 flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
               <span className={`text-sm font-extrabold ${t.textMain}`}>{date}</span>
               <div className="flex gap-2">
                  <button onClick={() => alert("AI 자동 요약 기능은 업데이트 예정입니다.")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${t.cardBg} ${t.textMain} border ${t.border}`}>🤖 AI기록</button>
                  <button onClick={() => setActiveScreen('sermonHistory')} className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ignore-draw`}>📜 전체 목록</button>
                  <button onClick={downloadSermonWord} className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-blue-600 text-white hover:bg-blue-700 ignore-draw`}>💾 Word 저장</button>
               </div>
            </div>
            
            <div className={`${isSp ? 'bg-white/90 shadow-xl text-slate-800' : `${t.cardBg} border ${t.border} shadow-sm`} p-5 rounded-2xl flex flex-col gap-4`}>
              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1 flex flex-col gap-1.5"><span className="text-xs font-bold uppercase">설교 제목</span><input type="text" value={currDay.sermonTitle||''} onChange={e=>updateDay({sermonTitle:e.target.value})} className={`w-full h-12 px-4 rounded-xl text-sm font-bold border outline-none ${isSp ? 'bg-black/10 text-slate-900 border-white/20' : `${t.inputBg} ${t.textMain}`}`} onPointerDown={e => e.stopPropagation()} /></div>
                 <div className="flex-1 flex flex-col gap-1.5"><span className="text-xs font-bold uppercase text-blue-500">설교자</span><input type="text" value={currDay.sermonPreacher||''} onChange={e=>updateDay({sermonPreacher:e.target.value})} className={`w-full h-12 px-4 rounded-xl text-sm font-bold border outline-none ${isSp ? 'bg-black/10 text-slate-900 border-white/20' : `${t.inputBg} ${t.textMain}`}`} onPointerDown={e => e.stopPropagation()} /></div>
              </div>
              <div className="flex flex-col gap-1.5"><span className="text-xs font-bold uppercase">본문</span><div className="flex gap-2"><input type="text" value={currDay.sermonReference||''} onChange={e=>updateDay({sermonReference:e.target.value})} className={`flex-1 h-12 px-4 rounded-xl text-sm font-bold border outline-none ${isSp ? 'bg-black/10 text-slate-900 border-white/20' : `${t.inputBg} ${t.textMain}`}`} onPointerDown={e => e.stopPropagation()}/><button onClick={()=>findBibleText(currDay.sermonReference)} className={`h-12 px-5 ${t.primaryBg} hover:opacity-80 text-white rounded-xl text-sm font-bold shadow-sm transition-colors ignore-draw`}>찾기</button></div></div>
            </div>
            
            <div className={`${isSp ? 'bg-white/90 shadow-xl text-slate-800' : `${t.cardBg} border ${t.border} shadow-sm`} p-5 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform`} onClick={()=>openModal('thanksDeclaration', currDay, updateDay)} onPointerDown={e => e.stopPropagation()}>
              <h3 className="font-bold text-sm mb-3 text-[#FFB7B2] flex items-center gap-2"><HeartIcon className="w-5 h-5" /> 나의 감사 선포 ↗</h3>
              <div className="flex flex-col gap-2">{getArr(currDay.thanksDeclarations, ['','']).map((q, i) => <div key={i} className={`p-3 rounded-lg border ${isSp?'bg-white/50 border-white/40':`${t.appBg} ${t.textMain} ${t.border}`}`}><span className={`text-[#FFB7B2] font-bold mr-2`}>{i+1}.</span>{q||<span className="opacity-50 text-slate-400">기록하세요.</span>}</div>)}</div>
            </div>
            
            <div className={`${isSp ? 'bg-white/90 shadow-xl text-slate-800' : `${t.cardBg} border ${t.border} shadow-sm`} p-5 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform`} onClick={()=>openModal('applyQuestion', currDay, updateDay)} onPointerDown={e => e.stopPropagation()}>
              <h3 className={`font-bold text-sm mb-3 ${t.primaryText} flex items-center gap-2`}><ReportIcon className="w-5 h-5" /> 나의 적용 질문 ↗</h3>
              <div className="flex flex-col gap-2">{getArr(currDay.applyQuestions).length>0 ? getArr(currDay.applyQuestions).map((q, i) => <div key={i} className={`p-3 rounded-lg border flex gap-2 ${(q||'').startsWith('🤖')?'bg-blue-50 border-blue-200 text-blue-900':isSp?'bg-white/50 border-white/40':`${t.appBg} ${t.textMain} ${t.border}`}`}><span className={`${t.primaryText} font-bold`}>{i+1}.</span><span>{q}</span></div>) : <div className={`text-center py-3 border border-dashed rounded-lg ${isSp?'text-slate-500 border-slate-300':`${t.textSub} ${t.border}`}`}>기록이 없습니다.</div>}</div>
            </div>

            <div className={`${isSp ? 'bg-white/90 shadow-xl text-slate-800' : `${t.cardBg} border ${t.border} shadow-sm`} p-5 rounded-2xl flex flex-col gap-4 ignore-draw`}>
               <div className="flex justify-between items-center">
                  <h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><YoutubeIcon className={`w-5 h-5 text-red-500`} /> 예배 / 설교 영상 시청</h3>
                  <a href="https://youtube.com/channel/UCvjUwGIQZ7ehN0vG6nBm2gA" target="_blank" rel="noreferrer" className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded font-bold shadow-sm">채널 바로가기 ↗</a>
               </div>
               <div className="flex gap-2">
                   <input type="text" placeholder="영상 링크 붙여넣기..." value={currDay.sermonVideoUrl || ''} onChange={(e) => { const url = e.target.value; const vId = extractVideoId ? extractVideoId(url) : null; updateDay({ sermonVideoUrl: url, sermonVideoId: vId !== null ? vId : '' }); }} onPointerDown={e => { if(tool === 'hand') e.stopPropagation(); }} className={`flex-1 h-10 px-3 rounded-lg text-xs font-bold border outline-none ${t.inputBg} ${t.textMain}`} />
                   <button onClick={() => { if(!currDay.sermonVideoId) return alert("먼저 올바른 유튜브 링크를 넣어주세요."); handleUpdateSharedQt(date, 'sermon', currDay.sermonVideoId); alert("공유되었습니다!"); }} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md hover:bg-red-600 transition-colors shrink-0">앱 전체 공유</button>
               </div>
               <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
                  {(globalSharedQt[date]?.sermon || currDay.sermonVideoId) ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${globalSharedQt[date]?.sermon || currDay.sermonVideoId}?rel=0`} title="Sermon Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe> : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2"><YoutubeIcon className="w-8 h-8 opacity-40"/>영상을 검색해 링크를 넣으면 모두와 공유됩니다.</div>}
               </div>
            </div>
          </div>
          
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[500px] border ${t.border} shadow-sm`}>
             <div className={`p-3 border-b ${t.border} ${isSp?'bg-white/80 border-white/30':t.appBg} flex justify-between items-center z-10`}>
                <span className="text-xs font-bold ml-2">📝 스마트 말씀 노트</span>
                <button onPointerDown={e=>e.stopPropagation()} onClick={(e) => {
                    const btn = e.currentTarget; const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return alert("마이크 미지원 브라우저입니다.");
                    if(btn.dataset.recording === 'true') { btn.dataset.recording = 'false'; window.sermonRec?.stop(); btn.innerHTML = '🎤 음성입력'; btn.classList.remove('animate-pulse','text-red-500'); return; }
                    btn.dataset.recording = 'true'; btn.innerHTML = '🔴 무제한 듣는중...'; btn.classList.add('animate-pulse','text-red-500');
                    const startRec = () => { const rec = new SR(); rec.lang = 'ko-KR'; rec.continuous = true; window.sermonRec = rec; rec.onend = () => { if (btn.dataset.recording === 'true') { setTimeout(() => { try { startRec(); } catch(err){} }, 300); } else { btn.innerHTML = '🎤 음성입력'; btn.classList.remove('animate-pulse','text-red-500'); } }; rec.onresult = (ev) => { let final = ''; for (let i = ev.resultIndex; i < ev.results.length; ++i) { if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' '; } if(final) { updateDay({ sermonNotes: (currDay.sermonNotes || '') + final }); } }; rec.start(); }; startRec();
                }} className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md shadow-sm z-10 hover:opacity-80 ignore-draw transition-colors">🎤 음성입력</button>
             </div>
             <div className="flex-1 bg-white dark:bg-slate-800">
               <RichTextEditor value={currDay.sermonNotes} onChange={(val) => updateDay({sermonNotes: val})} t={t} isSp={isSp} bibles={bibles} placeholder="[스마트 기능]
1. 툴바를 이용해 표 생성, 정렬 가능.
2. '사무엘하 21:1~4' 후 스페이스바를 누르면 본문 박스가 생성됩니다." />
             </div>
          </div>
        </div>
      </CanvasEngine>
    </div>
  );
}
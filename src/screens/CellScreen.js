import React from 'react';
import { SubPageHeader, CanvasEngine } from '../components/Shared';
import { ReportIcon, BibleIcon, HeartIcon, PrayingHandsIcon, UserFaceIcon } from '../utils/icons';

export default function CellScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  date, currDay, updateDay, tool, color, size,
  authUser, globalCellData, handleUpdateCell, handleAutoNumbering
}) {
  const isAdmin = authUser?.role === 'admin';
  
  const copyCellReport = () => { 
    const pray = (globalCellData.groupPrayers||[]).map((p,i)=>`${i+1}. [${p.name}] ${p.text}`).join('\n'); 
    const txt = `[목장 모임 보고서]\n목장명: ${authUser?.group||''}\n작성자: ${authUser?.name||''}\n\n[주간 공지사항]\n${globalCellData.notice||''}\n\n[목장 중보기도]\n${globalCellData.cellIntercession||''}\n\n[식구 기도제목]\n${pray}`; 
    navigator.clipboard.writeText(txt); 
    alert("목장 보고서가 복사되었습니다!"); 
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="목장 모임" onBack={()=>setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <CanvasEngine saveKey={`cell_${date}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col gap-6 pb-40">
          <div className="flex justify-between items-center">
             <h2 className={`text-xl font-black ${t.textMain}`}>[{authUser?.group || '소속 없음'}]</h2>
             {isAdmin && <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200">🔥 관리자 접속중</span>}
          </div>
          
          <div className={`${t.cardBg} p-5 rounded-2xl shadow-sm border ${t.border} flex flex-col gap-2`}>
             <h3 className={`font-extrabold text-sm flex items-center gap-2 ${t.primaryText}`}><ReportIcon className="w-5 h-5"/> 주간 공지사항 (주보)</h3>
             {isAdmin ? (
                 <textarea value={globalCellData.notice} onChange={e=>handleUpdateCell(p=>({...p, notice:e.target.value}))} className={`w-full mt-2 ${t.inputBg} ${t.textMain} p-3 rounded-xl text-sm border outline-none min-h-[80px] resize-none`} onPointerDown={e=>e.stopPropagation()} />
             ) : (
                 <div className={`mt-2 p-3 ${t.appBg} rounded-xl text-sm font-medium ${t.textMain} whitespace-pre-wrap leading-relaxed`}>{globalCellData.notice || '등록된 공지사항이 없습니다.'}</div>
             )}
          </div>

          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}>
            <h3 className={`font-extrabold text-sm flex items-center gap-2 ${t.textMain}`}>✏️ 나의 나눔 작성하기</h3>
            <div className="flex flex-col gap-2"><span className={`text-[11px] font-bold ${t.textSub} flex items-center gap-1`}><BibleIcon className={`w-4 h-4 ${t.primaryText}`}/> 말씀 나눔</span><textarea value={currDay.wordShare||''} onChange={(e)=>handleAutoNumbering(e, 'wordShare')} className={`w-full ${t.inputBg} ${t.textMain} p-4 rounded-xl text-sm border outline-none h-20 resize-none`} placeholder="엔터를 치면 자동으로 번호가 매겨집니다." onPointerDown={e=>e.stopPropagation()}/></div>
            <div className={`w-full h-px ${t.border}`}></div>
            <div className="flex flex-col gap-2"><span className={`text-[11px] font-bold ${t.textSub} flex items-center gap-1`}><HeartIcon className={`w-4 h-4 ${t.pinkText}`}/> 감사 나눔</span><textarea value={currDay.thanksShare||''} onChange={(e)=>handleAutoNumbering(e, 'thanksShare')} className={`w-full ${t.inputBg} ${t.textMain} p-4 rounded-xl text-sm border outline-none h-20 resize-none`} placeholder="엔터를 치면 자동으로 번호가 매겨집니다." onPointerDown={e=>e.stopPropagation()}/></div>
            <div className={`w-full h-px ${t.border}`}></div>
            <div className="flex flex-col gap-2"><span className={`text-[11px] font-bold ${t.textSub} flex items-center gap-1`}><PrayingHandsIcon className="w-4 h-4 text-orange-400"/> 개인 기도제목</span><textarea value={currDay.prayerReq||''} onChange={(e)=>handleAutoNumbering(e, 'prayerReq')} className={`w-full ${t.inputBg} ${t.textMain} p-4 rounded-xl text-sm border outline-none h-20 resize-none`} placeholder="엔터를 치면 자동으로 번호가 매겨집니다." onPointerDown={e=>e.stopPropagation()}/></div>
            <button onClick={() => { if(!currDay.prayerReq && !currDay.wordShare) return alert("나눔 내용이나 기도제목을 작성해주세요."); const submission = { id: Date.now(), name: authUser?.name, wordShare: currDay.wordShare, thanksShare: currDay.thanksShare, prayerReq: currDay.prayerReq, date: date }; handleUpdateCell(p => ({ ...p, submissions: [submission, ...(p.submissions||[])] })); alert("제출되었습니다!"); }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-colors mt-2 ignore-draw">📤 목장 모임지 제출하기</button>
          </div>

          {isAdmin && (
            <div className={`${t.cardBg} p-5 rounded-2xl border-2 border-dashed border-red-300 shadow-sm flex flex-col gap-4`}>
              <h3 className={`font-extrabold text-sm flex items-center gap-2 text-red-500`}><UserFaceIcon className="w-5 h-5"/> [관리자 전용] 제출된 목원 나눔지</h3>
              {(globalCellData.submissions || []).map(sub => (
                  <div key={sub.id} className={`p-4 ${t.appBg} rounded-xl border ${t.border} flex flex-col gap-2`}>
                      <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold text-sm text-blue-600`}>👤 {sub.name} <span className="text-[10px] text-slate-400 font-normal ml-2">{sub.date} 제출</span></span>
                          <button onClick={() => { handleUpdateCell(p => ({...p, submissions: p.submissions.filter(x=>x.id!==sub.id)})); }} className="text-[10px] text-red-400 font-bold bg-red-50 px-2 py-1 rounded">삭제</button>
                      </div>
                      {sub.wordShare && <p className={`text-xs ${t.textMain}`}><span className="font-bold text-slate-400 block mb-1">말씀:</span> <span className="whitespace-pre-wrap">{sub.wordShare}</span></p>}
                      {sub.thanksShare && <p className={`text-xs ${t.textMain} mt-2`}><span className="font-bold text-slate-400 block mb-1">감사:</span> <span className="whitespace-pre-wrap">{sub.thanksShare}</span></p>}
                      {sub.prayerReq && (
                          <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex flex-col gap-2 border border-blue-100 dark:border-blue-800">
                             <p className={`text-xs ${t.textMain} font-bold break-all whitespace-pre-wrap`}><span className="text-orange-500 mb-1 block">기도:</span> {sub.prayerReq}</p>
                             <button onClick={() => { handleUpdateCell(p => ({...p, groupPrayers: [{id: Date.now(), name: sub.name, text: sub.prayerReq, status: 'praying'}, ...(p.groupPrayers||[])] })); alert(`${sub.name}님의 기도제목이 식구 기도제목 리스트로 승인되었습니다.`); }} className="text-[10px] bg-blue-500 text-white px-2 py-1.5 rounded shadow-sm hover:bg-blue-600 ignore-draw self-end">식구 기도제목으로 올리기</button>
                          </div>
                      )}
                  </div>
              ))}
              {(globalCellData.submissions || []).length === 0 && <p className="text-center text-xs text-slate-400 py-4">새로 제출된 모임지가 없습니다.</p>}
            </div>
          )}

          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}>
              <div className="flex justify-between items-center border-b pb-3 mb-2">
                 <h3 className={`font-extrabold text-sm flex items-center gap-2 ${t.textMain}`}><PrayingHandsIcon className="w-5 h-5 text-green-500"/> 전체 식구 기도제목</h3>
                 <button onClick={copyCellReport} className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded border shadow-sm">보고서 복사</button>
              </div>
              <div className={`p-4 rounded-xl border border-dashed border-green-300 bg-green-50/50 dark:bg-green-900/10 mb-2`}>
                 <span className={`text-[11px] font-bold text-green-600 mb-1 block`}>⛪ 목장 중보기도</span>
                 {isAdmin ? (
                     <textarea value={globalCellData.cellIntercession||''} onChange={e=>handleUpdateCell(p=>({...p, cellIntercession: e.target.value}))} className={`w-full p-2 bg-transparent text-sm font-bold ${t.textMain} outline-none border-b border-green-200 resize-none h-16`} placeholder="이번 주 목장 전체를 위한 중보기도 제목..." onPointerDown={e=>e.stopPropagation()}/>
                 ) : (
                     <div className={`text-sm font-medium ${t.textMain} whitespace-pre-wrap`}>{globalCellData.cellIntercession || '등록된 목장 중보기도가 없습니다.'}</div>
                 )}
              </div>
              {isAdmin && (
                  <div className="flex gap-2 mb-2 pointer-events-auto z-50">
                     <input type="text" id="adminPrayerName" placeholder="이름" className={`w-20 px-2 h-10 border ${t.border} rounded-lg text-xs outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()}/>
                     <input type="text" id="adminPrayerText" placeholder="수기 기도제목 입력..." className={`flex-1 px-3 h-10 border ${t.border} rounded-lg text-xs outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()}/>
                     <button onClick={() => { const n = document.getElementById('adminPrayerName').value; const txt = document.getElementById('adminPrayerText').value; if(!n || !txt) return; handleUpdateCell(p => ({...p, groupPrayers: [{id: Date.now(), name: n, text: txt, status: 'praying'}, ...(p.groupPrayers||[])] })); document.getElementById('adminPrayerText').value = ''; document.getElementById('adminPrayerName').value = ''; }} className="bg-slate-700 text-white px-3 rounded-lg text-xs font-bold ignore-draw">직접등록</button>
                  </div>
              )}
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto hide-scrollbar">
                  {(globalCellData.groupPrayers || []).map(gp => (
                      <div key={gp.id} className={`flex items-start gap-2 p-3 rounded-xl border ${gp.status==='answered' ? 'bg-green-50/50 border-green-100 opacity-60' : `${t.appBg} ${t.border}`}`}>
                          <div className="flex-1 flex flex-col">
                             <span className={`text-[11px] font-black ${gp.status==='answered'?'text-green-600':'text-blue-500'}`}>{gp.name}</span>
                             <span className={`text-sm font-medium ${t.textMain} mt-0.5 whitespace-pre-wrap ${gp.status==='answered'?'line-through':''}`}>{gp.text}</span>
                          </div>
                          {isAdmin && (
                              <div className="flex gap-1 shrink-0 z-50 pointer-events-auto">
                                 <button onClick={() => handleUpdateCell(p => ({...p, groupPrayers: p.groupPrayers.map(x=>x.id===gp.id?{...x, status: x.status==='praying'?'answered':'praying'}:x)}))} className={`text-[10px] px-2 py-1 rounded font-bold shadow-sm ${gp.status==='praying'?'bg-green-500 text-white':'bg-slate-400 text-white'}`} onPointerDown={e=>e.stopPropagation()}>{gp.status==='praying'?'응답':'대기'}</button>
                                 <button onClick={() => handleUpdateCell(p => ({...p, groupPrayers: p.groupPrayers.filter(x=>x.id!==gp.id)}))} className={`text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded font-bold shadow-sm`} onPointerDown={e=>e.stopPropagation()}>삭제</button>
                              </div>
                          )}
                      </div>
                  ))}
                  {(globalCellData.groupPrayers || []).length === 0 && <p className="text-center text-xs text-slate-400 py-4">등록된 식구 기도제목이 없습니다.</p>}
              </div>
          </div>
        </div>
      </CanvasEngine>
    </div>
  );
}
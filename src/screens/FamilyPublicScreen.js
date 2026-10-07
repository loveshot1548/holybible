import React from 'react';
import { SubPageHeader, CanvasEngine } from '../components/Shared';
import { BibleIcon, HeartIcon, PrayingHandsIcon } from '../utils/icons';
import { formatVerseText, getSeededVerse } from '../utils/helpers';

export default function FamilyPublicScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  date, currDay, updateDay, tool, color, size,
  familyPublicData, setFamilyPublicData, triggerConfetti
}) {
  const familyVerseText = getSeededVerse(date, 'family');
  const formatFamVerse = formatVerseText(familyVerseText);

  const addFamilyPublicItem = (key, text) => setFamilyPublicData(p => ({ ...p, [key]: [{ id: Date.now(), text, date: date }, ...(p[key] || [])] }));
  const removeFamilyPublicItem = (key, id) => setFamilyPublicData(p => ({ ...p, [key]: p[key].filter(item => item.id !== id) }));

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="공개 가정 예배" onBack={() => setActiveScreen('familySelect')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <CanvasEngine saveKey={`family_public_${date}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col gap-6 pb-40">
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm text-center`}><h3 className={`text-sm font-bold text-blue-600 mb-3`}>오늘의 가정예배 말씀</h3><p className={`text-lg font-bold ${t.textMain} break-keep`}>{formatFamVerse.text}</p><p className={`text-xs ${t.textSub} mt-2`}>{formatFamVerse.ref}</p></div>
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><div className="flex flex-col gap-1"><span className={`text-xs font-bold ${t.textSub}`}>👨‍👩‍👧‍👦 참석자</span><input type="text" value={familyPublicData.attendees||''} onChange={(e) => setFamilyPublicData(p => ({...p, attendees: e.target.value}))} placeholder="예: 할아버지, 삼촌, 우리 가족..." className={`w-full h-12 px-4 rounded-xl text-sm font-bold border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e => e.stopPropagation()} /></div></div>
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><BibleIcon className="w-5 h-5 text-indigo-500"/> 말씀 묵상 나누기</h3><textarea value={familyPublicData.wordMeditation||''} onChange={(e) => setFamilyPublicData(p => ({...p, wordMeditation: e.target.value}))} placeholder="말씀을 읽고 나눈 은혜를 자유롭게 적어보세요..." className={`w-full p-4 rounded-xl text-sm border outline-none h-24 resize-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /></div>
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><HeartIcon className="w-5 h-5 text-pink-500"/> 가족 감사 나눔</h3>{(familyPublicData.thanks||[]).map((th) => ( <div key={th.id} className="flex gap-2"><input type="text" value={th.text} onChange={(e) => setFamilyPublicData(p => ({...p, thanks: p.thanks.map(x => x.id === th.id ? {...x, text: e.target.value} : x)}))} className={`flex-1 h-10 px-3 rounded-lg text-sm border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /><button onClick={() => removeFamilyPublicItem('thanks', th.id)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold shrink-0">삭제</button></div> ))} <button onClick={() => addFamilyPublicItem('thanks', '')} className={`w-full py-2 border-2 border-dashed ${t.border} ${t.textSub} font-bold rounded-lg text-xs`}>+ 감사 나눔 추가</button></div>
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><PrayingHandsIcon className="w-5 h-5 text-green-500"/> 기도 제목</h3>{(familyPublicData.prayers||[]).map((pr) => ( <div key={pr.id} className="flex gap-2"><input type="text" value={pr.text} onChange={(e) => setFamilyPublicData(p => ({...p, prayers: p.prayers.map(x => x.id === pr.id ? {...x, text: e.target.value} : x)}))} className={`flex-1 h-10 px-3 rounded-lg text-sm border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /><button onClick={() => removeFamilyPublicItem('prayers', pr.id)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold shrink-0">삭제</button></div> ))} <button onClick={() => addFamilyPublicItem('prayers', '')} className={`w-full py-2 border-2 border-dashed ${t.border} ${t.textSub} font-bold rounded-lg text-xs`}>+ 기도 제목 추가</button></div>
          <button onClick={() => { updateDay({ checks: { ...(currDay.checks||{}), '가정예배': true } }); triggerConfetti(); alert("공개 가정예배를 완료했습니다! 🥰"); }} className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-colors ${currDay.checks?.['가정예배'] ? 'bg-slate-200 text-slate-500' : 'bg-blue-500 text-white hover:bg-blue-600'} ignore-draw`}>{currDay.checks?.['가정예배'] ? '✅ 오늘 가정예배 완료됨' : '🌟 오늘 가정예배 완료 체크'}</button>
        </div>
      </CanvasEngine>
    </div>
  );
}
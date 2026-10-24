import React from 'react';
import { SubPageHeader, CanvasEngine } from '../components/Shared';
import { BibleIcon, HeartIcon, PrayingHandsIcon, SmileFaceIcon } from '../utils/icons';
import { formatVerseText, getSeededVerse } from '../utils/helpers';

export default function FamilyPrivateScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  date, currDay, updateDay, tool, color, size,
  familyRoomPw, familyRoomData, setFamilyRoomData, triggerConfetti
}) {
  const familyVerseText = getSeededVerse(date, 'family');
  const formatFamVerse = formatVerseText(familyVerseText);

  const addFamilyDataItem = (key, text) => setFamilyRoomData(p => ({ ...p, [key]: [{ id: Date.now(), text, date: date }, ...(p[key] || [])] }));
  const removeFamilyDataItem = (key, id) => setFamilyRoomData(p => ({ ...p, [key]: p[key].filter(item => item.id !== id) }));

  // 이 함수는 App.js의 handleUpdateFamily를 prop으로 넘겨받아 사용하는 것이 더 좋지만, 
  // 여기서는 로컬 상태 변경과 함께 사용합니다 (클라우드 연동 시 App.js의 함수를 사용하세요)
  const handleUpdateFamily = (updater) => {
    setFamilyRoomData(updater);
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="우리가족 가정 예배" onBack={() => setActiveScreen('familySelect')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <CanvasEngine saveKey={`family_private_${familyRoomPw}_${date}`} tool={tool} color={color} size={size} t={t}>
        <div className="p-4 sm:p-6 flex flex-col gap-6 pb-40">
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm text-center`}><h3 className={`text-sm font-bold text-pink-500 mb-3`}>오늘의 가정예배 말씀</h3><p className={`text-lg font-bold ${t.textMain} break-keep`}>{formatFamVerse.text}</p><p className={`text-xs ${t.textSub} mt-2`}>{formatFamVerse.ref}</p></div>
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><div className="flex flex-col gap-1"><span className={`text-xs font-bold ${t.textSub}`}>👨‍👩‍👧‍👦 참석자</span><input type="text" value={familyRoomData.attendees||''} onChange={(e) => handleUpdateFamily(p => ({...p, attendees: e.target.value}))} placeholder="예: 아빠, 엄마, 은우" className={`w-full h-12 px-4 rounded-xl text-sm font-bold border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e => e.stopPropagation()} /></div></div>
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><BibleIcon className="w-5 h-5 text-indigo-500"/> 말씀 묵상 나누기</h3><textarea value={familyRoomData.wordMeditation||''} onChange={(e) => handleUpdateFamily(p => ({...p, wordMeditation: e.target.value}))} placeholder="말씀을 읽고 나눈 은혜를 자유롭게 적어보세요..." className={`w-full p-4 rounded-xl text-sm border outline-none h-24 resize-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /></div>
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><HeartIcon className="w-5 h-5 text-pink-500"/> 가족 감사 나눔</h3>{(familyRoomData.thanks||[]).map((th) => ( <div key={th.id} className="flex gap-2"><input type="text" value={th.text} onChange={(e) => handleUpdateFamily(p => ({...p, thanks: p.thanks.map(x => x.id === th.id ? {...x, text: e.target.value} : x)}))} className={`flex-1 h-10 px-3 rounded-lg text-sm border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /><button onClick={() => removeFamilyDataItem('thanks', th.id)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold shrink-0">삭제</button></div> ))} <button onClick={() => addFamilyDataItem('thanks', '')} className={`w-full py-2 border-2 border-dashed ${t.border} ${t.textSub} font-bold rounded-lg text-xs`}>+ 감사 나눔 추가</button></div>
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><PrayingHandsIcon className="w-5 h-5 text-green-500"/> 가족 기도 제목</h3>{(familyRoomData.prayers||[]).map((pr) => ( <div key={pr.id} className="flex gap-2"><input type="text" value={pr.text} onChange={(e) => handleUpdateFamily(p => ({...p, prayers: p.prayers.map(x => x.id === pr.id ? {...x, text: e.target.value} : x)}))} className={`flex-1 h-10 px-3 rounded-lg text-sm border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /><button onClick={() => removeFamilyDataItem('prayers', pr.id)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold shrink-0">삭제</button></div> ))} <button onClick={() => addFamilyDataItem('prayers', '')} className={`w-full py-2 border-2 border-dashed ${t.border} ${t.textSub} font-bold rounded-lg text-xs`}>+ 기도 제목 추가</button></div>
            <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm flex flex-col gap-4`}><h3 className={`font-bold ${t.textMain} text-sm flex items-center gap-2`}><SmileFaceIcon className="w-5 h-5 text-yellow-500"/> 우리 가족 칭찬하기</h3>{(familyRoomData.goodDeeds||[]).map((gd) => ( <div key={gd.id} className="flex gap-2"><input type="text" value={gd.text} onChange={(e) => handleUpdateFamily(p => ({...p, goodDeeds: p.goodDeeds.map(x => x.id === gd.id ? {...x, text: e.target.value} : x)}))} placeholder="누구를, 어떤 일로 칭찬하나요?" className={`flex-1 h-10 px-3 rounded-lg text-sm border outline-none ${t.inputBg} ${t.textMain}`} onPointerDown={e=>e.stopPropagation()} /><button onClick={() => removeFamilyDataItem('goodDeeds', gd.id)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold shrink-0">삭제</button></div> ))} <button onClick={() => addFamilyDataItem('goodDeeds', '')} className={`w-full py-2 border-2 border-dashed ${t.border} ${t.textSub} font-bold rounded-lg text-xs`}>+ 칭찬 추가하기</button></div>
            <button onClick={() => { updateDay({ checks: { ...(currDay.checks||{}), '가정예배': true } }); triggerConfetti(); alert("가정예배를 완료했습니다! 🥰"); }} className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-colors ${currDay.checks?.['가정예배'] ? 'bg-slate-200 text-slate-500' : 'bg-pink-500 text-white hover:bg-pink-600'} ignore-draw`}>{currDay.checks?.['가정예배'] ? '✅ 오늘 가정예배 완료됨' : '🌟 오늘 가정예배 완료 체크'}</button>
        </div>
      </CanvasEngine>
    </div>
  );
}
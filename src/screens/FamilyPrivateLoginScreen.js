import React from 'react';
import { SmileFaceIcon } from '../utils/icons';

export default function FamilyPrivateScreen({ t, familyRoomData, handleUpdateFamily, dateHash, formatVerse, currentBgUrl, openModal }) {
  // 로딩 에러 방지용 안전장치
  const safeFormatVerse = formatVerse || { text: "마땅히 행할 길을 아이에게 가르치라 그리하면 늙어도 그것을 떠나지 아니하리라", ref: "(잠언 22:6)" };
  const safeBgUrl = currentBgUrl || 'https://picsum.photos/seed/family/800/400';

  return (
    <div className={`flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <div className={`flex items-center gap-3 px-5 py-4 ${t.appBg} shadow-sm border-b ${t.border}`}>
         <SmileFaceIcon className="w-6 h-6 text-yellow-500" />
         <h1 className={`text-lg font-extrabold ${t.textMain}`}>우리 가족 예배</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5">
        
        {/* 말씀 박스 완벽 복구 */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm min-h-[120px] flex flex-col justify-center border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { if(openModal) openModal('fullVerse', { text: `${safeFormatVerse.text} ${safeFormatVerse.ref}`, bgHash: dateHash || 0 }); }}>
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${safeBgUrl})` }}></div>
           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>
           <div className="relative z-10 p-5 text-center">
             <span className="text-xs font-bold text-white/80 mb-2 block drop-shadow-md">👨‍👩‍👧‍👦 오늘 우리 가정에 주시는 말씀</span>
             <span className="text-sm text-white font-bold leading-relaxed drop-shadow-md break-keep font-yeongnamnu">
                 {safeFormatVerse.text} <span className="block mt-1 text-[11px] opacity-80 font-sans">{safeFormatVerse.ref}</span>
             </span>
           </div>
         </div>

         <div className="space-y-4">
            <div className="flex flex-col gap-1.5"><label className={`text-xs font-bold ${t.textSub}`}>참석자</label><input type="text" value={familyRoomData?.attendees||''} onChange={e=>handleUpdateFamily({attendees:e.target.value})} className={`w-full p-3 rounded-xl ${t.inputBg} ${t.textMain} border outline-none text-sm`} placeholder="예: 아빠, 엄마, 예준, 예서" /></div>
            <div className="flex flex-col gap-1.5"><label className={`text-xs font-bold ${t.textSub}`}>말씀 나눔</label><textarea value={familyRoomData?.wordMeditation||''} onChange={e=>handleUpdateFamily({wordMeditation:e.target.value})} className={`w-full p-3 rounded-xl ${t.inputBg} ${t.textMain} border outline-none text-sm h-24 resize-none`} placeholder="오늘 말씀을 읽고 느낀 점을 나누어 보세요." /></div>
         </div>
      </div>
    </div>
  );
}
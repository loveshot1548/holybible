import React from 'react';
import { FireIcon, HeartIcon, BibleIcon, PrayingHandsIcon, SmileFaceIcon } from '../utils/icons';

export default function FiveSetMenuScreen({ t, currDay, updateDay, openModal, setActiveScreen, triggerConfetti }) {
  const items = [
    { id: '감사', desc: '오늘 하루 감사한 일 기록하기', icon: <HeartIcon className="w-6 h-6"/>, color: 'text-pink-500', bg: 'bg-pink-50', action: () => openModal('thanks') },
    { id: '성경읽기', desc: '통독 365 챌린지 읽기', icon: <BibleIcon className="w-6 h-6"/>, color: 'text-indigo-500', bg: 'bg-indigo-50', action: () => setActiveScreen('bible') },
    { id: 'QTin', desc: '매일 QT / 묵상 노트 기록', icon: <FireIcon className="w-6 h-6"/>, color: 'text-red-500', bg: 'bg-red-50', action: () => setActiveScreen('qt') },
    { id: '기도하기', desc: '나의 기도와 중보기도', icon: <PrayingHandsIcon className="w-6 h-6"/>, color: 'text-green-500', bg: 'bg-green-50', action: () => openModal('globalPrayer') },
    { id: '가정예배', desc: '가정 예배 및 나눔 기록', icon: <SmileFaceIcon className="w-6 h-6"/>, color: 'text-yellow-500', bg: 'bg-yellow-50', action: () => setActiveScreen('familySelect') }
  ];

  return (
    <div className={`flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <div className={`flex items-center px-5 py-4 ${t.appBg} shadow-sm border-b ${t.border}`}>
         <button 
           onClick={() => setActiveScreen('home')} 
           className={`p-1 mr-2 -ml-1 rounded-full ${t.textSub} hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
           </svg>
         </button>
         <FireIcon className="w-6 h-6 text-pink-500 mr-2" />
         <h1 className={`text-lg font-extrabold ${t.textMain}`}>영적 5종 세트</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">
        {items.map(item => {
          const isChecked = currDay?.checks?.[item.id] === true;
          return (
            <div key={item.id} className={`${t.cardBg} p-4 rounded-2xl border ${t.border} shadow-sm flex items-center justify-between`}>
              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={item.action}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-base ${t.textMain} mb-0.5`}>{item.id}</h3>
                  <p className={`text-[11px] ${t.textSub}`}>{item.desc}</p>
                </div>
              </div>
              <button onClick={() => {
                updateDay({ checks: { ...(currDay?.checks||{}), [item.id]: !isChecked } });
                if (!isChecked && triggerConfetti) triggerConfetti();
              }} className={`w-9 h-9 ml-2 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-pink-500 border-pink-500 text-white' : `border-slate-300 text-transparent`}`}>
                ✔
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
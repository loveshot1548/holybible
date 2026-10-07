import React from 'react';
import SubPageHeader from '../components/SubPageHeader';

export default function InterlinearScreen({ t, mockInterlinearGen1_1, openModal, setActiveScreen, setIsSidebarOpen, isSidebarOpen }) {
  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
       <SubPageHeader title="원어 성경 연구 (BETA)" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
       <div className="flex-1 overflow-y-auto p-5 pb-40">
          <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm mb-6 flex flex-col gap-2`}>
             <h3 className={`font-extrabold text-lg text-indigo-600 mb-2 border-b ${t.border} pb-2`}>창세기 1장 1절</h3>
             <p className={`font-bold ${t.textMain} text-base`}>태초에 하나님이 천지를 창조하시니라</p>
             <p className={`text-sm text-slate-500 font-medium`}>In the beginning God created the heavens and the earth.</p>
             <p className={`text-xl font-black ${t.textMain} mt-1 text-left`} dir="ltr">בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {mockInterlinearGen1_1.map((word) => (
                <div key={word.id} onClick={() => openModal('strongsDic', word)} className={`${t.cardBg} p-4 rounded-2xl border ${t.border} shadow-sm cursor-pointer hover:-translate-y-1 transition-transform flex flex-col justify-between gap-3`}>
                   <div className="flex flex-col gap-1 items-start">
                       <span className={`text-2xl font-black ${t.textMain} mb-1 text-left`} dir="ltr">{word.hebrew}</span>
                       <span className="text-[10px] text-slate-500 font-mono tracking-wide">[{word.pron}]</span>
                   </div>
                   <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                   <div className="flex flex-col gap-1">
                       <span className={`text-sm font-extrabold ${t.textMain}`}>{word.kor}</span>
                       <span className={`text-[11px] font-medium text-slate-400 truncate`}>{word.eng}</span>
                       <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded self-start mt-1">{word.grammar}</span>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
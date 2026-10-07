import React from 'react';

export default function ModalManager({
  config, closeModal, t, currDay, updateDay, 
  setBibleNotes, globalPrayers, globalIntercessions
}) {
  if (!config.isOpen) return null;

  const { type, data, callback } = config;

  const renderContent = () => {
    // 💡 누락되었던 switch 문 추가
    switch (type) {
      case 'strongsDic': // 원어 성경 사전 팝업
        return (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-black text-indigo-600 flex items-center gap-2">🔍 원어 사전</h2>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <div className={`text-4xl font-black ${t.textMain} mb-2`} dir="ltr">{data?.original_word}</div>
                <div className="text-sm text-slate-500 font-mono font-bold">[{data?.pronunciation || '발음 없음'}]</div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
                <div className={`font-extrabold text-xl ${t.textMain}`}>{data?.meaning}</div>
                <div className={`text-sm ${t.textSub}`}>{data?.gloss}</div>
                <div className="text-xs bg-indigo-50 text-indigo-600 p-2 rounded-lg mt-2 font-bold inline-block self-start">
                  {data?.grammar} (Strong's: {data?.strongs_id})
                </div>
                
                <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-left">
                  <h3 className={`text-sm font-bold ${t.textMain} mb-2`}>📖 상세 해석 및 어원</h3>
                  <p className={`text-sm ${t.textSub} leading-relaxed whitespace-pre-wrap break-words`}>
                    {data?.description || '등록된 어원 정보가 없습니다.'}
                  </p>
                </div>
            </div>
          </div>
        );

      case 'thanks': // 오늘의 감사 기록 팝업
         return (
           <div className="flex flex-col gap-4">
             <h2 className="text-lg font-black text-pink-500">💖 오늘의 감사 기록</h2>
             <textarea 
               className={`w-full h-40 p-4 border rounded-xl outline-none text-sm ${t.inputBg} ${t.textMain} ${t.border} resize-none`} 
               placeholder="오늘 하루 감사했던 일들을 적어보세요 (엔터로 구분)..." 
               defaultValue={(currDay?.thanks || []).join('\n')} 
               onChange={(e) => updateDay({ thanks: e.target.value.split('\n').filter(Boolean) })}
             />
           </div>
         );

      case 'testimony': // 묵상 간증 팝업
         return (
           <div className="flex flex-col gap-4">
             <h2 className="text-lg font-black text-purple-500">📔 나의 묵상 간증</h2>
             <textarea 
               className={`w-full h-40 p-4 border rounded-xl outline-none text-sm ${t.inputBg} ${t.textMain} ${t.border} resize-none`} 
               placeholder="오늘 말씀을 통해 깨달은 바를 자유롭게 기록하세요..." 
               defaultValue={currDay?.testimony || ''} 
               onChange={(e) => updateDay({ testimony: e.target.value })}
             />
           </div>
         );
         
      case 'thanksDeclaration': // 감사 선포 팝업
      case 'applyQuestion': // 적용 질문 팝업
         return (
           <div className="flex flex-col gap-4">
             <h2 className={`text-lg font-black ${t.textMain}`}>기록하기</h2>
             <textarea 
               className={`w-full h-32 p-4 border rounded-xl outline-none text-sm ${t.inputBg} ${t.textMain} ${t.border} resize-none`} 
               placeholder="내용을 기록해주세요 (엔터로 구분)..." 
               onChange={(e) => { 
                 const val = e.target.value.split('\n').filter(Boolean);
                 if(type === 'thanksDeclaration') updateDay({ thanksDeclarations: val });
                 if(type === 'applyQuestion') updateDay({ applyQuestions: val });
               }}
             />
           </div>
         );

      case 'bibleNoteCreate': // 말씀 노트 쓰기 팝업
         return (
           <div className="flex flex-col gap-4 h-full">
             <h2 className="text-lg font-black text-blue-500">📝 말씀 노트 작성</h2>
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 max-h-24 overflow-y-auto">
               {(data?.verses || []).map((v, i) => <div key={i}>{v.ref} - {v.text}</div>)}
             </div>
             <textarea 
               className={`w-full h-32 p-4 border rounded-xl outline-none text-sm ${t.inputBg} ${t.textMain} ${t.border} resize-none flex-1`} 
               placeholder="이 말씀에 대한 묵상을 기록하세요..." 
               id="bibleNoteInput"
             />
             <button 
               className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl font-bold w-full shadow-md transition-colors" 
               onClick={() => {
                 if (callback) callback({ note: document.getElementById('bibleNoteInput').value });
                 closeModal();
               }}
             >
               저장하기
             </button>
           </div>
         );

      default:
        return (
          <div className="flex flex-col gap-2 items-center justify-center p-6 text-center">
            <h2 className={`text-lg font-bold ${t.textMain}`}>준비 중인 기능입니다</h2>
            <p className={`text-sm ${t.textSub}`}>업데이트를 기다려주세요!</p>
          </div>
        );
    } // 💡 switch 문 닫기 추가
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={closeModal}
      ></div>
      <div className={`${t.cardBg} w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up border ${t.border} max-h-[90vh] flex flex-col`}>
         <button 
           onClick={closeModal} 
           className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold ${t.textSub} hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-20`}
         >
           ✕
         </button>
         <div className="mt-2">
            {renderContent()}
         </div>
      </div>
    </div>
  );
}
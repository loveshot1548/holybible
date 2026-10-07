import React from 'react';

export default function SermonDetail({ t, sermon, onBack }) {
  if (!sermon) return null;

  return (
    <div className={`flex flex-col h-full ${t.pageBg} pointer-events-auto`}>
      {/* 상단 헤더 */}
      <div className={`px-5 py-4 ${t.cardBg} border-b ${t.border} shrink-0 flex items-center gap-3 sticky top-0 z-10 shadow-sm`}>
        <button onClick={onBack} className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${t.textMain}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className={`text-base font-bold ${t.textMain} truncate`}>{sermon.title}</h2>
      </div>

      {/* 본문 내용 */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-32 max-w-3xl mx-auto w-full">
        <div className={`p-6 md:p-8 rounded-2xl border ${t.border} ${t.cardBg} shadow-xs space-y-6`}>
          <h1 className={`text-xl md:text-2xl font-bold ${t.textMain} leading-snug`}>
            {sermon.title}
          </h1>
          
          <div className={`text-xs md:text-sm ${t.textMain} leading-[2.2] whitespace-pre-wrap`}>
            {sermon.raw_text}
          </div>

          {sermon.application_questions && sermon.application_questions.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className={`text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider`}>적용 질문</h3>
              <ul className="space-y-2">
                {sermon.application_questions.map((q, i) => (
                  <li key={i} className={`p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl text-xs ${t.textMain} leading-relaxed border border-blue-100 dark:border-blue-900/40`}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
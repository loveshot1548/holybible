import React, { useState } from 'react';

export default function McheyneHeaderSlim({ title, scriptureInfo, children, t }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`w-full border-b ${t.border} ${t.cardBg} transition-all duration-200 sticky top-0 z-10 shadow-xs`}>
      {/* 1줄 한정 슬림 요약 헤더 (모바일 전용) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] shrink-0">
            {title || '읽기표'}
          </span>
          <span className={`text-xs font-bold ${t.textMain} truncate`}>
            {scriptureInfo || '본문 선택'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
          <span>{isOpen ? '접기' : '메뉴/설정'}</span>
          <svg className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7 7-7"/>
          </svg>
        </div>
      </div>

      {/* 펼쳤을 때만 노출되는 옵션/그림판/성경 정보 영역 */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
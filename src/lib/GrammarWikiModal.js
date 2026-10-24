// src/components/GrammarWikiModal.js
import React from 'react';
import { GRAMMAR_ENCYCLOPEDIA } from '../lib/biblicalGrammarWiki';

export default function GrammarWikiModal({ encyclopediaKey, onClose, isDarkMode }) {
  if (!encyclopediaKey) return null;
  const entry = GRAMMAR_ENCYCLOPEDIA[encyclopediaKey] || GRAMMAR_ENCYCLOPEDIA["hebrew_state_absolute"];

  const isDark = isDarkMode;
  const bgCard = isDark ? 'bg-[#0F141F] border-[#2A364D] text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div 
      className="fixed inset-0 z-[9999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border p-5 sm:p-7 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden ${bgCard}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-start border-b border-slate-700/50 pb-4 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-600 text-white">
                {entry.lang} · {entry.category}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
              {entry.token} <span className="text-sm font-mono opacity-60 font-semibold">({entry.originalTerm})</span>
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar text-xs sm:text-[13px] leading-relaxed">
          {/* 핵심 요약 콜아웃 */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}>
            <span className="font-black text-[11px] block uppercase tracking-wider text-indigo-400 mb-1">💡 통사론적 핵심 규정</span>
            <p className="font-bold leading-normal">{entry.summary}</p>
          </div>

          {/* 1. 언어학 및 형태론 메커니즘 */}
          <div className="space-y-1">
            <h3 className="font-black text-[13px] text-emerald-400 flex items-center gap-1.5">
              <span>⚙️</span> 형태론 및 음운 변화 원리 (Morphological Mechanics)
            </h3>
            <p className={`${textSub} whitespace-pre-wrap`}>{entry.mechanics}</p>
          </div>

          {/* 2. 구속사적·교리적 해석학 (핵심 레이어) */}
          <div className={`p-4 rounded-2xl border space-y-1.5 ${
            isDark ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/80 border-purple-200'
          }`}>
            <h3 className="font-black text-[13.5px] text-purple-400 flex items-center gap-1.5">
              <span>📖</span> 성경 66권 구속사적·교리적 해석학 (Theological Exegesis)
            </h3>
            <p className={`whitespace-pre-wrap font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {entry.theology}
            </p>
          </div>

          {/* 3. 성경 66권 정경 대표 용례 */}
          <div className="space-y-2 pt-2 border-t border-slate-700/40">
            <h3 className="font-black text-[13px] text-amber-400 flex items-center gap-1.5">
              <span>📜</span> 정경 대표 용례 및 주해 대조 (Canonical Case Studies)
            </h3>
            <div className="space-y-2">
              {entry.canonicalCases.map((c, i) => (
                <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-indigo-400 font-mono text-[12px]">{c.ref}</span>
                    <span className="font-bold text-white text-[13px]">{c.text}</span>
                  </div>
                  <p className={`text-[11.5px] ${textSub}`}>{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="pt-3 mt-3 border-t border-slate-700/40 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md cursor-pointer"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
}
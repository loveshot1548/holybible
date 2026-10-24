// src/components/common/VerseInspectorModal.js
import React, { useState, useEffect } from 'react';
import { getVerseInterlinearData } from '../../services/originalBibleService';
import { supabase } from '../../lib/supabase';

const otBooks = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", 
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"
];

const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;

export default function VerseInspectorModal({ isOpen, onClose, targetVerse, isDarkMode = false }) {
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [concordance, setConcordance] = useState([]);

  const isOT = otBooks.includes(targetVerse?.bookEng || targetVerse?.book || '');

  useEffect(() => {
    if (!isOpen || !targetVerse) return;
    let isMounted = true;
    setIsLoading(true);
    setSelectedWord(null);
    setConcordance([]);

    getVerseInterlinearData(targetVerse.bookKo || targetVerse.book, targetVerse.chapter, targetVerse.verse, isOT)
      .then(res => {
        if (isMounted) {
          setWords(res);
          if (res.length > 0) setSelectedWord(res[0]);
        }
      })
      .finally(() => { if (isMounted) setIsLoading(false); });

    return () => { isMounted = false; };
  }, [isOpen, targetVerse, isOT]);

  // 단어 선택 시 성구 용례(Concordance) 조회
  useEffect(() => {
    if (!selectedWord || !supabase || !selectedWord.strongs || selectedWord.strongs.endsWith('0000')) return;
    let isMounted = true;
    supabase
      .from('interlinear_bible')
      .select('book, chapter, verse, original_word, korean_trans')
      .eq('strongs_id', selectedWord.strongs)
      .limit(4)
      .then(({ data }) => {
        if (isMounted && data) setConcordance(data);
      });
    return () => { isMounted = false; };
  }, [selectedWord]);

  // 음성 재생 (TTS)
  const speakWord = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = isOT ? text.replace(/[\u0591-\u05AF]/g, '') : text;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = isOT ? 'he-IL' : 'el-GR';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen || !targetVerse) return null;

  const enVerseText = words.map(w => w.eng).filter(e => e && e !== 'n/a').join(' ');

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in font-sans">
      <div className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden ${
        isDarkMode ? 'bg-[#14151B] border-[#262835] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* 헤더 바 */}
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] sm:text-[16px]">
              {targetVerse.bookKo || targetVerse.book} {targetVerse.chapter}장 {targetVerse.verse}절 심층 원어 연구
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10">
              {isOT ? '히브리어(구약)' : '헬라어(신약)'}
            </span>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer">
            닫기 ✕
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="overflow-y-auto hide-scrollbar space-y-4 py-3.5 flex-1">
          
          {/* 3단 대조 카드 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/5 space-y-2.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">한글 성경</span>
              <p className="text-[14px] sm:text-[15px] font-medium leading-relaxed">{targetVerse.text || targetVerse.koText}</p>
            </div>
            {enVerseText && (
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">영어 직역 대조</span>
                <p className="text-[12.5px] italic text-slate-500 dark:text-slate-400">"{enVerseText}"</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">원어 성경 본문</span>
              <div className={`flex flex-wrap gap-1.5 items-baseline ${isOT ? 'justify-end' : 'justify-start'}`} dir={isOT ? 'rtl' : 'ltr'}>
                {words.map(w => (
                  <span
                    key={w.id}
                    onClick={() => setSelectedWord(w)}
                    style={{ fontFamily: isOT ? "'SBL Hebrew', 'Ezra SIL', serif" : "'Times New Roman', serif" }}
                    className={`text-[21px] sm:text-[23px] font-serif px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      selectedWord?.order === w.order 
                        ? (isDarkMode ? 'bg-indigo-950 text-indigo-300 ring-1 ring-indigo-500' : 'bg-slate-900 text-white')
                        : 'hover:bg-slate-200/60 dark:hover:bg-white/10'
                    }`}
                  >
                    {w.original}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 단어별 수평 스크롤 카드 레일 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-0.5 block">단어 분해 선택</span>
            <div className={`flex gap-2 overflow-x-auto hide-scrollbar pb-1`} dir={isOT ? 'rtl' : 'ltr'}>
              {words.map(w => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWord(w)}
                  className={`min-w-[125px] sm:min-w-[140px] p-2.5 rounded-xl border flex flex-col justify-between shrink-0 cursor-pointer transition-all ${
                    selectedWord?.order === w.order
                      ? (isDarkMode ? 'bg-[#1E202B] border-indigo-400 shadow-sm' : 'bg-slate-50 border-slate-900 shadow-xs')
                      : (isDarkMode ? 'bg-[#181920] border-[#262835]' : 'bg-white border-slate-200')
                  }`}
                >
                  <div className="text-center">
                    <span 
                      style={{ fontFamily: isOT ? "'SBL Hebrew', serif" : "'Times New Roman', serif" }}
                      className="text-[18px] font-serif font-bold block"
                      dir={isOT ? 'rtl' : 'ltr'}
                    >
                      {w.original}
                    </span>
                    <span className="text-[9.5px] font-mono opacity-60 block min-h-[13px]">{w.pron}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-white/10 my-1.5 pt-1.5 text-left" dir="ltr">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold truncate max-w-[85px]">{w.kor}</span>
                      <span className="text-[9px] font-mono text-slate-400">{w.strongs}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block lowercase">{w.eng}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택 단어의 심층 정보 박스 */}
          {selectedWord && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-serif font-bold">{selectedWord.original}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10">{selectedWord.strongs}</span>
                  <span className="font-bold">{selectedWord.pron} {selectedWord.kor}</span>
                </div>
                <button
                  onClick={() => speakWord(selectedWord.original)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <IconVolume /> 발음 듣기
                </button>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-0.5">정밀 문법 (품사)</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedWord.morphLabel}</span>
              </div>

              {selectedWord.explanation && (
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">어원 및 신학 사전 (Strong's Lexicon)</span>
                  <p className="whitespace-pre-wrap leading-relaxed opacity-90">{selectedWord.explanation}</p>
                </div>
              )}

              {concordance.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-500 font-bold block mb-1">🔗 성경 속 동일 원어 용례 (Concordance)</span>
                  <div className="space-y-1">
                    {concordance.map((c, i) => (
                      <div key={i} className="flex justify-between text-[11px] py-0.5">
                        <span className="font-bold">{c.book} {c.chapter}:{c.verse}</span>
                        <span className="font-serif">{c.original_word}</span>
                        <span className="text-slate-400 truncate max-w-[160px]">{c.korean_trans}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
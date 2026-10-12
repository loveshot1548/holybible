// src/components/SermonDetail.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// =====================================================================
// 전역 성경 약어 사전 및 캐논 66권 매핑
// =====================================================================
const BIBLE_ABBREV_MAP = {
  "창세기": "창세기", "창": "창세기", "출애굽기": "출애굽기", "출": "출애굽기", "레위기": "레위기", "레": "레위기", 
  "민수기": "민수기", "민": "민수기", "신명기": "신명기", "신": "신명기", "여호수아": "여호수아", "수": "여호수아", 
  "사사기": "사사기", "삿": "사사기", "룻기": "룻기", "룻": "룻기", "사무엘상": "사무엘상", "삼상": "사무엘상", 
  "사무엘하": "사무엘하", "삼하": "사무엘하", "열왕기상": "열왕기상", "왕상": "열왕기상", "열왕기하": "열왕기하", "왕하": "열왕기하", 
  "역대상": "역대상", "대상": "역대상", "역대하": "역대하", "대하": "역대하", "에스라": "에스라", "스": "에스라", 
  "느헤미야": "느헤미야", "느": "느헤미야", "에스더": "에스더", "에": "에스더", "욥기": "욥기", "욥": "욥기", 
  "시편": "시편", "시": "시편", "잠언": "잠언", "잠": "잠언", "전도서": "전도서", "전": "전도서", "아가": "아가", "아": "아가", 
  "이사야": "이사야", "사": "이사야", "예레미야": "예레미야", "렘": "예레미야", "예레미야애가": "예레미야애가", "애": "예레미야애가", 
  "에스겔": "에스겔", "겔": "에스겔", "다니엘": "다니엘", "단": "다니엘", "호세아": "호세아", "호": "호세아", 
  "요엘": "요엘", "욜": "요엘", "아모스": "아모스", "암": "아모스", "오바댜": "오바댜", "옵": "오바댜", "요나": "요나", "욘": "요나", 
  "미가": "미가", "미": "미가", "나훔": "나훔", "나": "나훔", "하박국": "하박국", "합": "하박국", "스바냐": "스바냐", "습": "스바냐", 
  "학개": "학개", "학": "학개", "스가랴": "스가랴", "슥": "스가랴", "말라기": "말라기", "말": "말라기", 
  "마태복음": "마태복음", "마": "마태복음", "마가복음": "마가복음", "막": "마가복음", "누가복음": "누가복음", "눅": "누가복음", 
  "요한복음": "요한복음", "요": "요한복음", "사도행전": "사도행전", "행": "사도행전", "로마서": "로마서", "롬": "로마서", 
  "고린도전서": "고린도전서", "고전": "고린도전서", "고린도후서": "고린도후서", "고후": "고린도후서", "갈라디아서": "갈라디아서", "갈": "갈라디아서", 
  "에베소서": "에베소서", "엡": "에베소서", "빌립보서": "빌립보서", "빌": "빌립보서", "골로새서": "골로새서", "골": "골로새서", 
  "데살로니가전서": "데살로니가전서", "살전": "데살로니가전서", "데살로니가후서": "데살로니가후서", "살후": "데살로니가후서", 
  "디모데전서": "디모데전서", "딤전": "디모데전서", "디모데후서": "디모데후서", "딤후": "디모데후서", "디도서": "디도서", "딛": "디도서", 
  "빌레몬서": "빌레몬서", "몬": "빌레몬서", "히브리서": "히브리서", "히": "히브리서", "야고보서": "야고보서", "약": "야고보서", 
  "베드로전서": "베드로전서", "벧전": "베드로전서", "베드로후서": "베드로후서", "벧후": "베드로후서", "요한일서": "요한일서", "요일": "요한일서", 
  "요한이서": "요한이서", "요이": "요한이서", "요한삼서": "요한삼서", "요삼": "요한삼서", "유다서": "유다서", "유": "유다서", "요한계시록": "요한계시록", "계": "요한계시록"
};

const BIBLE_BOOKS_ORDER = Array.from(new Set(Object.values(BIBLE_ABBREV_MAP)));
const BIBLE_KEYS = Object.keys(BIBLE_ABBREV_MAP).sort((a, b) => b.length - a.length).join('|');
const BIBLE_VERSE_SINGLE_REGEX = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`);

const isOTBook = (bookName) => {
  const clean = BIBLE_ABBREV_MAP[bookName] || bookName;
  const idx = BIBLE_BOOKS_ORDER.indexOf(clean);
  return idx >= 0 && idx <= 38;
};

function parseBibleReference(text) {
  if (!text) return null;
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)(?:\\s*장|\\s*편|\\s*:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`);
  const match = text.match(regex);
  if (!match) return null;
  const rawBook = match[1].trim();
  const book = BIBLE_ABBREV_MAP[rawBook] || rawBook;
  const chapter = parseInt(match[2], 10) || 1;
  const startVerse = match[3] ? parseInt(match[3], 10) : 1;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
  return { book, chapter, startVerse, endVerse, raw: match[0].trim() };
}

function extractVerses(text) {
  if (!text) return [];
  const matches = [];
  let match;
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`, 'g');
  while ((match = regex.exec(text)) !== null) {
    const book = match[1].trim();
    if (BIBLE_ABBREV_MAP[book]) matches.push(match[0].trim().replace(/\s+/g, ' '));
  }
  return [...new Set(matches)];
}

function extractTheologicalTags(text) {
  if (!text) return [];
  const tags = new Set();
  if (text.includes('구원') || text.includes('십자가') || text.includes('보혈') || text.includes('칭의')) tags.add('구원론');
  if (text.includes('주권') || text.includes('섭리') || text.includes('창조')) tags.add('신론');
  if (text.includes('말씀') || text.includes('성경') || text.includes('묵상')) tags.add('말씀론');
  if (text.includes('예수') || text.includes('성육신') || text.includes('부활')) tags.add('기독론');
  if (text.includes('고난') || text.includes('상처') || text.includes('연단')) tags.add('고난의신비');
  if (text.includes('성령') || text.includes('은사') || text.includes('열매')) tags.add('성령론');
  if (text.includes('공동체') || text.includes('목장') || text.includes('지체') || text.includes('예배')) tags.add('교회론');
  if (text.includes('죄') || text.includes('회개') || text.includes('타락') || text.includes('탐심')) tags.add('인간론/회개');
  if (text.includes('가정') || text.includes('부부') || text.includes('자녀')) tags.add('언약가정');
  if (text.includes('기도') || text.includes('간구') || text.includes('주기도문')) tags.add('기도론');
  if (text.includes('직장') || text.includes('재물') || text.includes('헌금') || text.includes('일터')) tags.add('청지기론');
  if (text.includes('전도') || text.includes('영혼') || text.includes('선교') || text.includes('파송')) tags.add('선교/제자도');
  return Array.from(tags);
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// =====================================================================
// 🎨 모던 시스템 아이콘
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconCopy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// =====================================================================
// 🔬 원어 성경 인라인 연동 팝업 모달
// =====================================================================
const InterlinearQuickModal = ({ target, onClose, getBibleText, isDark, onJumpStudio }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const isOT = isOTBook(target.book);
  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const speakWord = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/[\u0591-\u05AF]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = isOT ? 'he-IL' : 'el-GR';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg("");

    const fetchWords = async () => {
      try {
        if (!supabase) throw new Error("Supabase 연결 객체를 찾을 수 없습니다.");
        const { data, error } = await supabase
          .from('interlinear_bible')
          .select('*')
          .eq('book', target.book)
          .eq('chapter', target.chapter)
          .eq('verse', target.verse)
          .order('word_order', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(`${target.book} ${target.chapter}:${target.verse} 원어 분해 데이터가 아직 등록되지 않았습니다.`);
        }

        if (isMounted) {
          setWords(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || "원어 데이터를 불러오지 못했습니다.");
          setLoading(false);
        }
      }
    };

    fetchWords();
    return () => { isMounted = false; };
  }, [target]);

  const verseKorean = getBibleText ? getBibleText(`${target.book} ${target.chapter}:${target.verse}`) : `${target.book} ${target.chapter}장 ${target.verse}절`;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
        isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="px-4 py-3 border-b flex justify-between items-center shrink-0 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {isOT ? '구약 히브리어 (BHS)' : '신약 헬라어 (GNT)'}
            </span>
            <h3 className="font-bold text-[14.5px]">
              {target.book} {target.chapter}장 {target.verse}절 원어 형태론 전수 분해
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <IconX />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto hide-scrollbar space-y-3.5 text-left flex-1">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold text-slate-400 block mb-1 font-mono uppercase">[개역개정 본문]</span>
            <p className="text-[13px] sm:text-[14px] leading-[1.8] font-medium break-keep">
              {verseKorean}
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-[13px]">
              ⏳ 히브리어/헬라어 원어 형태소 파싱 중...
            </div>
          ) : errorMsg ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-[12.5px] text-rose-500 font-medium">{errorMsg}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-1">
                <span>1:1 원어 형태소 분해 ({words.length}개 어절)</span>
                <span className="font-mono">단어 터치 시 발음 재생</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" dir={isOT ? 'rtl' : 'ltr'}>
                {words.map((w, wIdx) => (
                  <div
                    key={w.id || wIdx}
                    onClick={() => speakWord(w.original_word)}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <div className={isOT ? 'text-right' : 'text-left'}>
                      <div className="flex items-center justify-between gap-1">
                        <span style={originalFontStyle} className="text-[19px] font-bold leading-tight block">
                          {w.original_word}
                        </span>
                        <span className="text-slate-400 p-0.5"><IconVolume /></span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5" dir="ltr">
                        {w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : ''}
                      </span>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1.5"></div>

                    <div className="text-left" dir="ltr">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-[12px] text-amber-700 dark:text-amber-300 truncate block">
                          {w.korean_trans || w.gloss || '원어 어휘'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {w.strongs_id}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {w.grammar}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t shrink-0 flex items-center justify-between gap-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const prevV = Math.max(1, target.verse - 1);
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, prevV), 50);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            >
              ◀ 이전 절
            </button>
            <button
              type="button"
              onClick={() => {
                const nextV = target.verse + 1;
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, nextV), 50);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            >
              다음 절 ▶
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-[11.5px] font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// 📖 성경 구절 인라인 팝업 모달
// =====================================================================
const BibleVerseModal = ({ verseQuery, verseText, onClose, onOpenInterlinear, isDark }) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[1150] flex items-center justify-center p-3 select-none">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col max-h-[75vh] overflow-hidden ${
        isDark ? 'bg-[#111827] border-[#1f2937] text-gray-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-[14.5px] text-left">📖 {verseQuery}</h3>
          <div className="flex items-center gap-1.5">
            {onOpenInterlinear && (
              <button
                type="button"
                onClick={() => {
                  const parsed = parseBibleReference(verseQuery);
                  if (parsed) onOpenInterlinear(parsed.book, parsed.chapter, parsed.startVerse);
                  onClose();
                }}
                className="px-2 py-0.5 rounded text-[10.5px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60 flex items-center gap-1 cursor-pointer"
              >
                <span>🔬</span> 원어 연동 ➔
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <IconX />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto hide-scrollbar text-left">
          <p className="text-[13.5px] leading-[2.1] whitespace-pre-wrap text-slate-800 dark:text-gray-200">
            {verseText || "해당 구절을 성경 데이터에서 불러오는 중입니다..."}
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// 🏛️ 메인 컴포넌트: SermonDetail (설교 심층 강해 분석 스튜디오)
// =====================================================================
export default function SermonDetail({ 
  t = {}, 
  sermon, 
  onBack, 
  bibles, 
  dailyData = {}, 
  updateDay, 
  setActiveScreen 
}) {
  if (!sermon) return null;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || false;

  // 4대 뷰 모드 ('full': 전체 전문, 'outline': 대지별 구조, 'questions': 적용 질문, 'scriptures': 인용 성경/원어 색인)
  const [activeTab, setActiveTab] = useState('full');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 팝업 상태
  const [popupVerseQuery, setPopupVerseQuery] = useState(null);
  const [interlinearTarget, setInterlinearTarget] = useState(null); // { book, chapter, verse }
  
  // 실천 메모 상태
  const [actionMemos, setActionMemos] = useState(() => {
    try {
      const saved = localStorage.getItem(`sermon_memos_${sermon.date || sermon.title}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // 성경 본문 텍스트 로더
  const getBibleText = useCallback((verseQuery) => {
    if (!bibles || !verseQuery) return "";
    const parsed = parseBibleReference(verseQuery);
    if (!parsed) return "";
    const { book, chapter, startVerse, endVerse } = parsed;
    const list = Array.isArray(bibles) ? bibles : [];
    const targetBook = list.find(b => b?.name === book || b?.name === BIBLE_ABBREV_MAP[book]) || list[BIBLE_BOOKS_ORDER.indexOf(book)];
    if (!targetBook || !targetBook.chapters) return "";
    const chapterData = targetBook.chapters[chapter - 1];
    if (!chapterData) return "";
    let res = [];
    for (let v = startVerse; v <= endVerse; v++) {
      const vData = chapterData[v - 1];
      if (vData) {
        const raw = typeof vData === 'string' ? vData : (vData.text || vData.content || '');
        res.push(`${v}. ${decodeHtmlEntities(raw)}`);
      }
    }
    return res.join('\n\n');
  }, [bibles]);

  // 원문 100% 무결점 보존 및 메타 데이터 정밀 정규화
  const cleanRawText = useMemo(() => {
    return decodeHtmlEntities(sermon.raw_text || '')?.replace(/#말씀묵상/g, '').trim();
  }, [sermon.raw_text]);

  const activeReference = useMemo(() => {
    const combined = `${sermon.title || ''} ${sermon.mappedVerse || ''} ${cleanRawText.slice(0, 300)}`;
    const parsed = parseBibleReference(combined);
    if (parsed) return parsed;
    const book = sermon.detectedBook && sermon.detectedBook !== '기타 말씀' ? sermon.detectedBook : '갈라디아서';
    return { book, chapter: 1, startVerse: 1, endVerse: 1, raw: `${book} 1장` };
  }, [sermon, cleanRawText]);

  // 설교 내 인용된 성경 구절 전체 추출
  const allCitedVerses = useMemo(() => {
    return extractVerses(cleanRawText);
  }, [cleanRawText]);

  // 감지된 신학적 구속사 테마
  const theologicalTags = useMemo(() => {
    const tags = extractTheologicalTags(cleanRawText);
    return tags.length > 0 ? tags : (sermon.tags || ['말씀묵상']).filter(t => t !== '말씀묵상');
  }, [cleanRawText, sermon.tags]);

  // 💡 [핵심] 원문 텍스트를 한 글자도 누락 없이 대지별 구조(Outlines)로 청킹
  const parsedSections = useMemo(() => {
    const lines = cleanRawText.split('\n');
    const sections = [];
    let currentSection = {
      id: 0,
      title: "들어가며 (서론)",
      lines: [],
      questions: []
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // 대지 소제목 감지 (예: 1. 첫째, 2. 둘째, I. II. 결론 등)
      const isHeader = (
        trimmed.match(/^(\d+\.\s*|첫째|둘째|셋째|넷째|들어가며|결론|결어)/) ||
        (trimmed.endsWith(':') && trimmed.length < 35 && !trimmed.includes('http'))
      );

      if (isHeader && trimmed.length < 50) {
        if (currentSection.lines.length > 0 || currentSection.id > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          id: sections.length + 1,
          title: trimmed,
          lines: [],
          questions: []
        };
      } else {
        currentSection.lines.push(line);
        if (trimmed.match(/^(적용:|적용 질문|Q\.|질문:|적용 포인트)/) || (trimmed.endsWith('?') && trimmed.length < 90 && !trimmed.match(/^\d+/))) {
          currentSection.questions.push(trimmed.replace(/^(적용:|적용 질문:|Q\.|질문:|적용 포인트)\s*/, ''));
        }
      }
    });

    if (currentSection.lines.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }, [cleanRawText]);

  // 통합 적용 질문 (텍스트 내 질문 + sermon.application_questions)
  const combinedQuestions = useMemo(() => {
    const fromText = [];
    parsedSections.forEach(s => s.questions.forEach(q => fromText.push(q)));
    const fromProp = sermon.application_questions || [];
    return Array.from(new Set([...fromProp, ...fromText])).filter(q => q && q.trim().length > 0);
  }, [parsedSections, sermon.application_questions]);

  // 적용 메모 저장
  const handleSaveMemo = (qIdx, text) => {
    const newMemos = { ...actionMemos, [qIdx]: text };
    setActionMemos(newMemos);
    try {
      localStorage.setItem(`sermon_memos_${sermon.date || sermon.title}`, JSON.stringify(newMemos));
    } catch {}
  };

  // 실천 목표로 전송 (ApplyTracker 연동)
  const handleExportToApplyTracker = (qText) => {
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const newItem = {
        id: Date.now(),
        date: sermon.date || new Date().toISOString().split('T')[0],
        text: `[설교결단: ${sermon.title}] ${qText}`,
        category: '개인 영성',
        source: 'sermon',
        completed: false
      };
      localStorage.setItem('apply_tracker_items', JSON.stringify([newItem, ...saved]));
      window.dispatchEvent(new Event('storage'));
      showToast('삶의 실천 트래커에 결단이 등록되었습니다!');
    } catch {
      showToast('등록에 실패했습니다.');
    }
  };

  // 목장 나눔 텍스트 복사
  const handleCopyCellShare = () => {
    const questionsText = combinedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const shareStr = `[주일 설교 말씀 나눔]
• 제목: ${sermon.title}
• 본문: ${activeReference.raw}
• 설교자: ${sermon.preacher || '담임목사'}

[은혜의 적용 질문]
${questionsText || '설교 본문을 통해 주신 마음을 함께 나눕니다.'}

오직 은혜로 승리하는 한 주간 되길 기도합니다.`;

    navigator.clipboard.writeText(shareStr);
    showToast('목장 나눔 텍스트가 클립보드에 복사되었습니다!');
  };

  return (
    <div className={`flex flex-col h-full pointer-events-auto select-none ${isDark ? 'bg-[#0B0F19] text-gray-100' : 'bg-[#F8FAFC] text-slate-900'} w-full overflow-hidden text-left`}>
      
      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-full bg-slate-900/95 text-white text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          {toastMsg}
        </div>
      )}

      {/* 1. 상단 글로벌 헤더 & 뒤로가기 */}
      <header className={`px-4 sm:px-6 py-3 border-b shrink-0 flex items-center justify-between z-20 backdrop-blur-md ${
        isDark ? 'border-slate-800 bg-[#111827]/90' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-3 truncate">
          <button 
            onClick={onBack} 
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="목록으로 복귀"
          >
            <IconArrowLeft />
          </button>
          <div className="flex flex-col truncate">
            <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
              {sermon.date || '강해 설교'} · {activeReference.raw}
            </span>
            <h2 className="text-[15px] sm:text-[16px] font-bold truncate leading-tight">
              {sermon.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setInterlinearTarget({ book: activeReference.book, chapter: activeReference.chapter, verse: activeReference.startVerse })}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold border bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="본문 원어 성경 분해 열기"
          >
            <span>🔬</span> 원어 연동
          </button>
          <button
            onClick={handleCopyCellShare}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="목장 나눔 복사"
          >
            <IconShare />
          </button>
        </div>
      </header>

      {/* 2. 4대 뷰 모드 탭 바 */}
      <nav className={`px-3 sm:px-6 py-1.5 border-b shrink-0 flex items-center gap-1 overflow-x-auto hide-scrollbar z-10 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100/70'
      }`}>
        {[
          { id: 'full', label: '📖 전체 강해 전문', count: null },
          { id: 'outline', label: '📑 대지별 구조 분석', count: parsedSections.length },
          { id: 'questions', label: '🎯 적용 질문 & 실천', count: combinedQuestions.length },
          { id: 'scriptures', label: '🔬 인용 성경 & 원어 색인', count: allCitedVerses.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              activeTab === tab.id
                ? (isDark ? 'bg-blue-600 text-white border-blue-500 shadow-xs' : 'bg-slate-900 text-white border-slate-800 shadow-xs')
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 3. 메인 콘텐츠 뷰포트 */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 pb-36 max-w-4xl mx-auto w-full hide-scrollbar space-y-4">

        {/* 상단 통합 메타 정보 카드 */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 ${
          isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {sermon.date || '2026 주일예배'}
              </span>
              <span className="text-[12px] font-bold text-slate-500">
                설교자: {sermon.preacher || '담임목사'}
              </span>
            </div>
            <button
              onClick={() => {
                setPopupVerseQuery(activeReference.raw);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <IconBook /> 성경 본문 열기
            </button>
          </div>

          <h1 className="text-[18px] sm:text-[22px] font-black leading-snug break-keep text-slate-900 dark:text-white">
            {sermon.title}
          </h1>

          {/* 구속사 신학 테마 태그 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {theologicalTags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                #{tag}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800">
              대지 {parsedSections.length}개 분석
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 뷰 1: [전체 전문] 원문 100% 무결점 보존 + 라인별 인라인 구조화              */}
        {/* ========================================================================= */}
        {activeTab === 'full' && (
          <div className={`p-5 sm:p-7 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">설교 강해 전문 (원문 100% 완전 출력)</span>
              <span className="text-[11px] font-mono text-slate-400">{cleanRawText.length}자</span>
            </div>

            <div className="space-y-2">
              {cleanRawText.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                // 1. 대지 소제목 라인
                if (trimmed.match(/^(\d+\.\s*|첫째|둘째|셋째|넷째|들어가며|결론)/) || (trimmed.endsWith(':') && trimmed.length < 35)) {
                  return (
                    <h3 key={idx} className="mt-5 mb-2 text-[15px] sm:text-[16.5px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      {trimmed}
                    </h3>
                  );
                }

                // 2. 적용 질문 라인
                if (trimmed.match(/^(적용:|적용 질문|Q\.|질문:|적용 포인트)/) || (trimmed.endsWith('?') && trimmed.length < 90 && !trimmed.match(/^\d+/))) {
                  return (
                    <div key={idx} className={`my-3 p-3 rounded-xl border-l-4 border-l-rose-500 ${
                      isDark ? 'bg-rose-950/20 border-white/5' : 'bg-rose-50/70 border-rose-100'
                    }`}>
                      <span className="text-[9.5px] font-mono tracking-widest text-rose-500 font-bold block mb-0.5 uppercase">APPLICATION QUESTION</span>
                      <p className="text-[13px] sm:text-[14px] font-bold leading-relaxed break-keep text-rose-950 dark:text-rose-200">
                        {trimmed.replace(/^(적용:|적용 질문:|Q\.|질문:|적용 포인트)\s*/, '')}
                      </p>
                    </div>
                  );
                }

                // 3. 성경 절 라인 (예: "1내가 너희에게...", "2. 그러므로...")
                const versePrefix = trimmed.match(/^(\d{1,3})(?:[\.\s]|(?=[가-힣]))(.*)/);
                if (versePrefix && !trimmed.includes('~') && !trimmed.includes(':') && versePrefix[2].length > 10) {
                  const vNum = parseInt(versePrefix[1], 10);
                  const vContent = versePrefix[2].trim();

                  return (
                    <div key={idx} className={`my-2 p-2.5 rounded-xl border flex items-start justify-between gap-2.5 ${
                      isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start gap-2 flex-1">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                          {vNum}절
                        </span>
                        <p className="text-[13.5px] font-medium leading-[1.8] break-keep">
                          {vContent}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInterlinearTarget({ book: activeReference.book, chapter: activeReference.chapter, verse: vNum })}
                        className="px-2 py-0.8 rounded text-[10.5px] font-bold border bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="원어 분해 팝업"
                      >
                        <span>📖</span> 원어
                      </button>
                    </div>
                  );
                }

                // 4. 독립된 인용 성경 라인 (예: "갈라디아서 3:1-14")
                const verseMatch = trimmed.match(BIBLE_VERSE_SINGLE_REGEX);
                if (verseMatch && trimmed.length < 60) {
                  return (
                    <div key={idx} className="my-1.5 flex items-center gap-1.5">
                      <button
                        onClick={() => setPopupVerseQuery(verseMatch[0].trim())}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold border transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-700"
                      >
                        <IconBook /> {trimmed}
                      </button>
                    </div>
                  );
                }

                // 5. 일반 강해 본문 텍스트
                return (
                  <p key={idx} className="text-[13.5px] sm:text-[14px] leading-[2.1] font-normal break-keep text-slate-800 dark:text-slate-200">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 뷰 2: [대지별 구조 분석] 서론 ➔ 1대지 ➔ 2대지 ➔ 결론 분리 청킹               */}
        {/* ========================================================================= */}
        {activeTab === 'outline' && (
          <div className="space-y-3.5">
            {parsedSections.map((sec, idx) => (
              <div key={sec.id} className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
              }`}>
                <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
                  <h3 className="text-[14.5px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {sec.title}
                  </h3>
                  <span className="text-[10.5px] font-mono text-slate-400">{sec.lines.length}행</span>
                </div>

                <div className="text-[13px] leading-[2.0] space-y-1.5 text-slate-700 dark:text-slate-300">
                  {sec.lines.map((l, lIdx) => (
                    <p key={lIdx} className="break-keep">{l}</p>
                  ))}
                </div>

                {sec.questions.length > 0 && (
                  <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-rose-500 uppercase tracking-wider block">
                      이 대지의 적용 질문
                    </span>
                    {sec.questions.map((q, qIdx) => (
                      <div key={qIdx} className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-bold text-rose-900 dark:text-rose-200">
                        {q}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 뷰 3: [적용 질문 & 실천] 질문별 결단 작성 & 트래커 이관                     */}
        {/* ========================================================================= */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
              isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
            }`}>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 dark:text-white">설교 적용 및 순종 실천 체크리스트</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">말씀을 듣는 데 그치지 않고, 오늘 삶의 현장에서 실천할 결단을 기록하세요.</p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                {combinedQuestions.length}개 과제
              </span>
            </div>

            {combinedQuestions.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border text-xs text-slate-400 ${
                isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                본문에서 감지된 질문이 없습니다. 강해 전문을 묵상하며 성령께서 주시는 질문을 마음에 새기세요.
              </div>
            ) : (
              combinedQuestions.map((qText, qIdx) => (
                <div key={qIdx} className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500 text-white text-[11px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="text-[13.5px] font-bold leading-relaxed break-keep text-slate-900 dark:text-white flex-1">
                      {qText}
                    </p>
                  </div>

                  {/* 결단 메모 입력창 */}
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      rows={2}
                      defaultValue={actionMemos[qIdx] || ""}
                      onBlur={(e) => handleSaveMemo(qIdx, e.target.value)}
                      placeholder="이 질문 앞에서 내가 오늘 순종할 구체적 행동 1가지를 적으세요..."
                      className={`w-full p-2.5 text-[12px] leading-relaxed rounded-xl border outline-none resize-none ${
                        isDark ? 'bg-black/30 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />

                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExportToApplyTracker(qText)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 transition-all"
                      >
                        ⚡ 삶의 실천 트래커로 이관
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 뷰 4: [인용 성경 & 원어 색인] 구절 클라우드 & 1:1 형태론 전수 연결          */}
        {/* ========================================================================= */}
        {activeTab === 'scriptures' && (
          <div className="space-y-3.5">
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
              isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
            }`}>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 dark:text-white">설교 인용 성경 및 원어 레퍼런스 색인</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">강단에서 선포된 모든 참조 성경 구절을 검토하고 원어(히브리어/헬라어)를 연구합니다.</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                {allCitedVerses.length}구절 인용
              </span>
            </div>

            {allCitedVerses.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border text-xs text-slate-400 ${
                isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                본문 외 별도 인용된 성경 구절이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allCitedVerses.map((verseStr, idx) => {
                  const parsed = parseBibleReference(verseStr);
                  return (
                    <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
                    }`}>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sky-500 font-bold text-xs">📖</span>
                        <span className="text-[12.5px] font-bold text-slate-800 dark:text-gray-200 truncate">
                          {verseStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPopupVerseQuery(verseStr)}
                          className="px-2 py-1 rounded text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-gray-300 cursor-pointer"
                        >
                          본문
                        </button>
                        {parsed && (
                          <button
                            type="button"
                            onClick={() => setInterlinearTarget({ book: parsed.book, chapter: parsed.chapter, verse: parsed.startVerse })}
                            className="px-2 py-1 rounded text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          >
                            원어
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* 4. 성경 구절 본문 팝업 모달 */}
      {popupVerseQuery && (
        <BibleVerseModal
          verseQuery={popupVerseQuery}
          verseText={getBibleText(popupVerseQuery)}
          onClose={() => setPopupVerseQuery(null)}
          onOpenInterlinear={(b, c, v) => setInterlinearTarget({ book: b, chapter: c, verse: v })}
          isDark={isDark}
        />
      )}

      {/* 5. 원어 성경 형태론 분해 팝업 모달 */}
      {interlinearTarget && (
        <InterlinearQuickModal
          target={interlinearTarget}
          onClose={() => setInterlinearTarget(null)}
          getBibleText={getBibleText}
          isDark={isDark}
          onJumpStudio={(b, c, v) => setInterlinearTarget({ book: b, chapter: c, verse: v })}
        />
      )}

    </div>
  );
}
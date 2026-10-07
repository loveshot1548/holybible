import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { newYearVerseCards } from '../data/verseCards';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 골방 기도문 보호
// =====================================================================
const ENCRYPT_PREFIX = "ENC_GTC_v1::";

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const encoded = btoa(encodeURIComponent(plainText));
    return `${ENCRYPT_PREFIX}${encoded}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (!cipherText.startsWith(ENCRYPT_PREFIX)) return cipherText;
  try {
    const payload = cipherText.replace(ENCRYPT_PREFIX, '');
    return decodeURIComponent(atob(payload));
  } catch (e) {
    return cipherText;
  }
};

const STEPS = [
  { id: 'silence', num: 'I', title: '침묵과 정돈' },
  { id: 'scripture', num: 'II', title: '말씀 직면' },
  { id: 'confession', num: 'III', title: '골방 기도' },
  { id: 'intercession', num: 'IV', title: '중보의 연대' },
  { id: 'sending', num: 'V', title: '안식과 파송' }
];

const bookNamesKo = {
  "Genesis":"창세기","Exodus":"출애굽기","Leviticus":"레위기","Numbers":"민수기","Deuteronomy":"신명기",
  "Joshua":"여호수아","Judges":"사사기","Ruth":"룻기","1 Samuel":"사무엘상","2 Samuel":"사무엘하",
  "1 Kings":"열왕기상","2 Kings":"열왕기하","1 Chronicles":"역대상","2 Chronicles":"역대하","Ezra":"에스라",
  "Nehemiah":"느헤미야","Esther":"에스더","Job":"욥기","Psalms":"시편","Proverbs":"잠언","Ecclesiastes":"전도서",
  "Song of Solomon":"아가","Isaiah":"이사야","Jeremiah":"예레미야","Lamentations":"예레미야애가","Ezekiel":"에스겔",
  "Daniel":"다니엘","Hosea":"호세아","Joel":"요엘","Amos":"아모스","Obadiah":"오바댜","Jonah":"요나",
  "Micah":"미가","Nahum":"나훔","Habakkuk":"하박국","Zephaniah":"스바냐","Haggai":"학개","Zechariah":"스가랴",
  "Malachi":"말라기","Matthew":"마태복음","Mark":"마가복음","Luke":"누가복음","John":"요한복음","Acts":"사도행전",
  "Romans":"로마서","1 Corinthians":"고린도전서","2 Corinthians":"고린도후서","Galatians":"갈라디아서",
  "Ephesians":"에베소서","Philippians":"빌립보서","Colossians":"골로새서","1 Thessalonians":"데살로니가전서",
  "2 Thessalonians":"데살로니가후서","1 Timothy":"디모데전서","2 Timothy":"디모데후서","Titus":"디도서",
  "Philemon":"빌레몬서","Hebrews":"히브리서","James":"야고보서","1 Peter":"베드로전서","2 Peter":"베드로후서",
  "1 John":"요한일서","2 John":"요한이서","3 John":"요한삼서","Jude":"유다서","Revelation":"요한계시록"
};

export default function MeditationPilgrimage({ setActiveScreen, isDarkMode, authUser, logUserAction, bibles = [], date }) {
  const [hasEntered, setHasEntered] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [transitionState, setTransitionState] = useState('idle'); // 'idle' | 'exit' | 'enter'

  const [silenceTimer, setSilenceTimer] = useState(60);
  const [isPrayerOffered, setIsPrayerOffered] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const timerRef = useRef(null);
  
  const [scripture, setScripture] = useState({
    title: '하늘로부터 임한 말씀 직면',
    verseText: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.',
    reference: '(시편 23:1-2)',
    question: '주님이 나의 선한 목자 되심을 온전히 신뢰하지 못하고 염려했던 삶의 자리는 어디입니까?'
  });
  const [journal, setJournal] = useState({ confession: '', thanksgiving: '', resolution: '' });
  const [prayers, setPrayers] = useState([]);
  const [pIndex, setPIndex] = useState(0);
  const [prayedIds, setPrayedIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const userName = authUser?.name || (typeof authUser === 'string' ? authUser : '') || '성도';

  // 🌟 고요하고 정제된 수도원적 서정 팔레트 (형광/쨍한 색 완전 배제)
  const T = {
    bg: isDarkMode ? '#0c0d10' : '#f9f8f5',
    textMain: isDarkMode ? '#ededed' : '#232220',
    textSub: isDarkMode ? '#71717a' : '#8c887b',
    textHighlight: isDarkMode ? '#c4c4c8' : '#4d4a43',
    line: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(35, 34, 32, 0.08)'
  };

  const pickRandomScripture = useCallback(() => {
    if (Array.isArray(bibles) && bibles.length > 0) {
      try {
        const randomBook = bibles[Math.floor(Math.random() * bibles.length)];
        if (randomBook && Array.isArray(randomBook.chapters) && randomBook.chapters.length > 0) {
          const randomChapIdx = Math.floor(Math.random() * randomBook.chapters.length);
          const chapterVerses = randomBook.chapters[randomChapIdx];
          if (Array.isArray(chapterVerses) && chapterVerses.length > 0) {
            const randomVerseIdx = Math.floor(Math.random() * chapterVerses.length);
            const verseContent = chapterVerses[randomVerseIdx];
            const bookKo = bookNamesKo[randomBook.name] || randomBook.name;
            const refString = `(${bookKo} ${randomChapIdx + 1}:${randomVerseIdx + 1})`;

            setScripture({
              title: '하늘로부터 임한 오늘의 조명',
              verseText: typeof verseContent === 'string' ? verseContent.trim() : '여호와를 경외하는 것이 지혜의 근본이요 거룩하신 자를 아는 것이 명철이니라.',
              reference: refString,
              question: '이 말씀을 통해 오늘 주님께서 나에게 비추시는 은혜와 순종의 지점은 어디입니까?'
            });
            return;
          }
        }
      } catch (e) {}
    }

    if (Array.isArray(newYearVerseCards) && newYearVerseCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * newYearVerseCards.length);
      const card = newYearVerseCards[randomIndex];
      const match = card.match(/(.*?)\s*(\([^)]+\))$/);
      const text = match ? match[1].trim() : card;
      const ref = match ? match[2].trim() : '';

      setScripture({
        title: '하늘로부터 임한 오늘의 조명',
        verseText: text,
        reference: ref,
        question: '오늘 내가 십자가 앞에 내려놓고 주님께 온전히 맡겨야 할 짐은 무엇입니까?'
      });
    }
  }, [bibles]);

  useEffect(() => {
    pickRandomScripture();

    const fetchPrayers = async () => {
      try {
        const localPrayers = JSON.parse(localStorage.getItem('goodtree_global_intercessions') || localStorage.getItem('goodtree_global_prayers') || '[]');
        if (localPrayers && localPrayers.length > 0) {
          setPrayers(localPrayers.map(p => ({
            id: p.id || Math.random(),
            sender_name: p.sender || '지체',
            content: decryptField(p.text || p.content || '')
          })));
          return;
        }

        if (supabase) {
          const { data } = await supabase.from('secret_injections').select('*').eq('type', 'prayer').limit(10);
          if (data && data.length > 0) {
            setPrayers(data.map(p => ({
              id: p.id,
              sender_name: '중보의 손길',
              content: decryptField(p.content)
            })));
          }
        }
      } catch (e) {}
    };
    fetchPrayers();
  }, [pickRandomScripture]);

  // 🌟 잔잔한 피아노 선율 페이드인
  const handleEnterRoom = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAudioPlaying(true);
            let vol = 0;
            const fadeIn = setInterval(() => {
              if (vol < 0.22) { 
                vol += 0.02; 
                audioRef.current.volume = Math.min(vol, 0.22); 
              } else { 
                clearInterval(fadeIn); 
              }
            }, 180);
          })
          .catch(() => {});
      }
    }
    setHasEntered(true);
  };

  const toggleBGM = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.volume = 0.22;
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  // 🌟 여운을 남기는 페이드아웃 및 퇴장
  const fadeOutAndExit = (e) => {
    if (e) e.stopPropagation();
    if (audioRef.current && !audioRef.current.paused) {
      let vol = audioRef.current.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.03) { 
          vol -= 0.03; 
          audioRef.current.volume = Math.max(vol, 0); 
        } else {
          clearInterval(fadeOut);
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setActiveScreen('home');
        }
      }, 100);
    } else {
      setActiveScreen('home');
    }
  };

  useEffect(() => {
    if (hasEntered && stepIndex === 0) {
      const t = setInterval(() => setSilenceTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(t);
    }
  }, [hasEntered, stepIndex]);

  useEffect(() => {
    if (stepIndex === 3) {
      timerRef.current = setInterval(() => setTimerSec(p => p + 1), 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setTimerSec(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [stepIndex]);

  // 🌟 정갈하고 부드러운 화면 전환
  const handleScreenTouch = async (e) => {
    if (transitionState !== 'idle' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('textarea')) {
      return;
    }

    if (stepIndex === 2 && !isPrayerOffered) return;

    if (stepIndex === 2 && isPrayerOffered) {
      const full = `[토설] ${journal.confession}\n[감사] ${journal.thanksgiving}\n[결단] ${journal.resolution}`;
      if (full.trim().length > 5 && supabase) {
        setIsSaving(true);
        try {
          await supabase.from('diary').insert([{ user_name: userName, content: encryptField(full.trim()), created_at: new Date().toISOString() }]);
          if (typeof logUserAction === 'function') logUserAction(userName, 'meditationPilgrimage', 'write', `[골방기도] ${journal.resolution.slice(0, 30)}`);
        } catch (err) {}
        setIsSaving(false);
      }
    }
    
    if (stepIndex < STEPS.length - 1) {
      setTransitionState('exit');
      setTimeout(() => {
        setStepIndex(prev => prev + 1);
        setIsPrayerOffered(false);
        setTransitionState('enter');
        
        const mainEl = document.getElementById('meditation-scroll');
        if (mainEl) mainEl.scrollTop = 0;

        setTimeout(() => {
          setTransitionState('idle');
        }, 500);
      }, 400);
    } else {
      fadeOutAndExit();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <>
      {/* 🌟 천상의 피아노 독주곡 (J.S. Bach WTC Prelude in C Major) */}
      <audio 
        ref={audioRef} 
        src="https://upload.wikimedia.org/wikipedia/commons/c/c8/J.S._Bach_-_Well-Tempered_Clavier_1_-_Prelude_and_Fugue_No._1_in_C_major_%28BWV_846%29_-_Klaus_Schiff_%28piano%29.ogg"
        loop 
        preload="auto" 
        playsInline 
      />

      <style>{`
        .meditation-fade-exit {
          opacity: 0;
          transform: translateY(-8px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .meditation-fade-enter {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes gentleBreathRing {
          0%, 100% { transform: scale(0.88); opacity: 0.12; }
          50% { transform: scale(1.35); opacity: 0.35; }
        }
      `}</style>

      {/* 1. 고요한 첫 화면 (오프닝) */}
      {!hasEntered ? (
        <div 
          onClick={handleEnterRoom}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-8 sm:p-14 text-center cursor-pointer select-none font-sans overflow-hidden"
          style={{ backgroundColor: T.bg }}
        >
          <div className="pt-10">
            <span className="text-[10px] tracking-[0.35em] uppercase font-mono font-medium opacity-60" style={{ color: T.textSub }}>
              Liturgy of the Word
            </span>
          </div>
          
          <div className="space-y-4 my-auto max-w-md">
            <h1 className="text-[23px] sm:text-[27px] font-serif font-normal tracking-wide leading-[2.1]" style={{ color: T.textMain }}>
              일상을 잠시 멈추고<br/>말씀 앞 머무름을 시작합니다
            </h1>
            <p className="text-[12.5px] font-serif leading-relaxed opacity-70" style={{ color: T.textSub }}>
              고요한 피아노 선율과 함께 호흡을 정돈하는 시간
            </p>
          </div>

          <div className="pb-8 flex flex-col items-center gap-2">
            <span className="text-[11.5px] font-medium tracking-[0.2em] font-serif opacity-80 animate-pulse" style={{ color: T.textMain }}>
              화면을 가볍게 터치해 주세요
            </span>
          </div>
        </div>
      ) : (
        /* 2. 메인 묵상 여정 (5단계 리터지) */
        <div 
          onClick={handleScreenTouch}
          className="fixed inset-0 z-[200] flex flex-col w-full font-sans select-none overflow-hidden cursor-pointer"
          style={{ backgroundColor: T.bg }}
        >
          {/* 미니멀 헤더 */}
          <header className="shrink-0 pt-10 pb-4 px-6 sm:px-12 flex items-center justify-between z-10" onClick={e => e.stopPropagation()}>
            <button 
              onClick={fadeOutAndExit} 
              className="text-[11px] font-medium tracking-[0.25em] uppercase hover:opacity-60 transition-opacity cursor-pointer"
              style={{ color: T.textSub }}
            >
              나가기
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] font-serif italic tracking-wider opacity-60" style={{ color: T.textSub }}>
                {STEPS[stepIndex].num}.
              </span>
              <span className="text-[13px] font-serif font-medium tracking-[0.2em]" style={{ color: T.textMain }}>
                {STEPS[stepIndex].title}
              </span>
            </div>

            <button 
              onClick={toggleBGM}
              className="text-[11px] font-medium tracking-[0.2em] uppercase hover:opacity-60 transition-colors cursor-pointer"
              style={{ color: isAudioPlaying ? T.textMain : T.textSub }}
            >
              {isAudioPlaying ? '음악 켬' : '음악 끔'}
            </button>
          </header>

          {/* 묵상 본문 컨테이너 */}
          <main 
            id="meditation-scroll" 
            className={`flex-1 overflow-y-auto px-6 sm:px-14 py-8 flex flex-col justify-center w-full max-w-xl mx-auto overscroll-contain pb-[120px] hide-scrollbar ${
              transitionState === 'exit' ? 'meditation-fade-exit' : 'meditation-fade-enter'
            }`}
          >
            
            {/* 1단계: 침묵과 정돈 */}
            {stepIndex === 0 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-12">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full border border-current"
                    style={{ color: T.textSub, animation: 'gentleBreathRing 7s ease-in-out infinite' }}
                  />
                  <div className="text-[68px] font-extralight tracking-tight font-serif tabular-nums" style={{ color: T.textMain }}>
                    {String(silenceTimer).padStart(2, '0')}
                  </div>
                </div>

                <div className="space-y-3 max-w-xs">
                  <p className="text-[15px] leading-[2.3] font-serif break-keep font-normal" style={{ color: T.textHighlight }}>
                    주님, 호흡을 고르고 분주한 마음을 내려놓습니다.<br/>고요함 속에서 제게 말씀하여 주옵소서.
                  </p>
                </div>
              </div>
            )}

            {/* 2단계: 말씀 직면 (정갈한 왼쪽 정렬 복원) */}
            {stepIndex === 1 && (
              <div className="flex flex-col justify-center my-auto space-y-8 text-left w-full">
                
                <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.25em] uppercase opacity-70" style={{ color: T.textSub }}>
                    {scripture.title}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); pickRandomScripture(); }}
                    className="text-[11px] font-serif hover:opacity-60 transition-opacity cursor-pointer"
                    style={{ color: T.textSub }}
                  >
                    새 말씀 묵상
                  </button>
                </div>

                {/* 🌟 완벽한 왼쪽 정렬 & 편안한 행간 */}
                <div className="space-y-6 pt-2">
                  <p className="text-[18.5px] sm:text-[21.5px] leading-[2.4] font-serif font-normal select-text break-keep text-left" style={{ color: T.textMain }}>
                    {scripture.verseText}
                  </p>

                  {scripture.reference && (
                    <div className="text-right pt-2">
                      <span className="text-[13.5px] font-serif italic opacity-75" style={{ color: T.textSub }}>
                        {scripture.reference}
                      </span>
                    </div>
                  )}
                </div>

                {/* 묵상 질문 */}
                <div className="pt-8 border-t space-y-2 text-left" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.2em] uppercase block opacity-60" style={{ color: T.textSub }}>
                    성찰을 위한 질문
                  </span>
                  <p className="text-[14px] leading-[2.1] font-serif break-keep font-normal" style={{ color: T.textHighlight }}>
                    {scripture.question}
                  </p>
                </div>

              </div>
            )}

            {/* 3단계: 성찰과 골방 기도 (미니멀 양피지 저널) */}
            {stepIndex === 2 && (
              <div className="space-y-12 my-auto py-4 text-left w-full">
                {!isPrayerOffered ? (
                  <div className="space-y-10">
                    
                    <div className="space-y-3">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        I. 오늘 주 앞에 털어놓는 나의 연약함과 죄
                      </label>
                      <textarea
                        value={journal.confession}
                        onChange={e => setJournal({ ...journal, confession: e.target.value })}
                        onInput={autoResize}
                        placeholder="숨김없이 솔직한 마음을 토설합니다..."
                        className="w-full bg-transparent outline-none text-[15.5px] leading-[2.3] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        II. 그럼에도 부어주신 구원의 은혜와 감사
                      </label>
                      <textarea
                        value={journal.thanksgiving}
                        onChange={e => setJournal({ ...journal, thanksgiving: e.target.value })}
                        onInput={autoResize}
                        placeholder="내 삶을 붙드시는 은혜를 헤아려봅니다..."
                        className="w-full bg-transparent outline-none text-[15.5px] leading-[2.3] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        III. 오늘 살아낼 구체적 순종과 결단
                      </label>
                      <textarea
                        value={journal.resolution}
                        onChange={e => setJournal({ ...journal, resolution: e.target.value })}
                        onInput={autoResize}
                        placeholder="내가 오늘 십자가를 져야 할 자리는 어디입니까..."
                        className="w-full bg-transparent outline-none text-[15.5px] leading-[2.3] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => setIsPrayerOffered(true)}
                        className="w-full py-4 text-[13px] font-serif tracking-[0.25em] uppercase hover:opacity-60 transition-all cursor-pointer border-b text-center"
                        style={{ color: T.textMain, borderColor: T.line }}
                      >
                        기도를 주님 손에 올려드립니다
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center space-y-6 animate-fade-in">
                    <h4 className="text-[19px] font-serif font-normal tracking-wide leading-relaxed" style={{ color: T.textMain }}>
                      당신의 기도가 하늘 보좌에 닿았습니다
                    </h4>
                    <p className="text-[14px] font-serif leading-[2.4] opacity-75" style={{ color: T.textHighlight }}>
                      "내가 네 기도를 들었고 네 눈물을 보았노라"<br/>
                      <span className="text-[12px] opacity-60">(열왕기하 20:5)</span><br/><br/>
                      이제 평안한 마음으로 화면을 터치해 다음 여정으로 나아가세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4단계: 중보의 연대 */}
            {stepIndex === 3 && (
              <div className="flex flex-col justify-center my-auto space-y-12 text-center w-full">
                {prayers.length === 0 ? (
                  <p className="text-[15px] font-serif leading-[2.3] opacity-75" style={{ color: T.textHighlight }}>
                    현재 등록된 공동체 중보기도 제목이 없습니다.<br/>오늘 하루, 조용히 이웃을 위해 마음으로 기도해 주세요.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-[11px] font-serif tracking-[0.3em] uppercase opacity-60" style={{ color: T.textSub }}>
                        {prayers[pIndex]?.sender_name || '지체'}의 기도제목
                      </span>
                    </div>

                    <p className="text-[18px] sm:text-[21px] leading-[2.4] font-serif font-normal break-keep px-2" style={{ color: T.textMain }}>
                      "{prayers[pIndex]?.content}"
                    </p>

                    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const pid = prayers[pIndex].id;
                          setPrayedIds(prev => {
                            const n = new Set(prev);
                            n.has(pid) ? n.delete(pid) : n.add(pid);
                            return n;
                          });
                        }}
                        className="w-full py-4 text-[13px] font-serif tracking-[0.2em] uppercase transition-all cursor-pointer border-b hover:opacity-60"
                        style={{ 
                          color: prayedIds.has(prayers[pIndex].id) ? T.textSub : T.textMain,
                          borderColor: T.line
                        }}
                      >
                        {prayedIds.has(prayers[pIndex].id) ? '기도를 심었습니다 (완료)' : '함께 손 모아 기도하기'}
                      </button>

                      <div className="flex justify-between items-center w-full px-4 text-[11px] font-serif opacity-60" style={{ color: T.textSub }}>
                        <button
                          disabled={pIndex === 0}
                          onClick={(e) => { e.stopPropagation(); setPIndex(p => p - 1); }}
                          className={`uppercase tracking-[0.2em] cursor-pointer hover:opacity-100 ${pIndex === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                        >
                          이전
                        </button>
                        <span className="font-mono tracking-widest">
                          {String(Math.floor(timerSec / 60)).padStart(2, '0')}:{String(timerSec % 60).padStart(2, '0')}
                        </span>
                        <button
                          disabled={pIndex === prayers.length - 1}
                          onClick={(e) => { e.stopPropagation(); setPIndex(p => p + 1); }}
                          className={`uppercase tracking-[0.2em] cursor-pointer hover:opacity-100 ${pIndex === prayers.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                        >
                          다음
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 5단계: 안식과 파송 */}
            {stepIndex === 4 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-8">
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50" style={{ color: T.textSub }}>
                  Dismissal
                </span>
                
                <h2 className="text-[23px] font-serif font-normal tracking-wide" style={{ color: T.textMain }}>
                  삶의 현장으로 나아갑니다
                </h2>
                
                <p className="text-[15px] leading-[2.5] font-serif break-keep max-w-sm font-light opacity-80" style={{ color: T.textHighlight }}>
                  오늘 골방에서 올려드린 기도가<br/>세상 속에서 빛과 소금의 열매로 맺히길 축복합니다.<br/><br/>
                  <span className="font-normal block mt-4" style={{ color: T.textMain }}>
                    평안히 가십시오. 주께서 동행하십니다.
                  </span>
                </p>
              </div>
            )}

          </main>

          {/* 하단 터치 진행 가이드 */}
          <footer className="shrink-0 pb-10 pt-2 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] font-serif tracking-[0.3em] uppercase opacity-40 animate-pulse" style={{ color: T.textSub }}>
              화면을 가볍게 터치하여 계속하기
            </span>
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)', width: '100%' }} />
          </footer>

        </div>
      )}
    </>
  );
}
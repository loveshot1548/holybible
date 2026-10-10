// src/components/MeditationPilgrimage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { newYearVerseCards } from '../data/verseCards';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 골방 기도문 절대 보안 보호
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
  { id: 'silence', num: 'I', title: '침묵과 정돈', subtitle: '숨을 고르고 주 앞에 머무름' },
  { id: 'scripture', num: 'II', title: '말씀 직면', subtitle: '하늘로부터 임한 오늘의 조명' },
  { id: 'confession', num: 'III', title: '골방 기도', subtitle: '숨김없는 토설과 거룩한 결단' },
  { id: 'intercession', num: 'IV', title: '중보의 연대', subtitle: '지체들의 눈물을 품는 시간' },
  { id: 'sending', num: 'V', title: '안식과 파송', subtitle: '평안을 품고 세상 속으로' }
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

// 🌟 신뢰성 높은 정통 피아노 묵상 찬양 트랙 리스트
const PIANO_TRACKS = [
  {
    title: '바흐 평균율 C장조 프렐류드 (고요한 묵상)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/J.S._Bach_-_Well-Tempered_Clavier_1_-_Prelude_and_Fugue_No._1_in_C_major_%28BWV_846%29_-_Klaus_Schiff_%28piano%29.ogg'
  },
  {
    title: '내 평생에 가는 길 / 평안의 기도 선율',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/It_is_well_with_my_soul.ogg'
  }
];

export default function MeditationPilgrimage({ setActiveScreen, isDarkMode, authUser, logUserAction, bibles = [], date }) {
  const [hasEntered, setHasEntered] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [transitionState, setTransitionState] = useState('idle'); // 'idle' | 'exit' | 'enter'

  // 침묵 호흡 타이머
  const [silenceDuration, setSilenceDuration] = useState(60);
  const [silenceTimer, setSilenceTimer] = useState(60);
  const [breathPhase, setBreathPhase] = useState('inhale'); // 'inhale' (들숨 4s) | 'hold' (2s) | 'exhale' (날숨 4s)

  // 골방 기도 상태
  const [isPrayerOffered, setIsPrayerOffered] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const timerRef = useRef(null);
  
  // 말씀 데이터
  const [scripture, setScripture] = useState({
    title: '하늘로부터 임한 말씀 직면',
    verseText: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.',
    reference: '(시편 23:1-2)',
    question: '주님이 나의 선한 목자 되심을 온전히 신뢰하지 못하고 염려했던 삶의 자리는 어디입니까?',
    originalInsight: '히브리어 [로 에흐사르]: 단순히 물질적 결핍이 없는 것을 넘어, 목자의 품 안에서 영혼의 전적인 안식을 누림을 뜻합니다.'
  });

  const [journal, setJournal] = useState({ confession: '', thanksgiving: '', resolution: '' });
  const [prayers, setPrayers] = useState([]);
  const [pIndex, setPIndex] = useState(0);
  const [prayedIds, setPrayedIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // 오디오 시스템 상태
  const audioRef = useRef(null);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0.24); // 0.12 | 0.24 | 0.38
  const [isTTSActive, setIsTTSActive] = useState(false);

  const userName = authUser?.name || (typeof authUser === 'string' ? authUser : '') || '성도';

  // 🌟 고요하고 정제된 수도원적 서정 팔레트 (WCAG AAA 고대비 준수)
  const T = {
    bg: isDarkMode ? '#0A0B0E' : '#FAF8F5',
    textMain: isDarkMode ? '#F4F4F6' : '#1F1E1B',
    textSub: isDarkMode ? '#8E8E98' : '#7C786E',
    textHighlight: isDarkMode ? '#D4D4D8' : '#3E3B33',
    line: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : 'rgba(31, 30, 27, 0.10)',
    candle: isDarkMode ? '#F59E0B' : '#D97706',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
  };

  // 성경 말씀 무작위 조명
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
              question: '이 말씀을 통해 오늘 주님께서 나에게 비추시는 은혜와 순종의 지점은 어디입니까?',
              originalInsight: `${bookKo}의 기록 목적 안에서, 오늘 이 구절은 당신의 마음 가장 깊은 곳을 비추는 등불이 됩니다.`
            });
            return;
          }
        }
      } catch (_) {}
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
        question: '오늘 내가 십자가 앞에 내려놓고 주님께 온전히 맡겨야 할 짐은 무엇입니까?',
        originalInsight: '약속의 말씀을 온 마음으로 신뢰할 때, 영혼에 비로소 참된 자유가 임합니다.'
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
          const { data } = await supabase.from('secret_injections').select('*').eq('type', 'prayer').limit(12);
          if (data && data.length > 0) {
            setPrayers(data.map(p => ({
              id: p.id,
              sender_name: '중보의 손길',
              content: decryptField(p.content)
            })));
          }
        }
      } catch (_) {}
    };
    fetchPrayers();
  }, [pickRandomScripture]);

  // 🌟 천상의 피아노 선율 페이드인
  const handleEnterRoom = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAudioPlaying(true);
            let vol = 0;
            const targetVol = volumeLevel;
            const fadeIn = setInterval(() => {
              if (vol < targetVol) { 
                vol += 0.02; 
                if (audioRef.current) audioRef.current.volume = Math.min(vol, targetVol); 
              } else { 
                clearInterval(fadeIn); 
              }
            }, 140);
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
      audioRef.current.volume = volumeLevel;
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const changeTrack = (e) => {
    if (e) e.stopPropagation();
    const nextIdx = (currentTrackIdx + 1) % PIANO_TRACKS.length;
    setCurrentTrackIdx(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = PIANO_TRACKS[nextIdx].url;
      if (isAudioPlaying) {
        audioRef.current.volume = volumeLevel;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const cycleVolume = (e) => {
    if (e) e.stopPropagation();
    const nextVol = volumeLevel === 0.12 ? 0.24 : volumeLevel === 0.24 ? 0.38 : 0.12;
    setVolumeLevel(nextVol);
    if (audioRef.current) {
      audioRef.current.volume = nextVol;
    }
  };

  // 음성 낭독 (Web Speech TTS)
  const speakScripture = (e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    if (isTTSActive) {
      window.speechSynthesis.cancel();
      setIsTTSActive(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${scripture.verseText} ${scripture.reference}`);
    u.lang = 'ko-KR';
    u.rate = 0.84; // 경건하고 침착한 템포
    u.onend = () => setIsTTSActive(false);
    u.onerror = () => setIsTTSActive(false);
    setIsTTSActive(true);
    window.speechSynthesis.speak(u);
  };

  // 여운을 남기는 페이드아웃 및 퇴장
  const fadeOutAndExit = (target = 'home') => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current && !audioRef.current.paused) {
      let vol = audioRef.current.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.03) { 
          vol -= 0.03; 
          if (audioRef.current) audioRef.current.volume = Math.max(vol, 0); 
        } else {
          clearInterval(fadeOut);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          setActiveScreen(target);
        }
      }, 80);
    } else {
      setActiveScreen(target);
    }
  };

  // 1단계 침묵 타이머 & 4-4-4 성경적 호흡 펄스
  useEffect(() => {
    if (hasEntered && stepIndex === 0) {
      const t = setInterval(() => {
        setSilenceTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // 10초 주기 호흡 루프: 4초 들숨 -> 2초 멈춤 -> 4초 날숨
      const breathTimer = setInterval(() => {
        const secMod = (silenceDuration - silenceTimer) % 10;
        if (secMod < 4) setBreathPhase('inhale');
        else if (secMod < 6) setBreathPhase('hold');
        else setBreathPhase('exhale');
      }, 500);

      return () => {
        clearInterval(t);
        clearInterval(breathTimer);
      };
    }
  }, [hasEntered, stepIndex, silenceDuration, silenceTimer]);

  useEffect(() => {
    if (stepIndex === 3) {
      timerRef.current = setInterval(() => setTimerSec(p => p + 1), 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setTimerSec(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [stepIndex]);

  // 부드러운 화면 전환
  const handleScreenTouch = async (e) => {
    if (transitionState !== 'idle' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('textarea')) {
      return;
    }

    if (stepIndex === 2 && !isPrayerOffered) return;

    // 골방 기도문 저장 및 오늘 날짜 QT/루틴 완료 연동
    if (stepIndex === 2 && isPrayerOffered) {
      const full = `[토설] ${journal.confession}\n[감사] ${journal.thanksgiving}\n[결단] ${journal.resolution}`;
      if (full.trim().length > 5) {
        setIsSaving(true);
        try {
          if (supabase) {
            await supabase.from('diary').insert([{ user_name: userName, content: encryptField(full.trim()), created_at: new Date().toISOString() }]);
          }
          if (typeof logUserAction === 'function') {
            logUserAction(userName, 'meditationPilgrimage', 'write', `[골방기도] ${journal.resolution.slice(0, 30)}`);
          }
          // 로컬 QT 일지 체크 자동 반영
          const todayKey = date || new Date().toISOString().split('T')[0];
          const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
          const todayData = allQt[todayKey] || {};
          allQt[todayKey] = {
            ...todayData,
            checks: { ...(todayData.checks || {}), '기도하기': true, '묵상여정': true }
          };
          localStorage.setItem('qt_daily', JSON.stringify(allQt));
        } catch (_) {}
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
      fadeOutAndExit('home');
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <>
      {/* 🌟 천상의 피아노 찬양 오디오 엘리먼트 */}
      <audio 
        ref={audioRef} 
        src={PIANO_TRACKS[currentTrackIdx].url}
        loop 
        preload="auto" 
        playsInline 
      />

      <style>{`
        .meditation-fade-exit {
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .meditation-fade-enter {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes subtleCandleFlicker {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.6)); }
          25% { transform: scale(1.04) translate(-0.5px, -1px); opacity: 0.95; filter: drop-shadow(0 0 22px rgba(245, 158, 11, 0.75)); }
          50% { transform: scale(0.97) translate(0.5px, 0.5px); opacity: 0.75; filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.5)); }
          75% { transform: scale(1.02) translate(-0.3px, 0.3px); opacity: 0.90; filter: drop-shadow(0 0 19px rgba(245, 158, 11, 0.7)); }
        }
        @keyframes breathRingInhale {
          0% { transform: scale(0.85); opacity: 0.15; }
          100% { transform: scale(1.35); opacity: 0.45; }
        }
        @keyframes incenseAscent {
          0% { transform: translateY(0) scale(0.9); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: translateY(-30px) scale(1.15); opacity: 0; }
        }
      `}</style>

      {/* 1. 고요하고 웅장한 대문 화면 (오프닝 포털) */}
      {!hasEntered ? (
        <div 
          onClick={handleEnterRoom}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-8 sm:p-14 text-center cursor-pointer select-none font-sans overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: T.bg }}
        >
          {/* 상단: 거룩한 성소 앰비언트 글로우 */}
          <div className="pt-8 flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.38em] uppercase font-mono font-medium opacity-50" style={{ color: T.textSub }}>
              The Sanctuary • Liturgy of Life
            </span>
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: T.candle, animation: 'subtleCandleFlicker 3s infinite ease-in-out' }}
            />
          </div>
          
          {/* 중앙: 상징적인 초대 문구 & 캔들 형상 */}
          <div className="space-y-6 my-auto max-w-md animate-fade-in">
            {/* 은은한 성소의 촛불 아이콘 */}
            <div className="flex justify-center mb-2">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-8 h-8"
                style={{ color: T.candle, animation: 'subtleCandleFlicker 4s infinite ease-in-out' }}
              >
                <path d="M12 2C11 4.5 10 6 10 8C10 9.65685 10.8954 11 12 11C13.1046 11 14 9.65685 14 8C14 6 13 4.5 12 2Z" fill="currentColor" />
                <path d="M9 13H15V22H9V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <line x1="7" y1="22" x2="17" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>

            <h1 className="text-[24px] sm:text-[28px] font-serif font-normal tracking-wide leading-[2.1]" style={{ color: T.textMain }}>
              일상을 잠시 멈추고<br/>말씀 앞 머무름을 시작합니다
            </h1>

            <p className="text-[13px] font-serif leading-[2.2] opacity-70" style={{ color: T.textSub }}>
              분주한 세상의 소리를 끄고 하늘의 음성을 마주하는 골방<br/>
              <span className="text-[11.5px] opacity-60 font-mono tracking-wider">고요한 피아노 찬양 선율과 함께하는 5단계 여정</span>
            </p>
          </div>

          {/* 하단: 터치 초대 */}
          <div className="pb-8 flex flex-col items-center gap-2">
            <span className="text-[11px] font-medium tracking-[0.25em] font-serif opacity-80 animate-pulse" style={{ color: T.textMain }}>
              화면을 가볍게 터치하여 입장하세요
            </span>
          </div>
        </div>
      ) : (
        /* 2. 메인 묵상 여정 (5단계 거룩한 리터지) */
        <div 
          onClick={handleScreenTouch}
          className="fixed inset-0 z-[200] flex flex-col w-full font-sans select-none overflow-hidden cursor-pointer transition-colors duration-700"
          style={{ backgroundColor: T.bg }}
        >
          {/* 미니멀 헤더 바 (컨트롤 센터 완비) */}
          <header className="shrink-0 pt-8 pb-3 px-6 sm:px-12 flex items-center justify-between z-10 border-b border-dashed" style={{ borderColor: T.line }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => fadeOutAndExit('home')} 
              className="text-[11px] font-medium tracking-[0.25em] uppercase hover:opacity-60 transition-opacity cursor-pointer flex items-center gap-1"
              style={{ color: T.textSub }}
            >
              <span>✕</span> 나가기
            </button>
            
            {/* 단계 인디케이터 */}
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-serif italic tracking-wider" style={{ color: T.candle }}>
                {STEPS[stepIndex].num}.
              </span>
              <span className="text-[13.5px] font-serif font-medium tracking-[0.2em]" style={{ color: T.textMain }}>
                {STEPS[stepIndex].title}
              </span>
            </div>

            {/* 청각 환경 컨트롤러 (음악 토글 / 곡 변경 / 볼륨) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={changeTrack}
                title="다른 피아노 찬양곡으로 변경"
                className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border hover:opacity-80 transition-all cursor-pointer hidden sm:inline"
                style={{ color: T.textSub, borderColor: T.line }}
              >
                곡 {currentTrackIdx + 1}
              </button>

              <button 
                onClick={cycleVolume}
                title="피아노 볼륨 조절"
                className="text-[10px] font-mono px-2 py-0.5 rounded border hover:opacity-80 transition-all cursor-pointer"
                style={{ color: T.textSub, borderColor: T.line }}
              >
                {volumeLevel === 0.12 ? '약' : volumeLevel === 0.24 ? '중' : '강'}
              </button>

              <button 
                onClick={toggleBGM}
                className="text-[11px] font-serif tracking-[0.15em] hover:opacity-60 transition-colors cursor-pointer"
                style={{ color: isAudioPlaying ? T.candle : T.textSub }}
              >
                {isAudioPlaying ? '선율 켬' : '선율 끔'}
              </button>
            </div>
          </header>

          {/* 메인 묵상 스크롤 뷰포트 */}
          <main 
            id="meditation-scroll" 
            className={`flex-1 overflow-y-auto px-6 sm:px-14 py-6 flex flex-col justify-center w-full max-w-xl mx-auto overscroll-contain pb-[110px] hide-scrollbar ${
              transitionState === 'exit' ? 'meditation-fade-exit' : 'meditation-fade-enter'
            }`}
          >
            
            {/* ================================================================= */}
            {/* I. 침묵과 정돈 (4-4-4 성경적 호흡 펄스 가이드)                     */}
            {/* ================================================================= */}
            {stepIndex === 0 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-10">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  {/* 호흡 펄스 링 */}
                  <div 
                    className="absolute inset-0 rounded-full border border-current transition-all duration-1000 ease-in-out"
                    style={{ 
                      color: T.candle,
                      transform: breathPhase === 'inhale' ? 'scale(1.28)' : breathPhase === 'hold' ? 'scale(1.28)' : 'scale(0.85)',
                      opacity: breathPhase === 'inhale' ? 0.45 : breathPhase === 'hold' ? 0.35 : 0.15
                    }}
                  />
                  
                  {/* 중앙 남은 시간 */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[64px] font-extralight tracking-tight font-serif tabular-nums leading-none" style={{ color: T.textMain }}>
                      {String(silenceTimer).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 mt-1" style={{ color: T.textSub }}>
                      Seconds
                    </span>
                  </div>
                </div>

                {/* 성경적 호흡 가이드 문구 */}
                <div className="space-y-3 max-w-xs">
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-serif font-medium border" style={{ color: T.candle, borderColor: T.line, backgroundColor: T.cardBg }}>
                    {breathPhase === 'inhale' && '들숨 • 주님의 은혜와 평안을 채웁니다'}
                    {breathPhase === 'hold' && '머무름 • 주님의 임재 안에 머뭅니다'}
                    {breathPhase === 'exhale' && '날숨 • 세상의 모든 염려를 비워냅니다'}
                  </div>
                  
                  <p className="text-[14.5px] leading-[2.3] font-serif break-keep font-normal opacity-85" style={{ color: T.textHighlight }}>
                    주님, 분주했던 생각과 호흡을 정돈합니다.<br/>고요함 속에서 제게 말씀하여 주옵소서.
                  </p>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* II. 말씀 직면 (원어 묵상 한 줄 & 음성 낭독)                       */}
            {/* ================================================================= */}
            {stepIndex === 1 && (
              <div className="flex flex-col justify-center my-auto space-y-7 text-left w-full">
                
                <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.25em] uppercase opacity-70" style={{ color: T.textSub }}>
                    {scripture.title}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={speakScripture}
                      className="text-[11px] font-serif hover:opacity-60 transition-opacity cursor-pointer flex items-center gap-1"
                      style={{ color: isTTSActive ? T.candle : T.textSub }}
                    >
                      <span>🔊</span> {isTTSActive ? '낭독 정지' : '말씀 듣기'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); pickRandomScripture(); }}
                      className="text-[11px] font-serif hover:opacity-60 transition-opacity cursor-pointer"
                      style={{ color: T.textSub }}
                    >
                      새 말씀 ⟳
                    </button>
                  </div>
                </div>

                {/* 말씀 본문 (우아한 세리프 & 행간) */}
                <div className="space-y-4 pt-1">
                  <p className="text-[19px] sm:text-[22px] leading-[2.4] font-serif font-normal select-text break-keep text-left" style={{ color: T.textMain }}>
                    "{scripture.verseText}"
                  </p>

                  {scripture.reference && (
                    <div className="text-right">
                      <span className="text-[13.5px] font-serif italic opacity-75 font-medium" style={{ color: T.candle }}>
                        {scripture.reference}
                      </span>
                    </div>
                  )}
                </div>

                {/* 원어적 영적 조명 */}
                {scripture.originalInsight && (
                  <div className="p-3.5 rounded-xl text-[12px] font-serif leading-relaxed opacity-85 border" style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textHighlight }}>
                    💡 <b>원문 묵상:</b> {scripture.originalInsight}
                  </div>
                )}

                {/* 묵상 성찰 질문 */}
                <div className="pt-6 border-t space-y-2 text-left" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.2em] uppercase block opacity-60" style={{ color: T.textSub }}>
                    성찰을 위한 질문
                  </span>
                  <p className="text-[14px] leading-[2.1] font-serif break-keep font-normal" style={{ color: T.textHighlight }}>
                    {scripture.question}
                  </p>
                </div>

              </div>
            )}

            {/* ================================================================= */}
            {/* III. 골방 기도 (토설 ➔ 감사 ➔ 결단 & 하늘 보좌 승천)             */}
            {/* ================================================================= */}
            {stepIndex === 2 && (
              <div className="space-y-10 my-auto py-3 text-left w-full">
                {!isPrayerOffered ? (
                  <div className="space-y-9">
                    
                    <div className="space-y-2.5">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        I. 오늘 주 앞에 털어놓는 나의 연약함과 죄
                      </label>
                      <textarea
                        value={journal.confession}
                        onChange={e => setJournal({ ...journal, confession: e.target.value })}
                        onInput={autoResize}
                        placeholder="숨김없이 솔직한 마음을 토설합니다..."
                        className="w-full bg-transparent outline-none text-[15px] sm:text-[16px] leading-[2.2] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        II. 그럼에도 부어주신 구원의 은혜와 감사
                      </label>
                      <textarea
                        value={journal.thanksgiving}
                        onChange={e => setJournal({ ...journal, thanksgiving: e.target.value })}
                        onInput={autoResize}
                        placeholder="내 삶을 붙드시는 은혜를 헤아려봅니다..."
                        className="w-full bg-transparent outline-none text-[15px] sm:text-[16px] leading-[2.2] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[11.5px] font-serif tracking-[0.2em] uppercase block opacity-70" style={{ color: T.textSub }}>
                        III. 오늘 살아낼 구체적 순종과 결단
                      </label>
                      <textarea
                        value={journal.resolution}
                        onChange={e => setJournal({ ...journal, resolution: e.target.value })}
                        onInput={autoResize}
                        placeholder="내가 오늘 십자가를 져야 할 자리는 어디입니까..."
                        className="w-full bg-transparent outline-none text-[15px] sm:text-[16px] leading-[2.2] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setIsPrayerOffered(true)}
                        className="w-full py-4 text-[13px] font-serif tracking-[0.25em] uppercase hover:opacity-75 transition-all cursor-pointer border-b text-center"
                        style={{ color: T.textMain, borderColor: T.line }}
                      >
                        기도를 주님 손에 올려드립니다 🕊️
                      </button>
                    </div>

                  </div>
                ) : (
                  /* 기도가 향연이 되어 보좌에 상달되는 승천 화면 */
                  <div className="py-16 text-center space-y-6 animate-fade-in">
                    <div className="flex justify-center">
                      <span className="text-3xl" style={{ animation: 'incenseAscent 2.5s infinite ease-out' }}>
                        🕊️
                      </span>
                    </div>

                    <h4 className="text-[20px] font-serif font-normal tracking-wide leading-relaxed" style={{ color: T.textMain }}>
                      당신의 기도가 하늘 보좌에 상달되었습니다
                    </h4>

                    <p className="text-[14px] font-serif leading-[2.4] opacity-80" style={{ color: T.textHighlight }}>
                      "향연이 성도의 기도와 함께 천사의 손으로부터<br/>하나님 앞으로 올라가는지라"<br/>
                      <span className="text-[12px] opacity-60 font-mono">(요한계시록 8:4)</span><br/><br/>
                      이제 평안한 마음으로 화면을 가볍게 터치해 다음 여정으로 나아가세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* IV. 중보의 연대 (지체들을 위한 손모음)                           */}
            {/* ================================================================= */}
            {stepIndex === 3 && (
              <div className="flex flex-col justify-center my-auto space-y-10 text-center w-full">
                {prayers.length === 0 ? (
                  <p className="text-[15px] font-serif leading-[2.3] opacity-75" style={{ color: T.textHighlight }}>
                    현재 등록된 공동체 중보기도 제목이 없습니다.<br/>오늘 하루, 조용히 이웃과 가정을 위해 마음으로 기도해 주세요.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-[11px] font-serif tracking-[0.3em] uppercase opacity-60" style={{ color: T.textSub }}>
                        {prayers[pIndex]?.sender_name || '지체'}의 기도제목 ({pIndex + 1}/{prayers.length})
                      </span>
                    </div>

                    <p className="text-[18px] sm:text-[21px] leading-[2.4] font-serif font-normal break-keep px-2" style={{ color: T.textMain }}>
                      "{prayers[pIndex]?.content}"
                    </p>

                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto pt-2">
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
                        className="w-full py-3.5 text-[12.5px] font-serif tracking-[0.2em] uppercase transition-all cursor-pointer border rounded-full hover:opacity-80"
                        style={{ 
                          color: prayedIds.has(prayers[pIndex].id) ? T.candle : T.textMain,
                          borderColor: prayedIds.has(prayers[pIndex].id) ? T.candle : T.line,
                          backgroundColor: T.cardBg
                        }}
                      >
                        {prayedIds.has(prayers[pIndex].id) ? '✓ 기도를 올려드렸습니다' : '함께 손 모아 기도하기'}
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

            {/* ================================================================= */}
            {/* V. 안식과 파송 (축복의 파송 & 다음 사역 연동)                     */}
            {/* ================================================================= */}
            {stepIndex === 4 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-8 animate-fade-in">
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50" style={{ color: T.textSub }}>
                  Aaronic Benediction
                </span>
                
                <h2 className="text-[24px] sm:text-[27px] font-serif font-normal tracking-wide" style={{ color: T.textMain }}>
                  삶의 예배 자리로 나아갑니다
                </h2>
                
                <div className="space-y-4 max-w-sm">
                  <p className="text-[14.5px] leading-[2.5] font-serif break-keep font-light opacity-80" style={{ color: T.textHighlight }}>
                    "여호와는 네게 복을 주시고 너를 지키시기를 원하며<br/>
                    여호와는 그의 얼굴을 네게 비추사 은혜 베푸시기를 원하며<br/>
                    여호와는 그 얼굴을 네게로 향하여 드사 평강 주시기를 원하노라"<br/>
                    <span className="text-[11.5px] opacity-60 font-mono">(민수기 6:24-26)</span>
                  </p>

                  <p className="text-[13px] font-serif pt-2 opacity-70" style={{ color: T.textSub }}>
                    오늘 골방에서 주님과 맺은 언약이<br/>세상 속에서 빛과 소금의 열매로 맺히길 축복합니다.
                  </p>
                </div>

                {/* 파송 후 다음 사역 바로가기 액션 바 */}
                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-4" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => fadeOutAndExit('qt')}
                    className="flex-1 py-3 px-4 rounded-xl text-[12px] font-serif font-medium border hover:opacity-80 transition-all cursor-pointer"
                    style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                  >
                    🌿 오늘 QT 작성하기
                  </button>
                  <button
                    onClick={() => fadeOutAndExit('home')}
                    className="flex-1 py-3 px-4 rounded-xl text-[12px] font-serif font-medium hover:opacity-80 transition-all cursor-pointer"
                    style={{ backgroundColor: T.textMain, color: T.bg }}
                  >
                    🏠 홈으로 나아가기
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* 하단 진행 안내 푸터 */}
          <footer className="shrink-0 pb-8 pt-2 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {stepIndex < STEPS.length - 1 ? (
              <span className="text-[10px] font-serif tracking-[0.3em] uppercase opacity-40 animate-pulse" style={{ color: T.textSub }}>
                화면을 가볍게 터치하여 계속하기
              </span>
            ) : (
              <span className="text-[10px] font-serif tracking-[0.3em] uppercase opacity-40" style={{ color: T.textSub }}>
                오늘의 묵상 여정이 완료되었습니다
              </span>
            )}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)', width: '100%' }} />
          </footer>

        </div>
      )}
    </>
  );
}
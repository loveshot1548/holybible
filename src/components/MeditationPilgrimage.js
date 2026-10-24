// src/components/MeditationPilgrimage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { newYearVerseCards } from '../data/verseCards';

// =====================================================================
// 🔐 [보안 암호화 유틸리티] 골방 기도문 절대 보안 보호
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

// =====================================================================
// 🎵 [YouTube IFrame API 엔진] 나의 집중 기도실 전용 피아노 선율
// =====================================================================
function loadYouTubeIframeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prevCallback === 'function') prevCallback(); resolve(window.YT); };
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
}

const PIANO_TRACKS = [
  { id: 'lZAo5miNkzQ', title: '아침 묵상 피아노 (참된 평안과 쉼)' },
  { id: 'MDyaW3m4y84', title: '깊은 골방 기도 피아노 (임재와 눈물)' },
  { id: 'uw_jj4NKR4c', title: '잔잔한 워십 피아노 (은혜의 강가)' }
];

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

export default function MeditationPilgrimage({ setActiveScreen, isDarkMode, authUser, logUserAction, bibles = [], date }) {
  const isDark = Boolean(isDarkMode);

  const [hasEntered, setHasEntered] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [transitionState, setTransitionState] = useState('idle');

  // 침묵 호흡 타이머 설정 (30초, 60초, 120초)
  const [silenceTargetTime, setSilenceTargetTime] = useState(60);
  const [silenceTimer, setSilenceTimer] = useState(60);
  const [breathPhase, setBreathPhase] = useState('inhale'); // 'inhale' | 'hold' | 'exhale'

  // 골방 독대 타이머
  const [prayerTimerSec, setPrayerTimerSec] = useState(0);
  const [isPrayerOffered, setIsPrayerOffered] = useState(false);
  
  // 말씀 데이터
  const [scripture, setScripture] = useState({
    title: '하늘로부터 임한 말씀 직면',
    verseText: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.',
    reference: '(시편 23:1-2)',
    question: '주님이 나의 선한 목자 되심을 온전히 신뢰하지 못하고 염려했던 삶의 자리는 어디입니까?',
    originalInsight: '히브리어 [로 에흐사르]: 물질적 결핍이 없는 것을 넘어, 목자의 품 안에서 영혼의 전적인 안식을 누림을 뜻합니다.'
  });

  // 3대 기도 토설 & 감사 & 결단
  const [journal, setJournal] = useState({ confession: '', thanksgiving: '', resolution: '' });
  
  // 중보 기도 목록
  const [prayers, setPrayers] = useState([]);
  const [pIndex, setPIndex] = useState(0);
  const [prayedIds, setPrayedIds] = useState(new Set());

  // 🎵 백그라운드 YouTube BGM 플레이어 상태
  const ytPlayerRef = useRef(null);
  const ytWrapperRef = useRef(null);
  const isPlayerReadyRef = useRef(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [volumePercent, setVolumePercent] = useState(35); // 20 | 35 | 55 %
  const [isTTSActive, setIsTTSActive] = useState(false);

  const userName = authUser?.name || (typeof authUser === 'string' ? authUser : '') || '성도';

  // 🌟 고요하고 정제된 수도원적 서정 팔레트
  const T = {
    bg: isDark ? '#08090C' : '#FAF8F5',
    textMain: isDark ? '#F4F4F6' : '#1A1815',
    textSub: isDark ? '#8E8E98' : '#767268',
    textHighlight: isDark ? '#E2E8F0' : '#2D2B26',
    line: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(31, 30, 27, 0.08)',
    candle: isDark ? '#F59E0B' : '#D97706',
    candleGlow: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217, 119, 6, 0.2)',
    cardBg: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
  };

  // 1. YouTube BGM 인스턴스 초기화
  useEffect(() => {
    let cancelled = false;
    isPlayerReadyRef.current = false;
    let container = document.createElement('div');
    if (ytWrapperRef.current) {
      ytWrapperRef.current.appendChild(container);
    }

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled || !container) return;
      try {
        ytPlayerRef.current = new YT.Player(container, {
          height: '1', width: '1', videoId: PIANO_TRACKS[0].id,
          playerVars: { autoplay: 0, playsinline: 1, loop: 1, playlist: PIANO_TRACKS[0].id, controls: 0 },
          events: {
            onReady: () => { 
              isPlayerReadyRef.current = true;
              if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
                ytPlayerRef.current.setVolume(volumePercent);
              }
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) setIsPlayingBgm(true);
              else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setIsPlayingBgm(false);
            }
          }
        });
      } catch (_) {}
    });

    return () => {
      cancelled = true;
      isPlayerReadyRef.current = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (_) {}
        ytPlayerRef.current = null;
      }
      if (container && container.parentNode) {
        try { container.parentNode.removeChild(container); } catch (_) {}
      }
      setIsPlayingBgm(false);
    };
  }, []);

  // 피아노 재생 및 정지 제어
  const playPianoBgm = () => {
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      try {
        ytPlayerRef.current.setVolume(volumePercent);
        ytPlayerRef.current.playVideo();
      } catch (_) {}
    }
  };

  const pausePianoBgm = () => {
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
    }
  };

  const switchPianoTrack = (idx) => {
    setCurrentTrackIdx(idx);
    const target = PIANO_TRACKS[idx];
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(target.id);
        ytPlayerRef.current.setVolume(volumePercent);
      } catch (_) {}
    }
  };

  const cycleVolume = () => {
    const nextVol = volumePercent === 20 ? 35 : volumePercent === 35 ? 55 : 20;
    setVolumePercent(nextVol);
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try { ytPlayerRef.current.setVolume(nextVol); } catch (_) {}
    }
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
              question: '이 말씀을 통해 오늘 주님께서 나에게 비추시는 은혜와 순종의 자리는 어디입니까?',
              originalInsight: `${bookKo}의 정경 말씀 안에서, 오늘 이 구절은 당신의 마음 가장 깊은 곳을 비추는 등불이 됩니다.`
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
        question: '오늘 내가 십자가 앞에 내려놓고 주님께 온전히 맡겨야 할 무거운 짐은 무엇입니까?',
        originalInsight: '약속의 말씀을 온 마음으로 신뢰할 때, 영혼에 비로소 참된 자유와 안식이 임합니다.'
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

  // 성소 입장 (피아노 BGM 자동 스타트)
  const handleEnterRoom = () => {
    playPianoBgm();
    setHasEntered(true);
  };

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
    u.rate = 0.84;
    u.onend = () => setIsTTSActive(false);
    u.onerror = () => setIsTTSActive(false);
    setIsTTSActive(true);
    window.speechSynthesis.speak(u);
  };

  const fadeOutAndExit = (target = 'home') => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    pausePianoBgm();
    setActiveScreen(target);
  };

  // 1단계 침묵 타이머 & 호흡 펄스 (4초 들숨, 2초 머무름, 4초 날숨)
  useEffect(() => {
    if (hasEntered && stepIndex === 0) {
      const t = setInterval(() => {
        setSilenceTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const breathTimer = setInterval(() => {
        const secMod = (silenceTargetTime - silenceTimer) % 10;
        if (secMod < 4) setBreathPhase('inhale');
        else if (secMod < 6) setBreathPhase('hold');
        else setBreathPhase('exhale');
      }, 500);

      return () => {
        clearInterval(t);
        clearInterval(breathTimer);
      };
    }
  }, [hasEntered, stepIndex, silenceTimer, silenceTargetTime]);

  // 골방 기도 독대 타이머 (스텝 2, 3 진입 시)
  useEffect(() => {
    let t;
    if (stepIndex === 2 || stepIndex === 3) {
      t = setInterval(() => setPrayerTimerSec(p => p + 1), 1000);
    } else {
      setPrayerTimerSec(0);
    }
    return () => clearInterval(t);
  }, [stepIndex]);

  // 리터지 단계 이동 핸들러
  const handleAdvanceStep = async () => {
    if (transitionState !== 'idle') return;

    // 골방 기도 제출 처리 (스텝 2 -> 스텝 3 넘어갈 때)
    if (stepIndex === 2) {
      const full = `[토설] ${journal.confession}\n[감사] ${journal.thanksgiving}\n[결단] ${journal.resolution}`;
      if (full.trim().length > 6) {
        try {
          if (supabase) {
            await supabase.from('diary').insert([{ user_name: userName, content: encryptField(full.trim()), created_at: new Date().toISOString() }]);
          }
          if (typeof logUserAction === 'function') {
            logUserAction(userName, 'meditationPilgrimage', 'write', `[골방기도] ${journal.resolution.slice(0, 30)}`);
          }
          const todayKey = date || new Date().toISOString().split('T')[0];
          const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
          const todayData = allQt[todayKey] || {};
          allQt[todayKey] = {
            ...todayData,
            checks: { ...(todayData.checks || {}), '기도하기': true, '묵상여정': true }
          };
          localStorage.setItem('qt_daily', JSON.stringify(allQt));
        } catch (_) {}
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

        setTimeout(() => setTransitionState('idle'), 400);
      }, 300);
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
      {/* 🌟 보이지 않는 백그라운드 YouTube 플레이어 컨테이너 */}
      <div 
        ref={ytWrapperRef} 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -9999 }} 
      />

      <style>{`
        .meditation-fade-exit {
          opacity: 0;
          transform: translateY(-8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .meditation-fade-enter {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes gentleCandleGlow {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.55)); }
          50% { opacity: 0.98; filter: drop-shadow(0 0 24px rgba(245, 158, 11, 0.8)); }
        }
        @keyframes incenseAscent {
          0% { transform: translateY(0) scale(0.9); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: translateY(-32px) scale(1.15); opacity: 0; }
        }
      `}</style>

      {/* ── 1. 성소 대문 화면 (오프닝 포털) ── */}
      {!hasEntered ? (
        <div 
          onClick={handleEnterRoom}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-6 sm:p-12 text-center cursor-pointer select-none font-sans overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: T.bg }}
        >
          {/* 상단 촛불 표식 */}
          <div className="pt-8 flex flex-col items-center gap-2.5">
            <span className="text-[10px] tracking-[0.35em] uppercase font-mono font-bold opacity-60" style={{ color: T.textSub }}>
              MY SECRET SANCTUARY
            </span>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: T.candle, animation: 'gentleCandleGlow 2.8s infinite ease-in-out' }}
            />
          </div>
          
          {/* 중앙 초대 문구 */}
          <div className="space-y-6 my-auto max-w-md animate-fade-in px-4">
            <div className="flex justify-center mb-1">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-10 h-10"
                style={{ color: T.candle, animation: 'gentleCandleGlow 3.2s infinite ease-in-out' }}
              >
                <path d="M12 2C11 4.5 10 6 10 8C10 9.65685 10.8954 11 12 11C13.1046 11 14 9.65685 14 8C14 6 13 4.5 12 2Z" fill="currentColor" />
                <path d="M9 13H15V22H9V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <line x1="7" y1="22" x2="17" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-serif tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                {userName} 성도님을 위한 골방
              </span>
              <h1 className="text-[24px] sm:text-[28px] font-serif font-normal tracking-wide leading-[2.1]" style={{ color: T.textMain }}>
                세상의 분주함을 멈추고<br/>말씀 앞 머무름을 시작합니다
              </h1>
            </div>

            <p className="text-[13px] font-serif leading-[2.3] opacity-80" style={{ color: T.textSub }}>
              조용한 피아노 선율 속에서 숨을 고르고,<br/>
              하늘의 음성을 직면하는 5단계 집중 기도 여정입니다.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold border" style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.candle }}>
                <span>🎹</span> {PIANO_TRACKS[0].title}
              </span>
            </div>
          </div>

          {/* 하단 터치 초대 */}
          <div className="pb-8">
            <span className="text-[11.5px] font-medium tracking-[0.25em] font-serif opacity-80 animate-pulse" style={{ color: T.textMain }}>
              화면을 터치하여 성소에 입장하세요 🕊️
            </span>
          </div>
        </div>
      ) : (
        /* ── 2. 메인 묵상 여정 (5단계 리터지) ── */
        <div 
          className="fixed inset-0 z-[200] flex flex-col w-full h-full font-sans select-none overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: T.bg }}
        >
          {/* 상단 미니멀 헤더 & 피아노 컨트롤 바 */}
          <header 
            className="shrink-0 pt-5 sm:pt-7 pb-3 px-4 sm:px-10 flex items-center justify-between z-10 border-b border-dashed" 
            style={{ borderColor: T.line }} 
          >
            <button 
              onClick={() => fadeOutAndExit('home')} 
              className="text-[11px] font-medium tracking-[0.15em] uppercase hover:opacity-60 transition-opacity cursor-pointer flex items-center gap-1"
              style={{ color: T.textSub }}
            >
              <span>✕</span> 나가기
            </button>
            
            {/* 현재 단계 인디케이터 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[12px] font-serif italic font-bold" style={{ color: T.candle }}>
                {STEPS[stepIndex].num}.
              </span>
              <span className="text-[13px] sm:text-[14px] font-serif font-bold tracking-[0.15em]" style={{ color: T.textMain }}>
                {STEPS[stepIndex].title}
              </span>
            </div>

            {/* 피아노 오디오 컨트롤러 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={currentTrackIdx}
                onChange={(e) => switchPianoTrack(Number(e.target.value))}
                className="text-[10px] sm:text-[10.5px] font-mono tracking-tight px-1.5 py-1 rounded border outline-none bg-transparent cursor-pointer max-w-[90px] sm:max-w-none truncate"
                style={{ color: T.textMain, borderColor: T.line }}
              >
                {PIANO_TRACKS.map((trk, i) => (
                  <option key={trk.id} value={i} className="bg-stone-900 text-white">
                    🎹 {trk.title.slice(0, 14)}...
                  </option>
                ))}
              </select>

              <button 
                onClick={cycleVolume}
                title="피아노 볼륨 조절"
                className="text-[10px] font-mono px-2 py-1 rounded border hover:opacity-80 transition-all cursor-pointer"
                style={{ color: T.textSub, borderColor: T.line }}
              >
                {volumePercent}%
              </button>

              <button 
                onClick={isPlayingBgm ? pausePianoBgm : playPianoBgm}
                className="text-[11px] font-serif font-bold px-2 py-1 rounded border hover:opacity-80 transition-colors cursor-pointer"
                style={{ color: isPlayingBgm ? T.candle : T.textSub, borderColor: T.line }}
              >
                {isPlayingBgm ? '선율 ❚❚' : '선율 ▶'}
              </button>
            </div>
          </header>

          {/* 메인 묵상 스크롤 뷰포트 */}
          <main 
            id="meditation-scroll" 
            className={`flex-1 overflow-y-auto px-5 sm:px-10 py-5 flex flex-col justify-between w-full max-w-xl mx-auto hide-scrollbar ${
              transitionState === 'exit' ? 'meditation-fade-exit' : 'meditation-fade-enter'
            }`}
          >
            
            {/* ════════ I. 침묵과 정돈 (4-2-4 성경적 호흡 펄스) ════════ */}
            {stepIndex === 0 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-7 sm:space-y-9 w-full">
                
                {/* 침묵 시간 선택 버튼군 */}
                <div className="flex items-center gap-1.5 p-0.5 rounded-lg border text-[11px] font-mono" style={{ borderColor: T.line }}>
                  {[30, 60, 120].map(s => (
                    <button
                      key={s}
                      onClick={() => { setSilenceTargetTime(s); setSilenceTimer(s); }}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        silenceTargetTime === s ? 'bg-amber-600 text-white font-bold shadow-xs' : 'opacity-60'
                      }`}
                      style={{ color: silenceTargetTime === s ? '#FFFFFF' : T.textSub }}
                    >
                      {s}초
                    </button>
                  ))}
                </div>

                {/* 호흡 펄스 링 */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
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
                    <span className="text-[52px] sm:text-[62px] font-extralight tracking-tight font-serif tabular-nums leading-none" style={{ color: T.textMain }}>
                      {String(silenceTimer).padStart(2, '0')}
                    </span>
                    <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase opacity-50 mt-1" style={{ color: T.textSub }}>
                      Seconds
                    </span>
                  </div>
                </div>

                {/* 성경적 호흡 안내 */}
                <div className="space-y-2.5 max-w-sm">
                  <div className="inline-block px-3.5 py-1 rounded-full text-[11px] font-serif font-bold border" style={{ color: T.candle, borderColor: T.line, backgroundColor: T.cardBg }}>
                    {breathPhase === 'inhale' && '들숨 (4초) • 주님의 은혜와 성령의 평안을 채웁니다'}
                    {breathPhase === 'hold' && '머무름 (2초) • 주님의 임재 앞에 조용히 머뭅니다'}
                    {breathPhase === 'exhale' && '날숨 (4초) • 세상의 모든 염려와 욕심을 비워냅니다'}
                  </div>
                  
                  <p className="text-[13.5px] sm:text-[14.5px] leading-[2.2] font-serif break-keep font-normal opacity-90" style={{ color: T.textHighlight }}>
                    "잠잠히 하나님만 바라라 무릇 나의 소망이 그로부터 나오는도다"<br/>
                    <span className="text-[11.5px] opacity-60 font-mono">(시편 62:5)</span>
                  </p>
                </div>

                {/* 다음 단계 버튼 */}
                <button
                  onClick={handleAdvanceStep}
                  className="w-full py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest border transition-all cursor-pointer hover:opacity-80 active:scale-98"
                  style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                >
                  숨을 고르고 말씀 앞으로 나아갑니다 ➔
                </button>
              </div>
            )}

            {/* ════════ II. 말씀 직면 (원어 조명 & 성찰 질문) ════════ */}
            {stepIndex === 1 && (
              <div className="flex flex-col justify-center my-auto space-y-6 text-left w-full">
                
                <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.2em] uppercase font-bold opacity-75" style={{ color: T.textSub }}>
                    {scripture.title}
                  </span>
                  
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={speakScripture}
                      className="text-[11px] font-serif hover:opacity-60 transition-opacity cursor-pointer flex items-center gap-1 font-bold"
                      style={{ color: isTTSActive ? T.candle : T.textSub }}
                    >
                      <span>🔊</span> {isTTSActive ? '낭독 멈춤' : '말씀 듣기'}
                    </button>
                    <button 
                      onClick={pickRandomScripture}
                      className="text-[11px] font-serif hover:opacity-60 transition-opacity cursor-pointer font-bold"
                      style={{ color: T.textSub }}
                    >
                      새 말씀 ⟳
                    </button>
                  </div>
                </div>

                {/* 말씀 본문 */}
                <div className="space-y-3 pt-1">
                  <p className="text-[18px] sm:text-[21px] leading-[2.3] font-serif font-normal select-text break-keep text-left" style={{ color: T.textMain }}>
                    "{scripture.verseText}"
                  </p>

                  {scripture.reference && (
                    <div className="text-right">
                      <span className="text-[13px] font-serif italic opacity-80 font-bold" style={{ color: T.candle }}>
                        {scripture.reference}
                      </span>
                    </div>
                  )}
                </div>

                {/* 원어적 영적 조명 */}
                {scripture.originalInsight && (
                  <div className="p-3.5 rounded-xl text-[12px] font-serif leading-relaxed opacity-90 border" style={{ backgroundColor: T.cardBg, borderColor: T.cardBorder, color: T.textHighlight }}>
                    💡 <b className="text-amber-600 dark:text-amber-400">원문 영적 조명:</b> {scripture.originalInsight}
                  </div>
                )}

                {/* 묵상 성찰 질문 */}
                <div className="pt-4 border-t space-y-2 text-left" style={{ borderColor: T.line }}>
                  <span className="text-[11px] font-serif tracking-[0.2em] uppercase block font-bold opacity-70" style={{ color: T.textSub }}>
                    성찰을 위한 질문
                  </span>
                  <p className="text-[14px] leading-[2.1] font-serif break-keep font-medium" style={{ color: T.textHighlight }}>
                    {scripture.question}
                  </p>
                </div>

                {/* 다음 단계 버튼 */}
                <div className="pt-3">
                  <button
                    onClick={handleAdvanceStep}
                    className="w-full py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest border transition-all cursor-pointer hover:opacity-80 active:scale-98"
                    style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                  >
                    말씀을 품고 골방 기도로 들어갑니다 ➔
                  </button>
                </div>
              </div>
            )}

            {/* ════════ III. 골방 기도 (토설 ➔ 감사 ➔ 결단 & 하늘 보좌 상달) ════════ */}
            {stepIndex === 2 && (
              <div className="space-y-6 my-auto py-2 text-left w-full">
                {!isPrayerOffered ? (
                  <div className="space-y-6">
                    
                    {/* 상단 독대 타이머 */}
                    <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: T.line }}>
                      <span className="text-[11px] font-serif tracking-wider font-bold opacity-75" style={{ color: T.textSub }}>
                        주님과의 일대일 독대
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        독대 시간 {String(Math.floor(prayerTimerSec / 60)).padStart(2, '0')}:{String(prayerTimerSec % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {/* 1. 토설 */}
                    <div className="space-y-1.5">
                      <label className="text-[11.5px] font-serif font-bold tracking-wider block" style={{ color: T.candle }}>
                        1. 솔직한 토설 (나의 연약함, 죄, 감추어진 아픔)
                      </label>
                      <textarea
                        value={journal.confession}
                        onChange={e => setJournal({ ...journal, confession: e.target.value })}
                        onInput={autoResize}
                        placeholder="사람에게 하지 못한 말까지, 하나님 앞에 숨김없이 털어놓습니다..."
                        className="w-full bg-transparent outline-none text-[14.5px] leading-[2.1] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    {/* 2. 감사 */}
                    <div className="space-y-1.5">
                      <label className="text-[11.5px] font-serif font-bold tracking-wider block" style={{ color: T.candle }}>
                        2. 범사 감사 (그럼에도 부어주신 구원의 은혜)
                      </label>
                      <textarea
                        value={journal.thanksgiving}
                        onChange={e => setJournal({ ...journal, thanksgiving: e.target.value })}
                        onInput={autoResize}
                        placeholder="이 고난 중에도 나를 붙드시는 주님의 은혜를 고백합니다..."
                        className="w-full bg-transparent outline-none text-[14.5px] leading-[2.1] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    {/* 3. 결단 */}
                    <div className="space-y-1.5">
                      <label className="text-[11.5px] font-serif font-bold tracking-wider block" style={{ color: T.candle }}>
                        3. 순종 결단 (오늘 내가 십자가 지고 순종할 자리)
                      </label>
                      <textarea
                        value={journal.resolution}
                        onChange={e => setJournal({ ...journal, resolution: e.target.value })}
                        onInput={autoResize}
                        placeholder="오늘 가정과 일터에서 살아낼 믿음의 구체적 순종 하나..."
                        className="w-full bg-transparent outline-none text-[14.5px] leading-[2.1] font-serif resize-none overflow-hidden border-b pb-2 transition-colors placeholder:opacity-30"
                        style={{ color: T.textMain, borderColor: T.line }}
                      />
                    </div>

                    {/* 기도 봉헌 버튼 */}
                    <div className="pt-2">
                      <button
                        onClick={() => setIsPrayerOffered(true)}
                        className="w-full py-3.5 rounded-xl text-xs font-serif tracking-[0.2em] font-bold uppercase transition-all cursor-pointer border hover:opacity-85 active:scale-98 text-center"
                        style={{ backgroundColor: T.candle, borderColor: T.candle, color: '#FFFFFF' }}
                      >
                        주님께 기도를 올려드립니다 🕊️
                      </button>
                    </div>

                  </div>
                ) : (
                  /* 향연 승천 시각화 */
                  <div className="py-10 text-center space-y-6 animate-fade-in">
                    <div className="flex justify-center">
                      <span className="text-4xl" style={{ animation: 'incenseAscent 2.5s infinite ease-out' }}>
                        🕊️
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[20px] font-serif font-normal tracking-wide" style={{ color: T.textMain }}>
                        성도의 기도가 보좌에 상달되었습니다
                      </h4>
                      <p className="text-[13.5px] font-serif leading-[2.4] opacity-85" style={{ color: T.textHighlight }}>
                        "향연이 성도의 기도와 함께 천사의 손으로부터<br/>하나님 앞으로 올라가는지라"<br/>
                        <span className="text-[11.5px] opacity-60 font-mono font-bold">(요한계시록 8:4)</span>
                      </p>
                    </div>

                    <button
                      onClick={handleAdvanceStep}
                      className="px-8 py-3 rounded-xl text-xs font-serif font-bold tracking-widest border transition-all cursor-pointer hover:opacity-80 active:scale-98"
                      style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                    >
                      지체들을 품는 중보의 자리로 ➔
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════ IV. 중보의 연대 (지체들을 위한 손모음) ════════ */}
            {stepIndex === 3 && (
              <div className="flex flex-col justify-center my-auto space-y-8 text-center w-full">
                {prayers.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-[14.5px] font-serif leading-[2.3] opacity-80" style={{ color: T.textHighlight }}>
                      현재 등록된 공동체 중보기도 제목이 없습니다.<br/>
                      오늘 하루, 가족과 이웃, 교회를 위해 마음으로 기도해 주세요.
                    </p>
                    <button
                      onClick={handleAdvanceStep}
                      className="px-6 py-3 rounded-xl text-xs font-serif font-bold tracking-widest border transition-all cursor-pointer"
                      style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                    >
                      안식과 파송으로 나아갑니다 ➔
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-[11px] font-serif tracking-[0.25em] uppercase font-bold opacity-60" style={{ color: T.textSub }}>
                        {prayers[pIndex]?.sender_name || '지체'}의 기도제목 ({pIndex + 1}/{prayers.length})
                      </span>
                    </div>

                    <p className="text-[17px] sm:text-[20px] leading-[2.4] font-serif font-normal break-keep px-2" style={{ color: T.textMain }}>
                      "{prayers[pIndex]?.content}"
                    </p>

                    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto pt-2">
                      <button
                        onClick={() => {
                          const pid = prayers[pIndex].id;
                          setPrayedIds(prev => {
                            const n = new Set(prev);
                            n.has(pid) ? n.delete(pid) : n.add(pid);
                            return n;
                          });
                        }}
                        className="w-full py-3.5 text-[12px] font-serif tracking-[0.15em] font-bold uppercase transition-all cursor-pointer border rounded-xl hover:opacity-85 active:scale-98"
                        style={{ 
                          color: prayedIds.has(prayers[pIndex].id) ? T.candle : T.textMain,
                          borderColor: prayedIds.has(prayers[pIndex].id) ? T.candle : T.line,
                          backgroundColor: T.cardBg
                        }}
                      >
                        {prayedIds.has(prayers[pIndex].id) ? '✓ 기도를 올려드렸습니다' : '함께 손 모아 기도하기 🙏'}
                      </button>

                      <div className="flex justify-between items-center w-full px-2 text-[11px] font-serif opacity-70" style={{ color: T.textSub }}>
                        <button
                          disabled={pIndex === 0}
                          onClick={() => setPIndex(p => p - 1)}
                          className={`uppercase tracking-wider cursor-pointer hover:opacity-100 font-bold ${pIndex === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                        >
                          ◀ 이전
                        </button>
                        <span className="font-mono tracking-widest font-bold">
                          중보 {pIndex + 1} / {prayers.length}
                        </span>
                        <button
                          disabled={pIndex === prayers.length - 1}
                          onClick={() => setPIndex(p => p + 1)}
                          className={`uppercase tracking-wider cursor-pointer hover:opacity-100 font-bold ${pIndex === prayers.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                        >
                          다음 ▶
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAdvanceStep}
                        className="w-full py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest border transition-all cursor-pointer hover:opacity-80 active:scale-98"
                        style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                      >
                        안식과 파송의 자리로 나아갑니다 ➔
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ════════ V. 안식과 파송 (축복의 파송 & 다음 사역 직결) ════════ */}
            {stepIndex === 4 && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-6 animate-fade-in w-full">
                <span className="text-[10px] font-mono tracking-[0.35em] uppercase font-bold opacity-60" style={{ color: T.textSub }}>
                  AARONIC BENEDICTION
                </span>
                
                <h2 className="text-[23px] sm:text-[26px] font-serif font-normal tracking-wide" style={{ color: T.textMain }}>
                  삶의 예배 자리로 파송합니다
                </h2>
                
                <div className="space-y-3 max-w-sm">
                  <p className="text-[14px] leading-[2.5] font-serif break-keep font-light opacity-85" style={{ color: T.textHighlight }}>
                    "여호와는 네게 복을 주시고 너를 지키시기를 원하며<br/>
                    여호와는 그의 얼굴을 네게 비추사 은혜 베푸시기를 원하며<br/>
                    여호와는 그 얼굴을 네게로 향하여 드사 평강 주시기를 원하노라"<br/>
                    <span className="text-[11.5px] opacity-60 font-mono font-bold">(민수기 6:24-26)</span>
                  </p>

                  <p className="text-[12.5px] font-serif pt-1 opacity-70" style={{ color: T.textSub }}>
                    오늘 골방에서 주님과 맺은 언약이<br/>
                    가정과 일터에서 거룩한 열매로 맺히길 축복합니다.
                  </p>
                </div>

                {/* 파송 후 직결 네비게이션 버튼군 */}
                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
                  <button
                    onClick={() => fadeOutAndExit('qt')}
                    className="flex-1 py-3 px-4 rounded-xl text-[12px] font-serif font-bold border hover:opacity-85 transition-all cursor-pointer shadow-xs"
                    style={{ backgroundColor: T.cardBg, borderColor: T.line, color: T.textMain }}
                  >
                    🌿 오늘 QT 작성하기
                  </button>
                  <button
                    onClick={() => fadeOutAndExit('home')}
                    className="flex-1 py-3 px-4 rounded-xl text-[12px] font-serif font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs"
                    style={{ backgroundColor: T.candle, color: '#FFFFFF' }}
                  >
                    🏠 세상 속으로 (홈)
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* 하단 진행 안내 푸터 */}
          <footer className="shrink-0 pb-5 pt-1 flex flex-col items-center">
            <span className="text-[10px] font-serif tracking-[0.25em] uppercase opacity-40 font-bold" style={{ color: T.textSub }}>
              {stepIndex < STEPS.length - 1 ? `STEP ${stepIndex + 1} OF 5` : 'PILGRIMAGE COMPLETED'}
            </span>
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)', width: '100%' }} />
          </footer>

        </div>
      )}
    </>
  );
}
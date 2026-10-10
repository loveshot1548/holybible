// src/pages/InterlinearKids.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BIBLE_66_BOOKS, cleanTypography } from './Interlinear';
import { supabase } from '../lib/supabase';

let activeUtterance = null;
let cachedMasterStrongs = null;

// =====================================================================
// 🎵 1. Web Audio API 사운드 신시사이저 (자체 합성)
// =====================================================================
const playSfx = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'stamp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'train') {
      [440, 554.37].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      });
    } else if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.3);
      });
    } else if (type === 'dice') {
      [300, 450, 600, 750].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.1);
      });
    }
  } catch (_) {}
};

// =====================================================================
// 🐂 2. 고대 히브리어 22개 자음 상형문자 마스터 사전
// =====================================================================
const MASTER_PICTOGRAPHS = {
  'א': { emoji: '🐂', name: '알레프', title: '힘센 황소 머리', meaning: '가장 힘센 분, 온 우주의 대장 하나님' },
  'ב': { emoji: '⛺', name: '베트', title: '아늑한 텐트 집', meaning: '가정, 안식처, 하나님의 따뜻한 집' },
  'ג': { emoji: '🐪', name: '기멜', title: '걸어가는 낙타 발', meaning: '걸어가다, 은혜를 베풀고 나누어주다' },
  'ד': { emoji: '🚪', name: '달렛', title: '열려 있는 문', meaning: '출입문, 겸손하게 들어감, 바른 길' },
  'ה': { emoji: '🙌', name: '헤', title: '두 손 번쩍 든 사람', meaning: '바라보다, 하나님의 생명의 숨결, 은혜' },
  'ו': { emoji: '🪝', name: '와우', title: '텐트 고정 갈고리', meaning: '연결하다, 사랑으로 묶어주다, 그리고' },
  'ז': { emoji: '⚔️', name: '자인데', title: '곡식 베는 낫', meaning: '영적 무기, 맛있는 양식, 기억하다' },
  'ח': { emoji: '🧱', name: '헤트', title: '단단한 울타리', meaning: '안전한 보호, 비밀스러운 아늑한 방' },
  'ט': { emoji: '🧺', name: '테트', title: '돌돌 감긴 바구니', meaning: '착하고 선함, 감추어진 보물' },
  'י': { emoji: '✋', name: '요드', title: '일하는 손과 팔', meaning: '하나님의 능력의 손길, 행동하다' },
  'כ': { emoji: '🤲', name: '카프', title: '오목한 손바닥', meaning: '덮어주다, 축복하다, 꼭 안아주다' },
  'ך': { emoji: '🤲', name: '카프', title: '오목한 손바닥', meaning: '덮어주다, 축복하다, 꼭 안아주다' },
  'ל': { emoji: '🦯', name: '라메드', title: '목자의 지팡이', meaning: '바른 길 인도, 사랑으로 가르치다' },
  'מ': { emoji: '🌊', name: '멤', title: '출렁이는 거대한 파도', meaning: '시원한 생명수, 거대한 힘과 은혜' },
  'ם': { emoji: '🌊', name: '멤', title: '출렁이는 거대한 파도', meaning: '시원한 생명수, 거대한 은혜' },
  'נ': { emoji: '🌱', name: '눈', title: '생명의 씨앗', meaning: '자라나는 생명, 대를 잇는 축복' },
  'ן': { emoji: '🌱', name: '눈', title: '생명의 씨앗', meaning: '자라나는 생명, 축복' },
  'ס': { emoji: '🪵', name: '사멕', title: '받쳐주는 든든한 기둥', meaning: '쓰러지지 않게 꽉 붙들어 주심' },
  'ע': { emoji: '👁️', name: '아인', title: '초롱초롱한 눈동자', meaning: '똑똑히 보다, 깊이 이해하고 사랑하다' },
  'פ': { emoji: '👄', name: '페', title: '말하는 입술', meaning: '말씀 선포, 기쁨의 찬양, 호흡' },
  'ף': { emoji: '👄', name: '페', title: '말하는 입술', meaning: '말씀 선포, 찬양, 호흡' },
  'צ': { emoji: '🎣', name: '차데', title: '물고기 낚는 바늘', meaning: '옳은 길, 의로움, 말씀 따라가기' },
  'ץ': { emoji: '🎣', name: '차데', title: '물고기 낚는 바늘', meaning: '옳은 길, 의로움' },
  'ק': { emoji: '🌅', name: '코프', title: '떠오르는 아침 해', meaning: '거룩함, 특별하게 구별된 아이' },
  'ר': { emoji: '👤', name: '레쉬', title: '당당한 사람의 머리', meaning: '최고, 대장, 가장 첫 번째' },
  'ש': { emoji: '🔥', name: '쉰', title: '타오르는 불꽃', meaning: '하나님의 거룩한 사랑의 불' },
  'ת': { emoji: '✝️', name: '타우', title: '언약의 십자가 표식', meaning: '약속의 완성, 확실한 구원의 도장' }
};

const GRAMMAR_OVERRIDES = {
  "H853":  { kor: "~을 / ~를", sound: "에트", emoji: "🎯", story: "하나님께서 콕 짚어 사랑하시는 대상을 가리켜요!" },
  "H854":  { kor: "~와 함께", sound: "에트", emoji: "🤝", story: "혼자가 아니라 하나님과 꼭 붙어 있다는 약속이에요!" },
  "H9001": { kor: "~에게 / ~로", sound: "레", emoji: "🦯", story: "목자님의 지팡이를 따라 한 걸음씩 나아가는 방향이에요." },
  "H9002": { kor: "~안에 / ~로", sound: "베", emoji: "⛺", story: "아늑한 텐트 집 속에 쏙 들어가 머무는 모습을 뜻해요." },
  "H9003": { kor: "~처럼 / 같이", sound: "카", emoji: "🤲", story: "예수님의 사랑의 손길을 꼭 닮았다는 뜻이에요." },
  "H9005": { kor: "그리고 / 와", sound: "베", emoji: "🔗", story: "갈고리처럼 앞뒤 사건을 튼튼하게 착착 이어줘요!" },
  "H9008": { kor: "바로 그", sound: "하", emoji: "👈", story: "두 손을 번쩍 들고 '바로 그거예요!' 가리키는 글자예요." }
};

// 동적 미션 배열
const DYNAMIC_MISSION_ACTIONS = [
  "부모님 어깨를 10번 주물러 드리며 '사랑해요' 고백하기",
  "오늘 먹은 밥그릇과 수저를 싱크대에 스스로 씩씩하게 가져다 놓기",
  "친구나 동생에게 내가 제일 아끼는 장난감을 웃으며 먼저 양보하기",
  "창밖의 파란 하늘을 바라보며 '하나님, 멋진 세상을 주셔서 감사해요' 외치기",
  "오늘 하루 친구의 단점을 놀리지 않고 좋은 점을 찾아 칭찬 한마디 건네기",
  "어지러워진 내 방 장난감과 책 3가지를 제자리에 깔끔하게 정리하기",
  "식사하기 전 두 손을 예쁘게 모으고 30초 동안 진심으로 감사 기도하기",
  "가족 중 한 명을 따뜻하게 꼭 안아주며 '예수님 안에서 축복해요' 속삭이기",
  "잠자리에 들기 전 오늘 하루 나를 지켜주신 하나님께 감사한 일 3가지 떠올리기",
  "화가 나거나 떼쓰고 싶을 때 심호흡 3번 하고 '예수님 도와주세요' 기도하기"
];

const DYNAMIC_MISSION_PRAYERS = [
  "하나님, 오늘 말씀처럼 착하고 정직한 마음으로 친구들을 사랑할래요. 예수님 이름으로 기도합니다. 아멘!",
  "빛으로 세상을 만드신 하나님, 제 마음에 어둠과 짜증이 올 때 환한 미소를 선물해 주세요. 아멘!",
  "언제나 나와 함께하시는 하나님, 두려운 일이 생겨도 주님 손 꼭 잡고 용기 내어 승리할래요. 아멘!",
  "우리 가족을 지켜주시는 하나님, 부모님 말씀에 기쁨으로 순종하는 멋진 자녀가 되게 해 주세요. 아멘!",
  "저를 세상에서 가장 특별하게 지어주신 하나님, 평생 주님을 찬양하며 반짝반짝 빛나게 살래요. 아멘!"
];

export default function InterlinearKids({ isDarkMode, setActiveScreen }) {
  const [selectedBookIndex, setSelectedBookIndex] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.book) {
        const idx = BIBLE_66_BOOKS.findIndex(b => b.ko === jump.book || b.en === jump.book);
        if (idx !== -1) return idx;
      }
    } catch (_) {}
    return 0;
  });
  const [chapter, setChapter] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.chapter) return Number(jump.chapter);
    } catch (_) {}
    return 1;
  });
  const [verse, setVerse] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.verse) return Number(jump.verse);
    } catch (_) {}
    return 1;
  });

  const [words, setWords] = useState([]);
  const [masterDict, setMasterDict] = useState({});
  const [kidsChapterData, setKidsChapterData] = useState(null);
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [selectedWordCard, setSelectedWordCard] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 🎙️ 오디오 녹음
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🚂 한글 말씀 기차 퍼즐
  const [koreanPuzzlePool, setKoreanPuzzlePool] = useState([]);
  const [koreanPuzzleTrain, setKoreanPuzzleTrain] = useState([]);
  const [isTrainComplete, setIsTrainComplete] = useState(false);
  const [draggedToken, setDraggedToken] = useState(null);

  // ✍️ 칠판 및 크레파스
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [crayonColor, setCrayonColor] = useState('#854D0E');

  // 🎨 내가 그리는 말씀 그림판
  const bibleCanvasRef = useRef(null);
  const [isBibleDrawing, setIsBibleDrawing] = useState(false);
  const [bibleDrawColor, setBibleDrawColor] = useState('#15803D');
  const [savedBibleArtwork, setSavedBibleArtwork] = useState(null);

  // 🗺️ 여권 & 별
  const [stars, setStars] = useState(() => {
    try { return Number(localStorage.getItem('kids_explorer_stars') || 25); } catch (_) { return 25; }
  });
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [stickers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kids_stickers') || '["빛의 탐험가", "에덴동산 정원사", "노아의 비둘기"]'); } catch (_) { return ["빛의 탐험가"]; }
  });

  // 🎬 극장 모달
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [customVideoInput, setCustomVideoInput] = useState('');
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  // 퀴즈 & 동적 퀘스트
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [missionDiceSeed, setMissionDiceSeed] = useState(0);

  const currentBookMeta = BIBLE_66_BOOKS[selectedBookIndex] || BIBLE_66_BOOKS[0];
  const isOT = currentBookMeta.isOT;

  // 데이터 로드
  useEffect(() => {
    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});

    if (cachedMasterStrongs) {
      setMasterDict(cachedMasterStrongs);
    } else {
      fetch('/data/strongs_korean_master.json')
        .then(r => r.ok ? r.json() : {})
        .then(d => {
          cachedMasterStrongs = d || {};
          setMasterDict(d || {});
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch(`/data/kids_study_by_chapter/${currentBookMeta.ko}_${chapter}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setKidsChapterData(d);
        setSelectedQuizAnswer(null);
        setIsQuizCorrect(false);
        setMissionDone(false);
      })
      .catch(() => setKidsChapterData(null));
  }, [currentBookMeta.ko, chapter]);

  useEffect(() => {
    try {
      const key = `kids_art_${currentBookMeta.ko}_${chapter}_${verse}`;
      const saved = localStorage.getItem(key);
      setSavedBibleArtwork(saved || null);
    } catch (_) {}
  }, [currentBookMeta.ko, chapter, verse]);

  useEffect(() => {
    let isMounted = true;
    const fetchWords = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('interlinear_bible')
        .select('*')
        .eq('book', currentBookMeta.ko)
        .eq('chapter', chapter)
        .eq('verse', verse)
        .order('word_order', { ascending: true });

      if (isMounted && data) {
        setWords(data);
      }
    };
    fetchWords();
    setRecordedAudioUrl(null);
    return () => { isMounted = false; };
  }, [currentBookMeta.ko, chapter, verse]);

  const easyVerseText = useMemo(() => {
    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    return easyBibleDb[key] || `${currentBookMeta.ko} ${chapter}장 ${verse}절`;
  }, [currentBookMeta.ko, chapter, verse, easyBibleDb]);

  const koreanTokens = useMemo(() => {
    if (!easyVerseText) return [];
    const cleanText = easyVerseText.replace(/[.,!?()[\]]/g, '').trim();
    return cleanText.split(/\s+/).map((word, idx) => ({
      id: `token_${idx}`,
      text: word,
      targetOrder: idx
    }));
  }, [easyVerseText]);

  useEffect(() => {
    if (koreanTokens.length > 0) {
      const shuffled = [...koreanTokens].sort(() => Math.random() - 0.5);
      setKoreanPuzzlePool(shuffled);
      setKoreanPuzzleTrain([]);
      setIsTrainComplete(false);
    }
  }, [koreanTokens]);

  const currentDynamicMission = useMemo(() => {
    const combinedSeed = (chapter * 31 + verse * 7 + missionDiceSeed) % DYNAMIC_MISSION_ACTIONS.length;
    const prayerSeed = (chapter * 13 + verse * 5 + missionDiceSeed) % DYNAMIC_MISSION_PRAYERS.length;
    return {
      mission: kidsChapterData?.actionQuest?.mission && missionDiceSeed === 0 
        ? kidsChapterData.actionQuest.mission 
        : DYNAMIC_MISSION_ACTIONS[combinedSeed],
      prayer: kidsChapterData?.actionQuest?.prayer && missionDiceSeed === 0
        ? kidsChapterData.actionQuest.prayer
        : DYNAMIC_MISSION_PRAYERS[prayerSeed]
    };
  }, [chapter, verse, missionDiceSeed, kidsChapterData]);

  // TTS 낭독
  const handlePlayFullVerse = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    playSfx('pop');
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(easyVerseText);
      utter.lang = 'ko-KR';
      utter.rate = 0.88;
      utter.pitch = 1.05;

      utter.onstart = () => setIsPlayingAudio(true);
      utter.onend = () => {
        setIsPlayingAudio(false);
        activeUtterance = null;
      };
      utter.onerror = () => {
        setIsPlayingAudio(false);
        activeUtterance = null;
      };

      activeUtterance = utter;
      window.speechSynthesis.speak(utter);
    }, 60);
  };

  const playWordVoice = (sound, kor) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(`${sound}! 뜻은, ${kor}!`);
      utter.lang = 'ko-KR';
      utter.rate = 0.92;
      utter.pitch = 1.1;

      activeUtterance = utter;
      window.speechSynthesis.speak(utter);
    }, 40);
  };

  // 녹음기 토글
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        playSfx('stamp');
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        playSfx('pop');
      } catch (err) {
        alert("마이크 사용 권한을 켜주세요! 🎙️");
      }
    }
  };

  // 기차 검증
  const verifyTrainCompletion = (trainList, poolList) => {
    if (poolList.length === 0) {
      const isCorrect = trainList.every((t, i) => t.targetOrder === i);
      if (isCorrect) {
        setIsTrainComplete(true);
        playSfx('train');
        setTimeout(() => playSfx('correct'), 500);
        const nextStars = stars + 15;
        setStars(nextStars);
        try { localStorage.setItem('kids_explorer_stars', String(nextStars)); } catch (_) {}
      } else {
        alert("단어 순서가 조금 엉켰어요! 다시 맞춰볼까요? 🔄");
        setKoreanPuzzlePool([...koreanTokens].sort(() => Math.random() - 0.5));
        setKoreanPuzzleTrain([]);
      }
    }
  };

  const handleAttachTrainCar = (token) => {
    playSfx('pop');
    const newTrain = [...koreanPuzzleTrain, token];
    const newPool = koreanPuzzlePool.filter(p => p.id !== token.id);
    setKoreanPuzzleTrain(newTrain);
    setKoreanPuzzlePool(newPool);
    verifyTrainCompletion(newTrain, newPool);
  };

  const handleDetachTrainCar = (token) => {
    playSfx('pop');
    const newTrain = koreanPuzzleTrain.filter(t => t.id !== token.id);
    const newPool = [...koreanPuzzlePool, token];
    setKoreanPuzzleTrain(newTrain);
    setKoreanPuzzlePool(newPool);
    setIsTrainComplete(false);
  };

  const handleDragStart = (e, token) => {
    setDraggedToken(token);
    try { e.dataTransfer.setData('text/plain', token.id); } catch (_) {}
  };

  const handleDropOnTrainTrack = (e) => {
    e.preventDefault();
    if (!draggedToken) return;
    if (koreanPuzzleTrain.some(t => t.id === draggedToken.id)) return;
    handleAttachTrainCar(draggedToken);
    setDraggedToken(null);
  };

  const extractPictographLetters = (rawHebrew) => {
    if (!rawHebrew) return [];
    const consonants = rawHebrew.replace(/[\u0591-\u05C7]/g, '').split('');
    return consonants.map(c => MASTER_PICTOGRAPHS[c]).filter(Boolean);
  };

  const handleQuizChoice = (idx) => {
    setSelectedQuizAnswer(idx);
    if (kidsChapterData?.quiz && idx === kidsChapterData.quiz.correctIndex) {
      setIsQuizCorrect(true);
      playSfx('correct');
      const nextStars = stars + 5;
      setStars(nextStars);
      try { localStorage.setItem('kids_explorer_stars', String(nextStars)); } catch (_) {}
    } else {
      setIsQuizCorrect(false);
    }
  };

  // ✍️ 칠판 드로잉
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = crayonColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setIsStamped(false);
  };

  const handleApplyStamp = () => {
    setIsStamped(true);
    playSfx('stamp');
    const nextStars = stars + 5;
    setStars(nextStars);
    try { localStorage.setItem('kids_explorer_stars', String(nextStars)); } catch (_) {}
  };

  // 🎨 성경 그림판 드로잉
  const getBibleCanvasCoords = (e) => {
    const canvas = bibleCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startBibleDrawing = (e) => {
    const coords = getBibleCanvasCoords(e);
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsBibleDrawing(true);
  };

  const drawBible = (e) => {
    if (!isBibleDrawing) return;
    const coords = getBibleCanvasCoords(e);
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = bibleDrawColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopBibleDrawing = () => setIsBibleDrawing(false);
  const clearBibleCanvas = () => {
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveBibleArtwork = () => {
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const key = `kids_art_${currentBookMeta.ko}_${chapter}_${verse}`;
    try {
      localStorage.setItem(key, dataUrl);
      setSavedBibleArtwork(dataUrl);
      playSfx('stamp');
      alert(`🎉 [${currentBookMeta.ko} ${chapter}:${verse}] 말씀 그림이 내 성경에 보관되었습니다!`);
    } catch (_) {
      alert("그림 저장 용량이 초과되었습니다.");
    }
  };

  // 🎬 유튜브 영상 관리
  const currentVideoStorageKey = `kids_video_${currentBookMeta.ko}_${chapter}`;
  const savedVideoUrl = useMemo(() => {
    try { return localStorage.getItem(currentVideoStorageKey) || ''; } catch (_) { return ''; }
  }, [currentVideoStorageKey, showCinemaModal]);

  const extractYoutubeEmbedId = (urlOrId) => {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();
    const m = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : (clean.length === 11 ? clean : '');
  };

  const currentEmbedId = useMemo(() => {
    const customId = extractYoutubeEmbedId(savedVideoUrl);
    if (customId) return customId;
    return kidsChapterData?.youtubeVideoId || '9Hqvir-snmk';
  }, [savedVideoUrl, kidsChapterData]);

  const handleSaveCustomVideo = () => {
    const id = extractYoutubeEmbedId(customVideoInput);
    if (!id && customVideoInput.trim()) {
      alert("올바른 유튜브 링크를 입력해주세요!");
      return;
    }
    try {
      if (id) localStorage.setItem(currentVideoStorageKey, id);
      else localStorage.removeItem(currentVideoStorageKey);
      setIsEditingVideo(false);
      alert("영상 링크가 저장되었습니다! 🎬");
    } catch (_) {}
  };

  const handleReturnToAcademic = () => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: currentBookMeta.ko,
        chapter,
        verse
      }));
    } catch (_) {}
    setActiveScreen('interlinear');
  };

  const explorerLevel = Math.floor(stars / 10) + 1;
  const isDark = isDarkMode;

  // 🌿 코지 가든 테마 스타일 토큰
  const theme = {
    pageBg: isDark ? 'bg-[#0E131F]' : 'bg-[#FDFBF7]',
    textMain: isDark ? 'text-[#F8FAFC]' : 'text-[#1E293B]',
    textWood: isDark ? 'text-amber-300' : 'text-[#78350F]',
    textMuted: isDark ? 'text-slate-400' : 'text-[#64748B]',
    boardBg: isDark ? 'bg-[#182032] border-[#334155]' : 'bg-[#FFFDF9] border-[#B45309]/50 shadow-[0_4px_16px_rgba(120,53,15,0.08)]',
    cardWood: isDark ? 'bg-[#1C253B] border-[#334155]' : 'bg-[#FFFDF7] border-[#D97706]/40 shadow-xs',
    greenBtn: 'bg-[#15803D] hover:bg-[#166534] text-white shadow-sm',
    woodPill: isDark ? 'bg-amber-950/60 border-amber-800 text-amber-200' : 'bg-[#FEF3C7] border-[#F59E0B]/50 text-[#78350F]'
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-x-hidden select-none font-sans ${theme.pageBg} ${theme.textMain}`}>
      
      {/* ── 1. 헤더: 마을 입구 나무 팻말 바 ── */}
      <header className={`px-2.5 sm:px-4 py-2 border-b flex items-center justify-between z-20 shrink-0 ${
        isDark ? 'bg-[#131B2B] border-slate-800' : 'bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#FDE68A] border-[#D97706]/50 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => { playSfx('pop'); setActiveScreen('home'); }} className="text-2xl p-1 cursor-pointer hover:scale-110 shrink-0">
            🏡
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { playSfx('pop'); setShowPassportModal(true); }}
                className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#15803D] text-white shadow-2xs hover:bg-[#166534] shrink-0 cursor-pointer"
              >
                🗺️ 여권 Lv.{explorerLevel}
              </button>
              <span className={`text-[11px] font-black ${theme.textWood} font-mono shrink-0`}>
                ⭐ {stars}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-[#78350F] dark:text-amber-200 truncate flex items-center gap-1">
              <span>🌻</span> 어린이 성경 탐험관
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCustomVideoInput(savedVideoUrl || currentEmbedId);
              setShowCinemaModal(true);
            }}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#FB7185] hover:bg-[#F43F5E] text-white shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>🎬</span> 극장
          </button>
          
          {/* 🏛️ 예루살렘 타이쿤 입장 버튼 */}
<button
  type="button"
  onClick={() => { playSfx('train'); setActiveScreen('jerusalem_tycoon'); }}
  className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#B45309] hover:bg-[#78350F] text-white shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
>
  <span>🏛️</span> 도시 건설
</button>
 
          <button
            type="button"
            onClick={handleReturnToAcademic}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#15803D] hover:bg-[#166534] text-white shadow-xs active:scale-95 flex items-center gap-0.5 cursor-pointer"
          >
            <span>🎓</span> 어른용
          </button>
        </div>
      </header>

      {/* ── 2. 메인 스크롤 뷰포트 (모바일 전폭 px-1.5) ── */}
      <main className="flex-1 overflow-y-auto px-1.5 sm:px-3 py-2 pb-36 space-y-2.5 w-full hide-scrollbar text-left">
        
        {/* 네비게이터 카드 (나무 팻말 다이얼) */}
        <div className={`p-2 sm:p-2.5 rounded-[22px] border flex items-center justify-between gap-1 w-full ${theme.boardBg}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <select
              value={selectedBookIndex}
              onChange={(e) => { setSelectedBookIndex(Number(e.target.value)); setChapter(1); setVerse(1); }}
              className={`font-black text-sm sm:text-base bg-transparent outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {BIBLE_66_BOOKS.map((b, idx) => (
                <option key={b.ko} value={idx} className="text-black">{b.ko}</option>
              ))}
            </select>
            <select
              value={chapter}
              onChange={(e) => { setChapter(Number(e.target.value)); setVerse(1); }}
              className={`font-black text-sm sm:text-base bg-transparent outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {Array.from({ length: currentBookMeta.maxChap }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}장</option>)}
            </select>
            <select
              value={verse}
              onChange={(e) => setVerse(Number(e.target.value))}
              className={`font-black text-sm sm:text-base bg-transparent outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {Array.from({ length: 35 }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}절</option>)}
            </select>
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => { playSfx('pop'); setVerse(v => Math.max(1, v - 1)); }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs border ${theme.woodPill} cursor-pointer`}
            >
              ◀ 이전
            </button>
            <button
              onClick={() => { playSfx('pop'); setVerse(v => v + 1); }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs border ${theme.woodPill} cursor-pointer`}
            >
              다음 ▶
            </button>
          </div>
        </div>

        {/* 쉬운성경 본문존: 숲속 오두막 편지 보드 */}
        <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 relative w-full ${theme.boardBg}`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-xs font-black ${theme.textWood} font-mono flex items-center gap-1`}>
              <span>📜</span> {currentBookMeta.ko} {chapter}장 {verse}절 (쉬운성경)
            </span>
          </div>
          
          <p className="text-base sm:text-lg font-black leading-relaxed break-keep mb-3">
            {easyVerseText}
          </p>

          {/* 숲속 린넨 컨트롤 버튼 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-dashed border-amber-300/60 dark:border-slate-700">
            <button
              onClick={handlePlayFullVerse}
              className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-[#B45309] hover:bg-[#78350F] text-white'
              }`}
            >
              <span>{isPlayingAudio ? '⏹' : '🔊'}</span>
              <span>{isPlayingAudio ? '멈춤' : '선생님 낭독'}</span>
            </button>

            <button
              onClick={handleToggleRecord}
              className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                isRecording 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : theme.greenBtn
              }`}
            >
              <span>{isRecording ? '⏹' : '🎙️'}</span>
              <span>{isRecording ? '녹음 끝내기' : '내 목소리 녹음'}</span>
            </button>

            {recordedAudioUrl && (
              <button
                onClick={() => {
                  const audio = new Audio(recordedAudioUrl);
                  audio.play();
                  playSfx('pop');
                }}
                className="col-span-2 sm:col-span-1 py-2 px-3 rounded-2xl text-xs font-black bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <span>▶️</span> 내 낭독 듣기
              </button>
            )}
          </div>
        </div>

        {/* 🌟 [신규] 내가 그리는 말씀 그림판: 화원 스케치북 */}
        <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-2.5 w-full ${theme.boardBg}`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs sm:text-sm font-black ${theme.textWood} flex items-center gap-1`}>
              <span>🎨</span> 내가 그리는 말씀 화원 ({currentBookMeta.ko} {chapter}:{verse})
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSaveBibleArtwork}
                className={`px-2.5 py-1 rounded-xl text-xs font-black ${theme.greenBtn} cursor-pointer`}
              >
                💾 그림 저장!
              </button>
              <button
                type="button"
                onClick={clearBibleCanvas}
                className="px-2 py-1 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200 cursor-pointer"
              >
                지우기 ↺
              </button>
            </div>
          </div>

          <p className="text-[11.5px] font-bold text-stone-600 dark:text-stone-300">
            💡 오늘 말씀을 듣고 하나님이 만드신 아름다운 세상을 도화지에 자유롭게 그려보세요!
          </p>

          {/* 꽃잎 물감 팔레트 */}
          <div className="flex items-center gap-1.5 py-1 overflow-x-auto hide-scrollbar">
            <span className="text-[10.5px] font-black text-stone-500 shrink-0">물감:</span>
            {[
              { color: '#15803D', label: '풀잎' },
              { color: '#854D0E', label: '나무' },
              { color: '#D97706', label: '해바라기' },
              { color: '#FB7185', label: '벚꽃' },
              { color: '#0284C7', label: '하늘' },
              { color: '#7C3AED', label: '라벤더' },
              { color: '#1E293B', label: '흙돌' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => setBibleDrawColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-6 h-6 rounded-full shrink-0 transition-transform cursor-pointer ${
                  bibleDrawColor === c.color ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-80'
                }`}
                title={c.label}
              />
            ))}
          </div>

          {/* 도화지 캔버스 */}
          <div className="relative w-full h-44 rounded-2xl border-2 border-dashed border-[#D97706]/40 bg-[#FFFDF7] dark:bg-slate-900 overflow-hidden shadow-inner">
            <canvas
              ref={bibleCanvasRef}
              width={400}
              height={176}
              onMouseDown={startBibleDrawing}
              onMouseMove={drawBible}
              onMouseUp={stopBibleDrawing}
              onMouseLeave={stopBibleDrawing}
              onTouchStart={startBibleDrawing}
              onTouchMove={drawBible}
              onTouchEnd={stopBibleDrawing}
              className="w-full h-full cursor-crosshair relative z-10 touch-none"
            />
          </div>

          {savedBibleArtwork && (
            <div className="p-2.5 rounded-2xl bg-[#FEF3C7]/60 dark:bg-black/40 border border-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖼️</span>
                <div>
                  <span className={`text-xs font-black ${theme.textWood} block`}>내가 완성한 말씀 액자!</span>
                  <span className="text-[10px] text-stone-500">이 구절에 내 그림이 영구 보관되었어요.</span>
                </div>
              </div>
              <img src={savedBibleArtwork} alt="내 성경 그림" className="w-16 h-12 object-cover rounded-lg border border-amber-400 shadow-xs" />
            </div>
          )}
        </div>

        {/* 🌟 1. 조약돌 나무 블록 원어 카드 (차분하고 큼직한 가든 블록) */}
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-xs sm:text-sm font-black ${theme.textWood} flex items-center gap-1`}>
              <span>🌱</span> 원어 그림 돋보기 (카드를 누르면 소리와 그림 비밀이 열려요!)
            </h3>
            <span className="text-[10px] font-bold text-stone-400">TOUCH CARDS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full" dir={isOT ? 'rtl' : 'ltr'}>
            {words.map((w, idx) => {
              const sId = (w.strongs_id || '').trim();
              const origClean = w.original_word?.replace(/[\u0591-\u05C7]/g, '') || '';
              const gOverride = GRAMMAR_OVERRIDES[sId] || GRAMMAR_OVERRIDES[origClean];
              const mEntry = masterDict[sId] || {};

              let displayKor = gOverride?.kor || mEntry.korean || w.korean_trans;
              if (!displayKor || /^[a-zA-Z\s[\]/,-]+$/.test(displayKor) || displayKor === '말씀') {
                if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
                  displayKor = w.korean_trans;
                } else if (origClean === 'את' || origClean === 'אֵת') {
                  displayKor = '~을 / ~를';
                } else if (origClean.startsWith('ו')) {
                  displayKor = '그리고';
                } else if (origClean.startsWith('ה')) {
                  displayKor = '그 (바로 그)';
                } else {
                  displayKor = '성경 단어';
                }
              }

              let displaySound = gOverride?.sound;
              if (!displaySound) {
                if (mEntry.pron && /[가-힣]/.test(mEntry.pron)) {
                  displaySound = mEntry.pron.replace(/[[\]]/g, '');
                } else if (w.pronunciation && /[가-힣]/.test(w.pronunciation)) {
                  displaySound = w.pronunciation.replace(/[[\]]/g, '');
                } else {
                  displaySound = origClean;
                }
              }

              const displayEmoji = gOverride?.emoji || '📖';
              const isPrefix = Boolean(gOverride);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    playWordVoice(displaySound, displayKor);
                    setSelectedWordCard({ 
                      word: w, 
                      displayKor, 
                      displaySound, 
                      displayEmoji,
                      story: gOverride?.story || mEntry.desc?.slice(0, 130) || '성경에 기록된 소중한 하나님의 말씀이에요.',
                      pictoLetters: extractPictographLetters(w.original_word)
                    });
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between active:scale-95 min-h-[92px] ${
                    isPrefix 
                      ? (isDark ? 'bg-[#1F293D] border-emerald-800' : 'bg-[#F0FDF4] border-[#86EFAC] shadow-2xs') 
                      : theme.cardWood
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl sm:text-3xl font-black text-[#D97706] dark:text-amber-400 block leading-tight">
                      {cleanTypography(w.original_word, isOT, 'vowels')}
                    </span>
                    <span className="text-xs font-black text-[#15803D] dark:text-emerald-400 block mt-0.5" dir="ltr">
                      🗣️ [{displaySound}]
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-dashed border-amber-200 dark:border-slate-800 text-center" dir="ltr">
                    <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white flex items-center justify-center gap-1">
                      <span>{displayEmoji}</span>
                      <span className="truncate">{displayKor}</span>
                    </span>
                    <span className="text-[9px] font-black text-[#B45309] dark:text-amber-400 block mt-0.5">
                      ✨ 상형문자 비밀보기
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌟 2. 🚂 한글 말씀 기차 완성 챌린지 */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnTrainTrack}
          className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-2.5 w-full ${theme.boardBg}`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs sm:text-sm font-black ${theme.textWood} flex items-center gap-1.5`}>
              <span>🚂</span> 한글 말씀 기차 챌린지!
            </span>
            <span className="text-[10px] sm:text-xs font-black text-white bg-[#15803D] px-2.5 py-0.5 rounded-full">
              {isTrainComplete ? '🎉 칙칙폭폭 기차 출발! (+15⭐)' : '단어를 끌어다 기차에 태워요!'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FEF3C7]/50 dark:bg-black/50 border-2 border-dashed border-amber-400/80 min-h-[58px] flex flex-wrap gap-2 items-center">
            <span className="text-2xl shrink-0 animate-bounce">🚂💨</span>
            {koreanPuzzleTrain.length === 0 ? (
              <span className="text-xs sm:text-sm text-stone-500 font-bold">
                아래 흩어진 한글 단어들을 손가락으로 끌어오거나 눌러서 기차에 연결하세요! 🚃
              </span>
            ) : (
              koreanPuzzleTrain.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleDetachTrainCar(token)}
                  className="px-3 py-1.5 rounded-2xl bg-[#15803D] hover:bg-rose-500 text-white text-xs sm:text-sm font-black shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  title="터치하면 다시 내려가요"
                >
                  <span>🚃</span>
                  <span>{token.text}</span>
                  <span className="text-[10px] opacity-70">✕</span>
                </button>
              ))
            )}
            {isTrainComplete && <span className="text-2xl animate-pulse">🏁</span>}
          </div>

          {!isTrainComplete && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-black text-stone-500 block">
                🚉 출발 대기 중인 한글 칸들 (터치하거나 드래그하세요):
              </span>
              <div className="flex flex-wrap gap-2">
                {koreanPuzzlePool.map((token) => (
                  <div
                    key={token.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, token)}
                    onClick={() => handleAttachTrainCar(token)}
                    className="px-3.5 py-2 rounded-2xl bg-[#FFFDF7] dark:bg-slate-800 border-2 border-[#D97706]/70 text-[#78350F] dark:text-amber-200 text-xs sm:text-sm font-black shadow-xs hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing select-none"
                  >
                    🚃 {token.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🌟 3. 🦁 탐험대장 레오의 3줄 브리핑 */}
        {kidsChapterData?.threeLineSummary && (
          <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-1.5 w-full ${
            isDark ? 'bg-[#16221D] border-emerald-800' : 'bg-[#F0FDF4] border-[#86EFAC]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl p-1 bg-emerald-200 rounded-full">🦁</span>
              <div>
                <span className="text-xs sm:text-sm font-black text-[#14532D] dark:text-emerald-300 block">
                  탐험대장 레오의 3줄 브리핑!
                </span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                  {currentBookMeta.ko} {chapter}장 핵심 스토리
                </span>
              </div>
            </div>
            <div className="space-y-1 text-xs sm:text-sm font-black leading-relaxed text-[#14532D] dark:text-emerald-100 pl-1">
              {kidsChapterData.threeLineSummary.map((line, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 shrink-0">👉</span>
                  <span>{line}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 4. 🦉 지혜의 부엉이 박사님의 비밀 돋보기 */}
        {kidsChapterData?.realFact && (
          <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-1 w-full ${
            isDark ? 'bg-[#152332] border-sky-800' : 'bg-[#F0F9FF] border-[#7DD3FC]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl p-1 bg-sky-200 rounded-full">🦉</span>
              <span className="text-xs sm:text-sm font-black text-[#0C4A6E] dark:text-sky-300">
                {kidsChapterData.realFact.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#0C4A6E] dark:text-sky-100 font-bold pl-1">
              {kidsChapterData.realFact.description}
            </p>
          </div>
        )}

        {/* 🌟 5. 🐑 아기양 루루의 생각 쑥쑥 신앙 문답 */}
        {kidsChapterData?.catechismQnA && (
          <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-1.5 w-full ${
            isDark ? 'bg-[#211832] border-purple-800' : 'bg-[#FAF5FF] border-[#D8B4FE]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl p-1 bg-purple-200 rounded-full">🐑</span>
              <span className="text-xs sm:text-sm font-black text-[#581C87] dark:text-purple-300">
                아기양 루루의 호기심 문답 타임
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/90 dark:bg-black/30 border border-purple-200 space-y-1">
              <p className="text-xs sm:text-sm font-black text-[#581C87] dark:text-purple-200">
                Q. {kidsChapterData.catechismQnA.question}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-slate-300 font-bold">
                A. {kidsChapterData.catechismQnA.answer}
              </p>
            </div>
          </div>
        )}

        {/* 🌟 6. 3초 팡팡 말씀 퀴즈 */}
        {kidsChapterData?.quiz && (
          <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-2.5 w-full ${
            isDark ? 'bg-[#291E13] border-amber-800' : 'bg-[#FFFBEB] border-[#FCD34D]'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-black text-[#78350F] dark:text-amber-300 flex items-center gap-1">
                <span>🎮</span> 오늘의 3초 팡팡 퀴즈!
              </span>
              <span className="text-[10px] font-black text-white bg-[#D97706] px-2 py-0.5 rounded-full">
                {isQuizCorrect ? '🎉 정답 완성! (+5⭐)' : '정답을 맞춰보세요!'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-black text-[#78350F] dark:text-white">
              {kidsChapterData.quiz.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {kidsChapterData.quiz.options.map((opt, oIdx) => {
                const isSelected = selectedQuizAnswer === oIdx;
                const isThisCorrect = oIdx === kidsChapterData.quiz.correctIndex;

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleQuizChoice(oIdx)}
                    className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                      isSelected
                        ? isThisCorrect
                          ? 'bg-[#15803D] text-white border-[#166534] scale-102 shadow-md'
                          : 'bg-[#FB7185] text-white border-rose-600'
                        : 'bg-white dark:bg-slate-800 border-[#F59E0B]/50 text-[#78350F] dark:text-white hover:bg-amber-100 shadow-2xs'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {isQuizCorrect && (
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-[#14532D] text-xs font-black animate-fade-in border border-emerald-300">
                🌟 {kidsChapterData.quiz.praise}
              </div>
            )}
          </div>
        )}

        {/* 🌟 7. 실천 퀘스트 챌린지 */}
        {kidsChapterData?.actionQuest && (
          <div className={`p-3.5 sm:p-4 rounded-[26px] border-2 space-y-2 w-full ${
            isDark ? 'bg-[#2B171F] border-rose-800' : 'bg-[#FFF1F2] border-[#FDA4AF]'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-black text-[#9F1239] dark:text-rose-300 flex items-center gap-1">
                <span>🎯</span> 오늘의 실천 탐험 퀘스트
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('dice');
                    setMissionDiceSeed(s => s + 1);
                  }}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-black bg-[#F59E0B] text-white shadow-2xs cursor-pointer active:scale-95"
                >
                  🎲 다시 뽑기
                </button>
                <button
                  onClick={() => {
                    setMissionDone(!missionDone);
                    if (!missionDone) {
                      playSfx('correct');
                      const nextStars = stars + 10;
                      setStars(nextStars);
                      try { localStorage.setItem('kids_explorer_stars', String(nextStars)); } catch (_) {}
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                    missionDone ? 'bg-[#15803D] text-white' : 'bg-[#FB7185] text-white hover:bg-rose-500'
                  }`}
                >
                  {missionDone ? '🎉 완료! (+10⭐)' : '미션 도전!'}
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-black text-[#9F1239] dark:text-rose-100">
              👉 {currentDynamicMission.mission}
            </p>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200">
              <span className="text-[10px] font-black text-rose-800 block mb-0.5">함께 드리는 어린이 기도문</span>
              <p className="text-xs font-bold text-stone-700 dark:text-slate-300 italic">
                "{currentDynamicMission.prayer}"
              </p>
            </div>
          </div>
        )}

      </main>

      {/* ── 3. [화사한 햇살 도화지] 상형문자 분해 팝업 + 한글 점선 칠판 모달 ── */}
      {selectedWordCard && (
        <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className={`w-full max-w-md rounded-[32px] border-4 p-4 sm:p-5 shadow-2xl flex flex-col space-y-3 text-left max-h-[94vh] overflow-y-auto hide-scrollbar ${
            isDark ? 'bg-[#151D2D] border-slate-700 text-white' : 'bg-[#FFFDF9] border-[#B45309] text-stone-900'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-amber-200 dark:border-slate-800">
              <span className={`text-xs font-black ${theme.textWood} font-mono`}>
                {selectedWordCard.word.strongs_id} • 숲속 상형문자 비밀노트
              </span>
              <button onClick={() => setSelectedWordCard(null)} className="text-base font-black p-1 cursor-pointer">✕</button>
            </div>

            {/* 단어 메인 카드 */}
            <div className={`p-3.5 rounded-2xl border text-center relative ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#FEF3C7]/60 border-amber-300'
            }`}>
              <button
                type="button"
                onClick={() => playWordVoice(selectedWordCard.displaySound, selectedWordCard.displayKor)}
                className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full text-xs font-black cursor-pointer shadow-2xs ${theme.greenBtn}`}
              >
                🔊 소리듣기
              </button>
              <span className="text-4xl font-black text-[#D97706] dark:text-amber-400 block leading-tight">
                {cleanTypography(selectedWordCard.word.original_word, isOT, 'vowels')}
              </span>
              <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white mt-1 block">
                {selectedWordCard.displayEmoji} {selectedWordCard.displayKor}
              </span>
              <span className="text-xs font-mono font-black text-stone-500 dark:text-stone-300 block mt-0.5">
                소리: [{selectedWordCard.displaySound}]
              </span>
            </div>

            {/* 상형문자 자음 블록 */}
            {selectedWordCard.pictoLetters && selectedWordCard.pictoLetters.length > 0 && (
              <div className="space-y-1">
                <span className={`text-xs font-black ${theme.textWood} block`}>
                  🧩 글자를 이루는 고대 그림 조각들:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto hide-scrollbar">
                  {selectedWordCard.pictoLetters.map((p, pIdx) => (
                    <div key={pIdx} className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 flex items-center gap-2">
                      <span className="text-2xl shrink-0">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-black ${theme.textWood} block leading-tight`}>
                          {p.name} ({p.title})
                        </span>
                        <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 block truncate">
                          뜻: {p.meaning}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 그림 스토리 해설 */}
            <div className="p-2.5 rounded-2xl bg-[#FEF3C7]/40 dark:bg-slate-900 border border-amber-200 space-y-0.5">
              <span className={`font-black ${theme.textWood} block text-xs`}>
                🎨 그림으로 풀어보는 뜻
              </span>
              <p className="text-xs font-bold leading-relaxed text-stone-800 dark:text-slate-200">
                {selectedWordCard.story}
              </p>
            </div>

            {/* ✍️ 화사한 도화지 스케치북 칠판 & 한글 점선 쓰기 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-stone-600 dark:text-stone-400">
                  ✍️ 한글 단어 점선 따라쓰기:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleApplyStamp}
                    className="text-xs font-black text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg hover:bg-rose-200 cursor-pointer shadow-2xs"
                  >
                    도장 쾅! 💮
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs font-bold text-stone-400 hover:text-stone-700 underline cursor-pointer"
                  >
                    지우기 ↺
                  </button>
                </div>
              </div>

              {/* 🌟 화사하고 밝은 아이보리 햇살 도화지 */}
              <div className="relative w-full h-44 rounded-3xl border-4 border-[#D97706]/60 bg-[#FFFDF7] dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner">
                {/* 한글 단어 점선 가이드라인 글자 */}
                <span className="absolute text-5xl sm:text-6xl font-black text-amber-200/80 dark:text-slate-800 pointer-events-none select-none tracking-widest">
                  {selectedWordCard.displayKor}
                </span>

                {/* 100점 도장 */}
                {isStamped && (
                  <div className="absolute z-20 w-24 h-24 rounded-full border-4 border-rose-600 text-rose-600 flex flex-col items-center justify-center rotate-[-15deg] font-black text-xs bg-white/95 shadow-xl animate-bounce">
                    <span className="text-sm">참잘했어요</span>
                    <span className="text-lg font-mono font-black">100점! 💯</span>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={400}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair relative z-10 touch-none"
                />
              </div>
            </div>

            <button
              onClick={() => setSelectedWordCard(null)}
              className="w-full py-3 rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm cursor-pointer shadow-md active:scale-95 transition-all"
            >
              알겠어요! 닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 4. 🗺️ 여권 모달 ── */}
      {showPassportModal && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-[#1E293B] border-2 border-amber-400 p-5 shadow-2xl text-left text-white space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="text-sm font-black text-amber-300">어린이 성경 탐험 여권</h3>
                  <span className="text-[10px] text-slate-400">BIBLE PASSPORT</span>
                </div>
              </div>
              <button onClick={() => setShowPassportModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">탐험가 등급</span>
                <span className="text-base font-black text-amber-400">Lv.{explorerLevel} 에덴의 정원사</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">모은 별</span>
                <span className="text-base font-black text-amber-300 font-mono">⭐ {stars}개</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-200 block">내가 모은 성경 탐험 뱃지:</span>
              <div className="grid grid-cols-2 gap-2">
                {stickers.map((stk, sIdx) => (
                  <div key={sIdx} className="p-2.5 rounded-xl bg-slate-800 border border-amber-500/40 flex items-center gap-1.5">
                    <span className="text-xl">🎖️</span>
                    <span className="text-xs font-bold text-amber-200">{stk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowPassportModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md"
            >
              여권 닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 5. 🎬 성경 극장 모달 ── */}
      {showCinemaModal && (
        <div className="fixed inset-0 z-[1100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="w-full max-w-xl rounded-3xl bg-[#161B22] border border-rose-500/50 p-4 shadow-2xl flex flex-col space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🎬</span>
                <h3 className="text-sm font-black text-rose-400">
                  {currentBookMeta.ko} {chapter}장 어린이 성경 극장
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVideo(!isEditingVideo)}
                  className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30 hover:bg-amber-400/20 cursor-pointer"
                >
                  {isEditingVideo ? '닫기' : '✏️ 링크 수정'}
                </button>
                <button onClick={() => setShowCinemaModal(false)} className="text-stone-400 hover:text-white p-1 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {isEditingVideo && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-300 block">
                  원하는 유튜브 영상 주소(URL) 또는 11자리 영상 ID를 넣어주세요:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVideoInput}
                    onChange={(e) => setCustomVideoInput(e.target.value)}
                    placeholder="예: https://youtu.be/9Hqvir-snmk"
                    className="flex-1 bg-black/60 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomVideo}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            )}

            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
              <iframe
                title="어린이 성경 동화 극장"
                src={`https://www.youtube-nocookie.com/embed/${currentEmbedId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">
                💡 영상 재생이 안 될 때는 아래 링크를 눌러보세요:
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${currentEmbedId}`}
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 font-bold hover:underline shrink-0"
              >
                유튜브 앱에서 보기 ↗
              </a>
            </div>

            <button
              onClick={() => setShowCinemaModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
            >
              극장 닫고 말씀 탐험 계속하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect, useRef, useMemo } from 'react';

// =====================================================================
// 아이콘 컴포넌트
// =====================================================================
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="5" y="5" rx="3" ry="3"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// =====================================================================
// 1. 기존 40구절 말씀 데이터 100% 보존
// =====================================================================
const memoryVerses = [
  { id: 1, category: '말씀', num: '1', title: '하나님의 감동', ref: '딤후 3:16', text: '모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니' },
  { id: 2, category: '말씀', num: '2', title: '성령의 감동', ref: '벧후 1:21', text: '예언은 언제든지 사람의 뜻으로 낸 것이 아니요 오직 성령의 감동하심을 받은 사람들이 하나님께 받아 말한 것임이라' },
  { id: 3, category: '말씀', num: '3', title: '영원불변', ref: '벧전 1:24-25', text: '그러므로 모든 육체는 풀과 같고 그 모든 영광은 풀의 꽃과 같으니 풀은 마르고 꽃은 떨어지되 오직 주의 말씀은 세세토록 있도다 하였으니 너희에게 전한 복음이 곧 이 말씀이니라' },
  { id: 4, category: '말씀', num: '4', title: '능력', ref: '렘 23:29', text: '여호와의 말씀이니라 내 말이 불 같지 아니하냐 바위를 쳐서 부스러뜨리는 방망이 같지 아니하냐' },
  { id: 5, category: '말씀', num: '5', title: '거듭남', ref: '벧전 1:23', text: '너희가 거듭난 것은 썩어질 씨로 된 것이 아니요 썩지 아니할 씨로 된 것이니 살아 있고 항상 있는 하나님의 말씀으로 되었느니라' },
  { id: 6, category: '말씀', num: '6', title: '성장', ref: '벧전 2:2', text: '갓난 아기들 같이 순전하고 신령한 젖을 사모하라 이는 그로 말미암아 너희로 구원에 이르도록 자라게 하려 함이라' },
  { id: 7, category: '말씀', num: '7', title: '인도', ref: '시 119:105', text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다' },
  { id: 8, category: '말씀', num: '8', title: '회복', ref: '시 107:20', text: '그가 그의 말씀을 보내어 그들을 고치시고 위험한 지경에서 건지시는도다' },
  { id: 9, category: '말씀', num: '9', title: '기쁨과 즐거움', ref: '렘 15:16', text: '만군의 하나님 여호와시여 나는 주의 이름으로 일컬음을 받는 자라 내가 주의 말씀을 얻어 먹었사오니 주의 말씀은 내게 기쁨과 내 마음의 즐거움이오나' },
  { id: 10, category: '말씀', num: '10', title: '무기', ref: '히 4:12', text: '하나님의 말씀은 살아 있고 활력이 있어 좌우에 날선 어떤 검보다도 예리하여 혼과 영과 및 관절과 골수를 찔러 쪼개기까지 하며 또 마음의 생각과 뜻을 판단하나니' },
  { id: 11, category: '성령', num: '11', title: '거하심', ref: '고전 3:16', text: '너희는 너희가 하나님의 성전인 것과 하나님의 성령이 너희 안에 계시는 것을 알지 못하느냐' },
  { id: 12, category: '성령', num: '12', title: '그리스도의 영', ref: '롬 8:9', text: '만일 너희 속에 하나님의 영이 거하시면 너희가 육신에 있지 아니하고 영에 있나니 누구든지 그리스도의 영이 없으면 그리스도의 사람이 아니라' },
  { id: 13, category: '성령', num: '13', title: '알게하심', ref: '고전 2:12', text: '우리가 세상의 영을 받지 아니하고 오직 하나님으로부터 온 영을 받았으니 이는 우리로 하여금 하나님께서 우리에게 은혜로 주신 것들을 알게 하려 하심이라' },
  { id: 14, category: '성령', num: '14', title: '가르치고 생각나게 하심', ref: '요 14:26', text: '보혜사 곧 아버지께서 내 이름으로 보내실 성령 그가 너희에게 모든 것을 가르치고 내가 너희에게 말한 모든 것을 생각나게 하리라' },
  { id: 15, category: '성령', num: '15', title: '인도', ref: '롬 8:14', text: '무릇 하나님의 영으로 인도함을 받는 사람은 곧 하나님의 아들이라' },
  { id: 16, category: '성령', num: '16', title: '극복', ref: '갈 5:16', text: '내가 이르노니 너희는 성령을 따라 행하라 그리하면 육체의 욕심을 이루지 아니하리라' },
  { id: 17, category: '성령', num: '17', title: '권능', ref: '행 1:8', text: '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라' },
  { id: 18, category: '성령', num: '18', title: '강건함', ref: '엡 3:16', text: '그의 영광의 풍성함을 따라 그의 성령으로 말미암아 너희 속사람을 능력으로 강건하게 하시오며' },
  { id: 19, category: '성령', num: '19', title: '충만', ref: '엡 5:18', text: '술 취하지 말라 이는 방탕한 것이니 오직 성령으로 충만함을 받으라' },
  { id: 20, category: '성령', num: '20', title: '열매', ref: '갈 5:22-23', text: '오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니 이같은 것을 금지할 법이 없느니라' },
  { id: 21, category: '예수 그리스도', num: '1', title: '신성', ref: '요 1:1,14', text: '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라 말씀이 육신이 되어 우리 가운데 거하시매 우리가 그의 영광을 보니 아버지의 독생자의 영광이요 은혜와 진리가 충만하더라' },
  { id: 22, category: '예수 그리스도', num: '2', title: '인성', ref: '눅 2:52', text: '예수는 지혜와 키가 자라가며 하나님과 사람에게 더욱 사랑스러워 가시더라' },
  { id: 23, category: '예수 그리스도', num: '3', title: '독생자', ref: '요 1:18', text: '본래 하나님을 본 사람이 없으되 아버지 품 속에 있는 독생하신 하나님이 나타내셨느니라' },
  { id: 24, category: '예수 그리스도', num: '4', title: '구원자', ref: '행 4:12', text: '다른 이로써는 구원을 받을 수 없나니 천하 사람 중에 구원을 받을 만한 다른 이름을 우리에게 주신 일이 없음이라 하였더라' },
  { id: 25, category: '예수 그리스도', num: '5', title: '중보자', ref: '딤전 2:5', text: '하나님은 한 분이시요 또 하나님과 사람 사이에 중보자도 한 분이시니 곧 사람이신 그리스도 예수라' },
  { id: 26, category: '예수 그리스도', num: '6', title: '교회의 머리', ref: '골 1:18', text: '그는 몸인 교회의 머리시라 그가 근본이시요 죽은 자들 가운데서 먼저 나신 이시니 이는 친히 만물의 으뜸이 되려 하심이요' },
  { id: 27, category: '예수 그리스도', num: '7', title: '연합', ref: '요 15:5', text: '나는 포도나무요 너희는 가지라 그가 내 안에 내가 그 안에 거하면 사람이 열매를 많이 맺나니 나를 떠나서는 너희가 아무 것도 할 수 없음이라' },
  { id: 28, category: '예수 그리스도', num: '8', title: '재림', ref: '계 22:12-13', text: '보라 내가 속히 오리니 내가 줄 상이 내게 있어 각 사람에게 그가 행한 대로 갚아 주리라 나는 알파와 오메가요 처음과 마지막이요 시작과 마침이라' },
  { id: 29, category: '예수 그리스도', num: '9', title: '생명', ref: '요 6:35', text: '예수께서 이르시되 나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라' },
  { id: 30, category: '예수 그리스도', num: '10', title: '빛', ref: '요 8:12', text: '예수께서 또 말씀하여 이르시되 나는 세상의 빛이니 나를 따르는 자는 어둠에 다니지 아니하고 생명의 빛을 얻으리라' },
  { id: 31, category: '기도', num: '11', title: '응답', ref: '요 15:7', text: '너희가 내 안에 거하고 내 말이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라' },
  { id: 32, category: '기도', num: '12', title: '하나님의 뜻', ref: '요일 5:14-15', text: '그를 향하여 우리가 가진 바 담대함이 이것이니 그의 뜻대로 무엇을 구하면 들으심이라 우리가 무엇이든지 구하는 바를 들으시는 줄을 안즉 우리가 그에게 구한 그것을 얻은 줄을 또한 아느니라' },
  { id: 33, category: '기도', num: '13', title: '부르짖음', ref: '시 3:4', text: '내가 나의 목소리로 여호와께 부르짖으니 그의 성산에서 응답하시는도다' },
  { id: 34, category: '기도', num: '14', title: '응답과 분별', ref: '렘 33:3', text: '너는 내게 부르짖으라 내가 네게 응답하겠고 네가 알지 못하는 크고 은밀한 일을 네게 보이리라' },
  { id: 35, category: '기도', num: '15', title: '능력', ref: '엡 3:20', text: '우리 가운데서 역사하시는 능력대로 우리가 구하거나 생각하는 모든 것에 더 넘치도록 능히 하실 이에게' },
  { id: 36, category: '기도', num: '16', title: '회개', ref: '대하 7:14', text: '내 이름으로 일컫는 내 백성이 그들의 악한 길에서 떠나 스스로 낮추고 기도하여 내 얼굴을 찾으면 내가 하늘에서 듣고 그들의 죄를 사하고 그들의 땅을 고칠지라' },
  { id: 37, category: '기도', num: '17', title: '평강', ref: '빌 4:6-7', text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라' },
  { id: 38, category: '기도', num: '18', title: '지혜', ref: '약 1:5', text: '너희 중에 누구든지 지혜가 부족하거든 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라 그리하면 주시리라' },
  { id: 39, category: '기도', num: '19', title: '전도', ref: '골 4:3', text: '또한 우리를 위하여 기도하되 하나님이 전도할 문 전도할 문을 우리에게 열어 주사 그리스도의 비밀을 말하게 하시기를 구하라 내가 이 일 때문에 매임을 당하였노라' },
  { id: 40, category: '기도', num: '20', title: '중보', ref: '딤전 2:1-2', text: '그러므로 내가 첫째로 권하노니 모든 사람을 위하여 간구와 기도와 도고와 감사를 하되 임금들과 높은 지위에 있는 모든 사람을 위하여 하라 이는 우리가 모든 경건과 단정함으로 고요하고 평안한 생활을 하려 함이라' }
];

export default function MemoryFestivalBanner({ isDarkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState('리스트'); // 리스트 | 카드 | 암송 | 퀴즈 | 음성
  
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bibleFavs')) || []; } 
    catch { return []; }
  });
  
  useEffect(() => { 
    localStorage.setItem('bibleFavs', JSON.stringify(favorites)); 
  }, [favorites]);

  const currentVerse = memoryVerses[currentIndex] || memoryVerses[0];
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [memorizeLevel, setMemorizeLevel] = useState(0);
  const [quizData, setQuizData] = useState(null);

  // 음성 모드 상태
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    setIsFlipped(false);
    setMemorizeLevel(0);
    setVoiceState('idle');
    setAccuracy(null);
    setTranscript('');
    transcriptRef.current = '';
    
    if (mode === '퀴즈') {
      const words = currentVerse.text.split(' ').filter(w => w.length > 1);
      if (words.length > 0) {
        const targetWord = words[Math.floor(Math.random() * words.length)];
        const wrongOptions = [];
        while (wrongOptions.length < 3) {
          const randomVerse = memoryVerses[Math.floor(Math.random() * memoryVerses.length)];
          const randomWords = randomVerse.text.split(' ').filter(w => w.length > 1);
          const rw = randomWords[Math.floor(Math.random() * randomWords.length)];
          if (rw !== targetWord && !wrongOptions.includes(rw)) wrongOptions.push(rw);
        }
        const options = [targetWord, ...wrongOptions].sort(() => Math.random() - 0.5);
        setQuizData({ targetWord, options, result: null, parts: currentVerse.text.split(targetWord) });
      }
    }
  }, [currentIndex, mode, currentVerse.text]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNextInPart = () => {
    const categoryVerses = memoryVerses.filter(v => v.category === currentVerse.category);
    const currentCatIndex = categoryVerses.findIndex(v => v.id === currentVerse.id);
    const nextVerse = categoryVerses[(currentCatIndex + 1) % categoryVerses.length];
    setCurrentIndex(memoryVerses.findIndex(v => v.id === nextVerse.id));
  };

  const handlePrevInPart = () => {
    const categoryVerses = memoryVerses.filter(v => v.category === currentVerse.category);
    const currentCatIndex = categoryVerses.findIndex(v => v.id === currentVerse.id);
    const prevVerse = categoryVerses[(currentCatIndex - 1 + categoryVerses.length) % categoryVerses.length];
    setCurrentIndex(memoryVerses.findIndex(v => v.id === prevVerse.id));
  };

  const renderMemorizeText = (text, level) => {
    if (level === 0) return text;
    if (level === 2) return "______________________________________________________";
    return text.split(' ').map((word, i) => (
      i % 2 === 0 ? word : <span key={i} className="bg-amber-500/20 text-transparent rounded px-1 select-none">블라인드</span>
    )).reduce((prev, curr) => [prev, ' ', curr]);
  };

  const toggleRecording = () => {
    if (voiceState === 'recording') {
      recognitionRef.current?.stop();
      setVoiceState('done');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("현재 브라우저는 음성 인식을 지원하지 않습니다. (크롬 권장)");
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ko-KR';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = true;
    
    recognitionRef.current.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript; 
    };

    recognitionRef.current.onend = () => {
      setVoiceState('done');
      const originalWords = currentVerse.text.split(' ').filter(w => w.length > 0);
      const spokenFullText = (transcriptRef.current || '').replace(/[^가-힣0-9a-zA-Z\s]/g, '');
      
      if (spokenFullText.trim() === '') {
        setAccuracy(0);
        return;
      }

      let correctWords = 0;
      originalWords.forEach(word => {
        const cleanOrig = word.replace(/[^가-힣0-9a-zA-Z]/g, ''); 
        if (cleanOrig && spokenFullText.includes(cleanOrig)) {
          correctWords++;
        }
      });
      
      const score = Math.min(100, Math.round((correctWords / originalWords.length) * 100));
      setAccuracy(score);
    };

    setTranscript('');
    setAccuracy(null);
    transcriptRef.current = '';
    setVoiceState('recording');
    recognitionRef.current.start();
  };

  const groupedVerses = useMemo(() => {
    return memoryVerses.reduce((acc, verse) => {
      if(!acc[verse.category]) acc[verse.category] = [];
      acc[verse.category].push(verse);
      return acc;
    }, {});
  }, []);

  return (
    <>
      {/* 💡 [첨부 사진 스타일] 딥 우드 + 웜 앰버 네온사인 슬림 배너 바 */}
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full relative overflow-hidden rounded-2xl cursor-pointer p-3 sm:py-3.5 sm:px-4 flex items-center justify-between border transition-all hover:scale-[1.005] active:scale-[0.99] select-none"
        style={{
          background: 'linear-gradient(135deg, #1A1311 0%, #2A1C16 50%, #150F0D 100%)',
          borderColor: 'rgba(255, 170, 50, 0.35)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* 네온 백그라운드 앰버 글로우 */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

        {/* 좌측: 타이틀 & 네온 텍스트 */}
        <div className="flex items-center gap-3 relative z-10 min-w-0 pr-2">
          <div 
            className="px-2.5 py-1 rounded-lg flex items-center gap-1 font-black text-[11px] tracking-wider shrink-0 uppercase"
            style={{
              backgroundColor: 'rgba(255, 160, 40, 0.15)',
              border: '1px solid rgba(255, 180, 50, 0.6)',
              color: '#FFB84D',
              textShadow: '0 0 10px rgba(255, 184, 77, 0.8)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#FFB84D]" />
            GTC
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span 
                className="text-[13.5px] sm:text-[14.5px] font-black tracking-tight"
                style={{
                  color: '#FFE2B8',
                  textShadow: '0 0 14px rgba(255, 190, 100, 0.5)'
                }}
              >
                말씀 암송 페스티벌 40구절
              </span>
              <span className="text-[11px] font-bold text-amber-200/60 truncate hidden sm:inline">
                | {currentVerse.ref} ({currentVerse.title})
              </span>
            </div>
            <span className="text-[11px] text-amber-100/70 font-medium truncate mt-0.5">
              "{currentVerse.text.substring(0, 32)}..."
            </span>
          </div>
        </div>

        {/* 우측: 열기 버튼 */}
        <div className="relative z-10 shrink-0 flex items-center gap-1 text-[11px] font-black text-amber-400/90 pl-2">
          <span>열기</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      </div>

      {/* 💡 [통합 트레이닝 모달] 40구절 & 5대 모드 100% 탑재 */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none" onClick={() => setIsOpen(false)}>
          <div 
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[380px] h-[640px] max-h-[92vh] rounded-[28px] border shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #1A1412 0%, #100C0A 100%)',
              borderColor: 'rgba(255, 180, 50, 0.35)',
              boxShadow: '0 0 50px rgba(255, 150, 30, 0.2)'
            }}
          >
            {/* 상단 앰버 네온 글로우 */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

            {/* 헤더 바 */}
            <div className="px-4 py-3.5 border-b border-amber-500/20 flex justify-between items-center shrink-0 relative z-10">
              <div>
                <span className="text-[10px] font-black text-amber-300 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  좋은나무교회 Vol.6/7
                </span>
                <h2 className="text-[16px] font-black text-amber-100 tracking-tight mt-1">말씀 암기 트레이닝</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-amber-200/60 hover:text-white p-1 transition-colors cursor-pointer">
                <IconClose />
              </button>
            </div>

            {/* 5대 모드 탭 바 */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-amber-500/20 text-[12px] font-black text-amber-200/60 shrink-0 bg-black/30 relative z-10">
              {['리스트', '카드', '암송', '퀴즈', '음성'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setMode(m)}
                  className={`flex-1 min-w-[64px] py-2.5 text-center transition-all cursor-pointer ${
                    mode === m 
                      ? 'border-b-2 border-amber-400 text-amber-300 bg-amber-500/10' 
                      : 'hover:text-amber-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* 파트 선택 드롭다운 & 프로그레스 바 */}
            {mode !== '리스트' && (
              <div className="px-4 pt-3 pb-1 shrink-0 relative z-10">
                <div className="flex justify-between text-[11px] text-amber-200/60 font-bold items-center mb-1.5">
                  <span className="text-amber-300">{currentVerse.category} 파트</span>
                  <select 
                    value={currentVerse.id}
                    onChange={(e) => setCurrentIndex(memoryVerses.findIndex(v => v.id === Number(e.target.value)))}
                    className="bg-black/50 border border-amber-500/30 text-amber-200 text-[11px] rounded-lg px-2 py-1 outline-none font-bold cursor-pointer"
                  >
                    {Object.entries(groupedVerses).map(([cat, verses]) => (
                      <optgroup key={cat} label={cat} className="bg-[#1C1613] text-amber-200">
                        {verses.map(v => (
                          <option key={v.id} value={v.id}>{v.id}. {v.title}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-1 rounded-full transition-all duration-300" style={{ width: `${(currentVerse.id / memoryVerses.length) * 100}%` }}></div>
                </div>
              </div>
            )}

            {/* 본문 트레이닝 영역 */}
            <div className="flex-1 p-4 overflow-y-auto hide-scrollbar relative z-10">
              
              {/* 1. 리스트 모드 */}
              {mode === '리스트' && (
                <div className="space-y-4">
                  {Object.entries(groupedVerses).map(([category, verses]) => (
                    <div key={category}>
                      <h3 className="font-black text-amber-400 text-[12.5px] mb-2 pb-1 border-b border-amber-500/20">{category}</h3>
                      <div className="space-y-1.5">
                        {verses.map(v => {
                          const isFav = favorites.includes(v.id);
                          return (
                            <div 
                              key={v.id} 
                              onClick={() => {
                                setCurrentIndex(memoryVerses.findIndex(x => x.id === v.id));
                                setMode('카드'); 
                              }}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                currentVerse.id === v.id 
                                  ? 'bg-amber-500/20 border-amber-400 shadow-sm' 
                                  : 'bg-black/30 border-amber-500/10 hover:border-amber-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-black border border-amber-500/40">{v.id}</span>
                                <span className="font-bold text-amber-100 text-[13px] truncate">{v.title}</span>
                                <span className="text-[11px] text-amber-200/50 truncate">({v.ref})</span>
                              </div>
                              {isFav && <span className="text-amber-400 text-sm">★</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. 카드 모드 (3D 플립) */}
              {mode === '카드' && (
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="h-full min-h-[260px] bg-black/40 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-center items-center text-center cursor-pointer relative shadow-inner hover:border-amber-500/60 transition-all"
                >
                  <div className="absolute top-3 right-3 text-amber-300/60 text-[10.5px] font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    ↻ 터치해서 뒤집기
                  </div>
                  {!isFlipped ? (
                    <>
                      <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-black mb-3">
                        No. {currentVerse.id}
                      </div>
                      <h3 className="text-[22px] font-black text-amber-100 mb-1.5" style={{ textShadow: '0 0 12px rgba(255, 184, 77, 0.4)' }}>
                        {currentVerse.title}
                      </h3>
                      <p className="text-[14px] text-amber-400 font-bold">{currentVerse.ref}</p>
                    </>
                  ) : (
                    <p className="text-[15px] text-amber-100 leading-[1.8] font-bold break-keep">
                      "{currentVerse.text}"
                    </p>
                  )}
                </div>
              )}

              {/* 3. 암송 모드 (3단계 블라인드) */}
              {mode === '암송' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-black">No. {currentVerse.id}</span>
                    <span className="font-black text-amber-100 text-[13.5px]">{currentVerse.title} <span className="text-xs font-normal text-amber-200/60">({currentVerse.ref})</span></span>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-2xl p-4 border border-amber-500/20 text-[14px] font-bold leading-[2] text-amber-100 break-keep overflow-y-auto">
                    {renderMemorizeText(currentVerse.text, memorizeLevel)}
                  </div>
                  <div className="flex gap-1.5 mt-3 shrink-0">
                    <button onClick={() => setMemorizeLevel(0)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${memorizeLevel===0 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-amber-200/60'}`}>전체 보기</button>
                    <button onClick={() => setMemorizeLevel(1)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${memorizeLevel===1 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-amber-200/60'}`}>일부 숨김</button>
                    <button onClick={() => setMemorizeLevel(2)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${memorizeLevel===2 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-amber-200/60'}`}>완전 숨김</button>
                  </div>
                </div>
              )}

              {/* 4. 퀴즈 모드 (4지선다 빈칸 채우기) */}
              {mode === '퀴즈' && quizData && (
                <div className="h-full flex flex-col">
                  <div className="text-[11px] font-bold text-amber-300/70 mb-1.5">빈칸에 들어갈 알맞은 단어는?</div>
                  <div className="bg-black/40 rounded-2xl p-4 border border-amber-500/20 text-[13.5px] font-bold leading-[1.8] text-amber-100 break-keep mb-3 overflow-y-auto max-h-[160px]">
                    {quizData.parts[0]}
                    <span className={`inline-block px-2.5 py-0.5 mx-1 rounded text-white font-black transition-colors ${quizData.result === true ? 'bg-emerald-600' : quizData.result === false ? 'bg-rose-600' : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'}`}>
                      {quizData.result === true ? quizData.targetWord : ' [ ? ] '}
                    </span>
                    {quizData.parts[1]}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-auto shrink-0">
                    {quizData.options.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          if(opt === quizData.targetWord) setQuizData({...quizData, result: true});
                          else setQuizData({...quizData, result: false});
                        }}
                        disabled={quizData.result === true}
                        className="p-2.5 bg-white/5 border border-amber-500/30 rounded-xl font-bold text-[12.5px] text-amber-200 hover:border-amber-400 hover:text-amber-100 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {quizData.result !== null && (
                    <div className={`mt-2 text-center font-black text-[12.5px] ${quizData.result ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {quizData.result ? '🎉 정답입니다!' : '❌ 다시 시도해보세요.'}
                    </div>
                  )}
                </div>
              )}

              {/* 5. 음성 모드 (STT 인식 및 정확도 채점) */}
              {mode === '음성' && (
                <div className="h-full flex flex-col justify-center relative">
                  {voiceState === 'idle' && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-black mb-3">No. {currentVerse.id}</div>
                      <h3 className="text-[26px] font-black text-amber-100 mb-1 tracking-tight">{currentVerse.ref}</h3>
                      <p className="text-[12px] text-amber-200/50 font-medium mb-6">이 말씀코드를 보고 암송해보세요</p>
                      
                      <button onClick={toggleRecording} className="w-[72px] h-[72px] bg-gradient-to-tr from-amber-600 to-amber-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform border-4 border-amber-400/30 cursor-pointer">
                        <MicIcon />
                      </button>
                      <p className="mt-3 text-[11px] font-bold text-amber-300/70">버튼을 눌러 녹음 시작</p>
                    </div>
                  )}

                  {voiceState === 'recording' && (
                    <div className="flex flex-col flex-1 w-full relative">
                      <div className="text-center mb-3 mt-1">
                        <button onClick={toggleRecording} className="w-[60px] h-[60px] bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform animate-pulse mx-auto border-4 border-rose-400/30 cursor-pointer">
                          <StopIcon />
                        </button>
                        <p className="mt-2 text-[11px] font-bold text-rose-400">듣는 중... (누르면 채점)</p>
                      </div>
                      <div className="w-full bg-black/40 rounded-2xl p-3.5 border border-amber-500/30 h-[170px] overflow-y-auto text-[13.5px] leading-relaxed font-bold text-amber-200 shadow-inner break-keep">
                        {transcript || '여기에 말씀이 표시됩니다...'}
                      </div>
                    </div>
                  )}

                  {voiceState === 'done' && (
                    <div className="flex flex-col flex-1 w-full relative">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="font-black text-amber-100 text-[14px]">암송 결과</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black text-white shadow-sm ${accuracy >= 90 ? 'bg-emerald-600' : accuracy >= 70 ? 'bg-amber-600' : 'bg-rose-600'}`}>
                          정확도: {accuracy}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-black/40 rounded-xl p-3 border border-amber-500/20 h-[80px] overflow-y-auto text-[12.5px] leading-relaxed font-medium text-amber-200/80 mb-2.5 break-keep">
                        {transcript || '녹음된 음성이 없습니다.'}
                      </div>
                      
                      <div className="text-[12.5px] font-bold text-amber-100 border-t border-amber-500/20 pt-2 leading-relaxed break-keep flex-1 overflow-y-auto text-left">
                        <span className="text-amber-400 mr-1.5 block font-black text-[11px]">정답지:</span>
                        {currentVerse.text}
                      </div>
                      
                      <button onClick={() => setVoiceState('idle')} className="mt-2.5 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-[12px] w-full hover:bg-amber-500/30 transition-colors cursor-pointer">
                        ↻ 이 구절 다시 시도하기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 네비게이션 & 즐겨찾기 바 */}
            {mode !== '리스트' && (
              <div className="p-3 border-t border-amber-500/20 bg-black/40 flex justify-between items-center shrink-0 relative z-10">
                <button 
                  onClick={() => toggleFavorite(currentVerse.id)}
                  className="text-xl hover:scale-110 transition-transform cursor-pointer"
                  title="즐겨찾기"
                >
                  {favorites.includes(currentVerse.id) ? '⭐' : '☆'}
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrevInPart} 
                    className="bg-white/10 text-amber-200 hover:bg-white/20 px-3.5 py-2 rounded-xl text-[11.5px] font-black transition-all cursor-pointer"
                  >
                    ◀ 이전
                  </button>
                  <button 
                    onClick={handleNextInPart} 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black px-4 py-2 rounded-xl text-[11.5px] font-black shadow-md transition-all cursor-pointer"
                  >
                    다음 ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
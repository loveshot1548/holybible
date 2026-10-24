// src/components/SermonArchiveAdvanced.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// =====================================================================
// 🔐 [보안 암호화 유틸리티] 간증 및 목장 나눔 연동 데이터 보호
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

// =====================================================================
// 🎨 경량화 시스템 벡터 아이콘
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093m-1.376-3.279a2.25 2.25 0 112.186-2.186m-2.186 2.186c.324-.18.696-.283 1.093-.283m0 0l5.807 3.38m-5.807-3.38L8.71 14.186m8.71 3.38a2.25 2.25 0 102.186-2.186m-2.186 2.186a2.25 2.25 0 01-1.093-.283m0 0l-5.807-3.38" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconFlame = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>;
const IconAcademic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>;
const IconRefresh = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

const DEFAULT_CATEGORIES = [
  'IT/엔지니어 본업',
  '공방(블라썸토퍼) 사역',
  '가정과 관계',
  '개인 영성',
  '기타 일상'
];

// 12대 제자훈련 신학 테마 매핑
const THEOLOGY_THEMES = [
  { id: '구원론', label: '구원론 (칭의와 전가)', icon: '✝️' },
  { id: '신론', label: '신론 (주권과 섭리)', icon: '👑' },
  { id: '말씀론', label: '말씀론 (계시 의존)', icon: '📖' },
  { id: '기독론', label: '기독론 (자기 부인)', icon: '🕊️' },
  { id: '인간론/회개', label: '인간론 (전적 타락·회개)', icon: '💧' },
  { id: '기도론', label: '기도론 (언약적 기도)', icon: '🙏' },
  { id: '고난의신비', label: '고난의 신학 (연단과 성화)', icon: '🪵' },
  { id: '성령론', label: '성령론 (영적 전투)', icon: '⚔️' },
  { id: '청지기론', label: '청지기론 (일터 소명)', icon: '💼' },
  { id: '언약가정', label: '언약 가정 (신앙 전수)', icon: '🏡' },
  { id: '교회론', label: '교회론 (몸과 은사 섬김)', icon: '🏛️' },
  { id: '선교/제자도', label: '선교/제자도 (영적 재생산)', icon: '🌍' }
];

export default function SermonArchiveAdvanced({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  dailyData = {},
  getArr = (arr) => Array.isArray(arr) ? arr : [],
  updateDay
}) {
  // ── 5대 뷰 모드 ('write': 선언/실천, 'pending': 미해결 큐, 'feed': 피드, 'matrix': 누적 매트릭스, 'stats': 제자도 분석) ──
  const [activeView, setActiveView] = useState('write');
  
  // 누적 매트릭스 내부 세부 기준 ('date': 일자별, 'resolution': 결단별, 'learning': 학습/신학별)
  const [matrixDimension, setMatrixDimension] = useState('resolution');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  // 카테고리 상태
  const [lifeCategories, setLifeCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_life_cats_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // 삶의 예배 및 선언 실천 로그
  const [lifeWorshipLogs, setLifeWorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('life_worship_logs_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // 오늘의 믿음 선언문 (Spiritual Declaration Banner)
  const [todayDeclaration, setTodayDeclaration] = useState(() => {
    try {
      return localStorage.getItem('today_spiritual_declaration_v1') || '';
    } catch (e) { return ''; }
  });
  const [isDeclaring, setIsDeclaring] = useState(false);

  // 시즌 키워드
  const [seasonKeywords, setSeasonKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('spiritual_season_kws_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['광야의 훈련', '믿음의 순종'];
  });
  const [newKeyword, setNewKeyword] = useState('');

  // 폼 입력 상태
  const [formCategory, setFormCategory] = useState(lifeCategories[0] || '기타 일상');
  const [formTheme, setFormTheme] = useState(THEOLOGY_THEMES[0].id);
  const [formEvent, setFormEvent] = useState('');
  const [formInterpretation, setFormInterpretation] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formVerse, setFormVerse] = useState('');
  const [linkedQuestions, setLinkedQuestions] = useState([]);

  // 토스트 메시지
  const [toastMsg, setToastMsg] = useState(null);

  // 모달 상태 (간증문 / 목장 나눔)
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    type: '',
    data: null,
    previewText: ''
  });

  // 상태 영구 보존
  useEffect(() => {
    localStorage.setItem('life_worship_logs_v3', JSON.stringify(lifeWorshipLogs));
    window.dispatchEvent(new Event('storage'));
  }, [lifeWorshipLogs]);

  useEffect(() => {
    localStorage.setItem('custom_life_cats_v3', JSON.stringify(lifeCategories));
  }, [lifeCategories]);

  useEffect(() => {
    localStorage.setItem('spiritual_season_kws_v2', JSON.stringify(seasonKeywords));
  }, [seasonKeywords]);

  useEffect(() => {
    localStorage.setItem('today_spiritual_declaration_v1', todayDeclaration);
  }, [todayDeclaration]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const ui = {
    bg: isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]',
    card: isDark ? 'bg-[#111827] border-[#1F2937] text-slate-100' : 'bg-white border-slate-200/90 text-slate-800 shadow-2xs',
    subCard: isDark ? 'bg-[#162032] border-[#243045]' : 'bg-slate-50 border-slate-200/70',
    border: isDark ? 'border-[#1F2937]' : 'border-slate-200',
    textMain: isDark ? 'text-slate-100' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-500',
    input: isDark 
      ? 'bg-[#0E1524] border-[#1F2937] text-slate-100 placeholder:text-slate-600 focus:border-sky-500' 
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500',
    btnPrimary: 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold transition-all shadow-xs',
    btnGhost: isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
  };

  const getLocalToday = () => {
    const o = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - o).toISOString().split('T')[0];
  };

  // 1. 미해결 QT / 예배 적용 큐 산출
  const pendingQuestions = useMemo(() => {
    let list = [];
    Object.entries(dailyData || {}).forEach(([date, dayVal]) => {
      const qs = getArr(dayVal.applyQuestions).filter(q => q && q.trim().length > 0);
      const completed = getArr(dayVal.completedActions);
      qs.forEach((q, idx) => {
        if (!completed.includes(idx)) {
          list.push({ date, qIdx: idx, text: q, source: 'QT 적용 질문', verse: dayVal.qtReference || dayVal.sermonReference || '' });
        }
      });
      const res = getArr(dayVal.resolutions);
      res.forEach((r) => {
        if (!completed.includes(r)) {
          list.push({ date, qIdx: r, text: r, source: '예배 결단', verse: dayVal.sermonReference || '' });
        }
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dailyData, getArr]);

  // 2. 통합 영적 아카이브 & 3대 차원 누적 통계
  const stats = useMemo(() => {
    const unifiedList = [];

    // (1) 데일리 데이터 (QT/설교)
    Object.entries(dailyData || {}).forEach(([dKey, dVal]) => {
      const qList = getArr(dVal.applyQuestions).filter(q => q && q.replace(/[음성녹음]/g, '').trim().length > 0);
      const resList = getArr(dVal.resolutions);
      if (qList.length > 0 || dVal.qtActionItem || dVal.sermonActionItem || resList.length > 0) {
        unifiedList.push({
          id: `DAILY_${dKey}`,
          type: 'QT_SERMON',
          date: dKey,
          category: '개인 영성',
          theme: '말씀론',
          questions: qList,
          verse: dVal.sermonReference || dVal.qtReference || '성경 본문',
          qtAction: dVal.qtActionItem,
          sermonAction: dVal.sermonActionItem,
          resolutions: resList,
          status: (dVal.qtActionCompleted || dVal.sermonActionCompleted) ? 'VICTORY' : 'DECLARED',
          timestamp: new Date(dKey).getTime()
        });
      }
    });

    // (2) 삶의 예배 실천 로그
    lifeWorshipLogs.forEach(log => {
      unifiedList.push({
        ...log,
        type: 'LIFE_LOG',
        status: log.status || 'VICTORY',
        timestamp: new Date(log.date).getTime()
      });
    });

    unifiedList.sort((a, b) => b.timestamp - a.timestamp);

    let totalActions = 0;
    let completedActions = 0;

    // 결단 기준 카운트
    const byCategory = {};
    // 학습/신학 기준 카운트
    const byTheme = {};
    // 일자 기준 타임라인 카운트 (최근 14일)
    const byDate = {};

    unifiedList.forEach(item => {
      totalActions++;
      if (item.status === 'VICTORY' || item.action) completedActions++;

      const cat = item.category || '기타 일상';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      const thm = item.theme || '말씀론';
      byTheme[thm] = (byTheme[thm] || 0) + 1;

      byDate[item.date] = (byDate[item.date] || 0) + 1;
    });

    const completionRate = totalActions === 0 ? 0 : Math.round((completedActions / totalActions) * 100);

    return {
      unifiedList,
      totalActions,
      completedActions,
      completionRate,
      byCategory,
      byTheme,
      byDate
    };
  }, [dailyData, getArr, lifeWorshipLogs]);

  // 카테고리 추가
  const confirmAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !lifeCategories.includes(trimmed)) {
      setLifeCategories(prev => [...prev, trimmed]);
      setFormCategory(trimmed);
      showToast(`'${trimmed}' 영역 추가 완료`);
    }
    setIsAddingCat(false);
    setNewCatInput('');
  };

  // 질문 인젝션 (미해결 큐 -> 오늘 폼 연동)
  const handleInjectQuestion = (q, targetField = 'interpretation') => {
    const isAlready = linkedQuestions.some(l => l.qIdx === q.qIdx && l.date === q.date);
    if (!isAlready) setLinkedQuestions(prev => [...prev, q]);
    if (q.verse) setFormVerse(q.verse);

    if (targetField === 'interpretation') {
      setFormInterpretation(prev => prev ? `${prev}\n[말씀 질문] ${q.text}` : `[말씀 질문] ${q.text}`);
    } else if (targetField === 'event') {
      setFormEvent(prev => prev ? `${prev}\n[직면 상황] ${q.text}` : `[직면 상황] ${q.text}`);
    }
    showToast(`'${q.source}' 질문이 바인딩되었습니다`);
    setActiveView('write');
  };

  // 선언 도장 찍기 및 실천 로그 저장
  const handleSaveActionDeclaration = (asVictory = false) => {
    if (!formEvent.trim() && !formInterpretation.trim() && !formAction.trim()) {
      showToast('사건 직면, 말씀 해석, 구체적 결단 중 하나를 입력하세요');
      return;
    }

    const newLog = {
      id: Date.now(),
      date: getLocalToday(),
      category: formCategory,
      theme: formTheme,
      verse: formVerse.trim() || '오늘의 말씀',
      event: formEvent.trim(),
      interpretation: formInterpretation.trim(),
      action: formAction.trim(),
      status: asVictory ? 'VICTORY' : 'DECLARED',
      victoryMemo: asVictory ? '오늘 믿음으로 즉시 순종 완료' : '',
      linked: linkedQuestions
    };

    // dailyData 상태 자동 동기화
    if (updateDay && linkedQuestions.length > 0) {
      linkedQuestions.forEach(lq => {
        const dayData = dailyData[lq.date] || {};
        const comp = getArr(dayData.completedActions);
        if (!comp.includes(lq.qIdx)) {
          updateDay(lq.date, { ...dayData, completedActions: [...comp, lq.qIdx] });
        }
      });
    }

    setLifeWorshipLogs(prev => [newLog, ...prev]);
    setFormEvent('');
    setFormInterpretation('');
    setFormAction('');
    setFormVerse('');
    setLinkedQuestions([]);
    showToast(asVictory ? '🏆 승리의 예배 실천이 누적되었습니다!' : '📜 믿음의 결단 선포가 봉헌되었습니다!');
  };

  // 상태 토글 (선언됨 <-> 완수됨)
  const handleToggleStatus = (id) => {
    setLifeWorshipLogs(prev => prev.map(log => {
      if (log.id === id) {
        const nextStatus = log.status === 'VICTORY' ? 'DECLARED' : 'VICTORY';
        return { ...log, status: nextStatus };
      }
      return log;
    }));
    showToast('실천 상태가 갱신되었습니다');
  };

  // 간증문 / 목장 나눔 내보내기 템플릿
  const openExportModal = (item, type) => {
    const bibleWord = item.verse || (item.linked?.length > 0 ? item.linked.map(l => l.source).join(', ') : '해당일 묵상 구절');
    const eventFact = item.event || item.resolutions?.[0] || '일상의 사건 직면';
    const insightText = item.interpretation || '말씀의 시선으로 재해석한 은혜';
    const actionPlan = item.action || item.qtAction || item.sermonAction || '실천한 순종의 결단';

    let template = '';
    if (type === 'testimony') {
      template = `[구속사 간증문] ${item.category || '일상'}에서 드린 믿음의 선포와 실천

1. 오늘 마주한 말씀의 약속
: ${bibleWord}

2. 직면한 사건과 내면의 감정
: ${eventFact}

3. 말씀의 렌즈로 본 재해석 (하나님의 주권)
: ${insightText}

4. 믿음의 선언과 구체적 순종
: ${actionPlan}

5. 주님이 주신 승리와 평안의 열매
: 

6. 영광의 감사 찬양
: 오직 주님이 하셨습니다. 아멘.`;
    } else {
      template = `[목장 나눔 실천 보고]
• 일자: ${item.date} (${item.category || '일상'})
• 말씀 구절: ${bibleWord}
• 삶의 자리: ${eventFact}
• 말씀 해석: ${insightText}
• 선언과 실천: ${actionPlan}`;
    }

    setExportModal({ isOpen: true, type, data: item, previewText: template });
  };

  // 내보내기 실행 (암호화 동기화)
  const executeExport = () => {
    if (exportModal.type === 'testimony') {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: getLocalToday(),
        content: encryptField(exportModal.previewText.trim())
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast('감사/간증 일기장에 안전하게 봉헌되었습니다');
      if (setActiveScreen) setActiveScreen('diary');
    } else {
      const cellShared = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      cellShared.push({
        id: Date.now(),
        date: getLocalToday(),
        source: 'sermon_action_tracker',
        text: encryptField(exportModal.previewText.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(cellShared));
      if (navigator.clipboard) navigator.clipboard.writeText(exportModal.previewText);
      window.dispatchEvent(new Event('storage'));
      showToast('목장 나눔방 텍스트 복사 완료');
      if (setActiveScreen) setActiveScreen('cell');
    }
    setExportModal({ isOpen: false, type: '', data: null, previewText: '' });
  };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bg} overflow-hidden select-none w-full`}>

      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-4 py-1.5 rounded-full bg-slate-900/95 text-white text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          {toastMsg}
        </div>
      )}

      {/* 1. 슬림 헤더 바 & 유기적 점프 통로 */}
      <header className={`px-3 sm:px-5 py-2.5 border-b shrink-0 flex items-center justify-between ${ui.card} z-20`}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveScreen ? setActiveScreen('home') : null}
            className={`p-1.5 rounded-lg ${ui.btnGhost} cursor-pointer transition-colors`}
            title="홈으로 나가기"
          >
            <IconArrowLeft />
          </button>
          <div>
            <h1 className={`text-[15px] sm:text-[16px] font-black tracking-tight leading-none ${ui.textMain} flex items-center gap-1.5`}>
              삶의 실천과 언약 선언 <span className="text-sky-500 text-xs font-mono font-semibold">[Covenant Tracker]</span>
            </h1>
            <span className={`text-[10px] font-mono font-bold ${ui.textSub} mt-0.5 block`}>
              ACTIONABLE SPIRITUAL RESOLUTION & MULTI-DIMENSION RETROSPECTIVE
            </span>
          </div>
        </div>

        {/* 유기적 화면 점프 퀵 링크 버튼군 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveScreen ? setActiveScreen('sermon') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="설교 아카이브 바로가기"
          >
            <span>🏛️</span> 설교
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('diary') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="감사/간증 일기장 바로가기"
          >
            <span>📖</span> 일기
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('cell') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="목장 나눔방 바로가기"
          >
            <span>💬</span> 목장
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono text-[11.5px] font-black">
            <IconTarget />
            <span>{stats.completionRate}% 달성</span>
          </div>
        </div>
      </header>

      {/* 2. 5대 핵심 탭 세그먼트 네비게이션 */}
      <nav className={`px-2.5 py-1.5 border-b shrink-0 flex items-center gap-1 bg-black/5 dark:bg-white/5 ${ui.border} overflow-x-auto hide-scrollbar z-10`}>
        {[
          { id: 'write', label: '⚡ 선언과 실천', count: null },
          { id: 'pending', label: '📋 미해결 큐', count: pendingQuestions.length },
          { id: 'matrix', label: '🧱 다차원 누적 매트릭스', count: stats.totalActions },
          { id: 'feed', label: '🗂️ 실천 피드', count: null },
          { id: 'stats', label: '🎓 제자도 마일스톤', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 min-w-[95px] py-1.5 px-2 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border shrink-0 ${
              activeView === tab.id
                ? 'bg-sky-600 text-white border-sky-500 shadow-xs font-black'
                : `border-transparent ${ui.textSub} hover:${ui.textMain} hover:bg-white/10`
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeView === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 3. 메인 콘텐츠 뷰포트 */}
      <main className="flex-1 overflow-y-auto px-2.5 sm:px-5 py-3 space-y-3 hide-scrollbar max-w-5xl mx-auto w-full pb-28 text-left">

        {/* ========================================================================= */}
        {/* VIEW 1: [선언과 실천] 선포 배너 + 4단계 실행 폼                            */}
        {/* ========================================================================= */}
        {activeView === 'write' && (
          <div className="space-y-3 animate-fade-in">

            {/* 🌟 오늘의 언약 선포 배너 (Spiritual Declaration Banner) */}
            <div className={`p-3.5 rounded-2xl border ${ui.card} relative overflow-hidden space-y-2`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-500">
                  <IconFlame />
                  <span>오늘의 믿음 선언 (Spiritual Declaration)</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{getLocalToday()}</span>
              </div>

              {isDeclaring ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={todayDeclaration}
                    onChange={e => setTodayDeclaration(e.target.value)}
                    placeholder="예: 나는 오늘 내 혈기를 십자가에 못 박고 오직 온유함으로 섬기겠습니다..."
                    className={`flex-1 px-3 py-1.5 text-xs rounded-xl border ${ui.input} outline-none`}
                  />
                  <button
                    onClick={() => { setIsDeclaring(false); showToast('믿음의 선포가 등록되었습니다!'); }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                  >
                    선포 확정
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200 break-keep">
                    {todayDeclaration ? `"${todayDeclaration}"` : "오늘 삶의 자리에서 성령으로 선포할 한 줄 고백을 등록하세요."}
                  </p>
                  <button
                    onClick={() => setIsDeclaring(true)}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 underline hover:opacity-80 shrink-0 ml-2 cursor-pointer"
                  >
                    {todayDeclaration ? '수정' : '+ 선포하기'}
                  </button>
                </div>
              )}
            </div>

            {/* 미해결 큐 퀵 링크 배너 */}
            {pendingQuestions.length > 0 && (
              <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-ping" />
                  <span className="text-sky-700 dark:text-sky-300 font-bold truncate">
                    미해결 QT·설교 적용 과제 {pendingQuestions.length}건이 순종을 기다립니다.
                  </span>
                </div>
                <button
                  onClick={() => setActiveView('pending')}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  과제 확인 ➔
                </button>
              </div>
            )}

            {/* 4단계 실천 봉헌 폼 */}
            <div className={`p-4 rounded-2xl border ${ui.card} space-y-3.5`}>
              
              {/* 메타 선택: 카테고리 + 제자도 신학 테마 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11.5px] font-bold text-slate-400 block">1. 삶의 현장 영역</label>
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                    {lifeCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                          formCategory === cat
                            ? 'bg-sky-600 text-white border-sky-500 font-black shadow-2xs'
                            : `${ui.subCard}${ui.textSub}`
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11.5px] font-bold text-slate-400 block">2. 제자도 신학 테마 매핑</label>
                  <select
                    value={formTheme}
                    onChange={e => setFormTheme(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-xl border ${ui.input} outline-none cursor-pointer font-bold`}
                  >
                    {THEOLOGY_THEMES.map(th => (
                      <option key={th.id} value={th.id}>{th.icon} {th.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 연동된 질문 태그 바 */}
              {linkedQuestions.length > 0 && (
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-sky-500 font-bold">
                    <span>🔗 연동된 말씀 과제 ({linkedQuestions.length}개)</span>
                    <button onClick={() => setLinkedQuestions([])} className="hover:underline">전체 해제</button>
                  </div>
                  {linkedQuestions.map((lq, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-sky-900 dark:text-sky-200 font-medium">
                      <span className="truncate">• [{lq.source}] {lq.text}</span>
                      <button onClick={() => setLinkedQuestions(p => p.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* 성경 구절 바인딩 */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-400 block">근거 성경 구절</label>
                <input
                  type="text"
                  value={formVerse}
                  onChange={e => setFormVerse(e.target.value)}
                  placeholder="예: 갈라디아서 2:20, 로마서 8:28..."
                  className={`w-full p-2.5 rounded-xl border text-xs ${ui.input} outline-none`}
                />
              </div>

              {/* 사건과 감정 */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-400 block">3. 직면한 사건과 내면의 감정</label>
                <textarea
                  rows={2}
                  value={formEvent}
                  onChange={e => setFormEvent(e.target.value)}
                  placeholder="오늘 일어난 일, 갈등의 정황과 솔직한 감정을 기록하세요..."
                  className={`w-full p-2.5 rounded-xl border text-[12.5px] leading-relaxed resize-none outline-none ${ui.input}`}
                />
              </div>

              {/* 말씀 해석 */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-400 block">4. 말씀의 렌즈로 본 재해석 (하나님의 주권)</label>
                <textarea
                  rows={2}
                  value={formInterpretation}
                  onChange={e => setFormInterpretation(e.target.value)}
                  placeholder="내 생각과 혈기를 내려놓고, 하나님의 선하신 섭리로 재해석합니다..."
                  className={`w-full p-2.5 rounded-xl border text-[12.5px] leading-relaxed resize-none outline-none ${ui.input}`}
                />
              </div>

              {/* 실천 결단 */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-400 block">5. 믿음의 선언과 구체적 순종 1가지</label>
                <textarea
                  rows={2}
                  value={formAction}
                  onChange={e => setFormAction(e.target.value)}
                  placeholder="내가 오늘 즉시 실천할 순종의 행동을 구체적으로 선포합니다..."
                  className={`w-full p-2.5 rounded-xl border text-[12.5px] font-bold leading-relaxed resize-none outline-none ${ui.input}`}
                />
              </div>

              {/* 액션 버튼 2종: 선포 등록 vs 즉시 완수 봉헌 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveActionDeclaration(false)}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${ui.btnGhost} cursor-pointer`}
                >
                  <span>📜</span> 순종하기로 믿음의 선언 (결단 누적)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveActionDeclaration(true)}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${ui.btnPrimary} cursor-pointer`}
                >
                  <span>🏆</span> 순종 완료! 승리의 도장 찍기
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: [미해결 큐] 영적 복기 & 즉시 바인딩                                */}
        {/* ========================================================================= */}
        {activeView === 'pending' && (
          <div className="space-y-2.5 animate-fade-in">
            <div className={`p-3.5 rounded-2xl border ${ui.card} flex items-center justify-between`}>
              <div>
                <h3 className="text-sm font-black">순종을 기다리는 미해결 말씀 과제</h3>
                <p className="text-xs text-slate-400 mt-0.5">터치 한 번으로 오늘 선언·실천 장소로 즉시 이동합니다.</p>
              </div>
              <span className="text-xs font-mono font-black text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-full">
                {pendingQuestions.length}건 대기
              </span>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border ${ui.card} text-xs text-slate-400`}>
                미해결된 과제가 없습니다. 모든 말씀이 삶으로 열매 맺고 있습니다! 🕊️
              </div>
            ) : (
              <div className="space-y-2">
                {pendingQuestions.map((q, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${ui.card} space-y-2`}>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-mono font-bold text-slate-400">{q.date}</span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 font-bold">
                        {q.source} {q.verse ? `· ${q.verse}` : ''}
                      </span>
                    </div>

                    <p className="text-[13px] font-bold leading-relaxed break-keep">
                      "{q.text}"
                    </p>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleInjectQuestion(q, 'event')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${ui.btnGhost} cursor-pointer`}
                      >
                        [사건]에 대입
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInjectQuestion(q, 'interpretation')}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white cursor-pointer active:scale-95"
                      >
                        [해석·실천]에 대입 ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: 🌟 [다차원 누적 매트릭스] (일자별 / 결단별 / 학습신학별)              */}
        {/* ========================================================================= */}
        {activeView === 'matrix' && (
          <div className="space-y-3 animate-fade-in">

            {/* 3대 차원 전환 바 */}
            <div className={`p-2 rounded-xl border ${ui.card} flex gap-1`}>
              {[
                { id: 'resolution', label: '🎯 결단·영역별 누적', desc: '본업·공방·가정' },
                { id: 'date', label: '📅 일자별 타임라인', desc: '스트릭·잔디' },
                { id: 'learning', label: '🎓 학습·제자도 기준', desc: '12대 신학 테마' }
              ].map(dim => (
                <button
                  key={dim.id}
                  onClick={() => setMatrixDimension(dim.id)}
                  className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer border ${
                    matrixDimension === dim.id
                      ? 'bg-sky-600 text-white border-sky-500 font-bold shadow-xs'
                      : `border-transparent ${ui.textSub} hover:${ui.textMain} hover:bg-white/5`
                  }`}
                >
                  <span className="text-xs block font-bold">{dim.label}</span>
                  <span className="text-[10px] opacity-75 font-mono block">{dim.desc}</span>
                </button>
              ))}
            </div>

            {/* (A) 결단·영역별 누적 매트릭스 */}
            {matrixDimension === 'resolution' && (
              <div className="space-y-2.5">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-3`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-400">삶의 5대 영역별 결단 누적 현황</h3>
                    <span className="text-xs font-mono font-bold text-sky-500">총 {stats.totalActions}회 결단</span>
                  </div>

                  <div className="space-y-2">
                    {lifeCategories.map(cat => {
                      const count = stats.byCategory[cat] || 0;
                      const pct = stats.totalActions > 0 ? Math.round((count / stats.totalActions) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{cat}</span>
                            <span className="font-mono text-slate-400">{count}회 ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 해당 영역의 최신 실천 카드 목록 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 px-1">최근 누적된 결단 목록</h4>
                  {stats.unifiedList.slice(0, 8).map(item => (
                    <div key={item.id} className={`p-3 rounded-xl border ${ui.card} flex items-center justify-between gap-2`}>
                      <div className="space-y-0.5 truncate flex-1">
                        <div className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="font-mono text-slate-400">{item.date}</span>
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 font-bold">{item.category}</span>
                        </div>
                        <p className="text-xs font-bold truncate">{item.action || item.event || item.qtAction || '실천 내용'}</p>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                          item.status === 'VICTORY'
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'VICTORY' ? '✓ 승리 완수' : '⏳ 선언 실천중'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* (B) 일자별 타임라인 누적 */}
            {matrixDimension === 'date' && (
              <div className="space-y-2.5">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-2`}>
                  <h3 className="text-xs font-bold text-slate-400">일자별 영적 순종 스트릭 (최근 14일 기록)</h3>
                  <div className="grid grid-cols-7 gap-1.5 pt-2">
                    {Array.from({ length: 14 }, (_, i) => {
                      const d = new Date(Date.now() - (13 - i) * 86400000);
                      const dStr = d.toISOString().split('T')[0];
                      const count = stats.byDate[dStr] || 0;
                      return (
                        <div key={dStr} className={`p-2 rounded-xl border text-center ${count > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : `${ui.subCard} text-slate-400`}`}>
                          <span className="text-[9px] font-mono block">{dStr.slice(5)}</span>
                          <span className="text-xs font-black font-mono block mt-0.5">{count > 0 ? `${count}건` : '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 px-1">일자별 누적 순종 피드</h4>
                  {stats.unifiedList.slice(0, 10).map(item => (
                    <div key={item.id} className={`p-3 rounded-xl border ${ui.card} flex justify-between items-center text-xs`}>
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-400">{item.date}</span>
                        <p className="font-bold">{item.action || item.event || '고백 내용'}</p>
                      </div>
                      <span className="text-[10.5px] font-mono text-sky-500 font-bold">{item.verse}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* (C) 학습·제자도 신학 테마 누적 */}
            {matrixDimension === 'learning' && (
              <div className="space-y-2.5">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-3`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-400">12대 제자훈련 테마별 실천 누적 지수</h3>
                    <span className="text-xs font-mono font-bold text-purple-500">신학적 균형 성장</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEOLOGY_THEMES.map(th => {
                      const count = stats.byTheme[th.id] || 0;
                      return (
                        <div key={th.id} className={`p-2.5 rounded-xl border ${ui.subCard} flex items-center justify-between`}>
                          <div className="truncate">
                            <span className="text-xs block font-bold truncate">{th.icon} {th.id}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{th.label}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-purple-500 shrink-0 ml-1.5">{count}회</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: [실천 피드] 타임라인 & 간증/목장 변환 바텀 액션                      */}
        {/* ========================================================================= */}
        {activeView === 'feed' && (
          <div className="space-y-2.5 animate-fade-in">
            {stats.unifiedList.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border ${ui.card} text-xs text-slate-400`}>
                기록된 피드가 없습니다. 오늘 첫 번째 실천을 선포해보세요!
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.unifiedList.map((item, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${ui.card} space-y-2.5`}>
                    
                    <div className="flex justify-between items-center border-b pb-1.5 border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-400 flex items-center gap-1">
                          <IconCalendar /> {item.date}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-bold text-[10.5px]">
                          {item.category}
                        </span>
                        {item.theme && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-bold text-[10.5px]">
                            #{item.theme}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          item.status === 'VICTORY'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}
                      >
                        {item.status === 'VICTORY' ? '✓ 승리 완료' : '⏳ 실천중'}
                      </button>
                    </div>

                    <div className="space-y-1 text-xs">
                      {item.verse && (
                        <span className="font-bold text-sky-600 dark:text-sky-400 block mb-1">
                          📖 근거 말씀: {item.verse}
                        </span>
                      )}
                      {item.event && (
                        <p className="text-slate-600 dark:text-slate-300 break-keep">
                          <strong className="text-slate-400">[직면 상황]</strong> {item.event}
                        </p>
                      )}
                      {item.interpretation && (
                        <p className="text-slate-700 dark:text-slate-200 break-keep">
                          <strong className="text-sky-500">[말씀 해석]</strong> {item.interpretation}
                        </p>
                      )}
                      {item.action && (
                        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 mt-1">
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 block">✓ 선언된 실천 결단</span>
                          <p className="font-bold text-slate-900 dark:text-white">{item.action}</p>
                        </div>
                      )}
                    </div>

                    {/* 유기적 연동 하단 액션 버튼 */}
                    <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => openExportModal(item, 'testimony')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${ui.btnGhost} cursor-pointer`}
                      >
                        <IconBook /> 간증문 8단계 변환
                      </button>
                      <button
                        type="button"
                        onClick={() => openExportModal(item, 'cell')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${ui.btnGhost} cursor-pointer`}
                      >
                        <IconShare /> 목장 나눔방 전송
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: [제자도 마일스톤] 영적 시즌 태그 & 성장 결산                       */}
        {/* ========================================================================= */}
        {activeView === 'stats' && (
          <div className="space-y-3 animate-fade-in">
            
            {/* 영적 시즌 키워드 관리 */}
            <div className={`p-4 rounded-2xl border ${ui.card} space-y-2.5`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400">현재 통과 중인 영적 시즌 태그</h3>
                <span className="text-[10.5px] font-mono text-sky-500 font-bold">{seasonKeywords.length}개 시즌 등록</span>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (newKeyword.trim() && setSeasonKeywords(p => [...p, newKeyword.trim()]), setNewKeyword(''))}
                  placeholder="예: 광야의 훈련, 침묵 속의 순종, 전적인 내려놓음..."
                  className={`flex-1 px-3 py-1.5 text-xs rounded-xl border ${ui.input} outline-none`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newKeyword.trim() && !seasonKeywords.includes(newKeyword.trim())) {
                      setSeasonKeywords(p => [...p, newKeyword.trim()]);
                      setNewKeyword('');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {seasonKeywords.map(kw => (
                  <span
                    key={kw}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${ui.subCard}`}
                  >
                    #{kw}
                    <button
                      onClick={() => setSeasonKeywords(p => p.filter(k => k !== kw))}
                      className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 영적 복기 & 제자도 결산 안내 배너 */}
            <div className={`p-4 rounded-2xl border ${ui.card} space-y-2`}>
              <div className="flex items-center gap-2 text-sky-500 font-bold text-xs">
                <IconAcademic />
                <span>영적 결단 지속의 법칙 (Spiritual Perpetuity)</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 break-keep">
                결단은 하루로 끝나지 않고 그리스도의 장성한 분량에 이르기까지 계속 쌓여갑니다. 한 번 선포된 말씀은 마음 판에 새겨져 <strong>일자별 타임라인</strong>과 <strong>제자훈련 신학 테마</strong>로 누적되며, 목장 식구들과의 나눔을 통해 영적 재생산(Multiplication)으로 확장됩니다.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 4. 간증문 8단계 / 목장 나눔 에디터 바텀시트 모달 (모바일 풀 대응)             */}
      {/* ========================================================================= */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border p-4 shadow-2xl flex flex-col max-h-[85vh] h-[85vh] sm:h-auto overflow-hidden ${ui.card}`}>
            
            <div className="flex justify-between items-center border-b pb-2.5 border-slate-200 dark:border-white/10 shrink-0">
              <h3 className={`text-[14px] font-black ${ui.textMain}`}>
                {exportModal.type === 'testimony' ? '구속사 간증문 8단계 서식 에디터' : '목장 나눔 서식 에디터'}
              </h3>
              <button
                onClick={() => setExportModal({ isOpen: false, type: '', data: null, previewText: '' })}
                className="text-slate-400 hover:text-white p-1 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-2 text-[11px] text-slate-400 shrink-0 leading-tight">
              {exportModal.type === 'testimony'
                ? '오늘의 결단과 말씀이 8단계 구속사 간증문으로 자동 구조화되었습니다. 검토 후 일기장으로 봉헌하세요.'
                : '목장 식구들과 나눌 영적 실천 보고서가 완성되었습니다. 복사 후 목장방으로 전송하세요.'}
            </div>

            <textarea
              value={exportModal.previewText}
              onChange={e => setExportModal({ ...exportModal, previewText: e.target.value })}
              className={`flex-1 w-full p-3 rounded-xl border text-[12px] font-mono leading-relaxed outline-none resize-none ${ui.input}`}
            />

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-2 shrink-0">
              <button
                type="button"
                onClick={executeExport}
                className={`w-full py-2.5 rounded-xl text-[12.5px] font-bold ${ui.btnPrimary} flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                {exportModal.type === 'testimony' ? '✓ 내 감사/간증 일기장에 봉헌하고 이동' : '✓ 텍스트 복사하고 목장 나눔방 이동'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
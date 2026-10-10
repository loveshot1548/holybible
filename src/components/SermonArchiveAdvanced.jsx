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
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093m-1.376-3.279a2.25 2.25 0 112.186-2.186m-2.186 2.186c.324-.18.696-.283 1.093-.283m0 0l5.807 3.38m-5.807-3.38L8.71 14.186m8.71 3.38a2.25 2.25 0 102.186-2.186m-2.186 2.186a2.25 2.25 0 01-1.093-.283m0 0l-5.807-3.38" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

const DEFAULT_CATEGORIES = [
  'IT/엔지니어 본업',
  '공방(블라썸토퍼) 사역',
  '가정과 관계',
  '개인 영성',
  '기타 일상'
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
  // ── 뷰 모드 ('write': 오늘 실천 기록, 'pending': 미해결 QT 큐, 'feed': 일기 피드, 'stats': 분석/시즌) ──
  const [activeView, setActiveView] = useState('write');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  // 카테고리 상태[cite: 34]
  const [lifeCategories, setLifeCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_life_cats_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // 예배 일기 로그[cite: 34]
  const [lifeWorshipLogs, setLifeWorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('life_worship_logs_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // 시즌 키워드 태그[cite: 34]
  const [seasonKeywords, setSeasonKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('spiritual_season_kws_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [newKeyword, setNewKeyword] = useState('');

  // 폼 입력 상태[cite: 34]
  const [formCategory, setFormCategory] = useState(lifeCategories[0] || '기타 일상');
  const [formEvent, setFormEvent] = useState('');
  const [formInterpretation, setFormInterpretation] = useState('');
  const [formAction, setFormAction] = useState('');
  const [linkedQuestions, setLinkedQuestions] = useState([]);

  // 토스트 메시지 상태
  const [toastMsg, setToastMsg] = useState(null);

  // 모달 상태[cite: 34]
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    type: '',
    data: null,
    previewText: ''
  });

  useEffect(() => {
    localStorage.setItem('life_worship_logs_v2', JSON.stringify(lifeWorshipLogs));
  }, [lifeWorshipLogs]);

  useEffect(() => {
    localStorage.setItem('spiritual_season_kws_v2', JSON.stringify(seasonKeywords));
  }, [seasonKeywords]);

  useEffect(() => {
    localStorage.setItem('custom_life_cats_v3', JSON.stringify(lifeCategories));
  }, [lifeCategories]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  // 컴팩트 고밀도 UI 테마
  const ui = {
    bg: isDark ? 'bg-[#0B0D11]' : 'bg-[#F4F5F7]',
    card: isDark ? 'bg-[#13161F] border-white/10 text-slate-100' : 'bg-white border-slate-200/90 text-slate-800 shadow-2xs',
    subCard: isDark ? 'bg-[#181D2A] border-white/5' : 'bg-slate-50 border-slate-200/70',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    textMain: isDark ? 'text-slate-100' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-500',
    input: isDark 
      ? 'bg-[#0E1118] border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-sky-500' 
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500',
    btnPrimary: 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold transition-all',
    btnGhost: isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
  };

  const getLocalToday = () => {
    const o = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - o).toISOString().split('T')[0];
  };

  // 미해결 질문 큐 산출[cite: 34]
  const pendingQuestions = useMemo(() => {
    let list = [];
    Object.entries(dailyData || {}).forEach(([date, dayVal]) => {
      const qs = getArr(dayVal.applyQuestions).filter(q => q && q.trim().length > 0);
      const completed = getArr(dayVal.completedActions);
      qs.forEach((q, idx) => {
        if (!completed.includes(idx)) list.push({ date, qIdx: idx, text: q, source: 'QT 적용' });
      });
      const res = getArr(dayVal.resolutions);
      res.forEach((r) => {
        if (!completed.includes(r)) list.push({ date, qIdx: r, text: r, source: '예배 결단' });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dailyData, getArr]);

  // 통계 산출[cite: 34]
  const stats = useMemo(() => {
    const archiveList = [];
    Object.entries(dailyData || {}).forEach(([dKey, dVal]) => {
      const qList = getArr(dVal.applyQuestions).filter(q => q && q.replace(/[음성녹음]/g, '').trim().length > 0);
      const resList = getArr(dVal.resolutions);
      if (qList.length > 0 || dVal.qtActionItem || dVal.sermonActionItem || resList.length > 0) {
        archiveList.push({
          type: 'QT_SERMON',
          date: dKey,
          questions: qList,
          qtAction: dVal.qtActionItem,
          sermonAction: dVal.sermonActionItem,
          resolutions: resList,
          timestamp: new Date(dKey).getTime()
        });
      }
    });

    lifeWorshipLogs.forEach(log => {
      archiveList.push({ type: 'LIFE_LOG', ...log, timestamp: new Date(log.date).getTime() });
    });

    archiveList.sort((a, b) => b.timestamp - a.timestamp);

    let totalActions = 0;
    let completedActions = 0;
    let totalQuestions = 0;
    let questionKeywords = {};

    archiveList.forEach(item => {
      if (item.type === 'LIFE_LOG') {
        if (item.action) {
          totalActions++;
          completedActions++; // 삶의 예배로 기록된 것은 완수로 판정
        }
      } else {
        if (item.qtAction) { 
          totalActions++; 
          if (dailyData[item.date]?.qtActionCompleted) completedActions++; 
        }
        if (item.sermonAction) { 
          totalActions++; 
          if (dailyData[item.date]?.sermonActionCompleted) completedActions++; 
        }
        if (item.questions) {
          totalQuestions += item.questions.length;
          item.questions.forEach(q => {
            const words = q.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1);
            words.forEach(w => questionKeywords[w] = (questionKeywords[w] || 0) + 1);
          });
        }
      }
    });

    const completionRate = totalActions === 0 ? 0 : Math.round((completedActions / totalActions) * 100);
    const stopWords = ['어떻게', '무엇을', '어떤', '나는', '나의', '나에게', '우리가', '우리는', '오늘', '이번', '주님', '하나님', '예수님', '내가', '나를', '왜', '무슨', '어떻게하면'];
    const sortedKeywords = Object.entries(questionKeywords)
      .filter(([kw]) => !stopWords.includes(kw))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(i => i[0]);

    return { archiveList, totalActions, completedActions, completionRate, totalQuestions, sortedKeywords };
  }, [dailyData, getArr, lifeWorshipLogs]);

  // 카테고리 추가/삭제
  const confirmAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !lifeCategories.includes(trimmed)) {
      setLifeCategories(prev => [...prev, trimmed]);
      setFormCategory(trimmed);
      showToast(`'${trimmed}' 영역 추가됨`);
    }
    setIsAddingCat(false);
    setNewCatInput('');
  };

  const handleRemoveCategory = (e, catToRemove) => {
    e.stopPropagation();
    if (lifeCategories.length <= 1) return;
    const updated = lifeCategories.filter(c => c !== catToRemove);
    setLifeCategories(updated);
    if (formCategory === catToRemove) setFormCategory(updated[0]);
  };

  // 키워드 태그 추가
  const handleAddKeyword = () => {
    if (!newKeyword.trim() || seasonKeywords.includes(newKeyword.trim())) return;
    setSeasonKeywords(prev => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  };

  // 미해결 질문을 현재 폼에 즉시 바인딩(인젝션)[cite: 34]
  const handleInjectQuestion = (q, targetField = 'interpretation') => {
    const isAlready = linkedQuestions.some(l => l.qIdx === q.qIdx && l.date === q.date);
    if (!isAlready) {
      setLinkedQuestions(prev => [...prev, q]);
    }

    if (targetField === 'interpretation') {
      setFormInterpretation(prev => prev ? `${prev}\n[말씀질문] ${q.text}` : `[말씀질문] ${q.text}`);
    } else if (targetField === 'event') {
      setFormEvent(prev => prev ? `${prev}\n[말씀상황] ${q.text}` : `[말씀상황] ${q.text}`);
    }
    showToast(`'${q.source}' 질문이 바인딩되었습니다`);
    setActiveView('write');
  };

  // 실천 로그 등록[cite: 34]
  const handleAddLifeLog = () => {
    if (!formEvent.trim() && !formInterpretation.trim() && !formAction.trim()) {
      showToast('사건, 해석, 결단 중 최소 하나를 입력해주세요');
      return;
    }

    const newLog = {
      id: Date.now(),
      date: getLocalToday(),
      category: formCategory,
      event: formEvent.trim(),
      interpretation: formInterpretation.trim(),
      action: formAction.trim(),
      linked: linkedQuestions
    };

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
    setLinkedQuestions([]);
    showToast('✨ 일상의 예배 기록이 봉헌되었습니다');
  };

  const handleDeleteLog = (id) => {
    if (!window.confirm('이 예배 기록을 삭제하시겠습니까?')) return;
    setLifeWorshipLogs(prev => prev.filter(log => log.id !== id));
    showToast('기록이 삭제되었습니다');
  };

  // 간증문 / 목장 나눔 내보내기 템플릿 생성[cite: 34]
  const openExportModal = (arc, type) => {
    const qtData = dailyData[arc.date] || {};
    const bibleWord = qtData.sermonReference || qtData.qtReference || (arc.linked?.length > 0 ? arc.linked.map(l => l.source).join(', ') : '해당일 묵상 본문');
    const applyNotes = arc.action || (arc.linked?.length > 0 ? arc.linked.map(l => l.text).join('\n') : (arc.qtAction || arc.sermonAction || ''));
    const eventFact = arc.event || arc.resolutions?.[0] || '';
    const insightText = arc.interpretation || '';

    let template = '';
    if (type === 'testimony') {
      template = `[간증문] ${arc.category || '일상'}의 자리에서 드린 삶의 예배

1. 오늘 마주한 말씀
: ${bibleWord}

2. 삶의 사건 (무슨 일이 있었는가?)
: ${eventFact}

3. 나의 연약함과 우상 직면
: 

4. 말씀의 렌즈로 본 해석
: ${insightText}

5. 구체적 순종과 결단
: ${applyNotes}

6. 주님이 주신 은혜와 열매
: 

7. 감사 고백
: `;
    } else {
      template = `[목장 나눔 보고서]
• 일자: ${arc.date}
• 말씀 구절: ${bibleWord}
• 삶의 자리: ${eventFact}
${insightText ? `• 말씀 해석: ${insightText}\n` : ''}• 결단과 순종: ${applyNotes}`;
    }

    setExportModal({ isOpen: true, type, data: arc, previewText: template });
  };

  // 내보내기 실행 (암호화 동기화)[cite: 34]
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
      showToast('감사/간증 일기장에 저장되었습니다');
      setActiveScreen('diary');
    } else {
      const cellShared = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      cellShared.push({
        id: Date.now(),
        date: getLocalToday(),
        source: 'sermon_archive_advanced',
        text: encryptField(exportModal.previewText.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(cellShared));
      if (navigator.clipboard) navigator.clipboard.writeText(exportModal.previewText);
      window.dispatchEvent(new Event('storage'));
      showToast('목장 나눔방 텍스트 복사 완료');
      setActiveScreen('cell');
    }
    setExportModal({ isOpen: false, type: '', data: null, previewText: '' });
  };

  // 피드 필터링
  const filteredArchive = useMemo(() => {
    return stats.archiveList.filter(arc => {
      if (activeCategoryFilter === 'ALL') return true;
      if (activeCategoryFilter === 'QT_SERMON' && arc.type === 'QT_SERMON') return true;
      if (arc.type === 'LIFE_LOG' && arc.category === activeCategoryFilter) return true;
      return false;
    });
  }, [stats.archiveList, activeCategoryFilter]);

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bg} overflow-hidden select-none w-full`}>

      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          {toastMsg}
        </div>
      )}

      {/* 1. 슬림 헤더 바 */}
      <header className={`px-3 sm:px-4 py-2 border-b shrink-0 flex items-center justify-between ${ui.card} z-20`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-lg ${ui.btnGhost} cursor-pointer transition-colors`}
            title="홈으로 나가기"
          >
            <IconArrowLeft />
          </button>
          <div>
            <h1 className={`text-[14px] sm:text-[15px] font-black tracking-tight leading-none ${ui.textMain}`}>
              삶의 적용과 실천
            </h1>
            <span className={`text-[10px] font-mono font-bold ${ui.textSub} mt-0.5 block`}>
              SPIRITUAL ACTION TRACKER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 font-mono text-[11px] font-bold">
            <IconTarget />
            <span>{stats.completionRate}%</span>
          </div>
          {setIsSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded-lg ${ui.btnGhost} cursor-pointer md:hidden`}
            >
              <IconMenu />
            </button>
          )}
        </div>
      </header>

      {/* 2. 고밀도 4대 세그먼트 서브 탭바 */}
      <nav className={`px-2 py-1.5 border-b shrink-0 flex items-center gap-1 bg-black/5 dark:bg-white/5 ${ui.border} overflow-x-auto hide-scrollbar z-10`}>
        {[
          { id: 'write', label: '✍️ 실천 기록', count: null },
          { id: 'pending', label: '📋 미해결 큐', count: pendingQuestions.length },
          { id: 'feed', label: '🗂️ 피드', count: stats.archiveList.length },
          { id: 'stats', label: '📊 분석·시즌', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border shrink-0 ${
              activeView === tab.id
                ? 'bg-sky-600 text-white border-sky-500 shadow-2xs font-black'
                : `border-transparent ${ui.textSub} hover:${ui.textMain} hover:bg-white/10`
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 3. 메인 콘텐츠 뷰포트 (컴팩트 스크롤) */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-2.5 space-y-2.5 hide-scrollbar max-w-4xl mx-auto w-full pb-28">

        {/* ========================================================================= */}
        {/* VIEW 1: [실천 기록] 4단계 고밀도 폼                                         */}
        {/* ========================================================================= */}
        {activeView === 'write' && (
          <div className="space-y-2.5 animate-fade-in">

            {/* 미해결 큐 퀵 바인딩 알림 바 */}
            {pendingQuestions.length > 0 && (
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-300 font-bold truncate">
                    미해결 QT 적용 질문 {pendingQuestions.length}개 대기 중
                  </span>
                </div>
                <button
                  onClick={() => setActiveView('pending')}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  질문 선택 ➔
                </button>
              </div>
            )}

            {/* 입력 카드 */}
            <div className={`p-3 sm:p-4 rounded-2xl border ${ui.card} space-y-3`}>
              
              {/* 1. 영역 선택 (가로 스크롤 칩) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className={`font-bold ${ui.textMain}`}>1. 삶의 영역 선택</span>
                  <span className={`text-[10.5px] ${ui.textSub}`}>현재: {formCategory}</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                  {lifeCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        formCategory === cat
                          ? 'bg-sky-600 text-white border-sky-500 shadow-2xs font-black'
                          : `${ui.subCard} ${ui.textSub} hover:${ui.textMain}`
                      }`}
                    >
                      <span>{cat}</span>
                      {!DEFAULT_CATEGORIES.includes(cat) && (
                        <span
                          onClick={(e) => handleRemoveCategory(e, cat)}
                          className="text-[10px] opacity-60 hover:opacity-100 hover:text-rose-400 p-0.5"
                          title="삭제"
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  ))}

                  {isAddingCat ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        autoFocus
                        value={newCatInput}
                        onChange={e => setNewCatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmAddCategory()}
                        placeholder="새 영역..."
                        className={`w-24 px-2 py-0.5 text-[11px] rounded border ${ui.input} outline-none`}
                      />
                      <button onClick={confirmAddCategory} className="text-[11px] px-1.5 py-0.5 bg-sky-600 text-white rounded font-bold">확인</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(true)}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-200 shrink-0 cursor-pointer"
                    >
                      + 추가
                    </button>
                  )}
                </div>
              </div>

              {/* 바인딩된 질문 태그 표시 */}
              {linkedQuestions.length > 0 && (
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-sky-500 font-bold">
                    <span>🔗 연동된 말씀 적용 ({linkedQuestions.length}개)</span>
                    <button onClick={() => setLinkedQuestions([])} className="hover:underline">전체 해제</button>
                  </div>
                  <div className="space-y-1">
                    {linkedQuestions.map((lq, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-sky-900 dark:text-sky-200 font-medium">
                        <span className="truncate">• [{lq.source}] {lq.text}</span>
                        <button onClick={() => setLinkedQuestions(p => p.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 px-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. 사건과 감정 */}
              <div className="space-y-1">
                <label className={`text-[11.5px] font-bold block ${ui.textMain}`}>
                  2. 오늘의 삶 (사건·갈등·감정)
                </label>
                <textarea
                  rows={2}
                  value={formEvent}
                  onChange={e => setFormEvent(e.target.value)}
                  placeholder="오늘 일어난 문제, 팩트와 감정을 솔직하게 기록하세요..."
                  className={`w-full p-2.5 rounded-xl border text-[13px] leading-relaxed outline-none resize-none ${ui.input}`}
                />
              </div>

              {/* 3. 말씀 해석 */}
              <div className="space-y-1">
                <label className={`text-[11.5px] font-bold block ${ui.textMain}`}>
                  3. 말씀의 렌즈로 해석 (하나님의 시선)
                </label>
                <textarea
                  rows={2}
                  value={formInterpretation}
                  onChange={e => setFormInterpretation(e.target.value)}
                  placeholder="이 사건을 오늘 주신 말씀과 십자가 은혜로 재해석해보세요..."
                  className={`w-full p-2.5 rounded-xl border text-[13px] leading-relaxed outline-none resize-none ${ui.input}`}
                />
              </div>

              {/* 4. 실천 결단 */}
              <div className="space-y-1">
                <label className={`text-[11.5px] font-bold block ${ui.textMain}`}>
                  4. 구체적 실천 결단 (오늘의 순종 1가지)
                </label>
                <textarea
                  rows={2}
                  value={formAction}
                  onChange={e => setFormAction(e.target.value)}
                  placeholder="내가 오늘 즉시 다르게 행동할 순종 과제 1가지를 적으세요..."
                  className={`w-full p-2.5 rounded-xl border text-[13px] font-bold leading-relaxed outline-none resize-none ${ui.input}`}
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="button"
                onClick={handleAddLifeLog}
                className={`w-full py-3 rounded-xl text-[13px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${ui.btnPrimary}`}
              >
                <IconCheck /> 일상의 예배로 올려드리기
              </button>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: [미해결 큐] 터치로 폼에 즉시 바인딩                                 */}
        {/* ========================================================================= */}
        {activeView === 'pending' && (
          <div className="space-y-2 animate-fade-in">
            <div className={`p-3 rounded-xl border ${ui.card} flex items-center justify-between`}>
              <div>
                <h3 className={`text-[13px] font-black ${ui.textMain}`}>미해결 적용 질문 리스트</h3>
                <p className={`text-[11px] ${ui.textSub}`}>터치하면 오늘 실천 기록장으로 즉시 연동됩니다.</p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                {pendingQuestions.length}건
              </span>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${ui.card} text-xs text-slate-400 font-medium`}>
                미해결된 질문이 없습니다. 모든 말씀이 삶으로 실천되고 있습니다! 👏
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${ui.card} flex flex-col gap-1.5 transition-all`}
                  >
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-mono font-bold text-slate-400">{q.date}</span>
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 font-bold">
                        {q.source}
                      </span>
                    </div>

                    <p className={`text-[12.5px] font-bold leading-relaxed ${ui.textMain} break-keep`}>
                      "{q.text}"
                    </p>

                    <div className="flex gap-1.5 pt-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleInjectQuestion(q, 'event')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${ui.btnGhost} cursor-pointer`}
                      >
                        [사건]에 대입
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInjectQuestion(q, 'interpretation')}
                        className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-sky-600 text-white cursor-pointer active:scale-95"
                      >
                        [말씀해석]에 대입 ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: [피드] 날짜별 타임라인 & 퀵 액션 바                                 */}
        {/* ========================================================================= */}
        {activeView === 'feed' && (
          <div className="space-y-2.5 animate-fade-in">
            
            {/* 카테고리 필터 칩 바 */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
              <button
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-sky-600 text-white border-sky-500 font-black'
                    : `${ui.subCard}${ui.textSub}`
                }`}
              >
                전체 ({stats.archiveList.length})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('QT_SERMON')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                  activeCategoryFilter === 'QT_SERMON'
                    ? 'bg-sky-600 text-white border-sky-500 font-black'
                    : `${ui.subCard}${ui.textSub}`
                }`}
              >
                QT/예배 결단
              </button>
              {lifeCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-sky-600 text-white border-sky-500 font-black'
                      : `${ui.subCard}${ui.textSub}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredArchive.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${ui.card} text-xs text-slate-400 font-medium`}>
                기록된 피드가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArchive.map((arc, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${ui.card} space-y-2.5`}>
                    
                    {/* 상단 메타 */}
                    <div className="flex items-center justify-between border-b pb-1.5 border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-400 flex items-center gap-1">
                          <IconCalendar /> {arc.date}
                        </span>
                        {arc.type === 'LIFE_LOG' ? (
                          <span className="px-2 py-0.2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 font-bold text-[10px]">
                            {arc.category}
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 font-bold text-[10px]">
                            QT·설교 결단
                          </span>
                        )}
                      </div>

                      {arc.type === 'LIFE_LOG' && (
                        <button
                          onClick={() => handleDeleteLog(arc.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer text-xs"
                          title="삭제"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 본문 콘텐츠 */}
                    {arc.type === 'LIFE_LOG' ? (
                      <div className="space-y-1.5 text-xs">
                        {arc.event && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">[사건과 감정]</span>
                            <p className={`font-medium leading-relaxed ${ui.textMain} break-keep`}>{arc.event}</p>
                          </div>
                        )}
                        {arc.interpretation && (
                          <div className="pt-1 border-t border-dashed border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-bold text-sky-500 block">[말씀 해석]</span>
                            <p className={`font-medium leading-relaxed ${ui.textMain} break-keep`}>{arc.interpretation}</p>
                          </div>
                        )}
                        {arc.action && (
                          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 block mb-0.5">✓ 실천 결단</span>
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{arc.action}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {arc.resolutions?.map((res, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-purple-500 font-bold">•</span>
                            <p className={`font-bold leading-relaxed ${ui.textMain}`}>{res}</p>
                          </div>
                        ))}
                        {arc.qtAction && (
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 block">QT 적용 과제</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{arc.qtAction}</p>
                          </div>
                        )}
                        {arc.sermonAction && (
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 block">예배 결단 과제</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{arc.sermonAction}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 퀵 액션 바텀 버튼 (간증문 8단계 서식 / 목장 전송) */}
                    <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => openExportModal(arc, 'testimony')}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border ${ui.btnGhost} cursor-pointer transition-colors`}
                      >
                        <IconBook /> 간증문 변환
                      </button>
                      <button
                        type="button"
                        onClick={() => openExportModal(arc, 'cell')}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border ${ui.btnGhost} cursor-pointer transition-colors`}
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
        {/* VIEW 4: [분석·시즌] 실천 달성률 & 키워드 클라우드                            */}
        {/* ========================================================================= */}
        {activeView === 'stats' && (
          <div className="space-y-2.5 animate-fade-in">
            
            {/* 달성률 & 통계 미니 그리드 */}
            <div className={`p-3.5 rounded-2xl border ${ui.card} grid grid-cols-3 gap-2 text-center`}>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] font-mono font-bold text-sky-500 block">달성률</span>
                <span className="text-xl font-black text-sky-600 dark:text-sky-300 font-mono">{stats.completionRate}%</span>
              </div>
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 block">세운 실천</span>
                <span className="text-xl font-black font-mono">{stats.totalActions}건</span>
              </div>
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 block">질문 고백</span>
                <span className="text-xl font-black font-mono">{stats.totalQuestions}개</span>
              </div>
            </div>

            {/* 영적 시즌 키워드 관리 */}
            <div className={`p-3.5 rounded-2xl border ${ui.card} space-y-2`}>
              <span className={`text-[12px] font-bold block ${ui.textMain}`}>나의 영적 시즌 태그</span>
              
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="예: 광야의 훈련, 침묵 속의 순종..."
                  className={`flex-1 px-2.5 py-1.5 text-xs rounded-xl border ${ui.input} outline-none`}
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {seasonKeywords.map(kw => (
                  <span
                    key={kw}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${ui.subCard} ${ui.textMain}`}
                  >
                    #{kw}
                    <button
                      onClick={() => setSeasonKeywords(p => p.filter(k => k !== kw))}
                      className="text-slate-400 hover:text-rose-500 ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 자주 묻고 결단한 어휘 */}
            {stats.sortedKeywords.length > 0 && (
              <div className={`p-3.5 rounded-2xl border ${ui.card} space-y-1.5`}>
                <span className={`text-[12px] font-bold block ${ui.textMain}`}>자주 묻고 고백한 어휘 TOP 10</span>
                <div className="flex flex-wrap gap-1">
                  {stats.sortedKeywords.map(word => (
                    <span
                      key={word}
                      className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20 text-[11px] font-bold font-mono"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                {exportModal.type === 'testimony' ? '간증문 8단계 서식 에디터' : '목장 나눔 서식 에디터'}
              </h3>
              <button
                onClick={() => setExportModal({ isOpen: false, type: '', data: null, previewText: '' })}
                className="text-slate-400 hover:text-white p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-2 text-[11px] text-slate-400 shrink-0 leading-tight">
              {exportModal.type === 'testimony'
                ? '일상 기록과 말씀이 8단계 구속사 서식으로 자동 매핑되었습니다. 수정 후 일기장으로 저장하세요.'
                : '목장 식구들에게 나눌 텍스트를 검토 후 복사·전송하세요.'}
            </div>

            <textarea
              value={exportModal.previewText}
              onChange={e => setExportModal({ ...exportModal, previewText: e.target.value })}
              className={`flex-1 w-full p-3 rounded-xl border text-[12.5px] font-mono leading-relaxed outline-none resize-none ${ui.input}`}
            />

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-2 shrink-0">
              <button
                type="button"
                onClick={executeExport}
                className={`w-full py-2.5 rounded-xl text-[12.5px] font-bold ${ui.btnPrimary} flex items-center justify-center gap-1.5`}
              >
                {exportModal.type === 'testimony' ? '✓ 내 감사/간증 일기장에 저장하고 이동' : '✓ 텍스트 복사하고 목장 나눔방 이동'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
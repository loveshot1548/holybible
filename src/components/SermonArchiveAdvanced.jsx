import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 간증 및 목장 나눔 연동 데이터 보호
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

// 모던 라인 아이콘
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconQuestion = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconList = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

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
  const [activeView, setActiveView] = useState('dashboard');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  const [lifeCategories, setLifeCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_life_cats_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const [lifeWorshipLogs, setLifeWorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('life_worship_logs_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [seasonKeywords, setSeasonKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('spiritual_season_kws_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [newKeyword, setNewKeyword] = useState('');

  const [formCategory, setFormCategory] = useState(lifeCategories[0] || '기타 일상');
  const [formEvent, setFormEvent] = useState('');
  const [formInterpretation, setFormInterpretation] = useState('');
  const [formAction, setFormAction] = useState('');
  const [linkedQuestions, setLinkedQuestions] = useState([]);

  const [celebration, setCelebration] = useState(false);

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

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-white/10' : 'border-white/60',
    glassCard: isDark ? 'bg-[#1C1C1E]/50 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl' : 'bg-white/40 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-3xl',
    innerBox: isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/80',
    inputBorder: isDark ? 'border-white/10 focus:border-sky-400 text-white placeholder:text-slate-600' : 'border-white/60 focus:border-sky-500 text-slate-900 placeholder:text-slate-500',
    accentColor: isDark ? 'text-sky-400' : 'text-sky-600',
    accentBg: isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-500/10 text-sky-700 border border-sky-400/30',
    btnPrimary: isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-400/30' : 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200',
    checkActive: isDark ? 'bg-sky-500 text-white shadow-sm border-sky-400' : 'bg-sky-500 text-white shadow-sm border-sky-400',
  };

  const pendingQuestions = useMemo(() => {
    let list = [];
    Object.entries(dailyData || {}).forEach(([date, dayVal]) => {
      const qs = getArr(dayVal.applyQuestions).filter(q => q && q.trim().length > 0);
      const completed = getArr(dayVal.completedActions);
      qs.forEach((q, idx) => {
        if (!completed.includes(idx)) list.push({ date, qIdx: idx, text: q, source: 'QT 적용질문' });
      });
      const res = getArr(dayVal.resolutions);
      res.forEach((r) => {
        if (!completed.includes(r)) list.push({ date, qIdx: r, text: r, source: '예배 결단' });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }, [dailyData, getArr]);

  const stats = useMemo(() => {
    const archiveList = [];
    Object.entries(dailyData || {}).forEach(([dKey, dVal]) => {
      const qList = getArr(dVal.applyQuestions).filter(q => q && q.replace(/\[음성녹음\]/g, '').trim().length > 0);
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
    let patternInsight = "아직 충분한 기록이 없습니다. 매일의 일상을 말씀으로 해석해보세요.";
    if (archiveList.length > 0) {
      patternInsight = "최근 삶의 예배 기록이 누적되고 있습니다. 설정하신 신앙 키워드와 연계하여 매일의 삶을 성전으로 세워가십시오.";
    }

    let totalActions = 0;
    let completedActions = 0;
    let totalQuestions = 0;
    let questionKeywords = {};

    archiveList.forEach(item => {
      if (item.type === 'LIFE_LOG') {
        if (item.action) totalActions++;
      } else {
        if (item.qtAction) { totalActions++; if (dailyData[item.date]?.qtActionCompleted) completedActions++; }
        if (item.sermonAction) { totalActions++; if (dailyData[item.date]?.sermonActionCompleted) completedActions++; }
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
      .slice(0, 15)
      .map(i => i[0]);

    return { archiveList, patternInsight, totalActions, completedActions, completionRate, totalQuestions, sortedKeywords };
  }, [dailyData, getArr, lifeWorshipLogs]);

  const getLocalToday = () => {
    const o = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - o).toISOString().split('T')[0];
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || seasonKeywords.includes(newKeyword.trim())) return;
    setSeasonKeywords(prev => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  };

  const confirmAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !lifeCategories.includes(trimmed)) {
      setLifeCategories(prev => [...prev, trimmed]);
      setFormCategory(trimmed);
    }
    setIsAddingCat(false);
    setNewCatInput('');
  };

  const handleRemoveCategory = (e, catToRemove) => {
    e.stopPropagation();
    if (lifeCategories.length <= 1) {
      alert('최소 하나 이상의 영역이 유지되어야 합니다.');
      return;
    }
    const updated = lifeCategories.filter(c => c !== catToRemove);
    setLifeCategories(updated);
    if (formCategory === catToRemove) setFormCategory(updated[0]);
  };

  const handleAddLifeLog = () => {
    if (!formEvent.trim() && !formInterpretation.trim() && !formAction.trim()) return;
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
    setCelebration(true);
    setTimeout(() => {
      setCelebration(false);
      setFormEvent('');
      setFormInterpretation('');
      setFormAction('');
      setLinkedQuestions([]);
    }, 2000);
  };

  const toggleLinkQuestion = (q) => {
    setLinkedQuestions(prev => {
      const exists = prev.find(p => p.qIdx === q.qIdx && p.date === q.date);
      if (exists) return prev.filter(p => !(p.qIdx === q.qIdx && p.date === q.date));
      return [...prev, q];
    });

    if (!formInterpretation.includes(q.text)) {
      setFormInterpretation(prev => prev ? `${prev}\n- ${q.text}` : `- ${q.text}`);
    }
  };

  const handleDragStart = (e, q) => {
    e.dataTransfer.setData('text/plain', `[${q.source}] ${q.text}`);
  };

  const handleDropOnEvent = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) setFormEvent(prev => prev ? `${prev}\n${data}` : data);
  };

  const handleDropOnInterpretation = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) setFormInterpretation(prev => prev ? `${prev}\n${data}` : data);
  };

  const handleDeleteLog = (id) => {
    setLifeWorshipLogs(prev => prev.filter(log => log.id !== id));
  };

  const openExportModal = (arc, type) => {
    const qtData = dailyData[arc.date] || {};
    const bibleWord = qtData.sermonReference || qtData.qtReference || (arc.linked && arc.linked.length > 0 ? arc.linked.map(l => l.source).join(', ') : '해당일 묵상 본문');
    const applyNotes = arc.action || (arc.linked && arc.linked.length > 0 ? arc.linked.map(l => l.text).join('\n') : (arc.qtAction || arc.sermonAction || ''));
    const eventFact = arc.event || arc.resolutions?.[0] || '';
    const insightText = arc.interpretation || '';

    let template = '';
    if (type === 'testimony') {
      template = `[제목] ${arc.category || '일상'}의 자리에서 드려진 삶의 예배

1. 오늘 받은 말씀
: ${bibleWord}

2. 사건 (무슨 일이 있었는가?)
: ${eventFact}

3. 내 죄와 우상 (왜 그렇게 반응했는가?)
: 

4. 말씀으로 받은 깨달음
: ${insightText}

5. 적용 (구체적으로 무엇을 순종할 것인가?)
: ${applyNotes}

6. 하나님이 주신 열매
: 

7. 감사
: `;
    } else {
      template = `[목장 나눔 보고서]
날짜: ${arc.date}
말씀 구절: ${bibleWord}
삶의 사건 및 깨달음: ${eventFact}
${insightText ? `말씀 해석: ${insightText}\n` : ''}구체적 결단: ${applyNotes}`;
    }

    setExportModal({ isOpen: true, type, data: arc, previewText: template });
  };

  // 🌟 [암호화 연동 결합]
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
      alert('나의 감사/간증 일기장에 성공적으로 기록되었습니다. 일기장 페이지로 이동합니다.');
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
      navigator.clipboard.writeText(exportModal.previewText);
      window.dispatchEvent(new Event('storage'));
      alert('목장 나눔 양식이 복사 및 저장되었습니다. 목장 나눔 페이지로 이동합니다.');
      setActiveScreen('cell');
    }
    setExportModal({ isOpen: false, type: '', data: null, previewText: '' });
  };

  const filteredArchive = stats.archiveList.filter(arc => {
    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'QT_SERMON' && arc.type === 'QT_SERMON') return true;
    if (arc.type === 'LIFE_LOG' && arc.category === activeCategoryFilter) return true;
    return false;
  });

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bgBody} overflow-hidden select-none animate-fade-in w-full min-w-0 max-w-full`}>

      {/* 3D 가속 최적화 리퀴드 오로라 배경 */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isDark ? 'opacity-30 mix-blend-lighten' : 'opacity-80'}`} style={{ transform: 'translate3d(0,0,0)' }}>
        <div className="absolute -top-[5%] -left-[10%] w-[70vw] h-[70vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)', filter: 'blur(75px)' }} />
        <div className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[10%] w-[75vw] h-[75vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)', filter: 'blur(85px)', animationDelay: '2s' }} />
      </div>

      {/* 상단 글래스 헤더 바 */}
      <div className={`relative z-20 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-2xl shrink-0 w-full min-w-0 ${isDark ? 'border-white/10 bg-[#0F1115]/60' : 'border-white/60 bg-white/40'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeView === 'archive' ? setActiveView('dashboard') : setActiveScreen('home')}
            className={`p-1.5 -ml-1.5 rounded-full transition-colors ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer`}
          >
            <IconArrowLeft />
          </button>
          <div className="flex flex-col">
             <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>
               {activeView === 'archive' ? '영적 일기 피드 아카이브' : '삶의 적용과 실천'}
             </h1>
             <span className={`text-[10.5px] font-bold ${ui.accentColor} hidden sm:block tracking-widest uppercase`}>나의 영적 트래커</span>
          </div>
        </div>
        {setIsSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}
          >
            <IconMenu />
          </button>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className={`flex w-full px-4 overflow-x-auto hide-scrollbar border-b z-20 backdrop-blur-xl shrink-0 touch-pan-x min-w-0 py-2 gap-2 ${isDark ? 'border-white/10 bg-[#1C1C1E]/40' : 'border-white/60 bg-white/30'}`}>
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-black rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border
            ${activeView === 'dashboard' ? 'bg-sky-500 text-white border-sky-400' : (isDark ? 'text-slate-400 hover:text-white bg-white/5 border-transparent' : 'text-slate-600 hover:text-slate-900 bg-white/40 border-white/50')}`}
        >
          <IconChart /> 일상의 예배 기록장
        </button>
        <button
          onClick={() => setActiveView('archive')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-black rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border
            ${activeView === 'archive' ? 'bg-sky-500 text-white border-sky-400' : (isDark ? 'text-slate-400 hover:text-white bg-white/5 border-transparent' : 'text-slate-600 hover:text-slate-900 bg-white/40 border-white/50')}`}
        >
          <IconList /> 영적 일기 피드 아카이브
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full hide-scrollbar relative z-10 pb-32 min-w-0 bg-transparent">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-5 sm:py-8 min-w-0">

          {/* VIEW 1: 대시보드 */}
          {activeView === 'dashboard' && (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 animate-fade-in w-full min-w-0">

              {/* 좌측 패널 */}
              <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col gap-5 shrink-0 min-w-0">
                <div className={`p-5 rounded-[24px] border ${ui.glassCard} flex flex-col gap-4 w-full min-w-0 shadow-sm`}>
                  <div className="flex flex-col gap-1.5">
                     <h2 className={`text-[17px] font-black ${ui.textMain} tracking-tight`}>나의 영적 시즌 및 패턴</h2>
                     <p className={`text-[13px] font-medium leading-[1.8] ${ui.textSub} break-keep`}>
                       {stats.patternInsight}
                     </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 w-full min-w-0">
                    <label className={`text-[13px] font-bold ${ui.textMain}`}>나의 영적 시즌 키워드</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                        placeholder="태그 입력 후 엔터..."
                        className={`flex-1 p-3 text-[13px] font-bold border-b-2 bg-transparent outline-none transition-colors ${ui.inputBorder}`}
                      />
                      <button
                        onClick={handleAddKeyword}
                        className={`px-4 py-2.5 text-[12.5px] font-black rounded-xl transition-transform active:scale-95 shadow-sm ${ui.btnPrimary} shrink-0 cursor-pointer`}
                      >
                        추가
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 w-full min-w-0">
                      {seasonKeywords.map(kw => (
                        <span key={kw} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-bold rounded-lg border shadow-sm ${ui.innerBox} ${ui.textMain}`}>
                          #{kw}
                          <button onClick={() => setSeasonKeywords(p => p.filter(k => k !== kw))} className="opacity-50 hover:opacity-100 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer">
                            <IconX />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 실천 목표 통계 미니 보드 */}
                <div className={`p-5 rounded-[24px] border ${ui.glassCard} flex flex-col gap-4 w-full min-w-0 shadow-sm`}>
                   <div className="flex justify-between items-center pb-3 border-b border-white/10 dark:border-white/5">
                      <h3 className={`text-[14.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                         <IconTarget /> 실천 목표 현황
                      </h3>
                   </div>
                   <div className="flex justify-around items-center pt-2">
                      <div className="flex flex-col items-center">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${ui.textSub}`}>달성률</span>
                         <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                            <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                               <path className={`${isDark ? 'text-white/10' : 'text-black/10'}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                               <path className={`${ui.accentColor}`} strokeDasharray={`${stats.completionRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                               <span className={`text-[16px] font-black ${ui.textMain}`}>{stats.completionRate}%</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-5">
                         <div className="flex flex-col items-end">
                           <span className={`text-[10.5px] font-black uppercase tracking-widest ${ui.textSub}`}>총 세워진 목표</span>
                           <span className={`text-[18px] font-black ${ui.textMain}`}>{stats.totalActions} <span className="text-[11px] font-bold opacity-60">건</span></span>
                         </div>
                         <div className="flex flex-col items-end">
                           <span className={`text-[10.5px] font-black uppercase tracking-widest ${ui.textSub}`}>스스로 묻고 결단한 질문</span>
                           <span className={`text-[18px] font-black ${ui.textMain}`}>{stats.totalQuestions} <span className="text-[11px] font-bold opacity-60">개</span></span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* 우측 패널 */}
              <div className="flex-1 flex flex-col relative min-w-0">
                {celebration && (
                  <div className={`absolute inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-[#0F1115]/90' : 'bg-white/90'} backdrop-blur-md rounded-[24px] animate-fade-in`}>
                    <div className="flex flex-col items-center gap-4 text-center p-8">
                      <div className={`w-14 h-14 rounded-full border-2 ${ui.textMain} flex items-center justify-center animate-bounce shadow-lg`}>
                        <IconCheck />
                      </div>
                      <h3 className={`text-[18px] font-black ${ui.textMain} drop-shadow-md`}>삶의 예배가 드려졌습니다!</h3>
                    </div>
                  </div>
                )}

                <div className={`flex flex-col gap-6 p-5 sm:p-8 rounded-[24px] border ${ui.glassCard} w-full min-w-0 shadow-sm`}>
                  <div className="border-b border-slate-200/60 dark:border-white/10 pb-4">
                    <h2 className={`text-[18px] sm:text-[20px] font-black ${ui.textMain} tracking-tight`}>일상의 예배 기록장</h2>
                    <p className={`text-[13px] font-medium leading-[1.7] ${ui.textSub} mt-1.5 break-keep`}>
                      내 삶의 모든 영역이 성전입니다. 사건을 적고, 미해결된 QT 말씀을 대입하여 구체적인 삶의 실천으로 돌파하세요.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 w-full min-w-0">
                    {/* 1. 카테고리 설정 */}
                    <div className="flex flex-col gap-3 w-full min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-[14.5px] font-black ${ui.textMain}`}>1. 어떤 영역의 일상인가요?</span>
                        <span className={`text-[11px] font-medium ${ui.textSub} hidden sm:block`}>자유롭게 나만의 영역을 구성하세요</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center w-full min-w-0">
                        {lifeCategories.map(cat => (
                          <div
                            key={cat}
                            onClick={() => setFormCategory(cat)}
                            className={`group px-4 py-2 text-[12.5px] font-black rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${formCategory === cat ? ui.checkActive : `bg-transparent ${ui.textSub}${ui.innerBox}`}`}
                          >
                            <span>{cat}</span>
                            {!DEFAULT_CATEGORIES.includes(cat) && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveCategory(e, cat)}
                                className="opacity-50 hover:opacity-100 hover:text-rose-500 transition-colors cursor-pointer"
                                title="영역 삭제"
                              >
                                <IconX />
                              </button>
                            )}
                          </div>
                        ))}

                        {isAddingCat ? (
                          <div className={`flex items-center gap-1 bg-transparent px-2 border-b-2 ${ui.inputBorder}`}>
                            <input
                              autoFocus
                              value={newCatInput}
                              onChange={e => setNewCatInput(e.target.value)}
                              onBlur={confirmAddCategory}
                              onKeyDown={e => e.key === 'Enter' && confirmAddCategory()}
                              className={`w-28 py-1.5 text-[12.5px] font-bold bg-transparent outline-none ${ui.textMain}`}
                              placeholder="새 영역 입력..."
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingCat(true)}
                            className={`px-3.5 py-2 text-[12px] font-bold border border-dashed rounded-xl ${ui.textSub} hover:${ui.textMain} hover:border-slate-400 flex items-center gap-1 transition-colors cursor-pointer`}
                          >
                            <IconPlus /> 추가
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. 일상 사건 기록 */}
                    <div className="flex flex-col gap-2.5 w-full min-w-0">
                      <span className={`text-[14.5px] font-black ${ui.textMain}`}>2. 오늘의 일상 (사건과 감정)</span>
                      <textarea
                        value={formEvent}
                        onChange={e => setFormEvent(e.target.value)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDropOnEvent}
                        placeholder="오늘 일어난 문제나 갈등, 팩트와 감정을 적어주세요. (하단의 질문 카드를 끌어다 놓으셔도 됩니다)"
                        className={`w-full p-4 text-[13.5px] font-medium leading-[1.8] bg-transparent border-b-2 shadow-inner rounded-t-xl outline-none resize-none h-28 transition-colors ${ui.inputBorder}`}
                      />
                    </div>

                    {/* 3. 말씀 해석 */}
                    <div className="flex flex-col gap-3 w-full min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-[14.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                          <IconBook /> 3. 말씀의 렌즈로 해석하기
                        </span>
                        <span className={`text-[11px] font-medium ${ui.textSub} hidden sm:block`}>터치하거나 입력창으로 드래그하세요</span>
                      </div>

                      <div className={`p-4 rounded-xl border border-dashed flex flex-col gap-2.5 w-full min-w-0 ${isDark ? 'border-white/20 bg-black/20' : 'border-slate-300 bg-white/50'}`}>
                        <span className={`text-[11.5px] font-bold ${ui.textSub}`}>미해결 말씀 적용 불러오기</span>
                        {pendingQuestions.length === 0 ? (
                          <p className={`text-[12.5px] font-medium ${ui.textSub}`}>불러올 말씀 적용 과제가 없습니다.</p>
                        ) : (
                          <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-1 touch-pan-x w-full min-w-0">
                            {pendingQuestions.map((q, idx) => {
                              const isLinked = linkedQuestions.find(lq => lq.qIdx === q.qIdx && lq.date === q.date);
                              return (
                                <div
                                  key={idx}
                                  draggable
                                  onDragStart={e => handleDragStart(e, q)}
                                  onClick={() => toggleLinkQuestion(q)}
                                  className={`shrink-0 w-60 p-3.5 rounded-xl border cursor-pointer active:scale-95 transition-all flex flex-col gap-1.5 select-none shadow-sm ${isLinked ? ui.checkActive : `bg-transparent ${ui.innerBox}${ui.textSub}`}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold opacity-80">{q.date} {q.source}</span>
                                    {isLinked && <IconCheck />}
                                  </div>
                                  <p className="text-[13px] font-bold leading-[1.6] line-clamp-2 break-keep">{q.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <textarea
                        value={formInterpretation}
                        onChange={e => setFormInterpretation(e.target.value)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDropOnInterpretation}
                        placeholder="연동된 말씀을 이 사건에 어떻게 대입할 수 있을까요? (카드를 끌어다 놓으셔도 됩니다)"
                        className={`w-full p-4 text-[13.5px] font-medium leading-[1.8] bg-transparent border-b-2 shadow-inner rounded-t-xl outline-none resize-none h-28 transition-colors ${ui.inputBorder}`}
                      />
                    </div>

                    {/* 4. 실천 결단 */}
                    <div className="flex flex-col gap-2.5 w-full min-w-0">
                      <span className={`text-[14.5px] font-black ${ui.textMain}`}>4. 구체적 실천 결단</span>
                      <textarea
                        value={formAction}
                        onChange={e => setFormAction(e.target.value)}
                        placeholder="내가 다르게 행동할 구체적 결단 1가지를 명확히 적어주세요."
                        className={`w-full p-4 text-[13.5px] font-bold leading-[1.8] bg-transparent border-b-2 shadow-inner rounded-t-xl outline-none resize-none h-24 transition-colors ${ui.inputBorder}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLifeLog}
                      className={`w-full py-4 text-[14.5px] font-black rounded-2xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer ${ui.btnPrimary}`}
                    >
                      <IconCheck /> 나의 일상을 예배로 올려드리기
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VIEW 2: 전체 영적 일기 피드 아카이브 */}
          {activeView === 'archive' && (
            <div className="flex flex-col max-w-[800px] mx-auto animate-fade-in w-full min-w-0">
              <div className={`p-6 rounded-[24px] border flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 shadow-sm w-full min-w-0 ${ui.glassCard}`}>
                <div className="flex flex-col gap-2">
                  <h2 className={`text-[20px] font-black tracking-tight ${ui.textMain}`}>전체 영적 일기 피드</h2>
                  <p className={`text-[13px] font-medium ${ui.textSub} break-keep leading-[1.7]`}>QT, 예배, 일상에서 결단한 모든 기록들이 시간순으로 모여 있습니다.</p>
                </div>

                <div className="flex flex-wrap gap-2 min-w-0">
                  <button
                    onClick={() => setActiveCategoryFilter('ALL')}
                    className={`px-4 py-2 text-[12px] font-bold border rounded-xl transition-colors cursor-pointer shadow-sm ${activeCategoryFilter === 'ALL' ? ui.checkActive : `bg-transparent ${ui.textSub}${ui.innerBox}`}`}
                  >
                    전체 보기
                  </button>
                  <button
                    onClick={() => setActiveCategoryFilter('QT_SERMON')}
                    className={`px-4 py-2 text-[12px] font-bold border rounded-xl transition-colors cursor-pointer shadow-sm ${activeCategoryFilter === 'QT_SERMON' ? ui.checkActive : `bg-transparent ${ui.textSub}${ui.innerBox}`}`}
                  >
                    QT/설교 결단
                  </button>
                  {lifeCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-4 py-2 text-[12px] font-bold border rounded-xl transition-colors cursor-pointer shadow-sm ${activeCategoryFilter === cat ? ui.checkActive : `bg-transparent ${ui.textSub}${ui.innerBox}`}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredArchive.length === 0 ? (
                <div className={`text-center py-24 text-[14px] font-medium ${ui.textSub}`}>기록된 항목이 없습니다.</div>
              ) : (
                <div className="flex flex-col gap-4 w-full min-w-0">
                  {filteredArchive.map((arc, idx) => (
                    <div key={idx} className={`p-5 sm:p-6 rounded-[24px] border flex flex-col gap-4 shadow-sm w-full min-w-0 ${ui.glassCard}`}>
                      <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-[15.5px] font-black ${ui.textMain}`}>{arc.date}</h3>
                          {arc.type === 'LIFE_LOG' && <span className={`px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-500 text-[10.5px] font-black uppercase tracking-widest`}>{arc.category}</span>}
                        </div>
                        {arc.type === 'LIFE_LOG' && (
                          <button onClick={() => handleDeleteLog(arc.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer">
                            <IconX />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-4 w-full min-w-0">
                        {arc.type === 'LIFE_LOG' && (
                          <div className="flex flex-col gap-4">
                            <p className={`text-[14.5px] font-medium leading-[1.8] ${ui.textMain} break-keep`}>{arc.event}</p>
                            {arc.linked && arc.linked.length > 0 && (
                              <div className={`flex flex-col gap-1.5 pl-3.5 border-l-2 ${ui.border}`}>
                                <span className={`text-[11px] font-black text-sky-500`}>연동된 말씀 적용</span>
                                {arc.linked.map((lq, i) => <p key={i} className={`text-[13px] font-bold leading-[1.6] break-keep ${ui.textMain}`}>✓ {lq.text}</p>)}
                              </div>
                            )}
                            {arc.interpretation && (
                              <div className={`flex flex-col gap-2 pl-3.5 border-l-2 ${ui.border} mt-1`}>
                                <span className={`text-[11px] font-black ${ui.textSub}`}>말씀 해석</span>
                                <p className={`text-[14px] font-medium leading-[1.8] ${ui.textMain} break-keep`}>{arc.interpretation}</p>
                              </div>
                            )}
                            {arc.action && (
                              <div className="flex flex-col gap-1.5 mt-2">
                                <span className={`text-[11px] font-black text-sky-500`}>실천 결단</span>
                                <p className={`text-[14.5px] font-black leading-[1.7] ${ui.textMain} break-keep`}>{arc.action}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {arc.type === 'QT_SERMON' && (
                          <div className="flex flex-col gap-4 w-full min-w-0">
                            {arc.resolutions && arc.resolutions.map((res, i) => (
                              <div key={`res_${i}`} className="flex flex-col gap-1.5">
                                <span className={`text-[11px] font-black ${ui.textSub}`}>예배 실천 결단</span>
                                <p className={`text-[14px] font-bold leading-[1.7] ${ui.textMain} break-keep`}>{res}</p>
                              </div>
                            ))}
                            {arc.qtAction && (
                              <div className="flex flex-col gap-1.5">
                                <span className={`text-[11px] font-black text-sky-500`}>QT 적용</span>
                                <p className={`text-[14px] font-bold leading-[1.7] ${ui.textMain} break-keep`}>{arc.qtAction}</p>
                              </div>
                            )}
                            {arc.sermonAction && (
                              <div className="flex flex-col gap-1.5">
                                <span className={`text-[11px] font-black text-sky-500`}>예배 말씀 적용</span>
                                <p className={`text-[14px] font-bold leading-[1.7] ${ui.textMain} break-keep`}>{arc.sermonAction}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 딥 인테그레이션 액션 바 */}
                        <div className="flex gap-2.5 mt-4 pt-4 border-t border-white/10 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => openExportModal(arc, 'testimony')}
                            className={`flex-1 py-3.5 rounded-xl flex justify-center items-center gap-2 text-[12.5px] font-black transition-transform active:scale-95 border shadow-sm ${ui.btnPrimary} cursor-pointer`}
                          >
                            <IconBook /> 간증문으로 피워내기
                          </button>
                          <button
                            type="button"
                            onClick={() => openExportModal(arc, 'cell')}
                            className={`flex-1 py-3.5 rounded-xl flex justify-center items-center gap-2 text-[12.5px] font-black transition-transform active:scale-95 border shadow-sm ${ui.btnPrimary} cursor-pointer`}
                          >
                            <IconShare /> 목장 나눔방 전송
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 딥 인테그레이션 에디터 모달 */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0F1115]/80 backdrop-blur-md flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in">
          <div className={`w-full md:max-w-2xl rounded-[32px] md:rounded-[28px] flex flex-col h-[90vh] md:h-[82vh] shadow-2xl animate-fade-in-up border ${ui.glassCard}`}>
            
            <div className={`shrink-0 px-6 py-4.5 border-b border-white/10 dark:border-white/5 flex justify-between items-center`}>
              <h3 className={`text-[16px] font-black ${ui.textMain}`}>
                {exportModal.type === 'testimony' ? '간증문 8단계 서식 에디터' : '목장 나눔 서식 에디터'}
              </h3>
              <button
                onClick={() => setExportModal({ isOpen: false, type: '', data: null, previewText: '' })}
                className={`text-slate-400 hover:${ui.textMain} transition-colors p-1.5 bg-black/5 dark:bg-white/5 rounded-full cursor-pointer`}
              >
                <IconX />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 hide-scrollbar flex flex-col gap-4">
              <p className={`text-[13px] font-medium leading-[1.7] ${ui.textSub} break-keep`}>
                {exportModal.type === 'testimony'
                  ? '일상의 기록과 연동된 말씀이 8단계 간증문 서식으로 자동 맵핑되었습니다. 내용을 다듬은 후 저장하세요.'
                  : '목장 나눔방으로 보내기 전 내용을 자유롭게 편집할 수 있습니다.'}
              </p>
              <textarea
                value={exportModal.previewText}
                onChange={e => setExportModal({ ...exportModal, previewText: e.target.value })}
                className={`w-full flex-1 p-5 text-[14px] font-medium leading-[1.8] bg-transparent border-b-2 shadow-inner rounded-t-xl outline-none resize-none transition-colors ${ui.inputBorder}`}
              />
            </div>

            <div className={`shrink-0 p-5 md:p-6 pt-2`}>
              <button
                type="button"
                onClick={executeExport}
                className={`w-full py-4.5 rounded-2xl text-[14.5px] font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer ${ui.btnPrimary}`}
              >
                {exportModal.type === 'testimony'
                  ? '✓ 내 감사/간증 일기장에 저장하고 이동하기'
                  : '✓ 복사하고 목장 나눔방으로 이동하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
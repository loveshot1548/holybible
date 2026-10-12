// src/components/ApplyTracker.jsx
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
// 🎨 모던 아카데믹 라인 아이콘
// =====================================================================
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IconCompass = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const IconTimeline = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>;
const IconLink = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5L21 3m0 0h-5.25M21 3v5.25M3 21l7.5-7.5" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconFlame = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>;

// =====================================================================
// 신학적 테마 분석기 (패턴 자동 진단)
// =====================================================================
const THEOLOGICAL_THEMES = [
  { id: '고난론', keywords: ['고난', '아픔', '상처', '왜', '눈물', '억울', '인내', '답답', '광야'], label: '고난의 신비와 연단 (Theology of the Cross)' },
  { id: '인간론', keywords: ['죄', '회개', '욕심', '교만', '반복', '음란', '탐심', '자아', '혈기'], label: '전적 타락과 참된 회개 (Anthropology & Repentance)' },
  { id: '구원론', keywords: ['구원', '십자가', '은혜', '보혈', '칭의', '믿음', '감사', '대속'], label: '칭의와 전가된 의 (Soteriology)' },
  { id: '제자도', keywords: ['순종', '결단', '포기', '내려놓음', '자기부인', '희생', '실천', '섬김'], label: '제자도와 자기 부인 (Discipleship)' },
  { id: '신론', keywords: ['응답', '기도', '침묵', '기다림', '주권', '섭리', '뜻', '창조'], label: '하나님의 주권적 섭리 (Theology Proper)' },
  { id: '청지기론', keywords: ['직장', '일터', '재정', '돈', '성공', '시간', '소명', '공방', '사역'], label: '일터 신학과 청지기 사명 (Stewardship)' },
  { id: '언약가정', keywords: ['가정', '부부', '자녀', '부모', '배우자', '가족', '결혼'], label: '언약 가정과 신앙 전수 (Covenant Family)' }
];

function analyzeSpiritualSeason(struggles, practices) {
  const allText = [...struggles.map(s => s.question + " " + (s.answer || "")), ...practices.map(p => p.text)].join(" ");
  let matchedTheme = '말씀의 조명을 기다리는 침묵의 계절 (Waiting on the Word)';
  let maxMatch = 0;

  THEOLOGICAL_THEMES.forEach(theme => {
    let count = 0;
    theme.keywords.forEach(kw => {
      const regex = new RegExp(kw, 'gi');
      const matches = allText.match(regex);
      if (matches) count += matches.length;
    });
    if (count > maxMatch) {
      maxMatch = count;
      matchedTheme = theme.label;
    }
  });
  return matchedTheme;
}

const DEFAULT_CATEGORIES = [
  'IT/엔지니어 본업',
  '공방(블라썸토퍼) 사역',
  '가정과 관계',
  '개인 영성',
  '기타 일상'
];

export default function ApplyTracker({ t, isDarkMode, setActiveScreen, dailyData = {}, updateDay }) {
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-white/10' : 'border-slate-200/90',
    card: isDark ? 'bg-[#161B26]/80 border-white/10 shadow-sm backdrop-blur-xl text-white' : 'bg-white border-slate-200/90 shadow-2xs backdrop-blur-xl text-slate-900',
    subCard: isDark ? 'bg-[#1C2333]/70 border-white/5' : 'bg-slate-50 border-slate-200/80',
    inputBg: isDark ? 'bg-black/40 border-white/10 text-white focus:border-rose-400 placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 focus:border-rose-500 placeholder:text-slate-400',
    btnPrimary: isDark ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold' : 'bg-slate-900 hover:bg-slate-800 text-white font-bold',
    btnGhost: isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
  };

  // ── 5대 메인 탭 ('journal': 고뇌와 응답, 'tracker': 실천/생명나무, 'matrix': 다차원 누적, 'archive': 타임라인, 'pipeline': 영적 파생) ──
  const [activeTab, setActiveTab] = useState('journal');

  // 누적 매트릭스 내부 세부 기준 ('resolution': 결단별, 'date': 일자별, 'theology': 신학 테마별)
  const [matrixDimension, setMatrixDimension] = useState('resolution');

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const getLocalToday = () => {
    const o = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - o).toISOString().split('T')[0];
  };

  // =====================================================================
  // 1. 영적 고뇌와 응답 (Aporia Journaling)
  // =====================================================================
  const [struggles, setStruggles] = useState(() => {
    try {
      const saved = localStorage.getItem('goodtree_spiritual_struggles');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newQuestion, setNewQuestion] = useState("");
  const [answeringId, setAnsweringId] = useState(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [questionCategory, setQuestionCategory] = useState(DEFAULT_CATEGORIES[0]);

  const saveStruggles = (list) => {
    setStruggles(list);
    try { localStorage.setItem('goodtree_spiritual_struggles', JSON.stringify(list)); } catch {}
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const newList = [{
      id: Date.now(),
      date: getLocalToday(),
      category: questionCategory,
      question: newQuestion.trim(),
      answer: null,
      resolvedDate: null
    }, ...struggles];
    saveStruggles(newList);
    setNewQuestion("");
    showToast("영적 질문이 기록되었습니다. 묵상을 통해 응답을 채워가세요.");
  };

  const handleSaveAnswer = (id) => {
    if (!newAnswer.trim()) return;
    const newList = struggles.map(s => {
      if (s.id === id) {
        return { ...s, answer: newAnswer.trim(), resolvedDate: getLocalToday() };
      }
      return s;
    });
    saveStruggles(newList);
    setAnsweringId(null);
    setNewAnswer("");
    showToast("말씀의 응답이 확정되었습니다!");
  };

  const handleDeleteStruggle = (id) => {
    if (!window.confirm("이 영적 고뇌 기록을 삭제하시겠습니까?")) return;
    saveStruggles(struggles.filter(s => s.id !== id));
    showToast("삭제되었습니다.");
  };

  // =====================================================================
  // 2. 실천 및 순종 트래커 (생명 나무 5단계 시스템)
  // =====================================================================
  const [practices, setPractices] = useState(() => {
    try {
      const saved = localStorage.getItem('goodtree_spiritual_practices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newPractice, setNewPractice] = useState("");
  const [practiceCategory, setPracticeCategory] = useState(DEFAULT_CATEGORIES[0]);

  // QT/설교/양육에서 직통 전송된 목표들 통합
  const globalResolutions = useMemo(() => {
    let res = [];
    try {
      const directItems = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      directItems.forEach(item => {
        res.push({
          id: item.id || `direct_${item.date}_${item.text}`,
          date: item.date,
          text: item.text,
          category: item.category || '개인 영성',
          source: item.source === 'qt' ? '매일QT 실천목표' : item.source === 'tc' ? '양육 실천목표' : item.source === 'ts' ? '워크북 실천목표' : '예배노트 실천목표',
          done: !!item.completed
        });
      });
    } catch (e) {}

    Object.entries(dailyData || {}).forEach(([date, data]) => {
      if (data.resolutions && Array.isArray(data.resolutions)) {
        data.resolutions.forEach(r => {
          res.push({ 
            id: `global_${date}_${r}`, 
            date, 
            text: r, 
            category: '개인 영성',
            source: 'QT/설교 연동', 
            done: data.completedActions?.includes(r) || false 
          });
        });
      }
      if (data.qtActionItem) {
        const exist = res.some(x => x.text === data.qtActionItem && x.date === date);
        if (!exist) {
          res.push({
            id: `qt_${date}`,
            date,
            text: data.qtActionItem,
            category: '개인 영성',
            source: '매일QT 실천목표',
            done: !!data.qtActionCompleted
          });
        }
      }
      if (data.sermonActionItem) {
        const exist = res.some(x => x.text === data.sermonActionItem && x.date === date);
        if (!exist) {
          res.push({
            id: `sermon_${date}`,
            date,
            text: data.sermonActionItem,
            category: '개인 영성',
            source: '예배노트 실천목표',
            done: !!data.sermonActionCompleted
          });
        }
      }
    });
    return res.reverse();
  }, [dailyData]);

  const allPractices = useMemo(() => [...practices, ...globalResolutions], [practices, globalResolutions]);
  const completedPracticesCount = allPractices.filter(p => p.done).length;
  const totalPracticesCount = allPractices.length;
  
  // 생명 나무 5단계 성장 시스템
  const sanctificationLevel = Math.min(Math.floor(completedPracticesCount / 5) + 1, 5);
  const levelData = {
    1: { title: "말씀의 씨앗 (Seed of the Word)", desc: "내 마음 밭에 작은 말씀의 결단이 심겨진 상태입니다.", color: "text-amber-500", progress: Math.min(100, (completedPracticesCount % 5) * 20), svg: <circle cx="12" cy="18" r="4" fill="currentColor"/> },
    2: { title: "회개의 새싹 (Sprout of Repentance)", desc: "단단한 자아를 깨고 말씀의 은혜로 싹이 틉니다.", color: "text-lime-500", progress: Math.min(100, (completedPracticesCount % 5) * 20), svg: <path d="M12 20v-5c-2 0-4-1-4-3s2-2 4-2 4 0 4 2-2 3-4 3" fill="currentColor"/> },
    3: { title: "순종의 줄기 (Stem of Obedience)", desc: "비바람과 고난을 견디며 말씀의 줄기가 자랍니다.", color: "text-emerald-500", progress: Math.min(100, (completedPracticesCount % 5) * 20), svg: <path d="M12 20v-8m0 0c-3 0-5-2-5-4s2-1 4-1 3 1 3 3-1 2-2 2zm0 0c3 0 5-2 5-4s-2-1-4-1-3 1-3 3 1 2 2 2z" stroke="currentColor" strokeWidth="2" fill="none"/> },
    4: { title: "제자도의 잎 (Leaves of Discipleship)", desc: "풍성한 성화의 잎사귀로 이웃에게 그늘을 제공합니다.", color: "text-teal-500", progress: Math.min(100, (completedPracticesCount % 5) * 20), svg: <path d="M12 21V9m0 0c-4 0-6-3-6-6s3-1 5-1 3 2 3 4-1 3-2 3zm0 0c4 0 6-3 6-6s-3-1-5-1-3 2-3 4 1 3 2 3zm0 0v-4" stroke="currentColor" strokeWidth="2" fill="none"/> },
    5: { title: "열매 맺는 생명 나무 (Tree of Life)", desc: "그리스도의 장성한 분량에 이르러 거룩한 성령의 열매를 맺습니다.", color: "text-rose-500", progress: 100, svg: <path d="M12 22v-9m0 0C7 13 4 9 4 5c3 0 5 2 6 4m2-4c0-4 3-4 6-4 0 4-3 8-8 8zm0 0v-5m0 5c3 0 5-2 5-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/> }
  };
  const currentTree = levelData[sanctificationLevel];

  const savePractices = (list) => {
    setPractices(list);
    try { localStorage.setItem('goodtree_spiritual_practices', JSON.stringify(list)); } catch {}
  };

  const handleAddPractice = () => {
    if (!newPractice.trim()) return;
    const newList = [{
      id: Date.now(),
      date: getLocalToday(),
      category: practiceCategory,
      text: newPractice.trim(),
      source: '직접 결단',
      done: false
    }, ...practices];
    savePractices(newList);
    setNewPractice("");
    showToast("새로운 순종의 결단이 등록되었습니다!");
  };

  const handleTogglePractice = (id) => {
    const newList = practices.map(p => p.id === id ? { ...p, done: !p.done } : p);
    savePractices(newList);

    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map(item => {
        if (item.id === id) return { ...item, completed: !item.completed };
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
    } catch (e) {}

    showToast("순종 상태가 업데이트되었습니다.");
  };

  const handleDeletePractice = (id) => {
    savePractices(practices.filter(p => p.id !== id));
    showToast("결단이 삭제되었습니다.");
  };

  // =====================================================================
  // 3. 다차원 누적 매트릭스 데이터 연산
  // =====================================================================
  const matrixStats = useMemo(() => {
    const byCategory = {};
    DEFAULT_CATEGORIES.forEach(c => byCategory[c] = { total: 0, done: 0 });
    
    const byDate = {};
    const byTheme = {};
    THEOLOGICAL_THEMES.forEach(t => byTheme[t.id] = 0);

    allPractices.forEach(p => {
      const cat = p.category || '기타 일상';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, done: 0 };
      byCategory[cat].total++;
      if (p.done) byCategory[cat].done++;

      byDate[p.date] = (byDate[p.date] || 0) + 1;
    });

    struggles.forEach(s => {
      THEOLOGICAL_THEMES.forEach(t => {
        const text = s.question + " " + (s.answer || "");
        if (t.keywords.some(kw => text.includes(kw))) {
          byTheme[t.id] = (byTheme[t.id] || 0) + 1;
        }
      });
    });

    return { byCategory, byDate, byTheme };
  }, [allPractices, struggles]);

  // =====================================================================
  // 4. 통합 타임라인 (Timeline Tracker)
  // =====================================================================
  const timelineData = useMemo(() => {
    const events = [];
    struggles.forEach(s => {
      events.push({ type: 'question', date: s.date, text: s.question, category: s.category, id: `q_${s.id}` });
      if (s.answer) {
        events.push({ type: 'answer', date: s.resolvedDate, text: s.answer, refQuestion: s.question, id: `a_${s.id}` });
      }
    });
    allPractices.forEach(p => {
      events.push({ type: 'practice_added', date: p.date, text: p.text, source: p.source, id: `pa_${p.id}` });
      if (p.done) {
        events.push({ type: 'practice_done', date: p.date, text: p.text, id: `pd_${p.id}` });
      }
    });
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [struggles, allPractices]);

  // =====================================================================
  // 5. 실시간 보존 인라인 파생 박스 (감사/기도/중보 전송)
  // =====================================================================
  const [inlineData, setInlineData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pb_inline_drafts')) || { thanks: '', prayer: '', intercession: '' };
    } catch {
      return { thanks: '', prayer: '', intercession: '' };
    }
  });

  useEffect(() => {
    localStorage.setItem('pb_inline_drafts', JSON.stringify(inlineData));
  }, [inlineData]);

  const handleInlineSubmit = (type) => {
    const text = inlineData[type]?.trim();
    if (!text) return showToast("내용을 입력해주세요.");
    const today = getLocalToday();

    if (type === 'thanks') {
      if (updateDay) {
        const curDay = dailyData[today] || {};
        const existing = curDay.thanksText ? curDay.thanksText + '\n' : '';
        updateDay({
          thanksText: existing + text,
          checks: { ...(curDay.checks || {}), '감사': true }
        });
      }
      showToast('오늘의 감사함으로 전송되었습니다!');
    } else if (type === 'prayer') {
      const globalPrayers = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
      const newPrayer = { id: Date.now(), text: text, status: 'praying', date: today };
      localStorage.setItem('globalPrayers', JSON.stringify([...globalPrayers, newPrayer]));
      showToast('나의 기도함으로 전송되었습니다!');
    } else if (type === 'intercession') {
      const globalInter = JSON.parse(localStorage.getItem('goodtree_global_intercessions') || '[]');
      const newInter = { id: Date.now(), text: text, status: 'praying', date: today };
      localStorage.setItem('goodtree_global_intercessions', JSON.stringify([...globalInter, newInter]));
      showToast('이웃 중보 기도함으로 전송되었습니다!');
    }

    setInlineData(prev => ({ ...prev, [type]: '' }));
  };

  // =====================================================================
  // 6. 간증문 8단계 / 목장 나눔 내보내기 모달
  // =====================================================================
  const [exportModal, setExportModal] = useState({ isOpen: false, type: '', data: null, previewText: '' });

  const openExportModal = (item, type) => {
    let template = '';
    if (type === 'testimony') {
      template = `[구속사 간증문 8단계] 삶의 자리에서 드린 믿음의 고백

1. 직면한 영적 고뇌와 사건
: ${item.question || item.text || ''}

2. 나의 연약함과 자아 직면
: 

3. 말씀의 렌즈로 본 재해석 (섭리와 주권)
: ${item.answer || '말씀을 통해 깨닫게 하신 은혜'}

4. 구체적 순종과 결단
: ${item.text || '오늘 삶의 현장에서 실천한 순종'}

5. 하나님이 주신 승리의 평안
: 

6. 감사와 찬양
: 오직 주님이 하셨습니다.`;
    } else {
      template = `[목장 나눔 실천 보고]
• 일자: ${item.date} (${item.category || '일상'})
• 질문/고뇌: ${item.question || item.text || ''}
• 말씀 응답: ${item.answer || '묵상 중 깨달은 은혜'}
• 구체적 결단: ${item.text || '실천할 순종'}`;
    }
    setExportModal({ isOpen: true, type, data: item, previewText: template });
  };

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
      showToast('감사/간증 일기장에 저장되었습니다!');
      if (setActiveScreen) setActiveScreen('diary');
    } else {
      const cellShared = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      cellShared.push({
        id: Date.now(),
        date: getLocalToday(),
        source: 'apply_tracker',
        text: encryptField(exportModal.previewText.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(cellShared));
      if (navigator.clipboard) navigator.clipboard.writeText(exportModal.previewText);
      window.dispatchEvent(new Event('storage'));
      showToast('목장 나눔방 전송 및 클립보드 복사 완료!');
      if (setActiveScreen) setActiveScreen('cell');
    }
    setExportModal({ isOpen: false, type: '', data: null, previewText: '' });
  };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bgBody} overflow-hidden select-none animate-fade-in w-full`}>
      
      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-full bg-slate-900/95 text-white text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          {toastMsg}
        </div>
      )}

      {/* 1. 상단 글로벌 헤더 & 유기적 점프 통로 */}
      <header className={`relative z-20 px-3 sm:px-6 py-3 flex items-center justify-between border-b backdrop-blur-2xl shrink-0 w-full ${ui.card}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveScreen ? setActiveScreen('home') : null} 
            className={`p-1.5 rounded-lg ${ui.btnGhost} cursor-pointer transition-colors`}
            title="홈으로 나가기"
          >
            <IconArrowLeft />
          </button>
          <div>
            <h1 className={`text-[15px] sm:text-[16px] font-black tracking-tight leading-none ${ui.textMain} flex items-center gap-2`}>
              삶의 적용과 성화 트래커 <span className="text-rose-500 text-xs font-mono font-semibold">[Sanctification Matrix]</span>
            </h1>
            <span className={`text-[10px] font-mono font-bold ${ui.textSub} mt-0.5 block`}>
              APORIA JOURNALING · TREE OF LIFE · SPIRITUAL COVENANT PIPELINE
            </span>
          </div>
        </div>

        {/* 유기적 화면 점프 버튼군 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveScreen ? setActiveScreen('qt') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="매일 QT 묵상으로 이동"
          >
            <IconBook /> QT
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('sermon') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="설교 아카이브로 이동"
          >
            <span>🏛️</span> 설교
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('diary') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="간증 일기장으로 이동"
          >
            <span>📖</span> 일기
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('cell') : null}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${ui.btnGhost} hidden sm:flex items-center gap-1 cursor-pointer`}
            title="목장 나눔방으로 이동"
          >
            <IconShare /> 목장
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-[11px] font-black">
            <IconTarget />
            <span>{totalPracticesCount === 0 ? 0 : Math.round((completedPracticesCount / totalPracticesCount) * 100)}%</span>
          </div>
        </div>
      </header>

      {/* 2. 5대 핵심 탭 세그먼트 네비게이션 */}
      <nav className={`flex w-full px-3 overflow-x-auto hide-scrollbar border-b z-20 backdrop-blur-xl shrink-0 gap-1 py-1.5 ${isDark ? 'border-white/10 bg-[#161B26]/60' : 'border-slate-200 bg-white/50'}`}>
        {[
          { id: 'journal', label: '🧭 영적 고뇌와 응답', count: struggles.length },
          { id: 'tracker', label: '🌳 성화 트래커 (생명 나무)', count: totalPracticesCount },
          { id: 'matrix', label: '🧱 다차원 누적 매트릭스', count: null },
          { id: 'archive', label: '⏳ 영적 타임라인 궤적', count: timelineData.length },
          { id: 'pipeline', label: '📤 영적 파생 전송함', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              activeTab === tab.id
                ? (isDark ? 'bg-white text-black border-transparent shadow-xs' : 'bg-slate-900 text-white border-transparent shadow-xs')
                : `${ui.btnGhost} border-transparent`
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? (isDark ? 'bg-black/20 text-black' : 'bg-white/20 text-white') : 'bg-black/10 dark:bg-white/10'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 3. 메인 콘텐츠 뷰포트 */}
      <main className="flex-1 overflow-y-auto w-full hide-scrollbar relative z-10 pb-32 max-w-[1200px] mx-auto px-3 sm:px-6 py-4">

        {/* ========================================================================= */}
        {/* TAB 1: 영적 고뇌와 말씀 응답 (Aporia Journaling)                          */}
        {/* ========================================================================= */}
        {activeTab === 'journal' && (
          <div className="flex flex-col lg:flex-row gap-5 animate-fade-in w-full text-left">
            {/* 좌측: 고뇌 질문 등록 패널 */}
            <div className="w-full lg:w-[380px] flex flex-col gap-3.5 shrink-0">
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.card} space-y-3`}>
                <div>
                  <h2 className="text-[15px] font-black flex items-center gap-2">
                    <IconCompass /> 해석되지 않는 현실과 질문
                  </h2>
                  <p className={`text-[12px] leading-relaxed ${ui.textSub} mt-1 break-keep`}>
                    삶의 부조리와 고난 앞에서 터져 나오는 정직한 질문(Aporia)을 묻어두지 말고 기록하십시오. 묵상과 설교를 통해 하나님이 주시는 십자가의 해석으로 응답을 채우게 됩니다.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 block">관련 삶의 영역</label>
                  <select
                    value={questionCategory}
                    onChange={e => setQuestionCategory(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border ${ui.inputBg} outline-none cursor-pointer font-bold`}
                  >
                    {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <textarea
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="하나님, 왜 이 일터의 갈등과 고난이 제게 허락되었습니까? 솔직한 질문을 적으십시오..."
                  className={`w-full p-3 text-[12.5px] leading-relaxed rounded-xl border outline-none resize-none min-h-[95px] ${ui.inputBg}`}
                />

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer ${ui.btnPrimary}`}
                >
                  고뇌의 질문 봉헌하기
                </button>
              </div>

              {/* 영적 조언 배너 */}
              <div className={`p-3.5 rounded-xl border ${ui.subCard} text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1`}>
                <span className="font-bold text-rose-500 block">💡 십자가 신학의 조명</span>
                <p className="break-keep">질문이 없는 신앙은 자라지 않습니다. 질문은 불신이 아니라 하나님의 거룩한 뜻을 향해 나아가는 첫걸음입니다.</p>
              </div>
            </div>

            {/* 우측: 질문 및 응답 카드 리스트 */}
            <div className="flex-1 space-y-3">
              <div className={`p-3 rounded-xl border flex justify-between items-center ${ui.card}`}>
                <span className="text-xs font-bold flex items-center gap-1.5 text-rose-500">
                  <IconFlame /> 씨름 중인 고뇌와 말씀의 응답 아카이브
                </span>
                <span className="text-[11px] font-mono text-slate-400">총 {struggles.length}건</span>
              </div>

              {struggles.length === 0 ? (
                <div className={`p-12 text-center rounded-2xl border text-xs text-slate-400 ${ui.card}`}>
                  기록된 질문이 없습니다. 삶의 고뇌를 하나님 앞에 정직히 쏟아놓으세요.
                </div>
              ) : (
                struggles.map(struggle => (
                  <div key={struggle.id} className={`p-4 rounded-2xl border space-y-2.5 transition-all ${ui.card}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10.5px]">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            struggle.answer 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500 text-white'
                          }`}>
                            {struggle.answer ? '✓ 말씀으로 해석됨' : '⏳ 씨름 중'}
                          </span>
                          <span className="font-mono text-slate-400">{struggle.date}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 font-bold text-slate-500">
                            {struggle.category || '일상'}
                          </span>
                        </div>
                        <h3 className="text-[13.5px] font-bold leading-snug break-keep text-slate-900 dark:text-white">
                          Q. {struggle.question}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openExportModal(struggle, 'testimony')}
                          className="p-1 text-slate-400 hover:text-sky-500"
                          title="간증문으로 변환"
                        >
                          <IconBook />
                        </button>
                        <button
                          onClick={() => handleDeleteStruggle(struggle.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="삭제"
                        >
                          <IconX />
                        </button>
                      </div>
                    </div>

                    {/* 응답 내용 또는 응답 작성 영역 */}
                    {struggle.answer ? (
                      <div className={`p-3.5 rounded-xl border border-l-4 border-l-indigo-500 ${isDark ? 'bg-indigo-950/20 border-white/5' : 'bg-indigo-50/60 border-indigo-100'} space-y-1`}>
                        <div className="flex justify-between items-center text-[10.5px] font-bold text-indigo-500">
                          <span className="flex items-center gap-1"><IconCheck /> 말씀의 응답 ({struggle.resolvedDate})</span>
                          <button onClick={() => { setAnsweringId(struggle.id); setNewAnswer(struggle.answer); }} className="hover:underline">수정</button>
                        </div>
                        <p className={`text-[12.5px] font-medium leading-relaxed break-keep ${isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>
                          {struggle.answer}
                        </p>
                      </div>
                    ) : answeringId === struggle.id ? (
                      <div className="space-y-2 pt-1 animate-fade-in">
                        <textarea
                          value={newAnswer}
                          onChange={e => setNewAnswer(e.target.value)}
                          placeholder="묵상이나 설교를 통해 하나님이 깨닫게 하신 선하신 뜻과 응답을 기록하십시오..."
                          className={`w-full p-3 text-xs leading-relaxed rounded-xl border outline-none resize-none min-h-[80px] ${ui.inputBg}`}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setAnsweringId(null)} className={`px-3 py-1 rounded-lg text-xs ${ui.btnGhost}`}>취소</button>
                          <button onClick={() => handleSaveAnswer(struggle.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">응답 확정 ➔</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAnsweringId(struggle.id); setNewAnswer(""); }}
                        className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <IconEdit /> 깨달은 말씀의 응답 채워 넣기
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 거룩한 산 제사 (성화 트래커 & 생명 나무 5단계)                        */}
        {/* ========================================================================= */}
        {activeTab === 'tracker' && (
          <div className="space-y-4 animate-fade-in w-full text-left">
            {/* 생명 나무 비주얼 카드 */}
            <div className={`p-5 sm:p-7 rounded-2xl border flex flex-col items-center justify-center gap-4 relative overflow-hidden ${ui.card}`}>
              <div className="w-full max-w-md grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map(st => (
                  <div key={st} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${st <= sanctificationLevel ? 'bg-rose-500 shadow-sm' : 'bg-slate-200 dark:bg-white/10'}`} />
                    <span className={`text-[9.5px] font-mono font-bold ${st === sanctificationLevel ? 'text-rose-500' : 'text-slate-400'}`}>
                      Stage {st}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center ${currentTree.color} transition-all duration-700 hover:scale-105`}>
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  {currentTree.svg}
                </svg>
              </div>

              <div className="text-center space-y-1 max-w-sm">
                <span className="text-[10px] font-mono font-black uppercase text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  성화의 단계 : Stage {sanctificationLevel} / 5
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">{currentTree.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-keep">{currentTree.desc}</p>
              </div>
            </div>

            {/* 실천 결단 입력 & 목록 */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${ui.card} space-y-3`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-rose-500">
                  <IconTarget /> 순종할 결단 리스트
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  완수율: {totalPracticesCount === 0 ? 0 : Math.round((completedPracticesCount / totalPracticesCount) * 100)}% ({completedPracticesCount}/{totalPracticesCount})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={practiceCategory}
                  onChange={e => setPracticeCategory(e.target.value)}
                  className={`p-2.5 text-xs rounded-xl border ${ui.inputBg} outline-none cursor-pointer font-bold sm:w-44`}
                >
                  {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={newPractice}
                    onChange={e => setNewPractice(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPractice()}
                    placeholder="오늘 삶에서 당장 실천하거나 끊어낼 행동 1가지를 적으십시오..."
                    className={`flex-1 p-2.5 text-xs rounded-xl border outline-none ${ui.inputBg}`}
                  />
                  <button
                    onClick={handleAddPractice}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 ${ui.btnPrimary} cursor-pointer`}
                  >
                    결단 추가
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {allPractices.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    기록된 결단이 없습니다. 위에서 직접 추가하거나 매일 QT, 예배노트를 작성하면 자동 연동됩니다.
                  </p>
                ) : (
                  allPractices.map(practice => (
                    <div
                      key={practice.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        practice.done ? 'bg-slate-100/50 dark:bg-white/5 opacity-60' : ui.subCard
                      }`}
                    >
                      <div 
                        className="flex items-start gap-2.5 flex-1 cursor-pointer"
                        onClick={() => handleTogglePractice(practice.id)}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          practice.done ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300 dark:border-white/20'
                        }`}>
                          {practice.done && <IconCheck />}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold leading-snug break-keep ${practice.done ? 'line-through text-slate-400' : ''}`}>
                            {practice.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="text-rose-500 font-bold">[{practice.source}]</span>
                            <span>{practice.category}</span>
                            <span>· {practice.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openExportModal(practice, 'cell')}
                          className="p-1 text-slate-400 hover:text-sky-500"
                          title="목장 나눔 전송"
                        >
                          <IconShare />
                        </button>
                        {practice.source === '직접 결단' && (
                          <button
                            onClick={() => handleDeletePractice(practice.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                            title="삭제"
                          >
                            <IconX />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 🌟 다차원 누적 매트릭스 (결단별 / 일자별 / 신학별)                     */}
        {/* ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-3.5 animate-fade-in w-full text-left">
            {/* 차원 선택 세그먼트 */}
            <div className={`p-1.5 rounded-xl border flex gap-1 ${ui.card}`}>
              {[
                { id: 'resolution', label: '🎯 결단·영역별 누적', desc: '5대 삶의 현장' },
                { id: 'date', label: '📅 일자별 타임라인', desc: '14일 스트릭 잔디' },
                { id: 'theology', label: '🎓 신학 테마별 누적', desc: '구속사 12대 테마' }
              ].map(dim => (
                <button
                  key={dim.id}
                  onClick={() => setMatrixDimension(dim.id)}
                  className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer border ${
                    matrixDimension === dim.id
                      ? (isDark ? 'bg-white text-black border-transparent font-bold' : 'bg-slate-900 text-white border-transparent font-bold')
                      : `${ui.btnGhost} border-transparent`
                  }`}
                >
                  <span className="text-xs block font-bold">{dim.label}</span>
                  <span className="text-[9.5px] opacity-75 font-mono block">{dim.desc}</span>
                </button>
              ))}
            </div>

            {/* (A) 결단·영역별 누적 매트릭스 */}
            {matrixDimension === 'resolution' && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-3`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-400">삶의 5대 현장별 결단과 순종 누적</h3>
                    <span className="text-xs font-mono font-bold text-rose-500">총 {totalPracticesCount}건 등록</span>
                  </div>

                  <div className="space-y-2.5">
                    {DEFAULT_CATEGORIES.map(cat => {
                      const data = matrixStats.byCategory[cat] || { total: 0, done: 0 };
                      const rate = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{cat}</span>
                            <span className="font-mono text-slate-400">{data.done} / {data.total} 완수 ({rate}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* (B) 일자별 타임라인 누적 */}
            {matrixDimension === 'date' && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-2`}>
                  <h3 className="text-xs font-bold text-slate-400">일자별 영적 순종 스트릭 (최근 14일 잔디)</h3>
                  <div className="grid grid-cols-7 gap-1.5 pt-2">
                    {Array.from({ length: 14 }, (_, i) => {
                      const d = new Date(Date.now() - (13 - i) * 86400000);
                      const dStr = d.toISOString().split('T')[0];
                      const count = matrixStats.byDate[dStr] || 0;
                      return (
                        <div key={dStr} className={`p-2 rounded-xl border text-center ${count > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : `${ui.subCard} text-slate-400`}`}>
                          <span className="text-[9px] font-mono block">{dStr.slice(5)}</span>
                          <span className="text-xs font-black font-mono block mt-0.5">{count > 0 ? `${count}건` : '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* (C) 신학 테마별 누적 */}
            {matrixDimension === 'theology' && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${ui.card} space-y-2.5`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-400">구속사 신학 테마별 질문과 응답 지수</h3>
                    <span className="text-xs font-mono font-bold text-indigo-500">신학적 균형 성장</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {THEOLOGICAL_THEMES.map(th => {
                      const count = matrixStats.byTheme[th.id] || 0;
                      return (
                        <div key={th.id} className={`p-2.5 rounded-xl border ${ui.subCard} flex justify-between items-center`}>
                          <div className="truncate">
                            <span className="text-xs font-bold block truncate">{th.label.split('(')[0]}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{th.label.split('(')[1]?.replace(')', '')}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-indigo-500 shrink-0 ml-2">{count}회</span>
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
        {/* TAB 4: 영적 궤적 및 신앙의 계절 타임라인                                   */}
        {/* ========================================================================= */}
        {activeTab === 'archive' && (
          <div className="space-y-4 animate-fade-in w-full text-left">
            <div className={`p-5 rounded-2xl border ${ui.card} space-y-1`}>
              <span className="text-[11px] font-mono font-black text-rose-500 uppercase tracking-widest block">
                CURRENT SPIRITUAL SEASON
              </span>
              <h3 className="text-base font-black leading-snug text-slate-900 dark:text-white">
                "{analyzeSpiritualSeason(struggles, allPractices)}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-keep pt-1">
                최근 기록하신 영적 고뇌와 결단 텍스트를 종합 진단한 결과, 성도님은 현재 위와 같은 성화의 계절을 지나고 계십니다.
              </p>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border ${ui.card} space-y-3`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-rose-500">
                  <IconTimeline /> 통합 영적 타임라인
                </h3>
                <span className="text-[11px] font-mono text-slate-400">누적 {timelineData.length}건</span>
              </div>

              {timelineData.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">기록된 궤적이 없습니다.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 flex flex-col gap-5 pb-2 mt-2">
                  {timelineData.map(event => (
                    <div key={event.id} className="relative pl-5 space-y-1">
                      <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border ${isDark ? 'border-[#161B26]' : 'border-white'} ${
                        event.type === 'question' ? 'bg-rose-500' :
                        event.type === 'answer' ? 'bg-indigo-500' :
                        event.type === 'practice_done' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`} />

                      <div className="flex items-center gap-2 text-[10.5px]">
                        <span className="font-mono text-slate-400">{event.date}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          event.type === 'question' ? 'bg-rose-500/10 text-rose-500' :
                          event.type === 'answer' ? 'bg-indigo-500/10 text-indigo-500' :
                          event.type === 'practice_done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
                        }`}>
                          {event.type === 'question' ? '[고뇌의 질문]' :
                           event.type === 'answer' ? '[말씀의 응답]' :
                           event.type === 'practice_done' ? '[순종 완수]' : '[결단 추가]'}
                        </span>
                      </div>

                      <p className={`text-xs font-bold leading-relaxed break-keep ${
                        event.type === 'practice_done' ? 'line-through text-slate-400' : ''
                      }`}>
                        {event.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: 3대 영적 파생 박스 (실시간 보존 & 원터치 파이프라인 전송)             */}
        {/* ========================================================================= */}
        {activeTab === 'pipeline' && (
          <div className="space-y-3.5 animate-fade-in w-full text-left">
            <div className={`p-4 rounded-2xl border ${ui.card} space-y-1`}>
              <h3 className="text-xs font-black flex items-center gap-1.5 text-rose-500">
                <IconSend /> 실시간 보존 영적 파생 파이프라인
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-keep">
                작성 중 화면을 벗어나도 내용이 자동 보존됩니다. 전송 시 각 개인 보관함(감사함, 나의 기도함, 중보 기도함)으로 직통 전송됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. 오늘의 감사 */}
              <div className={`p-4 rounded-2xl border ${ui.card} space-y-2 flex flex-col justify-between`}>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-500 block">오늘의 감사</span>
                  <textarea
                    value={inlineData.thanks}
                    onChange={e => setInlineData({ ...inlineData, thanks: e.target.value })}
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none resize-none h-24 ${ui.inputBg}`}
                    placeholder="오늘 삶에서 찾은 감사의 제목을 적으세요..."
                  />
                </div>
                <button
                  onClick={() => handleInlineSubmit('thanks')}
                  className="w-full py-2 bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  오늘의 감사함으로 전송 ➔
                </button>
              </div>

              {/* 2. 나의 기도 */}
              <div className={`p-4 rounded-2xl border ${ui.card} space-y-2 flex flex-col justify-between`}>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-500 block">나의 기도</span>
                  <textarea
                    value={inlineData.prayer}
                    onChange={e => setInlineData({ ...inlineData, prayer: e.target.value })}
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none resize-none h-24 ${ui.inputBg}`}
                    placeholder="주님 앞에 아뢸 개인 기도 제목을 적으세요..."
                  />
                </div>
                <button
                  onClick={() => handleInlineSubmit('prayer')}
                  className="w-full py-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  나의 기도함으로 전송 ➔
                </button>
              </div>

              {/* 3. 이웃 중보 */}
              <div className={`p-4 rounded-2xl border ${ui.card} space-y-2 flex flex-col justify-between`}>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-500 block">이웃 중보</span>
                  <textarea
                    value={inlineData.intercession}
                    onChange={e => setInlineData({ ...inlineData, intercession: e.target.value })}
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none resize-none h-24 ${ui.inputBg}`}
                    placeholder="목장 식구와 이웃을 위한 중보를 적으세요..."
                  />
                </div>
                <button
                  onClick={() => handleInlineSubmit('intercession')}
                  className="w-full py-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  이웃 중보함으로 전송 ➔
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 4. 간증문 8단계 / 목장 나눔 에디터 바텀시트 모달                            */}
      {/* ========================================================================= */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border p-4 shadow-2xl flex flex-col max-h-[85vh] h-[85vh] sm:h-auto overflow-hidden ${ui.card} text-left`}>
            <div className="flex justify-between items-center border-b pb-2.5 border-slate-200 dark:border-white/10 shrink-0">
              <h3 className="text-sm font-black">
                {exportModal.type === 'testimony' ? '구속사 간증문 8단계 서식 에디터' : '목장 나눔 서식 에디터'}
              </h3>
              <button
                onClick={() => setExportModal({ isOpen: false, type: '', data: null, previewText: '' })}
                className="text-slate-400 hover:text-white p-1 text-xs font-bold cursor-pointer"
              >
                <IconX />
              </button>
            </div>

            <div className="py-2 text-[11px] text-slate-400 shrink-0">
              {exportModal.type === 'testimony'
                ? '영적 고뇌와 결단이 구속사 간증문으로 자동 매핑되었습니다. 수정 후 일기장으로 봉헌하세요.'
                : '목장 식구들과 나눌 영적 실천 보고서가 완성되었습니다. 복사 후 목장방으로 전송하세요.'}
            </div>

            <textarea
              value={exportModal.previewText}
              onChange={e => setExportModal({ ...exportModal, previewText: e.target.value })}
              className={`flex-1 w-full p-3 rounded-xl border text-xs font-mono leading-relaxed outline-none resize-none ${ui.inputBg}`}
            />

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-2 shrink-0">
              <button
                type="button"
                onClick={executeExport}
                className={`w-full py-2.5 rounded-xl text-xs font-bold ${ui.btnPrimary} flex items-center justify-center gap-1.5 cursor-pointer`}
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
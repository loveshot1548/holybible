import React, { useState, useEffect, useMemo } from 'react';

// =====================================================================
// 모던 아카데믹 라인 아이콘 (이모지 100% 배제)
// =====================================================================
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IconCompass = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const IconTimeline = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>;
const IconLink = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5L21 3m0 0h-5.25M21 3v5.25M3 21l7.5-7.5" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

// =====================================================================
// 유틸리티: 신학적 테마 분석기 (패턴 자동 진단)
// =====================================================================
const THEOLOGICAL_THEMES = [
  { keywords: ['고난', '아픔', '상처', '왜', '눈물', '억울', '인내', '답답'], label: '고난의 신비와 연단 (Theology of the Cross)' },
  { keywords: ['죄', '회개', '욕심', '교만', '반복', '음란', '탐심', '자아'], label: '전적 타락과 참된 회개 (Anthropology & Repentance)' },
  { keywords: ['구원', '십자가', '은혜', '보혈', '칭의', '믿음', '감사'], label: '칭의와 전가된 의 (Soteriology)' },
  { keywords: ['순종', '결단', '포기', '내려놓음', '자기부인', '희생', '실천'], label: '제자도와 자기 부인 (Discipleship)' },
  { keywords: ['응답', '기도', '침묵', '기다림', '주권', '섭리', '뜻'], label: '하나님의 주권적 섭리 (Theology Proper)' }
];

function analyzeSpiritualSeason(struggles, practices) {
  const allText = [...struggles.map(s => s.question + " " + (s.answer||"")), ...practices.map(p => p.text)].join(" ");
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

export default function ApplyTracker({ t, isDarkMode, setActiveScreen, dailyData = {}, updateDay }) {
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  
  // 💡 진정한 글래스모피즘 투명도 및 컬러 시스템 적용
  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-white/10' : 'border-white/60',
    card: isDark ? 'bg-[#1C1C1E]/50 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl text-white' : 'bg-white/40 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-3xl text-slate-900',
    inputBg: isDark ? 'bg-black/40 border-white/10 text-white focus:border-rose-400 placeholder:text-slate-600' : 'bg-white/50 border-white/60 text-slate-900 focus:border-rose-500 placeholder:text-slate-500',
    btnPrimary: isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
  };

  const [activeTab, setActiveTab] = useState('journal');

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

  const saveStruggles = (list) => {
    setStruggles(list);
    try { localStorage.setItem('goodtree_spiritual_struggles', JSON.stringify(list)); } catch {}
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const newList = [{
      id: Date.now(),
      date: getLocalToday(),
      question: newQuestion.trim(),
      answer: null,
      resolvedDate: null
    }, ...struggles];
    saveStruggles(newList);
    setNewQuestion("");
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
  };

  const handleDeleteStruggle = (id) => {
    saveStruggles(struggles.filter(s => s.id !== id));
  };

  // =====================================================================
  // 2. 실천 및 순종 트래커 (거룩한 성화의 발자취 & 생명 나무)
  // =====================================================================
  const [practices, setPractices] = useState(() => {
    try {
      const saved = localStorage.getItem('goodtree_spiritual_practices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newPractice, setNewPractice] = useState("");

  // 💡 [QT 및 예배노트 실시간 연동] apply_tracker_items 및 dailyData 병합
  const globalResolutions = useMemo(() => {
    let res = [];
    
    // 1. apply_tracker_items (QT.js, Sermon.js에서 직통 전송된 실천목표)
    try {
      const directItems = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      directItems.forEach(item => {
        res.push({
          id: item.id || `direct_${item.date}_${item.text}`,
          date: item.date,
          text: item.text,
          source: item.source === 'qt' ? '매일QT 실천목표' : item.source === 'tc' ? '양육 실천목표' : item.source === 'ts' ? '워크북 실천목표' : '예배노트 실천목표',
          done: !!item.completed,
          graceLine: item.graceLine || ''
        });
      });
    } catch (e) {}

    // 2. dailyData resolutions 연동
    Object.entries(dailyData).forEach(([date, data]) => {
      if (data.resolutions && Array.isArray(data.resolutions)) {
        data.resolutions.forEach(r => {
          res.push({ 
            id: `global_${date}_${r}`, 
            date, 
            text: r, 
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
            source: '예배노트 실천목표',
            done: !!data.sermonActionCompleted
          });
        }
      }
    });
    return res.reverse();
  }, [dailyData]);

  const allPractices = [...practices, ...globalResolutions];
  const completedPracticesCount = allPractices.filter(p => p.done).length;
  const totalPracticesCount = allPractices.length;
  
  // 💡 생명 나무 5단계 성장 시스템
  const sanctificationLevel = Math.min(Math.floor(completedPracticesCount / 5) + 1, 5);
  const levelData = {
    1: { title: "말씀의 씨앗 (Seed of the Word)", desc: "내 마음 밭에 작은 말씀의 결단이 심겨진 상태입니다.", color: "text-amber-500", svg: <circle cx="12" cy="18" r="4" fill="currentColor"/> },
    2: { title: "회개의 새싹 (Sprout of Repentance)", desc: "단단한 자아를 깨고 말씀의 은혜로 싹이 틉니다.", color: "text-lime-500", svg: <path d="M12 20v-5c-2 0-4-1-4-3s2-2 4-2 4 0 4 2-2 3-4 3" fill="currentColor"/> },
    3: { title: "순종의 줄기 (Stem of Obedience)", desc: "비바람과 고난을 견디며 말씀의 줄기가 자랍니다.", color: "text-emerald-500", svg: <path d="M12 20v-8m0 0c-3 0-5-2-5-4s2-1 4-1 3 1 3 3-1 2-2 2zm0 0c3 0 5-2 5-4s-2-1-4-1-3 1-3 3 1 2 2 2z" stroke="currentColor" strokeWidth="2" fill="none"/> },
    4: { title: "제자도의 잎 (Leaves of Discipleship)", desc: "풍성한 성화의 잎사귀로 이웃에게 그늘을 제공합니다.", color: "text-teal-500", svg: <path d="M12 21V9m0 0c-4 0-6-3-6-6s3-1 5-1 3 2 3 4-1 3-2 3zm0 0c4 0 6-3 6-6s-3-1-5-1-3 2-3 4 1 3 2 3zm0 0v-4" stroke="currentColor" strokeWidth="2" fill="none"/> },
    5: { title: "열매 맺는 생명 나무 (Tree of Life)", desc: "그리스도의 장성한 분량에 이르러 거룩한 열매를 맺습니다.", color: "text-rose-500", svg: <path d="M12 22v-9m0 0C7 13 4 9 4 5c3 0 5 2 6 4m2-4c0-4 3-4 6-4 0 4-3 8-8 8zm0 0v-5m0 5c3 0 5-2 5-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/> }
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
      text: newPractice.trim(),
      source: '직접 결단',
      done: false
    }, ...practices];
    savePractices(newList);
    setNewPractice("");
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
  };

  const handleDeletePractice = (id) => {
    savePractices(practices.filter(p => p.id !== id));
  };

  // =====================================================================
  // 3. 영적 타임라인 (Timeline Tracker) 데이터 병합
  // =====================================================================
  const timelineData = useMemo(() => {
    const events = [];
    struggles.forEach(s => {
      events.push({ type: 'question', date: s.date, text: s.question, id: `q_${s.id}` });
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
  // 4. 데이터 유실 방지 & 전송: 인라인 3대 파생 박스
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
    if (!text) return alert("내용을 입력해주세요.");
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
      alert('오늘의 감사함으로 정상 전송되었습니다!');
    } else if (type === 'prayer') {
      const globalPrayers = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
      const newPrayer = { id: Date.now(), text: text, status: 'praying', date: today };
      localStorage.setItem('globalPrayers', JSON.stringify([...globalPrayers, newPrayer]));
      alert('나의 기도함으로 정상 전송되었습니다!');
    } else if (type === 'intercession') {
      const globalInter = JSON.parse(localStorage.getItem('goodtree_global_intercessions') || '[]');
      const newInter = { id: Date.now(), text: text, status: 'praying', date: today };
      localStorage.setItem('goodtree_global_intercessions', JSON.stringify([...globalInter, newInter]));
      alert('이웃 중보 기도함으로 정상 전송되었습니다!');
    }

    setInlineData(prev => ({ ...prev, [type]: '' }));
  };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bgBody} overflow-hidden select-none animate-fade-in w-full min-w-0 max-w-full`}>
      
      {/* 💡 뷰포트 반응형 보정 리퀴드 오로라 배경 */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isDark ? 'opacity-30 mix-blend-lighten' : 'opacity-80'}`}>
        <div className="absolute -top-[5%] -left-[10%] w-[70vw] h-[70vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[10%] w-[75vw] h-[75vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '2s' }} />
      </div>

      {/* 상단 글래스 헤더 바 */}
      <div className={`relative z-20 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-2xl shrink-0 w-full min-w-0 ${isDark ? 'border-white/10 bg-[#0F1115]/60' : 'border-white/60 bg-white/40'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onPointerDown={(e) => { e.preventDefault(); setActiveScreen('home'); }}>
           <button className={`p-1.5 -ml-1 rounded-full transition-colors ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
               <IconArrowLeft />
           </button>
           <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>
               삶의 적용과 실천 트래커
           </h1>
        </div>
      </div>

      {/* 100% 와이드 네비게이션 탭 (글래스모피즘 가로 스크롤) */}
      <div className={`flex w-full px-3 overflow-x-auto hide-scrollbar border-b z-20 backdrop-blur-xl shrink-0 gap-1 py-2 touch-pan-x min-w-0 ${isDark ? 'border-white/10 bg-[#1C1C1E]/40' : 'border-white/60 bg-white/30'}`}>
         <button 
            onPointerDown={(e) => { e.preventDefault(); setActiveTab('journal'); }} 
            className={`px-4 py-2 rounded-xl text-[13px] font-black transition-all whitespace-nowrap cursor-pointer shadow-sm ${activeTab === 'journal' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : `text-slate-500 hover:${ui.textMain} bg-black/5 dark:bg-white/5 border border-transparent`}`}
         >
            영적 고뇌와 응답
         </button>
         <button 
            onPointerDown={(e) => { e.preventDefault(); setActiveTab('tracker'); }} 
            className={`px-4 py-2 rounded-xl text-[13px] font-black transition-all whitespace-nowrap cursor-pointer shadow-sm ${activeTab === 'tracker' ? 'bg-rose-500 text-white border border-rose-400' : `text-slate-500 hover:${ui.textMain} bg-black/5 dark:bg-white/5 border border-transparent`}`}
         >
            실천 트래커 (생명 나무)
         </button>
         <button 
            onPointerDown={(e) => { e.preventDefault(); setActiveTab('archive'); }} 
            className={`px-4 py-2 rounded-xl text-[13px] font-black transition-all whitespace-nowrap cursor-pointer shadow-sm ${activeTab === 'archive' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : `text-slate-500 hover:${ui.textMain} bg-black/5 dark:bg-white/5 border border-transparent`}`}
         >
            영적 궤적 및 타임라인
         </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full hide-scrollbar relative z-10 pb-32 min-w-0 bg-transparent">
        <div className="w-full max-w-[1200px] mx-auto min-w-0">

          {/* =========================================================
              TAB 1: 영적 고뇌와 말씀의 응답 (Aporia Journaling)
              ========================================================= */}
          {activeTab === 'journal' && (
            <div className="flex flex-col lg:flex-row gap-6 animate-fade-in px-3 sm:px-6 py-5 w-full min-w-0">
               
               {/* 좌측: 입력 패널 */}
               <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 min-w-0">
                  <div className={`p-5 rounded-[24px] border ${ui.card} min-w-0`}>
                     <h2 className="text-[16.5px] font-black tracking-tight mb-2.5">해석되지 않는 현실, 말씀으로 씨름하기</h2>
                     <p className={`text-[13px] font-medium leading-[1.7] ${ui.textSub} break-keep mb-4`}>
                        삶의 부조리와 고난 속에서 던지는 정직한 질문(Aporia)을 기록하십시오. 묵상과 설교를 통해 깨닫게 된 하나님의 섭리를 응답으로 채워 넣게 됩니다.
                     </p>
                     <textarea 
                       value={newQuestion}
                       onChange={(e) => setNewQuestion(e.target.value)}
                       placeholder="하나님, 왜 이 고난이 나에게 허락되었습니까? 정직한 영적 질문을 적으십시오..."
                       className={`w-full p-4 text-[13.5px] font-medium leading-[1.8] rounded-xl outline-none resize-none min-h-[100px] transition-all shadow-inner border ${ui.inputBg}`}
                     />
                     <div className="flex justify-end mt-3">
                        <button 
                          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAddQuestion(); }} 
                          className="px-5 py-3 text-[13px] font-black rounded-xl text-white bg-rose-500 hover:bg-rose-600 transition-transform active:scale-95 cursor-pointer shadow-sm"
                        >
                           고뇌 기록하기
                        </button>
                     </div>
                  </div>
               </div>

               {/* 우측: 리스트 */}
               <div className="flex-1 flex flex-col gap-4 min-w-0">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${ui.card}`}>
                     <span className="text-[13.5px] font-black uppercase tracking-wider flex items-center gap-2 text-rose-500 break-keep">
                        <IconCompass/> 씨름 중인 질문 & 십자가의 응답
                     </span>
                     <span className="text-[11.5px] font-bold text-slate-400 shrink-0">총 {struggles.length}건</span>
                  </div>
                  
                  {struggles.length === 0 ? (
                    <div className={`p-8 text-center rounded-2xl border text-[13px] font-medium text-slate-400 ${ui.card}`}>
                      기록된 영적 질문이 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5 w-full min-w-0">
                       {struggles.map(struggle => (
                          <div key={struggle.id} className={`p-4.5 rounded-[20px] border flex flex-col gap-3 transition-all w-full min-w-0 shadow-sm ${ui.card}`}>
                             
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 w-full min-w-0">
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${struggle.answer ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'bg-rose-500 text-white'}`}>
                                         {struggle.answer ? '말씀으로 해석됨' : '씨름 중'}
                                      </span>
                                      <span className="text-[11px] font-medium text-slate-400">{struggle.date}</span>
                                   </div>
                                   <p className={`text-[14.5px] font-black leading-[1.6] mt-1 break-keep ${ui.textMain}`}>
                                      Q. {struggle.question}
                                   </p>
                                </div>
                                <button 
                                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteStruggle(struggle.id); }} 
                                  className="text-[11.5px] font-bold text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                                >
                                   삭제
                                </button>
                             </div>

                             {struggle.answer ? (
                                <div className={`p-4 rounded-xl border-l-[4px] border flex flex-col gap-2 mt-1 ${isDark ? 'bg-indigo-950/30 border-white/5 border-l-indigo-500' : 'bg-indigo-50/60 border-indigo-100 border-l-indigo-500'}`}>
                                   <span className="text-[11.5px] font-black flex items-center gap-1.5 text-indigo-500">
                                      <IconCheck/> 응답의 기록 ({struggle.resolvedDate})
                                   </span>
                                   <p className={`text-[13.5px] font-bold leading-[1.8] break-keep ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                                      {struggle.answer}
                                   </p>
                                </div>
                             ) : (
                                answeringId === struggle.id ? (
                                   <div className="flex flex-col gap-2 mt-2 animate-fade-in w-full min-w-0">
                                      <textarea 
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        placeholder="묵상이나 설교를 통해 깨달은 하나님의 선하신 섭리와 응답을 기록하십시오."
                                        className={`w-full p-3.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none min-h-[90px] shadow-inner border ${ui.inputBg}`}
                                      />
                                      <div className="flex justify-end gap-2 mt-1">
                                         <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setAnsweringId(null); }} className="px-4 py-2 text-[12px] font-bold rounded-lg border border-slate-300 dark:border-white/10 text-slate-500 bg-white/5">취소</button>
                                         <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveAnswer(struggle.id); }} className="px-4 py-2 text-[12px] font-bold rounded-lg text-white bg-indigo-500 shadow-sm active:scale-95 transition-transform">응답 확정</button>
                                      </div>
                                   </div>
                                ) : (
                                   <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setAnsweringId(struggle.id); }} className="w-max mt-1 text-[12.5px] font-bold text-indigo-500 flex items-center gap-1.5 hover:underline cursor-pointer">
                                      <IconEdit /> 말씀으로 해석된 응답 기록하기
                                   </button>
                                )
                             )}
                          </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: 거룩한 산 제사 (실천 트래커 & 생명 나무)
              ========================================================= */}
          {activeTab === 'tracker' && (
            <div className="flex flex-col animate-fade-in px-3 sm:px-6 py-5 max-w-[1300px] mx-auto space-y-5 w-full min-w-0">
               
               {/* 생명 나무 성장 비주얼 카드 */}
               <div className={`w-full p-6 sm:p-8 rounded-[28px] border flex flex-col items-center justify-center gap-5 relative overflow-hidden min-w-0 shadow-sm ${ui.card}`}>
                  
                  <div className="w-full max-w-md grid grid-cols-5 gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map(st => (
                      <div key={st} className="flex flex-col items-center gap-1.5">
                        <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${st <= sanctificationLevel ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-200 dark:bg-white/10'}`} />
                        <span className={`text-[10px] font-black ${st === sanctificationLevel ? 'text-rose-500' : 'text-slate-400'}`}>
                          Step {st}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={`w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center ${currentTree.color} transition-all duration-700 hover:scale-110 drop-shadow-lg`}>
                     <svg viewBox="0 0 24 24" className="w-full h-full">
                        {currentTree.svg}
                     </svg>
                  </div>

                  <div className="flex flex-col items-center text-center gap-1.5 max-w-sm">
                     <span className="text-[10.5px] font-black tracking-widest uppercase text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                        성화의 단계 : Stage {sanctificationLevel} / 5
                     </span>
                     <h3 className={`text-[18px] sm:text-[20px] font-black tracking-tight mt-1 ${ui.textMain}`}>
                        {currentTree.title}
                     </h3>
                     <p className={`text-[13px] font-medium leading-[1.7] break-keep ${ui.textSub}`}>
                        {currentTree.desc}
                     </p>
                  </div>
               </div>

               {/* 실천 트래커 목록 & 우측 3대 파생 인라인 박스 */}
               <div className="flex flex-col lg:flex-row gap-5 w-full min-w-0">
                 
                 {/* 좌측: 실천 리스트 및 입력 */}
                 <div className={`flex-1 p-5 rounded-[24px] border flex flex-col gap-4 min-w-0 shadow-sm ${ui.card}`}>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60 dark:border-white/10">
                       <h3 className="text-[15.5px] font-black flex items-center gap-2 text-rose-500">
                          <IconTarget/> 순종할 결단 리스트
                       </h3>
                       <span className="text-[11.5px] font-bold text-slate-400">
                          완수율: {totalPracticesCount === 0 ? 0 : Math.round((completedPracticesCount/totalPracticesCount)*100)}% ({completedPracticesCount}/{totalPracticesCount})
                       </span>
                    </div>

                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="당장 실천하거나 끊어낼 행동 하나를 적으십시오." 
                         value={newPractice}
                         onChange={(e) => setNewPractice(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') handleAddPractice(); }}
                         className={`flex-1 px-4 py-3.5 text-[13.5px] font-bold rounded-xl outline-none transition-all shadow-inner border ${ui.inputBg}`}
                       />
                       <button 
                         onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAddPractice(); }} 
                         className="px-5 py-3.5 text-[13px] font-black rounded-xl text-white bg-slate-900 dark:bg-slate-700 hover:bg-black transition-colors cursor-pointer shrink-0 shadow-sm"
                       >
                          결단 추가
                       </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-2 w-full min-w-0">
                       {allPractices.length === 0 ? (
                          <p className="py-10 text-center text-[13px] font-medium text-slate-400 leading-relaxed break-keep">
                            기록된 순종의 결단이 없습니다.<br/>위에서 직접 추가하거나 양육 워크북, 매일 QT를 작성하면 자동으로 연동됩니다.
                          </p>
                       ) : (
                          allPractices.map(practice => (
                             <div key={practice.id} className={`p-3.5 rounded-[16px] border flex items-center justify-between gap-3 transition-all w-full min-w-0 ${practice.done ? 'bg-black/5 dark:bg-white/5 opacity-60' : (isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-slate-200/80')}`}>
                                <div className="flex items-start gap-3 flex-1 cursor-pointer min-w-0" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTogglePractice(practice.id); }}>
                                   <div className={`mt-0.5 w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${practice.done ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                                      {practice.done && <IconCheck />}
                                   </div>
                                   <div className="flex flex-col min-w-0 flex-1">
                                      <p className={`text-[14px] font-bold leading-[1.6] break-keep ${practice.done ? 'text-slate-400 line-through' : ui.textMain}`}>
                                         {practice.text}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[10.5px] font-black text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                            {practice.source?.includes('연동') ? <IconLink /> : <IconEdit />} {practice.source}
                                         </span>
                                         <span className="text-[10.5px] font-medium text-slate-400">| {practice.date}</span>
                                      </div>
                                   </div>
                                </div>
                                {practice.source === '직접 결단' && (
                                  <button onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePractice(practice.id); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                                     <IconX />
                                  </button>
                                )}
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 {/* 우측: 💡 3대 영적 파생 박스 (실시간 보존 & 원터치 파이프라인 전송) */}
                 <div className={`w-full lg:w-[380px] p-5 rounded-[24px] border flex flex-col gap-4 shrink-0 min-w-0 shadow-sm ${ui.card}`}>
                    <div className="border-b border-slate-200/60 dark:border-white/10 pb-3">
                       <h3 className="text-[15px] font-black flex items-center gap-1.5 text-rose-500">
                          <IconSend /> 영적 파생 기록 (실시간 보존)
                       </h3>
                       <p className="text-[11.5px] font-medium text-slate-400 mt-1 break-keep">작성 중 페이지를 이동해도 내용이 유지되며, 전송 시 각 보관함으로 들어갑니다.</p>
                    </div>
                    
                    {/* 1. 오늘의 감사 */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[13px] font-black text-rose-500">오늘의 감사</span>
                      <textarea 
                        value={inlineData.thanks} 
                        onChange={e => setInlineData({...inlineData, thanks: e.target.value})} 
                        className={`w-full p-3.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none h-20 shadow-inner border transition-all ${ui.inputBg}`} 
                        placeholder="감사한 내용을 적어보세요..."
                      />
                      <button 
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineSubmit('thanks'); }} 
                        className="py-3 text-[12px] font-black rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-transform active:scale-95 shadow-sm border border-rose-500/20"
                      >
                        오늘의 감사함으로 전송
                      </button>
                    </div>

                    {/* 2. 나의 기도 */}
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[13px] font-black text-indigo-500">나의 기도</span>
                      <textarea 
                        value={inlineData.prayer} 
                        onChange={e => setInlineData({...inlineData, prayer: e.target.value})} 
                        className={`w-full p-3.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none h-20 shadow-inner border transition-all ${ui.inputBg}`} 
                        placeholder="개인 기도 제목을 적어주세요..."
                      />
                      <button 
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineSubmit('prayer'); }} 
                        className="py-3 text-[12px] font-black rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-transform active:scale-95 shadow-sm border border-indigo-500/20"
                      >
                        나의 기도함으로 전송
                      </button>
                    </div>

                    {/* 3. 이웃 중보 */}
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[13px] font-black text-emerald-500">이웃 중보</span>
                      <textarea 
                        value={inlineData.intercession} 
                        onChange={e => setInlineData({...inlineData, intercession: e.target.value})} 
                        className={`w-full p-3.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none h-20 shadow-inner border transition-all ${ui.inputBg}`} 
                        placeholder="이웃과 공동체를 위한 중보를 적어주세요..."
                      />
                      <button 
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineSubmit('intercession'); }} 
                        className="py-3 text-[12px] font-black rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-transform active:scale-95 shadow-sm border border-emerald-500/20"
                      >
                        중보 기도함으로 전송
                      </button>
                    </div>

                 </div>
               </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: 영적 궤적 및 신학적 패턴 (Archive & Timeline)
              ========================================================= */}
          {activeTab === 'archive' && (
            <div className="flex flex-col gap-6 animate-fade-in px-3 sm:px-6 py-5 max-w-[1200px] mx-auto w-full min-w-0">
               
               <div className="flex flex-col lg:flex-row gap-5 w-full min-w-0">
                  <div className={`p-6 rounded-[24px] border flex-1 shadow-sm w-full min-w-0 ${ui.card}`}>
                     <span className="text-[11.5px] font-black uppercase tracking-wider text-rose-500 block mb-2">신앙의 계절 분석</span>
                     <h3 className={`text-[17.5px] font-black break-keep ${ui.textMain}`}>
                        "{analyzeSpiritualSeason(struggles, allPractices)}"
                     </h3>
                     <p className={`text-[13.5px] font-medium leading-[1.7] break-keep mt-2 ${ui.textSub}`}>
                        최근 기록하신 영적 고뇌와 순종의 결단들을 종합 분석한 결과, 위와 같은 계절을 지나고 계십니다.
                     </p>
                  </div>
               </div>

               {/* 통합 타임라인 아카이브 */}
               <div className={`p-5 sm:p-6 rounded-[24px] border flex flex-col gap-4 shadow-sm w-full min-w-0 ${ui.card}`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
                     <h3 className="text-[15px] font-black flex items-center gap-2 text-rose-500">
                       <IconTimeline /> 나의 영적 타임라인
                     </h3>
                     <span className="text-[11.5px] font-bold text-slate-400">누적 {timelineData.length}건</span>
                  </div>

                  {timelineData.length === 0 ? (
                     <p className="py-12 text-center text-[13px] font-medium text-slate-400 break-keep leading-[1.8]">
                       기록된 궤적이 없습니다.<br/>영적 고뇌와 실천을 먼저 기록해주세요.
                     </p>
                  ) : (
                     <div className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 flex flex-col gap-7 pb-4 mt-3">
                        {timelineData.map((event) => (
                           <div key={event.id} className="relative pl-6">
                              <div className={`absolute -left-[6px] top-1.5 w-[10px] h-[10px] rounded-full border-2 ${isDark ? 'border-[#1C1C1E]' : 'border-white'} ${
                                 event.type === 'question' ? 'bg-rose-500' :
                                 event.type === 'answer' ? 'bg-indigo-500' :
                                 event.type === 'practice_done' ? 'bg-emerald-500' :
                                 'bg-sky-500'
                              }`}></div>
                              
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-[11px] font-bold text-slate-400">{event.date}</span>
                                 
                                 {event.type === 'question' && (
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded w-max border border-rose-500/20">[고뇌의 시작]</span>
                                       <p className={`text-[14px] font-black leading-[1.7] mt-1.5 break-keep ${ui.textMain}`}>Q. {event.text}</p>
                                    </div>
                                 )}
                                 
                                 {event.type === 'answer' && (
                                    <div className={`flex flex-col p-4 rounded-xl border border-indigo-500/20 mt-1 ${isDark ? 'bg-indigo-950/30' : 'bg-indigo-50/60'}`}>
                                       <span className="text-[11.5px] font-black text-indigo-500 flex items-center gap-1.5"><IconCheck/> [말씀의 응답]</span>
                                       <p className="text-[12.5px] font-medium text-slate-400 line-through mt-1 break-keep">{event.refQuestion}</p>
                                       <p className="text-[13.5px] font-bold leading-[1.7] mt-1.5 text-indigo-600 dark:text-indigo-300 break-keep">{event.text}</p>
                                    </div>
                                 )}

                                 {event.type === 'practice_added' && (
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded w-max border border-sky-500/20">[{event.source} 추가]</span>
                                       <p className={`text-[13.5px] font-bold leading-[1.7] mt-1.5 break-keep ${ui.textMain}`}>{event.text}</p>
                                    </div>
                                 )}

                                 {event.type === 'practice_done' && (
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded w-max border border-emerald-500/20">[순종 완료]</span>
                                       <p className="text-[13.5px] font-bold leading-[1.7] text-slate-400 line-through mt-1.5 break-keep">{event.text}</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
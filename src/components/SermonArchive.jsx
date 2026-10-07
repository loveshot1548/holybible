import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.671zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>;
const IconQuestion = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconList = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;

export default function SermonArchive({ t, isDarkMode, setActiveScreen, setIsSidebarOpen, isSidebarOpen, SubPageHeader, sermonList }) {
  const { dailyData, bibleNotes } = useAppStore();
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState('all');

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-white/10' : 'border-white/60',
    glassCard: isDark ? 'bg-[#1C1C1E]/50 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl' : 'bg-white/40 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-3xl',
    innerBox: isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/80',
    accentColor: isDark ? 'text-sky-400' : 'text-sky-600',
    accentBg: isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-500/10 text-sky-700',
  };

  const archiveList = useMemo(() => {
    let list = [];
    try {
        if (sermonList && Array.isArray(sermonList)) {
            sermonList.forEach(post => {
                let data = {};
                try { data = typeof post.content === 'string' ? JSON.parse(post.content) : (post.content || post); } catch(e) { data = post; }
                const actionItem = data.actionItem || data.apply;
                const questions = data.applyQuestions || [];
                if (actionItem || questions.length > 0) {
                    list.push({
                        id: `legacy_${post.id || Math.random()}`,
                        date: data.date || new Date(post.created_at || Date.now()).toISOString().split('T')[0],
                        type: '예배 노트',
                        title: data.title || data.graceLine || '주일 예배',
                        graceLine: data.graceLine,
                        actionItem,
                        questions,
                        isCompleted: data.actionCompleted || false,
                        ref: data.bibleRef || data.sermonReference
                    });
                }
            });
        }
        Object.entries(dailyData || {}).forEach(([date, data]) => {
          if (!data) return;
          
          const sermonQ = data.applyQuestions || [];
          if (data.sermonActionItem || sermonQ.length > 0) {
            list.push({ 
                id: `sermon_${date}`, date: date || '', type: '예배 노트', 
                title: data.sermonTitle || '주일 예배',
                graceLine: data.sermonGraceLine, 
                actionItem: data.sermonActionItem, 
                questions: sermonQ, 
                isCompleted: data.sermonActionCompleted || false, 
                ref: data.sermonReference 
            });
          }
          
          const qtQ = [data.qtAppQuestion].filter(Boolean);
          if (data.qtActionItem || qtQ.length > 0) {
            list.push({ 
                id: `qt_${date}`, date: date || '', type: '매일 QT', 
                title: data.qtTitle || '매일 묵상', 
                graceLine: data.qtGraceLine, 
                actionItem: data.qtActionItem, 
                questions: qtQ, 
                isCompleted: data.qtActionCompleted || false, 
                ref: data.qtReference 
            });
          }
        });
        
        (bibleNotes || []).forEach(note => {
          if (!note) return;
          if (note.actionItem) {
            list.push({ 
                id: `bible_${note.id}`, date: note.date || '', type: '성경통독', 
                title: note.title, 
                graceLine: note.graceLine, 
                actionItem: note.actionItem, 
                questions: [], 
                isCompleted: note.actionCompleted || false, 
                ref: note.verses?.[0]?.ref 
            });
          }
        });

        const uniqueList = Array.from(new Map(list.map(item => [item.id, item])).values());
        return uniqueList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)); 
    } catch(e) {
        console.error("Archive Data Parsing Error:", e);
        return [];
    }
  }, [dailyData, bibleNotes, sermonList]);

  const stats = useMemo(() => {
    let totalActions = 0;
    let completedActions = 0;
    let totalQuestions = 0;
    let questionKeywords = {};

    archiveList.forEach(item => {
      if (item.actionItem) {
        totalActions++;
        if (item.isCompleted) completedActions++;
      }
      if (item.questions && item.questions.length > 0) {
        totalQuestions += item.questions.length;
        item.questions.forEach(q => {
          const words = q.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1);
          words.forEach(w => questionKeywords[w] = (questionKeywords[w] || 0) + 1);
        });
      }
    });

    const completionRate = totalActions === 0 ? 0 : Math.round((completedActions / totalActions) * 100);
    
    const stopWords = ['어떻게', '무엇을', '어떤', '나는', '나의', '나에게', '우리가', '우리는', '오늘', '이번', '주님', '하나님', '예수님', '내가', '나를', '왜', '무슨', '어떻게하면'];
    const sortedKeywords = Object.entries(questionKeywords)
      .filter(([kw]) => !stopWords.includes(kw))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(i => i[0]);

    return { totalActions, completedActions, completionRate, totalQuestions, sortedKeywords };
  }, [archiveList]);

  const filteredList = useMemo(() => {
    if (filterType === 'pending') return archiveList.filter(i => i.actionItem && !i.isCompleted);
    if (filterType === 'completed') return archiveList.filter(i => i.actionItem && i.isCompleted);
    return archiveList;
  }, [archiveList, filterType]);

  return (
    <div className={`flex-1 flex flex-col h-full ${ui.bgBody} animate-fade-in relative font-sans overflow-hidden pointer-events-auto w-full min-w-0 max-w-full`}>
      
      {/* 3D 가속 최적화 리퀴드 오로라 배경 */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isDark ? 'opacity-30 mix-blend-lighten' : 'opacity-80'}`} style={{ transform: 'translate3d(0,0,0)' }}>
        <div className="absolute -top-[5%] -left-[10%] w-[70vw] h-[70vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)', filter: 'blur(75px)' }} />
        <div className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[10%] w-[75vw] h-[75vw] rounded-full animate-pulse will-change-transform" style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)', filter: 'blur(85px)', animationDelay: '2s' }} />
      </div>

      {/* 상단 글래스 헤더 */}
      <div className={`relative z-20 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-2xl shrink-0 w-full min-w-0 ${isDark ? 'border-white/10 bg-[#0F1115]/60' : 'border-white/60 bg-white/40'}`}>
        <button onClick={() => setActiveScreen('home')} className={`p-1.5 -ml-1 rounded-full transition-colors cursor-pointer ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
           <IconArrowLeft />
        </button>
        <div className="flex flex-col items-center">
          <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>삶의 적용과 실천</h1>
          <p className={`text-[10.5px] font-bold text-sky-500 mt-0.5 tracking-widest uppercase`}>나의 영적 트래커</p>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors cursor-pointer ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
           <IconMenu />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full mx-auto relative z-10 min-w-0">
        
        {/* 네비게이션 탭 */}
        <div className={`w-full shrink-0 flex overflow-x-auto hide-scrollbar border-b backdrop-blur-xl z-20 gap-2 px-4 py-3 touch-pan-x min-w-0 ${isDark ? 'border-white/10 bg-[#1C1C1E]/40' : 'border-white/60 bg-white/30'}`}>
          {[
            { id: 'list', label: '적용 기록 모음', icon: <IconList /> },
            { id: 'dashboard', label: '영적 트렌드 분석', icon: <IconChart /> }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-black rounded-xl transition-all whitespace-nowrap cursor-pointer border shadow-sm
                ${activeTab === tab.id 
                  ? 'bg-sky-500 text-white border-sky-400' 
                  : (isDark ? 'text-slate-400 hover:text-white bg-white/5 border-transparent' : 'text-slate-600 hover:text-slate-900 bg-white/40 border-white/50')}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3 pb-32 w-full min-w-0 z-10 relative">
          <div className="w-full mx-auto max-w-3xl space-y-4">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-4 animate-fade-in w-full min-w-0">
                 {/* 1. 영적 질문 트렌드 분석 */}
                 <div className={`p-5 rounded-[24px] border ${ui.glassCard} min-w-0`}>
                    <h3 className={`text-[14.5px] font-black ${ui.textMain} mb-1.5 flex items-center gap-1.5`}>
                      <IconQuestion /> 영적 고뇌와 질문의 흔적
                    </h3>
                    <p className={`text-[12.5px] font-medium ${ui.textSub} mb-4 break-keep leading-relaxed`}>
                      매일 묵상을 통해 스스로에게 가장 많이 던진 질문 키워드입니다. 어떤 영역에서 고민이 깊었는지 확인하세요.
                    </p>
                    <div className="flex flex-wrap gap-2 w-full min-w-0">
                      {stats.sortedKeywords.map((kw, i) => (
                        <span key={i} className={`px-3.5 py-1.5 text-[12.5px] font-bold rounded-lg border shadow-sm ${ui.innerBox} ${ui.textMain}`}>
                          {kw}
                        </span>
                      ))}
                      {stats.sortedKeywords.length === 0 && <span className={`text-[12px] font-medium ${ui.textSub}`}>데이터가 부족합니다.</span>}
                    </div>
                 </div>

                 {/* 2. 실천 목표 통계 대시보드 */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full min-w-0">
                   <div className={`p-6 rounded-[24px] border ${ui.glassCard} flex flex-col justify-center items-center text-center col-span-2 md:col-span-1 min-w-0`}>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${ui.textSub} mb-3`}>실천 목표 달성률</span>
                      <div className="relative w-28 h-28 flex items-center justify-center">
                         <svg viewBox="0 0 36 36" className="w-28 h-28 transform -rotate-90">
                            <path className={`${isDark ? 'text-white/10' : 'text-black/10'}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-sky-500" strokeDasharray={`${stats.completionRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                            <span className={`text-[22px] font-black ${ui.textMain}`}>{stats.completionRate}%</span>
                         </div>
                      </div>
                   </div>

                   <div className={`p-5 rounded-[24px] border ${ui.glassCard} flex flex-col justify-center min-w-0`}>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${ui.textSub}`}>총 세워진 목표</span>
                     <h2 className={`text-[22px] font-black mt-1 ${ui.textMain}`}>{stats.totalActions} <span className="text-[12px] font-bold opacity-60">건</span></h2>
                   </div>
                   
                   <div className={`p-5 rounded-[24px] border ${ui.glassCard} flex flex-col justify-center min-w-0`}>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${ui.textSub}`}>스스로 결단한 질문</span>
                     <h2 className={`text-[22px] font-black mt-1 ${ui.textMain}`}>{stats.totalQuestions} <span className="text-[12px] font-bold opacity-60">개</span></h2>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-4 animate-fade-in w-full min-w-0">
                
                {/* 필터 영역 */}
                <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${ui.innerBox} w-full shadow-sm`}>
                   <button onClick={() => setFilterType('all')} className={`flex-1 px-3 py-2 text-[12.5px] font-black rounded-lg transition-colors cursor-pointer ${filterType === 'all' ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm border border-slate-200') : ui.textSub}`}>전체</button>
                   <button onClick={() => setFilterType('pending')} className={`flex-1 px-3 py-2 text-[12.5px] font-black rounded-lg transition-colors cursor-pointer ${filterType === 'pending' ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm border border-slate-200') : ui.textSub}`}>진행 중</button>
                   <button onClick={() => setFilterType('completed')} className={`flex-1 px-3 py-2 text-[12.5px] font-black rounded-lg transition-colors cursor-pointer ${filterType === 'completed' ? 'bg-sky-500 text-white shadow-sm' : ui.textSub}`}>완료됨</button>
                </div>

                {/* 적용 기록 리스트 */}
                <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                  {filteredList.length === 0 ? (
                    <div className={`text-center py-20 text-[13px] font-medium ${ui.textSub}`}>기록된 적용 질문이나 실천 목표가 없습니다.</div>
                  ) : (
                    filteredList.map((item, idx) => (
                      <div key={idx} className={`p-4 sm:p-5 rounded-[20px] border flex flex-col gap-3 min-w-0 ${ui.glassCard}`}>
                         
                         <div className={`flex justify-between items-center border-b pb-3 min-w-0 ${isDark ? 'border-white/10' : 'border-slate-200/80'}`}>
                           <div className="flex items-center gap-2 min-w-0">
                             <span className={`text-[10px] font-black px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-500 shrink-0 uppercase tracking-widest`}>{item.type}</span>
                             <span className={`text-[11.5px] font-bold ${ui.textSub} truncate`}>{item.date}</span>
                           </div>
                           <span className="text-[11.5px] font-black flex items-center gap-1 shrink-0 text-sky-500">
                             <IconBook /> <span className="truncate max-w-[80px] sm:max-w-none">{item.ref || '본문 없음'}</span>
                           </span>
                         </div>

                         {item.title && (
                           <h3 className={`text-[14.5px] font-black ${ui.textMain} mb-1 leading-[1.6] break-keep`}>{item.title}</h3>
                         )}

                         {item.questions && item.questions.length > 0 && (
                           <div className="flex flex-col gap-1.5 mt-1 w-full min-w-0">
                             <h4 className={`text-[11px] font-black uppercase tracking-widest ${ui.textMain} flex items-center gap-1.5`}>
                               <IconQuestion /> 스스로에게 던진 질문
                             </h4>
                             <div className={`p-3.5 rounded-xl border ${ui.innerBox} space-y-2`}>
                               {item.questions.map((q, i) => (
                                 <p key={i} className={`text-[13px] font-medium leading-[1.7] break-keep ${ui.textMain} flex items-start gap-1.5`}>
                                   <span className="text-sky-500">•</span> <span className="flex-1">{q}</span>
                                 </p>
                               ))}
                             </div>
                           </div>
                         )}

                         {item.actionItem && (
                           <div className="flex flex-col gap-1.5 mt-2 w-full min-w-0">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-500 flex items-center gap-1.5">
                               <IconTarget /> 실천 목표
                             </h4>
                             <button 
                               onClick={() => setActiveScreen('applyTracker')} 
                               className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer border ${item.isCompleted ? (isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-500/5 border-sky-500/20') : ui.innerBox} hover:opacity-80 active:scale-95`}
                             >
                               <div className={`w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center shrink-0 ${item.isCompleted ? `bg-sky-500 border-sky-500 text-white` : `border-slate-300 dark:border-white/20 text-transparent`}`}>
                                 {item.isCompleted && <IconCheck />}
                               </div>
                               <div className="flex-1 text-left min-w-0">
                                  <p className={`text-[13px] font-bold leading-[1.6] break-keep ${item.isCompleted ? `${ui.textSub} line-through` : ui.textMain}`}>
                                    {item.actionItem}
                                  </p>
                               </div>
                             </button>
                           </div>
                         )}

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
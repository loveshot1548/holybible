// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';

// =====================================================================
// ✒️ 전문 학술 & SaaS 정밀 헤어라인 SVG 아이콘 세트
// =====================================================================
const StrokeWidth = "1.8";
const IconHome = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconLayers = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 12 12 17 22 12" /><polyline points="2 17 12 22 22 17" /></svg>;
const IconFlame = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const IconBookOpen = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const IconFileText = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconUsers = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconCode = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const IconMap = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>;
const IconPieChart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
const IconArchive = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>;
const IconTarget = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconMessage = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IconHeart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconHands = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 14v4" /><path d="M7 10l3 3-2 2-3-3" /><path d="M3 14l3 3" /><path d="M14 6l3 3-2 2-3-3" /></svg>;
const IconBookGuide = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="13" y2="11" /></svg>;
const IconLogOut = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconChevronUpDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="7 15 12 20 17 15" /><polyline points="7 9 12 4 17 9" /></svg>;
const IconChevronRight = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>;
const IconSun = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#EAB308]"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const IconMoon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#818CF8]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
const IconClock = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconShieldAdmin = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconChart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-5 5"/></svg>;
const IconGalaxy = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6a6 6 0 1 1-6 6" /><circle cx="19" cy="5" r="1.5" fill="currentColor" /></svg>;

// =====================================================================
// 📜 정경 및 앱 메뉴 구성 그룹
// =====================================================================
const MENU_GROUPS = [
  { title: 'HOME', items: [
    { id: 'home', icon: IconHome, label: 'Home' }, 
    { id: 'fiveSetMenu', icon: IconLayers, label: '영적 5종 세트' }, 
    { id: 'dailyRoutine', icon: IconClock, label: '하루 신앙 루틴' } 
  ] },
  { title: 'WORSHIP', items: [
    { id: 'meditationPilgrimage', icon: IconFlame, label: '오늘의 묵상 여정' }, 
    { id: 'qt', icon: IconFlame, label: '매일 QT' }, 
    { id: 'mcheyne', icon: IconBookOpen, label: '맥체인 읽기' }, 
    { id: 'sermon', icon: IconFileText, label: '예배 노트' }, 
    { id: 'cell', icon: IconUsers, label: '목장 나눔' }, 
    { id: 'familySelect', icon: IconHome, label: '가정 예배' }
  ] },
  { title: 'BIBLE / STUDY', items: [
    { id: 'bible', icon: IconBookOpen, label: '365 성경통독' }, 
    { id: 'interlinear', icon: IconCode, label: '원어성경' }, 
    { id: 'galaxy', icon: IconGalaxy, label: '성경 지식 은하계' },
    { id: 'bibleWikiAdvanced', icon: IconMap, label: '성경 위키' }, 
    { id: 'qtArchiveDetail', icon: IconPieChart, label: 'QT 심층 분석' }, 
    { id: 'sermonAnalysis', icon: IconChart, label: '설교 분석' }, 
    { id: 'sermonArchiveAdvanced', icon: IconArchive, label: '삶의 적용과 실천' }, 
    { id: 'applyTracker', icon: IconTarget, label: '적용 질문 트래커' }, 
    { id: 'trainingCurriculum', icon: IconLayers, label: '양육 커리큘럼' },
    { id: 'trainingSubPages', icon: IconBookOpen, label: '4주 심화 워크북' } 
  ] },
  { title: 'COMMUNITY', items: [
    { id: 'generalNote', icon: IconFileText, label: '자유 노트' }, 
    { id: 'board', icon: IconMessage, label: '공동체 감사/기도' }, 
    { id: 'diary', icon: IconHeart, label: '나의 감사/간증' }, 
    { id: 'prayer', icon: IconHands, label: '기도 보관함' }, 
    { id: 'jericho', icon: IconMap, label: '여리고 땅밟기' }
  ] },
  { title: 'MEDIA & DIGITAL', items: [
    { id: 'reelsStudio', icon: IconLayers, label: 'Reels Studio (Pro)' }
  ] }
];

export default function Sidebar({ 
  isSidebarOpen, setIsSidebarOpen, activeScreen, setActiveScreen, authUser, handleLogout, isDarkMode, setIsDarkMode 
}) {
  const [isSlim, setIsSlim] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState('HOME');

  const isDark = isDarkMode;

  // 현재 사용자 이름 식별
  const getResolvedUserName = () => {
    if (typeof authUser === 'string' && authUser.trim()) return authUser.trim();
    if (typeof authUser === 'object' && authUser) {
      const candidate = authUser.name || authUser.user_name || authUser.username || authUser.nickname;
      if (candidate) return String(candidate).trim();
    }
    try {
      const stored = localStorage.getItem('church_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const candidate = parsed.name || parsed.user_name || parsed.username || parsed.nickname;
        if (candidate) return String(candidate).trim();
      }
    } catch (_) {}
    return String(localStorage.getItem('user_name') || '성도님').trim();
  };

  const currentUserName = getResolvedUserName();
  const cleanName = (currentUserName || '').replace(/\s+/g, '').toLowerCase();

  // 🛡️ 정신동 본인 단독 식별 (관리자 페이지 접근 권한 유지를 위해 롤백)
  const isOwnerJeongShinDong = 
    cleanName === '정신동' || 
    cleanName === 'shindong' || 
    cleanName.startsWith('정신동(');

  // 관리자 권한 확인 로직 (복원됨)
  const currentUserRole = typeof authUser === 'object' ? (authUser?.role || '') : '';
  const isExplicitAdmin = typeof authUser === 'object' ? !!authUser?.is_admin : false;
  const canAccessAdmin = isOwnerJeongShinDong || isExplicitAdmin || ['관리자', '운영자', '목자', '전도사', '목사'].includes(currentUserRole);

  const ui = {
    bg: isDark ? 'bg-[#0F1115]' : 'bg-[#F4F5F7]', 
    border: isDark ? 'border-white/10' : 'border-slate-200/60',
    textPrimary: isDark ? 'text-white' : 'text-slate-900', 
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    hoverBg: isDark ? 'hover:bg-white/5' : 'hover:bg-black/5', 
    activeBg: isDark ? 'bg-white/10' : 'bg-slate-200/50', 
    activeText: isDark ? 'text-indigo-400' : 'text-indigo-600',
    iconBase: isDark ? 'text-slate-400' : 'text-slate-400'
  };

  useEffect(() => {
    const group = MENU_GROUPS.find(g => g.items.some(i => i.id === activeScreen));
    if (group) setExpandedGroup(group.title);
  }, [activeScreen]);

  return (
    <>
      {/* 모바일 백드롭 */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] md:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* 사이드바 본체 */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[150] h-full flex flex-col transition-all duration-300 ease-in-out border-r md:relative ${ui.bg} ${ui.border} ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isSlim ? 'w-[72px]' : 'w-[220px] md:w-[260px]'}`}
      >
        {/* 데스크톱 슬림 토글 버튼 */}
        <button 
          onClick={() => setIsSlim(!isSlim)} 
          className={`hidden md:flex absolute top-5 -right-3 w-6 h-6 rounded-full border shadow-sm items-center justify-center z-[160] transition-transform ${
            isDark ? 'bg-[#1C1C1E] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <IconChevronRight className={`w-3.5 h-3.5 transition-transform ${!isSlim ? 'rotate-180' : ''}`} />
        </button>

        {/* 로고 & 사용자 헤더 */}
        <div 
          onClick={() => {
            setActiveScreen('home');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`shrink-0 h-[64px] flex items-center gap-3 px-4 border-b ${ui.border} cursor-pointer transition-colors ${ui.hoverBg} select-none`}
        >
          <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center font-bold text-[13px] shadow-sm transition-all ${
            isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            환
          </div>
          {!isSlim && (
            <>
              <div className="flex flex-col flex-1 overflow-hidden justify-center">
                <span className={`text-[14.5px] font-black leading-tight truncate ${ui.textPrimary}`}>환영합니다.</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[12px] font-bold leading-tight truncate ${ui.textSecondary}`}>{currentUserName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>
              <IconChevronUpDown className={`w-4 h-4 shrink-0 ${ui.iconBase}`} />
            </>
          )}
        </div>

        {/* 네비게이션 메뉴 목록 */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 hide-scrollbar">
          {MENU_GROUPS.map((group, idx) => {
            const isGroupExpanded = expandedGroup === group.title;
            return (
              <div key={idx} className="space-y-1">
                <button 
                  onClick={() => { 
                    setExpandedGroup(expandedGroup === group.title ? null : group.title); 
                    if (isSlim) setIsSlim(false); 
                  }} 
                  className={`w-full flex items-center justify-between px-2 py-1.5 mb-1 transition-colors rounded-md focus:outline-none ${!isSlim ? ui.hoverBg : ''}`}
                >
                  {!isSlim ? (
                    <span className={`text-[12px] font-bold tracking-widest ${ui.textSecondary}`}>{group.title}</span>
                  ) : (
                    <span className="w-full text-center text-[10px] font-bold text-transparent select-none">-</span>
                  )}
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isSlim || isGroupExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <nav className="overflow-hidden space-y-0.5">
                    {group.items.map(item => {
                      const isActive = activeScreen === item.id;
                      const Icon = item.icon;
                      return (
                        <button 
                          key={item.id} 
                          onClick={() => { 
                            setActiveScreen(item.id); 
                            if (window.innerWidth < 768) setIsSidebarOpen(false); 
                          }} 
                          title={isSlim ? item.label : undefined} 
                          className={`w-full flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors duration-200 focus:outline-none cursor-pointer ${
                            isSlim ? 'justify-center p-3' : 'px-3 py-2.5'
                          } ${isActive ? `${ui.activeBg}${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary}${ui.hoverBg}`}`}
                        >
                          <Icon className={`shrink-0 w-[18px] h-[18px] ${isActive ? ui.activeText : ui.iconBase}`} />
                          {!isSlim && <span className="truncate">{item.label}</span>}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 시스템 액션 바 */}
        <div className={`shrink-0 p-4 border-t ${ui.border} flex flex-col gap-2.5`}>
          {canAccessAdmin && (
            <button 
              onClick={() => { 
                setActiveScreen('adminConsole'); 
                if (window.innerWidth < 768) setIsSidebarOpen(false); 
              }} 
              className={`w-full flex items-center gap-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 cursor-pointer ${
                isSlim ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${activeScreen === 'adminConsole' ? `${ui.activeBg}${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary}${ui.hoverBg}`}`}
            >
              <IconShieldAdmin className={`shrink-0 w-[18px] h-[18px] ${activeScreen === 'adminConsole' ? ui.activeText : 'text-indigo-400'}`} />
              {!isSlim && <span className="font-bold">관리자 페이지</span>}
            </button>
          )}

          <button 
            onClick={() => { 
              setActiveScreen('guidebook'); 
              if (window.innerWidth < 768) setIsSidebarOpen(false); 
            }} 
            className={`w-full flex items-center gap-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 cursor-pointer ${
              isSlim ? 'justify-center p-3' : 'px-3 py-2.5'
            } ${activeScreen === 'guidebook' ? `${ui.activeBg}${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary}${ui.hoverBg}`}`}
          >
            <IconBookGuide className={`shrink-0 w-[18px] h-[18px] ${activeScreen === 'guidebook' ? ui.activeText : ui.iconBase}`} />
            {!isSlim && <span>가이드북</span>}
          </button>

          {setIsDarkMode && (
            <div className="flex justify-center mb-1">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                title="다크 모드 변경" 
                className={`relative w-16 h-8 rounded-full shadow-inner flex items-center cursor-pointer transition-colors duration-300 ${
                  isDark ? 'bg-black/30 border border-white/10' : 'bg-slate-200/70 border border-slate-300'
                }`}
              >
                <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ${
                  isDark ? 'translate-x-9 bg-[#2A3441]' : 'translate-x-1 bg-white'
                }`}>
                  {isDark ? <IconMoon /> : <IconSun />}
                </div>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => { 
              if (window.confirm('로그아웃 하시겠습니까?')) { 
                if (handleLogout) handleLogout(); 
                setActiveScreen('login'); 
                setIsSidebarOpen(false); 
              } 
            }} 
            title={isSlim ? '로그아웃' : undefined} 
            className={`w-full flex items-center gap-2.5 rounded-xl text-[13.5px] font-bold transition-colors cursor-pointer ${
              isSlim ? 'justify-center p-3' : 'px-3 py-2.5'
            } ${isDark ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50'}`}
          >
            <IconLogOut className="shrink-0 w-[16px] h-[16px]" />
            {!isSlim && <span>로그아웃</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
import React, { useState, useMemo, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>;
const IconChevronLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRightSmall = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>;

export default function FiveSetMenu({
  t, isDarkMode, setActiveScreen, logUserAction
}) {
  const dailyData = useAppStore(state => state.dailyData);
  const updateDay = useAppStore(state => state.updateDay);
  const authUser = useAppStore(state => state.authUser);

  const getLocalToday = () => { 
    const o = new Date().getTimezoneOffset() * 60000; 
    return new Date(Date.now() - o).toISOString().split('T')[0]; 
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalToday());

  // 주간 단위 이동 핸들러
  const handleShiftWeek = (direction) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction * 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleResetToday = () => {
    setSelectedDate(getLocalToday());
  };

  // 모바일 터치 스와이프 제스처
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleShiftWeek(1); // 왼쪽으로 밀면 다음 주
      } else {
        handleShiftWeek(-1); // 오른쪽으로 밀면 이전 주
      }
    }
  };

  const weekDates = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - day);
    return Array.from({length: 7}).map((_, i) => {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
  }, [selectedDate]);

  const monthStr = new Date(selectedDate).toLocaleString('ko-KR', { year: 'numeric', month: 'long' });
  const checks = dailyData[selectedDate]?.checks || {};

  const CORE_ITEMS = [
    { id: 'diary', name: '감사/간증 일기', sub: '일상 속 구원의 은혜 기록', key: '감사', color: '#FF2D55' },
    { id: 'mcheyne', name: '맥체인 성경 읽기', sub: '구약과 신약 매일 통독', key: '성경읽기', color: '#007AFF' },
    { id: 'qt', name: '말씀 묵상 (매일 QT)', sub: '김양재 목사의 구속사 큐티노트', key: 'QTin', color: '#FF9500' }
  ];

  const PLUS_ITEMS = [
    { id: 'prayer', name: '기도 보관함', sub: '개인 및 중보기도 실천', key: '기도하기', color: '#34C759' },
    { id: 'familySelect', name: '가정 예배', sub: '가족과 함께하는 은혜 나눔', key: '가정예배', color: '#AF52DE' }
  ];

  const coreDone = CORE_ITEMS.filter(item => checks[item.key]).length;
  const plusDone = PLUS_ITEMS.filter(item => checks[item.key]).length;
  const totalDone = coreDone + plusDone;

  const coreRate = Math.round((coreDone / 3) * 100);
  const totalRate = Math.round((totalDone / 5) * 100);

  const outerCircumference = 2 * Math.PI * 40;
  const innerCircumference = 2 * Math.PI * 27;
  const outerOffset = outerCircumference - (outerCircumference * coreRate) / 100;
  const innerOffset = innerCircumference - (innerCircumference * totalRate) / 100;

  const handleToggle = (key, e) => {
    e.stopPropagation();
    const dayData = dailyData[selectedDate] || {};
    const currentChecks = dayData.checks || {};
    const nextState = !currentChecks[key];
    
    updateDay(selectedDate, { ...dayData, checks: { ...currentChecks, [key]: nextState } });

    if (logUserAction && authUser?.name) {
      logUserAction(authUser.name, '영적 5종 세트', 'check', `[${key}] ${nextState ? '완료' : '취소'}`);
    }
  };

  const renderItem = (item) => {
    const isChecked = !!checks[item.key];
    
    return (
      <div
        key={item.key}
        onClick={(e) => handleToggle(item.key, e)}
        className={`py-2.5 px-3.5 rounded-[22px] border transition-all cursor-pointer flex items-center justify-between backdrop-blur-2xl ${
          isChecked 
            ? (isDarkMode ? 'bg-white/[0.04] border-white/5 opacity-40' : 'bg-white/30 border-white/40 opacity-55')
            : (isDarkMode ? 'bg-[#1C1C1E]/40 border-white/10 hover:bg-[#2C2C2E]/60 shadow-xs' : 'bg-white/60 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:bg-white/80')
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <span 
            className={`w-1.5 h-8 rounded-full shrink-0 transition-colors ${isChecked ? 'bg-slate-300 dark:bg-slate-600' : ''}`} 
            style={!isChecked ? { backgroundColor: item.color } : {}}
          />
          <div className="flex flex-col min-w-0 pointer-events-none">
            <span className={`text-[13.5px] font-black truncate transition-colors ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
              {item.name}
            </span>
            <span className={`text-[11px] font-semibold truncate transition-colors ${isChecked ? 'text-slate-400 dark:text-slate-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
              {item.sub}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const dayData = dailyData[selectedDate] || {};
              const currentChecks = dayData.checks || {};
              
              if (!currentChecks[item.key]) {
                updateDay(selectedDate, { 
                  ...dayData, 
                  checks: { ...currentChecks, [item.key]: true } 
                });

                if (logUserAction && authUser?.name) {
                  logUserAction(authUser.name, '영적 5종 세트', 'check', `[${item.key}] 화면 이동 완료 자동 체크`);
                }
              }

              setActiveScreen(item.id); 
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-0.5 cursor-pointer ${
              isDarkMode 
                ? 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20' 
                : 'bg-white/80 text-slate-700 border-slate-200 shadow-xs hover:bg-white'
            }`}
          >
            이동 <IconChevronRight />
          </button>

          <button
            type="button"
            onClick={(e) => handleToggle(item.key, e)}
            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isChecked 
                ? 'shadow-xs text-white' 
                : (isDarkMode ? 'border-white/15 bg-black/20' : 'border-slate-300 bg-white/70 hover:bg-white')
            }`}
            style={isChecked ? { backgroundColor: item.color, borderColor: item.color } : {}}
          >
            {isChecked && <IconCheck />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDarkMode ? 'bg-[#0F1115]' : 'bg-[#F4F5F7]'}`}>
      
      {/* 뷰포트 반응형 보정 오로라 배경 (가로/세로 균일 렌더링) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-40">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[800px] max-w-[90vw] h-[800px] max-h-[90vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.35) 0%, transparent 70%)', filter: 'blur(90px)' }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[900px] max-w-[95vw] h-[900px] max-h-[95vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%)', filter: 'blur(100px)' }} 
        />
      </div>

      {/* 1. 상단 플랫 글래스 헤더 */}
      <div className={`shrink-0 px-4 py-3 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/70'}`}>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveScreen('home')} 
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}
          >
            <IconArrowLeft />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ml-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>영적 5종 세트</h1>
        </div>
      </div>

      {/* 2. 본문 컨테이너 */}
      <div className="flex-1 overflow-y-auto w-full hide-scrollbar pb-28 pt-3 space-y-3 px-3.5 relative z-10">
        
        {/* 주간 캘린더 피커 (주차 이동 및 터치 제스처 연동) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`p-3.5 rounded-[24px] border shadow-xs flex flex-col gap-2 shrink-0 backdrop-blur-2xl ${isDarkMode ? 'bg-[#1C1C1E]/40 border-white/10' : 'bg-white/60 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex items-center justify-between px-1">
            <span className={`text-[13.5px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{monthStr}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleResetToday} 
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition-colors ${isDarkMode ? 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                오늘
              </button>
              <button 
                onClick={() => handleShiftWeek(-1)} 
                className={`p-1 rounded-md border transition-colors ${isDarkMode ? 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="이전 주"
              >
                <IconChevronLeft />
              </button>
              <button 
                onClick={() => handleShiftWeek(1)} 
                className={`p-1 rounded-md border transition-colors ${isDarkMode ? 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="다음 주"
              >
                <IconChevronRightSmall />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center gap-1">
            {weekDates.map(dateStr => {
              const d = new Date(dateStr);
              const dayNum = d.getDate();
              const dayIdx = d.getDay();
              const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
              const isSelected = dateStr === selectedDate;

              let unselectedNumColor = isDarkMode ? 'text-white' : 'text-slate-900';
              if (dayIdx === 0) unselectedNumColor = 'text-rose-500';
              if (dayIdx === 6) unselectedNumColor = 'text-blue-500';

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 rounded-[18px] cursor-pointer transition-all ${
                    isSelected 
                      ? (isDarkMode ? 'bg-white text-slate-900 shadow-md scale-105 font-black' : 'bg-slate-900 text-white shadow-md scale-105 font-black') 
                      : (isDarkMode ? 'hover:bg-white/10' : 'hover:bg-white/50')
                  }`}
                >
                  <span className={`text-[10.5px] font-bold mb-0.5 ${isSelected ? (isDarkMode ? 'text-slate-700 font-black' : 'text-white/80 font-black') : 'text-slate-400'}`}>
                    {daysKo[dayIdx]}
                  </span>
                  <span className={`text-[14px] font-black ${isSelected ? (isDarkMode ? 'text-slate-900' : 'text-white') : unselectedNumColor}`}>
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 듀얼 링 대시보드 */}
        <div className={`p-4 rounded-[24px] border shadow-xs flex items-center justify-between shrink-0 backdrop-blur-2xl ${isDarkMode ? 'bg-[#1C1C1E]/40 border-white/10' : 'bg-white/60 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}>
          <div className="flex flex-col gap-1">
            <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-400">Today's Progress</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-[28px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{totalRate}%</span>
              <span className="text-[12px] font-bold text-slate-400">완료</span>
            </div>
            
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs"></span>
                <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">핵심 3종 ({coreDone}/3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
                <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">전체 5종 ({totalDone}/5)</span>
              </div>
            </div>
          </div>

          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>
                <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="url(#coreGrad)" strokeWidth="8" fill="none" strokeDasharray={outerCircumference} strokeDashoffset={outerOffset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
              <circle cx="50" cy="50" r="27" stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="7" fill="none" />
              <circle cx="50" cy="50" r="27" stroke="url(#subGrad)" strokeWidth="7" fill="none" strokeDasharray={innerCircumference} strokeDashoffset={innerOffset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
            </svg>
            <span className={`absolute text-[13.5px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{totalDone}/5</span>
          </div>
        </div>

        {/* 핵심 3종 리스트 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1.5">
            <span className={`text-[12.5px] font-black flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>핵심 루틴 (3종)
            </span>
            <span className="text-[11.5px] font-bold text-rose-500">{coreDone === 3 ? '🎉 3종 완료' : `${coreDone}/3 완료`}</span>
          </div>
          {CORE_ITEMS.map(renderItem)}
        </div>

        {/* 플러스 2종 리스트 */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between px-1.5">
            <span className={`text-[12.5px] font-black flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>플러스 루틴 (2종)
            </span>
            <span className="text-[11.5px] font-bold text-emerald-500">{plusDone === 2 ? '🎉 2종 완료' : `${plusDone}/2 완료`}</span>
          </div>
          {PLUS_ITEMS.map(renderItem)}
        </div>

      </div>
    </div>
  );
}
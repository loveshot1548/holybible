import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { 
  ChurchIcon, FireIcon, BibleIcon, NotebookIcon, 
  SmileFaceIcon, DiaryIcon, PrayingHandsIcon, 
  UserFaceIcon, YoutubeIcon, HeartIcon, ReportIcon, MapIcon
} from '../utils/icons';

// =====================================================================
// iOS 시스템 전용 무채색/솔리드 아이콘
// =====================================================================
const BellIcon = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const MusicNoteIcon = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19.5V3.75l12-3v15.75m-12 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm12 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const DownloadIcon = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const CheckCircleIcon = ({ className }) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const SettingsIcon = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>;

// =====================================================================
// iOS 1x1 앱 아이콘 컴포넌트 (Squircle 디자인)
// =====================================================================
const AppIcon = ({ icon: Icon, label, bgClass, onClick, badge, isDark }) => (
  <div onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer group col-span-1">
    <div className={`relative w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-[16px] flex items-center justify-center transition-transform active:scale-90 shadow-sm ${bgClass}`}>
      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
      {badge && <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-[#FF3B30] rounded-full border-2 ${isDark ? 'border-black' : 'border-[#F2F2F7]'} text-white text-[10px] font-bold flex items-center justify-center z-10`}>N</span>}
    </div>
    <span className={`text-[11px] font-medium tracking-tight truncate w-full text-center ${isDark ? 'text-white' : 'text-black'}`}>{label}</span>
  </div>
);

// =====================================================================
// 스마트 스택 위젯 (유튜브 미디어 4x2)
// =====================================================================
const SmartStackWidget = ({ items, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!items || items.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full absolute inset-0">
      {items.map((item, idx) => {
        const isActive = activeIndex === idx;
        return (
          <div key={idx} onClick={() => isActive ? window.open(item.url, '_blank') : setActiveIndex(idx)}
            className={`snap-center shrink-0 h-full transition-all duration-300 ease-out cursor-pointer relative ${isActive ? 'w-full opacity-100' : 'w-[20%] opacity-40 hover:opacity-80'}`}
          >
            <img src={item.bg} alt={item.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-end">
                <h4 className="text-white font-bold text-[14px] drop-shadow-md">{item.title}</h4>
                <div className="bg-white/20 backdrop-blur-md text-white rounded-full p-2"><YoutubeIcon className="w-4 h-4"/></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function Home({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, openModal, bibleProgress, currDay, date, setDate, hasNewBoardPost,
  formatVerse, dateHash, currentBgUrl, updateDay, isWknd, ymdStr, authUser, streak5
}) {
  const [greetingMsg, setGreetingMsg] = useState(null);
  const [praiseItem, setPraiseItem] = useState(null);
  const verseCardRef = useRef(null);
  const isMoHana = (authUser?.name || authUser) === '모하나';
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  
  const ui = {
    bgApp: isDark ? 'bg-[#000000]' : 'bg-[#F2F2F7]',
    bgWidget: isDark ? 'bg-[#1C1C1E]' : 'bg-[#FFFFFF]',
    textMain: isDark ? 'text-[#FFFFFF]' : 'text-[#000000]',
    textSub: isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]',
    dockBg: isDark ? 'bg-[#1C1C1E]/70 border-[#38383A]/50' : 'bg-[#FFFFFF]/70 border-white/50',
  };

  useEffect(() => {
    if (!isMoHana) return;
    const fetchSecretBanners = async () => {
      const { data } = await supabase.from('secret_injections').select('*').in('type', ['greeting', 'praise']).order('created_at', { ascending: false });
      if (data) {
        const g = data.find(item => item.type === 'greeting');
        const p = data.find(item => item.type === 'praise');
        if (g) setGreetingMsg(g.content);
        if (p) setPraiseItem(p.content);
      }
    };
    fetchSecretBanners();
    const sub = supabase.channel('home_injections_chan').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_injections' }, payload => {
        if (payload.new.type === 'greeting') setGreetingMsg(payload.new.content);
        if (payload.new.type === 'praise') setPraiseItem(payload.new.content);
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [isMoHana]);

  const safeFormatVerse = formatVerse || { text: '말씀을 불러오는 중입니다...', ref: '' };
  const safeBgUrl = currentBgUrl || 'https://picsum.photos/seed/qtwatercolors0/800/1500';
  const currentChecks = (currDay && currDay.checks) ? currDay.checks : {};
  const checkedCount = Object.values(currentChecks).filter(Boolean).length;

  const handleSaveVerseImage = async (e) => {
    e.stopPropagation();
    if (!verseCardRef.current) return;
    try {
      const canvas = await html2canvas(verseCardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a'); link.download = `오늘의_말씀카드_${ymdStr}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    } catch (err) { alert('말씀카드 저장 오류'); }
  };

  const worshipVideos = [
    { title: isWknd ? '주일예배' : '새벽예배', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+${isWknd ? '주일예배' : '새벽예배'}+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=400&q=80' },
    { title: '맥체인 듣기', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+맥체인+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80' }
  ];

  const currentDateObj = new Date(date);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={`flex-1 flex flex-col h-full ${ui.bgApp} overflow-hidden font-sans relative select-none`}>
      
      {/* 이슬비 작전: iOS 푸시 알림 스타일 배너 */}
      {isMoHana && greetingMsg && (
        <div className="absolute top-4 left-4 right-4 z-[100] animate-fade-in-up">
          <div className={`flex items-center gap-3 p-3.5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl ${isDark ? 'bg-[#2C2C2E]/80 border-[#38383A]' : 'bg-white/80 border-white'} border`}>
            <div className="w-10 h-10 rounded-[12px] bg-[#007AFF] flex items-center justify-center text-white shrink-0"><BellIcon className="w-5 h-5" /></div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className={`text-[12px] font-bold ${ui.textMain}`}>메시지</span>
              <span className={`text-[13px] font-medium truncate ${ui.textSub}`}>{greetingMsg}</span>
            </div>
          </div>
        </div>
      )}

      {/* 바탕 뷰포트 (iOS 홈 화면 그리드 영역) */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 hide-scrollbar">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-x-4 gap-y-5 max-w-3xl mx-auto">
          
          {/* ================================================================= */}
          {/* WIDGET 1 (2x2): 날짜 및 요일 위젯 (Apple Calendar Style) */}
          {/* ================================================================= */}
          <div className={`col-span-2 aspect-square rounded-[22px] shadow-sm flex flex-col items-center justify-center relative active:scale-95 transition-transform ${ui.bgWidget}`}>
            <span className={`text-[13px] font-bold ${currentDateObj.getDay() === 0 ? 'text-[#FF3B30]' : ui.textMain} uppercase tracking-widest`}>
              {dayNames[currentDateObj.getDay()]}요일
            </span>
            <span className={`text-[42px] font-normal tracking-tighter leading-none mt-1 ${ui.textMain}`}>
              {currentDateObj.getDate()}
            </span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>

          {/* ================================================================= */}
          {/* WIDGET 2 (2x2): 루틴 진행도 (Apple Fitness Rings Style) */}
          {/* ================================================================= */}
          <div onClick={() => setActiveScreen('fiveSetMenu')} className={`col-span-2 aspect-square rounded-[22px] shadow-sm p-3.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-transform ${ui.bgWidget}`}>
             <div className="flex justify-between items-center">
               <span className={`text-[11px] font-bold ${ui.textSub} uppercase tracking-wider`}>루틴 체크</span>
               <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded ${checkedCount === 5 ? 'bg-[#34C759] text-white' : (isDark ? 'bg-[#2C2C2E] text-[#8E8E93]' : 'bg-[#F2F2F7] text-[#8E8E93]')}`}>{checkedCount}/5</span>
             </div>
             <div className="grid grid-cols-2 gap-2 mt-auto h-[65%]">
                {[ { id: '감사'}, { id: '성경읽기'}, { id: 'QTin'}, { id: '기도하기'} ].map((item, idx) => {
                  const isChecked = currentChecks[item.id];
                  return (
                    <div key={idx} className={`w-full h-full rounded-[10px] flex items-center justify-center transition-colors ${isChecked ? 'bg-[#34C759]' : (isDark ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]')}`}>
                      {isChecked && <CheckCircleIcon className="w-6 h-6 text-white" />}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* ================================================================= */}
          {/* WIDGET 3 (4x2): 오늘의 말씀 카드 위젯 */}
          {/* ================================================================= */}
          <div ref={verseCardRef} onClick={() => openModal('fullVerse', { text: `${safeFormatVerse.text} ${safeFormatVerse.ref}`, bgHash: dateHash })}
             className="col-span-4 aspect-[2/1] rounded-[22px] shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${safeBgUrl})` }} crossOrigin="anonymous"></div>
             <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
             <div className="relative z-10 p-4 flex flex-col h-full justify-between">
               <div className="flex justify-between items-center">
                 <span className="text-[12px] font-bold text-white/90 uppercase tracking-widest">오늘의 말씀</span>
                 <button onClick={handleSaveVerseImage} data-html2canvas-ignore="true" className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><DownloadIcon className="w-4 h-4 text-white" /></button>
               </div>
               <div>
                 <span className="text-[14px] font-bold text-white leading-snug line-clamp-2 mb-1">{safeFormatVerse.text}</span>
                 <span className="text-[10px] font-medium text-white/70">{safeFormatVerse.ref}</span>
               </div>
             </div>
          </div>

          {/* ================================================================= */}
          {/* 이슬비 작전: 추천 찬양 (4x1 시스템 위젯) */}
          {/* ================================================================= */}
          {isMoHana && praiseItem && (
            <div onClick={() => { const urlMatch = praiseItem.match(/(https?:\/\/[^\s]+)/g); if (urlMatch) window.open(urlMatch[0], '_blank'); }}
              className={`col-span-4 rounded-[22px] p-3.5 shadow-sm flex items-center gap-3 cursor-pointer active:scale-95 transition-transform ${ui.bgWidget}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#FF2D55] flex items-center justify-center text-white shrink-0"><MusicNoteIcon className="w-5 h-5" /></div>
              <div className="flex flex-col overflow-hidden">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${ui.textSub}`}>추천 찬양</span>
                <span className={`text-[14px] font-medium truncate ${ui.textMain}`}>{praiseItem.replace(/(https?:\/\/[^\s]+)/g, '').trim()}</span>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* WIDGET 4 (4x2): 스마트 스택 유튜브 미디어 */}
          {/* ================================================================= */}
          <div className={`col-span-4 aspect-[2/1] rounded-[22px] shadow-sm relative overflow-hidden ${ui.bgWidget}`}>
             <SmartStackWidget items={worshipVideos} isDark={isDark} />
          </div>

          {/* ================================================================= */}
          {/* APP LIBRARY ICONS (1x1) - 애플 순정 앱 색상 매핑 */}
          {/* ================================================================= */}
          <AppIcon icon={FireIcon} label="매일 QT" bgClass="bg-gradient-to-b from-[#FFB340] to-[#FF9500]" onClick={() => setActiveScreen('qt')} isDark={isDark} />
          <AppIcon icon={NotebookIcon} label="맥체인" bgClass="bg-gradient-to-b from-[#32ADE6] to-[#007AFF]" onClick={() => setActiveScreen('mcheyne')} isDark={isDark} />
          <AppIcon icon={ReportIcon} label="예배 노트" bgClass="bg-gradient-to-b from-[#7D7AFF] to-[#5856D6]" onClick={() => setActiveScreen('sermon')} isDark={isDark} />
          <AppIcon icon={SmileFaceIcon} label="가정 예배" bgClass="bg-gradient-to-b from-[#30D158] to-[#34C759]" onClick={() => setActiveScreen('familySelect')} isDark={isDark} />
          
          <AppIcon icon={UserFaceIcon} label="목장 나눔" bgClass="bg-gradient-to-b from-[#FFD60A] to-[#FFCC00]" onClick={() => setActiveScreen('cell')} isDark={isDark} />
          <AppIcon icon={DiaryIcon} label="감사 일기" bgClass="bg-gradient-to-b from-[#FF375F] to-[#FF2D55]" onClick={() => setActiveScreen('diary')} badge={hasNewBoardPost} isDark={isDark} />
          <AppIcon icon={PrayingHandsIcon} label="기도함" bgClass="bg-gradient-to-b from-[#BF5AF2] to-[#AF52DE]" onClick={() => setActiveScreen('prayer')} isDark={isDark} />
          <AppIcon icon={MapIcon} label="성경 위키" bgClass="bg-gradient-to-b from-[#64D2FF] to-[#32ADE6]" onClick={() => setActiveScreen('bibleWiki')} isDark={isDark} />
          
          <AppIcon icon={ChurchIcon} label="설교 아카이브" bgClass="bg-gradient-to-b from-[#5E5CE6] to-[#5856D6]" onClick={() => setActiveScreen('sermonArchiveAdvanced')} isDark={isDark} />
          <AppIcon icon={SettingsIcon} label="양육/훈련" bgClass="bg-[#8E8E93]" onClick={() => setActiveScreen('trainingCurriculum')} isDark={isDark} />
        </div>
      </div>

      {/* =====================================================================
          하단 DOCK (홈 바) - 완벽한 iOS 프로스트 글래스 구현
          ===================================================================== */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px]">
        <div className={`flex items-center justify-around px-4 py-3.5 rounded-[32px] backdrop-blur-2xl shadow-xl border ${ui.dockBg}`}>
          <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-[50px] h-[50px] flex items-center justify-center rounded-[14px] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors">
            <MenuIcon className={`w-6 h-6 ${ui.textMain}`} />
          </div>
          <div onClick={() => setActiveScreen('home')} className="w-[50px] h-[50px] flex items-center justify-center rounded-[14px] bg-black/10 dark:bg-white/20 cursor-pointer shadow-sm">
            <ChurchIcon className={`w-6 h-6 ${ui.textMain}`} />
          </div>
          <div onClick={() => setActiveScreen('bible')} className="w-[50px] h-[50px] flex items-center justify-center rounded-[14px] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors">
            <BibleIcon className={`w-6 h-6 ${ui.textMain}`} />
          </div>
          <div onClick={() => setActiveScreen('board')} className="w-[50px] h-[50px] flex items-center justify-center rounded-[14px] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors relative">
            <HeartIcon className={`w-6 h-6 ${ui.textMain}`} />
            {hasNewBoardPost && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white dark:border-[#1C1C1E]"></span>}
          </div>
        </div>
      </div>
    </div>
  );
}
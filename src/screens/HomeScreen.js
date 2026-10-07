import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { 
  ChurchIcon, FireIcon, BibleIcon, NotebookIcon, 
  SmileFaceIcon, DiaryIcon, PrayingHandsIcon, 
  UserFaceIcon, YoutubeIcon, HeadphonesIcon, HeartIcon, ReportIcon, MapIcon
} from '../utils/icons';

const ChevronRightIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CoverCarousel = ({ items, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-5 px-1 items-center w-full">
      {items.map((item, idx) => {
        const isActive = activeIndex === idx;
        
        return (
          <div
            key={idx}
            onClick={() => isActive ? window.open(item.url, '_blank') : setActiveIndex(idx)}
            className={`snap-center shrink-0 transition-all duration-500 ease-out cursor-pointer rounded-[20px] overflow-hidden relative shadow-sm border ${isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]'} ${
              isActive 
                ? 'w-[75vw] md:w-[360px] h-[200px] md:h-[260px] opacity-100 z-10' 
                : 'w-[15vw] md:w-[60px] h-[160px] md:h-[220px] opacity-50 hover:opacity-80 z-0'
            }`}
          >
            <img src={item.bg} alt={item.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/30 to-transparent"></div>
            
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 text-left transition-opacity duration-300">
                <h4 className="text-white font-bold text-[13px] md:text-[14.5px] drop-shadow-md break-keep mb-2.5">{item.title}</h4>
                <div className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 rounded-[10px] px-3.5 py-1.5 text-[10.5px] font-bold transition-colors">
                  영상 시청하기
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function Home({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  openModal, bibleProgress, readChapsCount, currDay, readChallengeStart,
  supabase, date, setDate, hasNewBoardPost, setHasNewBoardPost,
  formatVerse, dateHash, currentBgUrl, updateDay, triggerConfetti,
  isWknd, ymdStr, praiseChannels, authUser, dailyData, streak5
}) {
  
  const [showTuesdayPopup, setShowTuesdayPopup] = useState(false);

  useEffect(() => {
    const today = new Date().getDay(); 
    if (today === 2) {
      setShowTuesdayPopup(true);
    }
  }, []);

  const startD = new Date(readChallengeStart || date); 
  const dDay = Math.ceil((new Date().getTime() - startD.getTime()) / 86400000) + 1;
  const safeFormatVerse = formatVerse || { text: '말씀을 불러오는 중입니다...', ref: '' };
  const safeBgUrl = currentBgUrl || 'https://picsum.photos/seed/qtwatercolors0/800/1500';
  const currentChecks = (currDay && currDay.checks) ? currDay.checks : {};

  // 유튜브 URL 김포좋은나무교회 고정 처리 적용
  const worshipVideos = [
    { title: isWknd ? '우리들교회 주일예배' : '우리들교회 새벽예배', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+${isWknd ? '주일예배' : '새벽예배'}+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=400&q=80' },
    { title: '맥체인 듣기 (성경 낭독)', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+맥체인+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80' },
    { title: '맥체인 해설 (말씀 해설)', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+해설+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80' },
    { title: '좋은나무교회 새벽기도회', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+새벽기도회+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=400&q=80' },
    { title: '좋은나무교회 1분 설교', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+1분설교+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=400&q=80' }
  ];

  const verseCardRef = useRef(null);

  const handleSaveVerseImage = async (e) => {
    e.stopPropagation();
    if (!verseCardRef.current) return;
    try {
      const canvas = await html2canvas(verseCardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `오늘의_말씀카드_${ymdStr}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      alert('말씀카드 저장 중 오류가 발생했습니다.');
    }
  };

  // 모던 블루톤 테마
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const bgBody = isDark ? 'bg-[#0B1120]' : 'bg-[#F4F7FB]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  
  const glassCard = isDark 
    ? 'bg-[#111827]/90 border border-[#1E293B] shadow-sm backdrop-blur-md' 
    : 'bg-white/90 border border-[#E2E8F0] shadow-[0_4px_15px_rgba(149,157,165,0.08)] backdrop-blur-md';

  return (
    <div className={`flex-1 flex flex-col h-full ${bgBody} overflow-y-auto pb-[100px] hide-scrollbar animate-fade-in-up pointer-events-auto relative font-sans`}>
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full fixed" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,35 C75,55 25,15 0,40 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#17223B]' : 'fill-[#EBF3F8]'}`} />
            <path d="M0,40 C25,15 75,55 100,35 L100,65 C60,85 30,45 0,70 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#101828]' : 'fill-[#F0F6F9]'}`} />
            <path d="M0,70 C30,45 60,85 100,65 L100,100 L0,100 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#0B1120]' : 'fill-[#F4F7FB]'}`} />
          </svg>
      </div>

      {showTuesdayPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-md pointer-events-auto">
          <div className={`${isDark ? 'bg-[#0B1120] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} p-6 rounded-[24px] max-w-sm w-full shadow-2xl border text-center space-y-4`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-[#F43F5E]/10 text-[#F43F5E]' : 'bg-[#FFE4E6] text-[#E11D48]'} rounded-[14px] flex items-center justify-center mx-auto text-xl`}>
               <YoutubeIcon className="w-6 h-6" />
            </div>
            <h3 className={`text-[15px] font-bold ${textMain}`}>터치유 더치유 라이브</h3>
            <p className={`text-[12.5px] ${textSub} font-medium leading-[1.6]`}>매주 화요일은 라이브 방송일입니다!<br/>은혜로운 말씀과 교제를 함께 나누세요.</p>
            <div className="flex gap-2 pt-2">
              <a 
                href="https://www.youtube.com/results?search_query=김포좋은나무교회" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex-1 py-2.5 ${isDark ? 'bg-[#E11D48] hover:bg-[#BE123C]' : 'bg-[#F43F5E] hover:bg-[#E11D48]'} text-white font-bold rounded-[12px] text-[12.5px] flex items-center justify-center transition-colors`}
              >
                방송 보기
              </a>
              <button 
                onClick={() => setShowTuesdayPopup(false)} 
                className={`px-4 py-2.5 ${isDark ? 'bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]'} font-bold rounded-[12px] text-[12.5px] transition-colors`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {!supabase && ( <div className="bg-[#EF4444] text-white text-[10px] font-bold py-1.5 px-3 text-center shadow-md z-50 sticky top-0">SUPABASE 설정을 확인해주세요!</div> )}
      
      <div className={`flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 z-[45] pointer-events-auto border-b ${isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]'} bg-transparent sticky top-0 backdrop-blur-md`}>
        <div className="flex items-center gap-1.5">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 hover:opacity-80 transition-opacity`}><MenuIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${textMain}`} /></button>
           <div className={`relative inline-flex items-center cursor-pointer z-30 px-1.5 py-1 ${isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'} rounded-[10px]`}>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40" />
              <span className={`font-bold text-[13px] sm:text-[14px] ${textMain} tracking-tight select-none pointer-events-none flex items-center gap-1`}>
                 {new Date(date).toLocaleDateString('ko-KR', {month:'long', day:'numeric'})} 
                 ({['일','월','화','수','목','금','토'][new Date(date).getDay()]})
              </span>
           </div>
        </div>
        <div className="flex gap-1.5 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
           <button onClick={() => { setActiveScreen('board'); setHasNewBoardPost(false); }} className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-[8px] text-[10.5px] font-bold flex items-center justify-center gap-1 ${isDark ? 'bg-[#F43F5E]/10 text-[#F43F5E]' : 'bg-[#FFE4E6] text-[#E11D48]'} shadow-sm relative transition-transform hover:scale-105`}>
              <HeartIcon className="w-3.5 h-3.5" /> 감사나눔
              {hasNewBoardPost && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-ping"></span>}
           </button>
           <button onClick={() => { setActiveScreen('board'); setHasNewBoardPost(false); }} className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-[8px] text-[10.5px] font-bold flex items-center justify-center gap-1 ${isDark ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#D1FAE5] text-[#059669]'} shadow-sm relative transition-transform hover:scale-105`}>
              <PrayingHandsIcon className="w-3.5 h-3.5" /> 기도요청
           </button>
        </div>
      </div>

      <div className="px-3 sm:px-4 mt-3 mb-2 relative z-10 w-full max-w-4xl mx-auto">
        <div 
           ref={verseCardRef}
           className={`relative rounded-[20px] overflow-hidden shadow-sm cursor-pointer hover:opacity-95 transition-opacity min-h-[130px] flex flex-col justify-center border ${isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]'} mb-4`} 
           onClick={() => openModal('fullVerse', { text: `${safeFormatVerse.text} ${safeFormatVerse.ref}`, bgHash: dateHash })}
        >
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${safeBgUrl})` }} crossOrigin="anonymous"></div>
           <div className={`absolute inset-0 ${isDark ? 'bg-[#0B1120]/60' : 'bg-slate-900/40'} backdrop-blur-[2px]`}></div>
           <div className="relative z-10 p-4 mx-1 rounded-[16px] pb-8">
             <span className="text-[10.5px] font-bold text-white/90 mb-2 flex justify-between drop-shadow-md">
                 오늘의 말씀 카드 <span className="text-[9px] opacity-70">크게보기</span>
             </span>
             <span className="text-[13px] text-white font-bold leading-[1.6] drop-shadow-md break-keep">
                 {safeFormatVerse.text}
                 <span className="block mt-1.5 text-[10.5px] opacity-80">{safeFormatVerse.ref}</span>
             </span>
           </div>

           <button
              onClick={handleSaveVerseImage}
              data-html2canvas-ignore="true"
              style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 50 }}
              className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-white/20 border border-white/30 backdrop-blur-md text-white hover:bg-white/40 transition-all shadow-sm"
           >
              <DownloadIcon className="w-3.5 h-3.5" />
           </button>
        </div>

        <div className={`${glassCard} rounded-[20px] overflow-hidden pointer-events-auto mb-4 p-3.5 sm:p-4`}>
           <h2 className={`text-[15px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><FireIcon className={`w-5 h-5 ${isDark ? 'text-[#F43F5E]' : 'text-[#E11D48]'}`} /> 영적 5종 세트</h2>
           <p className={`text-[11px] font-medium ${textSub} mb-3`}>매일의 영적 성장을 위한 루틴</p>
           
           <div className="flex flex-col sm:flex-row gap-2">
               
               <div className={`p-3.5 rounded-[16px] border ${isDark ? 'border-[#1E293B] bg-[#0B1120]' : 'border-[#E2E8F0] bg-[#F8FAFC]'} flex-[3] flex justify-around items-center shadow-sm`}>
                  {[ 
                    { id: '감사', icon: <HeartIcon className={`w-5 h-5`} /> }, 
                    { id: '성경읽기', label: '맥체인', icon: <BibleIcon className={`w-5 h-5`} /> }, 
                    { id: 'QTin', icon: <FireIcon className={`w-5 h-5`} /> } 
                  ].map(item => {
                    const isChecked = currentChecks[item.id];
                    let bgClass = `border ${isDark ? 'border-[#1E293B] bg-[#0F172A]' : 'border-[#E2E8F0] bg-white'}`;
                    let iconColor = textSub;
                    
                    if (isChecked) {
                        if (item.id === '성경읽기') { 
                            bgClass = isDark ? 'bg-[#0284C7]/20 border-[#0284C7]/40 shadow-sm scale-110' : 'bg-[#E0F2FE] border-[#BAE6FD] shadow-sm scale-110'; 
                            iconColor = isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'; 
                        }
                        else if (item.id === '감사') { 
                            bgClass = isDark ? 'bg-[#E11D48]/20 border-[#E11D48]/40 shadow-sm scale-110' : 'bg-[#FFE4E6] border-[#FECDD3] shadow-sm scale-110'; 
                            iconColor = isDark ? 'text-[#F43F5E]' : 'text-[#E11D48]'; 
                        }
                        else { 
                            bgClass = isDark ? 'bg-[#D97706]/20 border-[#D97706]/40 shadow-sm scale-110' : 'bg-[#FEF3C7] border-[#FDE68A] shadow-sm scale-110'; 
                            iconColor = isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'; 
                        }
                    } else { 
                        iconColor = item.id === '감사' ? (isDark?'text-[#F43F5E]':'text-[#E11D48]') : item.id === '성경읽기' ? (isDark?'text-[#38BDF8]':'text-[#0284C7]') : (isDark?'text-[#F59E0B]':'text-[#D97706]'); 
                    }
                    
                    return (
                      <div key={item.id} onClick={() => { updateDay({ checks: { ...currentChecks, [item.id]: !isChecked } }); if (!isChecked) triggerConfetti(); }} className="flex flex-col items-center cursor-pointer hover:-translate-y-1 transition-transform group">
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all ${bgClass}`}>
                            <span className={isChecked ? iconColor : `opacity-50 group-hover:opacity-100 transition-opacity ${iconColor}`}>{item.icon}</span>
                        </div>
                        <span className={`text-[9.5px] mt-1.5 font-bold whitespace-nowrap ${isChecked ? textMain : textSub}`}>{item.label || item.id}</span>
                      </div>
                    );
                  })}
               </div>
               
               <div className={`p-3.5 rounded-[16px] border ${isDark ? 'border-[#334155] bg-[#1E293B]/50' : 'border-[#E2E8F0] bg-[#F1F5F9]/50'} flex-[2] flex justify-around items-center shadow-sm`}>
                  {[ 
                    { id: '기도하기', label: '기도', icon: <PrayingHandsIcon className={`w-5 h-5`} /> }, 
                    { id: '가정예배', label: '예배', icon: <SmileFaceIcon className={`w-5 h-5`} /> } 
                  ].map(item => {
                    const isChecked = currentChecks[item.id];
                    let bgClass = `border ${isDark ? 'border-[#1E293B] bg-[#0F172A]' : 'border-[#E2E8F0] bg-white'}`;
                    let iconColor = isDark ? 'text-[#A78BFA]' : 'text-[#7C3AED]';
                    
                    if (isChecked) {
                        if (item.id === '기도하기') { 
                            bgClass = isDark ? 'bg-[#059669]/20 border-[#059669]/40 shadow-sm scale-110' : 'bg-[#D1FAE5] border-[#A7F3D0] shadow-sm scale-110'; 
                            iconColor = isDark ? 'text-[#34D399]' : 'text-[#059669]'; 
                        }
                        else { 
                            bgClass = isDark ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 shadow-sm scale-110' : 'bg-[#F3E8FF] border-[#E9D5FF] shadow-sm scale-110'; 
                            iconColor = isDark ? 'text-[#A78BFA]' : 'text-[#7C3AED]'; 
                        }
                    } else { 
                        iconColor = item.id === '기도하기' ? (isDark?'text-[#34D399]':'text-[#059669]') : (isDark?'text-[#A78BFA]':'text-[#7C3AED]'); 
                    }
                    
                    return (
                      <div key={item.id} onClick={() => { updateDay({ checks: { ...currentChecks, [item.id]: !isChecked } }); if (!isChecked) triggerConfetti(); }} className="flex flex-col items-center cursor-pointer hover:-translate-y-1 transition-transform group">
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${bgClass}`}>
                            <span className={isChecked ? iconColor : `opacity-50 scale-90 group-hover:opacity-100 transition-opacity ${iconColor}`}>{item.icon}</span>
                        </div>
                        <span className={`text-[9.5px] mt-1.5 font-bold whitespace-nowrap ${isChecked ? textMain : textSub}`}>{item.label || item.id}</span>
                      </div>
                    );
                  })}
               </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
           <div onClick={() => setActiveScreen('fiveSetMenu')} className={`${glassCard} p-3.5 rounded-[20px] cursor-pointer flex flex-col items-center justify-center hover:-translate-y-1 transition-transform`}>
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center mb-2 ${isDark ? 'bg-[#0F172A] text-[#F59E0B] border border-[#1E293B]' : 'bg-[#F8FAFC] text-[#D97706] border border-[#E2E8F0]'} shadow-sm`}><SunflowerIcon className="w-4 h-4" /></div>
              <span className={`text-[10px] font-bold ${textSub} mb-0.5 whitespace-nowrap`}>세트 관리</span><span className={`text-[13.5px] font-bold ${isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} whitespace-nowrap`}>{streak5 || 0}일 연속</span>
           </div>
           <div onClick={() => { setActiveScreen('bible'); openModal('bibleChallenge'); }} className={`${glassCard} p-3.5 rounded-[20px] cursor-pointer flex flex-col items-center justify-center hover:-translate-y-1 transition-transform`}>
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center mb-2 ${isDark ? 'bg-[#0F172A] text-[#38BDF8] border border-[#1E293B]' : 'bg-[#F8FAFC] text-[#0284C7] border border-[#E2E8F0]'} shadow-sm`}><BibleIcon className="w-4 h-4" /></div>
              <span className={`text-[10px] font-bold ${textSub} mb-0.5 whitespace-nowrap`}>통독 챌린지</span><span className={`text-[13.5px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mb-1.5 whitespace-nowrap`}>D-{dDay > 0 ? dDay : 0}</span>
              <div className={`w-full max-w-[80px] ${isDark ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'} rounded-full h-1.5 overflow-hidden`}><div className={`bg-[#38BDF8] h-full transition-all duration-500`} style={{width:`${bibleProgress}%`}}></div></div>
           </div>
        </div>
      </div>
      
      <div className="px-3 sm:px-4 mt-3 mb-2 relative z-10 w-full max-w-4xl mx-auto">
         <h2 className={`text-[14.5px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><BibleIcon className={`w-5 h-5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 말씀</h2>
         <p className={`text-[10.5px] font-medium ${textSub} mb-3`}>오늘 내게 주시는 양식</p>
         <div className="grid grid-cols-2 gap-3 mb-4">
            <div onClick={() => setActiveScreen('qt')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex items-center justify-center gap-2.5 hover:-translate-y-1 transition-transform`}>
               <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${isDark ? 'bg-[#F43F5E]/10 text-[#F43F5E]' : 'bg-[#FFE4E6] text-[#E11D48]'} shadow-sm`}><SunflowerIcon className="w-4.5 h-4.5" /></div><span className={`text-[12.5px] font-bold ${textMain} whitespace-nowrap`}>매일 QT</span>
            </div>
            <div onClick={() => setActiveScreen('mcheyne')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex items-center justify-center gap-2.5 hover:-translate-y-1 transition-transform`}>
               <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${isDark ? 'bg-[#38BDF8]/10 text-[#38BDF8]' : 'bg-[#E0F2FE] text-[#0284C7]'} shadow-sm`}><NotebookIcon className="w-4.5 h-4.5" /></div><span className={`text-[12.5px] font-bold ${textMain} whitespace-nowrap`}>맥체인 읽기</span>
            </div>
         </div>
      </div>

      <div className="px-3 sm:px-4 mt-3 mb-2 relative z-10 w-full max-w-4xl mx-auto">
         <h2 className={`text-[14.5px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><ChurchIcon className={`w-5 h-5 ${isDark ? 'text-[#34D399]' : 'text-[#059669]'}`} /> 예배</h2>
         <p className={`text-[10.5px] font-medium ${textSub} mb-3`}>예배 영상과 기록</p>
         
         <div className="mb-2.5 flex justify-between items-end px-1">
            <h3 className={`text-[12px] font-bold ${textMain} flex items-center gap-1.5`}><YoutubeIcon className={`w-4 h-4 ${isDark ? 'text-[#F43F5E]' : 'text-[#E11D48]'}`} /> 매일 예배 / 설교</h3>
         </div>
         
         <CoverCarousel items={worshipVideos} isDark={isDark} />

         <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
            <div onClick={() => setActiveScreen('sermon')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex items-center justify-center gap-2.5 hover:-translate-y-1 transition-transform`}>
               <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${isDark ? 'bg-[#38BDF8]/10 text-[#38BDF8]' : 'bg-[#E0F2FE] text-[#0284C7]'} shadow-sm`}><ReportIcon className="w-4.5 h-4.5" /></div><span className={`text-[12.5px] font-bold ${textMain} whitespace-nowrap`}>예배 노트</span>
            </div>
            <div onClick={() => setActiveScreen('familySelect')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex items-center justify-center gap-2.5 hover:-translate-y-1 transition-transform`}>
               <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${isDark ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#FEF3C7] text-[#D97706]'} shadow-sm`}><SmileFaceIcon className="w-4.5 h-4.5" /></div><span className={`text-[12.5px] font-bold ${textMain} whitespace-nowrap`}>가정 예배</span>
            </div>
         </div>
      </div>

      <div className="px-3 sm:px-4 mt-3 mb-2 relative z-10 w-full max-w-4xl mx-auto">
         <h2 className={`text-[14.5px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><DiaryIcon className={`w-5 h-5 ${isDark ? 'text-[#A78BFA]' : 'text-[#7C3AED]'}`} /> 묵상</h2>
         <p className={`text-[10.5px] font-medium ${textSub} mb-3`}>중보기도와 찬양</p>

         <div className="grid grid-cols-2 gap-3 mb-4">
            <div onClick={() => setActiveScreen('diary')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform`}>
               <div className="flex items-center gap-2 mb-1.5"><DiaryIcon className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#7C3AED]'}`} /> <span className={`text-[11.5px] font-bold ${textMain} whitespace-nowrap`}>감사/간증 일기</span></div>
            </div>
            <div onClick={() => setActiveScreen('prayer')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform`}>
               <div className="flex items-center gap-2 mb-1.5"><PrayingHandsIcon className={`w-4 h-4 ${isDark ? 'text-[#34D399]' : 'text-[#059669]'}`} /> <span className={`text-[11.5px] font-bold ${textMain} whitespace-nowrap`}>기도 보관함</span></div>
            </div>
         </div>

         <div className="mb-2.5 flex justify-between items-end px-1 mt-5">
            <h3 className={`text-[12px] font-bold ${textMain} flex items-center gap-1.5`}><HeadphonesIcon className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#7C3AED]'}`} /> 유튜브 찬양 채널</h3>
         </div>
         
         <CoverCarousel items={praiseChannels} isDark={isDark} />
      </div>
      
      <div className="px-3 sm:px-4 mt-3 mb-5 relative z-10 w-full max-w-4xl mx-auto">
         <h2 className={`text-[14.5px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><UserFaceIcon className={`w-5 h-5 ${isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'}`} /> 목장 나눔</h2>
         <p className={`text-[10.5px] font-medium ${textSub} mb-3`}>삶과 기도를 나누는 시간</p>
         <div onClick={() => setActiveScreen('cell')} className={`${glassCard} p-4 sm:p-5 rounded-[20px] cursor-pointer flex items-center justify-between hover:-translate-y-1 transition-transform group`}>
            <div className="flex items-center gap-3.5">
               <div className={`w-11 h-11 ${isDark ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#FEF3C7] text-[#D97706]'} rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}><UserFaceIcon className="w-5.5 h-5.5" /></div>
               <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${textMain}`}>목장 나눔 (작성/조회)</span>
                  <span className={`text-[10.5px] ${textSub} mt-0.5 font-medium`}>{authUser?.role === 'admin' ? '관리자 권한으로 승인/수정 가능' : '나눔 제출하기'}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="px-3 sm:px-4 mt-3 mb-10 relative z-10 w-full max-w-4xl mx-auto">
         <h2 className={`text-[14.5px] font-bold ${textMain} mb-1 flex items-center gap-1.5`}><NotebookIcon className={`w-5 h-5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 성경 연구 아카이브</h2>
         <p className={`text-[10.5px] font-medium ${textSub} mb-3`}>원어와 구조 심층 분석</p>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
           <div onClick={() => setActiveScreen('interlinear')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#818CF8]/10 text-[#818CF8]' : 'bg-[#E0E7FF] text-[#4F46E5]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><NotebookIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>원어 성경 연구</span>
           </div>
           
           <div onClick={() => setActiveScreen('bibleWiki')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#D1FAE5] text-[#059669]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><MapIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>성경 위키</span>
           </div>

           <div onClick={() => setActiveScreen('sermonAnalysis')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#FBBF24]/10 text-[#FBBF24]' : 'bg-[#FEF3C7] text-[#D97706]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><ReportIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>설교 분석</span>
           </div>

           <div onClick={() => setActiveScreen('sermonArchiveAdvanced')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#38BDF8]/10 text-[#38BDF8]' : 'bg-[#E0F2FE] text-[#0284C7]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><ChurchIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>설교 아카이브</span>
           </div>

           <div onClick={() => setActiveScreen('qtArchiveDetail')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#F43F5E]/10 text-[#F43F5E]' : 'bg-[#FFE4E6] text-[#E11D48]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><FireIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>QT 심층 분석</span>
           </div>

           <div onClick={() => setActiveScreen('applyTracker')} className={`${glassCard} p-4 rounded-[20px] cursor-pointer flex flex-col items-center hover:-translate-y-1 transition-transform group text-center`}>
              <div className={`w-9 h-9 ${isDark ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#FEF3C7] text-[#D97706]'} rounded-[12px] flex items-center justify-center mb-2 shadow-sm`}><SmileFaceIcon className="w-4.5 h-4.5" /></div>
              <span className={`text-[11.5px] font-bold ${textMain}`}>질문 트래커</span>
           </div>
         </div>
      </div>
    </div>
  );
}
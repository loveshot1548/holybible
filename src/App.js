// src/App.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import RadioPopup from './components/RadioPopup';
import { getMcheynePlan } from './mcheyneData';
import bibleData from './ko_ko.json'; 
import myFontUrl from './MYYeongnamnu.ttf'; 
import { supabase } from './lib/supabase';
import BibleWiki from './pages/BibleWiki';
import SermonArchive from './components/SermonArchive';
import ApplyTracker from './components/ApplyTracker';
import SermonArchiveAdvanced from './components/SermonArchiveAdvanced';
import BibleWikiAdvanced from './pages/BibleWikiAdvanced'; 
import Bible from './pages/Bible';
import BibleMapViewer from './components/BibleMapViewer';
import FiveSetMenu from './pages/FiveSetMenu';
import Diary from './pages/Diary';
import TrainingSubPages from './components/TrainingSubPages';
import FamilyScreens from './pages/FamilyScreens';
import Interlinear from './pages/Interlinear';
import QT from './pages/QT';
import SecretChat from './components/SecretChat';
import Mcheyne from './pages/Mcheyne';
import Cell from './pages/Cell';
import SermonDetail from './components/SermonDetail';
import Board from './pages/Board';
import Sermon from './pages/Sermon';
import MeditationPilgrimage from './components/MeditationPilgrimage';
import GeneralNote from './pages/GeneralNote';
import BibleReadNoteSplit from './components/BibleReadNoteSplit';
import PrayerBox from './pages/PrayerBox';
import Sidebar from './components/Sidebar';
import AppGuidebook from './components/AppGuidebook';
import DailyRoutine from './components/DailyRoutine';
import QTArchiveDetail from './pages/QTArchiveDetail';
import TrainingCurriculum from './components/TrainingCurriculum';
import JerichoWalk from './pages/JerichoWalk';
import SermonArchiveAnalytics from './components/SermonArchiveAnalytics'; 
import { CanvasEngine, StickerLayer } from './components/DrawingEngine';
import { newYearVerseCards, familyVerseCards } from './data/verseCards';
import MemoryFestivalBanner from './components/MemoryFestivalBanner';
import { useAppStore } from './store/useAppStore';
import AdminConsole from './components/AdminConsole';
import ReelsStudio from './components/layout/ReelsStudio';

// 🛡️ 앱 크래시 방어선 (Error Boundary)
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash Prevented:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', background: '#0F1115', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>일시적인 화면 렌더링 오류가 발생했습니다.</h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>데이터는 안전하게 보존되어 있습니다. 아래 버튼을 눌러 화면을 복구하세요.</p>
          <button onClick={() => { localStorage.removeItem('home_menu_order'); window.location.reload(true); }} style={{ padding: '12px 24px', background: '#38BDF8', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>안전하게 앱 재시작하기</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 🌟 QR 자동 출석 훅
function useAutoQRAttendance(authUser, onSuccess) {
  useEffect(() => {
    const handleQRCheck = async () => {
      if (!supabase) return;
      try {
        const params = new URLSearchParams(window.location.search);
        const isQR = params.get('qr_check');
        const currentName = typeof authUser === 'object' ? authUser?.name : authUser;
        if (isQR === 'true' && currentName) {
          const today = new Date();
          const attDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const dayOfWeek = today.getDay();
          let attType = '';
          if (dayOfWeek === 3) attType = '수요';
          else if (dayOfWeek === 5) attType = '금요';
          else if (dayOfWeek === 0) attType = '주일';
          else {
            alert('⚠️ 오늘은 정기 예배(수/금/일) 요일이 아닙니다.');
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
          const targetCell = authUser?.cell_name || authUser?.shepherdName || authUser?.group || '소속 목장';
          const { error } = await supabase.from('attendance_records').upsert({
            date: attDate,
            user_name: currentName,
            cell_name: targetCell,
            type: attType,
            status: '출석'
          }, { onConflict: 'date,user_name,type' });
          if (error) throw error;
          alert(`🎉 [${attType} 예배] ${currentName} 성도님 출석 체크가 완료되었습니다.`);
          window.history.replaceState({}, document.title, window.location.pathname);
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        console.error('QR 출석 오류:', err.message);
      }
    };
    handleQRCheck();
  }, [authUser, onSuccess]);
}

// =====================================================================
// 💎 활동 로그 수집 엔진
// =====================================================================
export const logUserAction = async (userName, page, actionType = 'view', detailText = '') => {
  if (!supabase) return;

  let deviceId = localStorage.getItem('gt_device_fingerprint');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('gt_device_fingerprint', deviceId);
  }

  let finalName = typeof userName === 'object' ? userName?.name : userName;
  let finalPage = page;

  if (!finalName) {
    try {
      const stored = localStorage.getItem('church_auth_user');
      finalName = stored ? JSON.parse(stored)?.name : `게스트_${deviceId.slice(-4)}`;
    } catch(e) {
      finalName = `게스트_${deviceId.slice(-4)}`;
    }
  }

  const nowIso = new Date().toISOString();

  try {
    await supabase.from('user_activity_log').insert([{
      user_name: finalName,
      page_visited: finalPage || 'home',
      action_type: actionType || 'view',
      action_detail: detailText ? String(detailText).substring(0, 300) : `${finalPage || 'home'} 열람`,
      created_at: nowIso
    }]);

    await supabase.from('user_activity').upsert({
      user_name: finalName,
      last_page: finalPage || 'home',
      updated_at: nowIso
    }, { onConflict: 'user_name' });

  } catch (e) {}
};

const StrokeW = "1.8";
const IconMenu = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconChevronRight = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><polyline points="9 18 15 12 9 6" /></svg>;
const IconHeart = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>;
const IconPray = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 14v4M7 10l3 3-2 2-3-3M3 14l3 3M14 6l3 3-2 2-3-3" /></svg>;
const IconFlame = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>;
const IconBook = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg>;
const IconSmile = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2-14.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm4 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-2 9a4.496 4.496 0 003.803-2.164.75.75 0 00-1.282-.8A2.996 2.996 0 0112 15a2.996 2.996 0 01-2.52-1.464.75.75 0 10-1.283.8A4.496 4.496 0 0012 16.5z"/></svg>;
const IconChurch = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2L2 10l1.5 2L5 10.8V22h14V10.8l1.5 1.2L22 10 12 2zm0 3.5l6 4.8V20h-4v-5H10v5H6v-9.7l6-4.8z"/></svg>;
const IconYoutube = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const IconPlay = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M8 5v14l11-7z"/></svg>;
const IconDocument = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconHeadphones = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 00-18 0v4.5A2.5 2.5 0 005.5 19h2A1.5 1.5 0 009 17.5V14a1.5 1.5 0 00-1.5-1.5h-2V12a7 7 0 1114 0v.5h-2A1.5 1.5 0 0015 14v3.5a1.5 1.5 0 001.5 1.5h2a2.5 2.5 0 002.5-2.5V12z" /></svg>;
const IconMap = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>;
const IconDownload = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconPeople = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const IconAnalytics = ({className}) => <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>;
const IconUser = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconPen = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const IconArrowLeft = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><polyline points="15 18 9 12 15 6" /></svg>;
const IconUsers = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;

// 커버플로우 스타일 카루셀
const CoverCarousel = ({ items }) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const centerPosition = scrollLeft + scrollRef.current.clientWidth / 2;

    let closestIdx = 0;
    let minDistance = Infinity;

    Array.from(scrollRef.current.children).forEach((child, idx) => {
       const childCenter = child.offsetLeft + child.clientWidth / 2;
       const distance = Math.abs(centerPosition - childCenter);
       if (distance < minDistance) {
           minDistance = distance;
           closestIdx = idx;
       }
    });
    if (activeIndex !== closestIdx) setActiveIndex(closestIdx);
  }, [activeIndex]);

  useEffect(() => {
    const t = setTimeout(() => handleScroll(), 100);
    return () => clearTimeout(t);
  }, [handleScroll]);

  if (!items || items.length === 0) return null;

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar py-6 w-full -mx-5 space-x-[-8vw] md:space-x-[-20px] items-center px-[17.5vw] md:px-[calc(50%-140px)]" 
      style={{ width: 'calc(100% + 40px)' }}
    >
      {items.map((item, idx) => {
        const isActive = activeIndex === idx;
        return (
          <div
            key={idx}
            onClick={() => {
               if (isActive) window.open(item.url, '_blank');
               else scrollRef.current.children[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }}
            className={`snap-center shrink-0 transition-all duration-300 ease-out cursor-pointer rounded-[24px] overflow-hidden relative border border-white/20 w-[65vw] md:w-[280px] aspect-[4/3] ${isActive ? 'scale-110 z-30 opacity-100 shadow-[0_15px_30px_rgba(0,0,0,0.3)]' : 'scale-90 z-10 opacity-40 hover:opacity-60'}`}
          >
            <img src={item.bg} alt={item.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'bg-gradient-to-t from-black/90 via-black/20 to-transparent' : 'bg-black/60'}`}></div>
            <div className={`absolute inset-0 p-5 flex flex-col justify-end text-left transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h4 className="text-white font-bold text-[15px] md:text-[18px] drop-shadow-md break-keep mb-3 leading-tight line-clamp-2">
                {item.title}
              </h4>
              <div className="inline-flex items-center justify-center gap-1.5 bg-[#007AFF] text-white rounded-full px-3 py-1.5 text-[11.5px] font-bold w-max shadow-md">
                <IconPlay className="w-3 h-3" /> 시청하기
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function Home({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, openModal, bibleProgress, readChapsCount,
  currDay, readChallengeStart, date, setDate, hasNewBoardPost, setHasNewBoardPost,
  formatVerse, dateHash, currentBgUrl, updateDay, triggerConfetti, isWknd, ymdStr, praiseChannels, authUser, streak5
}) {
  const [showTuesdayPopup, setShowTuesdayPopup] = useState(false);
  const startD = new Date(readChallengeStart); 
  const dDay = Math.ceil((new Date().getTime() - startD.getTime()) / 86400000) + 1;
  const safeVerse = formatVerse || { text: '오늘의 말씀을 불러오는 중입니다...', ref: '' };
  const currentChecks = (currDay && currDay.checks) ? currDay.checks : {};

  const worshipVideos = [
    { title: isWknd ? '우리들교회 주일예배' : '김양재 목사 큐티노트', url: `https://www.youtube.com/results?search_query=${isWknd ? '우리들교회+주일예배' : '김양재+목사+큐티노트'}+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80' },
    { title: '맥체인 듣기 (부산신성교회)', url: `https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경읽기+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80' },
    { title: '맥체인 해설 (부산신성교회)', url: `https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경+해설+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80' },
    { title: '좋은나무교회 새벽기도회', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+새벽기도회+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80' },
    { title: '좋은나무교회 1분 설교', url: `https://www.youtube.com/results?search_query=김포좋은나무교회+1분설교+${ymdStr}`, bg: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=800&q=80' }
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
    } catch (error) { alert('말씀카드 저장 중 오류가 발생했습니다.'); }
  };

  const defaultMenus = [
    { id: 'sermonArchiveAdvanced', icon: <IconChurch className="w-4 h-4"/>, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10', title: '삶의 적용과 실천', desc: '적용과 실천' },
    { id: 'qtArchiveDetail', icon: <IconFlame className="w-4 h-4"/>, color: 'text-[#FF2D55]', bg: 'bg-[#FF2D55]/10', title: 'QT 심층 분석', desc: 'QT 배경 및 적용' },
    { id: 'sermonAnalysis', icon: <IconAnalytics className="w-4 h-4"/>, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10', title: '설교 분석', desc: '전체 설교 DB' },
    { id: 'applyTracker', icon: <IconSmile className="w-4 h-4"/>, color: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/10', title: '적용 트래커', desc: '신앙 결단 모아보기' },
    { id: 'bibleWikiAdvanced', icon: <IconMap className="w-4 h-4"/>, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10', title: '성경 위키', desc: '지식 마인드맵' },
    { id: 'interlinear', icon: <IconDocument className="w-4 h-4"/>, color: 'text-[#5AC8FA]', bg: 'bg-[#5AC8FA]/10', title: '원어 성경', desc: '히브리어/헬라어' },
    { id: 'trainingCurriculum', icon: <IconBook className="w-4 h-4"/>, color: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/10', title: '양육 커리큘럼', desc: '성장 단계별 훈련' },
    { id: 'trainingSubPages', icon: <IconDocument className="w-4 h-4"/>, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10', title: '4주 심화 워크북', desc: '제자 훈련 심화' },
    { id: 'prayer', icon: <IconPray className="w-4 h-4"/>, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10', title: '기도 보관함', desc: '나의 기도 기록' },
    { id: 'jericho', icon: <IconMap className="w-4 h-4"/>, color: 'text-[#5AC8FA]', bg: 'bg-[#5AC8FA]/10', title: '여리고 땅밟기', desc: '세상을 향한 기도' }
  ];

  const [menuItems, setMenuItems] = useState(() => {
    try {
      const saved = localStorage.getItem('home_menu_order');
      return saved ? JSON.parse(saved) : defaultMenus;
    } catch(e) {
      localStorage.removeItem('home_menu_order');
      return defaultMenus;
    }
  });

  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (idx) => setDraggedItem(idx);
  const handleDragEnter = (idx) => {
    if (draggedItem === null || draggedItem === idx) return;
    const copy = [...menuItems];
    const target = copy.splice(draggedItem, 1)[0];
    copy.splice(idx, 0, target);
    setDraggedItem(idx);
    setMenuItems(copy);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
    localStorage.setItem('home_menu_order', JSON.stringify(menuItems));
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} overflow-y-auto pb-[140px] hide-scrollbar animate-fade-in-up pointer-events-auto relative`}>
      
      {showTuesdayPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md pointer-events-auto">
          <div className={`${t.cardBg} p-8 rounded-[32px] max-w-sm w-full shadow-2xl text-center space-y-5 border ${t.border}`}>
            <div className="w-16 h-16 bg-[#FF2D55]/10 text-[#FF2D55] rounded-full flex items-center justify-center mx-auto text-3xl"><IconYoutube className="w-8 h-8"/></div>
            <h3 className={`text-xl font-bold ${t.textMain} tracking-tight`}>터치유 더치유 라이브</h3>
            <p className={`text-sm ${t.textSub} leading-relaxed`}>매달 첫째 주 화요일은 라이브 방송일입니다!<br/>은혜로운 말씀과 교제를 함께 나누세요.</p>
            <div className="flex gap-3 pt-4">
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-[#FF2D55] hover:bg-[#E0244A] text-white font-bold rounded-[16px] text-[15px] flex items-center justify-center transition-colors shadow-md">방송 보기</a>
              <button onClick={() => setShowTuesdayPopup(false)} className={`px-6 py-4 ${isDarkMode ? 'bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]' : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'} font-bold rounded-[16px] text-[15px] transition-colors`}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 1열 고정 상단 네비게이션 바 */}
      <div className={`flex items-center justify-between px-4 pt-5 pb-2.5 z-[45] pointer-events-auto sticky top-0 ${isDarkMode ? 'bg-[#000000]/80' : 'bg-[#F5F5F7]/80'} backdrop-blur-xl border-b border-black/5 dark:border-white/5`}>
        <div className="flex items-center gap-2 min-w-0">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className={`w-9 h-9 flex items-center justify-center rounded-full active:scale-95 transition-transform shrink-0 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-[#1D1D1F]'}`}
           >
             <IconMenu className="w-4 h-4" />
           </button>
           
           <div className={`relative inline-flex items-center cursor-pointer px-3.5 h-9 rounded-full backdrop-blur-md border transition-all active:scale-95 shrink-0 ${isDarkMode ? 'bg-white/10 border-white/10 text-white' : 'bg-white/70 border-black/5 text-[#1D1D1F] shadow-sm'}`}>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40" />
              <span className="font-black text-[13.5px] tracking-tight select-none pointer-events-none whitespace-nowrap flex items-center">
                 {new Date(date).toLocaleDateString('ko-KR', {month:'numeric', day:'numeric'})} 
                 <span className={`text-[11px] ml-1 font-semibold ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                   ({['일','월','화','수','목','금','토'][new Date(date).getDay()]})
                 </span>
              </span>
           </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
           <button 
             onClick={() => { setActiveScreen('board'); setHasNewBoardPost(false); }} 
             className={`h-9 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all border whitespace-nowrap ${isDarkMode ? 'bg-white/10 border-white/10 text-[#FF375F]' : 'bg-white/70 border-black/5 text-[#FF2D55] shadow-sm'} relative`}
           >
              <IconHeart className="w-3.5 h-3.5" />
              <span>공동체 감사</span>
              {hasNewBoardPost && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF2D55] rounded-full animate-pulse"></span>}
           </button>
           
           <button 
             onClick={() => { setActiveScreen('board'); setHasNewBoardPost(false); }} 
             className={`h-9 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all border whitespace-nowrap ${isDarkMode ? 'bg-white/10 border-white/10 text-[#30D158]' : 'bg-white/70 border-black/5 text-[#34C759] shadow-sm'}`}
           >
              <IconPray className="w-3.5 h-3.5" />
              <span>공동체 기도</span>
           </button>
        </div>
      </div>

      <div className="px-5 mt-4 mb-4 max-w-[1200px] mx-auto w-full">
        
        <div className="px-3 sm:px-4 mb-3">
          <MemoryFestivalBanner 
            isDarkMode={isDarkMode} 
            currDay={currDay} 
            date={date} 
            onCompleteCheck={() => {
              if (updateDay) {
                updateDay({ checks: { ...(currDay?.checks || {}), '암송': true } });
              }
            }} 
          />
        </div>

        {/* 오늘의 말씀 카드 */}
        <div ref={verseCardRef} className={`relative rounded-[32px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.08)] cursor-pointer hover:scale-[0.99] transition-all min-h-[200px] flex flex-col justify-center border ${t.border} mb-8`} onClick={() => openModal('fullVerse', { text: `${safeVerse.text} ${safeVerse.ref}`, bgHash: dateHash })}>
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgUrl})` }} crossOrigin="anonymous"></div>
           <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
           <div className="relative z-10 p-6 md:p-8 pb-14 h-full flex flex-col justify-between">
             <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mb-3 flex items-center gap-1.5 drop-shadow-md">
                 <IconFlame className="w-3.5 h-3.5 text-[#FF9500]"/> Today's Word
             </span>
             <span className="text-[20px] md:text-[24px] text-white font-bold leading-[1.6] drop-shadow-lg break-keep font-yeongnamnu tracking-wide">
                 "{safeVerse.text}"
             </span>
             <span className="block mt-4 text-[13px] text-white/80 font-sans tracking-normal font-bold">{safeVerse.ref}</span>
           </div>
           <button onClick={handleSaveVerseImage} title="저장" data-html2canvas-ignore="true" className="absolute bottom-5 right-5 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 border border-white/20 backdrop-blur-xl text-white hover:bg-white/40 transition-all z-50">
              <IconDownload className="w-4 h-4" />
           </button>
        </div>

        {/* 영적 5종 세트 */}
        <div className="mb-8">
           <div className="flex justify-between items-end mb-3 px-1">
              <div>
                 <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight flex items-center gap-2`}><IconFlame className={`w-5 h-5 text-[#FF9500]`} /> 영적 5종 세트</h2>
              </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-3">
               <div className={`p-4 md:p-5 rounded-[24px] border ${t.border} flex-[3] flex justify-around items-center ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
                  {[ 
                    { id: '감사', color: '#FF2D55', icon: <IconHeart className={`w-6 h-6`} /> }, 
                    { id: '성경읽기', label: '성경', color: '#007AFF', icon: <IconBook className={`w-6 h-6`} /> }, 
                    { id: 'QTin', color: '#FF9500', icon: <IconFlame className={`w-6 h-6`} /> } 
                  ].map(item => {
                    const isChecked = currentChecks[item.id];
                    return (
                      <div key={item.id} onClick={() => { updateDay({ checks: { ...currentChecks, [item.id]: !isChecked } }); if (!isChecked) triggerConfetti(); }} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[16px] flex items-center justify-center transition-all duration-300 ${isChecked ? 'shadow-md scale-105' : `${isDarkMode?'bg-[#2C2C2E]':'bg-[#F2F2F7]'}`}`} style={isChecked ? {backgroundColor: item.color, color: 'white'} : {color: t.textSub}}>
                            {item.icon}
                        </div>
                        <span className={`text-[11.5px] mt-2 font-bold whitespace-nowrap ${isChecked ? t.textMain : t.textSub}`}>{item.label || item.id}</span>
                      </div>
                    );
                  })}
               </div>
               
               <div className={`p-4 md:p-5 rounded-[24px] border ${t.border} flex-[2] flex justify-around items-center ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
                  {[ 
                    { id: '기도하기', label: '기도', color: '#34C759', icon: <IconPray className={`w-6 h-6`} /> }, 
                    { id: '가정예배', label: '가정예배', color: '#AF52DE', icon: <IconSmile className={`w-6 h-6`} /> } 
                  ].map(item => {
                    const isChecked = currentChecks[item.id];
                    return (
                      <div key={item.id} onClick={() => { updateDay({ checks: { ...currentChecks, [item.id]: !isChecked } }); if (!isChecked) triggerConfetti(); }} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform group">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[16px] flex items-center justify-center transition-all duration-300 ${isChecked ? 'shadow-md scale-105' : `${isDarkMode?'bg-[#2C2C2E]':'bg-[#F2F2F7]'}`}`} style={isChecked ? {backgroundColor: item.color, color: 'white'} : {color: t.textSub}}>
                            {item.icon}
                        </div>
                        <span className={`text-[11.5px] mt-2 font-bold whitespace-nowrap ${isChecked ? t.textMain : t.textSub}`}>{item.label || item.id}</span>
                      </div>
                    );
                  })}
               </div>
           </div>
        </div>

        {/* 챌린지 및 통독 스탯 */}
        <div className="grid grid-cols-2 gap-3 mb-10">
           <div onClick={() => setActiveScreen('fiveSetMenu')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-[0.98] transition-transform`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#FF9500]/10 text-[#FF9500]`}><IconFlame className="w-5 h-5" /></div>
              <span className={`text-[12px] font-bold ${t.textSub} mb-1 whitespace-nowrap`}>연속 실천 기록</span>
              <span className={`text-[18px] md:text-[20px] font-black text-[#FF9500] whitespace-nowrap tracking-tight`}>{streak5 || 0}일</span>
           </div>
           <div onClick={() => { setActiveScreen('bible'); openModal('bibleChallenge'); }} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-[0.98] transition-transform`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#007AFF]/10 text-[#007AFF]`}><IconBook className="w-5 h-5" /></div>
              <span className={`text-[12px] font-bold ${t.textSub} mb-1 whitespace-nowrap`}>통독 365 챌린지</span>
              <span className={`text-[18px] md:text-[20px] font-black text-[#007AFF] mb-2 whitespace-nowrap tracking-tight`}>D-{dDay > 0 ? dDay : 0}</span>
              <div className={`w-full max-w-[100px] ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]'} rounded-full h-1 overflow-hidden`}><div className={`bg-[#007AFF] h-full transition-all duration-700`} style={{width:`${bibleProgress}%`}}></div></div>
           </div>
        </div>

        {/* 1. 말씀 */}
        <div className="mb-10">
           <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight mb-3 flex items-center gap-2 px-1`}><IconBook className={`w-5 h-5 text-[#007AFF]`} /> 말씀</h2>
           <div className="grid grid-cols-2 gap-3 mb-3">
              <div onClick={() => setActiveScreen('qt')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-95 transition-transform group`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#FF2D55]/10 text-[#FF2D55]`}><IconFlame className="w-5 h-5" /></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} whitespace-nowrap`}>매일 QT</span>
              </div>
              <div onClick={() => setActiveScreen('mcheyne')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-95 transition-transform group`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#007AFF]/10 text-[#007AFF]`}><IconDocument className="w-5 h-5" /></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} whitespace-nowrap`}>맥체인 읽기</span>
              </div>
           </div>
           <div onClick={() => setActiveScreen('generalNote')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex items-center justify-between active:scale-[0.98] transition-transform group`}>
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 bg-[#AF52DE]/10 rounded-full flex items-center justify-center text-[#AF52DE]`}><IconPen className="w-5 h-5" /></div>
                 <div className="flex flex-col"><span className={`text-[14.5px] font-bold ${t.textMain} whitespace-nowrap`}>자유 말씀 노트</span><span className={`text-[11.5px] font-medium text-[#8E8E93]`}>말씀을 첨부하고 마음껏 필기하세요</span></div>
              </div>
              <IconChevronRight className={`w-4 h-4 text-[#C7C7CC]`} />
           </div>
        </div>

        {/* 2. 예배 */}
        <div className="mb-10">
           <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight mb-3 flex items-center gap-2 px-1`}><IconChurch className={`w-5 h-5 text-[#34C759]`} /> 예배</h2>
           
           <div className="mb-3 flex justify-between items-center px-1">
              <h3 className={`text-[14px] font-bold ${t.textMain} flex items-center gap-1.5`}><IconYoutube className={`w-4 h-4 text-[#FF2D55]`} /> 매일 예배 및 설교</h3>
           </div>
           <CoverCarousel items={worshipVideos} t={t} />

           <div className="grid grid-cols-2 gap-3 mt-4">
              <div onClick={() => setActiveScreen('sermon')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-[0.98] transition-transform group`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#007AFF]/10 text-[#007AFF]`}><IconDocument className="w-5 h-5" /></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} whitespace-nowrap`}>예배 노트 작성</span>
              </div>
              <div onClick={() => setActiveScreen('familySelect')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col items-center justify-center active:scale-[0.98] transition-transform group`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#FF9500]/10 text-[#FF9500]`}><IconSmile className="w-5 h-5" /></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} whitespace-nowrap`}>가정 예배 시작</span>
              </div>
           </div>
        </div>

        {/* 3. 묵상 */}
        <div className="mb-10">
           <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight mb-3 flex items-center gap-2 px-1`}><IconHeart className={`w-5 h-5 text-[#AF52DE]`} /> 묵상</h2>

           <div className="grid grid-cols-2 gap-3 mb-6">
              <div onClick={() => setActiveScreen('diary')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col active:scale-[0.98] transition-transform group`}>
                 <div className="flex items-center gap-2 mb-2"><div className="w-10 h-10 rounded-full bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center"><IconHeart className="w-5 h-5"/></div></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} mb-0.5`}>감사/간증 일기</span>
                 <span className={`text-[11.5px] font-medium text-[#8E8E93] break-keep`}>나의 묵상과 감사 기록</span>
              </div>
              <div onClick={() => setActiveScreen('prayer')} className={`${t.cardBg} p-5 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex flex-col active:scale-[0.98] transition-transform group`}>
                 <div className="flex items-center gap-2 mb-2"><div className="w-10 h-10 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center"><IconPray className="w-5 h-5"/></div></div>
                 <span className={`text-[14.5px] font-bold ${t.textMain} mb-0.5`}>나의 기도함</span>
                 <span className={`text-[11.5px] font-medium text-[#8E8E93] break-keep`}>나의 기도와 중보기도</span>
              </div>
           </div>

           <div className="mb-3 flex justify-between items-center px-1">
              <h3 className={`text-[14px] font-bold ${t.textMain} flex items-center gap-1.5`}><IconHeadphones className={`w-4 h-4 text-[#AF52DE]`} /> 유튜브 찬양 채널</h3>
           </div>
           <CoverCarousel items={praiseChannels} t={t} />
        </div>
        
        {/* 4. 목장 나눔 */}
        <div className="mb-10">
           <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight mb-3 flex items-center gap-2 px-1`}><IconPeople className={`w-5 h-5 text-[#FF9500]`} /> 목장 나눔</h2>
           <div onClick={() => setActiveScreen('cell')} className={`${t.cardBg} p-5 md:p-6 rounded-[24px] cursor-pointer shadow-sm border ${t.border} flex items-center justify-between active:scale-[0.99] transition-transform group`}>
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 bg-[#FF9500]/10 rounded-full flex items-center justify-center text-[#FF9500]`}><IconPeople className="w-6 h-6" /></div>
                 <div className="flex flex-col">
                    <span className={`text-[15px] font-bold ${t.textMain}`}>목장 나눔 (작성/조회)</span>
                    <span className={`text-[11.5px] font-medium text-[#8E8E93] mt-0.5`}>{authUser?.role === 'admin' ? '관리자 권한 활성화됨' : '말씀/감사 나눔 제출하기'}</span>
                 </div>
              </div>
              <IconChevronRight className={`w-5 h-5 text-[#C7C7CC]`} />
           </div>
        </div>

        {/* 5. 통합 대시보드 */}
        <div className="mb-12">
           <div className="flex justify-between items-center px-1 mb-3">
             <h2 className={`text-[18px] font-bold ${t.textMain} tracking-tight flex items-center gap-2`}>
               <IconAnalytics className={`w-5 h-5 text-[#5AC8FA]`} /> 성경 연구 & 추가 메뉴
             </h2>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             {menuItems.map((item, index) => (
               <div 
                 key={item.id} 
                 draggable
                 onDragStart={() => handleDragStart(index)}
                 onDragEnter={() => handleDragEnter(index)}
                 onDragEnd={handleDragEnd}
                 onDragOver={(e) => e.preventDefault()}
                 onClick={() => setActiveScreen(item.id)} 
                 className={`${t.cardBg} p-3.5 rounded-[20px] cursor-grab shadow-sm border ${t.border} flex flex-col justify-between h-[95px] active:scale-[0.98] transition-all select-none ${draggedItem === index ? 'opacity-30 scale-95' : 'opacity-100'}`}
               >
                  <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="mt-auto pointer-events-none">
                      <span className={`text-[13.5px] font-bold ${t.textMain} block truncate`}>{item.title}</span>
                      <span className={`text-[11px] font-medium text-[#8E8E93] truncate block mt-0.5`}>{item.desc}</span>
                  </div>
               </div>
             ))}
             
             <div onClick={() => setActiveScreen('board')} className={`col-span-2 ${t.cardBg} p-4 rounded-[20px] cursor-pointer shadow-sm border ${t.border} flex items-center justify-between active:scale-[0.98] transition-transform relative mt-1`}>
                 <div className="flex items-center gap-3.5">
                     <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#FF9500]/10 text-[#FF9500]`}><IconUsers className="w-5 h-5" /></div>
                     <div className="flex flex-col">
                         <span className={`text-[14.5px] font-bold ${t.textMain} block`}>공동체 게시판</span>
                         <span className={`text-[11.5px] font-medium text-[#8E8E93] mt-0.5`}>성도들의 기도와 감사 나눔</span>
                     </div>
                 </div>
                 {hasNewBoardPost && <span className="absolute top-4 right-4 w-2 h-2 bg-[#FF2D55] rounded-full animate-pulse"></span>}
                 <IconChevronRight className={`w-4 h-4 text-[#C7C7CC]`} />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

const getArr = (val, def = []) => Array.isArray(val) ? val : def;
const safeParse = (key, def) => { try { const val = localStorage.getItem(key); if (!val) return def; const parsed = JSON.parse(val); return parsed !== null ? parsed : def; } catch(e) { return def; } };
const safeSetItem = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { console.warn(`[용량 초과 방어] ${key} 저장 실패`); } };

const bibles = typeof bibleData !== 'undefined' && bibleData.length > 0 ? bibleData : [{ name: "Genesis", chapters: [["태초에 하나님이 천지를 창조하시니라"]] }];
const bookNamesKo = {"Genesis":"창세기","Exodus":"출애굽기","Leviticus":"레위기","Numbers":"민수기","Deuteronomy":"신명기","Joshua":"여호수아","Judges":"사사기","Ruth":"룻기","1 Samuel":"사무엘상","2 Samuel":"사무엘하","1 Kings":"열왕기상","2 Kings":"열왕기하","1 Chronicles":"역대상","2 Chronicles":"역대하","Ezra":"에스라","Nehemiah":"느헤미야","Esther":"에스더","Job":"욥기","Psalms":"시편","Proverbs":"잠언","Ecclesiastes":"전도서","Song of Solomon":"아가","Isaiah":"이사야","Jeremiah":"예레미야","Lamentations":"예레미야애가","Ezekiel":"에스겔","Daniel":"다니엘","Hosea":"호세아","Joel":"요엘","Amos":"아모스","Obadiah":"오바댜","Jonah":"요나","Micah":"미가","Nahum":"나훔","Habakkuk":"하박국","Zephaniah":"스바냐","Haggai":"학개","Zechariah":"스가랴","Malachi":"말라기","Matthew":"마태복음","Mark":"마가복음","Luke":"누가복음","John":"요한복음","Acts":"사도행전","Romans":"로마서","1 Corinthians":"고린도전서","2 Corinthians":"고린도후서","Galatians":"갈라디아서","Ephesians":"에베소서","Philippians":"빌립보서","Colossians":"골로새서","1 Thessalonians":"데살로니가전서","2 Thessalonians":"데살로니가후서","1 Timothy":"디모데전서","2 Timothy":"디모데후서","Titus":"디도서","Philemon":"빌레몬서","Hebrews":"히브리서","James":"야고보서","1 Peter":"베드로전서","2 Peter":"베드로후서","1 John":"요한일서","2 John":"요한이서","3 John":"요한삼서","Jude":"유다서","Revelation":"요한계시록"};
const getKoName = (n) => bookNamesKo[n] || n;

const FULL_BIBLE_MAP = {
    "창": "Genesis", "창세기": "Genesis", "출": "Exodus", "출애굽기": "Exodus",
    "레": "Leviticus", "레위기": "Leviticus", "민": "Numbers", "민수기": "Numbers",
    "신": "Deuteronomy", "신명기": "Deuteronomy", "수": "Joshua", "여호수아": "Joshua",
    "삿": "Judges", "사사기": "Judges", "룻": "Ruth", "룻기": "Ruth",
    "삼상": "1 Samuel", "사무엘상": "1 Samuel", "삼하": "2 Samuel", "사무엘하": "2 Samuel",
    "왕상": "1 Kings", "열왕기상": "1 Kings", "왕하": "2 Kings", "열왕기하": "2 Kings",
    "대상": "1 Chronicles", "역대상": "1 Chronicles", "대하": "2 Chronicles", "역대하": "2 Chronicles",
    "스": "Ezra", "에스라": "Ezra", "느": "Nehemiah", "느헤미야": "Nehemiah",
    "에": "Esther", "에스더": "Esther", "욥": "Job", "욥기": "Job",
    "시": "Psalms", "시편": "Psalms", "잠": "Proverbs", "잠언": "Proverbs",
    "전": "Ecclesiastes", "전도서": "Ecclesiastes", "아": "Song of Solomon", "아가": "Song of Solomon",
    "사": "Isaiah", "이사야": "Isaiah", "렘": "Jeremiah", "예레미야": "Jeremiah",
    "애": "Lamentations", "예레미야애가": "Lamentations", "겔": "Ezekiel", "에스겔": "Ezekiel",
    "단": "Daniel", "다니엘": "Daniel", "호": "Hosea", "호세아": "Hosea",
    "욜": "Joel", "요엘": "Joel", "암": "Amos", "아모스": "Amos",
    "옵": "Obadiah", "오바댜": "Obadiah", "욘": "Jonah", "요나": "Jonah",
    "미": "Micah", "미가": "Micah", "나": "Nahum", "나훔": "Nahum",
    "합": "Habakkuk", "하박국": "Habakkuk", "습": "Zephaniah", "스바냐": "Zephaniah",
    "학": "Haggai", "학개": "Haggai", "슥": "Zechariah", "스가랴": "Zechariah", "말": "Malachi", "말라기": "Malachi",
    "마": "Matthew", "마태": "Matthew", "마태복음": "Matthew", "마탭복음": "Matthew", 
    "막": "Mark", "마가": "Mark", "마가복음": "Mark",
    "눅": "Luke", "누가": "Luke", "누가복음": "Luke",
    "요": "John", "요한": "John", "요한복음": "John",
    "행": "Acts", "사도행전": "Acts", "롬": "Romans", "로마서": "Romans",
    "고전": "1 Corinthians", "고린도전서": "1 Corinthians", "고후": "2 Corinthians", "고린도후서": "2 Corinthians",
    "갈": "Galatians", "갈라디아서": "Galatians", "엡": "Ephesians", "에베소서": "Ephesians",
    "빌": "Philippians", "빌립보서": "Philippians", "골": "Colossians", "골로새서": "Colossians",
    "살전": "1 Thessalonians", "데살로니가전서": "1 Thessalonians", "살후": "2 Thessalonians", "데살로니가후서": "2 Thessalonians",
    "딤전": "1 Timothy", "디모데전서": "1 Timothy", "딤후": "2 Timothy", "디모데후서": "2 Timothy",
    "딛": "Titus", "디도서": "Titus", "몬": "Philemon", "빌레몬서": "Philemon",
    "히": "Hebrews", "히브리서": "Hebrews", "약": "James", "야고보서": "James",
    "벧전": "1 Peter", "베드로전서": "1 Peter", "벧후": "2 Peter", "베드로후서": "2 Peter",
    "요일": "1 John", "요한일서": "1 John", "요이": "2 John", "요한이서": "2 John",
    "요삼": "3 John", "요한삼서": "3 John", "유": "Jude", "유다서": "Jude", "계": "Revelation", "요한계시록": "Revelation"
};

const getLocalToday = () => { const o = new Date().getTimezoneOffset() * 60000; return new Date(Date.now() - o).toISOString().split('T')[0]; };
const cleanText = (t) => { if (!t) return ''; let str = typeof t === 'object' ? (t.text || t.content || JSON.stringify(t)) : String(t); return str.replace(/|'|\x1B|\(가정\d*\)|\(개인\d*\)|\(개인\)/gi, '').trim(); };

const parseBibleRefExt = (r) => {
    if (!r) return null;
    const normalized = r.replace(/\s+/g, '');
    const m = normalized.match(/([가-힣0-9]+?)(\d+)(?:장|:)(\d+)(?:절)?(?:~|-)(?:(\d+)(?:장|:))?(\d+)(?:절)?/);
    const mSimple = normalized.match(/([가-힣0-9]+?)(\d+)(?:장|:)(?:(\d+)(?:절)?)?/);

    let eb, c1, v1, c2, v2, kb;

    if (m) {
        eb = FULL_BIBLE_MAP[m[1]] || bookNamesKo[m[1]];
        if (!eb) return null;
        c1 = parseInt(m[2]);
        v1 = parseInt(m[3]);
        c2 = m[4] ? parseInt(m[4]) : c1;
        v2 = parseInt(m[5]);
        kb = bookNamesKo[eb] || m[1];
    } else if (mSimple) {
        eb = FULL_BIBLE_MAP[mSimple[1]] || bookNamesKo[mSimple[1]];
        if (!eb) return null;
        c1 = parseInt(mSimple[2]);
        v1 = mSimple[3] ? parseInt(mSimple[3]) : 1;
        c2 = c1;
        v2 = mSimple[3] ? v1 : 999;
        kb = bookNamesKo[eb] || mSimple[1];
    } else {
        return null;
    }

    return { eb, c1, v1, c2, v2, kb };
};

const getSeededVerse = (d, type) => { const h = d.replace(/-/g, '').split('').reduce((a,c)=>a+parseInt(c||0),0)+parseInt(d.slice(-2)); return type === 'family' ? familyVerseCards[h % familyVerseCards.length] : newYearVerseCards[h % newYearVerseCards.length]; };
const formatVerseText = (ft) => { if (!ft || typeof ft !== 'string') return { text: '말씀을 불러오는 중입니다...', ref: '' }; const match = ft.match(/(.*?)\s*(\([^)]+\))$/); return match ? { text: match[1], ref: match[2] } : { text: ft, ref: '' }; };

const extractVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : (cleanUrl.length === 11 ? cleanUrl : null);
};

const isGisangogi = (d) => {
    const dObj = new Date(d); const m = dObj.getMonth() + 1; const dt = dObj.getDate();
    return (m === 9 && dt >= 7 && dt <= 11) || (m === 10 && dt >= 12 && dt <= 16) || (m === 11 && dt >= 2 && dt <= 6) || (m === 11 && dt >= 30) || (m === 12 && dt <= 4);
};

const useTheme = (isD) => useMemo(() => ({
  appBg: isD ? 'bg-[#000000]' : 'bg-[#F5F5F7]',
  pageBg: isD ? 'bg-[#000000]' : 'bg-[#F5F5F7]',
  cardBg: isD ? 'bg-[#1C1C1E] border-[#38383A]' : 'bg-white border-[#E5E5EA]',
  textMain: isD ? 'text-[#FFFFFF]' : 'text-[#1D1D1F]',
  textSub: isD ? 'text-[#EBEBF5]/60' : 'text-[#8E8E93]',
  inputBg: isD ? 'bg-[#2C2C2E] text-[#FFFFFF] border-[#38383A]' : 'bg-[#F2F2F7] text-[#1D1D1F] border-transparent',
  tabBar: isD ? 'bg-[#1C1C1E]/90 border-[#38383A]' : 'bg-white/90 border-[#E5E5EA]',
  border: isD ? 'border-[#38383A]' : 'border-[#E5E5EA]',
  iconDarkBg: isD ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]', 
  primaryBg: isD ? 'bg-[#0A84FF]' : 'bg-[#007AFF]', 
  primaryText: isD ? 'text-[#0A84FF]' : 'text-[#007AFF]',
  pinkText: isD ? 'text-[#FF375F]' : 'text-[#FF2D55]',
  yellowText: isD ? 'text-[#FF9F0A]' : 'text-[#FF9500]',
  greenText: isD ? 'text-[#30D158]' : 'text-[#34C759]',
  purpleText: isD ? 'text-[#BF5AF2]' : 'text-[#AF52DE]',
  highlight: isD ? 'bg-[#2C2C2E]' : 'bg-[#E5E5EA]',
}), [isD]);

const warmBgIds = [
  '1493246507139-91e8fad9978e', '1504052434569-70ad5836ab65', '1470252649378-9c29740c9fa8',
  '1518837695005-2083093ee35b', '1464822759023-fed622ff2c3b', '1502481851512-e9e2529bfbf9',
  '1534447677768-be436bb09401', '1447752875215-b2761acb3c5d', '1451187580459-43490279c0fa',
  '1448375240586-882707db888b', '1456513080510-7bf3a84b82f8', '1455390582262-044cdead277a',
  '1511497584788-876760111969', '1507525428034-b723cf961d3e', '1432405972823-1d20071da05d',
  '1446329813274-7c9036bb9a8f', '1476820865390-c52aeebb9891', '1505144808419-1957a94ca61e',
  '1490730141103-6cac27aaab94', '1469474968028-56623f02e42e'
];
const watercolorBgs = Array.from({length: 100}, (_, i) => `https://images.unsplash.com/photo-${warmBgIds[i % warmBgIds.length]}?auto=format&fit=crop&w=1080&q=80`);

const GlobalStyles = () => (
  <style>{`
    @font-face { font-family: 'MYYeongnamnu'; src: url('${myFontUrl}') format('truetype'); font-display: swap; }
    .font-yeongnamnu { font-family: 'MYYeongnamnu', sans-serif !important; }
    html, body { overflow-x: hidden; overscroll-behavior-x: none; width: 100vw; height: 100vh; margin: 0; padding: 0; position: fixed; -webkit-font-smoothing: antialiased; }
    #root { width: 100vw; height: 100vh; display: flex; overflow-x: hidden; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    input[type="date"].date-hidden::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; pointer-events: none; }
    [contenteditable]:empty:before { content: attr(placeholder); color: #8E8E93; pointer-events: none; display: block; white-space: pre-wrap; font-weight: normal;}
    .note-lines { background-image: repeating-linear-gradient(transparent, transparent 37px, rgba(142,142,147,0.15) 38px); background-size: 100% 38px; line-height: 38px; padding-top: 6px; background-attachment: local; }
    .dark .note-lines { background-image: repeating-linear-gradient(transparent, transparent 37px, rgba(235,235,245,0.1) 38px); }
  `}</style>
);

const Confetti = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return; const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = []; const colors = ['#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF'];
    for(let i=0; i<150; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height-canvas.height, r: Math.random()*5+3, dx: Math.random()*4-2, dy: Math.random()*4+2, color: colors[Math.floor(Math.random()*colors.length)], tilt: Math.floor(Math.random()*10)-10, tiltAngle: 0, tiltAngleInc: (Math.random()*0.07)+0.05 });
    let id; const render = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.tiltAngle += p.tiltAngleInc; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2 + p.dy; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.tilt + p.r, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r); ctx.stroke(); }); id = requestAnimationFrame(render); };
    render(); return () => cancelAnimationFrame(id);
  }, []); return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
};

const RichTextEditor = React.forwardRef(({ value, onChange, placeholder, t, isSp, bibles }, ref) => {
    const editorRef = useRef(null);
    React.useImperativeHandle(ref, () => ({
        exec: (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); handleInput(); },
        insertTable: () => { 
            const bColor = isSp ? '#E5E5EA' : (t.appBg.includes('121212') ? '#38383A' : '#E5E5EA'); 
            document.execCommand('insertHTML', false, `<table style="width:100%; border-collapse:collapse; margin:10px 0;"><tbody><tr><td style="padding:10px; border:1px solid ${bColor};">내용</td><td style="padding:10px; border:1px solid ${bColor};">내용</td></tr><tr><td style="padding:10px; border:1px solid ${bColor};">내용</td><td style="padding:10px; border:1px solid ${bColor};">내용</td></tr></tbody></table><p><br></p>`); 
            editorRef.current?.focus(); handleInput();
        }
    }));

    useEffect(() => { const s = value || ''; if (editorRef.current && editorRef.current.innerHTML !== s) editorRef.current.innerHTML = s; }, [value]);
    const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
    const handleEditorClick = (e) => { if (e.target.classList.contains('delete-bible-btn')) { const block = e.target.closest('.bible-block'); if (block) { block.remove(); handleInput(); } } };
    const handleKeyDown = (e) => {
        try {
            if (e.key === ' ' || e.key === 'Enter') {
                const sel = window.getSelection(); if (!sel.rangeCount) return; const range = sel.getRangeAt(0); const node = range.startContainer;
                if (node.nodeType === 3) {
                    const text = node.textContent.substring(0, range.startOffset);
                    const match = text.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?(?:\s?(?:~|-)\s?(?:(\d+)(?:장|:))?\s?(?:(\d+)(?:절)?)?)?$/);
                    if (match) {
                        const p = parseBibleRefExt(match[0].trim());
                        if (p && p.eb) {
                            const bD = getArr(bibles).find(b => b.name === p.eb);
                            if (bD) {
                                let vsHtml = '';
                                for (let c = p.c1; c <= p.c2; c++) {
                                    const chD = getArr(bD.chapters)[c - 1]; if (!chD) continue;
                                    const sIdx = (c === p.c1) ? p.v1 - 1 : 0; const eIdx = (c === p.c2) ? (p.v2 === 999 ? getArr(chD).length - 1 : p.v2 - 1) : getArr(chD).length - 1;
                                    for (let i = sIdx; i <= eIdx; i++) { if (chD[i]) vsHtml += `<div style="display:flex; gap:12px; padding:12px; border-radius:12px; margin-bottom:4px; background:rgba(0, 122, 255, 0.05);"><span style="font-weight:900; color:#007AFF; min-width:24px;">${i + 1}</span><span style="color:inherit;">${cleanText(chD[i])}</span></div>`; }
                                }
                                if (vsHtml) {
                                    e.preventDefault();
                                    node.textContent = text.substring(0, text.length - match[0].length) + node.textContent.substring(range.startOffset);
                                    const newRange = document.createRange(); newRange.setStart(node, text.length - match[0].length); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange);
                                    const blockBorder = isSp ? '#E5E5EA' : '#38383A';
                                    const blockHtml = `<div class="bible-block" contenteditable="false" style="display: inline-block; width: fit-content; max-width: 100%; margin: 6px 0; position: relative; border: 1px solid ${blockBorder}; border-radius: 12px; padding: 6px 8px; background: rgba(0, 122, 255, 0.03); font-size: 14px; line-height: 1.4; letter-spacing: -0.3px;"><button class="delete-bible-btn" style="position: absolute; top: 4px; right: 4px; background: #FF3B30; color: #FFF; border: none; border-radius: 6px; padding: 2px 6px; font-size: 10px; cursor: pointer; font-weight: bold; z-index: 10;">✕ 삭제</button><div style="font-weight: 900; color: inherit; margin-bottom: 4px; padding-left: 4px; font-size: 12px;">📖 ${getKoName(p.eb)} ${p.c1}장</div>${vsHtml}</div><p><br></p>`;
                                    document.execCommand('insertHTML', false, blockHtml);
                                }
                            }
                        }
                    }
                }
            }
        } catch(err) { console.error(err); }
    };
    return (
        <div className={`flex flex-col w-full h-full relative z-[45] pointer-events-auto`}>
            <div ref={editorRef} contentEditable={true} suppressContentEditableWarning={true} onInput={handleInput} onBlur={handleInput} onKeyDown={handleKeyDown} onClick={handleEditorClick} onPointerDown={e => e.stopPropagation()} className={`p-5 md:p-6 flex-1 outline-none text-[15px] md:text-[16px] overflow-y-auto h-full ${isSp?'text-[#1D1D1F]':t.textMain} break-words whitespace-pre-wrap leading-[1.8]`} placeholder={placeholder} style={{ minHeight: '300px' }} />
        </div>
    );
});

const SubPageHeader = ({ title, onBack, t, isSp=false, spTitle="", spDesc="", toggleSidebar }) => {
  if (isSp) return (
    <div className={`px-5 py-4 z-[60] shrink-0 flex items-center justify-between relative shadow-sm bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] pointer-events-auto`}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white hover:opacity-80 transition-opacity"><IconArrowLeft className="w-5 h-5"/></button>
        <div className="flex flex-col"><h1 className="text-[16px] font-black text-white leading-tight">{spTitle}</h1><p className="text-[11px] text-white/80 font-bold mt-0.5">{spDesc}</p></div>
      </div>
      {toggleSidebar && <button onClick={toggleSidebar} className="text-white hover:opacity-80 transition-opacity"><IconMenu className="w-5 h-5"/></button>}
    </div>
  );
  return (
    <div className={`${t.cardBg} px-5 py-4 z-[60] shrink-0 flex items-center justify-between relative border-b ${t.border} pointer-events-auto`}>
      <button onClick={onBack} className={`${t.textMain} hover:opacity-70 transition-opacity`}><IconArrowLeft className="w-5 h-5"/></button>
      <h1 className={`text-[16px] font-black ${t.textMain} tracking-tight`}>{title}</h1>
      {toggleSidebar ? <button onClick={toggleSidebar} className={`${t.textMain} hover:opacity-70 transition-opacity`}><IconMenu className="w-5 h-5"/></button> : <div className="w-5 h-5"></div>}
    </div>
  );
};

const getSvgUri = (path) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='black'%3E%3Cpath d='${path}'/%3E%3C/svg%3E`;

// =====================================================================
// 🔐 [2단계 마스터 보안 로그인 컴포넌트]
// =====================================================================
const StandaloneLogin = ({ supabase, setAuthUser, setActiveScreen }) => {
  const [loginName, setLoginName] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [rememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(false);
  const [targetUserRecord, setTargetUserRecord] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [isSuperStepActive, setIsSuperStepActive] = useState(false);
  const [adminModeToggle, setAdminModeToggle] = useState(false);
  const [secondaryAdminPw, setSecondaryAdminPw] = useState('');

  useEffect(() => {
    if (loginName.trim() === '정신동' && loginPw.trim() === '4297') {
      setIsSuperStepActive(true);
    } else {
      setIsSuperStepActive(false);
      setAdminModeToggle(false);
      setSecondaryAdminPw('');
    }
  }, [loginName, loginPw]);

  const submitDirectLogin = async () => {
    const trimmedName = loginName.trim();
    const trimmedPw = loginPw.trim();

    if (!trimmedName) return alert('성도 이름을 입력해주세요.');
    if (!trimmedPw) return alert('비밀번호를 입력해주세요.');

    if (trimmedName === '정신동' && adminModeToggle) {
      if (secondaryAdminPw.trim() !== '4237') {
        return alert('2차 마스터 보안코드가 일치하지 않습니다.');
      }
    }

    setIsLoading(true);
    try {
      let finalUserRole = '목원';
      let finalShepherd = '목장 미배정';
      let finalDisplayName = trimmedName;
      let matchedUser = null;

      if (trimmedName === '정신동' && adminModeToggle && secondaryAdminPw.trim() === '4237') {
        finalUserRole = '운영자';
        finalDisplayName = '정신동';
      } else if (supabase) {
        const { data: usersData, error } = await supabase
          .from('app_users')
          .select('*')
          .ilike('name', `${trimmedName}%`);

        if (!error && usersData && usersData.length > 0) {
          matchedUser = usersData.find(u => u.name === trimmedName || u.name.startsWith(`${trimmedName}(`));

          if (matchedUser) {
            const dbPassword = matchedUser.password || matchedUser.password_hash || '1004';
            if (dbPassword !== trimmedPw) {
              setIsLoading(false);
              return alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
            }

            if (matchedUser.is_temp_password === true || dbPassword === '1004') {
              setTargetUserRecord(matchedUser);
              setIsPasswordChangeRequired(true);
              setIsLoading(false);
              return;
            }

            finalUserRole = matchedUser.role || '목원';
            finalShepherd = matchedUser.shepherd_name || '목장 미배정';
            finalDisplayName = matchedUser.name;
          } else {
            const sameBaseCount = usersData.filter(u => u.name.startsWith(trimmedName)).length;
            const alphabetSuffix = String.fromCharCode(97 + sameBaseCount);
            finalDisplayName = `${trimmedName}(${alphabetSuffix})`;

            await supabase.from('app_users').insert([{
              name: finalDisplayName,
              password: trimmedPw,
              password_hash: trimmedPw,
              role: '목원',
              shepherd_name: '목장 미배정',
              is_temp_password: false
            }]);
          }
        } else {
          await supabase.from('app_users').insert([{
            name: trimmedName,
            password: trimmedPw,
            password_hash: trimmedPw,
            role: '목원',
            shepherd_name: '목장 미배정',
            is_temp_password: false
          }]);
        }
      }

      if (trimmedName === '정신동' && adminModeToggle && secondaryAdminPw.trim() === '4237') {
        finalUserRole = '운영자';
      }

      const authData = {
        name: finalDisplayName,
        role: finalUserRole,
        group: finalShepherd,
        shepherdName: finalShepherd,
        isAdmin: finalUserRole === '운영자' || finalUserRole === '관리자'
      };

      if (rememberMe) {
        localStorage.setItem('church_auth_user', JSON.stringify(authData));
        localStorage.setItem('login_user_name', authData.name);
      }

      if (typeof setAuthUser === 'function') setAuthUser(authData);
      if (typeof setActiveScreen === 'function') setActiveScreen('meditationPilgrimage');

    } catch (err) {
      console.error(err);
      alert('로그인 인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePasswordChange = async () => {
    const newPw = newPasswordInput.trim();
    const confirmPw = confirmPasswordInput.trim();

    if (!newPw || newPw.length < 4) return alert('새 비밀번호는 최소 4자리 이상이어야 합니다.');
    if (newPw !== confirmPw) return alert('새 비밀번호가 일치하지 않습니다.');
    if (newPw === '1004') return alert('초기 비밀번호와 다른 안전한 비밀번호를 입력해주세요.');

    setIsLoading(true);
    try {
      if (supabase && targetUserRecord) {
        const { error } = await supabase.from('app_users').update({
          password: newPw,
          password_hash: newPw,
          is_temp_password: false
        }).eq('id', targetUserRecord.id);

        if (error) throw error;
      }

      alert('비밀번호가 성공적으로 변경되었습니다!');
      setIsPasswordChangeRequired(false);

      const authData = {
        name: targetUserRecord.name,
        role: targetUserRecord.role || '목원',
        group: targetUserRecord.shepherd_name || '목장 미배정',
        shepherdName: targetUserRecord.shepherd_name || '목장 미배정',
        isAdmin: targetUserRecord.role === '운영자' || targetUserRecord.role === '관리자'
      };

      localStorage.setItem('church_auth_user', JSON.stringify(authData));
      if (typeof setAuthUser === 'function') setAuthUser(authData);
      if (typeof setActiveScreen === 'function') setActiveScreen('meditationPilgrimage');

    } catch (e) {
      alert('비밀번호 변경 실패: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-4 relative overflow-hidden select-none bg-[#090A0D]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[75vw] h-[75vw] rounded-full blur-[140px]" style={{ background: 'radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%)' }} />
      </div>

      {isPasswordChangeRequired ? (
        <div 
          className="w-full max-w-[420px] rounded-[36px] p-7 md:p-9 flex flex-col gap-5 relative z-20 border border-amber-500/30 shadow-2xl animate-fade-in"
          style={{ background: 'rgba(23, 25, 32, 0.9)', backdropFilter: 'blur(30px)' }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-black tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full w-max">
              SECURITY UPDATE REQUIRED
            </span>
            <h2 className="text-[22px] font-black text-white mt-2">비밀번호 변경이 필요합니다</h2>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              초기 임시 비밀번호(1004)로 접속하셨습니다. 새 비밀번호로 변경해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <input 
              type="password"
              value={newPasswordInput}
              onChange={e => setNewPasswordInput(e.target.value)}
              placeholder="새 비밀번호 입력 (4자리 이상)"
              className="w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
              autoFocus
            />
            <input 
              type="password"
              value={confirmPasswordInput}
              onChange={e => setConfirmPasswordInput(e.target.value)}
              placeholder="새 비밀번호 확인"
              onKeyDown={e => e.key === 'Enter' && handleExecutePasswordChange()}
              className="w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={handleExecutePasswordChange}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[15px] shadow-lg active:scale-[0.98] transition-all cursor-pointer mt-1"
          >
            {isLoading ? '변경 처리 중...' : '비밀번호 변경 후 시작하기'}
          </button>
        </div>
      ) : (
        <div 
          className="w-full max-w-[420px] rounded-[36px] p-7 md:p-9 flex flex-col gap-6 relative z-10 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
          style={{ background: 'rgba(23, 25, 32, 0.65)', backdropFilter: 'blur(30px)' }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-black uppercase tracking-[0.25em] text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full w-max">
              GOOD TREE CHURCH
            </span>
            <h1 className="text-[26px] sm:text-[28px] font-black text-white tracking-tight mt-2 flex items-center gap-2">
              할렐루야~ <span className="text-[#F5C242]">어서오세요</span>
            </h1>
            <p className="text-[12.5px] font-medium text-slate-400">
              성도님의 소중한 신앙 여정을 안전하게 연결합니다.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 mt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-300 ml-1">성도 이름</label>
              <input 
                type="text" 
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                placeholder="이름을 입력하세요" 
                onKeyDown={e => e.key === 'Enter' && submitDirectLogin()}
                className="w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-[#F5C242]/70"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-300 ml-1">비밀번호</label>
              <input 
                type="password"
                value={loginPw}
                onChange={e => setLoginPw(e.target.value)}
                placeholder="비밀번호 입력 (최초: 1004)" 
                onKeyDown={e => e.key === 'Enter' && submitDirectLogin()}
                className="w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-[#F5C242]/70"
              />
            </div>

            {isSuperStepActive && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3 animate-fade-in-up mt-1">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAdminModeToggle(!adminModeToggle)}>
                  <span className="text-[12px] font-black text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    최고 운영자 인증 감지 (터치하여 활성화)
                  </span>
                  <input 
                    type="checkbox" 
                    checked={adminModeToggle} 
                    onChange={e => setAdminModeToggle(e.target.checked)} 
                    className="w-4 h-4 accent-amber-400 cursor-pointer" 
                  />
                </div>

                {adminModeToggle && (
                  <div className="flex flex-col gap-1.5 animate-fade-in pt-1">
                    <span className="text-[11px] font-bold text-amber-200/80">2차 마스터 보안코드 (4237)</span>
                    <input 
                      type="password" 
                      value={secondaryAdminPw}
                      onChange={e => setSecondaryAdminPw(e.target.value)}
                      placeholder="보안코드 4자리 입력" 
                      onKeyDown={e => e.key === 'Enter' && submitDirectLogin()}
                      className="w-full py-2.5 px-3.5 rounded-xl text-[13px] font-mono tracking-widest bg-black/60 border border-amber-500/40 text-amber-300 outline-none focus:border-amber-400"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={submitDirectLogin}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F5C242] to-[#EAB308] hover:from-[#f7cc59] text-[#1E1F22] font-black text-[15px] shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? '인증 중...' : 'Sign In'}
          </button>
        </div>
      )}
    </div>
  );
};

export default function CompleteQtApp() {
  useEffect(() => {
    try {
      sessionStorage.setItem('tuesday_popup_shown', 'true');
    } catch (e) {}
  }, []);

  const store = useAppStore();

  // 🌟 [통합 정리 1] activeScreen 초기화 단일 선언 (중복 제거 완료)
  useEffect(() => {
    if (!store.activeScreen) {
      store.setActiveScreen('meditationPilgrimage');
    }
  }, [store.activeScreen]);

  // 1단계: store 상태 연결
  const {
    authUser, setAuthUser,
    activeScreen, setActiveScreen,
    isDarkMode, toggleDarkMode,
    dailyData, updateDay: storeUpdateDay,
    readVerses, setReadVerses,
    bibleNotes, setBibleNotes,
    bibleHighlights, setBibleHighlights,
    readChallengeStart, setReadChallengeStart,
    globalPrayers, setGlobalPrayers,
    globalIntercessions, setGlobalIntercessions,
    generalNotes, setGeneralNotes
  } = store;

  // 2단계: 기존 세션 복원 및 app_users 자동 등록 + 관제 핑 활성화
  useEffect(() => {
    const localUserRaw = localStorage.getItem('church_auth_user');
    let currentUserObj = authUser;
    if (!currentUserObj && localUserRaw) {
      try {
        currentUserObj = JSON.parse(localUserRaw);
        setAuthUser(currentUserObj);
      } catch (e) {}
    }

    if (supabase && currentUserObj?.name) {
      const fetchLatestUserData = async () => {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('name', currentUserObj.name)
            .maybeSingle();

          if (!error && data) {
            const updated = {
              ...currentUserObj,
              role: data.role || currentUserObj.role || '목원',
              group: data.shepherd_name || currentUserObj.group || '목장 미배정',
              shepherdName: data.shepherd_name || currentUserObj.shepherdName || '목장 미배정',
              isAdmin: data.role === '운영자' || data.role === '관리자' || !!data.is_admin
            };
            localStorage.setItem('church_auth_user', JSON.stringify(updated));
            setAuthUser(updated);
          } else {
            await supabase.from('app_users').upsert([{
              name: currentUserObj.name,
              role: currentUserObj.role || '목원',
              shepherd_name: currentUserObj.group || '목장 미배정',
              password: '1004',
              password_hash: '1004',
              is_temp_password: false
            }], { onConflict: 'name' });
          }

          const nowIso = new Date().toISOString();
          await supabase.from('user_activity').upsert({
            user_name: currentUserObj.name,
            last_page: activeScreen || 'home',
            updated_at: nowIso
          }, { onConflict: 'user_name' });

        } catch (err) {}
      };
      fetchLatestUserData();
    }
  }, [authUser?.name, setAuthUser]);

  // QR 자동 출석 훅
  useAutoQRAttendance(authUser);

  // 원스트림 글로벌 사이드시트 Drawer 상태
  const [globalDrawer, setGlobalDrawer] = useState({ isOpen: false, type: null });
  const openGlobalDrawer = (type) => setGlobalDrawer({ isOpen: true, type });
  const closeGlobalDrawer = () => setGlobalDrawer({ isOpen: false, type: null });

  // 활동 로그 수집
  useEffect(() => {
    const currentName = typeof authUser === 'object' ? authUser?.name : authUser;
    if (currentName) {
      logUserAction(currentName, activeScreen, 'view', `${activeScreen} 화면 열람`);
    }
  }, [activeScreen, authUser]);

  const isDark = isDarkMode;
  const setIsDarkMode = toggleDarkMode;
  const setDailyData = (updater) => {
     const next = typeof updater === 'function' ? updater(dailyData) : updater;
     useAppStore.setState({ dailyData: next });
     localStorage.setItem('qt_daily', JSON.stringify(next));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [tool, setTool] = useState('hand'); 
  const [color, setColor] = useState('#007AFF'); 
  const [size, setSize] = useState(4);
  const [date, setDate] = useState(getLocalToday()); 
  const [showConfetti, setShowConfetti] = useState(false);

  const currDay = dailyData[date] || { checks: {}, thanksText: '', memos: [], stickers: [], testimony: '', qtTitle: '', qtReference: '', qtVideoUrl: '', qtVideoId: '', qtAppQuestion: '', qtMeditation: '', qtApplication: '', sermonTitle: '', sermonPreacher: '', sermonReference: '', sermonNotes: '', sermonVideoUrl: '', sermonVideoId: '', thanksDeclarations: ['',''], applyQuestions: [], wordShare: '', thanksShare: '', prayerReq: '', familyName: '', attendees: '', meditate: '', prayer: '' };
  const updateDay = (d) => storeUpdateDay(date, d);

  const [currentChapId, setCurrentChapId] = useState("Genesis-1"); 
  const [bibleViewMode, setBibleViewMode] = useState('index'); 
  const [selVerses, setSelVerses] = useState([]);
  const [mcheynePlanIdx, setMcheynePlanIdx] = useState(0); 
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [ttsRate, setTtsRate] = useState(1.0);
  const [familyRoomPw, setFamilyRoomPw] = useState(''); 
  const [familyRoomData, setFamilyRoomData] = useState({ attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] });
  const [familyPublicData, setFamilyPublicData] = useState(() => safeParse('family_public_' + date, { attendees: '', wordMeditation: '', thanks: [], prayers: [] }));
  const [globalCellData, setGlobalCellData] = useState(() => safeParse('global_cell_data', { notice: '이번 주 목장 모임 공지사항입니다.', submissions: [], groupPrayers: [], cellIntercession: '' }));
  const [globalSharedQt, setGlobalSharedQt] = useState(() => safeParse('global_shared_qt', {}));

  useEffect(() => { safeSetItem('global_cell_data', JSON.stringify(globalCellData)); safeSetItem('global_shared_qt', JSON.stringify(globalSharedQt)); }, [globalCellData, globalSharedQt]);  
  const [boardPosts, setBoardPosts] = useState([]); 
  const [hasNewBoardPost, setHasNewBoardPost] = useState(false);
  const [currentGenNoteId, setCurrentGenNoteId] = useState(null);

  const [familyHistory, setFamilyHistory] = useState(() => safeParse('familyHistory', []));
  const [cellHistory, setCellHistory] = useState(() => safeParse('cellHistory', []));

  useEffect(() => { safeSetItem('familyHistory', JSON.stringify(familyHistory)); }, [familyHistory]);
  useEffect(() => { safeSetItem('cellHistory', JSON.stringify(cellHistory)); }, [cellHistory]);

  const handleCompleteFamily = () => {
    if(window.confirm('오늘의 가정예배를 완료하시겠습니까?\n작성된 내용은 이력으로 저장되고 화면은 초기화됩니다.')) {
       const newRecord = { id: Date.now(), date: date, data: { ...familyRoomData } };
       setFamilyHistory(prev => [newRecord, ...getArr(prev)]);
       handleUpdateFamily({ attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] });
       if (authUser?.name) logUserAction(authUser.name, '가정예배', 'write', `[완료] 참석자: ${familyRoomData.attendees}`); 
       alert('가정예배 이력이 성공적으로 저장되었습니다.');
    }
  };

  const handleCompleteCell = () => {
    if(window.confirm('이번 주 목장나눔을 완료하시겠습니까?\n작성된 내용은 이력으로 저장되고 화면은 초기화됩니다.')) {
       const d = new Date(date); const weekStr = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주차`;
       const newRecord = { id: Date.now(), week: weekStr, date: date, data: { ...globalCellData } };
       setCellHistory(prev => [newRecord, ...getArr(prev)]);
       handleUpdateCell({ notice: '새로운 주간 목장 모임 공지사항입니다.', submissions: [], groupPrayers: [], cellIntercession: '' });
       if (authUser?.name) logUserAction(authUser.name, '목장나눔', 'write', `[완료] 공지: ${globalCellData.notice}`); 
       alert('목장나눔 이력이 성공적으로 저장되었습니다.');
    }
  };

  const t = useTheme(isDarkMode);

  const [gisangogiUrl, setGisangogiUrl] = useState('https://youtu.be/9Hqvir-snmk?si=GlIMn7rSjnwQqyo8');
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const aiDetectingRef = useRef(false); const aiWindowRef = useRef(false); const aiTimerRef = useRef(null);

  const qtEditorRef = useRef(null); const mcheyneEditorRef = useRef(null); const bibleEditorRef = useRef(null); const sermonEditorRef = useRef(null); const genEditorRef = useRef(null);

  const [interBook, setInterBook] = useState('Genesis'); const [interChapter, setInterChapter] = useState(1); const [interVerse, setInterVerse] = useState(1); const [interWords, setInterWords] = useState([]);
  const [isLoadingInter, setIsLoadingInter] = useState(false); const [wikiSearchTerm, setWikiSearchTerm] = useState('');

  useEffect(() => { if (familyRoomPw) setFamilyRoomData(safeParse(`familyRoom_${familyRoomPw}`, { attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] })); }, [familyRoomPw]);
  useEffect(() => { if (familyRoomPw) safeSetItem(`familyRoom_${familyRoomPw}`, JSON.stringify(familyRoomData)); }, [familyRoomData, familyRoomPw]);
  useEffect(() => { safeSetItem('family_public_' + date, JSON.stringify(familyPublicData)); }, [familyPublicData, date]);

  const handleStickerAdd = (src, isEmoji) => { updateDay({ stickers: [...getArr(currDay.stickers), { id: Date.now(), src, isEmoji, x: window.innerWidth/2 - 40, y: 150 }] }); };
  const handleMemoAdd = (animal) => { updateDay({ memos: [...getArr(currDay.memos), { id: Date.now(), animal, text: '', x: window.innerWidth/2 - 80, y: 150 }] }); };
  const handleFileUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { updateDay({ stickers: [...getArr(currDay.stickers), { id: Date.now(), src: ev.target.result, isEmoji: false, x: window.innerWidth/2 - 40, y: 150 }] }); }; reader.readAsDataURL(file); } };

  // 15초 주기 클라우드 동기화
  const fetchCloudData = useCallback(async () => {
    if (!supabase || document.hidden) return;
    try {
        const { data: qtData } = await supabase.from('shared_qt').select('*'); 
        if (qtData) { 
          const qtObj = {}; 
          getArr(qtData).forEach(d => { 
            try { qtObj[d.date] = JSON.parse(d.video_id); } 
            catch(e) { qtObj[d.date] = { qt: d.video_id }; } 
          }); 
          setGlobalSharedQt(qtObj); 
        }
        if (familyRoomPw) { 
          const { data: fData } = await supabase.from('family_rooms').select('data').eq('room_pw', familyRoomPw).maybeSingle(); 
          if (fData && fData.data) setFamilyRoomData(fData.data); 
        }
        if (authUser?.group) { 
          const { data: cData } = await supabase.from('cell_groups').select('data').eq('group_name', authUser.group).maybeSingle(); 
          if (cData && cData.data) setGlobalCellData(cData.data); 
        }
    } catch (e) {}
  }, [familyRoomPw, authUser]);

  useEffect(() => { 
    fetchCloudData(); 
    const interval = setInterval(fetchCloudData, 15000); 
    return () => clearInterval(interval); 
  }, [fetchCloudData]);

  const handleUpdateSharedQt = (dateKey, type, videoId) => { setGlobalSharedQt(prev => { const dayData = prev[dateKey] || {}; const nextDayData = { ...dayData, [type]: videoId }; const next = { ...prev, [dateKey]: nextDayData }; if (supabase) supabase.from('shared_qt').upsert([{ date: dateKey, video_id: JSON.stringify(nextDayData) }]).then(); return next; }); };
  const handleUpdateCell = (updater) => { setGlobalCellData(prev => { const next = typeof updater === 'function' ? updater(prev) : updater; if (supabase && authUser?.group) supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: next }]).then(); return next; }); };
  const handleUpdateFamily = (updater) => { setFamilyRoomData(prev => { const next = typeof updater === 'function' ? updater(prev) : updater; if (supabase && familyRoomPw) supabase.from('family_rooms').upsert([{ room_pw: familyRoomPw, data: next }]).then(); return next; }); };
  const handleAutoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };
  
  const fetchPosts = async () => { 
      if (!supabase) return; 
      const { data, error } = await supabase.from('test_board').select('*').order('created_at', { ascending: false }); 
      if (!error) {
          setBoardPosts(data || []); 
          if(data && data.length > 0 && activeScreen !== 'board') {
             const latest = new Date(data[0].created_at).getTime();
             if(Date.now() - latest < 3600000) setHasNewBoardPost(true);
          }
      }
  };
  useEffect(() => { fetchPosts(); }, [activeScreen]);

  const toggleAiDetect = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return alert("마이크 미지원 브라우저입니다.");
    if (isAiDetecting) { setIsAiDetecting(false); aiDetectingRef.current = false; window.aiSermonRec?.stop(); return; }
    try { if(navigator.wakeLock) await navigator.wakeLock.request('screen'); } catch(e) {}
    setIsAiDetecting(true); aiDetectingRef.current = true;
    const rec = new SR(); rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (ev) => {
        let final = ''; for (let i = ev.results.length - 1; i < ev.results.length; ++i) { if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' '; }
        if(!final.trim()) return;
        if (!aiWindowRef.current) {
            if (final.replace(/\s+/g, '').includes('적용질문')) {
                aiWindowRef.current = true;
                setDailyData(prev => { const d = prev[date] || {}; return { ...prev, [date]: { ...d, applyQuestions: [...getArr(d.applyQuestions), "🎙️ "] }}; });
                clearTimeout(aiTimerRef.current);
                aiTimerRef.current = setTimeout(() => { aiWindowRef.current = false; alert("적용질문 AI 녹음(3분)이 완료되었습니다."); }, 3 * 60 * 1000);
            }
        } else {
            setDailyData(prev => { const d = prev[date] || {}; const curQ = [...getArr(d.applyQuestions)]; if (curQ.length > 0) curQ[curQ.length - 1] = curQ[curQ.length - 1] + final; return { ...prev, [date]: { ...d, applyQuestions: curQ }}; });
        }
    };
    rec.onend = () => { if (aiDetectingRef.current) { setTimeout(()=> { try{rec.start();}catch(e){} }, 300); } };
    window.aiSermonRec = rec; rec.start();
  };

  const TESTIMONY_TEMPLATE = `1. 제목 (한 문장으로) : \n\n2. 오늘 받은 말씀 : \n\n3. 사건 (무슨 일이 있었는가?) : \n\n4. 내 죄와 우상 (왜 그렇게 반응했는가?) : \n\n5. 말씀으로 받은 깨달음 : \n\n6. 적용 (구체적으로 무엇을 순종할 일인가?) : \n\n7. 하나님이 주신 열매 : \n\n8. 감사 : `;

  const dateObj = new Date(date); const ymdStr = `${dateObj.getFullYear()}년${dateObj.getMonth() + 1}월${dateObj.getDate()}일`; const isWknd = dateObj.getDay() % 6 === 0;
  const dateHash = useMemo(() => { let hash = 0; const dateClean = date.replace(/-/g, ''); for(let i=0; i<dateClean.length; i++) hash += dateClean.charCodeAt(i) * (i + 1); return hash; }, [date]);
  const mainVerseText = getSeededVerse(date, 'general'); const familyVerseText = getSeededVerse(date, 'family');
  const currentBgUrl = watercolorBgs[dateHash % watercolorBgs.length]; const formatVerse = formatVerseText(mainVerseText); const formatFamVerse = formatVerseText(familyVerseText);
  
  const totalChaptersCount = 1189; let readChapsCount = 0; 
  getArr(bibles).forEach(b => { 
      getArr(b.chapters).forEach((v, i) => { 
          if (getArr(v).length > 0 && getArr(v).every((_, j) => (readVerses||{})[`${b.name}-${i+1}-${j}`])) readChapsCount++; 
      }); 
  });
  const bibleProgress = ((readChapsCount / totalChaptersCount) * 100).toFixed(1);
  const mcheyneActivePlan = useMemo(() => getMcheynePlan(date.substring(5, 10)), [date]);
  
  const streak5 = useMemo(() => {
    let currentStreak = 0; const [y, m, d] = getLocalToday().split('-'); let checkDateObj = new Date(y, m - 1, d);
    for (let i = 0; i < 365; i++) {
        const year = checkDateObj.getFullYear(); const month = String(checkDateObj.getMonth() + 1).padStart(2, '0'); const day = String(checkDateObj.getDate()).padStart(2, '0');
        const targetDate = `${year}-${month}-${day}`;
        const ch = dailyData[targetDate]?.checks || {}; const isCompleted = ch['감사'] && ch['성경읽기'] && ch['QTin'];
        if (isCompleted) { currentStreak++; } else { if (i === 0) { checkDateObj.setDate(checkDateObj.getDate() - 1); continue; } break; }
        checkDateObj.setDate(checkDateObj.getDate() - 1);
    } return currentStreak;
  }, [dailyData]);

  const praiseChannels = [ 
    { id: 1, title: '예람워십', url: 'https://youtube.com/@yeramworship', bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'FIA', url: 'https://youtube.com/@fiaworship', bg: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: '노부부 찬양', url: 'https://youtube.com/channel/UCCW08kVjOMQg9IsFvub8oOw', bg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80' },
    { id: 4, title: '아가파오', url: 'https://youtube.com/@agapaoworship', bg: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80' },
    { id: 5, title: '팀룩워십', url: 'https://youtube.com/channel/UCHgN8INA-KsfZDQlylH__2g?si=QtjXeRSiGu6iQQb1', bg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
    { id: 6, title: '지나워십(Gina)', url: 'https://youtube.com/@ginaworship?si=FK3VlE3ULLMMucQs', bg: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?auto=format&fit=crop&w=800&q=80' },
    { id: 7, title: '예수전도단', url: 'https://youtube.com/@ywamworshipkorea?si=sIfM2GxfrszcqgzF', bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' },
    { id: 8, title: '조선가스펠', url: 'https://youtube.com/@chosungospel?si=UChhJ4rgs7DQurNy', bg: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80' },
    { id: 9, title: '마커스워십', url: 'https://youtube.com/@markersworship?si=RJR7dH4Gy5YP0vxF', bg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
    { id: 10, title: '위러브', url: 'https://youtube.com/@welovecreativeteam?si=nmMvbu1PiwjMyksU', bg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
    { id: 11, title: '제이어스', url: 'https://youtube.com/@jusministry?si=Q6p4biaIcH2Uh7JM', bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' }
  ];

  const copyCellReport = () => { const pray = getArr(globalCellData.groupPrayers).map((p,i)=>`${i+1}. [${p.name}] ${p.text}`).join('\n'); const txt = `[목장 모임 보고서]\n목장명: ${authUser?.group||''}\n작성자: ${authUser?.name||''}\n\n[주간 공지사항]\n${globalCellData.notice||''}\n\n[목장 중보기도]\n${globalCellData.cellIntercession||''}\n\n[식구 기도제목]\n${pray}`; navigator.clipboard.writeText(txt); alert("목장 보고서가 복사되었습니다!"); };
  
  const findBibleText = (refText) => { 
      const p = parseBibleRefExt(refText || ''); 
      if (p && p.eb) { 
          const bD = getArr(bibles).find(b => b.name === p.eb); 
          if (bD) { 
              const vs = []; 
              for (let c = p.c1; c <= p.c2; c++) { 
                  const chD = getArr(bD.chapters)[c - 1]; 
                  if (!chD) continue; 
                  const sIdx = (c === p.c1) ? p.v1 - 1 : 0; 
                  const eIdx = (c === p.c2) ? (p.v2 === 999 ? getArr(chD).length - 1 : p.v2 - 1) : getArr(chD).length - 1; 
                  for (let i = sIdx; i <= eIdx; i++) { 
                      if (chD[i]) vs.push({ ref: `${p.kb} ${c}:${i + 1}`, text: cleanText(chD[i]), vIdx: i+1 }); 
                  } 
              } 
              if (vs.length > 0) { 
                  openModal('bibleRef', { title: `${p.kb} 본문`, verses: vs, parsedRef: p }); 
                  return; 
              } 
          } 
      } 
      alert("말씀 본문을 정확히 찾을 수 없습니다."); 
  };
  
  const toggleTTS = (queue) => { if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; } setIsSpeaking(true); queue.forEach((text, idx) => { const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = ttsRate; if (idx === queue.length - 1) { u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false); } window.speechSynthesis.speak(u); }); };
  const downloadSermonWord = async () => { const formatArr = (arr) => getArr(arr).map(q => q && !(q||'').startsWith('🤖') ? `<li>${q}</li>` : '').join(''); const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>예배노트_${date}</title></head><body style="font-family: 'Malgun Gothic', sans-serif;"><h1 style="color: #007AFF;">예배 노트 (${date})</h1><table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse; margin-bottom: 20px;"><tr><th style="background:#F2F2F7; width:20%;">설교자</th><td>${currDay.sermonPreacher||''}</td><th style="background:#F2F2F7; width:20%;">본문</th><td>${currDay.sermonReference||''}</td></tr><tr><th style="background:#F2F2F7;">설교 제목</th><td colspan="3">${currDay.sermonTitle||''}</td></tr></table><h3>🙏 나의 감사 선포</h3><ul>${formatArr(getArr(currDay.thanksDeclarations, ['',''])) || '<li>없음</li>'}</ul><h3>📝 나의 적용 질문</h3><ul>${formatArr(getArr(currDay.applyQuestions)) || '<li>없음</li>'}</ul><h3>📖 말씀 노트</h3><div style="line-height: 1.6; font-size: 11pt;">${currDay.sermonNotes||''}</div></body></html>`; const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `예배노트_${date}.doc`; link.click(); };
  const triggerConfetti = () => { setShowConfetti(true); setTimeout(()=>setShowConfetti(false), 3000); };
  const downloadWallpaper = async (textToDraw, bgUrl) => { const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920; const ctx = canvas.getContext('2d'); const bgImg = new Image(); bgImg.crossOrigin = "anonymous"; bgImg.src = bgUrl || currentBgUrl; bgImg.onload = () => { ctx.drawImage(bgImg, 0, 0, 1080, 1920); ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; ctx.fillRect(0, 0, 1080, 1920); ctx.fillStyle = 'white'; ctx.textAlign = 'center'; const fTxt = formatVerseText(textToDraw); const words = fTxt.text.split(' '); let lines = []; let currentLine = words[0]; ctx.font = 'bold 54px "MYYeongnamnu", sans-serif'; for (let i = 1; i < words.length; i++) { const word = words[i]; const width = ctx.measureText(currentLine + " " + word).width; if (width < 920) currentLine += " " + word; else { lines.push(currentLine); currentLine = word; } } lines.push(currentLine); let startY = 1920 / 2 - ((lines.length) * 90) / 2; lines.forEach(line => { ctx.fillText(line, 540, startY); startY += 90; }); ctx.font = '36px "MYYeongnamnu", sans-serif'; ctx.globalAlpha = 0.8; ctx.fillText(fTxt.ref, 540, startY + 40); const link = document.createElement('a'); link.download = `말씀카드배경_${date}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }; };

  const [modal, setModal] = useState({ isOpen: false, type: '', updateFn: null }); 
  const [mLocal, setMLocal] = useState(null);
  const [targetVerse, setTargetVerse] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const openModal = (type, data, fn) => {
    let initial;
    if (type === 'globalPrayer') initial = [...getArr(globalPrayers)]; 
    else if (type === 'globalIntercession') initial = [...getArr(globalIntercessions)]; 
    else if (type === 'applyQuestion') initial = { applyQuestions: [...getArr(currDay.applyQuestions)] }; 
    else if (type === 'thanksDeclaration') initial = { thanksDeclarations: [...getArr(currDay.thanksDeclarations, ['', ''])] }; 
    else if (type === 'testimony') initial = { text: currDay.testimony || TESTIMONY_TEMPLATE }; 
    else if (type === 'thanks') initial = { thanksText: currDay.thanksText || '' }; 
    else if (type === 'bibleChapterSelect') initial = { book: data || {} }; 
    else if (type === 'fullVerse') initial = { text: data?.text || '', bgHash: data?.bgHash || 0 }; 
    else if (type === 'bibleNoteCreate') initial = { verses: [...getArr(data?.verses)], note: data?.note || '' }; 
    else if (type === 'strongsDic') initial = { word: data || {} }; 
    else if (type === 'bibleChallenge') initial = {}; 
    else if (type === 'sermonList') initial = { notes: Object.entries(dailyData).filter(([_, d]) => d.sermonTitle || d.sermonNotes) }; 
    else if (type === 'wikiDetail') initial = data;
    else initial = data ? JSON.parse(JSON.stringify(data)) : {};
    setMLocal(initial); setModal({ isOpen: true, type, updateFn: fn });
  };

  const closeModal = () => { if(modal.type==='globalPrayer') setGlobalPrayers(mLocal); else if(modal.type==='globalIntercession') setGlobalIntercessions(mLocal); else if(modal.updateFn) modal.updateFn(mLocal); setModal({isOpen:false}); };
  const handleCopy = () => { let txt = ''; if(modal.type==='thanks') txt = `[오늘의 감사 리스트]\n${currDay.thanksText || ''}`; else if(modal.type==='applyQuestion') txt = `[나의 적용 질문]\n` + getArr(mLocal?.applyQuestions).map((q,i)=>`${i+1}.${q}`).join('\n'); else if(modal.type==='thanksDeclaration') txt = `[나의 감사 선포]\n` + getArr(mLocal?.thanksDeclarations, ['','']).map((q,i)=>`${i+1}.${q}`).join('\n'); else if(modal.type==='testimony') txt = `[나의 묵상 간증]\n\n${currDay.testimony || ''}`; navigator.clipboard.writeText(txt); alert("클립보드에 복사되었습니다!"); };

  const [dragState, setDragState] = useState({ id: null, type: null, startX: 0, startY: 0, initX: 0, initY: 0 });
  const onPtrDown = (e, item, type) => { if(tool !== 'hand') return; e.stopPropagation(); setDragState({ id: item.id, type, startX: e.clientX, startY: e.clientY, initX: item.x, initY: item.y }); };
  const onPtrMove = (e) => { 
      if (!dragState.id) return; 
      const dx = e.clientX - dragState.startX; const dy = e.clientY - dragState.startY; 
      if(activeScreen === 'generalNote' && currentGenNoteId) {
          const note = getArr(generalNotes).find(n => n.id === currentGenNoteId);
          if(!note) return;
          if (dragState.type === 'memo') { const m = getArr(note.memos).map(x => x.id === dragState.id ? {...x, x: dragState.initX + dx, y: dragState.initY + dy} : x); setGeneralNotes(getArr(generalNotes).map(x=>x.id===currentGenNoteId?{...x,memos:m}:x)); }
          else if (dragState.type === 'sticker') { const s = getArr(note.stickers).map(x => x.id === dragState.id ? {...x, x: dragState.initX + dx, y: dragState.initY + dy} : x); setGeneralNotes(getArr(generalNotes).map(x=>x.id===currentGenNoteId?{...x,stickers:s}:x)); }
      } else {
          if (dragState.type === 'memo') updateDay({ memos: getArr(currDay.memos).map(m => m.id === dragState.id ? {...m, x: dragState.initX + dx, y: dragState.initY + dy} : m) }); 
          else if (dragState.type === 'sticker') updateDay({ stickers: getArr(currDay.stickers).map(s => s.id === dragState.id ? {...s, x: dragState.initX + dx, y: dragState.initY + dy} : s) }); 
      }
  };
  const onPtrUp = () => setDragState({ id: null, type: null, startX: 0, startY: 0, initX: 0, initY: 0 });

  const richStickers = [
    getSvgUri("M12 4 c0 0 -1 6 -1 10 c0 1 2 1 2 0 c0 -4 -1 -10 -1 -10 z M12 18 c-1 0 -1 2 0 2 c1 0 1 -2 0 -2 z"), 
    getSvgUri("M9 8 c0 -4 6 -4 6 0 c0 3 -3 3 -3 6 M12 18 c-1 0 -1 2 0 2 c1 0 1 -2 0 -2 z"), 
    '✝️','🕊️','🍞','🍷','📖','✨','💖','🌿','🙏','⛪','☀️','🌸','👑','🌊','🛡️','🔥','⭐','🍀','🍎','💧','👼','🌟','🌈','🦋','🌻','🌷','🎁','🎀','🎈','🎉','💒','🐑','🐏','💌','💝','🤍','🤎','💜','💙','💚','💛','🧡','❤️','🎵','🎶','💡','🔑'
  ];

  const renderToolbar = (editorRef, showFont = true, handleStkAdd, handleMmAdd, handleFileUp) => (
  <div className={`w-full ${t.cardBg} border-b ${t.border} p-1 md:p-1.5 flex flex-wrap gap-1 items-center rounded-t-[20px] ignore-draw z-[70] shrink-0 shadow-sm pointer-events-auto relative`}>
     {showFont && (
         <div className={`flex items-center gap-1 shrink-0 border-r pr-2 ${t.border} mr-1`}>
              <button onClick={()=>editorRef?.current?.exec('bold')} className={`w-7 h-7 flex items-center justify-center font-extrabold rounded-lg ${t.textMain} ${t.btnGhost}`} title="굵게">B</button>
              <button onClick={()=>editorRef?.current?.exec('underline')} className={`w-7 h-7 flex items-center justify-center font-extrabold underline rounded-lg ${t.textMain} ${t.btnGhost}`} title="밑줄">U</button>
              <select onChange={(e)=>editorRef?.current?.exec('fontSize', e.target.value)} className={`h-7 px-2 text-[12px] font-bold rounded-lg border outline-none ${t.inputBg} ${t.textMain} cursor-pointer`}><option value="3">본문</option><option value="4">중간</option><option value="5">크게</option></select>
              <button onClick={()=>editorRef?.current?.insertTable()} className={`h-7 px-2.5 text-[12px] font-bold ${t.primaryText} rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 whitespace-nowrap`}>표삽입</button>
         </div>
     )}
     
     {handleStkAdd && (
         <details className={`relative shrink-0 border-r pr-2 ${t.border} mr-1 group`}>
            <summary className={`h-7 px-2.5 flex items-center justify-center rounded-lg bg-[#FF2D55]/10 text-[#FF2D55] shadow-sm text-[12px] font-bold hover:bg-[#FF2D55]/20 cursor-pointer list-none whitespace-nowrap`} title="다꾸 스티커">✨ 다꾸</summary>
            <div className={`absolute top-9 left-0 ${t.cardBg} p-4 rounded-2xl shadow-2xl border ${t.border} w-[280px] h-[320px] overflow-y-auto flex flex-col gap-3 z-[110]`}>
               <div className={`flex justify-between items-center border-b ${t.border} pb-2`}><span className={`text-[12px] font-bold ${t.textMain}`}>다꾸 스티커/메모</span><label className="text-[11px] bg-[#007AFF]/10 text-[#007AFF] px-2 py-1 rounded-md cursor-pointer whitespace-nowrap font-bold">사진+ <input type="file" accept="image/*" onChange={(e)=>{if(handleFileUp) handleFileUp(e); e.target.parentElement.parentElement.parentElement.removeAttribute('open');}} className="hidden" /></label></div>
               <div className="grid grid-cols-6 gap-2 mt-1">
                  {richStickers.map((st, i) => (
                      <button key={i} onClick={()=>{if(handleStkAdd) handleStkAdd(st, !st.startsWith('data:image')); document.querySelectorAll('details').forEach(d=>d.removeAttribute('open'));}} className="text-2xl hover:scale-125 transition-transform flex items-center justify-center">
                         {st.startsWith('data:image') ? <img src={st} className="w-7 h-7 object-contain pointer-events-none" alt="doodle" /> : st}
                      </button>
                  ))}
               </div>
               <div className={`flex gap-2 justify-between border-t ${t.border} pt-3 mt-2`}>{['🐰','🦁','🐯','🐷','🐶','🐱'].map(a => <button key={a} onClick={()=>{if(handleMmAdd) handleMmAdd(a); document.querySelectorAll('details').forEach(d=>d.removeAttribute('open'));}} className="text-2xl hover:scale-110">{a}</button>)}</div>
            </div>
         </details>
     )}

     <div className={`flex items-center gap-2 shrink-0 border-r pr-2 ${t.border} mr-1`}>
           <input type="range" min="1" max="20" value={size || 3} onChange={(e) => setSize && setSize(Number(e.target.value))} className="w-12 sm:w-16 accent-[#007AFF]" />
           <input type="color" value={color || '#007AFF'} onChange={(e)=>setColor && setColor(e.target.value)} className={`w-7 h-7 rounded-lg cursor-pointer shadow-sm border ${t.border} p-0`} />
     </div>

     <div className="flex flex-wrap gap-1.5 shrink-0">
        <button onClick={() => setTool && setTool('hand')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='hand'?`${t.primaryBg} text-white shadow-sm`:`${t.textSub} ${t.btnGhost}`}`} title="터치/이동">🖐</button>
        <button onClick={() => setTool && setTool('pen')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='pen'?'bg-blue-100 text-[#007AFF] shadow-sm border border-blue-200':`${t.textSub} ${t.btnGhost}`}`} title="볼펜">🖊️</button>
        <button onClick={() => setTool && setTool('fountain')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='fountain'?'bg-blue-100 text-[#007AFF] shadow-sm border border-blue-200':`${t.textSub} ${t.btnGhost}`}`} title="만년필">🖋️</button>
        <button onClick={() => setTool && setTool('pencil')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='pencil'?'bg-[#E5E5EA] text-[#1D1D1F] shadow-sm border border-[#C7C7CC]':`${t.textSub} ${t.btnGhost}`}`} title="연필">✏️</button>
        <button onClick={() => setTool && setTool('charcoal')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='charcoal'?'bg-[#E5E5EA] text-[#1D1D1F] shadow-sm border border-[#C7C7CC]':`${t.textSub} ${t.btnGhost}`}`} title="목탄">🪵</button>
        <button onClick={() => setTool && setTool('highlighter')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='highlighter'?'bg-[#FFCC00]/20 text-[#FF9500] shadow-sm border border-[#FFCC00]/50':`${t.textSub} ${t.btnGhost}`}`} title="형광펜">🖍️</button>
        <button onClick={() => setTool && setTool('arrow')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='arrow'?'bg-[#FF2D55]/10 text-[#FF2D55] shadow-sm border border-[#FF2D55]/30':`${t.textSub} ${t.btnGhost}`}`} title="직선 화살표">↗️</button>
        <button onClick={() => setTool && setTool('arrow-s')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='arrow-s'?'bg-[#FF2D55]/10 text-[#FF2D55] shadow-sm border border-[#FF2D55]/30':`${t.textSub} ${t.btnGhost}`}`} title="S라인 화살표">〰️</button>
        <button onClick={() => setTool && setTool('arrow-tw')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='arrow-tw'?'bg-[#FF2D55]/10 text-[#FF2D55] shadow-sm border border-[#FF2D55]/30':`${t.textSub} ${t.btnGhost}`}`} title="돼지꼬리 화살표">➰</button>
        <button onClick={() => setTool && setTool('eraser')} className={`px-1.5 h-7 flex items-center justify-center rounded-lg text-[13px] whitespace-nowrap transition-colors ${tool==='eraser'?'bg-[#FF3B30]/10 text-[#FF3B30] shadow-sm border border-[#FF3B30]/30':`${t.textSub} ${t.btnGhost}`}`} title="지우개">🧹</button>
     </div>
  </div>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      
      case 'login':
        return (
          <StandaloneLogin 
            supabase={supabase} 
            setAuthUser={setAuthUser} 
            setActiveScreen={setActiveScreen} 
          />
        );
      
      case 'sermonArchive':
        return <SermonArchive t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader} />;
        
      case 'sermonArchiveAdvanced':
        return <SermonArchiveAdvanced t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader} dailyData={dailyData} getArr={getArr} />;

      case 'applyTracker':
        return <ApplyTracker t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader} getArr={getArr} />;

      case 'trainingSubPages':
        return (
          <TrainingSubPages 
            t={t} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
          />
        );

      case 'secretChat':
        return <SecretChat currentUser={authUser} setActiveScreen={setActiveScreen} />;
        
      case 'meditationPilgrimage':
        return (
          <MeditationPilgrimage 
            setActiveScreen={setActiveScreen} 
            isDarkMode={isDarkMode} 
            authUser={authUser} 
            logUserAction={logUserAction}
            bibles={bibles}
            date={date}
          />
        );
  
      case 'sermonAnalytics':
      case 'sermonAnalysis':
        return (
          <SermonArchiveAnalytics 
            onBack={() => setActiveScreen('home')} 
            bibles={bibleData}
            t={t} 
            isDarkMode={isDarkMode}
            dailyData={dailyData}
            updateDay={updateDay}
          />
        );
          
      case 'guidebook':
      case 'appGuidebook':
        return (
          <AppGuidebook 
            t={t} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
          />
        );

      case 'reelsStudio':
        return (
          <ReelsStudio 
            authUser={authUser} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
          />
        );
  
      case 'trainingCurriculum':
        return <TrainingCurriculum t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />;

      case 'home':
        return (
          <Home 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            openModal={openModal} bibleProgress={bibleProgress} readChapsCount={readChapsCount} currDay={currDay} readChallengeStart={readChallengeStart}
            supabase={supabase} MenuIcon={IconMenu} date={date} setDate={setDate} hasNewBoardPost={hasNewBoardPost} setHasNewBoardPost={setHasNewBoardPost}
            HeartIcon={IconHeart} PrayingHandsIcon={IconPray} formatVerse={formatVerse} dateHash={dateHash} currentBgUrl={currentBgUrl}
            FireIcon={IconFlame} BibleIcon={IconBook} updateDay={updateDay} triggerConfetti={triggerConfetti} SmileFaceIcon={IconSmile}
            SunflowerIcon={IconFlame} NotebookIcon={IconDocument} DiaryIcon={IconHeart} ChurchIcon={IconChurch} YoutubeIcon={IconYoutube}
            isWknd={isWknd} ymdStr={ymdStr} praiseChannels={praiseChannels} UserFaceIcon={IconUser} authUser={authUser}
            MapIcon={IconMap} HeadphonesIcon={IconHeadphones} ReportIcon={IconDocument} streak5={streak5}
          />
        );

      case 'fiveSetMenu':
        return (
          <FiveSetMenu 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} HeartIcon={IconHeart} BibleIcon={IconBook} FireIcon={IconFlame} PrayingHandsIcon={IconPray} SmileFaceIcon={IconSmile}
            logUserAction={logUserAction}
          />
        );

      case 'diary':
        return (
          <Diary 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} openModal={openModal} currDay={currDay} bibleNotes={bibleNotes} getArr={getArr} HeartIcon={IconHeart} BibleIcon={IconBook} DiaryIcon={IconHeart}
            logUserAction={logUserAction}
          />
        );

      case 'board':
        return (
          <Board 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} mLocal={mLocal} setMLocal={setMLocal} authUser={authUser} boardPosts={boardPosts} setBoardPosts={setBoardPosts}
            isLoadingPosts={false} supabase={supabase} fetchPosts={fetchPosts} getArr={getArr}
          />
        );

      case 'prayer':
        return (
          <PrayerBox 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} globalPrayers={globalPrayers} globalIntercessions={globalIntercessions} openModal={openModal} getArr={getArr}
            FireIcon={IconFlame} PrayingHandsIcon={IconPray}
            logUserAction={logUserAction}
          />
        );

      case 'bibleReadNote':
        return (
          <BibleReadNoteSplit 
            t={t} bibles={bibles} currentChapId={currentChapId} setCurrentChapId={setCurrentChapId} onBack={() => setActiveScreen('bible')}
            logUserAction={logUserAction}
          />
        );

      case 'adminConsole':
        return (
          <AdminConsole 
            authUser={authUser} 
            isDarkMode={isDarkMode} 
            onClose={() => setActiveScreen('home')} 
          />
        );

      case 'cell':
        return (
          <Cell 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} date={date} currDay={currDay} authUser={authUser} globalCellData={globalCellData}
            renderToolbar={renderToolbar} handleStickerAdd={handleStickerAdd} handleMemoAdd={handleMemoAdd} handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} StickerLayer={StickerLayer} onPtrDown={onPtrDown}
            updateDay={updateDay} handleUpdateCell={handleUpdateCell} handleAutoNumbering={() => {}} handleAutoResize={handleAutoResize} copyCellReport={copyCellReport} getArr={getArr}
            handleCompleteCell={handleCompleteCell}
            openModal={openModal}
            logUserAction={logUserAction}
          />
        );

      case 'qt':
        return (
          <QT 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader}
            date={date} currDay={currDay} dailyData={dailyData} globalSharedQt={globalSharedQt} isWknd={isWknd} ymdStr={ymdStr}
            qtEditorRef={qtEditorRef} renderToolbar={renderToolbar} handleStickerAdd={handleStickerAdd} handleMemoAdd={handleMemoAdd} handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} StickerLayer={StickerLayer} onPtrDown={onPtrDown}
            updateDay={updateDay} extractVideoId={extractVideoId} handleUpdateSharedQt={handleUpdateSharedQt} triggerConfetti={triggerConfetti} findBibleText={findBibleText} handleAutoResize={handleAutoResize}
            authUser={authUser}
            bibles={bibles}
            logUserAction={logUserAction}
            openGlobalDrawer={openGlobalDrawer}
          />
        );

      case 'mcheyne':
        return (
          <Mcheyne 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader} RichTextEditor={RichTextEditor} mcheyneEditorRef={mcheyneEditorRef} bibles={bibles} date={date} currDay={currDay} ymdStr={ymdStr}
            mcheyneActivePlan={mcheyneActivePlan} mcheynePlanIdx={mcheynePlanIdx} setMcheynePlanIdx={setMcheynePlanIdx} readVerses={readVerses} setReadVerses={setReadVerses}
            ttsRate={ttsRate} setTtsRate={setTtsRate} isSpeaking={isSpeaking} renderToolbar={renderToolbar} handleStickerAdd={handleStickerAdd} handleMemoAdd={handleMemoAdd} handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} StickerLayer={StickerLayer} onPtrDown={onPtrDown}
            updateDay={updateDay} getArr={getArr} cleanText={cleanText} toggleTTS={toggleTTS} handleAutoResize={handleAutoResize} YoutubeIcon={IconYoutube}
            logUserAction={logUserAction}
          />
        );

      case 'bible':
        return (
          <Bible 
            bibles={bibles} currentChapId={currentChapId} setCurrentChapId={setCurrentChapId} bibleViewMode={bibleViewMode} setBibleViewMode={setBibleViewMode}
            bibleNotes={bibleNotes} setBibleNotes={setBibleNotes} bibleHighlights={bibleHighlights} setBibleHighlights={setBibleHighlights} readVerses={readVerses} setReadVerses={setReadVerses}
            isDarkMode={isDarkMode} t={t} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} getKoName={getKoName}
            getArr={getArr} readChallengeStart={readChallengeStart} setReadChallengeStart={setReadChallengeStart} bibleProgress={bibleProgress} readChapsCount={readChapsCount} openModal={openModal}
            setSelVerses={setSelVerses} selVerses={selVerses} cleanText={cleanText} getLocalToday={getLocalToday} renderToolbar={renderToolbar} bibleEditorRef={bibleEditorRef}
            handleStickerAdd={handleStickerAdd} handleMemoAdd={handleMemoAdd} handleFileUpload={handleFileUpload} CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor}
            size={size} setSize={setSize} StickerLayer={StickerLayer} SubPageHeader={SubPageHeader} currDay={currDay} updateDay={updateDay} onPtrDown={onPtrDown} handleAutoResize={handleAutoResize}
            targetVerse={targetVerse}
            setTargetVerse={setTargetVerse}
          />
        );

      case 'bibleMap':
        return (
          <div className="flex flex-col h-full relative overflow-hidden">
            <div className={`px-5 py-4 ${t.cardBg} border-b ${t.border} flex items-center justify-between z-10 shadow-sm`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveScreen('bibleWikiAdvanced')} className={`p-2 rounded-xl ${t.btnGhost} ${t.textMain}`}><IconArrowLeft className="w-5 h-5"/></button>
                <h2 className={`text-[16px] font-black tracking-tight ${t.textMain} flex items-center gap-2`}><IconMap className="w-5 h-5 text-[#007AFF]"/> 입체 성경 지도</h2>
              </div>
            </div>
            <div className="flex-1 relative">
              <BibleMapViewer 
                t={t}
                isDarkMode={isDarkMode}
                onSelectLocation={(loc) => { console.log("선택된 성경 장소:", loc); }}
                logUserAction={logUserAction}
             />
            </div>
          </div>
        );

      case 'sermon':
        return (
          <Sermon 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader}
            date={date} currDay={currDay} updateDay={updateDay} sermonEditorRef={sermonEditorRef} renderToolbar={renderToolbar} handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd} handleFileUpload={handleFileUpload} CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor}
            size={size} setSize={setSize} StickerLayer={StickerLayer} onPtrDown={onPtrDown} getArr={getArr} downloadSermonWord={downloadSermonWord} toggleAiDetect={toggleAiDetect}
            isAiDetecting={isAiDetecting} openModal={openModal} isGisangogi={isGisangogi} gisangogiUrl={gisangogiUrl} setGisangogiUrl={setGisangogiUrl} authUser={authUser} bibles={bibles}
            findBibleText={findBibleText} extractVideoId={extractVideoId} handleUpdateSharedQt={handleUpdateSharedQt} globalSharedQt={globalSharedQt} setDailyData={setDailyData}
            logUserAction={logUserAction}
            openGlobalDrawer={openGlobalDrawer}
          />
        );

      case 'dailyRoutine':
        return (
          <DailyRoutine 
            t={t} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
            openModal={openModal} 
            logUserAction={logUserAction}
          />
        );

      case 'generalNote':
        return (
          <GeneralNote 
            t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} SubPageHeader={SubPageHeader}
            date={date} generalNotes={generalNotes} setGeneralNotes={setGeneralNotes} currentGenNoteId={currentGenNoteId} setCurrentGenNoteId={setCurrentGenNoteId} bibles={bibles}
            genEditorRef={genEditorRef} renderToolbar={renderToolbar} CanvasEngine={CanvasEngine} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize}
            StickerLayer={StickerLayer} onPtrDown={onPtrDown} RichTextEditor={RichTextEditor} getArr={getArr} openModal={openModal}
            logUserAction={logUserAction}
          />
        );

      case 'qtArchiveDetail':
        return (
          <QTArchiveDetail 
            t={t} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
          />
        );
        
      case 'familySelect':
      case 'familyPrivateLogin':
      case 'familyPublic':
      case 'familyPrivate':
        return (
          <FamilyScreens 
            activeScreen={activeScreen} 
            t={t} 
            isDarkMode={isDarkMode} 
            setActiveScreen={setActiveScreen} 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
            SubPageHeader={SubPageHeader}
            familyRoomPw={familyRoomPw} 
            setFamilyRoomPw={setFamilyRoomPw} 
            familyPublicData={familyPublicData} 
            setFamilyPublicData={setFamilyPublicData} 
            familyRoomData={familyRoomData} 
            handleUpdateFamily={handleUpdateFamily} 
            formatFamVerse={formatFamVerse}
            currDay={currDay} 
            updateDay={updateDay} 
            getArr={getArr} 
            handleAutoResize={handleAutoResize} 
            triggerConfetti={triggerConfetti} 
            handleCompleteFamily={handleCompleteFamily} 
            openModal={openModal}
            logUserAction={logUserAction}
            authUser={authUser}
            date={date}
            setDate={setDate}
            bibles={bibles}
          />
        );

      case 'interlinear':
        return (
          <Interlinear 
            t={t} setActiveScreen={setActiveScreen} setIsSidebarOpen={setIsSidebarOpen} interWords={interWords} interBook={interBook} setInterBook={setInterBook} interChapter={interChapter} setInterChapter={setInterChapter} interVerse={interVerse} setInterVerse={setInterVerse}
            bibles={bibles} isLoadingInter={isLoadingInter} getArr={getArr} getKoName={getKoName} openModal={openModal}
          />
        );

      case 'bibleWiki':
      case 'bibleWikiAdvanced':
        return (
          <BibleWiki 
            wikiSearchTerm={wikiSearchTerm}
            setWikiSearchTerm={setWikiSearchTerm}
            bibles={bibles}
            getKoName={getKoName}
            setActiveScreen={setActiveScreen}
            isDarkMode={isDarkMode}
            t={t}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        );

      case 'jericho':
        return (
          <JerichoWalk 
            t={t} 
            setActiveScreen={setActiveScreen} 
            logUserAction={logUserAction}
          />
        );
        
      default:
        return (
          <MeditationPilgrimage 
            setActiveScreen={setActiveScreen} 
            isDarkMode={isDarkMode} 
            authUser={authUser} 
            logUserAction={logUserAction}
            bibles={bibles}
            date={date}
          />
        );
    }
  };

  return (
    <AppErrorBoundary>
      <div className={`h-[100dvh] w-full bg-[#000000] flex justify-center relative ${isDarkMode ? 'dark' : ''}`}>
        <GlobalStyles />
        {showConfetti && <Confetti />}

        {/* 🌟 메인 레이아웃 프레임 */}
        <div className={`w-full h-full flex relative md:shadow-2xl ${t.appBg} overflow-hidden max-w-[1600px] mx-auto`}>
          <Sidebar 
            t={t}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            authUser={authUser}
            setAuthUser={setAuthUser}
            handleLogout={() => { 
              if (window.confirm('로그아웃 하시겠습니까?')) { 
                localStorage.removeItem('church_auth_user');
                localStorage.removeItem('login_user_name');
                localStorage.removeItem('qt_auth_user');
                setAuthUser(null); 
                setActiveScreen('login'); 
              } 
            }}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            logUserAction={logUserAction}
            streak5={streak5}
          />
          
          {isSidebarOpen && window.innerWidth < 768 && (
            <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140] md:hidden pointer-events-auto transition-all"></div>
          )}
          
          <div className={`flex-1 w-full h-full min-w-0 flex flex-col relative overflow-hidden bg-inherit`} onPointerMove={onPtrMove} onPointerUp={onPtrUp} onPointerLeave={onPtrUp}>
            <div className="flex-1 overflow-hidden relative z-10 w-full h-full pointer-events-auto">{renderScreen()}</div>

            {/* 하단 모바일 도크 바 */}
            {!['login', 'adminConsole', 'cell', 'cellAttendance', 'secretChat', 'meditationPilgrimage', 'reelsStudio'].includes(activeScreen) && (
              <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] h-[64px] z-[90] pointer-events-auto rounded-full backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.25)] border transition-all ${
                isDarkMode 
                  ? 'bg-[#1C1C1E]/90 border-white/10' 
                  : 'bg-[#F2F2F7]/90 border-black/5'
              }`}>
                <div className="grid grid-cols-5 h-full items-center px-1.5">
                  {[ 
                    { id: 'home', label: '홈', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }, 
                    { id: 'diary', label: '감사/간증', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> }, 
                    { id: 'cell', label: '목장모임', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }, 
                    { id: 'bible', label: '성경통독', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
                    { id: 'dailyRoutine', label: '루틴', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> } 
                  ].map((tabItem) => {
                    const isActive = activeScreen === tabItem.id;
                    return (
                      <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => setActiveScreen(tabItem.id)}
                        className={`flex flex-col items-center justify-center h-[52px] rounded-full transition-all cursor-pointer select-none ${
                          isActive 
                            ? (isDarkMode ? 'bg-white/10' : 'bg-black/5') 
                            : 'hover:opacity-80 active:opacity-60'
                        }`}
                      >
                        <span className={`transition-colors ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
                          {tabItem.icon}
                        </span>
                        <span className={`text-[10px] font-bold tracking-tight mt-0.5 transition-colors ${
                          isActive 
                            ? 'text-[#007AFF]' 
                            : 'text-[#8E8E93]'
                        }`}>
                          {tabItem.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 모달 렌더링 컨테이너 */}
          {modal.isOpen && mLocal && (
            <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 pointer-events-auto transition-all">
              
              {modal.type === 'generalNoteHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border} transition-transform`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                      <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>나의 자유 노트 이력</h2>
                      <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 pb-32">
                      {getArr(generalNotes).length === 0 ? (
                          <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>작성된 노트가 없습니다.</div>
                      ) : (
                          getArr(generalNotes).map(note => (
                              <div 
                                  key={note.id} 
                                  className={`${t.cardBg} p-5 rounded-[24px] border ${t.border} shadow-sm flex flex-col gap-2 cursor-pointer hover:scale-[1.01] transition-transform`}
                                  onClick={() => { setCurrentGenNoteId(note.id); closeModal(); }}
                              >
                                 <div className="flex justify-between items-center border-b border-dashed border-[#E5E5EA] dark:border-[#38383A] pb-3 mb-2">
                                     <span className={`text-[16px] font-black ${t.primaryText}`}>{note.title || '제목 없는 노트'}</span>
                                 </div>
                                 <div className="text-[14px]">
                                     <p className={`${t.textSub} line-clamp-2 leading-[1.6]`}>{note.content ? note.content.replace(/<[^>]*>?/gm, '') : '내용 없음'}</p>
                                 </div>
                                 <div className="flex justify-between items-center mt-3">
                                    <span className={`text-[12px] font-bold ${t.textSub}`}>{note.updatedAt || '날짜 미상'}</span>
                                    <button onClick={(e) => { e.stopPropagation(); if(window.confirm('이 노트를 삭제하시겠습니까?')) { setGeneralNotes(prev => getArr(prev).filter(n => n.id !== note.id)); if (currentGenNoteId === note.id) setCurrentGenNoteId(null); } }} className="text-[#FF3B30] text-[12px] font-bold px-3 py-1.5 bg-[#FF3B30]/10 rounded-lg">삭제</button>
                                 </div>
                              </div>
                          ))
                      )}
                  </div>
                </div>
              )}

              {modal.type === 'familyHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                      <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>가정예배 이력 조회</h2>
                      <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 pb-32">
                      {getArr(familyHistory).length === 0 ? (
                          <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>저장된 가정예배 이력이 없습니다.</div>
                      ) : (
                          getArr(familyHistory).map(record => (
                              <div key={record.id} className={`${t.cardBg} p-6 rounded-[24px] border ${t.border} shadow-sm flex flex-col gap-4`}>
                                 <div className="flex justify-between items-center border-b border-[#E5E5EA] dark:border-[#38383A] pb-3">
                                     <span className={`text-[16px] font-black ${t.primaryText}`}>{record.date} 예배</span>
                                     <span className={`text-[13px] ${t.textSub} font-bold`}>참석자: {record.data.attendees || '미입력'}</span>
                                 </div>
                                 <div className="text-[14px]">
                                     <h4 className={`font-black ${t.textMain} mb-2`}>📖 말씀 묵상</h4>
                                     <p className={`${t.textSub} whitespace-pre-wrap leading-[1.7]`}>{record.data.wordMeditation || '기록 없음'}</p>
                                 </div>
                                 <div className="text-[14px] mt-2">
                                     <h4 className={`font-black ${t.textMain} mb-2`}>🙏 감사와 기도</h4>
                                     <p className={`${t.textSub} whitespace-pre-wrap leading-[1.7]`}>감사: {getArr(record.data.thanks).join(', ') || '없음'}<br/>기도: {getArr(record.data.prayers).join(', ') || '없음'}</p>
                                 </div>
                              </div>
                          ))
                      )}
                  </div>
                </div>
              )}

              {modal.type === 'cellHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                      <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>목장나눔 이력 조회</h2>
                      <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 pb-32">
                      {getArr(cellHistory).length === 0 ? (
                          <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>저장된 목장나눔 이력이 없습니다.</div>
                      ) : (
                          getArr(cellHistory).map(record => (
                              <div key={record.id} className={`${t.cardBg} p-6 rounded-[24px] border ${t.border} shadow-sm flex flex-col gap-4`}>
                                 <div className="flex justify-between items-center border-b border-[#E5E5EA] dark:border-[#38383A] pb-3">
                                     <span className={`text-[16px] font-black text-[#FF9500]`}>{record.week} 모임</span>
                                     <span className={`text-[12px] ${t.textSub} font-bold`}>({record.date} 저장)</span>
                                 </div>
                                 <div className="text-[14px]">
                                     <h4 className={`font-black ${t.textMain} mb-2`}>📢 공지 및 중보기도</h4>
                                     <p className={`${t.textSub} whitespace-pre-wrap leading-[1.7]`}>{record.data.notice || '내용 없음'}</p>
                                     <p className={`whitespace-pre-wrap leading-[1.7] mt-3 font-bold text-[#34C759]`}>{record.data.cellIntercession || ''}</p>
                                 </div>
                              </div>
                          ))
                      )}
                  </div>
                </div>
              )}

              {modal.type === 'wikiDetail' ? (
                 <div className={`${t.cardBg} sm:rounded-[32px] rounded-t-[32px] p-0 w-full max-w-[480px] mx-auto overflow-hidden h-[90vh] sm:h-auto max-h-[85vh] flex flex-col shadow-2xl border ${t.border} absolute bottom-0 sm:static pointer-events-auto`}>
                   <div className={`${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'} flex items-center justify-between px-6 py-5 shrink-0 border-b ${t.border}`}>
                      <div className="flex items-center gap-2">
                         <span className={`text-[16px] font-black flex items-center gap-1.5 ${t.textMain}`}><IconMap className="w-5 h-5 text-[#34C759]"/> 사건 상세정보</span>
                      </div>
                      <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold transition-colors shadow-sm`}>닫기</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
                      <div className={`flex flex-col gap-3 border-b border-dashed border-[#E5E5EA] dark:border-[#38383A] pb-6`}>
                         <div className="flex justify-between items-start">
                            <h2 className={`text-[26px] font-black ${t.textMain} leading-tight tracking-tight`}>{mLocal.event}</h2>
                            <span className={`text-[14px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-lg whitespace-nowrap ml-2`}>{mLocal.verse}</span>
                         </div>
                         <span className={`text-[14px] font-bold text-[#34C759] bg-[#34C759]/10 px-3 py-1.5 rounded-lg self-start`}>📍 {mLocal.place}</span>
                      </div>
                      <div className={`p-5 rounded-[24px] ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-[#F5F5F7]'} border ${t.border}`}>
                         <h4 className={`text-[12px] font-black text-[#8E8E93] mb-3 uppercase tracking-widest`}>사건 기록 (본문)</h4>
                         <p className={`text-[16px] ${t.textMain} leading-[1.8] break-keep font-medium`}>{mLocal.desc}</p>
                      </div>
                      <div className="flex gap-3 mt-2">
                         <button onClick={() => { closeModal(); setActiveScreen('bible'); openModal('bibleRef', { title: '성경 본문', verses: [{ ref: mLocal.verse, text: mLocal.desc }]}); }} className="flex-1 bg-[#007AFF] text-white py-4 rounded-[16px] font-black text-[15px] shadow-lg shadow-[#007AFF]/20 hover:bg-[#0A84FF] active:scale-[0.98] transition-all">전체 장 읽기</button>
                         <button onClick={() => { closeModal(); setActiveScreen('interlinear'); }} className={`flex-1 ${t.btnSecondary} py-4 rounded-[16px] font-black text-[15px] shadow-sm hover:opacity-80 active:scale-[0.98] transition-all`}>원어 성경</button>
                      </div>
                   </div>
                 </div>
              ) : modal.type === 'fullVerse' ? (
                 <div className={`relative rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-center border ${t.border} bg-cover bg-center h-[80vh] sm:h-[70vh] w-full max-w-[480px] mx-auto absolute bottom-0 sm:static`} style={{ backgroundImage: `url(${watercolorBgs[mLocal.bgHash % watercolorBgs.length]})` }}>
                   <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                   <div className="relative z-10 p-8 sm:p-10 text-center flex flex-col items-center justify-center h-full">
                     <span className="text-[13px] sm:text-[15px] font-bold text-white/90 mb-6 drop-shadow-md bg-black/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">오늘의 말씀 카드</span>
                     <span className="text-[28px] sm:text-[34px] text-white font-bold leading-relaxed drop-shadow-lg break-keep font-yeongnamnu tracking-wide">
                         {mLocal.text.replace(/\([^)]+\)$/, '')}
                     </span>
                     <span className="block mt-8 text-[15px] sm:text-[17px] text-white/90 font-bold tracking-widest">{mLocal.text.match(/\(([^)]+)\)$/)?.[0] || ''}</span>
                     <button onClick={(e) => { e.stopPropagation(); downloadWallpaper(mLocal.text, watercolorBgs[mLocal.bgHash % watercolorBgs.length]); }} className="mt-12 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white font-bold text-[14px] px-6 py-3.5 rounded-full shadow-lg border border-white/30 transition-colors flex items-center gap-2"><IconDownload className="w-5 h-5"/> 이미지로 저장하기</button>
                   </div>
                   <button onClick={closeModal} className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-full font-black text-xl drop-shadow-md z-20 backdrop-blur-md border border-white/10">✕</button>
                 </div>
              ) : (
                <div className={`${t.cardBg} sm:rounded-[32px] rounded-t-[32px] p-0 w-full max-w-[500px] mx-auto overflow-hidden ${['testimony', 'bibleNoteList', 'thanks', 'sermonList'].includes(modal.type) ? 'h-[95vh] sm:h-[90vh]' : modal.type === 'strongsDic' ? 'h-auto max-h-[85vh]' : 'h-[90vh] sm:h-[80vh]'} flex flex-col shadow-2xl border ${t.border} relative pointer-events-auto absolute bottom-0 sm:static transition-transform`}>
                  
                  {!['testimony', 'bibleNoteList', 'thanks', 'sermonList', 'strongsDic', 'wikiDetail', 'generalNoteHistory', 'familyHistory', 'cellHistory', 'globalPrayer', 'globalIntercession'].includes(modal.type) && (
                    <div className={`flex justify-between items-center px-6 py-5 border-b ${t.border} shrink-0 ${t.cardBg}`}>
                      <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>{modal.type==='bibleRef' ? '말씀 본문 찾기' : modal.type==='bibleChallenge' ? '성경 365 통독표' : '기록하기'}</h2>
                      <div className="flex gap-2">
                         <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex-1 overflow-y-auto flex flex-col relative w-full h-full ${t.bgBody}`}>
                    
                    {modal.type === 'thanks' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                         <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>오늘의 감사 리스트 <span className={`text-[13px] font-normal ${t.textSub} ml-1`}>({date})</span></h2>
                            <div className="flex gap-2 shrink-0">
                               <button onClick={handleCopy} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>복사</button>
                               <button onClick={closeModal} className={`${t.btnPrimary} px-4 py-2 rounded-full text-[13px] font-bold`}>닫기</button>
                            </div>
                         </div>
                         <div className="p-5 md:p-6 flex-1 flex flex-col relative pointer-events-auto">
                             <div className={`bg-[#FF2D55]/10 p-4 rounded-[16px] mb-4 shrink-0`}>
                                 <span className={`text-[13px] font-bold ${t.pinkText} leading-[1.6]`}>일상의 감사를 편하게 적어보세요. (엔터 시 번호 자동생성)</span>
                             </div>
                             <textarea 
                                value={mLocal.thanksText || '1. '} 
                                onChange={(e) => { 
                                    let val = e.target.value; 
                                    if (val.endsWith('\n')) { 
                                        const lines = val.split('\n'); 
                                        val += `${lines.length}. `; 
                                    } 
                                    setMLocal({...mLocal, thanksText: val}); 
                                    updateDay({thanksText: val, checks: { ...(currDay.checks||{}), '감사': true }}); 
                                }} 
                                className={`w-full flex-1 p-5 rounded-[24px] ${t.cardBg} ${t.textMain} border ${t.border} shadow-inner outline-none resize-none overflow-hidden text-[16px] leading-[1.8] h-full relative pointer-events-auto font-sans note-lines`} 
                                placeholder="감사한 내용을 적어보세요..." 
                                onPointerDown={e => e.stopPropagation()} 
                             />
                         </div>
                      </div>
                    )}

                    {modal.type === 'testimony' && (
                      <div className={`absolute inset-0 flex flex-col h-full ${t.bgBody} z-50`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0 z-50`}>
                          <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>나의 묵상 간증</h2>
                          <div className="flex gap-2 shrink-0">
                             <button onClick={() => { const txt = currDay.testimony || ''; navigator.clipboard.writeText(txt); alert("복사되었습니다."); }} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>복사</button>
                             <button onClick={() => { if(window.confirm('초기화하시겠습니까?')) updateDay({testimony: TESTIMONY_TEMPLATE}); }} className={`bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 px-4 py-2 rounded-full text-[13px] font-bold`}>초기화</button>
                             <button onClick={() => {
                                if (authUser?.name && currDay?.testimony) logUserAction(authUser.name, '감사/간증', 'write', currDay.testimony);
                                closeModal();
                             }} className={`${t.btnPrimary} px-4 py-2 rounded-full text-[13px] font-bold`}>닫기</button>
                          </div>
                        </div>
                        
                        <div className={`${t.cardBg} px-6 py-3 border-b ${t.border} flex justify-between items-center shrink-0`}>
                            <span className={`text-[13px] font-black ${t.textSub}`}>💡 간증문 작성 가이드 및 질문</span>
                            <button 
                                onClick={() => setShowGuide(!showGuide)} 
                                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${t.bgElevated} ${t.primaryText} hover:opacity-80 transition-opacity`}
                            >
                                {showGuide ? '가이드 숨기기 ▴' : '가이드 보기 ▾'}
                            </button>
                        </div>

                        {showGuide && (
                            <div className={`${t.cardBg} px-6 pb-6 pt-2 shrink-0 shadow-sm z-40 border-b ${t.border} animate-fade-in-up`}>
                                <div className={`${t.bgElevated} p-5 rounded-[24px]`}>
                                   <ul className={`text-[13px] ${t.textSub} space-y-2 font-bold leading-[1.6]`}>
                                      <li>• 사건을 먼저 쓰지 말고 <b className={t.textMain}>말씀을 먼저</b> 붙듭니다.</li>
                                      <li>• 상대의 죄보다 <b className={t.textMain}>내 죄를 씁니다</b> (예: "나는 인정받고 싶었다").</li>
                                      <li>• 고난을 사건으로 끝내지 않고 <b className={t.textMain}>깨달음과 순종</b>으로 연결합니다.</li>
                                      <li>• <b className={t.textMain}>적용</b>을 반드시 씁니다 (오늘 무엇을 순종하고 끊을 일인지).</li>
                                   </ul>
                                   <div className={`mt-4 pt-4 border-t ${t.border}`}>
                                       <span className={`text-[12px] font-black tracking-widest ${t.primaryText} mb-2 block`}>스스로에게 던질 질문</span>
                                       <p className={`text-[12px] ${t.textSub} font-bold leading-[1.6]`}>내 죄가 드러나는가? / 다른 사람 잘못보다 내 변화가 중심인가? / 말씀이 실제 삶과 연결되는가? / 구체적인 적용이 있는가? / 하나님께 영광이 되는가?</p>
                                   </div>
                                </div>
                            </div>
                        )}

                        <div className={`flex-1 relative overflow-hidden flex flex-col ${t.bgBody}`}>
                          <div className="p-5 md:p-6 pb-40 flex flex-col flex-1 overflow-y-auto pointer-events-auto">
                              <textarea 
                                 value={currDay.testimony || TESTIMONY_TEMPLATE} 
                                 onChange={(e) => updateDay({testimony: e.target.value})} 
                                 onPointerDown={e => e.stopPropagation()}
                                 className={`w-full flex-1 p-5 rounded-[24px] ${t.cardBg} ${t.textMain} border ${t.border} outline-none resize-none text-[15px] h-auto overflow-hidden font-sans min-h-[800px] leading-[2.5] relative pointer-events-auto shadow-inner note-lines`} 
                              />
                          </div>
                        </div>
                      </div>
                    )}

                    {modal.type === 'sermonList' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                         <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>예배 노트 목록</h2>
                            <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>닫기</button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 pb-32 pointer-events-auto">
                            {getArr(mLocal.notes).length === 0 ? (
                                <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>작성된 예배 노트가 없습니다.</div>
                            ) : (
                                getArr(mLocal.notes).map(([dKey, dVal]) => (
                                    <div key={dKey} onClick={() => { setDate(dKey); closeModal(); }} className={`${t.cardBg} p-6 rounded-[24px] border ${t.border} shadow-sm cursor-pointer hover:scale-[1.02] transition-transform flex flex-col gap-2.5`}>
                                       <div className="flex justify-between items-center"><span className={`text-[13px] font-black ${t.primaryText}`}>{dKey}</span><span className={`text-[12px] font-bold ${t.textSub}`}>설교자: {dVal.sermonPreacher || '미입력'}</span></div>
                                       <h3 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>{dVal.sermonTitle || '제목 없는 예배 노트'}</h3>
                                       <p className={`text-[13px] font-bold ${t.textSub} truncate mt-1`}>본문: {dVal.sermonReference || '본문 없음'}</p>
                                    </div>
                                ))
                            )}
                         </div>
                      </div>
                    )}

                    {modal.type === 'strongsDic' && mLocal.word && (() => {
                      const w = mLocal.word;
                      return (
                        <div className={`flex flex-col h-full ${t.bgBody} overflow-hidden rounded-t-[32px]`}>
                           <div className={`${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'} flex items-center justify-between px-6 py-5 shrink-0 border-b ${t.border}`}>
                              <div className="flex items-center gap-2">
                                 <span className={`text-[16px] font-black ${t.textMain} tracking-tight`}>원어 사전</span>
                              </div>
                              <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>닫기</button>
                           </div>
                           
                           <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 pointer-events-auto">
                               <div className={`p-8 ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-[#FFFFFF]'} border ${t.border} rounded-[32px] text-center flex flex-col items-center relative shadow-sm`}>
                                  <button onClick={() => { if (!window.speechSynthesis || !w.pron) return; const u = new SpeechSynthesisUtterance(w.pron); u.lang = 'en-US'; window.speechSynthesis.speak(u); }} className={`absolute top-5 right-5 bg-[#007AFF]/10 text-[#007AFF] px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#007AFF]/20 transition-colors`}>발음 듣기</button>
                                  <span className={`text-[72px] font-black ${t.textMain} mt-6 mb-2`} dir={w.strongs?.startsWith('H') ? "rtl" : "ltr"}>{w.orig || w.original_word || w.hebrew}</span>
                                  <span className={`text-[15px] ${t.textSub} font-mono tracking-widest font-bold mb-6`}>[{w.pronunciation || w.pron}]</span>
                                  <div className="flex flex-wrap gap-2 justify-center items-center">
                                     <span className={`bg-[#007AFF] text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-sm`}>Strong's {w.strongs_id || w.strongs}</span>
                                     {w.grammar && <span className={`${t.bgElevated} ${t.textMain} px-5 py-2 rounded-full text-[13px] font-bold shadow-sm`}>{w.grammar}</span>}
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div className={`${t.cardBg} p-6 rounded-[24px] shadow-sm border ${t.border} flex flex-col`}>
                                     <span className={`block text-[12px] font-black uppercase tracking-widest ${t.textSub} mb-3`}>한국어 뜻</span>
                                     <span className={`text-[17px] font-black ${t.textMain} break-keep mt-auto leading-tight`}>{w.meaning || w.kor || w.korean_trans}</span>
                                  </div>
                                  <div className={`${t.cardBg} p-6 rounded-[24px] shadow-sm border ${t.border} flex flex-col`}>
                                     <span className={`block text-[12px] font-black uppercase tracking-widest ${t.textSub} mb-3`}>영문 (Gloss)</span>
                                     <span className={`text-[17px] font-black ${t.textMain} break-keep mt-auto leading-tight`}>{w.eng || w.gloss || 'N/A'}</span>
                                  </div>
                               </div>

                               <div className={`${t.cardBg} p-6 rounded-[24px] shadow-sm border ${t.border} mt-2`}>
                                  <h4 className={`font-black ${t.textMain} text-[15px] mb-4`}>상세 해석 및 어원</h4>
                                  <p className={`text-[15px] ${t.textSub} font-medium leading-[1.8] whitespace-pre-wrap break-keep`}>{w.description || w.desc || '등록된 어원 정보가 없습니다.'}</p>
                               </div>
                           </div>
                        </div>
                      );
                    })()}

                    {modal.type === 'bibleRef' && (
                      <div className="flex flex-col h-full gap-4 p-5 pointer-events-auto">
                        <div className="bg-[#007AFF]/10 p-4 rounded-[16px]"><span className={`text-[13px] font-bold ${t.primaryText} leading-relaxed block`}>💡 <b>복사</b> 버튼을 눌러 복사한 뒤 화면에 붙여넣으세요.</span></div>
                        <div className={`space-y-4 p-5 ${t.cardBg} rounded-[24px] leading-relaxed text-[15px] ${t.textMain} overflow-y-auto flex-1 border ${t.border} shadow-sm`}>
                           {getArr(mLocal.verses).map((v, i) => {
                               const copyText = `> [${v.ref}] ${cleanText(v.text||v)}\n`;
                               return (
                               <div key={i} className={`flex items-start gap-4 mb-4 pb-4 border-b ${t.border} last:border-0 last:pb-0 last:mb-0`}>
                                 <div onClick={() => { navigator.clipboard.writeText(copyText); alert('말씀이 복사되었습니다!'); }} className={`cursor-pointer shrink-0 py-2 px-3 ${t.bgElevated} rounded-[10px] text-[12px] font-bold ${t.textMain} shadow-sm hover:opacity-80 active:scale-95 transition-all`}>복사</div>
                                 <p className="flex-1 pt-1 font-medium"><span className={`${t.primaryText} font-black mr-2.5`}>{v.ref?.split(' ')[1]||v.vIdx}</span>{cleanText(v.text||v)}</p>
                               </div>
                           )})}
                        </div>
                      </div>
                    )}

                    {modal.type === 'thanksDeclaration' && (
                      <div className="space-y-4 p-5 pointer-events-auto">
                        <div className="flex justify-end"><button onClick={() => { const txt = getArr(mLocal?.thanksDeclarations, ['','']).map((q,i)=>`${i+1}. ${q}`).join('\n'); navigator.clipboard.writeText(txt); alert("복사되었습니다."); }} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>전체 복사</button></div>
                        {[0, 1].map((i) => ( 
                          <div key={i} className="flex flex-col gap-2">
                            <span className={`text-[13px] font-bold px-1 ${t.textSub}`}>{i+1}번째 감사 선포</span>
                            <textarea value={(mLocal.thanksDeclarations || ['',''])[i]||''} onChange={(e) => { const next = [...(mLocal.thanksDeclarations || ['',''])]; next[i] = e.target.value; setMLocal({...mLocal, thanksDeclarations: next}); updateDay({thanksDeclarations: next, checks: { ...(currDay.checks||{}), '감사': true }}); }} onInput={handleAutoResize} className={`w-full p-5 rounded-[20px] ${t.bgInput} ${t.textMain} min-h-[80px] resize-none overflow-hidden border outline-none text-[15px] font-bold whitespace-pre-wrap shadow-inner focus:border-[#007AFF] transition-colors`} placeholder="나는 ~를 감사합니다." onPointerDown={e => e.stopPropagation()} />
                          </div> 
                        ))}
                      </div>
                    )}

                    {modal.type === 'applyQuestion' && (
                      <div className="space-y-4 p-5 pointer-events-auto">
                        <div className="flex justify-end mb-2"><button onClick={() => { const txt = getArr(mLocal?.applyQuestions).map((q,i)=>`${i+1}. ${q}`).join('\n'); navigator.clipboard.writeText(txt); alert("복사되었습니다."); }} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold`}>전체 복사</button></div>
                        {getArr(mLocal.applyQuestions).map((qItem, i) => (
                          <div key={i} className="flex gap-3 items-center">
                            <textarea value={qItem||''} onChange={(e) => { const n = [...getArr(mLocal.applyQuestions)]; n[i] = e.target.value; setMLocal({...mLocal, applyQuestions: n}); updateDay({applyQuestions: n}); }} onInput={handleAutoResize} className={`flex-1 min-h-[60px] p-4 rounded-[20px] ${t.bgInput} ${t.textMain} border outline-none resize-none overflow-hidden text-[15px] font-bold whitespace-pre-wrap shadow-inner focus:border-[#007AFF] transition-colors`} onPointerDown={e => e.stopPropagation()}/>
                            <button onClick={() => { const n = [...getArr(mLocal.applyQuestions)]; n.splice(i, 1); setMLocal({...mLocal, applyQuestions: n}); updateDay({applyQuestions: n}); }} className={`bg-[#FF3B30]/10 text-[#FF3B30] text-[13px] px-4 py-4 rounded-[16px] font-bold shrink-0 hover:bg-[#FF3B30]/20 transition-colors`}>삭제</button>
                          </div>
                        ))}
                        <button onClick={() => { const n = [...getArr(mLocal.applyQuestions), '']; setMLocal({...mLocal, applyQuestions: n}); updateDay({applyQuestions: n}); }} className={`w-full py-4 border-2 border-dashed ${t.border} ${t.textSub} font-black rounded-[20px] text-[14px] hover:border-[#007AFF] hover:text-[#007AFF] transition-colors`}>+ 질문 추가</button>
                      </div>
                    )}

                    {modal.type === 'globalPrayer' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                         <div className={`flex justify-between items-center px-4 md:px-6 py-4 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <div className="flex items-center gap-1.5 shrink-0">
                               <span className="text-rose-500"><IconPray className="w-5 h-5" /></span>
                               <h2 className={`text-[17px] font-black tracking-tight ${t.textMain} whitespace-nowrap`}>나의 기도제목</h2>
                            </div>
                            <div className="flex gap-2 shrink-0">
                               <button onClick={() => { const txt = getArr(mLocal).filter(p=>p.status==='praying').map((p,i)=>`${i+1}. ${p.text}`).join('\n'); navigator.clipboard.writeText(txt); alert("기도제목이 복사되었습니다."); }} className={`${t.btnSecondary} px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap`}>복사</button>
                               <button onClick={closeModal} className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap`}>닫기</button>
                            </div>
                         </div>

                         <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 hide-scrollbar">
                            <div className="flex flex-col gap-3">
                               <div className="flex justify-between items-center px-1 shrink-0">
                                  <span className={`text-[13.5px] font-black ${t.primaryText} whitespace-nowrap`}>기도 중인 제목 ({getArr(mLocal).filter(p=>p.status==='praying').length})</span>
                                </div>

                               <div className="flex flex-col gap-3">
                                  {getArr(mLocal).filter(p=>p.status==='praying').map(p => (
                                     <div key={p.id} className={`flex gap-3 items-center p-3 rounded-2xl ${t.cardBg} border ${t.border} shadow-sm transition-all`}>
                                        <textarea 
                                           value={p.text || ''} 
                                           onChange={(e) => setMLocal(getArr(mLocal).map(pr => pr.id === p.id ? { ...pr, text: e.target.value } : pr))} 
                                           onInput={handleAutoResize} 
                                           onPointerDown={e => e.stopPropagation()}
                                           placeholder="기도제목을 입력하세요..."
                                           className={`flex-1 min-w-0 bg-transparent text-[14px] font-medium ${t.textMain} outline-none resize-none overflow-hidden leading-[1.6] min-h-[44px]`} 
                                        />
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                           <button 
                                              onClick={() => {
                                                 if (!p.text || !p.text.trim()) return alert("전송할 기도제목이 없습니다.");
                                                 try {
                                                    const uName = authUser?.name || '나';
                                                    const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
                                                    const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];
                                                    curPrayers.push({ id: Date.now(), name: uName, text: p.text.trim(), status: 'praying' });
                                                    const nextCellData = { ...cellData, groupPrayers: curPrayers };
                                                    localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
                                                    if (supabase && authUser?.group) supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
                                                    alert("목장 모임 식구 기도제목으로 전송되었습니다!");
                                                 } catch (e) { alert("전송 중 오류가 발생했습니다."); }
                                              }}
                                              className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[11px] font-black transition-all whitespace-nowrap flex items-center justify-center gap-1"
                                           >
                                              목장으로
                                           </button>
                                           <button 
                                              onClick={() => setMLocal(getArr(mLocal).map(pr => pr.id === p.id ? { ...pr, status: 'answered' } : pr))} 
                                              className="px-3 py-2 bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-[11px] font-black transition-all whitespace-nowrap"
                                           >
                                              응답 완료
                                           </button>
                                        </div>
                                     </div>
                                  ))}
                               </div>

                               <button 
                                  onClick={() => { 
                                    setMLocal([...getArr(mLocal), { id: Date.now(), text: '', status: 'praying' }]); 
                                    updateDay({ checks: { ...(currDay.checks || {}), '기도하기': true } }); 
                                  }}
                                  className={`w-full py-3.5 rounded-2xl border-2 border-dashed ${t.border} text-[13px] font-black ${t.primaryText} hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-1 flex items-center justify-center gap-1.5`}
                               >
                                  + 새로운 기도제목 추가
                                </button>
                            </div>

                            {getArr(mLocal).filter(p=>p.status==='answered').length > 0 && (
                               <div className="flex flex-col gap-3 pt-4 border-t border-[#E5E5EA] dark:border-[#38383A]">
                                  <span className="text-[13.5px] font-black text-[#34C759] px-1 shrink-0 whitespace-nowrap">응답 받은 기도 ({getArr(mLocal).filter(p=>p.status==='answered').length})</span>
                                  <div className="flex flex-col gap-2.5">
                                     {getArr(mLocal).filter(p=>p.status==='answered').map(p => (
                                        <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.bgElevated} border ${t.border} opacity-80`}>
                                           <span className={`flex-1 min-w-0 text-[13.5px] font-medium text-[#34C759] line-through decoration-1 break-keep`}>
                                              ✔ {p.text}
                                           </span>
                                           <button 
                                              onClick={() => setMLocal(getArr(mLocal).filter(pr => pr.id !== p.id))} 
                                              className="text-[11px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-3 py-2 rounded-xl hover:bg-[#FF3B30]/20 transition-colors shrink-0 whitespace-nowrap"
                                           >
                                              삭제
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                    )}

                    {modal.type === 'globalIntercession' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                         <div className={`flex justify-between items-center px-4 md:px-6 py-4 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <div className="flex items-center gap-1.5 shrink-0">
                               <span className="text-[#34C759]"><IconPray className="w-5 h-5" /></span>
                               <h2 className={`text-[17px] font-black tracking-tight ${t.textMain} whitespace-nowrap`}>이웃 중보기도</h2>
                            </div>
                            <div className="flex gap-2 shrink-0">
                               <button onClick={() => { const txt = getArr(mLocal).filter(p=>p.status==='praying').map((p,i)=>`${i+1}. ${p.text}`).join('\n'); navigator.clipboard.writeText(txt); alert("중보기도가 복사되었습니다."); }} className={`${t.btnSecondary} px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap`}>복사</button>
                               <button onClick={closeModal} className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap`}>닫기</button>
                            </div>
                         </div>

                         <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 hide-scrollbar">
                            <div className="flex flex-col gap-3">
                               <div className="flex justify-between items-center px-1 shrink-0">
                                  <span className={`text-[13.5px] font-black text-[#34C759] whitespace-nowrap`}>중보 중인 제목 ({getArr(mLocal).filter(p=>p.status==='praying').length})</span>
                               </div>

                               <div className="flex flex-col gap-3">
                                  {getArr(mLocal).filter(p=>p.status==='praying').map(p => (
                                     <div key={p.id} className={`flex gap-3 items-center p-3 rounded-2xl ${t.cardBg} border ${t.border} shadow-sm transition-all`}>
                                        <textarea 
                                           value={p.text || ''} 
                                           onChange={(e) => setMLocal(getArr(mLocal).map(pr => pr.id === p.id ? { ...pr, text: e.target.value } : pr))} 
                                           onInput={handleAutoResize} 
                                           onPointerDown={e => e.stopPropagation()}
                                           placeholder="중보기도 제목을 입력하세요..."
                                           className={`flex-1 min-w-0 bg-transparent text-[14px] font-medium ${t.textMain} outline-none resize-none overflow-hidden leading-[1.6] min-h-[44px]`} 
                                        />
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                           <button 
                                              onClick={() => setMLocal(getArr(mLocal).map(pr => pr.id === p.id ? { ...pr, status: 'answered' } : pr))} 
                                              className="px-3 py-2 bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl text-[11px] font-black transition-transform active:scale-95 whitespace-nowrap"
                                           >
                                              응답 완료
                                           </button>
                                        </div>
                                     </div>
                                  ))}
                               </div>

                               <button 
                                  onClick={() => { 
                                    setMLocal([...getArr(mLocal), { id: Date.now(), text: '', status: 'praying' }]); 
                                    updateDay({ checks: { ...(currDay.checks || {}), '기도하기': true } }); 
                                  }}
                                  className={`w-full py-3.5 rounded-2xl border-2 border-dashed ${t.border} text-[13px] font-black text-[#34C759] hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-1 flex items-center justify-center gap-1.5`}
                               >
                                  + 새로운 중보기도 추가
                               </button>
                            </div>

                            {getArr(mLocal).filter(p=>p.status==='answered').length > 0 && (
                               <div className="flex flex-col gap-3 pt-4 border-t border-[#E5E5EA] dark:border-[#38383A]">
                                  <span className="text-[13.5px] font-black text-[#007AFF] px-1 shrink-0 whitespace-nowrap">응답 받은 중보기도 ({getArr(mLocal).filter(p=>p.status==='answered').length})</span>
                                  <div className="flex flex-col gap-2.5">
                                     {getArr(mLocal).filter(p=>p.status==='answered').map(p => (
                                        <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.bgElevated} border ${t.border} opacity-80`}>
                                           <span className={`flex-1 min-w-0 text-[13.5px] font-medium text-[#007AFF] line-through decoration-1 break-keep`}>
                                              ✔ {p.text}
                                           </span>
                                           <button 
                                              onClick={() => setMLocal(getArr(mLocal).filter(pr => pr.id !== p.id))} 
                                              className="text-[11px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-3 py-2 rounded-xl hover:bg-[#FF3B30]/20 transition-colors shrink-0 whitespace-nowrap"
                                           >
                                              삭제
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                    )}

                    {modal.type === 'bibleChallenge' && (() => {
                       const startDate = readChallengeStart || getLocalToday();
                       const dDay = Math.ceil((new Date().getTime() - new Date(startDate).getTime()) / 86400000) + 1;
                       
                       return (
                         <div className="flex flex-col gap-4 p-5 pointer-events-auto">
                           <div className={`${t.cardBg} p-6 rounded-[28px] border ${t.border} text-center flex flex-col gap-3 shadow-sm`}>
                             <div className="flex items-center justify-center gap-3">
                                 <span className={`text-[13px] font-black ${t.textSub}`}>전체 통독 진행률</span>
                                 <div className={`flex items-center ${t.bgElevated} px-3 py-1.5 rounded-xl border ${t.border}`}>
                                     <span className={`text-[12px] font-black ${t.primaryText} mr-2`}>시작일</span>
                                     <input 
                                         type="date" 
                                         value={startDate} 
                                         onChange={(e) => { setReadChallengeStart(e.target.value); localStorage.setItem('readChallengeStart', e.target.value); }} 
                                         className={`bg-transparent text-[12px] font-black ${t.primaryText} outline-none cursor-pointer`}
                                     />
                                 </div>
                             </div>
                             <span className={`text-[20px] font-black ${t.primaryText} tracking-tight`}>D+{dDay > 0 ? dDay : 0}일 째</span>
                             <div className={`w-full ${t.bgElevated} rounded-full h-4 overflow-hidden shadow-inner border ${t.border} mt-2`}>
                                 <div className="bg-[#007AFF] h-full transition-all duration-700" style={{ width: `${bibleProgress}%` }}></div>
                             </div>
                             <div className={`flex justify-between text-[12px] font-bold ${t.textMain} px-1 mt-1`}>
                                 <span>완독: {readChapsCount}장</span>
                                 <span className={t.primaryText}>진행도 {bibleProgress}%</span>
                             </div>
                           </div>
                           
                           {getArr(bibles).map(b => {
                             const total = getArr(b.chapters).length; let read = 0; 
                             const chaps = getArr(b.chapters).map((verses, chIdx) => { 
                                 const chNum = chIdx + 1; 
                                 const isRead = getArr(verses).length > 0 && getArr(verses).every((_, vIdx) => readVerses[`${b.name}-${chNum}-${vIdx}`]); 
                                 if(isRead) read++; 
                                 return { chNum, isRead }; 
                             });
                             return (
                               <div key={b.name} className={`p-5 rounded-[24px] border ${read === total ? `border-[3px] border-[#007AFF] bg-[#007AFF]/5` : `${t.border} ${t.cardBg}`} shadow-sm text-left transition-all`}>
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className={`font-black ${t.textMain} text-[15px]`}>
                                         {getKoName(b.name)} <span className={`text-[12px] font-bold ${t.textSub} ml-1`}>({read}/{total})</span>
                                     </h4>
                                     {read === total && <span className={`text-[11px] font-black text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-lg`}>완독 🎉</span>}
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                     {chaps.map(c => ( 
                                         <div key={c.chNum} onClick={() => { setCurrentChapId(`${b.name}-${c.chNum}`); setBibleViewMode('read'); setActiveScreen('bible'); closeModal(); }} className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[13px] font-black border transition-all cursor-pointer ${c.isRead ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-md scale-105' : `${t.bgElevated} ${t.textMain} hover:bg-[#007AFF]/10 hover:text-[#007AFF] hover:border-[#007AFF]/30`}`}>
                                             {c.chNum}
                                         </div> 
                                     ))}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       );
                    })()}

                    {modal.type === 'bibleChapterSelect' && (() => {
                       const b = mLocal.book;
                       return (
                         <div className="flex flex-col gap-4 p-6 pointer-events-auto">
                           <h4 className={`font-black ${t.textMain} text-2xl tracking-tight mb-4 text-center`}>{getKoName(b.name)}</h4>
                           <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto hide-scrollbar p-1">
                             {getArr(b.chapters).map((_, i) => {
                                const isRead = readVerses[`${b.name}-${i+1}-0`];
                                return (
                                  <button key={i} onClick={() => { setCurrentChapId(`${b.name}-${i+1}`); setBibleViewMode('read'); setActiveScreen('bible'); closeModal(); }} className={`aspect-square rounded-[16px] text-[15px] font-black shadow-sm transition-all ${isRead ? `bg-[#007AFF] border-transparent text-white scale-105` : `${t.cardBg} ${t.textMain} border ${t.border} hover:border-[#007AFF] hover:text-[#007AFF]`}`}>{i+1}장</button>
                                )
                             })}
                           </div>
                         </div>
                       );
                    })()}

                    {modal.type === 'bibleNoteCreate' && (
                      <div className="flex flex-col gap-5 h-full p-5 pointer-events-auto">
                        <div className={`p-5 ${t.cardBg} rounded-[24px] border ${t.border} max-h-[200px] overflow-y-auto shadow-sm`}>
                            <h4 className={`font-black ${t.textMain} mb-3 text-[14px]`}>선택한 말씀</h4>
                            {getArr(mLocal.verses).map((v, i) => <p key={i} className={`text-[15px] ${t.textMain} mb-2 leading-relaxed font-medium`}><span className={`font-black ${t.primaryText} mr-2`}>{v.ref}</span> {v.text}</p>)}
                        </div>
                        <div className="flex-1 flex flex-col">
                            <h4 className={`font-black ${t.textMain} mb-3 text-[14px] px-1`}>말씀 묵상과 나눔</h4>
                            <textarea value={mLocal.note||''} onChange={(e)=>setMLocal({...mLocal, note: e.target.value})} className={`w-full flex-1 p-5 rounded-[24px] ${t.bgInput} ${t.textMain} border ${t.border} outline-none resize-none leading-[1.8] font-bold text-[15px] shadow-inner focus:border-[#007AFF] transition-colors placeholder:text-[#A8A29A]`} placeholder="이 말씀을 통해 깨달은 은혜와 묵상을 자유롭게 기록하세요..." onPointerDown={e => e.stopPropagation()} />
                        </div>
                      </div>
                    )}

                    {modal.type === 'bibleNoteList' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50 pointer-events-auto`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>기록된 말씀 노트</h2>
                            <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 relative pb-32">
                            {getArr([mLocal].flat()).map(n => (
                              <div key={n.id} className={`w-full max-w-2xl mx-auto mb-6`}>
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <span className={`text-[13px] ${t.textSub} font-bold`}>{n.date} 작성</span>
                                    <div className="flex gap-3">
                                        <button className={`${t.primaryText} text-[13px] font-bold hover:opacity-80`}>수정</button>
                                        <button onClick={() => { if(window.confirm('삭제하시겠습니까?')) { setBibleNotes(prev => getArr(prev).filter(x => x.id !== n.id)); closeModal(); } }} className={`text-[#FF3B30] text-[13px] font-bold hover:opacity-80`}>삭제</button>
                                    </div>
                                </div>
                                <div className={`${t.cardBg} rounded-[24px] border ${t.border} p-6 mb-4 shadow-sm`}>
                                    {getArr(n.verses).map((v, i) => (
                                        <p key={i} className={`mb-3 last:mb-0 text-[16px] leading-[1.8] ${t.textMain} font-medium`}>
                                            <span className={`font-black ${t.primaryText} mr-3`}>{v.ref}</span>{v.text}
                                        </p>
                                    ))}
                                </div>
                                <div className={`px-2 py-4 rounded-[24px] ${t.cardBg} border ${t.border} p-6 shadow-sm`}>
                                    <p className={`text-[16px] leading-[2.0] ${t.textMain} font-bold whitespace-pre-wrap break-keep note-lines p-2`}>{n.note}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {modal.type === 'pipelineGuide' && (
                      <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border} transition-transform`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                            <div className="flex items-center gap-2">
                               <span className="text-[18px]">🧭</span>
                               <h2 className={`text-[17px] font-black tracking-tight ${t.textMain}`}>앱 활용 가이드북</h2>
                            </div>
                            <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-full text-[13px] font-bold shadow-sm`}>닫기</button>
                        </div>
                      
                        <div className="flex-1 overflow-y-auto px-6 py-8 md:p-10 hide-scrollbar flex flex-col">
                            <p className={`text-[14.5px] font-bold ${t.textSub} mb-10 text-center leading-relaxed break-keep`}>
                               각 페이지가 어떻게 연결되어 나의 영적 성장을 돕는지<br/>한눈에 확인해보세요.
                            </p>

                            <div className="relative pl-8 md:pl-10">
                               <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-gradient-to-b from-[#0A84FF] via-[#AF52DE] to-[#34C759]"></div>

                               <div className="relative mb-12">
                                  <div className="absolute left-[-40px] md:left-[-48px] top-1 w-6 h-6 rounded-full bg-[#007AFF]/20 flex items-center justify-center border-2 border-[#007AFF]">
                                     <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]"></div>
                                  </div>
                                  <span className="text-[12px] font-black text-[#007AFF] tracking-widest uppercase mb-1.5 block">Step 1. Input</span>
                                  <h3 className={`text-[19px] font-black ${t.textMain} mb-3`}>일상의 기록</h3>
                                  <p className={`text-[14.5px] font-medium ${t.textSub} leading-[1.7] break-keep`}>매일 아침 묵상과 주일 설교를 기록합니다. 이 데이터는 나의 영적 데이터베이스에 자동으로 축적됩니다.</p>
                                </div>

                               <div className="relative mb-12">
                                  <div className="absolute left-[-40px] md:left-[-48px] top-1 w-6 h-6 rounded-full bg-[#AF52DE]/20 flex items-center justify-center border-2 border-[#AF52DE]">
                                     <div className="w-2.5 h-2.5 rounded-full bg-[#AF52DE]"></div>
                                  </div>
                                  <span className="text-[12px] font-black text-[#AF52DE] tracking-widest uppercase mb-1.5 block">Step 2. Analyze</span>
                                  <h3 className={`text-[19px] font-black ${t.textMain} mb-3`}>심층 묵상과 통찰</h3>
                                  <p className={`text-[14.5px] font-medium ${t.textSub} leading-[1.7] break-keep`}>기록된 노트를 바탕으로 핵심 인용구와 참조 구절을 입체적으로 분석하며, 내가 어느 말씀에 집중해 왔는지 진단합니다.</p>
                               </div>

                               <div className="relative mb-12">
                                  <div className="absolute left-[-40px] md:left-[-48px] top-1 w-6 h-6 rounded-full bg-[#34C759]/20 flex items-center justify-center border-2 border-[#34C759]">
                                     <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]"></div>
                                  </div>
                                  <span className="text-[12px] font-black text-[#34C759] tracking-widest uppercase mb-1.5 block">Step 3. Apply</span>
                                  <h3 className={`text-[19px] font-black ${t.textMain} mb-3`}>삶의 훈련과 트래킹</h3>
                                  <p className={`text-[14.5px] font-medium ${t.textSub} leading-[1.7] break-keep`}>도출된 적용 질문들을 삶의 현장에 맞게 실천 과제로 바꾸고 완료 여부를 체크하며 영적 성장의 궤적을 확인합니다.</p>
                               </div>

                               <div className="relative">
                                  <div className="absolute left-[-40px] md:left-[-48px] top-1 w-6 h-6 rounded-full bg-[#FF9500]/20 flex items-center justify-center border-2 border-[#FF9500]">
                                     <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]"></div>
                                  </div>
                                  <span className="text-[12px] font-black text-[#FF9500] tracking-widest uppercase mb-1.5 block">Step 4. Share</span>
                                  <h3 className={`text-[19px] font-black ${t.textMain} mb-3`}>공동체 나눔과 확장</h3>
                                  <p className={`text-[14.5px] font-medium ${t.textSub} leading-[1.7] break-keep`}>혼자만의 묵상에 갇히지 않고, 내가 실천했던 항목과 은혜를 목장 모임에 나누어 선순환을 만듭니다.</p>
                               </div>
                            </div>

                            <div className={`mt-14 p-5 rounded-[24px] ${t.bgElevated} border ${t.border} text-center`}>
                               <p className={`text-[14px] font-black ${t.textMain}`}>기록이 모여 훈련이 되고, <br className="sm:hidden"/>훈련이 삶의 예배가 됩니다.</p>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <RadioPopup supabase={supabase} isAdmin={authUser?.role === 'admin'} />

          {/* 원스트림 글로벌 사이드시트 Drawer */}
          {globalDrawer && globalDrawer.isOpen && (
            <div className="fixed inset-0 z-[400] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in pointer-events-auto">
              <div className={`w-full max-w-[480px] h-full shadow-2xl flex flex-col border-l transition-transform ${isDarkMode ? 'bg-[#121316] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                  <span className="font-black text-[15px]">
                    {globalDrawer.type === 'prayerBox' ? '🕊️ 나의 기도 보관함 (원스트림)' : '🌳 적용 질문 트래커 (원스트림)'}
                  </span>
                  <button onClick={closeGlobalDrawer} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  {globalDrawer.type === 'prayerBox' && (
                    <PrayerBox t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={false} setIsSidebarOpen={() => {}} SubPageHeader={SubPageHeader} globalPrayers={globalPrayers} globalIntercessions={globalIntercessions} openModal={openModal} getArr={getArr} authUser={authUser} />
                  )}
                  {globalDrawer.type === 'applyTracker' && (
                    <ApplyTracker t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} isSidebarOpen={false} setIsSidebarOpen={() => {}} SubPageHeader={SubPageHeader} getArr={getArr} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppErrorBoundary>
  );
}
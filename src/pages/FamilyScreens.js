import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const StrokeWidth = "1.8";
const IconGroup = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconPray = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9M16.5 14v4M7 10l3 3-2 2-3-3M3 14l3 3M14 6l3 3-2 2-3-3" /></svg>;
const IconSmile = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
const IconCollection = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="8 6 21 6 21 21 8 21 8 6" /><polyline points="8 12 21 12" /><line x1="3" y1="12" x2="3" y2="12" /><line x1="3" y1="6" x2="3" y2="6" /><line x1="3" y1="18" x2="3" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>;

// 성경 약어 매핑 사전
const BIBLE_ABBR_MAP = {
  "창": "Genesis", "창세기": "Genesis", "출": "Exodus", "출애굽기": "Exodus",
  "레": "Leviticus", "레위기": "Leviticus", "민": "Numbers", "민수기": "Numbers",
  "신": "Deuteronomy", "신명기": "Deuteronomy", "수": "Joshua", "여호수아": "Joshua",
  "삿": "Judges", "사사기": "Judges", "룻": "Ruth", "룻기": "Ruth",
  "삼상": "1 Samuel", "삼하": "2 Samuel", "왕상": "1 Kings", "왕하": "2 Kings",
  "대상": "1 Chronicles", "대하": "2 Chronicles", "스": "Ezra", "느": "Nehemiah",
  "에": "Esther", "욥": "Job", "시": "Psalms", "시편": "Psalms", "잠": "Proverbs", "잠언": "Proverbs",
  "전": "Ecclesiastes", "아": "Song of Solomon", "사": "Isaiah", "이사야": "Isaiah",
  "렘": "Jeremiah", "애": "Lamentations", "겔": "Ezekiel", "단": "Daniel",
  "호": "Hosea", "욜": "Joel", "암": "Amos", "옵": "Obadiah", "욘": "Jonah",
  "미": "Micah", "나": "Nahum", "합": "Habakkuk", "습": "Zephaniah", "학": "Haggai",
  "슥": "Zechariah", "말": "Malachi",
  "마": "Matthew", "마태": "Matthew", "마태복음": "Matthew", "막": "Mark", "마가": "Mark",
  "눅": "Luke", "누가": "Luke", "요": "John", "요한": "John", "요한복음": "John",
  "행": "Acts", "사도행전": "Acts", "롬": "Romans", "로마서": "Romans",
  "고전": "1 Corinthians", "고후": "2 Corinthians", "갈": "Galatians", "갈라디아서": "Galatians",
  "엡": "Ephesians", "에베소서": "Ephesians", "빌": "Philippians", "빌립보서": "Philippians",
  "골": "Colossians", "골로새서": "Colossians", "살전": "1 Thessalonians", "살후": "2 Thessalonians",
  "딤전": "1 Timothy", "딤후": "2 Timothy", "딛": "Titus", "몬": "Philemon",
  "히": "Hebrews", "히브리서": "Hebrews", "약": "James", "야고보서": "James",
  "벧전": "1 Peter", "벧후": "2 Peter", "요일": "1 John", "유": "Jude", "계": "Revelation", "요한계시록": "Revelation"
};

const BIBLE_KO_NAMES = {
  "Genesis": "창세기", "Exodus": "출애굽기", "Leviticus": "레위기", "Numbers": "민수기",
  "Deuteronomy": "신명기", "Joshua": "여호수아", "Judges": "사사기", "Ruth": "룻기",
  "1 Samuel": "사무엘상", "2 Samuel": "사무엘하", "1 Kings": "열왕기상", "2 Kings": "열왕기하",
  "1 Chronicles": "역대상", "2 Chronicles": "역대하", "Ezra": "에스라", "Nehemiah": "느헤미야",
  "Esther": "에스더", "Job": "욥기", "Psalms": "시편", "Proverbs": "잠언",
  "Ecclesiastes": "전도서", "Song of Solomon": "아가", "Isaiah": "이사야", "Jeremiah": "예레미야",
  "Lamentations": "예레미야애가", "Ezekiel": "에스겔", "Daniel": "다니엘", "Hosea": "호세아",
  "Joel": "요엘", "Amos": "아모스", "Obadiah": "오바댜", "Jonah": "요나", "Micah": "미가",
  "Nahum": "나훔", "Habakkuk": "하박국", "Zephaniah": "스바냐", "Haggai": "학개",
  "Zechariah": "스가랴", "Malachi": "말라기", "Matthew": "마태복음", "Mark": "마가복음",
  "Luke": "누가복음", "John": "요한복음", "Acts": "사도행전", "Romans": "로마서",
  "1 Corinthians": "고린도전서", "2 Corinthians": "고린도후서", "Galatians": "갈라디아서",
  "Ephesians": "에베소서", "Philippians": "빌립보서", "Colossians": "골로새서",
  "1 Thessalonians": "데살로니가전서", "2 Thessalonians": "데살로니가후서",
  "1 Timothy": "디모데전서", "2 Timothy": "디모데후서", "Titus": "디도서",
  "Philemon": "빌레몬서", "Hebrews": "히브리서", "James": "야고보서",
  "1 Peter": "베드로전서", "2 Peter": "베드로후서", "1 John": "요한일서",
  "2 John": "요한이서", "3 John": "요한삼서", "Jude": "유다서", "Revelation": "요한계시록"
};

export default function FamilyScreens({
  activeScreen, t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, SubPageHeader,
  familyRoomPw, setFamilyRoomPw, currDay, updateDay, formatFamVerse,
  familyPublicData, setFamilyPublicData, handleAutoResize, triggerConfetti,
  familyRoomData, handleUpdateFamily, openModal, logUserAction, authUser,
  date, setDate, bibles
}) {
  const getArr = useCallback((val, def = []) => Array.isArray(val) ? val : def, []);
  if (!SubPageHeader) return <div className="p-4 font-bold text-red-500 text-sm">Header Loading Error</div>;

  const isDark = isDarkMode || t?.appBg?.includes('dark') || t?.appBg?.includes('121212');
  const [actionToast, setActionToast] = useState(null);
  const safeDate = date || (currDay?.date || new Date().toISOString().split('T')[0]);

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  };

  const ui = {
    bgBody: isDark ? 'bg-[#090A0F]' : 'bg-[#F4F5F7]',
    bgCard: isDark ? 'bg-[#151821] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900',
    bgInput: isDark ? 'bg-[#0D0F14] border-white/10 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500',
    border: isDark ? 'border-white/10' : 'border-slate-200/80',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-500',
    btnPrimary: isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-black text-white',
    btnSecondary: isDark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
  };

  // 날짜별 공개 가정예배 데이터 관리
  const [daySpecificData, setDaySpecificData] = useState(() => {
    try {
      const saved = localStorage.getItem(`family_public_${safeDate}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      attendees: '',
      wordMeditation: '',
      thanks: [],
      prayers: [],
      goodDeeds: []
    };
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`family_public_${safeDate}`);
      if (saved) {
        setDaySpecificData(JSON.parse(saved));
      } else {
        setDaySpecificData({
          attendees: '',
          wordMeditation: '',
          thanks: [],
          prayers: [],
          goodDeeds: []
        });
      }
    } catch (e) {}
  }, [safeDate]);

  const saveSpecificData = useCallback((updater) => {
    setDaySpecificData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`family_public_${safeDate}`, JSON.stringify(next));
      } catch (e) {}
      if (setFamilyPublicData) setFamilyPublicData(next);
      return next;
    });
  }, [safeDate, setFamilyPublicData]);

  // 🌟 [성경 구절 스페이스바 자동완성 핸들러]
  const handleWordKeyDown = (e, currentText, onUpdateText) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const cursorIdx = e.target.selectionStart;
      const textBefore = currentText.substring(0, cursorIdx);
      const match = textBefore.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(\d+)(?:절)?(?:\s?(?:~|-)\s?(\d+)(?:절)?)?$/);

      if (match && bibles) {
        const bookRaw = match[1];
        const chNum = parseInt(match[2]);
        const vStart = parseInt(match[3]);
        const vEnd = match[4] ? parseInt(match[4]) : vStart;

        const engBook = BIBLE_ABBR_MAP[bookRaw] || bookRaw;
        const bookData = getArr(bibles).find(b => b.name === engBook || b.name.toLowerCase() === engBook.toLowerCase());

        if (bookData && bookData.chapters && bookData.chapters[chNum - 1]) {
          const chVerses = bookData.chapters[chNum - 1];
          let pulledText = `\n📖 [${BIBLE_KO_NAMES[engBook] || bookRaw} ${chNum}:${vStart}${vEnd !== vStart ? '~' + vEnd : ''}]\n`;
          let foundAny = false;

          for (let v = vStart; v <= vEnd; v++) {
            if (chVerses[v - 1]) {
              const cleaned = String(chVerses[v - 1]).replace(/|'|\x1B|\(가정\d*\)|\(개인\d*\)|\(개인\)/gi, '').trim();
              pulledText += `${v}절. ${cleaned}\n`;
              foundAny = true;
            }
          }

          if (foundAny) {
            e.preventDefault();
            const textAfter = currentText.substring(cursorIdx);
            const replacedBefore = textBefore.substring(0, textBefore.length - match[0].length);
            const finalText = replacedBefore + pulledText + '\n' + textAfter;
            onUpdateText(finalText);
            showToast("✨ 성경 본문 구절이 자동으로 채워졌습니다!");
          }
        }
      }
    }
  };

  // 🌟 [감사 연동 1: 나의 감사일기로 전송]
  const handleSendThanksToDiary = (text) => {
    if (!text || !text.trim()) return alert("전송할 감사 내용이 없습니다.");
    try {
      const qtDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const todayRec = qtDaily[safeDate] || {};
      const prevThanks = todayRec.thanksText || '';
      const updatedThanks = prevThanks ? `${prevThanks}\n- [가정예배 감사] ${text.trim()}` : `1. [가정예배 감사] ${text.trim()}`;
      
      const nextDaily = {
        ...qtDaily,
        [safeDate]: {
          ...todayRec,
          thanksText: updatedThanks,
          checks: { ...(todayRec.checks || {}), '감사': true }
        }
      };
      localStorage.setItem('qt_daily', JSON.stringify(nextDaily));
      if (updateDay) updateDay({ thanksText: updatedThanks, checks: { ...(currDay?.checks || {}), '감사': true } });
      showToast("💖 [나의 감사일기]로 감사가 성공적으로 등록되었습니다!");
    } catch (e) {
      showToast("감사일기 연동 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [감사 연동 2: 목장 나눔으로 전송]
  const handleSendThanksToCell = (text) => {
    if (!text || !text.trim()) return alert("전송할 감사 내용이 없습니다.");
    try {
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curSubs = Array.isArray(cellData.submissions) ? [...cellData.submissions] : [];
      const uName = authUser?.name || '가족 식구';
      curSubs.push({
        id: Date.now(),
        name: uName,
        type: '감사',
        content: `[가정예배 감사] ${text.trim()}`,
        date: safeDate
      });
      const nextCellData = { ...cellData, submissions: curSubs };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
      if (supabase && authUser?.group) {
        supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
      }
      showToast("👥 목장 나눔에 감사가 전송되었습니다!");
    } catch (e) {
      showToast("목장 전송 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [기도 연동 1: 나의 기도 보관함으로 전송]
  const handleSendPrayerToBox = (text) => {
    if (!text || !text.trim()) return alert("전송할 기도제목이 없습니다.");
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_family_${Date.now()}`,
        title: `[가정예배 기도]`,
        content: text.trim(),
        date: safeDate,
        status: 'praying'
      };
      localStorage.setItem('prayer_items', JSON.stringify([newPrayer, ...prayers]));
      if (updateDay) updateDay({ checks: { ...(currDay?.checks || {}), '기도하기': true } });
      showToast("🙏 [나의 기도함]에 저장되고 기도 체크가 완료되었습니다!");
    } catch (e) {
      showToast("기도함 저장 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [기도 연동 2: 목장 모임 식구 기도로 전송]
  const handleSendPrayerToCell = (text) => {
    if (!text || !text.trim()) return alert("전송할 기도제목이 없습니다.");
    try {
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];
      const uName = authUser?.name || '가족 식구';
      curPrayers.push({
        id: Date.now(),
        name: uName,
        text: `[가정예배 기도] ${text.trim()}`,
        status: 'praying'
      });
      const nextCellData = { ...cellData, groupPrayers: curPrayers };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
      if (supabase && authUser?.group) {
        supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
      }
      showToast("⛪ 목장 모임 중보기도 목록으로 전송되었습니다!");
    } catch (e) {
      showToast("목장 전송 중 오류가 발생했습니다.");
    }
  };

  switch (activeScreen) {
    case 'familySelect':
      return (
        <div className={`flex-1 flex flex-col h-full ${ui.bgBody} animate-fade-in relative font-sans select-none overflow-hidden`}>
          <div className={`relative z-10 border-b ${ui.border}`}>
            <SubPageHeader title="가정 예배 선택" onBack={() => setActiveScreen('fiveSetMenu')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg">
              <div 
                onClick={() => setActiveScreen('familyPublic')} 
                className={`${ui.bgCard} p-5 rounded-2xl border cursor-pointer hover:border-indigo-400 active:scale-[0.99] transition-all shadow-sm flex flex-col items-center text-center`}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                  <IconGroup />
                </div>
                <h3 className="text-[15px] font-black tracking-tight mb-1">공개 가정예배</h3>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                  날짜별 캘린더 연동 및 자유롭게 열고 기록하는 모임 공간
                </p>
                <span className="mt-3.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                  바로 입장하기 →
                </span>
              </div>

              <div 
                onClick={() => setActiveScreen('familyPrivateLogin')} 
                className={`${ui.bgCard} p-5 rounded-2xl border cursor-pointer hover:border-indigo-400 active:scale-[0.99] transition-all shadow-sm flex flex-col items-center text-center`}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <IconLock />
                </div>
                <h3 className="text-[15px] font-black tracking-tight mb-1">우리 가족 예배실</h3>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                  가족 전용 비밀번호를 통해 동기화되는 프라이빗 공간
                </p>
                <span className="mt-3.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                  비밀번호 입력 →
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'familyPrivateLogin':
      return (
        <div className={`flex-1 flex flex-col h-full ${ui.bgBody} animate-fade-in relative font-sans select-none overflow-hidden`}>
          <div className={`relative z-10 border-b ${ui.border}`}>
            <SubPageHeader title="우리 가족 예배실 입장" onBack={() => setActiveScreen('familySelect')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 relative z-10">
            <div className={`${ui.bgCard} p-6 rounded-2xl border w-full max-w-xs flex flex-col gap-4 shadow-sm`}>
              <div className="w-11 h-11 mx-auto rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <IconLock />
              </div>
              <div className="text-center">
                <h2 className="text-[15px] font-black tracking-tight">가족 비밀번호 입력</h2>
                <p className="text-[11.5px] text-slate-400 mt-0.5">우리 가족만의 예배방 비밀번호를 입력해주세요.</p>
              </div>
              <input 
                type="password" 
                placeholder="비밀번호..." 
                value={familyRoomPw || ''} 
                onChange={(e) => setFamilyRoomPw && setFamilyRoomPw(e.target.value)} 
                className={`w-full py-2.5 px-3 rounded-xl text-[14px] font-bold text-center tracking-widest outline-none border ${ui.bgInput}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (familyRoomPw) setActiveScreen('familyPrivate');
                    else alert("비밀번호를 입력해주세요.");
                  }
                }}
                autoFocus
              />
              <button 
                onClick={() => { 
                  if (familyRoomPw) setActiveScreen('familyPrivate'); 
                  else alert("비밀번호를 입력해주세요."); 
                }} 
                className={`w-full py-2.5 rounded-xl font-black text-[13px] shadow-sm active:scale-95 transition-all cursor-pointer ${ui.btnPrimary}`}
              >
                예배실 입장
              </button>
            </div>
          </div>
        </div>
      );

    case 'familyPublic':
    case 'familyPrivate': {
      const isPriv = activeScreen === 'familyPrivate';
      const safeData = isPriv ? (familyRoomData || {}) : (daySpecificData || {});
      const updateData = isPriv ? handleUpdateFamily : saveSpecificData;
      const safeFamVerse = formatFamVerse || { text: '말씀을 불러오는 중입니다...', ref: '' };

      const thanksList = getArr(safeData.thanks);
      const prayerList = getArr(safeData.prayers);
      const deedList = getArr(safeData.goodDeeds);

      const addItem = (key, text = '') => {
        updateData((p) => ({
          ...p,
          [key]: [{ id: Date.now(), text, date: safeDate }, ...getArr(p[key])]
        }));
      };

      const updateItemText = (key, id, val) => {
        updateData((p) => ({
          ...p,
          [key]: getArr(p[key]).map((item) => (typeof item === 'object' && item.id === id ? { ...item, text: val } : item))
        }));
      };

      const removeItem = (key, id) => {
        updateData((p) => ({
          ...p,
          [key]: getArr(p[key]).filter((item) => (typeof item === 'object' ? item.id !== id : true))
        }));
      };

      const handleOpenHistorySafely = () => {
        try {
          const rawHistory = JSON.parse(localStorage.getItem('familyHistory') || '[]');
          const sanitized = getArr(rawHistory).map((rec) => {
            const dataObj = rec?.data || {};
            const formatArray = (arr) => {
              if (Array.isArray(arr)) {
                return arr.map((item) => (typeof item === 'object' ? (item.text || '') : String(item))).filter(Boolean);
              }
              if (typeof arr === 'string' && arr.trim()) return [arr.trim()];
              return [];
            };
            return {
              id: rec.id || Date.now(),
              date: rec.date || '날짜 미상',
              data: {
                attendees: dataObj.attendees || '미입력',
                wordMeditation: dataObj.wordMeditation || '기록 없음',
                thanks: formatArray(dataObj.thanks),
                prayers: formatArray(dataObj.prayers),
                goodDeeds: formatArray(dataObj.goodDeeds)
              }
            };
          });

          if (openModal) {
            openModal('familyHistory', sanitized);
          }
        } catch (err) {
          alert("이력을 불러오는 중 오류가 발생했습니다.");
        }
      };

      const handleExecuteComplete = () => {
        if (!window.confirm("오늘의 가정예배를 완료하시겠습니까?\n작성된 내용이 안전하게 이력으로 저장되고 영적 5종 세트에 반영됩니다.")) return;
        
        try {
          const newRecord = {
            id: Date.now(),
            date: safeDate,
            data: {
              attendees: safeData.attendees || '가족 일동',
              wordMeditation: safeData.wordMeditation || '',
              thanks: thanksList.map(t => (typeof t === 'object' ? t.text : String(t))).filter(Boolean),
              prayers: prayerList.map(p => (typeof p === 'object' ? p.text : String(p))).filter(Boolean),
              goodDeeds: deedList.map(g => (typeof g === 'object' ? g.text : String(g))).filter(Boolean)
            }
          };

          const existingHistory = JSON.parse(localStorage.getItem('familyHistory') || '[]');
          const updatedHistory = [newRecord, ...getArr(existingHistory)];
          localStorage.setItem('familyHistory', JSON.stringify(updatedHistory));

          if (updateDay) {
            updateDay({
              checks: { ...(currDay?.checks || {}), '가정예배': true }
            });
          }

          if (triggerConfetti) triggerConfetti();
          if (logUserAction && authUser?.name) {
            logUserAction(authUser.name, '가정예배', 'write', `[가정예배 완료] 참석자: ${safeData.attendees || '가족 일동'}`);
          }

          showToast("🎉 오늘의 가정예배가 성공적으로 완료 및 저장되었습니다!");
        } catch (e) {
          alert("완료 처리 중 오류가 발생했습니다.");
        }
      };

      return (
        <div className={`flex-1 flex flex-col h-full ${ui.bgBody} animate-fade-in relative font-sans select-none overflow-hidden`}>
          
          {actionToast && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-lg border border-white/20 animate-fade-in flex items-center gap-1.5 pointer-events-none">
              <span className="text-amber-400">✨</span> {actionToast}
            </div>
          )}

          {/* 고정 상단 헤더 & 캘린더 네비게이터 */}
          <div className={`shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b ${ui.border} bg-white/80 dark:bg-[#12141A]/80 backdrop-blur-md z-20`}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveScreen('familySelect')}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 cursor-pointer"
              >
                ←
              </button>
              <span className="text-[14.5px] font-black tracking-tight">
                {isPriv ? "우리 가족 예배실" : "가정예배 나눔"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 cursor-pointer">
                <IconCalendar />
                <input 
                  type="date" 
                  value={safeDate} 
                  onChange={(e) => {
                    if (setDate) setDate(e.target.value);
                  }} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                />
                <span className="text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200">
                  {safeDate}
                </span>
              </div>

              <button 
                onClick={handleOpenHistorySafely}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold flex items-center gap-1 cursor-pointer transition-all ${ui.btnSecondary}`}
              >
                <IconCollection /> 이력
              </button>
            </div>
          </div>

          {/* 메인 예배 작성 캔버스 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 hide-scrollbar">
            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              
              {/* 오늘의 말씀 컴팩트 카드 */}
              <div className={`p-4 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs text-center flex flex-col items-center justify-center relative overflow-hidden`}>
                <span className="text-[10.5px] font-bold text-amber-500 dark:text-amber-400 tracking-wider uppercase mb-1">
                  오늘의 가정예배 말씀
                </span>
                <p className="text-[15px] font-bold leading-relaxed text-slate-900 dark:text-white break-keep max-w-xl">
                  "{safeFamVerse.text}"
                </p>
                <span className="text-[11.5px] font-bold text-slate-400 mt-1 font-mono">
                  {safeFamVerse.ref}
                </span>
              </div>

              {/* 1-Click 오토풀링 (내 QT 묵상 자동 채우기) */}
              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-indigo-500"><IconSparkles /></span>
                  <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    오늘 아침 묵상한 QT 은혜를 말씀 나눔에 즉시 채웁니다
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let pulledQt = '';
                    try {
                      const qtDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
                      const todayRec = qtDaily[safeDate] || {};
                      pulledQt = todayRec.qtMeditation || todayRec.qtGraceLine || todayRec.qtApplication || '';
                    } catch(e) {}

                    if (!pulledQt) {
                      pulledQt = "오늘 하루도 주님의 말씀을 기준 삼아 가정 안에서 서로를 배려하고 사랑으로 품겠습니다.";
                    }

                    updateData(p => ({ ...p, wordMeditation: pulledQt }));
                    showToast("🌿 오늘의 QT 묵상이 채워졌습니다!");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  QT 불러오기
                </button>
              </div>

              {/* 참석자 입력창 */}
              <div className={`p-3.5 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs flex items-center gap-2.5`}>
                <span className="text-slate-400 shrink-0"><IconGroup /></span>
                <span className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 shrink-0">예배 참석자:</span>
                <input 
                  type="text" 
                  value={safeData.attendees || ''} 
                  onChange={(e) => updateData(p => ({ ...p, attendees: e.target.value }))} 
                  placeholder="예: 온 가족, 아빠, 엄마, 은우" 
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[13px] font-bold outline-none border ${ui.bgInput}`}
                />
              </div>

              {/* 말씀 묵상 나누기 (스페이스바 성경 구절 자동완성 적용) */}
              <div className={`p-3.5 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs flex flex-col gap-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <IconBook /> 말씀 묵상 나눔
                  </span>
                  <span className="text-[11px] text-slate-400">구절(예: 요3:16) 입력 후 스페이스바</span>
                </div>
                <textarea 
                  value={safeData.wordMeditation || ''} 
                  onChange={(e) => updateData(p => ({ ...p, wordMeditation: e.target.value }))} 
                  onKeyDown={(e) => handleWordKeyDown(e, safeData.wordMeditation || '', (txt) => updateData(p => ({ ...p, wordMeditation: txt })))}
                  placeholder="말씀을 읽고 가족과 나눈 은혜를 기록하세요. 성경 구절(예: 창1:1, 요3:16)을 입력하고 스페이스바를 누르면 본문이 자동 입력됩니다." 
                  rows={4} 
                  className={`w-full p-3 rounded-xl text-[13px] font-medium resize-none outline-none border leading-relaxed ${ui.bgInput}`}
                />
              </div>

              {/* 가족 감사 나눔 (QnA 형태 + 보내기 버튼 탑재) */}
              <div className={`p-3.5 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs flex flex-col gap-2.5`}>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] font-black flex items-center gap-1.5 text-rose-500">
                    <IconHeart /> 가족 감사 나눔 ({thanksList.length})
                  </span>
                  <button 
                    onClick={() => addItem('thanks')} 
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-[11px] font-black transition-colors cursor-pointer"
                  >
                    + 감사 추가
                  </button>
                </div>

                <div className="space-y-2.5">
                  {thanksList.length === 0 ? (
                    <div className="py-5 text-center text-slate-400 text-[12px]">
                      감사했던 일들을 한 줄씩 나눠보세요.
                    </div>
                  ) : (
                    thanksList.map((th, idx) => {
                      const id = typeof th === 'object' ? th.id : idx;
                      const text = typeof th === 'object' ? th.text : String(th);
                      return (
                        <div key={id} className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                          <div className="flex gap-2 items-center">
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                            <input 
                              type="text" 
                              value={text} 
                              onChange={(e) => updateItemText('thanks', id, e.target.value)} 
                              placeholder="오늘 감사했던 점..." 
                              className={`flex-1 py-1.5 px-3 rounded-xl text-[12.5px] font-medium outline-none border ${ui.bgInput}`}
                            />
                            <button 
                              onClick={() => removeItem('thanks', id)} 
                              className="text-slate-400 hover:text-rose-500 p-1.5 cursor-pointer text-xs"
                              title="삭제"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 🌟 감사 개별 보내기 버튼 */}
                          {text && text.trim() && (
                            <div className="flex justify-end gap-1.5 pl-6">
                              <button
                                onClick={() => handleSendThanksToDiary(text)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <IconShare /> 감사일기로
                              </button>
                              <button
                                onClick={() => handleSendThanksToCell(text)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <IconShare /> 목장으로
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 가족 기도 제목 (QnA 형태 + 보내기 버튼 탑재) */}
              <div className={`p-3.5 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs flex flex-col gap-2.5`}>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] font-black flex items-center gap-1.5 text-purple-500">
                    <IconPray /> 가족 기도 제목 ({prayerList.length})
                  </span>
                  <button 
                    onClick={() => addItem('prayers')} 
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white text-[11px] font-black transition-colors cursor-pointer"
                  >
                    + 기도 추가
                  </button>
                </div>

                <div className="space-y-2.5">
                  {prayerList.length === 0 ? (
                    <div className="py-5 text-center text-slate-400 text-[12px]">
                      가족을 위한 중보기도 제목을 기록하세요.
                    </div>
                  ) : (
                    prayerList.map((pr, idx) => {
                      const id = typeof pr === 'object' ? pr.id : idx;
                      const text = typeof pr === 'object' ? pr.text : String(pr);
                      return (
                        <div key={id} className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                          <div className="flex gap-2 items-center">
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                            <input 
                              type="text" 
                              value={text} 
                              onChange={(e) => updateItemText('prayers', id, e.target.value)} 
                              placeholder="함께 기도할 제목..." 
                              className={`flex-1 py-1.5 px-3 rounded-xl text-[12.5px] font-medium outline-none border ${ui.bgInput}`}
                            />
                            <button 
                              onClick={() => removeItem('prayers', id)} 
                              className="text-slate-400 hover:text-rose-500 p-1.5 cursor-pointer text-xs"
                              title="삭제"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 🌟 기도 개별 보내기 버튼 */}
                          {text && text.trim() && (
                            <div className="flex justify-end gap-1.5 pl-6">
                              <button
                                onClick={() => handleSendPrayerToBox(text)}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <IconShare /> 기도함으로
                              </button>
                              <button
                                onClick={() => handleSendPrayerToCell(text)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <IconShare /> 목장으로
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 가족 칭찬 릴레이 (프라이빗 전용) */}
              {isPriv && (
                <div className={`p-3.5 rounded-2xl border ${ui.border} ${ui.bgCard} shadow-xs flex flex-col gap-2.5`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[12.5px] font-black flex items-center gap-1.5 text-amber-500">
                      <IconSmile /> 서로 칭찬하고 축복하기
                    </span>
                    <button 
                      onClick={() => addItem('goodDeeds')} 
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white text-[11px] font-black transition-colors cursor-pointer"
                    >
                      + 칭찬 추가
                    </button>
                  </div>

                  <div className="space-y-2">
                    {deedList.length === 0 ? (
                      <div className="py-5 text-center text-slate-400 text-[12px]">
                        가족들에게 전할 따뜻한 칭찬 한마디를 적어보세요.
                      </div>
                    ) : (
                      deedList.map((gd, idx) => {
                        const id = typeof gd === 'object' ? gd.id : idx;
                        const text = typeof gd === 'object' ? gd.text : String(gd);
                        return (
                          <div key={id} className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={text} 
                              onChange={(e) => updateItemText('goodDeeds', id, e.target.value)} 
                              placeholder="누구에게 전하는 칭찬인가요?" 
                              className={`flex-1 py-1.5 px-3 rounded-xl text-[12.5px] font-medium outline-none border ${ui.bgInput}`}
                            />
                            <button 
                              onClick={() => removeItem('goodDeeds', id)} 
                              className="text-slate-400 hover:text-rose-500 p-1.5 cursor-pointer text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 하단 완료 및 저장 버튼 */}
              <div className="pt-2 pb-12 flex gap-2.5">
                <button 
                  onClick={handleExecuteComplete} 
                  className={`w-full py-3.5 rounded-xl font-black text-[13.5px] shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${ui.btnPrimary}`}
                >
                  <IconCheck /> 오늘의 가정예배 완료하기
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
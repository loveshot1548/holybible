// src/pages/FamilyScreens.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  Users
} from 'lucide-react';
import ChurchSketchIcon from '../components/ChurchSketchIcon';
import { supabase } from '../lib/supabase';

// =====================================================================
// 성경 약어 매핑 사전
// =====================================================================
const BIBLE_ABBR_MAP = {
  창: 'Genesis', 창세기: 'Genesis', 출: 'Exodus', 출애굽기: 'Exodus',
  레: 'Leviticus', 레위기: 'Leviticus', 민: 'Numbers', 민수기: 'Numbers',
  신: 'Deuteronomy', 신명기: 'Deuteronomy', 수: 'Joshua', 여호수아: 'Joshua',
  삿: 'Judges', 사사기: 'Judges', 룻: 'Ruth', 룻기: 'Ruth',
  삼상: '1 Samuel', 삼하: '2 Samuel', 왕상: '1 Kings', 왕하: '2 Kings',
  대상: '1 Chronicles', 대하: '2 Chronicles', 스: 'Ezra', 느: 'Nehemiah',
  에: 'Esther', 욥: 'Job', 시: 'Psalms', 시편: 'Psalms', 잠: 'Proverbs', 잠언: 'Proverbs',
  전: 'Ecclesiastes', 아: 'Song of Solomon', 사: 'Isaiah', 이사야: 'Isaiah',
  렘: 'Jeremiah', 애: 'Lamentations', 겔: 'Ezekiel', 단: 'Daniel',
  호: 'Hosea', 욜: 'Joel', 암: 'Amos', 옵: 'Obadiah', 욘: 'Jonah',
  미: 'Micah', 나: 'Nahum', 합: 'Habakkuk', 습: 'Zephaniah', 학: 'Haggai',
  슥: 'Zechariah', 말: 'Malachi',
  마: 'Matthew', 마태: 'Matthew', 마태복음: 'Matthew', 막: 'Mark', 마가: 'Mark',
  눅: 'Luke', 누가: 'Luke', 요: 'John', 요한: 'John', 요한복음: 'John',
  행: 'Acts', 사도행전: 'Acts', 롬: 'Romans', 로마서: 'Romans',
  고전: '1 Corinthians', 고후: '2 Corinthians', 갈: 'Galatians', 갈라디아서: 'Galatians',
  엡: 'Ephesians', 에베소서: 'Ephesians', 빌: 'Philippians', 빌립보서: 'Philippians',
  골: 'Colossians', 골로새서: 'Colossians', 살전: '1 Thessalonians', 살후: '2 Thessalonians',
  딤전: '1 Timothy', 딤후: '2 Timothy', 딛: 'Titus', 몬: 'Philemon',
  히: 'Hebrews', 히브리서: 'Hebrews', 약: 'James', 야고보서: 'James',
  벧전: '1 Peter', 벧후: '2 Peter', 요일: '1 John', 유: 'Jude', 계: 'Revelation', 요한계시록: 'Revelation'
};

const BIBLE_KO_NAMES = {
  Genesis: '창세기', Exodus: '출애굽기', Leviticus: '레위기', Numbers: '민수기',
  Deuteronomy: '신명기', Joshua: '여호수아', Judges: '사사기', Ruth: '룻기',
  '1 Samuel': '사무엘상', '2 Samuel': '사무엘하', '1 Kings': '열왕기상', '2 Kings': '열왕기하',
  '1 Chronicles': '역대상', '2 Chronicles': '역대하', Ezra: '에스라', Nehemiah: '느헤미야',
  Esther: '에스더', Job: '욥기', Psalms: '시편', Proverbs: '잠언',
  Ecclesiastes: '전도서', 'Song of Solomon': '아가', Isaiah: '이사야', Jeremiah: '예레미야',
  Lamentations: '예레미야애가', Ezekiel: '에스겔', Daniel: '다니엘', Hosea: '호세아',
  Joel: '요엘', Amos: '아모스', Obadiah: '오바댜', Jonah: '요나', Micah: '미가',
  Nahum: '나훔', Habakkuk: '하박국', Zephaniah: '스바냐', Haggai: '학개',
  Zechariah: '스가랴', Malachi: '말라기', Matthew: '마태복음', Mark: '마가복음',
  Luke: '누가복음', John: '요한복음', Acts: '사도행전', Romans: '로마서',
  '1 Corinthians': '고린도전서', '2 Corinthians': '고린도후서', Galatians: '갈라디아서',
  Ephesians: '에베소서', Philippians: '빌립보서', Colossians: '골로새서',
  '1 Thessalonians': '데살로니가전서', '2 Thessalonians': '데살로니가후서',
  '1 Timothy': '디모데전서', '2 Timothy': '디모데후서', Titus: '디도서',
  Philemon: '빌레몬서', Hebrews: '히브리서', James: '야고보서',
  '1 Peter': '베드로전서', '2 Peter': '베드로후서', '1 John': '요한일서',
  '2 John': '요한이서', '3 John': '요한삼서', Jude: '유다서', Revelation: '요한계시록'
};

const APOSTLES_CREED = `전능하사 천지를 만드신 하나님 아버지를 내가 믿사오며,
그 외아들 우리 주 예수 그리스도를 믿사오니,
이는 성령으로 잉태하사 동정녀 마리아에게 나시고,
본디오 빌라도에게 고난을 받으사, 십자가에 못 박혀 죽으시고,
장사한 지 사흘 만에 죽은 자 가운데서 다시 살아나시며,
하늘에 오르사, 전능하신 하나님 우편에 앉아 계시다가,
저리로서 산 자와 죽은 자를 심판하러 오시리라.
성령을 믿사오며, 거룩한 공회와,
성도가 서로 교통하는 것과,
죄를 사하여 주시는 것과,
몸이 다시 사는 것과,
영원히 사는 것을 믿사옵나이다. 아멘.`;

const LORDS_PRAYER = `하늘에 계신 우리 아버지여,
이름이 거룩히 여김을 받으시오며, 나라이 임하옵시며,
뜻이 하늘에서 이룬 것 같이 땅에서도 이루어지이다.
오늘날 우리에게 일용할 양식을 주옵시고,
우리가 우리에게 죄 지은 자를 사하여 준 것 같이
우리 죄를 사하여 주옵시고,
우리를 시험에 들게 하지 마옵시고, 다만 악에서 구하옵소서.
대개 나라와 권세와 영광이 아버지께 영원히 있사옵나이다. 아멘.`;

export default function FamilyScreens({
  activeScreen,
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  SubPageHeader,
  familyRoomPw,
  setFamilyRoomPw,
  currDay,
  updateDay,
  formatFamVerse,
  familyPublicData,
  setFamilyPublicData,
  familyRoomData,
  handleUpdateFamily,
  openModal,
  logUserAction,
  authUser,
  date,
  setDate,
  bibles
}) {
  const getArr = useCallback((val, def = []) => (Array.isArray(val) ? val : def), []);

  // iOS 야간 다크모드 자동 감지 + 앱 테마 100% 호환
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : systemDark;

  const [actionToast, setActionToast] = useState(null);
  const safeDate = date || currDay?.date || new Date().toISOString().split('T')[0];

  const [familyMode, setFamilyMode] = useState('form');
  const [liturgyStep, setLiturgyStep] = useState(1);

  // 온 가족 역할 분담 (직접 수정 및 저장 지원)
  const [familyRoles, setFamilyRoles] = useState(() => {
    try {
      const saved = localStorage.getItem('family_liturgy_roles_v1');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { leader: '아빠', prayer: '엄마', reader: '자녀', blessing: '온 가족' };
  });

  const handleUpdateRole = (roleKey, value) => {
    setFamilyRoles((prev) => {
      const next = { ...prev, [roleKey]: value };
      try {
        localStorage.setItem('family_liturgy_roles_v1', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2400);
  }, []);

  // 날짜별 공개 가정예배 데이터 관리
  const [daySpecificData, setDaySpecificData] = useState(() => {
    try {
      const saved = localStorage.getItem(`family_public_${safeDate}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] };
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`family_public_${safeDate}`);
      if (saved) {
        setDaySpecificData(JSON.parse(saved));
      } else {
        setDaySpecificData({ attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] });
      }
    } catch (_) {}
  }, [safeDate]);

  const saveSpecificData = useCallback(
    (updater) => {
      setDaySpecificData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem(`family_public_${safeDate}`, JSON.stringify(next));
        } catch (_) {}
        if (setFamilyPublicData) setFamilyPublicData(next);
        return next;
      });
    },
    [safeDate, setFamilyPublicData]
  );

  // 글로벌 SaaS 3색 조화 토큰
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const inputClass = isDark
    ? 'bg-[#20242E] border-[#262B36] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#2563EB]'
    : 'bg-[#F8F9FA] border-[#E5E8EC] text-[#191F28] placeholder:text-[#94A3B8] focus:border-[#2563EB]';

  if (!SubPageHeader) {
    return <div className="p-4 font-bold text-rose-500 text-sm">Header Loading Error</div>;
  }

  // 성경 구절 스페이스바 자동완성 핸들러
  const handleWordKeyDown = (e, currentText, onUpdateText) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const cursorIdx = e.target.selectionStart;
      const textBefore = currentText.substring(0, cursorIdx);
      const match = textBefore.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(\d+)(?:절)?(?:\s?(?:~|-)\s?(\d+)(?:절)?)?$/);

      if (match && bibles) {
        const bookRaw = match[1];
        const chNum = parseInt(match[2], 10);
        const vStart = parseInt(match[3], 10);
        const vEnd = match[4] ? parseInt(match[4], 10) : vStart;

        const engBook = BIBLE_ABBR_MAP[bookRaw] || bookRaw;
        const bookData = getArr(bibles).find((b) => b.name === engBook || b.name.toLowerCase() === engBook.toLowerCase());

        if (bookData && bookData.chapters && bookData.chapters[chNum - 1]) {
          const chVerses = bookData.chapters[chNum - 1];
          let pulledText = `\n[${BIBLE_KO_NAMES[engBook] || bookRaw} ${chNum}:${vStart}${vEnd !== vStart ? '~' + vEnd : ''}]\n`;
          let foundAny = false;

          for (let v = vStart; v <= vEnd; v++) {
            if (chVerses[v - 1]) {
              const cleaned = String(chVerses[v - 1]).replace(/'|\x1B|\(가정\d*\)|\(개인\d*\)|\(개인\)/gi, '').trim();
              pulledText += `${v}절. ${cleaned}\n`;
              foundAny = true;
            }
          }

          if (foundAny) {
            e.preventDefault();
            const textAfter = currentText.substring(cursorIdx);
            const replacedBefore = textBefore.substring(0, textBefore.length - match[0].length);
            onUpdateText(replacedBefore + pulledText + '\n' + textAfter);
            showToast('성경 본문 구절이 자동으로 입력되었습니다.');
          }
        }
      }
    }
  };

  // 감사 연동: 나의 감사일기
  const handleSendThanksToDiary = (text) => {
    if (!text || !text.trim()) return showToast('전송할 감사 내용이 없습니다.');
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
          checks: { ...(todayRec.checks || {}), 감사: true }
        }
      };
      localStorage.setItem('qt_daily', JSON.stringify(nextDaily));
      if (updateDay) updateDay({ thanksText: updatedThanks, checks: { ...(currDay?.checks || {}), 감사: true } });
      showToast('나의 감사일기로 등록되었습니다.');
    } catch (_) {
      showToast('감사일기 연동 중 오류가 발생했습니다.');
    }
  };

  // 감사 연동: 목장 나눔
  const handleSendThanksToCell = (text) => {
    if (!text || !text.trim()) return showToast('전송할 감사 내용이 없습니다.');
    try {
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curSubs = Array.isArray(cellData.submissions) ? [...cellData.submissions] : [];
      curSubs.push({
        id: Date.now(),
        name: authUser?.name || '가족 식구',
        type: '감사',
        content: `[가정예배 감사] ${text.trim()}`,
        date: safeDate
      });
      const nextCellData = { ...cellData, submissions: curSubs };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
      if (supabase && authUser?.group) {
        supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
      }
      showToast('목장 나눔으로 감사가 전송되었습니다.');
    } catch (_) {
      showToast('목장 전송 중 오류가 발생했습니다.');
    }
  };

  // 기도 연동: 나의 기도함
  const handleSendPrayerToBox = (text) => {
    if (!text || !text.trim()) return showToast('전송할 기도제목이 없습니다.');
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_family_${Date.now()}`,
        title: '[가정예배 기도]',
        content: text.trim(),
        date: safeDate,
        status: 'praying'
      };
      localStorage.setItem('prayer_items', JSON.stringify([newPrayer, ...prayers]));
      if (updateDay) updateDay({ checks: { ...(currDay?.checks || {}), 기도하기: true } });
      showToast('나의 기도함에 저장되었습니다.');
    } catch (_) {
      showToast('기도함 저장 중 오류가 발생했습니다.');
    }
  };

  // 기도 연동: 목장 중보기도
  const handleSendPrayerToCell = (text) => {
    if (!text || !text.trim()) return showToast('전송할 기도제목이 없습니다.');
    try {
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];
      curPrayers.push({
        id: Date.now(),
        name: authUser?.name || '가족 식구',
        text: `[가정예배 기도] ${text.trim()}`,
        status: 'praying'
      });
      const nextCellData = { ...cellData, groupPrayers: curPrayers };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
      if (supabase && authUser?.group) {
        supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
      }
      showToast('목장 모임 중보기도로 전송되었습니다.');
    } catch (_) {
      showToast('목장 전송 중 오류가 발생했습니다.');
    }
  };

  // 실천 트래커 연동
  const handleExportToApplyTracker = (text) => {
    if (!text || !text.trim()) return;
    try {
      const items = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const newItem = {
        id: Date.now(),
        date: safeDate,
        text: `[가정예배 순종 결단] ${text.trim()}`,
        category: '언약가정',
        source: 'family_worship',
        completed: false
      };
      localStorage.setItem('apply_tracker_items', JSON.stringify([newItem, ...items]));
      window.dispatchEvent(new Event('storage'));
      showToast('삶의 실천 트래커에 등록되었습니다.');
    } catch (_) {
      showToast('실천 과제 등록 중 오류가 발생했습니다.');
    }
  };

  switch (activeScreen) {
    case 'familySelect':
      return (
        <div
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
          className={`flex-1 flex flex-col h-full ${pageBg} ${textMain} relative font-sans select-none overflow-hidden text-left`}
        >
          <div className={`relative z-10 border-b ${borderClass}`}>
            <SubPageHeader
              title="가정 예배 선택"
              onBack={() => setActiveScreen('fiveSetMenu')}
              t={t}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              <button
                type="button"
                onClick={() => setActiveScreen('familyPublic')}
                className={`${surfaceBg} border ${borderClass} p-5 rounded-2xl cursor-pointer hover:border-[#2563EB] transition-colors flex flex-col items-center text-center space-y-2.5`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                  <ChurchSketchIcon name="family" className="w-6 h-6" isDarkMode={isDark} />
                </div>
                <h3 className="text-[15.5px] font-bold">공개 가정예배</h3>
                <p className={`text-[12.5px] ${textSub} leading-relaxed break-keep`}>
                  날짜별 캘린더 연동 및 온 가족이 함께 열고 기록하는 공간
                </p>
                <span className="px-3 py-1 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-[12px] font-bold">
                  바로 입장
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('familyPrivateLogin')}
                className={`${surfaceBg} border ${borderClass} p-5 rounded-2xl cursor-pointer hover:border-[#D97706] transition-colors flex flex-col items-center text-center space-y-2.5`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-[15.5px] font-bold">우리 가족 예배실</h3>
                <p className={`text-[12.5px] ${textSub} leading-relaxed break-keep`}>
                  가족 전용 비밀번호로 동기화되는 프라이빗 공간
                </p>
                <span className="px-3 py-1 rounded-lg bg-[#D97706]/10 text-[#D97706] text-[12px] font-bold">
                  비밀번호 입력
                </span>
              </button>
            </div>
          </div>
        </div>
      );

    case 'familyPrivateLogin':
      return (
        <div
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
          className={`flex-1 flex flex-col h-full ${pageBg} ${textMain} relative font-sans select-none overflow-hidden text-left`}
        >
          <div className={`relative z-10 border-b ${borderClass}`}>
            <SubPageHeader
              title="우리 가족 예배실 입장"
              onBack={() => setActiveScreen('familySelect')}
              t={t}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <div className={`${surfaceBg} border ${borderClass} p-6 rounded-2xl w-full max-w-xs flex flex-col gap-4`}>
              <div className="w-11 h-11 mx-auto rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-[15.5px] font-bold">가족 비밀번호 입력</h2>
                <p className={`text-[12px] ${textSub}`}>우리 가족만의 예배방 비밀번호를 입력하세요.</p>
              </div>
              <input
                type="password"
                placeholder="비밀번호"
                value={familyRoomPw || ''}
                onChange={(e) => setFamilyRoomPw && setFamilyRoomPw(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl text-[14px] font-bold text-center tracking-widest outline-none border select-text ${inputClass}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (familyRoomPw) setActiveScreen('familyPrivate');
                    else showToast('비밀번호를 입력해주세요.');
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (familyRoomPw) setActiveScreen('familyPrivate');
                  else showToast('비밀번호를 입력해주세요.');
                }}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13.5px] cursor-pointer transition-colors"
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
      const safeData = isPriv ? familyRoomData || {} : daySpecificData || {};
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
              if (Array.isArray(arr)) return arr.map((item) => (typeof item === 'object' ? item.text || '' : String(item))).filter(Boolean);
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
          if (openModal) openModal('familyHistory', sanitized);
        } catch (_) {
          showToast('이력을 불러오는 중 오류가 발생했습니다.');
        }
      };

      const handleExecuteComplete = () => {
        if (!window.confirm('오늘의 가정예배를 완료하시겠습니까?\n작성된 내용이 이력으로 저장되고 영적 5종 세트에 반영됩니다.')) return;
        try {
          const newRecord = {
            id: Date.now(),
            date: safeDate,
            data: {
              attendees: safeData.attendees || '가족 일동',
              wordMeditation: safeData.wordMeditation || '',
              thanks: thanksList.map((th) => (typeof th === 'object' ? th.text : String(th))).filter(Boolean),
              prayers: prayerList.map((pr) => (typeof pr === 'object' ? pr.text : String(pr))).filter(Boolean),
              goodDeeds: deedList.map((gd) => (typeof gd === 'object' ? gd.text : String(gd))).filter(Boolean)
            }
          };

          const existingHistory = JSON.parse(localStorage.getItem('familyHistory') || '[]');
          localStorage.setItem('familyHistory', JSON.stringify([newRecord, ...getArr(existingHistory)]));

          if (updateDay) {
            updateDay({ checks: { ...(currDay?.checks || {}), 가정예배: true } });
          }

          if (logUserAction && authUser?.name) {
            logUserAction(authUser.name, '가정예배', 'write', `[가정예배 완료] 참석자: ${safeData.attendees || '가족 일동'}`);
          }

          showToast('오늘의 가정예배가 완료 및 저장되었습니다.');
        } catch (_) {
          showToast('완료 처리 중 오류가 발생했습니다.');
        }
      };

      const LITURGY_STEPS = [
        {
          step: 1,
          title: '시작 기도 & 예배로의 부름',
          role: familyRoles.leader,
          script: `“하나님 아버지, 오늘 우리 가족이 한자리에 모여 예배하게 하심을 감사합니다. 이 시간 우리 가정의 주인이 되어 주시고, 말씀으로 우리를 인도해 주옵소서. 예수님의 이름으로 기도합니다. 아멘.”`
        },
        {
          step: 2,
          title: '찬송 (찬송가 또는 복음성가)',
          role: '온 가족 합창',
          script: `“온 가족이 함께 기쁨으로 찬양합니다. (추천: 찬송가 559장 ‘사철에 봄바람 불어잇고’, 또는 가족 애창 찬양)”`
        },
        {
          step: 3,
          title: '신앙고백 (사도신경)',
          role: '온 가족 합독',
          script: APOSTLES_CREED
        },
        {
          step: 4,
          title: '성경 봉독 (말씀 읽기)',
          role: familyRoles.reader,
          script: `${safeFamVerse.ref}\n\n“${safeFamVerse.text}”`
        },
        {
          step: 5,
          title: '말씀 묵상 나눔',
          role: '가족 모두',
          script: safeData.wordMeditation || '오늘 말씀을 통해 하나님께서 우리 가정과 내게 주신 교훈을 각자 한마디씩 나눕니다.'
        },
        {
          step: 6,
          title: '가족 감사 & 중보기도',
          role: familyRoles.prayer,
          script:
            thanksList.length > 0 || prayerList.length > 0
              ? `[오늘 나눈 감사]\n${thanksList.map((th, i) => `${i + 1}. ${typeof th === 'object' ? th.text : th}`).join('\n')}\n\n[함께 기도할 제목]\n${prayerList.map((pr, i) => `${i + 1}. ${typeof pr === 'object' ? pr.text : pr}`).join('\n')}`
              : '서로 손을 잡고 오늘 하루 감사했던 일과 기도제목을 나누며 함께 기도합니다.'
        },
        {
          step: 7,
          title: '자녀 축복기도 & 주기도문',
          role: familyRoles.blessing,
          script: `“여호와는 우리 가정에 복을 주시고 우리를 지키시기를 원하며, 여호와는 그의 얼굴을 우리에게 비추사 은혜 베푸시기를 원하며, 평강 주시기를 원하노라 (민 6:24-26).”\n\n[주기도문 합독]\n${LORDS_PRAYER}`
        }
      ];

      return (
        <div
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
          className={`flex-1 flex flex-col h-full ${pageBg} ${textMain} relative font-sans select-none overflow-hidden text-left`}
        >
          {/* 토스트 알림 */}
          {actionToast && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-[#34D399]" />
              <span>{actionToast}</span>
            </div>
          )}

          {/* 1. 상단 고정 헤더 */}
          <header className={`shrink-0 px-3 sm:px-5 py-2 border-b ${borderClass} ${surfaceBg} z-20 space-y-2`}>
            <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveScreen('familySelect')}
                  className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 ${textMain}`}
                  aria-label="뒤로"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <ChurchSketchIcon name="family" className="w-5 h-5 shrink-0 hidden sm:block" isDarkMode={isDark} />
                <h1 className="text-[15px] font-bold tracking-tight truncate">
                  {isPriv ? '우리 가족 예배실' : '가정예배 나눔'}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`relative h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} flex items-center gap-1.5 cursor-pointer`}>
                  <Calendar className={`w-3.5 h-3.5 ${textSub}`} />
                  <input
                    type="date"
                    value={safeDate}
                    onChange={(e) => setDate && setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <span className="text-[12px] font-mono font-bold">{safeDate}</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenHistorySafely}
                  className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} text-[12px] font-bold cursor-pointer`}
                >
                  이력
                </button>
              </div>
            </div>

            {/* 딥링크 바 + 모드 토글 */}
            <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'qt', label: 'QT' },
                  { id: 'sermon', label: '설교' },
                  { id: 'applyTracker', label: '실천' },
                  { id: 'prayer', label: '기도' },
                  { id: 'diary', label: '일기' },
                  { id: 'cell', label: '목장' }
                ].map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => setActiveScreen && setActiveScreen(nav.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer shrink-0`}
                  >
                    {nav.label}
                  </button>
                ))}
              </div>

              <div className={`flex p-0.5 rounded-lg ${subBg} border ${borderClass} shrink-0 text-[11.5px] font-bold`}>
                <button
                  type="button"
                  onClick={() => setFamilyMode('form')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    familyMode === 'form' ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
                  }`}
                >
                  기록 작성
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyMode('liturgy')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    familyMode === 'liturgy' ? 'bg-[#D97706] text-white' : textSub
                  }`}
                >
                  7단계 인도
                </button>
              </div>
            </div>
          </header>

          {/* 2. 메인 스크롤 뷰포트 */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
            {familyMode === 'liturgy' ? (
              /* MODE A: 7단계 실전 예배 인도 모드 */
              <div className="max-w-[720px] mx-auto space-y-3">
                <div className={`${surfaceBg} border ${borderClass} p-4 rounded-xl flex items-center justify-between gap-2`}>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#D97706] block">
                      STEP {liturgyStep} / 7
                    </span>
                    <h2 className="text-[16px] font-bold mt-0.5">{LITURGY_STEPS[liturgyStep - 1].title}</h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#D97706]/15 text-[#D97706] font-bold text-[12px] shrink-0">
                    담당: {LITURGY_STEPS[liturgyStep - 1].role}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {LITURGY_STEPS.map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setLiturgyStep(s.step)}
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                        liturgyStep === s.step
                          ? 'bg-[#D97706] text-white'
                          : s.step < liturgyStep
                          ? 'bg-[#0D9488]/15 text-[#0D9488]'
                          : `${subBg} ${textSub}`
                      }`}
                    >
                      {s.step}
                    </button>
                  ))}
                </div>

                <section className={`${surfaceBg} border ${borderClass} p-4 sm:p-5 rounded-xl space-y-4`}>
                  <div className={`flex items-center justify-between pb-2.5 border-b ${borderClass} text-[12px] ${textSub}`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Volume2 className="w-4 h-4 text-[#2563EB]" /> 인도자 안내 및 가족 합독
                    </span>
                    <span className="font-mono font-bold text-[#D97706]">{liturgyStep} / 7</span>
                  </div>

                  <div className={`p-4 rounded-xl ${subBg} border ${borderClass}`}>
                    <p className="text-[14.5px] leading-[1.95] whitespace-pre-wrap font-medium break-keep">
                      {LITURGY_STEPS[liturgyStep - 1].script}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={liturgyStep === 1}
                      onClick={() => setLiturgyStep((p) => Math.max(1, p - 1))}
                      className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold border ${borderClass} ${subBg} disabled:opacity-35 flex items-center gap-1 cursor-pointer`}
                    >
                      <ChevronLeft className="w-4 h-4" /> 이전
                    </button>

                    {liturgyStep < 7 ? (
                      <button
                        type="button"
                        onClick={() => setLiturgyStep((p) => Math.min(7, p + 1))}
                        className="px-5 py-2 rounded-xl text-[12.5px] font-bold bg-[#2563EB] text-white flex items-center gap-1 cursor-pointer"
                      >
                        다음 순서 <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExecuteComplete}
                        className="px-5 py-2 rounded-xl text-[12.5px] font-bold bg-[#0D9488] text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> 예배 완료 및 저장
                      </button>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              /* MODE B: 기록 작성 모드 (PC 2단 / 모바일 1단 자연 흐름) */
              <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                {/* 좌측 6컬럼: 오늘의 말씀 -> 참석자/역할 -> 말씀 묵상 나눔 */}
                <div className="lg:col-span-6 space-y-3 min-w-0">
                  <section className={`${surfaceBg} border ${borderClass} p-4 rounded-xl text-center space-y-1.5`}>
                    <span className="text-[11px] font-bold text-[#D97706] block">오늘의 가정예배 말씀</span>
                    <p className="text-[15px] font-bold leading-relaxed break-keep">“{safeFamVerse.text}”</p>
                    <span className={`text-[12px] font-mono ${textSub} block`}>{safeFamVerse.ref}</span>
                  </section>

                  <section className={`${surfaceBg} border ${borderClass} p-3.5 rounded-xl space-y-2.5`}>
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${textSub} shrink-0`} />
                      <span className="text-[12.5px] font-bold shrink-0">예배 참석자</span>
                      <input
                        type="text"
                        value={safeData.attendees || ''}
                        onChange={(e) => updateData((p) => ({ ...p, attendees: e.target.value }))}
                        placeholder="예: 온 가족, 아빠, 엄마, 자녀"
                        className={`flex-1 h-9 px-3 rounded-lg text-[13px] font-medium outline-none border select-text ${inputClass}`}
                      />
                    </div>

                    <div className={`grid grid-cols-3 gap-1.5 pt-2 border-t ${borderClass}`}>
                      {[
                        { key: 'leader', label: '인도' },
                        { key: 'prayer', label: '기도' },
                        { key: 'reader', label: '봉독' }
                      ].map((r) => (
                        <div key={r.key} className="space-y-0.5">
                          <span className={`text-[10.5px] font-bold ${textSub} block`}>{r.label}</span>
                          <input
                            type="text"
                            value={familyRoles[r.key] || ''}
                            onChange={(e) => handleUpdateRole(r.key, e.target.value)}
                            className={`w-full h-8 px-2 rounded-lg text-[12px] font-bold border outline-none select-text ${inputClass}`}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className={`${surfaceBg} border ${borderClass} p-3.5 rounded-xl space-y-2.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold flex items-center gap-1.5">
                        <ChurchSketchIcon name="bible" className="w-4 h-4" isDarkMode={isDark} />
                        <span>말씀 묵상 나눔</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          let pulledQt = '';
                          try {
                            const qtDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
                            const todayRec = qtDaily[safeDate] || {};
                            pulledQt = todayRec.qtMeditation || todayRec.qtGraceLine || todayRec.qtApplication || '';
                          } catch (_) {}
                          updateData((p) => ({
                            ...p,
                            wordMeditation: pulledQt || '오늘 하루도 주님의 말씀을 기준 삼아 가정 안에서 서로 사랑으로 품겠습니다.'
                          }));
                          showToast('오늘의 QT 묵상이 채워졌습니다.');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> QT 불러오기
                      </button>
                    </div>

                    <textarea
                      value={safeData.wordMeditation || ''}
                      onChange={(e) => updateData((p) => ({ ...p, wordMeditation: e.target.value }))}
                      onKeyDown={(e) =>
                        handleWordKeyDown(e, safeData.wordMeditation || '', (txt) => updateData((p) => ({ ...p, wordMeditation: txt })))
                      }
                      placeholder="말씀을 읽고 가족과 나눈 은혜를 기록하세요. (예: 요3:16 입력 후 스페이스바를 누르면 본문 자동 입력)"
                      rows={5}
                      className={`w-full p-3 rounded-xl text-[13.5px] leading-relaxed resize-none outline-none border select-text ${inputClass}`}
                    />

                    {safeData.wordMeditation && safeData.wordMeditation.trim() && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleExportToApplyTracker(safeData.wordMeditation)}
                          className="px-2.5 py-1 rounded-lg bg-[#0D9488]/10 text-[#0D9488] text-[11.5px] font-bold cursor-pointer"
                        >
                          삶의 실천 트래커로 이관
                        </button>
                      </div>
                    )}
                  </section>
                </div>

                {/* 우측 6컬럼: 가족 감사 -> 가족 기도 -> 칭찬(프라이빗) -> 완료 버튼 */}
                <div className="lg:col-span-6 space-y-3 min-w-0">
                  {/* 가족 감사 나눔 */}
                  <section className={`${surfaceBg} border ${borderClass} p-3.5 rounded-xl space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold text-[#0D9488]">
                        가족 감사 나눔 ({thanksList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem('thanks')}
                        className="px-2.5 py-1 rounded-lg bg-[#0D9488]/10 text-[#0D9488] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> 감사 추가
                      </button>
                    </div>

                    {thanksList.length === 0 ? (
                      <p className={`py-4 text-center text-[12.5px] ${textSub}`}>
                        오늘 가족과 하나님께 감사했던 일을 한 줄씩 나눠보세요.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {thanksList.map((th, idx) => {
                          const id = typeof th === 'object' ? th.id : idx;
                          const text = typeof th === 'object' ? th.text : String(th);
                          return (
                            <div key={id} className={`p-2.5 rounded-xl border ${borderClass} ${subBg} space-y-1.5`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-bold ${textSub} w-4 text-center`}>{idx + 1}</span>
                                <input
                                  type="text"
                                  value={text}
                                  onChange={(e) => updateItemText('thanks', id, e.target.value)}
                                  placeholder="오늘 감사했던 점..."
                                  className={`flex-1 h-9 px-3 rounded-lg text-[13px] outline-none border select-text ${inputClass}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem('thanks', id)}
                                  className={`p-1.5 ${textSub} hover:text-rose-500 cursor-pointer`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {text && text.trim() && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendThanksToDiary(text)}
                                    className="px-2 py-0.5 rounded-md bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-bold cursor-pointer"
                                  >
                                    감사일기로
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendThanksToCell(text)}
                                    className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold cursor-pointer"
                                  >
                                    목장으로
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* 가족 기도 제목 */}
                  <section className={`${surfaceBg} border ${borderClass} p-3.5 rounded-xl space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold text-[#2563EB]">
                        가족 기도 제목 ({prayerList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem('prayers')}
                        className="px-2.5 py-1 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> 기도 추가
                      </button>
                    </div>

                    {prayerList.length === 0 ? (
                      <p className={`py-4 text-center text-[12.5px] ${textSub}`}>
                        가족을 위한 중보기도 제목을 기록하세요.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {prayerList.map((pr, idx) => {
                          const id = typeof pr === 'object' ? pr.id : idx;
                          const text = typeof pr === 'object' ? pr.text : String(pr);
                          return (
                            <div key={id} className={`p-2.5 rounded-xl border ${borderClass} ${subBg} space-y-1.5`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-bold ${textSub} w-4 text-center`}>{idx + 1}</span>
                                <input
                                  type="text"
                                  value={text}
                                  onChange={(e) => updateItemText('prayers', id, e.target.value)}
                                  placeholder="함께 기도할 제목..."
                                  className={`flex-1 h-9 px-3 rounded-lg text-[13px] outline-none border select-text ${inputClass}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem('prayers', id)}
                                  className={`p-1.5 ${textSub} hover:text-rose-500 cursor-pointer`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {text && text.trim() && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendPrayerToBox(text)}
                                    className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold cursor-pointer"
                                  >
                                    기도함으로
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPrayerToCell(text)}
                                    className="px-2 py-0.5 rounded-md bg-[#D97706]/10 text-[#D97706] text-[11px] font-bold cursor-pointer"
                                  >
                                    목장으로
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExportToApplyTracker(text)}
                                    className="px-2 py-0.5 rounded-md bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-bold cursor-pointer"
                                  >
                                    실천으로
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* 가족 칭찬 릴레이 (프라이빗 전용) */}
                  {isPriv && (
                    <section className={`${surfaceBg} border ${borderClass} p-3.5 rounded-xl space-y-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#D97706]">서로 칭찬하고 축복하기</span>
                        <button
                          type="button"
                          onClick={() => addItem('goodDeeds')}
                          className="px-2.5 py-1 rounded-lg bg-[#D97706]/10 text-[#D97706] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> 칭찬 추가
                        </button>
                      </div>

                      {deedList.length === 0 ? (
                        <p className={`py-3 text-center text-[12.5px] ${textSub}`}>
                          가족에게 전할 따뜻한 칭찬 한마디를 적어보세요.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {deedList.map((gd, idx) => {
                            const id = typeof gd === 'object' ? gd.id : idx;
                            const text = typeof gd === 'object' ? gd.text : String(gd);
                            return (
                              <div key={id} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={text}
                                  onChange={(e) => updateItemText('goodDeeds', id, e.target.value)}
                                  placeholder="누구에게 전하는 칭찬인가요?"
                                  className={`flex-1 h-9 px-3 rounded-lg text-[13px] outline-none border select-text ${inputClass}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem('goodDeeds', id)}
                                  className={`p-1.5 ${textSub} hover:text-rose-500 cursor-pointer`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  )}

                  {/* 하단 예배 완료 버튼 */}
                  <button
                    type="button"
                    onClick={handleExecuteComplete}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" /> 오늘의 가정예배 완료하기
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      );
    }

    default:
      return null;
  }
}
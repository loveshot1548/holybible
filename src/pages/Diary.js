// src/pages/Diary.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Check,
  Send,
  X,
  Edit3,
  Heart,
  Flame,
  Target,
  Shield,
  BookOpen
} from 'lucide-react';
import ChurchSketchIcon from '../components/ChurchSketchIcon';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 보안 표준화: AES-256 종단간 암호화 (구버전 Base64 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = 'ENC_GTC_v2::';
const ENC_PREFIX_V1 = 'ENC_GTC_v1::';

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, CHAT_SECRET_KEY).toString();
    return `${ENC_PREFIX_V2}${cipher}`;
  } catch (_) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (cipherText.startsWith(ENC_PREFIX_V2)) {
    try {
      const rawCipher = cipherText.replace(ENC_PREFIX_V2, '');
      const bytes = CryptoJS.AES.decrypt(rawCipher, CHAT_SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8) || cipherText;
    } catch (_) {
      return cipherText;
    }
  }
  if (cipherText.startsWith(ENC_PREFIX_V1)) {
    try {
      return decodeURIComponent(atob(cipherText.replace(ENC_PREFIX_V1, '')));
    } catch (_) {
      return cipherText;
    }
  }
  return cipherText;
};

const TESTIMONY_TEMPLATE = `1. 제목 (한 문장으로) : \n\n2. 오늘 받은 말씀 : \n\n3. 사건 (무슨 일이 있었는가?) : \n\n4. 내 죄와 우상 (왜 그렇게 반응했는가?) : \n\n5. 말씀으로 받은 깨달음 : \n\n6. 적용 (구체적으로 무엇을 순종할 일인가?) : \n\n7. 하나님이 주신 열매 : \n\n8. 감사 : `;

const getLocal = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

export default function Diary({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  openModal,
  currDay = {},
  bibleNotes = [],
  getArr = (a) => (Array.isArray(a) ? a : []),
  authUser,
  dailyData = {},
  updateDay
}) {
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

  const [secretThanks, setSecretThanks] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedThanksItem, setSelectedThanksItem] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trainingStep, setTrainingStep] = useState(0);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const getLocalToday = () => {
    const o = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - o).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const fetchSecretThanks = async () => {
      try {
        const { data } = await supabase
          .from('secret_injections')
          .select('*')
          .eq('type', 'thanks')
          .order('created_at', { ascending: false });
        if (data && isMounted) {
          setSecretThanks(data.map((st) => ({ ...st, content: decryptField(st.content) })));
        }
      } catch (_) {}
    };
    fetchSecretThanks();

    const sub = supabase
      .channel('secret_thanks_fixed_chan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_injections', filter: 'type=eq.thanks' }, (payload) => {
        if (isMounted && payload.new) {
          const item = { ...payload.new, content: decryptField(payload.new.content) };
          setSecretThanks((prev) => [item, ...prev]);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, []);

  // 상태 영속성 (기존 localStorage 키 100% 유지)
  const [daily10Min, setDaily10Min] = useState(() =>
    getLocal('diary_10min', { word: '', event: '', emotion: '', desire: '', found: '', apply: '', repent: '', thanks: '', obey: '', share: '' })
  );
  const [daily10MinHistory, setDaily10MinHistory] = useState(() => getLocal('diary_10min_history', []));
  const [theologyNotes, setTheologyNotes] = useState(() => getLocal('diary_theo_notes', { q1: '', q2: '' }));
  const [qtPractice, setQtPractice] = useState(() =>
    getLocal('diary_qt_practice', { fact: '', emotion: [], desire: '', interpretation: '', word: '', myself: '', repent: '', thanks: '', action: '', prayer: '' })
  );
  const [sufferingPractice, setSufferingPractice] = useState(() =>
    getLocal('diary_suffer_practice', { event: '', emotion: '', interpretation: '', word: '', myself: '', repent: '', action: '', community: '' })
  );
  const [thanksChecklist, setThanksChecklist] = useState(() =>
    getLocal('diary_thanks_check', { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 })
  );
  const [sufferingChecklist, setSufferingChecklist] = useState(() =>
    getLocal('diary_suffer_check', { a: false, b: false, c: false, d: false, e: false, f: false, g: false, h: false, i: false, j: false })
  );
  const [curriculumNotes, setCurriculumNotes] = useState(() => getLocal('diary_curriculum_notes', {}));

  useEffect(() => setLocal('diary_10min', daily10Min), [daily10Min]);
  useEffect(() => setLocal('diary_10min_history', daily10MinHistory), [daily10MinHistory]);
  useEffect(() => setLocal('diary_theo_notes', theologyNotes), [theologyNotes]);
  useEffect(() => setLocal('diary_qt_practice', qtPractice), [qtPractice]);
  useEffect(() => setLocal('diary_suffer_practice', sufferingPractice), [sufferingPractice]);
  useEffect(() => setLocal('diary_thanks_check', thanksChecklist), [thanksChecklist]);
  useEffect(() => setLocal('diary_suffer_check', sufferingChecklist), [sufferingChecklist]);
  useEffect(() => setLocal('diary_curriculum_notes', curriculumNotes), [curriculumNotes]);

  const handle10Min = (f, v) => setDaily10Min((p) => ({ ...p, [f]: v }));
  const handleQt = (f, v) => setQtPractice((p) => ({ ...p, [f]: v }));
  const handleSuffer = (f, v) => setSufferingPractice((p) => ({ ...p, [f]: v }));
  const toggleSufferCheck = (k) => setSufferingChecklist((p) => ({ ...p, [k]: !p[k] }));
  const handleThanksScore = (idx, score) => setThanksChecklist((p) => ({ ...p, [idx]: score }));

  const totalThanksScore = Object.values(thanksChecklist || {}).reduce((a, b) => a + Number(b || 0), 0);
  const sufferingCompletedCount = useMemo(
    () => Object.values(sufferingPractice || {}).filter((v) => v && v.trim && v.trim().length > 0).length,
    [sufferingPractice]
  );

  const parsedThanksList = useMemo(
    () =>
      (currDay.thanksText || '')
        .split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean),
    [currDay.thanksText]
  );

  const syncThanksToERP = () => {
    if (supabase && (authUser?.name || authUser)) {
      const uName = typeof authUser === 'object' ? authUser?.name : authUser;
      if (uName) {
        supabase
          .from('attendance_records')
          .upsert(
            { date: getLocalToday(), user_name: uName, cell_name: authUser?.cell_name || '내 목장', type: '감사', status: '출석' },
            { onConflict: 'date,user_name,type' }
          )
          .then();
      }
    }
  };

  const handleArchive10Min = () => {
    const today = getLocalToday();
    const entry = { id: Date.now(), date: today, data: { ...daily10Min } };
    setDaily10MinHistory([entry, ...daily10MinHistory.filter((h) => h.date !== today)]);
    showToast('오늘의 10분 훈련 일지가 저장되었습니다.');
  };

  const handleExportObeyToApplyTracker = () => {
    const obeyText = daily10Min.obey?.trim();
    if (!obeyText) return showToast('등록할 순종 실천 내용이 비어있습니다.');
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      localStorage.setItem(
        'apply_tracker_items',
        JSON.stringify([{ id: Date.now(), date: getLocalToday(), text: `[10분 훈련 순종] ${obeyText}`, category: '개인 영성', source: 'diary_obey', completed: false }, ...saved])
      );
      window.dispatchEvent(new Event('storage'));
      showToast('삶의 실천 트래커에 등록되었습니다.');
    } catch (_) {
      showToast('등록 중 오류가 발생했습니다.');
    }
  };

  const handleExportSufferToApplyTracker = () => {
    const actionText = sufferingPractice.action?.trim();
    if (!actionText) return showToast('등록할 7단계 적용 내용이 비어있습니다.');
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      localStorage.setItem(
        'apply_tracker_items',
        JSON.stringify([{ id: Date.now(), date: getLocalToday(), text: `[고난 해석 실천] ${actionText}`, category: '고난의 신비', source: 'suffering_action', completed: false }, ...saved])
      );
      window.dispatchEvent(new Event('storage'));
      showToast('삶의 실천 트래커에 등록되었습니다.');
    } catch (_) {
      showToast('등록 중 오류가 발생했습니다.');
    }
  };

  const handleExportToPrayerBox = (text, category = '회개와 간구') => {
    if (!text || !text.trim()) return showToast('전송할 내용이 없습니다.');
    try {
      const prayers = JSON.parse(localStorage.getItem('goodtree_global_prayers') || localStorage.getItem('globalPrayers') || '[]');
      prayers.push({ id: Date.now(), text: encryptField(text.trim()), status: 'praying', date: getLocalToday() });
      localStorage.setItem('goodtree_global_prayers', JSON.stringify(prayers));
      localStorage.setItem('globalPrayers', JSON.stringify(prayers));
      window.dispatchEvent(new Event('storage'));
      showToast(`[${category}] 기도함으로 전송되었습니다.`);
    } catch (_) {
      showToast('기도함 전송 중 오류가 발생했습니다.');
    }
  };

  const handleSendAllToCell = () => {
    if (parsedThanksList.length === 0) return showToast('전송할 감사 리스트가 비어있습니다.');
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      const allTextFormatted = parsedThanksList.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
      existing.push({ id: Date.now(), date: getLocalToday(), source: 'diary_thanks_all', text: encryptField(allTextFormatted) });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      syncThanksToERP();
      showToast(`감사 ${parsedThanksList.length}건이 목장 모임으로 전송되었습니다.`);
    } catch (_) {
      showToast('전송 중 오류가 발생했습니다.');
    }
  };

  const handleSendToCell = (text) => {
    if (!text || !text.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({ id: Date.now(), date: getLocalToday(), source: 'diary_thanks', text: encryptField(text.trim()) });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      syncThanksToERP();
      showToast('목장 모임 감사나눔으로 전송되었습니다.');
      setShowSendModal(false);
    } catch (_) {
      showToast('전송 중 오류가 발생했습니다.');
    }
  };

  const handleSendToSermon = (text) => {
    if (!text || !text.trim()) return;
    try {
      const todayKey = getLocalToday();
      const allDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const todayData = allDaily[todayKey] || {};
      const currentDeclarations = Array.isArray(todayData.thanksDeclarations) ? [...todayData.thanksDeclarations] : ['', ''];
      if (!currentDeclarations[0]) currentDeclarations[0] = text.trim();
      else if (!currentDeclarations[1]) currentDeclarations[1] = text.trim();
      else currentDeclarations.push(text.trim());
      allDaily[todayKey] = { ...todayData, thanksDeclarations: currentDeclarations };
      localStorage.setItem('qt_daily', JSON.stringify(allDaily));
      syncThanksToERP();
      showToast('예배노트 감사선포로 전송되었습니다.');
      setShowSendModal(false);
    } catch (_) {
      showToast('전송 중 오류가 발생했습니다.');
    }
  };

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

  const tabs = [
    { id: 'dashboard', label: '감사 대시보드' },
    { id: 'theology', label: '감사·고난 신학' },
    { id: 'thanks', label: '감사 6단계' },
    { id: 'suffering', label: '고난 8단계' },
    { id: 'curriculum', label: '12주 커리큘럼' }
  ];

  const trainingStepGroups = [
    {
      title: '1단계: 사건과 감정 직면',
      desc: '오늘 일어난 사실과 정직한 내 감정을 마주합니다.',
      fields: [
        { id: 'event', label: '오늘의 사건 (팩트)' },
        { id: 'emotion', label: '오늘의 감정' },
        { id: 'desire', label: '내가 원했던 것 (우상)' }
      ]
    },
    {
      title: '2단계: 말씀의 빛으로 조명',
      desc: '내 생각이 아닌 말씀의 관점으로 상황을 해석합니다.',
      fields: [
        { id: 'word', label: '오늘의 말씀' },
        { id: 'found', label: '말씀에서 발견한 것' },
        { id: 'apply', label: '나에게 적용되는 것' }
      ]
    },
    {
      title: '3단계: 회개·감사·공동체 나눔',
      desc: '행동으로 순종하고 공동체와 나눌 한 문장을 완성합니다.',
      fields: [
        { id: 'repent', label: '회개할 것' },
        { id: 'thanks', label: '감사의 고백' },
        { id: 'obey', label: '오늘의 순종 실천' },
        { id: 'share', label: '공동체에 나눌 한 문장', ph: '오늘 말씀을 통해 하나님께서 제게 보여주신 것은 ______입니다.' }
      ]
    }
  ];

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans select-none text-left ${pageBg} ${textMain}`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 슬림 상단 고정 헤더 */}
      <header className={`px-3 sm:px-5 pt-2 pb-0 border-b ${borderClass} ${surfaceBg} shrink-0 z-20`}>
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveScreen && setActiveScreen('home')}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 ${textMain}`}
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <ChurchSketchIcon name="diary" className="w-5 h-5 shrink-0 hidden sm:block" isDarkMode={isDark} />
            <h1 className="text-[15px] font-bold tracking-tight truncate">감사 · 간증 일기</h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'qt', label: 'QT' },
              { id: 'sermon', label: '설교' },
              { id: 'applyTracker', label: '실천' },
              { id: 'prayer', label: '기도' },
              { id: 'cell', label: '목장' }
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveScreen && setActiveScreen(nav.id)}
                className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer`}
              >
                {nav.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded-lg md:hidden ${textMain} cursor-pointer`}
              aria-label="메뉴"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 가로 탭 바 */}
        <div className="max-w-[1280px] mx-auto flex overflow-x-auto hide-scrollbar gap-4 sm:gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 text-[12.5px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id ? 'border-[#2563EB] text-[#2563EB]' : `border-transparent ${textSub}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. 메인 스크롤 뷰포트 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <div className="max-w-[1280px] mx-auto">
          {/* TAB 1: 감사 대시보드 */}
          {activeTab === 'dashboard' && (
            <div className="space-y-3.5">
              {/* 4대 핵심 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${textSub}`}>오늘의 감사</span>
                    <Heart className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-mono font-bold text-[#D97706]">{parsedThanksList.length}</span>
                    <span className={`text-[11.5px] ${textSub}`}>건</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${textSub}`}>10분 훈련 누적</span>
                    <Flame className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-mono font-bold text-[#2563EB]">
                      {daily10MinHistory.length + (daily10Min.event ? 1 : 0)}
                    </span>
                    <span className={`text-[11.5px] ${textSub}`}>일</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${textSub}`}>감사 지수</span>
                    <Target className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-mono font-bold text-[#0D9488]">{totalThanksScore}</span>
                    <span className={`text-[11.5px] font-mono ${textSub}`}>/ 20</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${textSub}`}>고난 해석</span>
                    <Shield className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-mono font-bold text-[#2563EB]">{sufferingCompletedCount}</span>
                    <span className={`text-[11.5px] font-mono ${textSub}`}>/ 8단계</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                {/* 좌측 5컬럼: 감사 리스트 + 말씀 묵상 노트 + 간증 */}
                <div className="lg:col-span-5 space-y-3 min-w-0">
                  {secretThanks.length > 0 && (
                    <section className="p-3.5 rounded-xl border border-[#D97706]/35 bg-[#D97706]/10 space-y-2">
                      <h3 className="text-[13px] font-bold text-[#D97706]">익명의 감사 메시지</h3>
                      <div className="space-y-1.5">
                        {secretThanks.map((st) => (
                          <p key={st.id} className={`p-2.5 rounded-lg ${surfaceBg} text-[13px] font-medium`}>
                            “{st.content}”
                          </p>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-bold flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#D97706]" />
                        <span>오늘의 감사 리스트</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {parsedThanksList.length > 0 && (
                          <button
                            type="button"
                            onClick={handleSendAllToCell}
                            className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> 일괄 전송
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openModal && openModal('thanks')}
                          className={`text-[12px] font-bold ${textSub} hover:text-[#2563EB] flex items-center cursor-pointer`}
                        >
                          편집 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {parsedThanksList.length === 0 ? (
                      <p className={`text-[13px] ${textSub} py-2`}>오늘의 감사를 기록해보세요.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {parsedThanksList.map((item, idx) => (
                          <div key={idx} className={`p-2.5 rounded-xl border ${borderClass} ${subBg} flex items-center justify-between gap-2`}>
                            <div className="flex items-start gap-1.5 min-w-0">
                              <span className="text-[11.5px] font-mono font-bold text-[#D97706] shrink-0">{idx + 1}.</span>
                              <span className="text-[13px] leading-snug truncate">{item}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThanksItem(item);
                                setShowSendModal(true);
                              }}
                              className="px-2 py-1 rounded-md bg-[#D97706]/15 text-[#D97706] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Send className="w-3 h-3" /> 전송
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${borderClass}`}>
                      <h3 className="text-[14px] font-bold flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#2563EB]" />
                        <span>말씀 묵상 노트</span>
                      </h3>
                      <span className={`text-[11.5px] font-mono ${textSub}`}>{getArr(bibleNotes).length}개</span>
                    </div>
                    {getArr(bibleNotes).length === 0 ? (
                      <p className={`text-[13px] ${textSub} py-1`}>저장된 노트가 없습니다.</p>
                    ) : (
                      <div className={`divide-y ${isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]'}`}>
                        {getArr(bibleNotes)
                          .slice(0, 3)
                          .map((n) => (
                            <div
                              key={n.id}
                              onClick={() => openModal && openModal('bibleNoteList', n)}
                              className="py-2 cursor-pointer hover:text-[#2563EB]"
                            >
                              <p className="text-[13px] font-bold truncate">
                                {n.verses?.[0]?.ref || '말씀'} :{' '}
                                <span className={`font-normal ${textSub}`}>{n.note ? n.note.replace(/<[^>]*>?/gm, '') : '내용 없음'}</span>
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  <button
                    type="button"
                    onClick={() => openModal && openModal('testimony')}
                    className={`w-full p-3.5 rounded-xl border ${borderClass} ${surfaceBg} hover:border-[#2563EB] transition-colors text-left space-y-1 cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-[#0D9488]" />
                        <span>나의 묵상 간증</span>
                      </span>
                      <span className="text-[12px] font-bold text-[#2563EB] flex items-center">
                        작성 <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className={`text-[12.5px] ${textSub} line-clamp-2`}>
                      {currDay.testimony && currDay.testimony !== TESTIMONY_TEMPLATE
                        ? '간증문이 작성되어 있습니다.'
                        : '오늘의 묵상과 간증을 기록하세요.'}
                    </p>
                  </button>
                </div>

                {/* 우측 7컬럼: 매일 10분 훈련표 */}
                <section className={`lg:col-span-7 rounded-xl border ${borderClass} ${surfaceBg} overflow-hidden flex flex-col`}>
                  <div className={`p-3.5 border-b ${borderClass} space-y-2.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-bold">매일 10분 영성 훈련표</h3>
                      <button
                        type="button"
                        onClick={handleArchive10Min}
                        className="px-3 py-1.5 rounded-lg bg-[#0D9488] text-white font-bold text-[12px] flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> 일지 저장
                      </button>
                    </div>

                    <div className={`grid grid-cols-3 gap-1 p-0.5 rounded-xl ${subBg} border ${borderClass}`}>
                      {trainingStepGroups.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTrainingStep(idx)}
                          className={`py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                            trainingStep === idx ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
                          }`}
                        >
                          {idx + 1}단계
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className={`pb-2 border-b ${borderClass}`}>
                        <span className="text-[13px] font-bold text-[#2563EB] block">{trainingStepGroups[trainingStep].title}</span>
                        <span className={`text-[12px] ${textSub}`}>{trainingStepGroups[trainingStep].desc}</span>
                      </div>

                      {trainingStepGroups[trainingStep].fields.map((f) => (
                        <div key={f.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[12.5px] font-bold">{f.label}</label>
                            {f.id === 'obey' && daily10Min.obey && (
                              <button
                                type="button"
                                onClick={handleExportObeyToApplyTracker}
                                className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                              >
                                실천 트래커 이관
                              </button>
                            )}
                            {f.id === 'repent' && daily10Min.repent && (
                              <button
                                type="button"
                                onClick={() => handleExportToPrayerBox(daily10Min.repent, '회개의 기도')}
                                className="text-[11px] font-bold text-[#D97706] hover:underline cursor-pointer"
                              >
                                기도함 전송
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={daily10Min[f.id] || ''}
                            onChange={(e) => handle10Min(f.id, e.target.value)}
                            placeholder={f.ph || '기록하세요...'}
                            className={`w-full h-10 px-3 text-[13.5px] rounded-xl outline-none border select-text ${inputClass}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t ${borderClass}`}>
                      <button
                        type="button"
                        disabled={trainingStep === 0}
                        onClick={() => setTrainingStep((p) => Math.max(0, p - 1))}
                        className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold border ${borderClass} ${subBg} disabled:opacity-35 cursor-pointer`}
                      >
                        이전
                      </button>
                      <span className={`text-[11.5px] font-mono font-bold ${textSub}`}>{trainingStep + 1} / 3</span>
                      <button
                        type="button"
                        disabled={trainingStep === 2}
                        onClick={() => setTrainingStep((p) => Math.min(2, p + 1))}
                        className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-[#2563EB] text-white disabled:opacity-35 cursor-pointer"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: 감사와 고난 신학 */}
          {activeTab === 'theology' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <div className="space-y-3.5">
                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <span className="text-[11px] font-mono font-bold text-[#2563EB]">PART 1. 감사의 본질</span>
                  <h2 className="text-[16px] font-bold">감사는 감정이 아니다</h2>
                  <p className={`text-[13.5px] leading-[1.75] ${textSub} break-keep`}>
                    감사하라는 말씀은 좋은 일이 생겼을 때 기분 좋게 반응하라는 뜻만이 아닙니다. 성경은 어려운 상황에서도 하나님께 감사하도록 가르칩니다 (살전 5:18, 빌 4:6-7, 합 3:17-18).
                  </p>
                  <div className={`p-3 rounded-xl ${subBg} space-y-1.5 text-[13px]`}>
                    <p className={textSub}><b className="text-rose-500 mr-1.5">X</b>감사 = 기분 좋은 감정</p>
                    <p className="font-bold"><b className="text-[#0D9488] mr-1.5">O</b>감사 = 하나님을 인정하고 현재의 삶을 말씀 안에서 받아들이는 훈련</p>
                  </div>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <span className="text-[11px] font-mono font-bold text-[#0D9488]">PART 2. 고난의 해석</span>
                  <h2 className="text-[16px] font-bold">고난을 말씀으로 해석하기</h2>
                  <p className={`text-[13.5px] leading-[1.75] ${textSub} break-keep`}>
                    고난을 겪을 때 자기 생각이 아니라 매일의 성경 본문에 기초하여 삶의 고통을 해석하는 훈련입니다.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
                    <div className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-1`}>
                      <span className="font-bold text-rose-500 block">잘못된 접근</span>
                      <p className={textSub}>왜 나에게 이런 일이 생겼지?</p>
                      <p className={textSub}>하나님이 나를 벌하시는 건가?</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-1`}>
                      <span className="font-bold text-[#0D9488] block">말씀훈련의 접근</span>
                      <p>1. 사건·감정·해석 직면</p>
                      <p>2. 말씀 앞에서 나의 죄와 우상 발견</p>
                      <p>3. 회개와 구원의 방향 순종</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-3.5">
                <section className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/8 space-y-2">
                  <h3 className="text-[14.5px] font-bold text-rose-500">고난 해석 금지사항</h3>
                  <ul className="space-y-1.5 text-[13px] font-medium">
                    <li>1. &quot;네가 죄를 지어서 이런 일이 생긴 거야.&quot;</li>
                    <li>2. &quot;믿음이 좋으면 고난이 없어져.&quot;</li>
                    <li>3. &quot;감사하면 무조건 문제가 해결돼.&quot;</li>
                    <li>4. &quot;고난이 축복이니까 힘들다고 하면 안 돼.&quot;</li>
                  </ul>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-3`}>
                  <h3 className="text-[15px] font-bold">핵심 묵상 문장</h3>
                  <div className={`p-3.5 rounded-xl ${subBg} text-center space-y-2`}>
                    <p className="text-[14px] font-bold leading-relaxed break-keep">
                      “고난을 없애달라고만 기도하지 말고, 고난 가운데서 말씀으로 나를 보게 해 달라고 기도한다.”
                    </p>
                    <p className={`text-[13px] ${textSub} break-keep`}>
                      “감사는 좋지 않은 상황에서도 하나님을 잃지 않겠다는 믿음의 반응이다.”
                    </p>
                  </div>
                  <textarea
                    rows={3}
                    value={theologyNotes.q1 || ''}
                    onChange={(e) => setTheologyNotes((p) => ({ ...p, q1: e.target.value }))}
                    placeholder="위 문장을 묵상하며 나의 결단을 적어보세요..."
                    className={`w-full p-3 text-[13.5px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                  />
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: 감사 훈련 6단계 */}
          {activeTab === 'thanks' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              <div className="lg:col-span-5 space-y-3.5">
                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <h2 className="text-[15.5px] font-bold">감사 훈련 6단계</h2>
                  <div className="space-y-2 text-[13px]">
                    {[
                      ['STEP 1. 사실을 기록한다', '감정과 해석을 섞지 않습니다.'],
                      ['STEP 2. 내 감정을 기록한다', '화, 서운함, 두려움을 숨기지 않습니다.'],
                      ['STEP 3. 내가 원하는 것을 찾는다', '이 상황에서 무엇을 얻고 싶었는가?'],
                      ['STEP 4. 말씀 앞에서 나를 본다', '오늘 말씀은 내게 무엇을 말씀하시는가?'],
                      ['STEP 5. 감사의 이유를 발견한다', '이 사건 속 하나님의 은혜는 무엇인가?'],
                      ['STEP 6. 행동으로 연결한다', '오늘 내가 순종할 한 가지는 무엇인가?']
                    ].map(([title, desc], i) => (
                      <div key={i}>
                        <span className="font-bold block">{title}</span>
                        <span className={`text-[12px] ${textSub}`}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14.5px] font-bold">감사 체크리스트</h3>
                    <span className="text-[12.5px] font-mono font-bold text-[#0D9488]">{totalThanksScore} / 20점</span>
                  </div>
                  <div className={`divide-y ${isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]'} border ${borderClass} rounded-xl overflow-hidden`}>
                    {[
                      '매일 말씀을 읽었다', '말씀을 내 삶에 연결했다', '사건과 해석을 구분했다', '내 감정을 정직하게 기록했다',
                      '남의 문제보다 나를 먼저 보았다', '회개할 것을 발견했다', '구체적으로 적용했다', '감사 제목을 기록했다',
                      '불평을 줄이려고 노력했다', '공동체에 나누었다'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 text-[12.5px]">
                        <span className="font-medium pr-2">{item}</span>
                        <div className="flex gap-1 shrink-0">
                          {[0, 1, 2].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleThanksScore(idx, s)}
                              className={`w-7 h-7 rounded-lg text-[11.5px] font-bold cursor-pointer ${
                                thanksChecklist[idx] === s ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub}`
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className={`lg:col-span-7 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-3`}>
                <h2 className="text-[15.5px] font-bold">오늘의 감사 QT 실습지</h2>
                {[
                  { id: 'fact', label: '1. 오늘 일어난 사실 (팩트)' },
                  { id: 'desire', label: '3. 내가 원하는 것은 무엇이었는가?' },
                  { id: 'interpretation', label: '4. 나는 이 사건을 어떻게 해석했는가?' },
                  { id: 'word', label: '5. 오늘 본문에서 발견한 말씀' },
                  { id: 'myself', label: '6. 말씀 앞에서 발견한 나의 모습' },
                  { id: 'repent', label: '7. 회개할 것' },
                  { id: 'thanks', label: '8. 감사할 이유' },
                  { id: 'action', label: '9. 오늘 실천할 한 가지' },
                  { id: 'prayer', label: '10. 오늘의 기도' }
                ].map((f, i) => (
                  <React.Fragment key={f.id}>
                    {i === 1 && (
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold block">2. 내가 느낀 감정 (중복 선택)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['화', '서운함', '두려움', '억울함', '질투', '불안', '감사', '기쁨'].map((em) => {
                            const isChecked = (qtPractice.emotion || []).includes(em);
                            return (
                              <button
                                key={em}
                                type="button"
                                onClick={() => {
                                  const cur = qtPractice.emotion || [];
                                  handleQt('emotion', isChecked ? cur.filter((e) => e !== em) : [...cur, em]);
                                }}
                                className={`px-3 py-1 rounded-lg text-[12px] font-bold border cursor-pointer ${
                                  isChecked ? 'bg-[#2563EB] text-white border-[#2563EB]' : `${borderClass} ${subBg} ${textSub}`
                                }`}
                              >
                                {em}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[13px] font-bold block">{f.label}</label>
                      <textarea
                        rows={2}
                        value={qtPractice[f.id] || ''}
                        onChange={(e) => handleQt(f.id, e.target.value)}
                        placeholder="기록하세요..."
                        className={`w-full p-2.5 text-[13px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </section>
            </div>
          )}

          {/* TAB 4: 고난 해석 8단계 */}
          {activeTab === 'suffering' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              <div className="lg:col-span-5 space-y-3.5">
                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                  <h2 className="text-[15.5px] font-bold">고난 해석 8단계 가이드</h2>
                  <div className={`divide-y ${isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]'} border ${borderClass} rounded-xl overflow-hidden text-[12.5px]`}>
                    {[
                      ['1. 사건', '사실만 기록'],
                      ['2. 감정', '숨김없이 감정 직면'],
                      ['3. 해석', '내가 붙인 의미 확인'],
                      ['4. 말씀', '내 생각과 말씀 대조'],
                      ['5. 나', '내 죄·두려움·우상 직면'],
                      ['6. 회개', '돌이켜야 할 부분 고백'],
                      ['7. 적용', '구체적 순종 행동'],
                      ['8. 공동체', '공동체 안에서 회복 나누기']
                    ].map(([st, desc], i) => (
                      <div key={i} className="p-2.5 flex justify-between gap-2">
                        <span className="font-bold shrink-0">{st}</span>
                        <span className={textSub}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                  <h3 className="text-[14.5px] font-bold">고난 해석 체크리스트</h3>
                  {[
                    { k: 'a', t: 'A. 사실을 정확하게 기록했는가?' },
                    { k: 'b', t: 'B. 내 감정을 숨기지 않았는가?' },
                    { k: 'c', t: 'C. 사건에 붙인 의미를 기록했는가?' },
                    { k: 'd', t: 'D. 성경 본문을 먼저 확인했는가?' },
                    { k: 'e', t: 'E. 나 자신을 먼저 살폈는가?' },
                    { k: 'f', t: 'F. 돌이킬 부분을 찾았는가?' },
                    { k: 'g', t: 'G. 실제 행동을 정했는가?' },
                    { k: 'h', t: 'H. 감사할 이유를 찾았는가?' },
                    { k: 'i', t: 'I. 공동체와 나누었는가?' },
                    { k: 'j', t: 'J. 실제 생활에서 실행했는가?' }
                  ].map((item) => (
                    <button
                      key={item.k}
                      type="button"
                      onClick={() => toggleSufferCheck(item.k)}
                      className="w-full flex items-center gap-2.5 text-left py-1 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          sufferingChecklist[item.k] ? 'bg-[#2563EB] border-[#2563EB] text-white' : borderClass
                        }`}
                      >
                        {sufferingChecklist[item.k] && <Check className="w-3 h-3" />}
                      </span>
                      <span className={`text-[12.5px] font-medium ${sufferingChecklist[item.k] ? textSub : textMain}`}>{item.t}</span>
                    </button>
                  ))}
                </section>
              </div>

              <section className={`lg:col-span-7 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-3`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15.5px] font-bold">고난 해석 8단계 실습지</h2>
                  {sufferingPractice.action && (
                    <button
                      type="button"
                      onClick={handleExportSufferToApplyTracker}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold text-[11.5px] cursor-pointer"
                    >
                      실천 트래커 이관
                    </button>
                  )}
                </div>

                {[
                  { id: 'event', label: '1단계. 사건 (사실만)' },
                  { id: 'emotion', label: '2단계. 감정 (숨김없이)' },
                  { id: 'interpretation', label: '3단계. 해석 (내 생각)' },
                  { id: 'word', label: '4단계. 말씀 (성경 본문)' },
                  { id: 'myself', label: '5단계. 나 (내 죄와 우상)' },
                  { id: 'repent', label: '6단계. 회개 (돌이킬 것)' },
                  { id: 'action', label: '7단계. 적용 (구체적 행동)' },
                  { id: 'community', label: '8단계. 공동체 (나눔 계획)' }
                ].map((f) => (
                  <div key={f.id} className="space-y-1">
                    <label className="text-[13px] font-bold block">{f.label}</label>
                    <textarea
                      rows={2}
                      value={sufferingPractice[f.id] || ''}
                      onChange={(e) => handleSuffer(f.id, e.target.value)}
                      placeholder="정직하게 기록하세요..."
                      className={`w-full p-2.5 text-[13px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                    />
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* TAB 5: 12주 훈련 커리큘럼 */}
          {activeTab === 'curriculum' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              <section className={`lg:col-span-5 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                <h2 className="text-[15.5px] font-bold">감사와 고난 해석 12주 과정</h2>
                <div className={`divide-y ${isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]'} border ${borderClass} rounded-xl overflow-hidden text-[12.5px]`}>
                  {[
                    [1, '나는 왜 감사하지 못하는가?', '불평의 구조 파악'],
                    [2, '말씀 앞에 나를 세우기', 'QT 구조 이해'],
                    [3, '사건과 해석을 분리하기', '사건 ≠ 내가 붙인 의미'],
                    [4, '감사의 근원을 찾기', '하나님 때문에 하는 감사'],
                    [5, '고난은 무엇인가?', '축복의 약재로 바라보기'],
                    [6, '잘못된 고난 해석 부수기', '인과응보적 사고 탈피'],
                    [7, '고난 속에서 나를 발견하기', '내 안의 우상 직면'],
                    [8, '회개와 적용', '인정 → 회개 → 행동'],
                    [9, '고난을 공동체에서 나누기', '자기 의 내려놓기'],
                    [10, '고난에서 말씀을 발견하다', '요셉·다윗·욥·바울 연구'],
                    [11, '내 고난을 간증으로 바꾸기', '하나님이 하신 일 선포'],
                    [12, '감사하는 제자로 살아가기', '영적 패턴의 일상화']
                  ].map(([w, title, desc]) => (
                    <div key={w} className="p-2.5">
                      <span className="font-bold block">{w}주차. {title}</span>
                      <span className={`text-[11.5px] ${textSub}`}>{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`lg:col-span-7 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-3`}>
                <div>
                  <h2 className="text-[15.5px] font-bold">주차별 훈련 일지 및 결단</h2>
                  <p className={`text-[12.5px] ${textSub}`}>각 주차 훈련을 통해 깨달은 점과 적용을 기록하세요.</p>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                    <div key={w} className="space-y-1">
                      <label className="text-[13px] font-bold block">{w}주차 소논고 · 결단</label>
                      <textarea
                        rows={2}
                        value={curriculumNotes[w] || ''}
                        onChange={(e) => setCurriculumNotes((p) => ({ ...p, [w]: e.target.value }))}
                        placeholder={`${w}주차 적용 내용을 기록하세요...`}
                        className={`w-full p-2.5 text-[13px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* 개별 감사 전송 모달 */}
      {showSendModal && (
        <div
          onClick={() => setShowSendModal(false)}
          className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-4 space-y-3`}
          >
            <div className={`flex items-center justify-between pb-2.5 border-b ${borderClass}`}>
              <span className="font-bold text-[14.5px]">감사 항목 전송</span>
              <button type="button" onClick={() => setShowSendModal(false)} className={`p-1 rounded-lg ${subBg} cursor-pointer`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-3 rounded-xl border ${borderClass} ${subBg} text-[13.5px] leading-relaxed`}>
              “{selectedThanksItem}”
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSendToCell(selectedThanksItem)}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-bold cursor-pointer"
              >
                목장 모임 [감사나눔]으로 전송
              </button>
              <button
                type="button"
                onClick={() => handleSendToSermon(selectedThanksItem)}
                className={`w-full py-2.5 rounded-xl border ${borderClass} ${subBg} text-[13px] font-bold cursor-pointer`}
              >
                주일 예배노트 [감사선포]로 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/components/QT.js
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Compass,
  CornerDownRight,
  Globe,
  HandHeart,
  Heart,
  Info,
  Link2,
  Maximize2,
  Menu,
  MessageCircle,
  Minimize2,
  PenTool,
  Search,
  Share2,
  Sparkles,
  Target,
  Video,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';
import { BibleGalaxyArcModal, extractAllBibleRefsFromText } from '../pages/BibleKnowledgeGalaxy';

// =====================================================================
// 보안 표준화: AES-256 종단간 암호화
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = 'ENC_GTC_v2::';
const ENC_PREFIX_V1 = 'ENC_GTC_v1::';

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, CHAT_SECRET_KEY).toString();
    return `${ENC_PREFIX_V2}${cipher}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';

  if (cipherText.startsWith(ENC_PREFIX_V2)) {
    try {
      const rawCipher = cipherText.replace(ENC_PREFIX_V2, '');
      const bytes = CryptoJS.AES.decrypt(rawCipher, CHAT_SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipherText;
    } catch (e) {
      return cipherText;
    }
  }

  if (cipherText.startsWith(ENC_PREFIX_V1)) {
    try {
      const payload = cipherText.replace(ENC_PREFIX_V1, '');
      return decodeURIComponent(atob(payload));
    } catch (e) {
      return cipherText;
    }
  }

  return cipherText;
};

// 성경 구절 정밀 정규식 추출기
const extractBibleReferences = (text) => {
  if (!text) return [];
  const extracted =
    typeof extractAllBibleRefsFromText === 'function' ? extractAllBibleRefsFromText(text).map((item) => item.label) : [];
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)].map((m) => m[0].trim());
  return Array.from(new Set([...extracted, ...matches]));
};

// =====================================================================
// 10단계 심층 훈련 아이템 (박스 중첩 배제 · 깔끔한 헤어라인 리스트 행)
// =====================================================================
const TrainingRow = React.memo(({ id, num, title, desc, tip, isChecked, onToggle, isDark }) => {
  return (
    <div
      onClick={() => onToggle(id)}
      className="ignore-draw py-3 flex items-start gap-3 cursor-pointer select-none transition-colors"
    >
      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          isChecked
            ? 'bg-[#0D9488] border-[#0D9488] text-white'
            : isDark
            ? 'border-[#3F4654] bg-transparent'
            : 'border-[#CBD5E1] bg-white'
        }`}
      >
        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={`text-[14px] font-bold leading-snug ${
            isChecked ? 'text-[#8B95A1] line-through' : isDark ? 'text-[#F9FAFB]' : 'text-[#191F28]'
          }`}
        >
          <span className="text-[#8B95A1] mr-1.5">{num}.</span>
          {title}
        </p>
        <p className={`text-[12.5px] leading-relaxed break-keep ${isDark ? 'text-[#9BA3B0]' : 'text-[#6B7684]'}`}>{desc}</p>
        {tip && (
          <p className={`text-[12px] leading-relaxed break-keep ${isDark ? 'text-[#99F6E4]' : 'text-[#0F766E]'}`}>
            <span className="font-bold mr-1">안내</span>
            {tip}
          </p>
        )}
      </div>
    </div>
  );
});

export default function DailyQT({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  SubPageHeader,
  date,
  currDay = {},
  dailyData = {},
  globalSharedQt = {},
  ymdStr,
  qtEditorRef,
  renderToolbar,
  handleStickerAdd,
  handleMemoAdd,
  handleFileUpload,
  CanvasEngine,
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  StickerLayer,
  onPtrDown,
  updateDay,
  extractVideoId,
  handleUpdateSharedQt,
  triggerConfetti,
  findBibleText,
  authUser,
  logUserAction,
  bibles = [],
  openGlobalDrawer
}) {
  if (!SubPageHeader) return null;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('101216') || t?.appBg?.includes('121212') || isDarkMode;
  const [qtSubView, setQtSubView] = useState('myQt');

  const [isTrainingMode, setIsTrainingMode] = useState(() => {
    return localStorage.getItem('qt_training_mode_active') === 'true';
  });
  const [showToolbar, setShowToolbar] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  // 성경 아크 & 은하계 인라인 팝업 상태
  const [galaxyModalConfig, setGalaxyModalConfig] = useState({
    isOpen: false,
    mode: 'arc',
    refQuery: ''
  });

  const openGalaxyPopup = useCallback(
    (mode = 'arc', refStr = '') => {
      const fallbackRef =
        refStr || currDay?.qtReference || globalSharedQt?.[date]?.reference || currDay?.qtGoldenVerse || '창세기 1:1';
      setGalaxyModalConfig({
        isOpen: true,
        mode,
        refQuery: fallbackRef
      });
    },
    [currDay?.qtReference, currDay?.qtGoldenVerse, globalSharedQt, date]
  );

  const audioRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const toggleBGM = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.volume = 0.22;
      audioRef.current
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => {});
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const [todayActionItems, setTodayActionItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      return saved.filter((item) => item.date === date && item.source === 'qt');
    } catch {
      return [];
    }
  });

  const [todayPrayers, setTodayPrayers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      return saved.filter((item) => item.date === date);
    } catch {
      return [];
    }
  });

  const [counselingStatus, setCounselingStatus] = useState(() => {
    return localStorage.getItem(`counseling_sent_${date}`) ? 'pending' : null;
  });
  const [counselingReplyData, setCounselingReplyData] = useState(null);

  useEffect(() => {
    if (!supabase || !authUser?.name) return;
    const fetchReply = async () => {
      const { data } = await supabase
        .from('counseling_qna')
        .select('reply, status')
        .eq('user_name', authUser.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setCounselingStatus(data.status);
        if (data.reply) setCounselingReplyData(decryptField(data.reply));
      }
    };
    fetchReply();
  }, [authUser?.name, date]);

  const [trainingChecks, setTrainingChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`qt_training_chk_${date}`)) || {};
    } catch {
      return {};
    }
  });

  const [linkedRefs, setLinkedRefs] = useState([]);
  const [activeBacklink, setActiveBacklink] = useState(null);

  useEffect(() => {
    const combinedText = `${currDay?.qtReference || globalSharedQt?.[date]?.reference || ''} ${currDay?.qtGoldenVerse || ''} ${currDay?.qtGraceLine || ''} ${currDay?.qtMeditation || ''} ${currDay?.qtApplication || ''} ${currDay?.qtAppQuestion || ''}`;
    const detected = extractBibleReferences(combinedText);
    setLinkedRefs(detected);
  }, [currDay?.qtReference, globalSharedQt, date, currDay?.qtGoldenVerse, currDay?.qtGraceLine, currDay?.qtMeditation, currDay?.qtApplication, currDay?.qtAppQuestion]);

  const relatedEntries = useMemo(() => {
    if (!activeBacklink) return [];
    return Object.entries(dailyData || {})
      .filter(([dKey, dVal]) => {
        if (dKey === date) return false;
        const fullText = `${dVal.qtReference || ''} ${dVal.qtGoldenVerse || ''} ${dVal.qtMeditation || ''} ${dVal.sermonNotes || ''} ${dVal.qtGraceLine || ''}`;
        return fullText.includes(activeBacklink);
      })
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [activeBacklink, dailyData, date]);

  const toggleTrainingCheck = useCallback(
    (stepId) => {
      setTrainingChecks((prev) => {
        const next = { ...prev, [stepId]: !prev[stepId] };
        localStorage.setItem(`qt_training_chk_${date}`, JSON.stringify(next));
        return next;
      });
    },
    [date]
  );

  const handleToggleTrainingMode = () => {
    const next = !isTrainingMode;
    setIsTrainingMode(next);
    localStorage.setItem('qt_training_mode_active', String(next));
  };

  useEffect(() => {
    if (!isTrainingMode) return;
    setTrainingChecks((prev) => {
      const next = { ...prev };
      let changed = false;

      if (currDay.qtAppQuestion && currDay.qtAppQuestion.trim().length > 3) {
        if (!next['step4']) {
          next['step4'] = true;
          changed = true;
        }
        if (!next['step5']) {
          next['step5'] = true;
          changed = true;
        }
        if (!next['step6']) {
          next['step6'] = true;
          changed = true;
        }
      }
      if (currDay.qtMeditation && currDay.qtMeditation.trim().length > 3) {
        if (!next['step7']) {
          next['step7'] = true;
          changed = true;
        }
        if (!next['step8']) {
          next['step8'] = true;
          changed = true;
        }
      }
      if (currDay.qtApplication && currDay.qtApplication.trim().length > 3) {
        if (!next['step9']) {
          next['step9'] = true;
          changed = true;
        }
        if (!next['step10']) {
          next['step10'] = true;
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(`qt_training_chk_${date}`, JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [currDay.qtAppQuestion, currDay.qtMeditation, currDay.qtApplication, isTrainingMode, date]);

  const autoGrowTextarea = useCallback((e) => {
    if (!e || !e.target) return;
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const rawTarget = globalSharedQt?.[date]?.qt || currDay?.qtVideoId || currDay?.qtVideoUrl;
  const currentVideoId = extractVideoId ? extractVideoId(rawTarget) : rawTarget;

  const currYear = parseInt(date.substring(0, 4));
  const currMonth = parseInt(date.substring(5, 7));
  const daysInMonth = new Date(currYear, currMonth, 0).getDate();
  const firstDayOfWeek = new Date(currYear, currMonth - 1, 1).getDay();

  // 능동형 UI: 오늘의 큐티 작성 완성도 실시간 계산
  const qtCompletionPercent = useMemo(() => {
    let score = 0;
    if ((currDay.qtTitle || globalSharedQt?.[date]?.title || '').trim()) score += 20;
    if ((currDay.qtReference || globalSharedQt?.[date]?.reference || '').trim()) score += 20;
    if ((currDay.qtAppQuestion || '').trim()) score += 20;
    if ((currDay.qtMeditation || '').trim()) score += 20;
    if ((currDay.qtApplication || '').trim() || (currDay.qtGraceLine || '').trim()) score += 20;
    return score;
  }, [currDay, globalSharedQt, date]);

  const handleShareVideo = () => {
    const targetUrl = currDay.qtVideoUrl || (currDay.qtVideoId ? `https://youtu.be/${currDay.qtVideoId}` : '');
    if (!targetUrl) return alert('공유할 유튜브 링크를 먼저 입력해주세요.');

    if (handleUpdateSharedQt) {
      handleUpdateSharedQt(date, 'qt', targetUrl);
    }

    if (navigator.share) {
      navigator
        .share({
          title: currDay.qtTitle || '오늘의 큐티 영상',
          url: targetUrl
        })
        .catch(() => {});
    }
    alert('공유되었습니다.');
  };

  const handleActionItemSync = (val) => {
    if (updateDay) {
      updateDay({ qtActionItem: val, qtActionCompleted: false });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const filtered = saved.filter((item) => item.date !== date || item.source !== 'qt');
      if (val.trim()) {
        filtered.push({
          id: `qt_${date}_${Date.now()}`,
          date: date,
          source: 'qt',
          text: val.trim(),
          completed: false,
          graceLine: currDay.qtGraceLine || ''
        });
      }
      localStorage.setItem('apply_tracker_items', JSON.stringify(filtered));
      setTodayActionItems(filtered.filter((item) => item.date === date && item.source === 'qt'));

      if (supabase && (authUser?.name || authUser)) {
        const uName = typeof authUser === 'object' ? authUser?.name : authUser;
        if (uName) {
          supabase
            .from('attendance_records')
            .upsert(
              {
                date: date,
                user_name: uName,
                cell_name: authUser?.cell_name || '내 목장',
                type: 'QT',
                status: '출석'
              },
              { onConflict: 'date,user_name,type' }
            )
            .then();
        }
      }
    } catch (e) {}
  };

  const handleGraceLineSync = (val) => {
    if (updateDay) {
      updateDay({ qtGraceLine: val });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map((item) => {
        if (item.date === date && item.source === 'qt') {
          return { ...item, graceLine: val };
        }
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
      setTodayActionItems(updated.filter((item) => item.date === date && item.source === 'qt'));
    } catch (e) {}
  };

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  }, []);

  const handleInsertArcInsightToQt = useCallback(
    (insightText) => {
      if (!updateDay) return;
      const prevMed = currDay?.qtMeditation || '';
      const nextMed = prevMed ? `${prevMed}\n${insightText}` : insightText.trim();
      updateDay({
        qtMeditation: nextMed,
        checks: { ...(currDay?.checks || {}), QTin: true }
      });
      showToast('신·구약 구속사 대조 해설이 나의 묵상 노트에 기록되었습니다.');
    },
    [currDay, updateDay, showToast]
  );

  const inlineActionSendToTracker = () => {
    const textToPush = currDay.qtActionItem || currDay.qtGraceLine || currDay.qtMeditation || 'QT 적용 실천';
    handleActionItemSync(textToPush);
    showToast('오늘의 적용 트래커에 등록되었습니다.');
  };

  const toggleInlineActionComplete = (itemId) => {
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map((item) => {
        if (item.id === itemId) return { ...item, completed: !item.completed };
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
      setTodayActionItems(updated.filter((item) => item.date === date && item.source === 'qt'));
      if (triggerConfetti) triggerConfetti();
    } catch (e) {}
  };

  const inlineActionSendToPrayer = () => {
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_qt_${Date.now()}`,
        title: `[QT묵상] ${currDay.qtTitle || currDay.qtReference || date} 기도의 제목`,
        content: encryptField(currDay.qtMeditation || currDay.qtGraceLine || '말씀을 묵상하며 회개하고 구하는 기도'),
        date: date,
        answered: false
      };
      const updated = [newPrayer, ...prayers];
      localStorage.setItem('prayer_items', JSON.stringify(updated));
      setTodayPrayers(updated.filter((item) => item.date === date));
      showToast('나의 기도함에 저장되었습니다.');
    } catch (e) {
      showToast('기도함 저장 중 오류가 발생했습니다.');
    }
  };

  const inlineActionSendToCounseling = async () => {
    try {
      const counselingPayload = {
        user_name: authUser?.name || '성도',
        cell_name: authUser?.cell_name || '소속 목장',
        title: `[심층 QT 상담 요청] ${currDay.qtReference || date}`,
        content: encryptField(`본문: ${currDay.qtReference}\n질문/고민: ${currDay.qtAppQuestion || currDay.qtMeditation || '심층 상담이 필요합니다.'}`),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('counseling_qna').insert([counselingPayload]);
      }
      localStorage.setItem(`counseling_sent_${date}`, 'true');
      setCounselingStatus('pending');
      showToast('목자/사역자에게 1:1 비공개 상담이 접수되었습니다.');
    } catch (e) {
      showToast('심층 상담 전송 중 오류가 발생했습니다.');
    }
  };

  // =====================================================================
  // 3색 조화 팔레트 (메인 블루 #2563EB + 세이지 그린 #0D9488 + 웜 앰버 #D97706)
  // =====================================================================
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subSurfaceBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const dividerClass = isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  // 조화로운 서브 뱃지·버튼 스타일
  const sagePillClass = isDark
    ? 'bg-[#0D9488]/15 text-[#5EEAD4] hover:bg-[#0D9488]/25'
    : 'bg-[#0D9488]/10 text-[#0F766E] hover:bg-[#0D9488]/15';
  const amberPillClass = isDark
    ? 'bg-[#D97706]/15 text-[#FCD34D] hover:bg-[#D97706]/25'
    : 'bg-[#D97706]/10 text-[#B45309] hover:bg-[#D97706]/15';
  const bluePillClass = isDark
    ? 'bg-[#2563EB]/15 text-[#93C5FD] hover:bg-[#2563EB]/25'
    : 'bg-[#2563EB]/10 text-[#1D4ED8] hover:bg-[#2563EB]/15';

  return (
    <div className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none ${pageBg}`}>
      {/* 성경 아크 & 은하계 인라인 팝업 모달 */}
      <BibleGalaxyArcModal
        isOpen={galaxyModalConfig.isOpen}
        onClose={() => setGalaxyModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialMode={galaxyModalConfig.mode}
        initialRefQuery={galaxyModalConfig.refQuery}
        onInsertInsight={handleInsertArcInsightToQt}
        setActiveScreen={setActiveScreen}
      />

      {/* 백링크 드로어 */}
      {activeBacklink && (
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-[360px] z-[200] flex flex-col border-l shadow-xl ${borderClass} ${surfaceBg}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#0D9488]" />
              <h3 className={`text-[15px] font-bold ${textMain}`}>{activeBacklink} 묵상 기록</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveBacklink(null)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} ${textMain} cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`px-5 py-3 border-b ${borderClass} grid grid-cols-2 gap-2`}>
            <button
              type="button"
              onClick={() => openGalaxyPopup('arc', activeBacklink)}
              className={`py-2 px-2.5 rounded-lg font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer ${amberPillClass}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>신구약 아크</span>
            </button>
            <button
              type="button"
              onClick={() => openGalaxyPopup('2d', activeBacklink)}
              className={`py-2 px-2.5 rounded-lg font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer ${bluePillClass}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>은하계 연관</span>
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto px-5 divide-y ${dividerClass} hide-scrollbar pointer-events-auto`}>
            {relatedEntries.length === 0 ? (
              <div className={`py-12 text-center text-[14px] ${textSub}`}>이 구절을 묵상한 첫 기록입니다.</div>
            ) : (
              relatedEntries.map(([dKey, dVal]) => (
                <div key={dKey} className="py-4 space-y-1.5">
                  <span className={`text-[12px] font-medium ${textSub} block`}>{dKey}</span>
                  <p className={`text-[14px] leading-relaxed line-clamp-4 ${textMain}`}>
                    {(dVal.qtGoldenVerse || dVal.qtMeditation || dVal.sermonNotes || dVal.qtGraceLine || '').replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src="https://upload.wikimedia.org/wikipedia/commons/c/c8/J.S._Bach_-_Well-Tempered_Clavier_1_-_Prelude_and_Fugue_No._1_in_C_major_%28BWV_846%29_-_Klaus_Schiff_%28piano%29.ogg"
        loop
        preload="auto"
        playsInline
      />

      {/* 상단 고정 글로벌 헤더 */}
      <header
        className={`shrink-0 px-3 sm:px-6 h-14 flex items-center justify-between z-20 border-b relative ${borderClass} ${surfaceBg}`}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#191F28]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className={`text-[17px] font-bold tracking-tight ${textMain} whitespace-nowrap`}>매일 큐티</h1>
            <span className={`hidden sm:inline-block text-[12px] font-bold px-2 py-0.5 rounded-md ${sagePillClass}`}>
              진행률 {qtCompletionPercent}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => openGalaxyPopup('arc')}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${amberPillClass}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>아크 대조</span>
          </button>

          <button
            type="button"
            onClick={() => openGalaxyPopup('2d')}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${bluePillClass}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>은하계</span>
          </button>

          <button
            type="button"
            onClick={toggleBGM}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              isAudioPlaying ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textSub}`
            }`}
          >
            {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isAudioPlaying ? '찬양 켜짐' : '찬양'}</span>
          </button>

          <button
            type="button"
            onClick={() => openGlobalDrawer && openGlobalDrawer('applyTracker')}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subSurfaceBg} ${textMain}`}
          >
            <Target className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">트래커</span>
          </button>

          <button
            type="button"
            onClick={() => openGlobalDrawer && openGlobalDrawer('prayerBox')}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subSurfaceBg} ${textMain}`}
          >
            <HandHeart className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">기도함</span>
          </button>

          {qtSubView === 'myQt' && (
            <>
              <button
                type="button"
                onClick={() => setShowToolbar(!showToolbar)}
                className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  showToolbar ? 'bg-[#191F28] text-white dark:bg-white dark:text-[#101216]' : `${subSurfaceBg} ${textMain}`
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showToolbar ? '닫기' : '필기'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleTrainingMode}
                className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  isTrainingMode ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>10단계</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#191F28]'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 능동형 진행률 헤어라인 인디케이터 */}
      <div className={`w-full h-[2px] ${subSurfaceBg} shrink-0`}>
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#0D9488] transition-all duration-500"
          style={{ width: `${qtCompletionPercent}%` }}
        />
      </div>

      {actionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#191F28] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-[#0D9488]" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 서브 탭 바 */}
      <div className={`flex w-full px-3 sm:px-6 border-b ${borderClass} ${surfaceBg} shrink-0 relative z-20 gap-5`}>
        <button
          type="button"
          onClick={() => setQtSubView('myQt')}
          className={`py-3 text-[15px] font-bold border-b-2 transition-colors cursor-pointer ${
            qtSubView === 'myQt'
              ? 'border-[#2563EB] text-[#2563EB]'
              : `border-transparent ${textSub}`
          }`}
        >
          나의 묵상 노트
        </button>
        <button
          type="button"
          onClick={() => setQtSubView('community')}
          className={`py-3 text-[15px] font-bold border-b-2 transition-colors cursor-pointer ${
            qtSubView === 'community'
              ? 'border-[#0D9488] text-[#0D9488]'
              : `border-transparent ${textSub}`
          }`}
        >
          공동체 큐티 나눔터
        </button>
      </div>

      {qtSubView === 'myQt' && showToolbar && (
        <div className={`relative z-20 w-full px-3 sm:px-6 py-2 border-b ${borderClass} ${surfaceBg} shrink-0 overflow-x-auto hide-scrollbar`}>
          {renderToolbar && renderToolbar(qtEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 메인 묵상 워크스페이스: 모바일 풀블리드 / 태블릿·PC 2단 와이드 분할 */}
      {/* ===================================================================== */}
      {qtSubView === 'myQt' && CanvasEngine && (
        <CanvasEngine
          key={`qt_${date}`}
          saveKey={`qt_${date}`}
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          t={t}
          renderStickers={() =>
            StickerLayer ? (
              <StickerLayer
                memos={currDay.memos}
                stickers={currDay.stickers}
                onUpdateMemos={(m) => updateDay({ memos: m })}
                onUpdateStickers={(s) => updateDay({ stickers: s })}
                onPtrDown={onPtrDown}
              />
            ) : null
          }
        >
          <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2 sm:px-5 lg:px-8 pt-3 sm:pt-5 pb-24 relative z-10 max-w-[1320px] mx-auto">
            {isTrainingMode && (
              <div className={`ignore-draw mb-4 px-4 py-3 rounded-xl ${surfaceBg} border ${borderClass} flex items-center justify-between gap-3 select-none`}>
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span className={`text-[13px] font-medium ${textMain}`}>
                    10단계 심층 훈련 모드 활성화됨 — 4~10단계는 질문·묵상·적용 작성 시 자동 체크됩니다.
                  </span>
                </div>
              </div>
            )}

            {/* 반응형 12컬럼 그리드: 모바일 1단 풀폭 / PC·태블릿 좌측 5컬럼(영상·본문) + 우측 7컬럼(묵상·적용) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* =============================================================== */}
              {/* [좌측 컬럼] 대형 와이드 유튜브 영상 + 본문/황금구절 + 출석 달력 */}
              {/* =============================================================== */}
              <div className={`${isVideoExpanded ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4`}>
                {/* 1. 대형 16:9 큐티 영상 섹션 (모바일 풀폭 · PC 대형 뷰) */}
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-4 py-3 border-b ${borderClass} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#2563EB]" />
                      <h2 className={`text-[15px] font-bold ${textMain}`}>오늘의 큐티 영상</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.youtube.com/results?search_query=김양재 목사 큐티노트+${ymdStr}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-2.5 py-1 rounded-lg text-[12px] font-bold ${bluePillClass}`}
                      >
                        유튜브 검색
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsVideoExpanded((prev) => !prev)}
                        className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}
                        title="영상 화면 크기 전환"
                      >
                        {isVideoExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span>{isVideoExpanded ? '기본 크기' : '크게 보기'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 와이드 16:9 비디오 플레이어 (좌우 여백 없이 꽉 차게 배치) */}
                  <div className="w-full aspect-video bg-black relative">
                    {currentVideoId ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&enablejsapi=1`}
                        title="QT Video"
                        frameBorder="0"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                        <Video className="w-8 h-8 text-white/30" />
                        <p className="text-[14px] text-white/60">유튜브 링크를 입력하면 영상이 크게 재생됩니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 유튜브 링크 입력 & 완료 체크 */}
                  <div className="p-3.5 space-y-2.5 ignore-draw">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="유튜브 영상 링크 붙여넣기"
                        value={currDay.qtVideoUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          const vId = extractVideoId ? extractVideoId(url) : null;
                          updateDay && updateDay({ qtVideoUrl: url, qtVideoId: vId !== null ? vId : '', checks: { ...(currDay.checks || {}), QTin: true } });
                        }}
                        className={`flex-1 min-w-0 px-3 py-2 rounded-xl text-[14px] outline-none ${subSurfaceBg} ${textMain}`}
                      />
                      <button
                        type="button"
                        onClick={handleShareVideo}
                        className={`shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer ${subSurfaceBg} ${textMain}`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>공유</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateDay && updateDay({ checks: { ...(currDay.checks || {}), QTin: true } });
                        triggerConfetti && triggerConfetti();
                        handleActionItemSync(currDay.qtActionItem || currDay.qtGraceLine || '영상 묵상 완수');
                        showToast('영상 시청 완료 및 출석 기록이 저장되었습니다.');
                      }}
                      className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        currDay?.checks?.['QTin'] ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{currDay?.checks?.['QTin'] ? '오늘의 큐티 시청 완료됨' : '영상 시청 완료 체크'}</span>
                    </button>
                  </div>
                </section>

                {/* 2. 본문 정보 & 황금 구절 (박스 안 박스 제거 -> 깔끔한 입력 라인) */}
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} divide-y ${dividerClass}`}>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className={`text-[12px] font-bold ${textSub} block mb-1`}>큐티 제목</label>
                      <input
                        type="text"
                        value={currDay.qtTitle || globalSharedQt?.[date]?.title || ''}
                        onChange={(e) => updateDay && updateDay({ qtTitle: e.target.value, checks: { ...(currDay.checks || {}), QTin: true } })}
                        placeholder="오늘 나에게 주시는 큐티 제목을 입력하세요"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-[15px] font-bold outline-none ${subSurfaceBg} ${textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`text-[12px] font-bold ${textSub} block mb-1`}>성경 본문 구절</label>
                      <div className="flex flex-wrap sm:flex-nowrap gap-1.5 ignore-draw items-center">
                        <input
                          type="text"
                          value={currDay.qtReference || globalSharedQt?.[date]?.reference || ''}
                          onChange={(e) => updateDay && updateDay({ qtReference: e.target.value, checks: { ...(currDay.checks || {}), QTin: true } })}
                          placeholder="예: 신명기 17:14-20"
                          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-[14px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                        />
                        <button
                          type="button"
                          onClick={() => findBibleText && findBibleText(currDay.qtReference || globalSharedQt?.[date]?.reference)}
                          className={`shrink-0 px-3 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer ${bluePillClass}`}
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>본문</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openGalaxyPopup('arc', currDay.qtReference || globalSharedQt?.[date]?.reference)}
                          className={`shrink-0 px-2.5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer ${amberPillClass}`}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>아크</span>
                        </button>
                      </div>
                    </div>

                    <div className="ignore-draw">
                      <label className="text-[12px] font-bold text-[#D97706] block mb-1">오늘의 황금 구절</label>
                      <input
                        type="text"
                        value={currDay.qtGoldenVerse || ''}
                        onChange={(e) => updateDay && updateDay({ qtGoldenVerse: e.target.value })}
                        placeholder="가슴에 새길 핵심 말씀 한 구절을 적어보세요"
                        className={`w-full px-3.5 py-2.5 rounded-xl outline-none text-[14px] leading-relaxed ${subSurfaceBg} ${textMain}`}
                      />
                    </div>
                  </div>

                  {/* 능동형 감지 구절 바 */}
                  {linkedRefs.length > 0 && (
                    <div className="ignore-draw px-4 py-3 space-y-2">
                      <span className="text-[12px] font-bold text-[#D97706] block">
                        감지된 성경 구절 ({linkedRefs.length}건)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedRefs.map((ref) => (
                          <div key={ref} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${subSurfaceBg} text-[12px] font-bold ${textMain}`}>
                            <span>{ref}</span>
                            <button
                              type="button"
                              onClick={() => openGalaxyPopup('arc', ref)}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${amberPillClass}`}
                            >
                              아크
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBacklink(ref)}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                                activeBacklink === ref ? 'bg-[#0D9488] text-white' : sagePillClass
                              }`}
                            >
                              과거묵상
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 하단 심층 연구 바로가기 */}
                  <div className={`grid grid-cols-2 divide-x ${dividerClass} ignore-draw`}>
                    <button
                      type="button"
                      onClick={() => setActiveScreen && setActiveScreen('qtArchiveDetail')}
                      className={`py-3 text-[12.5px] font-bold ${textMain} flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`}
                    >
                      <BookOpen className="w-4 h-4 text-[#0D9488]" />
                      <span>큐티 심층 분석</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScreen && setActiveScreen('bibleWikiAdvanced')}
                      className={`py-3 text-[12.5px] font-bold ${textMain} flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`}
                    >
                      <Search className="w-4 h-4 text-[#2563EB]" />
                      <span>성경 지식 위키</span>
                    </button>
                  </div>

                  {isTrainingMode && (
                    <div className={`ignore-draw px-4 py-2 divide-y ${dividerClass}`}>
                      <TrainingRow
                        id="step1"
                        num="1"
                        title="기도하기 (깨닫는 마음 구하기)"
                        desc="조용한 시간과 장소를 마련하고 성경을 펼치기 전, 깨닫는 마음을 구하는 기도로 시작합니다."
                        isChecked={!!trainingChecks['step1']}
                        onToggle={toggleTrainingCheck}
                        isDark={isDark}
                      />
                      <TrainingRow
                        id="step2"
                        num="2"
                        title="본문읽기 (소리 내어 반복 정독)"
                        desc="소리 내어 한 번, 눈으로 한 번, 마음으로 한 번 반복해 읽어보세요."
                        isChecked={!!trainingChecks['step2']}
                        onToggle={toggleTrainingCheck}
                        isDark={isDark}
                      />
                      <TrainingRow
                        id="step3"
                        num="3"
                        title="큐티노트 (생각과 질문 메모)"
                        desc="눈으로만 읽지 말고 떠오르는 생각·질문·느낌을 그 자리에서 적습니다."
                        isChecked={!!trainingChecks['step3']}
                        onToggle={toggleTrainingCheck}
                        isDark={isDark}
                      />
                    </div>
                  )}
                </section>

                {/* 3. 출석 달력 스탬프 */}
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 ignore-draw`}>
                  <div onClick={() => setShowFullCalendar(!showFullCalendar)} className="flex justify-between items-center cursor-pointer select-none">
                    <span className={`font-bold text-[14px] flex items-center gap-2 ${textMain}`}>
                      <Calendar className="w-4 h-4 text-[#0D9488]" />
                      <span>{currMonth}월 큐티 출석 스탬프</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#8B95A1] transition-transform ${showFullCalendar ? 'rotate-180' : ''}`} />
                  </div>

                  {showFullCalendar && (
                    <div className={`mt-3.5 pt-3.5 border-t ${borderClass}`}>
                      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                        {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                          <div key={w} className={`text-[12px] font-bold ${i === 0 ? 'text-[#2563EB]' : textSub}`}>
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }, (_, i) => i).map((e) => (
                          <div key={`empty-${e}`} className="w-full aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isS = dailyData[dStr]?.checks?.['QTin'] === true;
                          const isT = dStr === date;
                          return (
                            <div
                              key={day}
                              onClick={() => {
                                const nS = !isS;
                                updateDay && updateDay({ checks: { ...(currDay.checks || {}), QTin: nS } });
                                if (nS && triggerConfetti) triggerConfetti();
                              }}
                              className={`relative flex items-center justify-center aspect-square rounded-lg cursor-pointer select-none transition-colors ${
                                isT ? 'ring-1 ring-[#2563EB]' : ''
                              } ${isS ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`}`}
                            >
                              <span className="text-[12px] font-bold">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* =============================================================== */}
              {/* [우측 컬럼] 질문 · 묵상 · 적용 기록장 (박스 안 박스 없이 시원한 폭) */}
              {/* =============================================================== */}
              <div className={`${isVideoExpanded ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} overflow-hidden divide-y ${dividerClass}`}>
                  {/* 1. 적용 질문 */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[16px] font-bold flex items-center gap-2 ${textMain}`}>
                        <Target className="w-4 h-4 text-[#2563EB]" />
                        <span>적용 질문</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openGalaxyPopup('arc')}
                        className={`ignore-draw px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${amberPillClass}`}
                      >
                        신구약 아크 대조
                      </button>
                    </div>

                    {isTrainingMode && (
                      <div className={`ignore-draw divide-y ${dividerClass} border-t border-b ${borderClass} my-1`}>
                        <TrainingRow
                          id="step4"
                          num="4"
                          title="본문요약 (핵심 3~4줄 압축)"
                          desc="여러 번 읽은 뒤 전체의 핵심 내용을 3~4줄로 간단히 요약합니다."
                          isChecked={!!trainingChecks['step4']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                        <TrainingRow
                          id="step5"
                          num="5"
                          title="질문하기 (구속사적 질문 도출)"
                          desc="마음에 걸리거나 더 깊이 생각해야 할 부분을 질문 형태로 뽑아냅니다."
                          isChecked={!!trainingChecks['step5']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                        <TrainingRow
                          id="step6"
                          num="6"
                          title="묵상하기 (삶의 명령과 약속 마주하기)"
                          desc="본문을 오늘 내 삶에 주시는 명령과 약속으로 대합니다."
                          isChecked={!!trainingChecks['step6']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                      </div>
                    )}

                    <textarea
                      value={currDay.qtAppQuestion || ''}
                      onChange={(e) => updateDay && updateDay({ qtAppQuestion: e.target.value })}
                      onInput={autoGrowTextarea}
                      rows={3}
                      className={`w-full p-3.5 rounded-xl resize-none outline-none text-[15px] leading-[1.7] ${subSurfaceBg} ${textMain}`}
                      placeholder="본문을 읽으며 드는 솔직한 질문을 적어보세요"
                    />
                  </div>

                  {/* 2. 묵상하기 */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[16px] font-bold flex items-center gap-2 ${textMain}`}>
                        <BookOpen className="w-4 h-4 text-[#0D9488]" />
                        <span>묵상하기 (내 죄 보기)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openGalaxyPopup('2d')}
                        className={`ignore-draw px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${bluePillClass}`}
                      >
                        은하계 연관 보기
                      </button>
                    </div>

                    {isTrainingMode && (
                      <div className={`ignore-draw divide-y ${dividerClass} border-t border-b ${borderClass} my-1`}>
                        <TrainingRow
                          id="step7"
                          num="7"
                          title="적용하기 (구체적인 행동 결단)"
                          desc="묵상한 내용을 어떻게 실천할지 구체적으로 적고 행동으로 옮깁니다."
                          isChecked={!!trainingChecks['step7']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                        <TrainingRow
                          id="step8"
                          num="8"
                          title="말씀대로 기도하기"
                          desc="오늘 받은 말씀을 붙들고 그 말씀의 언어로 하나님께 기도합니다."
                          isChecked={!!trainingChecks['step8']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                      </div>
                    )}

                    <textarea
                      value={currDay.qtMeditation || ''}
                      onChange={(e) => updateDay && updateDay({ qtMeditation: e.target.value })}
                      onInput={autoGrowTextarea}
                      rows={5}
                      className={`w-full p-3.5 rounded-xl resize-none outline-none text-[15px] leading-[1.7] ${subSurfaceBg} ${textMain}`}
                      placeholder="말씀을 통해 깨달은 나의 죄와 은혜를 깊이 있게 적어보세요"
                    />
                  </div>

                  {/* 3. 적용하기 */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <label className={`text-[16px] font-bold flex items-center gap-2 ${textMain}`}>
                      <HandHeart className="w-4 h-4 text-[#D97706]" />
                      <span>적용하기</span>
                    </label>

                    {isTrainingMode && (
                      <div className={`ignore-draw divide-y ${dividerClass} border-t border-b ${borderClass} my-1`}>
                        <TrainingRow
                          id="step9"
                          num="9"
                          title="본문해설 (스스로 묵상 후 대조)"
                          desc="스스로 충분히 묵상한 뒤에야 구속사적 본문해설을 참고합니다."
                          isChecked={!!trainingChecks['step9']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                        <TrainingRow
                          id="step10"
                          num="10"
                          title="은혜나누기 (목장 공동체와 연합)"
                          desc="그날 받은 은혜를 목장·소그룹 등 공동체와 나눕니다."
                          isChecked={!!trainingChecks['step10']}
                          onToggle={toggleTrainingCheck}
                          isDark={isDark}
                        />
                      </div>
                    )}

                    <textarea
                      value={currDay.qtApplication || ''}
                      onChange={(e) => updateDay && updateDay({ qtApplication: e.target.value })}
                      onInput={autoGrowTextarea}
                      rows={3}
                      className={`w-full p-3.5 rounded-xl resize-none outline-none text-[15px] leading-[1.7] ${subSurfaceBg} ${textMain}`}
                      placeholder="오늘 하루 어떻게 구체적으로 실천할까요?"
                    />
                  </div>

                  {/* 4. 한줄 은혜 및 실천 목표 + 원스트림 연동 */}
                  <div className="p-4 sm:p-5 space-y-3 ignore-draw">
                    <span className={`font-bold text-[15px] ${textMain} block`}>한줄 은혜 및 실천 목표</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={currDay.qtGraceLine || ''}
                        onChange={(e) => handleGraceLineSync(e.target.value)}
                        placeholder="오늘의 핵심 은혜 한 줄 요약"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none ${subSurfaceBg} ${textMain}`}
                      />
                      <input
                        type="text"
                        value={currDay.qtActionItem || ''}
                        onChange={(e) => handleActionItemSync(e.target.value)}
                        onBlur={(e) => {
                          if (logUserAction && authUser?.name && e.target.value) {
                            logUserAction(authUser.name, '매일QT', 'write', `[실천목표] ${e.target.value}`);
                          }
                        }}
                        placeholder="오늘의 실천 목표 (예: 먼저 따뜻하게 인사하기)"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none ${subSurfaceBg} ${textMain}`}
                      />
                    </div>

                    {/* 3색 조화 원스트림 연동 버튼 (세이지 그린 / 메인 블루 / 웜 앰버) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={inlineActionSendToTracker}
                        className="py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Target className="w-4 h-4" />
                        <span>트래커에 실천 등록</span>
                      </button>
                      <button
                        type="button"
                        onClick={inlineActionSendToPrayer}
                        className="py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <HandHeart className="w-4 h-4" />
                        <span>나의 기도함에 저장</span>
                      </button>
                      <button
                        type="button"
                        onClick={inlineActionSendToCounseling}
                        className={`py-2.5 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${amberPillClass}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>1:1 심층상담 요청</span>
                      </button>
                    </div>

                    {/* 연동된 오늘의 현황 리스트 */}
                    {(todayActionItems.length > 0 || todayPrayers.length > 0 || counselingStatus) && (
                      <div className={`pt-3 mt-2 border-t ${borderClass} space-y-2`}>
                        {todayActionItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleInlineActionComplete(item.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl ${subSurfaceBg} cursor-pointer`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                item.completed ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'border-[#8B95A1]'
                              }`}
                            >
                              {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-[14px] ${item.completed ? 'line-through text-[#8B95A1]' : textMain}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}

                        {todayPrayers.map((p) => (
                          <div key={p.id} className={`p-3 rounded-xl ${subSurfaceBg} text-[13px] ${textSub}`}>
                            기도함 저장됨: <strong className={textMain}>{p.title}</strong>
                          </div>
                        ))}

                        {counselingStatus && (
                          <div className={`p-3 rounded-xl ${subSurfaceBg} text-[13px] ${textSub} space-y-1`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${textMain}`}>1:1 심층 상담 현황</span>
                              <span className="text-[#D97706] font-bold">{counselingReplyData ? '답변 도착' : '접수 대기 중'}</span>
                            </div>
                            {counselingReplyData && <p className={`text-[14px] ${textMain} pt-1`}>{counselingReplyData}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </CanvasEngine>
      )}

      {/* 서브 뷰 2: 공동체 큐티 나눔터 */}
      {qtSubView === 'community' && (
        <CommunityQtSquareInner
          authUser={authUser}
          isDarkMode={isDarkMode}
          date={date}
          bibles={bibles}
          onOpenGalaxyPopup={openGalaxyPopup}
        />
      )}
    </div>
  );
}

// =====================================================================
// 공동체 큐티 나눔 광장 (3색 조화 팔레트 · 박스 중첩 제거 · 이모지 0%)
// =====================================================================
const FULL_BIBLE_MAP_QT = {
  창: 'Genesis',
  창세기: 'Genesis',
  출: 'Exodus',
  출애굽기: 'Exodus',
  레: 'Leviticus',
  레위기: 'Leviticus',
  민: 'Numbers',
  민수기: 'Numbers',
  신: 'Deuteronomy',
  신명기: 'Deuteronomy',
  수: 'Joshua',
  여호수아: 'Joshua',
  삿: 'Judges',
  사사기: 'Judges',
  룻: 'Ruth',
  룻기: 'Ruth',
  삼상: '1 Samuel',
  사무엘상: '1 Samuel',
  삼하: '2 Samuel',
  사무엘하: '2 Samuel',
  왕상: '1 Kings',
  열왕기상: '1 Kings',
  왕하: '2 Kings',
  열왕기하: '2 Kings',
  대상: '1 Chronicles',
  역대상: '1 Chronicles',
  대하: '2 Chronicles',
  역대하: '2 Chronicles',
  스: 'Ezra',
  에스라: 'Ezra',
  느: 'Nehemiah',
  느헤미야: 'Nehemiah',
  에: 'Esther',
  에스더: 'Esther',
  욥: 'Job',
  욥기: 'Job',
  시: 'Psalms',
  시편: 'Psalms',
  잠: 'Proverbs',
  잠언: 'Proverbs',
  전: 'Ecclesiastes',
  전도서: 'Ecclesiastes',
  아: 'Song of Solomon',
  아가: 'Song of Solomon',
  사: 'Isaiah',
  이사야: 'Isaiah',
  렘: 'Jeremiah',
  예레미야: 'Jeremiah',
  애: 'Lamentations',
  예레미야애가: 'Lamentations',
  겔: 'Ezekiel',
  에스겔: 'Ezekiel',
  단: 'Daniel',
  다니엘: 'Daniel',
  호: 'Hosea',
  호세아: 'Hosea',
  욜: 'Joel',
  요엘: 'Joel',
  암: 'Amos',
  아모스: 'Amos',
  옵: 'Obadiah',
  오바댜: 'Obadiah',
  욘: 'Jonah',
  요나: 'Jonah',
  미: 'Micah',
  미가: 'Micah',
  나: 'Nahum',
  나훔: 'Nahum',
  합: 'Habakkuk',
  하박국: 'Habakkuk',
  습: 'Zephaniah',
  스바냐: 'Zephaniah',
  학: 'Haggai',
  학개: 'Haggai',
  슥: 'Zechariah',
  스가랴: 'Zechariah',
  말: 'Malachi',
  말라기: 'Malachi',
  마: 'Matthew',
  마태: 'Matthew',
  마태복음: 'Matthew',
  막: 'Mark',
  마가: 'Mark',
  마가복음: 'Mark',
  눅: 'Luke',
  누가: 'Luke',
  누가복음: 'Luke',
  요: 'John',
  요한: 'John',
  요한복음: 'John',
  행: 'Acts',
  사도행전: 'Acts',
  롬: 'Romans',
  로마서: 'Romans',
  고전: '1 Corinthians',
  고린도전서: '1 Corinthians',
  고후: '2 Corinthians',
  고린도후서: '2 Corinthians',
  갈: 'Galatians',
  갈라디아서: 'Galatians',
  엡: 'Ephesians',
  에베소서: 'Ephesians',
  빌: 'Philippians',
  빌립보서: 'Philippians',
  골: 'Colossians',
  골로새서: 'Colossians',
  살전: '1 Thessalonians',
  데살로니가전서: '1 Thessalonians',
  살후: '2 Thessalonians',
  데살로니가후서: '2 Thessalonians',
  딤전: '1 Timothy',
  디모데전서: '1 Timothy',
  딤후: '2 Timothy',
  디모데후서: '2 Timothy',
  딛: 'Titus',
  디도서: 'Titus',
  몬: 'Philemon',
  빌레몬서: 'Philemon',
  히: 'Hebrews',
  히브리서: 'Hebrews',
  약: 'James',
  야고보서: 'James',
  벧전: '1 Peter',
  베드로전서: '1 Peter',
  벧후: '2 Peter',
  베드로후서: '2 Peter',
  요일: '1 John',
  요한일서: '1 John',
  요이: '2 John',
  요한이서: '2 John',
  요삼: '3 John',
  요한삼서: '3 John',
  유: 'Jude',
  유다서: 'Jude',
  계: 'Revelation',
  요한계시록: 'Revelation'
};

function CommunityQtSquareInner({ authUser, isDarkMode, date, bibles = [], onOpenGalaxyPopup }) {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyTarget, setReplyTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);

  const [form, setForm] = useState({
    hardPart: '',
    meditationShare: '',
    pastorGuide: '',
    isPastorNotice: false
  });

  const userName = authUser?.name || '성도';
  const userRole = authUser?.role || '목원';

  const isPastor = userRole === '목사' || userRole === '운영자' || userName === '정신동';
  const isDark = isDarkMode;

  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subSurfaceBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const dividerClass = isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  const todayQtData = useMemo(() => {
    try {
      const daily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      return daily[date] || {};
    } catch {
      return {};
    }
  }, [date]);

  const fetchPostsAndComments = useCallback(async () => {
    if (!supabase) return;
    const { data: pData } = await supabase
      .from('community_qt_posts')
      .select('*')
      .eq('date', date)
      .order('is_pastor_notice', { ascending: false })
      .order('created_at', { ascending: false });

    if (pData) {
      const decryptedPosts = pData.map((p) => ({
        ...p,
        hard_part: decryptField(p.hard_part),
        meditation_share: decryptField(p.meditation_share),
        pastor_guide: decryptField(p.pastor_guide)
      }));
      setPosts(decryptedPosts);

      const postIds = pData.map((p) => p.id);
      if (postIds.length > 0) {
        const { data: cData } = await supabase
          .from('community_qt_comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (cData) {
          const map = {};
          cData.forEach((c) => {
            if (!map[c.post_id]) map[c.post_id] = [];
            map[c.post_id].push({
              ...c,
              content: decryptField(c.content)
            });
          });
          setComments(map);
        }
      }
    }
  }, [date]);

  useEffect(() => {
    fetchPostsAndComments();

    if (!supabase) return;
    let isMounted = true;
    const sub = supabase
      .channel(`community_qt_channel_${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_qt_posts' }, () => {
        if (isMounted) fetchPostsAndComments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_qt_comments' }, () => {
        if (isMounted) fetchPostsAndComments();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, [date, fetchPostsAndComments]);

  const handleBibleAutoComplete = (e, field) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const target = e.target;
      const val = target.value;
      const cursorPos = target.selectionStart;
      const beforeText = val.substring(0, cursorPos);
      const match = beforeText.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(\d+)(?:절)?$/);

      if (match && Array.isArray(bibles) && bibles.length > 0) {
        const bookRaw = match[1];
        const chapNum = parseInt(match[2], 10);
        const verseNum = parseInt(match[3], 10);

        const engBook = FULL_BIBLE_MAP_QT[bookRaw];
        if (engBook) {
          const foundBook = bibles.find((b) => b.name === engBook);
          if (foundBook && foundBook.chapters && foundBook.chapters[chapNum - 1]) {
            const verseText = foundBook.chapters[chapNum - 1][verseNum - 1];
            if (verseText) {
              e.preventDefault();
              const cleanVerse = verseText.replace(/ |'|\x1B/gi, '').trim();
              const replacement = `\n[${bookRaw} ${chapNum}:${verseNum}] "${cleanVerse}"\n`;
              const startIdx = beforeText.length - match[0].length;
              const nextVal = val.substring(0, startIdx) + replacement + val.substring(cursorPos);

              setForm((prev) => ({ ...prev, [field]: nextVal }));
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = startIdx + replacement.length;
              }, 0);
            }
          }
        }
      }
    }
  };

  const handlePublishPost = async () => {
    const isWritingAsPastor = isPastor && form.isPastorNotice;

    if (isWritingAsPastor) {
      if (!form.hardPart.trim() && !form.meditationShare.trim()) {
        return alert('오늘의 큐티 해석 또는 묵상 이야기를 입력해주세요.');
      }
    } else {
      if (!form.meditationShare.trim() && !form.hardPart.trim()) {
        return alert('묵상 나눔 또는 어려운 부분을 입력해주세요.');
      }
    }

    const payload = {
      date: date,
      author_name: userName,
      author_role: userRole,
      qt_title: todayQtData.qtTitle || '오늘의 묵상',
      qt_reference: todayQtData.qtReference || date,
      app_question: todayQtData.qtAppQuestion || '',
      hard_part: encryptField(form.hardPart.trim()),
      meditation_share: encryptField(form.meditationShare.trim()),
      pastor_guide: isWritingAsPastor ? encryptField(form.meditationShare.trim()) : null,
      is_pastor_notice: isWritingAsPastor
    };

    if (supabase) {
      if (editingPostId) {
        const { error } = await supabase.from('community_qt_posts').update(payload).eq('id', editingPostId);
        if (error) return alert('수정 실패: ' + error.message);
      } else {
        const { error } = await supabase.from('community_qt_posts').insert([payload]);
        if (error) return alert('등록 실패: ' + error.message);
      }
    }

    setForm({ hardPart: '', meditationShare: '', pastorGuide: '', isPastorNotice: false });
    setEditingPostId(null);
    setShowWriteModal(false);
    fetchPostsAndComments();
  };

  const handleOpenEdit = (post) => {
    setEditingPostId(post.id);
    setForm({
      hardPart: post.hard_part || '',
      meditationShare: post.meditation_share || '',
      pastorGuide: post.pastor_guide || '',
      isPastorNotice: !!post.is_pastor_notice
    });
    setShowWriteModal(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말 이 묵상 나눔을 삭제하시겠습니까?')) return;
    if (supabase) {
      await supabase.from('community_qt_posts').delete().eq('id', postId);
      fetchPostsAndComments();
    }
  };

  const handleLike = async (postId, currentLikes) => {
    if (!supabase) return;
    await supabase
      .from('community_qt_posts')
      .update({ likes_count: (currentLikes || 0) + 1 })
      .eq('id', postId);
  };

  const handleAddComment = async (postId, parentId = null) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const payload = {
      post_id: postId,
      parent_id: parentId,
      author_name: userName,
      author_role: userRole,
      content: encryptField(text.trim())
    };

    if (supabase) {
      await supabase.from('community_qt_comments').insert([payload]);
      fetchPostsAndComments();
    }

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setReplyTarget(null);
  };

  const filteredPosts = useMemo(() => {
    if (activeTab === 'pastor') {
      return posts.filter((p) => p.is_pastor_notice);
    }
    return posts;
  }, [posts, activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden select-none">
      <div className={`flex px-3 sm:px-6 py-2.5 border-b ${borderClass} ${surfaceBg} shrink-0 relative z-20 gap-2 items-center justify-between`}>
        <div className={`flex gap-1 p-0.5 rounded-xl ${subSurfaceBg}`}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-[#0D9488] text-white' : textSub
            }`}
          >
            전체 나눔 ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pastor')}
            className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
              activeTab === 'pastor' ? 'bg-[#D97706] text-white' : textSub
            }`}
          >
            목사님 나눔
          </button>
        </div>

        {activeTab === 'pastor' ? (
          isPastor && (
            <button
              type="button"
              onClick={() => {
                setEditingPostId(null);
                setForm({ hardPart: '', meditationShare: '', pastorGuide: '', isPastorNotice: true });
                setShowWriteModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#D97706] text-white text-[12px] font-bold cursor-pointer"
            >
              목사님 나눔 작성
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingPostId(null);
              setForm({ hardPart: '', meditationShare: '', pastorGuide: '', isPastorNotice: false });
              setShowWriteModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white text-[12px] font-bold cursor-pointer"
          >
            나의 묵상 올리기
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 sm:px-6 pt-4 space-y-4 relative z-10 hide-scrollbar pb-24 w-full max-w-[920px] mx-auto">
        {filteredPosts.length === 0 ? (
          <div className={`p-10 rounded-2xl border ${borderClass} ${surfaceBg} text-center space-y-1.5`}>
            <p className={`text-[15px] font-bold ${textMain}`}>등록된 묵상 나눔이 없습니다.</p>
            <p className={`text-[12px] ${textSub}`}>
              {activeTab === 'pastor' ? '목사님의 말씀 나눔이 등록되면 이곳에 표시됩니다.' : '오늘 주신 은혜를 가장 먼저 나눠보세요.'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const allComments = comments[post.id] || [];
            const rootComments = allComments.filter((child) => !child.parent_id);
            const isMyPost = post.author_name === userName;

            return (
              <div key={post.id} className={`${surfaceBg} rounded-2xl border ${borderClass} overflow-hidden divide-y ${dividerClass}`}>
                <div className="px-4 sm:px-5 py-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-[15px] ${textMain}`}>{post.author_name}</span>
                    <span
                      className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
                        post.is_pastor_notice
                          ? 'bg-[#D97706]/15 text-[#D97706]'
                          : 'bg-[#0D9488]/15 text-[#0D9488]'
                      }`}
                    >
                      {post.is_pastor_notice ? '목사님 나눔' : post.author_role || '성도'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] ${textSub}`}>
                      {new Date(post.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isMyPost && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button type="button" onClick={() => handleOpenEdit(post)} className={`text-[12px] font-bold ${textSub} cursor-pointer`}>
                          수정
                        </button>
                        <button type="button" onClick={() => handleDeletePost(post.id)} className={`text-[12px] font-bold ${textSub} cursor-pointer`}>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className={`px-3.5 py-2 rounded-xl ${subSurfaceBg} text-[12px] font-bold ${textSub} flex items-center justify-between gap-2`}>
                    <span className="truncate">
                      {post.qt_reference} — {post.qt_title}
                    </span>
                    {onOpenGalaxyPopup && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenGalaxyPopup('arc', post.qt_reference)}
                          className="px-2 py-0.5 rounded-md bg-[#D97706]/15 text-[#D97706] text-[12px] font-bold cursor-pointer"
                        >
                          아크
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenGalaxyPopup('2d', post.qt_reference)}
                          className="px-2 py-0.5 rounded-md bg-[#2563EB]/15 text-[#2563EB] text-[12px] font-bold cursor-pointer"
                        >
                          은하계
                        </button>
                      </div>
                    )}
                  </div>

                  {post.hard_part && (
                    <div className="space-y-1">
                      <span className="font-bold text-[12px] text-[#D97706] block">
                        {post.is_pastor_notice ? '구속사적 해석' : '궁금한 구절 및 질문'}
                      </span>
                      <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${textMain}`}>{post.hard_part}</p>
                    </div>
                  )}

                  {post.meditation_share && (
                    <div className="space-y-1">
                      <span className="font-bold text-[12px] text-[#0D9488] block">
                        {post.is_pastor_notice ? '목양 권면' : '묵상 나눔 및 적용'}
                      </span>
                      <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${textMain}`}>{post.meditation_share}</p>
                    </div>
                  )}
                </div>

                <div className="px-4 sm:px-5 py-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id, post.likes_count)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${subSurfaceBg} ${textMain} cursor-pointer text-[12px] font-bold`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.likes_count > 0 ? 'fill-current text-[#0D9488]' : ''}`} />
                      <span>은혜와 공감</span>
                      <span>{post.likes_count || 0}</span>
                    </button>
                    <span className={`text-[12px] ${textSub}`}>댓글 {allComments.length}개</span>
                  </div>

                  {rootComments.length > 0 && (
                    <div className="space-y-2">
                      {rootComments.map((c) => {
                        const childComments = allComments.filter((child) => child.parent_id === c.id);
                        return (
                          <div key={c.id} className="space-y-1.5">
                            <div className={`p-3 rounded-xl ${subSurfaceBg} space-y-1`}>
                              <div className="flex justify-between items-center">
                                <span className={`font-bold text-[12px] ${textMain}`}>{c.author_name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[12px] ${textSub}`}>
                                    {new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setReplyTarget({ commentId: c.id, authorName: c.author_name, postId: post.id })}
                                    className="text-[12px] font-bold text-[#0D9488] cursor-pointer"
                                  >
                                    답글
                                  </button>
                                </div>
                              </div>
                              <p className={`text-[14px] leading-relaxed whitespace-pre-wrap ${textMain}`}>{c.content}</p>
                            </div>

                            {childComments.map((child) => (
                              <div key={child.id} className={`ml-4 p-3 rounded-xl ${subSurfaceBg} space-y-1`}>
                                <div className="flex justify-between items-center">
                                  <span className={`font-bold text-[12px] ${textMain} flex items-center gap-1`}>
                                    <CornerDownRight className="w-3.5 h-3.5 text-[#0D9488]" />
                                    <span>{child.author_name}</span>
                                  </span>
                                  <span className={`text-[12px] ${textSub}`}>
                                    {new Date(child.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className={`text-[14px] leading-relaxed whitespace-pre-wrap pl-4 ${textMain}`}>{child.content}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {replyTarget && replyTarget.postId === post.id && (
                      <div className={`flex justify-between items-center px-3 py-1.5 ${subSurfaceBg} rounded-xl text-[12px] ${textSub}`}>
                        <span>{replyTarget.authorName}님에게 답글 작성 중</span>
                        <button type="button" onClick={() => setReplyTarget(null)} className="cursor-pointer font-bold">
                          취소
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={replyTarget && replyTarget.postId === post.id ? '답글을 입력하세요' : '따뜻한 은혜의 댓글을 남겨보세요'}
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id, replyTarget && replyTarget.postId === post.id ? replyTarget.commentId : null);
                          }
                        }}
                        className={`flex-1 px-3.5 py-2 rounded-xl text-[14px] outline-none ${subSurfaceBg} ${textMain}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id, replyTarget && replyTarget.postId === post.id ? replyTarget.commentId : null)}
                        className="px-4 py-2 rounded-xl bg-[#0D9488] text-white font-bold text-[12px] cursor-pointer shrink-0"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 select-none">
          <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[88vh] overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
              <span className="font-bold text-[17px]">
                {editingPostId ? '묵상 나눔 수정' : isPastor && form.isPastorNotice ? '목사님 말씀 나눔 작성' : '오늘의 묵상 나눔 작성'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowWriteModal(false);
                  setEditingPostId(null);
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${subSurfaceBg} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
              <div className={`p-3.5 rounded-xl ${subSurfaceBg} flex items-center justify-between`}>
                <div>
                  <span className={`text-[12px] font-medium ${textSub} block`}>연동된 오늘의 본문</span>
                  <span className="font-bold text-[15px] mt-0.5 block">{todayQtData.qtReference || date}</span>
                </div>
                <span className={`text-[12px] ${textSub} truncate max-w-[45%] text-right`}>{todayQtData.qtTitle || '오늘의 묵상'}</span>
              </div>

              {isPastor && form.isPastorNotice ? (
                <>
                  <div className="space-y-1.5">
                    <span className="font-bold text-[12px] text-[#D97706] block">구속사적 본문 해석</span>
                    <textarea
                      rows={4}
                      placeholder="오늘 본문 말씀의 구속사적 의미와 해석을 기록해주세요"
                      value={form.hardPart}
                      onChange={(e) => setForm({ ...form, hardPart: e.target.value })}
                      onKeyDown={(e) => handleBibleAutoComplete(e, 'hardPart')}
                      className={`w-full p-3.5 rounded-xl text-[15px] leading-relaxed ${subSurfaceBg} ${textMain} outline-none resize-none`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-[12px] text-[#0D9488] block">성도들에게 들려주는 목양 이야기</span>
                    <textarea
                      rows={5}
                      placeholder="성도들이 오늘 하루를 살아갈 수 있도록 권면과 은혜의 이야기를 남겨주세요"
                      value={form.meditationShare}
                      onChange={(e) => setForm({ ...form, meditationShare: e.target.value })}
                      className={`w-full p-3.5 rounded-xl text-[15px] leading-relaxed ${subSurfaceBg} ${textMain} outline-none resize-none`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <span className="font-bold text-[12px] text-[#D97706] block">궁금한 구절 및 질문 (선택)</span>
                    <textarea
                      rows={3}
                      placeholder="본문을 읽으며 이해가 잘 안 가거나 묻고 싶은 구절을 적어보세요"
                      value={form.hardPart}
                      onChange={(e) => setForm({ ...form, hardPart: e.target.value })}
                      onKeyDown={(e) => handleBibleAutoComplete(e, 'hardPart')}
                      className={`w-full p-3.5 rounded-xl text-[15px] leading-relaxed ${subSurfaceBg} ${textMain} outline-none resize-none`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-[12px] text-[#0D9488] block">나의 묵상 나눔 및 삶의 적용</span>
                    <textarea
                      rows={5}
                      placeholder="오늘 말씀을 통해 깨달은 은혜와 구체적인 적용을 기록해주세요"
                      value={form.meditationShare}
                      onChange={(e) => setForm({ ...form, meditationShare: e.target.value })}
                      className={`w-full p-3.5 rounded-xl text-[15px] leading-relaxed ${subSurfaceBg} ${textMain} outline-none resize-none`}
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handlePublishPost}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] bg-[#0D9488] hover:bg-[#0F766E] text-white cursor-pointer transition-colors"
              >
                {editingPostId ? '수정 완료하기' : isPastor && form.isPastorNotice ? '목사님 말씀 나눔 등록' : '공동체 나눔에 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
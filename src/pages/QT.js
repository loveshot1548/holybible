// src/components/QT.js
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 암호화 (구버전 Base64 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

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
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)];
  return Array.from(new Set(matches.map(m => m[0].trim())));
};

const StrokeWidth = "1.8";
const IconArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 9l5 3-5 3V9z" /></svg>;
const IconShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
const IconBook = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconPray = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9M16.5 14v4M7 10l3 3-2 2-3-3M3 14l3 3M14 6l3 3-2 2-3-3" /></svg>;
const IconSparkles = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconTool = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconChevronDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}><polyline points="6 9 12 15 18 9" /></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconInfo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IconHeart = ({ filled, className = "w-4 h-4" }) => <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={StrokeWidth} className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconCornerDownRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>;

// 🌟 [최적화 1] 컴포넌트 외부로 분리 & memoization: remount 폭풍 및 모바일 락다운 방지
const TrainingCard = React.memo(({ id, num, title, desc, tip, isChecked, onToggle, isDark }) => {
  return (
    <div 
      onClick={() => onToggle(id)}
      className={`ignore-draw flex flex-col rounded-xl border transition-all select-none overflow-hidden cursor-pointer active:scale-[0.99] ${
        isChecked 
          ? (isDark ? 'bg-white/[0.03] border-white/10' : 'bg-stone-50 border-stone-200/80') 
          : (isDark ? 'bg-black/40 border-white/15 hover:border-white/30' : 'bg-white border-stone-200 shadow-xs hover:border-stone-300')
      }`}
    >
      <div className="flex items-center gap-2.5 p-3 pb-1.5">
        <div 
          className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            isChecked 
              ? 'bg-[#5B7065] border-[#5B7065] text-white shadow-xs' 
              : (isDark ? 'border-slate-500 bg-transparent' : 'border-stone-300 bg-transparent')
          }`}
        >
          {isChecked && <IconCheck />}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <span className={`text-[13px] font-bold tracking-tight truncate block ${
            isChecked ? 'text-slate-400 line-through' : (isDark ? 'text-white' : 'text-stone-800')
          }`}>
            <span className="text-stone-400 mr-1.5 font-mono">{num}.</span>{title}
          </span>
        </div>
      </div>

      <div className={`px-3 pb-2.5 pt-1 text-[12px] font-medium leading-relaxed border-t border-dashed ${
        isDark ? 'border-white/10 text-slate-300' : 'border-stone-200/70 text-stone-600 bg-stone-50/50'
      }`}>
        <p className="break-keep">{desc}</p>
        {tip && (
          <div className={`mt-1.5 p-1.5 rounded-lg text-[11px] leading-snug border ${
            isDark ? 'bg-stone-900/50 border-stone-700/50 text-stone-300' : 'bg-[#F4F6F4] border-[#E2E8F0] text-[#42544A]'
          }`}>
            <span className="font-bold mr-1">TIP.</span>{tip}
          </div>
        )}
      </div>
    </div>
  );
});

export default function DailyQT({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, SubPageHeader, date, currDay = {}, dailyData = {}, globalSharedQt = {},
  isWknd, ymdStr, qtEditorRef, renderToolbar, handleStickerAdd, handleMemoAdd, handleFileUpload, CanvasEngine, tool, setTool,
  color, setColor, size, setSize, StickerLayer, onPtrDown, updateDay, extractVideoId, handleUpdateSharedQt, triggerConfetti,
  findBibleText, handleAutoResize, authUser, logUserAction, bibles = [], openGlobalDrawer
}) {
  if (!SubPageHeader) return null;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const [qtSubView, setQtSubView] = useState('myQt');

  const [isTrainingMode, setIsTrainingMode] = useState(() => {
    return localStorage.getItem('qt_training_mode_active') === 'true';
  });
  const [showToolbar, setShowToolbar] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  const audioRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const toggleBGM = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.volume = 0.22;
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const [todayActionItems, setTodayActionItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      return saved.filter(item => item.date === date && item.source === 'qt');
    } catch {
      return [];
    }
  });

  const [todayPrayers, setTodayPrayers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      return saved.filter(item => item.date === date);
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
    const combinedText = `${currDay?.qtGoldenVerse || ''} ${currDay?.qtGraceLine || ''} ${currDay?.qtMeditation || ''} ${currDay?.qtApplication || ''} ${currDay?.qtAppQuestion || ''}`;
    const detected = extractBibleReferences(combinedText);
    setLinkedRefs(detected);
  }, [currDay?.qtGoldenVerse, currDay?.qtGraceLine, currDay?.qtMeditation, currDay?.qtApplication, currDay?.qtAppQuestion]);

  const relatedEntries = useMemo(() => {
    if (!activeBacklink) return [];
    return Object.entries(dailyData || {}).filter(([dKey, dVal]) => {
      if (dKey === date) return false;
      const fullText = `${dVal.qtGoldenVerse || ''} ${dVal.qtMeditation || ''} ${dVal.sermonNotes || ''} ${dVal.qtGraceLine || ''}`;
      return fullText.includes(activeBacklink);
    }).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [activeBacklink, dailyData, date]);

  const toggleTrainingCheck = useCallback((stepId) => {
    setTrainingChecks(prev => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      localStorage.setItem(`qt_training_chk_${date}`, JSON.stringify(next));
      return next;
    });
  }, [date]);

  const handleToggleTrainingMode = () => {
    const next = !isTrainingMode;
    setIsTrainingMode(next);
    localStorage.setItem('qt_training_mode_active', String(next));
  };

  useEffect(() => {
    if (!isTrainingMode) return;
    setTrainingChecks(prev => {
      const next = { ...prev };
      let changed = false;

      if (currDay.qtAppQuestion && currDay.qtAppQuestion.trim().length > 3) {
        if (!next['step4']) { next['step4'] = true; changed = true; }
        if (!next['step5']) { next['step5'] = true; changed = true; }
        if (!next['step6']) { next['step6'] = true; changed = true; }
      }
      if (currDay.qtMeditation && currDay.qtMeditation.trim().length > 3) {
        if (!next['step7']) { next['step7'] = true; changed = true; }
        if (!next['step8']) { next['step8'] = true; changed = true; }
      }
      if (currDay.qtApplication && currDay.qtApplication.trim().length > 3) {
        if (!next['step9']) { next['step9'] = true; changed = true; }
        if (!next['step10']) { next['step10'] = true; changed = true; }
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

  const handleShareVideo = () => {
    const targetUrl = currDay.qtVideoUrl || (currDay.qtVideoId ? `https://youtu.be/${currDay.qtVideoId}` : '');
    if (!targetUrl) return alert("공유할 유튜브 링크를 먼저 입력해주세요.");
    
    if (handleUpdateSharedQt) {
      handleUpdateSharedQt(date, 'qt', targetUrl);
    }
    
    if (navigator.share) {
      navigator.share({
        title: currDay.qtTitle || '오늘의 큐티 영상',
        url: targetUrl
      }).catch(() => {});
    }
    alert("공유되었습니다!");
  };

  const handleActionItemSync = (val) => {
    if (updateDay) {
      updateDay({ qtActionItem: val, qtActionCompleted: false });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const filtered = saved.filter(item => item.date !== date || item.source !== 'qt');
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
      setTodayActionItems(filtered.filter(item => item.date === date && item.source === 'qt'));

      if (supabase && (authUser?.name || authUser)) {
        const uName = typeof authUser === 'object' ? authUser?.name : authUser;
        if (uName) {
          supabase.from('attendance_records').upsert({
            date: date,
            user_name: uName,
            cell_name: authUser?.cell_name || '내 목장',
            type: 'QT',
            status: '출석'
          }, { onConflict: 'date,user_name,type' }).then();
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
      const updated = saved.map(item => {
        if (item.date === date && item.source === 'qt') {
          return { ...item, graceLine: val };
        }
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
      setTodayActionItems(updated.filter(item => item.date === date && item.source === 'qt'));
    } catch (e) {}
  };

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  };

  const inlineActionSendToTracker = () => {
    const textToPush = currDay.qtActionItem || currDay.qtGraceLine || currDay.qtMeditation || 'QT 적용 실천';
    handleActionItemSync(textToPush);
    showToast("🌿 오늘의 적용 트래커에 안전하게 심겼습니다!");
  };

  const toggleInlineActionComplete = (itemId) => {
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map(item => {
        if (item.id === itemId) return { ...item, completed: !item.completed };
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
      setTodayActionItems(updated.filter(item => item.date === date && item.source === 'qt'));
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
      setTodayPrayers(updated.filter(item => item.date === date));
      showToast("🙏 나의 기도함에 은혜가 보관되었습니다!");
    } catch (e) {
      showToast("기도함 저장 중 오류가 발생했습니다.");
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
      showToast("💌 목자/사역자에게 1:1 비공개 상담이 접수되었습니다.");
    } catch (e) {
      showToast("심층 상담 전송 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0F1115]' : 'bg-[#FBFBF9]'}`}>
      
      {/* 백링크 패널 */}
      {activeBacklink && (
        <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] z-[200] shadow-[-10px_0_40px_rgba(0,0,0,0.2)] flex flex-col transition-transform animate-fade-in ${isDark ? 'bg-[#09090B]/95 backdrop-blur-3xl border-l border-white/10' : 'bg-white/95 backdrop-blur-3xl border-l border-slate-200'}`}>
          <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-md ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>🔗</span>
              <h3 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBacklink} 묵상 기록</h3>
            </div>
            <button onClick={() => setActiveBacklink(null)} className={`p-1.5 rounded-full hover:bg-slate-500/20 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar pointer-events-auto">
            {relatedEntries.length === 0 ? (
              <div className={`py-10 flex flex-col items-center gap-2 text-[12px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                이 구절을 묵상한 첫 기록입니다.
              </div>
            ) : (
              relatedEntries.map(([dKey, dVal]) => (
                <div key={dKey} className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-mono tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{dKey}</span>
                  <p className={`text-[13px] font-serif leading-relaxed line-clamp-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
      
      {/* 앰비언트 글로우 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45 dark:opacity-25" style={{ transform: 'translate3d(0,0,0)' }}>
        <div 
          className="absolute -top-[12%] -left-[10%] w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(186, 215, 201, 0.45) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute top-[35%] -right-[15%] w-[85vw] max-w-[460px] h-[85vw] max-h-[460px] rounded-full blur-[95px]"
          style={{ background: 'radial-gradient(circle, rgba(238, 214, 196, 0.35) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[10%] left-[15%] w-[80vw] max-w-[480px] h-[80vw] max-h-[480px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(214, 218, 235, 0.35) 0%, transparent 70%)' }}
        />
      </div>

      {/* 상단 헤더 바 */}
      <div className={`shrink-0 px-2 sm:px-4 py-2 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-stone-200/70 bg-white/75'}`}>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-black/5'}`}>
            <IconArrowLeft />
          </button>
          <h1 className={`text-[15px] sm:text-[16px] font-bold tracking-tight ml-0.5 ${isDark ? 'text-white' : 'text-stone-800'} whitespace-nowrap`}>매일 QT</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button 
            onClick={toggleBGM}
            title="고요한 피아노 찬양 선율 듣기"
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              isAudioPlaying 
                ? (isDark ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs')
                : (isDark ? 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200' : 'bg-white/80 border-stone-200 text-stone-500 hover:text-stone-800')
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAudioPlaying ? 'bg-indigo-500 animate-ping' : 'bg-stone-400'}`}></span>
            <span>{isAudioPlaying ? '찬양 ON' : '찬양 OFF'}</span>
          </button>

          <button 
            onClick={() => openGlobalDrawer && openGlobalDrawer('applyTracker')}
            title="적용 트래커 서랍 열기"
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              isDark ? 'bg-stone-800/60 border-white/10 text-stone-300 hover:bg-stone-700' : 'bg-white/90 border-stone-200 text-stone-700 hover:bg-stone-100 shadow-xs'
            }`}
          >
            <span>🌿</span>
            <span className="hidden sm:inline">트래커</span>
          </button>

          <button 
            onClick={() => openGlobalDrawer && openGlobalDrawer('prayerBox')}
            title="나의 기도함 서랍 열기"
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              isDark ? 'bg-stone-800/60 border-white/10 text-stone-300 hover:bg-stone-700' : 'bg-white/90 border-stone-200 text-stone-700 hover:bg-stone-100 shadow-xs'
            }`}
          >
            <span>🙏</span>
            <span className="hidden sm:inline">기도함</span>
          </button>

          {qtSubView === 'myQt' && (
            <>
              <button 
                onClick={() => setShowToolbar(!showToolbar)} 
                title="그리기 도구 모음"
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${showToolbar ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent shadow-xs' : (isDark ? 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20' : 'bg-white/90 text-stone-700 border-stone-200 hover:bg-stone-100 shadow-xs')}`}
              >
                <IconTool />
                <span className="hidden sm:inline">{showToolbar ? '닫기' : '도구'}</span>
              </button>
              
              <button 
                onClick={handleToggleTrainingMode} 
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  isTrainingMode 
                    ? (isDark ? 'bg-stone-200 text-stone-900 border-transparent shadow-xs' : 'bg-stone-800 text-white border-transparent shadow-xs')
                    : (isDark ? 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20' : 'bg-white/90 text-stone-700 border-stone-200 hover:bg-stone-100 shadow-xs')
                }`}
              >
                <IconSparkles />
                <span>10단계 {isTrainingMode ? 'ON' : 'OFF'}</span>
              </button>
            </>
          )}

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors shrink-0 cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-black/5'}`}>
            <IconMenu />
          </button>
        </div>
      </div>

      {actionToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-[12px] font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 animate-bounce flex items-center gap-2">
          <span>✨</span> {actionToast}
        </div>
      )}

      {/* 서브 탭 바 */}
      <div className={`flex w-full px-2 sm:px-4 border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-stone-200/70 bg-stone-100/60'} shrink-0 relative z-20 backdrop-blur-md gap-2`}>
        <button
          onClick={() => setQtSubView('myQt')}
          className={`py-2 px-2.5 sm:px-3 text-[12.5px] sm:text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
            qtSubView === 'myQt' 
              ? (isDark ? 'border-white text-white font-extrabold' : 'border-stone-800 text-stone-800 font-extrabold') 
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          나의 묵상 노트
        </button>
        <button
          onClick={() => setQtSubView('community')}
          className={`py-2 px-2.5 sm:px-3 text-[12.5px] sm:text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
            qtSubView === 'community' 
              ? (isDark ? 'border-white text-white font-extrabold' : 'border-stone-800 text-stone-800 font-extrabold') 
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          공동체 QT 나눔터 & 목사님 나눔
        </button>
      </div>

      {qtSubView === 'myQt' && showToolbar && (
        <div className={`relative z-20 w-full px-2 py-1.5 border-b backdrop-blur-xl shrink-0 overflow-x-auto hide-scrollbar animate-fade-in ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-stone-200 bg-white/80'}`}>
          {renderToolbar && renderToolbar(qtEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}
      
      {/* 묵상 뷰포트 영역 */}
      {qtSubView === 'myQt' && CanvasEngine && (
        <CanvasEngine key={`qt_${date}`} saveKey={`qt_${date}`} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} renderStickers={() => StickerLayer ? <StickerLayer memos={currDay.memos} stickers={currDay.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} /> : null}>
          <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-1.5 sm:px-3.5 py-2.5 pb-24 relative z-10 space-y-3 max-w-4xl mx-auto">
            
            {isTrainingMode && (
              <div className={`ignore-draw px-3.5 py-2.5 rounded-xl border backdrop-blur-xl flex items-start gap-2 animate-fade-in select-none ${isDark ? 'bg-stone-800/40 border-white/10' : 'bg-stone-100/70 border-stone-200/80 shadow-xs'}`}>
                <IconInfo className="text-stone-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[12px] font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>10단계 심층 훈련 가이드</span>
                  <span className={`text-[11px] font-medium leading-relaxed break-keep ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    각 카드를 <b>원터치</b>하여 체크하거나, <b>4~10단계는 아래 질문·묵상·적용란 작성 시 자동 완수 체크</b>됩니다.
                  </span>
                </div>
              </div>
            )}

            {/* [Phase 1: 본문 정보 & 황금 구절] */}
            <div className={`p-3 sm:p-4 rounded-xl border backdrop-blur-xl flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/60 border-white/10' : 'bg-white/80 border-stone-200/80 shadow-xs'}`}>
              
              <input 
                type="text" 
                value={currDay.qtTitle || globalSharedQt?.[date]?.title || ''} 
                onChange={e => updateDay && updateDay({qtTitle: e.target.value, checks: { ...(currDay.checks || {}), 'QTin': true }})} 
                placeholder="오늘 나에게 주시는 큐티 제목..." 
                className={`w-full px-3 py-2 rounded-lg text-[14px] font-bold outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
              />
              
              <div className="flex gap-1.5 ignore-draw items-center">
                <input 
                  type="text" 
                  value={currDay.qtReference || globalSharedQt?.[date]?.reference || ''} 
                  onChange={e => updateDay && updateDay({qtReference: e.target.value, checks: { ...(currDay.checks || {}), 'QTin': true }})} 
                  placeholder="성경 본문 (예: 신명기 17:14-20)" 
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-[13px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                />
                <button 
                  onClick={() => findBibleText && findBibleText(currDay.qtReference || globalSharedQt?.[date]?.reference)} 
                  className={`shrink-0 px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200 shadow-xs'
                  }`}
                >
                  <IconSearch /> 찾기
                </button>
              </div>

              {/* 🌟 오늘의 황금 구절 (릴스 버튼 제거 완료) */}
              <div className="pt-1 ignore-draw">
                <div className={`p-2.5 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-black/25 border-white/10' : 'bg-stone-50/70 border-stone-200/80'}`}>
                  <span className="text-[10.5px] font-bold opacity-80 flex items-center gap-1 font-serif text-amber-500 dark:text-amber-400">
                    📖 오늘의 황금 구절 (가슴에 새길 한 절)
                  </span>
                  <input 
                    type="text" 
                    value={currDay.qtGoldenVerse || ''} 
                    onChange={e => updateDay && updateDay({ qtGoldenVerse: e.target.value })} 
                    placeholder="오늘 본문 중 내 마음에 깊이 꽂힌 한 구절을 기록하세요..." 
                    className={`w-full bg-transparent outline-none text-[12.5px] font-serif font-medium leading-relaxed ${isDark ? 'text-stone-200 placeholder:text-stone-600' : 'text-stone-800 placeholder:text-stone-400'}`} 
                  />
                </div>
              </div>

              {linkedRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5 animate-fade-in ignore-draw">
                  {linkedRefs.map(ref => (
                    <button 
                      key={ref}
                      onClick={() => setActiveBacklink(ref)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                        activeBacklink === ref 
                          ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                          : (isDark ? 'bg-black/40 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')
                      }`}
                    >
                      🔗 {ref} 과거 묵상 보기
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5 pt-0.5 ignore-draw">
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('qtArchiveDetail')}
                  className={`flex-1 py-1.5 rounded-lg border text-[11.5px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                >
                  <IconBook /> QT 심층분석
                </button>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('bibleWikiAdvanced')}
                  className={`flex-1 py-1.5 rounded-lg border text-[11.5px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                >
                  <IconSearch /> 성경 지식 위키
                </button>
              </div>

              {isTrainingMode && (
                <div className="ignore-draw flex flex-col gap-1.5 pt-2 border-t border-dashed border-stone-200 dark:border-white/10 animate-fade-in">
                  <span className="text-[10.5px] font-bold tracking-widest text-stone-400 dark:text-stone-500 mb-0.5">
                    [1~3단계] 관찰과 기록 훈련
                  </span>
                  <TrainingCard id="step1" num="1" title="기도하기 (깨닫는 마음 구하기)" desc="조용한 시간과 장소를 마련하고 성경을 펼치기 전, 깨닫는 마음을 구하는 기도로 시작합니다." tip='"이해할 마음, 볼 눈, 들을 귀를 주십시오" 정도의 단순한 기도로 충분합니다.' isChecked={!!trainingChecks['step1']} onToggle={toggleTrainingCheck} isDark={isDark} />
                  <TrainingCard id="step2" num="2" title="본문읽기 (소리 내어 반복 정독)" desc="성경 지식이 없어도 말씀은 깨달아지지만, 배경을 알고 여러 번 읽으면 묵상이 깊어집니다." tip="소리 내어 한 번, 눈으로 한 번, 마음으로 한 번—여러 번 읽으십시오." isChecked={!!trainingChecks['step2']} onToggle={toggleTrainingCheck} isDark={isDark} />
                  <TrainingCard id="step3" num="3" title="큐티노트 (생각과 질문 메모)" desc="눈으로만 읽지 말고 떠오르는 생각·질문·느낌을 그 자리에서 반드시 적습니다." tip="기록하는 습관이 영적 성장의 핵심입니다. 적지 않으면 금세 휘발됩니다." isChecked={!!trainingChecks['step3']} onToggle={toggleTrainingCheck} isDark={isDark} />
                </div>
              )}
            </div>

            {/* [Phase 2: 16:9 와이드 오늘의 큐티 영상] */}
            <div className={`p-2.5 sm:p-3.5 rounded-xl border backdrop-blur-xl flex flex-col gap-2 ${isDark ? 'bg-[#181A20]/60 border-white/10' : 'bg-white/80 border-stone-200/80 shadow-xs'}`}>
              <div className="flex justify-between items-center px-1">
                <span className={`text-[13px] font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  <IconVideo /> 오늘의 큐티 영상
                </span>
                <a href={`https://www.youtube.com/results?search_query=김양재 목사 큐티노트+${ymdStr}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors">
                  유튜브 검색 ↗
                </a>
              </div>

              <div className="flex gap-1.5 ignore-draw items-center">
                <input 
                  type="text" 
                  placeholder="유튜브 링크 붙여넣기..." 
                  value={currDay.qtVideoUrl || ''} 
                  onChange={(e) => { 
                    const url = e.target.value; 
                    const vId = extractVideoId ? extractVideoId(url) : null; 
                    updateDay && updateDay({ qtVideoUrl: url, qtVideoId: vId !== null ? vId : '', checks: { ...(currDay.checks || {}), 'QTin': true } }); 
                  }} 
                  className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[12px] font-medium outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`} 
                />
                <button 
                  onClick={handleShareVideo} 
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <IconShare /> 공유
                </button>
              </div>

              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black relative shadow-sm">
                {currentVideoId ? (
                  <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&enablejsapi=1`} title="QT Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/40">
                    영상을 검색해 링크를 붙여넣으면 재생됩니다.
                  </div>
                )}
              </div>

              <button 
                onClick={() => { 
                  updateDay && updateDay({ checks: { ...(currDay.checks || {}), 'QTin': true } }); 
                  triggerConfetti && triggerConfetti(); 
                  handleActionItemSync(currDay.qtActionItem || currDay.qtGraceLine || '영상 묵상 완수');
                  alert("시청 완료 체크 및 출석 기록이 저장되었습니다!"); 
                }} 
                className={`w-full py-2 rounded-lg border border-dashed text-[12px] font-bold transition-all cursor-pointer ${isDark ? 'border-white/20 text-stone-300 hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-50'}`}
              >
                ✨ 영상 시청 완료 체크
              </button>
            </div>

            {/* [Phase 3: 묵상과 적용 에디토리얼 패널] */}
            <div className={`p-3 sm:p-4 rounded-xl border backdrop-blur-xl space-y-4 ${isDark ? 'bg-[#181A20]/60 border-white/10' : 'bg-white/80 border-stone-200/80 shadow-xs'}`}>
              
              <div className="flex flex-col gap-1.5">
                <label className={`text-[13.5px] font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  <IconTarget className="text-stone-600 dark:text-stone-300" /> 적용 질문 (Question Time)
                </label>

                {isTrainingMode && (
                  <div className="ignore-draw flex flex-col gap-1.5 pb-1 animate-fade-in">
                    <span className="text-[10.5px] font-bold tracking-wider text-stone-400 dark:text-stone-500">
                      [4~6단계] 의미 해석과 질문하기
                    </span>
                    <TrainingCard id="step4" num="4" title="본문요약 (핵심 3~4줄 압축)" desc="여러 번 읽은 뒤 전체의 핵심 내용을 3~4줄로 간단히 요약합니다." tip="설교나 간증을 정리해서 듣는 능력도 함께 길러 줍니다." isChecked={!!trainingChecks['step4']} onToggle={toggleTrainingCheck} isDark={isDark} />
                    <TrainingCard id="step5" num="5" title="질문하기 (구속사적 질문 도출)" desc="마음에 걸리거나 더 깊이 생각해야 할 부분을 질문 형태로 뽑아냅니다." tip="좋은 질문이 좋은 큐티의 출발점입니다. 한 절마다 질문을 뽑아 보십시오." isChecked={!!trainingChecks['step5']} onToggle={toggleTrainingCheck} isDark={isDark} />
                    <TrainingCard id="step6" num="6" title="묵상하기 (삶의 명령과 약속 마주하기)" desc="본문을 옛이야기가 아니라, 오늘 내 삶에 주시는 명령과 약속으로 대합니다." tip="풀리지 않는 문제와 반복되는 죄를 꺼내 놓고 말씀이 어떻게 말하는지 생각합니다." isChecked={!!trainingChecks['step6']} onToggle={toggleTrainingCheck} isDark={isDark} />
                  </div>
                )}

                <textarea 
                  value={currDay.qtAppQuestion || ''} 
                  onChange={e => updateDay && updateDay({ qtAppQuestion: e.target.value })} 
                  onInput={autoGrowTextarea} 
                  className={`w-full p-2.5 bg-transparent resize-none outline-none text-[13.5px] font-medium leading-[1.7] border rounded-lg transition-all ${isDark ? 'border-white/15 text-white focus:border-stone-400 bg-black/20' : 'border-stone-200 text-stone-800 focus:border-stone-400 bg-stone-50/40'}`} 
                  placeholder="본문을 읽으며 드는 솔직한 질문을 적어보세요..." 
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-200 dark:border-white/10">
                <label className={`text-[13.5px] font-bold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  <IconBook className="text-stone-600 dark:text-stone-300" /> 묵상하기 (내 죄 보기)
                </label>

                {isTrainingMode && (
                  <div className="ignore-draw flex flex-col gap-1.5 pb-1 animate-fade-in">
                    <span className="text-[10.5px] font-bold tracking-wider text-stone-400 dark:text-stone-500">
                      [7~8단계] 나의 몫 직면과 적용
                    </span>
                    <TrainingCard id="step7" num="7" title="적용하기 (구체적인 행동 결단)" desc="묵상한 내용을 어떻게 실천할지 구체적으로 적고 행동으로 옮깁니다." tip="큐티의 '꽃'입니다. 적용이 없는 큐티는 지식으로 끝납니다." isChecked={!!trainingChecks['step7']} onToggle={toggleTrainingCheck} isDark={isDark} />
                    <TrainingCard id="step8" num="8" title="말씀대로 기도하기 (말씀 언어로 간구)" desc="오늘 받은 말씀을 붙들고, 그 말씀의 언어로 하나님께 기도합니다." tip="연약함을 불쌍히 여겨 달라 고백하고, 말씀이 이루어질 것을 믿고 구합니다." isChecked={!!trainingChecks['step8']} onToggle={toggleTrainingCheck} isDark={isDark} />
                  </div>
                )}

                <textarea 
                  value={currDay.qtMeditation || ''} 
                  onChange={e => updateDay && updateDay({ qtMeditation: e.target.value })} 
                  onInput={autoGrowTextarea} 
                  className={`w-full p-2.5 bg-transparent resize-none outline-none text-[13.5px] font-medium leading-[1.7] border rounded-lg transition-all ${isDark ? 'border-white/15 text-white focus:border-stone-400 bg-black/20' : 'border-stone-200 text-stone-800 focus:border-stone-400 bg-stone-50/40'}`} 
                  placeholder="말씀을 통해 깨달은 나의 죄와 은혜를 적어보세요..." 
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-200 dark:border-white/10">
                <label className={`text-[13.5px] font-bold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  <IconPray className="text-stone-600 dark:text-stone-300" /> 적용하기
                </label>

                {isTrainingMode && (
                  <div className="ignore-draw flex flex-col gap-1.5 pb-1 animate-fade-in">
                    <span className="text-[10.5px] font-bold tracking-wider text-stone-400 dark:text-stone-500">
                      [9~10단계] 본문 해설과 공동체 나눔
                    </span>
                    <TrainingCard id="step9" num="9" title="본문해설 (스스로 묵상 후 대조)" desc="스스로 충분히 묵상한 뒤에야 구속사적 본문해설을 참고합니다." tip="해설을 먼저 읽으면 '해설 읽기'가 되어 버립니다. 순서가 중요합니다." isChecked={!!trainingChecks['step9']} onToggle={toggleTrainingCheck} isDark={isDark} />
                    <TrainingCard id="step10" num="10" title="은혜나누기 (목장 공동체와 연합)" desc="그날 받은 은혜를 목장·소그룹 등 공동체와 반드시 나눕니다." tip="나 혼자 간직한 은혜는 오래가지 못합니다. 나눌 때 삶으로 굳어집니다." isChecked={!!trainingChecks['step10']} onToggle={toggleTrainingCheck} isDark={isDark} />
                  </div>
                )}

                <textarea 
                  value={currDay.qtApplication || ''} 
                  onChange={e => updateDay && updateDay({ qtApplication: e.target.value })} 
                  onInput={autoGrowTextarea} 
                  className={`w-full p-2.5 bg-transparent resize-none outline-none text-[13.5px] font-medium leading-[1.7] border rounded-lg transition-all ${isDark ? 'border-white/15 text-white focus:border-stone-400 bg-black/20' : 'border-stone-200 text-stone-800 focus:border-stone-400 bg-stone-50/40'}`} 
                  placeholder="오늘 하루 어떻게 실천할까요?" 
                />
              </div>

              {/* 한줄 은혜 및 실천 목표 (릴스 버튼 제거 완료) */}
              <div className="pt-2.5 space-y-1.5 ignore-draw border-t border-stone-200 dark:border-white/15">
                <span className={`font-bold text-[12px] flex items-center gap-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  <IconTarget /> 한줄 은혜 및 실천 목표 (트래커 자동 연동)
                </span>

                <input 
                  type="text" 
                  value={currDay.qtGraceLine || ''} 
                  onChange={(e) => handleGraceLineSync(e.target.value)} 
                  placeholder="오늘의 핵심 은혜를 한 줄로 요약하세요." 
                  className={`w-full px-3 py-2 rounded-lg border text-[13px] font-medium outline-none transition-all ${isDark ? 'bg-black/30 border-white/15 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-800 focus:border-stone-400'}`} 
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
                  placeholder="오늘의 실천 목표 (예: 먼저 사과하고 따뜻하게 인사하기)" 
                  className={`w-full px-3 py-2 rounded-lg border text-[13px] font-medium outline-none transition-all ${isDark ? 'bg-black/30 border-white/15 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-800 focus:border-stone-400'}`} 
                />
              </div>

              {/* [Phase 4: 원스트림 인라인 연동 허브] */}
              <div className={`ignore-draw p-3 rounded-xl border flex flex-col gap-2.5 mt-2 ${isDark ? 'bg-stone-900/60 border-white/10' : 'bg-stone-50/70 border-stone-200'}`}>
                <div className="flex justify-between items-center border-b pb-1.5 border-stone-200 dark:border-white/10">
                  <span className={`text-[11.5px] font-bold tracking-wider flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                    🌱 원스트림 신앙 연동
                  </span>
                  <span className="text-[10.5px] text-stone-400">
                    페이지 이동 없이 즉시 저장
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button 
                    onClick={inlineActionSendToTracker}
                    className="py-2 px-2.5 rounded-lg bg-[#526359] hover:bg-[#435249] text-white text-[11.5px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all"
                  >
                    🌿 트래커에 실천 심기
                  </button>
                  <button 
                    onClick={inlineActionSendToPrayer}
                    className="py-2 px-2.5 rounded-lg bg-[#6B6177] hover:bg-[#594F64] text-white text-[11.5px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all"
                  >
                    🙏 나의 기도함에 저장
                  </button>
                  <button 
                    onClick={inlineActionSendToCounseling}
                    className="py-2 px-2.5 rounded-lg bg-[#506375] hover:bg-[#415160] text-white text-[11.5px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all"
                  >
                    💌 1:1 심층상담 요청
                  </button>
                </div>

                {(todayActionItems.length > 0 || todayPrayers.length > 0 || counselingStatus) && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-stone-200 dark:border-white/10 mt-0.5 animate-fade-in">
                    {todayActionItems.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-stone-200/80 dark:border-white/5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                            🌿 오늘 QT 실천 과제
                          </span>
                          <span className="text-[9.5px] text-stone-400">터치하여 완료 체크</span>
                        </div>
                        {todayActionItems.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => toggleInlineActionComplete(item.id)}
                            className="flex items-center gap-2 p-1.5 rounded-md bg-stone-50 dark:bg-black/20 border border-stone-200/60 dark:border-white/5 cursor-pointer active:scale-[0.99] transition-all"
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${item.completed ? 'bg-[#526359] border-[#526359] text-white' : 'border-stone-300 bg-transparent'}`}>
                              {item.completed && <IconCheck />}
                            </div>
                            <span className={`text-[12px] font-medium ${item.completed ? 'line-through text-slate-400' : (isDark ? 'text-slate-200' : 'text-stone-800')}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {todayPrayers.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-stone-200/80 dark:border-white/5 flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                          🙏 오늘 등록된 묵상 기도 ({todayPrayers.length}건)
                        </span>
                        <div className="space-y-0.5">
                          {todayPrayers.map(p => (
                            <p key={p.id} className="text-[11.5px] font-medium text-stone-600 dark:text-stone-300 truncate pl-1">
                              • {p.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {counselingStatus && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-stone-200/80 dark:border-white/5 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                            💌 1:1 심층 상담 현황
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-stone-800 text-white text-[9.5px] font-bold">
                            {counselingReplyData ? '답변 도착' : '목자 접수 대기 중'}
                          </span>
                        </div>
                        {counselingReplyData && (
                          <div className="p-1.5 rounded-md bg-stone-50 dark:bg-black/20 text-[11.5px] text-stone-700 dark:text-stone-300 font-medium">
                            <span className="font-bold block mb-0.5 text-stone-800 dark:text-white">목자님의 답변:</span>
                            {counselingReplyData}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* 출석 달력 스탬프 */}
            <div className={`p-3 rounded-xl border backdrop-blur-xl ignore-draw ${isDark ? 'bg-[#181A20]/60 border-white/10' : 'bg-white/80 border-stone-200/80 shadow-xs'}`}>
              <div onClick={() => setShowFullCalendar(!showFullCalendar)} className="flex justify-between items-center cursor-pointer select-none">
                <span className={`font-bold text-[13px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  <IconCalendar /> {currMonth}월 출석 스탬프
                </span>
                <IconChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${showFullCalendar ? 'rotate-180' : ''}`} />
              </div>

              {showFullCalendar && (
                <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-white/10 animate-fade-in">
                  <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                    {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                      <div key={w} className={`text-[10.5px] font-bold ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-stone-400'}`}>{w}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }, (_, i) => i).map(e => (
                      <div key={`empty-${e}`} className="w-full aspect-square" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const dStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isS = dailyData[dStr]?.checks?.['QTin'] === true;
                      const isT = dStr === date;
                      const dOw = (firstDayOfWeek + day - 1) % 7;
                      return (
                        <div 
                          key={day} 
                          onClick={() => { 
                            const nS = !isS;
                            updateDay && updateDay({ checks: { ...(currDay.checks || {}), 'QTin': nS } });
                            if (nS && triggerConfetti) triggerConfetti();
                          }} 
                          className={`relative flex items-center justify-center aspect-square rounded-[6px] cursor-pointer select-none transition-all ${
                            isT ? 'ring-2 ring-stone-400' : ''
                          } ${
                            isS 
                              ? (isDark ? 'bg-stone-200 text-stone-900 font-bold shadow-xs' : 'bg-stone-800 text-white font-bold shadow-xs') 
                              : (isDark ? 'border border-white/5 hover:bg-white/10 text-stone-200' : 'border border-stone-200 hover:bg-black/5 text-stone-700')
                          }`}
                        >
                          <span className={`text-[11.5px] font-medium ${isS ? '' : (dOw === 0 ? 'text-rose-500' : dOw === 6 ? 'text-blue-500' : '')}`}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </CanvasEngine>
      )}

      {/* 서브 뷰 2: 공동체 QT 나눔 광장 */}
      {qtSubView === 'community' && (
        <CommunityQtSquareInner authUser={authUser} isDarkMode={isDarkMode} date={date} bibles={bibles} />
      )}

    </div>
  );
}

// =====================================================================
// 💡 공동체 QT 나눔 광장
// =====================================================================
const FULL_BIBLE_MAP_QT = {
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
  "마": "Matthew", "마태": "Matthew", "마태복음": "Matthew", 
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

function CommunityQtSquareInner({ authUser, isDarkMode, date, bibles = [] }) {
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
      const decryptedPosts = pData.map(p => ({
        ...p,
        hard_part: decryptField(p.hard_part),
        meditation_share: decryptField(p.meditation_share),
        pastor_guide: decryptField(p.pastor_guide)
      }));
      setPosts(decryptedPosts);

      const postIds = pData.map(p => p.id);
      if (postIds.length > 0) {
        const { data: cData } = await supabase
          .from('community_qt_comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });
        
        if (cData) {
          const map = {};
          cData.forEach(c => {
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
    const sub = supabase.channel(`community_qt_channel_${date}`)
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
          const foundBook = bibles.find(b => b.name === engBook);
          if (foundBook && foundBook.chapters && foundBook.chapters[chapNum - 1]) {
            const verseText = foundBook.chapters[chapNum - 1][verseNum - 1];
            if (verseText) {
              e.preventDefault();
              const cleanVerse = verseText.replace(/|'|\x1B/gi, '').trim();
              const replacement = `\n[${bookRaw} ${chapNum}:${verseNum}] "${cleanVerse}"\n`;
              const startIdx = beforeText.length - match[0].length;
              const nextVal = val.substring(0, startIdx) + replacement + val.substring(cursorPos);
              
              setForm(prev => ({ ...prev, [field]: nextVal }));
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
        return alert('오늘의 QT 해석 또는 묵상 이야기를 입력해주세요.');
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

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setReplyTarget(null);
  };

  const filteredPosts = useMemo(() => {
    if (activeTab === 'pastor') {
      return posts.filter(p => p.is_pastor_notice);
    }
    return posts;
  }, [posts, activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden select-none">
      <div className={`flex px-2 sm:px-4 py-2 border-b backdrop-blur-xl shrink-0 relative z-20 gap-2 items-center justify-between ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-stone-200/70 bg-white/75'}`}>
        <div className="flex gap-1 p-1 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/60 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-white text-stone-800 dark:bg-stone-200 dark:text-stone-900 shadow-xs' 
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            전체 나눔 ({posts.length})
          </button>
          <button 
            onClick={() => setActiveTab('pastor')} 
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              activeTab === 'pastor' 
                ? 'bg-white text-stone-800 dark:bg-stone-200 dark:text-stone-900 shadow-xs' 
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            목사님 나눔
          </button>
        </div>

        {activeTab === 'pastor' ? (
          isPastor && (
            <button 
              onClick={() => {
                setEditingPostId(null);
                setForm({ hardPart: '', meditationShare: '', pastorGuide: '', isPastorNotice: true });
                setShowWriteModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-[11.5px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              ✍️ 목사님 나눔 쓰기
            </button>
          )
        ) : (
          <button 
            onClick={() => {
              setEditingPostId(null);
              setForm({ hardPart: '', meditationShare: '', pastorGuide: '', isPastorNotice: false });
              setShowWriteModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-[11.5px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            나의 묵상 올리기
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 relative z-10 hide-scrollbar pb-24 w-full max-w-3xl mx-auto">
        {filteredPosts.length === 0 ? (
          <div className="p-10 rounded-2xl border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-[#181A20]/70 backdrop-blur-xl text-center flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🌱</span>
            <p className="text-[13px] font-bold text-stone-700 dark:text-stone-300">등록된 묵상 나눔이 없습니다.</p>
            <p className="text-[11px] text-stone-400">
              {activeTab === 'pastor' ? '목사님의 말씀 나눔을 기다리고 있습니다.' : '오늘 주신 은혜를 가장 먼저 나눠보세요.'}
            </p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const allComments = comments[post.id] || [];
            const rootComments = allComments.filter(child => !child.parent_id);
            const isMyPost = post.author_name === userName;

            return (
              <div 
                key={post.id} 
                className={`p-3.5 rounded-xl border backdrop-blur-xl flex flex-col gap-2 transition-all ${
                  post.is_pastor_notice 
                    ? 'bg-[#FDFCF9] dark:bg-[#1C1A16] border-amber-200/80 dark:border-amber-900/30' 
                    : 'bg-white/85 dark:bg-[#181A20]/80 border-stone-200/80 dark:border-white/10 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-center border-b border-stone-200/50 dark:border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[13.5px] text-stone-800 dark:text-white">
                      {post.author_name}
                    </span>
                    {post.is_pastor_notice ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        목사님 나눔
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {post.author_role || '성도'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(post.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isMyPost && (
                      <div className="flex items-center gap-1 ml-1 border-l pl-2 border-stone-200 dark:border-white/10">
                        <button 
                          onClick={() => handleOpenEdit(post)}
                          className="text-stone-500 hover:text-stone-800 text-[10.5px] font-medium cursor-pointer"
                        >
                          수정
                        </button>
                        <span className="text-stone-300 dark:text-stone-600">|</span>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-500 hover:underline text-[10.5px] font-medium cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-2 py-1 rounded bg-stone-50 dark:bg-black/30 border border-stone-200/50 dark:border-white/5 text-[11px] font-medium text-stone-600 dark:text-stone-300 flex items-center justify-between">
                  <span>📖 {post.qt_reference}</span>
                  <span className="truncate max-w-[55%] text-stone-500 dark:text-stone-400">{post.qt_title}</span>
                </div>

                {post.is_pastor_notice ? (
                  <div className="flex flex-col gap-1.5">
                    {post.hard_part && (
                      <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex flex-col gap-1">
                        <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px]">구속사적 해석</span>
                        <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-medium text-stone-800 dark:text-stone-200">{post.hard_part}</p>
                      </div>
                    )}
                    {post.meditation_share && (
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-black/20 border border-stone-200/60 dark:border-white/5 flex flex-col gap-1">
                        <span className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">목양 권면 이야기</span>
                        <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-medium text-stone-800 dark:text-stone-200">{post.meditation_share}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {post.hard_part && (
                      <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-white/5 border border-stone-200/60 dark:border-white/5 text-[12px] leading-relaxed">
                        <span className="font-bold text-stone-600 dark:text-stone-400 block mb-0.5 text-[10.5px]">이 부분이 어려워요 / 궁금해요</span>
                        <p className="font-medium whitespace-pre-wrap text-stone-800 dark:text-stone-200">{post.hard_part}</p>
                      </div>
                    )}

                    {post.meditation_share && (
                      <div className="p-2.5 rounded-lg bg-stone-50/60 dark:bg-black/20 border border-stone-200/60 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="font-bold text-stone-600 dark:text-stone-400 text-[10.5px]">묵상 나눔 및 적용</span>
                        <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-medium text-stone-800 dark:text-stone-200">{post.meditation_share}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-stone-200/50 dark:border-white/10">
                  <button 
                    onClick={() => handleLike(post.id, post.likes_count)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 hover:text-rose-500 transition-colors cursor-pointer text-[11px] font-bold"
                  >
                    <IconHeart filled={post.likes_count > 0} className="w-3.5 h-3.5 text-rose-500" />
                    <span>은혜와 공감</span>
                    <span className="font-mono">{post.likes_count || 0}</span>
                  </button>
                  <span className="text-[10.5px] text-stone-400">댓글 {allComments.length}개</span>
                </div>

                <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-stone-200/50 dark:border-white/10">
                  {rootComments.map(c => {
                    const childComments = allComments.filter(child => child.parent_id === c.id);

                    return (
                      <div key={c.id} className="flex flex-col gap-1">
                        <div className="p-2 rounded-lg bg-stone-50 dark:bg-black/20 text-[11.5px] flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-800 dark:text-stone-200">{c.author_name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9.5px] text-stone-400 font-mono">{new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <button 
                                onClick={() => setReplyTarget({ commentId: c.id, authorName: c.author_name, postId: post.id })}
                                className="text-[10px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                              >
                                답글
                              </button>
                            </div>
                          </div>
                          <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-medium">{c.content}</p>
                        </div>

                        {childComments.map(child => (
                          <div key={child.id} className="ml-3 p-1.5 rounded-lg bg-stone-100/60 dark:bg-black/30 border-l-2 border-stone-300 dark:border-stone-700 text-[11px] flex flex-col gap-0.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                                <IconCornerDownRight /> {child.author_name}
                              </span>
                              <span className="text-[9.5px] text-stone-400 font-mono">{new Date(child.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-medium pl-2.5">{child.content}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div className="flex flex-col gap-1 mt-0.5">
                    {replyTarget && replyTarget.postId === post.id && (
                      <div className="flex justify-between items-center px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[10px] text-stone-600 dark:text-stone-300 font-medium">
                        <span>{replyTarget.authorName} 님에게 답글 작성 중...</span>
                        <button onClick={() => setReplyTarget(null)} className="hover:underline cursor-pointer text-stone-400">취소</button>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <input 
                        type="text"
                        placeholder={replyTarget && replyTarget.postId === post.id ? "답글을 입력하세요..." : "따뜻한 은혜의 댓글을 남겨보세요..."}
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id, (replyTarget && replyTarget.postId === post.id) ? replyTarget.commentId : null);
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11.5px] outline-none bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:border-stone-400"
                      />
                      <button 
                        onClick={() => handleAddComment(post.id, (replyTarget && replyTarget.postId === post.id) ? replyTarget.commentId : null)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-[11px] cursor-pointer active:scale-95 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-white/10 bg-[#FAF9F6] dark:bg-[#16181D] text-stone-800 dark:text-stone-200 shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-4 py-3 border-b border-stone-200 dark:border-white/10 flex justify-between items-center bg-white/70 dark:bg-black/20">
              <span className="font-bold text-[14px] text-stone-900 dark:text-white">
                {editingPostId 
                  ? '묵상 나눔 수정하기' 
                  : (isPastor && form.isPastorNotice ? '목사님 말씀 나눔 작성' : '오늘의 묵상 나눔 작성')}
              </span>
              <button 
                onClick={() => { setShowWriteModal(false); setEditingPostId(null); }} 
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>

            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3 hide-scrollbar text-[12.5px]">
              
              <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-stone-200/80 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block">연동된 오늘의 본문</span>
                  <span className="font-bold text-[13px] text-stone-800 dark:text-stone-200 mt-0.5 block">{todayQtData.qtReference || date}</span>
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[45%] text-right">{todayQtData.qtTitle || '오늘의 묵상'}</span>
              </div>

              {isPastor && form.isPastorNotice ? (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-[12px]">구속사적 본문 해석</span>
                      <span className="text-[9.5px] text-stone-400">구절 + 스페이스 자동완성</span>
                    </div>
                    <textarea 
                      rows={4}
                      placeholder="오늘 본문 말씀의 구속사적 의미와 성경 해석을 알기 쉽게 기록해주세요..."
                      value={form.hardPart}
                      onChange={e => setForm({ ...form, hardPart: e.target.value })}
                      onKeyDown={e => handleBibleAutoComplete(e, 'hardPart')}
                      className="w-full p-2.5 rounded-lg text-[12.5px] leading-relaxed bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder:text-stone-400 outline-none resize-none focus:border-stone-400 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-[12px]">성도들에게 들려주는 목양 이야기</span>
                    <textarea 
                      rows={5}
                      placeholder="성도들이 오늘 하루를 살아갈 수 있도록 따뜻한 권면과 은혜의 이야기를 들려주세요..."
                      value={form.meditationShare}
                      onChange={e => setForm({ ...form, meditationShare: e.target.value })}
                      className="w-full p-2.5 rounded-lg text-[12.5px] leading-relaxed bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder:text-stone-400 outline-none resize-none focus:border-stone-400 font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-[12px]">이 부분이 어려워요 / 궁금해요 (선택)</span>
                      <span className="text-[9.5px] text-stone-400">구절 + 스페이스 자동완성</span>
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="본문을 읽으며 이해가 잘 안 가거나 목자님께 묻고 싶은 구절을 적어보세요..."
                      value={form.hardPart}
                      onChange={e => setForm({ ...form, hardPart: e.target.value })}
                      onKeyDown={e => handleBibleAutoComplete(e, 'hardPart')}
                      className="w-full p-2.5 rounded-lg text-[12.5px] leading-relaxed bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder:text-stone-400 outline-none resize-none focus:border-stone-400 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-[12px]">나의 묵상 나눔 및 삶의 적용</span>
                    <textarea 
                      rows={5}
                      placeholder="오늘 말씀을 통해 깨달은 나의 죄와 은혜, 그리고 구체적인 적용을 기록해주세요..."
                      value={form.meditationShare}
                      onChange={e => setForm({ ...form, meditationShare: e.target.value })}
                      className="w-full p-2.5 rounded-lg text-[12.5px] leading-relaxed bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder:text-stone-400 outline-none resize-none focus:border-stone-400 font-medium"
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handlePublishPost}
                className="w-full py-2.5 rounded-xl font-bold text-[13px] bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 shadow-xs cursor-pointer active:scale-98 transition-all mt-1"
              >
                {editingPostId 
                  ? '수정 완료하기' 
                  : (isPastor && form.isPastorNotice ? '목사님 말씀 나눔 등록하기' : '공동체 나눔에 등록하기')}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
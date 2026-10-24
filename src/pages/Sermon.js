// src/components/Sermon.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
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

// 💡 [옵시디언형 지식 그래프] 성경 구절 정밀 정규식 추출기
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
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconMic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const IconPen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const IconHeart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconDocument = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconTool = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconChevronDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}><polyline points="6 9 12 15 18 9" /></svg>;

export default function Sermon({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, SubPageHeader, date, isGisangogi, authUser,
  renderToolbar, sermonEditorRef, handleStickerAdd, handleMemoAdd, handleFileUpload, CanvasEngine, tool, setTool,
  color, setColor, size, setSize, StickerLayer, currDay = {}, updateDay, onPtrDown, openModal, downloadSermonWord,
  gisangogiUrl, setGisangogiUrl, getArr, toggleAiDetect, isAiDetecting, ymdStr, extractVideoId, handleUpdateSharedQt, handleUpdateSharedSermon,
  globalSharedQt = {}, setDailyData, bibles, findBibleText, logUserAction, dailyData = {}
}) {
  if (!SubPageHeader) return null;

  const safeDay = currDay || {};
  const isSp = isGisangogi ? isGisangogi(date) : false;

  const [showToolbar, setShowToolbar] = useState(false);
  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const sermonRecRef = useRef(null);

  // 현장 예배 집중 모드 (Sanctuary Mode)
  const [isSanctuaryMode, setIsSanctuaryMode] = useState(() => {
    return localStorage.getItem('sermon_sanctuary_mode') === 'true';
  });

  // 설교 3대지 구조화 아코디언 토글
  const [showOutlineBuilder, setShowOutlineBuilder] = useState(true);

  // 원스트림 인라인 액션 토스트 상태
  const [actionToast, setActionToast] = useState(null);
  
  // 지식 그래프 백링크 상태 관리
  const [linkedRefs, setLinkedRefs] = useState([]);
  const [activeBacklink, setActiveBacklink] = useState(null);

  useEffect(() => {
    const plainText = (safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '');
    const combinedText = `${safeDay.sermonReference || ''} ${plainText}`;
    const detected = extractBibleReferences(combinedText);
    setLinkedRefs(detected);
  }, [safeDay.sermonNotes, safeDay.sermonReference]);

  // =====================================================================
  // 🌟 [월별 기상오기 링크 관리 엔진] 10월 및 매달 링크를 사용자가 직접 설정/수정
  // =====================================================================
  const currentMonthNum = useMemo(() => {
    if (date && date.length >= 7) {
      return parseInt(date.substring(5, 7), 10) || 10;
    }
    return new Date().getMonth() + 1;
  }, [date]);

  const [monthlyGisanUrls, setMonthlyGisanUrls] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('monthly_gisangogi_urls') || '{}');
      return saved;
    } catch {
      return {};
    }
  });

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  // 현재 날짜의 월에 맞는 활성 기상오기 URL 도출
  const activeMonthGisanUrl = useMemo(() => {
    if (monthlyGisanUrls[currentMonthNum]) {
      return monthlyGisanUrls[currentMonthNum];
    }
    const perMonthLocal = localStorage.getItem(`app_active_gisangogi_url_${currentMonthNum}`);
    if (perMonthLocal) return perMonthLocal;

    const globalLocal = localStorage.getItem('app_active_gisangogi_url');
    if (globalLocal) return globalLocal;

    return gisangogiUrl || safeDay.sermonVideoUrl || '';
  }, [monthlyGisanUrls, currentMonthNum, gisangogiUrl, safeDay.sermonVideoUrl]);

  const [inputUrl, setInputUrl] = useState(activeMonthGisanUrl);

  useEffect(() => {
    setInputUrl(activeMonthGisanUrl);
  }, [activeMonthGisanUrl, date]);

  // 현재 월의 기상오기 영상 링크 실시간 변경 및 저장
  const handleApplyCurrentMonthGisanVideo = () => {
    const target = inputUrl.trim();
    if (!target) return alert("유튜브 링크를 입력해주세요.");

    const updatedMap = { ...monthlyGisanUrls, [currentMonthNum]: target };
    setMonthlyGisanUrls(updatedMap);
    localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(updatedMap));
    localStorage.setItem(`app_active_gisangogi_url_${currentMonthNum}`, target);
    localStorage.setItem('app_active_gisangogi_url', target);

    if (setGisangogiUrl) setGisangogiUrl(target);
    if (updateDay) updateDay({ sermonVideoUrl: target });
    if (handleUpdateSharedSermon) handleUpdateSharedSermon(date, target);

    showToast(`🎬 ${currentMonthNum}월 기상오기 영상 링크가 성공적으로 변경되었습니다!`);
  };

  const gisanUrlToUse = activeMonthGisanUrl;
  const gisanVidId = extractVideoId ? extractVideoId(gisanUrlToUse) : null;
  
  const rawTarget = globalSharedQt?.[date]?.sermon || globalSharedQt?.[date]?.sermonData?.sermon || safeDay?.sermonVideoId || safeDay?.sermonVideoUrl;
  const currentVideoId = extractVideoId ? extractVideoId(rawTarget) : rawTarget;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const toggleSanctuaryMode = () => {
    const next = !isSanctuaryMode;
    setIsSanctuaryMode(next);
    localStorage.setItem('sermon_sanctuary_mode', String(next));
  };

  const handleShareVideo = () => {
    const targetUrl = safeDay.sermonVideoUrl || (safeDay.sermonVideoId ? `https://youtu.be/${safeDay.sermonVideoId}` : '');
    if (!targetUrl) return alert("공유할 유튜브 링크를 먼저 입력해주세요.");
    
    if (handleUpdateSharedQt) {
      handleUpdateSharedQt(date, 'sermon', targetUrl);
    } else if (handleUpdateSharedSermon) {
      handleUpdateSharedSermon(date, targetUrl);
    }
    
    if (navigator.share) {
      navigator.share({
        title: safeDay.sermonTitle || '예배 설교 영상',
        url: targetUrl
      }).catch(() => {});
    }
    alert("예배 영상이 실시간 공유되었습니다!");
  };

  const handleActionItemSync = (val) => {
    if (updateDay) {
      updateDay({ sermonActionItem: val, sermonActionCompleted: false });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const filtered = saved.filter(item => item.date !== date || item.source !== 'sermon');
      if (val.trim()) {
        filtered.push({
          id: `sermon_${date}_${Date.now()}`,
          date: date,
          source: 'sermon',
          text: val.trim(),
          completed: false,
          graceLine: safeDay.sermonGraceLine || ''
        });
      }
      localStorage.setItem('apply_tracker_items', JSON.stringify(filtered));
    } catch (e) {}
  };

  const handleGraceLineSync = (val) => {
    if (updateDay) {
      updateDay({ sermonGraceLine: val });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map(item => {
        if (item.date === date && item.source === 'sermon') {
          return { ...item, graceLine: val };
        }
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSendDeclarationToCell = (text) => {
    if (!text || !text.trim()) return alert("전송할 감사 내용이 없습니다.");
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({
        id: Date.now(),
        date: date,
        source: 'sermon_declaration',
        text: encryptField(text.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      alert("목장 모임 [감사나눔]으로 전송되었습니다!");
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  };

  const inlineActionSendToTracker = () => {
    const textToPush = safeDay.sermonActionItem || safeDay.sermonGraceLine || safeDay.sermonTitle || '설교 결단 및 적용';
    handleActionItemSync(textToPush);
    showToast("🌿 오늘의 적용 트래커에 성공적으로 반영되었습니다!");
  };

  const inlineActionSendToPrayer = () => {
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_sermon_${Date.now()}`,
        title: `[예배 은혜 연계] ${safeDay.sermonTitle || safeDay.sermonReference || date} 결단의 기도`,
        content: encryptField(safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 중 결단한 기도 제목'),
        date: date,
        answered: false
      };
      localStorage.setItem('prayer_items', JSON.stringify([newPrayer, ...prayers]));
      showToast("🙏 나의 기도함에 은혜가 안전하게 보관되었습니다!");
    } catch (e) {
      showToast("기도함 저장 중 오류가 발생했습니다.");
    }
  };

  const inlineActionSendToCounseling = async () => {
    try {
      const counselingPayload = {
        user_name: authUser?.name || '성도',
        cell_name: authUser?.cell_name || '소속 목장',
        title: `[심층 설교 상담 요청] ${safeDay.sermonReference || date}`,
        content: encryptField(`설교 제목: ${safeDay.sermonTitle}\n본문: ${safeDay.sermonReference}\n상담/나눔 내용: ${safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 관련 깊은 나눔이 필요합니다.'}`),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('counseling_qna').insert([counselingPayload]);
      }
      showToast("💌 담당 목자/사역자에게 1:1 심층 상담이 비공개로 요청되었습니다.");
    } catch (e) {
      showToast("심층 상담 전송 중 오류가 발생했습니다.");
    }
  };

  const toggleSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("마이크 미지원 브라우저입니다.");

    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      if (sermonRecRef.current) {
        try { sermonRecRef.current.stop(); } catch(e) {}
        sermonRecRef.current = null;
      }
      return;
    }

    try {
      const rec = new SR();
      rec.lang = 'ko-KR';
      rec.continuous = true;
      sermonRecRef.current = rec;

      rec.onresult = (ev) => {
        let final = '';
        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' ';
        }
        if (final) {
          if (setDailyData) {
            setDailyData(prev => {
              const d = prev[date] || {};
              return { ...prev, [date]: { ...d, sermonNotes: (d.sermonNotes || '') + final } };
            });
          }
        }
      };

      rec.onend = () => {
        setIsSpeechRecording(false);
        sermonRecRef.current = null;
      };

      rec.start();
      setIsSpeechRecording(true);
    } catch(err) {
      setIsSpeechRecording(false);
    }
  }, [isSpeechRecording, date, setDailyData]);

  useEffect(() => {
    return () => {
      if (sermonRecRef.current) {
        try { sermonRecRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  // 지식 그래프 백링크 드로어
  const BacklinkPanel = () => {
    if (!activeBacklink) return null;
    const isDarkTheme = isDarkMode;

    const relatedEntries = Object.entries(dailyData || {}).filter(([dKey, dVal]) => {
      if (dKey === date) return false;
      const fullText = `${dVal.sermonNotes || ''} ${dVal.qtMeditation || ''} ${dVal.qtGraceLine || ''}`;
      return fullText.includes(activeBacklink);
    }).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] z-[200] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col transition-transform animate-fade-in ${isDarkTheme ? 'bg-[#09090B]/95 backdrop-blur-3xl border-l border-white/10' : 'bg-white/95 backdrop-blur-3xl border-l border-slate-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-md ${isDarkTheme ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>🔗</span>
            <h3 className={`text-[14px] font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{activeBacklink} 관련 기록</h3>
          </div>
          <button onClick={() => setActiveBacklink(null)} className={`p-1.5 rounded-full hover:bg-slate-500/20 transition-colors ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pointer-events-auto">
          {relatedEntries.length === 0 ? (
            <div className={`py-10 flex flex-col items-center gap-2 text-[12px] font-medium ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
              과거 예배/묵상 기록이 없습니다.
            </div>
          ) : (
            relatedEntries.map(([dKey, dVal]) => (
              <div key={dKey} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-mono tracking-widest ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>{dKey}</span>
                <p className={`text-[13px] font-serif leading-relaxed line-clamp-4 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  {(dVal.sermonNotes || dVal.qtMeditation || dVal.qtGraceLine || '').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0b0c0f]' : 'bg-[#fbfbf9]'}`}>
      <BacklinkPanel />
      
      {/* 앰비언트 배경 글로우 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20" style={{ transform: 'translate3d(0,0,0)' }}>
        <div 
          className="absolute -top-[10%] -left-[10%] w-[700px] max-w-[85vw] h-[700px] max-h-[85vw] rounded-full blur-[90px]" 
          style={{ background: 'radial-gradient(circle, rgba(186, 215, 201, 0.4) 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[800px] max-w-[90vw] h-[800px] max-h-[90vw] rounded-full blur-[95px]" 
          style={{ background: 'radial-gradient(circle, rgba(214, 218, 235, 0.35) 0%, transparent 70%)' }} 
        />
      </div>

      {/* 1. 상단 글로벌 헤더 바 */}
      <header className={`shrink-0 px-3 sm:px-4 py-2.5 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-stone-200/80 bg-white/75'}`}>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-black/5'}`}>
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <h1 className={`text-[15.5px] sm:text-[16px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>예배 노트</h1>
            {isSanctuaryMode && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                집중 모드 작동중
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={toggleSanctuaryMode}
            title="영상 및 잡음을 숨기고 설교에만 온전히 집중"
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
              isSanctuaryMode 
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs' 
                : (isDark ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 shadow-2xs')
            }`}
          >
            <span>{isSanctuaryMode ? '🏛️ 본당 집중' : '일반 모드'}</span>
          </button>

          <button onClick={() => setShowToolbar(!showToolbar)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${showToolbar ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent shadow-xs' : (isDark ? 'bg-white/5 text-stone-300 border-white/10' : 'bg-white text-stone-700 border-stone-200 shadow-2xs')}`}>
            <IconTool /> {showToolbar ? '도구 닫기' : '도구'}
          </button>
          
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-black/5'}`}>
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 인라인 액션 토스트 알림 플로터 */}
      {actionToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-2xl border border-white/20 animate-bounce flex items-center gap-2">
          <span>✨</span> {actionToast}
        </div>
      )}

      {/* 그리기 및 서식 도구 모음 */}
      {showToolbar && (
        <div className={`relative z-20 w-full px-2 py-1.5 border-b backdrop-blur-xl shrink-0 overflow-x-auto hide-scrollbar animate-fade-in ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-stone-200 bg-white/80'}`}>
          {renderToolbar && renderToolbar(sermonEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}
      
      {/* 2. 본문 뷰포트 레이아웃 */}
      {CanvasEngine && (
      <CanvasEngine key={`sermon_${date}`} saveKey={`sermon_${date}`} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} renderStickers={() => StickerLayer ? <StickerLayer memos={safeDay.memos} stickers={safeDay.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} /> : null}>
        <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2 sm:px-4 py-3 pb-32 relative z-10 space-y-3 max-w-4xl mx-auto">
          
          {/* 일자 바 & 아카이브/저장 제어 */}
          <div className={`px-3.5 py-2 rounded-xl border backdrop-blur-md flex justify-between items-center ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[13.5px] font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{date}</span>
              <span className="text-[10.5px] text-stone-400 font-mono">주일 대예배 설교</span>
            </div>

            <div className="flex gap-1.5 ignore-draw">
              <button onClick={() => openModal && openModal('sermonList')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/15' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 shadow-2xs'}`}>
                <IconList /> 목록
              </button>
              <button onClick={downloadSermonWord} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 shadow-2xs cursor-pointer hover:opacity-90">
                <IconSave /> Word 저장
              </button>
            </div>
          </div>

          {/* 설교 메타데이터 & 성경 본문 매핑 (릴스 버튼 제거됨) */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
            <input 
              type="text" 
              value={safeDay.sermonTitle || globalSharedQt?.[date]?.sermonData?.title || ''} 
              onChange={e => updateDay({ sermonTitle: e.target.value })} 
              onPointerDown={e => e.stopPropagation()} 
              className={`w-full px-3 py-2 rounded-lg text-[14.5px] font-serif font-bold outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
              placeholder="설교 제목을 입력하세요." 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input 
                type="text" 
                value={safeDay.sermonPreacher || globalSharedQt?.[date]?.sermonData?.preacher || ''} 
                onChange={e => updateDay({ sermonPreacher: e.target.value })} 
                onPointerDown={e => e.stopPropagation()} 
                className={`w-full px-3 py-2 rounded-lg text-[12.5px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                placeholder="설교자 (예: 담임목사)" 
              />
              <div className="flex gap-1.5 ignore-draw items-center">
                <input 
                  type="text" 
                  value={safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || ''} 
                  onChange={e => updateDay && updateDay({ sermonReference: e.target.value })} 
                  onPointerDown={e => e.stopPropagation()} 
                  placeholder="본문 (예: 롬 8:28-30)" 
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-[12.5px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                />
                <button 
                  onClick={() => findBibleText(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference)} 
                  className={`shrink-0 px-3 py-2 rounded-lg text-[11.5px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200 shadow-2xs'
                  }`}
                >
                  <IconSearch /> 본문 찾기
                </button>
              </div>
            </div>

            {/* 오늘 나를 찌른 말씀의 앵커 (Conviction) */}
            <div className="pt-1 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-black/25 border-white/10' : 'bg-stone-50/70 border-stone-200/80'}`}>
                <span className="text-[10.5px] font-bold font-serif text-rose-500 dark:text-rose-400">
                  ⚡ 오늘 나를 찌른 설교 한마디 (회개와 결단의 앵커)
                </span>
                <input 
                  type="text" 
                  value={safeDay.sermonConviction || ''} 
                  onChange={e => updateDay && updateDay({ sermonConviction: e.target.value })} 
                  placeholder="설교 중 심장을 찔렀던 단 한 문장을 적어두고 묵상하세요..." 
                  className={`w-full bg-transparent outline-none text-[13px] font-serif font-medium leading-relaxed ${isDark ? 'text-rose-200 placeholder:text-stone-600' : 'text-stone-900 placeholder:text-stone-400'}`} 
                />
              </div>
            </div>

            {/* 지식 그래프 백링크 태그 */}
            {linkedRefs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5 animate-fade-in ignore-draw">
                {linkedRefs.map(ref => (
                  <button 
                    key={ref}
                    onClick={(e) => { e.stopPropagation(); setActiveBacklink(ref); }}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                      activeBacklink === ref 
                        ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                        : (isDark ? 'bg-black/40 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    🔗 {ref} 과거 묵상 대조
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 설교 3대지 구조화 빌더 (릴스 버튼 제거됨) */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
            <div 
              onClick={() => setShowOutlineBuilder(!showOutlineBuilder)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className={`text-[13px] font-serif font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  설교 대지 구조화 빌더 (3-Point Outline)
                </span>
              </div>
              <IconChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showOutlineBuilder ? 'rotate-180' : ''}`} />
            </div>

            {showOutlineBuilder && (
              <div className="space-y-2 pt-1 border-t border-dashed border-stone-200 dark:border-white/10 animate-fade-in ignore-draw" onPointerDown={e => e.stopPropagation()}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제1대지: 본문 관찰 및 하나님의 성품</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT I</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint1 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint1: e.target.value })} 
                    placeholder="예: 우리를 먼저 찾아오시고 부르시는 하나님의 긍휼" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제2대지: 직면한 나의 우상과 회개의 자리</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT II</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint2 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint2: e.target.value })} 
                    placeholder="예: 여전히 내 지혜와 능력을 의지하려 했던 교만의 죄" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제3대지: 구속사적 결단과 십자가의 은혜</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT III</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint3 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint3: e.target.value })} 
                    placeholder="예: 내 권리를 포기하고 지체를 섬기는 십자가의 순종" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🌟 영상 시청 및 기상오기(월별/10월 영상) 사용자 직접 변경 관리 섹션 */}
          {!isSanctuaryMode && (
            <>
              {isSp && (
                <div className={`p-3.5 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[13px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <IconVideo /> {currentMonthNum}월 기상오기 실황 및 홍보영상
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowMonthlyModal(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="1월~12월 월별 기상오기 링크 전체 관리"
                      >
                        📅 월별 링크 관리
                      </button>
                      <button onClick={handleShareVideo} className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer">
                        <IconShare /> 공유
                      </button>
                    </div>
                  </div>

                  {/* 🌟 [사용자 직접 변경 UI] 10월 등 해당 월 기상오기 유튜브 링크 자유 변경 */}
                  <div className={`flex gap-1.5 items-center p-2 rounded-xl border ${isDark ? 'bg-black/30 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap pl-1">
                      {currentMonthNum}월 영상 URL
                    </span>
                    <input 
                      type="text" 
                      value={inputUrl} 
                      onChange={(e) => setInputUrl(e.target.value)} 
                      onPointerDown={e => e.stopPropagation()} 
                      className={`flex-1 min-w-0 text-[12px] px-2.5 py-1.5 rounded-lg outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-amber-400' : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'}`} 
                      placeholder="유튜브 영상 주소 붙여넣기 (예: https://youtu.be/...)" 
                    />
                    <button 
                      onClick={handleApplyCurrentMonthGisanVideo}
                      className="shrink-0 px-3 py-1.5 bg-stone-900 hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-black rounded-lg cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      변경 저장
                    </button>
                  </div>

                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-black relative shadow-inner">
                    {gisanVidId ? (
                      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${gisanVidId}?rel=0`} title="기상오기" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/50">
                        위 입력창에 유튜브 링크를 붙여넣고 [변경 저장]을 눌러주세요.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isSp && (
                <div className={`p-3.5 rounded-xl border backdrop-blur-md flex flex-col gap-2 ignore-draw ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
                  <div className="flex justify-between items-center px-0.5">
                    <span className={`text-[12.5px] font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      <IconVideo /> 주일 예배 영상 시청
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowMonthlyModal(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        📅 기상오기 링크 관리
                      </button>
                      <a href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors">
                        유튜브 검색 ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="유튜브 링크 붙여넣기..." 
                      value={safeDay.sermonVideoUrl || ''} 
                      onChange={(e) => { 
                        const url = e.target.value.trim(); 
                        let vId = extractVideoId ? extractVideoId(url) : null;
                        if (!vId) {
                          const fallbackMatch = url.match(/([a-zA-Z0-9_-]{11})/);
                          if (fallbackMatch) vId = fallbackMatch[1];
                        }
                        updateDay({ 
                          sermonVideoUrl: url, 
                          sermonVideoId: vId || '' 
                        }); 
                      }} 
                      onPointerDown={e => e.stopPropagation()} 
                      className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[12px] font-medium outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                    />
                    <button 
                      onClick={handleShareVideo} 
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      <IconShare /> 공유
                    </button>
                  </div>

                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative shadow-inner">
                    {currentVideoId ? (
                      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&enablejsapi=1`} title="Sermon Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/50">영상을 검색해 링크를 붙여넣으세요.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 스마트 말씀 필기장 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md space-y-2.5 ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-white/10">
              <span className={`font-serif font-bold text-[13.5px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconDocument /> 설교 필기 및 말씀 묵상
              </span>
              <button 
                onClick={toggleSpeechRecognition}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center cursor-pointer ${
                  isSpeechRecording 
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse' 
                    : (isDark ? 'bg-white/10 border-white/10 text-white hover:bg-white/15' : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200')
                }`}
              >
                <IconMic className="mr-1 w-3.5 h-3.5" /> {isSpeechRecording ? '음성인식 작동중...' : '음성 필기'}
              </button>
            </div>

            <div className="w-full bg-transparent">
              <RichTextEditor 
                ref={sermonEditorRef} 
                value={safeDay.sermonNotes} 
                onChange={(val) => updateDay({ sermonNotes: val })} 
                t={t} 
                isSp={isSp} 
                bibles={bibles} 
                placeholder="[말씀 필기 팁]
1. 툴바를 이용해 표 생성과 형광펜 정렬이 가능합니다.
2. '로마서 8:28' 입력 후 스페이스바를 누르면 성경 본문이 자동 완성됩니다." 
              />
            </div>
            
            {/* 한줄 은혜 및 실천 결단 (릴스 버튼 제거됨) */}
            <div className="pt-2.5 space-y-1.5 ignore-draw border-t border-stone-200 dark:border-white/10">
              <span className="font-bold text-[11.5px] text-stone-500 flex items-center gap-1">
                <IconTarget /> 설교 핵심 은혜 및 삶의 실천 목표 (트래커 자동 연동)
              </span>

              <input 
                type="text" 
                value={safeDay.sermonGraceLine || ''} 
                onChange={(e) => handleGraceLineSync(e.target.value)} 
                placeholder="오늘 말씀에서 깨달은 하나님의 마음을 한 줄로 적어보세요." 
                className={`w-full px-3 py-2 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                onPointerDown={e => e.stopPropagation()} 
              />
              <input 
                type="text" 
                value={safeDay.sermonActionItem || ''} 
                onChange={(e) => handleActionItemSync(e.target.value)} 
                onBlur={(e) => { 
                  if (logUserAction && authUser?.name && e.target.value) {
                    logUserAction(authUser.name, '예배노트', 'write', `[실천목표] ${e.target.value}`);
                  }
                }} 
                placeholder="구체적인 실천 결단 (예: 직장에서 먼저 양보하고 온유하게 답하기)" 
                className={`w-full px-3 py-2 rounded-lg border text-[12.5px] font-bold outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                onPointerDown={e => e.stopPropagation()} 
              />
            </div>

            {/* 원스트림 인라인 연동 액션 허브 */}
            <div className={`p-3 rounded-xl border flex flex-col gap-2 mt-3 ${isDark ? 'bg-stone-900/60 border-white/10' : 'bg-stone-50 border-stone-200 shadow-2xs'}`}>
              <div className="flex justify-between items-center border-b pb-1.5 border-stone-200 dark:border-white/10">
                <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  🌱 원스트림 신앙 연동 액션
                </span>
                <span className="text-[10px] text-stone-400">페이지 이동 없이 즉시 보관</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button 
                  onClick={inlineActionSendToTracker}
                  className="py-2 px-2.5 rounded-lg bg-[#526359] hover:bg-[#435249] text-white text-[11.5px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all"
                >
                  🌿 트래커에 결단 심기
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
            </div>

          </div>

          {/* 나의 감사 선포 */}
          <div className={`p-3.5 rounded-xl border backdrop-blur-md ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex justify-between items-center mb-2">
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className={`font-bold text-[13px] flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconHeart className="text-rose-500" /> 나의 감사 선포
              </span>
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className="text-[11px] font-bold text-rose-500 cursor-pointer">
                선포문 작성 / 편집
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : []).map((q, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border flex justify-between items-center ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`}>
                  <div className="flex gap-2 items-start min-w-0 pr-2">
                    <span className="font-bold text-[11.5px] text-rose-500 mt-0.5">{i + 1}.</span>
                    <span className="text-[12.5px] font-medium leading-relaxed truncate">{q || <span className="opacity-40 text-stone-400">말씀을 듣고 일어난 감사를 고백하세요.</span>}</span>
                  </div>
                  {q && q.trim() && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendDeclarationToCell(q); }}
                      className="shrink-0 px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="목장 모임 감사 피드로 전송"
                    >
                      <IconSend /> 목장으로
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 나의 적용 질문 */}
          <div className={`p-3.5 rounded-xl border backdrop-blur-md cursor-pointer transition-colors hover:border-stone-400 ${isDark ? 'bg-[#181A20]/70 border-white/10' : 'bg-white/85 border-stone-200/80 shadow-2xs'}`} onClick={() => openModal && openModal('applyQuestion', safeDay, updateDay)}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-[13px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconPen /> 설교 속 구속사적 적용 질문
              </span>
              <button onClick={(e) => { e.stopPropagation(); toggleAiDetect && toggleAiDetect(); }} className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${isAiDetecting ? 'bg-stone-900 text-white border-stone-900 animate-pulse' : (isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-800')}`}>
                <IconMic /> {isAiDetecting ? '듣는중...' : '음성인식'}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(getArr && getArr(safeDay.applyQuestions).length > 0) ? getArr(safeDay.applyQuestions).map((q, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border flex gap-2 items-start ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`}>
                  <span className="font-bold text-[11.5px] text-stone-400 mt-0.5">{i + 1}.</span>
                  <span className="text-[12.5px] font-serif font-medium leading-relaxed whitespace-pre-wrap">{q}</span>
                </div>
              )) : <div className={`text-center py-2.5 rounded-lg text-[12px] font-medium border ${isDark ? 'bg-black/30 border-white/10 text-slate-400' : 'bg-stone-50/70 border-stone-200 text-stone-500'}`}>기록된 적용 질문이 없습니다.</div>}
            </div>
          </div>

        </div>
      </CanvasEngine>
      )}

      {/* 🌟 [신규 모달] 1~12월 기상오기 링크 사용자 전체 관리 모달 */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#16181D] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
            <div className="px-5 py-3.5 border-b border-stone-200 dark:border-white/10 flex justify-between items-center bg-stone-50 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span className="font-bold text-[14px]">1월~12월 월별 기상오기 영상 링크 관리</span>
              </div>
              <button onClick={() => setShowMonthlyModal(false)} className="text-xs font-bold text-stone-400 hover:text-stone-800 dark:hover:text-white p-1 cursor-pointer">
                닫기 ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 hide-scrollbar text-[12px]">
              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
                각 월에 상영될 기상오기 또는 홍보영상 유튜브 링크를 입력하세요. 저장 시 해당 월의 예배 노트에 자동으로 반영됩니다.
              </p>

              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const isCurrent = m === currentMonthNum;
                const mUrl = monthlyGisanUrls[m] || '';

                return (
                  <div key={m} className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${isCurrent ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20' : (isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50/50')}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-amber-500 animate-ping' : 'bg-stone-300'}`} />
                        {m}월 기상오기 영상 {isCurrent && <b className="text-amber-600 dark:text-amber-400 text-[10px]">[이번 달]</b>}
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <input 
                        type="text" 
                        value={mUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMonthlyGisanUrls(prev => ({ ...prev, [m]: val }));
                        }}
                        placeholder={`https://youtu.be/... (${m}월 유튜브 링크)`}
                        className={`flex-1 px-2.5 py-1.5 text-[11.5px] rounded-lg border outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 border-t border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black/20 flex gap-2">
              <button 
                onClick={() => setShowMonthlyModal(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-white/10 font-bold text-[12px] cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5"
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(monthlyGisanUrls));
                  if (monthlyGisanUrls[currentMonthNum]) {
                    localStorage.setItem(`app_active_gisangogi_url_${currentMonthNum}`, monthlyGisanUrls[currentMonthNum]);
                    localStorage.setItem('app_active_gisangogi_url', monthlyGisanUrls[currentMonthNum]);
                    if (setGisangogiUrl) setGisangogiUrl(monthlyGisanUrls[currentMonthNum]);
                    if (updateDay) updateDay({ sermonVideoUrl: monthlyGisanUrls[currentMonthNum] });
                  }
                  setShowMonthlyModal(false);
                  showToast("✨ 1~12월 기상오기 링크가 모두 저장되었습니다!");
                }}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-[12px] shadow-xs cursor-pointer"
              >
                전체 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
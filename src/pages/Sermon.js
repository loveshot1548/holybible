// src/components/Sermon.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';
import { BibleGalaxyArcModal, BIBLE_66_CANON, extractBibleRefInfo } from '../pages/BibleKnowledgeGalaxy';
import bibleData from '../ko_ko.json';

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

// 📖 내장 성경 DB(ko_ko.json)에서 설교 본문 구절들을 즉시 추출하는 헬퍼
const getLocalScriptureVerses = (refString) => {
  if (!refString) return { parsed: null, verses: [] };
  const info = extractBibleRefInfo(refString);
  if (!info) return { parsed: null, verses: [] };

  const canonMeta = BIBLE_66_CANON.find(b => b.ko === info.bookKo);
  if (!canonMeta) return { parsed: info, verses: [] };

  const rawBook = (Array.isArray(bibleData) ? bibleData : []).find(
    b => b.name === canonMeta.en || b.name === canonMeta.ko
  );
  const chapArr = rawBook?.chapters?.[Math.max(0, (info.chapter || 1) - 1)] || [];

  // 범위 구절 파싱 (예: 롬 8:28-30)
  const rangeMatch = String(refString).match(/:\s*(\d+)\s*[-~]\s*(\d+)/);
  const startV = rangeMatch ? parseInt(rangeMatch[1], 10) : (info.verse || 1);
  const endV = rangeMatch ? parseInt(rangeMatch[2], 10) : Math.min(chapArr.length, startV + 6);

  const verses = chapArr.map((txt, idx) => ({
    vNum: idx + 1,
    text: String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim(),
    isHighlight: idx + 1 >= startV && idx + 1 <= endV
  }));

  return {
    parsed: { ...info, bookEn: canonMeta.en, startV, endV },
    verses
  };
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
const IconMaximize = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>;

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
  const cinemaWrapperRef = useRef(null);

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

  // =====================================================================
  // 📺 [초고도화] 예배 시네마 전체화면 HUD & 매일QT형 원어·구속사 아크 연동 상태
  // =====================================================================
  const [isLiveCinemaMode, setIsLiveCinemaMode] = useState(false);
  const [cinemaHudTab, setCinemaHudTab] = useState('outline'); // 'scripture' | 'memo' | 'outline' | 'thanks' | 'interlinear' | null
  const [isCinemaUiHidden, setIsCinemaUiHidden] = useState(false); // 영상 집중 클린뷰(전체 숨김) 상태
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcModalInitialMode, setArcModalInitialMode] = useState('arc');
  const [isOriginalDrawerOpen, setIsOriginalDrawerOpen] = useState(false);
  const [interlinearWords, setInterlinearWords] = useState([]);
  const [isInterlinearLoading, setIsInterlinearLoading] = useState(false);
  const [selectedWordVerse, setSelectedWordVerse] = useState(1);

  // 팝업 내 성경구절 직접 검색 & 원어 한줄 메모 상태
  const [customRefQuery, setCustomRefQuery] = useState('');
  const [wordQuickMemo, setWordQuickMemo] = useState('');

  const activeReferenceStr = useMemo(() => {
    return (customRefQuery && customRefQuery.trim()) || safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || '로마서 8:28';
  }, [customRefQuery, safeDay.sermonReference, globalSharedQt, date]);

  const localScriptureData = useMemo(() => {
    return getLocalScriptureVerses(activeReferenceStr);
  }, [activeReferenceStr]);

  useEffect(() => {
    if (localScriptureData.parsed?.startV) {
      setSelectedWordVerse(localScriptureData.parsed.startV);
    }
  }, [localScriptureData.parsed?.bookKo, localScriptureData.parsed?.chapter, localScriptureData.parsed?.startV]);

  // 현재 본문 구절의 히브리어/헬라어 원어 단어 실시간 조회 (Supabase interlinear_bible 연동)
  const fetchSermonInterlinearWords = useCallback(async (bookKo, chap, verse) => {
    if (!supabase || !bookKo) return;
    setIsInterlinearLoading(true);
    try {
      const { data } = await supabase
        .from('interlinear_bible')
        .select('word_order, original_word, pronunciation, korean_trans, strongs_id, grammar')
        .eq('book', bookKo)
        .eq('chapter', Number(chap) || 1)
        .eq('verse', Number(verse) || 1)
        .order('word_order', { ascending: true })
        .limit(32);
      setInterlinearWords(data || []);
    } catch (_) {
      setInterlinearWords([]);
    } finally {
      setIsInterlinearLoading(false);
    }
  }, []);

  useEffect(() => {
    if ((isOriginalDrawerOpen || (isLiveCinemaMode && cinemaHudTab === 'interlinear')) && localScriptureData.parsed) {
      fetchSermonInterlinearWords(
        localScriptureData.parsed.bookKo,
        localScriptureData.parsed.chapter,
        selectedWordVerse || localScriptureData.parsed.startV || 1
      );
    }
  }, [isOriginalDrawerOpen, isLiveCinemaMode, cinemaHudTab, localScriptureData.parsed, selectedWordVerse, fetchSermonInterlinearWords]);

  // 브라우저 네이티브 전체화면(Fullscreen API) 진입/해제 핸들러
  const enterLiveCinemaFullscreen = async (defaultTab = 'outline') => {
    setIsLiveCinemaMode(true);
    setIsCinemaUiHidden(false);
    setCinemaHudTab(defaultTab);
    setTimeout(async () => {
      try {
        if (cinemaWrapperRef.current && cinemaWrapperRef.current.requestFullscreen) {
          await cinemaWrapperRef.current.requestFullscreen();
        }
      } catch (_) {}
    }, 80);
  };

  const exitLiveCinemaFullscreen = async () => {
    setIsLiveCinemaMode(false);
    setIsCinemaUiHidden(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (_) {}
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isLiveCinemaMode) {
        // ESC로 전체화면을 빠져나온 경우에도 부드럽게 유지
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isLiveCinemaMode]);

  useEffect(() => {
    const plainText = (safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '');
    const combinedText = `${safeDay.sermonReference || ''} ${plainText}`;
    const detected = extractBibleReferences(combinedText);
    setLinkedRefs(detected);
  }, [safeDay.sermonNotes, safeDay.sermonReference]);

  // =====================================================================
  // 🌟 [월별 기상오기 링크 관리 엔진]
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
  const activeYoutubeId = isSp ? (gisanVidId || currentVideoId) : (currentVideoId || gisanVidId);

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
      showToast("🙏 목장 모임 [감사나눔]으로 전송되었습니다!");
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
      <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] z-[200] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col transition-transform animate-fade-in ${isDarkTheme ? 'bg-[#121418] border-l border-white/10' : 'bg-white border-l border-stone-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-white/10' : 'border-stone-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-md ${isDarkTheme ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-700'}`}>🔗</span>
            <h3 className={`text-[14px] font-bold ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>{activeBacklink} 관련 기록</h3>
          </div>
          <button onClick={() => setActiveBacklink(null)} className={`p-1.5 rounded-full hover:bg-stone-500/20 transition-colors ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pointer-events-auto">
          {relatedEntries.length === 0 ? (
            <div className={`py-10 flex flex-col items-center gap-2 text-[12px] font-medium ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
              과거 예배/묵상 기록이 없습니다.
            </div>
          ) : (
            relatedEntries.map(([dKey, dVal]) => (
              <div key={dKey} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                <span className={`text-[10px] font-mono tracking-widest ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>{dKey}</span>
                <p className={`text-[13px] font-serif leading-relaxed line-clamp-4 ${isDarkTheme ? 'text-stone-200' : 'text-stone-700'}`}>
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

      {/* 1. 상단 글로벌 헤더 바 (정갈한 무채색 스톤 스타일로 통일) */}
      <header className={`shrink-0 px-3 sm:px-4 py-2.5 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#121418]/90' : 'border-stone-200/80 bg-white/90'}`}>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-black/5'}`}>
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <h1 className={`text-[15.5px] sm:text-[16px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>예배 노트</h1>
            {isSanctuaryMode && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/10 text-stone-200 border-white/15' : 'bg-stone-100 text-stone-700 border-stone-300'}`}>
                집중 모드
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {/* 📺 전체화면 + 노트/원어 HUD 버튼 (차분한 다크/화이트 솔리드 버튼) */}
          <button
            onClick={() => enterLiveCinemaFullscreen('outline')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-stone-100 text-stone-900 hover:bg-white' : 'bg-stone-900 text-white hover:bg-black'
            }`}
            title="유튜브 라이브 전체화면 위에 설교대지·자유메모·원어·아크 팝업을 띄웁니다"
          >
            <IconMaximize /> <span>라이브 전체화면 노트</span>
          </button>

          {/* 🔬 매일QT형 원어 분해 팝업 버튼 */}
          <button
            onClick={() => setIsOriginalDrawerOpen(true)}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span>🔬</span> <span className="hidden xs:inline">원어 사전</span>
          </button>

          {/* 🔗 구속사 아크 팝업 버튼 */}
          <button
            onClick={() => {
              setArcModalInitialMode('arc');
              setIsArcModalOpen(true);
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span>🔗</span> <span className="hidden xs:inline">구속사 아크</span>
          </button>

          <button 
            onClick={toggleSanctuaryMode}
            title="영상 및 잡음을 숨기고 설교에만 온전히 집중"
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              isSanctuaryMode 
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs' 
                : (isDark ? 'bg-white/5 border-white/15 text-stone-300 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100')
            }`}
          >
            <span>{isSanctuaryMode ? '🏛️ 본당 집중' : '일반'}</span>
          </button>

          <button onClick={() => setShowToolbar(!showToolbar)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${showToolbar ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent shadow-xs' : (isDark ? 'bg-white/5 text-stone-300 border-white/15' : 'bg-white text-stone-700 border-stone-200')}`}>
            <IconTool /> {showToolbar ? '도구 닫기' : '도구'}
          </button>
          
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-black/5'}`}>
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 인라인 액션 토스트 알림 플로터 */}
      {actionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999999] bg-stone-900 text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-2xl border border-white/20 animate-bounce flex items-center gap-2">
          <span>✨</span> {actionToast}
        </div>
      )}

      {/* 그리기 및 서식 도구 모음 */}
      {showToolbar && (
        <div className={`relative z-20 w-full px-2 py-1.5 border-b backdrop-blur-xl shrink-0 overflow-x-auto hide-scrollbar animate-fade-in ${isDark ? 'border-white/10 bg-[#121418]/90' : 'border-stone-200 bg-white/90'}`}>
          {renderToolbar && renderToolbar(sermonEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}
      
      {/* 2. 본문 뷰포트 레이아웃 */}
      {CanvasEngine && (
      <CanvasEngine key={`sermon_${date}`} saveKey={`sermon_${date}`} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} renderStickers={() => StickerLayer ? <StickerLayer memos={safeDay.memos} stickers={safeDay.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} /> : null}>
        <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2 sm:px-4 py-3 pb-32 relative z-10 space-y-3 max-w-4xl mx-auto">
          
          {/* 일자 바 & 아카이브/저장 제어 */}
          <div className={`px-3.5 py-2 rounded-xl border backdrop-blur-md flex justify-between items-center ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[13.5px] font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{date}</span>
              <span className="text-[10.5px] text-stone-400 font-mono">주일 대예배 설교</span>
            </div>

            <div className="flex gap-1.5 ignore-draw">
              <button onClick={() => openModal && openModal('sermonList')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/15' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}>
                <IconList /> 목록
              </button>
              <button onClick={downloadSermonWord} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 cursor-pointer hover:opacity-90">
                <IconSave /> Word 저장
              </button>
            </div>
          </div>

          {/* 설교 메타데이터 & 성경 본문 매핑 + 정갈한 원어/아크/은하계 직결 바 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
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
                  onChange={e => {
                    setCustomRefQuery(e.target.value);
                    updateDay && updateDay({ sermonReference: e.target.value });
                  }} 
                  onPointerDown={e => e.stopPropagation()} 
                  placeholder="본문 (예: 롬 8:28-30, 창 1:1)" 
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-[12.5px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                />
                <button 
                  onClick={() => findBibleText(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference)} 
                  className={`shrink-0 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <IconSearch /> 본문 삽입
                </button>
              </div>
            </div>

            {/* 🔬 정갈한 무채색 톤의 본문 연구 3대 버튼 바 (원어 사전 · 구속사 아크 · 말씀 은하계) */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsOriginalDrawerOpen(true)}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>🔬</span> <span>원어 분해 (QT형)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('arc');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>🔗</span> <span>구속사 아크 대조</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('2d');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>🌌</span> <span>말씀 은하계</span>
              </button>
            </div>

            {/* 오늘 나를 찌른 말씀의 앵커 (Conviction) */}
            <div className="pt-1 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-black/25 border-white/10' : 'bg-stone-50/70 border-stone-200/80'}`}>
                <span className={`text-[10.5px] font-bold font-serif ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  ⚡ 오늘 나를 찌른 설교 한마디 (회개와 결단의 앵커)
                </span>
                <input 
                  type="text" 
                  value={safeDay.sermonConviction || ''} 
                  onChange={e => updateDay && updateDay({ sermonConviction: e.target.value })} 
                  placeholder="설교 중 마음에 깊이 와닿았던 단 한 문장을 적어두고 묵상하세요..." 
                  className={`w-full bg-transparent outline-none text-[13px] font-serif font-medium leading-relaxed ${isDark ? 'text-white placeholder:text-stone-500' : 'text-stone-900 placeholder:text-stone-400'}`} 
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
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      activeBacklink === ref 
                        ? (isDark ? 'bg-white text-stone-900 border-white' : 'bg-stone-900 text-white border-stone-900')
                        : (isDark ? 'bg-black/40 border-white/10 text-stone-300 hover:text-white' : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900')
                    }`}
                  >
                    🔗 {ref} 과거 묵상 대조
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 설교 3대지 구조화 빌더 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div 
              onClick={() => setShowOutlineBuilder(!showOutlineBuilder)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-stone-300' : 'bg-stone-700'}`} />
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

          {/* 🌟 영상 시청 및 라이브 시네마 전체화면 진입 섹션 */}
          {!isSanctuaryMode && (
            <>
              {isSp ? (
                <div className={`p-3.5 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
                  <div className="flex justify-between items-center px-0.5 flex-wrap gap-1.5">
                    <span className="text-[13px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <IconVideo /> {currentMonthNum}월 기상오기 실황 및 홍보영상
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => enterLiveCinemaFullscreen('outline')}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <IconMaximize /> 전체화면 + 노트/원어 팝업
                      </button>
                      <button 
                        onClick={() => setShowMonthlyModal(true)}
                        className="text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        📅 월별 링크
                      </button>
                      <button onClick={handleShareVideo} className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer">
                        <IconShare /> 공유
                      </button>
                    </div>
                  </div>

                  <div className={`flex gap-1.5 items-center p-2 rounded-xl border ${isDark ? 'bg-black/30 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap pl-1">
                      {currentMonthNum}월 영상 URL
                    </span>
                    <input 
                      type="text" 
                      value={inputUrl} 
                      onChange={(e) => setInputUrl(e.target.value)} 
                      onPointerDown={e => e.stopPropagation()} 
                      className={`flex-1 min-w-0 text-[12px] px-2.5 py-1.5 rounded-lg outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-stone-400' : 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'}`} 
                      placeholder="유튜브 영상 주소 붙여넣기 (예: https://youtu.be/...)" 
                    />
                    <button 
                      onClick={handleApplyCurrentMonthGisanVideo}
                      className="shrink-0 px-3 py-1.5 bg-stone-900 hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      변경 저장
                    </button>
                  </div>

                  {!isLiveCinemaMode && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black relative shadow-inner">
                      {gisanVidId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${gisanVidId}?rel=0`} title="기상오기" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/50">
                          위 입력창에 유튜브 링크를 붙여넣고 [변경 저장]을 눌러주세요.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-3.5 rounded-xl border backdrop-blur-md flex flex-col gap-2 ignore-draw ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
                  <div className="flex justify-between items-center px-0.5 flex-wrap gap-1.5">
                    <span className={`text-[12.5px] font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      <IconVideo /> 주일 예배 영상 시청
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => enterLiveCinemaFullscreen('outline')}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <IconMaximize /> 전체화면 + 노트/원어 팝업
                      </button>
                      <button 
                        onClick={() => setShowMonthlyModal(true)}
                        className="text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        📅 기상오기 관리
                      </button>
                      <a href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors">
                        유튜브 검색 ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="유튜브 라이브 또는 설교 링크 붙여넣기..." 
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

                  {!isLiveCinemaMode && (
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative shadow-inner">
                      {currentVideoId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&enablejsapi=1`} title="Sermon Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/50">영상을 검색해 링크를 붙여넣으세요.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 스마트 말씀 필기장 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md space-y-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
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
            
            {/* 한줄 은혜 및 실천 결단 */}
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
            <div className={`p-3 rounded-xl border flex flex-col gap-2 mt-3 ${isDark ? 'bg-stone-900/60 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex justify-between items-center border-b pb-1.5 border-stone-200 dark:border-white/10">
                <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  🌱 원스트림 신앙 연동 액션
                </span>
                <span className="text-[10px] text-stone-400">페이지 이동 없이 즉시 보관</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button 
                  onClick={inlineActionSendToTracker}
                  className="py-2 px-2.5 rounded-lg bg-[#526359] hover:bg-[#435249] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  🌿 트래커에 결단 심기
                </button>
                <button 
                  onClick={inlineActionSendToPrayer}
                  className="py-2 px-2.5 rounded-lg bg-[#6B6177] hover:bg-[#594F64] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  🙏 나의 기도함에 저장
                </button>
                <button 
                  onClick={inlineActionSendToCounseling}
                  className="py-2 px-2.5 rounded-lg bg-[#506375] hover:bg-[#415160] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  💌 1:1 심층상담 요청
                </button>
              </div>
            </div>

          </div>

          {/* 나의 감사 선포 */}
          <div className={`p-3.5 rounded-xl border backdrop-blur-md ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex justify-between items-center mb-2">
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className={`font-bold text-[13px] flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconHeart /> 나의 감사 선포
              </span>
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className="text-[11px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-white cursor-pointer">
                선포문 작성 / 편집
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : []).map((q, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border flex justify-between items-center ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`}>
                  <div className="flex gap-2 items-start min-w-0 pr-2">
                    <span className="font-bold text-[11.5px] text-stone-400 mt-0.5">{i + 1}.</span>
                    <span className="text-[12.5px] font-medium leading-relaxed truncate">{q || <span className="opacity-40 text-stone-400">말씀을 듣고 일어난 감사를 고백하세요.</span>}</span>
                  </div>
                  {q && q.trim() && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendDeclarationToCell(q); }}
                      className={`shrink-0 px-2.5 py-1 rounded text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-white/10 hover:bg-white text-stone-200 hover:text-stone-900' : 'bg-stone-200 hover:bg-stone-900 text-stone-800 hover:text-white'
                      }`}
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
          <div className={`p-3.5 rounded-xl border backdrop-blur-md cursor-pointer transition-colors hover:border-stone-400 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`} onClick={() => openModal && openModal('applyQuestion', safeDay, updateDay)}>
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
              )) : <div className={`text-center py-2.5 rounded-lg text-[12px] font-medium border ${isDark ? 'bg-black/30 border-white/10 text-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-500'}`}>기록된 적용 질문이 없습니다.</div>}
            </div>
          </div>

        </div>
      </CanvasEngine>
      )}

      {/* ===================================================================== */}
      {/* 📺 [핵심 기능 1] 정갈한 고가독성 라이브 시네마 전체화면 (자유메모 + QT형 원어 + 화면숨김) */}
      {/* ===================================================================== */}
      {isLiveCinemaMode && (
        <div
          ref={cinemaWrapperRef}
          className="fixed inset-0 z-[99990] bg-black flex flex-col justify-between overflow-hidden select-none font-sans"
        >
          {/* 1) 배경 유튜브 라이브 풀스크린 영상 */}
          <div className="absolute inset-0 w-full h-full bg-black">
            {activeYoutubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&rel=0&playsinline=1`}
                title="Live Worship Fullscreen"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-3 p-6 text-center bg-[#0D0F12]">
                <span className="text-3xl">📺</span>
                <p className="text-sm font-bold text-white">등록된 유튜브 영상 링크가 없습니다.</p>
                <input
                  type="text"
                  placeholder="여기에 유튜브 라이브 링크를 붙여넣으세요..."
                  value={safeDay.sermonVideoUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    let vId = extractVideoId ? extractVideoId(url) : null;
                    if (!vId) {
                      const m = url.match(/([a-zA-Z0-9_-]{11})/);
                      if (m) vId = m[1];
                    }
                    updateDay && updateDay({ sermonVideoUrl: url, sermonVideoId: vId || '' });
                  }}
                  className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[#181B20] border border-white/20 text-white text-xs outline-none focus:border-white/50"
                />
              </div>
            )}
          </div>

          {/* 👁️ [영상 집중 클린뷰] 화면 숨기기를 눌렀을 때 우측 하단에 작게 남는 열기 버튼 */}
          {isCinemaUiHidden ? (
            <div className="relative z-30 mt-auto ml-auto p-4 pointer-events-auto">
              <button
                onClick={() => setIsCinemaUiHidden(false)}
                className="px-4 py-2 rounded-full bg-[#141619]/90 hover:bg-[#141619] text-stone-100 text-xs font-bold border border-white/20 shadow-2xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>👁️ 예배노트 · 원어 패널 다시 켜기</span>
              </button>
            </div>
          ) : (
            <>
              {/* 2) 상단 정갈한 상태 바 */}
              <div className="relative z-20 px-4 py-2.5 bg-[#121418]/95 border-b border-white/10 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-950 text-[10px] font-mono font-bold shrink-0">
                    LIVE NOTE
                  </span>
                  <span className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                    {safeDay.sermonTitle || '주일 예배 실황'}
                  </span>
                  <span className="text-xs font-mono text-stone-300 shrink-0">
                    ({activeReferenceStr})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsCinemaUiHidden(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1F2229] hover:bg-[#2A2E37] text-stone-200 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
                    title="모든 창을 숨기고 예배 영상에만 집중합니다"
                  >
                    👁️ 화면 숨기기
                  </button>
                  <button
                    onClick={exitLiveCinemaFullscreen}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ✕ 전체화면 닫기
                  </button>
                </div>
              </div>

              {/* 3) 우측 불투명 매트 다크 팝업 카드 (배경 비침 0%, 종이책 수준의 또렷한 가독성) */}
              {cinemaHudTab && (
                <div className="relative z-20 ml-auto mr-3 sm:mr-5 my-auto w-[94vw] sm:w-[440px] max-h-[70vh] rounded-2xl bg-[#14161A] border border-white/15 shadow-[0_28px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden pointer-events-auto animate-fade-in text-stone-100">
                  
                  {/* 카드 상단 헤더 & 구절 즉시 검색창 */}
                  <div className="px-4 py-3 bg-[#1B1E24] border-b border-white/10 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        {cinemaHudTab === 'scripture' && '📖 설교 본문 말씀'}
                        {cinemaHudTab === 'memo' && '📝 자유 설교 메모장'}
                        {cinemaHudTab === 'outline' && '📌 설교 3대지 & 실천 결단'}
                        {cinemaHudTab === 'interlinear' && '🔬 원어 성경 연구 (매일QT형)'}
                        {cinemaHudTab === 'thanks' && '🙏 나의 감사 선포'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsCinemaUiHidden(true)}
                          className="text-[11px] font-bold text-stone-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
                        >
                          숨기기
                        </button>
                        <button
                          onClick={() => setCinemaHudTab(null)}
                          className="text-[11px] font-bold text-stone-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer"
                        >
                          접기 ✕
                        </button>
                      </div>
                    </div>

                    {/* 본문/원어 탭일 때 원하는 성경 구절을 즉시 쳐서 조회하는 검색 바 */}
                    {(cinemaHudTab === 'scripture' || cinemaHudTab === 'interlinear') && (
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={customRefQuery || safeDay.sermonReference || ''}
                          onChange={(e) => {
                            setCustomRefQuery(e.target.value);
                            updateDay && updateDay({ sermonReference: e.target.value });
                          }}
                          placeholder="성경 구절 입력 (예: 창세기 1:1, 로마서 8:28, 요 3:16)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                        />
                        <button
                          onClick={() => {
                            if (localScriptureData.parsed) {
                              fetchSermonInterlinearWords(
                                localScriptureData.parsed.bookKo,
                                localScriptureData.parsed.chapter,
                                selectedWordVerse || localScriptureData.parsed.startV || 1
                              );
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-bold text-xs shrink-0 cursor-pointer"
                        >
                          조회
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 카드 본문 스크롤 영역 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar text-left text-xs">
                    
                    {/* [탭 A] 📖 본문 말씀 */}
                    {cinemaHudTab === 'scripture' && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-stone-400 pb-0.5">
                          구절을 터치하면 해당 절의 <b>원어 분해 카드</b>로 바로 연결됩니다.
                        </div>
                        {localScriptureData.verses.length === 0 ? (
                          <p className="text-stone-400 py-8 text-center">상단 입력창에 성경 구절(예: 창세기 1:1, 롬 8:28)을 입력해 주세요.</p>
                        ) : (
                          localScriptureData.verses.map(v => (
                            <div
                              key={v.vNum}
                              onClick={() => {
                                setSelectedWordVerse(v.vNum);
                                setCinemaHudTab('interlinear');
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                v.isHighlight
                                  ? 'bg-[#22262E] border-stone-400 text-white'
                                  : 'bg-[#191C22] border-white/5 text-stone-300 hover:bg-[#20242C]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-stone-300">
                                  {localScriptureData.parsed?.bookKo} {localScriptureData.parsed?.chapter}:{v.vNum}
                                </span>
                                <span className="text-[10px] font-bold text-stone-300 bg-white/10 px-2 py-0.5 rounded">
                                  원어 보기 ➔
                                </span>
                              </div>
                              <span className="font-serif text-[13px] leading-relaxed block">{v.text}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* [탭 B] 📝 자유 설교 메모장 (전체화면 중 자유 필기 & 음성 받아쓰기) */}
                    {cinemaHudTab === 'memo' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">⚡ 나를 찌른 설교 한마디</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="오늘 마음에 깊이 남은 한 문장..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-stone-300">✍️ 설교 노트 자유 필기 (본문 자동 연동)</label>
                            <button
                              onClick={toggleSpeechRecognition}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer ${
                                isSpeechRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-stone-200 hover:bg-white/15'
                              }`}
                            >
                              🎤 {isSpeechRecording ? '음성인식 중...' : '음성 받아쓰기'}
                            </button>
                          </div>
                          <textarea
                            rows={9}
                            value={(safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '')}
                            onChange={(e) => updateDay && updateDay({ sermonNotes: e.target.value })}
                            placeholder="영상을 보면서 자유롭게 말씀을 필기하세요. 여기에 적으신 내용은 예배노트 본문 필기장에 그대로 반영됩니다."
                            className="w-full p-3 rounded-xl bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-[13px] font-serif leading-relaxed outline-none focus:border-white/40 resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* [탭 C] 📌 설교 3대지 & 결단 실시간 필기 */}
                    {cinemaHudTab === 'outline' && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">⚡ 나를 찌른 설교 한마디</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="오늘 마음에 와닿은 핵심 문장..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">1. 제1대지 (본문 관찰 및 하나님의 성품)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint1 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint1: e.target.value })}
                            placeholder="제1대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">2. 제2대지 (직면한 죄와 회개)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint2 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint2: e.target.value })}
                            placeholder="제2대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">3. 제3대지 (십자가 은혜와 순종)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint3 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint3: e.target.value })}
                            placeholder="제3대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">🎯 이번 주 실천 결단 (트래커 연동)</label>
                          <input
                            type="text"
                            value={safeDay.sermonActionItem || ''}
                            onChange={(e) => handleActionItemSync(e.target.value)}
                            placeholder="구체적인 순종 실천 1가지..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                          />
                        </div>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={inlineActionSendToTracker}
                            className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-white text-stone-900 font-bold text-[11.5px] cursor-pointer transition-colors"
                          >
                            ✓ 트래커 반영
                          </button>
                          <button
                            onClick={inlineActionSendToPrayer}
                            className="flex-1 py-2 rounded-lg bg-[#252932] hover:bg-[#2F3440] text-stone-100 border border-white/10 font-bold text-[11.5px] cursor-pointer transition-colors"
                          >
                            🙏 기도함 보관
                          </button>
                        </div>
                      </div>
                    )}

                    {/* [탭 D] 🔬 매일QT 스타일 원어 성경 연구 (한글 본문 + 어절 카드 그리드 + 원어 메모장) */}
                    {cinemaHudTab === 'interlinear' && (
                      <div className="space-y-3">
                        {/* 선택된 절의 한글 본문 박스 */}
                        <div className="p-3 rounded-xl bg-[#1B1E24] border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              📖 {localScriptureData.parsed?.bookKo || '본문'} {localScriptureData.parsed?.chapter || 1}장 {selectedWordVerse}절
                            </span>
                            <select
                              value={selectedWordVerse}
                              onChange={(e) => setSelectedWordVerse(Number(e.target.value))}
                              className="px-2.5 py-1 rounded bg-[#0E1013] border border-white/20 text-white font-bold text-xs outline-none cursor-pointer"
                            >
                              {(localScriptureData.verses.length > 0 ? localScriptureData.verses : [{ vNum: 1 }]).map(v => (
                                <option key={v.vNum} value={v.vNum}>{v.vNum}절 선택</option>
                              ))}
                            </select>
                          </div>
                          <p className="font-serif text-[12.5px] text-stone-200 leading-relaxed">
                            {localScriptureData.verses.find(v => v.vNum === selectedWordVerse)?.text || '상단 입력창에 성경 구절을 입력하면 한글 본문과 원어가 함께 표시됩니다.'}
                          </p>
                        </div>

                        {/* 원어 묵상 메모 입력란 */}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={wordQuickMemo}
                            onChange={(e) => setWordQuickMemo(e.target.value)}
                            placeholder="원어 카드를 누르거나 메모를 적어 노트에 추가하세요..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!wordQuickMemo.trim()) return;
                              const prev = safeDay.sermonNotes || '';
                              updateDay && updateDay({ sermonNotes: `${prev}<p><b>[원어 묵상]</b> ${wordQuickMemo.trim()}</p>` });
                              setWordQuickMemo('');
                              showToast('✍️ 원어 묵상 메모가 설교 노트에 삽입되었습니다!');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-bold text-xs shrink-0 cursor-pointer"
                          >
                            + 노트저장
                          </button>
                        </div>

                        {isInterlinearLoading ? (
                          <div className="py-8 text-center text-stone-400">원어 형태소를 불러오는 중...</div>
                        ) : interlinearWords.length === 0 ? (
                          <div className="py-6 text-center text-stone-400">
                            해당 절의 원어 데이터를 불러오려면 상단에 정확한 구절(예: 창세기 1:1, 요한복음 1:1, 로마서 8:28)을 입력해 주세요.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {interlinearWords.map((w, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  const summary = `${w.original_word}(${w.pronunciation}, ${w.strongs_id}): ${w.korean_trans}`;
                                  setWordQuickMemo(prev => (prev ? `${prev} / ${summary}` : summary));
                                }}
                                className="p-2.5 rounded-xl bg-[#1B1E24] hover:bg-[#242830] border border-white/10 hover:border-stone-400 transition-all cursor-pointer space-y-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-bold text-white">{w.original_word}</span>
                                  <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-stone-300">{w.strongs_id}</span>
                                </div>
                                <div className="text-[10.5px] text-stone-400 font-medium">[{w.pronunciation}]</div>
                                <div className="text-[11.5px] text-stone-100 font-bold">{w.korean_trans}</div>
                                {w.grammar && <div className="text-[9.5px] text-stone-400 pt-0.5">{w.grammar}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* [탭 E] 🙏 감사 선포 */}
                    {cinemaHudTab === 'thanks' && (
                      <div className="space-y-2.5">
                        <span className="text-[11px] text-stone-300 font-bold block">말씀을 들으며 고백하는 감사 선포</span>
                        {(getArr ? getArr(safeDay.thanksDeclarations, ['', '', '']) : ['', '']).map((q, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <span className="text-stone-400 font-bold w-4">{idx + 1}.</span>
                            <input
                              type="text"
                              value={q || ''}
                              onChange={(e) => {
                                const arr = [...(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : ['', ''])];
                                arr[idx] = e.target.value;
                                updateDay && updateDay({ thanksDeclarations: arr });
                              }}
                              placeholder="감사 제목을 입력하세요..."
                              className="flex-1 px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white placeholder:text-stone-500 text-xs outline-none focus:border-white/40"
                            />
                            {q && q.trim() && (
                              <button
                                onClick={() => handleSendDeclarationToCell(q)}
                                className="px-2.5 py-2 rounded-lg bg-stone-200 hover:bg-white text-stone-900 font-bold text-[10.5px] shrink-0 cursor-pointer"
                              >
                                목장전송
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4) 하단 중앙 차분한 모던 다크 독(Dock) 바 (형광/무지개 색상 전면 제거) */}
              <div className="relative z-20 pb-3.5 pt-2 px-3 flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto">
                <div className="flex flex-wrap items-center gap-1 bg-[#14161A]/95 border border-white/15 p-1.5 rounded-full shadow-2xl">
                  {[
                    { id: 'scripture', label: '📖 본문말씀' },
                    { id: 'memo', label: '📝 자유메모장' },
                    { id: 'outline', label: '📌 설교3대지' },
                    { id: 'interlinear', label: '🔬 원어사전' },
                    { id: 'thanks', label: '🙏 감사선포' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setCinemaHudTab(prev => (prev === btn.id ? null : btn.id))}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                        cinemaHudTab === btn.id
                          ? 'bg-white text-stone-950 shadow-xs'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}

                  <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                  <button
                    onClick={() => {
                      setArcModalInitialMode('arc');
                      setIsArcModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-stone-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    🔗 구속사 아크
                  </button>

                  <button
                    onClick={() => setIsCinemaUiHidden(true)}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    👁️ 숨기기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🔬 [핵심 기능 2] 일반 모드에서도 열리는 '매일QT 스타일' 구절검색형 원어 팝업 */}
      {/* ===================================================================== */}
      {isOriginalDrawerOpen && (
        <div
          className="fixed inset-0 z-[99980] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none"
          onClick={() => setIsOriginalDrawerOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[86vh] rounded-2xl bg-[#14161A] border border-white/15 text-white p-4 sm:p-5 shadow-2xl flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* 상단 타이틀 & 성경 구절 직접 검색창 */}
            <div className="flex flex-col gap-3 border-b border-white/10 pb-3.5 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">
                    INTERLINEAR & SCRIPTURE STUDIO
                  </span>
                  <h3 className="text-base font-bold text-white">
                    🔬 성경 본문 말씀 & 원어 형태소 분해 ({activeReferenceStr})
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (localScriptureData.parsed) {
                        localStorage.setItem('interlinear_jump', JSON.stringify({
                          book: localScriptureData.parsed.bookKo,
                          chapter: localScriptureData.parsed.chapter,
                          verse: selectedWordVerse
                        }));
                      }
                      setIsOriginalDrawerOpen(false);
                      setActiveScreen && setActiveScreen('interlinear');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-bold cursor-pointer"
                  >
                    원어 연구실 전체열기 ↗
                  </button>
                  <button
                    onClick={() => setIsOriginalDrawerOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-bold cursor-pointer"
                  >
                    ✕ 닫기
                  </button>
                </div>
              </div>

              {/* 성경 구절 직접 입력 검색 바 */}
              <div className="flex gap-2 items-center bg-[#1B1E24] p-2 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-stone-300 pl-2 shrink-0">성경구절 검색</span>
                <input
                  type="text"
                  value={customRefQuery || safeDay.sermonReference || ''}
                  onChange={(e) => {
                    setCustomRefQuery(e.target.value);
                    updateDay && updateDay({ sermonReference: e.target.value });
                  }}
                  placeholder="예: 창세기 1:1, 시편 23:1, 로마서 8:28, 요 3:16"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none focus:border-white/40"
                />
                <button
                  onClick={() => {
                    if (localScriptureData.parsed) {
                      fetchSermonInterlinearWords(
                        localScriptureData.parsed.bookKo,
                        localScriptureData.parsed.chapter,
                        selectedWordVerse || localScriptureData.parsed.startV || 1
                      );
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-bold text-xs cursor-pointer shrink-0"
                >
                  구절 조회
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
              {/* 좌측: 설교 본문 장 전체 말씀 (절 클릭 시 우측 원어 연동) */}
              <div className="md:col-span-5 flex flex-col min-h-0 border border-white/10 rounded-xl p-3 bg-[#191C22]">
                <span className="text-xs font-bold text-stone-200 pb-2 mb-2 border-b border-white/10 block">
                  📖 {localScriptureData.parsed?.bookKo || '성경'} {localScriptureData.parsed?.chapter || 1}장 (절 클릭 시 원어 표시)
                </span>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                  {localScriptureData.verses.map(v => (
                    <div
                      key={v.vNum}
                      onClick={() => setSelectedWordVerse(v.vNum)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedWordVerse === v.vNum
                          ? 'bg-stone-100 text-stone-950 border-white font-bold'
                          : v.isHighlight
                          ? 'bg-[#242832] border-stone-500 text-white'
                          : 'bg-[#121418] border-white/5 text-stone-300 hover:bg-white/10'
                      }`}
                    >
                      <span className={`font-mono font-bold mr-1.5 ${selectedWordVerse === v.vNum ? 'text-stone-900' : 'text-stone-400'}`}>
                        {v.vNum}절
                      </span>
                      <span className="font-serif leading-relaxed">{v.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 우측: 선택한 절의 매일QT 스타일 어절별 원어 카드 그리드 */}
              <div className="md:col-span-7 flex flex-col min-h-0 border border-white/10 rounded-xl p-3 bg-[#191C22]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-stone-200">
                    🏛️ {selectedWordVerse}절 원어 형태소 · 스트롱 사전 ({interlinearWords.length}개 어절)
                  </span>
                  <span className="text-[10.5px] text-stone-400">카드 클릭 시 설교노트에 삽입</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
                  {isInterlinearLoading ? (
                    <div className="py-12 text-center text-xs text-stone-400">원어 데이터를 불러오는 중입니다...</div>
                  ) : interlinearWords.length === 0 ? (
                    <div className="py-10 text-center text-xs text-stone-400">
                      좌측에서 절을 선택하거나 상단 검색란에 정확한 성경 장·절(예: 창 1:1, 롬 8:28)을 입력해 주세요.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {interlinearWords.map((w, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const prev = safeDay.sermonNotes || '';
                            const snippet = `<p><b>[원어 묵상: ${w.original_word} (${w.pronunciation}, ${w.strongs_id})]</b> 뜻: ${w.korean_trans} (${w.grammar || ''})</p>`;
                            updateDay && updateDay({ sermonNotes: prev + snippet });
                            showToast(`✍️ [${w.original_word}] 원어 해설이 설교 필기장에 삽입되었습니다!`);
                          }}
                          className="p-3 rounded-xl bg-[#121418] hover:bg-[#1E222A] border border-white/10 hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-white">{w.original_word}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                              {w.strongs_id}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-stone-400">[{w.pronunciation}]</div>
                          <div className="text-xs font-bold text-stone-100 mt-0.5">{w.korean_trans}</div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                            <span className="text-[10px] text-stone-400 truncate">{w.grammar || '원어 어근'}</span>
                            <span className="text-[10px] font-bold text-stone-200 shrink-0">+ 노트삽입</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🌈 [핵심 기능 3] 구속사 아크 & 성경 은하계 올인원 팝업 포털 연동        */}
      {/* ===================================================================== */}
      <BibleGalaxyArcModal
        isOpen={isArcModalOpen}
        onClose={() => setIsArcModalOpen(false)}
        initialMode={arcModalInitialMode}
        initialRefQuery={activeReferenceStr}
        setActiveScreen={setActiveScreen}
        onInsertInsight={(formattedText) => {
          const prev = safeDay.sermonNotes || '';
          const htmlSnippet = `<p>${formattedText.replace(/\n/g, '<br/>')}</p>`;
          updateDay && updateDay({ sermonNotes: prev + htmlSnippet });
          setIsArcModalOpen(false);
          showToast('🔗 신구약 구속사 아크 대조 내용이 설교 필기장에 삽입되었습니다!');
        }}
      />

      {/* ===================================================================== */}
      {/* 📅 [기존 모달 유지] 1~12월 기상오기 링크 사용자 전체 관리 모달          */}
      {/* ===================================================================== */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-[99995] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
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
                  <div key={m} className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${isCurrent ? 'border-stone-500 bg-stone-100/60 dark:bg-white/10' : (isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50/50')}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-stone-800 dark:bg-white' : 'bg-stone-300'}`} />
                        {m}월 기상오기 영상 {isCurrent && <b className="text-stone-700 dark:text-stone-200 text-[10px]">[이번 달]</b>}
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
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-[12px] cursor-pointer"
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
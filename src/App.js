// src/App.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  Menu,
  ChevronRight,
  ChevronDown,
  Heart,
  Flame,
  BookOpen,
  Smile,
  Church,
  Play,
  FileText,
  Headphones,
  Compass,
  Download,
  Users,
  BarChart3,
  PenLine,
  ArrowLeft,
  Calendar,
  Check,
  Sparkles,
  Globe,
  HandHeart,
  Footprints,
  Building2,
  X,
  ExternalLink
} from 'lucide-react';
import RadioPopup from './components/RadioPopup';
import { getMcheynePlan } from './mcheyneData';
import bibleData from './ko_ko.json';
import { supabase } from './lib/supabase';
import BibleWiki from './pages/BibleWiki';
import SermonArchive from './components/SermonArchive';
import ApplyTracker from './components/ApplyTracker';
import ChurchSketchIcon from './components/ChurchSketchIcon';
import SermonArchiveAdvanced from './components/SermonArchiveAdvanced';
import BibleWikiAdvanced from './pages/BibleWikiAdvanced';
import Bible from './pages/Bible';
import BibleMapViewer from './components/BibleMapViewer';
import BibleSecondBrain3D from './pages/BibleSecondBrain3D';
import FiveSetMenu from './pages/FiveSetMenu';
import Diary from './pages/Diary';
import TrainingSubPages from './components/TrainingSubPages';
import FamilyScreens from './pages/FamilyScreens';
import YouthTrainingCurriculum from './pages/YouthTrainingCurriculum';
import Interlinear from './pages/Interlinear';
import QT from './pages/QT';
import SecretChat from './components/SecretChat';
import MetaverseHub from './metaverse/MetaverseHub';
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
import InterlinearKids from './pages/InterlinearKids';
import JerusalemTycoon from './pages/JerusalemTycoon';
import BibleKnowledgeGalaxy from './pages/BibleKnowledgeGalaxy';
import VirtualChurchLobby from './pages/VirtualChurchLobby';

// Passive 이벤트 리스너 내부의 preventDefault 호출 에러 방지
if (typeof window !== 'undefined' && typeof Event !== 'undefined') {
  const rawPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function () {
    if (this.cancelable !== false) {
      rawPreventDefault.apply(this, arguments);
    }
  };
}

const TESTIMONY_TEMPLATE = `1. 제목 (한 문장으로) : \n\n2. 오늘 받은 말씀 : \n\n3. 사건 (무슨 일이 있었는가?) : \n\n4. 내 죄와 우상 (왜 그렇게 반응했는가?) : \n\n5. 말씀으로 받은 깨달음 : \n\n6. 적용 (구체적으로 무엇을 순종할 일인가?) : \n\n7. 하나님이 주신 열매 : \n\n8. 감사 : `;

const getArr = (val, def = []) => (Array.isArray(val) ? val : def);
const safeParse = (key, def) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return def;
    const parsed = JSON.parse(val);
    return parsed !== null ? parsed : def;
  } catch (e) {
    return def;
  }
};
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[용량 초과 방어] ${key} 저장 실패`);
  }
};

const bibles =
  typeof bibleData !== 'undefined' && bibleData.length > 0
    ? bibleData
    : [{ name: 'Genesis', chapters: [['태초에 하나님이 천지를 창조하시니라']] }];

const bookNamesKo = {
  Genesis: '창세기', Exodus: '출애굽기', Leviticus: '레위기', Numbers: '민수기', Deuteronomy: '신명기',
  Joshua: '여호수아', Judges: '사사기', Ruth: '룻기', '1 Samuel': '사무엘상', '2 Samuel': '사무엘하',
  '1 Kings': '열왕기상', '2 Kings': '열왕기하', '1 Chronicles': '역대상', '2 Chronicles': '역대하',
  Ezra: '에스라', Nehemiah: '느헤미야', Esther: '에스더', Job: '욥기', Psalms: '시편',
  Proverbs: '잠언', Ecclesiastes: '전도서', 'Song of Solomon': '아가', Isaiah: '이사야', Jeremiah: '예레미야',
  Lamentations: '예레미야애가', Ezekiel: '에스겔', Daniel: '다니엘', Hosea: '호세아', Joel: '요엘',
  Amos: '아모스', Obadiah: '오바댜', Jonah: '요나', Micah: '미가', Nahum: '나훔',
  Habakkuk: '하박국', Zephaniah: '스바냐', Haggai: '학개', Zechariah: '스가랴', Malachi: '말라기',
  Matthew: '마태복음', Mark: '마가복음', Luke: '누가복음', John: '요한복음', Acts: '사도행전',
  Romans: '로마서', '1 Corinthians': '고린도전서', '2 Corinthians': '고린도후서', Galatians: '갈라디아서',
  Ephesians: '에베소서', Philippians: '빌립보서', Colossians: '골로새서', '1 Thessalonians': '데살로니가전서',
  '2 Thessalonians': '데살로니가후서', '1 Timothy': '디모데전서', '2 Timothy': '디모데후서', Titus: '디도서',
  Philemon: '빌레몬서', Hebrews: '히브리서', James: '야고보서', '1 Peter': '베드로전서',
  '2 Peter': '베드로후서', '1 John': '요한일서', '2 John': '요한이서', '3 John': '요한삼서',
  Jude: '유다서', Revelation: '요한계시록'
};
const getKoName = (n) => bookNamesKo[n] || n;

const FULL_BIBLE_MAP = {
  창: 'Genesis', 창세기: 'Genesis', 출: 'Exodus', 출애굽기: 'Exodus', 레: 'Leviticus', 레위기: 'Leviticus',
  민: 'Numbers', 민수기: 'Numbers', 신: 'Deuteronomy', 신명기: 'Deuteronomy', 수: 'Joshua', 여호수아: 'Joshua',
  삿: 'Judges', 사사기: 'Judges', 룻: 'Ruth', 룻기: 'Ruth', 삼상: '1 Samuel', 사무엘상: '1 Samuel',
  삼하: '2 Samuel', 사무엘하: '2 Samuel', 왕상: '1 Kings', 열왕기상: '1 Kings', 왕하: '2 Kings', 열왕기하: '2 Kings',
  대상: '1 Chronicles', 역대상: '1 Chronicles', 대하: '2 Chronicles', 역대하: '2 Chronicles', 스: 'Ezra', 에스라: 'Ezra',
  느: 'Nehemiah', 느헤미야: 'Nehemiah', 에: 'Esther', 에스더: 'Esther', 욥: 'Job', 욥기: 'Job',
  시: 'Psalms', 시편: 'Psalms', 잠: 'Proverbs', 잠언: 'Proverbs', 전: 'Ecclesiastes', 전도서: 'Ecclesiastes',
  아: 'Song of Solomon', 아가: 'Song of Solomon', 사: 'Isaiah', 이사야: 'Isaiah', 렘: 'Jeremiah', 예레미야: 'Jeremiah',
  애: 'Lamentations', 예레미야애가: 'Lamentations', 겔: 'Ezekiel', 에스겔: 'Ezekiel', 단: 'Daniel', 다니엘: 'Daniel',
  호: 'Hosea', 호세아: 'Hosea', 욜: 'Joel', 요엘: 'Joel', 암: 'Amos', 아모스: 'Amos',
  옵: 'Obadiah', 오바댜: 'Obadiah', 욘: 'Jonah', 요나: 'Jonah', 미: 'Micah', 미가: 'Micah',
  나: 'Nahum', 나훔: 'Nahum', 합: 'Habakkuk', 하박국: 'Habakkuk', 습: 'Zephaniah', 스바냐: 'Zephaniah',
  학: 'Haggai', 학개: 'Haggai', 슥: 'Zechariah', 스가랴: 'Zechariah', 말: 'Malachi', 말라기: 'Malachi',
  마: 'Matthew', 마태: 'Matthew', 마태복음: 'Matthew', 마탭복음: 'Matthew', 막: 'Mark', 마가: 'Mark', 마가복음: 'Mark',
  눅: 'Luke', 누가: 'Luke', 누가복음: 'Luke', 요: 'John', 요한: 'John', 요한복음: 'John',
  행: 'Acts', 사도행전: 'Acts', 롬: 'Romans', 로마서: 'Romans', 고전: '1 Corinthians', 고린도전서: '1 Corinthians',
  고후: '2 Corinthians', 고린도후서: '2 Corinthians', 갈: 'Galatians', 갈라디아서: 'Galatians', 엡: 'Ephesians', 에베소서: 'Ephesians',
  빌: 'Philippians', 빌립보서: 'Philippians', 골: 'Colossians', 골로새서: 'Colossians', 살전: '1 Thessalonians', 데살로니가전서: '1 Thessalonians',
  살후: '2 Thessalonians', 데살로니가후서: '2 Thessalonians', 딤전: '1 Timothy', 디모데전서: '1 Timothy',
  딤후: '2 Timothy', 디모데후서: '2 Timothy', 딛: 'Titus', 디도서: 'Titus', 몬: 'Philemon', 빌레몬서: 'Philemon',
  히: 'Hebrews', 히브리서: 'Hebrews', 약: 'James', 야고보서: 'James', 벧전: '1 Peter', 베드로전서: '1 Peter',
  벧후: '2 Peter', 베드로후서: '2 Peter', 요일: '1 John', 요한일서: '1 John', 요이: '2 John', 요한이서: '2 John',
  요삼: '3 John', 요한삼서: '3 John', 유: 'Jude', 유다서: 'Jude', 계: 'Revelation', 요한계시록: 'Revelation'
};

const getLocalToday = () => {
  const o = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - o).toISOString().split('T')[0];
};

const cleanText = (t) => {
  if (!t) return '';
  let str = typeof t === 'object' ? t.text || t.content || JSON.stringify(t) : String(t);
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/['\x1B]|\(가정\d*\)|\(개인\d*\)|\(개인\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

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

const getSeededVerse = (d, type) => {
  const h =
    d
      .replace(/-/g, '')
      .split('')
      .reduce((a, c) => a + parseInt(c || 0), 0) + parseInt(d.slice(-2));
  return type === 'family' ? familyVerseCards[h % familyVerseCards.length] : newYearVerseCards[h % newYearVerseCards.length];
};

const formatVerseText = (ft) => {
  if (!ft || typeof ft !== 'string') return { text: '말씀을 불러오는 중입니다...', ref: '' };
  const match = ft.match(/(.*?)\s*(\([^)]+\))$/);
  return match ? { text: match[1], ref: match[2] } : { text: ft, ref: '' };
};

const extractVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : cleanUrl.length === 11 ? cleanUrl : null;
};

const isGisangogi = (d) => {
  const dObj = new Date(d);
  const m = dObj.getMonth() + 1;
  const dt = dObj.getDate();
  return (
    (m === 9 && dt >= 7 && dt <= 11) ||
    (m === 10 && dt >= 12 && dt <= 16) ||
    (m === 11 && dt >= 2 && dt <= 6) ||
    (m === 11 && dt >= 30) ||
    (m === 12 && dt <= 4)
  );
};

const warmBgIds = [
  '1493246507139-91e8fad9978e',
  '1504052434569-70ad5836ab65',
  '1470252649378-9c29740c9fa8',
  '1518837695005-2083093ee35b',
  '1464822759023-fed622ff2c3b',
  '1502481851512-e9e2529bfbf9',
  '1534447677768-be436bb09401',
  '1447752875215-b2761acb3c5d',
  '1451187580459-43490279c0fa',
  '1448375240586-882707db888b',
  '1456513080510-7bf3a84b82f8',
  '1455390582262-044cdead277a',
  '1511497584788-876760111969',
  '1507525428034-b723cf961d3e',
  '1432405972823-1d20071da05d',
  '1446329813274-7c9036bb9a8f',
  '1476820865390-c52aeebb9891',
  '1505144808419-1957a94ca61e',
  '1490730141103-6cac27aaab94',
  '1469474968028-56623f02e42e'
];
const watercolorBgs = Array.from(
  { length: 100 },
  (_, i) => `https://images.unsplash.com/photo-${warmBgIds[i % warmBgIds.length]}?auto=format&fit=crop&w=1080&q=80`
);

const useTheme = (isD) =>
  useMemo(
    () => ({
      appBg: isD ? 'bg-[#101216]' : 'bg-[#F4F6FA]',
      pageBg: isD ? 'bg-[#101216]' : 'bg-[#F4F6FA]',
      cardBg: isD ? 'bg-[#181B20] border-[#262A32]' : 'bg-white border-[#E5E8EB]',
      bgBody: isD ? 'bg-[#101216]' : 'bg-[#F4F6FA]',
      bgElevated: isD ? 'bg-[#22262E]' : 'bg-[#F2F4F6]',
      bgInput: isD ? 'bg-[#22262E] text-white border-[#2E333D]' : 'bg-[#F2F4F6] text-[#191F28] border-transparent',
      btnPrimary: 'bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white',
      btnSecondary: isD ? 'bg-[#22262E] text-[#E5E8EB]' : 'bg-[#F2F4F6] text-[#4E5968]',
      btnGhost: isD ? 'hover:bg-white/10' : 'hover:bg-black/5',
      textMain: isD ? 'text-[#F9FAFB]' : 'text-[#191F28]',
      textSub: isD ? 'text-[#9BA3B0]' : 'text-[#6B7684]',
      inputBg: isD ? 'bg-[#22262E] text-[#F9FAFB] border-[#2E333D]' : 'bg-[#F2F4F6] text-[#191F28] border-transparent',
      tabBar: isD ? 'bg-[#181B20]/95 border-[#262A32]' : 'bg-white/95 border-[#E5E8EB]',
      border: isD ? 'border-[#262A32]' : 'border-[#E5E8EB]',
      iconDarkBg: isD ? 'bg-[#22262E]' : 'bg-[#F2F4F6]',
      primaryBg: 'bg-[#3B82F6]',
      primaryText: 'text-[#3B82F6]',
      pinkText: 'text-[#3B82F6]',
      yellowText: 'text-[#3B82F6]',
      greenText: 'text-[#3B82F6]',
      purpleText: 'text-[#3B82F6]',
      highlight: isD ? 'bg-[#22262E]' : 'bg-[#E5E8EB]'
    }),
    [isD]
  );

// 앱 크래시 방어선
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Crash Prevented:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-[#F4F6FA] text-[#191F28] h-screen flex flex-col justify-center items-center">
          <h2 className="text-[18px] font-bold mb-2">일시적인 화면 렌더링 오류가 발생했습니다.</h2>
          <p className="text-[15px] text-[#6B7684] mb-6">데이터는 안전하게 보존되어 있습니다. 아래 버튼을 눌러 화면을 복구하세요.</p>
          <button
            onClick={() => {
              localStorage.removeItem('home_menu_order');
              localStorage.removeItem('home_menu_order_ids_v2');
              window.location.reload(true);
            }}
            className="px-6 py-3 bg-[#3B82F6] text-white rounded-2xl font-bold text-[15px] cursor-pointer"
          >
            앱 다시 시작하기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// QR 자동 출석 훅
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
            alert('오늘은 정기 예배(수/금/일) 요일이 아닙니다.');
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
          const targetCell = authUser?.cell_name || authUser?.shepherdName || authUser?.group || '소속 목장';
          const { error } = await supabase.from('attendance_records').upsert(
            {
              date: attDate,
              user_name: currentName,
              cell_name: targetCell,
              type: attType,
              status: '출석'
            },
            { onConflict: 'date,user_name,type' }
          );
          if (error) throw error;
          alert(`[${attType} 예배] ${currentName} 성도님 출석 체크가 완료되었습니다.`);
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

// 활동 로그 수집 엔진
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
    } catch (e) {
      finalName = `게스트_${deviceId.slice(-4)}`;
    }
  }

  const nowIso = new Date().toISOString();

  try {
    await supabase.from('user_activity_log').insert([
      {
        user_name: finalName,
        page_visited: finalPage || 'home',
        action_type: actionType || 'view',
        action_detail: detailText ? String(detailText).substring(0, 300) : `${finalPage || 'home'} 열람`,
        created_at: nowIso
      }
    ]);

    await supabase.from('user_activity').upsert(
      {
        user_name: finalName,
        last_page: finalPage || 'home',
        updated_at: nowIso
      },
      { onConflict: 'user_name' }
    );
  } catch (e) {}
};

// =====================================================================
// 1안: 다크 3D 커버플로우 시어터 + 시네마 플레이어 모달
// =====================================================================
const MediaTheaterModal = ({
  isOpen,
  onClose,
  worshipVideos,
  praiseChannels,
  currDay,
  setActiveScreen
}) => {
  const [mediaTab, setMediaTab] = useState('worship'); // 'worship' | 'praise'
  const [activeIdx, setActiveIdx] = useState(0);
  const [playerItem, setPlayerItem] = useState(null);
  const [playerSubTab, setPlayerSubTab] = useState('summary'); // 'summary' | 'note'
  const touchStartXRef = useRef(null);

  const items = mediaTab === 'worship' ? worshipVideos : praiseChannels;
  const total = items?.length || 0;
  const safeIdx = total > 0 ? ((activeIdx % total) + total) % total : 0;

  useEffect(() => {
    setActiveIdx(0);
  }, [mediaTab]);

  if (!isOpen || total === 0) return null;

  const currentCenterItem = items[safeIdx];

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(diff) < 30) return;
    setActiveIdx((prev) => (diff < 0 ? (prev + 1) % total : (prev - 1 + total) % total));
  };

  const openCinemaPlayer = (item) => {
    const vidId = extractVideoId(item.url);
    setPlayerItem({
      ...item,
      videoId: vidId,
      categoryLabel: mediaTab === 'worship' ? '예배 · 말씀' : '찬양 채널'
    });
    setPlayerSubTab('summary');
  };

  const savedNotePreview =
    mediaTab === 'worship'
      ? (currDay?.sermonNotes || '').replace(/<[^>]*>?/gm, '').trim() ||
        (currDay?.qtMeditation || '').trim() ||
        '아직 작성된 예배·큐티 노트가 없습니다.'
      : (currDay?.thanksText || '').trim() || '찬양을 들으며 떠오른 감사와 은혜를 기록해 보세요.';

  return (
    <div
      className="fixed inset-0 z-[360] bg-[#0B0E14]/95 backdrop-blur-xl flex flex-col justify-between text-white select-none overflow-hidden"
      onClick={onClose}
    >
      {/* 상단 시어터 헤더 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/10 border border-white/10">
          <button
            type="button"
            onClick={() => setMediaTab('worship')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              mediaTab === 'worship'
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white shadow-sm'
                : 'text-white/65 hover:text-white'
            }`}
          >
            예배 · 말씀
          </button>
          <button
            type="button"
            onClick={() => setMediaTab('praise')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              mediaTab === 'praise'
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white shadow-sm'
                : 'text-white/65 hover:text-white'
            }`}
          >
            찬양 채널
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>닫기</span>
        </button>
      </div>

      {/* 중앙 3D 커버플로우 스테이지 */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 flex flex-col items-center justify-center relative w-full max-w-[820px] mx-auto px-3"
      >
        <div className="relative w-full h-[310px] sm:h-[360px] flex items-center justify-center overflow-hidden">
          {items.map((item, idx) => {
            let offset = idx - safeIdx;
            if (offset > Math.floor(total / 2)) offset -= total;
            if (offset < -Math.floor(total / 2)) offset += total;
            const absOffset = Math.abs(offset);
            if (absOffset > 2) return null;

            const isCenter = offset === 0;
            const translateX = offset * 56;
            const scale = isCenter ? 1 : absOffset === 1 ? 0.82 : 0.66;
            const zIndex = isCenter ? 30 : absOffset === 1 ? 20 : 10;
            const opacity = isCenter ? 1 : absOffset === 1 ? 0.55 : 0.22;

            return (
              <div
                key={item.id || idx}
                onClick={() => (isCenter ? openCinemaPlayer(item) : setActiveIdx(idx))}
                style={{
                  transform: `translateX(${translateX}%) scale(${scale})`,
                  zIndex,
                  opacity
                }}
                className={`absolute w-[74%] max-w-[280px] sm:max-w-[320px] rounded-[26px] overflow-hidden border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  isCenter
                    ? 'border-white/30 bg-[#151923] shadow-[0_24px_60px_rgba(0,0,0,0.75)]'
                    : 'border-white/10 bg-[#12151E]'
                }`}
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-900">
                  <img
                    src={item.bg}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151923] via-black/20 to-transparent" />
                  {isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-4 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-[13px] font-bold flex items-center gap-1.5 shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>시어터 재생</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3.5 text-center space-y-1">
                  <h3 className="text-[16px] font-bold text-white truncate">{item.title}</h3>
                  <p className="text-[12px] text-white/60 font-medium">
                    {mediaTab === 'worship' ? '말씀 · 유튜브 연동' : '추천 찬양 · 유튜브 채널'}
                  </p>
                </div>
              </div>
            );
          })}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIdx((p) => (p - 1 + total) % total)}
                aria-label="이전"
                className="absolute left-2 sm:left-4 z-40 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIdx((p) => (p + 1) % total)}
                aria-label="다음"
                className="absolute right-2 sm:right-4 z-40 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* 인디케이터 */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === safeIdx ? 'w-5 bg-[#60A5FA]' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 하단 빠른 액션 바 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] mx-auto px-5 pb-7 pt-2 flex items-center gap-2.5 shrink-0"
      >
        <button
          type="button"
          onClick={() => openCinemaPlayer(currentCenterItem)}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>지금 재생하기</span>
        </button>
        <a
          href={currentCenterItem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-bold flex items-center gap-1.5"
        >
          <span>YouTube</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 2번 캡처 스타일: 다크 시네마 플레이어 모달 */}
      {playerItem && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[380] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        >
          <div className="w-full max-w-[520px] rounded-[28px] bg-[#13161F] border border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[12px] font-bold tracking-wider text-white/80 uppercase">
                  {playerItem.categoryLabel} · YOUTUBE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPlayerItem(null)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto hide-scrollbar">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                {playerItem.videoId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${playerItem.videoId}?autoplay=1&rel=0&playsinline=1`}
                    title={playerItem.title}
                    frameBorder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <>
                    <img
                      src={playerItem.bg}
                      alt={playerItem.title}
                      className="w-full h-full object-cover opacity-70"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 gap-3">
                      <a
                        href={playerItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white text-[13.5px] font-bold flex items-center gap-2 shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>유튜브에서 바로 재생</span>
                      </a>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-white truncate">{playerItem.title}</h3>
                  <p className="text-[12.5px] text-white/60 mt-0.5">
                    좋은나무교회 말씀 · 찬양 큐레이션
                  </p>
                </div>
                <a
                  href={playerItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-bold text-sky-300 flex items-center gap-1"
                >
                  <span>새 창</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 요약 · 내 노트 전환 */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-white/10 text-[12.5px] font-bold">
                <button
                  type="button"
                  onClick={() => setPlayerSubTab('summary')}
                  className={`py-2 rounded-lg cursor-pointer transition-colors ${
                    playerSubTab === 'summary' ? 'bg-white text-[#13161F]' : 'text-white/70'
                  }`}
                >
                  말씀 안내
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerSubTab('note')}
                  className={`py-2 rounded-lg cursor-pointer transition-colors ${
                    playerSubTab === 'note' ? 'bg-white text-[#13161F]' : 'text-white/70'
                  }`}
                >
                  내 노트 연동
                </button>
              </div>

              {playerSubTab === 'summary' ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[13.5px] text-white/80 leading-relaxed">
                  {mediaTab === 'worship'
                    ? '선택하신 예배 및 말씀 영상을 시청하신 뒤, 예배 노트나 매일 큐티 화면에서 받은 은혜와 적용 질문을 바로 이어서 기록하실 수 있습니다.'
                    : '선택하신 찬양 채널로 이동해 오늘의 묵상과 기도에 어울리는 찬양을 함께 들으실 수 있습니다.'}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <p className="text-[13.5px] text-white/80 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {savedNotePreview}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerItem(null);
                      onClose();
                      setActiveScreen(mediaTab === 'worship' ? 'sermon' : 'diary');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#4F46E5] text-white text-[13px] font-bold cursor-pointer"
                  >
                    {mediaTab === 'worship' ? '예배 노트 작성하러 가기' : '감사·간증 일기 기록하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// 메인 대문 홈 화면 (1안 다크 미디어 바 · 부드러운 슬라이드 덮기 · 실시간 카운터)
// =====================================================================
export function Home({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  openModal,
  bibleProgress,
  readChapsCount,
  currDay,
  dailyData,
  generalNotes,
  globalPrayers,
  globalCellData,
  readChallengeStart,
  date,
  setDate,
  hasNewBoardPost,
  setHasNewBoardPost,
  formatVerse,
  dateHash,
  currentBgUrl,
  updateDay,
  triggerConfetti,
  isWknd,
  ymdStr,
  praiseChannels,
  authUser,
  streak5
}) {
  const [drawerTab, setDrawerTab] = useState('records'); // 'records' | 'study'
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isMemoryFestivalOpen, setIsMemoryFestivalOpen] = useState(false);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);

  const sheetTouchStartYRef = useRef(null);
  const sheetTouchStartXRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const savedStart = localStorage.getItem('readChallengeStart') || readChallengeStart || '2026-01-01';
  const startD = new Date(`${savedStart}T00:00:00`);
  const todayD = new Date(`${getLocalToday()}T00:00:00`);
  const dDay = Math.max(1, Math.floor((todayD.getTime() - startD.getTime()) / 86400000) + 1);
  const safeVerse = formatVerse || { text: '오늘의 말씀을 불러오는 중입니다.', ref: '' };
  const currentChecks = currDay && currDay.checks ? currDay.checks : {};
  const activeBgUrl = currentBgUrl || watercolorBgs[dateHash % watercolorBgs.length];

  // 유튜브 링크 현행 100% 유지
  const worshipVideos = useMemo(
    () => [
      {
        title: isWknd ? '우리들교회 주일예배' : '김양재 목사 큐티노트',
        url: `https://www.youtube.com/results?search_query=${isWknd ? '우리들교회+주일예배' : '김양재+목사+큐티노트'}+${ymdStr}`,
        bg: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '맥체인 듣기 (부산신성교회)',
        url: `https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경읽기+${ymdStr}`,
        bg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '맥체인 해설 (부산신성교회)',
        url: `https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경+해설+${ymdStr}`,
        bg: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '좋은나무교회 새벽기도회',
        url: `https://www.youtube.com/results?search_query=김포좋은나무교회+새벽기도회+${ymdStr}`,
        bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '좋은나무교회 1분 설교',
        url: `https://www.youtube.com/results?search_query=김포좋은나무교회+1분설교+${ymdStr}`,
        bg: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=800&q=80'
      }
    ],
    [isWknd, ymdStr]
  );

  // 실시간 작성/누적 내역 계산
  const statsSummary = useMemo(() => {
    const qtTitle = (currDay?.qtTitle || '').trim();
    const qtReference = (currDay?.qtReference || '').trim();
    const qtDone = Boolean(
      currentChecks['QTin'] || qtTitle || qtReference || (currDay?.qtMeditation || '').trim()
    );
    const qtSubLabel = [qtTitle, qtReference].filter(Boolean).join(' · ') || '오늘 묵상 작성하기';

    const genNotesArr = Array.isArray(generalNotes) ? generalNotes : [];
    const genNotesCount = genNotesArr.length;

    const entries = Object.entries(dailyData || {});
    const sermonCount = entries.filter(
      ([_, d]) => d && ((d.sermonTitle || '').trim() || (d.sermonNotes || '').replace(/<[^>]*>?/gm, '').trim())
    ).length;
    const sermonTodayLabel = [currDay?.sermonTitle, currDay?.sermonReference].filter(Boolean).join(' · ');

    const diaryCount = entries.filter(
      ([_, d]) =>
        d &&
        (((d.testimony || '').replace(TESTIMONY_TEMPLATE.trim(), '').trim().length > 0) ||
          (d.thanksText || '').trim().length > 0)
    ).length;

    const prayerList = Array.isArray(globalPrayers) ? globalPrayers.filter((p) => p && (p.text || '').trim()) : [];
    const answeredPrayersCount = prayerList.filter((p) => p.status === 'answered').length;
    const prayerBadge =
      answeredPrayersCount > 0
        ? `응답 ${answeredPrayersCount}`
        : prayerList.length > 0
        ? `${prayerList.length}건`
        : null;

    const cellSubmissionsCount = Array.isArray(globalCellData?.submissions) ? globalCellData.submissions.length : 0;
    const cellPrayersCount = Array.isArray(globalCellData?.groupPrayers) ? globalCellData.groupPrayers.length : 0;
    const cellBadge =
      cellSubmissionsCount > 0
        ? `새 글 ${cellSubmissionsCount}`
        : cellPrayersCount > 0
        ? `${cellPrayersCount}건`
        : null;

    const familyHasRecord = Boolean(
      (currDay?.attendees && currDay.attendees.trim()) ||
        (currDay?.meditate && currDay.meditate.trim()) ||
        (currDay?.prayer && currDay.prayer.trim())
    );

    const galaxyNotesCount = genNotesArr.filter(
      (n) => (n?.title || '').includes('은하계') || (n?.content || '').includes('은하계')
    ).length;
    const wikiNotesCount = genNotesArr.filter(
      (n) => (n?.title || '').includes('위키') || (n?.content || '').includes('위키')
    ).length;
    const interlinearNotesCount = genNotesArr.filter(
      (n) => (n?.title || '').includes('원어') || (n?.content || '').includes('원어')
    ).length;
    const trainingNotesCount = genNotesArr.filter(
      (n) => (n?.title || '').includes('양육') || (n?.title || '').includes('워크북')
    ).length;
    const jerichoCount = entries.filter(([_, d]) => d && (d.jerichoWalk || (d.checks && d.checks['여리고']))).length;

    return {
      qtDone,
      qtSubLabel,
      genNotesCount,
      sermonCount,
      sermonTodayLabel,
      diaryCount,
      prayerBadge,
      cellBadge,
      familyHasRecord,
      galaxyNotesCount,
      wikiNotesCount,
      interlinearNotesCount,
      trainingNotesCount,
      jerichoCount
    };
  }, [currentChecks, currDay, generalNotes, dailyData, globalPrayers, globalCellData]);

  // 성경 연구 및 훈련 13개 메뉴 원본 100% 유지 + 순서편집 지원
  const MASTER_MENUS = useMemo(
    () => [
      { id: 'sermonArchiveAdvanced', sketch: 'practice', icon: Church, title: '삶의 적용과 실천', desc: '말씀 적용 기록', badgeText: statsSummary.sermonCount > 0 ? `${statsSummary.sermonCount}건` : null },
      { id: 'galaxy', sketch: 'galaxy', icon: Globe, title: '지식 은하계', desc: '구속사 흐름 탐색', badgeText: statsSummary.galaxyNotesCount > 0 ? `${statsSummary.galaxyNotesCount}건` : null },
      { id: 'qtArchiveDetail', sketch: 'qtAnalytics', icon: Flame, title: '큐티 심층 분석', desc: '본문 배경과 적용', badgeText: statsSummary.qtDone ? '기록됨' : null },
      { id: 'sermonAnalysis', sketch: 'sermonAnalytics', icon: BarChart3, title: '설교 분석', desc: '전체 설교 아카이브', badgeText: statsSummary.sermonCount > 0 ? `${statsSummary.sermonCount}편` : null },
      { id: 'applyTracker', sketch: 'tracker', icon: Check, title: '적용 트래커', desc: '신앙 결단 점검', badgeText: `${streak5 || 0}일` },
      { id: 'bibleWikiAdvanced', sketch: 'wiki', icon: Compass, title: '성경 위키', desc: '인물·지명 백과', badgeText: statsSummary.wikiNotesCount > 0 ? `${statsSummary.wikiNotesCount}건` : null },
      { id: 'interlinear', sketch: 'interlinear', icon: FileText, title: '원어 성경', desc: '히브리어·헬라어 대조', badgeText: statsSummary.interlinearNotesCount > 0 ? `${statsSummary.interlinearNotesCount}건` : null },
      { id: 'trainingCurriculum', sketch: 'curriculum', icon: BookOpen, title: '양육 커리큘럼', desc: '단계별 제자 훈련', badgeText: statsSummary.trainingNotesCount > 0 ? `${statsSummary.trainingNotesCount}건` : null },
      { id: 'youthCurriculum', sketch: 'youth', icon: Users, title: '청소년 10주 양육', desc: '다음세대 성경 돌봄', badgeText: null },
      { id: 'trainingSubPages', sketch: 'workbook', icon: PenLine, title: '4주 심화 워크북', desc: '소그룹 훈련 교재', badgeText: statsSummary.trainingNotesCount > 0 ? `${statsSummary.trainingNotesCount}권` : null },
      { id: 'prayer', sketch: 'prayer', icon: HandHeart, title: '기도 보관함', desc: '개인 및 중보 기도', badgeText: statsSummary.prayerBadge },
      { id: 'jericho', sketch: 'jericho', icon: Footprints, title: '여리고 땅밟기', desc: '지역과 열방 기도', badgeText: statsSummary.jerichoCount > 0 ? `${statsSummary.jerichoCount}회` : null },
      { id: 'virtualChurch', sketch: 'tour', icon: Building2, title: '가상교회 투어', desc: '층별 예배 공간 안내', badgeText: null }
    ],
    [statsSummary, streak5]
  );

  const [menuOrderIds, setMenuOrderIds] = useState(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('home_menu_order_ids') || 'null');
      if (Array.isArray(savedIds) && savedIds.length > 0) {
        const allIds = MASTER_MENUS.map((m) => m.id);
        const validIds = savedIds.filter((id) => allIds.includes(id));
        const missingIds = allIds.filter((id) => !validIds.includes(id));
        return [...validIds, ...missingIds];
      }
    } catch (_) {}
    return MASTER_MENUS.map((m) => m.id);
  });

  const orderedMenus = useMemo(() => {
    return menuOrderIds.map((id) => MASTER_MENUS.find((m) => m.id === id)).filter(Boolean);
  }, [menuOrderIds, MASTER_MENUS]);

  const [isEditMode, setIsEditMode] = useState(false);

  const saveNewOrder = useCallback((nextIds) => {
    setMenuOrderIds(nextIds);
    try {
      localStorage.setItem('home_menu_order_ids', JSON.stringify(nextIds));
    } catch (_) {}
  }, []);

  const handleSwapMenuOrder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= menuOrderIds.length || fromIdx === toIdx) return;
    const copy = [...menuOrderIds];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    saveNewOrder(copy);
  };

  // 부드러운 상하 슬라이드 덮기 + 좌우 스와이프 핸들러
  const handleSheetTouchStart = (e) => {
    sheetTouchStartYRef.current = e.touches[0].clientY;
    sheetTouchStartXRef.current = e.touches[0].clientX;
    setIsDraggingSheet(true);
  };

  const handleSheetTouchMove = (e) => {
    if (sheetTouchStartYRef.current === null) return;
    const deltaY = e.touches[0].clientY - sheetTouchStartYRef.current;
    const deltaX = e.touches[0].clientX - sheetTouchStartXRef.current;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      const clamped = isSheetExpanded
        ? Math.max(0, Math.min(180, deltaY))
        : Math.max(-180, Math.min(40, deltaY));
      setDragOffsetY(clamped);
    }
  };

  const handleSheetTouchEnd = (e) => {
    if (sheetTouchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - sheetTouchStartYRef.current;
    const deltaX = e.changedTouches[0].clientX - sheetTouchStartXRef.current;
    sheetTouchStartYRef.current = null;
    sheetTouchStartXRef.current = null;
    setIsDraggingSheet(false);
    setDragOffsetY(0);

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setDrawerTab(deltaX < 0 ? 'study' : 'records');
      return;
    }

    if (!isSheetExpanded && deltaY < -40) {
      setIsSheetExpanded(true);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isSheetExpanded && deltaY > 40) {
      setIsSheetExpanded(false);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 영적5종세트 차별화된 부드러운 포인트 컬러
  const fiveRoutineItems = [
    {
      id: '감사',
      label: '감사',
      sketch: 'thanks',
      icon: Heart,
      activeStyle: 'bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white shadow-xs',
      textStyle: 'text-[#E11D48] dark:text-[#FB7185]'
    },
    {
      id: '성경읽기',
      label: '성경',
      sketch: 'bible',
      icon: BookOpen,
      activeStyle: 'bg-gradient-to-br from-[#3B82F6] to-[#4F46E5] text-white shadow-xs',
      textStyle: 'text-[#3B82F6] dark:text-[#60A5FA]'
    },
    {
      id: 'QTin',
      label: '큐티',
      sketch: 'qt',
      icon: Flame,
      activeStyle: 'bg-gradient-to-br from-[#F59E0B] to-[#EA580C] text-white shadow-xs',
      textStyle: 'text-[#EA580C] dark:text-[#FBBF24]'
    },
    {
      id: '기도하기',
      label: '기도',
      sketch: 'prayer',
      icon: HandHeart,
      activeStyle: 'bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white shadow-xs',
      textStyle: 'text-[#2563EB] dark:text-[#38BDF8]'
    },
    {
      id: '가정예배',
      label: '가정예배',
      sketch: 'family',
      icon: Smile,
      activeStyle: 'bg-gradient-to-br from-[#6366F1] to-[#7C3AED] text-white shadow-xs',
      textStyle: 'text-[#4F46E5] dark:text-[#818CF8]'
    }
  ];

  const completedFiveCount = fiveRoutineItems.filter((item) => currentChecks[item.id]).length;

  const surfaceClass = isDarkMode ? 'bg-[#181B20]' : 'bg-white';
  const dividerClass = isDarkMode ? 'divide-[#262A32]' : 'divide-[#F2F4F6]';
  const borderClass = isDarkMode ? 'border-[#262A32]' : 'border-[#E5E8EB]';
  const mutedChipClass = isDarkMode ? 'bg-[#22262E] text-[#9BA3B0]' : 'bg-[#F2F4F6] text-[#4E5968]';

  const recordSections = [
    {
      heading: '묵상',
      rows: [
        {
          id: 'mcheyne',
          sketch: 'mcheyne',
          icon: BookOpen,
          title: '맥체인 성경읽기',
          sub: null,
          statusText: `${readChapsCount || 0}장 · ${dDay}일차`
        },
        {
          id: 'generalNote',
          sketch: 'note',
          icon: PenLine,
          title: '자유 말씀 노트',
          sub: null,
          statusText: `${statsSummary.genNotesCount}개`
        }
      ]
    },
    {
      heading: '예배',
      rows: [
        {
          id: 'sermon',
          sketch: 'sermon',
          icon: FileText,
          title: '예배 노트 작성',
          sub: statsSummary.sermonTodayLabel || null,
          statusText: statsSummary.sermonCount > 0 ? `${statsSummary.sermonCount}건` : null
        },
        {
          id: 'familySelect',
          sketch: 'family',
          icon: Smile,
          title: '가정 예배 시작',
          sub: null,
          statusText: statsSummary.familyHasRecord ? '기록됨' : null
        }
      ]
    },
    {
      heading: '기록과 나눔',
      rows: [
        {
          id: 'diary',
          sketch: 'diary',
          icon: Heart,
          title: '감사 및 간증 일기',
          sub: null,
          statusText: `${statsSummary.diaryCount}건`
        },
        {
          id: 'prayer',
          sketch: 'prayer',
          icon: HandHeart,
          title: '나의 기도함',
          sub: null,
          statusText: statsSummary.prayerBadge
        },
        {
          id: 'cell',
          sketch: 'cell',
          icon: Users,
          title: '목장 나눔',
          sub: authUser?.role === 'admin' ? '관리자 모드' : null,
          statusText: statsSummary.cellBadge
        },
        {
          id: 'board',
          sketch: 'board',
          icon: Sparkles,
          title: '공동체 게시판',
          sub: null,
          statusText: hasNewBoardPost ? '새 글' : null
        }
      ]
    }
  ];

  return (
    <div
      ref={scrollContainerRef}
      className={`flex-1 flex flex-col h-full w-full max-w-full overflow-x-hidden touch-pan-y ${
        isDarkMode ? 'bg-[#101216]' : 'bg-[#F4F5F7]'
      } overflow-y-auto pb-[105px] hide-scrollbar pointer-events-auto relative`}
    >
      {/* 상단 고정 네비게이션 바 */}
      <header
        className={`w-full shrink-0 flex items-center justify-between gap-2 px-3.5 sm:px-6 h-14 z-[45] sticky top-0 border-b ${borderClass} ${
          isDarkMode ? 'bg-[#101216]/95' : 'bg-[#F4F5F7]/95'
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#191F28]'
            }`}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className={`relative inline-flex items-center gap-1.5 px-3 h-9 rounded-xl cursor-pointer ${
              isDarkMode ? 'bg-[#1C1F26] text-white' : 'bg-white text-[#191F28]'
            } border ${borderClass}`}
          >
            <ChurchSketchIcon name="calendar" fallback={Calendar} className="w-5 h-5 shrink-0" isDarkMode={isDarkMode} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
            />
            <span className="font-bold text-[13.5px] tracking-tight pointer-events-none whitespace-nowrap">
              {new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} (
              {['일', '월', '화', '수', '목', '금', '토'][new Date(date).getDay()]})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setActiveScreen('board');
              setHasNewBoardPost(false);
            }}
            className={`h-8 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all whitespace-nowrap cursor-pointer relative ${
              isDarkMode ? 'bg-[#FF375F]/20 text-[#FF6B88]' : 'bg-[#FFE5EA] text-[#E11D48]'
            }`}
          >
            <span>공동체감사</span>
            {hasNewBoardPost && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#E11D48] rounded-full" />}
          </button>

          <button
            onClick={() => {
              setActiveScreen('board');
              setHasNewBoardPost(false);
            }}
            className={`h-8 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all whitespace-nowrap cursor-pointer ${
              isDarkMode ? 'bg-[#10B981]/20 text-[#6EE7B7]' : 'bg-[#DCFCE7] text-[#15803D]'
            }`}
          >
            <span>공동체기도</span>
          </button>
        </div>
      </header>

      {/* 슬라이드 확장 시 부드럽게 나타나는 '오늘의 말씀' 한 줄 고정 바 */}
      <div
        className={`sticky top-14 z-[44] grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSheetExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div
            onClick={() => setIsSheetExpanded(false)}
            className={`px-3.5 sm:px-6 py-1.5 ${
              isDarkMode ? 'bg-[#101216]/95' : 'bg-[#F4F5F7]/95'
            } backdrop-blur-md cursor-pointer`}
          >
            <div className="max-w-[760px] mx-auto bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-sm">
              <span className="text-[13.5px] font-bold truncate">
                {safeVerse.text} ({safeVerse.ref.replace(/[()]/g, '')})
              </span>
              <span className="text-[11.5px] font-semibold text-white/85 shrink-0 ml-3 flex items-center gap-1">
                <span>루틴 {completedFiveCount}/5</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 컨테이너 */}
      <div className="px-3.5 sm:px-6 pt-2.5 pb-6 max-w-[760px] mx-auto w-full flex-1 flex flex-col">
        {/* 상단 카드 영역: 시트가 올라오면 부드럽게 축소·덮임 */}
        <div
          className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-top ${
            isSheetExpanded
              ? 'grid-rows-[0fr] opacity-0 scale-[0.96] -translate-y-2 pointer-events-none'
              : 'grid-rows-[1fr] opacity-100 scale-100 translate-y-0 mb-3'
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3">
              {/* 1. 최상단 2분할 카드: 가상 교회 투어(배경 이미지) + 오늘의 말씀(배경 이미지 & 암송 열기) */}
              <div className="grid grid-cols-12 gap-2.5 items-stretch">
                <button
                  type="button"
                  onClick={() => setActiveScreen('virtualChurch')}
                  style={{
                    backgroundImage: `url('/images/virtual-church-card.jpg')`
                  }}
                  className="col-span-5 relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#4F46E5] bg-cover bg-center text-white p-3.5 flex flex-col justify-between text-left cursor-pointer min-h-[144px] shadow-xs border border-white/15"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15 pointer-events-none" />
                  <div className="relative z-10 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <ChurchSketchIcon name="tour" fallback={Church} className="w-5 h-5 brightness-0 invert" isDarkMode={true} />
                  </div>
                  <div className="relative z-10 space-y-0.5 mt-4">
                    <span className="text-[15.5px] font-bold leading-snug block drop-shadow-xs">가상 교회 투어</span>
                    <span className="text-[11.5px] text-white/85 font-medium block">둘러보기</span>
                  </div>
                </button>

                <div
                  onClick={() =>
                    openModal('fullVerse', {
                      text: `${safeVerse.text} ${safeVerse.ref}`,
                      bgHash: dateHash,
                      bgUrl: activeBgUrl
                    })
                  }
                  style={{ backgroundImage: `url(${activeBgUrl})` }}
                  className="col-span-7 relative rounded-3xl overflow-hidden flex flex-col justify-between text-left cursor-pointer min-h-[144px] p-3.5 bg-cover bg-center border border-white/15 shadow-xs"
                >
                  <div className="absolute inset-0 bg-black/55 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-sky-200">오늘의 말씀</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMemoryFestivalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11.5px] font-bold text-white cursor-pointer backdrop-blur-xs"
                    >
                      암송 열기
                    </button>
                  </div>

                  <p className="relative z-10 text-[14.5px] font-bold leading-snug line-clamp-3 my-1.5 break-keep text-white">
                    {safeVerse.text}
                  </p>

                  <span className="relative z-10 text-[11.5px] font-medium text-white/85">
                    {safeVerse.ref.replace(/[()]/g, '')}
                  </span>
                </div>
              </div>

              {/* 2. 영적5종세트 + 연속 실천일수 + 성경 365 통독 */}
              <section className={`${surfaceClass} rounded-3xl border ${borderClass} overflow-hidden`}>
                <div className="px-3.5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-[15.5px] font-bold ${t.textMain} tracking-tight`}>영적5종세트</h2>
                    <span className="text-[11.5px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-0.5 rounded-lg">
                      {completedFiveCount} / 5 완료
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {fiveRoutineItems.map((item) => {
                      const isChecked = Boolean(currentChecks[item.id]);
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            updateDay({ checks: { ...currentChecks, [item.id]: !isChecked } });
                            if (!isChecked) triggerConfetti();
                          }}
                          className="flex flex-col items-center py-0.5 rounded-2xl transition-transform active:scale-95 cursor-pointer"
                        >
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
                              isChecked ? item.activeStyle : mutedChipClass
                            }`}
                          >
                            <ChurchSketchIcon
                              name={item.sketch}
                              fallback={IconComp}
                              className="w-6 h-6"
                              isDarkMode={isDarkMode}
                              invertOnActive={isChecked}
                            />
                          </div>
                          <span className={`text-[11.5px] mt-1 font-bold ${isChecked ? item.textStyle : t.textSub}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`grid grid-cols-2 border-t ${borderClass} divide-x ${borderClass}`}>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('fiveSetMenu')}
                    className="px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div>
                      <span className={`text-[11.5px] font-medium ${t.textSub} block`}>연속 실천일수</span>
                      <span className={`text-[16px] font-bold ${t.textMain} mt-0.5 block`}>{streak5 || 0}일째</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8B95A1]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveScreen('bible');
                      openModal('bibleChallenge');
                    }}
                    className="px-3.5 py-2.5 flex flex-col justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11.5px] font-medium ${t.textSub}`}>성경 365 통독</span>
                      <span className="text-[11.5px] font-bold text-[#3B82F6]">{bibleProgress}%</span>
                    </div>
                    <span className={`text-[16px] font-bold ${t.textMain} mt-0.5 block`}>
                      {dDay > 0 ? `${dDay}일차` : '시작 전'}
                    </span>
                    <div className={`w-full ${isDarkMode ? 'bg-[#262A32]' : 'bg-[#E5E8EB]'} rounded-full h-1.5 mt-1 overflow-hidden`}>
                      <div
                        className="bg-gradient-to-r from-[#3B82F6] to-[#6366F1] h-full rounded-full"
                        style={{ width: `${bibleProgress}%` }}
                      />
                    </div>
                  </button>
                </div>
              </section>

              {/* 3. 1안: 슬림 다크 미디어 바 (클릭 시 3D 커버플로우 시어터 + 시네마 플레이어 오픈) */}
              <button
                type="button"
                onClick={() => setIsTheaterOpen(true)}
                className="w-full h-[52px] px-4 rounded-2xl bg-gradient-to-r from-[#141824] via-[#1C2333] to-[#171C2B] border border-white/10 text-white flex items-center justify-between gap-3 shadow-sm hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shrink-0 shadow-xs">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="text-[12.5px] font-bold text-sky-300 shrink-0">예배·찬양 시어터</span>
                    <span className="text-white/35 text-[11px]">·</span>
                    <span className="text-[13px] font-semibold text-white/90 truncate">
                      {worshipVideos[0]?.title || '오늘의 예배 영상'}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11.5px] font-bold text-white/75 shrink-0">
                  <Headphones className="w-3.5 h-3.5 text-sky-300" />
                  <span>열기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. 단일 하단 슬라이드 시트 (상하 부드러운 덮기 + 좌우 탭 스와이프) */}
        <section
          style={{
            transform: dragOffsetY !== 0 ? `translateY(${dragOffsetY * 0.45}px)` : 'translateY(0px)',
            transition: isDraggingSheet
              ? 'none'
              : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms ease'
          }}
          className={`${surfaceClass} rounded-3xl border ${borderClass} overflow-hidden flex-1 flex flex-col ${
            isSheetExpanded ? 'shadow-[0_-12px_36px_rgba(15,23,42,0.12)]' : 'shadow-2xs'
          }`}
        >
          {/* 드래그 핸들 바 */}
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onClick={() => setIsSheetExpanded((prev) => !prev)}
            className="pt-2.5 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            title={isSheetExpanded ? '아래로 내리기' : '위로 올려 전체 메뉴 보기'}
          >
            <span className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-[#3A4150]' : 'bg-[#D1D5DB]'}`} />
          </div>

          {/* 세그먼트 탭 바 (좌우 스와이프 대응) */}
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            className={`mx-4 mb-2 p-1 rounded-2xl ${mutedChipClass} grid grid-cols-2 gap-1`}
          >
            <button
              type="button"
              onClick={() => setDrawerTab('records')}
              className={`py-2 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
                drawerTab === 'records' ? `${surfaceClass} ${t.textMain} shadow-2xs` : t.textSub
              }`}
            >
              말씀과 기록
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('study')}
              className={`py-2 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
                drawerTab === 'study' ? `${surfaceClass} ${t.textMain} shadow-2xs` : t.textSub
              }`}
            >
              성경 연구 및 훈련
            </button>
          </div>

          {drawerTab === 'records' ? (
            <div className="px-4 pb-5 pt-1 space-y-3">
              {/* 매일 큐티 하이라이트 카드 */}
              <div
                onClick={() => setActiveScreen('qt')}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isDarkMode ? 'bg-[#3B82F6]/15 hover:bg-[#3B82F6]/20' : 'bg-[#EBF3FF] hover:bg-[#E0ECFF]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center shrink-0">
                    <ChurchSketchIcon name="qt" fallback={Flame} className="w-6 h-6" isDarkMode={isDarkMode} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-[15px] font-bold ${t.textMain} block`}>매일 큐티</span>
                    <span className={`text-[12px] ${t.textSub} block truncate mt-0.5`}>{statsSummary.qtSubLabel}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[#3B82F6] text-[12px] font-bold shrink-0 shadow-2xs">
                  {statsSummary.qtDone ? '완료' : '작성'}
                </span>
              </div>

              {/* 그룹별 리스트 */}
              {recordSections.map((sec) => (
                <div key={sec.heading} className="space-y-0.5">
                  <span className={`text-[11.5px] font-semibold ${t.textSub} px-1 block`}>{sec.heading}</span>
                  <div className={`divide-y ${dividerClass}`}>
                    {sec.rows.map((row) => {
                      const IconComp = row.icon;
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => setActiveScreen(row.id)}
                          className="w-full py-3 px-1 flex items-center justify-between gap-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                              <ChurchSketchIcon name={row.sketch} fallback={IconComp} className="w-6 h-6" isDarkMode={isDarkMode} />
                            </div>
                            <div className="min-w-0">
                              <span className={`text-[14.5px] font-bold ${t.textMain} block truncate`}>{row.title}</span>
                              {row.sub && (
                                <span className={`text-[11.5px] ${t.textSub} block truncate`}>{row.sub}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {row.statusText && (
                              <span className="text-[12.5px] font-bold text-[#3B82F6]">{row.statusText}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-[#8B95A1]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-4 pb-2 flex items-center justify-between">
                <span className={`text-[12px] font-medium ${t.textSub}`}>
                  {isEditMode ? '순서를 이동한 뒤 완료를 눌러주세요' : '13개 성경 연구 및 훈련 도구'}
                </span>
                <div className="flex items-center gap-1.5">
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => saveNewOrder(MASTER_MENUS.map((m) => m.id))}
                      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold ${mutedChipClass} cursor-pointer`}
                    >
                      초기화
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditMode((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer ${
                      isEditMode ? 'bg-[#3B82F6] text-white' : mutedChipClass
                    }`}
                  >
                    {isEditMode ? '완료' : '순서편집'}
                  </button>
                </div>
              </div>

              <div className={`divide-y ${dividerClass} border-t ${borderClass}`}>
                {orderedMenus.map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isEditMode) return;
                        setActiveScreen(item.id);
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mutedChipClass}`}>
                          <ChurchSketchIcon name={item.sketch} fallback={IconComp} className="w-6 h-6" isDarkMode={isDarkMode} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[14.5px] font-bold ${t.textMain} block truncate`}>{item.title}</span>
                          <span className={`text-[11.5px] ${t.textSub} block truncate`}>{item.desc}</span>
                        </div>
                      </div>

                      {isEditMode ? (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSwapMenuOrder(index, index - 1)}
                            disabled={index === 0}
                            className={`px-2 py-1 rounded-lg ${mutedChipClass} text-[11px] font-bold disabled:opacity-30 cursor-pointer`}
                          >
                            위
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwapMenuOrder(index, index + 1)}
                            disabled={index === orderedMenus.length - 1}
                            className={`px-2 py-1 rounded-lg ${mutedChipClass} text-[11px] font-bold disabled:opacity-30 cursor-pointer`}
                          >
                            아래
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          {item.badgeText && (
                            <span className="text-[12px] font-bold text-[#3B82F6]">{item.badgeText}</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#8B95A1]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 암송 열기 전용 40구절 팝업 (하단 배너 라인 숨김) */}
      <MemoryFestivalBanner
        isDarkMode={isDarkMode}
        currDay={currDay}
        date={date}
        externalOpen={isMemoryFestivalOpen}
        onExternalClose={() => setIsMemoryFestivalOpen(false)}
        hideBanner={true}
        onCompleteCheck={() => {
          if (updateDay) {
            updateDay({ checks: { ...(currDay?.checks || {}), 암송: true } });
          }
        }}
      />

      {/* 1안 다크 3D 커버플로우 시어터 + 시네마 플레이어 */}
      <MediaTheaterModal
        isOpen={isTheaterOpen}
        onClose={() => setIsTheaterOpen(false)}
        worshipVideos={worshipVideos}
        praiseChannels={praiseChannels}
        currDay={currDay}
        setActiveScreen={setActiveScreen}
      />
    </div>
  );
}
/// ==================== PART 2 시작 ====================

// 정자체 폰트(Pretendard / Noto Sans KR / 맑은 고딕) 통일 스타일
const GlobalStyles = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

    html, body, #root, * {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    }
    html, body {
      overflow-x: hidden !important;
      overscroll-behavior-x: none;
      width: 100%;
      max-width: 100vw;
      height: 100dvh;
      margin: 0;
      padding: 0;
      position: fixed;
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.02em;
    }
    #root {
      width: 100%;
      max-width: 100vw;
      height: 100dvh;
      display: flex;
      overflow-x: hidden !important;
    }
    p, span, div {
      box-sizing: border-box;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    input[type="date"].date-hidden::-webkit-calendar-picker-indicator {
      background: transparent; bottom: 0; color: transparent; cursor: pointer;
      height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; pointer-events: none;
    }
    [contenteditable]:empty:before {
      content: attr(placeholder); color: #8B95A1; pointer-events: none; display: block; white-space: pre-wrap; font-weight: normal;
    }
    .note-lines {
      background-image: repeating-linear-gradient(transparent, transparent 37px, rgba(139,149,161,0.16) 38px);
      background-size: 100% 38px; line-height: 38px; padding-top: 6px; background-attachment: local;
    }
  `}</style>
);

const Confetti = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#3B82F6', '#6366F1', '#818CF8', '#2563EB', '#CBD5E1'];
    for (let i = 0; i < 120; i++)
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleInc: Math.random() * 0.07 + 0.05
      });
    let id;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2 + p.dy;
        p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      });
      id = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
};

const RichTextEditor = React.forwardRef(({ value, onChange, placeholder, t, isSp, bibles }, ref) => {
  const editorRef = useRef(null);
  React.useImperativeHandle(ref, () => ({
    exec: (cmd, val = null) => {
      document.execCommand(cmd, false, val);
      editorRef.current?.focus();
      handleInput();
    },
    insertTable: () => {
      const bColor = isSp ? '#E5E8EB' : t.appBg.includes('101216') ? '#262A32' : '#E5E8EB';
      document.execCommand(
        'insertHTML',
        false,
        `<table style="width:100%; border-collapse:collapse; margin:10px 0;"><tbody><tr><td style="padding:10px; border:1px solid ${bColor};">내용</td><td style="padding:10px; border:1px solid ${bColor};">내용</td></tr><tr><td style="padding:10px; border:1px solid ${bColor};">내용</td><td style="padding:10px; border:1px solid ${bColor};">내용</td></tr></tbody></table><p><br></p>`
      );
      editorRef.current?.focus();
      handleInput();
    }
  }));

  useEffect(() => {
    const s = value || '';
    if (editorRef.current && editorRef.current.innerHTML !== s) editorRef.current.innerHTML = s;
  }, [value]);
  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  const handleEditorClick = (e) => {
    if (e.target.classList.contains('delete-bible-btn')) {
      const block = e.target.closest('.bible-block');
      if (block) {
        block.remove();
        handleInput();
      }
    }
  };
  const handleKeyDown = (e) => {
    try {
      if (e.key === ' ' || e.key === 'Enter') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType === 3) {
          const text = node.textContent.substring(0, range.startOffset);
          const match = text.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?(?:\s?(?:~|-)\s?(?:(\d+)(?:장|:))?\s?(?:(\d+)(?:절)?)?)?$/);
          if (match) {
            const p = parseBibleRefExt(match[0].trim());
            if (p && p.eb) {
              const bD = getArr(bibles).find((b) => b.name === p.eb);
              if (bD) {
                let vsHtml = '';
                for (let c = p.c1; c <= p.c2; c++) {
                  const chD = getArr(bD.chapters)[c - 1];
                  if (!chD) continue;
                  const sIdx = c === p.c1 ? p.v1 - 1 : 0;
                  const eIdx = c === p.c2 ? (p.v2 === 999 ? getArr(chD).length - 1 : p.v2 - 1) : getArr(chD).length - 1;
                  for (let i = sIdx; i <= eIdx; i++) {
                    if (chD[i])
                      vsHtml += `<div style="display:flex; gap:12px; padding:12px; border-radius:12px; margin-bottom:4px; background:rgba(59, 130, 246, 0.06);"><span style="font-weight:700; color:#3B82F6; min-width:24px;">${i + 1}</span><span style="color:inherit;">${cleanText(chD[i])}</span></div>`;
                  }
                }
                if (vsHtml) {
                  e.preventDefault();
                  node.textContent = text.substring(0, text.length - match[0].length) + node.textContent.substring(range.startOffset);
                  const newRange = document.createRange();
                  newRange.setStart(node, text.length - match[0].length);
                  newRange.collapse(true);
                  sel.removeAllRanges();
                  sel.addRange(newRange);
                  const blockBorder = isSp ? '#E5E8EB' : '#262A32';
                  const blockHtml = `<div class="bible-block" contenteditable="false" style="display: inline-block; width: fit-content; max-width: 100%; margin: 6px 0; position: relative; border: 1px solid ${blockBorder}; border-radius: 12px; padding: 6px 8px; background: rgba(59, 130, 246, 0.04); font-size: 14px; line-height: 1.4;"><button class="delete-bible-btn" style="position: absolute; top: 4px; right: 4px; background: #4E5968; color: #FFF; border: none; border-radius: 6px; padding: 2px 6px; font-size: 10px; cursor: pointer; font-weight: bold; z-index: 10;">삭제</button><div style="font-weight: 700; color: inherit; margin-bottom: 4px; padding-left: 4px; font-size: 12px;">${getKoName(p.eb)} ${p.c1}장</div>${vsHtml}</div><p><br></p>`;
                  document.execCommand('insertHTML', false, blockHtml);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex flex-col w-full h-full relative z-[45] pointer-events-auto">
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleEditorClick}
        onPointerDown={(e) => e.stopPropagation()}
        className={`p-5 md:p-6 flex-1 outline-none text-[15px] overflow-y-auto h-full ${isSp ? 'text-[#191F28]' : t.textMain} break-words whitespace-pre-wrap leading-[1.8]`}
        placeholder={placeholder}
        style={{ minHeight: '300px' }}
      />
    </div>
  );
});

const SubPageHeader = ({ title, onBack, t, isSp = false, spTitle = '', spDesc = '', toggleSidebar }) => {
  if (isSp)
    return (
      <div className="px-5 py-4 z-[60] shrink-0 flex items-center justify-between relative bg-gradient-to-r from-[#2563EB] to-[#4F46E5] pointer-events-auto">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white hover:opacity-80 transition-opacity cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-white leading-tight">{spTitle}</h1>
            <p className="text-[12px] text-white/85 font-medium mt-0.5">{spDesc}</p>
          </div>
        </div>
        {toggleSidebar && (
          <button onClick={toggleSidebar} className="text-white hover:opacity-80 transition-opacity cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  return (
    <div className={`${t.cardBg} px-5 py-4 z-[60] shrink-0 flex items-center justify-between relative border-b ${t.border} pointer-events-auto`}>
      <button onClick={onBack} className={`${t.textMain} hover:opacity-70 transition-opacity cursor-pointer`}>
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className={`text-[18px] font-bold ${t.textMain} tracking-tight`}>{title}</h1>
      {toggleSidebar ? (
        <button onClick={toggleSidebar} className={`${t.textMain} hover:opacity-70 transition-opacity cursor-pointer`}>
          <Menu className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-5 h-5" />
      )}
    </div>
  );
};

// 2단계 마스터 보안 로그인 컴포넌트
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
        const { data: usersData, error } = await supabase.from('app_users').select('*').ilike('name', `${trimmedName}%`);

        if (!error && usersData && usersData.length > 0) {
          matchedUser = usersData.find((u) => u.name === trimmedName || u.name.startsWith(`${trimmedName}(`));

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
            const sameBaseCount = usersData.filter((u) => u.name.startsWith(trimmedName)).length;
            const alphabetSuffix = String.fromCharCode(97 + sameBaseCount);
            finalDisplayName = `${trimmedName}(${alphabetSuffix})`;

            await supabase.from('app_users').insert([
              {
                name: finalDisplayName,
                password: trimmedPw,
                password_hash: trimmedPw,
                role: '목원',
                shepherd_name: '목장 미배정',
                is_temp_password: false
              }
            ]);
          }
        } else {
          await supabase.from('app_users').insert([
            {
              name: trimmedName,
              password: trimmedPw,
              password_hash: trimmedPw,
              role: '목원',
              shepherd_name: '목장 미배정',
              is_temp_password: false
            }
          ]);
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
      if (typeof setActiveScreen === 'function') setActiveScreen('home');
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
        const { error } = await supabase
          .from('app_users')
          .update({
            password: newPw,
            password_hash: newPw,
            is_temp_password: false
          })
          .eq('id', targetUserRecord.id);

        if (error) throw error;
      }

      alert('비밀번호가 성공적으로 변경되었습니다.');
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
      if (typeof setActiveScreen === 'function') setActiveScreen('home');
    } catch (e) {
      alert('비밀번호 변경 실패: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-4 relative overflow-hidden select-none bg-[#F4F6FA]">
      {isPasswordChangeRequired ? (
        <div className="w-full max-w-[400px] rounded-3xl p-7 flex flex-col gap-5 bg-white border border-[#E5E8EB] shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg w-max">
              보안 비밀번호 변경
            </span>
            <h2 className="text-[18px] font-bold text-[#191F28] mt-2">비밀번호 변경이 필요합니다</h2>
            <p className="text-[15px] text-[#6B7684] leading-relaxed">
              초기 임시 비밀번호(1004)로 접속하셨습니다. 새 비밀번호로 변경해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="새 비밀번호 입력 (4자리 이상)"
              className="w-full py-3.5 px-4 rounded-2xl text-[15px] font-medium bg-[#F2F4F6] text-[#191F28] outline-none focus:ring-2 focus:ring-[#3B82F6]"
              autoFocus
            />
            <input
              type="password"
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              placeholder="새 비밀번호 확인"
              onKeyDown={(e) => e.key === 'Enter' && handleExecutePasswordChange()}
              className="w-full py-3.5 px-4 rounded-2xl text-[15px] font-medium bg-[#F2F4F6] text-[#191F28] outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <button
            type="button"
            onClick={handleExecutePasswordChange}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-[15px] cursor-pointer mt-1"
          >
            {isLoading ? '변경 처리 중...' : '비밀번호 변경 후 시작하기'}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-[400px] rounded-3xl p-7 flex flex-col gap-6 bg-white border border-[#E5E8EB] shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg w-max">
              좋은나무교회 말씀 동행
            </span>
            <h1 className="text-[18px] font-bold text-[#191F28] tracking-tight mt-2">
              반갑습니다, 성도님
            </h1>
            <p className="text-[15px] text-[#6B7684]">
              오늘의 묵상과 신앙 여정을 안전하게 기록합니다.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[#4E5968]">성도 이름</label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="이름을 입력하세요"
                onKeyDown={(e) => e.key === 'Enter' && submitDirectLogin()}
                className="w-full py-3.5 px-4 rounded-2xl text-[15px] font-medium bg-[#F2F4F6] text-[#191F28] placeholder-[#8B95A1] outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[#4E5968]">비밀번호</label>
              <input
                type="password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder="비밀번호 입력 (최초: 1004)"
                onKeyDown={(e) => e.key === 'Enter' && submitDirectLogin()}
                className="w-full py-3.5 px-4 rounded-2xl text-[15px] font-medium bg-[#F2F4F6] text-[#191F28] placeholder-[#8B95A1] outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {isSuperStepActive && (
              <div className="p-4 rounded-2xl bg-[#F2F4F6] flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAdminModeToggle(!adminModeToggle)}>
                  <span className="text-[12px] font-bold text-[#3B82F6]">
                    운영자 인증 모드 (터치하여 활성화)
                  </span>
                  <input
                    type="checkbox"
                    checked={adminModeToggle}
                    onChange={(e) => setAdminModeToggle(e.target.checked)}
                    className="w-4 h-4 accent-[#3B82F6] cursor-pointer"
                  />
                </div>

                {adminModeToggle && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[12px] font-medium text-[#4E5968]">2차 보안코드</span>
                    <input
                      type="password"
                      value={secondaryAdminPw}
                      onChange={(e) => setSecondaryAdminPw(e.target.value)}
                      placeholder="보안코드 4자리 입력"
                      onKeyDown={(e) => e.key === 'Enter' && submitDirectLogin()}
                      className="w-full py-2.5 px-3.5 rounded-xl text-[15px] bg-white border border-[#E5E8EB] text-[#191F28] outline-none focus:border-[#3B82F6]"
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-[15px] transition-colors cursor-pointer"
          >
            {isLoading ? '인증 중...' : '로그인하기'}
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

  useEffect(() => {
    if (!store.activeScreen) {
      store.setActiveScreen('home');
    }
  }, [store.activeScreen]);

  const {
    authUser,
    setAuthUser,
    activeScreen,
    setActiveScreen,
    isDarkMode,
    toggleDarkMode,
    dailyData,
    updateDay: storeUpdateDay,
    readVerses,
    setReadVerses,
    bibleNotes,
    setBibleNotes,
    bibleHighlights,
    setBibleHighlights,
    readChallengeStart,
    setReadChallengeStart,
    globalPrayers,
    setGlobalPrayers,
    globalIntercessions,
    setGlobalIntercessions,
    generalNotes,
    setGeneralNotes
  } = store;

  useEffect(() => {
    const saved = localStorage.getItem('readChallengeStart');
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      if (readChallengeStart !== saved) setReadChallengeStart(saved);
    } else {
      const initDate = readChallengeStart && /^\d{4}-\d{2}-\d{2}$/.test(readChallengeStart) ? readChallengeStart : '2026-01-01';
      localStorage.setItem('readChallengeStart', initDate);
      if (readChallengeStart !== initDate) setReadChallengeStart(initDate);
    }
  }, [readChallengeStart, setReadChallengeStart]);

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
          const { data, error } = await supabase.from('app_users').select('*').eq('name', currentUserObj.name).maybeSingle();

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
            await supabase.from('app_users').upsert(
              [
                {
                  name: currentUserObj.name,
                  role: currentUserObj.role || '목원',
                  shepherd_name: currentUserObj.group || '목장 미배정',
                  password: '1004',
                  password_hash: '1004',
                  is_temp_password: false
                }
              ],
              { onConflict: 'name' }
            );
          }

          const nowIso = new Date().toISOString();
          await supabase.from('user_activity').upsert(
            {
              user_name: currentUserObj.name,
              last_page: activeScreen || 'home',
              updated_at: nowIso
            },
            { onConflict: 'user_name' }
          );
        } catch (err) {}
      };
      fetchLatestUserData();
    }
  }, [authUser?.name, setAuthUser]);

  useAutoQRAttendance(authUser);

  const [globalDrawer, setGlobalDrawer] = useState({ isOpen: false, type: null });
  const openGlobalDrawer = (type) => setGlobalDrawer({ isOpen: true, type });
  const closeGlobalDrawer = () => setGlobalDrawer({ isOpen: false, type: null });

  useEffect(() => {
    const currentName = typeof authUser === 'object' ? authUser?.name : authUser;
    if (currentName) {
      logUserAction(currentName, activeScreen, 'view', `${activeScreen} 화면 열람`);
    }
  }, [activeScreen, authUser]);

  const setIsDarkMode = toggleDarkMode;
  const setDailyData = (updater) => {
    const next = typeof updater === 'function' ? updater(dailyData) : updater;
    useAppStore.setState({ dailyData: next });
    localStorage.setItem('qt_daily', JSON.stringify(next));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tool, setTool] = useState('hand');
  const [color, setColor] = useState('#3B82F6');
  const [size, setSize] = useState(4);
  const [date, setDate] = useState(getLocalToday());
  const [showConfetti, setShowConfetti] = useState(false);

  const currDay = dailyData[date] || {
    checks: {}, thanksText: '', memos: [], stickers: [], testimony: '', qtTitle: '', qtReference: '',
    qtVideoUrl: '', qtVideoId: '', qtAppQuestion: '', qtMeditation: '', qtApplication: '', sermonTitle: '',
    sermonPreacher: '', sermonReference: '', sermonNotes: '', sermonVideoUrl: '', sermonVideoId: '',
    thanksDeclarations: ['', ''], applyQuestions: [], wordShare: '', thanksShare: '', prayerReq: '',
    familyName: '', attendees: '', meditate: '', prayer: ''
  };
  const updateDay = (d) => storeUpdateDay(date, d);

  const [currentChapId, setCurrentChapId] = useState('Genesis-1');
  const [bibleViewMode, setBibleViewMode] = useState('index');
  const [selVerses, setSelVerses] = useState([]);
  const [mcheynePlanIdx, setMcheynePlanIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [familyRoomPw, setFamilyRoomPw] = useState('');
  const [familyRoomData, setFamilyRoomData] = useState({ attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] });
  const [familyPublicData, setFamilyPublicData] = useState(() =>
    safeParse('family_public_' + date, { attendees: '', wordMeditation: '', thanks: [], prayers: [] })
  );
  const [globalCellData, setGlobalCellData] = useState(() =>
    safeParse('global_cell_data', { notice: '이번 주 목장 모임 공지사항입니다.', submissions: [], groupPrayers: [], cellIntercession: '' })
  );
  const [globalSharedQt, setGlobalSharedQt] = useState(() => safeParse('global_shared_qt', {}));

  useEffect(() => {
    safeSetItem('global_cell_data', JSON.stringify(globalCellData));
    safeSetItem('global_shared_qt', JSON.stringify(globalSharedQt));
  }, [globalCellData, globalSharedQt]);

  const [boardPosts, setBoardPosts] = useState([]);
  const [hasNewBoardPost, setHasNewBoardPost] = useState(false);
  const [currentGenNoteId, setCurrentGenNoteId] = useState(null);
  const [familyHistory, setFamilyHistory] = useState(() => safeParse('familyHistory', []));
  const [cellHistory, setCellHistory] = useState(() => safeParse('cellHistory', []));

  useEffect(() => {
    safeSetItem('familyHistory', JSON.stringify(familyHistory));
  }, [familyHistory]);
  useEffect(() => {
    safeSetItem('cellHistory', JSON.stringify(cellHistory));
  }, [cellHistory]);

  const handleCompleteFamily = () => {
    if (window.confirm('오늘의 가정예배를 완료하시겠습니까?\n작성된 내용은 이력으로 저장되고 화면은 초기화됩니다.')) {
      const newRecord = { id: Date.now(), date: date, data: { ...familyRoomData } };
      setFamilyHistory((prev) => [newRecord, ...getArr(prev)]);
      handleUpdateFamily({ attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] });
      if (authUser?.name) logUserAction(authUser.name, '가정예배', 'write', `[완료] 참석자: ${familyRoomData.attendees}`);
      alert('가정예배 이력이 성공적으로 저장되었습니다.');
    }
  };

  const handleCompleteCell = () => {
    if (window.confirm('이번 주 목장나눔을 완료하시겠습니까?\n작성된 내용은 이력으로 저장되고 화면은 초기화됩니다.')) {
      const d = new Date(date);
      const weekStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${Math.ceil(d.getDate() / 7)}주차`;
      const newRecord = { id: Date.now(), week: weekStr, date: date, data: { ...globalCellData } };
      setCellHistory((prev) => [newRecord, ...getArr(prev)]);
      handleUpdateCell({ notice: '새로운 주간 목장 모임 공지사항입니다.', submissions: [], groupPrayers: [], cellIntercession: '' });
      if (authUser?.name) logUserAction(authUser.name, '목장나눔', 'write', `[완료] 공지: ${globalCellData.notice}`);
      alert('목장나눔 이력이 성공적으로 저장되었습니다.');
    }
  };

  const t = useTheme(isDarkMode);

  const [gisangogiUrl, setGisangogiUrl] = useState('https://youtu.be/9Hqvir-snmk?si=GlIMn7rSjnwQqyo8');
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const aiDetectingRef = useRef(false);
  const aiWindowRef = useRef(false);
  const aiTimerRef = useRef(null);

  const qtEditorRef = useRef(null);
  const mcheyneEditorRef = useRef(null);
  const bibleEditorRef = useRef(null);
  const sermonEditorRef = useRef(null);
  const genEditorRef = useRef(null);

  const [interBook, setInterBook] = useState('Genesis');
  const [interChapter, setInterChapter] = useState(1);
  const [interVerse, setInterVerse] = useState(1);
  const [interWords] = useState([]);
  const [isLoadingInter] = useState(false);
  const [wikiSearchTerm, setWikiSearchTerm] = useState('');

  useEffect(() => {
    if (familyRoomPw)
      setFamilyRoomData(safeParse(`familyRoom_${familyRoomPw}`, { attendees: '', wordMeditation: '', thanks: [], prayers: [], goodDeeds: [] }));
  }, [familyRoomPw]);
  useEffect(() => {
    if (familyRoomPw) safeSetItem(`familyRoom_${familyRoomPw}`, JSON.stringify(familyRoomData));
  }, [familyRoomData, familyRoomPw]);
  useEffect(() => {
    safeSetItem('family_public_' + date, JSON.stringify(familyPublicData));
  }, [familyPublicData, date]);

  const handleStickerAdd = (src, isEmoji) => {
    updateDay({ stickers: [...getArr(currDay.stickers), { id: Date.now(), src, isEmoji, x: window.innerWidth / 2 - 40, y: 150 }] });
  };
  const handleMemoAdd = (animal) => {
    updateDay({ memos: [...getArr(currDay.memos), { id: Date.now(), animal, text: '', x: window.innerWidth / 2 - 80, y: 150 }] });
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateDay({
          stickers: [...getArr(currDay.stickers), { id: Date.now(), src: ev.target.result, isEmoji: false, x: window.innerWidth / 2 - 40, y: 150 }]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchCloudData = useCallback(async () => {
    if (!supabase || document.hidden) return;
    try {
      const { data: qtData } = await supabase.from('shared_qt').select('*');
      if (qtData) {
        const qtObj = {};
        getArr(qtData).forEach((d) => {
          try {
            qtObj[d.date] = JSON.parse(d.video_id);
          } catch (e) {
            qtObj[d.date] = { qt: d.video_id };
          }
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

  const handleUpdateSharedQt = (dateKey, type, videoId) => {
    setGlobalSharedQt((prev) => {
      const dayData = prev[dateKey] || {};
      const nextDayData = { ...dayData, [type]: videoId };
      const next = { ...prev, [dateKey]: nextDayData };
      if (supabase) supabase.from('shared_qt').upsert([{ date: dateKey, video_id: JSON.stringify(nextDayData) }]).then();
      return next;
    });
  };
  const handleUpdateCell = (updater) => {
    setGlobalCellData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (supabase && authUser?.group) supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: next }]).then();
      return next;
    });
  };
  const handleUpdateFamily = (updater) => {
    setFamilyRoomData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (supabase && familyRoomPw) supabase.from('family_rooms').upsert([{ room_pw: familyRoomPw, data: next }]).then();
      return next;
    });
  };
  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const fetchPosts = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('test_board').select('*').order('created_at', { ascending: false });
    if (!error) {
      setBoardPosts(data || []);
      if (data && data.length > 0 && activeScreen !== 'board') {
        const latest = new Date(data[0].created_at).getTime();
        if (Date.now() - latest < 3600000) setHasNewBoardPost(true);
      }
    }
  };
  useEffect(() => {
    fetchPosts();
  }, [activeScreen]);

  const toggleAiDetect = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('마이크 미지원 브라우저입니다.');
    if (isAiDetecting) {
      setIsAiDetecting(false);
      aiDetectingRef.current = false;
      window.aiSermonRec?.stop();
      return;
    }
    try {
      if (navigator.wakeLock) await navigator.wakeLock.request('screen');
    } catch (e) {}
    setIsAiDetecting(true);
    aiDetectingRef.current = true;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let final = '';
      for (let i = ev.results.length - 1; i < ev.results.length; ++i) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' ';
      }
      if (!final.trim()) return;
      if (!aiWindowRef.current) {
        if (final.replace(/\s+/g, '').includes('적용질문')) {
          aiWindowRef.current = true;
          setDailyData((prev) => {
            const d = prev[date] || {};
            return { ...prev, [date]: { ...d, applyQuestions: [...getArr(d.applyQuestions), '[음성] '] } };
          });
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = setTimeout(() => {
            aiWindowRef.current = false;
            alert('적용질문 음성 녹음(3분)이 완료되었습니다.');
          }, 3 * 60 * 1000);
        }
      } else {
        setDailyData((prev) => {
          const d = prev[date] || {};
          const curQ = [...getArr(d.applyQuestions)];
          if (curQ.length > 0) curQ[curQ.length - 1] = curQ[curQ.length - 1] + final;
          return { ...prev, [date]: { ...d, applyQuestions: curQ } };
        });
      }
    };
    rec.onend = () => {
      if (aiDetectingRef.current) {
        setTimeout(() => {
          try {
            rec.start();
          } catch (e) {}
        }, 300);
      }
    };
    window.aiSermonRec = rec;
    rec.start();
  };

  const dateObj = new Date(date);
  const ymdStr = `${dateObj.getFullYear()}년${dateObj.getMonth() + 1}월${dateObj.getDate()}일`;
  const isWknd = dateObj.getDay() % 6 === 0;
  const dateHash = useMemo(() => {
    let hash = 0;
    const dateClean = date.replace(/-/g, '');
    for (let i = 0; i < dateClean.length; i++) hash += dateClean.charCodeAt(i) * (i + 1);
    return hash;
  }, [date]);
  const mainVerseText = getSeededVerse(date, 'general');
  const familyVerseText = getSeededVerse(date, 'family');
  const currentBgUrl = watercolorBgs[dateHash % watercolorBgs.length];
  const formatVerse = formatVerseText(mainVerseText);
  const formatFamVerse = formatVerseText(familyVerseText);

  const totalChaptersCount = 1189;
  let readChapsCount = 0;
  getArr(bibles).forEach((b) => {
    getArr(b.chapters).forEach((v, i) => {
      if (getArr(v).length > 0 && getArr(v).every((_, j) => (readVerses || {})[`${b.name}-${i + 1}-${j}`])) readChapsCount++;
    });
  });
  const bibleProgress = ((readChapsCount / totalChaptersCount) * 100).toFixed(1);
  const mcheyneActivePlan = useMemo(() => getMcheynePlan(date.substring(5, 10)), [date]);

  const streak5 = useMemo(() => {
    let currentStreak = 0;
    const [y, m, d] = getLocalToday().split('-');
    let checkDateObj = new Date(y, m - 1, d);
    for (let i = 0; i < 365; i++) {
      const year = checkDateObj.getFullYear();
      const month = String(checkDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(checkDateObj.getDate()).padStart(2, '0');
      const targetDate = `${year}-${month}-${day}`;
      const ch = dailyData[targetDate]?.checks || {};
      const isCompleted = ch['감사'] && ch['성경읽기'] && ch['QTin'];
      if (isCompleted) {
        currentStreak++;
      } else {
        if (i === 0) {
          checkDateObj.setDate(checkDateObj.getDate() - 1);
          continue;
        }
        break;
      }
      checkDateObj.setDate(checkDateObj.getDate() - 1);
    }
    return currentStreak;
  }, [dailyData]);

  // 추천 찬양 채널 유튜브 링크 100% 유지
  const praiseChannels = [
    { id: 1, title: '예람워십', url: 'https://youtube.com/@yeramworship', bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'FIA 워십', url: 'https://youtube.com/@fiaworship', bg: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: '노부부 찬양', url: 'https://youtube.com/channel/UCCW08kVjOMQg9IsFvub8oOw', bg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80' },
    { id: 4, title: '아가파오', url: 'https://youtube.com/@agapaoworship', bg: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80' },
    { id: 5, title: '팀룩워십', url: 'https://youtube.com/channel/UCHgN8INA-KsfZDQlylH__2g?si=QtjXeRSiGu6iQQb1', bg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
    { id: 6, title: '지나워십', url: 'https://youtube.com/@ginaworship?si=FK3VlE3ULLMMucQs', bg: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?auto=format&fit=crop&w=800&q=80' },
    { id: 7, title: '예수전도단', url: 'https://youtube.com/@ywamworshipkorea?si=sIfM2GxfrszcqgzF', bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' },
    { id: 8, title: '조선가스펠', url: 'https://youtube.com/@chosungospel?si=UChhJ4rgs7DQurNy', bg: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80' },
    { id: 9, title: '마커스워십', url: 'https://youtube.com/@markersworship?si=RJR7dH4Gy5YP0vxF', bg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
    { id: 10, title: '위러브', url: 'https://youtube.com/@welovecreativeteam?si=nmMvbu1PiwjMyksU', bg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
    { id: 11, title: '제이어스', url: 'https://youtube.com/@jusministry?si=Q6p4biaIcH2Uh7JM', bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' }
  ];

  const copyCellReport = () => {
    const pray = getArr(globalCellData.groupPrayers)
      .map((p, i) => `${i + 1}. [${p.name}] ${p.text}`)
      .join('\n');
    const txt = `[목장 모임 보고서]\n목장명: ${authUser?.group || ''}\n작성자: ${authUser?.name || ''}\n\n[주간 공지사항]\n${globalCellData.notice || ''}\n\n[목장 중보기도]\n${globalCellData.cellIntercession || ''}\n\n[식구 기도제목]\n${pray}`;
    navigator.clipboard.writeText(txt);
    alert('목장 보고서가 복사되었습니다.');
  };

  const findBibleText = (refText) => {
    const p = parseBibleRefExt(refText || '');
    if (p && p.eb) {
      const bD = getArr(bibles).find((b) => b.name === p.eb);
      if (bD) {
        const vs = [];
        for (let c = p.c1; c <= p.c2; c++) {
          const chD = getArr(bD.chapters)[c - 1];
          if (!chD) continue;
          const sIdx = c === p.c1 ? p.v1 - 1 : 0;
          const eIdx = c === p.c2 ? (p.v2 === 999 ? getArr(chD).length - 1 : p.v2 - 1) : getArr(chD).length - 1;
          for (let i = sIdx; i <= eIdx; i++) {
            if (chD[i]) vs.push({ ref: `${p.kb} ${c}:${i + 1}`, text: cleanText(chD[i]), vIdx: i + 1 });
          }
        }
        if (vs.length > 0) {
          openModal('bibleRef', { title: `${p.kb} 본문`, verses: vs, parsedRef: p });
          return;
        }
      }
    }
    alert('말씀 본문을 정확히 찾을 수 없습니다.');
  };

  const toggleTTS = (queue) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    queue.forEach((text, idx) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = ttsRate;
      if (idx === queue.length - 1) {
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
      }
      window.speechSynthesis.speak(u);
    });
  };

  const downloadSermonWord = async () => {
    const formatArr = (arr) =>
      getArr(arr)
        .map((q) => (q && !(q || '').startsWith('[음성]') ? `<li>${q}</li>` : ''))
        .join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>예배노트_${date}</title></head><body style="font-family: 'Malgun Gothic', sans-serif;"><h1 style="color: #3B82F6;">예배 노트 (${date})</h1><table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse; margin-bottom: 20px;"><tr><th style="background:#F2F4F6; width:20%;">설교자</th><td>${currDay.sermonPreacher || ''}</td><th style="background:#F2F4F6; width:20%;">본문</th><td>${currDay.sermonReference || ''}</td></tr><tr><th style="background:#F2F4F6;">설교 제목</th><td colspan="3">${currDay.sermonTitle || ''}</td></tr></table><h3>나의 감사 선포</h3><ul>${formatArr(getArr(currDay.thanksDeclarations, ['', ''])) || '<li>없음</li>'}</ul><h3>나의 적용 질문</h3><ul>${formatArr(getArr(currDay.applyQuestions)) || '<li>없음</li>'}</ul><h3>말씀 노트</h3><div style="line-height: 1.6; font-size: 11pt;">${currDay.sermonNotes || ''}</div></body></html>`;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `예배노트_${date}.doc`;
    link.click();
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const downloadWallpaper = async (textToDraw, bgUrl) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = bgUrl || currentBgUrl;
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, 1080, 1920);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      const fTxt = formatVerseText(textToDraw);
      const words = fTxt.text.split(' ');
      let lines = [];
      let currentLine = words[0];
      ctx.font = 'bold 52px "Pretendard", "Malgun Gothic", sans-serif';
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < 920) currentLine += ' ' + word;
        else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      let startY = 1920 / 2 - (lines.length * 88) / 2;
      lines.forEach((line) => {
        ctx.fillText(line, 540, startY);
        startY += 88;
      });
      ctx.font = '34px "Pretendard", "Malgun Gothic", sans-serif';
      ctx.globalAlpha = 0.85;
      ctx.fillText(fTxt.ref, 540, startY + 40);
      const link = document.createElement('a');
      link.download = `말씀카드배경_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

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
    else if (type === 'fullVerse') initial = { text: data?.text || '', bgHash: data?.bgHash || 0, bgUrl: data?.bgUrl || '' };
    else if (type === 'bibleNoteCreate') initial = { verses: [...getArr(data?.verses)], note: data?.note || '' };
    else if (type === 'strongsDic') initial = { word: data || {} };
    else if (type === 'bibleChallenge') initial = {};
    else if (type === 'sermonList') initial = { notes: Object.entries(dailyData).filter(([_, d]) => d.sermonTitle || d.sermonNotes) };
    else if (type === 'wikiDetail') initial = data;
    else initial = data ? JSON.parse(JSON.stringify(data)) : {};
    setMLocal(initial);
    setModal({ isOpen: true, type, updateFn: fn });
  };

  const closeModal = () => {
    if (modal.type === 'globalPrayer') setGlobalPrayers(mLocal);
    else if (modal.type === 'globalIntercession') setGlobalIntercessions(mLocal);
    else if (modal.updateFn) modal.updateFn(mLocal);
    setModal({ isOpen: false });
  };

  const handleCopy = () => {
    let txt = '';
    if (modal.type === 'thanks') txt = `[오늘의 감사 리스트]\n${currDay.thanksText || ''}`;
    else if (modal.type === 'applyQuestion')
      txt = `[나의 적용 질문]\n` + getArr(mLocal?.applyQuestions).map((q, i) => `${i + 1}.${q}`).join('\n');
    else if (modal.type === 'thanksDeclaration')
      txt = `[나의 감사 선포]\n` + getArr(mLocal?.thanksDeclarations, ['', '']).map((q, i) => `${i + 1}.${q}`).join('\n');
    else if (modal.type === 'testimony') txt = `[나의 묵상 간증]\n\n${currDay.testimony || ''}`;
    navigator.clipboard.writeText(txt);
    alert('클립보드에 복사되었습니다.');
  };

  const [dragState, setDragState] = useState({ id: null, type: null, startX: 0, startY: 0, initX: 0, initY: 0 });
  const onPtrDown = (e, item, type) => {
    if (tool !== 'hand') return;
    e.stopPropagation();
    setDragState({ id: item.id, type, startX: e.clientX, startY: e.clientY, initX: item.x, initY: item.y });
  };
  const onPtrMove = (e) => {
    if (!dragState.id) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (activeScreen === 'generalNote' && currentGenNoteId) {
      const note = getArr(generalNotes).find((n) => n.id === currentGenNoteId);
      if (!note) return;
      if (dragState.type === 'memo') {
        const m = getArr(note.memos).map((x) => (x.id === dragState.id ? { ...x, x: dragState.initX + dx, y: dragState.initY + dy } : x));
        setGeneralNotes(getArr(generalNotes).map((x) => (x.id === currentGenNoteId ? { ...x, memos: m } : x)));
      } else if (dragState.type === 'sticker') {
        const s = getArr(note.stickers).map((x) => (x.id === dragState.id ? { ...x, x: dragState.initX + dx, y: dragState.initY + dy } : x));
        setGeneralNotes(getArr(generalNotes).map((x) => (x.id === currentGenNoteId ? { ...x, stickers: s } : x)));
      }
    } else {
      if (dragState.type === 'memo')
        updateDay({ memos: getArr(currDay.memos).map((m) => (m.id === dragState.id ? { ...m, x: dragState.initX + dx, y: dragState.initY + dy } : m)) });
      else if (dragState.type === 'sticker')
        updateDay({
          stickers: getArr(currDay.stickers).map((s) => (s.id === dragState.id ? { ...s, x: dragState.initX + dx, y: dragState.initY + dy } : s))
        });
    }
  };
  const onPtrUp = () => setDragState({ id: null, type: null, startX: 0, startY: 0, initX: 0, initY: 0 });

  const renderToolbar = (editorRef, showFont = true, handleStkAdd, handleMmAdd, handleFileUp) => (
    <div className={`w-full ${t.cardBg} border-b ${t.border} p-1.5 flex flex-wrap gap-1.5 items-center rounded-t-2xl ignore-draw z-[70] shrink-0 pointer-events-auto relative`}>
      {showFont && (
        <div className={`flex items-center gap-1 shrink-0 border-r pr-2 ${t.border} mr-1`}>
          <button
            onClick={() => editorRef?.current?.exec('bold')}
            className={`w-7 h-7 flex items-center justify-center font-bold rounded-lg ${t.textMain} ${t.btnGhost} cursor-pointer`}
            title="굵게"
          >
            B
          </button>
          <button
            onClick={() => editorRef?.current?.exec('underline')}
            className={`w-7 h-7 flex items-center justify-center font-bold underline rounded-lg ${t.textMain} ${t.btnGhost} cursor-pointer`}
            title="밑줄"
          >
            U
          </button>
          <select
            onChange={(e) => editorRef?.current?.exec('fontSize', e.target.value)}
            className={`h-7 px-2 text-[12px] font-bold rounded-lg border outline-none ${t.inputBg} ${t.textMain} cursor-pointer`}
          >
            <option value="3">본문</option>
            <option value="4">중간</option>
            <option value="5">크게</option>
          </select>
          <button
            onClick={() => editorRef?.current?.insertTable()}
            className={`h-7 px-2.5 text-[12px] font-bold ${t.primaryText} rounded-lg hover:bg-[#3B82F6]/10 whitespace-nowrap cursor-pointer`}
          >
            표 삽입
          </button>
        </div>
      )}

      {handleStkAdd && (
        <div className={`flex items-center shrink-0 border-r pr-2 ${t.border} mr-1`}>
          <label className="h-7 px-2.5 flex items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] text-[12px] font-bold hover:bg-[#3B82F6]/20 cursor-pointer whitespace-nowrap">
            사진 첨부
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (handleFileUp) handleFileUp(e);
              }}
              className="hidden"
            />
          </label>
        </div>
      )}

      <div className={`flex items-center gap-2 shrink-0 border-r pr-2 ${t.border} mr-1`}>
        <input
          type="range"
          min="1"
          max="20"
          value={size || 3}
          onChange={(e) => setSize && setSize(Number(e.target.value))}
          className="w-12 sm:w-16 accent-[#3B82F6]"
        />
        <input
          type="color"
          value={color || '#3B82F6'}
          onChange={(e) => setColor && setColor(e.target.value)}
          className={`w-7 h-7 rounded-lg cursor-pointer border ${t.border} p-0`}
        />
      </div>

      <div className="flex flex-wrap gap-1 shrink-0">
        {[
          { id: 'hand', label: '이동' },
          { id: 'pen', label: '볼펜' },
          { id: 'fountain', label: '만년필' },
          { id: 'pencil', label: '연필' },
          { id: 'highlighter', label: '형광펜' },
          { id: 'arrow', label: '화살표' },
          { id: 'eraser', label: '지우개' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTool && setTool(item.id)}
            className={`px-2.5 h-7 flex items-center justify-center rounded-lg text-[12px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
              tool === item.id ? 'bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white' : `${t.textSub} ${t.btnGhost}`
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case 'login':
        return <StandaloneLogin supabase={supabase} setAuthUser={setAuthUser} setActiveScreen={setActiveScreen} />;

      case 'sermonArchive':
        return (
          <SermonArchive
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
          />
        );

      case 'sermonArchiveAdvanced':
        return (
          <SermonArchiveAdvanced
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            dailyData={dailyData}
            getArr={getArr}
          />
        );

      case 'applyTracker':
        return (
          <ApplyTracker
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            getArr={getArr}
          />
        );

      case 'trainingSubPages':
        return <TrainingSubPages t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} />;

      case 'virtualChurch':
        return <MetaverseHub setActiveScreen={setActiveScreen} />;

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

      case 'jerusalem_tycoon':
      case 'jerusalemTycoon':
        return <JerusalemTycoon setActiveScreen={setActiveScreen} />;

      case 'galaxy':
      case 'bibleKnowledgeGalaxy':
        return (
          <BibleKnowledgeGalaxy
            setActiveScreen={setActiveScreen}
            setCurrentChapId={setCurrentChapId}
            setBibleViewMode={setBibleViewMode}
            setTargetVerse={setTargetVerse}
          />
        );

      case 'bibleSecondBrain':
        return (
          <BibleSecondBrain3D
            setActiveScreen={setActiveScreen}
            setCurrentChapId={setCurrentChapId}
            setBibleViewMode={setBibleViewMode}
            setTargetVerse={setTargetVerse}
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
        return <ReelsStudio authUser={authUser} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} />;

      case 'trainingCurriculum':
        return (
          <TrainingCurriculum
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        );

      case 'youthCurriculum':
        return (
          <YouthTrainingCurriculum
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        );

      case 'home':
        return (
          <Home
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            openModal={openModal}
            bibleProgress={bibleProgress}
            readChapsCount={readChapsCount}
            currDay={currDay}
            dailyData={dailyData}
            generalNotes={generalNotes}
            globalPrayers={globalPrayers}
            globalCellData={globalCellData}
            readChallengeStart={readChallengeStart}
            date={date}
            setDate={setDate}
            hasNewBoardPost={hasNewBoardPost}
            setHasNewBoardPost={setHasNewBoardPost}
            formatVerse={formatVerse}
            dateHash={dateHash}
            currentBgUrl={currentBgUrl}
            updateDay={updateDay}
            triggerConfetti={triggerConfetti}
            isWknd={isWknd}
            ymdStr={ymdStr}
            praiseChannels={praiseChannels}
            authUser={authUser}
            streak5={streak5}
          />
        );

      case 'fiveSetMenu':
        return (
          <FiveSetMenu
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            logUserAction={logUserAction}
          />
        );

      case 'diary':
        return (
          <Diary
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            openModal={openModal}
            currDay={currDay}
            bibleNotes={bibleNotes}
            getArr={getArr}
            logUserAction={logUserAction}
          />
        );

      case 'board':
        return (
          <Board
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            mLocal={mLocal}
            setMLocal={setMLocal}
            authUser={authUser}
            boardPosts={boardPosts}
            setBoardPosts={setBoardPosts}
            isLoadingPosts={false}
            supabase={supabase}
            fetchPosts={fetchPosts}
            getArr={getArr}
          />
        );

      case 'prayer':
        return (
          <PrayerBox
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            globalPrayers={globalPrayers}
            globalIntercessions={globalIntercessions}
            openModal={openModal}
            getArr={getArr}
            logUserAction={logUserAction}
          />
        );

      case 'bibleReadNote':
        return (
          <BibleReadNoteSplit
            t={t}
            bibles={bibles}
            currentChapId={currentChapId}
            setCurrentChapId={setCurrentChapId}
            onBack={() => setActiveScreen('bible')}
            logUserAction={logUserAction}
          />
        );

      case 'adminConsole':
        return <AdminConsole authUser={authUser} isDarkMode={isDarkMode} onClose={() => setActiveScreen('home')} />;

      case 'cell':
        return (
          <Cell
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            date={date}
            currDay={currDay}
            authUser={authUser}
            globalCellData={globalCellData}
            renderToolbar={renderToolbar}
            handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd}
            handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            onPtrDown={onPtrDown}
            updateDay={updateDay}
            handleUpdateCell={handleUpdateCell}
            handleAutoNumbering={() => {}}
            handleAutoResize={handleAutoResize}
            copyCellReport={copyCellReport}
            getArr={getArr}
            handleCompleteCell={handleCompleteCell}
            openModal={openModal}
            logUserAction={logUserAction}
          />
        );

      case 'qt':
        return (
          <QT
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            date={date}
            currDay={currDay}
            dailyData={dailyData}
            globalSharedQt={globalSharedQt}
            isWknd={isWknd}
            ymdStr={ymdStr}
            qtEditorRef={qtEditorRef}
            renderToolbar={renderToolbar}
            handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd}
            handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            onPtrDown={onPtrDown}
            updateDay={updateDay}
            extractVideoId={extractVideoId}
            handleUpdateSharedQt={handleUpdateSharedQt}
            triggerConfetti={triggerConfetti}
            findBibleText={findBibleText}
            handleAutoResize={handleAutoResize}
            authUser={authUser}
            bibles={bibles}
            logUserAction={logUserAction}
            openGlobalDrawer={openGlobalDrawer}
          />
        );

      case 'mcheyne':
        return (
          <Mcheyne
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            RichTextEditor={RichTextEditor}
            mcheyneEditorRef={mcheyneEditorRef}
            bibles={bibles}
            date={date}
            currDay={currDay}
            ymdStr={ymdStr}
            mcheyneActivePlan={mcheyneActivePlan}
            mcheynePlanIdx={mcheynePlanIdx}
            setMcheynePlanIdx={setMcheynePlanIdx}
            readVerses={readVerses}
            setReadVerses={setReadVerses}
            ttsRate={ttsRate}
            setTtsRate={setTtsRate}
            isSpeaking={isSpeaking}
            renderToolbar={renderToolbar}
            handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd}
            handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            onPtrDown={onPtrDown}
            updateDay={updateDay}
            getArr={getArr}
            cleanText={cleanText}
            toggleTTS={toggleTTS}
            handleAutoResize={handleAutoResize}
            logUserAction={logUserAction}
          />
        );

      case 'bible':
        return (
          <Bible
            bibles={bibles}
            currentChapId={currentChapId}
            setCurrentChapId={setCurrentChapId}
            bibleViewMode={bibleViewMode}
            setBibleViewMode={setBibleViewMode}
            bibleNotes={bibleNotes}
            setBibleNotes={setBibleNotes}
            bibleHighlights={bibleHighlights}
            setBibleHighlights={setBibleHighlights}
            readVerses={readVerses}
            setReadVerses={setReadVerses}
            isDarkMode={isDarkMode}
            t={t}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            getKoName={getKoName}
            getArr={getArr}
            readChallengeStart={readChallengeStart}
            setReadChallengeStart={setReadChallengeStart}
            bibleProgress={bibleProgress}
            readChapsCount={readChapsCount}
            openModal={openModal}
            setSelVerses={setSelVerses}
            selVerses={selVerses}
            cleanText={cleanText}
            getLocalToday={getLocalToday}
            renderToolbar={renderToolbar}
            bibleEditorRef={bibleEditorRef}
            handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd}
            handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            SubPageHeader={SubPageHeader}
            currDay={currDay}
            updateDay={updateDay}
            onPtrDown={onPtrDown}
            handleAutoResize={handleAutoResize}
            targetVerse={targetVerse}
            setTargetVerse={setTargetVerse}
          />
        );

      case 'bibleMap':
        return (
          <div className="flex flex-col h-full relative overflow-hidden">
            <div className={`px-5 py-4 ${t.cardBg} border-b ${t.border} flex items-center justify-between z-10`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveScreen('bibleWikiAdvanced')} className={`p-2 rounded-xl ${t.btnGhost} ${t.textMain} cursor-pointer`}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain} flex items-center gap-2`}>
                  <Compass className="w-5 h-5 text-[#3B82F6]" /> 입체 성경 지도
                </h2>
              </div>
            </div>
            <div className="flex-1 relative">
              <BibleMapViewer
                t={t}
                isDarkMode={isDarkMode}
                onSelectLocation={(loc) => {
                  console.log('선택된 성경 장소:', loc);
                }}
                logUserAction={logUserAction}
              />
            </div>
          </div>
        );

      case 'sermon':
        return (
          <Sermon
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            date={date}
            currDay={currDay}
            updateDay={updateDay}
            sermonEditorRef={sermonEditorRef}
            renderToolbar={renderToolbar}
            handleStickerAdd={handleStickerAdd}
            handleMemoAdd={handleMemoAdd}
            handleFileUpload={handleFileUpload}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            onPtrDown={onPtrDown}
            getArr={getArr}
            downloadSermonWord={downloadSermonWord}
            toggleAiDetect={toggleAiDetect}
            isAiDetecting={isAiDetecting}
            openModal={openModal}
            isGisangogi={isGisangogi}
            gisangogiUrl={gisangogiUrl}
            setGisangogiUrl={setGisangogiUrl}
            authUser={authUser}
            bibles={bibles}
            findBibleText={findBibleText}
            extractVideoId={extractVideoId}
            handleUpdateSharedQt={handleUpdateSharedQt}
            globalSharedQt={globalSharedQt}
            setDailyData={setDailyData}
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
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            SubPageHeader={SubPageHeader}
            date={date}
            generalNotes={generalNotes}
            setGeneralNotes={setGeneralNotes}
            currentGenNoteId={currentGenNoteId}
            setCurrentGenNoteId={setCurrentGenNoteId}
            bibles={bibles}
            genEditorRef={genEditorRef}
            renderToolbar={renderToolbar}
            CanvasEngine={CanvasEngine}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            StickerLayer={StickerLayer}
            onPtrDown={onPtrDown}
            RichTextEditor={RichTextEditor}
            getArr={getArr}
            openModal={openModal}
            logUserAction={logUserAction}
          />
        );

      case 'qtArchiveDetail':
        return <QTArchiveDetail t={t} isDarkMode={isDarkMode} setActiveScreen={setActiveScreen} />;

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
            t={t}
            setActiveScreen={setActiveScreen}
            setIsSidebarOpen={setIsSidebarOpen}
            interWords={interWords}
            interBook={interBook}
            setInterBook={setInterBook}
            interChapter={interChapter}
            setInterChapter={setInterChapter}
            interVerse={interVerse}
            setInterVerse={setInterVerse}
            bibles={bibles}
            isLoadingInter={isLoadingInter}
            getArr={getArr}
            getKoName={getKoName}
            openModal={openModal}
          />
        );

      case 'interlinear_kids':
      case 'interlinearKids':
        return (
          <InterlinearKids
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            setIsSidebarOpen={setIsSidebarOpen}
            bibles={bibles}
            getArr={getArr}
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
        return <JerichoWalk t={t} setActiveScreen={setActiveScreen} logUserAction={logUserAction} />;

      default:
        return (
          <Home
            t={t}
            isDarkMode={isDarkMode}
            setActiveScreen={setActiveScreen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            openModal={openModal}
            bibleProgress={bibleProgress}
            readChapsCount={readChapsCount}
            currDay={currDay}
            dailyData={dailyData}
            generalNotes={generalNotes}
            globalPrayers={globalPrayers}
            globalCellData={globalCellData}
            readChallengeStart={readChallengeStart}
            date={date}
            setDate={setDate}
            hasNewBoardPost={hasNewBoardPost}
            setHasNewBoardPost={setHasNewBoardPost}
            formatVerse={formatVerse}
            dateHash={dateHash}
            currentBgUrl={currentBgUrl}
            updateDay={updateDay}
            triggerConfetti={triggerConfetti}
            isWknd={isWknd}
            ymdStr={ymdStr}
            praiseChannels={praiseChannels}
            authUser={authUser}
            streak5={streak5}
          />
        );
    }
  };

  return (
    <AppErrorBoundary>
      <div className={`h-[100dvh] w-full bg-[#101216] flex justify-center relative ${isDarkMode ? 'dark' : ''}`}>
        <GlobalStyles />
        {showConfetti && <Confetti />}

        {/* 메인 레이아웃 프레임 */}
        <div className={`w-full h-full flex relative ${t.appBg} overflow-hidden max-w-[1600px] mx-auto`}>
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
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-[140] md:hidden pointer-events-auto"
            />
          )}

          <div
            className="flex-1 w-full h-full min-w-0 flex flex-col relative overflow-hidden bg-inherit"
            onPointerMove={onPtrMove}
            onPointerUp={onPtrUp}
            onPointerLeave={onPtrUp}
          >
            <div className="flex-1 overflow-hidden relative z-10 w-full h-full pointer-events-auto">{renderScreen()}</div>

            {/* 모바일·태블릿 하단 플로팅 바 (5번째 '루틴' 복원 + 터치 확대 효과) */}
            {![
              'login',
              'adminConsole',
              'cell',
              'virtualChurch',
              'bibleSecondBrain',
              'cellAttendance',
              'galaxy',
              'youthCurriculum',
              'JerichoWalk',
              'jerichowalk',
              'jericho',
              'qtArchiveDetail',
              'jerusalem_tycoon',
              'Jerusalem_Tycoon',
              'trainingCurriculum',
              'trainingSubPages',
              'QTArchiveDetail',
              'interlinear_kids',
              'secretChat',
              'generalNote',
              'meditationPilgrimage',
              'bible',
              'reelsStudio',
              'interlinear',
              'mcheyne'
            ].includes(activeScreen) && (
              <nav
                className={`lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] h-[64px] z-[90] pointer-events-auto rounded-2xl border transition-colors ${
                  isDarkMode ? 'bg-[#181B20]/95 border-[#262A32]' : 'bg-white/95 border-[#E5E8EB]'
                } backdrop-blur-xl shadow-lg`}
              >
                <div className="grid grid-cols-5 h-full items-center px-1">
                  {[
                    { id: 'home', label: '홈', sketch: 'home', icon: Church },
                    { id: 'diary', label: '감사·간증', sketch: 'diary', icon: Heart },
                    { id: 'cell', label: '목장모임', sketch: 'cell', icon: Users },
                    { id: 'bible', label: '성경통독', sketch: 'bible', icon: BookOpen },
                    { id: 'dailyRoutine', label: '루틴', sketch: 'qt', icon: Flame }
                  ].map((tabItem) => {
                    const isActive = activeScreen === tabItem.id;
                    const TabIcon = tabItem.icon;
                    return (
                      <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => setActiveScreen(tabItem.id)}
                        className="flex flex-col items-center justify-center h-full cursor-pointer select-none group active:scale-110 transition-transform duration-150"
                      >
                        <div
                          className={`p-1 rounded-xl transition-transform duration-150 group-active:scale-125 ${
                            isActive ? 'bg-[#3B82F6]/15 scale-110' : ''
                          }`}
                        >
                          <ChurchSketchIcon
                            name={tabItem.sketch}
                            fallback={TabIcon}
                            className="w-7 h-7"
                            isDarkMode={isDarkMode}
                          />
                        </div>
                        <span className={`text-[11.5px] font-bold mt-0.5 ${isActive ? 'text-[#3B82F6]' : 'text-[#8B95A1]'}`}>
                          {tabItem.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}
          </div>

          {/* 모달 렌더링 컨테이너 */}
          {modal.isOpen && mLocal && (
            <div className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-auto">
              {modal.type === 'generalNoteHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                    <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>나의 자유 노트 이력</h2>
                    <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                      닫기
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 pb-32">
                    {getArr(generalNotes).length === 0 ? (
                      <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>작성된 노트가 없습니다.</div>
                    ) : (
                      getArr(generalNotes).map((note) => (
                        <div
                          key={note.id}
                          className={`${t.cardBg} p-5 rounded-2xl border ${t.border} flex flex-col gap-2 cursor-pointer`}
                          onClick={() => {
                            setCurrentGenNoteId(note.id);
                            closeModal();
                          }}
                        >
                          <div className="flex justify-between items-center border-b border-[#E5E8EB] dark:border-[#262A32] pb-3 mb-1">
                            <span className={`text-[15px] font-bold ${t.primaryText}`}>{note.title || '제목 없는 노트'}</span>
                          </div>
                          <p className={`text-[15px] ${t.textSub} line-clamp-2 leading-relaxed`}>
                            {note.content ? note.content.replace(/<[^>]*>?/gm, '') : '내용 없음'}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-[12px] font-medium ${t.textSub}`}>{note.updatedAt || '날짜 미상'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('이 노트를 삭제하시겠습니까?')) {
                                  setGeneralNotes((prev) => getArr(prev).filter((n) => n.id !== note.id));
                                  if (currentGenNoteId === note.id) setCurrentGenNoteId(null);
                                }
                              }}
                              className={`${t.btnSecondary} text-[12px] font-bold px-3 py-1.5 rounded-lg cursor-pointer`}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {modal.type === 'familyHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                    <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>가정예배 이력 조회</h2>
                    <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                      닫기
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 pb-32">
                    {getArr(familyHistory).length === 0 ? (
                      <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>저장된 가정예배 이력이 없습니다.</div>
                    ) : (
                      getArr(familyHistory).map((record) => (
                        <div key={record.id} className={`${t.cardBg} p-5 rounded-2xl border ${t.border} flex flex-col gap-3`}>
                          <div className="flex justify-between items-center border-b border-[#E5E8EB] dark:border-[#262A32] pb-3">
                            <span className={`text-[15px] font-bold ${t.primaryText}`}>{record.date} 예배</span>
                            <span className={`text-[12px] ${t.textSub} font-medium`}>참석자: {record.data.attendees || '미입력'}</span>
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-bold ${t.textMain} mb-1`}>말씀 묵상</h4>
                            <p className={`text-[15px] ${t.textSub} whitespace-pre-wrap leading-relaxed`}>{record.data.wordMeditation || '기록 없음'}</p>
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-bold ${t.textMain} mb-1`}>감사와 기도</h4>
                            <p className={`text-[15px] ${t.textSub} whitespace-pre-wrap leading-relaxed`}>
                              감사: {getArr(record.data.thanks).join(', ') || '없음'}
                              <br />
                              기도: {getArr(record.data.prayers).join(', ') || '없음'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {modal.type === 'cellHistory' && (
                <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                  <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                    <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>목장나눔 이력 조회</h2>
                    <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                      닫기
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 pb-32">
                    {getArr(cellHistory).length === 0 ? (
                      <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>저장된 목장나눔 이력이 없습니다.</div>
                    ) : (
                      getArr(cellHistory).map((record) => (
                        <div key={record.id} className={`${t.cardBg} p-5 rounded-2xl border ${t.border} flex flex-col gap-3`}>
                          <div className="flex justify-between items-center border-b border-[#E5E8EB] dark:border-[#262A32] pb-3">
                            <span className={`text-[15px] font-bold ${t.primaryText}`}>{record.week} 모임</span>
                            <span className={`text-[12px] ${t.textSub} font-medium`}>({record.date} 저장)</span>
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-bold ${t.textMain} mb-1`}>공지 및 중보기도</h4>
                            <p className={`text-[15px] ${t.textSub} whitespace-pre-wrap leading-relaxed`}>{record.data.notice || '내용 없음'}</p>
                            <p className={`text-[15px] whitespace-pre-wrap leading-relaxed mt-2 font-bold ${t.primaryText}`}>
                              {record.data.cellIntercession || ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {modal.type === 'wikiDetail' ? (
                <div className={`${t.cardBg} sm:rounded-3xl rounded-t-3xl p-0 w-full max-w-[480px] mx-auto overflow-hidden h-[90vh] sm:h-auto max-h-[85vh] flex flex-col border ${t.border} absolute bottom-0 sm:static pointer-events-auto`}>
                  <div className={`${t.bgElevated} flex items-center justify-between px-6 py-5 shrink-0 border-b ${t.border}`}>
                    <span className={`text-[18px] font-bold ${t.textMain}`}>사건 상세정보</span>
                    <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                      닫기
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                    <div className={`flex flex-col gap-2 border-b ${t.border} pb-4`}>
                      <div className="flex justify-between items-start">
                        <h2 className={`text-[18px] font-bold ${t.textMain} leading-snug`}>{mLocal.event}</h2>
                        <span className="text-[12px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg whitespace-nowrap ml-2">
                          {mLocal.verse}
                        </span>
                      </div>
                      <span className={`text-[12px] font-bold ${t.textSub}`}>장소: {mLocal.place}</span>
                    </div>
                    <div className={`p-5 rounded-2xl ${t.bgElevated}`}>
                      <h4 className={`text-[12px] font-bold ${t.textSub} mb-2`}>사건 기록 (본문)</h4>
                      <p className={`text-[15px] ${t.textMain} leading-relaxed break-keep`}>{mLocal.desc}</p>
                    </div>
                    <div className="flex gap-2.5 mt-1">
                      <button
                        onClick={() => {
                          closeModal();
                          setActiveScreen('bible');
                          openModal('bibleRef', { title: '성경 본문', verses: [{ ref: mLocal.verse, text: mLocal.desc }] });
                        }}
                        className="flex-1 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white py-3.5 rounded-2xl font-bold text-[15px] cursor-pointer"
                      >
                        전체 장 읽기
                      </button>
                      <button
                        onClick={() => {
                          closeModal();
                          setActiveScreen('interlinear');
                        }}
                        className={`flex-1 ${t.btnSecondary} py-3.5 rounded-2xl font-bold text-[15px] cursor-pointer`}
                      >
                        원어 성경
                      </button>
                    </div>
                  </div>
                </div>
              ) : modal.type === 'fullVerse' ? (
                <div
                  className={`relative rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col justify-center border ${t.border} bg-cover bg-center h-[80vh] sm:h-[70vh] w-full max-w-[480px] mx-auto absolute bottom-0 sm:static`}
                  style={{ backgroundImage: `url(${mLocal.bgUrl || watercolorBgs[(mLocal.bgHash || 0) % watercolorBgs.length]})` }}
                >
                  <div className="absolute inset-0 bg-black/55" />
                  <div className="relative z-10 p-8 text-center flex flex-col items-center justify-center h-full">
                    <span className="text-[12px] font-bold text-white/90 mb-5 bg-white/15 px-3 py-1.5 rounded-lg">오늘의 말씀 카드</span>
                    <span className="text-[18px] sm:text-[20px] text-white font-bold leading-relaxed break-keep">
                      {(mLocal.text || '').replace(/\([^)]+\)$/, '')}
                    </span>
                    <span className="block mt-6 text-[15px] text-white/85 font-medium">
                      {(mLocal.text || '').match(/\(([^)]+)\)$/)?.[0] || ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadWallpaper(
                          mLocal.text,
                          mLocal.bgUrl || watercolorBgs[(mLocal.bgHash || 0) % watercolorBgs.length]
                        );
                      }}
                      className="mt-10 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-[15px] px-6 py-3 rounded-2xl flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> 이미지로 저장하기
                    </button>
                  </div>
                  <button
                    onClick={closeModal}
                    className="absolute top-5 right-5 px-3 py-1.5 bg-black/40 text-white rounded-xl font-bold text-[12px] z-20 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <div
                  className={`${t.cardBg} sm:rounded-3xl rounded-t-3xl p-0 w-full max-w-[500px] mx-auto overflow-hidden ${
                    ['testimony', 'bibleNoteList', 'thanks', 'sermonList'].includes(modal.type)
                      ? 'h-[95vh] sm:h-[90vh]'
                      : modal.type === 'strongsDic'
                      ? 'h-auto max-h-[85vh]'
                      : 'h-[90vh] sm:h-[80vh]'
                  } flex flex-col border ${t.border} relative pointer-events-auto absolute bottom-0 sm:static`}
                >
                  {![
                    'testimony',
                    'bibleNoteList',
                    'thanks',
                    'sermonList',
                    'strongsDic',
                    'wikiDetail',
                    'generalNoteHistory',
                    'familyHistory',
                    'cellHistory',
                    'globalPrayer',
                    'globalIntercession'
                  ].includes(modal.type) && (
                    <div className={`flex justify-between items-center px-6 py-5 border-b ${t.border} shrink-0 ${t.cardBg}`}>
                      <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>
                        {modal.type === 'bibleRef' ? '말씀 본문 찾기' : modal.type === 'bibleChallenge' ? '성경 365 통독표' : '기록하기'}
                      </h2>
                      <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                        닫기
                      </button>
                    </div>
                  )}

                  <div className={`flex-1 overflow-y-auto flex flex-col relative w-full h-full ${t.bgBody}`}>
                    {modal.type === 'thanks' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>
                            오늘의 감사 리스트 <span className={`text-[12px] font-normal ${t.textSub} ml-1`}>({date})</span>
                          </h2>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={handleCopy} className={`${t.btnSecondary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                              복사
                            </button>
                            <button onClick={closeModal} className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                              닫기
                            </button>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col relative pointer-events-auto">
                          <div className="bg-[#3B82F6]/10 p-4 rounded-2xl mb-4 shrink-0">
                            <span className="text-[12px] font-bold text-[#3B82F6]">
                              일상의 감사를 편하게 적어보세요. (엔터 시 번호 자동생성)
                            </span>
                          </div>
                          <textarea
                            value={mLocal.thanksText || '1. '}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.endsWith('\n')) {
                                const lines = val.split('\n');
                                val += `${lines.length}. `;
                              }
                              setMLocal({ ...mLocal, thanksText: val });
                              updateDay({ thanksText: val, checks: { ...(currDay.checks || {}), 감사: true } });
                            }}
                            className={`w-full flex-1 p-5 rounded-2xl ${t.cardBg} ${t.textMain} border ${t.border} outline-none resize-none overflow-hidden text-[15px] leading-relaxed h-full relative pointer-events-auto note-lines`}
                            placeholder="감사한 내용을 적어보세요..."
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}

                    {modal.type === 'testimony' && (
                      <div className={`absolute inset-0 flex flex-col h-full ${t.bgBody} z-50`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0 z-50`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>나의 묵상 간증</h2>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const txt = currDay.testimony || '';
                                navigator.clipboard.writeText(txt);
                                alert('복사되었습니다.');
                              }}
                              className={`${t.btnSecondary} px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                            >
                              복사
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('초기화하시겠습니까?')) updateDay({ testimony: TESTIMONY_TEMPLATE });
                              }}
                              className={`${t.btnSecondary} px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                            >
                              초기화
                            </button>
                            <button
                              onClick={() => {
                                if (authUser?.name && currDay?.testimony) logUserAction(authUser.name, '감사/간증', 'write', currDay.testimony);
                                closeModal();
                              }}
                              className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                            >
                              닫기
                            </button>
                          </div>
                        </div>

                        <div className={`${t.cardBg} px-6 py-3 border-b ${t.border} flex justify-between items-center shrink-0`}>
                          <span className={`text-[12px] font-bold ${t.textSub}`}>간증문 작성 가이드 및 질문</span>
                          <button
                            onClick={() => setShowGuide(!showGuide)}
                            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${t.bgElevated} text-[#3B82F6] cursor-pointer`}
                          >
                            {showGuide ? '가이드 숨기기' : '가이드 보기'}
                          </button>
                        </div>

                        {showGuide && (
                          <div className={`${t.cardBg} px-6 pb-5 pt-2 shrink-0 z-40 border-b ${t.border}`}>
                            <div className={`${t.bgElevated} p-4 rounded-2xl`}>
                              <ul className={`text-[12px] ${t.textSub} space-y-1.5 font-medium leading-relaxed`}>
                                <li>• 사건을 먼저 쓰지 말고 말씀을 먼저 붙듭니다.</li>
                                <li>• 상대의 죄보다 내 죄를 씁니다.</li>
                                <li>• 고난을 사건으로 끝내지 않고 깨달음과 순종으로 연결합니다.</li>
                                <li>• 오늘 무엇을 순종할지 구체적인 적용을 기록합니다.</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className={`flex-1 relative overflow-hidden flex flex-col ${t.bgBody}`}>
                          <div className="p-5 pb-40 flex flex-col flex-1 overflow-y-auto pointer-events-auto">
                            <textarea
                              value={currDay.testimony || TESTIMONY_TEMPLATE}
                              onChange={(e) => updateDay({ testimony: e.target.value })}
                              onPointerDown={(e) => e.stopPropagation()}
                              className={`w-full flex-1 p-5 rounded-2xl ${t.cardBg} ${t.textMain} border ${t.border} outline-none resize-none text-[15px] h-auto overflow-hidden min-h-[800px] leading-[2.4] relative pointer-events-auto note-lines`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {modal.type === 'sermonList' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>예배 노트 목록</h2>
                          <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                            닫기
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-32 pointer-events-auto">
                          {getArr(mLocal.notes).length === 0 ? (
                            <div className={`text-center py-20 ${t.textSub} text-[15px] font-bold`}>작성된 예배 노트가 없습니다.</div>
                          ) : (
                            getArr(mLocal.notes).map(([dKey, dVal]) => (
                              <div
                                key={dKey}
                                onClick={() => {
                                  setDate(dKey);
                                  closeModal();
                                }}
                                className={`${t.cardBg} p-5 rounded-2xl border ${t.border} cursor-pointer flex flex-col gap-1.5`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-[12px] font-bold text-[#3B82F6]">{dKey}</span>
                                  <span className={`text-[12px] font-medium ${t.textSub}`}>설교자: {dVal.sermonPreacher || '미입력'}</span>
                                </div>
                                <h3 className={`text-[15px] font-bold ${t.textMain}`}>{dVal.sermonTitle || '제목 없는 예배 노트'}</h3>
                                <p className={`text-[12px] font-medium ${t.textSub} truncate`}>본문: {dVal.sermonReference || '본문 없음'}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {modal.type === 'strongsDic' &&
                      mLocal.word &&
                      (() => {
                        const w = mLocal.word;
                        return (
                          <div className={`flex flex-col h-full ${t.bgBody} overflow-hidden rounded-t-3xl`}>
                            <div className={`${t.bgElevated} flex items-center justify-between px-6 py-5 shrink-0 border-b ${t.border}`}>
                              <span className={`text-[18px] font-bold ${t.textMain}`}>원어 사전</span>
                              <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                                닫기
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 pointer-events-auto">
                              <div className={`p-6 ${t.cardBg} border ${t.border} rounded-3xl text-center flex flex-col items-center relative`}>
                                <button
                                  onClick={() => {
                                    if (!window.speechSynthesis || !w.pron) return;
                                    const u = new SpeechSynthesisUtterance(w.pron);
                                    u.lang = 'en-US';
                                    window.speechSynthesis.speak(u);
                                  }}
                                  className="absolute top-4 right-4 bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer"
                                >
                                  발음 듣기
                                </button>
                                <span className={`text-[48px] font-bold ${t.textMain} mt-6 mb-2`} dir={w.strongs?.startsWith('H') ? 'rtl' : 'ltr'}>
                                  {w.orig || w.original_word || w.hebrew}
                                </span>
                                <span className={`text-[15px] ${t.textSub} font-bold mb-4`}>[{w.pronunciation || w.pron}]</span>
                                <div className="flex flex-wrap gap-2 justify-center items-center">
                                  <span className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white px-4 py-1.5 rounded-xl text-[12px] font-bold">
                                    스트롱 코드 {w.strongs_id || w.strongs}
                                  </span>
                                  {w.grammar && (
                                    <span className={`${t.bgElevated} ${t.textMain} px-4 py-1.5 rounded-xl text-[12px] font-bold`}>{w.grammar}</span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} flex flex-col`}>
                                  <span className={`block text-[12px] font-bold ${t.textSub} mb-2`}>한국어 뜻</span>
                                  <span className={`text-[15px] font-bold ${t.textMain} break-keep mt-auto`}>
                                    {w.meaning || w.kor || w.korean_trans}
                                  </span>
                                </div>
                                <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} flex flex-col`}>
                                  <span className={`block text-[12px] font-bold ${t.textSub} mb-2`}>영문 표기</span>
                                  <span className={`text-[15px] font-bold ${t.textMain} break-keep mt-auto`}>{w.eng || w.gloss || '없음'}</span>
                                </div>
                              </div>

                              <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border}`}>
                                <h4 className={`font-bold ${t.textMain} text-[15px] mb-2`}>상세 해석 및 어원</h4>
                                <p className={`text-[15px] ${t.textSub} leading-relaxed whitespace-pre-wrap break-keep`}>
                                  {w.description || w.desc || '등록된 어원 정보가 없습니다.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {modal.type === 'bibleRef' && (
                      <div className="flex flex-col h-full gap-4 p-5 pointer-events-auto">
                        <div className="bg-[#3B82F6]/10 p-4 rounded-2xl">
                          <span className="text-[12px] font-bold text-[#3B82F6] block">
                            복사 버튼을 눌러 복사한 뒤 원하는 노트에 붙여넣으세요.
                          </span>
                        </div>
                        <div className={`space-y-4 p-5 ${t.cardBg} rounded-2xl leading-relaxed text-[15px] ${t.textMain} overflow-y-auto flex-1 border ${t.border}`}>
                          {getArr(mLocal.verses).map((v, i) => {
                            const copyText = `> [${v.ref}] ${cleanText(v.text || v)}\n`;
                            return (
                              <div key={i} className={`flex items-start gap-3 pb-4 border-b ${t.border} last:border-0 last:pb-0`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(copyText);
                                    alert('말씀이 복사되었습니다.');
                                  }}
                                  className={`shrink-0 py-1.5 px-3 ${t.bgElevated} rounded-xl text-[12px] font-bold ${t.textMain} cursor-pointer`}
                                >
                                  복사
                                </button>
                                <p className="flex-1 pt-0.5">
                                  <span className="text-[#3B82F6] font-bold mr-2">{v.ref?.split(' ')[1] || v.vIdx}</span>
                                  {cleanText(v.text || v)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {modal.type === 'thanksDeclaration' && (
                      <div className="space-y-4 p-5 pointer-events-auto">
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              const txt = getArr(mLocal?.thanksDeclarations, ['', ''])
                                .map((q, i) => `${i + 1}.${q}`)
                                .join('\n');
                              navigator.clipboard.writeText(txt);
                              alert('복사되었습니다.');
                            }}
                            className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                          >
                            전체 복사
                          </button>
                        </div>
                        {[0, 1].map((i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <span className={`text-[12px] font-bold px-1 ${t.textSub}`}>{i + 1}번째 감사 선포</span>
                            <textarea
                              value={(mLocal.thanksDeclarations || ['', ''])[i] || ''}
                              onChange={(e) => {
                                const next = [...(mLocal.thanksDeclarations || ['', ''])];
                                next[i] = e.target.value;
                                setMLocal({ ...mLocal, thanksDeclarations: next });
                                updateDay({ thanksDeclarations: next, checks: { ...(currDay.checks || {}), 감사: true } });
                              }}
                              onInput={handleAutoResize}
                              className={`w-full p-4 rounded-2xl ${t.bgInput} ${t.textMain} min-h-[80px] resize-none overflow-hidden border outline-none text-[15px] whitespace-pre-wrap focus:border-[#3B82F6]`}
                              placeholder="나는 ~를 감사합니다."
                              onPointerDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {modal.type === 'applyQuestion' && (
                      <div className="space-y-4 p-5 pointer-events-auto">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => {
                              const txt = getArr(mLocal?.applyQuestions)
                                .map((q, i) => `${i + 1}.${q}`)
                                .join('\n');
                              navigator.clipboard.writeText(txt);
                              alert('복사되었습니다.');
                            }}
                            className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                          >
                            전체 복사
                          </button>
                        </div>
                        {getArr(mLocal.applyQuestions).map((qItem, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <textarea
                              value={qItem || ''}
                              onChange={(e) => {
                                const n = [...getArr(mLocal.applyQuestions)];
                                n[i] = e.target.value;
                                setMLocal({ ...mLocal, applyQuestions: n });
                                updateDay({ applyQuestions: n });
                              }}
                              onInput={handleAutoResize}
                              className={`flex-1 min-h-[60px] p-4 rounded-2xl ${t.bgInput} ${t.textMain} border outline-none resize-none overflow-hidden text-[15px] whitespace-pre-wrap focus:border-[#3B82F6]`}
                              onPointerDown={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={() => {
                                const n = [...getArr(mLocal.applyQuestions)];
                                n.splice(i, 1);
                                setMLocal({ ...mLocal, applyQuestions: n });
                                updateDay({ applyQuestions: n });
                              }}
                              className={`${t.btnSecondary} text-[12px] px-3.5 py-4 rounded-2xl font-bold shrink-0 cursor-pointer`}
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const n = [...getArr(mLocal.applyQuestions), ''];
                            setMLocal({ ...mLocal, applyQuestions: n });
                            updateDay({ applyQuestions: n });
                          }}
                          className={`w-full py-3.5 border border-dashed ${t.border} ${t.textSub} font-bold rounded-2xl text-[15px] hover:border-[#3B82F6] hover:text-[#3B82F6] cursor-pointer`}
                        >
                          + 질문 추가
                        </button>
                      </div>
                    )}

                    {modal.type === 'globalPrayer' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                        <div className={`flex justify-between items-center px-5 py-4 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>나의 기도제목</h2>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const txt = getArr(mLocal)
                                  .filter((p) => p.status === 'praying')
                                  .map((p, i) => `${i + 1}.${p.text}`)
                                  .join('\n');
                                navigator.clipboard.writeText(txt);
                                alert('기도제목이 복사되었습니다.');
                              }}
                              className={`${t.btnSecondary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                            >
                              복사
                            </button>
                            <button onClick={closeModal} className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                              닫기
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                          <div className="flex flex-col gap-3">
                            <span className="text-[12px] font-bold text-[#3B82F6] px-1">
                              기도 중인 제목 ({getArr(mLocal).filter((p) => p.status === 'praying').length})
                            </span>

                            <div className="flex flex-col gap-2.5">
                              {getArr(mLocal)
                                .filter((p) => p.status === 'praying')
                                .map((p) => (
                                  <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.cardBg} border ${t.border}`}>
                                    <textarea
                                      value={p.text || ''}
                                      onChange={(e) => setMLocal(getArr(mLocal).map((pr) => (pr.id === p.id ? { ...pr, text: e.target.value } : pr)))}
                                      onInput={handleAutoResize}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      placeholder="기도제목을 입력하세요..."
                                      className={`flex-1 min-w-0 bg-transparent text-[15px] ${t.textMain} outline-none resize-none overflow-hidden leading-relaxed min-h-[44px]`}
                                    />
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                      <button
                                        onClick={() => {
                                          if (!p.text || !p.text.trim()) return alert('전송할 기도제목이 없습니다.');
                                          try {
                                            const uName = authUser?.name || '나';
                                            const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
                                            const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];
                                            curPrayers.push({ id: Date.now(), name: uName, text: p.text.trim(), status: 'praying' });
                                            const nextCellData = { ...cellData, groupPrayers: curPrayers };
                                            localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
                                            if (supabase && authUser?.group)
                                              supabase.from('cell_groups').upsert([{ group_name: authUser.group, data: nextCellData }]).then();
                                            alert('목장 모임 식구 기도제목으로 전송되었습니다.');
                                          } catch (e) {
                                            alert('전송 중 오류가 발생했습니다.');
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl text-[12px] font-bold cursor-pointer"
                                      >
                                        목장으로
                                      </button>
                                      <button
                                        onClick={() => setMLocal(getArr(mLocal).map((pr) => (pr.id === p.id ? { ...pr, status: 'answered' } : pr)))}
                                        className={`px-3 py-1.5 ${t.btnSecondary} rounded-xl text-[12px] font-bold cursor-pointer`}
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
                                updateDay({ checks: { ...(currDay.checks || {}), 기도하기: true } });
                              }}
                              className={`w-full py-3.5 rounded-2xl border border-dashed ${t.border} text-[15px] font-bold text-[#3B82F6] cursor-pointer`}
                            >
                              + 새로운 기도제목 추가
                            </button>
                          </div>

                          {getArr(mLocal).filter((p) => p.status === 'answered').length > 0 && (
                            <div className={`flex flex-col gap-2.5 pt-4 border-t ${t.border}`}>
                              <span className={`text-[12px] font-bold ${t.textSub} px-1`}>
                                응답 받은 기도 ({getArr(mLocal).filter((p) => p.status === 'answered').length})
                              </span>
                              {getArr(mLocal)
                                .filter((p) => p.status === 'answered')
                                .map((p) => (
                                  <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.bgElevated} opacity-80`}>
                                    <span className={`flex-1 min-w-0 text-[15px] ${t.textSub} line-through break-keep`}>{p.text}</span>
                                    <button
                                      onClick={() => setMLocal(getArr(mLocal).filter((pr) => pr.id !== p.id))}
                                      className={`text-[12px] font-bold ${t.btnSecondary} px-3 py-1.5 rounded-xl shrink-0 cursor-pointer`}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {modal.type === 'globalIntercession' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50`}>
                        <div className={`flex justify-between items-center px-5 py-4 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>이웃 중보기도</h2>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const txt = getArr(mLocal)
                                  .filter((p) => p.status === 'praying')
                                  .map((p, i) => `${i + 1}.${p.text}`)
                                  .join('\n');
                                navigator.clipboard.writeText(txt);
                                alert('중보기도가 복사되었습니다.');
                              }}
                              className={`${t.btnSecondary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}
                            >
                              복사
                            </button>
                            <button onClick={closeModal} className={`${t.btnPrimary} px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                              닫기
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                          <div className="flex flex-col gap-3">
                            <span className="text-[12px] font-bold text-[#3B82F6] px-1">
                              중보 중인 제목 ({getArr(mLocal).filter((p) => p.status === 'praying').length})
                            </span>

                            <div className="flex flex-col gap-2.5">
                              {getArr(mLocal)
                                .filter((p) => p.status === 'praying')
                                .map((p) => (
                                  <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.cardBg} border ${t.border}`}>
                                    <textarea
                                      value={p.text || ''}
                                      onChange={(e) => setMLocal(getArr(mLocal).map((pr) => (pr.id === p.id ? { ...pr, text: e.target.value } : pr)))}
                                      onInput={handleAutoResize}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      placeholder="중보기도 제목을 입력하세요..."
                                      className={`flex-1 min-w-0 bg-transparent text-[15px] ${t.textMain} outline-none resize-none overflow-hidden leading-relaxed min-h-[44px]`}
                                    />
                                    <button
                                      onClick={() => setMLocal(getArr(mLocal).map((pr) => (pr.id === p.id ? { ...pr, status: 'answered' } : pr)))}
                                      className={`px-3 py-2 ${t.btnSecondary} rounded-xl text-[12px] font-bold shrink-0 cursor-pointer`}
                                    >
                                      응답 완료
                                    </button>
                                  </div>
                                ))}
                            </div>

                            <button
                              onClick={() => {
                                setMLocal([...getArr(mLocal), { id: Date.now(), text: '', status: 'praying' }]);
                                updateDay({ checks: { ...(currDay.checks || {}), 기도하기: true } });
                              }}
                              className={`w-full py-3.5 rounded-2xl border border-dashed ${t.border} text-[15px] font-bold text-[#3B82F6] cursor-pointer`}
                            >
                              + 새로운 중보기도 추가
                            </button>
                          </div>

                          {getArr(mLocal).filter((p) => p.status === 'answered').length > 0 && (
                            <div className={`flex flex-col gap-2.5 pt-4 border-t ${t.border}`}>
                              <span className={`text-[12px] font-bold ${t.textSub} px-1`}>
                                응답 받은 중보기도 ({getArr(mLocal).filter((p) => p.status === 'answered').length})
                              </span>
                              {getArr(mLocal)
                                .filter((p) => p.status === 'answered')
                                .map((p) => (
                                  <div key={p.id} className={`flex gap-3 items-center p-3.5 rounded-2xl ${t.bgElevated} opacity-80`}>
                                    <span className={`flex-1 min-w-0 text-[15px] ${t.textSub} line-through break-keep`}>{p.text}</span>
                                    <button
                                      onClick={() => setMLocal(getArr(mLocal).filter((pr) => pr.id !== p.id))}
                                      className={`text-[12px] font-bold ${t.btnSecondary} px-3 py-1.5 rounded-xl shrink-0 cursor-pointer`}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {modal.type === 'bibleChallenge' &&
                      (() => {
                        const startDate = localStorage.getItem('readChallengeStart') || readChallengeStart || '2026-01-01';
                        const startD = new Date(`${startDate}T00:00:00`);
                        const todayD = new Date(`${getLocalToday()}T00:00:00`);
                        const dDay = Math.max(1, Math.floor((todayD.getTime() - startD.getTime()) / 86400000) + 1);

                        return (
                          <div className="flex flex-col gap-4 p-5 pointer-events-auto">
                            <div className={`${t.cardBg} p-5 rounded-3xl border ${t.border} text-center flex flex-col gap-3`}>
                              <div className="flex items-center justify-center gap-3">
                                <span className={`text-[12px] font-bold ${t.textSub}`}>전체 통독 진행률</span>
                                <div className={`flex items-center ${t.bgElevated} px-3 py-1.5 rounded-xl`}>
                                  <span className="text-[12px] font-bold text-[#3B82F6] mr-2">시작일</span>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                      setReadChallengeStart(e.target.value);
                                      localStorage.setItem('readChallengeStart', e.target.value);
                                    }}
                                    className="bg-transparent text-[12px] font-bold text-[#3B82F6] outline-none cursor-pointer"
                                  />
                                </div>
                              </div>
                              <span className="text-[18px] font-bold text-[#3B82F6]">{dDay > 0 ? `${dDay}일차` : '시작 전'}</span>
                              <div className={`w-full ${t.bgElevated} rounded-full h-3 overflow-hidden mt-1`}>
                                <div className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] h-full transition-all duration-700" style={{ width: `${bibleProgress}%` }} />
                              </div>
                              <div className={`flex justify-between text-[12px] font-bold ${t.textMain} px-1`}>
                                <span>완독: {readChapsCount}장</span>
                                <span className="text-[#3B82F6]">진행도 {bibleProgress}%</span>
                              </div>
                            </div>

                            {getArr(bibles).map((b) => {
                              const total = getArr(b.chapters).length;
                              let read = 0;
                              const chaps = getArr(b.chapters).map((verses, chIdx) => {
                                const chNum = chIdx + 1;
                                const isRead =
                                  getArr(verses).length > 0 && getArr(verses).every((_, vIdx) => readVerses[`${b.name}-${chNum}-${vIdx}`]);
                                if (isRead) read++;
                                return { chNum, isRead };
                              });
                              return (
                                <div
                                  key={b.name}
                                  className={`p-5 rounded-2xl border ${read === total ? 'border-2 border-[#3B82F6]' : `${t.border} ${t.cardBg}`} text-left`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className={`font-bold ${t.textMain} text-[15px]`}>
                                      {getKoName(b.name)}{' '}
                                      <span className={`text-[12px] font-medium ${t.textSub} ml-1`}>
                                        ({read}/{total})
                                      </span>
                                    </h4>
                                    {read === total && (
                                      <span className="text-[12px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg">완독</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {chaps.map((c) => (
                                      <div
                                        key={c.chNum}
                                        onClick={() => {
                                          setCurrentChapId(`${b.name}-${c.chNum}`);
                                          setBibleViewMode('read');
                                          setActiveScreen('bible');
                                          closeModal();
                                        }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold border transition-colors cursor-pointer ${
                                          c.isRead ? 'bg-gradient-to-r from-[#2563EB] to-[#4F46E5] border-[#3B82F6] text-white' : `${t.bgElevated} ${t.textMain} border-transparent`
                                        }`}
                                      >
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

                    {modal.type === 'bibleChapterSelect' &&
                      (() => {
                        const b = mLocal.book;
                        return (
                          <div className="flex flex-col gap-4 p-6 pointer-events-auto">
                            <h4 className={`font-bold ${t.textMain} text-[18px] mb-3 text-center`}>{getKoName(b.name)}</h4>
                            <div className="grid grid-cols-5 gap-2.5 max-h-[60vh] overflow-y-auto hide-scrollbar p-1">
                              {getArr(b.chapters).map((_, i) => {
                                const isRead = readVerses[`${b.name}-${i + 1}-0`];
                                return (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      setCurrentChapId(`${b.name}-${i + 1}`);
                                      setBibleViewMode('read');
                                      setActiveScreen('bible');
                                      closeModal();
                                    }}
                                    className={`aspect-square rounded-2xl text-[15px] font-bold transition-colors cursor-pointer ${
                                      isRead ? 'bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white' : `${t.cardBg} ${t.textMain} border ${t.border}`
                                    }`}
                                  >
                                    {i + 1}장
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                    {modal.type === 'bibleNoteCreate' && (
                      <div className="flex flex-col gap-4 h-full p-5 pointer-events-auto">
                        <div className={`p-5 ${t.cardBg} rounded-2xl border ${t.border} max-h-[200px] overflow-y-auto`}>
                          <h4 className={`font-bold ${t.textMain} mb-2 text-[12px]`}>선택한 말씀</h4>
                          {getArr(mLocal.verses).map((v, i) => (
                            <p key={i} className={`text-[15px] ${t.textMain} mb-2 leading-relaxed`}>
                              <span className="font-bold text-[#3B82F6] mr-2">{v.ref}</span> {v.text}
                            </p>
                          ))}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <h4 className={`font-bold ${t.textMain} mb-2 text-[12px] px-1`}>말씀 묵상과 나눔</h4>
                          <textarea
                            value={mLocal.note || ''}
                            onChange={(e) => setMLocal({ ...mLocal, note: e.target.value })}
                            className={`w-full flex-1 p-5 rounded-2xl ${t.bgInput} ${t.textMain} border ${t.border} outline-none resize-none leading-relaxed text-[15px] focus:border-[#3B82F6]`}
                            placeholder="이 말씀을 통해 깨달은 은혜와 묵상을 자유롭게 기록하세요..."
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}

                    {modal.type === 'bibleNoteList' && (
                      <div className={`flex flex-col h-full ${t.bgBody} absolute inset-0 z-50 pointer-events-auto`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>기록된 말씀 노트</h2>
                          <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                            닫기
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 relative pb-32">
                          {getArr([mLocal].flat()).map((n) => (
                            <div key={n.id} className="w-full max-w-2xl mx-auto mb-6">
                              <div className="flex justify-between items-center mb-3 px-2">
                                <span className={`text-[12px] ${t.textSub} font-bold`}>{n.date} 작성</span>
                                <button
                                  onClick={() => {
                                    if (window.confirm('삭제하시겠습니까?')) {
                                      setBibleNotes((prev) => getArr(prev).filter((x) => x.id !== n.id));
                                      closeModal();
                                    }
                                  }}
                                  className={`${t.btnSecondary} text-[12px] font-bold px-3 py-1 rounded-lg cursor-pointer`}
                                >
                                  삭제
                                </button>
                              </div>
                              <div className={`${t.cardBg} rounded-2xl border ${t.border} p-5 mb-3`}>
                                {getArr(n.verses).map((v, i) => (
                                  <p key={i} className={`mb-2 last:mb-0 text-[15px] leading-relaxed ${t.textMain}`}>
                                    <span className="font-bold text-[#3B82F6] mr-2">{v.ref}</span>
                                    {v.text}
                                  </p>
                                ))}
                              </div>
                              <div className={`rounded-2xl ${t.cardBg} border ${t.border} p-5`}>
                                <p className={`text-[15px] leading-relaxed ${t.textMain} whitespace-pre-wrap break-keep`}>{n.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modal.type === 'pipelineGuide' && (
                      <div className={`flex flex-col h-[90vh] sm:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden ${t.pageBg} absolute bottom-0 sm:static pointer-events-auto border ${t.border}`}>
                        <div className={`flex justify-between items-center px-6 py-5 ${t.cardBg} border-b ${t.border} shrink-0`}>
                          <h2 className={`text-[18px] font-bold tracking-tight ${t.textMain}`}>앱 활용 가이드북</h2>
                          <button onClick={closeModal} className={`${t.btnSecondary} px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer`}>
                            닫기
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar flex flex-col space-y-5">
                          <p className={`text-[15px] font-medium ${t.textSub} leading-relaxed break-keep`}>
                            각 페이지가 어떻게 연결되어 영적 성장을 돕는지 한눈에 확인해보세요.
                          </p>

                          <div className={`divide-y ${isDarkMode ? 'divide-[#262A32]' : 'divide-[#E5E8EB]'} border-t border-b ${t.border}`}>
                            {[
                              { step: '1단계 · 기록', title: '일상의 기록', desc: '매일 아침 묵상과 주일 설교를 기록하면 영적 데이터베이스에 자동으로 축적됩니다.' },
                              { step: '2단계 · 분석', title: '심층 묵상과 통찰', desc: '기록된 노트를 바탕으로 핵심 구절과 묵상 흐름을 체계적으로 정리합니다.' },
                              { step: '3단계 · 실천', title: '삶의 훈련과 트래킹', desc: '도출된 적용 질문들을 삶의 현장에 맞게 실천 과제로 바꾸고 완료 여부를 점검합니다.' },
                              { step: '4단계 · 나눔', title: '공동체 나눔과 확장', desc: '혼자만의 묵상에 머물지 않고 실천한 은혜를 목장 모임과 게시판에 나눕니다.' }
                            ].map((s, idx) => (
                              <div key={idx} className="py-4 space-y-1">
                                <span className="text-[12px] font-bold text-[#3B82F6] block">{s.step}</span>
                                <h3 className={`text-[15px] font-bold ${t.textMain}`}>{s.title}</h3>
                                <p className={`text-[15px] ${t.textSub} leading-relaxed break-keep`}>{s.desc}</p>
                              </div>
                            ))}
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

          {/* 원스트림 글로벌 사이드시트 */}
          {globalDrawer && globalDrawer.isOpen && (
            <div className="fixed inset-0 z-[400] flex justify-end bg-black/50 pointer-events-auto">
              <div
                className={`w-full max-w-[480px] h-full flex flex-col border-l ${
                  isDarkMode ? 'bg-[#101216] border-[#262A32] text-white' : 'bg-white border-[#E5E8EB] text-[#191F28]'
                }`}
              >
                <div className={`p-4 border-b ${t.border} flex justify-between items-center shrink-0`}>
                  <span className="font-bold text-[15px]">
                    {globalDrawer.type === 'prayerBox' ? '나의 기도 보관함' : '적용 질문 트래커'}
                  </span>
                  <button
                    onClick={closeGlobalDrawer}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${t.btnSecondary} cursor-pointer`}
                  >
                    닫기
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  {globalDrawer.type === 'prayerBox' && (
                    <PrayerBox
                      t={t}
                      isDarkMode={isDarkMode}
                      setActiveScreen={setActiveScreen}
                      isSidebarOpen={false}
                      setIsSidebarOpen={() => {}}
                      SubPageHeader={SubPageHeader}
                      globalPrayers={globalPrayers}
                      globalIntercessions={globalIntercessions}
                      openModal={openModal}
                      getArr={getArr}
                      authUser={authUser}
                    />
                  )}
                  {globalDrawer.type === 'applyTracker' && (
                    <ApplyTracker
                      t={t}
                      isDarkMode={isDarkMode}
                      setActiveScreen={setActiveScreen}
                      isSidebarOpen={false}
                      setIsSidebarOpen={() => {}}
                      SubPageHeader={SubPageHeader}
                      getArr={getArr}
                    />
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

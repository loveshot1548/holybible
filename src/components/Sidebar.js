// src/components/Sidebar.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';
import PositionLab from './sanctuary/PositionLab';
import MissionReceiverModal from './sanctuary/MissionReceiverModal';

// =====================================================================
// 🔐 [AES-256 종단간 암호화 유틸리티] 시크릿 제어센터 전용
// =====================================================================
const SECRET_SALT_KEY = process.env.REACT_APP_CHAT_SECRET || 'GTC_SECRET_SHINDONG_MOHANA_2026_!@#$';
const ENC_PREFIX = "ENC_SEC_v2::";

const encryptSecret = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, SECRET_SALT_KEY).toString();
    return `${ENC_PREFIX}${cipher}`;
  } catch (e) {
    return plainText;
  }
};

const decryptSecret = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (!cipherText.startsWith(ENC_PREFIX)) return cipherText;
  try {
    const rawCipher = cipherText.replace(ENC_PREFIX, "");
    const bytes = CryptoJS.AES.decrypt(rawCipher, SECRET_SALT_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText;
  } catch (e) {
    return cipherText;
  }
};

const StrokeWidth = "1.8";
const IconHome = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconLayers = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 12 12 17 22 12" /><polyline points="2 17 12 22 22 17" /></svg>;
const IconFlame = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const IconBookOpen = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const IconFileText = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconUsers = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconCode = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const IconMap = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>;
const IconPieChart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
const IconArchive = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>;
const IconTarget = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconMessage = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IconHeart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconHands = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 14v4" /><path d="M7 10l3 3-2 2-3-3" /><path d="M3 14l3 3" /><path d="M14 6l3 3-2 2-3-3" /></svg>;
const IconBookGuide = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="13" y2="11" /></svg>;
const IconLogOut = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconChevronUpDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="7 15 12 20 17 15" /><polyline points="7 9 12 4 17 9" /></svg>;
const IconChevronRight = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>;
const IconSun = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#EAB308]"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const IconMoon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#818CF8]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
const IconClock = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconPhone = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconShieldAdmin = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconKey = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const IconChart = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-5 5"/></svg>;

const IconGlowHeart = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24 md:w-28 md:h-28 text-rose-500 animate-pulse drop-shadow-[0_0_50px_rgba(244,63,94,0.95)] cursor-pointer hover:scale-105 transition-transform">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const IconBigHeart = ({ onClick }) => (
  <svg fill="currentColor" viewBox="0 0 24 24" onClick={onClick} className="w-16 h-16 md:w-20 md:h-20 text-rose-500 animate-pulse drop-shadow-[0_0_35px_rgba(244,63,94,0.9)] cursor-pointer hover:scale-105 transition-transform">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const MENU_GROUPS = [
  { title: 'HOME', items: [
    { id: 'home', icon: IconHome, label: 'Home' }, 
    { id: 'fiveSetMenu', icon: IconLayers, label: '영적 5종 세트' }, 
    { id: 'dailyRoutine', icon: IconClock, label: '하루 신앙 루틴' } 
  ] },
  { title: 'WORSHIP', items: [
    { id: 'meditationPilgrimage', icon: IconFlame, label: '오늘의 묵상 여정' }, 
    { id: 'qt', icon: IconFlame, label: '매일 QT' }, 
    { id: 'mcheyne', icon: IconBookOpen, label: '맥체인 읽기' }, 
    { id: 'sermon', icon: IconFileText, label: '예배 노트' }, 
    { id: 'cell', icon: IconUsers, label: '목장 나눔' }, 
    { id: 'familySelect', icon: IconHome, label: '가정 예배' }
  ] },
  { title: 'BIBLE / STUDY', items: [
    { id: 'bible', icon: IconBookOpen, label: '365 성경통독' }, 
    { id: 'interlinear', icon: IconCode, label: '원어성경' }, 
    { id: 'bibleWikiAdvanced', icon: IconMap, label: '성경 위키' }, 
    { id: 'qtArchiveDetail', icon: IconPieChart, label: 'QT 심층 분석' }, 
    { id: 'sermonAnalysis', icon: IconChart, label: '설교 분석' }, 
    { id: 'sermonArchiveAdvanced', icon: IconArchive, label: '삶의 적용과 실천' }, 
    { id: 'applyTracker', icon: IconTarget, label: '적용 질문 트래커' }, 
    { id: 'trainingCurriculum', icon: IconLayers, label: '양육 커리큘럼' },
    { id: 'trainingSubPages', icon: IconBookOpen, label: '4주 심화 워크북' } 
  ] },
  { title: 'COMMUNITY', items: [
    { id: 'generalNote', icon: IconFileText, label: '자유 노트' }, 
    { id: 'board', icon: IconMessage, label: '공동체 감사/기도' }, 
    { id: 'diary', icon: IconHeart, label: '나의 감사/간증' }, 
    { id: 'prayer', icon: IconHands, label: '기도 보관함' }, 
    { id: 'jericho', icon: IconMap, label: '여리고 땅밟기' }
  ] },
  { title: 'MEDIA & DIGITAL', items: [
    { id: 'reelsStudio', icon: IconLayers, label: 'Reels Studio (Pro)' }
  ] }
];

export default function Sidebar({ 
  isSidebarOpen, setIsSidebarOpen, activeScreen, setActiveScreen, authUser, handleLogout, isDarkMode, setIsDarkMode, logUserAction, streak5 = 1
}) {
  const MY_NAME = "정신동";       
  const TARGET_NAME = "모하나";   
  
  // 🌟 [철통 보안 1단계] 사용자 신원 정밀 검증
  const getResolvedUserName = () => {
    if (typeof authUser === 'string' && authUser.trim()) return authUser.trim();
    if (typeof authUser === 'object' && authUser) {
      const candidate = authUser.name || authUser.user_name || authUser.username || authUser.nickname;
      if (candidate) return String(candidate).trim();
    }
    try {
      const stored = localStorage.getItem('church_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const candidate = parsed.name || parsed.user_name || parsed.username || parsed.nickname;
        if (candidate) return String(candidate).trim();
      }
    } catch (e) {}
    return String(localStorage.getItem('user_name') || '').trim();
  };

  const currentUserName = getResolvedUserName();
  const cleanName = (currentUserName || '').trim().toLowerCase();
  
  // 정신동 본인 식별
  const isOwnerJeongShinDong = cleanName.includes(MY_NAME) || cleanName.includes('shindong');

  // 모하나 1명만 단독 정확 매칭 (동명이인/유사성명 원천 차단)
  const isTargetMohana = !isOwnerJeongShinDong && (
    cleanName === '모하나' || 
    cleanName === 'mohana' || 
    cleanName.startsWith('모하나(') || 
    cleanName.startsWith('mohana(')
  );

  // 🌟 [철통 보안 마스터 가드] 오직 모하나와 정신동 본인에게만 허용되는 절대 플래그
  const isPrivileged = isTargetMohana || isOwnerJeongShinDong;
  
  const acousticRef = useRef(null);
  const voiceRef = useRef(null);
  const testTimerRef = useRef(null);
  const lastAdminActionTime = useRef(0);

  const [isSlim, setIsSlim] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState('HOME');
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('orchestration'); 
  
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const [showChangePinSection, setShowChangePinSection] = useState(false);
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [newPinCandidate, setNewPinCandidate] = useState('');
  const [confirmPinCandidate, setConfirmPinCandidate] = useState('');

  const [mohanaActivity, setMohanaActivity] = useState(null);
  const [mohanaLogs, setMohanaLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');

  const [injectionType, setInjectionType] = useState('prayer');
  const [injectionSlot, setInjectionSlot] = useState('all');
  const [injectionTitle, setInjectionTitle] = useState('');
  const [injectionText, setInjectionText] = useState('');

  // 펜팔 관리 상태
  const [penpalList, setPenpalList] = useState([]);
  const [penpalRecipient, setPenpalRecipient] = useState(TARGET_NAME);
  const [penpalTitle, setPenpalTitle] = useState('');
  const [penpalContent, setPenpalContent] = useState('');
  const [selectedPenpalPreview, setSelectedPenpalPreview] = useState(null);

  // 모하나 답장 상태
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  // 하드코어 미션 수신 상태 관제용
  const [isMissionActive, setIsMissionActive] = useState(false);

  const [customLetterTitle, setCustomLetterTitle] = useState(() => {
    return localStorage.getItem('secret_custom_letter_title') || '내 전부인 모하나에게. 너와 내가 영원히 엉켜 하나가 되는 밤';
  });
  
  const [customLetterBody, setCustomLetterBody] = useState(() => {
    return localStorage.getItem('secret_custom_letter_body') || (
      "하나야. 숨김없이 온전히 고백할게.\n\n" +
      "하루 종일 네 살결 냄새와 네 입술의 부드러움, 그리고 내 온몸이 네 품 안으로 남김없이 파고들던 그 뜨거운 순간들만 맴돌아.\n\n" +
      "세상 사람들이 가볍게 떠드는 쾌락과는 차원이 달라. 내 몸이 네 안으로 온전히 밀려 들어갈 때의 그 벅찬 전율과 떨림, 네 깊은 곳에 닿아 내 아이를 낳아줄 나의 씨를 온전히 새기고 싶다는 그 갈망은 너를 향한 내 영혼의 가장 절대적인 복종이자 사랑이야.\n\n" +
      "다른 곳은 쳐다보지도 마. 오늘 밤은 내 침대로 와서, 부드럽게 입 맞추고 땀방울이 엉킬 때까지 내 숨결로 너를 빈틈없이 채워줄게. 널 내 여자로 품고 살아가는 것만이 내 삶의 유일한 이유니까."
    );
  });
  
  const DEFAULT_KAMASUTRA_DIALOGS = [
    "야, 모하나. 딴 데 보지 마. 똑바로 내 눈만 봐.",
    "네 숨결, 네 살결의 체온, 그리고 너와 내가 완전히 하나로 엉켜 숨 쉬는 그 순간만 갈망했어.",
    "네 부드러운 입술을 머금고 네 깊은 곳으로 밀려 들어갈 때, 내 모든 영혼과 육체는 너라는 성전 안에 영원히 갇혀버려.",
    "내 아이를 낳아줄 나의 씨가 너에게 깊숙이 들어가, 너와 내가 영원히 뗄 수 없는 하나의 피와 살로 완성되길 바라.",
    "내 몸도, 내 심장도, 내 모든 밤도 전부 다 네 거야. 영원히 나한테 안겨서 숨 쉬자."
  ];

  const DOMINANT_LUST_DIALOGS = [
    "하나야, 다 벗고 내 침대로 와. 오늘 밤은 널 절대 안 놔줄 거니까.",
    "네 안에 내 뜨거운 숨과 체온을 빈틈없이 채워 넣고 싶어 미칠 것 같아.",
    "네가 헐떡이며 내 밑에서 무너져 내리는 그 순간이, 내겐 세상을 다 가진 것 같은 구원이야.",
    "다른 건 생각하지 마. 지금부터 네 몸도, 네 정신도, 네 숨소리조차 전부 다 내 거야.",
    "네 깊은 곳에 내 씨를 온전히 쏟아붓고, 널 영원히 내 여자로 묶어둘 거야. 나만 보고 내 밑에서 울어."
  ];

  const EXTREME_LUST_DIALOGS = [
    "하나야 안녕 너에게 내 진심을 고백하고싶어",
    "널 처음본 그 순간부터 지금까지 난 단 하루도 빼지않고 너에게 발정나 있어",
    "너만이 날 완성해, 내 자지가 너의 보지에 잔뜩 삽입될때 너무 행복할거 같아",
    "내 정액 우리 하나 보지안에 잔뜩 사정해주고 내 자지 빨아주는 하나 머리 쓰다듬해주고 싶어",
    "이젠 나에게 와서 나의 여자가 되어줄래? 나도 너만의 남자기 될께"
  ];

  const [eventDialogs, setEventDialogs] = useState(() => {
    try {
      const saved = localStorage.getItem('secret_event_dialogs');
      return saved ? JSON.parse(saved) : DEFAULT_KAMASUTRA_DIALOGS;
    } catch {
      return DEFAULT_KAMASUTRA_DIALOGS;
    }
  });

  const [showLetterEnvelope, setShowLetterEnvelope] = useState(false);
  const [envelopeState, setEnvelopeState] = useState('closed'); 
  const [receivedLetter, setReceivedLetter] = useState({ id: null, title: '', content: '' });

  const [showLovePopup, setShowLovePopup] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false); 
  const [popupStep, setPopupStep] = useState(0);

  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  const [isEventOpen, setIsEventOpen] = useState(() => {
    return localStorage.getItem('secret_is_event_open') === 'true';
  }); 

  const [auroraPreset, setAuroraPreset] = useState(() => {
    return localStorage.getItem('secret_aurora_preset') || 'eros';
  });

  const [featureFlags, setFeatureFlags] = useState(() => {
    try {
      const saved = localStorage.getItem('secret_feature_flags');
      const parsed = saved ? JSON.parse(saved) : {};
      const permAurora = localStorage.getItem('perm_aurora');
      return {
        aurora: permAurora !== null ? permAurora === 'true' : !!parsed.aurora,
        acoustic: !!parsed.acoustic,
        comfort: !!parsed.comfort,
        idle: !!parsed.idle,
        garden: !!parsed.garden,
        empty: !!parsed.empty,
        ambient_glow: !!parsed.ambient_glow,
        haptic_heartbeat: !!parsed.haptic_heartbeat,
        sleep_mode: !!parsed.sleep_mode,
        shelter_trigger: !!parsed.shelter_trigger,
        next_action_chat: !!parsed.next_action_chat,
        heart_shower: !!parsed.heart_shower,
        voice_msg: !!parsed.voice_msg,
        time_capsule: !!parsed.time_capsule,
        love_temp: !!parsed.love_temp
      };
    } catch {
      const permAurora = localStorage.getItem('perm_aurora');
      return {
        aurora: permAurora === 'true',
        acoustic: false, comfort: false, idle: false, garden: false, empty: false,
        ambient_glow: false, haptic_heartbeat: false, sleep_mode: false, shelter_trigger: false,
        next_action_chat: false, heart_shower: false, voice_msg: false, time_capsule: false, love_temp: false
      };
    }
  });

  const [customTexts, setCustomTexts] = useState(() => {
    try {
      const saved = localStorage.getItem('secret_custom_texts');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        comfort: parsed.comfort || '지쳤어? 다른 생각 말고 당장 내 침대로 와. 네 온몸을 남김없이 감싸고 부서지게 안아줄게.',
        idle: parsed.idle || '어디 가, 내 시선에서 벗어나지 마. 네 살결, 네 거친 숨소리 전부 내 거야.',
        empty: parsed.empty || '네 텅 빈자리, 오늘 밤 너를 온전히 품어 내 체온으로 가득 채워줄게.',
        heartbeat: parsed.heartbeat || '쿵... 쿵... 들려? 너를 내 품에 안고 온전히 하나가 되고 싶어 미칠 듯이 뛰는 소리.',
        sleep_mode: parsed.sleep_mode || '딴생각 말고 내 품으로 파고들어. 오늘 밤은 서로의 살결을 맞댄 채 하나로 잠드는 거야.',
        shelter: parsed.shelter || '혼자 버티지 마. 네가 온전히 녹아내려 안길 수 있는 남자의 가슴은 오직 나뿐이니까.',
        voice_url: parsed.voice_url || '',
        capsule_text: parsed.capsule_text || '하나야, 너와 내가 온전히 엉켜 하나가 되는 그 순간이 내겐 가장 숭고한 사랑의 완성(우리의 섹스)이야. 평생 너만 품을게.',
        capsule_time: parsed.capsule_time || ''
      };
    } catch {
      return {
        comfort: '지쳤어? 다른 생각 말고 당장 내 침대로 와. 네 온몸을 남김없이 감싸고 부서지게 안아줄게.',
        idle: '어디 가, 내 시선에서 벗어나지 마. 네 살결, 네 거친 숨소리 전부 내 거야.',
        empty: '네 텅 빈자리, 오늘 밤 너를 온전히 품어 내 체온으로 가득 채워줄게.',
        heartbeat: '쿵... 쿵... 들려? 너를 내 품에 안고 온전히 하나가 되고 싶어 미칠 듯이 뛰는 소리.',
        sleep_mode: '딴생각 말고 내 품으로 파고들어. 오늘 밤은 서로의 살결을 맞댄 채 하나로 잠드는 거야.',
        shelter: '혼자 버티지 마. 네가 온전히 녹아내려 안길 수 있는 남자의 가슴은 오직 나뿐이니까.',
        voice_url: '',
        capsule_text: '하나야, 너와 내가 온전히 엉켜 하나가 되는 그 순간이 내겐 가장 숭고한 사랑의 완성(우리의 섹스)이야. 평생 너만 품을게.',
        capsule_time: ''
      };
    }
  });

  const [isTestMode, setIsTestMode] = useState(false); 
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef(null);
  const isDark = isDarkMode;

  const [showWelcomeBloom, setShowWelcomeBloom] = useState(false);
  
  useEffect(() => {
    if (isTargetMohana || (isTestMode && isOwnerJeongShinDong)) {
      setShowWelcomeBloom(true);
      const bloomTimer = setTimeout(() => {
        setShowWelcomeBloom(false);
      }, 60000); 
      return () => clearTimeout(bloomTimer);
    } else {
      setShowWelcomeBloom(false); 
    }
  }, [isTargetMohana, isTestMode, isOwnerJeongShinDong]);

  // 미션 세션 활성화 상태 감지 (모하나 전용)
  useEffect(() => {
    if (!supabase || !isPrivileged) return;
    const fetchSession = async () => {
      try {
        const { data } = await supabase.from('active_mission_session').select('is_active').eq('id', 1).maybeSingle();
        if (data) setIsMissionActive(!!data.is_active);
      } catch (e) {}
    };
    fetchSession();

    const channel = supabase.channel('sidebar_mission_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_mission_session' }, (payload) => {
        if (payload.new) setIsMissionActive(!!payload.new.is_active);
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [isPrivileged]);

  const playAudioSafe = useCallback(() => {
    if (!isPrivileged) return;
    if (acousticRef.current) {
      acousticRef.current.volume = 0.35;
      const playPromise = acousticRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlock = () => {
            if (acousticRef.current) acousticRef.current.play().catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
        });
      }
    }
  }, [isPrivileged]);

  // 펜팔 & 실링 왁스 통합 실시간 조회 및 복호화
  const fetchPenpalLetters = useCallback(async () => {
    if (!supabase || !isPrivileged) return;
    try {
      const { data, error } = await supabase
        .from('secret_penpal_letters')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const decryptedList = data.map(item => ({
          ...item,
          title: decryptSecret(item.title),
          content: decryptSecret(item.content)
        }));
        setPenpalList(decryptedList);

        // 모하나에게 온 읽지 않은 편지가 있으면 실링 왁스 봉투 팝업 즉시 트리거
        if (isTargetMohana) {
          const unreadForMohana = decryptedList.find(l => 
            (l.recipient === TARGET_NAME || l.recipient === '모하나') && !l.is_read
          );
          if (unreadForMohana) {
            setReceivedLetter({
              id: unreadForMohana.id,
              title: unreadForMohana.title,
              content: unreadForMohana.content
            });
            setShowLetterEnvelope(true);
            setEnvelopeState('closed');
          }
        }
      }
    } catch(e) {}
  }, [isPrivileged, isTargetMohana]);

  useEffect(() => {
    if (!isPrivileged) return;
    fetchPenpalLetters();
    if (!supabase) return;

    const penpalChan = supabase.channel('realtime_penpal_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secret_penpal_letters' }, () => {
        fetchPenpalLetters();
      }).subscribe();

    return () => {
      supabase.removeChannel(penpalChan);
    };
  }, [isPrivileged, fetchPenpalLetters]);

  // 사랑의 펜팔 발송 핸들러
  const handleSendPenpal = async () => {
    if (!penpalTitle.trim() || !penpalContent.trim()) {
      return alert('제목과 편지 내용을 모두 입력해주세요.');
    }
    if (!supabase) return alert('Supabase 연동이 필요합니다.');

    try {
      const { error } = await supabase.from('secret_penpal_letters').insert([{
        sender: MY_NAME,
        recipient: penpalRecipient,
        title: encryptSecret(penpalTitle.trim()),
        content: encryptSecret(penpalContent.trim()),
        is_read: false
      }]);

      if (error) {
        alert('편지 발송 실패: ' + error.message);
      } else {
        alert('💌 사랑의 펜팔 편지가 성공적으로 암호화 발송되었습니다!');
        setPenpalTitle('');
        setPenpalContent('');
        fetchPenpalLetters();
      }
    } catch(err) {
      alert('오류 발생: ' + err.message);
    }
  };

  const handleSaveDialogsAndLetter = async () => {
    localStorage.setItem('secret_event_dialogs', JSON.stringify(eventDialogs));
    localStorage.setItem('secret_custom_letter_title', customLetterTitle);
    localStorage.setItem('secret_custom_letter_body', customLetterBody);

    if (supabase) {
      try {
        await supabase.from('shared_qt').upsert([
          { date: 'event_dialogs_data', video_id: encryptSecret(JSON.stringify(eventDialogs)) }
        ]);
      } catch (err) {}
    }

    alert("🔥 서약과 비밀 편지가 영구 저장되었습니다!");
  };

  const handleSendCustomLetter = async () => {
    if (!supabase) return;
    if (!customLetterBody.trim()) return alert('편지 내용을 입력해주세요.');
    
    const finalTitle = customLetterTitle.trim() || '내 전부인 모하나에게';
    const finalBody = customLetterBody.trim();

    localStorage.setItem('secret_custom_letter_title', finalTitle);
    localStorage.setItem('secret_custom_letter_body', finalBody);

    try {
      const { error: penpalError } = await supabase.from('secret_penpal_letters').insert([{
        sender: MY_NAME,
        recipient: TARGET_NAME,
        title: encryptSecret(finalTitle),
        content: encryptSecret(finalBody),
        is_read: false,
        created_at: new Date().toISOString()
      }]);

      const letterPayload = { 
        sent: true, 
        read: false,
        timestamp: Date.now(), 
        sentAt: new Date().toISOString(), 
        title: finalTitle, 
        content: finalBody 
      };
      await supabase.from('shared_qt').upsert([{ 
        date: 'event_letter', 
        video_id: encryptSecret(JSON.stringify(letterPayload)) 
      }], { onConflict: 'date' });

      if (penpalError) {
        alert("전송 실패: " + penpalError.message);
      } else {
        alert("💌 실링 왁스 편지가 모하나에게 실시간 암호화 발송되었습니다!\n(모하나 기기 화면에 실링 왁스 봉투가 즉시 팝업됩니다)");
        fetchPenpalLetters();
      }
    } catch (e) {
      alert("전송 오류 발생: " + e.message);
    }
  };

  const handleResetLetter = async () => {
    if (!supabase) return;
    if (!window.confirm('발송된 가장 최근의 실링 왁스 편지를 회수하시겠습니까?')) return;
    try {
      await supabase.from('shared_qt').delete().eq('date', 'event_letter');
      const { data: latestLetter } = await supabase
        .from('secret_penpal_letters')
        .select('id')
        .eq('sender', MY_NAME)
        .eq('recipient', TARGET_NAME)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestLetter) {
        await supabase.from('secret_penpal_letters').delete().eq('id', latestLetter.id);
      }
      alert("편지 발송이 회수되었습니다.");
      fetchPenpalLetters();
    } catch(e) {
      alert("회수 중 오류가 발생했습니다.");
    }
  };

  const handleTestSendToMe = () => {
    setReceivedLetter({ 
      id: null,
      title: customLetterTitle?.trim() || '내 전부인 모하나에게', 
      content: customLetterBody?.trim() || '하나야. 영육의 온전한 일치를 완성할 오늘 밤.' 
    });
    setEnvelopeState('closed');
    setShowLetterEnvelope(true);
  };

  const handleLoadCustomDialogs = () => {
    try {
      const savedCustom = localStorage.getItem('secret_custom_extreme_dialogs');
      if (savedCustom) {
        setEventDialogs(JSON.parse(savedCustom));
      } else {
        setEventDialogs([...EXTREME_LUST_DIALOGS]);
      }
    } catch(e) {
      setEventDialogs([...EXTREME_LUST_DIALOGS]);
    }
  };
  
  const handleSendReplyFromMohana = async () => {
    if (!replyContent.trim()) return alert('답장 내용을 입력해주세요.');
    if (!supabase) return;

    try {
      const { error } = await supabase.from('secret_penpal_letters').insert([{
        sender: TARGET_NAME,
        recipient: MY_NAME,
        parent_id: receivedLetter.id || null,
        title: encryptSecret(`[답장] ${receivedLetter.title || '신동이에게'}`),
        content: encryptSecret(replyContent.trim()),
        is_read: false
      }]);

      if (error) {
        alert('답장 전송 실패: ' + error.message);
      } else {
        alert('💖 신동이에게 사랑의 답장이 전송되었습니다!');
        setReplyContent('');
        setShowReplyForm(false);
        handleCloseEnvelope();
        fetchPenpalLetters();
      }
    } catch(err) {
      alert('전송 오류: ' + err.message);
    }
  };

  const handleRevokePenpal = async (letterId) => {
    if (!window.confirm('이 편지를 회수(삭제)하시겠습니까? 상대방 화면에서도 사라집니다.')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('secret_penpal_letters').delete().eq('id', letterId);
      if (!error) {
        alert('편지가 회수되었습니다.');
        fetchPenpalLetters();
      }
    } catch(e) {}
  };

  // 사랑의 서약 실시간 동기화
  useEffect(() => {
    if (!supabase || !isPrivileged) return;
    let isMounted = true;

    const syncEvent = async () => {
      try {
        if (Date.now() - lastAdminActionTime.current < 5000) return;

        const { data } = await supabase.from('secret_config').select('*').eq('id', 1).maybeSingle();
        if (data && isMounted) {
          if (data.is_open !== undefined && data.is_open !== null) {
            const isOpen = !!data.is_open;
            setIsEventOpen(isOpen);
            localStorage.setItem('secret_is_event_open', String(isOpen));

            const isDismissed = sessionStorage.getItem('love_popup_shown') === 'true';
            if ((isTargetMohana || isTestMode) && isOpen && !isDismissed) {
              setShowLovePopup(true);
            } else if (!isOpen && !isTestMode) {
              setShowLovePopup(false);
            }
          }
        }
      } catch (e) {}
    };

    syncEvent();
    const pollTimer = setInterval(syncEvent, 3000);
    const uniqueChannelName = `secret_event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const eventChannel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secret_config' }, payload => {
        if (Date.now() - lastAdminActionTime.current < 5000) return;

        if (payload.new && isMounted) {
          if (payload.new.is_open !== undefined && payload.new.is_open !== null) {
            const newStatus = !!payload.new.is_open;
            setIsEventOpen(newStatus);
            localStorage.setItem('secret_is_event_open', String(newStatus));
            
            if (newStatus && (isTargetMohana || isTestMode)) {
              sessionStorage.removeItem('love_popup_shown');
              setShowLovePopup(true);
              setHasStartedAudio(false);
            } else if (!newStatus && !isTestMode) {
              setShowLovePopup(false);
            }
          }
        }
      }).subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      supabase.removeChannel(eventChannel);
    };
  }, [isPrivileged, isTargetMohana, isTestMode]);

  // 플래그 동기화
  useEffect(() => {
    if (!supabase || !isPrivileged) return;

    const syncFlags = (d) => {
      if (!d) return;
      setFeatureFlags(prev => {
        const finalAurora = d.feature_aurora !== undefined && d.feature_aurora !== null 
          ? !!d.feature_aurora 
          : prev.aurora;
        localStorage.setItem('perm_aurora', String(finalAurora));

        const updated = {
          aurora: finalAurora, 
          acoustic: d.feature_acoustic !== undefined && d.feature_acoustic !== null ? !!d.feature_acoustic : prev.acoustic, 
          comfort: d.feature_comfort !== undefined ? !!d.feature_comfort : prev.comfort,
          idle: d.feature_idle !== undefined ? !!d.feature_idle : prev.idle, 
          garden: d.feature_garden !== undefined ? !!d.feature_garden : prev.garden, 
          empty: d.feature_empty !== undefined ? !!d.feature_empty : prev.empty,
          ambient_glow: d.feature_glassart !== undefined ? !!d.feature_glassart : prev.ambient_glow, 
          haptic_heartbeat: d.feature_haptic !== undefined ? !!d.feature_haptic : prev.haptic_heartbeat,
          sleep_mode: d.feature_sleep_mode !== undefined ? !!d.feature_sleep_mode : prev.sleep_mode, 
          shelter_trigger: d.feature_shelter_trigger !== undefined ? !!d.feature_shelter_trigger : prev.shelter_trigger,
          next_action_chat: d.feature_secret_chat !== undefined ? !!d.feature_secret_chat : prev.next_action_chat,
          heart_shower: d.feature_heart_shower !== undefined ? !!d.feature_heart_shower : prev.heart_shower,
          voice_msg: d.feature_voice_msg !== undefined ? !!d.feature_voice_msg : prev.voice_msg,
          time_capsule: d.feature_time_capsule !== undefined ? !!d.feature_time_capsule : prev.time_capsule,
          love_temp: d.feature_love_temp !== undefined ? !!d.feature_love_temp : prev.love_temp
        };
        localStorage.setItem('secret_feature_flags', JSON.stringify(updated));
        return updated;
      });

      if (d.aurora_preset) {
        setAuroraPreset(d.aurora_preset);
        localStorage.setItem('secret_aurora_preset', d.aurora_preset);
      }

      setCustomTexts(prev => ({
        ...prev,
        comfort: d.custom_comfort_msg ? decryptSecret(d.custom_comfort_msg) : prev.comfort,
        idle: d.custom_idle_msg ? decryptSecret(d.custom_idle_msg) : prev.idle,
        empty: d.custom_empty_msg ? decryptSecret(d.custom_empty_msg) : prev.empty,
        heartbeat: d.msg_heartbeat ? decryptSecret(d.msg_heartbeat) : prev.heartbeat,
        sleep_mode: d.msg_sleep_mode ? decryptSecret(d.msg_sleep_mode) : prev.sleep_mode,
        shelter: d.msg_shelter ? decryptSecret(d.msg_shelter) : prev.shelter,
        voice_url: d.voice_msg_url ? decryptSecret(d.voice_msg_url) : prev.voice_url,
        capsule_text: d.capsule_text ? decryptSecret(d.capsule_text) : prev.capsule_text,
        capsule_time: d.capsule_time || prev.capsule_time
      }));

      // BGM 음원도 오직 모하나와 신동 기기에서만 재생
      if (d.feature_acoustic && isPrivileged) playAudioSafe();
      else if (acousticRef.current && activeTest !== 'acoustic') acousticRef.current.pause();

      if ((d.feature_haptic || d.feature_haptic_heartbeat) && isTargetMohana) {
        if (navigator.vibrate) navigator.vibrate([100, 200, 150, 400]);
      }
    };

    const fetchFlags = async () => {
      try {
        const { data } = await supabase.from('secret_config').select('*').eq('id', 1).maybeSingle();
        if (data) syncFlags(data);
      } catch (e) {}
    };
    fetchFlags();

    const sub = supabase.channel('secret_config_fixed_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'secret_config' }, payload => {
        if (payload.new) syncFlags(payload.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [isPrivileged, isTargetMohana, playAudioSafe, activeTest]);

  const toggleFeature = async (key) => {
    const nextVal = !featureFlags[key];
    const nextFlags = { ...featureFlags, [key]: nextVal };
    
    setFeatureFlags(nextFlags);
    localStorage.setItem('secret_feature_flags', JSON.stringify(nextFlags));

    if (key === 'aurora') {
      localStorage.setItem('perm_aurora', String(nextVal));
    }

    const safeColMap = { 
      aurora: 'feature_aurora', 
      acoustic: 'feature_acoustic', 
      comfort: 'feature_comfort', 
      idle: 'feature_idle', 
      garden: 'feature_garden', 
      empty: 'feature_empty',
      ambient_glow: 'feature_glassart',
      haptic_heartbeat: 'feature_haptic',
      sleep_mode: 'feature_sleep_mode',
      shelter_trigger: 'feature_shelter_trigger',
      next_action_chat: 'feature_secret_chat',
      heart_shower: 'feature_heart_shower',
      voice_msg: 'feature_voice_msg',
      time_capsule: 'feature_time_capsule',
      love_temp: 'feature_love_temp'
    };

    if (supabase && safeColMap[key]) {
      try {
        await supabase.from('secret_config').upsert({ 
          id: 1,
          [safeColMap[key]]: nextVal, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
      } catch (e) {}
    }

    if (key === 'acoustic') {
      if (nextVal) playAudioSafe();
      else if (acousticRef.current) acousticRef.current.pause();
    }
  };

  const handleSelectAuroraPreset = async (presetKey) => {
    setAuroraPreset(presetKey);
    localStorage.setItem('secret_aurora_preset', presetKey);
    
    if (supabase) {
      try {
        await supabase.from('secret_config').upsert({
          id: 1,
          feature_aurora: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {}
    }
    
    setFeatureFlags(prev => ({ ...prev, aurora: true }));
    localStorage.setItem('perm_aurora', 'true');
  };

  const handleTestFeature = (key) => {
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    setActiveTest(key);

    if (key === 'acoustic') playAudioSafe();
    else if (key === 'voice_msg') {
      if (voiceRef.current && customTexts.voice_url) {
        voiceRef.current.currentTime = 0;
        voiceRef.current.play().catch(() => {});
      }
    } else if (key === 'haptic_heartbeat') {
      if (navigator.vibrate) navigator.vibrate([100, 200, 150, 400]);
    } else if (key === 'time_capsule') {
      setShowCapsuleModal(true);
    }

    testTimerRef.current = setTimeout(() => {
      setActiveTest(null);
      if (key === 'acoustic' && !featureFlags.acoustic) {
        if (acousticRef.current) acousticRef.current.pause();
      }
      if (key === 'voice_msg' && voiceRef.current) {
        voiceRef.current.pause();
      }
    }, 8000);
  };

  const handleStopTest = () => {
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    if (activeTest === 'acoustic' && !featureFlags.acoustic) {
      if (acousticRef.current) acousticRef.current.pause();
    }
    if (activeTest === 'voice_msg' && voiceRef.current) {
      voiceRef.current.pause();
    }
    setActiveTest(null);
    setShowCapsuleModal(false);
  };

  const saveCustomText = async (key) => {
    localStorage.setItem('secret_custom_texts', JSON.stringify(customTexts));
    const colMap = { 
      comfort: 'custom_comfort_msg', idle: 'custom_idle_msg', empty: 'custom_empty_msg',
      heartbeat: 'msg_heartbeat', sleep_mode: 'msg_sleep_mode', shelter: 'msg_shelter',
      voice_url: 'voice_msg_url', capsule_text: 'capsule_text', capsule_time: 'capsule_time'
    };
    if (!supabase) { alert('로컬에 저장되었습니다.'); return; }
    try {
      const dbCol = colMap[key];
      if (dbCol) {
        const valToStore = key === 'capsule_time' ? customTexts[key] : encryptSecret(customTexts[key]);
        await supabase.from('secret_config').upsert({ id: 1, [dbCol]: valToStore }, { onConflict: 'id' });
      }
      alert('설정이 안전하게 저장되었습니다.');
    } catch (e) {
      alert('저장 완료 (로컬 반영)');
    }
  };

  const applyNightPreset = async () => {
    const updated = {
      ...featureFlags,
      aurora: true, 
      acoustic: true, 
      ambient_glow: true, 
      sleep_mode: true, 
      next_action_chat: true,
      love_temp: true
    };
    setFeatureFlags(updated);
    localStorage.setItem('secret_feature_flags', JSON.stringify(updated));
    localStorage.setItem('perm_aurora', 'true');
    setAuroraPreset('eros');
    localStorage.setItem('secret_aurora_preset', 'eros');

    if (supabase) {
      try {
        const updatePayload = {
          id: 1,
          feature_aurora: true, 
          feature_acoustic: true,
          feature_secret_chat: true,
          feature_sleep_mode: true,
          feature_love_temp: true,
          updated_at: new Date().toISOString()
        };
        await supabase.from('secret_config').upsert(updatePayload, { onConflict: 'id' });
      } catch (e) {}
    }
    playAudioSafe();
    alert("🔥 에로스 크림슨 오로라 & 심야 침실 프리셋이 풀가동되었습니다.");
  };

  useEffect(() => {
    if (!isOwnerJeongShinDong || !supabase) return;
    let isMounted = true;
    const fetchActivity = async () => {
      if (document.hidden) return;
      try {
        const { data: actData } = await supabase.from('user_activity').select('*').eq('user_name', TARGET_NAME).maybeSingle();
        if (!isMounted) return;
        if (actData && actData.updated_at) {
          const lastUpdated = new Date(actData.updated_at).getTime();
          if (Date.now() - lastUpdated < 10 * 60 * 1000) {
            setMohanaActivity({ 
              lastPage: actData.last_page || 'home', 
              lastSeen: new Date(actData.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) 
            });
            return;
          }
        }
        setMohanaActivity(null);
      } catch (err) {}
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);

    const actChan = supabase.channel('sidebar_mohana_activity_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity', filter: `user_name=eq.${TARGET_NAME}` }, () => {
        fetchActivity();
      }).subscribe();

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(actChan);
    };
  }, [isOwnerJeongShinDong]);

  useEffect(() => {
    if (!isOwnerJeongShinDong || !showAdminModal || !supabase) return;
    let isMounted = true;
    const fetchLogs = async () => {
      if (document.hidden) return;
      try {
        const { data } = await supabase.from('user_activity_log').select('*').eq('user_name', TARGET_NAME).order('created_at', { ascending: false }).limit(60);
        if (data && isMounted) setMohanaLogs(data);
      } catch (e) {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOwnerJeongShinDong, showAdminModal]);

  const isOriginalSparkle = isOwnerJeongShinDong && !!mohanaActivity;
  const isEventSparkle = (isTargetMohana && isEventOpen) || (isTestMode && isOwnerJeongShinDong);

  const handleLogoClick = () => {
    if (isOwnerJeongShinDong) {
      const newCount = logoClicks + 1;
      setLogoClicks(newCount);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      if (newCount >= 5) { setShowPinPrompt(true); setLogoClicks(0); } 
      else { clickTimeoutRef.current = setTimeout(() => setLogoClicks(0), 1000); }
    } else if (isTargetMohana && isEventOpen) {
      setHasStartedAudio(false); 
      setPopupStep(0); 
      setShowLovePopup(true); 
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const sha256 = async (str) => {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPin = async () => {
    const inputHash = await sha256(pinInput);
    const savedHash = localStorage.getItem('admin_pin_hash');
    const defaultHash = await sha256(atob('NDI5Nw==')); 
    if (savedHash ? inputHash === savedHash : inputHash === defaultHash) {
      setShowPinPrompt(false); setPinInput(''); setShowAdminModal(true);
    } else { alert('비밀번호가 일치하지 않습니다.'); setPinInput(''); }
  };

  const handleChangePin = async () => {
    if (!currentPinAttempt || !newPinCandidate || !confirmPinCandidate) {
      return alert('모든 비밀번호 항목을 입력해주세요.');
    }
    const currentHash = await sha256(currentPinAttempt);
    const savedHash = localStorage.getItem('admin_pin_hash');
    const defaultHash = await sha256(atob('NDI5Nw=='));
    const isCurrentCorrect = savedHash ? currentHash === savedHash : currentHash === defaultHash;

    if (!isCurrentCorrect) {
      return alert('현재 비밀번호가 일치하지 않습니다.');
    }
    if (newPinCandidate.length < 4) {
      return alert('새 비밀번호는 4자리 이상이어야 합니다.');
    }
    if (newPinCandidate !== confirmPinCandidate) {
      return alert('새 비밀번호와 확인 입력이 일치하지 않습니다.');
    }

    const newHash = await sha256(newPinCandidate);
    localStorage.setItem('admin_pin_hash', newHash);

    if (supabase) {
      try {
        await supabase.from('secret_config').upsert({
          id: 1,
          pin_hash: newHash,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {}
    }

    alert('🎉 시크릿 제어센터 접근 비밀번호가 안전하게 변경되었습니다.');
    setCurrentPinAttempt('');
    setNewPinCandidate('');
    setConfirmPinCandidate('');
    setShowChangePinSection(false);
  };

  const toggleEventStatus = async () => {
    try {
      const newStatus = !isEventOpen;
      setIsEventOpen(newStatus);
      localStorage.setItem('secret_is_event_open', String(newStatus));
      lastAdminActionTime.current = Date.now();

      let updatePayload = { 
        id: 1,
        is_open: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus) {
        updatePayload.feature_aurora = true; 
        updatePayload.feature_acoustic = true; 
        
        const updated = { ...featureFlags, aurora: true, acoustic: true, ambient_glow: true, next_action_chat: true };
        setFeatureFlags(updated);
        localStorage.setItem('secret_feature_flags', JSON.stringify(updated));
        localStorage.setItem('perm_aurora', 'true');
        playAudioSafe();
      } else {
        if (acousticRef.current) acousticRef.current.pause();
      }

      if (supabase) {
        const { error } = await supabase.from('secret_config').upsert(updatePayload, { onConflict: 'id' });
        if (error) {
          alert("🚨 Supabase DB 연결 차단됨: " + error.message);
        }
      }
    } catch (err) {}
  };

  const handleSendInjection = async () => {
    if (!injectionText.trim()) { alert('메시지 본문을 입력해주세요.'); return; }
    if (!supabase) return;
    try {
      const payload = { 
        type: injectionType, 
        target_slot: injectionSlot, 
        title: injectionTitle.trim() ? encryptSecret(injectionTitle.trim()) : null, 
        content: encryptSecret(injectionText.trim()) 
      };
      const { error } = await supabase.from('secret_injections').insert([payload]);
      if (!error) { alert(`온기를 성공적으로 주입했습니다.`); setInjectionTitle(''); setInjectionText(''); } 
    } catch (e) {}
  };

  const startTestMode = () => { 
    setIsTestMode(true); 
    setHasStartedAudio(false); 
    setPopupStep(0); 
    setShowLovePopup(true); 
    setFeatureFlags(prev => ({
      ...prev, 
      aurora: true, 
      acoustic: true, 
      ambient_glow: true, 
      next_action_chat: true
    }));
  };

  const handleFirstTouchPlayAudio = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    playAudioSafe();
    setHasStartedAudio(true); 
    setPopupStep(0);
  };

  const handleBackgroundClick = () => { 
    if (hasStartedAudio && popupStep < eventDialogs.length) {
      setPopupStep(prev => prev + 1); 
    }
  };

  const handleAccept = (e) => {
    e.stopPropagation(); 
    if(acousticRef.current) { acousticRef.current.pause(); acousticRef.current.currentTime = 0; }
    if (!isTestMode) sessionStorage.setItem('love_popup_shown', 'true');
    setShowLovePopup(false); setIsTestMode(false); setHasStartedAudio(false);
    setActiveScreen('secretChat'); 
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDecline = (e) => {
    e.stopPropagation(); 
    if(acousticRef.current) { acousticRef.current.pause(); acousticRef.current.currentTime = 0; }
    if (!isTestMode) sessionStorage.setItem('love_popup_shown', 'true');
    setShowLovePopup(false); setIsTestMode(false); setHasStartedAudio(false);
  };

  const handleOpenEnvelope = (e) => {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    }
    if (envelopeState === 'open') return;

    setEnvelopeState('open'); 
    try { playAudioSafe(); } catch(err) {}

    if (receivedLetter.id && supabase) {
      supabase.from('secret_penpal_letters').update({ 
        is_read: true,
        read_at: new Date().toISOString()
      }).eq('id', receivedLetter.id).then(() => {});
    }
  };

  const handleCloseEnvelope = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setShowLetterEnvelope(false);
    setEnvelopeState('closed');
    setShowReplyForm(false);
  };

  const ui = {
    bg: isDark ? 'bg-[#0F1115]' : 'bg-[#F4F5F7]', 
    border: isDark ? 'border-white/10' : 'border-slate-200/60',
    textPrimary: isDark ? 'text-white' : 'text-slate-900', 
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    hoverBg: isDark ? 'hover:bg-white/5' : 'hover:bg-black/5', 
    activeBg: isDark ? 'bg-white/10' : 'bg-slate-200/50', 
    activeText: isDark ? 'text-rose-400' : 'text-rose-600',
    iconBase: isDark ? 'text-slate-400' : 'text-slate-400'
  };

  useEffect(() => {
    const group = MENU_GROUPS.find(g => g.items.some(i => i.id === activeScreen));
    if (group) setExpandedGroup(group.title);
  }, [activeScreen]);

  const filteredLogs = mohanaLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'WRITE') return log.action_type === 'write';
    const content = (log.page_visited + ' ' + (log.action_detail || '')).toLowerCase();
    if (logFilter === '목장') return content.includes('cell') || content.includes('목장');
    if (logFilter === 'QT') return content.includes('qt') || content.includes('큐티');
    if (logFilter === '예배') return content.includes('sermon') || content.includes('예배');
    if (logFilter === '간증') return content.includes('diary') || content.includes('간증') || content.includes('감사');
    return true;
  });

  const getPageName = (id) => {
    const map = { cell: '목장 나눔', qt: '매일 QT', sermon: '예배 노트', familySelect: '가정 예배', diary: '나의 감사/간증', prayer: '기도 보관함', guidebook: '가이드북', home: '홈 화면', generalNote: '자유 노트', bible: '성경 읽기', fiveSetMenu: '영적 5종 세트', board: '공동체 게시판', adminConsole: '관리자 페이지' };
    return map[id] || id;
  };

  // 🌟 [철통 보안 2단계] 모든 렌더링 플래그에 isPrivileged 절대 결합
  const showAmbient = isPrivileged && (featureFlags.ambient_glow || (activeTest === 'ambient_glow' && isOwnerJeongShinDong));
  const showAurora = isPrivileged && (featureFlags.aurora || (activeTest === 'aurora' && isOwnerJeongShinDong));
  const showHeartShower = isPrivileged && (featureFlags.heart_shower || (activeTest === 'heart_shower' && isOwnerJeongShinDong));
  const showLoveTemp = isPrivileged && (featureFlags.love_temp || (activeTest === 'love_temp' && isOwnerJeongShinDong));
  const showVoiceMsg = isPrivileged && (featureFlags.voice_msg || (activeTest === 'voice_msg' && isOwnerJeongShinDong));
  const showChatTriggerFloating = isPrivileged && (featureFlags.next_action_chat || (activeTest === 'next_action_chat' && isOwnerJeongShinDong));

  const currentUserRole = typeof authUser === 'object' ? (authUser?.role || '') : '';
  const isExplicitAdmin = typeof authUser === 'object' ? !!authUser?.is_admin : false;
  const canAccessAdmin = isOwnerJeongShinDong || isExplicitAdmin || ['관리자', '운영자', '목자', '전도사', '목사'].includes(currentUserRole);

  const MOOD_ITEMS = [
    { 
      key: 'next_action_chat', 
      title: '💬 은밀한 1:1 시크릿 챗 게이트 오픈', 
      desc: '스위치를 켜면 모하나 폰에 조용히 초대장이 활성화되고, 끄면 흔적 없이 사라집니다.', 
      type: 'chat_gate' 
    },
    { key: 'heart_shower', title: '🔥 걷잡을 수 없는 심장 폭격', desc: '화면을 가득 메우는 붉은빛 하트 열기', type: 'simple' },
    { key: 'love_temp', title: '🌡️ 끓어오르는 남자의 체온 38.5℃', desc: '너를 안았을 때 터질 것 같은 우리 둘만의 온도', type: 'simple' },
    { key: 'time_capsule', title: '💌 우리의 서약 타임캡슐', desc: '지정한 시간에 모하나 화면에 사랑의 완성 자동 개봉', type: 'capsule' },
    { key: 'voice_msg', title: '🎙️ 귓가를 울리는 내 낮은 중저음 보이스', desc: '다정하고 묵직한 내 목소리 오디오 링크 주입', type: 'input', inputKey: 'voice_url', placeholder: '오디오 파일 URL...' },
    { key: 'ambient_glow', title: '💎 와인빛 크리스탈 글레이즈', desc: '관능적인 버건디와 골드 앰버의 황홀한 채광', type: 'simple' },
    { key: 'acoustic', title: '숨소리까지 들리는 멜로 BGM', desc: '단둘이 침대에 누운 듯한 감미로운 사운드', type: 'simple' },
    { key: 'haptic_heartbeat', title: '심장 터질 듯한 가쁜 모바일 햅틱', desc: '피부로 전해지는 두근거리는 고동 박동 연동', type: 'input', inputKey: 'heartbeat', placeholder: '심장박동 멘트...' },
    { key: 'sleep_mode', title: '내 품에 가둬 재우는 침실 안식처', desc: '내 품 안에서만 편히 잠들도록 유도', type: 'input', inputKey: 'sleep_mode', placeholder: '수면 위로 멘트...' },
    { key: 'shelter_trigger', title: '딴 놈 보지 말고 내 품에 안겨', desc: '지친 모하나를 번쩍 안아주는 위로', type: 'input', inputKey: 'shelter', placeholder: '위로 멘트...' },
    { key: 'idle', title: '어디 가, 내 시선에서 벗어나지 마', desc: '3분 멈춤 시 박력 넘치는 고백', type: 'input', inputKey: 'idle', placeholder: '멈춤 힐링 멘트...' }
  ];

  const AURORA_PRESET_ITEMS = [
    { id: 'eros', title: '🔥 에로스 딥 버건디 & 크림슨', desc: '가장 뜨겁고 짙은 밤의 절정', colors: 'from-rose-900 via-rose-600 to-amber-700' },
    { id: 'amber', title: '✨ 샴페인 앰버 & 웜 골드', desc: '침실 조명 아래 서로의 체온이 녹아드는 황금빛 전조', colors: 'from-amber-700 via-amber-500 to-yellow-600' },
    { id: 'mystic', title: '🌌 미스틱 에메랄드 & 퍼플', desc: '새벽녘의 신비와 깊은 영적 교감을 감싸는 오로라', colors: 'from-emerald-600 via-purple-700 to-indigo-800' },
    { id: 'softRose', title: '🌸 소프트 로즈 & 피치 캔디', desc: '부드러운 입맞춤과 포근하게 안아주는 핑크빛 감성', colors: 'from-rose-400 via-pink-400 to-orange-300' }
  ];

  return (
    <>
      {/* 🌟 모하나 전용 실시간 미션 팝업 장착 */}
      <MissionReceiverModal currentUserName={currentUserName} />
      
      {activeTest && isOwnerJeongShinDong && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100000] flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] backdrop-blur-xl animate-fade-in text-[12px] font-bold select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>🎬 <b>[{MOOD_ITEMS.find(m => m.key === activeTest)?.title.split(' ')[1] || activeTest}]</b> 내 폰 미리보기 중 (8초)</span>
          <button 
            onClick={handleStopTest}
            className="ml-2 px-2.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-rose-300 font-black cursor-pointer active:scale-95 transition-transform text-[11px]"
          >
            ✕ 종료
          </button>
        </div>
      )}

      {/* 🌟 [철통 보안 3단계: 4대 핵심 누락 오버레이 전면 가드 적용] */}
      {isPrivileged && (featureFlags.haptic_heartbeat || (activeTest === 'haptic_heartbeat' && isOwnerJeongShinDong)) && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[99990] w-[90%] max-w-[360px] p-4 rounded-3xl bg-slate-900/95 border border-rose-500/50 backdrop-blur-2xl shadow-[0_10px_35px_rgba(244,63,94,0.4)] text-white flex items-center gap-3.5 animate-bounce select-none pointer-events-auto">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-xl shrink-0 animate-pulse">
            💓
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10.5px] font-black text-rose-400 block tracking-widest uppercase">HEARTBEAT PULSE</span>
            <p className="text-[12.5px] font-bold text-white mt-0.5 leading-snug break-keep">
              {customTexts.heartbeat}
            </p>
          </div>
        </div>
      )}

      {isPrivileged && (featureFlags.sleep_mode || (activeTest === 'sleep_mode' && isOwnerJeongShinDong)) && (
        <div 
          onClick={() => {
            if (activeTest === 'sleep_mode') handleStopTest();
            else setFeatureFlags(prev => ({ ...prev, sleep_mode: false }));
          }}
          onTouchEnd={() => {
            if (activeTest === 'sleep_mode') handleStopTest();
            else setFeatureFlags(prev => ({ ...prev, sleep_mode: false }));
          }}
          className="fixed inset-0 z-[99992] bg-[#0A0D14]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in cursor-pointer pointer-events-auto"
        >
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <span className="text-2xl">🌙</span>
          </div>
          <h3 className="text-[18px] font-black text-white mb-2">포근한 침실 안식처</h3>
          <p className="text-[14.5px] font-bold leading-[1.85] text-slate-200 whitespace-pre-wrap max-w-xs break-keep">
            {customTexts.sleep_mode}
          </p>
          <span className="mt-8 text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 pointer-events-none">
            화면 아무 곳이나 터치하면 닫힙니다
          </span>
        </div>
      )}

      {isPrivileged && (featureFlags.shelter_trigger || (activeTest === 'shelter_trigger' && isOwnerJeongShinDong)) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99990] w-[90%] max-w-[380px] p-4 rounded-3xl bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-rose-950/95 border border-rose-500/40 backdrop-blur-2xl shadow-[0_10px_35px_rgba(244,63,94,0.35)] text-white flex items-center gap-3.5 animate-fade-in-up select-none">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-xl shrink-0">
            🫂
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-rose-300 tracking-widest uppercase">WARM EMBRACE</span>
            <p className="text-[12.5px] font-bold text-rose-100 mt-0.5 leading-snug break-keep">
              {customTexts.shelter}
            </p>
          </div>
        </div>
      )}

      {isPrivileged && (featureFlags.idle || (activeTest === 'idle' && isOwnerJeongShinDong)) && (
        <div className="fixed inset-x-4 top-20 z-[99990] max-w-sm mx-auto p-4 rounded-3xl bg-slate-900/90 border border-rose-400/40 backdrop-blur-2xl shadow-[0_8px_30px_rgba(244,63,94,0.3)] text-white flex items-center gap-3 animate-fade-in select-none">
          <span className="text-xl">🔥</span>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-rose-300 tracking-widest uppercase">LOOK AT ME</span>
            <p className="text-[12.5px] font-bold text-slate-100 mt-0.5 leading-snug break-keep">
              {customTexts.idle}
            </p>
          </div>
        </div>
      )}

      {showHeartShower && (
        <div className="fixed inset-0 pointer-events-none z-[99998] overflow-hidden select-none">
          <style>{`
            @keyframes floatHeartShower {
              0% { transform: translateY(105vh) scale(0.6) rotate(0deg); opacity: 0; }
              20% { opacity: 0.9; }
              80% { opacity: 0.9; }
              100% { transform: translateY(-10vh) scale(1.3) rotate(20deg); opacity: 0; }
            }
          `}</style>
          {Array.from({ length: 24 }).map((_, i) => (
            <div 
              key={i}
              className="absolute text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] text-2xl select-none"
              style={{
                left: `${(i * 4.2) % 100}vw`,
                animation: `floatHeartShower ${3.5 + (i % 4) * 0.8}s ease-in infinite`,
                animationDelay: `${(i * 0.25)}s`
              }}
            >
              {['💖', '🔥', '💋', '💘', '💕', '❤️'][i % 6]}
            </div>
          ))}
        </div>
      )}

      {showLoveTemp && (
        <div className="fixed top-16 right-4 z-[99990] flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-rose-500/50 backdrop-blur-xl shadow-[0_4px_20px_rgba(244,63,94,0.4)] animate-fade-in pointer-events-auto select-none">
          <span className="text-base animate-bounce">🌡️</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-rose-300 tracking-wider">우리 사랑의 온도</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <span className="text-[12px] font-black text-white">
              38.5℃ <span className="text-amber-400 font-black text-[11px]">(+뜨거운 사랑의 열기)</span>
            </span>
          </div>
        </div>
      )}

      {showVoiceMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99995] w-[90%] max-w-[360px] p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-rose-950/95 to-slate-900/95 border border-rose-400/40 backdrop-blur-2xl shadow-[0_10px_35px_rgba(244,63,94,0.4)] text-white flex items-center gap-3 animate-fade-in-up select-none">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-xl shrink-0 animate-pulse">
            🎙
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-black text-rose-300 flex items-center gap-1.5">
              <span>신동 님의 보이스 메시지</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {customTexts.voice_url ? '오디오 파일이 재생 중입니다' : '다정한 음성이 도착했습니다.'}
            </p>
          </div>
          {customTexts.voice_url && (
            <button 
              onClick={() => {
                if (voiceRef.current) {
                  if (voiceRef.current.paused) voiceRef.current.play();
                  else voiceRef.current.pause();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              재생
            </button>
          )}
        </div>
      )}

      {showCapsuleModal && isPrivileged && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
          <div className="relative w-full max-w-[360px] p-6 rounded-[28px] bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#881337] border border-rose-500/40 shadow-[0_20px_60px_rgba(244,63,94,0.4)] text-white flex flex-col gap-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💌</span>
                <span className="text-[13px] font-black text-rose-300 uppercase tracking-wider">비밀 타임캡슐</span>
              </div>
              <button 
                onClick={() => setShowCapsuleModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400">지정된 예약 일시</span>
              <span className="text-[12px] font-mono text-rose-200">
                {customTexts.capsule_time ? new Date(customTexts.capsule_time).toLocaleString('ko-KR') : '지금 즉시 개봉됨'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-[13.5px] leading-relaxed text-slate-200 font-bold whitespace-pre-wrap max-h-[220px] overflow-y-auto hide-scrollbar">
              {customTexts.capsule_text}
            </div>

            <button 
              onClick={() => {
                setShowCapsuleModal(false);
                if (customTexts.capsule_time) {
                  localStorage.setItem(`capsule_opened_${customTexts.capsule_time}`, 'true');
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[13px] shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all cursor-pointer text-center"
            >
              내 마음에 깊게 새겨둘게 💖
            </button>
          </div>
        </div>
      )}

      {showWelcomeBloom && isPrivileged && (
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-[9970] overflow-hidden mix-blend-screen transition-opacity duration-1000">
          <style>{`
            @keyframes welcomeBloomRise {
              0% { transform: translate(-50%, 40%) scale(0.8); opacity: 0; }
              30% { opacity: 0.75; }
              70% { opacity: 0.75; transform: translate(-50%, -10%) scale(1.1); }
              100% { transform: translate(-50%, -30%) scale(1.3); opacity: 0; }
            }
          `}</style>
          <div 
            className="absolute bottom-0 left-1/2 w-[120vw] h-[70vh] rounded-[100%] blur-[80px]"
            style={{ 
              background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.5) 0%, rgba(244,63,94,0.25) 50%, transparent 70%)', 
              animation: 'welcomeBloomRise 15s ease-in-out infinite' 
            }} 
          />
        </div>
      )}

      {showAmbient && (
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-[9990] overflow-hidden select-none">
          <style>{`
            @keyframes edgeShimmer {
              0%, 100% { opacity: 0.4; box-shadow: inset 0 0 50px rgba(159,18,57,0.3), inset 0 0 100px rgba(225,29,72,0.15); }
              50% { opacity: 0.8; box-shadow: inset 0 0 70px rgba(225,29,72,0.45), inset 0 0 120px rgba(217,119,6,0.25); }
            }
            @keyframes cornerFlare {
              0% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.5); opacity: 0.6; }
              100% { transform: scale(1); opacity: 0.3; }
            }
          `}</style>
          <div className="absolute inset-0 mix-blend-overlay" style={{ animation: 'edgeShimmer 6s ease-in-out infinite' }} />
          <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full blur-[60px] bg-rose-600/25" style={{ animation: 'cornerFlare 7s infinite' }} />
          <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[60px] bg-amber-600/25" style={{ animation: 'cornerFlare 8s infinite reverse' }} />
        </div>
      )}

      {showAurora && (
        <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none z-[9980] overflow-hidden opacity-95 mix-blend-screen transition-opacity duration-1000 select-none">
          <style>{`
            @keyframes blobA {
              0% { transform: translate(-50%, -50%) translate(-22vw, -18dvh) scale(1); opacity: 0.7; }
              50% { transform: translate(-50%, -50%) translate(12vw, 16dvh) scale(1.25); opacity: 0.95; }
              100% { transform: translate(-50%, -50%) translate(-22vw, -18dvh) scale(1); opacity: 0.7; }
            }
            @keyframes blobB {
              0% { transform: translate(-50%, -50%) translate(22vw, 16dvh) scale(1.1); opacity: 0.75; }
              50% { transform: translate(-50%, -50%) translate(-16vw, -12dvh) scale(0.9); opacity: 0.95; }
              100% { transform: translate(-50%, -50%) translate(22vw, 16dvh) scale(1.1); opacity: 0.75; }
            }
            @keyframes blobC {
              0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
              50% { transform: translate(-50%, -50%) scale(1.35); opacity: 0.85; }
              100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
            }
          `}</style>

          {auroraPreset === 'eros' && (
            <>
              <div className="absolute top-[50dvh] left-[50dvw] w-[110dvw] h-[110dvw] max-w-[580px] max-h-[580px] rounded-full blur-[80px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(159,18,57,0.75) 0%, rgba(136,19,55,0.45) 50%, transparent 70%)', animation: 'blobA 18s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[115dvw] h-[115dvw] max-w-[620px] max-h-[620px] rounded-full blur-[85px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.8) 0%, rgba(190,18,60,0.45) 50%, transparent 70%)', animation: 'blobB 20s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[105dvw] h-[105dvw] max-w-[540px] max-h-[540px] rounded-full blur-[75px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.65) 0%, rgba(180,83,9,0.35) 50%, transparent 70%)', animation: 'blobC 15s ease-in-out infinite' }} />
            </>
          )}

          {auroraPreset === 'amber' && (
            <>
              <div className="absolute top-[50dvh] left-[50dvw] w-[110dvw] h-[110dvw] max-w-[580px] max-h-[580px] rounded-full blur-[80px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.75) 0%, rgba(180,83,9,0.4) 50%, transparent 70%)', animation: 'blobA 18s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[115dvw] h-[115dvw] max-w-[620px] max-h-[620px] rounded-full blur-[85px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.7) 0%, rgba(217,119,6,0.35) 50%, transparent 70%)', animation: 'blobB 20s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[105dvw] h-[105dvw] max-w-[540px] max-h-[540px] rounded-full blur-[75px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.65) 0%, rgba(217,119,6,0.3) 50%, transparent 70%)', animation: 'blobC 15s ease-in-out infinite' }} />
            </>
          )}

          {auroraPreset === 'mystic' && (
            <>
              <div className="absolute top-[50dvh] left-[50dvw] w-[110dvw] h-[110dvw] max-w-[580px] max-h-[580px] rounded-full blur-[80px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.7) 0%, rgba(5,150,105,0.4) 50%, transparent 70%)', animation: 'blobA 18s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[115dvw] h-[115dvw] max-w-[620px] max-h-[620px] rounded-full blur-[85px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.7) 0%, rgba(99,102,241,0.35) 50%, transparent 70%)', animation: 'blobB 20s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[105dvw] h-[105dvw] max-w-[540px] max-h-[540px] rounded-full blur-[75px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.6) 0%, rgba(251,113,133,0.3) 50%, transparent 70%)', animation: 'blobC 15s ease-in-out infinite' }} />
            </>
          )}

          {auroraPreset === 'softRose' && (
            <>
              <div className="absolute top-[50dvh] left-[50dvw] w-[110dvw] h-[110dvw] max-w-[580px] max-h-[580px] rounded-full blur-[80px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.7) 0%, rgba(236,72,153,0.35) 50%, transparent 70%)', animation: 'blobA 18s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[115dvw] h-[115dvw] max-w-[620px] max-h-[620px] rounded-full blur-[85px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.65) 0%, rgba(249,115,22,0.35) 50%, transparent 70%)', animation: 'blobB 20s ease-in-out infinite' }} />
              <div className="absolute top-[50dvh] left-[50dvw] w-[105dvw] h-[105dvw] max-w-[540px] max-h-[540px] rounded-full blur-[75px] will-change-transform" style={{ background: 'radial-gradient(circle, rgba(253,164,175,0.7) 0%, rgba(251,113,133,0.3) 50%, transparent 70%)', animation: 'blobC 15s ease-in-out infinite' }} />
            </>
          )}
        </div>
      )}

      {showChatTriggerFloating && (
        <div className="fixed bottom-[88px] right-4 z-[9995] animate-fade-in-up pointer-events-auto">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([100, 150, 100, 300]);
              setActiveScreen('secretChat');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-black text-white backdrop-blur-xl border border-rose-500/50 shadow-[0_4px_25px_rgba(244,63,94,0.5)] active:scale-95 transition-all cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
            <span className="text-[12.5px] font-black tracking-tight text-slate-100 group-hover:text-white whitespace-nowrap">
              {isOwnerJeongShinDong ? '💬 시크릿 챗 바로 입장' : '💖 신동 님의 은밀한 초대'}
            </span>
          </button>
        </div>
      )}

      {/* 하드코어 미션 수신 플로팅 뱃지 (오직 모하나만 렌더링) */}
      {isTargetMohana && isMissionActive && (
        <div className="fixed bottom-24 right-4 z-[9996] animate-bounce pointer-events-auto">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
              window.dispatchEvent(new Event('trigger_mission_modal'));
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-rose-700 to-red-700 text-white backdrop-blur-xl border border-red-400 shadow-[0_0_30px_rgba(225,29,72,0.8)] cursor-pointer"
          >
            <span className="text-[16px]">🔥</span>
            <span className="text-[13px] font-black tracking-widest text-white whitespace-nowrap">
              실전 지령 도착 (터치)
            </span>
          </button>
        </div>
      )}

      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-[150] h-full flex flex-col transition-all duration-300 ease-in-out border-r md:relative ${ui.bg} ${ui.border} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isSlim ? 'w-[72px]' : 'w-[220px] md:w-[260px]'}`}>
        <button onClick={() => setIsSlim(!isSlim)} className={`hidden md:flex absolute top-5 -right-3 w-6 h-6 rounded-full border shadow-sm items-center justify-center z-[160] transition-transform ${isDark ? 'bg-[#1C1C1E] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
          <IconChevronRight className={`w-3.5 h-3.5 transition-transform ${!isSlim ? 'rotate-180' : ''}`} />
        </button>

        <div onClick={handleLogoClick} className={`shrink-0 h-[64px] flex items-center gap-3 px-4 border-b ${ui.border} cursor-pointer transition-colors ${ui.hoverBg} select-none`}>
          <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center font-bold text-[13px] shadow-sm transition-all ${isEventSparkle ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.9)]' : isOriginalSparkle ? 'bg-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.8)]' : (isDark ? 'bg-black/30 border border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}>좋</div>
          {!isSlim && (
            <>
              <div className="flex flex-col flex-1 overflow-hidden justify-center">
                <span className={`text-[14.5px] font-black leading-tight truncate ${isEventSparkle ? 'text-rose-400' : ui.textPrimary}`}>좋은나무교회</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[12px] font-bold leading-tight truncate ${ui.textSecondary}`}>{currentUserName || '사용자'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isEventSparkle ? 'bg-rose-500 animate-pulse' : (isOriginalSparkle ? 'bg-sky-400 animate-pulse' : 'bg-emerald-500')}`}></span>
                </div>
              </div>
              <IconChevronUpDown className={`w-4 h-4 shrink-0 ${ui.iconBase}`} />
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 hide-scrollbar">
          {MENU_GROUPS.map((group, idx) => {
            const isGroupExpanded = expandedGroup === group.title;
            return (
              <div key={idx} className="space-y-1">
                <button onClick={() => { setExpandedGroup(expandedGroup === group.title ? null : group.title); if(isSlim) setIsSlim(false); }} className={`w-full flex items-center justify-between px-2 py-1.5 mb-1 transition-colors rounded-md focus:outline-none ${!isSlim ? ui.hoverBg : ''}`}>
                  {!isSlim ? (<span className={`text-[12px] font-bold tracking-widest ${ui.textSecondary}`}>{group.title}</span>) : (<span className="w-full text-center text-[10px] font-bold text-transparent select-none">-</span>)}
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isSlim || isGroupExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <nav className="overflow-hidden space-y-0.5">
                    {group.items.map(item => {
                      const isActive = activeScreen === item.id;
                      const Icon = item.icon;
                      return (
                        <button key={item.id} onClick={() => { setActiveScreen(item.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} title={isSlim ? item.label : undefined} className={`w-full flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors duration-200 focus:outline-none cursor-pointer ${isSlim ? 'justify-center p-3' : 'px-3 py-2.5'} ${isActive ? `${ui.activeBg} ${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary} ${ui.hoverBg}`}`}>
                          <Icon className={`shrink-0 w-[18px] h-[18px] ${isActive ? ui.activeText : ui.iconBase}`} />
                          {!isSlim && <span className={`truncate`}>{item.label}</span>}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`shrink-0 p-4 border-t ${ui.border} flex flex-col gap-2.5`}>
          {canAccessAdmin && (
            <button 
              onClick={() => { setActiveScreen('adminConsole'); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 cursor-pointer ${isSlim ? 'justify-center p-3' : 'px-3 py-2.5'} ${activeScreen === 'adminConsole' ? `${ui.activeBg}${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary}${ui.hoverBg}`}`}
            >
              <IconShieldAdmin className={`shrink-0 w-[18px] h-[18px] ${activeScreen === 'adminConsole' ? ui.activeText : 'text-indigo-400'}`} />
              {!isSlim && <span className="font-bold">관리자 페이지</span>}
            </button>
          )}

          <button 
            onClick={() => { setActiveScreen('guidebook'); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 cursor-pointer ${isSlim ? 'justify-center p-3' : 'px-3 py-2.5'} ${activeScreen === 'guidebook' ? `${ui.activeBg} ${ui.activeText} shadow-xs font-bold` : `${ui.textPrimary}${ui.hoverBg}`}`}
          >
            <IconBookGuide className={`shrink-0 w-[18px] h-[18px] ${activeScreen === 'guidebook' ? ui.activeText : ui.iconBase}`} />
            {!isSlim && <span>가이드북</span>}
          </button>

          {setIsDarkMode && (
            <div className={`flex justify-center mb-1`}>
               <button onClick={() => setIsDarkMode(!isDarkMode)} title="다크 모드 변경" className={`relative w-16 h-8 rounded-full shadow-inner flex items-center cursor-pointer transition-colors duration-300 ${isDark ? 'bg-black/30 border border-white/10' : 'bg-slate-200/70 border border-slate-300'}`}>
                 <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-9 bg-[#2A3441]' : 'translate-x-1 bg-white'}`}>{isDark ? <IconMoon /> : <IconSun />}</div>
               </button>
            </div>
          )}
          
          <button onClick={() => { if (window.confirm('로그아웃 하시겠습니까?')) { if (handleLogout) handleLogout(); setActiveScreen('login'); setIsSidebarOpen(false); } }} title={isSlim ? '로그아웃' : undefined} className={`w-full flex items-center gap-2.5 rounded-xl text-[13.5px] font-bold transition-colors cursor-pointer ${isSlim ? 'justify-center p-3' : 'px-3 py-2.5'} ${isDark ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50'}`}>
            <IconLogOut className="shrink-0 w-[16px] h-[16px]" />{!isSlim && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {showPinPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 w-full h-full">
          <div className={`w-full max-w-[340px] rounded-[24px] p-6 shadow-2xl backdrop-blur-2xl border ${isDark ? 'bg-[#1C1C1E]/95 border-white/10' : 'bg-white/95 border-white/60'}`}>
            <h3 className={`text-[16px] font-black mb-1.5 text-center ${ui.textPrimary}`}>The Sanctuary 인증</h3>
            <p className={`text-[12px] text-center mb-5 font-medium ${ui.textSecondary}`}>PIN 번호를 입력해주세요.</p>
            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} className={`w-full text-center tracking-[0.4em] text-lg py-3 rounded-xl mb-5 outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} autoFocus />
            <div className="flex gap-2 w-full">
              <button onClick={() => { setShowPinPrompt(false); setPinInput(''); }} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-colors border cursor-pointer ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>취소</button>
              <button onClick={verifyPin} className="flex-1 py-3 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black text-[13px] shadow-sm transition-colors cursor-pointer">확인</button>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && isOwnerJeongShinDong && (
        <div className="fixed inset-0 bg-[#0F172A]/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-0 pointer-events-auto select-none animate-fade-in w-full h-full">
          <div className={`relative w-full h-full md:h-[88vh] md:max-w-4xl md:rounded-[32px] bg-[#1E293B]/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] md:border md:border-white/10 overflow-hidden flex flex-col`}>
            
            <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-transparent">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${mohanaActivity ? 'bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.9)]' : 'bg-slate-500'}`}></span>
                <span className="text-[15px] sm:text-[17px] font-black tracking-widest text-white uppercase">The Sanctuary : 시크릿 통제실</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShowAdminModal(false);
                    setActiveScreen('secretChat');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  💬 시크릿 챗 입장
                </button>

                <button 
                  onClick={() => setShowChangePinSection(!showChangePinSection)} 
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                >
                  <IconKey /> PIN 변경
                </button>
                <button onClick={() => setShowAdminModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">✕</button>
              </div>
            </div>

            {showChangePinSection && (
              <div className="shrink-0 p-4 sm:px-8 bg-rose-950/40 border-b border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[13px] font-black text-rose-300 flex items-center gap-1.5 justify-center sm:justify-start">
                    <IconKey /> The Sanctuary 접근 비밀번호 재설정
                  </span>
                  <span className="text-[11px] text-slate-300">현재 PIN 검증 후 새로운 4자리 이상 PIN을 설정합니다.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center">
                  <input
                    type="password"
                    placeholder="현재 PIN"
                    value={currentPinAttempt}
                    onChange={e => setCurrentPinAttempt(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-[12px] font-mono outline-none text-center"
                  />
                  <input
                    type="password"
                    placeholder="새 PIN"
                    value={newPinCandidate}
                    onChange={e => setNewPinCandidate(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-[12px] font-mono outline-none text-center"
                  />
                  <input
                    type="password"
                    placeholder="새 PIN 확인"
                    value={confirmPinCandidate}
                    onChange={e => setConfirmPinCandidate(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-[12px] font-mono outline-none text-center"
                  />
                  <button
                    onClick={handleChangePin}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[12px] shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    변경 적용
                  </button>
                </div>
              </div>
            )}

            <div className="shrink-0 px-2 sm:px-6 py-2.5 border-b border-white/5 flex gap-1.5 overflow-x-auto hide-scrollbar bg-black/20 relative z-10">
              {[
                { id: 'orchestration', label: '🔥 무드 & 온기 연출' },
                { id: 'penpal', label: '💌 사랑의 펜팔 편지함' },
                { id: 'event', label: '💍 5단계 서약 관리' },
                { id: 'monitoring', label: '📡 실시간 교감 관제실' },
                { id: 'positionLab', label: '🔥 시크릿 체위 연구소' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold transition-all shrink-0 border cursor-pointer ${
                    adminTab === tab.id ? 'bg-gradient-to-r from-rose-500/20 to-red-600/20 border-rose-400/40 text-white shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-6 hide-scrollbar w-full relative z-10 pb-20">
              
              {/* [TAB 1] 무드 & 온기 연출 */}
              {adminTab === 'orchestration' && (
                <div className="space-y-5 w-full animate-fade-in-up">
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900/60 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14.5px] font-black text-rose-300">🔥 침실 온기 프리셋</h3>
                      <p className="text-[11.5px] text-rose-100/70 mt-1">오로라, BGM, 체온 38.5℃, 1:1 대화방을 일제히 동기화하여 서로의 온도를 하나로 묶습니다.</p>
                    </div>
                    <button onClick={applyNightPreset} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-[13px] shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer">
                      전체 가동
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-white/10 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div>
                        <h4 className="text-[14px] font-black text-white flex items-center gap-2">
                          <span>🌌 4가지 오로라 무드 컨셉 갤러리</span>
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-2 py-0.2 rounded-full border border-rose-500/30">모바일 뷰포트 고정 락</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">부드러운 교감부터 뜨겁게 타오르는 붉은빛까지, 원하는 오로라 무드를 터치해 즉시 동기화하세요.</p>
                      </div>
                      <button 
                        onClick={() => toggleFeature('aurora')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all cursor-pointer shrink-0 ${
                          featureFlags.aurora ? 'bg-rose-600 border-rose-500 text-white' : 'bg-black/50 border-white/10 text-slate-400'
                        }`}
                      >
                        오로라 마스터 {featureFlags.aurora ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {AURORA_PRESET_ITEMS.map(preset => {
                        const isSelected = auroraPreset === preset.id;
                        return (
                          <div 
                            key={preset.id}
                            onClick={() => handleSelectAuroraPreset(preset.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 relative overflow-hidden group ${
                              isSelected 
                                ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-400' 
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[12.5px] font-black ${isSelected ? 'text-rose-300' : 'text-slate-200'}`}>
                                {preset.title}
                              </span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                                isSelected ? 'bg-rose-500 border-rose-400 text-white' : 'border-white/20 text-transparent'
                              }`}>
                                ✓
                              </span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 leading-snug">{preset.desc}</span>
                            <div className={`h-1.5 w-full rounded-full bg-gradient-r ${preset.colors} opacity-80 mt-1`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[13.5px] font-black text-rose-300">🌸 환영의 로즈 블라썸</h3>
                      <p className="text-[11px] text-rose-200/70 mt-0.5">모하나 접속 시 1분간 피어오르는 환영 효과</p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowAdminModal(false); 
                        setShowWelcomeBloom(true); 
                        setTimeout(() => setShowWelcomeBloom(false), 8000); 
                      }} 
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] shadow-sm transition-all cursor-pointer"
                    >
                      미리보기 (8초)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {MOOD_ITEMS.map(item => (
                      <div key={item.key} className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-black text-white">{item.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.key === 'next_action_chat' && (
                              <button 
                                onClick={() => {
                                  setShowAdminModal(false);
                                  setActiveScreen('secretChat');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                              >
                                바로 입장
                              </button>
                            )}

                            {item.key !== 'next_action_chat' && (
                              <button 
                                onClick={() => handleTestFeature(item.key)} 
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                              >
                                미리보기
                              </button>
                            )}

                            <button 
                              onClick={() => toggleFeature(item.key)} 
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                                featureFlags[item.key] 
                                  ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]' 
                                  : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {featureFlags[item.key] ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>

                        {item.type === 'capsule' && (
                          <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl bg-black/40 border border-rose-500/20">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-black text-rose-300">⏰ 개봉될 날짜 및 시간 지정</span>
                              <input 
                                type="datetime-local" 
                                value={customTexts.capsule_time || ''} 
                                onChange={(e) => setCustomTexts({ ...customTexts, capsule_time: e.target.value })}
                                className="px-3 py-2 rounded-lg text-[11.5px] font-mono bg-slate-900 border border-white/15 text-white outline-none focus:border-rose-400" 
                              />
                            </div>
                            <textarea 
                              rows={2}
                              value={customTexts.capsule_text || ''} 
                              onChange={(e) => setCustomTexts({ ...customTexts, capsule_text: e.target.value })}
                              placeholder="타임캡슐 서약 멘트..."
                              className="w-full px-3 py-2 rounded-lg text-[11.5px] bg-slate-900 border border-white/15 text-white outline-none resize-none focus:border-rose-400" 
                            />
                            <button 
                              onClick={() => { saveCustomText('capsule_time'); saveCustomText('capsule_text'); }}
                              className="py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-black cursor-pointer transition-colors"
                            >
                              타임캡슐 예약 저장하기
                            </button>
                          </div>
                        )}

                        {item.type === 'input' && (
                          <div className="flex gap-2 mt-1 border-t border-white/5 pt-2.5">
                            <input 
                              type="text" 
                              value={customTexts[item.inputKey] || ''} 
                              placeholder={item.placeholder}
                              onChange={(e) => setCustomTexts({...customTexts, [item.inputKey]: e.target.value})} 
                              className="flex-1 px-3 py-1.5 rounded-lg text-[11.5px] font-medium bg-black/40 border border-white/10 text-white outline-none focus:border-rose-400" 
                            />
                            <button 
                              onClick={() => saveCustomText(item.inputKey)} 
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                            >
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* [TAB 2] 사랑의 펜팔 편지함 */}
              {adminTab === 'penpal' && (
                <div className="space-y-4 w-full animate-fade-in-up">
                  <div className="p-5 sm:p-6 rounded-[24px] bg-slate-800/60 border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <div>
                        <h3 className="text-[15px] font-black text-white flex items-center gap-2">
                          <span>💌 사랑의 펜팔 편지 작성 및 발송</span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">AES-256 암호화</span>
                        </h3>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">상대방에게 깊은 마음을 전합니다. 발송된 편지는 보관함에 영구 보존됩니다.</p>
                      </div>
                      <select 
                        value={penpalRecipient} 
                        onChange={e => setPenpalRecipient(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-rose-300 text-[12px] font-black outline-none cursor-pointer"
                      >
                        <option value={TARGET_NAME}>받는 사람: 모하나</option>
                        <option value={MY_NAME}>받는 시람: 정신동 (나에게)</option>
                      </select>
                    </div>

                    <input 
                      type="text" 
                      value={penpalTitle} 
                      onChange={e => setPenpalTitle(e.target.value)} 
                      placeholder="편지 제목을 입력하세요..." 
                      className="w-full px-4 py-3 rounded-xl text-[13px] font-black bg-black/40 border border-white/10 text-white outline-none focus:border-rose-400"
                    />

                    <textarea 
                      rows={6}
                      value={penpalContent} 
                      onChange={e => setPenpalContent(e.target.value)} 
                      placeholder="진솔한 편지 본문을 적어주세요..." 
                      className="w-full p-4 rounded-xl text-[12.5px] font-medium leading-relaxed bg-black/40 border border-white/10 text-white outline-none resize-none focus:border-rose-400"
                    />

                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => setSelectedPenpalPreview({ title: penpalTitle, content: penpalContent, sender: MY_NAME, created_at: new Date().toISOString() })}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[12px] transition-colors cursor-pointer"
                      >
                        발송 전 미리보기
                      </button>
                      <button 
                        onClick={handleSendPenpal}
                        className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[12.5px] shadow-sm cursor-pointer active:scale-95 transition-all"
                      >
                        편지 암호화 발송 🚀
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-[24px] bg-slate-800/40 border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <h4 className="text-[14px] font-black text-white flex items-center gap-2">
                        <span>📜 주고받은 펜팔 서신 목록</span>
                        <span className="text-[11px] font-mono text-rose-400">({penpalList.length}통 보관 중)</span>
                      </h4>
                      <button onClick={fetchPenpalLetters} className="text-[11px] text-slate-400 hover:text-white cursor-pointer font-bold">
                        새로고침 ⟳
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar pr-1">
                      {penpalList.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 text-[12px]">아직 주고받은 편지가 없습니다.</p>
                      ) : (
                        penpalList.map(letter => {
                          const isFromMe = letter.sender === MY_NAME;
                          return (
                            <div key={letter.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-colors">
                              <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedPenpalPreview(letter)}>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isFromMe ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                    {isFromMe ? '보낸 편지' : '받은 편지'}
                                  </span>
                                  <span className="text-[13px] font-black text-white truncate">{letter.title}</span>
                                  {letter.is_read && <span className="text-[9.5px] font-mono text-slate-500">[읽음]</span>}
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 font-mono">
                                  {new Date(letter.created_at).toLocaleString('ko-KR')}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  onClick={() => setSelectedPenpalPreview(letter)}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold cursor-pointer"
                                >
                                  열람
                                </button>
                                {isFromMe && (
                                  <button 
                                    onClick={() => handleRevokePenpal(letter.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 text-[11px] font-bold cursor-pointer"
                                  >
                                    회수
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* [TAB: 5단계 서약 관리 & 실링 왁스 편지 완벽 연동] */}
              {adminTab === 'event' && (
                <div className="space-y-4 w-full animate-fade-in-up">
                  <div className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-br from-rose-950/40 to-slate-900/60 border border-rose-500/20 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-1">
                      <span className="text-[15px] sm:text-[16px] font-black text-white flex items-center gap-2">🔥 5단계 사랑의 서약 관리</span>
                      <span className="text-[10px] w-max text-rose-300 font-bold bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">사랑의 절대적 완성</span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-slate-300 leading-relaxed px-1 break-keep">
                      모하나의 화면을 압도하며 입술과 심장, 영혼을 하나로 묶는 5단계 사랑의 서약을 가동합니다.
                    </p>

                    <div className="flex flex-col gap-2 bg-black/30 p-4 rounded-xl border border-white/5 mt-1">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1 gap-2">
                        <span className="text-[12px] font-black text-rose-300">✍️ 5단계 서약 대사 프리셋 선택</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button 
                            onClick={() => setEventDialogs([...DEFAULT_KAMASUTRA_DIALOGS])}
                            className="text-[10.5px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
                          >
                            1단계 (로맨틱)
                          </button>
                          <button 
                            onClick={() => setEventDialogs([...DOMINANT_LUST_DIALOGS])}
                            className="text-[10.5px] font-bold text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 transition-colors border border-rose-500/30 cursor-pointer"
                          >
                            2단계 (지배적)
                          </button>
                          <button 
                            onClick={handleLoadCustomDialogs}
                            className="text-[10.5px] font-black text-red-300 hover:text-white px-2.5 py-1 rounded-lg bg-red-900/40 hover:bg-red-900/60 transition-colors border border-red-500/50 cursor-pointer shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                          >
                            3단계 (직접 입력/불러오기)
                          </button>
                        </div>
                      </div>
                      
                      {eventDialogs.map((dlg, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-[11px] font-black text-rose-400 shrink-0 w-12">Step {idx+1}</span>
                          <input 
                            type="text" 
                            value={dlg} 
                            onChange={(e) => {
                              const updated = [...eventDialogs];
                              updated[idx] = e.target.value;
                              setEventDialogs(updated);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-[12px] font-bold bg-black/50 border border-white/10 text-white outline-none focus:border-rose-400" 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button onClick={startTestMode} className="py-3 px-2 rounded-xl font-bold text-[12px] bg-black/30 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer text-center">내 폰 미리보기</button>
                      <button 
                        onClick={() => {
                          setShowAdminModal(false);
                          setActiveScreen('secretChat');
                        }}
                        className="py-3 px-2 rounded-xl bg-rose-700/80 hover:bg-rose-700 text-white font-black text-[12px] shadow-sm transition-all cursor-pointer text-center"
                      >
                        💬 채팅 입장
                      </button>
                      <button onClick={toggleEventStatus} className={`py-3 px-2 rounded-xl text-white font-black text-[12px] shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer text-center ${isEventOpen ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500'}`}>
                        {isEventOpen ? '⚠️ 발동 중지' : '🚀 서약 가동'}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-[24px] bg-slate-800/50 border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1 mb-1">
                      <span className="text-[14.5px] sm:text-[15px] font-black text-white">💌 봉인된 진심 (실링 왁스 편지)</span>
                      <span className="text-[11px] text-rose-400 font-bold">실전 발송 시 모하나 기기 왁스 봉투 직행</span>
                    </div>
                    
                    <input 
                      type="text" 
                      value={customLetterTitle} 
                      onChange={e => setCustomLetterTitle(e.target.value)} 
                      placeholder="편지 제목..."
                      className="w-full px-4 py-3.5 rounded-xl text-[13.5px] font-black outline-none border bg-black/40 border-white/10 text-white focus:border-rose-400" 
                    />
                    
                    <textarea 
                      value={customLetterBody} 
                      onChange={e => setCustomLetterBody(e.target.value)} 
                      rows={6} 
                      placeholder="깊은 편지 내용..."
                      className="w-full p-4 rounded-xl text-[13px] font-medium leading-[1.8] outline-none resize-none border bg-black/40 border-white/10 text-white focus:border-rose-400" 
                    />

                    <button 
                      onClick={handleSaveDialogsAndLetter}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-[13px] rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💾 수정한 서약 & 편지 영구 저장하기
                    </button>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button 
                        onClick={handleSendCustomLetter} 
                        className="py-3 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 text-white font-black text-[12px] shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                      >
                        실전 발송 🚀
                      </button>
                      <button onClick={handleTestSendToMe} className="py-3 rounded-xl bg-slate-700 text-white font-bold text-[12px] shadow-sm hover:bg-slate-600 transition-colors cursor-pointer">미리보기</button>
                      <button onClick={handleResetLetter} className="py-3 rounded-xl font-bold text-[12px] transition-colors border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer">편지 회수</button>
                    </div>
                  </div>
                </div>
              )}

              {/* [TAB 4] 실시간 교감 관제실 */}
              {adminTab === 'monitoring' && (
                <div className="space-y-4 w-full animate-fade-in-up">
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col gap-2 w-full">
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                      💖 내 여자 모하나 실시간 교감 관제실
                    </span>
                    {mohanaActivity ? (
                      <div className="mt-1">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[12.5px] mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>교감 중 ({mohanaActivity.lastSeen})
                        </div>
                        <p className="text-[15px] font-black text-white">머무는 위치: <span className="text-rose-300">{getPageName(mohanaActivity.lastPage)}</span></p>
                      </div>
                    ) : (
                      <p className="text-[12.5px] font-bold text-slate-500 mt-1">최근 10분간 활동이 없습니다.</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {['ALL', 'WRITE', '목장', 'QT', '예배', '간증'].map(f => (
                        <button key={f} onClick={() => setLogFilter(f)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${logFilter === f ? 'bg-white text-black' : 'border border-white/10 text-slate-400 bg-white/5'}`}>
                          {f === 'WRITE' ? '📝 작성글만' : f}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden max-h-[300px] overflow-y-auto hide-scrollbar">
                      <div className="divide-y divide-white/5">
                        {filteredLogs.length === 0 ? (
                          <p className="py-10 text-center text-[12px] font-medium text-slate-500">기록된 활동이 없습니다.</p>
                        ) : (
                          filteredLogs.map(log => {
                            const isWrite = log.action_type === 'write';
                            return (
                              <div key={log.id} className="p-3.5 flex flex-col gap-1.5 w-full hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-center w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-[10px] font-black flex items-center gap-1">
                                      💋 모하나
                                    </span>
                                    <span className="text-[12.5px] font-black text-slate-200">{isWrite ? '작성 ✍️' : '머무름 ✨'} {getPageName(log.page_visited)}</span>
                                  </div>
                                  <span className="text-[10.5px] font-bold text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                                </div>
                                {log.action_detail && (
                                  <p className="text-[11.5px] font-medium leading-[1.6] text-slate-400 pl-2.5 border-l-2 border-rose-500/40 mt-1">{log.action_detail}</p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border bg-slate-800/50 border-white/10 flex flex-col gap-3 w-full">
                    <span className="text-[13px] font-black text-white">다이렉트 온기 주입</span>
                    <select value={injectionType} onChange={e => setInjectionType(e.target.value)} className="w-full p-3 rounded-xl text-[12.5px] font-bold outline-none border bg-black/40 border-white/10 text-white focus:border-rose-400 cursor-pointer">
                      <option value="prayer">기도 보관함 (익명 기도)</option>
                      <option value="thanks">감사 일기 (익명 감사)</option>
                      <option value="idle_msg">여백의 시간 (3분 멈춤 멘트)</option>
                    </select>
                    <textarea value={injectionText} onChange={e => setInjectionText(e.target.value)} placeholder="주입할 은밀한 문장..." rows={3} className="w-full p-3 rounded-xl text-[12.5px] leading-[1.7] outline-none resize-none border bg-black/40 border-white/10 text-white focus:border-rose-400" />
                    <button onClick={handleSendInjection} className="w-full py-3.5 mt-1 rounded-xl bg-white text-slate-900 font-black text-[12.5px] shadow-sm active:scale-95 transition-transform cursor-pointer">
                      조용히 주입하기
                    </button>
                  </div>
                </div>
              )}

              {/* [TAB 5] 시크릿 체위 연구소 */}
              {adminTab === 'positionLab' && (
                <div className="w-full animate-fade-in-up">
                  <PositionLab />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 펜팔 편지 미리보기 모달 */}
      {selectedPenpalPreview && isPrivileged && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="w-full max-w-[420px] rounded-[28px] bg-[#FFFDF9] text-slate-800 p-6 shadow-2xl border border-amber-200/80 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-amber-100 pb-2.5">
              <span className="text-[11px] font-serif font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded">
                From. {selectedPenpalPreview.sender}
              </span>
              <button onClick={() => setSelectedPenpalPreview(null)} className="text-slate-400 hover:text-slate-800 font-bold text-xs cursor-pointer">✕ 닫기</button>
            </div>
            <h3 className="text-[17px] font-serif font-black text-slate-900 leading-snug">{selectedPenpalPreview.title}</h3>
            <div className="text-[13px] leading-[1.9] font-serif text-slate-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto hide-scrollbar font-bold">
              {selectedPenpalPreview.content}
            </div>
            <button 
              onClick={() => setSelectedPenpalPreview(null)} 
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-[12px] transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 실링 왁스 비밀 편지 게이트 */}
      {showLetterEnvelope && isPrivileged && (
        <div 
          className="fixed inset-0 z-[99990] w-full h-full flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none animate-fade-in" 
          onClick={envelopeState === 'open' ? handleCloseEnvelope : undefined}
        >
          <div className="relative w-full max-w-[380px] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {envelopeState !== 'open' ? (
              <div 
                onClick={handleOpenEnvelope}
                className="w-full aspect-[4/3] rounded-[28px] bg-[#E8DDD1] shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-[#D5C6B6] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all group"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 300">
                    <polygon points="0,300 200,160 400,300" fill="#DFCDBB" opacity="0.6" />
                    <polygon points="0,0 160,150 0,300" fill="#E2D4C4" opacity="0.4" />
                    <polygon points="400,0 240,150 400,300" fill="#E2D4C4" opacity="0.4" />
                    <polygon points="0,0 200,155 400,0" fill="#D8C5B2" />
                  </svg>
                </div>

                <div className="relative z-20 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 animate-pulse group-hover:scale-105">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-[0_12px_28px_rgba(153,27,27,0.5),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_6px_rgba(0,0,0,0.45)] bg-gradient-to-br from-[#A81C1C] via-[#881313] to-[#580B0B] border-2 border-[#B91C1C]/40 pointer-events-none">
                    <div className="flex flex-col items-center justify-center text-center text-[#FDE68A] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      <span className="font-serif text-[11px] font-black tracking-widest leading-tight">ONE</span>
                      <span className="text-[8px] tracking-tighter opacity-80 mt-0.5">FOREVER</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
                  <span className="text-[11.5px] font-black text-white bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md shadow-md animate-pulse">
                    왁스를 터치해 편지를 열어봐
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-[32px] bg-[#FFFDF9] text-slate-800 p-6 sm:p-7 shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-amber-200/80 flex flex-col gap-4 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-amber-150 pb-3">
                  <span className="text-[11.5px] font-serif font-black tracking-widest text-amber-900 bg-amber-100/90 px-3 py-1 rounded-md uppercase">
                    From. 너의 남자 신동
                  </span>
                  <span className="text-[11px] font-bold text-rose-600">사랑의 펜팔 편지</span>
                </div>

                <h3 className="text-[18px] font-serif font-black text-slate-900 mt-1 leading-snug break-keep">
                  {receivedLetter.title || customLetterTitle}
                </h3>

                <div className="py-2 text-[14px] leading-[1.95] font-serif text-slate-800 font-bold whitespace-pre-wrap max-h-[280px] overflow-y-auto hide-scrollbar break-keep">
                  {receivedLetter.content || customLetterBody}
                </div>

                {showReplyForm ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-amber-150 animate-fade-in">
                    <span className="text-[11px] font-bold text-rose-600">💌 신동이에게 보낼 답장 쓰기</span>
                    <textarea 
                      rows={4}
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="신동이에게 전할 진심을 적어줘..."
                      className="w-full p-3 rounded-xl text-[12.5px] font-medium leading-relaxed bg-amber-50/50 border border-amber-200 outline-none text-slate-900 resize-none"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowReplyForm(false)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[12px] cursor-pointer"
                      >
                        취소
                      </button>
                      <button 
                        onClick={handleSendReplyFromMohana}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[12px] cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        답장 발송하기 🚀
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-2 border-t border-amber-100">
                    <button 
                      onClick={() => setShowReplyForm(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white text-[13px] font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>✍️</span> 지금 답장 편지 쓰기
                    </button>
                    <button 
                      onClick={handleCloseEnvelope}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold transition-colors cursor-pointer text-center"
                    >
                      소중히 가슴에 품을게 (닫기)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사랑의 서약 게이트 */}
      {showLovePopup && (isTargetMohana || (isTestMode && isOwnerJeongShinDong)) && (
        <div 
          className="fixed inset-0 z-[9999] w-full h-full bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#881337] backdrop-blur-3xl flex flex-col items-center justify-center cursor-pointer transition-opacity duration-1000 select-none"
          onClick={!hasStartedAudio ? handleFirstTouchPlayAudio : handleBackgroundClick}
        >
          {isTestMode && (<div className="absolute top-8 text-rose-300 font-black text-[10.5px] tracking-widest uppercase animate-pulse px-3.5 py-1 border border-rose-400/40 rounded-full bg-rose-500/20 shadow-sm">[ 서약 시뮬레이션 ]</div>)}
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[20%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-rose-600/20 blur-[90px] animate-pulse"></div>
             <div className="absolute bottom-[20%] right-[10%] w-[70vw] h-[70vw] rounded-full bg-amber-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {!hasStartedAudio ? (
            <div className="flex flex-col items-center justify-center gap-6 text-center px-4 w-full max-w-[400px] animate-fade-in relative z-10">
              <IconGlowHeart />
              <div className="flex flex-col gap-3 mt-2">
                <h2 className="text-[20px] sm:text-[23px] font-black text-white leading-[1.6] break-keep drop-shadow-md">
                  이 깊은 밤,<br/>
                  <span className="text-rose-400">영혼과 육체의 온전한 서약</span>이 도착했어.
                </h2>
                <div className="mt-8 flex flex-col items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping mb-1" />
                  <span className="text-[14px] font-black text-rose-200 tracking-widest animate-pulse">
                    화면을 터치해
                  </span>
                  <span className="text-[11.5px] font-bold text-rose-300/70 tracking-wider">
                    몸 안 깊숙이 밀려드는 숨결을 느껴봐
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 text-center px-4 w-full max-w-[400px] relative z-10">
              {popupStep >= 0 && popupStep < eventDialogs.length && (
                <IconBigHeart onClick={(e) => { 
                  e.stopPropagation(); 
                  if(navigator.vibrate) navigator.vibrate([100, 200, 150, 400]); 
                }} />
              )}
              <div className="min-h-[160px] flex flex-col items-center justify-center w-full px-2">
                
                {eventDialogs.map((dlgText, dIdx) => (
                  popupStep === dIdx && (
                    <h2 key={dIdx} className="text-[21px] sm:text-[25px] font-black text-white leading-[1.7] break-keep animate-fade-in-up drop-shadow-md whitespace-pre-wrap">
                      {dlgText}
                    </h2>
                  )
                ))}

                {popupStep === eventDialogs.length && (
                  <div className="flex flex-col items-center w-full animate-fade-in px-2" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-[22px] sm:text-[26px] font-black text-rose-400 leading-[1.6] break-keep mb-8 text-center drop-shadow-lg">
                      야 모하나, 똑바로 들어.<br/>나랑 평생 가자.<br/>
                      <span className="text-white text-[19px] sm:text-[22px] block mt-2 font-black">내 모든 밤과 살결, 영혼은 전부 네 거야.</span>
                    </h2>
                    
                    <div className="flex flex-col gap-3 w-full max-w-[340px]">
                      <button 
                        onClick={handleAccept} 
                        className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-full font-black text-[15.5px] shadow-[0_0_35px_rgba(244,63,94,0.6)] active:scale-95 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <span>🔥</span> 응, 신동이 품 안에서 남김없이 엉킬래
                      </button>

                      <a 
                        href="tel:01030258582" 
                        onClick={(e) => { 
                          if(acousticRef.current) { acousticRef.current.pause(); acousticRef.current.currentTime = 0; }
                          if (!isTestMode) sessionStorage.setItem('love_popup_shown', 'true'); 
                          setShowLovePopup(false); 
                          setIsTestMode(false); 
                          setHasStartedAudio(false); 
                        }} 
                        className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-full font-black text-[14px] shadow-[0_0_20px_rgba(244,63,94,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center border border-white/10"
                      >
                        <IconPhone className="w-4 h-4" /> 지금 당장 숨소리 들려줘 (전화걸기)
                      </a>

                      <button 
                        onClick={handleDecline} 
                        className="w-full py-2.5 mt-0.5 bg-transparent text-slate-400 hover:text-white rounded-full font-bold text-[12.5px] active:scale-95 transition-all cursor-pointer"
                      >
                        조금만 더 애태워줄게 (닫기)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {popupStep < eventDialogs.length && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center pointer-events-none">
                  <span className="text-[11.5px] font-black text-white/60 animate-pulse tracking-widest bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    화면을 터치해서 다음으로 넘어가
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <audio 
        ref={acousticRef} 
        src="/video/lovely.mp4"
        preload="auto" 
        loop 
        playsInline 
        style={{ display: 'none' }} 
      />

      {customTexts.voice_url && (
        <audio 
          ref={voiceRef}
          src={customTexts.voice_url}
          preload="auto"
          playsInline
          style={{ display: 'none' }} 
        />
      )}
    </>
  );
}
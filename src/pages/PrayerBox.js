// src/components/PrayerBox.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const getLocal = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    if (!v || v === 'null' || v === 'undefined') return fallback;
    const parsed = JSON.parse(v);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const setLocal = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// 모던 라인 아이콘 (2px stroke)
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconPlay = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M8 5v14l11-7z" /></svg>;
const IconPause = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconQuote = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;

function loadYouTubeIframeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prevCallback === 'function') prevCallback(); resolve(window.YT); };
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
}

const SectionHeader = ({ title, desc, isDark }) => (
  <div className="flex flex-col gap-1 border-b border-slate-200/60 dark:border-white/10 pb-3 mb-4">
    <h2 className={`text-[17px] md:text-[18.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
    <p className="text-[12px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 break-keep">{desc}</p>
  </div>
);

const ContentTitle = ({ children, isDark }) => (
  <h3 className={`text-[13.5px] font-black mt-4 mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
    <IconQuote/> {children}
  </h3>
);

const ContentP = ({ children, isDark }) => (
  <p className={`text-[13px] leading-[1.75] font-medium mb-3 break-keep whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
    {children}
  </p>
);

const InputBox = ({ id, label, placeholder, isTextarea = false, stateObj = {}, stateSetter, isDark }) => (
  <div className="flex flex-col gap-1.5 mb-3">
    <span className={`text-[12px] font-black ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{label}</span>
    {isTextarea ? (
      <textarea 
        value={(stateObj && stateObj[id]) || ''} 
        onChange={(e) => stateSetter && stateSetter({ ...(stateObj || {}), [id]: e.target.value })}
        className={`w-full p-3 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none min-h-[75px] border transition-all ${isDark ? 'bg-black/20 border-white/10 text-white focus:border-rose-400' : 'bg-white/70 border-slate-200 text-slate-900 focus:border-rose-400'}`}
        placeholder={placeholder}
      />
    ) : (
      <input 
        type="text" 
        value={(stateObj && stateObj[id]) || ''} 
        onChange={(e) => stateSetter && stateSetter({ ...(stateObj || {}), [id]: e.target.value })}
        className={`w-full px-3 py-2.5 text-[13px] font-bold rounded-xl outline-none border transition-all ${isDark ? 'bg-black/20 border-white/10 text-white focus:border-rose-400' : 'bg-white/70 border-slate-200 text-slate-900 focus:border-rose-400'}`}
        placeholder={placeholder}
      />
    )}
  </div>
);

const CheckItem = ({ isChecked = false, onToggle, label, isDark }) => (
  <div className={`flex items-start gap-2.5 cursor-pointer py-2 border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-black/[0.02]'}`} onClick={onToggle}>
    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-rose-500 border-rose-500 text-white' : (isDark ? 'border-white/20 bg-black/20' : 'border-slate-300 bg-white')}`}>
      {isChecked && <IconCheck />}
    </div>
    <p className={`text-[12.5px] font-bold leading-snug transition-colors ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>{label}</p>
  </div>
);

const StatBox = ({ title, count, onClick, isDark }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className={`flex flex-col justify-center items-start text-left p-2.5 rounded-xl border backdrop-blur-2xl transition-all w-full cursor-pointer hover:scale-[1.01] ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/70 border-white/80 shadow-xs'}`}
  >
    <span className="text-[10.5px] font-bold text-slate-400 mb-0.5">{title}</span>
    <span className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
  </button>
);

export default function PrayerBox({ 
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, 
  globalPrayers = [], globalIntercessions = [], openModal, getArr, authUser 
}) {
  const [secretPrayers, setSecretPrayers] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const fetchSecretPrayers = async () => {
      try {
        const { data } = await supabase.from('secret_injections').select('*').eq('type', 'prayer').order('created_at', { ascending: false });
        if (data && isMounted) {
          setSecretPrayers(data.map(p => ({
            ...p,
            content: decryptField(p.content)
          })));
        }
      } catch (e) {}
    };
    fetchSecretPrayers();

    const sub = supabase.channel('secret_prayers_fixed_chan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_injections', filter: "type=eq.prayer" }, payload => {
        if (isMounted && payload.new) {
          const item = { ...payload.new, content: decryptField(payload.new.content) };
          setSecretPrayers(prev => [item, ...prev]);
        }
      }).subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, []);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  
  const safePrayers = (getArr ? getArr(globalPrayers) : Array.isArray(globalPrayers) ? globalPrayers : [])
    .filter(p => p != null);
  const safeIntercessions = (getArr ? getArr(globalIntercessions) : Array.isArray(globalIntercessions) ? globalIntercessions : [])
    .filter(p => p != null);

  const prayingMy = safePrayers.filter(p => typeof p === 'object' ? p.status === 'praying' : true);
  const prayingInter = safeIntercessions.filter(p => typeof p === 'object' ? p.status === 'praying' : true);

  const [activeTab, setActiveTab] = useState('seminar'); 

  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [selectedBgmId, setSelectedBgmId] = useState('lZAo5miNkzQ');
  const ytPlayerRef = useRef(null);
  const ytWrapperRef = useRef(null);
  const isPlayerReadyRef = useRef(false);
  const bgmList = [
    { id: 'lZAo5miNkzQ', label: '아침 묵상 피아노' },
    { id: 'MDyaW3m4y84', label: '깊은 기도원 찬송' },
    { id: 'uw_jj4NKR4c', label: '잔잔한 워십' }
  ];

  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef(null);

  const [chk, setChk] = useState(() => getLocal('pb_chk_final_v14', {}) || {});
  const [tNote, setTNote] = useState(() => getLocal('pb_tnote_final_v14', {
    w1CurHabit: '', w1TimePlace: '', w2Verse: '', w2Lesson: '', w2Thanks: '', w2Confess: '', w2Request: '',
    w3Event: '', w3Question: '', w3MyFault: '', w3Action: '', w4Target: '', w4Prayer: '', w4ShareMsg: ''
  }) || {
    w1CurHabit: '', w1TimePlace: '', w2Verse: '', w2Lesson: '', w2Thanks: '', w2Confess: '', w2Request: '',
    w3Event: '', w3Question: '', w3MyFault: '', w3Action: '', w4Target: '', w4Prayer: '', w4ShareMsg: ''
  });
  const [comfortChecks, setComfortChecks] = useState(() => getLocal('pb_com_chk_final_v14', {}) || {});
  const [comfortForms, setComfortForms] = useState(() => getLocal('pb_com_forms_final_v14', {}) || {});

  const [pipelineData, setPipelineData] = useState({ pain: '', application: '' });

  const safeChk = chk || {};
  const safeTNote = tNote || {};
  const safeComfortChecks = comfortChecks || {};
  const safeComfortForms = comfortForms || {};

  useEffect(() => { setLocal('pb_chk_final_v14', safeChk); }, [safeChk]);
  useEffect(() => { setLocal('pb_tnote_final_v14', safeTNote); }, [safeTNote]);
  useEffect(() => { setLocal('pb_com_chk_final_v14', safeComfortChecks); }, [safeComfortChecks]);
  useEffect(() => { setLocal('pb_com_forms_final_v14', safeComfortForms); }, [safeComfortForms]);

  const toggleChk = (id) => setChk(p => ({...(p || {}), [id]: !p?.[id]}));
  const toggleComfortCheck = (id) => setComfortChecks(p => ({ ...(p || {}), [id]: !p?.[id] }));

  useEffect(() => {
    if (activeTab === 'prayerRoom') {
      timerRef.current = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    isPlayerReadyRef.current = false;
    let container = document.createElement('div');
    if (ytWrapperRef.current) {
      ytWrapperRef.current.appendChild(container);
    }

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled || !container) return;
      try {
        ytPlayerRef.current = new YT.Player(container, {
          height: '1', width: '1', videoId: selectedBgmId,
          playerVars: { autoplay: 0, playsinline: 1, loop: 1, playlist: selectedBgmId, controls: 0 },
          events: {
            onReady: () => { isPlayerReadyRef.current = true; },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) setIsPlayingBgm(true);
              else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setIsPlayingBgm(false);
            }
          }
        });
      } catch (e) {}
    });

    return () => {
      cancelled = true;
      isPlayerReadyRef.current = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
        ytPlayerRef.current = null;
      }
      if (container && container.parentNode) {
        try { container.parentNode.removeChild(container); } catch (e) {}
      }
      setIsPlayingBgm(false);
    };
  }, []);

  const playBgm = () => { 
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      try { ytPlayerRef.current.playVideo(); } catch (e) {}
    } 
  };
  const pauseBgm = () => { 
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
    } 
  };
  const changeBgm = (id) => { 
    setSelectedBgmId(id); 
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try { ytPlayerRef.current.loadVideoById(id); } catch (e) {}
    } 
  };
  const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };

  const activePrayerList = useMemo(() => {
     const my = prayingMy.map(p => ({ 
       id: typeof p === 'object' ? p.id || Math.random() : Math.random(),
       text: typeof p === 'object' ? decryptField(p.text || p.content || '') : decryptField(String(p)),
       category: '나의 기도' 
     }));
     const inter = prayingInter.map(p => ({ 
       id: typeof p === 'object' ? p.id || Math.random() : Math.random(),
       text: typeof p === 'object' ? decryptField(p.text || p.content || '') : decryptField(String(p)),
       category: '중보 기도' 
     }));
     return [...my, ...inter].filter(item => item.text && item.text.trim());
  }, [prayingMy, prayingInter]);

  // 🌟 [핵심 신규 기능] 몰입 기도실 기도문 ➔ 블록버스터 릴스 원터치 직결
  const handleExportToReels = (prayerText, category = '기도제목') => {
    if (!prayerText || !prayerText.trim()) return alert("변환할 기도문 내용이 없습니다.");
    const payload = {
      sourceMode: 'prayer',
      targetDate: new Date().toISOString().split('T')[0],
      title: `[기도와 위로] ${category}`,
      subtitle: 'PRAYER & REFUGE',
      heroText: prayerText.slice(0, 40),
      bodyText: prayerText,
      actionText: ''
    };

    localStorage.setItem('reels_direct_trigger', JSON.stringify(payload));
    alert("🎬 기도제목으로 릴스 스튜디오를 준비합니다...");
    
    if (typeof setActiveScreen === 'function') {
      setActiveScreen('reels');
    }
  };

  const handleSendPrayerToCell = (prayerText) => {
    if (!prayerText || !prayerText.trim()) return alert("전송할 기도제목이 없습니다.");
    try {
      const currentAuth = authUser || JSON.parse(localStorage.getItem('church_auth_user') || '{}');
      const uName = currentAuth?.name || '나';
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];
      
      curPrayers.push({
        id: Date.now(),
        name: uName,
        text: encryptField(prayerText.trim())
      });
      
      const nextCellData = { ...cellData, groupPrayers: curPrayers };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));
      
      if (supabase && currentAuth?.group) {
        supabase.from('cell_groups').upsert([{ 
          group_name: currentAuth.group, 
          data: { ...nextCellData, groupPrayers: curPrayers.map(p => ({ ...p, text: encryptField(p.text) })) } 
        }]).then();
      }
      
      alert(`[${prayerText.substring(0, 15)}...] 기도제목이 목장 모임으로 전송되었습니다!`);
    } catch (e) {
      alert("목장 모임 전송 중 오류가 발생했습니다.");
    }
  };

  const copyTrainingNote = () => {
    const selectedWeek = parseInt(activeTab.replace('w', ''), 10) || 0;
    let text = `[기도 훈련소 ${selectedWeek}주차 기록]\n\n`;
    if(selectedWeek===1) text += `기존 습관: ${safeTNote.w1CurHabit || ''}\n결단(장소/시간): ${safeTNote.w1TimePlace || ''}`;
    if(selectedWeek===2) text += `본문: ${safeTNote.w2Verse || ''}\n교훈: ${safeTNote.w2Lesson || ''}\n감사: ${safeTNote.w2Thanks || ''}\n고백: ${safeTNote.w2Confess || ''}\n간구: ${safeTNote.w2Request || ''}`;
    if(selectedWeek===3) text += `사건: ${safeTNote.w3Event || ''}\n질문(왜?): ${safeTNote.w3Question || ''}\n나의 회개: ${safeTNote.w3MyFault || ''}\n결단/적용: ${safeTNote.w3Action || ''}`;
    if(selectedWeek===4) text += `그 한 사람: ${safeTNote.w4Target || ''}\n기도문: ${safeTNote.w4Prayer || ''}\n나눔 문장: ${safeTNote.w4ShareMsg || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('훈련 노트가 복사되었습니다.')).catch(() => {});
    }
  };

  const handlePipelineSubmit = () => {
    if (!pipelineData.pain && !pipelineData.application) return alert("고난이나 적용 내용을 입력해주세요.");
    
    if (pipelineData.pain) {
      const prayers = JSON.parse(localStorage.getItem('goodtree_global_prayers') || '[]');
      prayers.push({ id: Date.now(), text: encryptField(pipelineData.pain.trim()), status: 'praying' });
      localStorage.setItem('goodtree_global_prayers', JSON.stringify(prayers));
    }
    
    if (pipelineData.application) {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({ id: Date.now(), date: new Date().toISOString().split('T')[0], content: encryptField(pipelineData.application.trim()) });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
    }
    
    alert("나의 고난이 기도함으로, 적용이 감사/간증으로 안전하게 나눔 되었습니다.");
    setPipelineData({ pain: '', application: '' });
  };

  const checkListContent = {
    1: [
      {id: 'w1c1', text: '내가 편안함을 느끼는 지정된 기도 장소를 정했는가?'},
      {id: 'w1c2', text: '매일 고정된 시간에 단 10분이라도 무릎을 꿇기로 결단했는가?'},
      {id: 'w1c3', text: '내 기도 목록이 내 소원 쟁취 위주였는지 정직하게 점검했는가?'}
    ],
    2: [
      {id: 'w2c1', text: '오늘 묵상할 십계명, 주기도문, 사도신경 중 한 구절을 택했는가?'},
      {id: 'w2c2', text: '무조건적인 간구 전에 말씀에서 주시는 교훈과 감사를 적었는가?'},
      {id: 'w2c3', text: '환경이나 타인을 핑계 대지 않고 나의 구체적인 죄를 고백했는가?'},
      {id: 'w2c4', text: '나의 욕망이 아닌, 붙잡은 말씀을 근거로 기도(간구)했는가?'}
    ],
    3: [
      {id: 'w3c1', text: '최근 나를 괴롭히고 힘들게 한 구체적인 사건과 문제를 직면했는가?'},
      {id: 'w3c2', text: '하나님께 "왜 이 사건이 나에게 왔는가?"라고 질문했는가?'},
      {id: 'w3c3', text: '나를 상처 준 사람의 잘못을 쓰기 전, 나의 몫(회개할 점)을 먼저 찾았는가?'}
    ],
    4: [
      {id: 'w4c1', text: '오직 하나님만 기뻐하시는 "영의 기도"로 나아갔는가?'},
      {id: 'w4c2', text: '내가 십자가를 지고 기도해야 할 "그 한 사람"을 구체적으로 특정했는가?'},
      {id: 'w4c3', text: '안전한 목장(가정) 공동체에 내 죄와 결단을 나눌 문장을 준비했는가?'}
    ]
  };

  const renderSeminar = () => (
    <div className="flex flex-col">
      <SectionHeader title="마틴 루터와 김양재 목사에게 배우는 기도" desc="기도는 인간이 이뤄내는 종교적 성취가 아니라, 하나님 말씀에 대한 반응이자 응답입니다." isDark={isDark} />
      <ContentTitle isDark={isDark}>PART 1. 마틴 루터에게 배우는 기도</ContentTitle>
      <ContentP isDark={isDark}><strong>1. 이발사 페터에게 보낸 편지:</strong> 루터의 기도론은 1535년에 쓴 소책자 『단순한 기도의 방법』에 잘 나타납니다. 친구인 이발사 페터 베스켄도르프가 기도를 어려워하자, 루터가 자신의 습관을 편지로 정리해 보내준 것입니다.</ContentP>
      <ContentP isDark={isDark}><strong>2. 기도의 순서:</strong> 기도(oratio) → 묵상(meditatio) → 시련(tentatio). 골방에 들어가 무릎 꿇고 겸손히 성령의 도우심을 구하는 데서 모든 묵상이 시작되어야 한다는 것입니다. 이는 인간이 올라가는 상승 구조가 아니라, 하나님이 말씀을 통해 내려오시는 하강 구조입니다.</ContentP>
      <ContentP isDark={isDark}><strong>3. 네 겹 묵상법:</strong> 십계명, 사도신경, 주기도문의 본문을 한 구절씩 떼어 다음 네 겹으로 되새기는 것입니다.<br/>① 교훈(가르침): 이 구절이 오늘 나에게 요구하는 것은 무엇인가?<br/>② 감사: 이 구절과 관련해 하나님께 감사할 고백은 무엇인가?<br/>③ 고백(회개): 이 구절에 비추어 내가 회개할 것은 무엇인가?<br/>④ 기도(간구): 이 구절을 근거로 내가 하나님께 구할 것은 무엇인가?</ContentP>

      <ContentTitle isDark={isDark}>PART 2. 김양재 목사(우리들교회)에게 배우는 기도</ContentTitle>
      <ContentP isDark={isDark}><strong>1. Question Time:</strong> Quiet Time을 Question Time으로 바꿔 부릅니다. 반복되는 고난 속에서 "이 사건이 왜 나에게 왔는가, 여기서 봐야 할 나의 몫은 무엇인가"를 묻는 훈련을 통해 삶이 해석된다는 요지입니다.</ContentP>
      <ContentP isDark={isDark}><strong>2. 기도는 응답이다:</strong> 하나님이 먼저 말씀하시면 그 말씀에 답하는 것이 기도입니다.</ContentP>
      <ContentP isDark={isDark}><strong>3. 회개가 곧 최고의 응답이다:</strong> 억울한 일을 당했을 때조차 자신의 죄를 보고 회개했다면 그것이 최고의 응답이라고 가르칩니다.</ContentP>

      <ContentTitle isDark={isDark}>PART 3. 두 가르침이 만나는 지점</ContentTitle>
      <ul className={`list-disc pl-5 space-y-1.5 mt-1 text-[13px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <li>기도의 출발점은 '내 뜻'이 아니라 하나님이다.</li>
        <li>회개(고백)는 기도의 부산물이 아니라 핵심 요소다.</li>
        <li>기도는 반복되는 일상 훈련이다.</li>
      </ul>
    </div>
  );

  const renderWeek = (weekNum, title, desc, fields) => (
    <div className="flex flex-col">
      <SectionHeader title={title} desc={desc} isDark={isDark} />
      <ContentTitle isDark={isDark}>거룩한 성화를 향한 순종의 궤적</ContentTitle>
      <div className="flex flex-col mb-4">
        {(checkListContent[weekNum] || []).map(item => <CheckItem key={item.id} isChecked={safeChk[item.id]||false} onToggle={() => toggleChk(item.id)} label={item.text} isDark={isDark} />)}
      </div>
      <div className="flex justify-between items-end border-b border-slate-200/60 dark:border-white/10 pb-1.5 mb-3">
        <h3 className={`text-[13.5px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>실전 훈련 노트</h3>
        <button type="button" onClick={copyTrainingNote} className="text-[11.5px] font-bold text-rose-500 hover:underline cursor-pointer">내용 복사하기</button>
      </div>
      {fields.map(f => <InputBox key={f.id} id={f.id} label={f.label} placeholder={f.placeholder} isTextarea={f.isTextarea} stateObj={safeTNote} stateSetter={setTNote} isDark={isDark} />)}
    </div>
  );

  const renderPrayerRoom = () => (
    <div className="flex flex-col items-center justify-center min-h-[480px] w-full py-4 animate-fade-in">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11.5px] font-black mb-4">
        <IconSparkles /> 임재의 골방
      </div>

      {activePrayerList.length === 0 ? (
        <div className={`text-center my-6 py-12 px-6 rounded-[24px] border border-dashed ${isDark ? 'border-white/10 bg-[#1C1C1E]/20' : 'border-slate-300 bg-white/40'} w-full max-w-sm`}>
           <p className="text-[13.5px] font-bold text-slate-400 mb-3">등록된 기도제목이 없습니다.</p>
           <button 
             type="button"
             onClick={() => openModal && openModal('globalPrayer')} 
             className="px-4 py-2 rounded-xl text-[12px] font-black text-white bg-rose-500 shadow-xs cursor-pointer"
           >
             새 기도제목 등록하기
           </button>
        </div>
      ) : (
        <div className="w-full max-w-xl">
          <div className="w-full flex overflow-x-auto snap-x snap-mandatory gap-3 px-1 pb-6 hide-scrollbar touch-pan-x">
            {activePrayerList.map((prayer, idx) => (
               <div 
                 key={prayer.id || idx} 
                 className={`shrink-0 w-[92%] sm:w-[88%] snap-center rounded-[24px] border backdrop-blur-2xl p-5 sm:p-7 flex flex-col justify-between min-h-[210px] transition-all shadow-sm ${
                   isDark ? 'bg-[#1C1C1E]/60 border-white/10 text-white' : 'bg-white/70 border-white/90 text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.03)]'
                 }`}
               >
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-black tracking-widest uppercase text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-400/20">
                      {prayer.category}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* 🌟 몰입 기도실 카드 내 릴스 원터치 변환 버튼 */}
                      <button 
                        type="button"
                        onClick={() => handleExportToReels(prayer.text, prayer.category)}
                        className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                        title="이 기도제목으로 3초 릴스 제작"
                      >
                        <span>🎬</span> 릴스 변환
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleSendPrayerToCell(prayer.text)}
                        className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        title="목장 모임 식구 기도제목으로 전송"
                      >
                        <IconUsers /> 목장으로
                      </button>
                      <span className="text-[11.5px] font-bold text-slate-400 font-mono ml-0.5">
                        {idx + 1} / {activePrayerList.length}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-[16px] sm:text-[19px] font-black leading-relaxed break-keep my-auto py-2">
                    "{prayer.text}"
                  </h1>

                  <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-400 pt-2 border-t border-slate-200/40 dark:border-white/5">
                    <span>옆으로 넘겨 다음 기도문 보기 →</span>
                    <span>기도 중 🙏</span>
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* 타이머 */}
      <div className="flex flex-col items-center gap-0.5 mt-1 mb-5">
         <span className="text-[9.5px] font-black tracking-widest text-slate-400">PRAYER TIME</span>
         <span className={`text-[36px] font-black font-mono tabular-nums leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatTime(timeElapsed)}</span>
      </div>

      {/* BGM 컨트롤러 */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center">
         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-xl ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/60 border-white/80'}`}>
            <button type="button" onClick={() => { if(isPlayingBgm) pauseBgm(); else playBgm(); }} className={`p-1 rounded-full ${isDark ? 'text-white' : 'text-slate-900'} cursor-pointer`}>
              {isPlayingBgm ? <IconPause/> : <IconPlay/>}
            </button>
            <select value={selectedBgmId} onChange={(e) => changeBgm(e.target.value)} className={`bg-transparent outline-none text-[12px] font-bold ${isDark ? 'text-white' : 'text-slate-900'} cursor-pointer`}>
               {bgmList.map(b => <option key={b.id} value={b.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{b.label}</option>)}
            </select>
         </div>
         <button type="button" onClick={() => { clearInterval(timerRef.current); setTimeElapsed(0); setActiveTab('seminar'); alert('기도를 마쳤습니다.'); }} className="px-4 py-2 rounded-xl font-black text-[12px] text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-xs cursor-pointer">
           기도 마치기
         </button>
      </div>
    </div>
  );

  const renderComfortText = () => (
    <div className="flex flex-col">
      <SectionHeader title="하나님의 위로" desc="성경 · 우리들교회 김양재 목사 · 김포좋은나무교회 이성현 목사의 가르침을 따라" isDark={isDark} />
      <ContentP isDark={isDark}>당신이 지금 서 있는 그 자리에, 하나님은 멀리 계시지 않습니다. 이 글은 성경과 김양재 목사, 이성현 목사의 가르침에 근거해 작성되었습니다.</ContentP>

      <ContentTitle isDark={isDark}>1부. 위로의 근원 — 모든 위로의 하나님</ContentTitle>
      <ContentP isDark={isDark}>위로의 근원은 하나님 자신이시고, 위로는 환난 중에 오며 다른 사람에게로 흘러가도록 설계되어 있습니다. 이사야 40장 1절은 심판 이후 "내 백성을 위로하라"며 회복의 문을 엽니다. 이사야 41장 10절은 함께하심, 하나님 되심, 굳세게 하심, 도우심, 붙드심이라는 다섯 가지 손길로 구체적인 위로를 약속합니다.</ContentP>

      <ContentTitle isDark={isDark}>2부. 당신의 어려움은 무엇입니까</ContentTitle>
      <ContentP isDark={isDark}>마음이 무너질 때, 시편 42편 5절처럼 내 영혼에게 "왜 낙심하니"라고 정직하게 묻고 하나님을 바라보아야 합니다. 여호와는 마음이 상한 자를 가까이 하시고 상처를 싸매시는 분입니다 (시 34:18, 147:3). 몸이 아플 때, 병상에서 붙드시는 하나님(시 41:3)을 신뢰하며 공동체에 알려 함께 기도해야 합니다 (약 5:14-15). 관계가 힘들 때는 먼저 나를 용서하신 하나님을 기억해야 합니다 (엡 4:32). 고난이 이어질 때, 주님은 짐을 없애는 대신 "내 멍에를 메고 배우라"며 쉼을 약속하십니다 (마 11:28-30).</ContentP>

      <ContentTitle isDark={isDark}>3부. 김양재 목사(우리들교회)가 삶으로 보여준 위로</ContentTitle>
      <ContentP isDark={isDark}>김양재 목사는 유방암 6개월 투병 중 레위기 제사법을 읽으며 고통을 산 제물(롬 12:1)로 이해했고, 환자들과 위로를 나누었습니다. 30대에 사별한 직후 60대 과부를 위로하러 찾아간 일화는 고린도후서 1장 4절의 원리가 실제 삶에서 이루어진 장면입니다. 큐티(QT)는 "왜 이 사건이 나에게 왔는가"를 묻는 Question Time이며, 목장 소그룹에서 자신의 치부를 드러내고 위로를 받습니다.</ContentP>

      <ContentTitle isDark={isDark}>4부. 이성현 목사(김포좋은나무교회)가 전하는 위로</ContentTitle>
      <ContentP isDark={isDark}>김포좋은나무교회는 매일 아침 6시 새벽기도와 매달 첫째 주 저녁 8시 '기적이 상식이 되는 5일의 기도' 모임을 가집니다. 이성현 목사는 CBS TV강단 159회 설교 "수고하고 무거운 짐이 쉽고 가벼워지려면"에서, 짐이 아예 없어지는 것이 아니라 예수님의 멍에를 함께 멜 때 무게가 달라진다는 마태복음 11장 본문의 논리를 전했습니다.</ContentP>

      <ContentTitle isDark={isDark}>5부. 성경과 두 목회자가 만나는 지점</ContentTitle>
      <ul className={`list-disc pl-5 space-y-1 mt-1 text-[13px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <li>위로는 짐을 없애는 것이 아니라, 짐을 지는 방식을 바꾸는 것입니다.</li>
        <li>고린도후서 1:4 원리처럼 위로받은 사람이 위로하는 사람이 됩니다.</li>
        <li>위로는 상황을 회피하지 않는 정직한 마주함과 질문에서 시작됩니다.</li>
      </ul>
    </div>
  );

  const renderComfortJournal = () => (
    <div className="flex flex-col">
      <SectionHeader title="위로 저널 및 파이프라인" desc="나의 삶에 대입하기" isDark={isDark} />
      
      <ContentTitle isDark={isDark}>6부. 위로를 받는 우리의 자세 (체크리스트)</ContentTitle>
      <div className="flex flex-col mb-3">
        <CheckItem isChecked={safeComfortChecks['c1'] || false} onToggle={() => toggleComfortCheck('c1')} label="내가 구하는 것이 '상황의 변화'인가, '하나님 자신'인가? (고후 1:3-4)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c2'] || false} onToggle={() => toggleComfortCheck('c2')} label="지금 내 마음 상태를 하나님께 정직하게 아뢰었는가? (시 42:5)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c3'] || false} onToggle={() => toggleComfortCheck('c3')} label="혼자 견디지 않고 공동체에 알려 기도를 구했는가? (약 5:14-15)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c4'] || false} onToggle={() => toggleComfortCheck('c4')} label="용서하지 못한 채 붙들고 있는 관계가 있는가? (엡 4:32)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c5'] || false} onToggle={() => toggleComfortCheck('c5')} label="지금 내 짐을 예수님께 가져갔는가? (마 11:28-30)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c6'] || false} onToggle={() => toggleComfortCheck('c6')} label="받은 위로를 누군가에게 흘려보낼 수 있는가? (김양재 목사 사별 간증)" isDark={isDark} />
        <CheckItem isChecked={safeComfortChecks['c7'] || false} onToggle={() => toggleComfortCheck('c7')} label="오늘 말씀 묵상(큐티)으로 하루를 시작했는가?" isDark={isDark} />
      </div>

      <ContentTitle isDark={isDark}>7부. 삶에 대입하기 — 오늘 실천할 수 있는 것들</ContentTitle>
      <InputBox id="cj1" label="1. 매일 묵상 시간 확보" placeholder="언제 어디서 본문 해설과 적용을 들을지 적어보십시오." isTextarea stateObj={safeComfortForms} stateSetter={setComfortForms} isDark={isDark} />
      <InputBox id="cj2" label="2. 위로 일기 쓰기" placeholder="오늘 어디서 위로를 받았는가 / 오늘 누구를 위로했는가?" isTextarea stateObj={safeComfortForms} stateSetter={setComfortForms} isDark={isDark} />
      <InputBox id="cj3" label="3. 짐을 구체적으로 아뢰기" placeholder="막연히 힘들다고 기도하지 않고, 구체적인 짐을 명확히 적으십시오." isTextarea stateObj={safeComfortForms} stateSetter={setComfortForms} isDark={isDark} />
      <InputBox id="cj4" label="4. 안전한 나눔 자리 만들기" placeholder="정직하게 힘든 이야기를 꺼내도 안전한 만남 계획을 적어보십시오." isTextarea stateObj={safeComfortForms} stateSetter={setComfortForms} isDark={isDark} />
      <InputBox id="cj5" label="5. 새벽기도·설교 자료 보완" placeholder="이성현 목사님의 '위로/쉼/회복' 관련 주간 설교 내용을 누적하십시오." isTextarea stateObj={safeComfortForms} stateSetter={setComfortForms} isDark={isDark} />

      <div className="flex justify-between items-center mt-3 mb-1">
        <ContentTitle isDark={isDark}>나의 고난 기록 및 기도/나눔 전송</ContentTitle>
        <button
          type="button"
          onClick={() => handleExportToReels(pipelineData.application || pipelineData.pain, '위로와 회복')}
          className="px-3 py-1 rounded-full text-[10.5px] font-black bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          title="작성된 위로와 회복 간증을 릴스로 제작"
        >
          <span>🎬</span> 회복 릴스 변환
        </button>
      </div>

      <div className="flex flex-col gap-2.5 mt-1">
        <div className="flex flex-col gap-1">
          <label className={`text-[12px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>나의 고난과 아픔 (기도제목 자동 전송)</label>
          <textarea 
            value={pipelineData.pain} 
            onChange={(e) => setPipelineData({...pipelineData, pain: e.target.value})}
            placeholder="공동체에 기도를 요청할 나의 아픔을 적어주세요."
            className={`w-full p-2.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none min-h-[65px] border transition-all ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white/70 border-slate-200 text-slate-900'}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={`text-[12px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>나의 적용과 회복 (감사/간증 자동 전송)</label>
          <textarea 
            value={pipelineData.application} 
            onChange={(e) => setPipelineData({...pipelineData, application: e.target.value})}
            placeholder="말씀으로 짐을 어떻게 해석했는지, 적용을 적어주세요."
            className={`w-full p-2.5 text-[13px] font-medium leading-[1.7] rounded-xl outline-none resize-none min-h-[65px] border transition-all ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white/70 border-slate-200 text-slate-900'}`}
          />
        </div>
        <button type="button" onClick={handlePipelineSubmit} className="w-full py-2.5 mt-1 flex items-center justify-center gap-1.5 text-[12.5px] font-black rounded-xl text-white bg-rose-500 shadow-xs cursor-pointer hover:bg-rose-600 transition-colors">
          <IconSend /> 위로 저널 저장 및 파이프라인 전송
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0F1115]' : 'bg-[#F4F5F7]'}`}>
      
      {/* 3D 가속 최적화 오로라 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-40" style={{ transform: 'translate3d(0,0,0)' }}>
        <div 
          className="absolute -top-[10%] -left-[10%] w-[800px] max-w-[90vw] h-[800px] max-h-[90vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.35) 0%, transparent 70%)', filter: 'blur(75px)' }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[900px] max-w-[95vw] h-[900px] max-h-[95vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%)', filter: 'blur(80px)' }} 
        />
      </div>

      {/* 상단 헤더 */}
      <div className={`shrink-0 px-3 sm:px-4 py-3 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/70'}`}>
        <div className="flex items-center gap-1.5">
           <button onClick={() => setActiveScreen && setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'} cursor-pointer`}>
               <IconArrowLeft />
           </button>
           <h1 className={`text-[16.5px] font-black tracking-tight ml-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>기도와 위로 보관함</h1>
        </div>
        <button onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'} md:hidden cursor-pointer`}>
           <IconMenu />
        </button>
      </div>

      <div 
        ref={ytWrapperRef} 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -9999 }} 
      />

      {/* 단일 가로 탭 바 */}
      <div className={`flex w-full px-2.5 overflow-x-auto hide-scrollbar border-b z-20 backdrop-blur-xl shrink-0 gap-1.5 py-1.5 ${isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200/80 bg-white/40'}`}>
         {[
           { id: 'seminar', label: '세미나 가이드' },
           { id: 'w1', label: '1주차' },
           { id: 'w2', label: '2주차' },
           { id: 'w3', label: '3주차' },
           { id: 'w4', label: '4주차' },
           { id: 'prayerRoom', label: '✨ 몰입 기도실' },
           { id: 'comfortText', label: '위로의 글 묵상' },
           { id: 'comfortJournal', label: '회복 저널 및 적용' }
         ].map(tab => (
            <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)} 
               className={`px-3 py-1.5 rounded-xl text-[11.5px] font-black transition-all whitespace-nowrap cursor-pointer ${
                 activeTab === tab.id 
                   ? (tab.id === 'prayerRoom' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs')
                   : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60')
               }`}
            >
               {tab.label}
            </button>
         ))}
      </div>

      {/* 본문 뷰어 */}
      <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2.5 sm:px-4 py-3 pb-28 relative z-10">
        {activeTab === 'prayerRoom' ? (
          renderPrayerRoom()
        ) : (
          <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 animate-fade-in">
            
            <div className="w-full lg:w-[260px] flex flex-col gap-2.5 shrink-0">
               <div className={`p-3.5 rounded-2xl border backdrop-blur-2xl flex flex-col gap-2 ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/70 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}>
                  <span className={`text-[12.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>나의 영적 기록 현황</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <StatBox title="나의 기도" count={`${prayingMy.length}건`} onClick={() => openModal && openModal('globalPrayer')} isDark={isDark} />
                    <StatBox title="중보 기도" count={`${prayingInter.length}건`} onClick={() => openModal && openModal('globalIntercession')} isDark={isDark} />
                    <StatBox title="훈련 노트" count={safeTNote.w1CurHabit || safeTNote.w4Prayer ? '작성중' : '대기'} onClick={() => setActiveTab('w1')} isDark={isDark} />
                    <StatBox title="위로 저널" count={safeComfortForms.cj1 ? '작성중' : '대기'} onClick={() => setActiveTab('comfortJournal')} isDark={isDark} />
                  </div>
               </div>

               {secretPrayers.length > 0 && (
                 <div className={`p-3.5 rounded-2xl border backdrop-blur-2xl flex flex-col gap-1.5 ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/70 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}>
                    <span className="text-[11.5px] font-black text-rose-500 flex items-center gap-1"><IconQuote/> 중보 기도의 손길</span>
                    <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-rose-500/40 max-h-[140px] overflow-y-auto hide-scrollbar">
                       {secretPrayers.map(sp => (
                         <div key={sp.id} className="text-[11.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">"{sp.content}"</div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            <div className={`flex-1 p-4 sm:p-6 rounded-2xl border backdrop-blur-2xl ${isDark ? 'bg-[#1C1C1E]/50 border-white/10 text-white' : 'bg-white/70 border-white/80 text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}>
               {activeTab === 'seminar' && renderSeminar()}
               {activeTab === 'w1' && renderWeek(1, '나의 기도 습관 점검과 결단', '형식적인 기도를 멈추고, 지정된 장소와 시간에서 하나님과 독대하는 훈련을 시작합니다.', [{id:'w1CurHabit', label:'1. 나의 기존 기도 습관 분석', placeholder:'솔직하게 적어보세요.', isTextarea:true}, {id:'w1TimePlace', label:'2. 고정 기도 시간 및 장소 결단', placeholder:'예: 매일 밤 10시 30분, 내 방 책상 앞', isTextarea:false}])}
               {activeTab === 'w2' && renderWeek(2, '루터의 네 겹 묵상 기도', '내 소원을 먼저 말하기 전, 말씀에서 교훈, 감사, 회개를 먼저 끌어냅니다.', [{id:'w2Verse', label:'1. 오늘의 본문', placeholder:'묵상할 한 구절을 적으세요...', isTextarea:false}, {id:'w2Lesson', label:'2. 교훈 (가르침)', placeholder:'요구하는 것은 무엇인가?', isTextarea:true}, {id:'w2Thanks', label:'3. 감사', placeholder:'감사할 것은?', isTextarea:true}, {id:'w2Confess', label:'4. 고백 (회개)', placeholder:'회개할 것은?', isTextarea:true}, {id:'w2Request', label:'5. 간구 (기도)', placeholder:'구할 것은?', isTextarea:true}])}
               {activeTab === 'w3' && renderWeek(3, '질문의 시간과 회개의 기도', '고난 속에서 이유를 질문하고, 남 탓을 넘어 나의 몫(회개)을 발견합니다.', [{id:'w3Event', label:'1. 직면한 사건', placeholder:'힘든 사건이나 억울한 일...', isTextarea:false}, {id:'w3Question', label:'2. 질문하기 (Question Time)', placeholder:'왜 이 사건이 나에게 왔는가?', isTextarea:true}, {id:'w3MyFault', label:'3. 나의 몫 (회개)', placeholder:'본질적인 나의 죄는 무엇인가?', isTextarea:true}, {id:'w3Action', label:'4. 오늘의 구체적인 적용', placeholder:'당장 실천할 행동 하나', isTextarea:true}])}
               {activeTab === 'w4' && renderWeek(4, '한 사람을 위한 영의 기도', '십자가를 지고 기도해야 할 그 한 사람을 품고 공동체에 나눕니다.', [{id:'w4Target', label:'1. 품어야 할 그 한 사람', placeholder:'이름과 기도 이유...', isTextarea:false}, {id:'w4Prayer', label:'2. 영의 기도문', placeholder:'구원을 위한 기도를 작성하세요...', isTextarea:true}, {id:'w4ShareMsg', label:'3. 목장 나눔 요약', placeholder:'나눌 나의 치부와 결단 요약', isTextarea:true}])}
               {activeTab === 'comfortText' && renderComfortText()}
               {activeTab === 'comfortJournal' && renderComfortJournal()}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
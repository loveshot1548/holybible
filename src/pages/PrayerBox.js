// src/pages/PrayerBox.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  Menu,
  Check,
  Play,
  Pause,
  Send,
  Users,
  Target,
  Copy,
  Plus
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
  if (plainText.startsWith(ENC_PREFIX_V2) || plainText.startsWith(ENC_PREFIX_V1)) return plainText;
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
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

function loadYouTubeIframeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      resolve(window.YT);
    };
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
}

const SectionHeader = ({ title, desc, borderClass, textSub }) => (
  <div className={`space-y-1 border-b ${borderClass} pb-3 mb-3.5 text-left`}>
    <h2 className="text-[16.5px] font-bold tracking-tight">{title}</h2>
    <p className={`text-[12.5px] leading-relaxed ${textSub} break-keep`}>{desc}</p>
  </div>
);

const ContentTitle = ({ children }) => (
  <h3 className="text-[14px] font-bold mt-4 mb-1.5 text-[#2563EB] text-left">{children}</h3>
);

const ContentP = ({ children, textSub }) => (
  <p className={`text-[13.5px] leading-[1.8] mb-2.5 break-keep whitespace-pre-wrap text-left ${textSub}`}>
    {children}
  </p>
);

const InputBox = ({ id, label, placeholder, isTextarea = false, stateObj = {}, stateSetter, inputClass }) => (
  <div className="space-y-1 mb-3 text-left">
    <label className="text-[12.5px] font-bold block">{label}</label>
    {isTextarea ? (
      <textarea
        rows={3}
        value={(stateObj && stateObj[id]) || ''}
        onChange={(e) => stateSetter && stateSetter({ ...(stateObj || {}), [id]: e.target.value })}
        placeholder={placeholder}
        className={`w-full p-2.5 text-[13.5px] leading-relaxed rounded-xl outline-none resize-none border select-text ${inputClass}`}
      />
    ) : (
      <input
        type="text"
        value={(stateObj && stateObj[id]) || ''}
        onChange={(e) => stateSetter && stateSetter({ ...(stateObj || {}), [id]: e.target.value })}
        placeholder={placeholder}
        className={`w-full h-10 px-3 text-[13.5px] font-medium rounded-xl outline-none border select-text ${inputClass}`}
      />
    )}
  </div>
);

const CheckItem = ({ isChecked = false, onToggle, label, borderClass, textMain, textSub }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-start gap-2.5 py-2 border-b ${borderClass} last:border-b-0 text-left cursor-pointer`}
  >
    <span
      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        isChecked ? 'bg-[#2563EB] border-[#2563EB] text-white' : borderClass
      }`}
    >
      {isChecked && <Check className="w-3 h-3" />}
    </span>
    <span className={`text-[13px] font-medium leading-snug ${isChecked ? `${textSub} line-through` : textMain}`}>
      {label}
    </span>
  </button>
);

export default function PrayerBox({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  globalPrayers = [],
  globalIntercessions = [],
  openModal,
  getArr,
  authUser
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

  const [secretPrayers, setSecretPrayers] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('prayerRoom');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const fetchSecretPrayers = async () => {
      try {
        const { data } = await supabase
          .from('secret_injections')
          .select('*')
          .eq('type', 'prayer')
          .order('created_at', { ascending: false });
        if (data && isMounted) {
          setSecretPrayers(data.map((p) => ({ ...p, content: decryptField(p.content) })));
        }
      } catch (_) {}
    };
    fetchSecretPrayers();

    const sub = supabase
      .channel('secret_prayers_fixed_chan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_injections', filter: 'type=eq.prayer' }, (payload) => {
        if (isMounted && payload.new) {
          setSecretPrayers((prev) => [{ ...payload.new, content: decryptField(payload.new.content) }, ...prev]);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, []);

  const safePrayers = (getArr ? getArr(globalPrayers) : Array.isArray(globalPrayers) ? globalPrayers : []).filter((p) => p != null);
  const safeIntercessions = (getArr ? getArr(globalIntercessions) : Array.isArray(globalIntercessions) ? globalIntercessions : []).filter((p) => p != null);

  const prayingMy = safePrayers.filter((p) => (typeof p === 'object' ? p.status === 'praying' : true));
  const prayingInter = safeIntercessions.filter((p) => (typeof p === 'object' ? p.status === 'praying' : true));
  const answeredMy = safePrayers.filter((p) => (typeof p === 'object' ? p.status === 'answered' : false));

  // YouTube BGM 플레이어
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
  const [tNote, setTNote] = useState(
    () =>
      getLocal('pb_tnote_final_v14', {
        w1CurHabit: '', w1TimePlace: '', w2Verse: '', w2Lesson: '', w2Thanks: '', w2Confess: '', w2Request: '',
        w3Event: '', w3Question: '', w3MyFault: '', w3Action: '', w4Target: '', w4Prayer: '', w4ShareMsg: ''
      }) || {}
  );
  const [comfortChecks, setComfortChecks] = useState(() => getLocal('pb_com_chk_final_v14', {}) || {});
  const [comfortForms, setComfortForms] = useState(() => getLocal('pb_com_forms_final_v14', {}) || {});
  const [pipelineData, setPipelineData] = useState({ pain: '', application: '' });

  useEffect(() => setLocal('pb_chk_final_v14', chk), [chk]);
  useEffect(() => setLocal('pb_tnote_final_v14', tNote), [tNote]);
  useEffect(() => setLocal('pb_com_chk_final_v14', comfortChecks), [comfortChecks]);
  useEffect(() => setLocal('pb_com_forms_final_v14', comfortForms), [comfortForms]);

  const toggleChk = (id) => setChk((p) => ({ ...(p || {}), [id]: !p?.[id] }));
  const toggleComfortCheck = (id) => setComfortChecks((p) => ({ ...(p || {}), [id]: !p?.[id] }));

  const trainingCompletionRate = useMemo(() => {
    const checkedCount = Object.values(chk || {}).filter(Boolean).length;
    return Math.min(100, Math.round((checkedCount / 14) * 100));
  }, [chk]);

  useEffect(() => {
    if (activeTab === 'prayerRoom') {
      timerRef.current = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    isPlayerReadyRef.current = false;
    const container = document.createElement('div');
    if (ytWrapperRef.current) ytWrapperRef.current.appendChild(container);

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled || !container) return;
      try {
        ytPlayerRef.current = new YT.Player(container, {
          height: '1',
          width: '1',
          videoId: selectedBgmId,
          playerVars: { autoplay: 0, playsinline: 1, loop: 1, playlist: selectedBgmId, controls: 0 },
          events: {
            onReady: () => {
              isPlayerReadyRef.current = true;
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) setIsPlayingBgm(true);
              else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setIsPlayingBgm(false);
            }
          }
        });
      } catch (_) {}
    });

    return () => {
      cancelled = true;
      isPlayerReadyRef.current = false;
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
      if (container.parentNode) {
        try {
          container.parentNode.removeChild(container);
        } catch (_) {}
      }
      setIsPlayingBgm(false);
    };
  }, []);

  const playBgm = () => {
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      try {
        ytPlayerRef.current.playVideo();
      } catch (_) {}
    }
  };
  const pauseBgm = () => {
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch (_) {}
    }
  };
  const changeBgm = (id) => {
    setSelectedBgmId(id);
    if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(id);
      } catch (_) {}
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activePrayerList = useMemo(() => {
    const my = prayingMy.map((p, i) => ({
      id: typeof p === 'object' ? p.id || `my_${i}` : `my_${i}`,
      text: typeof p === 'object' ? decryptField(p.text || p.content || '') : decryptField(String(p)),
      category: '나의 기도'
    }));
    const inter = prayingInter.map((p, i) => ({
      id: typeof p === 'object' ? p.id || `inter_${i}` : `inter_${i}`,
      text: typeof p === 'object' ? decryptField(p.text || p.content || '') : decryptField(String(p)),
      category: '중보 기도'
    }));
    return [...my, ...inter].filter((item) => item.text && item.text.trim());
  }, [prayingMy, prayingInter]);

  const handleMarkAsAnswered = (prayer) => {
    if (!window.confirm('이 기도가 응답되었습니까? 감사 일기장에도 함께 기록됩니다.')) return;
    try {
      const curList = JSON.parse(localStorage.getItem('goodtree_global_prayers') || localStorage.getItem('globalPrayers') || '[]');
      const nextList = curList.map((item) =>
        item.id === prayer.id || decryptField(item.text) === prayer.text
          ? { ...item, status: 'answered', answeredDate: new Date().toISOString().split('T')[0] }
          : item
      );
      localStorage.setItem('goodtree_global_prayers', JSON.stringify(nextList));
      localStorage.setItem('globalPrayers', JSON.stringify(nextList));

      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: encryptField(`[기도 응답 감사]\n제목: ${prayer.text}\n\n신실하신 하나님께서 기도를 들으시고 응답하셨습니다.`)
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast('응답받은 기도가 감사 일기장으로 기록되었습니다.');
    } catch (_) {
      showToast('처리 중 오류가 발생했습니다.');
    }
  };

  const handleExportToApplyTracker = (prayerText) => {
    if (!prayerText || !prayerText.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      localStorage.setItem(
        'apply_tracker_items',
        JSON.stringify([
          { id: Date.now(), date: new Date().toISOString().split('T')[0], text: `[기도 중 순종 결단] ${prayerText.trim()}`, category: '개인 영성', source: 'prayer', completed: false },
          ...saved
        ])
      );
      window.dispatchEvent(new Event('storage'));
      showToast('삶의 실천 트래커에 등록되었습니다.');
    } catch (_) {
      showToast('등록에 실패했습니다.');
    }
  };

  const handleSendPrayerToCell = (prayerText) => {
    if (!prayerText || !prayerText.trim()) return showToast('전송할 기도제목이 없습니다.');
    try {
      const currentAuth = authUser || JSON.parse(localStorage.getItem('church_auth_user') || '{}');
      const uName = currentAuth?.name || '나';
      const cellData = JSON.parse(localStorage.getItem('global_cell_data') || '{}');
      const curPrayers = Array.isArray(cellData.groupPrayers) ? [...cellData.groupPrayers] : [];

      curPrayers.push({ id: Date.now(), name: uName, text: encryptField(prayerText.trim()) });
      const nextCellData = { ...cellData, groupPrayers: curPrayers };
      localStorage.setItem('global_cell_data', JSON.stringify(nextCellData));

      if (supabase && currentAuth?.group) {
        supabase.from('cell_groups').upsert([{ group_name: currentAuth.group, data: nextCellData }]).then();
      }
      showToast('목장 모임으로 기도제목이 전송되었습니다.');
    } catch (_) {
      showToast('목장 모임 전송 중 오류가 발생했습니다.');
    }
  };

  const copyTrainingNote = () => {
    const selectedWeek = parseInt(activeTab.replace('w', ''), 10) || 0;
    let text = `[기도 훈련소 ${selectedWeek}주차 기록]\n\n`;
    if (selectedWeek === 1) text += `기존 습관: ${tNote.w1CurHabit || ''}\n결단(장소/시간): ${tNote.w1TimePlace || ''}`;
    if (selectedWeek === 2) text += `본문: ${tNote.w2Verse || ''}\n교훈: ${tNote.w2Lesson || ''}\n감사: ${tNote.w2Thanks || ''}\n고백: ${tNote.w2Confess || ''}\n간구: ${tNote.w2Request || ''}`;
    if (selectedWeek === 3) text += `사건: ${tNote.w3Event || ''}\n질문: ${tNote.w3Question || ''}\n회개: ${tNote.w3MyFault || ''}\n적용: ${tNote.w3Action || ''}`;
    if (selectedWeek === 4) text += `그 한 사람: ${tNote.w4Target || ''}\n기도문: ${tNote.w4Prayer || ''}\n나눔: ${tNote.w4ShareMsg || ''}`;

    navigator.clipboard?.writeText(text).then(() => showToast('훈련 노트가 복사되었습니다.')).catch(() => {});
  };

  const handleExportTrainingToTracker = () => {
    const selectedWeek = parseInt(activeTab.replace('w', ''), 10) || 0;
    const actionItem =
      selectedWeek === 1 ? tNote.w1TimePlace : selectedWeek === 2 ? tNote.w2Request : selectedWeek === 3 ? tNote.w3Action : tNote.w4ShareMsg;
    if (!actionItem || !actionItem.trim()) return showToast('이관할 훈련 결단 내용이 없습니다.');
    handleExportToApplyTracker(`[기도훈련 ${selectedWeek}주차] ${actionItem.trim()}`);
  };

  const handlePipelineSubmit = () => {
    if (!pipelineData.pain && !pipelineData.application) return showToast('고난이나 적용 내용을 입력해주세요.');
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
    showToast('기도함과 감사 일기장으로 전송되었습니다.');
    setPipelineData({ pain: '', application: '' });
  };

  const checkListContent = {
    1: [
      { id: 'w1c1', text: '내가 편안함을 느끼는 지정된 기도 장소를 정했는가?' },
      { id: 'w1c2', text: '매일 고정된 시간에 단 10분이라도 무릎을 꿇기로 결단했는가?' },
      { id: 'w1c3', text: '내 기도 목록이 소원 쟁취 위주였는지 정직하게 점검했는가?' }
    ],
    2: [
      { id: 'w2c1', text: '십계명, 주기도문, 사도신경 중 한 구절을 택했는가?' },
      { id: 'w2c2', text: '간구 전에 말씀에서 주시는 교훈과 감사를 적었는가?' },
      { id: 'w2c3', text: '타인을 핑계 대지 않고 나의 구체적인 죄를 고백했는가?' },
      { id: 'w2c4', text: '붙잡은 말씀을 근거로 기도(간구)했는가?' }
    ],
    3: [
      { id: 'w3c1', text: '최근 나를 힘들게 한 구체적인 사건을 직면했는가?' },
      { id: 'w3c2', text: '하나님께 "왜 이 사건이 나에게 왔는가?"라고 질문했는가?' },
      { id: 'w3c3', text: '상대의 잘못보다 나의 회개할 몫을 먼저 찾았는가?' }
    ],
    4: [
      { id: 'w4c1', text: '하나님만 기뻐하시는 영의 기도로 나아갔는가?' },
      { id: 'w4c2', text: '기도해야 할 그 한 사람을 구체적으로 특정했는가?' },
      { id: 'w4c3', text: '안전한 공동체에 나눌 결단 문장을 준비했는가?' }
    ]
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

  const renderWeek = (weekNum, title, desc, fields) => (
    <div>
      <SectionHeader title={title} desc={desc} borderClass={borderClass} textSub={textSub} />
      <ContentTitle>체크리스트</ContentTitle>
      <div className="mb-4">
        {(checkListContent[weekNum] || []).map((item) => (
          <CheckItem
            key={item.id}
            isChecked={Boolean(chk[item.id])}
            onToggle={() => toggleChk(item.id)}
            label={item.text}
            borderClass={borderClass}
            textMain={textMain}
            textSub={textSub}
          />
        ))}
      </div>
      <div className={`flex flex-wrap justify-between items-center border-b ${borderClass} pb-2 mb-3 gap-2`}>
        <h3 className="text-[14px] font-bold">실전 훈련 노트</h3>
        <div className="flex items-center gap-3 text-[12px] font-bold">
          <button type="button" onClick={handleExportTrainingToTracker} className="text-[#0D9488] hover:underline flex items-center gap-1 cursor-pointer">
            <Target className="w-3.5 h-3.5" /> 실천 이관
          </button>
          <button type="button" onClick={copyTrainingNote} className="text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> 복사
          </button>
        </div>
      </div>
      {fields.map((f) => (
        <InputBox
          key={f.id}
          id={f.id}
          label={f.label}
          placeholder={f.placeholder}
          isTextarea={f.isTextarea}
          stateObj={tNote}
          stateSetter={setTNote}
          inputClass={inputClass}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative overflow-hidden select-none ${pageBg} ${textMain}`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 숨김 YouTube BGM 마운트 */}
      <div
        ref={ytWrapperRef}
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -9999 }}
      />

      {/* 1. 슬림 고정 상단 헤더 */}
      <header className={`shrink-0 px-3 sm:px-5 pt-2 pb-0 border-b ${borderClass} ${surfaceBg} z-20`}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveScreen && setActiveScreen('home')}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 ${textMain}`}
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <ChurchSketchIcon name="prayer-hands" className="w-5 h-5 shrink-0 hidden sm:block" isDarkMode={isDark} />
            <h1 className="text-[15px] font-bold tracking-tight truncate">기도와 위로 보관함</h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'qt', label: 'QT' },
              { id: 'sermon', label: '설교' },
              { id: 'applyTracker', label: '실천' },
              { id: 'diary', label: '일기' },
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
        <div className="max-w-[1200px] mx-auto flex overflow-x-auto hide-scrollbar gap-1.5 pb-2">
          {[
            { id: 'prayerRoom', label: '몰입 기도실' },
            { id: 'seminar', label: '세미나 가이드' },
            { id: 'w1', label: '1주차' },
            { id: 'w2', label: '2주차' },
            { id: 'w3', label: '3주차' },
            { id: 'w4', label: '4주차' },
            { id: 'comfortText', label: '위로의 글' },
            { id: 'comfortJournal', label: '회복 저널' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. 메인 스크롤 뷰포트 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        {activeTab === 'prayerRoom' ? (
          /* 몰입 기도실 */
          <div className="max-w-[680px] mx-auto flex flex-col items-center space-y-4 pt-2">
            <div className="w-full flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[12px] font-bold">
                임재의 골방
              </span>
              <button
                type="button"
                onClick={() => openModal && openModal('globalPrayer')}
                className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-[12px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 기도 추가
              </button>
            </div>

            {activePrayerList.length === 0 ? (
              <div className={`w-full py-12 px-6 rounded-2xl border border-dashed ${borderClass} ${surfaceBg} text-center space-y-3`}>
                <p className={`text-[14px] font-bold ${textSub}`}>등록된 기도제목이 없습니다.</p>
                <button
                  type="button"
                  onClick={() => openModal && openModal('globalPrayer')}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-bold cursor-pointer"
                >
                  새 기도제목 등록하기
                </button>
              </div>
            ) : (
              <div className="w-full flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 hide-scrollbar">
                {activePrayerList.map((prayer, idx) => (
                  <article
                    key={prayer.id || idx}
                    className={`shrink-0 w-[92%] sm:w-[86%] snap-center rounded-2xl border ${borderClass} ${surfaceBg} p-5 flex flex-col justify-between min-h-[210px] space-y-4`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB]">
                        {prayer.category}
                      </span>
                      <span className={`text-[12px] font-mono font-bold ${textSub}`}>
                        {idx + 1} / {activePrayerList.length}
                      </span>
                    </div>

                    <h2 className="text-[16.5px] sm:text-[18px] font-bold leading-relaxed break-keep">
                      “{prayer.text}”
                    </h2>

                    <div className={`pt-3 border-t ${borderClass} flex flex-wrap gap-1.5`}>
                      <button
                        type="button"
                        onClick={() => handleMarkAsAnswered(prayer)}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-[#0D9488]/12 text-[#0D9488] flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> 응답 감사
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportToApplyTracker(prayer.text)}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-[#2563EB]/10 text-[#2563EB] flex items-center gap-1 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" /> 순종 실천
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPrayerToCell(prayer.text)}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-[#D97706]/12 text-[#D97706] flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" /> 목장으로
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* 타이머 & BGM 컨트롤 */}
            <div className={`w-full p-4 rounded-2xl border ${borderClass} ${surfaceBg} flex flex-col sm:flex-row items-center justify-between gap-3`}>
              <div className="text-center sm:text-left">
                <span className={`text-[10.5px] font-mono font-bold ${textSub} block`}>PRAYER TIMER</span>
                <span className="text-[30px] font-mono font-bold tabular-nums leading-tight">{formatTime(timeElapsed)}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${borderClass} ${subBg}`}>
                  <button
                    type="button"
                    onClick={() => (isPlayingBgm ? pauseBgm() : playBgm())}
                    className="p-1 text-[#2563EB] cursor-pointer"
                    aria-label="BGM 재생"
                  >
                    {isPlayingBgm ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <select
                    value={selectedBgmId}
                    onChange={(e) => changeBgm(e.target.value)}
                    className="bg-transparent outline-none text-[12.5px] font-bold cursor-pointer"
                  >
                    {bgmList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    clearInterval(timerRef.current);
                    setTimeElapsed(0);
                    setActiveTab('seminar');
                    showToast('기도를 마쳤습니다.');
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-[12.5px] bg-[#2563EB] text-white cursor-pointer"
                >
                  기도 마치기
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 세미나 · 4주 훈련 · 위로 · 회복 저널 (PC 2단 / 모바일 1단) */
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            <aside className="lg:col-span-4 space-y-3">
              <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                <span className="text-[13px] font-bold block">기도 현황</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: '나의 기도', count: `${prayingMy.length}건`, onClick: () => openModal && openModal('globalPrayer') },
                    { title: '중보 기도', count: `${prayingInter.length}건`, onClick: () => openModal && openModal('globalIntercession') },
                    { title: '응답 감사', count: `${answeredMy.length}건`, onClick: () => setActiveScreen && setActiveScreen('diary') },
                    { title: '훈련 완수', count: `${trainingCompletionRate}%`, onClick: () => setActiveTab('w1') }
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={s.onClick}
                      className={`p-2.5 rounded-xl border ${borderClass} ${subBg} text-left cursor-pointer hover:border-[#2563EB]`}
                    >
                      <span className={`text-[11px] font-bold ${textSub} block`}>{s.title}</span>
                      <span className="text-[15px] font-mono font-bold block mt-0.5">{s.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {secretPrayers.length > 0 && (
                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                  <span className="text-[12.5px] font-bold text-[#D97706] block">중보 기도의 손길</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto hide-scrollbar">
                    {secretPrayers.map((sp) => (
                      <p key={sp.id} className={`text-[12.5px] leading-relaxed pl-2.5 border-l-2 border-[#D97706] ${textSub}`}>
                        “{sp.content}”
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <section className={`lg:col-span-8 p-4 sm:p-5 rounded-xl border ${borderClass} ${surfaceBg}`}>
              {activeTab === 'seminar' && (
                <div>
                  <SectionHeader
                    title="마틴 루터와 김양재 목사에게 배우는 기도"
                    desc="기도는 종교적 성취가 아니라 하나님 말씀에 대한 반응이자 응답입니다."
                    borderClass={borderClass}
                    textSub={textSub}
                  />
                  <ContentTitle>PART 1. 마틴 루터에게 배우는 기도</ContentTitle>
                  <ContentP textSub={textSub}>
                    <strong>1. 이발사 페터에게 보낸 편지:</strong> 1535년 『단순한 기도의 방법』에서 기도의 순서를 기도(oratio) → 묵상(meditatio) → 시련(tentatio)으로 제시합니다.
                  </ContentP>
                  <ContentP textSub={textSub}>
                    <strong>2. 네 겹 묵상법:</strong> 본문 한 구절을 교훈(가르침) → 감사 → 고백(회개) → 기도(간구)의 네 겹으로 되새깁니다.
                  </ContentP>
                  <ContentTitle>PART 2. 김양재 목사에게 배우는 기도</ContentTitle>
                  <ContentP textSub={textSub}>
                    <strong>1. Question Time:</strong> 반복되는 고난 속에서 “이 사건이 왜 나에게 왔는가, 내가 봐야 할 나의 몫은 무엇인가”를 묻는 훈련입니다.
                  </ContentP>
                  <ContentP textSub={textSub}>
                    <strong>2. 회개가 최고의 응답이다:</strong> 억울한 상황에서도 자신의 죄를 보고 회개했다면 그것이 최고의 응답입니다.
                  </ContentP>
                </div>
              )}

              {activeTab === 'w1' &&
                renderWeek(1, '나의 기도 습관 점검과 결단', '지정된 장소와 시간에서 하나님과 독대하는 훈련을 시작합니다.', [
                  { id: 'w1CurHabit', label: '1. 나의 기존 기도 습관 분석', placeholder: '솔직하게 적어보세요.', isTextarea: true },
                  { id: 'w1TimePlace', label: '2. 고정 기도 시간 및 장소 결단', placeholder: '예: 매일 밤 10시 30분, 내 방 책상 앞', isTextarea: false }
                ])}

              {activeTab === 'w2' &&
                renderWeek(2, '루터의 네 겹 묵상 기도', '말씀에서 교훈, 감사, 회개를 먼저 끌어냅니다.', [
                  { id: 'w2Verse', label: '1. 오늘의 본문', placeholder: '묵상할 한 구절...', isTextarea: false },
                  { id: 'w2Lesson', label: '2. 교훈 (가르침)', placeholder: '요구하는 것은 무엇인가?', isTextarea: true },
                  { id: 'w2Thanks', label: '3. 감사', placeholder: '감사할 것은?', isTextarea: true },
                  { id: 'w2Confess', label: '4. 고백 (회개)', placeholder: '회개할 것은?', isTextarea: true },
                  { id: 'w2Request', label: '5. 간구 (기도)', placeholder: '구할 것은?', isTextarea: true }
                ])}

              {activeTab === 'w3' &&
                renderWeek(3, '질문의 시간과 회개의 기도', '고난 속에서 나의 회개할 몫을 발견합니다.', [
                  { id: 'w3Event', label: '1. 직면한 사건', placeholder: '힘든 사건이나 억울한 일...', isTextarea: false },
                  { id: 'w3Question', label: '2. 질문하기 (Question Time)', placeholder: '왜 이 사건이 나에게 왔는가?', isTextarea: true },
                  { id: 'w3MyFault', label: '3. 나의 몫 (회개)', placeholder: '본질적인 나의 죄는 무엇인가?', isTextarea: true },
                  { id: 'w3Action', label: '4. 오늘의 구체적인 적용', placeholder: '당장 실천할 행동 하나', isTextarea: true }
                ])}

              {activeTab === 'w4' &&
                renderWeek(4, '한 사람을 위한 영의 기도', '기도해야 할 그 한 사람을 품고 공동체에 나눕니다.', [
                  { id: 'w4Target', label: '1. 품어야 할 그 한 사람', placeholder: '이름과 기도 이유...', isTextarea: false },
                  { id: 'w4Prayer', label: '2. 영의 기도문', placeholder: '구원을 위한 기도문...', isTextarea: true },
                  { id: 'w4ShareMsg', label: '3. 목장 나눔 요약', placeholder: '나눌 나의 결단 요약', isTextarea: true }
                ])}

              {activeTab === 'comfortText' && (
                <div>
                  <SectionHeader
                    title="하나님의 위로"
                    desc="성경 · 우리들교회 김양재 목사 · 김포좋은나무교회 이성현 목사의 가르침을 따라"
                    borderClass={borderClass}
                    textSub={textSub}
                  />
                  <ContentTitle>1부. 위로의 근원 — 모든 위로의 하나님</ContentTitle>
                  <ContentP textSub={textSub}>
                    위로의 근원은 하나님 자신이시며, 위로는 환난 중에 와서 다른 사람에게로 흘러가도록 설계되어 있습니다 (사 40:1, 사 41:10).
                  </ContentP>
                  <ContentTitle>2부. 당신의 어려움은 무엇입니까</ContentTitle>
                  <ContentP textSub={textSub}>
                    마음이 무너질 때 시편 42편 5절처럼 정직하게 묻고 하나님을 바라보며, 병상에서도 공동체에 알려 함께 기도해야 합니다 (시 34:18, 약 5:14-15, 마 11:28-30).
                  </ContentP>
                  <ContentTitle>3부. 김양재 목사 &amp; 이성현 목사가 전하는 위로</ContentTitle>
                  <ContentP textSub={textSub}>
                    위로는 짐을 없애는 것이 아니라 예수님의 멍에를 함께 메어 짐을 지는 방식을 바꾸는 것입니다. 위로받은 사람이 위로하는 사람이 됩니다 (고후 1:4).
                  </ContentP>
                </div>
              )}

              {activeTab === 'comfortJournal' && (
                <div>
                  <SectionHeader title="위로 저널 및 파이프라인" desc="나의 삶에 대입하고 기도함·감사일기로 연결합니다." borderClass={borderClass} textSub={textSub} />

                  <ContentTitle>위로를 받는 우리의 자세</ContentTitle>
                  <div className="mb-4">
                    {[
                      ['c1', "내가 구하는 것이 '상황의 변화'인가, '하나님 자신'인가? (고후 1:3-4)"],
                      ['c2', '지금 내 마음 상태를 하나님께 정직하게 아뢰었는가? (시 42:5)'],
                      ['c3', '혼자 견디지 않고 공동체에 알려 기도를 구했는가? (약 5:14-15)'],
                      ['c4', '용서하지 못한 채 붙들고 있는 관계가 있는가? (엡 4:32)'],
                      ['c5', '지금 내 짐을 예수님께 가져갔는가? (마 11:28-30)'],
                      ['c6', '받은 위로를 누군가에게 흘려보낼 수 있는가?'],
                      ['c7', '오늘 말씀 묵상(큐티)으로 하루를 시작했는가?']
                    ].map(([k, label]) => (
                      <CheckItem
                        key={k}
                        isChecked={Boolean(comfortChecks[k])}
                        onToggle={() => toggleComfortCheck(k)}
                        label={label}
                        borderClass={borderClass}
                        textMain={textMain}
                        textSub={textSub}
                      />
                    ))}
                  </div>

                  <ContentTitle>오늘 실천할 것들</ContentTitle>
                  <InputBox id="cj1" label="1. 매일 묵상 시간 확보" placeholder="언제 어디서 묵상할지 적어보세요." isTextarea stateObj={comfortForms} stateSetter={setComfortForms} inputClass={inputClass} />
                  <InputBox id="cj2" label="2. 위로 일기 쓰기" placeholder="오늘 어디서 위로를 받았는가 / 누구를 위로했는가?" isTextarea stateObj={comfortForms} stateSetter={setComfortForms} inputClass={inputClass} />
                  <InputBox id="cj3" label="3. 짐을 구체적으로 아뢰기" placeholder="구체적인 짐을 명확히 적어보세요." isTextarea stateObj={comfortForms} stateSetter={setComfortForms} inputClass={inputClass} />

                  <ContentTitle>나의 고난 기록 및 기도/나눔 전송</ContentTitle>
                  <div className="space-y-2.5">
                    <textarea
                      rows={3}
                      value={pipelineData.pain}
                      onChange={(e) => setPipelineData({ ...pipelineData, pain: e.target.value })}
                      placeholder="기도제목으로 자동 전송할 나의 아픔과 고난..."
                      className={`w-full p-3 text-[13.5px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                    />
                    <textarea
                      rows={3}
                      value={pipelineData.application}
                      onChange={(e) => setPipelineData({ ...pipelineData, application: e.target.value })}
                      placeholder="감사/간증으로 자동 전송할 나의 적용과 회복..."
                      className={`w-full p-3 text-[13.5px] rounded-xl border outline-none resize-none select-text ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={handlePipelineSubmit}
                      className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4" /> 위로 저널 저장 및 전송
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
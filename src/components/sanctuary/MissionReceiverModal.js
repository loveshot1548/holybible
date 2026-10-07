// src/components/sanctuary/MissionReceiverModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [AES-256 종단간 암복호화 유틸리티]
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

// =====================================================================
// 🛠️ [UUID & 정수 ID 상호 변환 헬퍼] DB uuid 컬럼 오류 원천 방어
// =====================================================================
const parseMissionIdFromDb = (rawId) => {
  if (!rawId) return 1;
  const str = String(rawId).trim();
  // '00000000-0000-0000-0000-000000000101' 형식인 경우 끝자리 정수 추출
  if (str.startsWith('00000000-0000-0000-0000-')) {
    const tail = str.replace('00000000-0000-0000-0000-', '');
    const num = parseInt(tail, 10);
    return isNaN(num) ? 1 : num;
  }
  // 일반 정수 문자열인 경우
  const num = parseInt(str, 10);
  return isNaN(num) ? str : num;
};

// 🌟 [DB 미조회 시 100% 오프라인 작동 보장용 12종 마스터 템플릿]
const DEFAULT_FALLBACK_TEMPLATES = [
  {
    id: 1,
    leader_type: 'shindong',
    title: '🚗 조수석 카섹스 (차량 밀착 제압)',
    space: '차량 조수석 풀 플랫',
    leader_guide: '조수석 시트를 완전히 눕히고 모하나의 옷을 벗겨 알몸으로 개방시킨 뒤, 단단히 선 자지를 밀착시키고 양손으로 모하나의 엉덩이를 강하게 들어 올리며 질 내벽 깊숙이 관통해 사정까지 멈춤 없이 피스톤질을 꽂아 넣는다.',
    partner_mission: '모하나는 두 다리로 신동의 허리를 단단히 감아 조이고, 차체가 흔들리는 동안 신동의 목덜미를 끌어안아 밀착 유격을 0으로 유지한다.',
    time_limit_sec: 180,
    steps: [
      { id: 101, step_order: 1, instruction: '차량 조수석 시트를 완전히 눕히고 알몸으로 개방한다.', requires_photo_auth: false },
      { id: 102, step_order: 2, instruction: '신동의 허리를 감싸 안고 단단히 밀착 결합한 하체 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '차량 뒷좌석 처벌', description: '차량 뒷좌석에서 엎드린 채 강제 결합 100회 및 복종' }
  },
  {
    id: 2,
    leader_type: 'shindong',
    title: '🌃 통창 테라스 야경 (후방 밀착 & 오픈 스릴)',
    space: '프라이빗 테라스 통창 앞',
    leader_guide: '모하나를 창문에 손을 짚게 하고 뒤에서 가슴을 움켜쥐며 유두를 입으로 거칠게 빨아당긴다. 젖은 보지에 자지를 수평으로 깊숙이 찔러 넣고 야경을 배경 삼아 거친 템포로 몰아붙인다.',
    partner_mission: '창문에 이마와 손을 밀착한 채 신음이 밖으로 새어 나가지 않도록 호흡을 조절하고, 뒤에서 쳐올리는 반동을 허리로 버텨낸다.',
    time_limit_sec: 120,
    steps: [
      { id: 201, step_order: 1, instruction: '창문에 양손을 짚고 엉덩이를 뒤로 치켜든다.', requires_photo_auth: false },
      { id: 202, step_order: 2, instruction: '야경 배경 창문에 밀착한 알몸 뒤태와 엉덩이 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '스팽킹 30회', description: '창문에 밀착한 상태로 엉덩이 스팽킹 30회 및 신음 금지' }
  },
  {
    id: 3,
    leader_type: 'shindong',
    title: '🍳 주방 식탁 (M자 수직 개방 & 강습)',
    space: '주방 대리석 아일랜드 식탁',
    leader_guide: '모하나를 식탁 위에 걸터앉히고 다리를 M자로 완전히 벌려 보지를 빨아주며 애액을 넘치게 만든 뒤, 자지를 수직으로 세워 체중을 싣고 깊숙이 내려찍는다.',
    partner_mission: '식탁 모서리를 양손으로 꽉 쥐고 허리를 활처럼 젖혀 진입 각도를 최대로 열어주며, 신동의 어깨에 다리를 걸쳐 지탱한다.',
    time_limit_sec: 120,
    steps: [
      { id: 301, step_order: 1, instruction: '대리석 식탁 위에 걸터앉아 다리를 M자로 완전히 벌려 개방한다.', requires_photo_auth: false },
      { id: 302, step_order: 2, instruction: '식탁 모서리를 잡고 완전히 젖은 상태의 M자 다리 개방 사진을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 무릎 꿇기 & 애무 거부', description: '식탁 아래에서 무릎 꿇고 10분간 사정 허락 없이 봉사' }
  },
  {
    id: 4,
    leader_type: 'shindong',
    title: '🌳 심야 공원벤치 (외투 은폐 & 일탈 결합)',
    space: '인적 없는 심야 야외 벤치',
    leader_guide: '외투로 둘의 하체를 덮은 채 모하나의 보지를 손가락으로 적신 뒤, 기습적으로 자지를 밀어 넣어 소리 없는 피스톤으로 절정 직전까지 밀어붙인다.',
    partner_mission: '외투가 흘러내리지 않도록 옷깃을 단단히 붙잡고, 지나가는 사람이 없는지 긴장감을 유지하며 신동의 귀에만 낮게 숨소리를 흘린다.',
    time_limit_sec: 60,
    steps: [
      { id: 401, step_order: 1, instruction: '외투를 덮고 신동의 무릎 위에 다리를 벌려 조용히 착좌한다.', requires_photo_auth: false },
      { id: 402, step_order: 2, instruction: '외투 속 은밀한 밀착 상태 사진을 촬영하여 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '야외 키스 & 노출 스릴 벌칙', description: '외투를 5초간 전면 개방한 채 신동에게 입맞춤하고 복종' }
  },
  {
    id: 5,
    leader_type: 'shindong',
    title: '🚿 스팀 샤워부스 (온수 마찰 & 전신 결합)',
    space: '타일 샤워부스 온수 스팀',
    leader_guide: '샤워기 온수를 맞으며 벽면에 모하나를 세우고 보지를 입으로 진득하게 빨아준 뒤, 물기로 미끄러운 보지에 자지를 단숨에 밀어 넣어 질내사정까지 거세게 털어 넣는다.',
    partner_mission: '타일 벽에 등을 기대어 미끄러지지 않도록 한쪽 다리를 신동의 허리에 걸고, 신동의 젖은 목을 감싸 안아 체중을 분산한다.',
    time_limit_sec: 120,
    steps: [
      { id: 501, step_order: 1, instruction: '샤워기 온수를 틀고 타일 벽면에 등을 붙여 선다.', requires_photo_auth: false },
      { id: 502, step_order: 2, instruction: '물에 젖은 몸으로 타일 벽에 기대어 한쪽 다리를 든 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '찬물 샤워 & 벽면 고정 5분', description: '벽면에 등을 붙인 채 5분간 꼼짝없이 정지' }
  },
  {
    id: 6,
    leader_type: 'shindong',
    title: '🛏️ 침실 정중앙 매트리스 (완전 전라 융합)',
    space: '침실 매트리스 정중앙',
    leader_guide: '전라 상태에서 모하나의 가슴을 입에 머금고 유두를 세운 뒤, 다리를 어깨에 얹고 자지를 자궁 끝까지 한계치로 박아 넣으며 뜨겁게 질내사정으로 마감한다.',
    partner_mission: '침대 시트를 움켜쥐고 신동이 쳐올릴 때마다 골반을 함께 들어 올리며 내벽의 조임을 극대화한다.',
    time_limit_sec: 120,
    steps: [
      { id: 601, step_order: 1, instruction: '침대 정중앙에서 완전 전라로 다리를 어깨 너비로 벌리고 눕는다.', requires_photo_auth: false },
      { id: 602, step_order: 2, instruction: '골반을 들어 올려 자궁구까지 완전히 개방된 상태를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '사정 방지 속박 & 클리 방치', description: '절정 직전 멈춤 3회 및 엉덩이 스팽킹 20대' }
  },
  {
    id: 101,
    leader_type: 'mohana',
    title: '🚗 조수석 카섹스 : 모하나의 상위 제압 (Car Cowgirl Command)',
    space: '밀폐된 차 안 조수석 플랫',
    leader_guide: '조수석 시트를 눕힌 뒤 신동을 아래에 깔고 그 위에 완전히 올라타세요. 신동의 양팔을 머리 위로 눌러 고정하고, 자지 위에 앉아 골반을 천천히 내리누르며 깊이와 왕복 속도를 모하나가 100% 통제합니다.',
    partner_mission: '신동은 절대 허리를 먼저 쳐올리지 마세요. 양손은 시트 상단을 잡은 채 모하나가 체중을 싣고 내려앉는 압력을 온전히 견디며, 모하나의 허리와 엉덩이 균형만 양손으로 단단히 받쳐주세요.',
    time_limit_sec: 120,
    steps: [
      { id: 1011, step_order: 1, instruction: '신동을 조수석 시트에 눕히고 양팔을 머리 위로 눌러 제압한다.', requires_photo_auth: false },
      { id: 1012, step_order: 2, instruction: '신동의 몸 위에 완전히 착좌하여 내리누른 상위 제압 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '신동의 역공 100회', description: '주도권을 박탈당하고 신동에게 하체 제압당한 채 전립선 자극' }
  }
];

const QUICK_REPLIES = [
  '❤️ 지금 먹으러 갈게',
  '⏳ 싸지말고 참아',
  '🔥 그대로 멈추지 마',
  '👑 넌 내노예야 기다려'
];

const IconCamera = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;

export default function MissionReceiverModal({ currentUserName = '' }) {
  // 🌟 [보안 1단계] 모하나 기기 여부를 안전하게 검증
  const resolveIsTargetMohana = () => {
    let raw = currentUserName || '';
    if (!raw && typeof window !== 'undefined') {
      try {
        const storedChurch = localStorage.getItem('church_auth_user');
        if (storedChurch) {
          const parsed = JSON.parse(storedChurch);
          raw = parsed.name || parsed.user_name || parsed.username || parsed.nickname || '';
        }
        if (!raw) {
          raw = localStorage.getItem('user_name') || localStorage.getItem('login_user_name') || '';
        }
      } catch (e) {}
    }

    const clean = String(raw).trim().toLowerCase();
    if (clean.includes('정신동') || clean.includes('shindong')) return false;

    return (
      clean === '모하나' ||
      clean === 'mohana' ||
      clean.startsWith('모하나(') ||
      clean.startsWith('mohana(')
    );
  };

  const isTargetMohana = resolveIsTargetMohana();

  const [showModal, setShowModal] = useState(false);
  const [session, setSession] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [steps, setSteps] = useState([]);

  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedQuickReply, setSelectedQuickReply] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [panicMode, setPanicMode] = useState(false);

  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  const reportStatusToShindong = useCallback(async (status, quickReplyText = null) => {
    if (!supabase) return;
    try {
      const updatePayload = {
        partner_status: status,
        updated_at: new Date().toISOString()
      };
      if (quickReplyText) {
        updatePayload.partner_quick_reply = encryptSecret(quickReplyText);
      }
      await supabase
        .from('mission_dispatch_status')
        .upsert({ id: 1, ...updatePayload }, { onConflict: 'id' });
    } catch (e) {}
  }, []);

  // 🌟 [핵심 개선] DB 스키마 UUID 타입 호환 + 12종 마스터 템플릿 즉각 연결
  const fetchSessionData = useCallback(async () => {
    if (!supabase || !isTargetMohana) return;
    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from('active_mission_session')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (sessionErr || !sessionData || !sessionData.is_active) {
        setShowModal(false);
        setSession(null);
        setIsAccepted(false);
        setTimeLeft(null);
        releaseWakeLock();
        return;
      }

      // 만료 시간 체크 (설정된 경우에만)
      if (sessionData.expires_at) {
        const expTime = new Date(sessionData.expires_at).getTime();
        if (expTime > 0 && expTime + (10 * 60 * 1000) < Date.now()) {
          setShowModal(false);
          setSession(null);
          return;
        }
      }

      // UUID 또는 정수 형태를 정규 미션 ID로 변환
      const currentMissionId = parseMissionIdFromDb(sessionData.current_mission_id);

      // 1. 내장 템플릿에서 우선 안전 매칭
      let templatePayload = DEFAULT_FALLBACK_TEMPLATES.find(t => t.id === currentMissionId) || DEFAULT_FALLBACK_TEMPLATES[0];

      // 2. DB에서 커스텀 템플릿이 있는지 보완 조회 (실패해도 무방)
      try {
        const { data: mData } = await supabase
          .from('mission_templates_v3')
          .select('*')
          .eq('id', currentMissionId)
          .maybeSingle();

        if (mData) {
          templatePayload = {
            ...templatePayload,
            ...mData,
            title: decryptSecret(mData.title) || templatePayload.title,
            space: decryptSecret(mData.space) || templatePayload.space,
            leader_guide: decryptSecret(mData.leader_guide) || templatePayload.leader_guide,
            partner_mission: decryptSecret(mData.partner_mission) || templatePayload.partner_mission
          };
        }
      } catch (e) {}

      // 스텝 정보 조회
      let decryptedSteps = [];
      try {
        const { data: sData } = await supabase
          .from('mission_steps')
          .select('*')
          .eq('mission_id', currentMissionId)
          .order('step_order', { ascending: true });

        if (sData && sData.length > 0) {
          decryptedSteps = sData.map(s => ({
            ...s,
            instruction: decryptSecret(s.instruction)
          }));
        }
      } catch (e) {}

      if (decryptedSteps.length === 0) {
        decryptedSteps = templatePayload.steps || [
          { id: 999, step_order: 1, instruction: '신동님의 지시에 따라 자세를 잡고 준비하세요.', requires_photo_auth: false }
        ];
      }

      // 패널티 프로토콜 조회
      let penaltyPayload = templatePayload.penalty || { title: '즉각 처벌', description: '지시에 절대 복종' };
      try {
        const { data: pData } = await supabase
          .from('secret_penalty_protocols')
          .select('*')
          .eq('mission_id', currentMissionId)
          .maybeSingle();

        if (pData) {
          penaltyPayload = {
            title: decryptSecret(pData.title),
            description: decryptSecret(pData.description)
          };
        }
      } catch (e) {}

      setSession(sessionData);
      setMissionData({
        ...templatePayload,
        title: decryptSecret(templatePayload.title),
        space: decryptSecret(templatePayload.space),
        leader_guide: decryptSecret(templatePayload.leader_guide),
        partner_mission: decryptSecret(templatePayload.partner_mission),
        time_limit_sec: templatePayload.time_limit_sec || 120,
        penalty: penaltyPayload
      });

      setSteps(decryptedSteps);
      setShowModal(true); // 🌟 모하나 기기에서 모달 즉시 개방
      requestWakeLock();

      if (sessionData.step_status === 'reading' || sessionData.step_status === 'idle') {
        reportStatusToShindong('read');
      } else if (sessionData.step_status === 'acting') {
        setIsAccepted(true);
      }
    } catch (e) {
      console.error("[MissionReceiver] Sync Error:", e);
    }
  }, [isTargetMohana, reportStatusToShindong]);

  // 실시간 수신 및 이벤트 동기화
  useEffect(() => {
    if (!isTargetMohana) return;

    fetchSessionData();

    const handleTriggerEvent = () => {
      fetchSessionData();
      setShowModal(true);
    };
    window.addEventListener('trigger_mission_modal', handleTriggerEvent);

    const pollingTimer = setInterval(fetchSessionData, 2500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSessionData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const subChannel = supabase.channel('mohana_mission_stream_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_mission_session' 
      }, () => {
        fetchSessionData();
      }).subscribe();

    return () => {
      window.removeEventListener('trigger_mission_modal', handleTriggerEvent);
      clearInterval(pollingTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      supabase.removeChannel(subChannel);
      releaseWakeLock();
    };
  }, [isTargetMohana, fetchSessionData]);

  // 타임어택 카운트다운
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && session?.step_status !== 'completed' && session?.step_status !== 'failed') {
      if (timeLeft <= 10 && navigator.vibrate) {
        try { navigator.vibrate(80); } catch (e) {}
      }
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && session?.step_status !== 'completed' && session?.step_status !== 'failed') {
      handleTimeOver();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, session]);

  const handleTimeOver = async () => {
    if (!session || session.step_status === 'failed') return;
    try {
      await supabase
        .from('active_mission_session')
        .update({ step_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (navigator.vibrate) {
        try { navigator.vibrate([300, 100, 300, 100, 500]); } catch (e) {}
      }
    } catch (e) {}
  };

  const handleAcceptMission = async () => {
    setIsAccepted(true);
    const limit = missionData?.time_limit_sec || 120;
    setTimeLeft(limit);

    reportStatusToShindong('acting', selectedQuickReply);

    if (supabase) {
      await supabase.from('active_mission_session').update({
        step_status: 'acting',
        updated_at: new Date().toISOString()
      }).eq('id', 1);
    }

    if (navigator.vibrate) {
      try { navigator.vibrate([120, 80, 250, 80, 400]); } catch (e) {}
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `auth_${Date.now()}_step${session.current_step_order}.${fileExt}`;

      let uploadRes = await supabase.storage.from('auth-temp').upload(fileName, file, { upsert: true });
      let bucketName = 'auth-temp';

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from('mission-assets').upload(fileName, file, { upsert: true });
        bucketName = 'mission-assets';
      }
      if (uploadRes.error) {
        uploadRes = await supabase.storage.from('chat_attachments').upload(fileName, file, { upsert: true });
        bucketName = 'chat_attachments';
      }
      if (uploadRes.error) throw uploadRes.error;

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      await supabase.from('active_mission_session').update({
        step_status: 'pending_approval',
        auth_photo_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

    } catch (err) {
      alert("인증샷 업로드에 실패했습니다. 다시 촬영해 주세요: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextStepWithoutAuth = async () => {
    if (!session || !steps) return;
    const isLastStep = session.current_step_order >= steps.length;

    await supabase.from('active_mission_session').update({
      step_status: isLastStep ? 'completed' : 'reading',
      current_step_order: isLastStep ? session.current_step_order : session.current_step_order + 1,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
  };

  const handleSendQuickReply = (replyText) => {
    setSelectedQuickReply(replyText);
    reportStatusToShindong(isAccepted ? 'acting' : 'read', replyText);
    if (navigator.vibrate) {
      try { navigator.vibrate(50); } catch (e) {}
    }
  };

  if (!isTargetMohana || !showModal || !session || !missionData) {
    return null;
  }

  const isShindongLeader = missionData.leader_type === 'shindong';
  const currentStep = steps.find(s => s.step_order === session.current_step_order) || steps[0];
  const isFailed = session.step_status === 'failed';
  const isCompleted = session.step_status === 'completed';
  const isPending = session.step_status === 'pending_approval';

  if (panicMode) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl select-none animate-fade-in font-sans text-xs">
        <div className="w-full max-w-[380px] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 text-zinc-800 dark:text-zinc-200 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
              <span>📖</span> 오늘의 말씀 묵상 일지
            </span>
            <button
              onClick={() => setPanicMode(false)}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 font-mono text-[10px] cursor-pointer"
            >
              확인 (복귀)
            </button>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 block">
              시편 23편 1-2절
            </span>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              "여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다"
            </p>
          </div>

          <button
            onClick={() => { setPanicMode(false); setShowModal(false); releaseWakeLock(); }}
            className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-xs cursor-pointer"
          >
            묵상 닫기
          </button>
        </div>
      </div>
    );
  }

  if (isFailed) {
    const penalty = missionData.penalty;
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 bg-red-950/95 backdrop-blur-3xl animate-fade-in select-none">
        <h1 className="text-4xl font-black text-red-500 mb-2 animate-pulse">MISSION FAILED</h1>
        <p className="text-red-300 font-bold mb-8">제한 시간 초과</p>
        
        <div className="w-full max-w-sm bg-black/70 border border-red-600/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
          <h2 className="text-red-400 font-black text-lg mb-3">🚨 즉각 처벌 프로토콜</h2>
          {penalty && (penalty.title || penalty.description) ? (
            <>
              <p className="text-white font-bold text-base bg-red-900/50 p-3 rounded-xl border border-red-500/40 mb-3">
                {penalty.title}
              </p>
              <p className="text-red-200 leading-relaxed text-sm whitespace-pre-wrap">
                {penalty.description}
              </p>
            </>
          ) : (
            <p className="text-red-200 text-sm leading-relaxed">
              신동님의 즉결 처벌 심판이 대기 중입니다.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 bg-emerald-950/95 backdrop-blur-3xl animate-fade-in select-none">
        <h1 className="text-4xl font-black text-emerald-400 mb-2">COMPLETE</h1>
        <p className="text-emerald-200 font-bold mb-8">모든 지령 수행 및 인증 완료</p>
        <button 
          onClick={() => { setShowModal(false); releaseWakeLock(); }} 
          className="px-8 py-3.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 shadow-lg cursor-pointer"
        >
          지령창 닫기
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none font-sans text-xs">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[420px] h-[300px] rounded-full bg-rose-600/25 blur-[100px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-[410px] h-[85vh] rounded-[32px] bg-gradient-to-b from-[#160408] via-[#0A0204] to-[#050102] border-2 border-rose-600 shadow-[0_0_60px_rgba(244,63,94,0.6)] flex flex-col gap-3.5 animate-fade-in-up overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-rose-900/60 pb-3 p-6 shrink-0 bg-black/50 z-20">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-rose-500 font-bold tracking-widest uppercase mb-1">
              STEP {session.current_step_order} / {steps.length || 1}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[14px] font-mono font-black tracking-widest text-rose-400 uppercase truncate max-w-[200px]">
                {isShindongLeader ? '신동의 실전 지령' : '모하나의 지휘 프로토콜'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => setPanicMode(true)}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-bold text-[10px] cursor-pointer hover:bg-emerald-900"
              title="화면을 성경 묵상 카드로 즉시 위장"
            >
              🚨 긴급위장
            </button>
            {timeLeft !== null && (
              <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded ${timeLeft <= 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-900 text-rose-400'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* 미션 카드 본문 영역 */}
        <div className="flex-1 relative overflow-y-auto hide-scrollbar flex flex-col px-6 pb-6">
          <div className="space-y-4 pb-20">
            <div className="space-y-1 mt-2">
              <h3 className="text-[18px] font-black text-white leading-tight break-keep">
                {missionData.title}
              </h3>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-600/60 text-rose-300 font-mono text-[10.5px] font-bold">
                  📍 {missionData.space}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[10px]">
                  ⏳ 제한시간 {missionData.time_limit_sec}초
                </span>
              </div>
            </div>

            {missionData.reference_image_url && (
              <img src={missionData.reference_image_url} alt="가이드" className="w-full rounded-2xl border border-white/10 shadow-lg object-contain bg-zinc-900" />
            )}

            {currentStep && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 shadow-md">
                <span className="text-[10px] text-rose-400 font-black mb-1 block">현재 단계 지시사항</span>
                <p className="text-white text-[14px] leading-relaxed whitespace-pre-wrap font-bold">{currentStep.instruction}</p>
              </div>
            )}

            <div className="space-y-2.5 py-1">
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/60 shadow-inner">
                <span className="text-[10.5px] font-black text-rose-300 font-mono tracking-wider block mb-1">
                  {isShindongLeader ? '👑 모하나가 수행할 역할' : '👑 모하나의 지휘 지침'}
                </span>
                <p className="text-[13px] text-rose-100 font-black leading-relaxed whitespace-pre-wrap break-keep">
                  {isShindongLeader ? missionData.partner_mission : missionData.leader_guide}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/70 border border-white/15">
                <span className="text-[10.5px] font-black text-zinc-400 font-mono tracking-wider block mb-1">
                  {isShindongLeader ? '⚔️ 신동의 리드 지침' : '🛡️ 신동이 취할 자세'}
                </span>
                <p className="text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap break-keep">
                  {isShindongLeader ? missionData.leader_guide : missionData.partner_mission}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-3 border-t border-rose-950/80">
              <span className="text-[10px] font-mono text-zinc-400 block font-bold mb-2">
                신동에게 즉시 보낼 시그널:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSendQuickReply(reply)}
                    className={`py-2 px-2 rounded-xl text-[10.5px] font-bold border transition-all text-center truncate cursor-pointer ${
                      selectedQuickReply === reply
                        ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                        : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:border-rose-900'
                    }`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 제어 버튼 */}
        <div className="p-4 bg-black border-t border-white/10 shrink-0 flex items-center justify-between z-20">
          {!isAccepted ? (
            <button
              onClick={handleAcceptMission}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:opacity-90 text-white font-black text-[14px] shadow-[0_0_25px_rgba(244,63,94,0.6)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔥</span> 수락 & 실전 돌입
            </button>
          ) : isPending ? (
            <div className="w-full py-3.5 text-center bg-amber-950/50 border border-amber-600/50 rounded-2xl text-amber-400 font-bold animate-pulse text-sm">
              신동님 컨펌 대기 중...
            </div>
          ) : currentStep?.requires_photo_auth ? (
            <label className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black text-sm transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer active:scale-95">
              <IconCamera />
              {isUploading ? '전송 중...' : '인증샷 촬영 및 전송'}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={isUploading} onChange={handlePhotoUpload} />
            </label>
          ) : (
            <button 
              onClick={handleNextStepWithoutAuth} 
              className="w-full py-4 rounded-2xl font-black text-sm transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] active:scale-95"
            >
              수행 완료
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
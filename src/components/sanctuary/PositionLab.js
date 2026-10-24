// src/components/sanctuary/PositionLab.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [AES-256 종단간 암호화 유틸리티]
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

// 🌟 [핵심] Supabase UUID(RFC 4122) 100% 규격 자동 변환 헬퍼
const toValidUUID = (rawId) => {
  if (!rawId) return '00000000-0000-4000-a000-000000000001';
  const str = String(rawId).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hexNum = Number(str.replace(/[^0-9]/g, '')) || 1;
  const padded = hexNum.toString(16).padStart(12, '0');
  return `00000000-0000-4000-a000-${padded}`;
};

// =====================================================================
// 📜 [6대 장소별 12종 실전 기본 템플릿 마스터 데이터 (전 스텝/인증/패널티 완비)]
// =====================================================================
const DEFAULT_TEMPLATES = [
  // --- [PART 1] 정신동 리드 6대 실전 테마 ---
  {
    id: 1,
    uuid: '00000000-0000-4000-a000-000000000001',
    leader_type: 'shindong',
    title: '🚗 조수석 카섹스 (차량 밀착 제압)',
    space: '차량 조수석 풀 플랫',
    leader_guide: '조수석 시트를 완전히 눕히고 모하나의 옷을 벗겨 알몸으로 개방시킨 뒤, 단단히 선 자지를 밀착시키고 양손으로 모하나의 엉덩이를 강하게 들어 올리며 질 내벽 깊숙이 관통해 사정까지 멈춤 없이 피스톤질을 꽂아 넣는다.',
    partner_mission: '모하나는 두 다리로 신동의 허리를 단단히 감아 조이고, 차체가 흔들리는 동안 신동의 목덜미를 끌어안아 밀착 유격을 0으로 유지한다.',
    reference_image_url: '',
    time_limit_sec: 180,
    steps: [
      { id: 101, step_order: 1, instruction: '차량 조수석 시트를 완전히 눕히고 알몸으로 개방한다.', requires_photo_auth: false },
      { id: 102, step_order: 2, instruction: '신동의 허리를 감싸 안고 단단히 밀착 결합한 하체 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '차량 뒷좌석 처벌', description: '차량 뒷좌석에서 엎드린 채 강제 결합 100회 및 복종' }
  },
  {
    id: 2,
    uuid: '00000000-0000-4000-a000-000000000002',
    leader_type: 'shindong',
    title: '🌃 통창 테라스 야경 (후방 밀착 & 오픈 스릴)',
    space: '프라이빗 테라스 통창 앞',
    leader_guide: '모하나를 창문에 손을 짚게 하고 뒤에서 가슴을 움켜쥐며 유두를 입으로 거칠게 빨아당긴다. 젖은 보지에 자지를 수평으로 깊숙이 찔러 넣고 야경을 배경 삼아 거친 템포로 몰아붙인다.',
    partner_mission: '창문에 이마와 손을 밀착한 채 신음이 밖으로 새어 나가지 않도록 호흡을 조절하고, 뒤에서 쳐올리는 반동을 허리로 버텨낸다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 201, step_order: 1, instruction: '창문에 양손을 짚고 엉덩이를 뒤로 치켜든다.', requires_photo_auth: false },
      { id: 202, step_order: 2, instruction: '야경 배경 창문에 밀착한 알몸 뒤태와 엉덩이 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '스팽킹 30회', description: '창문에 밀착한 상태로 엉덩이 스팽킹 30회 및 신음 금지' }
  },
  {
    id: 3,
    uuid: '00000000-0000-4000-a000-000000000003',
    leader_type: 'shindong',
    title: '🍳 주방 식탁 (M자 수직 개방 & 강습)',
    space: '주방 대리석 아일랜드 식탁',
    leader_guide: '모하나를 식탁 위에 걸터앉히고 다리를 M자로 완전히 벌려 보지를 빨아주며 애액을 넘치게 만든 뒤, 자지를 수직으로 세워 체중을 싣고 깊숙이 내려찍는다.',
    partner_mission: '식탁 모서리를 양손으로 꽉 쥐고 허리를 활처럼 젖혀 진입 각도를 최대로 열어주며, 신동의 어깨에 다리를 걸쳐 지탱한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 301, step_order: 1, instruction: '대리석 식탁 위에 걸터앉아 다리를 M자로 완전히 벌려 개방한다.', requires_photo_auth: false },
      { id: 302, step_order: 2, instruction: '식탁 모서리를 잡고 완전히 젖은 상태의 M자 다리 개방 사진을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 무릎 꿇기 & 애무 거부', description: '식탁 아래에서 무릎 꿇고 10분간 사정 허락 없이 봉사' }
  },
  {
    id: 4,
    uuid: '00000000-0000-4000-a000-000000000004',
    leader_type: 'shindong',
    title: '🌳 심야 공원벤치 (외투 은폐 & 일탈 결합)',
    space: '인적 없는 심야 야외 벤치',
    leader_guide: '외투로 둘의 하체를 덮은 채 모하나의 보지를 손가락으로 적신 뒤, 기습적으로 자지를 밀어 넣어 소리 없는 피스톤으로 절정 직전까지 밀어붙인다.',
    partner_mission: '외투가 흘러내리지 않도록 옷깃을 단단히 붙잡고, 지나가는 사람이 없는지 긴장감을 유지하며 신동의 귀에만 낮게 숨소리를 흘린다.',
    reference_image_url: '',
    time_limit_sec: 60,
    steps: [
      { id: 401, step_order: 1, instruction: '외투를 덮고 신동의 무릎 위에 다리를 벌려 조용히 착좌한다.', requires_photo_auth: false },
      { id: 402, step_order: 2, instruction: '외투 속 은밀한 밀착 상태 사진을 촬영하여 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '야외 키스 & 노출 스릴 벌칙', description: '외투를 5초간 전면 개방한 채 신동에게 입맞춤하고 복종' }
  },
  {
    id: 5,
    uuid: '00000000-0000-4000-a000-000000000005',
    leader_type: 'shindong',
    title: '🚿 스팀 샤워부스 (온수 마찰 & 전신 결합)',
    space: '타일 샤워부스 온수 스팀',
    leader_guide: '샤워기 온수를 맞으며 벽면에 모하나를 세우고 보지를 입으로 진득하게 빨아준 뒤, 물기로 미끄러운 보지에 자지를 단숨에 밀어 넣어 질내사정까지 거세게 털어 넣는다.',
    partner_mission: '타일 벽에 등을 기대어 미끄러지지 않도록 한쪽 다리를 신동의 허리에 걸고, 신동의 젖은 목을 감싸 안아 체중을 분산한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 501, step_order: 1, instruction: '샤워기 온수를 틀고 타일 벽면에 등을 붙여 선다.', requires_photo_auth: false },
      { id: 502, step_order: 2, instruction: '물에 젖은 몸으로 타일 벽에 기대어 한쪽 다리를 든 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '찬물 샤워 & 벽면 고정 5분', description: '벽면에 등을 붙인 채 5분간 꼼짝없이 정지' }
  },
  {
    id: 6,
    uuid: '00000000-0000-4000-a000-000000000006',
    leader_type: 'shindong',
    title: '🛏️ 침실 정중앙 매트리스 (완전 전라 융합)',
    space: '침실 매트리스 정중앙',
    leader_guide: '전라 상태에서 모하나의 가슴을 입에 머금고 유두를 세운 뒤, 다리를 어깨에 얹고 자지를 자궁 끝까지 한계치로 박아 넣으며 뜨겁게 질내사정으로 마감한다.',
    partner_mission: '침대 시트를 움켜쥐고 신동이 쳐올릴 때마다 골반을 함께 들어 올리며 내벽의 조임을 극대화한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 601, step_order: 1, instruction: '침대 정중앙에서 완전 전라로 다리를 어깨 너비로 벌리고 눕는다.', requires_photo_auth: false },
      { id: 602, step_order: 2, instruction: '골반을 들어 올려 자궁구까지 완전히 개방된 상태를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '사정 방지 속박 & 클리 방치', description: '절정 직전 멈춤 3회 및 엉덩이 스팽킹 20대' }
  },

  // --- [PART 2] 모하나 리드 6대 실전 테마 ---
  {
    id: 101,
    uuid: '00000000-0000-4000-a000-000000000101',
    leader_type: 'mohana',
    title: '🚗 조수석 카섹스 : 모하나의 상위 제압 (Car Cowgirl Command)',
    space: '밀폐된 차 안 조수석 플랫',
    leader_guide: '조수석 시트를 눕힌 뒤 신동을 아래에 깔고 그 위에 완전히 올라타세요. 신동의 양팔을 머리 위로 눌러 고정하고, 자지 위에 앉아 골반을 천천히 내리누르며 깊이와 왕복 속도를 모하나가 100% 통제합니다.',
    partner_mission: '신동은 절대 허리를 먼저 쳐올리지 마세요. 양손은 시트 상단을 잡은 채 모하나가 체중을 싣고 내려앉는 압력을 온전히 견디며, 모하나의 허리와 엉덩이 균형만 양손으로 단단히 받쳐주세요.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1011, step_order: 1, instruction: '신동을 조수석 시트에 눕히고 양팔을 머리 위로 눌러 제압한다.', requires_photo_auth: false },
      { id: 1012, step_order: 2, instruction: '신동의 몸 위에 완전히 착좌하여 내리누른 상위 제압 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '신동의 역공 100회', description: '주도권을 박탈당하고 신동에게 하체 제압당한 채 전립선 자극' }
  },
  {
    id: 102,
    uuid: '00000000-0000-4000-a000-000000000102',
    leader_type: 'mohana',
    title: '🌃 테라스 시선 통제 (신동 시선 강탈)',
    space: '프라이빗 테라스 통창 앞',
    leader_guide: '신동을 통창 앞에 세우거나 앉힌 뒤 턱을 잡아 시선을 모하나에게 고정시킨다. 무릎 위에 걸터앉아 천천히 허리를 돌리며 신동의 호흡을 완전히 통제한다.',
    partner_mission: '야경을 보지 말고 오직 모하나의 눈과 표정만 응시한다. 모하나의 골반이 흔들리지 않도록 허벅지 바깥쪽을 단단하게 감싸 지탱한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1021, step_order: 1, instruction: '통창 앞에 신동을 앉히고 턱을 들어 시선을 자신에게 고정시킨다.', requires_photo_auth: false },
      { id: 1022, step_order: 2, instruction: '신동의 무릎 위에 걸터앉아 눈을 마주친 착좌 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '눈가리개 착용 & 무방비 자극', description: '안대를 착용한 채 신동의 손길에 10분간 저항 불가' }
  },
  {
    id: 103,
    uuid: '00000000-0000-4000-a000-000000000103',
    leader_type: 'mohana',
    title: '🍳 주방 식탁 착좌 라이딩 (수직 낙하 통제)',
    space: '주방 대리석 아일랜드 식탁',
    leader_guide: '식탁 의자에 앉은 신동의 허벅지 위에 마주 보고 올라탄 뒤 목덜미를 양손으로 감아쥔다. 수직으로 체중을 실어 허리를 짓누르며 템포를 주도한다.',
    partner_mission: '식탁에 등을 단단히 기대고 앉아 모하나의 엉덩이 밑살을 두 손으로 든든하게 받쳐 올려 수직 반동을 완벽히 서포트한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1031, step_order: 1, instruction: '식탁 의자에 앉은 신동의 허벅지 위에 마주 보고 올라탄다.', requires_photo_auth: false },
      { id: 1032, step_order: 2, instruction: '신동의 목을 감아쥐고 수직으로 내려앉은 착좌 라이딩을 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 위 강제 복종 엎드리기', description: '식탁에 엎드린 채 신동의 후배위 강습 50회 수용' }
  },
  {
    id: 104,
    uuid: '00000000-0000-4000-a000-000000000104',
    leader_type: 'mohana',
    title: '🌳 공원벤치 무릎 착좌 (외투 은폐 지령)',
    space: '인적 없는 심야 야외 벤치',
    leader_guide: '벤치에 앉은 신동의 무릎 위에 다리를 벌리고 앉아 외투로 둘을 덮는다. 신동의 귀에 "소리 내지 마"라고 속삭인 뒤 은밀하고 대담하게 골반을 움직인다.',
    partner_mission: '신음이 밖으로 새지 않도록 입술을 깨물고, 모하나의 등 뒤로 외투 자락을 감싸 쥐며 골반이 떨어지지 않게 꽉 잡아준다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1041, step_order: 1, instruction: '벤치에 앉은 신동의 무릎 위에 마주 앉아 외투로 완전히 둘을 덮는다.', requires_photo_auth: false },
      { id: 1042, step_order: 2, instruction: '외투 틈새로 신동의 숨통을 조이는 밀착 상태를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '외투 박탈 벌칙', description: '신동의 명령에 따라 외투 없이 귓속말로 사랑 고백 3회' }
  },
  {
    id: 105,
    uuid: '00000000-0000-4000-a000-000000000105',
    leader_type: 'mohana',
    title: '🚿 샤워부스 벽면 압박 (신동 벽면 고정)',
    space: '타일 샤워부스 온수 스팀',
    leader_guide: '신동을 타일 벽으로 밀어붙여 세운 뒤, 한쪽 다리를 신동의 골반에 걸쳐 올리고 온수 마찰 속에서 신동의 숨통을 조이며 결합을 지배한다.',
    partner_mission: '벽면에 등을 붙이고 미끄러지지 않도록 발을 딛는다. 모하나의 엉덩이와 허벅지를 강하게 받쳐 안아 완벽한 체중 지지대를 형성한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1051, step_order: 1, instruction: '신동을 타일 벽으로 밀어붙이고 한쪽 다리를 신동의 골반에 건다.', requires_photo_auth: false },
      { id: 1052, step_order: 2, instruction: '온수를 맞으며 신동을 벽면에 제압한 전신 결합 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '온수 세례 받침대 벌칙', description: '샤워기 온수를 직접 맞으며 신동을 입으로 봉사' }
  },
  {
    id: 106,
    uuid: '00000000-0000-4000-a000-000000000106',
    leader_type: 'mohana',
    title: '🛏️ 침실 매트리스 퀸 도미넌트 (절대 리드)',
    space: '침실 매트리스 정중앙',
    leader_guide: '신동을 침대 정중앙에 눕히고 움직이지 못하게 명령한다. 몸을 가로질러 올라타 가장 깊숙이 내려앉은 뒤 모하나가 원하는 박자로만 절정을 유도한다.',
    partner_mission: '양손을 매트리스에 고정한 채 모하나의 허락 없이 허리를 움직이지 않는다. 모하나가 탈진할 때까지 완벽한 받침대가 되어준다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1061, step_order: 1, instruction: '신동을 매트리스에 눕히고 양손을 잡고 그 위에 완전히 올라탄다.', requires_photo_auth: false },
      { id: 1062, step_order: 2, instruction: '가장 깊숙이 주저앉아 신동을 내려다보는 여왕 시점 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '절정 금지 30분', description: '신동이 사정할 때까지 모하나는 신음 소리 금지' }
  }
];

const mergeWithDefaults = (loadedList) => {
  const map = new Map();
  DEFAULT_TEMPLATES.forEach(t => map.set(t.id, { ...t }));

  if (Array.isArray(loadedList) && loadedList.length > 0) {
    loadedList.forEach(item => {
      if (!item || !item.id) return;
      const existing = map.get(item.id) || {};
      map.set(item.id, {
        ...existing,
        ...item,
        uuid: item.uuid || existing.uuid || toValidUUID(item.id),
        leader_guide: item.leader_guide || item.mohanaCommand || existing.leader_guide || '',
        partner_mission: item.partner_mission || item.shindongMission || existing.partner_mission || '',
        steps: (item.steps && item.steps.length > 0) ? item.steps : existing.steps || [],
        penalty: (item.penalty && item.penalty.title) ? item.penalty : existing.penalty || { title: '', description: '' }
      });
    });
  }

  return Array.from(map.values()).sort((a, b) => a.id - b.id);
};

export default function PositionLab({ currentUserName = '정신동' }) {
  const isOwner = currentUserName.includes('정신동');

  const [activeLeaderTab, setActiveLeaderTab] = useState('shindong');

  const [missions, setMissions] = useState(() => {
    try {
      const encryptedSaved = localStorage.getItem('custom_mission_templates_v2_enc');
      if (encryptedSaved) {
        const decryptedStr = decryptSecret(encryptedSaved);
        if (decryptedStr) {
          return mergeWithDefaults(JSON.parse(decryptedStr));
        }
      }
      const oldSaved = localStorage.getItem('custom_mission_templates');
      if (oldSaved) {
        return mergeWithDefaults(JSON.parse(oldSaved));
      }
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [selectedMissionId, setSelectedMissionId] = useState(1);

  // 폼 편집 상태
  const [editTitle, setEditTitle] = useState('');
  const [editSpace, setEditSpace] = useState('');
  const [editLeaderGuide, setEditLeaderGuide] = useState('');
  const [editPartnerMission, setEditPartnerMission] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState(60);
  const [editSteps, setEditSteps] = useState([{ id: Date.now(), step_order: 1, instruction: '', requires_photo_auth: false }]);
  const [editPenalty, setEditPenalty] = useState({ title: '', description: '' });

  const [isMissionActiveOnPartnerPhone, setIsMissionActiveOnPartnerPhone] = useState(false);
  const [testPreviewActive, setTestPreviewActive] = useState(false);

  const [panicMode, setPanicMode] = useState(false);
  const [missionTtlHours, setMissionTtlHours] = useState(3);
  const [partnerStatus, setPartnerStatus] = useState('unread');
  const [partnerAuthPhoto, setPartnerAuthPhoto] = useState(null);
  const [inspectPhotoModal, setInspectPhotoModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPanicMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const syncFormToMission = useCallback((missionId, missionList) => {
    const target = missionList.find(m => m.id === missionId);
    if (target) {
      setEditTitle(target.title || '');
      setEditSpace(target.space || '');
      setEditLeaderGuide(target.leader_guide || target.mohanaCommand || '');
      setEditPartnerMission(target.partner_mission || target.shindongMission || '');
      setEditImageUrl(target.reference_image_url || '');
      setEditTimeLimit(target.time_limit_sec || 60);
      setEditSteps(target.steps && target.steps.length > 0 ? target.steps : [{ id: Date.now(), step_order: 1, instruction: '', requires_photo_auth: false }]);
      setEditPenalty(target.penalty || { title: '', description: '' });
    }
  }, []);

  useEffect(() => {
    syncFormToMission(selectedMissionId, missions);
  }, [selectedMissionId, missions, syncFormToMission]);

  const saveEncryptedLocal = (data) => {
    localStorage.setItem('custom_mission_templates_v2_enc', encryptSecret(JSON.stringify(data)));
  };

  const fetchTemplates = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('mission_templates_v3')
        .select('*, mission_steps(*), secret_penalty_protocols(*)')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        const decryptedList = data.map(item => ({
          ...item,
          uuid: item.uuid || toValidUUID(item.id),
          title: decryptSecret(item.title),
          space: decryptSecret(item.space),
          leader_guide: decryptSecret(item.leader_guide),
          partner_mission: decryptSecret(item.partner_mission),
          steps: (item.mission_steps || [])
            .map(s => ({ ...s, instruction: decryptSecret(s.instruction) }))
            .sort((a, b) => a.step_order - b.step_order),
          penalty: item.secret_penalty_protocols?.[0] ? {
            title: decryptSecret(item.secret_penalty_protocols[0].title),
            description: decryptSecret(item.secret_penalty_protocols[0].description)
          } : null
        }));
        
        const merged = mergeWithDefaults(decryptedList);
        setMissions(merged);
        saveEncryptedLocal(merged);
      }

      const { data: sessionData } = await supabase
        .from('active_mission_session')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (sessionData) {
        if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
          setIsMissionActiveOnPartnerPhone(false);
        } else {
          setIsMissionActiveOnPartnerPhone(!!sessionData.is_active);
          setPartnerStatus(sessionData.step_status || 'unread');
          setPartnerAuthPhoto(sessionData.auth_photo_url || null);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchTemplates();
    if (!supabase) return;

    const channel = supabase.channel('realtime_mission_session_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_mission_session' }, (payload) => {
        if (payload.new) {
          setIsMissionActiveOnPartnerPhone(!!payload.new.is_active);
          if (payload.new.step_status) {
            setPartnerStatus(payload.new.step_status);
          }
          setPartnerAuthPhoto(payload.new.auth_photo_url || null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTemplates]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `mission_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('mission-assets').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('mission-assets').getPublicUrl(fileName);
      setEditImageUrl(publicUrl);
    } catch (err) { alert('이미지 업로드에 실패했습니다: ' + err.message); }
  };

  const handleSaveMission = async () => {
    if (!editTitle.trim()) return alert('미션 제목을 입력해주세요.');

    const targetUUID = toValidUUID(selectedMissionId);

    const updated = missions.map(m => {
      if (m.id === selectedMissionId) {
        return {
          ...m,
          uuid: m.uuid || targetUUID,
          leader_type: activeLeaderTab,
          title: editTitle.trim(),
          space: editSpace.trim(),
          leader_guide: editLeaderGuide.trim(),
          partner_mission: editPartnerMission.trim(),
          reference_image_url: editImageUrl,
          time_limit_sec: editTimeLimit,
          steps: editSteps,
          penalty: editPenalty
        };
      }
      return m;
    });

    setMissions(updated);
    saveEncryptedLocal(updated);

    if (supabase) {
      try {
        const payload = {
          id: selectedMissionId,
          leader_type: activeLeaderTab,
          title: encryptSecret(editTitle.trim()),
          space: encryptSecret(editSpace.trim()),
          leader_guide: encryptSecret(editLeaderGuide.trim()),
          partner_mission: encryptSecret(editPartnerMission.trim()),
          reference_image_url: editImageUrl,
          time_limit_sec: editTimeLimit
        };

        await supabase.from('mission_templates_v3').upsert([payload], { onConflict: 'id' });

        await supabase.from('mission_steps').delete().eq('mission_id', selectedMissionId);
        const stepsPayload = editSteps.map((s, i) => ({
          mission_id: selectedMissionId, 
          step_order: i + 1, 
          instruction: encryptSecret(s.instruction), 
          requires_photo_auth: !!s.requires_photo_auth
        }));
        await supabase.from('mission_steps').insert(stepsPayload);

        if (editPenalty.title) {
          await supabase.from('secret_penalty_protocols').delete().eq('mission_id', selectedMissionId);
          await supabase.from('secret_penalty_protocols').insert([{
            mission_id: selectedMissionId,
            title: encryptSecret(editPenalty.title), 
            description: encryptSecret(editPenalty.description)
          }]);
        }
      } catch (e) {}
    }

    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
    alert('🔒 미션 지령과 하드코어 설정이 성공적으로 저장되었습니다.');
  };

  const handleCreateNewMission = async () => {
    const newId = Date.now();
    const newMission = {
      id: newId,
      uuid: toValidUUID(newId),
      leader_type: activeLeaderTab,
      title: `${activeLeaderTab === 'shindong' ? '신동' : '모하나'} 신규 실전 미션`,
      space: '신규 장소 설정',
      leader_guide: '',
      partner_mission: '',
      reference_image_url: '',
      time_limit_sec: 60,
      steps: [{ id: Date.now(), step_order: 1, instruction: '새로운 행동을 지시하세요.', requires_photo_auth: true }],
      penalty: { title: '벌칙 프로토콜', description: '벌칙 내용을 기재하세요.' }
    };

    const nextMissions = [...missions, newMission];
    setMissions(nextMissions);
    setSelectedMissionId(newId);
    saveEncryptedLocal(nextMissions);
  };

  const handleDuplicateMission = async (sourceMission) => {
    const newId = Date.now();
    const duplicated = {
      ...sourceMission,
      id: newId,
      uuid: toValidUUID(newId),
      title: `${sourceMission.title} (복제)`
    };

    const nextMissions = [...missions, duplicated];
    setMissions(nextMissions);
    setSelectedMissionId(newId);
    saveEncryptedLocal(nextMissions);
    alert('📋 미션이 성공적으로 복제되었습니다.');
  };

  // 🌟 [핵심 개선] DB와 로컬에 12종 기본 지령을 완전 동기화 복구
  const handleResetToDefaultTemplates = async () => {
    if (!window.confirm('기본 12종 실전 지령을 전부 DB 및 로컬에 즉시 복구하시겠습니까?')) return;
    setMissions(DEFAULT_TEMPLATES);
    saveEncryptedLocal(DEFAULT_TEMPLATES);
    setSelectedMissionId(activeLeaderTab === 'shindong' ? 1 : 101);

    if (supabase) {
      try {
        for (const t of DEFAULT_TEMPLATES) {
          await supabase.from('mission_templates_v3').upsert([{
            id: t.id,
            leader_type: t.leader_type,
            title: encryptSecret(t.title),
            space: encryptSecret(t.space),
            leader_guide: encryptSecret(t.leader_guide),
            partner_mission: encryptSecret(t.partner_mission),
            reference_image_url: t.reference_image_url || '',
            time_limit_sec: t.time_limit_sec || 60
          }], { onConflict: 'id' });

          if (t.steps && t.steps.length > 0) {
            await supabase.from('mission_steps').delete().eq('mission_id', t.id);
            await supabase.from('mission_steps').insert(
              t.steps.map((s, i) => ({
                mission_id: t.id,
                step_order: i + 1,
                instruction: encryptSecret(s.instruction),
                requires_photo_auth: !!s.requires_photo_auth
              }))
            );
          }

          if (t.penalty && t.penalty.title) {
            await supabase.from('secret_penalty_protocols').delete().eq('mission_id', t.id);
            await supabase.from('secret_penalty_protocols').insert([{
              mission_id: t.id,
              title: encryptSecret(t.penalty.title),
              description: encryptSecret(t.penalty.description)
            }]);
          }
        }
      } catch (e) {
        console.error('기본 템플릿 DB 복원 오류:', e);
      }
    }
    alert('✨ 12종 기본 지령이 DB와 로컬에 완벽히 동기화 복구되었습니다.');
  };

  const handleDeleteMission = async (idToDelete) => {
    if (!window.confirm('이 미션 지령을 삭제하시겠습니까?')) return;
    const filtered = missions.filter(m => m.id !== idToDelete);
    const finalMissions = filtered.length > 0 ? filtered : DEFAULT_TEMPLATES;
    setMissions(finalMissions);
    saveEncryptedLocal(finalMissions);

    const nextCandidates = finalMissions.filter(m => m.leader_type === activeLeaderTab);
    if (nextCandidates.length > 0) {
      setSelectedMissionId(nextCandidates[0].id);
    }
  };

  // 🌟 [핵심 개선] 발령 시 UUID를 엄격하게 주입하여 PostgreSQL 에러 방어
  const handleToggleDispatch = async () => {
    const nextStatus = !isMissionActiveOnPartnerPhone;
    const targetMission = missions.find(m => m.id === selectedMissionId) || missions[0];

    if (nextStatus && !targetMission) {
      return alert('전송할 미션을 먼저 선택해주세요.');
    }

    setIsMissionActiveOnPartnerPhone(nextStatus);

    const validUUID = toValidUUID(targetMission.uuid || targetMission.id);
    const expiresAt = nextStatus && missionTtlHours > 0
      ? new Date(Date.now() + missionTtlHours * 60 * 60 * 1000).toISOString()
      : null;

    if (navigator.vibrate) {
      try { navigator.vibrate([100, 50, 150]); } catch (e) {}
    }

    if (supabase) {
      try {
        // 발령 활성화 시 대상 미션의 DB 존재 여부를 보장
        if (nextStatus && targetMission) {
          await supabase.from('mission_templates_v3').upsert([{
            id: targetMission.id,
            leader_type: targetMission.leader_type || activeLeaderTab,
            title: encryptSecret(targetMission.title),
            space: encryptSecret(targetMission.space),
            leader_guide: encryptSecret(targetMission.leader_guide || targetMission.mohanaCommand || ''),
            partner_mission: encryptSecret(targetMission.partner_mission || targetMission.shindongMission || ''),
            reference_image_url: targetMission.reference_image_url || '',
            time_limit_sec: targetMission.time_limit_sec || 60
          }], { onConflict: 'id' });

          if (targetMission.steps && targetMission.steps.length > 0) {
            await supabase.from('mission_steps').delete().eq('mission_id', targetMission.id);
            const stepsPayload = targetMission.steps.map((s, i) => ({
              mission_id: targetMission.id,
              step_order: i + 1,
              instruction: encryptSecret(s.instruction),
              requires_photo_auth: !!s.requires_photo_auth
            }));
            await supabase.from('mission_steps').insert(stepsPayload);
          }

          if (targetMission.penalty && targetMission.penalty.title) {
            await supabase.from('secret_penalty_protocols').delete().eq('mission_id', targetMission.id);
            await supabase.from('secret_penalty_protocols').insert([{
              mission_id: targetMission.id,
              title: encryptSecret(targetMission.penalty.title),
              description: encryptSecret(targetMission.penalty.description)
            }]);
          }
        }

        // 🌟 [UUID 주입] active_mission_session의 current_mission_id에 정수 대신 유효한 UUID를 기록!
        const sessionPayload = {
          id: 1,
          is_active: nextStatus,
          current_mission_id: nextStatus ? validUUID : null,
          step_status: nextStatus ? 'reading' : 'idle',
          current_step_order: 1,
          auth_photo_url: null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        };

        const { error: sessionError } = await supabase
          .from('active_mission_session')
          .upsert(sessionPayload, { onConflict: 'id' });

        if (sessionError) {
          alert('발령 상태 저장 오류: ' + sessionError.message);
          setIsMissionActiveOnPartnerPhone(!nextStatus);
        } else {
          alert(nextStatus ? '🔥 모하나 폰으로 실전 지령이 정상 발령되었습니다!' : '지령이 비활성화되었습니다.');
        }
      } catch (e) {
        alert('상태 반영 오류: ' + e.message);
      }
    }
  };

  const handleApprovePhoto = async (isApproved) => {
    if (!supabase) return;
    try {
      const { data: session } = await supabase.from('active_mission_session').select('*').eq('id', 1).single();
      if (!session) return;

      let totalStepsCount = 1;
      const { count } = await supabase
        .from('mission_steps')
        .select('id', { count: 'exact', head: true })
        .eq('mission_id', session.current_mission_id);
        
      if (count && count > 0) {
        totalStepsCount = count;
      } else {
        const activeMissionObj = missions.find(m => m.id === session.current_mission_id);
        totalStepsCount = activeMissionObj?.steps?.length || 1;
      }

      const nextStep = session.current_step_order + 1;
      const isLast = nextStep > totalStepsCount;

      await supabase.from('active_mission_session').update({
        step_status: isApproved ? (isLast ? 'completed' : 'reading') : 'failed',
        current_step_order: isApproved && !isLast ? nextStep : session.current_step_order,
        auth_photo_url: isApproved ? null : session.auth_photo_url,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      if (isApproved) {
        setPartnerAuthPhoto(null); 
        alert(isLast ? "모든 단계 인증을 최종 승인했습니다! 모하나 미션이 완료되었습니다." : `Step ${session.current_step_order} 인증을 승인했습니다. 다음 단계(Step ${nextStep})로 넘어갑니다.`);
      } else {
        alert("반려(FAIL) 처리했습니다. 모하나에게 즉시 패널티 프로토콜이 발동됩니다.");
      }
    } catch(e) {
      alert("승인 처리 중 오류 발생: " + e.message);
    }
  };

  const handleTabSwitch = (newTab) => {
    setActiveLeaderTab(newTab);
    const firstTarget = missions.find(m => m.leader_type === newTab);
    if (firstTarget) {
      setSelectedMissionId(firstTarget.id);
      syncFormToMission(firstTarget.id, missions);
    }
  };

  const filteredMissions = useMemo(() => {
    return missions.filter(m => m.leader_type === activeLeaderTab);
  }, [missions, activeLeaderTab]);

  if (panicMode) {
    return (
      <div className="w-full max-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 text-zinc-800 dark:text-zinc-200 shadow-xl select-none font-sans text-xs box-border overflow-hidden">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">📖</span>
            <h2 className="text-sm font-black text-zinc-900 dark:text-white">
              매일 성경 묵상 및 기도 일지
            </h2>
          </div>
          <button
            onClick={() => setPanicMode(false)}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 text-[11px] font-mono cursor-pointer"
          >
            복귀 (ESC)
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
              [오늘의 말씀] 시편 23편 1절
            </span>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              "여호와는 나의 목자시니 내게 부족함이 없으리로다."
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full bg-[#07080B] border border-rose-950/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-zinc-200 shadow-2xl select-none font-sans text-xs box-border overflow-x-hidden animate-fade-in">
      
      <div className="flex flex-col gap-3 border-b border-rose-950/60 pb-3.5 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0" />
            <span className="font-mono font-black text-xs sm:text-sm text-rose-500 tracking-wider truncate">
              ENCRYPTED DUAL MISSION VAULT
            </span>
          </div>
          <span className="text-[10.5px] text-zinc-400 block mt-0.5">
            12종 실전 지령 완비 • 양방향 실시간 암호화 전송
          </span>
        </div>

        {isOwner && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full">
            <button
              onClick={() => setPanicMode(true)}
              className="py-2 px-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/80 text-emerald-300 font-bold text-[11px] cursor-pointer text-center truncate"
              title="화면을 성경 묵상 일지로 즉시 위장 (ESC)"
            >
              🚨 긴급 위장
            </button>

            <button
              onClick={() => setTestPreviewActive(!testPreviewActive)}
              className="py-2 px-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[11px] cursor-pointer text-center truncate"
            >
              {testPreviewActive ? '✕ 시뮬 닫기' : '📱 내 폰 미리보기'}
            </button>

            <button
              onClick={handleToggleDispatch}
              className={`col-span-2 sm:col-auto py-2.5 px-3 rounded-xl font-black text-[11.5px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                isMissionActiveOnPartnerPhone
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-black border border-rose-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isMissionActiveOnPartnerPhone ? 'bg-white' : 'bg-zinc-600'}`} />
              모하나 폰 노출 {isMissionActiveOnPartnerPhone ? 'ON (발동 중)' : 'OFF (숨김)'}
            </button>
          </div>
        )}
      </div>

      {isMissionActiveOnPartnerPhone && (
        <div className="mb-3.5 p-4 rounded-xl border border-rose-600 bg-rose-950/20 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-black text-rose-400 uppercase">MOHANA STATUS</span>
            <span className={`px-2 py-1 rounded font-bold ${partnerStatus === 'pending_approval' ? 'bg-amber-600 text-white animate-bounce' : 'bg-zinc-800 text-zinc-400'}`}>
              {partnerStatus === 'pending_approval' ? '📸 인증샷 확인 요망' : partnerStatus === 'completed' ? '성공 완료' : partnerStatus === 'failed' ? '실패(패널티 발동)' : '수행 중'}
            </span>
          </div>

          {partnerAuthPhoto && partnerStatus === 'pending_approval' && (
            <div className="flex flex-col gap-2">
              <img 
                src={partnerAuthPhoto} 
                alt="인증샷" 
                onClick={() => setInspectPhotoModal(true)}
                className="w-full h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90" 
                title="클릭하여 확대 확인"
              />
              <span className="text-[10px] text-zinc-400 text-center">* 사진을 클릭하면 원본 크기로 확대 확인 가능합니다.</span>
              <div className="flex gap-2">
                <button onClick={() => handleApprovePhoto(true)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(5,150,105,0.5)] cursor-pointer">승인 (다음 스텝)</button>
                <button onClick={() => handleApprovePhoto(false)} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg border border-red-500 cursor-pointer">반려 (즉시 처벌)</button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] mt-1 border-t border-rose-900/40 pt-2">
            <span className="text-zinc-400 font-mono">자동 만료 시간:</span>
            <select
              value={missionTtlHours}
              onChange={e => setMissionTtlHours(Number(e.target.value))}
              className="bg-black border border-rose-900/60 rounded px-1.5 py-0.5 text-rose-300 font-mono outline-none cursor-pointer"
            >
              <option value="1">1시간 후</option>
              <option value="3">3시간 후</option>
              <option value="6">6시간 후</option>
              <option value="0">무제한</option>
            </select>
          </div>
        </div>
      )}

      {inspectPhotoModal && partnerAuthPhoto && (
        <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setInspectPhotoModal(false)}>
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <img src={partnerAuthPhoto} alt="인증샷 원본" className="max-h-[80vh] w-auto rounded-xl object-contain border border-white/20" />
            <button onClick={() => setInspectPhotoModal(false)} className="mt-3 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs cursor-pointer">
              확대창 닫기
            </button>
          </div>
        </div>
      )}

      {testPreviewActive && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-black to-slate-900 border border-rose-500/60 shadow-lg animate-fade-in box-border">
          <div className="flex items-center justify-between border-b border-rose-800/40 pb-1.5 mb-2">
            <span className="text-[10.5px] font-black text-rose-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              모하나 휴대폰 수신 시뮬레이션
            </span>
            <span className="text-[9.5px] font-mono text-zinc-400">PREVIEW</span>
          </div>
          <h4 className="text-xs font-black text-white truncate">{editTitle || '제목 없음'}</h4>
          <span className="text-[10px] font-mono text-rose-400 block mb-2">{editSpace || '장소 미지정'}</span>
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
            <div>
              <span className="text-[10px] font-bold text-rose-400 block">리더 지침:</span>
              <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{editLeaderGuide || '내용 없음'}</p>
            </div>
            <div className="pt-1.5 border-t border-white/5">
              <span className="text-[10px] font-bold text-indigo-400 block">파트너 지침:</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{editPartnerMission || '내용 없음'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 mb-3 w-full">
        <button
          onClick={() => handleTabSwitch('shindong')}
          className={`py-2 px-1 rounded-xl font-black text-[11px] sm:text-xs transition-all cursor-pointer border text-center truncate ${
            activeLeaderTab === 'shindong'
              ? 'bg-rose-950 text-white border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-[#101217] text-zinc-500 border-zinc-900 hover:text-zinc-300'
          }`}
        >
          🔥 정신동 리드 (6종)
        </button>

        <button
          onClick={() => handleTabSwitch('mohana')}
          className={`py-2 px-1 rounded-xl font-black text-[11px] sm:text-xs transition-all cursor-pointer border text-center truncate ${
            activeLeaderTab === 'mohana'
              ? 'bg-rose-950 text-white border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-[#101217] text-zinc-500 border-zinc-900 hover:text-zinc-300'
          }`}
        >
          👑 모하나 리드 (6종)
        </button>
      </div>

      <div className="w-full bg-[#0D1017] p-2 rounded-xl border border-white/5 mb-3 flex items-center justify-between gap-1 overflow-x-auto hide-scrollbar">
        <span className="text-[10px] font-mono text-zinc-500 font-bold shrink-0 ml-1">QUICK JUMP:</span>
        <div className="flex gap-1.5 shrink-0">
          {filteredMissions.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMissionId(m.id);
                syncFormToMission(m.id, missions);
              }}
              className={`w-8 h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                selectedMissionId === m.id
                  ? 'bg-rose-600 text-white shadow-md scale-105 border border-rose-400'
                  : 'bg-black/60 text-zinc-400 border border-white/5 hover:text-white'
              }`}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full box-border">
        <div className="space-y-2 w-full min-w-0">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
              지령 목록 ({filteredMissions.length}개)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToDefaultTemplates}
                className="text-[10px] text-zinc-400 hover:text-white cursor-pointer underline"
                title="기본 12종 템플릿 복구"
              >
                12종 복구
              </button>
              <button
                onClick={handleCreateNewMission}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                + 새 미션
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[160px] sm:max-h-[340px] overflow-y-auto hide-scrollbar w-full">
            {filteredMissions.map(m => {
              const isSelected = selectedMissionId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMissionId(m.id);
                    syncFormToMission(m.id, missions);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center w-full box-border ${
                    isSelected
                      ? 'bg-rose-950/60 border-rose-600 text-white shadow-md'
                      : 'bg-[#0E1015] border-zinc-900 text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-1.5">
                    <span className="font-bold text-xs truncate block">{m.title}</span>
                    <span className="text-[9.5px] font-mono text-zinc-500 truncate block">{m.space || '장소 미정'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateMission(m); }}
                      className="text-zinc-500 hover:text-white text-xs px-1 cursor-pointer"
                      title="복제"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMission(m.id); }}
                      className="text-zinc-500 hover:text-red-400 text-xs px-1 cursor-pointer"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 bg-[#090A0E] border border-rose-950/80 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 w-full min-w-0 box-border overflow-hidden">
          <div className="flex flex-col gap-2 p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl w-full box-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-400 text-[11px]">📸 참고 자세 가이드 사진 (선택)</span>
              <label className="bg-rose-900 hover:bg-rose-800 text-white px-2 py-1 rounded text-[10px] cursor-pointer">
                이미지 업로드 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {editImageUrl && (
              <img src={editImageUrl} alt="가이드" className="h-24 w-auto object-cover rounded border border-rose-500/50" />
            )}
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-900/30">
              <span className="font-bold text-rose-400 text-[11px]">⏳ 실전 타임어택 제한시간 (초)</span>
              <input 
                type="number" 
                value={editTimeLimit} 
                onChange={e => setEditTimeLimit(Number(e.target.value))} 
                className="w-20 px-2 py-1 bg-black border border-rose-500 text-white rounded outline-none text-right font-mono" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 box-border mt-1">
            <input
              type="text"
              placeholder="미션 제목..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full flex-1 min-w-0 px-3 py-2 rounded-xl bg-black border border-white/10 text-white text-xs font-bold outline-none focus:border-rose-500 box-border"
            />
            <input
              type="text"
              placeholder="장소 설정..."
              value={editSpace}
              onChange={(e) => setEditSpace(e.target.value)}
              className="w-full sm:w-44 shrink-0 min-w-0 px-3 py-2 rounded-xl bg-black border border-white/10 text-white text-xs outline-none focus:border-rose-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0">
            <label className="text-[10px] font-black text-rose-400 font-mono tracking-tight">
              [지휘관 지침] 리드 주체가 주도하고 움직일 행동 요령
            </label>
            <textarea
              rows={4}
              placeholder="행동 요령과 결합 각도, 템포 지침..."
              value={editLeaderGuide}
              onChange={(e) => setEditLeaderGuide(e.target.value)}
              className="w-full min-w-0 p-2.5 rounded-xl bg-black border border-white/10 text-zinc-200 text-xs leading-relaxed outline-none resize-none focus:border-rose-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0">
            <label className="text-[10px] font-black text-indigo-400 font-mono tracking-tight">
              [파트너 지침] 상대방이 취해야 할 지지/복종/서포트 요령
            </label>
            <textarea
              rows={4}
              placeholder="상대방이 고정해야 할 자세와 지지 요령..."
              value={editPartnerMission}
              onChange={(e) => setEditPartnerMission(e.target.value)}
              className="w-full min-w-0 p-2.5 rounded-xl bg-black border border-white/10 text-zinc-200 text-xs leading-relaxed outline-none resize-none focus:border-indigo-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-xl w-full box-border mt-1">
            <span className="font-bold text-indigo-400 text-[11px]">📝 수행 스텝 및 사진 인증 요구</span>
            {editSteps.map((step, idx) => (
              <div key={step.id || idx} className="flex flex-col gap-1 p-2 bg-black rounded border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold text-[10px]">Step {idx + 1}</span>
                  <label className="flex items-center gap-1 text-[10px] text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!step.requires_photo_auth} 
                      onChange={e => {
                        const newSteps = [...editSteps];
                        newSteps[idx].requires_photo_auth = e.target.checked;
                        setEditSteps(newSteps);
                      }} 
                    /> 📸 사진 인증 필수
                  </label>
                </div>
                <textarea 
                  rows={2} 
                  value={step.instruction} 
                  placeholder="세부 지시사항 입력" 
                  onChange={e => {
                    const newSteps = [...editSteps];
                    newSteps[idx].instruction = e.target.value;
                    setEditSteps(newSteps);
                  }} 
                  className="bg-transparent border-b border-zinc-800 text-white outline-none resize-none text-[11px] pb-1" 
                />
              </div>
            ))}
            <button 
              onClick={() => setEditSteps([...editSteps, { id: Date.now(), step_order: editSteps.length + 1, instruction: '', requires_photo_auth: false }])} 
              className="text-center text-indigo-400 hover:text-white font-bold text-[10px] mt-1 cursor-pointer"
            >
              + 스텝 추가
            </button>
          </div>

          <div className="flex flex-col gap-1 p-3 bg-red-950/20 border border-red-900/50 rounded-xl w-full box-border mt-1">
            <span className="font-bold text-red-400 text-[11px]">🚨 실패 시 패널티 프로토콜</span>
            <input 
              type="text" 
              placeholder="패널티 명칭 (예: 엉덩이 스팽킹 30대)" 
              value={editPenalty.title} 
              onChange={e => setEditPenalty({...editPenalty, title: e.target.value})} 
              className="bg-black border border-red-900 px-2 py-1.5 text-white rounded outline-none text-[11px]" 
            />
            <textarea 
              rows={2} 
              placeholder="세부 벌칙 내용..." 
              value={editPenalty.description} 
              onChange={e => setEditPenalty({...editPenalty, description: e.target.value})} 
              className="bg-black border border-red-900 px-2 py-1.5 text-white rounded outline-none resize-none text-[11px] mt-1" 
            />
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900 w-full mt-2">
            <span className="text-[9.5px] font-mono text-zinc-500 truncate">
              AES-256 E2EE ACTIVE
            </span>
            <button
              onClick={handleSaveMission}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
            >
              지령 마스터 저장 💾
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
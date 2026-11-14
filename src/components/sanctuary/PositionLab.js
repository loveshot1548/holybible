// src/components/sanctuary/PositionLab.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [AES-256 종단간 암호화 유틸리티]
// =====================================================================
const SECRET_SALT_KEY = process.env.REACT_APP_CHAT_SECRET || 'GTC_SECRET_SHINDONG_MOHANA_2026_!@#$';
const ENC_PREFIX = "ENC_SEC_v2::";
const LOCAL_STORAGE_KEY = 'custom_mission_templates_v4_hardcore_enc';

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

// 🌟 Supabase UUID(RFC 4122) 100% 규격 자동 변환 헬퍼
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
// 🎲 [하드코어 랜덤 룰렛 조합기 데이터 — 정신동 지배 / 모하나 여성상위 지배 분리]
// =====================================================================
const RANDOM_ROULETTE_POOLS = {
  places: [
    '침실 대형 전신 거울 바로 앞',
    '차량 조수석 풀 플랫 시트 위',
    '통창 테라스 유리벽 앞',
    '주방 대리석 아일랜드 식탁 위',
    '온수 스팀이 가득 찬 샤워부스 안',
    '침대 모서리 끝(베드 엣지)'
  ],
  shindongPoses: [
    '모하나가 양손으로 자기 엉덩이 살을 양옆으로 활짝 벌려 보지 구멍과 항문까지 다 보이게 치켜든 후배위',
    '다리를 M자로 찢듯 벌리고 양 손가락으로 보지 속살을 벌려 부풀어 오른 클리토리스를 노출한 자세',
    '안대로 눈을 가리고 양팔을 머리 위로 묶은 채 보지만 축축하게 적시며 벌리고 누운 무방비 자세',
    '전신 거울에 가슴과 얼굴을 밀착하고 뒤에서 신동의 자지가 보지로 쑤셔 박히는 걸 똑바로 쳐다보는 자세',
    '바닥에 무릎 꿇고 턱을 든 채 혀를 길게 내밀어 신동의 자지 뿌리까지 목구멍으로 삼키는 딥 스로트 자세',
    '두 다리를 머리 옆까지 반으로 완전히 접어 올린 폴딩 프레스 자세로 자궁구까지 수직으로 박히는 자세'
  ],
  shindongFetishes: [
    '신동이 "싸도 돼"라고 허락하기 전까지 보지가 아무리 경련해도 절대 혼자 먼저 오르가즘 느끼기 금지',
    '자지가 보지 속살을 긁고 들어올 때마다 "신동이 자지 너무 깊어, 내 보지 찢어질 것 같아"라고 음란하게 외치기',
    '눈 절대 감지 말고 거울 속에서 신동의 굵은 자지가 네 보지 구멍을 쑤시고 들어가는 결합 부위 끝까지 쳐다보기',
    '터져 나오는 신음 소리 참으면서 보지 안쪽 근육에 힘 꽉 줘서 자지가 못 빠져나가게 조이기',
    '자궁구 끝에 뜨거운 정액을 마지막 한 방울까지 다 싸줄 때까지 허리 빼지 말고 다리로 허리 감아 끝까지 받아내기'
  ],
  shindongPenalties: [
    {
      title: '맨엉덩이 스팽킹 50대 & 연속 2회 강제 질내사정',
      desc: '엉덩이 살이 시뻘겋게 부어오를 때까지 손바닥으로 스팽킹 50대를 맞은 뒤, 자지를 끝까지 물고 연속 2번 정액을 보지 안에 가득 받아낸다.'
    },
    {
      title: '안대 결박 & 20분간 클리토리스·G스팟 강제 애태우기 고문',
      desc: '눈을 가리고 양손이 묶인 채 클리토리스와 보지 입구만 20분간 집요하게 농락당하며 "제발 보지에 자지 박아주세요"라고 10번 이상 울며 애원해야 삽입을 허락받는다.'
    },
    {
      title: '전신 거울 앞 무릎 꿇고 목구멍 사정 & 정액 전부 삼키기',
      desc: '전신 거울 앞에 알몸으로 무릎 꿇고 앉아 신동의 자지를 목구멍 끝까지 삼키며, 입안에 싼 정액을 거울을 보며 한 방울도 남김없이 전부 삼킨다.'
    }
  ],
  mohanaPoses: [
    '신동의 양팔을 머리 위로 묶어 눕히고, 모하나가 위에서 보지로 자지를 뿌리까지 집어삼켜 찍어 누르는 여성상위 착좌 자세',
    '베개에 누운 신동의 얼굴과 입술 위에 모하나가 젖은 보지를 그대로 깔고 앉아 숨도 못 쉬게 혀로 빨게 만드는 안면승마 자세',
    '신동의 두 다리를 번쩍 들어 가슴 쪽으로 접어 누르고, 모하나가 위에서 무릎 꿇고 자지를 보지로 삼켜 내리찍는 아마조네스 프레스 자세',
    '누운 신동의 발 쪽을 바라보며 등지고 올라타(리버스 카우걸), 손으로 자기 엉덩이를 벌려 보지가 자지를 삼키는 걸 눈앞에 보여주는 자세',
    '의자에 앉은 신동의 양손을 등 뒤로 묶고, 모하나가 허벅지 위에 마주 올라타 자궁구로 귀두를 짓이기는 밀착 대면좌위'
  ],
  mohanaFetishes: [
    '신동은 절대 허리를 먼저 쳐올리지 말고, 오직 모하나가 위에서 보지로 자지를 쥐어짜고 흔드는 대로만 당하면서 버티기',
    '모하나가 위에서 보지로 자지를 삼키고 최소 2번 이상 먼저 오르가즘을 느끼기 전까지 신동은 절대 사정 금지',
    '모하나의 젖은 보지가 얼굴 위에 내려앉으면 두 손으로 엉덩이를 받치고 클리토리스와 보지 구멍을 혀로 소리 나게 빨아 바치기',
    '사정 직전(99%)마다 "모하나 보지 안에 싸게 해주세요"라고 애원하고, 모하나가 허락할 때만 자궁 안에 정액 바치기'
  ],
  mohanaPenalties: [
    {
      title: '양손 결박 & 20분간 무방비 안면승마 보지 봉사',
      desc: '신동은 양손이 묶인 채 모하나의 젖은 보지 아래에 얼굴이 깔려, 모하나가 다리를 떨며 2번 연속 절정에 달할 때까지 오직 혀로만 보지를 빨아 바친다.'
    },
    {
      title: '사정 직전 강제 중단(루인드 오르가즘) 5회 & 연속 2회전 착정',
      desc: '모하나의 허락 없이 쌀 것 같을 때마다 즉시 보지에서 자지를 뽑아 사정을 강제로 멈추는 고문을 5회 당한 뒤, 죽을 때까지 연속 2번 정액을 착정당한다.'
    }
  ]
};

// =====================================================================
// 📜 [무삭제 직설 하드코어 20종 실전 템플릿 마스터 데이터]
// - PART 1 (1~10): 정신동 메인 (정신동의 완전한 주도·관통·복종 지배)
// - PART 2 (101~110): 모하나 메인 (모하나의 완전한 여성상위 지배·구속·강제 착정)
// =====================================================================
const DEFAULT_TEMPLATES = [
  // ===================================================================
  // 🔥 [PART 1] 정신동 리드 10대 실전 하드코어 지배 테마 (정신동 위주)
  // ===================================================================
  {
    id: 1,
    uuid: '00000000-0000-4000-a000-000000000001',
    leader_type: 'shindong',
    title: '🚗 조수석 카섹스 : 팬티 젖히고 자지 뿌리까지 강제 관통',
    space: '차량 조수석 풀 플랫 시트 위',
    leader_guide: '정신동이 조수석 시트를 끝까지 눕히고 모하나의 브래지어를 위로 걷어 올린 뒤, 팬티를 아예 벗기거나 옆으로 제쳐 다리를 M자로 활짝 벌려 고정시킨다. 단단하게 발기된 자지 귀두로 애액이 흐르는 보지 입구와 클리토리스를 거칠게 문질러 애원하게 만든 뒤, 양손으로 모하나의 골반을 움켜쥐고 자궁구 끝까지 단숨에 자지를 쑤셔 박아 차가 흔들릴 정도로 거칠게 피스톤질한다.',
    partner_mission: '모하나는 시트 위에 무방비하게 누워 두 다리로 정신동의 허리를 꽉 감아 조이고, 정신동의 굵은 자지가 보지 속살을 찌르고 들어올 때마다 "신동이 자지 너무 커, 내 보지에 정액 가득 싸줘"라고 신음하며 보지 내벽을 끝까지 조인다.',
    reference_image_url: '',
    time_limit_sec: 180,
    steps: [
      { id: 101, step_order: 1, instruction: '차량 조수석 시트를 완전히 눕히고 하의를 벗어 젖은 보지가 다 보이도록 두 다리를 활짝 벌린다.', requires_photo_auth: false },
      { id: 102, step_order: 2, instruction: '손가락으로 자기 보지 입구를 벌려 정신동의 자지를 받아들일 준비가 된 하체 노출 인증샷을 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '차량 뒷좌석 후배위 100회 & 강제 질내사정', description: '차량 뒷좌석에 네 발로 엎드려 엉덩이를 치켜든 채 정신동의 거친 후배위 피스톤질 100회를 버티고 보지 깊은 곳에 질내사정을 받아낸다.' }
  },
  {
    id: 2,
    uuid: '00000000-0000-4000-a000-000000000002',
    leader_type: 'shindong',
    title: '🌃 통창 테라스 야경 : 유리벽에 젖가슴 짓누르고 서서 뒷치기',
    space: '프라이빗 테라스 대형 통창 앞',
    leader_guide: '정신동이 알몸의 모하나를 차가운 통창 유리에 밀어붙여 양손과 젖가슴을 유리벽에 짓누르게 한다. 뒤에서 손으로 양쪽 가슴을 거칠게 주무르며 딱딱해진 유두를 꼬집고, 허리를 꺾어 뒤로 한껏 치켜든 보지 구멍에 발기된 자지를 수평으로 끝까지 찔러 넣어 유리창에 몸이 쿵쿵 부딪힐 만큼 무자비하게 뒤에서 박아댄다.',
    partner_mission: '모하나는 차가운 통창 유리에 맨가슴과 유두를 비비면서 엉덩이를 뒤로 한껏 빼 정신동의 자지가 보지 가장 깊은 곳까지 닿게 바치고, 밖에서 보일지 모른다는 수치심과 쾌감 속에서 보지를 꽉 조이며 버틴다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 201, step_order: 1, instruction: '통창 유리에 알몸으로 가슴과 양손을 밀착하고 허리를 깊숙이 꺾어 보지와 엉덩이를 뒤로 한껏 내민다.', requires_photo_auth: false },
      { id: 202, step_order: 2, instruction: '유리창에 눌린 맨가슴과 뒤로 치켜든 엉덩이·보지 라인이 적나라하게 보이도록 인증샷을 찍어 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '유리창 밀착 맨엉덩이 스팽킹 40대 & 연속 질내사정', description: '유리창에 알몸을 붙인 상태로 맨엉덩이가 시뻘겋게 달아오르도록 스팽킹 40대를 맞은 뒤 그대로 서서 질내사정을 받아낸다.' }
  },
  {
    id: 3,
    uuid: '00000000-0000-4000-a000-000000000003',
    leader_type: 'shindong',
    title: '🍳 주방 식탁 : M자 다리 벌려 보지 빨고 위에서 수직으로 내리꽂기',
    space: '주방 대리석 아일랜드 식탁 모서리',
    leader_guide: '정신동이 모하나를 식탁 모서리에 걸터앉히고 두 다리를 M자로 활짝 벌려 들어 올린 뒤, 벌어진 보지 속살에 얼굴을 파묻고 클리토리스와 보지 구멍을 혀로 거칠게 빨아 애액을 쏟아내게 만든다. 모하나가 몸을 떨며 신음할 때 즉시 일어서서 발기된 자지를 수직으로 세워 위에서 아래로 체중을 실어 자궁 입구까지 단숨에 내리꽂는다.',
    partner_mission: '모하나는 식탁 끝에 걸터앉아 자기 양손으로 직접 보지 음순을 양옆으로 벌려 정신동이 빨기 쉽게 바치고, 자지가 박힐 때는 정신동의 어깨에 두 발목을 걸고 허리를 활처럼 젖히며 끝까지 받아낸다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 301, step_order: 1, instruction: '대리석 식탁 끝에 알몸으로 걸터앉아 두 다리를 M자로 찢듯 활짝 벌린다.', requires_photo_auth: false },
      { id: 302, step_order: 2, instruction: '양 손가락으로 자기 보지 음순을 직접 양옆으로 벌려 붉은 속살과 클리토리스가 훤히 드러난 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 밑 무릎 꿇고 15분간 목구멍 끝까지 펠라치오 봉사', description: '식탁 아래 바닥에 알몸으로 무릎 꿇고 앉아 양손을 등 뒤에 둔 채, 입과 혀와 목구멍으로만 정신동의 자지를 빨아 사정시킨다.' }
  },
  {
    id: 4,
    uuid: '00000000-0000-4000-a000-000000000004',
    leader_type: 'shindong',
    title: '🌳 심야 야외 벤치 : 노팬티 강제 핑거링 애액 분출 & 야외 관통',
    space: '인적 없는 심야 공원 벤치 또는 차 안',
    leader_guide: '정신동이 모하나의 팬티를 벗겨 주머니에 챙긴 뒤 외투로 하체를 가리고, 젖은 보지 구멍에 손가락 두 개를 뿌리까지 쑤셔 넣어 질퍽한 물소리가 날 때까지 G스팟을 거칠게 긁어 올린다. 모하나의 보지가 애액으로 흥건해지면 바지 지퍼를 내리고 자지를 꺼내 모하나를 그 위에 앉혀 아래에서 위로 세게 쳐올리며 야외에서 정액을 싼다.',
    partner_mission: '모하나는 팬티를 빼앗긴 노팬티 상태로 다리를 벌려 정신동의 손가락에 보지를 농락당하며, 자지가 들어오면 밖에서 들키지 않도록 입술을 깨물고 신음을 참으면서 보지 안쪽을 꽉 조인다.',
    reference_image_url: '',
    time_limit_sec: 90,
    steps: [
      { id: 401, step_order: 1, instruction: '팬티를 완전히 벗어 정신동에게 바치고 외투나 치마 아래로 알몸 보지를 노출한다.', requires_photo_auth: false },
      { id: 402, step_order: 2, instruction: '옷을 살짝 들춰 팬티를 벗은 맨보지가 적나라하게 보이는 은밀한 야외 노출 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '노팬티 상태로 귀가 & 현관문 열자마자 신발장 즉석 뒷치기', description: '집에 도착할 때까지 노팬티 상태를 유지하고, 현관문을 닫자마자 신발장에서 바로 엎드려 정신동에게 후배위로 박힌다.' }
  },
  {
    id: 5,
    uuid: '00000000-0000-4000-a000-000000000005',
    leader_type: 'shindong',
    title: '🚿 스팀 샤워부스 : 타일 벽에 밀어붙여 한쪽 다리 들고 뿌리까지 박기',
    space: '온수 스팀이 차오른 타일 샤워부스',
    leader_guide: '정신동이 뜨거운 샤워기 물을 맞으며 모하나의 젖가슴과 보지 둔덕을 맨손으로 거칠게 주무른 뒤, 타일 벽면에 모하나를 밀어붙여 한쪽 다리를 번쩍 들어 자기 허리에 걸치게 한다. 그대로 열기 오른 보지 구멍에 굵은 자지를 끝까지 쑤셔 박고, 철퍽거리는 물소리와 살 부딪히는 소리가 욕실에 울려 퍼지도록 몰아쳐서 보지 안에 잔뜩 사정한다.',
    partner_mission: '모하나는 젖은 타일 벽에 등을 기대고 한쪽 다리를 높게 들어 정신동의 허리에 감은 채, 자지가 자궁구까지 닿는 깊은 각도로 온몸을 맡기고 뜨거운 정액을 보지 안에 전부 받아낸다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 501, step_order: 1, instruction: '샤워기 온수로 알몸의 가슴과 보지를 흠뻑 적신 뒤 타일 벽면에 기대어 한쪽 다리를 높게 들어 올린다.', requires_photo_auth: false },
      { id: 502, step_order: 2, instruction: '물방울이 맺힌 젖가슴과 한쪽 다리를 들어 활짝 열린 보지 입구가 보이도록 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '샤워부스 유리벽 밀착 연속 2회 강제 질내사정', description: '샤워부스 유리벽에 젖가슴을 짓누른 채 다리가 풀려 주저앉을 때까지 쉬지 않고 연속 2회 질내사정을 받아낸다.' }
  },
  {
    id: 6,
    uuid: '00000000-0000-4000-a000-000000000006',
    leader_type: 'shindong',
    title: '🛏️ 침실 폴딩 프레스 : 두 다리 머리 옆까지 접어 누르고 자궁구 직격 사정',
    space: '침실 매트리스 정중앙',
    leader_guide: '정신동이 전라 상태의 모하나 두 다리를 번쩍 들어 올려 발목이 머리 양옆에 닿을 정도로 몸을 반으로 완전히 접어 누르는 폴딩 프레스(Folding Press) 자세로 완벽히 제압한다. 도망갈 곳 없이 훤히 들려 열린 보지 구멍에 자지를 수직으로 꽂아 넣고, 위에서 체중을 실어 자궁구를 무자비하게 찍어 누르듯 피스톤질하여 정액을 자궁 깊은 곳에 쏟아붓는다.',
    partner_mission: '모하나는 두 다리가 접혀 꼼짝도 못 하는 상태에서 위에서 내려다보는 정신동의 눈을 바라보며, 자궁 끝까지 쑤셔 박히는 쾌감에 보지를 꽉 조이고 "내 자궁 안에 정액 끝까지 다 싸줘"라고 울며 애원한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 601, step_order: 1, instruction: '침대 정중앙에 알몸으로 누워 두 다리를 가슴과 머리 쪽으로 깊숙이 끌어당겨 몸을 반으로 접는다.', requires_photo_auth: false },
      { id: 602, step_order: 2, instruction: '엉덩이가 들려 보지 구멍과 항문까지 적나라하게 노출된 폴딩 프레스 대기 자세를 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '질내사정 후 자지 안 빼고 15분간 결박 유지', description: '보지 안에 사정한 뒤 정액이 한 방울도 밖으로 새지 않도록 자지를 보지로 꽉 문 채 15분간 그대로 깔려 복종한다.' }
  },
  {
    id: 7,
    uuid: '00000000-0000-4000-a000-000000000007',
    leader_type: 'shindong',
    title: '🪞 전신 거울 앞 양손 뒤로 꺾어 잡고 보지 관통 강제 관음 (Mirror Doggy)',
    space: '침실 대형 전신 거울 바로 앞',
    leader_guide: '정신동이 전신 거울 바로 앞에 모하나를 무릎 꿇게 하고, 뒤에서 한 손으로 두 손목을 등 뒤로 꺾어 쥐고 다른 손으로 턱이나 머리채를 잡아 거울을 똑바로 쳐다보게 만든다. 정신동의 굵은 자지가 모하나의 젖은 보지 속살을 비집고 들어가 피스톤질하는 모습과 출렁이는 젖가슴, 쾌감에 일그러진 자기 얼굴을 거울로 끝까지 보게 만들며 거칠게 박는다.',
    partner_mission: '모하나는 절대 눈을 감거나 고개를 돌리지 말고, 전신 거울 속에 비친 자신의 알몸과 정신동의 자지가 내 보지에 박혀 드나드는 결합 부위를 두 눈으로 똑똑히 보면서 음란하게 신음한다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 701, step_order: 1, instruction: '전신 거울 앞에 알몸으로 무릎을 꿇고 엉덩이를 뒤로 뺀 채 거울 속 자신의 알몸을 응시한다.', requires_photo_auth: false },
      { id: 702, step_order: 2, instruction: '거울 속에 비친 알몸의 가슴과 뒤로 내민 엉덩이·보지가 함께 나오도록 거울 셀카를 찍어 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '거울 보며 자기 손으로 보지 벌리고 음란 자백', description: '전신 거울 앞에 다리를 벌리고 앉아 자기 손가락으로 보지 속살을 벌린 채 지금 얼마나 정신동 자지에 박히고 싶은지 큰 소리로 자백한다.' }
  },
  {
    id: 8,
    uuid: '00000000-0000-4000-a000-000000000008',
    leader_type: 'shindong',
    title: '🖤 안대·양손 결박 & 절정 금지 애태우기 고문 후 단숨에 관통',
    space: '조명을 끈 암막 침실',
    leader_guide: '정신동이 모하나의 눈을 안대로 가리고 양 손목을 머리 위 침대 헤드에 묶어 완전히 무방비로 만든다. 혀끝과 손가락, 그리고 단단한 자지 귀두로 유두와 부풀어 오른 클리토리스, 보지 입구만 집요하게 비벼대며 가기 직전에 멈추기를 반복한다. 모하나가 애액으로 시트를 적시며 "제발 내 보지에 자지 끝까지 박아주세요"라고 울며 빌 때까지 애태운 뒤 단숨에 뿌리까지 쑤셔 박는다.',
    partner_mission: '모하나는 앞이 안 보이고 두 손이 묶인 상태에서 정신동이 허락하기 전까지는 보지가 아무리 경련해도 절대 먼저 가버리면 안 되며, 참을 수 없을 때 가장 야하고 천박한 말로 자지 삽입을 애원한다.',
    reference_image_url: '',
    time_limit_sec: 180,
    steps: [
      { id: 801, step_order: 1, instruction: '안대를 착용하기 전 침대 위에 알몸으로 누워 양손을 머리 위로 모으고 두 다리를 활짝 벌린다.', requires_photo_auth: false },
      { id: 802, step_order: 2, instruction: '양손을 머리 위로 올리고 가슴과 보지를 무방비하게 드러낸 전라 복종 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '결박 유지 & 연속 3회 강제 오르가즘 피스톤질', description: '안대와 손목 결박을 풀지 않은 채 보지가 경련하며 연속 3번 가버릴 때까지 정신동에게 쉼 없이 박힌다.' }
  },
  {
    id: 9,
    uuid: '00000000-0000-4000-a000-000000000009',
    leader_type: 'shindong',
    title: '💋 베드 엣지 딥 스로트 : 머리 잡고 목구멍 끝까지 자지 쑤셔 넣기',
    space: '침대 모서리 끝 (베드 엣지)',
    leader_guide: '정신동이 모하나를 침대 모서리에 눕혀 머리를 침대 밖으로 젖히게 하거나 침대 앞에 무릎 꿇게 한 뒤, 양손으로 모하나의 머리를 잡고 빳빳하게 발기된 자지를 입술부터 목구멍 깊은 곳(딥 스로트)까지 거침없이 밀어 넣는다. 타액이 턱을 타고 흐르고 눈물이 고일 때까지 입보지로 봉사받은 뒤, 곧바로 다리를 벌려 젖은 아래 보지에 자지를 꽂아 넣는다.',
    partner_mission: '모하나는 입을 크게 벌려 정신동의 뜨거운 자지를 귀두부터 기둥, 불알까지 혀로 정성껏 핥고 목구멍 끝까지 깊숙이 삼키며, 숨이 막히는 와중에도 정신동을 올려다보는 눈빛으로 복종한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 901, step_order: 1, instruction: '침대 모서리 아래에 알몸으로 무릎을 꿇거나 모서리에 머리를 젖히고 입을 크게 벌려 준비한다.', requires_photo_auth: false },
      { id: 902, step_order: 2, instruction: '카메라를 올려다보며 정신동의 자지를 삼킬 준비가 된 벌린 입술과 혀, 알몸 가슴이 나오는 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '목구멍 딥 스로트 입안 사정 & 정액 전부 삼키기', description: '보지에 넣기 전에 먼저 입안과 목구멍 가득 정신동의 뜨거운 정액을 받아내고 한 방울도 남김없이 삼켜 입안을 확인받는다.' }
  },
  {
    id: 10,
    uuid: '00000000-0000-4000-a000-000000000010',
    leader_type: 'shindong',
    title: '🔞 네 발로 기어와 보지 벌리기 & 음란 자백 후배위 조교',
    space: '침실 바닥에서 침대 위까지',
    leader_guide: '정신동이 모하나를 실오라기 하나 걸치지 않은 알몸으로 네 발로 기어와 먼저 내 자지에 입을 맞추고 손으로 엉덩이를 벌려 보지를 바치게 한다. 뒤에서 보지에 자지를 거칠게 쑤셔 박는 내내 귀에 대고 "이 젖은 보지 누구 거야?", "지금 보지에 뭐가 박혀 있어?"라고 다그치며, 가장 음란한 대답이 나올 때마다 엉덩이 살이 철썩거릴 정도로 세게 박아 정액을 쏟아붓는다.',
    partner_mission: '모하나는 네 발로 기어 정신동에게 다가와 자기 손으로 엉덩이를 벌려 보지 구멍을 바치고, 뒤에서 박힐 때마다 "정신동 전용 보지야! 내 자궁 안에 신동이 정액 가득 싸줘!"라고 큰 소리로 외치며 보지를 조인다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 1001, step_order: 1, instruction: '침대 위에서 알몸으로 네 발로 엎드려 가슴을 매트리스에 붙이고 엉덩이와 보지를 뒤로 높게 치켜든다.', requires_photo_auth: false },
      { id: 1002, step_order: 2, instruction: '고개를 뒤로 돌려 카메라를 보며 두 손으로 자기 엉덩이와 보지 입구를 직접 벌린 복종 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '보지 자위 소리와 함께 음란 자백 음성 녹음 바치기', description: '자기 손가락으로 젖은 보지를 쑤시는 소리와 함께 정신동 자지에 얼마나 박히고 싶은지 30초 이상 음성으로 녹음해 바친다.' }
  },

  // ===================================================================
  // 👑 [PART 2] 모하나 리드 10대 실전 여성상위 지배·착정 테마 (모하나 위주)
  // ===================================================================
  {
    id: 101,
    uuid: '00000000-0000-4000-a000-000000000101',
    leader_type: 'mohana',
    title: '🚗 조수석 카섹스 : 모하나의 여성상위 양팔 제압 & 강제 기승위 착정',
    space: '밀폐된 차 안 조수석 풀 플랫 시트',
    leader_guide: '모하나가 주도권을 쥐고 조수석 시트를 완전히 눕힌 뒤 정신동을 아래에 깔고 알몸으로 그 위에 올라탄다. 정신동의 양 손목을 머리 위로 세게 눌러 꼼짝 못 하게 제압하고, 터질 듯이 발기된 정신동의 자지를 손으로 잡아 자기 보지 입구에 맞춘 뒤 단숨에 뿌리 끝까지 주저앉으며 모하나가 원하는 속도와 각도로만 허리를 흔들어 정액을 강제로 짜낸다.',
    partner_mission: '정신동은 시트 아래에 깔려 절대 허리를 먼저 쳐올리지 못하며, 위에서 내려다보며 보지로 자지를 집어삼키고 짓누르는 모하나의 지배에 완전히 복종한 채 모하나가 허락할 때만 보지 안에 사정한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1011, step_order: 1, instruction: '정신동을 조수석 시트에 눕혀 바지를 벗기고 양팔을 머리 위로 눌러 완전히 제압한다.', requires_photo_auth: false },
      { id: 1012, step_order: 2, instruction: '모하나가 위에서 발기된 자지를 보지 끝까지 삼키고 앉아 아래에 깔린 정신동을 지배하는 상위 착좌 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '정신동 양손 핸들 결박 & 모하나의 2연속 강제 착정', description: '정신동의 두 손을 묶어 반항하지 못하게 한 뒤, 모하나가 위에서 보지로 자지를 물고 놓아주지 않으며 연속 2번 정액을 끝까지 짜낸다.' }
  },
  {
    id: 102,
    uuid: '00000000-0000-4000-a000-000000000102',
    leader_type: 'mohana',
    title: '🌃 테라스 시선 구속 & 여성상위 골반 그라인딩 자궁구 착정',
    space: '프라이빗 테라스 통창 앞 의자',
    leader_guide: '모하나가 정신동을 통창 앞 의자에 앉히고 양팔을 등 뒤로 고정시킨 뒤, 그 무릎 위로 마주 보고 올라타 뜨거운 보지로 자지를 뿌리까지 삼킨다. 한 손으로 정신동의 턱을 꽉 잡아 자기 눈과 흔들리는 젖가슴만 올려다보게 강제하고, 골반을 앞뒤·8자로 끈적하게 비벼대며 보지 내벽과 자궁구로 귀두를 짓이겨 정신동의 사정감을 완벽히 지배한다.',
    partner_mission: '정신동은 다른 곳을 보지 못하고 오직 위에서 내려다보며 보지로 내 자지를 쥐어짜는 모하나의 눈과 유두만 응시해야 하며, 모하나가 "내 보지에 싸"라고 명령할 때까지 이 악물고 사정을 참아낸다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1021, step_order: 1, instruction: '통창 앞에 정신동을 앉혀 움직이지 못하게 하고 턱을 잡아 시선을 모하나에게 고정시킨다.', requires_photo_auth: false },
      { id: 1022, step_order: 2, instruction: '정신동의 허벅지 위에 알몸으로 올라타 보지로 자지를 끝까지 삼킨 여성상위 지배 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '안대 착용 구속 & 모하나의 15분간 일방적 기승위 조련', description: '정신동의 눈을 안대로 가리고 의자에 묶은 채, 모하나가 위에서 15분간 마음대로 타고 흔들며 정액을 끝까지 뽑아낸다.' }
  },
  {
    id: 103,
    uuid: '00000000-0000-4000-a000-000000000103',
    leader_type: 'mohana',
    title: '🍳 주방 식탁 : 모하나의 수직 낙하 피스톤 기승위 (체중 실어 찍어 누르기)',
    space: '주방 대리석 아일랜드 식탁 또는 의자 위',
    leader_guide: '모하나가 정신동을 식탁 위나 의자에 눕혀 앉히고, 그 위로 올라타 양손으로 정신동의 목덜미와 어깨를 꽉 찍어 누른다. 허리를 들어 젖은 보지 입구에 귀두 끝만 아슬아슬하게 걸쳤다 체중을 실어 수직으로 세게 내려찍으며, 자지가 보지 속살을 긁고 자궁구까지 푹푹 처박히는 쾌감을 모하나가 위에서 거칠게 주도한다.',
    partner_mission: '정신동은 아래에 깔려 모하나가 위에서 방아를 찧듯 거칠게 보지로 자지를 내려찍을 때마다 터져 나오는 신음을 참지 말고 바치며, 양손으로 모하나의 흔들리는 엉덩이 살을 받쳐 올린다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1031, step_order: 1, instruction: '식탁이나 의자에 정신동을 눕혀 앉히고 알몸으로 그 위에 마주 보고 올라탄다.', requires_photo_auth: false },
      { id: 1032, step_order: 2, instruction: '위에서 정신동의 어깨를 찍어 누르고 보지로 자지를 뿌리까지 삼킨 여성상위 라이딩 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '모하나가 3번 먼저 갈 때까지 사정 절대 금지 & 강제 착좌', description: '모하나가 위에서 허리를 흔들어 먼저 3번 오르가즘을 느낄 때까지 정신동은 절대 싸지 못하고 밑에서 자지로 받아내야 한다.' }
  },
  {
    id: 104,
    uuid: '00000000-0000-4000-a000-000000000104',
    leader_type: 'mohana',
    title: '🌳 심야 벤치 : 외투 속 노팬티 기승위 덮치기 & 신음 통제 조교',
    space: '인적 없는 심야 야외 벤치 또는 차 뒷좌석',
    leader_guide: '모하나가 벤치에 앉은 정신동의 바지 지퍼를 직접 내리고 단단해진 자지를 꺼낸 뒤, 팬티를 벗은 맨보지로 그 위에 올라타 외투로 둘을 덮는다. 한 손으로 정신동의 입을 막으며 귀에 대고 "소리 내면 바로 빼버릴 거야, 내 보지가 조이는 대로 가만히 느껴"라고 명령한 뒤, 보지 내벽 근육을 강하게 수축하며 위에서 음란하게 허리를 돌린다.',
    partner_mission: '정신동은 모하나의 손에 입이 막힌 채 거친 숨을 몰아쉬며, 외투 속에서 모하나의 뜨거운 보지가 자지를 꽉꽉 조이며 정액을 짜내는 쾌감에 굴복해 허락을 구하고 사정한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1041, step_order: 1, instruction: '앉아 있는 정신동의 지퍼를 내려 자지를 꺼내고 노팬티 알몸 하체로 그 위에 올라탄다.', requires_photo_auth: false },
      { id: 1042, step_order: 2, instruction: '외투 속에서 위에서 자지를 보지로 삼키고 정신동을 찍어 누른 은밀한 여성상위 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '모하나 보지에 코 박고 10분간 애액 다 핥아먹기', description: '사정 후에도 모하나가 허락할 때까지 무릎을 꿇고 모하나의 보지에서 흘러나오는 애액과 정액을 혀로 깨끗이 핥아 봉사한다.' }
  },
  {
    id: 105,
    uuid: '00000000-0000-4000-a000-000000000105',
    leader_type: 'mohana',
    title: '🚿 샤워부스 : 정신동 벽면에 가두고 젖가슴·보지 비비기 후 기승위 착정',
    space: '온수 스팀이 가득 찬 샤워부스',
    leader_guide: '모하나가 정신동을 샤워부스 타일 벽이나 욕조 턱에 앉혀 가두고, 온수로 흠뻑 젖은 모하나의 풍만한 젖가슴과 유두, 뜨거운 보지 둔덕을 정신동의 얼굴과 발기된 자지 기둥에 끈적하게 문질러 미치게 만든다. 정신동이 제발 넣어달라고 애원하면 그제야 위에서 다리를 벌리고 올라타 보지로 자지를 끝까지 집어삼켜 물보라가 튀도록 위에서 찍어 누른다.',
    partner_mission: '정신동은 샤워부스 벽에 갇혀 모하나가 가슴과 보지 속살로 자지를 문지르며 애태우는 것을 고스란히 견디고, 모하나가 위로 올라타 보지로 자지를 삼키면 두 손으로 모하나의 허리와 엉덩이를 받쳐 들고 복종한다.',
    reference_image_url: '',
    time_limit_sec: 120,
    steps: [
      { id: 1051, step_order: 1, instruction: '온몸을 물로 적신 뒤 정신동을 샤워부스 벽면에 밀어붙여 앉히고 위에서 다리를 벌려 올라탄다.', requires_photo_auth: false },
      { id: 1052, step_order: 2, instruction: '젖은 맨가슴과 보지로 정신동을 위에서 짓누르며 지배하는 샤워부스 상위 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '샤워부스 바닥에 무릎 꿇고 모하나 보지 15분간 커닐링구스 봉사', description: '정신동이 샤워부스 바닥에 무릎을 꿇고 앉아, 서 있는 모하나의 한쪽 다리를 어깨에 걸친 채 모하나가 갈 때까지 보지를 혀로 빨아 바친다.' }
  },
  {
    id: 106,
    uuid: '00000000-0000-4000-a000-000000000106',
    leader_type: 'mohana',
    title: '🛏️ 침실 퀸 도미넌트 : 정신동 양손 머리 위 결박 & 인간 딜도 강제 착정',
    space: '침실 매트리스 정중앙',
    leader_guide: '모하나가 정신동을 침대 정중앙에 눕히고 양 손목을 머리 위에 묶어 전혀 움직이지 못하게 만든다. 그 위로 당당하게 올라타 애액이 흐르는 보지로 정신동의 자지를 뿌리 끝까지 집어삼킨 뒤, 위에서 젖가슴을 출렁이며 모하나가 먼저 2번 이상 오르가즘을 느낄 때까지 정신동의 자지를 인간 딜도처럼 마음껏 타고 흔들어 정액을 끝까지 짜낸다.',
    partner_mission: '정신동은 양손이 머리 위에 묶인 채 모하나의 허락 없이 절대 허리를 쳐올리거나 먼저 싸버리면 안 된다. 모하나가 위에서 보지로 내 자지를 마음껏 쓰며 절정에 달할 때까지 밑에서 바치며 복종한다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 1061, step_order: 1, instruction: '정신동을 매트리스에 눕히고 양손을 머리 위로 완전히 결박한 뒤 알몸으로 그 위에 올라탄다.', requires_photo_auth: false },
      { id: 1062, step_order: 2, instruction: '자지를 보지 끝까지 삼키고 앉아 아래에 묶여 깔린 정신동을 내려다보는 여왕 시점 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '결박 해제 불가 & 자지 안 빼고 연속 2회전 강제 착정', description: '1회 사정 후에도 정신동의 손목 결박을 풀어주지 않고, 모하나가 보지 안에 자지를 문 채 그대로 다시 세워 2회전 정액까지 연속으로 뽑아낸다.' }
  },
  {
    id: 107,
    uuid: '00000000-0000-4000-a000-000000000107',
    leader_type: 'mohana',
    title: '👑 안면 승마 (Face Sitting) : 정신동 얼굴 위에 보지 깔고 앉아 혀로 빨게 하기',
    space: '침실 베개 위',
    leader_guide: '모하나가 베개에 누운 정신동의 얼굴 바로 위로 다리를 벌리고 올라타, 애액으로 흠뻑 젖은 보지 구멍과 부풀어 오른 클리토리스를 정신동의 입술과 코, 혀 위에 그대로 덮어씌우듯 체중을 실어 주저앉는다. 두 손으로 정신동의 머리를 꽉 잡고 허리를 앞뒤로 문지르며, 모하나가 다리를 부들부들 떨며 보지 물을 쏟을 때까지 숨도 못 쉬게 혀로 빨게 만든다.',
    partner_mission: '정신동은 양손으로 모하나의 맨엉덩이를 꽉 붙잡고, 얼굴 전체가 모하나의 뜨거운 보지 속살에 파묻힌 채 혀를 길게 내밀어 클리토리스와 보지 구멍 안쪽까지 쉬지 않고 핥고 빨아 올리며 모하나를 절정에 보낸다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 1071, step_order: 1, instruction: '정신동을 베개에 눕히고 머리 양옆에 무릎을 꿇어 정신동의 입 바로 위에 모하나의 보지가 오도록 올라탄다.', requires_photo_auth: false },
      { id: 1072, step_order: 2, instruction: '정신동의 얼굴 위에 젖은 보지와 엉덩이를 그대로 깔고 앉은 안면 승마 지배 인증샷을 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '안면 승마 연속 2회 절정 봉사 후 즉시 기승위 착정', description: '모하나가 얼굴 위에서 2번 연속 보지 물을 싸며 갈 때까지 입을 떼지 못하고 빨아 바친 직후, 곧바로 보지에 자지를 먹여 정액까지 바친다.' }
  },
  {
    id: 108,
    uuid: '00000000-0000-4000-a000-000000000108',
    leader_type: 'mohana',
    title: '⚡ 리버스 카우걸 (역립 기승위) : 손으로 엉덩이 벌려 보지가 자지 먹는 모습 보여주기',
    space: '침실 매트리스 또는 소파 위',
    leader_guide: '모하나가 누워 있는 정신동의 발 쪽을 바라보며 등지고 올라타(리버스 카우걸), 자기 양손으로 엉덩이 살을 양옆으로 활짝 벌려 젖은 보지 구멍이 정신동의 굵은 자지를 뿌리까지 삼키고 조이는 모습을 정신동의 눈앞에 적나라하게 보여준다. 귀두 끝만 걸쳤다 뿌리까지 단숨에 내려찍으며 위에서 음란하게 허리를 흔들어 지배한다.',
    partner_mission: '정신동은 눈앞에서 위아래로 출렁이는 모하나의 맨엉덩이와 애액으로 번들거리는 보지 구멍에 내 자지가 끝까지 빨려 들어가는 모습을 똑바로 쳐다보며, 모하나가 원하는 템포에 맞춰 아래에서 골반을 받쳐준다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 1081, step_order: 1, instruction: '정신동을 눕히고 등을 돌린 채 허벅지 위로 올라타 자지를 보지 입구에 맞춘다.', requires_photo_auth: false },
      { id: 1082, step_order: 2, instruction: '등을 돌린 채 양손으로 자기 엉덩이를 벌려 보지와 자지 결합 부위가 보이도록 역립 기승위 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '리버스 카우걸 상태에서 불알·회음부 애무 & 강제 연속 사정', description: '모하나가 등지고 올라탄 채로 한 손으로 정신동의 불알을 쥐고 자극하며 보지를 강하게 조여 정신동의 정액을 한 방울도 남김없이 뽑아낸다.' }
  },
  {
    id: 109,
    uuid: '00000000-0000-4000-a000-000000000109',
    leader_type: 'mohana',
    title: '🔥 모하나의 사정 통제 고문 : 99% 직전에 보지에서 자지 빼고 애태우기 3회 반복',
    space: '침실 침대 위',
    leader_guide: '모하나가 위에서 손과 입술, 그리고 뜨거운 보지 조임으로 정신동의 자지를 사정 직전(99%)까지 몰아붙인 뒤, 정신동이 "쌀 것 같아!"라고 신음하는 순간 매정하게 허리를 들어 보지에서 자지를 쏙 빼버리고 귀두 끝만 손가락으로 건드리며 약 올린다. 최소 3번 이상 사정을 참게 만들어 정신동이 "제발 모하나 보지 안에 싸게 해주세요"라고 애원할 때 마지막으로 뿌리까지 삼켜 정액을 전부 짜낸다.',
    partner_mission: '정신동은 모하나의 보지 안에서 정액이 터져 나오기 직전마다 솔직하게 신호를 보내야 하며, 모하나가 "싸도 돼, 내 자궁 안에 다 싸"라고 허락하기 전까지는 죽을힘을 다해 사정을 참아내며 복종한다.',
    reference_image_url: '',
    time_limit_sec: 180,
    steps: [
      { id: 1091, step_order: 1, instruction: '정신동을 눕혀 제압하고 손과 입술, 보지 마찰로 자지를 터질 듯이 단단하게 발기시킨다.', requires_photo_auth: false },
      { id: 1092, step_order: 2, instruction: '완전히 발기된 정신동의 자지를 손에 쥐거나 위에서 보지 입구에 대고 사정을 통제하는 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '허락 전 조기 사정 시 밤새 모하나 전용 인간 딜도 노예권', description: '모하나의 허락 전에 먼저 싸버릴 경우, 오늘 밤 내내 양손이 묶인 채 모하나가 원하는 모든 여성상위 체위와 보지 봉사에 무조건 복종한다.' }
  },
  {
    id: 110,
    uuid: '00000000-0000-4000-a000-000000000110',
    leader_type: 'mohana',
    title: '👠 아마조네스 프레스 : 정신동 두 다리 들어 접어 누르고 위에서 보지로 내리찍기',
    space: '침실 매트리스 정중앙',
    leader_guide: '모하나가 정신동을 침대에 눕히고 정신동의 두 다리를 번쩍 들어 가슴 쪽으로 깊숙이 접어 누른 뒤, 모하나가 그 위에서 무릎을 꿇고 정신동의 허벅지를 양팔로 감싸 쥐며 위에서 아래로 자지를 보지 끝까지 집어삼킨다. 남녀의 공수 자세가 완전히 역전된 극한의 여성상위 지배 체위(아마조네스 자세)로 위에서 거칠게 허리를 내리찍으며 정신동의 신음과 정액을 뽑아낸다.',
    partner_mission: '정신동은 두 다리가 모하나의 가슴 쪽에 잡혀 하체가 완전히 들리고 제압당한 상태에서, 위에서 내리꽂듯 내 자지를 삼키고 방아를 찧는 모하나의 뜨거운 보지 압박에 온몸을 맡기고 신음하며 자궁 안에 사정한다.',
    reference_image_url: '',
    time_limit_sec: 150,
    steps: [
      { id: 1101, step_order: 1, instruction: '정신동을 눕히고 두 다리를 들어 올려 하체를 완전히 접어 제압한 뒤 사타구니 위에 자리 잡는다.', requires_photo_auth: false },
      { id: 1102, step_order: 2, instruction: '위에서 정신동의 두 다리를 감싸 안고 보지로 자지를 뿌리까지 삼킨 아마조네스 여성상위 제압 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '아마조네스 자세 유지 & 질내사정 후 15분간 착정 감금', description: '정신동의 두 다리를 접어 누른 아마조네스 자세 그대로 보지 안에 정액을 끝까지 다 짜내고, 15분간 자지를 보지 안에서 빼주지 않고 조이며 감금한다.' }
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
      const encryptedSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (encryptedSaved) {
        const decryptedStr = decryptSecret(encryptedSaved);
        if (decryptedStr) {
          return mergeWithDefaults(JSON.parse(decryptedStr));
        }
      }
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [selectedMissionId, setSelectedMissionId] = useState(1);

  // 폼 편집 상태 (모든 항목 실시간 수정 가능)
  const [editTitle, setEditTitle] = useState('');
  const [editSpace, setEditSpace] = useState('');
  const [editLeaderGuide, setEditLeaderGuide] = useState('');
  const [editPartnerMission, setEditPartnerMission] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState(120);
  const [editSteps, setEditSteps] = useState([{ id: Date.now(), step_order: 1, instruction: '', requires_photo_auth: false }]);
  const [editPenalty, setEditPenalty] = useState({ title: '', description: '' });
  const [customInstantCommand, setCustomInstantCommand] = useState('');

  const [isMissionActiveOnPartnerPhone, setIsMissionActiveOnPartnerPhone] = useState(false);
  const [testPreviewActive, setTestPreviewActive] = useState(false);

  const [panicMode, setPanicMode] = useState(false);
  const [missionTtlHours, setMissionTtlHours] = useState(3);
  const [partnerStatus, setPartnerStatus] = useState('unread');
  const [partnerAuthPhoto, setPartnerAuthPhoto] = useState(null);
  const [inspectPhotoModal, setInspectPhotoModal] = useState(false);
  const [rouletteResultBanner, setRouletteResultBanner] = useState(null);

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
      setEditTimeLimit(target.time_limit_sec || 120);
      setEditSteps(
        target.steps && target.steps.length > 0
          ? target.steps.map((s, idx) => ({ ...s, step_order: idx + 1 }))
          : [{ id: Date.now(), step_order: 1, instruction: '', requires_photo_auth: false }]
      );
      setEditPenalty(target.penalty || { title: '', description: '' });
    }
  }, []);

  useEffect(() => {
    syncFormToMission(selectedMissionId, missions);
  }, [selectedMissionId, missions, syncFormToMission]);

  const saveEncryptedLocal = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, encryptSecret(JSON.stringify(data)));
  };

  const fetchTemplates = useCallback(async () => {
    if (!supabase) return;
    try {
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
          setPartnerAuthPhoto(sessionData.auth_photo_url ? decryptSecret(sessionData.auth_photo_url) : null);
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
          setPartnerAuthPhoto(payload.new.auth_photo_url ? decryptSecret(payload.new.auth_photo_url) : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTemplates]);

  // 🎲 하드코어 랜덤 주사위 (현재 선택된 탭이 정신동인지 모하나인지에 따라 지배 주체 자동 맞춤!)
  const handleSpinHardcoreRoulette = () => {
    const isShindongLead = activeLeaderTab === 'shindong';
    const randPlace = RANDOM_ROULETTE_POOLS.places[Math.floor(Math.random() * RANDOM_ROULETTE_POOLS.places.length)];
    const posePool = isShindongLead ? RANDOM_ROULETTE_POOLS.shindongPoses : RANDOM_ROULETTE_POOLS.mohanaPoses;
    const fetishPool = isShindongLead ? RANDOM_ROULETTE_POOLS.shindongFetishes : RANDOM_ROULETTE_POOLS.mohanaFetishes;
    const penaltyPool = isShindongLead ? RANDOM_ROULETTE_POOLS.shindongPenalties : RANDOM_ROULETTE_POOLS.mohanaPenalties;

    const randPose = posePool[Math.floor(Math.random() * posePool.length)];
    const randFetish = fetishPool[Math.floor(Math.random() * fetishPool.length)];
    const randPenalty = penaltyPool[Math.floor(Math.random() * penaltyPool.length)];

    const generatedTitle = isShindongLead
      ? `🔞 [신동 지배 랜덤] ${randPlace} · 강제 관통 & 복종`
      : `👑 [모하나 착정 랜덤] ${randPlace} · 여성상위 제압`;

    const generatedLeader = isShindongLead
      ? `[장소: ${randPlace}] 정신동이 모하나를 '${randPose}' 상태로 완벽히 고정시킨 뒤, 보지가 애액으로 흠뻑 젖을 때까지 애태우다 자지를 뿌리 끝까지 거칠게 쑤셔 박아 지배한다.`
      : `[장소: ${randPlace}] 모하나가 정신동을 아래에 깔아 제압하고 '${randPose}' 상태로 올라타, 보지로 정신동의 자지를 끝까지 삼키고 위에서 마음대로 흔들어 정액을 강제로 착정한다.`;

    const generatedPartner = `[절대 복종 수칙] ${randFetish}`;

    setEditTitle(generatedTitle);
    setEditSpace(randPlace);
    setEditLeaderGuide(generatedLeader);
    setEditPartnerMission(generatedPartner);
    setEditSteps([
      { id: Date.now() + 1, step_order: 1, instruction: `${randPlace}에서 속옷까지 모두 벗고 '${randPose}' 상태를 즉시 준비한다.`, requires_photo_auth: false },
      { id: Date.now() + 2, step_order: 2, instruction: `수칙(${randFetish})을 명심하며 지금 취한 알몸 결합/개방 자세를 촬영해 전송한다.`, requires_photo_auth: true }
    ]);
    setEditPenalty({ title: randPenalty.title, description: randPenalty.desc });
    setRouletteResultBanner({ place: randPlace, pose: randPose, fetish: randFetish });

    if (navigator.vibrate) {
      try { navigator.vibrate([80, 60, 140]); } catch (_) {}
    }
  };

  // ⚡ 실시간 즉석 조교 푸시 명령 발송기 (프리셋 버튼 + 직접 입력 발송 모두 지원)
  const handleSendInstantDominationPulse = async (commandMsg) => {
    const trimmed = (commandMsg || '').trim();
    if (!trimmed) return alert('전송할 즉석 명령 문구를 입력하거나 선택해주세요.');
    if (!supabase) return;
    try {
      await supabase.from('shared_qt').upsert([{
        date: 'couple_heartbeat_pulse',
        video_id: encryptSecret(JSON.stringify({
          sender: currentUserName,
          message: `🔞 [긴급 복종 명령] ${trimmed}`,
          temp: 40.5,
          timestamp: Date.now()
        }))
      }], { onConflict: 'date' });
      if (navigator.vibrate) try { navigator.vibrate([100, 80, 150]); } catch (_) {}
      setCustomInstantCommand('');
      alert(`🔥 상대방 화면 상단에 [${trimmed}] 긴급 명령과 진동이 즉시 전송되었습니다!`);
    } catch (_) {}
  };

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
          steps: editSteps.map((s, idx) => ({ ...s, step_order: idx + 1 })),
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
    alert('🔒 수정하신 미션 지령과 하드코어 설정이 완벽하게 암호화 저장되었습니다.');
  };

  const handleCreateNewMission = async () => {
    const newId = Date.now();
    const isShindongLead = activeLeaderTab === 'shindong';
    const newMission = {
      id: newId,
      uuid: toValidUUID(newId),
      leader_type: activeLeaderTab,
      title: isShindongLead ? '🔥 정신동 신규 하드코어 지배 미션' : '👑 모하나 신규 여성상위 착정 미션',
      space: '침실 매트리스 위',
      leader_guide: isShindongLead
        ? '정신동이 모하나를 완전히 제압하고 발기된 자지를 젖은 보지 끝까지 쑤셔 박아 거칠게 피스톤질한다.'
        : '모하나가 정신동을 아래에 깔고 양팔을 눌러 제압한 뒤, 위에서 보지로 자지를 뿌리까지 삼켜 강제로 정액을 짜낸다.',
      partner_mission: isShindongLead
        ? '모하나는 다리를 활짝 벌려 보지를 바치고, 자지가 박힐 때마다 음란하게 신음하며 자궁 안에 정액을 받아낸다.'
        : '정신동은 아래에 깔려 허리를 먼저 움직이지 말고, 모하나가 위에서 보지로 자지를 쥐어짜는 대로 복종한다.',
      reference_image_url: '',
      time_limit_sec: 120,
      steps: [{ id: Date.now(), step_order: 1, instruction: '속옷까지 전부 벗고 지정된 자세를 취한 뒤 즉시 사진으로 인증한다.', requires_photo_auth: true }],
      penalty: {
        title: isShindongLead ? '맨엉덩이 스팽킹 50대 & 강제 질내사정' : '양손 결박 & 모하나의 2연속 안면승마·기승위 착정',
        description: '제한시간 초과 시 일방적인 하드코어 처벌을 수행한다.'
      }
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
    alert('📋 미션이 복제되었습니다. 우측 편집창에서 자유롭게 수정 후 저장하세요.');
  };

  // 현재 선택된 미션 1개만 기본값으로 되돌리기
  const handleResetSingleMission = () => {
    const defaultTarget = DEFAULT_TEMPLATES.find(t => t.id === selectedMissionId);
    if (!defaultTarget) {
      return alert('사용자 추가 미션입니다. 기본 20종 미션만 개별 초기화가 가능합니다.');
    }
    if (!window.confirm(`[${defaultTarget.title}] 미션을 기본 무삭제 원문으로 되돌리시겠습니까?`)) return;
    const updated = missions.map(m => (m.id === selectedMissionId ? { ...defaultTarget } : m));
    setMissions(updated);
    saveEncryptedLocal(updated);
    syncFormToMission(selectedMissionId, updated);
  };

  const handleResetToDefaultTemplates = async () => {
    if (!window.confirm('정신동 주도 10종 + 모하나 여성상위 지배 10종으로 완벽 교정된 20종 무삭제 원문을 DB 및 로컬에 즉시 덮어쓰시겠습니까?')) return;
    setMissions(DEFAULT_TEMPLATES);
    saveEncryptedLocal(DEFAULT_TEMPLATES);
    const nextId = activeLeaderTab === 'shindong' ? 1 : 101;
    setSelectedMissionId(nextId);
    syncFormToMission(nextId, DEFAULT_TEMPLATES);

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
            time_limit_sec: t.time_limit_sec || 120
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
    alert('🔥 교정된 20종 무삭제 하드코어 실전 지령이 DB와 로컬에 완벽히 동기화되었습니다!');
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

  // 스텝 삭제 헬퍼
  const handleRemoveStep = (idxToRemove) => {
    if (editSteps.length <= 1) return alert('최소 1개의 수행 스텝이 필요합니다.');
    const nextSteps = editSteps
      .filter((_, idx) => idx !== idxToRemove)
      .map((s, i) => ({ ...s, step_order: i + 1 }));
    setEditSteps(nextSteps);
  };

  const handleToggleDispatch = async () => {
    const nextStatus = !isMissionActiveOnPartnerPhone;
    const targetMission = {
      id: selectedMissionId,
      uuid: toValidUUID(selectedMissionId),
      leader_type: activeLeaderTab,
      title: editTitle.trim() || '긴급 실전 지령',
      space: editSpace.trim() || '침실',
      leader_guide: editLeaderGuide.trim(),
      partner_mission: editPartnerMission.trim(),
      reference_image_url: editImageUrl,
      time_limit_sec: editTimeLimit || 120,
      steps: editSteps.map((s, idx) => ({ ...s, step_order: idx + 1 })),
      penalty: editPenalty
    };

    // 발령 시 현재 폼에서 수정한 내용도 로컬에 자동 저장!
    const updatedList = missions.map(m => (m.id === selectedMissionId ? targetMission : m));
    setMissions(updatedList);
    saveEncryptedLocal(updatedList);

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
        if (nextStatus && targetMission) {
          await supabase.from('mission_templates_v3').upsert([{
            id: targetMission.id,
            leader_type: targetMission.leader_type || activeLeaderTab,
            title: encryptSecret(targetMission.title),
            space: encryptSecret(targetMission.space),
            leader_guide: encryptSecret(targetMission.leader_guide),
            partner_mission: encryptSecret(targetMission.partner_mission),
            reference_image_url: targetMission.reference_image_url || '',
            time_limit_sec: targetMission.time_limit_sec || 120
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
          alert(nextStatus ? `🔥 상대방 폰으로 [${targetMission.title}] 실전 지령이 즉시 발령되었습니다!` : '지령이 비활성화되었습니다.');
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

      const rawUuid = String(session.current_mission_id || '');
      const numericMissionId = rawUuid.startsWith('00000000-0000-4000-a000-')
        ? parseInt(rawUuid.replace('00000000-0000-4000-a000-', ''), 16)
        : Number(rawUuid) || selectedMissionId;

      const activeMissionObj = missions.find(m => m.id === numericMissionId) || missions.find(m => m.id === selectedMissionId);
      const totalStepsCount = activeMissionObj?.steps?.length || 2;

      const nextStep = (session.current_step_order || 1) + 1;
      const isLast = nextStep > totalStepsCount;

      if (isApproved && session.auth_photo_url) {
        const decUrl = decryptSecret(session.auth_photo_url);
        const fileNameMatch = decUrl.match(/\/([^/?#]+)(?:\?|#|$)/);
        if (fileNameMatch && fileNameMatch[1]) {
          const targetFile = fileNameMatch[1];
          ['auth-temp', 'mission-assets', 'chat_attachments'].forEach(bName => {
            supabase.storage.from(bName).remove([targetFile]).catch(() => {});
          });
        }
      }

      await supabase.from('active_mission_session').update({
        step_status: isApproved ? (isLast ? 'completed' : 'acting') : 'failed',
        current_step_order: isApproved && !isLast ? nextStep : session.current_step_order,
        auth_photo_url: isApproved ? null : session.auth_photo_url,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      if (isApproved) {
        setPartnerAuthPhoto(null); 
        alert(isLast ? "🎉 모든 단계 인증을 최종 승인했습니다! 이제 본 게임으로 끝까지 몰아붙이세요!" : `Step ${session.current_step_order} 인증을 승인했습니다. 다음 단계(Step ${nextStep})로 넘어갑니다.`);
      } else {
        alert("🚨 반려(FAIL) 처리했습니다. 즉시 하드코어 패널티 프로토콜이 발동됩니다!");
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

  // 현재 리드 탭에 맞춘 즉석 명령 프리셋 목록
  const instantCommandsList = useMemo(() => {
    if (activeLeaderTab === 'shindong') {
      return [
        '지금 당장 팬티까지 다 벗고 침대 위에 네 발로 무릎 꿇어',
        '내가 싸라고 허락할 때까지 보지가 아무리 떨려도 절대 먼저 가지 마',
        '전신 거울 보고 네 손가락으로 직접 보지 속살 활짝 벌려',
        '뒤돌아서 베개에 얼굴 묻고 보지 구멍 다 보이게 엉덩이 높게 들어',
        '내 눈 똑바로 쳐다보면서 내 보지에 자지 끝까지 박아달라고 야하게 애원해'
      ];
    }
    return [
      '지금 당장 바지 벗고 침대 정중앙에 누워서 양손 머리 위로 올려',
      '절대 허리 먼저 들썩이지 말고 내 보지가 네 자지 조이는 대로만 가만히 버텨',
      '내 얼굴이랑 흔들리는 가슴에서 눈 떼지 말고 내가 허락할 때까지 절대 싸지 마',
      '내 젖은 보지 아래에 얼굴 대고 내가 갈 때까지 혀로 클리토리스랑 구멍 끝까지 빨아',
      '모하나 보지 안에 정액 싸게 해달라고 지금 당장 목소리 높여서 애원해'
    ];
  }, [activeLeaderTab]);

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
      
      {/* 상단 헤더 & 발령 스위치 */}
      <div className="flex flex-col gap-3 border-b border-rose-950/60 pb-3.5 mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0 animate-ping" />
              <span className="font-mono font-black text-xs sm:text-sm text-rose-500 tracking-wider truncate">
                ENCRYPTED EROTIC POSITION & DOMINATION LAB
              </span>
            </div>
            <span className="text-[10.5px] text-zinc-400 block mt-0.5">
              정신동 지배 10종 & 모하나 여성상위 착정 10종 · 전 항목 실시간 커스텀 편집 지원
            </span>
          </div>

          <button
            onClick={handleSpinHardcoreRoulette}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-black text-[11.5px] shadow-[0_0_20px_rgba(225,29,72,0.5)] cursor-pointer active:scale-95 transition-all shrink-0"
          >
            🎲 {activeLeaderTab === 'shindong' ? '신동 지배' : '모하나 여성상위'} 랜덤 주사위 굴리기
          </button>
        </div>

        {/* 랜덤 주사위 결과 배너 */}
        {rouletteResultBanner && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-950/60 via-rose-950/60 to-black border border-fuchsia-500/50 flex flex-col gap-1 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-fuchsia-300">🎲 랜덤 조교 조합이 아래 편집창에 자동 입력되었습니다! (원하는 대로 수정 후 저장/발령 가능)</span>
              <button onClick={() => setRouletteResultBanner(null)} className="text-[10px] text-zinc-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <p className="text-[11px] text-white font-bold">• 장소: <span className="text-amber-300">{rouletteResultBanner.place}</span> / 체위: <span className="text-rose-300">{rouletteResultBanner.pose}</span></p>
            <p className="text-[10.5px] text-fuchsia-200">• 절대 수칙: {rouletteResultBanner.fetish}</p>
          </div>
        )}

        {/* ⚡ 실시간 즉석 조교 퀵 커맨드 버튼 바 + 직접 입력 발송창 */}
        <div className="flex flex-col gap-1.5 bg-black/50 p-2.5 rounded-xl border border-rose-950/60">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            <span className="text-[10px] font-mono font-black text-rose-400 shrink-0 mr-1">
              ⚡ {activeLeaderTab === 'shindong' ? '신동➔모하나' : '모하나➔신동'} 즉석명령:
            </span>
            {instantCommandsList.map((cmd, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleSendInstantDominationPulse(cmd)}
                className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white text-[10.5px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                "{cmd}"
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <input
              type="text"
              value={customInstantCommand}
              onChange={(e) => setCustomInstantCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendInstantDominationPulse(customInstantCommand);
              }}
              placeholder="직접 원하는 노골적인 즉석 명령어를 입력해 상대방 폰 상단에 바로 띄우세요..."
              className="flex-1 bg-black border border-rose-900/60 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-rose-500"
            />
            <button
              onClick={() => handleSendInstantDominationPulse(customInstantCommand)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] shrink-0 cursor-pointer"
            >
              즉시 발송 ⚡
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full">
          <button
            onClick={() => setPanicMode(true)}
            className="py-2 px-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/80 text-emerald-300 font-bold text-[11px] cursor-pointer text-center truncate"
            title="화면을 성경 묵상 일지로 즉시 위장 (ESC)"
          >
            🚨 긴급 위장 (ESC)
          </button>

          <button
            onClick={() => setTestPreviewActive(!testPreviewActive)}
            className="py-2 px-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[11px] cursor-pointer text-center truncate"
          >
            {testPreviewActive ? '✕ 시뮬 닫기' : '📱 수신 화면 미리보기'}
          </button>

          <button
            onClick={handleToggleDispatch}
            className={`col-span-2 sm:col-auto flex-1 py-2.5 px-4 rounded-xl font-black text-[11.5px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
              isMissionActiveOnPartnerPhone
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-pulse'
                : 'bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 text-white border border-rose-500/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isMissionActiveOnPartnerPhone ? 'bg-white' : 'bg-rose-300'}`} />
            {isMissionActiveOnPartnerPhone
              ? '🔥 실전 미션 발동 중 (클릭 시 해제)'
              : `🚀 [${editTitle.slice(0, 18)}...] 실전 지령 즉시 발령`}
          </button>
        </div>
      </div>

      {isMissionActiveOnPartnerPhone && (
        <div className="mb-3.5 p-4 rounded-xl border border-rose-600 bg-rose-950/20 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-black text-rose-400 uppercase">PARTNER LIVE STATUS</span>
            <span className={`px-2 py-1 rounded font-bold ${partnerStatus === 'pending_approval' ? 'bg-amber-600 text-white animate-bounce' : 'bg-zinc-800 text-zinc-400'}`}>
              {partnerStatus === 'pending_approval' ? '📸 은밀한 인증샷 도착 (확인 요망)' : partnerStatus === 'completed' ? '성공 완료 (본 게임 대기)' : partnerStatus === 'failed' ? '실패 (강제 처벌 발동됨)' : '복종 수행 중'}
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
              <span className="text-[10px] text-zinc-400 text-center">* 사진을 클릭하면 원본 크기로 확대 감상할 수 있습니다.</span>
              <div className="flex gap-2">
                <button onClick={() => handleApprovePhoto(true)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(5,150,105,0.5)] cursor-pointer">승인 (다음 스텝 / 본게임)</button>
                <button onClick={() => handleApprovePhoto(false)} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg border border-red-500 cursor-pointer">반려 (즉시 하드코어 처벌)</button>
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
              실제 휴대폰 수신 화면 시뮬레이션 ({activeLeaderTab === 'shindong' ? '정신동 주도' : '모하나 여성상위 주도'})
            </span>
            <span className="text-[9.5px] font-mono text-zinc-400">PREVIEW</span>
          </div>
          <h4 className="text-xs font-black text-white truncate">{editTitle || '제목 없음'}</h4>
          <span className="text-[10px] font-mono text-rose-400 block mb-2">{editSpace || '장소 미지정'}</span>
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
            <div>
              <span className="text-[10px] font-bold text-rose-400 block">
                {activeLeaderTab === 'shindong' ? '🔥 정신동(지배자) 행동 지침:' : '👑 모하나(여성상위 여왕) 착정 지침:'}
              </span>
              <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{editLeaderGuide || '내용 없음'}</p>
            </div>
            <div className="pt-1.5 border-t border-white/5">
              <span className="text-[10px] font-bold text-indigo-400 block">
                {activeLeaderTab === 'shindong' ? '🙇‍♀️ 모하나(복종자) 수용 지침:' : '🙇‍♂️ 정신동(피지배자) 인내·복종 지침:'}
              </span>
              <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{editPartnerMission || '내용 없음'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 탭 스위치: 정신동 리드 vs 모하나 여성상위 리드 */}
      <div className="grid grid-cols-2 gap-1.5 mb-3 w-full">
        <button
          onClick={() => handleTabSwitch('shindong')}
          className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs transition-all cursor-pointer border text-center truncate ${
            activeLeaderTab === 'shindong'
              ? 'bg-rose-950 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
              : 'bg-[#101217] text-zinc-500 border-zinc-900 hover:text-zinc-300'
          }`}
        >
          🔥 정신동 메인 · 남성주도 관통 지배 (10종)
        </button>

        <button
          onClick={() => handleTabSwitch('mohana')}
          className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs transition-all cursor-pointer border text-center truncate ${
            activeLeaderTab === 'mohana'
              ? 'bg-fuchsia-950 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.35)]'
              : 'bg-[#101217] text-zinc-500 border-zinc-900 hover:text-zinc-300'
          }`}
        >
          👑 모하나 메인 · 여성상위 착정 지배 (10종)
        </button>
      </div>

      {/* 번호 빠른 점프 바 */}
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
        {/* 좌측: 미션 목록 */}
        <div className="space-y-2 w-full min-w-0">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
              지령 목록 ({filteredMissions.length}개)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToDefaultTemplates}
                className="text-[10px] text-amber-400 hover:text-white cursor-pointer underline font-bold"
                title="교정된 20종 하드코어 원문으로 전체 초기화"
              >
                🔥 20종 원문복구
              </button>
              <button
                onClick={handleCreateNewMission}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                + 새 미션 추가
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[240px] sm:max-h-[540px] overflow-y-auto hide-scrollbar w-full">
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
                      ? 'bg-rose-950/60 border-rose-500 text-white shadow-md'
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
                      title="이 미션 복제"
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

        {/* 우측: 전 항목 실시간 커스텀 편집기 */}
        <div className="md:col-span-2 bg-[#090A0E] border border-rose-950/80 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 w-full min-w-0 box-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-black text-rose-400">
              ✏️ 선택된 미션 실시간 커스텀 편집기 ({activeLeaderTab === 'shindong' ? '정신동 주도' : '모하나 여성상위 주도'})
            </span>
            <button
              onClick={handleResetSingleMission}
              className="text-[10px] text-zinc-400 hover:text-amber-300 underline cursor-pointer"
            >
              ↺ 이 미션만 기본값 복원
            </button>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl w-full box-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-400 text-[11px]">📸 참고 체위 가이드 사진 (선택)</span>
              <div className="flex items-center gap-1.5">
                {editImageUrl && (
                  <button
                    onClick={() => setEditImageUrl('')}
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                  >
                    사진 삭제
                  </button>
                )}
                <label className="bg-rose-900 hover:bg-rose-800 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer">
                  이미지 업로드 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
            {editImageUrl && (
              <img src={editImageUrl} alt="가이드" className="h-28 w-auto object-cover rounded border border-rose-500/50" />
            )}
            
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-rose-900/30">
              <span className="font-bold text-rose-400 text-[11px]">⏳ 실전 타임어택 제한시간 (초)</span>
              <input 
                type="number" 
                value={editTimeLimit} 
                onChange={e => setEditTimeLimit(Number(e.target.value))} 
                className="w-24 px-2.5 py-1 bg-black border border-rose-500 text-white rounded outline-none text-right font-mono font-bold" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 box-border mt-1">
            <input
              type="text"
              placeholder="미션 제목 입력..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full flex-1 min-w-0 px-3 py-2 rounded-xl bg-black border border-white/15 text-white text-xs font-bold outline-none focus:border-rose-500 box-border"
            />
            <input
              type="text"
              placeholder="장소 설정..."
              value={editSpace}
              onChange={(e) => setEditSpace(e.target.value)}
              className="w-full sm:w-48 shrink-0 min-w-0 px-3 py-2 rounded-xl bg-black border border-white/15 text-white text-xs outline-none focus:border-rose-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0">
            <label className="text-[10.5px] font-black text-rose-400 font-mono tracking-tight">
              {activeLeaderTab === 'shindong'
                ? '🔥 [정신동 메인 지침] 정신동이 주도하여 모하나를 제압·관통·조교할 노골적 행동 요령'
                : '👑 [모하나 메인 지침] 모하나가 여성상위로 정신동을 깔아뭉개고 보지로 착정할 노골적 지배 요령'}
            </label>
            <textarea
              rows={4}
              placeholder="리드 주체의 구체적이고 직설적인 행동 지침을 자유롭게 수정하세요..."
              value={editLeaderGuide}
              onChange={(e) => setEditLeaderGuide(e.target.value)}
              className="w-full min-w-0 p-2.5 rounded-xl bg-black border border-white/15 text-zinc-100 text-xs leading-relaxed outline-none resize-y focus:border-rose-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0">
            <label className="text-[10.5px] font-black text-indigo-400 font-mono tracking-tight">
              {activeLeaderTab === 'shindong'
                ? '🙇‍♀️ [모하나 복종 지침] 모하나가 취해야 할 보지 개방·조임·음란 애원 요령'
                : '🙇‍♂️ [정신동 피지배 지침] 정신동이 아래에 깔려 지켜야 할 인내·사정 통제·복종 요령'}
            </label>
            <textarea
              rows={4}
              placeholder="파트너가 수행해야 할 복종 자세와 대사 지침을 자유롭게 수정하세요..."
              value={editPartnerMission}
              onChange={(e) => setEditPartnerMission(e.target.value)}
              className="w-full min-w-0 p-2.5 rounded-xl bg-black border border-white/15 text-zinc-100 text-xs leading-relaxed outline-none resize-y focus:border-indigo-500 box-border"
            />
          </div>

          <div className="flex flex-col gap-2 p-3 bg-zinc-900/90 border border-zinc-700 rounded-xl w-full box-border mt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400 text-[11px]">📝 단계별 수행 스텝 및 사진 인증 요구 (자유 수정/추가/삭제)</span>
              <button 
                onClick={() => setEditSteps([...editSteps, { id: Date.now(), step_order: editSteps.length + 1, instruction: '', requires_photo_auth: true }])} 
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-[10px] cursor-pointer transition-colors"
              >
                + 스텝 추가
              </button>
            </div>

            {editSteps.map((step, idx) => (
              <div key={step.id || idx} className="flex flex-col gap-1.5 p-2.5 bg-black rounded-lg border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-rose-400 font-mono font-black text-[10.5px]">STEP {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-[10px] text-amber-300 font-bold cursor-pointer">
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
                    {editSteps.length > 1 && (
                      <button
                        onClick={() => handleRemoveStep(idx)}
                        className="text-[10px] text-zinc-500 hover:text-red-400 font-bold cursor-pointer"
                      >
                        삭제 ✕
                      </button>
                    )}
                  </div>
                </div>
                <textarea 
                  rows={2} 
                  value={step.instruction} 
                  placeholder="이 단계에서 수행할 구체적인 노출/자세/행동 지시사항 입력..." 
                  onChange={e => {
                    const newSteps = [...editSteps];
                    newSteps[idx].instruction = e.target.value;
                    setEditSteps(newSteps);
                  }} 
                  className="bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 rounded p-2 text-white outline-none resize-y text-[11px]" 
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 p-3 bg-red-950/25 border border-red-900/60 rounded-xl w-full box-border mt-1">
            <span className="font-bold text-red-400 text-[11px]">🚨 실패 또는 반려 시 하드코어 패널티 프로토콜 (수정 가능)</span>
            <input 
              type="text" 
              placeholder="패널티 명칭 입력..." 
              value={editPenalty.title} 
              onChange={e => setEditPenalty({...editPenalty, title: e.target.value})} 
              className="bg-black border border-red-900/80 focus:border-red-500 px-2.5 py-1.5 text-white font-bold rounded outline-none text-[11px]" 
            />
            <textarea 
              rows={2} 
              placeholder="세부 벌칙 내용 입력..." 
              value={editPenalty.description} 
              onChange={e => setEditPenalty({...editPenalty, description: e.target.value})} 
              className="bg-black border border-red-900/80 focus:border-red-500 px-2.5 py-1.5 text-white rounded outline-none resize-y text-[11px]" 
            />
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900 w-full mt-2 gap-2">
            <span className="text-[9.5px] font-mono text-zinc-500 truncate">
              AES-256 E2EE · V4 HARDCORE EDITION
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveMission}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                수정사항 암호화 저장 💾
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
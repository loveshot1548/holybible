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
  if (str.startsWith('00000000-0000-4000-a000-')) {
    const hexTail = str.replace('00000000-0000-4000-a000-', '');
    const num = parseInt(hexTail, 16);
    return isNaN(num) ? 1 : num;
  }
  if (str.startsWith('00000000-0000-0000-0000-')) {
    const tail = str.replace('00000000-0000-0000-0000-', '');
    const num = parseInt(tail, 10);
    return isNaN(num) ? 1 : num;
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? 1 : num;
};

// 🌟 [PositionLab과 100% 동기화된 20종 하드코어 마스터 템플릿 + 5종 판타지 지령 폴백]
const DEFAULT_FALLBACK_TEMPLATES = [
  {
    id: 1,
    leader_type: 'shindong',
    title: '🚗 조수석 카섹스 (차량 밀착 제압 & 한계 관통)',
    space: '차량 조수석 풀 플랫',
    leader_guide: '조수석 시트를 완전히 눕히고 모하나의 옷을 벗겨 알몸으로 개방시킨 뒤, 단단히 발기된 자지를 젖은 보지 입구에 문지르며 애원하게 만든다. 양손으로 모하나의 엉덩이를 강하게 들어 올리며 질 내벽 가장 깊은 곳까지 단숨에 관통해 차체가 흔들릴 정도로 거칠게 피스톤질을 꽂아 넣는다.',
    partner_mission: '모하나는 두 다리로 신동의 허리를 단단히 감아 조이고, 차체가 흔들리는 동안 신동의 목덜미를 끌어안아 귓가에 거친 숨소리와 음란한 애원을 흘리며 밀착 유격을 0으로 유지한다.',
    time_limit_sec: 180,
    steps: [
      { id: 101, step_order: 1, instruction: '차량 조수석 시트를 완전히 눕히고 속옷까지 모두 탈의하여 다리를 벌리고 대기한다.', requires_photo_auth: false },
      { id: 102, step_order: 2, instruction: '신동의 허리를 두 다리로 감싸 안고 꽉 결합된 하체 밀착 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '차량 뒷좌석 후배위 처벌 100회', description: '차량 뒷좌석에 엎드린 채 엉덩이를 들고 거친 후배위 강제 결합 100회 및 질내사정 수용' }
  },
  {
    id: 2,
    leader_type: 'shindong',
    title: '🌃 통창 테라스 야경 (후방 노출 스릴 & 스탠딩 도기)',
    space: '프라이빗 테라스 통창 앞',
    leader_guide: '모하나를 통창 유리에 손을 짚게 하고 뒤에서 가슴을 세게 움켜쥐며 유두를 손끝과 입으로 집요하게 괴롭힌다. 흥분으로 흠뻑 젖은 보지에 자지를 뒤에서 수평으로 깊숙이 찔러 넣고 야경 유리창에 모하나의 몸이 부딪힐 정도로 몰아붙인다.',
    partner_mission: '차가운 유리창에 이마와 가슴을 밀착한 채 밖에서 보일지도 모른다는 배덕감 속에서 보지를 꽉 조이고, 뒤에서 쳐올리는 거친 반동을 허리를 휘어 버텨낸다.',
    time_limit_sec: 120,
    steps: [
      { id: 201, step_order: 1, instruction: '통창 유리에 양손과 가슴을 밀착하고 허리를 꺾어 엉덩이를 뒤로 한껏 치켜든다.', requires_photo_auth: false },
      { id: 202, step_order: 2, instruction: '야경 창문에 밀착한 알몸 뒤태와 활짝 열린 엉덩이·보지 라인 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '유리창 밀착 스팽킹 30회', description: '창문에 알몸을 밀착한 상태로 엉덩이 스팽킹 30회 및 끝날 때까지 신음 참기' }
  },
  {
    id: 3,
    leader_type: 'shindong',
    title: '🍳 주방 식탁 (M자 수직 개방 & 딥 스팟 강습)',
    space: '주방 대리석 아일랜드 식탁',
    leader_guide: '모하나를 차가운 대리석 식탁 모서리에 걸터앉히고 다리를 M자로 완전히 벌려 고정시킨 뒤, 보지 속살과 클리토리스를 입과 혀로 집요하게 빨아 애액을 넘치게 만든다. 이후 자지를 수직으로 세워 체중을 실어 자궁구까지 깊숙이 내려찍는다.',
    partner_mission: '식탁 모서리를 양손으로 꽉 쥐고 스스로 두 다리를 활짝 벌려 보지 안쪽까지 다 보이게 열어주며, 신동의 어깨에 두 발목을 걸쳐 깊은 삽입을 전부 받아낸다.',
    time_limit_sec: 120,
    steps: [
      { id: 301, step_order: 1, instruction: '대리석 식탁 끝에 걸터앉아 양손으로 두 다리를 M자로 활짝 벌려 개방한다.', requires_photo_auth: false },
      { id: 302, step_order: 2, instruction: '스스로 손가락으로 보지를 살짝 벌려 애액으로 젖은 M자 개방 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 아래 무릎 꿇고 딥 스로트 봉사', description: '식탁 아래 바닥에 무릎 꿇고 10분간 손 쓰지 않고 입과 혀로만 자지 뿌리까지 봉사' }
  },
  {
    id: 4,
    leader_type: 'shindong',
    title: '🌳 심야 공원벤치 (외투 은폐 & 노팬티 야외 스릴)',
    space: '인적 없는 심야 야외 벤치',
    leader_guide: '모하나의 속옷만 벗겨 주머니에 넣은 뒤 외투로 둘의 하체를 덮는다. 젖은 보지를 손가락 두 개로 휘저어 소리 나게 적신 뒤, 기습적으로 단단한 자지를 밀어 넣어 숨죽인 피스톤질로 야외에서 절정에 도달하게 만든다.',
    partner_mission: '노팬티 상태로 신동의 무릎 위에 올라타 외투가 흘러내리지 않도록 옷깃을 붙잡고, 터져 나오는 신음을 신동의 입술에 키스로 막으며 보지 내벽을 미친 듯이 조인다.',
    time_limit_sec: 90,
    steps: [
      { id: 401, step_order: 1, instruction: '속옷을 벗어 신동에게 바치고 외투 아래에서 신동의 무릎 위에 다리를 벌려 착좌한다.', requires_photo_auth: false },
      { id: 402, step_order: 2, instruction: '외투 속 노팬티 상태로 결합된 은밀한 하체 밀착 사진을 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '노팬티 귀가 & 현관문 앞 즉시 삽입', description: '집에 도착할 때까지 노팬티 상태 유지 및 현관문 닫자마자 벽에 기대어 후배위 삽입' }
  },
  {
    id: 5,
    leader_type: 'shindong',
    title: '🚿 스팀 샤워부스 (온수 마찰 & 서서 한쪽 다리 들기)',
    space: '타일 샤워부스 온수 스팀',
    leader_guide: '뜨거운 샤워기 온수를 맞으며 모하나를 타일 벽면에 밀어붙이고 한쪽 다리를 높게 들어 올리게 한다. 물기와 애액으로 미끄러운 보지에 자지를 뿌리까지 밀어 넣어 벽에 가둔 채 질내사정까지 거세게 털어 넣는다.',
    partner_mission: '타일 벽에 등을 기대고 한쪽 다리를 신동의 허리에 감아 가장 깊숙이 찔리는 각도를 유지하며, 신동의 목을 끌어안고 온몸으로 사정을 받아낸다.',
    time_limit_sec: 120,
    steps: [
      { id: 501, step_order: 1, instruction: '샤워기 온수로 온몸을 적신 뒤 타일 벽면에 기대어 한쪽 다리를 높게 든다.', requires_photo_auth: false },
      { id: 502, step_order: 2, instruction: '물방울이 흐르는 알몸과 한쪽 다리를 들어 개방한 자세를 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '샤워부스 유리벽 손 짚고 연속 사정 수용', description: '유리벽에 가슴과 얼굴을 붙인 채 다리가 풀릴 때까지 연속 2회 피스톤 수용' }
  },
  {
    id: 6,
    leader_type: 'shindong',
    title: '🛏️ 침실 정중앙 매트리스 (폴딩 프레스 & 자궁구 직격 사정)',
    space: '침실 매트리스 정중앙',
    leader_guide: '완전 전라 상태에서 모하나의 두 다리를 들어 가슴 쪽으로 완전히 접어 누르는 폴딩 프레스(Folding Press) 자세로 제압한다. 위에서 체중을 전부 실어 자지를 자궁 끝까지 한계치로 박아 넣으며 빠져나가지 못하게 꽉 누른 채 뜨거운 정액을 끝까지 쏟아붓는다.',
    partner_mission: '두 다리가 머리 위까지 접혀 꼼짝 못 하는 상태에서 신동의 눈을 똑바로 올려다보며, 자궁구까지 치받는 자지를 내벽으로 꽉 물고 "안에 다 싸줘"라고 애원한다.',
    time_limit_sec: 120,
    steps: [
      { id: 601, step_order: 1, instruction: '침대 정중앙에 완전 전라로 누워 두 다리를 가슴 쪽으로 깊게 끌어당겨 접는다.', requires_photo_auth: false },
      { id: 602, step_order: 2, instruction: '골반이 들려 보지와 엉덩이가 완전히 노출된 폴딩 프레스 대기 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '사정 후 자지 빼지 않고 10분간 결박 유지', description: '질내사정 후 정액이 한 방울도 흐르지 않도록 꽉 품은 채 10분간 입맞춤 복종' }
  },
  {
    id: 7,
    leader_type: 'shindong',
    title: '🪞 전신 거울 앞 배후 구속 & 강제 관음 (Mirror Watch Doggy)',
    space: '침실 대형 전신 거울 앞',
    leader_guide: '전신 거울 바로 앞에 모하나를 무릎 꿇게 하거나 세워두고, 뒤에서 한 손으로 양손 손목을 등 뒤로 잡아 고정한 채 다른 손으로 턱을 들어 거울을 보게 한다. 보지에 자지가 드나드는 모습과 자기가 쾌감에 무너지는 음란한 표정을 거울로 끝까지 똑바로 쳐다보게 만들며 거칠게 박는다.',
    partner_mission: '절대 눈을 감거나 고개를 돌리지 말고, 전신 거울 속에 비친 내 알몸과 신동에게 뒤에서 박히며 흔들리는 가슴, 결합 부위를 두 눈으로 직접 보면서 소리 내어 신음한다.',
    time_limit_sec: 150,
    steps: [
      { id: 701, step_order: 1, instruction: '전신 거울 앞에 알몸으로 무릎을 꿇고 엉덩이를 뒤로 빼며 거울 속 자신의 눈을 응시한다.', requires_photo_auth: false },
      { id: 702, step_order: 2, instruction: '거울 속에 비친 자신의 알몸과 유혹하는 눈빛이 함께 나오도록 거울 셀카를 찍어 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '거울에 손 짚고 수치심 자백 플레이', description: '거울에 손을 짚은 채 지금 어디가 얼마나 느끼고 있는지 거울을 보며 큰 소리로 5문장 자백' }
  },
  {
    id: 8,
    leader_type: 'shindong',
    title: '🖤 안대·양손 속박 & 애원 오르가즘 통제 (Blindfold Edging)',
    space: '조명을 낮춘 암막 침실',
    leader_guide: '모하나의 눈을 안대(또는 스카프)로 가리고 양손을 머리 위 침대 헤드에 묶어 시각과 움직임을 완전히 차단한다. 손끝과 혀로 유두와 클리토리스, 보지 입구만 감질나게 자극하며 절정 직전에 멈추기를 반복하여, 스스로 "제발 자지 넣어주세요"라고 애원할 때까지 애태운 뒤 단숨에 끝까지 꽂아 넣는다.',
    partner_mission: '앞이 보이지 않고 두 손이 묶인 상태에서 신동의 손길과 혀끝에만 온 신경을 집중한다. 신동이 허락하기 전까지는 절대 혼자 절정에 달하면 안 되며, 참을 수 없을 때 가장 야한 말로 삽입을 애원한다.',
    time_limit_sec: 180,
    steps: [
      { id: 801, step_order: 1, instruction: '안대를 쓰기 전 양손을 머리 위로 모으고 다리를 벌린 무방비 복종 자세를 취한다.', requires_photo_auth: false },
      { id: 802, step_order: 2, instruction: '양손을 머리 위로 올리고 신동의 처분을 기다리는 전신 복종 인증샷을 촬영해 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '속박 시간 2배 연장 & 연속 강제 절정', description: '손목 결박을 풀지 않은 채 신동이 원하는 체위로 연속 3번 갈 때까지 멈추지 않음' }
  },
  {
    id: 9,
    leader_type: 'shindong',
    title: '💋 베드 엣지 딥 스로트 & 안면 밀착 봉사 (Bed Edge Deepthroat)',
    space: '침대 모서리 끝 (베드 엣지)',
    leader_guide: '모하나를 침대 모서리에 누워 머리를 침대 밖으로 살짝 떨구게 하거나 침대 밑에 무릎 꿇게 한 뒤, 양손으로 모하나의 머리카락을 감싸 쥐고 입안 깊숙이 자지를 밀어 넣는다. 침과 눈물이 고일 정도로 깊은 펠라치오를 받은 뒤, 곧바로 다리를 벌려 보지에 꽂아 넣는다.',
    partner_mission: '두 손은 등 뒤에 두거나 신동의 허벅지를 잡은 채, 입술과 혀로 귀두부터 뿌리 끝까지 정성껏 빨아 올리며 올려다보는 눈빛으로 복종심을 표현한다.',
    time_limit_sec: 120,
    steps: [
      { id: 901, step_order: 1, instruction: '침대 모서리 아래에 무릎을 꿇거나 모서리에 머리를 기대고 입술을 벌려 준비한다.', requires_photo_auth: false },
      { id: 902, step_order: 2, instruction: '신동을 올려다보며 혀를 살짝 내민 관능적인 구강 봉사 대기 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '구강 사정 & 한 방울도 남김없이 삼키기', description: '삽입 전에 먼저 입안 가득 사정을 받아내고 깨끗하게 빨아 청소하기' }
  },
  {
    id: 10,
    leader_type: 'shindong',
    title: '🔞 귓속말 음란 자백 & 도그 크롤링 복종 (Dirty Talk & Crawl)',
    space: '침실 바닥에서 침대 위까지',
    leader_guide: '모하나가 네 발로 바닥이나 침대 위를 천천히 기어와 내 발치에 입을 맞추게 한다. 삽입하는 내내 귀에 대고 "누구 보지야?", "어디에 싸줄까?"라고 집요하게 물으며, 모하나의 입에서 가장 음란하고 복종적인 대답이 나올 때마다 허리가 부서져라 깊숙이 박아준다.',
    partner_mission: '고양이처럼 네 발로 기어 신동에게 다가와 몸을 맡기고, 신동이 물어볼 때마다 부끄러워하지 않고 "신동이 전용 보지야, 안에 가득 싸줘"라고 똑똑히 대답하며 허리를 흔든다.',
    time_limit_sec: 150,
    steps: [
      { id: 1001, step_order: 1, instruction: '침대 위에서 네 발로 엎드려 허리를 잘록하게 낮추고 고양이 자세를 취한다.', requires_photo_auth: false },
      { id: 1002, step_order: 2, instruction: '뒤돌아보며 엉덩이를 치켜든 네 발 크롤링 복종 자세를 사진으로 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '음란 음성 녹음 편지 제출', description: '오늘 밤 느낀 가장 야한 감정을 30초 이상 보이스로 녹음해 신동에게 바치기' }
  },
  {
    id: 101,
    leader_type: 'mohana',
    title: '🚗 조수석 카섹스 : 모하나의 상위 제압 (Car Cowgirl Command)',
    space: '밀폐된 차 안 조수석 플랫',
    leader_guide: '조수석 시트를 눕힌 뒤 신동을 아래에 깔고 그 위에 완전히 올라타세요. 신동의 양팔을 머리 위로 눌러 고정하고, 단단하게 선 자지 위에 앉아 골반을 천천히 내리누르며 깊이와 왕복 속도를 모하나가 100% 지배합니다.',
    partner_mission: '신동은 절대 허리를 먼저 쳐올리지 마세요. 양손은 시트 상단을 잡은 채 모하나가 체중을 싣고 내려앉는 압력을 온전히 견디며, 모하나의 허리와 엉덩이만 양손으로 받쳐주세요.',
    time_limit_sec: 120,
    steps: [
      { id: 1011, step_order: 1, instruction: '신동을 조수석 시트에 눕히고 양팔을 머리 위로 눌러 제압한다.', requires_photo_auth: false },
      { id: 1012, step_order: 2, instruction: '신동의 몸 위에 완전히 착좌하여 내리누른 상위 제압 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '신동의 역공 100회', description: '주도권을 박탈당하고 신동에게 하체 제압당한 채 끝까지 피스톤 수용' }
  },
  {
    id: 102,
    leader_type: 'mohana',
    title: '🌃 테라스 시선 통제 (아이락 그라인딩 리드)',
    space: '프라이빗 테라스 통창 앞',
    leader_guide: '신동을 통창 앞에 앉힌 뒤 턱을 잡아 시선을 모하나에게 고정시킨다. 무릎 위에 걸터앉아 자지를 뿌리까지 삼킨 채 천천히 허리를 8자로 돌리며 신동의 가쁜 호흡과 사정 타이밍을 완전히 통제한다.',
    partner_mission: '야경을 보지 말고 오직 위에서 내려다보는 모하나의 눈과 입술만 응시한다. 모하나가 허락할 때까지 절대 먼저 사정하지 말고 버틴다.',
    time_limit_sec: 120,
    steps: [
      { id: 1021, step_order: 1, instruction: '통창 앞에 신동을 앉히고 턱을 들어 시선을 자신에게 고정시킨다.', requires_photo_auth: false },
      { id: 1022, step_order: 2, instruction: '신동의 무릎 위에 걸터앉아 위에서 내려다보는 착좌 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '눈가리개 착용 & 무방비 자극', description: '안대를 착용한 채 상대방의 손길에 10분간 저항 불가' }
  },
  {
    id: 103,
    leader_type: 'mohana',
    title: '🍳 주방 식탁 착좌 라이딩 (수직 낙하 착정)',
    space: '주방 대리석 아일랜드 식탁',
    leader_guide: '식탁 의자에 앉은 신동의 허벅지 위에 마주 보고 올라탄 뒤 목덜미를 양손으로 감아쥔다. 수직으로 체중을 실어 자지를 끝까지 짓누르며 모하나가 가장 좋아하는 스팟만 집중적으로 비벼댄다.',
    partner_mission: '식탁에 등을 단단히 기대고 앉아 모하나의 엉덩이 밑살을 두 손으로 든든하게 받쳐 올려 수직 반동을 완벽히 서포트한다.',
    time_limit_sec: 120,
    steps: [
      { id: 1031, step_order: 1, instruction: '식탁 의자에 앉은 신동의 허벅지 위에 마주 보고 올라탄다.', requires_photo_auth: false },
      { id: 1032, step_order: 2, instruction: '신동의 목을 감아쥐고 수직으로 내려앉은 착좌 라이딩을 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '식탁 위 강제 복종 엎드리기', description: '식탁에 엎드린 채 신동의 후배위 강습 50회 수용' }
  },
  {
    id: 104,
    leader_type: 'mohana',
    title: '🌳 공원벤치 무릎 착좌 (외투 은폐 & 소리 참기 명령)',
    space: '인적 없는 심야 야외 벤치',
    leader_guide: '벤치에 앉은 신동의 무릎 위에 다리를 벌리고 앉아 외투로 둘을 덮는다. 신동의 귀에 "절대 소리 내지 마"라고 명령한 뒤 은밀하고 대담하게 보지로 자지를 조이며 골반을 흔든다.',
    partner_mission: '신음이 밖으로 새지 않도록 입술을 깨물고, 모하나의 등 뒤로 외투 자락을 감싸 쥐며 골반이 떨어지지 않게 꽉 잡아준다.',
    time_limit_sec: 120,
    steps: [
      { id: 1041, step_order: 1, instruction: '벤치에 앉은 신동의 무릎 위에 마주 앉아 외투로 완전히 둘을 덮는다.', requires_photo_auth: false },
      { id: 1042, step_order: 2, instruction: '외투 틈새로 신동의 숨통을 조이는 밀착 상태를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '외투 박탈 벌칙', description: '귓속말로 가장 야한 사랑 고백 3회 복창' }
  },
  {
    id: 105,
    leader_type: 'mohana',
    title: '🚿 샤워부스 벽면 압박 (신동 벽면 고정 & 비누칠 애무)',
    space: '타일 샤워부스 온수 스팀',
    leader_guide: '신동을 타일 벽으로 밀어붙여 세운 뒤, 온몸과 가슴으로 신동의 몸과 자지를 거품으로 문질러 애태운다. 한쪽 다리를 신동의 골반에 걸쳐 올리고 온수 마찰 속에서 결합을 지배한다.',
    partner_mission: '벽면에 등을 붙이고 미끄러지지 않도록 발을 딛는다. 모하나의 엉덩이와 허벅지를 강하게 받쳐 안아 완벽한 체중 지지대를 형성한다.',
    time_limit_sec: 120,
    steps: [
      { id: 1051, step_order: 1, instruction: '신동을 타일 벽으로 밀어붙이고 한쪽 다리를 신동의 골반에 건다.', requires_photo_auth: false },
      { id: 1052, step_order: 2, instruction: '온수를 맞으며 신동을 벽면에 제압한 전신 결합 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '온수 세례 받침대 벌칙', description: '샤워기 온수를 직접 맞으며 상대방을 입으로 끝까지 봉사' }
  },
  {
    id: 106,
    leader_type: 'mohana',
    title: '🛏️ 침실 매트리스 퀸 도미넌트 (양손 결박 & 무자비한 착정)',
    space: '침실 매트리스 정중앙',
    leader_guide: '신동을 침대 정중앙에 눕히고 양손을 머리 위로 묶거나 눌러 절대 움직이지 못하게 명령한다. 그 위로 올라타 가장 깊숙이 자지를 삼킨 뒤, 신동이 참지 못하고 허리를 들썩일 때마다 뺨을 어루만지며 모하나가 원하는 박자로만 끝까지 착정한다.',
    partner_mission: '양손을 매트리스 위에 고정한 채 모하나의 허락 없이 절대 허리를 움직이거나 사정하지 않는다. 모하나가 먼저 절정에 달할 때까지 완벽한 인간 딜도가 되어 받쳐준다.',
    time_limit_sec: 150,
    steps: [
      { id: 1061, step_order: 1, instruction: '신동을 매트리스에 눕히고 양손을 머리 위로 고정시킨 뒤 그 위에 올라탄다.', requires_photo_auth: false },
      { id: 1062, step_order: 2, instruction: '가장 깊숙이 주저앉아 신동을 내려다보는 여왕 시점 인증샷을 전송한다.', requires_photo_auth: true }
    ],
    penalty: { title: '허락 없는 사정 시 연속 2회전 강제 발기 봉사', description: '모하나보다 먼저 사정할 경우 쉬지 않고 입과 손으로 다시 세워 2회전 돌입' }
  },
  {
    id: 107,
    leader_type: 'mohana',
    title: '👑 안면 승마 (Face Sitting) & 숨통 조이기 오럴 지령',
    space: '침실 베개 위',
    leader_guide: '베개에 누운 신동의 얼굴 바로 위로 다리를 벌리고 올라타, 젖은 보지와 클리토리스를 신동의 입술과 혀 위에 그대로 밀착시킨다. 두 손으로 신동의 머리를 감싸 쥐고 모하나가 다리를 떨며 갈 때까지 숨도 못 쉬게 혀로 빨도록 지배한다.',
    partner_mission: '양손으로 모하나의 엉덩이와 허벅지를 꽉 붙잡고, 모하나가 위에서 짓누르는 대로 코와 입을 보지에 파묻은 채 혀끝으로 클리토리스와 질 입구를 쉬지 않고 핥아 올린다.',
    time_limit_sec: 150,
    steps: [
      { id: 1071, step_order: 1, instruction: '신동을 베개에 눕히고 얼굴 양옆에 무릎을 꿇어 마운트 자세를 취한다.', requires_photo_auth: false },
      { id: 1072, step_order: 2, instruction: '위에서 내려다보며 신동의 입술 바로 위에 밀착하기 직전의 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '모하나가 2번 연속 갈 때까지 혀 멈추기 금지', description: '손이나 자지 사용 금지, 오직 입술과 혀로만 모하나를 2번 절정에 보내기' }
  },
  {
    id: 108,
    leader_type: 'mohana',
    title: '⚡ 리버스 카우걸 (Reverse Cowgirl) & 시각 고문 리드',
    space: '침실 매트리스 또는 소파 위',
    leader_guide: '누워 있는 신동의 발 쪽을 바라보며 등지고 올라타(역립 기승위), 엉덩이와 등 라인, 그리고 보지가 자지를 삼키고 오므라드는 모습을 신동의 눈앞에 적나라하게 보여준다. 빠질 듯 말 듯 귀두만 걸쳤다 한 번에 뿌리까지 삼키며 시각적·촉각적으로 신동을 미치게 만든다.',
    partner_mission: '눈앞에서 위아래로 요동치는 모하나의 엉덩이와 자지가 삼켜지는 결합 부위를 똑바로 지켜보며, 양손으로 모하나의 골반과 발목을 잡고 리듬을 받쳐준다.',
    time_limit_sec: 150,
    steps: [
      { id: 1081, step_order: 1, instruction: '신동을 눕히고 등을 돌린 채 허벅지 위로 올라타 리버스 카우걸 자세를 잡는다.', requires_photo_auth: false },
      { id: 1082, step_order: 2, instruction: '뒤돌아 고개를 돌려 신동을 바라보며 엉덩이를 내리누른 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '신동의 스팽킹 & 후배위 즉시 전환', description: '그 자세 그대로 엎드려 신동의 거친 후배위 피스톤질 100회 수용' }
  },
  {
    id: 109,
    leader_type: 'mohana',
    title: '🔥 절정 직전 멈추기 (Edging & Ruined Control)',
    space: '침실 침대 위',
    leader_guide: '손과 입, 그리고 보지 조임으로 신동을 사정 직전(99%)까지 몰아붙인 뒤, 신동이 "쌀 것 같아"라고 신호를 보내는 순간 동작을 딱 멈추고 빠져나와 애태운다. 최소 3번 이상 사정을 참게 만든 뒤 마지막에 가장 깊숙한 곳에서 사정을 허락한다.',
    partner_mission: '모하나의 손과 보지 안에서 사정감이 끝까지 차오를 때마다 참지 말고 솔직하게 신호를 보내며, 모하나가 "싸도 돼"라고 허락하기 전까지는 이 악물고 사정을 참아낸다.',
    time_limit_sec: 180,
    steps: [
      { id: 1091, step_order: 1, instruction: '신동을 눕히고 손과 입술로 자지를 단단하게 세워 절정 직전까지 몰아붙인다.', requires_photo_auth: false },
      { id: 1092, step_order: 2, instruction: '완전히 달아오른 신동을 위에서 통제하는 리드 인증샷을 촬영한다.', requires_photo_auth: true }
    ],
    penalty: { title: '참지 못하고 조기 사정 시 밤새 노예 복종권 부여', description: '허락 전에 싸버릴 경우 오늘 밤 모하나가 원하는 모든 애무와 요구 조건 무조건 복종' }
  },
  {
    id: 110,
    leader_type: 'mohana',
    title: '👠 아마조네스 프레스 (Amazon Position) & 하체 완전 제압',
    space: '침실 매트리스 정중앙',
    leader_guide: '신동을 눕히고 신동의 두 다리를 위로 들어 올린 뒤, 모하나가 위에서 무릎을 꿇고 신동의 허벅지를 양팔로 껴안듯 누르며 위에서 아래로 자지를 보지에 깊숙이 삼킨다. 남녀의 공수 위치가 완전히 뒤바뀐 극한의 지배 체위로 신동의 신음을 뽑아낸다.',
    partner_mission: '두 다리를 모하나의 어깨와 가슴 쪽에 맡긴 채 하체가 완전히 들려 제압당한 상태에서, 위에서 내리꽂듯 움직이는 모하나의 보지 압박에 온몸을 맡기고 신음한다.',
    time_limit_sec: 150,
    steps: [
      { id: 1101, step_order: 1, instruction: '신동을 눕히고 두 다리를 가슴 쪽으로 들어 올려 하체를 완전히 제압한다.', requires_photo_auth: false },
      { id: 1102, step_order: 2, instruction: '위에서 신동의 다리를 감싸 안고 내려다보는 아마조네스 제압 자세를 인증한다.', requires_photo_auth: true }
    ],
    penalty: { title: '포지션 역전 & 폴딩 프레스 반격', description: '제한시간 초과 시 즉시 공수가 교대되어 신동의 폴딩 프레스 강습 수용' }
  }
];

const QUICK_REPLIES = [
  '❤️ 지금 다 벗고 기다릴게 빨리 와',
  '🔥 벌써 다 젖었어 마음대로 해줘',
  '⏳ 허락할 때까지 절대 안 싸고 참을게',
  '👑 오늘 밤은 끝까지 나를 지배해줘'
];

const IconCamera = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;

export default function MissionReceiverModal({ currentUserName = '' }) {
  // 🌟 [절대 보안] 오직 '모하나' 본인 기기에서만 활성화 (동명이인/공백/타 계정 원천 차단)
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

    const clean = String(raw).replace(/\s+/g, '').toLowerCase();
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
  const lastSessionTimestampRef = useRef(null);
  const manuallyDismissedAtRef = useRef(null);

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
    if (!supabase || !isTargetMohana) return;
    try {
      const updatePayload = {
        partner_status: status,
        updated_at: new Date().toISOString()
      };
      if (quickReplyText) {
        updatePayload.partner_quick_reply = encryptSecret(quickReplyText);
        await supabase.from('shared_qt').upsert([{
          date: 'couple_heartbeat_pulse',
          video_id: encryptSecret(JSON.stringify({
            sender: '모하나',
            message: `🔥 [모하나 미션 시그널] ${quickReplyText}`,
            temp: 39.8,
            timestamp: Date.now()
          }))
        }], { onConflict: 'date' });
      }
      await supabase
        .from('mission_dispatch_status')
        .upsert({ id: 1, ...updatePayload }, { onConflict: 'id' });
    } catch (e) {}
  }, [isTargetMohana]);

  // 🌟 [핵심 개선] 신동 님이 ON 하면 즉시 열리고, OFF 하면 0.1초 만에 닫히며, 새 지령 발령 시 자동 재오픈!
  const fetchSessionData = useCallback(async (forceOpen = false) => {
    if (!supabase || !isTargetMohana) return;
    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from('active_mission_session')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      // 신동 님이 OFF 했거나 세션이 없으면 즉시 모달 닫기 및 초기화
      if (sessionErr || !sessionData || !sessionData.is_active) {
        setShowModal(false);
        setSession(null);
        setIsAccepted(false);
        setTimeLeft(null);
        lastSessionTimestampRef.current = null;
        manuallyDismissedAtRef.current = null;
        releaseWakeLock();
        return;
      }

      // 만료 시간 체크
      if (sessionData.expires_at) {
        const expTime = new Date(sessionData.expires_at).getTime();
        if (expTime > 0 && expTime + (10 * 60 * 1000) < Date.now()) {
          setShowModal(false);
          setSession(null);
          return;
        }
      }

      // 신동 님이 새로 발령(reading 상태 + 새로운 updated_at)했는지 감지하여 수동 닫힘 해제!
      const sessionStamp = `${sessionData.current_mission_id}_${sessionData.step_status}_${sessionData.current_step_order}`;
      if (lastSessionTimestampRef.current !== sessionStamp) {
        lastSessionTimestampRef.current = sessionStamp;
        if (sessionData.step_status === 'reading') {
          setIsAccepted(false);
          setTimeLeft(null);
          manuallyDismissedAtRef.current = null;
        }
      }

      const currentMissionId = parseMissionIdFromDb(sessionData.current_mission_id);

      // 1. 내장 20종 템플릿에서 안전 매칭
      let templatePayload = DEFAULT_FALLBACK_TEMPLATES.find(t => t.id === currentMissionId) || DEFAULT_FALLBACK_TEMPLATES[0];

      // 2. DB에서 암호화된 커스텀 템플릿 조회 및 복호화
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

      // 스텝 정보 복호화 조회
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
          { id: 999, step_order: 1, instruction: '신동님의 지시에 따라 복종 자세를 잡고 준비하세요.', requires_photo_auth: false }
        ];
      }

      // 패널티 프로토콜 복호화 조회
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

      if (forceOpen || !manuallyDismissedAtRef.current) {
        setShowModal(true);
        requestWakeLock();
      }

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
      manuallyDismissedAtRef.current = null;
      fetchSessionData(true);
    };
    window.addEventListener('trigger_mission_modal', handleTriggerEvent);

    const pollingTimer = setInterval(() => fetchSessionData(false), 2500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSessionData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const subChannel = supabase.channel('mohana_mission_stream_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_mission_session' 
      }, (payload) => {
        if (payload.new && payload.new.is_active === false) {
          setShowModal(false);
          setSession(null);
          setIsAccepted(false);
          setTimeLeft(null);
          releaseWakeLock();
        } else {
          manuallyDismissedAtRef.current = null;
          fetchSessionData(true);
        }
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

    reportStatusToShindong('acting', selectedQuickReply || '🔥 지령을 수락하고 실전 자세에 돌입했습니다!');

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
        auth_photo_url: encryptSecret(publicUrl),
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      reportStatusToShindong('pending_approval', '📸 은밀한 인증샷을 촬영하여 전송했습니다!');
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
      step_status: isLastStep ? 'completed' : 'acting',
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
            onClick={() => {
              setPanicMode(false);
              manuallyDismissedAtRef.current = Date.now();
              setShowModal(false);
              releaseWakeLock();
            }}
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
        <p className="text-red-300 font-bold mb-8">제한 시간 초과 · 인증 반려</p>
        
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
          <button
            onClick={() => {
              manuallyDismissedAtRef.current = Date.now();
              setShowModal(false);
              releaseWakeLock();
            }}
            className="w-full mt-5 py-3 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl text-xs cursor-pointer"
          >
            처벌 수용 및 창 닫기
          </button>
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
          onClick={() => {
            manuallyDismissedAtRef.current = Date.now();
            setShowModal(false);
            releaseWakeLock();
          }} 
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPanicMode(true)}
                className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-bold text-[10px] cursor-pointer hover:bg-emerald-900"
                title="화면을 성경 묵상 카드로 즉시 위장"
              >
                🚨 긴급위장
              </button>
              <button
                onClick={() => {
                  manuallyDismissedAtRef.current = Date.now();
                  setShowModal(false);
                }}
                className="px-2 py-0.5 rounded-lg bg-white/10 text-zinc-300 font-bold text-[10px] cursor-pointer"
                title="잠시 창 접어두기"
              >
                _ 접기
              </button>
            </div>
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
                  {isShindongLeader ? '👑 모하나가 수행할 복종 미션' : '👑 모하나의 지휘 지침'}
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
                신동에게 즉시 보낼 설렘·복종 시그널:
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
              <span>🔥</span> 지령 수락 & 실전 돌입
            </button>
          ) : isPending ? (
            <div className="w-full py-3.5 text-center bg-amber-950/50 border border-amber-600/50 rounded-2xl text-amber-400 font-bold animate-pulse text-sm">
              신동님 인증샷 컨펌 대기 중...
            </div>
          ) : currentStep?.requires_photo_auth ? (
            <label className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black text-sm transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer active:scale-95">
              <IconCamera />
              {isUploading ? '암호화 전송 중...' : '인증샷 촬영 및 전송'}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={isUploading} onChange={handlePhotoUpload} />
            </label>
          ) : (
            <button 
              onClick={handleNextStepWithoutAuth} 
              className="w-full py-4 rounded-2xl font-black text-sm transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] active:scale-95"
            >
              현재 단계 수행 완료
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
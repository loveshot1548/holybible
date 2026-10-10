// src/games/jerusalem/data/buildings.js

export const CATEGORIES = [
  { id: 'infra', label: '인프라/도로', icon: '🛤️' },
  { id: 'housing', label: '주거 구역', icon: '⛺' },
  { id: 'industry', label: '농업/물류', icon: '🌾' },
  { id: 'market', label: '상업/장터', icon: '🏺' },
  { id: 'holy', label: '성지/성전', icon: '🏛️' },
  { id: 'defense', label: '성벽/치안', icon: '🧱' }
];

export const BUILDINGS = {
  // ── [인프라 / 교통망] ──
  road: {
    category: 'infra', id: 'road', name: '로마식 석조도로', cost: 5, emoji: '🛤️', w: 1, h: 1,
    desc: '다듬은 석회암 판석 도로. 순례자와 나귀 캐러밴이 다니는 도시의 혈관입니다.'
  },
  aqueduct: {
    category: 'infra', id: 'aqueduct', name: '실로암 수로', cost: 12, emoji: '💧', w: 1, h: 1,
    desc: '기혼샘의 생명수를 도성 안으로 연결합니다. 주택 2단계 진화에 필수적인 생명선입니다.'
  },
  well: {
    category: 'infra', id: 'well', name: '야곱의 우물', cost: 25, emoji: '🪣', w: 1, h: 1,
    desc: '반경 3.5타일 안의 가옥에 맑은 지하수를 공급하여 질병을 예방합니다.'
  },
  fountain: {
    category: 'infra', id: 'fountain', name: '광장 대리석 분수', cost: 75, emoji: '⛲', w: 2, h: 2,
    desc: '2x2 광장 분수대. 귀족 대리석 궁정 진화에 필수적인 시저식 랜드마크입니다.'
  },

  // ── [주거 구역 (시저 3식 5단계 진화)] ──
  house: {
    category: 'housing', id: 'house', name: '주거 지정 구역', cost: 15, emoji: '⛺', w: 1, h: 1,
    desc: '순례자가 정착합니다. 물, 빵, 생선, 회당, 포도주 공급 여부에 따라 5단계로 진화합니다.'
  },

  // ── [농업 / 생산 / OpenTTD 물류] ──
  wheat_farm: {
    category: 'industry', id: 'wheat_farm', name: '갈릴리 밀밭', cost: 30, emoji: '🌾', w: 2, h: 2,
    desc: '2x2 황금 밀밭과 방앗간. 매 턴 식량을 수확하여 빵 장터로 보냅니다.'
  },
  fishery: {
    category: 'industry', id: 'fishery', name: '갈릴리 어선 선착장', cost: 40, emoji: '⛵', w: 2, h: 2,
    desc: '2x2 목조 부두. 그물을 던져 신선한 물고기를 수확합니다. (마태 4장 베드로 퀘스트)'
  },
  olive_grove: {
    category: 'industry', id: 'olive_grove', name: '감람산 올리브원', cost: 45, emoji: '🫒', w: 2, h: 2,
    desc: '2x2 올리브 농원. 성전 등잔대 기름과 고급 저택에 필요한 올리브유를 생산합니다.'
  },
  vineyard: {
    category: 'industry', id: 'vineyard', name: '가나의 포도원', cost: 50, emoji: '🍇', w: 2, h: 2,
    desc: '2x2 포도원. 유월절 만찬과 5단계 궁정 저택에 필요한 포도주를 생산합니다.'
  },
  granary: {
    category: 'industry', id: 'granary', name: '요셉의 곡물창고', cost: 65, emoji: '🛖', w: 2, h: 2,
    desc: '2x2 저장고. 식량 비축 한도를 늘려 흉년과 가뭄에 대비합니다.'
  },
  caravan: {
    category: 'industry', id: 'caravan', name: '나귀 캐러밴 기지', cost: 85, emoji: '🐪', w: 2, h: 2,
    desc: '2x2 물류 기지! OpenTTD 무역망으로 식량 수송 속도를 2배로 가속하고 무역세를 법니다.'
  },

  // ── [상업 장터] ──
  bread_market: {
    category: 'market', id: 'bread_market', name: '생명의 빵 장터', cost: 50, emoji: '🍞', w: 2, h: 2,
    desc: '2x2 장터. 밀가루를 빵으로 구워 주민들에게 배급하고 세겔을 거둡니다.'
  },
  fish_market: {
    category: 'market', id: 'fish_market', name: '가버나움 생선전', cost: 65, emoji: '🐟', w: 2, h: 2,
    desc: '2x2 수산시장. 갈릴리 생선을 공급하여 주택을 3단계로 진화시킵니다.'
  },
  sacrifice_market: {
    category: 'market', id: 'sacrifice_market', name: '성전 제물 시장', cost: 85, emoji: '🏺', w: 2, h: 2,
    desc: '2x2 제물 장터. 비둘기와 어린양을 판매하여 막대한 무역세를 거둡니다.'
  },
  money_changer: {
    category: 'market', id: 'money_changer', name: '성전 환전소', cost: 115, emoji: '🪙', w: 1, h: 1,
    desc: '로마 은전을 성전 반 세겔로 환전하는 금융 거점입니다.'
  },

  // ── [신앙 / 성지] ──
  synagogue: {
    category: 'holy', id: 'synagogue', name: '가버나움 백색회당', cost: 130, emoji: '📜', w: 2, h: 2,
    desc: '2x2 열주식 석회암 회당. 율법을 강론하고 주택을 4단계로 진화시킵니다.'
  },
  beatitudes: {
    category: 'holy', id: 'beatitudes', name: '팔복 기도 동산', cost: 160, emoji: '🌸', w: 2, h: 2,
    desc: '2x2 동산. 산상수훈의 복을 기념하며 도시 신앙도를 크게 올립니다.'
  },
  gethsemane: {
    category: 'holy', id: 'gethsemane', name: '겟세마네 동산', cost: 190, emoji: '🌿', w: 2, h: 2,
    desc: '2x2 고목 올리브 동산. 눈물의 기도로 도시 신앙도를 극대화합니다.'
  },
  golgotha: {
    category: 'holy', id: 'golgotha', name: '골고다 십자가 언덕', cost: 250, emoji: '✝️', w: 2, h: 2,
    desc: '2x2 갈보리 암반. 인류 대속의 십자가로 도시 전체에 영원한 평안을 선포합니다.'
  },
  temple: {
    category: 'holy', id: 'temple', name: '헤롯 제2성전 (대성전)', cost: 500, emoji: '🏛️', w: 3, h: 3,
    desc: '3x3 초대형 복합체! 회랑과 번제단, 지성소를 갖춘 예루살렘의 영원한 심장입니다.'
  },

  // ── [성벽 / 치안] ──
  wall: {
    category: 'defense', id: 'wall', name: '다윗성 성벽', cost: 20, emoji: '🧱', w: 1, h: 1,
    desc: '견고한 석회암 성벽으로 외적의 침입을 방어합니다.'
  },
  gate: {
    category: 'defense', id: 'gate', name: '다마스커스 성문', cost: 45, emoji: '🚪', w: 2, h: 1,
    desc: '2x1 요새화 성문. 순례자들의 통행세를 징수합니다.'
  },
  tower: {
    category: 'defense', id: 'tower', name: '안토니아 망대', cost: 80, emoji: '🗼', w: 1, h: 1,
    desc: '파수꾼이 화재를 신속하게 진압하고 치안을 유지합니다.'
  }
};

export const HOUSE_TIERS = [
  { level: 1, name: '베두인 텐트', pop: 4, tax: 3, emoji: '⛺', color: '#D4C4A8', roof: '#B39D7B' },
  { level: 2, name: '갈릴리 흙벽돌집', pop: 10, tax: 8, emoji: '🛖', color: '#BFA47F', roof: '#8C6239' },
  { level: 3, name: '석회암 평지붕 가옥', pop: 25, tax: 22, emoji: '🏠', color: '#E8DEC8', roof: '#A0522D' },
  { level: 4, name: '다윗성 2층 저택', pop: 55, tax: 55, emoji: '🏡', color: '#F3EDE2', roof: '#C0392B' },
  { level: 5, name: '로마식 대리석 궁정', pop: 120, tax: 130, emoji: '🏰', color: '#FFFFFF', roof: '#D97706' }
];
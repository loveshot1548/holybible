// src/games/jerusalem/data/buildings.js

// =====================================================================
// 🏛️ 1. 도시 구역 카테고리 (Caesar III / Pharaoh 표준 6대 인프라)
// =====================================================================
export const CATEGORIES = [
  { 
    id: 'infra', 
    label: '인프라/도로', 
    icon: '🛤️', 
    themeColor: '#78350F',
    desc: '도시의 혈관인 포장도로망과 생명수를 공급하는 상수도 체계' 
  },
  { 
    id: 'housing', 
    label: '주거 구역', 
    icon: '⛺', 
    themeColor: '#B45309',
    desc: '순례자가 정착하고 인프라에 따라 5단계로 번영하는 가옥' 
  },
  { 
    id: 'industry', 
    label: '농업/물류', 
    icon: '🌾', 
    themeColor: '#15803D',
    desc: '식량과 올리브유, 포도주를 수확하고 무역을 활성화하는 생산 거점' 
  },
  { 
    id: 'market', 
    label: '상업/장터', 
    icon: '🏺', 
    themeColor: '#C2410C',
    desc: '생필품 배급 및 성전 은전 환전을 통한 조세 징수 거점' 
  },
  { 
    id: 'holy', 
    label: '성지/성전', 
    icon: '🏛️', 
    themeColor: '#4338CA',
    desc: '마태복음 구속사 연대기를 기념하고 도시 신앙도를 고양하는 거룩한 성소' 
  },
  { 
    id: 'defense', 
    label: '성벽/치안', 
    icon: '🧱', 
    themeColor: '#334155',
    desc: '도시 치안 유지, 화재 진압 및 외적으로부터 도성을 수호하는 요새' 
  }
];

// =====================================================================
// 🏛️ 2. 고고학 고증 24대 건축물 마스터 카탈로그 (2.5D 메트릭 및 고유 이모지 완비)
// =====================================================================
export const BUILDINGS = {
  // ── [1. 인프라 / 도로 및 수자원] ──
  road: {
    id: 'road',
    category: 'infra',
    name: '로마식 석조도로',
    emoji: '🛤️',
    cost: 5,
    upkeep: 0,
    w: 1,
    h: 1,
    workers: 0,
    desirability: 1,
    speedMultiplier: 1.5,
    audioTrigger: 'hammer',
    desc: '다듬은 석회암 판석 도로. 순례자와 나귀 캐러밴이 다니는 도시의 혈관입니다. (드래그 연속 건설)',
    scripture: '마 3:3 "주의 길을 준비하라 그가 오실 길을 곧게 하라"',
    archeology: '헤롯 대왕 시절 티로포에온 골짜기에 건설된 도로로, 두께 30cm 이상의 석회암 판석을 결구해 마차와 행렬의 통행을 지탱했습니다.',
    renderProfile: {
      style: 'flagstone_paving',
      baseColor: 0xC2B095,
      kerbColor: 0x7D674B,
      stoneColor: 0x9C876E,
      elevation: 2
    }
  },
  aqueduct: {
    id: 'aqueduct',
    category: 'infra',
    name: '실로암 수로',
    emoji: '🌉',
    cost: 12,
    upkeep: 1,
    w: 1,
    h: 1,
    workers: 1,
    desirability: 2,
    serviceRadius: 4.5,
    audioTrigger: 'hammer',
    desc: '기혼샘의 맑은 물을 도성으로 공급합니다. 주택 2단계 진화에 필수적인 생명선입니다.',
    scripture: '요 9:7 "실로암 못에 가서 씻으라 하시니 (실로암은 번역하면 보냄을 받았다는 뜻이라)"',
    archeology: '히스기야 터널과 연결된 실로암 수로교 양식으로, 경사를 이용한 중력식 석조 아치 도수관입니다.',
    renderProfile: {
      style: 'open_arch_aqueduct',
      wallColor: 0xFAF2E6,
      shadeColor: 0xC9B69C,
      waterColor: 0x38BDF8,
      lineColor: 0x8C7860,
      height: 30
    }
  },
  well: {
    id: 'well',
    category: 'infra',
    name: '야곱의 우물',
    emoji: '💧',
    cost: 25,
    upkeep: 2,
    w: 1,
    h: 1,
    workers: 2,
    desirability: 2,
    serviceRadius: 3.8,
    audioTrigger: 'hammer',
    desc: '반경 3.8타일 안의 가옥에 맑은 지하수를 공급하여 역병을 예방합니다.',
    scripture: '요 4:6 "거기 또 야곱의 우물이 있더라 예수께서 길 가시다가 피곤하여 우물 곁에 그대로 앉으시니"',
    archeology: '사마리아 수가성 근처의 유서 깊은 우물 구조를 본뜬 석조 림과 목조 A자 도르래 프레임입니다.',
    renderProfile: {
      style: 'stone_well',
      rimColor: 0x78716C,
      waterColor: 0x0284C7,
      timberColor: 0x78350F,
      bucketColor: 0x5C381E,
      height: 24
    }
  },
  fountain: {
    id: 'fountain',
    category: 'infra',
    name: '광장 대리석 분수',
    emoji: '⛲',
    cost: 75,
    upkeep: 5,
    w: 2,
    h: 2,
    workers: 4,
    desirability: 5,
    serviceRadius: 5.5,
    audioTrigger: 'coin',
    desc: '2x2 랜드마크 분수 광장. 귀족 대리석 궁정(5단계) 진화에 필수적인 님파에움입니다.',
    scripture: '계 21:6 "내가 생명수 샘물을 목마른 자에게 값없이 주리니"',
    archeology: '로마-헬레니즘 양식의 공공 분수탑(Nymphaeum)으로, 대리석 수조와 사자머리 토수구를 통해 물이 순환했습니다.',
    renderProfile: {
      style: 'mosaic_fountain',
      basinColor: 0xE2E8F0,
      waterColor: 0x0284C7,
      sprayColor: 0xE0F2FE,
      statueColor: 0xF8FAFC,
      treeColor: 0x15803D,
      height: 36,
      particles: 'water_spray'
    }
  },
  plaza: {
    id: 'plaza',
    category: 'infra',
    name: '다윗성 석조 광장',
    emoji: '⬜',
    cost: 15,
    upkeep: 1,
    w: 1,
    h: 1,
    workers: 0,
    desirability: 4,
    audioTrigger: 'hammer',
    desc: '헤롯식 다듬은 돌판으로 포장된 광장. 도로 역할을 겸하며 주변 주택의 품격을 크게 높입니다.',
    scripture: '느 8:1 "모든 백성이 일제히 수문 앞 광장에 모여 학사 에스라에게 율법책을 가져오기를 청하매"',
    archeology: '기원전 1세기 예루살렘 상부 도시에서 발굴된 기하학적 석조 패턴의 공공 광장 포장재입니다.',
    renderProfile: {
      style: 'paved_plaza',
      baseColor: 0xE8DCC8,
      accentColor: 0xBFA47F,
      elevation: 4
    }
  },

  // ── [2. 주거 구역] ──
  house: {
    id: 'house',
    category: 'housing',
    name: '주거 지정 구역',
    emoji: '🏠',
    cost: 15,
    upkeep: 0,
    w: 1,
    h: 1,
    workers: 0,
    desirability: 1,
    audioTrigger: 'hammer',
    desc: '순례자가 정착합니다. 물, 빵, 생선, 회당, 포도주 공급 여부에 따라 5단계 대리석 궁정까지 진화합니다.',
    scripture: '마 7:24 "누구든지 나의 이 말을 듣고 행하는 자는 그 집을 반석 위에 지은 지혜로운 사람 같으리니"',
    archeology: '베두인 천막부터 유대 산지의 석회암 평지붕 가옥, 헤롯 시대 귀족 저택에 이르기까지 500년간의 주거 변천사입니다.',
    renderProfile: {
      style: 'evolving_house',
      isDynamicTier: true
    }
  },

  // ── [3. 농업 / 생산 / 물류] ──
  wheat_farm: {
    id: 'wheat_farm',
    category: 'industry',
    name: '갈릴리 밀밭 & 풍차',
    emoji: '🌾',
    cost: 30,
    upkeep: 3,
    w: 2,
    h: 2,
    workers: 6,
    production: { resource: 'food', rate: 14, efficiencyBase: 1.0 },
    desirability: -1,
    audioTrigger: 'hammer',
    desc: '2x2 대형 밀밭과 회전 풍차 방앗간. 매 턴 밀가루 식량을 수확하여 빵 장터로 보냅니다.',
    scripture: '마 13:30 "추수 때에 내가 추수꾼들에게 말하기를 곡식은 모아 내 곳간에 넣으라 하리라"',
    archeology: '갈릴리 호수 주변의 비옥한 현무암 토양에서 재배되던 엠머 밀(Emmer Wheat)과 회전 맷돌 방앗간입니다.',
    renderProfile: {
      style: 'windmill_field',
      fieldColor: 0xFEF08A,
      furrowColor: 0xEAB308,
      millWallColor: 0xE5D8C5,
      timberColor: 0x78350F,
      bladeColor: 0x5C381E,
      height: 44,
      animated: 'windmill_sail'
    }
  },
  fishery: {
    id: 'fishery',
    category: 'industry',
    name: '갈릴리 어선 선착장',
    emoji: '⛵',
    cost: 40,
    upkeep: 4,
    w: 2,
    h: 2,
    workers: 8,
    production: { resource: 'fish', rate: 12, efficiencyBase: 1.0 },
    desirability: 0,
    audioTrigger: 'hammer',
    desc: '2x2 목조 부두. 그물을 던져 신선한 물고기를 수확합니다. (마태 4장 베드로 퀘스트)',
    scripture: '마 4:19 "말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라 하시니"',
    archeology: '1986년 깅노사르 진흙 속에서 발굴된 기원 1세기 목조 갈릴리 나룻배(Jesus Boat)의 선체 구조를 고증했습니다.',
    renderProfile: {
      style: 'wooden_pier_boat',
      waterColor: 0x38BDF8,
      pierColor: 0x854D0E,
      boatColor: 0x78350F,
      sailColor: 0xF8FAFC,
      height: 36
    }
  },
  olive_grove: {
    id: 'olive_grove',
    category: 'industry',
    name: '감람산 올리브원',
    emoji: '🫒',
    cost: 45,
    upkeep: 4,
    w: 2,
    h: 2,
    workers: 6,
    production: { resource: 'oil', rate: 9, efficiencyBase: 1.0 },
    desirability: 2,
    audioTrigger: 'hammer',
    desc: '2x2 올리브 농원. 성전 등잔대 기름과 고급 저택에 필요한 올리브유를 생산합니다.',
    scripture: '출 27:20 "너는 또 이스라엘 자손에게 명령하여 감람으로 짠 순수한 기름을 등불을 위하여 네게로 가져오게 하고"',
    archeology: '감람산 서쪽 기슭의 고목 올리브 과원과 무거운 석재 추를 지렛대로 눌러 기름을 짜내는 겟세마네 기름틀입니다.',
    renderProfile: {
      style: 'olive_press',
      groveColor: 0x84CC16,
      trunkColor: 0x5C381E,
      leafColor: 0x4D7C0F,
      stonePressColor: 0x78716C,
      height: 32
    }
  },
  vineyard: {
    id: 'vineyard',
    category: 'industry',
    name: '가나의 포도원',
    emoji: '🍇',
    cost: 50,
    upkeep: 5,
    w: 2,
    h: 2,
    workers: 8,
    production: { resource: 'wine', rate: 7, efficiencyBase: 1.0 },
    desirability: 2,
    audioTrigger: 'hammer',
    desc: '2x2 포도원. 유월절 만찬과 5단계 궁정 저택에 필요한 최상급 포도주를 생산합니다.',
    scripture: '요 15:5 "나는 포도나무요 너희는 가지라 그가 내 안에, 내가 그 안에 거하면 사람이 열매를 많이 맺나니"',
    archeology: '석회암 암반을 2단으로 파서 발로 밟아 즙을 내던 고대 유대식 석조 포도즙틀(Gat)과 점토 발효 항아리 구조입니다.',
    renderProfile: {
      style: 'vine_terrace',
      terraceColor: 0xC084FC,
      trellisColor: 0x78350F,
      vatColor: 0xA855F7,
      height: 30
    }
  },
  granary: {
    id: 'granary',
    category: 'industry',
    name: '요셉의 곡물창고',
    emoji: '🏺',
    cost: 65,
    upkeep: 4,
    w: 2,
    h: 2,
    workers: 4,
    storageBonus: { food: 120, fish: 60 },
    desirability: 0,
    audioTrigger: 'hammer',
    desc: '2x2 대형 저장고. 곡물 비축 한도를 크게 늘리고 식량 손실을 막아 흉년에 대비합니다.',
    scripture: '창 41:48 "요셉이 애굽 땅에 있는 그 칠 년 곡물을 거두어 각 성에 쌓아 두되"',
    archeology: '쥐와 습기를 막기 위해 바닥을 띄운 목조 통나무 받침대와 점토 회반죽으로 마감한 원통형 곡식 사일로입니다.',
    renderProfile: {
      style: 'clay_silo',
      siloColor: 0xD4A373,
      thatchColor: 0xA16207,
      timberColor: 0x5C381E,
      height: 48
    }
  },
  caravan: {
    id: 'caravan',
    category: 'industry',
    name: '나귀 캐러밴 무역 기지',
    emoji: '🐪',
    cost: 85,
    upkeep: 6,
    w: 2,
    h: 2,
    workers: 10,
    tradeTaxBonus: 32,
    desirability: 0,
    audioTrigger: 'coin',
    desc: '2x2 물류 기지! 무역 낙타 상단을 파견해 식량 수송을 가속하고 매 턴 32 세겔의 무역세를 법니다.',
    scripture: '사 60:6 "허다한 낙타, 미디안과 에바의 어린 낙타가 네 가운데에 가득할 것이며"',
    archeology: '다마스커스와 알렉산드리아를 잇는 "왕의 대로" 무역상들이 나귀와 짐을 묶어두던 대상 숙소(Caravanserai)입니다.',
    renderProfile: {
      style: 'caravan_depot',
      corralColor: 0xC2B095,
      fenceColor: 0x78350F,
      tentColor: 0x92400E,
      cargoColor: 0xF59E0B,
      height: 38
    }
  },

  // ── [4. 상업 장터] ──
  bread_market: {
    id: 'bread_market',
    category: 'market',
    name: '생명의 빵 장터',
    emoji: '🍞',
    cost: 50,
    upkeep: 3,
    w: 2,
    h: 2,
    workers: 4,
    serviceRadius: 5.0,
    tradeTaxBonus: 12,
    audioTrigger: 'coin',
    desc: '2x2 장터. 밀가루를 빵으로 구워 주변 가옥에 배급하고 주택을 3단계 이상으로 진화시킵니다.',
    scripture: '요 6:35 "예수께서 이르시되 나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요"',
    archeology: '흙으로 빚은 탄두르 화덕(Tabun)에서 구워낸 납작한 효모 빵과 보리떡을 배급하던 중앙 아고라 장터입니다.',
    renderProfile: {
      style: 'awning_market',
      awningColor: 0xD97706,
      wallColor: 0xFAF2E6,
      stallColor: 0x78350F,
      produceColor: 0xD97706,
      height: 40
    }
  },
  fish_market: {
    id: 'fish_market',
    category: 'market',
    name: '가버나움 생선전',
    emoji: '🐟',
    cost: 65,
    upkeep: 4,
    w: 2,
    h: 2,
    workers: 5,
    serviceRadius: 5.0,
    tradeTaxBonus: 16,
    audioTrigger: 'coin',
    desc: '2x2 수산시장. 갈릴리 생선을 공급하여 주택을 4단계 귀족 저택으로 진화시킵니다.',
    scripture: '눅 24:42 "이에 구운 생선 한 토막을 드리니 받으사 그 앞에서 잡수시더라"',
    archeology: '막달라 특산물인 소금에 절인 틸라피아(베드로 물고기)를 보관 통에 담아 내륙 예루살렘으로 유통하던 생선 어물전입니다.',
    renderProfile: {
      style: 'awning_market',
      awningColor: 0x0284C7,
      wallColor: 0xFAF2E6,
      stallColor: 0x78350F,
      produceColor: 0x0284C7,
      height: 40
    }
  },
  sacrifice_market: {
    id: 'sacrifice_market',
    category: 'market',
    name: '성전 제물 시장',
    emoji: '🕊️',
    cost: 85,
    upkeep: 5,
    w: 2,
    h: 2,
    workers: 6,
    serviceRadius: 5.2,
    tradeTaxBonus: 28,
    desirability: 0,
    audioTrigger: 'coin',
    desc: '2x2 제물 장터. 순례자들에게 비둘기와 흠 없는 어린양을 공급하여 높은 세입을 거둡니다.',
    scripture: '요 2:14 "성전 안에서 소와 양과 비둘기 파는 사람들과 돈 바꾸는 사람들이 앉아 있는 것을 보시고"',
    archeology: '감람산 능선과 성전 바깥뜰에서 대제사장 가문의 공인을 받아 유월절 순례자들에게 비둘기와 어린양을 팔던 시장입니다.',
    renderProfile: {
      style: 'animal_market',
      fenceColor: 0x78350F,
      cageColor: 0xC9B69C,
      canopyColor: 0x9333EA,
      height: 38
    }
  },
  money_changer: {
    id: 'money_changer',
    category: 'market',
    name: '성전 환전소',
    emoji: '⚖️',
    cost: 115,
    upkeep: 6,
    w: 1,
    h: 1,
    workers: 3,
    tradeTaxBonus: 42,
    desirability: 1,
    audioTrigger: 'coin',
    desc: '로마 은전을 티레의 순은 세겔로 환전하여 매 턴 42 세겔의 막대한 국고 수익을 창출합니다.',
    scripture: '마 21:12 "예수께서 성전에 들어가사 돈 바꾸는 사람들의 상과 비둘기 파는 사람들의 의자를 둘러 엎으시고"',
    archeology: '로마 황제의 얼굴이 새겨진 동전을 성전세 납부용 티레 은전으로 교환해주던 환전상의 탁자입니다.',
    renderProfile: {
      style: 'banking_table',
      tableColor: 0x5C381E,
      chestColor: 0xF59E0B,
      canopyColor: 0x1E3A8A,
      height: 24
    }
  },

  // ── [5. 신앙 / 성지] ──
  synagogue: {
    id: 'synagogue',
    category: 'holy',
    name: '가버나움 백색회당',
    emoji: '🕍',
    cost: 130,
    upkeep: 8,
    w: 2,
    h: 2,
    workers: 6,
    faithBonus: 25,
    serviceRadius: 6.0,
    audioTrigger: 'shofar',
    desc: '2x2 열주식 회당. 토라 율법을 강론하고 주변 주택을 4단계 2층 저택으로 진화시킵니다.',
    scripture: '눅 4:16 "예수께서 그 자라나신 곳 나사렛에 이르사 안식일에 늘 하시던 대로 회당에 들어가사 성경을 읽으려고 서시매"',
    archeology: '가버나움 현무암 터 위에 세워진 순백의 석회암 회당 구조로, 코린트식 주두와 메노라 부조가 새겨진 헬레니즘식 종교 회당입니다.',
    renderProfile: {
      style: 'corinthian_synagogue',
      pedimentColor: 0xF1F5F9,
      wallColor: 0xFFFFFF,
      shadeColor: 0xCBD5E1,
      pillarColor: 0xF8FAFC,
      roofColor: 0x94A3B8,
      symbolColor: 0xF59E0B,
      height: 64
    }
  },
  beatitudes: {
    id: 'beatitudes',
    category: 'holy',
    name: '팔복 기도 동산',
    emoji: '⛰️',
    cost: 160,
    upkeep: 6,
    w: 2,
    h: 2,
    workers: 4,
    faithBonus: 30,
    serviceRadius: 6.0,
    desirability: 5,
    audioTrigger: 'shofar',
    desc: '2x2 동산. 산상수훈의 여덟 가지 복을 기념하며 도시 신앙도를 크게 올립니다.',
    scripture: '마 5:3 "심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요"',
    archeology: '갈릴리 타브가 언덕의 완만한 원형극장 지형으로, 수천 명의 군중이 주님의 음성을 명료하게 들을 수 있었던 동산입니다.',
    renderProfile: {
      style: 'prayer_garden',
      grassColor: 0x65A30D,
      flowerColor: 0xF43F5E,
      altarColor: 0xFAF2E6,
      height: 28
    }
  },
  gethsemane: {
    id: 'gethsemane',
    category: 'holy',
    name: '겟세마네 눈물의 동산',
    emoji: '🌳',
    cost: 190,
    upkeep: 7,
    w: 2,
    h: 2,
    workers: 4,
    faithBonus: 35,
    serviceRadius: 6.2,
    desirability: 4,
    audioTrigger: 'shofar',
    desc: '2x2 고목 올리브 동산. 땀이 핏방울이 되도록 기도하신 대속의 성소입니다.',
    scripture: '눅 22:44 "예수께서 힘쓰고 애써 더욱 간절히 기도하시니 땀이 땅에 떨어지는 핏방울 같이 되더라"',
    archeology: '감람산 깊은 골짜기에 위치한 수령 2천 년의 고목 올리브나무들과 바위 암반이 조화를 이루는 기도처입니다.',
    renderProfile: {
      style: 'gnarled_grove',
      rockColor: 0x57534E,
      trunkColor: 0x3E2723,
      foliageColor: 0x3F6212,
      height: 34
    }
  },
  golgotha: {
    id: 'golgotha',
    category: 'holy',
    name: '골고다 십자가 언덕',
    emoji: '✝️',
    cost: 250,
    upkeep: 10,
    w: 2,
    h: 2,
    workers: 6,
    faithBonus: 50,
    serviceRadius: 7.5,
    desirability: 4,
    audioTrigger: 'shofar',
    desc: '2x2 갈보리 암반. 인류 대속의 십자가로 도시 전체에 영원한 구원과 평안을 선포합니다.',
    scripture: '요 19:17-18 "그들이 예수를 맡으매 예수께서 자기의 십자가를 지시고 해골이라 하는 곳에 나가시니"',
    archeology: '성벽 밖 채석장 절벽에 우뚝 솟은 단층 석회암 바위로, 예수 그리스도의 대속 십자가가 세워진 구속사의 중심지입니다.',
    renderProfile: {
      style: 'calvary_cliff',
      rockFaceColor: 0x44403C,
      rockTopColor: 0x1C1917,
      crossCenterColor: 0x78350F,
      crossSideColor: 0x5C381E,
      titulusColor: 0xF5EBE0,
      height: 60
    }
  },
  temple: {
    id: 'temple',
    category: 'holy',
    name: '헤롯 제2성전 (대성전)',
    emoji: '👑',
    cost: 500,
    upkeep: 25,
    w: 3,
    h: 3,
    workers: 20,
    faithBonus: 80,
    serviceRadius: 10.0,
    desirability: 10,
    audioTrigger: 'shofar',
    desc: '3x3 초대형 복합체! 회랑과 번제단, 황금 성소를 갖춘 예루살렘의 심장입니다. (시온산 고지대 추천)',
    scripture: '시 122:1 "사람이 내게 말하기를 여호와의 집에 올라가자 할 때에 내가 기뻐하였도다"',
    archeology: '흰 대리석과 순금 판으로 덮여 멀리서 보면 눈 덮인 산처럼 눈부셨던 헤이칼(HaHeikhal)과 번제단 복합 성소입니다.',
    renderProfile: {
      style: 'herodian_temple_complex',
      plinthColor: 0xD1BE9F,
      facadeWallColor: 0xFAF2E6,
      facadeShadeColor: 0xC9B69C,
      goldCorniceColor: 0xF59E0B,
      goldAccentColor: 0xD97706,
      marbleColumnsColor: 0xFFFFFF,
      altarStoneColor: 0x5C381E,
      height: 108,
      particles: 'altar_smoke'
    }
  },

  // ── [6. 성벽 / 치안] ──
  wall: {
    id: 'wall',
    category: 'defense',
    name: '다윗성 석회암 성벽',
    emoji: '🧱',
    cost: 20,
    upkeep: 1,
    w: 1,
    h: 1,
    workers: 1,
    desirability: 1,
    audioTrigger: 'hammer',
    desc: '견고한 모루 다듬은 돌 성벽. 외적으로부터 도성을 수호합니다. (드래그 연속 시공)',
    scripture: '시 51:18 "주의 은택으로 시온에 선을 행하시고 예루살렘 성을 쌓으소서"',
    archeology: '헤롯이 거대한 메갈리스(Ashlar) 석회암 블록으로 보강한 예루살렘의 제1성벽 구조입니다.',
    renderProfile: {
      style: 'crenellated_wall',
      wallColor: 0x94A3B8,
      shadeColor: 0x64748B,
      crenelColor: 0x475569,
      height: 38
    }
  },
  gate: {
    id: 'gate',
    category: 'defense',
    name: '다마스커스 요새 성문',
    emoji: '🚪',
    cost: 45,
    upkeep: 3,
    w: 2,
    h: 1,
    workers: 4,
    tradeTaxBonus: 18,
    desirability: 2,
    audioTrigger: 'hammer',
    desc: '2x1 요새화 성문. 도로망과 자동 연결되어 순례자들의 통행세를 징수합니다.',
    scripture: '시 100:4 "감사함으로 그의 문에 들어가며 찬송함으로 그의 궁정에 들어가서"',
    archeology: '북쪽 수리아 방면에서 진입하는 주 출입문으로, 이중 아치 석조 문루와 화살 슬릿을 갖춘 방어 거점입니다.',
    renderProfile: {
      style: 'fortress_gate',
      gateWallColor: 0x94A3B8,
      archColor: 0x475569,
      woodDoorColor: 0x3E2723,
      ironBandColor: 0x1E293B,
      height: 48
    }
  },
  tower: {
    id: 'tower',
    category: 'defense',
    name: '안토니아 망대 (치안/소방)',
    emoji: '🗼',
    cost: 80,
    upkeep: 5,
    w: 1,
    h: 1,
    workers: 6,
    serviceRadius: 6.5,
    desirability: 2,
    audioTrigger: 'hammer',
    desc: '파수꾼이 화재와 치안을 감시하여 주변 가옥의 안전도를 높입니다.',
    scripture: '사 62:6 "예루살렘이여 내가 너의 성벽 위에 파수꾼을 두었나니 그들이 종일종야 잠잠하지 아니할 것이라"',
    archeology: '성전 북서쪽 모퉁이에 세워진 4개 모퉁이 탑 요새로, 예루살렘 전체를 조망하던 감시 망대입니다.',
    renderProfile: {
      style: 'watchtower',
      towerColor: 0x94A3B8,
      shadeColor: 0x64748B,
      slitColor: 0x1E293B,
      beaconColor: 0xF59E0B,
      height: 58
    }
  }
};

// =====================================================================
// 🏠 3. 시저 3식 5단계 주택 진화 트리 (Housing Evolution Meta)
// =====================================================================
export const HOUSE_TIERS = [
  {
    level: 1,
    tierId: 'tent',
    name: '베두인 염소털 텐트',
    emoji: '⛺',
    title: '나그네의 장막',
    pop: 4,
    tax: 3,
    consumptionPerCapita: { food: 0.20, fish: 0.00, oil: 0.00, wine: 0.00 },
    requirementsDesc: '기본 정착 (도로 또는 광장 연결 필요)',
    nextRequirementDesc: '실로암 수로나 야곱의 우물 연결 시 흙벽돌집으로 진화',
    archeology: '아브라함과 족장 시대부터 광야 유목민들이 사용하던 거친 검은 염소털 직물 텐트입니다.',
    renderProfile: {
      style: 'goat_hair_tent',
      fabricColor: 0x5C4033,
      borderLineColor: 0x2D1E12,
      ropePoleColor: 0x3E2723,
      fireColor: 0xEF4444,
      height: 26
    }
  },
  {
    level: 2,
    tierId: 'mudbrick',
    name: '갈릴리 흙벽돌집',
    emoji: '🛖',
    title: '어부와 농부의 보금자리',
    pop: 10,
    tax: 8,
    consumptionPerCapita: { food: 0.30, fish: 0.15, oil: 0.00, wine: 0.00 },
    requirementsDesc: '식수 공급 (수로 또는 우물 연결)',
    nextRequirementDesc: '생명의 빵 장터 개설 및 밀가루 공급 시 석회암 가옥으로 진화',
    archeology: '햇볕에 말린 점토 벽돌과 돌출된 포플러 통나무 서까래(Vigas), 짚과 진흙을 다진 평지붕입니다.',
    renderProfile: {
      style: 'adobe_clay_house',
      wallColor: 0xD4A373,
      shadeWallColor: 0xA45A17,
      vigasWoodColor: 0x5C381E,
      flatRoofColor: 0x8C6239,
      doorColor: 0x3B1C0B,
      height: 38
    }
  },
  {
    level: 3,
    tierId: 'limestone',
    name: '석회암 평지붕 가옥',
    emoji: '🏠',
    title: '예루살렘 시민의 석조 가옥',
    pop: 25,
    tax: 22,
    consumptionPerCapita: { food: 0.35, fish: 0.25, oil: 0.10, wine: 0.00 },
    requirementsDesc: '식수 + 생명의 빵 장터 공급',
    nextRequirementDesc: '생선 시장 및 가버나움 회당 배속 시 2층 저택으로 진화',
    archeology: '예루살렘 멜레케 석회암을 정밀하게 다듬어 올린 평지붕 주택으로, 옥상 난간과 외벽 돌계단을 갖췄습니다.',
    renderProfile: {
      style: 'ashlar_terrace_house',
      wallColor: 0xFAF2E6,
      shadeWallColor: 0xC9B69C,
      flatRoofColor: 0x8C6239,
      stairsColor: 0x5C381E,
      potteryColor: 0xB45309,
      height: 48
    }
  },
  {
    level: 4,
    tierId: 'villa',
    name: '다윗성 2층 테라스 저택',
    emoji: '🏡',
    title: '제사장과 상인의 부유한 저택',
    pop: 55,
    tax: 55,
    consumptionPerCapita: { food: 0.35, fish: 0.25, oil: 0.15, wine: 0.08 },
    requirementsDesc: '식수 + 빵 + 생선 + 회당 율법 교육',
    nextRequirementDesc: '광장 분수대 + 포도주 + 성전 예배 완비 시 대리석 궁정으로 진화',
    archeology: '예루살렘 상부 도시에서 발굴된 2층 저택 구조로, 로마식 붉은 테라코타 기와와 포도나무 퍼골라 테라스를 갖췄습니다.',
    renderProfile: {
      style: 'terracotta_two_story_villa',
      wallColor: 0xFAF2E6,
      shadeWallColor: 0xC9B69C,
      roofColor: 0xC85A32,
      roofRidgeColor: 0x8C3518,
      balconyColor: 0xA16207,
      railingColor: 0xF59E0B,
      height: 60
    }
  },
  {
    level: 5,
    tierId: 'palace',
    name: '로마-헤롯식 대리석 궁정',
    emoji: '🏛️',
    title: '황금빛 거룩한 궁정 (최고 등급)',
    pop: 120,
    tax: 130,
    consumptionPerCapita: { food: 0.35, fish: 0.25, oil: 0.15, wine: 0.10 },
    requirementsDesc: '식수 + 분수대 + 빵 + 생선 + 포도주 + 회당 + 성전 예배',
    nextRequirementDesc: '🌟 번영의 극치에 도달한 최고 등급 주거지입니다!',
    archeology: '순백의 수입 대리석 열주와 황금 박공, 중앙 안뜰 풀장(Atrium)을 갖춘 헬레니즘 최고위 귀족의 궁전입니다.',
    renderProfile: {
      style: 'herodian_marble_domus',
      wallColor: 0xFFFFFF,
      shadeWallColor: 0xE2E8F0,
      roofColor: 0xF59E0B,
      pedimentColor: 0xDC2626,
      columnColor: 0xF8FAFC,
      columnCapColor: 0x94A3B8,
      height: 72
    }
  }
];

// =====================================================================
// 🛠️ 4. 시뮬레이션 엔진 헬퍼 유틸리티
// =====================================================================
export const getBuildingMeta = (id) => {
  return BUILDINGS[id] || null;
};

export const getHouseTierMeta = (level) => {
  const clamped = Math.max(1, Math.min(5, level || 1));
  return HOUSE_TIERS[clamped - 1] || HOUSE_TIERS[0];
};

export const evaluateHouseEvolution = (env) => {
  const { hasRoad, hasWater, hasMarket, hasHoly, hasFountain, food = 0, fish = 0, oil = 0, wine = 0, faith = 0 } = env;

  if (!hasRoad || !hasWater) return 1;
  if (hasRoad && hasWater && (!hasMarket || food < 8)) return 2;
  if (hasRoad && hasWater && hasMarket && food >= 8 && (!hasHoly || fish < 5 || oil < 4)) return 3;
  if (hasRoad && hasWater && hasMarket && hasHoly && fish >= 5 && oil >= 4 && (!hasFountain || wine < 3 || faith < 70)) return 4;
  if (hasRoad && hasWater && hasMarket && hasHoly && hasFountain && wine >= 3 && faith >= 70) return 5;

  return 1;
};
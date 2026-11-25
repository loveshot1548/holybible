// src/metaverse/voxel/VoxelEngine.js (Sandbox Master Edition — 채굴·터널·물주기·월드확장)
import * as THREE from 'three';

// =====================================================================
// 1. 34종 복셀 블록 카탈로그 (광석 4종 · 젖은흙 · 이끼돌 · 건초 · 암반 추가)
// =====================================================================
export const BLOCK_CATALOG = [
  // 지형 (10종)
  { id: 'grass', cat: '지형', label: '잔디', icon: '🟩', color: '#589C30', accent: '#3D751D', hi: '#70B542', drop: 'dirt', hp: 1, roughness: 0.92 },
  { id: 'dirt', cat: '지형', label: '흙', icon: '🟫', color: '#825735', accent: '#5E3B20', hi: '#996C47', drop: 'dirt', hp: 1, roughness: 0.94 },
  { id: 'farm_soil', cat: '지형', label: '마른텃밭', icon: '🌱', color: '#6E4528', accent: '#4D2E18', hi: '#855635', drop: 'dirt', hp: 1, roughness: 0.95 },
  { id: 'wet_soil', cat: '지형', label: '젖은텃밭', icon: '💧', color: '#3E2210', accent: '#261307', hi: '#522E17', drop: 'dirt', hp: 1, roughness: 0.65 },
  { id: 'sand', cat: '지형', label: '모래', icon: '🟨', color: '#D4BC88', accent: '#B59B65', hi: '#E3CFA2', drop: 'sand', hp: 1, roughness: 0.92 },
  { id: 'water', cat: '지형', label: '맑은물', icon: '🌊', color: '#198EA8', accent: '#0F6A82', hi: '#42B6CC', transparent: true, opacity: 0.72, hp: 1, roughness: 0.12 },
  { id: 'leaf', cat: '지형', label: '나뭇잎', icon: '🌿', color: '#37873B', accent: '#226026', hi: '#50A654', drop: 'wood', hp: 1, roughness: 0.88 },
  { id: 'blossom', cat: '지형', label: '벚꽃잎', icon: '🌸', color: '#E0879B', accent: '#C26178', hi: '#F0ABBA', drop: 'wood', hp: 1, roughness: 0.88 },
  { id: 'cobble', cat: '지형', label: '자갈길', icon: '🪨', color: '#8C8881', accent: '#615E58', hi: '#ABA69E', drop: 'stone', hp: 2, roughness: 0.92 },
  { id: 'hay_block', cat: '지형', label: '건초블록', icon: '🌾', color: '#D4A838', accent: '#9E781E', hi: '#E8C258', drop: 'straw', hp: 1, roughness: 0.95 },

  // 광석 & 지하 (5종)
  { id: 'ore_coal', cat: '광석', label: '석탄광석', icon: '⬛', color: '#6E6D6B', accent: '#1F2024', hi: '#8A8885', drop: 'coal', hp: 2, roughness: 0.88 },
  { id: 'ore_iron', cat: '광석', label: '철광석', icon: '🔩', color: '#787775', accent: '#C99B7B', hi: '#94928F', drop: 'iron', hp: 3, roughness: 0.82 },
  { id: 'ore_gold', cat: '광석', label: '황금광석', icon: '✨', color: '#757472', accent: '#EAB308', hi: '#FDE047', drop: 'gold', hp: 3, roughness: 0.78 },
  { id: 'ore_crystal', cat: '광석', label: '자수정원석', icon: '💎', color: '#584E6E', accent: '#A855F7', hi: '#E9D5FF', drop: 'crystal', hp: 3, emissive: '#7E22CE', emissiveIntensity: 0.45, roughness: 0.4 },
  { id: 'bedrock', cat: '광석', label: '지하암반', icon: '🌑', color: '#27272A', accent: '#18181B', hi: '#3F3F46', unbreakable: true, hp: 99, roughness: 0.96 },

  // 벽체 (7종)
  { id: 'ivory_wall', cat: '벽체', label: '아이보리벽', icon: '⬜', color: '#E0D6C5', accent: '#C2B49E', hi: '#EDE6D8', drop: 'stone', hp: 2, roughness: 0.88 },
  { id: 'stucco', cat: '벽체', label: '스타코벽', icon: '🏛️', color: '#D4C5B0', accent: '#B3A28C', hi: '#E3D7C5', drop: 'stone', hp: 2, roughness: 0.9 },
  { id: 'temba_wood', cat: '벽체', label: '템바보드', icon: '🪵', color: '#BF8B53', accent: '#7A4E23', hi: '#D4A16A', drop: 'wood', hp: 2, roughness: 0.78 },
  { id: 'stone', cat: '벽체', label: '석재벽돌', icon: '🧱', color: '#9B9488', accent: '#70695E', hi: '#B3ACA1', drop: 'stone', hp: 2, roughness: 0.9 },
  { id: 'mossy_stone', cat: '벽체', label: '이끼석벽', icon: '🪴', color: '#7E8574', accent: '#486636', hi: '#9DA392', drop: 'stone', hp: 2, roughness: 0.92 },
  { id: 'brick', cat: '벽체', label: '붉은벽돌', icon: '🧱', color: '#A14D38', accent: '#733120', hi: '#B8634E', drop: 'stone', hp: 2, roughness: 0.88 },
  { id: 'granite', cat: '벽체', label: '화강암벽', icon: '🪨', color: '#616D7A', accent: '#424C57', hi: '#7B8794', drop: 'stone', hp: 3, roughness: 0.85 },

  // 바닥/타일 (6종)
  { id: 'marble', cat: '바닥', label: '대리석', icon: '◻️', color: '#DCE1E8', accent: '#B2BCC7', hi: '#EAEFF5', drop: 'stone', hp: 2, roughness: 0.45 },
  { id: 'porcelain', cat: '바닥', label: '포세린타일', icon: '🔳', color: '#8C96A0', accent: '#65707B', hi: '#A6AFB8', drop: 'stone', hp: 2, roughness: 0.55 },
  { id: 'plank', cat: '바닥', label: '원목마루', icon: '🟧', color: '#B57B43', accent: '#825225', hi: '#C99058', drop: 'wood', hp: 1, roughness: 0.72 },
  { id: 'checker', cat: '바닥', label: '체크바닥', icon: '🏁', color: '#D2D8DE', accent: '#334155', hi: '#E4E9EE', drop: 'stone', hp: 2, roughness: 0.52 },
  { id: 'carpet_red', cat: '바닥', label: '레드카펫', icon: '🟥', color: '#AB2929', accent: '#7A1717', hi: '#C23F3F', drop: 'cloth', hp: 1, roughness: 0.95 },
  { id: 'carpet_navy', cat: '바닥', label: '네이비카펫', icon: '🟦', color: '#1C448A', accent: '#122D5E', hi: '#2C5AA6', drop: 'cloth', hp: 1, roughness: 0.95 },

  // 지붕/특수 (6종)
  { id: 'roof_red', cat: '특수', label: '빨간기와', icon: '🔺', color: '#B0392A', accent: '#7D2014', hi: '#C74C3C', drop: 'wood', hp: 2, roughness: 0.78 },
  { id: 'roof_blue', cat: '특수', label: '청색기와', icon: '🔷', color: '#24519C', accent: '#16366E', hi: '#3768B5', drop: 'wood', hp: 2, roughness: 0.78 },
  { id: 'wood', cat: '특수', label: '통나무', icon: '🌲', color: '#7A4A25', accent: '#522E14', hi: '#945E35', drop: 'wood', hp: 2, roughness: 0.85 },
  { id: 'glass', cat: '특수', label: '통유리', icon: '🧊', color: '#94CFE6', accent: '#E0F2FE', hi: '#FFFFFF', transparent: true, opacity: 0.42, drop: 'glass', hp: 1, roughness: 0.15 },
  { id: 'lantern', cat: '특수', label: '황동랜턴', icon: '🏮', color: '#FDE68A', accent: '#6B3410', hi: '#FFFBEB', emissive: '#F59E0B', emissiveIntensity: 1.35, drop: 'gold', hp: 1, roughness: 0.35 },
  { id: 'crystal_lamp', cat: '특수', label: '자수정등', icon: '🔮', color: '#D8B4FE', accent: '#6B21A8', hi: '#F3E8FF', emissive: '#A855F7', emissiveIntensity: 1.4, drop: 'crystal', hp: 1, roughness: 0.25 }
];

// =====================================================================
// 2. 33종 고퀄리티 아이템 (농사 부산물 · 우물 · 모닥불 · 수레 · 꽃 4종 추가)
// =====================================================================
export const PROP_CATALOG = [
  // 농장 & 수확 소품
  { id: 'hay_bale', label: '볏짚더미', icon: '🌾', solid: true, recipe: { straw: 2 } },
  { id: 'fruit_basket', label: '과일바구니', icon: '🧺', solid: false, recipe: { wood: 1, crop: 2 } },
  { id: 'well', label: '돌우물', icon: '🪣', solid: true, isWaterSource: true, recipe: { stone: 4, wood: 2 } },
  { id: 'campfire', label: '모닥불', icon: '🔥', solid: false, isLight: true, recipe: { wood: 3, coal: 1 } },
  { id: 'cart', label: '나무수레', icon: '🛒', solid: true, recipe: { wood: 4, iron: 1 } },
  { id: 'bucket', label: '물양동이', icon: '🪣', solid: false, recipe: { wood: 1, iron: 1 } },

  // 꽃밭 4종
  { id: 'flower_tulip', label: '빨간튤립', icon: '🌷', solid: false, recipe: { dirt: 1 } },
  { id: 'flower_lavender', label: '라벤더', icon: '🪻', solid: false, recipe: { dirt: 1 } },
  { id: 'flower_daisy', label: '흰데이지', icon: '🌼', solid: false, recipe: { dirt: 1 } },
  { id: 'flower_rose', label: '장미덤불', icon: '🌹', solid: false, recipe: { dirt: 1 } },

  // 입체 울타리 3종
  { id: 'fence_wood', label: '나무울타리', icon: '🪵', solid: true, isFence: true, recipe: { wood: 1 } },
  { id: 'fence_log', label: '통나무울타리', icon: '🌲', solid: true, isFence: true, recipe: { wood: 2 } },
  { id: 'fence_stone', label: '돌울타리', icon: '🪨', solid: true, isFence: true, recipe: { stone: 2 } },

  // 교회 & 건축
  { id: 'door', label: '여닫이문', icon: '🚪', solid: true, isDoor: true, recipe: { wood: 2 } },
  { id: 'window', label: '아치형창문', icon: '🪟', solid: true, recipe: { wood: 1, glass: 2 } },
  { id: 'cross', label: '황금십자가', icon: '✝️', solid: true, recipe: { wood: 1, gold: 2 } },
  { id: 'pulpit', label: '원목강대상', icon: '📖', solid: true, recipe: { wood: 3, gold: 1 } },
  { id: 'offering', label: '헌금함', icon: '📦', solid: true, recipe: { wood: 2, gold: 1 } },
  { id: 'pew', label: '성도장의자', icon: '🪑', solid: true, recipe: { wood: 3, cloth: 1 } },

  // 찬양 악단 8종
  { id: 'piano', label: '그랜드피아노', icon: '🎹', solid: true, recipe: { wood: 4, stone: 2 } },
  { id: 'drum', label: '드럼세트', icon: '🥁', solid: true, recipe: { wood: 2, gold: 2 } },
  { id: 'guitar_ac', label: '통기타', icon: '🎸', solid: false, recipe: { wood: 2 } },
  { id: 'guitar_el', label: '일렉기타', icon: '⚡', solid: false, recipe: { wood: 2, gold: 1 } },
  { id: 'cello', label: '첼로', icon: '🎻', solid: false, recipe: { wood: 3 } },
  { id: 'synth', label: '신디사이저', icon: '🎛️', solid: true, recipe: { stone: 2, gold: 1 } },
  { id: 'speaker', label: '스피커', icon: '🔊', solid: true, recipe: { wood: 2, stone: 1 } },
  { id: 'mic', label: '스탠드마이크', icon: '🎤', solid: false, recipe: { stone: 1, gold: 1 } },

  // 생활 & 정원
  { id: 'torch', label: '가로등불', icon: '🏮', solid: true, isLight: true, recipe: { wood: 1, coal: 1 } },
  { id: 'flower', label: '들꽃화분', icon: '🪴', solid: false, recipe: { dirt: 1 } },
  { id: 'table', label: '식탁테이블', icon: '🍽️', solid: true, recipe: { wood: 2 } },
  { id: 'chair', label: '원목의자', icon: '🪑', solid: false, recipe: { wood: 1 } },
  { id: 'bed', label: '침대', icon: '🛏️', solid: true, recipe: { wood: 2, cloth: 2 } },
  { id: 'mirror', label: '전신거울', icon: '🪞', solid: true, recipe: { wood: 1, glass: 2 } }
];

// =====================================================================
// 3. 6종 작물 (수확 시 볏짚/과일바구니 부산물 연동) · 10종 동물 · 5종 물고기
// =====================================================================
export const CROP_CATALOG = [
  { id: 'rice', label: '황금벼', icon: '🌾', color: '#D4A838', stem: '#789E32', growSec: 12, heartReward: 10, harvestMat: 'straw', bonusProp: 'hay_bale' },
  { id: 'wheat', label: '밀', icon: '🌿', color: '#DFB958', stem: '#689132', growSec: 11, heartReward: 8, harvestMat: 'straw', bonusProp: 'hay_bale' },
  { id: 'corn', label: '옥수수', icon: '🌽', color: '#EAB308', stem: '#4B8B3B', growSec: 14, heartReward: 12, harvestMat: 'crop', bonusProp: 'fruit_basket' },
  { id: 'strawberry', label: '딸기', icon: '🍓', color: '#E11D48', stem: '#3F8C36', growSec: 13, heartReward: 10, harvestMat: 'crop', bonusProp: 'fruit_basket' },
  { id: 'pumpkin', label: '호박', icon: '🎃', color: '#D97706', stem: '#3D7A2F', growSec: 16, heartReward: 14, harvestMat: 'crop', bonusProp: 'fruit_basket' },
  { id: 'sunflower', label: '해바라기', icon: '🌻', color: '#EAB308', stem: '#4C8F38', growSec: 10, heartReward: 12, harvestMat: 'gold', bonusProp: null }
];

export const ANIMAL_CATALOG = [
  { id: 'sheep', label: '어린양', icon: '🐑', bodyColor: '#EAE6DF', headColor: '#3D4450', accent: '#D6D0C5', scale: 0.92, sound: '메에~ 🐑', heartReward: 6, msg: '복슬복슬한 어린양이 반갑게 비빕니다!' },
  { id: 'dog', label: '강아지', icon: '🐶', bodyColor: '#C48A4D', headColor: '#A66F38', accent: '#6B4220', scale: 0.85, sound: '멍멍! 🐶', heartReward: 6, msg: '꼬리를 힘차게 흔들며 반겨줍니다!' },
  { id: 'cat', label: '치즈고양이', icon: '🐱', bodyColor: '#E09F4F', headColor: '#E09F4F', accent: '#F7E7CE', scale: 0.72, sound: '야옹~ 🐱', heartReward: 6, msg: '따뜻한 햇살 아래 그르릉거립니다!' },
  { id: 'rabbit', label: '하얀토끼', icon: '🐰', bodyColor: '#F2F0EC', headColor: '#F2F0EC', accent: '#F2B8C6', scale: 0.65, sound: '깡총! 🐰', heartReward: 5, msg: '귀를 쫑긋거리며 깡총 뛰어오릅니다!' },
  { id: 'chick', label: '병아리', icon: '🐥', bodyColor: '#EBD04B', headColor: '#EBD04B', accent: '#D97706', scale: 0.56, sound: '삐약! 🐥', heartReward: 4, msg: '노란 병아리가 아장아장 따라옵니다!' },
  { id: 'cow', label: '얼룩젖소', icon: '🐄', bodyColor: '#EDEAE4', headColor: '#2B2F36', accent: '#D99B9B', scale: 1.15, sound: '음메~ 🐄', heartReward: 8, msg: '순한 젖소가 신선한 우유를 선물합니다!' },
  { id: 'pig', label: '아기돼지', icon: '🐷', bodyColor: '#E39FA8', headColor: '#E39FA8', accent: '#C47682', scale: 0.82, sound: '꿀꿀! 🐷', heartReward: 6, msg: '분홍 아기돼지가 신나게 코를 킁킁거립니다!' },
  { id: 'fox', label: '사막여우', icon: '🦊', bodyColor: '#D99B58', headColor: '#E6B57A', accent: '#F7EAD9', scale: 0.78, sound: '캉캉! 🦊', heartReward: 7, msg: '큰 귀를 팔랑이며 호기심 가득 쳐다봅니다!' },
  { id: 'penguin', label: '펭귄', icon: '🐧', bodyColor: '#232B38', headColor: '#232B38', accent: '#F2F5F8', scale: 0.82, sound: '꽥꽥! 🐧', heartReward: 8, msg: '설원의 펭귄이 뒤뚱뒤뚱 걸어옵니다!' },
  { id: 'polar_bear', label: '북극곰', icon: '🐻‍❄️', bodyColor: '#E8EDF2', headColor: '#E8EDF2', accent: '#334155', scale: 1.28, sound: '어흥~ 🐻‍❄️', heartReward: 10, msg: '듬직한 북극곰이 앞발을 들어 인사합니다!' }
];

export const FISH_CATALOG = [
  { id: 'koi', label: '비단잉어', body: '#E05A2B', stripe: '#F8FAFC', tail: '#F59E0B', size: 1.05 },
  { id: 'goldfish', label: '금붕어', body: '#F04E23', stripe: '#FACC15', tail: '#FB923C', size: 0.78 },
  { id: 'bluetang', label: '블루탱', body: '#1D6FD8', stripe: '#0F172A', tail: '#FACC15', size: 0.88 },
  { id: 'clownfish', label: '흰동가리', body: '#EA580C', stripe: '#FFFFFF', tail: '#FDBA74', size: 0.75 },
  { id: 'salmon', label: '은연어', body: '#94A3B8', stripe: '#E2E8F0', tail: '#FDA4AF', size: 1.15 }
];

export const NPC_CATALOG = [
  { id: 'pastor', label: '담임목사님', icon: '✝️', role: '좋은나무교회 담임목사', shirt: '#1E293B', pants: '#0F172A', hair: '#18181B', msg: '할렐루야! 성도님들이 정성껏 가꾼 마을과 예배당에 주님의 평강이 가득하길 축복합니다!' },
  { id: 'praise', label: '찬양인도자', icon: '🎤', role: '좋은나무 찬양악단', shirt: '#2563EB', pants: '#1E293B', hair: '#27272A', isBand: true, msg: '상단의 [🎵 합주] 버튼을 눌러 함께 찬양 연주를 시작해 보세요!' },
  { id: 'pianist', label: '피아노반주자', icon: '🎹', role: '찬양악단 · 건반', shirt: '#7C3AED', pants: '#1E1B4B', hair: '#3F2305', isBand: true, msg: '그랜드 피아노의 따뜻한 선율로 예배를 섬기고 있습니다 🎹' },
  { id: 'guitarist', label: '기타리스트', icon: '🎸', role: '찬양악단 · 기타', shirt: '#0F766E', pants: '#1E293B', hair: '#18181B', isBand: true, msg: '통기타와 일렉기타가 어우러지면 마을 전체가 살아납니다 🎸' },
  { id: 'drummer', label: '드러머', icon: '🥁', role: '찬양악단 · 드럼', shirt: '#B91C1C', pants: '#18181B', hair: '#27272A', isBand: true, msg: '경쾌한 드럼 리듬에 맞춰 다 함께 기쁘게 찬양해요 🥁' },
  { id: 'barista', label: '카페바리스타', icon: '☕', role: '좋은나무 북카페', shirt: '#78350F', pants: '#27272A', hair: '#451A03', msg: '수확한 벼와 딸기로 정성껏 다과를 준비해 두었습니다 ☕' },
  { id: 'elder', label: '장로님', icon: '🙏', role: '예배위원회 장로', shirt: '#334155', pants: '#0F172A', hair: '#CBD5E1', msg: '서쪽 절벽 아래 비밀 동굴 터널에 자수정 광석과 보물상자가 숨겨져 있답니다!' },
  { id: 'kid', label: '어린이성도', icon: '🎈', role: '주일학교 어린이', shirt: '#D97706', pants: '#0369A1', hair: '#27272A', isKid: true, msg: '물뿌리개로 텃밭에 물을 주면 작물이 쑥쑥 자라고 볏짚이랑 과일바구니가 생겨요!' }
];

export const VILLAGE_QUESTS = [
  { id: 'q_water', title: '작물에 양동이로 물주기', desc: '🪣 물주기 모드에서 작물이나 텃밭을 클릭해 물을 주세요.', reward: 15 },
  { id: 'q_harvest', title: '다 자란 작물 수확하기', desc: '황금벼·딸기를 수확해 볏짚 더미나 과일 바구니를 얻으세요.', reward: 20 },
  { id: 'q_mine', title: '동굴·지하 광석 채굴하기', desc: '⛏️ 채굴 모드에서 서쪽 동굴 터널이나 지하 광석을 캐보세요.', reward: 25 },
  { id: 'q_pet', title: '동물 키우고 쓰다듬기', desc: '동물 친구를 클릭해 쓰다듬고 친밀도를 올려보세요.', reward: 15 },
  { id: 'q_band', title: '찬양 악단 합주하기', desc: '상단의 🎵 합주 버튼을 눌러 연주를 감상하세요.', reward: 20 }
];

export const MATERIAL_META = {
  wood: { label: '목재', icon: '🪵' },
  stone: { label: '석재', icon: '🧱' },
  dirt: { label: '흙', icon: '🌿' },
  coal: { label: '석탄', icon: '⬛' },
  iron: { label: '철괴', icon: '🔩' },
  gold: { label: '황금', icon: '✨' },
  crystal: { label: '자수정', icon: '💎' },
  glass: { label: '유리', icon: '🧊' },
  cloth: { label: '천', icon: '🧶' },
  straw: { label: '볏짚', icon: '🌾' },
  crop: { label: '과일/작물', icon: '🍓' }
};

export const BLOCK_MAP_META = BLOCK_CATALOG.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
export const PROP_MAP_META = PROP_CATALOG.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
export const CROP_MAP_META = CROP_CATALOG.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
export const ANIMAL_MAP_META = ANIMAL_CATALOG.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});

export const blockKey = (x, y, z) => `${x},${y},${z}`;
export function parseBlockKey(key) {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

// =====================================================================
// 4. 256px 매트 프로시저럴 텍스처 엔진 (광석·젖은흙·이끼돌·건초 포함)
// =====================================================================
export function createBlockTextures() {
  const textures = {};

  BLOCK_CATALOG.forEach((b) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, b.hi || b.color);
    grad.addColorStop(0.55, b.color);
    grad.addColorStop(1, b.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    if (b.id === 'grass') {
      for (let i = 0; i < 85; i++) {
        const gx = (i * 53) % 244, gy = (i * 79) % 244;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(130, 200, 70, 0.35)' : 'rgba(45, 95, 20, 0.25)';
        ctx.fillRect(gx, gy, 10, 4); ctx.fillRect(gx + 3, gy - 4, 4, 10);
      }
    } else if (b.id === 'farm_soil' || b.id === 'wet_soil') {
      const dark = b.id === 'wet_soil';
      for (let y = 0; y < 256; y += 32) {
        ctx.fillStyle = dark ? '#2B1609' : '#57351D'; ctx.fillRect(0, y, 256, 13);
        ctx.fillStyle = dark ? '#452612' : '#7D4E2D'; ctx.fillRect(0, y + 13, 256, 15);
        ctx.fillStyle = dark ? '#1A0C04' : '#3B2210'; ctx.fillRect(0, y + 28, 256, 4);
      }
    } else if (b.id.startsWith('ore_')) {
      // 광석 결정 패턴
      ctx.fillStyle = b.color; ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = i % 3 === 0 ? b.hi : b.accent;
        const ox = ((i * 67) % 210) + 18, oy = ((i * 89) % 210) + 18;
        ctx.fillRect(ox, oy, 18 + (i % 12), 14 + (i % 10));
      }
    } else if (b.id === 'hay_block') {
      for (let y = 0; y < 256; y += 16) {
        ctx.fillStyle = y % 32 === 0 ? b.hi : b.color; ctx.fillRect(0, y, 256, 12);
        ctx.fillStyle = b.accent; ctx.fillRect(0, y + 12, 256, 4);
      }
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(48, 0, 14, 256); ctx.fillRect(194, 0, 14, 256);
    } else if (b.id === 'water') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath(); ctx.ellipse(((i * 59) % 210) + 22, ((i * 43) % 220) + 14, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (b.id === 'stone' || b.id === 'mossy_stone' || b.id === 'brick' || b.id === 'granite' || b.id === 'cobble') {
      ctx.fillStyle = 'rgba(24, 20, 16, 0.36)'; ctx.fillRect(0, 0, 256, 256);
      const rh = 64, cw = 128;
      for (let r = 0; r < 4; r++) {
        const y = r * rh, off = (r % 2) * 64;
        for (let c = -1; c <= 2; c++) {
          const x = c * cw + off;
          const shade = (r * 3 + c * 5) % 3;
          ctx.fillStyle = shade === 0 ? b.hi : shade === 1 ? b.color : b.accent;
          ctx.fillRect(x + 5, y + 5, cw - 10, rh - 10);
          ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x + 5, y + 5, cw - 10, 4);
          ctx.fillStyle = 'rgba(0,0,0,0.24)'; ctx.fillRect(x + 5, y + rh - 9, cw - 10, 4);
        }
      }
    } else if (b.id === 'roof_red' || b.id === 'roof_blue') {
      for (let y = 0; y < 256; y += 32) {
        ctx.fillStyle = y % 64 === 0 ? b.color : b.hi; ctx.fillRect(0, y, 256, 25);
        ctx.fillStyle = b.accent; ctx.fillRect(0, y + 25, 256, 7);
        for (let x = y % 64 === 0 ? 0 : 16; x < 256; x += 32) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, y, 3, 25);
        }
      }
    } else if (b.id === 'plank' || b.id === 'wood') {
      for (let y = 0; y < 256; y += 64) {
        ctx.fillStyle = y % 128 === 0 ? b.color : b.hi; ctx.fillRect(0, y + 4, 256, 56);
        ctx.fillStyle = b.accent; ctx.fillRect(0, y, 256, 4);
        ctx.fillStyle = '#3B2310'; ctx.fillRect(14, y + 28, 6, 6); ctx.fillRect(236, y + 28, 6, 6);
      }
    } else if (b.id === 'temba_wood') {
      for (let x = 0; x < 256; x += 24) {
        ctx.fillStyle = x % 48 === 0 ? b.hi : b.color; ctx.fillRect(x, 0, 18, 256);
        ctx.fillStyle = '#4A2B14'; ctx.fillRect(x + 18, 0, 6, 256);
      }
    } else if (b.id === 'checker') {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#E2E7EC' : '#334155'; ctx.fillRect(c * 64, r * 64, 64, 64);
      }
    } else if (b.id === 'marble' || b.id === 'porcelain') {
      ctx.fillStyle = b.color; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = b.accent; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 248, 248);
      ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(128, 256); ctx.moveTo(0, 128); ctx.lineTo(256, 128); ctx.stroke();
    } else if (b.id === 'glass') {
      ctx.fillStyle = 'rgba(148,207,230,0.42)'; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, 246, 246);
    } else if (b.id === 'lantern' || b.id === 'crystal_lamp') {
      ctx.fillStyle = b.color; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = b.accent; ctx.lineWidth = 22; ctx.strokeRect(11, 11, 234, 234);
      ctx.beginPath(); ctx.moveTo(128, 11); ctx.lineTo(128, 245); ctx.moveTo(11, 128); ctx.lineTo(245, 128); ctx.stroke();
    } else if (b.id === 'leaf' || b.id === 'blossom') {
      for (let i = 0; i < 65; i++) {
        ctx.fillStyle = i % 3 === 0 ? b.hi : i % 2 === 0 ? b.color : b.accent;
        ctx.beginPath(); ctx.arc(((i * 53) % 236) + 10, ((i * 71) % 236) + 10, 14, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 250);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    textures[b.id] = tex;
  });

  return textures;
}

// =====================================================================
// 5. Face Culling 복셀 메시 빌더
// =====================================================================
const FACE_DEFS = [
  { dir: [1, 0, 0], corners: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
  { dir: [-1, 0, 0], corners: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
  { dir: [0, 1, 0], corners: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
  { dir: [0, -1, 0], corners: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  { dir: [0, 0, 1], corners: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
  { dir: [0, 0, -1], corners: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] }
];

export function buildCulledGeometries(blockMap) {
  const buckets = {};
  for (const [key, type] of Object.entries(blockMap)) {
    const meta = BLOCK_MAP_META[type];
    if (!meta) continue;
    const { x, y, z } = parseBlockKey(key);
    const isTransparent = Boolean(meta.transparent);
    if (!buckets[type]) buckets[type] = { positions: [], normals: [], uvs: [], indices: [] };
    const b = buckets[type];

    for (const face of FACE_DEFS) {
      const neighborType = blockMap[blockKey(x + face.dir[0], y + face.dir[1], z + face.dir[2])];
      if (neighborType) {
        const neighborTransparent = Boolean(BLOCK_MAP_META[neighborType]?.transparent);
        if (!neighborTransparent) continue;
        if (isTransparent && neighborType === type) continue;
      }
      const ndx = b.positions.length / 3;
      for (const c of face.corners) {
        b.positions.push(x + c[0], y + c[1], z + c[2]);
        b.normals.push(face.dir[0], face.dir[1], face.dir[2]);
      }
      b.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      b.indices.push(ndx, ndx + 1, ndx + 2, ndx, ndx + 2, ndx + 3);
    }
  }

  const geometries = {};
  for (const [type, data] of Object.entries(buckets)) {
    if (data.positions.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geo.setIndex(data.indices);
    geo.computeBoundingSphere();
    geometries[type] = geo;
  }
  return geometries;
}

// =====================================================================
// 6. 동적 월드 반경 충돌 · 지하(-4) 지원 · 안전 육지 스폰 보정
// =====================================================================
export function getSurfaceBelow(blockMap, x, y, z) {
  const rx = Math.round(x);
  const rz = Math.round(z);
  const startY = Math.min(16, Math.floor(y + 0.45));
  for (let gy = startY; gy >= -5; gy--) {
    const t = blockMap[blockKey(rx, gy, rz)];
    if (t) {
      if (t === 'water') return { y: gy + 0.15, isWater: true };
      return { y: gy + 0.5, isWater: false };
    }
  }
  return { y: 0.5, isWater: false };
}

export function getSurfaceInfo(blockMap, x, z) {
  return getSurfaceBelow(blockMap, x, 16, z);
}

// 동물이 물속에 스폰되는 버그 원천 차단 (가장 가까운 육지 자동 탐색)
export function findSafeLandSpot(blockMap, x, z) {
  const surf = getSurfaceInfo(blockMap, x, z);
  if (!surf.isWater) return { x, z };
  for (let r = 1; r <= 6; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const s = getSurfaceInfo(blockMap, x + dx, z + dz);
        if (!s.isWater) return { x: x + dx, z: z + dz };
      }
    }
  }
  return { x, z };
}

export function canPlayerMoveTo(blockMap, propsList, playerY, nx, nz, worldRadius = 18) {
  const limit = worldRadius - 0.6;
  if (nx < -limit || nx > limit || nz < -limit || nz > limit) return false;
  const footY = Math.round(playerY + 0.15);
  const headY = Math.round(playerY + 1.05);
  const offsets = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];

  for (const [ox, oz] of offsets) {
    const gx = Math.round(nx + ox);
    const gz = Math.round(nz + oz);
    const footBlock = blockMap[blockKey(gx, footY, gz)];
    if (footBlock && footBlock !== 'water' && (footY + 0.5) - playerY > 0.35) return false;
    const headBlock = blockMap[blockKey(gx, headY, gz)];
    if (headBlock && headBlock !== 'water') return false;

    for (const p of propsList) {
      const meta = PROP_MAP_META[p.type];
      if (!meta || !meta.solid) continue;
      if (meta.isDoor && p.open) continue;
      if (Math.abs(p.y - (playerY + 0.5)) < 1.15) {
        if (Math.abs(nx - p.x) < 0.58 && Math.abs(nz - p.z) < 0.58) return false;
      }
    }
  }
  return true;
}

export function isCellOccupied(blockMap, propsList, x, y, z, playerPos = null) {
  if (blockMap[blockKey(x, y, z)]) return true;
  if (propsList.some((p) => p.x === x && p.y === y && p.z === z)) return true;
  if (playerPos) {
    const px = Math.round(playerPos[0]), py = Math.round(playerPos[1]), pz = Math.round(playerPos[2]);
    if (px === x && pz === z && (py === y || py + 1 === y)) return true;
  }
  return false;
}

export function getFenceConnections(prop, propsList) {
  const hasFenceAt = (dx, dz) =>
    propsList.some((p) => PROP_MAP_META[p.type]?.isFence && p.x === prop.x + dx && p.y === prop.y && p.z === prop.z + dz);
  return { n: hasFenceAt(0, -1), s: hasFenceAt(0, 1), e: hasFenceAt(1, 0), w: hasFenceAt(-1, 0) };
}

export function detectRoomAt(blockMap, propsList, x, y, z) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let wallCount = 0;
  for (const [dx, dz] of dirs) {
    for (let dist = 1; dist <= 5; dist++) {
      if (blockMap[blockKey(x + dx * dist, y, z + dz * dist)] || blockMap[blockKey(x + dx * dist, y + 1, z + dz * dist)]) {
        wallCount++; break;
      }
    }
  }
  if (wallCount < 3) return null;
  const nearbyProps = propsList.filter((p) => Math.hypot(p.x - x, p.z - z) <= 5 && Math.abs(p.y - y) <= 1);
  const types = new Set(nearbyProps.map((p) => p.type));
  if (types.has('pulpit') || types.has('cross') || types.has('pew')) return '✨ [작은 예배당 / 기도실] 방 인식 완료!';
  if (types.has('piano') || types.has('drum') || types.has('guitar_ac')) return '✨ [찬양 악단 연습실] 방 인식 완료!';
  if (types.has('bed')) return '✨ [안식의 방] 방 인식 완료!';
  if (types.has('table') && types.has('chair')) return '✨ [친교 카페룸] 방 인식 완료!';
  return null;
}

// =====================================================================
// 7. 월드 확장 엔진 (기존 건축물 보존 + 외곽 지형·지하·광석 자동 생성)
// =====================================================================
export function expandWorldTerrain(world, nextRadius) {
  const prevR = world.radius || 18;
  if (nextRadius <= prevR) return world;
  const blocks = { ...world.blocks };
  const isDesert = world.biome === 'desert';
  const isSnow = world.biome === 'snow';
  const topBlock = isDesert ? 'sand' : isSnow ? 'marble' : 'grass';

  for (let x = -nextRadius; x <= nextRadius; x++) {
    for (let z = -nextRadius; z <= nextRadius; z++) {
      if (Math.abs(x) <= prevR && Math.abs(z) <= prevR) continue;
      blocks[blockKey(x, -5, z)] = 'bedrock';
      for (let y = -4; y <= -1; y++) {
        const hash = Math.abs((x * 73 + z * 37 + y * 19) % 100);
        blocks[blockKey(x, y, z)] = hash < 5 ? 'ore_gold' : hash < 14 ? 'ore_iron' : hash < 24 ? 'ore_coal' : 'stone';
      }
      blocks[blockKey(x, 0, z)] = topBlock;
    }
  }
  return { ...world, radius: nextRadius, blocks };
}

// =====================================================================
// 8. 3종 바이옴 오픈월드 생성기 (지하 광맥 + 서쪽 동굴 터널 + 안전 동물 스폰)
// =====================================================================
export function generateBiomeWorld(biome = 'meadow', radius = 18) {
  const blocks = {};
  const setB = (x, y, z, t) => { blocks[blockKey(x, y, z)] = t; };
  const delB = (x, y, z) => { delete blocks[blockKey(x, y, z)]; };
  const now = Date.now();

  // 공통 지하 레이어 (y = -5 암반, y = -4 ~ -1 지하 석재 + 광맥)
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      setB(x, -5, z, 'bedrock');
      for (let y = -4; y <= -1; y++) {
        const hash = Math.abs((x * 73 + z * 37 + y * 19) % 100);
        if (y <= -3 && hash < 4) setB(x, y, z, 'ore_crystal');
        else if (y <= -2 && hash < 9) setB(x, y, z, 'ore_gold');
        else if (hash < 18) setB(x, y, z, 'ore_iron');
        else if (hash < 28) setB(x, y, z, 'ore_coal');
        else setB(x, y, z, y === -1 ? 'dirt' : 'stone');
      }
    }
  }

  if (biome === 'meadow') {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const riverCenter = Math.round(Math.sin(z * 0.22) * 2.2);
        const isRiver = Math.abs(x - riverCenter) <= 1 && z > -15 && z < 15;
        const isCliff = x <= -10 && z >= -11 && z <= 7;
        const isWaterfall = x === -10 && (z === -2 || z === -1);

        if (isWaterfall) {
          for (let y = 0; y <= 5; y++) setB(x, y, z, 'water');
          setB(x - 1, 5, z, 'water');
        } else if (isCliff) {
          const h = x <= -12 ? 5 : 3;
          for (let y = 0; y < h; y++) setB(x, y, z, (x + y + z) % 5 === 0 ? 'mossy_stone' : 'stone');
          setB(x, h, z, 'grass');
        } else if (isRiver) {
          setB(x, 0, z, 'water');
        } else {
          const hill = (x > 9 && z < -6) ? 2 : (x > 7 && z < -4) ? 1 : 0;
          for (let y = 0; y < hill; y++) setB(x, y, z, 'dirt');
          setB(x, hill, z, 'grass');
        }
      }
    }

    // 서쪽 절벽 자연 동굴 터널 개방 (z = 2~4, x = -10 ~ -15, y = 1~2) + 내부 광석 & 자수정등
    for (let x = -10; x >= -15; x--) {
      for (let z = 2; z <= 4; z++) {
        delB(x, 1, z);
        delB(x, 2, z);
        setB(x, 0, z, 'cobble');
      }
    }
    setB(-16, 1, 3, 'ore_crystal');
    setB(-16, 2, 2, 'ore_gold');
    setB(-15, 2, 4, 'crystal_lamp');

    // 텃밭 구역 (촉촉한 젖은 흙 + 마른 흙 혼합)
    for (let x = -7; x <= -4; x++) {
      for (let z = 3; z <= 6; z++) setB(x, 0, z, z <= 4 ? 'wet_soil' : 'farm_soil');
    }

    // 동쪽 미니 채플
    for (let x = 5; x <= 11; x++) {
      for (let z = 2; z <= 9; z++) {
        setB(x, 1, z, x === 8 ? 'carpet_red' : 'marble');
        const isWall = x === 5 || x === 11 || z === 2 || z === 9;
        const isDoor = x === 5 && (z === 5 || z === 6);
        const isWin = (z === 2 || z === 9) && (x === 7 || x === 9);
        if (isWall && !isDoor) {
          setB(x, 2, z, isWin ? 'glass' : x === 11 ? 'temba_wood' : 'ivory_wall');
          setB(x, 3, z, isWin ? 'glass' : 'ivory_wall');
        }
      }
    }
    setB(4, 0, 5, 'cobble'); setB(4, 0, 6, 'cobble');
    for (let x = 4; x <= 12; x++) for (let z = 1; z <= 10; z++) setB(x, 4, z, 'roof_red');
    for (let x = 5; x <= 11; x++) for (let z = 2; z <= 9; z++) setB(x, 5, z, 'roof_red');
    for (let x = 6; x <= 10; x++) for (let z = 3; z <= 8; z++) setB(x, 6, z, 'roof_red');

    // 나무 & 벚꽃나무
    [
      { x: -6, z: -8, leaf: 'blossom' }, { x: -8, z: 9, leaf: 'leaf' },
      { x: 12, z: -9, leaf: 'blossom' }, { x: 13, z: 11, leaf: 'leaf' },
      { x: -5, z: 12, leaf: 'leaf' }, { x: 4, z: -11, leaf: 'leaf' }
    ].forEach(({ x, z, leaf }) => {
      const baseY = blocks[blockKey(x, 2, z)] ? 3 : blocks[blockKey(x, 1, z)] ? 2 : 1;
      setB(x, baseY, z, 'wood'); setB(x, baseY + 1, z, 'wood'); setB(x, baseY + 2, z, 'wood');
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        setB(x + dx, baseY + 3, z + dz, leaf);
        if (Math.abs(dx) + Math.abs(dz) <= 1) setB(x + dx, baseY + 4, z + dz, leaf);
      }
    });

    const rawAnimals = [
      { id: 'a_1', type: 'sheep', x: -5.5, z: -2.5, level: 1 },
      { id: 'a_2', type: 'cow', x: -6.8, z: -4.2, level: 1 },
      { id: 'a_3', type: 'dog', x: 5.5, z: 11.2, level: 1 }, // 강물 밖 안전 육지로 이동!
      { id: 'a_4', type: 'cat', x: 4.5, z: 12.0, level: 1 },
      { id: 'a_5', type: 'rabbit', x: -3.8, z: 8.5, level: 1 },
      { id: 'a_6', type: 'pig', x: -6.2, z: 8.2, level: 1 },
      { id: 'a_7', type: 'chick', x: -4.2, z: 4.5, level: 1 }
    ].map((a) => ({ ...a, ...findSafeLandSpot(blocks, a.x, a.z) }));

    return {
      biome: 'meadow',
      radius,
      blocks,
      props: [
        { id: 'p_cross_roof', type: 'cross', x: 8, y: 7, z: 5, rot: 0 },
        { id: 'p_pulpit', type: 'pulpit', x: 10, y: 2, z: 5, rot: -Math.PI / 2 },
        { id: 'p_piano', type: 'piano', x: 10, y: 2, z: 3, rot: -Math.PI / 2 },
        { id: 'p_drum', type: 'drum', x: 10, y: 2, z: 8, rot: -Math.PI / 2 },
        { id: 'p_gac', type: 'guitar_ac', x: 9, y: 2, z: 3, rot: -Math.PI / 2 },
        { id: 'p_cello', type: 'cello', x: 9, y: 2, z: 8, rot: -Math.PI / 2 },
        { id: 'p_spk1', type: 'speaker', x: 10, y: 2, z: 4, rot: -Math.PI / 2 },
        { id: 'p_mic1', type: 'mic', x: 9, y: 2, z: 6, rot: -Math.PI / 2 },
        { id: 'p_pew1', type: 'pew', x: 7, y: 2, z: 4, rot: Math.PI / 2 },
        { id: 'p_pew2', type: 'pew', x: 7, y: 2, z: 7, rot: Math.PI / 2 },
        { id: 'p_offer', type: 'offering', x: 6, y: 2, z: 3, rot: 0 },
        { id: 'p_door', type: 'door', x: 5, y: 2, z: 5, rot: 0, open: false },
        { id: 'p_tor1', type: 'torch', x: 4, y: 1, z: 4, rot: 0 },
        { id: 'p_tor2', type: 'torch', x: 4, y: 1, z: 7, rot: 0 },
        { id: 'p_tor3', type: 'torch', x: -3, y: 1, z: 0, rot: 0 },
        // 신규 농장 & 마을 디테일 소품
        { id: 'p_well', type: 'well', x: -3, y: 1, z: 4, rot: 0 },
        { id: 'p_hay1', type: 'hay_bale', x: -8, y: 1, z: 2, rot: 0 },
        { id: 'p_bsk1', type: 'fruit_basket', x: -3, y: 1, z: 6, rot: 0 },
        { id: 'p_fire', type: 'campfire', x: 6, y: 1, z: -2, rot: 0 },
        { id: 'p_cart', type: 'cart', x: -6, y: 1, z: 1, rot: Math.PI / 2 },
        { id: 'p_ft1', type: 'flower_tulip', x: 4, y: 1, z: 3, rot: 0 },
        { id: 'p_fl1', type: 'flower_lavender', x: 4, y: 1, z: 8, rot: 0 },
        { id: 'p_fd1', type: 'flower_daisy', x: -3, y: 1, z: 2, rot: 0 },
        { id: 'p_fr1', type: 'flower_rose', x: 6, y: 1, z: 10, rot: 0 },
        // 울타리
        { id: 'p_fen1', type: 'fence_wood', x: -8, y: 1, z: 3, rot: 0 },
        { id: 'p_fen2', type: 'fence_wood', x: -8, y: 1, z: 4, rot: 0 },
        { id: 'p_fen3', type: 'fence_wood', x: -8, y: 1, z: 5, rot: 0 },
        { id: 'p_fen4', type: 'fence_wood', x: -8, y: 1, z: 6, rot: 0 },
        { id: 'p_fen5', type: 'fence_wood', x: -7, y: 1, z: 7, rot: 0 },
        { id: 'p_fen6', type: 'fence_wood', x: -6, y: 1, z: 7, rot: 0 }
      ],
      crops: [
        { id: 'c_1', type: 'rice', x: -7, y: 1, z: 3, plantedAt: now - 20000, watered: true },
        { id: 'c_2', type: 'rice', x: -6, y: 1, z: 3, plantedAt: now - 20000, watered: true },
        { id: 'c_3', type: 'wheat', x: -5, y: 1, z: 3, plantedAt: now - 20000, watered: true },
        { id: 'c_4', type: 'corn', x: -5, y: 1, z: 4, plantedAt: now - 16000, watered: true },
        { id: 'c_5', type: 'strawberry', x: -6, y: 1, z: 5, plantedAt: now - 5000, watered: false },
        { id: 'c_6', type: 'pumpkin', x: -5, y: 1, z: 6, plantedAt: now - 5000, watered: false },
        { id: 'c_7', type: 'sunflower', x: -4, y: 1, z: 6, plantedAt: now - 15000, watered: true }
      ],
      animals: rawAnimals,
      fish: [
        { id: 'f_1', type: 'koi', x: 0, z: -6, rangeZ: [-10, -2] },
        { id: 'f_2', type: 'koi', x: 0.6, z: -3, rangeZ: [-8, 0] },
        { id: 'f_3', type: 'goldfish', x: -0.5, z: 4, rangeZ: [3, 10] },
        { id: 'f_4', type: 'bluetang', x: 0.8, z: 6, rangeZ: [3, 11] },
        { id: 'f_5', type: 'clownfish', x: -0.2, z: 8, rangeZ: [4, 11] },
        { id: 'f_6', type: 'salmon', x: -1.0, z: -8, rangeZ: [-11, -3] }
      ],
      npcs: [
        { id: 'n_1', type: 'pastor', x: 9.2, y: 1.5, z: 5.2, rot: -Math.PI / 2, roam: false },
        { id: 'n_2', type: 'praise', x: 8.6, y: 1.5, z: 6.2, rot: -Math.PI / 2, roam: false },
        { id: 'n_3', type: 'pianist', x: 9.2, y: 1.5, z: 3.4, rot: -Math.PI / 2, roam: false },
        { id: 'n_4', type: 'drummer', x: 9.2, y: 1.5, z: 7.8, rot: -Math.PI / 2, roam: false },
        { id: 'n_5', type: 'barista', x: 3.5, y: 0.5, z: 5.5, rot: -Math.PI / 2, roam: true },
        { id: 'n_6', type: 'elder', x: -8.5, y: 0.5, z: 1.0, rot: 0.4, roam: true }
      ],
      chests: [
        { id: 'ch_m1', x: -11, y: 4, z: -2, label: '폭포 위 비밀 보물상자', reward: { gold: 5, wood: 5 }, hearts: 30 },
        { id: 'ch_cave', x: -14, y: 1, z: 3, label: '비밀 동굴 자수정 상자', reward: { crystal: 4, iron: 5, gold: 4 }, hearts: 40 }
      ]
    };
  }

  // 사막 오아시스 또는 설원 마을
  const isDesert = biome === 'desert';
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      const distCenter = Math.hypot(x + 2, z - 1);
      const isOasis = distCenter <= 4.5;
      const isDune = x < -9 || z < -10;
      if (isOasis) setB(x, 0, z, 'water');
      else if (isDune) {
        const h = (x < -12 || z < -12) ? 3 : 2;
        for (let y = 0; y < h; y++) setB(x, y, z, isDesert ? 'sand' : 'stone');
        setB(x, h, z, isDesert ? 'sand' : 'marble');
      } else setB(x, 0, z, isDesert ? 'sand' : 'marble');
    }
  }

  for (let x = 4; x <= 6; x++) for (let z = 4; z <= 6; z++) setB(x, 0, z, 'wet_soil');
  for (let x = 6; x <= 11; x++) {
    for (let z = -4; z <= 2; z++) {
      setB(x, 1, z, isDesert ? 'stucco' : 'plank');
      const isWall = x === 6 || x === 11 || z === -4 || z === 2;
      const isDoor = x === 6 && z === -1;
      if (isWall && !isDoor) {
        setB(x, 2, z, isDesert ? 'ivory_wall' : 'wood');
        setB(x, 3, z, isDesert ? 'stucco' : 'glass');
      }
    }
  }
  for (let x = 5; x <= 12; x++) for (let z = -5; z <= 3; z++) setB(x, 4, z, isDesert ? 'roof_red' : 'roof_blue');

  const bioAnimals = (isDesert
    ? [{ id: 'da_1', type: 'fox', x: -3, z: 8, level: 1 }, { id: 'da_2', type: 'fox', x: 1, z: 8.5, level: 1 }, { id: 'da_3', type: 'sheep', x: 5, z: 8, level: 1 }, { id: 'da_4', type: 'dog', x: 4, z: 2, level: 1 }]
    : [{ id: 'sa_1', type: 'penguin', x: -3.5, z: 7.2, level: 1 }, { id: 'sa_2', type: 'penguin', x: -2.0, z: 8.2, level: 1 }, { id: 'sa_3', type: 'polar_bear', x: -6.5, z: 3.5, level: 1 }, { id: 'sa_4', type: 'polar_bear', x: 2.5, z: -6.5, level: 1 }, { id: 'sa_5', type: 'rabbit', x: 4.5, z: 7.5, level: 1 }]
  ).map((a) => ({ ...a, ...findSafeLandSpot(blocks, a.x, a.z) }));

  return {
    biome,
    radius,
    blocks,
    props: [
      { id: 'bp_1', type: 'cross', x: 9, y: 5, z: -1, rot: 0 },
      { id: 'bp_2', type: 'pulpit', x: 10, y: 2, z: -1, rot: -Math.PI / 2 },
      { id: 'bp_3', type: 'pew', x: 8, y: 2, z: -1, rot: Math.PI / 2 },
      { id: 'bp_4', type: 'door', x: 6, y: 2, z: -1, rot: 0, open: false },
      { id: 'bp_5', type: 'campfire', x: 3, y: 1, z: -2, rot: 0 },
      { id: 'bp_6', type: 'well', x: 3, y: 1, z: 5, rot: 0 }
    ],
    crops: [
      { id: 'bc_1', type: isDesert ? 'sunflower' : 'rice', x: 4, y: 1, z: 4, plantedAt: now - 18000, watered: true },
      { id: 'bc_2', type: 'strawberry', x: 5, y: 1, z: 5, plantedAt: now - 18000, watered: true }
    ],
    animals: bioAnimals,
    fish: [
      { id: 'bf_1', type: isDesert ? 'clownfish' : 'salmon', x: -2, z: 1, rangeZ: [-1.5, 3.5] },
      { id: 'bf_2', type: 'bluetang', x: -1, z: 0, rangeZ: [-2, 3] }
    ],
    npcs: [
      { id: 'bn_1', type: 'pastor', x: 9.2, y: 1.5, z: -1, rot: -Math.PI / 2, roam: false },
      { id: 'bn_2', type: 'guitarist', x: 4.2, y: 0.5, z: 1.8, rot: 0, roam: true }
    ],
    chests: [
      { id: `ch_${biome}_1`, x: -12, y: 4, z: -12, label: isDesert ? '사막 유적 보물상자' : '설원 정상 보물상자', reward: { gold: 6, crystal: 3 }, hearts: 35 }
    ]
  };
}
// src/pages/InterlinearKids.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BIBLE_66_BOOKS, cleanTypography } from './Interlinear';
import { supabase } from '../lib/supabase';

let activeUtterance = null;
let cachedMasterStrongs = null;

// =====================================================================
// 🎵 1. 상용 키즈 앱 전용 Web Audio API 사운드 신시사이저
// =====================================================================
const playSfx = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'stamp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === 'train') {
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + 0.45);
      });
    } else if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.28);
      });
    } else if (type === 'magic') {
      [587.33, 783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.25);
      });
    }
  } catch (_) {}
};

// =====================================================================
// 🐂 2. 고대 히브리어(22자) + 신약 헬라어(24자) 어린이 그림·상징 마스터 사전
// =====================================================================
const MASTER_PICTOGRAPHS = {
  // 구약 히브리어 22 자음
  'א': { emoji: '🐂', name: '알레프', title: '힘센 황소 대장', meaning: '가장 힘세고 온 우주를 다스리시는 하나님' },
  'ב': { emoji: '⛺', name: '베트', title: '아늑한 텐트 집', meaning: '우리를 따뜻하게 품어주는 하나님의 집과 가족' },
  'ג': { emoji: '🐪', name: '기멜', title: '선물 나르는 낙타', meaning: '찾아가서 아낌없이 은혜와 선물을 나누어주다' },
  'ד': { emoji: '🚪', name: '달렛', title: '열려 있는 텐트 문', meaning: '누구든지 예수님께 나아가는 구원의 문' },
  'ה': { emoji: '🙌', name: '헤', title: '두 손 번쩍 든 아이', meaning: '할렐루야 찬양하며 하나님의 숨결을 느끼다' },
  'ו': { emoji: '🪝', name: '와우', title: '튼튼한 연결 못', meaning: '하늘과 땅, 하나님과 우리를 하나로 이어주다' },
  'ז': { emoji: '🌾', name: '자인', title: '추수하는 황금 낫', meaning: '생명의 양식을 거두고 말씀을 마음에 새기다' },
  'ח': { emoji: '🧱', name: '헤트', title: '안전한 돌울타리', meaning: '위험에서 우리를 꼭 지켜주시는 하나님의 품' },
  'ט': { emoji: '🧺', name: '테트', title: '보물 담긴 바구니', meaning: '하나님이 숨겨두신 참 좋고 선한 선물' },
  'י': { emoji: '✋', name: '요드', title: '만드시는 오른손', meaning: '세상을 멋지게 지으시고 일하시는 하나님의 손' },
  'כ': { emoji: '🤲', name: '카프', title: '축복하는 손바닥', meaning: '머리 위에 손을 얹고 사랑으로 축복해 주심' },
  'ך': { emoji: '🤲', name: '카프', title: '축복하는 손바닥', meaning: '사랑으로 덮어주시고 안아주시는 손길' },
  'ל': { emoji: '🦯', name: '라메드', title: '목자님의 지팡이', meaning: '어린양을 푸른 초장으로 안전하게 이끌어주다' },
  'מ': { emoji: '🌊', name: '멤', title: '시원한 생명수 물결', meaning: '목마른 마음을 적셔주는 하나님의 큰 은혜' },
  'ם': { emoji: '🌊', name: '멤', title: '시원한 생명수 물결', meaning: '끝없이 흐르는 하나님의 사랑과 말씀' },
  'נ': { emoji: '🌱', name: '눈', title: '자라나는 생명 씨앗', meaning: '작은 씨앗이 큰 나무가 되듯 자라나는 믿음' },
  'ן': { emoji: '🌱', name: '눈', title: '자라나는 생명 씨앗', meaning: '영원히 꺼지지 않는 생명의 약속' },
  'ס': { emoji: '🛡️', name: '사멕', title: '든든한 버팀목 방패', meaning: '넘어지지 않게 뒤에서 꽉 붙들어 주시는 힘' },
  'ע': { emoji: '👁️', name: '아인', title: '사랑으로 보는 눈', meaning: '언제나 나를 지켜보시고 돌보시는 하나님의 눈동자' },
  'פ': { emoji: '👄', name: '페', title: '찬양하는 입술', meaning: '빛이 있으라 말씀하시고 기쁘게 노래하는 입' },
  'ף': { emoji: '👄', name: '페', title: '찬양하는 입술', meaning: '하나님의 말씀을 선포하는 입술' },
  'צ': { emoji: '🛤️', name: '차데', title: '바른 오솔길', meaning: '하나님이 기뻐하시는 정직하고 의로운 길' },
  'ץ': { emoji: '🛤️', name: '차데', title: '바른 오솔길', meaning: '믿음으로 끝까지 걸어가는 바른 길' },
  'ק': { emoji: '🌅', name: '코프', title: '빛나는 수평선 해', meaning: '어둠을 밝히고 거룩하게 구별된 하나님의 자녀' },
  'ר': { emoji: '👑', name: '레쉬', title: '우두머리 왕관', meaning: '가장 높으신 왕, 새로운 시작과 첫 번째' },
  'ש': { emoji: '🔥', name: '쉰', title: '타오르는 성령의 불', meaning: '우리를 따뜻하게 녹이는 하나님의 전능하신 불꽃' },
  'ת': { emoji: '✝️', name: '타우', title: '약속의 십자가 도장', meaning: '끝까지 우리를 구원하신다는 하나님의 진짜 도장' },

  // 신약 헬라어 핵심 자모음 (소문자/대문자 정규화 매칭용)
  'α': { emoji: '🥇', name: '알파', title: '모든 것의 첫 시작', meaning: '세상을 처음 시작하신 예수님 (요한계시록 1:8)' },
  'β': { emoji: '👑', name: '베타', title: '하나님 나라의 집', meaning: '왕이신 예수님이 다스리시는 천국 집' },
  'γ': { emoji: '🌱', name: '감마', title: '대지에 돋는 새싹', meaning: '은혜의 단비를 맞고 무럭무럭 자라남' },
  'δ': { emoji: '⛺', name: '델타', title: '피라미드 천막 문', meaning: '복음의 기쁜 소식이 사방으로 퍼져나가는 문' },
  'ε': { emoji: '🕊️', name: '엡실론', title: '기쁜 소식의 메아리', meaning: '하늘에서 들려오는 반가운 평화의 목소리' },
  'ζ': { emoji: '⚡', name: '제타', title: '살아있는 생명 빛', meaning: '영원히 죽지 않는 부활의 생명(조에)' },
  'η': { emoji: '🪜', name: '에타', title: '하늘로 이어진 사다리', meaning: '기도로 하나님과 마음을 잇는 통로' },
  'θ': { emoji: '☀️', name: '쎄타', title: '온 세상을 품은 하나님', meaning: '하나님(데오스)의 완전한 사랑의 원' },
  'ι': { emoji: '🕯️', name: '이오타', title: '작지만 가장 귀한 획', meaning: '가장 작은 약속도 반드시 지키시는 예수님' },
  'κ': { emoji: '🎺', name: '카파', title: '승리의 나팔', meaning: '만왕의 왕 주님(퀴리오스)을 외치는 소리' },
  'λ': { emoji: '📜', name: '람다', title: '빛을 비추는 말씀', meaning: '어두운 발걸음을 비추는 말씀(로고스) 등불' },
  'μ': { emoji: '🌊', name: '뮤', title: '넓고 깊은 은혜 바다', meaning: '제자로 배우며 자라나는 깊은 지혜' },
  'ν': { emoji: '🏆', name: '뉴', title: '믿음의 승리 깃발', meaning: '예수님 이름으로 이기는 승리(니케)' },
  'π': { emoji: '🏛️', name: '파이', title: '든든한 성전 기둥', meaning: '흔들리지 않는 믿음(피스티스)의 두 기둥' },
  'ρ': { emoji: '🚩', name: '로', title: '그리스도의 깃발', meaning: '우리를 구원하신 왕 그리스도의 상징' },
  'σ': { emoji: '🛟', name: '시그마', title: '구원의 생명 튜브', meaning: '위험에서 건져내시는 구원자(소테르)' },
  'ς': { emoji: '🛟', name: '시그마', title: '구원의 생명 튜브', meaning: '끝까지 안전하게 지켜주시는 구원' },
  'τ': { emoji: '✝️', name: '타우', title: '예수님의 십자가', meaning: '우리를 너무 사랑하셔서 팔을 벌리신 십자가' },
  'φ': { emoji: '💡', name: '피', title: '세상을 밝히는 등불', meaning: '어둠을 물리치는 예수님의 참된 빛(포스)' },
  'χ': { emoji: '👑', name: '키', title: '그리스도의 기름부음', meaning: '우리의 구원자 그리스도(크리스토스)의 첫 글자' },
  'ψ': { emoji: '🦋', name: '프시', title: '날아오르는 나비 영혼', meaning: '하나님의 숨결로 살아난 아름다운 마음' },
  'ω': { emoji: '♾️', name: '오메가', title: '영원한 완성의 면류관', meaning: '처음과 나중 되시는 예수님의 영원한 승리!' }
};

// =====================================================================
// 🧪 3. 어린이 원어 그림문자 조합 실험실 (Pictograph Alchemy Recipes)
// =====================================================================
const PICTOGRAPH_RECIPES = [
  {
    id: 'ab',
    letters: ['א', 'ב'],
    hebrew: 'אָב',
    sound: '아브',
    kor: '아버지 (하나님 아버지)',
    emoji: '👨‍👧‍👦',
    formulaDesc: '🐂 힘센 황소(알레프) + ⛺ 텐트 집(베트)',
    secretStory: '힘센 황소처럼 우리 집(텐트)을 든든하게 지켜주시고 먹여주시는 분이 바로 [아버지(아브)]예요! 하나님은 우리의 가장 든든한 하늘 아버지세요.'
  },
  {
    id: 'em',
    letters: ['א', 'מ'],
    hebrew: 'אֵם',
    sound: '엠',
    kor: '어머니 (따뜻한 품)',
    emoji: '🤱',
    secretStory: '🐂 강한 힘(알레프)과 🌊 부드러운 물결(멤)이 만나, 아기를 포근하게 감싸 안아주는 [어머니(엠)]가 되었어요!',
    formulaDesc: '🐂 강한 힘(알레프) + 🌊 포근한 물결(멤)'
  },
  {
    id: 'el',
    letters: ['א', 'ל'],
    hebrew: 'אֵל',
    sound: '엘',
    kor: '전능하신 하나님',
    emoji: '👑',
    formulaDesc: '🐂 가장 힘센 대장(알레프) + 🦯 목자의 지팡이(라메드)',
    secretStory: '온 우주에서 가장 힘센 분(🐂)이 목자의 지팡이(🦯)로 우리를 푸른 초장으로 인도하시는 분, 바로 [하나님(엘)]이시랍니다!'
  },
  {
    id: 'ben',
    letters: ['ב', 'נ'],
    hebrew: 'בֵּן',
    sound: '벤',
    kor: '아들 / 자녀',
    emoji: '🧒',
    formulaDesc: '⛺ 가족 텐트(베트) + 🌱 자라나는 씨앗(눈)',
    secretStory: '따뜻한 집(⛺) 안에서 무럭무럭 자라나 대를 잇는 생명 씨앗(🌱)이 바로 소중한 [자녀/아들(벤)]이에요!'
  },
  {
    id: 'lev',
    letters: ['ל', 'ב'],
    hebrew: 'לֵב',
    sound: '레브',
    kor: '마음 / 심장',
    emoji: '💖',
    formulaDesc: '🦯 이끌어주는 지팡이(라메드) + ⛺ 내 안의 집(베트)',
    secretStory: '우리 몸이라는 집(⛺)의 가장 중심에서 나를 이끌어가는(🦯) 보물 상자, 바로 하나님을 사랑하는 [마음(레브)]이에요!'
  },
  {
    id: 'or',
    letters: ['א', 'ו', 'ר'],
    hebrew: 'אוֹר',
    sound: '오르',
    kor: '창조의 빛',
    emoji: '✨',
    formulaDesc: '🐂 하나님(알레프) + 🪝 연결(와우) + 👑 머리(레쉬)',
    secretStory: '창세기 1장에서 하나님이 가장 먼저 "빛이 있으라!" 말씀하셨을 때 온 우주를 환하게 채운 반짝이는 [빛(오르)]이에요!'
  }
];

// =====================================================================
// 🏆 4. 별(⭐)로 모으는 12대 성경 영웅·보물 도감
// =====================================================================
const BIBLE_HERO_CARDS = [
  { id: 'c1', reqStars: 10, emoji: '✨', title: '창조의 첫째 날 빛', ref: '창세기 1:3', desc: '"빛이 있으라!" 어둠을 물리친 하나님의 첫 번째 선물' },
  { id: 'c2', reqStars: 25, emoji: '🌈', title: '노아의 무지개 방주', ref: '창세기 9:13', desc: '비바람 속에서도 가족과 동물들을 안전하게 지켜준 약속의 배' },
  { id: 'c3', reqStars: 40, emoji: '🌟', title: '아브라함의 밤하늘 별', ref: '창세기 15:5', desc: '하늘의 뭇별처럼 믿음의 자녀를 주시겠다는 하나님의 언약' },
  { id: 'c4', reqStars: 60, emoji: '🌊', title: '모세의 홍해 기적 지팡이', ref: '출애굽기 14:21', desc: '거대한 바다가 갈라지고 마른땅으로 건너간 구원의 길' },
  { id: 'c5', reqStars: 80, emoji: '🎺', title: '여호수아의 승리의 나팔', ref: '여호수아 6:20', desc: '말씀에 순종하여 외칠 때 와르르 무너진 여리고 성벽' },
  { id: 'c6', reqStars: 100, emoji: '👑', title: '소년 다윗의 물맷돌과 하프', ref: '사무엘상 17:45', desc: '만군의 여호와 이름으로 거인 골리앗을 물리친 용기' },
  { id: 'c7', reqStars: 125, emoji: '🦁', title: '다니엘의 기도 창문', ref: '다니엘 6:22', desc: '사자굴 속에서도 천사를 보내 입을 막아주신 하나님의 보호' },
  { id: 'c8', reqStars: 150, emoji: '🐳', title: '요나의 큰 물고기 잠수함', ref: '요나 2:1', desc: '바다 깊은 곳에서도 회개하는 기도를 들어주시는 자비의 하나님' },
  { id: 'c9', reqStars: 180, emoji: '🧺', title: '오병이어 기적 도시락', ref: '마태복음 14:19', desc: '어린이의 작은 보리떡 5개와 물고기 2마리로 오천 명을 먹이신 기적!' },
  { id: 'c10', reqStars: 210, emoji: '🐑', title: '선한 목자 예수님의 품', ref: '요한복음 10:11', desc: '길 잃은 어린양 한 마리까지 끝까지 찾아와 안아주시는 사랑' },
  { id: 'c11', reqStars: 250, emoji: '✝️', title: '부활의 빛나는 빈 무덤', ref: '마태복음 28:6', desc: '죄와 죽음을 이기시고 다시 살아나신 예수님의 영원한 승리!' },
  { id: 'c12', reqStars: 300, emoji: '🏰', title: '새 예루살렘 황금 면류관', ref: '요한계시록 21:4', desc: '눈물도 아픔도 없는 천국에서 영원히 주님과 함께 빛나는 상급' }
];

const GRAMMAR_OVERRIDES = {
  "H853":  { kor: "~을 / ~를", sound: "에트", emoji: "🎯", story: "하나님께서 콕 짚어 사랑하시는 대상을 가리키는 표시예요! 처음 글자 알레프(א)와 마지막 글자 타우(ת)가 만나 예수님을 보여주기도 해요." },
  "H854":  { kor: "~와 함께", sound: "에트", emoji: "🤝", story: "혼자가 아니라 하나님과 두 손을 꼭 잡고 함께 걸어간다는 따뜻한 약속이에요!" },
  "H9001": { kor: "~에게 / ~로", sound: "레", emoji: "🦯", story: "목자님의 지팡이를 따라 한 걸음씩 나아가는 방향을 뜻해요." },
  "H9002": { kor: "~안에 / ~로", sound: "베", emoji: "⛺", story: "아늑한 텐트 집 속에 쏙 들어가 안전하게 머무는 모습을 뜻해요." },
  "H9003": { kor: "~처럼 / 같이", sound: "카", emoji: "🤲", story: "예수님의 따뜻한 사랑의 손길을 꼭 닮았다는 뜻이에요." },
  "H9005": { kor: "그리고 / 와", sound: "베", emoji: "🔗", story: "단단한 고리처럼 앞의 이야기와 뒤의 이야기를 착착 이어줘요!" },
  "H9008": { kor: "바로 그", sound: "하", emoji: "👈", story: "두 손을 번쩍 들고 '주목하세요! 바로 그거예요!' 하고 가리키는 글자예요." }
};

// 단어 뜻에 어울리는 어린이 이모지 자동 매칭기
const getKidFriendlyEmoji = (korText = '') => {
  if (/하나님|여호와|주|신|엘로힘/.test(korText)) return '👑';
  if (/예수|그리스도|십자가|구원/.test(korText)) return '✝️';
  if (/빛|해|별|달|밝/.test(korText)) return '✨';
  if (/하늘|구름|궁창/.test(korText)) return '🌤️';
  if (/땅|세상|흙|산|들/.test(korText)) return '🌍';
  if (/물|바다|강|비|샘/.test(korText)) return '🌊';
  if (/사랑|은혜|자비|기쁨|복/.test(korText)) return '💖';
  if (/마음|영혼|생명|숨|영/.test(korText)) return '🕊️';
  if (/말씀|이르|말하|부르|소리지르/.test(korText)) return '🗣️';
  if (/나무|풀|열매|씨|포도|밀|떡|양식/.test(korText)) return '🌱';
  if (/양|목자|소|새|물고기|짐승/.test(korText)) return '🐑';
  if (/집|성전|장막|문|성읍/.test(korText)) return '⛺';
  if (/길|가다|걸어|오다|인도/.test(korText)) return '👣';
  if (/손|팔|만지|만들|창조/.test(korText)) return '🤲';
  if (/눈|보다|보시니/.test(korText)) return '👀';
  if (/기도|찬양|노래|감사/.test(korText)) return '🙏';
  return '📖';
};

export default function InterlinearKids({ isDarkMode, setActiveScreen }) {
  const [selectedBookIndex, setSelectedBookIndex] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.book) {
        const idx = BIBLE_66_BOOKS.findIndex(b => b.ko === jump.book || b.en === jump.book);
        if (idx !== -1) return idx;
      }
    } catch (_) {}
    return 0;
  });
  const [chapter, setChapter] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.chapter) return Number(jump.chapter);
    } catch (_) {}
    return 1;
  });
  const [verse, setVerse] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.verse) return Number(jump.verse);
    } catch (_) {}
    return 1;
  });

  // 🎡 5대 테마파크 탭 상태: 'story'(말씀동화) | 'lexicon'(원어탐험) | 'games'(말씀놀이터) | 'studio'(말씀화실) | 'faith'(기도·도감)
  const [activeParkTab, setActiveParkTab] = useState('story');

  const [words, setWords] = useState([]);
  const [masterDict, setMasterDict] = useState({});
  const [kidsChapterData, setKidsChapterData] = useState(null);
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [selectedWordCard, setSelectedWordCard] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 🌟 인터랙티브 동화 무대 터치 이펙트
  const [stageParticles, setStageParticles] = useState([]);
  const [stageBlessingMsg, setStageBlessingMsg] = useState('');

  // 🧪 원어 조합 실험실 (Pictograph Alchemy) 상태
  const [selectedAlchemyRecipe, setSelectedAlchemyRecipe] = useState(PICTOGRAPH_RECIPES[0]);
  const [alchemyStep, setAlchemyStep] = useState(0);

  // 🎙️ 오디오 녹음
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🎮 미니게임 서브 탭 ('train' | 'memory' | 'blankQuiz')
  const [miniGameMode, setMiniGameMode] = useState('train');

  // 게임 1: 한글 말씀 기차 퍼즐
  const [koreanPuzzlePool, setKoreanPuzzlePool] = useState([]);
  const [koreanPuzzleTrain, setKoreanPuzzleTrain] = useState([]);
  const [isTrainComplete, setIsTrainComplete] = useState(false);
  const [draggedToken, setDraggedToken] = useState(null);

  // 게임 2: 원어-한글 짝맞추기 메모리 카드 게임
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);

  // 게임 3: 동적 말씀 빈칸 채우기 & 퀴즈
  const [selectedBlankChoice, setSelectedBlankChoice] = useState(null);
  const [isBlankCorrect, setIsBlankCorrect] = useState(false);

  // ✍️ 단어 따라쓰기 칠판
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [crayonColor] = useState('#854D0E');

  // 🎨 프로급 키즈 말씀 화실 (밑그림 도안 + 스탬프 + 갤러리)
  const bibleCanvasRef = useRef(null);
  const [isBibleDrawing, setIsBibleDrawing] = useState(false);
  const [bibleDrawColor, setBibleDrawColor] = useState('#15803D');
  const [bibleBrushSize, setBibleBrushSize] = useState(8);
  const [coloringTemplate, setColoringTemplate] = useState('ark'); // 'ark' | 'lamb' | 'cross' | 'word' | 'blank'
  const [selectedStampEmoji, setSelectedStampEmoji] = useState(null);
  const [savedBibleArtwork, setSavedBibleArtwork] = useState(null);

  // 🙏 인터랙티브 기도 우체통 상태
  const [prayerMood, setPrayerMood] = useState('감사해요 🥰');
  const [prayerTarget, setPrayerTarget] = useState('우리 가족 👨‍👩‍👧‍👦');
  const [customPrayerText, setCustomPrayerText] = useState('');
  const [isPrayerSent, setIsPrayerSent] = useState(false);

  // 🗺️ 여권 & 별
  const [stars, setStars] = useState(() => {
    try { return Number(localStorage.getItem('kids_explorer_stars') || 30); } catch (_) { return 30; }
  });
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [customVideoInput, setCustomVideoInput] = useState('');
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  const currentBookMeta = BIBLE_66_BOOKS[selectedBookIndex] || BIBLE_66_BOOKS[0];
  const isOT = currentBookMeta.isOT;

  const awardStars = useCallback((amount) => {
    setStars(prev => {
      const next = prev + amount;
      try { localStorage.setItem('kids_explorer_stars', String(next)); } catch (_) {}
      return next;
    });
  }, []);

  // 데이터 로드
  useEffect(() => {
    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});

    if (cachedMasterStrongs) {
      setMasterDict(cachedMasterStrongs);
    } else {
      fetch('/data/strongs_korean_master.json')
        .then(r => r.ok ? r.json() : {})
        .then(d => {
          cachedMasterStrongs = d || {};
          setMasterDict(d || {});
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch(`/data/kids_study_by_chapter/${currentBookMeta.ko}_${chapter}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setKidsChapterData(d))
      .catch(() => setKidsChapterData(null));
  }, [currentBookMeta.ko, chapter]);

  useEffect(() => {
    try {
      const key = `kids_art_${currentBookMeta.ko}_${chapter}_${verse}`;
      const saved = localStorage.getItem(key);
      setSavedBibleArtwork(saved || null);
    } catch (_) {}
  }, [currentBookMeta.ko, chapter, verse]);

  useEffect(() => {
    let isMounted = true;
    const fetchWords = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('interlinear_bible')
        .select('*')
        .eq('book', currentBookMeta.ko)
        .eq('chapter', chapter)
        .eq('verse', verse)
        .order('word_order', { ascending: true });

      if (isMounted && data) {
        setWords(data);
      }
    };
    fetchWords();
    setRecordedAudioUrl(null);
    setSelectedBlankChoice(null);
    setIsBlankCorrect(false);
    setIsPrayerSent(false);
    setStageBlessingMsg('');
    return () => { isMounted = false; };
  }, [currentBookMeta.ko, chapter, verse]);

  const easyVerseText = useMemo(() => {
    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    return easyBibleDb[key] || `${currentBookMeta.ko} ${chapter}장 ${verse}절 말씀을 함께 읽어요!`;
  }, [currentBookMeta.ko, chapter, verse, easyBibleDb]);

  // =====================================================================
  // 🧠 [핵심 고도화] 어린이용 원어 단어 정제 & 상형/상징 분해 엔진
  // =====================================================================
  const enrichedKidsWords = useMemo(() => {
    return (words || []).map((w, idx) => {
      const sId = (w.strongs_id || '').trim();
      const origClean = w.original_word?.replace(/[\u0591-\u05C7]/g, '') || '';
      const gOverride = GRAMMAR_OVERRIDES[sId] || GRAMMAR_OVERRIDES[origClean];
      const mEntry = masterDict[sId] || {};

      let displayKor = gOverride?.kor || mEntry.korean || w.korean_trans;
      if (!displayKor || /^[a-zA-Z\s[\]/,-]+$/.test(displayKor) || displayKor === '말씀') {
        if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
          displayKor = w.korean_trans;
        } else if (origClean === 'את' || origClean === 'אֵת') {
          displayKor = '~을 / ~를';
        } else if (origClean.startsWith('ו')) {
          displayKor = '그리고';
        } else if (origClean.startsWith('ה')) {
          displayKor = '바로 그';
        } else {
          displayKor = '보물 말씀';
        }
      }
      displayKor = displayKor.split(',')[0].trim();

      let displaySound = gOverride?.sound;
      if (!displaySound) {
        if (mEntry.pron && /[가-힣]/.test(mEntry.pron)) {
          displaySound = mEntry.pron.replace(/[[\]]/g, '');
        } else if (w.pronunciation && /[가-힣]/.test(w.pronunciation)) {
          displaySound = w.pronunciation.replace(/[[\]]/g, '');
        } else {
          displaySound = origClean.slice(0, 6);
        }
      }

      const displayEmoji = gOverride?.emoji || getKidFriendlyEmoji(displayKor);

      // 구약(히브리어) 및 신약(헬라어) 글자별 그림/상징 추출
      let pictoLetters = [];
      if (isOT) {
        const consonants = origClean.split('');
        pictoLetters = consonants.map(c => MASTER_PICTOGRAPHS[c]).filter(Boolean);
      } else {
        const greekChars = (w.original_word || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split('');
        pictoLetters = greekChars.map(c => MASTER_PICTOGRAPHS[c]).filter(Boolean);
      }

      const firstPicto = pictoLetters[0];
      const autoStory = gOverride?.story || (firstPicto
        ? `이 단어는 [${firstPicto.emoji} ${firstPicto.title}] 글자로 시작해요! '${firstPicto.meaning}'이라는 깊은 뜻이 담겨 있답니다.`
        : `하나님이 우리에게 주신 '${displayKor}'(이)라는 소중한 원어 말씀이에요!`);

      return {
        idx,
        raw: w,
        strongs: sId || (isOT ? 'H0000' : 'G0000'),
        original: cleanTypography(w.original_word, isOT, 'vowels'),
        displayKor,
        displaySound,
        displayEmoji,
        pictoLetters,
        story: autoStory
      };
    });
  }, [words, masterDict, isOT]);

  // =====================================================================
  // 🌈 [동적 구절 문맥 엔진] 정적 JSON이 없어도 모든 절에서 살아 움직이는 스토리 & 퀴즈 생성
  // =====================================================================
  const dynamicVerseContext = useMemo(() => {
    const text = easyVerseText || '';
    let themeIcon = '🌟';
    let stageBg = 'from-sky-400 via-indigo-500 to-purple-600';
    let sceneTitle = '하나님의 살아있는 말씀 무대';
    let interactiveObjects = [
      { emoji: '✨', label: '반짝이는 은혜 빛', msg: '하나님의 말씀이 내 마음을 환하게 비춰주셔요!' },
      { emoji: '🕊️', label: '평화의 비둘기', msg: '성령님이 오늘도 나와 함께 계셔요!' },
      { emoji: '🐑', label: '아기양 루루', msg: '목자 되신 예수님만 졸졸 따라갈래요!' },
      { emoji: '💖', label: '사랑의 하트', msg: '하나님은 나를 세상에서 가장 사랑하셔요!' }
    ];

    if (/빛|어둠|낮|밤|해|달|별|창조|천지/.test(text)) {
      themeIcon = '🌌';
      stageBg = 'from-indigo-900 via-purple-800 to-amber-500';
      sceneTitle = '천지창조 빛의 우주 무대 (아이콘을 터치해 보세요!)';
      interactiveObjects = [
        { emoji: '☀️', label: '찬란한 태양', msg: '"빛이 있으라!" 말씀 한마디로 우주가 환해졌어요!' },
        { emoji: '🌍', label: '아름다운 지구', msg: '하나님이 우리가 살 아름다운 지구를 선물해 주셨어요!' },
        { emoji: '⭐', label: '밤하늘 별자리', msg: '밤하늘의 별처럼 나도 하나님 안에서 반짝반짝 빛나요!' },
        { emoji: '🌱', label: '생명의 새싹', msg: '하나님의 따뜻한 햇살을 받고 새싹이 쑥쑥 자라나요!' }
      ];
    } else if (/물|바다|강|비|방주|물고기|배/.test(text)) {
      themeIcon = '🌊';
      stageBg = 'from-cyan-600 via-blue-600 to-indigo-800';
      sceneTitle = '시원한 갈릴리 바다와 생명수 무대';
      interactiveObjects = [
        { emoji: '⛵', label: '믿음의 배', msg: '풍랑이 일어도 예수님이 함께 타시면 안전해요!' },
        { emoji: '🐟', label: '갈릴리 물고기', msg: '하나님이 바다와 강에 수많은 물고기를 가득 채우셨어요!' },
        { emoji: '🌈', label: '언약의 무지개', msg: '우리를 끝까지 지켜주신다는 일곱 빛깔 약속이에요!' },
        { emoji: '💧', label: '생명수 샘물', msg: '예수님이 주시는 물을 마시면 마음이 영원히 시원해요!' }
      ];
    } else if (/예수|십자가|구원|사랑|피|보혈|그리스도/.test(text)) {
      themeIcon = '✝️';
      stageBg = 'from-rose-600 via-pink-600 to-amber-500';
      sceneTitle = '예수님의 십자가 사랑 언덕';
      interactiveObjects = [
        { emoji: '✝️', label: '사랑의 십자가', msg: '나를 구원하시려고 두 팔을 활짝 벌리신 예수님 사랑해요!' },
        { emoji: '👑', label: '생명의 면류관', msg: '예수님은 나의 영원한 왕이시며 구원자이셔요!' },
        { emoji: '🐑', label: '품에 안긴 어린양', msg: '예수님이 내 이름을 부르시고 품에 꼭 안아주셔요!' },
        { emoji: '🍞', label: '생명의 떡', msg: '예수님의 말씀은 내 영혼을 든든하게 하는 생명의 떡이에요!' }
      ];
    }

    // 구절 맞춤 스토리텔링 자동 생성
    const keyWordsStr = enrichedKidsWords.slice(0, 3).map(w => `'${w.displayKor}(${w.displaySound})'`).join(', ');
    const customStoryLines = kidsChapterData?.threeLineSummary || [
      `오늘 읽은 ${currentBookMeta.ko} ${chapter}장 ${verse}절에는 ${keyWordsStr || '소중한'} 말씀이 들어 있어요.`,
      `"${text}" — 이 말씀은 하나님께서 우리를 얼마나 깊이 사랑하시고 돌보시는지 알려주신답니다.`,
      `오늘 이 말씀을 마음속 보물상자에 꼭 담고, 예수님을 닮은 멋진 어린이로 자라나요!`
    ];

    // 구절 기반 실시간 빈칸 퀴즈 생성
    const cleanTokens = text.replace(/[.,!?()"']/g, '').trim().split(/\s+/).filter(t => t.length >= 2);
    const answerWord = cleanTokens.length > 0
      ? cleanTokens[Math.floor(cleanTokens.length / 2)]
      : (enrichedKidsWords[0]?.displayKor || '하나님');
    const blankedSentence = text.includes(answerWord)
      ? text.replace(answerWord, ' [ ❓ ] ')
      : `${text} (핵심 단어: [ ❓ ])`;

    const wrongPool = ['욕심꾸러기', '불평과 짜증', '깜깜한 어둠', '거짓말', '게으름'].filter(w => w !== answerWord);
    const quizOptions = [answerWord, wrongPool[0], wrongPool[1]].sort((a, b) => a.localeCompare(b));

    return {
      themeIcon,
      stageBg,
      sceneTitle,
      interactiveObjects,
      customStoryLines,
      blankQuiz: {
        questionSentence: blankedSentence,
        answer: answerWord,
        options: quizOptions
      }
    };
  }, [easyVerseText, enrichedKidsWords, kidsChapterData, currentBookMeta.ko, chapter, verse]);

  // =====================================================================
  // 🎮 미니게임 1 & 2 초기화 (말씀 기차 & 원어-한글 짝맞추기 메모리 게임)
  // =====================================================================
  const koreanTokens = useMemo(() => {
    if (!easyVerseText) return [];
    const cleanText = easyVerseText.replace(/[.,!?()[\]]/g, '').trim();
    return cleanText.split(/\s+/).slice(0, 10).map((word, idx) => ({
      id: `token_${idx}`,
      text: word,
      targetOrder: idx
    }));
  }, [easyVerseText]);

  useEffect(() => {
    if (koreanTokens.length > 0) {
      const shuffled = [...koreanTokens].sort(() => Math.random() - 0.5);
      setKoreanPuzzlePool(shuffled);
      setKoreanPuzzleTrain([]);
      setIsTrainComplete(false);
    }
  }, [koreanTokens]);

  // 원어-한글 메모리 게임 카드 세팅
  const initMemoryGame = useCallback(() => {
    const sourceWords = enrichedKidsWords.slice(0, 4);
    if (sourceWords.length === 0) return;

    const deck = [];
    sourceWords.forEach((w, idx) => {
      deck.push({
        uid: `orig_${idx}`,
        pairId: idx,
        type: 'original',
        mainText: w.original,
        subText: `[${w.displaySound}]`,
        sound: w.displaySound,
        kor: w.displayKor
      });
      deck.push({
        uid: `kor_${idx}`,
        pairId: idx,
        type: 'korean',
        mainText: `${w.displayEmoji} ${w.displayKor}`,
        subText: w.strongs,
        sound: w.displaySound,
        kor: w.displayKor
      });
    });

    setMemoryCards(deck.sort(() => Math.random() - 0.5));
    setFlippedIndices([]);
    setMatchedPairIds([]);
  }, [enrichedKidsWords]);

  useEffect(() => {
    initMemoryGame();
  }, [initMemoryGame]);

  const handleMemoryCardClick = (index) => {
    if (flippedIndices.length >= 2) return;
    if (flippedIndices.includes(index)) return;
    const clickedCard = memoryCards[index];
    if (!clickedCard || matchedPairIds.includes(clickedCard.pairId)) return;

    playSfx('pop');
    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = memoryCards[nextFlipped[0]];
      const secondCard = memoryCards[nextFlipped[1]];
      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          playSfx('correct');
          setMatchedPairIds(prev => [...prev, firstCard.pairId]);
          setFlippedIndices([]);
          awardStars(5);
        }, 350);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 850);
      }
    }
  };

  // TTS 낭독
  const handlePlayFullVerse = (rate = 0.88) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    playSfx('pop');
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(easyVerseText);
      utter.lang = 'ko-KR';
      utter.rate = rate;
      utter.pitch = 1.08;

      utter.onstart = () => setIsPlayingAudio(true);
      utter.onend = () => {
        setIsPlayingAudio(false);
        activeUtterance = null;
      };
      utter.onerror = () => {
        setIsPlayingAudio(false);
        activeUtterance = null;
      };

      activeUtterance = utter;
      window.speechSynthesis.speak(utter);
    }, 60);
  };

  const playWordVoice = (sound, kor) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    playSfx('pop');

    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(`${sound}! 뜻은, ${kor}!`);
      utter.lang = 'ko-KR';
      utter.rate = 0.92;
      utter.pitch = 1.1;

      activeUtterance = utter;
      window.speechSynthesis.speak(utter);
    }, 40);
  };

  // 녹음기 토글
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        playSfx('correct');
        awardStars(10);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        playSfx('pop');
      } catch (err) {
        alert("마이크 사용 권한을 허용해 주세요! 🎙️");
      }
    }
  };

  // 기차 퍼즐 핸들러
  const verifyTrainCompletion = (trainList, poolList) => {
    if (poolList.length === 0) {
      const isCorrect = trainList.every((t, i) => t.targetOrder === i);
      if (isCorrect) {
        setIsTrainComplete(true);
        playSfx('train');
        setTimeout(() => playSfx('correct'), 400);
        awardStars(15);
      } else {
        setKoreanPuzzlePool([...koreanTokens].sort(() => Math.random() - 0.5));
        setKoreanPuzzleTrain([]);
      }
    }
  };

  const handleAttachTrainCar = (token) => {
    playSfx('pop');
    const newTrain = [...koreanPuzzleTrain, token];
    const newPool = koreanPuzzlePool.filter(p => p.id !== token.id);
    setKoreanPuzzleTrain(newTrain);
    setKoreanPuzzlePool(newPool);
    verifyTrainCompletion(newTrain, newPool);
  };

  const handleDetachTrainCar = (token) => {
    playSfx('pop');
    const newTrain = koreanPuzzleTrain.filter(t => t.id !== token.id);
    const newPool = [...koreanPuzzlePool, token];
    setKoreanPuzzleTrain(newTrain);
    setKoreanPuzzlePool(newPool);
    setIsTrainComplete(false);
  };

  // 힌트: 다음 올바른 기차 칸 1개 자동 연결
  const handleTrainHint = () => {
    const nextIdx = koreanPuzzleTrain.length;
    const nextToken = koreanPuzzlePool.find(t => t.targetOrder === nextIdx);
    if (nextToken) {
      handleAttachTrainCar(nextToken);
    }
  };

  // ✍️ 단어 따라쓰기 칠판 드로잉
  const getCanvasCoords = (e, refObj) => {
    const canvas = refObj.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e, canvasRef);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e, canvasRef);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = crayonColor;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setIsStamped(false);
  };

  // 🎨 말씀 화실 드로잉 & 스탬프 콩콩
  const startBibleDrawing = (e) => {
    const coords = getCanvasCoords(e, bibleCanvasRef);
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (selectedStampEmoji) {
      playSfx('stamp');
      ctx.font = '38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedStampEmoji, coords.x, coords.y);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsBibleDrawing(true);
  };

  const drawBible = (e) => {
    if (!isBibleDrawing || selectedStampEmoji) return;
    const coords = getCanvasCoords(e, bibleCanvasRef);
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = bibleDrawColor;
    ctx.lineWidth = bibleBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopBibleDrawing = () => setIsBibleDrawing(false);
  const clearBibleCanvas = () => {
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveBibleArtwork = () => {
    const canvas = bibleCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const key = `kids_art_${currentBookMeta.ko}_${chapter}_${verse}`;
    try {
      localStorage.setItem(key, dataUrl);
      setSavedBibleArtwork(dataUrl);
      playSfx('correct');
      awardStars(10);
    } catch (_) {}
  };

  // 🎬 유튜브 영상 관리
  const currentVideoStorageKey = `kids_video_${currentBookMeta.ko}_${chapter}`;
  const savedVideoUrl = useMemo(() => {
    try { return localStorage.getItem(currentVideoStorageKey) || ''; } catch (_) { return ''; }
  }, [currentVideoStorageKey, showCinemaModal]);

  const extractYoutubeEmbedId = (urlOrId) => {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();
    const m = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : (clean.length === 11 ? clean : '');
  };

  const currentEmbedId = useMemo(() => {
    const customId = extractYoutubeEmbedId(savedVideoUrl);
    if (customId) return customId;
    return kidsChapterData?.youtubeVideoId || '9Hqvir-snmk';
  }, [savedVideoUrl, kidsChapterData]);

  const handleSaveCustomVideo = () => {
    const id = extractYoutubeEmbedId(customVideoInput);
    if (!id && customVideoInput.trim()) {
      alert("올바른 유튜브 링크를 입력해주세요!");
      return;
    }
    try {
      if (id) localStorage.setItem(currentVideoStorageKey, id);
      else localStorage.removeItem(currentVideoStorageKey);
      setIsEditingVideo(false);
    } catch (_) {}
  };

  const handleReturnToAcademic = () => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: currentBookMeta.ko,
        chapter,
        verse
      }));
    } catch (_) {}
    setActiveScreen('interlinear');
  };

  // 기도문 자동 조합
  const generatedKidPrayer = useMemo(() => {
    const keyword = enrichedKidsWords[0]?.displayKor || '사랑';
    return customPrayerText.trim() || `사랑하는 하나님 아버지! 오늘 [${currentBookMeta.ko} ${chapter}장 ${verse}절] 말씀을 통해 '${keyword}'의 은혜를 배웠어요. 지금 제 마음은 ${prayerMood}! 특별히 ${prayerTarget}을(를) 꼭 지켜주시고 축복해 주세요. 예수님의 이름으로 기도합니다. 아멘!`;
  }, [customPrayerText, currentBookMeta.ko, chapter, verse, enrichedKidsWords, prayerMood, prayerTarget]);

  const explorerLevel = Math.floor(stars / 15) + 1;
  const isDark = isDarkMode;

  const theme = {
    pageBg: isDark ? 'bg-[#0E131F]' : 'bg-[#FDFBF7]',
    textMain: isDark ? 'text-[#F8FAFC]' : 'text-[#1E293B]',
    textWood: isDark ? 'text-amber-300' : 'text-[#78350F]',
    boardBg: isDark ? 'bg-[#182032] border-[#334155]' : 'bg-[#FFFDF9] border-[#B45309]/40 shadow-[0_4px_16px_rgba(120,53,15,0.08)]',
    cardWood: isDark ? 'bg-[#1C253B] border-[#334155]' : 'bg-[#FFFDF7] border-[#D97706]/40 shadow-xs',
    greenBtn: 'bg-[#15803D] hover:bg-[#166534] text-white shadow-sm',
    woodPill: isDark ? 'bg-amber-950/60 border-amber-800 text-amber-200' : 'bg-[#FEF3C7] border-[#F59E0B]/50 text-[#78350F]'
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-x-hidden select-none font-sans ${theme.pageBg} ${theme.textMain}`}>
      
      {/* ── 1. 상단 글로벌 키즈 헤더 ── */}
      <header className={`px-2.5 sm:px-4 py-2 border-b flex items-center justify-between z-20 shrink-0 ${
        isDark ? 'bg-[#131B2B] border-slate-800' : 'bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#FDE68A] border-[#D97706]/50 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => { playSfx('pop'); setActiveScreen('home'); }} className="text-2xl p-1 cursor-pointer hover:scale-110 shrink-0">
            🏡
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { playSfx('pop'); setShowPassportModal(true); }}
                className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#15803D] text-white shadow-2xs hover:bg-[#166534] shrink-0 cursor-pointer"
              >
                🗺️ 탐험여권 Lv.{explorerLevel}
              </button>
              <span className={`text-xs font-black ${theme.textWood} font-mono shrink-0 bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded-full`}>
                ⭐ {stars}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-[#78350F] dark:text-amber-200 truncate flex items-center gap-1 mt-0.5">
              <span>🌻</span> 키즈 원어성경 테마파크
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCustomVideoInput(savedVideoUrl || currentEmbedId);
              setShowCinemaModal(true);
            }}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#FB7185] hover:bg-[#F43F5E] text-white shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>🎬</span> 극장
          </button>
          
          <button
            type="button"
            onClick={() => { playSfx('train'); setActiveScreen('jerusalem_tycoon'); }}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#B45309] hover:bg-[#78350F] text-white shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>🏛️</span> 예루살렘 건설
          </button>
 
          <button
            type="button"
            onClick={handleReturnToAcademic}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-[#15803D] hover:bg-[#166534] text-white shadow-xs active:scale-95 flex items-center gap-0.5 cursor-pointer"
          >
            <span>🎓</span> 어른용
          </button>
        </div>
      </header>

      {/* ── 2. 성경 권/장/절 선택 바 & 5대 테마파크 탭 스위처 ── */}
      <div className={`px-2 sm:px-4 py-2 border-b space-y-2 shrink-0 ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-[#FFFDF7] border-amber-200/80'}`}>
        {/* 권/장/절 다이얼 */}
        <div className="flex items-center justify-between gap-1 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <select
              value={selectedBookIndex}
              onChange={(e) => { playSfx('pop'); setSelectedBookIndex(Number(e.target.value)); setChapter(1); setVerse(1); }}
              className={`font-black text-sm sm:text-base bg-amber-100/70 dark:bg-slate-800 px-2.5 py-1 rounded-xl outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {BIBLE_66_BOOKS.map((b, idx) => (
                <option key={b.ko} value={idx} className="text-black">{b.ko}</option>
              ))}
            </select>
            <select
              value={chapter}
              onChange={(e) => { playSfx('pop'); setChapter(Number(e.target.value)); setVerse(1); }}
              className={`font-black text-sm sm:text-base bg-amber-100/70 dark:bg-slate-800 px-2 py-1 rounded-xl outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {Array.from({ length: currentBookMeta.maxChap }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}장</option>)}
            </select>
            <select
              value={verse}
              onChange={(e) => { playSfx('pop'); setVerse(Number(e.target.value)); }}
              className={`font-black text-sm sm:text-base bg-amber-100/70 dark:bg-slate-800 px-2 py-1 rounded-xl outline-none cursor-pointer ${theme.textWood} shrink-0`}
            >
              {Array.from({ length: 40 }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}절</option>)}
            </select>
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => { playSfx('pop'); setVerse(v => Math.max(1, v - 1)); }}
              className={`px-2.5 py-1 rounded-xl font-black text-xs border ${theme.woodPill} cursor-pointer active:scale-95`}
            >
              ◀ 이전절
            </button>
            <button
              onClick={() => { playSfx('pop'); setVerse(v => v + 1); }}
              className={`px-2.5 py-1 rounded-xl font-black text-xs border ${theme.woodPill} cursor-pointer active:scale-95`}
            >
              다음절 ▶
            </button>
          </div>
        </div>

        {/* 🎡 5대 테마파크 존 네비게이션 탭 */}
        <div className="grid grid-cols-5 gap-1 max-w-4xl mx-auto w-full">
          {[
            { id: 'story', icon: '🌟', label: '말씀동화' },
            { id: 'lexicon', icon: '🔍', label: '원어비밀' },
            { id: 'games', icon: '🎮', label: '놀이터' },
            { id: 'studio', icon: '🎨', label: '말씀화실' },
            { id: 'faith', icon: '🙏', label: '기도·도감' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { playSfx('pop'); setActiveParkTab(tab.id); }}
              className={`py-2 px-1 rounded-2xl text-[11px] sm:text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer border ${
                activeParkTab === tab.id
                  ? 'bg-[#D97706] text-white border-[#B45309] shadow-md scale-102'
                  : 'bg-white/70 dark:bg-slate-800/70 text-stone-700 dark:text-slate-300 border-amber-200/70 dark:border-slate-700 hover:bg-amber-50'
              }`}
            >
              <span className="text-base sm:text-sm">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. 메인 스크롤 뷰포트 (선택된 테마파크 존 렌더링) ── */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 pb-28 max-w-4xl mx-auto w-full space-y-3.5 hide-scrollbar text-left">

        {/* ===================================================================== */}
        {/* 🌟 [ZONE 1: 말씀동화] 인터랙티브 기적 무대 + 성우 녹음 스튜디오 + 구절 이야기 */}
        {/* ===================================================================== */}
        {activeParkTab === 'story' && (
          <div className="space-y-3.5 animate-fade-in">
            
            {/* 1) 터치하면 반응하는 인터랙티브 성경 기적 무대 */}
            <div className={`p-4 sm:p-5 rounded-[28px] bg-gradient-to-br ${dynamicVerseContext.stageBg} text-white shadow-xl relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-2 relative z-10">
                <span className="text-xs font-black bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                  {dynamicVerseContext.themeIcon} {dynamicVerseContext.sceneTitle}
                </span>
                <span className="text-[11px] font-mono font-bold opacity-85">
                  {currentBookMeta.ko} {chapter}:{verse}
                </span>
              </div>

              {/* 쉬운성경 메인 자막 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 my-2 relative z-10">
                <p className="text-base sm:text-xl font-black leading-relaxed break-keep text-white drop-shadow-xs">
                  "{easyVerseText}"
                </p>
              </div>

              {/* 터치 반응형 오브젝트 4종 */}
              <div className="grid grid-cols-4 gap-2 pt-2 relative z-10">
                {dynamicVerseContext.interactiveObjects.map((obj, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playSfx('magic');
                      setStageBlessingMsg(`${obj.emoji} ${obj.msg}`);
                      setStageParticles(prev => [...prev.slice(-8), { id: Date.now() + Math.random(), emoji: obj.emoji }]);
                      awardStars(2);
                    }}
                    className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-90 transition-all shadow-sm"
                  >
                    <span className="text-2xl sm:text-3xl animate-bounce" style={{ animationDelay: `${idx * 0.15}s` }}>
                      {obj.emoji}
                    </span>
                    <span className="text-[10.5px] font-black text-white truncate w-full text-center">
                      {obj.label}
                    </span>
                  </button>
                ))}
              </div>

              {stageBlessingMsg && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs text-center shadow-lg animate-fade-in">
                  {stageBlessingMsg} (+2⭐)
                </div>
              )}
            </div>

            {/* 2) 나도 성경 성우! 음성 낭독 & 녹음 스튜디오 */}
            <div className={`p-4 rounded-[26px] border-2 space-y-2.5 ${theme.boardBg}`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs sm:text-sm font-black ${theme.textWood} flex items-center gap-1.5`}>
                  <span>🎙️</span> 나도 성경 동화 성우! (듣고 따라 읽어봐요)
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  녹음하면 +10⭐
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handlePlayFullVerse(0.9)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isPlayingAudio ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#B45309] hover:bg-[#78350F] text-white'
                  }`}
                >
                  <span>{isPlayingAudio ? '⏹' : '🔊'}</span>
                  <span>{isPlayingAudio ? '낭독 멈춤' : '선생님 목소리'}</span>
                </button>

                <button
                  onClick={() => handlePlayFullVerse(0.68)}
                  className="py-2.5 px-3 rounded-2xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>🐢</span>
                  <span>천천히 또박또박</span>
                </button>

                <button
                  onClick={handleToggleRecord}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isRecording ? 'bg-rose-600 text-white animate-pulse' : theme.greenBtn
                  }`}
                >
                  <span>{isRecording ? '⏹' : '🎙️'}</span>
                  <span>{isRecording ? '녹음 완료!' : '내 목소리 녹음'}</span>
                </button>

                <button
                  disabled={!recordedAudioUrl}
                  onClick={() => {
                    if (!recordedAudioUrl) return;
                    const audio = new Audio(recordedAudioUrl);
                    audio.play();
                    playSfx('pop');
                  }}
                  className="py-2.5 px-3 rounded-2xl text-xs font-black bg-sky-600 hover:bg-sky-500 disabled:opacity-35 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>▶️</span>
                  <span>내 목소리 듣기</span>
                </button>
              </div>
            </div>

            {/* 3) 탐험대장 레오의 구절 맞춤 스토리 & 아기양 루루의 문답 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-4 rounded-[26px] border-2 space-y-2 ${isDark ? 'bg-[#16221D] border-emerald-800' : 'bg-[#F0FDF4] border-[#86EFAC]'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 bg-emerald-200 rounded-2xl">🦁</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-[#14532D] dark:text-emerald-300 block">
                      탐험대장 레오의 말씀 이야기
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      {currentBookMeta.ko} {chapter}장 {verse}절 속으로!
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs sm:text-[13px] font-bold leading-relaxed text-[#14532D] dark:text-emerald-100">
                  {dynamicVerseContext.customStoryLines.map((line, i) => (
                    <p key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 shrink-0">🌱</span>
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-[26px] border-2 space-y-2 ${isDark ? 'bg-[#211832] border-purple-800' : 'bg-[#FAF5FF] border-[#D8B4FE]'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 bg-purple-200 rounded-2xl">🐑</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-[#581C87] dark:text-purple-300 block">
                      아기양 루루의 생각 쑥쑥 질문
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">
                      부모님·선생님과 함께 이야기해 봐요
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/90 dark:bg-black/30 border border-purple-200 space-y-1.5 text-xs">
                  <p className="font-black text-[#581C87] dark:text-purple-200">
                    Q. {kidsChapterData?.catechismQnA?.question || `오늘 말씀에서 하나님은 우리에게 어떤 마음을 보여주시나요?`}
                  </p>
                  <p className="leading-relaxed text-stone-700 dark:text-slate-300 font-bold">
                    A. {kidsChapterData?.catechismQnA?.answer || `우리를 언제나 사랑하시고 가장 좋은 길로 인도해 주시는 좋으신 하나님이셔요!`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 🔍 [ZONE 2: 원어비밀] 원어 그림 돋보기 카드 + 상형문자 조합 연금술 실험실 */}
        {/* ===================================================================== */}
        {activeParkTab === 'lexicon' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* 1) 오늘 구절의 원어 그림 블록 카드 그리드 */}
            <div className={`p-4 rounded-[26px] border-2 space-y-3 ${theme.boardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black ${theme.textWood} flex items-center gap-1.5`}>
                    <span>🔍</span> {currentBookMeta.ko} {chapter}:{verse} 원어 보물 카드 ({isOT ? '히브리어' : '헬라어'})
                  </h3>
                  <p className="text-[11px] font-bold text-stone-500">
                    카드를 터치하면 원어 발음 소리가 나고, 글자 속에 숨겨진 그림 비밀과 따라쓰기 칠판이 열려요!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5" dir={isOT ? 'rtl' : 'ltr'}>
                {enrichedKidsWords.map((item) => (
                  <div
                    key={item.idx}
                    onClick={() => {
                      playWordVoice(item.displaySound, item.displayKor);
                      setSelectedWordCard(item);
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between active:scale-95 hover:border-amber-500 min-h-[112px] ${theme.cardWood}`}
                  >
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl font-black text-[#D97706] dark:text-amber-400 block leading-tight">
                        {item.original}
                      </span>
                      <span className="text-xs font-black text-[#15803D] dark:text-emerald-400 block mt-1" dir="ltr">
                        🗣️ [{item.displaySound}]
                      </span>
                    </div>

                    <div className="pt-2 border-t border-dashed border-amber-200 dark:border-slate-700 text-center" dir="ltr">
                      <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white flex items-center justify-center gap-1">
                        <span>{item.displayEmoji}</span>
                        <span className="truncate">{item.displayKor}</span>
                      </span>
                      {item.pictoLetters.length > 0 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {item.pictoLetters.slice(0, 4).map((p, pIdx) => (
                            <span key={pIdx} className="text-xs" title={p.title}>{p.emoji}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2) 🧪 고대 상형문자 그림 조합 실험실 (Pictograph Alchemy) */}
            <div className={`p-4 rounded-[26px] border-2 space-y-3 ${isDark ? 'bg-[#172033] border-amber-700/60' : 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#F59E0B]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                    PICTOGRAPH ALCHEMY LAB
                  </span>
                  <h3 className={`text-sm sm:text-base font-black ${theme.textWood}`}>
                    🧪 신기한 원어 그림문자 조합 실험실!
                  </h3>
                </div>
                <span className="text-[11px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-full">
                  조합 성공 시 +5⭐
                </span>
              </div>

              <p className="text-xs font-bold text-stone-700 dark:text-slate-300">
                고대 성경 글자는 원래 하나하나가 귀여운 그림이었어요! 아래 단어를 고르고 그림 블록을 순서대로 눌러 합쳐보세요.
              </p>

              {/* 실험할 성경 단어 선택 칩 */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1">
                {PICTOGRAPH_RECIPES.map(rcp => (
                  <button
                    key={rcp.id}
                    onClick={() => {
                      playSfx('pop');
                      setSelectedAlchemyRecipe(rcp);
                      setAlchemyStep(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 cursor-pointer border transition-all ${
                      selectedAlchemyRecipe.id === rcp.id
                        ? 'bg-[#78350F] text-white border-[#78350F] shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-amber-300'
                    }`}
                  >
                    {rcp.emoji} {rcp.kor.split(' ')[0]} ({rcp.sound})
                  </button>
                ))}
              </div>

              {/* 조합 스테이지 */}
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900 border-2 border-amber-300 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                  {selectedAlchemyRecipe.letters.map((char, cIdx) => {
                    const picto = MASTER_PICTOGRAPHS[char];
                    const isUnlocked = alchemyStep > cIdx;
                    return (
                      <React.Fragment key={cIdx}>
                        <button
                          onClick={() => {
                            if (alchemyStep === cIdx) {
                              const nextStep = alchemyStep + 1;
                              setAlchemyStep(nextStep);
                              if (nextStep === selectedAlchemyRecipe.letters.length) {
                                playSfx('magic');
                                awardStars(5);
                                playWordVoice(selectedAlchemyRecipe.sound, selectedAlchemyRecipe.kor);
                              } else {
                                playSfx('pop');
                              }
                            }
                          }}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center min-w-[92px] transition-all cursor-pointer ${
                            isUnlocked
                              ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 scale-105 shadow-md'
                              : alchemyStep === cIdx
                              ? 'bg-white dark:bg-slate-800 border-amber-400 animate-pulse'
                              : 'bg-stone-100 dark:bg-slate-800/50 border-stone-300 opacity-60'
                          }`}
                        >
                          <span className="text-3xl">{picto?.emoji}</span>
                          <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{char}</span>
                          <span className="text-[10.5px] font-black text-stone-700 dark:text-slate-200">{picto?.title}</span>
                          <span className="text-[9.5px] font-bold text-amber-600 mt-0.5">
                            {isUnlocked ? '✓ 합체 완료!' : alchemyStep === cIdx ? '👆 터치하세요!' : '대기 중'}
                          </span>
                        </button>
                        {cIdx < selectedAlchemyRecipe.letters.length - 1 && (
                          <span className="text-xl font-black text-amber-600">➕</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* 연금술 완성 결과 카드 */}
                {alchemyStep >= selectedAlchemyRecipe.letters.length && (
                  <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-2 border-emerald-500 space-y-1 animate-fade-in">
                    <div className="text-2xl font-black text-[#78350F] dark:text-amber-300">
                      🎉 {selectedAlchemyRecipe.emoji} {selectedAlchemyRecipe.hebrew} [{selectedAlchemyRecipe.sound}] = {selectedAlchemyRecipe.kor}!
                    </div>
                    <p className="text-xs font-bold text-stone-800 dark:text-slate-100 leading-relaxed">
                      💡 {selectedAlchemyRecipe.secretStory}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 🎮 [ZONE 3: 놀이터] 3-in-1 미니게임 (말씀기차 + 메모리 카드 + 구절 빈칸 퀴즈) */}
        {/* ===================================================================== */}
        {activeParkTab === 'games' && (
          <div className="space-y-3.5 animate-fade-in">
            
            {/* 미니게임 3종 선택 스위치 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'train', label: '🚂 말씀 기차 퍼즐', reward: '+15⭐' },
                { id: 'memory', label: '🃏 원어 짝맞추기', reward: '+20⭐' },
                { id: 'blankQuiz', label: '🎈 쏙쏙 빈칸 퀴즈', reward: '+10⭐' }
              ].map(gm => (
                <button
                  key={gm.id}
                  onClick={() => { playSfx('pop'); setMiniGameMode(gm.id); }}
                  className={`p-2.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                    miniGameMode === gm.id
                      ? 'bg-[#15803D] text-white border-[#166534] shadow-md'
                      : `${theme.boardBg} text-stone-700 dark:text-slate-200`
                  }`}
                >
                  <div className="text-xs sm:text-sm font-black">{gm.label}</div>
                  <div className="text-[10px] opacity-80 font-mono">{gm.reward}</div>
                </button>
              ))}
            </div>

            {/* 게임 1: 칙칙폭폭 한글 말씀 기차 */}
            {miniGameMode === 'train' && (
              <div className={`p-4 rounded-[26px] border-2 space-y-3 ${theme.boardBg}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-black ${theme.textWood}`}>
                    🚂 순서대로 기차 칸을 연결해 말씀을 완성해요!
                  </span>
                  <button
                    onClick={handleTrainHint}
                    disabled={isTrainComplete}
                    className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-white cursor-pointer disabled:opacity-40"
                  >
                    💡 힌트 1칸 연결
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FEF3C7]/60 dark:bg-black/50 border-2 border-dashed border-amber-400 min-h-[68px] flex flex-wrap gap-2 items-center">
                  <span className="text-2xl shrink-0 animate-bounce">🚂💨</span>
                  {koreanPuzzleTrain.length === 0 ? (
                    <span className="text-xs sm:text-sm text-stone-500 font-bold">
                      아래 대기 중인 단어 칸을 순서대로 터치해서 기차에 연결해 주세요! 🚃
                    </span>
                  ) : (
                    koreanPuzzleTrain.map((token) => (
                      <button
                        key={token.id}
                        onClick={() => handleDetachTrainCar(token)}
                        className="px-3 py-1.5 rounded-2xl bg-[#15803D] hover:bg-rose-500 text-white text-xs sm:text-sm font-black shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>🚃</span>
                        <span>{token.text}</span>
                      </button>
                    ))
                  )}
                  {isTrainComplete && (
                    <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-bounce">
                      🏁 칙칙폭폭 말씀 기차 완성! (+15⭐)
                    </span>
                  )}
                </div>

                {!isTrainComplete && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {koreanPuzzlePool.map((token) => (
                      <button
                        key={token.id}
                        onClick={() => handleAttachTrainCar(token)}
                        className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#D97706] text-[#78350F] dark:text-amber-200 text-xs sm:text-sm font-black shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        🚃 {token.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 게임 2: 원어-한글 짝맞추기 메모리 게임 */}
            {miniGameMode === 'memory' && (
              <div className={`p-4 rounded-[26px] border-2 space-y-3 ${theme.boardBg}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-sm font-black ${theme.textWood} block`}>
                      🃏 원어 글자와 한글 뜻 짝맞추기!
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      카드를 두 장씩 뒤집어 오늘 구절의 원어와 한글 뜻 짝꿍을 찾아주세요.
                    </span>
                  </div>
                  <button
                    onClick={() => { playSfx('pop'); initMemoryGame(); }}
                    className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white cursor-pointer"
                  >
                    🔄 다시 섞기
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {memoryCards.map((card, idx) => {
                    const isFlipped = flippedIndices.includes(idx);
                    const isMatched = matchedPairIds.includes(card.pairId);
                    const showFace = isFlipped || isMatched;

                    return (
                      <button
                        key={card.uid}
                        onClick={() => handleMemoryCardClick(idx)}
                        className={`h-24 rounded-2xl border-2 p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isMatched
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 scale-98'
                            : showFace
                            ? 'bg-amber-50 dark:bg-slate-800 border-amber-500 shadow-md'
                            : 'bg-gradient-to-br from-[#D97706] to-[#B45309] border-[#78350F] text-white hover:scale-102 shadow-sm'
                        }`}
                      >
                        {showFace ? (
                          <>
                            <span className="text-lg sm:text-xl font-black truncate max-w-full">
                              {card.mainText}
                            </span>
                            <span className="text-[11px] font-bold opacity-75 mt-0.5">
                              {card.subText}
                            </span>
                            {isMatched && <span className="text-[10px] font-black text-emerald-600 mt-0.5">✓ 짝꿍 성공!</span>}
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🎁</span>
                            <span className="text-[10px] font-black mt-1 opacity-90">터치해서 뒤집기</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 게임 3: 실시간 구절 빈칸 퀴즈 */}
            {miniGameMode === 'blankQuiz' && (
              <div className={`p-4 rounded-[26px] border-2 space-y-3 ${theme.boardBg}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-black ${theme.textWood}`}>
                    🎈 말씀 속 숨바꼭질! 빈칸 [ ❓ ]에 들어갈 말은 무엇일까요?
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-900 border-2 border-amber-300 text-sm sm:text-base font-black leading-relaxed text-stone-800 dark:text-amber-100">
                  "{dynamicVerseContext.blankQuiz.questionSentence}"
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dynamicVerseContext.blankQuiz.options.map((opt, idx) => {
                    const isSelected = selectedBlankChoice === opt;
                    const isRight = opt === dynamicVerseContext.blankQuiz.answer;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedBlankChoice(opt);
                          if (isRight) {
                            setIsBlankCorrect(true);
                            playSfx('correct');
                            awardStars(10);
                          } else {
                            setIsBlankCorrect(false);
                            playSfx('pop');
                          }
                        }}
                        className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                          isSelected
                            ? isRight
                              ? 'bg-[#15803D] text-white border-[#166534] shadow-md scale-102'
                              : 'bg-rose-500 text-white border-rose-600'
                            : 'bg-white dark:bg-slate-800 border-amber-400/60 text-stone-800 dark:text-white hover:bg-amber-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isBlankCorrect && (
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 animate-fade-in">
                    🎉 딩동댕! 정답은 [{dynamicVerseContext.blankQuiz.answer}]이에요! 말씀을 정말 잘 읽었네요 (+10⭐)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* 🎨 [ZONE 4: 말씀화실] 밑그림 도안 + 스탬프 툴 + 크레파스 스케치북 */}
        {/* ===================================================================== */}
        {activeParkTab === 'studio' && (
          <div className={`p-4 rounded-[26px] border-2 space-y-3 animate-fade-in ${theme.boardBg}`}>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className={`text-sm font-black ${theme.textWood} flex items-center gap-1`}>
                  <span>🎨</span> 키즈 말씀 화실 & 스탬프 공방 ({currentBookMeta.ko} {chapter}:{verse})
                </span>
                <span className="text-[11px] font-bold text-stone-500 block">
                  밑그림 도안을 고르고 크레파스와 귀여운 성경 스탬프로 나만의 말씀 액자를 완성해 보세요!
                </span>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveBibleArtwork}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black ${theme.greenBtn} cursor-pointer`}
                >
                  💾 내 성경에 저장 (+10⭐)
                </button>
                <button
                  onClick={clearBibleCanvas}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200 cursor-pointer"
                >
                  새 도화지 ↺
                </button>
              </div>
            </div>

            {/* 밑그림 도안 선택 바 */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
              <span className="text-[10.5px] font-black text-stone-500 shrink-0">밑그림 도안:</span>
              {[
                { id: 'ark', label: '🌈 무지개 방주' },
                { id: 'lamb', label: '🐑 선한 목자와 양' },
                { id: 'cross', label: '✝️ 예수님 사랑' },
                { id: 'word', label: '✍️ 오늘 원어 크게 쓰기' },
                { id: 'blank', label: '📄 백지 도화지' }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => { playSfx('pop'); setColoringTemplate(tpl.id); }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 cursor-pointer border ${
                    coloringTemplate === tpl.id
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 border-amber-200 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* 물감 팔레트 & 스탬프 콩콩 선택 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/70 dark:bg-slate-900 border border-amber-200/70">
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-black text-stone-500">크레파스:</span>
                {['#15803D', '#D97706', '#E11D48', '#0284C7', '#7C3AED', '#854D0E', '#1E293B'].map(c => (
                  <button
                    key={c}
                    onClick={() => { setSelectedStampEmoji(null); setBibleDrawColor(c); }}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      !selectedStampEmoji && bibleDrawColor === c ? 'scale-125 ring-2 ring-amber-500 shadow-md' : 'opacity-80'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10.5px] font-black text-stone-500 mr-1">스탬프 콩콩:</span>
                {['🐑', '🕊️', '🦁', '🌈', '👑', '💖', '✨'].map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      playSfx('pop');
                      setSelectedStampEmoji(selectedStampEmoji === st ? null : st);
                    }}
                    className={`w-7 h-7 rounded-lg text-base flex items-center justify-center cursor-pointer transition-all ${
                      selectedStampEmoji === st ? 'bg-amber-500 scale-115 shadow-sm' : 'bg-white dark:bg-slate-800 hover:scale-110'
                    }`}
                    title="선택 후 도화지를 터치하면 도장이 찍혀요!"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* 캔버스 뷰포트 (밑그림 워터마크 포함) */}
            <div className="relative w-full h-60 rounded-3xl border-4 border-dashed border-[#D97706]/50 bg-[#FFFDF7] dark:bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center">
              {/* 밑그림 가이드 레이어 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 select-none">
                {coloringTemplate === 'ark' && <span className="text-[110px]">⛵🌈🕊️</span>}
                {coloringTemplate === 'lamb' && <span className="text-[110px]">🌳🐑🦯</span>}
                {coloringTemplate === 'cross' && <span className="text-[110px]">💖✝️👑</span>}
                {coloringTemplate === 'word' && (
                  <span className="text-[76px] font-black text-amber-700">
                    {enrichedKidsWords[0]?.original || 'שָׁלוֹם'}
                  </span>
                )}
              </div>

              <canvas
                ref={bibleCanvasRef}
                width={520}
                height={240}
                onMouseDown={startBibleDrawing}
                onMouseMove={drawBible}
                onMouseUp={stopBibleDrawing}
                onMouseLeave={stopBibleDrawing}
                onTouchStart={startBibleDrawing}
                onTouchMove={drawBible}
                onTouchEnd={stopBibleDrawing}
                className="w-full h-full cursor-crosshair relative z-10 touch-none"
              />
            </div>

            {savedBibleArtwork && (
              <div className="p-3 rounded-2xl bg-[#FEF3C7]/60 dark:bg-black/40 border border-amber-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🖼️</span>
                  <div>
                    <span className={`text-xs font-black ${theme.textWood} block`}>내가 그린 말씀 액자 보관 완료!</span>
                    <span className="text-[10.5px] text-stone-500">이 구절을 열 때마다 내 작품이 함께 전시됩니다.</span>
                  </div>
                </div>
                <img src={savedBibleArtwork} alt="내 성경 그림" className="w-20 h-14 object-cover rounded-xl border-2 border-amber-400 shadow-sm bg-white" />
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* 🙏 [ZONE 5: 기도·도감] 예수님과 속닥속닥 기도 우체통 + 12대 성경 영웅 도감 */}
        {/* ===================================================================== */}
        {activeParkTab === 'faith' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* 1) 예수님과 속닥속닥 인터랙티브 기도 우체통 */}
            <div className={`p-4 rounded-[26px] border-2 space-y-3 ${isDark ? 'bg-[#2B171F] border-rose-800' : 'bg-[#FFF1F2] border-[#FDA4AF]'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-[#9F1239] dark:text-rose-300 flex items-center gap-1.5">
                  <span>📮</span> 예수님과 속닥속닥 하늘 기도 우체통
                </span>
                <span className="text-[10.5px] font-black bg-rose-500 text-white px-2.5 py-0.5 rounded-full">
                  기도 올리면 +10⭐
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-black text-rose-800 dark:text-rose-200 block mb-1">1. 오늘 내 마음은 어때요?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['감사해요 🥰', '기뻐요 😄', '용기가 필요해요 💪', '위로받고 싶어요 🫂', '미안해요 🙏'].map(m => (
                      <button
                        key={m}
                        onClick={() => { playSfx('pop'); setPrayerMood(m); setIsPrayerSent(false); }}
                        className={`px-3 py-1 rounded-full font-black cursor-pointer border ${
                          prayerMood === m ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200 border-rose-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-black text-rose-800 dark:text-rose-200 block mb-1">2. 누구를 위해 기도할까요?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['우리 가족 👨‍👩‍👧‍👦', '내 친구들 🤝', '아픈 이웃들 ❤️‍🩹', '교회와 목사님 ⛪', '나의 믿음 🌱'].map(t => (
                      <button
                        key={t}
                        onClick={() => { playSfx('pop'); setPrayerTarget(t); setIsPrayerSent(false); }}
                        className={`px-3 py-1 rounded-full font-black cursor-pointer border ${
                          prayerTarget === t ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200 border-rose-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 완성된 기도문 카드 */}
              <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900 border-2 border-rose-200 space-y-2">
                <span className="text-[10.5px] font-black text-rose-500 block">✍️ 오늘 나의 기도문 (직접 고쳐 써도 좋아요):</span>
                <textarea
                  rows={3}
                  value={customPrayerText || generatedKidPrayer}
                  onChange={(e) => setCustomPrayerText(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs sm:text-sm font-bold text-stone-800 dark:text-slate-100 resize-none leading-relaxed select-text"
                />
              </div>

              {isPrayerSent ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-center font-black text-xs sm:text-sm shadow-md animate-bounce">
                  🕊️ 슈웅~! 천사가 내 기도를 하늘 보좌 예수님께 전달했어요! (아멘! +10⭐)
                </div>
              ) : (
                <button
                  onClick={() => {
                    playSfx('magic');
                    setIsPrayerSent(true);
                    awardStars(10);
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  🕊️ 두 손 모으고 하늘나라로 기도 보내기 (아멘!)
                </button>
              )}
            </div>

            {/* 2) 🏆 별로 모으는 12대 성경 영웅·보물 카드 도감 */}
            <div className={`p-4 rounded-[26px] border-2 space-y-3 ${theme.boardBg}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className={`text-sm font-black ${theme.textWood} block`}>
                    🏆 내가 모은 성경 보물 카드 도감
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    말씀을 읽고 놀이터와 기도로 별(⭐)을 모으면 잠긴 보물 카드가 열려요! (현재 ⭐ {stars}개)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BIBLE_HERO_CARDS.map((card) => {
                  const unlocked = stars >= card.reqStars;
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (unlocked) {
                          playSfx('pop');
                          playWordVoice(card.title, card.desc);
                        }
                      }}
                      className={`p-3 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                        unlocked
                          ? 'bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 border-amber-400 cursor-pointer hover:scale-102 shadow-sm'
                          : 'bg-stone-100 dark:bg-slate-900/50 border-stone-300 dark:border-slate-800 opacity-55'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{unlocked ? card.emoji : '🔒'}</span>
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                          unlocked ? 'bg-amber-500 text-white' : 'bg-stone-300 text-stone-700'
                        }`}>
                          {unlocked ? '수집 완료!' : `⭐ ${card.reqStars} 필요`}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-black text-stone-900 dark:text-white block">
                          {unlocked ? card.title : '??? 비밀 보물'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
                          {card.ref}
                        </span>
                        {unlocked && (
                          <p className="text-[10.5px] font-medium text-stone-600 dark:text-slate-300 mt-1 leading-snug">
                            {card.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── 4. 상형·상징 분해 팝업 + 한글 점선 따라쓰기 칠판 모달 ── */}
      {selectedWordCard && (
        <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className={`w-full max-w-md rounded-[32px] border-4 p-4 sm:p-5 shadow-2xl flex flex-col space-y-3 text-left max-h-[94vh] overflow-y-auto hide-scrollbar ${
            isDark ? 'bg-[#151D2D] border-slate-700 text-white' : 'bg-[#FFFDF9] border-[#B45309] text-stone-900'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-amber-200 dark:border-slate-800">
              <span className={`text-xs font-black ${theme.textWood} font-mono`}>
                {selectedWordCard.strongs} • {isOT ? '히브리어 상형문자' : '헬라어 알파벳'} 비밀노트
              </span>
              <button onClick={() => setSelectedWordCard(null)} className="text-base font-black p-1 cursor-pointer">✕</button>
            </div>

            {/* 단어 메인 카드 */}
            <div className={`p-3.5 rounded-2xl border text-center relative ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#FEF3C7]/60 border-amber-300'
            }`}>
              <button
                type="button"
                onClick={() => playWordVoice(selectedWordCard.displaySound, selectedWordCard.displayKor)}
                className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full text-xs font-black cursor-pointer shadow-2xs ${theme.greenBtn}`}
              >
                🔊 발음 듣기
              </button>
              <span className="text-4xl font-black text-[#D97706] dark:text-amber-400 block leading-tight">
                {selectedWordCard.original}
              </span>
              <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white mt-1 block">
                {selectedWordCard.displayEmoji} {selectedWordCard.displayKor}
              </span>
              <span className="text-xs font-mono font-black text-stone-500 dark:text-stone-300 block mt-0.5">
                소리: [{selectedWordCard.displaySound}]
              </span>
            </div>

            {/* 상형문자/알파벳 조각 블록 */}
            {selectedWordCard.pictoLetters && selectedWordCard.pictoLetters.length > 0 && (
              <div className="space-y-1">
                <span className={`text-xs font-black ${theme.textWood} block`}>
                  🧩 이 단어를 이루는 글자 그림 조각들:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto hide-scrollbar">
                  {selectedWordCard.pictoLetters.map((p, pIdx) => (
                    <div key={pIdx} className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 flex items-center gap-2">
                      <span className="text-2xl shrink-0">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-black ${theme.textWood} block leading-tight`}>
                          {p.name} — {p.title}
                        </span>
                        <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 block truncate">
                          뜻: {p.meaning}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 그림 스토리 해설 */}
            <div className="p-2.5 rounded-2xl bg-[#FEF3C7]/40 dark:bg-slate-900 border border-amber-200 space-y-0.5">
              <span className={`font-black ${theme.textWood} block text-xs`}>
                🎨 어린이 눈높이 말씀 풀이
              </span>
              <p className="text-xs font-bold leading-relaxed text-stone-800 dark:text-slate-200">
                {selectedWordCard.story}
              </p>
            </div>

            {/* ✍️ 따라쓰기 칠판 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-stone-600 dark:text-stone-400">
                  ✍️ 손가락으로 말씀을 따라 써 보세요:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStamped(true);
                      playSfx('stamp');
                      awardStars(5);
                    }}
                    className="text-xs font-black text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg hover:bg-rose-200 cursor-pointer shadow-2xs"
                  >
                    참잘했어요 도장 쾅! 💮
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs font-bold text-stone-400 hover:text-stone-700 underline cursor-pointer"
                  >
                    지우기 ↺
                  </button>
                </div>
              </div>

              <div className="relative w-full h-40 rounded-3xl border-4 border-[#D97706]/60 bg-[#FFFDF7] dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner">
                <span className="absolute text-4xl sm:text-5xl font-black text-amber-200/80 dark:text-slate-800 pointer-events-none select-none tracking-widest">
                  {selectedWordCard.displayKor}
                </span>

                {isStamped && (
                  <div className="absolute z-20 w-24 h-24 rounded-full border-4 border-rose-600 text-rose-600 flex flex-col items-center justify-center rotate-[-15deg] font-black text-xs bg-white/95 shadow-xl animate-bounce">
                    <span className="text-sm">참잘했어요</span>
                    <span className="text-lg font-mono font-black">100점! 💯</span>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={400}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair relative z-10 touch-none"
                />
              </div>
            </div>

            <button
              onClick={() => setSelectedWordCard(null)}
              className="w-full py-3 rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm cursor-pointer shadow-md active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 5. 🗺️ 여권 모달 ── */}
      {showPassportModal && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-[#1E293B] border-2 border-amber-400 p-5 shadow-2xl text-left text-white space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="text-sm font-black text-amber-300">어린이 성경 탐험 여권</h3>
                  <span className="text-[10px] text-slate-400">BIBLE EXPLORER PASSPORT</span>
                </div>
              </div>
              <button onClick={() => setShowPassportModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">탐험가 등급</span>
                <span className="text-base font-black text-amber-400">Lv.{explorerLevel} 말씀 보물 대장</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">모은 별</span>
                <span className="text-base font-black text-amber-300 font-mono">⭐ {stars}개</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              💡 <b>기도·도감</b> 탭으로 이동하면 지금까지 모은 별로 잠금 해제된 <b>12대 성경 보물 카드</b>를 모두 감상할 수 있어요!
            </p>

            <button
              onClick={() => {
                setShowPassportModal(false);
                setActiveParkTab('faith');
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md"
            >
              🏆 내 보물 카드 도감 보러가기
            </button>
          </div>
        </div>
      )}

      {/* ── 6. 🎬 성경 극장 모달 ── */}
      {showCinemaModal && (
        <div className="fixed inset-0 z-[1100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="w-full max-w-xl rounded-3xl bg-[#161B22] border border-rose-500/50 p-4 shadow-2xl flex flex-col space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🎬</span>
                <h3 className="text-sm font-black text-rose-400">
                  {currentBookMeta.ko} {chapter}장 어린이 성경 극장
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVideo(!isEditingVideo)}
                  className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30 hover:bg-amber-400/20 cursor-pointer"
                >
                  {isEditingVideo ? '닫기' : '✏️ 링크 수정'}
                </button>
                <button onClick={() => setShowCinemaModal(false)} className="text-stone-400 hover:text-white p-1 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {isEditingVideo && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-300 block">
                  원하는 유튜브 영상 주소(URL) 또는 11자리 영상 ID를 넣어주세요:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVideoInput}
                    onChange={(e) => setCustomVideoInput(e.target.value)}
                    placeholder="예: https://youtu.be/9Hqvir-snmk"
                    className="flex-1 bg-black/60 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomVideo}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            )}

            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
              <iframe
                title="어린이 성경 동화 극장"
                src={`https://www.youtube-nocookie.com/embed/${currentEmbedId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <button
              onClick={() => setShowCinemaModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
            >
              극장 닫고 말씀 탐험 계속하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
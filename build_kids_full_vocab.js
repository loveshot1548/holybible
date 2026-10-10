// build_kids_full_vocab.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const OUT_FILE = path.join(DATA_DIR, 'kids_full_lexicon.json');
const MASTER_FILE = path.join(DATA_DIR, 'strongs_korean_master.json');

// 1. 고대 히브리어 22개 자음 상형문자 마스터 테이블 (필드명 무결점 매핑)
const PICTOGRAPHS = {
  'א': { emoji: '🐂', name: '알레프', title: '힘센 황소 머리', meaning: '가장 힘센 분, 하나님, 대장' },
  'ב': { emoji: '⛺', name: '베트', title: '아늑한 텐트 집', meaning: '가정, 하나님의 집, 안식처' },
  'ג': { emoji: '🐪', name: '기멜', title: '걸어가는 낙타 발', meaning: '걸어가다, 은혜를 베풀다' },
  'ד': { emoji: '🚪', name: '달렛', title: '열려 있는 문', meaning: '출입문, 겸손하게 들어감, 길' },
  'ה': { emoji: '🙌', name: '헤', title: '두 손 번쩍 든 사람', meaning: '바라보다, 하나님의 숨결, 은혜' },
  'ו': { emoji: '🪝', name: '와우', title: '텐트 고정 갈고리', meaning: '연결하다, 묶어주다, 그리고' },
  'ז': { emoji: '⚔️', name: '자인데', title: '곡식 베는 낫', meaning: '양식, 영적 무기, 기억하다' },
  'ח': { emoji: '🧱', name: '헤트', title: '단단한 울타리', meaning: '보호, 울타리, 비밀스러운 방' },
  'ט': { emoji: '🧺', name: '테트', title: '돌돌 감긴 바구니', meaning: '선함, 감추어진 보물' },
  'י': { emoji: '✋', name: '요드', title: '일하는 손과 팔', meaning: '하나님의 능력의 손, 행동' },
  'כ': { emoji: '🤲', name: '카프', title: '오목한 손바닥', meaning: '덮어주다, 축복하다, 감싸안다' },
  'ך': { emoji: '🤲', name: '카프', title: '오목한 손바닥', meaning: '덮어주다, 축복하다' },
  'ל': { emoji: '🦯', name: '라메드', title: '목자의 지팡이', meaning: '바른 길 인도, 가르치다, 배우다' },
  'מ': { emoji: '🌊', name: '멤', title: '출렁이는 거대한 파도', meaning: '생명수, 거대한 힘, 물' },
  'ם': { emoji: '🌊', name: '멤', title: '출렁이는 거대한 파도', meaning: '생명수, 물' },
  'נ': { emoji: '🌱', name: '눈', title: '생명의 씨앗', meaning: '계속 자라나는 생명, 후손' },
  'ן': { emoji: '🌱', name: '눈', title: '생명의 씨앗', meaning: '계속 자라나는 생명' },
  'ס': { emoji: '🪵', name: '사멕', title: '받쳐주는 든든한 기둥', meaning: '꽉 붙들어 주심, 의지하다' },
  'ע': { emoji: '👁️', name: '아인', title: '반짝이는 눈동자', meaning: '똑똑히 보다, 깊이 이해하다' },
  'פ': { emoji: '👄', name: '페', title: '말하는 입술', meaning: '말씀하시다, 찬양하다, 숨결' },
  'ף': { emoji: '👄', name: '페', title: '말하는 입술', meaning: '말씀하시다, 호흡' },
  'צ': { emoji: '🎣', name: '차데', title: '물고기 낚는 바늘', meaning: '옳은 길, 의로움, 따라가다' },
  'ץ': { emoji: '🎣', name: '차데', title: '물고기 낚는 바늘', meaning: '옳은 길, 의로움' },
  'ק': { emoji: '🌅', name: '코프', title: '떠오르는 아침 해', meaning: '거룩함, 특별하게 구별됨' },
  'ר': { emoji: '👤', name: '레쉬', title: '당당한 사람의 머리', meaning: '최고, 대장, 첫 번째' },
  'ש': { emoji: '🔥', name: '쉰', title: '타오르는 불꽃', meaning: '하나님의 거룩한 불, 지키다' },
  'ת': { emoji: '✝️', name: '타우', title: '언약의 십자가 표식', meaning: '약속의 완성, 확실한 보증' }
};

// 2. 히브리어 문법 불변사/접두사 100% 한글화 사전
const GRAMMAR_OVERRIDES = {
  "H853":  { kor: "~을 / ~를", sound: "에트", emoji: "🎯", story: "하나님이 콕 집어 사랑으로 만드신 대상을 가리키는 글자예요!" },
  "H854":  { kor: "~와 함께", sound: "에트", emoji: "🤝", story: "혼자가 아니라 하나님과 꼭 붙어 함께 있다는 뜻이에요!" },
  "H9001": { kor: "~에게 / ~로", sound: "레", emoji: "🦯", story: "목자님의 지팡이(ל)를 따라 목표를 향해 나아가는 방향이에요." },
  "H9002": { kor: "~안에 / ~로", sound: "베", emoji: "⛺", story: "아늑한 텐트 집(ב) 속에 쏙 들어가 머무는 모습을 뜻해요." },
  "H9003": { kor: "~처럼 / 같이", sound: "카", emoji: "🤲", story: "손바닥(כ)으로 잰 것처럼 꼭 닮았다는 뜻이에요." },
  "H9005": { kor: "그리고 / 와", sound: "베", emoji: "🔗", story: "갈고리(ו)처럼 앞과 뒤를 튼튼하게 묶어주는 글자예요." },
  "H9008": { kor: "바로 그", sound: "하", emoji: "👈", story: "두 손을 번쩍 들고(ה) '여기 좀 보세요! 바로 그거예요!' 가리키는 글자예요." }
};

// 3. 로컬 5.1MB master 사전 로드
let masterData = {};
if (fs.existsSync(MASTER_FILE)) {
  try {
    masterData = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
    console.log(`📦 strongs_korean_master.json ${Object.keys(masterData).length}개 표제어 연동`);
  } catch (e) {
    console.error("Master dictionary load failed:", e);
  }
}

const fullLexicon = {
  pictographs: PICTOGRAPHS,
  grammarOverrides: GRAMMAR_OVERRIDES,
  words: {}
};

for (const [id, entry] of Object.entries(masterData)) {
  let kor = entry.korean || '말씀';
  // 영문 오염 제거
  if (/^[a-zA-Z\s[\]/,-]+$/.test(kor)) {
    kor = '원어 어휘';
  }
  let pron = entry.pron ? entry.pron.replace(/[[\]]/g, '') : '원어';

  fullLexicon.words[id] = {
    id,
    kor,
    pron,
    desc: entry.desc?.slice(0, 150) || '성경에 기록된 귀한 하나님의 말씀이에요.'
  };
}

fs.writeFileSync(OUT_FILE, JSON.stringify(fullLexicon, null, 2), 'utf-8');
console.log(`✅ [성공] kids_full_lexicon.json 구축 완료 (${OUT_FILE})`);
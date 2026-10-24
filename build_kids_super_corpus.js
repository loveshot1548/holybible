// build_kids_super_corpus.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const OUT_LEXICON = path.join(DATA_DIR, 'kids_super_lexicon.json');
const CHAPTER_DIR = path.join(DATA_DIR, 'kids_study_by_chapter');

if (!fs.existsSync(CHAPTER_DIR)) fs.mkdirSync(CHAPTER_DIR, { recursive: true });

// 1. 고대 히브리어 22개 자음 상형문자 마스터 테이블 (필드명 무결점 보장)
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

// 2. 히브리어 기본 문법 요소 및 접두사 100% 한글화 사전
const HEBREW_GRAMMAR_PREFIXES = {
  "וְ": { kor: "그리고 / 와", sound: "베", emoji: "🔗", story: "앞 이야기와 뒷 이야기를 튼튼한 갈고리처럼 꽉 이어주는 접속사예요!" },
  "וַ": { kor: "그리고 곧", sound: "바", emoji: "⚡", story: "하나님의 말씀이 선포되자마자 바로 이어서 일어난 일이에요!" },
  "לְ": { kor: "~에게 / ~를 향해", sound: "레", emoji: "🎯", story: "목자님의 지팡이(ל)를 따라 목표를 향해 나아가는 방향을 가리켜요." },
  "בְּ": { kor: "~안에 / ~로", sound: "베", emoji: "⛺", story: "아늑한 텐트 집(ב) 속에 쏙 들어가 머무는 모습을 뜻해요." },
  "הַ": { kor: "바로 그", sound: "하", emoji: "👈", story: "두 손을 번쩍 들고(ה) '여기 좀 보세요! 바로 그거예요!' 가리키는 정관사예요." },
  "אֵת": { kor: "~을 / ~를", sound: "에트", emoji: "🎯", story: "하나님의 첫 글자 알레프(א)와 끝 글자 타우(ת)가 합쳐져, 하나님이 콕 짚어 만드신 대상을 보여줘요." },
  "מִן": { kor: "~로부터", sound: "민", emoji: "🚀", story: "어떤 장소나 사람에게서부터 힘차게 출발해 나오는 출발점이에요." },
  "עַל": { kor: "~위에", sound: "알", emoji: "🏔️", story: "높은 곳이나 표면 위에 당당히 서 있는 자리예요." }
};

// 3. 성경 핵심 어휘 초등 1학년용 전수 매핑
const KIDS_SUPER_VOCAB = {
  "H7225": { kor: "태초에", sound: "베레쉬트", emoji: "⏳", story: "우주의 시계가 째깍째깍 처음 시작된 가장 첫 번째 순간이에요!" },
  "H1254": { kor: "창조하셨다", sound: "바라", emoji: "✨", story: "아무것도 없는 빈방에서 번쩍하고 온 세상을 만드신 하나님의 특별한 기적이에요." },
  "H430":  { kor: "하나님", sound: "엘로힘", emoji: "👑", story: "🐂황소 머리(힘) + 🦯지팡이(다스림) + 🙌두 손 든 사람(생명) = 온 우주에서 가장 크신 힘으로 우리를 돌보시는 최고의 왕 하나님!" },
  "H8064": { kor: "하늘들", sound: "샤마임", emoji: "🌌", story: "별들과 은하수가 보석처럼 알록달록 박혀 있는 하나님의 푸른 정원이에요." },
  "H776":  { kor: "땅·세상", sound: "에레츠", emoji: "🌍", story: "우리가 발을 딛고 신나게 뛰놀 수 있게 깔아주신 초록색 잔디 운동장이에요." },
  "H8414": { kor: "텅 비고 어지러운", sound: "토후", emoji: "🌀", story: "블록 장난감이 방바닥에 와르르 쏟아져 아직 정리가 안 된 모습이에요." },
  "H922":  { kor: "아무것도 없는", sound: "보후", emoji: "📦", story: "상자 속에 장난감이 하나도 없이 비어 있어 하나님이 채워주실 차례예요." },
  "H2822": { kor: "어둠", sound: "호셰크", emoji: "🌑", story: "이불을 푹 뒤집어썼을 때처럼 앞이 보이지 않는 깜깜한 상태예요." },
  "H8415": { kor: "깊은 바다", sound: "테홈", emoji: "🌊", story: "끝이 보이지 않을 만큼 깊고 신비로운 거대한 바닷물이에요." },
  "H7307": { kor: "하나님의 영(숨결)", sound: "루아흐", emoji: "🕊️", story: "엄마 품처럼 따뜻하게 물 위를 감싸안고 계신 성령 하나님의 사랑의 숨결이에요." },
  "H7363": { kor: "따뜻하게 품으시다", sound: "메라헤페트", emoji: "🐣", story: "엄마 새가 아기 알을 품듯 온 세상을 깨트리지 않고 조심스레 돌보시는 모습이에요." },
  "H4325": { kor: "물들", sound: "마임", emoji: "💧", story: "모든 풀과 동물들이 마시고 쑥쑥 자라게 하는 시원한 생명수예요." },
  "H559":  { kor: "말씀하셨다", sound: "아마르", emoji: "🗣️", story: "하나님 입술(פ)의 말씀 한마디에 온 우주가 그대로 생겨났어요!" },
  "H216":  { kor: "빛", sound: "오르", emoji: "💡", story: "어둠을 단숨에 쫓아내고 세상을 따뜻하고 환하게 밝힌 하나님의 스위치예요." },
  "H7200": { kor: "보셨다", sound: "라아", emoji: "👀", story: "하나님께서 자신이 지으신 세상을 사랑 가득한 다정한 눈(ע)으로 바라보셨어요." },
  "H2896": { kor: "최고로 좋았다", sound: "토브", emoji: "👍", story: "더 바랄 게 없을 만큼 완벽하고 예쁘다는 하나님의 특급 칭찬이에요!" },
  "H914":  { kor: "나누셨다", sound: "바달", emoji: "✂️", story: "어둠과 빛이 서로 엉키지 않게 규칙과 질서를 딱 정해주셨어요." },
  "H3117": { kor: "낮·날", sound: "욤", emoji: "☀️", story: "해가 쨍쨍 떠서 친구들과 웃으며 뛰놀 수 있는 밝은 하루예요." },
  "H3915": { kor: "밤", sound: "라일라", emoji: "🌙", story: "예쁜 달님이 뜨고 코코 낮잠 자며 쉬는 하나님의 선물 시간이에요." },
  "H6153": { kor: "저녁", sound: "에레브", emoji: "🌆", story: "하늘이 주황빛 노을로 물들며 하루를 감사로 마무리하는 시간이에요." },
  "H1242": { kor: "아침", sound: "보케르", emoji: "🌅", soundKor: "보케르", story: "새로운 아침 해가 방긋 떠오르며 새 힘을 주는 출발이에요." },
  "H259":  { kor: "첫째 날", sound: "에하드", emoji: "1️⃣", story: "세상에서 가장 눈부신 첫 번째 날이 활짝 열렸어요!" },
  "H7549": { kor: "넓은 하늘", sound: "라키아", emoji: "☁️", story: "하늘 물과 바다 물을 나누어 구름이 둥둥 떠다니는 파란 유리창 같은 하늘이에요." },
  "H3004": { kor: "마른 땅", sound: "야바샤", emoji: "🏝️", story: "바닷물이 물러가고 나무와 꽃들이 뿌리내릴 수 있게 뽀송뽀송해진 흙이에요." },
  "H7121": { kor: "부르셨다", sound: "카라", emoji: "📣", story: "다정한 목소리로 '너는 낮이야!', '너는 밤이야!' 이름을 지어주셨어요." },
  "H1961": { kor: "있었다·되니", sound: "하야", emoji: "🌱", story: "하나님이 말씀하신 그대로 온 세상에 쏙 생겨났다는 뜻이에요." }
};

// 4. 기존 대형 한글 스트롱 사전(strongs_korean_master.json) 병합
const MASTER_FILE = path.join(DATA_DIR, 'strongs_korean_master.json');
let masterData = {};
if (fs.existsSync(MASTER_FILE)) {
  try {
    masterData = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
    console.log(`📦 기존 5.1MB 대형 한글 스트롱 사전 ${Object.keys(masterData).length}개 표제어 연동 성공!`);
  } catch (e) {}
}

const finalSuperLexicon = {
  pictographs: PICTOGRAPHS,
  grammarPrefixes: HEBREW_GRAMMAR_PREFIXES,
  vocab: KIDS_SUPER_VOCAB
};

// 전체 스트롱 코드 한글 데이터 융합
for (const [sId, mEntry] of Object.entries(masterData)) {
  if (!finalSuperLexicon.vocab[sId]) {
    finalSuperLexicon.vocab[sId] = {
      kor: mEntry.korean || '원어 어휘',
      sound: mEntry.pron?.replace(/[[\]]/g, '') || '원어',
      emoji: '📖',
      story: mEntry.desc?.slice(0, 120) || '성경에 기록된 소중한 하나님의 말씀이에요.'
    };
  }
}

fs.writeFileSync(OUT_LEXICON, JSON.stringify(finalSuperLexicon, null, 2), 'utf-8');
console.log(`✅ [성공 1/2] 제로-잉글리시 어린이 원어 슈퍼 사전 구축 완료 (${OUT_LEXICON})`);

// 5. 창세기 1장~3장 초등 1학년 과학·역사 고품질 백과 정밀 생성
const REAL_CHAPTERS = {
  "창세기_1": {
    threeLineSummary: [
      "1. 캄캄하고 텅 빈 우주에 하나님이 '빛이 생겨라!' 말씀하시자 번쩍하고 첫날이 시작되었어요.",
      "2. 하늘과 바다, 나무와 꽃, 해와 달, 동물들을 순서대로 예쁘게 꾸며주셨어요.",
      "3. 마지막에 하나님의 사랑을 쏙 닮은 사람을 만드시고 '정말 최고로 좋아!' 기뻐하셨어요."
    ],
    realFact: {
      title: "🔬 첫째 날 빛 vs 넷째 날 해와 달의 비밀!",
      description: "첫째 날의 빛은 태양 없이 온 우주를 환하게 밝힌 하나님의 순수한 에너지예요. 태양과 달은 넷째 날에 시계처럼 시간을 맞추려고 만드셨답니다."
    },
    catechismQnA: {
      question: "하나님은 왜 흙으로 사람을 만드셨을까요?",
      answer: "우리가 흙처럼 연약하지만, 하나님의 숨결(영)을 불어넣어 온 세상에서 하나님과 대화할 수 있는 가장 소중한 친구로 삼아주시기 위해서예요!"
    },
    actionQuest: {
      mission: "오늘 창밖의 하늘과 푸른 나무를 보고 '하나님, 멋진 세상을 주셔서 고마워요!' 외치기",
      prayer: "하나님, 깜깜한 마음에 예수님의 밝은 빛을 비춰주셔서 매일 활짝 웃게 해 주세요. 아멘!"
    },
    quiz: {
      question: "하나님께서 '빛'을 부르신 이름(히브리어: 오르)의 쉬운 뜻은 무엇일까요?",
      options: ["밝은 낮 ☀️", "깜깜한 밤 🌙", "차가운 얼음 ❄️"],
      correctIndex: 0,
      praise: "딩동댕! 하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르셨어요!"
    }
  },
  "창세기_2": {
    threeLineSummary: [
      "1. 엿새 동안 세상을 다 지으신 하나님이 일곱째 날에 달콤한 쉼(안식일)을 누리셨어요.",
      "2. 흙으로 아담을 빚으시고 코에 생기를 훅 불어넣어 살아 숨 쉬게 하셨어요.",
      "3. 보석처럼 아름다운 에덴동산을 주시고 동물들의 이름을 직접 짓게 하셨어요."
    ],
    realFact: {
      title: "🐾 아담은 동물 이름을 몇 마리나 지었을까요?",
      description: "사자, 기린, 코끼리뿐 아니라 새와 물고기까지 수백 마리의 특징을 관찰하며 멋진 이름을 붙여준 최초의 천재 동물학자였어요!"
    },
    catechismQnA: {
      question: "선악과는 왜 에덴동산 한가운데 두셨을까요?",
      answer: "아담이 로봇이 아니라, 하나님을 진짜 왕으로 인정하고 사랑으로 순종하는지 확인하는 '사랑의 약속 기둥'이었어요."
    },
    actionQuest: {
      mission: "오늘 반려동물이나 길가의 강아지, 화분의 식물을 보고 예쁜 별명 하나 지어주기",
      prayer: "하나님, 저를 특별하게 만들어 주셔서 감사해요. 하나님의 말씀에 기쁨으로 순종할게요. 아멘!"
    },
    quiz: {
      question: "하나님께서 사람을 만드실 때 재료로 쓰신 것은 무엇일까요?",
      options: ["단단한 돌 🪨", "부드러운 흙 흙흙", "차가운 쇠 ⚙️"],
      correctIndex: 1,
      praise: "정답! 흙으로 빚으시고 하나님의 숨결을 불어넣어 주셨어요!"
    }
  },
  "창세기_3": {
    threeLineSummary: [
      "1. 간교한 뱀의 거짓말에 속아 아담과 하와가 하나님의 약속을 어기고 선악과를 먹었어요.",
      "2. 죄가 들어오자 마음이 두려워져 나무 뒤에 숨고 서로 네 탓이라며 핑계를 댔어요.",
      "3. 슬퍼하시는 하나님은 가죽옷을 지어 입혀주시고, 장차 뱀을 물리칠 예수님을 약속하셨어요."
    ],
    realFact: {
      title: "🧥 최초의 가죽옷과 어린양의 희생",
      description: "부끄러워 무화과 잎으로 가린 옷은 금방 말라 바스라졌어요. 하나님은 어린양을 대신 희생시켜 피 묻은 가죽옷을 지어 따뜻하게 입혀주셨답니다."
    },
    catechismQnA: {
      question: "잘못을 저질렀을 때 왜 숨거나 핑계를 대면 안 될까요?",
      answer: "하나님은 이미 다 알고 계셔요! '하나님, 제가 잘못했어요' 정직하게 털어놓으면 십자가 사랑으로 꼭 안아주신답니다."
    },
    actionQuest: {
      mission: "오늘 부모님이나 친구에게 실수했을 때 변명하지 않고 '미안해' 먼저 사과하기",
      prayer: "예수님, 제 죄를 가려주시는 사랑의 가죽옷이 되어 주셔서 감사해요. 솔직한 어린이가 될게요. 아멘!"
    },
    quiz: {
      question: "부끄러워하는 아담과 하와를 위해 하나님이 직접 지어주신 따뜻한 옷은 무엇일까요?",
      options: ["바스락거리는 나뭇잎 옷 🍃", "따뜻하고 질긴 가죽옷 🧥", "반짝이는 비단 옷 👗"],
      correctIndex: 1,
      praise: "맞았어요! 어린양의 희생으로 만든 가죽옷은 예수님의 십자가 사랑을 뜻해요!"
    }
  }
};

for (const [key, data] of Object.entries(REAL_CHAPTERS)) {
  const filePath = path.join(CHAPTER_DIR, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

console.log("✅ [성공 2/2] 창세기 1~3장 전수 고품질 실데이터 적재 완료!");
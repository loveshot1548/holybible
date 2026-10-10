// build_kids_lexicon.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const OUT_FILE = path.join(DATA_DIR, 'kids_strongs_lexicon.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 고대 히브리어 22개 자음 상형문자 마스터 사전
const PICTOGRAPH_LETTERS = {
  'א': { name: '알레프 (Aleph)', symbol: '🐂 황소 머리', meaning: '힘, 전능하신 하나님, 첫 번째' },
  'ב': { name: '베트 (Bet)', symbol: '⛺ 텐트/집', meaning: '가정, 안식처, 하나님의 집' },
  'ג': { name: '기멜 (Gimel)', symbol: '🐪 낙타/발', meaning: '걷다, 은혜를 베풀다, 나아가다' },
  'ד': { name: '달렛 (Dalet)', symbol: '🚪 열린 문', meaning: '길, 출입문, 겸손하게 들어감' },
  'ה': { name: '헤 (He)', symbol: '🙌 손 든 사람/창문', meaning: '바라보다, 계시, 숨결, 은혜' },
  'ו': { name: '와우 (Vav)', symbol: '🪝 갈고리/못', meaning: '연결하다, 십자가의 못, 고정하다' },
  'ז': { name: '자인데 (Zayin)', symbol: '⚔️ 쟁기/검', meaning: '양식, 영적 무기, 추수' },
  'ח': { name: '헤트 (Chet)', symbol: '🧱 울타리/담', meaning: '보호, 울타리, 사적인 교제' },
  'ט': { name: '테트 (Tet)', symbol: '🧺 바구니/진흙', meaning: '선함, 감추어진 보물' },
  'י': { name: '요드 (Yod)', symbol: '✋ 펼친 손/팔', meaning: '행동, 하나님의 능력의 오른손' },
  'כ': { name: '카프 (Kaph)', symbol: '🤲 손바닥/덮개', meaning: '축복하다, 덮어주다, 지배하다' },
  'ל': { name: '라메드 (Lamed)', symbol: '🦯 목자의 지팡이', meaning: '인도하다, 권위, 배우다, 가르치다' },
  'מ': { name: '멤 (Mem)', symbol: '🌊 파도치는 물', meaning: '생수, 거대한 힘, 혼돈에서 생명으로' },
  'נ': { name: '눈 (Nun)', symbol: '🐟 물고기/씨앗', meaning: '계승, 생명, 후손, 번성' },
  'ס': { name: '사멕 (Samekh)', symbol: '🪵 버팀목/기둥', meaning: '지탱하다, 기대다, 붙들어주심' },
  'ע': { name: '아인 (Ayin)', symbol: '👁️ 눈 (Eye)', meaning: '보다, 알다, 깨닫다, 분별' },
  'פ': { name: '페 (Pe)', symbol: '👄 입 (Mouth)', meaning: '말하다, 호흡, 찬양 선포' },
  'צ': { name: '차데 (Tsade)', symbol: '🎣 낚시바늘/누운 사람', meaning: '의로움, 기다림, 추적하다' },
  'ק': { name: '코프 (Qof)', symbol: '☀️ 떠오르는 해/바늘귀', meaning: '거룩, 시간, 뒤를 따라가다' },
  'ר': { name: '레쉬 (Resh)', symbol: '👤 사람의 머리', meaning: '최고, 시작, 대장, 우두머리' },
  'ܫ': { name: '쉰 (Shin)', symbol: '🔥 날카로운 이빨/불꽃', meaning: '소멸하다, 씹다, 하나님의 불' },
  'ת': { name: '타우 (Tav)', symbol: '✝️ 두 막대기 표식(십자가)', meaning: '언약의 완성, 목표, 도장, 인침' }
};

// 핵심 원어 단어별 어린이 상형문자 심층 해체 데이터베이스
const KIDS_LEXICON_DATABASE = {
  // 창세기 1장 핵심 어휘
  "H7225": { // 베레쉬트 (태초에)
    hebrew: "בְּרֵאשִׁית",
    korean: "태초에",
    phonetic: "베레쉬트",
    rootLetters: ['ב', 'ר', 'א', 'ש', 'י', 'ת'],
    letterBreakdown: [
      { letter: 'ב', meaning: '집/텐트' },
      { letter: 'ר', meaning: '머리/우두머리' },
      { letter: 'א', meaning: '하나님' },
      { letter: 'ש', meaning: '불꽃/소멸' },
      { letter: 'י', meaning: '손' },
      { letter: 'ת', meaning: '십자가 표식(언약)' }
    ],
    pictographStory: "집(ב)의 머리(ר)되시는 하나님(א)께서 자신의 손(י)과 십자가 언약(ת)으로 온 우주 역사의 시간표를 활짝 여셨다는 뜻이에요!",
    funFact: "이 단어의 첫 글자 '베트(ב)'는 텐트 집 모양이에요. 하나님이 세상을 지으신 건 우리가 살 아름다운 '우주 집'을 지어주신 거예요."
  },
  "H1254": { // 바라 (창조하시니라)
    hebrew: "בָּרָא",
    korean: "창조하셨다",
    phonetic: "바라",
    rootLetters: ['ב', 'ר', 'א'],
    letterBreakdown: [
      { letter: 'ב', meaning: '집/아들' },
      { letter: 'ר', meaning: '우두머리/머리' },
      { letter: 'א', meaning: '전능하신 하나님' }
    ],
    pictographStory: "재료가 아예 없는 '0(Zero)'에서 온 세상을 하나님만의 놀라운 힘으로 만들어 내셨을 때만 쓰는 단어예요.",
    funFact: "우리가 레고로 성을 만드는 건 '재료'가 있지만, 하나님의 '바라'는 레고 블록조차 없는 깜깜한 빈방에서 번쩍하고 성을 만드신 거랍니다."
  },
  "H430": { // 엘로힘 (하나님)
    hebrew: "אֱלֹהִים",
    korean: "하나님",
    phonetic: "엘로힘",
    rootLetters: ['א', 'ל', 'ה'],
    letterBreakdown: [
      { letter: 'א', meaning: '황소(가장 힘센 분)' },
      { letter: 'ל', meaning: '목자의 지팡이(다스리시는 분)' }
    ],
    pictographStory: "온 우주에서 힘이 가장 세신 진짜 왕(א)이자, 지팡이(ל)로 우리를 돌보시는 참 목자 하나님을 나타내요.",
    funFact: "단어 끝에 '임(ים)'이 붙으면 복수형(여럿)이에요. 성부, 성자, 성령 삼위일체 하나님이 함께 사랑하며 세상을 만드셨음을 보여줘요."
  },
  "H8064": { // 샤마임 (하늘들)
    hebrew: "שָׁמַיִם",
    korean: "하늘들",
    phonetic: "샤마임",
    rootLetters: ['ש', 'מ', 'י', 'ם'],
    letterBreakdown: [
      { letter: 'ש', meaning: '숨결/불꽃' },
      { letter: 'מ', meaning: '물/바다' }
    ],
    pictographStory: "물(מ)이 가득한 푸른 궁창과 하나님의 숨결(ש)이 별처럼 반짝이는 거대한 하늘 정원을 뜻해요.",
    funFact: "성경에서 하늘은 하나가 아니라 '하늘들(복수)'이에요. 새가 나는 대기권, 별이 빛나는 우주, 하나님의 영광이 계신 셋째 하늘을 뜻해요."
  },
  "H776": { // 에레츠 (땅)
    hebrew: "אֶרֶץ",
    korean: "땅, 세상",
    phonetic: "에레츠",
    rootLetters: ['א', 'ר', 'ץ'],
    letterBreakdown: [
      { letter: 'א', meaning: '하나님' },
      { letter: 'ר', meaning: '우두머리' },
      { letter: 'ץ', meaning: '달려가는 발' }
    ],
    pictographStory: "하나님(א)의 명령을 따라 멈추지 않고 생명을 피워내며 달려가는(ץ) 땅과 흙을 뜻해요.",
    funFact: "우리가 밟는 흙은 우연히 굳어진 게 아니라, 동물과 식물, 그리고 사람이 발을 딛고 뛰놀도록 하나님이 깔아주신 초록색 양탄자예요."
  },

  // 신약 복음서 핵심 어휘
  "G2424": { // 이에수스 (예수)
    hebrew: "Ἰησοῦς",
    korean: "예수",
    phonetic: "이에수스 (예슈아)",
    rootLetters: ['י', 'ה', 'ו', 'ܫ', 'ܥ'],
    pictographStory: "히브리어 '예슈아'에서 온 이름으로, '여호와께서 자기 백성을 죄에서 건져내어 영원히 구원하신다'는 뜻이에요!",
    funFact: "예수님의 이름은 고대 히브리어로 여호수아와 같아요. 여호수아가 백성을 약속의 땅으로 이끌었듯, 예수님은 우리를 천국으로 이끄셔요."
  },
  "G5547": { // 크리스토스 (그리스도)
    hebrew: "Χριστός",
    korean: "그리스도 (메시아)",
    phonetic: "크리스토스",
    pictographStory: "히브리어 '메시아'의 헬라어 번역으로, '하나님께 특별한 기름부음을 받은 거룩한 왕, 제사장, 선지자'를 뜻해요.",
    funFact: "고대 이스라엘에서는 왕이 될 때 머리에 향기로운 올리브 기름을 부었어요. 예수님은 영원한 우주의 대장이자 왕이셔요."
  },
  "G26": { // 아가페 (사랑)
    hebrew: "ἀγάπη",
    korean: "아가페 사랑",
    phonetic: "아가페",
    pictographStory: "조건 없이, 내 목숨까지 다 내어주며 끝까지 아껴주는 하나님의 절대적인 십자가 사랑이에요.",
    funFact: "친구가 착한 일을 해서 좋아하는 건 '필리아'이지만, 내가 잘못을 저질렀는데도 먼저 안아주고 용서해 주는 게 바로 '아가페'예요."
  }
};

fs.writeFileSync(OUT_FILE, JSON.stringify(KIDS_LEXICON_DATABASE, null, 2), 'utf-8');
console.log(`✅ [성공] 어린이 원어 상형문자 마스터 사전 구축 완료 (${OUT_FILE})`);
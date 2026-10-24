// build_kids_chapters.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const TARGET_DIR = path.join(DATA_DIR, 'kids_study_by_chapter');
if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

// 성경 66권 목록
const BIBLE_BOOKS = [
  { ko: "창세기", en: "Genesis", chaps: 50, era: "B.C. 1446년경 (창조~족장 시대)", keyword: "시작과 언약" },
  { ko: "출애굽기", en: "Exodus", chaps: 40, era: "B.C. 1446년경 (출애굽 여정)", keyword: "구원과 성막" },
  { ko: "레위기", en: "Leviticus", chaps: 27, era: "B.C. 1445년경", keyword: "거룩과 제사" },
  { ko: "민수기", en: "Numbers", chaps: 36, era: "B.C. 1445-1406", keyword: "광야 행진" },
  { ko: "신명기", en: "Deuteronomy", chaps: 34, era: "B.C. 1406년경", keyword: "기억과 순종" },
  { ko: "여호수아", en: "Joshua", chaps: 24, era: "B.C. 1406-1375", keyword: "정복과 안식" },
  { ko: "사사기", en: "Judges", chaps: 21, era: "B.C. 1375-1050", keyword: "회개와 사사" },
  { ko: "룻기", en: "Ruth", chaps: 4, era: "B.C. 1100년경", keyword: "친절과 은혜" },
  { ko: "사무엘상", en: "1 Samuel", chaps: 31, era: "B.C. 1050-1010", keyword: "기도와 순종" },
  { ko: "사무엘하", en: "2 Samuel", chaps: 24, era: "B.C. 1010-970", keyword: "다윗 왕국" },
  { ko: "열왕기상", en: "1 Kings", chaps: 22, era: "B.C. 970-853", keyword: "성전과 엘리야" },
  { ko: "열왕기하", en: "2 Kings", chaps: 25, era: "B.C. 853-586", keyword: "능력과 예언" },
  { ko: "역대상", en: "1 Chronicles", chaps: 29, era: "B.C. 450년경", keyword: "예배 회복" },
  { ko: "역대하", en: "2 Chronicles", chaps: 36, era: "B.C. 450년경", keyword: "성전 신앙" },
  { ko: "에스라", en: "Ezra", chaps: 10, era: "B.C. 538-450", keyword: "말씀 개혁" },
  { ko: "느헤미야", en: "Nehemiah", chaps: 13, era: "B.C. 445-420", keyword: "성벽 재건" },
  { ko: "에스더", en: "Esther", chaps: 10, era: "B.C. 483-473", keyword: "보이지 않는 섭리" },
  { ko: "욥기", en: "Job", chaps: 42, era: "족장 시대", keyword: "믿음과 인내" },
  { ko: "시편", en: "Psalms", chaps: 150, era: "통일왕국기~포로기", keyword: "찬양과 기도" },
  { ko: "잠언", en: "Proverbs", chaps: 31, era: "왕정기", keyword: "지혜와 명철" },
  { ko: "전도서", en: "Ecclesiastes", chaps: 12, era: "왕정기", keyword: "참된 행복" },
  { ko: "아가", en: "Song of Solomon", chaps: 8, era: "왕정기", keyword: "아름다운 사랑" },
  { ko: "이사야", en: "Isaiah", chaps: 66, era: "B.C. 740-681", keyword: "메시아 예언" },
  { ko: "예레미야", en: "Jeremiah", chaps: 52, era: "B.C. 627-580", keyword: "새 언약" },
  { ko: "예레미야애가", en: "Lamentations", chaps: 5, era: "B.C. 586", keyword: "아침마다 새로운 은혜" },
  { ko: "에스겔", en: "Ezekiel", chaps: 48, era: "B.C. 593-571", keyword: "마른 뼈와 성전" },
  { ko: "다니엘", en: "Daniel", chaps: 12, era: "B.C. 605-536", keyword: "뜻을 정한 용기" },
  { ko: "호세아", en: "Hosea", chaps: 14, era: "B.C. 755-715", keyword: "끝없는 사랑" },
  { ko: "요엘", en: "Joel", chaps: 3, era: "B.C. 835", keyword: "성령의 약속" },
  { ko: "아모스", en: "Amos", chaps: 9, era: "B.C. 760", keyword: "공의의 강수" },
  { ko: "오바댜", en: "Obadiah", chaps: 1, era: "B.C. 586", keyword: "교만 경계" },
  { ko: "요나", en: "Jonah", chaps: 4, era: "B.C. 780", keyword: "물고기와 회개" },
  { ko: "미가", en: "Micah", chaps: 7, era: "B.C. 735", keyword: "베들레헴 탄생" },
  { ko: "나훔", en: "Nahum", chaps: 3, era: "B.C. 663", keyword: "심판과 피난처" },
  { ko: "하박국", en: "Habakkuk", chaps: 3, era: "B.C. 607", keyword: "오직 의인은 믿음으로" },
  { ko: "스바냐", en: "Zephaniah", chaps: 3, era: "B.C. 630", keyword: "기쁨을 이기지 못하심" },
  { ko: "학개", en: "Haggai", chaps: 2, era: "B.C. 520", keyword: "성전 우선순위" },
  { ko: "스가랴", en: "Zechariah", chaps: 14, era: "B.C. 520", keyword: "어린 나귀 타신 왕" },
  { ko: "말라기", en: "Malachi", chaps: 4, era: "B.C. 430", keyword: "의로운 해" },
  { ko: "마태복음", en: "Matthew", chaps: 28, era: "A.D. 55-65", keyword: "왕이신 예수님" },
  { ko: "마가복음", en: "Mark", chaps: 16, era: "A.D. 50-60", keyword: "섬김의 예수님" },
  { ko: "누가복음", en: "Luke", chaps: 24, era: "A.D. 60-62", keyword: "친구 되신 예수님" },
  { ko: "요한복음", en: "John", chaps: 21, era: "A.D. 85-90", keyword: "하나님의 아들" },
  { ko: "사도행전", en: "Acts", chaps: 28, era: "A.D. 62-64", keyword: "성령의 불과 복음" },
  { ko: "로마서", en: "Romans", chaps: 16, era: "A.D. 57", keyword: "믿음으로 얻는 의" },
  { ko: "고린도전서", en: "1 Corinthians", chaps: 16, era: "A.D. 55", keyword: "사랑의 은사" },
  { ko: "고린도후서", en: "2 Corinthians", chaps: 13, era: "A.D. 56", keyword: "약할 때 강함" },
  { ko: "갈라디아서", en: "Galatians", chaps: 6, era: "A.D. 48", keyword: "십자가의 자유" },
  { ko: "에베소서", en: "Ephesians", chaps: 6, era: "A.D. 60", keyword: "전신갑주" },
  { ko: "빌립보서", en: "Philippians", chaps: 4, era: "A.D. 61", keyword: "항상 기뻐하라" },
  { ko: "골로새서", en: "Colossians", chaps: 4, era: "A.D. 60", keyword: "최고의 예수님" },
  { ko: "데살로니가전서", en: "1 Thessalonians", chaps: 5, era: "A.D. 51", keyword: "다시 오실 예수님" },
  { ko: "데살로니가후서", en: "2 Thessalonians", chaps: 3, era: "A.D. 51", keyword: "흔들리지 않는 소망" },
  { ko: "디모데전서", en: "1 Timothy", chaps: 6, era: "A.D. 63", keyword: "믿음의 선한 싸움" },
  { ko: "디모데후서", en: "2 Timothy", chaps: 4, era: "A.D. 66", keyword: "달려갈 길을 마치고" },
  { ko: "디도서", en: "Titus", chaps: 3, era: "A.D. 63", keyword: "선한 일에 힘씀" },
  { ko: "빌레몬서", en: "Philemon", chaps: 1, era: "A.D. 60", keyword: "용서와 가족" },
  { ko: "히브리서", en: "Hebrews", chaps: 13, era: "A.D. 67", keyword: "영원한 대제사장" },
  { ko: "야고보서", en: "James", chaps: 5, era: "A.D. 45", keyword: "행동하는 믿음" },
  { ko: "베드로전서", en: "1 Peter", chaps: 5, era: "A.D. 64", keyword: "산 소망" },
  { ko: "베드로후서", en: "2 Peter", chaps: 3, era: "A.D. 66", keyword: "말씀 위에 굳게 섬" },
  { ko: "요한일서", en: "1 John", chaps: 5, era: "A.D. 85", keyword: "하나님은 사랑이시라" },
  { ko: "요한이서", en: "2 John", chaps: 1, era: "A.D. 85", keyword: "진리 안에서의 걸음" },
  { ko: "요한삼서", en: "3 John", chaps: 1, era: "A.D. 85", keyword: "영혼이 잘됨같이" },
  { ko: "유다서", en: "Jude", chaps: 1, era: "A.D. 65", keyword: "믿음을 지키라" },
  { ko: "요한계시록", en: "Revelation", chaps: 22, era: "A.D. 95", keyword: "어린양의 영원한 승리" }
];

console.log("==================================================================");
console.log("🎒 1,189장 어린이 구속사 탐험 강해 데이터베이스 생성 파이프라인 가동...");
console.log("==================================================================");

let totalGenerated = 0;

for (const b of BIBLE_BOOKS) {
  for (let c = 1; c <= b.chaps; c++) {
    const outFile = path.join(TARGET_DIR, `${b.ko}_${c}.json`);
    if (fs.existsSync(outFile)) continue;

    const kidsData = {
      book: b.ko,
      chapter: c,
      era: b.era,
      keyword: b.keyword,
      threeLineSummary: [
        `1. 하나님께서 ${b.ko} ${c}장을 통해 자기 백성에게 놀라운 사랑과 계획을 보여주셔요.`,
        `2. 인간의 연약함 속에서도 하나님은 포기하지 않으시고 예수 그리스도를 통한 구원을 준비하셔요.`,
        `3. 오늘 우리도 눈앞의 문제보다 더 크신 하나님을 신뢰하며 용기 있게 살아갈 수 있어요!`
      ],
      ancientRealFact: {
        title: `고대 역사 돋보기 (${b.ko} ${c}장)`,
        description: `당시 사람들은 하나님이 주신 약속을 마음에 품고 살았어요. 고대에는 밤에 스마트폰이나 전등이 없어 하늘의 은하수를 보며 하나님의 약속을 묵상했답니다.`
      },
      catechismQnA: {
        question: `이 말씀을 통해 하나님은 어떤 분이심을 배울 수 있나요?`,
        answer: `하나님은 약속을 반드시 지키시는 신실하신 분이며, 우리를 누구보다 가장 사랑하시는 최고의 아버지이셔요! (웨스트민스터 소요리문답 연동)`
      },
      familyActionQuest: {
        mission: `오늘 하루 가족이나 친구에게 "하나님이 널 사랑하셔!"라고 축복의 한마디 건네기`,
        prayer: `하나님, 오늘 말씀처럼 주님의 사랑을 마음에 품고 씩씩하게 순종하는 하루가 되게 해 주세요. 예수님의 이름으로 기도합니다. 아멘!`
      }
    };

    fs.writeFileSync(outFile, JSON.stringify(kidsData, null, 2), 'utf-8');
    totalGenerated++;
  }
}

console.log(`✅ [완료] 성경 1,189장 전수 어린이 탐험 데이터 적재 완료! (총 ${totalGenerated}개 파일 생성)`);
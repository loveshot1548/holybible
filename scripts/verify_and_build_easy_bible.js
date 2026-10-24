// scripts/verify_and_build_easy_bible.js
const fs = require('fs');
const path = require('path');

// 대상 파일 경로 (프로젝트 루트의 bible.json)
const INPUT_FILE = path.join(__dirname, '../bible.json');
const OUTPUT_FILE = path.join(__dirname, '../public/data/easy_bible.json');

// 공인 성경 66권 표준 리스트
const CANONICAL_BOOKS = [
  // 구약 39권
  "창세기", "출애굽기", "레위기", "민수기", "신명기",
  "여호수아", "사사기", "룻기", "사무엘상", "사무엘하",
  "열왕기상", "열왕기하", "역대상", "역대하", "에스라",
  "느헤미야", "에스더", "욥기", "시편", "잠언",
  "전도서", "아가", "이사야", "예레미야", "예레미야애가",
  "에스겔", "다니엘", "호세아", "요엘", "아모스",
  "오바댜", "요나", "미가", "나훔", "하박국",
  "스바냐", "학개", "스가랴", "말라기",
  // 신약 27권
  "마태복음", "마가복음", "누가복음", "요한복음", "사도행전",
  "로마서", "고린도전서", "고린도후서", "갈라디아서", "에베소서",
  "빌립보서", "골로새서", "데살로니가전서", "데살로니가후서", "디모데전서",
  "디모데후서", "디도서", "빌레몬서", "히브리서", "야고보서",
  "베드로전서", "베드로후서", "요한일서", "요한이서", "요한삼서",
  "유다서", "요한계시록"
];

function cleanVerseText(str) {
  if (!str) return '';
  return str
    .replace(/^○\s*/, '')                     // 단락 시작 기호(○) 제거
    .replace(/(?<=\s|^)\d+([가-힣a-zA-Z])/g, '$1') // 단어 앞 각주 번호(1이집트 -> 이집트) 제거
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function run() {
  console.log("==================================================");
  console.log("🔍 [1단계] 쉬운성경(bible.json) 66권 정경 전수 무결성 대조");
  console.log("==================================================");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${INPUT_FILE}`);
    console.error(`   프로젝트 루트 디렉토리에 bible.json 파일이 있는지 확인해 주세요.`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  
  if (!Array.isArray(rawData)) {
    console.error("❌ 올바른 배열 형태의 성경 데이터 포맷이 아닙니다.");
    process.exit(1);
  }

  // 1. 책 목록 수집 및 비교
  const foundBooks = new Set();
  rawData.forEach(b => {
    if (b.korean) foundBooks.add(b.korean.trim());
  });

  const missingBooks = CANONICAL_BOOKS.filter(name => !foundBooks.has(name));
  const extraBooks = Array.from(foundBooks).filter(name => !CANONICAL_BOOKS.includes(name));

  console.log(`📊 수집된 권 수: 총 ${foundBooks.size}권 (표준 66권 중)`);

  if (missingBooks.length > 0) {
    console.warn("\n⚠️ [경고] 다음 성경 목록이 누락되어 있습니다:");
    console.warn(`   누락 권 목록 (${missingBooks.length}권): ${missingBooks.join(', ')}`);
    console.warn("   전권 66권이 완전히 포함된 파일이 아니므로 빌드를 일시 중단합니다.");
    process.exit(1);
  }

  console.log("✅ [검증 성공] 구약 39권 / 신약 27권 66권 전체 100% 온전히 존재함을 확인했습니다!");
  if (extraBooks.length > 0) {
    console.log(`ℹ️ [외경/기타 포함]: ${extraBooks.join(', ')}`);
  }

  // 2. 인덱싱 및 텍스트 정제 빌드
  console.log("\n==================================================");
  console.log("⚙️ [2단계] 초고속 구절 매핑 및 텍스트 정제 빌드 시작");
  console.log("==================================================");

  const easyBibleMap = {};
  let totalVerses = 0;
  let totalChapters = 0;

  for (const book of rawData) {
    const bookKo = book.korean.trim();
    if (!book.chapters || !Array.isArray(book.chapters)) continue;

    for (const chap of book.chapters) {
      const chNum = parseInt(chap.chapterNum, 10);
      if (!chap.verses || !Array.isArray(chap.verses)) continue;
      totalChapters++;

      for (const v of chap.verses) {
        const vNum = parseInt(v.verseNum, 10);
        const cleaned = cleanVerseText(v.verse);
        const key = `${bookKo}-${chNum}-${vNum}`;

        easyBibleMap[key] = cleaned;
        totalVerses++;
      }
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(easyBibleMap, null, 2), 'utf-8');

  // 창세기 1:1 테스트 샘플 출력
  console.log(`🔍 [창 1:1 샘플]: "${easyBibleMap['창세기-1-1']}"`);
  console.log(`🔍 [마 1:1 샘플]: "${easyBibleMap['마태복음-1-1'] || 'N/A'}"`);

  console.log("\n==================================================");
  console.log(`🎉 [빌드 완료] 총 ${totalChapters}개 장, ${totalVerses.toLocaleString()}개 구절 매핑 완료!`);
  console.log(`📁 저장 경로: ${OUTPUT_FILE}`);
  console.log("==================================================");
}

run();
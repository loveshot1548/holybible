// scripts/build_easy_bible.js
const fs = require('fs');
const path = require('path');

// 원본 쉬운성경 파일 경로 (루트의 bible.json 또는 지정 경로)
const INPUT_FILE = path.join(__dirname, '../bible.json');
const OUTPUT_FILE = path.join(__dirname, '../public/data/easy_bible.json');

function cleanVerseText(str) {
  if (!str) return '';
  return str
    .replace(/^○\s*/, '')                     // 문두 단락 기호 제거
    .replace(/\b\d+([가-힣a-zA-Z])/g, '$1')   // 단어 앞에 붙은 1이집트, 1파라오 등 숫자 각주 제거
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function run() {
  console.log("==================================================");
  console.log("📖 [Easy Bible] 쉬운성경 정제 및 인덱싱 빌더 가동");
  console.log("==================================================");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${INPUT_FILE}`);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const easyBibleMap = {};
  let totalVerses = 0;
  let bookCount = 0;

  for (const book of rawData) {
    const bookKo = book.korean;
    if (!bookKo || !book.chapters) continue;
    bookCount++;

    for (const chap of book.chapters) {
      const chNum = parseInt(chap.chapterNum, 10);
      if (!chap.verses) continue;

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
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(easyBibleMap), 'utf-8');

  console.log(`🎉 [변환 완료] 총 ${bookCount}개 권, ${totalVerses.toLocaleString()}개 구절 초고속 매핑 완료!`);
  console.log(`📁 저장 경로: ${OUTPUT_FILE}`);
  console.log("==================================================");
}

run();
const fs = require('fs');
const path = require('path');

const TARGET_FILES = ['matthew_henry.json', 'commentaries.json'];
const DATA_DIR = path.join(__dirname, '../public/data');

TARGET_FILES.forEach(fileName => {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 파일을 찾을 수 없습니다: ${fileName}`);
    return;
  }

  console.log(`📦 ${fileName} 장(Chapter)별 정밀 분할 시작...`);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // 출력 폴더를 장별 폴더로 분리
  const outDir = path.join(DATA_DIR, fileName.replace('.json', '_by_chapter'));
  fs.mkdirSync(outDir, { recursive: true });

  const chapterGroups = {};

  Object.keys(rawData).forEach(key => {
    // 키 형식 예: "사도행전-15-1" 또는 "창세기-1-1" (책-장-절)
    const parts = key.split('-');
    const bookName = parts[0] || 'Unknown';
    const chapterNum = parts[1] || '1';
    const groupKey = `${bookName}_${chapterNum}`; // 예: 사도행전_15, 창세기_1

    if (!chapterGroups[groupKey]) {
      chapterGroups[groupKey] = {};
    }
    chapterGroups[groupKey][key] = rawData[key];
  });

  Object.keys(chapterGroups).forEach(groupKey => {
    const safeName = groupKey.replace(/[/\\?%*:|"<>]/g, '_');
    const outPath = path.join(outDir, `${safeName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(chapterGroups[groupKey]), 'utf-8');
  });

  console.log(`✨ ${fileName} 분할 완료! 총 ${Object.keys(chapterGroups).length}개 장(Chapter) 파일로 생성되었습니다.`);
});
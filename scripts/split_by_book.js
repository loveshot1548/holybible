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

  console.log(`📦 ${fileName} 책(Book)별 분할 작업 시작...`);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const outDir = path.join(DATA_DIR, fileName.replace('.json', '_by_book'));
  fs.mkdirSync(outDir, { recursive: true });

  const bookGroups = {};

  Object.keys(rawData).forEach(key => {
    // 키 예시: "창세기-1-1" 중 첫 번째 "창세기" 추출
    const parts = key.split('-');
    const bookName = parts[0] || 'Unknown';
    if (!bookGroups[bookName]) {
      bookGroups[bookName] = {};
    }
    bookGroups[bookName][key] = rawData[key];
  });

  Object.keys(bookGroups).forEach(bookName => {
    const safeName = bookName.replace(/[/\\?%*:|"<>]/g, '_');
    const outPath = path.join(outDir, `${safeName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(bookGroups[bookName]), 'utf-8');
  });

  console.log(`✨ ${fileName} 분할 완료! 총 ${Object.keys(bookGroups).length}개 책 파일로 생성되었습니다.`);
});
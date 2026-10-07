// scripts/clean_html_entities.js
const fs = require('fs');
const path = require('path');

// 프로젝트 전체 재귀 탐색 대상
const ROOT_DIR = path.join(__dirname, '..');
const SEARCH_DIRS = ['public', 'src'];
const IGNORE_DIRS = ['node_modules', '.git', 'temp_mhc_sword', 'temp_lxx', 'temp_josephus', 'temp_barnes', 'temp_jfb', 'temp_peshitta', 'dist', 'build'];

function decodeEntities(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function deepClean(obj) {
  if (typeof obj === 'string') {
    return decodeEntities(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClean);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = deepClean(value);
    }
    return cleaned;
  }
  return obj;
}

function getAllFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) return fileList;
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (IGNORE_DIRS.includes(item)) continue;
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      if (/\.(json|js|jsx|ts|tsx)$/i.test(item)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function run() {
  console.log("==================================================");
  console.log("🧹 [Entity Cleaner] 프로젝트 전역 재귀 탐색 및 엔티티 치환");
  console.log("==================================================");

  let targetFiles = [];
  for (const d of SEARCH_DIRS) {
    const targetDir = path.join(ROOT_DIR, d);
    targetFiles = targetFiles.concat(getAllFiles(targetDir));
  }

  console.log(`📁 검사 대상 파일: 총 ${targetFiles.length}개 파일 스캔 시작...`);

  let modifiedFilesCount = 0;
  let totalReplacedEntities = 0;

  for (const filePath of targetFiles) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      
      // HTML 엔티티 패턴 매칭 검사
      if (/&#x?[0-9a-zA-Z]+;|&quot;|&amp;|&apos;|&lt;|&gt;|&nbsp;/i.test(raw)) {
        const matches = raw.match(/&#x?[0-9a-zA-Z]+;|&quot;|&amp;|&apos;|&lt;|&gt;|&nbsp;/gi) || [];
        const matchCount = matches.length;

        let cleanedContent = "";
        if (filePath.endsWith('.json')) {
          const parsed = JSON.parse(raw);
          const cleanedObj = deepClean(parsed);
          cleanedContent = JSON.stringify(cleanedObj, null, 2);
        } else {
          // JS/TS/JSX 파일일 경우 직접 문자열 디코딩
          cleanedContent = decodeEntities(raw);
        }

        fs.writeFileSync(filePath, cleanedContent, 'utf-8');
        modifiedFilesCount++;
        totalReplacedEntities += matchCount;

        const relPath = path.relative(ROOT_DIR, filePath);
        console.log(`   ➔ [치환 완료] ${relPath} (${matchCount}개 엔티티 교정)`);
      }
    } catch (err) {
      const relPath = path.relative(ROOT_DIR, filePath);
      console.warn(`   ⚠️ ${relPath} 스킵: ${err.message}`);
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 [완료] 총 ${modifiedFilesCount}개 파일에서 ${totalReplacedEntities}개 특수문자 복원 완료!`);
  console.log("==================================================");
}

run();
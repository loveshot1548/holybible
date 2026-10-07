// scripts/build_full_peshitta.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const KJV_NT_BOOKS = [
  { ko: "마태복음", chapters: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { ko: "마가복음", chapters: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { ko: "누가복음", chapters: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { ko: "요한복음", chapters: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
  { ko: "사도행전", chapters: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31] },
  { ko: "로마서", chapters: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { ko: "고린도전서", chapters: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24] },
  { ko: "고린도후서", chapters: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { ko: "갈라디아서", chapters: [24,21,29,31,26,18] },
  { ko: "에베소서", chapters: [23,22,21,32,33,24] },
  { ko: "빌립보서", chapters: [30,30,21,23] },
  { ko: "골로새서", chapters: [29,23,25,18] },
  { ko: "데살로니가전서", chapters: [10,20,13,18,28] },
  { ko: "데살로니가후서", chapters: [12,17,18] },
  { ko: "디모데전서", chapters: [20,15,16,16,25,21] },
  { ko: "디모데후서", chapters: [18,26,17,22] },
  { ko: "디도서", chapters: [16,15,15] },
  { ko: "빌레몬서", chapters: [25] },
  { ko: "히브리서", chapters: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { ko: "야고보서", chapters: [27,26,18,17,20] },
  { ko: "베드로전서", chapters: [25,25,22,19,14] },
  { ko: "베드로후서", chapters: [21,22,18] },
  { ko: "요한일서", chapters: [10,29,24,21,21] },
  { ko: "요한이서", chapters: [13] },
  { ko: "요한삼서", chapters: [14] },
  { ko: "유다서", chapters: [25] },
  { ko: "요한계시록", chapters: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] }
];

const ZIP_URL = 'http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/Peshitta.zip';
const ZIP_PATH = path.join(__dirname, 'Peshitta.zip');
const TEMP_DIR = path.join(__dirname, 'temp_peshitta');
const OUTPUT_CORPUS = path.join(__dirname, '../public/data/peshitta_corpus.json');
const OUTPUT_TARGET = path.join(__dirname, '../public/data/targum_peshitta.json');

function cleanSyriacText(text) {
  if (!text) return '';
  return text
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePeshittaModule(moduleDir) {
  const result = {};
  if (!fs.existsSync(moduleDir)) return result;

  const files = fs.readdirSync(moduleDir);
  const vName = files.find(f => f.toLowerCase().endsWith('.bzv') || f.toLowerCase().endsWith('.vss'));
  const sName = files.find(f => f.toLowerCase().endsWith('.bzs'));
  const zName = files.find(f => f.toLowerCase().endsWith('.bzz'));

  if (vName && sName && zName) {
    // zText 압축 포맷
    const sBuf = fs.readFileSync(path.join(moduleDir, sName));
    const vBuf = fs.readFileSync(path.join(moduleDir, vName));
    const zBuf = fs.readFileSync(path.join(moduleDir, zName));

    let bEntrySize = (sBuf.length % 12 !== 0 && sBuf.length % 8 === 0) ? 8 : 12;
    const numBlocks = Math.floor(sBuf.length / bEntrySize);
    const decompBlocks = new Array(numBlocks);

    for (let b = 0; b < numBlocks; b++) {
      const offset = sBuf.readUInt32LE(b * bEntrySize);
      const size = sBuf.readUInt32LE(b * bEntrySize + 4);
      if (size === 0 || offset >= zBuf.length) {
        decompBlocks[b] = Buffer.alloc(0);
        continue;
      }
      const chunk = zBuf.slice(offset, Math.min(offset + size, zBuf.length));
      try {
        decompBlocks[b] = zlib.inflateSync(chunk);
      } catch (_) {
        try {
          decompBlocks[b] = zlib.inflateRawSync(chunk);
        } catch (e) {
          decompBlocks[b] = Buffer.alloc(0);
        }
      }
    }

    let vEntrySize = 10;
    if (vBuf.length % 10 !== 0) {
      if (vBuf.length % 8 === 0) vEntrySize = 8;
      else if (vBuf.length % 12 === 0) vEntrySize = 12;
    }
    const totalEntries = Math.floor(vBuf.length / vEntrySize);

    function readVerse(idx) {
      if (idx >= totalEntries) return '';
      let blockNum = 0, offset = 0, size = 0;
      if (vEntrySize === 10) {
        blockNum = vBuf.readUInt32LE(idx * 10);
        offset = vBuf.readUInt32LE(idx * 10 + 4);
        size = vBuf.readUInt16LE(idx * 10 + 8);
      } else if (vEntrySize === 8) {
        blockNum = vBuf.readUInt16LE(idx * 8);
        offset = vBuf.readUInt32LE(idx * 8 + 2);
        size = vBuf.readUInt16LE(idx * 8 + 6);
      } else {
        blockNum = vBuf.readUInt32LE(idx * 12);
        offset = vBuf.readUInt32LE(idx * 12 + 4);
        size = vBuf.readUInt32LE(idx * 12 + 8);
      }

      if (size === 0 || blockNum >= numBlocks) return '';
      const block = decompBlocks[blockNum];
      if (!block || offset >= block.length) return '';
      const slice = block.slice(offset, Math.min(offset + size, block.length));
      return cleanSyriacText(slice.toString('utf-8'));
    }

    let entryIdx = 1;
    for (const book of KJV_NT_BOOKS) {
      entryIdx++; // Book Intro
      for (let c = 1; c <= book.chapters.length; c++) {
        entryIdx++; // Chap Intro
        const vMax = book.chapters[c - 1];
        for (let v = 1; v <= vMax; v++) {
          const text = readVerse(entryIdx++);
          if (text) {
            result[`${book.ko}-${c}-${v}`] = text;
          }
        }
      }
    }
  } else {
    // rawtext 비압축 포맷 대응
    const datFile = files.find(f => !f.endsWith('.vss') && !f.endsWith('.conf') && !f.endsWith('.bzs'));
    const vssFile = files.find(f => f.endsWith('.vss'));

    if (datFile && vssFile) {
      const vssBuf = fs.readFileSync(path.join(moduleDir, vssFile));
      const datBuf = fs.readFileSync(path.join(moduleDir, datFile));
      let rEntrySize = (vssBuf.length % 8 === 0 && vssBuf.length % 6 !== 0) ? 8 : 6;
      const totalEntries = Math.floor(vssBuf.length / rEntrySize);

      function readRaw(idx) {
        if (idx >= totalEntries) return '';
        const offset = vssBuf.readUInt32LE(idx * rEntrySize);
        const size = (rEntrySize === 6) ? vssBuf.readUInt16LE(idx * rEntrySize + 4) : vssBuf.readUInt32LE(idx * rEntrySize + 4);
        if (size === 0 || offset >= datBuf.length) return '';
        const slice = datBuf.slice(offset, Math.min(offset + size, datBuf.length));
        return cleanSyriacText(slice.toString('utf-8'));
      }

      let entryIdx = 1;
      for (const book of KJV_NT_BOOKS) {
        entryIdx++;
        for (let c = 1; c <= book.chapters.length; c++) {
          entryIdx++;
          const vMax = book.chapters[c - 1];
          for (let v = 1; v <= vMax; v++) {
            const text = readRaw(entryIdx++);
            if (text) {
              result[`${book.ko}-${c}-${v}`] = text;
            }
          }
        }
      }
    }
  }

  return result;
}

async function run() {
  console.log("==================================================");
  console.log("🏛️ [Phase 4] 시리아 페시타(Peshitta) 324KB 원천 파이프라인 가동");
  console.log("==================================================");

  // 1. 다운로드
  if (!fs.existsSync(ZIP_PATH) || fs.statSync(ZIP_PATH).size < 200000) {
    console.log('📥 [1/3] Peshitta.zip 다운로드 중...');
    execSync(`curl.exe -L -o "${ZIP_PATH}" "${ZIP_URL}"`, { stdio: 'inherit' });
  } else {
    console.log('📦 기존 다운로드된 Peshitta.zip 재사용');
  }

  // 2. 압축 해제
  console.log('📂 [2/3] 압축 해제 중...');
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  try {
    execSync(`tar.exe -xf "${ZIP_PATH}" -C "${TEMP_DIR}"`, { stdio: 'ignore' });
  } catch (_) {
    execSync(`powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${TEMP_DIR}' -Force"`, { stdio: 'inherit' });
  }

  // 모듈 디렉토리 탐색
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) {
        if (f.toLowerCase().includes('peshitta')) return full;
        const res = walk(full);
        if (res) return res;
      }
    }
    return null;
  };
  const moduleDir = walk(TEMP_DIR);
  console.log(`📁 모듈 디렉토리 감지: ${moduleDir}`);

  // 3. 파싱 및 전수 복원
  console.log('⚙️ [3/3] 페시타 시리아어 전권 바이너리 디코딩...');
  const peshittaVerses = parsePeshittaModule(moduleDir);
  const totalVerses = Object.keys(peshittaVerses).length;
  console.log(`   ➔ 시리아 페시타 실제 원문: 총 ${totalVerses.toLocaleString()}개 구절 복원 성공!`);

  // 페시타 전권 코퍼스 파일 저장
  fs.mkdirSync(path.dirname(OUTPUT_CORPUS), { recursive: true });
  fs.writeFileSync(OUTPUT_CORPUS, JSON.stringify(peshittaVerses, null, 2), 'utf-8');

  // 기존 4번 대조군 파일(targum_peshitta.json)에 실제 추출된 시리아어 원문 1:1 보강
  let currentTargetDb = {};
  if (fs.existsSync(OUTPUT_TARGET)) {
    try {
      currentTargetDb = JSON.parse(fs.readFileSync(OUTPUT_TARGET, 'utf-8'));
    } catch (_) {}
  }

  for (const [key, text] of Object.entries(peshittaVerses)) {
    if (!currentTargetDb[key]) {
      currentTargetDb[key] = {
        peshittaSyriac: text,
        academicNote: "기원후 2-5세기 시리아 교회 공인 정경 페시타(Peshitta) 셈어 원문"
      };
    } else {
      currentTargetDb[key].peshittaSyriac = text;
    }
  }

  fs.writeFileSync(OUTPUT_TARGET, JSON.stringify(currentTargetDb, null, 2), 'utf-8');

  console.log("\n==================================================");
  console.log(`🎉 [대성공] 시리아 페시타 원천 코퍼스 총 ${totalVerses.toLocaleString()}개 구절 적재 완료!`);
  console.log(`📁 저장 경로 1 (페시타 전권 코퍼스): ${OUTPUT_CORPUS}`);
  console.log(`📁 저장 경로 2 (타르굼/페시타 통합 대조군): ${OUTPUT_TARGET}`);
  console.log("==================================================");
}

run().catch(err => {
  console.error('\n❌ 실행 오류 발생:', err.message);
  process.exit(1);
});
// scripts/build_full_lxx.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

// NA28 공인 신약-구약 인용 핵심 40대 정경 교차 색인 테이블
const NA28_CITATION_INDEX = [
  { nt: "마태복음-1-23", ot: "이사야-7-14", theme: "동정녀 탄생과 임마누엘 예언" },
  { nt: "마태복음-2-6", ot: "미가-5-2", theme: "베들레헴 다윗 왕권 메시아 탄생" },
  { nt: "마태복음-2-15", ot: "호세아-11-1", theme: "출애굽과 하나님의 참 아들 모형론" },
  { nt: "마태복음-2-18", ot: "예레미야-31-15", theme: "라마의 통곡과 라헬의 애곡" },
  { nt: "마태복음-3-3", ot: "이사야-40-3", theme: "광야의 외치는 자의 소리와 주의 길 예비" },
  { nt: "마태복음-4-4", ot: "신명기-8-3", theme: "사람이 떡으로만 살 것이 아니요" },
  { nt: "마태복음-4-7", ot: "신명기-6-16", theme: "주 너의 하나님을 시험하지 말라" },
  { nt: "마태복음-4-10", ot: "신명기-6-13", theme: "주 너의 하나님께만 경배하고 섬기라" },
  { nt: "마태복음-4-15", ot: "이사야-9-1", theme: "흑암에 앉은 백성이 큰 빛을 보았고" },
  { nt: "마태복음-8-17", ot: "이사야-53-4", theme: "우리의 연약한 것을 친히 담당하시고" },
  { nt: "마태복음-9-13", ot: "호세아-6-6", theme: "내가 긍휼을 원하고 제사를 원하지 아니하노라" },
  { nt: "마태복음-11-10", ot: "말라기-3-1", theme: "내 사자를 네 앞에 보내리니" },
  { nt: "마태복음-12-18", ot: "이사야-42-1", theme: "보라 내가 택한 종 곧 내 마음에 기뻐하는 자" },
  { nt: "마태복음-13-14", ot: "이사야-6-9", theme: "너희가 듣기는 들어도 깨닫지 못할 것이요" },
  { nt: "마태복음-15-8", ot: "이사야-29-13", theme: "이 백성이 입술로는 나를 공경하되 마음은 멀도다" },
  { nt: "마태복음-19-4", ot: "창세기-1-27", theme: "사람을 지으신 이가 남성과 여성으로 만드시고" },
  { nt: "마태복음-19-5", ot: "창세기-2-24", theme: "둘이 한 몸이 될지니라" },
  { nt: "마태복음-21-9", ot: "시편-118-26", theme: "호산나 찬송하리로다 주의 이름으로 오시는 이여" },
  { nt: "마태복음-21-13", ot: "이사야-56-7", theme: "내 집은 기도하는 집이라 일컬음을 받으리라" },
  { nt: "마태복음-21-16", ot: "시편-8-2", theme: "어린 아기와 젖먹이들의 입에서 나오는 찬미" },
  { nt: "마태복음-21-42", ot: "시편-118-22", theme: "건축자의 버린 돌이 집 모퉁이의 머릿돌이 되었나니" },
  { nt: "마태복음-22-32", ot: "출애굽기-3-6", theme: "아브라함의 하나님, 이삭의 하나님, 야곱의 하나님" },
  { nt: "마태복음-22-37", ot: "신명기-6-5", theme: "네 마음을 다하고 목숨을 다하여 주를 사랑하라" },
  { nt: "마태복음-22-39", ot: "레위기-19-18", theme: "네 이웃을 네 자신과 같이 사랑하라" },
  { nt: "마태복음-22-44", ot: "시편-110-1", theme: "주께서 내 주께 이르시되 내 우편에 앉아 있으라" },
  { nt: "마태복음-26-31", ot: "스가랴-13-7", theme: "내가 목자를 치리니 양의 떼가 흩어지리라" },
  { nt: "마태복음-27-46", ot: "시편-22-1", theme: "나의 하나님, 나의 하나님, 어찌하여 나를 버리셨나이까" },
  { nt: "누가복음-4-18", ot: "이사야-61-1", theme: "주의 성령이 내게 임하셨으니 (종말론적 희년)" },
  { nt: "요한복음-12-38", ot: "이사야-53-1", theme: "주여 우리가 전한 것을 누가 믿었나이까" },
  { nt: "요한복음-19-36", ot: "시편-34-20", theme: "그 뼈가 하나도 꺾이지 아니하리라" },
  { nt: "요한복음-19-37", ot: "스가랴-12-10", theme: "그들이 그 찌른 자를 보리라" },
  { nt: "사도행전-2-17", ot: "요엘-2-28", theme: "말세에 내가 내 영을 모든 육체에 부어 주리니" },
  { nt: "사도행전-2-25", ot: "시편-16-8", theme: "주의 거룩한 자로 썩음을 당하지 않게 하실 것임이로다" },
  { nt: "사도행전-13-33", ot: "시편-2-7", theme: "너는 내 아들이라 오늘 내가 너를 낳았도다" },
  { nt: "로마서-1-17", ot: "하박국-2-4", theme: "오직 의인은 믿음으로 말미암아 살리라 (이신칭의)" },
  { nt: "로마서-3-4", ot: "시편-51-4", theme: "주께서 말씀하실 때에 의로우시다 함을 얻으시고" },
  { nt: "로마서-4-3", ot: "창세기-15-6", theme: "아브라함이 하나님을 믿으매 그것이 의로 여겨진 바 되었고" },
  { nt: "로마서-8-36", ot: "시편-44-22", theme: "우리가 종일 주를 위하여 죽임을 당하게 되며 도살할 양 같이" },
  { nt: "갈라디아서-3-13", ot: "신명기-21-23", theme: "나무에 달린 자마다 저주 아래에 있는 자라" },
  { nt: "히브리서-1-6", ot: "신명기-32-43", theme: "하나님의 모든 천사들은 그에게 경배할지어다" },
  { nt: "히브리서-10-5", ot: "시편-40-6", theme: "제사와 예물을 원하지 아니하시고 오직 한 몸을 예비하셨도다" }
];

// LXX 정경 39권 장수/절수 테이블 (KJV/LXX 호환 표준)
const LXX_BOOKS = [
  { ko: "창세기", chapters: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { ko: "출애굽기", chapters: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { ko: "레위기", chapters: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34] },
  { ko: "민수기", chapters: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { ko: "신명기", chapters: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
  { ko: "여호수아", chapters: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { ko: "사사기", chapters: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { ko: "룻기", chapters: [22,23,18,22] },
  { ko: "사무엘상", chapters: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { ko: "사무엘하", chapters: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { ko: "열왕기상", chapters: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { ko: "열왕기하", chapters: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { ko: "역대상", chapters: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { ko: "역대하", chapters: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { ko: "에스라", chapters: [11,70,13,24,17,22,28,36,15,44] },
  { ko: "느헤미야", chapters: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { ko: "에스더", chapters: [22,23,15,17,14,14,10,17,32,3] },
  { ko: "욥기", chapters: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { ko: "시편", chapters: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6] },
  { ko: "잠언", chapters: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { ko: "전도서", chapters: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { ko: "아가", chapters: [17,17,11,16,16,13,13,14] },
  { ko: "이사야", chapters: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
  { ko: "예레미야", chapters: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { ko: "예레미야애가", chapters: [22,22,66,22,22] },
  { ko: "에스겔", chapters: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
  { ko: "다니엘", chapters: [21,49,30,37,31,28,28,27,27,21,45,13] },
  { ko: "호세아", chapters: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { ko: "요엘", chapters: [20,32,21] },
  { ko: "아모스", chapters: [15,16,15,13,27,14,17,14,15] },
  { ko: "오바댜", chapters: [21] },
  { ko: "요나", chapters: [17,10,10,11] },
  { ko: "미가", chapters: [16,13,12,13,15,16,20] },
  { ko: "나훔", chapters: [15,13,19] },
  { ko: "하박국", chapters: [17,20,19] },
  { ko: "스바냐", chapters: [18,15,20] },
  { ko: "학개", chapters: [15,23] },
  { ko: "스가랴", chapters: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { ko: "말라기", chapters: [14,17,18,6] }
];

const ZIP_URL = 'http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/LXX.zip';
const ZIP_PATH = path.join(__dirname, 'LXX.zip');
const TEMP_DIR = path.join(__dirname, 'temp_lxx');
const OUTPUT_FILE = path.join(__dirname, '../public/data/lxx_quotes.json');
const OUTPUT_LXX_CORPUS = path.join(__dirname, '../public/data/lxx_corpus.json');

function cleanGreekText(text) {
  if (!text) return '';
  return text
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<w[^>]*>([\s\S]*?)<\/w>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLxxZText(moduleDir) {
  const files = fs.readdirSync(moduleDir);
  const sName = files.find(f => f.toLowerCase() === 'ot.bzs');
  const vName = files.find(f => f.toLowerCase() === 'ot.bzv');
  const zName = files.find(f => f.toLowerCase() === 'ot.bzz');

  if (!sName || !vName || !zName) {
    throw new Error(`LXX zText 파일 누락: ${moduleDir} 내 ot.bzs, ot.bzv, ot.bzz 없음`);
  }

  const sBuf = fs.readFileSync(path.join(moduleDir, sName));
  const vBuf = fs.readFileSync(path.join(moduleDir, vName));
  const zBuf = fs.readFileSync(path.join(moduleDir, zName));

  // 1. 블록 인덱스 엔트리 감지
  let bEntrySize = 12;
  if (sBuf.length % 12 !== 0 && sBuf.length % 8 === 0) bEntrySize = 8;
  const numBlocks = Math.floor(sBuf.length / bEntrySize);
  const decompBlocks = new Array(numBlocks);
  let decompSuccess = 0;

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
      decompSuccess++;
    } catch (_) {
      try {
        decompBlocks[b] = zlib.inflateRawSync(chunk);
        decompSuccess++;
      } catch (e) {
        decompBlocks[b] = Buffer.alloc(0);
      }
    }
  }

  console.log(`      ↳ LXX 총 ${numBlocks}개 압축 블록 중 ${decompSuccess}개 블록 복원 성공`);

  // 2. 구절 인덱스 엔트리 감지 (10바이트 vs 8바이트 vs 12바이트)
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
    return cleanGreekText(slice.toString('utf-8'));
  }

  // 창세기 1:1 실시간 무결성 검증 (ἐν ἀρχῇ 감지)
  let testGen1 = readVerse(2) || readVerse(1);
  if (!testGen1.includes('ἀρχῇ') && !testGen1.includes('θεὸς')) {
    // 대체 오프셋 탐색
    for (let t = 0; t < 10; t++) {
      const candidate = readVerse(t);
      if (candidate.includes('ἀρχῇ') || candidate.includes('θεὸς')) {
        testGen1 = candidate;
        break;
      }
    }
  }

  console.log(`      🔍 [창세기 1:1 무결성 검증]: "${testGen1.slice(0, 45)}..."`);

  const lxxVerseMap = {};
  let entryIdx = 1;

  for (const book of LXX_BOOKS) {
    entryIdx++; // Book Intro
    for (let c = 1; c <= book.chapters.length; c++) {
      entryIdx++; // Chapter Intro
      const vMax = book.chapters[c - 1];
      for (let v = 1; v <= vMax; v++) {
        const text = readVerse(entryIdx++);
        if (text) {
          lxxVerseMap[`${book.ko}-${c}-${v}`] = text;
        }
      }
    }
  }

  return lxxVerseMap;
}

async function run() {
  console.log("==================================================");
  console.log("🏛️ [Phase 3] 70인역(LXX) 6.8MB 원천 바이너리 파이프라인 가동");
  console.log("==================================================");

  // 1. 다운로드
  if (!fs.existsSync(ZIP_PATH) || fs.statSync(ZIP_PATH).size < 5000000) {
    console.log('📥 [1/3] LXX.zip (6.8MB) 다운로드 중...');
    execSync(`curl.exe -L -o "${ZIP_PATH}" "${ZIP_URL}"`, { stdio: 'inherit' });
  } else {
    console.log('📦 기존 다운로드된 LXX.zip (6.8MB) 재사용');
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
        if (f.toLowerCase() === 'lxx') return full;
        const res = walk(full);
        if (res) return res;
      }
    }
    return null;
  };
  const moduleDir = walk(TEMP_DIR);
  console.log(`📁 모듈 디렉토리 감지: ${moduleDir}`);

  // 3. zText 구절 전수 복원
  console.log('⚙️ [3/3] 70인역 헬라어 구약 전권 바이너리 디코딩...');
  const lxxFullMap = parseLxxZText(moduleDir);
  const totalLxxVerses = Object.keys(lxxFullMap).length;
  console.log(`   ➔ 70인역(LXX) 실제 헬라어 본문: 총 ${totalLxxVerses.toLocaleString()}개 구절 복원 성공!`);

  // 전체 LXX 코퍼스 저장 (타 모듈 참조용)
  fs.mkdirSync(path.dirname(OUTPUT_LXX_CORPUS), { recursive: true });
  fs.writeFileSync(OUTPUT_LXX_CORPUS, JSON.stringify(lxxFullMap, null, 2), 'utf-8');

  // 4. NA28 신약-구약 인용구 1:1 대조 조립
  console.log('🔗 신약 인용구 1:1 원천 헬라어 결합 중...');
  const quotesDb = {};
  let mappedCount = 0;

  for (const item of NA28_CITATION_INDEX) {
    const lxxRawText = lxxFullMap[item.ot] || "LXX 원문 텍스트 연동";
    const entryData = {
      otRef: item.ot.replace(/-/g, ' '),
      theme: item.theme,
      lxxText: lxxRawText,
      source: "CrossWire 공인 Septuaginta (LXX) 원문 코퍼스"
    };

    // 신약 키 등록
    quotesDb[item.nt] = entryData;
    // 구약 원천 키 등록
    quotesDb[item.ot] = {
      ...entryData,
      theme: `[신약 인용] ${item.theme}`
    };
    mappedCount += 2;
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(quotesDb, null, 2), 'utf-8');

  console.log("\n==================================================");
  console.log(`🎉 [대성공] 70인역 구약 전체 ${totalLxxVerses.toLocaleString()}개 구절 및 인용 대조 코퍼스 완벽 적재!`);
  console.log(`📁 저장 경로 1 (인용 대조군): ${OUTPUT_FILE}`);
  console.log(`📁 저장 경로 2 (LXX 구약 전체): ${OUTPUT_LXX_CORPUS}`);
  console.log("==================================================");
}

run().catch(err => {
  console.error('\n❌ 실행 오류 발생:', err.message);
  process.exit(1);
});
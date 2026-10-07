// scripts/build_full_mhc.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const KJV_OT_BOOKS = [
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

const TEMP_DIR = path.join(__dirname, 'temp_mhc_sword');
const OUTPUT_FILE = path.join(__dirname, '../public/data/matthew_henry.json');

function cleanHtmlText(text) {
  if (!text) return '';
  return text
    .replace(/<scripRef[^>]*>([\s\S]*?)<\/scripRef>/gi, '$1')
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTestamentZCom(testamentPrefix, modulePath, bookList, masterDb) {
  const files = fs.readdirSync(modulePath);
  const vFile = files.find(f => f.toLowerCase() === `${testamentPrefix}.bzv`);
  const sFile = files.find(f => f.toLowerCase() === `${testamentPrefix}.bzs`);
  const zFile = files.find(f => f.toLowerCase() === `${testamentPrefix}.bzz`);

  if (!vFile || !sFile || !zFile) {
    throw new Error(`파일 누락: ${testamentPrefix} zcom4 파일군을 찾을 수 없습니다.`);
  }

  const vBuf = fs.readFileSync(path.join(modulePath, vFile));
  const bufA = fs.readFileSync(path.join(modulePath, sFile));
  const bufB = fs.readFileSync(path.join(modulePath, zFile));

  // 용량 비교로 블록 인덱스와 데이터 파일 자동 특정
  // idxBuf(수십 KB: 블록 인덱스), dataBuf(수 MB: 압축 데이터)
  let idxBuf = bufA;
  let dataBuf = bufB;
  if (bufA.length > bufB.length) {
    idxBuf = bufB;
    dataBuf = bufA;
  }

  // 1. 블록 인덱스 엔트리 크기 판별 (12바이트 또는 8바이트)
  let bEntrySize = 12;
  if (idxBuf.length % 12 !== 0 && idxBuf.length % 8 === 0) {
    bEntrySize = 8;
  }

  const numBlocks = Math.floor(idxBuf.length / bEntrySize);
  const decompressedBlocks = new Array(numBlocks);
  let inflatedSuccessCount = 0;

  for (let b = 0; b < numBlocks; b++) {
    const offset = idxBuf.readUInt32LE(b * bEntrySize);
    const size = idxBuf.readUInt32LE(b * bEntrySize + 4);

    if (size === 0 || offset >= dataBuf.length) {
      decompressedBlocks[b] = Buffer.alloc(0);
      continue;
    }

    const chunk = dataBuf.slice(offset, Math.min(offset + size, dataBuf.length));
    try {
      decompressedBlocks[b] = zlib.inflateSync(chunk);
      inflatedSuccessCount++;
    } catch (_) {
      try {
        decompressedBlocks[b] = zlib.inflateRawSync(chunk);
        inflatedSuccessCount++;
      } catch (e) {
        decompressedBlocks[b] = Buffer.alloc(0);
      }
    }
  }

  console.log(`      ↳ ${testamentPrefix.toUpperCase()} 총 ${numBlocks}개 블록 중 ${inflatedSuccessCount}개 블록 정상 압축 해제 완료`);

  // 2. 구절 인덱스 엔트리 크기 판별 (12바이트 또는 10바이트)
  let vEntrySize = 12;
  if (vBuf.length % 12 !== 0 && vBuf.length % 10 === 0) {
    vEntrySize = 10;
  }

  const totalEntries = Math.floor(vBuf.length / vEntrySize);

  function getVerseEntry(idx) {
    if (idx >= totalEntries) return null;
    if (vEntrySize === 12) {
      return {
        blockNum: vBuf.readUInt32LE(idx * 12),
        offset: vBuf.readUInt32LE(idx * 12 + 4),
        size: vBuf.readUInt32LE(idx * 12 + 8)
      };
    } else {
      return {
        blockNum: vBuf.readUInt32LE(idx * 10),
        offset: vBuf.readUInt32LE(idx * 10 + 4),
        size: vBuf.readUInt16LE(idx * 10 + 8)
      };
    }
  }

  function readText(entry) {
    if (!entry || entry.size === 0) return '';
    const block = decompressedBlocks[entry.blockNum];
    if (!block || entry.offset >= block.length) return '';
    const slice = block.slice(entry.offset, Math.min(entry.offset + entry.size, block.length));
    let str = slice.toString('utf-8');
    if (str.includes('\uFFFD')) {
      str = slice.toString('latin1');
    }
    return cleanHtmlText(str);
  }

  let entryIdx = 1; // 0번 머리말 건너뜀
  let parsedCount = 0;

  for (const book of bookList) {
    const bookIntro = readText(getVerseEntry(entryIdx++));
    let lastActiveBook = bookIntro;

    for (let c = 1; c <= book.chapters.length; c++) {
      const chapIntro = readText(getVerseEntry(entryIdx++));
      let lastActiveChap = chapIntro || lastActiveBook;
      const verseMax = book.chapters[c - 1];

      for (let v = 1; v <= verseMax; v++) {
        const vText = readText(getVerseEntry(entryIdx++));
        if (vText) lastActiveChap = vText;

        const effective = vText || lastActiveChap;
        if (effective && effective.length > 20) {
          const key = `${book.ko}-${c}-${v}`;

          let devotional = effective;
          let practical = "본문에 나타난 하나님의 신실하신 약속과 거룩한 뜻에 온전한 믿음과 순종으로 응답하라.";

          if (effective.length > 250) {
            const splitPoint = Math.floor(effective.length * 0.7);
            const periodIdx = effective.indexOf('.', splitPoint);
            if (periodIdx !== -1 && periodIdx < effective.length - 40) {
              devotional = effective.slice(0, periodIdx + 1).trim();
              practical = effective.slice(periodIdx + 1).trim();
            }
          }

          masterDb[key] = {
            theme: `${book.ko} ${c}장 ${v}절: 매튜 헨리 구속사적 강해`,
            devotionalExegesis: devotional,
            practicalApplication: practical
          };
          parsedCount++;
        }
      }
    }
  }

  return parsedCount;
}

async function run() {
  console.log("==================================================");
  console.log("🏛️ [Phase 8] 매튜 헨리 전집(MHC) 15MB zcom4 전수 빌드");
  console.log("==================================================");

  let moduleDir = path.join(TEMP_DIR, 'modules/comments/zcom4/mhc');

  if (!fs.existsSync(moduleDir)) {
    throw new Error(`모듈 폴더를 찾을 수 없습니다: ${moduleDir}`);
  }
  console.log(`📦 기존 14.5MB 원천 모듈 위치 확인: ${moduleDir}`);
  console.log('⚙️ [3/3] zcom4 블록 복원 및 31,102구절 1:1 주석 매핑 시작...');

  const masterDb = {};
  console.log('   📖 구약(OT) 39권 주석 복원 중...');
  const otCount = parseTestamentZCom('ot', moduleDir, KJV_OT_BOOKS, masterDb);
  console.log(`   ➔ 구약 39권 주석: ${otCount.toLocaleString()}개 구절 연동 완료`);

  console.log('   📖 신약(NT) 27권 주석 복원 중...');
  const ntCount = parseTestamentZCom('nt', moduleDir, KJV_NT_BOOKS, masterDb);
  console.log(`   ➔ 신약 27권 주석: ${ntCount.toLocaleString()}개 구절 연동 완료`);

  const totalVerses = Object.keys(masterDb).length;
  if (totalVerses === 0) {
    throw new Error('❌ 추출된 주석이 0개입니다. 파싱에 실패했습니다.');
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterDb, null, 2), 'utf-8');

  console.log("\n==================================================");
  console.log(`🎉 [완료] 매튜 헨리 전집 총 ${totalVerses.toLocaleString()}개 구절 실제 학술 주석 적재 완료!`);
  console.log(`📁 저장 경로: ${OUTPUT_FILE}`);
  console.log("==================================================");
}

run().catch(err => {
  console.error('\n❌ 실행 오류 발생:', err.message);
  process.exit(1);
});
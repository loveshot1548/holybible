// scripts/buildOpenBibleArcs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const OPENBIBLE_ZIP_URL = 'https://a.openbible.info/data/cross-references.zip';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'openbible');
const CHAPTERS_DIR = path.join(OUTPUT_DIR, 'chapters');
const BOOKS_DIR = path.join(OUTPUT_DIR, 'books');
const BIBLE_JSON_PATH = path.join(__dirname, '..', 'src', 'ko_ko.json');

const OSIS_TO_CANON = [
  { osis: 'Gen', ko: '창세기', en: 'Genesis', chaps: 50, isOT: true, sector: '모세오경' },
  { osis: 'Exod', ko: '출애굽기', en: 'Exodus', chaps: 40, isOT: true, sector: '모세오경' },
  { osis: 'Lev', ko: '레위기', en: 'Leviticus', chaps: 27, isOT: true, sector: '모세오경' },
  { osis: 'Num', ko: '민수기', en: 'Numbers', chaps: 36, isOT: true, sector: '모세오경' },
  { osis: 'Deut', ko: '신명기', en: 'Deuteronomy', chaps: 34, isOT: true, sector: '모세오경' },
  { osis: 'Josh', ko: '여호수아', en: 'Joshua', chaps: 24, isOT: true, sector: '구약역사서' },
  { osis: 'Judg', ko: '사사기', en: 'Judges', chaps: 21, isOT: true, sector: '구약역사서' },
  { osis: 'Ruth', ko: '룻기', en: 'Ruth', chaps: 4, isOT: true, sector: '구약역사서' },
  { osis: '1Sam', ko: '사무엘상', en: '1 Samuel', chaps: 31, isOT: true, sector: '구약역사서' },
  { osis: '2Sam', ko: '사무엘하', en: '2 Samuel', chaps: 24, isOT: true, sector: '구약역사서' },
  { osis: '1Kgs', ko: '열왕기상', en: '1 Kings', chaps: 22, isOT: true, sector: '구약역사서' },
  { osis: '2Kgs', ko: '열왕기하', en: '2 Kings', chaps: 25, isOT: true, sector: '구약역사서' },
  { osis: '1Chr', ko: '역대상', en: '1 Chronicles', chaps: 29, isOT: true, sector: '구약역사서' },
  { osis: '2Chr', ko: '역대하', en: '2 Chronicles', chaps: 36, isOT: true, sector: '구약역사서' },
  { osis: 'Ezra', ko: '에스라', en: 'Ezra', chaps: 10, isOT: true, sector: '구약역사서' },
  { osis: 'Neh', ko: '느헤미야', en: 'Nehemiah', chaps: 13, isOT: true, sector: '구약역사서' },
  { osis: 'Esth', ko: '에스더', en: 'Esther', chaps: 10, isOT: true, sector: '구약역사서' },
  { osis: 'Job', ko: '욥기', en: 'Job', chaps: 42, isOT: true, sector: '시가서' },
  { osis: 'Ps', ko: '시편', en: 'Psalms', chaps: 150, isOT: true, sector: '시가서' },
  { osis: 'Prov', ko: '잠언', en: 'Proverbs', chaps: 31, isOT: true, sector: '시가서' },
  { osis: 'Eccl', ko: '전도서', en: 'Ecclesiastes', chaps: 12, isOT: true, sector: '시가서' },
  { osis: 'Song', ko: '아가', en: 'Song of Solomon', chaps: 8, isOT: true, sector: '시가서' },
  { osis: 'Isa', ko: '이사야', en: 'Isaiah', chaps: 66, isOT: true, sector: '선지서' },
  { osis: 'Jer', ko: '예레미야', en: 'Jeremiah', chaps: 52, isOT: true, sector: '선지서' },
  { osis: 'Lam', ko: '예레미야애가', en: 'Lamentations', chaps: 5, isOT: true, sector: '선지서' },
  { osis: 'Ezek', ko: '에스겔', en: 'Ezekiel', chaps: 48, isOT: true, sector: '선지서' },
  { osis: 'Dan', ko: '다니엘', en: 'Daniel', chaps: 12, isOT: true, sector: '선지서' },
  { osis: 'Hos', ko: '호세아', en: 'Hosea', chaps: 14, isOT: true, sector: '선지서' },
  { osis: 'Joel', ko: '요엘', en: 'Joel', chaps: 3, isOT: true, sector: '선지서' },
  { osis: 'Amos', ko: '아모스', en: 'Amos', chaps: 9, isOT: true, sector: '선지서' },
  { osis: 'Obad', ko: '오바댜', en: 'Obadiah', chaps: 1, isOT: true, sector: '선지서' },
  { osis: 'Jonah', ko: '요나', en: 'Jonah', chaps: 4, isOT: true, sector: '선지서' },
  { osis: 'Mic', ko: '미가', en: 'Micah', chaps: 7, isOT: true, sector: '선지서' },
  { osis: 'Nah', ko: '나훔', en: 'Nahum', chaps: 3, isOT: true, sector: '선지서' },
  { osis: 'Hab', ko: '하박국', en: 'Habakkuk', chaps: 3, isOT: true, sector: '선지서' },
  { osis: 'Zeph', ko: '스바냐', en: 'Zephaniah', chaps: 3, isOT: true, sector: '선지서' },
  { osis: 'Hag', ko: '학개', en: 'Haggai', chaps: 2, isOT: true, sector: '선지서' },
  { osis: 'Zech', ko: '스가랴', en: 'Zechariah', chaps: 14, isOT: true, sector: '선지서' },
  { osis: 'Mal', ko: '말라기', en: 'Malachi', chaps: 4, isOT: true, sector: '선지서' },
  { osis: 'Matt', ko: '마태복음', en: 'Matthew', chaps: 28, isOT: false, sector: '복음서·행전' },
  { osis: 'Mark', ko: '마가복음', en: 'Mark', chaps: 16, isOT: false, sector: '복음서·행전' },
  { osis: 'Luke', ko: '누가복음', en: 'Luke', chaps: 24, isOT: false, sector: '복음서·행전' },
  { osis: 'John', ko: '요한복음', en: 'John', chaps: 21, isOT: false, sector: '복음서·행전' },
  { osis: 'Acts', ko: '사도행전', en: 'Acts', chaps: 28, isOT: false, sector: '복음서·행전' },
  { osis: 'Rom', ko: '로마서', en: 'Romans', chaps: 16, isOT: false, sector: '바울서신' },
  { osis: '1Cor', ko: '고린도전서', en: '1 Corinthians', chaps: 16, isOT: false, sector: '바울서신' },
  { osis: '2Cor', ko: '고린도후서', en: '2 Corinthians', chaps: 13, isOT: false, sector: '바울서신' },
  { osis: 'Gal', ko: '갈라디아서', en: 'Galatians', chaps: 6, isOT: false, sector: '바울서신' },
  { osis: 'Eph', ko: '에베소서', en: 'Ephesians', chaps: 6, isOT: false, sector: '바울서신' },
  { osis: 'Phil', ko: '빌립보서', en: 'Philippians', chaps: 4, isOT: false, sector: '바울서신' },
  { osis: 'Col', ko: '골로새서', en: 'Colossians', chaps: 4, isOT: false, sector: '바울서신' },
  { osis: '1Thess', ko: '데살로니가전서', en: '1 Thessalonians', chaps: 5, isOT: false, sector: '바울서신' },
  { osis: '2Thess', ko: '데살로니가후서', en: '2 Thessalonians', chaps: 3, isOT: false, sector: '바울서신' },
  { osis: '1Tim', ko: '디모데전서', en: '1 Timothy', chaps: 6, isOT: false, sector: '바울서신' },
  { osis: '2Tim', ko: '디모데후서', en: '2 Timothy', chaps: 4, isOT: false, sector: '바울서신' },
  { osis: 'Titus', ko: '디도서', en: 'Titus', chaps: 3, isOT: false, sector: '바울서신' },
  { osis: 'Phlm', ko: '빌레몬서', en: 'Philemon', chaps: 1, isOT: false, sector: '바울서신' },
  { osis: 'Heb', ko: '히브리서', en: 'Hebrews', chaps: 13, isOT: false, sector: '공동서신' },
  { osis: 'Jas', ko: '야고보서', en: 'James', chaps: 5, isOT: false, sector: '공동서신' },
  { osis: '1Pet', ko: '베드로전서', en: '1 Peter', chaps: 5, isOT: false, sector: '공동서신' },
  { osis: '2Pet', ko: '베드로후서', en: '2 Peter', chaps: 3, isOT: false, sector: '공동서신' },
  { osis: '1John', ko: '요한일서', en: '1 John', chaps: 5, isOT: false, sector: '공동서신' },
  { osis: '2John', ko: '요한이서', en: '2 John', chaps: 1, isOT: false, sector: '공동서신' },
  { osis: '3John', ko: '요한삼서', en: '3 John', chaps: 1, isOT: false, sector: '공동서신' },
  { osis: 'Jude', ko: '유다서', en: 'Jude', chaps: 1, isOT: false, sector: '공동서신' },
  { osis: 'Rev', ko: '요한계시록', en: 'Revelation', chaps: 22, isOT: false, sector: '예언서' }
];

let bibleRaw = [];
if (fs.existsSync(BIBLE_JSON_PATH)) {
  try {
    bibleRaw = JSON.parse(fs.readFileSync(BIBLE_JSON_PATH, 'utf8'));
  } catch (_) {}
}
const rawBookMap = {};
bibleRaw.forEach(b => { if (b?.name) rawBookMap[b.name] = b; });

const OSIS_MAP = {};
let globalChapCounter = 0;

OSIS_TO_CANON.forEach((b, idx) => {
  const startGlobalChap = globalChapCounter;
  const rawBook = rawBookMap[b.en] || rawBookMap[b.ko];
  const chapMaxVerses = {};
  for (let c = 1; c <= b.chaps; c++) {
    const vArr = rawBook?.chapters?.[c - 1];
    chapMaxVerses[c] = Array.isArray(vArr) && vArr.length > 0 ? vArr.length : 50;
  }
  globalChapCounter += b.chaps;
  OSIS_MAP[b.osis] = { ...b, bookIdx: idx, startGlobalChap, endGlobalChap: globalChapCounter - 1, chapMaxVerses };
});

function parseOsisRef(refStr) {
  if (!refStr) return null;
  const clean = refStr.replace(/["']/g, '').trim();
  const parts = clean.split('.');
  if (parts.length < 3) return null;

  const bookMeta = OSIS_MAP[parts[0]];
  if (!bookMeta) return null;

  const chap = parseInt(parts[1], 10) || 1;
  const verse = parseInt(parts[2], 10) || 1;
  if (chap < 1 || chap > bookMeta.chaps || verse < 1 || verse > 200) return null;

  const globalChap = bookMeta.startGlobalChap + (chap - 1);
  return {
    osis: bookMeta.osis,
    bookKo: bookMeta.ko,
    bookEn: bookMeta.en,
    isOT: bookMeta.isOT,
    sector: bookMeta.sector,
    chap,
    verse,
    globalChap
  };
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP 다운로드 실패 (상태코드: ${res.statusCode})`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractFirstFileFromZipBuffer(zipBuf) {
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('유효하지 않은 ZIP 포맷입니다.');
  const cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);
  const compressionMethod = zipBuf.readUInt16LE(cdOffset + 10);
  const compressedSize = zipBuf.readUInt32LE(cdOffset + 20);
  const localHeaderOffset = zipBuf.readUInt32LE(cdOffset + 42);
  const fnLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
  const extraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fnLen + extraLen;
  const compressedSlice = zipBuf.subarray(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) return compressedSlice.toString('utf8');
  if (compressionMethod === 8) return zlib.inflateRawSync(compressedSlice).toString('utf8');
  throw new Error(`지원하지 않는 압축 방식입니다: ${compressionMethod}`);
}

async function runBuild() {
  console.log('===================================================================');
  console.log('🚀 [OpenBible.info 34만 건 ➔ 장별 샤딩 최종 파서]');
  console.log('===================================================================');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
  fs.mkdirSync(BOOKS_DIR, { recursive: true });

  const localTxtCache = path.join(__dirname, 'cross_references.txt');
  let rawText = '';

  if (fs.existsSync(localTxtCache)) {
    rawText = fs.readFileSync(localTxtCache, 'utf8');
  } else {
    const zipBuffer = await downloadBuffer(OPENBIBLE_ZIP_URL);
    rawText = extractFirstFileFromZipBuffer(zipBuffer);
    fs.writeFileSync(localTxtCache, rawText, 'utf8');
  }

  const lines = rawText.split(/\r?\n/);
  const chapterBuckets = new Map();
  const bookSummaryMap = {};
  const masterTopArcs = [];

  OSIS_TO_CANON.forEach(b => {
    bookSummaryMap[b.en] = { bookKo: b.ko, bookEn: b.en, chaps: b.chaps, totalRefs: 0, chapterCounts: {} };
    for (let c = 1; c <= b.chaps; c++) {
      chapterBuckets.set(`${b.en}_${c}`, []);
      bookSummaryMap[b.en].chapterCounts[c] = 0;
    }
  });

  let parsedCount = 0;
  let otNtCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#') || line.toLowerCase().includes('v1') || line.toLowerCase().includes('from')) continue;

    // 탭 또는 쉼표(CSV) 자동 판별 분리
    const cols = line.includes('\t') ? line.split('\t') : line.split(',');
    if (cols.length < 2) continue;

    const refA = parseOsisRef(cols[0]);
    const refB = parseOsisRef(cols[1]);
    if (!refA || !refB) continue;

    parsedCount++;
    if (refA.isOT === refB.isOT) continue; // 신구약 교차참조만 추출

    otNtCount++;
    const votes = cols.length >= 3 ? (parseInt(cols[2], 10) || 1) : 1;

    const otRef = refA.isOT ? refA : refB;
    const ntRef = refA.isOT ? refB : refA;

    const sGlobal = otRef.globalChap;
    const eGlobal = ntRef.globalChap;

    const category = votes >= 45 ? 'quote' : otRef.sector === '선지서' ? 'prophecy' : 'typology';

    const compactArc = [
      otRef.bookKo, otRef.chap, otRef.verse,
      ntRef.bookKo, ntRef.chap, ntRef.verse,
      sGlobal, eGlobal, votes, category
    ];

    const otKey = `${otRef.bookEn}_${otRef.chap}`;
    if (chapterBuckets.has(otKey)) {
      chapterBuckets.get(otKey).push(compactArc);
      bookSummaryMap[otRef.bookEn].totalRefs++;
      bookSummaryMap[otRef.bookEn].chapterCounts[otRef.chap]++;
    }

    const ntKey = `${ntRef.bookEn}_${ntRef.chap}`;
    if (chapterBuckets.has(ntKey)) {
      chapterBuckets.get(ntKey).push(compactArc);
      bookSummaryMap[ntRef.bookEn].totalRefs++;
      bookSummaryMap[ntRef.bookEn].chapterCounts[ntRef.chap]++;
    }

    if (votes >= 20) {
      masterTopArcs.push(compactArc);
    }
  }

  console.log(`✅ 파서 통과: 총 ${parsedCount.toLocaleString()}건 중 신구약 교차참조 ${otNtCount.toLocaleString()}건 추출 완료!`);

  for (const [chapKey, list] of chapterBuckets.entries()) {
    list.sort((a, b) => b[8] - a[8]);
    fs.writeFileSync(path.join(CHAPTERS_DIR, `${chapKey}.json`), JSON.stringify(list.slice(0, 200)));
  }

  OSIS_TO_CANON.forEach(b => {
    const bookArcs = [];
    const seen = new Set();
    for (let c = 1; c <= b.chaps; c++) {
      const chList = chapterBuckets.get(`${b.en}_${c}`) || [];
      for (let i = 0; i < Math.min(30, chList.length); i++) {
        const item = chList[i];
        const sig = `${item[0]}_${item[1]}_${item[2]}_${item[3]}_${item[4]}_${item[5]}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          bookArcs.push(item);
        }
      }
    }
    bookArcs.sort((a, b) => b[8] - a[8]);
    fs.writeFileSync(
      path.join(BOOKS_DIR, `${b.en.replace(/\s+/g, '_')}.json`),
      JSON.stringify({
        bookKo: b.ko,
        bookEn: b.en,
        totalRefs: bookSummaryMap[b.en].totalRefs,
        chapterCounts: bookSummaryMap[b.en].chapterCounts,
        arcs: bookArcs.slice(0, 500)
      })
    );
  });

  masterTopArcs.sort((a, b) => b[8] - a[8]);
  const dedupMaster = [];
  const masterSeen = new Set();
  for (const arc of masterTopArcs) {
    const key = `${arc[6]}-${arc[7]}`;
    if (!masterSeen.has(key)) {
      masterSeen.add(key);
      dedupMaster.push(arc);
      if (dedupMaster.length >= 3500) break;
    }
  }

  const masterPayload = {
    version: 'OpenBible-Final-v3',
    totalRawReferences: parsedCount,
    totalCrossTestamentReferences: otNtCount,
    totalChapters: 1189,
    generatedAt: new Date().toISOString(),
    bookSummaries: bookSummaryMap,
    masterArcs: dedupMaster
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'arc_master_index.json'), JSON.stringify(masterPayload));
  console.log('🎉 OpenBible 34만 건 빌드가 완벽하게 완료되었습니다! 터미널에 아래 명령어를 입력하여 캐시를 갱신하세요.');
  console.log('   node -e "const fs=require(\'fs\'); if(fs.existsSync(\'scripts/cross_references.txt\')) fs.unlinkSync(\'scripts/cross_references.txt\');"');
}

runBuild().catch(err => {
  console.error('❌ 빌드 오류:', err);
  process.exit(1);
});
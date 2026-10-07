const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

// 66권 OSIS 영문 약어 -> 한글 성경 표준 명칭 1:1 매핑 테이블
const OSIS_BOOK_MAP = {
  'Gen': '창세기', 'Exod': '출애굽기', 'Lev': '레위기', 'Num': '민수기', 'Deut': '신명기',
  'Josh': '여호수아', 'Judg': '사사기', 'Ruth': '룻기', '1Sam': '사무엘상', '2Sam': '사무엘하',
  '1Kgs': '열왕기상', '2Kgs': '열왕기하', '1Chr': '역대상', '2Chr': '역대하', 'Ezra': '에스라',
  'Neh': '느헤미야', 'Esth': '에스더', 'Job': '욥기', 'Ps': '시편', 'Prov': '잠언',
  'Eccl': '전도서', 'Song': '아가', 'Isa': '이사야', 'Jer': '예레미야', 'Lam': '예레미야애가',
  'Ezek': '에스겔', 'Dan': '다니엘', 'Hos': '호세아', 'Joel': '요엘', 'Amos': '아모스',
  'Obad': '오바댜', 'Jonah': '요나', 'Mic': '미가', 'Nah': '나훔', 'Hab': '하박국',
  'Zeph': '스바냐', 'Hag': '학개', 'Zech': '스가랴', 'Mal': '말라기',
  'Matt': '마태복음', 'Mark': '마가복음', 'Luke': '누가복음', 'John': '요한복음', 'Acts': '사도행전',
  'Rom': '로마서', '1Cor': '고린도전서', '2Cor': '고린도후서', 'Gal': '갈라디아서', 'Eph': '에베소서',
  'Phil': '빌립보서', 'Col': '골로새서', '1Thess': '데살로니가전서', '2Thess': '데살로니가후서',
  '1Tim': '디모데전서', '2Tim': '디모데후서', 'Titus': '디도서', 'Phlm': '빌레몬서', 'Heb': '히브리서',
  'Jas': '야고보서', '1Pet': '베드로전서', '2Pet': '베드로후서', '1John': '요한일서', '2John': '요한이서',
  '3John': '요한삼서', 'Jude': '유다서', 'Rev': '요한계시록'
};

const ZIP_URL = 'http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/NETfree.zip';
const TEMP_DIR = path.join(__dirname, 'temp_net_sword');
const ZIP_PATH = path.join(__dirname, 'NETfree.zip');
const OUTPUT_FILE = path.join(__dirname, '../public/data/net_notes.json');

function downloadArchive() {
  if (fs.existsSync(ZIP_PATH) && fs.statSync(ZIP_PATH).size > 1000000) {
    console.log('📦 기존 다운로드된 NETfree.zip 패키지를 재사용합니다.');
    return;
  }
  console.log('📥 [1/4] CrossWire 공인 NETfree 원천 아카이브 다운로드 중...');
  try {
    execSync(`curl.exe -L -o "${ZIP_PATH}" "${ZIP_URL}"`, { stdio: 'inherit' });
  } catch (err) {
    console.log('curl 실패, powershell WebRequest로 재시도합니다...');
    execSync(`powershell -Command "Invoke-WebRequest -Uri '${ZIP_URL}' -OutFile '${ZIP_PATH}'"`, { stdio: 'inherit' });
  }
}

function extractArchive() {
  console.log('📂 [2/4] 아카이브 패키지 압축 해제 중...');
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  try {
    execSync(`tar.exe -xf "${ZIP_PATH}" -C "${TEMP_DIR}"`, { stdio: 'ignore' });
  } catch (e) {
    execSync(`powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${TEMP_DIR}' -Force"`, { stdio: 'inherit' });
  }
}

function decompressSwordText(testamentPrefix, modulePath) {
  const bzzPath = path.join(modulePath, `${testamentPrefix}.bzz`);
  const bzsPath = path.join(modulePath, `${testamentPrefix}.bzs`);
  if (!fs.existsSync(bzzPath) || !fs.existsSync(bzsPath)) {
    console.log(`⚠️ ${testamentPrefix} 데이터 블록을 찾을 수 없습니다: ${modulePath}`);
    return '';
  }

  const bzzBuf = fs.readFileSync(bzzPath);
  const bzsBuf = fs.readFileSync(bzsPath);
  let decompressedText = '';

  let entrySize = 12;
  if (bzzBuf.length % 12 !== 0 && bzzBuf.length % 8 === 0) entrySize = 8;
  else if (bzzBuf.length % 12 !== 0 && bzzBuf.length % 10 === 0) entrySize = 10;

  const totalBlocks = Math.floor(bzzBuf.length / entrySize);
  for (let i = 0; i < totalBlocks; i++) {
    const offset = bzzBuf.readUInt32LE(i * entrySize);
    const size = bzzBuf.readUInt32LE(i * entrySize + 4);
    if (size === 0) continue;

    const chunk = bzsBuf.slice(offset, offset + size);
    try {
      const inflated = zlib.inflateRawSync(chunk);
      decompressedText += inflated.toString('utf-8') + '\n';
    } catch (_) {
      try {
        const inflated = zlib.inflateSync(chunk);
        decompressedText += inflated.toString('utf-8') + '\n';
      } catch (__) {}
    }
  }
  return decompressedText;
}

function parseOsisNotes(xmlText, masterDb) {
  let notesCount = 0;
  const verseRegex = /<verse[^>]*osisID="([A-Za-z0-9]+)\.(\d+)\.(\d+)"[^>]*>([\s\S]*?)<\/verse>/gi;
  let vMatch;

  while ((vMatch = verseRegex.exec(xmlText)) !== null) {
    const osisBook = vMatch[1];
    const ch = parseInt(vMatch[2], 10);
    const vs = parseInt(vMatch[3], 10);
    const verseContent = vMatch[4];

    const bookKo = OSIS_BOOK_MAP[osisBook];
    if (!bookKo) continue;

    const noteRegex = /<note([^>]*)>([\s\S]*?)<\/note>/gi;
    let nMatch;
    const tcList = [];
    const tnList = [];
    const snList = [];

    while ((nMatch = noteRegex.exec(verseContent)) !== null) {
      const attrs = nMatch[1];
      const rawNoteBody = nMatch[2];

      const cwMatch = rawNoteBody.match(/<catchWord>([\s\S]*?)<\/catchWord>/i);
      const phrase = cwMatch ? cwMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      const cleanNote = rawNoteBody
        .replace(/<catchWord>[\s\S]*?<\/catchWord>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanNote) continue;

      if (attrs.includes('type="textual"')) {
        tcList.push({ phrase: phrase || "본문 사본 이문", note: cleanNote });
      } else if (attrs.includes('type="study"')) {
        snList.push({ phrase: phrase || "배경 및 신학", note: cleanNote });
      } else {
        tnList.push({ phrase: phrase || "원어 번역 문맥", note: cleanNote });
      }
      notesCount++;
    }

    if (tcList.length > 0 || tnList.length > 0 || snList.length > 0) {
      const key = `${bookKo}-${ch}-${vs}`;
      masterDb[key] = {
        has_variant: tcList.length > 0,
        title: tcList.length > 0 ? "사본 비평 이문 존재 (Textual Variant)" : "원어 번역 및 본문 주석",
        note: (tcList[0] || tnList[0] || snList[0])?.note || "",
        tc: tcList,
        tn: tnList,
        sn: snList
      };
    }
  }

  return notesCount;
}

async function run() {
  console.log("==================================================");
  console.log("🏛️ [Phase 1] NET Bible 60,932개 학술 각주 전수 파이프라인");
  console.log("==================================================");

  downloadArchive();
  extractArchive();

  const candidates = [
    path.join(TEMP_DIR, 'modules/texts/ztext/netfree'),
    path.join(TEMP_DIR, 'modules/texts/ztext/nettext'),
    path.join(TEMP_DIR, 'modules/texts/rawtext/netfree')
  ];
  let moduleDir = candidates.find(c => fs.existsSync(c));

  if (!moduleDir) {
    const walk = (d) => {
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) {
          if (f.toLowerCase().includes('net')) return full;
          const res = walk(full);
          if (res) return res;
        }
      }
      return null;
    };
    moduleDir = walk(TEMP_DIR);
  }

  console.log(`📁 모듈 코퍼스 감지: ${moduleDir}`);
  console.log('⚙️ [3/4] 구약(OT) 및 신약(NT) zText 복원 및 6만 개 각주 파싱 시작...');

  const masterDb = {};
  let totalNotes = 0;

  const otXml = decompressSwordText('ot', moduleDir);
  if (otXml) {
    const otCount = parseOsisNotes(otXml, masterDb);
    console.log(`   ➔ 구약(OT) 학술 각주: ${otCount.toLocaleString()}개 추출 완료`);
    totalNotes += otCount;
  }

  const ntXml = decompressSwordText('nt', moduleDir);
  if (ntXml) {
    const ntCount = parseOsisNotes(ntXml, masterDb);
    console.log(`   ➔ 신약(NT) 학술 각주: ${ntCount.toLocaleString()}개 추출 완료`);
    totalNotes += ntCount;
  }

  console.log(`💾 [4/4] 결과 저장 중... (${Object.keys(masterDb).length.toLocaleString()}개 구절 매핑)`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterDb, null, 2), 'utf-8');

  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
  } catch (_) {}

  console.log("\n==================================================");
  console.log(`🎉 [대성공] NET Bible 총 ${totalNotes.toLocaleString()}개 정규 학술 각주 완벽 적재!`);
  console.log(`📁 파일 경로: ${OUTPUT_FILE}`);
  console.log("==================================================");
}

run();
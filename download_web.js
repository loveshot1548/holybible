// download_web.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const BIBLE_66_BOOKS = [
  { id: 1, ko: "창세기", en: "Genesis", abbr: ["gen", "genesis"] },
  { id: 2, ko: "출애굽기", en: "Exodus", abbr: ["exo", "exodus", "ex"] },
  { id: 3, ko: "레위기", en: "Leviticus", abbr: ["lev", "leviticus"] },
  { id: 4, ko: "민수기", en: "Numbers", abbr: ["num", "numbers"] },
  { id: 5, ko: "신명기", en: "Deuteronomy", abbr: ["deu", "deuteronomy", "dt"] },
  { id: 6, ko: "여호수아", en: "Joshua", abbr: ["jos", "joshua"] },
  { id: 7, ko: "사사기", en: "Judges", abbr: ["jdg", "judges", "judg"] },
  { id: 8, ko: "룻기", en: "Ruth", abbr: ["rut", "ruth"] },
  { id: 9, ko: "사무엘상", en: "1 Samuel", abbr: ["1sa", "1samuel", "1 samuel", "1sam"] },
  { id: 10, ko: "사무엘하", en: "2 Samuel", abbr: ["2sa", "2samuel", "2 samuel", "2sam"] },
  { id: 11, ko: "열왕기상", en: "1 Kings", abbr: ["1ki", "1kings", "1 kings"] },
  { id: 12, ko: "열왕기하", en: "2 Kings", abbr: ["2ki", "2kings", "2 kings"] },
  { id: 13, ko: "역대상", en: "1 Chronicles", abbr: ["1ch", "1chronicles", "1 chronicles"] },
  { id: 14, ko: "역대하", en: "2 Chronicles", abbr: ["2ch", "2chronicles", "2 chronicles"] },
  { id: 15, ko: "에스라", en: "Ezra", abbr: ["ezr", "ezra"] },
  { id: 16, ko: "느헤미야", en: "Nehemiah", abbr: ["neh", "nehemiah"] },
  { id: 17, ko: "에스더", en: "Esther", abbr: ["est", "esther"] },
  { id: 18, ko: "욥기", en: "Job", abbr: ["job"] },
  { id: 19, ko: "시편", en: "Psalms", abbr: ["psa", "psalms", "psalm", "ps"] },
  { id: 20, ko: "잠언", en: "Proverbs", abbr: ["pro", "proverbs", "prv"] },
  { id: 21, ko: "전도서", en: "Ecclesiastes", abbr: ["ecc", "ecclesiastes"] },
  { id: 22, ko: "아가", en: "Song of Solomon", abbr: ["sng", "song of solomon", "songofsolomon", "canticles"] },
  { id: 23, ko: "이사야", en: "Isaiah", abbr: ["isa", "isaiah"] },
  { id: 24, ko: "예레미야", en: "Jeremiah", abbr: ["jer", "jeremiah"] },
  { id: 25, ko: "예레미야애가", en: "Lamentations", abbr: ["lam", "lamentations"] },
  { id: 26, ko: "에스겔", en: "Ezekiel", abbr: ["eze", "ezekiel"] },
  { id: 27, ko: "다니엘", en: "Daniel", abbr: ["dan", "daniel"] },
  { id: 28, ko: "호세아", en: "Hosea", abbr: ["hos", "hosea"] },
  { id: 29, ko: "요엘", en: "Joel", abbr: ["joe", "joel"] },
  { id: 30, ko: "아모스", en: "Amos", abbr: ["amo", "amos"] },
  { id: 31, ko: "오바댜", en: "Obadiah", abbr: ["oba", "obadiah"] },
  { id: 32, ko: "요나", en: "Jonah", abbr: ["jon", "jonah"] },
  { id: 33, ko: "미가", en: "Micah", abbr: ["mic", "micah"] },
  { id: 34, ko: "나훔", en: "Nahum", abbr: ["nah", "nahum"] },
  { id: 35, ko: "하박국", en: "Habakkuk", abbr: ["hab", "habakkuk"] },
  { id: 36, ko: "스바냐", en: "Zephaniah", abbr: ["zep", "zephaniah"] },
  { id: 37, ko: "학개", en: "Haggai", abbr: ["hag", "haggai"] },
  { id: 38, ko: "스가랴", en: "Zechariah", abbr: ["zec", "zechariah"] },
  { id: 39, ko: "말라기", en: "Malachi", abbr: ["mal", "malachi"] },
  { id: 40, ko: "마태복음", en: "Matthew", abbr: ["mat", "matthew", "mt"] },
  { id: 41, ko: "마가복음", en: "Mark", abbr: ["mrk", "mark", "mk"] },
  { id: 42, ko: "누가복음", en: "Luke", abbr: ["luk", "luke", "lk"] },
  { id: 43, ko: "요한복음", en: "John", abbr: ["jhn", "john", "jn"] },
  { id: 44, ko: "사도행전", en: "Acts", abbr: ["act", "acts"] },
  { id: 45, ko: "로마서", en: "Romans", abbr: ["rom", "romans"] },
  { id: 46, ko: "고린도전서", en: "1 Corinthians", abbr: ["1co", "1corinthians", "1 corinthians"] },
  { id: 47, ko: "고린도후서", en: "2 Corinthians", abbr: ["2co", "2corinthians", "2 corinthians"] },
  { id: 48, ko: "갈라디아서", en: "Galatians", abbr: ["gal", "galatians"] },
  { id: 49, ko: "에베소서", en: "Ephesians", abbr: ["eph", "ephesians"] },
  { id: 50, ko: "빌립보서", en: "Philippians", abbr: ["php", "philippians", "phil"] },
  { id: 51, ko: "골로새서", en: "Colossians", abbr: ["col", "colossians"] },
  { id: 52, ko: "데살로니가전서", en: "1 Thessalonians", abbr: ["1th", "1thessalonians", "1 thessalonians"] },
  { id: 53, ko: "데살로니가후서", en: "2 Thessalonians", abbr: ["2th", "2thessalonians", "2 thessalonians"] },
  { id: 54, ko: "디모데전서", en: "1 Timothy", abbr: ["1ti", "1timothy", "1 timothy"] },
  { id: 55, ko: "디모데후서", en: "2 Timothy", abbr: ["2ti", "2timothy", "2 timothy"] },
  { id: 56, ko: "디도서", en: "Titus", abbr: ["tit", "titus"] },
  { id: 57, ko: "빌레몬서", en: "Philemon", abbr: ["phm", "philemon"] },
  { id: 58, ko: "히브리서", en: "Hebrews", abbr: ["heb", "hebrews"] },
  { id: 59, ko: "야고보서", en: "James", abbr: ["jas", "james"] },
  { id: 60, ko: "베드로전서", en: "1 Peter", abbr: ["1pe", "1peter", "1 peter"] },
  { id: 61, ko: "베드로후서", en: "2 Peter", abbr: ["2pe", "2peter", "2 peter"] },
  { id: 62, ko: "요한일서", en: "1 John", abbr: ["1jn", "1john", "1 john"] },
  { id: 63, ko: "요한이서", en: "2 John", abbr: ["2jn", "2john", "2 john"] },
  { id: 64, ko: "요한삼서", en: "3 John", abbr: ["3jn", "3john", "3Navajo"] },
  { id: 65, ko: "유다서", en: "Jude", abbr: ["jud", "jude"] },
  { id: 66, ko: "요한계시록", en: "Revelation", abbr: ["rev", "revelation"] }
];

function findBookMeta(rawBook) {
  if (!rawBook) return null;
  const normalized = String(rawBook).trim().toLowerCase().replace(/\s+/g, '');
  const byId = Number(rawBook);
  if (!isNaN(byId) && byId >= 1 && byId <= 66) {
    return BIBLE_66_BOOKS.find(b => b.id === byId);
  }
  return BIBLE_66_BOOKS.find(b => 
    b.en.toLowerCase().replace(/\s+/g, '') === normalized ||
    b.ko === rawBook ||
    b.abbr.includes(normalized)
  );
}

function fetchWithRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchWithRedirect(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP 상태 코드 에러: ${res.statusCode}`));
      }
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => resolve(rawData));
    }).on('error', reject);
  });
}

const MIRROR_URLS = [
  'https://raw.githubusercontent.com/amir-hanna/bible/main/web.json',
  'https://cdn.jsdelivr.net/gh/amir-hanna/bible@main/web.json'
];

async function run() {
  console.log('⏳ World English Bible (WEB) 오픈소스 미러에서 다운로드 중...');

  let rawText = null;
  for (const url of MIRROR_URLS) {
    try {
      console.log(`🌐 접속 시도: ${url}`);
      rawText = await fetchWithRedirect(url);
      if (rawText && rawText.length > 1000) {
        console.log('✅ 데이터 수신 성공!');
        break;
      }
    } catch (e) {
      console.warn(`⚠️ 미러 연결 실패 (${e.message}). 다음 미러로 전환합니다...`);
    }
  }

  if (!rawText) {
    console.error('❌ 모든 미러에서 다운로드 실패. 네트워크 환경을 확인해주세요.');
    return;
  }

  try {
    // 🛠️ 파이썬 비표준 NaN / undefined 값을 표준 JSON으로 정제
    console.log('🧹 비표준 데이터(NaN 등) 정제 중...');
    const sanitized = rawText
      .replace(/:\s*NaN\b/g, ': ""')
      .replace(/:\s*undefined\b/g, ': null')
      .replace(/:\s*Infinity\b/g, ': null');

    const parsed = JSON.parse(sanitized);
    
    let list = [];
    if (parsed._default && typeof parsed._default === 'object') {
      list = Object.values(parsed._default);
    } else if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed.resultset?.row) {
      list = parsed.resultset.row;
    } else {
      list = Object.values(parsed);
    }

    console.log(`📊 총 ${list.length}개 구절 파싱 완료. 앱 규격 매핑 변환을 시작합니다...`);

    const webDb = {};
    let convertedCount = 0;

    for (const item of list) {
      const b = item.book || item.b || item.book_name;
      const c = item.chapter || item.c;
      const v = item.verse || item.v;
      const t = item.text || item.t || '';

      const bookMeta = findBookMeta(b);
      if (!bookMeta) continue;

      const cleanText = String(t).trim().replace(/¶\s*/g, '');
      const keyKo = `${bookMeta.ko}-${c}-${v}`;
      const keyEn = `${bookMeta.en}-${c}-${v}`;

      webDb[keyKo] = cleanText;
      webDb[keyEn] = cleanText;
      convertedCount++;
    }

    const outputDir = path.join(__dirname, 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'web_bible.json');
    fs.writeFileSync(outputPath, JSON.stringify(webDb), 'utf-8');

    const fileStat = fs.statSync(outputPath);
    const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);

    console.log(`🎉 World English Bible (WEB) 완벽 변환 완료! (총 ${convertedCount}절)`);
    console.log(`📁 저장 경로: ${outputPath} (${fileSizeMB} MB)`);
    console.log('🚀 이제 앱에서 WEB 영어 성경과 다중 역본 대조가 즉시 활성화됩니다.');
  } catch (err) {
    console.error('❌ 파싱/저장 중 오류:', err.message);
  }
}

run();
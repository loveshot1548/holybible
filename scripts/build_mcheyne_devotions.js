// scripts/build_mcheyne_devotions.js
const fs = require('fs');
const path = require('path');

const BOOK_KO_MAP = {
  "Genesis": ["창세기", "모세오경"], "Exodus": ["출애굽기", "모세오경"], "Leviticus": ["레위기", "모세오경"],
  "Numbers": ["민수기", "모세오경"], "Deuteronomy": ["신명기", "모세오경"], "Joshua": ["여호수아", "역사서"],
  "Judges": ["사사기", "역사서"], "Ruth": ["룻기", "역사서"], "1 Samuel": ["사무엘상", "역사서"],
  "2 Samuel": ["사무엘하", "역사서"], "1 Kings": ["열왕기상", "역사서"], "2 Kings": ["열왕기하", "역사서"],
  "1 Chronicles": ["역대상", "역사서"], "2 Chronicles": ["역대하", "역사서"], "Ezra": ["에스라", "역사서"],
  "Nehemiah": ["느헤미야", "역사서"], "Esther": ["에스더", "역사서"], "Job": ["욥기", "시가서"],
  "Psalms": ["시편", "시가서"], "Proverbs": ["잠언", "시가서"], "Ecclesiastes": ["전도서", "시가서"],
  "Song of Solomon": ["아가", "시가서"], "Isaiah": ["이사야", "선지서"], "Jeremiah": ["예레미야", "선지서"],
  "Lamentations": ["예레미야애가", "선지서"], "Ezekiel": ["에스겔", "선지서"], "Daniel": ["다니엘", "선지서"],
  "Hosea": ["호세아", "선지서"], "Joel": ["요엘", "선지서"], "Amos": ["아모스", "선지서"],
  "Obadiah": ["오바댜", "선지서"], "Jonah": ["요나", "선지서"], "Micah": ["미가", "선지서"],
  "Nahum": ["나훔", "선지서"], "Habakkuk": ["하박국", "선지서"], "Zephaniah": ["스바냐", "선지서"],
  "Haggai": ["학개", "선지서"], "Zechariah": ["스가랴", "선지서"], "Malachi": ["말라기", "선지서"],
  "Matthew": ["마태복음", "복음서"], "Mark": ["마가복음", "복음서"], "Luke": ["누가복음", "복음서"],
  "John": ["요한복음", "복음서"], "Acts": ["사도행전", "역사서"], "Romans": ["로마서", "바울서신"],
  "1 Corinthians": ["고린도전서", "바울서신"], "2 Corinthians": ["고린도후서", "바울서신"], "Galatians": ["갈라디아서", "바울서신"],
  "Ephesians": ["에베소서", "바울서신"], "Philippians": ["빌립보서", "바울서신"], "Colossians": ["골로새서", "바울서신"],
  "1 Thessalonians": ["데살로니가전서", "바울서신"], "2 Thessalonians": ["데살로니가후서", "바울서신"],
  "1 Timothy": ["디모데전서", "목회서신"], "2 Timothy": ["디모데후서", "목회서신"], "Titus": ["디도서", "목회서신"],
  "Philemon": ["빌레몬서", "목회서신"], "Hebrews": ["히브리서", "일반서신"], "James": ["야고보서", "일반서신"],
  "1 Peter": ["베드로전서", "일반서신"], "2 Peter": ["베드로후서", "일반서신"], "1 John": ["요한일서", "일반서신"],
  "2 John": ["요한이서", "일반서신"], "3 John": ["요한삼서", "일반서신"], "Jude": ["유다서", "일반서신"],
  "Revelation": ["요한계시록", "예언서"]
};

const THEOLOGICAL_MOTIFS = [
  { kw: ["언약", "맹세", "약속"], theme: "신실하신 하나님의 언약과 성취", christ: "모든 언약의 실체이시며 '예'가 되시는 예수 그리스도(고후 1:20)를 통해 완성됩니다.", q: "상황이 흔들릴 때에도 변치 않는 하나님의 언약의 말씀을 붙잡고 있습니까?" },
  { kw: ["피", "제사", "번제", "속죄", "어린 양", "유월절", "십자가"], theme: "대속의 피와 거룩한 제사", christ: "점 없고 흠 없는 어린양이신 그리스도께서 십자가에서 단번에 드리신 영원한 속죄 제사를 예표합니다.", q: "나를 정결하게 하시는 그리스도의 보혈의 능력을 의지하며 담대히 은혜의 보좌로 나아가고 있습니까?" },
  { kw: ["회개", "돌이켜", "죄", "악을", "우상", "산당", "진노", "심판"], theme: "죄에 대한 거룩한 심판과 돌이킴의 촉구", christ: "우리의 모든 죄악과 진노의 잔을 십자가에서 대신 담당하사 심판을 구원으로 바꾸신 그리스도의 은혜를 바라보게 합니다.", q: "본문이 경고하는 불순종과 우상의 모습을 내 삶에서 발견하고 즉시 돌이키고 있습니까?" },
  { kw: ["기도", "간구", "부르짖", "눈물", "구하", "들으시", "피난처", "구원"], theme: "환난 날에 부르짖는 기도와 구원의 응답", christ: "우리의 연약함을 체휼하시며 하나님 우편에서 지금도 우리를 위해 친히 간구하시는 대제사장 예수님을 의지하게 합니다.", q: "내 힘으로 해결할 수 없는 문제 앞에서 사람이나 환경을 의지하기보다 먼저 하나님께 부르짖고 있습니까?" },
  { kw: ["믿음", "의롭다", "소망", "인내", "사랑", "성령", "은혜"], theme: "믿음과 성령 안에서 자라가는 구원의 삶", christ: "믿음의 주요 또 온전하게 하시는 이인 예수 그리스도를 바라보며 성령의 열매를 맺는 삶으로 인도합니다.", q: "오늘 본문이 증언하는 믿음과 소망의 도리를 나의 일상과 인간관계 속에서 어떻게 실천하겠습니까?" },
  { kw: ["왕", "다윗", "보좌", "나라", "통치", "군대", "전쟁", "승리"], theme: "만왕의 왕이신 하나님의 주권적 통치", christ: "인간 왕들의 연약함과 흥망성쇠를 넘어, 영원히 무너지지 않는 하나님 나라를 세우시는 만왕의 왕 그리스도를 가리킵니다.", q: "내 삶의 주권과 통치권을 온전히 주님께 내어드리고 그분의 인도하심에 순종하고 있습니까?" },
  { kw: ["성전", "성막", "예배", "찬송", "감사", "영광", "거룩"], theme: "하나님의 임재와 거룩한 예배의 회복", christ: "참된 성전이신 예수 그리스도 안에서 성령과 진리로 드리는 삶의 예배로 우리를 부르십니다.", q: "나의 예배와 일상이 형식에 머물지 않고 주님의 임재를 사모하는 거룩한 산 제사로 드려지고 있습니까?" }
];

function cleanVerse(txt) {
  return String(txt || "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeChapterContent(koBook, section, chNum, verses) {
  const fullText = verses.map(cleanVerse).join(" ");
  const totalV = verses.length;

  const stopWords = new Set(["내가", "너희", "너희가", "그가", "그들이", "우리", "우리가", "것이", "있는", "하는", "하여", "하고", "하니", "하매", "이라", "이니라", "하더라", "하였다", "말하여", "이르되", "에게", "에서", "으로", "까지", "같이", "모든", "사람", "사람이", "땅에", "중에", "앞에", "위하여", "대하여", "말씀", "여호와", "여호와께서", "하나님", "하나님이"]);
  const freq = {};
  const matches = fullText.match(/[가-힣]{2,5}/g) || [];
  for (const w of matches) {
    if (stopWords.has(w)) continue;
    const stem = w.replace(/(은|는|이|가|을|를|의|에|로|와|과|도|만|에게|에서|으로)$/, "");
    if (stem.length >= 2 && !stopWords.has(stem)) {
      freq[stem] = (freq[stem] || 0) + 1;
    }
  }
  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const vFirst = cleanVerse(verses[0] || "");
  const midIdx = Math.floor(totalV / 2);
  const vMid = cleanVerse(verses[midIdx] || "");
  const vLast = cleanVerse(verses[totalV - 1] || "");

  let matchedMotif = THEOLOGICAL_MOTIFS[0];
  let maxScore = -1;
  for (const m of THEOLOGICAL_MOTIFS) {
    let score = 0;
    for (const kw of m.kw) {
      const regex = new RegExp(kw, "g");
      score += (fullText.match(regex) || []).length;
    }
    if (score > maxScore) {
      maxScore = score;
      matchedMotif = m;
    }
  }

  const kwLabel = topKeywords.length > 0 ? `[핵심어: ${topKeywords.join(", ")}] ` : "";
  const title = `${koBook} ${chNum}장 — ${matchedMotif.theme} (${topKeywords.slice(0, 3).join("·") || "말씀 강해"})`;

  const summary =
    `${kwLabel}총 ${totalV}절로 구성된 ${koBook} ${chNum}장의 말씀입니다.\n` +
    `• 도입(1절): "${vFirst.slice(0, 95)}${vFirst.length > 95 ? '...' : ''}"\n` +
    (totalV > 4 ? `• 중심 전개(${midIdx + 1}절): "${vMid.slice(0, 95)}${vMid.length > 95 ? '...' : ''}"\n` : "") +
    (totalV > 1 ? `• 결말(${totalV}절): "${vLast.slice(0, 95)}${vLast.length > 95 ? '...' : ''}"` : "");

  const coreObservation =
    `본 장에서 반복적으로 강조되는 중심 소재는 '${topKeywords.join(", ")}'입니다. ` +
    `맥체인 통독 관점에서 볼 때, 이 본문은 ${matchedMotif.theme}의 흐름 속에서 하나님의 공의와 긍휼이 어떻게 역사하는지를 생생하게 보여줍니다.`;

  return {
    title,
    keywords: topKeywords,
    verseCount: totalV,
    summary,
    coreObservation,
    christConnection: matchedMotif.christ,
    questions: [
      `오늘 ${koBook} ${chNum}장의 핵심 소재인 '${topKeywords.slice(0, 3).join(", ")}'의 흐름 속에서 하나님이 나에게 깨닫게 하시는 경고나 약속은 무엇입니까?`,
      matchedMotif.q
    ]
  };
}

function buildAll1189Chapters() {
  const biblePath = path.join(process.cwd(), "src", "ko_ko.json");
  if (!fs.existsSync(biblePath)) {
    console.error("src/ko_ko.json 파일을 찾을 수 없습니다.");
    process.exit(1);
  }

  // UTF-8 BOM(\uFEFF) 및 비정상 제어문자 완벽 제거 후 JSON 파싱
  let rawContent = fs.readFileSync(biblePath, "utf-8");
  rawContent = rawContent.replace(/^\uFEFF/, "").trim();
  const firstBracket = rawContent.indexOf("[");
  if (firstBracket > 0) {
    rawContent = rawContent.slice(firstBracket);
  }

  let bibleData;
  try {
    bibleData = JSON.parse(rawContent);
  } catch (err) {
    // 혹시 문자열 내부에 이스케이프되지 않은 제어문자(탭/개행 등)가 섞여 있는 경우 정리
    const sanitized = rawContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    bibleData = JSON.parse(sanitized);
  }

  const outputDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chaptersDb = {};
  let totalChapters = 0;

  for (const bookObj of bibleData) {
    const [koBook, section] = BOOK_KO_MAP[bookObj.name] || [bookObj.name, "성경"];
    const chaps = bookObj.chapters || [];

    chaps.forEach((verses, idx) => {
      const chNum = idx + 1;
      const key = `${koBook}_${chNum}`;
      chaptersDb[key] = {
        bookKo: koBook,
        chapter: chNum,
        section,
        ...analyzeChapterContent(koBook, section, chNum, verses)
      };
      totalChapters++;
    });
  }

  const outFile = path.join(outputDir, "mcheyne_devotions.json");
  fs.writeFileSync(outFile, JSON.stringify({ chapters: chaptersDb }, null, 2), "utf-8");
  console.log(`[완료] 성경 66권 전체 ${totalChapters}장(1,189장) 고유 강해 데이터 생성 완료: ${outFile}`);
}

buildAll1189Chapters();
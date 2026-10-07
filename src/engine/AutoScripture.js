// src/engine/AutoScripture.js
import bibleData from '../ko_ko.json';
import { useNLEStore } from '../store/useNLEStore';

// 🌟 1. 한글 약어 및 정식 명칭 ➔ 영문 책 이름 완전 매핑 테이블
export const BIBLE_FULL_MAP = {
  "창": "Genesis", "창세기": "Genesis", "출": "Exodus", "출애굽기": "Exodus",
  "레": "Leviticus", "레위기": "Leviticus", "민": "Numbers", "민수기": "Numbers",
  "신": "Deuteronomy", "신명기": "Deuteronomy", "수": "Joshua", "여호수아": "Joshua",
  "삿": "Judges", "사사기": "Judges", "룻": "Ruth", "룻기": "Ruth",
  "삼상": "1 Samuel", "사무엘상": "1 Samuel", "삼하": "2 Samuel", "사무엘하": "2 Samuel",
  "왕상": "1 Kings", "열왕기상": "1 Kings", "왕하": "2 Kings", "열왕기하": "2 Kings",
  "대상": "1 Chronicles", "역대상": "1 Chronicles", "대하": "2 Chronicles", "역대하": "2 Chronicles",
  "스": "Ezra", "에스라": "Ezra", "느": "Nehemiah", "느헤미야": "Nehemiah",
  "에": "Esther", "에스더": "Esther", "욥": "Job", "욥기": "Job",
  "시": "Psalms", "시편": "Psalms", "잠": "Proverbs", "잠언": "Proverbs",
  "전": "Ecclesiastes", "전도서": "Ecclesiastes", "아": "Song of Solomon", "아가": "Song of Solomon",
  "사": "Isaiah", "이사야": "Isaiah", "렘": "Jeremiah", "예레미야": "Jeremiah",
  "애": "Lamentations", "예레미야애가": "Lamentations", "겔": "Ezekiel", "에스겔": "Ezekiel",
  "단": "Daniel", "다니엘": "Daniel", "호": "Hosea", "호세아": "Hosea",
  "욜": "Joel", "요엘": "Joel", "암": "Amos", "아모스": "Amos",
  "옵": "Obadiah", "오바댜": "Obadiah", "욘": "Jonah", "요나": "Jonah",
  "미": "Micah", "미가": "Micah", "나": "Nahum", "나훔": "Nahum",
  "합": "Habakkuk", "하박국": "Habakkuk", "습": "Zephaniah", "스바냐": "Zephaniah",
  "학": "Haggai", "학개": "Haggai", "슥": "Zechariah", "스가랴": "Zechariah",
  "말": "Malachi", "말라기": "Malachi",
  "마": "Matthew", "마태": "Matthew", "마태복음": "Matthew",
  "막": "Mark", "마가": "Mark", "마가복음": "Mark",
  "눅": "Luke", "누가": "Luke", "누가복음": "Luke",
  "요": "John", "요한": "John", "요한복음": "John",
  "행": "Acts", "사도행전": "Acts", "롬": "Romans", "로마서": "Romans",
  "고전": "1 Corinthians", "고린도전서": "1 Corinthians", "고후": "2 Corinthians", "고린도후서": "2 Corinthians",
  "갈": "Galatians", "갈라디아서": "Galatians", "엡": "Ephesians", "에베소서": "Ephesians",
  "빌": "Philippians", "빌립보서": "Philippians", "골": "Colossians", "골로새서": "Colossians",
  "살전": "1 Thessalonians", "데살로니가전서": "1 Thessalonians", "살후": "2 Thessalonians", "데살로니가후서": "2 Thessalonians",
  "딤전": "1 Timothy", "디모데전서": "1 Timothy", "딤후": "2 Timothy", "디모데후서": "2 Timothy",
  "딛": "Titus", "디도서": "Titus", "몬": "Philemon", "빌레몬서": "Philemon",
  "히": "Hebrews", "히브리서": "Hebrews", "약": "James", "야고보서": "James",
  "벧전": "1 Peter", "베드로전서": "1 Peter", "벧후": "2 Peter", "베드로후서": "2 Peter",
  "요일": "1 John", "요한일서": "1 John", "요이": "2 John", "요한이서": "2 John",
  "요삼": "3 John", "요한삼서": "3 John", "유": "Jude", "유다서": "Jude",
  "계": "Revelation", "요한계시록": "Revelation"
};

// 🌟 영문 책 이름 ➔ 한글 정식 명칭 역변환 테이블
export const BIBLE_KO_STANDARD_NAMES = {
  "Genesis": "창세기", "Exodus": "출애굽기", "Leviticus": "레위기", "Numbers": "민수기",
  "Deuteronomy": "신명기", "Joshua": "여호수아", "Judges": "사사기", "Ruth": "룻기",
  "1 Samuel": "사무엘상", "2 Samuel": "사무엘하", "1 Kings": "열왕기상", "2 Kings": "열왕기하",
  "1 Chronicles": "역대상", "2 Chronicles": "역대하", "Ezra": "에스라", "Nehemiah": "느헤미야",
  "Esther": "에스더", "Job": "욥기", "Psalms": "시편", "Proverbs": "잠언",
  "Ecclesiastes": "전도서", "Song of Solomon": "아가", "Isaiah": "이사야", "Jeremiah": "예레미야",
  "Lamentations": "예레미야애가", "Ezekiel": "에스겔", "Daniel": "다니엘", "Hosea": "호세아",
  "Joel": "요엘", "Amos": "아모스", "Obadiah": "오바댜", "Jonah": "요나",
  "Micah": "미가", "Nahum": "나훔", "Habakkuk": "하박국", "Zephaniah": "스바냐",
  "Haggai": "학개", "Zechariah": "스가랴", "Malachi": "말라기",
  "Matthew": "마태복음", "Mark": "마가복음", "Luke": "누가복음", "John": "요한복음",
  "Acts": "사도행전", "Romans": "로마서", "1 Corinthians": "고린도전서", "2 Corinthians": "고린도후서",
  "Galatians": "갈라디아서", "Ephesians": "에베소서", "Philippians": "빌립보서", "Colossians": "골로새서",
  "1 Thessalonians": "데살로니가전서", "2 Thessalonians": "데살로니가후서", "1 Timothy": "디모데전서", "2 Timothy": "디모데후서",
  "Titus": "디도서", "Philemon": "빌레몬서", "Hebrews": "히브리서", "James": "야고보서",
  "1 Peter": "베드로전서", "2 Peter": "베드로후서", "1 John": "요한일서", "2 John": "요한이서",
  "3 John": "요한삼서", "Jude": "유다서", "Revelation": "요한계시록"
};

// src/engine/AutoScripture.js 내 sanitizeBibleText 함수 교체

// 🌟 불필요한 괄호 주석((다윗의 시), (인도자를 따라) 등) 및 제어문자 완전 정제
const sanitizeBibleText = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\([^)]*\)/g, '') // 모든 괄호와 괄호 안 내용 완전 삭제
    .replace(/\[[^\]]*\]/g, '') // 모든 대괄호 내용 삭제
    .replace(/|'|\x1B/gi, '')
    .replace(/\s+/g, ' ') // 다중 공백 단일화
    .trim();
};

// 9:16 세로 화면 릴스 최적화 줄바꿈 포맷터 (한 줄당 16~18자 자동 개행)
export const formatScriptureForReels = (text, maxCharsPerLine = 17) => {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

/**
 * 2. 🌟 단일 성경 구절 정밀 검색 엔진
 * @param {string} bookQuery - 성경 책 이름 (예: '요', '요한복음', '창세기')
 * @param {number} chapter - 장 (Chapter)
 * @param {number} startVerse - 시작 절
 * @param {number} [endVerse] - 끝 절
 * @returns {{ standardBookName: string, label: string, fullText: string, verses: Array<{verseNum: number, text: string}> } | null}
 */
export const queryScripture = (bookQuery, chapter, startVerse, endVerse) => {
  const englishBookName = BIBLE_FULL_MAP[bookQuery.trim()];
  if (!englishBookName) return null;

  const standardBookName = BIBLE_KO_STANDARD_NAMES[englishBookName] || bookQuery;
  const targetBook = (bibleData || []).find(b => b.name === englishBookName);
  if (!targetBook?.chapters || !targetBook.chapters[chapter - 1]) return null;

  const chapterData = targetBook.chapters[chapter - 1];
  const totalVersesInChapter = chapterData.length;

  // 장 전체 조회 대응 (절이 지정되지 않은 경우, 예: '시편 23편')
  const actualStart = startVerse > 0 ? startVerse : 1;
  const actualEnd = endVerse ? Math.min(totalVersesInChapter, endVerse) : (startVerse > 0 ? startVerse : totalVersesInChapter);

  const verses = [];
  for (let v = actualStart; v <= actualEnd; v++) {
    const rawText = chapterData[v - 1];
    if (rawText) {
      verses.push({
        verseNum: v,
        text: sanitizeBibleText(rawText)
      });
    }
  }

  if (verses.length === 0) return null;

  const isSingle = actualStart === actualEnd;
  const label = isSingle 
    ? `${standardBookName} ${chapter}:${actualStart}`
    : `${standardBookName} ${chapter}:${actualStart}-${actualEnd}`;

  const fullText = verses.map(v => (isSingle ? v.text : `${v.verseNum}절. ${v.text}`)).join(' ');

  return { standardBookName, label, fullText, verses };
};

/**
 * 3. 🌟 기존 100% 하위 호환 자동 검색 및 다중 구절 인라인 치환 엔진
 * @param {string} inputText - 사용자 입력 문장
 * @param {Object} [options] - 포맷 옵션 ({ formatReels: true, standardName: true })
 * @returns {Promise<string>} 치환 및 포맷 완료된 텍스트
 */
export const checkAndFetchScripture = async (inputText, options = {}) => {
  if (!inputText || typeof inputText !== 'string') return '';

  // 🌟 고도화 정규식: '요 3:16', '요한복음 3장 16절', '창 1:1~3', '시편 23편', '롬 8장 1-2절' 완전 인식
  const regex = /([가-힣0-9]{1,6})\s*(\d+)\s*(?:[:장편])\s*(?:(\d+)\s*절?)?(?:\s*[-~]\s*(\d+)\s*절?)?/g;
  
  let resultText = inputText;
  const matches = [...inputText.matchAll(regex)];
  if (matches.length === 0) return inputText;

  for (const match of matches) {
    const fullMatchStr = match[0];
    const bookQuery = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const startVerse = match[3] ? parseInt(match[3], 10) : 0;
    const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

    const data = queryScripture(bookQuery, chapter, startVerse, endVerse);
    if (data) {
      const bookLabel = options.standardName !== false ? data.standardBookName : bookQuery;
      const refLabel = startVerse === 0 
        ? `[${bookLabel} ${chapter}편]`
        : startVerse === endVerse 
          ? `[${bookLabel} ${chapter}:${startVerse}]`
          : `[${bookLabel} ${chapter}:${startVerse}-${endVerse}]`;

      const formattedContent = options.formatReels 
        ? formatScriptureForReels(data.fullText) 
        : data.fullText;

      const replacement = `\n${refLabel}\n"${formattedContent}"\n`;

      // 인라인 치환 (원문 문맥 보존)
      resultText = resultText.replace(fullMatchStr, replacement.trim());
    }
  }

  return resultText.trim();
};

/**
 * 4. 🌟 타임라인 T1 트랙 성경 자막 원터치 자동 주입 엔진
 * @param {string} scriptureQuery - 성경 구절 검색어 (예: '요 3:16-17')
 * @param {Object} [options] - 타임라인 옵션
 * @param {string} [options.trackId='T1'] - 대상 자막 트랙
 * @param {number} [options.startTime=0] - 자막 시작 시간(초)
 * @param {number} [options.durationPerVerse=4.5] - 절당 노출 시간(초)
 * @param {string} [options.stylePreset='gold'] - 자막 스타일 ('gold', 'white', 'editorial')
 * @returns {number} 생성된 자막 클립 수
 */
export const injectScriptureToTimeline = (scriptureQuery, options = {}) => {
  const {
    trackId = 'T1',
    startTime = 0,
    durationPerVerse = 4.5,
    stylePreset = 'gold'
  } = options;

  const regex = /([가-힣0-9]{1,6})\s*(\d+)\s*(?:[:장편])\s*(?:(\d+)\s*절?)?(?:\s*[-~]\s*(\d+)\s*절?)?/;
  const match = scriptureQuery.match(regex);
  if (!match) return 0;

  const bookQuery = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : 0;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

  const data = queryScripture(bookQuery, chapter, startVerse, endVerse);
  if (!data || data.verses.length === 0) return 0;

  const state = useNLEStore.getState();
  const tracks = { ...(state.entities?.tracks || {}) };
  const clips = { ...(state.entities?.clips || {}) };

  // 트랙 생성 보장
  if (!tracks[trackId]) {
    tracks[trackId] = { id: trackId, name: trackId, type: 'text', clipIds: [] };
  }

  // 스타일 프리셋 정의
  const STYLES = {
    gold: {
      fontSize: 26,
      color: '#FFD700',
      strokeColor: '#3A2E00',
      strokeWidth: 2.2,
      backgroundColor: 'rgba(20, 15, 5, 0.8)',
      preset: 'editorial'
    },
    white: {
      fontSize: 26,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2.5,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      preset: 'reels_caption'
    },
    editorial: {
      fontSize: 28,
      color: '#F8FAFC',
      strokeColor: '#0F172A',
      strokeWidth: 2.0,
      backgroundColor: 'transparent',
      preset: 'editorial'
    }
  };

  const selectedStyle = STYLES[stylePreset] || STYLES.gold;
  let currentPlayhead = Math.max(0, startTime);
  const newClipIds = [];

  // 각 절별로 분할하여 9:16 최적화 릴스 자막 클립 생성
  data.verses.forEach((vItem, idx) => {
    const clipId = `scripture_${Date.now()}_${idx}`;
    const formattedVerseText = formatScriptureForReels(vItem.text);
    const content = `[${data.standardBookName} ${chapter}:${vItem.verseNum}]\n"${formattedVerseText}"`;

    const newClip = {
      id: clipId,
      type: 'text',
      content,
      start: Number(currentPlayhead.toFixed(2)),
      duration: durationPerVerse,
      trackId,
      style: {
        ...selectedStyle,
        align: 'center',
        lineHeight: 1.35
      },
      transform: { x: 0, y: 0, scale: 100, rotate: 0 },
      opacity: 100,
      animation: 'popIn'
    };

    clips[clipId] = newClip;
    newClipIds.push(clipId);
    currentPlayhead += durationPerVerse;
  });

  tracks[trackId].clipIds = [...(tracks[trackId].clipIds || []), ...newClipIds];

  // 프로젝트 전체 재생 시간 자동 확장 및 스토어 반영
  useNLEStore.setState({
    entities: { ...state.entities, tracks, clips },
    projectDuration: Math.max(state.projectDuration || 10, Number(currentPlayhead.toFixed(1)) + 1.0)
  });

  return newClipIds.length;
};
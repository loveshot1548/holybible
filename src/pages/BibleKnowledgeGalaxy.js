// src/pages/BibleKnowledgeGalaxy.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🎨 5대 시네마틱 스페이스 테마 팔레트
// =====================================================================
const GALAXY_THEMES = {
  oceano: {
    id: 'oceano',
    name: 'Oceano (딥 네이비)',
    bg: '#050811',
    orbitLine: 'rgba(56, 189, 248, 0.13)',
    textMain: '#F0F9FF',
    textSub: '#7DD3FC',
    accent: '#0284C7',
    panelBg: 'rgba(10, 16, 30, 0.92)',
    panelBorder: 'rgba(56, 189, 248, 0.25)'
  },
  neon: {
    id: 'neon',
    name: 'Neon Cyber (사이버)',
    bg: '#06040A',
    orbitLine: 'rgba(244, 114, 182, 0.15)',
    textMain: '#FDF2F8',
    textSub: '#F472B6',
    accent: '#DB2777',
    panelBg: 'rgba(18, 9, 24, 0.92)',
    panelBorder: 'rgba(236, 72, 153, 0.3)'
  },
  traktor: {
    id: 'traktor',
    name: 'Metálico (골드 앰버)',
    bg: '#090705',
    orbitLine: 'rgba(245, 158, 11, 0.14)',
    textMain: '#FFFBEB',
    textSub: '#FCD34D',
    accent: '#D97706',
    panelBg: 'rgba(22, 16, 10, 0.92)',
    panelBorder: 'rgba(245, 158, 11, 0.3)'
  },
  eden: {
    id: 'eden',
    name: 'Eden (에메랄드)',
    bg: '#040B08',
    orbitLine: 'rgba(16, 185, 129, 0.14)',
    textMain: '#ECFDF5',
    textSub: '#6EE7B7',
    accent: '#059669',
    panelBg: 'rgba(8, 22, 17, 0.92)',
    panelBorder: 'rgba(16, 185, 129, 0.28)'
  }
};

// =====================================================================
// 🏛️ 성경 66권 정경 8대 섹터 및 영-한 매핑
// =====================================================================
const CANON_SECTORS = [
  { id: 'law', name: '모세오경', color: '#38BDF8', angleStart: 0, angleEnd: 45, books: ['창세기', '출애굽기', '레위기', '민수기', '신명기'] },
  { id: 'ot_history', name: '구약 역사서', color: '#818CF8', angleStart: 45, angleEnd: 95, books: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'] },
  { id: 'poetry', name: '시가서', color: '#F472B6', angleStart: 95, angleEnd: 130, books: ['욥기', '시편', '잠언', '전도서', '아가'] },
  { id: 'prophets', name: '선지서', color: '#FB923C', angleStart: 130, angleEnd: 195, books: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'] },
  { id: 'gospels', name: '복음서·행전', color: '#34D399', angleStart: 195, angleEnd: 235, books: ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'] },
  { id: 'pauline', name: '바울서신', color: '#A78BFA', angleStart: 235, angleEnd: 300, books: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'] },
  { id: 'general', name: '공동서신', color: '#FBBF24', angleStart: 300, angleEnd: 345, books: ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서'] },
  { id: 'prophecy_nt', name: '예언서', color: '#E879F9', angleStart: 345, angleEnd: 360, books: ['요한계시록'] }
];

const KO_TO_EN_BOOK = {
  "창세기":"Genesis","출애굽기":"Exodus","레위기":"Leviticus","민수기":"Numbers","신명기":"Deuteronomy",
  "여호수아":"Joshua","사사기":"Judges","룻기":"Ruth","사무엘상":"1 Samuel","사무엘하":"2 Samuel",
  "열왕기상":"1 Kings","열왕기하":"2 Kings","역대상":"1 Chronicles","역대하":"2 Chronicles","에스라":"Ezra",
  "느헤미야":"Nehemiah","에스더":"Esther","욥기":"Job","시편":"Psalms","잠언":"Proverbs","전도서":"Ecclesiastes",
  "아가":"Song of Solomon","이사야":"Isaiah","예레미야":"Jeremiah","예레미야애가":"Lamentations","에스겔":"Ezekiel",
  "다니엘":"Daniel","호세아":"Hosea","요엘":"Joel","아모스":"Amos","오바댜":"Obadiah","요나":"Jonah",
  "미가":"Micah","나훔":"Nahum","하박국":"Habakkuk","스바냐":"Zephaniah","학개":"Haggai","스가랴":"Zechariah",
  "말라기":"Malachi","마태복음":"Matthew","마가복음":"Mark","누가복음":"Luke","요한복음":"John","사도행전":"Acts",
  "로마서":"Romans","고린도전서":"1 Corinthians","고린도후서":"2 Corinthians","갈라디아서":"Galatians",
  "에베소서":"Ephesians","빌립보서":"Philippians","골로새서":"Colossians","데살로니가전서":"1 Thessalonians",
  "데살로니가후서":"2 Thessalonians","디모데전서":"1 Timothy","디모데후서":"2 Timothy","디도서":"Titus",
  "빌레몬서":"Philemon","히브리서":"Hebrews","야고보서":"James","베드로전서":"1 Peter","베드로후서":"2 Peter",
  "요한일서":"1 John","요한이서":"2 John","요한삼서":"3 John","유다서":"Jude","요한계시록":"Revelation"
};

const ABBR_TO_KO_BOOK = {
  "창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기","수":"여호수아","삿":"사사기","룻":"룻기",
  "삼상":"사무엘상","삼하":"사무엘하","왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하",
  "스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편","잠":"잠언","전":"전도서","아":"아가",
  "사":"이사야","렘":"예레미야","애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘",
  "암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔","합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기",
  "마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음","행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서",
  "갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서","살전":"데살로니가전서","살후":"데살로니가후서",
  "딤전":"디모데전서","딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서","약":"야고보서",
  "벧전":"베드로전서","벧후":"베드로후서","요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"
};

const ORIGINAL_LANGUAGE_ROOTS = [
  { id: 'root_hesed', strongs: 'H2617', original: 'חֶסֶד', label: '헤세드 (언약적 사랑)', lang: '히브리어', meaning: '인애, 자비, 끝까지 포기하지 않으시는 하나님의 언약적 사랑', books: ['창세기', '룻기', '시편', '호세아'], color: '#EC4899', angle: 20 },
  { id: 'root_berit', strongs: 'H1285', original: 'בְּרִית', label: '베리트 (구속 언약)', lang: '히브리어', meaning: '쪼갠 고기 사이로 지나가시며 피로 맺으신 영원한 언약', books: ['창세기', '출애굽기', '신명기', '예레미야'], color: '#F43F5E', angle: 50 },
  { id: 'root_shalom', strongs: 'H7965', original: 'שָׁלוֹם', label: '샬롬 (참된 평강)', lang: '히브리어', meaning: '하나님과의 관계 회복에서 오는 온전함과 평화', books: ['민수기', '사사기', '시편', '이사야'], color: '#06B6D4', angle: 85 },
  { id: 'root_ruah', strongs: 'H7307', original: 'רוּחַ', label: '루아흐 (성령/생기)', lang: '히브리어', meaning: '하나님의 호흡, 마른 뼈를 살리는 창조적 생명의 영', books: ['창세기', '에스겔', '요엘'], color: '#10B981', angle: 120 },
  { id: 'root_qadosh', strongs: 'H6918', original: 'קָדוֹשׁ', label: '카도시 (거룩/구별)', lang: '히브리어', meaning: '세속과 구별된 하나님의 절대 성결과 영광', books: ['레위기', '이사야', '에스겔'], color: '#F59E0B', angle: 160 },
  { id: 'root_agape', strongs: 'G26', original: 'ἀγάπη', label: '아가페 (무조건적 사랑)', lang: '헬라어', meaning: '독생자를 내어주신 자기희생적이고 무조건적인 사랑', books: ['요한복음', '로마서', '고린도전서', '요한일서'], color: '#EF4444', angle: 200 },
  { id: 'root_charis', strongs: 'G5485', original: 'χάρις', label: '카리스 (값없는 은혜)', lang: '헬라어', meaning: '자격 없는 죄인에게 거저 베푸시는 구원의 선물', books: ['로마서', '에베소서', '갈라디아서'], color: '#8B5CF6', angle: 235 },
  { id: 'root_pistis', strongs: 'G4102', original: 'πίστις', label: '피스티스 (구원하는 믿음)', lang: '헬라어', meaning: '예수 그리스도를 전인격적으로 신뢰하고 의탁함', books: ['로마서', '갈라디아서', '히브리서', '야고보서'], color: '#3B82F6', angle: 265 },
  { id: 'root_basileia', strongs: 'G932', original: 'βασιλεία', label: '바실레이아 (하나님 나라)', lang: '헬라어', meaning: '그리스도를 통해 임한 하나님의 주권적 통치', books: ['마태복음', '마가복음', '누가복음', '사도행전'], color: '#10B981', angle: 295 },
  { id: 'root_stauros', strongs: 'G4716', original: 'σταυρός', label: '스타우로스 (십자가 대속)', lang: '헬라어', meaning: '죄의 저주를 끊으신 예수 그리스도의 피 묻은 십자가', books: ['마태복음', '고린도전서', '갈라디아서', '골로새서'], color: '#E11D48', angle: 325 },
  { id: 'root_logos', strongs: 'G3056', original: 'λόγος', label: '로고스 (성육신 말씀)', lang: '헬라어', meaning: '태초부터 계셨고 육신이 되어 우리 가운데 거하신 말씀', books: ['창세기', '요한복음', '요한일서', '요한계시록'], color: '#14B8A6', angle: 350 }
];

// 구절 문자열에서 한글 성경 권명과 장/절 추출
function extractBibleRefInfo(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return { bookKo: '창세기', chapter: 1, verse: 1 };
  const clean = rawStr.trim();

  // 전체 권명 우선 탐색
  for (const koName of Object.keys(KO_TO_EN_BOOK)) {
    if (clean.includes(koName)) {
      const after = clean.slice(clean.indexOf(koName) + koName.length);
      const m = after.match(/(\d+)\s*(?:장|:)?\s*(\d+)?/);
      return {
        bookKo: koName,
        chapter: m && m[1] ? parseInt(m[1], 10) : 1,
        verse: m && m[2] ? parseInt(m[2], 10) : 1
      };
    }
  }

  // 약어 탐색
  const abbrMatch = clean.match(/^([가-힣]{1,2})\s*(\d+)\s*(?:장|:)?\s*(\d+)?/);
  if (abbrMatch && ABBR_TO_KO_BOOK[abbrMatch[1]]) {
    return {
      bookKo: ABBR_TO_KO_BOOK[abbrMatch[1]],
      chapter: parseInt(abbrMatch[2], 10) || 1,
      verse: parseInt(abbrMatch[3], 10) || 1
    };
  }

  return { bookKo: '시편', chapter: 23, verse: 1 };
}

// 실제 성경 본문 조회 헬퍼
function getScripturePreview(bookKo, chapter = 1, verse = 1) {
  try {
    const enName = KO_TO_EN_BOOK[bookKo] || bookKo;
    const bookObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enName || b.name === bookKo) : null;
    if (!bookObj || !Array.isArray(bookObj.chapters)) return null;
    const chapArr = bookObj.chapters[Math.max(0, chapter - 1)];
    if (!Array.isArray(chapArr) || chapArr.length === 0) return null;
    const targetIdx = Math.max(0, Math.min(chapArr.length - 1, (verse || 1) - 1));
    const slices = chapArr.slice(targetIdx, targetIdx + 3).map((txt, idx) => ({
      vNum: targetIdx + idx + 1,
      text: String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
    }));
    return slices;
  } catch {
    return null;
  }
}

export default function BibleKnowledgeGalaxy({ setActiveScreen }) {
  const store = useAppStore();
  const { dailyData = {}, updateDay, readVerses = {}, bibleNotes = [], setBibleNotes } = store;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. 은하계 마스터 데이터 상태
  const [rawSermons, setRawSermons] = useState(null);
  const [customGalaxyNodes, setCustomGalaxyNodes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('goodtree_custom_galaxy_nodes') || '[]');
    } catch {
      return [];
    }
  });

  // 2. 선택 및 검색/필터 상태
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('all'); // 'all' | 'book' | 'sermon' | 'qt' | 'original_word'

  // 3. 모바일 친화형 드로어 & 등록 모달 상태
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 등록 폼 상태
  const [createType, setCreateType] = useState('qt'); // 'qt' | 'sermon' | 'bibleNote' | 'wiki'
  const [createBook, setCreateBook] = useState('창세기');
  const [createChap, setCreateChap] = useState(1);
  const [createVerse, setCreateVerse] = useState(1);
  const [createTitle, setCreateTitle] = useState('');
  const [createBody, setCreateBody] = useState('');
  const [createApply, setCreateApply] = useState('');

  // 4. 궤도 파라미터
  const [rotationSpeed, setRotationSpeed] = useState(0.15);
  const [orbitSpacing, setOrbitSpacing] = useState(1.0);
  const [nodeScale, setNodeScale] = useState(1.0);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('oceano');

  // 5. 카메라 & 멀티터치 제어 Ref
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.78 });
  const targetCameraRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const globalRotationRef = useRef(0);
  const nodePositionsRef = useRef(new Map());

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }, []);

  // 설교 요약 데이터 로드
  useEffect(() => {
    fetch('/sermon_summary.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setRawSermons(data); })
      .catch(() => {});
  }, []);

  // =====================================================================
  // 🌌 [통합 지식 그래프 엔진] 성경 66권 + 설교 + 나의 QT/예배노트 + 원어 실시간 결합
  // =====================================================================
  const galaxyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const BOOK_NODE_MAP = {};

    // 성경 권별 통독 장수 집계
    const bookReadCounts = {};
    Object.keys(readVerses || {}).forEach(k => {
      if (readVerses[k]) {
        const [enBk, ch] = k.split('-');
        const key = `${enBk}-${ch}`;
        bookReadCounts[key] = true;
      }
    });

    // [Orbit 0] 중심 코어
    nodes.push({
      id: 'core',
      label: '예수 그리스도 (구속사)',
      level: 0,
      radius: 0,
      angle: 0,
      size: 34,
      color: '#FFFFFF',
      type: 'core',
      desc: '성경 66권과 모든 설교, 성도의 QT와 기도가 수렴하는 구속사의 중심축입니다.'
    });

    // [Orbit 1 & 2] 8대 정경 대분류 & 성경 66권
    CANON_SECTORS.forEach((sec) => {
      const midAngle = (sec.angleStart + sec.angleEnd) / 2;
      const secNodeId = `sector_${sec.id}`;

      nodes.push({
        id: secNodeId,
        label: sec.name,
        level: 1,
        radius: 135,
        angle: midAngle,
        size: 19,
        color: sec.color,
        type: 'sector',
        books: sec.books,
        desc: `${sec.name} (${sec.books.length}권)`
      });
      links.push({ source: 'core', target: secNodeId, color: sec.color, alpha: 0.35 });

      const stepAngle = (sec.angleEnd - sec.angleStart) / (sec.books.length + 1);
      sec.books.forEach((bookName, bIdx) => {
        const bookAngle = sec.angleStart + stepAngle * (bIdx + 1);
        const bookNodeId = `book_${bookName}`;
        BOOK_NODE_MAP[bookName] = bookNodeId;

        const enBook = KO_TO_EN_BOOK[bookName] || bookName;
        const bObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enBook) : null;
        const totalChaps = bObj?.chapters?.length || 1;
        let readChaps = 0;
        for (let c = 1; c <= totalChaps; c++) {
          if (bookReadCounts[`${enBook}-${c}`]) readChaps++;
        }

        nodes.push({
          id: bookNodeId,
          label: bookName,
          bookName: bookName,
          enBookName: enBook,
          totalChaps,
          readChaps,
          level: 2,
          radius: 255,
          angle: bookAngle,
          size: 12 + Math.min(6, readChaps * 0.4),
          color: sec.color,
          type: 'book',
          sector: sec.name,
          desc: `${sec.name} • 총 ${totalChaps}장 중 ${readChaps}장 통독 완료`
        });
        links.push({ source: secNodeId, target: bookNodeId, color: sec.color, alpha: 0.28 });
      });
    });

    // [Orbit 3] 설교 아카이브 노드 (sermon_summary.json 연동)
    let sermonCount = 0;
    const sermonIndex = rawSermons?.index || {};
    Object.entries(sermonIndex).forEach(([refKey, sermonList]) => {
      if (!Array.isArray(sermonList) || sermonList.length === 0) return;
      const { bookKo, chapter, verse } = extractBibleRefInfo(refKey);
      const targetBookNodeId = BOOK_NODE_MAP[bookKo];
      if (!targetBookNodeId) return;

      const parentBookNode = nodes.find(n => n.id === targetBookNodeId);
      sermonList.slice(0, 2).forEach((sermon, idx) => {
        if (sermonCount > 160) return; // 모바일 60FPS 쾌적성 유지
        sermonCount++;
        const sermonId = `sermon_${sermonCount}`;
        const jitterAngle = (parentBookNode?.angle || 0) + ((sermonCount % 5) - 2) * 1.8;

        nodes.push({
          id: sermonId,
          label: sermon.title || `${refKey} 강해`,
          sermonTitle: sermon.title || `${refKey} 설교`,
          preacher: sermon.preacher || '담임목사',
          date: sermon.date || '',
          ref: refKey,
          bookName: bookKo,
          chapter,
          verse,
          summary: sermon.summary || sermon.oneLineSummary || sermon.content || '선포된 말씀 요약',
          level: 3,
          radius: 370 + (sermonCount % 3) * 18,
          angle: jitterAngle,
          size: 8.5,
          color: '#34D399',
          type: 'sermon'
        });
        links.push({ source: targetBookNodeId, target: sermonId, color: '#34D399', alpha: 0.35 });
      });
    });

    // [Orbit 4] 사용자의 실제 QT / 예배노트 / 성경노트 자동 연동
    let qtCount = 0;
    Object.entries(dailyData || {}).forEach(([dateKey, dVal]) => {
      if (!dVal) return;

      // 1) 매일 QT 기록 연동
      if (dVal.qtTitle || dVal.qtMeditation || dVal.qtApplication) {
        qtCount++;
        const refInfo = extractBibleRefInfo(dVal.qtReference || dVal.qtTitle || '시편 23:1');
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_시편';
        const parentBook = nodes.find(n => n.id === targetBookId);
        const qtNodeId = `my_qt_${dateKey}`;

        nodes.push({
          id: qtNodeId,
          label: dVal.qtTitle || `${dateKey} QT`,
          date: dateKey,
          ref: dVal.qtReference || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
          bookName: refInfo.bookKo,
          chapter: refInfo.chapter,
          verse: refInfo.verse,
          summary: dVal.qtMeditation || '나의 QT 묵상 기록',
          application: dVal.qtApplication || '',
          level: 4,
          radius: 455 + (qtCount % 2) * 16,
          angle: (parentBook?.angle || 90) + ((qtCount % 5) - 2) * 2.2,
          size: 11,
          color: '#F43F5E',
          type: 'qt'
        });
        links.push({ source: targetBookId, target: qtNodeId, color: '#F43F5E', alpha: 0.55 });
      }

      // 2) 내가 쓴 주일/수요 예배 노트 연동
      if (dVal.sermonTitle || dVal.sermonNotes) {
        qtCount++;
        const refInfo = extractBibleRefInfo(dVal.sermonReference || dVal.sermonTitle || '요한복음 3:16');
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_요한복음';
        const parentBook = nodes.find(n => n.id === targetBookId);
        const sNoteId = `my_sermon_note_${dateKey}`;

        nodes.push({
          id: sNoteId,
          label: `[예배노트] ${dVal.sermonTitle || dateKey}`,
          date: dateKey,
          preacher: dVal.sermonPreacher || '목사님',
          ref: dVal.sermonReference || `${refInfo.bookKo} ${refInfo.chapter}장`,
          bookName: refInfo.bookKo,
          chapter: refInfo.chapter,
          verse: refInfo.verse,
          summary: String(dVal.sermonNotes || '').replace(/<[^>]*>?/gm, '').slice(0, 220),
          level: 4,
          radius: 475,
          angle: (parentBook?.angle || 180) + 2.5,
          size: 11,
          color: '#F59E0B',
          type: 'qt'
        });
        links.push({ source: targetBookId, target: sNoteId, color: '#F59E0B', alpha: 0.55 });
      }
    });

    // 3) 은하계에서 직접 추가한 커스텀 노드 결합
    (customGalaxyNodes || []).forEach((cNode, idx) => {
      const targetBookId = BOOK_NODE_MAP[cNode.bookName] || 'book_창세기';
      const parentBook = nodes.find(n => n.id === targetBookId);
      const nodeId = cNode.id || `custom_${idx}`;

      nodes.push({
        ...cNode,
        id: nodeId,
        level: cNode.type === 'sermon' ? 3 : 4,
        radius: cNode.type === 'sermon' ? 385 : 465,
        angle: (parentBook?.angle || 45) + ((idx % 5) - 2) * 2.5,
        size: 12,
        color: cNode.color || (cNode.type === 'qt' ? '#F43F5E' : cNode.type === 'sermon' ? '#34D399' : '#38BDF8')
      });
      links.push({ source: targetBookId, target: nodeId, color: cNode.color || '#F43F5E', alpha: 0.6 });
    });

    // [Orbit 5] 11대 원어 성운 (히브리어/헬라어 핵심 어근)
    ORIGINAL_LANGUAGE_ROOTS.forEach((root) => {
      nodes.push({
        id: root.id,
        label: `${root.original} ${root.label.split(' ')[0]}`,
        original: root.original,
        strongs: root.strongs,
        lang: root.lang,
        koreanName: root.label,
        desc: root.meaning,
        books: root.books,
        level: 5,
        radius: 545,
        angle: root.angle,
        size: 18,
        color: root.color,
        type: 'original_word'
      });

      links.push({ source: 'core', target: root.id, color: root.color, alpha: 0.12, dashed: true });
      root.books.forEach(bName => {
        if (BOOK_NODE_MAP[bName]) {
          links.push({ source: root.id, target: BOOK_NODE_MAP[bName], color: root.color, alpha: 0.32 });
        }
      });
    });

    return { nodes, links };
  }, [rawSermons, dailyData, readVerses, customGalaxyNodes]);

  // 선택된 노드와 직결된 이웃 노드 집합 계산
  const connectedNodeIds = useMemo(() => {
    const set = new Set();
    if (!selectedNode) return set;
    set.add(selectedNode.id);
    galaxyData.links.forEach(l => {
      if (l.source === selectedNode.id) set.add(l.target);
      if (l.target === selectedNode.id) set.add(l.source);
    });
    return set;
  }, [selectedNode, galaxyData]);

  // 선택된 노드에 연결된 실제 노드 객체 리스트
  const connectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    return galaxyData.nodes.filter(n => n.id !== selectedNode.id && connectedNodeIds.has(n.id));
  }, [selectedNode, galaxyData, connectedNodeIds]);

  const theme = GALAXY_THEMES[currentTheme] || GALAXY_THEMES.oceano;

  // =====================================================================
  // 🔄 60FPS 시네마틱 캔버스 렌더링 루프 (스무스 Fly-To & 성간 펄스)
  // =====================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !galaxyData) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let pulseTick = 0;

    const render = () => {
      pulseTick += 0.03;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // 카메라 부드러운 이동 보간 (Fly-To)
      if (targetCameraRef.current) {
        cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * 0.12;
        cameraRef.current.zoom += (targetCameraRef.current.zoom - cameraRef.current.zoom) * 0.12;
        if (
          Math.abs(targetCameraRef.current.x - cameraRef.current.x) < 0.5 &&
          Math.abs(targetCameraRef.current.y - cameraRef.current.y) < 0.5 &&
          Math.abs(targetCameraRef.current.zoom - cameraRef.current.zoom) < 0.01
        ) {
          targetCameraRef.current = null;
        }
      }

      // 1. 배경 클리어
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + cameraRef.current.x, height / 2 + cameraRef.current.y);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      // 공전 각도 업데이트 (노드가 선택되어 있을 때는 읽기 편하도록 공전 감속)
      const effectiveSpeed = selectedNode ? rotationSpeed * 0.15 : rotationSpeed;
      globalRotationRef.current += effectiveSpeed * 0.0025;
      const rot = globalRotationRef.current;

      // 2. 5대 동심원 궤도 가이드 링
      const ORBIT_INFO = [
        { r: 135, name: 'ORBIT 1 • 8대 정경 분류' },
        { r: 255, name: 'ORBIT 2 • 성경 66권' },
        { r: 380, name: 'ORBIT 3 • 설교 아카이브' },
        { r: 465, name: 'ORBIT 4 • 나의 QT & 묵상노트' },
        { r: 545, name: 'ORBIT 5 • 히브리/헬라 원어 성운' }
      ];

      ORBIT_INFO.forEach((orb) => {
        const r = orb.r * orbitSpacing;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = theme.orbitLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = theme.textSub;
        ctx.globalAlpha = 0.35;
        ctx.textAlign = 'center';
        ctx.fillText(orb.name, 0, -r + 11);
        ctx.globalAlpha = 1.0;
      });

      // 3. 노드 좌표 계산
      const posMap = new Map();
      galaxyData.nodes.forEach(node => {
        const adjustedRadius = node.radius * orbitSpacing;
        const speedFactor = node.level > 0 ? 1 / Math.sqrt(node.level) : 0;
        const angleRad = ((node.angle + (rot * 180 / Math.PI) * speedFactor) * Math.PI) / 180;
        const nx = adjustedRadius * Math.cos(angleRad);
        const ny = adjustedRadius * Math.sin(angleRad);
        posMap.set(node.id, { x: nx, y: ny, ...node });
      });
      nodePositionsRef.current = posMap;

      // 4. 링크(성간 연결선) 렌더링
      galaxyData.links.forEach(link => {
        const src = posMap.get(link.source);
        const tgt = posMap.get(link.target);
        if (!src || !tgt) return;

        const isHighlightedLink = selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        ctx.quadraticCurveTo(midX * 0.85, midY * 0.85, tgt.x, tgt.y);

        ctx.strokeStyle = isHighlightedLink ? '#FDE047' : (link.color || theme.orbitLine);
        ctx.globalAlpha = isHighlightedLink ? 0.85 : selectedNode ? 0.05 : (link.alpha || 0.22);
        ctx.lineWidth = isHighlightedLink ? 2.2 : link.dashed ? 0.8 : 1.1;
        if (link.dashed && !isHighlightedLink) ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      });

      // 5. 노드 렌더링
      const isSearchActive = searchQuery.trim().length > 0;
      const lowerQuery = searchQuery.toLowerCase().trim();

      posMap.forEach(node => {
        const matchesFilter = orbitFilter === 'all' || node.type === orbitFilter || node.type === 'core';
        const isMatchedSearch = isSearchActive && (
          node.label.toLowerCase().includes(lowerQuery) ||
          (node.summary && node.summary.toLowerCase().includes(lowerQuery)) ||
          (node.ref && node.ref.toLowerCase().includes(lowerQuery)) ||
          (node.desc && node.desc.toLowerCase().includes(lowerQuery))
        );

        const isSelected = selectedNode?.id === node.id;
        const isNeighbor = selectedNode && connectedNodeIds.has(node.id);

        let alpha = 1.0;
        if (!matchesFilter) alpha = 0.08;
        else if (isSearchActive && !isMatchedSearch) alpha = 0.12;
        else if (selectedNode && !isSelected && !isNeighbor) alpha = 0.15;

        const baseSize = (node.size || 10) * nodeScale;
        const pulseBoost = isSelected ? Math.sin(pulseTick * 3) * 2.5 : 0;
        const effectiveSize = baseSize * (isMatchedSearch ? 1.45 : isSelected ? 1.4 : isNeighbor ? 1.15 : 1.0) + pulseBoost;

        // 오라 글로우
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveSize * 1.75, 0, Math.PI * 2);
        ctx.fillStyle = isMatchedSearch ? '#FDE047' : (node.color || '#38BDF8');
        ctx.globalAlpha = alpha * (isSelected || isMatchedSearch ? 0.55 : 0.18);
        ctx.fill();

        // 노드 코어 원형
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = isMatchedSearch ? '#FDE047' : (node.color || '#FFFFFF');
        ctx.globalAlpha = alpha;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#000000';
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // 라벨 표시 조건
        const shouldShowLabel =
          showAllLabels ||
          node.level <= 2 ||
          node.type === 'original_word' ||
          node.type === 'qt' ||
          isMatchedSearch ||
          isSelected ||
          isNeighbor ||
          cameraRef.current.zoom > 1.35;

        if (shouldShowLabel && alpha > 0.2) {
          ctx.font = `${node.level <= 1 || isSelected ? 'bold 11px' : '10px'} sans-serif`;
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : theme.textMain;
          ctx.globalAlpha = Math.min(1, alpha + 0.15);
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + effectiveSize / 2 + 11);
        }
        ctx.globalAlpha = 1.0;
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [galaxyData, rotationSpeed, orbitSpacing, nodeScale, showAllLabels, currentTheme, searchQuery, orbitFilter, selectedNode, connectedNodeIds, theme]);

  // 캔버스 리사이즈
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 모바일 화면이면 초기 줌을 살짝 넓게 조정
    if (rect.width < 640 && cameraRef.current.zoom === 0.78) {
      cameraRef.current.zoom = 0.58;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 특정 노드로 카메라 부드럽게 포커싱
  const focusCameraOnNode = useCallback((node) => {
    if (!node) return;
    const pos = nodePositionsRef.current.get(node.id);
    if (pos) {
      const targetZoom = Math.max(cameraRef.current.zoom, 1.15);
      targetCameraRef.current = {
        x: -pos.x * targetZoom,
        y: -pos.y * targetZoom - 40, // 하단 시트 공간 확보
        zoom: targetZoom
      };
    }
    setSelectedNode(node);
  }, []);

  // =====================================================================
  // 🖐️ 마우스 휠 & 모바일 멀티터치 핀치 줌 / 드래그 핸들러
  // =====================================================================
  const handleWheel = (e) => {
    e.preventDefault();
    targetCameraRef.current = null;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    cameraRef.current.zoom = Math.min(3.2, Math.max(0.32, cameraRef.current.zoom * zoomFactor));
  };

  const handleTouchStart = (e) => {
    targetCameraRef.current = null;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
      isDraggingRef.current = false;
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragMovedRef.current = false;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchDistRef.current;
      cameraRef.current.zoom = Math.min(3.2, Math.max(0.32, cameraRef.current.zoom * ratio));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
    isDraggingRef.current = false;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    targetCameraRef.current = null;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch' || !isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 5) dragMovedRef.current = true;
    cameraRef.current.x += dx;
    cameraRef.current.y += dy;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasClick = (e) => {
    if (dragMovedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const worldX = (clickX - (width / 2 + cameraRef.current.x)) / cameraRef.current.zoom;
    const worldY = (clickY - (height / 2 + cameraRef.current.y)) / cameraRef.current.zoom;

    let closestNode = null;
    let minDist = 26 / Math.sqrt(cameraRef.current.zoom);

    nodePositionsRef.current.forEach(node => {
      if (orbitFilter !== 'all' && node.type !== orbitFilter && node.type !== 'core') return;
      const dist = Math.hypot(worldX - node.x, worldY - node.y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    if (closestNode) {
      focusCameraOnNode(closestNode);
    } else {
      setSelectedNode(null);
    }
  };

  // =====================================================================
  // ⚡ [심층 연동 액션] 성경·원어·QT·실천트래커 즉시 점프 및 저장
  // =====================================================================
  const handleJumpToBibleChapter = (bookKo, chap = 1) => {
    const enBook = KO_TO_EN_BOOK[bookKo] || 'Genesis';
    try {
      localStorage.setItem('bible_jump_target', `${enBook}-${chap}`);
    } catch {}
    setActiveScreen('bible');
  };

  const handleJumpToInterlinear = (bookKo = '창세기', chap = 1, verse = 1) => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: bookKo,
        chapter: Number(chap) || 1,
        verse: Number(verse) || 1
      }));
    } catch {}
    setActiveScreen('interlinear');
  };

  const handleRegisterApplyAction = (node) => {
    try {
      const items = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        text: `[은하계 말씀 결단: ${node.label}] ${node.application || node.summary || node.desc || '오늘 말씀대로 순종하기'}`,
        category: '말씀과 순종',
        source: 'knowledge_galaxy',
        completed: false
      };
      localStorage.setItem('apply_tracker_items', JSON.stringify([newItem, ...items]));
      window.dispatchEvent(new Event('storage'));
      showToast('🎯 삶의 실천 트래커에 순종 과제로 등록되었습니다!');
    } catch {
      showToast('실천 과제 등록 중 오류가 발생했습니다.');
    }
  };

  // =====================================================================
  // ➕ [통합 등록 엔진] 은하계 안에서 QT / 설교 / 성경노트 / 위키 즉시 생성
  // =====================================================================
  const handleSaveNewKnowledgeNode = () => {
    if (!createTitle.trim() && !createBody.trim()) {
      return alert('제목이나 묵상 내용을 입력해주세요.');
    }

    const todayKey = new Date().toISOString().split('T')[0];
    const refStr = `${createBook} ${createChap}:${createVerse}`;
    const finalTitle = createTitle.trim() || `${refStr} 묵상`;
    const finalBody = createBody.trim();

    // 1. 앱 실제 스토어(QT, 예배노트, 성경노트)에 동시 저장
    if (createType === 'qt' && updateDay) {
      const cur = dailyData[todayKey] || {};
      updateDay(todayKey, {
        ...cur,
        qtTitle: finalTitle,
        qtReference: refStr,
        qtMeditation: finalBody,
        qtApplication: createApply.trim(),
        checks: { ...(cur.checks || {}), QTin: true }
      });
    } else if (createType === 'sermon' && updateDay) {
      const cur = dailyData[todayKey] || {};
      updateDay(todayKey, {
        ...cur,
        sermonTitle: finalTitle,
        sermonReference: refStr,
        sermonNotes: finalBody
      });
    } else if (createType === 'bibleNote' && setBibleNotes) {
      const newBibleNote = {
        id: Date.now(),
        date: todayKey,
        verses: [{ ref: refStr, text: finalTitle }],
        note: finalBody
      };
      setBibleNotes([newBibleNote, ...(Array.isArray(bibleNotes) ? bibleNotes : [])]);
    }

    // 2. 실천 과제가 입력되었으면 ApplyTracker에도 동시 등록
    if (createApply.trim()) {
      try {
        const items = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
        items.unshift({
          id: Date.now() + 1,
          date: todayKey,
          text: `[${refStr}] ${createApply.trim()}`,
          category: '말씀과 순종',
          completed: false
        });
        localStorage.setItem('apply_tracker_items', JSON.stringify(items));
      } catch {}
    }

    // 3. 은하계 커스텀 별자리 노드에 영구 추가
    const newGalaxyNode = {
      id: `custom_star_${Date.now()}`,
      label: finalTitle,
      type: createType === 'sermon' ? 'sermon' : 'qt',
      bookName: createBook,
      chapter: Number(createChap) || 1,
      verse: Number(createVerse) || 1,
      ref: refStr,
      date: todayKey,
      summary: finalBody,
      application: createApply.trim(),
      color: createType === 'qt' ? '#F43F5E' : createType === 'sermon' ? '#34D399' : '#38BDF8'
    };

    const nextCustom = [newGalaxyNode, ...customGalaxyNodes];
    setCustomGalaxyNodes(nextCustom);
    localStorage.setItem('goodtree_custom_galaxy_nodes', JSON.stringify(nextCustom));

    // 초기화 및 방금 만든 별로 카메라 포커스
    setCreateTitle('');
    setCreateBody('');
    setCreateApply('');
    setIsCreatorOpen(false);
    showToast(`✨ [${finalTitle}] 별자리가 은하계와 앱 노트에 동시 등록되었습니다!`);
    setTimeout(() => focusCameraOnNode(newGalaxyNode), 180);
  };

  // 선택된 노드의 성경 본문 미리보기
  const selectedScriptureVerses = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.bookName) {
      return getScripturePreview(selectedNode.bookName, selectedNode.chapter || 1, selectedNode.verse || 1);
    }
    return null;
  }, [selectedNode]);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden select-none font-sans" style={{ backgroundColor: theme.bg }}>
      
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-bold border border-cyan-400/40 shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. 메인 60FPS 은하계 캔버스 뷰포트 ── */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* ── 2. 모바일/데스크톱 반응형 슬림 상단 네비게이션 & 궤도 필터 바 ── */}
      <div className="absolute top-2.5 inset-x-2.5 sm:top-4 sm:inset-x-4 z-30 flex flex-col gap-2 pointer-events-none">
        
        {/* 1열: 뒤로가기 + 실시간 검색창 + 등록 버튼 + 설정 토글 */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 pointer-events-auto">
          <button
            onClick={() => setActiveScreen('home')}
            className="h-9 px-3 rounded-xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1 shrink-0"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
          >
            ◀ <span className="hidden sm:inline">홈으로</span>
          </button>

          {/* 검색창 */}
          <div 
            className="flex-1 max-w-md h-9 px-3 rounded-xl border backdrop-blur-md flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}
          >
            <span className="text-xs opacity-60">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="성경, 설교, 나의 QT, 원어(헤세드) 검색..."
              className="w-full bg-transparent outline-none text-xs font-medium text-white placeholder:text-slate-400 select-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">✕</button>
            )}
          </div>

          {/* ➕ 새 지식/묵상 별자리 등록 버튼 */}
          <button
            onClick={() => {
              if (selectedNode?.bookName) setCreateBook(selectedNode.bookName);
              setIsCreatorOpen(true);
            }}
            className="h-9 px-3 sm:px-3.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>➕</span>
            <span>등록</span>
          </button>

          {/* ⚙️ 궤도 제어판 토글 버튼 */}
          <button
            onClick={() => setIsControlOpen(!isControlOpen)}
            className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1 shrink-0 ${
              isControlOpen ? 'ring-2 ring-cyan-400' : ''
            }`}
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
            title="궤도 및 테마 제어"
          >
            <span>⚙️</span>
            <span className="hidden md:inline">제어판</span>
          </button>
        </div>

        {/* 2열: 궤도 레이어 원터치 필터 칩 (모바일 가로 스크롤) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 pointer-events-auto">
          {[
            { id: 'all', label: `🌌 전체 (${galaxyData.nodes.length})` },
            { id: 'book', label: '📖 성경 66권' },
            { id: 'sermon', label: '🎙️ 설교 아카이브' },
            { id: 'qt', label: '🔥 나의 QT·예배노트' },
            { id: 'original_word', label: '🏛️ 히브리·헬라 원어' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrbitFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                orbitFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md'
                  : 'text-slate-300 hover:text-white opacity-80'
              }`}
              style={orbitFilter !== tab.id ? { backgroundColor: theme.panelBg, borderColor: theme.panelBorder } : {}}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => {
              targetCameraRef.current = { x: 0, y: 0, zoom: window.innerWidth < 640 ? 0.58 : 0.78 };
              setSelectedNode(null);
            }}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}
          >
            🎯 중심 리셋
          </button>
        </div>
      </div>

      {/* ── 3. 접이식 궤도 컨트롤러 드로어 (모바일 화면 가림 해결) ── */}
      {isControlOpen && (
        <div 
          className="absolute top-24 right-2.5 sm:right-4 z-40 w-72 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-3.5 text-xs text-left animate-fade-in"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.panelBorder }}>
            <span className="font-black text-xs tracking-wider uppercase text-cyan-400">⚙️ 은하 궤도 컨트롤러</span>
            <button onClick={() => setIsControlOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">공전 속도 (ORBIT SPEED)</span>
              <span>{rotationSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">궤도 간격 (ORBIT RADIUS)</span>
              <span>{orbitSpacing.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0.6" max="1.6" step="0.05"
              value={orbitSpacing}
              onChange={(e) => setOrbitSpacing(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">별 크기 (NODE SIZE)</span>
              <span>{nodeScale.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0.6" max="2.0" step="0.1"
              value={nodeScale}
              onChange={(e) => setNodeScale(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-[11px] font-bold opacity-85">모든 별 이름 항상 표시</span>
            <input
              type="checkbox"
              checked={showAllLabels}
              onChange={(e) => setShowAllLabels(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </label>

          <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: theme.panelBorder }}>
            <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">우주 테마 (THEME)</span>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(GALAXY_THEMES).map(th => (
                <button
                  key={th.id}
                  onClick={() => setCurrentTheme(th.id)}
                  className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer truncate ${
                    currentTheme === th.id ? 'ring-2 ring-cyan-400 bg-white/15' : 'bg-black/30 opacity-70 hover:opacity-100'
                  }`}
                  style={{ borderColor: th.panelBorder, color: th.textMain }}
                >
                  {th.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ➕ 새 말씀·설교·QT·원어 별자리 통합 등록 모달 ── */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div 
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border p-5 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: theme.panelBorder }}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">SECOND BRAIN CREATOR</span>
                <h3 className="text-base font-black">➕ 은하계 새 말씀·설교·QT 등록</h3>
              </div>
              <button onClick={() => setIsCreatorOpen(false)} className="text-sm opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
            </div>

            {/* 등록 유형 선택 */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'qt', label: '🔥 오늘의 QT' },
                { id: 'sermon', label: '🎙️ 설교 노트' },
                { id: 'bibleNote', label: '📖 성경 묵상' }
              ].map(tItem => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setCreateType(tItem.id)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    createType === tItem.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md'
                      : 'bg-black/40 border-white/10 text-slate-300'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            {/* 연결할 성경 권 / 장 / 절 선택 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">연결할 성경 (66권)</label>
                <select
                  value={createBook}
                  onChange={(e) => setCreateBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                >
                  {Object.keys(KO_TO_EN_BOOK).map(bName => (
                    <option key={bName} value={bName} className="bg-slate-900 text-white">{bName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">장 (Chapter)</label>
                <input
                  type="number" min="1" max="150"
                  value={createChap}
                  onChange={(e) => setCreateChap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">절 (Verse)</label>
                <input
                  type="number" min="1" max="176"
                  value={createVerse}
                  onChange={(e) => setCreateVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">
                {createType === 'qt' ? 'QT 제목 / 핵심 메시지' : createType === 'sermon' ? '설교 제목' : '묵상 주제'}
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="예: 광야에서 만나주신 하나님의 헤세드 은혜"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-black/40 border border-white/15 text-white outline-none select-text"
              />
            </div>

            {/* 본문 묵상 / 요약 입력 */}
            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">깨달은 말씀 & 심층 묵상 내용</label>
              <textarea
                rows={3}
                value={createBody}
                onChange={(e) => setCreateBody(e.target.value)}
                placeholder="말씀을 통해 깨달은 은혜나 설교 핵심 요약을 기록하세요..."
                className="w-full p-3 rounded-xl text-xs leading-relaxed bg-black/40 border border-white/15 text-white outline-none resize-none select-text"
              />
            </div>

            {/* 구체적 적용 / 실천 결단 */}
            <div>
              <label className="text-[10.5px] font-bold text-emerald-400 block mb-1">🎯 오늘 나의 삶에 적용할 구체적 실천 (선택)</label>
              <input
                type="text"
                value={createApply}
                onChange={(e) => setCreateApply(e.target.value)}
                placeholder="입력 시 '적용 질문 트래커'에도 자동으로 함께 등록됩니다."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 outline-none select-text"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNewKnowledgeNode}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 shadow-lg cursor-pointer"
              >
                ✨ 은하계 & 앱 노트에 동시 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. 선택된 노드 심층 인스펙터 바텀 시트 (성경 본문 미리보기 + 연결 성운 + 직결 액션) ── */}
      {selectedNode && (
        <div 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-xl p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-3 animate-fade-in text-left max-h-[56vh] overflow-y-auto hide-scrollbar"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {/* 상단 타이틀 헤더 */}
          <div className="flex justify-between items-start border-b pb-2.5" style={{ borderColor: theme.panelBorder }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-4 h-4 rounded-full shrink-0 shadow-md" style={{ backgroundColor: selectedNode.color }} />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-65 block">
                  {selectedNode.type === 'book' ? `BIBLE • ${selectedNode.sector}` :
                   selectedNode.type === 'sermon' ? `SERMON • ${selectedNode.ref}` :
                   selectedNode.type === 'qt' ? `MY QT / NOTE • ${selectedNode.date || ''}` :
                   selectedNode.type === 'original_word' ? `${selectedNode.lang} • ${selectedNode.strongs}` :
                   `ORBIT LEVEL ${selectedNode.level}`}
                </span>
                <h3 className="text-sm sm:text-base font-black truncate">{selectedNode.label}</h3>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1">✕</button>
          </div>

          {/* 1) 성경 본문 실시간 미리보기 (성경, 설교, QT 노드 공통) */}
          {selectedScriptureVerses && selectedScriptureVerses.length > 0 && (
            <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] font-bold text-amber-400">
                  📖 {selectedNode.bookName} {selectedNode.chapter || 1}장 본문 미리보기
                </span>
                <span className="text-[9.5px] font-mono opacity-60">개역개정</span>
              </div>
              {selectedScriptureVerses.map(v => (
                <p key={v.vNum} className="text-xs font-serif leading-relaxed text-slate-200 break-keep select-text">
                  <b className="text-amber-400 mr-1.5 font-mono">{v.vNum}</b>
                  {v.text}
                </p>
              ))}
            </div>
          )}

          {/* 2) 설교 / QT / 원어 상세 요약문 */}
          {(selectedNode.summary || selectedNode.desc) && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
              <p className="leading-relaxed break-keep select-text text-slate-100">
                {selectedNode.summary || selectedNode.desc}
              </p>
              {selectedNode.application && (
                <p className="text-emerald-300 font-bold pt-1 border-t border-white/10">
                  🎯 나의 적용: {selectedNode.application}
                </p>
              )}
            </div>
          )}

          {/* 3) 이 별과 연결된 이웃 별자리 칩 (터치 시 해당 노드로 즉시 워프) */}
          {connectedNeighbors.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                🔗 연결된 말씀·설교·원어 별자리 ({connectedNeighbors.length}개)
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                {connectedNeighbors.slice(0, 18).map(nb => (
                  <button
                    key={nb.id}
                    onClick={() => focusCameraOnNode(nb)}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-black/40 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nb.color }} />
                    <span>{nb.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4) 심층 연동 액션 버튼 바 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {selectedNode.bookName && (
              <button
                onClick={() => handleJumpToBibleChapter(selectedNode.bookName, selectedNode.chapter || 1)}
                className="py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
              >
                📖 본문 열기
              </button>
            )}

            {(selectedNode.bookName || selectedNode.type === 'original_word') && (
              <button
                onClick={() => handleJumpToInterlinear(selectedNode.bookName || selectedNode.books?.[0] || '창세기', selectedNode.chapter || 1, selectedNode.verse || 1)}
                className="py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
              >
                🔬 원어 연구실
              </button>
            )}

            <button
              onClick={() => {
                if (selectedNode.bookName) setCreateBook(selectedNode.bookName);
                if (selectedNode.chapter) setCreateChap(selectedNode.chapter);
                if (selectedNode.verse) setCreateVerse(selectedNode.verse);
                setCreateType('qt');
                setIsCreatorOpen(true);
              }}
              className="py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              🔥 이 본문 QT 등록
            </button>

            <button
              onClick={() => handleRegisterApplyAction(selectedNode)}
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              🎯 실천 트래커 등록
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
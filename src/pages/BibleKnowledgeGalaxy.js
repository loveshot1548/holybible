// src/pages/BibleKnowledgeGalaxy.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🎨 4대 트랙터(Tracktor) & 행성 시네마틱 테마 팔레트
// =====================================================================
const GALAXY_THEMES = {
  oceano: {
    id: 'oceano',
    name: 'Oceano (트랙터 오리지널)',
    bg: '#05080F',
    orbitLine: 'rgba(56, 189, 248, 0.16)',
    textMain: '#E2F1FF',
    textSub: '#38BDF8',
    accent: '#00E5FF',
    panelBg: 'rgba(9, 14, 24, 0.95)',
    panelBorder: 'rgba(56, 189, 248, 0.25)'
  },
  traktor: {
    id: 'traktor',
    name: 'Metálico (골드 앰버)',
    bg: '#080705',
    orbitLine: 'rgba(245, 158, 11, 0.16)',
    textMain: '#FFFBEB',
    textSub: '#FBBF24',
    accent: '#F59E0B',
    panelBg: 'rgba(18, 14, 10, 0.95)',
    panelBorder: 'rgba(245, 158, 11, 0.28)'
  },
  neon: {
    id: 'neon',
    name: 'Neon (사이버 퍼플)',
    bg: '#06040A',
    orbitLine: 'rgba(244, 114, 182, 0.16)',
    textMain: '#FDF2F8',
    textSub: '#F472B6',
    accent: '#EC4899',
    panelBg: 'rgba(16, 9, 24, 0.95)',
    panelBorder: 'rgba(236, 72, 153, 0.28)'
  },
  eden: {
    id: 'eden',
    name: 'Eden (에메랄드 행성)',
    bg: '#040907',
    orbitLine: 'rgba(16, 185, 129, 0.16)',
    textMain: '#ECFDF5',
    textSub: '#34D399',
    accent: '#10B981',
    panelBg: 'rgba(8, 19, 15, 0.95)',
    panelBorder: 'rgba(16, 185, 129, 0.28)'
  }
};

// =====================================================================
// 🏛️ 성경 66권 정경 8대 섹터 (360도 균등 배분)
// =====================================================================
const CANON_SECTORS = [
  { id: 'law', name: '모세오경', color: '#00E5FF', angleStart: 0, angleEnd: 35, books: ['창세기', '출애굽기', '레위기', '민수기', '신명기'] },
  { id: 'ot_history', name: '구약역사서', color: '#38BDF8', angleStart: 35, angleEnd: 100, books: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'] },
  { id: 'poetry', name: '시가서', color: '#F59E0B', angleStart: 100, angleEnd: 130, books: ['욥기', '시편', '잠언', '전도서', '아가'] },
  { id: 'prophets', name: '선지서', color: '#FB923C', angleStart: 130, angleEnd: 215, books: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'] },
  { id: 'gospels', name: '복음서·행전', color: '#10B981', angleStart: 215, angleEnd: 245, books: ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'] },
  { id: 'pauline', name: '바울서신', color: '#A855F7', angleStart: 245, angleEnd: 310, books: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'] },
  { id: 'general', name: '공동서신', color: '#EC4899', angleStart: 310, angleEnd: 350, books: ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서'] },
  { id: 'prophecy_nt', name: '예언서', color: '#F43F5E', angleStart: 350, angleEnd: 360, books: ['요한계시록'] }
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

// =====================================================================
// 🏛️ 12대 구속사 핵심 원어 성운 (발음·어원·신학 해설 완비)
// =====================================================================
const ORIGINAL_LANGUAGE_ROOTS = [
  { id: 'root_hesed', strongs: 'H2617', original: 'חֶסֶד', pron: '헤세드', label: '헤세드 (언약적 사랑)', lang: '히브리어', meaning: '인애, 자비, 끝까지 포기하지 않으시는 하나님의 언약적 사랑', grammar: '남성 명사 (절대형)', books: ['창세기', '룻기', '시편', '호세아', '애가'], color: '#EC4899', angle: 18 },
  { id: 'root_berit', strongs: 'H1285', original: 'בְּרִית', pron: '베리트', label: '베리트 (구속 언약)', lang: '히브리어', meaning: '쪼갠 고기 사이로 지나가시며 생명을 걸고 맺으신 영원한 언약', grammar: '여성 명사', books: ['창세기', '출애굽기', '신명기', '예레미야', '히브리서'], color: '#F43F5E', angle: 48 },
  { id: 'root_shalom', strongs: 'H7965', original: 'שָׁלוֹם', pron: '샬롬', label: '샬롬 (참된 평강)', lang: '히브리어', meaning: '하나님과의 관계 회복에서 오는 완전한 평화와 무결함', grammar: '남성 명사', books: ['민수기', '사사기', '시편', '이사야', '요한복음'], color: '#06B6D4', angle: 78 },
  { id: 'root_ruah', strongs: 'H7307', original: 'רוּחַ', pron: '루아흐', label: '루아흐 (성령/생기)', lang: '히브리어', meaning: '하나님의 호흡, 마른 뼈를 군대로 일으키는 창조적 생명의 영', grammar: '공성 명사', books: ['창세기', '에스겔', '요엘', '사도행전'], color: '#10B981', angle: 108 },
  { id: 'root_qadosh', strongs: 'H6918', original: 'קָדוֹשׁ', pron: '카도시', label: '카도시 (거룩/구별)', lang: '히브리어', meaning: '세속으로부터 완전히 구별된 하나님의 절대 성결과 영광', grammar: '형용사', books: ['레위기', '이사야', '에스겔', '베드로전서'], color: '#F59E0B', angle: 138 },
  { id: 'root_torah', strongs: 'H8451', original: 'תּוֹרָה', pron: '토라', label: '토라 (과녁을 향한 말씀)', lang: '히브리어', meaning: '화살이 과녁을 정확히 맞추듯 생명의 길을 가리키는 아버지의 교훈', grammar: '여성 명사', books: ['창세기', '출애굽기', '신명기', '시편', '여호수아'], color: '#38BDF8', angle: 168 },
  { id: 'root_agape', strongs: 'G26', original: 'ἀγάπη', pron: '아가페', label: '아가페 (무조건적 사랑)', lang: '헬라어', meaning: '독생자를 아낌없이 내어주신 자기희생적이고 무조건적인 사랑', grammar: '여성 명사 (주격)', books: ['요한복음', '로마서', '고린도전서', '요한일서'], color: '#EF4444', angle: 198 },
  { id: 'root_charis', strongs: 'G5485', original: 'χάρις', pron: '카리스', label: '카리스 (값없는 은혜)', lang: '헬라어', meaning: '전적 부패한 죄인에게 값없이 거저 베푸시는 구원의 선물', grammar: '여성 명사', books: ['로마서', '에베소서', '갈라디아서', '고린도후서'], color: '#8B5CF6', angle: 228 },
  { id: 'root_pistis', strongs: 'G4102', original: 'πίστις', pron: '피스티스', label: '피스티스 (구원하는 믿음)', lang: '헬라어', meaning: '예수 그리스도를 전인격적으로 신뢰하고 생명을 의탁하는 신실함', grammar: '여성 명사', books: ['로마서', '갈라디아서', '히브리서', '야고보서'], color: '#3B82F6', angle: 258 },
  { id: 'root_basileia', strongs: 'G932', original: 'βασιλεία', pron: '바실레이아', label: '바실레이아 (하나님 나라)', lang: '헬라어', meaning: '예수 그리스도를 통해 이미 임하였고 완성될 하나님의 주권적 통치', grammar: '여성 명사', books: ['마태복음', '마가복음', '누가복음', '사도행전', '요한계시록'], color: '#10B981', angle: 288 },
  { id: 'root_stauros', strongs: 'G4716', original: 'σταυρός', pron: '스타우로스', label: '스타우로스 (십자가 대속)', lang: '헬라어', meaning: '율법의 저주를 단번에 끊으신 예수 그리스도의 피 묻은 대속 십자가', grammar: '남성 명사', books: ['마태복음', '고린도전서', '갈라디아서', '골로새서', '빌립보서'], color: '#E11D48', angle: 318 },
  { id: 'root_logos', strongs: 'G3056', original: 'λόγος', pron: '로고스', label: '로고스 (성육신 말씀)', lang: '헬라어', meaning: '태초부터 하나님과 함께 계셨고 육신이 되어 우리 가운데 거하신 말씀', grammar: '남성 명사', books: ['창세기', '요한복음', '요한일서', '요한계시록'], color: '#14B8A6', angle: 348 }
];

function extractBibleRefInfo(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return { bookKo: '창세기', chapter: 1, verse: 1 };
  const clean = rawStr.trim();

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

function getScripturePreview(bookKo, chapter = 1, verse = 1) {
  try {
    const enName = KO_TO_EN_BOOK[bookKo] || bookKo;
    const bookObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enName || b.name === bookKo) : null;
    if (!bookObj || !Array.isArray(bookObj.chapters)) return null;
    const chapArr = bookObj.chapters[Math.max(0, chapter - 1)];
    if (!Array.isArray(chapArr) || chapArr.length === 0) return null;
    const targetIdx = Math.max(0, Math.min(chapArr.length - 1, (verse || 1) - 1));
    return chapArr.slice(targetIdx, targetIdx + 4).map((txt, idx) => ({
      vNum: targetIdx + idx + 1,
      text: String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
    }));
  } catch {
    return null;
  }
}

export default function BibleKnowledgeGalaxy({ setActiveScreen, setCurrentChapId, setBibleViewMode }) {
  const store = useAppStore();
  const { dailyData = {}, updateDay, readVerses = {}, bibleNotes = [], setBibleNotes } = store;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. 3대 뷰 모드: '2d' (원본 3번 트랙터 2D 궤도) | '3d' (360° 상하좌우 회전 3D 행성 구체) | 'list' (계층 나열 디렉토리)
  const [viewMode, setViewMode] = useState('2d');

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
  const [previewChap, setPreviewChap] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('all'); // 'all' | 'book' | 'sermon' | 'qt' | 'original_word'

  // 3. 드로어 & 등록 모달 상태
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 등록 폼 상태
  const [createType, setCreateType] = useState('qt');
  const [createBook, setCreateBook] = useState('창세기');
  const [createChap, setCreateChap] = useState(1);
  const [createVerse, setCreateVerse] = useState(1);
  const [createTitle, setCreateTitle] = useState('');
  const [createBody, setCreateBody] = useState('');
  const [createApply, setCreateApply] = useState('');

  // 4. 궤도 파라미터
  const [rotationSpeed, setRotationSpeed] = useState(0.12);
  const [orbitSpacing, setOrbitSpacing] = useState(1.0);
  const [nodeScale, setNodeScale] = useState(1.0);
  const [showOuterLabels, setShowOuterLabels] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('oceano');

  // 5. 카메라(2D 팬/줌) & 3D 행성 회전(Pitch/Yaw) Ref
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.68 });
  const targetCameraRef = useRef(null);
  const planetRotRef = useRef({ yaw: 0.3, pitch: 0.25 }); // 3D 행성 상하(pitch)·좌우(yaw) 각도
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const globalRotationRef = useRef(0);
  const nodePositionsRef = useRef(new Map());

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    fetch('/sermon_summary.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setRawSermons(data); })
      .catch(() => {});
  }, []);

  // 노드 선택 변경 시 미리보기 장 번호 동기화
  useEffect(() => {
    if (selectedNode?.chapter) {
      setPreviewChap(selectedNode.chapter);
    } else {
      setPreviewChap(1);
    }
  }, [selectedNode]);

  // =====================================================================
  // 📐 [2D 트랙터 궤도 + 3D 행성 구체 좌표 동시 생성 엔진]
  // =====================================================================
  const galaxyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const BOOK_NODE_MAP = {};
    const BOOK_SECTOR_MAP = {};

    const bookReadCounts = {};
    Object.keys(readVerses || {}).forEach(k => {
      if (readVerses[k]) {
        const [enBk, ch] = k.split('-');
        bookReadCounts[`${enBk}-${ch}`] = true;
      }
    });

    // [Orbit 0] 중심 코어 (3D 구체 중심 핵)
    nodes.push({
      id: 'core',
      label: '예수 그리스도 (구속사 코어)',
      level: 0,
      radius: 0,
      angle: 0,
      x3d: 0, y3d: 0, z3d: 0,
      size: 19,
      color: '#00E5FF',
      type: 'core',
      desc: '성경 66권과 설교, 성도의 모든 QT와 기도가 하나로 수렴하는 구속사의 심장입니다.'
    });

    // [Orbit 1 & 2] 8대 정경 섹터 및 성경 66권
    let globalBookIdx = 0;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    CANON_SECTORS.forEach((sec, sIdx) => {
      const midAngle = (sec.angleStart + sec.angleEnd) / 2;
      const secNodeId = `sector_${sec.id}`;
      const secRad = (midAngle * Math.PI) / 180;

      // 3D 섹터 코어 링 좌표
      const secR3D = 125;
      nodes.push({
        id: secNodeId,
        label: sec.name,
        level: 1,
        radius: 115,
        angle: midAngle,
        x3d: secR3D * Math.cos(secRad),
        y3d: ((sIdx % 3) - 1) * 45,
        z3d: secR3D * Math.sin(secRad),
        size: 11,
        color: sec.color,
        type: 'sector',
        sectorId: sec.id,
        books: sec.books,
        desc: `${sec.name} (${sec.books.length}권)`
      });
      links.push({ source: 'core', target: secNodeId, color: sec.color, alpha: 0.3 });

      const bookCount = sec.books.length;
      const angleSpan = sec.angleEnd - sec.angleStart;
      const stepAngle = angleSpan / (bookCount + 1);

      sec.books.forEach((bookName, bIdx) => {
        const bookAngle = sec.angleStart + stepAngle * (bIdx + 1);
        const bookNodeId = `book_${bookName}`;
        BOOK_NODE_MAP[bookName] = bookNodeId;
        BOOK_SECTOR_MAP[bookName] = sec;

        const enBook = KO_TO_EN_BOOK[bookName] || bookName;
        const bObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enBook) : null;
        const totalChaps = bObj?.chapters?.length || 1;
        let readChaps = 0;
        const readChapMap = {};
        for (let c = 1; c <= totalChaps; c++) {
          if (bookReadCounts[`${enBook}-${c}`]) {
            readChaps++;
            readChapMap[c] = true;
          }
        }

        // 2D 지그재그 반지름
        const spokeRadius = 210 + (bIdx % 3) * 32;

        // 🪐 3D 피보나치 행성 구체 표면 좌표 (66권이 완벽한 구형 행성 표면을 형성)
        const i = globalBookIdx + 0.5;
        const phi = Math.acos(1 - (2 * i) / 66);
        const theta = 2 * Math.PI * i / goldenRatio;
        const sphereR = 230;
        const x3d = sphereR * Math.sin(phi) * Math.cos(theta);
        const y3d = sphereR * Math.cos(phi);
        const z3d = sphereR * Math.sin(phi) * Math.sin(theta);
        globalBookIdx++;

        nodes.push({
          id: bookNodeId,
          label: bookName,
          bookName,
          enBookName: enBook,
          totalChaps,
          readChaps,
          readChapMap,
          spokeDots: Math.min(8, Math.max(2, Math.ceil(totalChaps / 15))),
          level: 2,
          radius: spokeRadius,
          angle: bookAngle,
          x3d, y3d, z3d,
          size: 9,
          color: sec.color,
          type: 'book',
          sector: sec.name,
          sectorId: sec.id,
          desc: `${sec.name} • 총 ${totalChaps}장 중 ${readChaps}장 통독 완료`
        });
        links.push({ source: secNodeId, target: bookNodeId, color: sec.color, alpha: 0.25 });
      });
    });

    // [Orbit 3 & 4] 설교 아카이브 & 나의 QT/예배노트 슬롯 분배
    const outerBuckets = {};
    CANON_SECTORS.forEach(s => { outerBuckets[s.id] = []; });

    const sermonIndex = rawSermons?.index || {};
    let sTotal = 0;
    Object.entries(sermonIndex).forEach(([refKey, sermonList]) => {
      if (!Array.isArray(sermonList) || sermonList.length === 0) return;
      const { bookKo, chapter, verse } = extractBibleRefInfo(refKey);
      const targetBookId = BOOK_NODE_MAP[bookKo];
      const sec = BOOK_SECTOR_MAP[bookKo];
      if (!targetBookId || !sec) return;

      sermonList.slice(0, 2).forEach((sermon) => {
        if (sTotal >= 180) return;
        sTotal++;
        outerBuckets[sec.id].push({
          id: `sermon_${sTotal}`,
          label: sermon.title || `${refKey} 강해`,
          sermonTitle: sermon.title || `${refKey} 설교`,
          preacher: sermon.preacher || '담임목사',
          date: sermon.date || '',
          ref: refKey,
          bookName: bookKo,
          chapter,
          verse,
          summary: sermon.summary || sermon.oneLineSummary || sermon.content || '선포된 말씀 요약',
          parentBookId: targetBookId,
          color: sec.color,
          type: 'sermon',
          sector: sec.name
        });
      });
    });

    Object.entries(dailyData || {}).forEach(([dateKey, dVal]) => {
      if (!dVal) return;

      if (dVal.qtTitle || dVal.qtMeditation || dVal.qtApplication) {
        const refInfo = extractBibleRefInfo(dVal.qtReference || dVal.qtTitle || '시편 23:1');
        const sec = BOOK_SECTOR_MAP[refInfo.bookKo] || CANON_SECTORS[2];
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_시편';

        outerBuckets[sec.id].push({
          id: `my_qt_${dateKey}`,
          label: dVal.qtTitle || `${dateKey} QT`,
          date: dateKey,
          ref: dVal.qtReference || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
          bookName: refInfo.bookKo,
          chapter: refInfo.chapter,
          verse: refInfo.verse,
          summary: dVal.qtMeditation || '나의 QT 묵상 기록',
          application: dVal.qtApplication || '',
          parentBookId: targetBookId,
          color: '#F43F5E',
          type: 'qt',
          sector: sec.name
        });
      }

      if (dVal.sermonTitle || dVal.sermonNotes) {
        const refInfo = extractBibleRefInfo(dVal.sermonReference || dVal.sermonTitle || '요한복음 3:16');
        const sec = BOOK_SECTOR_MAP[refInfo.bookKo] || CANON_SECTORS[4];
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_요한복음';

        outerBuckets[sec.id].push({
          id: `my_sermon_note_${dateKey}`,
          label: `[예배노트] ${dVal.sermonTitle || dateKey}`,
          date: dateKey,
          preacher: dVal.sermonPreacher || '목사님',
          ref: dVal.sermonReference || `${refInfo.bookKo} ${refInfo.chapter}장`,
          bookName: refInfo.bookKo,
          chapter: refInfo.chapter,
          verse: refInfo.verse,
          summary: String(dVal.sermonNotes || '').replace(/<[^>]*>?/gm, '').slice(0, 220),
          parentBookId: targetBookId,
          color: '#FBBF24',
          type: 'qt',
          sector: sec.name
        });
      }
    });

    (customGalaxyNodes || []).forEach((cNode, idx) => {
      const sec = BOOK_SECTOR_MAP[cNode.bookName] || CANON_SECTORS[0];
      const targetBookId = BOOK_NODE_MAP[cNode.bookName] || 'book_창세기';
      outerBuckets[sec.id].push({
        ...cNode,
        id: cNode.id || `custom_${idx}`,
        parentBookId: targetBookId,
        sector: sec.name
      });
    });

    const OUTER_RING_RADII = [390, 422, 454, 486];

    CANON_SECTORS.forEach((sec) => {
      const items = outerBuckets[sec.id] || [];
      if (items.length === 0) return;

      const pad = 1.8;
      const startA = sec.angleStart + pad;
      const endA = sec.angleEnd - pad;
      const usableAngle = Math.max(4, endA - startA);
      const maxPerRow = Math.max(4, Math.floor(usableAngle / 2.2));

      items.forEach((item, idx) => {
        const rowIdx = Math.floor(idx / maxPerRow);
        const colIdx = idx % maxPerRow;
        const itemsInThisRow = Math.min(maxPerRow, items.length - rowIdx * maxPerRow);
        const angleStep = usableAngle / (itemsInThisRow + 1);
        const assignedAngle = startA + angleStep * (colIdx + 1);
        const assignedRadius = OUTER_RING_RADII[rowIdx % OUTER_RING_RADII.length] + Math.floor(rowIdx / 4) * 28;

        // 🪐 3D 토성 고리(Planetary Belt) 입체 궤도 좌표
        const rad = (assignedAngle * Math.PI) / 180;
        const r3d = 355 + (rowIdx % 3) * 32;
        const tilt = ((rowIdx % 3) - 1) * 0.28; // 3중 기울기 궤도 벨트
        const x3d = r3d * Math.cos(rad);
        const z3d = r3d * Math.sin(rad);
        const y3d = r3d * Math.sin(rad) * tilt + ((idx % 2 === 0 ? 1 : -1) * 14);

        nodes.push({
          ...item,
          level: item.type === 'sermon' ? 3 : 4,
          radius: assignedRadius,
          angle: assignedAngle,
          x3d, y3d, z3d,
          size: 7.5
        });

        links.push({
          source: item.parentBookId,
          target: item.id,
          color: item.color,
          alpha: 0.18
        });
      });
    });

    // [Orbit 5] 12대 원어 성운 (최외곽 위성 궤도)
    ORIGINAL_LANGUAGE_ROOTS.forEach((root, rIdx) => {
      const rad = (root.angle * Math.PI) / 180;
      const r3d = 460;
      const elev = Math.sin(rIdx * 1.1) * 140;

      nodes.push({
        id: root.id,
        label: `${root.original} ${root.pron}`,
        original: root.original,
        pron: root.pron,
        strongs: root.strongs,
        lang: root.lang,
        grammar: root.grammar,
        koreanName: root.label,
        desc: root.meaning,
        books: root.books,
        level: 5,
        radius: 540,
        angle: root.angle,
        x3d: r3d * Math.cos(rad),
        y3d: elev,
        z3d: r3d * Math.sin(rad),
        size: 13,
        color: root.color,
        type: 'original_word'
      });

      root.books.forEach(bName => {
        if (BOOK_NODE_MAP[bName]) {
          links.push({ source: root.id, target: BOOK_NODE_MAP[bName], color: root.color, alpha: 0.25, dashed: true });
        }
      });
    });

    return { nodes, links };
  }, [rawSermons, dailyData, readVerses, customGalaxyNodes]);

  // 선택된 노드에 연결된 원어(히브리어/헬라어) 자동 매칭
  const relatedOriginalRoots = useMemo(() => {
    if (!selectedNode) return ORIGINAL_LANGUAGE_ROOTS.slice(0, 4);
    if (selectedNode.type === 'original_word') {
      return ORIGINAL_LANGUAGE_ROOTS.filter(r => r.id === selectedNode.id);
    }
    const targetBook = selectedNode.bookName;
    if (targetBook) {
      const matched = ORIGINAL_LANGUAGE_ROOTS.filter(r => r.books.includes(targetBook));
      if (matched.length > 0) return matched;
    }
    return ORIGINAL_LANGUAGE_ROOTS.slice(0, 3);
  }, [selectedNode]);

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

  const connectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    return galaxyData.nodes.filter(n => n.id !== selectedNode.id && connectedNodeIds.has(n.id));
  }, [selectedNode, galaxyData, connectedNodeIds]);

  const filteredListNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return galaxyData.nodes.filter(n => {
      if (n.type === 'core' || n.type === 'sector') return false;
      if (orbitFilter !== 'all' && n.type !== orbitFilter) return false;
      if (!q) return true;
      return (
        n.label?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.ref?.toLowerCase().includes(q) ||
        n.desc?.toLowerCase().includes(q) ||
        n.bookName?.toLowerCase().includes(q)
      );
    });
  }, [galaxyData.nodes, orbitFilter, searchQuery]);

  const theme = GALAXY_THEMES[currentTheme] || GALAXY_THEMES.oceano;

  // =====================================================================
  // 🖥️ 60FPS 하이브리드 렌더러: [2D 트랙터 궤도] & [3D 행성 구체]
  // =====================================================================
  useEffect(() => {
    if (viewMode === 'list') return;
    const canvas = canvasRef.current;
    if (!canvas || !galaxyData) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (targetCameraRef.current && viewMode === '2d') {
        cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * 0.14;
        cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * 0.14;
        cameraRef.current.zoom += (targetCameraRef.current.zoom - cameraRef.current.zoom) * 0.14;
        if (
          Math.abs(targetCameraRef.current.x - cameraRef.current.x) < 0.4 &&
          Math.abs(targetCameraRef.current.y - cameraRef.current.y) < 0.4 &&
          Math.abs(targetCameraRef.current.zoom - cameraRef.current.zoom) < 0.01
        ) {
          targetCameraRef.current = null;
        }
      }

      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      const camX = width / 2 + (viewMode === '2d' ? cameraRef.current.x : 0);
      const camY = height / 2 + (viewMode === '2d' ? cameraRef.current.y : 0);
      const zoom = cameraRef.current.zoom;

      ctx.translate(camX, camY);
      ctx.scale(zoom, zoom);

      const effectiveSpeed = selectedNode ? 0 : rotationSpeed;
      globalRotationRef.current += effectiveSpeed * 0.0025;
      const rot = globalRotationRef.current;

      const posMap = new Map();

      if (viewMode === '3d') {
        // =================================================================
        // 🪐 [3D 행성 구체 렌더링 모드] 상·하·좌·우 360도 입체 회전 투영
        // =================================================================
        if (!isDraggingRef.current && !selectedNode) {
          planetRotRef.current.yaw += effectiveSpeed * 0.004;
        }

        const yaw = planetRotRef.current.yaw;
        const pitch = planetRotRef.current.pitch;
        const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        const fov = 750;

        // 3D 행성 적도 & 자오선 와이어프레임 구체 가이드
        [230, 365].forEach((sphereRad, idx) => {
          const r = sphereRad * orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = theme.orbitLine;
          ctx.lineWidth = idx === 0 ? 1.2 : 0.7;
          ctx.globalAlpha = idx === 0 ? 0.5 : 0.25;
          ctx.stroke();
        });

        galaxyData.nodes.forEach(node => {
          const sx = (node.x3d || 0) * orbitSpacing;
          const sy = (node.y3d || 0) * orbitSpacing;
          const sz = (node.z3d || 0) * orbitSpacing;

          // Y축(좌우 Yaw) 회전 후 X축(상하 Pitch) 회전
          const x1 = sx * cosY - sz * sinY;
          const z1 = sz * cosY + sx * sinY;
          const y2 = sy * cosP - z1 * sinP;
          const z2 = z1 * cosP + sy * sinP;

          const perspective = fov / Math.max(120, fov + z2);
          const nx = x1 * perspective;
          const ny = y2 * perspective;

          posMap.set(node.id, {
            x: nx,
            y: ny,
            zDepth: z2,
            perspScale: perspective,
            ...node
          });
        });
      } else {
        // =================================================================
        // 🌌 [2D 트랙터 궤도 모드] 원본 3번 스타일 동심원 + 이퀄라이저 스포크
        // =================================================================
        const ORBIT_RINGS = [55, 115, 210, 274, 390, 422, 454, 486, 540];
        ORBIT_RINGS.forEach((baseR, idx) => {
          const r = baseR * orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = theme.orbitLine;
          ctx.lineWidth = idx === 1 || idx === 4 ? 1.2 : 0.7;
          ctx.globalAlpha = idx >= 4 && idx <= 7 ? 0.35 : 0.65;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });

        galaxyData.nodes.forEach(node => {
          const adjustedRadius = node.radius * orbitSpacing;
          const speedFactor = node.level > 0 ? 1 / Math.sqrt(node.level) : 0;
          const angleDeg = node.angle + (rot * 180 / Math.PI) * speedFactor;
          const angleRad = (angleDeg * Math.PI) / 180;
          const nx = adjustedRadius * Math.cos(angleRad);
          const ny = adjustedRadius * Math.sin(angleRad);
          posMap.set(node.id, { x: nx, y: ny, zDepth: 0, perspScale: 1, angleRad, ...node });
        });

        // 내측 성경 66권 방사형 이퀄라이저 스포크
        posMap.forEach(node => {
          if (node.type !== 'book') return;
          if (orbitFilter !== 'all' && orbitFilter !== 'book') return;
          const isSelected = selectedNode?.id === node.id;
          const isNeighbor = selectedNode && connectedNodeIds.has(node.id);
          const alpha = selectedNode && !isSelected && !isNeighbor ? 0.12 : 0.75;

          const dotCount = node.spokeDots || 4;
          const startR = 145 * orbitSpacing;
          const endR = (node.radius - 10) * orbitSpacing;
          const stepR = (endR - startR) / Math.max(1, dotCount);

          ctx.fillStyle = node.color;
          ctx.globalAlpha = alpha;
          for (let d = 0; d < dotCount; d++) {
            const dr = startR + d * stepR;
            ctx.beginPath();
            ctx.arc(dr * Math.cos(node.angleRad), dr * Math.sin(node.angleRad), 1.8 * nodeScale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        });
      }

      nodePositionsRef.current = posMap;

      // 연결선 (Links) 렌더링
      galaxyData.links.forEach(link => {
        const src = posMap.get(link.source);
        const tgt = posMap.get(link.target);
        if (!src || !tgt) return;

        const isHighlightedLink = selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);
        if (selectedNode && !isHighlightedLink) return;

        // 3D 모드에서 행성 뒤편에 있는 연결선은 은은하게 감춤
        const backFade = viewMode === '3d' && (src.zDepth > 120 || tgt.zDepth > 120) ? 0.25 : 1.0;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        ctx.strokeStyle = isHighlightedLink ? '#00E5FF' : (link.color || theme.orbitLine);
        ctx.globalAlpha = (isHighlightedLink ? 0.85 : (link.alpha || 0.15)) * backFade;
        ctx.lineWidth = isHighlightedLink ? 1.8 / Math.sqrt(zoom) : 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // Z-정렬 (3D 모드에서 뒤쪽 반구 노드부터 먼저 그리고 앞쪽 노드를 위에 그림)
      const sortedNodes = Array.from(posMap.values()).sort((a, b) => b.zDepth - a.zDepth);
      const isSearchActive = searchQuery.trim().length > 0;
      const lowerQuery = searchQuery.toLowerCase().trim();
      const labelCandidates = [];

      sortedNodes.forEach(node => {
        const matchesFilter = orbitFilter === 'all' || node.type === orbitFilter || node.type === 'core' || (orbitFilter === 'book' && node.type === 'sector');
        const isMatchedSearch = isSearchActive && (
          node.label?.toLowerCase().includes(lowerQuery) ||
          node.summary?.toLowerCase().includes(lowerQuery) ||
          node.ref?.toLowerCase().includes(lowerQuery)
        );

        const isSelected = selectedNode?.id === node.id;
        const isNeighbor = selectedNode && connectedNodeIds.has(node.id);

        // 3D 깊이 감쇠 (뒤편에 있는 노드는 반투명하게 처리하여 입체감 극대화)
        const depthAlpha = viewMode === '3d' ? Math.max(0.18, Math.min(1.0, (420 - node.zDepth) / 560)) : 1.0;

        let alpha = depthAlpha;
        if (!matchesFilter) alpha = 0.05;
        else if (isSearchActive && !isMatchedSearch) alpha = 0.08;
        else if (selectedNode && !isSelected && !isNeighbor) alpha = 0.14;

        const rSize = (node.size || 8) * nodeScale * node.perspScale * (isSelected ? 1.4 : isMatchedSearch ? 1.3 : 1.0);

        ctx.globalAlpha = alpha;

        if (node.level >= 3 || node.type === 'core') {
          // 이중 링 (◎) 노드
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize, 0, Math.PI * 2);
          ctx.fillStyle = theme.bg;
          ctx.fill();
          ctx.lineWidth = isSelected || isMatchedSearch ? 2.2 : 1.4;
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.42, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();
        } else {
          // 내측 섹터 & 성경 66권 노드
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.78, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();

          if (isSelected || node.level === 1 || viewMode === '3d') {
            ctx.beginPath();
            ctx.arc(node.x, node.y, rSize * 1.25, 0, Math.PI * 2);
            ctx.strokeStyle = isSelected ? '#FFFFFF' : node.color;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 1.0;

        // 3D 모드에서는 앞쪽 반구(zDepth < 90)에 있는 노드만 라벨 후보에 등록하여 깔끔함 유지
        const isFrontHemisphere = viewMode !== '3d' || node.zDepth < 90 || isSelected || isMatchedSearch;
        if (alpha > 0.25 && isFrontHemisphere) {
          let priority = 0;
          if (isSelected) priority = 100;
          else if (isMatchedSearch) priority = 90;
          else if (isNeighbor) priority = 80;
          else if (node.type === 'core' || node.type === 'sector') priority = 70;
          else if (node.type === 'original_word') priority = 60;
          else if (node.type === 'book') priority = 50;
          else if (showOuterLabels || zoom > 1.75) priority = 20;

          if (priority > 0) {
            labelCandidates.push({ node, priority, rSize, isSelected, isMatchedSearch });
          }
        }
      });

      // 🛡️ 2D AABB 충돌 방지 라벨 렌더러 (글자 겹침 0% 보장)
      labelCandidates.sort((a, b) => b.priority - a.priority);
      const occupiedBoxes = [];

      labelCandidates.forEach(({ node, priority, rSize, isSelected, isMatchedSearch }) => {
        const screenX = camX + node.x * zoom;
        const screenY = camY + (node.y + rSize + 8 / zoom) * zoom;

        if (screenX < -60 || screenX > width + 60 || screenY < -30 || screenY > height + 30) return;

        const displayLabel = node.label.length > 14 && !isSelected ? `${node.label.slice(0, 13)}…` : node.label;
        const fontSize = isSelected ? 12 : priority >= 70 ? 11 : 10;
        const estWidth = displayLabel.length * (fontSize * 0.88) + 12;
        const estHeight = fontSize + 8;

        const box = {
          left: screenX - estWidth / 2,
          right: screenX + estWidth / 2,
          top: screenY - estHeight / 2,
          bottom: screenY + estHeight / 2
        };

        if (!isSelected) {
          const hasCollision = occupiedBoxes.some(b =>
            !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
          );
          if (hasCollision) return;
        }

        occupiedBoxes.push(box);

        ctx.save();
        ctx.translate(node.x, node.y + rSize + 8 / zoom);
        ctx.scale(1 / zoom, 1 / zoom);

        ctx.font = `${isSelected || priority >= 70 ? 'bold' : '600'} ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textMetrics = ctx.measureText(displayLabel);
        const bgW = textMetrics.width + 10;
        const bgH = fontSize + 6;

        ctx.fillStyle = isSelected ? '#0284C7' : 'rgba(5, 8, 15, 0.84)';
        ctx.beginPath();
        ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 5);
        ctx.fill();

        if (isSelected || isMatchedSearch) {
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : '#38BDF8';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.level === 1 ? node.color : theme.textMain;
        ctx.fillText(displayLabel, 0, 1);
        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewMode, galaxyData, rotationSpeed, orbitSpacing, nodeScale, showOuterLabels, currentTheme, searchQuery, orbitFilter, selectedNode, connectedNodeIds, theme]);

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

    if (rect.width < 640 && cameraRef.current.zoom === 0.68) {
      cameraRef.current.zoom = 0.56;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, viewMode]);

  const focusCameraOnNode = useCallback((node) => {
    if (!node) return;
    setSelectedNode(node);
    const pos = nodePositionsRef.current.get(node.id);
    if (pos && viewMode === '2d') {
      const targetZoom = Math.max(cameraRef.current.zoom, 1.15);
      targetCameraRef.current = {
        x: -pos.x * targetZoom,
        y: -pos.y * targetZoom - (window.innerWidth < 1024 ? 50 : 0),
        zoom: targetZoom
      };
    }
  }, [viewMode]);

  // =====================================================================
  // 🖐️ 2D 이동 & 3D 상하좌우 행성 회전 통합 터치/마우스 핸들러
  // =====================================================================
  const handleWheel = (e) => {
    e.preventDefault();
    targetCameraRef.current = null;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    cameraRef.current.zoom = Math.min(3.5, Math.max(0.32, cameraRef.current.zoom * zoomFactor));
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
      cameraRef.current.zoom = Math.min(3.5, Math.max(0.32, cameraRef.current.zoom * ratio));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;

      if (viewMode === '3d') {
        // 🪐 3D 행성 구체 상·하·좌·우 360도 자유 회전!
        planetRotRef.current.yaw += dx * 0.007;
        planetRotRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, planetRotRef.current.pitch + dy * 0.007));
      } else {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
      }
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

    if (viewMode === '3d') {
      planetRotRef.current.yaw += dx * 0.0065;
      planetRotRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, planetRotRef.current.pitch + dy * 0.0065));
    } else {
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
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

    const camX = width / 2 + (viewMode === '2d' ? cameraRef.current.x : 0);
    const camY = height / 2 + (viewMode === '2d' ? cameraRef.current.y : 0);

    const worldX = (clickX - camX) / cameraRef.current.zoom;
    const worldY = (clickY - camY) / cameraRef.current.zoom;

    let closestNode = null;
    let minDist = 28 / Math.sqrt(cameraRef.current.zoom);

    nodePositionsRef.current.forEach(node => {
      if (orbitFilter !== 'all' && node.type !== orbitFilter && node.type !== 'core') return;
      if (viewMode === '3d' && node.zDepth > 180) return; // 3D 구체 반대편 깊숙한 노드는 오클릭 방지
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
  // ⚡ [버그 완벽 해결] 선택한 성경 권과 장(Chapter)으로 즉시 진입!
  // =====================================================================
  const handleJumpToBibleChapter = (bookKo, chap = 1) => {
    const enBook = KO_TO_EN_BOOK[bookKo] || 'Genesis';
    const targetChapId = `${enBook}-${chap}`;
    try {
      localStorage.setItem('bible_jump_target', targetChapId);
    } catch {}
    if (typeof setCurrentChapId === 'function') setCurrentChapId(targetChapId);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
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

  const handleSaveNewKnowledgeNode = () => {
    if (!createTitle.trim() && !createBody.trim()) {
      return alert('제목이나 묵상 내용을 입력해주세요.');
    }

    const todayKey = new Date().toISOString().split('T')[0];
    const refStr = `${createBook} ${createChap}:${createVerse}`;
    const finalTitle = createTitle.trim() || `${refStr} 묵상`;
    const finalBody = createBody.trim();

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
      color: createType === 'qt' ? '#F43F5E' : createType === 'sermon' ? '#10B981' : '#00E5FF'
    };

    const nextCustom = [newGalaxyNode, ...customGalaxyNodes];
    setCustomGalaxyNodes(nextCustom);
    localStorage.setItem('goodtree_custom_galaxy_nodes', JSON.stringify(nextCustom));

    setCreateTitle('');
    setCreateBody('');
    setCreateApply('');
    setIsCreatorOpen(false);
    showToast(`✨ [${finalTitle}] 노드가 등록되었습니다!`);
    setTimeout(() => focusCameraOnNode(newGalaxyNode), 180);
  };

  const selectedScriptureVerses = useMemo(() => {
    if (!selectedNode?.bookName) return null;
    return getScripturePreview(selectedNode.bookName, previewChap || selectedNode.chapter || 1, selectedNode.verse || 1);
  }, [selectedNode, previewChap]);

  // =====================================================================
  // 🧩 인스펙터 상세 내용 렌더러 (PC 우측 독 & 모바일 바텀 시트 공용)
  // =====================================================================
  const renderInspectorContent = () => {
    if (!selectedNode) {
      return (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5">
            <span className="text-[10.5px] font-mono font-black text-cyan-400 uppercase block">
              MASTER COMMAND CENTER
            </span>
            <h3 className="text-sm font-black text-white">🌌 성경 66권 · 설교 · 원어 통합 허브</h3>
            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              좌측 은하계에서 <b>성경 66권, 설교, 나의 QT, 히브리어·헬라어 원어</b>를 터치하면 본문 미리보기와 장별 직행 그리드가 이곳에 펼쳐집니다.
            </p>
          </div>

          {/* 8대 정경 퀵 셀렉터 */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block">
              🧭 8대 정경 섹터 바로가기
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {CANON_SECTORS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => {
                    const secNode = galaxyData.nodes.find(n => n.id === `sector_${sec.id}`);
                    if (secNode) focusCameraOnNode(secNode);
                  }}
                  className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-left cursor-pointer transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                  <span className="font-bold text-white truncate">{sec.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 12대 구속사 핵심 원어 사전 브리핑 */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-pink-400 block">
              🏛️ 구속사 12대 히브리·헬라 원어 핵심 사전
            </span>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
              {ORIGINAL_LANGUAGE_ROOTS.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    const rNode = galaxyData.nodes.find(n => n.id === r.id);
                    if (rNode) focusCameraOnNode(rNode);
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black" style={{ color: r.color }}>{r.original}</span>
                      <span className="font-black text-white">{r.label}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{r.meaning}</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 shrink-0">{r.strongs}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-xs">
        {/* 상단 타이틀 헤더 */}
        <div className="flex justify-between items-start border-b pb-2.5" style={{ borderColor: theme.panelBorder }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/40" style={{ backgroundColor: selectedNode.color }} />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                {selectedNode.type === 'book' ? `BIBLE • ${selectedNode.sector}` :
                 selectedNode.type === 'sermon' ? `SERMON • ${selectedNode.ref}` :
                 selectedNode.type === 'qt' ? `MY QT / NOTE • ${selectedNode.date || ''}` :
                 selectedNode.type === 'original_word' ? `${selectedNode.lang} • ${selectedNode.strongs}` :
                 `SECTOR • ${selectedNode.label}`}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedNode.label}</h3>
            </div>
          </div>
          <button onClick={() => setSelectedNode(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer p-1">✕ 해제</button>
        </div>

        {/* 🌟 [핵심 고도화] 성경 노드 클릭 시 원하는 장(Chapter)으로 바로 진입하는 장 선택 그리드! */}
        {selectedNode.type === 'book' && (
          <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-cyan-300">
                📖 {selectedNode.bookName} 장(Chapter) 선택 (터치 시 미리보기 / 더블클릭 시 이동)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                통독 {selectedNode.readChaps}/{selectedNode.totalChaps}장
              </span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-28 overflow-y-auto pr-1 hide-scrollbar">
              {Array.from({ length: selectedNode.totalChaps || 1 }, (_, i) => i + 1).map(cNum => {
                const isRead = selectedNode.readChapMap?.[cNum];
                const isSelectedChap = previewChap === cNum;
                return (
                  <button
                    key={cNum}
                    onClick={() => setPreviewChap(cNum)}
                    onDoubleClick={() => handleJumpToBibleChapter(selectedNode.bookName, cNum)}
                    className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      isSelectedChap
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black scale-105'
                        : isRead
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    {cNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              🚀 {selectedNode.bookName} {previewChap}장 성경통독 본문으로 바로 열기
            </button>
          </div>
        )}

        {/* 성경 본문 실시간 미리보기 */}
        {selectedScriptureVerses && selectedScriptureVerses.length > 0 && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-amber-400">
                📖 {selectedNode.bookName} {previewChap}장 본문 미리보기
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

        {/* 원어(히브리어/헬라어) 심층 분석 카드 */}
        {relatedOriginalRoots.length > 0 && (
          <div className="p-3 rounded-xl bg-pink-950/25 border border-pink-500/30 space-y-1.5">
            <span className="text-[10px] font-mono font-black text-pink-400 uppercase block">
              🏛️ 연결된 히브리어 · 헬라어 원어 핵심 해설
            </span>
            {relatedOriginalRoots.slice(0, 2).map(root => (
              <div key={root.id} className="space-y-0.5 pt-1 first:pt-0 border-t first:border-t-0 border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">
                    <span className="text-sm mr-1.5" style={{ color: root.color }}>{root.original}</span>
                    [{root.pron}] — {root.label}
                  </span>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">
                    {root.strongs} • {root.grammar}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{root.meaning}</p>
              </div>
            ))}
          </div>
        )}

        {/* 설교 / QT / 원어 상세 요약문 */}
        {(selectedNode.summary || selectedNode.desc) && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
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

        {/* 연결된 설교·QT·성경 줄단위 나열 리스트 */}
        {connectedNeighbors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-cyan-300 block">
              📋 연결된 말씀·설교·QT 목록 ({connectedNeighbors.length}건 — 터치 시 선택)
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 hide-scrollbar">
              {connectedNeighbors.map(nb => (
                <button
                  key={nb.id}
                  onClick={() => focusCameraOnNode(nb)}
                  className="w-full p-2 rounded-xl bg-black/45 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: nb.color }} />
                    <span className="text-xs font-bold text-white truncate">{nb.label}</span>
                    {nb.ref && <span className="text-[10px] font-mono text-cyan-400 shrink-0">({nb.ref})</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">선택 ▶</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4대 심층 연동 액션 바 */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {selectedNode.bookName && (
            <button
              onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap || selectedNode.chapter || 1)}
              className="py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              📖 {selectedNode.bookName} {previewChap}장 열기
            </button>
          )}

          {(selectedNode.bookName || selectedNode.type === 'original_word') && (
            <button
              onClick={() => handleJumpToInterlinear(selectedNode.bookName || selectedNode.books?.[0] || '창세기', previewChap || selectedNode.chapter || 1, selectedNode.verse || 1)}
              className="py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              🔬 원어 연구실 직행
            </button>
          )}

          <button
            onClick={() => {
              if (selectedNode.bookName) setCreateBook(selectedNode.bookName);
              setCreateChap(previewChap || selectedNode.chapter || 1);
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
    );
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden select-none font-sans flex flex-col" style={{ backgroundColor: theme.bg }}>
      
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-bold border border-cyan-400/40 shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. 상단 컨트롤 & 3대 뷰 모드 전환 헤더 ── */}
      <div className="relative z-30 px-2.5 pt-2.5 pb-1.5 sm:px-4 sm:pt-3 flex flex-col gap-2 border-b backdrop-blur-md shrink-0" style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}>
        
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={() => setActiveScreen('home')}
            className="h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0"
            style={{ borderColor: theme.panelBorder, color: theme.textMain }}
          >
            ◀ <span className="hidden sm:inline">홈</span>
          </button>

          {/* 검색창 */}
          <div 
            className="flex-1 max-w-sm h-9 px-2.5 rounded-xl border flex items-center gap-1.5 bg-black/40"
            style={{ borderColor: theme.panelBorder }}
          >
            <span className="text-xs opacity-60">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="성경, 설교, QT, 원어(헤세드) 검색..."
              className="w-full bg-transparent outline-none text-xs font-medium text-white placeholder:text-slate-400 select-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">✕</button>
            )}
          </div>

          {/* 🌟 [2D 궤도 / 3D 행성 / 📋 나열] 3대 뷰 모드 스위치 */}
          <div className="flex p-0.5 rounded-xl border bg-black/50 shrink-0" style={{ borderColor: theme.panelBorder }}>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === '2d' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              🌌 2D궤도
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === '3d' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              🪐 3D행성
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              📋 나열
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedNode?.bookName) setCreateBook(selectedNode.bookName);
              setIsCreatorOpen(true);
            }}
            className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>➕</span>
            <span className="hidden sm:inline">등록</span>
          </button>

          {viewMode !== 'list' && (
            <button
              onClick={() => setIsControlOpen(!isControlOpen)}
              className={`h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center shrink-0 ${
                isControlOpen ? 'ring-2 ring-cyan-400' : ''
              }`}
              style={{ borderColor: theme.panelBorder, color: theme.textMain }}
              title="궤도 설정"
            >
              ⚙️
            </button>
          )}
        </div>

        {/* 2열: 카테고리 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          {[
            { id: 'all', label: `전체 (${galaxyData.nodes.length})` },
            { id: 'book', label: '📖 성경 66권' },
            { id: 'sermon', label: '🎙️ 설교 아카이브' },
            { id: 'qt', label: '🔥 나의 QT·예배노트' },
            { id: 'original_word', label: '🏛️ 히브리·헬라 원어' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrbitFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                orbitFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                  : 'text-slate-300 bg-black/30 hover:text-white opacity-80'
              }`}
              style={orbitFilter !== tab.id ? { borderColor: theme.panelBorder } : {}}
            >
              {tab.label}
            </button>
          ))}

          {viewMode !== 'list' && (
            <button
              onClick={() => {
                targetCameraRef.current = { x: 0, y: 0, zoom: window.innerWidth < 640 ? 0.56 : 0.68 };
                planetRotRef.current = { yaw: 0.3, pitch: 0.25 };
                setSelectedNode(null);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border text-amber-300 bg-black/30 whitespace-nowrap shrink-0 cursor-pointer"
              style={{ borderColor: theme.panelBorder }}
            >
              🎯 중앙정렬
            </button>
          )}
        </div>
      </div>

      {/* ── 2. 메인 바디 (PC/태블릿은 좌측 캔버스 + 우측 고정 독 스플릿 / 모바일은 풀스크린) ── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 좌측/메인 뷰포트 */}
        <div ref={containerRef} className="flex-1 relative w-full h-full overflow-hidden">
          {viewMode !== 'list' ? (
            <>
              <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
              />

              {/* 좌측 하단 현재 뷰 상태 안내 캡슐 */}
              <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-full bg-black/75 border border-white/10 text-[10.5px] font-bold text-slate-300 pointer-events-none backdrop-blur-xs">
                {viewMode === '3d'
                  ? '🪐 3D 행성 구체 모드: 상·하·좌·우로 드래그하여 행성을 360° 회전하세요!'
                  : '🌌 2D 트랙터 궤도 모드: 성경을 터치하면 원하는 장(Chapter)으로 바로 이동합니다.'}
              </div>
            </>
          ) : (
            /* 📋 [나열 목록 뷰] */
            <div className="w-full h-full overflow-y-auto px-3 py-3 pb-32 space-y-4 max-w-4xl mx-auto hide-scrollbar text-left">
              {(orbitFilter === 'all' || orbitFilter === 'original_word') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-pink-400 px-1">
                    🏛️ ORBIT 5 • 히브리어·헬라어 핵심 원어 ({ORIGINAL_LANGUAGE_ROOTS.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {galaxyData.nodes.filter(n => n.type === 'original_word').map(node => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="p-3 rounded-2xl border bg-slate-900/80 hover:bg-slate-800/90 flex items-center justify-between gap-2 cursor-pointer transition-all"
                        style={{ borderColor: theme.panelBorder }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black" style={{ color: node.color }}>{node.original}</span>
                            <span className="text-xs font-black text-white">{node.koreanName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">{node.strongs}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{node.desc}</p>
                        </div>
                        <span className="text-xs text-cyan-400 font-bold shrink-0">열기 ▶</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {CANON_SECTORS.map(sec => {
                const sectorItems = filteredListNodes.filter(n => n.sector === sec.name);
                if (sectorItems.length === 0) return null;

                const booksInSec = sectorItems.filter(n => n.type === 'book');
                const sermonsAndQtsInSec = sectorItems.filter(n => n.type === 'sermon' || n.type === 'qt');

                return (
                  <div 
                    key={sec.id} 
                    className="p-3.5 rounded-2xl border space-y-3 bg-slate-900/65"
                    style={{ borderColor: theme.panelBorder }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.color }} />
                        <h3 className="text-sm font-black text-white">{sec.name}</h3>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        성경 {booksInSec.length}권 • 강해/묵상 {sermonsAndQtsInSec.length}건
                      </span>
                    </div>

                    {booksInSec.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {booksInSec.map(bNode => (
                          <button
                            key={bNode.id}
                            onClick={() => setSelectedNode(bNode)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selectedNode?.id === bNode.id ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black' : 'bg-black/40 text-slate-200 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                            <span>{bNode.bookName}</span>
                            {bNode.readChaps > 0 && (
                              <span className="text-[9.5px] font-mono text-emerald-400">({bNode.readChaps}/{bNode.totalChaps})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {sermonsAndQtsInSec.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {sermonsAndQtsInSec.map(item => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedNode(item)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              selectedNode?.id === item.id ? 'bg-cyan-950/60 border-cyan-400' : 'bg-black/35 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs shrink-0">{item.type === 'qt' ? '🔥' : '🎙️'}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{item.label}</div>
                                <div className="text-[10.5px] text-slate-400 truncate">
                                  <span className="text-cyan-400 font-mono mr-1.5">{item.ref}</span>
                                  {item.summary}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10.5px] font-bold text-cyan-400 shrink-0">보기 ▶</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 💻 PC & 태블릿 전용 우측 고정 인스펙터 독 (lg 이상에서 상시 표시) */}
        <aside 
          className="hidden lg:flex w-[390px] xl:w-[420px] h-full border-l p-4 flex-col overflow-y-auto hide-scrollbar shrink-0 z-20 text-left"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {renderInspectorContent()}
        </aside>
      </div>

      {/* ── 3. 접이식 궤도 컨트롤러 드로어 ── */}
      {isControlOpen && viewMode !== 'list' && (
        <div 
          className="absolute top-24 right-2.5 sm:right-4 z-40 w-72 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-3 text-xs text-left animate-fade-in"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.panelBorder }}>
            <span className="font-black text-xs tracking-wider uppercase text-cyan-400">⚙️ 궤도 & 행성 제어</span>
            <button onClick={() => setIsControlOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">공전/자전 속도</span>
              <span>{rotationSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0" max="0.8" step="0.04"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">궤도/행성 반경</span>
              <span>{orbitSpacing.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0.7" max="1.6" step="0.05"
              value={orbitSpacing}
              onChange={(e) => setOrbitSpacing(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono">
              <span className="opacity-75">노드 크기</span>
              <span>{nodeScale.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0.6" max="1.8" step="0.1"
              value={nodeScale}
              onChange={(e) => setNodeScale(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-[11px] font-bold opacity-85">외곽 설교·QT 이름도 표시</span>
            <input
              type="checkbox"
              checked={showOuterLabels}
              onChange={(e) => setShowOuterLabels(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </label>

          <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: theme.panelBorder }}>
            <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">우주 테마 팔레트</span>
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
                  {th.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ➕ 새 말씀·설교·QT 통합 등록 모달 ── */}
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

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">연결할 성경 (66권)</label>
                <select
                  value={createBook}
                  onChange={(e) => setCreateBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                >
                  {Object.keys(KO_TO_EN_BOOK).filter(k => /[가-힣]/.test(k)).map(bName => (
                    <option key={bName} value={bName} className="bg-slate-900 text-white">{bName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">장</label>
                <input
                  type="number" min="1" max="150"
                  value={createChap}
                  onChange={(e) => setCreateChap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">절</label>
                <input
                  type="number" min="1" max="176"
                  value={createVerse}
                  onChange={(e) => setCreateVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">제목 / 핵심 메시지</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="예: 광야에서 만나주신 하나님의 헤세드 은혜"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-black/40 border border-white/15 text-white outline-none select-text"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">깨달은 말씀 & 묵상 요약</label>
              <textarea
                rows={3}
                value={createBody}
                onChange={(e) => setCreateBody(e.target.value)}
                placeholder="말씀을 통해 깨달은 은혜나 설교 핵심 요약을 기록하세요..."
                className="w-full p-3 rounded-xl text-xs leading-relaxed bg-black/40 border border-white/15 text-white outline-none resize-none select-text"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-bold text-emerald-400 block mb-1">🎯 삶의 적용 및 실천 결단 (선택)</label>
              <input
                type="text"
                value={createApply}
                onChange={(e) => setCreateApply(e.target.value)}
                placeholder="입력 시 '적용 질문 트래커'에도 자동 등록됩니다."
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

      {/* ── 5. 📱 모바일 전용 바텀 시트 인스펙터 (lg 미만에서만 표시) ── */}
      {selectedNode && (
        <div 
          className="lg:hidden fixed bottom-2.5 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-fade-in text-left max-h-[62vh] overflow-y-auto hide-scrollbar"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {renderInspectorContent()}
        </div>
      )}

    </div>
  );
}
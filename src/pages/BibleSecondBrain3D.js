// src/pages/BibleSecondBrain3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  RotateCcw,
  Plus,
  Minus,
  BookOpen,
  FileText,
  Sparkles,
  Layers,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import { ensureKrv4TxtLoaded, splitPericopeAndVerse } from './Bible';
import bibleData from '../ko_ko.json';

// =====================================================================
// 1. LAYER TRIAGE 4대 코어 궤도 라우터 마스터 데이터
// =====================================================================
const TRIAGE_ORBIT_LAYERS = [
  {
    id: 'PROMPT',
    alias: 'WORD',
    code: '1 symptom · layer 1/4',
    title: 'PROMPT // 원어·정경 로고스',
    korSub: '성경 66권 개역개정4판 & 원어 형태소',
    color: '#FACC15',
    lightColor: '#B45309',
    orbitRadiusRatio: 0.145,
    baseAngle: -Math.PI * 0.68,
    calloutDir: { dx: -78, dy: -46 },
    bridgeCode: 's01 → routing',
    bridgeDesc: 'BHS Hebrew · NA28 Greek',
    bookRef: '창세기',
    chapRef: 1,
    strongsRef: 'H7225',
    desc: '성경 66권(1,189장) 정경 본문과 히브리어·헬라어 원어 스트롱 코드를 직결하는 제1 원천 레이어입니다.'
  },
  {
    id: 'CONTEXT',
    alias: 'CONTEXT',
    code: '4 symptoms · layer 2/4',
    title: 'CONTEXT // 구속사·34만 교차참조',
    korSub: 'TSK 교차참조 · 70인역 · 주석 문맥망',
    color: '#F59E0B',
    lightColor: '#D97706',
    orbitRadiusRatio: 0.215,
    baseAngle: Math.PI * 0.78,
    calloutDir: { dx: -92, dy: 34 },
    bridgeCode: 's08 → routing',
    bridgeDesc: '344K cross-refs verified',
    bookRef: '이사야',
    chapRef: 53,
    strongsRef: 'H5375',
    desc: '신구약 교차참조(TSK)와 언약 신학의 문맥을 실시간 대조하여 성경이 성경을 해석하게 하는 제2 컨텍스트 레이어입니다.'
  },
  {
    id: 'LOOP',
    alias: 'MEDITATION',
    code: '3 symptoms · layer 3/4',
    title: 'LOOP // QT·설교 묵상 순환',
    korSub: '매일 QT 묵상 & 예배 설교노트 동기화',
    color: '#2DD4BF',
    lightColor: '#0D9488',
    orbitRadiusRatio: 0.175,
    baseAngle: Math.PI * 0.22,
    calloutDir: { dx: 24, dy: 32 },
    bridgeCode: 'f07 → LOOP',
    bridgeDesc: 'verify meditation step',
    bookRef: '요한복음',
    chapRef: 1,
    strongsRef: 'G3056',
    desc: '선포된 설교 말씀과 매일의 QT 묵상이 원어 본문과 순환하며 영적 통찰로 응집되는 제3 세컨드브레인 코어입니다.'
  },
  {
    id: 'HARNESS',
    alias: 'PRAXIS',
    code: '3 symptoms · layer 4/4',
    title: 'HARNESS // 기도·삶의 적용 결속',
    korSub: '적용질문 · 감사나눔 · 중보기도 실천',
    color: '#FB923C',
    lightColor: '#EA580C',
    orbitRadiusRatio: 0.245,
    baseAngle: -Math.PI * 0.24,
    calloutDir: { dx: -45, dy: -54 },
    bridgeCode: 'f13 → HARNESS',
    bridgeDesc: 'praxis & prayer locked',
    bookRef: '로마서',
    chapRef: 8,
    strongsRef: 'G26',
    desc: '묵상과 설교에서 깨달은 진리를 삶의 적용 트래커와 중보기도 제목으로 결속하는 제4 실천 레이어입니다.'
  }
];

// =====================================================================
// 2. 우측 아크 18대 핵심 원어(히브리어/헬라어) 마스터 사전
// =====================================================================
const LEXICON_STREAM_CODES = [
  { code: 'f01 H7225', strongs: 'H7225', word: 'בְּרֵאשִׁית', pron: '베레쉬트', mean: '태초에·시작·첫열매', grammar: '명사·여성·단수', book: '창세기', chap: 1, verse: 1, layer: 'PROMPT' },
  { code: 'f02 H430', strongs: 'H430', word: 'אֱלֹהִים', pron: '엘로힘', mean: '전능하신 창조주 하나님', grammar: '명사·남성·장엄복수', book: '창세기', chap: 1, verse: 1, layer: 'PROMPT' },
  { code: 'f03 H1285', strongs: 'H1285', word: 'בְּרִית', pron: '베리트', mean: '언약·피의 맹세', grammar: '명사·여성·단수', book: '출애굽기', chap: 19, verse: 5, layer: 'CONTEXT' },
  { code: 'f04 H3068', strongs: 'H3068', word: 'יְהוָה', pron: '여호와', mean: '스스로 계신 언약의 주', grammar: '고유명사·신명', book: '출애굽기', chap: 3, verse: 14, layer: 'PROMPT' },
  { code: 'f05 H2617', strongs: 'H2617', word: 'חֶסֶד', pron: '헤세드', mean: '인자하심·끝없는 언약적 사랑', grammar: '명사·남성·단수', book: '시편', chap: 23, verse: 6, layer: 'LOOP' },
  { code: 'f06 H7965', strongs: 'H7965', word: 'שָׁלוֹם', pron: '샬롬', mean: '평강·완전한 조화·구원', grammar: '명사·남성·단수', book: '민수기', chap: 6, verse: 26, layer: 'HARNESS' },
  { code: 'f07 H5375', strongs: 'H5375', word: 'נָשָׂא', pron: '나사', mean: '죄를 짊어지다·담당하다', grammar: '동사·칼·완료', book: '이사야', chap: 53, verse: 4, layer: 'CONTEXT' },
  { code: 'f08 H7307', strongs: 'H7307', word: 'רוּחַ', pron: '루아흐', mean: '성령·생기·하나님의 호흡', grammar: '명사·여성·단수', book: '에스겔', chap: 37, verse: 5, layer: 'LOOP' },
  { code: 'f09 H8451', strongs: 'H8451', word: 'תּוֹרָה', pron: '토라', mean: '율법·과녁을 향한 가르침', grammar: '명사·여성·단수', book: '시편', chap: 119, verse: 105, layer: 'PROMPT' },
  { code: 'f10 G3056', strongs: 'G3056', word: 'λόγος', pron: '로고스', mean: '말씀·성육신하신 그리스도', grammar: '명사·주격·남성·단수', book: '요한복음', chap: 1, verse: 1, layer: 'LOOP' },
  { code: 'f11 G5485', strongs: 'G5485', word: 'χάρις', pron: '카리스', mean: '은혜·거저 주시는 선물', grammar: '명사·주격·여성·단수', book: '에베소서', chap: 2, verse: 8, layer: 'LOOP' },
  { code: 'f12 G4102', strongs: 'G4102', word: 'πίστις', pron: '피스티스', mean: '믿음·신실함·확신', grammar: '명사·주격·여성·단수', book: '히브리서', chap: 11, verse: 1, layer: 'HARNESS' },
  { code: 'f13 G26', strongs: 'G26', word: 'ἀγάπη', pron: '아가페', mean: '하나님의 무조건적 사랑', grammar: '명사·주격·여성·단수', book: '로마서', chap: 8, verse: 39, layer: 'HARNESS' },
  { code: 'f14 G4151', strongs: 'G4151', word: 'πνεῦμα', pron: '프뉴마', mean: '성령·생명의 영', grammar: '명사·주격·중성·단수', book: '로마서', chap: 8, verse: 2, layer: 'LOOP' },
  { code: 'f15 G2222', strongs: 'G2222', word: 'ζωή', pron: '조에', mean: '영원한 생명·신적 생명', grammar: '명사·주격·여성·단수', book: '요한복음', chap: 3, verse: 16, layer: 'CONTEXT' },
  { code: 'f16 G1411', strongs: 'G1411', word: 'δύναμις', pron: '뒤나미스', mean: '능력·복음의 폭발적 권능', grammar: '명사·주격·여성·단수', book: '사도행전', chap: 1, verse: 8, layer: 'HARNESS' },
  { code: 'f17 G3875', strongs: 'G3875', word: 'παράκλητος', pron: '파라클레토스', mean: '보혜사·곁에서 돕는 자', grammar: '명사·주격·남성·단수', book: '요한복음', chap: 14, verse: 26, layer: 'CONTEXT' },
  { code: 'f18 G5056', strongs: 'G5056', word: 'τέλος', pron: '텔로스', mean: '완성·구속사의 최종 성취', grammar: '명사·주격·중성·단수', book: '요한계시록', chap: 21, verse: 6, layer: 'PROMPT' }
];

// =====================================================================
// 3. 우측 패널 `SYMPTOM / CANON QUEUE (11)` 9단 세그먼트 데이터
// =====================================================================
const ELEVEN_CANON_QUEUE = [
  { id: 'q01', num: '01', label: 'pentateuch law (모세오경)', sector: '모세오경', layer: 'PROMPT', color: '#F59E0B', bookRef: '창세기', chapRef: 1, strongs: 'H7225' },
  { id: 'q02', num: '02', label: 'covenant history (역사서)', sector: '구약역사서', layer: 'CONTEXT', color: '#F59E0B', bookRef: '사무엘하', chapRef: 7, strongs: 'H1285' },
  { id: 'q03', num: '03', label: 'psalms & wisdom (시가서)', sector: '시가서', layer: 'LOOP', color: '#F59E0B', bookRef: '시편', chapRef: 23, strongs: 'H2617' },
  { id: 'q04', num: '04', label: 'major prophets (대선지서)', sector: '선지서', layer: 'CONTEXT', color: '#F59E0B', bookRef: '이사야', chapRef: 53, strongs: 'H5375' },
  { id: 'q05', num: '05', label: 'minor prophets (소선지서)', sector: '선지서', layer: 'CONTEXT', color: '#F59E0B', bookRef: '미가', chapRef: 5, strongs: 'H7965' },
  { id: 'q06', num: '06', label: 'synoptic gospels (복음서)', sector: '복음서·행전', layer: 'PROMPT', color: '#2DD4BF', bookRef: '마태복음', chapRef: 5, strongs: 'G3056' },
  { id: 'q07', num: '07', label: 'acts ecclesia (사도행전)', sector: '복음서·행전', layer: 'HARNESS', color: '#2DD4BF', bookRef: '사도행전', chapRef: 1, strongs: 'G1411' },
  { id: 'q08', num: '08', label: 'pauline epistles (바울서신)', sector: '바울서신', layer: 'LOOP', color: '#2DD4BF', bookRef: '로마서', chapRef: 8, strongs: 'G26' },
  { id: 'q09', num: '09', label: 'general epistles (공동서신)', sector: '공동서신·계시록', layer: 'HARNESS', color: '#38BDF8', bookRef: '히브리서', chapRef: 11, strongs: 'G4102' },
  { id: 'q10', num: '10', label: 'hebrew/greek lexicon (원어)', sector: '모세오경', layer: 'PROMPT', color: '#FACC15', bookRef: '요한복음', chapRef: 1, strongs: 'G3056' },
  { id: 'q11', num: '11', label: 'apocalypse crown (계시록)', sector: '공동서신·계시록', layer: 'HARNESS', color: '#34D399', bookRef: '요한계시록', chapRef: 21, strongs: 'G5056' }
];

// =====================================================================
// iOS Safari 100% 호환 둥근 사각형 & 전류 광선 & 배지 드로잉 헬퍼
// =====================================================================
function drawSafeRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawElectricBeam(ctx, x1, y1, x2, y2, colorHex, glowColor, tick, isHighlighted = false, isDark = true) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = isHighlighted ? 6.0 : 3.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = isHighlighted ? (isDark ? '#FFFFFF' : colorHex) : colorHex;
  ctx.lineWidth = isHighlighted ? 2.0 : 1.2;
  ctx.stroke();

  if (isHighlighted) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const steps = Math.max(12, Math.floor(dist / 8));

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const d = t * dist;
      const envelope = Math.sin(t * Math.PI);
      const wave = Math.sin(t * 28 - tick * 18) * 3.4 * envelope + Math.cos(t * 53 + tick * 24) * 1.8 * envelope;
      const px = x1 + cosA * d - sinA * wave;
      const py = y1 + sinA * d + cosA * wave;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.3;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = isDark ? 10 : 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const speeds = isHighlighted ? [0.95, 1.35] : [0.65];
  speeds.forEach((spd, sIdx) => {
    const headT = (tick * spd + sIdx * 0.48) % 1;
    const tailSegments = 14;
    for (let s = 0; s < tailSegments; s++) {
      const segT = headT - s * 0.014;
      if (segT < 0 || segT > 1) continue;
      const sx = x1 + (x2 - x1) * segT;
      const sy = y1 + (y2 - y1) * segT;
      const alpha = (1 - s / tailSegments) * (isHighlighted ? 0.95 : 0.7);
      const rad = (1 - s / tailSegments) * (isHighlighted ? 4.0 : 2.4);

      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.6, rad), 0, Math.PI * 2);
      ctx.fillStyle = s < 3 ? (isDark ? `rgba(255,255,255,${alpha})` : colorHex) : colorHex;
      if (s === 0 && isDark) {
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });
  ctx.restore();
}

function drawCrispBadgeText(ctx, text, x, y, textColor, borderColor, align = 'left', isActive = false, isDark = true) {
  ctx.save();
  ctx.font = isActive
    ? '900 10.5px "JetBrains Mono", "Pretendard", monospace'
    : '600 9.5px "JetBrains Mono", "Pretendard", monospace';
  const metrics = ctx.measureText(text);
  const padX = 6;
  const boxW = metrics.width + padX * 2;
  const boxH = isActive ? 19 : 16;

  let boxX = x;
  if (align === 'right') boxX = x - boxW;
  else if (align === 'center') boxX = x - boxW / 2;
  const boxY = y - boxH / 2;

  ctx.fillStyle = isDark
    ? isActive
      ? 'rgba(10, 14, 24, 0.96)'
      : 'rgba(6, 8, 14, 0.86)'
    : isActive
    ? 'rgba(255, 255, 255, 0.98)'
    : 'rgba(248, 250, 252, 0.92)';

  drawSafeRoundRect(ctx, boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.lineWidth = isActive ? 1.5 : 0.8;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, boxX + padX, y + 0.5);
  ctx.restore();
}
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

export default function BibleSecondBrain3D({
  setActiveScreen,
  setCurrentChapId,
  setBibleViewMode,
  setTargetVerse
}) {
  const store = useAppStore();
  const {
    dailyData = {},
    readVerses = {},
    bibleNotes = [],
    generalNotes = [],
    isDarkMode
  } = store;

  // iOS 야간 다크모드 자동 감지 + 앱 테마 100% 호환
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : systemDark;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [activeLayerId, setActiveLayerId] = useState('LOOP');
  const [selectedLexicon, setSelectedLexicon] = useState(LEXICON_STREAM_CODES[9]); // 기본: G3056 로고스
  const [selectedBookChap, setSelectedBookChap] = useState({ bookKo: '요한복음', chap: 1, verse: 1 });
  const [isAutoPulse, setIsAutoPulse] = useState(true);
  const [mobileViewTab, setMobileViewTab] = useState('canvas'); // 'canvas' | 'queue' | 'terminal'
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  // 4대 역본 상태 ('krv4' | 'easy' | 'web' | 'orig')
  const [previewVersion, setPreviewVersion] = useState('krv4');
  const [krv4Db, setKrv4Db] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyDb, setEasyDb] = useState({});
  const [webDb, setWebDb] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // 4대 역본 비동기 로드
  useEffect(() => {
    ensureKrv4TxtLoaded().then((db) => {
      if (db) setKrv4Db(db);
    });
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebDb(d || {})).catch(() => {});
  }, []);

  // 카메라 팬 / 줌 상태
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const hitRegionsRef = useRef([]);

  // =====================================================================
  // 4. 앱 내 성경 통독 · QT · 설교 · 노트 텔레메트리 파싱 엔진
  // =====================================================================
  const telemetry = useMemo(() => {
    const readChapSet = new Set();
    Object.keys(readVerses || {}).forEach((k) => {
      if (readVerses[k]) {
        const [bk, ch] = k.split('-');
        readChapSet.add(`${bk}-${ch}`);
      }
    });

    const bookReadCounts = {};
    const sectorProgress = {};

    BIBLE_66_CANON.forEach((b) => {
      if (!sectorProgress[b.sector]) sectorProgress[b.sector] = { total: 0, read: 0 };
      sectorProgress[b.sector].total += b.chaps;
      let bRead = 0;
      for (let c = 1; c <= b.chaps; c++) {
        if (readChapSet.has(`${b.en}-${c}`) || readChapSet.has(`${b.ko}-${c}`)) {
          bRead++;
          sectorProgress[b.sector].read += 1;
        }
      }
      bookReadCounts[b.ko] = { read: bRead, total: b.chaps, ratio: bRead / Math.max(1, b.chaps) };
    });

    let qtCount = 0;
    let sermonCount = 0;
    let applyCount = 0;
    const cliRoutes = [];

    Object.entries(dailyData || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([dateKey, d]) => {
        if (!d) return;
        if (d.qtTitle || d.qtMeditation) {
          qtCount++;
          const ref = d.qtReference || '시편 119:105';
          cliRoutes.push({
            id: `qt_${dateKey}`,
            cmd: 'ROUTE',
            src: `${dateKey} QT묵상`,
            layer: 'LOOP',
            dest: `${ref} · ${(d.qtTitle || d.qtMeditation || '').replace(/<[^>]*>?/gm, '').slice(0, 34)}`,
            color: '#2DD4BF',
            bookRef: ref,
            screen: 'qt'
          });
        }
        if (d.sermonTitle || d.sermonNotes) {
          sermonCount++;
          const ref = d.sermonReference || '요한복음 1:1';
          cliRoutes.push({
            id: `serm_${dateKey}`,
            cmd: 'ROUTE',
            src: `${dateKey} 설교노트`,
            layer: 'CONTEXT',
            dest: `${ref} · ${(d.sermonTitle || '예배 설교 강해').slice(0, 34)}`,
            color: '#F59E0B',
            bookRef: ref,
            screen: 'sermon'
          });
        }
        if (d.sermonActionItem || d.qtGraceLine || d.sermonGraceLine) {
          applyCount++;
        }
      });

    const defaultRoutes = [
      { id: 'def_1', cmd: 'ROUTE', src: 'H7225 בְּרֵאשִׁית', layer: 'PROMPT', dest: '창세기 1:1 · BHS 히브리어 원어 형태소 파싱 완료', color: '#FACC15', bookRef: '창세기 1:1', screen: 'interlinear' },
      { id: 'def_2', cmd: 'ROUTE', src: 'G3056 λόγος', layer: 'LOOP', dest: '요한복음 1:14 · 말씀이 육신이 되어 (로고스 결합)', color: '#2DD4BF', bookRef: '요한복음 1:14', screen: 'interlinear' },
      { id: 'def_3', cmd: 'ROUTE', src: 'TSK 344K Cross-Ref', layer: 'CONTEXT', dest: '이사야 53:5 ↔ 베드로전서 2:24 · 대속 언약 시냅스', color: '#F59E0B', bookRef: '이사야 53:5', screen: 'bible' },
      { id: 'def_4', cmd: 'ROUTE', src: 'G26 ἀγάπη', layer: 'HARNESS', dest: '로마서 8:28 · 삶의 적용 트래커 & 중보기도 동기화', color: '#FB923C', bookRef: '로마서 8:28', screen: 'qt' }
    ];

    return {
      totalReadChaps: readChapSet.size,
      qtCount,
      sermonCount,
      applyCount,
      totalNotes: qtCount + sermonCount + (bibleNotes?.length || 0) + (generalNotes?.length || 0),
      bookReadCounts,
      sectorProgress,
      cliRoutes: [...cliRoutes, ...defaultRoutes].slice(0, 6)
    };
  }, [dailyData, readVerses, bibleNotes, generalNotes]);

  const activeLayerObj = useMemo(
    () => TRIAGE_ORBIT_LAYERS.find((l) => l.id === activeLayerId) || TRIAGE_ORBIT_LAYERS[2],
    [activeLayerId]
  );

  // 현재 포커스된 성경 권/장의 4대 역본 데이터 + 연결된 내 QT/설교/노트 역추적
  const scripturePreview = useMemo(() => {
    const bMeta = BIBLE_66_CANON.find((b) => b.ko === selectedBookChap.bookKo) || BIBLE_66_CANON[42];
    const chapNum = Math.max(1, Math.min(bMeta.chaps, selectedBookChap.chap || 1));
    const bookIndex = BIBLE_66_CANON.findIndex((b) => b.ko === bMeta.ko) + 1;

    const krv4Chap = krv4Db?.[bMeta.en]?.[chapNum - 1] || krv4Db?.[bMeta.ko]?.[chapNum - 1];
    const fallbackBook = (Array.isArray(bibleData) ? bibleData : []).find((b) => b.name === bMeta.en || b.name === bMeta.ko);
    const baseVerses = krv4Chap || fallbackBook?.chapters?.[chapNum - 1] || [];

    const verses = baseVerses.slice(0, 3).map((raw, i) => {
      const vNum = i + 1;
      const decoded = String(raw || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
      const { pureText } = splitPericopeAndVerse(decoded);
      return {
        v: vNum,
        krv4: pureText || decoded,
        easy: easyDb[`${bMeta.ko}-${chapNum}-${vNum}`] || '',
        web: webDb[`${bMeta.ko}-${chapNum}-${vNum}`] || webDb[`${bMeta.en}-${chapNum}-${vNum}`] || ''
      };
    });

    // 현재 권/장에 연결된 내 QT · 설교 · 성경노트 역추적
    const linkedRecords = [];
    Object.entries(dailyData || {}).forEach(([dateKey, d]) => {
      if (!d) return;
      const qtRefStr = `${d.qtReference || ''} ${d.qtTitle || ''}`;
      if (qtRefStr.includes(bMeta.ko)) {
        linkedRecords.push({
          id: `lqt_${dateKey}`,
          badge: 'QT',
          date: dateKey,
          title: d.qtTitle || d.qtReference || `${bMeta.ko} QT`,
          screen: 'qt'
        });
      }
      const sermRefStr = `${d.sermonReference || ''} ${d.sermonTitle || ''}`;
      if (sermRefStr.includes(bMeta.ko)) {
        linkedRecords.push({
          id: `lserm_${dateKey}`,
          badge: '설교',
          date: dateKey,
          title: d.sermonTitle || d.sermonReference || `${bMeta.ko} 설교`,
          screen: 'sermon'
        });
      }
    });

    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      if (refStr.includes(bMeta.ko)) {
        linkedRecords.push({
          id: `lbn_${bn.id}`,
          badge: '노트',
          date: bn.date || '',
          title: `${refStr} · ${(bn.note || '').slice(0, 22)}`,
          screen: 'diary'
        });
      }
    });

    return {
      bookKo: bMeta.ko,
      bookEn: bMeta.en,
      bookCode: `s${String(bookIndex).padStart(2, '0')}`,
      chap: chapNum,
      totalChaps: bMeta.chaps,
      sector: bMeta.sector,
      verses,
      linkedRecords: linkedRecords.slice(0, 4)
    };
  }, [selectedBookChap, krv4Db, easyDb, webDb, dailyData, bibleNotes]);

  // =====================================================================
  // 5. 통합 검색 엔진 (성경 권명 · 구절 · 원어 · 본문 키워드)
  // =====================================================================
  const handleRunOmniboxSearch = useCallback(
    (qStr) => {
      const q = (qStr || '').trim();
      setSearchQuery(qStr);
      if (!q) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      const hits = [];
      const parsedRefs = extractAllBibleRefsFromText(q);
      if (parsedRefs.length > 0) {
        parsedRefs.forEach((r) => {
          hits.push({
            id: `ref_${r.bookKo}_${r.chapter}`,
            badge: '성경구절',
            color: '#0D9488',
            title: `${r.bookKo} ${r.chapter}장 ${r.verse ? `${r.verse}절` : ''}`,
            sub: '해당 성경 아크 및 4대 역본으로 즉시 이동',
            action: () => {
              setSelectedBookChap({ bookKo: r.bookKo, chap: r.chapter || 1, verse: r.verse || 1 });
              setActiveLayerId('PROMPT');
            }
          });
        });
      }

      LEXICON_STREAM_CODES.forEach((lex) => {
        if (
          lex.code.toLowerCase().includes(q.toLowerCase()) ||
          lex.word.includes(q) ||
          lex.pron.includes(q) ||
          lex.mean.includes(q)
        ) {
          hits.push({
            id: `lex_${lex.code}`,
            badge: `원어 ${lex.strongs}`,
            color: '#D97706',
            title: `${lex.word} (${lex.pron}) — ${lex.mean}`,
            sub: `${lex.book} ${lex.chap}:${lex.verse} · ${lex.grammar}`,
            action: () => {
              setSelectedLexicon(lex);
              setActiveLayerId(lex.layer);
              setSelectedBookChap({ bookKo: lex.book, chap: lex.chap, verse: lex.verse });
            }
          });
        }
      });

      BIBLE_66_CANON.forEach((b, idx) => {
        if (b.ko.includes(q) || b.en.toLowerCase().includes(q.toLowerCase())) {
          hits.push({
            id: `bk_${b.ko}`,
            badge: `s${String(idx + 1).padStart(2, '0')} ${b.sector}`,
            color: '#2563EB',
            title: `${b.ko} (${b.en}) 전체 ${b.chaps}장`,
            sub: `통독: ${telemetry.bookReadCounts[b.ko]?.read || 0}/${b.chaps}장`,
            action: () => {
              setSelectedBookChap({ bookKo: b.ko, chap: 1, verse: 1 });
              setActiveLayerId('CONTEXT');
            }
          });
        }
      });

      setSearchResults(hits.slice(0, 10));
      setShowSearchDropdown(true);
    },
    [telemetry.bookReadCounts]
  );

  const rightConstellationParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 85; i++) {
      pts.push({
        normY: (i / 84) * 2 - 1,
        spreadX: ((i * 29) % 100) / 100,
        size: 1.5 + (i % 4) * 0.8,
        phase: i * 0.7,
        isCyan: i % 3 !== 0,
        isHub: i % 9 === 0
      });
    }
    return pts;
  }, []);

  // =====================================================================
  // 6. 60FPS `LAYER TRIAGE` 캔버스 렌더러 (다크/라이트 100% 대응)
  // =====================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const render = () => {
      tick += 0.016;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (!width || !height || width < 20) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = isDark ? '#040508' : '#F4F6F9';
      ctx.fillRect(0, 0, width, height);

      const cam = cameraRef.current;
      ctx.save();
      ctx.translate(width / 2 + cam.x, height / 2 + cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      const minDim = Math.min(width, height);
      const orbitCenter = { x: 0, y: 0 };

      // 미세 테크니컬 그리드
      const gridSpan = Math.max(width, height) * 1.2;
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.04)' : 'rgba(15, 23, 42, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = -gridSpan; gx <= gridSpan; gx += 48) {
        ctx.moveTo(gx, -gridSpan);
        ctx.lineTo(gx, gridSpan);
      }
      for (let gy = -gridSpan; gy <= gridSpan; gy += 48) {
        ctx.moveTo(-gridSpan, gy);
        ctx.lineTo(gridSpan, gy);
      }
      ctx.stroke();

      // 볼류메트릭 오라
      const bgGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, minDim * 0.48);
      if (isDark) {
        bgGlow.addColorStop(0, 'rgba(45, 212, 191, 0.16)');
        bgGlow.addColorStop(0.38, 'rgba(88, 28, 135, 0.18)');
        bgGlow.addColorStop(0.75, 'rgba(245, 158, 11, 0.06)');
        bgGlow.addColorStop(1, 'rgba(4, 5, 8, 0)');
      } else {
        bgGlow.addColorStop(0, 'rgba(37, 99, 235, 0.12)');
        bgGlow.addColorStop(0.45, 'rgba(13, 148, 136, 0.08)');
        bgGlow.addColorStop(1, 'rgba(244, 246, 249, 0)');
      }
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.48, 0, Math.PI * 2);
      ctx.fill();

      const arcR = Math.max(300, minDim * 0.88);
      const maxArcAngle = 0.56;
      const leftArcSpineX = -Math.min(width * 0.22, 230);
      const leftArcCx = leftArcSpineX - arcR;
      const rightArcSpineX = Math.min(width * 0.20, 210);
      const rightArcCx = rightArcSpineX + arcR;
      const nextHitRegions = [];

      // 좌측 브래킷 아크 `)` — 160채널 스펙트럼 & 성경 66권
      ctx.save();
      const totalLeftNeedles = 160;
      for (let i = 0; i < totalLeftNeedles; i++) {
        const norm = i / (totalLeftNeedles - 1) - 0.5;
        const ang = norm * (maxArcAngle * 2);
        const bIdx = Math.min(65, Math.floor((i / totalLeftNeedles) * 66));
        const book = BIBLE_66_CANON[bIdx];
        const readRatio = telemetry.bookReadCounts[book.ko]?.ratio || 0;
        const isCurrentBook = selectedBookChap.bookKo === book.ko;

        const wave = Math.sin(tick * 3.6 + i * 0.22) * 9 + Math.cos(tick * 2.0 - i * 0.15) * 6;
        const barLen = Math.max(12, 24 + readRatio * 36 + ((i * 19) % 28) + wave + (isCurrentBook ? 20 : 0));

        ctx.beginPath();
        ctx.moveTo(leftArcCx + Math.cos(ang) * arcR, Math.sin(ang) * arcR);
        ctx.lineTo(leftArcCx + Math.cos(ang) * (arcR - barLen), Math.sin(ang) * (arcR - barLen));
        if (isCurrentBook) {
          ctx.strokeStyle = isDark ? '#FFFFFF' : '#2563EB';
          ctx.lineWidth = 2.2;
        } else if (i % 7 === 0 || readRatio > 0) {
          ctx.strokeStyle = bIdx < 39 ? 'rgba(217, 119, 6, 0.78)' : 'rgba(13, 148, 136, 0.78)';
          ctx.lineWidth = 1.3;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(180, 120, 40, 0.32)' : 'rgba(100, 116, 139, 0.28)';
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();
      }

      [arcR, arcR + 9].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(leftArcCx, 0, r, -maxArcAngle, maxArcAngle);
        ctx.strokeStyle = idx === 0 ? '#D97706' : 'rgba(13, 148, 136, 0.55)';
        ctx.lineWidth = idx === 0 ? 2.0 : 1.2;
        ctx.stroke();
      });

      BIBLE_66_CANON.forEach((book, bIdx) => {
        const isCurrentBook = selectedBookChap.bookKo === book.ko;
        if (bIdx % 4 !== 0 && !isCurrentBook) return;
        const norm = bIdx / 65 - 0.5;
        const ang = norm * (maxArcAngle * 1.92);
        const lx = leftArcCx + Math.cos(ang) * (arcR - 72);
        const ly = Math.sin(ang) * (arcR - 72);
        const codeStr = `s${String(bIdx + 1).padStart(2, '0')} ${book.ko}`;

        drawCrispBadgeText(
          ctx,
          codeStr,
          lx,
          ly,
          isCurrentBook ? (isDark ? '#FACC15' : '#2563EB') : isDark ? (bIdx < 39 ? '#FDE68A' : '#99F6E4') : '#1E293B',
          isCurrentBook ? (isDark ? '#FACC15' : '#2563EB') : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)',
          'right',
          isCurrentBook,
          isDark
        );

        nextHitRegions.push({ id: `book_${book.ko}`, type: 'book', x: lx - 38, y: ly, r: 20, bookKo: book.ko, chap: 1 });
      });
      ctx.restore();

      // 우측 브래킷 아크 `(` — 18대 원어 스트림 & 외곽 시냅스 성단
      ctx.save();
      const constellationNodes = rightConstellationParticles.map((pt) => {
        const ang = Math.PI + pt.normY * (maxArcAngle * 0.95);
        const baseX = rightArcCx + Math.cos(ang) * (arcR - 14);
        const baseY = Math.sin(ang) * (arcR - 14);
        return {
          ...pt,
          x: baseX + 46 + pt.spreadX * Math.min(180, width * 0.22) + Math.sin(tick * 0.8 + pt.phase) * 4,
          y: baseY + Math.cos(tick * 0.7 + pt.phase) * 4
        };
      });

      ctx.lineWidth = 0.85;
      for (let i = 0; i < constellationNodes.length; i++) {
        for (let j = i + 1; j < constellationNodes.length; j++) {
          const d = Math.hypot(constellationNodes[i].x - constellationNodes[j].x, constellationNodes[i].y - constellationNodes[j].y);
          if (d < 44) {
            const alpha = (1 - d / 44) * (isDark ? 0.36 : 0.25);
            ctx.strokeStyle = constellationNodes[i].isCyan ? `rgba(13, 148, 136, ${alpha})` : `rgba(217, 119, 6, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(constellationNodes[i].x, constellationNodes[i].y);
            ctx.lineTo(constellationNodes[j].x, constellationNodes[j].y);
            ctx.stroke();
          }
        }
      }

      constellationNodes.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isHub ? p.size * 1.4 : p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isHub ? (isDark ? '#FFFFFF' : '#2563EB') : p.isCyan ? '#0D9488' : '#D97706';
        ctx.fill();
      });

      [arcR, arcR - 10].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(rightArcCx, 0, r, Math.PI - maxArcAngle, Math.PI + maxArcAngle);
        ctx.strokeStyle = idx === 0 ? '#0D9488' : 'rgba(217, 119, 6, 0.48)';
        ctx.lineWidth = idx === 0 ? 2.0 : 1.2;
        ctx.stroke();
      });

      let activeLexiconAnchor = null;
      LEXICON_STREAM_CODES.forEach((lex, lIdx) => {
        const norm = lIdx / (LEXICON_STREAM_CODES.length - 1) - 0.5;
        const ang = Math.PI - norm * (maxArcAngle * 1.88);
        const dx = rightArcCx + Math.cos(ang) * (arcR - 10);
        const dy = Math.sin(ang) * (arcR - 10);
        const isSelLex = selectedLexicon?.code === lex.code;
        const isLayerMatch = lex.layer === activeLayerId;

        if (isSelLex) activeLexiconAnchor = { x: dx, y: dy, lex };

        ctx.beginPath();
        ctx.arc(dx, dy, isSelLex ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelLex ? (isDark ? '#FFFFFF' : '#2563EB') : isLayerMatch ? '#D97706' : isDark ? '#090D16' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = isSelLex ? 2 : 1.3;
        ctx.strokeStyle = isSelLex ? '#0D9488' : isLayerMatch ? '#D97706' : 'rgba(13, 148, 136, 0.65)';
        ctx.stroke();

        const labelText = isSelLex ? `${lex.code} ${lex.word} (${lex.pron})` : `${lex.code} ${lex.word}`;
        drawCrispBadgeText(
          ctx,
          labelText,
          dx + 14,
          dy,
          isSelLex ? (isDark ? '#5EEAD4' : '#0F766E') : isLayerMatch ? (isDark ? '#FEF08A' : '#B45309') : isDark ? '#E2E8F0' : '#334155',
          isSelLex ? '#0D9488' : isLayerMatch ? 'rgba(217,119,6,0.45)' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)',
          'left',
          isSelLex,
          isDark
        );

        nextHitRegions.push({ id: `lex_${lex.code}`, type: 'lexicon', x: dx + 60, y: dy, r: 22, lexicon: lex });
      });
      ctx.restore();

      // 중앙 동심 점선 궤도 링
      [0.145, 0.195, 0.245].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(orbitCenter.x, orbitCenter.y, minDim * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.16)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      if (activeLexiconAnchor) {
        drawElectricBeam(ctx, 0, 0, activeLexiconAnchor.x, activeLexiconAnchor.y, '#0D9488', 'rgba(13, 148, 136, 0.24)', tick, true, isDark);
      }

      // 4대 회전 궤도 레이어 노드
      TRIAGE_ORBIT_LAYERS.forEach((layer, idx) => {
        const currentAng = layer.baseAngle + (isAutoPulse ? Math.sin(tick * 0.42 + idx * 1.3) * 0.1 : 0);
        const r = minDim * layer.orbitRadiusRatio;
        const nx = Math.cos(currentAng) * r;
        const ny = Math.sin(currentAng) * r;
        const isAct = activeLayerId === layer.id;
        const lColor = isDark ? layer.color : layer.lightColor;

        drawElectricBeam(ctx, 0, 0, nx, ny, lColor, isAct ? 'rgba(217, 119, 6, 0.25)' : 'rgba(148, 163, 184, 0.08)', tick, isAct, isDark);

        if (isAct) {
          const arcHitY = Math.max(-arcR * 0.48, Math.min(arcR * 0.48, ny));
          const arcHitX = leftArcCx + Math.sqrt(Math.max(0, arcR * arcR - arcHitY * arcHitY));
          drawElectricBeam(ctx, nx, ny, arcHitX, arcHitY, lColor, 'rgba(217, 119, 6, 0.24)', tick, true, isDark);
        }

        const outerR = isAct ? 22 : 16;
        ctx.beginPath();
        ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(8, 10, 18, 0.94)' : 'rgba(255, 255, 255, 0.96)';
        ctx.fill();
        ctx.lineWidth = isAct ? 2.2 : 1.4;
        ctx.strokeStyle = lColor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, isAct ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isAct ? (isDark ? '#FFFFFF' : lColor) : lColor;
        ctx.fill();

        const boxW = 104;
        const boxH = 34;
        const boxX = nx + layer.calloutDir.dx;
        const boxY = ny + layer.calloutDir.dy;
        ctx.fillStyle = isDark ? 'rgba(10, 14, 24, 0.94)' : 'rgba(255, 255, 255, 0.96)';
        drawSafeRoundRect(ctx, boxX, boxY, boxW, boxH, 4);
        ctx.fill();
        ctx.strokeStyle = isAct ? lColor : isDark ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.18)';
        ctx.lineWidth = isAct ? 1.5 : 1;
        ctx.stroke();

        ctx.font = '900 10px "JetBrains Mono", monospace';
        ctx.fillStyle = lColor;
        ctx.textAlign = 'left';
        ctx.fillText(layer.id, boxX + 8, boxY + 13);
        ctx.font = '600 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
        ctx.fillText(layer.code, boxX + 8, boxY + 25);

        nextHitRegions.push({
          id: `layer_${layer.id}`,
          type: 'layer',
          x: nx,
          y: ny,
          r: 28,
          layerId: layer.id,
          bookKo: layer.bookRef,
          chap: layer.chapRef,
          strongs: layer.strongsRef
        });
      });

      // 정중앙 TRIAGE 코어
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#FFFFFF' : '#2563EB';
      ctx.fill();

      hitRegionsRef.current = nextHitRegions;
      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeLayerId, selectedLexicon, selectedBookChap, isAutoPulse, telemetry, rightConstellationParticles, isDark]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    cameraRef.current = { x: 0, y: 0, zoom: rect.width < 520 ? 0.72 : rect.width < 900 ? 0.86 : 1.0 };
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, mobileViewTab]);

  const findHitTarget = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cam = cameraRef.current;
    const wx = (clientX - rect.left - (canvas.width / dpr / 2 + cam.x)) / cam.zoom;
    const wy = (clientY - rect.top - (canvas.height / dpr / 2 + cam.y)) / cam.zoom;
    return hitRegionsRef.current.find((r) => Math.hypot(wx - r.x, wy - r.y) <= (r.r || 24)) || null;
  };

  const handlePointerDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      pinchDistRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      return;
    }
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = { x: cx, y: cy };
  };

  const handlePointerMove = (e) => {
    if (e.touches && e.touches.length === 2 && pinchDistRef.current) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      cameraRef.current.zoom = Math.max(0.45, Math.min(2.4, cameraRef.current.zoom * (dist / pinchDistRef.current)));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
      return;
    }
    if (!isDraggingRef.current) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = cx - dragStartRef.current.x;
    const dy = cy - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) dragMovedRef.current = true;
    cameraRef.current.x += dx;
    cameraRef.current.y += dy;
    dragStartRef.current = { x: cx, y: cy };
  };

  const handlePointerUp = (e) => {
    pinchDistRef.current = null;
    const wasMoved = dragMovedRef.current;
    isDraggingRef.current = false;
    if (!wasMoved) {
      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const hit = findHitTarget(cx, cy);
      if (hit) {
        if (hit.type === 'layer') {
          setActiveLayerId(hit.layerId);
          setSelectedBookChap({ bookKo: hit.bookKo, chap: hit.chap || 1, verse: 1 });
          const matchedLex = LEXICON_STREAM_CODES.find((l) => l.strongs === hit.strongs);
          if (matchedLex) setSelectedLexicon(matchedLex);
        } else if (hit.type === 'lexicon' && hit.lexicon) {
          setSelectedLexicon(hit.lexicon);
          setActiveLayerId(hit.lexicon.layer);
          setSelectedBookChap({ bookKo: hit.lexicon.book, chap: hit.lexicon.chap, verse: hit.lexicon.verse || 1 });
        } else if (hit.type === 'book') {
          setSelectedBookChap({ bookKo: hit.bookKo, chap: hit.chap || 1, verse: 1 });
        }
      }
    }
  };

  const handleJumpToBible = (bookKo, chap = 1, verse = 1) => {
    const bMeta = BIBLE_66_CANON.find((b) => b.ko === bookKo) || BIBLE_66_CANON[0];
    if (typeof setCurrentChapId === 'function') setCurrentChapId(`${bMeta.en}-${chap}`);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(verse || 1);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  const handleJumpToInterlinear = (bookKo, chap = 1, verse = 1) => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({ book: bookKo, chapter: Number(chap) || 1, verse: Number(verse) || 1 }));
    } catch (_) {}
    if (typeof setActiveScreen === 'function') setActiveScreen('interlinear');
  };

  // 다크/라이트 100% 호환 토큰
  const bgShell = isDark ? 'bg-[#040508] text-slate-100' : 'bg-[#F4F6F9] text-[#191F28]';
  const surfaceBg = isDark ? 'bg-[#070910]' : 'bg-white';
  const subBg = isDark ? 'bg-[#0D111A]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-white/15' : 'border-[#E2E8F0]';
  const textSub = isDark ? 'text-slate-400' : 'text-[#64748B]';

  return (
    <div
      style={{ height: '100dvh', colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 w-full flex flex-col overflow-hidden select-none font-mono relative ${bgShell}`}
    >
      {/* 1. 상단 LAYER TRIAGE 헤더 + Omnibox 통합 검색 */}
      <header className={`shrink-0 ${surfaceBg} border-b ${borderClass} z-30`}>
        <div className={`px-3 sm:px-5 py-2 flex items-center justify-between gap-2 border-b ${borderClass}`}>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveScreen && setActiveScreen('galaxy')}
              className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} text-[11px] font-bold flex items-center gap-1 cursor-pointer`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GALAXY</span>
            </button>
            <div>
              <div className="text-[12.5px] sm:text-[14px] font-black tracking-widest text-[#D97706] leading-none">
                LAYER TRIAGE
              </div>
              <div className={`text-[9.5px] ${textSub} mt-0.5 hidden sm:block`}>
                prompt · context · loop · harness
              </div>
            </div>
          </div>

          {/* 통합 검색창 */}
          <div className="relative flex-1 max-w-xs sm:max-w-md mx-1">
            <div className={`flex items-center ${subBg} border ${borderClass} focus-within:border-[#0D9488] rounded-lg px-2.5 h-8`}>
              <Search className="w-3.5 h-3.5 text-[#0D9488] mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleRunOmniboxSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                placeholder="성경·원어(로고스/H7225)·구절 검색..."
                className="w-full bg-transparent text-[12px] font-sans font-medium outline-none select-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className={`absolute left-0 right-0 top-full mt-1 ${surfaceBg} border border-[#0D9488]/60 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y ${isDark ? 'divide-white/10' : 'divide-slate-100'} font-sans`}>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setShowSearchDropdown(false);
                    }}
                    className="p-2.5 hover:bg-[#2563EB]/10 cursor-pointer flex flex-col gap-0.5 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold truncate">{item.title}</span>
                      <span style={{ color: item.color }} className="text-[10px] font-mono font-bold shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <span className={`text-[11px] ${textSub} truncate`}>{item.sub}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAutoPulse((prev) => !prev)}
            className={`h-8 px-2.5 sm:px-3 rounded-full border text-[10px] font-black tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isAutoPulse ? 'border-[#0D9488] bg-[#0D9488]/15 text-[#0D9488]' : `${borderClass} ${subBg} ${textSub}`
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoPulse ? 'bg-[#0D9488] animate-ping' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">{isAutoPulse ? 'ROUTING' : 'PAUSED'}</span>
          </button>
        </div>

        {/* 2단 레이어 & 장 네비게이터 */}
        <div className={`px-3 sm:px-5 py-1.5 ${subBg} flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar text-[10.5px]`}>
          <div className="flex items-center gap-3 shrink-0">
            {TRIAGE_ORBIT_LAYERS.map((l) => {
              const isAct = activeLayerId === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setActiveLayerId(l.id);
                    setSelectedBookChap({ bookKo: l.bookRef, chap: l.chapRef, verse: 1 });
                    const matchedLex = LEXICON_STREAM_CODES.find((lx) => lx.strongs === l.strongsRef);
                    if (matchedLex) setSelectedLexicon(matchedLex);
                  }}
                  className={`flex items-center gap-1 cursor-pointer ${isAct ? 'font-black' : 'opacity-60 hover:opacity-100'}`}
                >
                  <span style={{ color: isDark ? l.color : l.lightColor }}>{l.id}</span>
                </button>
              );
            })}
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${borderClass} ${surfaceBg} shrink-0`}>
            <span className="text-[#D97706] font-bold">{scripturePreview.bookKo}</span>
            <button
              type="button"
              onClick={() => setSelectedBookChap((prev) => ({ ...prev, chap: Math.max(1, (prev.chap || 1) - 1) }))}
              className="p-0.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-black">{scripturePreview.chap}장</span>
            <button
              type="button"
              onClick={() => setSelectedBookChap((prev) => ({ ...prev, chap: Math.min(scripturePreview.totalChaps, (prev.chap || 1) + 1) }))}
              className="p-0.5 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. 메인 바디 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 좌측: 아크 캔버스 + 하단 4대 역본/CLI 지식 패널 */}
        <div className={`flex-1 flex flex-col relative overflow-hidden ${mobileViewTab === 'queue' ? 'hidden lg:flex' : 'flex'}`}>
          <div
            ref={containerRef}
            className={`flex-1 relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing ${
              mobileViewTab === 'terminal' ? 'hidden sm:block' : 'block'
            }`}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              onWheel={(e) => {
                cameraRef.current.zoom = Math.max(0.45, Math.min(2.4, cameraRef.current.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
              }}
              className="absolute inset-0 w-full h-full touch-none"
            />

            {/* 좌측 상단 포커스 HUD 카드 (모바일 접기/펼치기 지원) */}
            <div className={`absolute top-2.5 left-2.5 z-20 w-[230px] sm:w-[275px] ${surfaceBg}/95 backdrop-blur-md border ${borderClass} rounded-xl p-2.5 sm:p-3 shadow-xl pointer-events-auto`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ color: isDark ? activeLayerObj.color : activeLayerObj.lightColor }} className="text-[15px] sm:text-[18px] font-black tracking-wider">
                    {activeLayerObj.id}
                  </span>
                  <span className="text-[9.5px] font-bold text-[#0D9488] truncate">{activeLayerObj.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHudCollapsed((p) => !p)}
                  className={`p-1 rounded ${subBg} cursor-pointer shrink-0`}
                  aria-label="HUD 접기"
                >
                  {isHudCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!isHudCollapsed && (
                <>
                  <div className={`text-[11px] font-sans font-bold ${textSub} mt-0.5`}>{activeLayerObj.korSub}</div>

                  {selectedLexicon && (
                    <div className={`mt-2 p-2 rounded-lg ${subBg} border ${borderClass} space-y-0.5 font-sans`}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-[#D97706]">{selectedLexicon.code}</span>
                        <span className="text-[#0D9488] font-bold">{selectedLexicon.book} {selectedLexicon.chap}:{selectedLexicon.verse}</span>
                      </div>
                      <div className="text-[13.5px] font-bold">
                        {selectedLexicon.word} <span className="text-[11.5px] text-[#D97706]">[{selectedLexicon.pron}]</span>
                      </div>
                      <div className={`text-[11px] ${textSub}`}>{selectedLexicon.mean}</div>
                    </div>
                  )}

                  <div className={`grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t ${borderClass} font-sans`}>
                    <button
                      type="button"
                      onClick={() => handleJumpToBible(scripturePreview.bookKo, scripturePreview.chap, selectedBookChap.verse)}
                      className="py-1.5 px-2 rounded-lg bg-[#0D9488]/15 text-[#0D9488] text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" /> 성경 본문
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToInterlinear(scripturePreview.bookKo, scripturePreview.chap, selectedBookChap.verse)}
                      className="py-1.5 px-2 rounded-lg bg-[#D97706]/15 text-[#D97706] text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> 원어 분석
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScreen && setActiveScreen('qt')}
                      className={`py-1 px-2 rounded-lg ${subBg} border ${borderClass} text-[10px] font-bold cursor-pointer`}
                    >
                      오늘의 QT
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScreen && setActiveScreen('sermon')}
                      className={`py-1 px-2 rounded-lg ${subBg} border ${borderClass} text-[10px] font-bold cursor-pointer`}
                    >
                      예배 설교노트
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 우측 하단 줌 컨트롤 */}
            <div className={`absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 ${surfaceBg}/90 border ${borderClass} px-1.5 py-1 rounded-lg`}>
              <button type="button" onClick={() => { cameraRef.current.zoom = Math.min(2.4, cameraRef.current.zoom + 0.15); }} className="p-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => { cameraRef.current.zoom = Math.max(0.45, cameraRef.current.zoom - 0.15); }} className="p-1 cursor-pointer">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleResize} className="p-1 text-[#0D9488] cursor-pointer" title="초기화">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2-B. 하단 4대 역본 대조 & 내 QT/설교/노트 역추적 & CLI 터미널 */}
          <div
            className={`shrink-0 ${surfaceBg} border-t ${borderClass} px-3.5 py-2.5 z-20 overflow-y-auto ${
              mobileViewTab === 'canvas' ? 'hidden sm:block' : mobileViewTab === 'terminal' ? 'flex-1' : 'block'
            }`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
              {/* 좌측: CLI 라우팅 로그 + 현재 권/장 연결 노트 */}
              <div className="xl:col-span-6 space-y-2">
                <div className={`flex items-center justify-between pb-1.5 border-b ${borderClass} text-[10.5px]`}>
                  <span className="text-[#D97706] font-bold truncate">
                    $ route --target {scripturePreview.bookCode}_{scripturePreview.bookKo} {scripturePreview.chap}장
                  </span>
                  <span className="text-[#0D9488] font-bold shrink-0">SYNCED</span>
                </div>

                <div className="space-y-1 text-[11px]">
                  {telemetry.cliRoutes.slice(0, 3).map((rt) => (
                    <div
                      key={rt.id}
                      onClick={() => {
                        const refs = extractAllBibleRefsFromText(rt.bookRef);
                        if (refs.length > 0) setSelectedBookChap({ bookKo: refs[0].bookKo, chap: refs[0].chapter || 1, verse: refs[0].verse || 1 });
                        setActiveLayerId(rt.layer);
                      }}
                      className={`flex items-center gap-1.5 truncate hover:bg-[#2563EB]/10 px-1.5 py-0.5 rounded cursor-pointer`}
                    >
                      <span className={textSub}>{rt.cmd}</span>
                      <span className="font-bold">{rt.src}</span>
                      <span style={{ color: rt.color }} className="font-black">→ {rt.layer}</span>
                      <span className={`${textSub} font-sans truncate`}>{rt.dest}</span>
                    </div>
                  ))}
                </div>

                {scripturePreview.linkedRecords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 font-sans">
                    {scripturePreview.linkedRecords.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setActiveScreen && setActiveScreen(rec.screen)}
                        className={`px-2 py-0.5 rounded-md border ${borderClass} ${subBg} text-[10.5px] font-bold flex items-center gap-1 cursor-pointer hover:border-[#2563EB]`}
                      >
                        <span className="text-[#2563EB]">[{rec.badge}]</span>
                        <span className="truncate max-w-[140px]">{rec.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 우측: 4대 역본 실시간 지식 대조 패널 */}
              <div className={`xl:col-span-6 p-2.5 rounded-xl border ${borderClass} ${subBg} font-sans space-y-2`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[10.5px] font-bold">
                    {[
                      { id: 'krv4', label: '개역개정4판' },
                      { id: 'easy', label: '쉬운성경' },
                      { id: 'web', label: 'WEB영어' },
                      { id: 'orig', label: '원어' }
                    ].map((ver) => (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => setPreviewVersion(ver.id)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          previewVersion === ver.id ? 'bg-[#2563EB] text-white' : `${surfaceBg} ${textSub}`
                        }`}
                      >
                        {ver.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToInterlinear(scripturePreview.bookKo, scripturePreview.chap, 1)}
                    className="text-[10.5px] font-bold text-[#0D9488] hover:underline cursor-pointer"
                  >
                    원어 스튜디오 ➔
                  </button>
                </div>

                {previewVersion === 'orig' ? (
                  <div className="text-[12px] space-y-1">
                    <div className="font-bold">
                      {selectedLexicon.word} <span className="text-[#D97706]">[{selectedLexicon.pron}]</span> · {selectedLexicon.strongs}
                    </div>
                    <p className={textSub}>{selectedLexicon.mean} ({selectedLexicon.grammar})</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {scripturePreview.verses.slice(0, 2).map((v) => (
                      <p key={v.v} className="text-[12px] leading-snug line-clamp-2">
                        <b className="text-[#D97706] font-mono mr-1">{v.v}.</b>
                        {previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 우측 11단 세그먼트 큐 사이드바 */}
        <aside
          className={`w-full lg:w-[300px] xl:w-[325px] ${surfaceBg} border-t lg:border-t-0 lg:border-l ${borderClass} flex flex-col justify-between p-3.5 overflow-y-auto hide-scrollbar shrink-0 z-20 ${
            mobileViewTab === 'queue' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          <div>
            <div className={`flex items-baseline justify-between border-b ${borderClass} pb-2`}>
              <div>
                <div className={`text-[10px] font-bold ${textSub} tracking-widest`}>CANON QUEUE</div>
                <div className={`text-[9.5px] ${textSub}`}>9-stage sanctification pass</div>
              </div>
              <span className="text-lg font-black">11</span>
            </div>

            <div className="space-y-2 mt-2">
              {ELEVEN_CANON_QUEUE.map((qItem, qIdx) => {
                const secStat = telemetry.sectorProgress[qItem.sector] || { total: 50, read: 10 };
                const baseFilled = Math.max(3, Math.min(9, Math.round((secStat.read / Math.max(1, secStat.total)) * 9) + ((qIdx % 4) + 3)));
                const isSelected = activeLayerId === qItem.layer && selectedBookChap.bookKo === qItem.bookRef;

                return (
                  <div
                    key={qItem.id}
                    onClick={() => {
                      setActiveLayerId(qItem.layer);
                      setSelectedBookChap({ bookKo: qItem.bookRef, chap: qItem.chapRef, verse: 1 });
                      const matchedLex = LEXICON_STREAM_CODES.find((l) => l.strongs === qItem.strongs);
                      if (matchedLex) setSelectedLexicon(matchedLex);
                      if (mobileViewTab === 'queue') setMobileViewTab('canvas');
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                      isSelected ? 'border-[#0D9488] bg-[#0D9488]/10' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10.5px] mb-1">
                      <span className="font-bold truncate">
                        <b className={`${textSub} mr-1.5`}>{qItem.num}</b>
                        {qItem.label}
                      </span>
                      <span style={{ backgroundColor: qItem.color }} className="w-2 h-2 rounded-xs shrink-0" />
                    </div>

                    <div className="grid grid-cols-9 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                        <div
                          key={step}
                          style={{
                            backgroundColor: step <= baseFilled ? qItem.color : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
                            opacity: step <= baseFilled ? 0.92 : 0.4
                          }}
                          className="h-2 rounded-[1px]"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t ${borderClass} space-y-2`}>
            <div className="text-[11px] font-black text-[#0D9488] tracking-wider">PARSE REPLY &amp; LOGOS</div>
            {[
              { id: 'PROMPT', label: 'PROMPT (원어·정경)', count: 1, pct: '88%', color: '#D97706' },
              { id: 'CONTEXT', label: 'CONTEXT (주석·교차)', count: 4, pct: '74%', color: '#F59E0B' },
              { id: 'LOOP', label: 'LOOP (QT·설교)', count: telemetry.qtCount + telemetry.sermonCount || 3, pct: '65%', color: '#0D9488' },
              { id: 'HARNESS', label: 'HARNESS (적용·기도)', count: telemetry.applyCount || 3, pct: '58%', color: '#2563EB' }
            ].map((bar) => (
              <div key={bar.id} onClick={() => setActiveLayerId(bar.id)} className="space-y-1 cursor-pointer">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">{bar.label}</span>
                  <span className={textSub}>{bar.count}</span>
                </div>
                <div className={`w-full h-1.5 ${subBg} rounded-full overflow-hidden`}>
                  <div style={{ width: bar.pct, backgroundColor: bar.color }} className="h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 4. 모바일 하단 3단 뷰 전환 바 (iOS 안전 영역 적용) */}
      <div className={`lg:hidden shrink-0 ${surfaceBg} border-t ${borderClass} px-3 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] flex items-center justify-around gap-1.5 z-30 font-sans`}>
        {[
          { id: 'canvas', label: '아크맵', icon: Layers },
          { id: 'queue', label: '11큐', icon: FileText },
          { id: 'terminal', label: '4대역본·CLI', icon: Terminal }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const active = mobileViewTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileViewTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                active ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub}`
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
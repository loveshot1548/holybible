// src/pages/BibleSecondBrain3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🧬 [1. LAYER TRIAGE 4대 코어 궤도 라우터 마스터 데이터]
// =====================================================================
const TRIAGE_ORBIT_LAYERS = [
  {
    id: 'PROMPT',
    alias: 'WORD',
    code: '1 symptom · layer 1/4',
    title: 'PROMPT // 원어·정경 로고스',
    korSub: '성경 66권 개역개정4판 & 원어 형태소',
    color: '#FACC15',
    subColor: '#FEF08A',
    orbitRadiusRatio: 0.145,
    baseAngle: -Math.PI * 0.68,
    calloutDir: { dx: -78, dy: -46 },
    bridgeCode: 's01 → routing',
    bridgeDesc: 'BHS Hebrew · NA28 Greek',
    bookRef: '창세기',
    chapRef: 1,
    strongsRef: 'H7225',
    desc: '성경 66권(1,189장) 정경 본문과 히브리어·헬라어 원어 스트롱 코드를 직결하는 제1 원천 프롬프트 레이어입니다.'
  },
  {
    id: 'CONTEXT',
    alias: 'CONTEXT',
    code: '4 symptoms · layer 2/4',
    title: 'CONTEXT // 구속사·34만 교차참조',
    korSub: 'TSK 교차참조 · 70인역 · 주석 문맥망',
    color: '#F59E0B',
    subColor: '#FDE68A',
    orbitRadiusRatio: 0.215,
    baseAngle: Math.PI * 0.78,
    calloutDir: { dx: -92, dy: 34 },
    bridgeCode: 's08 → routing',
    bridgeDesc: '344K cross-refs verified',
    bookRef: '이사야',
    chapRef: 53,
    strongsRef: 'H5375',
    desc: '신구약 344,799개 교차참조(TSK)와 언약 신학의 문맥을 실시간 대조하여 성경이 성경을 해석하게 하는 제2 컨텍스트 레이어입니다.'
  },
  {
    id: 'LOOP',
    alias: 'MEDITATION',
    code: '3 symptoms · layer 3/4',
    title: 'LOOP // QT·설교 묵상 순환',
    korSub: '매일 QT 묵상 & 예배 설교노트 동기화',
    color: '#2DD4BF',
    subColor: '#99F6E4',
    orbitRadiusRatio: 0.175,
    baseAngle: Math.PI * 0.22,
    calloutDir: { dx: 24, dy: 32 },
    bridgeCode: 'f07 → LOOP',
    bridgeDesc: 'verify meditation step',
    bookRef: '요한복음',
    chapRef: 1,
    strongsRef: 'G3056',
    desc: '선포된 설교 말씀과 매일의 QT 묵상이 원어 본문과 끊임없이 순환(Loop)하며 영적 통찰로 응집되는 제3 세컨드브레인 코어입니다.'
  },
  {
    id: 'HARNESS',
    alias: 'PRAXIS',
    code: '3 symptoms · layer 4/4',
    title: 'HARNESS // 기도·삶의 적용 결속',
    korSub: '적용질문 · 감사나눔 · 중보기도 실천',
    color: '#FB923C',
    subColor: '#FED7AA',
    orbitRadiusRatio: 0.245,
    baseAngle: -Math.PI * 0.24,
    calloutDir: { dx: -45, dy: -54 },
    bridgeCode: 'f13 → HARNESS',
    bridgeDesc: 'praxis & prayer locked',
    bookRef: '로마서',
    chapRef: 8,
    strongsRef: 'G26',
    desc: '묵상과 설교에서 깨달은 진리를 삶의 적용 트래커와 중보기도 제목으로 결속(Harness)하여 열매 맺게 하는 제4 실천 레이어입니다.'
  }
];

// =====================================================================
// 📜 [2. 우측 아크에 각인될 18대 핵심 원어(히브리어/헬라어) 마스터 사전]
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
// 📊 [3. 우측 패널 `SYMPTOM / CANON QUEUE (11)` 9단 세그먼트 데이터]
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
// ⚡ 전류(Electric Surge) & 혜성 광자 꼬리(Photon Comet) 드로잉 헬퍼
// =====================================================================
function drawElectricBeam(ctx, x1, y1, x2, y2, colorHex, glowColor, tick, isHighlighted = false) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 2) return;

  ctx.save();
  // 1) 외곽 네온 코로나 글로우 라인
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = isHighlighted ? 6.5 : 3.2;
  ctx.stroke();

  // 2) 중심 코어 라인
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = isHighlighted ? '#FFFFFF' : colorHex;
  ctx.lineWidth = isHighlighted ? 2.2 : 1.3;
  ctx.stroke();

  // 3) 지직거리는 고밀도 플라즈마 전류(Electric Sine-Surge) 파형 (하이라이트 시)
  if (isHighlighted) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const steps = Math.max(12, Math.floor(dist / 8));

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const d = t * dist;
      const envelope = Math.sin(t * Math.PI); // 양 끝은 0, 중앙에서 파동 최대
      const wave =
        Math.sin(t * 28 - tick * 18) * 3.8 * envelope +
        Math.cos(t * 53 + tick * 24) * 2.1 * envelope;

      const px = x1 + cosA * d - sinA * wave;
      const py = y1 + sinA * d + cosA * wave;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 4) 라인을 따라 질주하는 듀얼 혜성 광자(Comet Trail) 패킷
  const speeds = isHighlighted ? [0.95, 1.35] : [0.65];
  speeds.forEach((spd, sIdx) => {
    const headT = ((tick * spd + sIdx * 0.48) % 1);
    const tailSegments = 16;
    for (let s = 0; s < tailSegments; s++) {
      const segT = headT - s * 0.014;
      if (segT < 0 || segT > 1) continue;
      const sx = x1 + (x2 - x1) * segT;
      const sy = y1 + (y2 - y1) * segT;
      const alpha = (1 - s / tailSegments) * (isHighlighted ? 0.95 : 0.7);
      const rad = (1 - s / tailSegments) * (isHighlighted ? 4.2 : 2.6);

      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.6, rad), 0, Math.PI * 2);
      ctx.fillStyle = s < 3 ? `rgba(255, 255, 255, ${alpha})` : colorHex;
      if (s === 0) {
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 14;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  ctx.restore();
}

// 캔버스 위 고가독성 뱃지 라벨 렌더러 (배경 다크 캡슐 + 보더 + 선명한 텍스트)
function drawCrispBadgeText(ctx, text, x, y, textColor = '#F8FAFC', borderColor = 'rgba(255,255,255,0.18)', align = 'left', isActive = false) {
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

  ctx.fillStyle = isActive ? 'rgba(10, 14, 24, 0.96)' : 'rgba(6, 8, 14, 0.86)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
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
    generalNotes = []
  } = store;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [activeLayerId, setActiveLayerId] = useState('LOOP');
  const [selectedLexicon, setSelectedLexicon] = useState(LEXICON_STREAM_CODES[9]); // 기본: G3056 로고스
  const [selectedBookChap, setSelectedBookChap] = useState({ bookKo: '요한복음', chap: 1, verse: 1 });
  const [hoveredTarget, setHoveredTarget] = useState(null);
  const [isAutoPulse, setIsAutoPulse] = useState(true);
  const [mobileViewTab, setMobileViewTab] = useState('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // 카메라 팬 / 줌 상태
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const hitRegionsRef = useRef([]);

  // =====================================================================
  // 📊 앱 내 실제 성경 통독 · QT · 설교 · 노트 텔레메트리 파싱 엔진
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
      if (!sectorProgress[b.sector]) {
        sectorProgress[b.sector] = { total: 0, read: 0 };
      }
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
            dest: `${ref} · ${(d.qtTitle || d.qtMeditation || '').replace(/<[^>]*>?/gm, '').slice(0, 32)}`,
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
            dest: `${ref} · ${(d.sermonTitle || '예배 설교 강해').slice(0, 32)}`,
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
      {
        id: 'def_1',
        cmd: 'ROUTE',
        src: 'H7225 בְּרֵאשִׁית',
        layer: 'PROMPT',
        dest: '창세기 1:1 · BHS 히브리어 원어 형태소 파싱 완료',
        color: '#FACC15',
        bookRef: '창세기 1:1',
        screen: 'interlinear'
      },
      {
        id: 'def_2',
        cmd: 'ROUTE',
        src: 'G3056 λόγος',
        layer: 'LOOP',
        dest: '요한복음 1:14 · 말씀이 육신이 되어 (성육신 로고스 결합)',
        color: '#2DD4BF',
        bookRef: '요한복음 1:14',
        screen: 'interlinear'
      },
      {
        id: 'def_3',
        cmd: 'ROUTE',
        src: 'TSK 344K Cross-Ref',
        layer: 'CONTEXT',
        dest: '이사야 53:5 ↔ 베드로전서 2:24 · 대속 언약 시냅스 검증',
        color: '#F59E0B',
        bookRef: '이사야 53:5',
        screen: 'bible'
      },
      {
        id: 'def_4',
        cmd: 'ROUTE',
        src: 'G26 ἀγάπη',
        layer: 'HARNESS',
        dest: '로마서 8:28 · 삶의 적용 트래커 & 중보기도 하네스 동기화',
        color: '#FB923C',
        bookRef: '로마서 8:28',
        screen: 'qt'
      }
    ];

    const mergedRoutes = [...cliRoutes, ...defaultRoutes].slice(0, 6);
    const totalReadChaps = readChapSet.size;
    const totalNotes = qtCount + sermonCount + (bibleNotes?.length || 0) + (generalNotes?.length || 0);

    return {
      totalReadChaps,
      qtCount,
      sermonCount,
      applyCount,
      totalNotes,
      bookReadCounts,
      sectorProgress,
      cliRoutes: mergedRoutes
    };
  }, [dailyData, readVerses, bibleNotes, generalNotes]);

  const activeLayerObj = useMemo(() => {
    return TRIAGE_ORBIT_LAYERS.find((l) => l.id === activeLayerId) || TRIAGE_ORBIT_LAYERS[2];
  }, [activeLayerId]);

  // 현재 선택된 성경 본문 4절 미리보기 추출
  const scripturePreview = useMemo(() => {
    const bMeta = BIBLE_66_CANON.find((b) => b.ko === selectedBookChap.bookKo) || BIBLE_66_CANON[42];
    const rawBook = (Array.isArray(bibleData) ? bibleData : []).find(
      (b) => b.name === bMeta.en || b.name === bMeta.ko
    );
    const chapVerses = rawBook?.chapters?.[Math.max(0, (selectedBookChap.chap || 1) - 1)] || [];
    const bookIndex = BIBLE_66_CANON.findIndex((b) => b.ko === bMeta.ko) + 1;
    return {
      bookKo: bMeta.ko,
      bookEn: bMeta.en,
      bookCode: `s${String(bookIndex).padStart(2, '0')}`,
      chap: selectedBookChap.chap || 1,
      totalChaps: bMeta.chaps,
      sector: bMeta.sector,
      verses: chapVerses.slice(0, 4).map((t, i) => ({
        v: i + 1,
        text: String(t).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
      }))
    };
  }, [selectedBookChap]);

  // =====================================================================
  // 🔍 통합 검색 엔진 (성경 권명 · 구절 주소 · 히브리어/헬라어 원어 · 내 묵상 키워드 통합 검색!)
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

      // 1) 구절 주소 직접 파싱 (예: "창 1:1", "로마서 8", "요 3:16")
      const parsedRefs = extractAllBibleRefsFromText(q);
      if (parsedRefs.length > 0) {
        parsedRefs.forEach((r) => {
          hits.push({
            id: `ref_${r.bookKo}_${r.chapter}`,
            badge: '성경구절',
            color: '#2DD4BF',
            title: `${r.bookKo} ${r.chapter}장 ${r.verse ? `${r.verse}절` : ''}`,
            sub: '클릭 시 해당 성경 아크 및 본문으로 즉시 타겟팅',
            action: () => {
              setSelectedBookChap({ bookKo: r.bookKo, chap: r.chapter || 1, verse: r.verse || 1 });
              setActiveLayerId('PROMPT');
            }
          });
        });
      }

      // 2) 원어 스트롱 코드 및 히브리어/헬라어 검색 (예: "로고스", "H7225", "아가페", "헤세드")
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
            color: '#FACC15',
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

      // 3) 성경 66권 이름 검색
      BIBLE_66_CANON.forEach((b, idx) => {
        if (b.ko.includes(q) || b.en.toLowerCase().includes(q.toLowerCase())) {
          hits.push({
            id: `bk_${b.ko}`,
            badge: `s${String(idx + 1).padStart(2, '0')} ${b.sector}`,
            color: '#F59E0B',
            title: `${b.ko} (${b.en}) 전체 ${b.chaps}장`,
            sub: `현재 통독: ${telemetry.bookReadCounts[b.ko]?.read || 0}/${b.chaps}장`,
            action: () => {
              setSelectedBookChap({ bookKo: b.ko, chap: 1, verse: 1 });
              setActiveLayerId('CONTEXT');
            }
          });
        }
      });

      // 4) 성경 본문 키워드 검색 (최대 5건 빠른 매칭)
      if (q.length >= 2 && hits.length < 8) {
        const booksArr = Array.isArray(bibleData) ? bibleData : [];
        outerLoop: for (let bIdx = 0; bIdx < booksArr.length; bIdx++) {
          const bObj = booksArr[bIdx];
          const canon = BIBLE_66_CANON.find((c) => c.en === bObj.name || c.ko === bObj.name);
          const koName = canon ? canon.ko : bObj.name;
          const chaps = bObj.chapters || [];
          for (let cIdx = 0; cIdx < chaps.length; cIdx++) {
            const verses = chaps[cIdx] || [];
            for (let vIdx = 0; vIdx < verses.length; vIdx++) {
              const vTxt = String(verses[vIdx] || '');
              if (vTxt.includes(q)) {
                hits.push({
                  id: `kw_${koName}_${cIdx + 1}_${vIdx + 1}`,
                  badge: '말씀본문',
                  color: '#38BDF8',
                  title: `${koName} ${cIdx + 1}:${vIdx + 1}`,
                  sub: vTxt.slice(0, 42) + '...',
                  action: () => {
                    setSelectedBookChap({ bookKo: koName, chap: cIdx + 1, verse: vIdx + 1 });
                    setActiveLayerId('LOOP');
                  }
                });
                if (hits.length >= 10) break outerLoop;
              }
            }
          }
        }
      }

      setSearchResults(hits.slice(0, 10));
      setShowSearchDropdown(true);
    },
    [telemetry.bookReadCounts]
  );

  // 우측 아크 바깥쪽 신경망 성단(Constellation) 파티클 시드 생성 (95개 고밀도 시냅스)
  const rightConstellationParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 95; i++) {
      const normY = (i / 94) * 2 - 1; // -1 ~ +1
      const spreadX = ((i * 29) % 100) / 100; // 0 ~ 1
      pts.push({
        normY,
        spreadX,
        size: 1.5 + (i % 4) * 0.85,
        phase: i * 0.7,
        isCyan: i % 3 !== 0,
        isHub: i % 9 === 0
      });
    }
    return pts;
  }, []);

  // =====================================================================
  // 🎨 메인 60FPS `LAYER TRIAGE` 초정밀 렌더링 엔진
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

      // 1. 딥 다크 옵시디언 배경 & 코어 앰비언트 백라이트
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#040508';
      ctx.fillRect(0, 0, width, height);

      const cam = cameraRef.current;
      ctx.save();
      ctx.translate(width / 2 + cam.x, height / 2 + cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      const minDim = Math.min(width, height);
      const orbitCenter = { x: 0, y: 0 };

      // 2. 미세 테크니컬 다크 그리드 & 십자 레티클(Reticle) 눈금
      const gridSpan = Math.max(width, height) * 1.2;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
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

      // 배경 다중 볼류메트릭 오라
      const bgGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, minDim * 0.48);
      bgGlow.addColorStop(0, 'rgba(45, 212, 191, 0.16)');
      bgGlow.addColorStop(0.38, 'rgba(88, 28, 135, 0.18)');
      bgGlow.addColorStop(0.75, 'rgba(245, 158, 11, 0.06)');
      bgGlow.addColorStop(1, 'rgba(4, 5, 8, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // 🌟 [핵심 기하학 교정] 좌·우 아크가 화면 밖으로 잘리지 않고 `IMG_4049.jpg`처럼 완벽한 `) (` 대칭을 이루도록 설계!
      const arcR = Math.max(320, minDim * 0.88);
      const maxArcAngle = 0.56; // 위아래 끝 각도
      // 좌측 아크 `)`: 중심이 왼쪽 바깥에 위치하여 오른쪽 가장자리가 x = -minDim * 0.24를 지남
      const leftArcSpineX = -Math.min(width * 0.22, 235);
      const leftArcCx = leftArcSpineX - arcR;
      // 우측 아크 `(`: 중심이 오른쪽 바깥에 위치하여 왼쪽 가장자리가 x = +minDim * 0.22를 지남 (우측 여백 충분 확보!)
      const rightArcSpineX = Math.min(width * 0.20, 215);
      const rightArcCx = rightArcSpineX + arcR;

      const nextHitRegions = [];

      // =====================================================================
      // 3. 좌측 브래킷 아크 `)` — 180채널 고밀도 스펙트럼 & 성경 66권 라벨
      // =====================================================================
      ctx.save();
      // 3-A. 180개의 촘촘한 방사형 오디오 스펙트럼 니들 바 (IMG_4049 좌측 아크의 빽빽한 눈금 완벽 재현!)
      const totalLeftNeedles = 180;
      for (let i = 0; i < totalLeftNeedles; i++) {
        const norm = i / (totalLeftNeedles - 1) - 0.5;
        const ang = norm * (maxArcAngle * 2);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const bIdx = Math.min(65, Math.floor((i / totalLeftNeedles) * 66));
        const book = BIBLE_66_CANON[bIdx];
        const readRatio = telemetry.bookReadCounts[book.ko]?.ratio || 0;
        const isCurrentBook = selectedBookChap.bookKo === book.ko;

        // 파동 + 통독률 결합 길이
        const wave =
          Math.sin(tick * 3.8 + i * 0.22) * 10 +
          Math.cos(tick * 2.1 - i * 0.15) * 7;
        const barLen = Math.max(12, 26 + readRatio * 38 + ((i * 19) % 30) + wave + (isCurrentBook ? 22 : 0));

        const x1 = leftArcCx + cosA * arcR;
        const y1 = sinA * arcR;
        const x2 = leftArcCx + cosA * (arcR - barLen);
        const y2 = sinA * (arcR - barLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        if (isCurrentBook) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.2;
        } else if (i % 7 === 0 || readRatio > 0) {
          ctx.strokeStyle = bIdx < 39 ? 'rgba(245, 158, 11, 0.82)' : 'rgba(45, 212, 191, 0.82)';
          ctx.lineWidth = 1.35;
        } else {
          ctx.strokeStyle = 'rgba(180, 120, 40, 0.35)';
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();
      }

      // 3-B. 좌측 아크 2중 네온 스파인(Spine) 궤도선 & 아크를 타고 흐르는 광자 펄스
      [arcR, arcR + 9].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(leftArcCx, 0, r, -maxArcAngle, maxArcAngle);
        ctx.strokeStyle = idx === 0 ? '#F59E0B' : 'rgba(45, 212, 191, 0.55)';
        ctx.lineWidth = idx === 0 ? 2.2 : 1.2;
        if (idx === 0) {
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 좌측 아크 스파인을 따라 위아래로 흐르는 전류 광자 2개
      [0, 0.5].forEach((offset) => {
        const pNorm = ((tick * 0.28 + offset) % 1) - 0.5;
        const pAng = pNorm * (maxArcAngle * 2);
        const px = leftArcCx + Math.cos(pAng) * arcR;
        const py = Math.sin(pAng) * arcR;
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3-C. 좌측 아크 주요 성경 권명 배지 (가독성 200% 캡슐 배지 적용, 총 17개 대표 권 + 현재 선택된 권)
      BIBLE_66_CANON.forEach((book, bIdx) => {
        const isCurrentBook = selectedBookChap.bookKo === book.ko;
        if (bIdx % 4 !== 0 && !isCurrentBook) return;

        const norm = bIdx / 65 - 0.5;
        const ang = norm * (maxArcAngle * 1.92);
        const labelR = arcR - 74;
        const lx = leftArcCx + Math.cos(ang) * labelR;
        const ly = Math.sin(ang) * labelR;

        const codeStr = `s${String(bIdx + 1).padStart(2, '0')} ${book.ko}`;
        drawCrispBadgeText(
          ctx,
          codeStr,
          lx,
          ly,
          isCurrentBook ? '#FACC15' : bIdx < 39 ? '#FDE68A' : '#99F6E4',
          isCurrentBook ? '#FACC15' : 'rgba(255,255,255,0.12)',
          'right',
          isCurrentBook
        );

        nextHitRegions.push({
          id: `book_${book.ko}`,
          type: 'book',
          x: lx - 38,
          y: ly,
          r: 20,
          bookKo: book.ko,
          chap: 1,
          label: codeStr
        });
      });
      ctx.restore();

      // =====================================================================
      // 4. 우측 브래킷 아크 `(` — 18대 원어(Strongs) 스트림 & 외곽 시냅스 성단!
      // =====================================================================
      ctx.save();
      // 4-A. 우측 아크 바깥쪽 신경망 별자리 성단(Neural Constellation — IMG_4049 우측 별자리 완벽 재현!)
      const constellationNodes = rightConstellationParticles.map((pt) => {
        const ang = Math.PI + pt.normY * (maxArcAngle * 0.95);
        const baseX = rightArcCx + Math.cos(ang) * (arcR - 14);
        const baseY = Math.sin(ang) * (arcR - 14);
        // 아크 오른쪽(바깥쪽) 공간으로 45px ~ 220px 분포
        const cx = baseX + 48 + pt.spreadX * Math.min(190, width * 0.22) + Math.sin(tick * 0.8 + pt.phase) * 4;
        const cy = baseY + Math.cos(tick * 0.7 + pt.phase) * 4;
        return { ...pt, x: cx, y: cy };
      });

      // 별자리 시냅스 그물망 연결선
      ctx.lineWidth = 0.85;
      for (let i = 0; i < constellationNodes.length; i++) {
        for (let j = i + 1; j < constellationNodes.length; j++) {
          const d = Math.hypot(
            constellationNodes[i].x - constellationNodes[j].x,
            constellationNodes[i].y - constellationNodes[j].y
          );
          if (d < 46) {
            const alpha = (1 - d / 46) * 0.38;
            ctx.strokeStyle = constellationNodes[i].isCyan
              ? `rgba(45, 212, 191, ${alpha})`
              : `rgba(245, 158, 11, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(constellationNodes[i].x, constellationNodes[i].y);
            ctx.lineTo(constellationNodes[j].x, constellationNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // 별자리 성단 노드 점등
      constellationNodes.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isHub ? p.size * 1.45 : p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isHub ? '#FFFFFF' : p.isCyan ? '#2DD4BF' : '#F59E0B';
        if (p.isHub) {
          ctx.shadowColor = p.isCyan ? '#2DD4BF' : '#F59E0B';
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4-B. 우측 아크 160채널 미세 스펙트럼 눈금 바
      const totalRightNeedles = 160;
      for (let i = 0; i < totalRightNeedles; i++) {
        const norm = i / (totalRightNeedles - 1) - 0.5;
        const ang = Math.PI + norm * (maxArcAngle * 2);
        const wave = Math.cos(tick * 3.5 + i * 0.25) * 7;
        const barLen = Math.max(8, 16 + ((i * 13) % 24) + wave);

        const x1 = rightArcCx + Math.cos(ang) * arcR;
        const y1 = Math.sin(ang) * arcR;
        const x2 = rightArcCx + Math.cos(ang) * (arcR + barLen);
        const y2 = Math.sin(ang) * (arcR + barLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(45, 212, 191, 0.65)' : 'rgba(245, 158, 11, 0.38)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // 4-C. 우측 아크 2중 네온 스파인 궤도선
      [arcR, arcR - 10].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(rightArcCx, 0, r, Math.PI - maxArcAngle, Math.PI + maxArcAngle);
        ctx.strokeStyle = idx === 0 ? '#2DD4BF' : 'rgba(250, 204, 21, 0.48)';
        ctx.lineWidth = idx === 0 ? 2.2 : 1.2;
        if (idx === 0) {
          ctx.shadowColor = '#2DD4BF';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 4-D. 우측 아크 18대 히브리어/헬라어 스트롱 원어 노드 & 무결점 가독성 배지!
      let activeLexiconAnchor = null;
      LEXICON_STREAM_CODES.forEach((lex, lIdx) => {
        const norm = lIdx / (LEXICON_STREAM_CODES.length - 1) - 0.5;
        const ang = Math.PI - norm * (maxArcAngle * 1.88);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const dotR = arcR - 10;
        const dx = rightArcCx + cosA * dotR;
        const dy = sinA * dotR;

        const isSelLex = selectedLexicon?.code === lex.code;
        const isLayerMatch = lex.layer === activeLayerId;

        if (isSelLex) {
          activeLexiconAnchor = { x: dx, y: dy, lex };
        }

        // 아크 위 원형 타겟 마커
        ctx.beginPath();
        ctx.arc(dx, dy, isSelLex ? 6.5 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = isSelLex ? '#FFFFFF' : isLayerMatch ? '#FACC15' : '#090D16';
        ctx.shadowColor = isSelLex ? '#2DD4BF' : 'transparent';
        ctx.shadowBlur = isSelLex ? 14 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = isSelLex ? 2.2 : 1.4;
        ctx.strokeStyle = isSelLex ? '#2DD4BF' : isLayerMatch ? '#FACC15' : 'rgba(45, 212, 191, 0.65)';
        ctx.stroke();

        // 잘리지 않는 수평/미세경사 캡슐 배지 (`f10 G3056 λόγος 로고스`)
        const labelX = dx + 14;
        const labelY = dy;
        const labelText = isSelLex
          ? `${lex.code} ${lex.word} (${lex.pron})`
          : `${lex.code} ${lex.word}`;

        drawCrispBadgeText(
          ctx,
          labelText,
          labelX,
          labelY,
          isSelLex ? '#5EEAD4' : isLayerMatch ? '#FEF08A' : '#E2E8F0',
          isSelLex ? '#2DD4BF' : isLayerMatch ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.12)',
          'left',
          isSelLex
        );

        nextHitRegions.push({
          id: `lex_${lex.code}`,
          type: 'lexicon',
          x: labelX + 48,
          y: labelY,
          r: 22,
          lexicon: lex,
          label: labelText
        });
      });
      ctx.restore();

      // =====================================================================
      // 5. 중앙 `TRIAGE` 궤도 라우터 & 전류(Electric Surge) 광선 & 브릿지 콜아웃!
      // =====================================================================
      // 5-A. 동심 점선 궤도 링 3개 + 회전 눈금 링
      [0.145, 0.195, 0.245].forEach((ratio, rIdx) => {
        const r = minDim * ratio;
        ctx.beginPath();
        ctx.arc(orbitCenter.x, orbitCenter.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = rIdx === 1 ? 'rgba(148, 163, 184, 0.32)' : 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 5-B. 중앙 코어 ➔ 우측 선택된 원어(Strongs) 아크 지점 전류 레이저 빔 발사!
      if (activeLexiconAnchor) {
        drawElectricBeam(
          ctx,
          orbitCenter.x,
          orbitCenter.y,
          activeLexiconAnchor.x,
          activeLexiconAnchor.y,
          '#2DD4BF',
          'rgba(45, 212, 191, 0.25)',
          tick,
          true
        );

        // 우측 아크 타겟 지점 충격파 링(Shockwave Ring) 애니메이션
        const pulseR = 6 + ((tick * 18) % 22);
        const pulseAlpha = Math.max(0, 1 - ((tick * 18) % 22) / 22);
        ctx.beginPath();
        ctx.arc(activeLexiconAnchor.x, activeLexiconAnchor.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45, 212, 191, ${pulseAlpha})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // 5-C. 4대 회전 궤도 레이어 노드 (`PROMPT`, `CONTEXT`, `LOOP`, `HARNESS`)
      TRIAGE_ORBIT_LAYERS.forEach((layer, idx) => {
        const currentAng = layer.baseAngle + (isAutoPulse ? Math.sin(tick * 0.42 + idx * 1.3) * 0.10 : 0);
        const r = minDim * layer.orbitRadiusRatio;
        const nx = orbitCenter.x + Math.cos(currentAng) * r;
        const ny = orbitCenter.y + Math.sin(currentAng) * r;
        const isAct = activeLayerId === layer.id;

        // 1) 중앙 코어 ➔ 레이어 노드 전류 광선
        drawElectricBeam(
          ctx,
          orbitCenter.x,
          orbitCenter.y,
          nx,
          ny,
          layer.color,
          isAct ? 'rgba(250, 204, 21, 0.28)' : 'rgba(148, 163, 184, 0.08)',
          tick,
          isAct
        );

        // 2) 활성 레이어에서 좌측 성경 아크로 뻗어나가는 수평 전류 타겟팅 빔 & 브릿지 콜아웃 박스 (`IMG_4049` 중앙 좌하단 `s08 → routing` 완벽 재현!)
        if (isAct) {
          const arcHitY = Math.max(-arcR * 0.48, Math.min(arcR * 0.48, ny));
          const arcHitX = leftArcCx + Math.sqrt(Math.max(0, arcR * arcR - arcHitY * arcHitY));

          drawElectricBeam(
            ctx,
            nx,
            ny,
            arcHitX,
            arcHitY,
            layer.color,
            'rgba(245, 158, 11, 0.26)',
            tick,
            true
          );

          // 좌측 아크 타겟 지점 충격파 링
          const pR = 5 + ((tick * 16) % 20);
          const pA = Math.max(0, 1 - ((tick * 16) % 20) / 20);
          ctx.beginPath();
          ctx.arc(arcHitX, arcHitY, pR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${pA})`;
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // 브릿지 콜아웃 박스 (`s08 → routing / 344K cross-refs`)
          const brBoxW = 138;
          const brBoxH = 38;
          const brBoxX = (nx + arcHitX) / 2 - brBoxW / 2;
          const brBoxY = ny + 26;

          ctx.beginPath();
          ctx.moveTo((nx + arcHitX) / 2, ny);
          ctx.lineTo((nx + arcHitX) / 2, brBoxY);
          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = 'rgba(7, 10, 18, 0.95)';
          ctx.beginPath();
          ctx.roundRect(brBoxX, brBoxY, brBoxW, brBoxH, 4);
          ctx.fill();
          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          ctx.font = '800 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = layer.color;
          ctx.textAlign = 'left';
          ctx.fillText(layer.bridgeCode, brBoxX + 8, brBoxY + 14);
          ctx.font = '600 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText(layer.bridgeDesc, brBoxX + 8, brBoxY + 28);
        }

        // 3) 다중 동심원 과녁(Bullseye Target) 노드 & 회전 에너지 링
        const outerR = isAct ? 24 : 17;
        if (isAct) {
          const haloR = outerR + 6 + Math.sin(tick * 5) * 3;
          ctx.beginPath();
          ctx.arc(nx, ny, haloR, 0, Math.PI * 2);
          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1.0;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8, 10, 18, 0.94)';
        ctx.fill();
        ctx.lineWidth = isAct ? 2.4 : 1.5;
        ctx.strokeStyle = layer.color;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, outerR * 0.58, 0, Math.PI * 2);
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, isAct ? 5.2 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = isAct ? '#FFFFFF' : layer.color;
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = isAct ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 4) 아크와 절대 겹치지 않는 안쪽 안전 좌표의 콜아웃 박스 (`PROMPT`, `CONTEXT`, `LOOP`, `HARNESS`)
        const boxW = 108;
        const boxH = 36;
        const boxX = nx + layer.calloutDir.dx;
        const boxY = ny + layer.calloutDir.dy;

        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(boxX + boxW / 2, boxY + boxH / 2);
        ctx.strokeStyle = isAct ? layer.color : 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = isAct ? 'rgba(12, 16, 28, 0.96)' : 'rgba(7, 9, 15, 0.92)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        ctx.fill();
        ctx.strokeStyle = isAct ? layer.color : 'rgba(148, 163, 184, 0.38)';
        ctx.lineWidth = isAct ? 1.6 : 1.0;
        ctx.stroke();

        ctx.font = '900 10px "JetBrains Mono", monospace';
        ctx.fillStyle = layer.color;
        ctx.textAlign = 'left';
        ctx.fillText(layer.id, boxX + 8, boxY + 14);

        ctx.font = '600 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(layer.code, boxX + 8, boxY + 27);

        nextHitRegions.push({
          id: `layer_${layer.id}`,
          type: 'layer',
          x: nx,
          y: ny,
          r: 30,
          layerId: layer.id,
          bookKo: layer.bookRef,
          chap: layer.chapRef,
          strongs: layer.strongsRef,
          label: layer.title
        });
      });

      // 5-D. 정중앙 고휘도 시안-화이트 플라즈마 코어 (`TRIAGE // layer router`)
      const corePulseR = 28 + Math.sin(tick * 4.2) * 2.5;
      const coreAura = ctx.createRadialGradient(orbitCenter.x, orbitCenter.y, 4, orbitCenter.x, orbitCenter.y, corePulseR * 1.9);
      coreAura.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreAura.addColorStop(0.35, 'rgba(45, 212, 191, 0.55)');
      coreAura.addColorStop(0.7, 'rgba(14, 165, 233, 0.18)');
      coreAura.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = coreAura;
      ctx.beginPath();
      ctx.arc(orbitCenter.x, orbitCenter.y, corePulseR * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(orbitCenter.x, orbitCenter.y, 24, 0, Math.PI * 2);
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(orbitCenter.x, orbitCenter.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#2DD4BF';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 코어 우측 `TRIAGE layer router` 콜아웃 박스
      const coreBoxX = orbitCenter.x + 32;
      const coreBoxY = orbitCenter.y - 19;
      ctx.fillStyle = 'rgba(8, 12, 22, 0.95)';
      ctx.beginPath();
      ctx.roundRect(coreBoxX, coreBoxY, 102, 38, 4);
      ctx.fill();
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.font = '900 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText('TRIAGE', coreBoxX + 9, coreBoxY + 15);
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#5EEAD4';
      ctx.fillText('layer router', coreBoxX + 9, coreBoxY + 28);

      hitRegionsRef.current = nextHitRegions;
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    activeLayerId,
    selectedLexicon,
    selectedBookChap,
    isAutoPulse,
    telemetry,
    rightConstellationParticles
  ]);

  // 캔버스 반응형 리사이즈
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
    cameraRef.current = {
      x: 0,
      y: 0,
      zoom: rect.width < 520 ? 0.76 : rect.width < 900 ? 0.88 : 1.0
    };
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
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const cam = cameraRef.current;
    const wx = (clientX - rect.left - (width / 2 + cam.x)) / cam.zoom;
    const wy = (clientY - rect.top - (height / 2 + cam.y)) / cam.zoom;

    for (const region of hitRegionsRef.current) {
      if (Math.hypot(wx - region.x, wy - region.y) <= (region.r || 24)) {
        return region;
      }
    }
    return null;
  };

  const handlePointerDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
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
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scaleDelta = dist / pinchDistRef.current;
      cameraRef.current.zoom = Math.max(0.45, Math.min(2.4, cameraRef.current.zoom * scaleDelta));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
      return;
    }

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    if (!isDraggingRef.current) {
      const hit = findHitTarget(cx, cy);
      setHoveredTarget(hit);
      return;
    }

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
    const chapId = `${bMeta.en}-${chap}`;
    if (typeof setCurrentChapId === 'function') setCurrentChapId(chapId);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(verse || 1);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  const handleJumpToInterlinear = (bookKo, chap = 1, verse = 1) => {
    try {
      localStorage.setItem(
        'interlinear_jump',
        JSON.stringify({ book: bookKo, chapter: Number(chap) || 1, verse: Number(verse) || 1 })
      );
    } catch (_) {}
    if (typeof setActiveScreen === 'function') setActiveScreen('interlinear');
  };

  return (
    <div className="flex-1 w-full h-full bg-[#040508] text-slate-100 flex flex-col overflow-hidden select-none font-mono relative">
      {/* ================================================================= */}
      {/* 1. 상단 `LAYER TRIAGE` 헤더 + 실시간 통합 검색창(Omnibox) */}
      {/* ================================================================= */}
      <header className="shrink-0 bg-[#070910] border-b border-white/15 z-30">
        <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
          {/* 좌측: 은하계 복귀 & 타이틀 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveScreen && setActiveScreen('galaxy')}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-slate-200 cursor-pointer flex items-center gap-1"
            >
              <span>◀</span> <span className="hidden sm:inline">GALAXY</span>
            </button>

            <div className="w-5 h-5 rounded border border-amber-500/60 bg-amber-500/15 flex items-center justify-center text-[10px] text-amber-400 font-black">
              ▣
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black tracking-widest text-amber-400 leading-none">
                LAYER TRIAGE
              </div>
              <div className="text-[9.5px] text-slate-400 tracking-tight mt-0.5">
                prompt · context · loop · harness
              </div>
            </div>
          </div>

          {/* 🔍 중앙: 성경·원어·구절·묵상 실시간 통합 검색창 (Omnibox) */}
          <div className="relative flex-1 max-w-xs sm:max-w-md mx-1">
            <div className="flex items-center bg-[#030407] border border-white/20 focus-within:border-teal-400 rounded-lg px-2.5 py-1">
              <span className="text-teal-400 text-xs mr-1.5">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleRunOmniboxSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="성경·원어(로고스/H7225)·구절(창 1:1) 검색..."
                className="w-full bg-transparent text-xs font-sans font-bold text-white placeholder:text-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 실시간 검색 결과 드롭다운 */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#090C15]/98 backdrop-blur-xl border border-teal-500/50 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-white/10 font-sans">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setShowSearchDropdown(false);
                    }}
                    className="p-2.5 hover:bg-white/10 cursor-pointer transition-colors flex flex-col gap-0.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{item.title}</span>
                      <span
                        style={{ color: item.color, borderColor: item.color }}
                        className="px-1.5 py-0.2 rounded border text-[9.5px] font-mono font-bold"
                      >
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">{item.sub}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 5대 메트릭 카운터 & ● ROUTING 스위치 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xl:flex items-center divide-x divide-white/10 border border-white/10 rounded bg-black/50">
              {[
                { label: 'SYMPTOMS', val: '11' },
                { label: 'LAYERS', val: '4' },
                { label: 'STAGES', val: '9' },
                { label: 'CAP', val: `${telemetry.totalReadChaps || 20}` },
                { label: 'STEP', val: '4/5' }
              ].map((m, idx) => (
                <div key={idx} className="px-2.5 py-1 flex flex-col items-start">
                  <span className="text-[8px] text-slate-500 tracking-widest">{m.label}</span>
                  <span className="text-xs font-black text-white leading-tight">{m.val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsAutoPulse((prev) => !prev)}
              className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest flex items-center gap-1.5 cursor-pointer transition-all ${
                isAutoPulse
                  ? 'border-teal-400/70 bg-teal-950/60 text-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.3)]'
                  : 'border-white/15 bg-white/5 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoPulse ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{isAutoPulse ? 'ROUTING' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* 2단: 서브 텔레메트리 스트립 (PROMPT / CONTEXT / LOOP / HARNESS + 장 네비게이터) */}
        <div className="px-3 sm:px-5 py-1.5 bg-[#05060A] flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar text-[10px]">
          <div className="flex items-center gap-4 shrink-0">
            {TRIAGE_ORBIT_LAYERS.map((l) => {
              const isAct = activeLayerId === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLayerId(l.id);
                    setSelectedBookChap({ bookKo: l.bookRef, chap: l.chapRef, verse: 1 });
                    const matchedLex = LEXICON_STREAM_CODES.find((lx) => lx.strongs === l.strongsRef);
                    if (matchedLex) setSelectedLexicon(matchedLex);
                  }}
                  className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isAct ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span style={{ color: l.color }} className="font-bold">
                    {l.id}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-white/5 text-[9.5px] text-slate-300">
                    {l.id === 'PROMPT'
                      ? '1'
                      : l.id === 'CONTEXT'
                      ? '4'
                      : l.id === 'LOOP'
                      ? '3'
                      : '3'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 우측 실시간 연동 수치 및 성경 장(Chapter) 빠른 이동기 */}
          <div className="flex items-center gap-3 text-slate-400 shrink-0">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <span className="text-amber-300 font-bold">{scripturePreview.bookKo}</span>
              <button
                onClick={() =>
                  setSelectedBookChap((prev) => ({
                    ...prev,
                    chap: Math.max(1, (prev.chap || 1) - 1)
                  }))
                }
                className="px-1 hover:text-white cursor-pointer"
              >
                ◀
              </button>
              <span className="text-white font-black">{scripturePreview.chap}장</span>
              <button
                onClick={() =>
                  setSelectedBookChap((prev) => ({
                    ...prev,
                    chap: Math.min(scripturePreview.totalChaps, (prev.chap || 1) + 1)
                  }))
                }
                className="px-1 hover:text-white cursor-pointer"
              >
                ▶
              </button>
            </div>
            <span className="hidden md:inline">
              MAX/WK <b className="text-white ml-1">100</b>
            </span>
            <span className="hidden sm:inline">
              GATE <b className="text-teal-400 ml-1">none</b>
            </span>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. 메인 바디: 좌측 아크 캔버스 & 하단 CLI + 우측 11단 세그먼트 큐 패널 */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 좌측 메인 영역 */}
        <div
          className={`flex-1 flex flex-col relative overflow-hidden ${
            mobileViewTab === 'queue' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* 2-A. 아크 스펙트럼 & 전류 라우터 캔버스 */}
          <div
            ref={containerRef}
            className="flex-1 relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
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
                const factor = e.deltaY < 0 ? 1.1 : 0.9;
                cameraRef.current.zoom = Math.max(0.45, Math.min(2.4, cameraRef.current.zoom * factor));
              }}
              className="absolute inset-0 w-full h-full touch-none"
            />

            {/* 🌟 좌측 상단 `LOOP / LAYER` 대형 포커스 HUD 박스 (`IMG_4049.jpg` 좌상단 카드 100% 재현) */}
            <div className="absolute top-3 left-3 z-20 w-[235px] sm:w-[275px] bg-[#070910]/94 backdrop-blur-md border border-white/25 p-3 shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
                <span>04 ROUTING</span>
                <span className="font-bold text-teal-300">{activeLayerObj.code}</span>
              </div>
              <div
                style={{ color: activeLayerObj.color }}
                className="text-xl sm:text-2xl font-black tracking-wider leading-tight"
              >
                {activeLayerObj.id}
              </div>
              <div className="text-[11px] font-sans font-bold text-slate-200 mt-1">
                {activeLayerObj.korSub}
              </div>

              {/* 현재 타겟팅된 히브리어/헬라어 원어 스트롱 상세 카드 */}
              {selectedLexicon && (
                <div className="mt-2 p-2 rounded bg-black/60 border border-white/10 space-y-0.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {selectedLexicon.code} · {selectedLexicon.grammar}
                    </span>
                    <span className="text-[10px] text-teal-300 font-bold">
                      {selectedLexicon.book} {selectedLexicon.chap}:{selectedLexicon.verse}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">
                    {selectedLexicon.word}{' '}
                    <span className="text-xs font-bold text-amber-200">[{selectedLexicon.pron}]</span>
                  </div>
                  <div className="text-[11px] text-slate-300">{selectedLexicon.mean}</div>
                </div>
              )}

              {/* 4대 앱 기능(성경본문 / 원어분석 / QT묵상 / 설교노트) 원터치 연동 버튼 */}
              <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-white/10 font-sans">
                <button
                  onClick={() => handleJumpToBible(scripturePreview.bookKo, scripturePreview.chap, selectedBookChap.verse)}
                  className="py-1.5 px-2 rounded bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/50 text-teal-200 text-[10.5px] font-black cursor-pointer transition-colors"
                >
                  📖 {scripturePreview.bookKo} {scripturePreview.chap}장 열기
                </button>
                <button
                  onClick={() => handleJumpToInterlinear(scripturePreview.bookKo, scripturePreview.chap, selectedBookChap.verse)}
                  className="py-1.5 px-2 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 text-[10.5px] font-black cursor-pointer transition-colors"
                >
                  🔬 원어 스튜디오
                </button>
                <button
                  onClick={() => setActiveScreen && setActiveScreen('qt')}
                  className="py-1 px-2 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 text-[10px] font-bold cursor-pointer"
                >
                  ✍️ 오늘의 QT
                </button>
                <button
                  onClick={() => setActiveScreen && setActiveScreen('sermon')}
                  className="py-1 px-2 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 text-[10px] font-bold cursor-pointer"
                >
                  📝 예배 설교노트
                </button>
              </div>
            </div>

            {/* 우측 하단 줌/리셋 미니 컨트롤 */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-[#080A12]/90 border border-white/15 px-2 py-1 rounded text-[10px]">
              <button
                onClick={() => {
                  cameraRef.current.zoom = Math.min(2.4, cameraRef.current.zoom + 0.15);
                }}
                className="px-2 py-0.5 hover:bg-white/10 text-white font-bold cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => {
                  cameraRef.current.zoom = Math.max(0.45, cameraRef.current.zoom - 0.15);
                }}
                className="px-2 py-0.5 hover:bg-white/10 text-white font-bold cursor-pointer"
              >
                -
              </button>
              <button
                onClick={handleResize}
                className="px-2 py-0.5 hover:bg-white/10 text-teal-300 font-bold cursor-pointer"
              >
                RESET
              </button>
            </div>
          </div>

          {/* 2-B. 하단 `$ route --symptoms 11 --layers 4 --pass 9` 실시간 CLI 라우팅 터미널 */}
          <div
            className={`shrink-0 bg-[#06070C] border-t border-white/15 px-3.5 py-2.5 z-20 ${
              mobileViewTab === 'canvas' ? 'hidden sm:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 text-[10.5px]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-amber-300 font-bold truncate ml-1">
                  $ route --symptoms 11 --layers 4 --pass 9 --target {scripturePreview.bookCode}_{scripturePreview.bookKo}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-teal-400">state: routing</span>
                <span className="text-[10px] text-amber-400 tracking-tighter animate-pulse">▂▄▆█▄▂▅▇▃</span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">
              {/* 좌측: 4줄 CLI 라우팅 로그 (클릭 시 해당 구절/노트로 즉시 연동) */}
              <div className="xl:col-span-7 space-y-1 text-[10.5px]">
                {telemetry.cliRoutes.slice(0, 4).map((rt) => (
                  <div
                    key={rt.id}
                    onClick={() => {
                      const refs = extractAllBibleRefsFromText(rt.bookRef);
                      if (refs.length > 0) {
                        setSelectedBookChap({
                          bookKo: refs[0].bookKo,
                          chap: refs[0].chapter || 1,
                          verse: refs[0].verse || 1
                        });
                      }
                      setActiveLayerId(rt.layer);
                    }}
                    className="flex items-center gap-1.5 truncate hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <span className="text-slate-500 font-bold">{rt.cmd}</span>
                    <span className="text-slate-600">›</span>
                    <span className="text-slate-200 font-bold">{rt.src}</span>
                    <span className="text-amber-400">→</span>
                    <span style={{ color: rt.color }} className="font-black">
                      {rt.layer}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-sans truncate">{rt.dest}</span>
                  </div>
                ))}
              </div>

              {/* 우측: 현재 포커스된 성경 본문 미리보기 & 원어 바로가기 */}
              <div className="xl:col-span-5 p-2 rounded bg-white/[0.04] border border-white/15 font-sans text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300">
                    📌 [{scripturePreview.bookCode}] {scripturePreview.bookKo} {scripturePreview.chap}장 (개역개정 4판)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleJumpToInterlinear(scripturePreview.bookKo, scripturePreview.chap, 1)}
                      className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      원어강해 ➔
                    </button>
                    <button
                      onClick={() => handleJumpToBible(scripturePreview.bookKo, scripturePreview.chap, 1)}
                      className="text-[10px] font-bold text-teal-400 hover:underline cursor-pointer"
                    >
                      본문열기 ➔
                    </button>
                  </div>
                </div>
                {scripturePreview.verses.slice(0, 2).map((v) => (
                  <p key={v.v} className="text-slate-200 text-[11px] leading-snug line-clamp-1">
                    <b className="text-amber-400 font-mono mr-1">{v.v}.</b>
                    {v.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. 우측 `SYMPTOM / CANON QUEUE (11)` 9단 세그먼트 사이드바 */}
        {/* ================================================================= */}
        <aside
          className={`w-full lg:w-[310px] xl:w-[335px] bg-[#07080E] border-t lg:border-t-0 lg:border-l border-white/15 flex flex-col justify-between p-3.5 overflow-y-auto hide-scrollbar shrink-0 z-20 ${
            mobileViewTab === 'queue' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          <div>
            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest">
                  SYMPTOM & CANON QUEUE
                </div>
                <div className="text-[9px] text-slate-500">9-stage sanctification pass</div>
              </div>
              <span className="text-xl font-black text-white">11</span>
            </div>

            <div className="flex items-center justify-between px-1 py-1.5 text-[9.5px] text-slate-500 font-bold tracking-widest">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>

            {/* 11개 큐 항목 + 9단 세그먼트 블록 바 */}
            <div className="space-y-2.5 mt-1">
              {ELEVEN_CANON_QUEUE.map((qItem, qIdx) => {
                const secStat = telemetry.sectorProgress[qItem.sector] || { total: 50, read: 10 };
                const baseFilled = Math.max(
                  3,
                  Math.min(9, Math.round((secStat.read / Math.max(1, secStat.total)) * 9) + ((qIdx % 4) + 3))
                );
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
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/12 border border-teal-400/50 shadow-[0_0_12px_rgba(45,212,191,0.18)]'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-100 font-bold truncate">
                        <b className="text-slate-400 mr-1.5">{qItem.num}</b>
                        {qItem.label}
                      </span>
                      <span
                        style={{ backgroundColor: qItem.color }}
                        className="w-2 h-2 rounded-xs shrink-0"
                      />
                    </div>

                    <div className="grid grid-cols-9 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => {
                        const activeSeg = step <= baseFilled;
                        return (
                          <div
                            key={step}
                            style={{
                              backgroundColor: activeSeg ? qItem.color : 'rgba(255,255,255,0.06)',
                              opacity: activeSeg ? 0.95 : 0.35
                            }}
                            className="h-2.5 rounded-[1px] transition-all"
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 `PASS · STAGE PARSE REPLY` 4대 레이어 바 */}
          <div className="mt-4 pt-3 border-t border-white/15 space-y-2">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400">
              <span>PASS · STAGE</span>
              <span className="font-bold text-white">4/9</span>
            </div>
            <div className="text-xs font-black text-teal-300 tracking-wider">
              PARSE REPLY & LOGOS
            </div>

            <div className="space-y-2 pt-1">
              {[
                { id: 'PROMPT', label: 'PROMPT (원어·정경)', count: 1, pct: '88%', color: '#FACC15' },
                { id: 'CONTEXT', label: 'CONTEXT (주석·교차)', count: 4, pct: '74%', color: '#F59E0B' },
                { id: 'LOOP', label: 'LOOP (QT·설교)', count: telemetry.qtCount + telemetry.sermonCount || 3, pct: '65%', color: '#2DD4BF' },
                { id: 'HARNESS', label: 'HARNESS (적용·기도)', count: telemetry.applyCount || 3, pct: '58%', color: '#EF4444' }
              ].map((bar) => (
                <div
                  key={bar.id}
                  onClick={() => setActiveLayerId(bar.id)}
                  className="space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-slate-200 font-bold">{bar.label}</span>
                    <span className="text-slate-400">{bar.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: bar.pct, backgroundColor: bar.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ================================================================= */}
      {/* 4. 모바일 전용 하단 뷰 전환 탭 바 */}
      {/* ================================================================= */}
      <div className="lg:hidden shrink-0 bg-[#07080E] border-t border-white/15 px-3 py-1.5 flex items-center justify-around gap-2 z-30">
        {[
          { id: 'canvas', label: '🕸️ 트리아지 아크맵' },
          { id: 'queue', label: '📊 11큐 세그먼트' },
          { id: 'terminal', label: '💻 원어·CLI 로그' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileViewTab(tab.id)}
            className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
              mobileViewTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
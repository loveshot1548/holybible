// src/pages/BibleSecondBrain3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Play,
  Pause,
  BookOpen,
  Sparkles,
  FileText,
  Activity,
  Layers,
  Grid,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import { ensureKrv4TxtLoaded, splitPericopeAndVerse } from './Bible';
import bibleData from '../ko_ko.json';

// =====================================================================
// 1. 8대 성경 정경 섹터 (상단 신약 에메랄드 / 하단 구약 크림슨 극성 매핑)
// =====================================================================
const CANON_SECTOR_GROUPS = [
  { id: 'gospels', name: '복음서·행전', code: 'GOSPELS', polarity: 'nt', color: '#10B981', glow: 'rgba(16,185,129,0.45)', defaultBook: '요한복음', strongs: 'G3056' },
  { id: 'pauline', name: '바울서신', code: 'PAULINE', polarity: 'nt', color: '#2DD4BF', glow: 'rgba(45,212,191,0.45)', defaultBook: '로마서', strongs: 'G26' },
  { id: 'general', name: '공동서신', code: 'GENERAL', polarity: 'nt', color: '#38BDF8', glow: 'rgba(56,189,248,0.45)', defaultBook: '히브리서', strongs: 'G4102' },
  { id: 'prophecy_nt', name: '요한계시록', code: 'APOCALYPSE', polarity: 'nt', color: '#34D399', glow: 'rgba(52,211,153,0.45)', defaultBook: '요한계시록', strongs: 'G5056' },
  { id: 'law', name: '모세오경', code: 'PENTATEUCH', polarity: 'ot', color: '#F43F5E', glow: 'rgba(244,63,94,0.45)', defaultBook: '창세기', strongs: 'H7225' },
  { id: 'ot_history', name: '구약역사서', code: 'OT HISTORY', polarity: 'ot', color: '#FB7185', glow: 'rgba(251,113,133,0.45)', defaultBook: '사무엘하', strongs: 'H1285' },
  { id: 'poetry', name: '시가서', code: 'POETRY', polarity: 'ot', color: '#F59E0B', glow: 'rgba(245,158,11,0.45)', defaultBook: '시편', strongs: 'H2617' },
  { id: 'prophets', name: '선지서', code: 'PROPHETS', polarity: 'ot', color: '#EC4899', glow: 'rgba(236,72,153,0.45)', defaultBook: '이사야', strongs: 'H5375' }
];

const SECTOR_NAME_TO_ID = {
  '복음서·행전': 'gospels',
  '바울서신': 'pauline',
  '공동서신': 'general',
  '예언서': 'prophecy_nt',
  '요한계시록': 'prophecy_nt',
  '모세오경': 'law',
  '구약역사서': 'ot_history',
  '시가서': 'poetry',
  '선지서': 'prophets'
};

// =====================================================================
// 2. 핵심 히브리어/헬라어 원어 앵커 사전
// =====================================================================
const CORE_LEXICON_MAP = {
  H7225: { strongs: 'H7225', word: 'בְּרֵאשִׁית', pron: '베레쉬트', mean: '태초에·시작·첫열매', grammar: '명사·여성·단수', book: '창세기', chap: 1, verse: 1 },
  H1285: { strongs: 'H1285', word: 'בְּרִית', pron: '베리트', mean: '언약·피의 맹세', grammar: '명사·여성·단수', book: '출애굽기', chap: 19, verse: 5 },
  H2617: { strongs: 'H2617', word: 'חֶסֶד', pron: '헤세드', mean: '인자하심·끝없는 언약적 사랑', grammar: '명사·남성·단수', book: '시편', chap: 23, verse: 6 },
  H5375: { strongs: 'H5375', word: 'נָשָׂא', pron: '나사', mean: '죄를 짊어지다·담당하다', grammar: '동사·칼·완료', book: '이사야', chap: 53, verse: 4 },
  G3056: { strongs: 'G3056', word: 'λόγος', pron: '로고스', mean: '말씀·성육신하신 그리스도', grammar: '명사·주격·남성·단수', book: '요한복음', chap: 1, verse: 1 },
  G26: { strongs: 'G26', word: 'ἀγάπη', pron: '아가페', mean: '하나님의 무조건적 사랑', grammar: '명사·주격·여성·단수', book: '로마서', chap: 8, verse: 39 },
  G4102: { strongs: 'G4102', word: 'πίστις', pron: '피스티스', mean: '믿음·신실함·확신', grammar: '명사·주격·여성·단수', book: '히브리서', chap: 11, verse: 1 },
  G5056: { strongs: 'G5056', word: 'τέλος', pron: '텔로스', mean: '완성·구속사의 최종 성취', grammar: '명사·주격·중성·단수', book: '요한계시록', chap: 21, verse: 6 }
};

// =====================================================================
// 3. 상단 펄스 스파크라인 캔버스 (실시간 신구약 교차 파동)
// =====================================================================
function TopPulseSparkline({ isPlaying, ntCount, otCount }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const draw = () => {
      if (isPlaying) tick += 0.04;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) {
        animId = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 중앙 기준선
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const bars = Math.max(40, Math.floor(w / 4));
      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * w;
        const norm = i / bars;
        const amp = Math.sin(norm * 14 - tick) * Math.cos(norm * 7 + tick * 0.6) * (midY - 3);
        const isNT = norm > 0.48;
        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, midY - amp);
        ctx.strokeStyle = isNT ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, ntCount, otCount]);

  return <canvas ref={canvasRef} className="w-full h-7 block" />;
}

// =====================================================================
// 4. 중앙 60FPS 오더블록 라이브 플로우 & 수직 스파인 시뮬레이션 캔버스
// =====================================================================
function OrderBlockFlowCanvas({
  streams,
  activeSectorId,
  selectedBookKo,
  isPlaying,
  onSelectBook
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hitPointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const render = () => {
      if (isPlaying) tick += 0.018;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w < 20 || h < 20) {
        animId = requestAnimationFrame(render);
        return;
      }
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 딥 터미널 배경
      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, w, h);

      // 미세 수직·수평 헤어라인 그리드
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 40; gx < w; gx += 56) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = 30; gy < h; gy += 36) {
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
      }
      ctx.stroke();

      // 중앙-우측 수직 수렴 스파인(Order-Block Spine) 좌표
      const spineX = w * 0.72;
      const spineW = 14;
      const padY = 18;
      const usableH = h - padY * 2;
      const splitY = padY + usableH * 0.46; // 상단 신약(에메랄드) / 하단 구약(크림슨) 경계

      // 수평 분할선 (신약 / 구약 극성 경계)
      ctx.beginPath();
      ctx.moveTo(0, splitY);
      ctx.lineTo(w, splitY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const nextHits = [];

      // 66권 스트림 궤적 렌더링
      streams.forEach((st, idx) => {
        const isSelected = selectedBookKo === st.bookKo;
        const isSectorMatch = activeSectorId === 'ALL' || st.sectorId === activeSectorId;
        const baseY = padY + (idx / Math.max(1, streams.length - 1)) * usableH;

        const isNT = !st.isOT;
        const strokeColor = isSelected
          ? '#38BDF8'
          : isNT
          ? '#10B981'
          : '#F43F5E';

        const alpha = isSelected ? 1.0 : isSectorMatch ? (st.hasActivity ? 0.72 : 0.34) : 0.08;

        // 1) 좌측 -> 수직 스파인(spineX) 실시간 파동 궤적
        ctx.beginPath();
        const steps = 28;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = t * (spineX - 4);
          // 오른쪽 스파인에 가까워질수록 해당 스트림의 고정 Y로 수렴
          const converge = 1 - Math.pow(t, 2.2);
          const wave =
            Math.sin(t * 7.5 - tick * (1.2 + (idx % 5) * 0.15) + idx * 0.45) * (16 + st.readRatio * 22) * converge +
            Math.cos(t * 13 + tick * 0.9 + idx) * 5 * converge;
          const y = Math.max(padY, Math.min(h - padY, baseY + wave));
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = isSelected ? 2.2 : st.hasActivity ? 1.3 : 0.85;
        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2) 스파인 내부 세그먼트 블록
        const segH = Math.max(2, usableH / streams.length - 0.8);
        ctx.fillStyle = strokeColor;
        ctx.globalAlpha = isSelected ? 1 : isSectorMatch ? 0.55 : 0.12;
        ctx.fillRect(spineX, baseY - segH / 2, spineW, segH);

        // 3) 스파인 우측 -> 우측 카드 매트릭스로 퍼져나가는 베지어 팬아웃(Fan-out) 곡선
        if (isSelected || (isSectorMatch && (idx % 2 === 0 || st.hasActivity))) {
          const rightEndX = w;
          const rightEndY = padY + ((idx * 1.03) % streams.length) / streams.length * usableH;
          ctx.beginPath();
          ctx.moveTo(spineX + spineW, baseY);
          ctx.bezierCurveTo(
            spineX + spineW + (w - spineX) * 0.42,
            baseY,
            spineX + spineW + (w - spineX) * 0.58,
            rightEndY,
            rightEndX,
            rightEndY
          );
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = isSelected ? 0.95 : 0.25;
          ctx.lineWidth = isSelected ? 2.0 : 0.9;
          ctx.stroke();
        }

        // 선택된 스트림 위를 질주하는 광자 패킷
        if (isSelected) {
          const headT = (tick * 0.55) % 1;
          const px = headT * (spineX - 4);
          const converge = 1 - Math.pow(headT, 2.2);
          const wave =
            Math.sin(headT * 7.5 - tick * (1.2 + (idx % 5) * 0.15) + idx * 0.45) * (16 + st.readRatio * 22) * converge +
            Math.cos(headT * 13 + tick * 0.9 + idx) * 5 * converge;
          const py = Math.max(padY, Math.min(h - padY, baseY + wave));

          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
        nextHits.push({ bookKo: st.bookKo, x: spineX + spineW / 2, y: baseY, r: 10 });
      });

      // 수직 스파인 외곽 프레임 글로우
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(spineX, padY - 2, spineW, usableH + 4);

      hitPointsRef.current = nextHits;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [streams, activeSectorId, selectedBookKo, isPlaying]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best = null;
    let minD = 24;
    for (const pt of hitPointsRef.current) {
      const d = Math.abs(y - pt.y) + Math.abs(x - pt.x) * 0.15;
      if (d < minD) {
        minD = d;
        best = pt;
      }
    }
    if (best && onSelectBook) onSelectBook(best.bookKo);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
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
    generalNotes = []
  } = store;

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSectorId, setActiveSectorId] = useState('ALL');
  const [selectedBookKo, setSelectedBookKo] = useState('요한복음');
  const [selectedChap, setSelectedChap] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);

  // 4대 역본 상태 ('krv4' | 'easy' | 'web' | 'orig')
  const [previewVersion, setPreviewVersion] = useState('krv4');
  const [krv4Db, setKrv4Db] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyDb, setEasyDb] = useState({});
  const [webDb, setWebDb] = useState({});

  // 검색 & 모바일 탭 ('flow' | 'matrix' | 'inspector')
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileTab, setMobileTab] = useState('flow');

  useEffect(() => {
    ensureKrv4TxtLoaded().then((db) => {
      if (db) setKrv4Db(db);
    });
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebDb(d || {})).catch(() => {});
  }, []);

  // =====================================================================
  // 5. 66권 실시간 텔레메트리 스트림 (신약 상단 에메랄드 / 구약 하단 크림슨)
  // =====================================================================
  const { streams, sectorStats, ntActiveCount, otActiveCount, totalReadChaps } = useMemo(() => {
    const readChapSet = new Set();
    Object.keys(readVerses || {}).forEach((k) => {
      if (readVerses[k]) {
        const [bk, ch] = k.split('-');
        readChapSet.add(`${bk}-${ch}`);
      }
    });

    // 권별 QT / 설교 / 성경노트 카운트 집계
    const noteCountByBook = {};
    Object.values(dailyData || {}).forEach((d) => {
      if (!d) return;
      const refText = `${d.qtReference || ''} ${d.qtTitle || ''} ${d.sermonReference || ''} ${d.sermonTitle || ''}`;
      BIBLE_66_CANON.forEach((b) => {
        if (refText.includes(b.ko)) {
          noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1;
        }
      });
    });

    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      BIBLE_66_CANON.forEach((b) => {
        if (refStr.includes(b.ko)) {
          noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1;
        }
      });
    });

    // 신약(상단 27권) 먼저, 구약(하단 39권) 순서로 배치해 오더블록 극성 구조 구현
    const orderedCanon = [
      ...BIBLE_66_CANON.filter((b) => !b.isOT),
      ...BIBLE_66_CANON.filter((b) => b.isOT)
    ];

    const secMap = {};
    CANON_SECTOR_GROUPS.forEach((g) => {
      secMap[g.id] = { ...g, totalChaps: 0, readChaps: 0, noteCount: 0, bookCount: 0 };
    });

    let ntAct = 0;
    let otAct = 0;

    const list = orderedCanon.map((b) => {
      const sectorId = SECTOR_NAME_TO_ID[b.sector] || (b.isOT ? 'law' : 'gospels');
      let readCount = 0;
      for (let c = 1; c <= b.chaps; c++) {
        if (readChapSet.has(`${b.en}-${c}`) || readChapSet.has(`${b.ko}-${c}`)) readCount++;
      }
      const noteCount = noteCountByBook[b.ko] || 0;
      const readRatio = readCount / Math.max(1, b.chaps);
      const hasActivity = readCount > 0 || noteCount > 0;

      if (!b.isOT && hasActivity) ntAct++;
      if (b.isOT && hasActivity) otAct++;

      if (secMap[sectorId]) {
        secMap[sectorId].totalChaps += b.chaps;
        secMap[sectorId].readChaps += readCount;
        secMap[sectorId].noteCount += noteCount;
        secMap[sectorId].bookCount += 1;
      }

      return {
        bookKo: b.ko,
        bookEn: b.en,
        abbr: b.abbr,
        chaps: b.chaps,
        isOT: b.isOT,
        sector: b.sector,
        sectorId,
        readCount,
        readRatio,
        pct: Math.round(readRatio * 100),
        noteCount,
        hasActivity
      };
    });

    const sectorStatsArr = CANON_SECTOR_GROUPS.map((g) => {
      const st = secMap[g.id];
      const pct = st.totalChaps > 0 ? ((st.readChaps / st.totalChaps) * 100).toFixed(1) : '0.0';
      return { ...st, pct };
    });

    return {
      streams: list,
      sectorStats: sectorStatsArr,
      ntActiveCount: ntAct || 27,
      otActiveCount: otAct || 39,
      totalReadChaps: readChapSet.size
    };
  }, [dailyData, readVerses, bibleNotes]);

  // 현재 선택된 성경의 4대 역본 + 원어 + 연결 노트 추출
  const activeBookDetail = useMemo(() => {
    const meta = BIBLE_66_CANON.find((b) => b.ko === selectedBookKo) || BIBLE_66_CANON[42];
    const chapNum = Math.max(1, Math.min(meta.chaps, selectedChap || 1));
    const sectorId = SECTOR_NAME_TO_ID[meta.sector] || (meta.isOT ? 'law' : 'gospels');
    const sectorObj = CANON_SECTOR_GROUPS.find((g) => g.id === sectorId) || CANON_SECTOR_GROUPS[0];
    const lexicon = CORE_LEXICON_MAP[sectorObj.strongs] || CORE_LEXICON_MAP.G3056;

    const krv4Chap = krv4Db?.[meta.en]?.[chapNum - 1] || krv4Db?.[meta.ko]?.[chapNum - 1];
    const fallbackBook = (Array.isArray(bibleData) ? bibleData : []).find((b) => b.name === meta.en || b.name === meta.ko);
    const baseVerses = krv4Chap || fallbackBook?.chapters?.[chapNum - 1] || [];

    const startIdx = Math.max(0, Math.min(baseVerses.length - 1, (selectedVerse || 1) - 1));
    const verses = baseVerses.slice(startIdx, startIdx + 3).map((raw, i) => {
      const vNum = startIdx + i + 1;
      const decoded = String(raw || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
      const { pureText } = splitPericopeAndVerse(decoded);
      return {
        v: vNum,
        krv4: pureText || decoded,
        easy: easyDb[`${meta.ko}-${chapNum}-${vNum}`] || '',
        web: webDb[`${meta.ko}-${chapNum}-${vNum}`] || webDb[`${meta.en}-${chapNum}-${vNum}`] || ''
      };
    });

    // 연결된 내 QT / 설교 / 성경노트 역추적
    const linked = [];
    Object.entries(dailyData || {}).forEach(([dateKey, d]) => {
      if (!d) return;
      if (`${d.qtReference || ''} ${d.qtTitle || ''}`.includes(meta.ko)) {
        linked.push({ id: `qt_${dateKey}`, tag: 'QT', title: d.qtTitle || d.qtReference, date: dateKey, screen: 'qt' });
      }
      if (`${d.sermonReference || ''} ${d.sermonTitle || ''}`.includes(meta.ko)) {
        linked.push({ id: `serm_${dateKey}`, tag: '설교', title: d.sermonTitle || d.sermonReference, date: dateKey, screen: 'sermon' });
      }
    });
    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      if (refStr.includes(meta.ko)) {
        linked.push({ id: `bn_${bn.id}`, tag: '노트', title: `${refStr} · ${(bn.note || '').slice(0, 20)}`, date: bn.date || '', screen: 'diary' });
      }
    });
    (generalNotes || []).forEach((gn) => {
      if (`${gn.title || ''} ${gn.content || ''}`.includes(meta.ko)) {
        linked.push({ id: `gn_${gn.id}`, tag: '자유', title: gn.title || '자유 노트', date: gn.updatedAt || '', screen: 'generalNote' });
      }
    });

    return {
      meta,
      chapNum,
      sectorObj,
      lexicon,
      verses,
      linked: linked.slice(0, 5)
    };
  }, [selectedBookKo, selectedChap, selectedVerse, krv4Db, easyDb, webDb, dailyData, bibleNotes, generalNotes]);

  // 통합 딥서치
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const lowerQ = q.toLowerCase();
    const hits = [];

    extractAllBibleRefsFromText(q).forEach((r) => {
      hits.push({
        id: `ref_${r.bookKo}_${r.chapter}_${r.verse}`,
        badge: '구절',
        color: '#38BDF8',
        title: `${r.bookKo} ${r.chapter}:${r.verse}`,
        onSelect: () => {
          setSelectedBookKo(r.bookKo);
          setSelectedChap(r.chapter || 1);
          setSelectedVerse(r.verse || 1);
          setActiveSectorId('ALL');
        }
      });
    });

    Object.values(CORE_LEXICON_MAP).forEach((lex) => {
      if (lex.strongs.toLowerCase().includes(lowerQ) || lex.pron.includes(q) || lex.mean.includes(q)) {
        hits.push({
          id: `lex_${lex.strongs}`,
          badge: lex.strongs,
          color: '#F59E0B',
          title: `${lex.word} [${lex.pron}] — ${lex.mean}`,
          onSelect: () => {
            setSelectedBookKo(lex.book);
            setSelectedChap(lex.chap);
            setSelectedVerse(lex.verse);
            setPreviewVersion('orig');
          }
        });
      }
    });

    BIBLE_66_CANON.forEach((b) => {
      if (b.ko.includes(q) || b.en.toLowerCase().includes(lowerQ)) {
        hits.push({
          id: `bk_${b.ko}`,
          badge: b.isOT ? '구약' : '신약',
          color: b.isOT ? '#F43F5E' : '#10B981',
          title: `${b.ko} (${b.en}) · ${b.chaps}장`,
          onSelect: () => {
            setSelectedBookKo(b.ko);
            setSelectedChap(1);
            setSelectedVerse(1);
            setActiveSectorId(SECTOR_NAME_TO_ID[b.sector] || 'ALL');
          }
        });
      }
    });

    return hits.slice(0, 10);
  }, [searchQuery]);

  // 우측 카드 매트릭스 필터링
  const visibleMatrixStreams = useMemo(() => {
    return activeSectorId === 'ALL' ? streams : streams.filter((s) => s.sectorId === activeSectorId);
  }, [streams, activeSectorId]);

  const handleSelectBook = useCallback((bookKo) => {
    setSelectedBookKo(bookKo);
    setSelectedChap(1);
    setSelectedVerse(1);
  }, []);

  const handleJumpToBible = () => {
    if (typeof setCurrentChapId === 'function') setCurrentChapId(`${activeBookDetail.meta.en}-${activeBookDetail.chapNum}`);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(selectedVerse || 1);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  const handleJumpToInterlinear = () => {
    try {
      localStorage.setItem(
        'interlinear_jump',
        JSON.stringify({ book: activeBookDetail.meta.ko, chapter: activeBookDetail.chapNum, verse: selectedVerse || 1 })
      );
    } catch (_) {}
    if (typeof setActiveScreen === 'function') setActiveScreen('interlinear');
  };

  return (
    <div
      style={{ height: '100dvh', colorScheme: 'dark' }}
      className="flex-1 w-full bg-[#05070B] text-slate-100 flex flex-col overflow-hidden select-none font-mono relative"
    >
      {/* 1. 상단 오더블록 라이브 텔레메트리 헤더 */}
      <header className="shrink-0 bg-[#080B12] border-b border-white/10 px-3 sm:px-4 py-2 z-30">
        <div className="flex items-center justify-between gap-2.5">
          {/* 좌측: 복귀 & 검색창 */}
          <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
            <button
              type="button"
              onClick={() => setActiveScreen && setActiveScreen('galaxy')}
              className="h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GALAXY</span>
            </button>

            <div className="relative flex-1 min-w-0">
              <div className="h-8 px-2.5 rounded-lg bg-[#05070B] border border-white/15 focus-within:border-sky-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(Boolean(e.target.value.trim()));
                  }}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  placeholder="66권 · 구절(요 3:16) · 원어 검색..."
                  className="w-full bg-transparent text-[12px] font-sans text-white placeholder:text-slate-500 outline-none select-text"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0A0E17] border border-sky-500/40 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-white/10 font-sans">
                  {searchResults.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => {
                        hit.onSelect();
                        setShowSearchDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-[12px] font-bold text-white truncate">{hit.title}</span>
                      <span style={{ color: hit.color }} className="text-[10px] font-mono font-bold shrink-0">
                        {hit.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 실시간 신구약 펄스 스파크라인 (PC/태블릿) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md px-3">
            <TopPulseSparkline isPlaying={isPlaying} ntCount={ntActiveCount} otCount={otActiveCount} />
          </div>

          {/* 우측: 신약/구약 라이브 카운터 & 시뮬레이션 토글 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-3 px-2.5 py-1 rounded-lg bg-[#05070B] border border-white/10 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-[9.5px] text-slate-400">NT</span>
                <span className="font-black text-emerald-400">{ntActiveCount}</span>
              </div>
              <span className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-[9.5px] text-slate-400">OT</span>
                <span className="font-black text-rose-400">{otActiveCount}</span>
              </div>
              <span className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-[9.5px] text-slate-400">READ</span>
                <span className="font-black text-sky-400">{totalReadChaps}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                isPlaying
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-slate-400'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlaying ? 'LIVE' : 'PAUSE'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 메인 3단 오더블록 텔레메트리 바디 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* [좌측] 극성 수직 바 + 8대 정경 섹터 리스트 */}
        <aside className="hidden lg:flex w-[210px] xl:w-[230px] bg-[#080B12] border-r border-white/10 shrink-0 p-2.5 flex-col gap-1.5 overflow-y-auto hide-scrollbar">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/10">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">CANON SECTORS</span>
            {activeSectorId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveSectorId('ALL')}
                className="text-[10px] font-bold text-sky-400 cursor-pointer"
              >
                ALL
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-1 min-h-0">
            {/* 극성 수직 스파인 바 (상단 에메랄드 신약 / 하단 크림슨 구약) */}
            <div className="w-1.5 rounded-full overflow-hidden flex flex-col shrink-0 my-1">
              <div className="flex-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
              <div className="h-0.5 bg-sky-400" />
              <div className="flex-1 bg-gradient-to-b from-rose-500 to-pink-600" />
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
              {sectorStats.map((sec) => {
                const isAct = activeSectorId === sec.id;
                const isNT = sec.polarity === 'nt';
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setActiveSectorId(isAct ? 'ALL' : sec.id);
                      handleSelectBook(sec.defaultBook);
                    }}
                    className={`w-full px-2 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isAct
                        ? 'bg-sky-500/15 border-sky-400/60'
                        : 'bg-[#05070B]/70 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-sans font-bold text-white truncate">{sec.name}</span>
                      <span className={`text-[10px] font-black ${isNT ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sec.pct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9.5px] text-slate-500">
                      <span>{sec.code}</span>
                      <span>{sec.readChaps}/{sec.totalChaps}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* [중앙] 60FPS 라이브 오더블록 플로우 캔버스 */}
        <section
          className={`flex-1 flex flex-col min-w-0 min-h-0 relative ${
            mobileTab === 'flow' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex-1 min-h-0 relative">
            <OrderBlockFlowCanvas
              streams={streams}
              activeSectorId={activeSectorId}
              selectedBookKo={selectedBookKo}
              isPlaying={isPlaying}
              onSelectBook={handleSelectBook}
            />

            {/* 좌상단 선택된 스트림 미니 HUD */}
            <div className="absolute top-2.5 left-2.5 z-10 px-3 py-1.5 rounded-lg bg-[#080B12]/90 border border-white/15 backdrop-blur-md flex items-center gap-2 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${activeBookDetail.meta.isOT ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="font-sans font-bold text-white">
                {activeBookDetail.meta.ko} {activeBookDetail.chapNum}장
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-sky-400 font-bold">{activeBookDetail.lexicon.strongs}</span>
            </div>
          </div>

          {/* 하단 통합 4대 역본 & 연결 노트 인스펙터 (PC/태블릿 상시 표시, 모바일은 inspector 탭) */}
          <div className="hidden lg:block shrink-0 bg-[#080B12] border-t border-white/10 p-3 font-sans">
            <div className="grid grid-cols-12 gap-3 items-start">
              {/* 좌측 7컬럼: 4대 역본 대조 */}
              <div className="col-span-7 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-white">
                      {activeBookDetail.meta.ko} {activeBookDetail.chapNum}장
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedChap((c) => Math.max(1, c - 1))}
                      className="p-0.5 rounded bg-white/5 hover:bg-white/15 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChap((c) => Math.min(activeBookDetail.meta.chaps, c + 1))}
                      className="p-0.5 rounded bg-white/5 hover:bg-white/15 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          previewVersion === ver.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {ver.label}
                      </button>
                    ))}
                  </div>
                </div>

                {previewVersion === 'orig' ? (
                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-white/10 text-[12px] space-y-0.5">
                    <div className="font-bold text-white">
                      {activeBookDetail.lexicon.word}{' '}
                      <span className="text-amber-400">[{activeBookDetail.lexicon.pron}]</span> · {activeBookDetail.lexicon.strongs}
                    </div>
                    <p className="text-slate-400">{activeBookDetail.lexicon.mean} ({activeBookDetail.lexicon.grammar})</p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-white/10 space-y-1 text-[12px] leading-relaxed">
                    {activeBookDetail.verses.slice(0, 2).map((v) => (
                      <p key={v.v} className="line-clamp-1 text-slate-200">
                        <b className="text-sky-400 font-mono mr-1.5">{v.v}</b>
                        {previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 우측 5컬럼: 연결된 내 QT/설교/노트 + 바로가기 */}
              <div className="col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">연결된 내 기록 ({activeBookDetail.linked.length})</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleJumpToBible}
                      className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" /> 본문
                    </button>
                    <button
                      type="button"
                      onClick={handleJumpToInterlinear}
                      className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> 원어
                    </button>
                  </div>
                </div>

                {activeBookDetail.linked.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-white/10 text-[11.5px] text-slate-500 flex items-center justify-between">
                    <span>연결된 QT·설교 노트가 없습니다.</span>
                    <button
                      type="button"
                      onClick={() => setActiveScreen && setActiveScreen('qt')}
                      className="text-sky-400 font-bold cursor-pointer"
                    >
                      QT 작성
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[68px] overflow-y-auto hide-scrollbar">
                    {activeBookDetail.linked.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setActiveScreen && setActiveScreen(rec.screen)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#05070B] border border-white/10 hover:border-sky-400 flex items-center justify-between gap-2 text-[11px] cursor-pointer"
                      >
                        <span className="truncate">
                          <b className="text-sky-400 mr-1.5">[{rec.tag}]</b>
                          {rec.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* [우측] 초고밀도 66권 오더블록 카드 매트릭스 */}
        <aside
          className={`w-full lg:w-[340px] xl:w-[400px] bg-[#080B12] border-t lg:border-t-0 lg:border-l border-white/10 p-2.5 flex-col overflow-hidden shrink-0 ${
            mobileTab === 'matrix' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
            <span className="text-[10.5px] font-bold text-slate-300 tracking-wider">
              66 CANON MATRIX ({visibleMatrixStreams.length})
            </span>
            <span className="text-[10px] text-slate-500">NT EMERALD · OT CRIMSON</span>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 content-start pb-4">
            {visibleMatrixStreams.map((st) => {
              const isSel = selectedBookKo === st.bookKo;
              const isNT = !st.isOT;
              return (
                <button
                  key={st.bookKo}
                  type="button"
                  onClick={() => {
                    handleSelectBook(st.bookKo);
                    if (mobileTab === 'matrix') setMobileTab('inspector');
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSel
                      ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : isNT
                      ? 'bg-emerald-950/25 border-emerald-500/25 hover:border-emerald-400/60'
                      : 'bg-rose-950/25 border-rose-500/25 hover:border-rose-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11.5px] font-sans font-bold text-white truncate">{st.bookKo}</span>
                    <span className={`text-[9.5px] font-black shrink-0 ${isNT ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {st.pct}%
                    </span>
                  </div>

                  <div className="w-full h-1 rounded-full bg-black/50 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(8, st.pct)}%` }}
                      className={`h-full ${isNT ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{st.readCount}/{st.chaps}장</span>
                    {st.noteCount > 0 && <span className="text-sky-300 font-bold">N:{st.noteCount}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 모바일 전용 4대 역본 & 연결 기록 탭 뷰 */}
        {mobileTab === 'inspector' && (
          <section className="lg:hidden flex-1 overflow-y-auto p-3.5 space-y-3 font-sans hide-scrollbar">
            <div className="p-3.5 rounded-xl bg-[#080B12] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-white">
                  {activeBookDetail.meta.ko} {activeBookDetail.chapNum}장
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedChap((c) => Math.max(1, c - 1))}
                    className="p-1.5 rounded-lg bg-white/5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChap((c) => Math.min(activeBookDetail.meta.chaps, c + 1))}
                    className="p-1.5 rounded-lg bg-white/5 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                {[
                  { id: 'krv4', label: '개역4판' },
                  { id: 'easy', label: '쉬운성경' },
                  { id: 'web', label: 'WEB영어' },
                  { id: 'orig', label: '원어' }
                ].map((ver) => (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => setPreviewVersion(ver.id)}
                    className={`py-1.5 rounded-lg cursor-pointer ${
                      previewVersion === ver.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {ver.label}
                  </button>
                ))}
              </div>

              {previewVersion === 'orig' ? (
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/10 space-y-1">
                  <div className="text-[14px] font-bold text-white">
                    {activeBookDetail.lexicon.word} <span className="text-amber-400">[{activeBookDetail.lexicon.pron}]</span>
                  </div>
                  <p className="text-[12.5px] text-slate-300">{activeBookDetail.lexicon.mean}</p>
                  <span className="text-[11px] font-mono text-slate-500">{activeBookDetail.lexicon.strongs} · {activeBookDetail.lexicon.grammar}</span>
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-lg bg-[#05070B] border border-white/10 text-[13px] leading-relaxed">
                  {activeBookDetail.verses.map((v) => (
                    <p key={v.v} className="text-slate-200">
                      <b className="text-sky-400 font-mono mr-1.5">{v.v}</b>
                      {previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleJumpToBible}
                  className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" /> 성경 본문 열기
                </button>
                <button
                  type="button"
                  onClick={handleJumpToInterlinear}
                  className="py-2.5 rounded-xl bg-amber-600 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> 원어 스튜디오
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080B12] border border-white/10 space-y-2">
              <span className="text-[12.5px] font-bold text-slate-300 block">연결된 내 QT · 설교 · 노트</span>
              {activeBookDetail.linked.length === 0 ? (
                <p className="text-[12px] text-slate-500 py-2">이 성경에 연결된 기록이 아직 없습니다.</p>
              ) : (
                activeBookDetail.linked.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setActiveScreen && setActiveScreen(rec.screen)}
                    className="w-full p-2.5 rounded-lg bg-[#05070B] border border-white/10 flex items-center justify-between text-[12px] cursor-pointer"
                  >
                    <span className="truncate"><b className="text-sky-400 mr-1.5">[{rec.tag}]</b>{rec.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* 3. 모바일 전용 하단 3단 전환 바 (iOS 안전 영역 적용) */}
      <nav className="lg:hidden shrink-0 bg-[#080B12] border-t border-white/10 px-3 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1.5 z-30 font-sans">
        {[
          { id: 'flow', label: '라이브 플로우', icon: Activity },
          { id: 'matrix', label: '66권 매트릭스', icon: Grid },
          { id: 'inspector', label: '4대역본·기록', icon: FileText }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`py-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                active ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
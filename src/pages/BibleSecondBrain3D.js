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
  Grid,
  ExternalLink,
  Link2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import { ensureKrv4TxtLoaded, splitPericopeAndVerse } from './Bible';
import bibleData from '../ko_ko.json';

// =====================================================================
// 1. 8대 성경 정경 섹터 (상단 신약 에메랄드 / 하단 구약 크림슨)
// =====================================================================
const CANON_SECTOR_GROUPS = [
  { id: 'gospels', name: '복음서·행전', code: 'GOSPELS', polarity: 'nt', color: '#10B981', defaultBook: '요한복음', strongs: 'G3056' },
  { id: 'pauline', name: '바울서신', code: 'PAULINE', polarity: 'nt', color: '#2DD4BF', defaultBook: '로마서', strongs: 'G26' },
  { id: 'general', name: '공동서신', code: 'GENERAL', polarity: 'nt', color: '#38BDF8', defaultBook: '히브리서', strongs: 'G4102' },
  { id: 'prophecy_nt', name: '요한계시록', code: 'APOCALYPSE', polarity: 'nt', color: '#34D399', defaultBook: '요한계시록', strongs: 'G5056' },
  { id: 'law', name: '모세오경', code: 'PENTATEUCH', polarity: 'ot', color: '#F43F5E', defaultBook: '창세기', strongs: 'H7225' },
  { id: 'ot_history', name: '구약역사서', code: 'OT HISTORY', polarity: 'ot', color: '#FB7185', defaultBook: '사무엘하', strongs: 'H1285' },
  { id: 'poetry', name: '시가서', code: 'POETRY', polarity: 'ot', color: '#F59E0B', defaultBook: '시편', strongs: 'H2617' },
  { id: 'prophets', name: '선지서', code: 'PROPHETS', polarity: 'ot', color: '#EC4899', defaultBook: '이사야', strongs: 'H5375' }
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
// 2. 핵심 히브리어/헬라어 원어 앵커 사전 & 신구약 교차참조 파트너 맵
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

const CROSS_REF_PARTNERS = {
  창세기: [
    { book: '요한복음', chap: 1, label: '태초의 로고스' },
    { book: '로마서', chap: 4, label: '아브라함 이신칭의' },
    { book: '요한계시록', chap: 22, label: '생명나무 완성' }
  ],
  출애굽기: [
    { book: '고린도전서', chap: 5, label: '유월절 어린양' },
    { book: '요한복음', chap: 6, label: '하늘의 생명의 떡' },
    { book: '히브리서', chap: 9, label: '새 언약의 성막' }
  ],
  레위기: [
    { book: '히브리서', chap: 10, label: '영원한 속죄제사' },
    { book: '베드로전서', chap: 1, label: '거룩함의 부르심' }
  ],
  시편: [
    { book: '마태복음', chap: 27, label: '십자가 메시아 시편' },
    { book: '히브리서', chap: 1, label: '영원한 보좌와 아들' },
    { book: '요한복음', chap: 10, label: '선한 목자' }
  ],
  이사야: [
    { book: '마태복음', chap: 1, label: '임마누엘 성취' },
    { book: '베드로전서', chap: 2, label: '고난받는 종의 대속' },
    { book: '요한계시록', chap: 21, label: '새 하늘과 새 땅' }
  ],
  요한복음: [
    { book: '창세기', chap: 1, label: '태초 창조와 말씀' },
    { book: '출애굽기', chap: 3, label: '스스로 있는 자' },
    { book: '이사야', chap: 53, label: '하나님의 어린양' }
  ],
  로마서: [
    { book: '창세기', chap: 15, label: '믿음으로 의롭다 함' },
    { book: '하박국', chap: 2, label: '의인은 믿음으로' },
    { book: '시편', chap: 32, label: '사죄의 복' }
  ],
  히브리서: [
    { book: '레위기', chap: 16, label: '대속죄일 완성' },
    { book: '시편', chap: 110, label: '멜기세덱 반차' },
    { book: '예레미야', chap: 31, label: '새 언약 성취' }
  ],
  요한계시록: [
    { book: '창세기', chap: 2, label: '에덴의 회복' },
    { book: '다니엘', chap: 7, label: '인자의 영원한 나라' },
    { book: '에스겔', chap: 47, label: '생명수의 강' }
  ]
};

// 카드 내부 미니 SVG 스파크라인 포인트 생성 (결정론적)
function buildSparklinePoints(seedIdx, chaps, readRatio) {
  const pts = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * 100;
    const wave =
      Math.sin(i * 0.9 + seedIdx * 1.3) * 6 +
      Math.cos(i * 1.7 - seedIdx * 0.7) * 4;
    const trend = (i / (count - 1)) * (readRatio * 10 + Math.min(8, chaps / 12));
    const y = Math.max(3, Math.min(21, 16 - trend * 0.6 + wave * 0.55));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

// =====================================================================
// 3. 상단 실시간 신구약 펄스 스파크라인 (모바일/PC 공통)
// =====================================================================
function TopPulseSparkline({ isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const draw = () => {
      if (isPlaying) tick += 0.045;
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

      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const bars = Math.max(48, Math.floor(w / 3.5));
      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * w;
        const norm = i / bars;
        const envelope = Math.sin(norm * Math.PI);
        const spike =
          Math.sin(norm * 22 - tick) * 0.65 +
          Math.cos(norm * 47 + tick * 1.3) * 0.35;
        const amp = spike * envelope * (midY - 2);
        const isNT = norm > 0.48;

        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, midY - amp);
        ctx.strokeStyle = isNT ? 'rgba(16, 185, 129, 0.9)' : 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-7 block" />;
}

// =====================================================================
// 4. 중앙 60FPS 오더블록 오로라 플로우 + 발광 볼륨 기둥 + 교차참조 아크
// =====================================================================
function OrderBlockFlowCanvas({
  streams,
  sectorStats,
  activeSectorId,
  selectedBookKo,
  partnerBookSet,
  isPlaying,
  onSelectBook,
  onSelectSector
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hitPointsRef = useRef([]);
  const isScrubbingRef = useRef(false);

  // 각 66권 스트림별 고정 시계열 노이즈 패턴 (매 프레임 흔들리지 않고 차트처럼 흐름)
  const seriesNoise = useMemo(() => {
    const STEPS = 44;
    return streams.map((_, idx) => {
      const arr = [0];
      let val = 0;
      for (let s = 1; s < STEPS; s++) {
        // 결정론적 의사 난수 스텝
        const r = Math.sin(idx * 12.9898 + s * 78.233) * 43758.5453;
        const step = (r - Math.floor(r) - 0.5) * 2;
        val = val * 0.82 + step;
        arr.push(val);
      }
      arr.push(0);
      return arr;
    });
  }, [streams.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const render = () => {
      if (isPlaying) tick += 0.012;
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
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04060A';
      ctx.fillRect(0, 0, w, h);

      // 미세 차트 그리드
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 40; gx < w; gx += 48) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = 28; gy < h; gy += 34) {
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
      }
      ctx.stroke();

      const isNarrow = w < 540;
      const leftPad = isNarrow ? 76 : 116;
      const spineX = isNarrow ? w * 0.75 : w * 0.78;
      const spineW = isNarrow ? 16 : 24;
      const padY = 18;
      const usableH = h - padY * 2;
      const splitY = padY + (27 / Math.max(1, streams.length)) * usableH;

      // 1) 좌측 극성 수직 폴
      const gaugeX = 8;
      ctx.fillStyle = '#10B981';
      ctx.fillRect(gaugeX, padY, 2.5, Math.max(2, splitY - padY - 2));
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(gaugeX, splitY + 2, 2.5, Math.max(2, h - padY - splitY - 2));

      // 극성 경계 수평선
      ctx.beginPath();
      ctx.moveTo(gaugeX + 6, splitY);
      ctx.lineTo(w, splitY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const nextHits = [];

      // 2) 좌측 8대 정경 섹터 티커
      (sectorStats || []).forEach((sec, sIdx) => {
        const sy = padY + ((sIdx + 0.5) / Math.max(1, sectorStats.length)) * usableH;
        const isAct = activeSectorId === sec.id;
        const isNT = sec.polarity === 'nt';
        const secColor = isAct ? '#38BDF8' : isNT ? '#10B981' : '#F43F5E';
        const bx = 16;
        const bw = leftPad - 22;
        const bh = isNarrow ? 18 : 20;

        ctx.fillStyle = isAct ? 'rgba(56, 189, 248, 0.18)' : 'rgba(9, 13, 22, 0.92)';
        ctx.fillRect(bx, sy - bh / 2, bw, bh);
        ctx.strokeStyle = isAct ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, sy - bh / 2, bw, bh);

        // 좌측 얇은 컬러 팁
        ctx.fillStyle = secColor;
        ctx.fillRect(bx, sy - bh / 2, 2, bh);

        ctx.font = `bold ${isNarrow ? 8.5 : 9.5}px "Pretendard", sans-serif`;
        ctx.fillStyle = '#E2E8F0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(sec.name.slice(0, isNarrow ? 4 : 6), bx + 6, sy);

        ctx.font = `bold ${isNarrow ? 8 : 9}px monospace`;
        ctx.fillStyle = secColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${sec.pct}%`, bx + bw - 4, sy);

        nextHits.push({ type: 'sector', sectorId: sec.id, defaultBook: sec.defaultBook, x: bx, y: sy, w: bw, h: bh + 4 });
      });

      // 3) 66권 시계열 텔레메트리 폴리라인 (브라운 브릿지: 천장 클리핑 없음)
      const flowW = Math.max(20, spineX - leftPad);
      const steps = 44;
      const bookYMap = {};

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      streams.forEach((st, idx) => {
        const baseY = padY + (idx / Math.max(1, streams.length - 1)) * usableH;
        bookYMap[st.bookKo] = baseY;

        const isSelected = selectedBookKo === st.bookKo;
        const isPartner = partnerBookSet.has(st.bookKo);
        const isSectorMatch = activeSectorId === 'ALL' || st.sectorId === activeSectorId;
        const isNT = !st.isOT;

        const strokeColor = isSelected
          ? '#38BDF8'
          : isPartner
          ? '#F59E0B'
          : isNT
          ? '#10B981'
          : '#F43F5E';

        const alpha = isSelected
          ? 0.98
          : isPartner
          ? 0.65
          : isSectorMatch
          ? st.hasActivity
            ? 0.36
            : 0.16
          : 0.04;

        const noiseArr = seriesNoise[idx] || [];
        // 왼쪽은 splitY 쪽에서 모아 출발해 오른쪽 baseY로 계단식 시계열 드리프트
        const startY = splitY + (baseY - splitY) * 0.55;

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = leftPad + t * flowW;
          const envelope = Math.sin(t * Math.PI); // 양 끝(0, 1)에서 정확히 0으로 수렴
          const liveDrift = Math.sin(tick * 1.4 + idx * 0.7 + t * 5) * 4.5 * envelope;
          const jitter = (noiseArr[s] || 0) * 11.5 * envelope;
          const y = Math.max(padY + 2, Math.min(h - padY - 2, startY + (baseY - startY) * t + jitter + liveDrift));
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = isSelected ? 1.8 : isPartner ? 1.2 : 0.8;
        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 8;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 우측 팬아웃 필라멘트 (스파인 -> 우측 카드 매트릭스)
        if (isSelected || isPartner || (isSectorMatch && idx % 2 === 0)) {
          const rightEndY = padY + (((idx * 1.04) % streams.length) / streams.length) * usableH;
          const fanW = w - (spineX + spineW);
          ctx.beginPath();
          ctx.moveTo(spineX + spineW, baseY);
          ctx.bezierCurveTo(
            spineX + spineW + fanW * 0.45,
            baseY,
            spineX + spineW + fanW * 0.55,
            rightEndY,
            w,
            rightEndY
          );
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = isSelected ? 0.9 : isPartner ? 0.5 : 0.16;
          ctx.lineWidth = isSelected ? 1.6 : 0.75;
          ctx.stroke();
        }
      });

      ctx.restore();

      // 4) 슬림 글래스 수직 오더블록 기둥 (과한 채움 제거)
      ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
      ctx.fillRect(spineX, padY, spineW, usableH);

      streams.forEach((st) => {
        const baseY = bookYMap[st.bookKo];
        const isSelected = selectedBookKo === st.bookKo;
        const isPartner = partnerBookSet.has(st.bookKo);
        const isNT = !st.isOT;
        const tickW = Math.max(3, (spineW - 4) * (0.2 + Math.min(0.8, st.chaps / 66 + st.readRatio * 0.4)));

        ctx.fillStyle = isSelected ? '#38BDF8' : isPartner ? '#F59E0B' : isNT ? '#10B981' : '#F43F5E';
        ctx.globalAlpha = isSelected ? 1 : isPartner ? 0.85 : 0.32;
        ctx.fillRect(spineX + 2, baseY - 0.8, isSelected ? spineW - 4 : tickW, isSelected ? 2.4 : 1.4);

        if (isSelected) {
          // 선택된 행 수평 크로스헤어 라인 (레퍼런스 파란 수평선)
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(leftPad, baseY - 0.5, w - leftPad, 1);
        }

        ctx.globalAlpha = 1;
        nextHits.push({ type: 'book', bookKo: st.bookKo, x: spineX - 10, y: baseY, w: spineW + 30, h: 12 });
      });

      // 기둥 양쪽 얇은 글래스 테두리
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
      ctx.lineWidth = 1;
      ctx.strokeRect(spineX, padY, spineW, usableH);

      hitPointsRef.current = nextHits;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [streams, sectorStats, activeSectorId, selectedBookKo, partnerBookSet, isPlaying, seriesNoise]);

  const pickAtClientPos = (clientX, clientY, allowSector = true) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (allowSector) {
      for (const pt of hitPointsRef.current) {
        if (pt.type === 'sector' && x >= pt.x && x <= pt.x + pt.w && Math.abs(y - pt.y) <= pt.h / 2) {
          onSelectSector?.(pt.sectorId, pt.defaultBook);
          return;
        }
      }
    }

    let best = null;
    let minD = 26;
    for (const pt of hitPointsRef.current) {
      if (pt.type !== 'book') continue;
      const d = Math.abs(y - pt.y);
      if (d < minD) {
        minD = d;
        best = pt;
      }
    }
    if (best) onSelectBook?.(best.bookKo);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={(e) => pickAtClientPos(e.clientX, e.clientY, true)}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            isScrubbingRef.current = true;
            pickAtClientPos(e.touches[0].clientX, e.touches[0].clientY, true);
          }
        }}
        onTouchMove={(e) => {
          if (isScrubbingRef.current && e.touches.length === 1) {
            pickAtClientPos(e.touches[0].clientX, e.touches[0].clientY, false);
          }
        }}
        onTouchEnd={() => {
          isScrubbingRef.current = false;
        }}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
}

// =====================================================================
// 5. 메인 BibleSecondBrain3D (Order-Block Live Telemetry Terminal)
// =====================================================================
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
  const [matrixFilter, setMatrixFilter] = useState('all'); // 'all' | 'nt' | 'ot' | 'active'
  const [selectedBookKo, setSelectedBookKo] = useState('요한복음');
  const [selectedChap, setSelectedChap] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);

  const [previewVersion, setPreviewVersion] = useState('krv4'); // 'krv4' | 'easy' | 'web' | 'orig'
  const [krv4Db, setKrv4Db] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyDb, setEasyDb] = useState({});
  const [webDb, setWebDb] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileTab, setMobileTab] = useState('flow'); // 'flow' | 'matrix' | 'inspector'

  useEffect(() => {
    ensureKrv4TxtLoaded().then((db) => {
      if (db) setKrv4Db(db);
    });
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebDb(d || {})).catch(() => {});
  }, []);

  // 66권 실시간 텔레메트리 스트림
  const { streams, sectorStats, ntActiveCount, otActiveCount, totalReadChaps } = useMemo(() => {
    const readChapSet = new Set();
    Object.keys(readVerses || {}).forEach((k) => {
      if (readVerses[k]) {
        const [bk, ch] = k.split('-');
        readChapSet.add(`${bk}-${ch}`);
      }
    });

    const noteCountByBook = {};
    Object.values(dailyData || {}).forEach((d) => {
      if (!d) return;
      const refText = `${d.qtReference || ''} ${d.qtTitle || ''} ${d.sermonReference || ''} ${d.sermonTitle || ''}`;
      BIBLE_66_CANON.forEach((b) => {
        if (refText.includes(b.ko)) noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1;
      });
    });

    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      BIBLE_66_CANON.forEach((b) => {
        if (refStr.includes(b.ko)) noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1;
      });
    });

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

    const list = orderedCanon.map((b, idx) => {
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

      const xrWeight = (CROSS_REF_PARTNERS[b.ko]?.length || 0) * 14 + Math.min(48, b.chaps);

      return {
        idx,
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
        xrWeight,
        sparkPoints: buildSparklinePoints(idx, b.chaps, readRatio),
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
      ntActiveCount: ntAct,
      otActiveCount: otAct,
      totalReadChaps: readChapSet.size
    };
  }, [dailyData, readVerses, bibleNotes]);

  // 현재 선택된 성경의 교차참조 파트너 목록 & Set
  const activePartners = useMemo(() => {
    const direct = CROSS_REF_PARTNERS[selectedBookKo];
    if (direct && direct.length > 0) return direct;
    const isOT = BIBLE_66_CANON.find((b) => b.ko === selectedBookKo)?.isOT;
    return isOT
      ? [
          { book: '요한복음', chap: 1, label: '신약 로고스 성취' },
          { book: '로마서', chap: 8, label: '복음의 완성' }
        ]
      : [
          { book: '창세기', chap: 1, label: '구약 창조 언약' },
          { book: '이사야', chap: 53, label: '메시아 예언' }
        ];
  }, [selectedBookKo]);

  const partnerBookSet = useMemo(() => new Set(activePartners.map((p) => p.book)), [activePartners]);

  // 현재 선택된 성경의 4대 역본 + 원어 + 연결 기록
  const activeBookDetail = useMemo(() => {
    const meta = BIBLE_66_CANON.find((b) => b.ko === selectedBookKo) || BIBLE_66_CANON[42];
    const chapNum = Math.max(1, Math.min(meta.chaps, selectedChap || 1));
    const sectorId = SECTOR_NAME_TO_ID[meta.sector] || (meta.isOT ? 'law' : 'gospels');
    const sectorObj = CANON_SECTOR_GROUPS.find((g) => g.id === sectorId) || CANON_SECTOR_GROUPS[0];
    const lexicon = CORE_LEXICON_MAP[sectorObj.strongs] || CORE_LEXICON_MAP.G3056;

    const krv4Chap = krv4Db?.[meta.en]?.[chapNum - 1] || krv4Db?.[meta.ko]?.[chapNum - 1];
    const fallbackBook = (Array.isArray(bibleData) ? bibleData : []).find((b) => b.name === meta.en || b.name === meta.ko);
    const baseVerses = krv4Chap || fallbackBook?.chapters?.[chapNum - 1] || [];

    const startIdx = Math.max(0, Math.min(Math.max(0, baseVerses.length - 1), (selectedVerse || 1) - 1));
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

    return { meta, chapNum, sectorObj, lexicon, verses, linked: linked.slice(0, 5) };
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
    let list = activeSectorId === 'ALL' ? streams : streams.filter((s) => s.sectorId === activeSectorId);
    if (matrixFilter === 'nt') list = list.filter((s) => !s.isOT);
    else if (matrixFilter === 'ot') list = list.filter((s) => s.isOT);
    else if (matrixFilter === 'active') list = list.filter((s) => s.hasActivity);
    return list;
  }, [streams, activeSectorId, matrixFilter]);

  const handleSelectBook = useCallback((bookKo, chap = 1) => {
    setSelectedBookKo(bookKo);
    setSelectedChap(chap);
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
      className="flex-1 w-full bg-[#04060A] text-slate-100 flex flex-col overflow-hidden select-none font-mono relative"
    >
      {/* 1. 상단 오더블록 텔레메트리 헤더 (모바일/PC 공통 실시간 펄스 파형) */}
      <header className="shrink-0 bg-[#080B12] border-b border-white/10 px-2.5 sm:px-4 pt-2 pb-1.5 z-30 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 max-w-md min-w-0">
            <button
              type="button"
              onClick={() => setActiveScreen && setActiveScreen('galaxy')}
              className="h-8 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GALAXY</span>
            </button>

            <div className="relative flex-1 min-w-0">
              <div className="h-8 px-2.5 rounded-lg bg-[#04060A] border border-white/15 focus-within:border-sky-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(Boolean(e.target.value.trim()));
                  }}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  placeholder="66권 · 구절(요 3:16) · 원어..."
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

          {/* PC 전용 중앙 스파크라인 */}
          <div className="hidden lg:flex items-center flex-1 max-w-md px-2">
            <TopPulseSparkline isPlaying={isPlaying} />
          </div>

          {/* 우측 라이브 카운터 & 재생 토글 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#04060A] border border-white/10 text-[10.5px]">
              <span className="text-emerald-400 font-black">NT {ntActiveCount}</span>
              <span className="text-rose-400 font-black">OT {otActiveCount}</span>
              <span className="hidden sm:inline text-sky-400 font-black">READ {totalReadChaps}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className={`h-8 px-2 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer ${
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

        {/* 모바일 전용 상단 실시간 펄스 파형 바 */}
        <div className="lg:hidden">
          <TopPulseSparkline isPlaying={isPlaying} />
        </div>
      </header>

      {/* 2. 메인 바디: 캔버스(좌측 극성·섹터 통합) + 우측 66권 매트릭스 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* [좌·중앙] 60FPS 오로라 플로우 + 발광 볼륨 기둥 + 하단 인스펙터 */}
        <section
          className={`flex-1 flex flex-col min-w-0 min-h-0 relative ${
            mobileTab === 'flow' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex-1 min-h-0 relative">
            <OrderBlockFlowCanvas
              streams={streams}
              sectorStats={sectorStats}
              activeSectorId={activeSectorId}
              selectedBookKo={selectedBookKo}
              partnerBookSet={partnerBookSet}
              isPlaying={isPlaying}
              onSelectBook={(bk) => handleSelectBook(bk, 1)}
              onSelectSector={(secId, defBook) => {
                setActiveSectorId((prev) => (prev === secId ? 'ALL' : secId));
                handleSelectBook(defBook, 1);
              }}
            />

            {/* 우상단 선택 성경 & 필터 해제 배지 */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
              {activeSectorId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveSectorId('ALL')}
                  className="px-2 py-1 rounded-md bg-sky-500/20 border border-sky-400/50 text-sky-300 text-[10px] font-bold cursor-pointer"
                >
                  전체 섹터 ✕
                </button>
              )}
              <div className="px-2.5 py-1 rounded-md bg-[#080B12]/90 border border-white/15 backdrop-blur-md flex items-center gap-1.5 text-[10.5px]">
                <span className={`w-2 h-2 rounded-full ${activeBookDetail.meta.isOT ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span className="font-sans font-bold text-white">
                  {activeBookDetail.meta.ko} {activeBookDetail.chapNum}장
                </span>
                <span className="text-amber-400 font-bold">{activeBookDetail.lexicon.strongs}</span>
              </div>
            </div>
          </div>

          {/* 모바일 플로우 탭 하단 컴팩트 라이브 프리뷰 독 */}
          <div className="lg:hidden shrink-0 bg-[#080B12] border-t border-white/10 px-3 py-2 font-sans space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12.5px] font-bold text-white shrink-0">
                  {activeBookDetail.meta.ko} {activeBookDetail.chapNum}장
                </span>
                <span className="text-[11px] text-amber-400 font-mono truncate">
                  {activeBookDetail.lexicon.word} [{activeBookDetail.lexicon.pron}]
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleJumpToBible}
                  className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-[10.5px] font-bold cursor-pointer"
                >
                  본문
                </button>
                <button
                  type="button"
                  onClick={handleJumpToInterlinear}
                  className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-[10.5px] font-bold cursor-pointer"
                >
                  원어
                </button>
              </div>
            </div>
            <p className="text-[11.5px] text-slate-300 line-clamp-1">
              {activeBookDetail.verses[0]?.krv4 || '기둥을 터치하거나 드래그해 66권을 탐색하세요.'}
            </p>
          </div>

          {/* PC/태블릿 하단 4대 역본 · 교차참조 파트너 · 연결 기록 통합 독 */}
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
                  <div className="p-2.5 rounded-lg bg-[#04060A] border border-white/10 text-[12px] space-y-0.5">
                    <div className="font-bold text-white">
                      {activeBookDetail.lexicon.word}{' '}
                      <span className="text-amber-400">[{activeBookDetail.lexicon.pron}]</span> · {activeBookDetail.lexicon.strongs}
                    </div>
                    <p className="text-slate-400">{activeBookDetail.lexicon.mean} ({activeBookDetail.lexicon.grammar})</p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#04060A] border border-white/10 space-y-1 text-[12px] leading-relaxed">
                    {activeBookDetail.verses.slice(0, 2).map((v) => (
                      <p key={v.v} className="line-clamp-1 text-slate-200">
                        <b className="text-sky-400 font-mono mr-1.5">{v.v}</b>
                        {previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}
                      </p>
                    ))}
                  </div>
                )}

                {/* 신구약 교차참조 퀵 점프 칩 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-amber-400 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> 교차참조:
                  </span>
                  {activePartners.map((p) => (
                    <button
                      key={`${p.book}_${p.chap}`}
                      type="button"
                      onClick={() => handleSelectBook(p.book, p.chap)}
                      className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/30 text-[10.5px] font-bold text-amber-200 cursor-pointer"
                    >
                      {p.book} {p.chap}장 · {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 우측 5컬럼: 연결된 내 기록 + 바로가기 */}
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
                  <div className="p-2.5 rounded-lg bg-[#04060A] border border-white/10 text-[11.5px] text-slate-500 flex items-center justify-between">
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
                  <div className="space-y-1 max-h-[82px] overflow-y-auto hide-scrollbar">
                    {activeBookDetail.linked.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setActiveScreen && setActiveScreen(rec.screen)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#04060A] border border-white/10 hover:border-sky-400 flex items-center justify-between gap-2 text-[11px] cursor-pointer"
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

        {/* [우측] 초고밀도 66권 오더블록 카드 매트릭스 (미니 스파크라인 내장) */}
        <aside
          className={`w-full lg:w-[360px] xl:w-[430px] bg-[#080B12] border-t lg:border-t-0 lg:border-l border-white/10 p-2.5 flex-col overflow-hidden shrink-0 ${
            mobileTab === 'matrix' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 shrink-0">
            <span className="text-[10.5px] font-bold text-slate-300 tracking-wider">
              CANON MATRIX ({visibleMatrixStreams.length})
            </span>
            <div className="flex items-center gap-1 font-sans text-[10px] font-bold">
              {[
                { id: 'all', label: '전체' },
                { id: 'nt', label: '신약' },
                { id: 'ot', label: '구약' },
                { id: 'active', label: '활동' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMatrixFilter(f.id)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    matrixFilter === f.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 content-start pb-4">
            {visibleMatrixStreams.map((st) => {
              const isSel = selectedBookKo === st.bookKo;
              const isPartner = partnerBookSet.has(st.bookKo);
              const isNT = !st.isOT;
              const accentHex = isSel ? '#38BDF8' : isPartner ? '#FACC15' : isNT ? '#10B981' : '#F43F5E';

              return (
                <button
                  key={st.bookKo}
                  type="button"
                  onClick={() => {
                    handleSelectBook(st.bookKo, 1);
                    if (mobileTab === 'matrix') setMobileTab('inspector');
                  }}
                  style={{ borderLeftColor: accentHex }}
                  className={`p-2 rounded-lg border border-l-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSel
                      ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.28)]'
                      : isPartner
                      ? 'bg-amber-500/15 border-amber-400/60'
                      : isNT
                      ? 'bg-emerald-950/25 border-emerald-500/20 hover:border-emerald-400/60'
                      : 'bg-rose-950/25 border-rose-500/20 hover:border-rose-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11.5px] font-sans font-bold text-white truncate">{st.bookKo}</span>
                    <span style={{ color: accentHex }} className="text-[9.5px] font-black shrink-0">
                      {st.pct}%
                    </span>
                  </div>

                  {/* 카드 내부 실시간 밀도 미니 SVG 스파크라인 */}
                  <svg viewBox="0 0 100 24" className="w-full h-4 overflow-visible">
                    <polyline
                      fill="none"
                      stroke={accentHex}
                      strokeWidth={isSel ? '2' : '1.35'}
                      strokeOpacity={isSel || st.hasActivity ? '0.95' : '0.45'}
                      points={st.sparkPoints}
                    />
                  </svg>

                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{st.readCount}/{st.chaps}장</span>
                    <span className={st.noteCount > 0 ? 'text-sky-300 font-bold' : 'text-slate-500'}>
                      {st.noteCount > 0 ? `N:${st.noteCount}` : `XR:${st.xrWeight}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 모바일 전용 4대 역본 & 교차참조 & 연결 기록 탭 */}
        {mobileTab === 'inspector' && (
          <section className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3 font-sans hide-scrollbar">
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
                <div className="p-3 rounded-lg bg-[#04060A] border border-white/10 space-y-1">
                  <div className="text-[14px] font-bold text-white">
                    {activeBookDetail.lexicon.word} <span className="text-amber-400">[{activeBookDetail.lexicon.pron}]</span>
                  </div>
                  <p className="text-[12.5px] text-slate-300">{activeBookDetail.lexicon.mean}</p>
                  <span className="text-[11px] font-mono text-slate-500">
                    {activeBookDetail.lexicon.strongs} · {activeBookDetail.lexicon.grammar}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-lg bg-[#04060A] border border-white/10 text-[13px] leading-relaxed">
                  {activeBookDetail.verses.map((v) => (
                    <p key={v.v} className="text-slate-200">
                      <b className="text-sky-400 font-mono mr-1.5">{v.v}</b>
                      {previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}
                    </p>
                  ))}
                </div>
              )}

              {/* 교차참조 파트너 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activePartners.map((p) => (
                  <button
                    key={`${p.book}_${p.chap}`}
                    type="button"
                    onClick={() => handleSelectBook(p.book, p.chap)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[11px] font-bold text-amber-200 cursor-pointer"
                  >
                    {p.book} {p.chap}장 · {p.label}
                  </button>
                ))}
              </div>

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
                    className="w-full p-2.5 rounded-lg bg-[#04060A] border border-white/10 flex items-center justify-between text-[12px] cursor-pointer"
                  >
                    <span className="truncate">
                      <b className="text-sky-400 mr-1.5">[{rec.tag}]</b>
                      {rec.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* 3. 모바일 하단 3단 전환 바 (iOS 안전 영역 적용) */}
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
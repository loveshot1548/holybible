// src/pages/BibleSecondBrain3D.js (Live Spark & Pulse Flow · Real TSK/Interlinear/Sermon Parsing · Mobile Optimized)
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
  Link2,
  Zap
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import { getCrossReferences } from '../lib/tskHelper';
import { supabase } from '../lib/supabase';
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

const FALLBACK_CROSS_REFS = {
  창세기: [{ book: '요한복음', chap: 1, verse: 1, label: '태초의 로고스' }, { book: '로마서', chap: 4, verse: 3, label: '아브라함 이신칭의' }, { book: '요한계시록', chap: 22, verse: 2, label: '생명나무 완성' }],
  출애굽기: [{ book: '고린도전서', chap: 5, verse: 7, label: '유월절 어린양' }, { book: '요한복음', chap: 6, verse: 35, label: '생명의 떡' }, { book: '히브리서', chap: 9, verse: 12, label: '새 언약 성막' }],
  시편: [{ book: '마태복음', chap: 27, verse: 46, label: '십자가 메시아 시편' }, { book: '히브리서', chap: 1, verse: 8, label: '영원한 보좌' }, { book: '요한복음', chap: 10, verse: 11, label: '선한 목자' }],
  이사야: [{ book: '마태복음', chap: 1, verse: 23, label: '임마누엘 성취' }, { book: '베드로전서', chap: 2, verse: 24, label: '고난받는 종' }, { book: '요한계시록', chap: 21, verse: 1, label: '새 하늘과 새 땅' }],
  요한복음: [{ book: '창세기', chap: 1, verse: 1, label: '태초 창조와 말씀' }, { book: '출애굽기', chap: 3, verse: 14, label: '스스로 있는 자' }, { book: '이사야', chap: 53, verse: 7, label: '하나님의 어린양' }],
  로마서: [{ book: '창세기', chap: 15, verse: 6, label: '믿음으로 의롭다 함' }, { book: '하박국', chap: 2, verse: 4, label: '의인은 믿음으로' }, { book: '시편', chap: 32, verse: 1, label: '사죄의 복' }]
};

const BOOK_KO_MAP = BIBLE_66_CANON.reduce((acc, b) => {
  acc[b.ko] = b; acc[b.en] = b; acc[b.abbr] = b;
  return acc;
}, {});

function buildSparklinePoints(seedIdx, chaps, readRatio, noteCount) {
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const x = (i / 13) * 100;
    const wave = Math.sin(i * 0.9 + seedIdx * 1.3) * 5 + Math.cos(i * 1.6 - seedIdx * 0.7) * 3.5;
    const boost = readRatio * 10 + Math.min(6, noteCount * 2) + Math.min(5, chaps / 18);
    const y = Math.max(3, Math.min(21, 17 - (i / 13) * boost * 0.65 + wave * 0.5));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

// =====================================================================
// 2. 상단 실시간 신구약 펄스 스파크라인
// =====================================================================
function TopPulseSparkline({ isPlaying }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animId, tick = 0;

    const draw = () => {
      if (isPlaying) tick += 0.045;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) { animId = requestAnimationFrame(draw); return; }
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height, midY = h / 2;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'; ctx.lineWidth = 1; ctx.stroke();

      const bars = Math.max(44, Math.floor(w / 4));
      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * w, norm = i / bars, env = Math.sin(norm * Math.PI);
        const spike = Math.sin(norm * 22 - tick) * 0.65 + Math.cos(norm * 47 + tick * 1.3) * 0.35;
        const amp = spike * env * (midY - 2);
        ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x, midY - amp);
        ctx.strokeStyle = norm > 0.48 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 1.5; ctx.stroke();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-7 block" />;
}

// =====================================================================
// 3. 중앙 60FPS 좌➔우 에너지 펄스 + 스파크 버스트 + 교차참조 아크 캔버스
// =====================================================================
function OrderBlockFlowCanvas({
  streams,
  sectorStats,
  activeSectorId,
  selectedBookKo,
  partnerBookSet,
  isPlaying,
  sparkTrigger,
  onSelectBook,
  onSelectSector
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hitPointsRef = useRef([]);
  const isScrubbingRef = useRef(false);
  const [scrubLabel, setScrubLabel] = useState(null);

  // 좌 ➔ 우 이동하는 에너지 펄스 패킷 & 스파크 파티클 배열
  const pulsesRef = useRef([]);
  const sparksRef = useRef([]);

  const seriesNoise = useMemo(() => {
    const STEPS = 40;
    return streams.map((_, idx) => {
      const arr = [0];
      let val = 0;
      for (let s = 1; s < STEPS; s++) {
        const r = Math.sin(idx * 12.9898 + s * 78.233) * 43758.5453;
        val = val * 0.82 + (r - Math.floor(r) - 0.5) * 2;
        arr.push(val);
      }
      arr.push(0);
      return arr;
    });
  }, [streams.length]);

  // 책 선택 시 즉시 스파크 버스트 발생!
  useEffect(() => {
    if (!sparkTrigger) return;
    const hit = hitPointsRef.current.find((pt) => pt.type === 'book' && pt.bookKo === selectedBookKo);
    if (hit) {
      for (let i = 0; i < 18; i++) {
        const ang = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
        const spd = 1.2 + Math.random() * 3.2;
        sparksRef.current.push({
          x: hit.spineX || hit.x + 12,
          y: hit.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1.0,
          color: i % 2 === 0 ? '#38BDF8' : '#FACC15',
          size: 1.8 + Math.random() * 1.8
        });
      }
    }
  }, [sparkTrigger, selectedBookKo]);

  useEffect(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    let animId, tick = 0;

    // 초기 좌➔우 에너지 펄스 패킷 생성
    if (pulsesRef.current.length === 0) {
      for (let i = 0; i < 14; i++) {
        pulsesRef.current.push({
          streamIdx: Math.floor(Math.random() * Math.max(1, streams.length)),
          t: Math.random(),
          speed: 0.0045 + Math.random() * 0.0055
        });
      }
    }

    const render = () => {
      if (isPlaying) tick += 0.012;
      const isMob = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMob ? 1.5 : 2);
      const rect = container.getBoundingClientRect();
      const w = rect.width, h = rect.height;

      if (w < 20 || h < 20) { animId = requestAnimationFrame(render); return; }
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04060A';
      ctx.fillRect(0, 0, w, h);

      // 차트 배경 그리드
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 40; gx < w; gx += 48) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (let gy = 28; gy < h; gy += 34) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();

      const isNarrow = w < 540;
      const leftPad = isNarrow ? 78 : 118;
      const spineX = isNarrow ? w * 0.74 : w * 0.77;
      const spineW = isNarrow ? 16 : 24;
      const padY = 18;
      const usableH = h - padY * 2;
      const splitY = padY + (27 / Math.max(1, streams.length)) * usableH;

      // 좌측 신약/구약 극성 폴
      ctx.fillStyle = '#10B981'; ctx.fillRect(8, padY, 2.5, Math.max(2, splitY - padY - 2));
      ctx.fillStyle = '#F43F5E'; ctx.fillRect(8, splitY + 2, 2.5, Math.max(2, h - padY - splitY - 2));
      ctx.beginPath(); ctx.moveTo(14, splitY); ctx.lineTo(w, splitY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)'; ctx.lineWidth = 1; ctx.stroke();

      const nextHits = [];

      // 좌측 8대 정경 섹터 티커
      (sectorStats || []).forEach((sec, sIdx) => {
        const sy = padY + ((sIdx + 0.5) / Math.max(1, sectorStats.length)) * usableH;
        const isAct = activeSectorId === sec.id;
        const secColor = isAct ? '#38BDF8' : sec.polarity === 'nt' ? '#10B981' : '#F43F5E';
        const bx = 16, bw = leftPad - 22, bh = isNarrow ? 18 : 20;

        ctx.fillStyle = isAct ? 'rgba(56, 189, 248, 0.18)' : 'rgba(9, 13, 22, 0.92)';
        ctx.fillRect(bx, sy - bh / 2, bw, bh);
        ctx.strokeStyle = isAct ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(bx, sy - bh / 2, bw, bh);
        ctx.fillStyle = secColor; ctx.fillRect(bx, sy - bh / 2, 2.5, bh);

        ctx.font = `bold ${isNarrow ? 8.5 : 9.5}px sans-serif`;
        ctx.fillStyle = '#E2E8F0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(sec.name.slice(0, isNarrow ? 4 : 6), bx + 6, sy);
        ctx.font = `bold ${isNarrow ? 8 : 9}px monospace`;
        ctx.fillStyle = secColor; ctx.textAlign = 'right';
        ctx.fillText(`${sec.pct}%`, bx + bw - 4, sy);

        nextHits.push({ type: 'sector', sectorId: sec.id, defaultBook: sec.defaultBook, x: bx, y: sy, w: bw, h: bh + 4 });
      });

      const flowW = Math.max(20, spineX - leftPad);
      const steps = 40;
      const bookYMap = {};
      const selectedIdx = streams.findIndex((s) => s.bookKo === selectedBookKo);

      const getStreamPoint = (idx, t) => {
        const baseY = padY + (idx / Math.max(1, streams.length - 1)) * usableH;
        const startY = splitY + (baseY - splitY) * 0.55;
        const noiseArr = seriesNoise[idx] || [];
        const sPos = Math.min(steps - 1, Math.floor(t * steps));
        const envelope = Math.sin(t * Math.PI);
        const liveDrift = Math.sin(tick * 1.4 + idx * 0.7 + t * 5) * 4.5 * envelope;
        const jitter = (noiseArr[sPos] || 0) * 11 * envelope;
        return {
          x: leftPad + t * flowW,
          y: Math.max(padY + 2, Math.min(h - padY - 2, startY + (baseY - startY) * t + jitter + liveDrift))
        };
      };

      // 66권 오로라 시계열 스트림
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      streams.forEach((st, idx) => {
        const baseY = padY + (idx / Math.max(1, streams.length - 1)) * usableH;
        bookYMap[st.bookKo] = baseY;

        const isSelected = selectedBookKo === st.bookKo;
        const isPartner = partnerBookSet.has(st.bookKo);
        const isSectorMatch = activeSectorId === 'ALL' || st.sectorId === activeSectorId;
        const strokeColor = isSelected ? '#38BDF8' : isPartner ? '#FACC15' : !st.isOT ? '#10B981' : '#F43F5E';
        const alpha = isSelected ? 0.96 : isPartner ? 0.65 : isSectorMatch ? (st.hasActivity ? 0.34 : 0.14) : 0.04;

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const pt = getStreamPoint(idx, s / steps);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = isSelected ? 1.9 : isPartner ? 1.25 : 0.75;
        ctx.stroke();

        // 우측 팬아웃 필라멘트
        if (isSelected || isPartner || (isSectorMatch && idx % 2 === 0)) {
          const rightEndY = padY + (((idx * 1.04) % streams.length) / streams.length) * usableH;
          const fanW = w - (spineX + spineW);
          ctx.beginPath();
          ctx.moveTo(spineX + spineW, baseY);
          ctx.bezierCurveTo(spineX + spineW + fanW * 0.45, baseY, spineX + spineW + fanW * 0.55, rightEndY, w, rightEndY);
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = isSelected ? 0.9 : isPartner ? 0.55 : 0.14;
          ctx.lineWidth = isSelected ? 1.6 : 0.75;
          ctx.stroke();
        }
      });

      // ★ 좌 ➔ 우 이동하는 에너지 펄스 & 기둥 충돌 시 스파크 버스트 이벤트!
      const maxPulses = isMob ? 10 : 14;
      for (let i = 0; i < Math.min(maxPulses, pulsesRef.current.length); i++) {
        const p = pulsesRef.current[i];
        if (isPlaying) p.t += p.speed;
        if (p.t >= 1) {
          // 기둥(Spine) 도달 시 스파크 튀는 이벤트 발생!
          const hitY = padY + (p.streamIdx / Math.max(1, streams.length - 1)) * usableH;
          const stObj = streams[p.streamIdx];
          const pCol = p.streamIdx === selectedIdx ? '#38BDF8' : stObj && !stObj.isOT ? '#34D399' : '#FB7185';
          const burstCount = p.streamIdx === selectedIdx ? 8 : 4;
          for (let b = 0; b < burstCount; b++) {
            const ang = (Math.random() - 0.5) * Math.PI * 1.4;
            const spd = 0.8 + Math.random() * 2.2;
            sparksRef.current.push({
              x: spineX + 2,
              y: hitY,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 1.0,
              color: pCol,
              size: 1.4 + Math.random() * 1.4
            });
          }
          p.t = 0;
          // 40% 확률로 현재 선택된 책 라인을 타고 흐르도록 집중
          p.streamIdx = Math.random() < 0.4 && selectedIdx >= 0 ? selectedIdx : Math.floor(Math.random() * Math.max(1, streams.length));
        }

        const pt = getStreamPoint(p.streamIdx, p.t);
        const tailPt = getStreamPoint(p.streamIdx, Math.max(0, p.t - 0.055));
        const stObj = streams[p.streamIdx];
        const col = p.streamIdx === selectedIdx ? '#38BDF8' : stObj && !stObj.isOT ? '#34D399' : '#FB7185';

        const grad = ctx.createLinearGradient(tailPt.x, tailPt.y, pt.x, pt.y);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, col);
        ctx.beginPath(); ctx.moveTo(tailPt.x, tailPt.y); ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = grad; ctx.globalAlpha = 0.95; ctx.lineWidth = p.streamIdx === selectedIdx ? 2.6 : 1.8; ctx.stroke();

        ctx.beginPath(); ctx.arc(pt.x, pt.y, p.streamIdx === selectedIdx ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.95; ctx.fill();
      }

      // ★ 스파크 파티클 업데이트 & 렌더링
      const nextSparks = [];
      for (let i = 0; i < sparksRef.current.length; i++) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.94;
        sp.vy *= 0.94;
        sp.life -= 0.038;
        if (sp.life > 0) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.globalAlpha = sp.life;
          ctx.fill();
          nextSparks.push(sp);
        }
      }
      sparksRef.current = nextSparks.slice(-90);

      // ★ 선택된 책 ⇄ 교차참조 파트너 황금 아크 연결선 (기둥 좌측에 표시)
      const selY = bookYMap[selectedBookKo];
      if (selY !== undefined) {
        partnerBookSet.forEach((pBook) => {
          const py = bookYMap[pBook];
          if (py === undefined || pBook === selectedBookKo) return;
          const midY = (selY + py) / 2;
          const arcBulge = Math.min(72, Math.max(22, Math.abs(py - selY) * 0.28));
          ctx.beginPath();
          ctx.moveTo(spineX, selY);
          ctx.quadraticCurveTo(spineX - arcBulge, midY, spineX, py);
          ctx.strokeStyle = '#FACC15';
          ctx.globalAlpha = 0.72;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
      }

      ctx.restore();

      // 슬림 글래스 수직 오더블록 기둥
      ctx.fillStyle = 'rgba(10, 15, 26, 0.86)';
      ctx.fillRect(spineX, padY, spineW, usableH);

      streams.forEach((st) => {
        const baseY = bookYMap[st.bookKo];
        const isSelected = selectedBookKo === st.bookKo;
        const isPartner = partnerBookSet.has(st.bookKo);
        const tickW = Math.max(3, (spineW - 4) * (0.2 + Math.min(0.8, st.chaps / 66 + st.readRatio * 0.4)));

        ctx.fillStyle = isSelected ? '#38BDF8' : isPartner ? '#FACC15' : !st.isOT ? '#10B981' : '#F43F5E';
        ctx.globalAlpha = isSelected ? 1 : isPartner ? 0.9 : 0.34;
        ctx.fillRect(spineX + 2, baseY - 0.8, isSelected ? spineW - 4 : tickW, isSelected ? 2.6 : 1.4);

        if (isSelected) {
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(leftPad, baseY - 0.5, w - leftPad, 1);
        }
        ctx.globalAlpha = 1;
        nextHits.push({ type: 'book', bookKo: st.bookKo, x: spineX - 14, spineX, y: baseY, w: spineW + 34, h: 12 });
      });

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
    const x = clientX - rect.left, y = clientY - rect.top;

    if (allowSector) {
      for (const pt of hitPointsRef.current) {
        if (pt.type === 'sector' && x >= pt.x && x <= pt.x + pt.w && Math.abs(y - pt.y) <= pt.h / 2) {
          onSelectSector?.(pt.sectorId, pt.defaultBook);
          return;
        }
      }
    }

    let best = null, minD = 28;
    for (const pt of hitPointsRef.current) {
      if (pt.type !== 'book') continue;
      const d = Math.abs(y - pt.y);
      if (d < minD) { minD = d; best = pt; }
    }
    if (best) {
      onSelectBook?.(best.bookKo);
      if (isScrubbingRef.current) setScrubLabel(best.bookKo);
    }
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
        onTouchEnd={() => { isScrubbingRef.current = false; setScrubLabel(null); }}
        className="w-full h-full block cursor-crosshair touch-none"
      />
      {scrubLabel && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sky-500 text-slate-950 font-sans font-black text-xs shadow-lg pointer-events-none">
          {scrubLabel} 탐색 중
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 4. 메인 BibleSecondBrain3D (실시간 TSK · 인터리니어 · 설교 강해 통합 허브)
// =====================================================================
export default function BibleSecondBrain3D({
  setActiveScreen,
  setCurrentChapId,
  setBibleViewMode,
  setTargetVerse
}) {
  const { dailyData = {}, readVerses = {}, bibleNotes = [], generalNotes = [] } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSectorId, setActiveSectorId] = useState('ALL');
  const [matrixFilter, setMatrixFilter] = useState('all');
  const [selectedBookKo, setSelectedBookKo] = useState('요한복음');
  const [selectedChap, setSelectedChap] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [sparkTrigger, setSparkTrigger] = useState(0);

  const [previewVersion, setPreviewVersion] = useState('krv4');
  const [krv4Db, setKrv4Db] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyDb, setEasyDb] = useState({});
  const [webDb, setWebDb] = useState({});
  const [rawSermons, setRawSermons] = useState(null);
  const [liveCrossRefs, setLiveCrossRefs] = useState([]);
  const [liveInterlinear, setLiveInterlinear] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileTab, setMobileTab] = useState('flow');

  useEffect(() => {
    ensureKrv4TxtLoaded().then((db) => { if (db) setKrv4Db(db); });
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebDb(d || {})).catch(() => {});
    fetch('/sermon_summary.json').then((r) => (r.ok ? r.json() : null)).then((d) => d && setRawSermons(d)).catch(() => {});
  }, []);

  // 실시간 TSK 교차참조 파싱 (선택된 책·장·절 기준)
  useEffect(() => {
    let alive = true;
    if (typeof getCrossReferences === 'function') {
      getCrossReferences(selectedBookKo, selectedChap, selectedVerse)
        .then((refs) => {
          if (!alive) return;
          if (Array.isArray(refs) && refs.length > 0) {
            const parsed = refs.slice(0, 6).map((r) => {
              const bMeta = BOOK_KO_MAP[r.targetBook];
              return bMeta ? { book: bMeta.ko, chap: Number(r.targetChapter) || 1, verse: Number(r.targetVerse) || 1, label: r.label || `${bMeta.ko} ${r.targetChapter}:${r.targetVerse}` } : null;
            }).filter(Boolean);
            setLiveCrossRefs(parsed);
          } else {
            setLiveCrossRefs(FALLBACK_CROSS_REFS[selectedBookKo] || []);
          }
        })
        .catch(() => { if (alive) setLiveCrossRefs(FALLBACK_CROSS_REFS[selectedBookKo] || []); });
    }
    return () => { alive = false; };
  }, [selectedBookKo, selectedChap, selectedVerse]);

  // 실시간 Supabase 원어 인터리니어 단어 분해 파싱
  useEffect(() => {
    let alive = true;
    if (!supabase) return;
    supabase
      .from('interlinear_bible')
      .select('word_order, original_word, pronunciation, korean_trans, strongs_id, grammar')
      .eq('book', selectedBookKo)
      .eq('chapter', Number(selectedChap) || 1)
      .eq('verse', Number(selectedVerse) || 1)
      .order('word_order', { ascending: true })
      .limit(10)
      .then(({ data }) => { if (alive) setLiveInterlinear(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setLiveInterlinear([]); });
    return () => { alive = false; };
  }, [selectedBookKo, selectedChap, selectedVerse]);

  // 66권 실시간 텔레메트리 스트림 (실제 통독 + QT + 설교 + 노트 반영)
  const { streams, sectorStats, ntActiveCount, otActiveCount, totalReadChaps } = useMemo(() => {
    const readChapSet = new Set();
    Object.keys(readVerses || {}).forEach((k) => { if (readVerses[k]) { const [bk, ch] = k.split('-'); readChapSet.add(`${bk}-${ch}`); } });

    const noteCountByBook = {};
    Object.values(dailyData || {}).forEach((d) => {
      if (!d) return;
      const refText = `${d.qtReference || ''} ${d.qtTitle || ''} ${d.sermonReference || ''} ${d.sermonTitle || ''}`;
      BIBLE_66_CANON.forEach((b) => { if (refText.includes(b.ko)) noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1; });
    });
    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      BIBLE_66_CANON.forEach((b) => { if (refStr.includes(b.ko)) noteCountByBook[b.ko] = (noteCountByBook[b.ko] || 0) + 1; });
    });

    const orderedCanon = [...BIBLE_66_CANON.filter((b) => !b.isOT), ...BIBLE_66_CANON.filter((b) => b.isOT)];
    const secMap = {};
    CANON_SECTOR_GROUPS.forEach((g) => { secMap[g.id] = { ...g, totalChaps: 0, readChaps: 0, noteCount: 0, bookCount: 0 }; });

    let ntAct = 0, otAct = 0;
    const list = orderedCanon.map((b, idx) => {
      const sectorId = SECTOR_NAME_TO_ID[b.sector] || (b.isOT ? 'law' : 'gospels');
      let readCount = 0;
      for (let c = 1; c <= b.chaps; c++) if (readChapSet.has(`${b.en}-${c}`) || readChapSet.has(`${b.ko}-${c}`)) readCount++;
      const noteCount = noteCountByBook[b.ko] || 0;
      const readRatio = readCount / Math.max(1, b.chaps);
      const hasActivity = readCount > 0 || noteCount > 0;
      if (!b.isOT && hasActivity) ntAct++;
      if (b.isOT && hasActivity) otAct++;

      if (secMap[sectorId]) {
        secMap[sectorId].totalChaps += b.chaps; secMap[sectorId].readChaps += readCount;
        secMap[sectorId].noteCount += noteCount; secMap[sectorId].bookCount += 1;
      }

      return {
        idx, bookKo: b.ko, bookEn: b.en, abbr: b.abbr, chaps: b.chaps, isOT: b.isOT, sector: b.sector, sectorId,
        readCount, readRatio, pct: Math.round(readRatio * 100), noteCount,
        sparkPoints: buildSparklinePoints(idx, b.chaps, readRatio, noteCount), hasActivity
      };
    });

    const sectorStatsArr = CANON_SECTOR_GROUPS.map((g) => {
      const st = secMap[g.id];
      return { ...st, pct: st.totalChaps > 0 ? ((st.readChaps / st.totalChaps) * 100).toFixed(1) : '0.0' };
    });

    return { streams: list, sectorStats: sectorStatsArr, ntActiveCount: ntAct, otActiveCount: otAct, totalReadChaps: readChapSet.size };
  }, [dailyData, readVerses, bibleNotes]);

  const activePartners = useMemo(() => {
    if (liveCrossRefs.length > 0) return liveCrossRefs;
    return FALLBACK_CROSS_REFS[selectedBookKo] || [{ book: '요한복음', chap: 1, verse: 1, label: '태초의 로고스' }, { book: '창세기', chap: 1, verse: 1, label: '천지창조' }];
  }, [liveCrossRefs, selectedBookKo]);

  const partnerBookSet = useMemo(() => new Set(activePartners.map((p) => p.book)), [activePartners]);

  // 현재 선택된 성경의 본문 + 설교 강해 + 개인 기록 통합 파싱
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
      return { v: vNum, krv4: pureText || decoded, easy: easyDb[`${meta.ko}-${chapNum}-${vNum}`] || '', web: webDb[`${meta.ko}-${chapNum}-${vNum}`] || webDb[`${meta.en}-${chapNum}-${vNum}`] || '' };
    });

    const linked = [];
    // 1) 개인 QT & 설교 노트
    Object.entries(dailyData || {}).forEach(([dateKey, d]) => {
      if (!d) return;
      if (`${d.qtReference || ''} ${d.qtTitle || ''}`.includes(meta.ko)) linked.push({ id: `qt_${dateKey}`, tag: 'QT', title: d.qtTitle || d.qtReference, date: dateKey, screen: 'qt' });
      if (`${d.sermonReference || ''} ${d.sermonTitle || ''}`.includes(meta.ko)) linked.push({ id: `serm_${dateKey}`, tag: '설교', title: d.sermonTitle || d.sermonReference, date: dateKey, screen: 'sermon' });
    });
    // 2) 교회 강해 요약 DB 파싱
    const sermonList = Array.isArray(rawSermons) ? rawSermons : Array.isArray(rawSermons?.sermons) ? rawSermons.sermons : [];
    sermonList.forEach((s, i) => {
      if (linked.length >= 8) return;
      const txt = `${s.verse || ''} ${s.reference || ''} ${s.title || ''}`;
      if (txt.includes(meta.ko)) linked.push({ id: `db_s_${i}`, tag: '강해', title: s.title || s.summary?.slice(0, 24) || `${meta.ko} 강해`, date: s.date || '', screen: 'sermon' });
    });
    // 3) 묵상카드 & 자유노트
    (bibleNotes || []).forEach((bn) => {
      const refStr = bn?.verses?.[0]?.ref || '';
      if (refStr.includes(meta.ko)) linked.push({ id: `bn_${bn.id}`, tag: '노트', title: `${refStr} · ${(bn.note || '').slice(0, 20)}`, date: bn.date || '', screen: 'diary' });
    });
    (generalNotes || []).forEach((gn) => {
      if (`${gn.title || ''} ${gn.content || ''}`.includes(meta.ko)) linked.push({ id: `gn_${gn.id}`, tag: '자유', title: gn.title || '자유 노트', date: gn.updatedAt || '', screen: 'generalNote' });
    });

    return { meta, chapNum, sectorObj, lexicon, verses, linked: linked.slice(0, 8) };
  }, [selectedBookKo, selectedChap, selectedVerse, krv4Db, easyDb, webDb, dailyData, bibleNotes, generalNotes, rawSermons]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim(); if (!q) return [];
    const lowerQ = q.toLowerCase(), hits = [];
    extractAllBibleRefsFromText(q).forEach((r) => {
      hits.push({ id: `ref_${r.bookKo}_${r.chapter}_${r.verse}`, badge: '구절', color: '#38BDF8', title: `${r.bookKo} ${r.chapter}:${r.verse}`, onSelect: () => { setSelectedBookKo(r.bookKo); setSelectedChap(r.chapter || 1); setSelectedVerse(r.verse || 1); setSparkTrigger((t) => t + 1); } });
    });
    BIBLE_66_CANON.forEach((b) => {
      if (b.ko.includes(q) || b.en.toLowerCase().includes(lowerQ)) {
        hits.push({ id: `bk_${b.ko}`, badge: b.isOT ? '구약' : '신약', color: b.isOT ? '#F43F5E' : '#10B981', title: `${b.ko} (${b.en}) · ${b.chaps}장`, onSelect: () => { setSelectedBookKo(b.ko); setSelectedChap(1); setSelectedVerse(1); setSparkTrigger((t) => t + 1); } });
      }
    });
    return hits.slice(0, 10);
  }, [searchQuery]);

  const visibleMatrixStreams = useMemo(() => {
    let list = activeSectorId === 'ALL' ? streams : streams.filter((s) => s.sectorId === activeSectorId);
    if (matrixFilter === 'nt') list = list.filter((s) => !s.isOT);
    else if (matrixFilter === 'ot') list = list.filter((s) => s.isOT);
    else if (matrixFilter === 'active') list = list.filter((s) => s.hasActivity);
    return list;
  }, [streams, activeSectorId, matrixFilter]);

  const handleSelectBook = useCallback((bookKo, chap = 1, verse = 1) => {
    setSelectedBookKo(bookKo); setSelectedChap(chap); setSelectedVerse(verse);
    setSparkTrigger((t) => t + 1);
  }, []);

  const handleJumpToBible = () => {
    if (typeof setCurrentChapId === 'function') setCurrentChapId(`${activeBookDetail.meta.en}-${activeBookDetail.chapNum}`);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(selectedVerse || 1);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  const handleJumpToInterlinear = () => {
    try { localStorage.setItem('interlinear_jump', JSON.stringify({ book: activeBookDetail.meta.ko, chapter: activeBookDetail.chapNum, verse: selectedVerse || 1 })); } catch (_) {}
    if (typeof setActiveScreen === 'function') setActiveScreen('interlinear');
  };

  return (
    <div style={{ height: '100dvh', colorScheme: 'dark' }} className="flex-1 w-full bg-[#04060A] text-slate-100 flex flex-col overflow-hidden select-none font-mono relative">
      {/* 1. 상단 텔레메트리 헤더 */}
      <header className="shrink-0 bg-[#080B12] border-b border-white/10 px-2.5 sm:px-4 pt-2 pb-1.5 z-30 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 max-w-md min-w-0">
            <button type="button" onClick={() => setActiveScreen && setActiveScreen('galaxy')} className="h-8 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer shrink-0">
              <ChevronLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">GALAXY</span>
            </button>
            <div className="relative flex-1 min-w-0">
              <div className="h-8 px-2.5 rounded-lg bg-[#04060A] border border-white/15 focus-within:border-sky-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(Boolean(e.target.value.trim())); }} onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)} placeholder="66권 · 구절(요 3:16)..." className="w-full bg-transparent text-[12px] font-sans text-white placeholder:text-slate-500 outline-none select-text" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }} className="cursor-pointer text-slate-400"><X className="w-3.5 h-3.5" /></button>}
              </div>
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0A0E17] border border-sky-500/40 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-white/10 font-sans">
                  {searchResults.map((hit) => (
                    <button key={hit.id} type="button" onClick={() => { hit.onSelect(); setShowSearchDropdown(false); }} className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-[12px] font-bold text-white truncate">{hit.title}</span>
                      <span style={{ color: hit.color }} className="text-[10px] font-mono font-bold shrink-0">{hit.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center flex-1 max-w-md px-2"><TopPulseSparkline isPlaying={isPlaying} /></div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#04060A] border border-white/10 text-[10.5px]">
              <span className="text-emerald-400 font-black">NT {ntActiveCount}</span>
              <span className="text-rose-400 font-black">OT {otActiveCount}</span>
              <span className="hidden sm:inline text-sky-400 font-black">READ {totalReadChaps}</span>
            </div>
            <button type="button" onClick={() => setIsPlaying((p) => !p)} className={`h-8 px-2 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer ${isPlaying ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-white/15 bg-white/5 text-slate-400'}`}>
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}<span className="hidden sm:inline">{isPlaying ? 'LIVE' : 'PAUSE'}</span>
            </button>
          </div>
        </div>
        <div className="lg:hidden"><TopPulseSparkline isPlaying={isPlaying} /></div>
      </header>

      {/* 2. 메인 바디 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <section className={`flex-1 flex flex-col min-w-0 min-h-0 relative ${mobileTab === 'flow' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 min-h-0 relative">
            <OrderBlockFlowCanvas
              streams={streams}
              sectorStats={sectorStats}
              activeSectorId={activeSectorId}
              selectedBookKo={selectedBookKo}
              partnerBookSet={partnerBookSet}
              isPlaying={isPlaying}
              sparkTrigger={sparkTrigger}
              onSelectBook={(bk) => handleSelectBook(bk, 1, 1)}
              onSelectSector={(secId, defBook) => { setActiveSectorId((prev) => (prev === secId ? 'ALL' : secId)); handleSelectBook(defBook, 1, 1); }}
            />

            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
              {activeSectorId !== 'ALL' && (
                <button type="button" onClick={() => setActiveSectorId('ALL')} className="px-2 py-1 rounded-md bg-sky-500/20 border border-sky-400/50 text-sky-300 text-[10px] font-bold cursor-pointer">전체 ✕</button>
              )}
              <div className="px-2.5 py-1 rounded-md bg-[#080B12]/90 border border-white/15 backdrop-blur-md flex items-center gap-1.5 text-[10.5px]">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="font-sans font-bold text-white">{activeBookDetail.meta.ko} {activeBookDetail.chapNum}:{selectedVerse}</span>
              </div>
            </div>
          </div>

          {/* 모바일 플로우 하단 컴팩트 프리뷰 */}
          <div className="lg:hidden shrink-0 bg-[#080B12] border-t border-white/10 px-3 py-2 font-sans space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-bold text-white truncate">{activeBookDetail.meta.ko} {activeBookDetail.chapNum}:{selectedVerse} · 교차참조 {activePartners.length}건</span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setMobileTab('inspector')} className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-[10.5px] font-bold cursor-pointer">상세보기</button>
                <button type="button" onClick={handleJumpToBible} className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10.5px] font-bold cursor-pointer">본문</button>
              </div>
            </div>
            <p className="text-[11.5px] text-slate-300 line-clamp-1">{activeBookDetail.verses[0]?.krv4 || '기둥을 위아래로 드래그해 66권을 탐색하세요.'}</p>
          </div>

          {/* PC 하단 4대 역본 · 실시간 원어 · 실시간 TSK 교차참조 · 연결 강해/노트 독 */}
          <div className="hidden lg:block shrink-0 bg-[#080B12] border-t border-white/10 p-3 font-sans">
            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-7 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-white">{activeBookDetail.meta.ko} {activeBookDetail.chapNum}:{selectedVerse}</span>
                    <button type="button" onClick={() => setSelectedChap((c) => Math.max(1, c - 1))} className="p-0.5 rounded bg-white/5 hover:bg-white/15 cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => setSelectedChap((c) => Math.min(activeBookDetail.meta.chaps, c + 1))} className="p-0.5 rounded bg-white/5 hover:bg-white/15 cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px] font-bold">
                    {[{ id: 'krv4', label: '개역개정4판' }, { id: 'easy', label: '쉬운성경' }, { id: 'web', label: 'WEB영어' }, { id: 'orig', label: `원어 (${liveInterlinear.length})` }].map((ver) => (
                      <button key={ver.id} type="button" onClick={() => setPreviewVersion(ver.id)} className={`px-2 py-0.5 rounded cursor-pointer ${previewVersion === ver.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{ver.label}</button>
                    ))}
                  </div>
                </div>

                {previewVersion === 'orig' ? (
                  <div className="p-2.5 rounded-lg bg-[#04060A] border border-white/10 text-[12px]">
                    {liveInterlinear.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {liveInterlinear.map((w, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-[11px]">
                            <b className="text-amber-300 mr-1">{w.original_word}</b>
                            <span className="text-slate-300">{w.korean_trans}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{activeBookDetail.lexicon.word} <span className="text-amber-400">[{activeBookDetail.lexicon.pron}]</span> · {activeBookDetail.lexicon.strongs}</div>
                        <p className="text-slate-400">{activeBookDetail.lexicon.mean}</p>
                      </div>
                    )}
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

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-amber-400 flex items-center gap-1"><Link2 className="w-3 h-3" /> 실시간 TSK:</span>
                  {activePartners.slice(0, 4).map((p, idx) => (
                    <button key={`${p.book}_${p.chap}_${idx}`} type="button" onClick={() => handleSelectBook(p.book, p.chap, p.verse || 1)} className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/30 text-[10.5px] font-bold text-amber-200 cursor-pointer">
                      {p.book} {p.chap}:{p.verse || 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">연결된 강해 · QT · 노트 ({activeBookDetail.linked.length})</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={handleJumpToBible} className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"><BookOpen className="w-3 h-3" /> 본문</button>
                    <button type="button" onClick={handleJumpToInterlinear} className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"><Sparkles className="w-3 h-3" /> 원어</button>
                  </div>
                </div>
                {activeBookDetail.linked.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-[#04060A] border border-white/10 text-[11.5px] text-slate-500 flex items-center justify-between">
                    <span>연결된 기록이 없습니다.</span>
                    <button type="button" onClick={() => setActiveScreen && setActiveScreen('qt')} className="text-sky-400 font-bold cursor-pointer">QT 작성</button>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[82px] overflow-y-auto hide-scrollbar">
                    {activeBookDetail.linked.map((rec) => (
                      <button key={rec.id} type="button" onClick={() => setActiveScreen && setActiveScreen(rec.screen)} className="w-full px-2.5 py-1.5 rounded-lg bg-[#04060A] border border-white/10 hover:border-sky-400 flex items-center justify-between gap-2 text-[11px] cursor-pointer">
                        <span className="truncate"><b className="text-sky-400 mr-1.5">[{rec.tag}]</b>{rec.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 우측 66권 카드 매트릭스 */}
        <aside className={`w-full lg:w-[360px] xl:w-[420px] bg-[#080B12] border-t lg:border-t-0 lg:border-l border-white/10 p-2.5 flex-col overflow-hidden shrink-0 ${mobileTab === 'matrix' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 shrink-0">
            <span className="text-[10.5px] font-bold text-slate-300">CANON MATRIX ({visibleMatrixStreams.length})</span>
            <div className="flex items-center gap-1 font-sans text-[10px] font-bold">
              {[{ id: 'all', label: '전체' }, { id: 'nt', label: '신약' }, { id: 'ot', label: '구약' }, { id: 'active', label: '활동' }].map((f) => (
                <button key={f.id} type="button" onClick={() => setMatrixFilter(f.id)} className={`px-1.5 py-0.5 rounded cursor-pointer ${matrixFilter === f.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 content-start pb-4">
            {visibleMatrixStreams.map((st) => {
              const isSel = selectedBookKo === st.bookKo, isPartner = partnerBookSet.has(st.bookKo);
              const accentHex = isSel ? '#38BDF8' : isPartner ? '#FACC15' : !st.isOT ? '#10B981' : '#F43F5E';
              return (
                <button
                  key={st.bookKo}
                  type="button"
                  onClick={() => { handleSelectBook(st.bookKo, 1, 1); if (mobileTab === 'matrix') setMobileTab('inspector'); }}
                  style={{ borderLeftColor: accentHex }}
                  className={`p-2 rounded-lg border border-l-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${isSel ? 'bg-sky-500/20 border-sky-400' : isPartner ? 'bg-amber-500/15 border-amber-400/60' : !st.isOT ? 'bg-emerald-950/25 border-emerald-500/20' : 'bg-rose-950/25 border-rose-500/20'}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11.5px] font-sans font-bold text-white truncate">{st.bookKo}</span>
                    <span style={{ color: accentHex }} className="text-[9.5px] font-black shrink-0">{st.pct}%</span>
                  </div>
                  <svg viewBox="0 0 100 24" className="w-full h-4 overflow-visible">
                    <polyline fill="none" stroke={accentHex} strokeWidth={isSel ? '2' : '1.35'} strokeOpacity={isSel || st.hasActivity ? '0.95' : '0.45'} points={st.sparkPoints} />
                  </svg>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{st.readCount}/{st.chaps}장</span>
                    <span className={st.noteCount > 0 ? 'text-sky-300 font-bold' : 'text-slate-500'}>{st.noteCount > 0 ? `N:${st.noteCount}` : st.abbr}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 모바일 전용 상세 인스펙터 탭 */}
        {mobileTab === 'inspector' && (
          <section className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3 font-sans hide-scrollbar">
            <div className="p-3.5 rounded-xl bg-[#080B12] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-white">{activeBookDetail.meta.ko} {activeBookDetail.chapNum}:{selectedVerse}</h2>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setSelectedChap((c) => Math.max(1, c - 1))} className="p-1.5 rounded-lg bg-white/5 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setSelectedChap((c) => Math.min(activeBookDetail.meta.chaps, c + 1))} className="p-1.5 rounded-lg bg-white/5 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                {[{ id: 'krv4', label: '개역4판' }, { id: 'easy', label: '쉬운성경' }, { id: 'web', label: 'WEB영어' }, { id: 'orig', label: '원어' }].map((ver) => (
                  <button key={ver.id} type="button" onClick={() => setPreviewVersion(ver.id)} className={`py-1.5 rounded-lg cursor-pointer ${previewVersion === ver.id ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'}`}>{ver.label}</button>
                ))}
              </div>
              {previewVersion === 'orig' ? (
                <div className="p-3 rounded-lg bg-[#04060A] border border-white/10 space-y-1.5">
                  {liveInterlinear.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {liveInterlinear.map((w, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-[11.5px]">
                          <b className="text-amber-300 mr-1">{w.original_word}</b><span className="text-slate-200">{w.korean_trans}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[12.5px] text-slate-300"><b>{activeBookDetail.lexicon.word}</b> [{activeBookDetail.lexicon.pron}] — {activeBookDetail.lexicon.mean}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-lg bg-[#04060A] border border-white/10 text-[13px] leading-relaxed">
                  {activeBookDetail.verses.map((v) => (
                    <p key={v.v} className="text-slate-200"><b className="text-sky-400 font-mono mr-1.5">{v.v}</b>{previewVersion === 'easy' ? v.easy || v.krv4 : previewVersion === 'web' ? v.web || v.krv4 : v.krv4}</p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activePartners.map((p, idx) => (
                  <button key={`${p.book}_${p.chap}_${idx}`} type="button" onClick={() => handleSelectBook(p.book, p.chap, p.verse || 1)} className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[11px] font-bold text-amber-200 cursor-pointer">
                    {p.book} {p.chap}:{p.verse || 1}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={handleJumpToBible} className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer"><BookOpen className="w-4 h-4" /> 성경 본문</button>
                <button type="button" onClick={handleJumpToInterlinear} className="py-2.5 rounded-xl bg-amber-600 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> 원어 분해</button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080B12] border border-white/10 space-y-2">
              <span className="text-[12.5px] font-bold text-slate-300 block">연결된 강해 · QT · 노트 ({activeBookDetail.linked.length})</span>
              {activeBookDetail.linked.length === 0 ? (
                <p className="text-[12px] text-slate-500 py-2">이 성경에 연결된 기록이 아직 없습니다.</p>
              ) : (
                activeBookDetail.linked.map((rec) => (
                  <button key={rec.id} type="button" onClick={() => setActiveScreen && setActiveScreen(rec.screen)} className="w-full p-2.5 rounded-lg bg-[#04060A] border border-white/10 flex items-center justify-between text-[12px] cursor-pointer">
                    <span className="truncate"><b className="text-sky-400 mr-1.5">[{rec.tag}]</b>{rec.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* 3. 모바일 하단 3단 전환 바 */}
      <nav className="lg:hidden shrink-0 bg-[#080B12] border-t border-white/10 px-3 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1.5 z-30 font-sans">
        {[{ id: 'flow', label: '라이브 플로우', icon: Activity }, { id: 'matrix', label: '66권 매트릭스', icon: Grid }, { id: 'inspector', label: '4대역본·기록', icon: FileText }].map((tab) => {
          const TabIcon = tab.icon;
          const active = mobileTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setMobileTab(tab.id)} className={`py-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${active ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400'}`}>
              <TabIcon className="w-3.5 h-3.5" /><span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
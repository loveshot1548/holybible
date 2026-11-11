// src/pages/BibleSecondBrain3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import bibleData from '../ko_ko.json';

// =====================================================================
// KRONOS SECOND BRAIN — 5대 아키텍처 클러스터 정의
// =====================================================================
const TOP_FRACTAL_MATRICES = [
  {
    id: 'matrix_hebrew',
    type: 'fractal_grid',
    label: '47 OS (BHS Hebrew)',
    sub: '구약 39권 원어·자모 매트릭스',
    color: '#6366F1',
    accent: '#38BDF8',
    nx: -0.25, ny: -0.34, nz: -30,
    bookRef: '창세기', chapRef: 1,
    desc: '구약 39권(929장) 히브리어 원문 형태소와 아람어 구문론이 직교 프랙탈 회로로 연산되는 제1 메인프레임입니다.'
  },
  {
    id: 'matrix_greek',
    type: 'fractal_grid',
    label: 'Pulse Mainframe (NA28)',
    sub: '신약 27권 헬라어 로고스 회로',
    color: '#818CF8',
    accent: '#60A5FA',
    nx: -0.07, ny: -0.34, nz: -15,
    bookRef: '요한복음', chapRef: 1,
    desc: '신약 27권(260장) 헬라어 원문과 스트롱 사전 네트워크가 실시간 결합되는 제2 메인프레임입니다.'
  }
];

const TOP_MANDALA_ENGINES = [
  {
    id: 'mandala_lxx',
    type: 'mandala_ring',
    label: 'LXX Septuagint Co.',
    sub: '70인역 신구약 직접 인용망',
    color: '#2DD4BF',
    nx: 0.11, ny: -0.33, nz: 10,
    radius: 36,
    bookRef: '이사야', chapRef: 53,
    desc: '구약 히브리어 성경이 헬라어 70인역(LXX)을 거쳐 신약 복음서와 서신서에 직접 인용된 정경 회로입니다.'
  },
  {
    id: 'mandala_prophecy',
    type: 'mandala_ring',
    label: 'Messianic Prophecy',
    sub: '메시아 예언·성취 시냅스',
    color: '#34D399',
    nx: 0.26, ny: -0.32, nz: 25,
    radius: 40,
    bookRef: '미가', chapRef: 5,
    desc: '구약의 메시아 예언과 모형(Typology)이 예수 그리스도의 십자가와 부활에서 성취된 연결망입니다.'
  },
  {
    id: 'mandala_tsk',
    type: 'mandala_ring',
    label: 'OpenBible — 344K Neural',
    sub: '34만 교차참조 빅데이터 클러스터',
    color: '#10B981',
    nx: 0.39, ny: -0.22, nz: 40,
    radius: 44,
    bookRef: '시편', chapRef: 22,
    desc: '성경 전체 31,102절 사이에 얽혀 있는 344,799개의 상호교차참조(TSK) 시냅스 클러스터입니다.'
  },
  {
    id: 'mandala_covenant',
    type: 'mandala_ring',
    label: 'Conscious Covenant Skin',
    sub: '아담·아브라함·다윗·새언약',
    color: '#2DD4BF',
    nx: 0.36, ny: -0.03, nz: 20,
    radius: 38,
    bookRef: '히브리서', chapRef: 8,
    desc: '창세기 원시복음부터 요한계시록 새 예루살렘까지 관통하는 언약 신학(Covenant Theology) 엔진입니다.'
  }
];

const LEFT_GOLD_CLUSTERS = [
  {
    id: 'gold_radar',
    type: 'radar_scanner',
    label: 'Personal OS — Private Workspace',
    sub: '실시간 영적 5종 루틴 & 묵상 스캐너',
    color: '#A3E635',
    nx: -0.23, ny: -0.06, nz: 50,
    radius: 42,
    bookRef: '시편', chapRef: 119,
    desc: '매일의 QT, 기도, 감사, 성경통독 루틴을 360도 레이더로 스캔하여 영적 호흡을 유지하는 개인 워크스페이스입니다.'
  },
  {
    id: 'gold_qt_sphere',
    type: 'gold_sphere',
    label: 'QT Meditation + Taxon',
    sub: '나의 묵상·간증·적용 입자 구체',
    color: '#FACC15',
    nx: -0.39, ny: -0.05, nz: 70,
    radius: 48,
    bookRef: '로마서', chapRef: 8,
    desc: '직접 기록한 QT 묵상과 삶의 적용 결단들이 황금빛 시냅스 입자로 응집된 기억 저장소입니다.'
  },
  {
    id: 'gold_sermon_sphere',
    type: 'gold_sphere',
    label: 'Sermon Exegesis Operations',
    sub: '주일·수요·새벽 강해설교 아카이브',
    color: '#F59E0B',
    nx: -0.42, ny: 0.15, nz: 35,
    radius: 45,
    bookRef: '마태복음', chapRef: 5,
    desc: '선포된 강해 설교 노트와 성경 각 권의 주해 데이터가 연결되어 삶과 말씀을 동기화하는 오퍼레이션 구체입니다.'
  },
  {
    id: 'gold_read_sphere',
    type: 'gold_sphere',
    label: '365 Canon Companion App',
    sub: '1,189장 성경 통독 성취 성단',
    color: '#EAB308',
    nx: -0.43, ny: 0.32, nz: 10,
    radius: 34,
    bookRef: '사도행전', chapRef: 2,
    desc: '성경 66권 1,189장 중 내가 읽고 체크한 장들이 별자리처럼 점등되는 통독 동반자 클러스터입니다.'
  }
];

const BOTTOM_MAGENTA_GAUGES = [
  { id: 'gauge_law', label: 'Pentateuch (모세오경)', sector: '모세오경', nx: -0.33, ny: 0.39, color: '#EC4899', bookRef: '창세기' },
  { id: 'gauge_hist', label: 'OT History (역사서)', sector: '구약역사서', nx: -0.21, ny: 0.39, color: '#F43F5E', bookRef: '사무엘하' },
  { id: 'gauge_poet', label: 'Wisdom (시가서)', sector: '시가서', nx: -0.09, ny: 0.39, color: '#D946EF', bookRef: '시편' },
  { id: 'gauge_prop', label: 'Prophets (선지서)', sector: '선지서', nx: 0.03, ny: 0.39, color: '#EC4899', bookRef: '이사야' },
  { id: 'gauge_gosp', label: 'Gospels (복음·행전)', sector: '복음서·행전', nx: 0.15, ny: 0.39, color: '#F43F5E', bookRef: '요한복음' },
  { id: 'gauge_epist', label: 'Epistles (서신·계시록)', sector: '바울서신', nx: 0.27, ny: 0.39, color: '#E879F9', bookRef: '요한계시록' }
];

const RELAY_HUBS = [
  { id: 'hub_personal', label: 'Personal', sub: '개인 영성 허브', nx: -0.17, ny: -0.19, color: '#FACC15', bookRef: '신명기', chapRef: 6 },
  { id: 'hub_ai_logos', label: 'Logos Solutions', sub: '원어 주해 브릿지', nx: -0.05, ny: -0.20, color: '#818CF8', bookRef: '히브리서', chapRef: 4 },
  { id: 'hub_ecclesia', label: 'Ecclesia', sub: '공동체 말씀망', nx: 0.16, ny: -0.18, color: '#2DD4BF', bookRef: '에베소서', chapRef: 2 },
  { id: 'hub_term4', label: 'Pulse Terminal 4', sub: '묵상 신호 중계기', nx: -0.16, ny: -0.09, color: '#FDE047', isDot: true, bookRef: '시편', chapRef: 23 },
  { id: 'hub_covenant', label: 'Covenant LLC', sub: '구속사 언약 센터', nx: 0.03, ny: -0.05, color: '#FBBF24', bookRef: '출애굽기', chapRef: 19 },
  { id: 'hub_operations', label: 'Operations', sub: '삶의 적용 실천', nx: -0.25, ny: 0.16, color: '#FB923C', bookRef: '야고보서', chapRef: 1 },
  { id: 'hub_internal', label: 'Internal', sub: '내면 성찰 게이트', nx: 0.07, ny: 0.14, color: '#FACC15', bookRef: '요한복음', chapRef: 15 },
  { id: 'hub_saas', label: 'Canon Core', sub: '정경 66권 분배기', nx: -0.03, ny: 0.22, color: '#F472B6', bookRef: '로마서', chapRef: 12 },
  { id: 'hub_outreach', label: 'Outreach', sub: '선교·나눔 채널', nx: 0.15, ny: 0.11, color: '#FBBF24', bookRef: '마태복음', chapRef: 28 },
  { id: 'hub_wave1', label: 'Content Studio', sub: 'QT 파동 생성기', nx: 0.33, ny: 0.14, color: '#FACC15', isWave: true, bookRef: '시편', chapRef: 1 },
  { id: 'hub_wave2', label: 'Homiletic & Note', sub: '설교 파동 분석기', nx: 0.33, ny: 0.25, color: '#F59E0B', isWave: true, bookRef: '디모데후서', chapRef: 3 },
  { id: 'hub_terminal', label: 'Pulse Terminal 5', sub: '종말론적 완성 노드', nx: 0.41, ny: 0.37, color: '#FDE047', isDot: true, bookRef: '요한계시록', chapRef: 22 }
];

const SYNAPSE_PATHWAYS = [
  ['kronos_core', 'hub_covenant', '#C084FC'],
  ['kronos_core', 'hub_term4', '#A855F7'],
  ['kronos_core', 'hub_operations', '#F59E0B'],
  ['kronos_core', 'hub_internal', '#FACC15'],
  ['kronos_core', 'hub_saas', '#EC4899'],
  ['hub_term4', 'gold_radar', '#A3E635'],
  ['hub_term4', 'hub_personal', '#FACC15'],
  ['hub_covenant', 'hub_personal', '#E2E8F0'],
  ['hub_covenant', 'hub_ai_logos', '#818CF8'],
  ['hub_covenant', 'hub_ecclesia', '#2DD4BF'],
  ['hub_covenant', 'hub_internal', '#FBBF24'],
  ['hub_personal', 'matrix_hebrew', '#6366F1'],
  ['hub_ai_logos', 'matrix_hebrew', '#6366F1'],
  ['hub_ai_logos', 'matrix_greek', '#818CF8'],
  ['hub_ecclesia', 'mandala_lxx', '#2DD4BF'],
  ['hub_ecclesia', 'mandala_prophecy', '#34D399'],
  ['hub_ecclesia', 'mandala_tsk', '#10B981'],
  ['hub_ecclesia', 'mandala_covenant', '#2DD4BF'],
  ['hub_personal', 'gold_qt_sphere', '#FACC15'],
  ['hub_operations', 'gold_qt_sphere', '#FACC15'],
  ['hub_operations', 'gold_sermon_sphere', '#F59E0B'],
  ['hub_operations', 'gold_read_sphere', '#EAB308'],
  ['hub_internal', 'hub_outreach', '#FBBF24'],
  ['hub_outreach', 'hub_wave1', '#FACC15'],
  ['hub_outreach', 'hub_wave2', '#F59E0B'],
  ['hub_saas', 'hub_terminal', '#FDE047'],
  ['hub_saas', 'gauge_law', '#EC4899'],
  ['hub_saas', 'gauge_hist', '#F43F5E'],
  ['hub_saas', 'gauge_poet', '#D946EF'],
  ['hub_saas', 'gauge_prop', '#EC4899'],
  ['hub_saas', 'gauge_gosp', '#F43F5E'],
  ['hub_saas', 'gauge_epist', '#E879F9']
];

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

  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL');

  // 카메라 팬 / 줌 / 3D 틸트 상태
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0, tiltX: 0.14, tiltY: -0.10 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const screenNodesRef = useRef(new Map());

  // 성도님의 실제 데이터(통독·QT·설교·노트) 실시간 집계 엔진
  const liveTelemetry = useMemo(() => {
    const readChapSet = new Set();
    Object.keys(readVerses || {}).forEach(k => {
      if (readVerses[k]) {
        const [bk, ch] = k.split('-');
        readChapSet.add(`${bk}-${ch}`);
      }
    });

    const sectorProgress = {};
    BIBLE_66_CANON.forEach(b => {
      if (!sectorProgress[b.sector]) {
        sectorProgress[b.sector] = { total: 0, read: 0 };
      }
      sectorProgress[b.sector].total += b.chaps;
      for (let c = 1; c <= b.chaps; c++) {
        if (readChapSet.has(`${b.en}-${c}`) || readChapSet.has(`${b.ko}-${c}`)) {
          sectorProgress[b.sector].read += 1;
        }
      }
    });

    let qtCount = 0;
    let sermonCount = 0;
    const recentRecords = [];

    Object.entries(dailyData || {}).forEach(([dateKey, d]) => {
      if (!d) return;
      if (d.qtTitle || d.qtMeditation) {
        qtCount++;
        recentRecords.push({
          id: `qt_${dateKey}`,
          type: 'QT',
          title: d.qtTitle || `${dateKey} 묵상`,
          ref: d.qtReference || '시편 119:105',
          date: dateKey
        });
      }
      if (d.sermonTitle || d.sermonNotes) {
        sermonCount++;
        recentRecords.push({
          id: `serm_${dateKey}`,
          type: 'SERMON',
          title: d.sermonTitle || `${dateKey} 설교노트`,
          ref: d.sermonReference || '마태복음 5:1',
          date: dateKey
        });
      }
    });

    const totalNotes = qtCount + sermonCount + (bibleNotes?.length || 0) + (generalNotes?.length || 0);
    const totalReadChaps = readChapSet.size;
    const syncScore = totalReadChaps * 120 + totalNotes * 350 + 30240;

    return {
      totalReadChaps,
      qtCount,
      sermonCount,
      totalNotes,
      syncScore,
      sectorProgress,
      recentRecords: recentRecords.slice(0, 10)
    };
  }, [dailyData, readVerses, bibleNotes, generalNotes]);

  const previewScripture = useMemo(() => {
    const targetBookKo = selectedNode?.bookRef || '요한복음';
    const targetChap = selectedNode?.chapRef || 1;
    const bMeta = BIBLE_66_CANON.find(b => b.ko === targetBookKo) || BIBLE_66_CANON[0];
    const rawBook = (Array.isArray(bibleData) ? bibleData : []).find(
      b => b.name === bMeta.en || b.name === bMeta.ko
    );
    const chapVerses = rawBook?.chapters?.[Math.max(0, targetChap - 1)] || [];
    return {
      bookKo: bMeta.ko,
      bookEn: bMeta.en,
      chap: targetChap,
      verses: chapVerses.slice(0, 4).map((t, i) => ({
        v: i + 1,
        text: String(t).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
      }))
    };
  }, [selectedNode]);

  // 3D KRONOS 지오데식 다면체 및 골드 구체 파티클 캐시
  const geometryCache = useMemo(() => {
    const kronosVerts = [];
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 36; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 36);
      const theta = (2 * Math.PI * i) / golden;
      kronosVerts.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
      });
    }

    const spherePts = [];
    for (let i = 0; i < 88; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 88);
      const theta = (2 * Math.PI * i) / golden;
      spherePts.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
      });
    }

    return { kronosVerts, spherePts };
  }, []);

  // =====================================================================
  // 메인 60FPS 캔버스 렌더링 엔진 (Additive Light & Precision Geometry)
  // =====================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const render = () => {
      tick += 0.015;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (!width || !height || width < 20) {
        animId = requestAnimationFrame(render);
        return;
      }

      // 1. 딥 다크 옵시디언 배경 & 앰비언트 볼류메트릭 백라이트
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#040508';
      ctx.fillRect(0, 0, width, height);

      const cam = cameraRef.current;
      if (isAutoOrbit && !isDraggingRef.current) {
        cam.tiltY = Math.sin(tick * 0.32) * 0.12;
        cam.tiltX = 0.12 + Math.cos(tick * 0.24) * 0.05;
      }

      ctx.save();
      ctx.translate(width / 2 + cam.x, height / 2 + cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // 미세한 3D 원근 다크 그리드 (스크린샷의 정밀 매트릭스 격자 재현)
      const gridSpan = Math.max(width, height) * 1.1;
      const step = 68;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -gridSpan; x <= gridSpan; x += step) {
        ctx.moveTo(x + cam.tiltY * 70, -gridSpan);
        ctx.lineTo(x - cam.tiltY * 70, gridSpan);
      }
      for (let y = -gridSpan; y <= gridSpan; y += step) {
        ctx.moveTo(-gridSpan, y + cam.tiltX * 50);
        ctx.lineTo(gridSpan, y - cam.tiltX * 50);
      }
      ctx.stroke();

      // 3D 좌표 투영
      const baseSpreadW = Math.max(820, Math.min(width * 0.94, 1240));
      const baseSpreadH = Math.max(580, Math.min(height * 0.88, 780));

      const projectNode = (nx, ny, nz = 0) => {
        const px = nx * baseSpreadW;
        const py = ny * baseSpreadH;
        const cosY = Math.cos(cam.tiltY), sinY = Math.sin(cam.tiltY);
        const cosX = Math.cos(cam.tiltX), sinX = Math.sin(cam.tiltX);

        const x1 = px * cosY - nz * sinY;
        const z1 = nz * cosY + px * sinY;
        const y2 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;

        const fov = 950;
        const scale = fov / Math.max(250, fov + z2);
        return { x: x1 * scale, y: y2 * scale, scale, z: z2 };
      };

      const posMap = new Map();

      // KRONOS 코어 좌표
      const corePos = projectNode(-0.04, 0.02, 0);
      posMap.set('kronos_core', {
        id: 'kronos_core',
        type: 'kronos_core',
        label: 'KRONOS',
        sub: '구속사 중앙 신경망 코어',
        color: '#D946EF',
        bookRef: '요한계시록',
        chapRef: 1,
        desc: '성경 66권 원어 매트릭스, 34만 교차참조, 그리고 개인의 QT·설교 노트가 하나로 수렴하여 상호 대화하는 중심 코어입니다.',
        ...corePos,
        hitRadius: 56
      });

      TOP_FRACTAL_MATRICES.forEach(m => {
        const p = projectNode(m.nx, m.ny, m.nz);
        posMap.set(m.id, { ...m, ...p, hitRadius: 48 });
      });

      TOP_MANDALA_ENGINES.forEach(m => {
        const p = projectNode(m.nx, m.ny, m.nz);
        posMap.set(m.id, { ...m, ...p, hitRadius: m.radius + 6 });
      });

      LEFT_GOLD_CLUSTERS.forEach(g => {
        const p = projectNode(g.nx, g.ny, g.nz);
        posMap.set(g.id, { ...g, ...p, hitRadius: g.radius + 6 });
      });

      BOTTOM_MAGENTA_GAUGES.forEach(g => {
        const p = projectNode(g.nx, g.ny, 20);
        posMap.set(g.id, {
          ...g,
          type: 'magenta_gauge',
          sub: `${g.sector} 실시간 통독·묵상 게이지`,
          desc: `${g.sector} 영역의 성경 통독률과 구속사 교차참조 밀도를 실시간 추적하는 터미널 다이얼입니다.`,
          ...p,
          hitRadius: 38
        });
      });

      RELAY_HUBS.forEach(h => {
        const p = projectNode(h.nx, h.ny, 15);
        posMap.set(h.id, {
          ...h,
          type: 'relay_hub',
          desc: '상위 원어 메인프레임과 하위 개인 영성 데이터를 중계하는 신경망 허브입니다.',
          ...p,
          hitRadius: 22
        });
      });

      screenNodesRef.current = posMap;

      // =====================================================================
      // 2. 유기적 S자 시냅스 베지어 곡선 & 광자(Photon) 패킷
      // =====================================================================
      ctx.globalCompositeOperation = 'lighter';
      SYNAPSE_PATHWAYS.forEach(([srcId, tgtId, lineCol], idx) => {
        const src = posMap.get(srcId);
        const tgt = posMap.get(tgtId);
        if (!src || !tgt) return;

        const isFocused =
          (selectedNode && (selectedNode.id === srcId || selectedNode.id === tgtId)) ||
          (hoveredNode && (hoveredNode.id === srcId || hoveredNode.id === tgtId));

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const ctrl1X = src.x + dx * 0.25 + (idx % 2 === 0 ? 22 : -22);
        const ctrl1Y = src.y + dy * 0.72;
        const ctrl2X = src.x + dx * 0.78;
        const ctrl2Y = src.y + dy * 0.28;

        // 외곽 은은한 글로우 라인
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, tgt.x, tgt.y);
        ctx.strokeStyle = isFocused ? 'rgba(255, 255, 255, 0.85)' : 'rgba(203, 213, 225, 0.36)';
        ctx.lineWidth = isFocused ? 2.2 : 1.15;
        ctx.stroke();

        // 베지어 곡선을 따라 흐르는 광자 펄스
        const t = ((tick * 0.42 + idx * 0.19) % 1);
        const u = 1 - t;
        const px = u * u * u * src.x + 3 * u * u * t * ctrl1X + 3 * u * t * t * ctrl2X + t * t * t * tgt.x;
        const py = u * u * u * src.y + 3 * u * u * t * ctrl1Y + 3 * u * t * t * ctrl2Y + t * t * t * tgt.y;

        ctx.beginPath();
        ctx.arc(px, py, isFocused ? 3.5 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = lineCol || '#38BDF8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // =====================================================================
      // 3. 상단 2대 직교 프랙탈 매트릭스 (47 OS / Pulse Mainframe 정밀 재현)
      // =====================================================================
      TOP_FRACTAL_MATRICES.forEach((m, mIdx) => {
        if (filterMode !== 'ALL' && filterMode !== 'MAINFRAME') return;
        const node = posMap.get(m.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);

        // H자형 + 4방향 직교 회로 트리
        const branches = [
          [-26, -26], [26, -26], [-26, 26], [26, 26],
          [0, -30], [0, 30], [-30, 0], [30, 0]
        ];

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
        ctx.lineWidth = 1.1;
        branches.forEach(([bx, by], bIdx) => {
          // 직각(Orthogonal) 꺾임 선
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(bx, 0);
          ctx.lineTo(bx, by);
          ctx.stroke();

          // 서브 프랙탈 마이크로 그리드 (3x3 점멸 셀)
          for (let gx = -7; gx <= 7; gx += 7) {
            for (let gy = -7; gy <= 7; gy += 7) {
              const blink = 0.35 + 0.65 * Math.abs(Math.sin(tick * 2.5 + bIdx + gx * 0.3 + gy * 0.3));
              ctx.fillStyle = (gx === 0 && gy === 0)
                ? `rgba(56, 189, 248, ${blink})`
                : `rgba(129, 140, 248, ${blink * 0.85})`;
              ctx.fillRect(bx + gx - 1.4, by + gy - 1.4, 2.8, 2.8);
            }
          }
        });

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '700 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, 0, 52);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      });

      // =====================================================================
      // 4. 우측 상단 4대 에메랄드 시냅스 만다라 링 (IMG_3873 완벽 고증)
      // =====================================================================
      TOP_MANDALA_ENGINES.forEach((m, idx) => {
        if (filterMode !== 'ALL' && filterMode !== 'MAINFRAME') return;
        const node = posMap.get(m.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = m.radius * node.scale;

        // 중심 청록색 볼류메트릭 글로우
        const radial = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.15);
        radial.addColorStop(0, 'rgba(45, 212, 191, 0.42)');
        radial.addColorStop(0.5, 'rgba(16, 185, 129, 0.14)');
        radial.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // 외곽 회전 기어 링 & 10각 방사형 스포크
        ctx.save();
        ctx.rotate(tick * (idx % 2 === 0 ? 0.32 : -0.32));

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.stroke();

        const spokes = 10;
        for (let s = 0; s < spokes; s++) {
          const ang = (s * Math.PI * 2) / spokes;
          const nextAng = ((s + 1) * Math.PI * 2) / spokes;
          const ox = Math.cos(ang) * r;
          const oy = Math.sin(ang) * r;
          const ix = Math.cos(ang + Math.PI / spokes) * (r * 0.64);
          const iy = Math.sin(ang + Math.PI / spokes) * (r * 0.64);

          // 방사선 및 삼각 트러스 연결
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.28)';
          ctx.lineWidth = 0.9;
          ctx.stroke();

          // 외곽 위성 점
          ctx.beginPath();
          ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#5EEAD4';
          ctx.fill();

          // 내측 링 점
          ctx.beginPath();
          ctx.arc(ix, iy, 2.0, 0, Math.PI * 2);
          ctx.fillStyle = '#A7F3D0';
          ctx.fill();
        }
        ctx.restore();

        // 중앙 고휘도 화이트-민트 코어
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#2DD4BF';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '700 10.5px sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, 0, r + 15);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      });

      // =====================================================================
      // 5. 정중앙 KRONOS 3D 지오데식(Geodesic) 다면체 코어
      // =====================================================================
      const kCore = posMap.get('kronos_core');
      if (kCore) {
        ctx.save();
        ctx.translate(kCore.x, kCore.y);
        const coreR = 54 * kCore.scale;

        // 보라색/마젠타 코어 볼류메트릭 오라
        const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreR * 1.25);
        coreGrad.addColorStop(0, 'rgba(217, 70, 239, 0.55)');
        coreGrad.addColorStop(0.45, 'rgba(147, 51, 234, 0.20)');
        coreGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coreR * 1.25, 0, Math.PI * 2);
        ctx.fill();

        const rotA = tick * 0.55;
        const rotB = tick * 0.38;

        const projVerts = geometryCache.kronosVerts.map(v => {
          const x1 = v.x * Math.cos(rotA) - v.z * Math.sin(rotA);
          const z1 = v.z * Math.cos(rotA) + v.x * Math.sin(rotA);
          const y2 = v.y * Math.cos(rotB) - z1 * Math.sin(rotB);
          const z2 = z1 * Math.cos(rotB) + v.y * Math.sin(rotB);
          return { x: x1 * coreR, y: y2 * coreR, z: z2 };
        });

        ctx.strokeStyle = 'rgba(216, 180, 254, 0.34)';
        ctx.lineWidth = 0.9;
        for (let i = 0; i < projVerts.length; i++) {
          for (let j = i + 1; j < projVerts.length; j++) {
            const d = Math.hypot(projVerts[i].x - projVerts[j].x, projVerts[i].y - projVerts[j].y);
            if (d < coreR * 0.72) {
              ctx.beginPath();
              ctx.moveTo(projVerts[i].x, projVerts[i].y);
              ctx.lineTo(projVerts[j].x, projVerts[j].y);
              ctx.stroke();
            }
          }
        }

        projVerts.forEach(pv => {
          ctx.beginPath();
          ctx.arc(pv.x, pv.y, pv.z > 0 ? 2.4 : 1.4, 0, Math.PI * 2);
          ctx.fillStyle = pv.z > 0 ? '#F0ABFC' : 'rgba(192, 132, 252, 0.45)';
          ctx.fill();
        });

        // 중심 스타버스트 광원
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#E879F9';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText('KRONOS', 0, coreR + 16);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      }

      // =====================================================================
      // 6. 좌측 골드 파티클 구체 & 그린 레이더 스윕 스캐너
      // =====================================================================
      LEFT_GOLD_CLUSTERS.forEach((g, gIdx) => {
        if (filterMode !== 'ALL' && filterMode !== 'PERSONAL') return;
        const node = posMap.get(g.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = g.radius * node.scale;

        if (g.type === 'radar_scanner') {
          // 2중 점선 링 + 그린 스윕 부채꼴 콘
          [r, r * 0.65].forEach(rad => {
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.38)';
            ctx.setLineDash([2, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          });

          const sweepAng = tick * 1.65;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r * 1.05, sweepAng - 0.6, sweepAng);
          ctx.closePath();
          const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.05);
          grad.addColorStop(0, 'rgba(190, 242, 100, 0.65)');
          grad.addColorStop(1, 'rgba(163, 230, 53, 0.02)');
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        } else {
          // 3D 골드 성단 구체 (내부 골드 글로우 + 표면 시냅스 망)
          const gGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
          gGrad.addColorStop(0, 'rgba(250, 204, 21, 0.28)');
          gGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          const rotY = tick * 0.45 + gIdx * 1.2;
          const pts2D = geometryCache.spherePts.map(pt => {
            const x1 = pt.x * Math.cos(rotY) - pt.z * Math.sin(rotY);
            const z1 = pt.z * Math.cos(rotY) + pt.x * Math.sin(rotY);
            return { x: x1 * r, y: pt.y * r, z: z1 };
          });

          ctx.strokeStyle = 'rgba(250, 204, 21, 0.18)';
          ctx.lineWidth = 0.75;
          for (let i = 0; i < pts2D.length; i += 2) {
            const nxt = pts2D[(i + 3) % pts2D.length];
            if (Math.hypot(pts2D[i].x - nxt.x, pts2D[i].y - nxt.y) < r * 0.65) {
              ctx.beginPath();
              ctx.moveTo(pts2D[i].x, pts2D[i].y);
              ctx.lineTo(nxt.x, nxt.y);
              ctx.stroke();
            }
          }

          pts2D.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.z > 0 ? 2.3 : 1.2, 0, Math.PI * 2);
            ctx.fillStyle = p.z > 0 ? '#FDE047' : 'rgba(234, 179, 8, 0.4)';
            ctx.fill();
          });
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '700 10px sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, 0, r + 15);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      });

      // =====================================================================
      // 7. 하단 6대 마젠타 레이더 다이얼 게이지 (IMG_3873 하단 6개 핑크 다이얼)
      // =====================================================================
      BOTTOM_MAGENTA_GAUGES.forEach((g, idx) => {
        if (filterMode !== 'ALL' && filterMode !== 'GAUGES') return;
        const node = posMap.get(g.id);
        if (!node) return;

        const secStat = liveTelemetry.sectorProgress[g.sector] || { total: 50, read: 15 };
        const pct = Math.min(100, Math.max(22, Math.round((secStat.read / Math.max(1, secStat.total)) * 100) + 28));

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = 33 * node.scale;

        // 3중 동심 점선 링
        [r, r * 0.72, r * 0.44].forEach((rad, rIdx) => {
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.strokeStyle = rIdx === 0 ? 'rgba(236, 72, 153, 0.6)' : 'rgba(244, 63, 94, 0.3)';
          ctx.lineWidth = rIdx === 0 ? 1.4 : 1.0;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // 핑크빛 게이지 스윕 바늘 광선
        const needleAngle = -Math.PI * 0.25 + Math.sin(tick * 1.5 + idx) * 0.12;
        const nx = Math.cos(needleAngle) * (r * 1.05);
        const ny = Math.sin(needleAngle) * (r * 1.05);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#FB7185';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '700 9.5px sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, 0, r + 14);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      });

      // =====================================================================
      // 8. 중계 허브(Relay Hubs) & 우측 골드 사인파 웨이브
      // =====================================================================
      RELAY_HUBS.forEach((h, idx) => {
        const node = posMap.get(h.id);
        if (!node) return;
        const isSel = selectedNode?.id === h.id || hoveredNode?.id === h.id;

        ctx.save();
        ctx.translate(node.x, node.y);

        if (h.isWave) {
          ctx.beginPath();
          for (let wx = -32; wx <= 32; wx += 2) {
            const wy = Math.sin((wx * 0.13) + tick * 3.2 + idx) * 10;
            if (wx === -32) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 2.4;
          ctx.shadowColor = h.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (h.isDot) {
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF08A';
          ctx.shadowColor = '#FACC15';
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          const hr = isSel ? 16 : 13.5;
          ctx.beginPath();
          ctx.arc(0, 0, hr, 0, Math.PI * 2);
          ctx.fillStyle = '#0F172A';
          ctx.fill();
          ctx.lineWidth = isSel ? 2.4 : 1.8;
          ctx.strokeStyle = h.color;
          ctx.stroke();

          // 내부 심플 문서/폴더 심볼
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(-4, -3, 8, 6);
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.font = '700 9.5px sans-serif';
        ctx.fillStyle = h.color;
        ctx.textAlign = 'center';
        ctx.fillText(h.label, 0, 23);
        ctx.globalCompositeOperation = 'lighter';
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [geometryCache, isAutoOrbit, filterMode, liveTelemetry, selectedNode, hoveredNode]);

  // 캔버스 반응형 리사이즈 및 초기 모바일 줌 자동 맞춤
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
    if (rect.width < 500) {
      cameraRef.current.zoom = 0.44;
    } else if (rect.width < 820) {
      cameraRef.current.zoom = 0.68;
    } else {
      cameraRef.current.zoom = 0.94;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 노드 히트 판정
  const findHitNode = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const cam = cameraRef.current;
    const wx = (clientX - rect.left - (width / 2 + cam.x)) / cam.zoom;
    const wy = (clientY - rect.top - (height / 2 + cam.y)) / cam.zoom;

    let hit = null;
    let minD = 999;
    screenNodesRef.current.forEach(node => {
      const d = Math.hypot(wx - node.x, wy - node.y);
      if (d <= (node.hitRadius || 32) && d < minD) {
        minD = d;
        hit = node;
      }
    });
    return hit;
  };

  // 마우스 & 모바일 멀티터치(핀치 줌) 통합 핸들러
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
      cameraRef.current.zoom = Math.max(0.32, Math.min(2.5, cameraRef.current.zoom * scaleDelta));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
      return;
    }

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    if (!isDraggingRef.current) {
      const hNode = findHitNode(cx, cy);
      setHoveredNode(hNode);
      return;
    }

    const dx = cx - dragStartRef.current.x;
    const dy = cy - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) dragMovedRef.current = true;

    cameraRef.current.x += dx;
    cameraRef.current.y += dy;
    cameraRef.current.tiltY = Math.max(-0.42, Math.min(0.42, cameraRef.current.tiltY + dx * 0.0012));
    cameraRef.current.tiltX = Math.max(-0.32, Math.min(0.42, cameraRef.current.tiltX + dy * 0.0012));
    dragStartRef.current = { x: cx, y: cy };
  };

  const handlePointerUp = (e) => {
    pinchDistRef.current = null;
    const wasMoved = dragMovedRef.current;
    isDraggingRef.current = false;

    if (!wasMoved) {
      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const clicked = findHitNode(cx, cy);
      if (clicked) {
        setSelectedNode(clicked);
        setIsInspectorOpen(true);
      }
    }
  };

  const handleJumpToBible = (bookKo, chap = 1) => {
    const bMeta = BIBLE_66_CANON.find(b => b.ko === bookKo) || BIBLE_66_CANON[0];
    const chapId = `${bMeta.en}-${chap}`;
    if (typeof setCurrentChapId === 'function') setCurrentChapId(chapId);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(1);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  return (
    <div className="flex-1 w-full h-full bg-[#040508] text-slate-100 flex flex-col overflow-hidden select-none font-sans relative">
      
      {/* 1. 상단 KRONOS 데스크톱 OS 스타일 슬림 헤더 (IMG_3871 좌상단/우상단 완벽 재현) */}
      <header className="relative z-30 px-3 sm:px-5 py-2 bg-[#070910]/95 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        {/* 좌측: 뒤로가기 & 시스템 타이틀 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setActiveScreen && setActiveScreen('galaxy')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>은하계 뷰</span>
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11.5px] sm:text-xs font-mono font-bold tracking-wider text-white truncate">
                KRONOS OS // SECOND BRAIN TELEMETRY
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[9.5px] font-mono text-slate-500">
              <span>[1] MAINFRAME</span>
              <span>[2] MANDALA</span>
              <span>[3] GOLD SPHERES</span>
              <span>[4] CANON GAUGES</span>
            </div>
          </div>
        </div>

        {/* 중앙: 레이어 필터 탭 */}
        <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 text-[10.5px] font-mono font-bold shrink-0">
          {[
            { id: 'ALL', label: 'ALL NODES' },
            { id: 'MAINFRAME', label: 'MAINFRAME' },
            { id: 'PERSONAL', label: 'PERSONAL OS' },
            { id: 'GAUGES', label: '66 GAUGES' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-2.5 py-1 rounded-md cursor-pointer transition-all whitespace-nowrap ${
                filterMode === tab.id ? 'bg-white text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 우측: SYNC 지표 카운터 (IMG_3871 우상단 MRR 카운터 오마주) & 인스펙터 토글 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex flex-col items-end px-2.5 py-0.5 rounded bg-black/60 border border-white/10 font-mono">
            <span className="text-[8.5px] text-slate-500 tracking-widest">SYNC INDEX</span>
            <span className="text-xs font-black text-emerald-400">
              {liveTelemetry.syncScore.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsInspectorOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border cursor-pointer transition-all whitespace-nowrap ${
              isInspectorOpen
                ? 'bg-white text-slate-950 border-white'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
            }`}
          >
            {isInspectorOpen ? '인스펙터 닫기 ✕' : '데이터 인스펙터'}
          </button>
        </div>
      </header>

      {/* 모바일 전용 하단/상단 서브 필터 바 */}
      <div className="sm:hidden px-3 py-1.5 bg-[#070910] border-b border-white/10 flex items-center justify-between gap-1 overflow-x-auto hide-scrollbar shrink-0 z-20">
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
          {[
            { id: 'ALL', label: '전체' },
            { id: 'MAINFRAME', label: '원어·만다라' },
            { id: 'PERSONAL', label: '묵상구체' },
            { id: 'GAUGES', label: '66권게이지' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-2 py-1 rounded cursor-pointer whitespace-nowrap ${
                filterMode === tab.id ? 'bg-white text-slate-950 font-black' : 'text-slate-400 bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
          {liveTelemetry.totalReadChaps}/1189장
        </span>
      </div>

      {/* 2. 메인 3D 신경망 풀스크린 캔버스 뷰포트 */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
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
              cameraRef.current.zoom = Math.max(0.32, Math.min(2.5, cameraRef.current.zoom * factor));
            }}
            className="absolute inset-0 w-full h-full touch-none"
          />
        </div>

        {/* 좌측 하단 슬림 카메라 컨트롤 독 */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-[#0A0D16]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[10.5px] font-mono text-slate-300">
          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              isAutoOrbit ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-300'
            }`}
          >
            {isAutoOrbit ? 'AUTO ORBIT' : 'MANUAL'}
          </button>
          <button
            onClick={() => { cameraRef.current.zoom = Math.min(2.4, cameraRef.current.zoom + 0.16); }}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => { cameraRef.current.zoom = Math.max(0.35, cameraRef.current.zoom - 0.16); }}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            -
          </button>
          <button
            onClick={handleResize}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-bold cursor-pointer"
          >
            RESET
          </button>
        </div>

        {/* 3. 접이식 인스펙터 패널 (노드 클릭 시 또는 상단 버튼 클릭 시에만 슬라이드 오픈 — 모바일 화면 가림 완벽 해결!) */}
        {isInspectorOpen && (
          <aside className="absolute bottom-0 right-0 sm:top-0 w-full sm:w-[370px] max-h-[62vh] sm:max-h-none sm:h-full bg-[#080B12]/96 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-white/15 p-4 flex flex-col gap-3.5 overflow-y-auto hide-scrollbar z-30 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="min-w-0 pr-2">
                <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  NODE TELEMETRY INSPECTOR
                </span>
                <h2 className="text-sm font-bold text-white truncate">
                  {selectedNode ? selectedNode.label : 'KRONOS LOGOS CORE'}
                </h2>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300 hover:text-white cursor-pointer shrink-0"
              >
                닫기 ✕
              </button>
            </div>

            {/* 실시간 지표 */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                <span className="text-[9.5px] text-slate-400 block">성경 통독 완료</span>
                <strong className="text-sm font-bold text-white">{liveTelemetry.totalReadChaps} / 1,189장</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                <span className="text-[9.5px] text-slate-400 block">연결된 묵상·설교</span>
                <strong className="text-sm font-bold text-emerald-400">{liveTelemetry.totalNotes}건</strong>
              </div>
            </div>

            {/* 노드 설명 */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 text-xs">
              <span className="text-[10.5px] font-mono font-bold text-slate-300 block">
                {selectedNode?.sub || '신경망 시냅스 아키텍처'}
              </span>
              <p className="text-slate-400 leading-relaxed break-keep">
                {selectedNode?.desc || '캔버스의 각 노드를 선택하면 연결된 성경 본문과 원어 강해, 개인 묵상 기록을 즉시 조회할 수 있습니다.'}
              </p>
            </div>

            {/* 연결 성경 본문 미리보기 */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">
                  연결 본문: {previewScripture.bookKo} {previewScripture.chap}장
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleJumpToBible(previewScripture.bookKo, previewScripture.chap)}
                    className="px-2.5 py-1 rounded bg-white text-slate-950 font-bold text-[10.5px] cursor-pointer"
                  >
                    본문 열기
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('interlinear_jump', JSON.stringify({
                        book: previewScripture.bookKo,
                        chapter: previewScripture.chap,
                        verse: 1
                      }));
                      if (setActiveScreen) setActiveScreen('interlinear');
                    }}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10.5px] border border-white/15 cursor-pointer"
                  >
                    원어 분석
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
                {previewScripture.verses.map(v => (
                  <p key={v.v} className="text-[12px] font-serif text-slate-300 leading-relaxed break-keep">
                    <b className="text-slate-500 font-mono mr-1.5">{v.v}</b>
                    {v.text}
                  </p>
                ))}
              </div>
            </div>

            {/* 최근 기록 리스트 */}
            <div className="space-y-1.5 text-xs flex-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                RECENT SYNAPSE LOGS (QT · SERMON)
              </span>
              {liveTelemetry.recentRecords.length === 0 ? (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-slate-500 text-[11px]">
                  기록된 QT나 예배 노트가 이곳에 자동으로 동기화됩니다.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
                  {liveTelemetry.recentRecords.map(rec => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        const refs = extractAllBibleRefsFromText(`${rec.ref} ${rec.title}`);
                        if (refs.length > 0) {
                          handleJumpToBible(refs[0].bookKo, refs[0].chapter);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-black/50 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-400">[{rec.type}] {rec.ref}</span>
                        <span className="text-[9.5px] font-mono text-slate-500">{rec.date}</span>
                      </div>
                      <div className="font-bold text-slate-200 truncate">{rec.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
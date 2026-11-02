// src/pages/BibleSecondBrain3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BIBLE_66_CANON, extractAllBibleRefsFromText } from './BibleKnowledgeGalaxy';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🧠 KRONOS SECOND BRAIN — 5대 아키텍처 클러스터 정의 (IMG_3871~3873 완벽 고증)
// =====================================================================
const TOP_FRACTAL_MATRICES = [
  {
    id: 'matrix_hebrew',
    type: 'fractal_grid',
    label: 'OT HEBREW OS (BHS)',
    sub: '구약 39권 원어·자모 매트릭스',
    color: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.45)',
    nx: -0.28, ny: -0.36, nz: -40,
    bookRef: '창세기', chapRef: 1,
    desc: '구약 39권(929장) 히브리어 원문 형태소와 아람어 구문론이 직교 프랙탈 회로로 연산되는 제1 메인프레임입니다.'
  },
  {
    id: 'matrix_greek',
    type: 'fractal_grid',
    label: 'NT GREEK MAINFRAME (NA28)',
    sub: '신약 27권 헬라어 로고스 회로',
    color: '#818CF8',
    glow: 'rgba(129, 140, 248, 0.45)',
    nx: -0.08, ny: -0.36, nz: -20,
    bookRef: '요한복음', chapRef: 1,
    desc: '신약 27권(260장) 헬라어 원문과 스트롱 사전 네트워크가 실시간 결합되는 제2 메인프레임입니다.'
  }
];

const TOP_MANDALA_ENGINES = [
  {
    id: 'mandala_lxx',
    type: 'mandala_ring',
    label: 'LXX Septuagint Engine',
    sub: '70인역 신구약 직접 인용망',
    color: '#2DD4BF',
    nx: 0.12, ny: -0.34, nz: 10,
    radius: 38,
    bookRef: '이사야', chapRef: 53,
    desc: '구약 히브리어 성경이 헬라어 70인역(LXX)을 거쳐 신약 복음서와 서신서에 직접 인용된 정경 회로입니다.'
  },
  {
    id: 'mandala_prophecy',
    type: 'mandala_ring',
    label: 'Messianic Prophecy Hub',
    sub: '메시아 예언·성취 시냅스',
    color: '#34D399',
    nx: 0.28, ny: -0.33, nz: 30,
    radius: 42,
    bookRef: '미가', chapRef: 5,
    desc: '구약의 메시아 예언과 모형(Typology)이 예수 그리스도의 십자가와 부활에서 100% 성취된 연결망입니다.'
  },
  {
    id: 'mandala_tsk',
    type: 'mandala_ring',
    label: 'OpenBible 344K Neural',
    sub: '34만 교차참조 빅데이터 클러스터',
    color: '#10B981',
    nx: 0.41, ny: -0.22, nz: 50,
    radius: 46,
    bookRef: '시편', chapRef: 22,
    desc: '성경 전체 31,102절 사이에 얽혀 있는 344,799개의 상호교차참조(TSK) 시냅스 클러스터입니다.'
  },
  {
    id: 'mandala_covenant',
    type: 'mandala_ring',
    label: 'Redemptive Covenant Skin',
    sub: '아담·아브라함·다윗·새언약',
    color: '#2DD4BF',
    nx: 0.36, ny: -0.02, nz: 25,
    radius: 38,
    bookRef: '히브리서', chapRef: 8,
    desc: '창세기 원시복음부터 요한계시록 새 예루살렘까지 관통하는 언약 신학(Covenant Theology) 엔진입니다.'
  }
];

const LEFT_GOLD_CLUSTERS = [
  {
    id: 'gold_radar',
    type: 'radar_scanner',
    label: 'Personal OS — Daily QT Radar',
    sub: '실시간 영적 5종 루틴 & 묵상 스캐너',
    color: '#A3E635',
    nx: -0.24, ny: -0.06, nz: 60,
    radius: 44,
    bookRef: '시편', chapRef: 119,
    desc: '매일의 QT, 기도, 감사, 성경통독 루틴을 360도 레이더로 스캔하여 영적 호흡을 유지하는 개인 워크스페이스입니다.'
  },
  {
    id: 'gold_qt_sphere',
    type: 'gold_sphere',
    label: 'My QT & Testimony Cloud',
    sub: '나의 묵상·간증·적용 입자 구체',
    color: '#FACC15',
    nx: -0.40, ny: -0.04, nz: 80,
    radius: 50,
    bookRef: '로마서', chapRef: 8,
    desc: '성도님이 직접 기록한 QT 묵상과 내 죄 발견, 삶의 적용 결단들이 황금빛 시냅스 입자로 응집된 기억 저장소입니다.'
  },
  {
    id: 'gold_sermon_sphere',
    type: 'gold_sphere',
    label: 'Sermon & Exegesis Operations',
    sub: '주일·수요·새벽 강해설교 아카이브',
    color: '#F59E0B',
    nx: -0.43, ny: 0.16, nz: 40,
    radius: 46,
    bookRef: '마태복음', chapRef: 5,
    desc: '선포된 강해 설교 노트와 성경 각 권의 주해 데이터가 연결되어 삶과 말씀을 동기화하는 오퍼레이션 구체입니다.'
  },
  {
    id: 'gold_Read_sphere',
    type: 'gold_sphere',
    label: '365 Mcheyne & Canon Companion',
    sub: '1,189장 성경 통독 성취 성단',
    color: '#EAB308',
    nx: -0.44, ny: 0.34, nz: 10,
    radius: 36,
    bookRef: '사도행전', chapRef: 2,
    desc: '성경 66권 1,189장 중 내가 읽고 체크한 장들이 별자리처럼 점등되는 통독 동반자 클러스터입니다.'
  }
];

const BOTTOM_MAGENTA_GAUGES = [
  { id: 'gauge_law', label: '모세오경 (Law)', en: 'Pentateuch', sector: '모세오경', nx: -0.34, ny: 0.41, color: '#EC4899', bookRef: '창세기' },
  { id: 'gauge_hist', label: '역사서 (History)', en: 'OT History', sector: '구약역사서', nx: -0.21, ny: 0.41, color: '#F43F5E', bookRef: '사무엘하' },
  { id: 'gauge_poet', label: '시가서 (Poetry)', en: 'Wisdom', sector: '시가서', nx: -0.08, ny: 0.41, color: '#D946EF', bookRef: '시편' },
  { id: 'gauge_prop', label: '선지서 (Prophets)', en: 'Prophets', sector: '선지서', nx: 0.05, ny: 0.41, color: '#EC4899', bookRef: '이사야' },
  { id: 'gauge_gosp', label: '복음·행전 (Gospel)', en: 'Gospels', sector: '복음서·행전', nx: 0.18, ny: 0.41, color: '#F43F5E', bookRef: '요한복음' },
  { id: 'gauge_epist', label: '서신·계시록 (Epistle)', en: 'Epistles & Rev', sector: '바울서신', nx: 0.31, ny: 0.41, color: '#E879F9', bookRef: '요한계시록' }
];

const RELAY_HUBS = [
  { id: 'hub_personal', label: 'Personal OS', nx: -0.17, ny: -0.19, color: '#FACC15', bookRef: '신명기', chapRef: 6 },
  { id: 'hub_ai_logos', label: 'Logos Exegesis', nx: -0.05, ny: -0.20, color: '#818CF8', bookRef: '히브리서', chapRef: 4 },
  { id: 'hub_ecclesia', label: 'Ecclesia Hub', nx: 0.17, ny: -0.18, color: '#2DD4BF', bookRef: '에베소서', chapRef: 2 },
  { id: 'hub_covenant', label: 'Covenant Core', nx: 0.02, ny: -0.06, color: '#FBBF24', bookRef: '출애굽기', chapRef: 19 },
  { id: 'hub_operations', label: 'Life Obedience', nx: -0.26, ny: 0.17, color: '#FB923C', bookRef: '야고보서', chapRef: 1 },
  { id: 'hub_sanctuary', label: 'Sanctuary Gate', nx: 0.06, ny: 0.15, color: '#C084FC', bookRef: '요한복음', chapRef: 14 },
  { id: 'hub_outreach', label: 'Mission Outreach', nx: 0.16, ny: 0.12, color: '#38BDF8', bookRef: '마태복음', chapRef: 28 },
  { id: 'hub_wave1', label: 'Content Studio (QT)', nx: 0.34, ny: 0.15, color: '#FACC15', isWave: true, bookRef: '시편', chapRef: 1 },
  { id: 'hub_wave2', label: 'Homiletic Wave (설교)', nx: 0.34, ny: 0.28, color: '#F59E0B', isWave: true, bookRef: '디모데후서', chapRef: 3 },
  { id: 'hub_terminal', label: 'Pulse Terminal Ω', nx: 0.42, ny: 0.41, color: '#FDE047', bookRef: '요한계시록', chapRef: 22 }
];

const SYNAPSE_PATHWAYS = [
  ['kronos_core', 'hub_covenant', '#A855F7'],
  ['kronos_core', 'hub_operations', '#F59E0B'],
  ['kronos_core', 'hub_sanctuary', '#EC4899'],
  ['kronos_core', 'gold_radar', '#A3E635'],
  ['hub_covenant', 'hub_personal', '#FACC15'],
  ['hub_covenant', 'hub_ai_logos', '#818CF8'],
  ['hub_covenant', 'hub_ecclesia', '#2DD4BF'],
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
  ['hub_operations', 'gold_Read_sphere', '#EAB308'],
  ['hub_sanctuary', 'hub_outreach', '#38BDF8'],
  ['hub_outreach', 'hub_wave1', '#FACC15'],
  ['hub_outreach', 'hub_wave2', '#F59E0B'],
  ['hub_sanctuary', 'hub_terminal', '#FDE047'],
  ['hub_sanctuary', 'gauge_law', '#EC4899'],
  ['hub_sanctuary', 'gauge_hist', '#F43F5E'],
  ['hub_sanctuary', 'gauge_poet', '#D946EF'],
  ['hub_sanctuary', 'gauge_prop', '#EC4899'],
  ['hub_sanctuary', 'gauge_gosp', '#F43F5E'],
  ['hub_sanctuary', 'gauge_epist', '#E879F9']
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
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [pulseSpeed, setPulseSpeed] = useState(1.0);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'MAINFRAME' | 'PERSONAL' | 'GAUGES'

  // 3D 원근 틸트 & 카메라 팬/줌 상태
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0, tiltX: 0.18, tiltY: -0.12 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
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
          type: 'QT 묵상',
          title: d.qtTitle || `${dateKey} QT`,
          ref: d.qtReference || '시편 119:105',
          body: d.qtMeditation || '',
          date: dateKey
        });
      }
      if (d.sermonTitle || d.sermonNotes) {
        sermonCount++;
        recentRecords.push({
          id: `serm_${dateKey}`,
          type: '설교 노트',
          title: d.sermonTitle || `${dateKey} 예배노트`,
          ref: d.sermonReference || '마태복음 5:1',
          body: String(d.sermonNotes || '').replace(/<[^>]*>?/gm, '').slice(0, 140),
          date: dateKey
        });
      }
    });

    const totalNotes = qtCount + sermonCount + (bibleNotes?.length || 0) + (generalNotes?.length || 0);
    const totalReadChaps = readChapSet.size;

    return {
      totalReadChaps,
      qtCount,
      sermonCount,
      totalNotes,
      sectorProgress,
      recentRecords: recentRecords.slice(0, 12)
    };
  }, [dailyData, readVerses, bibleNotes, generalNotes]);

  // 선택한 성경 구절 본문 미리보기
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

  // 3D KRONOS 다면체 정점 및 골드 스피어 파티클 사전 생성
  const geometryCache = useMemo(() => {
    // 1) KRONOS 중앙 다면체 구체 정점 (32개 노드)
    const kronosVerts = [];
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 28; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 28);
      const theta = (2 * Math.PI * i) / golden;
      kronosVerts.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
      });
    }

    // 2) 골드 구체 파티클 (65개 점)
    const spherePts = [];
    for (let i = 0; i < 65; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 65);
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
  // 🎨 메인 KRONOS 3D 신경망 캔버스 렌더링 루프 (60FPS)
  // =====================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tick = 0;

    const render = () => {
      tick += 0.016 * pulseSpeed;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (!width || !height || width < 20) {
        animId = requestAnimationFrame(render);
        return;
      }

      // 1. 딥 블랙-네이비 우주 배경 & 원근 Perspective 그리드 (IMG_3871 재현)
      ctx.fillStyle = '#05060B';
      ctx.fillRect(0, 0, width, height);

      const cam = cameraRef.current;
      if (isAutoOrbit && !isDraggingRef.current) {
        cam.tiltY = Math.sin(tick * 0.35) * 0.14;
        cam.tiltX = 0.12 + Math.cos(tick * 0.25) * 0.06;
      }

      ctx.save();
      ctx.translate(width / 2 + cam.x, height / 2 + cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // 배경 아이소메트릭 원근 그리드 라인
      const gridSpan = Math.max(width, height) * 0.9;
      const step = 64;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -gridSpan; x <= gridSpan; x += step) {
        ctx.moveTo(x + cam.tiltY * 80, -gridSpan);
        ctx.lineTo(x - cam.tiltY * 80, gridSpan);
      }
      for (let y = -gridSpan; y <= gridSpan; y += step) {
        ctx.moveTo(-gridSpan, y + cam.tiltX * 60);
        ctx.lineTo(gridSpan, y - cam.tiltX * 60);
      }
      ctx.stroke();

      // 3D 좌표 -> 2D 화면 투영 변환기
      const spreadW = Math.min(width * 0.96, 1180);
      const spreadH = Math.min(height * 0.88, 760);

      const projectNode = (nx, ny, nz = 0) => {
        const px = nx * spreadW;
        const py = ny * spreadH;
        const cosY = Math.cos(cam.tiltY), sinY = Math.sin(cam.tiltY);
        const cosX = Math.cos(cam.tiltX), sinX = Math.sin(cam.tiltX);

        const x1 = px * cosY - nz * sinY;
        const z1 = nz * cosY + px * sinY;
        const y2 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;

        const fov = 900;
        const scale = fov / Math.max(200, fov + z2);
        return { x: x1 * scale, y: y2 * scale, scale, z: z2 };
      };

      const posMap = new Map();

      // 중앙 KRONOS 코어 등록
      const corePos = projectNode(-0.04, 0.03, 0);
      posMap.set('kronos_core', {
        id: 'kronos_core',
        type: 'kronos_core',
        label: 'KRONOS LOGOS CORE',
        sub: '예수 그리스도 · 구속사 중앙 신경망 코어',
        color: '#C084FC',
        bookRef: '요한계시록',
        chapRef: 1,
        desc: '모든 성경 66권 원어 매트릭스, 34만 교차참조, 그리고 성도님의 개인 QT·설교 노트가 하나로 수렴하여 서로 대화하는 세컨드 브레인 심장부입니다.',
        ...corePos,
        hitRadius: 56
      });

      TOP_FRACTAL_MATRICES.forEach(m => {
        const p = projectNode(m.nx, m.ny, m.nz);
        posMap.set(m.id, { ...m, ...p, hitRadius: 46 });
      });

      TOP_MANDALA_ENGINES.forEach(m => {
        const p = projectNode(m.nx, m.ny, m.nz);
        posMap.set(m.id, { ...m, ...p, hitRadius: m.radius });
      });

      LEFT_GOLD_CLUSTERS.forEach(g => {
        const p = projectNode(g.nx, g.ny, g.nz);
        posMap.set(g.id, { ...g, ...p, hitRadius: g.radius });
      });

      BOTTOM_MAGENTA_GAUGES.forEach(g => {
        const p = projectNode(g.nx, g.ny, 20);
        posMap.set(g.id, {
          ...g,
          type: 'magenta_gauge',
          sub: `${g.sector} 실시간 통독·묵상 게이지`,
          desc: `${g.sector} 영역의 성경 통독률과 구속사 교차참조 밀도를 실시간 추적하는 터미널 다이얼입니다.`,
          ...p,
          hitRadius: 36
        });
      });

      RELAY_HUBS.forEach(h => {
        const p = projectNode(h.nx, h.ny, 15);
        posMap.set(h.id, {
          ...h,
          type: 'relay_hub',
          sub: '시냅스 중계 허브 노드',
          desc: '상위 원어 메인프레임과 하위 개인 영성 데이터를 중계하는 신경망 허브입니다.',
          ...p,
          hitRadius: 20
        });
      });

      screenNodesRef.current = posMap;

      // =====================================================================
      // ⚡ 2. 유기적 S자 시냅스 베지어 곡선 & 흐르는 광자(Photon) 패킷 렌더링
      // =====================================================================
      SYNAPSE_PATHWAYS.forEach(([srcId, tgtId, lineCol], idx) => {
        const src = posMap.get(srcId);
        const tgt = posMap.get(tgtId);
        if (!src || !tgt) return;

        const isFocused =
          (selectedNode && (selectedNode.id === srcId || selectedNode.id === tgtId)) ||
          (hoveredNode && (hoveredNode.id === srcId || hoveredNode.id === tgtId));

        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const ctrl1X = src.x + (midX - src.x) * 0.5 + (idx % 2 === 0 ? 18 : -18);
        const ctrl1Y = tgt.y - (tgt.y - src.y) * 0.65;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(ctrl1X, ctrl1Y, tgt.x, tgt.y);
        ctx.strokeStyle = isFocused ? '#FFFFFF' : 'rgba(226, 232, 240, 0.32)';
        ctx.lineWidth = isFocused ? 2.2 : 1.15;
        ctx.stroke();

        // 시냅스 곡선을 따라 이동하는 광자(Photon) 펄스 점
        const t = ((tick * 0.45 + idx * 0.17) % 1);
        const invT = 1 - t;
        const px = invT * invT * src.x + 2 * invT * t * ctrl1X + t * t * tgt.x;
        const py = invT * invT * src.y + 2 * invT * t * ctrl1Y + t * t * tgt.y;

        ctx.beginPath();
        ctx.arc(px, py, isFocused ? 3.8 : 2.4, 0, Math.PI * 2);
        ctx.fillStyle = lineCol || '#FACC15';
        ctx.shadowColor = lineCol || '#FACC15';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // =====================================================================
      // 🟦 3. 상단 2대 프랙탈 매트릭스 (47 OS / Pulse Mainframe 스타일 완벽 재현)
      // =====================================================================
      TOP_FRACTAL_MATRICES.forEach((m, mIdx) => {
        if (filterMode !== 'ALL' && filterMode !== 'MAINFRAME') return;
        const node = posMap.get(m.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);

        // 중앙 코어 사각형 + 4방향 프랙탈 가지
        const armOffsets = [
          [-26, -26], [26, -26], [-26, 26], [26, 26],
          [0, -32], [0, 32], [-32, 0], [32, 0]
        ];

        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.2;
        armOffsets.forEach(([ox, oy], aIdx) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ox, oy);
          ctx.stroke();

          // 서브 프랙탈 격자 점
          for (let dx = -6; dx <= 6; dx += 6) {
            for (let dy = -6; dy <= 6; dy += 6) {
              const pulseAlpha = 0.45 + 0.5 * Math.sin(tick * 3 + aIdx + dx);
              ctx.fillStyle = mIdx === 0 ? `rgba(99, 102, 241, ${pulseAlpha})` : `rgba(56, 189, 248, ${pulseAlpha})`;
              ctx.fillRect(ox + dx - 1.5, oy + dy - 1.5, 3, 3);
            }
          }
        });

        ctx.font = 'bold 10.5px monospace';
        ctx.fillStyle = '#E2E8F0';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, 0, 52);
        ctx.restore();
      });

      // =====================================================================
      // 🟢 4. 우측 상단 에메랄드 시냅스 만다라 링 (IMG_3873 만다라 완벽 재현)
      // =====================================================================
      TOP_MANDALA_ENGINES.forEach((m, idx) => {
        if (filterMode !== 'ALL' && filterMode !== 'MAINFRAME') return;
        const node = posMap.get(m.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = m.radius * node.scale;

        // 외곽 회전 기어 링
        ctx.save();
        ctx.rotate(tick * (idx % 2 === 0 ? 0.4 : -0.4));
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
        ctx.stroke();

        const spokes = 8;
        for (let s = 0; s < spokes; s++) {
          const ang = (s * Math.PI * 2) / spokes;
          const sx = Math.cos(ang) * r;
          const sy = Math.sin(ang) * r;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.28)';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.fill();

          const mx = Math.cos(ang + Math.PI / spokes) * (r * 0.62);
          const my = Math.sin(ang + Math.PI / spokes) * (r * 0.62);
          ctx.beginPath();
          ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#A7F3D0';
          ctx.fill();
        }
        ctx.restore();

        // 중앙 빛나는 코어
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#2DD4BF';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 10.5px sans-serif';
        ctx.fillStyle = '#E2F1FF';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, 0, r + 15);
        ctx.font = '9.5px sans-serif';
        ctx.fillStyle = '#5EEAD4';
        ctx.fillText(m.sub, 0, r + 28);
        ctx.restore();
      });

      // =====================================================================
      // 🔮 5. 정중앙 KRONOS 3D 와이어프레임 다면체 코어 (IMG_3873 중앙 보라색 코어)
      // =====================================================================
      const kCore = posMap.get('kronos_core');
      if (kCore) {
        ctx.save();
        ctx.translate(kCore.x, kCore.y);

        const coreR = 54 * kCore.scale;
        const rotA = tick * 0.65;
        const rotB = tick * 0.42;

        // 3D 정점 회전 투영
        const projVerts = geometryCache.kronosVerts.map(v => {
          const x1 = v.x * Math.cos(rotA) - v.z * Math.sin(rotA);
          const z1 = v.z * Math.cos(rotA) + v.x * Math.sin(rotA);
          const y2 = v.y * Math.cos(rotB) - z1 * Math.sin(rotB);
          const z2 = z1 * Math.cos(rotB) + v.y * Math.sin(rotB);
          return { x: x1 * coreR, y: y2 * coreR, z: z2 };
        });

        // 다면체 와이어프레임 격자 연결
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.38)';
        ctx.lineWidth = 1;
        for (let i = 0; i < projVerts.length; i++) {
          for (let j = i + 1; j < projVerts.length; j++) {
            const d = Math.hypot(projVerts[i].x - projVerts[j].x, projVerts[i].y - projVerts[j].y);
            if (d < coreR * 0.78) {
              ctx.beginPath();
              ctx.moveTo(projVerts[i].x, projVerts[i].y);
              ctx.lineTo(projVerts[j].x, projVerts[j].y);
              ctx.stroke();
            }
          }
        }

        projVerts.forEach(pv => {
          ctx.beginPath();
          ctx.arc(pv.x, pv.y, pv.z > 0 ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = pv.z > 0 ? '#E879F9' : 'rgba(168, 85, 247, 0.45)';
          ctx.fill();
        });

        // 중심 발광 핵
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#D946EF';
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 11.5px monospace';
        ctx.fillStyle = '#F5D0FE';
        ctx.textAlign = 'center';
        ctx.fillText('KRONOS LOGOS', 0, coreR + 16);
        ctx.restore();
      }

      // =====================================================================
      // 🟡 6. 좌측 골드 스피어 클러스터 & 녹색 레이더 스캐너 (IMG_3872 좌측 재현)
      // =====================================================================
      LEFT_GOLD_CLUSTERS.forEach((g, gIdx) => {
        if (filterMode !== 'ALL' && filterMode !== 'PERSONAL') return;
        const node = posMap.get(g.id);
        if (!node) return;

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = g.radius * node.scale;

        if (g.type === 'radar_scanner') {
          // 녹색/옐로우 레이더 스윕 콘
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(163, 230, 53, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          const sweepAng = tick * 1.8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, sweepAng - 0.55, sweepAng);
          ctx.closePath();
          const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
          grad.addColorStop(0, 'rgba(163, 230, 53, 0.55)');
          grad.addColorStop(1, 'rgba(163, 230, 53, 0.02)');
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ECFCCB';
          ctx.fill();
        } else {
          // 3D 회전 골든 파티클 구체
          const rotY = tick * 0.5 + gIdx;
          geometryCache.spherePts.forEach((pt, pIdx) => {
            const x1 = pt.x * Math.cos(rotY) - pt.z * Math.sin(rotY);
            const z1 = pt.z * Math.cos(rotY) + pt.x * Math.sin(rotY);
            const px = x1 * r;
            const py = pt.y * r;

            if (pIdx % 5 === 0) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(px, py);
              ctx.strokeStyle = 'rgba(250, 204, 21, 0.14)';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(px, py, z1 > 0 ? 2.4 : 1.3, 0, Math.PI * 2);
            ctx.fillStyle = z1 > 0 ? '#FACC15' : 'rgba(234, 179, 8, 0.35)';
            ctx.fill();
          });
        }

        ctx.font = 'bold 10.5px sans-serif';
        ctx.fillStyle = '#FEF08A';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, 0, r + 15);
        ctx.font = '9.5px sans-serif';
        ctx.fillStyle = '#FDE047';
        ctx.fillText(g.sub, 0, r + 27);
        ctx.restore();
      });

      // =====================================================================
      // 🟣 7. 하단 6대 마젠타 레이더 터미널 게이지 (IMG_3873 하단 6개 핑크 다이얼)
      // =====================================================================
      BOTTOM_MAGENTA_GAUGES.forEach((g, idx) => {
        if (filterMode !== 'ALL' && filterMode !== 'GAUGES') return;
        const node = posMap.get(g.id);
        if (!node) return;

        const secStat = liveTelemetry.sectorProgress[g.sector] || { total: 50, read: 12 };
        const pct = Math.min(100, Math.max(18, Math.round((secStat.read / Math.max(1, secStat.total)) * 100) + 25));

        ctx.save();
        ctx.translate(node.x, node.y);
        const r = 34 * node.scale;

        // 2중 점선 동심원 다이얼
        [r, r * 0.72, r * 0.45].forEach((rad, rIdx) => {
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.strokeStyle = rIdx === 0 ? 'rgba(236, 72, 153, 0.55)' : 'rgba(244, 63, 94, 0.28)';
          ctx.lineWidth = rIdx === 0 ? 1.5 : 1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // 핑크 게이지 스윕 바늘 (Needle Beam)
        const needleAngle = -Math.PI * 0.8 + (pct / 100) * Math.PI * 1.4 + Math.sin(tick * 2 + idx) * 0.08;
        const nx = Math.cos(needleAngle) * r;
        const ny = Math.sin(needleAngle) * r;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#FB7185';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE4E6';
        ctx.fill();

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#FBCFE8';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, 0, r + 14);
        ctx.restore();
      });

      // =====================================================================
      // 🔘 8. 중간 중계 허브(Relay Hubs) & 우측 사인파 웨이브 렌더링
      // =====================================================================
      RELAY_HUBS.forEach((h, idx) => {
        const node = posMap.get(h.id);
        if (!node) return;
        const isSel = selectedNode?.id === h.id || hoveredNode?.id === h.id;

        ctx.save();
        ctx.translate(node.x, node.y);

        if (h.isWave) {
          // 우측 노란색 사인파 파형 (IMG_3873 Content Studio / LeadSlicer 재현)
          ctx.beginPath();
          for (let wx = -34; wx <= 34; wx += 2) {
            const wy = Math.sin((wx * 0.12) + tick * 3 + idx) * 11;
            if (wx === -34) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 2.4;
          ctx.stroke();
        } else {
          // 둥근 이중 링 폴더 아이콘 배지
          const hr = isSel ? 17 : 14;
          ctx.beginPath();
          ctx.arc(0, 0, hr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fill();
          ctx.lineWidth = isSel ? 2.4 : 1.6;
          ctx.strokeStyle = h.color;
          ctx.stroke();

          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(-4.5, -3.5, 9, 7);
        }

        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillStyle = h.color;
        ctx.textAlign = 'center';
        ctx.fillText(h.label, 0, 25);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [geometryCache, isAutoOrbit, pulseSpeed, filterMode, liveTelemetry, selectedNode, hoveredNode]);

  // 캔버스 리사이즈 핸들러
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
    if (rect.width < 680) {
      cameraRef.current.zoom = 0.62;
    } else {
      cameraRef.current.zoom = 0.92;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 마우스/터치 인터랙션 핸들러
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

  const handlePointerDown = (e) => {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    isDraggingRef.current = true;
    dragStartRef.current = { x: cx, y: cy };
  };

  const handlePointerMove = (e) => {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    if (!isDraggingRef.current) {
      const hNode = findHitNode(cx, cy);
      setHoveredNode(hNode);
      return;
    }

    const dx = cx - dragStartRef.current.x;
    const dy = cy - dragStartRef.current.y;
    cameraRef.current.x += dx;
    cameraRef.current.y += dy;
    cameraRef.current.tiltY = Math.max(-0.45, Math.min(0.45, cameraRef.current.tiltY + dx * 0.0015));
    cameraRef.current.tiltX = Math.max(-0.35, Math.min(0.45, cameraRef.current.tiltX + dy * 0.0015));
    dragStartRef.current = { x: cx, y: cy };
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const clicked = findHitNode(cx, cy);
    if (clicked) setSelectedNode(clicked);
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
    <div className="flex-1 w-full h-full bg-[#05060B] text-slate-100 flex flex-col overflow-hidden select-none font-sans relative">
      
      {/* ── 1. KRONOS 상단 텔레메트리 커맨드 헤더 ── */}
      <header className="relative z-30 px-3 sm:px-5 py-2.5 bg-[#090B14]/95 border-b border-indigo-500/25 flex flex-wrap items-center justify-between gap-2 shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen && setActiveScreen('galaxy')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <span>🌌</span> <span>구속사 아크·은하계로 복귀</span>
          </button>

          <div className="flex flex-col pl-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
              <h1 className="text-xs sm:text-sm font-mono font-black tracking-widest text-white uppercase">
                LOGOS KRONOS : 3D SECOND BRAIN OS
              </h1>
            </div>
            <span className="text-[10px] font-mono text-indigo-300/80 hidden sm:inline">
              "Then the scriptures & my spiritual records started talking to each other."
            </span>
          </div>
        </div>

        {/* 우측: 클러스터 필터 & 3D 틸트 제어 + 실시간 영적 자산 티커 */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <div className="flex p-0.5 rounded-xl bg-black/60 border border-white/10 text-[10.5px] font-mono font-bold">
            {[
              { id: 'ALL', label: '전체 신경망' },
              { id: 'MAINFRAME', label: '🟦 원어·만다라' },
              { id: 'PERSONAL', label: '🟡 나의 묵상구체' },
              { id: 'GAUGES', label: '🟣 66권 다이얼' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  filterMode === tab.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono font-black border cursor-pointer whitespace-nowrap ${
              isAutoOrbit ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200' : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {isAutoOrbit ? '3D 자전 ON' : '3D 수동틸트'}
          </button>

          <button
            onClick={() => {
              cameraRef.current = { x: 0, y: 0, zoom: window.innerWidth < 680 ? 0.62 : 0.92, tiltX: 0.14, tiltY: -0.08 };
            }}
            className="px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-amber-300 cursor-pointer whitespace-nowrap"
          >
            🎯 뷰 리셋
          </button>

          {/* 우측 상단 영적 마일리지 카운터 (IMG_3871 우상단 MRR 카운터 오마주) */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1 rounded-xl bg-black/70 border border-emerald-500/30 font-mono">
            <span className="text-[9px] text-slate-400 uppercase">SPIRITUAL ASSETS</span>
            <span className="text-xs font-black text-emerald-400">
              ✦ {(liveTelemetry.totalReadChaps * 120 + liveTelemetry.totalNotes * 350 + 30240).toLocaleString()} PTS
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. 메인 3D 신경망 뷰포트 + 우측 인스펙터 ── */}
      <div className="flex-1 flex overflow-hidden relative">
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
              cameraRef.current.zoom = Math.max(0.38, Math.min(2.4, cameraRef.current.zoom * factor));
            }}
            className="absolute inset-0 w-full h-full touch-none"
          />

          {/* 좌측 하단 플로팅 단축 줌/가이드 바 */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-[#090B14]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-indigo-500/30 text-[10.5px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>노드를 터치하면 성경 원문·원어·나의 노트가 연결됩니다</span>
            <button
              onClick={() => { cameraRef.current.zoom = Math.min(2.2, cameraRef.current.zoom + 0.18); }}
              className="ml-2 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-black cursor-pointer"
            >
              ＋
            </button>
            <button
              onClick={() => { cameraRef.current.zoom = Math.max(0.4, cameraRef.current.zoom - 0.18); }}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-black cursor-pointer"
            >
              －
            </button>
          </div>
        </div>

        {/* ── 3. 우측 KRONOS 신경망 상세 인스펙터 사이드바 ── */}
        <aside className="w-full sm:w-[360px] lg:w-[390px] border-l border-indigo-500/25 bg-[#090B14]/95 p-4 flex flex-col gap-3.5 overflow-y-auto hide-scrollbar shrink-0 z-20 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-black text-fuchsia-400 uppercase block">
                NEURAL NODE INSPECTOR
              </span>
              <h2 className="text-sm font-black text-white">
                {selectedNode ? selectedNode.label : 'KRONOS LOGOS CORE (전체 요약)'}
              </h2>
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
              >
                ✕ 초기화
              </button>
            )}
          </div>

          {/* 실시간 세컨드 브레인 4대 KPI 카드 */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-black/50 border border-indigo-500/30">
              <span className="text-[10px] text-slate-400 block">성경 통독 완료</span>
              <strong className="text-sm font-black text-indigo-300">{liveTelemetry.totalReadChaps} / 1,189장</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/30">
              <span className="text-[10px] text-slate-400 block">누적 영적 기록</span>
              <strong className="text-sm font-black text-amber-300">{liveTelemetry.totalNotes}건 연결됨</strong>
            </div>
          </div>

          {/* 선택된 클러스터 설명 */}
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/35 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono font-bold text-indigo-300 block">
              {selectedNode?.sub || '신경망 시냅스 아키텍처 개요'}
            </span>
            <p className="text-slate-200 leading-relaxed break-keep">
              {selectedNode?.desc || '화면의 프랙탈 매트릭스(상단), 에메랄드 만다라(우측), 골드 입자 구체(좌측), 마젠타 게이지(하단)를 터치해 보세요.'}
            </p>
          </div>

          {/* 연결된 성경 본문 미리보기 및 바로가기 */}
          <div className="p-3 rounded-2xl bg-black/55 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300">
                📖 연결 성경: {previewScripture.bookKo} {previewScripture.chap}장
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleJumpToBible(previewScripture.bookKo, previewScripture.chap)}
                  className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px] cursor-pointer"
                >
                  본문 열기 ➔
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
                  className="px-2 py-0.5 rounded bg-indigo-600 text-white font-black text-[10px] cursor-pointer"
                >
                  🔬 원어
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
              {previewScripture.verses.map(v => (
                <p key={v.v} className="text-[11.5px] font-serif text-slate-200 leading-relaxed break-keep">
                  <b className="text-amber-400 font-mono mr-1.5">{v.v}</b>
                  {v.text}
                </p>
              ))}
            </div>
          </div>

          {/* 나의 최근 QT·설교 시냅스 스트림 */}
          <div className="space-y-1.5 text-xs flex-1">
            <span className="text-[10.5px] font-mono font-bold text-amber-400 uppercase block">
              ⚡ 최근 활성화된 나의 묵상·설교 시냅스
            </span>
            {liveTelemetry.recentRecords.length === 0 ? (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-slate-400 text-[11px]">
                QT나 예배 노트를 작성하면 이 신경망에 실시간 골드 노드로 자동 편입됩니다.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
                {liveTelemetry.recentRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      const refs = extractAllBibleRefsFromText(`${rec.ref} ${rec.title}`);
                      if (refs.length > 0) {
                        handleJumpToBible(refs[0].bookKo, refs[0].chapter);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-black/45 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-300">[{rec.type}] {rec.ref}</span>
                      <span className="text-[9.5px] font-mono text-slate-400">{rec.date}</span>
                    </div>
                    <div className="font-bold text-white truncate">{rec.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
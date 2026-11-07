// src/pages/VirtualChurchLobby.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎵 Web Audio API 사운드 이펙트 (발걸음, 엘리베이터 벨, 인터랙션 팝업)
// =====================================================================
const playMetaSfx = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.045);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'interact') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.15, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.008, now + i * 0.055 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.18);
      });
    } else if (type === 'elevator') {
      [659.25, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.22);
        gain.gain.setValueAtTime(0.22, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.22 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 0.45);
      });
    }
  } catch (_) {}
};

// =====================================================================
// 🗺️ 1층 로비 & 외부 주차장/도로 6대 상호작용 존(Trigger Zones) 정의
// =====================================================================
const INTERACTION_ZONES = [
  {
    id: 'zone_welcome_desk',
    code: '01',
    name: '1층 정문 로비 & 새가족 안내 데스크',
    prompt: '01 새가족 환영 데스크 체험',
    x: -1.5,
    y: 2.2,
    radius: 2.1,
    color: '#22C55E',
    floor: '1F',
    badge: '환영 로비',
    title: '좋은나무교회 1층 정문 로비에 오신 것을 환영합니다!',
    desc: '정문과 좌측 주차장 출입구가 만나는 메인 로비입니다. 처음 방문하신 새가족분들은 안내 데스크에서 등록 카드 작성과 교회 투어 안내를 받으실 수 있습니다.',
    stats: [
      { label: '예배 안내', val: '주일 1부 09:00 / 2부 11:00' },
      { label: '새가족 등록', val: '1층 로비 데스크 & 5층 새가족실' },
      { label: '현장 상태', val: '100점 (안내위원 상주 중)' }
    ],
    actions: [
      { label: '📖 온라인 주보 · 예배노트', screen: 'sermon' },
      { label: '🔥 오늘의 QT 바로가기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_parking_gate',
    code: '02',
    name: '좌측 야외 주차장 & 측면 출입구',
    prompt: '02 주차장 및 차량 안내 확인',
    x: -7.5,
    y: 1.5,
    radius: 2.2,
    color: '#38BDF8',
    floor: '1F',
    badge: '주차타워 · 야외주차',
    title: '좌측 전용 주차장 & 배려 주차 구역',
    desc: '성도님들과 새가족 차량이 안전하게 주차할 수 있는 좌측 주차 구역입니다. 주차 후 바로 옆 측면 자동문을 통해 1층 로비로 편리하게 진입하실 수 있습니다.',
    stats: [
      { label: '주차 가능 대수', val: '여유 (현재 68% 가동)' },
      { label: '새가족 전용석', val: '1층 좌측 입구 최우선 배정' },
      { label: '전기차/장애인석', val: '측면 출입구 직결 완비' }
    ],
    actions: []
  },
  {
    id: 'zone_curved_corridor',
    code: '03',
    name: '중앙 곡선형 비전 갤러리 복도',
    prompt: '03 교회 연혁 & 비전 갤러리 보기',
    x: -1.8,
    y: -3.2,
    radius: 2.1,
    color: '#22C55E',
    floor: '1F',
    badge: '비전 갤러리',
    title: '말씀과 기도로 자라가는 좋은나무 비전 홀',
    desc: '로비 중앙에서 엘리베이터 홀로 부드럽게 이어지는 곡선형 갤러리 복도입니다. 벽면의 대형 대시보드에서 금주의 말씀, 교회 소식, 목장 사역 현황을 한눈에 확인하실 수 있습니다.',
    stats: [
      { label: '표어', val: '말씀으로 가정을 세우는 공동체' },
      { label: '양육 과정', val: '성인 12주 · 청소년 10주 과정' },
      { label: '목장 모임', val: '전 성도 소그룹 목장 운영' }
    ],
    actions: [
      { label: '🎓 12주 양육 커리큘럼', screen: 'trainingCurriculum' },
      { label: '🌱 청소년 10주 양육', screen: 'youthCurriculum' }
    ]
  },
  {
    id: 'zone_elevator',
    code: '04',
    name: '우측 상단 층간 이동 엘리베이터 홀',
    prompt: '04 엘리베이터 탑승 (전 층 이동)',
    x: 6.2,
    y: -6.2,
    radius: 2.4,
    color: '#10B981',
    floor: 'ALL',
    badge: '엘리베이터 (1F~7F)',
    title: '스마트 층별 이동 엘리베이터 홀',
    desc: '3층(대예배당), 4층(방송실·영유아실), 5층(만나식당·연습실), 6층(다음세대 교육관), 7층(옥상 하늘정원)으로 즉시 이동할 수 있는 메인 엘리베이터입니다. 원하는 층을 선택해 주세요!',
    isElevator: true,
    stats: [
      { label: '7층 (7F)', val: '옥상 하늘정원 입구 (성도 쉼터)' },
      { label: '6층 (6F)', val: '다음세대 교육관 (영아·유치·유년·초등·새가족)' },
      { label: '5층 (5F)', val: '만나 친교식당 · 조리실 · 찬양연습실' },
      { label: '4층 (4F)', val: '방송실 (Media Room) · 영유아실' },
      { label: '3층 (3F)', val: '대예배당 본당 (장의자 착석 & 설교 스크린)' }
    ],
    actions: []
  },
  {
    id: 'zone_up_stairs',
    code: '05',
    name: '우측 전 층 연결 공통 계단실',
    prompt: '05 계단으로 위층(3F~7F) 올라가기',
    x: 5.5,
    y: -0.8,
    radius: 2.0,
    color: '#22C55E',
    floor: '1F→3F',
    badge: '전 층 연결 계단실',
    title: '3층 대예배당 & 교육관 연결 계단실',
    desc: '엘리베이터를 기다리지 않고 3층 대예배당, 4층 영유아실, 5층 식당, 6층 교육관, 7층 하늘정원으로 걸어서 올라갈 수 있는 채광 좋은 계단실입니다.',
    isElevator: true,
    stats: [
      { label: '연결 층수', val: '1F 로비 ↔ 3F 본당 ↔ 4F~7F 전 층 연결' },
      { label: '안전 시설', val: '논슬립 화강암 스텝 및 코너 소화기 완비' }
    ],
    actions: []
  },
  {
    id: 'zone_down_basement',
    code: '06',
    name: '우측 하단 친교실·연습실 직통 안내',
    prompt: '06 5층 친교식당·찬양연습실 바로가기',
    x: 5.5,
    y: 4.2,
    radius: 2.2,
    color: '#F59E0B',
    floor: '5F',
    badge: '식당 · 연습실 안내',
    title: '만나 친교식당 & 찬양단 연습실 (5F 이동)',
    desc: '주일 애찬(식사)을 나누는 만나 친교식당과 조리실, 찬양팀 연습실이 위치한 5층으로 바로 이동하실 수 있습니다.',
    stats: [
      { label: '주요 시설', val: '만나 친교식당 · 조리실 · 찬양연습실' },
      { label: '주일 식사', val: '2부 예배 후 전 성도 애찬 교제' }
    ],
    directFloor: '5F',
    actions: []
  }
];

// NPC 대원 데이터 (레퍼런스 이미지의 블록형 안내 NPC들)
const LOBBY_NPCS = [
  { id: 'npc_1', name: '안내위원 박집사', role: '새가족 안내', x: -2.6, y: 1.4, dir: 1, suitColor: '#0284C7', hairColor: '#D97706', msg: '할렐루야! 좋은나무교회 1층 로비에 오신 것을 환영합니다!' },
  { id: 'npc_2', name: '청년부 김리더', role: '로비 스태프', x: -0.5, y: 1.4, dir: 1, suitColor: '#2563EB', hairColor: '#B45309', msg: '우측 안쪽으로 들어가시면 3층~7층으로 가는 엘리베이터와 계단이 있습니다!' },
  { id: 'npc_3', name: '주차봉사 최집사', role: '주차 안내', x: -6.2, y: 2.2, dir: 2, suitColor: '#16A34A', hairColor: '#78350F', msg: '좌측 주차장에 편히 주차하시고 옆문으로 들어오세요!' },
  { id: 'npc_4', name: '교역자 안내데스크', role: '목양 지원', x: 2.2, y: -2.0, dir: 0, suitColor: '#4F46E5', hairColor: '#92400E', msg: '전방 우측 엘리베이터에서 3F 본당, 4F 영유아실, 5F 식당, 6F 교육관, 7F 하늘정원으로 이동하세요!' }
];

// 층별 정보 (MetaverseHub의 1F, 3F~7F와 100% 일치)
const FLOOR_INFO_MAP = {
  '1F': { name: '1F 메인 로비 & 주차장', sub: '정문 인도·차도 · 좌측 주차장 · 곡선형 복도 · 엘리베이터/계단', color: '#10B981', hubSupported: true },
  '3F': { name: '3F 대예배당 (본당)', sub: '장의자 착석 모션 · 예배노트 유튜브 실시간 연동 스크린 · 찬양단 강단', color: '#3B82F6', hubSupported: true },
  '4F': { name: '4F 방송실 & 영유아실', sub: '예배 미디어 송출실 · 12개월 이하 부모와 아기 쉼터 · 대형 관람창', color: '#F59E0B', hubSupported: true },
  '5F': { name: '5F 식당 · 새가족실 · 연습실', sub: '만나 친교식당 · 조리실 · 찬양단 악기 연습실 · 에코 분리수거존', color: '#8B5CF6', hubSupported: true },
  '6F': { name: '6F 다음세대 교육관 (소예배실)', sub: '영아부 · 유치부 · 유년부 · 초등부 · 새가족반 · 어린이 찬양 BGM', color: '#EC4899', hubSupported: true },
  '7F': { name: '7F 옥상 하늘정원 입구', sub: '하늘정원 나가는 문 · 화환 및 비품 적재 공간 · 계단참 소화기', color: '#14B8A6', hubSupported: true }
};

export default function VirtualChurchLobby({ setActiveScreen, onChangeFloor }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '새가족 방문자';

  const canvasRef = useRef(null);
  const minimapRef = useRef(null);

  // 현재 층 상태 및 팝업 모달 상태
  const [currentFloor, setCurrentFloor] = useState('1F');
  const [activeZone, setActiveZone] = useState(null);
  const [openModalZone, setOpenModalZone] = useState(null);
  const [playerBubble, setPlayerBubble] = useState('👋 샬롬! 반갑습니다!');
  const [cameraZoom, setCameraZoom] = useState(1.0);

  // 플레이어 캐릭터 상태 (월드 좌표 x, y, 목표 좌표 tx, ty, 이동 중 여부, 바라보는 방향)
  const playerRef = useRef({
    x: -2.0,
    y: 5.8, // 정문 화살표 입구에서 시작!
    tx: -2.0,
    ty: 5.8,
    vx: 0,
    vy: 0,
    speed: 0.085,
    walkCycle: 0,
    isMoving: false,
    emote: null,
    emoteTimer: 0
  });

  // 키보드 입력 상태
  const keysRef = useRef({});
  // 도로 위를 달리는 배경 자동차 상태
  const carsRef = useRef([
    { id: 1, x: -12, y: 9.2, speed: 0.055, color: '#FACC15', roof: '#FEF08A', dir: 1 },
    { id: 2, x: 8, y: 10.6, speed: -0.045, color: '#4ADE80', roof: '#DCFCE7', dir: -1 }
  ]);

  // 말풍선 자동 타이머
  const triggerPlayerEmote = useCallback((text, emoteType = 'wave') => {
    playMetaSfx('interact');
    setPlayerBubble(text);
    playerRef.current.emote = emoteType;
    playerRef.current.emoteTimer = 120;
  }, []);

  // 층간 이동 실행 헬퍼 (MetaverseHub의 onChangeFloor와 직결!)
  const handleJumpToFloor = useCallback((flKey) => {
    playMetaSfx('elevator');
    setOpenModalZone(null);
    if (flKey !== '1F' && typeof onChangeFloor === 'function') {
      onChangeFloor(flKey);
    } else {
      setCurrentFloor(flKey);
      const flObj = FLOOR_INFO_MAP[flKey] || FLOOR_INFO_MAP['1F'];
      triggerPlayerEmote(`🛗 ${flObj.name} 안내 모드!`, 'wave');
    }
  }, [onChangeFloor, triggerPlayerEmote]);

  // 키보드 WASD / 방향키 & E키(상호작용) & 숫자키(1~4 액션) 이벤트
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (k === 'e') {
        const p = playerRef.current;
        const found = INTERACTION_ZONES.find(z => Math.hypot(p.x - z.x, p.y - z.y) <= z.radius);
        if (found) {
          playMetaSfx(found.isElevator ? 'elevator' : 'interact');
          setOpenModalZone(found);
        }
      } else if (k === '1') {
        triggerPlayerEmote('👋 할렐루야! 반갑습니다!', 'wave');
      } else if (k === '2') {
        triggerPlayerEmote('🫡 충성! 주님 안에서 축복합니다!', 'salute');
      } else if (k === '3') {
        playMetaSfx('interact');
        setOpenModalZone(INTERACTION_ZONES[0]);
      } else if (k === '4') {
        playMetaSfx('elevator');
        setOpenModalZone(INTERACTION_ZONES[3]);
      }
    };

    const onKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerPlayerEmote]);

  // =====================================================================
  // 🎨 2.5D 아이소메트릭 투영 변환기 & 3D 복셀 프리즘 드로잉 엔진
  // =====================================================================
  const TILE_W = 46;
  const TILE_H = 25;

  const worldToScreen = useCallback((wx, wy, wz = 0, camX = 0, camY = 0, zoom = 1) => {
    const isoX = (wx - wy) * (TILE_W * 0.5) * zoom + camX;
    const isoY = (wx + wy) * (TILE_H * 0.5) * zoom - (wz * zoom) + camY;
    return { x: isoX, y: isoY };
  }, []);

  const screenToWorld = useCallback((sx, sy, camX = 0, camY = 0, zoom = 1) => {
    const dx = (sx - camX) / ((TILE_W * 0.5) * zoom);
    const dy = (sy - camY) / ((TILE_H * 0.5) * zoom);
    const wx = (dx + dy) * 0.5;
    const wy = (dy - dx) * 0.5;
    return { x: wx, y: wy };
  }, []);

  // 1층 로비 이동 가능 영역(Walkable Collision Boundary) 체크
  const isWalkablePosition = (wx, wy) => {
    if (wx < -10.5 || wx > 8.2 || wy < -8.2 || wy > 8.2) return false;
    if (wx < -4.2 && wy < -2.2) return false;
    if (wx > -4.8 && wx < -2.6 && wy > 1.8 && wy < 3.6) return false;
    return true;
  };

  // 마우스 클릭 / 모바일 터치로 바닥 이동 및 오브젝트 클릭
  const handleCanvasPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const p = playerRef.current;
    const camOffset = worldToScreen(p.x, p.y, 0, 0, 0, cameraZoom);
    const centerX = rect.width * 0.5 - camOffset.x * 0.35;
    const centerY = rect.height * 0.48 - camOffset.y * 0.35;

    const targetWorld = screenToWorld(sx, sy, centerX, centerY, cameraZoom);

    // 클릭한 위치가 상호작용 존 내부이고 캐릭터와 가까우면 바로 모달 오픈
    const clickedZone = INTERACTION_ZONES.find(
      z => Math.hypot(targetWorld.x - z.x, targetWorld.y - z.y) <= z.radius * 0.85
    );
    if (clickedZone && Math.hypot(p.x - clickedZone.x, p.y - clickedZone.y) <= clickedZone.radius + 1.8) {
      playMetaSfx(clickedZone.isElevator ? 'elevator' : 'interact');
      setOpenModalZone(clickedZone);
      return;
    }

    // 이동 목표 좌표 설정
    const clampedX = Math.max(-10.2, Math.min(7.8, targetWorld.x));
    const clampedY = Math.max(-7.8, Math.min(7.8, targetWorld.y));
    p.tx = clampedX;
    p.ty = clampedY;
    playMetaSfx('step');
  };

  // =====================================================================
  // 🔄 60FPS 메인 3D 아이소메트릭 메타버스 렌더링 루프
  // =====================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let tick = 0;

    // 3D 육면체 블록(Voxel Box) 그리기 유틸리티
    const drawVoxelBox = (wx, wy, wz, w, d, h, topCol, leftCol, rightCol, strokeCol = 'rgba(15,23,42,0.18)', centerX, centerY, zoom) => {
      const p00 = worldToScreen(wx, wy, wz + h, centerX, centerY, zoom);
      const p10 = worldToScreen(wx + w, wy, wz + h, centerX, centerY, zoom);
      const p11 = worldToScreen(wx + w, wy + d, wz + h, centerX, centerY, zoom);
      const p01 = worldToScreen(wx, wy + d, wz + h, centerX, centerY, zoom);

      const b10 = worldToScreen(wx + w, wy, wz, centerX, centerY, zoom);
      const b11 = worldToScreen(wx + w, wy + d, wz, centerX, centerY, zoom);
      const b01 = worldToScreen(wx, wy + d, wz, centerX, centerY, zoom);

      // 좌측 벽면 (남서향)
      ctx.beginPath();
      ctx.moveTo(p01.x, p01.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(b11.x, b11.y);
      ctx.lineTo(b01.x, b01.y);
      ctx.closePath();
      ctx.fillStyle = leftCol;
      ctx.fill();
      if (strokeCol) {
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 우측 벽면 (남동향)
      ctx.beginPath();
      ctx.moveTo(p11.x, p11.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(b10.x, b10.y);
      ctx.lineTo(b11.x, b11.y);
      ctx.closePath();
      ctx.fillStyle = rightCol;
      ctx.fill();
      if (strokeCol) ctx.stroke();

      // 상단 천장면
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fillStyle = topCol;
      ctx.fill();
      if (strokeCol) ctx.stroke();
    };

    // 바닥 타일 폴리곤 그리기 유틸리티
    const drawFloorQuad = (wx, wy, w, d, fillCol, strokeCol, centerX, centerY, zoom, wz = 0) => {
      const p00 = worldToScreen(wx, wy, wz, centerX, centerY, zoom);
      const p10 = worldToScreen(wx + w, wy, wz, centerX, centerY, zoom);
      const p11 = worldToScreen(wx + w, wy + d, wz, centerX, centerY, zoom);
      const p01 = worldToScreen(wx, wy + d, wz, centerX, centerY, zoom);

      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fillStyle = fillCol;
      ctx.fill();
      if (strokeCol) {
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // 레퍼런스 스타일의 귀여운 3D 블록형 캐릭터(아바타) 그리기
    const drawBlockyCharacter = (wx, wy, wz, suitCol, hairCol, walkPhase, isPlayer, labelText, bubbleText, emote, centerX, centerY, zoom) => {
      const basePt = worldToScreen(wx, wy, wz, centerX, centerY, zoom);
      const s = zoom;
      const bounce = Math.abs(Math.sin(walkPhase)) * 3.5 * s;
      const legSwing = Math.sin(walkPhase) * 4.5 * s;

      ctx.save();
      ctx.translate(basePt.x, basePt.y);

      // 1) 바닥 사선 소프트 그림자
      ctx.beginPath();
      ctx.ellipse(6 * s, 2 * s, 14 * s, 7 * s, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fill();

      // 2) 다리 (좌/우 보행 스윙)
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-6 * s, (-10 + legSwing * 0.4) * s, 5 * s, 10 * s);
      ctx.fillRect(1 * s, (-10 - legSwing * 0.4) * s, 5 * s, 10 * s);

      // 3) 입체 몸통(Torso)
      ctx.translate(0, -bounce);
      ctx.fillStyle = suitCol;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.roundRect(-8 * s, -24 * s, 16 * s, 15 * s, 3 * s);
      ctx.fill();
      ctx.stroke();

      // 셔츠 넥타이/명찰 디테일
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2.5 * s, -23 * s, 5 * s, 6 * s);

      // 4) 양팔 (인사/경례 이모트 반영)
      ctx.fillStyle = suitCol;
      const leftArmY = emote === 'wave' ? -30 - Math.sin(tick * 12) * 4 : -22 - legSwing * 0.3;
      const rightArmY = emote === 'salute' ? -29 : -22 + legSwing * 0.3;
      ctx.fillRect(-12 * s, leftArmY * s, 4 * s, 11 * s);
      ctx.fillRect(8 * s, rightArmY * s, 4 * s, 11 * s);

      // 5) 3D 큐브형 머리(Head) & 블록 헤어스타일
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.roundRect(-9.5 * s, -41 * s, 19 * s, 17 * s, 4 * s);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.roundRect(-10.5 * s, -45 * s, 21 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.stroke();

      // 귀여운 눈동자 2개
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(-3.5 * s, -33 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.arc(3.5 * s, -33 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();

      // 6) 머리 위 둥근 흰색 캡슐 네임태그 (`● 나 · 단단한 관제탑`)
      if (labelText) {
        ctx.font = `bold ${Math.max(10, Math.round(11 * s))}px sans-serif`;
        const tw = ctx.measureText(labelText).width + 24 * s;
        const th = 22 * s;
        const tagY = -58 * s;

        ctx.fillStyle = isPlayer ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-tw / 2, tagY - th / 2, tw, th, 11 * s);
        ctx.fill();
        ctx.strokeStyle = isPlayer ? '#3B82F6' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-tw / 2 + 10 * s, tagY, 3.5 * s, 0, Math.PI * 2);
        ctx.fillStyle = isPlayer ? '#2563EB' : '#10B981';
        ctx.fill();

        ctx.fillStyle = isPlayer ? '#0F172A' : '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 4 * s, tagY);
      }

      // 7) 감정표현 말풍선
      if (bubbleText) {
        ctx.font = `bold ${Math.max(10, Math.round(10.5 * s))}px sans-serif`;
        const bw = ctx.measureText(bubbleText).width + 18 * s;
        const bh = 20 * s;
        const by = -82 * s;

        ctx.fillStyle = '#2563EB';
        ctx.beginPath();
        ctx.roundRect(-bw / 2, by - bh / 2, bw, bh, 8 * s);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bubbleText, 0, by);
      }

      ctx.restore();
    };

    const render = () => {
      tick += 0.016;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      // ── 1. 플레이어 이동 물리 연산 (키보드 WASD + 마우스 목표점 이동) ──
      const p = playerRef.current;
      const keys = keysRef.current;
      let moveDX = 0;
      let moveDY = 0;

      if (keys['w'] || keys['arrowup']) { moveDX -= 1; moveDY -= 1; }
      if (keys['s'] || keys['arrowdown']) { moveDX += 1; moveDY += 1; }
      if (keys['a'] || keys['arrowleft']) { moveDX -= 1; moveDY += 1; }
      if (keys['d'] || keys['arrowright']) { moveDX += 1; moveDY -= 1; }

      if (moveDX !== 0 || moveDY !== 0) {
        const len = Math.hypot(moveDX, moveDY);
        const nx = p.x + (moveDX / len) * p.speed;
        const ny = p.y + (moveDY / len) * p.speed;
        if (isWalkablePosition(nx, ny)) {
          p.x = nx;
          p.y = ny;
          p.tx = nx;
          p.ty = ny;
        }
        p.isMoving = true;
        p.walkCycle += 0.26;
      } else {
        const distToTarget = Math.hypot(p.tx - p.x, p.ty - p.y);
        if (distToTarget > 0.12) {
          const nx = p.x + ((p.tx - p.x) / distToTarget) * p.speed;
          const ny = p.y + ((p.ty - p.y) / distToTarget) * p.speed;
          if (isWalkablePosition(nx, ny)) {
            p.x = nx;
            p.y = ny;
          } else {
            p.tx = p.x;
            p.ty = p.y;
          }
          p.isMoving = true;
          p.walkCycle += 0.24;
        } else {
          p.isMoving = false;
          p.walkCycle = 0;
        }
      }

      if (p.emoteTimer > 0) {
        p.emoteTimer -= 1;
        if (p.emoteTimer === 0) {
          p.emote = null;
          setPlayerBubble(null);
        }
      }

      // 근접 상호작용 존(Trigger Zone) 감지
      const nearZone = INTERACTION_ZONES.find(z => Math.hypot(p.x - z.x, p.y - z.y) <= z.radius) || null;
      setActiveZone(prev => (prev?.id !== nearZone?.id ? nearZone : prev));

      // 카메라가 플레이어를 부드럽게 추적
      const camOffset = worldToScreen(p.x, p.y, 0, 0, 0, cameraZoom);
      const centerX = W * 0.5 - camOffset.x * 0.35;
      const centerY = H * 0.48 - camOffset.y * 0.35;

      // ── 2. 배경 캔버스 클리어 ──
      ctx.fillStyle = '#D9E6C3';
      ctx.fillRect(0, 0, W, H);

      // =====================================================================
      // 🛣️ [구역 A] 정문 앞 인도(Sidewalk) & 아스팔트 차도(Road)
      // =====================================================================
      drawFloorQuad(-14, 8.2, 26, 3.6, '#475569', '#334155', centerX, centerY, cameraZoom);
      for (let rx = -13; rx <= 10; rx += 2.2) {
        drawFloorQuad(rx, 9.9, 1.1, 0.18, '#FACC15', null, centerX, centerY, cameraZoom);
      }
      for (let cw = 8.4; cw <= 11.4; cw += 0.55) {
        drawFloorQuad(-3.2, cw, 2.4, 0.3, '#F8FAFC', null, centerX, centerY, cameraZoom);
      }

      for (let sx = -13; sx < 11; sx += 1) {
        for (let sy = 6.4; sy < 8.2; sy += 0.9) {
          drawFloorQuad(sx, sy, 1, 0.9, (Math.floor(sx + sy) % 2 === 0) ? '#E2E8F0' : '#CBD5E1', '#94A3B8', centerX, centerY, cameraZoom);
        }
      }

      // =====================================================================
      // 🅿️ [구역 B] 좌측 야외 주차장 (Parking Lot)
      // =====================================================================
      drawFloorQuad(-11.5, -2.5, 5.5, 8.9, '#64748B', '#475569', centerX, centerY, cameraZoom);
      [-1.5, 0.5, 2.5, 4.5].forEach(py => {
        drawFloorQuad(-11.0, py, 2.6, 0.12, '#F8FAFC', null, centerX, centerY, cameraZoom);
      });

      // =====================================================================
      // 🏛️ [구역 C] 1층 메인 로비 & 곡선형 안내 복도 & 엘리베이터 홀 바닥
      // =====================================================================
      for (let lx = -6; lx < 2.5; lx += 1) {
        for (let ly = -2; ly < 6.4; ly += 1) {
          const isCarpet = lx >= -3 && lx <= 0 && ly >= 0 && ly <= 5.5;
          drawFloorQuad(
            lx,
            ly,
            1,
            1,
            isCarpet ? '#1E3A8A' : (lx + ly) % 2 === 0 ? '#F8FAFC' : '#F1F5F9',
            '#E2E8F0',
            centerX,
            centerY,
            cameraZoom
          );
        }
      }

      for (let cx = -3.5; cx < 8.2; cx += 1) {
        for (let cy = -8.2; cy < -2; cy += 1) {
          if (cx + cy < -7.5) continue;
          const isElevHall = cx >= 4.5 && cy <= -4.5;
          drawFloorQuad(
            cx,
            cy,
            1,
            1,
            isElevHall ? '#DBEAFE' : (cx + cy) % 2 === 0 ? '#F1F5F9' : '#E2E8F0',
            '#CBD5E1',
            centerX,
            centerY,
            cameraZoom
          );
        }
      }

      for (let rx = 2.5; rx < 8.2; rx += 1) {
        for (let ry = -2; ry < 6.4; ry += 1) {
          drawFloorQuad(
            rx,
            ry,
            1,
            1,
            ry >= 2.0 ? '#E2E8F0' : '#F8FAFC',
            '#CBD5E1',
            centerX,
            centerY,
            cameraZoom
          );
        }
      }

      // =====================================================================
      // 🪜 [구역 D] 우측 하단 계단 & 우측 상단 계단
      // =====================================================================
      for (let step = 0; step < 6; step++) {
        const sy = 2.4 + step * 0.55;
        const depthColor = step % 2 === 0 ? '#94A3B8' : '#64748B';
        drawVoxelBox(3.5, sy, -step * 3, 4.2, 0.5, 3, depthColor, '#475569', '#334155', '#1E293B', centerX, centerY, cameraZoom);
      }

      for (let step = 0; step < 6; step++) {
        const sy = 0.8 - step * 0.48;
        drawVoxelBox(4.0, sy, step * 5.5, 3.6, 0.45, 5.5, '#F8FAFC', '#CBD5E1', '#94A3B8', '#64748B', centerX, centerY, cameraZoom);
      }

      // =====================================================================
      // 🟢 바닥 초록색 원형 상호작용 마커
      // =====================================================================
      INTERACTION_ZONES.forEach(zone => {
        const zPt = worldToScreen(zone.x, zone.y, 0, centerX, centerY, cameraZoom);
        const isHere = activeZone?.id === zone.id;
        const pulseR = (zone.radius * 18 + Math.sin(tick * 4) * 2.5) * cameraZoom;

        ctx.save();
        ctx.translate(zPt.x, zPt.y);
        ctx.scale(1, 0.55);

        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = isHere ? 'rgba(34, 197, 94, 0.28)' : 'rgba(34, 197, 94, 0.12)';
        ctx.fill();
        ctx.lineWidth = isHere ? 3.5 : 2.2;
        ctx.strokeStyle = zone.color;
        ctx.stroke();

        ctx.rotate(tick * 0.8);
        ctx.beginPath();
        ctx.arc(0, 0, pulseR * 0.76, 0, Math.PI * 2);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#15803D';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.translate(zPt.x, zPt.y - 26 * cameraZoom);
        ctx.fillStyle = isHere ? '#16A34A' : '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-14 * cameraZoom, -10 * cameraZoom, 28 * cameraZoom, 20 * cameraZoom, 10 * cameraZoom);
        ctx.fill();
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(10 * cameraZoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.code, 0, 0);
        ctx.restore();
      });

      // =====================================================================
      // ➡️ 진입 화살표 2개
      // =====================================================================
      [
        { x: -1.8, y: 7.2, label: '정문 출입구 ⬆' },
        { x: -7.2, y: 2.8, label: '주차장 출입구 ➡' }
      ].forEach(arr => {
        const apt = worldToScreen(arr.x, arr.y, 1, centerX, centerY, cameraZoom);
        ctx.save();
        ctx.translate(apt.x, apt.y);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
        ctx.beginPath();
        ctx.roundRect(-42 * cameraZoom, -10 * cameraZoom, 84 * cameraZoom, 20 * cameraZoom, 8 * cameraZoom);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(9.5 * cameraZoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(arr.label, 0, 0);
        ctx.restore();
      });

      // =====================================================================
      // 🧱 [건축물 벽면 & 가구 & 엘리베이터 & 차량] 입체 렌더링
      // =====================================================================
      const curveSegments = [
        [-6.0, -2.0, 0.4, 3.2],
        [-5.2, -3.5, 1.0, 1.6],
        [-4.2, -5.0, 1.0, 1.6],
        [-3.0, -6.5, 1.2, 1.6],
        [-1.8, -8.0, 1.4, 1.6]
      ];
      curveSegments.forEach(([wx, wy, w, d]) => {
        drawVoxelBox(wx, wy, 0, w, d, 52, '#E2E8F0', '#F8FAFC', '#CBD5E1', '#94A3B8', centerX, centerY, cameraZoom);
      });

      [
        [-1.2, -1.5, 0.35, 1.8],
        [-0.4, -3.0, 0.85, 1.5],
        [0.6, -4.4, 1.0, 1.4]
      ].forEach(([wx, wy, w, d]) => {
        drawVoxelBox(wx, wy, 0, w, d, 38, '#93C5FD', '#EFF6FF', '#BFDBFE', '#60A5FA', centerX, centerY, cameraZoom);
      });

      drawVoxelBox(-0.5, -8.4, 0, 8.8, 0.45, 58, '#CBD5E1', '#1E293B', '#0F172A', '#334155', centerX, centerY, cameraZoom);

      const boardPt = worldToScreen(1.8, -8.1, 32, centerX, centerY, cameraZoom);
      ctx.save();
      ctx.translate(boardPt.x, boardPt.y);
      ctx.transform(1, 0.27, 0, 1, 0, 0);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-85 * cameraZoom, -22 * cameraZoom, 170 * cameraZoom, 44 * cameraZoom, 6 * cameraZoom);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4ADE80';
      ctx.font = `bold ${Math.round(9.5 * cameraZoom)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('● GOOD TREE VISION BOARD', -75 * cameraZoom, -8 * cameraZoom);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = `bold ${Math.round(11 * cameraZoom)}px sans-serif`;
      ctx.fillText('1F 로비 · 새가족 환영 센터 100%', -75 * cameraZoom, 8 * cameraZoom);
      ctx.restore();

      // 우측 상단 엘리베이터 타워 (1F ~ 7F)
      drawVoxelBox(5.2, -8.2, 0, 2.8, 2.2, 68, '#94A3B8', '#E2E8F0', '#CBD5E1', '#475569', centerX, centerY, cameraZoom);
      drawVoxelBox(5.6, -6.0, 0, 1.8, 0.15, 44, '#64748B', '#38BDF8', '#0284C7', '#1E293B', centerX, centerY, cameraZoom);
      const elevLabelPt = worldToScreen(6.4, -6.0, 54, centerX, centerY, cameraZoom);
      ctx.save();
      ctx.translate(elevLabelPt.x, elevLabelPt.y);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-36 * cameraZoom, -9 * cameraZoom, 72 * cameraZoom, 18 * cameraZoom);
      ctx.fillStyle = '#4ADE80';
      ctx.font = `bold ${Math.round(10 * cameraZoom)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🛗 ELEV ${currentFloor}`, 0, 0);
      ctx.restore();

      // 1층 로비 새가족 안내 데스크 & 블루 소파 라운지
      drawVoxelBox(-4.5, 2.0, 0, 1.8, 1.2, 18, '#FFFFFF', '#1E3A8A', '#172554', '#0F172A', centerX, centerY, cameraZoom);
      drawVoxelBox(0.2, 3.6, 0, 1.6, 1.4, 11, '#BAE6FD', '#7DD3FC', '#38BDF8', '#0284C7', centerX, centerY, cameraZoom);

      [[-5.2, 0.5], [-5.2, 4.8], [2.2, 1.5]].forEach(([px, py]) => {
        drawVoxelBox(px, py, 0, 0.6, 0.6, 9, '#B45309', '#D97706', '#92400E', null, centerX, centerY, cameraZoom);
        const plantPt = worldToScreen(px + 0.3, py + 0.3, 14, centerX, centerY, cameraZoom);
        ctx.beginPath();
        ctx.arc(plantPt.x, plantPt.y, 8 * cameraZoom, 0, Math.PI * 2);
        ctx.fillStyle = '#16A34A';
        ctx.fill();
      });

      [
        { x: -10.2, y: -0.8, col: '#FACC15', roof: '#FEF08A' },
        { x: -10.2, y: 1.2, col: '#4ADE80', roof: '#DCFCE7' },
        { x: -10.2, y: 3.2, col: '#F8FAFC', roof: '#E2E8F0' }
      ].forEach(car => {
        drawVoxelBox(car.x, car.y, 0, 2.1, 1.1, 11, car.col, car.col, '#64748B', '#1E293B', centerX, centerY, cameraZoom);
        drawVoxelBox(car.x + 0.4, car.y + 0.15, 11, 1.2, 0.8, 8, car.roof, '#BAE6FD', '#7DD3FC', '#1E293B', centerX, centerY, cameraZoom);
      });

      carsRef.current.forEach(car => {
        car.x += car.speed;
        if (car.dir === 1 && car.x > 11) car.x = -13;
        if (car.dir === -1 && car.x < -13) car.x = 11;
        drawVoxelBox(car.x, car.y, 0, 2.0, 1.0, 10, car.color, car.color, '#475569', '#0F172A', centerX, centerY, cameraZoom);
        drawVoxelBox(car.x + 0.4, car.y + 0.1, 10, 1.1, 0.8, 7, car.roof, '#38BDF8', '#0284C7', '#0F172A', centerX, centerY, cameraZoom);
      });

      // =====================================================================
      // 👥 NPC 및 플레이어 캐릭터 Z-Index 정렬 렌더링
      // =====================================================================
      const entities = [
        ...LOBBY_NPCS.map(npc => ({ ...npc, isPlayer: false })),
        {
          id: 'player',
          name: `나 · ${playerName}`,
          x: p.x,
          y: p.y,
          suitColor: '#38BDF8',
          hairColor: '#D97706',
          walkCycle: p.walkCycle,
          isPlayer: true,
          bubble: playerBubble,
          emote: p.emote
        }
      ].sort((a, b) => (a.x + a.y) - (b.x + b.y));

      entities.forEach(ent => {
        drawBlockyCharacter(
          ent.x,
          ent.y,
          0,
          ent.suitColor,
          ent.hairColor,
          ent.walkCycle || 0,
          ent.isPlayer,
          ent.name,
          ent.isPlayer ? ent.bubble : null,
          ent.emote,
          centerX,
          centerY,
          cameraZoom
        );
      });

      ctx.restore();

      // ── 3. 우측 상단 미니맵 레이더 실시간 동기화 ──
      const mini = minimapRef.current;
      if (mini) {
        const mCtx = mini.getContext('2d');
        const mw = mini.width;
        const mh = mini.height;
        mCtx.clearRect(0, 0, mw, mh);

        mCtx.fillStyle = '#1E293B';
        mCtx.fillRect(0, 0, mw, mh);

        const toMini = (wx, wy) => ({
          mx: ((wx + 12) / 22) * mw,
          my: ((wy + 9) / 21) * mh
        });

        mCtx.fillStyle = '#64748B';
        mCtx.fillRect(6, 25, 28, 52);
        mCtx.fillStyle = '#E2E8F0';
        mCtx.fillRect(34, 14, 58, 65);
        mCtx.fillStyle = '#86EFAC';
        mCtx.fillRect(80, 8, 28, 24);
        mCtx.fillStyle = '#475569';
        mCtx.fillRect(0, 82, mw, 18);

        INTERACTION_ZONES.forEach(z => {
          const zp = toMini(z.x, z.y);
          mCtx.beginPath();
          mCtx.arc(zp.mx, zp.my, 3.5, 0, Math.PI * 2);
          mCtx.fillStyle = '#22C55E';
          mCtx.fill();
        });

        const pp = toMini(p.x, p.y);
        mCtx.beginPath();
        mCtx.arc(pp.mx, pp.my, 4.5, 0, Math.PI * 2);
        mCtx.fillStyle = '#38BDF8';
        mCtx.fill();
        mCtx.strokeStyle = '#FFFFFF';
        mCtx.lineWidth = 1.5;
        mCtx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cameraZoom, currentFloor, playerBubble, playerName, worldToScreen]);

  const floorMeta = FLOOR_INFO_MAP[currentFloor] || FLOOR_INFO_MAP['1F'];

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden select-none font-sans bg-[#D9E6C3] flex flex-col">
      
      {/* ── 1. 좌측 상단: 현재 층수 & 투어 미션 배지 ── */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/15 shadow-xl">
          <button
            onClick={() => setActiveScreen && setActiveScreen('home')}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black cursor-pointer"
          >
            ◀ 홈
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs sm:text-sm font-black tracking-tight">{floorMeta.name}</span>
            </div>
            <span className="text-[10.5px] text-slate-300 block">{floorMeta.sub}</span>
          </div>
        </div>

        <div className="bg-blue-600/95 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 w-max">
          <span>🏛️ 좋은나무 가상교회 투어 중</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {activeZone ? `ZONE ${activeZone.code}` : '자유 이동'}
          </span>
        </div>
      </div>

      {/* ── 2. 중앙 상단: 근접 시 자동으로 뜨는 `[E] 체험하기` 플로팅 프롬프트 ── */}
      {activeZone && (
        <div
          onClick={() => {
            playMetaSfx(activeZone.isElevator ? 'elevator' : 'interact');
            setOpenModalZone(activeZone);
          }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/95 hover:bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.28)] border-2 border-emerald-500 flex items-center gap-2.5 cursor-pointer animate-bounce"
        >
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
            E
          </span>
          <span className="text-xs sm:text-sm font-black tracking-tight">
            {activeZone.prompt}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            클릭 / E키
          </span>
        </div>
      )}

      {/* ── 3. 우측 상단: 실시간 미니맵 & 층별 빠른 이동 버튼 ── */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center">
          <canvas ref={minimapRef} width={120} height={104} className="rounded-xl border border-white/10" />
          <div className="flex items-center justify-between w-full px-1 mt-1.5 text-[10px] font-bold text-slate-300">
            <span>🗺️ 1F 로비 미니맵</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCameraZoom(z => Math.min(1.45, +(z + 0.15).toFixed(2)))}
                className="px-1.5 bg-white/10 hover:bg-white/20 rounded text-white cursor-pointer"
              >
                ＋
              </button>
              <button
                onClick={() => setCameraZoom(z => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                className="px-1.5 bg-white/10 hover:bg-white/20 rounded text-white cursor-pointer"
              >
                －
              </button>
            </div>
          </div>
        </div>

        {/* 우측 퀵 공간 워프 버튼 */}
        <div className="flex flex-col gap-1 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 text-[11px] font-black text-white shadow-lg">
          <button
            onClick={() => {
              playerRef.current.tx = -1.8;
              playerRef.current.ty = 5.5;
            }}
            className="px-2.5 py-1 rounded-xl hover:bg-white/15 text-left cursor-pointer"
          >
            🚶 정문 입구로
          </button>
          <button
            onClick={() => {
              playerRef.current.tx = -7.5;
              playerRef.current.ty = 1.5;
            }}
            className="px-2.5 py-1 rounded-xl hover:bg-white/15 text-left cursor-pointer"
          >
            🚗 좌측 주차장으로
          </button>
          <button
            onClick={() => {
              playerRef.current.tx = 6.2;
              playerRef.current.ty = -6.2;
            }}
            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-left cursor-pointer"
          >
            🛗 엘리베이터 홀로
          </button>
        </div>
      </div>

      {/* ── 4. 메인 2.5D 아이소메트릭 메타버스 캔버스 ── */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasPointerDown}
        onTouchStart={handleCanvasPointerDown}
        className="flex-1 w-full h-full cursor-pointer touch-none"
      />

      {/* ── 5. 하단 중앙: 다크 캡슐 4대 퀵 액션 독 ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
        <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-md">
          마우스 클릭 또는 WASD / 방향키로 로비와 주차장을 걸어보세요
        </div>

        <div className="bg-slate-950/92 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 sm:gap-5 text-white">
          {[
            { key: '1', icon: '👋', label: '인사', onClick: () => triggerPlayerEmote('👋 샬롬! 반갑습니다!', 'wave') },
            { key: '2', icon: '🫡', label: '경례', onClick: () => triggerPlayerEmote('🫡 주님의 이름으로 축복합니다!', 'salute') },
            { key: '3', icon: '🛡️', label: '교회 수칙', onClick: () => { playMetaSfx('interact'); setOpenModalZone(INTERACTION_ZONES[0]); } },
            { key: '4', icon: '🛗', label: '층별 이동', onClick: () => { playMetaSfx('elevator'); setOpenModalZone(INTERACTION_ZONES[3]); } }
          ].map(btn => (
            <button
              key={btn.key}
              onClick={btn.onClick}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer relative group"
            >
              <span className="absolute -top-1 right-1 text-[9px] font-mono text-sky-400 font-bold">{btn.key}</span>
              <span className="text-base sm:text-lg">{btn.icon}</span>
              <span className="text-[10.5px] font-bold text-slate-200 whitespace-nowrap">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. 체험존 상세 안내 & 엘리베이터 층간 이동 모달 ── */}
      {openModalZone && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpenModalZone(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-xs">
                  ZONE {openModalZone.code}
                </span>
                <span className="text-xs font-bold text-emerald-300">{openModalZone.badge}</span>
              </div>
              <button
                onClick={() => setOpenModalZone(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-0.5 rounded bg-white/5 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                {openModalZone.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5 break-keep">
                {openModalZone.desc}
              </p>
            </div>

            {/* 엘리베이터 / 계단 전용 전 층(1F, 3F~7F) 이동 버튼 패널 */}
            {openModalZone.isElevator && (
              <div className="space-y-2 pt-1 max-h-[48vh] overflow-y-auto pr-1 hide-scrollbar">
                <span className="text-xs font-black text-amber-300 block">
                  🛗 이동하실 층수를 선택해 주세요 (선택 즉시 해당 층 3D 공간으로 전환됩니다):
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(FLOOR_INFO_MAP).map(([flKey, flObj]) => (
                    <button
                      key={flKey}
                      onClick={() => handleJumpToFloor(flKey)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        currentFloor === flKey
                          ? 'bg-emerald-600/30 border-emerald-400 text-white font-black'
                          : 'bg-black/40 border-white/10 hover:bg-emerald-600/40 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black">{flObj.name}</div>
                        <div className="text-[10.5px] text-slate-400">{flObj.sub}</div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/10 shrink-0 ml-2">
                        {currentFloor === flKey ? '현재 층' : '이동 ➔'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 일반 존 상태 대시보드 */}
            {!openModalZone.isElevator && openModalZone.stats && (
              <div className="bg-black/40 rounded-2xl p-3 border border-white/10 space-y-2">
                {openModalZone.stats.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">{st.label}</span>
                    <span className="text-emerald-300 font-black">{st.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 특정 층 직통 워프 버튼 (예: 06번 존 -> 5층 식당 바로가기) */}
            {openModalZone.directFloor && (
              <button
                onClick={() => handleJumpToFloor(openModalZone.directFloor)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-colors"
              >
                🛗 {openModalZone.directFloor} 식당 · 연습실 3D 공간으로 바로 이동하기 ➔
              </button>
            )}

            {/* 실제 앱 메뉴(설교/주보/QT/양육) 연동 버튼 */}
            {openModalZone.actions && openModalZone.actions.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {openModalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOpenModalZone(null);
                      if (setActiveScreen) setActiveScreen(act.screen);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
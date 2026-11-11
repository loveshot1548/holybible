// src/metaverse/Sanctuary3F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🔗 유튜브 URL에서 11자리 Video ID 추출기 (예배노트 Sermon.js 호환)
// =====================================================================
const parseYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

const getSyncedSermonVideo = () => {
  try {
    const directUrl = localStorage.getItem('sermon_active_video_url') || localStorage.getItem('app_active_gisangogi_url');
    if (directUrl && parseYoutubeId(directUrl)) {
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '주일 대예배 말씀' };
    }
    const rawDaily = localStorage.getItem('qt_daily') || localStorage.getItem('dailyData') || localStorage.getItem('goodtree_daily_data');
    if (rawDaily) {
      const parsed = JSON.parse(rawDaily);
      const dates = Object.keys(parsed).sort().reverse();
      for (const d of dates) {
        const vUrl = parsed[d]?.sermonVideoUrl || parsed[d]?.sermonVideoId;
        if (vUrl && parseYoutubeId(vUrl)) {
          return {
            url: vUrl,
            id: parseYoutubeId(vUrl),
            title: parsed[d]?.sermonTitle || '주일 대예배 설교 말씀'
          };
        }
      }
    }
  } catch (_) {}
  return { url: '', id: '', title: '기적이 상식이 되는 5일의 기도' };
};

// =====================================================================
// 🎨 고해상도 캔버스 텍스처 & 리얼 원목 나뭇결(Wood Grain) 생성기
// =====================================================================
function makeCanvasTexture(drawFn, width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#AD6E2F') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 85; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 85) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 5, w * 0.7, y - Math.cos(i) * 5, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

// =====================================================================
// 🚧 장의자·벽·강단 충돌 방지(AABB) & 복도 자동 우회 경로 탐색기
// =====================================================================
const PEW_ROWS = [-2.2, -0.9, 0.4, 1.7, 3.0, 4.3];
const PEW_COLS = [
  { colId: 'L', x: -4.25, width: 2.75, name: '좌측석' },
  { colId: 'C', x: 0.0, width: 3.45, name: '중앙석' },
  { colId: 'R', x: 4.25, width: 2.75, name: '우측석' }
];

const AISLE_X_LEFT = -2.32;
const AISLE_X_RIGHT = 2.32;

const OBSTACLE_BOXES = [
  // 북쪽 강단 무대 전체
  { minX: -8.0, maxX: 8.0, minZ: -8.0, maxZ: -3.25 },
  // 우측 그랜드 피아노 충돌 박스
  { minX: 4.3, maxX: 7.2, minZ: -4.6, maxZ: -2.7 },
  // 장의자 3열 x 6줄 물리 충돌 박스
  ...PEW_ROWS.flatMap((rz) =>
    PEW_COLS.map((col) => ({
      minX: col.x - col.width / 2 - 0.15,
      maxX: col.x + col.width / 2 + 0.15,
      minZ: rz - 0.35,
      maxZ: rz + 0.38
    }))
  )
];

function isPointBlocked(x, z) {
  if (x < -6.3 || x > 6.3 || z < -3.2 || z > 6.2) return true;
  for (const box of OBSTACLE_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }
  return false;
}

function clampToWalkable(tx, tz) {
  let x = Math.max(-6.1, Math.min(6.1, tx));
  let z = Math.max(-3.0, Math.min(5.9, tz));

  for (const box of OBSTACLE_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      const distFront = Math.abs(z - box.minZ);
      const distBack = Math.abs(box.maxZ - z);
      z = distFront < distBack ? box.minZ - 0.1 : box.maxZ + 0.1;
    }
  }
  return [x, z];
}

function computeSmartPath(sx, sz, rawEx, rawEz) {
  const [ex, ez] = clampToWalkable(rawEx, rawEz);

  let directClear = true;
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    const ix = sx + ((ex - sx) * i) / steps;
    const iz = sz + ((ez - sz) * i) / steps;
    if (isPointBlocked(ix, iz)) {
      directClear = false;
      break;
    }
  }
  if (directClear) return [[ex, ez]];

  const bestAisleX =
    Math.abs(sx - AISLE_X_LEFT) + Math.abs(ex - AISLE_X_LEFT) <=
    Math.abs(sx - AISLE_X_RIGHT) + Math.abs(ex - AISLE_X_RIGHT)
      ? AISLE_X_LEFT
      : AISLE_X_RIGHT;

  return [
    [bestAisleX, sz],
    [bestAisleX, ez],
    [ex, ez]
  ];
}

// =====================================================================
// 📍 3층 대예배당 6대 인터랙션 존 정의 (피아노 우측 이동 반영)
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_welcome_pew',
    code: '01',
    subCode: '02',
    name: '중앙 새가족 환영 지정석',
    prompt: '01 새가족 환영석에 앉아 예배드리기',
    pos: [1.45, 0, 1.05],
    seatTarget: { x: 0.35, z: 0.28, rowLabel: '중앙 새가족 환영석 (3열)' },
    isSeatZone: true,
    badge: '01 새가족 환영석',
    title: '🪑 "좋은나무교회 환영합니다" 새가족 지정석',
    desc: '등받이에 새가족 환영 커버가 씌워진 본당 중앙 명당 좌석입니다. 착석하시면 즉시 정면 대형 설교 스크린이 켜지고 예배 영상이 재생됩니다!'
  },
  {
    id: 'zone_3f_aisle_guide',
    code: '01',
    subCode: '03',
    name: '중앙 통로 & 강대상 안내',
    prompt: '02 강대상 & 설교 영상 스크린 열기',
    pos: [-1.65, 0, -0.35],
    badge: '02 강대상 · 설교스크린',
    title: '✝️ 3층 대예배당 강대상 & 세로 루버 아트월',
    desc: '2단 동심원 간접조명 우물천장 아래 34줄 세로 원목 루버벽과 십자가 강대상, 양옆 대형 꽃꽂이 화분이 배치된 성전 중심부입니다.',
    actions: [
      { label: '📝 예배노트 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 열기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_3f_right_pew',
    code: '03',
    subCode: '03',
    name: '우측 성도석 & 채광 창가',
    prompt: '03 우측 창가 성도석에 착석하기',
    pos: [2.75, 0, 2.95],
    seatTarget: { x: 3.6, z: 1.58, rowLabel: '우측 창가 성도석 (4열)' },
    isSeatZone: true,
    badge: '03 우측 성도석',
    title: '☀️ 따뜻한 햇살이 비치는 우측 성도석',
    desc: '우측 4개의 채광 창문을 통해 부드러운 자연광이 들어오는 성도석 구역입니다.'
  },
  {
    id: 'zone_3f_band',
    code: '04',
    subCode: '04',
    name: '우측 찬양단 드럼부스 & 그랜드 피아노',
    prompt: '04 우측 그랜드 피아노 & 드럼부스 보기',
    pos: [2.85, 0, -2.65],
    badge: '04 피아노 · 드럼부스',
    title: '🎹 우측 그랜드 피아노 & 6각 아크릴 드럼 쉴드',
    desc: '강단 우측에 배치된 블랙 그랜드 피아노와 투명 아크릴 차음벽 드럼 세트, 2단 신디사이저 건반 구역입니다.'
  },
  {
    id: 'zone_3f_communion',
    code: '05',
    subCode: '05',
    name: '좌측 성찬·헌금 테이블 & 예배위원석',
    prompt: '05 좌측 성찬 테이블 & 예배위원석 보기',
    pos: [-3.8, 0, -2.65],
    badge: '05 성찬 · 위원석',
    title: '🍞 강단 좌측 원목 성찬 테이블 & 예배위원 대기석',
    desc: '강단 좌측에 마련된 성찬·헌금 위원 테이블과 대기 의자 구역입니다.'
  },
  {
    id: 'zone_3f_elev',
    code: '06',
    subCode: '06',
    name: '후면 방송실 창 & 1층 이동 엘리베이터',
    prompt: '06 후면 중층 방송실 안내 & 1F 로비 이동',
    pos: [-2.35, 0, 5.1],
    isElevator: true,
    badge: '06 후면 방송실 · 1F이동',
    title: '🎥 강대상 반대편(후면) 4층 방송실 유리창 & 1F 이동',
    desc: '강대상 정반대편 후면 2층에는 다크 프레임 방송실 통유리창과 발코니 보조 모니터가 설치되어 있으며, 엘리베이터로 1층 로비로 이동할 수 있습니다.'
  }
];

// =====================================================================
// 👥 [핵심 수정 2] NPC끼리 실시간으로 대화를 주고받는 성도 & 안내위원 데이터
// =====================================================================
const CONGREGATION_NPCS = [
  // 1) 중앙 통로를 걸어 다니며 성도들에게 인사하는 베이지 원피스 안내위원
  {
    id: 'usher_walking',
    name: '박권사 (안내)',
    x: -1.95,
    z: 0.25,
    patrolZ: [-1.4, 2.3],
    seated: false,
    isSkirt: true,
    rotY: 0.35,
    shirt: '#D8C3A5',
    pants: '#C8B294',
    hair: '#5C3A21',
    dialogues: [
      '할렐루야! 주일 예배에 오신 것을 환영합니다 😊',
      '김집사님 반갑습니다! 앞쪽 새가족석으로 편히 앉으세요~',
      '오늘 말씀과 찬양 가운데 큰 은혜 받으시길 축복합니다!'
    ]
  },
  // 2) 통로 옆에서 안내위원과 인사 나누는 성도
  {
    id: 'front_greeter',
    name: '김성도',
    x: -1.45,
    z: 1.58,
    seated: true,
    autoWave: true,
    shirt: '#EAB308',
    pants: '#0284C7',
    hair: '#78350F',
    dialogues: [
      '권사님 샬롬! 반갑게 맞아주셔서 감사합니다 🙏',
      '한 주간도 주님 은혜로 평안하셨어요?',
      '오늘 본당이 참 따뜻하고 은혜롭네요!'
    ]
  },
  // 3) 장의자에 착석해 서로 인사와 기도를 나누는 성도들
  {
    id: 'c1',
    name: '이집사',
    x: -0.55,
    z: -1.02,
    seated: true,
    shirt: '#A855F7',
    pants: '#334155',
    hair: '#5C3A21',
    dialogues: [
      '아멘! 오늘 설교 말씀이 마음에 깊이 와닿네요.',
      '조용히 기도로 주일 예배를 준비합니다 🙏'
    ]
  },
  {
    id: 'c2',
    name: '최청년',
    x: 1.05,
    z: 0.28,
    seated: true,
    shirt: '#22C55E',
    pants: '#1E293B',
    hair: '#5C3A21',
    dialogues: [
      '찬양팀 연주가 정말 은혜롭습니다 🎵',
      '새가족분들 우리 교회에 오신 것을 진심으로 환영해요!'
    ]
  },
  {
    id: 'c3',
    name: '정장로',
    x: 0.65,
    z: -2.32,
    seated: true,
    shirt: '#64748B',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '주님, 오늘 예배 가운데 성령으로 임재하여 주옵소서.',
      '성도님들 모두 한 주간 승리하셨습니다!'
    ]
  },
  {
    id: 'r1',
    name: '한권사',
    x: 3.15,
    z: -1.02,
    seated: true,
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '박집사님 옆자리에 함께 앉아 예배드리니 참 기쁘네요 🥰',
      '예배 후 5층 식당에서 애찬 나누며 교제해요!'
    ]
  },
  {
    id: 'r2',
    name: '윤집사',
    x: 4.15,
    z: -1.02,
    seated: true,
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#1C1917',
    dialogues: [
      '네 권사님! 함께 기도하며 말씀 들으니 힘이 납니다 💪',
      '할렐루야~ 주님께 감사와 찬양을 올려드립니다!'
    ]
  },
  {
    id: 'r3',
    name: '강자매',
    x: 3.85,
    z: 0.28,
    seated: true,
    shirt: '#E7E5E4',
    pants: '#A8A29E',
    hair: '#5C3A21',
    dialogues: [
      '예배노트에 오늘 주신 말씀 꼭 기록해 두어야겠어요 📝'
    ]
  },
  {
    id: 'r4',
    name: '조형제',
    x: 4.55,
    z: 1.58,
    seated: true,
    shirt: '#EF4444',
    pants: '#2563EB',
    hair: '#451A03',
    dialogues: [
      '우측 창가로 들어오는 햇살이 참 포근하네요 ☀️'
    ]
  }
];

// =====================================================================
// 👁️ 화면을 회전할 때 시야를 가리는 외벽을 자동으로 투명하게 만드는 컴포넌트
// =====================================================================
function SmartCutawayWall({ wallSide, minOpacity = 0.05, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 4.2) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -3.5) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 8.2) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.5) shouldFade = true;

    const targetOpacity = shouldFade ? minOpacity : 1.0;

    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.16);
        child.material.depthWrite = child.material.opacity > 0.45;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}

// =====================================================================
// 🟢 빛기둥 홀로그램 링 + 3D 원형 캡슐 마커
// =====================================================================
function HologramZoneMarker({ zone, isSelected, onSelect }) {
  const pulseRef = useRef();

  const badgeTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
      grad.addColorStop(0, '#34D399');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w / 2 - 18, h / 2, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#A7F3D0';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 68px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 18, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(20, 24, 32, 0.88)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 46, h / 2 + 10, 62, 42, 14);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 77, h / 2 + 32);
      }
    }, 320, 220);
  }, [zone.code, zone.subCode]);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05;
      pulseRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group
      position={zone.pos}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(zone);
      }}
    >
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[0.52, 0.62, 48]} />
        <meshBasicMaterial color="#34D399" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.52, 48]} />
        <meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.52, 0.58, 0.42, 32, 1, true]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Billboard position={[0.08, 0.48, 0]}>
        <mesh>
          <planeGeometry args={[0.82, 0.56]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 살아 움직이는 관절형 아바타 + NPC 실시간 대화 말풍선 빌보드
// =====================================================================
function SmoothChibiAvatar({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isSkirt = false,
  autoWave = false,
  hasSunglasses = false,
  emote = null,
  shirtColor = '#FACC15',
  pantsColor = '#2563EB',
  hairColor = '#B45309',
  skinColor = '#FDE68A',
  nameTagTexture = null,
  speechBubbleText = null,
  seedOffset = 0
}) {
  const outerGroupRef = useRef();
  const rootRef = useRef();
  const headGroupRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const patrolState = useRef({ z: position[2], dir: 1, pauseTimer: 0 });

  // NPC 대화 말풍선 캔버스 텍스처
  const bubbleTex = useMemo(() => {
    if (!speechBubbleText) return null;
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // 말풍선 본체
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(12, 10, w - 24, h - 34, 34);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      // 말풍선 아래 꼬리 삼각형
      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h - 24);
      ctx.lineTo(w / 2 + 14, h - 24);
      ctx.lineTo(w / 2, h - 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speechBubbleText.slice(0, 25), w / 2, (h - 24) / 2 + 4);
    }, 680, 120);
  }, [speechBubbleText]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime + seedOffset;
    let walkingNow = isWalking;

    if (patrolZ && outerGroupRef.current) {
      const st = patrolState.current;
      if (st.pauseTimer > 0) {
        st.pauseTimer -= delta;
        walkingNow = false;
      } else {
        walkingNow = true;
        st.z += st.dir * delta * 0.65;
        if (st.z > patrolZ[1]) {
          st.z = patrolZ[1];
          st.dir = -1;
          st.pauseTimer = 2.8;
        } else if (st.z < patrolZ[0]) {
          st.z = patrolZ[0];
          st.dir = 1;
          st.pauseTimer = 2.8;
        }
        outerGroupRef.current.position.z = st.z;
        outerGroupRef.current.rotation.y = st.dir > 0 ? 0.25 : Math.PI - 0.25;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        // 정면(-Z)을 바라보고 앉을 때 무릎이 앞으로 자연스럽게 굽혀지도록 설정
        leftLegRef.current.rotation.x = Math.PI / 2.1;
        rightLegRef.current.rotation.x = Math.PI / 2.1;
        leftLegRef.current.position.set(-0.09, 0.22, 0.12);
        rightLegRef.current.position.set(0.09, 0.22, 0.12);
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.58;
        leftLegRef.current.rotation.x = sw;
        rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.09, 0.22, 0);
        rightLegRef.current.position.set(0.09, 0.22, 0);
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.09, 0.22, 0);
        rightLegRef.current.position.set(0.09, 0.22, 0);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = 0.45 + Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = 0.45 + Math.cos(t * 2.2) * 0.04;
        rightArmRef.current.rotation.z = -0.1;
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.48;
        leftArmRef.current.rotation.x = -sw;
        rightArmRef.current.rotation.x = sw;
        rightArmRef.current.rotation.z = -0.12;
      } else {
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.06;
        rightArmRef.current.rotation.x = -Math.sin(t * 2) * 0.06;
        leftArmRef.current.rotation.z = 0.14;
        rightArmRef.current.rotation.z = -0.14;
      }
    }

    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = Math.sin(t * 2.6) * 0.06;
      headGroupRef.current.rotation.y = Math.cos(t * 1.4) * 0.08;
    }
    if (rootRef.current) {
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.01;
      rootRef.current.position.y = (isSeated ? 0.18 : 0) + bounce;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.28} />
      </mesh>

      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.09, 0.22, 0]}>
          <RoundedBox args={[0.12, 0.22, 0.13]} position={[0, -0.09, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={isSkirt ? skinColor : pantsColor} roughness={0.5} />
          </RoundedBox>
        </group>
        <group ref={rightLegRef} position={[0.09, 0.22, 0]}>
          <RoundedBox args={[0.12, 0.22, 0.13]} position={[0, -0.09, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={isSkirt ? skinColor : pantsColor} roughness={0.5} />
          </RoundedBox>
        </group>

        {isSkirt ? (
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.15, 0.26, 0.46, 24]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
        ) : (
          <RoundedBox args={[0.35, 0.36, 0.22]} position={[0, 0.38, 0]} radius={0.07} castShadow receiveShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
        )}

        <group ref={leftArmRef} position={[-0.22, 0.50, 0]}>
          <RoundedBox args={[0.10, 0.25, 0.11]} position={[0, -0.10, 0]} radius={0.045} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.22, 0.50, 0]}>
          <RoundedBox args={[0.10, 0.25, 0.11]} position={[0, -0.10, 0]} radius={0.045} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>

        <group ref={headGroupRef} position={[0, 0.78, 0]}>
          <RoundedBox args={[0.42, 0.39, 0.39]} radius={0.12} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.46, 0.16, 0.43]} position={[0, 0.16, -0.01]} radius={0.07} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.55} />
          </RoundedBox>
          <RoundedBox args={[0.45, 0.30, 0.20]} position={[0, 0.03, -0.13]} radius={0.07} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.55} />
          </RoundedBox>

          {hasSunglasses ? (
            <group position={[0, 0.01, 0.20]}>
              <RoundedBox args={[0.13, 0.08, 0.02]} position={[-0.08, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.13, 0.08, 0.02]} position={[0.08, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
            </group>
          ) : (
            <>
              <mesh position={[-0.085, 0.0, 0.198]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.085, 0.0, 0.198]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
            </>
          )}
        </group>

        {/* 플레이어 네임태그 */}
        {nameTagTexture && (
          <Billboard position={[0, 1.28, 0]}>
            <mesh renderOrder={12}>
              <planeGeometry args={[1.65, 0.36]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}

        {/* NPC 실시간 대화 말풍선 */}
        {bubbleTex && (
          <Billboard position={[0, 1.42, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[2.35, 0.42]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 3층 대예배당 초정밀 3D 씬 (장의자 2번 사진 완벽 고증 + 피아노 우측 + 방송실 후면!)
// =====================================================================
function SanctuaryMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnPew,
  onToggleScreenPlayer,
  sermonTitle,
  activeNpcChatIdx
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const stageWoodTex = useMemo(() => makeWoodGrainTexture('#E0AA6E', '#B87E42'), []);

  // =================================================================
  // 🪑 [핵심 수정 1] 2번 사진(분도가구·제천성민교회 장의자)과 100% 동일한 장의자 옆판(End Stanchion)
  // 앞쪽(-Z, 강대상 쪽)으로 좌석 팔걸이가 열려 있고, 뒤쪽(+Z)으로 등받이가 12도 기울어진 정통 교회 장의자 단면!
  // =================================================================
  const pewSideStanchionGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Shape X축이 회전 후 World Z축이 되도록 설계:
    // shape X < 0 : 앞쪽(강대상 방향 -Z) / shape X > 0 : 뒤쪽(등받이 방향 +Z)
    shape.moveTo(-0.26, 0.0);    // 앞쪽 바닥 다리
    shape.lineTo(0.24, 0.0);     // 뒤쪽 바닥 다리
    shape.lineTo(0.32, 0.88);    // 뒤로 살짝 기울어진 등받이 상단 뒤끝
    shape.lineTo(0.20, 0.90);    // 등받이 상단 둥근 몰딩 앞끝
    shape.lineTo(0.11, 0.46);    // 등받이 안쪽 경사면 내려와서 방석과 만나는 지점
    shape.lineTo(-0.24, 0.46);   // 팔걸이/방석 상단 앞끝
    shape.lineTo(-0.28, 0.36);   // 방석 앞코 라운드
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 4
    });
  }, []);

  const welcomeCoverTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 18);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('좋은나무교회', w / 2, h / 2 - 14);
      ctx.fillText('환영합니다', w / 2, h / 2 + 34);
    }, 420, 150);
  }, []);

  const standBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#D9F99D');
      grad.addColorStop(0.24, '#FFFFFF');
      grad.addColorStop(0.76, '#FFFFFF');
      grad.addColorStop(1, '#86EFAC');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#334155';
      ctx.font = '900 50px serif';
      ctx.textAlign = 'center';
      ctx.fillText('교 회', w / 2, h / 2 - 22);
      ctx.fillText('표어가', w / 2, h / 2 + 44);
    }, 256, 540);
  }, []);

  const bigScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.lineWidth = 6;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('김포 좋은나무교회 주일 대예배', w / 2, 90);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 56px serif';
      ctx.fillText(sermonTitle || '기적이 상식이 되는 5일의 기도', w / 2, 200);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('▶ 장의자에 앉거나 스크린을 클릭하면 예배 영상이 상영됩니다', w / 2, 310);
    }, 1024, 400);
  }, [sermonTitle]);

  return (
    <group>
      {/* 1. 본당 바닥 카펫 & 통로 러너 */}
      <RoundedBox args={[17.0, 0.2, 16.5]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#3D3E42" roughness={0.82} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_LEFT, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#484A50" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_RIGHT, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#484A50" roughness={0.85} />
      </mesh>

      {/* ================================================================= */}
      {/* 🎤 2. 정면(북쪽 -Z) 3단 우드 강단 & 세로 루버 아트월 & 대형 스크린 */}
      {/* ================================================================= */}
      <group position={[-0.6, 0, -5.2]}>
        <RoundedBox args={[10.8, 0.16, 3.5]} position={[0.4, 0.08, 0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[10.4, 0.16, 3.2]} position={[0.4, 0.24, 0.0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.36} />
        </RoundedBox>
        <RoundedBox args={[10.0, 0.16, 2.9]} position={[0.4, 0.40, -0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.34} />
        </RoundedBox>

        <SmartCutawayWall wallSide="north">
          <RoundedBox args={[17.0, 5.6, 0.26]} position={[0.6, 2.8, -1.75]} radius={0.02} receiveShadow>
            <meshStandardMaterial color="#E6CEB5" roughness={0.62} />
          </RoundedBox>
          <RoundedBox args={[6.8, 5.1, 0.08]} position={[-0.2, 2.65, -1.60]} radius={0.01}>
            <meshStandardMaterial color="#5C3418" roughness={0.6} />
          </RoundedBox>
          {Array.from({ length: 35 }).map((_, i) => (
            <RoundedBox
              key={`slat_${i}`}
              args={[0.095, 5.05, 0.09]}
              position={[-3.42 + i * 0.19, 2.65, -1.53]}
              radius={0.015}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
            </RoundedBox>
          ))}

          <group
            position={[-0.2, 3.45, -1.42]}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleScreenPlayer) onToggleScreenPlayer();
            }}
          >
            <RoundedBox args={[4.2, 2.05, 0.08]} radius={0.025} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[4.02, 1.88]} />
              <meshBasicMaterial map={bigScreenTex} />
            </mesh>
          </group>

          <RoundedBox args={[1.55, 2.25, 0.08]} position={[6.1, 1.12, -1.58]} radius={0.01} castShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.45} />
          </RoundedBox>
        </SmartCutawayWall>

        {[-2.85, 2.45].map((bx, bIdx) => (
          <group key={`banner_${bIdx}`} position={[bx, 1.48, -0.95]}>
            <RoundedBox args={[0.78, 2.05, 0.04]} radius={0.015} castShadow>
              <meshStandardMaterial color="#FFFFFF" />
            </RoundedBox>
            <mesh position={[0, 0, 0.024]}>
              <planeGeometry args={[0.74, 1.98]} />
              <meshBasicMaterial map={standBannerTex} />
            </mesh>
            <RoundedBox args={[0.52, 0.05, 0.36]} position={[0, -1.02, 0]} radius={0.01}>
              <meshStandardMaterial color="#475569" />
            </RoundedBox>
          </group>
        ))}

        {/* 중앙 십자가 원목 강대상 & 양옆 꽃꽂이 화분 */}
        <group position={[-0.2, 0.48, 0.15]}>
          <RoundedBox args={[1.22, 0.14, 0.68]} position={[0, 0.07, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[1.06, 0.84, 0.56]} position={[0, 0.52, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          <RoundedBox args={[1.20, 0.10, 0.66]} position={[0, 0.96, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.54, 0.29]}>
            <boxGeometry args={[0.05, 0.36, 0.02]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
          <mesh position={[0, 0.60, 0.29]}>
            <boxGeometry args={[0.22, 0.05, 0.02]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>

          {[-1.05, 1.05].map((fx, fIdx) => (
            <group key={`flw_${fIdx}`} position={[fx, 0, 0.06]}>
              <RoundedBox args={[0.48, 0.46, 0.48]} position={[0, 0.23, 0]} radius={0.02} castShadow>
                <meshStandardMaterial map={oakWoodTex} />
              </RoundedBox>
              <mesh position={[0, 0.58, 0]} castShadow>
                <sphereGeometry args={[0.34, 16, 16]} />
                <meshStandardMaterial color="#15803D" roughness={0.7} />
              </mesh>
              {[
                [0, 0.78, 0, '#FFFFFF', 0.12],
                [-0.15, 0.70, 0.15, '#F472B6', 0.11],
                [0.15, 0.70, 0.15, '#FB7185', 0.11],
                [-0.16, 0.68, -0.14, '#FBCFE8', 0.11],
                [0.16, 0.68, -0.14, '#FEF08A', 0.10]
              ].map(([bx, by, bz, bcol, brad], bi) => (
                <mesh key={bi} position={[bx, by, bz]} castShadow>
                  <sphereGeometry args={[brad, 10, 10]} />
                  <meshStandardMaterial color={bcol} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* 강단 좌측: 원목 성찬/헌금 테이블 & 예배위원 대기석 */}
        <RoundedBox args={[1.35, 0.78, 0.65]} position={[-4.2, 0.48, 0.85]} radius={0.025} castShadow>
          <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[0.55, 0.88, 0.52]} position={[-5.1, 0.52, 0.85]} radius={0.02} castShadow>
          <meshStandardMaterial map={oakWoodTex} />
        </RoundedBox>

        {/* 🎹 [핵심 수정 4] 그랜드 피아노를 오른쪽(강단 우측 찬양단 구역)으로 이동 배치! */}
        <group position={[5.85, 0.0, 1.35]} rotation={[0, -0.28, 0]}>
          <RoundedBox args={[1.45, 0.30, 1.75]} position={[0, 0.68, 0]} radius={0.06} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.25} />
          </RoundedBox>
          <RoundedBox args={[1.32, 0.06, 0.24]} position={[0, 0.64, 0.88]} radius={0.01}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {[[-0.58, -0.68], [0.58, -0.68], [0, 0.68]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.34, lz]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.68, 12]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          ))}
          <RoundedBox args={[0.76, 0.42, 0.36]} position={[0, 0.21, 1.28]} radius={0.03} castShadow>
            <meshStandardMaterial color="#27272A" />
          </RoundedBox>
        </group>

        {/* 🥁 우측 6각 투명 아크릴 드럼 부스 + 드럼 세트 + 2단 건반 */}
        <group position={[3.25, 0.48, -0.15]}>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((ang, ai) => (
            <mesh
              key={ai}
              position={[Math.sin(ang * 1.5) * 0.96, 0.75, Math.cos(ang * 1.5) * 0.96 - 0.1]}
              rotation={[0, ang * 1.5, 0]}
            >
              <boxGeometry args={[0.62, 1.48, 0.03]} />
              <meshStandardMaterial color="#E0F2FE" transparent opacity={0.32} roughness={0.08} />
            </mesh>
          ))}
          <mesh position={[0, 0.28, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.38, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[-0.28, 0.45, 0.12]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.14, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
          </mesh>
          {[[-0.35, 0.82, -0.05], [0.35, 0.86, -0.05], [0.0, 0.92, -0.25]].map(([cx, cy, cz], ci) => (
            <mesh key={ci} position={[cx, cy, cz]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.015, 20]} />
              <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>

        <group position={[4.55, 0, 0.35]} rotation={[0, -0.35, 0]}>
          <RoundedBox args={[1.22, 0.09, 0.36]} position={[0, 0.72, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#18181B" />
          </RoundedBox>
          <RoundedBox args={[1.12, 0.08, 0.30]} position={[0, 0.96, -0.12]} radius={0.015} castShadow>
            <meshStandardMaterial color="#18181B" />
          </RoundedBox>
          <mesh position={[0, 0.36, 0]} castShadow>
            <boxGeometry args={[0.85, 0.72, 0.05]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 💡 5. 천장 2단 동심원 간접조명 우물천장 + 매립 할로겐등 + 4단 스피커 */}
      {/* ================================================================= */}
      <group position={[0, 5.45, 0]}>
        <mesh position={[0, 0.15, -1.0]}>
          <boxGeometry args={[17.0, 0.2, 16.5]} />
          <meshStandardMaterial color="#EFE3D3" roughness={0.65} />
        </mesh>

        <group position={[-0.8, -0.08, -3.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.35, 0.26, 24, 72]} />
            <meshStandardMaterial color="#F7EFE4" roughness={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <torusGeometry args={[3.06, 0.10, 16, 72]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.9} />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <torusGeometry args={[2.05, 0.22, 24, 72]} />
            <meshStandardMaterial color="#F7EFE4" roughness={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <torusGeometry args={[1.80, 0.09, 16, 72]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.9} />
          </mesh>
        </group>

        {[[-3.85, 1.85]].map(() => null)}
        {[-3.85, 1.85].map((sx, idx) => (
          <group key={`line_spk_${idx}`} position={[sx, -1.05, -3.4]}>
            <mesh position={[0, 0.65, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 1.1, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            {[0.38, 0.12, -0.14, -0.40].map((sy, sIdx) => (
              <RoundedBox
                key={sIdx}
                args={[0.72, 0.24, 0.52]}
                position={[0, sy, sIdx * 0.05]}
                rotation={[0.14 + sIdx * 0.08, 0, 0]}
                radius={0.025}
                castShadow
              >
                <meshStandardMaterial color="#18181B" roughness={0.28} />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 🏢 6. 우측(동쪽) 벽면 채광창 4개 + [핵심 수정 5] 강대상 반대편(남쪽 후면) 4층 방송실 대형 유리벽! */}
      {/* ================================================================= */}
      <SmartCutawayWall wallSide="east">
        <RoundedBox args={[0.26, 5.4, 16.2]} position={[7.4, 2.7, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>
        {/* 우측 1층 채광 창문 4개 */}
        {[-2.4, -0.5, 1.4, 3.3].map((wz, wi) => (
          <group key={`rwin_${wi}`} position={[7.25, 1.45, wz]}>
            <RoundedBox args={[0.08, 1.55, 0.92]} radius={0.01}>
              <meshStandardMaterial color="#6B4423" />
            </RoundedBox>
            <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.82, 1.42]} />
              <meshStandardMaterial color="#FFFBEB" emissive="#FDE68A" emissiveIntensity={0.85} />
            </mesh>
          </group>
        ))}
      </SmartCutawayWall>

      {/* 🎥 [핵심 수정 5] 강대상 정반대편(남쪽 후면 벽, z = +7.2)으로 옮겨진 2층 발코니 & 4층 방송실 다크프레임 통유리창! */}
      <SmartCutawayWall wallSide="south" minOpacity={0.14}>
        {/* 후면 벽체 */}
        <RoundedBox args={[16.8, 5.4, 0.26]} position={[0, 2.7, 7.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>

        {/* 후면 2층 발코니 돌출 바닥 슬래브 & 강화유리 난간 */}
        <RoundedBox args={[14.6, 0.42, 2.2]} position={[0, 2.75, 6.0]} radius={0.025} receiveShadow>
          <meshStandardMaterial color="#EFE3D3" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 3.24, 4.92]}>
          <boxGeometry args={[14.4, 0.62, 0.04]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.36} roughness={0.1} />
        </mesh>
        <RoundedBox args={[14.4, 0.06, 0.07]} position={[0, 3.56, 4.92]} radius={0.01}>
          <meshStandardMaterial color="#785A46" roughness={0.4} />
        </RoundedBox>
        {[-6.0, -4.0, -2.0, 0.0, 2.0, 4.0, 6.0].map((px, pi) => (
          <RoundedBox key={`spost_${pi}`} args={[0.05, 0.72, 0.05]} position={[px, 3.22, 4.92]} radius={0.01}>
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </RoundedBox>
        ))}

        {/* 후면 발코니 정중앙 보조 모니터 (실제 교회 사진 완벽 고증!) */}
        <RoundedBox args={[1.8, 0.95, 0.10]} position={[0, 2.85, 4.84]} radius={0.02}>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>

        {/* 후면 2층 위쪽 4층 방송실 대형 다크프레임 통유리 부스 */}
        <group position={[0, 4.15, 7.02]}>
          <RoundedBox args={[10.6, 1.95, 0.14]} radius={0.01}>
            <meshStandardMaterial color="#27272A" />
          </RoundedBox>
          <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[10.2, 1.78]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.18} />
          </mesh>
          {[-3.4, -1.2, 1.2, 3.4].map((fx, fi) => (
            <RoundedBox key={fi} args={[0.08, 1.92, 0.16]} position={[fx, 0, 0]} radius={0.005}>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
          ))}
        </group>
      </SmartCutawayWall>

      {/* ================================================================= */}
      {/* 🪑 7. [핵심 수정 1] 2번 사진과 100% 동일한 정통 교회 원목 장의자(Pews) 3열 x 6줄 */}
      {/* (앞쪽 -Z로 좌석 방석이 열려 있고, 뒤쪽 +Z로 등받이가 12도 기울어진 오픈형 벤치 구조!) */}
      {/* ================================================================= */}
      {PEW_ROWS.map((rz, rIdx) =>
        PEW_COLS.map((col) => {
          const pewKey = `${col.colId}_${rIdx}`;
          const hasWelcomeCover =
            (col.colId === 'L' && (rIdx === 3 || rIdx === 4)) ||
            (col.colId === 'C' && (rIdx === 1 || rIdx === 2));
          const isCurrentSeatedPew =
            seatedInfo && Math.abs(seatedInfo.z - rz) < 0.35 && Math.abs(seatedInfo.x - col.x) < col.width * 0.6;

          return (
            <group
              key={pewKey}
              position={[col.x, 0, rz]}
              onClick={(e) => {
                e.stopPropagation();
                const clickX = Math.max(col.x - col.width * 0.36, Math.min(col.x + col.width * 0.36, e.point.x));
                onSitOnPew({
                  x: clickX,
                  z: rz - 0.06,
                  rowLabel: `${rIdx + 1}열 ${col.name}`
                });
              }}
            >
              {/* 1) 앞쪽(-Z)을 향해 열려 있는 원목 좌석 판 & 푹신한 브라운 가죽 방석 */}
              <RoundedBox args={[col.width - 0.10, 0.06, 0.44]} position={[0, 0.35, -0.04]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.14, 0.08, 0.42]} position={[0, 0.41, -0.05]} radius={0.025} castShadow receiveShadow>
                <meshStandardMaterial color="#7D6856" roughness={0.5} />
              </RoundedBox>

              {/* 2) 좌석 아래 다리 사이를 지지하는 하단 원목 보강판(Modesty Panel) */}
              <RoundedBox args={[col.width - 0.14, 0.26, 0.04]} position={[0, 0.18, 0.10]} radius={0.01} castShadow receiveShadow>
                <meshStandardMaterial map={oakWoodTex} roughness={0.42} />
              </RoundedBox>

              {/* 3) 뒤쪽(+Z)에 위치하며 뒤로 12도(0.18 rad) 살짝 기울어진 인체공학적 원목 등받이 & 등쿠션 */}
              <group position={[0, 0.64, 0.20]} rotation={[0.18, 0, 0]}>
                {/* 원목 등받이 본체 */}
                <RoundedBox
                  args={[col.width, 0.54, 0.07]}
                  position={[0, 0, 0]}
                  radius={0.02}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial map={oakWoodTex} color={isCurrentSeatedPew ? '#FDE047' : '#FFFFFF'} roughness={0.35} />
                </RoundedBox>
                {/* 등받이 상단 둥근 원목 몰딩 바 (2번 사진의 고급스러운 상단 탑레일!) */}
                <RoundedBox args={[col.width + 0.02, 0.06, 0.09]} position={[0, 0.27, 0]} radius={0.025} castShadow>
                  <meshStandardMaterial map={oakWoodTex} roughness={0.3} />
                </RoundedBox>
                {/* 등받이 앞면(-Z) 푹신한 가죽 등쿠션 */}
                <RoundedBox args={[col.width - 0.16, 0.40, 0.04]} position={[0, -0.02, -0.045]} radius={0.015}>
                  <meshStandardMaterial color="#8E7966" roughness={0.5} />
                </RoundedBox>
                {/* 등받이 뒷면(+Z) 뒷줄 성도용 성경/찬송가 수납 선반 (Book Rack) & 성경책 */}
                <RoundedBox args={[col.width - 0.24, 0.04, 0.12]} position={[0, -0.06, 0.08]} radius={0.01} castShadow>
                  <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
                </RoundedBox>
                <RoundedBox args={[0.24, 0.04, 0.15]} position={[-col.width * 0.26, 0.29, 0]} radius={0.008} castShadow>
                  <meshStandardMaterial color="#27272A" />
                </RoundedBox>
                <RoundedBox args={[0.24, 0.04, 0.15]} position={[col.width * 0.26, 0.29, 0]} radius={0.008} castShadow>
                  <meshStandardMaterial color="#27272A" />
                </RoundedBox>

                {/* '좋은나무교회 환영합니다' 하얀색 커버 배너 */}
                {hasWelcomeCover && (
                  <group position={[col.colId === 'C' ? 0.65 : -0.25, 0.16, 0]}>
                    <RoundedBox args={[0.86, 0.24, 0.11]} radius={0.015} castShadow>
                      <meshStandardMaterial color="#FFFFFF" />
                    </RoundedBox>
                    <mesh position={[0, 0, 0.058]}>
                      <planeGeometry args={[0.82, 0.21]} />
                      <meshBasicMaterial map={welcomeCoverTex} />
                    </mesh>
                    <mesh position={[0, 0, -0.058]} rotation={[0, Math.PI, 0]}>
                      <planeGeometry args={[0.82, 0.21]} />
                      <meshBasicMaterial map={welcomeCoverTex} />
                    </mesh>
                  </group>
                )}
              </group>

              {/* 4) 양끝 L자형 사선 커브 원목 옆판(Stanchions) — 앞쪽(-Z)이 열려 있고 뒤쪽(+Z)이 높은 정방향 배치! */}
              <mesh
                geometry={pewSideStanchionGeo}
                position={[-col.width / 2, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
              </mesh>
              <mesh
                geometry={pewSideStanchionGeo}
                position={[col.width / 2 + 0.08, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
              </mesh>
            </group>
          );
        })
      )}

      {/* 8. 서로 말풍선 대화를 주고받으며 살아 움직이는 성도 & 안내위원 NPC 아바타들 */}
      {CONGREGATION_NPCS.map((npc, idx) => {
        const isSpeakingNow = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % CONGREGATION_NPCS.length;
        const msgList = npc.dialogues || [];
        const currentMsg = isSpeakingNow && msgList.length > 0
          ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}`
          : null;

        return (
          <SmoothChibiAvatar
            key={npc.id}
            position={[npc.x, 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.seated ? Math.PI : (npc.rotY || 0)}
            isSeated={npc.seated}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={currentMsg}
            seedOffset={idx * 1.7}
          />
        );
      })}

      {/* 9. 바닥 초록색 홀로그램 원형 마커 (01, 02, 03) */}
      {ZONES_3F.slice(0, 3).map((z) => (
        <HologramZoneMarker
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(selectedZone) => {
            if (selectedZone.isSeatZone && selectedZone.seatTarget) {
              onSitOnPew(selectedZone.seatTarget);
            } else {
              onSelectZone(selectedZone);
            }
          }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 플레이어 아바타 ('나 · 정신동') 스마트 통로 우회 이동 컨트롤러
// =====================================================================
function PlayerController3F({
  waypoints,
  seatedInfo,
  playerName,
  emote,
  onPositionUpdate
}) {
  const posRef = useRef([0.35, 0, 0.28]);
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [0.35, 0, 0.28],
    rotY: Math.PI,
    walking: false
  });

  useEffect(() => {
    wpIndexRef.current = 0;
  }, [waypoints]);

  const nameTagTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = 'rgba(30, 33, 40, 0.95)';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 48);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(52, h / 2, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`나 · ${playerName}`, w / 2 + 18, h / 2 + 2);
    }, 520, 110);
  }, [playerName]);

  useFrame((_, delta) => {
    if (seatedInfo) {
      posRef.current = [seatedInfo.x, 0, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: Math.PI,
          walking: false
        });
      }
      return;
    }

    if (!waypoints || waypoints.length === 0) return;
    const currentTarget = waypoints[Math.min(wpIndexRef.current, waypoints.length - 1)];
    if (!currentTarget) return;

    const [cx, , cz] = posRef.current;
    const [tx, tz] = currentTarget;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 3.8);
      const nx = cx + (dx / dist) * step;
      const nz = cz + (dz / dist) * step;
      posRef.current = [nx, 0, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, 0, nz],
        rotY: angle,
        walking: true
      });
      onPositionUpdate(nx, nz);
    } else {
      if (wpIndexRef.current < waypoints.length - 1) {
        wpIndexRef.current += 1;
      } else if (renderState.walking) {
        setRenderState((prev) => ({ ...prev, walking: false }));
      }
    }
  });

  return (
    <SmoothChibiAvatar
      position={renderState.pos}
      rotationY={renderState.rotY}
      isWalking={renderState.walking}
      isSeated={Boolean(seatedInfo)}
      hasSunglasses={true}
      emote={emote}
      shirtColor="#FACC15"
      pantsColor="#0284C7"
      hairColor="#EAB308"
      nameTagTexture={nameTagTex}
    />
  );
}

// =====================================================================
// 🎥 [핵심 수정 3] 최초 1회만 기본 시점을 잡아주고, 이후에는 유저가 100% 자유롭게 카메라를 이동/회전할 수 있도록 보장!
// =====================================================================
function InitialCameraSetup({ controlsRef }) {
  const { camera, size } = useThree();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isMobilePortrait = size.width < 640;
    if (isMobilePortrait) {
      camera.position.set(-9.6, 4.4, 10.2);
      camera.fov = 42;
    } else {
      camera.position.set(-7.6, 3.45, 7.8);
      camera.fov = 34;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0.5, 1.35, -1.5);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function Sanctuary3F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [waypoints, setWaypoints] = useState([[0.35, 0.28]]);
  const [seatedInfo, setSeatedInfo] = useState({ x: 0.35, z: 0.28, rowLabel: '중앙 새가족 환영석 (3열)' });
  const [activeZone, setActiveZone] = useState(ZONES_3F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  // NPC끼리 실시간 대화를 주고받는 타이머 인덱스
  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % CONGREGATION_NPCS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const triggerEmote = (type) => {
    setEmote(type);
    setTimeout(() => setEmote(null), 2200);
  };

  // 카메라 시점을 초기 황금 각도로 리셋하는 헬퍼
  const handleResetCameraView = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    cam.position.set(-7.6, 3.45, 7.8);
    controlsRef.current.target.set(0.5, 1.35, -1.5);
    controlsRef.current.update();
  };

  const handleSitOnPew = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
    setIsScreenPlaying(true);
  }, []);

  const handleStandUp = useCallback(() => {
    const curX = seatedInfo ? seatedInfo.x : 0.35;
    const curZ = seatedInfo ? seatedInfo.z : 0.28;
    const exitX = curX < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT;
    setSeatedInfo(null);
    setIsScreenPlaying(false);
    setWaypoints([[exitX, curZ - 0.38]]);
  }, [seatedInfo]);

  const handleWalkToPoint = useCallback((targetX, targetZ) => {
    const startX = seatedInfo ? (seatedInfo.x < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT) : (waypoints[waypoints.length - 1]?.[0] || 0);
    const startZ = seatedInfo ? seatedInfo.z - 0.38 : (waypoints[waypoints.length - 1]?.[1] || 0);
    if (seatedInfo) setSeatedInfo(null);

    const path = computeSmartPath(startX, startZ, targetX, targetZ);
    setWaypoints(path);
  }, [seatedInfo, waypoints]);

  useEffect(() => {
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E2026';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w * 0.5, h * 0.52);

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(44, -8);
    ctx.lineTo(0, 18);
    ctx.lineTo(-44, -8);
    ctx.closePath();
    ctx.fillStyle = '#4B5563';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-44, -8);
    ctx.lineTo(0, -32);
    ctx.lineTo(0, -45);
    ctx.lineTo(-44, -21);
    ctx.closePath();
    ctx.fillStyle = '#E6CEB5';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(44, -8);
    ctx.lineTo(44, -21);
    ctx.lineTo(0, -45);
    ctx.closePath();
    ctx.fillStyle = '#D4B595';
    ctx.fill();

    ctx.strokeStyle = '#C88242';
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-16 + i * 5, -12 + i * 3);
      ctx.lineTo(14 + i * 5, 2 + i * 3);
      ctx.stroke();
    }

    ctx.restore();
  }, [waypoints, seatedInfo]);

  const handleSaveYoutubeLink = () => {
    const vid = parseYoutubeId(videoUrlInput);
    if (!vid) {
      alert('올바른 유튜브 영상 주소(URL)를 입력해 주세요.');
      return;
    }
    setYoutubeId(vid);
    setIsScreenPlaying(true);
    localStorage.setItem('sermon_active_video_url', videoUrlInput.trim());
    localStorage.setItem('app_active_gisangogi_url', videoUrlInput.trim());
    setShowVideoModal(false);
  };

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_3F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  const darkPillStyle = {
    backgroundColor: 'rgba(34, 36, 42, 0.94)',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.14)'
  };

  return (
    <div
      translate="no"
      style={{ backgroundColor: '#2B2C30' }}
      className="notranslate w-full h-full relative overflow-hidden select-none font-sans"
    >
      {/* ── 1. 좌측 상단: 다크 캡슐 헤더 & 카메라 자유이동 안내 ── */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-md shadow-2xl border flex items-center gap-3 cursor-pointer hover:opacity-95"
        >
          <span style={{ color: '#FFFFFF' }} className="text-sm sm:text-lg font-black tracking-tight">
            ◀ 3F 대예배당 본당
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              if (seatedInfo) handleStandUp();
              else handleSitOnPew({ x: 0.35, z: 0.28, rowLabel: '중앙 새가족 환영석 (3열)' });
            }}
            style={darkPillStyle}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold border shadow-xl cursor-pointer flex items-center gap-1.5"
          >
            <span>🚶</span>
            <span style={{ color: '#FFFFFF' }}>{seatedInfo ? '자리에서 일어나기' : '새가족석 착석하기'}</span>
          </button>

          <button
            onClick={() => setActiveScreen && setActiveScreen('sermon')}
            style={darkPillStyle}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold border shadow-xl cursor-pointer"
          >
            <span style={{ color: '#FFFFFF' }}>예배노트 열기</span>
          </button>

          <button
            onClick={handleResetCameraView}
            style={darkPillStyle}
            className="px-3 py-1.5 sm:py-2 rounded-full text-[11px] font-bold border shadow-xl cursor-pointer"
            title="좌클릭 드래그: 360도 회전 / 우클릭 드래그: 카메라 위치 이동 / 휠: 줌인·아웃"
          >
            <span style={{ color: '#93C5FD' }}>🎥 시점 초기화</span>
          </button>
        </div>
      </div>

      {/* ── 2. 우측 상단: [01·02·03 + 3D 맵 + 04~06] ── */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-start gap-1.5 sm:gap-2">
          <div className="flex flex-col gap-1.5">
            {ZONES_3F.slice(0, 3).map((z, idx) => (
              <button
                key={z.id}
                onClick={() => {
                  if (z.isSeatZone && z.seatTarget) handleSitOnPew(z.seatTarget);
                  else {
                    handleWalkToPoint(z.pos[0], z.pos[2]);
                    setActiveZone(z);
                    setModalZone(z);
                  }
                }}
                style={darkPillStyle}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full font-mono font-black text-[11px] sm:text-xs border shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              >
                <span style={{ color: '#FFFFFF' }}>0{idx + 1}</span>
              </button>
            ))}
          </div>

          <div
            onClick={() => onChangeFloor && onChangeFloor('1F')}
            title="클릭 시 1층 로비로 이동"
            style={darkPillStyle}
            className="p-1.5 sm:p-2 rounded-2xl border shadow-2xl flex flex-col items-start cursor-pointer"
          >
            <canvas ref={minimapRef} width={104} height={82} className="rounded-xl w-[88px] h-[70px] sm:w-[114px] sm:h-[90px]" />
            <span style={{ color: '#FFFFFF' }} className="text-[10px] sm:text-[11px] font-extrabold pl-1 mt-1">
              3D 맵
            </span>
          </div>
        </div>

        <div
          style={darkPillStyle}
          className="px-2 sm:px-2.5 py-2.5 rounded-2xl border shadow-xl flex flex-col items-center gap-1 font-mono text-[11px] sm:text-xs font-black"
        >
          {ZONES_3F.slice(3, 6).map((z, idx) => (
            <React.Fragment key={z.id}>
              <button
                onClick={() => {
                  if (z.isElevator && onChangeFloor) onChangeFloor('1F');
                  else {
                    handleWalkToPoint(z.pos[0], z.pos[2]);
                    setActiveZone(z);
                    setModalZone(z);
                  }
                }}
                style={{ color: '#FFFFFF' }}
                className="hover:opacity-80 cursor-pointer"
              >
                {z.code}
              </button>
              {idx < 2 && <span style={{ color: '#9CA3AF' }} className="text-[9px]">~</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 3. 설교 유튜브 재생 플레이어 모달 ── */}
      {isScreenPlaying && (
        <div
          style={{ backgroundColor: '#090D16', borderColor: '#F59E0B', color: '#FFFFFF' }}
          className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[480px] border-2 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in"
        >
          <div
            style={{ backgroundColor: '#111827' }}
            className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ backgroundColor: '#E11D48', color: '#FFFFFF' }} className="px-2 py-0.5 rounded text-[10px] font-mono font-black">
                LIVE SCREEN
              </span>
              <span style={{ color: '#FFFFFF' }} className="text-xs font-bold truncate">
                {seatedInfo ? `${seatedInfo.rowLabel} 예배 중 · ` : ''}{sermonTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowVideoModal(true)}
                style={{ color: '#FCD34D' }}
                className="text-[11px] font-bold hover:underline px-1.5 cursor-pointer"
              >
                링크변경
              </button>
              <button
                onClick={() => setIsScreenPlaying(false)}
                style={{ color: '#E5E7EB' }}
                className="text-xs font-bold px-1.5 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>
          </div>

          <div className="w-full aspect-video bg-black relative">
            {youtubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`}
                title="Sanctuary Live Sermon"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
                <p style={{ color: '#D1D5DB' }} className="text-xs">등록된 설교 유튜브 링크가 없습니다.</p>
                <button
                  onClick={() => setShowVideoModal(true)}
                  style={{ backgroundColor: '#F59E0B', color: '#090D16' }}
                  className="px-4 py-2 rounded-xl font-black text-xs cursor-pointer"
                >
                  🔗 유튜브 링크 입력하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. 하단 중앙: 5대 독립 원형 캡슐 독 바 ── */}
      <div className="absolute bottom-14 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-3 pointer-events-auto max-w-[96vw] overflow-x-auto hide-scrollbar px-2 py-1">
        {[
          { icon: '📖', label: '본문 말씀', sub: '', onClick: () => setModalZone(ZONES_3F[1]) },
          { icon: '📝', label: '자유 메모장', sub: '', onClick: () => setActiveScreen && setActiveScreen('sermon') },
          { icon: '📌', label: '설교 3대지', sub: '', onClick: () => setIsScreenPlaying(prev => !prev) },
          { icon: '🔬', label: '원어 사전', sub: '(QT형)', onClick: () => setActiveScreen && setActiveScreen('interlinear') },
          { icon: '🙏', label: '감사 선포', sub: '', onClick: () => triggerEmote('wave') }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            style={darkPillStyle}
            className="w-[64px] h-[60px] sm:w-[86px] sm:h-[76px] shrink-0 rounded-[22px] sm:rounded-[26px] backdrop-blur-xl border shadow-[0_14px_30px_rgba(0,0,0,0.55)] flex flex-col items-center justify-center gap-0.5 sm:gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-base sm:text-xl leading-none">{item.icon}</span>
            <span style={{ color: '#FFFFFF' }} className="text-[10px] sm:text-[11px] font-extrabold leading-tight whitespace-nowrap">
              {item.label}
            </span>
            {item.sub && (
              <span style={{ color: '#D1D5DB' }} className="text-[8.5px] sm:text-[9px] font-bold leading-none">
                {item.sub}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 5. 메인 3D 캔버스 — 카메라 자유 이동(회전·패닝·줌 100% 개방) ── */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[-7.6, 3.45, 7.8]} fov={34} near={0.1} far={250} />
        <InitialCameraSetup controlsRef={controlsRef} />

        <ambientLight intensity={1.3} color="#FFF8EE" />
        <hemisphereLight args={['#FFF5E4', '#8C7A6B', 1.15]} />
        <directionalLight
          position={[-6, 9, 8]}
          intensity={1.45}
          color="#FFF3DC"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[-0.8, 4.6, -3.5]} intensity={2.8} distance={18} color="#FDE047" />
        <pointLight position={[3.5, 3.2, 0.5]} intensity={1.5} distance={15} color="#FEF3C7" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkToPoint(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[16.0, 16.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SanctuaryMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.pos) handleWalkToPoint(z.pos[0], z.pos[2]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnPew={handleSitOnPew}
          onToggleScreenPlayer={() => setIsScreenPlaying(prev => !prev)}
          sermonTitle={sermonTitle}
          activeNpcChatIdx={activeNpcChatIdx}
        />

        <PlayerController3F
          waypoints={waypoints}
          seatedInfo={seatedInfo}
          playerName={playerName}
          emote={emote}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.38} scale={24} blur={2.2} far={4} />
        
        {/* 🎥 [핵심 수정 3] 360도 자유 회전 + 상하좌우 카메라 패닝(이동) + 근접/원거리 줌 100% 개방! */}
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.07}
          minDistance={2.2}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* ── 6. 유튜브 링크 설정 모달 ── */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span style={{ color: '#FCD34D' }} className="text-sm font-black">📺 3층 대예배당 전면 스크린 유튜브 연동</span>
              <button onClick={() => setShowVideoModal(false)} style={{ color: '#9CA3AF' }} className="text-xs cursor-pointer">
                ✕ 닫기
              </button>
            </div>
            <div className="space-y-2">
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block">설교 제목</label>
              <input
                type="text"
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none"
              />
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block pt-1">유튜브 영상 링크 (URL)</label>
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtu.be/..."
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowVideoModal(false)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D1D5DB' }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveYoutubeLink}
                style={{ backgroundColor: '#10B981', color: '#030712' }}
                className="flex-1 py-2.5 rounded-xl font-black text-xs cursor-pointer"
              >
                본당 스크린에 상영하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. 구역 상세 안내 모달 ── */}
      {modalZone && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalZone(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span style={{ backgroundColor: '#10B981', color: '#030712' }} className="px-2.5 py-1 rounded-full font-black text-xs">
                {modalZone.badge}
              </span>
              <button onClick={() => setModalZone(null)} style={{ color: '#9CA3AF' }} className="text-xs font-bold cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            <h3 style={{ color: '#FFFFFF' }} className="text-base sm:text-lg font-black">{modalZone.title}</h3>
            <p style={{ color: '#D1D5DB' }} className="text-xs leading-relaxed break-keep">{modalZone.desc}</p>

            {modalZone.actions && modalZone.actions.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {modalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setModalZone(null);
                      if (setActiveScreen) setActiveScreen(act.screen);
                    }}
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                    className="py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer shadow-md"
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
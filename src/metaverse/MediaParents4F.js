// src/metaverse/MediaParents4F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

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
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '주일 대예배 실황' };
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

function makeMaruFloorTexture(baseHex = '#E5C195', plankLineHex = '#C69863') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    const rows = 16;
    const rowH = h / rows;
    ctx.strokeStyle = plankLineHex;
    ctx.lineWidth = 2;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const cols = 4;
      for (let c = 1; c < cols; c++) {
        const x = ((c + (r % 2) * 0.5) / cols) * w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
  }, 512, 512);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#10B981') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.roundRect(12, 12, w - 24, h - 24, 34);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = badgeColor;
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 56);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(title, w / 2, 126);
  }, 400, 180);
}

const ZONES_4F = [
  {
    id: 'zone_4f_elev',
    code: '01',
    subCode: '엘베',
    name: '4F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F·3F·6F 이동)',
    pos: [0.2, 0, 4.3],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 4층 유아실(자모실) 엘리베이터 홀',
    desc: '도면 하단 중앙에 위치한 엘리베이터 홀입니다. 1층·3층·6층으로 이동할 수 있습니다.'
  },
  {
    id: 'zone_4f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 계단실',
    prompt: '02 계단실 (3층 본당 도보 이동)',
    pos: [-2.8, 0, 4.2],
    isElevator: true,
    badge: '02 좌측 계단실',
    title: '🪜 4층 좌측 하단 계단실 (3F 본당 직결)',
    desc: '도면 좌측 하단에 위치한 계단실입니다.'
  },
  {
    id: 'zone_4f_maru_left',
    code: '03',
    subCode: '좌마루',
    name: '좌측 온돌 마루 예배실 & 코너 TV',
    prompt: '03 좌측 마루 방석에 앉아 예배드리기',
    pos: [-2.8, 0, 0.2],
    seatTarget: { x: -2.8, z: -0.5, rowLabel: '4F 좌측 마루 예배석' },
    isSeatZone: true,
    badge: '03 좌측 마루실',
    title: '👶 4층 좌측 온돌 마루 예배실 (영아·부모 쉼터)',
    desc: '따뜻한 온돌 마루 위에 좌식 방석과 아기 범퍼침대가 준비된 좌측 마루방입니다.'
  },
  {
    id: 'zone_4f_maru_right',
    code: '04',
    subCode: '우마루',
    name: '우측 온돌 마루 예배실 & 코너 TV',
    prompt: '04 우측 마루 방석에 앉아 예배드리기',
    pos: [3.2, 0, 0.2],
    seatTarget: { x: 3.6, z: -0.4, rowLabel: '4F 우측 마루 예배석' },
    isSeatZone: true,
    badge: '04 우측 마루실',
    title: '🧸 4층 우측 온돌 마루 예배실 (유아 놀이·예배존)',
    desc: '중앙 유리 파티션 우측에 위치한 두 번째 온돌 마루방입니다.'
  },
  {
    id: 'zone_4f_front_glass',
    code: '05',
    subCode: '전면유리',
    name: '상단 전면 통유리 관람창 (3F 본당 조망)',
    prompt: '05 전면 통유리창 & 중계 TV 설정',
    pos: [-1.5, 0, -4.1],
    badge: '05 전면 통유리창',
    title: '🪟 3층 대예배당이 한눈에 내려다보이는 전면 방음 통유리창',
    desc: '도면 맨 위쪽(유리 ↓)에 길게 뻗은 대형 통유리 관람창입니다.',
    actions: [
      { label: '📝 예배노트 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 열기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_4f_center_glass',
    code: '06',
    subCode: '중앙유리',
    name: '좌·우 마루 연결문 & 중앙 유리 파티션',
    prompt: '06 중앙 유리 가벽 & 마루 연결문',
    pos: [0.8, 0, 1.55],
    badge: '06 중앙 유리 가벽',
    title: '🚪 좌·우 마루 사이 중앙 유리창(유리 ↘) & 연결 통로',
    desc: '도면 중앙에 그려진 세로 유리 가벽과 연결 출입문입니다.'
  },
  {
    id: 'zone_4f_restroom',
    code: '07',
    subCode: '화장실',
    name: '우측 하단 유아·부모 화장실 & 기저귀교환대',
    prompt: '07 화장실 및 기저귀 교환대 보기',
    pos: [3.8, 0, 3.6],
    badge: '07 유아실 화장실',
    title: '🚻 4층 전용 화장실 & 아기 기저귀 교환대 (우측 하단)',
    desc: '우측 마루 바로 아래편에 위치한 화장실입니다.'
  }
];

// =====================================================================
// 🚧 [핵심 고도화] 4층 중앙 유리벽·가로 내벽 실시간 물리 충돌 차단 & 문 통과 엔진
// =====================================================================
const SOLID_WALL_BOXES_4F = [
  // 1) 중앙 세로 유리 가벽 (X = 0.8) -> 연결문(Z: 1.05 ~ 2.05)만 제외하고 철저히 물리 차단!
  { minX: 0.55, maxX: 1.05, minZ: -5.6, maxZ: 1.0 },
  { minX: 0.55, maxX: 1.05, minZ: 2.1, maxZ: 2.75 },
  // 2) 마루방과 하단 구역을 나누는 가로 내벽 (Z = 2.6)
  // 문 위치: 좌마루 입구(X: -1.1 ~ 0.3), 우마루 입구(X: 1.4 ~ 2.3), 화장실 문(X: 3.3 ~ 4.3) 제외하고 모두 차단!
  { minX: -7.0, maxX: -1.15, minZ: 2.35, maxZ: 2.85 },
  { minX: 0.35, maxX: 1.35, minZ: 2.35, maxZ: 2.85 },
  { minX: 2.35, maxX: 3.25, minZ: 2.35, maxZ: 2.85 },
  { minX: 4.35, maxX: 7.0, minZ: 2.35, maxZ: 2.85 },
  // 3) 하단 계단실과 엘베 홀 사이 세로벽 (X = -1.6) -> 문(Z: 3.6 ~ 4.7) 제외
  { minX: -1.85, maxX: -1.35, minZ: 2.6, maxZ: 3.55 },
  { minX: -1.85, maxX: -1.35, minZ: 4.75, maxZ: 6.2 },
  // 4) 하단 엘베 홀과 화장실 사이 세로벽 (X = 2.5)
  { minX: 2.25, maxX: 2.75, minZ: 2.6, maxZ: 6.2 }
];

function resolveCollision4F(nx, nz, radius = 0.28) {
  let x = Math.max(-6.2, Math.min(6.2, nx));
  let z = Math.max(-4.8, Math.min(5.0, nz));

  for (const box of SOLID_WALL_BOXES_4F) {
    const closestX = Math.max(box.minX, Math.min(x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
    const dx = x - closestX;
    const dz = z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      x += (dx / dist) * overlap;
      z += (dz / dist) * overlap;
    }
  }
  return [x, z];
}

function getZoneArea4F(x, z) {
  if (z <= 2.6) {
    return x < 0.8 ? 'maru_left' : 'maru_right';
  }
  if (x < -1.6) return 'stairs';
  if (x > 2.5) return 'restroom';
  return 'elev_hall';
}

function computeSmartPath4F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision4F(rawEx, rawEz);
  const startArea = getZoneArea4F(sx, sz);
  const endArea = getZoneArea4F(ex, ez);

  if (startArea === endArea) {
    return [[ex, ez]];
  }

  const waypoints = [];

  // 1) 출발 구역에서 빠져나와 기준 통로로 이동
  if (startArea === 'stairs') {
    waypoints.push([-2.2, 4.15]);
    waypoints.push([-0.9, 4.15]); // 계단실 문 통과하여 엘베 홀 진입
  } else if (startArea === 'restroom') {
    waypoints.push([3.8, 3.2]);
    waypoints.push([3.8, 1.9]);   // 화장실 문 통과하여 우마루 진입
    if (endArea !== 'maru_right') {
      waypoints.push([1.8, 1.8]);
      waypoints.push([1.8, 3.3]); // 우마루 입구 통과하여 엘베 홀 진입
    }
  } else if (startArea === 'maru_left') {
    if (endArea === 'maru_right') {
      // 좌측 마루 -> 우측 마루: 도면의 중앙 가벽 아래쪽 연결문(X=0.8, Z=1.55)을 정확히 통과!
      waypoints.push([0.1, 1.55]);
      waypoints.push([1.5, 1.55]);
      waypoints.push([ex, ez]);
      return waypoints;
    }
    waypoints.push([-0.4, 1.9]);
    waypoints.push([-0.4, 3.3]); // 좌마루 입구 통과하여 엘베 홀 진입
  } else if (startArea === 'maru_right') {
    if (endArea === 'maru_left') {
      // 우측 마루 -> 좌측 마루: 중앙 가벽 아래쪽 연결문(X=0.8, Z=1.55) 통과!
      waypoints.push([1.5, 1.55]);
      waypoints.push([0.1, 1.55]);
      waypoints.push([ex, ez]);
      return waypoints;
    }
    if (endArea === 'restroom') {
      waypoints.push([3.8, 1.9]);
      waypoints.push([3.8, 3.3]); // 화장실 문 바로 진입
      waypoints.push([ex, ez]);
      return waypoints;
    }
    waypoints.push([1.8, 1.9]);
    waypoints.push([1.8, 3.3]);
  }

  // 2) 엘베 홀에서 최종 목적지 방의 문을 통과해 진입
  if (endArea === 'maru_left') {
    waypoints.push([-0.4, 3.3]);
    waypoints.push([-0.4, 1.9]);
  } else if (endArea === 'maru_right') {
    waypoints.push([1.8, 3.3]);
    waypoints.push([1.8, 1.9]);
  } else if (endArea === 'stairs') {
    waypoints.push([-0.9, 4.15]);
    waypoints.push([-2.2, 4.15]);
  } else if (endArea === 'restroom') {
    waypoints.push([1.8, 3.3]);
    waypoints.push([1.8, 1.9]);
    waypoints.push([3.8, 1.9]);
    waypoints.push([3.8, 3.3]);
  }

  waypoints.push([ex, ez]);
  return waypoints;
}

const NPCS_4F = [
  {
    id: 'mom_left_1',
    name: '김집사 (자모)',
    x: -4.2,
    z: -1.8,
    seated: true,
    isSkirt: true,
    rotY: -0.4,
    shirt: '#F472B6',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '통유리창으로 3층 본당 강대상이 한눈에 다 보여서 참 좋네요 😊',
      '왼쪽 코너 TV에서도 설교 말씀이 선명하게 잘 나와요!'
    ]
  },
  {
    id: 'dad_left_2',
    name: '이성도 (아기아빠)',
    x: -1.8,
    z: -1.5,
    seated: true,
    rotY: -0.6,
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '온돌 마루가 따뜻해서 아기가 새근새근 잘 자네요 👶',
      '아기가 울어도 방음이 완벽해서 마음 편히 예배드립니다 🙏'
    ]
  },
  {
    id: 'mom_right_1',
    name: '박자매 (자모)',
    x: 2.6,
    z: -1.6,
    seated: true,
    isSkirt: true,
    rotY: -0.3,
    shirt: '#FBBF24',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: [
      '우측 마루방도 코너 TV가 있어서 말씀 집중이 정말 잘 돼요 📺',
      '가운데 유리창으로 옆 마루방도 보여서 답답하지 않고 환하네요!'
    ]
  },
  {
    id: 'guide_4f',
    name: '최권사 (유아실 안내)',
    x: -0.3,
    z: 1.5,
    patrolZ: [-0.8, 2.1],
    seated: false,
    isSkirt: true,
    rotY: 0,
    shirt: '#34D399',
    pants: '#A7F3D0',
    hair: '#451A03',
    dialogues: [
      '샬롬! 4층 영유아 예배실(자모실)에 오신 부모님들 환영합니다 🥰',
      '신발을 벗고 좌측 마루나 우측 마루로 편하게 들어오세요~'
    ]
  }
];

function SmartCutawayWall4F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 4.0) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -4.0) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 4.0) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.0) shouldFade = true;

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

function HologramMarker4F({ zone, isSelected, onSelect }) {
  const pulseRef = useRef();

  const badgeTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
      grad.addColorStop(0, '#34D399');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w / 2 - 24, h / 2, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#A7F3D0';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 24, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 28, h / 2 + 6, 102, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 79, h / 2 + 28);
      }
    }, 350, 220);
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
        <ringGeometry args={[0.42, 0.52, 40]} />
        <meshBasicMaterial color="#34D399" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} />
      </mesh>
      <Billboard position={[0.06, 0.38, 0]}>
        <mesh>
          <planeGeometry args={[0.74, 0.44]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function SmoothChibiAvatar4F({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isSkirt = false,
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

  const bubbleTex = useMemo(() => {
    if (!speechBubbleText) return null;
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(12, 10, w - 24, h - 34, 34);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h - 24);
      ctx.lineTo(w / 2 + 14, h - 24);
      ctx.lineTo(w / 2, h - 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speechBubbleText.slice(0, 27), w / 2, (h - 24) / 2 + 4);
    }, 700, 120);
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
          st.pauseTimer = 2.5;
        } else if (st.z < patrolZ[0]) {
          st.z = patrolZ[0];
          st.dir = 1;
          st.pauseTimer = 2.5;
        }
        outerGroupRef.current.position.z = st.z;
        outerGroupRef.current.rotation.y = st.dir > 0 ? 0.2 : Math.PI - 0.2;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.1;
        rightLegRef.current.rotation.x = -Math.PI / 2.1;
        leftLegRef.current.position.set(-0.09, 0.12, -0.10);
        rightLegRef.current.position.set(0.09, 0.12, -0.10);
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
      if (emote === 'wave' || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.45 + Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = -0.45 + Math.cos(t * 2.2) * 0.04;
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
      headGroupRef.current.rotation.x = Math.sin(t * 2.6) * 0.05;
      headGroupRef.current.rotation.y = Math.cos(t * 1.4) * 0.07;
    }
    if (rootRef.current) {
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (isSeated ? -0.05 : 0) + bounce;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.25} />
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

        {nameTagTexture && (
          <Billboard position={[0, 1.25, 0]}>
            <mesh renderOrder={12}>
              <planeGeometry args={[1.45, 0.32]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}

        {bubbleTex && (
          <Billboard position={[0, 1.40, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[2.1, 0.36]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

function DetailedMiniatureToilet4F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.16, 0.05]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.32, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.33, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.13, 0.032, 12, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      <RoundedBox args={[0.32, 0.34, 0.15]} position={[0, 0.46, -0.13]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </RoundedBox>
    </group>
  );
}

function FourFloorNurseryDiorama({
  activeZoneId,
  onSelectZone,
  onSitOnCushion,
  onToggleTvScreen,
  sermonTitle,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const maruTex = useMemo(() => makeMaruFloorTexture('#E8C396', '#C89962'), []);

  const signs = useMemo(() => ({
    frontGlass: makeRoomSignTexture('전면 통유리창 (↓)', '3F 대예배당 본당 조망', '#0284C7'),
    maruLeft: makeRoomSignTexture('좌측 온돌 마루', '0~24개월 아기·부모 예배실', '#F59E0B'),
    maruRight: makeRoomSignTexture('우측 온돌 마루', '유아 놀이·가족 예배실', '#EC4899'),
    centerGlass: makeRoomSignTexture('중앙 유리 파티션', '좌·우 마루 연결 통로', '#10B981'),
    restroom: makeRoomSignTexture('화장실 · 기저귀', '유아 세면대 & 기저귀교환대', '#6366F1'),
    elevator: makeRoomSignTexture('4F 엘리베이터', '1F · 3F · 6F 이동', '#10B981'),
    stairs: makeRoomSignTexture('4F 계단실', '3F 대예배당 직결 계단', '#64748B')
  }), []);

  const tvScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1D4ED8');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE · 3F 본당 예배 중계', w / 2, 65);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px serif';
      ctx.fillText(sermonTitle || '주일 대예배 말씀', w / 2, 135);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶ 터치 시 실시간 유튜브 설교 재생', w / 2, 195);
    }, 512, 256);
  }, [sermonTitle]);

  return (
    <group>
      <RoundedBox args={[14.4, 0.2, 12.6]} position={[0, -0.1, 0.2]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>

      {/* 상단 전면 통유리 관람창 */}
      <group position={[0, 0, -5.35]}>
        <RoundedBox args={[13.6, 0.75, 0.24]} position={[0, 0.38, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#D4A373" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[12.8, 1.55, 0.08]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.38} roughness={0.08} metalness={0.2} />
        </mesh>
        <RoundedBox args={[13.2, 0.10, 0.26]} position={[0, 2.35, 0]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        {[-6.4, -3.8, -1.2, 0.8, 3.6, 6.4].map((fx, fi) => (
          <RoundedBox key={fi} args={[0.10, 1.65, 0.26]} position={[fx, 1.55, 0]} radius={0.01}>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
        ))}
        <RoundedBox args={[5.8, 0.08, 0.45]} position={[-2.8, 0.72, 0.32]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88544" />
        </RoundedBox>
        <RoundedBox args={[4.6, 0.08, 0.45]} position={[3.6, 0.72, 0.32]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88544" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[-1.5, 2.6, 0]}>
            <mesh>
              <planeGeometry args={[1.2, 0.54]} />
              <meshBasicMaterial map={signs.frontGlass} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 좌측 온돌 마루 */}
      <group>
        <RoundedBox args={[7.3, 0.08, 7.7]} position={[-2.95, 0.04, -1.3]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={maruTex} roughness={0.42} />
        </RoundedBox>

        <group
          position={[-5.65, 1.55, -4.35]}
          rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleTvScreen) onToggleTvScreen();
          }}
        >
          <RoundedBox args={[1.65, 0.96, 0.08]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.55, 0.86]} />
            <meshBasicMaterial map={tvScreenTex} />
          </mesh>
        </group>

        {[
          [-4.2, -1.8, '#F472B6'], [-2.8, -1.8, '#38BDF8'], [-1.4, -1.8, '#FBBF24'],
          [-4.2, -0.5, '#34D399'], [-2.8, -0.5, '#A78BFA'], [-1.4, -0.5, '#FB7185']
        ].map(([cx, cz, ccol], ci) => (
          <group
            key={`cush_l_${ci}`}
            position={[cx, 0.10, cz]}
            onClick={(e) => {
              e.stopPropagation();
              onSitOnCushion({ x: cx, z: cz, rowLabel: `좌측 마루 ${ci + 1}번 방석` });
            }}
          >
            <RoundedBox args={[0.62, 0.09, 0.62]} radius={0.04} castShadow receiveShadow>
              <meshStandardMaterial color={ccol} roughness={0.55} />
            </RoundedBox>
            <RoundedBox args={[0.65, 0.24, 0.32]} position={[0, 0.12, -0.52]} radius={0.015} castShadow>
              <meshStandardMaterial color="#D49552" />
            </RoundedBox>
          </group>
        ))}

        <group position={[-5.6, 0.08, 0.6]}>
          <RoundedBox args={[1.4, 0.32, 1.8]} position={[0, 0.16, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color="#FFFBEB" />
          </RoundedBox>
          <RoundedBox args={[1.1, 0.08, 1.5]} position={[0, 0.12, 0]} radius={0.02}>
            <meshStandardMaterial color="#FDE68A" />
          </RoundedBox>
        </group>

        {showRoomSigns && (
          <Billboard position={[-3.2, 1.65, 0.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.maruLeft} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 중앙 세로 유리 가벽 & 연결 도어 */}
      <group position={[0.8, 0, 0]}>
        <RoundedBox args={[0.16, 0.72, 6.15]} position={[0, 0.36, -2.12]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <mesh position={[0, 1.38, -2.12]}>
          <boxGeometry args={[0.06, 1.25, 4.6]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.42} roughness={0.1} />
        </mesh>
        <RoundedBox args={[0.18, 0.10, 4.7]} position={[0, 2.02, -2.12]} radius={0.01}>
          <meshStandardMaterial color="#334155" />
        </RoundedBox>
        <RoundedBox args={[0.16, 1.8, 0.45]} position={[0, 0.9, 2.35]} radius={0.015} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[0.08, 1.75, 0.92]} position={[0.25, 0.88, 1.45]} rotation={[0, 0.55, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#D49552" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 2.15, -0.5]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.centerGlass} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 우측 온돌 마루 */}
      <group>
        <RoundedBox args={[5.7, 0.08, 7.7]} position={[3.75, 0.04, -1.3]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={maruTex} roughness={0.42} />
        </RoundedBox>

        <group
          position={[1.75, 1.55, -4.35]}
          rotation={[0, Math.PI / 5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleTvScreen) onToggleTvScreen();
          }}
        >
          <RoundedBox args={[1.65, 0.96, 0.08]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.55, 0.86]} />
            <meshBasicMaterial map={tvScreenTex} />
          </mesh>
        </group>

        {[
          [2.6, -1.6, '#FBBF24'], [4.2, -1.6, '#38BDF8'],
          [2.6, -0.4, '#F472B6'], [4.2, -0.4, '#34D399']
        ].map(([cx, cz, ccol], ci) => (
          <group
            key={`cush_r_${ci}`}
            position={[cx, 0.10, cz]}
            onClick={(e) => {
              e.stopPropagation();
              onSitOnCushion({ x: cx, z: cz, rowLabel: `우측 마루 ${ci + 1}번 방석` });
            }}
          >
            <RoundedBox args={[0.62, 0.09, 0.62]} radius={0.04} castShadow receiveShadow>
              <meshStandardMaterial color={ccol} roughness={0.55} />
            </RoundedBox>
            <RoundedBox args={[0.65, 0.24, 0.32]} position={[0, 0.12, -0.52]} radius={0.015} castShadow>
              <meshStandardMaterial color="#D49552" />
            </RoundedBox>
          </group>
        ))}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.09, 1.1]} receiveShadow>
          <circleGeometry args={[1.05, 32]} />
          <meshStandardMaterial color="#FEF08A" />
        </mesh>
        <mesh position={[4.5, 0.35, 1.1]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.05, 24]} />
          <meshStandardMaterial color="#FB7185" />
        </mesh>

        {showRoomSigns && (
          <Billboard position={[3.8, 1.65, 0.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.maruRight} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 하단 좌측 계단 */}
      <group position={[-4.2, 0, 4.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[4.8, 3.0]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`st4_${i}`}
            args={[0.35, 0.10 + i * 0.08, 1.2]}
            position={[0.8 - i * 0.34, (0.10 + i * 0.08) / 2, -0.55]}
            radius={0.01}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_4F[1]);
            }}
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        {showRoomSigns && (
          <Billboard position={[0, 1.65, 0]}>
            <mesh>
              <planeGeometry args={[1.1, 0.50]} />
              <meshBasicMaterial map={signs.stairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 하단 중앙 엘베 홀 */}
      <group position={[0.4, 0, 5.5]}>
        <RoundedBox args={[3.2, 2.3, 0.35]} position={[0, 1.15, 0.25]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.45, 1.95, 0.08]} position={[0, 0.98, 0.06]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 2.25, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elevator} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 하단 우측 화장실 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.55, 0.008, 4.2]} receiveShadow>
          <planeGeometry args={[4.0, 3.1]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
        </mesh>
        <group position={[3.15, 0, 4.4]}>
          <RoundedBox args={[0.58, 0.74, 1.9]} position={[0, 0.37, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[0.48, 0.08, 0.75]} position={[0, 0.78, -0.45]} radius={0.03} castShadow>
            <meshStandardMaterial color="#FEF08A" />
          </RoundedBox>
        </group>
        {[-0.55, 0.55].map((bz, bi) => (
          <group key={`wc4_${bi}`} position={[5.45, 0, 4.2 + bz * 1.2]}>
            <RoundedBox args={[1.1, 1.1, 0.06]} position={[0, 0.55, -0.52]} radius={0.01} castShadow>
              <meshStandardMaterial color="#93C5FD" />
            </RoundedBox>
            <DetailedMiniatureToilet4F position={[0.15, 0, 0]} rotationY={-Math.PI / 2} />
          </group>
        ))}
        {showRoomSigns && (
          <Billboard position={[4.5, 1.65, 3.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.restroom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 가로 내벽 */}
      <RoundedBox args={[5.4, 1.25, 0.16]} position={[-3.9, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[1.0, 1.25, 0.16]} position={[0.85, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.9, 1.25, 0.16]} position={[2.8, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[2.2, 1.25, 0.16]} position={[5.5, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.25, 3.2]} position={[2.5, 0.62, 4.2]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>

      <SmartCutawayWall4F wallSide="west">
        <RoundedBox args={[0.24, 2.3, 11.4]} position={[-6.7, 1.15, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>
      <SmartCutawayWall4F wallSide="east">
        <RoundedBox args={[0.24, 2.3, 11.4]} position={[6.7, 1.15, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>

      {NPCS_4F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % NPCS_4F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar4F
            key={npc.id}
            position={[npc.x, 0.08, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isSkirt={Boolean(npc.isSkirt)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.6}
          />
        );
      })}

      {ZONES_4F.map((z) => (
        <HologramMarker4F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnCushion(sel.seatTarget);
            } else {
              onSelectZone(sel);
            }
          }}
        />
      ))}
    </group>
  );
}

function PlayerController4F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-2.8, 0.08, -0.5],
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
      playerIdxRef.current = [seatedInfo.x, 0.12, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x) {
        setRenderState({
          pos: [seatedInfo.x, 0.12, seatedInfo.z],
          rotY: Math.PI,
          walking: false
        });
      }
      return;
    }

    if (!waypoints || waypoints.length === 0) return;
    const currentTarget = waypoints[Math.min(wpIndexRef.current, waypoints.length - 1)];
    if (!currentTarget) return;

    const [cx, , cz] = playerIdxRef.current;
    const [tx, tz] = currentTarget;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.2);
      const rawNx = cx + (dx / dist) * step;
      const rawNz = cz + (dz / dist) * step;
      // 실시간 물리 충돌 슬라이딩 적용!
      const [nx, nz] = resolveCollision4F(rawNx, rawNz);
      const ny = nz <= 2.6 ? 0.08 : 0.0;
      playerIdxRef.current = [nx, ny, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, ny, nz],
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
    <SmoothChibiAvatar4F
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

function InitialCameraSetup4F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 13.8, 12.8);
      camera.fov = 42;
    } else {
      camera.position.set(0, 11.2, 10.6);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, -0.2);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function MediaParents4F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-2.8, 0.08, -0.5]);
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [waypoints, setWaypoints] = useState([[-2.8, -0.5]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_4F[2]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  // 🌟 [핵심 고도화] 화면을 가리던 미니맵/목록 패널과 3D 간판을 접고 끌 수 있는 상태!
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_4F.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const handleSitOnCushion = useCallback((seatData) => {
    const [sx, , sz] = playerIdxRef.current;
    const startArea = getZoneArea4F(sx, sz);
    const targetArea = getZoneArea4F(seatData.x, seatData.z);

    // 만약 다른 방에 있다면 먼저 연결문을 통과해 걸어간 뒤 앉도록 처리!
    if (startArea !== targetArea) {
      setSeatedInfo(null);
      setWaypoints(computeSmartPath4F(sx, sz, seatData.x, seatData.z));
      setTimeout(() => {
        setSeatedInfo(seatData);
        setIsScreenPlaying(true);
      }, 1600);
    } else {
      setSeatedInfo(seatData);
      setWaypoints([[seatData.x, seatData.z]]);
      setIsScreenPlaying(true);
    }
  }, []);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setIsScreenPlaying(false);
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computeSmartPath4F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

  useEffect(() => {
    if (!isMapDrawerOpen) return;
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E2026';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(10, 6, w - 20, 6);
    ctx.fillStyle = '#D99B5E';
    ctx.fillRect(10, 14, 52, 50);
    ctx.fillRect(66, 14, 38, 50);
    ctx.fillStyle = '#7DD3FC';
    ctx.fillRect(62, 18, 4, 34);
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 66, 34, 22);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(46, 68, 26, 20);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(74, 66, 30, 22);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.8) / 13.6) * w;
    const my = ((cz + 5.6) / 11.6) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

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
    const found = ZONES_4F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  const darkPillStyle = {
    backgroundColor: 'rgba(30, 32, 38, 0.94)',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.16)'
  };

  return (
    <div
      translate="no"
      style={{ backgroundColor: '#2B2C30' }}
      className="notranslate w-full h-full relative overflow-hidden select-none font-sans"
    >
      {/* 1. 좌측 상단: 슬림 헤더 & 간판 숨김 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 4F 영유아 예배실 (자모실)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowRoomSigns(prev => !prev)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: showRoomSigns ? '#34D399' : '#9CA3AF' }}>
              {showRoomSigns ? '🏷️ 간판 켜짐' : '🏷️ 간판 숨김'}
            </span>
          </button>

          <button
            onClick={() => setIsScreenPlaying(prev => !prev)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FCD34D' }}>{isScreenPlaying ? '📺 TV 닫기' : '📺 중계 TV'}</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.2, 10.6);
              controlsRef.current.target.set(0, 0.4, -0.2);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#93C5FD' }}>🎥 시점리셋</span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 접고 펼 수 있는 미니맵 & 구역 목록 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMapDrawerOpen(prev => !prev)}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 4F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_4F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnCushion(z.seatTarget);
                    else {
                      handleWalkTo(z.pos[0], z.pos[2]);
                      setActiveZone(z);
                      setModalZone(z);
                    }
                    setIsMapDrawerOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span style={{ color: '#FFFFFF' }} className="truncate">{z.badge}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. 중계 TV 플레이어 */}
      {isScreenPlaying && (
        <div
          style={{ backgroundColor: '#090D16', borderColor: '#F59E0B', color: '#FFFFFF' }}
          className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[460px] border-2 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in"
        >
          <div
            style={{ backgroundColor: '#111827' }}
            className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ backgroundColor: '#E11D48', color: '#FFFFFF' }} className="px-2 py-0.5 rounded text-[10px] font-mono font-black">
                4F 중계 TV
              </span>
              <span style={{ color: '#FFFFFF' }} className="text-xs font-bold truncate">
                {seatedInfo ? `${seatedInfo.rowLabel} · ` : ''}{sermonTitle}
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
                title="4F Nursery Live Sermon"
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

      {/* 4. 하단 좌측: 접고 펼 수 있는 4층 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '👶', label: '좌측마루', onClick: () => handleSitOnCushion({ x: -2.8, z: -0.5, rowLabel: '좌측 마루 예배석' }) },
              { icon: '🧸', label: '우측마루', onClick: () => handleSitOnCushion({ x: 3.6, z: -0.4, rowLabel: '우측 마루 예배석' }) },
              { icon: '🪟', label: '전면유리', onClick: () => handleWalkTo(-1.5, -4.1) },
              { icon: '📝', label: '예배노트', onClick: () => setActiveScreen && setActiveScreen('sermon') }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span className="text-sm">{item.icon}</span>
                <span style={{ color: '#FFFFFF' }} className="text-[11px] font-extrabold whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
            <button
              onClick={() => setShowBottomDock(false)}
              style={{ color: '#9CA3AF' }}
              className="px-2 py-1 text-xs font-bold cursor-pointer"
              title="하단 바 접기"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowBottomDock(true)}
            style={darkPillStyle}
            className="px-3 py-2 rounded-full border shadow-xl text-xs font-black cursor-pointer"
          >
            👶 유아실 메뉴 ▲
          </button>
        )}
      </div>

      {/* 5. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.2, 10.6]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup4F controlsRef={controlsRef} />

        <ambientLight intensity={1.35} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 1.15]} />
        <directionalLight
          position={[-6, 14, 10]}
          intensity={1.5}
          color="#FFF7ED"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkTo(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[14.2, 12.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <FourFloorNurseryDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            handleWalkTo(z.pos[0], z.pos[2]);
            setModalZone(z);
          }}
          onSitOnCushion={handleSitOnCushion}
          onToggleTvScreen={() => setIsScreenPlaying(prev => !prev)}
          sermonTitle={sermonTitle}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController4F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          emote={emote}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={22} blur={2.2} far={4} />
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.07}
          minDistance={2.8}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 6. 유튜브 링크 설정 모달 */}
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
              <span style={{ color: '#FCD34D' }} className="text-sm font-black">📺 4층 유아실 코너 TV 유튜브 연동</span>
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
                TV에 상영하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 구역 상세 안내 & 층간 이동 모달 */}
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

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 · 온돌 마루 (현재 층)' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반' }
                ].map((item) => (
                  <button
                    key={item.fl}
                    onClick={() => {
                      setModalZone(null);
                      onChangeFloor(item.fl);
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                    className="w-full p-3 rounded-xl hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer transition-colors"
                  >
                    <span>{item.label}</span>
                    <span>이동 ➔</span>
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
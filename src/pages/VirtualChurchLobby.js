// src/pages/VirtualChurchLobby.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎨 고해상도 캔버스 텍스처 & 바닥 타일/나뭇결 생성기 (<Html> 에러 원천 차단)
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

function makeLobbyMarbleTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#F5F2EB';
    ctx.fillRect(0, 0, w, h);

    // 대리석 줄눈 격자
    ctx.strokeStyle = '#DFD9CE';
    ctx.lineWidth = 3;
    const step = w / 4;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(w, i * step);
      ctx.stroke();
    }

    // 은은한 마블 베인(결)
    ctx.strokeStyle = 'rgba(180, 170, 155, 0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      const sy = (i / 24) * h;
      ctx.moveTo(0, sy);
      ctx.bezierCurveTo(w * 0.35, sy + 18, w * 0.65, sy - 18, w, sy + 8);
      ctx.stroke();
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

// =====================================================================
// 📍 손그림 도면(image_31ac5c.jpg) & 외관 사진(image_31a53b.jpg) 100% 반영 — 6대 존
// =====================================================================
const ZONES_1F = [
  {
    id: 'zone_1f_main_door',
    code: '01',
    subCode: '정문',
    name: '1층 정문 출입구 & 좋은나무교회 현관',
    prompt: '01 정문 현관 & 예배 안내 보기',
    pos: [-0.8, 0, 3.6],
    badge: '01 정문 로비',
    title: '🏛️ 좋은나무교회 1층 정문 현관 & 환영 로비',
    desc: '진초록색 어닝과 꽃 아치, 파란색 LED 예배 안내판과 보라색 행복 배너가 반겨주는 1층 정문 출입구입니다. 양개 유리문을 통해 로비로 바로 들어오실 수 있습니다.',
    stats: [
      { label: '주일 대예배', val: '1부 09:00 / 2부 11:00 (3F 대예배당)' },
      { label: '다음세대·유아', val: '4F 영유아실(자모실) / 6F 교육관·새가족반' }
    ],
    actions: [
      { label: '🛗 3F 대예배당 바로가기', jumpFloor: '3F' },
      { label: '📝 온라인 예배노트 열기', screen: 'sermon' }
    ]
  },
  {
    id: 'zone_1f_lounge_chair',
    code: '02',
    subCode: '의자',
    name: '좌측 상단 로비 대기 소파 라운지 (의자)',
    prompt: '02 로비 소파 의자에 앉아 쉬기',
    pos: [-2.6, 0, -2.0],
    seatTarget: { x: -3.55, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F 로비 대기 소파석' },
    isSeatZone: true,
    badge: '02 로비 소파(의자)',
    title: '🛋️ 1층 로비 성도 교제 & 대기 소파 라운지',
    desc: '도면 좌측 상단에 길게 배치된 대기 소파(의자) 구역입니다. 예배 전후로 성도님들과 차를 나누며 따뜻하게 교제하실 수 있습니다.'
  },
  {
    id: 'zone_1f_parking',
    code: '03',
    subCode: '주차장',
    name: '좌측 필로티 주차장 & 측면 출입문',
    prompt: '03 필로티 주차장 & 차량 안내',
    pos: [-5.6, 0, 2.2],
    badge: '03 필로티 주차장',
    title: '🚗 좌측 필로티 실내외 주차장 & 측면 직결 출입문',
    desc: '실제 건물 좌측 1층 필로티 기둥 아래 마련된 전용 주차장입니다. 차를 주차한 뒤 비를 맞지 않고 측면 유리문을 통해 1층 로비로 바로 들어올 수 있습니다.',
    stats: [
      { label: '배려 주차구역', val: '정문 앞 및 필로티 입구 전용 구역 완비' },
      { label: '로비 직결문', val: '주차장 우측 측면 유리문 ➔ 1층 로비 직결' }
    ]
  },
  {
    id: 'zone_1f_elevator',
    code: '04',
    subCode: '엘베',
    name: '우측 상단 스마트 엘리베이터 홀',
    prompt: '04 엘리베이터 탑승 (3F·4F·6F 이동)',
    pos: [1.8, 0, -2.8],
    isElevator: true,
    badge: '04 엘리베이터',
    title: '🛗 전 층 연결 스마트 엘리베이터 홀 (우측 상단)',
    desc: '도면 우측 상단에 위치한 메인 엘리베이터입니다. 3층(대예배당), 4층(영유아 마루 예배실), 6층(다음세대 교육관·새가족반)으로 즉시 이동합니다!'
  },
  {
    id: 'zone_1f_up_stairs',
    code: '05',
    subCode: '계단',
    name: '우측 중단 상층부 연결 계단실',
    prompt: '05 계단으로 3F·4F·6F 올라가기',
    pos: [1.8, 0, 0.2],
    isElevator: true,
    badge: '05 상층 계단실',
    title: '🪜 우측 중단 전 층 연결 계단실 (1F ➔ 3F·4F·6F)',
    desc: '도면 우측 중단(엘리베이터 바로 아래)에 위치한 상층부 이동 계단실입니다.'
  },
  {
    id: 'zone_1f_b1_stairs',
    code: '06',
    subCode: 'B1F계단',
    name: '우측 하단 B1F 내려가는 계단실',
    prompt: '06 B1F 계단실 및 부속시설 안내',
    pos: [1.8, 0, 2.8],
    badge: '06 B1F 계단실',
    title: '🔽 우측 하단 B1F 연결 계단실',
    desc: '도면 우측 하단에 출입문과 함께 자리한 지하 1층(B1F) 연결 계단실입니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체·가벽·기둥 실시간 물리 충돌(AABB) 및 문(Doorway) 통과 네비게이션
// =====================================================================
const WALL_COLLIDERS_1F = [
  // 1) 정문 하단 외벽 (정문 양개문 X: -1.8 ~ 0.4 구간만 통과 허용!)
  { minX: -4.4, maxX: -1.85, minZ: 4.15, maxZ: 4.65 },
  { minX: 0.45, maxX: 5.5, minZ: 4.15, maxZ: 4.65 },
  // 2) 좌측 로비 외벽 (주차장 측면 출입문 Z: 1.5 ~ 2.9 구간만 통과 허용!)
  { minX: -4.45, maxX: -3.95, minZ: -4.6, maxZ: 1.45 },
  { minX: -4.45, maxX: -3.95, minZ: 2.95, maxZ: 4.6 },
  // 3) 도면 속 좌·우 방풍 가벽 날개 (Z = 1.2 부근 돌출 벽)
  { minX: -4.2, maxX: -2.85, minZ: 0.95, maxZ: 1.35 },
  { minX: 0.95, maxX: 2.35, minZ: 0.95, maxZ: 1.35 },
  // 4) 좌측 상단 대기 소파(의자) 충돌 박스
  { minX: -4.1, maxX: -3.2, minZ: -3.6, maxZ: -0.4 },
  // 5) 우측 코어(엘베/계단/B1F계단) 경계벽 (문 위치 제외)
  { minX: 2.15, maxX: 2.65, minZ: -4.6, maxZ: -3.4 },
  { minX: 2.15, maxX: 2.65, minZ: -2.1, maxZ: -0.4 },
  { minX: 2.15, maxX: 2.65, minZ: 0.8, maxZ: 2.1 },
  // 6) 주차장 필로티 기둥 및 주차 차량 충돌 박스
  { minX: -10.2, maxX: -7.8, minZ: -3.2, maxZ: 1.6 }
];

function isBlocked1F(x, z) {
  if (x < -10.5 || x > 5.2 || z < -4.4 || z > 7.8) return true;
  for (const b of WALL_COLLIDERS_1F) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
  }
  return false;
}

// 매 프레임 캐릭터가 벽이나 가구를 뚫고 들어가지 못하도록 밀어내는 실시간 물리 충돌 함수
function resolveCollision1F(nx, nz, radius = 0.28) {
  let x = Math.max(-10.0, Math.min(4.8, nx));
  let z = Math.max(-4.1, Math.min(7.4, nz));

  for (const box of WALL_COLLIDERS_1F) {
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

function computeSmartPath1F(sx, sz, rawEx, rawEz) {
  const [tx, tz] = resolveCollision1F(rawEx, rawEz);

  let clear = true;
  for (let i = 1; i <= 16; i++) {
    const ix = sx + ((tx - sx) * i) / 16;
    const iz = sz + ((tz - sz) * i) / 16;
    if (isBlocked1F(ix, iz)) {
      clear = false;
      break;
    }
  }
  if (clear) return [[tx, tz]];

  const waypoints = [];
  let curX = sx;
  let curZ = sz;

  // 야외 도로/인도(Z > 4.4)에서 실내 로비(Z <= 4.4)로 들어올 때 -> 정문(X: -0.8, Z: 4.4) 경유
  if (curZ > 4.4 && tz <= 4.4) {
    waypoints.push([-0.8, 5.0]);
    waypoints.push([-0.8, 3.4]);
    curX = -0.8;
    curZ = 3.4;
  } else if (curZ <= 4.4 && tz > 4.4) {
    waypoints.push([-0.8, 3.4]);
    waypoints.push([-0.8, 5.0]);
    curX = -0.8;
    curZ = 5.0;
  }

  // 좌측 주차장(X < -4.2)과 실내 로비(X >= -4.2) 사이 이동 -> 측면문(X: -4.2, Z: 2.2) 경유
  if (curX < -4.2 && tx >= -4.2) {
    waypoints.push([-5.0, 2.2]);
    waypoints.push([-2.2, 2.2]);
  } else if (curX >= -4.2 && tx < -4.2) {
    waypoints.push([-2.2, 2.2]);
    waypoints.push([-5.0, 2.2]);
  }

  // 로비 하단(Z > 1.2)과 로비 상단(Z <= 1.2) 사이 이동 -> 양쪽 날개 가벽 사이 중앙 통로(X: -0.8, Z: 1.2) 경유
  if ((curZ - 1.2) * (tz - 1.2) < 0 && tx >= -4.2) {
    waypoints.push([-0.8, 1.2]);
  }

  waypoints.push([tx, tz]);
  return waypoints;
}

// =====================================================================
// 👥 1층 로비와 주차장에서 살아 움직이며 대화하는 NPC들
// =====================================================================
const NPCS_1F = [
  {
    id: 'npc_1f_usher',
    name: '박집사 (로비안내)',
    x: -0.8,
    z: 2.4,
    patrolZ: [-1.5, 3.2],
    isSkirt: true,
    rotY: 0,
    shirt: '#0284C7',
    pants: '#BAE6FD',
    hair: '#5C3A21',
    dialogues: [
      '할렐루야! 좋은나무교회 1층 로비에 오신 것을 환영합니다 😊',
      '우측 안쪽 엘리베이터로 3F 본당, 4F 유아실, 6F 교육관에 가실 수 있어요!',
      '새가족분들은 왼쪽 소파 라운지에서 따뜻한 차 한잔 하세요~'
    ]
  },
  {
    id: 'npc_1f_lounge',
    name: '김권사 (새가족환영)',
    x: -3.55,
    z: -1.4,
    seated: true,
    isSkirt: true,
    rotY: Math.PI / 2,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#451A03',
    dialogues: [
      '로비 소파가 참 폭신하고 아늑하네요 🥰',
      '예배 전에 성도님들과 도란도란 교제하니 참 행복합니다!'
    ]
  },
  {
    id: 'npc_1f_parking',
    name: '최집사 (주차봉사)',
    x: -6.2,
    z: 3.2,
    autoWave: true,
    rotY: 0.4,
    shirt: '#16A34A',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '어서 오세요! 필로티 주차장 안쪽으로 편하게 주차하세요 🚗',
      '주차 후 바로 옆 유리문으로 들어가시면 1층 로비입니다!'
    ]
  },
  {
    id: 'npc_1f_elev',
    name: '이청년 (엘베안내)',
    x: 1.5,
    z: -2.2,
    rotY: -0.5,
    shirt: '#F59E0B',
    pants: '#1E293B',
    hair: '#5C3A21',
    dialogues: [
      '3층 대예배당 올라가실 분들은 이쪽 엘리베이터를 이용해 주세요 🛗',
      '바로 옆 계단으로도 위층과 B1F으로 이동하실 수 있습니다!'
    ]
  }
];

// =====================================================================
// 🚗 정문 앞 아스팔트 도로를 달리는 입체 자동차 애니메이션
// =====================================================================
function MovingRoadCars1F() {
  const carRef = useRef();

  useFrame((_, delta) => {
    if (carRef.current) {
      carRef.current.position.x += delta * 2.6;
      if (carRef.current.position.x > 8.5) carRef.current.position.x = -11.5;
    }
  });

  return (
    <group ref={carRef} position={[-6, 0.32, 7.6]}>
      <RoundedBox args={[1.85, 0.44, 0.92]} position={[0, 0, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.36, 0.82]} position={[-0.08, 0.34, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color="#E0F2FE" />
      </RoundedBox>
      {[[-0.55, -0.46], [0.55, -0.46], [-0.55, 0.46], [0.55, 0.46]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, -0.14, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================================
// 👁️ 카메라 회전 시 시야 가리는 벽 자동 투명화 컴포넌트
// =====================================================================
function SmartCutawayWall1F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 5.0) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -5.0) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 4.5) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -3.5) shouldFade = true;

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
// 🟢 바닥 초록색 홀로그램 마커
// =====================================================================
function HologramMarker1F({ zone, isSelected, onSelect }) {
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

// =====================================================================
// 🚶‍♀️ 관절형 아바타 + 소파 착석 모션 + 실시간 대화 말풍선
// =====================================================================
function SmoothChibiAvatar1F({
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
          st.pauseTimer = 2.6;
        } else if (st.z < patrolZ[0]) {
          st.z = patrolZ[0];
          st.dir = 1;
          st.pauseTimer = 2.6;
        }
        outerGroupRef.current.position.z = st.z;
        outerGroupRef.current.rotation.y = st.dir > 0 ? 0.2 : Math.PI - 0.2;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.1;
        rightLegRef.current.rotation.x = -Math.PI / 2.1;
        leftLegRef.current.position.set(-0.09, 0.20, 0.08);
        rightLegRef.current.position.set(0.09, 0.20, 0.08);
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
        leftArmRef.current.rotation.x = -0.45;
        rightArmRef.current.rotation.x = -0.45;
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
      rootRef.current.position.y = (isSeated ? 0.14 : 0) + bounce;
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

// =====================================================================
// 🚙 디테일한 SUV 주차 차량 모델 (타이어 + 창문 + 헤드라이트 포함)
// =====================================================================
function DetailedParkedSUV({ position, rotationY = 0, bodyColor = '#F8FAFC' }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.75, 0.52, 3.4]} position={[0, 0.42, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={bodyColor} roughness={0.25} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[1.52, 0.46, 2.1]} position={[0, 0.86, -0.15]} radius={0.08} castShadow>
        <meshStandardMaterial color={bodyColor} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.55, 0.34, 1.85]} position={[0, 0.85, -0.15]} radius={0.04}>
        <meshStandardMaterial color="#1E293B" roughness={0.1} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.12, 0.05]} position={[-0.58, 0.48, 1.70]} radius={0.02}>
        <meshBasicMaterial color="#FEF08A" />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.12, 0.05]} position={[0.58, 0.48, 1.70]} radius={0.02}>
        <meshBasicMaterial color="#FEF08A" />
      </RoundedBox>
      {[[-0.82, -1.05], [0.82, -1.05], [-0.82, 1.05], [0.82, 1.05]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.24, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.22, 20]} />
          <meshStandardMaterial color="#18181B" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================================
// 🏛️ 1층 손그림 도면(image_31ac5c.jpg) & 외관 사진(image_31a53b.jpg) 1:1 디오라마
// =====================================================================
function OneFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  onSitOnSofa,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const marbleTex = useMemo(() => makeLobbyMarbleTexture(), []);

  const exteriorTextures = useMemo(() => ({
    churchSign: makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#27272A';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#52525B';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#2563EB';
      ctx.fillRect(28, 28, 95, h - 56);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(68, 38, 16, h - 76);
      ctx.fillRect(42, 68, 68, 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px serif';
      ctx.textAlign = 'left';
      ctx.fillText('좋은나무교회', 145, 92);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('GOOD TREE CHURCH', 148, 138);
    }, 560, 180),

    purpleBanner: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#6B21A8');
      grad.addColorStop(1, '#9333EA');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 38px serif';
      ctx.textAlign = 'center';
      ctx.fillText('{ 당신이 더 행복했으면 좋겠습니다 }', w / 2, h / 2 - 8);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('김포 좋은나무교회', w / 2, h / 2 + 36);
    }, 640, 180),

    blueLedSign: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0284C7');
      grad.addColorStop(1, '#1E3A8A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOOD TREE WORSHIP', w / 2, 65);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 38px sans-serif';
      ctx.fillText('주일예배 안내', w / 2, 130);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('1부 09:00 | 2부 11:00', w / 2, 195);
      ctx.fillText('3F 대예배당 / 4F 유아실', w / 2, 245);
      ctx.fillText('6F 교육관 · 새가족실', w / 2, 295);
    }, 320, 420)
  }), []);

  const signs = useMemo(() => ({
    lounge: makeRoomSignTexture('로비 대기 소파 (의자)', '새가족 영접 · 성도 교제석', '#F59E0B'),
    elevator: makeRoomSignTexture('1F 엘리베이터', '3F 본당 · 4F 유아 · 6F 교육관', '#10B981'),
    upStairs: makeRoomSignTexture('상층 연결 계단', '3F · 4F · 6F 도보 이동', '#0284C7'),
    b1Stairs: makeRoomSignTexture('B1F 계단실', '지하 1층 내려가는 계단', '#6366F1'),
    parking: makeRoomSignTexture('필로티 주차장', '차량 주차 · 측면 로비 출입구', '#3B82F6')
  }), []);

  return (
    <group>
      {/* 1. 정문 앞 보도블록 인도 & 아스팔트 차도 & 파란색 배려주차구역 */}
      <RoundedBox args={[20.0, 0.2, 16.0]} position={[-2.2, -0.12, 1.5]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[18.5, 0.08, 2.0]} position={[-2.0, 0.02, 5.5]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#CBD5E1" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.065, 4.95]} receiveShadow>
        <planeGeometry args={[3.4, 1.05]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.068, 4.95]}>
        <ringGeometry args={[0.35, 0.42, 24]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      <RoundedBox args={[18.5, 0.06, 2.6]} position={[-2.0, 0.0, 7.7]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </RoundedBox>
      <MovingRoadCars1F />

      {/* 2. 좌측 필로티 주차장 (`주차장`) & 사각 기둥 4개 & 보라색 현수막 */}
      <group position={[-7.6, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.2]} receiveShadow>
          <planeGeometry args={[6.6, 9.2]} />
          <meshStandardMaterial color="#3B4252" roughness={0.8} />
        </mesh>
        {[-2.4, 0.0, 2.4].map((pz, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.02, pz]}>
            <planeGeometry args={[3.2, 0.10]} />
            <meshBasicMaterial color="#F8FAFC" />
          </mesh>
        ))}

        {[
          [-2.6, 4.2], [2.6, 4.2], [-2.6, -3.5], [2.6, -3.5]
        ].map(([cx, cz], idx) => (
          <group key={`piloti_${idx}`} position={[cx, 0, cz]}>
            <RoundedBox args={[0.52, 3.2, 0.52]} position={[0, 1.6, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#57534E" roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.56, 0.75, 0.56]} position={[0, 0.38, 0]} radius={0.02}>
              <meshStandardMaterial color="#FACC15" />
            </RoundedBox>
          </group>
        ))}

        <SmartCutawayWall1F wallSide="south" minOpacity={0.22}>
          <RoundedBox args={[6.6, 1.1, 0.35]} position={[0, 2.75, 4.2]} radius={0.02} castShadow>
            <meshStandardMaterial color="#3F3F46" roughness={0.4} metalness={0.3} />
          </RoundedBox>
          <mesh position={[0, 2.68, 4.39]}>
            <planeGeometry args={[4.2, 0.78]} />
            <meshBasicMaterial map={exteriorTextures.purpleBanner} />
          </mesh>
        </SmartCutawayWall1F>

        <DetailedParkedSUV position={[-1.4, 0, -1.6]} rotationY={Math.PI / 2} bodyColor="#F8FAFC" />
        <DetailedParkedSUV position={[-1.4, 0, 0.8]} rotationY={Math.PI / 2} bodyColor="#F1F5F9" />

        {showRoomSigns && (
          <Billboard position={[0.5, 1.75, 2.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.parking} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 3. 1층 메인 로비 대리석 홀 & 도면 속 방풍 가벽 & 좌측 상단 `의자` 라운지 */}
      <group>
        <RoundedBox args={[9.0, 0.08, 8.8]} position={[0.3, 0.04, 0.0]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={marbleTex} roughness={0.25} />
        </RoundedBox>

        <RoundedBox args={[1.35, 1.45, 0.20]} position={[-3.5, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.35, 1.45, 0.20]} position={[1.65, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>

        <group position={[-3.55, 0.08, -2.0]}>
          <RoundedBox args={[0.75, 0.42, 2.9]} position={[0, 0.21, 0]} radius={0.05} castShadow receiveShadow>
            <meshStandardMaterial color="#D49552" roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.68, 0.12, 2.75]} position={[0.04, 0.42, 0]} radius={0.04} castShadow>
            <meshStandardMaterial color="#38BDF8" roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.48, 2.75]} position={[-0.26, 0.65, 0]} radius={0.04} castShadow>
            <meshStandardMaterial color="#0284C7" roughness={0.5} />
          </RoundedBox>

          <RoundedBox args={[0.72, 0.06, 1.6]} position={[1.05, 0.46, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FDFBF7" roughness={0.3} />
          </RoundedBox>
          {[-0.55, 0.55].map((lz, li) => (
            <mesh key={li} position={[1.05, 0.23, lz]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.44, 12]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.6} />
            </mesh>
          ))}
          <mesh position={[1.05, 0.53, -0.35]}>
            <cylinderGeometry args={[0.045, 0.035, 0.08, 12]} />
            <meshStandardMaterial color="#F59E0B" />
          </mesh>
          <mesh position={[1.05, 0.53, 0.35]}>
            <cylinderGeometry args={[0.045, 0.035, 0.08, 12]} />
            <meshStandardMaterial color="#EC4899" />
          </mesh>

          {showRoomSigns && (
            <Billboard position={[0.2, 1.65, 0]}>
              <mesh>
                <planeGeometry args={[1.15, 0.52]} />
                <meshBasicMaterial map={signs.lounge} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        <group position={[-0.8, 0.08, -3.2]}>
          <RoundedBox args={[2.1, 0.92, 0.68]} position={[0, 0.46, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[2.2, 0.08, 0.76]} position={[0, 0.94, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#D49552" />
          </RoundedBox>
          {[-1.45, 1.45].map((px, pi) => (
            <group key={pi} position={[px, 0, 0]}>
              <mesh position={[0, 0.24, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.16, 0.48, 16]} />
                <meshStandardMaterial color="#D97706" />
              </mesh>
              <mesh position={[0, 0.62, 0]} castShadow>
                <sphereGeometry args={[0.32, 16, 16]} />
                <meshStandardMaterial color="#16A34A" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* 4. 좌측 벽 주차장 연결 측면 출입문 & 하단 정문 외관 */}
      <RoundedBox args={[0.20, 1.5, 5.8]} position={[-4.2, 0.75, -1.5]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.20, 1.5, 1.4]} position={[-4.2, 0.75, 3.7]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <group position={[-4.2, 0, 2.2]}>
        <RoundedBox args={[0.22, 2.15, 0.10]} position={[0, 1.08, -0.7]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <RoundedBox args={[0.22, 2.15, 0.10]} position={[0, 1.08, 0.7]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <mesh position={[-0.25, 1.05, -0.35]} rotation={[0, 0.55, 0]}>
          <boxGeometry args={[0.06, 2.0, 0.72]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.55} />
        </mesh>
      </group>

      <SmartCutawayWall1F wallSide="south" minOpacity={0.22}>
        <group position={[0, 0, 4.4]}>
          <group position={[-2.45, 1.15, 0.08]}>
            <RoundedBox args={[1.15, 2.2, 0.16]} radius={0.02} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[1.05, 2.08]} />
              <meshBasicMaterial map={exteriorTextures.blueLedSign} />
            </mesh>
          </group>

          <group position={[-0.7, 0, 0]}>
            <RoundedBox args={[2.35, 0.12, 0.24]} position={[0, 2.22, 0]} radius={0.01}>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[-0.85, 1.1, 0.35]} rotation={[0, -0.5, 0]}>
              <boxGeometry args={[0.95, 2.1, 0.06]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0.85, 1.1, 0.35]} rotation={[0, 0.5, 0]}>
              <boxGeometry args={[0.95, 2.1, 0.06]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.5} />
            </mesh>

            {[-1.12, 1.12].map((gx, gi) => (
              <RoundedBox key={gi} args={[0.18, 2.15, 0.18]} position={[gx, 1.08, 0.12]} radius={0.04}>
                <meshStandardMaterial color="#15803D" />
              </RoundedBox>
            ))}
            <RoundedBox args={[2.4, 0.20, 0.20]} position={[0, 2.18, 0.12]} radius={0.04}>
              <meshStandardMaterial color="#15803D" />
            </RoundedBox>

            <RoundedBox
              args={[3.6, 0.45, 0.95]}
              position={[-0.45, 2.52, 0.38]}
              rotation={[0.32, 0, 0]}
              radius={0.03}
              castShadow
            >
              <meshStandardMaterial color="#064E3B" roughness={0.6} />
            </RoundedBox>
            <mesh position={[-0.45, 3.12, 0.15]}>
              <planeGeometry args={[3.4, 0.95]} />
              <meshBasicMaterial map={exteriorTextures.churchSign} />
            </mesh>
          </group>

          <group position={[2.65, 0, 0]}>
            <RoundedBox args={[4.3, 2.8, 0.24]} position={[0, 1.4, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#E7E5E4" />
            </RoundedBox>
            <mesh position={[0.2, 1.65, 0.14]}>
              <planeGeometry args={[2.6, 1.35]} />
              <meshBasicMaterial map={exteriorTextures.purpleBanner} />
            </mesh>
            <group position={[0.1, 0, 0.42]}>
              <mesh position={[-0.32, 0.24, 0]}>
                <torusGeometry args={[0.20, 0.025, 10, 24]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.32, 0.24, 0]}>
                <torusGeometry args={[0.20, 0.025, 10, 24]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <RoundedBox args={[0.65, 0.05, 0.05]} position={[0, 0.36, 0]} rotation={[0, 0, 0.15]} radius={0.01}>
                <meshStandardMaterial color="#F472B6" />
              </RoundedBox>
            </group>
            <mesh position={[1.45, 0.35, 0.38]} castShadow>
              <cylinderGeometry args={[0.10, 0.12, 0.68, 16]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>
        </group>
      </SmartCutawayWall1F>

      {/* 5. 우측 3단 수직 코어 (`엘베` · `계단` · `B1F 계단`) */}
      <group
        position={[3.55, 0, -3.0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[3]);
        }}
      >
        <RoundedBox args={[2.3, 2.5, 2.6]} position={[0, 1.25, 0]} radius={0.03} castShadow receiveShadow>
          <meshStandardMaterial color="#CBD5E1" metalness={0.4} roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[0.08, 2.05, 1.35]} position={[-1.16, 1.02, 0]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.6} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.06, 0.22, 0.75]} position={[-1.17, 2.22, 0]} radius={0.01}>
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 2.45, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elevator} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      <group
        position={[3.55, 0, -0.1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[4]);
        }}
      >
        <RoundedBox args={[2.3, 0.1, 2.6]} position={[0, 0.05, 0]} radius={0.01} receiveShadow>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        {Array.from({ length: 7 }).map((_, i) => (
          <RoundedBox
            key={`up1_${i}`}
            args={[0.28, 0.12 + i * 0.10, 1.6]}
            position={[-0.8 + i * 0.26, (0.12 + i * 0.10) / 2, 0]}
            radius={0.01}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        <RoundedBox args={[2.4, 1.35, 0.16]} position={[0, 0.68, -1.35]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[2.4, 1.35, 0.16]} position={[0, 0.68, 1.35]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 1.95, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.upStairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      <group
        position={[3.55, 0, 2.85]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[5]);
        }}
      >
        <RoundedBox args={[2.3, 0.1, 2.7]} position={[0, 0.05, 0]} radius={0.01} receiveShadow>
          <meshStandardMaterial color="#CBD5E1" />
        </RoundedBox>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`b1_${i}`}
            args={[0.28, 0.48 - i * 0.07, 1.5]}
            position={[-0.7 + i * 0.26, (0.48 - i * 0.07) / 2, 0]}
            radius={0.01}
            castShadow
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#94A3B8' : '#64748B'} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.16, 1.4, 1.2]} position={[-1.2, 0.7, -0.75]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[0.08, 1.85, 0.92]} position={[-1.2, 0.92, 0.35]} rotation={[0, -0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#64748B" />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 1.95, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.b1Stairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      <SmartCutawayWall1F wallSide="north">
        <RoundedBox args={[9.2, 2.5, 0.24]} position={[0.3, 1.25, -4.4]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall1F>
      <SmartCutawayWall1F wallSide="east">
        <RoundedBox args={[0.24, 2.5, 9.0]} position={[4.8, 1.25, 0.0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall1F>

      {NPCS_1F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % NPCS_1F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar1F
            key={npc.id}
            position={[npc.x, 0.08, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.5}
          />
        );
      })}

      {ZONES_1F.map((z) => (
        <HologramMarker1F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnSofa(sel.seatTarget);
            } else {
              onSelectZone(sel);
            }
          }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 플레이어 아바타 컨트롤러 (매 프레임 실시간 벽 충돌 슬라이딩 적용!)
// =====================================================================
function PlayerController1F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-0.8, 0.08, 2.8],
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
      playerIdxRef.current = [seatedInfo.x, 0.10, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x) {
        setRenderState({
          pos: [seatedInfo.x, 0.10, seatedInfo.z],
          rotY: seatedInfo.rotY ?? Math.PI / 2,
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
      // 실시간 물리 충돌 슬라이딩 보정!
      const [nx, nz] = resolveCollision1F(rawNx, rawNz);
      const ny = nx >= -4.2 && nz <= 4.4 ? 0.08 : 0.02;
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
    <SmoothChibiAvatar1F
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

function InitialCameraSetup1F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(-2.5, 14.5, 14.5);
      camera.fov = 42;
    } else {
      camera.position.set(-2.2, 11.8, 12.2);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(-1.2, 0.5, 0.5);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function VirtualChurchLobby({ setActiveScreen, onChangeFloor }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.8, 0.08, 2.8]);

  const [waypoints, setWaypoints] = useState([[-0.8, 2.8]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_1F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  // 화면을 가리지 않도록 맵/목록 드로어, 3D 간판, 하단 메뉴를 접고 펼 수 있는 상태!
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_1F.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const handleSitOnSofa = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
  }, []);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setWaypoints([[-2.2, -2.0]]);
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computeSmartPath1F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

  const handleJumpToFloor = (fl) => {
    setModalZone(null);
    if (typeof onChangeFloor === 'function') {
      onChangeFloor(fl);
    }
  };

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

    ctx.fillStyle = '#334155';
    ctx.fillRect(6, 12, 34, 62);
    ctx.fillStyle = '#E5E0D5';
    ctx.fillRect(42, 10, 44, 64);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(45, 16, 7, 26);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(88, 10, 20, 20);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(88, 32, 20, 20);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(88, 54, 20, 20);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 78, w, 16);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 10.5) / 16.0) * w;
    const my = ((cz + 5.0) / 13.0) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_1F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 3D 간판 숨김 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={() => setActiveScreen && setActiveScreen('home')}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 1F 정문 로비 · 주차장
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
            onClick={() => handleJumpToFloor('3F')}
            style={{ backgroundColor: '#10B981', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            🛗 3F 본당 이동
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(-2.2, 11.8, 12.2);
              controlsRef.current.target.set(-1.2, 0.5, 0.5);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#93C5FD' }}>🎥 시점리셋</span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 평소에는 작은 버튼 1개로 접혀 있고, 누르면 열리는 미니맵 & 구역 목록 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMapDrawerOpen(prev => !prev)}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 1F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_1F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnSofa(z.seatTarget);
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

      {/* 3. 하단 좌측: 접고 펼 수 있는 1층 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '🏛️', label: '정문현관', onClick: () => handleWalkTo(-0.8, 3.6) },
              { icon: '🛋️', label: '로비소파', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnSofa({ x: -3.55, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F 로비 대기 소파석' }); } },
              { icon: '🚗', label: '주차장', onClick: () => handleWalkTo(-5.6, 2.2) },
              { icon: '🛗', label: '엘리베이터', onClick: () => { handleWalkTo(1.8, -2.8); setModalZone(ZONES_1F[3]); } }
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
            🏛️ 로비 메뉴 ▲
          </button>
        )}
      </div>

      {/* 4. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[-2.2, 11.8, 12.2]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup1F controlsRef={controlsRef} />

        <ambientLight intensity={1.35} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 1.15]} />
        <directionalLight
          position={[-8, 15, 12]}
          intensity={1.55}
          color="#FFF7ED"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-2, 0.01, 1.5]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkTo(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[20.0, 16.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <OneFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            handleWalkTo(z.pos[0], z.pos[2]);
            setModalZone(z);
          }}
          onSitOnSofa={handleSitOnSofa}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController1F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          emote={emote}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={26} blur={2.2} far={4} />
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.07}
          minDistance={3.0}
          maxDistance={34}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 구역 상세 안내 & 전 층 이동 엘리베이터 모달 */}
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

            {modalZone.stats && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="rounded-2xl p-3 border border-white/10 space-y-2">
                {modalZone.stats.map((st, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }} className="font-bold">{st.label}</span>
                    <span style={{ color: '#FCD34D' }} className="font-black">{st.val}</span>
                  </div>
                ))}
              </div>
            )}

            {modalZone.actions && modalZone.actions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {modalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setModalZone(null);
                      if (act.jumpFloor) handleJumpToFloor(act.jumpFloor);
                      else if (setActiveScreen && act.screen) setActiveScreen(act.screen);
                    }}
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                    className="py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer shadow-md"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {modalZone.isElevator && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '3F', label: '3F 대예배당 (본당 설교 스크린 · 장의자 착석)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실 · 코너 TV)' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반 (유아·유치·초등)' }
                ].map((item) => (
                  <button
                    key={item.fl}
                    onClick={() => handleJumpToFloor(item.fl)}
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
// src/metaverse/Education6F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎵 6층 다음세대 교육관 오르골 BGM
// =====================================================================
let bgmInterval6F = null;
const togglePraiseBgm6F = (play) => {
  if (!play) {
    if (bgmInterval6F) clearInterval(bgmInterval6F);
    bgmInterval6F = null;
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 880.0];
  let step = 0;

  if (bgmInterval6F) clearInterval(bgmInterval6F);
  bgmInterval6F = setInterval(() => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[step % melody.length], now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
      step++;
    } catch (_) {}
  }, 380);
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

function makeRoomSignTexture(title, subTitle, badgeColor = '#0284C7') {
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
// 📍 6층 8대 인터랙션 존 정의
// =====================================================================
const ZONES_6F = [
  {
    id: 'zone_6f_elev',
    code: '01',
    subCode: 'ELV',
    name: '6F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F·3F·4F 이동)',
    pos: [0.0, 0, 4.5],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 6층 다음세대 교육관 엘리베이터 홀',
    desc: '도면 하단 정중앙에 위치한 6층 엘리베이터 홀입니다. 1층 로비, 3층 대예배당, 4층 유아실로 즉시 이동할 수 있습니다.'
  },
  {
    id: 'zone_6f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 양방향 계단실 (⇄)',
    prompt: '02 계단실 (도보 층간 이동)',
    pos: [-2.0, 0, 4.2],
    isElevator: true,
    badge: '02 좌측 계단실',
    title: '🪜 6층 좌측 하단 양방향(⇄) 계단실',
    desc: '도면 좌측 하단에 위치한 위·아래층 연결 U자형 계단실입니다.'
  },
  {
    id: 'zone_6f_infant',
    code: '03',
    subCode: '유아',
    name: '좌측 중단 유아부실 (0~3세)',
    prompt: '03 유아부 예배실 들어가기',
    pos: [-1.8, 0, 1.85],
    roomTarget: [-4.3, 1.85],
    badge: '03 유아부 (좌측)',
    title: '👶 예수님 품 안에서 자라는 유아부 (좌측 중단)',
    desc: '계단실 바로 위쪽에 위치한 유아부실입니다. 컬러 볼풀장, 미니 미끄럼틀, 꽃모양 원탁이 꾸며져 있습니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 유아부실'
  },
  {
    id: 'zone_6f_elem_left',
    code: '04',
    subCode: '초등L',
    name: '좌측 상단 초등부 분반실',
    prompt: '04 좌측 초등부 분반실 보기',
    pos: [-1.8, 0, -1.8],
    roomTarget: [-4.4, -1.8],
    badge: '04 초등부 (좌측)',
    title: '📘 초등부 말씀 분반 & 소그룹 교육실 (좌측 상단)',
    desc: '유아부 위쪽에 위치한 초등부 소그룹 분반실입니다. 원형 모둠 테이블과 이젤 칠판에서 분반 공부가 진행됩니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 초등부실'
  },
  {
    id: 'zone_6f_newfamily',
    code: '05',
    subCode: '새가족',
    name: '상단 정면 새가족반 라운지',
    prompt: '05 새가족반 영접 라운지 안내',
    pos: [-0.2, 0, -3.8],
    roomTarget: [-1.5, -5.5],
    badge: '05 새가족반 (상단)',
    title: '🤝 환영합니다! 좋은나무교회 새가족반 (상단 정면)',
    desc: '중앙 홀 맨 안쪽(북쪽 상단)에 자리한 새가족 전용 라운지입니다.',
    schedule: '주일 오후 1:00 | 6층 상단 새가족반실'
  },
  {
    id: 'zone_6f_elem_right',
    code: '06',
    subCode: '초등R',
    name: '우측 상단 초등부 본관 (Sunday School)',
    prompt: '06 우측 초등부 본관 들어가기',
    pos: [1.8, 0, -1.8],
    roomTarget: [4.2, -2.0],
    badge: '06 초등부 (우측)',
    title: '🏫 초등부 Sunday School 메인 예배실 (우측 상단)',
    desc: '도면 우측 상단의 초등부 전용 예배실입니다.',
    schedule: '주일 오전 11:00 | 6층 우측 초등부실'
  },
  {
    id: 'zone_6f_kinder',
    code: '07',
    subCode: '유치',
    name: '우측 중단 유치부실 (4~7세)',
    prompt: '07 유치부 예배실 보기',
    pos: [1.8, 0, 1.4],
    roomTarget: [4.2, 1.4],
    badge: '07 유치부 (우측)',
    title: '🎨 말씀 안에서 꿈꾸는 유치부 (우측 중단)',
    desc: '우측 초등부실과 화장실 사이에 위치한 유치부실입니다.',
    schedule: '주일 오전 11:00 | 6층 우측 유치부실'
  },
  {
    id: 'zone_6f_restroom',
    code: '08',
    subCode: '화장실',
    name: '우측 하단 남·여 화장실 & 파우더룸',
    prompt: '08 6층 화장실 및 세면대 위치',
    pos: [1.8, 0, 3.6],
    roomTarget: [3.8, 3.6],
    badge: '08 화장실 (우측하단)',
    title: '🚻 6층 남·여 화장실 및 어린이 세면대 (우측 하단)',
    desc: '엘리베이터 우측 하단에 위치한 초디테일 화장실입니다.'
  }
];

// =====================================================================
// 🚧 [핵심 고도화] 실제 3D 벽 두께와 100% 일치하는 물리 충돌 박스 & 문(Doorway) 통과 엔진
// =====================================================================
const SOLID_WALL_BOXES_6F = [
  // 1) 좌측 세로 내벽 (X = -3.0) -> 문 위치: 초등L 문(Z: -2.4 ~ -1.2), 유아부 문(Z: 1.3 ~ 2.4), 계단 입구(Z: 3.3 ~ 4.4) 제외하고 모두 차단!
  { minX: -3.25, maxX: -2.75, minZ: -4.8, maxZ: -2.45 },
  { minX: -3.25, maxX: -2.75, minZ: -1.15, maxZ: 1.25 },
  { minX: -3.25, maxX: -2.75, minZ: 2.45, maxZ: 3.25 },
  { minX: -3.25, maxX: -2.75, minZ: 4.45, maxZ: 6.5 },
  // 2) 좌측 방들 사이 가로 구분벽 (초등L / 유아부 경계 Z = 0.6, 유아부 / 계단 경계 Z = 3.15)
  { minX: -7.0, maxX: -2.9, minZ: 0.4, maxZ: 0.8 },
  { minX: -7.0, maxX: -2.9, minZ: 2.95, maxZ: 3.35 },
  // 3) 우측 세로 내벽 (X = +2.8) -> 문 위치: 초등R 문(Z: -2.5 ~ -1.2), 유치부 문(Z: 0.8 ~ 1.9), 화장실 문(Z: 3.1 ~ 4.1) 제외하고 모두 차단!
  { minX: 2.55, maxX: 3.05, minZ: -6.8, maxZ: -2.55 },
  { minX: 2.55, maxX: 3.05, minZ: -1.15, maxZ: 0.75 },
  { minX: 2.55, maxX: 3.05, minZ: 1.95, maxZ: 3.05 },
  { minX: 2.55, maxX: 3.05, minZ: 4.15, maxZ: 6.5 },
  // 4) 우측 방들 사이 가로 구분벽 (초등R / 유치부 경계 Z = 0.0, 유치부 / 화장실 경계 Z = 2.8)
  { minX: 2.9, maxX: 7.0, minZ: -0.2, maxZ: 0.2 },
  { minX: 2.9, maxX: 7.0, minZ: 2.6, maxZ: 3.0 },
  // 5) 상단 새가족반 가로 내벽 (Z = -4.7) -> 문 위치(X: -1.1 ~ +0.6) 제외하고 모두 차단!
  { minX: -7.0, maxX: -1.15, minZ: -4.95, maxZ: -4.45 },
  { minX: 0.65, maxX: 2.9, minZ: -4.95, maxZ: -4.45 },
  // 6) 하단 엘리베이터 타워 구조물
  { minX: -1.8, maxX: 1.8, minZ: 5.5, maxZ: 6.8 }
];

// 캐릭터(반경 r=0.28)가 벽이나 가구 박스에 부딪히면 뚫고 들어가지 못하도록 밀어내는 실시간 물리 함수!
function resolveCollision6F(nx, nz, radius = 0.28) {
  let x = Math.max(-6.3, Math.min(6.3, nx));
  let z = Math.max(-6.2, Math.min(5.3, nz));

  for (const box of SOLID_WALL_BOXES_6F) {
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

// 캐릭터가 어느 위치에 있든 속한 방(Room ID)과 그 방의 출입문 안팎 좌표를 정확히 판별하여 벽을 절대 가로지르지 않게 경로 생성!
function getRoomDoorInfo6F(x, z) {
  if (z < -4.7 && x < 2.8) {
    return { room: 'newfamily', doorIn: [-0.2, -5.2], doorOut: [-0.2, -4.1] };
  }
  if (x < -3.0) {
    if (z < 0.6) return { room: 'elem_left', doorIn: [-3.5, -1.8], doorOut: [-2.3, -1.8] };
    if (z < 3.15) return { room: 'infant', doorIn: [-3.5, 1.85], doorOut: [-2.3, 1.85] };
    return { room: 'stairs', doorIn: [-3.5, 3.85], doorOut: [-2.3, 3.85] };
  }
  if (x > 2.8) {
    if (z < 0.0) return { room: 'elem_right', doorIn: [3.4, -1.85], doorOut: [2.1, -1.85] };
    if (z < 2.8) return { room: 'kinder', doorIn: [3.4, 1.35], doorOut: [2.1, 1.35] };
    return { room: 'restroom', doorIn: [3.4, 3.6], doorOut: [2.1, 3.6] };
  }
  return { room: 'hallway', doorIn: null, doorOut: null };
}

function computePath6F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision6F(rawEx, rawEz);
  const startInfo = getRoomDoorInfo6F(sx, sz);
  const endInfo = getRoomDoorInfo6F(ex, ez);

  // 같은 방(또는 같은 중앙 홀) 내부 이동이면 바로 이동
  if (startInfo.room === endInfo.room) {
    return [[ex, ez]];
  }

  const waypoints = [];

  // 1) 현재 방 안에 있다면 -> 현재 방의 문 안쪽 -> 문 바깥쪽(복도)으로 먼저 걸어 나옴!
  if (startInfo.room !== 'hallway') {
    waypoints.push(startInfo.doorIn);
    waypoints.push(startInfo.doorOut);
  }

  // 2) 복도를 따라 목적지 방의 문 바깥쪽까지 걸어감 -> 문 안쪽으로 진입!
  if (endInfo.room !== 'hallway') {
    waypoints.push([0.0, endInfo.doorOut[1]]);
    waypoints.push(endInfo.doorOut);
    waypoints.push(endInfo.doorIn);
  }

  // 3) 최종 목표 지점 도착
  waypoints.push([ex, ez]);
  return waypoints;
}

const NPCS_6F = [
  {
    id: 'npc_6f_1',
    name: '김전도사 (초등부)',
    x: 0.5,
    z: -0.5,
    patrolZ: [-2.8, 2.2],
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '애들아 안녕! 6층 초등부 예배실은 오른쪽 위편이야 😊',
      '새가족분들은 복도 맨 안쪽 새가족반 라운지로 오세요!',
      '할렐루야! 다음세대가 말씀으로 자라가는 6층 교육관입니다.'
    ]
  },
  {
    id: 'npc_6f_2',
    name: '박교사 (유치부)',
    x: 1.75,
    z: 1.3,
    isSkirt: true,
    autoWave: true,
    rotY: -0.8,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '우리 유치부 친구들 여기 오른쪽 방으로 모이세요 🎨',
      '무지개 무대 앞에서 선생님이랑 신나게 찬양해요!'
    ]
  },
  {
    id: 'npc_6f_3',
    name: '이교사 (유아부)',
    x: -1.75,
    z: 1.8,
    isSkirt: true,
    autoWave: true,
    rotY: 0.8,
    shirt: '#F59E0B',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: [
      '아기와 부모님이 함께 드리는 유아부는 왼쪽 방입니다 👶',
      '안쪽에 귀여운 볼풀장이랑 미끄럼틀도 준비되어 있어요~'
    ]
  },
  {
    id: 'npc_6f_4',
    name: '최팀장 (새가족반)',
    x: -0.2,
    z: -3.6,
    rotY: 0,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '주일 오후 1시 새가족반 라운지에 오신 것을 환영합니다 🤝',
      '따뜻한 차 한잔 하시면서 좋은나무교회 가족이 되어보세요!'
    ]
  },
  {
    id: 'npc_6f_kid1',
    name: '다윗 (초등부)',
    x: 4.1,
    z: -2.5,
    rotY: Math.PI,
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#78350F',
    dialogues: [
      '전도사님! 오늘 성경 퀴즈 대회 빨리 시작해요 🙋‍♂️',
      '친구들아 같이 초등부 앞자리 앉자!'
    ]
  }
];

function SmartCutawayWall6F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 3.5) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -3.5) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 3.5) shouldFade = true;
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

function HologramMarker6F({ zone, isSelected, onSelect }) {
  const pulseRef = useRef();

  const badgeTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
      grad.addColorStop(0, '#34D399');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w / 2 - 22, h / 2, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#A7F3D0';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 22, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 30, h / 2 + 6, 94, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 77, h / 2 + 28);
      }
    }, 340, 220);
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
          <planeGeometry args={[0.72, 0.44]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function SmoothChibiAvatar6F({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
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
      ctx.fillText(speechBubbleText.slice(0, 26), w / 2, (h - 24) / 2 + 4);
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
        st.z += st.dir * delta * 0.7;
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
      if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.58;
        leftLegRef.current.rotation.x = sw;
        rightLegRef.current.rotation.x = -sw;
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
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
      const bounce = walkingNow ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.01;
      rootRef.current.position.y = bounce;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.26} />
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

function DetailedChair({ position, rotationY = 0, seatColor = '#38BDF8', legColor = '#CBD5E1' }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.38, 0.06, 0.38]} position={[0, 0.32, 0]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.38, 0.32, 0.06]} position={[0, 0.49, -0.16]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.45} />
      </RoundedBox>
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.16, lz]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.32, 8]} />
          <meshStandardMaterial color={legColor} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function DetailedMiniatureToilet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.16, 0.05]} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.32, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.33, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.14, 0.035, 12, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      <RoundedBox args={[0.34, 0.36, 0.16]} position={[0, 0.48, -0.14]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </RoundedBox>
    </group>
  );
}

function CompactUStairwell6F({ position, onClickStairs, onClickExtinguisher }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[3.7, 2.9]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
      </mesh>

      <RoundedBox args={[0.85, 0.48, 2.7]} position={[-1.35, 0.24, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" roughness={0.45} />
      </RoundedBox>

      {Array.from({ length: 6 }).map((_, i) => (
        <RoundedBox
          key={`up_${i}`}
          args={[0.32, 0.08 + i * 0.07, 1.1]}
          position={[0.65 - i * 0.30, (0.08 + i * 0.07) / 2, -0.68]}
          radius={0.01}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            if (onClickStairs) onClickStairs();
          }}
        >
          <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#CBD5E1'} roughness={0.4} />
        </RoundedBox>
      ))}

      {Array.from({ length: 6 }).map((_, i) => (
        <RoundedBox
          key={`dn_${i}`}
          args={[0.32, 0.45 - i * 0.07, 1.1]}
          position={[-0.85 + i * 0.30, (0.45 - i * 0.07) / 2, 0.68]}
          radius={0.01}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            if (onClickStairs) onClickStairs();
          }}
        >
          <meshStandardMaterial color={i % 2 === 0 ? '#E2E8F0' : '#94A3B8'} roughness={0.4} />
        </RoundedBox>
      ))}

      <RoundedBox args={[1.95, 0.06, 0.06]} position={[-0.1, 0.78, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#78350F" roughness={0.35} />
      </RoundedBox>

      <group
        position={[1.45, 0, -1.1]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickExtinguisher) onClickExtinguisher();
        }}
      >
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.42, 16]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 6층 전체 건축 & 인테리어 (showRoomSigns 토글 지원 & 간판 크기 컴팩트화!)
// =====================================================================
function SixFloorMasterpieceDiorama({ activeZoneId, onSelectZone, activeNpcChatIdx, showRoomSigns }) {
  const signs = useMemo(() => ({
    newFamily: makeRoomSignTexture('새가족반', '주일 오후 1시 · 영접실', '#8B5CF6'),
    elemRight: makeRoomSignTexture('초등부 본관', '4~6학년 Sunday School', '#0284C7'),
    elemLeft: makeRoomSignTexture('초등부 분반실', '말씀 양육 · 소그룹', '#2563EB'),
    kinder: makeRoomSignTexture('유치부', '4~7세 예배 · 율동실', '#EC4899'),
    infant: makeRoomSignTexture('유아부', '0~3세 영유아 · 부모쉼터', '#F59E0B'),
    restroom: makeRoomSignTexture('화장실 🚻', '남·여 화장실 / 세면대', '#64748B'),
    elevator: makeRoomSignTexture('6F 엘리베이터', '1F · 3F · 4F 이동', '#10B981')
  }), []);

  return (
    <group>
      <RoundedBox args={[14.4, 0.2, 13.8]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 0.2]} receiveShadow>
        <planeGeometry args={[5.8, 9.6]} />
        <meshStandardMaterial color="#525E6E" roughness={0.55} />
      </mesh>

      {/* 방 1: 상단 정면 새가족반 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.0, 0.008, -5.65]} receiveShadow>
          <planeGeometry args={[9.4, 1.9]} />
          <meshStandardMaterial color="#E6D5B8" roughness={0.45} />
        </mesh>

        {[-3.8, -1.0].map((tx, idx) => (
          <group key={`nf_set_${idx}`} position={[tx, 0, -5.65]}>
            <RoundedBox args={[1.55, 0.06, 0.78]} position={[0, 0.58, 0]} radius={0.03} castShadow receiveShadow>
              <meshStandardMaterial color="#FDFBF7" roughness={0.3} />
            </RoundedBox>
            <DetailedChair position={[-0.42, 0, -0.52]} rotationY={0} seatColor="#A78BFA" />
            <DetailedChair position={[0.42, 0, -0.52]} rotationY={0} seatColor="#A78BFA" />
            <DetailedChair position={[-0.42, 0, 0.52]} rotationY={Math.PI} seatColor="#818CF8" />
            <DetailedChair position={[0.42, 0, 0.52]} rotationY={Math.PI} seatColor="#818CF8" />
          </group>
        ))}

        <RoundedBox args={[5.4, 1.25, 0.16]} position={[-4.1, 0.62, -4.7]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[2.0, 1.25, 0.16]} position={[1.8, 0.62, -4.7]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[-0.2, 1.65, -4.7]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.newFamily} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 방 2: 좌측 상단 초등부 분반실 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.008, -2.0]} receiveShadow>
          <planeGeometry args={[3.7, 5.0]} />
          <meshStandardMaterial color="#DBEAFE" roughness={0.5} />
        </mesh>

        {[-3.2, -0.9].map((tz, i) => (
          <group key={`round_grp_${i}`} position={[-4.9, 0, tz]}>
            <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.72, 0.72, 0.06, 32]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.10, 0.28, 0.54, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.5} />
            </mesh>
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, si) => (
              <mesh key={si} position={[Math.cos(ang) * 0.98, 0.22, Math.sin(ang) * 0.98]} castShadow>
                <cylinderGeometry args={[0.18, 0.16, 0.34, 20]} />
                <meshStandardMaterial color={si % 2 === 0 ? '#38BDF8' : '#F472B6'} />
              </mesh>
            ))}
          </group>
        ))}

        {showRoomSigns && (
          <Billboard position={[-3.0, 1.65, -1.5]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elemLeft} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 방 3: 좌측 중단 유아부 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.01, 1.85]} receiveShadow>
          <planeGeometry args={[3.7, 2.4]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.3, 0.015, 1.85]} receiveShadow>
          <circleGeometry args={[0.85, 32]} />
          <meshStandardMaterial color="#A7F3D0" />
        </mesh>

        <group position={[-5.75, 0, 1.45]}>
          <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.58, 0.14, 16, 32]} />
            <meshStandardMaterial color="#38BDF8" roughness={0.35} />
          </mesh>
          {[
            [-0.2, 0.12, -0.1, '#F43F5E'], [0.18, 0.14, -0.15, '#FACC15'], [0.0, 0.15, 0.12, '#4ADE80'],
            [-0.25, 0.13, 0.18, '#A855F7'], [0.24, 0.12, 0.15, '#FB923C'], [-0.05, 0.14, -0.24, '#38BDF8']
          ].map(([bx, by, bz, bcol], bi) => (
            <mesh key={bi} position={[bx, by, bz]} castShadow>
              <sphereGeometry args={[0.095, 12, 12]} />
              <meshStandardMaterial color={bcol} roughness={0.25} />
            </mesh>
          ))}
        </group>

        <RoundedBox args={[0.14, 1.75, 0.78]} position={[-3.0, 0.88, 2.55]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[-3.0, 1.65, 1.4]}>
            <mesh>
              <planeGeometry args={[1.1, 0.50]} />
              <meshBasicMaterial map={signs.infant} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 방 4: 좌측 하단 계단실 */}
      <CompactUStairwell6F
        position={[-4.9, 0, 4.75]}
        onClickStairs={() => onSelectZone(ZONES_6F[1])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '6F 소방안전 설비',
            title: '🧯 6F 계단실 코너 소화기',
            desc: '6층 계단실 코너에 비치된 초기 진화용 분말 소화기입니다.'
          })
        }
      />

      {/* 방 5: 우측 상단 초등부 본관 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, -3.3]} receiveShadow>
          <planeGeometry args={[3.9, 6.5]} />
          <meshStandardMaterial color="#E0F2FE" roughness={0.5} />
        </mesh>
        <RoundedBox args={[0.85, 0.88, 0.48]} position={[4.8, 0.50, -5.65]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88242" />
        </RoundedBox>
        {[-4.3, -3.0, -1.7].map((dz, rIdx) =>
          [3.95, 5.65].map((dx, cIdx) => (
            <group key={`el_desk_${rIdx}_${cIdx}`} position={[dx, 0, dz]}>
              <RoundedBox args={[1.25, 0.05, 0.52]} position={[0, 0.58, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
              </RoundedBox>
              <DetailedChair position={[-0.30, 0, 0.42]} rotationY={Math.PI} seatColor="#0284C7" />
              <DetailedChair position={[0.30, 0, 0.42]} rotationY={Math.PI} seatColor="#0284C7" />
            </group>
          ))
        )}
        {showRoomSigns && (
          <Billboard position={[2.8, 1.65, -2.0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elemRight} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 방 6: 우측 중단 유치부 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 1.4]} receiveShadow>
          <planeGeometry args={[3.9, 2.7]} />
          <meshStandardMaterial color="#FCE7F3" roughness={0.5} />
        </mesh>
        <group position={[4.5, 0, 1.4]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.68, 0.06, 32]} />
            <meshStandardMaterial color="#F472B6" roughness={0.35} />
          </mesh>
          {[0, 1.05, 2.1, 3.14, 4.2, 5.25].map((ang, ki) => (
            <mesh key={ki} position={[Math.cos(ang) * 0.95, 0.22, Math.sin(ang) * 0.95]} castShadow>
              <cylinderGeometry args={[0.17, 0.15, 0.34, 20]} />
              <meshStandardMaterial color={['#FACC15', '#38BDF8', '#4ADE80', '#FB7185', '#A78BFA', '#FB923C'][ki]} />
            </mesh>
          ))}
        </group>
        {showRoomSigns && (
          <Billboard position={[2.8, 1.65, 1.3]}>
            <mesh>
              <planeGeometry args={[1.1, 0.50]} />
              <meshBasicMaterial map={signs.kinder} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 방 7: 우측 하단 미니어처 화장실 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 4.6]} receiveShadow>
          <planeGeometry args={[3.9, 3.5]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
        </mesh>
        <group position={[3.35, 0, 4.85]}>
          <RoundedBox args={[0.58, 0.72, 2.1]} position={[0, 0.36, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </RoundedBox>
          {[-0.65, 0.0, 0.65].map((sz, si) => (
            <mesh key={`sink_${si}`} position={[0.04, 0.74, sz]} castShadow>
              <cylinderGeometry args={[0.18, 0.14, 0.09, 24]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
            </mesh>
          ))}
        </group>
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`m_stall_${bi}`} position={[5.25 + bx, 0, 3.55]}>
            <RoundedBox args={[0.06, 1.15, 1.1]} position={[-0.52, 0.58, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#93C5FD" />
            </RoundedBox>
            <DetailedMiniatureToilet position={[0, 0, -0.12]} rotationY={0} />
          </group>
        ))}
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`f_stall_${bi}`} position={[5.25 + bx, 0, 5.65]}>
            <RoundedBox args={[0.06, 1.15, 1.1]} position={[-0.52, 0.58, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#FBCFE8" />
            </RoundedBox>
            <DetailedMiniatureToilet position={[0, 0, 0.12]} rotationY={Math.PI} />
          </group>
        ))}
        {showRoomSigns && (
          <Billboard position={[2.8, 1.65, 3.8]}>
            <mesh>
              <planeGeometry args={[1.1, 0.50]} />
              <meshBasicMaterial map={signs.restroom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 구역 8: 하단 정중앙 엘리베이터 홀 */}
      <group position={[0, 0, 5.9]}>
        <RoundedBox args={[3.4, 2.4, 0.35]} position={[0, 1.2, 0.3]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.5, 2.05, 0.08]} position={[0, 1.02, 0.1]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 2.35, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elevator} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 내벽 구조물 (물리 충돌 박스와 정확히 일치하도록 문 구멍 개방!) */}
      <RoundedBox args={[0.16, 1.20, 2.3]} position={[-3.0, 0.60, -3.6]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 2.4]} position={[-3.0, 0.60, 0.05]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 0.6]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 3.15]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      <RoundedBox args={[0.16, 1.20, 4.2]} position={[2.8, 0.60, -4.65]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.9]} position={[2.8, 0.60, -0.2]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.1]} position={[2.8, 0.60, 2.5]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 0.0]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 2.8]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      <SmartCutawayWall6F wallSide="north">
        <RoundedBox args={[14.4, 2.4, 0.24]} position={[0, 1.2, -6.7]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="west">
        <RoundedBox args={[0.24, 2.4, 13.6]} position={[-7.0, 1.2, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="east">
        <RoundedBox args={[0.24, 2.4, 13.6]} position={[7.0, 1.2, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>

      {NPCS_6F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % NPCS_6F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar6F
            key={npc.id}
            position={[npc.x, 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
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

      {ZONES_6F.map((z) => (
        <HologramMarker6F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={onSelectZone}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 플레이어 아바타 컨트롤러 (매 프레임 실시간 물리 충돌 슬라이딩 적용!)
// =====================================================================
function PlayerController6F({ waypoints, playerIdxRef, playerName, emote, onPositionUpdate }) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [0.0, 0, 3.6],
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
      // 실시간 벽 충돌 슬라이딩 보정!
      const [nx, nz] = resolveCollision6F(rawNx, rawNz);
      playerIdxRef.current = [nx, 0, nz];
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
    <SmoothChibiAvatar6F
      position={renderState.pos}
      rotationY={renderState.rotY}
      isWalking={renderState.walking}
      hasSunglasses={true}
      emote={emote}
      shirtColor="#FACC15"
      pantsColor="#0284C7"
      hairColor="#EAB308"
      nameTagTexture={nameTagTex}
    />
  );
}

function InitialCameraSetup6F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 14.5, 13.5);
      camera.fov = 42;
    } else {
      camera.position.set(0, 11.8, 11.2);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, 0.2);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function Education6F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([0.0, 0, 3.6]);

  const [waypoints, setWaypoints] = useState([[0.0, 3.6]]);
  const [activeZone, setActiveZone] = useState(ZONES_6F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  // 🌟 [핵심 고도화] 화면을 가리던 미니맵/목록 패널과 3D 간판을 접고 끌 수 있는 상태! (모바일 기본 접힘)
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_6F.length);
    }, 3600);
    return () => {
      clearInterval(timer);
      togglePraiseBgm6F(false);
    };
  }, []);

  // 현재 캐릭터의 실제 위치(playerIdxRef)에서 목표 지점까지 문을 통과하는 경로 계산!
  const handleWalkTo = useCallback((tx, tz) => {
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computePath6F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, []);

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

    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(8, 6, 62, 16);
    ctx.fillStyle = '#0369A1';
    ctx.fillRect(72, 6, 34, 42);
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(8, 24, 28, 30);
    ctx.fillStyle = '#B45309';
    ctx.fillRect(8, 56, 28, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 74, 28, 16);
    ctx.fillStyle = '#9D174D';
    ctx.fillRect(72, 50, 34, 18);
    ctx.fillStyle = '#475569';
    ctx.fillRect(72, 70, 34, 20);
    ctx.fillStyle = '#059669';
    ctx.fillRect(42, 76, 24, 14);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 7) / 14) * w;
    const my = ((cz + 6.8) / 13.6) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, isMapDrawerOpen]);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_6F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 간판 표시 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 6F 다음세대 교육관
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
            onClick={() => {
              const next = !isMusicOn;
              setIsMusicOn(next);
              togglePraiseBgm6F(next);
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: isMusicOn ? '#F472B6' : '#FFFFFF' }}>
              {isMusicOn ? '🎵 BGM 끔' : '🔇 BGM'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.8, 11.2);
              controlsRef.current.target.set(0, 0.4, 0.2);
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 6F 맵·부서목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_6F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    const dest = z.roomTarget || [z.pos[0], z.pos[2]];
                    handleWalkTo(dest[0], dest[1]);
                    setActiveZone(z);
                    setModalZone(z);
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

      {/* 3. 하단 좌측~중앙: 접고 펼 수 있는 부서 바로가기 캡슐 독 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '👶', label: '유아부', zone: ZONES_6F[2] },
              { icon: '🎨', label: '유치부', zone: ZONES_6F[6] },
              { icon: '🏫', label: '초등부', zone: ZONES_6F[5] },
              { icon: '🤝', label: '새가족반', zone: ZONES_6F[4] }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const dest = item.zone.roomTarget || [item.zone.pos[0], item.zone.pos[2]];
                  handleWalkTo(dest[0], dest[1]);
                  setActiveZone(item.zone);
                }}
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
            🏫 부서 메뉴 ▲
          </button>
        )}
      </div>

      {/* 4. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.8, 11.2]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup6F controlsRef={controlsRef} />

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
          <planeGeometry args={[14.2, 13.6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SixFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            const dest = z.roomTarget || [z.pos[0], z.pos[2]];
            handleWalkTo(dest[0], dest[1]);
            setModalZone(z);
          }}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController6F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
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
          minDistance={3.0}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 부서 상세 안내 & 층간 이동 모달 */}
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

            {modalZone.schedule && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="p-3 rounded-2xl border border-white/10 text-xs flex justify-between">
                <span style={{ color: '#9CA3AF' }} className="font-bold">모임 시간 및 위치</span>
                <span style={{ color: '#FCD34D' }} className="font-black">{modalZone.schedule}</span>
              </div>
            )}

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실)' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반 (현재 층)' }
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
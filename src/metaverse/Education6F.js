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

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (나뭇결 · 퍼즐매트 · 타일 · 거울)
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
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 90; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 90) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 5, w * 0.7, y - Math.cos(i) * 5, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makePuzzleMatTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const colors = [
      ['#FEF3C7', '#FDE68A', '#A7F3D0', '#BAE6FD'],
      ['#FDE68A', '#FBCFE8', '#BAE6FD', '#FEF3C7'],
      ['#A7F3D0', '#FEF3C7', '#FDE68A', '#FBCFE8'],
      ['#BAE6FD', '#A7F3D0', '#FBCFE8', '#FEF3C7']
    ];
    const step = w / 4;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = colors[r][c];
        ctx.fillRect(c * step, r * step, step, step);
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 6;
        ctx.strokeRect(c * step + 3, r * step + 3, step - 6, step - 6);
      }
    }
  }, 512, 512);
}

function makeTileGridTexture(bgHex = '#F8FAFC', lineHex = '#CBD5E1', gridCount = 8) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.lineWidth = 3;
    const step = w / gridCount;
    for (let i = 0; i <= gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(w, i * step);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeBrightMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE');
    grad.addColorStop(0.4, '#F0F9FF');
    grad.addColorStop(0.55, '#FFFFFF');
    grad.addColorStop(0.8, '#BAE6FD');
    grad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let x = -80; x < w + 80; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 38, 0);
      ctx.lineTo(x - 52, h);
      ctx.lineTo(x - 90, h);
      ctx.closePath();
      ctx.fill();
    }
  }, 512, 256);
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
    prompt: '01 엘리베이터 탑승 (전 층 이동)',
    pos: [0.0, 0, 4.5],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 6층 다음세대 교육관 엘리베이터 홀',
    desc: '도면 하단 정중앙에 위치한 6층 엘리베이터 홀입니다. 1층 로비, 3층 대예배당, 4층 유아실, 5층 친교·찬양홀로 즉시 이동할 수 있습니다.'
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
    name: '좌측 중단 유아부실 (0~3세 키즈 놀이방)',
    prompt: '03 유아부 키즈 놀이방 들어가기',
    pos: [-1.8, 0, 1.85],
    roomTarget: [-4.2, 1.85],
    badge: '03 유아부 (좌측)',
    title: '👶 예수님 품 안에서 자라는 유아부 키즈 놀이방 (0~3세)',
    desc: '알록달록한 EVA 퍼즐매트 위에 실내 미끄럼틀, 파스텔 볼풀장, 흔들목마, 곰돌이 인형, 그림책 교구장이 완비된 유아부 전용 공간입니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 유아부실'
  },
  {
    id: 'zone_6f_elem_left',
    code: '04',
    subCode: '초등L',
    name: '좌측 상단 초등부 분반실',
    prompt: '04 좌측 초등부 분반실 보기',
    pos: [-1.8, 0, -1.8],
    roomTarget: [-4.1, -1.8],
    badge: '04 초등부 분반실',
    title: '📘 초등부 말씀 분반 & 소그룹 교육실 (좌측 상단)',
    desc: '원목 이젤 화이트보드와 도서 책장, 등받이 의자가 갖춰진 원형 모둠 테이블에서 소그룹 성경 공부가 진행됩니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 초등부실'
  },
  {
    id: 'zone_6f_newfamily',
    code: '05',
    subCode: '새가족',
    name: '상단 정면 새가족반 카페 라운지',
    prompt: '05 새가족반 영접 라운지 안내',
    pos: [-0.2, 0, -3.8],
    roomTarget: [-1.5, -5.5],
    badge: '05 새가족반 (상단)',
    title: '🤝 환영합니다! 좋은나무교회 새가족반 카페 라운지',
    desc: '에스프레소 커피머신과 다과 바, 원목 테이블과 푹신한 체어가 마련된 새가족 전용 환영 라운지입니다.',
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
    badge: '06 초등부 본관',
    title: '🏫 초등부 Sunday School 메인 예배실 (우측 상단)',
    desc: '2단 발판이 있는 십자가 원목 강대상과 대형 말씀 스크린, 성경책과 필통이 놓인 2인용 학습 책상 6세트가 정갈하게 배치된 초등부 본관입니다.',
    schedule: '주일 오전 11:00 | 6층 우측 초등부실'
  },
  {
    id: 'zone_6f_kinder',
    code: '07',
    subCode: '유치',
    name: '우측 중단 유치부실 (4~7세 율동·찬양실)',
    prompt: '07 유치부 예배실 보기',
    pos: [1.8, 0, 1.4],
    roomTarget: [4.0, 1.4],
    badge: '07 유치부 (우측)',
    title: '🎨 무지개 무대 위에서 찬양하는 유치부 (4~7세)',
    desc: '파스텔 무지개 아치 무대와 찬양 TV, 미니 전자건반, 크레파스와 스케치북이 놓인 꽃모양 원탁이 있는 유치부 예배실입니다.',
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
    desc: '밝은 대형 거울과 크롬 수전이 달린 세면대 3기, 남·여 개별 도어 부스와 정밀 양변기가 설치된 쾌적한 화장실입니다.'
  }
];

// =====================================================================
// 🚧 물리 충돌 박스 & 문(Doorway) 통과 네비게이션
// =====================================================================
const SOLID_WALL_BOXES_6F = [
  { minX: -3.25, maxX: -2.75, minZ: -4.8, maxZ: -2.45 },
  { minX: -3.25, maxX: -2.75, minZ: -1.15, maxZ: 1.25 },
  { minX: -3.25, maxX: -2.75, minZ: 2.45, maxZ: 3.25 },
  { minX: -3.25, maxX: -2.75, minZ: 4.45, maxZ: 6.5 },
  { minX: -7.0, maxX: -2.9, minZ: 0.4, maxZ: 0.8 },
  { minX: -7.0, maxX: -2.9, minZ: 2.95, maxZ: 3.35 },
  { minX: 2.55, maxX: 3.05, minZ: -6.8, maxZ: -2.55 },
  { minX: 2.55, maxX: 3.05, minZ: -1.15, maxZ: 0.75 },
  { minX: 2.55, maxX: 3.05, minZ: 1.95, maxZ: 3.05 },
  { minX: 2.55, maxX: 3.05, minZ: 4.15, maxZ: 6.5 },
  { minX: 2.9, maxX: 7.0, minZ: -0.2, maxZ: 0.2 },
  { minX: 2.9, maxX: 7.0, minZ: 2.6, maxZ: 3.0 },
  { minX: -7.0, maxX: -1.15, minZ: -4.95, maxZ: -4.45 },
  { minX: 0.65, maxX: 2.9, minZ: -4.95, maxZ: -4.45 },
  { minX: -1.8, maxX: 1.8, minZ: 5.5, maxZ: 6.8 }
];

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

  if (startInfo.room === endInfo.room) {
    return [[ex, ez]];
  }

  const waypoints = [];
  if (startInfo.room !== 'hallway') {
    waypoints.push(startInfo.doorIn);
    waypoints.push(startInfo.doorOut);
  }
  if (endInfo.room !== 'hallway') {
    waypoints.push([0.0, endInfo.doorOut[1]]);
    waypoints.push(endInfo.doorOut);
    waypoints.push(endInfo.doorIn);
  }
  waypoints.push([ex, ez]);
  return waypoints;
}

// =====================================================================
// 👥 6층 다음세대 교역자 · 교사 · 어린이 · 새가족팀 NPC (남녀 헤어스타일 & 1:1 대화 연동)
// =====================================================================
const NPCS_6F = [
  {
    id: 'npc_6f_pastor',
    name: '김전도사 (초등부 인도)',
    role: '초등부 담당교역자',
    x: 4.8,
    y: 0.28,
    z: -5.95,
    rotY: 0,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '얘들아 할렐루야! 오늘 초등부 말씀 제목은 "다윗처럼 담대하게"란다 ✝️',
      '책상 위에 펼쳐진 성경책을 함께 읽으며 하나님의 지혜를 배워보자!'
    ]
  },
  {
    id: 'npc_6f_1',
    name: '박부장 (교육관 안내)',
    role: '다음세대 교육위원장',
    x: 0.5,
    y: 0,
    z: -0.5,
    patrolZ: [-2.8, 2.2],
    gender: 'male',
    hairStyle: 'short',
    shirt: '#0284C7',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '반갑습니다! 6층은 유아부·유치부·초등부와 새가족반이 모이는 다음세대 교육관입니다 😊',
      '각 교실마다 미끄럼틀, 볼풀장, 무지개 무대, 성경책상이 예쁘게 준비되어 있어요!'
    ]
  },
  {
    id: 'npc_6f_2',
    name: '최교사 (유치부 찬양)',
    role: '유치부 율동·찬양교사',
    x: 1.75,
    y: 0,
    z: 1.3,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    autoWave: true,
    rotY: -0.8,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '우리 유치부 친구들 여기 오른쪽 무지개 무대 방으로 모이세요 🎨',
      '꽃모양 테이블에서 크레파스로 성경 색칠놀이도 하고 신나게 찬양해요!'
    ]
  },
  {
    id: 'npc_6f_3',
    name: '이교사 (유아부 돌봄)',
    role: '0~3세 유아부 교사',
    x: -1.75,
    y: 0,
    z: 1.8,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    autoWave: true,
    rotY: 0.8,
    shirt: '#F59E0B',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: [
      '아기와 부모님이 함께 드리는 유아부는 왼쪽 방입니다 👶',
      '푹신한 퍼즐매트 위에 미끄럼틀과 볼풀장, 흔들목마가 있어서 아기들이 정말 좋아해요~'
    ]
  },
  {
    id: 'npc_6f_4',
    name: '정팀장 (새가족반 영접)',
    role: '새가족부 섬김팀장',
    x: -0.2,
    y: 0,
    z: -3.6,
    rotY: 0,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#10B981',
    pants: '#D1FAE5',
    hair: '#27272A',
    dialogues: [
      '주일 오후 1시 새가족반 카페 라운지에 오신 것을 진심으로 환영합니다 🤝',
      '향긋한 커피와 다과를 나누시면서 좋은나무교회 가족이 되어보세요!'
    ]
  },
  {
    id: 'npc_6f_kid1',
    name: '다윗 (초등부 5학년)',
    role: '초등부 어린이 회장',
    x: 3.65,
    y: 0,
    z: -3.88,
    rotY: Math.PI,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#78350F',
    dialogues: [
      '전도사님! 책상 위 성경책 펴놓고 말씀 필기 준비 완료했어요 🙋‍♂️',
      '친구들아 같이 초등부 본관 앞자리에 앉아서 말씀 듣자!'
    ]
  },
  {
    id: 'npc_6f_kid2',
    name: '에스더 (초등부 4학년)',
    role: '초등부 찬양리더 어린이',
    x: 5.95,
    y: 0,
    z: -2.58,
    rotY: Math.PI,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: [
      '초등부 예배실 강대상이랑 스크린이 진짜 본당처럼 멋져요 ✨',
      '예배 끝나고 왼쪽 분반실 원탁에서 간식 먹으며 모둠 나눔 해요!'
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

// =====================================================================
// 🚶‍♀️ 3층 본당과 동일한 유선형(Sphere/Capsule) 캐릭터 & 뿔 없는 남녀 헤어스타일 & 멀티라인 말풍선
// =====================================================================
function wrapKoreanSpeechText(text, maxCharsPerLine = 19) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine) {
      if (current) lines.push(current);
      if (word.length > maxCharsPerLine) {
        lines.push(word.slice(0, maxCharsPerLine));
        current = word.slice(maxCharsPerLine);
      } else {
        current = word;
      }
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function CharacterHairStyle6F({ style = 'short', hairColor = '#27272A' }) {
  if (style === 'long_wave') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.02]} scale={[1.06, 0.96, 1.06]} castShadow>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshStandardMaterial color={hairColor} roughness={0.48} />
        </mesh>
        <mesh position={[-0.16, -0.08, -0.02]} rotation={[0, 0, 0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.24, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.48} />
        </mesh>
        <mesh position={[0.16, -0.08, -0.02]} rotation={[0, 0, -0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.24, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.48} />
        </mesh>
        <mesh position={[0, -0.10, -0.12]} scale={[1.25, 1.0, 0.6]} castShadow>
          <capsuleGeometry args={[0.12, 0.24, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.48} />
        </mesh>
      </group>
    );
  }

  if (style === 'bob') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.01]} scale={[1.08, 0.96, 1.06]} castShadow>
          <sphereGeometry args={[0.212, 24, 24]} />
          <meshStandardMaterial color={hairColor} roughness={0.45} />
        </mesh>
        <mesh position={[-0.15, -0.04, 0.0]} castShadow>
          <capsuleGeometry args={[0.05, 0.12, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.45} />
        </mesh>
        <mesh position={[0.15, -0.04, 0.0]} castShadow>
          <capsuleGeometry args={[0.05, 0.12, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.45} />
        </mesh>
      </group>
    );
  }

  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.94, 1.05]} castShadow>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshStandardMaterial color={hairColor} roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.12, -0.19]} castShadow>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color={hairColor} roughness={0.45} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.92, 1.05]} castShadow>
        <sphereGeometry args={[0.21, 24, 24]} />
        <meshStandardMaterial color={hairColor} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.09, 0.06]} scale={[0.96, 0.65, 0.82]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshStandardMaterial color={hairColor} roughness={0.48} />
      </mesh>
    </group>
  );
}

function SmoothChibiAvatar6F({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  gender = 'male',
  hairStyle = 'short',
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
  onClick = null,
  seedOffset = 0
}) {
  const outerGroupRef = useRef();
  const rootRef = useRef();
  const headGroupRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const isFemale = gender === 'female' || isSkirt;
  const patrolState = useRef({ z: position[2], dir: 1, pauseTimer: 0 });

  const bubbleData = useMemo(() => {
    if (!speechBubbleText) return null;
    const colonIdx = speechBubbleText.indexOf(':');
    const speakerName = colonIdx > -1 ? speechBubbleText.slice(0, colonIdx).trim() : '';
    const bodyText = colonIdx > -1 ? speechBubbleText.slice(colonIdx + 1).trim() : speechBubbleText;
    const wrappedLines = wrapKoreanSpeechText(bodyText, 19);

    const tex = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath();
      ctx.roundRect(14, 10, w - 28, h - 34, 28);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h - 24);
      ctx.lineTo(w / 2 + 14, h - 24);
      ctx.lineTo(w / 2, h - 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      let startY = speakerName ? 44 : 54;

      if (speakerName) {
        ctx.fillStyle = '#059669';
        ctx.font = '900 22px sans-serif';
        ctx.fillText(speakerName, w / 2, startY);
        startY += 32;
      }

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 24px sans-serif';
      wrappedLines.forEach((line, idx) => {
        ctx.fillText(line, w / 2, startY + idx * 30);
      });
    }, 540, 175);

    return { tex, planeW: 1.82, planeH: 0.59 };
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
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.24, 0.11);
        rightLegRef.current.position.set(0.085, 0.24, 0.11);
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.56;
        leftLegRef.current.rotation.x = sw;
        rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.085, 0.22, 0);
        rightLegRef.current.position.set(0.085, 0.22, 0);
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.085, 0.22, 0);
        rightLegRef.current.position.set(0.085, 0.22, 0);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.35 + Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = -0.35 + Math.cos(t * 2.2) * 0.04;
        leftArmRef.current.rotation.z = 0.1;
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
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce;
      rootRef.current.position.z = isSeated ? 0.04 : 0;
    }
  });

  return (
    <group
      ref={outerGroupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={onClick}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.25} />
      </mesh>

      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
          </mesh>
        </group>

        {isFemale ? (
          <group>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.135, 0.12, 0.24, 24]} />
              <meshStandardMaterial color={shirtColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.54, 0]} scale={[1.15, 0.55, 0.88]} castShadow>
              <sphereGeometry args={[0.135, 20, 20]} />
              <meshStandardMaterial color={shirtColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.125, 0.23, 0.24, 28]} />
              <meshStandardMaterial color={pantsColor || shirtColor} roughness={0.48} />
            </mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.39, 0]} scale={[1.18, 1.0, 0.85]} castShadow receiveShadow>
              <capsuleGeometry args={[0.145, 0.16, 16, 24]} />
              <meshStandardMaterial color={shirtColor} roughness={0.42} />
            </mesh>
            <mesh position={[0, 0.51, 0.115]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[0.045, 0.10, 3]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          </group>
        )}

        <group ref={leftArmRef} position={[-0.20, 0.50, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.15, 12, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.21, 0]} castShadow>
            <sphereGeometry args={[0.046, 14, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.20, 0.50, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.15, 12, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.21, 0]} castShadow>
            <sphereGeometry args={[0.046, 14, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>

        <group ref={headGroupRef} position={[0, 0.77, 0]}>
          <mesh scale={[1.04, 0.98, 1.0]} castShadow receiveShadow>
            <sphereGeometry args={[0.205, 28, 28]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          <mesh position={[-0.20, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
          <mesh position={[0.20, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>

          <CharacterHairStyle6F
            style={hairStyle || (isFemale ? 'long_wave' : 'short')}
            hairColor={hairColor}
          />

          {hasSunglasses ? (
            <group position={[0, 0.01, 0.195]}>
              <RoundedBox args={[0.13, 0.075, 0.025]} position={[-0.075, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.13, 0.075, 0.025]} position={[0.075, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
            </group>
          ) : (
            <>
              <mesh position={[-0.075, 0.0, 0.195]}>
                <sphereGeometry args={[0.024, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.075, 0.0, 0.195]}>
                <sphereGeometry args={[0.024, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[-0.115, -0.045, 0.175]} rotation={[0, -0.35, 0]}>
                <circleGeometry args={[0.028, 16]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
              </mesh>
              <mesh position={[0.115, -0.045, 0.175]} rotation={[0, 0.35, 0]}>
                <circleGeometry args={[0.028, 16]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
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

        {bubbleData && (
          <Billboard position={[0, 1.54, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[bubbleData.planeW, bubbleData.planeH]} />
              <meshBasicMaterial map={bubbleData.tex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🪑 초디테일 의자 · 양변기 · 키즈 미끄럼틀 · 흔들목마 컴포넌트
// =====================================================================
function DetailedChair({ position, rotationY = 0, seatColor = '#38BDF8', legColor = '#CBD5E1', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* 푹신한 라운드 시트 쿠션 */}
      <RoundedBox args={[0.38, 0.065, 0.38]} position={[0, 0.32, 0]} radius={0.025} castShadow receiveShadow>
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </RoundedBox>
      {/* 인체공학 곡면 등받이 (+Z 뒤쪽에 배치하여 정방향 착석 지원!) */}
      <RoundedBox args={[0.38, 0.32, 0.06]} position={[0, 0.50, 0.16]} rotation={[0.12, 0, 0]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </RoundedBox>
      {/* 등받이 연결 크롬 프레임 */}
      {[-0.10, 0.10].map((bx, i) => (
        <mesh key={i} position={[bx, 0.38, 0.16]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
          <meshStandardMaterial color={legColor} metalness={0.8} />
        </mesh>
      ))}
      {/* 스틸 다리 4개 */}
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.16, lz]} castShadow>
          <cylinderGeometry args={[0.018, 0.014, 0.32, 8]} />
          <meshStandardMaterial color={legColor} metalness={0.75} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function DetailedMiniatureToilet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 도자기 하부 배수 베이스 */}
      <mesh position={[0, 0.15, 0.05]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.30, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      {/* 양변기 보울 내부 깨끗한 물 */}
      <mesh position={[0, 0.28, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.11, 20]} />
        <meshBasicMaterial color="#BAE6FD" />
      </mesh>
      {/* 둥근 변기 시트 링 */}
      <mesh position={[0, 0.32, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.135, 0.035, 14, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </mesh>
      {/* 세워진 변기 커버 뚜껑 */}
      <RoundedBox args={[0.28, 0.30, 0.03]} position={[0, 0.48, -0.04]} rotation={[-0.15, 0, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </RoundedBox>
      {/* 도자기 물탱크 수조 & 크롬 플러시 버튼 */}
      <RoundedBox args={[0.34, 0.36, 0.16]} position={[0, 0.48, -0.15]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.04, 0.18]} position={[0, 0.67, -0.15]} radius={0.015}>
        <meshStandardMaterial color="#F1F5F9" roughness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0.70, -0.15]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 🛝 유아부 전용 실내 미끄럼틀 & 계단 플레이하우스
function KidsIndoorSlideSet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 양옆 안전 측벽 패널 (파스텔 민트) */}
      {[-0.24, 0.24].map((sx, i) => (
        <RoundedBox key={i} args={[0.05, 0.68, 0.56]} position={[sx, 0.34, -0.25]} radius={0.02} castShadow>
          <meshStandardMaterial color="#34D399" roughness={0.35} />
        </RoundedBox>
      ))}
      {/* 상단 출발 플랫폼 */}
      <RoundedBox args={[0.46, 0.06, 0.44]} position={[0, 0.52, -0.25]} radius={0.015} castShadow>
        <meshStandardMaterial color="#FEF08A" />
      </RoundedBox>
      {/* 뒤쪽 3단 안전 계단 */}
      {[0, 1, 2].map((st) => (
        <RoundedBox
          key={st}
          args={[0.42, 0.06, 0.14]}
          position={[0, 0.14 + st * 0.14, -0.68 + st * 0.14]}
          radius={0.01}
          castShadow
        >
          <meshStandardMaterial color={st % 2 === 0 ? '#38BDF8' : '#F472B6'} />
        </RoundedBox>
      ))}
      {/* 앞쪽으로 매끄럽게 내려오는 노란색 슬라이드 경사로 & 양옆 가드레일 */}
      <group position={[0, 0.27, 0.32]} rotation={[0.58, 0, 0]}>
        <RoundedBox args={[0.42, 0.05, 0.96]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial color="#FACC15" roughness={0.25} />
        </RoundedBox>
        {[-0.21, 0.21].map((rx, ri) => (
          <RoundedBox key={ri} args={[0.04, 0.12, 0.96]} position={[rx, 0.05, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#FB7185" roughness={0.3} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

// 🐎 유아부 흔들목마(Rocking Horse) 장난감
function KidsRockingHorse({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 하단 곡선 썰매 러너 2개 */}
      {[-0.12, 0.12].map((rx, i) => (
        <RoundedBox key={i} args={[0.04, 0.05, 0.68]} position={[rx, 0.04, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F59E0B" />
        </RoundedBox>
      ))}
      {/* 목마 몸통 & 안장 */}
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.22, 12, 16]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.35} />
      </mesh>
      <RoundedBox args={[0.16, 0.04, 0.16]} position={[0, 0.33, -0.02]} radius={0.01}>
        <meshStandardMaterial color="#F43F5E" />
      </RoundedBox>
      {/* 목마 목 & 얼굴 & 손잡이 */}
      <mesh position={[0, 0.38, 0.16]} rotation={[-0.35, 0, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.16, 12, 16]} />
        <meshStandardMaterial color="#38BDF8" />
      </mesh>
      <mesh position={[0, 0.48, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.10, 12, 16]} />
        <meshStandardMaterial color="#BAE6FD" />
      </mesh>
      <mesh position={[0, 0.42, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
        <meshStandardMaterial color="#FEF08A" />
      </mesh>
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

      {/* 계단 중앙 안전 난간 기둥 및 원목 핸드레일 */}
      <RoundedBox args={[1.95, 0.06, 0.06]} position={[-0.1, 0.78, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#78350F" roughness={0.35} />
      </RoundedBox>
      {[-0.8, 0.0, 0.6].map((px, pi) => (
        <mesh key={pi} position={[px, 0.42, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.7} />
        </mesh>
      ))}

      {/* 디테일한 빨간 소화기 (노즐·손잡이·게이지 포함) */}
      <group
        position={[1.45, 0, -1.1]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickExtinguisher) onClickExtinguisher();
        }}
      >
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.42, 16]} />
          <meshStandardMaterial color="#EF4444" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.06, 12]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
        <RoundedBox args={[0.08, 0.02, 0.03]} position={[0.03, 0.49, 0]} rotation={[0, 0, -0.3]} radius={0.005}>
          <meshStandardMaterial color="#FACC15" metalness={0.8} />
        </RoundedBox>
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 6층 전체 초디테일 건축 & 인테리어 디오라마
// =====================================================================
function SixFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  onSitOnSeat,
  onSelectNpcForChat,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const lightWoodFloorTex = useMemo(() => makeWoodGrainTexture('#E6CBA8', '#C8A273'), []);
  const puzzleMatTex = useMemo(() => makePuzzleMatTexture(), []);
  const restroomTileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);

  const elemScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0284C7');
      grad.addColorStop(1, '#1E3A8A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOOD TREE SUNDAY SCHOOL', w / 2, 68);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 44px sans-serif';
      ctx.fillText('다윗처럼 믿음으로 승리해요!', w / 2, 138);

      ctx.fillStyle = '#BAE6FD';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('사무엘상 17장 45절 · 초등부 예배', w / 2, 198);
    }, 512, 256);
  }, []);

  const signs = useMemo(() => ({
    newFamily: makeRoomSignTexture('새가족반 라운지', '주일 오후 1시 · 영접실', '#8B5CF6'),
    elemRight: makeRoomSignTexture('초등부 본관 🏫', '4~6학년 Sunday School', '#0284C7'),
    elemLeft: makeRoomSignTexture('초등부 분반실', '말씀 양육 · 모둠학습', '#2563EB'),
    kinder: makeRoomSignTexture('유치부 🎨', '4~7세 무지개 찬양실', '#EC4899'),
    infant: makeRoomSignTexture('유아부 👶', '0~3세 키즈 놀이방', '#F59E0B'),
    restroom: makeRoomSignTexture('화장실 🚻', '남·여 화장실 / 세면대', '#64748B'),
    elevator: makeRoomSignTexture('6F 엘리베이터', '1F · 3F · 4F · 5F 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 6층 베이스 슬래브 & 중앙 복도 바닥 */}
      <RoundedBox args={[14.4, 0.2, 13.8]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 0.2]} receiveShadow>
        <planeGeometry args={[5.8, 9.6]} />
        <meshStandardMaterial color="#525E6E" roughness={0.55} />
      </mesh>

      {/* ================================================================= */}
      {/* 🤝 [방 1: 상단 정면 새가족반 카페 라운지] (원목 테이블·다과 커피바·화분·환영보드) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.0, 0.008, -5.65]} receiveShadow>
          <planeGeometry args={[9.4, 1.9]} />
          <meshStandardMaterial map={lightWoodFloorTex} roughness={0.4} />
        </mesh>

        {/* 새가족 영접 테이블 2세트 + 다과 접시 & 찻잔 + 마주 보는 정방향 의자 */}
        {[-3.8, -1.1].map((tx, idx) => (
          <group key={`nf_set_${idx}`} position={[tx, 0, -5.65]}>
            <RoundedBox args={[1.60, 0.06, 0.82]} position={[0, 0.58, 0]} radius={0.025} castShadow receiveShadow>
              <meshStandardMaterial map={oakWoodTex} roughness={0.32} />
            </RoundedBox>
            {[-0.55, 0.55].map((lx, li) => (
              <mesh key={li} position={[lx, 0.29, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.56, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.7} />
              </mesh>
            ))}
            {/* 테이블 위 다과 트레이 & 커피잔 2개 & 미니 꽃병 */}
            <RoundedBox args={[0.28, 0.02, 0.20]} position={[0, 0.62, 0]} radius={0.01}>
              <meshStandardMaterial color="#FEF08A" />
            </RoundedBox>
            <mesh position={[-0.35, 0.64, 0.15]}>
              <cylinderGeometry args={[0.035, 0.03, 0.07, 12]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0.35, 0.64, -0.15]}>
              <cylinderGeometry args={[0.035, 0.03, 0.07, 12]} />
              <meshStandardMaterial color="#F472B6" />
            </mesh>

            {/* 위쪽 의자(남쪽 테이블 응시: rotationY = Math.PI) & 아래쪽 의자(북쪽 테이블 응시: rotationY = 0) */}
            <DetailedChair
              position={[-0.44, 0, -0.54]}
              rotationY={Math.PI}
              seatColor="#A78BFA"
              onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx - 0.44, z: -5.65 - 0.54, rotY: 0, rowLabel: '새가족반 환영석' }); }}
            />
            <DetailedChair
              position={[0.44, 0, -0.54]}
              rotationY={Math.PI}
              seatColor="#A78BFA"
              onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx + 0.44, z: -5.65 - 0.54, rotY: 0, rowLabel: '새가족반 환영석' }); }}
            />
            <DetailedChair
              position={[-0.44, 0, 0.54]}
              rotationY={0}
              seatColor="#818CF8"
              onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx - 0.44, z: -5.65 + 0.54, rotY: Math.PI, rowLabel: '새가족반 환영석' }); }}
            />
            <DetailedChair
              position={[0.44, 0, 0.54]}
              rotationY={0}
              seatColor="#818CF8"
              onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx + 0.44, z: -5.65 + 0.54, rotY: Math.PI, rowLabel: '새가족반 환영석' }); }}
            />
          </group>
        ))}

        {/* 우측 코너: 에스프레소 커피머신 & 다과 바 카운터 + 환영 화분 */}
        <group position={[1.65, 0, -5.85]}>
          <RoundedBox args={[1.35, 0.78, 0.56]} position={[0, 0.39, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.42, 0.06, 0.62]} position={[0, 0.80, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          {/* 커피머신 & 보온병 */}
          <RoundedBox args={[0.36, 0.38, 0.32]} position={[-0.32, 1.01, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#1E293B" metalness={0.6} />
          </RoundedBox>
          <mesh position={[0.25, 0.96, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.28, 16]} />
            <meshStandardMaterial color="#DC2626" roughness={0.3} />
          </mesh>
        </group>

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

      {/* ================================================================= */}
      {/* 📘 [방 2: 좌측 상단 초등부 분반실] (모둠 원탁·등받이 의자·이젤 화이트보드·도서 책장) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.008, -2.0]} receiveShadow>
          <planeGeometry args={[3.7, 5.0]} />
          <meshStandardMaterial color="#DBEAFE" roughness={0.5} />
        </mesh>

        {/* 서쪽 벽면: 알록달록 성경 동화책이 꽂힌 원목 교구 책장 & 이젤 칠판 */}
        <group position={[-6.48, 0, -2.2]}>
          <RoundedBox args={[0.42, 1.45, 2.2]} position={[0, 0.72, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          {[-0.75, -0.35, 0.05, 0.45, 0.82].map((bz, bi) => (
            <RoundedBox
              key={bi}
              args={[0.28, 0.28, 0.22]}
              position={[0.06, 0.96, bz]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial color={['#EF4444', '#FACC15', '#10B981', '#38BDF8', '#A855F7'][bi]} />
            </RoundedBox>
          ))}
        </group>

        {/* 북쪽 코너: 원목 삼각 이젤 화이트보드 */}
        <group position={[-5.95, 0, -4.15]} rotation={[0, 0.45, 0]}>
          <RoundedBox args={[0.82, 0.64, 0.04]} position={[0, 0.92, 0]} rotation={[-0.12, 0, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[0.88, 0.70, 0.03]} position={[0, 0.92, -0.01]} rotation={[-0.12, 0, 0]} radius={0.015}>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          {[-0.28, 0.28].map((lx, li) => (
            <mesh key={li} position={[lx, 0.46, 0]} rotation={[0.12, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.96, 8]} />
              <meshStandardMaterial map={oakWoodTex} />
            </mesh>
          ))}
        </group>

        {/* 원형 모둠 테이블 2세트 + 테이블 위 성경 공과책 + 정방향 등받이 의자 4개씩 */}
        {[-3.2, -0.85].map((tz, i) => (
          <group key={`round_grp_${i}`} position={[-4.85, 0, tz]}>
            <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.74, 0.74, 0.06, 36]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.10, 0.28, 0.54, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.6} />
            </mesh>
            {/* 테이블 위 펼쳐진 성경 공과 워크북 3권 */}
            {[0, 2.1, 4.2].map((ang, bi) => (
              <RoundedBox
                key={bi}
                args={[0.24, 0.02, 0.18]}
                position={[Math.cos(ang) * 0.36, 0.60, Math.sin(ang) * 0.36]}
                rotation={[0, -ang, 0]}
                radius={0.005}
              >
                <meshStandardMaterial color={bi === 0 ? '#FFFFFF' : bi === 1 ? '#BAE6FD' : '#FBCFE8'} />
              </RoundedBox>
            ))}
            {/* 원탁을 향해 정면으로 배치된 등받이 의자 4개 */}
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, si) => {
              const cx = Math.cos(ang) * 0.98;
              const cz = Math.sin(ang) * 0.98;
              const chairRot = Math.atan2(cx, cz);
              return (
                <DetailedChair
                  key={si}
                  position={[cx, 0, cz]}
                  rotationY={chairRot}
                  seatColor={si % 2 === 0 ? '#38BDF8' : '#F472B6'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSitOnSeat({ x: -4.85 + cx, z: tz + cz, rotY: chairRot + Math.PI, rowLabel: '초등부 분반실 모둠석' });
                  }}
                />
              );
            })}
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

      {/* ================================================================= */}
      {/* 👶 [방 3: 좌측 중단 유아부 키즈 놀이방] (퍼즐매트·실내 미끄럼틀·볼풀장·흔들목마·장난감 교구장!) */}
      {/* ================================================================= */}
      <group>
        {/* 알록달록 푹신한 EVA 유아 퍼즐매트 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.01, 1.85]} receiveShadow>
          <planeGeometry args={[3.7, 2.4]} />
          <meshStandardMaterial map={puzzleMatTex} roughness={0.65} />
        </mesh>

        {/* 1) 우측 안쪽: 실내 유아용 미끄럼틀 & 계단 플레이하우스 (`KidsIndoorSlideSet`) */}
        <KidsIndoorSlideSet position={[-4.05, 0, 1.65]} rotationY={-Math.PI / 2} />

        {/* 2) 중앙: 귀여운 하늘색 흔들목마 (`KidsRockingHorse`) */}
        <KidsRockingHorse position={[-4.75, 0, 2.45]} rotationY={0.4} />

        {/* 3) 좌측 안쪽: 22개의 파스텔 볼이 가득 담긴 폭신폭신 쿠션 볼풀장 */}
        <group position={[-5.85, 0, 1.55]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.64, 32]} />
            <meshStandardMaterial color="#E0F2FE" />
          </mesh>
          {/* 2단 도넛 쿠션 튜브 벽 */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.62, 0.13, 18, 36]} />
            <meshStandardMaterial color="#38BDF8" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.62, 0.11, 18, 36]} />
            <meshStandardMaterial color="#FDE047" roughness={0.35} />
          </mesh>
          {/* 풍성한 20개 컬러풀 볼풀 공 */}
          {Array.from({ length: 20 }).map((_, bi) => {
            const r = ((bi * 37) % 45) / 100;
            const ang = bi * 1.9;
            const bx = Math.cos(ang) * r;
            const bz = Math.sin(ang) * r;
            const by = 0.10 + (bi % 3) * 0.05;
            const bColors = ['#F43F5E', '#FACC15', '#4ADE80', '#A855F7', '#FB923C', '#38BDF8', '#FFFFFF'];
            return (
              <mesh key={bi} position={[bx, by, bz]} castShadow>
                <sphereGeometry args={[0.085, 12, 12]} />
                <meshStandardMaterial color={bColors[bi % bColors.length]} roughness={0.22} />
              </mesh>
            );
          })}
        </group>

        {/* 4) 남쪽 벽면: 유아용 그림책 & 블록 수납 교구장 + 아기 곰돌이 인형 */}
        <group position={[-5.65, 0, 2.78]}>
          <RoundedBox args={[1.45, 0.56, 0.34]} position={[0, 0.28, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FEF9C3" />
          </RoundedBox>
          {[-0.45, 0, 0.45].map((bx, i) => (
            <RoundedBox key={i} args={[0.36, 0.22, 0.30]} position={[bx, 0.22, -0.04]} radius={0.015}>
              <meshStandardMaterial color={['#F472B6', '#38BDF8', '#34D399'][i]} />
            </RoundedBox>
          ))}
        </group>

        <RoundedBox args={[0.08, 1.75, 0.78]} position={[-3.0, 0.88, 2.45]} rotation={[0, 0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#F59E0B" />
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

      {/* ================================================================= */}
      {/* 🪜 [방 4: 좌측 하단 계단실] */}
      {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* 🏫 [방 5: 우측 상단 초등부 본관] (십자가 원목 강대상·대형 스크린·성경책과 필통이 놓인 책상 6세트!) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, -3.3]} receiveShadow>
          <planeGeometry args={[3.9, 6.5]} />
          <meshStandardMaterial color="#E0F2FE" roughness={0.5} />
        </mesh>

        {/* 초등부 전면 북쪽 벽: 대형 말씀 스크린 & 초록 칠판 & 십자가 원목 강대상 + 2단 발판 */}
        <group position={[4.8, 0, -5.65]}>
          {/* 벽걸이 말씀 스크린 */}
          <RoundedBox args={[2.2, 1.05, 0.06]} position={[0, 1.52, -0.82]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" />
          </RoundedBox>
          <mesh position={[0, 1.52, -0.78]}>
            <planeGeometry args={[2.08, 0.94]} />
            <meshBasicMaterial map={elemScreenTex} />
          </mesh>

          {/* 원목 강단 데크 & 전도사님 발판 */}
          <RoundedBox args={[2.6, 0.10, 1.1]} position={[0, 0.05, 0]} radius={0.02} receiveShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.85, 0.18, 0.48]} position={[0, 0.19, -0.28]} radius={0.015} castShadow>
            <meshStandardMaterial color="#991B1B" />
          </RoundedBox>

          {/* 십자가 원목 강대상 (주황 박스 완전 탈피!) */}
          <RoundedBox args={[0.86, 0.72, 0.46]} position={[0, 0.44, 0.15]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[0.98, 0.08, 0.54]} position={[0, 0.82, 0.15]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.48, 0.39]}>
            <boxGeometry args={[0.04, 0.26, 0.015]} />
            <meshStandardMaterial color="#FDE047" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.53, 0.39]}>
            <boxGeometry args={[0.16, 0.04, 0.015]} />
            <meshStandardMaterial color="#FDE047" metalness={0.8} />
          </mesh>
        </group>

        {/* 초등부 2인용 학습 책상 6세트 (원목 상판 + 스틸 다리 4개 + 펼쳐진 성경책·필통 + 정방향 의자 12석) */}
        {[-4.3, -3.0, -1.7].map((dz, rIdx) =>
          [3.95, 5.65].map((dx, cIdx) => (
            <group key={`el_desk_${rIdx}_${cIdx}`} position={[dx, 0, dz]}>
              {/* 책상 상판 & 하부 서랍 선반 */}
              <RoundedBox args={[1.26, 0.05, 0.54]} position={[0, 0.58, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={lightWoodFloorTex} roughness={0.3} />
              </RoundedBox>
              <RoundedBox args={[1.16, 0.03, 0.42]} position={[0, 0.46, 0]} radius={0.01}>
                <meshStandardMaterial color="#CBD5E1" />
              </RoundedBox>
              {/* 책상 스틸 다리 4개 */}
              {[[-0.56, -0.22], [0.56, -0.22], [-0.56, 0.22], [0.56, 0.22]].map(([lx, lz], li) => (
                <mesh key={li} position={[lx, 0.29, lz]} castShadow>
                  <cylinderGeometry args={[0.022, 0.018, 0.58, 8]} />
                  <meshStandardMaterial color="#64748B" metalness={0.7} />
                </mesh>
              ))}
              {/* 책상 위 펼쳐진 성경책 2권 & 노란 필통 */}
              {[-0.30, 0.30].map((bx, bi) => (
                <group key={bi} position={[bx, 0.615, 0]}>
                  <RoundedBox args={[0.26, 0.02, 0.19]} radius={0.005}>
                    <meshStandardMaterial color="#FFFFFF" />
                  </RoundedBox>
                  <RoundedBox args={[0.08, 0.025, 0.04]} position={[0.16, 0.005, -0.12]} radius={0.005}>
                    <meshStandardMaterial color={bi === 0 ? '#FACC15' : '#38BDF8'} />
                  </RoundedBox>
                </group>
              ))}

              {/* 강대상을 정면으로 바라보는 정방향 의자 (`rotationY = 0` 이어야 등받이가 뒤쪽 +Z에 위치!) */}
              <DetailedChair
                position={[-0.30, 0, 0.42]}
                rotationY={0}
                seatColor="#0284C7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: dx - 0.30, z: dz + 0.42, rotY: Math.PI, rowLabel: `초등부 본관 ${rIdx + 1}열 좌석` });
                }}
              />
              <DetailedChair
                position={[0.30, 0, 0.42]}
                rotationY={0}
                seatColor="#0284C7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: dx + 0.30, z: dz + 0.42, rotY: Math.PI, rowLabel: `초등부 본관 ${rIdx + 1}열 좌석` });
                }}
              />
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

      {/* ================================================================= */}
      {/* 🎨 [방 6: 우측 중단 유치부] (파스텔 무지개 아치 무대·미니 건반·꽃모양 원탁·유아 등받이 의자!) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 1.4]} receiveShadow>
          <planeGeometry args={[3.9, 2.7]} />
          <meshStandardMaterial color="#FCE7F3" roughness={0.5} />
        </mesh>

        {/* 동쪽 벽면: 유치부 파스텔 무지개 아치 찬양 무대 & 미니 신디사이저 건반 */}
        <group position={[6.55, 0, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
          {/* 반원형 율동 무대 데크 */}
          <mesh position={[0, 0.05, 0.35]} receiveShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.10, 32]} />
            <meshStandardMaterial color="#FDE047" />
          </mesh>
          {/* 4겹 파스텔 무지개 아치 링 */}
          {[
            [0.95, '#F43F5E'],
            [0.80, '#FACC15'],
            [0.65, '#4ADE80'],
            [0.50, '#38BDF8']
          ].map(([rad, col], ri) => (
            <mesh key={ri} position={[0, 0.65, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[rad, 0.075, 12, 32, Math.PI]} />
              <meshStandardMaterial color={col} roughness={0.3} />
            </mesh>
          ))}
          {/* 양끝 뭉게구름 장식 */}
          {[-0.85, 0.85].map((cx, ci) => (
            <group key={ci} position={[cx, 0.65, 0.08]}>
              <mesh position={[0, 0, 0]}><sphereGeometry args={[0.16, 14, 14]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
              <mesh position={[-0.12, -0.04, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
              <mesh position={[0.12, -0.04, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            </group>
          ))}
        </group>

        {/* 중앙 유치부 원탁 + 스케치북·크레파스 통 + 등받이 달린 컬러 키즈 체어 6개 */}
        <group position={[4.35, 0, 1.4]}>
          <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.72, 0.72, 0.06, 36]} />
            <meshStandardMaterial color="#F472B6" roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.23, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.28, 0.45, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* 중앙 크레파스 꽃병 통 & 스케치북 */}
          <mesh position={[0, 0.54, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.07, 0.12, 16]} />
            <meshStandardMaterial color="#FEF08A" />
          </mesh>
          {[0, 1.05, 2.1, 3.14, 4.2, 5.25].map((ang, ki) => {
            const kx = Math.cos(ang) * 0.96;
            const kz = Math.sin(ang) * 0.96;
            const kRot = Math.atan2(kx, kz);
            const kCol = ['#FACC15', '#38BDF8', '#4ADE80', '#FB7185', '#A78BFA', '#FB923C'][ki];
            return (
              <DetailedChair
                key={ki}
                position={[kx, 0, kz]}
                rotationY={kRot}
                seatColor={kCol}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: 4.35 + kx, z: 1.4 + kz, rotY: kRot + Math.PI, rowLabel: '유치부 원탁석' });
                }}
              />
            );
          })}
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

      {/* ================================================================= */}
      {/* 🚻 [방 7: 우측 하단 호텔급 화장실] (대형 거울·도자기 세면대·수전·도어 큐비클·양변기!) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 4.6]} receiveShadow>
          <planeGeometry args={[3.9, 3.5]} />
          <meshStandardMaterial map={restroomTileTex} roughness={0.28} />
        </mesh>

        {/* 서쪽 벽면: 대리석 세면대 카운터 + 밝은 대형 거울 + 도자기 세면볼 3기 + 은색 수전 + 물비누 */}
        <group position={[3.35, 0, 4.75]}>
          <RoundedBox args={[0.56, 0.72, 2.25]} position={[0, 0.36, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </RoundedBox>
          {/* 밝게 빛나는 전면 거울 & 상단 간접조명 바 */}
          <mesh position={[-0.25, 1.18, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.12, 0.78]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
          <RoundedBox args={[0.06, 0.05, 2.14]} position={[-0.24, 1.60, 0]} radius={0.01}>
            <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.5} />
          </RoundedBox>

          {[-0.68, 0.0, 0.68].map((sz, si) => (
            <group key={`sink_${si}`} position={[0.04, 0.74, sz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.18, 0.14, 0.09, 24]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.14, 0.12, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              {/* 크롬 수도꼭지 수전 & 물비누 디스펜서 */}
              <mesh position={[-0.16, 0.09, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.15, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
              <mesh position={[-0.14, 0.06, 0.22]}>
                <cylinderGeometry args={[0.025, 0.028, 0.09, 10]} />
                <meshStandardMaterial color="#10B981" />
              </mesh>
            </group>
          ))}
        </group>

        {/* 북측 남성용 큐비클 2칸 (반열린 도어 + 손잡이 + 양변기) */}
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`m_stall_${bi}`} position={[5.25 + bx, 0, 3.55]}>
            <RoundedBox args={[0.05, 1.18, 1.1]} position={[-0.52, 0.59, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#93C5FD" roughness={0.35} />
            </RoundedBox>
            <RoundedBox args={[0.82, 1.08, 0.05]} position={[0, 0.56, 0.52]} rotation={[0, 0.35, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#60A5FA" roughness={0.35} />
            </RoundedBox>
            <DetailedMiniatureToilet position={[0, 0, -0.12]} rotationY={0} />
          </group>
        ))}

        {/* 남측 여성용 큐비클 2칸 (반열린 도어 + 손잡이 + 양변기) */}
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`f_stall_${bi}`} position={[5.25 + bx, 0, 5.65]}>
            <RoundedBox args={[0.05, 1.18, 1.1]} position={[-0.52, 0.59, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#FBCFE8" roughness={0.35} />
            </RoundedBox>
            <RoundedBox args={[0.82, 1.08, 0.05]} position={[0, 0.56, -0.52]} rotation={[0, -0.35, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#F472B6" roughness={0.35} />
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

      {/* ================================================================= */}
      {/* 🛗 [구역 8: 하단 정중앙 엘리베이터 홀] */}
      {/* ================================================================= */}
      <group position={[0, 0, 5.9]}>
        <RoundedBox args={[3.4, 2.4, 0.35]} position={[0, 1.2, 0.3]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.5, 2.05, 0.08]} position={[0, 1.02, 0.1]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.22, 0.06]} position={[0, 2.18, 0.11]} radius={0.01}>
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
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

      {/* 내벽 구조물 */}
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

      {/* 6층 NPC 렌더링 (한 번에 1명만 조용히 말풍선 표시, 클릭 시 1:1 대화창 오픈) */}
      {NPCS_6F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_6F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar6F
            key={npc.id}
            position={[npc.x, npc.y || 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            gender={npc.gender}
            hairStyle={npc.hairStyle}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.5}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectNpcForChat) onSelectNpcForChat(npc);
            }}
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
// 🚶‍♂️ 플레이어 아바타 컨트롤러
// =====================================================================
function PlayerController6F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
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
    if (seatedInfo) {
      playerIdxRef.current = [seatedInfo.x, 0, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.rotY !== seatedInfo.rotY) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: seatedInfo.rotY ?? Math.PI,
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
      gender="male"
      hairStyle="parted"
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
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_6F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  // 1:1 캐릭터 대화 모달 상태
  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_6F.length);
    }, 4200);
    return () => {
      clearInterval(timer);
      togglePraiseBgm6F(false);
    };
  }, []);

  const triggerEmote = (type) => {
    setEmote(type);
    setTimeout(() => setEmote(null), 2200);
  };

  const handleSitOnSeat = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
  }, []);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computePath6F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText(
      (npc.dialogues && npc.dialogues[0]) ||
      '할렐루야! 6층 다음세대 교육관에 오신 것을 환영합니다 😊'
    );
    setSelectedChatNpc(npc);
    triggerEmote('wave');
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
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

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

      {/* 2. 우측 상단: 접이식 미니맵 & 부서 목록 드로어 */}
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
            {seatedInfo && (
              <button
                onClick={handleStandUp}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black shrink-0 cursor-pointer"
              >
                🪑 자리에서 일어나기
              </button>
            )}
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
          onSitOnSeat={handleSitOnSeat}
          onSelectNpcForChat={handleSelectNpcForChat}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController6F
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
          minDistance={3.0}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 교역자·교사·어린이 클릭 시 열리는 1:1 대화 모달 */}
      {selectedChatNpc && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSelectedChatNpc(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: selectedChatNpc.shirt || '#10B981' }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-md"
                >
                  {selectedChatNpc.name.slice(0, 1)}
                </div>
                <div>
                  <span style={{ color: '#34D399' }} className="text-[10.5px] font-bold block">
                    {selectedChatNpc.role || '6층 다음세대 교육관'}
                  </span>
                  <h3 style={{ color: '#FFFFFF' }} className="text-sm sm:text-base font-black">
                    {selectedChatNpc.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedChatNpc(null)}
                style={{ color: '#9CA3AF' }}
                className="text-xs font-bold cursor-pointer px-2 py-1"
              >
                ✕ 닫기
              </button>
            </div>

            <div
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}
              className="p-3.5 rounded-2xl border text-xs sm:text-[13px] leading-relaxed font-medium text-emerald-100"
            >
              "{chatReplyText}"
            </div>

            <div className="space-y-1.5">
              <span style={{ color: '#9CA3AF' }} className="text-[11px] font-bold block">
                💬 인사 및 축복 나누기 (클릭 시 응답)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    q: '👋 "샬롬! 다음세대 아이들을 사랑으로 섬겨주셔서 감사합니다!"',
                    a: `감사합니다 ${playerName}님! 우리 아이들이 믿음의 거장으로 자라나도록 늘 기도로 응원해 주세요 😊`
                  },
                  {
                    q: '🙏 "우리 교회 다음세대와 주일학교 부흥을 위해 함께 기도해요."',
                    a: '아멘! 유아부·유치부·초등부마다 아이들의 찬양과 웃음소리가 차고 넘치길 소망합니다 🙏'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatReplyText(item.a);
                      triggerEmote('wave');
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-600/30 border border-white/10 text-left text-xs font-bold cursor-pointer transition-all"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 부서 상세 안내 & 층간 이동 모달 */}
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
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실' },
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
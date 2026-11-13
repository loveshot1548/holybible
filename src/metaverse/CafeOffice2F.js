// src/metaverse/CafeOffice2F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎵 2층 북카페 어쿠스틱 재즈/찬양 오르골 BGM
// =====================================================================
let bgmInterval2F = null;
const toggleCafeBgm2F = (play) => {
  if (!play) {
    if (bgmInterval2F) clearInterval(bgmInterval2F);
    bgmInterval2F = null;
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const melody = [392.0, 440.0, 493.88, 523.25, 587.33, 523.25, 493.88, 440.0];
  let step = 0;

  if (bgmInterval2F) clearInterval(bgmInterval2F);
  bgmInterval2F = setInterval(() => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(melody[step % melody.length], now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
      step++;
    } catch (_) {}
  }, 420);
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (원목 · 헤링본 마루 · 유리 · 거울 · 타일)
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

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#9C5E26') {
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

function makeCafeFloorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#E6D2B5';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#C8AD88';
    ctx.lineWidth = 2;
    const step = w / 8;
    for (let r = 0; r <= 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * step);
      ctx.lineTo(w, r * step);
      ctx.stroke();
      for (let c = 0; c <= 8; c++) {
        ctx.beginPath();
        ctx.moveTo(c * step + (r % 2) * (step / 2), r * step);
        ctx.lineTo(c * step + (r % 2) * (step / 2), (r + 1) * step);
        ctx.stroke();
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

function makeClearGlassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
    grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.22)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.48)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    for (let x = -80; x < w + 80; x += 150) {
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

function makeBrightMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE');
    grad.addColorStop(0.45, '#FFFFFF');
    grad.addColorStop(0.75, '#BAE6FD');
    grad.addColorStop(1, '#F0F9FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    for (let x = -60; x < w + 60; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 35, 0);
      ctx.lineTo(x - 45, h);
      ctx.lineTo(x - 80, h);
      ctx.closePath();
      ctx.fill();
    }
  }, 512, 256);
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
    ctx.font = '900 23px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 54);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 45px sans-serif';
    ctx.fillText(title, w / 2, 124);
  }, 420, 175);
}

// =====================================================================
// 📍 손그림 도면(image_e1d920.jpg) 100% 반영 — 2층 8대 인터랙션 존 정의
// =====================================================================
const ZONES_2F = [
  {
    id: 'zone_2f_elev',
    code: '01',
    subCode: '엘베',
    name: '2F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (전 층 이동)',
    pos: [-0.2, 0, 4.3],
    isElevator: true,
    badge: '01 2F 엘리베이터',
    title: '🛗 2층 카페·목양·행정센터 엘리베이터 홀',
    desc: '도면 하단 중앙에 위치한 엘리베이터입니다. 1층(로비), 3층(대예배당), 4층(자모실), 5층(소예배·조리실), 6층(교육관)으로 즉시 이동합니다.'
  },
  {
    id: 'zone_2f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 계단실 (1F·3F 직결)',
    prompt: '02 계단으로 이동하기',
    pos: [-2.4, 0, 4.1],
    isElevator: true,
    badge: '02 2F 계단실',
    title: '🪜 좌측 하단 전 층 연결 계단실',
    desc: '도면 좌측 하단에 대각선 복도 코너와 함께 자리한 계단실입니다. 1층 로비나 3층 본당으로 걸어서 이동할 수 있습니다.'
  },
  {
    id: 'zone_2f_office',
    code: '03',
    subCode: '사무실',
    name: '좌측 중단 교역자·행정 사무실',
    prompt: '03 교회 행정 사무실 들어가기',
    pos: [-2.2, 0, 1.0],
    roomTarget: [-4.6, 1.0],
    badge: '03 행정 사무실',
    title: '💻 좌측 중단 좋은나무교회 행정·교역자 사무실',
    desc: '도면 좌측 중단에 위치한 사무실입니다. 듀얼 모니터 업무 데스크, 주보 인쇄 복합기, 서류 캐비닛에서 교역자와 간사님들이 예배와 사역을 준비하고 계십니다.'
  },
  {
    id: 'zone_2f_glass_door',
    code: '04',
    subCode: '유리문',
    name: '중앙 카페 입구 양개 유리문',
    prompt: '04 유리문 통과해 카페 들어가기',
    pos: [-0.2, 0, -0.6],
    roomTarget: [-0.2, -2.2],
    badge: '04 카페 유리문',
    title: '🚪 북카페 라운지 중앙 양개 강화유리문',
    desc: '도면 정중앙에 표시된 카페 출입 유리문입니다. 투명 통유리 가벽과 양개 유리문을 지나면 향긋한 커피 향이 가득한 카페가 펼쳐집니다.'
  },
  {
    id: 'zone_2f_cafe_bar',
    code: '05',
    subCode: '카페바',
    name: '상단 북카페 에스프레소 바 & 디저트 쇼케이스',
    prompt: '05 바리스타 커피·차 주문 및 교제',
    pos: [-2.6, 0, -2.8],
    badge: '05 북카페 카운터',
    title: '☕ 좋은나무 스페셜티 북카페 & 바리스타 카운터',
    desc: '도면 상단 전체를 아우르는 대형 카페입니다. 2그룹 에스프레소 머신과 원두 그라인더, 케이크 쇼케이스가 갖춰져 있으며 성도님들이 교제하는 사랑방입니다.'
  },
  {
    id: 'zone_2f_cafe_table',
    code: '06',
    subCode: '카페좌석',
    name: '상단 카페 원목 테이블 & 창가 바 좌석',
    prompt: '06 카페 의자에 앉아 커피 마시며 교제하기',
    pos: [1.6, 0, -2.8],
    seatTarget: { x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 원목 라운지석' },
    isSeatZone: true,
    badge: '06 북카페 테이블석',
    title: '🪑 햇살 가득한 2층 카페 라운지 테이블 & 북스탠드',
    desc: '원하시는 카페 의자를 클릭하시면 캐릭터가 단정하게 앉아 성도님들과 따뜻한 차와 말씀을 나눕니다.'
  },
  {
    id: 'zone_2f_pastor_room',
    code: '07',
    subCode: '목양실',
    name: '우측 상단 담임목사님 목양실 (서재·상담)',
    prompt: '07 담임목사님 목양실 방문 & 기도받기',
    pos: [2.0, 0, -0.2],
    roomTarget: [4.4, -0.2],
    badge: '07 담임목사 목양실',
    title: '✝️ 우측 상단 담임목사님 목양실 (말씀 연구 & 성도 상담)',
    desc: '도면 우측 상단(카페 바로 아래)에 위치한 목양실입니다. 대형 신학 서재 책장과 집무 데스크, 성도님들과 1:1로 기도하며 상담하는 소파 세트가 마련되어 있습니다.'
  },
  {
    id: 'zone_2f_restrooms',
    code: '08',
    subCode: '남·여화장실',
    name: '우측 중단 화장실(남) & 우측 하단 화장실(여)',
    prompt: '08 2층 남·여 화장실 안내 보기',
    pos: [2.0, 0, 2.6],
    roomTarget: [4.2, 2.0],
    badge: '08 남·여 화장실',
    title: '🚻 우측 중단 화장실(남) & 우측 하단 화장실(여)',
    desc: '도면 우측 중단에는 소변기와 세면대가 갖춰진 남성 화장실이, 우측 하단에는 파우더룸 거울과 부스가 갖춰진 여성 화장실이 각각 배치되어 있습니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체(대각선 계단벽 포함) · 가구 실시간 물리 충돌(AABB) & 문 통과 네비게이션
// =====================================================================
const SOLID_WALL_BOXES_2F = [
  // 1) 상단 카페와 하단 구역을 나누는 가로 유리벽 (Z = -1.2, 중앙 유리문 X: -1.35 ~ +0.95 구간 개방!)
  { minX: -6.8, maxX: -1.40, minZ: -1.38, maxZ: -1.02 },
  { minX: 1.00, maxX: 6.8, minZ: -1.38, maxZ: -1.02 },

  // 2) 좌측 사무실 동쪽 세로벽 (X = -3.0, 사무실 문 Z: 0.4 ~ 1.5 구간 개방!)
  { minX: -3.22, maxX: -2.78, minZ: -1.2, maxZ: 0.35 },
  { minX: -3.22, maxX: -2.78, minZ: 1.55, maxZ: 2.65 },

  // 3) 좌측 사무실과 계단실 사이 가로벽 (Z = 2.6) & 계단실 대각선 코너벽
  { minX: -6.8, maxX: -3.0, minZ: 2.42, maxZ: 2.78 },
  { minX: -2.8, maxX: -1.8, minZ: 4.5, maxZ: 6.2 },

  // 4) 우측 3단 방(목양실 / 남자화장실 / 여자화장실) 서쪽 세로벽 (X = +2.8)
  // 개방 문: 목양실 문(Z: -0.6 ~ +0.3), 남화장실 문(Z: 1.5 ~ 2.4), 여화장실 문(Z: 3.8 ~ 4.7)
  { minX: 2.58, maxX: 3.02, minZ: -1.2, maxZ: -0.65 },
  { minX: 2.58, maxX: 3.02, minZ: 0.35, maxZ: 1.45 },
  { minX: 2.58, maxX: 3.02, minZ: 2.45, maxZ: 3.75 },
  { minX: 2.58, maxX: 3.02, minZ: 4.75, maxZ: 6.2 },

  // 5) 우측 방들 사이의 가로 구분벽 (목양실/남화장실 Z = 0.85, 남화장실/여화장실 Z = 3.1)
  { minX: 2.8, maxX: 6.8, minZ: 0.68, maxZ: 1.02 },
  { minX: 2.8, maxX: 6.8, minZ: 2.92, maxZ: 3.28 },

  // 6) 카페 에스프레소 바 카운터 충돌 박스 & 하단 엘리베이터 타워
  { minX: -6.2, maxX: -2.2, minZ: -4.9, maxZ: -3.4 },
  { minX: -1.8, maxX: 1.4, minZ: 5.0, maxZ: 6.5 }
];

function resolveCollision2F(nx, nz, radius = 0.26) {
  let x = Math.max(-6.1, Math.min(6.1, nx));
  let z = Math.max(-5.1, Math.min(4.8, nz));

  for (const box of SOLID_WALL_BOXES_2F) {
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

function getRoomDoorInfo2F(x, z) {
  if (z < -1.2) {
    return { room: 'cafe', doorIn: [-0.2, -1.85], doorOut: [-0.2, -0.55] };
  }
  if (x < -3.0 && z < 2.6) {
    return { room: 'office', doorIn: [-3.65, 0.95], doorOut: [-2.2, 0.95] };
  }
  if (x > 2.8) {
    if (z < 0.85) return { room: 'pastor', doorIn: [3.45, -0.15], doorOut: [2.0, -0.15] };
    if (z < 3.1) return { room: 'men_wc', doorIn: [3.45, 1.95], doorOut: [2.0, 1.95] };
    return { room: 'women_wc', doorIn: [3.45, 4.25], doorOut: [2.0, 4.25] };
  }
  return { room: 'hallway', doorIn: null, doorOut: null };
}

function computeSmartPath2F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision2F(rawEx, rawEz);
  const startInfo = getRoomDoorInfo2F(sx, sz);
  const endInfo = getRoomDoorInfo2F(ex, ez);

  if (startInfo.room === endInfo.room) {
    return [[ex, ez]];
  }

  const waypoints = [];
  if (startInfo.room !== 'hallway') {
    waypoints.push(startInfo.doorIn);
    waypoints.push(startInfo.doorOut);
  }
  if (endInfo.room !== 'hallway') {
    waypoints.push([-0.2, endInfo.doorOut[1]]);
    waypoints.push(endInfo.doorOut);
    waypoints.push(endInfo.doorIn);
  }
  waypoints.push([ex, ez]);
  return waypoints;
}

// =====================================================================
// 👥 2층 카페 바리스타 · 담임목사님(목양실) · 행정간사님(사무실) · 성도 NPC
// =====================================================================
const NPCS_2F = [
  {
    id: 'barista_2f',
    name: '김집사 (바리스타)',
    role: '2층 좋은나무 카페 매니저',
    x: -4.1,
    y: 0,
    z: -4.55,
    rotY: 0,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    autoWave: true,
    shirt: '#78350F',
    pants: '#FDE68A',
    hair: '#451A03',
    dialogues: [
      '할렐루야! 2층 좋은나무 북카페에 오신 것을 환영합니다 ☕',
      '갓 볶은 스페셜티 아메리카노와 달콤한 조각케이크가 준비되어 있어요 🥰',
      '저를 클릭하시면 따뜻한 음료와 다과를 주문하실 수 있습니다!'
    ]
  },
  {
    id: 'pastor_office_2f',
    name: '담임목사님 (목양실)',
    role: '담임목사 서재 · 상담실',
    x: 6.05, // 👈 목양실 책상 뒤 중역 가죽 회전의자 정중앙에 정확히 착석!
    y: 0,
    z: -0.52,
    rotY: -Math.PI / 2,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '성도님 반갑습니다! 언제든 목양실에 들러 함께 기도하고 말씀의 교제를 나눕시다 ✝️',
      '주님께서 성도님의 가정과 일터 위에 평강의 복을 내려주시길 늘 기도합니다 🙏'
    ]
  },
  {
    id: 'admin_staff_2f',
    name: '이간사 (행정사무실)',
    role: '교회 행정·재정·주보 담당',
    x: -4.55, // 👈 1번 사무실 책상 의자 정중앙 착석
    y: 0,
    z: 0.42,
    rotY: Math.PI,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#0284C7',
    pants: '#E0F2FE',
    hair: '#27272A',
    dialogues: [
      '이번 주일 예배 주보와 목장 나눔지를 복합기로 인쇄하고 있습니다 💻',
      '교회 등록이나 행정 안내가 필요하시면 언제든 사무실로 말씀해 주세요 😊'
    ]
  },
  {
    id: 'office_pastor_2f',
    name: '박전도사 (교역자실)',
    role: '교육·청년부 담당교역자',
    x: -4.55, // 👈 2번 사무실 책상 의자 정중앙 착석
    y: 0,
    z: 1.82,
    rotY: Math.PI,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#4F46E5',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '다음세대와 청년부 설교 자료 및 심방 일정을 정리하고 있습니다 📋',
      '행정 사무실이 쾌적해서 사역 준비가 정말 잘 됩니다!'
    ]
  },
  {
    id: 'member_cafe_1',
    name: '박권사 (카페교제)',
    role: '여전도회 성도',
    x: 0.85,
    y: 0,
    z: -3.2,
    rotY: Math.PI / 2,
    seated: true,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: [
      '유리문을 열고 들어오니 카페 분위기가 너무 따뜻하고 커피 향이 일품이네요 ☕',
      '예배 전후로 성도님들과 여기서 말씀 나눔 하니 천국이 따로 없습니다 🥰'
    ]
  },
  {
    id: 'member_cafe_2',
    name: '정안수집사 (카페교제)',
    role: '남선교회 성도',
    x: 2.35,
    y: 0,
    z: -3.2,
    rotY: -Math.PI / 2,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '북카페 책장과 북스탠드에 좋은 신앙 서적들이 많아서 묵상하기 참 좋습니다 📚',
      '집사님! 옆자리에 앉으셔서 시원한 아이스 아메리카노 한잔 하세요~'
    ]
  },
  {
    id: 'walker_hall_2f',
    name: '최청년 (카페방문)',
    role: '청년부 성도',
    x: -0.2,
    y: 0,
    z: 1.5,
    patrolZ: [-0.4, 3.2],
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#18181B',
    dialogues: [
      '엘리베이터에서 내리자마자 정면 유리문 너머로 멋진 카페가 보이네요! ✨',
      '오른쪽에는 목양실과 남·여 화장실, 왼쪽에는 사무실과 계단이 있어 동선이 참 편해요.'
    ]
  }
];

// =====================================================================
// 👁️ 카메라 회전 시 외벽 자동 투명화 컴포넌트
// =====================================================================
function SmartCutawayWall2F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 4.2) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -4.2) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 4.2) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.2) shouldFade = true;

    const targetOpacity = shouldFade ? minOpacity : 1.0;

    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material && !child.userData?.keepOpaque) {
        child.material.transparent = true;
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.16);
        child.material.depthWrite = child.material.opacity > 0.45;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}

function HologramMarker2F({ zone, isSelected, onSelect }) {
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
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 24, h / 2 + 6, 114, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 81, h / 2 + 28);
      }
    }, 355, 220);
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
          <planeGeometry args={[0.76, 0.44]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 3층 본당과 통일된 둥근 유선형(Sphere/Capsule) 아바타 & 남녀 헤어스타일 & 멀티라인 말풍선
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

function CharacterHairStyle2F({ style = 'short', hairColor = '#27272A' }) {
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

function SmoothChibiAvatar2F({
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

          <CharacterHairStyle2F
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
// 🪑 초디테일 카페 의자 · 양변기 · 남성용 소변기 · 몬스테라 화분 컴포넌트
// =====================================================================
function DetailedCafeChair({ position, rotationY = 0, seatColor = '#B45309', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <RoundedBox args={[0.40, 0.065, 0.40]} position={[0, 0.34, 0]} radius={0.025} castShadow receiveShadow>
        <meshStandardMaterial color={seatColor} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.40, 0.34, 0.06]} position={[0, 0.52, 0.17]} rotation={[0.12, 0, 0]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.4} />
      </RoundedBox>
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]} castShadow>
          <cylinderGeometry args={[0.018, 0.014, 0.34, 8]} />
          <meshStandardMaterial color="#27272A" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function DetailedMiniatureToilet2F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.15, 0.05]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.30, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.28, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.11, 20]} />
        <meshBasicMaterial color="#BAE6FD" />
      </mesh>
      <mesh position={[0, 0.32, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.135, 0.035, 14, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </mesh>
      <RoundedBox args={[0.28, 0.30, 0.03]} position={[0, 0.48, -0.04]} rotation={[-0.15, 0, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.36, 0.16]} position={[0, 0.48, -0.15]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0.68, -0.15]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.95} />
      </mesh>
    </group>
  );
}

function DetailedUrinal2F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.26, 0.56, 0.18]} position={[0, 0.52, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </RoundedBox>
      <mesh position={[0, 0.84, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.10, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
    </group>
  );
}

function LushMonsteraPlant({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.15, 0.44, 20]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>
      {[
        [0, 0.56, 0, 0.24],
        [-0.14, 0.48, 0.10, 0.18],
        [0.14, 0.50, -0.08, 0.19],
        [0.08, 0.46, 0.14, 0.16]
      ].map(([lx, ly, lz, lr], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <sphereGeometry args={[lr, 14, 14]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#15803D' : '#16A34A'} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================================
// 🏛️ 2층 손그림 도면(image_e1d920.jpg) 1:1 초디테일 디오라마
// =====================================================================
function TwoFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnSeat,
  onSelectNpcForChat,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);
  const walnutTex = useMemo(() => makeWoodGrainTexture('#6B3E1B', '#452208'), []);
  const cafeFloorTex = useMemo(() => makeCafeFloorTexture(), []);
  const tileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);

  const cafeMenuTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOOD TREE CAFE MENU', w / 2, 56);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 23px sans-serif';
      ctx.fillText('☕ 아메리카노 (HOT/ICE)  · · ·  사랑나눔', w / 2, 110);
      ctx.fillText('🥛 바닐라 빈 카페라떼    · · ·  은혜가득', w / 2, 150);
      ctx.fillText('🍑 복숭아 아이스티 / 허브티 · ·  평안충만', w / 2, 190);
    }, 512, 240);
  }, []);

  const signs = useMemo(() => ({
    cafe: makeRoomSignTexture('2F 좋은나무 카페 ☕', '스페셜티 커피 · 성도 교제 라운지', '#D97706'),
    glassDoor: makeRoomSignTexture('카페 유리문 🚪', '중앙 양개 강화유리 출입문', '#0284C7'),
    office: makeRoomSignTexture('행정 사무실 💻', '교역자 · 행정 · 주보 제작실', '#2563EB'),
    pastorRoom: makeRoomSignTexture('담임목사 목양실 ✝️', '말씀 연구 · 서재 · 1:1 상담실', '#8B5CF6'),
    menWc: makeRoomSignTexture('화장실 (남) 🚹', '남성 화장실 · 세면대 · 소변기', '#3B82F6'),
    womenWc: makeRoomSignTexture('화장실 (여) 🚺', '여성 화장실 · 파우더룸', '#EC4899'),
    stairs: makeRoomSignTexture('2F 계단실 🪜', '1F 로비 · 3F 본당 도보 이동', '#64748B'),
    elevator: makeRoomSignTexture('2F 엘리베이터 🛗', '전 층(1F~6F) 스마트 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 2층 전체 베이스 바닥 & 중앙 홀 타일 바닥 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 1.8]} receiveShadow>
        <planeGeometry args={[5.8, 6.2]} />
        <meshStandardMaterial map={tileTex} roughness={0.35} />
      </mesh>

     {/* ================================================================= */}
      {/* ☕ [구역 1: 도면 상단 전체 `카페` & 중앙 `유리문`] (Z: -5.6 ~ -1.2) */}
      {/* ================================================================= */}
      <group>
        {/* 북카페 따뜻한 원목 마루 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -3.4]} receiveShadow>
          <planeGeometry args={[13.2, 4.4]} />
          <meshStandardMaterial map={cafeFloorTex} roughness={0.38} />
        </mesh>

        {/* 도면 정중앙 `유리문` & 좌·우 크리스탈 통유리 파티션 가벽 (Z = -1.2) */}
        <group position={[0, 0, -1.2]}>
          {[-3.95, 3.85].map((gx, gi) => (
            <group key={`c_wall_${gi}`} position={[gx, 0, 0]}>
              <RoundedBox args={[5.2, 0.42, 0.16]} position={[0, 0.21, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={oakTex} />
              </RoundedBox>
              <RoundedBox args={[5.2, 0.12, 0.18]} position={[0, 2.34, 0]} radius={0.01}>
                <meshStandardMaterial color="#1E293B" />
              </RoundedBox>
              <mesh position={[0, 1.35, 0]}>
                <planeGeometry args={[5.0, 1.86]} />
                <meshBasicMaterial map={glassTex} transparent opacity={0.76} />
              </mesh>
            </group>
          ))}

          {/* 정중앙 양개 강화유리문 (`유리문`, X: -1.35 ~ +0.95) */}
          <group position={[-0.2, 0, 0]}>
            <RoundedBox args={[2.45, 0.14, 0.22]} position={[0, 2.34, 0]} radius={0.01}>
              <meshStandardMaterial color="#1E293B" />
            </RoundedBox>
            {[-1.15, 1.15].map((px, pi) => (
              <RoundedBox key={pi} args={[0.14, 2.4, 0.20]} position={[px, 1.2, 0]} radius={0.01}>
                <meshStandardMaterial color="#1E293B" />
              </RoundedBox>
            ))}
            {[-0.85, 0.85].map((dx, di) => (
              <group
                key={`g_door_${di}`}
                position={[dx, 1.12, -0.35]}
                rotation={[0, di === 0 ? 0.52 : -0.52, 0]}
              >
                <RoundedBox args={[0.92, 2.15, 0.05]} radius={0.01}>
                  <meshBasicMaterial map={glassTex} transparent opacity={0.85} />
                </RoundedBox>
                <RoundedBox args={[0.04, 0.65, 0.09]} position={[di === 0 ? 0.34 : -0.34, 0, 0]} radius={0.01}>
                  <meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} />
                </RoundedBox>
              </group>
            ))}
          </group>

          {showRoomSigns && (
            <Billboard position={[-0.2, 2.15, 0.2]}>
              <mesh>
                <planeGeometry args={[1.15, 0.48]} />
                <meshBasicMaterial map={signs.glassDoor} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 1) 좌측 상단: 스페셜티 에스프레소 바 카운터 + 뒷벽 백바 선반 + 디저트 쇼케이스 + 메뉴판 */}
        <group position={[-4.1, 0, -3.85]}>
          <RoundedBox args={[3.6, 0.88, 0.86]} position={[0, 0.44, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.35} />
          </RoundedBox>
          {/* 카운터 전면 템바보드(우드 슬랫) 세로 디테일 */}
          {Array.from({ length: 16 }).map((_, si) => (
            <RoundedBox
              key={`bar_slat_${si}`}
              args={[0.06, 0.82, 0.04]}
              position={[-1.65 + si * 0.22, 0.44, 0.43]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial map={walnutTex} />
            </RoundedBox>
          ))}
          <RoundedBox args={[3.72, 0.07, 0.94]} position={[0, 0.91, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>

          {/* 2그룹 전문가용 에스프레소 머신 */}
          <group position={[-0.95, 0.95, -0.05]}>
            <RoundedBox args={[0.76, 0.46, 0.48]} position={[0, 0.23, 0]} radius={0.03} castShadow>
              <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.15} />
            </RoundedBox>
            <RoundedBox args={[0.68, 0.12, 0.14]} position={[0, 0.34, 0.20]} radius={0.01}>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            {[-0.18, 0.18].map((fx, fi) => (
              <mesh key={fi} position={[fx, 0.22, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.022, 0.022, 0.18, 10]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
            ))}
          </group>

          {/* 원두 그라인더 2대 & 아이스 블렌더 & POS 터치스크린 */}
          {[-0.32, -0.04].map((gx, gi) => (
            <group key={gi} position={[gx, 0.95, -0.1]}>
              <RoundedBox args={[0.18, 0.28, 0.22]} position={[0, 0.14, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#18181B" />
              </RoundedBox>
              <mesh position={[0, 0.36, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.06, 0.18, 16]} />
                <meshStandardMaterial color="#78350F" transparent opacity={0.75} />
              </mesh>
            </group>
          ))}
          {/* 포스기(POS) 터치 모니터 */}
          <RoundedBox args={[0.28, 0.22, 0.04]} position={[0.28, 1.08, 0.18]} rotation={[-0.25, 0, 0]} radius={0.01} castShadow>
            <meshStandardMaterial color="#0F172A" />
          </RoundedBox>

          {/* 우측 유리 디저트 쇼케이스 (2단 케이크 & 베이커리 진열) */}
          <group position={[1.08, 0.95, 0]}>
            <RoundedBox args={[1.15, 0.56, 0.68]} position={[0, 0.28, 0]} radius={0.02}>
              <meshBasicMaterial map={glassTex} transparent opacity={0.65} />
            </RoundedBox>
            <RoundedBox args={[1.08, 0.03, 0.58]} position={[0, 0.28, 0]} radius={0.01}>
              <meshStandardMaterial color="#FFFFFF" />
            </RoundedBox>
            {[-0.32, 0.0, 0.32].map((cx, ci) => (
              <group key={ci}>
                <mesh position={[cx, 0.35, 0]} castShadow>
                  <cylinderGeometry args={[0.12, 0.12, 0.10, 16]} />
                  <meshStandardMaterial color={['#F43F5E', '#FDE047', '#9A3412'][ci]} />
                </mesh>
                <mesh position={[cx, 0.08, 0]} castShadow>
                  <cylinderGeometry args={[0.11, 0.11, 0.09, 16]} />
                  <meshStandardMaterial color={['#A7F3D0', '#FBCFE8', '#D97706'][ci]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* 뒷벽 백바(Back-bar) 에스프레소 머그컵 선반 & 원두 캐니스터 & 메뉴 보드 */}
          <RoundedBox args={[3.4, 0.82, 0.42]} position={[0, 0.41, -1.45]} radius={0.02} castShadow>
            <meshStandardMaterial map={walnutTex} />
          </RoundedBox>
          {[-1.1, -0.7, -0.3, 0.3, 0.7, 1.1].map((mx, mi) => (
            <mesh key={mi} position={[mx, 0.90, -1.45]} castShadow>
              <cylinderGeometry args={[0.06, 0.05, 0.14, 12]} />
              <meshStandardMaterial color={mi % 2 === 0 ? '#FFFFFF' : '#F59E0B'} />
            </mesh>
          ))}

          <group position={[0, 1.85, -1.62]}>
            <RoundedBox args={[2.4, 1.05, 0.06]} radius={0.02} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[2.28, 0.94]} />
              <meshBasicMaterial map={cafeMenuTex} />
            </mesh>
          </group>

          {[-1.1, 0, 1.1].map((lx, li) => (
            <group key={li} position={[lx, 2.15, 0]}>
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <coneGeometry args={[0.18, 0.22, 20]} />
                <meshStandardMaterial color="#D97706" metalness={0.5} />
              </mesh>
              <mesh position={[0, -0.10, 0]}>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={2.0} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 카운터 맞은편: 셀프 워터·시럽·냅킨 바 & A자형 신앙도서 북스탠드 */}
        <group position={[-4.8, 0, -1.75]}>
          <RoundedBox args={[1.35, 0.78, 0.46]} position={[0, 0.39, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <RoundedBox args={[1.40, 0.05, 0.52]} position={[0, 0.80, 0]} radius={0.015}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {/* 유리 워터 저그 & 종이컵 디스펜서 & 시럽 보틀 */}
          <mesh position={[-0.38, 0.96, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.09, 0.26, 16]} />
            <meshStandardMaterial color="#BAE6FD" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0.0, 0.94, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.22, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <RoundedBox args={[0.18, 0.12, 0.14]} position={[0.38, 0.88, 0]} radius={0.01}>
            <meshStandardMaterial color="#78350F" />
          </RoundedBox>
        </group>

        {/* 3) 북쪽 벽면: 우드 창가 바 테이블 & 골드 링 하이체어(Bar Stool) 4석 */}
        <group position={[2.8, 0, -5.15]}>
          <RoundedBox args={[4.4, 0.07, 0.52]} position={[0, 0.88, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.3} />
          </RoundedBox>
          {[-1.9, 0, 1.9].map((lx, li) => (
            <RoundedBox key={li} args={[0.06, 0.86, 0.46]} position={[lx, 0.43, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
          ))}
          {/* 바 테이블 위 미니 스탠드 조명 2개 & 화병 */}
          {[-1.2, 1.2].map((bx, bi) => (
            <group key={bi} position={[bx, 0.92, -0.08]}>
              <mesh position={[0, 0.10, 0]}>
                <cylinderGeometry args={[0.015, 0.04, 0.20, 12]} />
                <meshStandardMaterial color="#D97706" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <coneGeometry args={[0.10, 0.12, 16]} />
                <meshStandardMaterial color="#FEF3C7" emissive="#FDE047" emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}
          {/* 하이체어 바 스툴 4개 */}
          {[-1.5, -0.5, 0.5, 1.5].map((sx, si) => (
            <group
              key={si}
              position={[sx, 0, 0.42]}
              onClick={(e) => {
                e.stopPropagation();
                onSitOnSeat({ x: 2.8 + sx, z: -5.15 + 0.42, rotY: Math.PI, rowLabel: '2F 북카페 창가 바 좌석' });
              }}
            >
              <mesh position={[0, 0.56, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.15, 0.07, 20]} />
                <meshStandardMaterial color={si % 2 === 0 ? '#0D9488' : '#B45309'} />
              </mesh>
              <mesh position={[0, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.022, 0.022, 0.54, 10]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.14, 0.012, 8, 20]} />
                <meshStandardMaterial color="#FACC15" metalness={0.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 4) 카페 중앙~우측: 원형 러그가 깔린 성도 교제용 원목 라운드 테이블 3세트 */}
        {[
          [1.6, -3.2],
          [4.3, -3.2],
          [2.95, -2.1]
        ].map(([tx, tz], tIdx) => (
          <group key={`cafe_tbl_${tIdx}`} position={[tx, 0, tz]}>
            {/* 바닥 따뜻한 원형 카페 러그 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
              <circleGeometry args={[1.18, 36]} />
              <meshStandardMaterial color={tIdx === 1 ? '#FEF3C7' : '#F5F5F4'} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.68, 0.68, 0.05, 36]} />
              <meshStandardMaterial map={oakTex} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.31, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.26, 0.62, 16]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} />
            </mesh>
            <mesh position={[-0.22, 0.68, 0.12]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 14]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0.22, 0.68, -0.12]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 14]} />
              <meshStandardMaterial color="#F59E0B" />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <cylinderGeometry args={[0.11, 0.09, 0.02, 16]} />
              <meshStandardMaterial color="#FEF08A" />
            </mesh>

            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, ci) => {
              const cx = Math.cos(ang) * 0.88;
              const cz = Math.sin(ang) * 0.88;
              const chairRot = Math.atan2(cx, cz);
              return (
                <DetailedCafeChair
                  key={ci}
                  position={[cx, 0, cz]}
                  rotationY={chairRot}
                  seatColor={ci % 2 === 0 ? '#0D9488' : '#D97706'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSitOnSeat({ x: tx + cx, z: tz + cz, rotY: chairRot + Math.PI, rowLabel: `2F 북카페 ${tIdx + 1}번 테이블석` });
                  }}
                />
              );
            })}
          </group>
        ))}

        {/* 5) 동쪽 벽면: 대형 북카페 원목 도서 책장 & 몬스테라 화분 */}
        <group position={[6.25, 0, -3.4]}>
          <RoundedBox args={[0.42, 1.85, 2.8]} position={[0, 0.92, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {[-0.95, -0.45, 0.05, 0.55, 1.0].map((bz, bi) => (
            <RoundedBox key={bi} args={[0.28, 0.32, 0.28]} position={[-0.06, 1.25, bz]} radius={0.01}>
              <meshStandardMaterial color={['#38BDF8', '#F43F5E', '#FACC15', '#10B981', '#A855F7'][bi]} />
            </RoundedBox>
          ))}
        </group>
        <LushMonsteraPlant position={[-1.85, 0, -1.65]} />
        <LushMonsteraPlant position={[1.45, 0, -1.65]} />

        {showRoomSigns && (
          <Billboard position={[-2.6, 2.25, -3.5]}>
            <mesh>
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs.cafe} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 💻 [구역 2: 좌측 중단 초디테일 `사무실` (교역자·행정실)] (X: -6.6 ~ -3.0, Z: -1.2 ~ +2.6) */}
      {/* ================================================================= */}
      <group position={[-4.85, 0, 0.7]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.6, 3.7]} />
          <meshStandardMaterial color="#E0F2FE" roughness={0.48} />
        </mesh>

        {/* 1) 서쪽 벽면 전체: 4단 대형 행정 바인더 책장 & 연간 사역 일정 화이트보드 & 냉온수기 */}
        <group position={[-1.48, 0, -0.35]}>
          <RoundedBox args={[0.42, 1.75, 2.1]} position={[0, 0.88, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.35} />
          </RoundedBox>
          {/* 층별 알록달록 행정 바인더 파일 & 결재 서류함 */}
          {[-0.75, -0.35, 0.05, 0.45, 0.8].map((fz, fi) => (
            <group key={fi}>
              <RoundedBox args={[0.28, 0.28, 0.24]} position={[0.06, 1.35, fz]} radius={0.01} castShadow>
                <meshStandardMaterial color={['#2563EB', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][fi]} />
              </RoundedBox>
              <RoundedBox args={[0.28, 0.28, 0.24]} position={[0.06, 0.92, fz]} radius={0.01} castShadow>
                <meshStandardMaterial color={['#F8FAFC', '#38BDF8', '#FEF08A', '#A7F3D0', '#E2E8F0'][fi]} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* 북쪽 내벽: 대형 연간 사역 일정 화이트보드 & 컬러 포스트잇 */}
        <group position={[0.2, 1.35, -1.80]}>
          <RoundedBox args={[2.1, 0.95, 0.05]} radius={0.015} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[2.16, 1.01, 0.03]} position={[0, 0, -0.01]} radius={0.015}>
            <meshStandardMaterial color="#475569" />
          </RoundedBox>
          {[-0.65, -0.25, 0.15, 0.55].map((px, pi) => (
            <RoundedBox key={pi} args={[0.26, 0.22, 0.02]} position={[px, 0.12, 0.03]} radius={0.005}>
              <meshBasicMaterial color={['#FEF08A', '#BAE6FD', '#FBCFE8', '#A7F3D0'][pi]} />
            </RoundedBox>
          ))}
        </group>

        {/* 2) 교역자/행정간사 워크스테이션 데스크 2세트 + 서랍장 + 듀얼모니터 + 키보드 + 서류더미 + 유선전화기 */}
        {[-0.80, 0.60].map((dz, di) => (
          <group key={`off_desk_${di}`} position={[0.15, 0, dz]}>
            <RoundedBox args={[1.68, 0.06, 0.78]} position={[0, 0.64, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
            </RoundedBox>
            {/* 책상 하부 3단 이동식 서랍장(페데스탈) & 측판 다리 */}
            <RoundedBox args={[0.42, 0.62, 0.72]} position={[-0.58, 0.31, 0]} radius={0.015} castShadow>
              <meshStandardMaterial color="#E2E8F0" />
            </RoundedBox>
            <RoundedBox args={[0.06, 0.62, 0.72]} position={[0.78, 0.31, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#CBD5E1" />
            </RoundedBox>
            {/* 데스크 프라이버시 파티션 스크린 */}
            <RoundedBox args={[1.64, 0.36, 0.04]} position={[0, 0.84, -0.36]} radius={0.01} castShadow>
              <meshStandardMaterial color={di === 0 ? '#0284C7' : '#4F46E5'} />
            </RoundedBox>
            {/* 듀얼 모니터 2대 & 키보드 & 결재 서류철 & 머그컵 */}
            {[-0.32, 0.32].map((mx, mi) => (
              <group key={mi} position={[mx, 0.88, -0.18]}>
                <RoundedBox args={[0.52, 0.32, 0.03]} radius={0.01} castShadow>
                  <meshStandardMaterial color="#090A0F" />
                </RoundedBox>
                <mesh position={[0, 0, 0.02]}>
                  <planeGeometry args={[0.48, 0.28]} />
                  <meshBasicMaterial color={mi === 0 ? '#1E3A8A' : '#0F172A'} />
                </mesh>
              </group>
            ))}
            <RoundedBox args={[0.32, 0.02, 0.12]} position={[0.15, 0.68, 0.14]} radius={0.005}>
              <meshStandardMaterial color="#334155" />
            </RoundedBox>
            <RoundedBox args={[0.22, 0.05, 0.28]} position={[-0.58, 0.69, 0.12]} radius={0.005}>
              <meshStandardMaterial color="#FEF08A" />
            </RoundedBox>

            <DetailedCafeChair
              position={[0.15, 0, 0.52]}
              rotationY={0}
              seatColor="#1E293B"
              onClick={(e) => {
                e.stopPropagation();
                onSitOnSeat({ x: -4.85 + 0.30, z: 0.7 + dz + 0.52, rotY: Math.PI, rowLabel: '2F 행정사무실 업무석' });
              }}
            />
          </group>
        ))}

        {/* 3) 남서쪽 코너: 대형 복합기/프린터기 + 생수통 냉온수기 + 화분 */}
        <group position={[-1.25, 0, 1.35]}>
          <RoundedBox args={[0.62, 0.82, 0.58]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F1F5F9" />
          </RoundedBox>
          <RoundedBox args={[0.58, 0.14, 0.54]} position={[0, 0.88, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#334155" />
          </RoundedBox>
          <RoundedBox args={[0.24, 0.02, 0.18]} position={[0.15, 0.76, 0]} radius={0.005}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {/* 옆쪽 냉온수기 & 파란 생수통 */}
          <RoundedBox args={[0.34, 0.88, 0.34]} position={[0.65, 0.44, 0.1]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <mesh position={[0.65, 1.06, 0.1]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.34, 16]} />
            <meshStandardMaterial color="#38BDF8" transparent opacity={0.75} />
          </mesh>
        </group>

        <RoundedBox args={[0.08, 1.78, 0.82]} position={[1.86, 0.89, 0.35]} rotation={[0, -0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#2563EB" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 1.85, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.50]} />
              <meshBasicMaterial map={signs.office} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* ✝️ [구역 3: 우측 상단 초고도화 `목양실` — 의자 방향 180도 교정 & 사진 속 클래식 서재 완벽 구현!] */}
      {/* ================================================================= */}
      <group position={[4.75, 0, -0.18]}>
        {/* 목양실 원목 마루 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.0]} />
          <meshStandardMaterial map={cafeFloorTex} roughness={0.35} />
        </mesh>

        {/* 바닥 클래식 버건디·골드 서재 페르시안 카펫 러그 */}
        <group position={[0.15, 0.012, 0.05]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2.85, 1.55]} />
            <meshStandardMaterial color="#7F1D1D" roughness={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <planeGeometry args={[2.65, 1.35]} />
            <meshStandardMaterial color="#991B1B" roughness={0.85} />
          </mesh>
        </group>

        {/* 📚 1) 사진(image_e07cbb.jpg) 고증: 북쪽 벽면 5열 x 4단 대형 클래식 월넛 서재 책장 & 수십 권의 양장본 전집! */}
        <group position={[-0.15, 0, -0.82]}>
          {/* 책장 본체 & 상단 클래식 크라운 몰딩 헤더 */}
          <RoundedBox args={[3.15, 1.88, 0.34]} position={[0, 0.94, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[3.26, 0.10, 0.42]} position={[0, 1.92, 0.02]} radius={0.015} castShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.28} />
          </RoundedBox>

          {/* 4단 가로 선반 & 5칸 세로 칸막이 */}
          {[0.45, 0.90, 1.35, 1.80].map((sy, si) => (
            <RoundedBox key={`sh_h_${si}`} args={[3.08, 0.04, 0.36]} position={[0, sy, 0.02]} radius={0.005}>
              <meshStandardMaterial map={walnutTex} />
            </RoundedBox>
          ))}
          {[-1.5, -0.75, 0, 0.75, 1.5].map((sx, si) => (
            <RoundedBox key={`sh_v_${si}`} args={[0.04, 1.84, 0.36]} position={[sx, 0.92, 0.02]} radius={0.005}>
              <meshStandardMaterial map={walnutTex} />
            </RoundedBox>
          ))}

          {/* 각 칸마다 빼곡히 꽂힌 신학 주석 전집 48권 & 사진 액자 & 상단 삼각 기념케이스 */}
          {[-1.12, -0.38, 0.38, 1.12].map((cellX, cIdx) => (
            <group key={`book_col_${cIdx}`} position={[cellX, 0, 0.06]}>
              {/* 1단 & 2단: 중후한 블랙/네이비/와인 금장 주석 전집 시리즈 */}
              {Array.from({ length: 8 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b1_${bIdx}`}
                  args={[0.065, 0.34, 0.22]}
                  position={[-0.26 + bIdx * 0.075, 0.24, 0]}
                  radius={0.005}
                  castShadow
                >
                  <meshStandardMaterial
                    color={['#1E293B', '#0F172A', '#7F1D1D', '#1E3A8A', '#064E3B', '#451A03', '#334155', '#78350F'][bIdx]}
                  />
                </RoundedBox>
              ))}
              {Array.from({ length: 7 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b2_${bIdx}`}
                  args={[0.07, 0.32 + (bIdx % 2) * 0.03, 0.22]}
                  position={[-0.24 + bIdx * 0.08, 0.68, 0]}
                  radius={0.005}
                  castShadow
                >
                  <meshStandardMaterial
                    color={['#F8FAFC', '#FEF08A', '#0284C7', '#DC2626', '#D97706', '#FFFFFF', '#4F46E5'][bIdx]}
                  />
                </RoundedBox>
              ))}

              {/* 3단: 중앙 칸에는 기념 사진 액자, 양옆 칸에는 성경 연구 서적 */}
              {cIdx === 1 || cIdx === 2 ? (
                <group position={[0, 1.12, 0.02]}>
                  <RoundedBox args={[0.32, 0.26, 0.03]} rotation={[-0.15, 0, 0]} radius={0.01}>
                    <meshStandardMaterial color="#D97706" metalness={0.6} />
                  </RoundedBox>
                  <mesh position={[0, 0, 0.02]} rotation={[-0.15, 0, 0]}>
                    <planeGeometry args={[0.26, 0.20]} />
                    <meshBasicMaterial color={cIdx === 1 ? '#E0F2FE' : '#FEF3C7'} />
                  </mesh>
                </group>
              ) : (
                Array.from({ length: 7 }).map((_, bIdx) => (
                  <RoundedBox
                    key={`b3_${bIdx}`}
                    args={[0.07, 0.31, 0.22]}
                    position={[-0.24 + bIdx * 0.08, 1.12, 0]}
                    radius={0.005}
                  >
                    <meshStandardMaterial color={['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#FFFFFF', '#3B82F6', '#78350F'][bIdx]} />
                  </RoundedBox>
                ))
              )}

              {/* 4단: 상단 양장본 도서들 */}
              {Array.from({ length: 6 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b4_${bIdx}`}
                  args={[0.075, 0.30, 0.22]}
                  position={[-0.22 + bIdx * 0.085, 1.56, 0]}
                  radius={0.005}
                >
                  <meshStandardMaterial color={['#FDE047', '#FFFFFF', '#991B1B', '#1E40AF', '#065F46', '#D97706'][bIdx]} />
                </RoundedBox>
              ))}
            </group>
          ))}

          {/* 사진 오른쪽 위 책장 꼭대기의 삼각형 기념 케이스 장식 */}
          <mesh position={[0, 2.12, 0.04]} rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.32, 0.28, 3]} />
            <meshStandardMaterial color="#1E3A8A" />
          </mesh>
        </group>

        {/* 🖼️ 동쪽 벽면: 금장 프레임 위임패/감사패 액자 & 금빛 입체 십자가 */}
        <group position={[1.76, 1.42, 0.35]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[0.48, 0.62, 0.03]} radius={0.01} castShadow>
            <meshStandardMaterial color="#D97706" metalness={0.75} roughness={0.25} />
          </RoundedBox>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.38, 0.52]} />
            <meshBasicMaterial color="#FFFBEB" />
          </mesh>
        </group>
        <group position={[1.76, 1.52, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.48, 0.03]} />
            <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.30, 0.06, 0.03]} />
            <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* 🖥️ 2) 담임목사님 월넛 집무 데스크 + 사진 속 지구본(Globe) + 3단 서류함 + 쌓인 책 + 블랙 갓 스탠드 램프! */}
        <group position={[0.62, 0, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[1.42, 0.72, 0.68]} position={[0, 0.36, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.52, 0.07, 0.76]} position={[0, 0.74, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.22} />
          </RoundedBox>
          {/* 데스크 가죽 매트 & 펼쳐진 성경책 & 담임목사 골드 명패 */}
          <RoundedBox args={[0.62, 0.015, 0.42]} position={[0, 0.78, 0.08]} radius={0.005}>
            <meshStandardMaterial color="#18181B" />
          </RoundedBox>
          <RoundedBox args={[0.34, 0.03, 0.24]} position={[0, 0.795, 0.08]} radius={0.005}>
            <meshStandardMaterial color="#FEF9C3" />
          </RoundedBox>
          <RoundedBox args={[0.28, 0.07, 0.06]} position={[0, 0.81, -0.24]} rotation={[0.2, 0, 0]} radius={0.01}>
            <meshStandardMaterial color="#FACC15" metalness={0.8} />
          </RoundedBox>

          {/* 사진 왼쪽의 회전 지구본(Globe) */}
          <group position={[0.48, 0.78, -0.14]}>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 0.03, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[0.3, 0, 0.2]} castShadow>
              <sphereGeometry args={[0.10, 20, 20]} />
              <meshStandardMaterial color="#1E3A8A" roughness={0.3} />
            </mesh>
          </group>

          {/* 사진 속 3단 반투명 서류 정리함 & 옆에 쌓인 책 4권 */}
          <group position={[0.46, 0.78, 0.16]}>
            {[0.03, 0.09, 0.15].map((ty, ti) => (
              <RoundedBox key={ti} args={[0.22, 0.045, 0.26]} position={[0, ty, 0]} radius={0.005} castShadow>
                <meshStandardMaterial color="#E2E8F0" transparent opacity={0.85} />
              </RoundedBox>
            ))}
          </group>
          {[0.02, 0.06, 0.10, 0.14].map((by, bi) => (
            <RoundedBox
              key={`stack_b_${bi}`}
              args={[0.22, 0.035, 0.18]}
              position={[-0.46, 0.78 + by, 0.14]}
              rotation={[0, bi * 0.12, 0]}
              radius={0.005}
              castShadow
            >
              <meshStandardMaterial color={['#FFFFFF', '#991B1B', '#1E3A8A', '#D97706'][bi]} />
            </RoundedBox>
          ))}

          {/* 사진 오른쪽의 클래식 블랙 갓 스탠드 램프 */}
          <group position={[-0.52, 0.78, -0.18]}>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.018, 0.05, 0.32, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.85} />
            </mesh>
            <mesh position={[0, 0.32, 0]} castShadow>
              <coneGeometry args={[0.17, 0.16, 24]} />
              <meshStandardMaterial color="#18181B" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.8} />
            </mesh>
          </group>
        </group>

        {/* 💺 3) [핵심 해결] 180도 정방향(`rotation={[0, Math.PI / 2, 0]}`)으로 회전시킨 사진 속 블랙 퀼팅 가죽 중역 의자! */}
        {/* 이제 등받이가 동쪽 벽면(목사님 등 뒤)으로 가고, 앞쪽 시트와 팔걸이가 서쪽 책상을 정확히 향합니다! */}
        <group position={[1.30, 0, -0.34]} rotation={[0, Math.PI / 2, 0]}>
          {/* 푹신한 블랙 가죽 시트 쿠션 */}
          <RoundedBox args={[0.54, 0.09, 0.52]} position={[0, 0.36, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.28} />
          </RoundedBox>
          {/* 사진 속 볼륨감 있는 6칸 엠보싱 가죽 등받이 (목사님 등 뒤쪽 -Z에 위치!) */}
          <RoundedBox args={[0.52, 0.72, 0.10]} position={[0, 0.72, -0.22]} rotation={[-0.10, 0, 0]} radius={0.04} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.25} />
          </RoundedBox>
          {/* 등받이 6칸 가죽 퀼팅 쿠션 볼륨 디테일 */}
          {[0.54, 0.72, 0.88].map((qy, qi) =>
            [-0.11, 0.11].map((qx, qj) => (
              <RoundedBox
                key={`quilt_${qi}_${qj}`}
                args={[0.19, 0.14, 0.04]}
                position={[qx, qy, -0.17]}
                rotation={[-0.10, 0, 0]}
                radius={0.02}
              >
                <meshStandardMaterial color="#27272A" roughness={0.3} />
              </RoundedBox>
            ))
          )}
          {/* 좌·우 아치형 가죽/원목 팔걸이 */}
          {[-0.27, 0.27].map((ax, ai) => (
            <RoundedBox key={ai} args={[0.055, 0.18, 0.40]} position={[ax, 0.48, 0.02]} radius={0.015} castShadow>
              <meshStandardMaterial color="#27272A" />
            </RoundedBox>
          ))}
          {/* 중심 유압 실린더 기둥 & 5발 스타 베이스 다리 */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.34, 12]} />
            <meshStandardMaterial color="#090A0F" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.04, 16]} />
            <meshStandardMaterial color="#090A0F" metalness={0.8} />
          </mesh>
        </group>

        {/* 🛋️ 4) 남서쪽: 성도 심방·기도 상담용 3인용 소파 + 쿠션 2개 + 원목 티테이블 + 성도용 보조 의자 + 화분 */}
        <group position={[-0.55, 0, 0.48]}>
          {/* 3인용 패브릭 소파 (팔걸이 & 컬러 쿠션 포함) */}
          <RoundedBox args={[1.38, 0.34, 0.56]} position={[0, 0.17, 0.18]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#D6D3D1" roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[1.38, 0.42, 0.14]} position={[0, 0.48, 0.40]} radius={0.04} castShadow>
            <meshStandardMaterial color="#A8A29E" roughness={0.5} />
          </RoundedBox>
          {[-0.64, 0.64].map((sx, si) => (
            <RoundedBox key={si} args={[0.12, 0.28, 0.56]} position={[sx, 0.36, 0.18]} radius={0.03} castShadow>
              <meshStandardMaterial color="#A8A29E" />
            </RoundedBox>
          ))}
          {/* 소파 위 포인트 쿠션 2개 */}
          <RoundedBox args={[0.24, 0.22, 0.08]} position={[-0.38, 0.44, 0.28]} rotation={[0.2, 0.2, 0]} radius={0.02}>
            <meshStandardMaterial color="#D97706" />
          </RoundedBox>
          <RoundedBox args={[0.24, 0.22, 0.08]} position={[0.38, 0.44, 0.28]} rotation={[0.2, -0.2, 0]} radius={0.02}>
            <meshStandardMaterial color="#0D9488" />
          </RoundedBox>

          {/* 원목 다리가 달린 상담용 티테이블 & 다과 트레이·찻잔 세트 */}
          <RoundedBox args={[0.92, 0.05, 0.44]} position={[0, 0.38, -0.38]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {[[-0.38, -0.52], [0.38, -0.52], [-0.38, -0.24], [0.38, -0.24]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.19, lz]} castShadow>
              <cylinderGeometry args={[0.02, 0.015, 0.38, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          ))}
          <RoundedBox args={[0.26, 0.02, 0.18]} position={[0, 0.415, -0.38]} radius={0.01}>
            <meshStandardMaterial color="#FEF08A" />
          </RoundedBox>
          <mesh position={[-0.22, 0.44, -0.38]}>
            <cylinderGeometry args={[0.035, 0.03, 0.06, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.22, 0.44, -0.38]}>
            <cylinderGeometry args={[0.035, 0.03, 0.06, 12]} />
            <meshStandardMaterial color="#F43F5E" />
          </mesh>

          {/* 목사님 책상 앞 1:1 상담 성도용 의자 (클릭 시 착석 가능!) */}
          <DetailedCafeChair
            position={[0.68, 0, -0.82]}
            rotationY={Math.PI / 2}
            seatColor="#0D9488"
            onClick={(e) => {
              e.stopPropagation();
              onSitOnSeat({ x: 4.75 - 0.55 + 0.68, z: -0.18 + 0.48 - 0.82, rotY: Math.PI / 2, rowLabel: '2F 목양실 1:1 기도·상담석' });
            }}
          />
        </group>

        {/* 목양실 코너 몬스테라 화분 & 원목 출입문 */}
        <LushMonsteraPlant position={[-1.52, 0, -0.58]} />
        <RoundedBox args={[0.08, 1.78, 0.82]} position={[-1.92, 0.89, 0.1]} rotation={[0, 0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial map={walnutTex} />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 1.98, 0]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.pastorRoom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚹 [구역 4: 우측 중단 `화장실(남)`] (거울·세면대·소변기 2기·양변기 부스!) */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 1.98]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.2]} />
          <meshStandardMaterial map={tileTex} roughness={0.28} />
        </mesh>

        {/* 북쪽 벽면: 세면대 & 밝은 거울 + 남성용 도자기 소변기 2기 */}
        <group position={[-0.65, 0, -0.78]}>
          <RoundedBox args={[1.1, 0.72, 0.50]} position={[0, 0.36, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <mesh position={[0, 1.15, -0.22]}>
            <planeGeometry args={[1.0, 0.72]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
          <mesh position={[0, 0.75, 0.04]} castShadow>
            <cylinderGeometry args={[0.17, 0.13, 0.08, 24]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.79, 0.04]}>
            <cylinderGeometry args={[0.13, 0.11, 0.02, 20]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
        </group>

        {/* 소변기 2기 & 가림막 */}
        <DetailedUrinal2F position={[0.35, 0, -0.88]} rotationY={0} />
        <RoundedBox args={[0.04, 0.75, 0.32]} position={[0.65, 0.55, -0.82]} radius={0.01}>
          <meshStandardMaterial color="#CBD5E1" />
        </RoundedBox>
        <DetailedUrinal2F position={[0.95, 0, -0.88]} rotationY={0} />

        {/* 동쪽 안쪽: 블루 도어 양변기 부스 */}
        <group position={[1.15, 0, 0.45]}>
          <RoundedBox args={[1.15, 1.18, 0.05]} position={[0, 0.59, -0.48]} radius={0.01} castShadow>
            <meshStandardMaterial color="#93C5FD" />
          </RoundedBox>
          <RoundedBox args={[0.05, 1.08, 0.76]} position={[-0.55, 0.56, 0.05]} rotation={[0, 0.35, 0]} radius={0.01} castShadow>
            <meshStandardMaterial color="#3B82F6" />
          </RoundedBox>
          <DetailedMiniatureToilet2F position={[0.20, 0, 0]} rotationY={-Math.PI / 2} />
        </group>

        {showRoomSigns && (
          <Billboard position={[0, 1.78, 0]}>
            <mesh>
              <planeGeometry args={[1.12, 0.48]} />
              <meshBasicMaterial map={signs.menWc} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚺 [구역 5: 우측 하단 `화장실(여)`] (파우더룸 대형거울·세면대 2기·양변기 부스 2칸!) */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 4.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.6]} />
          <meshStandardMaterial map={tileTex} roughness={0.28} />
        </mesh>

        {/* 북쪽 벽면: 파우더룸 대리석 세면대 2기 & 간접조명 대형 거울 */}
        <group position={[-0.45, 0, -0.95]}>
          <RoundedBox args={[1.55, 0.72, 0.52]} position={[0, 0.36, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <mesh position={[0, 1.16, -0.23]}>
            <planeGeometry args={[1.45, 0.76]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
          <RoundedBox args={[1.48, 0.05, 0.06]} position={[0, 1.56, -0.22]} radius={0.01}>
            <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.5} />
          </RoundedBox>
          {[-0.38, 0.38].map((sx, si) => (
            <group key={si} position={[sx, 0.74, 0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.17, 0.13, 0.08, 24]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.13, 0.11, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
            </group>
          ))}
        </group>

        {/* 동쪽 안쪽: 핑크 파스텔 도어 양변기 부스 2칸 */}
        {[-0.35, 0.65].map((bz, bi) => (
          <group key={bi} position={[1.15, 0, bz]}>
            <RoundedBox args={[1.15, 1.18, 0.05]} position={[0, 0.59, -0.46]} radius={0.01} castShadow>
              <meshStandardMaterial color="#FBCFE8" />
            </RoundedBox>
            <RoundedBox args={[0.05, 1.08, 0.74]} position={[-0.55, 0.56, 0.05]} rotation={[0, 0.35, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#F472B6" />
            </RoundedBox>
            <DetailedMiniatureToilet2F position={[0.20, 0, 0]} rotationY={-Math.PI / 2} />
          </group>
        ))}

        {showRoomSigns && (
          <Billboard position={[0, 1.78, 0]}>
            <mesh>
              <planeGeometry args={[1.12, 0.48]} />
              <meshBasicMaterial map={signs.womenWc} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🪜 [구역 6: 좌측 하단 `계단` & 도면 속 대각선 코너 벽면 완벽 구현!] */}
      {/* ================================================================= */}
      <group position={[-4.85, 0, 4.25]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.6, 3.1]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`st2_${i}`}
            args={[0.32, 0.10 + i * 0.08, 1.25]}
            position={[0.65 - i * 0.30, (0.10 + i * 0.08) / 2, 0.1]}
            radius={0.01}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_2F[1]);
            }}
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        {/* 손그림 도면의 좌측 하단 대각선 꺾임 벽체 (`\`) */}
        <RoundedBox
          args={[0.16, 1.22, 1.65]}
          position={[2.45, 0.61, 0.55]}
          rotation={[0, -0.62, 0]}
          radius={0.01}
          castShadow
        >
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 1.68, 0]}>
            <mesh>
              <planeGeometry args={[1.12, 0.48]} />
              <meshBasicMaterial map={signs.stairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🛗 [구역 7: 하단 중앙 `엘베` 홀] */}
      {/* ================================================================= */}
      <group position={[-0.2, 0, 5.25]}>
        <RoundedBox args={[3.2, 2.3, 0.35]} position={[0, 1.15, 0.25]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.45, 1.95, 0.08]} position={[0, 0.98, 0.06]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.22, 0.06]} position={[0, 2.12, 0.08]} radius={0.01}>
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

      {/* ================================================================= */}
      {/* 🧱 내벽 및 외벽 구조물 (물리 충돌 박스와 100% 일치!) */}
      {/* ================================================================= */}
      {/* 좌측 사무실 경계벽 */}
      <RoundedBox args={[0.16, 1.22, 1.5]} position={[-3.0, 0.61, -0.4]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.1]} position={[-3.0, 0.61, 2.05]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.22, 0.16]} position={[-4.85, 0.61, 2.6]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      {/* 우측 목양실 / 남화장실 / 여화장실 경계벽 */}
      <RoundedBox args={[0.16, 1.22, 0.6]} position={[2.8, 0.61, -0.9]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.1]} position={[2.8, 0.61, 0.9]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.3]} position={[2.8, 0.61, 3.1]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[3.8, 1.22, 0.16]} position={[4.75, 0.61, 0.85]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[3.8, 1.22, 0.16]} position={[4.75, 0.61, 3.1]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      {/* 외벽 3면 */}
      <SmartCutawayWall2F wallSide="north">
        <RoundedBox args={[14.4, 2.5, 0.24]} position={[0, 1.25, -5.6]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall2F>
      <SmartCutawayWall2F wallSide="west">
        <RoundedBox args={[0.24, 2.5, 11.6]} position={[-6.6, 1.25, 0.1]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall2F>
      <SmartCutawayWall2F wallSide="east">
        <RoundedBox args={[0.24, 2.5, 11.6]} position={[6.6, 1.25, 0.1]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall2F>

      {/* 2층 NPC 렌더링 (한 번에 1명만 조용히 말풍선 표시, 클릭 시 1:1 대화 모달 오픈) */}
      {NPCS_2F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_2F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar2F
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
            seedOffset={idx * 1.4}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectNpcForChat) onSelectNpcForChat(npc);
            }}
          />
        );
      })}

      {/* 8대 상호작용 마커 */}
      {ZONES_2F.map((z) => (
        <HologramMarker2F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnSeat(sel.seatTarget);
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
// 🚶‍♂️ 플레이어 아바타 컨트롤러
// =====================================================================
function PlayerController2F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-0.2, 0, 2.8],
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
      const [nx, nz] = resolveCollision2F(rawNx, rawNz);
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
    <SmoothChibiAvatar2F
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

function InitialCameraSetup2F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 14.2, 13.2);
      camera.fov = 42;
    } else {
      camera.position.set(0, 11.4, 11.0);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, -0.4);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function CafeOffice2F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.2, 0, 2.8]);

  const [waypoints, setWaypoints] = useState([[-0.2, 2.8]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_2F[3]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  // 1:1 캐릭터 대화 & 카페 주문 모달 상태
  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_2F.length);
    }, 4200);
    return () => {
      clearInterval(timer);
      toggleCafeBgm2F(false);
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
    const nextPath = computeSmartPath2F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText(
      (npc.dialogues && npc.dialogues[0]) ||
      '할렐루야! 2층 좋은나무 북카페 & 목양센터에 오신 것을 환영합니다 ☕'
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

    // 상단 전체 카페
    ctx.fillStyle = '#D97706';
    ctx.fillRect(6, 6, w - 12, 32);

    // 좌측 사무실 & 계단
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(6, 42, 30, 24);
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 68, 30, 20);

    // 우측 목양실 & 남/여 화장실
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(76, 40, 32, 15);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(76, 57, 32, 15);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(76, 74, 32, 16);

    // 하단 중앙 엘베
    ctx.fillStyle = '#10B981';
    ctx.fillRect(42, 76, 26, 14);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.8) / 13.6) * w;
    const my = ((cz + 5.6) / 11.4) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_2F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 간판/BGM/시점리셋 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 2F 북카페 · 목양실 · 사무실
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
              toggleCafeBgm2F(next);
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: isMusicOn ? '#FDE047' : '#FFFFFF' }}>
              {isMusicOn ? '🎵 카페BGM 끔' : '☕ 카페BGM'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.4, 11.0);
              controlsRef.current.target.set(0, 0.4, -0.4);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#93C5FD' }}>🎥 시점리셋</span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 접이식 미니맵 & 구역 목록 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMapDrawerOpen(prev => !prev)}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 2F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_2F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnSeat(z.seatTarget);
                    else {
                      const dest = z.roomTarget || [z.pos[0], z.pos[2]];
                      handleWalkTo(dest[0], dest[1]);
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

      {/* 3. 하단 좌측: 접이식 2층 공간 바로가기 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '☕', label: seatedInfo ? '일어나기' : '북카페착석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnSeat({ x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 원목 라운지석' }); } },
              { icon: '🚪', label: '유리문·카페바', onClick: () => handleWalkTo(-2.6, -2.8) },
              { icon: '✝️', label: '목양실', onClick: () => handleWalkTo(4.4, -0.2) },
              { icon: '💻', label: '사무실', onClick: () => handleWalkTo(-4.6, 1.0) },
              { icon: '🚻', label: '화장실', onClick: () => handleWalkTo(4.2, 2.0) }
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
            ☕ 2F 공간 메뉴 ▲
          </button>
        )}
      </div>

      {/* 4. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.4, 11.0]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup2F controlsRef={controlsRef} />

        <ambientLight intensity={1.35} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 1.18]} />
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
          <planeGeometry args={[14.2, 13.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <TwoFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            const dest = z.roomTarget || [z.pos[0], z.pos[2]];
            handleWalkTo(dest[0], dest[1]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnSeat={handleSitOnSeat}
          onSelectNpcForChat={handleSelectNpcForChat}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController2F
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
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 바리스타·담임목사님·행정간사·성도 클릭 시 열리는 1:1 대화 & 주문 모달 */}
      {selectedChatNpc && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSelectedChatNpc(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: selectedChatNpc.shirt || '#D97706' }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-md"
                >
                  {selectedChatNpc.name.slice(0, 1)}
                </div>
                <div>
                  <span style={{ color: '#FDE047' }} className="text-[10.5px] font-bold block">
                    {selectedChatNpc.role || '2층 좋은나무 북카페'}
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
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' }}
              className="p-3.5 rounded-2xl border text-xs sm:text-[13px] leading-relaxed font-medium text-amber-100"
            >
              "{chatReplyText}"
            </div>

            <div className="space-y-1.5">
              <span style={{ color: '#9CA3AF' }} className="text-[11px] font-bold block">
                💬 대화 및 카페 주문·기도 요청하기
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    q: '☕ "따뜻한 스페셜티 아메리카노 한 잔과 조각케이크 부탁드려요!"',
                    a: `네 ${playerName}님! 정성껏 내린 향긋한 아메리카노와 케이크 대령했습니다. 성도님들과 행복한 교제 나누세요 🥰`
                  },
                  {
                    q: '🙏 "목사님·성도님, 이번 한 주간도 말씀 안에서 승리하도록 축복해 주세요."',
                    a: `아멘! ${playerName}님의 가정과 일터 위에 하나님의 은혜와 평강이 넘치기를 간절히 축복하며 기도합니다 🙏`
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatReplyText(item.a);
                      triggerEmote('wave');
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-500/25 border border-white/10 text-left text-xs font-bold cursor-pointer transition-all"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  handleSitOnSeat({
                    x: 1.6,
                    z: -2.62,
                    rotY: Math.PI,
                    rowLabel: '2F 북카페 라운지석'
                  });
                  setSelectedChatNpc(null);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🪑 카페 테이블에 앉기
              </button>
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  if (setActiveScreen) setActiveScreen('qt');
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#34D399' }}
                className="py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                📖 카페에서 오늘의 QT 묵상
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 구역 상세 안내 & 전 층(1F~6F) 이동 모달 */}
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

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 목양실 · 사무실 (현재 층)' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실)' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실' },
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
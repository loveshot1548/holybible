// src/metaverse/CafeOffice2F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎵 2층 북카페 어쿠스틱 재즈/찬양 오르골 BGM & 엘리베이터 차임벨 사운드
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

const playElevatorDingSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 띵-동 (2음 차임벨)
    [659.25, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);
      gain.gain.setValueAtTime(0.08, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.45);
    });
  } catch (_) {}
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (헤어라인 스틸 · 월넛 · 마루 · 유리 · 거울)
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

// 🛗 헤어라인 브러시드 스테인리스 스틸 메탈 텍스처 (image_214220.png 고증)
function makeBrushedSteelTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.3, '#F1F5F9');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(0.75, '#E2E8F0');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 240; i++) {
      const y = (i / 240) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeCafeFloorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#E8DFD1';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D5C7B2';
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
// 📍 2층 8대 인터랙션 존 정의
// =====================================================================
const ZONES_2F = [
  {
    id: 'zone_2f_elev',
    code: '01',
    subCode: '엘베',
    name: '2F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (문 열림 & 전 층 이동)',
    pos: [-0.2, 0, 4.3],
    isElevator: true,
    badge: '01 2F 엘리베이터',
    title: '🛗 2층 카페·목양·행정센터 스마트 엘리베이터',
    desc: '스테인리스 스틸 양개 자동문이 부드럽게 열리며 1층(로비), 3층(대예배당), 4층(자모실), 5층(소예배·조리실), 6층(교육관)으로 즉시 이동합니다.'
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
    roomTarget: [-4.4, 1.0],
    badge: '03 행정 사무실',
    title: '💻 좌측 중단 좋은나무교회 행정·교역자 사무실',
    desc: '화이트 바인더 책장과 키큰장 캐비닛, 그레이블루 파티션 데스크, 미니 가습기, 복합기가 갖춰진 쾌적한 행정·교역자 사무실입니다.'
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
    desc: '투명 통유리 가벽과 양개 유리문을 지나면 자작나무 빛트리와 향긋한 커피 향이 가득한 북카페가 펼쳐집니다.'
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
    desc: '화이트 모던 카운터와 에스프레소 머신, 펜던트 조명, 음료 쇼케이스 냉장고가 갖춰진 성도 교제 사랑방입니다.'
  },
  {
    id: 'zone_2f_cafe_table',
    code: '06',
    subCode: '카페좌석',
    name: '상단 카페 원목 피크닉석 & 파스텔 테이블석',
    prompt: '06 카페 의자에 앉아 커피 마시며 교제하기',
    pos: [1.6, 0, -2.8],
    seatTarget: { x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 파스텔 라운지석' },
    isSeatZone: true,
    badge: '06 북카페 테이블석',
    title: '🪑 자작나무 빛트리 & 북카페 멀티 라운지 테이블',
    desc: '원목 피크닉 테이블, 파스텔 핑크·민트 체어 테이블, 대형 서가 앞 스터디 롱 테이블 중 원하는 의자를 클릭해 착석하세요.'
  },
  {
    id: 'zone_2f_pastor_room',
    code: '07',
    subCode: '목양실',
    name: '우측 상단 담임목사님 목양실 (월넛 서재·상담)',
    prompt: '07 담임목사님 목양실 방문 & 기도받기',
    pos: [2.0, 0, -0.2],
    roomTarget: [4.2, -0.2],
    badge: '07 담임목사 목양실',
    title: '✝️ 우측 상단 담임목사님 목양실 (월넛 간접조명 서재 & 상담)',
    desc: '은은한 간접조명이 빛나는 월넛 빌트인 서재와 iMac 집무 데스크, 푹신한 크림색 라운지 암체어가 마련된 목양실입니다.'
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
    desc: '우측 중단에는 남성 화장실이, 우측 하단에는 파우더룸 거울과 부스가 갖춰진 여성 화장실이 각각 배치되어 있습니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체 · 가구 실시간 물리 충돌(AABB) & 문 통과 네비게이션
// =====================================================================
const SOLID_WALL_BOXES_2F = [
  { minX: -6.8, maxX: -1.40, minZ: -1.38, maxZ: -1.02 },
  { minX: 1.00, maxX: 6.8, minZ: -1.38, maxZ: -1.02 },
  { minX: -3.22, maxX: -2.78, minZ: -1.2, maxZ: 0.35 },
  { minX: -3.22, maxX: -2.78, minZ: 1.55, maxZ: 2.65 },
  { minX: -6.8, maxX: -3.0, minZ: 2.42, maxZ: 2.78 },
  { minX: -2.8, maxX: -1.8, minZ: 4.5, maxZ: 6.2 },
  { minX: 2.58, maxX: 3.02, minZ: -1.2, maxZ: -0.65 },
  { minX: 2.58, maxX: 3.02, minZ: 0.35, maxZ: 1.45 },
  { minX: 2.58, maxX: 3.02, minZ: 2.45, maxZ: 3.75 },
  { minX: 2.58, maxX: 3.02, minZ: 4.75, maxZ: 6.2 },
  { minX: 2.8, maxX: 6.8, minZ: 0.68, maxZ: 1.02 },
  { minX: 2.8, maxX: 6.8, minZ: 2.92, maxZ: 3.28 },
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
// 👥 2층 NPC 데이터 (목양실 목사님 위치 및 방향 완벽 교정!)
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
      '자작나무 빛트리 옆에서 향긋한 아메리카노와 조각케이크 드시고 가세요 🥰',
      '저를 클릭하시면 따뜻한 음료와 다과를 주문하실 수 있습니다!'
    ]
  },
  {
    id: 'pastor_office_2f',
    name: '담임목사님 (목양실)',
    role: '담임목사 서재 · 상담실',
    x: 5.95, // 👈 중역 의자 시트 정중앙에 안착하여 서쪽(-X) 데스크와 iMac 모니터를 정면으로 바라봄!
    y: 0,
    z: -0.34,
    rotY: -Math.PI / 2,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '성도님 반갑습니다! 새로 단장한 서재와 라운지 소파에서 함께 기도하며 교제합시다 ✝️',
      '주님께서 성도님의 가정과 일터 위에 평강의 복을 내려주시길 늘 기도합니다 🙏'
    ]
  },
  {
    id: 'admin_staff_2f',
    name: '이간사 (행정사무실)',
    role: '교회 행정·재정·주보 담당',
    x: -4.55,
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
      '새로 정리된 화이트 바인더 책장과 쾌적한 데스크에서 주보를 제작하고 있어요 💻',
      '교회 등록이나 행정 안내가 필요하시면 언제든 말씀해 주세요 😊'
    ]
  },
  {
    id: 'office_pastor_2f',
    name: '박전도사 (교역자실)',
    role: '교육·청년부 담당교역자',
    x: -4.55,
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
      '행정 사무실에 가습기와 수납장이 잘 갖춰져서 사역 준비가 정말 잘 됩니다!'
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
      '반짝이는 자작나무 빛트리와 파스텔 톤 의자들이 있어서 카페가 너무 예뻐요 ☕',
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
      '북카페 책장에 좋은 신앙 서적들이 많아서 커피 마시며 독서하기 참 좋습니다 📚',
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
      '엘리베이터 문이 스르륵 열리고 닫히는 게 진짜 교회 빌딩에 온 것 같아요! ✨',
      '오른쪽 목양실 서재도 호텔 라운지처럼 너무 고급스럽게 꾸며져 있네요.'
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
// 🚶‍♀️ 둥근 유선형 아바타 & 남녀 헤어스타일 & 멀티라인 말풍선
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
        leftArmRef.current.rotation.x = -0.45 + Math.sin(t * 2.2) * 0.05;
        rightArmRef.current.rotation.x = -0.45 + Math.cos(t * 2.2) * 0.05;
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
// 🪑 곡선형 메쉬 오피스 체어 · 파스텔 폴딩 체어 · 빛트리 · 화장실 컴포넌트
// =====================================================================
function DetailedCafeChair({ position, rotationY = 0, seatColor = '#F472B6', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* 부드러운 원형 쿠션 시트 */}
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.20, 0.055, 24]} />
        <meshStandardMaterial color={seatColor} roughness={0.35} />
      </mesh>
      {/* 곡선형 등받이 패드 */}
      <RoundedBox args={[0.38, 0.24, 0.05]} position={[0, 0.56, 0.17]} rotation={[0.14, 0, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.35} />
      </RoundedBox>
      {/* 실버 스틸 프레임 다리 */}
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]} castShadow>
          <cylinderGeometry args={[0.014, 0.012, 0.34, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// 💺 실제 사진(image_2b2762.png)의 곡선형 블랙 메쉬 오피스 회전의자
function ErgonomicMeshOfficeChair({ position, rotationY = 0, onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* 푹신한 성형 스폰지 좌판 */}
      <RoundedBox args={[0.46, 0.07, 0.44]} position={[0, 0.35, 0]} radius={0.035} castShadow receiveShadow>
        <meshStandardMaterial color="#18181B" roughness={0.45} />
      </RoundedBox>
      {/* 인체공학 S자 곡선 메쉬 등받이 & 헤드레스트 */}
      <RoundedBox args={[0.42, 0.46, 0.045]} position={[0, 0.62, 0.19]} rotation={[0.12, 0, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color="#27272A" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.26, 0.12, 0.05]} position={[0, 0.90, 0.22]} rotation={[0.08, 0, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color="#18181B" />
      </RoundedBox>
      {/* 곡선형 팔걸이 */}
      {[-0.24, 0.24].map((ax, ai) => (
        <group key={ai} position={[ax, 0.46, 0.02]}>
          <RoundedBox args={[0.045, 0.035, 0.28]} position={[0, 0.06, 0]} radius={0.015}>
            <meshStandardMaterial color="#18181B" />
          </RoundedBox>
          <mesh position={[0, -0.03, 0.08]}>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
            <meshStandardMaterial color="#3F3F46" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 중심 유압봉 & 5발 캐스터 바퀴 베이스 */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.32, 12]} />
        <meshStandardMaterial color="#18181B" metalness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4].map((bi) => {
        const ang = (bi * Math.PI * 2) / 5;
        return (
          <group key={bi} rotation={[0, ang, 0]}>
            <RoundedBox args={[0.03, 0.025, 0.26]} position={[0, 0.04, 0.12]} radius={0.01}>
              <meshStandardMaterial color="#27272A" metalness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0.02, 0.24]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#090A0F" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 🎄 실제 카페 사진(image_2b243b.png)의 빨간 리본 & 따뜻한 LED 꼬마전구 하얀 자작나무 빛트리
function BirchFairyLightTree({ position }) {
  return (
    <group position={position}>
      {/* 화이트 원통 화분 */}
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.40, 20]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </mesh>
      {/* 하얀 자작나무 기둥 & 뻗어나간 가지들 */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.055, 1.55, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      {[
        [0.18, 1.25, 0.12, 0.45, -0.5, 0.3],
        [-0.20, 1.15, -0.10, -0.4, 0.4, -0.4],
        [0.12, 1.48, -0.16, -0.45, -0.3, 0.35],
        [-0.15, 1.42, 0.18, 0.5, 0.3, -0.35]
      ].map(([bx, by, bz, rx, ry, rz], bi) => (
        <mesh key={bi} position={[bx, by, bz]} rotation={[rx, ry, rz]} castShadow>
          <cylinderGeometry args={[0.012, 0.024, 0.58, 8]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      ))}
      {/* 예쁜 빨간 리본 오너먼트 4개 */}
      {[
        [0.16, 1.22, 0.18],
        [-0.18, 1.12, 0.12],
        [0.08, 1.46, -0.14],
        [-0.12, 1.38, -0.12]
      ].map(([rx, ry, rz], ri) => (
        <group key={`rib_${ri}`} position={[rx, ry, rz]}>
          <mesh rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.045, 0.09, 12]} />
            <meshStandardMaterial color="#DC2626" roughness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.045, 0.09, 12]} />
            <meshStandardMaterial color="#DC2626" roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* 반짝이는 웜화이트 LED 꼬마전구 14개 */}
      {Array.from({ length: 14 }).map((_, li) => {
        const ang = (li / 14) * Math.PI * 4;
        const rad = 0.12 + (li % 3) * 0.09;
        const ly = 0.78 + (li / 14) * 0.95;
        return (
          <mesh key={`led_${li}`} position={[Math.cos(ang) * rad, ly, Math.sin(ang) * rad]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshBasicMaterial color="#FEF08A" />
          </mesh>
        );
      })}
      <pointLight position={[0, 1.3, 0]} intensity={1.2} distance={3.5} color="#FDE047" />
    </group>
  );
}

// 🛗 실제 사진(image_214220.png) 100% 고증 — 양문 슬라이딩 개폐 모션이 탑재된 스테인리스 스틸 엘리베이터!
function AnimatedStainlessElevator2F({ position, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);

  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - position[0], pz - (position[2] - 0.6));
    const isOpen = forceOpen || dist < 1.85;

    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      playElevatorDingSound();
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }

    // 닫혔을 때: 좌(-0.34), 우(+0.34) / 열렸을 때: 좌(-0.92), 우(+0.92)로 부드럽게 슬라이딩!
    const targetLeftX = isOpen ? -0.92 : -0.34;
    const targetRightX = isOpen ? 0.92 : 0.34;

    leftDoorRef.current.position.x = THREE.MathUtils.lerp(leftDoorRef.current.position.x, targetLeftX, delta * 6.5);
    rightDoorRef.current.position.x = THREE.MathUtils.lerp(rightDoorRef.current.position.x, targetRightX, delta * 6.5);
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickElevator) onClickElevator();
      }}
    >
      {/* 1) 문이 열렸을 때 보이는 밝고 고급스러운 엘리베이터 내부 카(Car) 공간 */}
      <group position={[0, 0, 0.38]}>
        {/* 내부 바닥 타일 & 천장 LED 조명 */}
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 0.03, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 2.08, 0]} radius={0.01}>
          <meshBasicMaterial color="#FFFBEB" />
        </RoundedBox>
        {/* 내부 뒷벽: 우드 패널 & 상단 거울 & 손잡이 바(Handrail) */}
        <RoundedBox args={[1.65, 2.12, 0.06]} position={[0, 1.06, 0.32]} radius={0.01}>
          <meshStandardMaterial map={oakTex} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 1.38, 0.28]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.25, 0.95]} />
          <meshBasicMaterial map={mirrorTex} />
        </mesh>
        <RoundedBox args={[1.35, 0.04, 0.05]} position={[0, 0.82, 0.26]} radius={0.015}>
          <meshStandardMaterial map={steelTex} metalness={0.9} roughness={0.15} />
        </RoundedBox>
        {/* 내부 좌·우 측벽 */}
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[-0.82, 1.06, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[0.82, 1.06, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <pointLight position={[0, 1.85, 0]} intensity={1.4} distance={3.2} color="#FFFBEB" />
      </group>

      {/* 2) 좌·우로 스르륵 열리고 닫히는 브러시드 스테인리스 스틸 양개 자동문 */}
      <group position={[0, 1.02, 0.04]}>
        <RoundedBox
          ref={leftDoorRef}
          args={[0.67, 2.02, 0.05]}
          position={[-0.34, 0, 0]}
          radius={0.008}
          castShadow
          receiveShadow
          userData={{ keepOpaque: true }}
        >
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <RoundedBox
          ref={rightDoorRef}
          args={[0.67, 2.02, 0.05]}
          position={[0.34, 0, 0]}
          radius={0.008}
          castShadow
          receiveShadow
          userData={{ keepOpaque: true }}
        >
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* 3) 사진(image_214220.png) 속 입체 스테인리스 스틸 3면 문틀(Jamb) & 외벽 마감 */}
      {/* 좌·우 두꺼운 스테인리스 기둥 프레임 */}
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[-0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      {/* 상단 스테인리스 트랜섬(Transom) 헤더 바 */}
      <RoundedBox args={[1.92, 0.26, 0.25]} position={[0, 2.15, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>

      {/* 양옆 대리석/타일 홀 벽체 마감 */}
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[-1.32, 1.14, 0.02]} radius={0.015} receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[1.32, 1.14, 0.02]} radius={0.015} receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </RoundedBox>

      {/* 4) 상단 중앙 층수 표시 디지털 인디케이터 (`▼ 2F`) & 우측 기둥 호출 버튼 패널 */}
      <RoundedBox args={[0.38, 0.12, 0.04]} position={[0, 2.15, -0.12]} radius={0.01} userData={{ keepOpaque: true }}>
        <meshStandardMaterial color="#090A0F" />
      </RoundedBox>
      <mesh position={[0, 2.15, -0.145]} rotation={[0, Math.PI, 0]} userData={{ keepOpaque: true }}>
        <planeGeometry args={[0.32, 0.08]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>

      {/* 우측 프레임의 상/하 호출 버튼 박스 */}
      <group position={[-0.82, 1.05, -0.125]} userData={{ keepOpaque: true }}>
        <RoundedBox args={[0.10, 0.24, 0.02]} radius={0.01}>
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </RoundedBox>
        <mesh position={[0, 0.05, -0.015]}>
          <circleGeometry args={[0.022, 12]} />
          <meshBasicMaterial color="#34D399" />
        </mesh>
        <mesh position={[0, -0.05, -0.015]}>
          <circleGeometry args={[0.022, 12]} />
          <meshBasicMaterial color="#FBBF24" />
        </mesh>
      </group>

      {showRoomSigns && (
        <Billboard position={[0, 2.55, 0]}>
          <mesh>
            <planeGeometry args={[1.15, 0.52]} />
            <meshBasicMaterial map={signTex} transparent />
          </mesh>
        </Billboard>
      )}
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
// 🏛️ 2층 초고도화 마스터피스 디오라마 씬
// =====================================================================
function TwoFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnSeat,
  onSelectNpcForChat,
  activeNpcChatIdx,
  showRoomSigns,
  playerIdxRef,
  isElevatorModalOpen
}) {
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);
  const walnutTex = useMemo(() => makeWoodGrainTexture('#522D12', '#331A08'), []);
  const cafeFloorTex = useMemo(() => makeCafeFloorTexture(), []);
  const tileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);

  // 목양실 iMac 화면 텍스처 (image_2b2b7f.png 고증)
  const imacScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#312E81');
      grad.addColorStop(0.5, '#9D174D');
      grad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(w * 0.15, h * 0.18, w * 0.7, h * 0.65);
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('주일 대예배 설교 원고 연구', w / 2, h * 0.42);
      ctx.fillStyle = '#64748B';
      ctx.font = '15px sans-serif';
      ctx.fillText('개역개정 4판 · 히브리어/헬라어 강해', w / 2, h * 0.58);
    }, 512, 320);
  }, []);

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
    elevator: makeRoomSignTexture('2F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~6F) 이동', '#10B981')
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
      {/* ☕ [구역 1: 실제 사진(`image_2b243b.png`) 100% 반영 — 2F 좋은나무 카페] */}
      {/* ================================================================= */}
      <group>
        {/* 북카페 따뜻한 베이지 포세린 타일/마루 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -3.4]} receiveShadow>
          <planeGeometry args={[13.2, 4.4]} />
          <meshStandardMaterial map={cafeFloorTex} roughness={0.32} />
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

        {/* 🌟 실제 카페 사진(image_2b243b.png) 고증 1: 천장 4방향 화이트 시스템 에어컨 & 블랙 레일 스포트라이트 */}
        <group position={[0, 2.52, -3.3]}>
          {/* 중앙 4방향 화이트 천장형 시스템 에어컨 */}
          <RoundedBox args={[1.15, 0.10, 1.15]} position={[0.4, 0, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </RoundedBox>
          <RoundedBox args={[0.78, 0.02, 0.78]} position={[0.4, -0.055, 0]} radius={0.01}>
            <meshStandardMaterial color="#CBD5E1" />
          </RoundedBox>
          {/* 블랙 레일 트랙 & 웜화이트 스포트라이트 */}
          {[-1.1, 1.1].map((rz, ri) => (
            <group key={`rail_${ri}`} position={[0.5, 0.02, rz]}>
              <RoundedBox args={[9.6, 0.03, 0.04]} radius={0.005}>
                <meshStandardMaterial color="#18181B" />
              </RoundedBox>
              {[-3.6, -1.8, 0, 1.8, 3.6].map((sx, si) => (
                <group key={si} position={[sx, -0.06, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.10, 12]} />
                    <meshStandardMaterial color="#18181B" />
                  </mesh>
                  <mesh position={[0, -0.055, 0]}>
                    <sphereGeometry args={[0.032, 10, 10]} />
                    <meshBasicMaterial color="#FEF08A" />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
        </group>

        {/* 🌟 실제 카페 사진 고증 2: 화이트 & 블루 포인트 카운터 바 + 좌측 투도어 화이트 냉장고 + 에스프레소 머신 */}
        <group position={[-4.1, 0, -3.85]}>
          {/* 좌측 대형 화이트 양문형 냉장고/쇼케이스 */}
          <group position={[-2.05, 0, -0.65]}>
            <RoundedBox args={[0.92, 1.92, 0.68]} position={[0, 0.96, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0.96, 0.345]}>
              <boxGeometry args={[0.015, 1.86, 0.01]} />
              <meshBasicMaterial color="#CBD5E1" />
            </mesh>
          </group>

          {/* 모던 화이트 카운터 바 & 하단 코발트 블루 포인트 배너 */}
          <RoundedBox args={[3.4, 0.88, 0.86]} position={[0, 0.44, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </RoundedBox>
          <RoundedBox args={[3.2, 0.26, 0.03]} position={[0, 0.62, 0.43]} radius={0.01}>
            <meshStandardMaterial color="#1D4ED8" roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[3.56, 0.06, 0.94]} position={[0, 0.90, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
          </RoundedBox>

          {/* 2그룹 전문가용 에스프레소 머신 & 그라인더 */}
          <group position={[-0.85, 0.93, -0.05]}>
            <RoundedBox args={[0.72, 0.44, 0.46]} position={[0, 0.22, 0]} radius={0.04} castShadow>
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.2} />
            </RoundedBox>
            <RoundedBox args={[0.64, 0.10, 0.14]} position={[0, 0.34, 0.18]} radius={0.02}>
              <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
            </RoundedBox>
          </group>

          {/* 유리 돔 디저트 트레이 & 케이크 */}
          {[-0.05, 0.45, 0.95].map((cx, ci) => (
            <group key={ci} position={[cx, 0.93, 0.08]}>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.16, 0.14, 0.03, 20]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.11, 0.11, 0.10, 20]} />
                <meshStandardMaterial color={['#F43F5E', '#FDE047', '#D97706'][ci]} />
              </mesh>
              <mesh position={[0, 0.10, 0]}>
                <sphereGeometry args={[0.14, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#E0F2FE" transparent opacity={0.45} roughness={0.05} />
              </mesh>
            </group>
          ))}

          {/* 뒷벽 상부장 & 메뉴 보드 & 3구 펜던트 램프 */}
          <group position={[0, 1.85, -1.55]}>
            <RoundedBox args={[2.4, 1.05, 0.06]} radius={0.02} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[2.28, 0.94]} />
              <meshBasicMaterial map={cafeMenuTex} />
            </mesh>
          </group>

          {[-1.0, 0, 1.0].map((lx, li) => (
            <group key={li} position={[lx, 2.05, 0]}>
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <meshStandardMaterial color={li === 1 ? '#1E293B' : '#F8FAFC'} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.04, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={2.0} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 🌟 실제 카페 사진 고증 3: 빨간 리본 & LED 꼬마전구가 빛나는 하얀 자작나무 빛트리! */}
        <BirchFairyLightTree position={[-1.55, 0, -1.85]} />

        {/* 🌟 실제 카페 사진 고증 4: 좌측 앞 내추럴 원목 피크닉 벤치 테이블 세트 */}
        <group position={[-0.65, 0, -2.55]}>
          <RoundedBox args={[1.45, 0.055, 0.68]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.3} />
          </RoundedBox>
          {[-0.55, 0.55].map((lx, li) => (
            <RoundedBox key={li} args={[0.07, 0.60, 0.58]} position={[lx, 0.30, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#27272A" />
            </RoundedBox>
          ))}
          {/* 양쪽 원목 벤치 의자 */}
          {[-0.52, 0.52].map((bz, bi) => (
            <group
              key={`bench_${bi}`}
              position={[0, 0, bz]}
              onClick={(e) => {
                e.stopPropagation();
                onSitOnSeat({ x: -0.65, z: -2.55 + bz, rotY: bi === 0 ? 0 : Math.PI, rowLabel: '2F 북카페 원목 피크닉 벤치석' });
              }}
            >
              <RoundedBox args={[1.38, 0.05, 0.28]} position={[0, 0.35, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={oakTex} roughness={0.32} />
              </RoundedBox>
              {[-0.52, 0.52].map((blx, bli) => (
                <RoundedBox key={bli} args={[0.05, 0.34, 0.24]} position={[blx, 0.17, 0]} radius={0.01}>
                  <meshStandardMaterial color="#27272A" />
                </RoundedBox>
              ))}
            </group>
          ))}
        </group>

        {/* 🌟 실제 카페 사진 고증 5: 중앙 화이트 사각/원형 테이블 + 파스텔 핑크 & 민트블루 체어 세트 */}
        {[
          [1.6, -3.2],
          [3.65, -2.25]
        ].map(([tx, tz], tIdx) => (
          <group key={`pastel_tbl_${tIdx}`} position={[tx, 0, tz]}>
            <RoundedBox args={[1.25, 0.05, 0.78]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>
            {[-0.50, 0.50].map((lx, li) => (
              <mesh key={li} position={[lx, 0.31, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.62, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.6} />
              </mesh>
            ))}
            {/* 테이블 위 커피잔과 디저트 접시 */}
            <mesh position={[-0.25, 0.67, 0.10]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
              <meshStandardMaterial color="#F472B6" />
            </mesh>
            <mesh position={[0.25, 0.67, -0.10]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>

            {/* 파스텔 핑크 & 파스텔 민트블루 의자 4석 */}
            {[
              [-0.75, 0, Math.PI / 2, '#F472B6'],
              [0.75, 0, -Math.PI / 2, '#38BDF8'],
              [-0.28, -0.56, 0, '#93C5FD'],
              [0.28, 0.56, Math.PI, '#F9A8D4']
            ].map(([cx, cz, cRot, cCol], ci) => (
              <DetailedCafeChair
                key={ci}
                position={[cx, 0, cz]}
                rotationY={cRot}
                seatColor={cCol}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: tx + cx, z: tz + cz, rotY: cRot, rowLabel: `2F 북카페 파스텔 테이블석` });
                }}
              />
            ))}
          </group>
        ))}

        {/* 🌟 실제 카페 사진 고증 6: 우측 안쪽 대형 5열 북카페 도서 책장 & 6인용 블랙 스터디 롱 테이블 */}
        <group position={[4.55, 0, -3.85]}>
          <RoundedBox args={[1.85, 0.055, 0.85]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.35} />
          </RoundedBox>
          {[-0.78, 0.78].map((lx, li) => (
            <RoundedBox key={li} args={[0.06, 0.60, 0.78]} position={[lx, 0.30, 0]} radius={0.01}>
              <meshStandardMaterial color="#0F172A" />
            </RoundedBox>
          ))}
          {[-0.55, 0, 0.55].map((cx, ci) => (
            <React.Fragment key={ci}>
              <DetailedCafeChair
                position={[cx, 0, -0.58]}
                rotationY={0}
                seatColor="#1E293B"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: 4.55 + cx, z: -3.85 - 0.58, rotY: 0, rowLabel: '2F 북카페 독서 테이블석' });
                }}
              />
              <DetailedCafeChair
                position={[cx, 0, 0.58]}
                rotationY={Math.PI}
                seatColor="#1E293B"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: 4.55 + cx, z: -3.85 + 0.58, rotY: Math.PI, rowLabel: '2F 북카페 독서 테이블석' });
                }}
              />
            </React.Fragment>
          ))}
        </group>

        {/* 우측 벽면 화이트 5단 대형 북카페 서가 (책 60여 권 수납) */}
        <group position={[6.28, 0, -3.4]}>
          <RoundedBox args={[0.38, 1.95, 3.4]} position={[0, 0.98, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </RoundedBox>
          {[0.42, 0.84, 1.26, 1.68].map((sy, si) => (
            <RoundedBox key={si} args={[0.40, 0.03, 3.34]} position={[-0.02, sy, 0]} radius={0.005}>
              <meshStandardMaterial color="#E2E8F0" />
            </RoundedBox>
          ))}
          {[-1.3, -0.75, -0.2, 0.35, 0.9, 1.35].map((bz, bi) => (
            <group key={bi} position={[-0.06, 0, bz]}>
              {[0.22, 0.62, 1.04, 1.46].map((by, bj) => (
                <RoundedBox
                  key={bj}
                  args={[0.24, 0.28, 0.36]}
                  position={[0, by, 0]}
                  radius={0.01}
                >
                  <meshStandardMaterial color={['#3B82F6', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'][(bi + bj) % 6]} />
                </RoundedBox>
              ))}
            </group>
          ))}
        </group>

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
      {/* 💻 [구역 2: 실제 사진(`image_2b2762.png`) 100% 반영 — 좌측 중단 `행정 사무실`] */}
      {/* ================================================================= */}
      <group position={[-4.85, 0, 0.7]}>
        {/* 사무실 그레이 데코타일 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.6, 3.7]} />
          <meshStandardMaterial color="#D1D5DB" roughness={0.55} />
        </mesh>

        {/* 🌟 실제 사진 고증 1: 서쪽 벽면 화이트 수납장 (상단 3단 오픈 바인더 책장 + 하단 양문 도어 수납장 + 우측 키큰장 캐비닛!) */}
        <group position={[-1.48, 0, -0.15]}>
          {/* 좌측 2열: 하단 양문형 도어 수납장 + 은색 아치형 손잡이 */}
          <RoundedBox args={[0.44, 0.76, 1.75]} position={[0, 0.38, -0.45]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </RoundedBox>
          {[-1.05, -0.75, -0.25, 0.05].map((hz, hi) => (
            <RoundedBox key={`hdl_${hi}`} args={[0.03, 0.14, 0.02]} position={[0.23, 0.52, hz]} radius={0.005}>
              <meshStandardMaterial color="#94A3B8" metalness={0.9} />
            </RoundedBox>
          ))}

          {/* 좌측 2열: 상단 3단 화이트 오픈 바인더 책장 */}
          <RoundedBox args={[0.40, 1.15, 1.75]} position={[-0.02, 1.33, -0.45]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </RoundedBox>
          {[1.12, 1.50].map((sy, si) => (
            <RoundedBox key={si} args={[0.42, 0.03, 1.72]} position={[0, sy, -0.45]} radius={0.005}>
              <meshStandardMaterial color="#E2E8F0" />
            </RoundedBox>
          ))}
          {/* 칸마다 꽂힌 블랙·블루·그린 행정 바인더 파일철 & 성경 전집 */}
          {[-1.12, -0.82, -0.52, -0.22, 0.08].map((fz, fi) => (
            <group key={fi}>
              <RoundedBox args={[0.28, 0.30, 0.22]} position={[0.05, 1.68, fz]} radius={0.01} castShadow>
                <meshStandardMaterial color={['#18181B', '#1D4ED8', '#FFFFFF', '#047857', '#1E293B'][fi]} />
              </RoundedBox>
              <RoundedBox args={[0.28, 0.30, 0.22]} position={[0.05, 1.31, fz]} radius={0.01} castShadow>
                <meshStandardMaterial color={['#451A03', '#78350F', '#FEF3C7', '#9A3412', '#B45309'][fi]} />
              </RoundedBox>
              <RoundedBox args={[0.28, 0.28, 0.22]} position={[0.05, 0.94, fz]} radius={0.01} castShadow>
                <meshStandardMaterial color={['#16A34A', '#2563EB', '#18181B', '#64748B', '#0284C7'][fi]} />
              </RoundedBox>
            </group>
          ))}

          {/* 우측(안쪽): 화이트 2도어 키큰장 캐비닛 */}
          <RoundedBox args={[0.44, 1.91, 1.15]} position={[0, 0.955, 1.02]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.22} />
          </RoundedBox>
          <mesh position={[0.225, 0.955, 1.02]}>
            <boxGeometry args={[0.01, 1.85, 0.015]} />
            <meshBasicMaterial color="#CBD5E1" />
          </mesh>
        </group>

        {/* 🌟 실제 사진 고증 2: 좌측 하단 구석의 핑크/화이트 선물 쇼핑백 & 종이박스 소품 */}
        <group position={[-1.15, 0, 1.48]}>
          <RoundedBox args={[0.38, 0.28, 0.32]} position={[0, 0.14, 0]} radius={0.01} castShadow>
            <meshStandardMaterial color="#D6B892" />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.26, 0.12]} position={[-0.08, 0.32, 0.05]} radius={0.01} castShadow>
            <meshStandardMaterial color="#F472B6" />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.26, 0.12]} position={[0.10, 0.32, -0.04]} radius={0.01} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
        </group>

        {/* 🌟 실제 사진 고증 3: 아일랜드 대면형 화이트 데스크 + 흰색 테이블보 드레이프 + 그레이블루 파티션 + 원통 가습기 + 우드 모니터 받침대 + 물티슈 + 유선 전화기 + 곡선형 메쉬 체어! */}
        {[-0.80, 0.60].map((dz, di) => (
          <group key={`off_desk_${di}`} position={[0.15, 0, dz]}>
            {/* 책상 상판 & 앞쪽 흰색 테이블보 드레이프 오버행 */}
            <RoundedBox args={[1.68, 0.055, 0.82]} position={[0, 0.64, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>
            <RoundedBox args={[1.69, 0.14, 0.02]} position={[0, 0.58, 0.41]} radius={0.005}>
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </RoundedBox>
            <RoundedBox args={[0.02, 0.14, 0.82]} position={[-0.84, 0.58, 0]} radius={0.005}>
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </RoundedBox>

            {/* 슬림 스틸 프레임 다리 */}
            {[[-0.80, -0.36], [0.80, -0.36], [-0.80, 0.36], [0.80, 0.36]].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, 0.32, lz]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.64, 10]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
              </mesh>
            ))}

            {/* 사진 속 차분한 그레이블루 패브릭 데스크 파티션 & 멀티탭 */}
            <RoundedBox args={[1.64, 0.34, 0.04]} position={[0, 0.83, -0.38]} radius={0.015} castShadow>
              <meshStandardMaterial color="#64748B" roughness={0.7} />
            </RoundedBox>

            {/* 슬림 베젤 커브드/평면 모니터 2대 & 스탠드 암 */}
            {[-0.32, 0.32].map((mx, mi) => (
              <group key={mi} position={[mx, 0.88, -0.18]}>
                <RoundedBox args={[0.52, 0.32, 0.025]} radius={0.015} castShadow>
                  <meshStandardMaterial color="#18181B" roughness={0.3} />
                </RoundedBox>
                <mesh position={[0, 0, 0.015]}>
                  <planeGeometry args={[0.48, 0.28]} />
                  <meshBasicMaterial color={mi === 0 ? '#1E293B' : '#0F172A'} />
                </mesh>
                <mesh position={[0, -0.18, -0.02]}>
                  <cylinderGeometry args={[0.018, 0.025, 0.12, 10]} />
                  <meshStandardMaterial color="#27272A" />
                </mesh>
              </group>
            ))}

            {/* 사진 속 데스크 소품들: 1) 화이트 원통형 미니 가습기, 2) 2단 우드 선반 & 간식 바구니, 3) 연두색 물티슈, 4) 블랙 사무용 전화기 */}
            <group position={[-0.62, 0.67, -0.05]}>
              {/* 화이트 원통형 가습기 */}
              <mesh position={[0, 0.11, -0.14]} castShadow>
                <cylinderGeometry args={[0.075, 0.085, 0.22, 20]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              </mesh>
              {/* 세이지 그린 & 우드 2단 정리 선반 + 다과 바구니 */}
              <RoundedBox args={[0.28, 0.06, 0.22]} position={[0, 0.03, 0.08]} radius={0.01} castShadow>
                <meshStandardMaterial color="#84A98C" />
              </RoundedBox>
              <RoundedBox args={[0.24, 0.07, 0.18]} position={[0, 0.09, 0.08]} radius={0.01} castShadow>
                <meshStandardMaterial color="#E6C699" />
              </RoundedBox>
              {/* 앞쪽 연두색 캡 물티슈 팩 */}
              <RoundedBox args={[0.16, 0.035, 0.11]} position={[-0.04, 0.02, 0.26]} rotation={[0, 0.25, 0]} radius={0.01}>
                <meshStandardMaterial color="#84CC16" />
              </RoundedBox>
            </group>

            {/* 우측 블랙 사무용 유선 전화기 & 키보드 */}
            <RoundedBox args={[0.16, 0.05, 0.18]} position={[0.65, 0.69, 0.08]} rotation={[0, -0.3, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <RoundedBox args={[0.32, 0.02, 0.12]} position={[0.15, 0.68, 0.16]} radius={0.005}>
              <meshStandardMaterial color="#27272A" />
            </RoundedBox>

            {/* 사진 속 인체공학 곡선형 블랙 메쉬 체어 */}
            <ErgonomicMeshOfficeChair
              position={[0.15, 0, 0.54]}
              rotationY={0}
              onClick={(e) => {
                e.stopPropagation();
                onSitOnSeat({ x: -4.85 + 0.30, z: 0.7 + dz + 0.54, rotY: Math.PI, rowLabel: '2F 행정사무실 업무석' });
              }}
            />
          </group>
        ))}

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
      {/* ✝️ [구역 3: 레퍼런스(`image_2b2b7f.png`) 100% 반영 — 우측 상단 `담임목사 목양실`] */}
      {/* - 의자와 목사님이 서쪽 책상과 iMac 모니터를 정면으로 바라보도록 완벽 교정! */}
      {/* - 칸별 웜톤 LED 간접조명이 켜진 다크 월넛 빌트인 서재 & 크림색 라운지 암체어! */}
      {/* ================================================================= */}
      <group position={[4.75, 0, -0.18]}>
        {/* 목양실 고급 헤링본 월넛 원목 마루 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.0]} />
          <meshStandardMaterial map={oakTex} roughness={0.28} />
        </mesh>

        {/* 📚 1) 레퍼런스 사진(image_2b2b7f.png) 완벽 재현: 북쪽+동쪽 ㄱ자형 다크 월넛 빌트인 서재 & 칸별 웜톤 LED 간접조명! */}
        <group position={[-0.12, 0, -0.82]}>
          {/* 다크 월넛 서재 백월 & 프레임 */}
          <RoundedBox args={[3.22, 1.94, 0.36]} position={[0, 0.97, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.32} />
          </RoundedBox>
          <RoundedBox args={[3.30, 0.09, 0.42]} position={[0, 1.96, 0.02]} radius={0.015} castShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.25} />
          </RoundedBox>

          {/* 4단 가로 선반 + 각 선반 밑에서 은은하게 빛나는 웜화이트 히든 LED 라이트 바! */}
          {[0.46, 0.92, 1.38, 1.84].map((sy, si) => (
            <group key={`sh_h_${si}`}>
              <RoundedBox args={[3.16, 0.04, 0.38]} position={[0, sy, 0.02]} radius={0.005}>
                <meshStandardMaterial map={walnutTex} />
              </RoundedBox>
              {/* 히든 LED 스트립 조명 */}
              <mesh position={[0, sy - 0.022, 0.14]}>
                <boxGeometry args={[3.04, 0.012, 0.025]} />
                <meshBasicMaterial color="#FDE68A" />
              </mesh>
            </group>
          ))}
          <pointLight position={[0, 1.35, 0.35]} intensity={1.8} distance={3.5} color="#FDE68A" />

          {/* 5칸 세로 기둥 */}
          {[-1.52, -0.76, 0, 0.76, 1.52].map((sx, si) => (
            <RoundedBox key={`sh_v_${si}`} args={[0.045, 1.90, 0.38]} position={[sx, 0.95, 0.02]} radius={0.005}>
              <meshStandardMaterial map={walnutTex} />
            </RoundedBox>
          ))}

          {/* 서재 각 칸의 디테일: 1) 세워진 양장본들, 2) 가로로 눕혀 쌓은 아트북 더미, 3) 화이트 매트 액자 3점, 4) 도자기 오브제 */}
          {[-1.14, -0.38, 0.38, 1.14].map((cellX, cIdx) => (
            <group key={`book_col_${cIdx}`} position={[cellX, 0, 0.06]}>
              {/* 1단: 중후한 가죽 양장 주석서 + 옆에 가로로 눕혀 쌓은 책 더미 */}
              {Array.from({ length: 5 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b1_${bIdx}`}
                  args={[0.06, 0.32, 0.22]}
                  position={[-0.26 + bIdx * 0.068, 0.22, 0]}
                  radius={0.006}
                  castShadow
                >
                  <meshStandardMaterial
                    color={['#27272A', '#451A03', '#1E293B', '#78350F', '#3F3F46'][bIdx]}
                    roughness={0.4}
                  />
                </RoundedBox>
              ))}
              {/* 가로로 눕혀 쌓은 책 3권 */}
              {[0.08, 0.13, 0.18].map((hy, hi) => (
                <RoundedBox
                  key={`hb_${hi}`}
                  args={[0.22, 0.042, 0.20]}
                  position={[0.18, hy, 0]}
                  rotation={[0, hi * 0.08, 0]}
                  radius={0.005}
                >
                  <meshStandardMaterial color={['#E5E7EB', '#D6D3D1', '#78350F'][hi]} />
                </RoundedBox>
              ))}

              {/* 2단: 신학 서적 & 세라믹 화병 오브제 */}
              {Array.from({ length: 6 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b2_${bIdx}`}
                  args={[0.062, 0.30 + (bIdx % 2) * 0.03, 0.22]}
                  position={[-0.24 + bIdx * 0.072, 0.66, 0]}
                  rotation={[0, 0, bIdx === 5 ? 0.15 : 0]}
                  radius={0.006}
                  castShadow
                >
                  <meshStandardMaterial
                    color={['#D6D3D1', '#78350F', '#292524', '#A8A29E', '#451A03', '#E7E5E4'][bIdx]}
                  />
                </RoundedBox>
              ))}
              <mesh position={[0.22, 0.58, 0.02]} castShadow>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color="#E7E5E4" roughness={0.25} />
              </mesh>

              {/* 3단: 레퍼런스 사진(image_2b2b7f.png) 속 화이트 매트 사진 액자 갤러리 & 고서 */}
              {cIdx === 1 || cIdx === 2 ? (
                <group position={[0, 1.12, 0.02]}>
                  <RoundedBox args={[0.26, 0.24, 0.025]} position={[-0.12, 0, 0]} rotation={[-0.14, 0.08, 0]} radius={0.008}>
                    <meshStandardMaterial color="#F8FAFC" />
                  </RoundedBox>
                  <mesh position={[-0.12, 0, 0.015]} rotation={[-0.14, 0.08, 0]}>
                    <planeGeometry args={[0.16, 0.14]} />
                    <meshBasicMaterial color="#475569" />
                  </mesh>
                  <RoundedBox args={[0.20, 0.22, 0.025]} position={[0.15, -0.01, 0.02]} rotation={[-0.14, -0.1, 0]} radius={0.008}>
                    <meshStandardMaterial color="#F8FAFC" />
                  </RoundedBox>
                </group>
              ) : (
                Array.from({ length: 6 }).map((_, bIdx) => (
                  <RoundedBox
                    key={`b3_${bIdx}`}
                    args={[0.065, 0.30, 0.22]}
                    position={[-0.22 + bIdx * 0.075, 1.12, 0]}
                    radius={0.006}
                  >
                    <meshStandardMaterial color={['#57534E', '#78350F', '#D6D3D1', '#1C1917', '#A8A29E', '#44403C'][bIdx]} />
                  </RoundedBox>
                ))
              )}

              {/* 4단: 상단 아트북 & 오브제 */}
              {Array.from({ length: 5 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b4_${bIdx}`}
                  args={[0.07, 0.28, 0.22]}
                  position={[-0.22 + bIdx * 0.08, 1.56, 0]}
                  radius={0.006}
                >
                  <meshStandardMaterial color={['#E7E5E4', '#451A03', '#292524', '#D6D3D1', '#78350F'][bIdx]} />
                </RoundedBox>
              ))}
            </group>
          ))}
        </group>

        {/* 동쪽 벽면: 입체 골드 십자가 */}
        <group position={[1.76, 1.52, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.055, 0.46, 0.03]} />
            <meshStandardMaterial color="#D97706" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.055, 0.03]} />
            <meshStandardMaterial color="#D97706" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* 🖥️ 2) 담임목사님 다크 월넛 집무 데스크 + 슬림 알루미늄 iMac 모니터 + 관절 스탠드 램프 + 만년필 데스크 매트 */}
        <group position={[0.55, 0, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          {/* 월넛 데스크 본체 & 상판 */}
          <RoundedBox args={[1.46, 0.70, 0.68]} position={[0, 0.35, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.28} />
          </RoundedBox>
          <RoundedBox args={[1.56, 0.065, 0.76]} position={[0, 0.73, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.22} />
          </RoundedBox>

          {/* 블랙 가죽 데스크 매트 & 무선 키보드/마우스 & 펼쳐진 성경 */}
          <RoundedBox args={[0.68, 0.012, 0.42]} position={[0, 0.77, -0.08]} radius={0.005}>
            <meshStandardMaterial color="#18181B" roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.28, 0.015, 0.10]} position={[0, 0.78, -0.06]} radius={0.005}>
            <meshStandardMaterial color="#E2E8F0" metalness={0.6} />
          </RoundedBox>

          {/* 🌟 기존 갈색 판자 모니터를 대체하는 초슬림 알루미늄 iMac 모니터 (화면이 동쪽 +Z의 목사님을 정확히 향함!) */}
          <group position={[0, 0.77, 0.14]}>
            {/* L자형 알루미늄 스탠드 베이스 & 넥 */}
            <RoundedBox args={[0.18, 0.01, 0.14]} position={[0, 0.005, 0]} radius={0.004}>
              <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
            </RoundedBox>
            <RoundedBox args={[0.08, 0.18, 0.015]} position={[0, 0.09, 0.03]} rotation={[0.18, 0, 0]} radius={0.004}>
              <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
            </RoundedBox>
            {/* 슬림 실버 알루미늄 베젤 & 블랙 스크린 */}
            <RoundedBox args={[0.62, 0.38, 0.022]} position={[0, 0.28, 0.01]} radius={0.015} castShadow>
              <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
            </RoundedBox>
            {/* 목사님이 바라보는 정면(-Z 방향) 고해상도 디스플레이 화면 */}
            <mesh position={[0, 0.29, -0.003]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.58, 0.33]} />
              <meshBasicMaterial map={imacScreenTex} />
            </mesh>
          </group>

          {/* 좌측 관절형 건축가 스탠드 램프 & 우측 양장 서적 더미 */}
          <group position={[-0.54, 0.77, 0.12]}>
            <mesh position={[0, 0.015, 0]}>
              <cylinderGeometry args={[0.07, 0.08, 0.03, 16]} />
              <meshStandardMaterial color="#27272A" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.18, 0]} rotation={[0, 0, -0.2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.34, 10]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.85} />
            </mesh>
            <mesh position={[0.08, 0.32, 0]} rotation={[0, 0, 0.4]} castShadow>
              <coneGeometry args={[0.09, 0.14, 20]} />
              <meshStandardMaterial color="#18181B" metalness={0.5} />
            </mesh>
          </group>

          {[0.02, 0.06, 0.10].map((by, bi) => (
            <RoundedBox
              key={`stack_b_${bi}`}
              args={[0.22, 0.035, 0.18]}
              position={[0.52, 0.77 + by, 0.10]}
              rotation={[0, bi * 0.1, 0]}
              radius={0.005}
              castShadow
            >
              <meshStandardMaterial color={['#451A03', '#1E293B', '#D6D3D1'][bi]} />
            </RoundedBox>
          ))}
        </group>

        {/* 💺 3) [핵심 해결: 의자 방향 180도 완벽 교정!]
            - 등받이가 동쪽(+X, 목사님 등 뒤)에 위치하고, 좌판과 팔걸이가 서쪽(-X, 책상 쪽)을 향하도록 `rotation={[0, -Math.PI / 2, 0]}` 적용!
            - 레퍼런스 사진(image_2b2b7f.png) 속 임스 알루미늄 그룹 스타일의 가로 리브드 가죽 중역 의자 디자인! */}
        <group position={[1.20, 0, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          {/* 푹신한 블랙 가죽 시트 쿠션 */}
          <RoundedBox args={[0.52, 0.08, 0.50]} position={[0, 0.35, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.3} />
          </RoundedBox>
          {/* 목사님 등 뒤(-Z 로컬 = +X 월드 동쪽 벽 방향)를 든든히 받쳐주는 가로 스트라이프 가죽 등받이 */}
          <RoundedBox args={[0.50, 0.68, 0.07]} position={[0, 0.70, -0.22]} rotation={[-0.10, 0, 0]} radius={0.035} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.28} />
          </RoundedBox>
          {/* 레퍼런스 사진 속 가로 5줄 가죽 리브(Ribbed) 쿠션 디테일 */}
          {[0.46, 0.58, 0.70, 0.82, 0.94].map((ry, ri) => (
            <RoundedBox
              key={`rib_${ri}`}
              args={[0.44, 0.08, 0.03]}
              position={[0, ry, -0.18]}
              rotation={[-0.10, 0, 0]}
              radius={0.015}
            >
              <meshStandardMaterial color="#27272A" roughness={0.32} />
            </RoundedBox>
          ))}
          {/* 크롬 알루미늄 곡선 팔걸이 */}
          {[-0.26, 0.26].map((ax, ai) => (
            <group key={ai} position={[ax, 0.48, 0.02]}>
              <RoundedBox args={[0.04, 0.035, 0.36]} position={[0, 0.06, 0]} radius={0.015} castShadow>
                <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.035, 0.16, 0.035]} position={[0, -0.02, 0.14]} radius={0.01}>
                <meshStandardMaterial color="#CBD5E1" metalness={0.85} />
              </RoundedBox>
            </group>
          ))}
          {/* 중심 유압 실린더 기둥 & 5발 크롬 스타 베이스 */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.32, 12]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.25, 0.27, 0.035, 16]} />
            <meshStandardMaterial color="#18181B" metalness={0.8} />
          </mesh>
        </group>

        {/* 🛋️ 4) 레퍼런스 사진(image_2b2b7f.png) 전경 좌하단의 곡선형 크림 베이지 라운지 암체어 & 오토만 스툴 세트! */}
        <group position={[-0.55, 0, 0.42]}>
          {/* 볼륨감 있는 크림 베이지 라운지 암체어 (클릭 시 착석 가능!) */}
          <group
            position={[-0.35, 0, 0.10]}
            rotation={[0, 0.45, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSitOnSeat({ x: 4.75 - 0.90, z: -0.18 + 0.52, rotY: 0.45, rowLabel: '2F 목양실 라운지 암체어' });
            }}
          >
            <RoundedBox args={[0.72, 0.24, 0.68]} position={[0, 0.22, 0]} radius={0.08} castShadow receiveShadow>
              <meshStandardMaterial color="#F5F5F4" roughness={0.45} />
            </RoundedBox>
            <RoundedBox args={[0.68, 0.48, 0.18]} position={[0, 0.52, -0.24]} rotation={[-0.18, 0, 0]} radius={0.08} castShadow>
              <meshStandardMaterial color="#F5F5F4" roughness={0.45} />
            </RoundedBox>
            {[-0.32, 0.32].map((ax, ai) => (
              <RoundedBox key={ai} args={[0.14, 0.28, 0.64]} position={[ax, 0.38, 0.02]} radius={0.06} castShadow>
                <meshStandardMaterial color="#E7E5E4" roughness={0.48} />
              </RoundedBox>
            ))}
          </group>

          {/* 짝을 이루는 푹신한 크림색 오토만(Ottoman) 풋스툴 */}
          <RoundedBox
            args={[0.58, 0.26, 0.46]}
            position={[0.38, 0.16, 0.18]}
            rotation={[0, -0.2, 0]}
            radius={0.08}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onSitOnSeat({ x: 4.75 - 0.17, z: -0.18 + 0.60, rotY: Math.PI / 2, rowLabel: '2F 목양실 오토만 스툴석' });
            }}
          >
            <meshStandardMaterial color="#F5F5F4" roughness={0.45} />
          </RoundedBox>

          {/* 목사님 데스크 앞 성도 1:1 상담 의자 */}
          <DetailedCafeChair
            position={[0.42, 0, -0.76]}
            rotationY={Math.PI / 2}
            seatColor="#D6D3D1"
            onClick={(e) => {
              e.stopPropagation();
              onSitOnSeat({ x: 4.75 - 0.13, z: -0.18 - 0.34, rotY: Math.PI / 2, rowLabel: '2F 목양실 1:1 기도·상담석' });
            }}
          />
        </group>

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
      {/* 🚹 [구역 4: 우측 중단 `화장실(남)`] */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 1.98]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.2]} />
          <meshStandardMaterial map={tileTex} roughness={0.28} />
        </mesh>

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

        <DetailedUrinal2F position={[0.35, 0, -0.88]} rotationY={0} />
        <RoundedBox args={[0.04, 0.75, 0.32]} position={[0.65, 0.55, -0.82]} radius={0.01}>
          <meshStandardMaterial color="#CBD5E1" />
        </RoundedBox>
        <DetailedUrinal2F position={[0.95, 0, -0.88]} rotationY={0} />

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
      {/* 🚺 [구역 5: 우측 하단 `화장실(여)`] */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 4.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.6]} />
          <meshStandardMaterial map={tileTex} roughness={0.28} />
        </mesh>

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
      {/* 🪜 [구역 6: 좌측 하단 `계단`] */}
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
      {/* 🛗 [구역 7: 하단 중앙 스테인리스 자동 개폐 `엘리베이터` 홀] */}
      {/* ================================================================= */}
      <AnimatedStainlessElevator2F
        position={[-0.2, 0, 5.25]}
        playerIdxRef={playerIdxRef}
        forceOpen={isElevatorModalOpen}
        onClickElevator={() => onSelectZone(ZONES_2F[0])}
        signTex={signs.elevator}
        showRoomSigns={showRoomSigns}
      />

      {/* ================================================================= */}
      {/* 🧱 내벽 및 외벽 구조물 */}
      {/* ================================================================= */}
      <RoundedBox args={[0.16, 1.22, 1.5]} position={[-3.0, 0.61, -0.4]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.1]} position={[-3.0, 0.61, 2.05]} radius={0.01} castShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.22, 0.16]} position={[-4.85, 0.61, 2.6]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

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

      {/* 2층 NPC 렌더링 */}
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

    ctx.fillStyle = '#D97706';
    ctx.fillRect(6, 6, w - 12, 32);

    ctx.fillStyle = '#2563EB';
    ctx.fillRect(6, 42, 30, 24);
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 68, 30, 20);

    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(76, 40, 32, 15);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(76, 57, 32, 15);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(76, 74, 32, 16);

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
      {/* 1. 좌측 상단: 슬림 헤더 & 간판/BGM/시점 프리셋 */}
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
            <span style={{ color: '#93C5FD' }}>🎥 전체시점</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(3.2, 3.2, 2.2);
              controlsRef.current.target.set(5.0, 0.9, -0.35);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FDE047' }}>✝️ 목양실 클로즈업</span>
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
              { icon: '☕', label: seatedInfo ? '일어나기' : '북카페착석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnSeat({ x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 파스텔 라운지석' }); } },
              { icon: '🚪', label: '유리문·카페바', onClick: () => handleWalkTo(-2.6, -2.8) },
              { icon: '✝️', label: '목양실', onClick: () => handleWalkTo(4.2, -0.2) },
              { icon: '💻', label: '사무실', onClick: () => handleWalkTo(-4.4, 1.0) },
              { icon: '🛗', label: '엘리베이터', onClick: () => { handleWalkTo(-0.2, 4.3); setModalZone(ZONES_2F[0]); } }
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
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
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
          minDistance={2.5}
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
                    rowLabel: '2F 북카페 파스텔 라운지석'
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
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 스테인리스 자동문이 열렸습니다. 이동하실 층을 선택하세요:</span>
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
                    <span>탑승 이동 ➔</span>
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
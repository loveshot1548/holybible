// src/metaverse/CafeOffice2F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

// =====================================================================
// 👑 축도 권한 목사님 판별 & 기본 아바타 설정
// =====================================================================
const BLESSING_PASTORS = ['이성현', '방희곤', '최수경'];

const isAuthorizedPastor = (name = '', office = '') => {
  const clean = String(name).trim();
  if (BLESSING_PASTORS.some((p) => clean.includes(p))) return true;
  if (String(office).includes('목사')) return true;
  return false;
};

const DEFAULT_AVATAR_CONFIG = {
  gender: 'male',
  hairStyle: 'parted',
  isSkirt: false,
  shirtColor: '#FACC15',
  pantsColor: '#0284C7',
  hairColor: '#27272A',
  hasSunglasses: false
};

// =====================================================================
// 🎵 2층 사운드 신시사이저 (북카페 BGM · 엘리베이터 벨 · 축도 오르간 · 사무실 다다닥 타이핑음)
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

const playHolyBlessingSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [349.23, 440.0, 523.25, 659.25, 698.46, 880.0, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.06, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 1.8);
    });
  } catch (_) {}
};

const playKeyboardClackSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(850 + (i % 3) * 220, now + i * 0.055);
      gain.gain.setValueAtTime(0.025, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.035);
    }
  } catch (_) {}
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기
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

function makeBrushedSteelTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.3, '#F8FAFC');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(0.75, '#E2E8F0');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
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
    ctx.fillStyle = '#33363B';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#27292D';
    ctx.lineWidth = 3;
    const step = w / 6;
    for (let r = 0; r <= 6; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * step);
      ctx.lineTo(w, r * step);
      ctx.stroke();
      for (let c = 0; c <= 6; c++) {
        ctx.beginPath();
        ctx.moveTo(c * step, r * step);
        ctx.lineTo(c * step, (r + 1) * step);
        ctx.stroke();
      }
    }
  }, 512, 512);
}

function makeTileGridTexture(bgHex = '#9499A1', lineHex = '#7A7F87', gridCount = 8) {
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
    name: '좌측 중단 교역자·행정 사무실 (2x2 마주보기 데스크)',
    prompt: '03 교회 행정 사무실 들어가기',
    pos: [-2.2, 0, 1.0],
    roomTarget: [-4.4, 1.0],
    isOfficeZone: true,
    badge: '03 행정 사무실',
    title: '💻 좌측 중단 좋은나무교회 행정·교역자 사무실',
    desc: '마주 보는 4인용 아일랜드 파티션 데스크와 냉온수기, 우드 4단 서랍장, 벽면 선반이 갖춰진 사역 지원실입니다.'
  },
  {
    id: 'zone_2f_glass_door',
    code: '04',
    subCode: '유리문',
    name: '중앙 카페 입구 양개 자동 강화유리문',
    prompt: '04 유리문 통과해 카페 들어가기',
    pos: [-0.2, 0, -0.6],
    roomTarget: [-0.2, -2.2],
    badge: '04 카페 유리문',
    title: '🚪 북카페 라운지 중앙 양개 강화유리문',
    desc: '다가가면 양쪽 강화유리문이 자동으로 열리며 모던 바리스타 카운터와 향긋한 커피 향이 가득한 북카페가 펼쳐집니다.'
  },
  {
    id: 'zone_2f_cafe_bar',
    code: '05',
    subCode: '카페바',
    name: '상단 북카페 스틸&화이트 에스프레소 바 & 베이커리 쇼케이스',
    prompt: '05 바리스타 커피·베이커리 주문하기',
    pos: [-2.6, 0, -2.8],
    badge: '05 북카페 바리스타바',
    title: '☕ 좋은나무 스페셜티 북카페 & 바리스타 카운터',
    desc: '스테인리스 스틸 상판의 화이트 L자 카운터, 2단 유리 베이커리 진열장, 터치 POS, 옐로우 머쉬룸 램프, 블랙 2그룹 에스프레소 머신과 3구 블랙 펜던트 조명이 갖춰진 바리스타 존입니다.'
  },
  {
    id: 'zone_2f_cafe_table',
    code: '06',
    subCode: '카페좌석',
    name: '상단 카페 원목 피크닉석 & 파스텔 테이블석',
    prompt: '06 카페 의자에 앉아 커피 마시며 교제하기',
    pos: [1.6, 0, -2.8],
    seatTarget: { x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 파스텔 라운지석', withCoffee: true },
    isSeatZone: true,
    badge: '06 북카페 테이블석',
    title: '🪑 자작나무 빛트리 & 북카페 멀티 라운지 테이블',
    desc: '원하는 의자를 클릭해 착석하면 손에 커피잔을 들고 성도님들과 다정하게 티타임 교제를 나눕니다.'
  },
  {
    id: 'zone_2f_pastor_room',
    code: '07',
    subCode: '목양실',
    name: '우측 상단 담임목사님 목양실 (축도 & 1:1 면담)',
    prompt: '07 담임목사님 축도 받기 & 1:1 면담 신청',
    pos: [2.0, 0, -0.2],
    roomTarget: [4.2, -0.2],
    isPastorRoomZone: true,
    badge: '07 담임목사 목양실',
    title: '✝️ 우측 상단 이성현 담임목사님 목양실 (축도 & 1:1 면담)',
    desc: '은은한 라인 간접조명이 빛나는 4단 월넛 빌트인 서재와 중역 데스크, iMac이 갖춰진 목양실입니다. 축도를 받거나 어드민 상담실과 연동되는 1:1 면담을 신청할 수 있습니다.'
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
    desc: '남자화장실에는 칸막이 가림막이 설치된 4연속 센서 소변기와 옐로우 세면대가, 여자화장실에는 3연속 큐비클 부스와 벽걸이 핸드드라이어가 정교하게 갖춰져 있습니다.'
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
// 👥 2층 NPC 데이터 (바리스타 블랙 셔츠 고증 + 2x2 마주보는 사무실 교역자 배치)
// =====================================================================
const NPCS_2F = [
  {
    id: 'barista_2f',
    name: '김집사 (바리스타)',
    role: '2층 좋은나무 카페 매니저',
    isBarista: true,
    x: -4.35,
    y: 0,
    z: -4.52,
    rotY: 0,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: false,
    autoWave: true,
    shirt: '#18181B', // image_94d3a1.jpg 속 블랙 바리스타 유니폼 고증
    pants: '#27272A',
    hair: '#1C1917',
    dialogues: [
      '할렐루야! 새로 단장한 스틸&화이트 에스프레소 바와 베이커리 쇼케이스에 오신 걸 환영해요 ☕',
      '저를 클릭해 커피를 주문하시면 손에 따뜻한 커피잔을 들고 마실 수 있어요 🥰',
      '갓 구운 스콘과 에스프레소 크레마 향이 카페 가득 퍼지고 있네요!'
    ]
  },
  {
    id: 'pastor_office_2f',
    name: '이성현 담임목사님 (목양실)',
    role: '담임목사 서재 · 축도 및 1:1 신앙 면담',
    isPastor: true,
    canBless: true,
    canCounsel: true,
    x: 5.88,
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
      '사랑하는 성도님 반갑습니다! 목양실 서재에 찾아와 주셔서 참 기쁩니다 ✝️',
      '저를 클릭하시면 [✨ 거룩한 축도(홀리라이트) 받기]와 [📝 1:1 신앙 면담 신청]을 하실 수 있습니다 🙏',
      '면담을 신청하시면 어드민 콘솔의 신앙 상담실로 즉시 연결됩니다!'
    ]
  },
  {
    id: 'admin_staff_2f',
    name: '이간사 (행정사무실)',
    role: '교회 행정·재정·주보 담당 (초고속 타이핑 중)',
    isOfficeStaff: true,
    isTyping: true,
    x: -5.20,
    y: 0,
    z: 0.12, // 2x2 마주보기 책상 북쪽 좌석 (남쪽을 바라봄)
    rotY: 0,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#0284C7',
    pants: '#E0F2FE',
    hair: '#27272A',
    dialogues: [
      '(타다다닥! 💻) 마주 보는 파티션 책상에서 이번 주일 주보와 목장 통계를 입력하고 있어요!',
      '(다다다닥! ⌨️) 창가 쪽 시원한 생수기에서 물 한잔 드시고 편하게 행정 문의 주세요 😊'
    ]
  },
  {
    id: 'office_pastor_2f',
    name: '박전도사 (교역자실)',
    role: '교육·청년부 담당교역자 (설교·찬양 콘티 타이핑 중)',
    isOfficeStaff: true,
    isTyping: true,
    x: -4.40,
    y: 0,
    z: 1.58, // 2x2 마주보기 책상 남쪽 우측 좌석 (북쪽을 바라봄)
    rotY: Math.PI,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#4F46E5',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '(타다다닥! 💻) 이간사님과 마주 앉아 주일 예배 찬양 악보와 청년부 설교 원고를 작성 중입니다!',
      '(다다다닥! ⌨️) 옆 빈자리 의자를 클릭하시면 성도님도 함께 행정 업무를 도우실 수 있어요 🔥'
    ]
  },
  {
    id: 'member_cafe_1',
    name: '박권사 (카페교제)',
    role: '여전도회 성도 · 커피 티타임',
    hasCoffee: true,
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
      '호로록~ ☕ 새로 들어온 유리 쇼케이스 디저트랑 아메리카노가 정말 일품이네요 🥰',
      '성도님도 옆자리에 앉으셔서 저희랑 같이 커피 마시며 말씀 나눔 해요!'
    ]
  },
  {
    id: 'member_cafe_2',
    name: '정안수집사 (카페교제)',
    role: '남선교회 성도 · 커피 티타임',
    hasCoffee: true,
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
      '카운터 위 노란 버섯 조명이랑 블랙 펜던트 등이 진짜 성수동 카페처럼 세련됐어요 ☕📚',
      '목양실에 계신 담임목사님께 1:1 면담 신청하고 축도도 받고 왔더니 마음이 든든합니다!'
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
      '왼쪽 사무실은 마주 보는 4인 데스크로 바뀌고, 화장실도 칸막이 부스까지 진짜 리얼해요! ✨',
      '엘리베이터와 카페 유리문이 자동으로 스르륵 열려서 이동하기 너무 편해요.'
    ]
  }
];

// =====================================================================
// ✨ 축도(Benediction) 시 하늘에서 내려쬐는 홀리라이트(Holy Light) 이펙트
// =====================================================================
function HolyLightBeamEffect2F({ targetPos, pastorName, targetName }) {
  const beamRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particlesRef = useRef();

  const blessingBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(120, 53, 15, 0.94)');
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.98)');
      grad.addColorStop(1, 'rgba(120, 53, 15, 0.94)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(10, 10, w - 20, h - 20, 32);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#FEF08A';
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✝️ ${pastorName || '이성현 담임목사님'}의 목양실 축도`, w / 2, 46);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px serif';
      ctx.fillText(`${targetName} 성도님에게 하나님의 은혜와 평강이`, w / 2, 88);
      ctx.fillText(`영원토록 함께 있을지어다! 아멘 🙏`, w / 2, 126);
    }, 620, 156);
  }, [pastorName, targetName]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      beamRef.current.scale.set(pulse, 1, pulse);
      beamRef.current.material.opacity = 0.36 + Math.sin(t * 4) * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 1.8;
      const s = 1 + Math.sin(t * 3) * 0.12;
      ring1Ref.current.scale.set(s, s, 1);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 2.2;
      ring2Ref.current.position.y = 0.5 + ((t * 0.8) % 2.2);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 1.2;
      particlesRef.current.position.y = (t * 0.9) % 2.0;
    }
  });

  if (!targetPos) return null;

  return (
    <group position={[targetPos[0], 0.05, targetPos[2]]}>
      <mesh ref={beamRef} position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.88, 0.62, 5.6, 32, 1, true]} />
        <meshBasicMaterial
          color="#FDE047"
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.35, 0.25, 5.6, 24, 1, true]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.50, 0.72, 36]} />
        <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <ringGeometry args={[0.42, 0.50, 32]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      <group ref={particlesRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          const rad = 0.34 + (i % 3) * 0.12;
          const py = (i / 12) * 2.0;
          return (
            <mesh key={i} position={[Math.cos(ang) * rad, py, Math.sin(ang) * rad]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} />
            </mesh>
          );
        })}
      </group>

      <pointLight position={[0, 2.4, 0]} intensity={5.2} distance={6.0} color="#FDE047" />

      <Billboard position={[0, 2.25, 0]}>
        <mesh renderOrder={30}>
          <planeGeometry args={[2.4, 0.62]} />
          <meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

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
// 🚶‍♀️ 둥근 유선형 아바타
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
  targetPosition = null,
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isTyping = false,
  hasCoffee = false,
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
  const holdingCoffeeNow = hasCoffee || emote === 'coffee';
  const typingNow = isTyping || emote === 'typing';

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

    if (targetPosition && outerGroupRef.current) {
      const curX = outerGroupRef.current.position.x;
      const curZ = outerGroupRef.current.position.z;
      const dx = targetPosition[0] - curX;
      const dz = targetPosition[2] - curZ;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.03) {
        walkingNow = true;
        outerGroupRef.current.position.x = THREE.MathUtils.lerp(curX, targetPosition[0], delta * 7.5);
        outerGroupRef.current.position.z = THREE.MathUtils.lerp(curZ, targetPosition[2], delta * 7.5);
      }
      outerGroupRef.current.rotation.y = THREE.MathUtils.lerp(outerGroupRef.current.rotation.y, rotationY, delta * 8.0);
    } else if (patrolZ && outerGroupRef.current) {
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
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 14.0) * 0.65;
        leftLegRef.current.rotation.x = kick;
        rightLegRef.current.rotation.x = -kick;
        leftLegRef.current.position.set(-0.085, 0.22, 0);
        rightLegRef.current.position.set(0.085, 0.22, 0);
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
      if (emote === 'bless') {
        leftArmRef.current.rotation.x = -2.1;
        rightArmRef.current.rotation.x = -2.1;
        leftArmRef.current.rotation.z = 0.35;
        rightArmRef.current.rotation.z = -0.35;
      } else if (typingNow) {
        leftArmRef.current.rotation.x = -0.95 + Math.sin(t * 28.0) * 0.22;
        rightArmRef.current.rotation.x = -0.95 + Math.cos(t * 28.0) * 0.22;
        leftArmRef.current.rotation.z = 0.16;
        rightArmRef.current.rotation.z = -0.16;
      } else if (holdingCoffeeNow) {
        const sipWave = Math.max(0, Math.sin(t * 1.8));
        rightArmRef.current.rotation.x = -1.15 - sipWave * 0.45;
        rightArmRef.current.rotation.z = -0.25;
        leftArmRef.current.rotation.x = isSeated ? -0.42 : Math.sin(t * 2) * 0.06;
        leftArmRef.current.rotation.z = 0.12;
      } else if (emote === 'pray') {
        leftArmRef.current.rotation.x = -1.15;
        rightArmRef.current.rotation.x = -1.15;
        leftArmRef.current.rotation.z = -0.42;
        rightArmRef.current.rotation.z = 0.42;
      } else if (emote === 'dance') {
        leftArmRef.current.rotation.z = 2.4 + Math.sin(t * 12) * 0.45;
        rightArmRef.current.rotation.z = -2.4 + Math.cos(t * 12) * 0.45;
        leftArmRef.current.rotation.x = Math.sin(t * 6) * 0.3;
        rightArmRef.current.rotation.x = -Math.sin(t * 6) * 0.3;
      } else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
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
      if (typingNow) {
        headGroupRef.current.rotation.y = Math.sin(t * 6.5) * 0.16;
        headGroupRef.current.rotation.x = 0.12 + Math.abs(Math.sin(t * 12)) * 0.05;
      } else {
        headGroupRef.current.rotation.x = Math.sin(t * 2.6) * 0.05;
        headGroupRef.current.rotation.y = Math.cos(t * 1.4) * 0.07;
      }
    }

    if (rootRef.current) {
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.16 : 0;
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce + jump;
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

          {holdingCoffeeNow && (
            <group position={[0, -0.24, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.042, 0.034, 0.095, 14]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.044, 0.038, 0.045, 14]} />
                <meshStandardMaterial color="#B45309" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.038, 12]} />
                <meshBasicMaterial color="#451A03" />
              </mesh>
            </group>
          )}
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
              <planeGeometry args={[1.52, 0.34]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}

        {bubbleData && (
          <Billboard position={[0, 1.56, 0]}>
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

function RemoteMultiplayerAvatar2F({ peer, onClickPeer }) {
  const nameTagTex = useMemo(() => {
    const isPastor = isAuthorizedPastor(peer.name, peer.office);
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = isPastor ? 'rgba(88, 28, 135, 0.96)' : 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 48);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = isPastor ? '#FACC15' : '#34D399';
      ctx.stroke();

      ctx.fillStyle = isPastor ? '#FACC15' : '#34D399';
      ctx.beginPath();
      ctx.arc(48, h / 2, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${isPastor ? '✝️ ' : ''}${peer.name || '성도'}`, w / 2 + 16, h / 2 + 2);
    }, 520, 110);
  }, [peer.name, peer.office]);

  return (
    <SmoothChibiAvatar2F
      position={[peer.x || -0.2, 0, peer.z || 2.2]}
      targetPosition={[peer.x || -0.2, 0, peer.z || 2.2]}
      rotationY={peer.rotY || 0}
      gender={peer.avatar?.gender || 'male'}
      hairStyle={peer.avatar?.hairStyle || 'short'}
      isSkirt={Boolean(peer.avatar?.isSkirt)}
      hasSunglasses={Boolean(peer.avatar?.hasSunglasses)}
      isSeated={Boolean(peer.seated)}
      emote={peer.emote || null}
      shirtColor={peer.avatar?.shirtColor || '#38BDF8'}
      pantsColor={peer.avatar?.pantsColor || '#1E293B'}
      hairColor={peer.avatar?.hairColor || '#27272A'}
      nameTagTexture={nameTagTex}
      speechBubbleText={peer.chatMsg ? `${peer.name}: ${peer.chatMsg}` : null}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickPeer) onClickPeer(peer);
      }}
    />
  );
}

// =====================================================================
// 🪑 가구 · 빛트리 · 자동 개폐 유리문 · 스테인리스 엘리베이터 · 화장실 컴포넌트
// =====================================================================
function DetailedCafeChair({ position, rotationY = 0, seatColor = '#F472B6', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.20, 0.055, 24]} />
        <meshStandardMaterial color={seatColor} roughness={0.35} />
      </mesh>
      <RoundedBox args={[0.38, 0.24, 0.05]} position={[0, 0.56, 0.17]} rotation={[0.14, 0, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.35} />
      </RoundedBox>
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]} castShadow>
          <cylinderGeometry args={[0.014, 0.012, 0.34, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// 화이트 & 블랙 팔걸이 오피스 회전의자 (image_94c7a4.png 감성 반영)
function ErgonomicMeshOfficeChair({ position, rotationY = 0, chairColor = '#F8FAFC', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <RoundedBox args={[0.42, 0.06, 0.42]} position={[0, 0.35, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.40, 0.48, 0.045]} position={[0, 0.62, 0.18]} rotation={[0.10, 0, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color={chairColor} roughness={0.35} />
      </RoundedBox>
      {[-0.22, 0.22].map((ax, ai) => (
        <group key={ai} position={[ax, 0.46, 0.02]}>
          <RoundedBox args={[0.04, 0.03, 0.24]} position={[0, 0.05, 0]} radius={0.01}>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          <mesh position={[0, -0.02, 0.06]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.32, 12]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4].map((bi) => {
        const ang = (bi * Math.PI * 2) / 5;
        return (
          <group key={bi} rotation={[0, ang, 0]}>
            <RoundedBox args={[0.025, 0.02, 0.22]} position={[0, 0.03, 0.10]} radius={0.008}>
              <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0.015, 0.20]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial color="#090A0F" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BirchFairyLightTree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.40, 20]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </mesh>
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

function AnimatedCafeGlassDoubleDoor2F({ playerIdxRef, glassTex, onClickDoor }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - -0.2, pz - -1.2);
    const shouldOpen = dist < 2.1;

    const targetLeftRot = shouldOpen ? 0.95 : 0.15;
    const targetRightRot = shouldOpen ? -0.95 : -0.15;

    leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, targetLeftRot, delta * 6.0);
    rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetRightRot, delta * 6.0);
  });

  return (
    <group
      position={[-0.2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickDoor) onClickDoor();
      }}
    >
      <RoundedBox args={[2.45, 0.14, 0.22]} position={[0, 2.34, 0]} radius={0.01}>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>
      {[-1.15, 1.15].map((px, pi) => (
        <RoundedBox key={pi} args={[0.14, 2.4, 0.20]} position={[px, 1.2, 0]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
      ))}

      <group ref={leftDoorRef} position={[-1.08, 1.12, 0]}>
        <RoundedBox args={[0.98, 2.15, 0.05]} position={[0.49, 0, 0]} radius={0.01}>
          <meshBasicMaterial map={glassTex} transparent opacity={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.65, 0.09]} position={[0.88, 0, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} />
        </RoundedBox>
      </group>

      <group ref={rightDoorRef} position={[1.08, 1.12, 0]}>
        <RoundedBox args={[0.98, 2.15, 0.05]} position={[-0.49, 0, 0]} radius={0.01}>
          <meshBasicMaterial map={glassTex} transparent opacity={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.65, 0.09]} position={[-0.88, 0, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} />
        </RoundedBox>
      </group>
    </group>
  );
}

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
    const isOpen = forceOpen || dist < 1.95;

    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      playElevatorDingSound();
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }

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
      <group position={[0, 0, 0.38]}>
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 0.03, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 2.08, 0]} radius={0.01}>
          <meshBasicMaterial color="#FFFBEB" />
        </RoundedBox>
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
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[-0.82, 1.06, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[0.82, 1.06, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <pointLight position={[0, 1.85, 0]} intensity={1.4} distance={3.2} color="#FFFBEB" />
      </group>

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

      <RoundedBox args={[0.28, 2.28, 0.24]} position={[-0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.25]} position={[0, 2.15, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>

      <RoundedBox args={[0.75, 2.28, 0.20]} position={[-1.32, 1.14, 0.02]} radius={0.015} receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[1.32, 1.14, 0.02]} radius={0.015} receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </RoundedBox>

      <RoundedBox args={[0.38, 0.12, 0.04]} position={[0, 2.15, -0.12]} radius={0.01} userData={{ keepOpaque: true }}>
        <meshStandardMaterial color="#090A0F" />
      </RoundedBox>
      <mesh position={[0, 2.15, -0.145]} rotation={[0, Math.PI, 0]} userData={{ keepOpaque: true }}>
        <planeGeometry args={[0.32, 0.08]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>

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

// 🚽 양변기 & 큐비클 부스 & 칸막이 소변기 컴포넌트 (`image_94cb67.png`, `image_94c859.png` 고증)
function DetailedMiniatureToilet2F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.15, 0.05]} castShadow>
        <cylinderGeometry args={[0.15, 0.11, 0.30, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.28, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.10, 20]} />
        <meshBasicMaterial color="#BAE6FD" />
      </mesh>
      <mesh position={[0, 0.31, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.125, 0.03, 14, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </mesh>
      <RoundedBox args={[0.32, 0.34, 0.15]} position={[0, 0.46, -0.14]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </RoundedBox>
    </group>
  );
}

// 남자화장실(`image_94c859.png`) 속 플로어 스탠딩 소변기 + 상단 센서 + 화이트 라운드 칸막이 파티션!
function DetailedPartitionedUrinal2F({ position, rotationY = 0, showRightPartition = true }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 길게 내려오는 플로어 스탠딩 세라믹 소변기 본체 */}
      <RoundedBox args={[0.28, 0.82, 0.20]} position={[0, 0.44, 0]} radius={0.07} castShadow receiveShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </RoundedBox>
      {/* 내부 오목한 수조 표현 */}
      <RoundedBox args={[0.18, 0.56, 0.05]} position={[0, 0.46, 0.09]} radius={0.04}>
        <meshStandardMaterial color="#E2E8F0" roughness={0.2} />
      </RoundedBox>
      {/* 상단 크롬 자동 감지 플러시 센서 */}
      <mesh position={[0, 0.90, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.10, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
      <RoundedBox args={[0.08, 0.06, 0.04]} position={[0, 0.96, -0.04]} radius={0.01}>
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} />
      </RoundedBox>

      {/* 우측 라운드형 화이트 프라이버시 가림막 파티션 (`image_94c859.png` 완벽 고증) */}
      {showRightPartition && (
        <group position={[0.26, 0.56, 0.08]}>
          <RoundedBox args={[0.03, 0.92, 0.38]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </RoundedBox>
          {/* 하단 스틸 지지 다리 */}
          <mesh position={[0, -0.50, 0.12]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// `image_94d3a1.jpg` 우측의 화이트 원통 화분 & 짙은 녹색 관엽식물
function WhiteCylinderPlant2F({ position, scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.15, 0.48, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      {[-0.03, 0.02, 0.04].map((sx, si) => (
        <mesh key={si} position={[sx, 0.62, 0]} rotation={[0, 0, sx * 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.018, 0.55, 8]} />
          <meshStandardMaterial color="#14532D" />
        </mesh>
      ))}
      {[
        [0, 0.88, 0, 0.16],
        [-0.14, 0.76, 0.08, 0.14],
        [0.14, 0.80, -0.06, 0.15],
        [-0.08, 0.64, -0.10, 0.13],
        [0.10, 0.68, 0.12, 0.13]
      ].map(([lx, ly, lz, lr], i) => (
        <mesh key={i} position={[lx, ly, lz]} scale={[1.2, 0.45, 0.8]} rotation={[0.2 * i, i, 0.3]} castShadow>
          <sphereGeometry args={[lr, 12, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#14532D' : '#15803D'} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================================
// 🏛️ 2층 초고도화 마스터피스 디오라마 씬 (5대 구역 레퍼런스 사진 100% 반영!)
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
  isElevatorModalOpen,
  remotePeers,
  onSelectRemotePeer,
  holyLightEvent
}) {
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);
  const walnutTex = useMemo(() => makeWoodGrainTexture('#4A2810', '#2B1506'), []);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const cafeFloorTex = useMemo(() => makeCafeFloorTexture(), []);
  const tileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);
  const greyRestroomTileTex = useMemo(() => makeTileGridTexture('#8E939B', '#6C717A', 8), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);

  const imacScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#312E81');
      grad.addColorStop(0.5, '#9D174D');
      grad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(w * 0.14, h * 0.16, w * 0.72, h * 0.68);
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('주일 대예배 설교 원고 연구', w / 2, h * 0.42);
      ctx.fillStyle = '#64748B';
      ctx.font = '15px sans-serif';
      ctx.fillText('개역개정 4판 · 히브리어/헬라어 강해', w / 2, h * 0.58);
    }, 512, 320);
  }, []);

  const officeCodeScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('=== 2026 좋은나무교회 주보 편집기 ===', 20, 40);
      ctx.fillStyle = '#34D399';
      ctx.fillText('> 1부/2부 예배 순서 동기화 완료...', 20, 80);
      ctx.fillStyle = '#FACC15';
      ctx.fillText('> 목장 보고서 & 심방 일정 집계 중...', 20, 120);
      ctx.fillStyle = '#F472B6';
      ctx.fillText('> 다음세대 교육부서 공지사항 입력...', 20, 160);
    }, 400, 240);
  }, []);

  const signs = useMemo(() => ({
    cafe: makeRoomSignTexture('2F 좋은나무 카페 ☕', '스틸&화이트 바리스타 카운터', '#D97706'),
    glassDoor: makeRoomSignTexture('카페 유리문 🚪', '다가가면 자동 개폐 출입문', '#0284C7'),
    office: makeRoomSignTexture('행정 사무실 💻', '2x2 대면 데스크 · 주보/행정 사역', '#2563EB'),
    pastorRoom: makeRoomSignTexture('담임목사 목양실 ✝️', '축도(홀리라이트) · 1:1 면담실', '#8B5CF6'),
    menWc: makeRoomSignTexture('화장실 (남) 🚹', '칸막이 센서 소변기 4기 · 세면대', '#3B82F6'),
    womenWc: makeRoomSignTexture('화장실 (여) 🚺', '3연속 큐비클 부스 · 핸드드라이어', '#EC4899'),
    stairs: makeRoomSignTexture('2F 계단실 🪜', '1F 로비 · 3F 본당 도보 이동', '#64748B'),
    elevator: makeRoomSignTexture('2F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~6F) 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 2층 전체 베이스 바닥 & 중앙 복도 홀 타일 바닥 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 1.8]} receiveShadow>
        <planeGeometry args={[5.8, 6.2]} />
        <meshStandardMaterial map={tileTex} roughness={0.35} />
      </mesh>

      {/* ================================================================= */}
      {/* ☕ [1번 요청: 북카페 바리스타 구간 정교화 — `image_94d3a1.jpg` 100% 반영!] */}
      {/* - 다크 차콜 바닥 타일 + 매트 화이트 L자 카운터 & 브러시드 스테인리스 상판 */}
      {/* - 2단 유리 베이커리 진열 쇼케이스 + 듀얼 터치 POS + 옐로우 머쉬룸 램프 + 블랙&크롬 에스프레소 머신 */}
      {/* - 뒷벽 상단 간접조명(Cove Light) 화이트 백월 + 천장 블랙 파이프 그리드 & 3구 블랙 반구형 펜던트 조명! */}
      {/* ================================================================= */}
      <group>
        {/* 사진 속 모던 다크 차콜 그레이 카페 바닥 타일 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -3.4]} receiveShadow>
          <planeGeometry args={[13.2, 4.4]} />
          <meshStandardMaterial map={cafeFloorTex} roughness={0.4} />
        </mesh>

        {/* 도면 정중앙 자동 개폐 유리문 & 좌·우 통유리 파티션 가벽 (Z = -1.2) */}
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

          <AnimatedCafeGlassDoubleDoor2F
            playerIdxRef={playerIdxRef}
            glassTex={glassTex}
            onClickDoor={() => onSelectZone(ZONES_2F[3])}
          />

          {showRoomSigns && (
            <Billboard position={[-0.2, 2.15, 0.2]}>
              <mesh>
                <planeGeometry args={[1.15, 0.48]} />
                <meshBasicMaterial map={signs.glassDoor} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 🌟 `image_94d3a1.jpg` 바리스타 카운터 마스터 존 */}
        <group position={[-4.05, 0, -3.85]}>
          {/* 1) 뒷벽 미니멀 화이트 아트월 & 상단 웜화이트 간접조명(Cove Light) 라인 */}
          <group position={[0.1, 0, -1.58]}>
            <RoundedBox args={[4.5, 2.25, 0.12]} position={[0, 1.125, 0]} radius={0.01} receiveShadow>
              <meshStandardMaterial color="#FAF9F5" roughness={0.3} />
            </RoundedBox>
            {/* 상단 간접조명 골드빛 발광 스트립 */}
            <mesh position={[0, 2.27, 0.04]}>
              <boxGeometry args={[4.4, 0.06, 0.04]} />
              <meshBasicMaterial color="#FEF08A" />
            </mesh>
            <pointLight position={[0, 2.35, 0.35]} intensity={2.2} distance={4.5} color="#FDE047" />

            {/* 바리스타 뒤쪽 낮은 스테인리스 백바(Back-Bar) 작업대 & 싱크 */}
            <RoundedBox args={[3.8, 0.82, 0.56]} position={[0, 0.41, 0.34]} radius={0.015} castShadow receiveShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
            </RoundedBox>
            <RoundedBox args={[3.84, 0.04, 0.60]} position={[0, 0.84, 0.34]} radius={0.01}>
              <meshStandardMaterial map={steelTex} metalness={0.85} roughness={0.2} />
            </RoundedBox>
          </group>

          {/* 2) 좌측 통유리 외벽 창문 프레임 (`image_94d3a1.jpg` 좌측 대형 창문 고증) */}
          <group position={[-2.42, 1.35, -0.5]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[2.1, 1.75, 0.08]} radius={0.01}>
              <meshStandardMaterial color="#334155" metalness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[1.96, 1.62]} />
              <meshBasicMaterial map={glassTex} transparent opacity={0.82} />
            </mesh>
          </group>

          {/* 3) 메인 L자형 매트 화이트 바디 + 브러시드 스테인리스 스틸 상판 카운터! */}
          {/* 전면 롱 카운터 */}
          <RoundedBox args={[3.85, 0.88, 0.88]} position={[0, 0.44, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>
          {/* 좌측 L자 꺾임 사이드 카운터 */}
          <RoundedBox args={[0.82, 0.88, 1.35]} position={[-1.52, 0.44, -0.65]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>
          {/* 하단 걸레받이 리세스 몰딩 */}
          <RoundedBox args={[3.78, 0.08, 0.82]} position={[0, 0.04, 0]} radius={0.005}>
            <meshStandardMaterial color="#CBD5E1" />
          </RoundedBox>
          {/* 상단 브러시드 스테인리스 스틸(Silver Metal) 카운터 탑 */}
          <RoundedBox args={[3.92, 0.055, 0.94]} position={[0, 0.90, 0]} radius={0.01} castShadow receiveShadow>
            <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.9} roughness={0.16} />
          </RoundedBox>
          <RoundedBox args={[0.88, 0.055, 1.40]} position={[-1.52, 0.90, -0.65]} radius={0.01} castShadow receiveShadow>
            <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.9} roughness={0.16} />
          </RoundedBox>

          {/* 4) 카운터 좌측: 2단 직사각 투명 강화유리 베이커리·쿠키·케이크 쇼케이스 (`image_94d3a1.jpg` 좌측 진열장) */}
          <group position={[-0.78, 0.93, 0.04]}>
            {/* 실버 프레임 & 유리 케이스 */}
            <RoundedBox args={[1.42, 0.46, 0.56]} position={[0, 0.23, 0]} radius={0.01}>
              <meshStandardMaterial color="#E0F2FE" transparent opacity={0.36} roughness={0.05} metalness={0.2} />
            </RoundedBox>
            {/* 상·중·하 스테인리스 엣지 바 & 유리 선반 */}
            {[0.01, 0.23, 0.45].map((sy, si) => (
              <RoundedBox key={si} args={[1.44, 0.02, 0.58]} position={[0, sy, 0]} radius={0.005}>
                <meshStandardMaterial map={steelTex} metalness={0.92} roughness={0.15} />
              </RoundedBox>
            ))}
            {/* 쇼케이스 안에 진열된 스콘·크루아상·휘낭시에·케이크 트레이 8종 */}
            {[-0.48, -0.16, 0.16, 0.48].map((bx, bi) => (
              <React.Fragment key={bi}>
                {/* 1단 베이커리 */}
                <RoundedBox args={[0.24, 0.02, 0.36]} position={[bx, 0.03, 0]} radius={0.005}>
                  <meshStandardMaterial color="#18181B" />
                </RoundedBox>
                <mesh position={[bx, 0.08, 0.05]} castShadow>
                  <sphereGeometry args={[0.055, 12, 10]} scale={[1.2, 0.7, 1.0]} />
                  <meshStandardMaterial color={['#D97706', '#B45309', '#F59E0B', '#92400E'][bi]} />
                </mesh>
                {/* 2단 베이커리 */}
                <RoundedBox args={[0.24, 0.02, 0.36]} position={[bx, 0.25, 0]} radius={0.005}>
                  <meshStandardMaterial color="#FFFFFF" />
                </RoundedBox>
                <mesh position={[bx, 0.30, -0.04]} castShadow>
                  <cylinderGeometry args={[0.05, 0.05, 0.06, 14]} />
                  <meshStandardMaterial color={['#FDE047', '#F43F5E', '#D97706', '#A16207'][bi]} />
                </mesh>
              </React.Fragment>
            ))}
          </group>

          {/* 5) 카운터 중앙: 화이트 스탠드 듀얼 터치스크린 POS 단말기 & 블랙 금전함 */}
          <group position={[0.28, 0.93, 0.12]}>
            <RoundedBox args={[0.38, 0.08, 0.34]} position={[0, 0.04, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[0, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.08, 0.18, 16]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* 고객향 & 바리스타향 듀얼 터치 모니터 */}
            <RoundedBox args={[0.28, 0.22, 0.025]} position={[0, 0.28, 0.04]} rotation={[-0.25, 0, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
            <mesh position={[0, 0.28, 0.055]} rotation={[-0.25, 0, 0]}>
              <planeGeometry args={[0.24, 0.18]} />
              <meshBasicMaterial color="#38BDF8" />
            </mesh>
          </group>

          {/* 6) 카운터 우측 포인트: 머스타드 옐로우 버섯 모양 테이블 램프 (`image_94d3a1.jpg` 노란 램프 완벽 고증!) */}
          <group position={[0.78, 0.93, 0.10]}>
            <mesh position={[0, 0.14, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.055, 0.28, 16]} />
              <meshStandardMaterial color="#EAB308" roughness={0.2} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.26, 0]} castShadow>
              <sphereGeometry args={[0.13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
              <meshStandardMaterial color="#FACC15" emissive="#CA8A04" emissiveIntensity={0.4} roughness={0.2} />
            </mesh>
            <pointLight position={[0, 0.22, 0]} intensity={0.9} distance={2.0} color="#FEF08A" />
          </group>

          {/* 7) 카운터 우측 끝: 하이엔드 블랙 & 크롬 2그룹 에스프레소 머신 (측면 방향 배치 고증) */}
          <group position={[1.38, 0.93, -0.05]} rotation={[0, Math.PI / 2, 0]}>
            {/* 곡선형 매트 블랙 바디 */}
            <RoundedBox args={[0.68, 0.46, 0.52]} position={[0, 0.23, 0]} radius={0.08} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.22} metalness={0.4} />
            </RoundedBox>
            {/* 전면 크롬 브루잉 그룹헤드 & 스팀 완드 & 드립 트레이 */}
            <RoundedBox args={[0.58, 0.24, 0.16]} position={[0, 0.22, -0.22]} radius={0.02}>
              <meshStandardMaterial map={steelTex} color="#FFFFFF" metalness={0.95} roughness={0.1} />
            </RoundedBox>
            {[-0.14, 0.14].map((gx, gi) => (
              <mesh key={gi} position={[gx, 0.24, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
                <meshStandardMaterial color="#18181B" metalness={0.8} />
              </mesh>
            ))}
          </group>

          {/* 8) 천장 블랙 사각 파이프 그리드 프레임 & 3개의 블랙 반구형 플라워팟 펜던트 조명 (`image_94d3a1.jpg` 상단 조명 100% 고증!) */}
          <group position={[0, 2.38, 0]}>
            {/* 블랙 사각 서스펜션 파이프 그리드 */}
            <RoundedBox args={[4.2, 0.035, 0.035]} position={[0, 0, 0.15]} radius={0.005}>
              <meshStandardMaterial color="#18181B" metalness={0.6} />
            </RoundedBox>
            <RoundedBox args={[4.2, 0.035, 0.035]} position={[0, 0, -0.55]} radius={0.005}>
              <meshStandardMaterial color="#18181B" metalness={0.6} />
            </RoundedBox>
            {[-1.9, -0.6, 0.7, 1.9].map((px, pi) => (
              <RoundedBox key={pi} args={[0.035, 0.035, 0.74]} position={[px, 0, -0.20]} radius={0.005}>
                <meshStandardMaterial color="#18181B" metalness={0.6} />
              </RoundedBox>
            ))}

            {/* 3개의 블랙 반구형 플라워팟(Flowerpot VP1) 펜던트 램프 */}
            {[-1.35, -0.10, 1.15].map((lx, li) => (
              <group key={li} position={[lx, -0.48, 0.15]}>
                {/* 전선 코드 */}
                <mesh position={[0, 0.24, 0]}>
                  <cylinderGeometry args={[0.007, 0.007, 0.48, 8]} />
                  <meshStandardMaterial color="#18181B" />
                </mesh>
                {/* 상단 큰 블랙 반구 갓 */}
                <mesh position={[0, 0, 0]} castShadow>
                  <sphereGeometry args={[0.20, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#18181B" roughness={0.25} metalness={0.3} side={THREE.DoubleSide} />
                </mesh>
                {/* 내부 화이트 반사판 & 하단 작은 블랙 반구 디퓨저 */}
                <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.19, 24]} />
                  <meshBasicMaterial color="#FEF08A" />
                </mesh>
                <mesh position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}>
                  <sphereGeometry args={[0.085, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#18181B" roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>

          {/* 9) 카운터 우측 옆 화이트 원통 화분 관엽식물 (`image_94d3a1.jpg` 우측 화분 고증) */}
          <WhiteCylinderPlant2F position={[2.28, 0, -0.15]} scale={1.08} />
        </group>

        <BirchFairyLightTree position={[-1.35, 0, -1.85]} />

        {/* 원목 피크닉 벤치 테이블 */}
        <group position={[-0.45, 0, -2.55]}>
          <RoundedBox args={[1.45, 0.055, 0.68]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.3} />
          </RoundedBox>
          {[-0.55, 0.55].map((lx, li) => (
            <RoundedBox key={li} args={[0.07, 0.60, 0.58]} position={[lx, 0.30, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#27272A" />
            </RoundedBox>
          ))}
          {[-0.52, 0.52].map((bz, bi) => (
            <group
              key={`bench_${bi}`}
              position={[0, 0, bz]}
              onClick={(e) => {
                e.stopPropagation();
                onSitOnSeat({ x: -0.45, z: -2.55 + bz, rotY: bi === 0 ? 0 : Math.PI, rowLabel: '2F 북카페 원목 피크닉 벤치석', withCoffee: true });
              }}
            >
              <RoundedBox args={[1.38, 0.05, 0.28]} position={[0, 0.35, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={oakTex} roughness={0.32} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* 중앙 파스텔 테이블 & 의자 세트 */}
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
            <mesh position={[-0.25, 0.67, 0.10]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
              <meshStandardMaterial color="#F472B6" />
            </mesh>
            <mesh position={[0.25, 0.67, -0.10]} castShadow>
              <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>

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
                  onSitOnSeat({ x: tx + cx, z: tz + cz, rotY: cRot, rowLabel: '2F 북카페 파스텔 테이블석', withCoffee: true });
                }}
              />
            ))}
          </group>
        ))}

        {/* 우측 독서 테이블 & 5단 북카페 서가 */}
        <group position={[4.55, 0, -3.85]}>
          <RoundedBox args={[1.85, 0.055, 0.85]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.35} />
          </RoundedBox>
          {[-0.55, 0, 0.55].map((cx, ci) => (
            <React.Fragment key={ci}>
              <DetailedCafeChair
                position={[cx, 0, -0.58]}
                rotationY={0}
                seatColor="#1E293B"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: 4.55 + cx, z: -3.85 - 0.58, rotY: 0, rowLabel: '2F 북카페 독서 테이블석', withCoffee: true });
                }}
              />
              <DetailedCafeChair
                position={[cx, 0, 0.58]}
                rotationY={Math.PI}
                seatColor="#1E293B"
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnSeat({ x: 4.55 + cx, z: -3.85 + 0.58, rotY: Math.PI, rowLabel: '2F 북카페 독서 테이블석', withCoffee: true });
                }}
              />
            </React.Fragment>
          ))}
        </group>

        <group position={[6.28, 0, -3.4]}>
          <RoundedBox args={[0.38, 1.95, 3.4]} position={[0, 0.98, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </RoundedBox>
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

        {showRoomSigns && (
          <Billboard position={[-3.2, 2.25, -3.5]}>
            <mesh>
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs.cafe} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 💻 [5번 요청: 행정사무실 — `image_94c7a4.png`의 2x2 마주보는 4인 데스크 & 컴퓨터 배열 적용!] */}
      {/* - 중앙에 2명씩 마주 보며 앉는 4인용 우드 데스크 클러스터 + 중앙 파티션 + 모니터 4대 */}
      {/* - 좌측 창문 앞 파란 생수통 냉온수기 + 뒷벽 2단 우드 월선반 + 우측 4단 우드 서랍장 캐비닛 */}
      {/* ================================================================= */}
      <group position={[-4.85, 0, 0.7]}>
        {/* 따뜻한 크림 베이지 사무실 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.6, 3.7]} />
          <meshStandardMaterial color="#EAE0D5" roughness={0.5} />
        </mesh>

        {/* 1) 서쪽 벽면 채광 창문 & 파란 말통이 얹힌 화이트 냉온수기(Water Dispenser) */}
        <group position={[-1.68, 0, -0.35]}>
          {/* 창문 */}
          <group position={[0.04, 1.25, 0]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[1.65, 1.45, 0.08]} radius={0.01}>
              <meshStandardMaterial color="#785A46" />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[1.52, 1.32]} />
              <meshBasicMaterial map={glassTex} transparent opacity={0.85} />
            </mesh>
          </group>
          {/* 파란 생수통 냉온수기 (`image_94c7a4.png` 좌측 코너 소품) */}
          <group position={[0.32, 0, 1.05]}>
            <RoundedBox args={[0.36, 0.86, 0.36]} position={[0, 0.43, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
            </RoundedBox>
            <RoundedBox args={[0.24, 0.24, 0.02]} position={[0.18, 0.62, 0]} rotation={[0, Math.PI / 2, 0]} radius={0.01}>
              <meshStandardMaterial color="#1E293B" />
            </RoundedBox>
            {/* 상단 투명 블루 18.9L 생수통 */}
            <mesh position={[0, 1.08, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.42, 20]} />
              <meshStandardMaterial color="#38BDF8" transparent opacity={0.78} roughness={0.1} />
            </mesh>
          </group>
        </group>

        {/* 2) 북쪽 벽면 2단 플로팅 우드 월선반(도서 & 화분) & 우측 4단 우드 서랍장 캐비닛 */}
        <group position={[-0.1, 1.45, -1.65]}>
          {[0, 0.42].map((sy, si) => (
            <group key={si} position={[0, sy, 0]}>
              <RoundedBox args={[0.92, 0.04, 0.26]} radius={0.01} castShadow>
                <meshStandardMaterial map={oakTex} />
              </RoundedBox>
              {[-0.32, -0.18, -0.04, 0.10].map((bx, bi) => (
                <RoundedBox
                  key={bi}
                  args={[0.09, 0.24, 0.18]}
                  position={[bx, 0.14, 0]}
                  radius={0.005}
                  castShadow
                >
                  <meshStandardMaterial color={['#38BDF8', '#F43F5E', '#FACC15', '#10B981'][(si + bi) % 4]} />
                </RoundedBox>
              ))}
            </group>
          ))}
        </group>

        {/* 우측 4단 우드 서랍장 캐비닛 (`image_94c7a4.png` 우측 가구) */}
        <group position={[1.22, 0, -1.15]}>
          <RoundedBox args={[0.78, 1.08, 0.48]} position={[0, 0.54, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.35} />
          </RoundedBox>
          {[0.18, 0.42, 0.66, 0.90].map((dy, di) => (
            <group key={di} position={[0, dy, 0.245]}>
              <RoundedBox args={[0.70, 0.19, 0.02]} radius={0.005}>
                <meshStandardMaterial map={oakTex} />
              </RoundedBox>
              <RoundedBox args={[0.16, 0.025, 0.03]} position={[0, 0, 0.015]} radius={0.005}>
                <meshStandardMaterial color="#FFFFFF" />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* 3) 🌟 핵심: 2x2 마주보기 4인 아일랜드 데스크 & 중앙 파티션 & 모니터 4대 & 키보드 4세트! */}
        <group position={[0.05, 0, 0.15]}>
          {/* 통합 우드 상판 (가로 1.88m x 세로 1.24m) & 화이트 스틸 다리 */}
          <RoundedBox args={[1.88, 0.055, 1.24]} position={[0, 0.64, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} roughness={0.28} />
          </RoundedBox>
          {[
            [-0.88, -0.56],
            [0.88, -0.56],
            [-0.88, 0.56],
            [0.88, 0.56]
          ].map(([lx, lz], li) => (
            <RoundedBox key={li} args={[0.05, 0.64, 0.05]} position={[lx, 0.32, lz]} radius={0.01} castShadow>
              <meshStandardMaterial color="#F8FAFC" metalness={0.5} />
            </RoundedBox>
          ))}

          {/* 책상 정중앙을 가로지르는 화이트/그레이 프라이버시 파티션 가림막 */}
          <RoundedBox args={[1.84, 0.38, 0.04]} position={[0, 0.85, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.02, 0.39, 0.05]} />
            <meshStandardMaterial color="#94A3B8" />
          </mesh>

          {/* 4개 좌석(북쪽 2석 + 남쪽 2석)의 모니터, 키보드, 마우스, 회전의자 마주보기 배치 */}
          {[-0.45, 0.45].map((seatX, colIdx) => (
            <React.Fragment key={`cluster_col_${colIdx}`}>
              {/* 북쪽 좌석 (남쪽 +Z를 바라봄) */}
              <group position={[seatX, 0, -0.32]}>
                <RoundedBox args={[0.50, 0.32, 0.025]} position={[0, 0.88, 0.18]} radius={0.012} castShadow>
                  <meshStandardMaterial color="#18181B" />
                </RoundedBox>
                <mesh position={[0, 0.88, 0.165]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[0.46, 0.28]} />
                  <meshBasicMaterial map={officeCodeScreenTex} />
                </mesh>
                <RoundedBox args={[0.28, 0.018, 0.10]} position={[0, 0.68, -0.05]} radius={0.005}>
                  <meshStandardMaterial color="#FFFFFF" />
                </RoundedBox>
                <ErgonomicMeshOfficeChair
                  position={[0, 0, -0.45]}
                  rotationY={Math.PI}
                  onClick={(e) => {
                    e.stopPropagation();
                    playKeyboardClackSound();
                    onSitOnSeat({
                      x: -4.80 + seatX,
                      z: 0.85 - 0.77,
                      rotY: 0,
                      rowLabel: `2F 행정사무실 북쪽 ${colIdx + 1}번석`,
                      isOfficeSeat: true
                    });
                  }}
                />
              </group>

              {/* 남쪽 좌석 (북쪽 -Z를 바라봄) */}
              <group position={[seatX, 0, 0.32]}>
                <RoundedBox args={[0.50, 0.32, 0.025]} position={[0, 0.88, -0.18]} radius={0.012} castShadow>
                  <meshStandardMaterial color="#18181B" />
                </RoundedBox>
                <mesh position={[0, 0.88, -0.165]}>
                  <planeGeometry args={[0.46, 0.28]} />
                  <meshBasicMaterial map={officeCodeScreenTex} />
                </mesh>
                <RoundedBox args={[0.28, 0.018, 0.10]} position={[0, 0.68, 0.05]} radius={0.005}>
                  <meshStandardMaterial color="#FFFFFF" />
                </RoundedBox>
                <ErgonomicMeshOfficeChair
                  position={[0, 0, 0.45]}
                  rotationY={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    playKeyboardClackSound();
                    onSitOnSeat({
                      x: -4.80 + seatX,
                      z: 0.85 + 0.77,
                      rotY: Math.PI,
                      rowLabel: `2F 행정사무실 남쪽 ${colIdx + 1}번석`,
                      isOfficeSeat: true
                    });
                  }}
                />
              </group>
            </React.Fragment>
          ))}
        </group>

        {showRoomSigns && (
          <Billboard position={[0, 1.95, 0]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.office} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* ✝️ [2번 요청: 담임목사 목양실 정교화 — `image_94cfba.jpg` 100% 반영!] */}
      {/* - 칸별 웜화이트 간접조명이 매립된 4단 다크 월넛 빌트인 서재 + 좌측 측면 히든 책장 */}
      {/* - 하부 서랍통(Pedestal) 일체형 중후한 월넛 중역 데스크 + 바닥 그레이 러그 */}
      {/* - 우측 대각선 실버/화이트 iMac 모니터 + 좌측 황동(Brass) 원통 갓 스탠드 램프 */}
      {/* ================================================================= */}
      <group position={[4.75, 0, -0.18]}>
        {/* 목양실 다크 월넛 마루 바닥 & 데스크 아래 고급 그레이 패브릭 러그 (`image_94cfba.jpg` 바닥 러그 고증) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.0]} />
          <meshStandardMaterial map={oakTex} roughness={0.28} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.55, 0.012, -0.25]} receiveShadow>
          <planeGeometry args={[2.15, 1.45]} />
          <meshStandardMaterial color="#64748B" roughness={0.85} />
        </mesh>

        {/* 1) 북쪽 메인 4단 다크 월넛 빌트인 서재 & 칸별 웜화이트 히든 라인 간접조명 */}
        <group position={[-0.12, 0, -0.82]}>
          <RoundedBox args={[3.22, 1.94, 0.36]} position={[0, 0.97, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.3} />
          </RoundedBox>
          {[0.46, 0.92, 1.38, 1.84].map((sy, si) => (
            <group key={`sh_h_${si}`}>
              <RoundedBox args={[3.16, 0.04, 0.38]} position={[0, sy, 0.02]} radius={0.005}>
                <meshStandardMaterial map={walnutTex} />
              </RoundedBox>
              {/* 선반 안쪽 상단을 비추는 따뜻한 호박색 LED 간접조명 바 */}
              <mesh position={[0, sy - 0.024, 0.12]}>
                <boxGeometry args={[3.06, 0.016, 0.03]} />
                <meshBasicMaterial color="#FDE047" />
              </mesh>
            </group>
          ))}
          <pointLight position={[0, 1.35, 0.4]} intensity={2.2} distance={3.8} color="#FBBF24" />

          {[-1.52, -0.76, 0, 0.76, 1.52].map((sx, si) => (
            <RoundedBox key={`sh_v_${si}`} args={[0.045, 1.90, 0.38]} position={[sx, 0.95, 0.02]} radius={0.005}>
              <meshStandardMaterial map={walnutTex} />
            </RoundedBox>
          ))}

          {[-1.14, -0.38, 0.38, 1.14].map((cellX, cIdx) => (
            <group key={`book_col_${cIdx}`} position={[cellX, 0, 0.06]}>
              {Array.from({ length: 5 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b1_${bIdx}`}
                  args={[0.06, 0.32, 0.22]}
                  position={[-0.26 + bIdx * 0.068, 0.22, 0]}
                  radius={0.006}
                  castShadow
                >
                  <meshStandardMaterial color={['#27272A', '#451A03', '#1E293B', '#78350F', '#D6D3D1'][bIdx]} />
                </RoundedBox>
              ))}
              {Array.from({ length: 6 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b2_${bIdx}`}
                  args={[0.062, 0.30, 0.22]}
                  position={[-0.24 + bIdx * 0.072, 0.66, 0]}
                  radius={0.006}
                >
                  <meshStandardMaterial color={['#E7E5E4', '#78350F', '#1C1917', '#A8A29E', '#451A03', '#F5F5F4'][bIdx]} />
                </RoundedBox>
              ))}
              {/* 3단: 간접조명 아래 빛나는 미니 액자 & 성경 주석서 */}
              <RoundedBox args={[0.22, 0.24, 0.02]} position={[0.12, 1.12, 0]} radius={0.005}>
                <meshStandardMaterial color="#FEF3C7" />
              </RoundedBox>
              {Array.from({ length: 4 }).map((_, bIdx) => (
                <RoundedBox
                  key={`b4_${bIdx}`}
                  args={[0.065, 0.28, 0.22]}
                  position={[-0.24 + bIdx * 0.07, 1.56, 0]}
                  radius={0.006}>
                  <meshStandardMaterial color={['#451A03', '#D6D3D1', '#27272A', '#78350F'][bIdx]} />
                </RoundedBox>
              ))}
            </group>
          ))}
        </group>

        {/* 2) `image_94cfba.jpg` 좌측 벽면의 매립형 세로 책장 니치(Niche) */}
        <group position={[-1.72, 0, -0.22]}>
          <RoundedBox args={[0.32, 1.92, 0.68]} position={[0, 0.96, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={walnutTex} />
          </RoundedBox>
          {[0.45, 0.90, 1.35].map((sy, si) => (
            <RoundedBox key={si} args={[0.26, 0.26, 0.48]} position={[0.04, sy + 0.15, 0]} radius={0.01}>
              <meshStandardMaterial color="#D6D3D1" />
            </RoundedBox>
          ))}
        </group>

        {/* 3) 담임목사님 다크 월넛 중역 데스크 (`image_94cfba.jpg` 전경의 두꺼운 상판 + 하부 2단 서랍통 + 슬림 스탠드 + 대각선 iMac 고증!) */}
        <group position={[0.52, 0, -0.28]} rotation={[0, -Math.PI / 2, 0]}>
          {/* 두꺼운 월넛 상판 */}
          <RoundedBox args={[1.64, 0.08, 0.78]} position={[0, 0.72, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.22} />
          </RoundedBox>
          {/* 좌측 하부 2단 와이드 서랍통(Pedestal) */}
          <RoundedBox args={[0.68, 0.68, 0.72]} position={[-0.42, 0.34, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.28} />
          </RoundedBox>
          <mesh position={[-0.42, 0.35, -0.365]}>
            <boxGeometry args={[0.64, 0.015, 0.01]} />
            <meshBasicMaterial color="#1C1917" />
          </mesh>
          {/* 우측 두꺼운 패널 다리 */}
          <RoundedBox args={[0.12, 0.68, 0.72]} position={[0.68, 0.34, 0]} radius={0.01} castShadow receiveShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.28} />
          </RoundedBox>

          {/* 데스크 위 좌측: 황동(Brass) 원통 갓 스탠드 램프 & 세워진 책 4권 (`image_94cfba.jpg` 좌측 소품) */}
          <group position={[-0.58, 0.76, 0.12]}>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.44, 8]} />
              <meshStandardMaterial color="#D97706" metalness={0.85} />
            </mesh>
            <mesh position={[0.06, 0.40, 0]} rotation={[0, 0, -0.45]} castShadow>
              <cylinderGeometry args={[0.055, 0.075, 0.16, 16]} />
              <meshStandardMaterial color="#F59E0B" metalness={0.75} roughness={0.2} />
            </mesh>
            {[-0.12, -0.06, 0, 0.06].map((bx, bi) => (
              <RoundedBox key={bi} args={[0.045, 0.20, 0.15]} position={[0.22 + bx, 0.10, 0]} radius={0.005} castShadow>
                <meshStandardMaterial color={['#F8FAFC', '#451A03', '#D6D3D1', '#1E293B'][bi]} />
              </RoundedBox>
            ))}
          </group>

          {/* 데스크 위 중앙: 펼쳐진 성경책과 연필꽂이 */}
          <RoundedBox args={[0.36, 0.02, 0.24]} position={[0.05, 0.77, -0.08]} radius={0.005}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <mesh position={[-0.18, 0.80, -0.10]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.09, 12]} />
            <meshStandardMaterial color="#451A03" />
          </mesh>

          {/* 데스크 위 우측: 살짝 사선으로 놓인 화이트/실버 iMac 모니터 (`image_94cfba.jpg` 우측 iMac 각도 고증!) */}
          <group position={[0.48, 0.76, 0.08]} rotation={[0, -0.35, 0]}>
            <RoundedBox args={[0.18, 0.01, 0.14]} position={[0, 0.005, 0]} radius={0.004}>
              <meshStandardMaterial color="#E2E8F0" metalness={0.85} />
            </RoundedBox>
            <RoundedBox args={[0.09, 0.20, 0.015]} position={[0, 0.10, 0.03]} rotation={[0.18, 0, 0]} radius={0.004}>
              <meshStandardMaterial color="#E2E8F0" metalness={0.85} />
            </RoundedBox>
            <RoundedBox args={[0.58, 0.38, 0.022]} position={[0, 0.28, 0.01]} radius={0.015} castShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0.29, -0.003]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.54, 0.32]} />
              <meshBasicMaterial map={imacScreenTex} />
            </mesh>
          </group>
        </group>

        {/* 4) 가로 리브드 블랙 가죽 중역 의자 */}
        <group position={[1.15, 0, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[0.52, 0.08, 0.50]} position={[0, 0.35, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.50, 0.68, 0.07]} position={[0, 0.70, -0.22]} rotation={[-0.10, 0, 0]} radius={0.035} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.28} />
          </RoundedBox>
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
        </group>

        {/* 성도 1:1 면담 의자 */}
        <DetailedCafeChair
          position={[-0.15, 0, 0.35]}
          rotationY={Math.PI / 2}
          seatColor="#D6D3D1"
          onClick={(e) => {
            e.stopPropagation();
            onSitOnSeat({ x: 4.75 - 0.15, z: -0.18 + 0.35, rotY: Math.PI / 2, rowLabel: '2F 목양실 1:1 기도·면담석' });
            if (onSelectNpcForChat) onSelectNpcForChat(NPCS_2F[1]);
          }}
        />

        {showRoomSigns && (
          <Billboard position={[0, 1.98, 0]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectNpcForChat) onSelectNpcForChat(NPCS_2F[1]);
              }}
            >
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.pastorRoom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚹 [4번 요청: 남자화장실 정교화 — `image_94c859.png` 100% 반영!] */}
      {/* - 그레이 포세린 타일 바닥 + 우측 4연속 칸막이 센서 소변기 + 안쪽 큐비클 부스 + 좌측 옐로우 포인트 세면대 */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 1.98]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.2]} />
          <meshStandardMaterial map={greyRestroomTileTex} roughness={0.35} />
        </mesh>

        {/* 좌측 앞: 화이트 세면대 카운터 + 옐로우 포인트 세면 보울 + 거울 + 청소솔 (`image_94c859.png` 좌하단 고증) */}
        <group position={[-1.15, 0, 0.45]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.92, 0.74, 0.48]} position={[0, 0.37, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>
          {/* 사진 속 선명한 옐로우 세면대 상판 보울 포인트 */}
          <RoundedBox args={[0.64, 0.02, 0.34]} position={[0, 0.745, 0.02]} radius={0.01}>
            <meshBasicMaterial color="#FACC15" />
          </RoundedBox>
          {/* 크롬 수전 & 벽면 거울 */}
          <mesh position={[0, 0.82, -0.14]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 10]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
          <mesh position={[0, 1.25, -0.22]}>
            <planeGeometry args={[0.84, 0.78]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
        </group>

        {/* 북쪽 벽면: 화이트 라운드 칸막이가 설치된 4연속 플로어 스탠딩 센서 소변기 (`image_94c859.png` 우측 벽 완벽 고증!) */}
        {[-0.45, 0.08, 0.61, 1.14].map((ux, ui) => (
          <DetailedPartitionedUrinal2F
            key={ui}
            position={[ux, 0, -0.88]}
            rotationY={0}
            showRightPartition={true}
          />
        ))}

        {/* 우측 안쪽: 베이지/그레이 톤 양변기 큐비클 부스 & 도어 */}
        <group position={[1.15, 0, 0.48]}>
          <RoundedBox args={[1.18, 1.65, 0.05]} position={[0, 0.825, -0.48]} radius={0.01} castShadow>
            <meshStandardMaterial color="#D6D3D1" roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.05, 1.65, 0.92]} position={[-0.56, 0.825, 0]} radius={0.01} castShadow>
            <meshStandardMaterial color="#E7E5E4" roughness={0.35} />
          </RoundedBox>
          {/* 도어 손잡이 & 잠금 표시창 */}
          <mesh position={[-0.59, 0.86, 0.28]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshStandardMaterial color="#18181B" metalness={0.8} />
          </mesh>
          <DetailedMiniatureToilet2F position={[0.18, 0, 0]} rotationY={-Math.PI / 2} />
        </group>

        {showRoomSigns && (
          <Billboard position={[0, 1.85, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.48]} />
              <meshBasicMaterial map={signs.menWc} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚺 [3번 요청: 여자화장실 정교화 — `image_94cb67.png` 100% 반영!] */}
      {/* - 그레이 포스트 & 아이보리 도어 + 실버 가로 띠 잠금쇠가 달린 3연속 큐비클 부스 */}
      {/* - 좌측 앞 옐로우 포인트 세면대 & 거울 + 우측 벽면 화이트 곡면 핸드드라이어(에어타월) & 2구 콘센트 + 안쪽 채광창 */}
      {/* ================================================================= */}
      <group position={[4.75, 0, 4.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.8, 2.6]} />
          <meshStandardMaterial map={greyRestroomTileTex} roughness={0.35} />
        </mesh>

        {/* 1) 좌측 앞: 옐로우 포인트 화이트 세면대 & 사각 거울 (`image_94cb67.png` 좌하단 고증) */}
        <group position={[-1.25, 0, -0.55]}>
          <RoundedBox args={[0.88, 0.74, 0.48]} position={[0, 0.37, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>
          <RoundedBox args={[0.62, 0.02, 0.32]} position={[0, 0.745, 0.02]} radius={0.01}>
            <meshBasicMaterial color="#FACC15" />
          </RoundedBox>
          <mesh position={[0, 0.82, -0.14]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 10]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
          <mesh position={[0, 1.24, -0.22]}>
            <planeGeometry args={[0.78, 0.76]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
        </group>

        {/* 2) 북쪽 라인을 따라 늘어선 3연속 큐비클 화장실 부스 (`image_94cb67.png` 중앙 3연속 부스 완벽 고증!) */}
        {[-0.32, 0.42, 1.16].map((cx, ci) => (
          <group key={`w_stall_${ci}`} position={[cx, 0, -0.55]}>
            {/* 칸막이 측벽 */}
            <RoundedBox args={[0.04, 1.68, 1.05]} position={[-0.36, 0.84, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#C8BFA8" roughness={0.4} />
            </RoundedBox>
            {/* 전면 그레이 필라 기둥 */}
            <RoundedBox args={[0.14, 1.68, 0.05]} position={[-0.30, 0.84, 0.52]} radius={0.008} castShadow>
              <meshStandardMaterial color="#9CA3AF" metalness={0.3} roughness={0.4} />
            </RoundedBox>
            {/* 아이보리 화이트 큐비클 문짝 + 중앙 실버 가로 띠 & 원형 잠금 손잡이 (`image_94cb67.png` 디테일) */}
            <group position={[0.04, 0.84, 0.52]}>
              <RoundedBox args={[0.54, 1.62, 0.04]} radius={0.008} castShadow receiveShadow>
                <meshStandardMaterial color="#FAF8F5" roughness={0.25} />
              </RoundedBox>
              {/* 문 중앙 실버 메탈 가로 스트라이프 바 */}
              <RoundedBox args={[0.545, 0.11, 0.045]} position={[0, -0.05, 0]} radius={0.004}>
                <meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.25} />
              </RoundedBox>
              {/* 다크 원형 노브 손잡이 */}
              <mesh position={[-0.20, -0.05, 0.03]}>
                <sphereGeometry args={[0.026, 12, 12]} />
                <meshStandardMaterial color="#27272A" metalness={0.8} />
              </mesh>
            </group>
            {/* 부스 내부 양변기 */}
            <DetailedMiniatureToilet2F position={[0.02, 0, -0.12]} rotationY={0} />
          </group>
        ))}

        {/* 3) 남쪽(맞은편) 벽면: 화이트 곡면 자동 핸드드라이어(에어타월) & 2구 벽면 콘센트 (`image_94cb67.png` 우측 벽 소품 완벽 고증!) */}
        <group position={[0.15, 1.08, 1.12]} rotation={[0, Math.PI, 0]}>
          {/* 볼록한 화이트 곡면 핸드드라이어 본체 */}
          <RoundedBox args={[0.32, 0.36, 0.18]} radius={0.08} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
          </RoundedBox>
          <mesh position={[0, 0.02, 0.095]}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
          {/* 옆 2구 벽면 콘센트 플레이트 */}
          <RoundedBox args={[0.10, 0.16, 0.02]} position={[-0.28, 0.04, -0.06]} radius={0.01}>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          {[-0.03, 0.03].map((py, pi) => (
            <mesh key={pi} position={[-0.28, 0.04 + py, -0.048]}>
              <circleGeometry args={[0.018, 12]} />
              <meshBasicMaterial color="#475569" />
            </mesh>
          ))}
        </group>

        {/* 4) 동쪽 끝 격자형 채광 창문 (`image_94cb67.png` 복도 끝 창문) */}
        <group position={[1.76, 1.22, 0.35]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[1.15, 1.35, 0.08]} radius={0.01}>
            <meshStandardMaterial color="#CBD5E1" />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.05, 1.25]} />
            <meshBasicMaterial map={glassTex} transparent opacity={0.88} />
          </mesh>
        </group>

        {showRoomSigns && (
          <Billboard position={[0, 1.85, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.48]} />
              <meshBasicMaterial map={signs.womenWc} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 🪜 [구역 6: 계단실] */}
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
        {showRoomSigns && (
          <Billboard position={[0, 1.68, 0]}>
            <mesh>
              <planeGeometry args={[1.12, 0.48]} />
              <meshBasicMaterial map={signs.stairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 🛗 [구역 7: 하단 중앙 스테인리스 자동 개폐 엘리베이터 홀] */}
      <AnimatedStainlessElevator2F
        position={[-0.2, 0, 5.25]}
        playerIdxRef={playerIdxRef}
        forceOpen={isElevatorModalOpen}
        onClickElevator={() => onSelectZone(ZONES_2F[0])}
        signTex={signs.elevator}
        showRoomSigns={showRoomSigns}
      />

      {/* 내벽 및 외벽 구조물 */}
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
        const isBlessingNow = holyLightEvent && holyLightEvent.pastorName === npc.name;

        return (
          <SmoothChibiAvatar2F
            key={npc.id}
            position={[npc.x, npc.y || 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isTyping={Boolean(npc.isTyping)}
            hasCoffee={Boolean(npc.hasCoffee)}
            emote={isBlessingNow ? 'bless' : null}
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
              if (npc.isOfficeStaff) playKeyboardClackSound();
              if (onSelectNpcForChat) onSelectNpcForChat(npc);
            }}
          />
        );
      })}

      {/* 실시간 멀티플레이어로 2층에 접속한 다른 성도들 */}
      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar2F
          key={peer.clientId}
          peer={peer}
          onClickPeer={onSelectRemotePeer}
        />
      ))}

      {/* 축도 홀리라이트 강림 이펙트 */}
      {holyLightEvent && (
        <HolyLightBeamEffect2F
          targetPos={holyLightEvent.targetPos}
          pastorName={holyLightEvent.pastorName}
          targetName={holyLightEvent.targetName}
        />
      )}

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
function PlayerController2F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  playerOffice,
  avatarConfig,
  emote,
  hasCoffeeCup,
  myChatBubble,
  controlsRef,
  followCamEnabled,
  onPositionUpdate
}) {
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
    const isPastor = isAuthorizedPastor(playerName, playerOffice);
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = isPastor ? 'rgba(88, 28, 135, 0.96)' : 'rgba(30, 33, 40, 0.95)';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 48);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = isPastor ? '#FACC15' : 'rgba(56, 189, 248, 0.65)';
      ctx.stroke();

      ctx.fillStyle = isPastor ? '#FACC15' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(48, h / 2, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 35px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`나 · ${isPastor ? '✝️' : ''}${playerName}`, w / 2 + 18, h / 2 + 2);
    }, 540, 110);
  }, [playerName, playerOffice]);

  useFrame(({ camera }, delta) => {
    if (seatedInfo) {
      playerIdxRef.current = [seatedInfo.x, 0, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.rotY !== seatedInfo.rotY) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: seatedInfo.rotY ?? Math.PI,
          walking: false
        });
      }
      if (followCamEnabled && controlsRef?.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(seatedInfo.x, 0.9, seatedInfo.z), delta * 4.5);
        controlsRef.current.update();
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
      onPositionUpdate(nx, nz, angle);

      if (followCamEnabled && controlsRef?.current) {
        camera.position.x += (nx - cx) * 0.85;
        camera.position.z += (nz - cz) * 0.85;
        controlsRef.current.target.lerp(new THREE.Vector3(nx, 0.95, nz), delta * 6.0);
        controlsRef.current.update();
      }
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
      gender={avatarConfig.gender}
      hairStyle={avatarConfig.hairStyle}
      isSkirt={Boolean(avatarConfig.isSkirt)}
      hasSunglasses={Boolean(avatarConfig.hasSunglasses)}
      isWalking={renderState.walking}
      isSeated={Boolean(seatedInfo)}
      isTyping={Boolean(seatedInfo?.isOfficeSeat) || emote === 'typing'}
      hasCoffee={hasCoffeeCup || Boolean(seatedInfo?.withCoffee) || emote === 'coffee'}
      emote={emote}
      shirtColor={avatarConfig.shirtColor}
      pantsColor={avatarConfig.pantsColor}
      hairColor={avatarConfig.hairColor}
      nameTagTexture={nameTagTex}
      speechBubbleText={myChatBubble ? `${playerName}: ${myChatBubble}` : null}
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
  const authUser = useAppStore((state) => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer2f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.2, 0, 2.8]);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  const [avatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gtc_metaverse_avatar_v1');
      return saved ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(saved) } : DEFAULT_AVATAR_CONFIG;
    } catch {
      return DEFAULT_AVATAR_CONFIG;
    }
  });

  const [waypoints, setWaypoints] = useState([[-0.2, 2.8]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_2F[3]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [hasCoffeeCup, setHasCoffeeCup] = useState(true);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [followCamEnabled, setFollowCamEnabled] = useState(true);

  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [counselCategory, setCounselCategory] = useState('신앙·영적고민');
  const [counselTitle, setCounselTitle] = useState('');
  const [counselContent, setCounselContent] = useState('');
  const [isSubmittingCounsel, setIsSubmittingCounsel] = useState(false);
  const [counselSubmittedSuccess, setCounselSubmittedSuccess] = useState(false);

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

  const broadcastMyState = useCallback(
    (override = {}) => {
      if (!channelRef.current) return;
      const [px, , pz] = playerIdxRef.current;
      const payload = {
        clientId: clientIdRef.current,
        name: playerName,
        office: playerOffice,
        x: Number(px.toFixed(2)),
        z: Number(pz.toFixed(2)),
        rotY: Number((playerRotRef.current || 0).toFixed(2)),
        seated: Boolean(seatedInfo),
        emote: override.emote !== undefined ? override.emote : emote,
        chatMsg: override.chatMsg !== undefined ? override.chatMsg : myChatBubble,
        avatar: avatarConfig,
        ts: Date.now()
      };
      channelRef.current.track(payload).catch(() => {});
    },
    [playerName, playerOffice, seatedInfo, emote, myChatBubble, avatarConfig]
  );

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('metaverse_cafe_2f', {
      config: { presence: { key: clientIdRef.current } }
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const peers = [];
        Object.keys(state).forEach((key) => {
          if (key === clientIdRef.current) return;
          const items = state[key];
          if (items && items.length > 0) {
            peers.push(items[items.length - 1]);
          }
        });
        setRemotePeers(peers);
      })
      .on('broadcast', { event: 'holy_blessing_2f' }, ({ payload }) => {
        if (!payload) return;
        playHolyBlessingSound();
        setHolyLightEvent(payload);
        setTimeout(() => setHolyLightEvent(null), 7000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const [px, , pz] = playerIdxRef.current;
          await channel.track({
            clientId: clientIdRef.current,
            name: playerName,
            office: playerOffice,
            x: px,
            z: pz,
            rotY: Math.PI,
            seated: false,
            emote: 'coffee',
            chatMsg: '',
            avatar: avatarConfig,
            ts: Date.now()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [playerName, playerOffice, avatarConfig]);

  const triggerSocialAction = useCallback(
    (emoteType, chatText = '') => {
      setEmote(emoteType);
      if (emoteType === 'coffee') setHasCoffeeCup(true);
      if (emoteType === 'typing') playKeyboardClackSound();
      if (chatText) setMyChatBubble(chatText);
      broadcastMyState({ emote: emoteType, chatMsg: chatText });

      setTimeout(() => {
        setEmote(null);
        broadcastMyState({ emote: null, chatMsg: chatText });
      }, 4000);

      if (chatText) {
        setTimeout(() => {
          setMyChatBubble('');
          broadcastMyState({ emote: null, chatMsg: '' });
        }, 5500);
      }
    },
    [broadcastMyState]
  );

  const triggerHolyBenediction2F = useCallback(
    (pastorDisplayName, targetDisplayName, targetCoords) => {
      const eventPayload = {
        pastorName: pastorDisplayName,
        targetName: targetDisplayName,
        targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]],
        ts: Date.now()
      };

      playHolyBlessingSound();
      setHolyLightEvent(eventPayload);
      triggerSocialAction('pray', `아멘! 목양실에서 ${pastorDisplayName}의 거룩한 축도를 받습니다 🙏`);

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'holy_blessing_2f',
            payload: eventPayload
          })
          .catch(() => {});
      }

      setTimeout(() => {
        setHolyLightEvent(null);
      }, 7000);
    },
    [triggerSocialAction]
  );

  const handleSubmitPastorCounseling = async (e) => {
    if (e) e.preventDefault();
    if (!counselTitle.trim() || !counselContent.trim()) {
      return alert('면담 제목과 나누고 싶은 기도제목/내용을 입력해 주세요.');
    }

    setIsSubmittingCounsel(true);
    const payload = {
      user_name: playerName,
      category: counselCategory,
      title: `[2F목양실 1:1면담] ${counselTitle.trim()}`,
      content: counselContent.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      if (supabase) {
        await supabase.from('counseling_qna').insert([payload]);
      }
      localStorage.setItem('admin_default_nav_tab', 'counseling');
      localStorage.setItem('latest_pastor_counsel_request', JSON.stringify(payload));
      window.dispatchEvent(new Event('storage'));

      setCounselSubmittedSuccess(true);
      triggerSocialAction('pray', '목양실에서 담임목사님께 1:1 신앙 면담을 신청했습니다 🙏');
    } catch (err) {
      alert('면담 신청 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmittingCounsel(false);
    }
  };

  const handleNavigateToAdminCounseling = () => {
    localStorage.setItem('admin_default_nav_tab', 'counseling');
    setShowCounselingModal(false);
    if (typeof setActiveScreen === 'function') {
      setActiveScreen('admin');
    }
  };

  const handleSitOnSeat = useCallback(
    (seatData) => {
      setSeatedInfo(seatData);
      if (seatData.withCoffee) setHasCoffeeCup(true);
      setWaypoints([[seatData.x, seatData.z]]);
      setTimeout(() => broadcastMyState(), 100);
    },
    [broadcastMyState]
  );

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleWalkTo = useCallback(
    (tx, tz) => {
      if (seatedInfo) setSeatedInfo(null);
      const [sx, , sz] = playerIdxRef.current;
      const nextPath = computeSmartPath2F(sx, sz, tx, tz);
      setWaypoints(nextPath);
    },
    [seatedInfo]
  );

  const handleSelectNpcForChat = useCallback(
    (npc) => {
      setChatReplyText(
        (npc.dialogues && npc.dialogues[0]) ||
          '할렐루야! 2층 좋은나무 북카페 & 목양센터에 오신 것을 환영합니다 ☕'
      );
      setSelectedChatNpc(npc);
      triggerSocialAction('wave');
    },
    [triggerSocialAction]
  );

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
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(76, 40, 32, 15);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(42, 76, 26, 14);

    remotePeers.forEach((p) => {
      const px = (((p.x || 0) + 6.8) / 13.6) * w;
      const py = (((p.z || 0) + 5.6) / 11.4) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    });

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.8) / 13.6) * w;
    const my = ((cz + 5.6) / 11.4) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handlePositionUpdate = (px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_2F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }

    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) {
      lastSyncTimeRef.current = now;
      broadcastMyState();
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
      {/* 1. 좌측 상단: 슬림 헤더 & 실시간 동시접속자 & 목양실 축도/면담 & 카페BGM */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[76vw]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            onClick={onExitHome}
            style={darkPillStyle}
            className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
          >
            <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
              ◀ 2F 북카페 · 목양실 · 사무실
            </span>
          </div>

          <div
            style={darkPillStyle}
            className="px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300">2F 접속 {remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              handleWalkTo(4.2, -0.2);
              setSelectedChatNpc(NPCS_2F[1]);
              setChatReplyText(NPCS_2F[1].dialogues[0]);
            }}
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            ✝️ 목양실 축도·1:1면담
          </button>

          <button
            onClick={() => {
              setCounselSubmittedSuccess(false);
              setShowCounselingModal(true);
            }}
            style={{ backgroundColor: '#F59E0B', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            📝 면담 신청 (어드민 연동)
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
            onClick={() => setFollowCamEnabled((prev) => !prev)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: followCamEnabled ? '#34D399' : '#9CA3AF' }}>
              {followCamEnabled ? '🎥 캐릭터 추적뷰 ON' : '🎥 자유 시점'}
            </span>
          </button>

          <button
            onClick={() => setShowRoomSigns((prev) => !prev)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: showRoomSigns ? '#34D399' : '#9CA3AF' }}>
              {showRoomSigns ? '🏷️ 간판 켜짐' : '🏷️ 간판 숨김'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 접이식 미니맵 & 구역 목록 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMapDrawerOpen((prev) => !prev)}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 2F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_2F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnSeat(z.seatTarget);
                    else if (z.isPastorRoomZone) {
                      handleWalkTo(4.2, -0.2);
                      setSelectedChatNpc(NPCS_2F[1]);
                      setChatReplyText(NPCS_2F[1].dialogues[0]);
                    } else if (z.isOfficeZone) {
                      playKeyboardClackSound();
                      handleWalkTo(-4.4, 1.0);
                      setSelectedChatNpc(NPCS_2F[2]);
                      setChatReplyText(NPCS_2F[2].dialogues[0]);
                    } else {
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

      {/* 3. 하단: 2층 특화 소셜 동작(☕ 커피 마시기 · 💻 다다닥 타이핑 · 🙏 기도 · 👋 인사) & 공간 이동 바 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { label: '☕ 커피마시기', emote: 'coffee', msg: '호로록~ 좋은나무 북카페 커피가 정말 맛있네요! ☕🥰' },
              { label: '💻 다다닥타이핑', emote: 'typing', msg: '(타다다닥! ⌨️) 주보와 사역 자료를 빛의 속도로 정리합니다!' },
              { label: '👋 반갑게인사', emote: 'wave', msg: '성도님 반갑습니다! 카페에서 차 한잔 하세요 👋' },
              { label: '🙏 중보기도', emote: 'pray', msg: '목양실과 카페에서 두 손 모아 간절히 기도합니다 🙏' },
              { label: '💃 기쁨의춤', emote: 'dance', msg: '주님이 주신 기쁨으로 랄랄라 춤을 춥니다! 💃🎵' }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => triggerSocialAction(act.emote, act.msg)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickChatInput.trim()) return;
              triggerSocialAction('coffee', quickChatInput.trim());
              setQuickChatInput('');
            }}
            style={darkPillStyle}
            className="flex items-center gap-1 px-2.5 py-1 rounded-2xl border shadow-2xl w-full sm:w-64"
          >
            <input
              type="text"
              value={quickChatInput}
              onChange={(e) => setQuickChatInput(e.target.value)}
              placeholder="북카페 말풍선 대화 입력..."
              className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-xl bg-amber-500 text-stone-950 text-[11px] font-black cursor-pointer shrink-0"
            >
              전송
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showBottomDock ? (
            <div
              style={darkPillStyle}
              className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
            >
              {[
                {
                  icon: '☕',
                  label: seatedInfo ? '일어나기' : '북카페착석·커피',
                  onClick: () => {
                    if (seatedInfo) handleStandUp();
                    else {
                      handleSitOnSeat({ x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 파스텔 라운지석', withCoffee: true });
                      triggerSocialAction('coffee', '북카페 테이블에 앉아 향긋한 커피를 마십니다 ☕');
                    }
                  }
                },
                {
                  icon: '✝️',
                  label: '목양실(축도·면담)',
                  onClick: () => {
                    handleWalkTo(4.2, -0.2);
                    setSelectedChatNpc(NPCS_2F[1]);
                    setChatReplyText(NPCS_2F[1].dialogues[0]);
                  }
                },
                {
                  icon: '💻',
                  label: '사무실(다다닥업무)',
                  onClick: () => {
                    playKeyboardClackSound();
                    handleWalkTo(-4.4, 1.0);
                    setSelectedChatNpc(NPCS_2F[2]);
                    setChatReplyText(NPCS_2F[2].dialogues[0]);
                  }
                },
                {
                  icon: '🛗',
                  label: '엘리베이터(층간이동)',
                  onClick: () => {
                    handleWalkTo(-0.2, 4.3);
                    setModalZone(ZONES_2F[0]);
                  }
                }
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
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController2F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          hasCoffeeCup={hasCoffeeCup}
          myChatBubble={myChatBubble}
          controlsRef={controlsRef}
          followCamEnabled={followCamEnabled}
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

      {/* 5. 다른 실제 접속 성도(Remote Peer) 클릭 시 열리는 상호 호환 모달 */}
      {selectedRemotePeer && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRemotePeer(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-sm border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 block">2층 북카페·목양실 성도 교제</span>
                <h3 className="text-base font-black text-white">
                  {selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})
                </h3>
              </div>
              <button onClick={() => setSelectedRemotePeer(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerSocialAction('coffee', `${selectedRemotePeer.name}님! 저랑 따뜻한 아메리카노 한잔 같이 마셔요 ☕🥰`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-xs font-black text-amber-200 cursor-pointer"
              >
                ☕ 같이 커피 마시기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 샬롬 👋`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 text-xs font-bold text-white cursor-pointer"
              >
                👋 반갑게 인사하기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('pray', `${selectedRemotePeer.name}님의 기도제목이 응답되길 함께 중보합니다 🙏`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 text-xs font-bold text-white cursor-pointer"
              >
                🙏 함께 기도하기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('typing', `${selectedRemotePeer.name}님과 함께 행정/사역 준비 다다닥! 💻`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-sky-600/40 text-xs font-bold text-white cursor-pointer"
              >
                💻 같이 사역 타이핑
              </button>
            </div>

            {canPlayerBless && (
              <button
                onClick={() => {
                  triggerHolyBenediction2F(
                    `${playerName} 목사님`,
                    selectedRemotePeer.name,
                    [selectedRemotePeer.x || -0.2, 0, selectedRemotePeer.z || 2.2]
                  );
                  setSelectedRemotePeer(null);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
              >
                ✨ [{selectedRemotePeer.name}] 성도에게 축도(홀리라이트) 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. 목양실 1:1 신앙 면담 신청 & 어드민 콘솔 상담실 연동 모달 */}
      {showCounselingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCounselingModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-purple-500/50 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-400 block">PASTORAL COUNSELING OFFICE</span>
                <h3 className="text-base font-black text-white">✝️ 담임목사님 1:1 목양 면담 신청</h3>
              </div>
              <button onClick={() => setShowCounselingModal(false)} className="text-xs font-bold text-zinc-400 cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            {counselSubmittedSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-2">
                  <span className="text-2xl block">🙏</span>
                  <h4 className="text-sm font-black text-emerald-300">
                    1:1 목양 면담 신청이 어드민 콘솔 상담실에 접수되었습니다!
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    담임목사님께서 내용을 확인하시고 기도로 준비하여 답변 및 면담을 진행해 주십니다.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleNavigateToAdminCounseling}
                    style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
                    className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
                  >
                    🏛️ 어드민 콘솔 [신앙 상담실] 화면으로 바로 이동하기 ➔
                  </button>
                  <button
                    onClick={() => {
                      setShowCounselingModal(false);
                      triggerHolyBenediction2F('이성현 담임목사님', playerName, playerIdxRef.current);
                    }}
                    style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                    className="w-full py-2.5 rounded-2xl font-black text-xs cursor-pointer"
                  >
                    ✨ 면담 후 담임목사님 축도(홀리라이트) 받기
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPastorCounseling} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 block">면담 분야 선택</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['신앙·영적고민', '가정·자녀기도', '일터·진로심방'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCounselCategory(cat)}
                        className={`py-2 rounded-xl text-[11px] font-black border cursor-pointer ${
                          counselCategory === cat
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">면담 제목 *</label>
                  <input
                    type="text"
                    value={counselTitle}
                    onChange={(e) => setCounselTitle(e.target.value)}
                    placeholder="예: 가정의 평안과 신앙 성장을 위한 1:1 면담 요청"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">나누고 싶은 말씀 및 기도제목 *</label>
                  <textarea
                    rows={4}
                    value={counselContent}
                    onChange={(e) => setCounselContent(e.target.value)}
                    placeholder="목사님과 1:1로 나누고 싶은 고민이나 중보기도 제목을 편안하게 적어주세요..."
                    className="w-full p-3 rounded-xl bg-black border border-white/15 text-xs text-white outline-none resize-none focus:border-purple-400"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingCounsel}
                    style={{ backgroundColor: '#10B981', color: '#030712' }}
                    className="flex-1 py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
                  >
                    {isSubmittingCounsel ? '전송 중...' : '📝 면담 신청 등록하기'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNavigateToAdminCounseling}
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)', color: '#DDD6FE' }}
                    className="px-3.5 py-3 rounded-2xl border border-purple-500/40 font-black text-xs cursor-pointer whitespace-nowrap"
                  >
                    어드민 상담실 ➔
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. 담임목사님 · 바리스타 · 행정간사 · 카페 성도 1:1 대화 모달 */}
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

            {selectedChatNpc.canBless && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const pastorName = selectedChatNpc.name;
                    setSelectedChatNpc(null);
                    triggerHolyBenediction2F(pastorName, playerName, playerIdxRef.current);
                  }}
                  style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                  className="py-3 px-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg animate-pulse"
                >
                  ✨ 거룩한 축도(홀리라이트) 받기
                </button>
                <button
                  onClick={() => {
                    setSelectedChatNpc(null);
                    setCounselSubmittedSuccess(false);
                    setShowCounselingModal(true);
                  }}
                  style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
                  className="py-3 px-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
                >
                  📝 1:1 신앙 면담 신청 (어드민 연동)
                </button>
              </div>
            )}

            {selectedChatNpc.isOfficeStaff && (
              <button
                onClick={() => {
                  playKeyboardClackSound();
                  setChatReplyText(`(타다다닥! ⌨️) 와! ${playerName}님이 마주 보는 책상에 앉아 도와주시니 주보랑 사역 자료가 순식간에 완성되었어요! 감사합니다 🥰`);
                  triggerSocialAction('typing', '행정사무실에서 컴퓨터로 주보와 사역 자료를 다다닥 작성합니다 💻');
                }}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs cursor-pointer"
              >
                💻 마주 보는 데스크에 앉아 다다닥 컴퓨터 행정 업무 돕기
              </button>
            )}

            <div className="space-y-1.5">
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => {
                    setHasCoffeeCup(true);
                    setChatReplyText(`네 ${playerName}님! 갓 내린 따뜻한 스페셜티 아메리카노와 베이커리 대령했습니다 ☕ 손에 들고 성도님들과 맛있게 드세요 🥰`);
                    triggerSocialAction('coffee', '따뜻한 아메리카노를 받아 들고 성도님들과 함께 마십니다 ☕');
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}
                  className="w-full p-2.5 rounded-xl hover:bg-amber-500/25 border border-white/10 text-left text-xs font-bold cursor-pointer transition-all"
                >
                  ☕ "따뜻한 스페셜티 아메리카노 주문하고 같이 마실게요!"
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  handleSitOnSeat({
                    x: 1.6,
                    z: -2.62,
                    rotY: Math.PI,
                    rowLabel: '2F 북카페 파스텔 라운지석',
                    withCoffee: true
                  });
                  triggerSocialAction('coffee', '카페 테이블에 앉아 성도님들과 함께 커피를 마십니다 ☕');
                  setSelectedChatNpc(null);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🪑 카페 앉아 같이 커피 마시기
              </button>
              <button
                onClick={handleNavigateToAdminCounseling}
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)', color: '#DDD6FE' }}
                className="py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer border border-purple-500/40"
              >
                🏛️ 어드민 상담실 바로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 구역 상세 안내 & 전 층(1F~6F) 이동 모달 */}
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
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반' },
                  { fl: '7F', label: '7F 루프탑 하늘정원 · 한강신도시 전망대' }
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
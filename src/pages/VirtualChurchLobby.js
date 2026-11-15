// src/pages/VirtualChurchLobby.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

// =====================================================================
// 👑 축도(Benediction) 권한을 가진 우리 교회 3대 목사님 명단
// =====================================================================
const BLESSING_PASTORS = ['이성현', '방희곤', '최수경'];

const isAuthorizedPastor = (name = '', office = '') => {
  const clean = String(name).trim();
  if (BLESSING_PASTORS.some((p) => clean.includes(p))) return true;
  if (String(office).includes('목사')) return true;
  return false;
};

// =====================================================================
// 🔔 사운드 신시사이저 (엘리베이터 차임벨 & 거룩한 축도 홀리라이트 오르간 화음)
// =====================================================================
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

    // 천상의 F 메이저 7th 하프 & 오르간 아르페지오 화음
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

// =====================================================================
// 🎨 고해상도 캔버스 텍스처 생성기
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
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 56);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 46px sans-serif';
    ctx.fillText(title, w / 2, 126);
  }, 420, 180);
}

// =====================================================================
// 📍 1층 7대 인터랙션 존 정의 (주보/홍보물 키오스크 존 추가!)
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
    desc: '진초록색 어닝과 다품종 관엽식물 화분, 파란색 LED 예배 안내판과 보라색 행복 배너가 반겨주는 1층 정문 출입구입니다.',
    stats: [
      { label: '주일 대예배', val: '1부 09:00 / 2부 11:00 (3F 대예배당)' },
      { label: '교역자진', val: '이성현 목사님 · 방희곤 목사님 · 최수경 목사님' }
    ],
    actions: [
      { label: '☕ 2F 북카페·목양실 가기', jumpFloor: '2F' },
      { label: '🛗 3F 대예배당 바로가기', jumpFloor: '3F' }
    ]
  },
  {
    id: 'zone_1f_lounge_chair',
    code: '02',
    subCode: '의자',
    name: '좌측 상단 4인용 크롬 가죽 대기 벤치 & 안내석',
    prompt: '02 로비 대기 의자에 앉아 쉬기',
    pos: [-2.6, 0, -2.0],
    seatTarget: { x: -3.48, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F 로비 4인용 가죽 대기석' },
    isSeatZone: true,
    badge: '02 로비 대기석(의자)',
    title: '🪑 1층 로비 4인용 크롬 가죽 벤치 & 원목 장의자 라운지',
    desc: '크롬 스틸 프레임에 푹신한 차콜 블랙 가죽 쿠션이 장착된 4인용 로비 대기 의자와 클래식 원목 장의자입니다. 클릭하시면 편안하게 착석합니다.'
  },
  {
    id: 'zone_1f_parking',
    code: '03',
    subCode: '주차장',
    name: '좌측 필로티 주차장 (주차팀 인사 & 아이오닉 5 · 아반떼 N)',
    prompt: '03 주차봉사팀과 인사 & 차량 안내',
    pos: [-5.6, 0, 2.2],
    badge: '03 필로티 주차장',
    title: '🚗 좌측 필로티 주차장 & 주차봉사팀 환영 인사',
    desc: '컬러 밴드 필로티 기둥 아래 현대 아이오닉 5(화이트)와 아반떼 N(퍼포먼스 블루)이 주차되어 있으며, 주차팀 최집사님과 반갑게 인사하고 측면 유리문으로 로비에 입장할 수 있습니다.',
    stats: [
      { label: '주차 차량', val: '아이오닉 5 EV / 아반떼 N 퍼포먼스 블루' },
      { label: '로비 직결문', val: '주차장 우측 측면 유리문 ➔ 1층 로비 직결' }
    ]
  },
  {
    id: 'zone_1f_elevator',
    code: '04',
    subCode: '엘베',
    name: '우측 상단 스테인리스 자동 개폐 엘리베이터',
    prompt: '04 엘리베이터 탑승 (문 열림 & 2F~6F 이동)',
    pos: [1.8, 0, -2.8],
    isElevator: true,
    badge: '04 엘리베이터',
    title: '🛗 전 층 연결 스테인리스 자동 개폐 엘리베이터 (1F~6F)',
    desc: '다가가거나 클릭하면 "띵동~" 차임벨과 함께 브러시드 스테인리스 양문이 부드럽게 열리며 2층(북카페·목양실), 3층(본당), 4층(자모실), 5층(소예배실), 6층(교육관)으로 이동합니다!'
  },
  {
    id: 'zone_1f_up_stairs',
    code: '05',
    subCode: '계단',
    name: '우측 중단 상층부 연결 계단실',
    prompt: '05 계단으로 2F·3F·4F·5F·6F 올라가기',
    pos: [1.8, 0, 0.2],
    isElevator: true,
    badge: '05 상층 계단실',
    title: '🪜 우측 중단 전 층 연결 계단실 (1F ➔ 2F~6F)',
    desc: '엘리베이터 바로 옆에 위치한 상층부 도보 이동 계단실입니다.'
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
  },
  {
    id: 'zone_1f_brochure_kiosk',
    code: '07',
    subCode: '홍보물·주보',
    name: '안내데스크 교회 홍보물 브로슈어 & 디지털 주보 키오스크',
    prompt: '07 교회 홍보물 & 디지털 주보 보기',
    pos: [-0.8, 0, -2.35],
    isBrochureZone: true,
    badge: '07 홍보물·주보·방명록',
    title: '📰 좋은나무교회 홍보 브로슈어 & 디지털 주보 키오스크',
    desc: '우리 교회 비전 소개서, 주일 예배 안내, 기적이 상식이 되는 5일의 기도 브로슈어와 실시간 로비 방문객 방명록을 확인하실 수 있습니다.'
  }
];

// =====================================================================
// 🚧 물리 충돌(AABB) 및 문 통과 네비게이션
// =====================================================================
const WALL_COLLIDERS_1F = [
  { minX: -4.4, maxX: -1.85, minZ: 4.15, maxZ: 4.65 },
  { minX: 0.45, maxX: 5.5, minZ: 4.15, maxZ: 4.65 },
  { minX: -4.45, maxX: -3.95, minZ: -4.6, maxZ: 1.45 },
  { minX: -4.45, maxX: -3.95, minZ: 2.95, maxZ: 4.6 },
  { minX: -4.2, maxX: -2.85, minZ: 0.95, maxZ: 1.35 },
  { minX: 0.95, maxX: 2.35, minZ: 0.95, maxZ: 1.35 },
  { minX: -4.1, maxX: -3.15, minZ: -3.6, maxZ: -0.4 },
  { minX: 2.15, maxX: 2.65, minZ: -4.6, maxZ: -3.55 },
  { minX: 2.15, maxX: 2.65, minZ: -2.05, maxZ: -0.4 },
  { minX: 2.15, maxX: 2.65, minZ: 0.8, maxZ: 2.1 },
  { minX: -10.2, maxX: -7.8, minZ: -3.2, maxZ: 1.6 }
];

function isBlocked1F(x, z) {
  if (x < -10.5 || x > 5.2 || z < -4.4 || z > 7.8) return true;
  for (const b of WALL_COLLIDERS_1F) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
  }
  return false;
}

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

  if (curX < -4.2 && tx >= -4.2) {
    waypoints.push([-5.0, 2.2]);
    waypoints.push([-2.2, 2.2]);
  } else if (curX >= -4.2 && tx < -4.2) {
    waypoints.push([-2.2, 2.2]);
    waypoints.push([-5.0, 2.2]);
  }

  if ((curZ - 1.2) * (tz - 1.2) < 0 && tx >= -4.2) {
    waypoints.push([-0.8, 1.2]);
  }

  waypoints.push([tx, tz]);
  return waypoints;
}

// =====================================================================
// 👥 1층 로비·주차장 NPC 데이터 (우리 교회 3대 목사님 축도 NPC 포함!)
// =====================================================================
const NPCS_1F = [
  {
    id: 'pastor_lee_1f',
    name: '이성현 목사님',
    role: '좋은나무교회 담임목사 · 축도 사역',
    isPastor: true,
    canBless: true,
    x: -0.2,
    z: -1.8,
    gender: 'male',
    hairStyle: 'parted',
    rotY: 0,
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '사랑하는 성도님 반갑습니다! 오늘도 주님의 은혜와 평강이 가정 위에 넘치길 축복합니다 ✝️',
      '저를 클릭하셔서 [✨ 목사님께 축도 받기]를 누르시면 하늘의 거룩한 홀리라이트 축복이 임합니다 🙏'
    ]
  },
  {
    id: 'pastor_bang_1f',
    name: '방희곤 목사님',
    role: '좋은나무교회 목사 · 축도 사역',
    isPastor: true,
    canBless: true,
    x: -1.65,
    z: -1.8,
    gender: 'male',
    hairStyle: 'short',
    rotY: 0.25,
    shirt: '#1E3A8A',
    pants: '#0F172A',
    hair: '#27272A',
    dialogues: [
      '할렐루야! 성도님 한 주간도 말씀과 기도로 승리하셨나요? 😊',
      '함께 기도하며 주님의 이름으로 축도해 드리겠습니다!'
    ]
  },
  {
    id: 'pastor_choi_1f',
    name: '최수경 목사님',
    role: '좋은나무교회 목사 · 축도 사역',
    isPastor: true,
    canBless: true,
    x: 0.85,
    z: -1.8,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    rotY: -0.25,
    shirt: '#4F46E5',
    pants: '#E0E7FF',
    hair: '#3F2305',
    dialogues: [
      '성도님 샬롬! 주님의 따뜻한 사랑과 위로가 마음 가득 채워지길 소망해요 🥰',
      '언제든 축도와 기도가 필요하시면 말씀해 주세요 🙏'
    ]
  },
  {
    id: 'npc_1f_usher',
    name: '박집사 (로비안내)',
    role: '1층 정문 로비 안내위원',
    x: -0.8,
    z: 2.4,
    patrolZ: [-0.8, 3.2],
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    rotY: 0,
    shirt: '#0284C7',
    pants: '#BAE6FD',
    hair: '#5C3A21',
    dialogues: [
      '할렐루야! 좋은나무교회 1층 로비에 오신 것을 환영합니다 😊',
      '안내데스크 옆 키오스크에서 교회 홍보물과 주일 주보를 보실 수 있어요!',
      '이성현·방희곤·최수경 목사님께 가면 거룩한 축도를 받으실 수 있습니다 ✨'
    ]
  },
  {
    id: 'npc_1f_lounge',
    name: '김권사 (새가족환영)',
    role: '새가족 환영위원회 권사',
    x: -3.48,
    z: -1.62,
    seated: true,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    rotY: Math.PI / 2,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#451A03',
    dialogues: [
      '4인용 크롬 가죽 대기 의자에 앉아 성도님들과 인사 나누니 참 좋네요 🥰',
      '로비에 들어오신 다른 성도님들도 클릭해서 함께 춤추고 기도해 보세요!'
    ]
  },
  {
    id: 'npc_1f_parking',
    name: '최집사 (주차봉사팀)',
    role: '필로티 주차장 안내팀장',
    isParkingTeam: true,
    x: -6.2,
    z: 3.2,
    gender: 'male',
    hairStyle: 'short',
    autoWave: true,
    rotY: 0.4,
    shirt: '#16A34A',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '충성! 할렐루야 성도님! 좋은나무교회 주차봉사팀입니다 🫡🚗',
      '오늘도 안전 운행해 주셔서 감사합니다! 저를 클릭해 반갑게 인사 나눠요!'
    ]
  },
  {
    id: 'npc_1f_elev',
    name: '이청년 (엘베안내)',
    role: '예배 안내 봉사 청년',
    x: 1.45,
    z: -2.2,
    gender: 'male',
    hairStyle: 'parted',
    rotY: -0.5,
    shirt: '#F59E0B',
    pants: '#1E293B',
    hair: '#5C3A21',
    dialogues: [
      '엘리베이터 앞으로 오시면 스틸 자동문이 스르륵 열립니다 🛗',
      '2층 북카페·목양실이나 3층 대예배당으로 바로 올라가실 수 있어요!'
    ]
  }
];

// =====================================================================
// ✨ 4번 요구사항: 축도(Benediction) 시 하늘에서 내려쬐는 홀리라이트(Holy Light) 이펙트!
// =====================================================================
function HolyLightBeamEffect({ targetPos, pastorName, targetName }) {
  const beamRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particlesRef = useRef();

  const blessingBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(120, 53, 15, 0.92)');
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.96)');
      grad.addColorStop(1, 'rgba(120, 53, 15, 0.92)');
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
      ctx.fillText(`✝️ ${pastorName || '목사님'}의 축도 (HOLY BENEDICTION)`, w / 2, 46);

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
      beamRef.current.material.opacity = 0.34 + Math.sin(t * 4) * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 1.8;
      const s = 1 + Math.sin(t * 3) * 0.12;
      ring1Ref.current.scale.set(s, s, 1);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 2.2;
      ring2Ref.current.position.y = 0.6 + ((t * 0.8) % 2.4);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 1.2;
      particlesRef.current.position.y = (t * 0.9) % 2.2;
    }
  });

  if (!targetPos) return null;

  return (
    <group position={[targetPos[0], 0.05, targetPos[2]]}>
      {/* 하늘에서 내려쬐는 거대한 황금빛 홀리라이트 빛기둥 */}
      <mesh ref={beamRef} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.95, 0.68, 6.4, 32, 1, true]} />
        <meshBasicMaterial
          color="#FDE047"
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* 내부 고휘도 화이트 코어 빛기둥 */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.38, 0.28, 6.4, 24, 1, true]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 바닥 황금빛 성령의 마법진 링 */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.52, 0.76, 36]} />
        <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.72, 36]} />
        <meshBasicMaterial color="#FEF08A" transparent opacity={0.35} />
      </mesh>

      {/* 몸을 타고 하늘로 승천하는 황금 엔젤 링 */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <ringGeometry args={[0.45, 0.54, 32]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* 떠오르는 십자가·황금 빛 입자 12개 */}
      <group ref={particlesRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          const rad = 0.35 + (i % 3) * 0.14;
          const py = (i / 12) * 2.2;
          return (
            <mesh key={i} position={[Math.cos(ang) * rad, py, Math.sin(ang) * rad]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} />
            </mesh>
          );
        })}
      </group>

      {/* 캐릭터 위를 비추는 실제 천상 스포트라이트 광원 */}
      <pointLight position={[0, 2.6, 0]} intensity={5.5} distance={6.5} color="#FDE047" />

      {/* 축도 선포 홀로그램 배너 */}
      <Billboard position={[0, 2.35, 0]}>
        <mesh renderOrder={30}>
          <planeGeometry args={[2.5, 0.64]} />
          <meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🏎️ 정문 도로를 질주하는 #32 블루 GT 레이싱 슈퍼카 & 주차장 차량들
// =====================================================================
function MovingRacingSupercar1F() {
  const carRef = useRef();
  const wheelsRef = useRef([]);

  const number32Tex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#090A0F';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#090A0F';
      ctx.font = 'italic 900 78px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('32', w / 2, h / 2 + 4);
    }, 160, 140);
  }, []);

  useFrame((_, delta) => {
    if (carRef.current) {
      carRef.current.position.x += delta * 4.2;
      if (carRef.current.position.x > 9.5) carRef.current.position.x = -12.5;
    }
    wheelsRef.current.forEach((w) => {
      if (w) w.rotation.z -= delta * 14.0;
    });
  });

  return (
    <group ref={carRef} position={[-6, 0.24, 7.6]}>
      <RoundedBox args={[2.35, 0.34, 1.12]} position={[0, 0.04, 0]} radius={0.10} castShadow receiveShadow>
        <meshStandardMaterial color="#0284C7" metalness={0.65} roughness={0.18} />
      </RoundedBox>
      {[[-0.68, -0.52], [-0.68, 0.52], [0.68, -0.52], [0.68, 0.52]].map(([fx, fz], fi) => (
        <mesh key={fi} position={[fx, 0.08, fz]} scale={[1.35, 0.72, 0.45]} castShadow>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial color="#0369A1" metalness={0.65} roughness={0.2} />
        </mesh>
      ))}
      <RoundedBox args={[0.42, 0.05, 1.18]} position={[1.05, -0.10, 0]} radius={0.015}>
        <meshStandardMaterial color="#090A0F" roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.35, 0.03, 1.19]} position={[1.08, -0.12, 0]} radius={0.01}>
        <meshStandardMaterial color="#EF4444" />
      </RoundedBox>
      <mesh position={[-0.08, 0.24, 0]} scale={[1.55, 0.62, 0.86]} castShadow>
        <sphereGeometry args={[0.44, 24, 24]} />
        <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.1} />
      </mesh>
      {[-0.57, 0.57].map((dz, di) => (
        <mesh key={di} position={[0.05, 0.06, dz]} rotation={[0, di === 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[0.38, 0.24]} />
          <meshBasicMaterial map={number32Tex} />
        </mesh>
      ))}
      <group position={[-1.02, 0.38, 0]}>
        <RoundedBox args={[0.28, 0.035, 1.16]} position={[-0.04, 0.04, 0]} rotation={[0, 0, 0.12]} radius={0.01} castShadow>
          <meshStandardMaterial color="#090A0F" metalness={0.5} roughness={0.3} />
        </RoundedBox>
      </group>
      {[
        [-0.68, -0.56],
        [0.68, -0.56],
        [-0.68, 0.56],
        [0.68, 0.56]
      ].map(([wx, wz], i) => (
        <group key={i} position={[wx, -0.04, wz]} ref={(el) => (wheelsRef.current[i] = el)}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.20, 0.20, 0.16, 24]} />
            <meshStandardMaterial color="#18181B" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DetailedIoniq5EV({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.82, 0.48, 3.55]} position={[0, 0.40, 0]} radius={0.09} castShadow receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.22} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[1.84, 0.12, 3.58]} position={[0, 0.22, 0]} radius={0.03}>
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.56, 0.46, 2.15]} position={[0, 0.82, -0.18]} radius={0.12} castShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.22} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.34, 1.92]} position={[0, 0.82, -0.16]} radius={0.06}>
        <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.68, 0.12, 0.05]} position={[0, 0.50, 1.76]} radius={0.02}>
        <meshStandardMaterial color="#090A0F" roughness={0.2} />
      </RoundedBox>
      {[-0.64, -0.46, 0.46, 0.64].map((px, pi) => (
        <RoundedBox key={pi} args={[0.13, 0.075, 0.06]} position={[px, 0.50, 1.765]} radius={0.01}>
          <meshBasicMaterial color="#FFFFFF" />
        </RoundedBox>
      ))}
      {[
        [-0.84, -1.12],
        [0.84, -1.12],
        [-0.84, 1.12],
        [0.84, 1.12]
      ].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.25, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.22, 24]} />
            <meshStandardMaterial color="#18181B" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DetailedAvanteNBlue({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.76, 0.42, 3.62]} position={[0, 0.36, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.20} metalness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.80, 0.04, 3.66]} position={[0, 0.17, 0]} radius={0.01}>
        <meshStandardMaterial color="#EF4444" />
      </RoundedBox>
      <RoundedBox args={[1.48, 0.40, 1.95]} position={[0, 0.72, -0.15]} radius={0.10} castShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.20} metalness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.50, 0.30, 1.75]} position={[0, 0.72, -0.15]} radius={0.05}>
        <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.66, 0.24, 0.06]} position={[0, 0.32, 1.80]} radius={0.02}>
        <meshStandardMaterial color="#090A0F" roughness={0.3} />
      </RoundedBox>
      {[
        [-0.82, -1.10],
        [0.82, -1.10],
        [-0.82, 1.10],
        [0.82, 1.10]
      ].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.23, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.23, 0.23, 0.20, 24]} />
            <meshStandardMaterial color="#18181B" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// 🪑 4인용 크롬 프레임 블랙 가죽 로비 대기 의자 & 관엽식물 & 스테인리스 엘리베이터
// =====================================================================
function FourSeaterChromeLobbyBench({ position, rotationY = 0, onSit }) {
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const seatOffsets = [-1.08, -0.36, 0.36, 1.08];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.92, 0.055, 0.055]} position={[0, 0.26, 0.05]} radius={0.02} castShadow>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.92} roughness={0.15} />
      </RoundedBox>
      <RoundedBox args={[2.92, 0.045, 0.045]} position={[0, 0.62, -0.22]} radius={0.02} castShadow>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.92} roughness={0.15} />
      </RoundedBox>

      {[-1.46, 1.46].map((lx, li) => (
        <group key={`leg_${li}`} position={[lx, 0, 0]}>
          <mesh position={[0, 0.24, 0.22]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.48, 16]} />
            <meshStandardMaterial map={steelTex} color="#F8FAFC" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.36, -0.22]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.72, 16]} />
            <meshStandardMaterial map={steelTex} color="#F8FAFC" metalness={0.92} roughness={0.15} />
          </mesh>
          <RoundedBox args={[0.05, 0.04, 0.48]} position={[0, 0.52, 0]} rotation={[0.08, 0, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={steelTex} color="#F8FAFC" metalness={0.92} roughness={0.15} />
          </RoundedBox>
        </group>
      ))}

      {seatOffsets.map((sx, sIdx) => (
        <group
          key={`seat_${sIdx}`}
          position={[sx, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSit) onSit(sx, sIdx + 1);
          }}
        >
          <RoundedBox args={[0.66, 0.11, 0.52]} position={[0, 0.34, 0.04]} radius={0.045} castShadow receiveShadow>
            <meshStandardMaterial color="#27272A" roughness={0.35} metalness={0.1} />
          </RoundedBox>
          <RoundedBox args={[0.66, 0.48, 0.11]} position={[0, 0.60, -0.18]} rotation={[-0.18, 0, 0]} radius={0.045} castShadow receiveShadow>
            <meshStandardMaterial color="#27272A" roughness={0.35} metalness={0.1} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function BotanicalMultiLeafPlant({ position, variant = 'palm', scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {variant === 'ficus_tree' && (
        <group>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.04, 20]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
          <RoundedBox args={[0.36, 0.46, 0.36]} position={[0, 0.26, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </RoundedBox>
          {[-0.04, 0.0, 0.04].map((tx, ti) => (
            <mesh key={ti} position={[tx, 0.78, 0]} rotation={[0, 0, tx * 2]} castShadow>
              <cylinderGeometry args={[0.02, 0.035, 0.72, 10]} />
              <meshStandardMaterial color="#5C4033" roughness={0.7} />
            </mesh>
          ))}
          {Array.from({ length: 16 }).map((_, li) => {
            const ang = (li / 16) * Math.PI * 2;
            const r = 0.12 + (li % 3) * 0.11;
            const ly = 0.88 + (li % 4) * 0.14;
            return (
              <mesh
                key={li}
                position={[Math.cos(ang) * r, ly, Math.sin(ang) * r]}
                scale={[1.2, 0.65, 1.0]}
                castShadow
              >
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color={li % 2 === 0 ? '#22C55E' : '#15803D'} roughness={0.45} />
              </mesh>
            );
          })}
        </group>
      )}

      {variant === 'dracaena' && (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow>
            <sphereGeometry args={[0.22, 20, 16]} />
            <meshStandardMaterial color="#E7E5E4" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.04, 0.55, 10]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
          {Array.from({ length: 14 }).map((_, li) => {
            const ang = (li / 14) * Math.PI * 2;
            const tilt = 0.25 + (li % 3) * 0.22;
            return (
              <group key={li} position={[0, 0.82, 0]} rotation={[0, ang, 0]}>
                <mesh position={[0, 0.22, 0.12]} rotation={[tilt, 0, 0]} scale={[0.18, 1.0, 0.04]} castShadow>
                  <coneGeometry args={[0.16, 0.62, 6]} />
                  <meshStandardMaterial color={li % 2 === 0 ? '#166534' : '#15803D'} roughness={0.4} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {variant === 'palm' && (
        <group>
          <mesh position={[0, 0.20, 0]} castShadow>
            <cylinderGeometry args={[0.20, 0.14, 0.40, 20]} />
            <meshStandardMaterial color="#44403C" roughness={0.5} />
          </mesh>
          {Array.from({ length: 10 }).map((_, li) => {
            const ang = (li / 10) * Math.PI * 2;
            return (
              <group key={li} position={[0, 0.36, 0]} rotation={[0, ang, 0]}>
                <mesh position={[0, 0.28, 0.18]} rotation={[0.55, 0, 0]} scale={[0.55, 1.0, 0.08]} castShadow>
                  <sphereGeometry args={[0.24, 12, 12]} />
                  <meshStandardMaterial color={li % 2 === 0 ? '#4ADE80' : '#16A34A'} roughness={0.45} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}

function AnimatedStainlessElevator1F({ position, rotationY = -Math.PI / 2, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);

  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - (position[0] - 1.2), pz - position[2]);
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
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickElevator) onClickElevator();
      }}
    >
      <group position={[0, 0, -0.55]}>
        <RoundedBox args={[1.75, 0.06, 1.15]} position={[0, 0.03, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.75, 0.06, 1.15]} position={[0, 2.22, 0]} radius={0.01}>
          <meshBasicMaterial color="#FFFBEB" />
        </RoundedBox>
        <RoundedBox args={[1.75, 2.28, 0.08]} position={[0, 1.14, -0.55]} radius={0.01}>
          <meshStandardMaterial map={oakTex} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 1.42, -0.49]}>
          <planeGeometry args={[1.32, 0.98]} />
          <meshBasicMaterial map={mirrorTex} />
        </mesh>
        <RoundedBox args={[0.12, 2.45, 1.35]} position={[-1.08, 1.22, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <RoundedBox args={[0.12, 2.45, 1.35]} position={[1.08, 1.22, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <RoundedBox args={[2.28, 0.14, 1.38]} position={[0, 2.42, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
        <pointLight position={[0, 1.95, 0]} intensity={1.6} distance={3.5} color="#FFFBEB" />
      </group>

      <group position={[0, 1.06, 0.04]}>
        <RoundedBox
          ref={leftDoorRef}
          args={[0.67, 2.08, 0.05]}
          position={[-0.34, 0, 0]}
          radius={0.008}
          castShadow
          receiveShadow
          userData={{ keepOpaque: true }}
        >
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.88} roughness={0.18} />
        </RoundedBox>
        <RoundedBox
          ref={rightDoorRef}
          args={[0.67, 2.08, 0.05]}
          position={[0.34, 0, 0]}
          radius={0.008}
          castShadow
          receiveShadow
          userData={{ keepOpaque: true }}
        >
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.88} roughness={0.18} />
        </RoundedBox>
      </group>

      <RoundedBox args={[0.28, 2.36, 0.24]} position={[-0.82, 1.18, 0.06]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.9} roughness={0.16} />
      </RoundedBox>
      <RoundedBox args={[0.28, 2.36, 0.24]} position={[0.82, 1.18, 0.06]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.9} roughness={0.16} />
      </RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.26]} position={[0, 2.23, 0.06]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.9} roughness={0.16} />
      </RoundedBox>

      {showRoomSigns && (
        <Billboard position={[0, 2.65, 0]}>
          <mesh>
            <planeGeometry args={[1.15, 0.52]} />
            <meshBasicMaterial map={signTex} transparent />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

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
      if (child.isMesh && child.material && !child.userData?.keepOpaque) {
        child.material.transparent = true;
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.16);
        child.material.depthWrite = child.material.opacity > 0.45;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}

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
        ctx.roundRect(w / 2 + 28, h / 2 + 6, 108, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 82, h / 2 + 28);
      }
    }, 360, 220);
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
// 🚶‍♀️ 6대 소셜 동작(인사·춤추기·기도하기·할렐루야·하트·축도)이 탑재된 3D 아바타
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

function CharacterHairStyle1F({ style = 'short', hairColor = '#27272A' }) {
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

function SmoothChibiAvatar1F({
  position = [0, 0, 0],
  targetPosition = null, // 멀티플레이어 원격 보간용 타겟 좌표
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  gender = 'male',
  hairStyle = 'short',
  isSkirt = false,
  autoWave = false,
  hasSunglasses = false,
  emote = null, // 'wave' | 'dance' | 'pray' | 'praise' | 'heart' | 'bless'
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

    // 1) 원격 멀티플레이어 유저 부드러운 LERP 이동
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

    // 2) 다리 애니메이션 (착석 / 춤추기 / 보행 / 대기)
    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.24, 0.11);
        rightLegRef.current.position.set(0.085, 0.24, 0.11);
      } else if (emote === 'dance') {
        const danceKick = Math.sin(t * 14.0) * 0.65;
        leftLegRef.current.rotation.x = danceKick;
        rightLegRef.current.rotation.x = -danceKick;
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

    // 3) 팔 애니메이션 (축도 / 기도 / 춤추기 / 할렐루야 / 손흔들기 / 보행)
    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'bless') {
        // 목사님 축도 자세: 두 팔을 앞으로 높이 들어 축복 선포
        leftArmRef.current.rotation.x = -2.1;
        rightArmRef.current.rotation.x = -2.1;
        leftArmRef.current.rotation.z = 0.35;
        rightArmRef.current.rotation.z = -0.35;
      } else if (emote === 'pray') {
        // 기도 자세: 가슴 앞으로 두 손을 간절히 모음
        leftArmRef.current.rotation.x = -1.15;
        rightArmRef.current.rotation.x = -1.15;
        leftArmRef.current.rotation.z = -0.42;
        rightArmRef.current.rotation.z = 0.42;
      } else if (emote === 'dance') {
        // 워십 댄스: 양팔을 번갈아 흔들며 리듬 타기
        leftArmRef.current.rotation.z = 2.4 + Math.sin(t * 12) * 0.45;
        rightArmRef.current.rotation.z = -2.4 + Math.cos(t * 12) * 0.45;
        leftArmRef.current.rotation.x = Math.sin(t * 6) * 0.3;
        rightArmRef.current.rotation.x = -Math.sin(t * 6) * 0.3;
      } else if (emote === 'praise' || emote === 'heart') {
        // 할렐루야 / 하트: 두 팔을 머리 위로 번쩍 들어 흔듦
        leftArmRef.current.rotation.z = 2.65 + Math.sin(t * 8) * 0.2;
        rightArmRef.current.rotation.z = -2.65 - Math.sin(t * 8) * 0.2;
        leftArmRef.current.rotation.x = 0.2;
        rightArmRef.current.rotation.x = 0.2;
      } else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
        leftArmRef.current.rotation.z = 0.14;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.42;
        rightArmRef.current.rotation.x = -0.42;
        leftArmRef.current.rotation.z = 0.1;
        rightArmRef.current.rotation.z = -0.1;
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.48;
        leftArmRef.current.rotation.x = -sw;
        rightArmRef.current.rotation.x = sw;
        leftArmRef.current.rotation.z = 0.12;
        rightArmRef.current.rotation.z = -0.12;
      } else {
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.06;
        rightArmRef.current.rotation.x = -Math.sin(t * 2) * 0.06;
        leftArmRef.current.rotation.z = 0.14;
        rightArmRef.current.rotation.z = -0.14;
      }
    }

    if (headGroupRef.current) {
      if (emote === 'pray') {
        headGroupRef.current.rotation.x = 0.32; // 기도할 때 고개를 숙임
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
      rootRef.current.rotation.y = emote === 'dance' ? Math.sin(t * 6) * 0.45 : 0;
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

          <CharacterHairStyle1F
            style={hairStyle || (isFemale ? 'bob' : 'short')}
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
              <planeGeometry args={[1.55, 0.34]} />
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

// =====================================================================
// 🌐 멀티플레이어 원격 접속 성도 아바타 렌더러
// =====================================================================
function RemoteMultiplayerAvatar1F({ peer, onClickPeer }) {
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
    <SmoothChibiAvatar1F
      position={[peer.x || -0.8, 0.08, peer.z || 2.2]}
      targetPosition={[peer.x || -0.8, 0.08, peer.z || 2.2]}
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
// 🏛️ 1층 초디테일 마스터피스 디오라마 씬 (샹들리에 · 홍보 키오스크 · 브로슈어 랙 포함)
// =====================================================================
function OneFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  onSitOnSofa,
  onSelectNpcForChat,
  onOpenBrochureModal,
  activeNpcChatIdx,
  showRoomSigns,
  playerIdxRef,
  isElevatorModalOpen,
  remotePeers,
  onSelectRemotePeer,
  holyLightEvent
}) {
  const marbleTex = useMemo(() => makeLobbyMarbleTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);
  const walnutTex = useMemo(() => makeWoodGrainTexture('#5C3418', '#3B220C'), []);

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
      ctx.fillText('2F 북카페 / 3F 대예배당', w / 2, 245);
      ctx.fillText('4F 유아실 / 6F 교육관', w / 2, 295);
    }, 320, 420)
  }), []);

  const signs = useMemo(() => ({
    lounge: makeRoomSignTexture('4인용 로비 대기석', '크롬 가죽 벤치 · 새가족 영접', '#F59E0B'),
    elevator: makeRoomSignTexture('1F 엘리베이터 🛗', '자동문 개폐 · 전 층(2F~6F) 이동', '#10B981'),
    upStairs: makeRoomSignTexture('상층 연결 계단', '2F · 3F · 4F · 6F 도보 이동', '#0284C7'),
    b1Stairs: makeRoomSignTexture('B1F 계단실', '지하 1층 내려가는 계단', '#6366F1'),
    parking: makeRoomSignTexture('필로티 주차장 🚗', '주차팀 인사 · 아이오닉5 · 아반떼N', '#3B82F6'),
    brochure: makeRoomSignTexture('홍보물·주보 키오스크', '클릭 시 주보·비전·방명록 열기', '#EC4899')
  }), []);

  return (
    <group>
      {/* 1. 정문 앞 보도블록 인도 & 아스팔트 차도 & #32 블루 GT 레이싱 슈퍼카 주행 */}
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
      <MovingRacingSupercar1F />

      {/* 2. 좌측 필로티 주차장 */}
      <group position={[-7.6, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.2]} receiveShadow>
          <planeGeometry args={[6.6, 9.2]} />
          <meshStandardMaterial color="#3B4252" roughness={0.8} />
        </mesh>
        {[-2.4, 0.0, 2.4].map((pz, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.02, pz]}>
            <planeGeometry args={[3.4, 0.10]} />
            <meshBasicMaterial color="#F8FAFC" />
          </mesh>
        ))}
        {[-1.2, 1.2].map((sz, si) => (
          <RoundedBox key={si} args={[0.16, 0.10, 1.5]} position={[-2.65, 0.05, sz]} radius={0.02}>
            <meshStandardMaterial color="#FACC15" />
          </RoundedBox>
        ))}

        {[
          [-2.6, 4.2], [2.6, 4.2], [-2.6, -3.5], [2.6, -3.5]
        ].map(([cx, cz], idx) => (
          <group key={`piloti_${idx}`} position={[cx, 0, cz]}>
            <RoundedBox args={[0.54, 3.2, 0.54]} position={[0, 1.6, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </RoundedBox>
            <RoundedBox args={[0.56, 0.65, 0.56]} position={[0, 2.05, 0]} radius={0.015}>
              <meshStandardMaterial color={idx % 2 === 0 ? '#EAB308' : '#0284C7'} roughness={0.35} />
            </RoundedBox>
            <RoundedBox args={[0.57, 0.14, 0.57]} position={[0, 1.66, 0]} radius={0.01}>
              <meshStandardMaterial color="#15803D" />
            </RoundedBox>
            <RoundedBox args={[0.56, 1.58, 0.56]} position={[0, 0.79, 0]} radius={0.015}>
              <meshStandardMaterial color="#475569" roughness={0.5} />
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

        <DetailedIoniq5EV position={[-1.25, 0, -1.35]} rotationY={Math.PI / 2} />
        <DetailedAvanteNBlue position={[-1.25, 0, 1.15]} rotationY={Math.PI / 2} />

        {showRoomSigns && (
          <Billboard position={[0.5, 1.75, 2.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.parking} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 3. 1층 메인 로비 대리석 홀 & 샹들리에 & 홍보물 키오스크 & 4인용 크롬 가죽 대기 의자 */}
      <group>
        <RoundedBox args={[9.0, 0.08, 8.8]} position={[0.3, 0.04, 0.0]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={marbleTex} roughness={0.25} />
        </RoundedBox>

        {/* 정문 입구 레드/골드 웰컴 카펫 매트 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.7, 0.085, 3.35]} receiveShadow>
          <planeGeometry args={[2.2, 1.15]} />
          <meshStandardMaterial color="#991B1B" roughness={0.8} />
        </mesh>

        {/* 로비 천장 황금 링 크리스탈 샹들리에 */}
        <group position={[-0.5, 2.85, 0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.85, 0.035, 16, 48]} />
            <meshStandardMaterial color="#FACC15" emissive="#F59E0B" emissiveIntensity={1.2} metalness={0.8} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
            <torusGeometry args={[0.52, 0.028, 16, 36]} />
            <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.5} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={2.2} distance={9} color="#FEF3C7" />
        </group>

        {/* 방풍 가벽 & 상단 우드 몰딩 */}
        <RoundedBox args={[1.35, 1.45, 0.20]} position={[-3.5, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.38, 0.06, 0.24]} position={[-3.5, 1.46, 1.15]} radius={0.01}>
          <meshStandardMaterial map={oakTex} />
        </RoundedBox>
        <RoundedBox args={[1.35, 1.45, 0.20]} position={[1.65, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.38, 0.06, 0.24]} position={[1.65, 1.46, 1.15]} radius={0.01}>
          <meshStandardMaterial map={oakTex} />
        </RoundedBox>

        {/* 좌측 상단 4인용 크롬 프레임 블랙 가죽 로비 대기 의자 */}
        <group position={[-3.48, 0.08, -2.0]}>
          <FourSeaterChromeLobbyBench
            position={[0, 0, 0]}
            rotationY={Math.PI / 2}
            onSit={(offsetZ, seatNum) => {
              onSitOnSofa({
                x: -3.48,
                z: -2.0 - offsetZ,
                rotY: Math.PI / 2,
                rowLabel: `1F 로비 4인용 가죽 대기 의자 (${seatNum}번석)`
              });
            }}
          />

          {/* 서쪽 벽면: 교회 소식·주보 코르크 게시판 (클릭 시 홍보물/주보 모달 오픈!) */}
          <group
            position={[-0.60, 1.38, 0]}
            rotation={[0, Math.PI / 2, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBrochureModal) onOpenBrochureModal();
            }}
          >
            <RoundedBox args={[1.85, 0.92, 0.04]} radius={0.015} castShadow>
              <meshStandardMaterial map={oakTex} />
            </RoundedBox>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[1.72, 0.80]} />
              <meshStandardMaterial color="#D6B892" roughness={0.8} />
            </mesh>
            {[-0.55, -0.18, 0.18, 0.55].map((nx, ni) => (
              <RoundedBox key={ni} args={[0.26, 0.34, 0.01]} position={[nx, 0.05, 0.03]} radius={0.005}>
                <meshBasicMaterial color={ni % 2 === 0 ? '#FFFFFF' : '#FEF9C3'} />
              </RoundedBox>
            ))}
          </group>

          {/* 대기석 앞: 이동식 원목 안내/다과 테이블 & 손소독제 보틀 */}
          <group position={[1.05, 0, 0]}>
            <RoundedBox args={[0.68, 0.055, 1.65]} position={[0, 0.52, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial map={oakTex} roughness={0.3} />
            </RoundedBox>
            <RoundedBox args={[0.56, 0.42, 1.52]} position={[0, 0.28, 0]} radius={0.015} castShadow>
              <meshStandardMaterial map={oakTex} roughness={0.4} />
            </RoundedBox>
            <group position={[-0.12, 0.55, 0.52]}>
              <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
                <meshStandardMaterial color="#BAE6FD" transparent opacity={0.8} />
              </mesh>
            </group>
            <RoundedBox args={[0.24, 0.04, 0.32]} position={[0.08, 0.56, -0.35]} radius={0.005}>
              <meshStandardMaterial color="#FFFFFF" />
            </RoundedBox>
          </group>

          {showRoomSigns && (
            <Billboard position={[0.2, 1.65, 0]}>
              <mesh>
                <planeGeometry args={[1.18, 0.52]} />
                <meshBasicMaterial map={signs.lounge} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 북쪽 중앙: 고급 템바보드 웰컴 리셉션 데스크 & 디지털 주보 키오스크 & 3단 홍보 브로슈어 랙 & 백라이트 십자가 아트월! */}
        <group position={[-0.8, 0.08, -3.2]}>
          {/* 북쪽 벽면 백라이트 원목 아트월 & 황금 입체 십자가 */}
          <group position={[0, 1.55, -1.05]}>
            <RoundedBox args={[2.8, 1.65, 0.06]} radius={0.02} castShadow>
              <meshStandardMaterial map={walnutTex} roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.12, 0.045]}>
              <boxGeometry args={[0.09, 0.72, 0.03]} />
              <meshStandardMaterial color="#FACC15" emissive="#F59E0B" emissiveIntensity={1.2} metalness={0.85} />
            </mesh>
            <mesh position={[0, 0.24, 0.045]}>
              <boxGeometry args={[0.46, 0.09, 0.03]} />
              <meshStandardMaterial color="#FACC15" emissive="#F59E0B" emissiveIntensity={1.2} metalness={0.85} />
            </mesh>
          </group>

          <RoundedBox args={[2.0, 0.90, 0.66]} position={[0, 0.45, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </RoundedBox>
          {Array.from({ length: 11 }).map((_, si) => (
            <RoundedBox
              key={si}
              args={[0.05, 0.84, 0.03]}
              position={[-0.85 + si * 0.17, 0.45, 0.33]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial map={oakTex} />
            </RoundedBox>
          ))}
          <RoundedBox args={[2.12, 0.07, 0.74]} position={[0, 0.92, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={walnutTex} roughness={0.25} />
          </RoundedBox>

          {/* 📰 8번 요구사항: 클릭 가능한 3단 교회 홍보 브로슈어 스탠드 & 디지털 터치 주보 키오스크! */}
          <group
            position={[-0.95, 0, 0.55]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBrochureModal) onOpenBrochureModal();
            }}
          >
            {/* 디지털 주보 터치 키오스크 스탠드 */}
            <RoundedBox args={[0.46, 1.38, 0.10]} position={[0, 0.69, 0]} rotation={[-0.12, 0.25, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.2} />
            </RoundedBox>
            <mesh position={[0.01, 0.78, 0.055]} rotation={[-0.12, 0.25, 0]}>
              <planeGeometry args={[0.38, 0.82]} />
              <meshBasicMaterial map={exteriorTextures.blueLedSign} />
            </mesh>
            {/* 옆 3단 홍보 전단지/주보 랙 */}
            <RoundedBox args={[0.36, 0.85, 0.28]} position={[0.45, 0.42, 0]} radius={0.02} castShadow>
              <meshStandardMaterial map={oakTex} />
            </RoundedBox>
            {[0.45, 0.62, 0.78].map((py, pi) => (
              <RoundedBox key={pi} args={[0.28, 0.16, 0.03]} position={[0.45, py, 0.12]} rotation={[-0.25, 0, 0]} radius={0.005}>
                <meshBasicMaterial color={['#FEF08A', '#BAE6FD', '#FBCFE8'][pi]} />
              </RoundedBox>
            ))}
          </group>

          {showRoomSigns && (
            <Billboard position={[-0.65, 1.85, 0.55]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenBrochureModal) onOpenBrochureModal();
                }}
              >
                <planeGeometry args={[1.18, 0.50]} />
                <meshBasicMaterial map={signs.brochure} transparent />
              </mesh>
            </Billboard>
          )}

          {/* 로비 미니 커피 자판기 */}
          <group position={[1.45, 0, -0.25]}>
            <RoundedBox args={[0.58, 1.25, 0.52]} position={[0, 0.625, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.82, 0.265]}>
              <planeGeometry args={[0.44, 0.48]} />
              <meshBasicMaterial color="#FEF3C7" />
            </mesh>
          </group>

          {/* 다품종 관엽식물 3종 세트 */}
          <BotanicalMultiLeafPlant position={[-1.55, 0, 0.15]} variant="ficus_tree" scale={1.08} />
          <BotanicalMultiLeafPlant position={[2.05, 0, 0.15]} variant="dracaena" scale={1.0} />
          <BotanicalMultiLeafPlant position={[-2.15, 0, 2.85]} variant="palm" scale={1.05} />
        </group>

        {/* 우측 클래식 원목 로비 장의자 벤치 */}
        <group
          position={[0.25, 0.08, 1.65]}
          onClick={(e) => {
            e.stopPropagation();
            onSitOnSofa({ x: 0.25, z: 1.65, rotY: 0, rowLabel: '1F 로비 클래식 원목 벤치석' });
          }}
        >
          <RoundedBox args={[1.55, 0.06, 0.44]} position={[0, 0.36, 0]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <RoundedBox args={[1.50, 0.05, 0.40]} position={[0, 0.40, 0]} radius={0.015}>
            <meshStandardMaterial color="#5C3418" />
          </RoundedBox>
          <RoundedBox args={[1.55, 0.42, 0.06]} position={[0, 0.58, -0.19]} rotation={[-0.12, 0, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {[-0.74, 0.74].map((bx, bi) => (
            <RoundedBox key={bi} args={[0.06, 0.52, 0.46]} position={[bx, 0.26, 0]} radius={0.01} castShadow>
              <meshStandardMaterial map={oakTex} />
            </RoundedBox>
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
          </group>
        </group>
      </SmartCutawayWall1F>

      {/* 5. 우측 3단 수직 코어 (스테인리스 자동 개폐 엘리베이터 · 계단 · B1F계단) */}
      <AnimatedStainlessElevator1F
        position={[3.05, 0.08, -2.85]}
        rotationY={-Math.PI / 2}
        playerIdxRef={playerIdxRef}
        forceOpen={isElevatorModalOpen}
        onClickElevator={() => onSelectZone(ZONES_1F[3])}
        signTex={signs.elevator}
        showRoomSigns={showRoomSigns}
      />

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

      {/* 6. 로비 NPC (이성현·방희곤·최수경 목사님 & 안내팀 & 주차팀) */}
      {NPCS_1F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_1F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;
        const isBlessingNow = holyLightEvent && holyLightEvent.pastorName === npc.name;

        return (
          <SmoothChibiAvatar1F
            key={npc.id}
            position={[npc.x, 0.08, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            gender={npc.gender}
            hairStyle={npc.hairStyle}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            emote={isBlessingNow ? 'bless' : null}
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

      {/* 7. 🌐 실시간 멀티플레이어로 접속한 다른 성도들 렌더링 */}
      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar1F
          key={peer.clientId}
          peer={peer}
          onClickPeer={onSelectRemotePeer}
        />
      ))}

      {/* 8. ✨ 축도(Benediction) 발동 시 캐릭터에게 쏟아지는 홀리라이트 이펙트 */}
      {holyLightEvent && (
        <HolyLightBeamEffect
          targetPos={holyLightEvent.targetPos}
          pastorName={holyLightEvent.pastorName}
          targetName={holyLightEvent.targetName}
        />
      )}

      {/* 9. 7대 상호작용 마커 */}
      {ZONES_1F.map((z) => (
        <HologramMarker1F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnSofa(sel.seatTarget);
            } else if (sel.isBrochureZone && onOpenBrochureModal) {
              onOpenBrochureModal();
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
// 🚶‍♂️ 내 플레이어 아바타 컨트롤러 (커스텀 외형 + 말풍선 + 실시간 좌표 송출)
// =====================================================================
function PlayerController1F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  playerOffice,
  avatarConfig,
  emote,
  myChatBubble,
  onPositionUpdate
}) {
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

  useFrame((_, delta) => {
    if (seatedInfo) {
      playerIdxRef.current = [seatedInfo.x, 0.10, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.pos[2] !== seatedInfo.z) {
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
      const [nx, nz] = resolveCollision1F(rawNx, rawNz);
      const ny = nx >= -4.2 && nz <= 4.4 ? 0.08 : 0.02;
      playerIdxRef.current = [nx, ny, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, ny, nz],
        rotY: angle,
        walking: true
      });
      onPositionUpdate(nx, nz, angle);
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
      gender={avatarConfig.gender}
      hairStyle={avatarConfig.hairStyle}
      isSkirt={Boolean(avatarConfig.isSkirt)}
      hasSunglasses={Boolean(avatarConfig.hasSunglasses)}
      isWalking={renderState.walking}
      isSeated={Boolean(seatedInfo)}
      emote={emote}
      shirtColor={avatarConfig.shirtColor}
      pantsColor={avatarConfig.pantsColor}
      hairColor={avatarConfig.hairColor}
      nameTagTexture={nameTagTex}
      speechBubbleText={myChatBubble ? `${playerName}: ${myChatBubble}` : null}
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

// =====================================================================
// 🌟 메인 VirtualChurchLobby 컴포넌트
// =====================================================================
const DEFAULT_AVATAR_CONFIG = {
  gender: 'male',
  hairStyle: 'parted',
  isSkirt: false,
  shirtColor: '#FACC15',
  pantsColor: '#0284C7',
  hairColor: '#27272A',
  hasSunglasses: false
};

export default function VirtualChurchLobby({ setActiveScreen, onChangeFloor }) {
  const authUser = useAppStore((state) => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.8, 0.08, 2.8]);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  // 2번 요구사항: 메타버스 최초 입장 시 무조건 1층 로비로 시작화면 강제 고정!
  useEffect(() => {
    const hasEnteredSession = sessionStorage.getItem('gtc_metaverse_session_entered');
    if (!hasEnteredSession) {
      sessionStorage.setItem('gtc_metaverse_session_entered', '1');
      localStorage.setItem('metaverse_active_floor', '1F');
      if (typeof onChangeFloor === 'function') {
        onChangeFloor('1F');
      }
    }
  }, [onChangeFloor]);

  // 3번 요구사항: 아바타 커스터마이징 상태 (최초 입장 시 커스터마이저 자동 오픈)
  const [avatarConfig, setAvatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gtc_metaverse_avatar_v1');
      return saved ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(saved) } : DEFAULT_AVATAR_CONFIG;
    } catch {
      return DEFAULT_AVATAR_CONFIG;
    }
  });
  const [showAvatarModal, setShowAvatarModal] = useState(() => {
    return !localStorage.getItem('gtc_metaverse_avatar_v1');
  });

  const [waypoints, setWaypoints] = useState([[-0.8, 2.8]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_1F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');

  // 실시간 멀티플레이어 접속자 리스트 & 선택된 상대방 유저
  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);

  // 4번 요구사항: 축도 홀리라이트(Holy Light) 이벤트 상태
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  // 8번 요구사항: 교회 홍보물 & 디지털 주보 & 로비 방명록 모달
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [guestbookList, setGuestbookList] = useState([
    { id: 1, user_name: '이성현 목사', message: '좋은나무교회 메타버스 로비에 오신 모든 성도님들을 축복합니다!', created_at: '오늘' },
    { id: 2, user_name: '김권사', message: '로비에서 성도님들도 만나고 축도도 받을 수 있어서 너무 은혜로워요 🙏', created_at: '오늘' }
  ]);

  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_1F.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // =====================================================================
  // 🌐 Supabase Realtime Presence & Broadcast 멀티플레이어 엔진 (Zero-Lag)
  // =====================================================================
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
        avatar: override.avatar || avatarConfig,
        ts: Date.now()
      };
      channelRef.current.track(payload).catch(() => {});
    },
    [playerName, playerOffice, seatedInfo, emote, myChatBubble, avatarConfig]
  );

  useEffect(() => {
    if (!supabase) return;

    // 방명록 초기 로드
    supabase
      .from('metaverse_guestbook')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data && data.length > 0) setGuestbookList(data);
      })
      .catch(() => {});

    const channel = supabase.channel('metaverse_lobby_1f', {
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
      .on('broadcast', { event: 'holy_blessing' }, ({ payload }) => {
        if (!payload) return;
        playHolyBlessingSound();
        setHolyLightEvent(payload);
        setTimeout(() => setHolyLightEvent(null), 7000);
      })
      .on('broadcast', { event: 'guestbook_new' }, ({ payload }) => {
        if (payload) {
          setGuestbookList((prev) => [payload, ...prev.slice(0, 19)]);
        }
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
            emote: null,
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
  }, [playerName, playerOffice]); // avatarConfig 변경 시엔 broadcastMyState로 갱신

  // 이모트 및 말풍선 발동 헬퍼
  const triggerSocialAction = useCallback(
    (emoteType, chatText = '') => {
      setEmote(emoteType);
      if (chatText) setMyChatBubble(chatText);
      broadcastMyState({ emote: emoteType, chatMsg: chatText });

      setTimeout(() => {
        setEmote(null);
        broadcastMyState({ emote: null, chatMsg: chatText });
      }, 3800);

      if (chatText) {
        setTimeout(() => {
          setMyChatBubble('');
          broadcastMyState({ emote: null, chatMsg: '' });
        }, 5500);
      }
    },
    [broadcastMyState]
  );

  // ✨ 축도(Benediction) 실행 함수 (나에게 또는 선택한 성도에게 홀리라이트 강림!)
  const triggerHolyBenediction = useCallback(
    (pastorDisplayName, targetDisplayName, targetCoords) => {
      const eventPayload = {
        pastorName: pastorDisplayName,
        targetName: targetDisplayName,
        targetPos: targetCoords || [playerIdxRef.current[0], 0.08, playerIdxRef.current[2]],
        ts: Date.now()
      };

      playHolyBlessingSound();
      setHolyLightEvent(eventPayload);
      triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 축도를 감사히 받습니다 🙏`);

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'holy_blessing',
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

  const handleSaveAvatarCustomization = (nextAvatar) => {
    setAvatarConfig(nextAvatar);
    localStorage.setItem('gtc_metaverse_avatar_v1', JSON.stringify(nextAvatar));
    setShowAvatarModal(false);
    broadcastMyState({ avatar: nextAvatar });
    triggerSocialAction('wave', '새롭게 단장하고 1층 로비에 입장했습니다! 샬롬 👋');
  };

  const handleAddGuestbookEntry = async (e) => {
    if (e) e.preventDefault();
    const msg = guestbookInput.trim();
    if (!msg) return;
    const newEntry = {
      id: Date.now(),
      user_name: `${playerName} (${playerOffice})`,
      message: msg,
      created_at: new Date().toISOString().slice(0, 10)
    };
    setGuestbookList((prev) => [newEntry, ...prev]);
    setGuestbookInput('');
    triggerSocialAction('wave', msg);

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'guestbook_new', payload: newEntry }).catch(() => {});
    }
    if (supabase) {
      try {
        await supabase.from('metaverse_guestbook').insert([{ user_name: newEntry.user_name, message: msg }]);
      } catch (_) {}
    }
  };

  const handleSitOnSofa = useCallback(
    (seatData) => {
      setSeatedInfo(seatData);
      setWaypoints([[seatData.x, seatData.z]]);
      setTimeout(() => broadcastMyState(), 100);
    },
    [broadcastMyState]
  );

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setWaypoints([[-2.2, -2.0]]);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleWalkTo = useCallback(
    (tx, tz) => {
      if (seatedInfo) setSeatedInfo(null);
      const [sx, , sz] = playerIdxRef.current;
      const nextPath = computeSmartPath1F(sx, sz, tx, tz);
      setWaypoints(nextPath);
    },
    [seatedInfo]
  );

  const handleSelectNpcForChat = useCallback(
    (npc) => {
      setChatReplyText(
        (npc.dialogues && npc.dialogues[0]) ||
          '할렐루야! 좋은나무교회 1층 로비에 오신 것을 진심으로 환영합니다 😊'
      );
      setSelectedChatNpc(npc);
      triggerSocialAction('wave');
    },
    [triggerSocialAction]
  );

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
    ctx.fillStyle = '#10B981';
    ctx.fillRect(88, 10, 20, 20);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(88, 32, 20, 20);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(88, 54, 20, 20);

    // 다른 접속자 위치 표시 (초록 점)
    remotePeers.forEach((p) => {
      const px = (((p.x || 0) + 10.5) / 16.0) * w;
      const py = (((p.z || 0) + 5.0) / 13.0) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    });

    // 내 위치 표시 (노란 점)
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
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  // 200ms 쓰로틀링 위치 송출 (성능 저하 0%)
  const handlePositionUpdate = (px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_1F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 실시간 접속자 배지 & 아바타 꾸미기 & 목사님 축도 버튼 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[72vw]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            onClick={() => setActiveScreen && setActiveScreen('home')}
            style={darkPillStyle}
            className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
          >
            <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
              ◀ 1F 정문 로비 · 주차장
            </span>
          </div>

          <div
            style={darkPillStyle}
            className="px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300">동시접속 {remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowAvatarModal(true)}
            style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            👕 아바타 꾸미기
          </button>

          <button
            onClick={() => triggerHolyBenediction(canPlayerBless ? `${playerName} 목사님` : '이성현·방희곤·최수경 목사님', playerName, playerIdxRef.current)}
            style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            ✨ {canPlayerBless ? '성도 축도 선포(홀리라이트)' : '목사님 축도 받기'}
          </button>

          <button
            onClick={() => setShowBrochureModal(true)}
            style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            📰 홍보물·주보·방명록
          </button>

          <button
            onClick={() => handleJumpToFloor('2F')}
            style={{ backgroundColor: '#F59E0B', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            ☕ 2F 북카페·목양실
          </button>

          <button
            onClick={() => handleJumpToFloor('3F')}
            style={{ backgroundColor: '#10B981', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            🛗 3F 본당 이동
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

      {/* 2. 우측 상단: 접이식 미니맵 & 접속 성도 목록 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMapDrawerOpen((prev) => !prev)}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 1F 맵·접속자 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_1F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnSofa(z.seatTarget);
                    else if (z.isBrochureZone) setShowBrochureModal(true);
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

      {/* 3. 하단: 소셜 상호동작(인사·안부·춤·기도·할렐루야) & 실시간 한줄 채팅 & 공간 이동 바 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        {/* 소셜 이모트 & 실시간 말풍선 전송 바 */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { label: '👋 인사', emote: 'wave', msg: '할렐루야! 반갑습니다 성도님 👋' },
              { label: '💬 안부묻기', emote: 'wave', msg: '성도님 한 주간 평안하셨나요? 사랑하고 축복합니다 😊' },
              { label: '💃 워십댄스', emote: 'dance', msg: '다 함께 기쁨으로 주님을 찬양하며 춤춰요! 💃🎵' },
              { label: '🙏 기도하기', emote: 'pray', msg: '두 손 모아 간절히 주님께 기도합니다 🙏' },
              { label: '🙌 할렐루야', emote: 'praise', msg: '할렐루야! 아멘! 주님께 영광 돌립니다 🙌✨' }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => triggerSocialAction(act.emote, act.msg)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* 실시간 로비 말풍선 채팅 입력창 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickChatInput.trim()) return;
              triggerSocialAction('wave', quickChatInput.trim());
              setQuickChatInput('');
            }}
            style={darkPillStyle}
            className="flex items-center gap-1 px-2.5 py-1 rounded-2xl border shadow-2xl w-full sm:w-64"
          >
            <input
              type="text"
              value={quickChatInput}
              onChange={(e) => setQuickChatInput(e.target.value)}
              placeholder="로비 말풍선 대화 입력..."
              className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-xl bg-emerald-500 text-stone-950 text-[11px] font-black cursor-pointer shrink-0"
            >
              전송
            </button>
          </form>
        </div>

        {/* 공간 이동 퀵 메뉴 독 */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showBottomDock ? (
            <div
              style={darkPillStyle}
              className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
            >
              {[
                { icon: '🏛️', label: '정문현관', onClick: () => handleWalkTo(-0.8, 3.6) },
                { icon: '🪑', label: seatedInfo ? '일어나기' : '로비대기석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnSofa({ x: -3.48, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F 로비 4인용 가죽 대기석' }); } },
                { icon: '🚗', label: '주차팀인사', onClick: () => { handleWalkTo(-5.6, 2.6); handleSelectNpcForChat(NPCS_1F[5]); } },
                { icon: '📰', label: '홍보물·주보', onClick: () => setShowBrochureModal(true) },
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
          onSelectNpcForChat={handleSelectNpcForChat}
          onOpenBrochureModal={() => setShowBrochureModal(true)}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController1F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          myChatBubble={myChatBubble}
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

      {/* ================================================================= */}
      {/* 👕 5. 3번 요구사항: 게임 스타일 아바타 커스터마이징 모달 */}
      {/* ================================================================= */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-indigo-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 block">METAVERSE AVATAR STUDIO</span>
                <h3 className="text-base font-black text-white">👕 내 메타버스 캐릭터 커스터마이징</h3>
              </div>
              <button onClick={() => setShowAvatarModal(false)} className="text-xs font-bold text-zinc-400 cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            {/* 성별 & 의상 형태 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 block">1. 성별 및 의상 스타일</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '👨 남성 정장/캐주얼', gender: 'male', isSkirt: false, defaultHair: 'parted' },
                  { label: '👩 여성 원피스/스커트', gender: 'female', isSkirt: true, defaultHair: 'bob' },
                  { label: '👩 여성 팬츠 스타일', gender: 'female', isSkirt: false, defaultHair: 'long_wave' }
                ].map((opt, i) => {
                  const active = avatarConfig.gender === opt.gender && avatarConfig.isSkirt === opt.isSkirt;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        setAvatarConfig((prev) => ({
                          ...prev,
                          gender: opt.gender,
                          isSkirt: opt.isSkirt,
                          hairStyle: opt.defaultHair
                        }))
                      }
                      className={`py-2 px-2 rounded-xl text-[11px] font-black border cursor-pointer transition-all ${
                        active ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 머리 모양 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 block">2. 헤어스타일 선택</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'parted', label: '가르마펌' },
                  { id: 'short', label: '단정한 숏컷' },
                  { id: 'bob', label: '단발 보브컷' },
                  { id: 'long_wave', label: '긴 웨이브' },
                  { id: 'bun', label: '올림머리(번)' }
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setAvatarConfig((prev) => ({ ...prev, hairStyle: h.id }))}
                    className={`py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                      avatarConfig.hairStyle === h.id
                        ? 'bg-amber-500 border-amber-300 text-stone-950 font-black'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 상의 색상 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 block">3. 상의 의상 색상</label>
              <div className="flex items-center gap-2 flex-wrap">
                {['#FACC15', '#38BDF8', '#EC4899', '#10B981', '#6366F1', '#EF4444', '#1E293B', '#F8FAFC'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setAvatarConfig((prev) => ({ ...prev, shirtColor: col }))}
                    style={{ backgroundColor: col }}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                      avatarConfig.shirtColor === col ? 'border-white scale-115 shadow-lg' : 'border-transparent opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 하의/스커트 색상 & 머리 색상 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 block">4. 하의/스커트 색상</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#1E293B', '#0284C7', '#FCE7F3', '#FEF08A', '#CCFBF1', '#334155'].map((col) => (
                    <button
                      key={col}
                      onClick={() => setAvatarConfig((prev) => ({ ...prev, pantsColor: col }))}
                      style={{ backgroundColor: col }}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                        avatarConfig.pantsColor === col ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 block">5. 헤어 컬러 & 선글라스</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#18181B', '#451A03', '#78350F', '#EAB308', '#64748B'].map((col) => (
                    <button
                      key={col}
                      onClick={() => setAvatarConfig((prev) => ({ ...prev, hairColor: col }))}
                      style={{ backgroundColor: col }}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                        avatarConfig.hairColor === col ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                  <button
                    onClick={() => setAvatarConfig((prev) => ({ ...prev, hasSunglasses: !prev.hasSunglasses }))}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                      avatarConfig.hasSunglasses ? 'bg-amber-400 text-stone-950 border-white' : 'bg-white/10 text-zinc-300 border-white/10'
                    }`}
                  >
                    🕶️ 선글라스
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveAvatarCustomization(avatarConfig)}
              style={{ backgroundColor: '#10B981', color: '#030712' }}
              className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
            >
              ✨ 이 스타일로 1층 로비 입장하기
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🤝 6. 다른 실제 접속 성도(Remote Peer) 클릭 시 열리는 상호 호환 모달 */}
      {/* ================================================================= */}
      {selectedRemotePeer && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRemotePeer(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-sm border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 block">실시간 접속 성도 인터랙션</span>
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
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 샬롬 👋`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 text-xs font-bold text-white cursor-pointer"
              >
                👋 반갑게 인사하기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 한 주간 평안하셨나요? 😊`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 text-xs font-bold text-white cursor-pointer"
              >
                💬 안부 묻기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('pray', `${selectedRemotePeer.name}님의 가정과 일터를 위해 함께 기도합니다 🙏`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 text-xs font-bold text-white cursor-pointer"
              >
                🙏 함께 중보기도
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('dance', `${selectedRemotePeer.name}님과 함께 기쁨의 워십댄스! 💃🎵`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-pink-600/40 text-xs font-bold text-white cursor-pointer"
              >
                💃 함께 춤추기
              </button>
            </div>

            {/* 접속한 사람이 이성현·방희곤·최수경 목사님일 때 활성화되는 전용 축도 버튼 */}
            {canPlayerBless && (
              <button
                onClick={() => {
                  triggerHolyBenediction(
                    `${playerName} 목사님`,
                    selectedRemotePeer.name,
                    [selectedRemotePeer.x || -0.8, 0.08, selectedRemotePeer.z || 2.2]
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

      {/* ================================================================= */}
      {/* 📰 7. 8번 요구사항: 교회 홍보 브로슈어 & 디지털 주보 & 실시간 방명록 모달 */}
      {/* ================================================================= */}
      {showBrochureModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowBrochureModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-pink-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[86vh] overflow-y-auto hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-pink-400 block">GOOD TREE CHURCH KIOSK</span>
                <h3 className="text-base font-black text-white">📰 교회 홍보 브로슈어 & 로비 방명록</h3>
              </div>
              <button onClick={() => setShowBrochureModal(false)} className="text-xs font-bold text-zinc-400 cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            {/* 교회 홍보 카드 */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 space-y-2">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-black">
                2026 좋은나무교회 비전 브로슈어
              </span>
              <h4 className="text-sm font-black text-white">"기적이 상식이 되는 5일의 기도 · 말씀과 성령 공동체"</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                • <b>교역자:</b> 이성현 목사 · 방희곤 목사 · 최수경 목사<br />
                • <b>주일 대예배:</b> 1부 09:00 / 2부 11:00 (3층 대예배당)<br />
                • <b>2층 커뮤니티:</b> 좋은나무 스페셜티 북카페 & 담임목사 목양실
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowBrochureModal(false);
                    if (setActiveScreen) setActiveScreen('sermon');
                  }}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer"
                >
                  📝 온라인 예배노트 열기
                </button>
                <button
                  onClick={() => {
                    setShowBrochureModal(false);
                    if (setActiveScreen) setActiveScreen('qt');
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                >
                  📖 오늘의 QT 묵상
                </button>
              </div>
            </div>

            {/* 로비 방문객 실시간 방명록 */}
            <div className="space-y-2">
              <span className="text-xs font-black text-amber-300 block">✍️ 1층 로비 방문 성도 한줄 방명록</span>
              <form onSubmit={handleAddGuestbookEntry} className="flex gap-1.5">
                <input
                  type="text"
                  value={guestbookInput}
                  onChange={(e) => setGuestbookInput(e.target.value)}
                  placeholder="반가운 안부나 기도제목을 남겨주세요..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs cursor-pointer shrink-0"
                >
                  등록
                </button>
              </form>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
                {guestbookList.map((g) => (
                  <div key={g.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-black text-emerald-400">{g.user_name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{String(g.created_at).slice(0, 10)}</span>
                    </div>
                    <p className="text-zinc-200">{g.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. NPC 클릭 시 열리는 1:1 환영 대화 & 목사님 축도 & 주차팀 인사 모달 */}
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
                    {selectedChatNpc.role || '1층 로비 안내위원'}
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

            {/* 이성현 · 방희곤 · 최수경 목사님 NPC 전용: 축도(홀리라이트) 받기 버튼 */}
            {selectedChatNpc.canBless && (
              <button
                onClick={() => {
                  const pastorName = selectedChatNpc.name;
                  setSelectedChatNpc(null);
                  triggerHolyBenediction(pastorName, playerName, playerIdxRef.current);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg animate-pulse"
              >
                ✨ [{selectedChatNpc.name}]께 거룩한 축도(홀리라이트) 받기 🙏
              </button>
            )}

            {/* 주차봉사팀 최집사 전용 인사 버튼 */}
            {selectedChatNpc.isParkingTeam && (
              <button
                onClick={() => {
                  setChatReplyText(`충성! ${playerName} 성도님! 오늘도 주님 안에서 안전하고 복된 주일 되십시오! 🫡🚗`);
                  triggerSocialAction('wave', '주차봉사팀 집사님 늘 수고해주셔서 감사합니다! 👋');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer"
              >
                🫡 주차봉사팀에게 감사 인사 건네기
              </button>
            )}

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  handleJumpToFloor('2F');
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FDE047' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                ☕ 2F 북카페·목양실
              </button>
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  handleJumpToFloor('3F');
                }}
                style={{ backgroundColor: '#10B981', color: '#030712' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🛗 3F 대예배당 올라가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. 구역 상세 안내 & 전 층(1F~6F) 이동 엘리베이터 모달 */}
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
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 스테인리스 자동문이 열렸습니다. 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 필로티 주차장 (현재 층)' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 담임목사 목양실 · 행정사무실' },
                  { fl: '3F', label: '3F 대예배당 (본당 설교 스크린 · 장의자 착석)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실 · 코너 TV)' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 워십댄스실' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반 (유아·유치·초등)' },
                  { fl: '7F', label: '7F 루프탑 하늘정원 · 한강신도시 전망대' }
                ].map((item) => (
                  <button
                    key={item.fl}
                    onClick={() => handleJumpToFloor(item.fl)}
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
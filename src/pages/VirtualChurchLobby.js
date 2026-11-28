// src/pages/VirtualChurchLobby.js (PART 1 — LEGO Modular Diorama & Minifigure Edition · Mobile Optimized)
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
// 🔔 사운드 신시사이저 (싱글톤 AudioContext · 엘리베이터 · 축도 ·  클릭음)
// =====================================================================
let sharedLobbyAudioCtx = null;
function getLobbyAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!sharedLobbyAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedLobbyAudioCtx = new AudioCtx();
  }
  if (sharedLobbyAudioCtx && sharedLobbyAudioCtx.state === 'suspended') {
    sharedLobbyAudioCtx.resume().catch(() => {});
  }
  return sharedLobbyAudioCtx;
}

const playLegoSnapSound = () => {
  try {
    const ctx = getLobbyAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch (_) {}
};

const playElevatorDingSound = () => {
  try {
    const ctx = getLobbyAudioCtx();
    if (!ctx) return;
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
    const ctx = getLobbyAudioCtx();
    if (!ctx) return;
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

// =====================================================================
// 🎨  ABS 플라스틱 & 모듈러 타일 캔버스 텍스처 생성기
// =====================================================================
export function makeCanvasTexture(drawFn, width = 512, height = 256) {
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

//  모듈러 유광 타일 바닥 (2x2 타일 그리드 + 미세 베벨)
function makeLegoFloorTileTexture(baseHex = '#F4E5C2', seamHex = '#D4C29A', grid = 8) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    const step = w / grid;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? baseHex : '#EFE0BA';
        ctx.fillRect(c * step + 2, r * step + 2, step - 4, step - 4);
        ctx.strokeStyle = seamHex;
        ctx.lineWidth = 2;
        ctx.strokeRect(c * step + 1, r * step + 1, step - 2, step - 2);
      }
    }
  }, 512, 512);
}

//  브릭 벽돌/원목 슬랫 텍스처 (1x4 브릭 적층 라인)
export function makeWoodGrainTexture(baseHex = '#A85D2A', lineHex = '#6E3814') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.fillStyle = r % 2 === 0 ? baseHex : '#9A5222';
      ctx.fillRect(0, y + 2, w, rowH - 3);
      ctx.fillStyle = lineHex;
      ctx.fillRect(0, y, w, 2);
      const offset = (r % 2) * (w / 4);
      for (let x = offset; x < w; x += w / 2) {
        ctx.fillRect(x, y, 2, rowH);
      }
    }
  }, 256, 256);
}

function makeLegoWallBrickTexture(baseHex = '#F3E5AB', seamHex = '#D8C78A') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    const rows = 6;
    const rowH = h / rows;
    ctx.strokeStyle = seamHex;
    ctx.lineWidth = 2.5;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      const off = (r % 2) * (w / 4);
      for (let x = off; x < w; x += w / 2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
  }, 256, 256);
}

function makeBrushedSteelTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.35, '#F8FAFC');
    grad.addColorStop(0.65, '#94A3B8');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 256, 256);
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
  }, 256, 128);
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
// 🧱 모바일 60FPS 핵심: InstancedMesh 단일 드로우콜  스터드(돌기) 그리드
// =====================================================================
export function LegoStudGrid({ positions = [], color = '#64748B', radius = 0.13, height = 0.08, roughness = 0.2 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || positions.length === 0) return;
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, positions.length]} receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 8]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />
    </instancedMesh>
  );
}

// =====================================================================
// 📍 1층 7대 인터랙션 존 & NPC 데이터 (원본 100% 보존)
// =====================================================================
const ZONES_1F = [
  {
    id: 'zone_1f_main_door', code: '01', subCode: '정문',
    name: '1층  정문 출입구 & 좋은나무교회 현관', prompt: '01 정문 현관 & 예배 안내 보기',
    pos: [-0.8, 0, 3.6], badge: '01  정문 로비',
    title: '🧱 좋은나무교회 1층  모듈러 정문 & 로비',
    desc: '진초록  브릭 어닝과 투명 브릭 유리문, 다품종  화분과 황금 브릭 십자가가 반겨주는 1층 로비입니다.',
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
    id: 'zone_1f_lounge_chair', code: '02', subCode: '의자',
    name: '좌측 4인용  블랙 대기 벤치', prompt: '02  대기 의자에 앉아 쉬기',
    pos: [-2.6, 0, -2.0],
    seatTarget: { x: -3.48, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F  4인용 대기석' },
    isSeatZone: true, badge: '02  대기석(의자)',
    title: '🪑 1층 로비  4인용 블랙 브릭 벤치',
    desc: '유광 블랙  브릭으로 조립된 4인용 로비 대기 의자입니다. 클릭하시면 미니피겨가 깔끔하게 착석합니다.'
  },
  {
    id: 'zone_1f_parking', code: '03', subCode: '주차장',
    name: '좌측 필로티  주차장 (SUV · 블루 세단)', prompt: '03 주차봉사팀과 인사 & 차량 안내',
    pos: [-5.6, 0, 2.2], badge: '03  필로티 주차장',
    title: '🚗 좌측 필로티  주차장 & 주차봉사팀',
    desc: '테라코타 브릭 기둥 아래  화이트 SUV와 스카이블루 세단이 주차되어 있으며, 주차봉사팀 최집사님과 인사할 수 있습니다.',
    stats: [
      { label: '주차 차량', val: 'LEGO 화이트 SUV / LEGO 스카이블루 세단' },
      { label: '로비 직결문', val: '주차장 우측 유리 브릭문 ➔ 1층 로비' }
    ]
  },
  {
    id: 'zone_1f_elevator', code: '04', subCode: '엘베',
    name: '우측 상단  자동 개폐 엘리베이터', prompt: '04 엘리베이터 탑승 (2F~7F 이동)',
    pos: [1.8, 0, -2.8], isElevator: true, badge: '04  엘리베이터',
    title: '🛗 전 층 연결  브릭 엘리베이터 (1F~7F)',
    desc: '다가가거나 클릭하면 차임벨과 함께 실버 브릭 자동문이 열리며 2층~7층  월드로 이동합니다!'
  },
  {
    id: 'zone_1f_up_stairs', code: '05', subCode: '계단',
    name: '우측 중단 상층부 연결  계단실', prompt: '05 계단으로 2F~7F 올라가기',
    pos: [1.8, 0, 0.2], isElevator: true, badge: '05 상층 계단실',
    title: '🪜 우측 중단 전 층 연결 계단실 (1F ➔ 2F~7F)',
    desc: '엘리베이터 옆에 위치한 상층부 도보 이동 계단실입니다.'
  },
  {
    id: 'zone_1f_b1_stairs', code: '06', subCode: 'B1F계단',
    name: '우측 하단 B1F 내려가는 계단실', prompt: '06 B1F 계단실 안내',
    pos: [1.8, 0, 2.8], badge: '06 B1F 계단실',
    title: '🔽 우측 하단 B1F 연결 계단실',
    desc: '지하 1층(B1F)으로 연결되는 계단실입니다.'
  },
  {
    id: 'zone_1f_brochure_kiosk', code: '07', subCode: '홍보물·주보',
    name: '안내데스크 교회 홍보물 & 디지털 주보 키오스크', prompt: '07 교회 홍보물 & 디지털 주보 보기',
    pos: [-0.8, 0, -2.15], isBrochureZone: true, badge: '07 홍보물·주보·방명록',
    title: '📰 좋은나무교회 홍보 브로슈어 & 로비 방명록',
    desc: '우리 교회 비전 소개서, 주일 예배 안내, 실시간 방문객 방명록을 확인하실 수 있습니다.'
  }
];

const NPCS_1F = [
  { id: 'pastor_lee_1f', name: '이성현 목사님', role: '좋은나무교회 담임목사 · 축도 사역', isPastor: true, canBless: true, x: -0.2, z: -1.8, gender: 'male', hairStyle: 'parted', rotY: 0, shirt: '#1E293B', pants: '#0F172A', hair: '#18181B', dialogues: ['사랑하는 성도님 반갑습니다!  모듈러로 새로 단장한 로비에 오신 것을 축복합니다 ✝️', '저를 클릭하시면 [✨ 거룩한 축도(홀리라이트)]를 받으실 수 있습니다 🙏'] },
  { id: 'pastor_bang_1f', name: '방희곤 목사님', role: '좋은나무교회 목사 · 축도 사역', isPastor: true, canBless: true, x: -1.65, z: -1.8, gender: 'male', hairStyle: 'short', rotY: 0.25, shirt: '#1E3A8A', pants: '#0F172A', hair: '#27272A', dialogues: ['할렐루야! 성도님 한 주간도 말씀과 기도로 승리하셨나요? 😊', '함께 기도하며 주님의 이름으로 축도해 드리겠습니다!'] },
  { id: 'pastor_choi_1f', name: '최수경 목사님', role: '좋은나무교회 목사 · 축도 사역', isPastor: true, canBless: true, x: 0.85, z: -1.8, gender: 'female', hairStyle: 'bob', isSkirt: true, rotY: -0.25, shirt: '#4F46E5', pants: '#E0E7FF', hair: '#3F2305', dialogues: ['성도님 샬롬! 주님의 따뜻한 사랑과 위로가 마음 가득 채워지길 소망해요 🥰'] },
  { id: 'npc_1f_usher', name: '박집사 (로비안내)', role: '1층 정문 로비 안내위원', x: -0.8, z: 2.4, patrolZ: [-0.8, 3.2], gender: 'female', hairStyle: 'bob', isSkirt: true, rotY: 0, shirt: '#0284C7', pants: '#BAE6FD', hair: '#5C3A21', dialogues: ['할렐루야!  좋은나무교회 1층 로비에 오신 것을 환영합니다 😊'] },
  { id: 'npc_1f_lounge', name: '김권사 (새가족환영)', role: '새가족 환영위원회 권사', x: -3.48, z: -1.62, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, rotY: Math.PI / 2, shirt: '#EC4899', pants: '#FBCFE8', hair: '#451A03', dialogues: [' 대기 의자에 앉아 성도님들과 교제하니 참 정겹네요 🥰'] },
  { id: 'npc_1f_parking', name: '최집사 (주차봉사팀)', role: '필로티 주차장 안내팀장', isParkingTeam: true, x: -6.2, z: 3.2, gender: 'male', hairStyle: 'short', autoWave: true, rotY: 0.4, shirt: '#16A34A', pants: '#1E293B', hair: '#27272A', dialogues: ['충성! 할렐루야 성도님! 오늘도 안전 운행해 주셔서 감사합니다 🫡🚗'] },
  { id: 'npc_1f_elev', name: '이청년 (엘베안내)', role: '예배 안내 봉사 청년', x: 1.45, z: -2.2, gender: 'male', hairStyle: 'parted', rotY: -0.5, shirt: '#F59E0B', pants: '#1E293B', hair: '#5C3A21', dialogues: ['엘리베이터 앞으로 오시면  자동문이 스르륵 열립니다 🛗'] }
];

// =====================================================================
// 🚧 물리 충돌 & 스마트 길찾기 (원본 100% 보존)
// =====================================================================
const WALL_COLLIDERS_1F = [
  { minX: -4.4, maxX: -1.85, minZ: 4.15, maxZ: 4.65 },
  { minX: 0.45, maxX: 5.5, minZ: 4.15, maxZ: 4.65 },
  { minX: -4.45, maxX: -3.95, minZ: -4.6, maxZ: 1.45 },
  { minX: -4.45, maxX: -3.95, minZ: 2.95, maxZ: 4.6 },
  { minX: -4.2, maxX: -2.85, minZ: 0.95, maxZ: 1.35 },
  { minX: 0.95, maxX: 2.35, minZ: 0.95, maxZ: 1.35 },
  { minX: -3.95, maxX: -3.15, minZ: -3.55, maxZ: -0.45 },
  { minX: -2.80, maxX: -2.05, minZ: -2.85, maxZ: -1.15 },
  { minX: -1.90, maxX: 0.30, minZ: -3.65, maxZ: -2.75 },
  { minX: -1.95, maxX: -1.15, minZ: -2.85, maxZ: -2.40 },
  { minX: 0.30, maxX: 0.98, minZ: -3.75, maxZ: -3.10 },
  { minX: -0.58, maxX: 1.08, minZ: 1.38, maxZ: 1.92 },
  { minX: 2.15, maxX: 2.65, minZ: -4.6, maxZ: -3.55 },
  { minX: 2.15, maxX: 2.65, minZ: -2.05, maxZ: -0.4 },
  { minX: 2.15, maxX: 2.65, minZ: 0.8, maxZ: 2.1 },
  { minX: -10.65, maxX: -7.05, minZ: -2.35, maxZ: -0.35 },
  { minX: -10.65, maxX: -7.05, minZ: 0.20, maxZ: 2.15 },
  { minX: -10.55, maxX: -9.85, minZ: 3.85, maxZ: 4.55 },
  { minX: -5.35, maxX: -4.65, minZ: 3.85, maxZ: 4.55 },
  { minX: -10.55, maxX: -9.85, minZ: -3.85, maxZ: -3.15 },
  { minX: -5.35, maxX: -4.65, minZ: -3.85, maxZ: -3.15 }
];

const STATIC_CIRCLE_OBSTACLES_1F = [
  { x: -2.35, z: -3.05, r: 0.32 }, { x: 1.25, z: -3.05, r: 0.30 },
  { x: -2.95, z: -0.35, r: 0.32 }, { x: -0.2, z: -1.8, r: 0.30 },
  { x: -1.65, z: -1.8, r: 0.30 }, { x: 0.85, z: -1.8, r: 0.30 },
  { x: -6.2, z: 3.2, r: 0.30 }, { x: 1.45, z: -2.2, r: 0.30 }
];

function isBlocked1F(x, z) {
  if (x < -10.5 || x > 5.2 || z < -4.4 || z > 7.8) return true;
  for (const b of WALL_COLLIDERS_1F) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
  }
  return false;
}

function resolveCollision1F(nx, nz, radius = 0.28, dynamicPeers = []) {
  let x = Math.max(-10.0, Math.min(4.8, nx));
  let z = Math.max(-4.1, Math.min(7.4, nz));
  for (const box of WALL_COLLIDERS_1F) {
    const closestX = Math.max(box.minX, Math.min(x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
    const dx = x - closestX, dz = z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      x += (dx / dist) * (radius - dist);
      z += (dz / dist) * (radius - dist);
    }
  }
  for (const c of STATIC_CIRCLE_OBSTACLES_1F) {
    const dx = x - c.x, dz = z - c.z, minDist = radius + c.r;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.001;
      x += (dx / dist) * (minDist - dist);
      z += (dz / dist) * (minDist - dist);
    }
  }
  for (const peer of dynamicPeers) {
    if (typeof peer.x !== 'number' || typeof peer.z !== 'number') continue;
    const dx = x - peer.x, dz = z - peer.z, minDist = radius + 0.24;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      x += (dx / dist) * (minDist - dist);
      z += (dz / dist) * (minDist - dist);
    }
  }
  return [x, z];
}

function computeSmartPath1F(sx, sz, rawEx, rawEz) {
  const [tx, tz] = resolveCollision1F(rawEx, rawEz);
  let clear = true;
  for (let i = 1; i <= 14; i++) {
    if (isBlocked1F(sx + ((tx - sx) * i) / 14, sz + ((tz - sz) * i) / 14)) { clear = false; break; }
  }
  if (clear) return [[tx, tz]];
  const waypoints = [];
  let curX = sx, curZ = sz;
  if (curZ > 4.4 && tz <= 4.4) { waypoints.push([-0.8, 5.0], [-0.8, 3.4]); curX = -0.8; curZ = 3.4; }
  else if (curZ <= 4.4 && tz > 4.4) { waypoints.push([-0.8, 3.4], [-0.8, 5.0]); curX = -0.8; curZ = 5.0; }
  if (curX < -4.2 && tx >= -4.2) waypoints.push([-5.0, 2.2], [-2.2, 2.2]);
  else if (curX >= -4.2 && tx < -4.2) waypoints.push([-2.2, 2.2], [-5.0, 2.2]);
  if ((curZ - 1.2) * (tz - 1.2) < 0 && tx >= -4.2) waypoints.push([-0.8, 1.2]);
  waypoints.push([tx, tz]);
  return waypoints;
}

// =====================================================================
// ✨ 축도(Benediction) 홀리라이트 이펙트
// =====================================================================
function HolyLightBeamEffect({ targetPos, pastorName, targetName }) {
  const beamRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particlesRef = useRef();

  const blessingBannerTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(120, 53, 15, 0.92)');
    grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.96)');
    grad.addColorStop(1, 'rgba(120, 53, 15, 0.92)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(10, 10, w - 20, h - 20, 32); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#FEF08A'; ctx.stroke();
    ctx.fillStyle = '#FEF08A'; ctx.font = '900 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`✝️ ${pastorName || '목사님'}의 축도 (HOLY BENEDICTION)`, w / 2, 46);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 28px serif';
    ctx.fillText(`${targetName} 성도님에게 하나님의 은혜와 평강이`, w / 2, 88);
    ctx.fillText(`영원토록 함께 있을지어다! 아멘 🙏`, w / 2, 126);
  }, 620, 156), [pastorName, targetName]);

  useEffect(() => () => blessingBannerTex.dispose(), [blessingBannerTex]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      beamRef.current.scale.set(pulse, 1, pulse);
      beamRef.current.material.opacity = 0.34 + Math.sin(t * 4) * 0.08;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.8;
    if (ring2Ref.current) { ring2Ref.current.rotation.z = -t * 2.2; ring2Ref.current.position.y = 0.6 + ((t * 0.8) % 2.4); }
    if (particlesRef.current) { particlesRef.current.rotation.y = t * 1.2; particlesRef.current.position.y = (t * 0.9) % 2.2; }
  });

  if (!targetPos) return null;
  return (
    <group position={[targetPos[0], 0.05, targetPos[2]]}>
      <mesh ref={beamRef} position={[0, 3.2, 0]}><cylinderGeometry args={[0.95, 0.68, 6.4, 20, 1, true]} /><meshBasicMaterial color="#FDE047" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[0.52, 0.76, 24]} /><meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}><ringGeometry args={[0.45, 0.54, 20]} /><meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} /></mesh>
      <group ref={particlesRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(ang) * 0.42, (i / 10) * 2.2, Math.sin(ang) * 0.42]}><boxGeometry args={[0.07, 0.07, 0.07]} /><meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} /></mesh>;
        })}
      </group>
      <pointLight position={[0, 2.6, 0]} intensity={5.0} distance={6.5} color="#FDE047" />
      <Billboard position={[0, 2.35, 0]}><mesh renderOrder={30}><planeGeometry args={[2.5, 0.64]} /><meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} /></mesh></Billboard>
    </group>
  );
}

// =====================================================================
// 🏎️  브릭 자동차 3종 (유광 ABS 플라스틱 + 스터드 루프 +  휠)
// =====================================================================
function MovingRacingSupercar1F() {
  const carRef = useRef();
  const wheelsRef = useRef([]);

  useFrame((_, delta) => {
    if (carRef.current) {
      carRef.current.position.x += delta * 4.0;
      if (carRef.current.position.x > 9.5) carRef.current.position.x = -12.5;
    }
    wheelsRef.current.forEach((w) => { if (w) w.rotation.z -= delta * 14.0; });
  });

  return (
    <group ref={carRef} position={[-6, 0.24, 7.6]}>
      {/* 유광  스포츠카 섀시 */}
      <RoundedBox args={[2.3, 0.34, 1.1]} position={[0, 0.04, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#0284C7" roughness={0.16} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.95, 0.28, 0.92]} position={[-0.1, 0.34, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.68} roughness={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.08, 0.88]} position={[-0.15, 0.50, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#FACC15" roughness={0.18} />
      </RoundedBox>
      {/* 리어 스포일러 브릭 */}
      <RoundedBox args={[0.24, 0.06, 1.12]} position={[-1.02, 0.38, 0]} radius={0.015} castShadow>
        <meshStandardMaterial color="#18181B" roughness={0.2} />
      </RoundedBox>
      {/* 헤드라이트 투명 노란 스터드 */}
      {[-0.36, 0.36].map((hz, i) => (
        <mesh key={i} position={[1.16, 0.08, hz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
          <meshBasicMaterial color="#FEF08A" />
        </mesh>
      ))}
      {[[-0.68, -0.56], [0.68, -0.56], [-0.68, 0.56], [0.68, 0.56]].map(([wx, wz], i) => (
        <group key={i} position={[wx, -0.04, wz]} ref={(el) => (wheelsRef.current[i] = el)}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.21, 0.21, 0.18, 12]} /><meshStandardMaterial color="#18181B" roughness={0.75} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.19, 10]} /><meshStandardMaterial color="#E2E8F0" roughness={0.2} /></mesh>
        </group>
      ))}
    </group>
  );
}

// 🚙  화이트 SUV (프리뷰 이미지와 동일한 스터드 루프 + 각진 브릭 디자인)
function DetailedIoniq5EV({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.76, 0.44, 3.36]} position={[0, 0.38, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.80, 0.14, 3.42]} position={[0, 0.18, 0]} radius={0.02}>
        <meshStandardMaterial color="#334155" roughness={0.25} />
      </RoundedBox>
      {/* 브릭 캐빈 & 투명 윈드실드 */}
      <RoundedBox args={[1.56, 0.48, 2.04]} position={[0, 0.82, -0.22]} radius={0.03} castShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.60, 0.34, 1.82]} position={[0, 0.82, -0.20]} radius={0.02}>
        <meshStandardMaterial color="#1E293B" roughness={0.12} metalness={0.3} />
      </RoundedBox>
      {/* 지붕 위 2x4  스터드 */}
      {[-0.42, -0.14, 0.14, 0.42].map((sx, xi) =>
        [-0.85, -0.45, -0.05, 0.35].map((sz, zi) => (
          <mesh key={`rs_${xi}_${zi}`} position={[sx, 1.09, sz]}>
            <cylinderGeometry args={[0.10, 0.10, 0.06, 8]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
          </mesh>
        ))
      )}
      {/* 헤드라이트 & 그릴 브릭 */}
      {[-0.58, 0.58].map((hx, i) => (
        <mesh key={i} position={[hx, 0.44, 1.70]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 10]} />
          <meshBasicMaterial color="#FEF9C3" />
        </mesh>
      ))}
      {[[-0.84, -1.05], [0.84, -1.05], [-0.84, 1.05], [0.84, 1.05]].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.25, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.26, 0.26, 0.24, 12]} /><meshStandardMaterial color="#18181B" roughness={0.75} /></mesh>
          <mesh><cylinderGeometry args={[0.13, 0.13, 0.25, 10]} /><meshStandardMaterial color="#CBD5E1" roughness={0.2} /></mesh>
        </group>
      ))}
    </group>
  );
}

// 🚗  스카이블루 세단 (프리뷰 이미지와 동일한 블루 브릭 바디)
function DetailedAvanteNBlue({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.72, 0.40, 3.36]} position={[0, 0.36, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.16} />
      </RoundedBox>
      <RoundedBox args={[1.76, 0.12, 3.42]} position={[0, 0.16, 0]} radius={0.02}>
        <meshStandardMaterial color="#1E293B" roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.50, 0.42, 1.80]} position={[0, 0.74, -0.15]} radius={0.03} castShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.16} />
      </RoundedBox>
      <RoundedBox args={[1.54, 0.30, 1.56]} position={[0, 0.74, -0.15]} radius={0.02}>
        <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.3} />
      </RoundedBox>
      {[-0.36, 0, 0.36].map((sx, xi) =>
        [-0.55, -0.15, 0.25].map((sz, zi) => (
          <mesh key={`bs_${xi}_${zi}`} position={[sx, 0.98, sz]}>
            <cylinderGeometry args={[0.10, 0.10, 0.06, 8]} />
            <meshStandardMaterial color="#38BDF8" roughness={0.16} />
          </mesh>
        ))
      )}
      {[-0.56, 0.56].map((hx, i) => (
        <mesh key={i} position={[hx, 0.40, 1.70]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.10, 0.10, 0.06, 10]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
      {[[-0.82, -1.04], [0.82, -1.04], [-0.82, 1.04], [0.82, 1.04]].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.23, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.24, 0.24, 0.22, 12]} /><meshStandardMaterial color="#18181B" roughness={0.75} /></mesh>
          <mesh><cylinderGeometry args={[0.12, 0.12, 0.23, 10]} /><meshStandardMaterial color="#E2E8F0" roughness={0.2} /></mesh>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// 🪑  모듈러 가구 3종 (전 층 공용 export)
// =====================================================================
export function ClassicChurchPew({ position = [0, 0, 0], rotationY = 0, width = 1.65, onSit }) {
  const halfW = width / 2;
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); if (onSit) onSit(); }}>
      {/* 유광 원목색  브릭 좌판 */}
      <RoundedBox args={[width, 0.10, 0.46]} position={[0, 0.36, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#B45309" roughness={0.2} />
      </RoundedBox>
      {/* 버건디  타일 쿠션 */}
      <RoundedBox args={[width - 0.14, 0.05, 0.38]} position={[0, 0.43, 0.01]} radius={0.015} castShadow>
        <meshStandardMaterial color="#991B1B" roughness={0.22} />
      </RoundedBox>
      {/*  브릭 등받이 + 상단 스터드 */}
      <RoundedBox args={[width, 0.44, 0.09]} position={[0, 0.62, -0.20]} radius={0.02} castShadow>
        <meshStandardMaterial color="#92400E" roughness={0.2} />
      </RoundedBox>
      {[-0.6, -0.3, 0, 0.3, 0.6].map((sx, i) => (
        <mesh key={i} position={[sx, 0.87, -0.20]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 8]} />
          <meshStandardMaterial color="#92400E" roughness={0.2} />
        </mesh>
      ))}
      {[-halfW + 0.06, halfW - 0.06].map((sx, si) => (
        <RoundedBox key={si} args={[0.10, 0.56, 0.48]} position={[sx, 0.28, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#78350F" roughness={0.2} />
        </RoundedBox>
      ))}
    </group>
  );
}

export function FourSeaterChromeLobbyBench({ position, rotationY = 0, onSit }) {
  const seatOffsets = [-1.08, -0.36, 0.36, 1.08];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/*  브릭 하단 지지 프레임 */}
      <RoundedBox args={[3.04, 0.14, 0.56]} position={[0, 0.20, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#475569" roughness={0.2} />
      </RoundedBox>
      {[-1.44, 1.44].map((lx, i) => (
        <RoundedBox key={i} args={[0.14, 0.48, 0.56]} position={[lx, 0.24, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E293B" roughness={0.2} />
        </RoundedBox>
      ))}
      {/* 4개의 유광 블랙  브릭 시트 */}
      {seatOffsets.map((sx, sIdx) => (
        <group key={`lseat_${sIdx}`} position={[sx, 0, 0]} onClick={(e) => { e.stopPropagation(); if (onSit) onSit(sx, sIdx + 1); }}>
          <RoundedBox args={[0.64, 0.12, 0.50]} position={[0, 0.33, 0.03]} radius={0.02} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.18} />
          </RoundedBox>
          <RoundedBox args={[0.64, 0.48, 0.12]} position={[0, 0.58, -0.18]} radius={0.02} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.18} />
          </RoundedBox>
          {[-0.18, 0.18].map((stx, sti) => (
            <mesh key={sti} position={[stx, 0.85, -0.18]}>
              <cylinderGeometry args={[0.075, 0.075, 0.055, 8]} />
              <meshStandardMaterial color="#27272A" roughness={0.18} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function BotanicalMultiLeafPlant({ position, variant = 'palm', scale = 1.0 }) {
  const potColor = variant === 'ficus_tree' ? '#B91C1C' : variant === 'dracaena' ? '#D97706' : '#991B1B';
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/*  원통 브릭 화분 */}
      <mesh position={[0, 0.20, 0]} castShadow><cylinderGeometry args={[0.24, 0.18, 0.40, 12]} /><meshStandardMaterial color={potColor} roughness={0.2} /></mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.26, 0.26, 0.06, 12]} /><meshStandardMaterial color={potColor} roughness={0.2} /></mesh>
      {/*  원통 줄기 브릭 */}
      <mesh position={[0, 0.64, 0]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.44, 8]} /><meshStandardMaterial color="#78350F" roughness={0.22} /></mesh>
      {/*  브릭 잎사귀 클러스터 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        const yOff = 0.72 + (i % 2) * 0.16;
        return (
          <group key={i} position={[Math.cos(ang) * 0.18, yOff, Math.sin(ang) * 0.18]} rotation={[0.25, ang, 0.2]}>
            <RoundedBox args={[0.24, 0.06, 0.18]} radius={0.015} castShadow>
              <meshStandardMaterial color={i % 2 === 0 ? '#16A34A' : '#22C55E'} roughness={0.18} />
            </RoundedBox>
            <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.055, 0.055, 0.04, 8]} /><meshStandardMaterial color="#4ADE80" roughness={0.18} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

// =====================================================================
// 🛗  브릭 실버 자동 개폐 엘리베이터
// =====================================================================
function AnimatedStainlessElevator1F({ position, rotationY = -Math.PI / 2, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#A85D2A', '#6E3814'), []);

  useEffect(() => () => { steelTex.dispose(); mirrorTex.dispose(); oakTex.dispose(); }, [steelTex, mirrorTex, oakTex]);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const isOpen = forceOpen || Math.hypot(px - (position[0] - 1.2), pz - position[2]) < 1.95;
    if (isOpen && !wasOpenRef.current) { wasOpenRef.current = true; playElevatorDingSound(); }
    else if (!isOpen && wasOpenRef.current) wasOpenRef.current = false;
    leftDoorRef.current.position.x = THREE.MathUtils.lerp(leftDoorRef.current.position.x, isOpen ? -0.92 : -0.34, delta * 6.5);
    rightDoorRef.current.position.x = THREE.MathUtils.lerp(rightDoorRef.current.position.x, isOpen ? 0.92 : 0.34, delta * 6.5);
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); if (onClickElevator) onClickElevator(); }}>
      <group position={[0, 0, -0.55]}>
        <RoundedBox args={[1.75, 0.06, 1.15]} position={[0, 0.03, 0]} radius={0.01}><meshStandardMaterial color="#F8FAFC" roughness={0.2} /></RoundedBox>
        <RoundedBox args={[1.75, 0.06, 1.15]} position={[0, 2.22, 0]} radius={0.01}><meshBasicMaterial color="#FFFBEB" /></RoundedBox>
        <RoundedBox args={[1.75, 2.28, 0.08]} position={[0, 1.14, -0.55]} radius={0.01}><meshStandardMaterial map={oakTex} roughness={0.22} /></RoundedBox>
        <mesh position={[0, 1.42, -0.49]}><planeGeometry args={[1.32, 0.98]} /><meshBasicMaterial map={mirrorTex} /></mesh>
        <RoundedBox args={[0.14, 2.45, 1.35]} position={[-1.08, 1.22, 0]} radius={0.02} castShadow><meshStandardMaterial color="#F3E5AB" roughness={0.2} /></RoundedBox>
        <RoundedBox args={[0.14, 2.45, 1.35]} position={[1.08, 1.22, 0]} radius={0.02} castShadow><meshStandardMaterial color="#F3E5AB" roughness={0.2} /></RoundedBox>
        <RoundedBox args={[2.30, 0.14, 1.38]} position={[0, 2.42, 0]} radius={0.02} castShadow><meshStandardMaterial color="#E2D295" roughness={0.2} /></RoundedBox>
      </group>
      <group position={[0, 1.06, 0.04]}>
        <RoundedBox ref={leftDoorRef} args={[0.67, 2.08, 0.06]} position={[-0.34, 0, 0]} radius={0.01} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#CBD5E1" metalness={0.55} roughness={0.22} /></RoundedBox>
        <RoundedBox ref={rightDoorRef} args={[0.67, 2.08, 0.06]} position={[0.34, 0, 0]} radius={0.01} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#CBD5E1" metalness={0.55} roughness={0.22} /></RoundedBox>
      </group>
      <RoundedBox args={[0.28, 2.36, 0.24]} position={[-0.82, 1.18, 0.06]} radius={0.02} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial color="#94A3B8" roughness={0.22} /></RoundedBox>
      <RoundedBox args={[0.28, 2.36, 0.24]} position={[0.82, 1.18, 0.06]} radius={0.02} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial color="#94A3B8" roughness={0.22} /></RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.26]} position={[0, 2.23, 0.06]} radius={0.02} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial color="#94A3B8" roughness={0.22} /></RoundedBox>
      {showRoomSigns && <Billboard position={[0, 2.65, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signTex} transparent /></mesh></Billboard>}
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
  const badgeTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
    grad.addColorStop(0, '#34D399'); grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(w / 2 - 24, h / 2, 72, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#A7F3D0'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 58px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(zone.code, w / 2 - 24, h / 2 + 4);
    if (zone.subCode) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; ctx.beginPath(); ctx.roundRect(w / 2 + 28, h / 2 + 6, 108, 44, 14); ctx.fill();
      ctx.fillStyle = '#ECFDF5'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(zone.subCode, w / 2 + 82, h / 2 + 28);
    }
  }, 320, 196), [zone.code, zone.subCode]);

  useEffect(() => () => badgeTex.dispose(), [badgeTex]);
  useFrame(({ clock }) => { if (pulseRef.current) { const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05; pulseRef.current.scale.set(s, s, 1); } });

  return (
    <group position={zone.pos} onClick={(e) => { e.stopPropagation(); playLegoSnapSound(); onSelect(zone); }}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.42, 0.52, 24]} /><meshBasicMaterial color="#34D399" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><circleGeometry args={[0.42, 24]} /><meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} /></mesh>
      <Billboard position={[0.06, 0.38, 0]}><mesh><planeGeometry args={[0.74, 0.44]} /><meshBasicMaterial map={badgeTex} transparent depthWrite={false} /></mesh></Billboard>
    </group>
  );
}

// =====================================================================
// 🟡 정통  미니피겨(LEGO Minifigure) 전 층 공용 캐릭터
// (원통형 노란 헤드 + 정수리 스터드 + 각진 토르소 + C자형 집게손 + 직각 다리)
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
      if (word.length > maxCharsPerLine) { lines.push(word.slice(0, maxCharsPerLine)); current = word.slice(maxCharsPerLine); }
      else current = word;
    } else current = candidate;
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export function CharacterHairStyle({ style = 'short', hairColor = '#27272A' }) {
  if (style === 'long_wave') {
    return (
      <group>
        <RoundedBox args={[0.38, 0.14, 0.36]} position={[0, 0.15, -0.02]} radius={0.05} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.10, 0.36, 0.24]} position={[-0.17, -0.04, -0.04]} radius={0.03} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.10, 0.36, 0.24]} position={[0.17, -0.04, -0.04]} radius={0.03} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.36, 0.38, 0.12]} position={[0, -0.05, -0.16]} radius={0.04} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
      </group>
    );
  }
  if (style === 'bob') {
    return (
      <group>
        <RoundedBox args={[0.38, 0.14, 0.36]} position={[0, 0.15, -0.01]} radius={0.05} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.09, 0.24, 0.22]} position={[-0.17, 0.01, -0.02]} radius={0.03} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.09, 0.24, 0.22]} position={[0.17, 0.01, -0.02]} radius={0.03} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.36, 0.24, 0.11]} position={[0, 0.01, -0.15]} radius={0.03} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
      </group>
    );
  }
  if (style === 'bun') {
    return (
      <group>
        <RoundedBox args={[0.36, 0.13, 0.35]} position={[0, 0.15, -0.02]} radius={0.05} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <mesh position={[0, 0.26, -0.10]} castShadow><sphereGeometry args={[0.11, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.18} /></mesh>
      </group>
    );
  }
  if (style === 'parted') {
    return (
      <group>
        <RoundedBox args={[0.36, 0.13, 0.34]} position={[0, 0.15, -0.02]} radius={0.045} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.20, 0.08, 0.12]} position={[-0.07, 0.16, 0.13]} rotation={[0, 0, 0.18]} radius={0.025}><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
        <RoundedBox args={[0.16, 0.07, 0.12]} position={[0.09, 0.16, 0.13]} rotation={[0, 0, -0.15]} radius={0.025}><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
      </group>
    );
  }
  return (
    <group>
      <RoundedBox args={[0.36, 0.12, 0.34]} position={[0, 0.145, -0.02]} radius={0.04} castShadow><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[0.34, 0.12, 0.10]} position={[0, 0.06, -0.15]} radius={0.02}><meshStandardMaterial color={hairColor} roughness={0.18} /></RoundedBox>
    </group>
  );
}

export function SharedChibiAvatar({
  position = [0, 0, 0],
  targetPosition = null,
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
  skinColor = '#FACC15', // 클래식  옐로우!
  nameTagTexture = null,
  speechBubbleText = null,
  onClick = null,
  seedOffset = 0,
  autoRotatePreview = false
}) {
  const outerGroupRef = useRef();
  const rootRef = useRef();
  const headGroupRef = useRef();
  const eyesOpenGroupRef = useRef();
  const mouthRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const isFemale = gender === 'female' || isSkirt;
  const patrolState = useRef({ z: position[2], dir: 1, pauseTimer: 0 });
  const legoYellow = '#FCD34D';

  const isPraying = emote === 'pray';
  const isHappyEyes = emote === 'dance' || emote === 'praise' || emote === 'heart';
  const isTalking = Boolean(speechBubbleText);

  const bubbleData = useMemo(() => {
    if (!speechBubbleText) return null;
    const colonIdx = speechBubbleText.indexOf(':');
    const speakerName = colonIdx > -1 ? speechBubbleText.slice(0, colonIdx).trim() : '';
    const bodyText = colonIdx > -1 ? speechBubbleText.slice(colonIdx + 1).trim() : speechBubbleText;
    const wrappedLines = wrapKoreanSpeechText(bodyText, 19);

    const tex = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath(); ctx.roundRect(14, 10, w - 28, h - 34, 28); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#10B981'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2 - 14, h - 24); ctx.lineTo(w / 2 + 14, h - 24); ctx.lineTo(w / 2, h - 4); ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'; ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center';
      let startY = speakerName ? 44 : 54;
      if (speakerName) { ctx.fillStyle = '#059669'; ctx.font = '900 22px sans-serif'; ctx.fillText(speakerName, w / 2, startY); startY += 32; }
      ctx.fillStyle = '#0F172A'; ctx.font = '800 24px sans-serif';
      wrappedLines.forEach((line, idx) => ctx.fillText(line, w / 2, startY + idx * 30));
    }, 500, 165);
    return { tex, planeW: 1.82, planeH: 0.59 };
  }, [speechBubbleText]);

  useEffect(() => () => { if (bubbleData?.tex) bubbleData.tex.dispose(); }, [bubbleData]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime + seedOffset;
    let walkingNow = isWalking;

    if (autoRotatePreview && outerGroupRef.current) {
      outerGroupRef.current.rotation.y += delta * 0.65;
    } else if (targetPosition && outerGroupRef.current) {
      const curX = outerGroupRef.current.position.x, curZ = outerGroupRef.current.position.z;
      if (Math.hypot(targetPosition[0] - curX, targetPosition[2] - curZ) > 0.03) {
        walkingNow = true;
        outerGroupRef.current.position.x = THREE.MathUtils.lerp(curX, targetPosition[0], delta * 8.5);
        outerGroupRef.current.position.z = THREE.MathUtils.lerp(curZ, targetPosition[2], delta * 8.5);
      }
      outerGroupRef.current.rotation.y = THREE.MathUtils.lerp(outerGroupRef.current.rotation.y, rotationY, delta * 9.0);
    } else if (patrolZ && outerGroupRef.current) {
      const st = patrolState.current;
      if (st.pauseTimer > 0) { st.pauseTimer -= delta; walkingNow = false; }
      else {
        walkingNow = true;
        st.z += st.dir * delta * 0.65;
        if (st.z > patrolZ[1]) { st.z = patrolZ[1]; st.dir = -1; st.pauseTimer = 2.6; }
        else if (st.z < patrolZ[0]) { st.z = patrolZ[0]; st.dir = 1; st.pauseTimer = 2.6; }
        outerGroupRef.current.position.z = st.z;
        outerGroupRef.current.rotation.y = st.dir > 0 ? 0.2 : Math.PI - 0.2;
      }
    }

    if (eyesOpenGroupRef.current) {
      const blinkCycle = t % 3.6;
      eyesOpenGroupRef.current.scale.y = THREE.MathUtils.lerp(eyesOpenGroupRef.current.scale.y, blinkCycle > 3.46 ? 0.08 : 1.0, 0.45);
    }
    if (mouthRef.current) {
      mouthRef.current.scale.y = isTalking ? 0.8 + Math.abs(Math.sin(t * 14)) * 1.1 : isHappyEyes ? 1.4 : 1.0;
    }

    //  직각 다리 관절 모션
    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2;
        rightLegRef.current.rotation.x = -Math.PI / 2;
        leftLegRef.current.position.set(-0.085, 0.26, 0.12);
        rightLegRef.current.position.set(0.085, 0.26, 0.12);
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 14.0) * 0.65;
        leftLegRef.current.rotation.x = kick; rightLegRef.current.rotation.x = -kick;
        leftLegRef.current.position.set(-0.085, 0.28, 0); rightLegRef.current.position.set(0.085, 0.28, 0);
      } else if (walkingNow) {
        const sw = Math.sin(t * 10.5) * 0.62;
        leftLegRef.current.rotation.x = sw; rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.085, 0.28, 0); rightLegRef.current.position.set(0.085, 0.28, 0);
      } else {
        leftLegRef.current.rotation.x = 0; rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.085, 0.28, 0); rightLegRef.current.position.set(0.085, 0.28, 0);
      }
    }

    //  팔 관절 모션
    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'bless') { leftArmRef.current.rotation.set(-2.1, 0, 0.25); rightArmRef.current.rotation.set(-2.1, 0, -0.25); }
      else if (emote === 'pray') { leftArmRef.current.rotation.set(-1.15, 0, -0.35); rightArmRef.current.rotation.set(-1.15, 0, 0.35); }
      else if (emote === 'dance') { leftArmRef.current.rotation.set(0, 0, 2.5 + Math.sin(t * 12) * 0.4); rightArmRef.current.rotation.set(0, 0, -2.5 + Math.cos(t * 12) * 0.4); }
      else if (emote === 'praise' || emote === 'heart') { leftArmRef.current.rotation.set(0.1, 0, 2.75); rightArmRef.current.rotation.set(0.1, 0, -2.75); }
      else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) { rightArmRef.current.rotation.set(0.2, 0, -2.4 + Math.sin(t * 10) * 0.35); leftArmRef.current.rotation.set(0, 0, 0.12); }
      else if (isSeated) { leftArmRef.current.rotation.set(-0.55, 0, 0.1); rightArmRef.current.rotation.set(-0.55, 0, -0.1); }
      else if (walkingNow) { const sw = Math.sin(t * 10.5) * 0.52; leftArmRef.current.rotation.set(-sw, 0, 0.12); rightArmRef.current.rotation.set(sw, 0, -0.12); }
      else { leftArmRef.current.rotation.set(0, 0, 0.12); rightArmRef.current.rotation.set(0, 0, -0.12); }
    }

    if (headGroupRef.current) {
      if (isPraying) headGroupRef.current.rotation.set(0.28, 0, 0);
      else headGroupRef.current.rotation.set(0, Math.cos(t * 1.4) * 0.08, 0);
    }

    if (rootRef.current) {
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.16 : 0;
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 10.5)) * 0.045 : 0;
      rootRef.current.position.y = (isSeated ? 0.15 : 0) + bounce + jump;
      rootRef.current.rotation.y = emote === 'dance' ? Math.sin(t * 6) * 0.45 : 0;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><circleGeometry args={[0.26, 14]} /><meshBasicMaterial color="#0F172A" transparent opacity={0.22} /></mesh>

      <group ref={rootRef}>
        {/*  골반 브릭 (Hips) */}
        <RoundedBox args={[0.31, 0.08, 0.17]} position={[0, 0.30, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color={pantsColor} roughness={0.2} />
        </RoundedBox>

        {/*  다리 (스커트 브릭 또는 각진 좌/우  다리) */}
        {isFemale && !isSeated ? (
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.21, 0.28, 4]} rotation={[0, Math.PI / 4, 0]} />
            <meshStandardMaterial color={pantsColor} roughness={0.2} />
          </mesh>
        ) : (
          <>
            <group ref={leftLegRef} position={[-0.085, 0.28, 0]}>
              <RoundedBox args={[0.135, 0.28, 0.15]} position={[0, -0.14, 0]} radius={0.015} castShadow>
                <meshStandardMaterial color={pantsColor} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.135, 0.07, 0.19]} position={[0, -0.245, 0.025]} radius={0.012} castShadow>
                <meshStandardMaterial color={pantsColor} roughness={0.2} />
              </RoundedBox>
            </group>
            <group ref={rightLegRef} position={[0.085, 0.28, 0]}>
              <RoundedBox args={[0.135, 0.28, 0.15]} position={[0, -0.14, 0]} radius={0.015} castShadow>
                <meshStandardMaterial color={pantsColor} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.135, 0.07, 0.19]} position={[0, -0.245, 0.025]} radius={0.012} castShadow>
                <meshStandardMaterial color={pantsColor} roughness={0.2} />
              </RoundedBox>
            </group>
          </>
        )}

        {/*  사다리꼴 유광 토르소 */}
        <RoundedBox args={[0.32, 0.33, 0.18]} position={[0, 0.50, 0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color={shirtColor} roughness={0.18} />
        </RoundedBox>
        {/* 셔츠 칼라 / 넥타이 포인트 */}
        <mesh position={[0, 0.62, 0.092]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.055, 0.09, 3]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/*  목 조인트 */}
        <mesh position={[0, 0.69, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.08, 10]} />
          <meshStandardMaterial color={legoYellow} roughness={0.18} />
        </mesh>

        {/*  양팔 + 시그니처 C자형 집게손 (Torus Arc) */}
        <group ref={leftArmRef} position={[-0.21, 0.60, 0]}>
          <RoundedBox args={[0.09, 0.24, 0.09]} position={[0, -0.10, 0]} radius={0.025} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.18} />
          </RoundedBox>
          <mesh position={[0, -0.26, 0.02]} rotation={[0, Math.PI / 2, 0.4]} castShadow>
            <torusGeometry args={[0.048, 0.018, 6, 12, Math.PI * 1.45]} />
            <meshStandardMaterial color={legoYellow} roughness={0.18} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.21, 0.60, 0]}>
          <RoundedBox args={[0.09, 0.24, 0.09]} position={[0, -0.10, 0]} radius={0.025} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.18} />
          </RoundedBox>
          <mesh position={[0, -0.26, 0.02]} rotation={[0, Math.PI / 2, 0.4]} castShadow>
            <torusGeometry args={[0.048, 0.018, 6, 12, Math.PI * 1.45]} />
            <meshStandardMaterial color={legoYellow} roughness={0.18} />
          </mesh>
        </group>

        {/* 🟡  원통형 노란 헤드 + 정수리 스터드 + 실시간 표정 */}
        <group ref={headGroupRef} position={[0, 0.85, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.175, 0.175, 0.26, 18]} />
            <meshStandardMaterial color={legoYellow} roughness={0.16} />
          </mesh>
          {/* 정수리  스터드 */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.07, 14]} />
            <meshStandardMaterial color={legoYellow} roughness={0.16} />
          </mesh>

          <CharacterHairStyle style={hairStyle || (isFemale ? 'bob' : 'short')} hairColor={hairColor} />

          {/*  클래식 프린트 표정 */}
          {hasSunglasses ? (
            <group position={[0, 0.02, 0.175]}>
              <RoundedBox args={[0.12, 0.065, 0.02]} position={[-0.068, 0, 0]} radius={0.015}><meshStandardMaterial color="#18181B" roughness={0.12} /></RoundedBox>
              <RoundedBox args={[0.12, 0.065, 0.02]} position={[0.068, 0, 0]} radius={0.015}><meshStandardMaterial color="#18181B" roughness={0.12} /></RoundedBox>
            </group>
          ) : isPraying ? (
            <group position={[0, 0.01, 0.176]}>
              <mesh position={[-0.062, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.024, 0.0055, 6, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.062, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.024, 0.0055, 6, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : isHappyEyes ? (
            <group position={[0, 0.01, 0.176]}>
              <mesh position={[-0.062, 0, 0]}><torusGeometry args={[0.024, 0.0055, 6, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.062, 0, 0]}><torusGeometry args={[0.024, 0.0055, 6, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : (
            <group ref={eyesOpenGroupRef}>
              {[-0.062, 0.062].map((ex, ei) => (
                <group key={ei} position={[ex, 0.018, 0.172]}>
                  <mesh><sphereGeometry args={[0.022, 8, 8]} /><meshBasicMaterial color="#18181B" /></mesh>
                  <mesh position={[0.007, 0.008, 0.014]}><sphereGeometry args={[0.008, 6, 6]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
                </group>
              ))}
            </group>
          )}

          {/*  미소 입 */}
          <group ref={mouthRef} position={[0, -0.048, 0.174]}>
            {isHappyEyes || isTalking ? (
              <mesh scale={[1.15, 0.9, 0.5]}><circleGeometry args={[0.022, 10, Math.PI, Math.PI]} /><meshBasicMaterial color="#18181B" side={THREE.DoubleSide} /></mesh>
            ) : (
              <mesh rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.032, 0.005, 5, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            )}
          </group>
        </group>

        {nameTagTexture && <Billboard position={[0, 1.35, 0]}><mesh renderOrder={12}><planeGeometry args={[1.55, 0.34]} /><meshBasicMaterial map={nameTagTexture} transparent depthTest={false} /></mesh></Billboard>}
        {bubbleData && <Billboard position={[0, 1.65, 0]}><mesh renderOrder={15}><planeGeometry args={[bubbleData.planeW, bubbleData.planeH]} /><meshBasicMaterial map={bubbleData.tex} transparent depthTest={false} /></mesh></Billboard>}
      </group>
    </group>
  );
}

function RemoteMultiplayerAvatar1F({ peer, onClickPeer }) {
  const nameTagTex = useMemo(() => {
    const isPastor = isAuthorizedPastor(peer.name, peer.office);
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = isPastor ? 'rgba(88, 28, 135, 0.96)' : 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath(); ctx.roundRect(6, 6, w - 12, h - 12, 48); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = isPastor ? '#FACC15' : '#34D399'; ctx.stroke();
      ctx.fillStyle = isPastor ? '#FACC15' : '#34D399';
      ctx.beginPath(); ctx.arc(48, h / 2, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${isPastor ? '✝️ ' : ''}${peer.name || '성도'}`, w / 2 + 16, h / 2 + 2);
    }, 440, 96);
  }, [peer.name, peer.office]);

  useEffect(() => () => nameTagTex.dispose(), [nameTagTex]);

  return (
    <SharedChibiAvatar
      position={[peer.x ?? -0.8, 0.08, peer.z ?? 2.2]}
      targetPosition={[peer.x ?? -0.8, 0.08, peer.z ?? 2.2]}
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
      onClick={(e) => { e.stopPropagation(); if (onClickPeer) onClickPeer(peer); }}
    />
  );
}
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

// =====================================================================
// 🧱 1층  모듈러 마스터피스 디오라마 씬 (블랙 베이스 · 테라코타 필로티 · 단일 드로우콜 스터드)
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
  const floorTileTex = useMemo(() => makeLegoFloorTileTexture('#F5E6C4', '#D9C79E', 8), []);
  const wallBrickTex = useMemo(() => makeLegoWallBrickTexture('#F3E5AB', '#D5C484'), []);
  const woodBrickTex = useMemo(() => makeWoodGrainTexture('#A85D2A', '#6E3814'), []);
  const terracottaTex = useMemo(() => makeWoodGrainTexture('#9A4A2E', '#6E301B'), []);

  // InstancedMesh 단일 드로우콜용 스터드 좌표 (모바일 60FPS 유지)
  const wallTopStuds = useMemo(() => {
    const pts = [];
    // 북쪽 벽 상단 스터드
    for (let x = -4.1; x <= 4.7; x += 0.48) pts.push([x, 2.54, -4.4]);
    // 동쪽 벽 상단 스터드
    for (let z = -4.0; z <= 4.2; z += 0.48) pts.push([4.8, 2.54, z]);
    // 서쪽 로비/주차장 경계 벽 상단 스터드
    for (let z = -4.0; z <= 1.2; z += 0.48) pts.push([-4.2, 1.54, z]);
    return pts;
  }, []);

  const parkingStuds = useMemo(() => {
    const pts = [];
    // 주차장 외곽 스터드 라인 (프리뷰처럼 깔끔한 타일+스터드 혼합)
    for (let x = -10.4; x <= -4.8; x += 0.52) {
      pts.push([x, 0.05, 4.15], [x, 0.05, -3.55]);
    }
    return pts;
  }, []);

  const awningStuds = useMemo(() => {
    const pts = [];
    for (let x = -2.1; x <= 1.1; x += 0.45) {
      pts.push([x, 2.72, 4.55], [x, 2.60, 4.92]);
    }
    return pts;
  }, []);

  const exteriorTextures = useMemo(() => ({
    churchSign: makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#18181B'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#FACC15'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#2563EB'; ctx.fillRect(28, 28, 95, h - 56);
      ctx.fillStyle = '#4ADE80'; ctx.fillRect(68, 38, 16, h - 76); ctx.fillRect(42, 68, 68, 16);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 56px serif'; ctx.textAlign = 'left'; ctx.fillText('좋은나무교회', 145, 92);
      ctx.fillStyle = '#FDE047'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('LEGO GOOD TREE CHURCH', 148, 138);
    }, 512, 160),
    purpleBanner: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#6B21A8'); grad.addColorStop(1, '#9333EA');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 36px serif'; ctx.textAlign = 'center';
      ctx.fillText('{ 당신이 더 행복했으면 좋겠습니다 }', w / 2, h / 2 - 8);
      ctx.fillStyle = '#FDE047'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('김포 좋은나무교회', w / 2, h / 2 + 36);
    }, 512, 160),
    blueLedSign: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0284C7'); grad.addColorStop(1, '#1E3A8A');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FDE047'; ctx.font = '900 28px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GOOD TREE WORSHIP', w / 2, 65);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 36px sans-serif'; ctx.fillText('주일예배 안내', w / 2, 130);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('1부 09:00 | 2부 11:00', w / 2, 195);
      ctx.fillText('2F 북카페 / 3F 대예배당', w / 2, 245);
      ctx.fillText('4F 유아실 / 6F 교육관', w / 2, 295);
    }, 280, 380)
  }), []);

  const signs = useMemo(() => ({
    lounge: makeRoomSignTexture('4인용  대기석', '블랙 브릭 벤치 · 새가족 영접', '#F59E0B'),
    elevator: makeRoomSignTexture('1F  엘리베이터 🛗', '자동문 개폐 · 전 층(2F~7F) 이동', '#10B981'),
    upStairs: makeRoomSignTexture('상층 연결 계단', '2F~7F 도보 이동', '#0284C7'),
    b1Stairs: makeRoomSignTexture('B1F 계단실', '지하 1층 내려가는 계단', '#6366F1'),
    parking: makeRoomSignTexture('필로티  주차장 🚗', '주차팀 인사 · SUV · 블루 세단', '#3B82F6'),
    brochure: makeRoomSignTexture('홍보물·주보 키오스크', '클릭 시 주보·비전·방명록 열기', '#EC4899')
  }), []);

  useEffect(() => () => {
    floorTileTex.dispose(); wallBrickTex.dispose(); woodBrickTex.dispose(); terracottaTex.dispose();
    Object.values(exteriorTextures).forEach((t) => t.dispose());
    Object.values(signs).forEach((t) => t.dispose());
  }, [floorTileTex, wallBrickTex, woodBrickTex, terracottaTex, exteriorTextures, signs]);

  return (
    <group>
      {/* 0.  모듈러 유광 블랙 디스플레이 베이스 테두리 (프리뷰 핵심 포인트!) */}
      <RoundedBox args={[16.8, 0.32, 10.6]} position={[-2.9, -0.14, 0.3]} radius={0.04} receiveShadow>
        <meshStandardMaterial color="#18181B" roughness={0.22} metalness={0.12} />
      </RoundedBox>
      {/* 정문 앞  그레이 보도 타일 & 차도 */}
      <RoundedBox args={[18.2, 0.08, 2.0]} position={[-2.2, 0.02, 5.6]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#94A3B8" roughness={0.22} />
      </RoundedBox>
      <RoundedBox args={[18.2, 0.06, 2.6]} position={[-2.2, 0.0, 7.7]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.35} />
      </RoundedBox>
      <MovingRacingSupercar1F />

      {/* 1. 좌측 필로티  주차장 (테라코타 브릭 기둥 + 상단 브릭 빔) */}
      <group position={[-7.6, 0, 0]}>
        <RoundedBox args={[6.5, 0.06, 9.0]} position={[0, 0.02, 0.2]} radius={0.01} receiveShadow>
          <meshStandardMaterial color="#475569" roughness={0.25} />
        </RoundedBox>
        {[-2.4, 0.0, 2.4].map((pz, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.055, pz]}>
            <planeGeometry args={[3.4, 0.12]} />
            <meshBasicMaterial color="#F8FAFC" />
          </mesh>
        ))}

        {/* 테라코타 브릭 필로티 기둥 4개 + 상단 연결 빔 */}
        {[[-2.6, 4.2], [2.6, 4.2], [-2.6, -3.5], [2.6, -3.5]].map(([cx, cz], idx) => (
          <group key={`piloti_${idx}`} position={[cx, 0, cz]}>
            <RoundedBox args={[0.56, 3.0, 0.56]} position={[0, 1.5, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial map={terracottaTex} roughness={0.22} />
            </RoundedBox>
            {/* 기둥 하단 블랙 베이스 브릭 */}
            <RoundedBox args={[0.62, 0.24, 0.62]} position={[0, 0.12, 0]} radius={0.015}>
              <meshStandardMaterial color="#27272A" roughness={0.2} />
            </RoundedBox>
          </group>
        ))}
        {/* 테라코타 상단 브릭 거더 빔 */}
        <RoundedBox args={[5.8, 0.36, 0.44]} position={[0, 2.98, -3.5]} radius={0.02} castShadow>
          <meshStandardMaterial map={terracottaTex} roughness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.44, 0.36, 8.2]} position={[-2.6, 2.98, 0.35]} radius={0.02} castShadow>
          <meshStandardMaterial map={terracottaTex} roughness={0.22} />
        </RoundedBox>

        <SmartCutawayWall1F wallSide="south" minOpacity={0.22}>
          <RoundedBox args={[6.4, 0.92, 0.34]} position={[0, 2.75, 4.2]} radius={0.02} castShadow>
            <meshStandardMaterial map={terracottaTex} roughness={0.22} />
          </RoundedBox>
          <mesh position={[0, 2.74, 4.39]}>
            <planeGeometry args={[4.2, 0.72]} />
            <meshBasicMaterial map={exteriorTextures.purpleBanner} />
          </mesh>
        </SmartCutawayWall1F>

        <DetailedIoniq5EV position={[-1.25, 0.04, -1.35]} rotationY={Math.PI / 2} />
        <DetailedAvanteNBlue position={[-1.25, 0.04, 1.15]} rotationY={Math.PI / 2} />

        {showRoomSigns && (
          <Billboard position={[0.5, 1.75, 2.2]}>
            <mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.parking} transparent /></mesh>
          </Billboard>
        )}
      </group>

      {/* 2. 1층 메인  로비 */}
      <group>
        <RoundedBox args={[9.0, 0.08, 8.8]} position={[0.3, 0.04, 0.0]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={floorTileTex} roughness={0.18} />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.7, 0.085, 3.35]} receiveShadow>
          <planeGeometry args={[2.2, 1.15]} />
          <meshStandardMaterial color="#B91C1C" roughness={0.24} />
        </mesh>

        {/* 로비  방풍 브릭 가벽 */}
        <RoundedBox args={[1.35, 1.45, 0.22]} position={[-3.5, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.35, 1.45, 0.22]} position={[1.65, 0.72, 1.15]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
        </RoundedBox>

        {/* 좌측 4인용  블랙 대기석 & 브릭 테이블 */}
        <group position={[-3.48, 0.08, -2.0]}>
          <FourSeaterChromeLobbyBench
            position={[0, 0, 0]}
            rotationY={Math.PI / 2}
            onSit={(offsetZ, seatNum) => {
              onSitOnSofa({ x: -3.48, z: -2.0 - offsetZ, rotY: Math.PI / 2, rowLabel: `1F  4인용 대기 의자 (${seatNum}번석)` });
            }}
          />
          <group position={[1.05, 0, 0]}>
            <RoundedBox args={[0.68, 0.10, 1.65]} position={[0, 0.50, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial map={woodBrickTex} roughness={0.2} />
            </RoundedBox>
            <RoundedBox args={[0.56, 0.42, 1.52]} position={[0, 0.24, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#92400E" roughness={0.22} />
            </RoundedBox>
          </group>
          {showRoomSigns && (
            <Billboard position={[0.2, 1.65, 0]}><mesh><planeGeometry args={[1.18, 0.52]} /><meshBasicMaterial map={signs.lounge} transparent /></mesh></Billboard>
          )}
        </group>

        {/* 북쪽  우드 브릭 아트월 & 황금 브릭 십자가 & 안내데스크 */}
        <group position={[-0.8, 0.08, -3.2]}>
          <group position={[0, 1.45, -1.05]}>
            <RoundedBox args={[3.4, 2.25, 0.14]} radius={0.02} castShadow>
              <meshStandardMaterial map={woodBrickTex} roughness={0.22} />
            </RoundedBox>
            {/* 황금  브릭 십자가 */}
            <RoundedBox args={[0.16, 0.96, 0.10]} position={[0, 0.16, 0.10]} radius={0.015} castShadow>
              <meshStandardMaterial color="#FACC15" metalness={0.45} roughness={0.18} />
            </RoundedBox>
            <RoundedBox args={[0.62, 0.16, 0.10]} position={[0, 0.34, 0.10]} radius={0.015} castShadow>
              <meshStandardMaterial color="#FACC15" metalness={0.45} roughness={0.18} />
            </RoundedBox>
          </group>

          {/*  브릭 안내데스크 */}
          <RoundedBox args={[2.1, 0.88, 0.68]} position={[0, 0.44, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={woodBrickTex} roughness={0.2} />
          </RoundedBox>
          <RoundedBox args={[2.22, 0.08, 0.76]} position={[0, 0.91, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#D97706" roughness={0.18} />
          </RoundedBox>

          {/* 디지털 주보 키오스크 */}
          <group position={[-0.95, 0, 0.55]} onClick={(e) => { e.stopPropagation(); playLegoSnapSound(); if (onOpenBrochureModal) onOpenBrochureModal(); }}>
            <RoundedBox args={[0.48, 1.38, 0.12]} position={[0, 0.69, 0]} rotation={[-0.12, 0.25, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0.01, 0.78, 0.065]} rotation={[-0.12, 0.25, 0]}>
              <planeGeometry args={[0.38, 0.82]} />
              <meshBasicMaterial map={exteriorTextures.blueLedSign} />
            </mesh>
          </group>

          {showRoomSigns && (
            <Billboard position={[-0.65, 1.85, 0.55]}>
              <mesh onClick={(e) => { e.stopPropagation(); if (onOpenBrochureModal) onOpenBrochureModal(); }}>
                <planeGeometry args={[1.18, 0.50]} /><meshBasicMaterial map={signs.brochure} transparent />
              </mesh>
            </Billboard>
          )}

          {/*  관엽식물 화분 3종 */}
          <BotanicalMultiLeafPlant position={[-1.55, 0, 0.15]} variant="ficus_tree" scale={1.08} />
          <BotanicalMultiLeafPlant position={[2.05, 0, 0.15]} variant="dracaena" scale={1.0} />
          <BotanicalMultiLeafPlant position={[-2.15, 0, 2.85]} variant="palm" scale={1.05} />
        </group>

        <ClassicChurchPew
          position={[0.25, 0.08, 1.65]}
          width={1.65}
          onSit={() => onSitOnSofa({ x: 0.25, z: 1.65, rotY: 0, rowLabel: '1F 로비  원목 장의자석' })}
        />
      </group>

      {/* 3. 좌측 유리 브릭 경계벽 & 정문 진초록  어닝 */}
      <RoundedBox args={[0.22, 1.5, 5.8]} position={[-4.2, 0.75, -1.5]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.22, 1.5, 1.4]} position={[-4.2, 0.75, 3.7]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
      </RoundedBox>

      <SmartCutawayWall1F wallSide="south" minOpacity={0.22}>
        <group position={[0, 0, 4.4]}>
          {/* 투명  유리문 프레임 */}
          <group position={[-0.7, 0, 0]}>
            <RoundedBox args={[2.45, 0.16, 0.28]} position={[0, 2.22, 0]} radius={0.02}><meshStandardMaterial color="#18181B" roughness={0.2} /></RoundedBox>
            <mesh position={[-0.85, 1.1, 0.35]} rotation={[0, -0.5, 0]}><boxGeometry args={[0.95, 2.1, 0.06]} /><meshStandardMaterial color="#BAE6FD" transparent opacity={0.45} roughness={0.08} /></mesh>
            <mesh position={[0.85, 1.1, 0.35]} rotation={[0, 0.5, 0]}><boxGeometry args={[0.95, 2.1, 0.06]} /><meshStandardMaterial color="#BAE6FD" transparent opacity={0.45} roughness={0.08} /></mesh>
            {/* 진초록  슬로프 브릭 어닝 */}
            <RoundedBox args={[3.6, 0.44, 0.96]} position={[-0.45, 2.52, 0.38]} rotation={[0.32, 0, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#15803D" roughness={0.18} />
            </RoundedBox>
            <mesh position={[-0.45, 3.12, 0.15]}><planeGeometry args={[3.4, 0.95]} /><meshBasicMaterial map={exteriorTextures.churchSign} /></mesh>
          </group>
          <group position={[2.65, 0, 0]}>
            <RoundedBox args={[4.3, 2.5, 0.24]} position={[0, 1.25, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
            </RoundedBox>
            <mesh position={[0.2, 1.45, 0.14]}><planeGeometry args={[2.6, 1.28]} /><meshBasicMaterial map={exteriorTextures.purpleBanner} /></mesh>
          </group>
        </group>
      </SmartCutawayWall1F>

      {/* 4. 우측 엘리베이터 &  계단실 */}
      <AnimatedStainlessElevator1F
        position={[3.05, 0.08, -2.85]}
        rotationY={-Math.PI / 2}
        playerIdxRef={playerIdxRef}
        forceOpen={isElevatorModalOpen}
        onClickElevator={() => onSelectZone(ZONES_1F[3])}
        signTex={signs.elevator}
        showRoomSigns={showRoomSigns}
      />

      <group position={[3.55, 0, -0.1]} onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_1F[4]); }}>
        <RoundedBox args={[2.3, 0.1, 2.6]} position={[0, 0.05, 0]} radius={0.01} receiveShadow><meshStandardMaterial color="#E2E8F0" roughness={0.2} /></RoundedBox>
        {Array.from({ length: 7 }).map((_, i) => (
          <RoundedBox key={`up1_${i}`} args={[0.28, 0.12 + i * 0.10, 1.6]} position={[-0.8 + i * 0.26, (0.12 + i * 0.10) / 2, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} roughness={0.2} />
          </RoundedBox>
        ))}
        {showRoomSigns && <Billboard position={[0, 1.95, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.upStairs} transparent /></mesh></Billboard>}
      </group>

      <group position={[3.55, 0, 2.85]} onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_1F[5]); }}>
        <RoundedBox args={[2.3, 0.1, 2.7]} position={[0, 0.05, 0]} radius={0.01} receiveShadow><meshStandardMaterial color="#CBD5E1" roughness={0.2} /></RoundedBox>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox key={`b1_${i}`} args={[0.28, 0.48 - i * 0.07, 1.5]} position={[-0.7 + i * 0.26, (0.48 - i * 0.07) / 2, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? '#94A3B8' : '#64748B'} roughness={0.2} />
          </RoundedBox>
        ))}
        {showRoomSigns && <Billboard position={[0, 1.95, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.b1Stairs} transparent /></mesh></Billboard>}
      </group>

      {/* 북쪽 & 동쪽  브릭 외벽 */}
      <SmartCutawayWall1F wallSide="north">
        <RoundedBox args={[9.2, 2.5, 0.24]} position={[0.3, 1.25, -4.4]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
        </RoundedBox>
      </SmartCutawayWall1F>
      <SmartCutawayWall1F wallSide="east">
        <RoundedBox args={[0.24, 2.5, 9.0]} position={[4.8, 1.25, 0.0]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={wallBrickTex} roughness={0.2} />
        </RoundedBox>
      </SmartCutawayWall1F>

      {/* ★ 단일 드로우콜  스터드(돌기) 렌더링 (벽 상단 · 주차장 · 어닝) */}
      <LegoStudGrid positions={wallTopStuds} color="#E5D392" radius={0.11} height={0.07} />
      <LegoStudGrid positions={parkingStuds} color="#64748B" radius={0.11} height={0.06} />
      <LegoStudGrid positions={awningStuds} color="#16A34A" radius={0.11} height={0.06} />

      {/* 5. 로비  미니피겨 NPC */}
      {NPCS_1F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_1F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;
        const isBlessingNow = holyLightEvent && holyLightEvent.pastorName === npc.name;

        return (
          <SharedChibiAvatar
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
            onClick={(e) => { e.stopPropagation(); playLegoSnapSound(); if (onSelectNpcForChat) onSelectNpcForChat(npc); }}
          />
        );
      })}

      {/* 6. 멀티플레이어 원격 성도 */}
      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar1F key={peer.clientId} peer={peer} onClickPeer={onSelectRemotePeer} />
      ))}

      {/* 7. 축도 홀리라이트 */}
      {holyLightEvent && (
        <HolyLightBeamEffect targetPos={holyLightEvent.targetPos} pastorName={holyLightEvent.pastorName} targetName={holyLightEvent.targetName} />
      )}

      {/* 8. 7대 상호작용 마커 */}
      {ZONES_1F.map((z) => (
        <HologramMarker1F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) onSitOnSofa(sel.seatTarget);
            else if (sel.isBrochureZone && onOpenBrochureModal) onOpenBrochureModal();
            else onSelectZone(sel);
          }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 모바일 최적화 플레이어 컨트롤러
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
  remotePeers,
  onPositionUpdate
}) {
  const playerGroupRef = useRef();
  const wpIndexRef = useRef(0);
  const walkingRef = useRef(false);
  const [isWalkingState, setIsWalkingState] = useState(false);

  useEffect(() => { wpIndexRef.current = 0; }, [waypoints]);

  const nameTagTex = useMemo(() => {
    const isPastor = isAuthorizedPastor(playerName, playerOffice);
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = isPastor ? 'rgba(88, 28, 135, 0.96)' : 'rgba(30, 33, 40, 0.95)';
      ctx.beginPath(); ctx.roundRect(6, 6, w - 12, h - 12, 48); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = isPastor ? '#FACC15' : 'rgba(56, 189, 248, 0.65)'; ctx.stroke();
      ctx.fillStyle = isPastor ? '#FACC15' : '#38BDF8';
      ctx.beginPath(); ctx.arc(48, h / 2, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 35px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`나 · ${isPastor ? '✝️' : ''}${playerName}`, w / 2 + 18, h / 2 + 2);
    }, 460, 96);
  }, [playerName, playerOffice]);

  useEffect(() => () => nameTagTex.dispose(), [nameTagTex]);

  useFrame((_, delta) => {
    if (!playerGroupRef.current) return;
    if (seatedInfo) {
      playerIdxRef.current = [seatedInfo.x, 0.10, seatedInfo.z];
      playerGroupRef.current.position.set(seatedInfo.x, 0.10, seatedInfo.z);
      playerGroupRef.current.rotation.y = seatedInfo.rotY ?? Math.PI / 2;
      if (walkingRef.current) { walkingRef.current = false; setIsWalkingState(false); }
      return;
    }

    if (!waypoints || waypoints.length === 0) return;
    const currentTarget = waypoints[Math.min(wpIndexRef.current, waypoints.length - 1)];
    if (!currentTarget) return;

    const [cx, , cz] = playerIdxRef.current;
    const [tx, tz] = currentTarget;
    const dx = tx - cx, dz = tz - cz, dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.2);
      const [nx, nz] = resolveCollision1F(cx + (dx / dist) * step, cz + (dz / dist) * step, 0.28, remotePeers);
      const ny = nx >= -4.2 && nz <= 4.4 ? 0.08 : 0.04;
      const angle = Math.atan2(dx, dz);

      playerIdxRef.current = [nx, ny, nz];
      playerGroupRef.current.position.set(nx, ny, nz);
      playerGroupRef.current.rotation.y = angle;
      if (!walkingRef.current) { walkingRef.current = true; setIsWalkingState(true); }
      onPositionUpdate(nx, nz, angle);
    } else {
      if (wpIndexRef.current < waypoints.length - 1) wpIndexRef.current += 1;
      else if (walkingRef.current) { walkingRef.current = false; setIsWalkingState(false); }
    }
  });

  return (
    <group ref={playerGroupRef} position={[playerIdxRef.current[0], 0.08, playerIdxRef.current[2]]} rotation={[0, Math.PI, 0]}>
      <SharedChibiAvatar
        position={[0, 0, 0]}
        rotationY={0}
        gender={avatarConfig.gender}
        hairStyle={avatarConfig.hairStyle}
        isSkirt={Boolean(avatarConfig.isSkirt)}
        hasSunglasses={Boolean(avatarConfig.hasSunglasses)}
        isWalking={isWalkingState}
        isSeated={Boolean(seatedInfo)}
        emote={emote}
        shirtColor={avatarConfig.shirtColor}
        pantsColor={avatarConfig.pantsColor}
        hairColor={avatarConfig.hairColor}
        nameTagTexture={nameTagTex}
        speechBubbleText={myChatBubble ? `${playerName}: ${myChatBubble}` : null}
      />
    </group>
  );
}

function InitialCameraSetup1F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    camera.position.set(isMobile ? -2.5 : -2.2, isMobile ? 14.5 : 11.8, isMobile ? 14.5 : 12.2);
    camera.fov = isMobile ? 42 : 36;
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(-1.6, 0.5, 0.4);
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
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false), []);

  const playerName =
    authUser?.name || authUser?.user_name || authUser?.nickname || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice =
    authUser?.office || authUser?.role || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer1f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const initialSpawnPos = useMemo(() => {
    const randAngle = Math.random() * Math.PI * 2;
    const randRadius = 0.25 + Math.random() * 0.45;
    return [
      Number((-0.8 + Math.cos(randAngle) * randRadius).toFixed(2)),
      0.08,
      Number((2.8 + Math.sin(randAngle) * randRadius).toFixed(2))
    ];
  }, []);

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef(initialSpawnPos);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const localBcRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const peersMapRef = useRef({});

  useEffect(() => {
    const hasEnteredSession = sessionStorage.getItem('gtc_metaverse_session_entered');
    if (!hasEnteredSession) {
      sessionStorage.setItem('gtc_metaverse_session_entered', '1');
      localStorage.setItem('metaverse_active_floor', '1F');
      if (typeof onChangeFloor === 'function') onChangeFloor('1F');
    }
  }, [onChangeFloor]);

  const [avatarConfig, setAvatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gtc_metaverse_avatar_v1');
      return saved ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(saved) } : DEFAULT_AVATAR_CONFIG;
    } catch { return DEFAULT_AVATAR_CONFIG; }
  });
  const [showAvatarModal, setShowAvatarModal] = useState(() => !localStorage.getItem('gtc_metaverse_avatar_v1'));
  const [previewEmote, setPreviewEmote] = useState(null);

  const [waypoints, setWaypoints] = useState([[initialSpawnPos[0], initialSpawnPos[2]]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_1F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');

  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [guestbookList, setGuestbookList] = useState([
    { id: 1, user_name: '이성현 목사', message: ' 좋은나무교회 로비에 오신 모든 성도님들을 축복합니다!', created_at: '오늘' },
    { id: 2, user_name: '김권사', message: ' 미니피겨로 만나니 너무 귀엽고 은혜로워요 🙏', created_at: '오늘' }
  ]);

  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_1F.length), 3800);
    return () => clearInterval(timer);
  }, []);

  const buildMyPayload = useCallback(
    (override = {}) => {
      const [px, , pz] = playerIdxRef.current;
      return {
        clientId: clientIdRef.current, name: playerName, office: playerOffice,
        x: Number(px.toFixed(2)), z: Number(pz.toFixed(2)), rotY: Number((playerRotRef.current || 0).toFixed(2)),
        seated: Boolean(seatedInfo), emote: override.emote !== undefined ? override.emote : emote,
        chatMsg: override.chatMsg !== undefined ? override.chatMsg : myChatBubble,
        avatar: override.avatar || avatarConfig, ts: Date.now()
      };
    },
    [playerName, playerOffice, seatedInfo, emote, myChatBubble, avatarConfig]
  );

  const syncRemotePeersState = useCallback(() => {
    const now = Date.now();
    setRemotePeers(Object.values(peersMapRef.current).filter((p) => p && p.clientId !== clientIdRef.current && now - (p.ts || now) < 18000));
  }, []);

  const broadcastMyState = useCallback((override = {}) => {
    const payload = buildMyPayload(override);
    if (channelRef.current) {
      channelRef.current.track(payload).catch(() => {});
      channelRef.current.send({ type: 'broadcast', event: 'player_sync', payload }).catch(() => {});
    }
    if (localBcRef.current) { try { localBcRef.current.postMessage({ type: 'player_sync', payload }); } catch (_) {} }
  }, [buildMyPayload]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('gtc_metaverse_lobby_1f_bc');
      localBcRef.current = bc;
      bc.onmessage = (ev) => {
        const { type, payload } = ev.data || {};
        if (!payload || payload.clientId === clientIdRef.current) return;
        if (type === 'player_sync') { peersMapRef.current[payload.clientId] = { ...payload, ts: Date.now() }; syncRemotePeersState(); }
        else if (type === 'player_leave') { delete peersMapRef.current[payload.clientId]; syncRemotePeersState(); }
      };
    }

    if (!supabase) return;
    supabase.from('metaverse_guestbook').select('*').order('created_at', { ascending: false }).limit(15).then(({ data }) => { if (data && data.length > 0) setGuestbookList(data); }).catch(() => {});

    const channel = supabase.channel('metaverse_lobby_1f', { config: { presence: { key: clientIdRef.current }, broadcast: { self: false } } });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Object.keys(state).forEach((key) => {
          if (key === clientIdRef.current) return;
          const items = state[key];
          if (items && items.length > 0) peersMapRef.current[key] = { ...items[items.length - 1], clientId: key, ts: Date.now() };
        });
        syncRemotePeersState();
      })
      .on('presence', { event: 'leave' }, ({ key }) => { if (key && peersMapRef.current[key]) { delete peersMapRef.current[key]; syncRemotePeersState(); } })
      .on('broadcast', { event: 'player_sync' }, ({ payload }) => { if (payload && payload.clientId !== clientIdRef.current) { peersMapRef.current[payload.clientId] = { ...payload, ts: Date.now() }; syncRemotePeersState(); } })
      .on('broadcast', { event: 'holy_blessing' }, ({ payload }) => { if (!payload) return; playHolyBlessingSound(); setHolyLightEvent(payload); setTimeout(() => setHolyLightEvent(null), 7000); })
      .on('broadcast', { event: 'guestbook_new' }, ({ payload }) => { if (payload) setGuestbookList((prev) => [payload, ...prev.slice(0, 19)]); })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const initPayload = buildMyPayload();
          await channel.track(initPayload);
          channel.send({ type: 'broadcast', event: 'player_sync', payload: initPayload }).catch(() => {});
        }
      });

    const heartbeat = setInterval(() => {
      const payload = buildMyPayload();
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'player_sync', payload }).catch(() => {});
      if (localBcRef.current) { try { localBcRef.current.postMessage({ type: 'player_sync', payload }); } catch (_) {} }
      syncRemotePeersState();
    }, 1800);

    return () => {
      clearInterval(heartbeat);
      if (localBcRef.current) { try { localBcRef.current.postMessage({ type: 'player_leave', payload: { clientId: clientIdRef.current } }); localBcRef.current.close(); } catch (_) {} }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [playerName, playerOffice, buildMyPayload, syncRemotePeersState]);

  const triggerSocialAction = useCallback((emoteType, chatText = '') => {
    setEmote(emoteType);
    if (chatText) setMyChatBubble(chatText);
    broadcastMyState({ emote: emoteType, chatMsg: chatText });
    setTimeout(() => { setEmote(null); broadcastMyState({ emote: null, chatMsg: chatText }); }, 3800);
    if (chatText) setTimeout(() => { setMyChatBubble(''); broadcastMyState({ emote: null, chatMsg: '' }); }, 5500);
  }, [broadcastMyState]);

  const triggerHolyBenediction = useCallback((pastorDisplayName, targetDisplayName, targetCoords) => {
    const eventPayload = { pastorName: pastorDisplayName, targetName: targetDisplayName, targetPos: targetCoords || [playerIdxRef.current[0], 0.08, playerIdxRef.current[2]], ts: Date.now() };
    playHolyBlessingSound();
    setHolyLightEvent(eventPayload);
    triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 축도를 감사히 받습니다 🙏`);
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'holy_blessing', payload: eventPayload }).catch(() => {});
    setTimeout(() => setHolyLightEvent(null), 7000);
  }, [triggerSocialAction]);

  const handleSaveAvatarCustomization = (nextAvatar) => {
    setAvatarConfig(nextAvatar);
    localStorage.setItem('gtc_metaverse_avatar_v1', JSON.stringify(nextAvatar));
    setShowAvatarModal(false);
    broadcastMyState({ avatar: nextAvatar });
    playLegoSnapSound();
    triggerSocialAction('wave', ' 미니피겨로 변신하고 로비에 입장했습니다! 샬롬 👋');
  };

  const handleAddGuestbookEntry = async (e) => {
    if (e) e.preventDefault();
    const msg = guestbookInput.trim();
    if (!msg) return;
    const newEntry = { id: Date.now(), user_name: `${playerName} (${playerOffice})`, message: msg, created_at: new Date().toISOString().slice(0, 10) };
    setGuestbookList((prev) => [newEntry, ...prev]);
    setGuestbookInput('');
    triggerSocialAction('wave', msg);
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'guestbook_new', payload: newEntry }).catch(() => {});
    if (supabase) { try { await supabase.from('metaverse_guestbook').insert([{ user_name: newEntry.user_name, message: msg }]); } catch (_) {} }
  };

  const handleSitOnSofa = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
    playLegoSnapSound();
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setWaypoints([[-2.2, -2.0]]);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    setWaypoints(computeSmartPath1F(sx, sz, tx, tz));
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText((npc.dialogues && npc.dialogues[0]) || '할렐루야!  좋은나무교회에 오신 것을 환영합니다 😊');
    setSelectedChatNpc(npc);
    triggerSocialAction('wave');
  }, [triggerSocialAction]);

  const handleJumpToFloor = (fl) => {
    setModalZone(null);
    if (typeof onChangeFloor === 'function') onChangeFloor(fl);
  };

  useEffect(() => {
    if (!isMapDrawerOpen) return;
    const mini = minimapRef.current; if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width, h = mini.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1E2026'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#475569'; ctx.fillRect(6, 12, 34, 62);
    ctx.fillStyle = '#F3E5AB'; ctx.fillRect(42, 10, 44, 64);
    ctx.fillStyle = '#10B981'; ctx.fillRect(88, 10, 20, 20);
    ctx.fillStyle = '#0284C7'; ctx.fillRect(88, 32, 20, 20);
    ctx.fillStyle = '#6366F1'; ctx.fillRect(88, 54, 20, 20);
    remotePeers.forEach((p) => { ctx.beginPath(); ctx.arc((((p.x || 0) + 10.5) / 16.0) * w, (((p.z || 0) + 5.0) / 13.0) * h, 3.2, 0, Math.PI * 2); ctx.fillStyle = '#34D399'; ctx.fill(); });
    const [cx, , cz] = playerIdxRef.current;
    ctx.beginPath(); ctx.arc(((cx + 10.5) / 16.0) * w, ((cz + 5.0) / 13.0) * h, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15'; ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handlePositionUpdate = useCallback((px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_1F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    setActiveZone((prev) => (prev?.id === found?.id ? prev : found));
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 150) { lastSyncTimeRef.current = now; broadcastMyState(); }
  }, [broadcastMyState]);

  const darkPillStyle = { backgroundColor: 'rgba(24, 24, 27, 0.92)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.16)' };

  return (
    <div translate="no" style={{ backgroundColor: '#ECEFF4' }} className="notranslate w-full h-full relative overflow-hidden select-none font-sans">
      {/* 1. 좌측 상단 HUD */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[72vw]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div onClick={() => setActiveScreen && setActiveScreen('home')} style={darkPillStyle} className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max">
            <span className="text-xs sm:text-sm font-black tracking-tight text-white">◀ 1F LEGO 로비 · 주차장</span>
          </div>
          <div style={darkPillStyle} className="px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300">동시접속 {remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setShowAvatarModal(true)} style={{ backgroundColor: '#F59E0B', color: '#09090B' }} className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer">🧱  피겨 꾸미기</button>
          <button onClick={() => triggerHolyBenediction(canPlayerBless ? `${playerName} 목사님` : '이성현·방희곤·최수경 목사님', playerName, playerIdxRef.current)} style={{ backgroundColor: '#D97706', color: '#FFFFFF' }} className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer">✨ {canPlayerBless ? '성도 축도 선포' : '목사님 축도 받기'}</button>
          <button onClick={() => setShowBrochureModal(true)} style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }} className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer">📰 주보·방명록</button>
          <button onClick={() => handleJumpToFloor('2F')} style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }} className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer">☕ 2F 북카페</button>
          <button onClick={() => handleJumpToFloor('3F')} style={{ backgroundColor: '#10B981', color: '#030712' }} className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer">🛗 3F 본당</button>
          <button onClick={() => setShowRoomSigns((prev) => !prev)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"><span style={{ color: showRoomSigns ? '#34D399' : '#9CA3AF' }}>{showRoomSigns ? '🏷️ 간판 ON' : '🏷️ 간판 OFF'}</span></button>
        </div>
      </div>

      {/* 2. 우측 상단 미니맵 드로어 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <button onClick={() => setIsMapDrawerOpen((prev) => !prev)} style={darkPillStyle} className="px-3.5 py-2 rounded-2xl border shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer">
          <span>{isMapDrawerOpen ? '✕ 닫기' : `🗺️ 1F 맵 (${remotePeers.length + 1}) ▼`}</span>
        </button>

        {isMapDrawerOpen && (
          <div style={darkPillStyle} className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-52">
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full border-t border-white/10 pt-1.5">
              <span className="text-[10px] font-black text-emerald-400 block mb-1">🟢 1층 접속 성도 ({remotePeers.length + 1}명)</span>
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto hide-scrollbar">
                <div className="px-2 py-1 rounded-lg bg-amber-500/20 text-[11px] font-black text-amber-300 flex justify-between"><span>나 · {playerName}</span><span>{playerOffice}</span></div>
                {remotePeers.map((peer) => (
                  <button key={peer.clientId} onClick={() => { handleWalkTo(peer.x || -0.8, (peer.z || 2.2) + 0.6); setSelectedRemotePeer(peer); setIsMapDrawerOpen(false); }} className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-left text-[11px] font-bold text-emerald-200 flex justify-between cursor-pointer">
                    <span className="truncate">{peer.name}</span><span className="text-[10px] text-emerald-400">만나기 ➔</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col gap-1 max-h-[28vh] overflow-y-auto hide-scrollbar pr-0.5 border-t border-white/10 pt-1.5">
              {ZONES_1F.map((z) => (
                <button key={z.id} onClick={() => { if (z.isSeatZone && z.seatTarget) handleSitOnSofa(z.seatTarget); else if (z.isBrochureZone) setShowBrochureModal(true); else { handleWalkTo(z.pos[0], z.pos[2]); setActiveZone(z); setModalZone(z); } setIsMapDrawerOpen(false); }} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold flex items-center justify-between cursor-pointer">
                  <span className="truncate text-white">{z.badge}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 소셜 바 & 공간 이동 바 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div style={darkPillStyle} className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {[
              { label: '👋 인사', emote: 'wave', msg: '할렐루야! 반갑습니다 성도님 👋' },
              { label: '💬 안부', emote: 'wave', msg: '한 주간 평안하셨나요? 사랑하고 축복합니다 😊' },
              { label: '💃 워십댄스', emote: 'dance', msg: '다 함께 기쁨으로 주님을 찬양하며 춤춰요! 💃🎵' },
              { label: '🙏 기도', emote: 'pray', msg: '두 손 모아 간절히 주님께 기도합니다 🙏' },
              { label: '🙌 할렐루야', emote: 'praise', msg: '할렐루야! 아멘! 주님께 영광 돌립니다 🙌✨' }
            ].map((act, idx) => (
              <button key={idx} onClick={() => triggerSocialAction(act.emote, act.msg)} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer">{act.label}</button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (!quickChatInput.trim()) return; triggerSocialAction('wave', quickChatInput.trim()); setQuickChatInput(''); }} style={darkPillStyle} className="flex items-center gap-1 px-2.5 py-1 rounded-2xl border shadow-2xl w-full sm:w-64">
            <input type="text" value={quickChatInput} onChange={(e) => setQuickChatInput(e.target.value)} placeholder="로비 말풍선 대화 입력..." className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400" />
            <button type="submit" className="px-2.5 py-1 rounded-xl bg-emerald-500 text-stone-950 text-[11px] font-black cursor-pointer shrink-0">전송</button>
          </form>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showBottomDock ? (
            <div style={darkPillStyle} className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {[
                { icon: '🏛️', label: '정문현관', onClick: () => handleWalkTo(-0.8, 3.6) },
                { icon: '🪑', label: seatedInfo ? '일어나기' : '대기석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnSofa({ x: -3.48, z: -2.0, rotY: Math.PI / 2, rowLabel: '1F  4인용 대기석' }); } },
                { icon: '🚗', label: '주차팀인사', onClick: () => { handleWalkTo(-5.6, 2.6); handleSelectNpcForChat(NPCS_1F[5]); } },
                { icon: '📰', label: '홍보물·주보', onClick: () => setShowBrochureModal(true) },
                { icon: '🛗', label: '엘리베이터', onClick: () => { handleWalkTo(1.8, -2.8); setModalZone(ZONES_1F[3]); } }
              ].map((item, idx) => (
                <button key={idx} onClick={item.onClick} className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-1 shrink-0 cursor-pointer">
                  <span className="text-sm">{item.icon}</span><span className="text-[11px] font-extrabold whitespace-nowrap text-white">{item.label}</span>
                </button>
              ))}
              <button onClick={() => setShowBottomDock(false)} className="px-2 py-1 text-xs font-bold text-zinc-400 cursor-pointer">✕</button>
            </div>
          ) : (
            <button onClick={() => setShowBottomDock(true)} style={darkPillStyle} className="px-3 py-2 rounded-full border shadow-xl text-xs font-black cursor-pointer">🧱  로비 메뉴 ▲</button>
          )}
        </div>
      </div>

      {/* 4. 모바일 최적화  스튜디오 라이팅 3D 캔버스 */}
      <Canvas
        shadows
        dpr={isMobile ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.06 }}
      >
        <color attach="background" args={['#E9EDF2']} />
        <PerspectiveCamera makeDefault position={[-2.2, 11.8, 12.2]} fov={36} near={0.1} far={220} />
        <InitialCameraSetup1F controlsRef={controlsRef} />

        <ambientLight intensity={1.18} color="#FFFFFF" />
        <hemisphereLight args={['#FFFDF7', '#CBD5E1', 0.9]} />
        <directionalLight
          position={[-9, 16, 12]}
          intensity={1.45}
          color="#FFF8EB"
          castShadow
          shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
          shadow-bias={-0.0005}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.01, 1.5]} onClick={(e) => { e.stopPropagation(); handleWalkTo(e.point.x, e.point.z); }}>
          <planeGeometry args={[20.0, 16.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <OneFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => { handleWalkTo(z.pos[0], z.pos[2]); setModalZone(z); }}
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
          remotePeers={remotePeers}
          onPositionUpdate={handlePositionUpdate}
        />

        {!isMobile && <ContactShadows frames={1} resolution={256} position={[0, -0.29, 0]} opacity={0.34} scale={28} blur={1.8} far={4} />}

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

      {/* 5. 3D  미니피겨 커스터마이징 모달 */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" onClick={() => setShowAvatarModal(false)}>
          <div style={{ backgroundColor: '#0F1420', color: '#FFFFFF' }} className="w-full max-w-lg border border-amber-400/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 text-left max-h-[92vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div><span className="text-[10px] font-mono font-black text-amber-400 block">LEGO MINIFIGURE STUDIO</span><h3 className="text-sm sm:text-base font-black text-white">🧱 내  미니피겨 꾸미기</h3></div>
              <button onClick={() => setShowAvatarModal(false)} className="px-2.5 py-1 rounded-xl bg-white/5 text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>

            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-amber-400/40 bg-gradient-to-b from-slate-800 via-slate-900 to-black">
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-white/15">
                {[{ label: '🧍 기본', val: null }, { label: '👋 인사', val: 'wave' }, { label: '💃 춤', val: 'dance' }, { label: '🙏 기도', val: 'pray' }, { label: '🙌 만세', val: 'praise' }].map((p, idx) => (
                  <button key={idx} type="button" onClick={() => setPreviewEmote(p.val)} className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${previewEmote === p.val ? 'bg-amber-400 text-stone-950' : 'text-zinc-300'}`}>{p.label}</button>
                ))}
              </div>
              <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.95, 2.35], fov: 34 }}>
                <ambientLight intensity={1.3} color="#FFFFFF" />
                <directionalLight position={[2, 4, 3]} intensity={1.45} color="#FFF8EB" />
                <group position={[0, -0.52, 0]}>
                  <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.58, 0.66, 0.08, 24]} /><meshStandardMaterial color="#1E293B" roughness={0.25} /></mesh>
                  <SharedChibiAvatar position={[0, 0, 0]} rotationY={0} gender={avatarConfig.gender} hairStyle={avatarConfig.hairStyle} isSkirt={Boolean(avatarConfig.isSkirt)} hasSunglasses={Boolean(avatarConfig.hasSunglasses)} emote={previewEmote} shirtColor={avatarConfig.shirtColor} pantsColor={avatarConfig.pantsColor} hairColor={avatarConfig.hairColor} />
                </group>
                <OrbitControls enablePan={false} enableZoom={true} minDistance={1.6} maxDistance={3.4} autoRotate={!previewEmote} autoRotateSpeed={2.0} />
              </Canvas>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[{ label: '👨 남성 피겨', gender: 'male', isSkirt: false, defaultHair: 'parted' }, { label: '👩 여성 스커트', gender: 'female', isSkirt: true, defaultHair: 'bob' }, { label: '👩 여성 팬츠', gender: 'female', isSkirt: false, defaultHair: 'long_wave' }].map((opt, i) => (
                <button key={i} type="button" onClick={() => setAvatarConfig((prev) => ({ ...prev, gender: opt.gender, isSkirt: opt.isSkirt, hairStyle: opt.defaultHair }))} className={`py-2 px-2 rounded-xl text-[11px] font-black border cursor-pointer ${avatarConfig.gender === opt.gender && avatarConfig.isSkirt === opt.isSkirt ? 'bg-amber-400 border-white text-stone-950' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{opt.label}</button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[{ id: 'parted', label: '가르마' }, { id: 'short', label: '숏컷' }, { id: 'bob', label: '단발' }, { id: 'long_wave', label: '긴머리' }, { id: 'bun', label: '올림' }].map((h) => (
                <button key={h.id} type="button" onClick={() => setAvatarConfig((prev) => ({ ...prev, hairStyle: h.id }))} className={`py-2 rounded-xl text-[10.5px] font-bold border cursor-pointer ${avatarConfig.hairStyle === h.id ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/5 border-white/10 text-zinc-300'}`}>{h.label}</button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['#FACC15', '#38BDF8', '#EC4899', '#10B981', '#6366F1', '#EF4444', '#A855F7', '#F97316', '#1E293B', '#F8FAFC'].map((col) => (
                <button key={col} type="button" onClick={() => setAvatarConfig((prev) => ({ ...prev, shirtColor: col }))} style={{ backgroundColor: col }} className={`w-7 h-7 rounded-full border-2 cursor-pointer ${avatarConfig.shirtColor === col ? 'border-white scale-115' : 'border-transparent opacity-80'}`} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['#1E293B', '#0284C7', '#FCE7F3', '#FEF08A', '#CCFBF1', '#334155'].map((col) => (
                  <button key={col} type="button" onClick={() => setAvatarConfig((prev) => ({ ...prev, pantsColor: col }))} style={{ backgroundColor: col }} className={`w-6 h-6 rounded-full border-2 cursor-pointer ${avatarConfig.pantsColor === col ? 'border-white scale-115' : 'border-transparent opacity-80'}`} />
                ))}
              </div>
              <button type="button" onClick={() => setAvatarConfig((prev) => ({ ...prev, hasSunglasses: !prev.hasSunglasses }))} className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${avatarConfig.hasSunglasses ? 'bg-amber-400 text-stone-950 border-white' : 'bg-white/10 text-zinc-300 border-white/10'}`}>🕶️ 선글라스 {avatarConfig.hasSunglasses ? 'ON' : 'OFF'}</button>
            </div>

            <button type="button" onClick={() => handleSaveAvatarCustomization(avatarConfig)} style={{ backgroundColor: '#10B981', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm cursor-pointer shadow-lg">✨  미니피겨 저장하고 입장하기</button>
          </div>
        </div>
      )}

      {/* 6. 원격 성도 / 7. 주보·방명록 / 8. NPC 대화 / 9. 엘리베이터 모달 */}
      {selectedRemotePeer && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setSelectedRemotePeer(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-sm border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-bold text-emerald-400 block">실시간 접속 성도</span><h3 className="text-base font-black">{selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})</h3></div>
              <button onClick={() => setSelectedRemotePeer(null)} className="text-xs text-zinc-400 cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 샬롬 👋`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">👋 인사하기</button>
              <button onClick={() => { triggerSocialAction('pray', `${selectedRemotePeer.name}님을 위해 함께 기도합니다 🙏`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">🙏 중보기도</button>
            </div>
            {canPlayerBless && (
              <button onClick={() => { triggerHolyBenediction(`${playerName} 목사님`, selectedRemotePeer.name, [selectedRemotePeer.x || -0.8, 0.08, selectedRemotePeer.z || 2.2]); setSelectedRemotePeer(null); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">✨ 축도(홀리라이트) 내리기</button>
            )}
          </div>
        </div>
      )}

      {showBrochureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowBrochureModal(false)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-pink-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[86vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-mono font-bold text-pink-400 block">GOOD TREE CHURCH KIOSK</span><h3 className="text-base font-black">📰 교회 주보 & 로비 방명록</h3></div>
              <button onClick={() => setShowBrochureModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="space-y-2">
              <form onSubmit={handleAddGuestbookEntry} className="flex gap-1.5">
                <input type="text" value={guestbookInput} onChange={(e) => setGuestbookInput(e.target.value)} placeholder="반가운 안부나 기도제목을 남겨주세요..." className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none" />
                <button type="submit" className="px-3.5 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs cursor-pointer shrink-0">등록</button>
              </form>
              <div className="space-y-1.5 max-h-52 overflow-y-auto hide-scrollbar">
                {guestbookList.map((g) => (
                  <div key={g.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="flex justify-between mb-0.5"><span className="font-black text-emerald-400">{g.user_name}</span><span className="text-[10px] text-zinc-500">{String(g.created_at).slice(0, 10)}</span></div>
                    <p className="text-zinc-200">{g.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedChatNpc && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setSelectedChatNpc(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10.5px] font-bold text-emerald-400 block">{selectedChatNpc.role}</span><h3 className="text-base font-black">{selectedChatNpc.name}</h3></div>
              <button onClick={() => setSelectedChatNpc(null)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="p-3.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 text-xs leading-relaxed text-emerald-100">"{chatReplyText}"</div>
            {selectedChatNpc.canBless && (
              <button onClick={() => { const pName = selectedChatNpc.name; setSelectedChatNpc(null); triggerHolyBenediction(pName, playerName, playerIdxRef.current); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">✨ [{selectedChatNpc.name}]께 거룩한 축도 받기 🙏</button>
            )}
            <div className="pt-2 border-t border-white/10 flex gap-1.5">
              <button onClick={() => { setSelectedChatNpc(null); handleJumpToFloor('2F'); }} className="flex-1 py-2.5 rounded-xl bg-white/10 text-amber-300 font-black text-xs cursor-pointer">☕ 2F 북카페</button>
              <button onClick={() => { setSelectedChatNpc(null); handleJumpToFloor('3F'); }} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-stone-950 font-black text-xs cursor-pointer">🛗 3F 대예배당</button>
            </div>
          </div>
        </div>
      )}

      {modalZone && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setModalZone(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-stone-950 font-black text-xs">{modalZone.badge}</span>
              <button onClick={() => setModalZone(null)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <h3 className="text-base font-black">{modalZone.title}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{modalZone.desc}</p>
            {modalZone.isElevator && (
              <div className="space-y-1.5 pt-1">
                {[
                  { fl: '1F', label: '1F LEGO 메인 로비 & 필로티 주차장 (현재)' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 목양실 · 사무실' },
                  { fl: '3F', label: '3F 대예배당 본당' },
                  { fl: '4F', label: '4F 영유아 예배실' },
                  { fl: '5F', label: '5F 소예배 · 찬양홀' },
                  { fl: '6F', label: '6F 다음세대 교육관' },
                  { fl: '7F', label: '7F 좋은나무 빌리지 오픈월드' }
                ].map((item) => (
                  <button key={item.fl} onClick={() => handleJumpToFloor(item.fl)} className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer">
                    <span>{item.label}</span><span>탑승 이동 ➔</span>
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
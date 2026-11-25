// src/metaverse/CafeOffice2F.js (의자 방향 교정 · 전 층 동일 캐릭터/표정 · 소품 디테일 · 모바일 최적화)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

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
// 🎵 싱글톤 사운드 엔진 (모바일 오디오 안정화)
// =====================================================================
let sharedAudio2F = null;
function getAudio2F() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio2F) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudio2F = new AudioCtx();
  }
  if (sharedAudio2F && sharedAudio2F.state === 'suspended') {
    sharedAudio2F.resume().catch(() => {});
  }
  return sharedAudio2F;
}

let bgmInterval2F = null;
const toggleCafeBgm2F = (play) => {
  if (!play) {
    if (bgmInterval2F) clearInterval(bgmInterval2F);
    bgmInterval2F = null;
    return;
  }
  const ctx = getAudio2F();
  if (!ctx) return;
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
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.36);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.36);
      step++;
    } catch (_) {}
  }, 420);
};

const playElevatorDingSound = () => {
  try {
    const ctx = getAudio2F();
    if (!ctx) return;
    const now = ctx.currentTime;
    [659.25, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);
      gain.gain.setValueAtTime(0.075, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.45);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx * 0.22); osc.stop(now + idx * 0.22 + 0.45);
    });
  } catch (_) {}
};

const playHolyBlessingSound = () => {
  try {
    const ctx = getAudio2F();
    if (!ctx) return;
    const now = ctx.currentTime;
    [349.23, 440.0, 523.25, 659.25, 698.46, 880.0, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.055, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 1.8);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx * 0.11); osc.stop(now + idx * 0.11 + 1.8);
    });
  } catch (_) {}
};

const playKeyboardClackSound = () => {
  try {
    const ctx = getAudio2F();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(850 + (i % 3) * 220, now + i * 0.055);
      gain.gain.setValueAtTime(0.022, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.035);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.055); osc.stop(now + i * 0.055 + 0.035);
    }
  } catch (_) {}
};

// =====================================================================
// 🎨 프로시저럴 텍스처 (책장 가득 찬 책등 · 카페 메뉴보드 · 타일 · 우드 · 스틸)
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
    ctx.fillStyle = baseHex; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex; ctx.globalAlpha = 0.16;
    for (let i = 0; i < 64; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 64) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 5, w * 0.7, y - Math.cos(i) * 5, w, y);
      ctx.stroke();
    }
  }, 256, 256);
}

function makeBrushedSteelTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#CBD5E1'); grad.addColorStop(0.3, '#F8FAFC');
    grad.addColorStop(0.5, '#94A3B8'); grad.addColorStop(0.75, '#E2E8F0'); grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 120; i++) {
      const y = (i / 120) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }, 256, 256);
}

function makeCafeFloorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#33363B'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#27292D'; ctx.lineWidth = 3;
    const step = w / 6;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(w, i * step); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, h); ctx.stroke();
    }
  }, 256, 256);
}

function makeTileGridTexture(bgHex = '#9499A1', lineHex = '#7A7F87', gridCount = 8) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = bgHex; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex; ctx.lineWidth = 3;
    const step = w / gridCount;
    for (let i = 0; i <= gridCount; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(w, i * step); ctx.stroke();
    }
  }, 256, 256);
}

function makeBookshelfTexture(woodHex = '#3E2210', isStudy = true) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#1C130C'; ctx.fillRect(0, 0, w, h);
    const palette = isStudy
      ? ['#7F1D1D', '#1E3A8A', '#14532D', '#451A03', '#27272A', '#78350F', '#312E81', '#D6D3D1', '#57534E']
      : ['#3B82F6', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#EAB308', '#F8FAFC'];
    const rows = 4;
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const baseY = (r + 1) * rowH - 10;
      let x = 10;
      let idx = r * 17;
      while (x < w - 18) {
        const bw = 12 + ((idx * 7) % 14);
        const bh = rowH * (0.64 + ((idx * 13) % 24) * 0.01);
        ctx.fillStyle = palette[idx % palette.length];
        ctx.fillRect(x, baseY - bh, bw, bh);
        // 책등 금박/제목 띠
        ctx.fillStyle = isStudy ? 'rgba(250, 204, 21, 0.72)' : 'rgba(255,255,255,0.65)';
        ctx.fillRect(x + 2, baseY - bh + 10, bw - 4, 4);
        ctx.fillRect(x + 2, baseY - 14, bw - 4, 3);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, baseY - bh, bw, bh);
        x += bw + 2;
        idx++;
      }
      // 선반 판
      ctx.fillStyle = woodHex;
      ctx.fillRect(0, baseY, w, 12);
    }
  }, 512, 384);
}

function makeCafeMenuBoardTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#18181B'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D49552'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#FACC15'; ctx.font = '900 28px serif'; ctx.textAlign = 'center';
    ctx.fillText('GOOD TREE COFFEE', w / 2, 46);
    ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
    const items = [
      ['아메리카노 (Hot/Ice)', '2,000'],
      ['카페라떼 · 바닐라라떼', '2,500'],
      ['수제 자몽 · 레몬에이드', '3,000'],
      ['갓 구운 버터 스콘', '2,000']
    ];
    items.forEach(([name, price], i) => {
      ctx.fillStyle = '#F8FAFC'; ctx.fillText(name, 30, 94 + i * 36);
      ctx.fillStyle = '#FDE047'; ctx.fillText(price, w - 95, 94 + i * 36);
    });
  }, 420, 240);
}

function makeClearGlassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
    grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.22)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.48)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    for (let x = -80; x < w + 80; x += 150) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0); ctx.lineTo(x - 52, h); ctx.lineTo(x - 90, h); ctx.closePath(); ctx.fill();
    }
  }, 256, 128);
}

function makeBrightMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE'); grad.addColorStop(0.45, '#FFFFFF'); grad.addColorStop(0.75, '#BAE6FD'); grad.addColorStop(1, '#F0F9FF');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let x = -60; x < w + 60; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 35, 0); ctx.lineTo(x - 45, h); ctx.lineTo(x - 80, h); ctx.closePath(); ctx.fill();
    }
  }, 256, 128);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#10B981') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath(); ctx.roundRect(12, 12, w - 24, h - 24, 34); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = badgeColor; ctx.stroke();
    ctx.fillStyle = badgeColor; ctx.font = '900 23px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 54);
    ctx.fillStyle = '#0F172A'; ctx.font = '900 45px sans-serif';
    ctx.fillText(title, w / 2, 124);
  }, 420, 175);
}

// =====================================================================
// 📍 2층 8대 인터랙션 존 & 충돌 & 네비게이션
// =====================================================================
const ZONES_2F = [
  { id: 'zone_2f_elev', code: '01', subCode: '엘베', name: '2F 엘리베이터 홀', pos: [-0.2, 0, 4.3], isElevator: true, badge: '01 2F 엘리베이터', title: '🛗 2층 스마트 엘리베이터', desc: '스테인리스 스틸 자동문이 열리며 1층~7층으로 이동합니다.' },
  { id: 'zone_2f_stairs', code: '02', subCode: '계단', name: '좌측 하단 계단실', pos: [-2.4, 0, 4.1], isElevator: true, badge: '02 2F 계단실', title: '🪜 좌측 하단 연결 계단실', desc: '1층 로비나 3층 대예배당으로 이동할 수 있습니다.' },
  { id: 'zone_2f_office', code: '03', subCode: '사무실', name: '행정 사무실', pos: [-2.2, 0, 1.0], roomTarget: [-4.4, 1.0], isOfficeZone: true, badge: '03 행정 사무실', title: '💻 교회 행정·교역자 사무실', desc: '2x2 마주보기 데스크와 냉온수기, 우드 서랍장이 갖춰진 사역 지원실입니다.' },
  { id: 'zone_2f_glass_door', code: '04', subCode: '유리문', name: '카페 입구 유리문', pos: [-0.2, 0, -0.6], roomTarget: [-0.2, -2.2], badge: '04 카페 유리문', title: '🚪 북카페 양개 강화유리문', desc: '다가가면 양쪽 강화유리문이 자동으로 열립니다.' },
  { id: 'zone_2f_cafe_bar', code: '05', subCode: '카페바', name: '북카페 바리스타바', pos: [-2.6, 0, -2.8], badge: '05 북카페 바리스타바', title: '☕ 좋은나무 스페셜티 북카페', desc: '스틸&화이트 L자 카운터, 베이커리 쇼케이스, 2그룹 에스프레소 머신이 갖춰져 있습니다.' },
  { id: 'zone_2f_cafe_table', code: '06', subCode: '카페좌석', name: '북카페 테이블석', pos: [1.6, 0, -2.8], seatTarget: { x: 1.6, z: -2.62, rotY: Math.PI, rowLabel: '2F 북카페 파스텔 라운지석', withCoffee: true }, isSeatZone: true, badge: '06 북카페 테이블석', title: '🪑 북카페 라운지 테이블', desc: '의자를 클릭해 착석하면 커피잔을 들고 교제를 나눕니다.' },
  { id: 'zone_2f_pastor_room', code: '07', subCode: '목양실', name: '담임목사 목양실', pos: [2.0, 0, -0.2], roomTarget: [4.2, -0.2], isPastorRoomZone: true, badge: '07 담임목사 목양실', title: '✝️ 이성현 담임목사님 목양실', desc: '책이 빼곡히 채워진 4단 월넛 서재와 중역 데스크가 있는 목양실입니다.' },
  { id: 'zone_2f_restrooms', code: '08', subCode: '화장실', name: '남·여 화장실', pos: [2.0, 0, 2.6], roomTarget: [4.2, 2.0], badge: '08 남·여 화장실', title: '🚻 2층 남·여 화장실', desc: '칸막이 센서 소변기 4기와 3연속 큐비클 부스, 세면대, 핸드드라이어가 갖춰져 있습니다.' }
];

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
    const dx = x - closestX, dz = z - closestZ;
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
  if (z < -1.2) return { room: 'cafe', doorIn: [-0.2, -1.85], doorOut: [-0.2, -0.55] };
  if (x < -3.0 && z < 2.6) return { room: 'office', doorIn: [-3.65, 0.95], doorOut: [-2.2, 0.95] };
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
  if (startInfo.room === endInfo.room) return [[ex, ez]];
  const waypoints = [];
  if (startInfo.room !== 'hallway') waypoints.push(startInfo.doorIn, startInfo.doorOut);
  if (endInfo.room !== 'hallway') waypoints.push([-0.2, endInfo.doorOut[1]], endInfo.doorOut, endInfo.doorIn);
  waypoints.push([ex, ez]);
  return waypoints;
}

const NPCS_2F = [
  { id: 'barista_2f', name: '김집사 (바리스타)', role: '2층 좋은나무 카페 매니저', isBarista: true, x: -4.35, y: 0, z: -4.52, rotY: 0, gender: 'female', hairStyle: 'bun', isSkirt: false, autoWave: true, shirt: '#18181B', pants: '#27272A', hair: '#1C1917', dialogues: ['할렐루야! 스틸&화이트 에스프레소 바와 베이커리 쇼케이스에 오신 걸 환영해요 ☕', '저를 클릭해 커피를 주문하시면 손에 따뜻한 커피잔을 들고 마실 수 있어요 🥰'] },
  { id: 'pastor_office_2f', name: '이성현 담임목사님 (목양실)', role: '담임목사 서재 · 축도 및 1:1 신앙 면담', isPastor: true, canBless: true, canCounsel: true, x: 5.88, y: 0, z: -0.34, rotY: -Math.PI / 2, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#1E293B', pants: '#0F172A', hair: '#18181B', dialogues: ['사랑하는 성도님 반갑습니다! 목양실 서재에 찾아와 주셔서 참 기쁩니다 ✝️', '저를 클릭하시면 [✨ 축도 받기]와 [📝 1:1 신앙 면담 신청]을 하실 수 있습니다 🙏'] },
  { id: 'admin_staff_2f', name: '이간사 (행정사무실)', role: '교회 행정·재정·주보 담당', isOfficeStaff: true, isTyping: true, x: -5.20, y: 0, z: 0.12, rotY: 0, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#0284C7', pants: '#E0F2FE', hair: '#27272A', dialogues: ['(타다다닥! 💻) 마주 보는 파티션 책상에서 이번 주일 주보를 편집하고 있어요!', '(다다다닥! ⌨️) 창가 쪽 생수기에서 물 한잔 드시고 편하게 행정 문의 주세요 😊'] },
  { id: 'office_pastor_2f', name: '박전도사 (교역자실)', role: '교육·청년부 담당교역자', isOfficeStaff: true, isTyping: true, x: -4.40, y: 0, z: 1.58, rotY: Math.PI, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#4F46E5', pants: '#1E293B', hair: '#18181B', dialogues: ['(타다다닥! 💻) 주일 예배 찬양 악보와 청년부 설교 원고를 작성 중입니다!', '옆 빈자리 의자를 클릭하시면 성도님도 함께 행정 업무를 도우실 수 있어요 🔥'] },
  { id: 'member_cafe_1', name: '박권사 (카페교제)', role: '여전도회 성도 · 커피 티타임', hasCoffee: true, x: 0.85, y: 0, z: -3.2, rotY: Math.PI / 2, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#EC4899', pants: '#FCE7F3', hair: '#5C3A21', dialogues: ['호로록~ ☕ 베이커리 디저트랑 아메리카노가 정말 일품이네요 🥰', '성도님도 옆자리에 앉으셔서 저희랑 같이 말씀 나눔 해요!'] },
  { id: 'member_cafe_2', name: '정안수집사 (카페교제)', role: '남선교회 성도 · 커피 티타임', hasCoffee: true, x: 2.35, y: 0, z: -3.2, rotY: -Math.PI / 2, seated: true, gender: 'male', hairStyle: 'short', shirt: '#10B981', pants: '#1E293B', hair: '#27272A', dialogues: ['목양실 책장이 성경 주석서로 가득 차 있어서 정말 은혜로운 분위기예요 📚', '담임목사님께 1:1 면담 신청하고 축도도 받고 왔더니 마음이 든든합니다!'] },
  { id: 'walker_hall_2f', name: '최청년 (카페방문)', role: '청년부 성도', x: -0.2, y: 0, z: 1.5, patrolZ: [-0.4, 3.2], gender: 'male', hairStyle: 'parted', shirt: '#38BDF8', pants: '#334155', hair: '#18181B', dialogues: ['엘리베이터와 카페 유리문이 자동으로 스르륵 열려서 이동하기 너무 편해요 ✨'] }
];

// =====================================================================
// ✨ 축도 홀리라이트 · 스마트 컷어웨이 · 홀로그램 마커
// =====================================================================
function HolyLightBeamEffect2F({ targetPos, pastorName, targetName }) {
  const beamRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particlesRef = useRef();

  const blessingBannerTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(120, 53, 15, 0.94)'); grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.98)'); grad.addColorStop(1, 'rgba(120, 53, 15, 0.94)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(10, 10, w - 20, h - 20, 32); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#FEF08A'; ctx.stroke();
    ctx.fillStyle = '#FEF08A'; ctx.font = '900 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`✝️ ${pastorName || '이성현 담임목사님'}의 목양실 축도`, w / 2, 46);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 28px serif';
    ctx.fillText(`${targetName} 성도님에게 하나님의 은혜와 평강이`, w / 2, 88);
    ctx.fillText(`영원토록 함께 있을지어다! 아멘 🙏`, w / 2, 126);
  }, 600, 150), [pastorName, targetName]);

  useEffect(() => () => blessingBannerTex.dispose(), [blessingBannerTex]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      beamRef.current.scale.set(pulse, 1, pulse);
      beamRef.current.material.opacity = 0.36 + Math.sin(t * 4) * 0.08;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.8;
    if (ring2Ref.current) { ring2Ref.current.rotation.z = -t * 2.2; ring2Ref.current.position.y = 0.5 + ((t * 0.8) % 2.2); }
    if (particlesRef.current) { particlesRef.current.rotation.y = t * 1.2; particlesRef.current.position.y = (t * 0.9) % 2.0; }
  });

  if (!targetPos) return null;
  return (
    <group position={[targetPos[0], 0.05, targetPos[2]]}>
      <mesh ref={beamRef} position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.88, 0.62, 5.6, 20, 1, true]} />
        <meshBasicMaterial color="#FDE047" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.50, 0.72, 24]} />
        <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <ringGeometry args={[0.42, 0.50, 20]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <group ref={particlesRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.42, (i / 10) * 2.0, Math.sin(ang) * 0.42]}>
              <sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 2.4, 0]} intensity={4.5} distance={6.0} color="#FDE047" />
      <Billboard position={[0, 2.25, 0]}><mesh renderOrder={30}><planeGeometry args={[2.4, 0.62]} /><meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} /></mesh></Billboard>
    </group>
  );
}

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
  const badgeTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
    grad.addColorStop(0, '#34D399'); grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(w / 2 - 22, h / 2, 72, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#A7F3D0'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 58px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(zone.code, w / 2 - 22, h / 2 + 4);
    if (zone.subCode) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; ctx.beginPath(); ctx.roundRect(w / 2 + 24, h / 2 + 6, 114, 44, 14); ctx.fill();
      ctx.fillStyle = '#ECFDF5'; ctx.font = 'bold 21px sans-serif'; ctx.fillText(zone.subCode, w / 2 + 81, h / 2 + 28);
    }
  }, 320, 196), [zone.code, zone.subCode]);

  useEffect(() => () => badgeTex.dispose(), [badgeTex]);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05;
      pulseRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={zone.pos} onClick={(e) => { e.stopPropagation(); onSelect(zone); }}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.42, 0.52, 24]} /><meshBasicMaterial color="#34D399" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><circleGeometry args={[0.42, 24]} /><meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} /></mesh>
      <Billboard position={[0.06, 0.38, 0]}><mesh><planeGeometry args={[0.76, 0.44]} /><meshBasicMaterial map={badgeTex} transparent depthWrite={false} /></mesh></Billboard>
    </group>
  );
}

// =====================================================================
// 🥰 1층과 100% 동일한 2.5등신 치비 아바타 (실시간 표정 · 눈 깜빡임 · 커피/타이핑)
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

function CharacterHairStyle2F({ style = 'short', hairColor = '#27272A' }) {
  if (style === 'long_wave') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.08, 0.98, 1.08]} castShadow><sphereGeometry args={[0.235, 16, 14]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.05, 0.42, 0.55]}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.18, -0.09, -0.02]} rotation={[0, 0, 0.12]} castShadow><capsuleGeometry args={[0.065, 0.25, 6, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.18, -0.09, -0.02]} rotation={[0, 0, -0.12]} castShadow><capsuleGeometry args={[0.065, 0.25, 6, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, -0.11, -0.14]} scale={[1.28, 1.0, 0.65]} castShadow><capsuleGeometry args={[0.13, 0.25, 6, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'bob') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.01]} scale={[1.10, 0.98, 1.08]} castShadow><sphereGeometry args={[0.238, 16, 14]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.05, 0.42, 0.55]}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.17, -0.05, 0.02]} rotation={[0, 0, -0.08]} castShadow><capsuleGeometry args={[0.058, 0.14, 6, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.17, -0.05, 0.02]} rotation={[0, 0, 0.08]} castShadow><capsuleGeometry args={[0.058, 0.14, 6, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.96, 1.06]} castShadow><sphereGeometry args={[0.235, 16, 14]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.02, 0.40, 0.52]}><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.24, -0.14]} castShadow><sphereGeometry args={[0.105, 12, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'parted') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.94, 1.06]} castShadow><sphereGeometry args={[0.235, 16, 14]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.08, 0.11, 0.13]} rotation={[0, 0, 0.35]} scale={[1.1, 0.55, 0.65]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.09, 0.11, 0.13]} rotation={[0, 0, -0.25]} scale={[1.0, 0.52, 0.65]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.94, 1.06]} castShadow><sphereGeometry args={[0.235, 16, 14]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      <mesh position={[0, 0.10, 0.08]} scale={[0.98, 0.65, 0.85]}><sphereGeometry args={[0.21, 12, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
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
  skinColor = '#FFE4C4',
  nameTagTexture = null,
  speechBubbleText = null,
  onClick = null,
  seedOffset = 0
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
  const holdingCoffeeNow = hasCoffee || emote === 'coffee';
  const typingNow = isTyping || emote === 'typing';
  const isPraying = emote === 'pray';
  const isHappyEyes = emote === 'dance' || emote === 'praise' || emote === 'coffee';
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

    if (targetPosition && outerGroupRef.current) {
      const curX = outerGroupRef.current.position.x;
      const curZ = outerGroupRef.current.position.z;
      const dist = Math.hypot(targetPosition[0] - curX, targetPosition[2] - curZ);
      if (dist > 0.03) {
        walkingNow = true;
        outerGroupRef.current.position.x = THREE.MathUtils.lerp(curX, targetPosition[0], delta * 7.5);
        outerGroupRef.current.position.z = THREE.MathUtils.lerp(curZ, targetPosition[2], delta * 7.5);
      }
      outerGroupRef.current.rotation.y = THREE.MathUtils.lerp(outerGroupRef.current.rotation.y, rotationY, delta * 8.0);
    } else if (patrolZ && outerGroupRef.current) {
      const st = patrolState.current;
      if (st.pauseTimer > 0) { st.pauseTimer -= delta; walkingNow = false; }
      else {
        walkingNow = true;
        st.z += st.dir * delta * 0.65;
        if (st.z > patrolZ[1]) { st.z = patrolZ[1]; st.dir = -1; st.pauseTimer = 2.5; }
        else if (st.z < patrolZ[0]) { st.z = patrolZ[0]; st.dir = 1; st.pauseTimer = 2.5; }
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

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05; rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.22, 0.11); rightLegRef.current.position.set(0.085, 0.22, 0.11);
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 14.0) * 0.65;
        leftLegRef.current.rotation.x = kick; rightLegRef.current.rotation.x = -kick;
        leftLegRef.current.position.set(-0.085, 0.20, 0); rightLegRef.current.position.set(0.085, 0.20, 0);
      } else if (walkingNow) {
        const sw = Math.sin(t * 10.0) * 0.56;
        leftLegRef.current.rotation.x = sw; rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.085, 0.20, 0); rightLegRef.current.position.set(0.085, 0.20, 0);
      } else {
        leftLegRef.current.rotation.x = 0; rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.085, 0.20, 0); rightLegRef.current.position.set(0.085, 0.20, 0);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'bless') {
        leftArmRef.current.rotation.set(-2.1, 0, 0.35); rightArmRef.current.rotation.set(-2.1, 0, -0.35);
      } else if (typingNow) {
        leftArmRef.current.rotation.set(-0.95 + Math.sin(t * 28.0) * 0.22, 0, 0.16);
        rightArmRef.current.rotation.set(-0.95 + Math.cos(t * 28.0) * 0.22, 0, -0.16);
      } else if (holdingCoffeeNow) {
        const sipWave = Math.max(0, Math.sin(t * 1.8));
        rightArmRef.current.rotation.set(-1.15 - sipWave * 0.45, 0, -0.25);
        leftArmRef.current.rotation.set(isSeated ? -0.42 : Math.sin(t * 2) * 0.06, 0, 0.12);
      } else if (isPraying) {
        leftArmRef.current.rotation.set(-1.15, 0, -0.42); rightArmRef.current.rotation.set(-1.15, 0, 0.42);
      } else if (emote === 'dance') {
        leftArmRef.current.rotation.set(Math.sin(t * 6) * 0.3, 0, 2.4 + Math.sin(t * 12) * 0.45);
        rightArmRef.current.rotation.set(-Math.sin(t * 6) * 0.3, 0, -2.4 + Math.cos(t * 12) * 0.45);
      } else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.set(0.3, 0, -2.35 + Math.sin(t * 10) * 0.32);
        leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.08, 0, 0.20);
      } else if (isSeated) {
        leftArmRef.current.rotation.set(-0.42, 0, 0.12); rightArmRef.current.rotation.set(-0.42, 0, -0.12);
      } else if (walkingNow) {
        const sw = Math.sin(t * 10.0) * 0.48;
        leftArmRef.current.rotation.set(-sw, 0, 0.18); rightArmRef.current.rotation.set(sw, 0, -0.18);
      } else {
        leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.06, 0, 0.20); rightArmRef.current.rotation.set(-Math.sin(t * 2) * 0.06, 0, -0.20);
      }
    }

    if (headGroupRef.current) {
      if (typingNow) headGroupRef.current.rotation.set(0.12 + Math.abs(Math.sin(t * 12)) * 0.05, Math.sin(t * 6.5) * 0.16, 0);
      else if (isPraying) headGroupRef.current.rotation.set(0.32, 0, 0);
      else headGroupRef.current.rotation.set(Math.sin(t * 2.6) * 0.05, Math.cos(t * 1.4) * 0.07, Math.sin(t * 1.8) * 0.03);
    }

    if (rootRef.current) {
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.16 : 0;
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 10.0)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce + jump;
      rootRef.current.position.z = isSeated ? 0.04 : 0;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><circleGeometry args={[0.25, 16]} /><meshBasicMaterial color="#0F172A" transparent opacity={0.24} /></mesh>

      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.085, 0.20, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow><capsuleGeometry args={[0.056, 0.10, 6, 10]} /><meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.45} /></mesh>
          <mesh position={[0, -0.15, 0.025]} scale={[1.05, 0.75, 1.35]} castShadow><sphereGeometry args={[0.058, 10, 10]} /><meshStandardMaterial color={isFemale ? '#9F1239' : '#18181B'} roughness={0.35} /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.20, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow><capsuleGeometry args={[0.056, 0.10, 6, 10]} /><meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.45} /></mesh>
          <mesh position={[0, -0.15, 0.025]} scale={[1.05, 0.75, 1.35]} castShadow><sphereGeometry args={[0.058, 10, 10]} /><meshStandardMaterial color={isFemale ? '#9F1239' : '#18181B'} roughness={0.35} /></mesh>
        </group>

        {isFemale ? (
          <group>
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow><cylinderGeometry args={[0.13, 0.115, 0.22, 14]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
            <mesh position={[0, 0.50, 0]} scale={[1.15, 0.55, 0.90]} castShadow><sphereGeometry args={[0.135, 12, 10]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
            <mesh position={[0, 0.26, 0]} castShadow receiveShadow><cylinderGeometry args={[0.125, 0.24, 0.22, 16]} /><meshStandardMaterial color={pantsColor || shirtColor} roughness={0.45} /></mesh>
            <mesh position={[0, 0.51, 0.10]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.06, 0.016, 6, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.37, 0]} scale={[1.22, 0.95, 0.92]} castShadow receiveShadow><capsuleGeometry args={[0.145, 0.14, 8, 14]} /><meshStandardMaterial color={shirtColor} roughness={0.40} /></mesh>
            <mesh position={[0, 0.49, 0.115]} rotation={[0.15, 0, 0]}><coneGeometry args={[0.05, 0.10, 3]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          </group>
        )}

        <group ref={leftArmRef} position={[-0.20, 0.47, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow><capsuleGeometry args={[0.048, 0.13, 6, 10]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
          <mesh position={[0, -0.19, 0]} castShadow><sphereGeometry args={[0.052, 10, 10]} /><meshStandardMaterial color={skinColor} roughness={0.35} /></mesh>
        </group>

        <group ref={rightArmRef} position={[0.20, 0.47, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow><capsuleGeometry args={[0.048, 0.13, 6, 10]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
          <mesh position={[0, -0.19, 0]} castShadow><sphereGeometry args={[0.052, 10, 10]} /><meshStandardMaterial color={skinColor} roughness={0.35} /></mesh>
          {holdingCoffeeNow && (
            <group position={[0, -0.22, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow><cylinderGeometry args={[0.042, 0.034, 0.095, 10]} /><meshStandardMaterial color="#FFFFFF" roughness={0.2} /></mesh>
              <mesh><cylinderGeometry args={[0.044, 0.038, 0.045, 10]} /><meshStandardMaterial color="#B45309" roughness={0.7} /></mesh>
              <mesh position={[0, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.038, 10]} /><meshBasicMaterial color="#451A03" /></mesh>
            </group>
          )}
        </group>

        {/* 1층과 동일한 2.5등신 헤드 & 실시간 표정 */}
        <group ref={headGroupRef} position={[0, 0.76, 0]}>
          <mesh scale={[1.08, 1.0, 1.04]} castShadow receiveShadow><sphereGeometry args={[0.228, 18, 16]} /><meshStandardMaterial color={skinColor} roughness={0.34} /></mesh>
          <mesh position={[-0.23, -0.01, 0]}><sphereGeometry args={[0.044, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.38} /></mesh>
          <mesh position={[0.23, -0.01, 0]}><sphereGeometry args={[0.044, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.38} /></mesh>

          <CharacterHairStyle2F style={hairStyle || (isFemale ? 'bob' : 'short')} hairColor={hairColor} />

          {hasSunglasses ? (
            <group position={[0, 0.01, 0.225]}>
              <RoundedBox args={[0.145, 0.082, 0.025]} position={[-0.082, 0, 0]} radius={0.025}><meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.5} /></RoundedBox>
              <RoundedBox args={[0.145, 0.082, 0.025]} position={[0.082, 0, 0]} radius={0.025}><meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.5} /></RoundedBox>
            </group>
          ) : isPraying ? (
            <group position={[0, -0.005, 0.226]}>
              <mesh position={[-0.082, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.028, 0.006, 6, 12, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.082, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.028, 0.006, 6, 12, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : isHappyEyes ? (
            <group position={[0, -0.008, 0.226]}>
              <mesh position={[-0.082, 0, 0]}><torusGeometry args={[0.030, 0.0065, 6, 12, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.082, 0, 0]}><torusGeometry args={[0.030, 0.0065, 6, 12, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : (
            <group ref={eyesOpenGroupRef}>
              {[-0.082, 0.082].map((ex, ei) => (
                <group key={ei} position={[ex, -0.005, 0.222]}>
                  <mesh scale={[1.0, 1.15, 0.6]}><sphereGeometry args={[0.032, 10, 10]} /><meshBasicMaterial color="#18181B" /></mesh>
                  <mesh position={[0.010, 0.012, 0.016]}><sphereGeometry args={[0.011, 6, 6]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
                  <mesh position={[-0.008, -0.010, 0.015]}><sphereGeometry args={[0.005, 6, 6]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
                </group>
              ))}
            </group>
          )}

          {!hasSunglasses && (
            <>
              <RoundedBox args={[0.048, 0.010, 0.01]} position={[-0.082, isHappyEyes ? 0.056 : 0.048, 0.22]} rotation={[0, 0, isPraying ? -0.1 : 0.08]} radius={0.004}><meshBasicMaterial color={hairColor} /></RoundedBox>
              <RoundedBox args={[0.048, 0.010, 0.01]} position={[0.082, isHappyEyes ? 0.056 : 0.048, 0.22]} rotation={[0, 0, isPraying ? 0.1 : -0.08]} radius={0.004}><meshBasicMaterial color={hairColor} /></RoundedBox>
            </>
          )}

          <mesh position={[0, -0.028, 0.238]}><sphereGeometry args={[0.014, 8, 8]} /><meshStandardMaterial color="#FDBA74" roughness={0.4} /></mesh>
          <mesh position={[-0.132, -0.045, 0.198]} rotation={[0, -0.38, 0]} scale={[1.25, 0.85, 1]}><circleGeometry args={[0.032, 12]} /><meshBasicMaterial color="#FB7185" transparent opacity={isHappyEyes ? 0.78 : 0.58} /></mesh>
          <mesh position={[0.132, -0.045, 0.198]} rotation={[0, 0.38, 0]} scale={[1.25, 0.85, 1]}><circleGeometry args={[0.032, 12]} /><meshBasicMaterial color="#FB7185" transparent opacity={isHappyEyes ? 0.78 : 0.58} /></mesh>

          <group ref={mouthRef} position={[0, -0.062, 0.228]}>
            {isHappyEyes || isTalking ? (
              <mesh scale={[1.2, 0.9, 0.5]}><circleGeometry args={[0.022, 12, Math.PI, Math.PI]} /><meshBasicMaterial color="#E11D48" side={THREE.DoubleSide} /></mesh>
            ) : (
              <mesh rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.022, 0.0045, 6, 12, Math.PI]} /><meshBasicMaterial color="#E11D48" /></mesh>
            )}
          </group>
        </group>

        {nameTagTexture && (
          <Billboard position={[0, 1.28, 0]}><mesh renderOrder={12}><planeGeometry args={[1.52, 0.34]} /><meshBasicMaterial map={nameTagTexture} transparent depthTest={false} /></mesh></Billboard>
        )}
        {bubbleData && (
          <Billboard position={[0, 1.58, 0]}><mesh renderOrder={15}><planeGeometry args={[bubbleData.planeW, bubbleData.planeH]} /><meshBasicMaterial map={bubbleData.tex} transparent depthTest={false} /></mesh></Billboard>
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
      ctx.beginPath(); ctx.roundRect(6, 6, w - 12, h - 12, 48); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = isPastor ? '#FACC15' : '#34D399'; ctx.stroke();
      ctx.fillStyle = isPastor ? '#FACC15' : '#34D399';
      ctx.beginPath(); ctx.arc(48, h / 2, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 34px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${isPastor ? '✝️ ' : ''}${peer.name || '성도'}`, w / 2 + 16, h / 2 + 2);
    }, 440, 96);
  }, [peer.name, peer.office]);

  useEffect(() => () => nameTagTex.dispose(), [nameTagTex]);

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
      onClick={(e) => { e.stopPropagation(); if (onClickPeer) onClickPeer(peer); }}
    />
  );
}

// =====================================================================
// 🪑 [의자 방향 100% 교정] 등받이를 -Z로 배치하여 rotationY와 시선 방향 일치!
// =====================================================================
function DetailedCafeChair({ position, rotationY = 0, seatColor = '#F472B6', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* 둥근 쿠션 좌판 */}
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.19, 0.06, 16]} />
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </mesh>
      {/* 등받이: -Z(뒤쪽)에 배치, 살짝 뒤로 기울어짐 */}
      <RoundedBox args={[0.38, 0.25, 0.05]} position={[0, 0.56, -0.17]} rotation={[-0.14, 0, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </RoundedBox>
      {/* 크롬 등받이 연결 지지대 */}
      <mesh position={[0, 0.43, -0.16]} rotation={[-0.14, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* 4개 슬림 크롬 다리 */}
      {[[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]} castShadow>
          <cylinderGeometry args={[0.014, 0.011, 0.34, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function ErgonomicMeshOfficeChair({ position, rotationY = 0, chairColor = '#F8FAFC', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <RoundedBox args={[0.42, 0.06, 0.42]} position={[0, 0.35, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.45} />
      </RoundedBox>
      {/* 등받이: -Z(뒤쪽)에 배치하여 정면(+Z)을 바라봄 */}
      <RoundedBox args={[0.40, 0.48, 0.045]} position={[0, 0.62, -0.18]} rotation={[-0.10, 0, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color={chairColor} roughness={0.38} />
      </RoundedBox>
      {[-0.22, 0.22].map((ax, ai) => (
        <group key={ai} position={[ax, 0.46, -0.02]}>
          <RoundedBox args={[0.04, 0.03, 0.24]} position={[0, 0.05, 0]} radius={0.01}><meshStandardMaterial color="#1E293B" /></RoundedBox>
          <mesh position={[0, -0.02, -0.06]}><cylinderGeometry args={[0.012, 0.012, 0.12, 6]} /><meshStandardMaterial color="#94A3B8" metalness={0.7} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.025, 0.025, 0.32, 8]} /><meshStandardMaterial color="#64748B" metalness={0.8} /></mesh>
      {[0, 1, 2, 3, 4].map((bi) => {
        const ang = (bi * Math.PI * 2) / 5;
        return (
          <group key={bi} rotation={[0, ang, 0]}>
            <RoundedBox args={[0.025, 0.02, 0.22]} position={[0, 0.03, 0.10]} radius={0.008}><meshStandardMaterial color="#CBD5E1" metalness={0.7} /></RoundedBox>
            <mesh position={[0, 0.015, 0.20]}><sphereGeometry args={[0.018, 6, 6]} /><meshStandardMaterial color="#090A0F" /></mesh>
          </group>
        );
      })}
    </group>
  );
}

// =====================================================================
// 🚽 고도화 화장실 소품 (도자기 변기 · 휴지걸이 · 곡선 수전 · 비누 · 센서 소변기)
// =====================================================================
function DetailedMiniatureToilet2F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 도자기 하부 기둥 & 타원형 볼 */}
      <mesh position={[0, 0.14, 0.04]} castShadow><cylinderGeometry args={[0.14, 0.10, 0.28, 14]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.26, 0.06]} scale={[1.0, 0.55, 1.25]} castShadow><sphereGeometry args={[0.15, 14, 10]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.295, 0.07]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.095, 12]} /><meshBasicMaterial color="#BAE6FD" /></mesh>
      {/* 변기 시트 & 열린 뚜껑 */}
      <mesh position={[0, 0.31, 0.07]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.125, 0.026, 8, 16]} /><meshStandardMaterial color="#F8FAFC" roughness={0.2} /></mesh>
      {/* 물탱크 & 크롬 물내림 레버 */}
      <RoundedBox args={[0.32, 0.36, 0.15]} position={[0, 0.46, -0.14]} radius={0.035} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></RoundedBox>
      <RoundedBox args={[0.34, 0.035, 0.17]} position={[0, 0.65, -0.14]} radius={0.015}><meshStandardMaterial color="#F1F5F9" roughness={0.15} /></RoundedBox>
      <RoundedBox args={[0.06, 0.02, 0.02]} position={[-0.17, 0.56, -0.10]} radius={0.005}><meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} /></RoundedBox>
      {/* 옆 벽면 롤 휴지걸이 */}
      <group position={[0.26, 0.48, 0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.10, 12]} /><meshStandardMaterial color="#FFFFFF" roughness={0.85} /></mesh>
        <RoundedBox args={[0.12, 0.015, 0.09]} position={[0, 0.06, 0]} radius={0.005}><meshStandardMaterial color="#94A3B8" metalness={0.85} /></RoundedBox>
      </group>
    </group>
  );
}

function DetailedRestroomSink2F({ position, rotationY = 0, mirrorTex }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 하부 수납장 + 문짝 손잡이 */}
      <RoundedBox args={[0.92, 0.72, 0.48]} position={[0, 0.36, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.2} /></RoundedBox>
      <mesh position={[0, 0.36, 0.245]}><boxGeometry args={[0.01, 0.66, 0.01]} /><meshStandardMaterial color="#E2E8F0" /></mesh>
      {/* 옐로우 상판 & 오목한 화이트 세면 보울 */}
      <RoundedBox args={[0.94, 0.04, 0.50]} position={[0, 0.74, 0]} radius={0.01}><meshStandardMaterial color="#FACC15" roughness={0.25} /></RoundedBox>
      <mesh position={[0, 0.765, 0.02]} scale={[1.35, 0.4, 0.95]}><sphereGeometry args={[0.20, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#FFFFFF" roughness={0.12} side={THREE.DoubleSide} /></mesh>
      {/* 곡선 크롬 수전(수도꼭지) & 물비누 디스펜서 */}
      <mesh position={[0, 0.84, -0.14]}><cylinderGeometry args={[0.016, 0.02, 0.16, 8]} /><meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} /></mesh>
      <mesh position={[0, 0.91, -0.09]} rotation={[Math.PI / 2.5, 0, 0]}><cylinderGeometry args={[0.013, 0.014, 0.11, 8]} /><meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} /></mesh>
      <mesh position={[0.26, 0.81, -0.10]} castShadow><cylinderGeometry args={[0.032, 0.035, 0.10, 10]} /><meshStandardMaterial color="#38BDF8" roughness={0.25} /></mesh>
      {/* 프레임 거울 */}
      <RoundedBox args={[0.88, 0.82, 0.03]} position={[0, 1.26, -0.22]} radius={0.015}><meshStandardMaterial color="#334155" /></RoundedBox>
      <mesh position={[0, 1.26, -0.20]}><planeGeometry args={[0.82, 0.76]} /><meshBasicMaterial map={mirrorTex} /></mesh>
    </group>
  );
}

function DetailedPartitionedUrinal2F({ position, rotationY = 0, showRightPartition = true }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.28, 0.82, 0.20]} position={[0, 0.44, 0]} radius={0.08} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.12} /></RoundedBox>
      <mesh position={[0, 0.46, 0.08]} scale={[0.8, 1.8, 0.35]}><sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color="#E2E8F0" roughness={0.2} /></mesh>
      <mesh position={[0, 0.90, -0.02]}><cylinderGeometry args={[0.014, 0.014, 0.10, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} /></mesh>
      <RoundedBox args={[0.09, 0.065, 0.04]} position={[0, 0.96, -0.04]} radius={0.01}><meshStandardMaterial color="#CBD5E1" metalness={0.85} /></RoundedBox>
      <mesh position={[0, 0.96, -0.018]}><circleGeometry args={[0.012, 8]} /><meshBasicMaterial color="#EF4444" /></mesh>
      {showRightPartition && (
        <group position={[0.26, 0.56, 0.08]}>
          <RoundedBox args={[0.03, 0.92, 0.38]} radius={0.015} castShadow receiveShadow><meshStandardMaterial color="#F8FAFC" roughness={0.22} /></RoundedBox>
          <mesh position={[0, -0.50, 0.12]}><cylinderGeometry args={[0.012, 0.012, 0.12, 6]} /><meshStandardMaterial color="#94A3B8" metalness={0.85} /></mesh>
        </group>
      )}
    </group>
  );
}

function BirchFairyLightTree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.20, 0]} castShadow><cylinderGeometry args={[0.18, 0.14, 0.40, 14]} /><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></mesh>
      <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.032, 0.055, 1.55, 8]} /><meshStandardMaterial color="#FFFFFF" roughness={0.4} /></mesh>
      {[[0.18, 1.25, 0.12, 0.45, -0.5, 0.3], [-0.20, 1.15, -0.10, -0.4, 0.4, -0.4], [0.12, 1.48, -0.16, -0.45, -0.3, 0.35], [-0.15, 1.42, 0.18, 0.5, 0.3, -0.35]].map(([bx, by, bz, rx, ry, rz], bi) => (
        <mesh key={bi} position={[bx, by, bz]} rotation={[rx, ry, rz]}><cylinderGeometry args={[0.012, 0.024, 0.58, 6]} /><meshStandardMaterial color="#F8FAFC" /></mesh>
      ))}
      {Array.from({ length: 12 }).map((_, li) => {
        const ang = (li / 12) * Math.PI * 4;
        const rad = 0.12 + (li % 3) * 0.09;
        return (
          <mesh key={`led_${li}`} position={[Math.cos(ang) * rad, 0.78 + (li / 12) * 0.95, Math.sin(ang) * rad]}>
            <sphereGeometry args={[0.022, 6, 6]} /><meshBasicMaterial color="#FEF08A" />
          </mesh>
        );
      })}
    </group>
  );
}

function WhiteCylinderPlant2F({ position, scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow><cylinderGeometry args={[0.16, 0.15, 0.48, 14]} /><meshStandardMaterial color="#F8FAFC" roughness={0.25} /></mesh>
      <mesh position={[0, 0.48, 0]}><cylinderGeometry args={[0.145, 0.145, 0.02, 12]} /><meshStandardMaterial color="#4A2E1B" roughness={0.95} /></mesh>
      {[-0.03, 0.02, 0.04].map((sx, si) => (
        <mesh key={si} position={[sx, 0.62, 0]} rotation={[0, 0, sx * 2]}><cylinderGeometry args={[0.012, 0.018, 0.52, 6]} /><meshStandardMaterial color="#14532D" /></mesh>
      ))}
      {[[0, 0.88, 0, 0.16], [-0.14, 0.76, 0.08, 0.14], [0.14, 0.80, -0.06, 0.15], [-0.08, 0.64, -0.10, 0.13], [0.10, 0.68, 0.12, 0.13]].map(([lx, ly, lz, lr], i) => (
        <mesh key={i} position={[lx, ly, lz]} scale={[1.2, 0.45, 0.8]} rotation={[0.2 * i, i, 0.3]} castShadow>
          <dodecahedronGeometry args={[lr, 0]} /><meshStandardMaterial color={i % 2 === 0 ? '#14532D' : '#16A34A'} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedCafeGlassDoubleDoor2F({ playerIdxRef, glassTex, onClickDoor }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const shouldOpen = Math.hypot(px - -0.2, pz - -1.2) < 2.1;
    leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, shouldOpen ? 0.95 : 0.15, delta * 6.0);
    rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, shouldOpen ? -0.95 : -0.15, delta * 6.0);
  });

  return (
    <group position={[-0.2, 0, 0]} onClick={(e) => { e.stopPropagation(); if (onClickDoor) onClickDoor(); }}>
      <RoundedBox args={[2.45, 0.14, 0.22]} position={[0, 2.34, 0]} radius={0.01}><meshStandardMaterial color="#1E293B" /></RoundedBox>
      {[-1.15, 1.15].map((px, pi) => (
        <RoundedBox key={pi} args={[0.14, 2.4, 0.20]} position={[px, 1.2, 0]} radius={0.01}><meshStandardMaterial color="#1E293B" /></RoundedBox>
      ))}
      <group ref={leftDoorRef} position={[-1.08, 1.12, 0]}>
        <RoundedBox args={[0.98, 2.15, 0.05]} position={[0.49, 0, 0]} radius={0.01}><meshBasicMaterial map={glassTex} transparent opacity={0.85} /></RoundedBox>
        <RoundedBox args={[0.04, 0.65, 0.09]} position={[0.88, 0, 0]} radius={0.01}><meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} /></RoundedBox>
      </group>
      <group ref={rightDoorRef} position={[1.08, 1.12, 0]}>
        <RoundedBox args={[0.98, 2.15, 0.05]} position={[-0.49, 0, 0]} radius={0.01}><meshBasicMaterial map={glassTex} transparent opacity={0.85} /></RoundedBox>
        <RoundedBox args={[0.04, 0.65, 0.09]} position={[-0.88, 0, 0]} radius={0.01}><meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} /></RoundedBox>
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

  useEffect(() => () => { steelTex.dispose(); mirrorTex.dispose(); oakTex.dispose(); }, [steelTex, mirrorTex, oakTex]);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const isOpen = forceOpen || Math.hypot(px - position[0], pz - (position[2] - 0.6)) < 1.95;
    if (isOpen && !wasOpenRef.current) { wasOpenRef.current = true; playElevatorDingSound(); }
    else if (!isOpen && wasOpenRef.current) wasOpenRef.current = false;
    leftDoorRef.current.position.x = THREE.MathUtils.lerp(leftDoorRef.current.position.x, isOpen ? -0.92 : -0.34, delta * 6.5);
    rightDoorRef.current.position.x = THREE.MathUtils.lerp(rightDoorRef.current.position.x, isOpen ? 0.92 : 0.34, delta * 6.5);
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); if (onClickElevator) onClickElevator(); }}>
      <group position={[0, 0, 0.38]}>
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 0.03, 0]} radius={0.01}><meshStandardMaterial color="#F8FAFC" roughness={0.2} /></RoundedBox>
        <RoundedBox args={[1.65, 0.06, 0.72]} position={[0, 2.08, 0]} radius={0.01}><meshBasicMaterial color="#FFFBEB" /></RoundedBox>
        <RoundedBox args={[1.65, 2.12, 0.06]} position={[0, 1.06, 0.32]} radius={0.01}><meshStandardMaterial map={oakTex} roughness={0.35} /></RoundedBox>
        <mesh position={[0, 1.38, 0.28]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.25, 0.95]} /><meshBasicMaterial map={mirrorTex} /></mesh>
        <RoundedBox args={[1.35, 0.04, 0.05]} position={[0, 0.82, 0.26]} radius={0.015}><meshStandardMaterial map={steelTex} metalness={0.9} roughness={0.15} /></RoundedBox>
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[-0.82, 1.06, 0]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
        <RoundedBox args={[0.06, 2.12, 0.72]} position={[0.82, 1.06, 0]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      </group>
      <group position={[0, 1.02, 0.04]}>
        <RoundedBox ref={leftDoorRef} args={[0.67, 2.02, 0.05]} position={[-0.34, 0, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} /></RoundedBox>
        <RoundedBox ref={rightDoorRef} args={[0.67, 2.02, 0.05]} position={[0.34, 0, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} /></RoundedBox>
      </group>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[-0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.25]} position={[0, 2.15, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[-1.32, 1.14, 0.02]} radius={0.015} receiveShadow><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[1.32, 1.14, 0.02]} radius={0.015} receiveShadow><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></RoundedBox>
      {showRoomSigns && <Billboard position={[0, 2.55, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signTex} transparent /></mesh></Billboard>}
    </group>
  );
}

// =====================================================================
// 🏛️ 2층 마스터피스 디오라마 씬 (디테일 강화 · 책장 가득 · 화장실/카페 고도화)
// =====================================================================
function TwoFloorMasterpieceDiorama({
  activeZoneId, onSelectZone, onSitOnSeat, onSelectNpcForChat, activeNpcChatIdx,
  showRoomSigns, playerIdxRef, isElevatorModalOpen, remotePeers, onSelectRemotePeer, holyLightEvent
}) {
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#9C5E26'), []);
  const walnutTex = useMemo(() => makeWoodGrainTexture('#4A2810', '#2B1506'), []);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const cafeFloorTex = useMemo(() => makeCafeFloorTexture(), []);
  const tileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);
  const greyRestroomTileTex = useMemo(() => makeTileGridTexture('#8E939B', '#6C717A', 8), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const studyBooksTex = useMemo(() => makeBookshelfTexture('#3E2210', true), []);
  const cafeBooksTex = useMemo(() => makeBookshelfTexture('#E2E8F0', false), []);
  const menuBoardTex = useMemo(() => makeCafeMenuBoardTexture(), []);

  const imacScreenTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#312E81'); grad.addColorStop(0.5, '#9D174D'); grad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'; ctx.fillRect(w * 0.14, h * 0.16, w * 0.72, h * 0.68);
    ctx.fillStyle = '#1E293B'; ctx.font = 'bold 20px serif'; ctx.textAlign = 'center';
    ctx.fillText('주일 대예배 설교 원고 연구', w / 2, h * 0.42);
    ctx.fillStyle = '#64748B'; ctx.font = '15px sans-serif';
    ctx.fillText('개역개정 4판 · 히브리어/헬라어 강해', w / 2, h * 0.58);
  }, 384, 240), []);

  const officeCodeScreenTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 16px monospace'; ctx.fillText('=== 2026 좋은나무교회 주보 편집기 ===', 16, 36);
    ctx.fillStyle = '#34D399'; ctx.fillText('> 1부/2부 예배 순서 동기화 완료...', 16, 72);
    ctx.fillStyle = '#FACC15'; ctx.fillText('> 목장 보고서 & 심방 일정 집계 중...', 16, 108);
  }, 360, 200), []);

  const signs = useMemo(() => ({
    cafe: makeRoomSignTexture('2F 좋은나무 카페 ☕', '스틸&화이트 바리스타 카운터', '#D97706'),
    glassDoor: makeRoomSignTexture('카페 유리문 🚪', '다가가면 자동 개폐 출입문', '#0284C7'),
    office: makeRoomSignTexture('행정 사무실 💻', '2x2 대면 데스크 · 주보/행정 사역', '#2563EB'),
    pastorRoom: makeRoomSignTexture('담임목사 목양실 ✝️', '축도(홀리라이트) · 1:1 면담실', '#8B5CF6'),
    menWc: makeRoomSignTexture('화장실 (남) 🚹', '칸막이 센서 소변기 4기 · 세면대', '#3B82F6'),
    womenWc: makeRoomSignTexture('화장실 (여) 🚺', '3연속 큐비클 부스 · 핸드드라이어', '#EC4899'),
    stairs: makeRoomSignTexture('2F 계단실 🪜', '1F 로비 · 3F 본당 도보 이동', '#64748B'),
    elevator: makeRoomSignTexture('2F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~7F) 이동', '#10B981')
  }), []);

  useEffect(() => () => {
    [oakTex, walnutTex, steelTex, cafeFloorTex, tileTex, greyRestroomTileTex, glassTex, mirrorTex, studyBooksTex, cafeBooksTex, menuBoardTex, imacScreenTex, officeCodeScreenTex].forEach((t) => t.dispose());
    Object.values(signs).forEach((t) => t.dispose());
  }, [oakTex, walnutTex, steelTex, cafeFloorTex, tileTex, greyRestroomTileTex, glassTex, mirrorTex, studyBooksTex, cafeBooksTex, menuBoardTex, imacScreenTex, officeCodeScreenTex, signs]);

  return (
    <group>
      {/* 1. 2층 베이스 바닥 & 복도 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow><meshStandardMaterial color="#475569" roughness={0.65} /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 1.8]} receiveShadow><planeGeometry args={[5.8, 6.2]} /><meshStandardMaterial map={tileTex} roughness={0.35} /></mesh>

      {/* 2. 북카페 존 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -3.4]} receiveShadow><planeGeometry args={[13.2, 4.4]} /><meshStandardMaterial map={cafeFloorTex} roughness={0.42} /></mesh>

        {/* 카페 입구 통유리 벽 & 자동문 */}
        <group position={[0, 0, -1.2]}>
          {[-3.95, 3.85].map((gx, gi) => (
            <group key={`c_wall_${gi}`} position={[gx, 0, 0]}>
              <RoundedBox args={[5.2, 0.42, 0.16]} position={[0, 0.21, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial map={oakTex} /></RoundedBox>
              <RoundedBox args={[5.2, 0.12, 0.18]} position={[0, 2.34, 0]} radius={0.01}><meshStandardMaterial color="#1E293B" /></RoundedBox>
              <mesh position={[0, 1.35, 0]}><planeGeometry args={[5.0, 1.86]} /><meshBasicMaterial map={glassTex} transparent opacity={0.76} /></mesh>
            </group>
          ))}
          <AnimatedCafeGlassDoubleDoor2F playerIdxRef={playerIdxRef} glassTex={glassTex} onClickDoor={() => onSelectZone(ZONES_2F[3])} />
          {showRoomSigns && <Billboard position={[-0.2, 2.15, 0.2]}><mesh><planeGeometry args={[1.15, 0.48]} /><meshBasicMaterial map={signs.glassDoor} transparent /></mesh></Billboard>}
        </group>

        {/* 바리스타 카운터 & 메뉴보드 & 베이커리 쇼케이스 */}
        <group position={[-4.05, 0, -3.85]}>
          <group position={[0.1, 0, -1.58]}>
            <RoundedBox args={[4.5, 2.25, 0.12]} position={[0, 1.125, 0]} radius={0.01} receiveShadow><meshStandardMaterial color="#FAF9F5" roughness={0.35} /></RoundedBox>
            {/* 카페 메뉴판 보드 */}
            <mesh position={[0, 1.62, 0.075]}><planeGeometry args={[2.1, 1.05]} /><meshBasicMaterial map={menuBoardTex} /></mesh>
            <mesh position={[0, 2.27, 0.04]}><boxGeometry args={[4.4, 0.06, 0.04]} /><meshBasicMaterial color="#FEF08A" /></mesh>
            <RoundedBox args={[3.8, 0.82, 0.56]} position={[0, 0.41, 0.34]} radius={0.015} castShadow receiveShadow><meshStandardMaterial color="#F8FAFC" roughness={0.25} /></RoundedBox>
            <RoundedBox args={[3.84, 0.04, 0.60]} position={[0, 0.84, 0.34]} radius={0.01}><meshStandardMaterial map={steelTex} metalness={0.85} roughness={0.2} /></RoundedBox>
          </group>

          <RoundedBox args={[3.85, 0.88, 0.88]} position={[0, 0.44, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.2} /></RoundedBox>
          <RoundedBox args={[0.82, 0.88, 1.35]} position={[-1.52, 0.44, -0.65]} radius={0.015} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.2} /></RoundedBox>
          <RoundedBox args={[3.92, 0.055, 0.94]} position={[0, 0.90, 0]} radius={0.01} castShadow receiveShadow><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.88, 0.055, 1.40]} position={[-1.52, 0.90, -0.65]} radius={0.01} castShadow receiveShadow><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>

          {/* 2단 유리 베이커리 쇼케이스 */}
          <group position={[-0.78, 0.93, 0.04]}>
            <RoundedBox args={[1.42, 0.46, 0.56]} position={[0, 0.23, 0]} radius={0.01}><meshStandardMaterial color="#E0F2FE" transparent opacity={0.34} roughness={0.08} /></RoundedBox>
            {[0.01, 0.23, 0.45].map((sy, si) => (
              <RoundedBox key={si} args={[1.44, 0.02, 0.58]} position={[0, sy, 0]} radius={0.005}><meshStandardMaterial map={steelTex} metalness={0.9} roughness={0.18} /></RoundedBox>
            ))}
            {[-0.48, -0.16, 0.16, 0.48].map((bx, bi) => (
              <React.Fragment key={bi}>
                <RoundedBox args={[0.24, 0.02, 0.36]} position={[bx, 0.03, 0]} radius={0.005}><meshStandardMaterial color="#18181B" /></RoundedBox>
                <mesh position={[bx, 0.08, 0.05]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color={['#D97706', '#B45309', '#F59E0B', '#92400E'][bi]} /></mesh>
                <RoundedBox args={[0.24, 0.02, 0.36]} position={[bx, 0.25, 0]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
                <mesh position={[bx, 0.30, -0.04]}><cylinderGeometry args={[0.05, 0.05, 0.06, 10]} /><meshStandardMaterial color={['#FDE047', '#F43F5E', '#D97706', '#A16207'][bi]} /></mesh>
              </React.Fragment>
            ))}
          </group>

          {/* POS 단말기 & 옐로우 머쉬룸 램프 & 2그룹 에스프레소 머신 */}
          <group position={[0.28, 0.93, 0.12]}>
            <RoundedBox args={[0.38, 0.08, 0.34]} position={[0, 0.04, 0]} radius={0.01}><meshStandardMaterial color="#18181B" /></RoundedBox>
            <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.045, 0.08, 0.18, 10]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <RoundedBox args={[0.28, 0.22, 0.025]} position={[0, 0.28, 0.04]} rotation={[-0.25, 0, 0]} radius={0.01}><meshStandardMaterial color="#18181B" /></RoundedBox>
            <mesh position={[0, 0.28, 0.055]} rotation={[-0.25, 0, 0]}><planeGeometry args={[0.24, 0.18]} /><meshBasicMaterial color="#38BDF8" /></mesh>
          </group>

          <group position={[0.78, 0.93, 0.10]}>
            <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.022, 0.055, 0.28, 12]} /><meshStandardMaterial color="#EAB308" roughness={0.25} /></mesh>
            <mesh position={[0, 0.26, 0]}><sphereGeometry args={[0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.85]} /><meshStandardMaterial color="#FACC15" emissive="#CA8A04" emissiveIntensity={0.35} /></mesh>
          </group>

          <group position={[1.38, 0.93, -0.05]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[0.68, 0.46, 0.52]} position={[0, 0.23, 0]} radius={0.08} castShadow><meshStandardMaterial color="#18181B" roughness={0.25} metalness={0.4} /></RoundedBox>
            <RoundedBox args={[0.58, 0.24, 0.16]} position={[0, 0.22, -0.22]} radius={0.02}><meshStandardMaterial map={steelTex} color="#FFFFFF" metalness={0.92} roughness={0.12} /></RoundedBox>
            {[-0.14, 0.14].map((gx, gi) => (
              <mesh key={gi} position={[gx, 0.24, -0.32]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.045, 0.08, 10]} /><meshStandardMaterial color="#18181B" /></mesh>
            ))}
          </group>

          {/* 3구 블랙 플라워팟 펜던트 조명 */}
          <group position={[0, 2.38, 0]}>
            <RoundedBox args={[4.2, 0.035, 0.035]} position={[0, 0, 0.15]} radius={0.005}><meshStandardMaterial color="#18181B" /></RoundedBox>
            <RoundedBox args={[4.2, 0.035, 0.035]} position={[0, 0, -0.55]} radius={0.005}><meshStandardMaterial color="#18181B" /></RoundedBox>
            {[-1.35, -0.10, 1.15].map((lx, li) => (
              <group key={li} position={[lx, -0.48, 0.15]}>
                <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.007, 0.007, 0.48, 6]} /><meshStandardMaterial color="#18181B" /></mesh>
                <mesh><sphereGeometry args={[0.20, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#18181B" side={THREE.DoubleSide} /></mesh>
                <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.19, 14]} /><meshBasicMaterial color="#FEF08A" /></mesh>
              </group>
            ))}
          </group>

          <WhiteCylinderPlant2F position={[2.28, 0, -0.15]} scale={1.08} />
        </group>

        <BirchFairyLightTree position={[-1.35, 0, -1.85]} />

        {/* 원목 피크닉 벤치 테이블 */}
        <group position={[-0.45, 0, -2.55]}>
          <RoundedBox args={[1.45, 0.055, 0.68]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial map={oakTex} roughness={0.32} /></RoundedBox>
          {[-0.55, 0.55].map((lx, li) => (
            <RoundedBox key={li} args={[0.07, 0.60, 0.58]} position={[lx, 0.30, 0]} radius={0.01}><meshStandardMaterial color="#27272A" /></RoundedBox>
          ))}
          {[-0.52, 0.52].map((bz, bi) => (
            <group key={`bench_${bi}`} position={[0, 0, bz]} onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: -0.45, z: -2.55 + bz, rotY: bi === 0 ? 0 : Math.PI, rowLabel: '2F 북카페 피크닉 벤치석', withCoffee: true }); }}>
              <RoundedBox args={[1.38, 0.05, 0.28]} position={[0, 0.35, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial map={oakTex} roughness={0.35} /></RoundedBox>
            </group>
          ))}
        </group>

        {/* 중앙 파스텔 테이블 & 방향 교정된 의자 세트 */}
        {[[1.6, -3.2], [3.65, -2.25]].map(([tx, tz], tIdx) => (
          <group key={`pastel_tbl_${tIdx}`} position={[tx, 0, tz]}>
            <RoundedBox args={[1.25, 0.05, 0.78]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.22} /></RoundedBox>
            {[-0.50, 0.50].map((lx, li) => (
              <mesh key={li} position={[lx, 0.31, 0]}><cylinderGeometry args={[0.03, 0.03, 0.62, 10]} /><meshStandardMaterial color="#334155" metalness={0.6} /></mesh>
            ))}
            {/* 우드 트레이 & 라떼 컵 2잔 */}
            <RoundedBox args={[0.36, 0.02, 0.24]} position={[0, 0.655, 0]} radius={0.008}><meshStandardMaterial map={oakTex} /></RoundedBox>
            <mesh position={[-0.09, 0.70, 0.02]}><cylinderGeometry args={[0.042, 0.036, 0.075, 10]} /><meshStandardMaterial color="#F472B6" /></mesh>
            <mesh position={[0.09, 0.70, -0.02]}><cylinderGeometry args={[0.042, 0.036, 0.075, 10]} /><meshStandardMaterial color="#38BDF8" /></mesh>

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
                onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx + cx, z: tz + cz, rotY: cRot, rowLabel: '2F 북카페 파스텔 테이블석', withCoffee: true }); }}
              />
            ))}
          </group>
        ))}

        {/* 우측 독서 테이블 & 책이 꽉 찬 5단 북카페 서가 */}
        <group position={[4.55, 0, -3.85]}>
          <RoundedBox args={[1.85, 0.055, 0.85]} position={[0, 0.62, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#334155" roughness={0.38} /></RoundedBox>
          {[-0.55, 0, 0.55].map((cx, ci) => (
            <React.Fragment key={ci}>
              <DetailedCafeChair position={[cx, 0, -0.58]} rotationY={0} seatColor="#1E293B" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: 4.55 + cx, z: -3.85 - 0.58, rotY: 0, rowLabel: '2F 북카페 독서 테이블석', withCoffee: true }); }} />
              <DetailedCafeChair position={[cx, 0, 0.58]} rotationY={Math.PI} seatColor="#1E293B" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: 4.55 + cx, z: -3.85 + 0.58, rotY: Math.PI, rowLabel: '2F 북카페 독서 테이블석', withCoffee: true }); }} />
            </React.Fragment>
          ))}
        </group>

        {/* 책등 텍스처로 꽉 채운 북카페 대형 서가 */}
        <group position={[6.28, 0, -3.4]}>
          <RoundedBox args={[0.38, 1.98, 3.4]} position={[0, 0.99, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></RoundedBox>
          <mesh position={[-0.195, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[3.22, 1.82]} />
            <meshStandardMaterial map={cafeBooksTex} roughness={0.65} />
          </mesh>
        </group>

        {showRoomSigns && <Billboard position={[-3.2, 2.25, -3.5]}><mesh><planeGeometry args={[1.25, 0.52]} /><meshBasicMaterial map={signs.cafe} transparent /></mesh></Billboard>}
      </group>

      {/* 3. 행정사무실 (방향 교정된 2x2 마주보기 데스크 & 의자) */}
      <group position={[-4.85, 0, 0.7]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.6, 3.7]} /><meshStandardMaterial color="#EAE0D5" roughness={0.5} /></mesh>

        <group position={[-1.68, 0, -0.35]}>
          <group position={[0.04, 1.25, 0]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[1.65, 1.45, 0.08]} radius={0.01}><meshStandardMaterial color="#785A46" /></RoundedBox>
            <mesh position={[0, 0, 0.045]}><planeGeometry args={[1.52, 1.32]} /><meshBasicMaterial map={glassTex} transparent opacity={0.85} /></mesh>
          </group>
          <group position={[0.32, 0, 1.05]}>
            <RoundedBox args={[0.36, 0.86, 0.36]} position={[0, 0.43, 0]} radius={0.02} castShadow><meshStandardMaterial color="#F8FAFC" roughness={0.22} /></RoundedBox>
            <mesh position={[0, 1.08, 0]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.42, 14]} /><meshStandardMaterial color="#38BDF8" transparent opacity={0.78} roughness={0.12} /></mesh>
          </group>
        </group>

        <group position={[-0.1, 1.45, -1.65]}>
          {[0, 0.42].map((sy, si) => (
            <group key={si} position={[0, sy, 0]}>
              <RoundedBox args={[0.92, 0.04, 0.26]} radius={0.01}><meshStandardMaterial map={oakTex} /></RoundedBox>
              {[-0.32, -0.18, -0.04, 0.10].map((bx, bi) => (
                <RoundedBox key={bi} args={[0.09, 0.24, 0.18]} position={[bx, 0.14, 0]} radius={0.005}><meshStandardMaterial color={['#38BDF8', '#F43F5E', '#FACC15', '#10B981'][(si + bi) % 4]} /></RoundedBox>
              ))}
            </group>
          ))}
        </group>

        <group position={[1.22, 0, -1.15]}>
          <RoundedBox args={[0.78, 1.08, 0.48]} position={[0, 0.54, 0]} radius={0.02} castShadow><meshStandardMaterial map={oakTex} roughness={0.35} /></RoundedBox>
          {[0.18, 0.42, 0.66, 0.90].map((dy, di) => (
            <RoundedBox key={di} args={[0.16, 0.025, 0.03]} position={[0, dy, 0.255]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
          ))}
        </group>

        <group position={[0.05, 0, 0.15]}>
          <RoundedBox args={[1.88, 0.055, 1.24]} position={[0, 0.64, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial map={oakTex} roughness={0.3} /></RoundedBox>
          {[[-0.88, -0.56], [0.88, -0.56], [-0.88, 0.56], [0.88, 0.56]].map(([lx, lz], li) => (
            <RoundedBox key={li} args={[0.05, 0.64, 0.05]} position={[lx, 0.32, lz]} radius={0.01}><meshStandardMaterial color="#F8FAFC" metalness={0.5} /></RoundedBox>
          ))}
          <RoundedBox args={[1.84, 0.38, 0.04]} position={[0, 0.85, 0]} radius={0.015}><meshStandardMaterial color="#E2E8F0" roughness={0.4} /></RoundedBox>

          {[-0.45, 0.45].map((seatX, colIdx) => (
            <React.Fragment key={`cluster_col_${colIdx}`}>
              {/* 북쪽 좌석: rotationY={0} 로 정면(+Z 모니터) 바라봄 */}
              <group position={[seatX, 0, -0.32]}>
                <RoundedBox args={[0.50, 0.32, 0.025]} position={[0, 0.88, 0.18]} radius={0.012}><meshStandardMaterial color="#18181B" /></RoundedBox>
                <mesh position={[0, 0.88, 0.165]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.46, 0.28]} /><meshBasicMaterial map={officeCodeScreenTex} /></mesh>
                <RoundedBox args={[0.28, 0.018, 0.10]} position={[0, 0.68, -0.05]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
                <ErgonomicMeshOfficeChair
                  position={[0, 0, -0.45]}
                  rotationY={0}
                  onClick={(e) => {
                    e.stopPropagation(); playKeyboardClackSound();
                    onSitOnSeat({ x: -4.80 + seatX, z: 0.85 - 0.77, rotY: 0, rowLabel: `2F 행정사무실 북쪽 ${colIdx + 1}번석`, isOfficeSeat: true });
                  }}
                />
              </group>

              {/* 남쪽 좌석: rotationY={Math.PI} 로 정면(-Z 모니터) 바라봄 */}
              <group position={[seatX, 0, 0.32]}>
                <RoundedBox args={[0.50, 0.32, 0.025]} position={[0, 0.88, -0.18]} radius={0.012}><meshStandardMaterial color="#18181B" /></RoundedBox>
                <mesh position={[0, 0.88, -0.165]}><planeGeometry args={[0.46, 0.28]} /><meshBasicMaterial map={officeCodeScreenTex} /></mesh>
                <RoundedBox args={[0.28, 0.018, 0.10]} position={[0, 0.68, 0.05]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
                <ErgonomicMeshOfficeChair
                  position={[0, 0, 0.45]}
                  rotationY={Math.PI}
                  onClick={(e) => {
                    e.stopPropagation(); playKeyboardClackSound();
                    onSitOnSeat({ x: -4.80 + seatX, z: 0.85 + 0.77, rotY: Math.PI, rowLabel: `2F 행정사무실 남쪽 ${colIdx + 1}번석`, isOfficeSeat: true });
                  }}
                />
              </group>
            </React.Fragment>
          ))}
        </group>

        {showRoomSigns && <Billboard position={[0, 1.95, 0]}><mesh><planeGeometry args={[1.18, 0.50]} /><meshBasicMaterial map={signs.office} transparent /></mesh></Billboard>}
      </group>

      {/* 4. 담임목사 목양실 (책이 빼곡히 채워진 4단 월넛 서재 + 측면 책장 + 중역 데스크) */}
      <group position={[4.75, 0, -0.18]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.8, 2.0]} /><meshStandardMaterial map={oakTex} roughness={0.3} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.55, 0.012, -0.25]} receiveShadow><planeGeometry args={[2.15, 1.45]} /><meshStandardMaterial color="#64748B" roughness={0.85} /></mesh>

        {/* 북쪽 4단 월넛 빌트인 서재: 꽉 찬 책등 텍스처 + 입체 돌출 책 + LED 간접조명 */}
        <group position={[-0.12, 0, -0.82]}>
          <RoundedBox args={[3.24, 1.96, 0.36]} position={[0, 0.98, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial map={walnutTex} roughness={0.32} /></RoundedBox>
          {/* 뒷면 전체를 가득 채우는 고밀도 신학·성경주석 책등 텍스처 */}
          <mesh position={[0, 0.98, 0.185]}>
            <planeGeometry args={[3.08, 1.82]} />
            <meshStandardMaterial map={studyBooksTex} roughness={0.62} />
          </mesh>
          {/* 선반 프레임 & 따뜻한 간접조명 스트립 */}
          {[0.46, 0.92, 1.38, 1.86].map((sy, si) => (
            <group key={`sh_h_${si}`}>
              <RoundedBox args={[3.18, 0.04, 0.40]} position={[0, sy, 0.02]} radius={0.005}><meshStandardMaterial map={walnutTex} /></RoundedBox>
              <mesh position={[0, sy - 0.024, 0.16]}><boxGeometry args={[3.06, 0.015, 0.02]} /><meshBasicMaterial color="#FDE047" /></mesh>
            </group>
          ))}
          {[-1.54, -0.77, 0, 0.77, 1.54].map((sx, si) => (
            <RoundedBox key={`sh_v_${si}`} args={[0.045, 1.92, 0.40]} position={[sx, 0.96, 0.02]} radius={0.005}><meshStandardMaterial map={walnutTex} /></RoundedBox>
          ))}
          {/* 입체감을 더하는 전경 돌출 양장본 책 뭉치 & 미니 십자가 액자 */}
          {[-1.15, -0.38, 0.38, 1.15].map((cx, ci) => (
            <group key={ci} position={[cx, 0, 0.14]}>
              <RoundedBox args={[0.26, 0.28, 0.14]} position={[-0.14, 0.64, 0]} radius={0.008}><meshStandardMaterial color={ci % 2 === 0 ? '#7F1D1D' : '#1E3A8A'} roughness={0.6} /></RoundedBox>
              <RoundedBox args={[0.22, 0.24, 0.04]} position={[0.14, 1.12, 0.02]} radius={0.005}><meshStandardMaterial color="#FEF3C7" /></RoundedBox>
            </group>
          ))}
        </group>

        {/* 좌측 측면 책장도 책등 텍스처로 가득 채움 */}
        <group position={[-1.72, 0, -0.22]}>
          <RoundedBox args={[0.32, 1.92, 0.68]} position={[0, 0.96, 0]} radius={0.015} castShadow><meshStandardMaterial map={walnutTex} /></RoundedBox>
          <mesh position={[0.165, 0.96, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.60, 1.78]} />
            <meshStandardMaterial map={studyBooksTex} roughness={0.65} />
          </mesh>
        </group>

        {/* 월넛 중역 데스크 + 황동 램프 + 펼쳐진 성경 + iMac */}
        <group position={[0.52, 0, -0.28]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[1.64, 0.08, 0.78]} position={[0, 0.72, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial map={walnutTex} roughness={0.25} /></RoundedBox>
          <RoundedBox args={[0.68, 0.68, 0.72]} position={[-0.42, 0.34, 0]} radius={0.015} castShadow><meshStandardMaterial map={walnutTex} roughness={0.3} /></RoundedBox>
          <RoundedBox args={[0.12, 0.68, 0.72]} position={[0.68, 0.34, 0]} radius={0.01} castShadow><meshStandardMaterial map={walnutTex} roughness={0.3} /></RoundedBox>

          <group position={[-0.58, 0.76, 0.12]}>
            <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.01, 0.01, 0.44, 8]} /><meshStandardMaterial color="#D97706" metalness={0.85} /></mesh>
            <mesh position={[0.06, 0.40, 0]} rotation={[0, 0, -0.45]}><cylinderGeometry args={[0.055, 0.075, 0.16, 12]} /><meshStandardMaterial color="#F59E0B" metalness={0.75} roughness={0.2} /></mesh>
          </group>
          <RoundedBox args={[0.36, 0.025, 0.24]} position={[0.05, 0.77, -0.08]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
          <group position={[0.48, 0.76, 0.08]} rotation={[0, -0.35, 0]}>
            <RoundedBox args={[0.18, 0.01, 0.14]} position={[0, 0.005, 0]} radius={0.004}><meshStandardMaterial color="#E2E8F0" metalness={0.85} /></RoundedBox>
            <RoundedBox args={[0.09, 0.20, 0.015]} position={[0, 0.10, 0.03]} rotation={[0.18, 0, 0]} radius={0.004}><meshStandardMaterial color="#E2E8F0" metalness={0.85} /></RoundedBox>
            <RoundedBox args={[0.58, 0.38, 0.022]} position={[0, 0.28, 0.01]} radius={0.015} castShadow><meshStandardMaterial color="#F8FAFC" roughness={0.2} /></RoundedBox>
            <mesh position={[0, 0.29, -0.003]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.54, 0.32]} /><meshBasicMaterial map={imacScreenTex} /></mesh>
          </group>
        </group>

        {/* 중역 의자 & 성도 1:1 면담 의자 (방향 교정됨) */}
        <group position={[1.15, 0, -0.34]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[0.52, 0.08, 0.50]} position={[0, 0.35, 0]} radius={0.03} castShadow><meshStandardMaterial color="#18181B" roughness={0.3} /></RoundedBox>
          <RoundedBox args={[0.50, 0.68, 0.07]} position={[0, 0.70, -0.22]} rotation={[-0.10, 0, 0]} radius={0.035} castShadow><meshStandardMaterial color="#18181B" roughness={0.28} /></RoundedBox>
        </group>

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
            <mesh onClick={(e) => { e.stopPropagation(); if (onSelectNpcForChat) onSelectNpcForChat(NPCS_2F[1]); }}>
              <planeGeometry args={[1.18, 0.50]} /><meshBasicMaterial map={signs.pastorRoom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 5. 남자화장실 (고도화 세면대 · 센서 소변기 4기 · 도자기 양변기) */}
      <group position={[4.75, 0, 1.98]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.8, 2.2]} /><meshStandardMaterial map={greyRestroomTileTex} roughness={0.35} /></mesh>
        <DetailedRestroomSink2F position={[-1.15, 0, 0.45]} rotationY={Math.PI / 2} mirrorTex={mirrorTex} />
        {[-0.45, 0.08, 0.61, 1.14].map((ux, ui) => (
          <DetailedPartitionedUrinal2F key={ui} position={[ux, 0, -0.88]} rotationY={0} showRightPartition={true} />
        ))}
        <group position={[1.15, 0, 0.48]}>
          <RoundedBox args={[1.18, 1.65, 0.05]} position={[0, 0.825, -0.48]} radius={0.01} castShadow><meshStandardMaterial color="#D6D3D1" roughness={0.4} /></RoundedBox>
          <RoundedBox args={[0.05, 1.65, 0.92]} position={[-0.56, 0.825, 0]} radius={0.01} castShadow><meshStandardMaterial color="#E7E5E4" roughness={0.35} /></RoundedBox>
          <mesh position={[-0.59, 0.86, 0.28]}><sphereGeometry args={[0.026, 8, 8]} /><meshStandardMaterial color="#18181B" metalness={0.8} /></mesh>
          <mesh position={[-0.59, 0.94, 0.28]}><circleGeometry args={[0.018, 8]} rotation={[0, -Math.PI / 2, 0]} /><meshBasicMaterial color="#22C55E" /></mesh>
          <DetailedMiniatureToilet2F position={[0.18, 0, 0]} rotationY={-Math.PI / 2} />
        </group>
        {showRoomSigns && <Billboard position={[0, 1.85, 0]}><mesh><planeGeometry args={[1.15, 0.48]} /><meshBasicMaterial map={signs.menWc} transparent /></mesh></Billboard>}
      </group>

      {/* 6. 여자화장실 (고도화 세면대 · 3연속 큐비클 · 잠금표시 · 핸드드라이어) */}
      <group position={[4.75, 0, 4.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.8, 2.6]} /><meshStandardMaterial map={greyRestroomTileTex} roughness={0.35} /></mesh>
        <DetailedRestroomSink2F position={[-1.25, 0, -0.55]} rotationY={0} mirrorTex={mirrorTex} />
        {[-0.32, 0.42, 1.16].map((cx, ci) => (
          <group key={`w_stall_${ci}`} position={[cx, 0, -0.55]}>
            <RoundedBox args={[0.04, 1.68, 1.05]} position={[-0.36, 0.84, 0]} radius={0.01} castShadow><meshStandardMaterial color="#C8BFA8" roughness={0.4} /></RoundedBox>
            <RoundedBox args={[0.14, 1.68, 0.05]} position={[-0.30, 0.84, 0.52]} radius={0.008} castShadow><meshStandardMaterial color="#9CA3AF" metalness={0.3} roughness={0.4} /></RoundedBox>
            <group position={[0.04, 0.84, 0.52]}>
              <RoundedBox args={[0.54, 1.62, 0.04]} radius={0.008} castShadow receiveShadow><meshStandardMaterial color="#FAF8F5" roughness={0.25} /></RoundedBox>
              <RoundedBox args={[0.545, 0.11, 0.045]} position={[0, -0.05, 0]} radius={0.004}><meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.25} /></RoundedBox>
              <mesh position={[-0.20, -0.05, 0.03]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#27272A" metalness={0.8} /></mesh>
              <mesh position={[-0.20, 0.04, 0.025]}><circleGeometry args={[0.018, 8]} /><meshBasicMaterial color={ci === 1 ? '#EF4444' : '#22C55E'} /></mesh>
            </group>
            <DetailedMiniatureToilet2F position={[0.02, 0, -0.12]} rotationY={0} />
          </group>
        ))}

        {/* 곡면 핸드드라이어 */}
        <group position={[0.15, 1.08, 1.12]} rotation={[0, Math.PI, 0]}>
          <RoundedBox args={[0.32, 0.36, 0.18]} radius={0.08} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.18} /></RoundedBox>
          <mesh position={[0, 0.02, 0.095]}><circleGeometry args={[0.035, 10]} /><meshBasicMaterial color="#38BDF8" /></mesh>
        </group>

        {showRoomSigns && <Billboard position={[0, 1.85, 0]}><mesh><planeGeometry args={[1.15, 0.48]} /><meshBasicMaterial map={signs.womenWc} transparent /></mesh></Billboard>}
      </group>

      {/* 7. 계단실 & 엘리베이터 */}
      <group position={[-4.85, 0, 4.25]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.6, 3.1]} /><meshStandardMaterial color="#CBD5E1" roughness={0.5} /></mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox key={`st2_${i}`} args={[0.32, 0.10 + i * 0.08, 1.25]} position={[0.65 - i * 0.30, (0.10 + i * 0.08) / 2, 0.1]} radius={0.01} castShadow onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_2F[1]); }}>
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        {showRoomSigns && <Billboard position={[0, 1.68, 0]}><mesh><planeGeometry args={[1.12, 0.48]} /><meshBasicMaterial map={signs.stairs} transparent /></mesh></Billboard>}
      </group>

      <AnimatedStainlessElevator2F position={[-0.2, 0, 5.25]} playerIdxRef={playerIdxRef} forceOpen={isElevatorModalOpen} onClickElevator={() => onSelectZone(ZONES_2F[0])} signTex={signs.elevator} showRoomSigns={showRoomSigns} />

      {/* 내벽 & 스마트 컷어웨이 외벽 */}
      <RoundedBox args={[0.16, 1.22, 1.5]} position={[-3.0, 0.61, -0.4]} radius={0.01} castShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.1]} position={[-3.0, 0.61, 2.05]} radius={0.01} castShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[3.6, 1.22, 0.16]} position={[-4.85, 0.61, 2.6]} radius={0.01} castShadow><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[0.16, 1.22, 0.6]} position={[2.8, 0.61, -0.9]} radius={0.01} castShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.1]} position={[2.8, 0.61, 0.9]} radius={0.01} castShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.22, 1.3]} position={[2.8, 0.61, 3.1]} radius={0.01} castShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[3.8, 1.22, 0.16]} position={[4.75, 0.61, 0.85]} radius={0.01} castShadow><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[3.8, 1.22, 0.16]} position={[4.75, 0.61, 3.1]} radius={0.01} castShadow><meshStandardMaterial color="#E2E8F0" /></RoundedBox>

      <SmartCutawayWall2F wallSide="north"><RoundedBox args={[14.4, 2.5, 0.24]} position={[0, 1.25, -5.6]} radius={0.02} receiveShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall2F>
      <SmartCutawayWall2F wallSide="west"><RoundedBox args={[0.24, 2.5, 11.6]} position={[-6.6, 1.25, 0.1]} radius={0.02} receiveShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall2F>
      <SmartCutawayWall2F wallSide="east"><RoundedBox args={[0.24, 2.5, 11.6]} position={[6.6, 1.25, 0.1]} radius={0.02} receiveShadow><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall2F>

      {/* NPC · 원격 성도 · 홀리라이트 · 마커 */}
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
            onClick={(e) => { e.stopPropagation(); if (npc.isOfficeStaff) playKeyboardClackSound(); if (onSelectNpcForChat) onSelectNpcForChat(npc); }}
          />
        );
      })}

      {(remotePeers || []).map((peer) => <RemoteMultiplayerAvatar2F key={peer.clientId} peer={peer} onClickPeer={onSelectRemotePeer} />)}
      {holyLightEvent && <HolyLightBeamEffect2F targetPos={holyLightEvent.targetPos} pastorName={holyLightEvent.pastorName} targetName={holyLightEvent.targetName} />}

      {ZONES_2F.map((z) => (
        <HologramMarker2F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => { if (sel.isSeatZone && sel.seatTarget) onSitOnSeat(sel.seatTarget); else onSelectZone(sel); }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 모바일 최적화 플레이어 컨트롤러 (useFrame 내 setState 병목 제거!)
// =====================================================================
function PlayerController2F({
  waypoints, playerIdxRef, seatedInfo, playerName, playerOffice, avatarConfig,
  emote, hasCoffeeCup, myChatBubble, controlsRef, followCamEnabled, onPositionUpdate
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

  useFrame(({ camera }, delta) => {
    if (!playerGroupRef.current) return;

    if (seatedInfo) {
      playerIdxRef.current = [seatedInfo.x, 0, seatedInfo.z];
      playerGroupRef.current.position.set(seatedInfo.x, 0, seatedInfo.z);
      playerGroupRef.current.rotation.y = seatedInfo.rotY ?? Math.PI;
      if (walkingRef.current) { walkingRef.current = false; setIsWalkingState(false); }
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
    const dx = tx - cx, dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.2);
      const [nx, nz] = resolveCollision2F(cx + (dx / dist) * step, cz + (dz / dist) * step);
      const angle = Math.atan2(dx, dz);
      playerIdxRef.current = [nx, 0, nz];
      playerGroupRef.current.position.set(nx, 0, nz);
      playerGroupRef.current.rotation.y = angle;
      if (!walkingRef.current) { walkingRef.current = true; setIsWalkingState(true); }
      onPositionUpdate(nx, nz, angle);

      if (followCamEnabled && controlsRef?.current) {
        camera.position.x += (nx - cx) * 0.85;
        camera.position.z += (nz - cz) * 0.85;
        controlsRef.current.target.lerp(new THREE.Vector3(nx, 0.95, nz), delta * 6.0);
        controlsRef.current.update();
      }
    } else {
      if (wpIndexRef.current < waypoints.length - 1) wpIndexRef.current += 1;
      else if (walkingRef.current) { walkingRef.current = false; setIsWalkingState(false); }
    }
  });

  return (
    <group ref={playerGroupRef} position={[-0.2, 0, 2.8]} rotation={[0, Math.PI, 0]}>
      <SmoothChibiAvatar2F
        position={[0, 0, 0]}
        rotationY={0}
        gender={avatarConfig.gender}
        hairStyle={avatarConfig.hairStyle}
        isSkirt={Boolean(avatarConfig.isSkirt)}
        hasSunglasses={Boolean(avatarConfig.hasSunglasses)}
        isWalking={isWalkingState}
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
    </group>
  );
}

function InitialCameraSetup2F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    camera.position.set(0, isMobile ? 14.2 : 11.4, isMobile ? 13.2 : 11.0);
    camera.fov = isMobile ? 42 : 36;
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, -0.4);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);
  return null;
}

// =====================================================================
// 🌟 메인 CafeOffice2F 컴포넌트 (화면 안 가리는 슬림 접이식 UI)
// =====================================================================
export default function CafeOffice2F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false), []);
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
    try { const s = localStorage.getItem('gtc_metaverse_avatar_v1'); return s ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(s) } : DEFAULT_AVATAR_CONFIG; }
    catch { return DEFAULT_AVATAR_CONFIG; }
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

  // 화면을 가리지 않도록 모바일에서는 부가 메뉴 기본 접힘
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showTopTools, setShowTopTools] = useState(!isMobile);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(!isMobile);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_2F.length), 4200);
    return () => { clearInterval(timer); toggleCafeBgm2F(false); };
  }, []);

  const broadcastMyState = useCallback((override = {}) => {
    if (!channelRef.current) return;
    const [px, , pz] = playerIdxRef.current;
    channelRef.current.track({
      clientId: clientIdRef.current, name: playerName, office: playerOffice,
      x: Number(px.toFixed(2)), z: Number(pz.toFixed(2)), rotY: Number((playerRotRef.current || 0).toFixed(2)),
      seated: Boolean(seatedInfo), emote: override.emote !== undefined ? override.emote : emote,
      chatMsg: override.chatMsg !== undefined ? override.chatMsg : myChatBubble, avatar: avatarConfig, ts: Date.now()
    }).catch(() => {});
  }, [playerName, playerOffice, seatedInfo, emote, myChatBubble, avatarConfig]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('metaverse_cafe_2f', { config: { presence: { key: clientIdRef.current } } });
    channelRef.current = channel;
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const peers = [];
        Object.keys(state).forEach((key) => { if (key !== clientIdRef.current && state[key]?.length) peers.push(state[key][state[key].length - 1]); });
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
          await channel.track({ clientId: clientIdRef.current, name: playerName, office: playerOffice, x: px, z: pz, rotY: Math.PI, seated: false, emote: 'coffee', chatMsg: '', avatar: avatarConfig, ts: Date.now() });
        }
      });
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [playerName, playerOffice, avatarConfig]);

  const triggerSocialAction = useCallback((emoteType, chatText = '') => {
    setEmote(emoteType);
    if (emoteType === 'coffee') setHasCoffeeCup(true);
    if (emoteType === 'typing') playKeyboardClackSound();
    if (chatText) setMyChatBubble(chatText);
    broadcastMyState({ emote: emoteType, chatMsg: chatText });
    setTimeout(() => { setEmote(null); broadcastMyState({ emote: null, chatMsg: chatText }); }, 4000);
    if (chatText) setTimeout(() => { setMyChatBubble(''); broadcastMyState({ emote: null, chatMsg: '' }); }, 5500);
  }, [broadcastMyState]);

  const triggerHolyBenediction2F = useCallback((pastorDisplayName, targetDisplayName, targetCoords) => {
    const eventPayload = { pastorName: pastorDisplayName, targetName: targetDisplayName, targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]], ts: Date.now() };
    playHolyBlessingSound();
    setHolyLightEvent(eventPayload);
    triggerSocialAction('pray', `아멘! 목양실에서 ${pastorDisplayName}의 거룩한 축도를 받습니다 🙏`);
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'holy_blessing_2f', payload: eventPayload }).catch(() => {});
    setTimeout(() => setHolyLightEvent(null), 7000);
  }, [triggerSocialAction]);

  const handleSubmitPastorCounseling = async (e) => {
    if (e) e.preventDefault();
    if (!counselTitle.trim() || !counselContent.trim()) return alert('면담 제목과 내용을 입력해 주세요.');
    setIsSubmittingCounsel(true);
    const payload = { user_name: playerName, category: counselCategory, title: `[2F목양실 1:1면담] ${counselTitle.trim()}`, content: counselContent.trim(), status: 'pending', created_at: new Date().toISOString() };
    try {
      if (supabase) await supabase.from('counseling_qna').insert([payload]);
      localStorage.setItem('admin_default_nav_tab', 'counseling');
      localStorage.setItem('latest_pastor_counsel_request', JSON.stringify(payload));
      window.dispatchEvent(new Event('storage'));
      setCounselSubmittedSuccess(true);
      triggerSocialAction('pray', '목양실에서 담임목사님께 1:1 신앙 면담을 신청했습니다 🙏');
    } catch (err) { alert('면담 신청 중 오류: ' + err.message); }
    finally { setIsSubmittingCounsel(false); }
  };

  const handleNavigateToAdminCounseling = () => {
    localStorage.setItem('admin_default_nav_tab', 'counseling');
    setShowCounselingModal(false);
    if (typeof setActiveScreen === 'function') setActiveScreen('admin');
  };

  const handleSitOnSeat = useCallback((seatData) => {
    setSeatedInfo(seatData);
    if (seatData.withCoffee) setHasCoffeeCup(true);
    setWaypoints([[seatData.x, seatData.z]]);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleStandUp = useCallback(() => { setSeatedInfo(null); setTimeout(() => broadcastMyState(), 100); }, [broadcastMyState]);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    setWaypoints(computeSmartPath2F(sx, sz, tx, tz));
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText((npc.dialogues && npc.dialogues[0]) || '할렐루야! 2층 좋은나무 북카페에 오신 것을 환영합니다 ☕');
    setSelectedChatNpc(npc);
    triggerSocialAction('wave');
  }, [triggerSocialAction]);

  useEffect(() => {
    if (!isMapDrawerOpen) return;
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width, h = mini.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1E2026'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#D97706'; ctx.fillRect(6, 6, w - 12, 32);
    ctx.fillStyle = '#2563EB'; ctx.fillRect(6, 42, 30, 24);
    ctx.fillStyle = '#7C3AED'; ctx.fillRect(76, 40, 32, 15);
    ctx.fillStyle = '#10B981'; ctx.fillRect(42, 76, 26, 14);
    remotePeers.forEach((p) => {
      ctx.beginPath(); ctx.arc((((p.x || 0) + 6.8) / 13.6) * w, (((p.z || 0) + 5.6) / 11.4) * h, 3.2, 0, Math.PI * 2); ctx.fillStyle = '#34D399'; ctx.fill();
    });
    const [cx, , cz] = playerIdxRef.current;
    ctx.beginPath(); ctx.arc(((cx + 6.8) / 13.6) * w, ((cz + 5.6) / 11.4) * h, 4.2, 0, Math.PI * 2); ctx.fillStyle = '#FACC15'; ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handlePositionUpdate = useCallback((px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_2F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    setActiveZone((prev) => (prev?.id === found?.id ? prev : found));
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) { lastSyncTimeRef.current = now; broadcastMyState(); }
  }, [broadcastMyState]);

  const darkPillStyle = { backgroundColor: 'rgba(30, 32, 38, 0.92)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.16)' };

  return (
    <div translate="no" style={{ backgroundColor: '#2B2C30' }} className="notranslate w-full h-full relative overflow-hidden select-none font-sans">
      {/* 1. 슬림 상단 HUD (모바일에서 화면 가리지 않도록 접이식 도구 바) */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[74vw]">
        <div className="flex items-center gap-1.5">
          <button onClick={onExitHome} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">
            ◀ 2F 북카페·목양실
          </button>
          <span style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />{remotePeers.length + 1}명
          </span>
          <button onClick={() => setShowTopTools((v) => !v)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer">
            {showTopTools ? '▲ 접기' : '⚙️ 도구'}
          </button>
        </div>

        {showTopTools && (
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => { handleWalkTo(4.2, -0.2); setSelectedChatNpc(NPCS_2F[1]); setChatReplyText(NPCS_2F[1].dialogues[0]); }} style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">✝️ 목양실</button>
            <button onClick={() => { setCounselSubmittedSuccess(false); setShowCounselingModal(true); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">📝 면담</button>
            <button onClick={() => { const n = !isMusicOn; setIsMusicOn(n); toggleCafeBgm2F(n); }} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{isMusicOn ? '🎵 끔' : '☕ BGM'}</button>
            <button onClick={() => setFollowCamEnabled((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{followCamEnabled ? '🎥 추적' : '🎥 자유'}</button>
            <button onClick={() => setShowRoomSigns((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{showRoomSigns ? '🏷️ ON' : '🏷️ OFF'}</button>
          </div>
        )}
      </div>

      {/* 2. 우측 상단 미니맵 드로어 */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        <button onClick={() => setIsMapDrawerOpen((p) => !p)} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">
          {isMapDrawerOpen ? '✕ 닫기' : '🗺️ 2F 맵'}
        </button>

        {isMapDrawerOpen && (
          <div style={darkPillStyle} className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in">
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[36vh] overflow-y-auto hide-scrollbar">
              {ZONES_2F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnSeat(z.seatTarget);
                    else if (z.isPastorRoomZone) { handleWalkTo(4.2, -0.2); setSelectedChatNpc(NPCS_2F[1]); setChatReplyText(NPCS_2F[1].dialogues[0]); }
                    else if (z.isOfficeZone) { playKeyboardClackSound(); handleWalkTo(-4.4, 1.0); setSelectedChatNpc(NPCS_2F[2]); setChatReplyText(NPCS_2F[2].dialogues[0]); }
                    else { const dest = z.roomTarget || [z.pos[0], z.pos[2]]; handleWalkTo(dest[0], dest[1]); setActiveZone(z); setModalZone(z); }
                    setIsMapDrawerOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold cursor-pointer truncate"
                >
                  {z.badge}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 슬림 접이식 메뉴 (화면 가림 최소화) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
        {showBottomDock ? (
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              <div style={darkPillStyle} className="p-1 rounded-xl border shadow-xl flex items-center gap-1 shrink-0">
                {[
                  { label: '☕ 커피', emote: 'coffee', msg: '좋은나무 북카페 커피가 정말 맛있네요! ☕🥰' },
                  { label: '💻 타이핑', emote: 'typing', msg: '(타다다닥! ⌨️) 주보와 사역 자료를 정리합니다!' },
                  { label: '👋 인사', emote: 'wave', msg: '성도님 반갑습니다! 차 한잔 하세요 👋' },
                  { label: '🙏 기도', emote: 'pray', msg: '두 손 모아 간절히 기도합니다 🙏' },
                  { label: '💃 춤', emote: 'dance', msg: '기쁨으로 랄랄라! 💃🎵' }
                ].map((act, idx) => (
                  <button key={idx} onClick={() => triggerSocialAction(act.emote, act.msg)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer">
                    {act.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (!quickChatInput.trim()) return; triggerSocialAction('coffee', quickChatInput.trim()); setQuickChatInput(''); }}
                style={darkPillStyle}
                className="flex items-center gap-1 px-2 py-1 rounded-xl border shadow-xl min-w-[180px] flex-1 max-w-xs"
              >
                <input type="text" value={quickChatInput} onChange={(e) => setQuickChatInput(e.target.value)} placeholder="말풍선 대화..." className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400" />
                <button type="submit" className="px-2 py-1 rounded-lg bg-amber-500 text-stone-950 text-[10.5px] font-black cursor-pointer">전송</button>
              </form>
              <button onClick={() => setShowBottomDock(false)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer shrink-0">✕</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button onClick={() => setShowBottomDock(true)} style={darkPillStyle} className="px-3 py-1.5 rounded-full border shadow-xl text-xs font-black cursor-pointer">
              ☕ 대화·모션 ▲
            </button>
            {seatedInfo && (
              <button onClick={handleStandUp} className="px-3 py-1.5 rounded-full bg-amber-500 text-stone-950 text-xs font-black shadow-xl cursor-pointer">
                🚶 일어나기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. 모바일 최적화 메인 3D 캔버스 */}
      <Canvas
        shadows
        dpr={isMobile ? [1, 1.25] : [1, 1.75]}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.06
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.4, 11.0]} fov={36} near={0.1} far={220} />
        <InitialCameraSetup2F controlsRef={controlsRef} />

        <ambientLight intensity={1.12} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 0.92]} />
        <directionalLight
          position={[-6, 14, 10]}
          intensity={1.32}
          color="#FFF7ED"
          castShadow
          shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
          shadow-bias={-0.0005}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={(e) => { e.stopPropagation(); handleWalkTo(e.point.x, e.point.z); }}>
          <planeGeometry args={[14.2, 13.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <TwoFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => { const dest = z.roomTarget || [z.pos[0], z.pos[2]]; handleWalkTo(dest[0], dest[1]); setModalZone(z); }}
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

        {!isMobile && <ContactShadows frames={1} resolution={256} position={[0, 0.01, 0]} opacity={0.32} scale={22} blur={2.0} far={4} />}
        <OrbitControls ref={controlsRef} enableRotate={true} enablePan={true} enableZoom={true} screenSpacePanning={true} enableDamping={true} dampingFactor={0.07} minDistance={2.5} maxDistance={32} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>

      {/* 5~8. 원격 성도 · 면담 신청 · NPC 대화 · 엘리베이터 층 이동 모달 */}
      {selectedRemotePeer && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedRemotePeer(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-sm border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-bold text-amber-400 block">2층 북카페·목양실 성도 교제</span><h3 className="text-base font-black text-white">{selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})</h3></div>
              <button onClick={() => setSelectedRemotePeer(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { triggerSocialAction('coffee', `${selectedRemotePeer.name}님! 같이 커피 마셔요 ☕🥰`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-200 cursor-pointer">☕ 같이 커피</button>
              <button onClick={() => { triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 샬롬 👋`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold text-white cursor-pointer">👋 인사하기</button>
              <button onClick={() => { triggerSocialAction('pray', `${selectedRemotePeer.name}님을 위해 함께 중보합니다 🙏`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold text-white cursor-pointer">🙏 중보기도</button>
              <button onClick={() => { triggerSocialAction('typing', `${selectedRemotePeer.name}님과 함께 사역 준비 💻`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold text-white cursor-pointer">💻 같이 업무</button>
            </div>
            {canPlayerBless && (
              <button onClick={() => { triggerHolyBenediction2F(`${playerName} 목사님`, selectedRemotePeer.name, [selectedRemotePeer.x || -0.2, 0, selectedRemotePeer.z || 2.2]); setSelectedRemotePeer(null); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                ✨ [{selectedRemotePeer.name}] 성도에게 축도 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {showCounselingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCounselingModal(false)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-purple-500/50 rounded-3xl p-5 shadow-2xl space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-mono font-bold text-purple-400 block">PASTORAL COUNSELING OFFICE</span><h3 className="text-base font-black text-white">✝️ 담임목사님 1:1 목양 면담 신청</h3></div>
              <button onClick={() => setShowCounselingModal(false)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            {counselSubmittedSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-2">
                  <span className="text-2xl block">🙏</span>
                  <h4 className="text-sm font-black text-emerald-300">1:1 목양 면담 신청이 접수되었습니다!</h4>
                </div>
                <button onClick={handleNavigateToAdminCounseling} style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">🏛️ 어드민 콘솔 [신앙 상담실]로 이동 ➔</button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPastorCounseling} className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {['신앙·영적고민', '가정·자녀기도', '일터·진로심방'].map((cat) => (
                    <button key={cat} type="button" onClick={() => setCounselCategory(cat)} className={`py-2 rounded-xl text-[11px] font-black border cursor-pointer ${counselCategory === cat ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{cat}</button>
                  ))}
                </div>
                <input type="text" value={counselTitle} onChange={(e) => setCounselTitle(e.target.value)} placeholder="면담 제목 입력 *" className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none" required />
                <textarea rows={4} value={counselContent} onChange={(e) => setCounselContent(e.target.value)} placeholder="나누고 싶은 기도제목 및 내용 *" className="w-full p-3 rounded-xl bg-black border border-white/15 text-xs text-white outline-none resize-none" required />
                <button type="submit" disabled={isSubmittingCounsel} style={{ backgroundColor: '#10B981', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">{isSubmittingCounsel ? '전송 중...' : '📝 면담 신청 등록하기'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {selectedChatNpc && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setSelectedChatNpc(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span style={{ color: '#FDE047' }} className="text-[10.5px] font-bold block">{selectedChatNpc.role}</span><h3 className="text-sm sm:text-base font-black">{selectedChatNpc.name}</h3></div>
              <button onClick={() => setSelectedChatNpc(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs leading-relaxed text-amber-100">"{chatReplyText}"</div>
            {selectedChatNpc.canBless && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { const pn = selectedChatNpc.name; setSelectedChatNpc(null); triggerHolyBenediction2F(pn, playerName, playerIdxRef.current); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="py-2.5 rounded-xl font-black text-xs cursor-pointer">✨ 축도 받기</button>
                <button onClick={() => { setSelectedChatNpc(null); setCounselSubmittedSuccess(false); setShowCounselingModal(true); }} style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }} className="py-2.5 rounded-xl font-black text-xs cursor-pointer">📝 1:1 면담</button>
              </div>
            )}
            <button onClick={() => { setHasCoffeeCup(true); triggerSocialAction('coffee', '따뜻한 아메리카노 한 잔 마십니다 ☕'); setSelectedChatNpc(null); }} className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-amber-500/25 text-xs font-bold cursor-pointer">☕ 아메리카노 주문하고 마시기</button>
          </div>
        </div>
      )}

      {modalZone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setModalZone(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span style={{ backgroundColor: '#10B981', color: '#030712' }} className="px-2.5 py-1 rounded-full font-black text-xs">{modalZone.badge}</span>
              <button onClick={() => setModalZone(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <h3 className="text-base font-black">{modalZone.title}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{modalZone.desc}</p>
            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 목양실 · 사무실 (현재)' },
                  { fl: '3F', label: '3F 대예배당 본당' },
                  { fl: '4F', label: '4F 영유아 예배실' },
                  { fl: '5F', label: '5F 소예배 · 찬양홀' },
                  { fl: '6F', label: '6F 다음세대 교육관' },
                  { fl: '7F', label: '7F 루프탑 하늘정원 · 좋은나무 빌리지' }
                ].map((item) => (
                  <button key={item.fl} onClick={() => { setModalZone(null); onChangeFloor(item.fl); }} className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer">
                    <span>{item.label}</span><span>이동 ➔</span>
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
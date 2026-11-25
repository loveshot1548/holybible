// src/metaverse/Education6F.js (전 층 동일 캐릭터/표정 · 소품 디테일 · 모바일 최적화 완성본)
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
// 🔗 매일예배 설교 & 주일학교 찬양 유튜브 실시간 동기화 헬퍼
// =====================================================================
const parseYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

const getSyncedWorshipVideo6F = (storeDailyData = null) => {
  try {
    const directKeys = ['daily_worship_video_url', 'sermon_active_video_url', 'app_active_gisangogi_url', 'qt_active_video_url'];
    for (const key of directKeys) {
      const val = localStorage.getItem(key);
      if (val && parseYoutubeId(val)) {
        return { url: val, id: parseYoutubeId(val), title: localStorage.getItem('daily_worship_video_title') || '좋은나무교회 다음세대 말씀 & 매일예배' };
      }
    }
    const sources = [];
    if (storeDailyData && typeof storeDailyData === 'object') sources.push(storeDailyData);
    ['qt_daily', 'dailyData', 'goodtree_daily_data', 'days_data'].forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) { try { sources.push(JSON.parse(raw)); } catch (_) {} }
    });
    for (const parsed of sources) {
      const dates = Object.keys(parsed).sort().reverse();
      for (const d of dates) {
        const entry = parsed[d];
        if (!entry || typeof entry !== 'object') continue;
        const vUrl = entry.sermonVideoUrl || entry.sermonVideoId || entry.videoUrl || entry.videoId || entry.youtubeUrl || entry.qtVideoUrl || entry.url;
        if (vUrl && parseYoutubeId(String(vUrl))) {
          return { url: String(vUrl), id: parseYoutubeId(String(vUrl)), title: entry.sermonTitle || entry.qtTitle || entry.title || `${d} 다음세대 예배 말씀` };
        }
      }
    }
  } catch (_) {}
  return { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk', title: '다윗처럼 믿음으로 승리해요! (다음세대 예배)' };
};

// =====================================================================
// 🎵 싱글톤 사운드 엔진 (모바일 오디오 안정화)
// =====================================================================
let sharedAudio6F = null;
function getAudio6F() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio6F) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudio6F = new AudioCtx();
  }
  if (sharedAudio6F && sharedAudio6F.state === 'suspended') {
    sharedAudio6F.resume().catch(() => {});
  }
  return sharedAudio6F;
}

let bgmInterval6F = null;
const togglePraiseBgm6F = (play) => {
  if (!play) {
    if (bgmInterval6F) clearInterval(bgmInterval6F);
    bgmInterval6F = null;
    return;
  }
  const ctx = getAudio6F();
  if (!ctx) return;
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
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.32);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.32);
      step++;
    } catch (_) {}
  }, 380);
};

const playElevatorDingSound = () => {
  try {
    const ctx = getAudio6F();
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
    const ctx = getAudio6F();
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

// =====================================================================
// 🎨 프로시저럴 텍스처 (모바일 경량 해상도 + 동화책장 텍스처)
// =====================================================================
function makeCanvasTexture(drawFn, width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#AD6E2F') {
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
    for (let i = 0; i < 100; i++) {
      const y = (i / 100) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }, 256, 256);
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
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      ctx.fillStyle = colors[r][c]; ctx.fillRect(c * step, r * step, step, step);
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 4; ctx.strokeRect(c * step + 2, r * step + 2, step - 4, step - 4);
    }
  }, 256, 256);
}

function makeKidsBookshelfTexture6F() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#F5E6D3'; ctx.fillRect(0, 0, w, h);
    const palette = ['#EF4444', '#FACC15', '#10B981', '#38BDF8', '#A855F7', '#F97316', '#EC4899'];
    const rows = 3, rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const baseY = (r + 1) * rowH - 10;
      let x = 10, idx = r * 13;
      while (x < w - 16) {
        const bw = 12 + ((idx * 7) % 14);
        const bh = rowH * (0.64 + ((idx * 11) % 22) * 0.01);
        ctx.fillStyle = palette[idx % palette.length];
        ctx.fillRect(x, baseY - bh, bw, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(x + 2, baseY - bh + 8, bw - 4, 4);
        x += bw + 3; idx++;
      }
      ctx.fillStyle = '#B87E46'; ctx.fillRect(0, baseY, w, 12);
    }
  }, 384, 256);
}

function makeTileGridTexture(bgHex = '#8E939B', lineHex = '#6C717A', gridCount = 8) {
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

function makeBrightMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE'); grad.addColorStop(0.55, '#FFFFFF'); grad.addColorStop(0.8, '#BAE6FD'); grad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let x = -80; x < w + 80; x += 130) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0); ctx.lineTo(x - 52, h); ctx.lineTo(x - 90, h); ctx.closePath(); ctx.fill();
    }
  }, 256, 128);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#0284C7') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath(); ctx.roundRect(12, 12, w - 24, h - 24, 34); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = badgeColor; ctx.stroke();
    ctx.fillStyle = badgeColor; ctx.font = '900 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 56);
    ctx.fillStyle = '#0F172A'; ctx.font = '900 46px sans-serif';
    ctx.fillText(title, w / 2, 126);
  }, 420, 180);
}

// =====================================================================
// 📍 6층 8대 인터랙션 존 · 충돌 · 네비게이션 · NPC 데이터
// =====================================================================
const ZONES_6F = [
  { id: 'zone_6f_elev', code: '01', subCode: 'ELV', name: '6F 엘리베이터 홀', pos: [0.0, 0, 4.5], isElevator: true, badge: '01 6F 엘리베이터', title: '🛗 6층 다음세대 교육관 엘리베이터', desc: '스테인리스 양문이 열리며 1층~7층으로 이동합니다.' },
  { id: 'zone_6f_stairs', code: '02', subCode: '계단', name: '좌측 하단 계단실', pos: [-2.0, 0, 4.2], isElevator: true, badge: '02 좌측 계단실', title: '🪜 6층 좌측 하단 양방향 계단실', desc: '위·아래층 연결 U자형 계단실입니다.' },
  { id: 'zone_6f_infant', code: '03', subCode: '유아', name: '유아부실 (0~3세)', pos: [-1.8, 0, 1.85], roomTarget: [-4.2, 1.85], badge: '03 유아부 (좌측)', title: '👶 유아부 키즈 놀이방 (0~3세)', desc: 'EVA 퍼즐매트 위에 구름 미끄럼틀, 볼풀장, 흔들목마, 테디베어, 고리끼우기 교구가 완비되어 있습니다.', schedule: '주일 오전 11:00 | 6층 좌측 유아부실' },
  { id: 'zone_6f_elem_left', code: '04', subCode: '초등L', name: '초등부 분반실', pos: [-1.8, 0, -1.8], roomTarget: [-4.1, -1.8], badge: '04 초등부 분반실', title: '📘 초등부 말씀 분반 & 소그룹 교육실', desc: '이젤 화이트보드와 성경 동화책 서가, 지구본, 원형 모둠 테이블이 갖춰져 있습니다.', schedule: '주일 오전 11:00 | 6층 좌측 초등부실' },
  { id: 'zone_6f_newfamily', code: '05', subCode: '새가족', name: '새가족반 라운지', pos: [-0.2, 0, -3.8], roomTarget: [-1.5, -5.5], badge: '05 새가족반 (상단)', title: '🤝 좋은나무교회 새가족반 카페 라운지', desc: '바 카운터, 디저트 트레이, 라운지 테이블과 최수경 목사님의 새가족 축복 안수가 진행됩니다.', schedule: '주일 오후 1:00 | 6층 상단 새가족반실' },
  { id: 'zone_6f_elem_right', code: '06', subCode: '초등R', name: '초등부 본관', pos: [1.8, 0, -1.8], roomTarget: [4.2, -2.0], isTvZone: true, badge: '06 초등부 본관', title: '🏫 초등부 Sunday School 메인 예배실', desc: '십자가 원목 강대상과 예배 유튜브 스크린, 2인용 학습 책상 6세트가 배치되어 있습니다.', schedule: '주일 오전 11:00 | 6층 우측 초등부실' },
  { id: 'zone_6f_kinder', code: '07', subCode: '유치', name: '유치부실 (4~7세)', pos: [1.8, 0, 1.4], roomTarget: [4.0, 1.4], badge: '07 유치부 (우측)', title: '🎨 무지개 무대 유치부 (4~7세)', desc: '파스텔 무지개 무대, 디지털 피아노, 노아의 방주 모형, 6잎 꽃모양 원탁이 있는 예배실입니다.', schedule: '주일 오전 11:00 | 6층 우측 유치부실' },
  { id: 'zone_6f_restroom', code: '08', subCode: '화장실', name: '남·여 화장실', pos: [1.8, 0, 3.6], roomTarget: [3.8, 3.6], badge: '08 화장실 (우측하단)', title: '🚻 6층 남·여 화장실 및 어린이 세면대', desc: '옐로우 포인트 세면대 3기와 대형 거울, 큐비클 부스 4칸, 핸드드라이어가 완비되어 있습니다.' }
];

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
    const dx = x - closestX, dz = z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      x += (dx / dist) * overlap; z += (dz / dist) * overlap;
    }
  }
  return [x, z];
}

function getRoomDoorInfo6F(x, z) {
  if (z < -4.7 && x < 2.8) return { room: 'newfamily', doorIn: [-0.2, -5.2], doorOut: [-0.2, -4.1] };
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
  if (startInfo.room === endInfo.room) return [[ex, ez]];
  const waypoints = [];
  if (startInfo.room !== 'hallway') waypoints.push(startInfo.doorIn, startInfo.doorOut);
  if (endInfo.room !== 'hallway') waypoints.push([0.0, endInfo.doorOut[1]], endInfo.doorOut, endInfo.doorIn);
  waypoints.push([ex, ez]);
  return waypoints;
}

const NPCS_6F = [
  { id: 'pastor_choi_6f', name: '최수경 목사님 (교육·새가족 축도)', role: '다음세대 교육관 · 새가족 축복 사역', isPastor: true, canBless: true, x: -2.35, y: 0, z: -5.55, rotY: 0.35, gender: 'female', hairStyle: 'bob', isSkirt: true, autoWave: true, shirt: '#8B5CF6', pants: '#EDE9FE', hair: '#3F2305', dialogues: ['할렐루야! 6층 다음세대 교육관과 새가족반 라운지에 오신 성도님들을 축복합니다 🥰', '저를 클릭하시면 다음세대 자녀들과 새가족을 위한 [✨ 거룩한 축도(홀리라이트)]를 받으실 수 있어요 🙏'] },
  { id: 'npc_6f_pastor', name: '전도사님 (초등부 인도)', role: '초등부 담당교역자', isPraiseOrWord: true, x: 4.8, y: 0.28, z: -5.95, rotY: 0, gender: 'male', hairStyle: 'parted', shirt: '#2563EB', pants: '#1E293B', hair: '#18181B', dialogues: ['얘들아 할렐루야! 오늘 초등부 말씀 제목은 "다윗처럼 담대하게"란다 ✝️', '강대상 뒤 스크린이나 저를 클릭하면 오늘의 예배 유튜브 영상을 함께 볼 수 있어!'] },
  { id: 'npc_6f_1', name: '박부장 (교육관 안내)', role: '다음세대 교육위원장', x: 0.5, y: 0, z: -0.5, patrolZ: [-2.8, 2.2], gender: 'male', hairStyle: 'short', shirt: '#0284C7', pants: '#1E293B', hair: '#451A03', dialogues: ['반갑습니다! 6층은 유아부·유치부·초등부와 새가족반이 모이는 다음세대 교육관입니다 😊'] },
  { id: 'npc_6f_2', name: '최교사 (유치부 찬양)', role: '유치부 율동·찬양교사', x: 1.75, y: 0, z: 1.3, gender: 'female', hairStyle: 'long_wave', isSkirt: true, autoWave: true, rotY: -0.8, shirt: '#EC4899', pants: '#FBCFE8', hair: '#5C3A21', dialogues: ['우리 유치부 친구들 여기 오른쪽 무지개 무대 방으로 모이세요 🎨'] },
  { id: 'npc_6f_3', name: '이교사 (유아부 돌봄)', role: '0~3세 유아부 교사', x: -1.75, y: 0, z: 1.8, gender: 'female', hairStyle: 'bob', isSkirt: true, autoWave: true, rotY: 0.8, shirt: '#F59E0B', pants: '#FDE68A', hair: '#5C3A21', dialogues: ['아기와 부모님이 함께 드리는 유아부는 왼쪽 방입니다 👶'] },
  { id: 'npc_6f_4', name: '정팀장 (새가족반 영접)', role: '새가족부 섬김팀장', x: -0.2, y: 0, z: -3.6, rotY: 0, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#10B981', pants: '#D1FAE5', hair: '#27272A', dialogues: ['주일 오후 1시 새가족반 스페셜티 카페 라운지에 오신 것을 진심으로 환영합니다 🤝'] },
  { id: 'npc_6f_kid1', name: '다윗 (초등부 5학년)', role: '초등부 어린이 회장', isChild: true, x: 3.65, y: 0, z: -3.88, rotY: Math.PI, seated: true, gender: 'male', hairStyle: 'short', shirt: '#38BDF8', pants: '#334155', hair: '#78350F', dialogues: ['전도사님! 저요 저요! ✋ 책상 위 성경책 펴놓고 말씀 퀴즈 발표할 준비 됐어요!'] },
  { id: 'npc_6f_kid2', name: '에스더 (초등부 4학년)', role: '초등부 찬양리더 어린이', isChild: true, x: 5.95, y: 0, z: -2.58, rotY: Math.PI, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#F472B6', pants: '#FCE7F3', hair: '#5C3A21', dialogues: ['초등부 예배실 강대상이랑 스크린이 진짜 본당처럼 멋져요 ✨'] }
];

// =====================================================================
// ✨ 축도 홀리라이트 · 스마트 컷어웨이 · 홀로그램 마커
// =====================================================================
function HolyLightBeamEffect6F({ targetPos, pastorName, targetName }) {
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
    ctx.fillText(`✝️ ${pastorName || '목사님'}의 다음세대·새가족 축도`, w / 2, 46);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 26px serif';
    ctx.fillText(`${targetName} 성도님과 다음세대 위에 다윗과 같은 믿음과`, w / 2, 88);
    ctx.fillText(`하늘의 지혜와 평강이 영원토록 함께할지어다! 아멘 🙏`, w / 2, 126);
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
      <mesh ref={beamRef} position={[0, 2.8, 0]}><cylinderGeometry args={[0.88, 0.62, 5.6, 20, 1, true]} /><meshBasicMaterial color="#FDE047" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[0.50, 0.72, 24]} /><meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}><ringGeometry args={[0.42, 0.50, 20]} /><meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} /></mesh>
      <group ref={particlesRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(ang) * 0.42, (i / 10) * 2.0, Math.sin(ang) * 0.42]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} /></mesh>;
        })}
      </group>
      <pointLight position={[0, 2.4, 0]} intensity={4.5} distance={6.0} color="#FDE047" />
      <Billboard position={[0, 2.25, 0]}><mesh renderOrder={30}><planeGeometry args={[2.5, 0.62]} /><meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} /></mesh></Billboard>
    </group>
  );
}

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
      if (child.isMesh && child.material && !child.userData?.keepOpaque) {
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
  const badgeTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
    grad.addColorStop(0, '#34D399'); grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(w / 2 - 22, h / 2, 72, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#A7F3D0'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 58px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(zone.code, w / 2 - 22, h / 2 + 4);
    if (zone.subCode) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; ctx.beginPath(); ctx.roundRect(w / 2 + 30, h / 2 + 6, 94, 44, 14); ctx.fill();
      ctx.fillStyle = '#ECFDF5'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(zone.subCode, w / 2 + 77, h / 2 + 28);
    }
  }, 320, 196), [zone.code, zone.subCode]);

  useEffect(() => () => badgeTex.dispose(), [badgeTex]);
  useFrame(({ clock }) => { if (pulseRef.current) { const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05; pulseRef.current.scale.set(s, s, 1); } });

  return (
    <group position={zone.pos} onClick={(e) => { e.stopPropagation(); onSelect(zone); }}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.42, 0.52, 24]} /><meshBasicMaterial color="#34D399" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><circleGeometry args={[0.42, 24]} /><meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} /></mesh>
      <Billboard position={[0.06, 0.38, 0]}><mesh><planeGeometry args={[0.72, 0.44]} /><meshBasicMaterial map={badgeTex} transparent depthWrite={false} /></mesh></Billboard>
    </group>
  );
}

// =====================================================================
// 🥰 전 층 동일 2.5등신 치비 아바타 (실시간 표정 · 눈 깜빡임 · 발표/율동)
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

function CharacterHairStyle6F({ style = 'short', hairColor = '#27272A' }) {
  if (style === 'long_wave') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.08, 0.98, 1.08]} castShadow><sphereGeometry args={[0.235, 14, 12]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.05, 0.42, 0.55]}><sphereGeometry args={[0.19, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.18, -0.09, -0.02]} rotation={[0, 0, 0.12]}><capsuleGeometry args={[0.065, 0.25, 5, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.18, -0.09, -0.02]} rotation={[0, 0, -0.12]}><capsuleGeometry args={[0.065, 0.25, 5, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, -0.11, -0.14]} scale={[1.28, 1.0, 0.65]}><capsuleGeometry args={[0.13, 0.25, 5, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'bob') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.01]} scale={[1.10, 0.98, 1.08]} castShadow><sphereGeometry args={[0.238, 14, 12]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.05, 0.42, 0.55]}><sphereGeometry args={[0.19, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.17, -0.05, 0.02]} rotation={[0, 0, -0.08]}><capsuleGeometry args={[0.058, 0.14, 5, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.17, -0.05, 0.02]} rotation={[0, 0, 0.08]}><capsuleGeometry args={[0.058, 0.14, 5, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.96, 1.06]} castShadow><sphereGeometry args={[0.235, 14, 12]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.10, 0.14]} scale={[1.02, 0.40, 0.52]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0, 0.24, -0.14]}><sphereGeometry args={[0.105, 10, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  if (style === 'parted') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.94, 1.06]} castShadow><sphereGeometry args={[0.235, 14, 12]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[-0.08, 0.11, 0.13]} rotation={[0, 0, 0.35]} scale={[1.1, 0.55, 0.65]}><sphereGeometry args={[0.13, 8, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
        <mesh position={[0.09, 0.11, 0.13]} rotation={[0, 0, -0.25]} scale={[1.0, 0.52, 0.65]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.06, -0.02]} scale={[1.06, 0.94, 1.06]} castShadow><sphereGeometry args={[0.235, 14, 12]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
      <mesh position={[0, 0.10, 0.08]} scale={[0.98, 0.65, 0.85]}><sphereGeometry args={[0.21, 10, 8]} /><meshStandardMaterial color={hairColor} roughness={0.45} /></mesh>
    </group>
  );
}

function SmoothChibiAvatar6F({
  position = [0, 0, 0], targetPosition = null, patrolZ = null, rotationY = 0,
  isWalking = false, isSeated = false, isChild = false, gender = 'male', hairStyle = 'short',
  isSkirt = false, autoWave = false, hasSunglasses = false, emote = null,
  shirtColor = '#FACC15', pantsColor = '#2563EB', hairColor = '#B45309', skinColor = '#FFE4C4',
  nameTagTexture = null, speechBubbleText = null, onClick = null, seedOffset = 0
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
  const scaleVal = isChild ? 0.82 : 1.0;
  const isPraying = emote === 'pray';
  const isHappyEyes = emote === 'dance' || emote === 'raise_hand' || isChild;
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
      const curX = outerGroupRef.current.position.x, curZ = outerGroupRef.current.position.z;
      if (Math.hypot(targetPosition[0] - curX, targetPosition[2] - curZ) > 0.03) {
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
        st.z += st.dir * delta * 0.7;
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
      if (emote === 'bless') { leftArmRef.current.rotation.set(-2.1, 0, 0.35); rightArmRef.current.rotation.set(-2.1, 0, -0.35); }
      else if (emote === 'raise_hand') { rightArmRef.current.rotation.set(-2.85 + Math.sin(t * 8) * 0.12, 0, -0.15); leftArmRef.current.rotation.set(isSeated ? -0.35 : 0, 0, 0.15); }
      else if (isPraying) { leftArmRef.current.rotation.set(-1.15, 0, -0.42); rightArmRef.current.rotation.set(-1.15, 0, 0.42); }
      else if (emote === 'dance') { leftArmRef.current.rotation.set(0.2, 0, 2.4 + Math.sin(t * 12) * 0.45); rightArmRef.current.rotation.set(0.2, 0, -2.4 + Math.cos(t * 12) * 0.45); }
      else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) { rightArmRef.current.rotation.set(0.3, 0, -2.35 + Math.sin(t * 10) * 0.32); leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.08, 0, 0.18); }
      else if (isSeated) { leftArmRef.current.rotation.set(-0.35, 0, 0.1); rightArmRef.current.rotation.set(-0.35, 0, -0.1); }
      else if (walkingNow) { const sw = Math.sin(t * 10.0) * 0.48; leftArmRef.current.rotation.set(-sw, 0, 0.16); rightArmRef.current.rotation.set(sw, 0, -0.16); }
      else { leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.06, 0, 0.18); rightArmRef.current.rotation.set(-Math.sin(t * 2) * 0.06, 0, -0.18); }
    }

    if (headGroupRef.current) {
      if (isPraying) headGroupRef.current.rotation.set(0.32, 0, 0);
      else headGroupRef.current.rotation.set(Math.sin(t * 2.6) * 0.05, Math.cos(t * 1.4) * 0.07, Math.sin(t * 1.8) * 0.03);
    }
    if (rootRef.current) {
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.15 : 0;
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 10.0)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce + jump;
      rootRef.current.position.z = isSeated ? 0.04 : 0;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]} scale={[scaleVal, scaleVal, scaleVal]} onClick={onClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><circleGeometry args={[0.25, 14]} /><meshBasicMaterial color="#0F172A" transparent opacity={0.22} /></mesh>
      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.085, 0.20, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow><capsuleGeometry args={[0.056, 0.10, 5, 8]} /><meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.45} /></mesh>
          <mesh position={[0, -0.15, 0.025]} scale={[1.05, 0.75, 1.35]}><sphereGeometry args={[0.058, 8, 8]} /><meshStandardMaterial color={isFemale ? '#9F1239' : '#18181B'} roughness={0.35} /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.20, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow><capsuleGeometry args={[0.056, 0.10, 5, 8]} /><meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.45} /></mesh>
          <mesh position={[0, -0.15, 0.025]} scale={[1.05, 0.75, 1.35]}><sphereGeometry args={[0.058, 8, 8]} /><meshStandardMaterial color={isFemale ? '#9F1239' : '#18181B'} roughness={0.35} /></mesh>
        </group>

        {isFemale ? (
          <group>
            <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.13, 0.115, 0.22, 12]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
            <mesh position={[0, 0.50, 0]} scale={[1.15, 0.55, 0.90]}><sphereGeometry args={[0.135, 10, 8]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
            <mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.125, 0.24, 0.22, 14]} /><meshStandardMaterial color={pantsColor || shirtColor} roughness={0.45} /></mesh>
            <mesh position={[0, 0.51, 0.10]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.06, 0.016, 5, 10]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.37, 0]} scale={[1.22, 0.95, 0.92]} castShadow><capsuleGeometry args={[0.145, 0.14, 6, 12]} /><meshStandardMaterial color={shirtColor} roughness={0.40} /></mesh>
            <mesh position={[0, 0.49, 0.115]} rotation={[0.15, 0, 0]}><coneGeometry args={[0.05, 0.10, 3]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          </group>
        )}

        <group ref={leftArmRef} position={[-0.20, 0.47, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow><capsuleGeometry args={[0.048, 0.13, 5, 8]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
          <mesh position={[0, -0.19, 0]}><sphereGeometry args={[0.052, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.35} /></mesh>
        </group>
        <group ref={rightArmRef} position={[0.20, 0.47, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow><capsuleGeometry args={[0.048, 0.13, 5, 8]} /><meshStandardMaterial color={shirtColor} roughness={0.42} /></mesh>
          <mesh position={[0, -0.19, 0]}><sphereGeometry args={[0.052, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.35} /></mesh>
        </group>

        <group ref={headGroupRef} position={[0, 0.76, 0]}>
          <mesh scale={[1.08, 1.0, 1.04]} castShadow><sphereGeometry args={[0.228, 14, 14]} /><meshStandardMaterial color={skinColor} roughness={0.34} /></mesh>
          <mesh position={[-0.23, -0.01, 0]}><sphereGeometry args={[0.044, 6, 6]} /><meshStandardMaterial color={skinColor} roughness={0.38} /></mesh>
          <mesh position={[0.23, -0.01, 0]}><sphereGeometry args={[0.044, 6, 6]} /><meshStandardMaterial color={skinColor} roughness={0.38} /></mesh>

          <CharacterHairStyle6F style={hairStyle || (isFemale ? 'bob' : 'short')} hairColor={hairColor} />

          {hasSunglasses ? (
            <group position={[0, 0.01, 0.225]}>
              <RoundedBox args={[0.145, 0.082, 0.025]} position={[-0.082, 0, 0]} radius={0.025}><meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.5} /></RoundedBox>
              <RoundedBox args={[0.145, 0.082, 0.025]} position={[0.082, 0, 0]} radius={0.025}><meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.5} /></RoundedBox>
            </group>
          ) : isPraying ? (
            <group position={[0, -0.005, 0.226]}>
              <mesh position={[-0.082, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.028, 0.006, 5, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.082, 0, 0]} rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.028, 0.006, 5, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : isHappyEyes ? (
            <group position={[0, -0.008, 0.226]}>
              <mesh position={[-0.082, 0, 0]}><torusGeometry args={[0.030, 0.0065, 5, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
              <mesh position={[0.082, 0, 0]}><torusGeometry args={[0.030, 0.0065, 5, 10, Math.PI]} /><meshBasicMaterial color="#18181B" /></mesh>
            </group>
          ) : (
            <group ref={eyesOpenGroupRef}>
              {[-0.082, 0.082].map((ex, ei) => (
                <group key={ei} position={[ex, -0.005, 0.222]}>
                  <mesh scale={[1.0, 1.15, 0.6]}><sphereGeometry args={[0.032, 8, 8]} /><meshBasicMaterial color="#18181B" /></mesh>
                  <mesh position={[0.010, 0.012, 0.016]}><sphereGeometry args={[0.011, 5, 5]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
                </group>
              ))}
            </group>
          )}

          <mesh position={[0, -0.028, 0.238]}><sphereGeometry args={[0.014, 6, 6]} /><meshStandardMaterial color="#FDBA74" /></mesh>
          <mesh position={[-0.132, -0.045, 0.198]} rotation={[0, -0.38, 0]} scale={[1.25, 0.85, 1]}><circleGeometry args={[0.032, 10]} /><meshBasicMaterial color="#FB7185" transparent opacity={isHappyEyes ? 0.78 : 0.58} /></mesh>
          <mesh position={[0.132, -0.045, 0.198]} rotation={[0, 0.38, 0]} scale={[1.25, 0.85, 1]}><circleGeometry args={[0.032, 10]} /><meshBasicMaterial color="#FB7185" transparent opacity={isHappyEyes ? 0.78 : 0.58} /></mesh>

          <group ref={mouthRef} position={[0, -0.062, 0.228]}>
            {isHappyEyes || isTalking ? (
              <mesh scale={[1.2, 0.9, 0.5]}><circleGeometry args={[0.022, 10, Math.PI, Math.PI]} /><meshBasicMaterial color="#E11D48" side={THREE.DoubleSide} /></mesh>
            ) : (
              <mesh rotation={[Math.PI, 0, 0]}><torusGeometry args={[0.022, 0.0045, 5, 10, Math.PI]} /><meshBasicMaterial color="#E11D48" /></mesh>
            )}
          </group>
        </group>

        {nameTagTexture && <Billboard position={[0, 1.28, 0]}><mesh renderOrder={12}><planeGeometry args={[1.52, 0.34]} /><meshBasicMaterial map={nameTagTexture} transparent depthTest={false} /></mesh></Billboard>}
        {bubbleData && <Billboard position={[0, 1.58, 0]}><mesh renderOrder={15}><planeGeometry args={[bubbleData.planeW, bubbleData.planeH]} /><meshBasicMaterial map={bubbleData.tex} transparent depthTest={false} /></mesh></Billboard>}
      </group>
    </group>
  );
}

function RemoteMultiplayerAvatar6F({ peer, onClickPeer }) {
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
    <SmoothChibiAvatar6F
      position={[peer.x || 0, 0, peer.z || 3.6]}
      targetPosition={[peer.x || 0, 0, peer.z || 3.6]}
      rotationY={peer.rotY || Math.PI}
      gender={peer.avatar?.gender || 'male'}
      hairStyle={peer.avatar?.hairStyle || 'parted'}
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
// 🧸 교육관 전용 교구 & 가구 (경량 세그먼트 + 고도화 디테일)
// =====================================================================
function DetailedChair({ position, rotationY = 0, seatColor = '#38BDF8', legColor = '#CBD5E1', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow><cylinderGeometry args={[0.20, 0.19, 0.06, 14]} /><meshStandardMaterial color={seatColor} roughness={0.4} /></mesh>
      <RoundedBox args={[0.38, 0.26, 0.055]} position={[0, 0.52, 0.16]} rotation={[0.12, 0, 0]} radius={0.07} castShadow><meshStandardMaterial color={seatColor} roughness={0.4} /></RoundedBox>
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.16, lz]}><cylinderGeometry args={[0.015, 0.012, 0.32, 8]} /><meshStandardMaterial color={legColor} metalness={0.75} roughness={0.2} /></mesh>
      ))}
    </group>
  );
}

function PlushTeddyBear6F({ position, rotationY = 0, scale = 1.0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.22, 0]} scale={[1.0, 1.1, 0.9]} castShadow><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color="#B45309" roughness={0.75} /></mesh>
      <mesh position={[0, 0.21, 0.13]} scale={[0.85, 0.95, 0.4]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color="#FEF3C7" /></mesh>
      <group position={[0, 0.46, 0]}>
        <mesh castShadow><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#B45309" roughness={0.75} /></mesh>
        {[-0.12, 0.12].map((ex, ei) => (<mesh key={ei} position={[ex, 0.12, -0.02]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#92400E" /></mesh>))}
        <mesh position={[0, -0.03, 0.13]} scale={[1.1, 0.85, 0.7]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#FEF3C7" /></mesh>
        <mesh position={[0, -0.01, 0.17]}><sphereGeometry args={[0.018, 6, 6]} /><meshBasicMaterial color="#18181B" /></mesh>
      </group>
      <mesh position={[0, 0.34, 0.14]}><sphereGeometry args={[0.03, 6, 6]} /><meshStandardMaterial color="#EF4444" /></mesh>
      {[-0.18, 0.18].map((ax, ai) => (<mesh key={ai} position={[ax, 0.25, 0.04]} rotation={[0.4, 0, ai === 0 ? 0.5 : -0.5]}><capsuleGeometry args={[0.045, 0.10, 5, 8]} /><meshStandardMaterial color="#B45309" /></mesh>))}
      {[-0.11, 0.11].map((lx, li) => (<mesh key={li} position={[lx, 0.08, 0.14]} rotation={[Math.PI / 2, 0, li === 0 ? 0.25 : -0.25]}><capsuleGeometry args={[0.052, 0.12, 5, 8]} /><meshStandardMaterial color="#B45309" /></mesh>))}
    </group>
  );
}

function MontessoriRingStacker6F({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.15, 0.04, 12]} /><meshStandardMaterial color="#FDE68A" /></mesh>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.02, 0.02, 0.32, 8]} /><meshStandardMaterial color="#D97706" /></mesh>
      {[[0.06, 0.11, '#EF4444'], [0.11, 0.095, '#F97316'], [0.16, 0.08, '#FACC15'], [0.21, 0.065, '#22C55E'], [0.26, 0.05, '#38BDF8']].map(([ry, rad, col], idx) => (
        <mesh key={idx} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[rad, 0.026, 8, 14]} /><meshStandardMaterial color={col} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 0.33, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#A855F7" /></mesh>
    </group>
  );
}

function NoahArkToyModel6F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.14, 0]} scale={[1.35, 0.55, 0.65]} castShadow><sphereGeometry args={[0.28, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#92400E" side={THREE.DoubleSide} /></mesh>
      <RoundedBox args={[0.42, 0.18, 0.24]} position={[0, 0.22, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FDE68A" /></RoundedBox>
      <mesh position={[0, 0.36, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.4, 0.7, 0.85]}><coneGeometry args={[0.24, 0.18, 4]} /><meshStandardMaterial color="#DC2626" /></mesh>
    </group>
  );
}

function ClassroomGlobe6F({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]}><cylinderGeometry args={[0.07, 0.09, 0.03, 10]} /><meshStandardMaterial color="#475569" metalness={0.7} /></mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0.35]}><torusGeometry args={[0.115, 0.008, 6, 14, Math.PI]} /><meshStandardMaterial color="#CBD5E1" metalness={0.8} /></mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0.2, 0.5, -0.2]} castShadow><sphereGeometry args={[0.095, 12, 12]} /><meshStandardMaterial color="#0284C7" roughness={0.35} /></mesh>
    </group>
  );
}

function DetailedMiniatureToilet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.14, 0.04]} castShadow><cylinderGeometry args={[0.14, 0.10, 0.28, 12]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.26, 0.06]} scale={[1.0, 0.55, 1.25]}><sphereGeometry args={[0.15, 12, 10]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.295, 0.07]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.095, 10]} /><meshBasicMaterial color="#BAE6FD" /></mesh>
      <mesh position={[0, 0.31, 0.07]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.125, 0.026, 8, 14]} /><meshStandardMaterial color="#F8FAFC" /></mesh>
      <RoundedBox args={[0.32, 0.36, 0.15]} position={[0, 0.46, -0.14]} radius={0.035} castShadow><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
      <RoundedBox args={[0.06, 0.02, 0.02]} position={[-0.17, 0.56, -0.10]} radius={0.005}><meshStandardMaterial color="#CBD5E1" metalness={0.9} /></RoundedBox>
    </group>
  );
}

function KidsIndoorSlideSet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.24, 0.24].map((sx, i) => (
        <group key={i} position={[sx, 0.34, -0.25]}>
          <RoundedBox args={[0.05, 0.62, 0.56]} radius={0.025} castShadow><meshStandardMaterial color="#34D399" roughness={0.35} /></RoundedBox>
          <mesh position={[0, 0.28, 0]} scale={[0.3, 1.0, 1.2]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#6EE7B7" /></mesh>
        </group>
      ))}
      <RoundedBox args={[0.46, 0.06, 0.44]} position={[0, 0.52, -0.25]} radius={0.02}><meshStandardMaterial color="#FEF08A" /></RoundedBox>
      {[0, 1, 2].map((st) => (<RoundedBox key={st} args={[0.42, 0.06, 0.14]} position={[0, 0.14 + st * 0.14, -0.68 + st * 0.14]} radius={0.015}><meshStandardMaterial color={st % 2 === 0 ? '#38BDF8' : '#F472B6'} /></RoundedBox>))}
      <group position={[0, 0.27, 0.32]} rotation={[0.58, 0, 0]}>
        <RoundedBox args={[0.42, 0.05, 0.96]} radius={0.02} castShadow><meshStandardMaterial color="#FACC15" roughness={0.25} /></RoundedBox>
        {[-0.21, 0.21].map((rx, ri) => (<RoundedBox key={ri} args={[0.045, 0.12, 0.96]} position={[rx, 0.05, 0]} radius={0.02}><meshStandardMaterial color="#FB7185" /></RoundedBox>))}
      </group>
    </group>
  );
}

function KidsRockingHorse({ position, rotationY = 0 }) {
  const horseRef = useRef();
  useFrame(({ clock }) => { if (horseRef.current) horseRef.current.rotation.x = Math.sin(clock.elapsedTime * 3.0) * 0.10; });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={horseRef}>
        {[-0.12, 0.12].map((rx, i) => (<RoundedBox key={i} args={[0.04, 0.05, 0.68]} position={[rx, 0.04, 0]} radius={0.02}><meshStandardMaterial color="#F59E0B" /></RoundedBox>))}
        <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><capsuleGeometry args={[0.09, 0.22, 6, 10]} /><meshStandardMaterial color="#38BDF8" /></mesh>
        <RoundedBox args={[0.16, 0.04, 0.16]} position={[0, 0.33, -0.02]} radius={0.015}><meshStandardMaterial color="#F43F5E" /></RoundedBox>
        <mesh position={[0, 0.38, 0.16]} rotation={[-0.35, 0, 0]}><capsuleGeometry args={[0.065, 0.16, 6, 10]} /><meshStandardMaterial color="#38BDF8" /></mesh>
        <mesh position={[0, 0.48, 0.24]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.06, 0.10, 6, 10]} /><meshStandardMaterial color="#BAE6FD" /></mesh>
      </group>
    </group>
  );
}

function AnimatedStainlessElevator6F({ position, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#AD6E2F'), []);

  useEffect(() => () => { steelTex.dispose(); mirrorTex.dispose(); oakTex.dispose(); }, [steelTex, mirrorTex, oakTex]);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const isOpen = forceOpen || Math.hypot(px - position[0], pz - (position[2] - 0.8)) < 2.0;
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
      </group>
      <group position={[0, 1.02, 0.04]}>
        <RoundedBox ref={leftDoorRef} args={[0.67, 2.02, 0.05]} position={[-0.34, 0, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} /></RoundedBox>
        <RoundedBox ref={rightDoorRef} args={[0.67, 2.02, 0.05]} position={[0.34, 0, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} /></RoundedBox>
      </group>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[-0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[0.28, 2.28, 0.24]} position={[0.82, 1.14, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.25]} position={[0, 2.15, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} /></RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[-1.32, 1.14, 0.02]} radius={0.015}><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></RoundedBox>
      <RoundedBox args={[0.75, 2.28, 0.20]} position={[1.32, 1.14, 0.02]} radius={0.015}><meshStandardMaterial color="#F8FAFC" roughness={0.3} /></RoundedBox>
      {showRoomSigns && <Billboard position={[0, 2.55, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signTex} transparent /></mesh></Billboard>}
    </group>
  );
}

function CompactUStairwell6F({ position, onClickStairs, onClickExtinguisher }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.7, 2.9]} /><meshStandardMaterial color="#CBD5E1" roughness={0.5} /></mesh>
      <RoundedBox args={[0.85, 0.48, 2.7]} position={[-1.35, 0.24, 0]} radius={0.02}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          <RoundedBox args={[0.32, 0.08 + i * 0.07, 1.1]} position={[0.65 - i * 0.30, (0.08 + i * 0.07) / 2, -0.68]} radius={0.01} onClick={(e) => { e.stopPropagation(); if (onClickStairs) onClickStairs(); }}><meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#CBD5E1'} /></RoundedBox>
          <RoundedBox args={[0.32, 0.45 - i * 0.07, 1.1]} position={[-0.85 + i * 0.30, (0.45 - i * 0.07) / 2, 0.68]} radius={0.01} onClick={(e) => { e.stopPropagation(); if (onClickStairs) onClickStairs(); }}><meshStandardMaterial color={i % 2 === 0 ? '#E2E8F0' : '#94A3B8'} /></RoundedBox>
        </React.Fragment>
      ))}
      <RoundedBox args={[1.95, 0.06, 0.06]} position={[-0.1, 0.78, 0]} radius={0.02}><meshStandardMaterial color="#78350F" /></RoundedBox>
      <group position={[1.45, 0, -1.1]} onClick={(e) => { e.stopPropagation(); if (onClickExtinguisher) onClickExtinguisher(); }}>
        <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.09, 0.09, 0.42, 10]} /><meshStandardMaterial color="#EF4444" /></mesh>
        <mesh position={[0, 0.46, 0]}><cylinderGeometry args={[0.03, 0.04, 0.06, 8]} /><meshStandardMaterial color="#18181B" /></mesh>
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 6층 전체 교육관 디오라마
// =====================================================================
function SixFloorMasterpieceDiorama({
  activeZoneId, onSelectZone, onSitOnSeat, onOpenWorshipTv, onSelectNpcForChat,
  worshipVideoTitle, activeNpcChatIdx, showRoomSigns, playerIdxRef, isElevatorModalOpen,
  remotePeers, onSelectRemotePeer, holyLightEvent
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const lightWoodFloorTex = useMemo(() => makeWoodGrainTexture('#E6CBA8', '#C8A273'), []);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const puzzleMatTex = useMemo(() => makePuzzleMatTexture(), []);
  const kidsBooksTex = useMemo(() => makeKidsBookshelfTexture6F(), []);
  const greyRestroomTileTex = useMemo(() => makeTileGridTexture('#8E939B', '#6C717A', 8), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);

  const elemScreenTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0284C7'); grad.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FDE047'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#FEF08A'; ctx.font = '900 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GOOD TREE SUNDAY SCHOOL · LIVE', w / 2, 60);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 34px sans-serif'; ctx.fillText(worshipVideoTitle || '다윗처럼 믿음으로 승리해요!', w / 2, 130);
    ctx.fillStyle = '#BAE6FD'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('▶ 스크린 클릭 시 다음세대·매일예배 유튜브 영상 재생', w / 2, 194);
  }, 512, 240), [worshipVideoTitle]);

  const signs = useMemo(() => ({
    newFamily: makeRoomSignTexture('새가족반 라운지', '스페셜티 카페 · 최수경 목사 축도', '#8B5CF6'),
    elemRight: makeRoomSignTexture('초등부 본관 🏫', '클릭 시 말씀 유튜브 영상 재생', '#0284C7'),
    elemLeft: makeRoomSignTexture('초등부 분반실', '모둠 원탁 · 이젤 · 지구본 교구', '#2563EB'),
    kinder: makeRoomSignTexture('유치부 🎨', '무지개 무대 · 꽃잎 원탁 · 방주모형', '#EC4899'),
    infant: makeRoomSignTexture('유아부 👶', '구름 미끄럼틀 · 볼풀 · 테디베어', '#F59E0B'),
    restroom: makeRoomSignTexture('화장실 🚻', '큐비클 부스 · 핸드드라이어 · 세면대', '#64748B'),
    elevator: makeRoomSignTexture('6F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~7F) 이동', '#10B981')
  }), []);

  useEffect(() => () => {
    [oakWoodTex, lightWoodFloorTex, steelTex, puzzleMatTex, kidsBooksTex, greyRestroomTileTex, mirrorTex, elemScreenTex].forEach((t) => t.dispose());
    Object.values(signs).forEach((t) => t.dispose());
  }, [oakWoodTex, lightWoodFloorTex, steelTex, puzzleMatTex, kidsBooksTex, greyRestroomTileTex, mirrorTex, elemScreenTex, signs]);

  return (
    <group>
      <RoundedBox args={[14.4, 0.2, 13.8]} position={[0, -0.1, 0]} radius={0.02} receiveShadow><meshStandardMaterial color="#475569" roughness={0.65} /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 0.2]} receiveShadow><planeGeometry args={[5.8, 9.6]} /><meshStandardMaterial color="#525E6E" roughness={0.55} /></mesh>

      {/* 방 1: 상단 새가족반 카페 라운지 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.0, 0.008, -5.65]} receiveShadow><planeGeometry args={[9.4, 1.9]} /><meshStandardMaterial map={lightWoodFloorTex} roughness={0.4} /></mesh>
        {[-3.8, -1.1].map((tx, idx) => (
          <group key={`nf_${idx}`} position={[tx, 0, -5.65]}>
            <RoundedBox args={[1.60, 0.055, 0.82]} position={[0, 0.58, 0]} radius={0.08} castShadow receiveShadow><meshStandardMaterial map={oakWoodTex} roughness={0.28} /></RoundedBox>
            {[-0.55, 0.55].map((lx, li) => (<mesh key={li} position={[lx, 0.29, 0]}><cylinderGeometry args={[0.035, 0.035, 0.56, 10]} /><meshStandardMaterial color="#CBD5E1" metalness={0.8} /></mesh>))}
            <group position={[0, 0.61, 0]}>
              <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.12, 0.02, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
              <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.09, 0.09, 0.07, 10]} /><meshStandardMaterial color="#F43F5E" /></mesh>
              <mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#E0F2FE" transparent opacity={0.45} /></mesh>
            </group>
            <DetailedChair position={[-0.44, 0, -0.54]} rotationY={Math.PI} seatColor="#A78BFA" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx - 0.44, z: -5.65 - 0.54, rotY: 0, rowLabel: '새가족반 환영석' }); }} />
            <DetailedChair position={[0.44, 0, -0.54]} rotationY={Math.PI} seatColor="#A78BFA" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx + 0.44, z: -5.65 - 0.54, rotY: 0, rowLabel: '새가족반 환영석' }); }} />
            <DetailedChair position={[-0.44, 0, 0.54]} rotationY={0} seatColor="#818CF8" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx - 0.44, z: -5.65 + 0.54, rotY: Math.PI, rowLabel: '새가족반 환영석' }); }} />
            <DetailedChair position={[0.44, 0, 0.54]} rotationY={0} seatColor="#818CF8" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: tx + 0.44, z: -5.65 + 0.54, rotY: Math.PI, rowLabel: '새가족반 환영석' }); }} />
          </group>
        ))}

        <group position={[1.65, 0, -5.85]}>
          <RoundedBox args={[1.38, 0.78, 0.56]} position={[0, 0.39, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.2} /></RoundedBox>
          <RoundedBox args={[1.44, 0.05, 0.62]} position={[0, 0.80, 0]} radius={0.015}><meshStandardMaterial map={steelTex} metalness={0.9} roughness={0.16} /></RoundedBox>
          <RoundedBox args={[0.46, 0.38, 0.34]} position={[-0.32, 1.01, 0]} radius={0.05}><meshStandardMaterial color="#18181B" metalness={0.5} /></RoundedBox>
        </group>

        <RoundedBox args={[5.4, 1.25, 0.16]} position={[-4.1, 0.62, -4.7]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
        <RoundedBox args={[2.0, 1.25, 0.16]} position={[1.8, 0.62, -4.7]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
        {showRoomSigns && <Billboard position={[-0.2, 1.65, -4.7]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.newFamily} transparent /></mesh></Billboard>}
      </group>

      {/* 방 2: 좌측 상단 초등부 분반실 (동화책등 텍스처 서가 적용) */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.008, -2.0]} receiveShadow><planeGeometry args={[3.7, 5.0]} /><meshStandardMaterial color="#DBEAFE" roughness={0.5} /></mesh>
        <group position={[-6.48, 0, -2.2]}>
          <RoundedBox args={[0.42, 1.45, 2.2]} position={[0, 0.72, 0]} radius={0.025} castShadow><meshStandardMaterial map={oakWoodTex} roughness={0.35} /></RoundedBox>
          <mesh position={[0.215, 0.74, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.08, 1.32]} />
            <meshStandardMaterial map={kidsBooksTex} roughness={0.6} />
          </mesh>
        </group>

        <group position={[-5.95, 0, -4.15]} rotation={[0, 0.45, 0]}>
          <RoundedBox args={[0.82, 0.64, 0.04]} position={[0, 0.92, 0]} rotation={[-0.12, 0, 0]} radius={0.02}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
          <RoundedBox args={[0.88, 0.70, 0.03]} position={[0, 0.92, -0.01]} rotation={[-0.12, 0, 0]} radius={0.02}><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
          {[-0.28, 0.28].map((lx, li) => (<mesh key={li} position={[lx, 0.46, 0]} rotation={[0.12, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.96, 6]} /><meshStandardMaterial map={oakWoodTex} /></mesh>))}
        </group>

        {[-3.2, -0.85].map((tz, i) => (
          <group key={`rg_${i}`} position={[-4.85, 0, tz]}>
            <mesh position={[0, 0.56, 0]} castShadow receiveShadow><cylinderGeometry args={[0.74, 0.74, 0.06, 20]} /><meshStandardMaterial color="#FEF08A" roughness={0.35} /></mesh>
            <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.10, 0.28, 0.54, 12]} /><meshStandardMaterial color="#CBD5E1" metalness={0.6} /></mesh>
            {i === 0 && <ClassroomGlobe6F position={[0, 0.59, 0]} />}
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, si) => {
              const cx = Math.cos(ang) * 0.98, cz = Math.sin(ang) * 0.98, chairRot = Math.atan2(cx, cz);
              return (
                <DetailedChair key={si} position={[cx, 0, cz]} rotationY={chairRot} seatColor={si % 2 === 0 ? '#38BDF8' : '#F472B6'} onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: -4.85 + cx, z: tz + cz, rotY: chairRot + Math.PI, rowLabel: '초등부 분반실 모둠석' }); }} />
              );
            })}
          </group>
        ))}
        {showRoomSigns && <Billboard position={[-3.0, 1.65, -1.5]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.elemLeft} transparent /></mesh></Billboard>}
      </group>

      {/* 방 3: 좌측 중단 유아부 키즈 놀이방 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.01, 1.85]} receiveShadow><planeGeometry args={[3.7, 2.4]} /><meshStandardMaterial map={puzzleMatTex} roughness={0.65} /></mesh>
        <KidsIndoorSlideSet position={[-4.05, 0, 1.65]} rotationY={-Math.PI / 2} />
        <KidsRockingHorse position={[-4.75, 0, 2.45]} rotationY={0.4} />
        <PlushTeddyBear6F position={[-3.65, 0, 2.55]} rotationY={-0.6} scale={0.95} />
        <MontessoriRingStacker6F position={[-5.15, 0, 1.15]} />

        <group position={[-5.85, 0, 1.55]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[0.64, 18]} /><meshStandardMaterial color="#E0F2FE" /></mesh>
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.13, 10, 20]} /><meshStandardMaterial color="#38BDF8" /></mesh>
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.11, 10, 20]} /><meshStandardMaterial color="#FDE047" /></mesh>
          {Array.from({ length: 14 }).map((_, bi) => {
            const r = ((bi * 37) % 45) / 100, ang = bi * 1.9;
            const bColors = ['#F43F5E', '#FACC15', '#4ADE80', '#A855F7', '#FB923C', '#38BDF8', '#FFFFFF'];
            return <mesh key={bi} position={[Math.cos(ang) * r, 0.10 + (bi % 3) * 0.05, Math.sin(ang) * r]}><sphereGeometry args={[0.085, 8, 8]} /><meshStandardMaterial color={bColors[bi % bColors.length]} /></mesh>;
          })}
        </group>

        <group position={[-5.65, 0, 2.78]}>
          <RoundedBox args={[1.45, 0.56, 0.34]} position={[0, 0.28, 0]} radius={0.025}><meshStandardMaterial color="#FEF9C3" /></RoundedBox>
          <mesh position={[0, 0.30, -0.175]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.34, 0.46]} /><meshStandardMaterial map={kidsBooksTex} /></mesh>
        </group>

        <RoundedBox args={[0.08, 1.75, 0.78]} position={[-3.0, 0.88, 2.45]} rotation={[0, 0.45, 0]} radius={0.015}><meshStandardMaterial color="#F59E0B" /></RoundedBox>
        {showRoomSigns && <Billboard position={[-3.0, 1.65, 1.4]}><mesh><planeGeometry args={[1.1, 0.50]} /><meshBasicMaterial map={signs.infant} transparent /></mesh></Billboard>}
      </group>

      {/* 방 4: 좌측 하단 계단실 */}
      <CompactUStairwell6F position={[-4.9, 0, 4.75]} onClickStairs={() => onSelectZone(ZONES_6F[1])} onClickExtinguisher={() => onSelectZone({ badge: '6F 소방안전', title: '🧯 6F 계단실 소화기', desc: '초기 진화용 분말 소화기입니다.' })} />

      {/* 방 5: 우측 상단 초등부 본관 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, -3.3]} receiveShadow><planeGeometry args={[3.9, 6.5]} /><meshStandardMaterial color="#E0F2FE" roughness={0.5} /></mesh>
        <group position={[4.8, 0, -5.65]}>
          <group position={[0, 1.52, -0.82]} onClick={(e) => { e.stopPropagation(); if (onOpenWorshipTv) onOpenWorshipTv(); }}>
            <RoundedBox args={[2.25, 1.08, 0.06]} radius={0.02} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial color="#0F172A" /></RoundedBox>
            <mesh position={[0, 0, 0.035]} userData={{ keepOpaque: true }}><planeGeometry args={[2.12, 0.96]} /><meshBasicMaterial map={elemScreenTex} /></mesh>
          </group>
          <RoundedBox args={[2.6, 0.10, 1.1]} position={[0, 0.05, 0]} radius={0.02}><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
          <RoundedBox args={[0.85, 0.18, 0.48]} position={[0, 0.19, -0.28]} radius={0.015}><meshStandardMaterial color="#991B1B" /></RoundedBox>
          <RoundedBox args={[0.86, 0.72, 0.46]} position={[0, 0.44, 0.15]} radius={0.025} castShadow><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
          <RoundedBox args={[0.98, 0.08, 0.54]} position={[0, 0.82, 0.15]} radius={0.02}><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
          <mesh position={[0, 0.48, 0.39]}><boxGeometry args={[0.04, 0.26, 0.015]} /><meshStandardMaterial color="#FDE047" metalness={0.8} /></mesh>
          <mesh position={[0, 0.53, 0.39]}><boxGeometry args={[0.16, 0.04, 0.015]} /><meshStandardMaterial color="#FDE047" metalness={0.8} /></mesh>
        </group>

        {[-4.3, -3.0, -1.7].map((dz, rIdx) =>
          [3.95, 5.65].map((dx, cIdx) => (
            <group key={`eld_${rIdx}_${cIdx}`} position={[dx, 0, dz]}>
              <RoundedBox args={[1.26, 0.05, 0.54]} position={[0, 0.58, 0]} radius={0.025} castShadow receiveShadow><meshStandardMaterial map={lightWoodFloorTex} roughness={0.32} /></RoundedBox>
              {[[-0.56, -0.22], [0.56, -0.22], [-0.56, 0.22], [0.56, 0.22]].map(([lx, lz], li) => (<mesh key={li} position={[lx, 0.29, lz]}><cylinderGeometry args={[0.02, 0.018, 0.58, 8]} /><meshStandardMaterial color="#64748B" metalness={0.7} /></mesh>))}
              <DetailedChair position={[-0.30, 0, 0.42]} rotationY={0} seatColor="#0284C7" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: dx - 0.30, z: dz + 0.42, rotY: Math.PI, rowLabel: `초등부 본관 ${rIdx + 1}열 좌석` }); }} />
              <DetailedChair position={[0.30, 0, 0.42]} rotationY={0} seatColor="#0284C7" onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: dx + 0.30, z: dz + 0.42, rotY: Math.PI, rowLabel: `초등부 본관 ${rIdx + 1}열 좌석` }); }} />
            </group>
          ))
        )}
        {showRoomSigns && <Billboard position={[2.8, 1.65, -2.0]}><mesh onClick={(e) => { e.stopPropagation(); if (onOpenWorshipTv) onOpenWorshipTv(); }}><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.elemRight} transparent /></mesh></Billboard>}
      </group>

      {/* 방 6: 우측 중단 유치부 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 1.4]} receiveShadow><planeGeometry args={[3.9, 2.7]} /><meshStandardMaterial color="#FCE7F3" roughness={0.5} /></mesh>
        <group position={[6.55, 0, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0.05, 0.35]}><cylinderGeometry args={[1.05, 1.05, 0.10, 20]} /><meshStandardMaterial color="#FDE047" /></mesh>
          {[[0.95, '#F43F5E'], [0.80, '#FACC15'], [0.65, '#4ADE80'], [0.50, '#38BDF8']].map(([rad, col], ri) => (
            <mesh key={ri} position={[0, 0.65, 0]}><torusGeometry args={[rad, 0.075, 8, 20, Math.PI]} /><meshStandardMaterial color={col} /></mesh>
          ))}
          <group position={[-0.95, 0, 0.55]} rotation={[0, 0.4, 0]}>
            <RoundedBox args={[0.78, 0.08, 0.28]} position={[0, 0.58, 0]} radius={0.015}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
            <RoundedBox args={[0.68, 0.02, 0.12]} position={[0, 0.625, 0.06]} radius={0.005}><meshStandardMaterial color="#18181B" /></RoundedBox>
          </group>
        </group>

        <NoahArkToyModel6F position={[5.65, 0.02, 0.35]} rotationY={-0.3} />

        <group position={[4.35, 0, 1.4]}>
          <mesh position={[0, 0.46, 0]} castShadow><cylinderGeometry args={[0.58, 0.58, 0.06, 20]} /><meshStandardMaterial color="#F472B6" roughness={0.35} /></mesh>
          {[0, 1, 2, 3, 4, 5].map((pi) => {
            const ang = (pi * Math.PI * 2) / 6;
            return <mesh key={pi} position={[Math.cos(ang) * 0.42, 0.46, Math.sin(ang) * 0.42]}><cylinderGeometry args={[0.34, 0.34, 0.06, 14]} /><meshStandardMaterial color="#F472B6" /></mesh>;
          })}
          <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.12, 0.28, 0.45, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          {[0, 1.05, 2.1, 3.14, 4.2, 5.25].map((ang, ki) => {
            const kx = Math.cos(ang) * 0.98, kz = Math.sin(ang) * 0.98, kRot = Math.atan2(kx, kz);
            const kCol = ['#FACC15', '#38BDF8', '#4ADE80', '#FB7185', '#A78BFA', '#FB923C'][ki];
            return <DetailedChair key={ki} position={[kx, 0, kz]} rotationY={kRot} seatColor={kCol} onClick={(e) => { e.stopPropagation(); onSitOnSeat({ x: 4.35 + kx, z: 1.4 + kz, rotY: kRot + Math.PI, rowLabel: '유치부 꽃모양 원탁석' }); }} />;
          })}
        </group>
        {showRoomSigns && <Billboard position={[2.8, 1.65, 1.3]}><mesh><planeGeometry args={[1.1, 0.50]} /><meshBasicMaterial map={signs.kinder} transparent /></mesh></Billboard>}
      </group>

      {/* 방 7: 우측 하단 고도화 화장실 */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 4.6]} receiveShadow><planeGeometry args={[3.9, 3.5]} /><meshStandardMaterial map={greyRestroomTileTex} roughness={0.32} /></mesh>
        <group position={[3.35, 0, 4.75]}>
          <RoundedBox args={[0.56, 0.72, 2.25]} position={[0, 0.36, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.38, 0.03, 2.05]} position={[0.02, 0.73, 0]} radius={0.01}><meshStandardMaterial color="#FACC15" /></RoundedBox>
          <RoundedBox args={[0.03, 0.82, 2.18]} position={[-0.26, 1.20, 0]} radius={0.01}><meshStandardMaterial color="#334155" /></RoundedBox>
          <mesh position={[-0.24, 1.20, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.12, 0.76]} /><meshBasicMaterial map={mirrorTex} /></mesh>
          <RoundedBox args={[0.16, 0.34, 0.28]} position={[-0.18, 1.05, -1.32]} radius={0.06}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
        </group>

        {[-0.55, 0.55].map((bx, bi) => (
          <React.Fragment key={`st_${bi}`}>
            <group position={[5.25 + bx, 0, 3.55]}>
              <RoundedBox args={[0.05, 1.52, 1.1]} position={[-0.52, 0.76, 0]} radius={0.01}><meshStandardMaterial color="#C8BFA8" /></RoundedBox>
              <group position={[0, 0.75, 0.52]} rotation={[0, 0.32, 0]}>
                <RoundedBox args={[0.82, 1.46, 0.04]} radius={0.01}><meshStandardMaterial color="#FAF8F5" /></RoundedBox>
                <RoundedBox args={[0.825, 0.10, 0.045]} position={[0, -0.05, 0]} radius={0.004}><meshStandardMaterial color="#CBD5E1" metalness={0.75} /></RoundedBox>
                <mesh position={[-0.22, 0.04, 0.025]}><circleGeometry args={[0.018, 8]} /><meshBasicMaterial color={bi === 0 ? '#22C55E' : '#EF4444'} /></mesh>
              </group>
              <DetailedMiniatureToilet position={[0, 0, -0.12]} rotationY={0} />
            </group>
            <group position={[5.25 + bx, 0, 5.65]}>
              <RoundedBox args={[0.05, 1.52, 1.1]} position={[-0.52, 0.76, 0]} radius={0.01}><meshStandardMaterial color="#C8BFA8" /></RoundedBox>
              <group position={[0, 0.75, -0.52]} rotation={[0, -0.32, 0]}>
                <RoundedBox args={[0.82, 1.46, 0.04]} radius={0.01}><meshStandardMaterial color="#FAF8F5" /></RoundedBox>
                <RoundedBox args={[0.825, 0.10, 0.045]} position={[0, -0.05, 0]} radius={0.004}><meshStandardMaterial color="#CBD5E1" metalness={0.75} /></RoundedBox>
                <mesh position={[-0.22, 0.04, -0.025]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.018, 8]} /><meshBasicMaterial color="#22C55E" /></mesh>
              </group>
              <DetailedMiniatureToilet position={[0, 0, 0.12]} rotationY={Math.PI} />
            </group>
          </React.Fragment>
        ))}
        {showRoomSigns && <Billboard position={[2.8, 1.65, 3.8]}><mesh><planeGeometry args={[1.1, 0.50]} /><meshBasicMaterial map={signs.restroom} transparent /></mesh></Billboard>}
      </group>

      {/* 엘리베이터 & 내벽/외벽 */}
      <AnimatedStainlessElevator6F position={[0, 0, 5.9]} playerIdxRef={playerIdxRef} forceOpen={isElevatorModalOpen} onClickElevator={() => onSelectZone(ZONES_6F[0])} signTex={signs.elevator} showRoomSigns={showRoomSigns} />

      <RoundedBox args={[0.16, 1.20, 2.3]} position={[-3.0, 0.60, -3.6]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.20, 2.4]} position={[-3.0, 0.60, 0.05]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 0.6]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 3.15]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[0.16, 1.20, 4.2]} position={[2.8, 0.60, -4.65]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.9]} position={[2.8, 0.60, -0.2]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.1]} position={[2.8, 0.60, 2.5]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 0.0]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 2.8]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>

      <SmartCutawayWall6F wallSide="north"><RoundedBox args={[14.4, 2.4, 0.24]} position={[0, 1.2, -6.7]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="west"><RoundedBox args={[0.24, 2.4, 13.6]} position={[-7.0, 1.2, 0]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="east"><RoundedBox args={[0.24, 2.4, 13.6]} position={[7.0, 1.2, 0]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall6F>

      {/* NPC · 원격 성도 · 홀리라이트 · 마커 */}
      {NPCS_6F.map((npc, idx) => (
        <SmoothChibiAvatar6F
          key={npc.id}
          position={[npc.x, npc.y || 0, npc.z]}
          patrolZ={npc.patrolZ || null}
          rotationY={npc.rotY || 0}
          isSeated={Boolean(npc.seated)}
          isChild={Boolean(npc.isChild)}
          emote={holyLightEvent && holyLightEvent.pastorName === npc.name ? 'bless' : null}
          gender={npc.gender}
          hairStyle={npc.hairStyle}
          isSkirt={Boolean(npc.isSkirt)}
          autoWave={Boolean(npc.autoWave)}
          shirtColor={npc.shirt}
          pantsColor={npc.pants}
          hairColor={npc.hair}
          speechBubbleText={idx === activeNpcChatIdx % NPCS_6F.length && npc.dialogues?.length > 0 ? `${npc.name}: ${npc.dialogues[activeNpcChatIdx % npc.dialogues.length]}` : null}
          seedOffset={idx * 1.5}
          onClick={(e) => { e.stopPropagation(); if (onSelectNpcForChat) onSelectNpcForChat(npc); }}
        />
      ))}

      {(remotePeers || []).map((peer) => <RemoteMultiplayerAvatar6F key={peer.clientId} peer={peer} onClickPeer={onSelectRemotePeer} />)}
      {holyLightEvent && <HolyLightBeamEffect6F targetPos={holyLightEvent.targetPos} pastorName={holyLightEvent.pastorName} targetName={holyLightEvent.targetName} />}

      {ZONES_6F.map((z) => (
        <HologramMarker6F key={z.id} zone={z} isSelected={activeZoneId === z.id} onSelect={(sel) => { if (sel.isTvZone && onOpenWorshipTv) onOpenWorshipTv(); else onSelectZone(sel); }} />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 모바일 최적화 플레이어 컨트롤러 (useFrame 내 setState 병목 제거!)
// =====================================================================
function PlayerController6F({
  waypoints, playerIdxRef, seatedInfo, playerName, playerOffice, avatarConfig,
  emote, myChatBubble, controlsRef, followCamEnabled, onPositionUpdate
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
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 35px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
        controlsRef.current.target.lerp(new THREE.Vector3(seatedInfo.x, 0.85, seatedInfo.z - 0.5), delta * 4.5);
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
      const [nx, nz] = resolveCollision6F(cx + (dx / dist) * step, cz + (dz / dist) * step);
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
    <group ref={playerGroupRef} position={[0.0, 0, 3.6]} rotation={[0, Math.PI, 0]}>
      <SmoothChibiAvatar6F
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

function InitialCameraSetup6F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    camera.position.set(0, isMobile ? 14.5 : 11.8, isMobile ? 13.5 : 11.2);
    camera.fov = isMobile ? 42 : 36;
    camera.updateProjectionMatrix();
    if (controlsRef.current) { controlsRef.current.target.set(0, 0.4, 0.2); controlsRef.current.update(); }
  }, [size.width, camera, controlsRef]);
  return null;
}

export default function Education6F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const dailyData = useAppStore((state) => state.dailyData);
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false), []);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer6f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([0.0, 0, 3.6]);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  const [avatarConfig] = useState(() => {
    try { const saved = localStorage.getItem('gtc_metaverse_avatar_v1'); return saved ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(saved) } : DEFAULT_AVATAR_CONFIG; }
    catch { return DEFAULT_AVATAR_CONFIG; }
  });

  const [worshipVideo, setWorshipVideo] = useState(() => getSyncedWorshipVideo6F(dailyData));
  const [isTvPlaying, setIsTvPlaying] = useState(false);

  useEffect(() => {
    const syncVideo = () => setWorshipVideo(getSyncedWorshipVideo6F(dailyData));
    syncVideo();
    window.addEventListener('storage', syncVideo);
    return () => window.removeEventListener('storage', syncVideo);
  }, [dailyData]);

  const [waypoints, setWaypoints] = useState([[0.0, 3.6]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_6F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [followCamEnabled, setFollowCamEnabled] = useState(true);

  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);
  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showTopTools, setShowTopTools] = useState(!isMobile);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(!isMobile);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_6F.length), 4200);
    return () => { clearInterval(timer); togglePraiseBgm6F(false); };
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
    const channel = supabase.channel('metaverse_edu_6f', { config: { presence: { key: clientIdRef.current } } });
    channelRef.current = channel;
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const peers = [];
        Object.keys(state).forEach((key) => { if (key !== clientIdRef.current && state[key]?.length) peers.push(state[key][state[key].length - 1]); });
        setRemotePeers(peers);
      })
      .on('broadcast', { event: 'holy_blessing_6f' }, ({ payload }) => {
        if (!payload) return;
        playHolyBlessingSound();
        setHolyLightEvent(payload);
        setTimeout(() => setHolyLightEvent(null), 7000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const [px, , pz] = playerIdxRef.current;
          await channel.track({ clientId: clientIdRef.current, name: playerName, office: playerOffice, x: px, z: pz, rotY: Math.PI, seated: false, emote: null, chatMsg: '', avatar: avatarConfig, ts: Date.now() });
        }
      });
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [playerName, playerOffice, avatarConfig]);

  const triggerSocialAction = useCallback((emoteType, chatText = '') => {
    setEmote(emoteType);
    if (chatText) setMyChatBubble(chatText);
    broadcastMyState({ emote: emoteType, chatMsg: chatText });
    setTimeout(() => { setEmote(null); broadcastMyState({ emote: null, chatMsg: chatText }); }, 4000);
    if (chatText) setTimeout(() => { setMyChatBubble(''); broadcastMyState({ emote: null, chatMsg: '' }); }, 5500);
  }, [broadcastMyState]);

  const triggerHolyBenediction6F = useCallback((pastorDisplayName, targetDisplayName, targetCoords) => {
    const eventPayload = { pastorName: pastorDisplayName, targetName: targetDisplayName, targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]], ts: Date.now() };
    playHolyBlessingSound();
    setHolyLightEvent(eventPayload);
    triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 다음세대·새가족 축도를 감사히 받습니다 🙏`);
    channelRef.current?.send({ type: 'broadcast', event: 'holy_blessing_6f', payload: eventPayload }).catch(() => {});
    setTimeout(() => setHolyLightEvent(null), 7000);
  }, [triggerSocialAction]);

  const handleSitOnSeat = useCallback((seatData) => { setSeatedInfo(seatData); setWaypoints([[seatData.x, seatData.z]]); setTimeout(() => broadcastMyState(), 100); }, [broadcastMyState]);
  const handleStandUp = useCallback(() => { setSeatedInfo(null); setTimeout(() => broadcastMyState(), 100); }, [broadcastMyState]);
  const handleWalkTo = useCallback((tx, tz) => { if (seatedInfo) setSeatedInfo(null); const [sx, , sz] = playerIdxRef.current; setWaypoints(computePath6F(sx, sz, tx, tz)); }, [seatedInfo]);
  const handleSelectNpcForChat = useCallback((npc) => { setChatReplyText((npc.dialogues && npc.dialogues[0]) || '할렐루야! 6층 다음세대 교육관에 오신 것을 환영합니다 😊'); setSelectedChatNpc(npc); triggerSocialAction('wave'); }, [triggerSocialAction]);

  useEffect(() => {
    if (!isMapDrawerOpen) return;
    const mini = minimapRef.current; if (!mini) return;
    const ctx = mini.getContext('2d'); const w = mini.width, h = mini.height;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#1E2026'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4C1D95'; ctx.fillRect(8, 6, 62, 16);
    ctx.fillStyle = '#0369A1'; ctx.fillRect(72, 6, 34, 42);
    ctx.fillStyle = '#1D4ED8'; ctx.fillRect(8, 24, 28, 30);
    ctx.fillStyle = '#B45309'; ctx.fillRect(8, 56, 28, 16);
    ctx.fillStyle = '#9D174D'; ctx.fillRect(72, 50, 34, 18);
    ctx.fillStyle = '#059669'; ctx.fillRect(42, 76, 24, 14);
    const [cx, , cz] = playerIdxRef.current;
    ctx.beginPath(); ctx.arc(((cx + 7) / 14) * w, ((cz + 6.8) / 13.6) * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15'; ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handlePositionUpdate = useCallback((px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_6F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    setActiveZone((prev) => (prev?.id === found?.id ? prev : found));
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) { lastSyncTimeRef.current = now; broadcastMyState(); }
  }, [broadcastMyState]);

  const darkPillStyle = { backgroundColor: 'rgba(30, 32, 38, 0.92)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.16)' };

  return (
    <div translate="no" style={{ backgroundColor: '#2B2C30' }} className="notranslate w-full h-full relative overflow-hidden select-none font-sans">
      {/* 1. 슬림 상단 HUD */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[74vw]">
        <div className="flex items-center gap-1.5">
          <button onClick={onExitHome} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">◀ 6F 교육관·새가족</button>
          <span style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />{remotePeers.length + 1}명
          </span>
          <button onClick={() => setShowTopTools((v) => !v)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer">
            {showTopTools ? '▲ 접기' : '⚙️ 도구'}
          </button>
        </div>

        {showTopTools && (
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => setIsTvPlaying((p) => !p)} style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">📺 {isTvPlaying ? '영상 닫기' : '말씀 영상'}</button>
            <button onClick={() => triggerHolyBenediction6F('최수경 목사님', playerName, playerIdxRef.current)} style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">✨ 축도</button>
            <button onClick={() => { const n = !isMusicOn; setIsMusicOn(n); togglePraiseBgm6F(n); }} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{isMusicOn ? '🎵 끔' : '🔇 BGM'}</button>
            <button onClick={() => setFollowCamEnabled((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{followCamEnabled ? '🎥 추적' : '🎥 자유'}</button>
            <button onClick={() => setShowRoomSigns((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{showRoomSigns ? '🏷️ ON' : '🏷️ OFF'}</button>
          </div>
        )}
      </div>

      {/* 2. 우측 상단 미니맵 드로어 */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        <button onClick={() => setIsMapDrawerOpen((p) => !p)} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">
          {isMapDrawerOpen ? '✕ 닫기' : '🗺️ 6F 맵'}
        </button>

        {isMapDrawerOpen && (
          <div style={darkPillStyle} className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in">
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[36vh] overflow-y-auto hide-scrollbar">
              {ZONES_6F.map((z) => (
                <button key={z.id} onClick={() => {
                  const dest = z.roomTarget || [z.pos[0], z.pos[2]];
                  handleWalkTo(dest[0], dest[1]); setActiveZone(z);
                  if (z.isTvZone) setIsTvPlaying(true); else setModalZone(z);
                  setIsMapDrawerOpen(false);
                }} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold cursor-pointer truncate">
                  {z.badge}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. 유튜브 플레이어 */}
      {isTvPlaying && (
        <div style={{ backgroundColor: '#090D16', borderColor: '#38BDF8', color: '#FFFFFF' }} className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[460px] border-2 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-3 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-black text-sky-300 truncate">📺 6F 교육관 · {worshipVideo.title}</span>
            <button onClick={() => setIsTvPlaying(false)} className="text-xs font-bold text-zinc-400 cursor-pointer px-1">✕</button>
          </div>
          <div className="w-full aspect-video bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${worshipVideo.id}?autoplay=1&rel=0&playsinline=1`} title="6F Video" frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* 4. 하단 슬림 접이식 메뉴 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
        {showBottomDock ? (
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pointer-events-auto">
            <div style={darkPillStyle} className="p-1 rounded-xl border shadow-xl flex items-center gap-1 shrink-0">
              {[
                { label: '✋ 발표', emote: 'raise_hand', msg: '전도사님 저요 저요! ✋ 아멘!' },
                { label: '💃 율동', emote: 'dance', msg: '친구들과 신나게 찬양 율동해요! 💃🎶' },
                { label: '🙏 기도', emote: 'pray', msg: '다음세대 아이들에게 지혜를 주소서 🙏' },
                { label: '👋 환영', emote: 'wave', msg: '새가족반과 교육관에 오신 것을 환영해요 👋' }
              ].map((act, idx) => (
                <button key={idx} onClick={() => triggerSocialAction(act.emote, act.msg)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-sky-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer">
                  {act.label}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!quickChatInput.trim()) return; triggerSocialAction('raise_hand', quickChatInput.trim()); setQuickChatInput(''); }} style={darkPillStyle} className="flex items-center gap-1 px-2 py-1 rounded-xl border shadow-xl min-w-[180px] flex-1 max-w-xs">
              <input type="text" value={quickChatInput} onChange={(e) => setQuickChatInput(e.target.value)} placeholder="말풍선 대화..." className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400" />
              <button type="submit" className="px-2 py-1 rounded-lg bg-sky-500 text-stone-950 text-[10.5px] font-black cursor-pointer">전송</button>
            </form>
            <button onClick={() => setShowBottomDock(false)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer shrink-0">✕</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button onClick={() => setShowBottomDock(true)} style={darkPillStyle} className="px-3 py-1.5 rounded-full border shadow-xl text-xs font-black cursor-pointer">🏫 대화·모션 ▲</button>
            {seatedInfo && <button onClick={handleStandUp} className="px-3 py-1.5 rounded-full bg-amber-500 text-stone-950 text-xs font-black shadow-xl cursor-pointer">🚶 일어나기</button>}
          </div>
        )}
      </div>

      {/* 5. 모바일 최적화 메인 3D 캔버스 */}
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
        <PerspectiveCamera makeDefault position={[0, 11.8, 11.2]} fov={36} near={0.1} far={220} />
        <InitialCameraSetup6F controlsRef={controlsRef} />

        <ambientLight intensity={1.12} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 0.92]} />
        <directionalLight position={[-6, 14, 10]} intensity={1.32} color="#FFF7ED" castShadow shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]} shadow-bias={-0.0005} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={(e) => { e.stopPropagation(); handleWalkTo(e.point.x, e.point.z); }}>
          <planeGeometry args={[14.2, 13.6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SixFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => { const dest = z.roomTarget || [z.pos[0], z.pos[2]]; handleWalkTo(dest[0], dest[1]); setModalZone(z); }}
          onSitOnSeat={handleSitOnSeat}
          onOpenWorshipTv={() => setIsTvPlaying(true)}
          onSelectNpcForChat={handleSelectNpcForChat}
          worshipVideoTitle={worshipVideo.title}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController6F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          myChatBubble={myChatBubble}
          controlsRef={controlsRef}
          followCamEnabled={followCamEnabled}
          onPositionUpdate={handlePositionUpdate}
        />

        {!isMobile && <ContactShadows frames={1} resolution={256} position={[0, 0.01, 0]} opacity={0.32} scale={22} blur={2.0} far={4} />}
        <OrbitControls ref={controlsRef} enableRotate={true} enablePan={true} enableZoom={true} screenSpacePanning={true} enableDamping={true} dampingFactor={0.07} minDistance={3.0} maxDistance={32} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>

      {/* 6~8. 원격 성도 · NPC 대화 · 엘리베이터 층 이동 모달 */}
      {selectedRemotePeer && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedRemotePeer(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-sm border border-sky-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-bold text-sky-400 block">6층 다음세대 교육관 성도 교제</span><h3 className="text-base font-black">{selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})</h3></div>
              <button onClick={() => setSelectedRemotePeer(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { triggerSocialAction('raise_hand', `${selectedRemotePeer.name}님! 같이 손들고 아멘해요 ✋✨`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-xs font-black text-sky-200 cursor-pointer">✋ 같이 발표</button>
              <button onClick={() => { triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 👋`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">👋 인사하기</button>
              <button onClick={() => { triggerSocialAction('pray', `${selectedRemotePeer.name}님과 다음세대를 위해 기도합니다 🙏`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">🙏 중보기도</button>
              <button onClick={() => { triggerSocialAction('dance', `${selectedRemotePeer.name}님과 신나는 찬양 율동! 💃🎶`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">💃 함께 율동</button>
            </div>
            {canPlayerBless && (
              <button onClick={() => { triggerHolyBenediction6F(`${playerName} 목사님`, selectedRemotePeer.name, [selectedRemotePeer.x || 0, 0, selectedRemotePeer.z || 3.6]); setSelectedRemotePeer(null); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                ✨ [{selectedRemotePeer.name}] 성도에게 축도 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {selectedChatNpc && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setSelectedChatNpc(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10.5px] font-bold text-emerald-400 block">{selectedChatNpc.role}</span><h3 className="text-sm sm:text-base font-black">{selectedChatNpc.name}</h3></div>
              <button onClick={() => setSelectedChatNpc(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs leading-relaxed text-emerald-100">"{chatReplyText}"</div>
            {selectedChatNpc.canBless && (
              <button onClick={() => { const pn = selectedChatNpc.name; setSelectedChatNpc(null); triggerHolyBenediction6F(pn, playerName, playerIdxRef.current); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                ✨ [{selectedChatNpc.name}]께 다음세대·새가족 축도 받기 🙏
              </button>
            )}
            {selectedChatNpc.isPraiseOrWord && (
              <button onClick={() => { setSelectedChatNpc(null); setIsTvPlaying(true); }} className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-black text-xs cursor-pointer">📺 초등부·매일예배 유튜브 말씀 영상 켜기</button>
            )}
          </div>
        </div>
      )}

      {modalZone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setModalZone(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-stone-950 font-black text-xs">{modalZone.badge}</span>
              <button onClick={() => setModalZone(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <h3 className="text-base font-black">{modalZone.title}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{modalZone.desc}</p>
            {modalZone.schedule && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs flex justify-between">
                <span className="text-zinc-400 font-bold">모임 시간 및 위치</span>
                <span className="text-amber-300 font-black">{modalZone.schedule}</span>
              </div>
            )}
            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                {[
                  { fl: '1F', label: '1F 메인 로비 & 필로티 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 목양실 · 사무실' },
                  { fl: '3F', label: '3F 대예배당 본당' },
                  { fl: '4F', label: '4F 영유아 예배실 · 온돌 자모실' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반 (현재)' },
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
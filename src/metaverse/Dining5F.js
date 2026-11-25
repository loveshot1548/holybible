// src/metaverse/Dining5F.js (리얼 식당·조리실 고도화 · 전 층 동일 캐릭터/표정 · 모바일 최적화 완성본)
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
let sharedAudio5F = null;
function getAudio5F() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio5F) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudio5F = new AudioCtx();
  }
  if (sharedAudio5F && sharedAudio5F.state === 'suspended') {
    sharedAudio5F.resume().catch(() => {});
  }
  return sharedAudio5F;
}

const playElevatorDingSound = () => {
  try {
    const ctx = getAudio5F();
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
    const ctx = getAudio5F();
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

const playTrayServeSound = () => {
  try {
    const ctx = getAudio5F();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.05, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx * 0.09); osc.stop(now + idx * 0.09 + 0.25);
    });
  } catch (_) {}
};

// =====================================================================
// 🔗 유튜브 ID 추출 & 설교/찬양 듀얼 연동
// =====================================================================
const parseYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

const getSyncedSermonVideo = (storeDailyData = null) => {
  try {
    const directKeys = ['daily_worship_video_url', 'sermon_active_video_url', 'app_active_gisangogi_url', 'qt_active_video_url'];
    for (const key of directKeys) {
      const val = localStorage.getItem(key);
      if (val && parseYoutubeId(val)) {
        return { url: val, id: parseYoutubeId(val), title: localStorage.getItem('daily_worship_video_title') || '5F 소예배·말씀 라이브' };
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
          return { url: String(vUrl), id: parseYoutubeId(String(vUrl)), title: entry.sermonTitle || entry.qtTitle || entry.title || '주일 찬양 & 말씀 집회' };
        }
      }
    }
  } catch (_) {}
  return { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk', title: '기적이 상식이 되는 5일의 기도' };
};

const getSyncedPraiseVideo = (storeDailyData = null) => {
  try {
    const praiseUrl = localStorage.getItem('praise_active_video_url');
    if (praiseUrl && parseYoutubeId(praiseUrl)) {
      return { url: praiseUrl, id: parseYoutubeId(praiseUrl), title: localStorage.getItem('praise_active_video_title') || '좋은나무 찬양단 경배와 찬양' };
    }
    const synced = getSyncedSermonVideo(storeDailyData);
    if (synced && synced.id) return { ...synced, title: '좋은나무 찬양단 경배와 찬양' };
  } catch (_) {}
  return { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk', title: '좋은나무 찬양단 경배와 찬양' };
};

// =====================================================================
// 🎨 프로시저럴 텍스처 (오늘의 애찬 메뉴판 · 나뭇결 · 스틸 · 주방타일 · 거울)
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

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#A86B2D') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex; ctx.globalAlpha = 0.15;
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

function makeTileGridTexture(bgHex = '#F8FAFC', lineHex = '#CBD5E1', gridCount = 8) {
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

function makeCafeteriaMenuTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#1E293B'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D97706'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#FDE047'; ctx.font = '900 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🍲 오늘의 주일 애찬 메뉴', w / 2, 46);
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('흰쌀밥 · 소고기 미역국 · 간장 불고기', w / 2, 96);
    ctx.fillStyle = '#86EFAC'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('잡채 · 배추김치 · 계절 과일 (셀프 배식)', w / 2, 136);
  }, 480, 170);
}

function makeStudioMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE'); grad.addColorStop(0.5, '#FFFFFF'); grad.addColorStop(0.75, '#BAE6FD'); grad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'; ctx.lineWidth = 3;
    [w / 3, (w * 2) / 3].forEach((divX) => { ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, h); ctx.stroke(); });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    for (let x = -80; x < w + 80; x += 140) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0); ctx.lineTo(x - 52, h); ctx.lineTo(x - 90, h); ctx.closePath(); ctx.fill();
    }
  }, 256, 128);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#10B981') {
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
// 🪑 3줄 곡선 의자 18석 · 8대 인터랙션 존 · 충돌 · 네비게이션
// =====================================================================
const CURVED_CHAIRS_5F = (() => {
  const list = [];
  const centerX = 1.65, centerZ = -4.35;
  const rows = [{ r: 2.35, count: 5, label: '1열' }, { r: 3.35, count: 6, label: '2열' }, { r: 4.35, count: 7, label: '3열' }];
  rows.forEach((row, rIdx) => {
    for (let i = 0; i < row.count; i++) {
      const frac = row.count === 1 ? 0.5 : i / (row.count - 1);
      const angle = -0.56 + frac * 1.18;
      const cx = centerX + Math.sin(angle) * row.r;
      const cz = centerZ + Math.cos(angle) * row.r;
      const chairRotY = Math.atan2(cx - centerX, cz - centerZ);
      list.push({ id: `chair_${rIdx}_${i}`, x: cx, z: cz, chairRotY, rotY: chairRotY + Math.PI, rowLabel: `5F 소예배홀 ${row.label} ${i + 1}번 좌석` });
    }
  });
  return list;
})();

const ZONES_5F = [
  { id: 'zone_5f_elev', code: '01', subCode: '엘베', name: '5F 엘리베이터 홀', pos: [-0.2, 0, 4.7], isElevator: true, badge: '01 5F 엘리베이터', title: '🛗 5층 친교·찬양·사역관 엘리베이터', desc: '스테인리스 자동문이 열리며 1층~7층으로 이동합니다.' },
  { id: 'zone_5f_pulpit', code: '02', subCode: '강대상·TV', name: '미니 강대상 & TV', pos: [1.65, 0, -3.5], isTvZone: true, badge: '02 미니강대상·TV', title: '✝️ 5층 소예배홀 미니 강대상 & 대형 TV', desc: '실시간 예배·찬양 유튜브가 상영되는 대형 벽걸이 TV입니다.', actions: [{ label: '📝 예배노트', screen: 'sermon' }, { label: '🔥 오늘의 QT', screen: 'qt' }] },
  { id: 'zone_5f_band', code: '03', subCode: '드럼·피아노', name: '찬양단 악기석', pos: [4.6, 0, -3.3], isPraiseZone: true, badge: '03 드럼·전자피아노', title: '🥁 아크릴 드럼 부스 & 88건반 전자피아노', desc: '5기통 드럼 세트와 전자피아노가 갖춰진 찬양단 연주 공간입니다.' },
  { id: 'zone_5f_chairs', code: '04', subCode: '의자들', name: '곡선 의자들 (18석)', pos: [1.8, 0, -1.0], seatTarget: CURVED_CHAIRS_5F[7], isSeatZone: true, badge: '04 곡선 의자들', title: '🪑 3열 부채꼴 곡선 의자석', desc: '클릭하시면 정자세로 착석하며 전면 TV 영상이 자동 상영됩니다.' },
  { id: 'zone_5f_kitchen', code: '05', subCode: '조리실·배식대', name: '조리실 & 오픈 배식대', pos: [3.2, 0, 1.1], roomTarget: [3.6, 2.7], isServingZone: true, badge: '05 조리실·배식대', title: '🍲 주일 애찬 식당 & 오픈 배식대', desc: '오늘의 메뉴판, 스니즈가드, 3구 보온 바트, 보온 밥솥, 셀프 정수기, 퇴식구까지 완비된 애찬 식당입니다!' },
  { id: 'zone_5f_meeting', code: '06', subCode: '회의실·축도', name: '6인 회의실', pos: [-4.8, 0, -2.1], roomTarget: [-4.8, -2.1], badge: '06 회의실 (좌상단)', title: '📋 사역자·제직 6인 회의실', desc: '방희곤 목사님과 사역을 논의하는 회의실입니다.' },
  { id: 'zone_5f_dance', code: '07', subCode: '댄스연습실', name: '댄스연습실', pos: [-4.8, 0, 0.3], roomTarget: [-4.6, 0.3], isDanceZone: true, badge: '07 댄스연습실(거울)', title: '🪞 3연동 전신거울 워십·율동 댄스연습실', desc: '밝은 전신거울과 발레 바 앞에서 찬양 율동을 맞춰볼 수 있습니다.' },
  { id: 'zone_5f_rest_stairs', code: '08', subCode: '화장실·계단', name: '화장실 & 계단실', pos: [-2.2, 0, 3.2], isElevator: true, badge: '08 화장실·계단', title: '🚻 5층 화장실 & 계단실', desc: '큐비클 부스 2칸, 세면대, 핸드드라이어와 층간 이동 계단실입니다.' }
];

const SOLID_WALL_BOXES_5F = [
  { minX: -3.35, maxX: -2.85, minZ: -3.35, maxZ: -0.25 },
  { minX: -3.35, maxX: -2.85, minZ: 0.85, maxZ: 1.95 },
  { minX: -3.35, maxX: -2.85, minZ: 2.95, maxZ: 4.05 },
  { minX: -3.35, maxX: -2.85, minZ: 5.05, maxZ: 6.5 },
  { minX: -6.8, maxX: -5.35, minZ: -3.5, maxZ: -3.1 },
  { minX: -4.25, maxX: -3.0, minZ: -3.5, maxZ: -3.1 },
  { minX: -6.8, maxX: -4.25, minZ: -1.1, maxZ: -0.7 },
  { minX: -6.8, maxX: -3.0, minZ: 1.2, maxZ: 1.6 },
  { minX: -6.8, maxX: -3.0, minZ: 3.3, maxZ: 3.7 },
  { minX: 1.5, maxX: 6.8, minZ: 1.1, maxZ: 1.85 },
  { minX: 1.35, maxX: 1.85, minZ: 1.3, maxZ: 2.45 },
  { minX: 1.35, maxX: 1.85, minZ: 3.65, maxZ: 6.5 },
  { minX: -1.8, maxX: 1.4, minZ: 5.4, maxZ: 6.8 }
];

function resolveCollision5F(nx, nz, radius = 0.28) {
  let x = Math.max(-6.2, Math.min(6.2, nx));
  let z = Math.max(-5.2, Math.min(5.2, nz));
  for (const box of SOLID_WALL_BOXES_5F) {
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

function getRoomDoorInfo5F(x, z) {
  if (x < -3.1) {
    if (z < -3.3) return { room: 'hall', doorIn: null, doorOut: null };
    if (z < -0.9) return { room: 'meeting', doorIn: [-4.8, -2.5], doorOut: [-4.8, -4.1], via: [-2.0, -4.1] };
    if (z < 1.4) return { room: 'dance', doorIn: [-3.7, 0.3], doorOut: [-2.2, 0.3] };
    if (z < 3.5) return { room: 'restroom', doorIn: [-3.7, 2.45], doorOut: [-2.2, 2.45] };
    return { room: 'stairs', doorIn: [-3.7, 4.55], doorOut: [-2.2, 4.55] };
  }
  if (x > 1.6 && z > 1.4) return { room: 'kitchen', doorIn: [2.3, 3.05], doorOut: [0.6, 3.05] };
  return { room: 'hall', doorIn: null, doorOut: null };
}

function computeSmartPath5F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision5F(rawEx, rawEz);
  const startInfo = getRoomDoorInfo5F(sx, sz);
  const endInfo = getRoomDoorInfo5F(ex, ez);
  if (startInfo.room === endInfo.room && startInfo.room !== 'hall') return [[ex, ez]];
  const waypoints = [];
  if (startInfo.room !== 'hall') {
    waypoints.push(startInfo.doorIn, startInfo.doorOut);
    if (startInfo.via) waypoints.push(startInfo.via);
  }
  if (endInfo.room !== 'hall') {
    if (endInfo.via) waypoints.push(endInfo.via);
    else waypoints.push([-0.6, endInfo.doorOut[1]]);
    waypoints.push(endInfo.doorOut, endInfo.doorIn);
  }
  waypoints.push([ex, ez]);
  return waypoints;
}

const NPCS_5F = [
  { id: 'pastor_bang_5f', name: '방희곤 목사님 (5F 예배·축도)', role: '좋은나무교회 목사 · 소예배 및 사역 축도', isPastor: true, canBless: true, x: -0.2, y: 0, z: -3.6, rotY: 0.2, gender: 'male', hairStyle: 'short', shirt: '#1E3A8A', pants: '#0F172A', hair: '#27272A', dialogues: ['할렐루야! 5층 소예배·찬양홀과 애찬 친교실에 오신 성도님들을 축복합니다 😊', '저를 클릭하시면 성도님 가정과 식탁 위에 [✨ 거룩한 축도(홀리라이트)]를 내려드립니다 🙏'] },
  { id: 'dancer_1', name: '이하은 (워십리더)', role: '찬양 워십댄스팀 리더', x: -5.5, y: 0, z: -0.3, rotY: -Math.PI / 2, gender: 'female', hairStyle: 'long_wave', isDancer: true, isSkirt: true, shirt: '#EC4899', pants: '#FBCFE8', hair: '#5C3A21', dialogues: ['하나, 둘, 셋, 넷! 밝은 전신거울 보면서 팔 각도 예쁘게 맞춰봐요 💃'] },
  { id: 'dancer_2', name: '김소망 (율동팀)', role: '워십댄스팀 단원', x: -5.5, y: 0, z: 0.35, rotY: -Math.PI / 2, gender: 'male', hairStyle: 'short', isDancer: true, shirt: '#38BDF8', pants: '#1E293B', hair: '#27272A', dialogues: ['전신거울이 환하고 넓어서 동작 맞추기가 정말 좋네요 🪞'] },
  { id: 'dancer_3', name: '박예은 (율동팀)', role: '워십댄스팀 단원', x: -5.5, y: 0, z: 0.95, rotY: -Math.PI / 2, gender: 'female', hairStyle: 'bob', isDancer: true, isSkirt: true, shirt: '#FACC15', pants: '#FDE68A', hair: '#78350F', dialogues: ['연습 끝나고 바로 옆 배식대에서 맛있는 점심 애찬 먹어요! 🍱'] },
  { id: 'meeting_1', name: '정장로 (기획위원)', role: '당회 사역기획위원 장로', x: -5.44, y: 0, z: -2.72, rotY: 0, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#334155', pants: '#0F172A', hair: '#1E293B', dialogues: ['이번 달 새가족 환영회와 다음세대 사역 안건을 나눕시다 📋'] },
  { id: 'meeting_2', name: '최안수집사 (재정)', role: '재정위원회 안수집사', x: -4.16, y: 0, z: -1.48, rotY: Math.PI, seated: true, gender: 'male', hairStyle: 'short', shirt: '#2563EB', pants: '#1E293B', hair: '#451A03', dialogues: ['주방 봉사팀 애찬 지원 예산도 넉넉히 반영하겠습니다! 👍'] },
  { id: 'chef_1', name: '박권사 (주방장)', role: '애찬봉사팀 총괄 권사', isChef: true, x: 3.8, y: 0, z: 2.15, patrolX: [2.8, 4.8], gender: 'female', hairStyle: 'bun', isSkirt: true, rotY: Math.PI, shirt: '#F97316', pants: '#FFEDD5', hair: '#451A03', dialogues: ['오늘 메뉴는 소고기 미역국과 간장 불고기, 잡채예요! 🍲', '저를 클릭하시면 따뜻한 5구 스텐 식판을 손에 들려드립니다 🥰'] },
  { id: 'chef_2', name: '오집사 (조리봉사)', role: '애찬 조리봉사팀 집사', isChef: true, x: 5.0, y: 0, z: 3.65, autoWave: true, gender: 'female', hairStyle: 'bob', isSkirt: true, rotY: Math.PI / 2, shirt: '#10B981', pants: '#D1FAE5', hair: '#5C3A21', dialogues: ['대형 국솥에서 모락모락 김이 나는 게 정말 맛있어 보여요 😋'] },
  { id: 'drummer_5f', name: '강형제 (ATV 드럼)', role: '5F 찬양단 드러머', isPraiseMember: true, x: 5.3, y: 0, z: -4.4, seated: true, isDrummer: true, gender: 'male', hairStyle: 'short', rotY: -0.4, shirt: '#EF4444', pants: '#1E293B', hair: '#18181B', dialogues: ['둥칫두칫! 건반 소리랑 5기통 드럼 비트 완벽하게 맞아떨어지네요 🥁'] },
  { id: 'pianist_5f', name: '윤자매 (전자피아노)', role: '5F 찬양단 메인 반주자', isPraiseMember: true, x: 5.2, y: 0, z: -2.25, seated: true, isPianist: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, rotY: Math.PI, shirt: '#A855F7', pants: '#F3E8FF', hair: '#5C3A21', dialogues: ['88건반 전자피아노 터치감이 너무 좋아서 찬양 반주할 맛 나요 🎹'] },
  { id: 'pastor_5f', name: '전도사님 (소예배·찬양인도)', role: '5F 소예배 및 찬양 인도자', isPraiseMember: true, x: 1.65, y: 0.44, z: -4.68, rotY: 0, isPastor: true, gender: 'male', hairStyle: 'parted', shirt: '#1E293B', pants: '#0F172A', hair: '#27272A', dialogues: ['사랑하는 성도 여러분, 5층 소예배·찬양홀에 오신 것을 축복합니다 ✝️'] },
  { id: 'member_5f_1', name: '한성도 (애찬·예배)', role: '소예배 참석 성도', hasFoodTray: true, x: CURVED_CHAIRS_5F[2].x, y: 0, z: CURVED_CHAIRS_5F[2].z, rotY: CURVED_CHAIRS_5F[2].rotY, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#38BDF8', pants: '#334155', hair: '#5C3A21', dialogues: ['예배드리고 맛있는 애찬 식사까지 나누니 정말 행복합니다 🍱'] },
  { id: 'member_5f_2', name: '서청년 (찬양집회)', role: '청년부 소예배 성도', x: CURVED_CHAIRS_5F[8].x, y: 0, z: CURVED_CHAIRS_5F[8].z, rotY: CURVED_CHAIRS_5F[8].rotY, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#F472B6', pants: '#FCE7F3', hair: '#78350F', dialogues: ['아멘! 바로 뒤쪽이 조리실 오픈 배식대라 애찬 나누기도 정말 편해요 🎶'] },
  { id: 'member_5f_3', name: '이집사 (구역예배)', role: '구역장 성도', x: CURVED_CHAIRS_5F[14].x, y: 0, z: CURVED_CHAIRS_5F[14].z, rotY: CURVED_CHAIRS_5F[14].rotY, seated: true, gender: 'male', hairStyle: 'short', shirt: '#10B981', pants: '#1E293B', hair: '#27272A', dialogues: ['할렐루야~ 부채꼴 곡선 의자에 앉아 다 같이 찬양하니 은혜가 배가 됩니다!'] }
];

// =====================================================================
// ✨ 축도 홀리라이트 · 스마트 컷어웨이 · 홀로그램 마커
// =====================================================================
function HolyLightBeamEffect5F({ targetPos, pastorName, targetName }) {
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
    ctx.fillText(`✝️ ${pastorName || '방희곤 목사님'}의 소예배·애찬 축도`, w / 2, 46);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 26px serif';
    ctx.fillText(`${targetName} 성도님의 가정과 일터와 애찬의 식탁 위에`, w / 2, 88);
    ctx.fillText(`하늘의 풍성한 은혜와 평강이 넘칠지어다! 아멘 🙏`, w / 2, 126);
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

function SmartCutawayWall5F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 4.0) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -4.0) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 4.0) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.0) shouldFade = true;
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

function HologramMarker5F({ zone, isSelected, onSelect }) {
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
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; ctx.beginPath(); ctx.roundRect(w / 2 + 24, h / 2 + 6, 112, 44, 14); ctx.fill();
      ctx.fillStyle = '#ECFDF5'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(zone.subCode, w / 2 + 80, h / 2 + 28);
    }
  }, 320, 196), [zone.code, zone.subCode]);

  useEffect(() => () => badgeTex.dispose(), [badgeTex]);
  useFrame(({ clock }) => { if (pulseRef.current) { const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05; pulseRef.current.scale.set(s, s, 1); } });

  return (
    <group position={zone.pos} onClick={(e) => { e.stopPropagation(); onSelect(zone); }}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.42, 0.52, 24]} /><meshBasicMaterial color="#34D399" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><circleGeometry args={[0.42, 24]} /><meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} /></mesh>
      <Billboard position={[0.06, 0.38, 0]}><mesh><planeGeometry args={[0.78, 0.44]} /><meshBasicMaterial map={badgeTex} transparent depthWrite={false} /></mesh></Billboard>
    </group>
  );
}

// =====================================================================
// 🥰 전 층 동일 2.5등신 치비 아바타 (실시간 표정 · 눈 깜빡임 · 5구 식판)
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

function CharacterHairStyle5F({ style = 'short', hairColor = '#27272A' }) {
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

function SmoothChibiAvatar5F({
  position = [0, 0, 0], targetPosition = null, patrolZ = null, patrolX = null, rotationY = 0,
  isWalking = false, isSeated = false, isDancer = false, isDrummer = false, isPianist = false,
  isPastor = false, hasFoodTray = false, gender = 'male', hairStyle = 'short', isSkirt = false,
  autoWave = false, hasSunglasses = false, emote = null, shirtColor = '#FACC15', pantsColor = '#2563EB',
  hairColor = '#B45309', skinColor = '#FFE4C4', nameTagTexture = null, speechBubbleText = null,
  onClick = null, seedOffset = 0
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
  const holdingTrayNow = hasFoodTray || emote === 'eat';
  const dancingNow = isDancer || emote === 'dance';
  const isPraying = emote === 'pray';
  const isHappyEyes = dancingNow || holdingTrayNow;
  const isTalking = Boolean(speechBubbleText);

  const patrolState = useRef({ coord: patrolX ? position[0] : position[2], dir: 1, pauseTimer: 0 });

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
    } else if ((patrolZ || patrolX) && outerGroupRef.current) {
      const bounds = patrolX || patrolZ;
      const st = patrolState.current;
      if (st.pauseTimer > 0) { st.pauseTimer -= delta; walkingNow = false; }
      else {
        walkingNow = true;
        st.coord += st.dir * delta * 0.65;
        if (st.coord > bounds[1]) { st.coord = bounds[1]; st.dir = -1; st.pauseTimer = 2.4; }
        else if (st.coord < bounds[0]) { st.coord = bounds[0]; st.dir = 1; st.pauseTimer = 2.4; }
        if (patrolX) { outerGroupRef.current.position.x = st.coord; outerGroupRef.current.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
        else { outerGroupRef.current.position.z = st.coord; outerGroupRef.current.rotation.y = st.dir > 0 ? 0.2 : Math.PI - 0.2; }
      }
    }

    if (isDancer && outerGroupRef.current) {
      outerGroupRef.current.position.z = position[2] + Math.sin(t * 3.2) * 0.14;
      outerGroupRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 1.6) * 0.22;
    }

    if (eyesOpenGroupRef.current) {
      const blinkCycle = t % 3.6;
      eyesOpenGroupRef.current.scale.y = THREE.MathUtils.lerp(eyesOpenGroupRef.current.scale.y, blinkCycle > 3.46 ? 0.08 : 1.0, 0.45);
    }
    if (mouthRef.current) {
      mouthRef.current.scale.y = isTalking ? 0.8 + Math.abs(Math.sin(t * 14)) * 1.1 : isHappyEyes ? 1.4 : 1.0;
    }

    const seatedNow = isSeated || isDrummer || isPianist;

    if (leftLegRef.current && rightLegRef.current) {
      if (seatedNow) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05; rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.22, 0.11); rightLegRef.current.position.set(0.085, 0.22, 0.11);
      } else if (walkingNow || dancingNow) {
        const sw = Math.sin(t * (dancingNow ? 8.0 : 10.0)) * 0.56;
        leftLegRef.current.rotation.x = sw; rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.085, 0.20, 0); rightLegRef.current.position.set(0.085, 0.20, 0);
      } else {
        leftLegRef.current.rotation.x = 0; rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.085, 0.20, 0); rightLegRef.current.position.set(0.085, 0.20, 0);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'bless') { leftArmRef.current.rotation.set(-2.1, 0, 0.35); rightArmRef.current.rotation.set(-2.1, 0, -0.35); }
      else if (holdingTrayNow) { leftArmRef.current.rotation.set(-1.25, 0, -0.25); rightArmRef.current.rotation.set(-1.15 - Math.abs(Math.sin(t * 4.5)) * 0.45, 0, 0.25); }
      else if (isPraying) { leftArmRef.current.rotation.set(-1.15, 0, -0.42); rightArmRef.current.rotation.set(-1.15, 0, 0.42); }
      else if (isPastor) { rightArmRef.current.rotation.set(0.35, 0, -1.95 + Math.sin(t * 3.2) * 0.25); leftArmRef.current.rotation.set(-0.35 + Math.cos(t * 2.4) * 0.12, 0, 0.15); }
      else if (dancingNow) { leftArmRef.current.rotation.set(-0.3, 0, 2.2 + Math.sin(t * 6.4) * 0.45); rightArmRef.current.rotation.set(-0.3, 0, -2.2 + Math.cos(t * 6.4) * 0.45); }
      else if (isDrummer) { leftArmRef.current.rotation.set(-1.0 + Math.sin(t * 14) * 0.38, 0, 0.15); rightArmRef.current.rotation.set(-1.0 + Math.cos(t * 14) * 0.38, 0, -0.15); }
      else if (isPianist) { leftArmRef.current.rotation.set(-0.82 + Math.sin(t * 8.5) * 0.16, 0, 0.15); rightArmRef.current.rotation.set(-0.82 + Math.cos(t * 8.5) * 0.16, 0, -0.15); }
      else if (emote === 'wave' || autoWave) { rightArmRef.current.rotation.set(0.3, 0, -2.35 + Math.sin(t * 10) * 0.32); leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.08, 0, 0.18); }
      else if (seatedNow) { leftArmRef.current.rotation.set(-0.42, 0, 0.1); rightArmRef.current.rotation.set(-0.42, 0, -0.1); }
      else if (walkingNow) { const sw = Math.sin(t * 10.0) * 0.48; leftArmRef.current.rotation.set(-sw, 0, 0.16); rightArmRef.current.rotation.set(sw, 0, -0.16); }
      else { leftArmRef.current.rotation.set(Math.sin(t * 2) * 0.06, 0, 0.18); rightArmRef.current.rotation.set(-Math.sin(t * 2) * 0.06, 0, -0.18); }
    }

    if (headGroupRef.current) {
      if (isPraying) headGroupRef.current.rotation.set(0.32, 0, 0);
      else headGroupRef.current.rotation.set(Math.sin(t * 2.8) * 0.05, Math.cos(t * 1.5) * 0.07, Math.sin(t * 1.8) * 0.03);
    }
    if (rootRef.current) {
      const bounce = (walkingNow || dancingNow) && !seatedNow ? Math.abs(Math.sin(t * (dancingNow ? 6.4 : 10.0))) * 0.055 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (seatedNow ? 0.16 : 0) + bounce;
      rootRef.current.position.z = seatedNow ? 0.04 : 0;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
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

        {holdingTrayNow && (
          <group position={[0, 0.44, 0.24]}>
            <RoundedBox args={[0.26, 0.018, 0.20]} radius={0.01} castShadow><meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.18} /></RoundedBox>
            <mesh position={[-0.06, 0.02, 0.04]}><cylinderGeometry args={[0.04, 0.032, 0.025, 8]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <mesh position={[0.06, 0.02, 0.04]}><cylinderGeometry args={[0.04, 0.032, 0.025, 8]} /><meshStandardMaterial color="#15803D" /></mesh>
            {[-0.07, 0, 0.07].map((fx, fi) => (<RoundedBox key={fi} args={[0.05, 0.015, 0.045]} position={[fx, 0.015, -0.045]} radius={0.005}><meshStandardMaterial color={['#9A3412', '#EF4444', '#FACC15'][fi]} /></RoundedBox>))}
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

          <CharacterHairStyle5F style={hairStyle || (isFemale ? 'bob' : 'short')} hairColor={hairColor} />

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

function RemoteMultiplayerAvatar5F({ peer, onClickPeer }) {
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
    <SmoothChibiAvatar5F
      position={[peer.x || -0.2, 0, peer.z || 3.2]}
      targetPosition={[peer.x || -0.2, 0, peer.z || 3.2]}
      rotationY={peer.rotY || Math.PI}
      gender={peer.avatar?.gender || 'male'}
      hairStyle={peer.avatar?.hairStyle || 'parted'}
      isSkirt={Boolean(peer.avatar?.isSkirt)}
      hasSunglasses={Boolean(peer.avatar?.hasSunglasses)}
      isSeated={Boolean(peer.seated)}
      hasFoodTray={peer.emote === 'eat'}
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
// 🪑 의자 · 고도화 양변기 · 애찬 테이블 · 엘리베이터
// =====================================================================
function DetailedChair5F({ position, rotationY = 0, seatColor = '#0284C7', onClick }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow><cylinderGeometry args={[0.21, 0.20, 0.06, 14]} /><meshStandardMaterial color={seatColor} roughness={0.4} /></mesh>
      <RoundedBox args={[0.40, 0.30, 0.055]} position={[0, 0.54, 0.17]} rotation={[0.12, 0, 0]} radius={0.07} castShadow><meshStandardMaterial color={seatColor} roughness={0.4} /></RoundedBox>
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]}><cylinderGeometry args={[0.015, 0.012, 0.34, 8]} /><meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.2} /></mesh>
      ))}
    </group>
  );
}

function DetailedMiniatureToilet5F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.14, 0.04]} castShadow><cylinderGeometry args={[0.14, 0.10, 0.28, 12]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.26, 0.06]} scale={[1.0, 0.55, 1.25]}><sphereGeometry args={[0.15, 12, 10]} /><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></mesh>
      <mesh position={[0, 0.295, 0.07]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.095, 12]} /><meshBasicMaterial color="#BAE6FD" /></mesh>
      <mesh position={[0, 0.31, 0.07]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.125, 0.026, 8, 14]} /><meshStandardMaterial color="#F8FAFC" roughness={0.2} /></mesh>
      <RoundedBox args={[0.32, 0.36, 0.15]} position={[0, 0.46, -0.14]} radius={0.035} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.14} /></RoundedBox>
      <RoundedBox args={[0.06, 0.02, 0.02]} position={[-0.17, 0.56, -0.10]} radius={0.005}><meshStandardMaterial color="#CBD5E1" metalness={0.9} /></RoundedBox>
    </group>
  );
}

function AnimatedStainlessElevator5F({ position, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeStudioMirrorTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);

  useEffect(() => () => { steelTex.dispose(); mirrorTex.dispose(); oakTex.dispose(); }, [steelTex, mirrorTex, oakTex]);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const isOpen = forceOpen || Math.hypot(px - position[0], pz - (position[2] - 0.7)) < 1.95;
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

// =====================================================================
// 🏛️ 5층 전체 디오라마 (진짜 식당·조리실 리얼리티 대폭 강화!)
// =====================================================================
function FiveFloorMasterpieceDiorama({
  activeZoneId, onSelectZone, seatedInfo, onSitOnChair, onToggleTvScreen, onServeFoodTray,
  onSelectNpcForChat, sermonTitle, activeNpcChatIdx, showRoomSigns, playerIdxRef,
  isElevatorModalOpen, remotePeers, onSelectRemotePeer, holyLightEvent
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const hallWoodFloorTex = useMemo(() => makeWoodGrainTexture('#E6CBA8', '#C8A273'), []);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const kitchenTileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#E2E8F0', 10), []);
  const greyRestroomTileTex = useMemo(() => makeTileGridTexture('#8E939B', '#6C717A', 8), []);
  const mirrorReflectTex = useMemo(() => makeStudioMirrorTexture(), []);
  const menuBoardTex = useMemo(() => makeCafeteriaMenuTexture(), []);

  const steamGroupRef = useRef();
  useFrame(({ clock }) => { if (steamGroupRef.current) steamGroupRef.current.position.y = (clock.elapsedTime * 0.35) % 0.45; });

  const signs = useMemo(() => ({
    pulpit: makeRoomSignTexture('미니 강대상 · TV', '클릭 시 말씀·찬양 유튜브 상영', '#0284C7'),
    band: makeRoomSignTexture('드럼 · 전자피아노', '5F 찬양단 라이브 악기 코너', '#F59E0B'),
    chairs: makeRoomSignTexture('곡선 의자들 (18석)', '부채꼴 예배석 · 클릭 시 착석', '#10B981'),
    kitchen: makeRoomSignTexture('애찬 식당 · 배식대 🍲', '클릭 시 5구 식판 애찬 배식', '#F97316'),
    meeting: makeRoomSignTexture('회의실 (6인석)', '사역 기획 회의 · 목사님 축도', '#6366F1'),
    dance: makeRoomSignTexture('댄스연습실 (거울)', '전신거울 · 워십 율동 연습', '#EC4899'),
    restroom: makeRoomSignTexture('화장실 🚻', '큐비클 부스 · 핸드드라이어 · 세면대', '#64748B'),
    elevator: makeRoomSignTexture('5F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~7F) 이동', '#10B981')
  }), []);

  const tvScreenTex = useMemo(() => makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1E3A8A'); grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FDE047'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#FDE047'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('5F WORSHIP & FELLOWSHIP HALL', w / 2, 62);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 36px serif'; ctx.fillText(sermonTitle || '좋은나무 찬양 & 말씀 집회', w / 2, 130);
    ctx.fillStyle = '#93C5FD'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('▶ 의자에 앉거나 TV를 클릭하면 영상이 상영됩니다', w / 2, 192);
  }, 512, 240), [sermonTitle]);

  useEffect(() => () => {
    [oakWoodTex, hallWoodFloorTex, steelTex, kitchenTileTex, greyRestroomTileTex, mirrorReflectTex, menuBoardTex, tvScreenTex].forEach((t) => t.dispose());
    Object.values(signs).forEach((t) => t.dispose());
  }, [oakWoodTex, hallWoodFloorTex, steelTex, kitchenTileTex, greyRestroomTileTex, mirrorReflectTex, menuBoardTex, tvScreenTex, signs]);

  return (
    <group>
      {/* 1. 5층 바닥 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow><meshStandardMaterial color="#475569" roughness={0.65} /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.75, 0.005, -1.9]} receiveShadow><planeGeometry args={[9.5, 6.6]} /><meshStandardMaterial map={hallWoodFloorTex} roughness={0.42} /></mesh>
      {[2.35, 3.35, 4.35].map((rad, rIdx) => (
        <mesh key={`arc_${rIdx}`} rotation={[-Math.PI / 2, 0, 0]} position={[1.65, 0.009, -4.35]}>
          <ringGeometry args={[rad - 0.16, rad + 0.16, 32, 1, -Math.PI * 0.72, Math.PI * 0.44]} />
          <meshBasicMaterial color="#B87E42" transparent opacity={0.32} />
        </mesh>
      ))}

      {/* 2. 미니 강대상 & 대형 TV */}
      <group position={[1.65, 0, -4.35]}>
        <group position={[0.25, 1.68, -1.05]} onClick={(e) => { e.stopPropagation(); if (onToggleTvScreen) onToggleTvScreen(); }}>
          <RoundedBox args={[2.35, 1.20, 0.08]} radius={0.02} castShadow userData={{ keepOpaque: true }}><meshStandardMaterial color="#0F172A" roughness={0.2} /></RoundedBox>
          <mesh position={[0, 0, 0.045]} userData={{ keepOpaque: true }}><planeGeometry args={[2.22, 1.08]} /><meshBasicMaterial map={tvScreenTex} /></mesh>
        </group>
        <RoundedBox args={[2.2, 0.10, 1.35]} position={[0, 0.05, -0.05]} radius={0.02} receiveShadow><meshStandardMaterial map={oakWoodTex} roughness={0.4} /></RoundedBox>
        <RoundedBox args={[1.05, 0.18, 0.58]} position={[0, 0.19, -0.34]} radius={0.02} castShadow><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
        <RoundedBox args={[0.88, 0.16, 0.48]} position={[0, 0.36, -0.34]} radius={0.02} castShadow><meshStandardMaterial color="#991B1B" roughness={0.7} /></RoundedBox>
        <RoundedBox args={[0.90, 0.74, 0.50]} position={[0, 0.45, 0.18]} radius={0.025} castShadow><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
        <RoundedBox args={[1.02, 0.08, 0.58]} position={[0, 0.84, 0.18]} radius={0.02}><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
        <mesh position={[0, 0.50, 0.44]}><boxGeometry args={[0.04, 0.28, 0.02]} /><meshStandardMaterial color="#FDE047" metalness={0.7} /></mesh>
        <mesh position={[0, 0.55, 0.44]}><boxGeometry args={[0.18, 0.04, 0.02]} /><meshStandardMaterial color="#FDE047" metalness={0.7} /></mesh>
        {[-0.65, 0.65].map((wx, wi) => (<RoundedBox key={wi} args={[0.38, 0.20, 0.26]} position={[wx, 0.12, 0.85]} rotation={[-0.38, 0, 0]} radius={0.02}><meshStandardMaterial color="#111318" /></RoundedBox>))}
        {showRoomSigns && <Billboard position={[0, 2.48, -0.5]}><mesh onClick={(e) => { e.stopPropagation(); if (onToggleTvScreen) onToggleTvScreen(); }}><planeGeometry args={[1.2, 0.52]} /><meshBasicMaterial map={signs.pulpit} transparent /></mesh></Billboard>}
      </group>

      {/* 3. 우측 상단 드럼 & 전자피아노 */}
      <group position={[5.2, 0, -4.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><circleGeometry args={[1.15, 22]} /><meshStandardMaterial color="#334155" /></mesh>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((ang, ai) => (
          <mesh key={ai} position={[Math.sin(ang * 1.6 - 0.5) * 0.98, 0.72, Math.cos(ang * 1.6 - 0.5) * 0.98]} rotation={[0, ang * 1.6 - 0.5, 0]}>
            <boxGeometry args={[0.58, 1.42, 0.03]} /><meshStandardMaterial color="#BAE6FD" transparent opacity={0.34} />
          </mesh>
        ))}
        <mesh position={[-0.15, 0.28, 0.1]} rotation={[Math.PI / 2, 0.4, 0]} castShadow><cylinderGeometry args={[0.26, 0.26, 0.36, 14]} /><meshStandardMaterial color="#DC2626" roughness={0.3} /></mesh>
        <mesh position={[-0.32, 0.44, -0.18]}><cylinderGeometry args={[0.15, 0.15, 0.12, 12]} /><meshStandardMaterial color="#F8FAFC" /></mesh>
        {[[-0.38, 0.85, 0.25], [0.22, 0.88, -0.25], [-0.05, 0.94, 0.32]].map(([cx, cy, cz], ci) => (
          <mesh key={ci} position={[cx, cy, cz]} rotation={[0.2, 0, 0]}><cylinderGeometry args={[0.20, 0.20, 0.015, 14]} /><meshStandardMaterial color="#FACC15" metalness={0.85} /></mesh>
        ))}
        <group position={[0.0, 0, 1.55]}>
          <RoundedBox args={[1.45, 0.12, 0.42]} position={[0, 0.72, 0]} radius={0.02} castShadow><meshStandardMaterial color="#18181B" roughness={0.2} /></RoundedBox>
          <RoundedBox args={[1.32, 0.04, 0.14]} position={[0, 0.77, 0.12]} radius={0.005}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
          <RoundedBox args={[1.35, 0.70, 0.06]} position={[0, 0.35, -0.14]} radius={0.01}><meshStandardMaterial color="#27272A" /></RoundedBox>
        </group>
        {showRoomSigns && <Billboard position={[-0.2, 1.95, 0.7]}><mesh><planeGeometry args={[1.2, 0.52]} /><meshBasicMaterial map={signs.band} transparent /></mesh></Billboard>}
      </group>

      {/* 4. 3열 곡선 의자들 18석 */}
      <group>
        {CURVED_CHAIRS_5F.map((ch, idx) => (
          <DetailedChair5F
            key={ch.id}
            position={[ch.x, 0, ch.z]}
            rotationY={ch.chairRotY}
            seatColor={seatedInfo && Math.hypot(seatedInfo.x - ch.x, seatedInfo.z - ch.z) < 0.25 ? '#FACC15' : idx % 3 === 0 ? '#0284C7' : idx % 3 === 1 ? '#2563EB' : '#0D9488'}
            onClick={(e) => { e.stopPropagation(); onSitOnChair(ch); }}
          />
        ))}
        {showRoomSigns && <Billboard position={[3.2, 1.55, -0.5]}><mesh><planeGeometry args={[1.2, 0.52]} /><meshBasicMaterial map={signs.chairs} transparent /></mesh></Billboard>}
      </group>

      {/* 5. 좌측 상단 회의실 · 중단 댄스연습실 · 중하단 화장실 · 하단 계단 */}
      <group position={[-4.8, 0, -2.1]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.4, 2.3]} /><meshStandardMaterial color="#DBEAFE" roughness={0.5} /></mesh>
        <RoundedBox args={[2.05, 0.07, 0.92]} position={[0, 0.64, 0]} radius={0.04} castShadow receiveShadow><meshStandardMaterial map={oakWoodTex} roughness={0.32} /></RoundedBox>
        {[-0.68, 0.68].map((lx, li) => (<mesh key={li} position={[lx, 0.32, 0]}><cylinderGeometry args={[0.05, 0.05, 0.62, 10]} /><meshStandardMaterial color="#64748B" metalness={0.6} /></mesh>))}
        {[-0.64, 0.0, 0.64].map((cx, ci) => (
          <React.Fragment key={`m_ch_${ci}`}>
            <DetailedChair5F position={[cx, 0, -0.62]} rotationY={Math.PI} seatColor="#475569" onClick={(e) => { e.stopPropagation(); onSitOnChair({ x: -4.8 + cx, z: -2.1 - 0.62, rotY: 0, rowLabel: '5F 회의실 북측 좌석' }); }} />
            <DetailedChair5F position={[cx, 0, 0.62]} rotationY={0} seatColor="#475569" onClick={(e) => { e.stopPropagation(); onSitOnChair({ x: -4.8 + cx, z: -2.1 + 0.62, rotY: Math.PI, rowLabel: '5F 회의실 남측 좌석' }); }} />
          </React.Fragment>
        ))}
        {showRoomSigns && <Billboard position={[0, 1.75, 0]}><mesh><planeGeometry args={[1.15, 0.52]} /><meshBasicMaterial map={signs.meeting} transparent /></mesh></Billboard>}
      </group>

      <group position={[-4.8, 0, 0.25]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.4, 2.2]} /><meshStandardMaterial map={hallWoodFloorTex} roughness={0.3} /></mesh>
        <group position={[-1.66, 1.05, 0]}>
          <RoundedBox args={[0.06, 1.92, 2.08]} radius={0.015}><meshStandardMaterial color="#CBD5E1" metalness={0.5} /></RoundedBox>
          <mesh position={[0.036, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.98, 1.80]} /><meshBasicMaterial map={mirrorReflectTex} /></mesh>
          <RoundedBox args={[0.08, 0.06, 2.02]} position={[0.04, 0.94, 0]} radius={0.01}><meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.2} /></RoundedBox>
          <mesh position={[0.16, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.028, 0.028, 1.92, 10]} /><meshStandardMaterial map={oakWoodTex} /></mesh>
        </group>
        {showRoomSigns && <Billboard position={[0.2, 1.75, 0]}><mesh><planeGeometry args={[1.2, 0.52]} /><meshBasicMaterial map={signs.dance} transparent /></mesh></Billboard>}
      </group>

      <group position={[-4.8, 0, 2.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.4, 2.0]} /><meshStandardMaterial map={greyRestroomTileTex} roughness={0.32} /></mesh>
        <group position={[0.55, 0, -0.68]}>
          <RoundedBox args={[1.55, 0.74, 0.52]} position={[0, 0.37, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FFFFFF" roughness={0.18} /></RoundedBox>
          <RoundedBox args={[1.35, 0.03, 0.36]} position={[0, 0.75, 0.02]} radius={0.01}><meshStandardMaterial color="#FACC15" /></RoundedBox>
          <RoundedBox args={[1.50, 0.82, 0.03]} position={[0, 1.20, -0.23]} radius={0.015}><meshStandardMaterial color="#334155" /></RoundedBox>
          <mesh position={[0, 1.20, -0.21]}><planeGeometry args={[1.44, 0.76]} /><meshBasicMaterial map={mirrorReflectTex} /></mesh>
          <RoundedBox args={[0.26, 0.32, 0.15]} position={[0.92, 1.05, 0.05]} radius={0.06}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
        </group>
        {[-0.46, 0.46].map((bz, bi) => (
          <group key={bi} position={[-1.05, 0, bz]}>
            <RoundedBox args={[1.15, 1.52, 0.04]} position={[0, 0.76, -0.44]} radius={0.01}><meshStandardMaterial color="#C8BFA8" /></RoundedBox>
            <group position={[0.56, 0.75, 0.06]} rotation={[0, -0.32, 0]}>
              <RoundedBox args={[0.04, 1.46, 0.72]} radius={0.01}><meshStandardMaterial color="#FAF8F5" /></RoundedBox>
              <RoundedBox args={[0.045, 0.10, 0.725]} position={[0, -0.05, 0]} radius={0.004}><meshStandardMaterial color="#CBD5E1" metalness={0.75} /></RoundedBox>
            </group>
            <DetailedMiniatureToilet5F position={[-0.22, 0, 0]} rotationY={Math.PI / 2} />
          </group>
        ))}
        <RoundedBox args={[0.08, 1.72, 0.78]} position={[1.72, 0.86, 0.15]} rotation={[0, 0.45, 0]} radius={0.015}><meshStandardMaterial color="#60A5FA" /></RoundedBox>
        {showRoomSigns && <Billboard position={[0, 1.75, 0]}><mesh><planeGeometry args={[1.1, 0.50]} /><meshBasicMaterial map={signs.restroom} transparent /></mesh></Billboard>}
      </group>

      <group position={[-4.8, 0, 4.65]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[3.4, 2.1]} /><meshStandardMaterial color="#CBD5E1" roughness={0.5} /></mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox key={`st5_${i}`} args={[0.32, 0.10 + i * 0.08, 1.1]} position={[0.65 - i * 0.30, (0.10 + i * 0.08) / 2, -0.35]} radius={0.01} castShadow onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_5F[7]); }}>
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.08, 1.72, 0.78]} position={[1.72, 0.86, 0.05]} rotation={[0, 0.4, 0]} radius={0.015}><meshStandardMaterial color="#94A3B8" /></RoundedBox>
      </group>

      {/* ================================================================= */}
      {/* 🍲 [핵심 고도화] 진짜 교회 식당 & 조리실 주방 & 애찬 테이블 존! */}
      {/* ================================================================= */}
      {/* 배식대 앞 애찬 식탁 테이블 (성도들이 식판 놓고 앉아 식사하는 공간) */}
      <group position={[0.45, 0, 1.15]}>
        <RoundedBox args={[1.45, 0.06, 0.78]} position={[0, 0.64, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial map={oakWoodTex} roughness={0.32} /></RoundedBox>
        {[-0.58, 0.58].map((lx, i) => (<RoundedBox key={i} args={[0.06, 0.62, 0.62]} position={[lx, 0.31, 0]} radius={0.01}><meshStandardMaterial color="#334155" /></RoundedBox>))}
        {/* 식탁 위 물병 · 티슈케이스 · 5구 식판 2세트 */}
        <mesh position={[0, 0.76, 0]}><cylinderGeometry args={[0.045, 0.05, 0.18, 10]} /><meshStandardMaterial color="#BAE6FD" transparent opacity={0.8} /></mesh>
        <RoundedBox args={[0.16, 0.07, 0.10]} position={[0.22, 0.70, 0]} radius={0.01}><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
        {[-0.38, 0.42].map((tx, ti) => (
          <group key={ti} position={[tx, 0.68, ti === 0 ? -0.16 : 0.16]}>
            <RoundedBox args={[0.32, 0.018, 0.24]} radius={0.008}><meshStandardMaterial map={steelTex} metalness={0.85} /></RoundedBox>
            <mesh position={[-0.07, 0.02, 0.04]}><cylinderGeometry args={[0.042, 0.035, 0.025, 10]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <mesh position={[0.07, 0.02, 0.04]}><cylinderGeometry args={[0.042, 0.035, 0.025, 10]} /><meshStandardMaterial color="#15803D" /></mesh>
          </group>
        ))}
        <DetailedChair5F position={[-0.38, 0, -0.58]} rotationY={Math.PI} seatColor="#F97316" onClick={(e) => { e.stopPropagation(); onSitOnChair({ x: 0.07, z: 0.57, rotY: 0, rowLabel: '5F 애찬 식탁석' }); }} />
        <DetailedChair5F position={[0.42, 0, 0.58]} rotationY={0} seatColor="#F97316" onClick={(e) => { e.stopPropagation(); onSitOnChair({ x: 0.87, z: 1.73, rotY: Math.PI, rowLabel: '5F 애찬 식탁석' }); }} />
      </group>

      {/* 조리실 주방 & 오픈 배식대 */}
      <group position={[4.1, 0, 3.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><planeGeometry args={[4.8, 4.2]} /><meshStandardMaterial map={kitchenTileTex} roughness={0.3} /></mesh>

        {/* 1) 오픈형 배식대 + 오늘의 애찬 메뉴판 + 식판 적재대 + 수저통 + 국자/집게 */}
        <group position={[-0.25, 0, -2.15]} onClick={(e) => { e.stopPropagation(); if (onServeFoodTray) onServeFoodTray(); }}>
          <RoundedBox args={[3.10, 0.82, 0.88]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#FFFFFF" roughness={0.22} /></RoundedBox>
          <RoundedBox args={[3.20, 0.07, 0.98]} position={[0, 0.85, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial map={steelTex} color="#F8FAFC" metalness={0.88} roughness={0.16} /></RoundedBox>
          {/* 원목 식판 슬라이드 레일 */}
          <RoundedBox args={[3.10, 0.05, 0.28]} position={[0, 0.78, -0.54]} radius={0.015} castShadow><meshStandardMaterial map={oakWoodTex} roughness={0.35} /></RoundedBox>
          {/* 강화유리 스니즈가드 */}
          <RoundedBox args={[2.95, 0.36, 0.02]} position={[0, 1.08, -0.15]} rotation={[0.15, 0, 0]} radius={0.01}><meshStandardMaterial color="#BAE6FD" transparent opacity={0.35} roughness={0.05} /></RoundedBox>
          {/* 상부 원목 헤더 & 오늘의 애찬 메뉴판 보드 */}
          <RoundedBox args={[3.20, 0.28, 0.24]} position={[0, 1.98, 0]} radius={0.02} castShadow><meshStandardMaterial map={oakWoodTex} roughness={0.38} /></RoundedBox>
          <mesh position={[0, 2.38, -0.10]} rotation={[0, Math.PI, 0]}><planeGeometry args={[2.25, 0.80]} /><meshBasicMaterial map={menuBoardTex} /></mesh>
          {[-1.52, 1.52].map((px, pi) => (<RoundedBox key={pi} args={[0.16, 1.15, 0.22]} position={[px, 1.42, 0]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>))}

          {/* 좌측 끝: 겹쳐 쌓아둔 식판 적재대 & 수저/젓가락 통 */}
          <group position={[-1.38, 0.89, -0.22]}>
            {[0, 0.025, 0.05, 0.075, 0.10].map((sy, si) => (
              <RoundedBox key={si} args={[0.36, 0.02, 0.26]} position={[0, sy, 0]} radius={0.008}><meshStandardMaterial map={steelTex} metalness={0.85} /></RoundedBox>
            ))}
            <mesh position={[0.24, 0.08, 0]}><cylinderGeometry args={[0.055, 0.05, 0.16, 10]} /><meshStandardMaterial color="#CBD5E1" metalness={0.8} /></mesh>
          </group>

          {/* 대형 업소용 스텐 보온 밥솥 */}
          <mesh position={[-1.22, 1.02, 0.18]} castShadow><cylinderGeometry args={[0.20, 0.18, 0.28, 14]} /><meshStandardMaterial map={steelTex} metalness={0.85} roughness={0.2} /></mesh>

          {/* 보온 배식 바트 3구 (불고기 · 김치 · 잡채 + 국자/집게 손잡이) */}
          {[-0.58, 0.14, 0.86].map((bx, bi) => (
            <group key={`bain_${bi}`} position={[bx, 0.90, 0.16]}>
              <RoundedBox args={[0.62, 0.08, 0.38]} radius={0.015}><meshStandardMaterial map={steelTex} metalness={0.88} roughness={0.16} /></RoundedBox>
              <RoundedBox args={[0.54, 0.04, 0.32]} position={[0, 0.03, 0]} radius={0.01}><meshStandardMaterial color={['#9A3412', '#DC2626', '#CA8A04'][bi]} roughness={0.5} /></RoundedBox>
              {/* 국자/집게 손잡이 */}
              <mesh position={[0.14, 0.12, 0.08]} rotation={[0.45, 0, -0.25]}><cylinderGeometry args={[0.01, 0.01, 0.22, 6]} /><meshStandardMaterial color="#E2E8F0" metalness={0.9} /></mesh>
            </group>
          ))}

          {/* 배식대 우측 옆: 셀프 냉온수기 & 종이컵 디스펜서 */}
          <group position={[1.82, 0, -0.18]}>
            <RoundedBox args={[0.38, 0.92, 0.38]} position={[0, 0.46, 0]} radius={0.02} castShadow><meshStandardMaterial color="#F8FAFC" roughness={0.22} /></RoundedBox>
            <mesh position={[0, 1.12, 0]}><cylinderGeometry args={[0.14, 0.14, 0.38, 12]} /><meshStandardMaterial color="#38BDF8" transparent opacity={0.78} /></mesh>
            <mesh position={[0.22, 0.86, 0]}><cylinderGeometry args={[0.04, 0.04, 0.26, 8]} /><meshStandardMaterial color="#E2E8F0" /></mesh>
          </group>
        </group>

        {/* 2) 중앙 조리용 아일랜드 작업대 (도마 + 야채 손질 소품) */}
        <group position={[0.0, 0, -0.35]}>
          <RoundedBox args={[1.55, 0.06, 0.72]} position={[0, 0.80, 0]} radius={0.015} castShadow receiveShadow><meshStandardMaterial map={steelTex} metalness={0.8} roughness={0.2} /></RoundedBox>
          {[[-0.68, -0.28], [0.68, -0.28], [-0.68, 0.28], [0.68, 0.28]].map(([lx, lz], i) => (<mesh key={i} position={[lx, 0.40, lz]}><cylinderGeometry args={[0.025, 0.025, 0.80, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.8} /></mesh>))}
          <RoundedBox args={[1.42, 0.03, 0.62]} position={[0, 0.28, 0]} radius={0.01}><meshStandardMaterial map={steelTex} metalness={0.75} /></RoundedBox>
          {/* 원목 도마 & 야채 소품 */}
          <RoundedBox args={[0.42, 0.025, 0.28]} position={[-0.25, 0.84, 0]} radius={0.008}><meshStandardMaterial map={oakWoodTex} /></RoundedBox>
          <mesh position={[-0.22, 0.87, 0.02]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.014, 0.16, 8]} /><meshStandardMaterial color="#EA580C" /></mesh>
          <mesh position={[-0.32, 0.87, -0.04]} rotation={[0, 0.4, Math.PI / 2]}><cylinderGeometry args={[0.016, 0.016, 0.18, 6]} /><meshStandardMaterial color="#22C55E" /></mesh>
          {/* 스텐 믹싱볼 */}
          <mesh position={[0.36, 0.88, 0]}><sphereGeometry args={[0.14, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial map={steelTex} metalness={0.88} side={THREE.DoubleSide} /></mesh>
        </group>

        {/* 3) 동쪽 벽면: 대형 가스 화구 + 수증기 국솥 2기 + 대형 배기 후드 + 2구 싱크대 */}
        <group position={[1.82, 0, 0.1]}>
          <RoundedBox args={[0.78, 0.82, 3.6]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial map={steelTex} metalness={0.75} roughness={0.22} /></RoundedBox>
          <RoundedBox args={[0.86, 0.42, 2.2]} position={[0.02, 1.94, -0.5]} radius={0.02} castShadow><meshStandardMaterial map={steelTex} metalness={0.8} roughness={0.2} /></RoundedBox>
          <mesh position={[0.02, 1.72, -0.5]}><boxGeometry args={[0.68, 0.02, 1.8]} /><meshBasicMaterial color="#FEF3C7" /></mesh>

          {[-1.05, -0.15].map((pz, pi) => (
            <group key={`pot_${pi}`} position={[0, 0.84, pz]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[0.22, 0.28, 16]} /><meshBasicMaterial color="#38BDF8" /></mesh>
              <mesh position={[0, 0.20, 0]} castShadow><cylinderGeometry args={[0.28, 0.26, 0.38, 16]} /><meshStandardMaterial map={steelTex} metalness={0.88} roughness={0.15} /></mesh>
              <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.26, 0.26, 0.02, 14]} /><meshBasicMaterial color={pi === 0 ? '#15803D' : '#D97706'} /></mesh>
              <group ref={pi === 0 ? steamGroupRef : null}>
                {[[-0.08, 0.52, 0.05], [0.09, 0.62, -0.06], [0, 0.72, 0.04]].map(([sx, sy, sz], si) => (
                  <mesh key={si} position={[sx, sy, sz]}><sphereGeometry args={[0.055 - si * 0.01, 6, 6]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.55 - si * 0.12} /></mesh>
                ))}
              </group>
            </group>
          ))}

          <group position={[0, 0.83, 0.95]}>
            {[-0.28, 0.28].map((sz, si) => (<RoundedBox key={si} args={[0.48, 0.04, 0.46]} position={[0, 0, sz]} radius={0.01}><meshStandardMaterial color="#64748B" metalness={0.8} /></RoundedBox>))}
            <mesh position={[0.22, 0.16, 0]}><cylinderGeometry args={[0.018, 0.018, 0.32, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} /></mesh>
          </group>
        </group>

        {/* 4) 남쪽 벽면: 4도어 업소용 스테인리스 냉장고 & 퇴식구 잔반 카트 */}
        <group position={[0.15, 0, 1.55]}>
          <RoundedBox args={[1.72, 1.98, 0.72]} position={[0, 0.99, 0]} radius={0.025} castShadow><meshStandardMaterial map={steelTex} metalness={0.8} roughness={0.22} /></RoundedBox>
          <RoundedBox args={[0.28, 0.08, 0.05]} position={[0, 1.84, -0.36]} radius={0.005}><meshBasicMaterial color="#10B981" /></RoundedBox>
          {[[-0.41, 1.32], [0.41, 1.32], [-0.41, 0.48], [0.41, 0.48]].map(([dx, dy], di) => (
            <group key={`fr_${di}`} position={[dx, dy, -0.36]}>
              <RoundedBox args={[0.78, 0.78, 0.04]} radius={0.015}><meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} /></RoundedBox>
              <RoundedBox args={[0.03, 0.22, 0.04]} position={[dx < 0 ? 0.30 : -0.30, 0, -0.03]} radius={0.008}><meshStandardMaterial color="#334155" /></RoundedBox>
            </group>
          ))}
        </group>

        {/* 퇴식구 & 잔반 카트 */}
        <group position={[-1.75, 0, 1.25]}>
          <RoundedBox args={[0.68, 0.04, 0.48]} position={[0, 0.72, 0]} radius={0.01}><meshStandardMaterial map={steelTex} metalness={0.8} /></RoundedBox>
          <RoundedBox args={[0.68, 0.04, 0.48]} position={[0, 0.32, 0]} radius={0.01}><meshStandardMaterial map={steelTex} metalness={0.8} /></RoundedBox>
          <mesh position={[0, 0.50, 0]}><cylinderGeometry args={[0.16, 0.14, 0.32, 10]} /><meshStandardMaterial color="#334155" /></mesh>
        </group>

        <RoundedBox args={[0.08, 1.75, 0.88]} position={[-2.48, 0.88, -0.45]} rotation={[0, -0.5, 0]} radius={0.015}><meshStandardMaterial color="#F97316" /></RoundedBox>

        {showRoomSigns && (
          <Billboard position={[-0.25, 2.75, -2.15]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onServeFoodTray) onServeFoodTray(); }}>
              <planeGeometry args={[1.25, 0.54]} /><meshBasicMaterial map={signs.kitchen} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 엘리베이터 & 내벽/외벽 */}
      <AnimatedStainlessElevator5F position={[-0.2, 0, 5.6]} playerIdxRef={playerIdxRef} forceOpen={isElevatorModalOpen} onClickElevator={() => onSelectZone(ZONES_5F[0])} signTex={signs.elevator} showRoomSigns={showRoomSigns} />

      <RoundedBox args={[0.16, 1.25, 3.1]} position={[-3.1, 0.62, -1.8]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[-3.1, 0.62, 1.4]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[-3.1, 0.62, 3.5]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[1.3, 1.25, 0.16]} position={[-6.0, 0.62, -3.3]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[1.1, 1.25, 0.16]} position={[-3.65, 0.62, -3.3]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[2.4, 1.25, 0.16]} position={[-5.45, 0.62, -0.9]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[3.6, 1.25, 0.16]} position={[-4.9, 0.62, 1.4]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[3.6, 1.25, 0.16]} position={[-4.9, 0.62, 3.5]} radius={0.01}><meshStandardMaterial color="#E2E8F0" /></RoundedBox>
      <RoundedBox args={[0.8, 1.25, 0.16]} position={[2.0, 0.62, 1.4]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[1.3, 1.25, 0.16]} position={[6.0, 0.62, 1.4]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[1.6, 0.62, 1.95]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>
      <RoundedBox args={[0.16, 1.25, 2.2]} position={[1.6, 0.62, 4.75]} radius={0.01}><meshStandardMaterial color="#F1F5F9" /></RoundedBox>

      <SmartCutawayWall5F wallSide="north"><RoundedBox args={[14.4, 2.4, 0.24]} position={[0, 1.2, -5.6]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall5F>
      <SmartCutawayWall5F wallSide="west"><RoundedBox args={[0.24, 2.4, 12.6]} position={[-6.7, 1.2, 0.2]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall5F>
      <SmartCutawayWall5F wallSide="east"><RoundedBox args={[0.24, 2.4, 12.6]} position={[6.7, 1.2, 0.2]} radius={0.02}><meshStandardMaterial color="#F1F5F9" /></RoundedBox></SmartCutawayWall5F>

      {/* NPC · 원격 성도 · 홀리라이트 · 마커 */}
      {NPCS_5F.map((npc, idx) => (
        <SmoothChibiAvatar5F
          key={npc.id}
          position={[npc.x, npc.y || 0, npc.z]}
          patrolZ={npc.patrolZ || null}
          patrolX={npc.patrolX || null}
          rotationY={npc.rotY || 0}
          isSeated={Boolean(npc.seated)}
          isDancer={Boolean(npc.isDancer)}
          isDrummer={Boolean(npc.isDrummer)}
          isPianist={Boolean(npc.isPianist)}
          isPastor={Boolean(npc.isPastor)}
          hasFoodTray={Boolean(npc.hasFoodTray)}
          emote={holyLightEvent && holyLightEvent.pastorName === npc.name ? 'bless' : null}
          gender={npc.gender}
          hairStyle={npc.hairStyle}
          isSkirt={Boolean(npc.isSkirt)}
          autoWave={Boolean(npc.autoWave)}
          shirtColor={npc.shirt}
          pantsColor={npc.pants}
          hairColor={npc.hair}
          speechBubbleText={idx === activeNpcChatIdx % NPCS_5F.length && npc.dialogues?.length > 0 ? `${npc.name}: ${npc.dialogues[activeNpcChatIdx % npc.dialogues.length]}` : null}
          seedOffset={idx * 1.4}
          onClick={(e) => { e.stopPropagation(); if (npc.isChef) playTrayServeSound(); if (onSelectNpcForChat) onSelectNpcForChat(npc); }}
        />
      ))}

      {(remotePeers || []).map((peer) => <RemoteMultiplayerAvatar5F key={peer.clientId} peer={peer} onClickPeer={onSelectRemotePeer} />)}
      {holyLightEvent && <HolyLightBeamEffect5F targetPos={holyLightEvent.targetPos} pastorName={holyLightEvent.pastorName} targetName={holyLightEvent.targetName} />}

      {ZONES_5F.map((z) => (
        <HologramMarker5F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) onSitOnChair(sel.seatTarget);
            else if (sel.isTvZone && onToggleTvScreen) onToggleTvScreen();
            else if (sel.isServingZone && onServeFoodTray) onServeFoodTray();
            else onSelectZone(sel);
          }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 모바일 최적화 플레이어 컨트롤러 (useFrame 내 setState 병목 제거!)
// =====================================================================
function PlayerController5F({
  waypoints, playerIdxRef, seatedInfo, playerName, playerOffice, avatarConfig,
  emote, hasFoodTray, myChatBubble, controlsRef, followCamEnabled, onPositionUpdate
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
      const [nx, nz] = resolveCollision5F(cx + (dx / dist) * step, cz + (dz / dist) * step);
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
    <group ref={playerGroupRef} position={[-0.2, 0, 3.2]} rotation={[0, Math.PI, 0]}>
      <SmoothChibiAvatar5F
        position={[0, 0, 0]}
        rotationY={0}
        gender={avatarConfig.gender}
        hairStyle={avatarConfig.hairStyle}
        isSkirt={Boolean(avatarConfig.isSkirt)}
        hasSunglasses={Boolean(avatarConfig.hasSunglasses)}
        isWalking={isWalkingState}
        isSeated={Boolean(seatedInfo)}
        hasFoodTray={hasFoodTray || emote === 'eat'}
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

function InitialCameraSetup5F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    camera.position.set(0, isMobile ? 14.2 : 11.6, isMobile ? 13.2 : 11.0);
    camera.fov = isMobile ? 42 : 36;
    camera.updateProjectionMatrix();
    if (controlsRef.current) { controlsRef.current.target.set(0.2, 0.4, -0.2); controlsRef.current.update(); }
  }, [size.width, camera, controlsRef]);
  return null;
}

export default function Fellowship5F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const dailyData = useAppStore((state) => state.dailyData);
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false), []);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer5f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.2, 0, 3.2]);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  const [avatarConfig] = useState(() => {
    try { const saved = localStorage.getItem('gtc_metaverse_avatar_v1'); return saved ? { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(saved) } : DEFAULT_AVATAR_CONFIG; }
    catch { return DEFAULT_AVATAR_CONFIG; }
  });

  const initialSermon = useMemo(() => getSyncedSermonVideo(dailyData), [dailyData]);
  const initialPraise = useMemo(() => getSyncedPraiseVideo(dailyData), [dailyData]);

  const [waypoints, setWaypoints] = useState([[-0.2, 3.2]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_5F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [hasFoodTray, setHasFoodTray] = useState(false);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');
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

  const [mediaMode, setMediaMode] = useState('sermon');
  const [sermonVideo, setSermonVideo] = useState(initialSermon);
  const [praiseVideo, setPraiseVideo] = useState(initialPraise);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editTitleInput, setEditTitleInput] = useState('');

  useEffect(() => {
    const syncLatest = () => { setSermonVideo(getSyncedSermonVideo(dailyData)); setPraiseVideo(getSyncedPraiseVideo(dailyData)); };
    syncLatest();
    window.addEventListener('storage', syncLatest);
    return () => window.removeEventListener('storage', syncLatest);
  }, [dailyData]);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => { const timer = setInterval(() => setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_5F.length), 3800); return () => clearInterval(timer); }, []);

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
    const channel = supabase.channel('metaverse_dining_5f', { config: { presence: { key: clientIdRef.current } } });
    channelRef.current = channel;
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const peers = [];
        Object.keys(state).forEach((key) => { if (key !== clientIdRef.current && state[key]?.length) peers.push(state[key][state[key].length - 1]); });
        setRemotePeers(peers);
      })
      .on('broadcast', { event: 'holy_blessing_5f' }, ({ payload }) => {
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
    if (emoteType === 'eat') { setHasFoodTray(true); playTrayServeSound(); }
    if (chatText) setMyChatBubble(chatText);
    broadcastMyState({ emote: emoteType, chatMsg: chatText });
    setTimeout(() => { setEmote(null); broadcastMyState({ emote: null, chatMsg: chatText }); }, 4200);
    if (chatText) setTimeout(() => { setMyChatBubble(''); broadcastMyState({ emote: null, chatMsg: '' }); }, 5500);
  }, [broadcastMyState]);

  const triggerHolyBenediction5F = useCallback((pastorDisplayName, targetDisplayName, targetCoords) => {
    const eventPayload = { pastorName: pastorDisplayName, targetName: targetDisplayName, targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]], ts: Date.now() };
    playHolyBlessingSound();
    setHolyLightEvent(eventPayload);
    triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 소예배·애찬 축도를 감사히 받습니다 🙏`);
    channelRef.current?.send({ type: 'broadcast', event: 'holy_blessing_5f', payload: eventPayload }).catch(() => {});
    setTimeout(() => setHolyLightEvent(null), 7000);
  }, [triggerSocialAction]);

  const handleSitOnChair = useCallback((chairData) => {
    setSeatedInfo(chairData); setWaypoints([[chairData.x, chairData.z]]); setIsScreenPlaying(true);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleStandUp = useCallback(() => { setSeatedInfo(null); setIsScreenPlaying(false); setTimeout(() => broadcastMyState(), 100); }, [broadcastMyState]);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    setWaypoints(computeSmartPath5F(sx, sz, tx, tz));
  }, [seatedInfo]);

  const handleServeFoodTray = useCallback(() => {
    handleWalkTo(3.2, 0.9);
    triggerSocialAction('eat', '배식대에서 따뜻한 미역국과 불고기 5구 식판을 배식받았습니다! 🍱😋');
  }, [handleWalkTo, triggerSocialAction]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText((npc.dialogues && npc.dialogues[0]) || '할렐루야! 5층 소예배·애찬홀에 오신 것을 환영합니다 😊');
    setSelectedChatNpc(npc);
    triggerSocialAction('wave');
  }, [triggerSocialAction]);

  useEffect(() => {
    if (!isMapDrawerOpen) return;
    const mini = minimapRef.current; if (!mini) return;
    const ctx = mini.getContext('2d'); const w = mini.width, h = mini.height;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#1E2026'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4F46E5'; ctx.fillRect(6, 18, 28, 18);
    ctx.fillStyle = '#DB2777'; ctx.fillRect(6, 38, 28, 18);
    ctx.fillStyle = '#D99B5E'; ctx.fillRect(36, 8, 72, 48);
    ctx.fillStyle = '#EA580C'; ctx.fillRect(64, 58, 44, 32);
    ctx.fillStyle = '#10B981'; ctx.fillRect(38, 76, 24, 14);
    const [cx, , cz] = playerIdxRef.current;
    ctx.beginPath(); ctx.arc(((cx + 6.8) / 13.6) * w, ((cz + 5.8) / 11.8) * h, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15'; ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handleOpenLinkEditModal = () => {
    const activeMedia = mediaMode === 'praise' ? praiseVideo : sermonVideo;
    setEditTitleInput(activeMedia.title); setEditUrlInput(activeMedia.url); setShowVideoModal(true);
  };

  const handleSaveYoutubeLink = () => {
    const vid = parseYoutubeId(editUrlInput);
    if (!vid) return alert('올바른 유튜브 영상 주소(URL)를 입력해 주세요.');
    if (mediaMode === 'praise') {
      const nextPraise = { url: editUrlInput.trim(), id: vid, title: editTitleInput.trim() || '좋은나무 찬양단 경배와 찬양' };
      setPraiseVideo(nextPraise); localStorage.setItem('praise_active_video_url', nextPraise.url);
    } else {
      const nextSermon = { url: editUrlInput.trim(), id: vid, title: editTitleInput.trim() || '5F 소예배 말씀' };
      setSermonVideo(nextSermon); localStorage.setItem('sermon_active_video_url', nextSermon.url);
    }
    setIsScreenPlaying(true); setShowVideoModal(false);
  };

  const handlePositionUpdate = useCallback((px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_5F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    setActiveZone((prev) => (prev?.id === found?.id ? prev : found));
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) { lastSyncTimeRef.current = now; broadcastMyState(); }
  }, [broadcastMyState]);

  const activeMedia = mediaMode === 'praise' ? praiseVideo : sermonVideo;
  const darkPillStyle = { backgroundColor: 'rgba(30, 32, 38, 0.92)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.16)' };

  return (
    <div translate="no" style={{ backgroundColor: '#2B2C30' }} className="notranslate w-full h-full relative overflow-hidden select-none font-sans">
      {/* 1. 슬림 상단 HUD */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[74vw]">
        <div className="flex items-center gap-1.5">
          <button onClick={onExitHome} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">◀ 5F 소예배·식당</button>
          <span style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />{remotePeers.length + 1}명
          </span>
          <button onClick={() => setShowTopTools((v) => !v)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer">
            {showTopTools ? '▲ 접기' : '⚙️ 도구'}
          </button>
        </div>

        {showTopTools && (
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={handleServeFoodTray} style={{ backgroundColor: '#EA580C', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">🍱 식판 배식</button>
            <button onClick={() => setIsScreenPlaying((p) => !p)} style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">📺 {isScreenPlaying ? 'TV 닫기' : 'TV 켜기'}</button>
            <button onClick={() => triggerHolyBenediction5F('방희곤 목사님', playerName, playerIdxRef.current)} style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }} className="px-2.5 py-1 rounded-full text-[10.5px] font-black cursor-pointer">✨ 축도</button>
            <button onClick={() => setFollowCamEnabled((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{followCamEnabled ? '🎥 추적' : '🎥 자유'}</button>
            <button onClick={() => setShowRoomSigns((p) => !p)} style={darkPillStyle} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border cursor-pointer">{showRoomSigns ? '🏷️ ON' : '🏷️ OFF'}</button>
          </div>
        )}
      </div>

      {/* 2. 우측 상단 미니맵 드로어 */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        <button onClick={() => setIsMapDrawerOpen((p) => !p)} style={darkPillStyle} className="px-3 py-1.5 rounded-xl border shadow-lg text-xs font-black cursor-pointer">
          {isMapDrawerOpen ? '✕ 닫기' : '🗺️ 5F 맵'}
        </button>

        {isMapDrawerOpen && (
          <div style={darkPillStyle} className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in">
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[36vh] overflow-y-auto hide-scrollbar">
              {ZONES_5F.map((z) => (
                <button key={z.id} onClick={() => {
                  if (z.isSeatZone && z.seatTarget) handleSitOnChair(z.seatTarget);
                  else if (z.isServingZone) handleServeFoodTray();
                  else if (z.isTvZone) setIsScreenPlaying(true);
                  else { const dest = z.roomTarget || [z.pos[0], z.pos[2]]; handleWalkTo(dest[0], dest[1]); setActiveZone(z); setModalZone(z); }
                  setIsMapDrawerOpen(false);
                }} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold cursor-pointer truncate">
                  {z.badge}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. TV 유튜브 플레이어 */}
      {isScreenPlaying && (
        <div style={{ backgroundColor: '#090D16', borderColor: mediaMode === 'praise' ? '#EC4899' : '#F59E0B', color: '#FFFFFF' }} className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[460px] border-2 rounded-2xl overflow-hidden shadow-2xl">
          <div style={{ backgroundColor: '#111827' }} className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button onClick={() => setMediaMode('sermon')} className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${mediaMode === 'sermon' ? 'bg-amber-400 text-stone-950' : 'bg-white/10 text-zinc-300'}`}>설교</button>
              <button onClick={() => setMediaMode('praise')} className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${mediaMode === 'praise' ? 'bg-pink-500 text-white' : 'bg-white/10 text-zinc-300'}`}>찬양</button>
              <span className="text-xs font-bold truncate ml-1">{activeMedia.title}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={handleOpenLinkEditModal} className="text-[11px] font-bold text-amber-300 cursor-pointer">링크변경</button>
              <button onClick={() => setIsScreenPlaying(false)} className="text-xs font-bold px-1 cursor-pointer">✕</button>
            </div>
          </div>
          <div className="w-full aspect-video bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeMedia.id}?autoplay=1&rel=0&playsinline=1`} title="5F Live" frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* 4. 하단 슬림 접이식 메뉴 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
        {showBottomDock ? (
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pointer-events-auto">
            <div style={darkPillStyle} className="p-1 rounded-xl border shadow-xl flex items-center gap-1 shrink-0">
              {[
                { label: '🍱 식사', emote: 'eat', msg: '냠냠~ 미역국과 불고기가 정말 꿀맛이네요! 🍱😋' },
                { label: '💃 워십', emote: 'dance', msg: '전신거울 앞에서 찬양 율동을 맞춰요! 💃🎶' },
                { label: '🙏 기도', emote: 'pray', msg: '일용할 양식을 주신 주님께 감사드립니다 🙏' },
                { label: '👋 인사', emote: 'wave', msg: '할렐루야! 맛있는 애찬 함께 나눠요 👋🥰' }
              ].map((act, idx) => (
                <button key={idx} onClick={() => triggerSocialAction(act.emote, act.msg)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-orange-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer">
                  {act.label}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!quickChatInput.trim()) return; triggerSocialAction('wave', quickChatInput.trim()); setQuickChatInput(''); }} style={darkPillStyle} className="flex items-center gap-1 px-2 py-1 rounded-xl border shadow-xl min-w-[180px] flex-1 max-w-xs">
              <input type="text" value={quickChatInput} onChange={(e) => setQuickChatInput(e.target.value)} placeholder="말풍선 대화..." className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-zinc-400" />
              <button type="submit" className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[10.5px] font-black cursor-pointer">전송</button>
            </form>
            <button onClick={() => setShowBottomDock(false)} style={darkPillStyle} className="px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer shrink-0">✕</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button onClick={() => setShowBottomDock(true)} style={darkPillStyle} className="px-3 py-1.5 rounded-full border shadow-xl text-xs font-black cursor-pointer">🍲 대화·모션 ▲</button>
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
        <PerspectiveCamera makeDefault position={[0, 11.6, 11.0]} fov={36} near={0.1} far={220} />
        <InitialCameraSetup5F controlsRef={controlsRef} />

        <ambientLight intensity={1.12} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 0.92]} />
        <directionalLight position={[-6, 14, 10]} intensity={1.32} color="#FFF7ED" castShadow shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]} shadow-bias={-0.0005} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={(e) => { e.stopPropagation(); handleWalkTo(e.point.x, e.point.z); }}>
          <planeGeometry args={[14.2, 13.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <FiveFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => { const dest = z.roomTarget || [z.pos[0], z.pos[2]]; handleWalkTo(dest[0], dest[1]); setModalZone(z); }}
          seatedInfo={seatedInfo}
          onSitOnChair={handleSitOnChair}
          onToggleTvScreen={() => setIsScreenPlaying((p) => !p)}
          onServeFoodTray={handleServeFoodTray}
          onSelectNpcForChat={handleSelectNpcForChat}
          sermonTitle={activeMedia.title}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController5F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          hasFoodTray={hasFoodTray}
          myChatBubble={myChatBubble}
          controlsRef={controlsRef}
          followCamEnabled={followCamEnabled}
          onPositionUpdate={handlePositionUpdate}
        />

        {!isMobile && <ContactShadows frames={1} resolution={256} position={[0, 0.01, 0]} opacity={0.32} scale={22} blur={2.0} far={4} />}
        <OrbitControls ref={controlsRef} enableRotate={true} enablePan={true} enableZoom={true} screenSpacePanning={true} enableDamping={true} dampingFactor={0.07} minDistance={2.8} maxDistance={32} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>

      {/* 6~9. 원격 성도 · NPC 대화 · 유튜브 링크 · 엘리베이터 모달 */}
      {selectedRemotePeer && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedRemotePeer(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-sm border border-orange-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10px] font-bold text-orange-400 block">5층 소예배·애찬홀 성도 교제</span><h3 className="text-base font-black">{selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})</h3></div>
              <button onClick={() => setSelectedRemotePeer(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { triggerSocialAction('eat', `${selectedRemotePeer.name}님! 같이 애찬 식사해요 🍱😋`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-xs font-black text-orange-200 cursor-pointer">🍱 같이 식사</button>
              <button onClick={() => { triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 👋`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">👋 인사하기</button>
              <button onClick={() => { triggerSocialAction('pray', `${selectedRemotePeer.name}님과 함께 기도합니다 🙏`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">🙏 중보기도</button>
              <button onClick={() => { triggerSocialAction('dance', `${selectedRemotePeer.name}님과 함께 워십댄스! 💃🎶`); setSelectedRemotePeer(null); }} className="p-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer">💃 함께 워십</button>
            </div>
            {canPlayerBless && (
              <button onClick={() => { triggerHolyBenediction5F(`${playerName} 목사님`, selectedRemotePeer.name, [selectedRemotePeer.x || -0.2, 0, selectedRemotePeer.z || 3.2]); setSelectedRemotePeer(null); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                ✨ [{selectedRemotePeer.name}] 성도에게 축도 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {selectedChatNpc && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setSelectedChatNpc(null)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-orange-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><span className="text-[10.5px] font-bold text-orange-300 block">{selectedChatNpc.role}</span><h3 className="text-sm sm:text-base font-black">{selectedChatNpc.name}</h3></div>
              <button onClick={() => setSelectedChatNpc(null)} className="text-xs font-bold text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs leading-relaxed text-orange-100">"{chatReplyText}"</div>
            {selectedChatNpc.canBless && (
              <button onClick={() => { const pn = selectedChatNpc.name; setSelectedChatNpc(null); triggerHolyBenediction5F(pn, playerName, playerIdxRef.current); }} style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                ✨ [{selectedChatNpc.name}]께 소예배·애찬 축도 받기 🙏
              </button>
            )}
            {selectedChatNpc.isChef && (
              <button onClick={() => { setSelectedChatNpc(null); handleServeFoodTray(); }} style={{ backgroundColor: '#EA580C', color: '#FFFFFF' }} className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer">
                🍱 따뜻한 미역국·불고기 5구 식판 배식받기
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={() => { handleSitOnChair(CURVED_CHAIRS_5F[7]); setSelectedChatNpc(null); }} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-stone-950 font-black text-xs cursor-pointer">🪑 곡선 의자 앉기</button>
              <button onClick={() => { setSelectedChatNpc(null); handleServeFoodTray(); }} className="py-2.5 px-3 rounded-xl bg-white/10 text-amber-300 font-bold text-xs cursor-pointer">🍱 식판 받기</button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div style={{ backgroundColor: '#111827', color: '#FFFFFF' }} className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-black text-amber-300">{mediaMode === 'praise' ? '🎤 5층 찬양 링크 설정' : '✝️ 5층 말씀 링크 설정'}</span>
              <button onClick={() => setShowVideoModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <input type="text" value={editTitleInput} onChange={(e) => setEditTitleInput(e.target.value)} placeholder="영상 제목" className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none" />
            <input type="text" value={editUrlInput} onChange={(e) => setEditUrlInput(e.target.value)} placeholder="https://youtu.be/..." className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowVideoModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-zinc-300 font-bold text-xs cursor-pointer">취소</button>
              <button onClick={handleSaveYoutubeLink} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-stone-950 font-black text-xs cursor-pointer">TV에 상영</button>
            </div>
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
            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                {[
                  { fl: '1F', label: '1F 메인 로비 & 필로티 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 목양실 · 사무실' },
                  { fl: '3F', label: '3F 대예배당 본당' },
                  { fl: '4F', label: '4F 영유아 예배실 · 온돌 자모실' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실 (현재)' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반' },
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
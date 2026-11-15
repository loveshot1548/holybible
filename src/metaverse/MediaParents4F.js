// src/metaverse/MediaParents4F.js
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
// 🎵 사운드 신시사이저 (엘리베이터 차임벨 & 거룩한 축도 홀리라이트 오르간 화음)
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
// 🔗 유튜브 URL에서 11자리 Video ID 추출기 (매일예배 설교 & 찬양 듀얼 연동)
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
    const directKeys = [
      'daily_worship_video_url',
      'sermon_active_video_url',
      'app_active_gisangogi_url',
      'qt_active_video_url'
    ];
    for (const key of directKeys) {
      const val = localStorage.getItem(key);
      if (val && parseYoutubeId(val)) {
        return {
          url: val,
          id: parseYoutubeId(val),
          title: localStorage.getItem('daily_worship_video_title') || '3F 대예배당 담임목사님 설교 실시간 중계'
        };
      }
    }

    const sources = [];
    if (storeDailyData && typeof storeDailyData === 'object') sources.push(storeDailyData);
    ['qt_daily', 'dailyData', 'goodtree_daily_data', 'days_data'].forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        try { sources.push(JSON.parse(raw)); } catch (_) {}
      }
    });

    for (const parsed of sources) {
      const dates = Object.keys(parsed).sort().reverse();
      for (const d of dates) {
        const entry = parsed[d];
        if (!entry || typeof entry !== 'object') continue;
        const vUrl =
          entry.sermonVideoUrl ||
          entry.sermonVideoId ||
          entry.videoUrl ||
          entry.videoId ||
          entry.youtubeUrl ||
          entry.qtVideoUrl ||
          entry.url;
        if (vUrl && parseYoutubeId(String(vUrl))) {
          return {
            url: String(vUrl),
            id: parseYoutubeId(String(vUrl)),
            title: entry.sermonTitle || entry.qtTitle || entry.title || '주일 대예배 설교 실시간 중계'
          };
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
      return {
        url: praiseUrl,
        id: parseYoutubeId(praiseUrl),
        title: localStorage.getItem('praise_active_video_title') || '좋은나무 찬양단 (전도사님 인도) 경배와 찬양 중계'
      };
    }
    const synced = getSyncedSermonVideo(storeDailyData);
    if (synced && synced.id) {
      return {
        ...synced,
        title: '좋은나무 찬양단 (전도사님 인도) 경배와 찬양 중계'
      };
    }
  } catch (_) {}
  return {
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
    title: '좋은나무 찬양단 (전도사님 인도) 경배와 찬양 라이브'
  };
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (온돌 마루 · 안전매트 · 스틸 · 유리창 · 거울 · 타일)
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

function makeOndolWoodTexture(baseHex = '#F3DFC1', lineHex = '#D4B483') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = lineHex;
    ctx.lineWidth = 2;
    const plankH = h / 8;
    for (let r = 0; r <= 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * plankH);
      ctx.lineTo(w, r * plankH);
      ctx.stroke();

      const offset = (r % 2) * (w / 4);
      for (let c = 0; c <= 4; c++) {
        ctx.beginPath();
        ctx.moveTo((c * w) / 2 + offset, r * plankH);
        ctx.lineTo((c * w) / 2 + offset, (r + 1) * plankH);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 65; i++) {
      ctx.beginPath();
      const y = (i / 65) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + 4, w * 0.7, y - 4, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeOakWoodTexture(baseHex = '#D49552', lineHex = '#9C5E26') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 80; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 80) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.35, y + 5, w * 0.65, y - 5, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makePastelFolderMatTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const colors = ['#FEF9C3', '#FCE7F3', '#E0F2FE', '#DCFCE7'];
    const bandH = h / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, i * bandH, w, bandH);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.strokeRect(4, i * bandH + 2, w - 8, bandH - 4);
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

function makeClearGlassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
    grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.22)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    for (let x = -100; x < w + 100; x += 170) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 42, 0);
      ctx.lineTo(x - 58, h);
      ctx.lineTo(x - 100, h);
      ctx.closePath();
      ctx.fill();
    }
  }, 1024, 256);
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

function makeTileGridTexture(bgHex = '#8E939B', lineHex = '#6C717A', gridCount = 8) {
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
// 📍 4층 영유아 예배실(자모실) 7대 인터랙션 존 정의 (원본 위치 100% 보존!)
// =====================================================================
const ZONES_4F = [
  {
    id: 'zone_4f_elev',
    code: '01',
    subCode: '엘베',
    name: '4F 스테인리스 자동문 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F~6F 전 층 이동)',
    pos: [-0.2, 0, 4.3],
    isElevator: true,
    badge: '01 4F 엘리베이터',
    title: '🛗 4층 영유아 예배실(자모실) 스테인리스 자동문 엘리베이터',
    desc: '다가가면 "띵동~" 차임벨과 함께 스테인리스 양문이 열리며 1층 로비, 2층 북카페·목양실, 3층 대예배당, 5층 친교실, 6층 교육관으로 즉시 이동합니다.'
  },
  {
    id: 'zone_4f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 3F 본당 직결 계단실',
    prompt: '02 계단으로 층간 이동하기',
    pos: [-2.8, 0, 4.1],
    isElevator: true,
    badge: '02 4F 계단실',
    title: '🪜 3층 대예배당 및 전 층 연결 계단실 (좌측 하단)',
    desc: '바로 아래층인 3층 대예배당과 위층 교육관으로 연결되는 계단실입니다.'
  },
  {
    id: 'zone_4f_left_ondol',
    code: '03',
    subCode: '좌측마루',
    name: '좌측 온돌 마루 예배실 (책상 없는 안전매트 & 아기 침대·수유 케어존)',
    prompt: '03 좌측 온돌 마루 방석에 앉아 예배드리기',
    pos: [-2.6, 0, 0.2],
    seatTarget: { x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' },
    isSeatZone: true,
    badge: '03 좌측 온돌 마루',
    title: '👶 좌측 온돌 마루 예배실 & 영아 수유·낮잠 케어존',
    desc: '책상 없이 아기들이 안전하게 뒹굴 수 있는 파스텔 폴더매트와 등받이 좌식 방석, 아기 침대(회전 모빌 포함), 1인 수유 리클라이너 소파, 분유 포트·젖병 소독기 수납장이 완비되어 있습니다.'
  },
  {
    id: 'zone_4f_right_ondol',
    code: '04',
    subCode: '우측마루',
    name: '우측 온돌 마루 예배실 (유아 플레이 매트 · 미끄럼틀 · 흔들목마)',
    prompt: '04 우측 온돌 마루 방석에 앉아 예배드리기',
    pos: [2.2, 0, 0.2],
    seatTarget: { x: 1.75, z: 0.45, rotY: Math.PI, rowLabel: '4F 우측 온돌 마루 예배석' },
    isSeatZone: true,
    badge: '04 우측 온돌 마루',
    title: '🧸 우측 온돌 마루 예배실 & 유아 소프트 플레이존',
    desc: '유리 파티션 우측에 분리된 온돌 마루 예배 공간입니다. 파스텔 유아 미끄럼틀, 꽃잎 놀이매트와 흔들목마, 그림책 교구장이 있어 유아들과 함께 편안히 예배드릴 수 있습니다.'
  },
  {
    id: 'zone_4f_front_glass',
    code: '05',
    subCode: '통유리·TV',
    name: '전면 3F 본당 조망 통유리창 & 코너 중계 TV',
    prompt: '05 전면 통유리창 & 본당 라이브 중계 TV 켜기',
    pos: [-1.2, 0, -2.6],
    isTvZone: true,
    badge: '05 전면 통유리·TV',
    title: '🪟 전면 방음 통유리창 (3F 본당 내려다보기) & 실시간 중계 TV',
    desc: '전면 대형 방음 통유리창을 통해 아래쪽 3층 대예배당 강단과 우물천장이 한눈에 내려다보이며, 좌·우 코너의 대형 벽걸이 TV로 말씀과 찬양이 실시간 중계됩니다.'
  },
  {
    id: 'zone_4f_partition',
    code: '06',
    subCode: '파티션·축도',
    name: '중앙 방음 유리 파티션 & 영유아 자녀 축도(홀리라이트)',
    prompt: '06 최수경 목사님 자녀·가정 축도(홀리라이트) 받기',
    pos: [-0.15, 0, 1.1],
    isBlessingZone: true,
    badge: '06 자녀축도·파티션',
    title: '✨ 좌·우 온돌 마루 연결 도어 & 영유아부 자녀 축도(홀리라이트)',
    desc: '신생아 구역(좌측)과 유아 구역(우측)을 연결하는 중앙 파티션 도어 앞에서 최수경·이성현·방희곤 목사님께 우리 아기와 가정을 위한 거룩한 축도(홀리라이트)를 받을 수 있습니다.'
  },
  {
    id: 'zone_4f_restroom',
    code: '07',
    subCode: '기저귀·화장실',
    name: '우측 하단 기저귀 교환대 & 호텔급 전용 화장실',
    prompt: '07 기저귀 교환실 및 화장실 이동',
    pos: [3.2, 0, 3.5],
    roomTarget: [3.5, 3.5],
    badge: '07 화장실·기저귀교환',
    title: '🍼 유아 전용 기저귀 교환대 & 2층급 고품격 파우더룸 화장실 (우측 하단)',
    desc: '안전벨트 매트가 장착된 기저귀 교환대, 옐로우 포인트 세면대와 대형 거울, 아이보리 도어 & 실버 잠금쇠 큐비클 부스 2칸, 벽걸이 곡면 핸드드라이어가 완비된 위생 공간입니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체 · 중앙 파티션 · 가구 실시간 물리 충돌(AABB) & 문 통과 네비게이션 (원본 100% 보존!)
// =====================================================================
const SOLID_WALL_BOXES_4F = [
  { minX: -0.35, maxX: 0.05, minZ: -4.2, maxZ: 0.70 },
  { minX: -0.35, maxX: 0.05, minZ: 1.98, maxZ: 2.35 },
  { minX: -6.3, maxX: -4.6, minZ: -1.8, maxZ: 2.0 },
  { minX: -6.5, maxX: -3.25, minZ: 2.15, maxZ: 2.55 },
  { minX: 2.15, maxX: 6.5, minZ: 2.05, maxZ: 2.45 },
  { minX: 1.95, maxX: 2.35, minZ: 2.1, maxZ: 2.95 },
  { minX: 1.95, maxX: 2.35, minZ: 4.05, maxZ: 6.0 },
  { minX: -1.8, maxX: 1.4, minZ: 4.9, maxZ: 6.5 }
];

function resolveCollision4F(nx, nz, radius = 0.26) {
  let x = Math.max(-5.9, Math.min(5.9, nx));
  let z = Math.max(-3.3, Math.min(4.8, nz));

  for (const box of SOLID_WALL_BOXES_4F) {
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

function computeSmartPath4F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision4F(rawEx, rawEz);
  const waypoints = [];

  const startInRestroom = sx > 2.15 && sz > 2.25;
  const endInRestroom = ex > 2.15 && ez > 2.25;

  if (startInRestroom && !endInRestroom) {
    waypoints.push([2.7, 3.5]);
    waypoints.push([1.4, 3.5]);
  }

  const curX = waypoints.length > 0 ? waypoints[waypoints.length - 1][0] : sx;
  const curZ = waypoints.length > 0 ? waypoints[waypoints.length - 1][1] : sz;

  if ((curX + 0.15) * (ex + 0.15) < 0 && (curZ < 2.2 || ez < 2.2)) {
    waypoints.push([-0.15, 1.45]);
  }

  if (!startInRestroom && endInRestroom) {
    waypoints.push([1.4, 3.5]);
    waypoints.push([2.7, 3.5]);
  }

  waypoints.push([ex, ez]);
  return waypoints;
}

// =====================================================================
// 👥 4층 자모실 엄마·아빠 성도 & 아기들 & 최수경 목사님 NPC
// =====================================================================
const NPCS_4F = [
  {
    id: 'pastor_choi_4f',
    name: '최수경 목사님 (영유아부)',
    role: '영유아부 담당목사 · 자녀 축복기도',
    isPastor: true,
    canBless: true,
    x: -0.65,
    y: 0.04,
    z: -2.15,
    rotY: 0.15,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    autoWave: true,
    shirt: '#8B5CF6',
    pants: '#EDE9FE',
    hair: '#3F2305',
    dialogues: [
      '사랑하는 아기와 부모님들 축복합니다! 따뜻한 온돌 마루 자모실에 오신 걸 환영해요 🥰',
      '저를 클릭하시면 우리 아이와 가정을 위한 [✨ 거룩한 축도(홀리라이트)]를 받으실 수 있어요 🙏',
      '정면 통유리창으로 3층 본당도 내려다보이고 코너 TV로 실시간 예배도 함께 드릴 수 있습니다!'
    ]
  },
  {
    id: 'mom_left_1',
    name: '김집사 (아기엄마)',
    role: '영아부 자모실 성도',
    x: -3.55,
    y: 0.04,
    z: -0.55,
    rotY: Math.PI,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: [
      '통유리창 너머로 3층 본당 강대상이랑 우물천장이 한눈에 내려다보여서 현장감이 최고예요 😊',
      '책상이 없고 폭신한 안전매트와 좌식 방석만 있어서 아기가 마음껏 기어 다녀도 안심이에요!'
    ]
  },
  {
    id: 'dad_left_1',
    name: '이성도 (아기아빠)',
    role: '새가족 젊은부부 성도',
    x: -2.25,
    y: 0.04,
    z: -1.55,
    rotY: Math.PI,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '아기가 울어도 방음 통유리창 덕분에 마음 편히 코너 중계 TV로 말씀에 집중할 수 있네요 🙏',
      '뒤쪽에 수유 소파랑 아기 침대, 젖병 소독기까지 다 있어서 정말 편리합니다!'
    ]
  },
  {
    id: 'mom_right_1',
    name: '박자매 (유아엄마)',
    role: '유아부 자모실 성도',
    x: 1.75,
    y: 0.04,
    z: -1.55,
    rotY: Math.PI,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#FACC15',
    pants: '#FEF08A',
    hair: '#78350F',
    dialogues: [
      '우측 마루는 놀이매트랑 미끄럼틀, 흔들목마가 있어서 아이가 놀면서 예배드리기 딱 좋아요 🧸',
      '할렐루야! 다음세대 아기들과 부모님들을 배려해 주신 사랑의 공간입니다 🥰'
    ]
  },
  {
    id: 'usher_4f',
    name: '최권사 (자모실 섬김이)',
    role: '4층 영유아 자모실 안내위원',
    x: -0.95,
    y: 0.04,
    z: 1.35,
    patrolZ: [0.4, 2.2],
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    autoWave: true,
    shirt: '#10B981',
    pants: '#D1FAE5',
    hair: '#451A03',
    dialogues: [
      '할렐루야! 아기와 함께 오신 부모님들 4층 온돌 자모실에 오신 것을 환영합니다 🌺',
      '오른쪽 아래 화장실에 기저귀 교환대와 핸드드라이어, 유아 세면대가 깨끗하게 준비되어 있어요!'
    ]
  },
  {
    id: 'baby_left',
    name: '하은이 (영아)',
    role: '예수님의 사랑받는 아기',
    x: -3.05,
    y: 0.04,
    z: -0.45,
    rotY: 0.4,
    isBaby: true,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#FDE047',
    pants: '#FFFFFF',
    hair: '#5C3A21',
    dialogues: [
      '까르르~ 엄마 아빠랑 따뜻한 온돌 매트 위에서 찬양 들으니까 너무 좋아요 🍼✨'
    ]
  },
  {
    id: 'baby_right',
    name: '하준이 (유아)',
    role: '예수님의 꿈나무 유아',
    x: 2.35,
    y: 0.04,
    z: 1.15,
    rotY: -0.6,
    isBaby: true,
    autoWave: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#60A5FA',
    pants: '#FEF08A',
    hair: '#451A03',
    dialogues: [
      '미끄럼틀이랑 흔들목마도 타고 그림책도 보면서 예수님 사랑 배워요 🧸🎵'
    ]
  }
];

// =====================================================================
// ✨ 축도(Benediction) 시 하늘에서 내려쬐는 홀리라이트(Holy Light) 이펙트
// =====================================================================
function HolyLightBeamEffect4F({ targetPos, pastorName, targetName }) {
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
      ctx.fillText(`✝️ ${pastorName || '최수경 목사님'}의 영유아·가정 축도`, w / 2, 46);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 27px serif';
      ctx.fillText(`${targetName} 가정과 아기 위에 지혜와 키가 자라가는`, w / 2, 88);
      ctx.fillText(`하늘의 신령한 복이 영원히 함께할지어다! 아멘 🙏`, w / 2, 126);
    }, 640, 156);
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
    <group position={[targetPos[0], 0.08, targetPos[2]]}>
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
          <planeGeometry args={[2.5, 0.62]} />
          <meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 👁️ 카메라 회전 시 외벽 자동 투명화 컴포넌트
// =====================================================================
function SmartCutawayWall4F({ wallSide, minOpacity = 0.08, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 4.0) shouldFade = true;
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

// =====================================================================
// 🟢 바닥 초록색 홀로그램 마커
// =====================================================================
function HologramMarker4F({ zone, isSelected, onSelect }) {
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
// 🚶‍♀️ 3D 유선형 아바타 (원격 보간 + 아기 어르기·율동·기도·축도 모션 탑재)
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

function CharacterHairStyle4F({ style = 'short', hairColor = '#27272A' }) {
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

function SmoothChibiAvatar4F({
  position = [0, 0, 0],
  targetPosition = null,
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isBaby = false,
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
        outerGroupRef.current.position.y = targetPosition[1] || 0;
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
        leftLegRef.current.position.set(-0.085, 0.22, 0.10);
        rightLegRef.current.position.set(0.085, 0.22, 0.10);
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 13.0) * 0.6;
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
      } else if (emote === 'pray') {
        leftArmRef.current.rotation.x = -1.15;
        rightArmRef.current.rotation.x = -1.15;
        leftArmRef.current.rotation.z = -0.42;
        rightArmRef.current.rotation.z = 0.42;
      } else if (emote === 'lullaby') {
        leftArmRef.current.rotation.x = -1.0 + Math.sin(t * 5) * 0.14;
        rightArmRef.current.rotation.x = -1.0 - Math.sin(t * 5) * 0.14;
        leftArmRef.current.rotation.z = -0.35;
        rightArmRef.current.rotation.z = 0.35;
      } else if (emote === 'dance') {
        leftArmRef.current.rotation.z = 2.4 + Math.sin(t * 12) * 0.45;
        rightArmRef.current.rotation.z = -2.4 + Math.cos(t * 12) * 0.45;
        leftArmRef.current.rotation.x = 0.2;
        rightArmRef.current.rotation.x = 0.2;
      } else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
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
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.15 : 0;
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (isSeated ? -0.05 : 0) + bounce + jump;
      rootRef.current.position.z = isSeated ? 0.02 : 0;
    }
  });

  const avatarScale = isBaby ? 0.64 : 1.0;

  return (
    <group
      ref={outerGroupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={[avatarScale, avatarScale, avatarScale]}
      onClick={onClick}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.22} />
      </mesh>

      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
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

          <CharacterHairStyle4F
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

function RemoteMultiplayerAvatar4F({ peer, onClickPeer }) {
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

  const py = (peer.z ?? 0.45) < 2.2 ? 0.08 : 0.0;

  return (
    <SmoothChibiAvatar4F
      position={[peer.x || -2.25, py, peer.z || 0.45]}
      targetPosition={[peer.x || -2.25, py, peer.z || 0.45]}
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
      onClick={(e) => {
        e.stopPropagation();
        if (onClickPeer) onClickPeer(peer);
      }}
    />
  );
}

// =====================================================================
// 🧸 [요구사항 1 완벽 반영] 책상을 완전히 없앤 순수 온돌 좌식 방석 & 아기 수유 쿠션 세트!
// =====================================================================
function CushionOnlyOndolSet({ position, cushionColor = '#F472B6', isSelected, onClick }) {
  return (
    <group position={position} onClick={onClick}>
      {/* 앞쪽(-Z): 책상 대신 아기가 눕거나 기댈 수 있는 도넛형 수유/아기 쿠션 & 딸랑이 장난감 & 젖병 */}
      <group position={[0, 0, -0.38]}>
        <mesh position={[-0.12, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.14, 0.045, 12, 24]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.5} />
        </mesh>
        {/* 아기 젖병 */}
        <mesh position={[0.20, 0.05, 0.04]} castShadow>
          <cylinderGeometry args={[0.026, 0.03, 0.10, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.20, 0.11, 0.04]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
      </group>

      {/* 뒤쪽(+Z): 폭신한 퀼팅 좌식 방석 & 등받이 좌식 의자(Zaisu) */}
      <group position={[0, 0, 0]}>
        <RoundedBox
          args={[0.64, 0.08, 0.56]}
          position={[0, 0.04, 0]}
          radius={0.03}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={isSelected ? '#FACC15' : cushionColor} roughness={0.48} />
        </RoundedBox>
        <RoundedBox
          args={[0.62, 0.34, 0.08]}
          position={[0, 0.22, 0.24]}
          rotation={[0.15, 0, 0]}
          radius={0.03}
          castShadow
        >
          <meshStandardMaterial color={isSelected ? '#FACC15' : cushionColor} roughness={0.48} />
        </RoundedBox>
      </group>
    </group>
  );
}

// 🛏️ 원목 살대와 모빌이 달린 초디테일 아기 침대(Baby Crib)
function DetailedBabyCrib({ position, oakTex }) {
  const mobileRef = useRef();
  useFrame((_, delta) => {
    if (mobileRef.current) {
      mobileRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={position}>
      <RoundedBox args={[1.15, 0.14, 1.65]} position={[0, 0.22, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial map={oakTex} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.02, 0.10, 1.52]} position={[0, 0.32, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" />
      </RoundedBox>
      <RoundedBox args={[0.98, 0.05, 0.95]} position={[0, 0.36, 0.22]} radius={0.02}>
        <meshStandardMaterial color="#A7F3D0" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.06, 0.28]} position={[0, 0.38, -0.46]} radius={0.03}>
        <meshStandardMaterial color="#FEF08A" />
      </RoundedBox>

      {[-0.80, 0.80].map((cz, ci) => (
        <RoundedBox key={ci} args={[1.15, 0.78, 0.06]} position={[0, 0.45, cz]} radius={0.02} castShadow>
          <meshStandardMaterial map={oakTex} roughness={0.35} />
        </RoundedBox>
      ))}

      {[-0.54, 0.54].map((cx, side) => (
        <group key={side} position={[cx, 0, 0]}>
          <RoundedBox args={[0.05, 0.06, 1.60]} position={[0, 0.78, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((sz, si) => (
            <mesh key={si} position={[0, 0.52, sz]} castShadow>
              <cylinderGeometry args={[0.014, 0.014, 0.52, 8]} />
              <meshStandardMaterial color="#FDFBF7" />
            </mesh>
          ))}
        </group>
      ))}

      <group position={[-0.52, 0.78, -0.25]}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.56, 8]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <group ref={mobileRef} position={[0.25, 0.52, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.38, 8]} />
            <meshStandardMaterial color="#FACC15" />
          </mesh>
          {[
            [-0.16, -0.14, 0, '#F472B6'],
            [0.16, -0.14, 0, '#38BDF8'],
            [0, -0.16, 0.16, '#FDE047'],
            [0, -0.16, -0.16, '#4ADE80']
          ].map(([mx, my, mz, mcol], mi) => (
            <mesh key={mi} position={[mx, my, mz]} castShadow>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color={mcol} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// 유아용 파스텔 미끄럼틀 (우측 마루 놀이존 추가 디테일)
function ToddlerPastelSlide4F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.24, 0.24].map((sx, si) => (
        <RoundedBox key={si} args={[0.05, 0.62, 1.15]} position={[sx, 0.31, 0]} radius={0.06} castShadow>
          <meshStandardMaterial color="#F9A8D4" roughness={0.35} />
        </RoundedBox>
      ))}
      {[0.16, 0.32, 0.48].map((sy, idx) => (
        <RoundedBox key={idx} args={[0.42, 0.04, 0.14]} position={[0, sy, -0.44 + idx * 0.12]} radius={0.01}>
          <meshStandardMaterial color="#FDE047" />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.42, 0.04, 0.96]} position={[0, 0.31, 0.16]} rotation={[0.48, 0, 0]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#38BDF8" roughness={0.2} />
      </RoundedBox>
    </group>
  );
}

function DetailedMiniatureToilet4F({ position, rotationY = 0 }) {
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

// 🛗 하단 중앙(`[-0.2, 0, 5.25]`) 브러시드 스테인리스 자동 개폐 엘리베이터
function AnimatedStainlessElevator4F({ position, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);

  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const oakTex = useMemo(() => makeOakWoodTexture('#D49552', '#9C5E26'), []);

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
        <meshBasicMaterial color="#10B981" />
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

// =====================================================================
// 🏛️ 4층 영유아 예배실(자모실) 전체 디오라마 씬 (기존 시설 구조 100% 보존!)
// =====================================================================
function FourFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnMat,
  onOpenSermonTv,
  onSelectNpcForChat,
  sermonTitle,
  activeNpcChatIdx,
  showRoomSigns,
  playerIdxRef,
  isElevatorModalOpen,
  remotePeers,
  onSelectRemotePeer,
  holyLightEvent
}) {
  const ondolTex = useMemo(() => makeOndolWoodTexture('#F4E2C6', '#D9BA8C'), []);
  const oakTex = useMemo(() => makeOakWoodTexture('#D49552', '#9C5E26'), []);
  const folderMatTex = useMemo(() => makePastelFolderMatTexture(), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const greyRestroomTileTex = useMemo(() => makeTileGridTexture('#8E939B', '#6C717A', 8), []);

  const liveTvTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(1, '#090D16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 110, 28, 220, 36, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('● LIVE · 3F 본당 예배 중계', w / 2, 52);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 40px serif';
      ctx.fillText(sermonTitle || '주일 대예배 실황', w / 2, 130);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶ TV 또는 방석을 클릭하면 예배 영상이 켜집니다', w / 2, 195);
    }, 512, 256);
  }, [sermonTitle]);

  const signs = useMemo(() => ({
    frontGlass: makeRoomSignTexture('전면 통유리창 (↓3F본당)', '아래층 3F 대예배당 실시간 조망', '#0284C7'),
    leftOndol: makeRoomSignTexture('좌측 온돌 마루', '영아 안전매트 · 아기침대 · 수유존', '#EC4899'),
    rightOndol: makeRoomSignTexture('우측 온돌 마루', '유아 안전매트 · 미끄럼틀 · 놀이존', '#F59E0B'),
    partition: makeRoomSignTexture('중앙 유리 파티션', '좌·우 마루 방음 분리 도어', '#10B981'),
    restroom: makeRoomSignTexture('화장실 · 기저귀교환 🍼', '큐비클 부스 · 핸드드라이어 · 세면대', '#6366F1'),
    stairs: makeRoomSignTexture('4F 계단실', '3F 대예배당 직결 계단', '#64748B'),
    elevator: makeRoomSignTexture('4F 엘리베이터 🛗', '자동문 개폐 · 전 층(1F~6F) 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 4층 전체 베이스 바닥 & 남쪽 복도 (원본 크기 및 좌표 100% 보존) */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>

      {/* 좌·우 따뜻한 온돌 마루 바닥 데크 (높이 +0.04m, 원본 위치 그대로!) */}
      <RoundedBox args={[12.8, 0.08, 6.2]} position={[0, 0.04, -0.9]} radius={0.02} receiveShadow>
        <meshStandardMaterial map={ondolTex} roughness={0.38} />
      </RoundedBox>
      <RoundedBox args={[12.8, 0.09, 0.18]} position={[0, 0.045, 2.2]} radius={0.01} castShadow>
        <meshStandardMaterial map={oakTex} />
      </RoundedBox>

      {/* ================================================================= */}
      {/* 🪟 [원본 100% 유지] 북쪽 전면 방음 통유리창 & 3층 본당 입체 조망 뷰박스 & 코너 TV 2대 */}
      {/* ================================================================= */}
      <group position={[0, 0, -4.05]}>
        <group position={[0, 0, -1.65]}>
          <RoundedBox args={[13.6, 4.4, 0.2]} position={[0, 0.6, -1.1]} radius={0.02}>
            <meshStandardMaterial color="#452712" roughness={0.6} />
          </RoundedBox>
          {Array.from({ length: 28 }).map((_, i) => (
            <RoundedBox
              key={`b3_slat_${i}`}
              args={[0.12, 4.2, 0.08]}
              position={[-5.4 + i * 0.4, 0.6, -0.98]}
              radius={0.01}
            >
              <meshStandardMaterial map={oakTex} />
            </RoundedBox>
          ))}
          <RoundedBox args={[3.8, 1.75, 0.08]} position={[0, 1.15, -0.88]} radius={0.02}>
            <meshBasicMaterial map={liveTvTex} />
          </RoundedBox>
          <RoundedBox args={[8.4, 0.25, 1.4]} position={[0, -0.95, -0.3]} radius={0.02}>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <RoundedBox args={[0.95, 0.75, 0.5]} position={[0, -0.45, -0.2]} radius={0.02}>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <mesh position={[0, 2.55, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.6, 0.12, 16, 48]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0, 2.58, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.09, 16, 48]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.8} />
          </mesh>
        </group>

        <RoundedBox args={[12.8, 0.58, 0.36]} position={[0, 0.32, 0.12]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={oakTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[12.9, 0.06, 0.44]} position={[0, 0.62, 0.12]} radius={0.015} castShadow>
          <meshStandardMaterial color="#9C5E26" />
        </RoundedBox>

        {[-6.3, -3.15, -0.15, 3.15, 6.3].map((gx, gi) => (
          <RoundedBox key={gi} args={[0.14, 2.15, 0.16]} position={[gx, 1.68, 0]} radius={0.01} castShadow>
            <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.3} />
          </RoundedBox>
        ))}
        <RoundedBox args={[12.8, 0.14, 0.18]} position={[0, 2.72, 0]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 1.68, 0]}>
          <planeGeometry args={[12.6, 1.98]} />
          <meshBasicMaterial map={glassTex} transparent opacity={0.78} />
        </mesh>

        {/* 좌측 마루 & 우측 마루 코너 65인치 중계 벽걸이 TV 2대 (원본 위치 100% 보존) */}
        {[
          [-4.85, 1.62, 0.55, 0.38],
          [1.45, 1.62, 0.55, 0.35]
        ].map(([tvX, tvY, tvZ, tvRot], ti) => (
          <group
            key={`corner_tv_${ti}`}
            position={[tvX, tvY, tvZ]}
            rotation={[0.08, tvRot, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSermonTv) onOpenSermonTv();
            }}
          >
            <RoundedBox args={[1.85, 1.02, 0.07]} radius={0.02} castShadow>
              <meshStandardMaterial color="#090A0F" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[1.74, 0.92]} />
              <meshBasicMaterial map={liveTvTex} />
            </mesh>
          </group>
        ))}

        {showRoomSigns && (
          <Billboard position={[-1.6, 2.55, 0.2]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onOpenSermonTv) onOpenSermonTv(); }}>
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs.frontGlass} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚪 [구역 2: 중앙 방음 유리 파티션 & 원목 출입문] (X = -0.15 원본 위치 그대로!) */}
      {/* ================================================================= */}
      <group position={[-0.15, 0.08, 0]}>
        <RoundedBox args={[0.14, 0.95, 4.6]} position={[0, 0.48, -1.6]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[0.16, 1.45, 0.14]} position={[0, 1.68, -3.85]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <RoundedBox args={[0.16, 1.45, 0.14]} position={[0, 1.68, 0.68]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.12, 4.6]} position={[0, 2.38, -1.6]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <mesh position={[0, 1.66, -1.6]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.4, 1.38]} />
          <meshBasicMaterial map={glassTex} transparent opacity={0.72} />
        </mesh>

        <RoundedBox
          args={[0.08, 1.85, 0.92]}
          position={[0.22, 0.92, 1.15]}
          rotation={[0, 0.48, 0]}
          radius={0.015}
          castShadow
        >
          <meshStandardMaterial map={oakTex} />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 2.05, -0.5]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.partition} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 👶 [구역 3: 좌측 온돌 마루 — 책상 제거 + 파스텔 유아 폴더매트 + 좌식 방석 + 아기침대 + 수유 소파 + 젖병소독기] */}
      {/* ================================================================= */}
      <group position={[0, 0.08, 0]}>
        {/* 좌측 마루 중앙 도톰한 파스텔 4단 유아 안전 폴더매트 */}
        <RoundedBox args={[3.4, 0.025, 3.6]} position={[-2.9, 0.012, -0.55]} radius={0.015} receiveShadow>
          <meshStandardMaterial map={folderMatTex} roughness={0.45} />
        </RoundedBox>

        {/* 책상 없이 푹신한 좌식 등받이 방석과 아기 수유 쿠션만 배치된 6석 */}
        {[-1.55, -0.55, 0.45].map((rz, rIdx) =>
          [-3.55, -2.25].map((cx, cIdx) => {
            const colors = ['#F472B6', '#38BDF8', '#4ADE80', '#FACC15', '#A78BFA', '#FB923C'];
            const cCol = colors[(rIdx * 2 + cIdx) % colors.length];
            const isSel = seatedInfo && Math.hypot(seatedInfo.x - cx, seatedInfo.z - rz) < 0.3;
            return (
              <CushionOnlyOndolSet
                key={`left_mat_${rIdx}_${cIdx}`}
                position={[cx, 0.02, rz]}
                cushionColor={cCol}
                isSelected={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnMat({ x: cx, z: rz, rotY: Math.PI, rowLabel: `4F 좌측 온돌마루 ${rIdx + 1}열 방석` });
                }}
              />
            );
          })
        )}

        {/* 좌측 하단 코너: 원목 아기 침대(모빌 회전) */}
        <DetailedBabyCrib position={[-5.35, 0, 0.95]} oakTex={oakTex} />

        {/* 좌측 중단 코너: 엄마들을 위한 폭신한 1인용 크림색 수유 소파 */}
        <group
          position={[-5.45, 0, -2.55]}
          rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSitOnMat({ x: -5.45, z: -2.55, rotY: Math.PI / 4, rowLabel: '4F 좌측 마루 수유 소파' });
          }}
        >
          <RoundedBox args={[0.76, 0.24, 0.70]} position={[0, 0.18, 0]} radius={0.08} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFBEB" roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[0.72, 0.50, 0.16]} position={[0, 0.48, -0.25]} rotation={[-0.15, 0, 0]} radius={0.08} castShadow>
            <meshStandardMaterial color="#FFFBEB" roughness={0.45} />
          </RoundedBox>
        </group>

        {/* 서쪽 벽면 수유용 젖병소독기·분유포트·기저귀 원목 선반장 */}
        <group position={[-5.65, 0, -1.15]}>
          <RoundedBox args={[0.58, 0.82, 1.55]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.62, 0.06, 1.62]} position={[0, 0.84, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <RoundedBox args={[0.36, 0.42, 0.38]} position={[0.04, 1.08, -0.35]} radius={0.02} castShadow>
            <meshStandardMaterial color="#A7F3D0" roughness={0.3} />
          </RoundedBox>
          <mesh position={[0.04, 1.02, 0.32]} castShadow>
            <cylinderGeometry args={[0.10, 0.12, 0.28, 16]} />
            <meshStandardMaterial color="#FEF08A" />
          </mesh>
        </group>

        {showRoomSigns && (
          <Billboard position={[-2.9, 1.55, 0.2]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.leftOndol} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🧸 [구역 4: 우측 온돌 마루 — 책상 제거 + 유아 안전매트 + 좌식 방석 + 미끄럼틀 + 흔들목마 + 그림책장] */}
      {/* ================================================================= */}
      <group position={[0, 0.08, 0]}>
        {/* 우측 마루 중앙 도톰한 파스텔 4단 유아 안전 폴더매트 */}
        <RoundedBox args={[3.4, 0.025, 3.6]} position={[2.4, 0.012, -0.55]} radius={0.015} receiveShadow>
          <meshStandardMaterial map={folderMatTex} roughness={0.45} />
        </RoundedBox>

        {/* 책상 없이 푹신한 좌식 등받이 방석과 아기 쿠션만 배치된 6석 */}
        {[-1.55, -0.55, 0.45].map((rz, rIdx) =>
          [1.75, 3.05].map((cx, cIdx) => {
            const colors = ['#FACC15', '#F472B6', '#34D399', '#38BDF8', '#FB923C', '#A78BFA'];
            const cCol = colors[(rIdx * 2 + cIdx) % colors.length];
            const isSel = seatedInfo && Math.hypot(seatedInfo.x - cx, seatedInfo.z - rz) < 0.3;
            return (
              <CushionOnlyOndolSet
                key={`right_mat_${rIdx}_${cIdx}`}
                position={[cx, 0.02, rz]}
                cushionColor={cCol}
                isSelected={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnMat({ x: cx, z: rz, rotY: Math.PI, rowLabel: `4F 우측 온돌마루 ${rIdx + 1}열 방석` });
                }}
              />
            );
          })
        )}

        {/* 우측 상단 코너: 유아용 파스텔 코끼리 미끄럼틀 */}
        <ToddlerPastelSlide4F position={[4.55, 0, -2.15]} rotationY={-Math.PI / 4} />

        {/* 우측 하단 유아 소프트 플레이 매트 & 흔들목마 & 블록 장난감 */}
        <group position={[2.35, 0, 1.35]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <circleGeometry args={[0.92, 36]} />
            <meshStandardMaterial color="#FEF9C3" roughness={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
            <circleGeometry args={[0.62, 32]} />
            <meshStandardMaterial color="#F472B6" roughness={0.5} />
          </mesh>
          <group position={[-0.35, 0.02, 0.1]} rotation={[0, 0.5, 0]}>
            {[-0.10, 0.10].map((rx, i) => (
              <RoundedBox key={i} args={[0.035, 0.04, 0.54]} position={[rx, 0.03, 0]} radius={0.015} castShadow>
                <meshStandardMaterial color="#F59E0B" />
              </RoundedBox>
            ))}
            <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.18, 12, 16]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>
            <mesh position={[0, 0.30, 0.12]} rotation={[-0.35, 0, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.14, 12, 16]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>
          </group>
        </group>

        {/* 동쪽 벽면 유아 그림책 & 장난감 교구장 */}
        <group position={[5.65, 0, -0.4]}>
          <RoundedBox args={[0.42, 0.92, 2.2]} position={[0, 0.46, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {[-0.7, -0.2, 0.3, 0.75].map((bz, bi) => (
            <RoundedBox key={bi} args={[0.28, 0.24, 0.28]} position={[-0.05, 0.65, bz]} radius={0.015}>
              <meshStandardMaterial color={['#38BDF8', '#F43F5E', '#FACC15', '#4ADE80'][bi]} />
            </RoundedBox>
          ))}
        </group>

        {showRoomSigns && (
          <Billboard position={[3.0, 1.55, 0.2]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.rightOndol} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🍼 [구역 5: 우측 하단 기저귀 교환대 & 화장실 (`[4.15, 0, 3.85]` 원본 위치 그대로! 내부만 2층급 정교화!)] */}
      {/* ================================================================= */}
      <group position={[4.15, 0, 3.85]}>
        {/* 2층 화장실과 동일한 그레이 포세린 타일 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.9, 3.2]} />
          <meshStandardMaterial map={greyRestroomTileTex} roughness={0.32} />
        </mesh>

        {/* 1) 북쪽 벽면: 아기 기저귀 교환대(폭신한 안전 가드 매트 + 물티슈·로션) & 2층형 옐로우 포인트 거울 세면대 */}
        <group position={[-0.45, 0, -1.22]}>
          {/* 기저귀 교환 스테이션 */}
          <RoundedBox args={[0.92, 0.76, 0.58]} position={[-0.55, 0.38, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FEF9C3" />
          </RoundedBox>
          <RoundedBox args={[0.84, 0.08, 0.52]} position={[-0.55, 0.80, 0]} radius={0.03} castShadow>
            <meshStandardMaterial color="#FBCFE8" />
          </RoundedBox>
          <RoundedBox args={[0.18, 0.07, 0.12]} position={[-0.82, 0.86, -0.1]} radius={0.015}>
            <meshStandardMaterial color="#38BDF8" />
          </RoundedBox>

          {/* 2층 화장실 스타일 화이트 세면대 카운터 & 옐로우 보울 포인트 & 밝은 크리스탈 거울 */}
          <RoundedBox args={[1.35, 0.74, 0.54]} position={[0.68, 0.37, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
          </RoundedBox>
          <RoundedBox args={[1.15, 0.02, 0.36]} position={[0.68, 0.745, 0.02]} radius={0.01}>
            <meshBasicMaterial color="#FACC15" />
          </RoundedBox>
          <mesh position={[0.68, 1.18, -0.24]}>
            <planeGeometry args={[1.25, 0.76]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
          {[0.35, 1.0].map((sx, si) => (
            <group key={si} position={[sx, 0.75, 0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.16, 0.12, 0.07, 24]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.12, 0.10, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              <mesh position={[0, 0.08, -0.15]}>
                <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 동쪽 안쪽: 2층 화장실과 동일한 그레이 포스트 & 아이보리 도어(실버 가로 띠 잠금쇠 포함) 양변기 큐비클 부스 2칸 */}
        {[-0.45, 0.55].map((bz, bi) => (
          <group key={bi} position={[1.15, 0, bz]}>
            {/* 부스 칸막이 측벽 */}
            <RoundedBox args={[1.15, 1.58, 0.04]} position={[0, 0.79, -0.46]} radius={0.01} castShadow>
              <meshStandardMaterial color="#C8BFA8" roughness={0.4} />
            </RoundedBox>
            {/* 전면 그레이 필라 기둥 */}
            <RoundedBox args={[0.05, 1.58, 0.16]} position={[-0.55, 0.79, -0.38]} radius={0.008} castShadow>
              <meshStandardMaterial color="#9CA3AF" metalness={0.3} roughness={0.4} />
            </RoundedBox>
            {/* 아이보리 화이트 도어 + 중앙 실버 메탈 가로 띠 & 원형 잠금 손잡이 */}
            <group position={[-0.55, 0.78, 0.05]} rotation={[0, 0.32, 0]}>
              <RoundedBox args={[0.04, 1.52, 0.72]} radius={0.008} castShadow receiveShadow>
                <meshStandardMaterial color="#FAF8F5" roughness={0.25} />
              </RoundedBox>
              <RoundedBox args={[0.045, 0.10, 0.725]} position={[0, -0.05, 0]} radius={0.004}>
                <meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.25} />
              </RoundedBox>
              <mesh position={[-0.03, -0.05, 0.26]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshStandardMaterial color="#27272A" metalness={0.8} />
              </mesh>
            </group>
            <DetailedMiniatureToilet4F position={[0.20, 0, 0]} rotationY={-Math.PI / 2} />
          </group>
        ))}

        {/* 3) 서쪽 안쪽 벽면: 화이트 곡면 자동 핸드드라이어(에어타월) & 2구 벽면 콘센트 */}
        <group position={[-1.82, 1.05, 0.85]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.30, 0.34, 0.16]} radius={0.08} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
          </RoundedBox>
          <mesh position={[0, 0.02, 0.085]}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
          <RoundedBox args={[0.09, 0.14, 0.02]} position={[0.25, 0.04, -0.05]} radius={0.01}>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
        </group>

        {/* 화장실 경계 내벽 & 출입문 (원본 좌표 100% 보존!) */}
        <RoundedBox args={[3.9, 1.22, 0.16]} position={[0, 0.61, -1.6]} radius={0.01} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[0.16, 1.22, 0.9]} position={[-1.95, 0.61, -1.15]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[0.16, 1.22, 1.2]} position={[-1.95, 0.61, 0.95]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[-0.6, 1.75, -1.5]}>
            <mesh>
              <planeGeometry args={[1.22, 0.52]} />
              <meshBasicMaterial map={signs.restroom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🪜 [구역 6: 좌측 하단 계단실 (`[-4.5, 0, 3.95]` 원본 보존)] */}
      {/* ================================================================= */}
      <group position={[-4.5, 0, 3.95]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.4, 2.8]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`st4_${i}`}
            args={[0.32, 0.10 + i * 0.08, 1.2]}
            position={[0.65 - i * 0.30, (0.10 + i * 0.08) / 2, 0]}
            radius={0.01}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_4F[1]);
            }}
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        <RoundedBox args={[2.2, 1.22, 0.16]} position={[-0.6, 0.61, -1.45]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 1.65, -0.5]}>
            <mesh>
              <planeGeometry args={[1.1, 0.48]} />
              <meshBasicMaterial map={signs.stairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🛗 [구역 7: 하단 중앙 4F 스테인리스 자동 개폐 엘리베이터 홀 (`[-0.2, 0, 5.25]` 원본 위치 그대로!)] */}
      {/* ================================================================= */}
      <AnimatedStainlessElevator4F
        position={[-0.2, 0, 5.25]}
        playerIdxRef={playerIdxRef}
        forceOpen={isElevatorModalOpen}
        onClickElevator={() => onSelectZone(ZONES_4F[0])}
        signTex={signs.elevator}
        showRoomSigns={showRoomSigns}
      />

      {/* 외벽 (카메라 회전 시 자동 투명화) */}
      <SmartCutawayWall4F wallSide="west">
        <RoundedBox args={[0.24, 2.5, 11.6]} position={[-6.4, 1.25, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>
      <SmartCutawayWall4F wallSide="east">
        <RoundedBox args={[0.24, 2.5, 11.6]} position={[6.2, 1.25, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>

      {/* 4층 NPC 렌더링 */}
      {NPCS_4F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_4F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;
        const isBlessingNow = holyLightEvent && holyLightEvent.pastorName === npc.name;

        return (
          <SmoothChibiAvatar4F
            key={npc.id}
            position={[npc.x, npc.y || 0.04, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isBaby={Boolean(npc.isBaby)}
            emote={isBlessingNow ? 'bless' : null}
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

      {/* 실시간 멀티플레이어로 4층에 접속한 다른 성도들 */}
      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar4F
          key={peer.clientId}
          peer={peer}
          onClickPeer={onSelectRemotePeer}
        />
      ))}

      {/* 축도 홀리라이트 강림 이펙트 */}
      {holyLightEvent && (
        <HolyLightBeamEffect4F
          targetPos={holyLightEvent.targetPos}
          pastorName={holyLightEvent.pastorName}
          targetName={holyLightEvent.targetName}
        />
      )}

      {/* 7대 상호작용 마커 */}
      {ZONES_4F.map((z) => (
        <HologramMarker4F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnMat(sel.seatTarget);
            } else if (sel.isTvZone && onOpenSermonTv) {
              onOpenSermonTv();
            } else if (sel.isBlessingZone && onSelectNpcForChat) {
              onSelectNpcForChat(NPCS_4F[0]);
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
// 🚶‍♂️ 플레이어 아바타 컨트롤러 (3인칭 추적 카메라 + 커스텀 아바타 연동)
// =====================================================================
function PlayerController4F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  playerOffice,
  avatarConfig,
  emote,
  myChatBubble,
  controlsRef,
  followCamEnabled,
  onPositionUpdate
}) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-2.25, 0.08, 0.45],
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
      playerIdxRef.current = [seatedInfo.x, 0.08, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.pos[2] !== seatedInfo.z) {
        setRenderState({
          pos: [seatedInfo.x, 0.08, seatedInfo.z],
          rotY: seatedInfo.rotY ?? Math.PI,
          walking: false
        });
      }
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
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.2);
      const rawNx = cx + (dx / dist) * step;
      const rawNz = cz + (dz / dist) * step;
      const [nx, nz] = resolveCollision4F(rawNx, rawNz);
      const ny = nz < 2.2 ? 0.08 : 0.0;
      playerIdxRef.current = [nx, ny, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, ny, nz],
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
    <SmoothChibiAvatar4F
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

function InitialCameraSetup4F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 13.8, 12.8);
      camera.fov = 42;
    } else {
      camera.position.set(0, 10.8, 10.6);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.5, 0.0);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function MediaParents4F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const dailyData = useAppStore((state) => state.dailyData);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer4f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-2.25, 0.08, 0.45]);
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

  const initialSermon = useMemo(() => getSyncedSermonVideo(dailyData), [dailyData]);
  const initialPraise = useMemo(() => getSyncedPraiseVideo(dailyData), [dailyData]);

  const [waypoints, setWaypoints] = useState([[-2.25, 0.45]]);
  const [seatedInfo, setSeatedInfo] = useState({ x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' });
  const [activeZone, setActiveZone] = useState(ZONES_4F[2]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');
  const [followCamEnabled, setFollowCamEnabled] = useState(true);

  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [mediaMode, setMediaMode] = useState('sermon');
  const [sermonVideo, setSermonVideo] = useState(initialSermon);
  const [praiseVideo, setPraiseVideo] = useState(initialPraise);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editTitleInput, setEditTitleInput] = useState('');

  useEffect(() => {
    const syncLatestWorshipVideo = () => {
      setSermonVideo(getSyncedSermonVideo(dailyData));
      setPraiseVideo(getSyncedPraiseVideo(dailyData));
    };
    syncLatestWorshipVideo();
    window.addEventListener('storage', syncLatestWorshipVideo);
    return () => window.removeEventListener('storage', syncLatestWorshipVideo);
  }, [dailyData]);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_4F.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  // 🌐 Supabase Realtime 4층 멀티플레이어 동기화
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
    const channel = supabase.channel('metaverse_parents_4f', {
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
      .on('broadcast', { event: 'holy_blessing_4f' }, ({ payload }) => {
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
            seated: true,
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
  }, [playerName, playerOffice, avatarConfig]);

  const triggerSocialAction = useCallback(
    (emoteType, chatText = '') => {
      setEmote(emoteType);
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

  // ✨ 영유아·가정 축도(홀리라이트) 실행
  const triggerHolyBenediction4F = useCallback(
    (pastorDisplayName, targetDisplayName, targetCoords) => {
      const eventPayload = {
        pastorName: pastorDisplayName,
        targetName: targetDisplayName,
        targetPos: targetCoords || [playerIdxRef.current[0], 0.08, playerIdxRef.current[2]],
        ts: Date.now()
      };

      playHolyBlessingSound();
      setHolyLightEvent(eventPayload);
      triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 자녀·가정 축도를 감사히 받습니다 🙏`);

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'holy_blessing_4f',
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

  const handleSitOnMat = useCallback(
    (seatData) => {
      setSeatedInfo(seatData);
      setWaypoints([[seatData.x, seatData.z]]);
      setIsScreenPlaying(true);
      setTimeout(() => broadcastMyState(), 100);
    },
    [broadcastMyState]
  );

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setIsScreenPlaying(false);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleWalkTo = useCallback(
    (tx, tz) => {
      if (seatedInfo) setSeatedInfo(null);
      const [sx, , sz] = playerIdxRef.current;
      const nextPath = computeSmartPath4F(sx, sz, tx, tz);
      setWaypoints(nextPath);
    },
    [seatedInfo]
  );

  const handleSelectNpcForChat = useCallback(
    (npc) => {
      setChatReplyText(
        (npc.dialogues && npc.dialogues[0]) ||
          '할렐루야! 4층 온돌 자모실에서 함께 예배드리게 되어 반갑습니다 😊'
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

    ctx.fillStyle = '#0284C7';
    ctx.fillRect(8, 6, w - 16, 8);

    ctx.fillStyle = '#F3DFC1';
    ctx.fillRect(8, 16, 44, 46);
    ctx.fillRect(56, 16, 48, 46);

    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 66, 28, 22);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(40, 74, 24, 14);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(68, 66, 36, 22);

    remotePeers.forEach((p) => {
      const px = (((p.x || 0) + 6.5) / 13.0) * w;
      const py = (((p.z || 0) + 4.5) / 10.5) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    });

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.5) / 13.0) * w;
    const my = ((cz + 4.5) / 10.5) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handleOpenLinkEditModal = () => {
    const activeMedia = mediaMode === 'praise' ? praiseVideo : sermonVideo;
    setEditTitleInput(activeMedia.title);
    setEditUrlInput(activeMedia.url);
    setShowVideoModal(true);
  };

  const handleSaveYoutubeLink = () => {
    const vid = parseYoutubeId(editUrlInput);
    if (!vid) {
      alert('올바른 유튜브 영상 주소(URL)를 입력해 주세요.');
      return;
    }
    if (mediaMode === 'praise') {
      const nextPraise = { url: editUrlInput.trim(), id: vid, title: editTitleInput.trim() || '좋은나무 찬양단 경배와 찬양' };
      setPraiseVideo(nextPraise);
      localStorage.setItem('praise_active_video_url', nextPraise.url);
      localStorage.setItem('praise_active_video_title', nextPraise.title);
    } else {
      const nextSermon = { url: editUrlInput.trim(), id: vid, title: editTitleInput.trim() || '주일 대예배 설교 말씀' };
      setSermonVideo(nextSermon);
      localStorage.setItem('sermon_active_video_url', nextSermon.url);
      localStorage.setItem('app_active_gisangogi_url', nextSermon.url);
    }
    setIsScreenPlaying(true);
    setShowVideoModal(false);
  };

  const handlePositionUpdate = (px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_4F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }

    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) {
      lastSyncTimeRef.current = now;
      broadcastMyState();
    }
  };

  const activeMedia = mediaMode === 'praise' ? praiseVideo : sermonVideo;

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
      {/* 1. 좌측 상단: 슬림 헤더 & 실시간 접속자 & 간판/중계TV/자녀축도/3F본당보기 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[76vw]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            onClick={onExitHome}
            style={darkPillStyle}
            className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
          >
            <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
              ◀ 4F 영유아 예배실 (자모실)
            </span>
          </div>

          <div
            style={darkPillStyle}
            className="px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300">4F 접속 {remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setIsScreenPlaying((prev) => !prev)}
            style={{ backgroundColor: '#F59E0B', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            📺 {isScreenPlaying ? '중계 TV 닫기' : '중계 TV 켜기'}
          </button>

          <button
            onClick={() => triggerHolyBenediction4F('최수경 목사님', playerName, playerIdxRef.current)}
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            ✨ 자녀·가정 축도(홀리라이트)
          </button>

          <button
            onClick={() => onChangeFloor && onChangeFloor('3F')}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FDE047' }}>⛪ 3F 본당 내려가기</span>
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 4F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_4F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnMat(z.seatTarget);
                    else if (z.isTvZone) setIsScreenPlaying(true);
                    else if (z.isBlessingZone) {
                      handleWalkTo(z.pos[0], z.pos[2]);
                      setSelectedChatNpc(NPCS_4F[0]);
                      setChatReplyText(NPCS_4F[0].dialogues[0]);
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

      {/* 3. 설교 / 찬양 듀얼 실시간 중계 TV 플레이어 모달 */}
      {isScreenPlaying && (
        <div
          style={{ backgroundColor: '#090D16', borderColor: mediaMode === 'praise' ? '#EC4899' : '#F59E0B', color: '#FFFFFF' }}
          className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[480px] border-2 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in"
        >
          <div
            style={{ backgroundColor: '#111827' }}
            className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setMediaMode('sermon')}
                style={{
                  backgroundColor: mediaMode === 'sermon' ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                  color: mediaMode === 'sermon' ? '#030712' : '#D1D5DB'
                }}
                className="px-2 py-0.5 rounded text-[10px] font-black cursor-pointer shrink-0"
              >
                ✝️ 3F 본당 설교중계
              </button>
              <button
                onClick={() => setMediaMode('praise')}
                style={{
                  backgroundColor: mediaMode === 'praise' ? '#EC4899' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF'
                }}
                className="px-2 py-0.5 rounded text-[10px] font-black cursor-pointer shrink-0"
              >
                🎤 찬양팀 중계
              </button>
              <span style={{ color: '#FFFFFF' }} className="text-xs font-bold truncate ml-1">
                {activeMedia.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleOpenLinkEditModal}
                style={{ color: '#FCD34D' }}
                className="text-[11px] font-bold hover:underline px-1 cursor-pointer"
              >
                링크변경
              </button>
              <button
                onClick={() => setIsScreenPlaying(false)}
                style={{ color: '#E5E7EB' }}
                className="text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="w-full aspect-video bg-black relative">
            {activeMedia.id ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeMedia.id}?autoplay=1&rel=0&playsinline=1`}
                title="4F Live Broadcast TV"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
                <p style={{ color: '#D1D5DB' }} className="text-xs">등록된 유튜브 링크가 없습니다.</p>
                <button
                  onClick={handleOpenLinkEditModal}
                  style={{ backgroundColor: '#F59E0B', color: '#090D16' }}
                  className="px-4 py-2 rounded-xl font-black text-xs cursor-pointer"
                >
                  🔗 유튜브 링크 입력하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 하단: 소셜 상호동작(🍼 아기어르기 · 💃 율동찬양 · 🙏 자녀축복기도 · 👋 인사) & 4층 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { label: '🍼 아기어르기', emote: 'lullaby', msg: '우리 아기 착하지~ 토닥토닥 주님 안에서 건강하게 자라렴 👶🍼' },
              { label: '💃 율동찬양', emote: 'dance', msg: '아이들과 함께 짝짝꿍 기쁨으로 찬양 율동을 해요! 💃🎶' },
              { label: '🙏 자녀축복기도', emote: 'pray', msg: '주님, 우리 자녀들이 믿음과 지혜로 쑥쑥 자라나게 하소서 🙏' },
              { label: '👋 반갑게인사', emote: 'wave', msg: '집사님 반갑습니다! 아기가 정말 천사같이 예쁘네요 🥰👋' }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => triggerSocialAction(act.emote, act.msg)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-pink-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>

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
              placeholder="자모실 말풍선 대화 입력..."
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

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showBottomDock ? (
            <div
              style={darkPillStyle}
              className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
            >
              {[
                { icon: '👶', label: seatedInfo ? '일어나기' : '좌측마루', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnMat({ x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' }); } },
                { icon: '🧸', label: '우측마루', onClick: () => handleSitOnMat({ x: 1.75, z: 0.45, rotY: Math.PI, rowLabel: '4F 우측 온돌 마루 예배석' }) },
                { icon: '🪟', label: '전면통유리·TV', onClick: () => { handleWalkTo(-1.2, -2.6); setIsScreenPlaying(true); } },
                { icon: '🍼', label: '기저귀·화장실', onClick: () => handleWalkTo(3.5, 3.5) },
                { icon: '🛗', label: '엘리베이터', onClick: () => { handleWalkTo(-0.2, 4.3); setModalZone(ZONES_4F[0]); } }
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
              👶 자모실 메뉴 ▲
            </button>
          )}
        </div>
      </div>

      {/* 5. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 10.8, 10.6]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup4F controlsRef={controlsRef} />

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

        <FourFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            const dest = z.roomTarget || [z.pos[0], z.pos[2]];
            handleWalkTo(dest[0], dest[1]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnMat={handleSitOnMat}
          onOpenSermonTv={() => setIsScreenPlaying(true)}
          onSelectNpcForChat={handleSelectNpcForChat}
          sermonTitle={sermonVideo.title}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController4F
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

      {/* 6. 다른 실제 접속 성도(Remote Peer) 클릭 시 열리는 상호 호환 모달 */}
      {selectedRemotePeer && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRemotePeer(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-sm border border-pink-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-pink-400 block">4층 온돌 자모실 성도 교제</span>
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
                  triggerSocialAction('lullaby', `${selectedRemotePeer.name}님! 아기가 너무 예쁘고 사랑스러워요 👶🍼`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/40 text-xs font-black text-pink-200 cursor-pointer"
              >
                🍼 아기 축복·인사
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 매트 옆자리에 편히 앉으세요 👋`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 text-xs font-bold text-white cursor-pointer"
              >
                👋 반갑게 인사하기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('pray', `${selectedRemotePeer.name}님 가정과 자녀의 건강을 위해 함께 기도합니다 🙏`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 text-xs font-bold text-white cursor-pointer"
              >
                🙏 자녀 중보기도
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('dance', `${selectedRemotePeer.name}님과 함께 신나는 영유아부 찬양 율동! 💃🎶`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-amber-600/40 text-xs font-bold text-white cursor-pointer"
              >
                💃 함께 율동찬양
              </button>
            </div>

            {canPlayerBless && (
              <button
                onClick={() => {
                  triggerHolyBenediction4F(
                    `${playerName} 목사님`,
                    selectedRemotePeer.name,
                    [selectedRemotePeer.x || -2.25, 0.08, selectedRemotePeer.z || 0.45]
                  );
                  setSelectedRemotePeer(null);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
              >
                ✨ [{selectedRemotePeer.name}] 가정에 축도(홀리라이트) 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. 자모실 성도·목사님·아기 클릭 시 열리는 1:1 대화 & 축도 모달 */}
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
                    {selectedChatNpc.role || '4층 영유아 자모실'}
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

            {selectedChatNpc.canBless && (
              <button
                onClick={() => {
                  const pastorName = selectedChatNpc.name;
                  setSelectedChatNpc(null);
                  triggerHolyBenediction4F(pastorName, playerName, playerIdxRef.current);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg animate-pulse"
              >
                ✨ [{selectedChatNpc.name}]께 자녀·가정 축도(홀리라이트) 받기 🙏
              </button>
            )}

            <div className="space-y-1.5">
              <span style={{ color: '#9CA3AF' }} className="text-[11px] font-bold block">
                💬 인사 및 축복 나누기 (클릭 시 응답)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    q: '👋 "샬롬! 아기와 함께 예배드리는 모습이 참 아름답고 축복됩니다!"',
                    a: `감사합니다 ${playerName}님! 책상이 없고 푹신한 온돌 안전매트가 깔려 있어 아기랑 매주 기쁨으로 예배드려요 😊`
                  },
                  {
                    q: '🙏 "우리 아기들이 예수님 안에서 건강하고 지혜롭게 자라나길 기도해요."',
                    a: '아멘! 우리 다음세대 아기들이 믿음의 축복 속에서 무럭무럭 자라나길 함께 기도합니다 🙏'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatReplyText(item.a);
                      triggerSocialAction('wave');
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-600/30 border border-white/10 text-left text-xs font-bold cursor-pointer transition-all"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  handleSitOnMat({
                    x: selectedChatNpc.x < 0 ? -2.25 : 3.05,
                    z: 0.45,
                    rotY: Math.PI,
                    rowLabel: `${selectedChatNpc.name} 옆 온돌석`
                  });
                  setSelectedChatNpc(null);
                }}
                style={{ backgroundColor: '#10B981', color: '#030712' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🪑 옆 온돌 방석에 앉기
              </button>
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  setIsScreenPlaying(true);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                📺 중계 TV 켜기
              </button>
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  if (setActiveScreen) setActiveScreen('sermon');
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#93C5FD' }}
                className="py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                📝 예배노트 열기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 설교 / 찬양 유튜브 링크 변경 모달 */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span style={{ color: '#FCD34D' }} className="text-sm font-black">
                {mediaMode === 'praise' ? '🎤 찬양 중계 유튜브 링크 설정' : '✝️ 설교 중계 유튜브 링크 설정'}
              </span>
              <button onClick={() => setShowVideoModal(false)} style={{ color: '#9CA3AF' }} className="text-xs cursor-pointer">
                ✕ 닫기
              </button>
            </div>
            <div className="space-y-2">
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block">영상 제목</label>
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none"
              />
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block pt-1">유튜브 영상 링크 (URL)</label>
              <input
                type="text"
                value={editUrlInput}
                onChange={(e) => setEditUrlInput(e.target.value)}
                placeholder="https://youtu.be/..."
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowVideoModal(false)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D1D5DB' }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveYoutubeLink}
                style={{ backgroundColor: '#10B981', color: '#030712' }}
                className="flex-1 py-2.5 rounded-xl font-black text-xs cursor-pointer"
              >
                중계 TV에 연동하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. 구역 상세 안내 & 전 층 이동 엘리베이터 모달 (2F 북카페 포함 1F~6F 전 층 이동!) */}
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
                  { fl: '1F', label: '1F 메인 로비 & 필로티 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 담임목사 목양실 · 사무실' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 · 온돌 자모실 (현재 층)' },
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
// src/metaverse/Sanctuary3F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import BlenderChibiAvatar from './BlenderChibiAvatar';

// =====================================================================
// 축도(Benediction) 권한을 가진 우리 교회 3대 목사님 명단
// =====================================================================
const BLESSING_PASTORS = ['이성현', '방희곤', '최수경'];

const isAuthorizedPastor = (name = '', office = '') => {
  const clean = String(name).trim();
  if (BLESSING_PASTORS.some((p) => clean.includes(p))) return true;
  if (String(office).includes('목사')) return true;
  return false;
};

// =====================================================================
// 사운드 신시사이저 (엘리베이터 차임벨 & 거룩한 축도 홀리라이트 오르간 화음)
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
// 유튜브 URL에서 11자리 Video ID 추출기 (설교 & 찬양 듀얼 연동)
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
          title: localStorage.getItem('daily_worship_video_title') || '좋은나무교회 매일예배 말씀'
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
            title: entry.sermonTitle || entry.qtTitle || entry.title || `${d} 매일예배 말씀`
          };
        }
      }
    }
  } catch (_) {}
  return {
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
    title: '기적이 상식이 되는 5일의 기도 (매일예배)'
  };
};

const getSyncedPraiseVideo = (storeDailyData = null) => {
  try {
    const praiseUrl = localStorage.getItem('praise_active_video_url');
    if (praiseUrl && parseYoutubeId(praiseUrl)) {
      return {
        url: praiseUrl,
        id: parseYoutubeId(praiseUrl),
        title: localStorage.getItem('praise_active_video_title') || '좋은나무 찬양단 (전도사님 인도) 경배와 찬양'
      };
    }
    const synced = getSyncedSermonVideo(storeDailyData);
    if (synced && synced.id) {
      return {
        ...synced,
        title: '좋은나무 찬양단 (전도사님 인도) 경배와 찬양'
      };
    }
  } catch (_) {}
  return {
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
    title: '좋은나무 찬양단 (전도사님 인도) 경배와 찬양'
  };
};

// =====================================================================
// 고해상도 프로시저럴 텍스처 생성기 (2.5D 카툰 웜 파스텔 톤)
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

function makeWoodGrainTexture(baseHex = '#F1C784', lineHex = '#D29B4D') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 80; i++) {
      ctx.lineWidth = 1.2 + (i % 2);
      ctx.beginPath();
      const y = (i / 80) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 4, w * 0.7, y - Math.cos(i) * 4, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeVerticalSlatDoorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#EDD0A5';
    ctx.fillRect(0, 0, w, h);

    const slatCount = 34;
    const slatW = w / slatCount;
    for (let i = 0; i < slatCount; i++) {
      const x = i * slatW;
      ctx.fillStyle = i % 2 === 0 ? '#F2D9B3' : '#E6C799';
      ctx.fillRect(x, 0, slatW - 2.2, h);

      ctx.strokeStyle = 'rgba(150, 100, 45, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + slatW * 0.5, 0);
      ctx.lineTo(x + slatW * 0.5, h);
      ctx.stroke();

      ctx.fillStyle = '#4A311B';
      ctx.fillRect(x + slatW - 2.2, 0, 2.2, h);
    }
  }, 512, 1024);
}

function makeBrushedSteelTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E2E8F0');
    grad.addColorStop(0.25, '#FFFFFF');
    grad.addColorStop(0.5, '#CBD5E1');
    grad.addColorStop(0.75, '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 180; i++) {
      const y = (i / 180) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeHallwayMarbleTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#E6DFD5';
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
  }, 512, 512);
}

function makeCrystalClearGlassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
    grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.22)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.48)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    for (let x = -100; x < w + 100; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 42, 0);
      ctx.lineTo(x - 55, h);
      ctx.lineTo(x - 97, h);
      ctx.closePath();
      ctx.fill();
    }
  }, 1024, 256);
}

function makeSoftCeilingGlowTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, w * 0.12, cx, cy, w * 0.49);
    grad.addColorStop(0, 'rgba(255, 251, 235, 0.12)');
    grad.addColorStop(0.52, 'rgba(254, 240, 138, 0.55)');
    grad.addColorStop(0.76, 'rgba(253, 224, 71, 0.78)');
    grad.addColorStop(0.92, 'rgba(254, 243, 199, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 512, 512);
}

function makeAtvBassHeadTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#090A0F';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 900 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ATV', w / 2, h * 0.36);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('aDrums artist', w / 2, h * 0.56);
  }, 256, 256);
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
    ctx.font = '900 44px sans-serif';
    ctx.fillText(title, w / 2, 124);
  }, 420, 175);
}

// =====================================================================
// 통로(±2.65m) & 장의자 물리 충돌(AABB)
// =====================================================================
const PEW_ROWS = [-2.2, -0.8, 0.6, 2.0, 3.4, 4.8];
const PEW_COLS = [
  { colId: 'L', x: -4.85, width: 2.85, name: '좌측 장로·성도석' },
  { colId: 'C', x: 0.0, width: 3.55, name: '중앙 성도석' },
  { colId: 'R', x: 4.85, width: 2.85, name: '우측 성도석' }
];

const AISLE_X_LEFT = -2.65;
const AISLE_X_RIGHT = 2.65;

const OBSTACLE_BOXES = [
  { minX: -9.0, maxX: 9.0, minZ: -8.5, maxZ: -2.95 },
  { minX: 3.15, maxX: 7.2, minZ: -3.05, maxZ: -1.85 },
  { minX: -9.0, maxX: -1.45, minZ: 7.25, maxZ: 7.75 },
  { minX: 1.45, maxX: 9.0, minZ: 7.25, maxZ: 7.75 },
  ...PEW_ROWS.flatMap((rz) =>
    PEW_COLS.map((col) => ({
      minX: col.x - col.width / 2 - 0.14,
      maxX: col.x + col.width / 2 + 0.14,
      minZ: rz - 0.34,
      maxZ: rz + 0.36
    }))
  )
];

function isPointBlocked3F(x, z) {
  if (x < -7.2 || x > 7.2 || z < -2.9 || z > 10.4) return true;
  for (const box of OBSTACLE_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }
  return false;
}

function resolveCollision3F(nx, nz, radius = 0.24) {
  let x = Math.max(-7.1, Math.min(7.1, nx));
  let z = Math.max(-2.85, Math.min(10.3, nz));

  for (const box of OBSTACLE_BOXES) {
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

function computeSmartPath3F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision3F(rawEx, rawEz);

  if ((sz <= 7.4 && ez > 7.4) || (sz > 7.4 && ez <= 7.4)) {
    const preDoorZ = sz <= 7.4 ? 6.55 : 8.35;
    const postDoorZ = sz <= 7.4 ? 8.35 : 6.55;
    return [
      [0.0, preDoorZ],
      [0.0, postDoorZ],
      [ex, ez]
    ];
  }

  let directClear = true;
  for (let i = 1; i <= 16; i++) {
    const ix = sx + ((ex - sx) * i) / 16;
    const iz = sz + ((ez - sz) * i) / 16;
    if (isPointBlocked3F(ix, iz)) {
      directClear = false;
      break;
    }
  }
  if (directClear) return [[ex, ez]];

  const bestAisleX =
    Math.abs(sx - AISLE_X_LEFT) + Math.abs(ex - AISLE_X_LEFT) <=
    Math.abs(sx - AISLE_X_RIGHT) + Math.abs(ex - AISLE_X_RIGHT)
      ? AISLE_X_LEFT
      : AISLE_X_RIGHT;

  return [
    [bestAisleX, sz],
    [bestAisleX, ez],
    [ex, ez]
  ];
}

// =====================================================================
// 3층 대예배당 & 외부 복도·엘리베이터 8대 인터랙션 존 정의
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_offering',
    code: '01',
    subCode: '감사/기도함',
    name: '현관 우측 감사/기도함 & 봉투 비치대',
    prompt: '01 감사/기도함 (감사·기도제목 올리기)',
    pos: [4.25, 0, 6.25],
    isOfferingBox: true,
    badge: '01 감사/기도함',
    title: '좋은나무교회 감사/기도함 (현관 우측 후면 벽)',
    desc: '본당 십자가 현관문 오른편 벽면에 비치된 원목 감사/기도함입니다. 오늘 주신 은혜에 대한 감사와 간절한 기도제목을 적어 올려드리세요.'
  },
  {
    id: 'zone_3f_praise_team',
    code: '02',
    subCode: '찬양·악기팀',
    name: '찬양팀 (인도자·싱어·듀얼키보드·그랜드피아노·드럼)',
    prompt: '02 우리 교회 찬양 유튜브 영상 보기',
    pos: [-0.2, 0, -2.85],
    isPraiseZone: true,
    badge: '02 찬양·악기팀',
    title: '찬양인도자 & 싱어·듀얼 신디사이저·그랜드피아노·드럼',
    desc: '플로어 모니터 스피커 앞 인도자와 싱어들, 우측 회중석 앞 듀얼 키보드 반주자와 블랙 커버 그랜드 피아노, 원형 매트 위 드럼 연주자가 함께 찬양합니다.'
  },
  {
    id: 'zone_3f_pastor_pulpit',
    code: '03',
    subCode: '강대상·목사님',
    name: '중앙 원목 강대상 & 이성현 담임목사님 (설교·축도)',
    prompt: '03 담임목사님 주일 설교 & 축도 받기',
    pos: [1.2, 0, -2.85],
    isSermonZone: true,
    badge: '03 강대상·목사님',
    title: '3층 대예배당 원목 강대상 & 주일 설교 스크린',
    desc: '강대상 뒤편 2단 발판 위에서 담임목사님이 생명의 말씀을 선포하시고 성도들에게 거룩한 축도를 베푸십니다.'
  },
  {
    id: 'zone_3f_rep_prayer',
    code: '04',
    subCode: '대표기도석',
    name: '강단 좌측 대표기도 미니 강대상 & 십자가 테이블',
    prompt: '04 좌측 대표기도석 & 십자가 테이블 보기',
    pos: [-3.8, 0, -2.85],
    badge: '04 대표기도석(좌측)',
    title: '강단 좌측 대표기도 전용 미니 강대상 & 십자가 테이블',
    desc: '강단 왼편 위쪽에 2단 발판과 함께 자리한 대표기도 전용 미니 강대상과, 강단 아래의 십자가 조각 원목 테이블입니다.'
  },
  {
    id: 'zone_3f_welcome_pew',
    code: '05',
    subCode: '환영석',
    name: '중앙 새가족 환영 지정석 착석',
    prompt: '05 새가족 환영석에 앉아 예배드리기',
    pos: [-1.8, 0, 0.5],
    seatTarget: { x: 0.35, z: 0.52, rowLabel: '중앙 새가족 환영석 (3열)' },
    isSeatZone: true,
    badge: '05 새가족 환영석',
    title: '"좋은나무교회 환영합니다" 새가족 지정석',
    desc: '장의자 방석에 앉으시면 정자세로 착석하며, 전면 대형 유튜브 설교 스크린이 자동 상영됩니다.'
  },
  {
    id: 'zone_3f_broadcast_terrace',
    code: '06',
    subCode: '방송실·테라스',
    name: '좌측 벽 끝 테라스 방송실 (믹서·모니터 3대·스피커)',
    prompt: '06 테라스 방송실 시스템 보기',
    pos: [-6.2, 0, 3.6],
    badge: '06 테라스 방송실',
    title: '4층 연결 측면 테라스 끝 & 예배 방송실',
    desc: '좌측 테라스 뒤쪽 벽 끝에서 32채널 디지털 오디오 믹서, 자막·카메라 스위처, 트리플 모니터 3대로 예배 실황을 송출합니다.'
  },
  {
    id: 'zone_3f_cross_door',
    code: '07',
    subCode: '십자가현관문',
    name: '본당 은색 스틸 십자가 현관문 (문 열기 & 복도 연결)',
    prompt: '07 은색 철제 십자가 현관문 열고 복도로 나가기',
    pos: [0.0, 0, 6.55],
    isCrossDoor: true,
    badge: '07 스틸십자가 현관문',
    title: '본당 시그니처 — 은색 스틸 십자가 철제 손잡이 현관문',
    desc: '세로 루버(템바보드) 원목 양개문에 은색 브러시드 스틸 철제 십자가 손잡이가 장착된 본당 출입문입니다. 다가가거나 클릭하면 문이 열리며 외부 복도와 엘리베이터 홀이 나타납니다.'
  },
  {
    id: 'zone_3f_hall_elevator',
    code: '08',
    subCode: '3F엘리베이터',
    name: '현관 밖 3층 복도 & 스테인리스 자동 개폐 엘리베이터',
    prompt: '08 3층 엘리베이터 탑승 (전 층 이동)',
    pos: [0.0, 0, 9.25],
    isElevator: true,
    badge: '08 3F 복도·엘리베이터',
    title: '3층 본당 외부 복도 & 스테인리스 자동 개폐 엘리베이터',
    desc: '십자가 현관문을 열고 나오면 연결되는 3층 대리석 복도와 엘리베이터 홀입니다. 다가가면 차임벨과 함께 문이 열리며 1F~7F으로 이동합니다.'
  }
];

// =====================================================================
// 인물 데이터 (이성현·방희곤·최수경 목사님 축도 연동 + 찬양팀 + 성도 25명)
// =====================================================================
const PASTOR_NPC = {
  id: 'pastor_main',
  name: '이성현 담임목사님',
  role: '좋은나무교회 담임목사 · 설교 및 축도',
  canBless: true,
  x: -0.2,
  y: 0.86,
  z: -5.72,
  rotY: 0,
  gender: 'male',
  hairStyle: 'parted',
  shirt: '#1E293B',
  pants: '#0F172A',
  hair: '#18181B',
  dialogues: [
    '할렐루야! 오늘 예배하는 모든 성도님들 가정에 주님의 은혜가 충만하길 축원합니다',
    '정면 건너편 4층 투명 통유리 앞 중앙 TV로 찬양 가사와 말씀 요약이 선명하게 잘 보이네요!',
    '저를 클릭하셔서 [거룩한 축도 받기]를 누르시면 하늘에서 홀리라이트 축복이 내려옵니다'
  ]
};

const REP_PRAYER_NPC = {
  id: 'rep_prayer_elder',
  name: '최장로 (대표기도)',
  role: '주일예배 대표기도 위원',
  x: -4.65,
  y: 0.82,
  z: -4.88,
  rotY: 0.12,
  gender: 'male',
  hairStyle: 'elder',
  shirt: '#1E3A8A',
  pants: '#0F172A',
  hair: '#64748B',
  dialogues: [
    '거룩하신 하나님 아버지, 강단 왼편 미니 강대상에서 온 성도를 대표하여 간절히 기도드립니다',
    '담임목사님께 성령의 갑절의 능력을 부어주시고 선포되는 말씀마다 생명이 넘치게 하옵소서!'
  ]
};

const BROADCAST_ENGINEER_NPC = {
  id: 'broadcast_engineer',
  name: '박간사 (방송실 컨트롤)',
  role: '예배 미디어·음향 엔지니어',
  x: -7.50,
  y: 2.96,
  z: 4.15,
  rotY: Math.PI / 2,
  gender: 'male',
  hairStyle: 'short',
  shirt: '#0284C7',
  pants: '#1E293B',
  hair: '#18181B',
  dialogues: [
    '좌측 테라스 끝 방송실 콘솔에서 트리플 모니터 3대와 32채널 믹서 완벽 세팅했습니다',
    '천장이 탁 트이고 4층 통유리가 투명해져서 본당 전체가 한눈에 시원하게 다 보여요!'
  ]
};

const PRAISE_TEAM_5_NPCS = [
  {
    id: 'praise_leader',
    name: '전도사님 (찬양인도·통기타)',
    role: '좋은나무 찬양단 인도자',
    isLeader: true,
    hasAcousticGuitar: true,
    x: -0.95,
    y: 0.48,
    z: -3.75,
    rotY: 0,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '다 함께 두 손을 높이 들고 전심으로 주님을 찬양합시다!',
      '통기타와 키보드, 드럼 반주에 맞춰 기쁨으로 주님을 찬양해요',
      '저를 클릭하시면 매일예배 찬양 유튜브 영상이 바로 재생됩니다!'
    ]
  },
  {
    id: 'singer_m1',
    name: '이형제 (싱어)',
    role: '찬양단 테너 싱어',
    x: -2.55,
    y: 0.48,
    z: -3.88,
    rotY: 0.14,
    gender: 'male',
    hairStyle: 'short',
    isSkirt: false,
    shirt: '#38BDF8',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '주님 다시 오실 날을 소망하며 전심으로 찬양합니다',
      '강단 앞 바닥 모니터 스피커 사운드가 아주 선명하게 잘 들리네요!'
    ]
  },
  {
    id: 'singer_f1',
    name: '박자매 (싱어)',
    role: '찬양단 알토 싱어',
    x: -1.75,
    y: 0.48,
    z: -3.85,
    rotY: 0.08,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '주님 한 분만으로 나는 만족해~ 기쁨으로 찬양해요',
      '성도님들의 찬양 소리가 본당 가득 울려 퍼지네요!'
    ]
  },
  {
    id: 'singer_f2',
    name: '최자매 (싱어)',
    role: '찬양단 소프라노 싱어',
    x: 0.65,
    y: 0.48,
    z: -3.85,
    rotY: -0.08,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#FACC15',
    pants: '#FEF08A',
    hair: '#78350F',
    dialogues: [
      '소프라노 파트로 하나님의 아름다우심을 노래합니다',
      '찬양팀을 클릭해서 은혜로운 찬양 영상을 함께 시청해 보세요!'
    ]
  },
  {
    id: 'singer_m2',
    name: '정형제 (싱어)',
    role: '찬양단 베이스 싱어',
    x: 1.55,
    y: 0.48,
    z: -3.88,
    rotY: -0.14,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '드럼과 건반 반주에 맞춰 온 맘 다해 주님을 찬양합니다',
      '살아계신 주님께서 우리의 찬양을 기쁘게 받으십니다!'
    ]
  }
];

const BAND_INSTRUMENT_NPCS = [
  {
    id: 'sanctuary_pianist',
    name: '이자매 (듀얼 키보드·신디사이저)',
    role: '예배 메인 건반 반주자',
    x: 4.15,
    y: 0.0,
    z: -2.42,
    rotY: Math.PI,
    isPianist: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#A855F7',
    pants: '#F3E8FF',
    hair: '#451A03',
    dialogues: [
      '우측 회중석 맨 앞 듀얼 신디사이저 자리에서 노트북 악보를 보며 연주합니다',
      '바로 오른쪽 옆에는 검은색 커버를 씌워둔 그랜드 피아노가 자리하고 있어요'
    ]
  },
  {
    id: 'sanctuary_drummer',
    name: '최형제 (ATV 드럼)',
    role: '찬양단 메인 드러머',
    x: 5.25,
    y: 0.48,
    z: -5.45,
    rotY: -0.25,
    isDrummer: true,
    gender: 'male',
    hairStyle: 'short',
    isSkirt: false,
    shirt: '#EF4444',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '강단 우측 원형 드럼 매트 위에서 찬양의 리듬과 박자를 이끕니다',
      '인도자님 사인에 맞춰 심벌즈 크레센도로 빌드업 들어갑니다!'
    ]
  }
];

const CONGREGATION_NPCS = [
  { id: 'elder_1', name: '김장로 (시무장로)', role: '예배위원회 시무장로', x: -5.45, z: -2.2 - 0.08, seated: true, gender: 'male', hairStyle: 'elder', shirt: '#1E293B', pants: '#0F172A', hair: '#94A3B8', dialogues: ['아멘! 바로 앞 왼편 발판 위 대표기도석에서 올려드린 기도와 말씀에 큰 은혜를 받습니다'] },
  { id: 'elder_2', name: '이장로 (수석장로)', role: '당회 서기·수석장로', x: -4.15, z: -2.2 - 0.08, seated: true, gender: 'male', hairStyle: 'elder', shirt: '#334155', pants: '#0F172A', hair: '#E2E8F0', dialogues: ['천장이 탁 트이고 통로가 넓어져서 예배당이 훨씬 웅장하고 쾌적하군요'] },
  { id: 'elder_3', name: '박장로 (예배위원장)', role: '예배위원장 장로', x: -5.45, z: -0.8 - 0.08, seated: true, gender: 'male', hairStyle: 'elder', shirt: '#1E3A8A', pants: '#0F172A', hair: '#CBD5E1', dialogues: ['은색 철제 십자가 현관문을 열고 들어올 때마다 마음이 경건해집니다'] },
  { id: 'elder_4', name: '정장로 (선교위원장)', role: '국내외 선교위원장', x: -4.15, z: -0.8 - 0.08, seated: true, gender: 'male', hairStyle: 'elder', shirt: '#27272A', pants: '#18181B', hair: '#9CA3AF', dialogues: ['아멘! 할렐루야~ 선포되는 말씀마다 생명의 역사가 일어납니다!'] },
  { id: 'left_f1', name: '최권사', role: '마리아 여전도회 권사', x: -5.45, z: 0.6 - 0.08, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#EC4899', pants: '#FBCFE8', hair: '#451A03', dialogues: ['주님, 우리 자녀들과 다음세대에 믿음의 복을 내려주옵소서'] },
  { id: 'left_m1', name: '강집사 (남성도)', role: '남선교회 총무집사', x: -4.15, z: 0.6 - 0.08, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#0284C7', pants: '#1E293B', hair: '#1C1917', dialogues: ['왼쪽 위 4층 테라스 끝 방송실 장비들이랑 모니터 3대가 정말 멋지게 갖춰져 있네요'] },
  { id: 'left_f2', name: '윤권사', role: '권사회 부회장', x: -5.35, z: 2.0 - 0.08, seated: true, gender: 'female', hairStyle: 'bob', isSkirt: true, shirt: '#0D9488', pants: '#CCFBF1', hair: '#18181B', dialogues: ['성경책을 펴고 오늘 주실 말씀의 은혜를 사모합니다'] },
  { id: 'left_m2', name: '장집사', role: '안수집사회 회원', x: -4.20, z: 3.4 - 0.08, seated: true, gender: 'male', hairStyle: 'short', shirt: '#4F46E5', pants: '#1E293B', hair: '#27272A', dialogues: ['할렐루야! 주일마다 성도님들과 함께 예배드림이 가장 큰 기쁨입니다.'] },
  { id: 'center_f1', name: '한권사 (여전도회)', role: '루디아 여전도회 회장', x: -1.05, z: -2.2 - 0.08, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#A855F7', pants: '#E9D5FF', hair: '#5C3A21', dialogues: ['아멘! 강대상 바로 앞 중앙 1열에서 말씀을 들으니 은혜가 배가 되네요'] },
  { id: 'center_m1', name: '윤안수집사 (남선교회)', role: '안수집사회 부회장', x: 0.85, z: -2.2 - 0.08, seated: true, gender: 'male', hairStyle: 'short', shirt: '#0D9488', pants: '#1E293B', hair: '#27272A', dialogues: ['할렐루야! 온 가족이 함께 본당에서 예배드리니 참 기쁩니다.'] },
  { id: 'center_f2', name: '서자매 (청년부)', role: '여호수아 청년부 리더', x: -0.95, z: -0.8 - 0.08, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#F43F5E', pants: '#FECDD3', hair: '#78350F', dialogues: ['찬양 인도 따라 부르는데 마음이 뜨거워져요'] },
  { id: 'center_m2', name: '조형제 (청년부)', role: '청년부 새가족팀', x: 0.95, z: -0.8 - 0.08, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#22C55E', pants: '#1E293B', hair: '#18181B', dialogues: ['찬양팀과 목사님 말씀에 청년부 모두가 큰 힘을 얻습니다!'] },
  { id: 'center_f3', name: '김집사 (새가족환영)', role: '새가족부 섬김이', x: -1.15, z: 0.6 - 0.08, seated: true, gender: 'female', hairStyle: 'bob', isSkirt: true, shirt: '#F59E0B', pants: '#FDE68A', hair: '#5C3A21', dialogues: ['새가족 환영석 바로 옆자리라 새가족분들과 반갑게 인사 나눴어요'] },
  { id: 'center_f4', name: '임집사 (여성도)', role: '3교구 구역장', x: -0.95, z: 2.0 - 0.08, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#EC4899', pants: '#FCE7F3', hair: '#451A03', dialogues: ['오른편 뒤쪽 벽 감사/기도함에 넣은 가정의 기도제목이 꼭 응답되길 소망합니다'] },
  { id: 'center_m3', name: '송성도 (남성도)', role: '좋은나무 성도', x: 0.95, z: 2.0 - 0.08, seated: true, gender: 'male', hairStyle: 'short', shirt: '#3B82F6', pants: '#1E293B', hair: '#27272A', dialogues: ['아멘! 한 주간 세상에서 지친 마음이 말씀으로 새 힘을 얻습니다'] },
  { id: 'center_m4', name: '백집사', role: '찬양대원', x: -0.85, z: 3.4 - 0.08, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#0284C7', pants: '#1E293B', hair: '#18181B', dialogues: ['4층 통유리가 투명한 크리스탈 글라스라 위층 자모실까지 훤히 다 보이네요!'] },
  { id: 'center_f5', name: '노권사', role: '중보기도팀', x: 0.90, z: 4.8 - 0.08, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#8B5CF6', pants: '#EDE9FE', hair: '#451A03', dialogues: ['뒤쪽 자리에서도 목사님 말씀이 귀에 쏙쏙 들어옵니다'] },
  { id: 'right_f1', name: '오권사', role: '중보기도팀 권사', x: 4.05, z: -0.8 - 0.08, seated: true, gender: 'female', hairStyle: 'bun', isSkirt: true, shirt: '#14B8A6', pants: '#CCFBF1', hair: '#451A03', dialogues: ['오른쪽 앞자리는 듀얼 신디사이저 반주자랑 드럼 연주가 한눈에 보여요'] },
  { id: 'right_m1', name: '신집사 (남성도)', role: '찬양위원회 집사', x: 5.35, z: -0.8 - 0.08, seated: true, gender: 'male', hairStyle: 'parted', shirt: '#6366F1', pants: '#1E293B', hair: '#18181B', dialogues: ['우물천장 간접조명과 트러스 조명이 은은하게 퍼지니 성전이 더욱 거룩합니다'] },
  { id: 'right_f2', name: '유자매 (여성도)', role: '주일학교 교사', x: 4.15, z: 0.6 - 0.08, seated: true, gender: 'female', hairStyle: 'long_wave', isSkirt: true, shirt: '#EC4899', pants: '#FCE7F3', hair: '#5C3A21', dialogues: ['아멘! 목사님 말씀 한 구절 한 구절이 제게 주시는 음성 같습니다.'] },
  { id: 'right_m2', name: '황성도 (남성도)', role: '새가족부 성도', x: 5.35, z: 2.0 - 0.08, seated: true, gender: 'male', hairStyle: 'short', shirt: '#EAB308', pants: '#1E293B', hair: '#451A03', dialogues: ['할렐루야! 우리 좋은나무교회 공동체가 날마다 부흥하길 기도합니다.'] },
  { id: 'right_f3', name: '배집사 (여성도)', role: '친교봉사팀 집사', x: 4.05, z: 3.4 - 0.08, seated: true, gender: 'female', hairStyle: 'bob', isSkirt: true, shirt: '#8B5CF6', pants: '#EDE9FE', hair: '#27272A', dialogues: ['예배 끝나고 2층 북카페에서 성도님들과 시원한 아메리카노 마시며 교제해요'] },
  { id: 'pastor_choi_3f', name: '최수경 목사님 (축도·중보)', role: '좋은나무교회 목사 · 예배 및 축도 사역', canBless: true, x: AISLE_X_RIGHT, z: 5.85, rotY: Math.PI, seated: false, gender: 'female', hairStyle: 'bob', isSkirt: true, autoWave: true, shirt: '#4F46E5', pants: '#E0E7FF', hair: '#3F2305', dialogues: ['사랑하는 성도님! 3층 대예배당에 오신 것을 주님의 이름으로 축복합니다', '저를 클릭하셔서 [목사님께 축도 받기]를 누르시면 거룩한 홀리라이트가 임합니다'] },
  { id: 'usher_door_left', name: '홍권사 (현관 안내위원)', role: '본당 십자가 현관문 안내팀장', x: -1.75, z: 6.55, rotY: Math.PI, seated: false, gender: 'female', hairStyle: 'bob', isSkirt: true, autoWave: true, shirt: '#E11D48', pants: '#FFE4E6', hair: '#451A03', dialogues: ['할렐루야! 은색 스틸 십자가 현관문을 열고 들어오시는 성도님들 환영합니다', '현관문을 클릭하거나 다가가시면 문이 활짝 열리고 뒤쪽 복도와 엘리베이터가 나와요!'] },
  { id: 'usher_door_right', name: '구집사 (현관 안내위원)', role: '본당 예배 안내위원', x: 1.75, z: 6.55, rotY: Math.PI, seated: false, gender: 'male', hairStyle: 'parted', autoWave: true, shirt: '#1E3A8A', pants: '#0F172A', hair: '#18181B', dialogues: ['반갑습니다 성도님! 은색 철제 십자가 현관문 바로 앞에서 안내하고 있습니다', '현관문 너머 복도 중앙에 전 층(1F~7F)으로 이동하는 스테인리스 엘리베이터가 있습니다!'] }
];

// =====================================================================
// 축도(Benediction) 홀리라이트(Holy Light) 이펙트 컴포넌트
// =====================================================================
function HolyLightBeamEffect3F({ targetPos, pastorName, targetName }) {
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
      ctx.fillText(`${pastorName || '목사님'}의 축도 (HOLY BENEDICTION)`, w / 2, 46);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px serif';
      ctx.fillText(`${targetName} 성도님에게 하나님의 은혜와 평강이`, w / 2, 88);
      ctx.fillText(`영원토록 함께 있을지어다! 아멘`, w / 2, 126);
    }, 620, 156);
  }, [pastorName, targetName]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      beamRef.current.scale.set(pulse, 1, pulse);
      beamRef.current.material.opacity = 0.36 + Math.sin(t * 4) * 0.08;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.8;
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
    <group position={[targetPos[0], 0.02, targetPos[2]]}>
      <mesh ref={beamRef} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.95, 0.68, 6.4, 32, 1, true]} />
        <meshBasicMaterial color="#FDE047" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.38, 0.28, 6.4, 24, 1, true]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.52, 0.76, 36]} />
        <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <ringGeometry args={[0.45, 0.54, 32]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
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
      <pointLight position={[0, 2.6, 0]} intensity={5.5} distance={6.5} color="#FDE047" />
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
// 화면 회전 시 시야를 가리는 외벽 자동 투명화 컴포넌트
// =====================================================================
function SmartCutawayWall({ wallSide, minOpacity = 0.05, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 6.4) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -5.8) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 8.2) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.5) shouldFade = true;

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

function HologramZoneMarker({ zone, isSelected, onSelect }) {
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
        ctx.fillStyle = 'rgba(20, 24, 32, 0.92)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 24, h / 2 + 6, 118, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 83, h / 2 + 28);
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
          <planeGeometry args={[0.78, 0.44]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function HighQualityAcousticGuitar({ position = [0.02, 0.34, 0.155], rotation = [0, 0, -0.52] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.34, 0.24, 0.055]} position={[0, -0.02, 0]} radius={0.07} castShadow>
        <meshToonMaterial color="#D97706" />
      </RoundedBox>
      <mesh position={[0.05, -0.02, 0.03]}>
        <circleGeometry args={[0.048, 20]} />
        <meshBasicMaterial color="#1C1917" />
      </mesh>
      <RoundedBox args={[0.44, 0.038, 0.022]} position={[0.30, 0.0, 0.01]} radius={0.005} castShadow>
        <meshToonMaterial color="#5C3418" />
      </RoundedBox>
    </group>
  );
}

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

function CharacterHairStyle({ style = 'short', hairColor = '#27272A' }) {
  if (style === 'long_wave') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.02]} scale={[1.06, 0.96, 1.06]} castShadow>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[-0.16, -0.08, -0.02]} rotation={[0, 0, 0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.24, 12, 16]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.16, -0.08, -0.02]} rotation={[0, 0, -0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.24, 12, 16]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[0, -0.10, -0.12]} scale={[1.25, 1.0, 0.6]} castShadow>
          <capsuleGeometry args={[0.12, 0.24, 12, 16]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
      </group>
    );
  }

  if (style === 'bob') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.01]} scale={[1.08, 0.96, 1.06]} castShadow>
          <sphereGeometry args={[0.212, 24, 24]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[-0.15, -0.04, 0.0]} castShadow>
          <capsuleGeometry args={[0.05, 0.12, 12, 16]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.15, -0.04, 0.0]} castShadow>
          <capsuleGeometry args={[0.05, 0.12, 12, 16]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
      </group>
    );
  }

  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.94, 1.05]} castShadow>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <mesh position={[0, 0.12, -0.19]} castShadow>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.92, 1.05]} castShadow>
        <sphereGeometry args={[0.21, 24, 24]} />
        <meshToonMaterial color={hairColor} />
      </mesh>
      <mesh position={[0, 0.09, 0.06]} scale={[0.96, 0.65, 0.82]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshToonMaterial color={hairColor} />
      </mesh>
    </group>
  );
}

// 2.5D 카툰 질감(meshToonMaterial) 적용 아바타
function SmoothChibiAvatar({
  position = [0, 0, 0],
  targetPosition = null,
  patrolZ = null,
  patrolX = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isPraiseTeam = false,
  isPastor = false,
  isDrummer = false,
  isPianist = false,
  isGuitarist = false,
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
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const isFemale = gender === 'female' || isSkirt;

  const patrolState = useRef({
    coord: patrolX ? position[0] : position[2],
    dir: 1,
    pauseTimer: 0
  });

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
      ctx.strokeStyle = '#3B82F6';
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
        ctx.fillStyle = '#2563EB';
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
    } else if ((patrolZ || patrolX) && outerGroupRef.current) {
      const bounds = patrolX || patrolZ;
      const st = patrolState.current;
      if (st.pauseTimer > 0) {
        st.pauseTimer -= delta;
        walkingNow = false;
      } else {
        walkingNow = true;
        st.coord += st.dir * delta * 0.65;
        if (st.coord > bounds[1]) {
          st.coord = bounds[1];
          st.dir = -1;
          st.pauseTimer = 2.6;
        } else if (st.coord < bounds[0]) {
          st.coord = bounds[0];
          st.dir = 1;
          st.pauseTimer = 2.6;
        }
        if (patrolX) {
          outerGroupRef.current.position.x = st.coord;
          outerGroupRef.current.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          outerGroupRef.current.position.z = st.coord;
          outerGroupRef.current.rotation.y = st.dir > 0 ? 0.15 : Math.PI - 0.15;
        }
      }
    }

    if (isPraiseTeam && outerGroupRef.current) {
      outerGroupRef.current.position.x = position[0] + Math.sin(t * 2.8) * 0.05;
    }

    const seatedNow = isSeated || isDrummer || isPianist;

    if (leftLegRef.current && rightLegRef.current) {
      if (seatedNow) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.24, 0.11);
        rightLegRef.current.position.set(0.085, 0.24, 0.11);
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 14) * 0.65;
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
      } else if (emote === 'dance') {
        leftArmRef.current.rotation.z = 2.4 + Math.sin(t * 12) * 0.45;
        rightArmRef.current.rotation.z = -2.4 + Math.cos(t * 12) * 0.45;
        leftArmRef.current.rotation.x = Math.sin(t * 6) * 0.3;
        rightArmRef.current.rotation.x = -Math.sin(t * 6) * 0.3;
      } else if (emote === 'praise') {
        leftArmRef.current.rotation.z = 2.65 + Math.sin(t * 8) * 0.2;
        rightArmRef.current.rotation.z = -2.65 - Math.sin(t * 8) * 0.2;
        leftArmRef.current.rotation.x = 0.2;
        rightArmRef.current.rotation.x = 0.2;
      } else if (isPastor) {
        rightArmRef.current.rotation.z = -1.9 + Math.sin(t * 3.2) * 0.25;
        rightArmRef.current.rotation.x = 0.35;
        leftArmRef.current.rotation.x = -0.35 + Math.cos(t * 2.4) * 0.12;
      } else if (isDrummer) {
        leftArmRef.current.rotation.x = -1.05 + Math.sin(t * 15) * 0.42;
        rightArmRef.current.rotation.x = -1.05 + Math.cos(t * 15) * 0.42;
        leftArmRef.current.rotation.z = 0.15;
        rightArmRef.current.rotation.z = -0.15;
      } else if (isPianist) {
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 8.5) * 0.16;
        rightArmRef.current.rotation.x = -0.82 + Math.cos(t * 8.5) * 0.16;
        leftArmRef.current.rotation.z = 0.18 + Math.sin(t * 3.2) * 0.1;
        rightArmRef.current.rotation.z = -0.18 - Math.cos(t * 3.2) * 0.1;
      } else if (isGuitarist) {
        leftArmRef.current.rotation.x = -0.85;
        leftArmRef.current.rotation.z = 0.38;
        rightArmRef.current.rotation.x = -0.78 + Math.sin(t * 12) * 0.22;
        rightArmRef.current.rotation.z = -0.25;
      } else if (isPraiseTeam) {
        leftArmRef.current.rotation.z = 2.35 + Math.sin(t * 4.5) * 0.28;
        leftArmRef.current.rotation.x = 0.25;
        rightArmRef.current.rotation.x = -0.65 + Math.cos(t * 4.5) * 0.12;
        rightArmRef.current.rotation.z = -0.15;
      } else if (emote === 'wave' || autoWave || ((patrolZ || patrolX) && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (seatedNow) {
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
      if (emote === 'pray') {
        headGroupRef.current.rotation.x = 0.32;
      } else {
        headGroupRef.current.rotation.x = Math.sin(t * (isDrummer || isPianist || isGuitarist ? 5.5 : 2.8)) * 0.07;
        headGroupRef.current.rotation.y = Math.cos(t * 1.5) * 0.08;
      }
    }
    if (rootRef.current) {
      const jump = emote === 'dance' ? Math.abs(Math.sin(t * 12)) * 0.16 : 0;
      const bounce = (walkingNow || isPraiseTeam) && !seatedNow
        ? Math.abs(Math.sin(t * (isPraiseTeam ? 5.2 : 9.5))) * 0.042
        : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (seatedNow ? 0.20 : 0) + bounce + jump;
      rootRef.current.position.z = isSeated ? 0.05 : 0;
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.24, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.22} />
      </mesh>

      <group ref={rootRef}>
        <group ref={leftLegRef} position={[-0.085, 0.21, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshToonMaterial color={isFemale ? skinColor : pantsColor} />
          </mesh>
          <mesh position={[0, -0.175, 0.025]} scale={[1.0, 0.65, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshToonMaterial color={isFemale ? '#881337' : '#18181B'} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.21, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshToonMaterial color={isFemale ? skinColor : pantsColor} />
          </mesh>
          <mesh position={[0, -0.175, 0.025]} scale={[1.0, 0.65, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshToonMaterial color={isFemale ? '#881337' : '#18181B'} />
          </mesh>
        </group>

        {isFemale ? (
          <group>
            <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.13, 0.115, 0.24, 24]} />
              <meshToonMaterial color={shirtColor} />
            </mesh>
            <mesh position={[0, 0.52, 0]} scale={[1.15, 0.55, 0.88]} castShadow>
              <sphereGeometry args={[0.13, 20, 20]} />
              <meshToonMaterial color={shirtColor} />
            </mesh>
            <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.12, 0.225, 0.24, 28]} />
              <meshToonMaterial color={pantsColor || shirtColor} />
            </mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.37, 0]} scale={[1.16, 1.0, 0.85]} castShadow receiveShadow>
              <capsuleGeometry args={[0.142, 0.16, 16, 24]} />
              <meshToonMaterial color={shirtColor} />
            </mesh>
            <mesh position={[0, 0.49, 0.112]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[0.042, 0.09, 3]} />
              <meshToonMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, 0.42, 0.122]}>
              <boxGeometry args={[0.022, 0.11, 0.01]} />
              <meshToonMaterial color={isPastor ? '#DC2626' : '#38BDF8'} />
            </mesh>
          </group>
        )}

        {isGuitarist && <HighQualityAcousticGuitar />}

        <group ref={leftArmRef} position={[-0.195, 0.48, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.042, 0.14, 12, 16]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0, -0.20, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.195, 0.48, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.042, 0.14, 12, 16]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0, -0.20, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>

        <group ref={headGroupRef} position={[0, 0.74, 0]}>
          <mesh scale={[1.06, 1.0, 1.02]} castShadow receiveShadow>
            <sphereGeometry args={[0.205, 28, 28]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <CharacterHairStyle
            style={hairStyle || (isFemale ? 'long_wave' : 'short')}
            hairColor={hairColor}
          />
          {hasSunglasses ? (
            <group position={[0, 0.0, 0.196]}>
              <RoundedBox args={[0.13, 0.072, 0.025]} position={[-0.072, 0, 0]} radius={0.02}>
                <meshToonMaterial color="#18181B" />
              </RoundedBox>
              <RoundedBox args={[0.13, 0.072, 0.025]} position={[0.072, 0, 0]} radius={0.02}>
                <meshToonMaterial color="#18181B" />
              </RoundedBox>
            </group>
          ) : (
            <>
              <mesh position={[-0.072, -0.01, 0.196]}>
                <sphereGeometry args={[0.025, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.072, -0.01, 0.196]}>
                <sphereGeometry args={[0.025, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[-0.11, -0.04, 0.178]}>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
              </mesh>
              <mesh position={[0.11, -0.04, 0.178]}>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
              </mesh>
            </>
          )}
        </group>

        {nameTagTexture && (
          <Billboard position={[0, 1.22, 0]}>
            <mesh renderOrder={12}>
              <planeGeometry args={[1.55, 0.34]} />
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

function RemoteMultiplayerAvatar3F({ peer, onClickPeer }) {
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
      ctx.fillText(`${isPastor ? '✝ ' : ''}${peer.name || '성도'}`, w / 2 + 16, h / 2 + 2);
    }, 520, 110);
  }, [peer.name, peer.office]);

  return (
    <SmoothChibiAvatar
      position={[peer.x || 0.35, 0, peer.z || 0.52]}
      targetPosition={[peer.x || 0.35, 0, peer.z || 0.52]}
      rotationY={peer.rotY || Math.PI}
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
// 강단 우측 원형 드럼 매트 위 5기통 드럼 세트
// =====================================================================
function HighQualityAtvDrumKit({ position }) {
  const atvBassTex = useMemo(() => makeAtvBassHeadTexture(), []);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[1.18, 36]} />
        <meshToonMaterial color="#1E293B" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[1.05, 1.12, 36]} />
        <meshBasicMaterial color="#E2E8F0" />
      </mesh>

      <group position={[0, 0.32, 0.12]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.31, 0.44, 32]} />
          <meshToonMaterial color="#18181B" />
        </mesh>
        <mesh position={[0, 0, 0.225]}>
          <circleGeometry args={[0.30, 32]} />
          <meshBasicMaterial map={atvBassTex} />
        </mesh>
      </group>

      {[
        [-0.20, 0.72, 0.08, 0.14],
        [0.20, 0.72, 0.08, 0.155]
      ].map(([tx, ty, tz, trad], ti) => (
        <group key={`tom_${ti}`} position={[tx, ty, tz]} rotation={[0.32, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[trad, trad, 0.20, 24]} />
            <meshToonMaterial color="#18181B" />
          </mesh>
          <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[trad - 0.01, 24]} />
            <meshToonMaterial color="#F8FAFC" />
          </mesh>
        </group>
      ))}

      <group position={[0.38, 0.56, -0.16]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 24]} />
          <meshToonMaterial color="#27272A" />
        </mesh>
        <mesh position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 24]} />
          <meshToonMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {[
        [-0.62, 0.96, 0.05, 0.21, 0.22],
        [-0.32, 1.12, 0.22, 0.23, 0.25],
        [0.34, 1.16, 0.20, 0.25, -0.22],
        [0.64, 0.88, -0.12, 0.18, -0.10]
      ].map(([cx, cy, cz, crad, tilt], ci) => (
        <group key={`cym_${ci}`} position={[cx, 0, cz]}>
          <mesh position={[0, cy / 2, 0]} castShadow>
            <cylinderGeometry args={[0.016, 0.02, cy, 10]} />
            <meshToonMaterial color="#CBD5E1" />
          </mesh>
          <group position={[0, cy, 0]} rotation={[0.22, 0, tilt]}>
            <mesh castShadow>
              <cylinderGeometry args={[crad, crad, 0.014, 28]} />
              <meshToonMaterial color="#EAB308" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// 은색 스틸 십자가 철제 손잡이 현관문 (자동 스윙 개폐)
// =====================================================================
function SanctuaryRearCrossDoubleDoor({ position, playerIdxRef, forceOpen, onClickDoor }) {
  const leftLeafPivotRef = useRef();
  const rightLeafPivotRef = useRef();
  const slatDoorTex = useMemo(() => makeVerticalSlatDoorTexture(), []);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);

  useFrame((_, delta) => {
    if (!leftLeafPivotRef.current || !rightLeafPivotRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - position[0], pz - position[2]);
    const shouldOpen = forceOpen || dist < 2.25;

    const targetLeftRot = shouldOpen ? 1.15 : 0;
    const targetRightRot = shouldOpen ? -1.15 : 0;

    leftLeafPivotRef.current.rotation.y = THREE.MathUtils.lerp(leftLeafPivotRef.current.rotation.y, targetLeftRot, delta * 5.5);
    rightLeafPivotRef.current.rotation.y = THREE.MathUtils.lerp(rightLeafPivotRef.current.rotation.y, targetRightRot, delta * 5.5);
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickDoor) onClickDoor();
      }}
    >
      <RoundedBox args={[0.16, 2.54, 0.28]} position={[-1.36, 1.27, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshToonMaterial color="#334155" />
      </RoundedBox>
      <RoundedBox args={[0.16, 2.54, 0.28]} position={[1.36, 1.27, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshToonMaterial color="#334155" />
      </RoundedBox>
      <RoundedBox args={[2.88, 0.16, 0.28]} position={[0, 2.46, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshToonMaterial color="#334155" />
      </RoundedBox>

      <group ref={leftLeafPivotRef} position={[-1.28, 0, 0]}>
        <group position={[0.63, 1.20, 0]}>
          <RoundedBox args={[1.26, 2.36, 0.12]} radius={0.01} castShadow receiveShadow userData={{ keepOpaque: true }}>
            <meshToonMaterial color="#E5C08D" />
          </RoundedBox>
          <RoundedBox args={[1.14, 2.24, 0.135]} radius={0.006} castShadow receiveShadow userData={{ keepOpaque: true }}>
            <meshToonMaterial map={slatDoorTex} />
          </RoundedBox>
          {[-0.086, 0.086].map((cz, sideIdx) => (
            <group key={sideIdx} position={[0.63, -1.20, cz]}>
              <RoundedBox args={[0.084, 0.44, 0.042]} position={[-0.068, 1.68, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.40, 0.084, 0.042]} position={[-0.22, 1.50, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.40, 0.084, 0.042]} position={[-0.22, 1.34, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.084, 1.10, 0.042]} position={[-0.068, 0.83, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
            </group>
          ))}
        </group>
      </group>

      <group ref={rightLeafPivotRef} position={[1.28, 0, 0]}>
        <group position={[-0.63, 1.20, 0]}>
          <RoundedBox args={[1.26, 2.36, 0.12]} radius={0.01} castShadow receiveShadow userData={{ keepOpaque: true }}>
            <meshToonMaterial color="#E5C08D" />
          </RoundedBox>
          <RoundedBox args={[1.14, 2.24, 0.135]} radius={0.006} castShadow receiveShadow userData={{ keepOpaque: true }}>
            <meshToonMaterial map={slatDoorTex} />
          </RoundedBox>
          {[-0.086, 0.086].map((cz, sideIdx) => (
            <group key={sideIdx} position={[-0.63, -1.20, cz]}>
              <RoundedBox args={[0.084, 0.44, 0.042]} position={[0.068, 1.68, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.40, 0.084, 0.042]} position={[0.22, 1.50, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.40, 0.084, 0.042]} position={[0.22, 1.34, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.084, 1.10, 0.042]} position={[0.068, 0.83, 0]} radius={0.008} castShadow userData={{ keepOpaque: true }}>
                <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.35} metalness={0.4} roughness={0.2} />
              </RoundedBox>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

// =====================================================================
// 3층 외부 복도 & 스테인리스 자동 개폐 엘리베이터
// =====================================================================
function AnimatedStainlessElevator3F({ position, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);

  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);
  const oakTex = useMemo(() => makeWoodGrainTexture('#E5B26E', '#B87C38'), []);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - position[0], pz - (position[2] - 0.7));
    const isOpen = forceOpen || dist < 2.1;

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
      <group position={[0, 0, 0.42]}>
        <RoundedBox args={[1.72, 0.06, 0.78]} position={[0, 0.03, 0]} radius={0.01}>
          <meshToonMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.72, 0.06, 0.78]} position={[0, 2.18, 0]} radius={0.01}>
          <meshBasicMaterial color="#FFFBEB" />
        </RoundedBox>
        <RoundedBox args={[1.72, 2.24, 0.06]} position={[0, 1.12, 0.36]} radius={0.01}>
          <meshToonMaterial map={oakTex} />
        </RoundedBox>
        <pointLight position={[0, 1.9, 0]} intensity={1.5} distance={3.5} color="#FFFBEB" />
      </group>

      <group position={[0, 1.06, 0.04]}>
        <RoundedBox ref={leftDoorRef} args={[0.67, 2.08, 0.05]} position={[-0.34, 0, 0]} radius={0.008} castShadow receiveShadow userData={{ keepOpaque: true }}>
          <meshStandardMaterial map={steelTex} color="#F8FAFC" emissive="#94A3B8" emissiveIntensity={0.22} metalness={0.45} roughness={0.22} />
        </RoundedBox>
        <RoundedBox ref={rightDoorRef} args={[0.67, 2.08, 0.05]} position={[0.34, 0, 0]} radius={0.008} castShadow receiveShadow userData={{ keepOpaque: true }}>
          <meshStandardMaterial map={steelTex} color="#F8FAFC" emissive="#94A3B8" emissiveIntensity={0.22} metalness={0.45} roughness={0.22} />
        </RoundedBox>
      </group>

      <RoundedBox args={[0.28, 2.36, 0.24]} position={[-0.82, 1.18, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.28} metalness={0.45} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.28, 2.36, 0.24]} position={[0.82, 1.18, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.28} metalness={0.45} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[1.92, 0.26, 0.25]} position={[0, 2.23, 0]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial map={steelTex} color="#FFFFFF" emissive="#CBD5E1" emissiveIntensity={0.28} metalness={0.45} roughness={0.2} />
      </RoundedBox>

      {showRoomSigns && (
        <Billboard position={[0, 2.62, 0]}>
          <mesh>
            <planeGeometry args={[1.22, 0.52]} />
            <meshBasicMaterial map={signTex} transparent />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// =====================================================================
// 무대 상단 조명 트러스 & 14구 스포트라이트 + 좌우 플라잉 스피커
// =====================================================================
function SanctuaryStageLightingTruss() {
  const spotlightPositions = [-3.9, -3.3, -2.7, -2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1, 2.7, 3.3, 3.9];

  return (
    <group position={[-0.2, 4.42, -3.15]}>
      {[-3.4, -1.2, 1.2, 3.4].map((hx, idx) => (
        <mesh key={`hanger_${idx}`} position={[hx, 0.52, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 1.04, 8]} />
          <meshToonMaterial color="#334155" />
        </mesh>
      ))}

      <RoundedBox args={[9.2, 0.055, 0.055]} position={[0, 0.14, 0]} radius={0.01} castShadow>
        <meshToonMaterial color="#1E293B" />
      </RoundedBox>
      <RoundedBox args={[9.2, 0.055, 0.055]} position={[0, 0.0, 0]} radius={0.01} castShadow>
        <meshToonMaterial color="#1E293B" />
      </RoundedBox>

      {Array.from({ length: 19 }).map((_, bIdx) => (
        <mesh key={`brace_${bIdx}`} position={[-4.5 + bIdx * 0.5, 0.07, 0]}>
          <boxGeometry args={[0.025, 0.14, 0.025]} />
          <meshToonMaterial color="#334155" />
        </mesh>
      ))}

      {spotlightPositions.map((sx, sIdx) => (
        <group key={`spot_${sIdx}`} position={[sx, -0.14, 0]} rotation={[0.42, (sIdx % 3 - 1) * 0.15, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshToonMaterial color="#334155" />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.085, 0.07, 0.22, 16]} />
            <meshToonMaterial color="#1E293B" />
          </mesh>
          <mesh position={[0, -0.112, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color={sIdx % 2 === 0 ? '#FEF08A' : '#FFFBEB'} />
          </mesh>
        </group>
      ))}

      {[-2.85, 2.85].map((spkX, spkIdx) => (
        <group key={`truss_spk_${spkIdx}`} position={[spkX, -0.58, 0.08]}>
          <RoundedBox args={[0.74, 0.04, 0.42]} position={[0, 0.46, 0]} radius={0.01}>
            <meshToonMaterial color="#334155" />
          </RoundedBox>
          <RoundedBox args={[0.68, 0.78, 0.48]} rotation={[0.24, 0, 0]} radius={0.025} castShadow>
            <meshToonMaterial color="#1E293B" />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
// ==================== PART 2 시작 ====================

// =====================================================================
// 3층 대예배당 & 후면 복도·엘리베이터 2.5D 카툰 3D 디오라마 씬
// =====================================================================
function SanctuaryMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnPew,
  onOpenSermonVideo,
  onOpenPraiseVideo,
  onOpenOfferingModal,
  onOpenBannerEditModal,
  onSelectNpcForChat,
  bannerConfig,
  sermonTitle,
  activeNpcChatIdx,
  showRoomSigns,
  playerIdxRef,
  isCrossDoorForcedOpen,
  isElevatorModalOpen,
  remotePeers,
  onSelectRemotePeer,
  holyLightEvent
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#F1C784', '#D29B4D'), []);
  const stageWoodTex = useMemo(() => makeWoodGrainTexture('#F3CE92', '#D4A056'), []);
  const wallTileTex = useMemo(() => makeWoodGrainTexture('#F6E8D8', '#E2CEB8'), []);
  const hallwayMarbleTex = useMemo(() => makeHallwayMarbleTexture(), []);
  const softCeilingGlowTex = useMemo(() => makeSoftCeilingGlowTexture(), []);
  const crystalGlassTex = useMemo(() => makeCrystalClearGlassTexture(), []);

  const broadcastMonitorTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, w - 12, h - 12);

      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(16, 16, w / 2 - 20, h / 2 - 16);
      ctx.fillStyle = '#065F46';
      ctx.fillRect(w / 2 + 4, 16, w / 2 - 20, h / 2 - 16);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('CAM 1: PULPIT', 28, 46);
      ctx.fillText('YOUTUBE LIVE', w / 2 + 16, 46);

      const bars = 24;
      for (let i = 0; i < bars; i++) {
        const bh = 20 + ((i * 17) % 65);
        ctx.fillStyle = i % 3 === 0 ? '#34D399' : i % 2 === 0 ? '#38BDF8' : '#FACC15';
        ctx.fillRect(20 + i * 20, h - 20 - bh, 12, bh);
      }
    }, 512, 256);
  }, []);

  const pewSideStanchionGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.26, 0.0);
    shape.lineTo(0.24, 0.0);
    shape.lineTo(0.32, 0.88);
    shape.lineTo(0.20, 0.90);
    shape.lineTo(0.11, 0.46);
    shape.lineTo(-0.24, 0.46);
    shape.lineTo(-0.28, 0.36);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 4
    });
  }, []);

  const welcomeCoverTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 18);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('좋은나무교회', w / 2, h / 2 - 14);
      ctx.fillText('환영합니다', w / 2, h / 2 + 34);
    }, 420, 150);
  }, []);

  const [customLeftBannerTex, setCustomLeftBannerTex] = useState(null);
  const [customRightBannerTex, setCustomRightBannerTex] = useState(null);

  useEffect(() => {
    if (bannerConfig?.leftImgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setCustomLeftBannerTex(tex);
      };
      img.src = bannerConfig.leftImgUrl;
    } else {
      setCustomLeftBannerTex(null);
    }

    if (bannerConfig?.rightImgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setCustomRightBannerTex(tex);
      };
      img.src = bannerConfig.rightImgUrl;
    } else {
      setCustomRightBannerTex(null);
    }
  }, [bannerConfig?.leftImgUrl, bannerConfig?.rightImgUrl]);

  const defaultLeftBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.55, '#F8FAFC');
      grad.addColorStop(1, '#38BDF8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(w / 2, 70, 16, 0, Math.PI * 2);
      ctx.fill();

      const lines = (bannerConfig?.leftText || '온 땅의\n구주\n예수 그리스도').split('\n');
      ctx.fillStyle = '#1E293B';
      ctx.font = '900 36px serif';
      ctx.textAlign = 'center';
      lines.forEach((ln, i) => {
        ctx.fillText(ln, w / 2, 165 + i * 56);
      });

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w / 2, 390);
      ctx.lineTo(w / 2, 480);
      ctx.moveTo(w / 2 - 32, 422);
      ctx.lineTo(w / 2 + 32, 422);
      ctx.stroke();
    }, 300, 560);
  }, [bannerConfig?.leftText]);

  const defaultRightBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#064E3B');
      grad.addColorStop(0.6, '#065F46');
      grad.addColorStop(1, '#047857');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOOD TREE VISION', w / 2, 75);

      const lines = (bannerConfig?.rightText || '말씀과 기도로\n거룩하여지는\n좋은나무교회').split('\n');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 40px serif';
      lines.forEach((ln, i) => {
        ctx.fillText(ln, w / 2, 190 + i * 64);
      });
    }, 300, 560);
  }, [bannerConfig?.rightText]);

  const bigScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.lineWidth = 6;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('김포 좋은나무교회 주일 대예배', w / 2, 90);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 56px serif';
      ctx.fillText(sermonTitle || '기적이 상식이 되는 5일의 기도', w / 2, 200);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('목사님·찬양팀·스크린 클릭 시 유튜브 영상이 상영됩니다', w / 2, 310);
    }, 1024, 400);
  }, [sermonTitle]);

  const signs = useMemo(() => ({
    offering: makeRoomSignTexture('감사/기도함', '클릭하여 감사·기도제목 올리기', '#F59E0B'),
    praiseTeam: makeRoomSignTexture('찬양팀 (전도사님 인도)', '클릭 시 찬양 영상 / 함께 찬양', '#EC4899'),
    pastor: makeRoomSignTexture('강대상 · 이성현 담임목사', '클릭 시 매일예배 설교 / 축도 받기', '#0284C7'),
    repPrayer: makeRoomSignTexture('대표기도석 (좌측)', '예배 대표기도 미니 강대상', '#10B981'),
    broadcast: makeRoomSignTexture('테라스 방송실', '음향·자막·카메라 컨트롤 부스', '#38BDF8'),
    rearDoor: makeRoomSignTexture('스틸 십자가 현관문', '다가가면 열림 · 복도 & 엘베 연결', '#D97706'),
    elevator3F: makeRoomSignTexture('3F 엘리베이터', '자동문 개폐 · 전 층(1F~7F) 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 본당 바닥 & 넓은 통로 러너 (2.5D 카툰 밝은 스톤 그레이) */}
      <RoundedBox args={[18.8, 0.2, 18.2]} position={[0, -0.1, -0.2]} radius={0.02} receiveShadow>
        <meshToonMaterial color="#D8DEE6" />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_LEFT, 0.005, 1.3]} receiveShadow>
        <planeGeometry args={[1.15, 9.6]} />
        <meshToonMaterial color="#C4CDD8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_RIGHT, 0.005, 1.3]} receiveShadow>
        <planeGeometry args={[1.15, 9.6]} />
        <meshToonMaterial color="#C4CDD8" />
      </mesh>

      {/* 현관 오른편 뒤쪽 벽면 감사/기도함 */}
      <group
        position={[4.25, 0, 6.95]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenOfferingModal) onOpenOfferingModal();
        }}
      >
        <group position={[-0.38, 0, 0]}>
          <RoundedBox args={[0.52, 0.98, 0.46]} position={[0, 0.49, 0]} radius={0.025} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.58, 0.08, 0.52]} position={[0, 1.00, 0]} radius={0.02} castShadow>
            <meshToonMaterial color="#92400E" />
          </RoundedBox>
          <mesh position={[0, 0.58, 0.24]}>
            <boxGeometry args={[0.04, 0.28, 0.015]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
          <mesh position={[0, 0.63, 0.24]}>
            <boxGeometry args={[0.18, 0.04, 0.015]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
        </group>

        <group position={[0.36, 0, 0]}>
          <RoundedBox args={[0.68, 0.78, 0.44]} position={[0, 0.39, 0]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          {[
            [-0.18, '#FFFFFF'],
            [-0.06, '#FEF08A'],
            [0.06, '#FBCFE8'],
            [0.18, '#BAE6FD']
          ].map(([ex, ecol], ei) => (
            <RoundedBox
              key={ei}
              args={[0.10, 0.20, 0.03]}
              position={[ex, 0.88, 0]}
              rotation={[0.18, 0, 0]}
              radius={0.005}
              castShadow
            >
              <meshToonMaterial color={ecol} />
            </RoundedBox>
          ))}
        </group>

        {showRoomSigns && (
          <Billboard position={[0, 1.72, 0]}>
            <mesh>
              <planeGeometry args={[1.18, 0.50]} />
              <meshBasicMaterial map={signs.offering} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* 2. 정면(북쪽 -Z) 강단 + 담임목사님 강대상 + 좌측 대표기도 미니 강대상 */}
      <group position={[-0.6, 0, -5.2]}>
        <RoundedBox args={[14.8, 0.48, 3.4]} position={[1.0, 0.24, 0.15]} radius={0.02} castShadow receiveShadow>
          <meshToonMaterial map={stageWoodTex} />
        </RoundedBox>

        <SmartCutawayWall wallSide="north">
          <RoundedBox args={[18.8, 5.4, 0.26]} position={[0.6, 2.7, -1.65]} radius={0.02} receiveShadow>
            <meshToonMaterial map={wallTileTex} />
          </RoundedBox>

          <RoundedBox args={[4.4, 1.65, 0.12]} position={[0.4, 1.30, -1.52]} radius={0.01} receiveShadow>
            <meshToonMaterial color="#1E3A5F" />
          </RoundedBox>

          <group
            position={[0.4, 3.22, -1.46]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSermonVideo) onOpenSermonVideo();
            }}
          >
            <RoundedBox args={[5.05, 2.22, 0.08]} radius={0.02} castShadow>
              <meshToonMaterial color="#1E293B" />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[4.90, 2.08]} />
              <meshBasicMaterial map={bigScreenTex} />
            </mesh>
          </group>
        </SmartCutawayWall>

        {[
          { bx: -2.35, tex: customLeftBannerTex || defaultLeftBannerTex },
          { bx: 3.15, tex: customRightBannerTex || defaultRightBannerTex }
        ].map((bItem, bIdx) => (
          <group
            key={`banner_${bIdx}`}
            position={[bItem.bx, 1.42, -1.25]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBannerEditModal) onOpenBannerEditModal();
            }}
          >
            <RoundedBox args={[0.84, 1.92, 0.04]} radius={0.015} castShadow>
              <meshToonMaterial color="#FFFFFF" />
            </RoundedBox>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[0.78, 1.85]} />
              <meshBasicMaterial map={bItem.tex} />
            </mesh>
          </group>
        ))}

        {/* 중앙 원목 설교 강대상 + 뒤쪽 목사님 전용 2단 레드카펫 발판 */}
        <group
          position={[0.4, 0.48, -0.05]}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSermonVideo) onOpenSermonVideo();
          }}
        >
          <RoundedBox args={[1.18, 0.20, 0.72]} position={[0, 0.10, -0.47]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.96, 0.18, 0.56]} position={[0, 0.29, -0.47]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial color="#B91C1C" />
          </RoundedBox>

          <RoundedBox args={[1.12, 0.12, 0.58]} position={[0, 0.06, 0]} radius={0.02} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.92, 0.74, 0.46]} position={[0, 0.45, 0]} radius={0.025} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[1.16, 0.10, 0.60]} position={[0, 0.85, 0]} radius={0.02} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          {[-0.18, 0.18].map((mx, mi) => (
            <mesh key={mi} position={[mx, 0.96, -0.05]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
              <meshToonMaterial color="#18181B" />
            </mesh>
          ))}
          <mesh position={[0.38, 0.96, 0.08]} castShadow>
            <sphereGeometry args={[0.10, 16, 16]} />
            <meshBasicMaterial color="#FFFBEB" />
          </mesh>
          <mesh position={[0, 0.49, 0.24]}>
            <boxGeometry args={[0.045, 0.32, 0.02]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
          <mesh position={[0, 0.55, 0.24]}>
            <boxGeometry args={[0.20, 0.045, 0.02]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
        </group>

        {/* 좌측 대표기도자 미니 강대상 & 2단 발판 */}
        <group position={[-4.05, 0.48, 0.80]} rotation={[0, 0.12, 0]}>
          <RoundedBox args={[0.88, 0.18, 0.56]} position={[0, 0.09, -0.48]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.72, 0.16, 0.44]} position={[0, 0.26, -0.48]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial color="#B91C1C" />
          </RoundedBox>
          <RoundedBox args={[0.68, 0.10, 0.46]} position={[0, 0.05, 0]} radius={0.015} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.66, 0.38]} position={[0, 0.40, 0]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.66, 0.08, 0.44]} position={[0, 0.76, 0]} rotation={[0.15, 0, 0]} radius={0.015} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.44, 0.198]}>
            <boxGeometry args={[0.038, 0.26, 0.015]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
          <mesh position={[0, 0.49, 0.198]}>
            <boxGeometry args={[0.16, 0.038, 0.015]} />
            <meshToonMaterial color="#FACC15" />
          </mesh>
        </group>

        {/* 강단 왼쪽 아래 십자가 원목 테이블 */}
        <group position={[-5.35, 0, 1.55]}>
          <RoundedBox args={[1.18, 0.07, 0.56]} position={[0, 0.74, 0]} radius={0.015} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.08, 0.72, 0.52]} position={[-0.52, 0.36, 0]} radius={0.01} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.08, 0.72, 0.52]} position={[0.52, 0.36, 0]} radius={0.01} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.98, 0.48, 0.04]} position={[0, 0.42, 0.20]} radius={0.01} castShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.42, 0.225]}>
            <boxGeometry args={[0.04, 0.34, 0.015]} />
            <meshToonMaterial color="#5C3418" />
          </mesh>
          <mesh position={[0, 0.48, 0.225]}>
            <boxGeometry args={[0.22, 0.04, 0.015]} />
            <meshToonMaterial color="#5C3418" />
          </mesh>
        </group>

        {/* 어쿠스틱 통기타 & 모니터 스피커 4대 */}
        <group position={[0.68, 0.48, 0.95]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.015, 0.14, 0.44, 8]} />
            <meshToonMaterial color="#18181B" />
          </mesh>
          <HighQualityAcousticGuitar position={[0, 0.36, 0.04]} rotation={[-0.25, Math.PI / 2, Math.PI / 2]} />
        </group>

        {[-0.45, 2.25].map((mx, mIdx) => (
          <group key={`stage_wedge_${mIdx}`} position={[mx, 0.56, 0.42]} rotation={[-0.38, 0, 0]}>
            <RoundedBox args={[0.46, 0.24, 0.32]} radius={0.02} castShadow>
              <meshToonMaterial color="#1E293B" />
            </RoundedBox>
          </group>
        ))}
        {[-1.45, 1.95].map((mx, mIdx) => (
          <group key={`floor_wedge_${mIdx}`} position={[mx, 0.12, 2.15]} rotation={[-0.38, 0, 0]}>
            <RoundedBox args={[0.50, 0.26, 0.34]} radius={0.02} castShadow>
              <meshToonMaterial color="#1E293B" />
            </RoundedBox>
          </group>
        ))}

        {/* 우측 앞: 듀얼 키보드(신디사이저) + 그랜드 피아노 */}
        <group position={[4.75, 0.0, 2.35]}>
          <RoundedBox args={[1.56, 0.74, 0.52]} position={[0, 0.37, 0]} radius={0.02} castShadow receiveShadow>
            <meshToonMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[1.42, 0.06, 0.22]} position={[0, 0.76, 0.12]} radius={0.01}>
            <meshToonMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[1.28, 0.06, 0.20]} position={[0, 0.86, -0.06]} radius={0.01}>
            <meshToonMaterial color="#1E293B" />
          </RoundedBox>
          <group position={[-0.12, 0.96, -0.12]} rotation={[-0.25, 0, 0]}>
            <RoundedBox args={[0.32, 0.22, 0.02]} radius={0.01}>
              <meshToonMaterial color="#090A0F" />
            </RoundedBox>
            <mesh position={[0, 0, 0.012]}>
              <planeGeometry args={[0.28, 0.18]} />
              <meshBasicMaterial color="#E0F2FE" />
            </mesh>
          </group>

          <group position={[1.55, 0, 0.15]}>
            <RoundedBox args={[1.38, 0.52, 1.45]} position={[0, 0.68, 0]} radius={0.12} castShadow>
              <meshToonMaterial color="#1E293B" />
            </RoundedBox>
            {[
              [-0.52, 0.52],
              [0.52, 0.52],
              [0.0, -0.55]
            ].map(([px, pz], pi) => (
              <mesh key={pi} position={[px, 0.22, pz]} castShadow>
                <cylinderGeometry args={[0.05, 0.035, 0.44, 12]} />
                <meshToonMaterial color="#0F172A" />
              </mesh>
            ))}
          </group>
        </group>

        {/* 강단 우측 드럼 세트 */}
        <HighQualityAtvDrumKit position={[5.85, 0.48, -0.25]} />
      </group>

      {/* 무대 상단 조명 트러스 */}
      <SanctuaryStageLightingTruss />

      {/* 3. 좌측 벽면 & 테라스 끝 방송실 부스 */}
      <SmartCutawayWall wallSide="west" minOpacity={0.18}>
        <group>
          <RoundedBox args={[0.26, 5.2, 21.0]} position={[-8.2, 2.6, 1.5]} radius={0.02} receiveShadow>
            <meshToonMaterial map={wallTileTex} />
          </RoundedBox>
          <RoundedBox args={[1.75, 0.42, 12.6]} position={[-7.15, 2.75, 0.6]} radius={0.025} castShadow receiveShadow>
            <meshToonMaterial map={wallTileTex} />
          </RoundedBox>
          <mesh position={[-6.30, 3.24, 0.6]}>
            <boxGeometry args={[0.04, 0.68, 12.4]} />
            <meshBasicMaterial map={crystalGlassTex} transparent opacity={0.65} />
          </mesh>
          <RoundedBox args={[0.06, 0.05, 12.4]} position={[-6.30, 3.58, 0.6]} radius={0.01}>
            <meshToonMaterial color="#CBD5E1" />
          </RoundedBox>

          <group position={[-7.05, 2.96, 4.15]}>
            <RoundedBox args={[0.96, 0.72, 2.75]} position={[0.15, 0.36, 0]} radius={0.02} castShadow receiveShadow>
              <meshToonMaterial color="#334155" />
            </RoundedBox>
            <RoundedBox args={[1.02, 0.06, 2.82]} position={[0.15, 0.74, 0]} radius={0.015} castShadow>
              <meshToonMaterial map={oakWoodTex} />
            </RoundedBox>
            <group position={[0.18, 0.78, -0.45]}>
              <RoundedBox args={[0.58, 0.09, 0.96]} rotation={[0, 0, -0.14]} radius={0.015} castShadow>
                <meshToonMaterial color="#1E293B" />
              </RoundedBox>
            </group>
            {[-0.78, 0.05, 0.85].map((mz, mi) => (
              <group
                key={`bm_${mi}`}
                position={[0.48, 1.06, mz]}
                rotation={[0, -Math.PI / 2 + (mi === 0 ? -0.18 : mi === 2 ? 0.18 : 0), 0]}
                userData={{ keepOpaque: true }}
              >
                <RoundedBox args={[0.68, 0.40, 0.035]} radius={0.015} castShadow userData={{ keepOpaque: true }}>
                  <meshToonMaterial color="#1E293B" />
                </RoundedBox>
                <mesh position={[0, 0, 0.02]} userData={{ keepOpaque: true }}>
                  <planeGeometry args={[0.64, 0.36]} />
                  <meshBasicMaterial map={broadcastMonitorTex} />
                </mesh>
              </group>
            ))}
            <RoundedBox args={[0.06, 0.18, 0.48]} position={[-0.82, 1.55, 0]} radius={0.015}>
              <meshBasicMaterial color="#EF4444" />
            </RoundedBox>
          </group>
        </group>
      </SmartCutawayWall>

      {/* 4. 상단 타원형 간접조명 링 */}
      <group position={[-0.2, 5.25, -3.2]} scale={[1.25, 1.0, 0.95]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.45, 0.14, 20, 72]} />
          <meshBasicMaterial color="#FFFBEB" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[7.8, 7.8]} />
          <meshBasicMaterial map={softCeilingGlowTex} transparent opacity={0.65} depthWrite={false} />
        </mesh>
      </group>

      {/* 5. 우측 벽면 + 남쪽 후면: 은색 스틸 십자가 현관문 + 4층 크리스탈 통유리 */}
      <SmartCutawayWall wallSide="east">
        <RoundedBox args={[0.26, 5.2, 21.0]} position={[8.2, 2.6, 1.5]} radius={0.02} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
      </SmartCutawayWall>

      <group position={[-3.6, 0, 6.85]}>
        <RoundedBox args={[1.15, 0.88, 0.52]} position={[0, 0.44, 0]} radius={0.02} castShadow receiveShadow>
          <meshToonMaterial map={oakWoodTex} />
        </RoundedBox>
        <RoundedBox args={[0.28, 0.06, 0.22]} position={[-0.22, 0.91, 0]} radius={0.005}>
          <meshToonMaterial color="#FFFFFF" />
        </RoundedBox>
        <RoundedBox args={[0.28, 0.06, 0.22]} position={[0.22, 0.91, 0]} radius={0.005}>
          <meshToonMaterial color="#FEF9C3" />
        </RoundedBox>
      </group>

      <SanctuaryRearCrossDoubleDoor
        position={[0, 0, 7.45]}
        playerIdxRef={playerIdxRef}
        forceOpen={isCrossDoorForcedOpen}
        onClickDoor={() => onSelectZone(ZONES_3F[6])}
      />
      {showRoomSigns && (
        <Billboard position={[0, 2.75, 7.25]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_3F[6]); }}>
            <planeGeometry args={[1.28, 0.54]} />
            <meshBasicMaterial map={signs.rearDoor} transparent />
          </mesh>
        </Billboard>
      )}

      {/* 3층 외부 대리석 복도 홀 & 스테인리스 자동 개폐 엘리베이터 */}
      <group position={[0, 0, 9.25]}>
        <RoundedBox args={[16.4, 0.22, 3.8]} position={[0, -0.09, 0]} radius={0.02} receiveShadow>
          <meshToonMaterial map={hallwayMarbleTex} />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -1.05]} receiveShadow>
          <planeGeometry args={[2.5, 1.1]} />
          <meshToonMaterial color="#475569" />
        </mesh>

        <AnimatedStainlessElevator3F
          position={[0, 0.02, 1.35]}
          playerIdxRef={playerIdxRef}
          forceOpen={isElevatorModalOpen}
          onClickElevator={() => onSelectZone(ZONES_3F[7])}
          signTex={signs.elevator3F}
          showRoomSigns={showRoomSigns}
        />
      </group>

      <SmartCutawayWall wallSide="south" minOpacity={0.22}>
        <RoundedBox args={[6.8, 2.7, 0.26]} position={[-4.8, 1.35, 7.45]} radius={0.02} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
        <RoundedBox args={[6.8, 2.7, 0.26]} position={[4.8, 1.35, 7.45]} radius={0.02} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
        <RoundedBox args={[2.6, 2.5, 0.26]} position={[-6.9, 3.95, 7.45]} radius={0.02} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
        <RoundedBox args={[2.6, 2.5, 0.26]} position={[6.9, 3.95, 7.45]} radius={0.02} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
        <RoundedBox args={[16.4, 0.38, 2.1]} position={[0, 2.75, 6.4]} radius={0.025} receiveShadow>
          <meshToonMaterial map={wallTileTex} />
        </RoundedBox>
        <mesh position={[0, 3.24, 5.38]} userData={{ keepOpaque: true }}>
          <planeGeometry args={[15.8, 0.68]} />
          <meshBasicMaterial map={crystalGlassTex} transparent opacity={0.68} side={THREE.DoubleSide} />
        </mesh>
        <RoundedBox args={[15.8, 0.05, 0.06]} position={[0, 3.58, 5.38]} radius={0.01} userData={{ keepOpaque: true }}>
          <meshToonMaterial color="#CBD5E1" />
        </RoundedBox>

        <group
          position={[0, 2.92, 5.26]}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSermonVideo) onOpenSermonVideo();
          }}
        >
          <RoundedBox args={[2.05, 1.12, 0.12]} radius={0.02} castShadow userData={{ keepOpaque: true }}>
            <meshToonMaterial color="#1E293B" />
          </RoundedBox>
          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]} userData={{ keepOpaque: true }}>
            <planeGeometry args={[1.92, 0.98]} />
            <meshBasicMaterial map={bigScreenTex} />
          </mesh>
          <mesh position={[0, 0, 0.065]} userData={{ keepOpaque: true }}>
            <planeGeometry args={[1.92, 0.98]} />
            <meshBasicMaterial map={bigScreenTex} />
          </mesh>
        </group>

        <group position={[0, 4.02, 7.42]}>
          <RoundedBox args={[11.2, 0.08, 0.16]} position={[0, 0.98, 0]} radius={0.01} userData={{ keepOpaque: true }}>
            <meshToonMaterial color="#CBD5E1" />
          </RoundedBox>
          <RoundedBox args={[11.2, 0.08, 0.16]} position={[0, -0.98, 0]} radius={0.01} userData={{ keepOpaque: true }}>
            <meshToonMaterial color="#CBD5E1" />
          </RoundedBox>
          {[-5.56, -3.6, -1.8, 0, 1.8, 3.6, 5.56].map((mx, mi) => (
            <RoundedBox key={mi} args={[0.07, 1.96, 0.16]} position={[mx, 0, 0]} radius={0.01} userData={{ keepOpaque: true }}>
              <meshToonMaterial color="#94A3B8" />
            </RoundedBox>
          ))}
          <mesh position={[0, 0, 0]} userData={{ keepOpaque: true }}>
            <planeGeometry args={[11.1, 1.90]} />
            <meshBasicMaterial map={crystalGlassTex} transparent opacity={0.72} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </SmartCutawayWall>

      {/* 6. 정통 원목 장의자(Pews) 3열 x 6줄 */}
      {PEW_ROWS.map((rz, rIdx) =>
        PEW_COLS.map((col) => {
          const pewKey = `${col.colId}_${rIdx}`;
          const hasWelcomeCover =
            (col.colId === 'L' && (rIdx === 3 || rIdx === 4)) ||
            (col.colId === 'C' && (rIdx === 1 || rIdx === 2));
          const isCurrentSeatedPew =
            seatedInfo && Math.abs(seatedInfo.z - (rz - 0.08)) < 0.25 && Math.abs(seatedInfo.x - col.x) < col.width * 0.6;

          return (
            <group
              key={pewKey}
              position={[col.x, 0, rz]}
              onClick={(e) => {
                e.stopPropagation();
                const clickX = Math.max(col.x - col.width * 0.36, Math.min(col.x + col.width * 0.36, e.point.x));
                onSitOnPew({
                  x: clickX,
                  z: rz - 0.08,
                  rowLabel: `${rIdx + 1}열 ${col.name}`
                });
              }}
            >
              <RoundedBox args={[col.width - 0.10, 0.07, 0.44]} position={[0, 0.38, -0.04]} radius={0.015} castShadow receiveShadow>
                <meshToonMaterial map={oakWoodTex} />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.14, 0.06, 0.40]} position={[0, 0.42, -0.05]} radius={0.02} castShadow receiveShadow>
                <meshToonMaterial color="#967E69" />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.14, 0.28, 0.04]} position={[0, 0.18, 0.10]} radius={0.01} castShadow receiveShadow>
                <meshToonMaterial map={oakWoodTex} />
              </RoundedBox>

              <group position={[0, 0.64, 0.20]} rotation={[0.14, 0, 0]}>
                <RoundedBox args={[col.width, 0.54, 0.07]} position={[0, 0, 0]} radius={0.02} castShadow receiveShadow>
                  <meshToonMaterial map={oakWoodTex} color={isCurrentSeatedPew ? '#FEF08A' : '#FFFFFF'} />
                </RoundedBox>
                <RoundedBox args={[col.width + 0.02, 0.06, 0.09]} position={[0, 0.27, 0]} radius={0.025} castShadow>
                  <meshToonMaterial color="#E5A93B" />
                </RoundedBox>
                <RoundedBox args={[col.width - 0.24, 0.04, 0.12]} position={[0, -0.06, 0.08]} radius={0.01} castShadow>
                  <meshToonMaterial map={oakWoodTex} />
                </RoundedBox>

                {hasWelcomeCover && (
                  <group position={[col.colId === 'C' ? 0.65 : -0.25, 0.16, 0]}>
                    <RoundedBox args={[0.86, 0.24, 0.11]} radius={0.015} castShadow>
                      <meshToonMaterial color="#FFFFFF" />
                    </RoundedBox>
                    <mesh position={[0, 0, 0.058]}>
                      <planeGeometry args={[0.82, 0.21]} />
                      <meshBasicMaterial map={welcomeCoverTex} />
                    </mesh>
                    <mesh position={[0, 0, -0.058]} rotation={[0, Math.PI, 0]}>
                      <planeGeometry args={[0.82, 0.21]} />
                      <meshBasicMaterial map={welcomeCoverTex} />
                    </mesh>
                  </group>
                )}
              </group>

              <mesh geometry={pewSideStanchionGeo} position={[-col.width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                <meshToonMaterial map={oakWoodTex} />
              </mesh>
              <mesh geometry={pewSideStanchionGeo} position={[col.width / 2 + 0.08, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                <meshToonMaterial map={oakWoodTex} />
              </mesh>
            </group>
          );
        })
      )}

      {/* 7. 인물 배치 (담임목사님, 대표기도 장로님, 방송실 간사님, 찬양팀, 악기팀, 성도 25명) */}
      <SmoothChibiAvatar
        position={[BROADCAST_ENGINEER_NPC.x, BROADCAST_ENGINEER_NPC.y, BROADCAST_ENGINEER_NPC.z]}
        rotationY={BROADCAST_ENGINEER_NPC.rotY}
        gender={BROADCAST_ENGINEER_NPC.gender}
        hairStyle={BROADCAST_ENGINEER_NPC.hairStyle}
        isPianist={true}
        shirtColor={BROADCAST_ENGINEER_NPC.shirt}
        pantsColor={BROADCAST_ENGINEER_NPC.pants}
        hairColor={BROADCAST_ENGINEER_NPC.hair}
        speechBubbleText={
          activeNpcChatIdx % 8 === 6
            ? `${BROADCAST_ENGINEER_NPC.name}: ${BROADCAST_ENGINEER_NPC.dialogues[activeNpcChatIdx % BROADCAST_ENGINEER_NPC.dialogues.length]}`
            : null
        }
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectNpcForChat) onSelectNpcForChat(BROADCAST_ENGINEER_NPC);
        }}
      />

      <SmoothChibiAvatar
        position={[PASTOR_NPC.x, PASTOR_NPC.y, PASTOR_NPC.z]}
        rotationY={PASTOR_NPC.rotY}
        gender={PASTOR_NPC.gender}
        hairStyle={PASTOR_NPC.hairStyle}
        isPastor={true}
        emote={holyLightEvent ? 'bless' : null}
        shirtColor={PASTOR_NPC.shirt}
        pantsColor={PASTOR_NPC.pants}
        hairColor={PASTOR_NPC.hair}
        speechBubbleText={
          activeNpcChatIdx % 6 === 0
            ? `${PASTOR_NPC.name}: ${PASTOR_NPC.dialogues[(activeNpcChatIdx / 6) % PASTOR_NPC.dialogues.length | 0]}`
            : null
        }
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectNpcForChat) onSelectNpcForChat({ ...PASTOR_NPC, isPastorAction: true });
        }}
      />

      <SmoothChibiAvatar
        position={[REP_PRAYER_NPC.x, REP_PRAYER_NPC.y, REP_PRAYER_NPC.z]}
        rotationY={REP_PRAYER_NPC.rotY}
        gender={REP_PRAYER_NPC.gender}
        hairStyle={REP_PRAYER_NPC.hairStyle}
        shirtColor={REP_PRAYER_NPC.shirt}
        pantsColor={REP_PRAYER_NPC.pants}
        hairColor={REP_PRAYER_NPC.hair}
        speechBubbleText={
          activeNpcChatIdx % 7 === 3
            ? `${REP_PRAYER_NPC.name}: ${REP_PRAYER_NPC.dialogues[activeNpcChatIdx % REP_PRAYER_NPC.dialogues.length]}`
            : null
        }
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectNpcForChat) onSelectNpcForChat(REP_PRAYER_NPC);
        }}
      />

      {PRAISE_TEAM_5_NPCS.map((pt, pIdx) => {
        const isTalking = activeNpcChatIdx % 9 === pIdx + 1 && pIdx < 2;
        const msg = isTalking ? `${pt.name}: ${pt.dialogues[activeNpcChatIdx % pt.dialogues.length]}` : null;

        return (
          <group key={pt.id}>
            <group position={[pt.x, pt.y, pt.z + 0.28]}>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.10, 0.12, 0.03, 12]} />
                <meshToonMaterial color="#18181B" />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.74, 8]} />
                <meshToonMaterial color="#27272A" />
              </mesh>
              {pt.isLeader && (
                <RoundedBox args={[0.38, 0.26, 0.02]} position={[0, 0.62, 0.06]} rotation={[-0.4, 0, 0]} radius={0.005}>
                  <meshToonMaterial color="#090A0F" />
                </RoundedBox>
              )}
            </group>

            <SmoothChibiAvatar
              position={[pt.x, pt.y, pt.z]}
              rotationY={pt.rotY}
              gender={pt.gender}
              hairStyle={pt.hairStyle}
              isPraiseTeam={true}
              isGuitarist={Boolean(pt.hasAcousticGuitar)}
              isSkirt={pt.isSkirt}
              shirtColor={pt.shirt}
              pantsColor={pt.pants}
              hairColor={pt.hair}
              speechBubbleText={msg}
              seedOffset={pIdx * 1.3}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectNpcForChat) onSelectNpcForChat({ ...pt, isPraiseAction: true });
              }}
            />
          </group>
        );
      })}

      {BAND_INSTRUMENT_NPCS.map((instNpc, bIdx) => {
        const isTalking = activeNpcChatIdx % 10 === bIdx + 4 && bIdx === 0;
        const msg = isTalking ? `${instNpc.name}: ${instNpc.dialogues[activeNpcChatIdx % instNpc.dialogues.length]}` : null;

        return (
          <SmoothChibiAvatar
            key={instNpc.id}
            position={[instNpc.x, instNpc.y, instNpc.z]}
            rotationY={instNpc.rotY}
            gender={instNpc.gender}
            hairStyle={instNpc.hairStyle}
            isPianist={Boolean(instNpc.isPianist)}
            isGuitarist={Boolean(instNpc.isGuitarist)}
            isDrummer={Boolean(instNpc.isDrummer)}
            isSkirt={Boolean(instNpc.isSkirt)}
            shirtColor={instNpc.shirt}
            pantsColor={instNpc.pants}
            hairColor={instNpc.hair}
            speechBubbleText={msg}
            seedOffset={bIdx * 2.1}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectNpcForChat) onSelectNpcForChat({ ...instNpc, isPraiseAction: true });
            }}
          />
        );
      })}

      {CONGREGATION_NPCS.map((npc, idx) => {
        const isSpeakingNow = idx === activeNpcChatIdx % CONGREGATION_NPCS.length;
        const msgList = npc.dialogues || [];
        const currentMsg = isSpeakingNow && msgList.length > 0
          ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}`
          : null;

        return (
          <SmoothChibiAvatar
            key={npc.id}
            position={[npc.x, 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            patrolX={npc.patrolX || null}
            rotationY={npc.seated ? Math.PI : (npc.rotY || 0)}
            gender={npc.gender}
            hairStyle={npc.hairStyle}
            isSeated={npc.seated}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={currentMsg}
            seedOffset={idx * 1.3}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectNpcForChat) onSelectNpcForChat(npc);
            }}
          />
        );
      })}

      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar3F
          key={peer.clientId}
          peer={peer}
          onClickPeer={onSelectRemotePeer}
        />
      ))}

      {holyLightEvent && (
        <HolyLightBeamEffect3F
          targetPos={holyLightEvent.targetPos}
          pastorName={holyLightEvent.pastorName}
          targetName={holyLightEvent.targetName}
        />
      )}

      {showRoomSigns && (
        <>
          <Billboard position={[-0.2, 2.52, -5.4]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onOpenSermonVideo) onOpenSermonVideo(); }}>
              <planeGeometry args={[1.25, 0.54]} />
              <meshBasicMaterial map={signs.pastor} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-0.95, 1.95, -3.6]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onOpenPraiseVideo) onOpenPraiseVideo(); }}>
              <planeGeometry args={[1.3, 0.54]} />
              <meshBasicMaterial map={signs.praiseTeam} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-4.65, 2.25, -4.65]}>
            <mesh>
              <planeGeometry args={[1.15, 0.48]} />
              <meshBasicMaterial map={signs.repPrayer} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-6.8, 4.45, 4.15]}>
            <mesh>
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs.broadcast} transparent />
            </mesh>
          </Billboard>
        </>
      )}

      {ZONES_3F.map((z) => (
        <HologramZoneMarker
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isOfferingBox && onOpenOfferingModal) onOpenOfferingModal();
            else if (sel.isPraiseZone && onOpenPraiseVideo) onOpenPraiseVideo();
            else if (sel.isSermonZone && onOpenSermonVideo) onOpenSermonVideo();
            else if (sel.isSeatZone && sel.seatTarget) onSitOnPew(sel.seatTarget);
            else onSelectZone(sel);
          }}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 3인칭 캐릭터 뒷모습 추적 카메라 + 플레이어 컨트롤러
// =====================================================================
function PlayerController3F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  playerOffice,
  avatarConfig,
  emote,
  myChatBubble,
  cameraFollowMode,
  controlsRef,
  onPositionUpdate
}) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [0.35, 0, 0.52],
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
      ctx.fillText(`나 · ${isPastor ? '✝' : ''}${playerName}`, w / 2 + 18, h / 2 + 2);
    }, 540, 110);
  }, [playerName, playerOffice]);

  useFrame(({ camera }, delta) => {
    let curX = playerIdxRef.current[0];
    let curZ = playerIdxRef.current[2];

    if (seatedInfo) {
      curX = seatedInfo.x;
      curZ = seatedInfo.z;
      playerIdxRef.current = [curX, 0, curZ];
      if (renderState.walking || renderState.pos[0] !== curX || renderState.pos[2] !== curZ) {
        setRenderState({
          pos: [curX, 0, curZ],
          rotY: Math.PI,
          walking: false
        });
      }
    } else if (waypoints && waypoints.length > 0) {
      const currentTarget = waypoints[Math.min(wpIndexRef.current, waypoints.length - 1)];
      if (currentTarget) {
        const [tx, tz] = currentTarget;
        const dx = tx - curX;
        const dz = tz - curZ;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.08) {
          const step = Math.min(dist, delta * 4.4);
          const rawNx = curX + (dx / dist) * step;
          const rawNz = curZ + (dz / dist) * step;
          const [nx, nz] = resolveCollision3F(rawNx, rawNz);
          curX = nx;
          curZ = nz;
          playerIdxRef.current = [nx, 0, nz];
          const angle = Math.atan2(dx, dz);
          setRenderState({
            pos: [nx, 0, nz],
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
      }
    }

    if (cameraFollowMode && controlsRef.current) {
      const ctrl = controlsRef.current;
      const targetLookX = curX * 0.65;
      const targetLookY = 1.15;
      const targetLookZ = curZ - 1.65;

      const prevTargetX = ctrl.target.x;
      const prevTargetZ = ctrl.target.z;

      ctrl.target.x = THREE.MathUtils.lerp(ctrl.target.x, targetLookX, delta * 5.0);
      ctrl.target.y = THREE.MathUtils.lerp(ctrl.target.y, targetLookY, delta * 5.0);
      ctrl.target.z = THREE.MathUtils.lerp(ctrl.target.z, targetLookZ, delta * 5.0);

      const moveDx = ctrl.target.x - prevTargetX;
      const moveDz = ctrl.target.z - prevTargetZ;
      camera.position.x += moveDx;
      camera.position.z += moveDz;
    }
  });

  return (
    <SmoothChibiAvatar
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

// 2.5D 아이소메트릭 미니어처 느낌의 좁은 FOV 카메라 세팅
function InitialCameraSetup({ controlsRef }) {
  const { camera, size } = useThree();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isMobilePortrait = size.width < 640;
    if (isMobilePortrait) {
      camera.position.set(0.0, 6.2, 8.6);
      camera.fov = 38;
    } else {
      camera.position.set(0.0, 5.2, 7.6);
      camera.fov = 35;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0.2, 1.15, -1.2);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

const DEFAULT_AVATAR_3F = {
  gender: 'male',
  hairStyle: 'parted',
  isSkirt: false,
  shirtColor: '#FACC15',
  pantsColor: '#0284C7',
  hairColor: '#EAB308',
  hasSunglasses: true
};

export default function Sanctuary3F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer3f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([0.35, 0, 0.52]);
  const playerRotRef = useRef(Math.PI);
  const channelRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  const [avatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gtc_metaverse_avatar_v1');
      return saved ? { ...DEFAULT_AVATAR_3F, ...JSON.parse(saved) } : DEFAULT_AVATAR_3F;
    } catch {
      return DEFAULT_AVATAR_3F;
    }
  });

  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);
  const initialPraise = useMemo(() => getSyncedPraiseVideo(), []);

  const [waypoints, setWaypoints] = useState([[0.35, 0.52]]);
  const [seatedInfo, setSeatedInfo] = useState({ x: 0.35, z: 0.52, rowLabel: '중앙 새가족 환영석 (3열)' });
  const [activeZone, setActiveZone] = useState(ZONES_3F[4]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');

  const [cameraFollowMode, setCameraFollowMode] = useState(true);
  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  // 모바일 시야 확보용 통합 메뉴 드로어 (기본 닫힘)
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(false);
  const [isCrossDoorForcedOpen, setIsCrossDoorForcedOpen] = useState(false);

  const [mediaMode, setMediaMode] = useState('sermon');
  const [sermonVideo, setSermonVideo] = useState(initialSermon);
  const [praiseVideo, setPraiseVideo] = useState(initialPraise);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editTitleInput, setEditTitleInput] = useState('');

  const [showBannerEditModal, setShowBannerEditModal] = useState(false);
  const [bannerConfig, setBannerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('church_3f_banner_config');
      return saved ? JSON.parse(saved) : {
        leftText: '온 땅의\n구주\n예수 그리스도',
        rightText: '말씀과 기도로\n거룩하여지는\n좋은나무교회',
        leftImgUrl: '',
        rightImgUrl: '',
        bgColorTop: '#ECFDF5',
        bgColorBottom: '#A7F3D0'
      };
    } catch (_) {
      return {
        leftText: '온 땅의\n구주\n예수 그리스도',
        rightText: '말씀과 기도로\n거룩하여지는\n좋은나무교회',
        leftImgUrl: '',
        rightImgUrl: '',
        bgColorTop: '#ECFDF5',
        bgColorBottom: '#A7F3D0'
      };
    }
  });

  const handleSaveBannerConfig = (nextCfg) => {
    setBannerConfig(nextCfg);
    try {
      localStorage.setItem('church_3f_banner_config', JSON.stringify(nextCfg));
    } catch (_) {}
  };

  const handleBannerImageFileUpload = (side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const nextCfg = {
        ...bannerConfig,
        [side === 'left' ? 'leftImgUrl' : 'rightImgUrl']: dataUrl
      };
      handleSaveBannerConfig(nextCfg);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [offeringType, setOfferingType] = useState('감사제목');
  const [thanksNote, setThanksNote] = useState('');
  const [prayerNote, setPrayerNote] = useState('');
  const [offeringHistory, setOfferingHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('church_3f_offering_prayers');
      return saved ? JSON.parse(saved) : [
        { id: 1, writer: '김장로', type: '감사·기도', thanks: '한 주간 가족 모두 건강하게 지켜주심에 감사합니다.', prayer: '다음세대와 교회의 부흥을 위해 기도합니다.', date: '오늘' },
        { id: 2, writer: '최권사', type: '감사제목', thanks: '범사에 감사하며 기쁨으로 예배드립니다.', prayer: '자녀들의 믿음 성장을 위해 기도합니다.', date: '오늘' }
      ];
    } catch (_) {
      return [];
    }
  });

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Supabase Realtime 3층 본당 멀티플레이어 채널 동기화
  const broadcastMyState3F = useCallback(
    (override = {}) => {
      if (!channelRef.current) return;
      const [px, , pz] = playerIdxRef.current;
      const payload = {
        clientId: clientIdRef.current,
        name: playerName,
        office: playerOffice,
        x: Number(px.toFixed(2)),
        z: Number(pz.toFixed(2)),
        rotY: Number((playerRotRef.current || Math.PI).toFixed(2)),
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
    const channel = supabase.channel('metaverse_sanctuary_3f', {
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
          if (items && items.length > 0) peers.push(items[items.length - 1]);
        });
        setRemotePeers(peers);
      })
      .on('broadcast', { event: 'holy_blessing_3f' }, ({ payload }) => {
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
      broadcastMyState3F({ emote: emoteType, chatMsg: chatText });

      setTimeout(() => {
        setEmote(null);
        broadcastMyState3F({ emote: null, chatMsg: chatText });
      }, 3800);

      if (chatText) {
        setTimeout(() => {
          setMyChatBubble('');
          broadcastMyState3F({ emote: null, chatMsg: '' });
        }, 5500);
      }
    },
    [broadcastMyState3F]
  );

  const triggerHolyBenediction3F = useCallback(
    (pastorDisplayName, targetDisplayName, targetCoords) => {
      const eventPayload = {
        pastorName: pastorDisplayName,
        targetName: targetDisplayName,
        targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]],
        ts: Date.now()
      };

      playHolyBlessingSound();
      setHolyLightEvent(eventPayload);
      triggerSocialAction('pray', `아멘! ${pastorDisplayName}의 축도를 감사히 받습니다`);

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'holy_blessing_3f',
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

  const handleOpenSermonVideo = useCallback(() => {
    setMediaMode('sermon');
    setIsScreenPlaying(true);
  }, []);

  const handleOpenPraiseVideo = useCallback(() => {
    setMediaMode('praise');
    setIsScreenPlaying(true);
  }, []);

  const handleSitOnPew = useCallback(
    (seatData) => {
      setSeatedInfo(seatData);
      setWaypoints([[seatData.x, seatData.z]]);
      setMediaMode('sermon');
      setIsScreenPlaying(true);
      setTimeout(() => broadcastMyState3F(), 100);
    },
    [broadcastMyState3F]
  );

  const handleStandUp = useCallback(() => {
    const curX = seatedInfo ? seatedInfo.x : 0.35;
    const curZ = seatedInfo ? seatedInfo.z : 0.52;
    const exitX = curX < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT;
    setSeatedInfo(null);
    setIsScreenPlaying(false);
    setWaypoints([[exitX, curZ - 0.35]]);
    setTimeout(() => broadcastMyState3F(), 100);
  }, [seatedInfo, broadcastMyState3F]);

  const handleWalkToPoint = useCallback(
    (targetX, targetZ) => {
      const [sx, , sz] = playerIdxRef.current;
      const startX = seatedInfo ? (seatedInfo.x < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT) : sx;
      const startZ = seatedInfo ? seatedInfo.z - 0.35 : sz;
      if (seatedInfo) setSeatedInfo(null);

      if (cameraFollowMode && controlsRef.current) {
        controlsRef.current.object.position.set(startX * 0.7, 4.8, startZ + 6.4);
      }

      const path = computeSmartPath3F(startX, startZ, targetX, targetZ);
      setWaypoints(path);
    },
    [seatedInfo, cameraFollowMode]
  );

  const handleSelectNpcForChat = useCallback(
    (npc) => {
      setChatReplyText(
        (npc.dialogues && npc.dialogues[0]) ||
          '할렐루야 성도님! 오늘 본당에서 함께 예배드리게 되어 참 반갑고 기쁩니다.'
      );
      setSelectedChatNpc(npc);
      triggerSocialAction('wave');
    },
    [triggerSocialAction]
  );

  const handleSubmitOfferingEnvelope = () => {
    if (!thanksNote.trim() && !prayerNote.trim()) {
      alert('감사제목 또는 기도제목을 한 줄 이상 적어주세요.');
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const newEntry = {
      id: Date.now(),
      writer: playerName,
      type: offeringType,
      thanks: thanksNote.trim() || '주님의 은혜에 감사드립니다.',
      prayer: prayerNote.trim() || '주님의 뜻이 이루어지길 기도합니다.',
      date: todayKey
    };

    const nextList = [newEntry, ...offeringHistory].slice(0, 30);
    setOfferingHistory(nextList);
    try {
      localStorage.setItem('church_3f_offering_prayers', JSON.stringify(nextList));
      const rawDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const todayData = rawDaily[todayKey] || {};
      const appendedThanks = (todayData.thanksNote ? todayData.thanksNote + '\n' : '') + `[3F감사함] ${newEntry.thanks}`;
      const appendedPrayer = (todayData.prayerNote ? todayData.prayerNote + '\n' : '') + `[3F기도함] ${newEntry.prayer}`;
      rawDaily[todayKey] = {
        ...todayData,
        thanksNote: appendedThanks,
        prayerNote: appendedPrayer
      };
      localStorage.setItem('qt_daily', JSON.stringify(rawDaily));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}

    setThanksNote('');
    setPrayerNote('');
    triggerSocialAction('pray', '하나님께 감사와 기도의 제목을 올려드렸습니다');
    alert('작성하신 감사와 기도제목이 감사/기도함에 등록되어 영성 노트에 자동 연동되었습니다.');
  };

  useEffect(() => {
    if (!isMenuDrawerOpen) return;
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#F1C784';
    ctx.fillRect(10, 6, w - 20, 18);
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(12, 28, 24, 34);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(42, 28, 30, 34);
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(76, 28, 24, 34);
    ctx.fillStyle = '#D97706';
    ctx.fillRect(45, 68, 24, 5);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(45, 82, 24, 8);

    remotePeers.forEach((p) => {
      const px = (((p.x || 0) + 8.0) / 16.0) * w;
      const py = (((p.z || 0) + 6.5) / 17.5) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    });

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 8.0) / 16.0) * w;
    const my = ((cz + 6.5) / 17.5) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMenuDrawerOpen, remotePeers]);

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
    const found = ZONES_3F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }

    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) {
      lastSyncTimeRef.current = now;
      broadcastMyState3F();
    }
  };

  const activeMedia = mediaMode === 'praise' ? praiseVideo : sermonVideo;

  return (
    <div
      translate="no"
      style={{ background: 'linear-gradient(180deg, #DCECFB 0%, #F4EFE6 100%)' }}
      className="notranslate w-full h-full relative overflow-hidden select-none font-sans"
    >
      {/* 1. 슬림 상단 바 (모바일·태블릿 3D 본당 시야 최대 확보) */}
      <header className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto min-w-0">
          <button
            type="button"
            onClick={onExitHome}
            className="h-9 px-3 rounded-2xl bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-sm text-[12.5px] font-bold text-[#191F28] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>◀ 3F 본당</span>
          </button>

          <div className="h-9 px-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={() =>
              triggerHolyBenediction3F(
                canPlayerBless ? `${playerName} 목사님` : '이성현·방희곤·최수경 목사님',
                playerName,
                playerIdxRef.current
              )
            }
            className="h-9 px-3 rounded-2xl bg-amber-500 text-white shadow-sm text-[11.5px] font-bold cursor-pointer"
          >
            축도
          </button>

          <button
            type="button"
            onClick={handleOpenSermonVideo}
            className="h-9 px-3 rounded-2xl bg-[#2563EB] text-white shadow-sm text-[11.5px] font-bold cursor-pointer"
          >
            예배영상
          </button>

          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen((p) => !p)}
            className={`h-9 px-3 rounded-2xl shadow-sm text-[11.5px] font-bold border cursor-pointer transition-colors ${
              isMenuDrawerOpen
                ? 'bg-[#191F28] text-white border-[#191F28]'
                : 'bg-white/92 text-[#191F28] border-slate-200/80'
            }`}
          >
            {isMenuDrawerOpen ? '닫기' : '메뉴'}
          </button>
        </div>
      </header>

      {/* 2. 접이식 통합 메뉴 & 미니맵 드로어 (필요할 때만 열기) */}
      {isMenuDrawerOpen && (
        <div
          onClick={() => setIsMenuDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] flex justify-end pt-14 pr-2.5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[265px] max-h-[78vh] bg-white/96 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl p-3.5 space-y-3 overflow-y-auto hide-scrollbar text-[#191F28]"
          >
            <div className="flex justify-center">
              <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextMode = !cameraFollowMode;
                  setCameraFollowMode(nextMode);
                  if (controlsRef.current) {
                    const [px, , pz] = playerIdxRef.current;
                    if (nextMode) {
                      controlsRef.current.object.position.set(px * 0.7, 4.8, pz + 6.4);
                      controlsRef.current.target.set(px * 0.65, 1.15, pz - 1.65);
                    } else {
                      controlsRef.current.object.position.set(-7.8, 6.2, 9.6);
                      controlsRef.current.target.set(0.0, 1.25, -1.2);
                    }
                    controlsRef.current.update();
                  }
                }}
                className={`py-2 px-2 rounded-xl text-[11.5px] font-bold cursor-pointer ${
                  cameraFollowMode ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {cameraFollowMode ? '추적뷰 ON' : '전체 조감도'}
              </button>

              <button
                type="button"
                onClick={() => setShowRoomSigns((prev) => !prev)}
                className={`py-2 px-2 rounded-xl text-[11.5px] font-bold cursor-pointer ${
                  showRoomSigns ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {showRoomSigns ? '간판 켜짐' : '간판 숨김'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  handleOpenPraiseVideo();
                }}
                className="py-2 px-2 rounded-xl bg-pink-50 text-pink-600 text-[11.5px] font-bold cursor-pointer"
              >
                찬양팀 영상
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  setShowOfferingModal(true);
                }}
                className="py-2 px-2 rounded-xl bg-amber-50 text-amber-700 text-[11.5px] font-bold cursor-pointer"
              >
                감사/기도함
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  setShowBannerEditModal(true);
                }}
                className="py-2 px-2 rounded-xl bg-slate-100 text-slate-700 text-[11.5px] font-bold cursor-pointer"
              >
                배너 수정
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  if (setActiveScreen) setActiveScreen('sermon');
                }}
                className="py-2 px-2 rounded-xl bg-blue-50 text-[#2563EB] text-[11.5px] font-bold cursor-pointer"
              >
                예배노트
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  if (seatedInfo) handleStandUp();
                  else handleSitOnPew({ x: 0.35, z: 0.52, rowLabel: '중앙 새가족 환영석 (3열)' });
                }}
                className="py-2 px-2 rounded-xl bg-slate-100 text-slate-700 text-[11.5px] font-bold cursor-pointer"
              >
                {seatedInfo ? '일어나기' : '장의자 착석'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  setIsCrossDoorForcedOpen(true);
                  handleWalkToPoint(0.0, 9.25);
                  setModalZone(ZONES_3F[7]);
                }}
                className="py-2 px-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11.5px] font-bold cursor-pointer"
              >
                엘리베이터
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 px-1 block">본당 8대 구역 이동</span>
              {ZONES_3F.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    if (z.isOfferingBox) {
                      handleWalkToPoint(z.pos[0], z.pos[2]);
                      setShowOfferingModal(true);
                    } else if (z.isPraiseZone) handleOpenPraiseVideo();
                    else if (z.isSermonZone) handleOpenSermonVideo();
                    else if (z.isSeatZone && z.seatTarget) handleSitOnPew(z.seatTarget);
                    else if (z.isCrossDoor) {
                      setIsCrossDoorForcedOpen(true);
                      handleWalkToPoint(0.0, 8.6);
                    } else {
                      handleWalkToPoint(z.pos[0], z.pos[2]);
                      setActiveZone(z);
                      setModalZone(z);
                    }
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-left text-[11.5px] font-bold text-slate-700 hover:text-[#2563EB] truncate cursor-pointer"
                >
                  {z.badge}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. 설교 / 찬양 듀얼 유튜브 플레이어 모달 */}
      {isScreenPlaying && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[460px] bg-[#0F172A] border border-white/15 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto text-white">
          <div className="px-3 py-2 bg-[#1E293B] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setMediaMode('sermon')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer shrink-0 ${
                  mediaMode === 'sermon' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/75'
                }`}
              >
                설교
              </button>
              <button
                type="button"
                onClick={() => setMediaMode('praise')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer shrink-0 ${
                  mediaMode === 'praise' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/75'
                }`}
              >
                찬양
              </button>
              <span className="text-[12px] font-bold truncate ml-1">{activeMedia.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={handleOpenLinkEditModal} className="text-[11px] font-bold text-amber-300 cursor-pointer">
                링크변경
              </button>
              <button type="button" onClick={() => setIsScreenPlaying(false)} className="text-xs font-bold px-1 cursor-pointer">
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
                title="Sanctuary Live Media"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
                <p className="text-xs text-slate-300">등록된 유튜브 링크가 없습니다.</p>
                <button
                  type="button"
                  onClick={handleOpenLinkEditModal}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  유튜브 링크 입력하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 슬림 하단 바 (리액션 칩 + 1줄 말풍선 채팅 + 층 전환) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-1.5 pointer-events-none max-w-[540px] mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pointer-events-auto">
          {[
            { label: '인사', emote: 'wave', msg: '할렐루야! 성도님 반갑습니다' },
            { label: '기도하기', emote: 'pray', msg: '주님, 오늘 예배 가운데 임재하여 주옵소서' },
            { label: '워십댄스', emote: 'dance', msg: '기쁨으로 주님을 찬양합니다! 할렐루야' },
            { label: '아멘·만세', emote: 'praise', msg: '아멘! 주님께 영광 돌립니다' }
          ].map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => triggerSocialAction(act.emote, act.msg)}
              className="px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-xs text-[11px] font-bold text-[#191F28] hover:bg-blue-50 hover:text-[#2563EB] whitespace-nowrap cursor-pointer"
            >
              {act.label}
            </button>
          ))}
          {seatedInfo && (
            <button
              type="button"
              onClick={handleStandUp}
              className="px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs text-[11px] font-bold whitespace-nowrap cursor-pointer"
            >
              일어나기
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickChatInput.trim()) return;
            triggerSocialAction('wave', quickChatInput.trim());
            setQuickChatInput('');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/94 backdrop-blur-md border border-slate-200/80 shadow-md pointer-events-auto"
        >
          <input
            type="text"
            value={quickChatInput}
            onChange={(e) => setQuickChatInput(e.target.value)}
            placeholder="본당 아멘·인사 말풍선 입력..."
            className="flex-1 bg-transparent text-[12.5px] font-medium text-[#191F28] outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white text-[11.5px] font-bold cursor-pointer shrink-0"
          >
            전송
          </button>
        </form>
      </div>

      {/* 5. 메인 3D 캔버스 (2.5D 카툰 웜 라이팅 & 아이소메트릭 화각) */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
      >
        <PerspectiveCamera makeDefault position={[0.0, 5.2, 7.6]} fov={35} near={0.1} far={250} />
        <InitialCameraSetup controlsRef={controlsRef} />

        <ambientLight intensity={1.55} color="#FFFDF9" />
        <hemisphereLight args={['#E0F2FE', '#E7D8C9', 1.15]} />
        <directionalLight
          position={[-6, 14, 9]}
          intensity={1.35}
          color="#FFF7E6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[-0.2, 4.4, -3.2]} intensity={2.4} distance={20} color="#FEF3C7" />
        <pointLight position={[0, 2.8, 6.5]} intensity={1.4} distance={14} color="#FFFFFF" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 1.0]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkToPoint(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[18.5, 22.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SanctuaryMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.isCrossDoor) {
              setIsCrossDoorForcedOpen((prev) => !prev);
              handleWalkToPoint(0.0, 8.6);
            } else {
              if (z.pos) handleWalkToPoint(z.pos[0], z.pos[2]);
              setModalZone(z);
            }
          }}
          seatedInfo={seatedInfo}
          onSitOnPew={handleSitOnPew}
          onOpenSermonVideo={handleOpenSermonVideo}
          onOpenPraiseVideo={handleOpenPraiseVideo}
          onOpenOfferingModal={() => setShowOfferingModal(true)}
          onOpenBannerEditModal={() => setShowBannerEditModal(true)}
          onSelectNpcForChat={handleSelectNpcForChat}
          bannerConfig={bannerConfig}
          sermonTitle={sermonVideo.title}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          playerIdxRef={playerIdxRef}
          isCrossDoorForcedOpen={isCrossDoorForcedOpen}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController3F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          myChatBubble={myChatBubble}
          cameraFollowMode={cameraFollowMode}
          controlsRef={controlsRef}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={28} blur={2.4} far={4} />
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.08}
          minDistance={2.5}
          maxDistance={34}
          maxPolarAngle={Math.PI / 2.04}
        />
      </Canvas>

      {/* 6. 다른 접속 성도(Remote Peer) 클릭 모달 */}
      {selectedRemotePeer && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedRemotePeer(null)}
        >
          <div
            className="w-full max-w-sm bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 block">본당 예배 동석 성도</span>
                <h3 className="text-base font-bold">
                  {selectedRemotePeer.name} ({selectedRemotePeer.office || '성도'})
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedRemotePeer(null)} className="text-xs font-bold text-slate-400 cursor-pointer">
                닫기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 은혜로운 예배 되세요`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-xs font-bold cursor-pointer"
              >
                인사 나누기
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerSocialAction('pray', `${selectedRemotePeer.name}님을 위해 함께 중보기도합니다`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-xs font-bold cursor-pointer"
              >
                함께 기도하기
              </button>
            </div>

            {canPlayerBless && (
              <button
                type="button"
                onClick={() => {
                  triggerHolyBenediction3F(
                    `${playerName} 목사님`,
                    selectedRemotePeer.name,
                    [selectedRemotePeer.x || 0.35, 0, selectedRemotePeer.z || 0.52]
                  );
                  setSelectedRemotePeer(null);
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                [{selectedRemotePeer.name}] 성도에게 축도(홀리라이트) 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. 성도·교역자·안내위원 1:1 대화 & 목사님 축도 모달 */}
      {selectedChatNpc && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedChatNpc(null)}
        >
          <div
            className="w-full max-w-md bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: selectedChatNpc.shirt || '#2563EB' }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                >
                  {selectedChatNpc.name.slice(0, 1)}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#2563EB] block">
                    {selectedChatNpc.role || '좋은나무교회 성도'}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold">{selectedChatNpc.name}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedChatNpc(null)} className="text-xs font-bold text-slate-400 cursor-pointer px-2 py-1">
                닫기
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 text-[13px] leading-relaxed font-medium text-[#191F28]">
              "{chatReplyText}"
            </div>

            {selectedChatNpc.canBless && (
              <button
                type="button"
                onClick={() => {
                  const pName = selectedChatNpc.name;
                  setSelectedChatNpc(null);
                  triggerHolyBenediction3F(pName, playerName, playerIdxRef.current);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                [{selectedChatNpc.name}]께 거룩한 축도(홀리라이트) 받기
              </button>
            )}

            <div className="space-y-1.5">
              {[
                {
                  q: '"샬롬! 반갑습니다. 오늘도 은혜로운 예배 되세요!"',
                  a: `네 ${playerName}님 반갑습니다! 오늘 주신 말씀 붙들고 한 주간도 승리하세요.`
                },
                {
                  q: '"은색 스틸 십자가 현관문 밖 복도와 엘리베이터로 나가고 싶어요."',
                  a: '네! 지금 은색 스틸 십자가 현관문을 열어드렸습니다. 바로 뒤쪽 복도 중앙에 엘리베이터가 있어요.'
                }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatReplyText(item.a);
                    if (idx === 1) setIsCrossDoorForcedOpen(true);
                    triggerSocialAction('wave');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-left text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {item.q}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
              {selectedChatNpc.seated && (
                <button
                  type="button"
                  onClick={() => {
                    handleSitOnPew({
                      x: selectedChatNpc.x + (selectedChatNpc.x < 0 ? 0.55 : -0.55),
                      z: selectedChatNpc.z,
                      rowLabel: `${selectedChatNpc.name} 옆자리`
                    });
                    setSelectedChatNpc(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  옆자리에 앉기
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedChatNpc(null);
                  setIsCrossDoorForcedOpen(true);
                  handleWalkToPoint(0.0, 9.25);
                  setModalZone(ZONES_3F[7]);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-white font-bold text-xs cursor-pointer"
              >
                엘리베이터 탑승
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChatNpc(null);
                  if (setActiveScreen) setActiveScreen('sermon');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 text-[#2563EB] font-bold text-xs cursor-pointer"
              >
                예배노트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 강대상 좌·우 표어 배너 이미지/문구 실시간 수정 모달 */}
      {showBannerEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBannerEditModal(false)}
        >
          <div
            className="w-full max-w-md bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[88vh] overflow-y-auto hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold">강대상 좌·우 표어 배너 수정</span>
              <button type="button" onClick={() => setShowBannerEditModal(false)} className="text-xs font-bold text-slate-400 cursor-pointer">
                닫기
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">1. 좌측 스탠드 배너</span>
                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold cursor-pointer">
                    이미지 업로드
                    <input type="file" accept="image/*" onChange={(e) => handleBannerImageFileUpload('left', e)} className="hidden" />
                  </label>
                  {bannerConfig.leftImgUrl && (
                    <button
                      type="button"
                      onClick={() => handleSaveBannerConfig({ ...bannerConfig, leftImgUrl: '' })}
                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold cursor-pointer"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                value={bannerConfig.leftText}
                onChange={(e) => handleSaveBannerConfig({ ...bannerConfig, leftText: e.target.value })}
                placeholder="좌측 배너 문구 (줄바꿈 지원)"
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs outline-none resize-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2563EB]">2. 우측 스탠드 배너</span>
                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold cursor-pointer">
                    이미지 업로드
                    <input type="file" accept="image/*" onChange={(e) => handleBannerImageFileUpload('right', e)} className="hidden" />
                  </label>
                  {bannerConfig.rightImgUrl && (
                    <button
                      type="button"
                      onClick={() => handleSaveBannerConfig({ ...bannerConfig, rightImgUrl: '' })}
                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold cursor-pointer"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                value={bannerConfig.rightText}
                onChange={(e) => handleSaveBannerConfig({ ...bannerConfig, rightText: e.target.value })}
                placeholder="우측 배너 문구 (줄바꿈 지원)"
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs outline-none resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowBannerEditModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-xs cursor-pointer"
            >
              강단 배너에 즉시 반영 완료
            </button>
          </div>
        </div>
      )}

      {/* 9. 감사/기도함 모달 */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowOfferingModal(false)}
        >
          <div
            className="w-full max-w-md bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[88vh] overflow-y-auto hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">감사/기도함</span>
                <span className="text-xs font-bold text-slate-500">작성자: {playerName}</span>
              </div>
              <button type="button" onClick={() => setShowOfferingModal(false)} className="text-xs font-bold text-slate-400 cursor-pointer">
                닫기
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['감사제목', '중보기도', '가정·자녀', '선교·비전'].map((tName) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => setOfferingType(tName)}
                  className={`py-2 rounded-xl text-[11px] font-bold cursor-pointer ${
                    offeringType === tName ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tName}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              <textarea
                rows={2}
                value={thanksNote}
                onChange={(e) => setThanksNote(e.target.value)}
                placeholder="하나님께 올려드리는 감사제목 (영성노트 자동 연동)"
                className="w-full p-2.5 rounded-xl bg-[#F2F4F6] text-xs outline-none resize-none"
              />
              <textarea
                rows={2}
                value={prayerNote}
                onChange={(e) => setPrayerNote(e.target.value)}
                placeholder="간절한 기도제목"
                className="w-full p-2.5 rounded-xl bg-[#F2F4F6] text-xs outline-none resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitOfferingEnvelope}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-xs cursor-pointer"
            >
              감사/기도함에 등록하기 (영성노트 연동)
            </button>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                감사·기도 나눔 ({offeringHistory.length}건)
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
                {offeringHistory.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#191F28]">[{item.type}] {item.writer}</span>
                      <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>
                    <p className="text-slate-600"><b>감사:</b> {item.thanks}</p>
                    <p className="text-[#2563EB]"><b>기도:</b> {item.prayer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. 설교 / 찬양 유튜브 링크 변경 모달 */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="w-full max-w-md bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold">
                {mediaMode === 'praise' ? '찬양팀 유튜브 링크 설정' : '담임목사님 설교 유튜브 링크 설정'}
              </span>
              <button type="button" onClick={() => setShowVideoModal(false)} className="text-xs text-slate-400 cursor-pointer">
                닫기
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                placeholder="영상 제목"
                className="w-full px-3 py-2.5 rounded-xl bg-[#F2F4F6] text-xs outline-none"
              />
              <input
                type="text"
                value={editUrlInput}
                onChange={(e) => setEditUrlInput(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#F2F4F6] text-xs outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveYoutubeLink}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold text-xs cursor-pointer"
              >
                본당에 즉시 연동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. 구역 상세 안내 & 전 층(1F~7F) 이동 엘리베이터 모달 */}
      {modalZone && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalZone(null)}
        >
          <div
            className="w-full max-w-md bg-white text-[#191F28] rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                {modalZone.badge}
              </span>
              <button type="button" onClick={() => setModalZone(null)} className="text-xs font-bold text-slate-400 cursor-pointer">
                닫기
              </button>
            </div>

            <h3 className="text-base font-bold">{modalZone.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed break-keep">{modalZone.desc}</p>

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                {[
                  { fl: '1F', label: '1F 메인 로비 & 필로티 주차장' },
                  { fl: '2F', label: '2F 좋은나무 북카페 · 담임목사 목양실 · 행정사무실' },
                  { fl: '3F', label: '3F 대예배당 본당 (현재 층)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실)' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 워십댄스실' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반' },
                  { fl: '7F', label: '7F 루프탑 하늘정원 · 한강신도시 전망대' }
                ].map((item) => (
                  <button
                    key={item.fl}
                    type="button"
                    onClick={() => {
                      setModalZone(null);
                      onChangeFloor(item.fl);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-left text-xs font-bold flex justify-between cursor-pointer transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-[#2563EB]">이동</span>
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
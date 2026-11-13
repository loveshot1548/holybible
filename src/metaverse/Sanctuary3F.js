// src/metaverse/Sanctuary3F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🔗 유튜브 URL에서 11자리 Video ID 추출기 (설교 & 찬양 듀얼 연동)
// =====================================================================
const parseYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

const getSyncedSermonVideo = () => {
  try {
    const directUrl = localStorage.getItem('sermon_active_video_url') || localStorage.getItem('app_active_gisangogi_url');
    if (directUrl && parseYoutubeId(directUrl)) {
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '주일 대예배 담임목사님 설교 말씀' };
    }
    const rawDaily = localStorage.getItem('qt_daily') || localStorage.getItem('dailyData') || localStorage.getItem('goodtree_daily_data');
    if (rawDaily) {
      const parsed = JSON.parse(rawDaily);
      const dates = Object.keys(parsed).sort().reverse();
      for (const d of dates) {
        const vUrl = parsed[d]?.sermonVideoUrl || parsed[d]?.sermonVideoId;
        if (vUrl && parseYoutubeId(vUrl)) {
          return {
            url: vUrl,
            id: parseYoutubeId(vUrl),
            title: parsed[d]?.sermonTitle || '주일 대예배 설교 말씀'
          };
        }
      }
    }
  } catch (_) {}
  return { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk', title: '기적이 상식이 되는 5일의 기도' };
};

const getSyncedPraiseVideo = () => {
  try {
    const praiseUrl = localStorage.getItem('praise_active_video_url');
    if (praiseUrl && parseYoutubeId(praiseUrl)) {
      return {
        url: praiseUrl,
        id: parseYoutubeId(praiseUrl),
        title: localStorage.getItem('praise_active_video_title') || '좋은나무 찬양단 경배와 찬양'
      };
    }
  } catch (_) {}
  return {
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
    title: '좋은나무 찬양단 (전도사님 외 싱어·악기팀) 경배와 찬양'
  };
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (나뭇결 · 유리 · 천장 간접조명 · ATV 드럼)
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

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#AD6E2F') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 95; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 95) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 5, w * 0.7, y - Math.cos(i) * 5, w, y);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeSoftCeilingGlowTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, w * 0.12, cx, cy, w * 0.49);
    grad.addColorStop(0, 'rgba(255, 251, 235, 0.08)');
    grad.addColorStop(0.52, 'rgba(254, 240, 138, 0.45)');
    grad.addColorStop(0.76, 'rgba(253, 224, 71, 0.65)');
    grad.addColorStop(0.92, 'rgba(254, 243, 199, 0.22)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 512, 512);
}

function makeClearGlassWindowTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.55)');
    grad.addColorStop(0.45, 'rgba(224, 242, 254, 0.38)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.60)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    for (let i = 1; i < 6; i++) {
      const x = (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let x = -120; x < w + 120; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 48, 0);
      ctx.lineTo(x - 65, h);
      ctx.lineTo(x - 113, h);
      ctx.closePath();
      ctx.fill();
    }
  }, 1024, 256);
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
// 🚧 장의자·강단·악기·뒤벽 감사/기도함 실시간 물리 충돌(AABB) & 복도 자동 우회
// =====================================================================
const PEW_ROWS = [-2.2, -0.9, 0.4, 1.7, 3.0, 4.3];
const PEW_COLS = [
  { colId: 'L', x: -4.25, width: 2.75, name: '좌측 장로·성도석' },
  { colId: 'C', x: 0.0, width: 3.45, name: '중앙 성도석' },
  { colId: 'R', x: 4.25, width: 2.75, name: '우측 성도석' }
];

const AISLE_X_LEFT = -2.32;
const AISLE_X_RIGHT = 2.32;

const OBSTACLE_BOXES = [
  // 북쪽 강단 무대 및 찬양팀·대표기도석·전자피아노·드럼·기타 전체 보호 구역
  { minX: -8.0, maxX: 8.0, minZ: -8.0, maxZ: -2.85 },
  // 오른편 뒤쪽 벽면에 붙은 감사/기도함 테이블 충돌 박스
  { minX: 2.8, maxX: 4.9, minZ: 5.95, maxZ: 7.2 },
  // 좌측 뒤편 주보 데스크 충돌 박스
  { minX: -4.4, maxX: -2.8, minZ: 5.95, maxZ: 7.2 },
  // 장의자 3열 x 6줄 물리 충돌 박스
  ...PEW_ROWS.flatMap((rz) =>
    PEW_COLS.map((col) => ({
      minX: col.x - col.width / 2 - 0.16,
      maxX: col.x + col.width / 2 + 0.16,
      minZ: rz - 0.36,
      maxZ: rz + 0.38
    }))
  )
];

function isPointBlocked3F(x, z) {
  if (x < -6.3 || x > 6.3 || z < -2.8 || z > 6.3) return true;
  for (const box of OBSTACLE_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }
  return false;
}

function resolveCollision3F(nx, nz, radius = 0.26) {
  let x = Math.max(-6.2, Math.min(6.2, nx));
  let z = Math.max(-2.8, Math.min(6.25, nz));

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
// 📍 3층 대예배당 7대 인터랙션 존 정의
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_offering',
    code: '01',
    subCode: '감사/기도함',
    name: '오른편 뒤벽 감사/기도함 & 봉투 비치대',
    prompt: '01 감사/기도함 (감사·기도제목 올리기)',
    pos: [3.85, 0, 5.75],
    isOfferingBox: true,
    badge: '01 감사/기도함',
    title: '🙏 좋은나무교회 감사/기도함 (예배당 오른편 후면 벽)',
    desc: '예배당 오른편 뒤쪽 벽면에 정갈하게 비치된 원목 감사/기도함입니다. 오늘 주신 은혜에 대한 감사와 간절한 기도제목을 적어 올려드리세요!'
  },
  {
    id: 'zone_3f_praise_team',
    code: '02',
    subCode: '찬양·악기팀',
    name: '찬양팀 (전도사님·싱어·전자피아노·HEX기타·ATV드럼)',
    prompt: '02 우리 교회 찬양 유튜브 영상 보기',
    pos: [-0.2, 0, -2.85],
    isPraiseZone: true,
    badge: '02 찬양·악기팀',
    title: '🎤 전도사님 찬양인도 & 싱어·전자피아노·HEX기타·ATV드럼',
    desc: '강대상 앞 전도사님과 남녀 싱어 4명, 드럼과 마주 보며 건반을 연주하는 전자피아노 반주자, 오른쪽 벽면에서 HEX 일렉기타를 치는 기타리스트, 뒤쪽 벽면 ATV 드럼 연주자가 함께 찬양합니다!'
  },
  {
    id: 'zone_3f_pastor_pulpit',
    code: '03',
    subCode: '강대상·표어',
    name: '중앙 강대상 담임목사님 & 좌우 표어 배너',
    prompt: '03 담임목사님 주일 설교 영상 보기',
    pos: [1.2, 0, -2.85],
    isSermonZone: true,
    badge: '03 강대상·목사님',
    title: '✝️ 3층 대예배당 강대상 & 담임목사님 설교 말씀',
    desc: '강대상 뒤편 전용 발판 위에서 담임목사님이 건너편 4층 테라스 TV를 보며 생명의 말씀을 선포하고 계십니다.'
  },
  {
    id: 'zone_3f_rep_prayer',
    code: '04',
    subCode: '대표기도석',
    name: '왼편 대표기도 전용 강대상 & 발판',
    prompt: '04 왼편 대표기도석 안내 보기',
    pos: [-3.8, 0, -2.85],
    badge: '04 대표기도석(좌측)',
    title: '🙏 강단 왼편 대표기도 전용 소강대상 (2단 발판 완비)',
    desc: '강단 왼편에 전용 2단 발판과 함께 마련된 대표기도 소강대상입니다. 온 성도를 대표하여 하나님께 간절히 기도를 올려드리는 자리입니다.'
  },
  {
    id: 'zone_3f_welcome_pew',
    code: '05',
    subCode: '환영석',
    name: '중앙 새가족 환영 지정석 착석',
    prompt: '05 새가족 환영석에 앉아 예배드리기',
    pos: [-1.6, 0, 0.3],
    seatTarget: { x: 0.35, z: 0.32, rowLabel: '중앙 새가족 환영석 (3열)' },
    isSeatZone: true,
    badge: '05 새가족 환영석',
    title: '🪑 "좋은나무교회 환영합니다" 새가족 지정석',
    desc: '장의자 방석에 앉으시면 의자를 뚫지 않고 방석 위에 정자세로 착석하며, 전면 대형 설교 스크린이 자동 상영됩니다.'
  },
  {
    id: 'zone_3f_broadcast_terrace',
    code: '06',
    subCode: '방송실·테라스',
    name: '4층 연결 측면 테라스 & 방송 시스템 부스',
    prompt: '06 4층 테라스 방송실 시스템 보기',
    pos: [-5.6, 0, 2.2],
    badge: '06 테라스 방송실',
    title: '🎛️ 4층 연결 측면 테라스 & 초정밀 예배 방송실',
    desc: '좌측 벽면을 따라 4층 통유리 테라스와 하나로 이어진 발코니 위에서 32채널 디지털 오디오 믹서, 자막·카메라 스위처, 트리플 모니터로 예배 실황을 송출합니다.'
  },
  {
    id: 'zone_3f_rear_door_elev',
    code: '07',
    subCode: '본당문·엘베',
    name: '예배당 후면 스틸 십자가 원목문 & 전 층 이동',
    prompt: '07 예배당 출입문 나서기 (층간 이동)',
    pos: [0.0, 0, 5.85],
    isElevator: true,
    badge: '07 출입문·층간이동',
    title: '🚪 예배당 후면 스틸 십자가 손잡이 원목 양개문',
    desc: '고급 원목 양문 중앙에 매립형 헤어라인 스틸 십자가 핸들이 조각된 본당 주 출입문입니다. 문을 통해 1층·4층·5층·6층으로 이동합니다.'
  }
];

// =====================================================================
// 🎤 1. 강대상 담임목사님 + 좌측 대표기도 장로님 + 방송실 간사님 (발바닥 지면/발판 100% 밀착!)
// =====================================================================
const PASTOR_NPC = {
  id: 'pastor_main',
  name: '담임목사님',
  role: '좋은나무교회 담임목사',
  x: -0.8,
  y: 0.86, // 강단(0.48m) + 2단 발판(0.38m) = 0.86m 상면에 신발 바닥이 정확히 맞닿음!
  z: -5.66,
  rotY: 0,
  gender: 'male',
  hairStyle: 'parted',
  shirt: '#1E293B',
  pants: '#0F172A',
  hair: '#18181B',
  dialogues: [
    '할렐루야! 오늘 예배하는 모든 성도님들 가정에 주님의 은혜가 충만하길 축원합니다 ✝️',
    '정면 건너편 4층 테라스 TV로 찬양 가사와 말씀 요약이 선명하게 잘 보이네요!',
    '말씀과 성령으로 세워지는 좋은나무 공동체가 됩시다 🙏'
  ]
};

const REP_PRAYER_NPC = {
  id: 'rep_prayer_elder',
  name: '최장로 (대표기도)',
  role: '주일예배 대표기도 위원',
  x: -4.65,
  y: 0.66, // 강단(0.32m) + 대표기도 2단 발판(0.34m) = 0.66m 상면에 신발 바닥이 정확히 맞닿음!
  z: -4.75,
  rotY: 0.12,
  gender: 'male',
  hairStyle: 'elder',
  shirt: '#1E3A8A',
  pants: '#0F172A',
  hair: '#64748B',
  dialogues: [
    '거룩하신 하나님 아버지, 강단 왼편 기도석에서 온 성도를 대표하여 간절히 기도드립니다 🙏',
    '담임목사님께 성령의 갑절의 능력을 부어주시고 선포되는 말씀마다 생명이 넘치게 하옵소서!'
  ]
};

const BROADCAST_ENGINEER_NPC = {
  id: 'broadcast_engineer',
  name: '박간사 (방송실 컨트롤)',
  role: '예배 미디어·음향 엔지니어',
  x: -6.80,
  y: 2.96, // 4층 테라스 바닥(2.96m) 위 의자에 정확히 착석!
  z: 3.65,
  rotY: Math.PI / 2,
  gender: 'male',
  hairStyle: 'short',
  shirt: '#0284C7',
  pants: '#1E293B',
  hair: '#18181B',
  dialogues: [
    '테라스 방송실 믹서 콘솔에서 목사님 마이크와 찬양팀 악기 밸런스 완벽 세팅했습니다 🎛️',
    '4층 통유리 옆 테라스라 정면 중계 TV와 강대상이 한눈에 다 보여요!'
  ]
};

// 강대상 앞 5인 찬양팀 (1단 강단 높이 y = 0.16m 에 발바닥 완벽 밀착)
const PRAISE_TEAM_5_NPCS = [
  {
    id: 'praise_leader',
    name: '김전도사 (찬양인도)',
    role: '좋은나무 찬양단 인도자',
    isLeader: true,
    x: -0.8,
    y: 0.16,
    z: -3.55,
    rotY: 0,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '다 함께 두 손을 높이 들고 전심으로 주님을 찬양합시다! 🎵',
      '전자피아노와 HEX 기타, ATV 드럼 반주에 맞춰 기쁨의 박수로 찬양해요 🙌',
      '저를 클릭하시면 우리 교회 찬양 유튜브 영상이 바로 재생됩니다!'
    ]
  },
  {
    id: 'singer_f1',
    name: '박소연 (싱어·자매)',
    role: '찬양단 알토 싱어',
    x: -2.3,
    y: 0.16,
    z: -3.65,
    rotY: 0.12,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '주님 한 분만으로 나는 만족해~ 기쁨으로 찬양해요 🎶',
      '성도님들의 찬양 소리가 본당 가득 울려 퍼지네요!'
    ]
  },
  {
    id: 'singer_m1',
    name: '이준호 (싱어·형제)',
    role: '찬양단 테너 싱어',
    x: -1.55,
    y: 0.16,
    z: -3.62,
    rotY: 0.06,
    gender: 'male',
    hairStyle: 'short',
    isSkirt: false,
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '아멘! 전도사님 멘트에 맞춰 화음으로 힘차게 찬양합니다 🎤',
      '주일 예배의 문을 여는 경배와 찬양 시간입니다!'
    ]
  },
  {
    id: 'singer_f2',
    name: '최은혜 (싱어·자매)',
    role: '찬양단 소프라노 싱어',
    x: -0.05,
    y: 0.16,
    z: -3.62,
    rotY: -0.06,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#FACC15',
    pants: '#FEF08A',
    hair: '#78350F',
    dialogues: [
      '소프라노 파트로 하나님의 아름다우심을 노래합니다 ✨',
      '찬양팀을 클릭해서 은혜로운 찬양 영상을 함께 시청해 보세요!'
    ]
  },
  {
    id: 'singer_m2',
    name: '정민수 (싱어·형제)',
    role: '찬양단 베이스 싱어',
    x: 0.7,
    y: 0.16,
    z: -3.65,
    rotY: -0.12,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '드럼과 기타, 피아노 반주에 맞춰 온 맘 다해 주님을 찬양합니다 🔥',
      '살아계신 주님께서 우리의 찬양을 기쁘게 받으십니다!'
    ]
  }
];

// 🎹🎸🥁 [핵심 수정]
// - 피아노 반주자(이자매): 피아노 벤치(x = 5.25, z = -2.83)에 앉아 북쪽(-Z, rotY = Math.PI) 건반과 드럼을 정면으로 바라봄!
// - 기타리스트(정형제): 우측 벽면(x = 6.32, z = -4.45)에서 HEX 텔레캐스터 일렉기타를 메고 왼쪽(-X)을 바라보며 연주!
// - 드러머(최형제): 북쪽 벽면 ATV 드럼 의자(x = 5.25, z = -6.22)에 앉아 남쪽(+Z, 피아노 쪽)을 바라보며 연주!
const BAND_INSTRUMENT_NPCS = [
  {
    id: 'sanctuary_pianist',
    name: '이자매 (전자피아노)',
    role: '예배 메인 건반 반주자',
    x: 5.25,
    y: 0.0,
    z: -2.83,
    rotY: Math.PI, // 북쪽(-Z 방향)에 있는 건반과 드럼을 정면으로 바라보며 연주!
    isPianist: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#A855F7',
    pants: '#F3E8FF',
    hair: '#451A03',
    dialogues: [
      '이제 피아노 건반과 악보대가 제 바로 앞에 딱 맞닿아서 드럼을 보며 연주하기 최고예요 🎹',
      '목사님 설교 후 결단 기도 반주까지 은혜롭게 준비하고 있어요 🙏'
    ]
  },
  {
    id: 'sanctuary_guitarist',
    name: '정형제 (HEX 기타)',
    role: '일렉·어쿠스틱 기타리스트',
    x: 6.32,
    y: 0.16,
    z: -4.45,
    rotY: -Math.PI / 2,
    isGuitarist: true,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#0D9488',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '우측 벽 쪽에서 선버스트 우드결 HEX 텔레캐스터 기타로 찬양의 리듬을 채웁니다 🎸',
      '피아노와 드럼 사이에서 코드 워킹과 애드리브 탄탄하게 넣어줄게요!'
    ]
  },
  {
    id: 'sanctuary_drummer',
    name: '최형제 (ATV 드럼)',
    role: '찬양단 메인 드러머',
    x: 5.25,
    y: 0.44,
    z: -6.22,
    rotY: 0,
    isDrummer: true,
    gender: 'male',
    hairStyle: 'short',
    isSkirt: false,
    shirt: '#EF4444',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '앞쪽 전자피아노 반주자와 눈빛 사인을 주고받으며 ATV 드럼을 연주합니다 🥁',
      '전도사님 사인에 맞춰 심벌즈 크레센도로 빌드업 들어갑니다! 🔥'
    ]
  }
];

// =====================================================================
// 👥 2. 좌측 장로님석 + 다양한 남녀 성도 착석 + 좌우 복도 이동자 + 후면 안내위원단
// =====================================================================
const CONGREGATION_NPCS = [
  {
    id: 'elder_1',
    name: '김장로 (시무장로)',
    role: '예배위원회 시무장로',
    x: -4.85,
    z: -2.2 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'elder',
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#94A3B8',
    dialogues: [
      '아멘! 바로 앞 왼편 발판 위 대표기도석에서 올려드린 기도와 말씀에 큰 은혜를 받습니다 🙏',
      '교회의 기둥으로서 늘 기도로 강단을 후원하겠습니다.'
    ]
  },
  {
    id: 'elder_2',
    name: '이장로 (수석장로)',
    role: '당회 서기·수석장로',
    x: -3.65,
    z: -2.2 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'elder',
    shirt: '#334155',
    pants: '#0F172A',
    hair: '#64748B',
    dialogues: [
      '서로 마주 보는 피아노·드럼과 HEX 기타의 조화가 참으로 아름답군요 👏',
      '오늘 새가족분들이 많이 오셔서 하나님께 감사드립니다!'
    ]
  },
  {
    id: 'elder_3',
    name: '박장로 (예배위원장)',
    role: '예배위원장 장로',
    x: -4.85,
    z: -0.9 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'elder',
    shirt: '#1E3A8A',
    pants: '#0F172A',
    hair: '#475569',
    dialogues: [
      '예배당 들어오면서 오른편 뒤벽 감사/기도함에 감사와 기도제목을 넣고 왔습니다 🙏',
      '거룩하고 신령한 주일 대예배가 되기를 기도합니다.'
    ]
  },
  {
    id: 'elder_4',
    name: '정장로 (선교위원장)',
    role: '국내외 선교위원장',
    x: -3.65,
    z: -0.9 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'elder',
    shirt: '#27272A',
    pants: '#18181B',
    hair: '#9CA3AF',
    dialogues: [
      '아멘! 할렐루야~ 선포되는 말씀마다 생명의 역사가 일어납니다!',
      '장로님들과 함께 앞자리에 앉아 예배드리니 참 든든합니다.'
    ]
  },
  {
    id: 'left_f1',
    name: '최권사',
    role: '마리아 여전도회 권사',
    x: -4.75,
    z: 0.4 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#451A03',
    dialogues: ['주님, 우리 자녀들과 다음세대에 믿음의 복을 내려주옵소서 🙏']
  },
  {
    id: 'left_m1',
    name: '강집사 (남성도)',
    role: '남선교회 총무집사',
    x: -3.75,
    z: 1.7 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#0284C7',
    pants: '#1E293B',
    hair: '#1C1917',
    dialogues: ['왼쪽 위 4층 테라스 방송실 장비들이랑 모니터가 정말 멋지게 갖춰져 있네요 🎛️']
  },
  {
    id: 'center_f1',
    name: '한권사 (여전도회)',
    role: '루디아 여전도회 회장',
    x: -1.05,
    z: -2.2 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#A855F7',
    pants: '#E9D5FF',
    hair: '#5C3A21',
    dialogues: ['아멘! 오늘 찬양과 말씀이 꿀송이처럼 달고 은혜롭네요 🥰']
  },
  {
    id: 'center_m1',
    name: '윤안수집사 (남선교회)',
    role: '안수집사회 부회장',
    x: 0.85,
    z: -2.2 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#0D9488',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: ['할렐루야! 온 가족이 함께 본당에서 예배드리니 참 기쁩니다.']
  },
  {
    id: 'center_f2',
    name: '서자매 (청년부)',
    role: '여호수아 청년부 리더',
    x: -0.85,
    z: -0.9 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F43F5E',
    pants: '#FECDD3',
    hair: '#78350F',
    dialogues: ['전도사님 찬양 인도 따라 부르는데 눈물이 날 것 같아요 😭🎵']
  },
  {
    id: 'center_m2',
    name: '조형제 (청년부)',
    role: '청년부 새가족팀',
    x: 1.15,
    z: 0.4 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#22C55E',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: ['새가족 환영석 바로 옆자리라 새가족분들과 반갑게 인사 나눴어요 😊']
  },
  {
    id: 'center_f3',
    name: '임집사 (여성도)',
    role: '3교구 구역장',
    x: -0.95,
    z: 1.7 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#F59E0B',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: ['오른편 뒤쪽 벽 감사/기도함에 넣은 가정의 기도제목이 꼭 응답되길 소망합니다 🙏']
  },
  {
    id: 'center_m3',
    name: '송성도 (남성도)',
    role: '좋은나무 성도',
    x: 0.95,
    z: 3.0 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#3B82F6',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: ['아멘! 한 주간 세상에서 지친 마음이 말씀으로 새 힘을 얻습니다 💪']
  },
  {
    id: 'right_f1',
    name: '오권사',
    role: '중보기도팀 권사',
    x: 3.45,
    z: -2.2 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#14B8A6',
    pants: '#CCFBF1',
    hair: '#451A03',
    dialogues: ['오른쪽 앞자리는 드럼과 마주 보는 피아노랑 HEX 기타리스트가 한눈에 보여요 🎹🎸']
  },
  {
    id: 'right_m1',
    name: '신집사 (남성도)',
    role: '찬양위원회 집사',
    x: 4.85,
    z: -0.9 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#6366F1',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: ['우물천장 간접조명이 은은하게 퍼지니 성전이 더욱 포근하고 거룩합니다 ✨']
  },
  {
    id: 'right_f2',
    name: '유자매 (여성도)',
    role: '주일학교 교사',
    x: 3.65,
    z: 0.4 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: ['아멘! 목사님 말씀 한 구절 한 구절이 제게 주시는 음성 같습니다.']
  },
  {
    id: 'right_m2',
    name: '황성도 (남성도)',
    role: '새가족부 성도',
    x: 4.75,
    z: 1.7 - 0.08,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#EAB308',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: ['할렐루야! 우리 좋은나무교회 공동체가 날마다 부흥하길 기도합니다.']
  },
  {
    id: 'right_f3',
    name: '배집사 (여성도)',
    role: '친교봉사팀 집사',
    x: 3.55,
    z: 3.0 - 0.08,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#8B5CF6',
    pants: '#EDE9FE',
    hair: '#27272A',
    dialogues: ['예배 끝나고 5층 식당 배식대에서 성도님들과 맛있게 점심 애찬 나눠요 🍲']
  },
  {
    id: 'walker_left_aisle',
    name: '안성도 (자리이동)',
    role: '청년부 성도',
    x: AISLE_X_LEFT,
    z: 0.5,
    patrolZ: [-1.8, 3.6],
    seated: false,
    gender: 'male',
    hairStyle: 'parted',
    isSkirt: false,
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#27272A',
    dialogues: [
      '예배당 오른편 뒤벽 감사/기도함에 감사봉투 넣고 자리로 가는 길입니다 🙏',
      '집사님 샬롬! 좋은 아침입니다 😊'
    ]
  },
  {
    id: 'walker_right_aisle',
    name: '문권사 (안내·인사)',
    role: '예배 안내위원',
    x: AISLE_X_RIGHT,
    z: 1.2,
    patrolZ: [-1.4, 3.8],
    seated: false,
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    shirt: '#D8C3A5',
    pants: '#C8B294',
    hair: '#5C3A21',
    dialogues: [
      '어서 오세요~ 앞쪽 빈자리부터 차례대로 착석해 주세요 😊',
      '오늘 예배에 오신 성도님들을 주님의 이름으로 환영합니다!'
    ]
  },
  {
    id: 'rear_usher_center',
    name: '홍권사 (후면안내위원)',
    role: '본당 주출입구 안내팀장',
    x: -1.4,
    z: 5.55,
    patrolX: [-2.4, -0.6],
    seated: false,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    autoWave: true,
    shirt: '#E11D48',
    pants: '#FFE4E6',
    hair: '#451A03',
    dialogues: [
      '할렐루야! 스틸 십자가 원목 출입문을 통해 들어오시는 성도님들 환영합니다 🌺',
      '출입문 오른쪽 벽면 감사/기도함에서 감사와 기도제목 봉투를 작성해 넣으실 수 있어요!',
      '새가족분들은 중앙 새가족 환영석으로 안내해 드리겠습니다 😊'
    ]
  },
  {
    id: 'rear_usher_left',
    name: '구집사 (새가족안내위원)',
    role: '새가족 환영위원',
    x: -3.6,
    z: 5.55,
    rotY: Math.PI,
    seated: false,
    gender: 'male',
    hairStyle: 'short',
    autoWave: true,
    shirt: '#1E3A8A',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '반갑습니다 성도님! 주일 주보 여기 있습니다 📖',
      '궁금한 점이 있으시면 저나 주변 성도님들을 클릭해서 대화해 보세요!'
    ]
  },
  {
    id: 'rear_usher_right',
    name: '변집사 (헌금·안내위원)',
    role: '봉헌·안내위원',
    x: 2.2,
    z: 5.55,
    rotY: Math.PI,
    seated: false,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    autoWave: true,
    shirt: '#0D9488',
    pants: '#CCFBF1',
    hair: '#5C3A21',
    dialogues: [
      '샬롬! 바로 옆 오른편 뒤벽에 감사/기도함과 봉투가 준비되어 있습니다 🥰',
      '은혜로운 주일 예배 되시기를 축복합니다!'
    ]
  }
];

// =====================================================================
// 👁️ 화면을 회전할 때 시야를 가리는 외벽을 자동으로 투명하게 만드는 컴포넌트
// =====================================================================
function SmartCutawayWall({ wallSide, minOpacity = 0.05, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    if (wallSide === 'south' && camera.position.z > 5.8) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -5.2) shouldFade = true;
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

// =====================================================================
// 🟢 빛기둥 홀로그램 링 + 3D 원형 캡슐 마커
// =====================================================================
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

// =====================================================================
// 🎸 [초고도화] 5번째 레퍼런스(`image_e2d4a1.png` HEX Instruments) 100% 반영 — 텔레캐스터 일렉기타
// =====================================================================
function HighQualityHexElectricGuitar() {
  const { bodyGeo, pickguardGeo } = useMemo(() => {
    // 텔레캐스터 싱글 컷어웨이 유선형 바디 외곽선
    const bShape = new THREE.Shape();
    bShape.moveTo(0, -0.14);
    bShape.bezierCurveTo(0.12, -0.15, 0.19, -0.09, 0.19, 0.0);
    bShape.bezierCurveTo(0.19, 0.06, 0.12, 0.09, 0.09, 0.13);
    bShape.bezierCurveTo(0.07, 0.17, 0.11, 0.22, 0.06, 0.24);
    bShape.bezierCurveTo(0.02, 0.25, -0.01, 0.20, -0.03, 0.17);
    bShape.bezierCurveTo(-0.06, 0.22, -0.10, 0.28, -0.15, 0.26);
    bShape.bezierCurveTo(-0.20, 0.23, -0.18, 0.13, -0.14, 0.08);
    bShape.bezierCurveTo(-0.19, 0.03, -0.20, -0.07, -0.14, -0.12);
    bShape.bezierCurveTo(-0.09, -0.15, -0.04, -0.14, 0, -0.14);

    const bGeo = new THREE.ExtrudeGeometry(bShape, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 4
    });

    // 크림색 픽가드(Pickguard) 쉐이프
    const pgShape = new THREE.Shape();
    pgShape.moveTo(-0.02, 0.02);
    pgShape.bezierCurveTo(0.07, 0.02, 0.11, 0.07, 0.08, 0.16);
    pgShape.bezierCurveTo(0.06, 0.20, 0.01, 0.18, -0.04, 0.14);
    pgShape.bezierCurveTo(-0.06, 0.09, -0.05, 0.02, -0.02, 0.02);

    const pgGeo = new THREE.ShapeGeometry(pgShape);
    return { bodyGeo: bGeo, pickguardGeo: pgGeo };
  }, []);

  return (
    <group position={[0.02, 0.34, 0.155]} rotation={[0, 0, -0.52]}>
      {/* 1) 앰버 선버스트 플레임 메이플 우드 바디 */}
      <mesh geometry={bodyGeo} position={[0, -0.04, -0.015]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#B45309" roughness={0.22} metalness={0.15} />
      </mesh>
      {/* 2) 크림 화이트 픽가드 */}
      <mesh geometry={pickguardGeo} position={[0, -0.04, 0.032]} rotation={[0, 0, -Math.PI / 2]}>
        <meshStandardMaterial color="#FEF9C3" roughness={0.3} />
      </mesh>
      {/* 3) 크롬 브릿지 플레이트 & 컨트롤 노브 플레이트 */}
      <RoundedBox args={[0.07, 0.09, 0.01]} position={[-0.08, -0.04, 0.032]} radius={0.002}>
        <meshStandardMaterial color="#E2E8F0" metalness={0.92} roughness={0.1} />
      </RoundedBox>
      <RoundedBox args={[0.11, 0.028, 0.012]} position={[-0.04, -0.12, 0.032]} rotation={[0, 0, 0.15]} radius={0.004}>
        <meshStandardMaterial color="#E2E8F0" metalness={0.92} roughness={0.1} />
      </RoundedBox>
      {/* 4) 로즈우드 넥(Neck) & 22프렛 지판 & 헤드스톡 + 6연 크롬 헤드머신 */}
      <RoundedBox args={[0.46, 0.042, 0.022]} position={[0.32, 0.0, 0.01]} radius={0.006} castShadow>
        <meshStandardMaterial color="#5C3418" roughness={0.35} />
      </RoundedBox>
      {/* 6가닥 은색 기타 줄(Strings) 표현 */}
      <mesh position={[0.22, 0.0, 0.028]}>
        <boxGeometry args={[0.58, 0.028, 0.004]} />
        <meshStandardMaterial color="#F8FAFC" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* 헤드스톡 & 6개 튜닝 페그 */}
      <RoundedBox args={[0.13, 0.052, 0.02]} position={[0.58, 0.012, 0.01]} rotation={[0, 0, 0.14]} radius={0.008} castShadow>
        <meshStandardMaterial color="#78350F" roughness={0.3} />
      </RoundedBox>
      {[0, 1, 2, 3, 4, 5].map((pIdx) => (
        <mesh key={pIdx} position={[0.54 + pIdx * 0.018, 0.048, 0.01]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ [초고도화] 뿔 현상을 100% 제거한 주니토니 스타일 볼륨 헤어 & 지면 완전 밀착 아바타!
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

function CharacterHairStyle({ style = 'short', hairColor = '#27272A' }) {
  // 1) 여성 긴 머리 ('long_wave') — 뿔 없이 매끈한 정수리 + 등 뒤로 내려오는 긴 머리
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

  // 2) 여성 단발 보브컷 ('bob') — 뿔 없이 둥근 단발 헬멧 라인
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

  // 3) 권사님 올림머리 ('bun') — 매끈한 머리와 뒤통수 당고머리
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

  // 4) 남성 / 장로님 ('elder', 'parted', 'short') — 이마 위 뿔 캡슐 완전 제거! 매끈한 라운드 헤어
  return (
    <group>
      <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.92, 1.05]} castShadow>
        <sphereGeometry args={[0.21, 24, 24]} />
        <meshStandardMaterial color={hairColor} roughness={0.48} />
      </mesh>
      {/* 앞머리를 구형(Sphere)으로 머리통 안에 자연스럽게 밀착 */}
      <mesh position={[0, 0.09, 0.06]} scale={[0.96, 0.65, 0.82]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshStandardMaterial color={hairColor} roughness={0.48} />
      </mesh>
    </group>
  );
}

function SmoothChibiAvatar({
  position = [0, 0, 0],
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

    if ((patrolZ || patrolX) && outerGroupRef.current) {
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

    const seatedNow = isSeated || isDrummer || isPianist || isGuitarist;

    if (leftLegRef.current && rightLegRef.current) {
      if (seatedNow) {
        // ✅ 음수(-Math.PI / 2.05)로 꺾어야 무릎을 꿇지 않고 앞쪽(강대상 방향)으로 다리를 뻗어 앉습니다!
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        // 다리 시작점을 골반 앞쪽(+0.11)으로 빼서 허벅지가 방석 위에 자연스럽게 놓이도록 설정
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
      if (isPastor) {
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
      headGroupRef.current.rotation.x = Math.sin(t * (isDrummer || isPianist || isGuitarist ? 5.5 : 2.8)) * 0.07;
      headGroupRef.current.rotation.y = Math.cos(t * 1.5) * 0.08;
    }
    if (rootRef.current) {
      const bounce = (walkingNow || isPraiseTeam) && !seatedNow
        ? Math.abs(Math.sin(t * (isPraiseTeam ? 5.2 : 9.5))) * 0.042
        : Math.sin(t * 2.6) * 0.008;
      // ✅ 엉덩이가 가죽 방석(높이 0.41m) 위에 딱 안착하도록 0.20으로 낮추고, 방석 앞쪽으로 살짝 당김!
      rootRef.current.position.y = (seatedNow ? 0.20 : 0) + bounce;
      rootRef.current.position.z = isSeated ? 0.05 : 0;
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
        <meshBasicMaterial color="#0F172A" transparent opacity={0.28} />
      </mesh>

      <group ref={rootRef}>
        {/* 바닥 Y=0.00에 정확히 맞닿는 다리 & 신발 */}
        <group ref={leftLegRef} position={[-0.085, 0.21, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.175, 0.025]} scale={[1.0, 0.65, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.21, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.175, 0.025]} scale={[1.0, 0.65, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
          </mesh>
        </group>

        {/* 부드럽게 이어지는 상체 & 스커트 */}
        {isFemale ? (
          <group>
            <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.13, 0.115, 0.24, 24]} />
              <meshStandardMaterial color={shirtColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.52, 0]} scale={[1.15, 0.55, 0.88]} castShadow>
              <sphereGeometry args={[0.13, 20, 20]} />
              <meshStandardMaterial color={shirtColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.12, 0.225, 0.24, 28]} />
              <meshStandardMaterial color={pantsColor || shirtColor} roughness={0.48} />
            </mesh>
            <mesh position={[0, 0.55, 0.03]} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
              <torusGeometry args={[0.072, 0.012, 10, 20]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.37, 0]} scale={[1.16, 1.0, 0.85]} castShadow receiveShadow>
              <capsuleGeometry args={[0.142, 0.16, 16, 24]} />
              <meshStandardMaterial color={shirtColor} roughness={0.42} />
            </mesh>
            <mesh position={[0, 0.49, 0.112]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[0.042, 0.09, 3]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, 0.42, 0.122]}>
              <boxGeometry args={[0.022, 0.11, 0.01]} />
              <meshStandardMaterial color={isPastor ? '#DC2626' : '#38BDF8'} />
            </mesh>
          </group>
        )}

        {/* 하이엔드 HEX 일렉트릭 기타 장착 */}
        {isGuitarist && <HighQualityHexElectricGuitar />}

        {/* 부드러운 캡슐형 양팔 */}
        <group ref={leftArmRef} position={[-0.195, 0.48, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.042, 0.14, 12, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.20, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.195, 0.48, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.042, 0.14, 12, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.20, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>

        {/* 목과 부드럽게 이어지는 둥근 두상 & 헤어 */}
        <group ref={headGroupRef} position={[0, 0.74, 0]}>
          <mesh scale={[1.04, 0.98, 1.0]} castShadow receiveShadow>
            <sphereGeometry args={[0.20, 28, 28]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          <mesh position={[-0.195, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.036, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
          <mesh position={[0.195, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.036, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>

          <CharacterHairStyle
            style={hairStyle || (isFemale ? 'long_wave' : 'short')}
            hairColor={hairColor}
          />

          {hasSunglasses ? (
            <group position={[0, 0.0, 0.192]}>
              <RoundedBox args={[0.13, 0.072, 0.025]} position={[-0.072, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.13, 0.072, 0.025]} position={[0.072, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
            </group>
          ) : (
            <>
              <mesh position={[-0.072, -0.01, 0.192]}>
                <sphereGeometry args={[0.024, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.072, -0.01, 0.192]}>
                <sphereGeometry args={[0.024, 14, 14]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[-0.065, -0.002, 0.212]}>
                <sphereGeometry args={[0.007, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0.079, -0.002, 0.212]}>
                <sphereGeometry args={[0.007, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[-0.11, -0.05, 0.172]} rotation={[0, -0.35, 0]}>
                <circleGeometry args={[0.026, 16]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
              </mesh>
              <mesh position={[0.11, -0.05, 0.172]} rotation={[0, 0.35, 0]}>
                <circleGeometry args={[0.026, 16]} />
                <meshBasicMaterial color="#FDA4AF" transparent opacity={0.55} />
              </mesh>
            </>
          )}
        </group>

        {nameTagTexture && (
          <Billboard position={[0, 1.22, 0]}>
            <mesh renderOrder={12}>
              <planeGeometry args={[1.45, 0.32]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}

        {bubbleData && (
          <Billboard position={[0, 1.50, 0]}>
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
// 🥁 ATV aDrums artist 5기통 하이엔드 드럼 세트
// =====================================================================
function HighQualityAtvDrumKit({ position }) {
  const atvBassTex = useMemo(() => makeAtvBassHeadTexture(), []);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[1.25, 36]} />
        <meshStandardMaterial color="#1E293B" roughness={0.85} />
      </mesh>

      {[-0.8, -0.4, 0, 0.4, 0.8].map((ang, ai) => (
        <mesh
          key={ai}
          position={[Math.sin(ang * 1.35) * 1.08, 0.76, Math.cos(ang * 1.35) * 1.08 + 0.05]}
          rotation={[0, ang * 1.35, 0]}
        >
          <boxGeometry args={[0.62, 1.48, 0.025]} />
          <meshStandardMaterial color="#E0F2FE" transparent opacity={0.28} roughness={0.06} />
        </mesh>
      ))}

      <group position={[0, 0.32, 0.12]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.31, 0.44, 32]} />
          <meshStandardMaterial color="#090A0F" roughness={0.12} metalness={0.35} />
        </mesh>
        {[-0.22, 0.22].map((hz, hi) => (
          <mesh key={hi} position={[0, 0, hz]}>
            <torusGeometry args={[0.31, 0.018, 12, 32]} />
            <meshStandardMaterial color="#D4A373" roughness={0.3} />
          </mesh>
        ))}
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
            <meshStandardMaterial color="#090A0F" roughness={0.12} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[trad - 0.01, 24]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.10, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[trad, 0.012, 10, 24]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      <group position={[0.38, 0.56, -0.16]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 24]} />
          <meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 24]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.018, 0.025, 0.52, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      <group position={[-0.44, 0.42, -0.08]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.20, 0.20, 0.38, 24]} />
          <meshStandardMaterial color="#090A0F" roughness={0.12} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.192, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.19, 24]} />
          <meshStandardMaterial color="#F8FAFC" />
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
            <meshStandardMaterial color="#E2E8F0" metalness={0.92} roughness={0.08} />
          </mesh>
          {[-0.14, 0.14].map((lx, li) => (
            <mesh key={li} position={[lx, 0.12, 0]} rotation={[0, 0, lx > 0 ? 0.45 : -0.45]}>
              <cylinderGeometry args={[0.01, 0.01, 0.30, 8]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
            </mesh>
          ))}
          <group position={[0, cy, 0]} rotation={[0.22, 0, tilt]}>
            <mesh castShadow>
              <cylinderGeometry args={[crad, crad, 0.014, 28]} />
              <meshStandardMaterial color="#27272A" metalness={0.65} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <cylinderGeometry args={[0.045, 0.06, 0.018, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        </group>
      ))}

      <RoundedBox args={[0.24, 0.10, 0.16]} position={[0.48, 0.74, 0.05]} rotation={[0.4, -0.3, 0]} radius={0.015} castShadow>
        <meshStandardMaterial color="#18181B" metalness={0.5} />
      </RoundedBox>

      <mesh position={[0, 0.24, -0.48]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.07, 20]} />
        <meshStandardMaterial color="#18181B" />
      </mesh>
      <mesh position={[0, 0.12, -0.48]}>
        <cylinderGeometry args={[0.025, 0.14, 0.24, 12]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} />
      </mesh>
    </group>
  );
}

// =====================================================================
// 🚪 [초고도화] 2번째 사진(`image_e2d941.jpg`)의 볼품없던 문을 대체하는 건축가급 원목 + 매립 스틸 십자가 양개문!
// =====================================================================
function SanctuaryRearCrossDoubleDoor({ position, woodTex, onClickDoor }) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickDoor) onClickDoor();
      }}
    >
      {/* 1) 중후한 다크 월넛 2단 입체 문틀(Door Frame & Architrave) */}
      <RoundedBox args={[2.92, 2.52, 0.28]} position={[0, 1.26, 0]} radius={0.02} castShadow receiveShadow userData={{ keepOpaque: true }}>
        <meshStandardMaterial color="#4A2C11" roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[2.76, 2.40, 0.30]} position={[0, 1.20, 0]} radius={0.015} userData={{ keepOpaque: true }}>
        <meshStandardMaterial color="#3B220C" roughness={0.48} />
      </RoundedBox>

      {/* 2) 좌·우 고급 오크 원목 양개 도어 리프(Door Leaves) + 상하단 음각 패널 몰딩 */}
      {[-0.64, 0.64].map((dx, i) => (
        <group key={i} position={[dx, 1.18, 0]}>
          <RoundedBox
            args={[1.24, 2.32, 0.14]}
            radius={0.015}
            castShadow
            receiveShadow
            userData={{ keepOpaque: true }}
          >
            <meshStandardMaterial map={woodTex} color="#D99B56" roughness={0.34} />
          </RoundedBox>
          {/* 바깥쪽 고급 원목 액자형 보더 몰딩 */}
          <RoundedBox
            args={[1.02, 2.06, 0.155]}
            radius={0.012}
            userData={{ keepOpaque: true }}
          >
            <meshStandardMaterial map={woodTex} color="#C6843F" roughness={0.38} />
          </RoundedBox>
          {/* 측면 황동 경첩(Hinge) 3개씩 디테일 */}
          {[-0.82, 0.0, 0.82].map((hy, hi) => (
            <RoundedBox
              key={hi}
              args={[0.04, 0.12, 0.17]}
              position={[dx < 0 ? -0.61 : 0.61, hy, 0]}
              radius={0.005}
              userData={{ keepOpaque: true }}
            >
              <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
            </RoundedBox>
          ))}
        </group>
      ))}

      {/* 3) 두 문짝 사이 중앙 정밀 맞물림 라인 */}
      <mesh position={[0, 1.18, 0]} userData={{ keepOpaque: true }}>
        <boxGeometry args={[0.02, 2.34, 0.165]} />
        <meshBasicMaterial color="#1C0F05" />
      </mesh>

      {/* 4) 🌟 스케치 완벽 구현: 두 원목 문짝 중앙에 일체형으로 조각된 헤어라인 브러시드 스틸(Brushed Steel) 십자가 푸시바 핸들! */}
      {[-0.088, 0.088].map((cz, sideIdx) => (
        <group key={sideIdx} position={[0, 1.18, cz]}>
          {/* 십자가 외곽 다크 브론즈 베젤 리세스 홈 (입체감 극대화) */}
          <RoundedBox args={[0.24, 1.66, 0.015]} position={[0, -0.02, 0]} radius={0.01} userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#271608" roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[1.18, 0.22, 0.015]} position={[0, 0.22, 0]} radius={0.01} userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#271608" roughness={0.5} />
          </RoundedBox>

          {/* 좌측 문짝의 스틸 수직 핸들 바 + 우측 문짝의 스틸 수직 핸들 바 */}
          <RoundedBox args={[0.072, 1.56, 0.042]} position={[-0.052, -0.02, 0]} radius={0.012} castShadow userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#F1F5F9" metalness={0.88} roughness={0.16} />
          </RoundedBox>
          <RoundedBox args={[0.072, 1.56, 0.042]} position={[0.052, -0.02, 0]} radius={0.012} castShadow userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#F1F5F9" metalness={0.88} roughness={0.16} />
          </RoundedBox>

          {/* 좌·우로 매끄럽게 뻗은 스틸 십자가 가로 핸들 바 */}
          <RoundedBox args={[0.48, 0.088, 0.045]} position={[-0.275, 0.22, 0]} radius={0.012} castShadow userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#F1F5F9" metalness={0.88} roughness={0.16} />
          </RoundedBox>
          <RoundedBox args={[0.48, 0.088, 0.045]} position={[0.275, 0.22, 0]} radius={0.012} castShadow userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#F1F5F9" metalness={0.88} roughness={0.16} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// 🏛️ 3층 대예배당 초정밀 3D 디오라마 씬
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
  showRoomSigns
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const stageWoodTex = useMemo(() => makeWoodGrainTexture('#E0AA6E', '#B87E42'), []);
  const clearGlassTex = useMemo(() => makeClearGlassWindowTexture(), []);
  const softCeilingGlowTex = useMemo(() => makeSoftCeilingGlowTexture(), []);

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
      ctx.fillText('SUBTITLE LIVE', w / 2 + 16, 46);

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
      grad.addColorStop(0, bannerConfig?.bgColorTop || '#ECFDF5');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(1, bannerConfig?.bgColorBottom || '#A7F3D0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('2026 좋은나무교회 표어', w / 2, 70);

      const lines = (bannerConfig?.leftText || '말씀과 기도로\n거룩하여지는\n좋은나무 공동체').split('\n');
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 42px serif';
      lines.forEach((ln, i) => {
        ctx.fillText(ln, w / 2, 185 + i * 64);
      });

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('클릭하여 배너 이미지 변경', w / 2, h - 42);
    }, 300, 560);
  }, [bannerConfig?.leftText, bannerConfig?.bgColorTop, bannerConfig?.bgColorBottom]);

  const defaultRightBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bannerConfig?.bgColorTop || '#ECFDF5');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(1, bannerConfig?.bgColorBottom || '#A7F3D0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VISION & PROMISE', w / 2, 70);

      const lines = (bannerConfig?.rightText || '기적이 상식이 되는\n5일의 기도\n응답받는 성전').split('\n');
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 42px serif';
      lines.forEach((ln, i) => {
        ctx.fillText(ln, w / 2, 185 + i * 64);
      });

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('클릭하여 배너 이미지 변경', w / 2, h - 42);
    }, 300, 560);
  }, [bannerConfig?.rightText, bannerConfig?.bgColorTop, bannerConfig?.bgColorBottom]);

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
      ctx.fillText('▶ 목사님·찬양팀·스크린 클릭 시 유튜브 영상이 상영됩니다', w / 2, 310);
    }, 1024, 400);
  }, [sermonTitle]);

  const signs = useMemo(() => ({
    offering: makeRoomSignTexture('감사/기도함', '클릭하여 감사·기도제목 올리기', '#F59E0B'),
    praiseTeam: makeRoomSignTexture('찬양팀 (전도사님 인도)', '클릭 시 우리 찬양 유튜브 재생', '#EC4899'),
    pastor: makeRoomSignTexture('강대상 · 담임목사님', '클릭 시 주일 설교 말씀 재생', '#0284C7'),
    repPrayer: makeRoomSignTexture('대표기도석 (좌측)', '예배 대표기도 전용 강단', '#10B981'),
    broadcast: makeRoomSignTexture('테라스 방송실 🎛️', '음향·자막·카메라 컨트롤 부스', '#38BDF8'),
    rearDoor: makeRoomSignTexture('예배당 본당 출입문', '십자가 원목문 · 전 층 이동', '#D97706')
  }), []);

  return (
    <group>
      {/* 1. 본당 바닥 카펫 & 통로 러너 */}
      <RoundedBox args={[17.0, 0.2, 16.5]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#3D3E42" roughness={0.82} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_LEFT, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#484A50" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[AISLE_X_RIGHT, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#484A50" roughness={0.85} />
      </mesh>

      {/* ================================================================= */}
      {/* 🙏 오른편 뒤쪽 벽면(`X: +3.85, Z: +6.62`) 감사/기도함 */}
      {/* ================================================================= */}
      <group
        position={[3.85, 0, 6.62]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenOfferingModal) onOpenOfferingModal();
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[1.65, 0.95]} />
          <meshStandardMaterial color="#7F1D1D" roughness={0.7} />
        </mesh>

        <group position={[-0.38, 0, 0]}>
          <RoundedBox args={[0.52, 0.98, 0.46]} position={[0, 0.49, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.32} />
          </RoundedBox>
          <RoundedBox args={[0.58, 0.08, 0.52]} position={[0, 1.00, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#78350F" />
          </RoundedBox>
          <mesh position={[0, 1.045, 0]}>
            <boxGeometry args={[0.32, 0.01, 0.06]} />
            <meshBasicMaterial color="#090D16" />
          </mesh>
          <mesh position={[0, 0.58, 0.24]}>
            <boxGeometry args={[0.04, 0.28, 0.015]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.63, 0.24]}>
            <boxGeometry args={[0.18, 0.04, 0.015]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        <group position={[0.36, 0, 0]}>
          <RoundedBox args={[0.68, 0.78, 0.44]} position={[0, 0.39, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.16, 0.26]} position={[0, 0.84, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#78350F" />
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
              position={[ex, 0.94, 0]}
              rotation={[0.18, 0, 0]}
              radius={0.005}
              castShadow
            >
              <meshStandardMaterial color={ecol} />
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

      {/* ================================================================= */}
      {/* 🎤 2. 정면(북쪽 -Z) 3단 우드 강단 + 좌측 대표기도석 + 반주자 쪽을 향한 전자피아노 */}
      {/* ================================================================= */}
      <group position={[-0.6, 0, -5.2]}>
        <RoundedBox args={[13.2, 0.16, 3.5]} position={[1.4, 0.08, 0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[12.8, 0.16, 3.2]} position={[1.4, 0.24, 0.0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.36} />
        </RoundedBox>
        <RoundedBox args={[12.4, 0.16, 2.9]} position={[1.4, 0.40, -0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.34} />
        </RoundedBox>

        <SmartCutawayWall wallSide="north">
          <RoundedBox args={[17.0, 5.6, 0.26]} position={[0.6, 2.8, -1.75]} radius={0.02} receiveShadow>
            <meshStandardMaterial color="#E6CEB5" roughness={0.62} />
          </RoundedBox>
          <RoundedBox args={[6.8, 5.1, 0.08]} position={[-0.2, 2.65, -1.60]} radius={0.01}>
            <meshStandardMaterial color="#5C3418" roughness={0.6} />
          </RoundedBox>
          {Array.from({ length: 35 }).map((_, i) => (
            <RoundedBox
              key={`slat_${i}`}
              args={[0.095, 5.05, 0.09]}
              position={[-3.42 + i * 0.19, 2.65, -1.53]}
              radius={0.015}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
            </RoundedBox>
          ))}

          {/* 정면 대형 LED 스크린 */}
          <group
            position={[-0.2, 3.45, -1.42]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSermonVideo) onOpenSermonVideo();
            }}
          >
            <RoundedBox args={[4.2, 2.05, 0.08]} radius={0.025} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[4.02, 1.88]} />
              <meshBasicMaterial map={bigScreenTex} />
            </mesh>
          </group>
        </SmartCutawayWall>

        {/* 강대상 좌·우 표어 배너 */}
        {[
          { bx: -2.85, tex: customLeftBannerTex || defaultLeftBannerTex },
          { bx: 2.45, tex: customRightBannerTex || defaultRightBannerTex }
        ].map((bItem, bIdx) => (
          <group
            key={`banner_${bIdx}`}
            position={[bItem.bx, 1.48, -0.95]}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBannerEditModal) onOpenBannerEditModal();
            }}
          >
            <RoundedBox args={[0.84, 2.12, 0.04]} radius={0.015} castShadow>
              <meshStandardMaterial color="#FFFFFF" />
            </RoundedBox>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[0.78, 2.04]} />
              <meshBasicMaterial map={bItem.tex} />
            </mesh>
            <RoundedBox args={[0.54, 0.05, 0.36]} position={[0, -1.06, 0]} radius={0.01}>
              <meshStandardMaterial color="#475569" />
            </RoundedBox>
          </group>
        ))}

        {/* 중앙 십자가 원목 강대상 + 목사님 전용 2단 발판 */}
        <group
          position={[-0.2, 0.48, 0.05]}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSermonVideo) onOpenSermonVideo();
          }}
        >
          <RoundedBox args={[1.18, 0.20, 0.72]} position={[0, 0.10, -0.46]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.96, 0.18, 0.56]} position={[0, 0.29, -0.46]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#991B1B" roughness={0.75} />
          </RoundedBox>

          <RoundedBox args={[1.22, 0.12, 0.64]} position={[0, 0.06, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[1.06, 0.74, 0.52]} position={[0, 0.45, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[1.20, 0.09, 0.62]} position={[0, 0.85, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          {[-0.18, 0.18].map((mx, mi) => (
            <mesh key={mi} position={[mx, 0.96, -0.05]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          ))}
          <mesh position={[0, 0.49, 0.27]}>
            <boxGeometry args={[0.05, 0.34, 0.02]} />
            <meshStandardMaterial color="#FDE047" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.55, 0.27]}>
            <boxGeometry args={[0.22, 0.05, 0.02]} />
            <meshStandardMaterial color="#FDE047" metalness={0.7} />
          </mesh>
        </group>

        {/* 왼편 대표기도 전용 소강대상 + 뒤쪽 대표기도자 전용 2단 원목·레드카펫 발판 */}
        <group position={[-4.05, 0.32, 0.95]} rotation={[0, 0.12, 0]}>
          <RoundedBox args={[0.88, 0.18, 0.56]} position={[0, 0.09, -0.50]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.72, 0.16, 0.44]} position={[0, 0.26, -0.50]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#991B1B" roughness={0.75} />
          </RoundedBox>

          <RoundedBox args={[0.68, 0.10, 0.46]} position={[0, 0.05, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.66, 0.38]} position={[0, 0.40, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.36} />
          </RoundedBox>
          <RoundedBox args={[0.66, 0.07, 0.44]} position={[0, 0.75, 0]} rotation={[0.15, 0, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.44, 0.195]}>
            <boxGeometry args={[0.035, 0.24, 0.015]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.49, 0.195]}>
            <boxGeometry args={[0.15, 0.035, 0.015]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.85, -0.04]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
        </group>

        {/* 🎹 [핵심 수정 3] 반주자와 건반이 완벽히 마주 닿는 88건반 전자피아노!
            - 반주자(이자매)는 피아노 남쪽(+Z) 벤치에 앉아 북쪽(-Z, 드럼 방향)을 바라봄
            - 따라서 흰색 건반은 피아노의 남쪽(+0.13) 가장자리, 악보대는 북쪽(-0.08)에서 반주자 쪽으로 기울어지도록 정방향 배치! */}
        <group position={[5.85, 0.0, 1.95]} rotation={[0, 0, 0]}>
          <RoundedBox args={[1.52, 0.13, 0.44]} position={[0, 0.66, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.2} metalness={0.3} />
          </RoundedBox>
          {/* 반주자 손이 놓이는 남쪽(+Z) 흰건반 & 검은건반 */}
          <RoundedBox args={[1.38, 0.04, 0.15]} position={[0, 0.71, 0.13]} radius={0.005}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[1.28, 0.05, 0.08]} position={[0, 0.72, 0.08]} radius={0.005}>
            <meshStandardMaterial color="#090A0F" />
          </RoundedBox>
          {/* 반주자 눈앞을 향해 기울어진 흰색 악보 & 보면대 */}
          <RoundedBox args={[0.48, 0.26, 0.02]} position={[0, 0.82, -0.08]} rotation={[-0.25, 0, 0]} radius={0.01}>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          {/* 양옆 스틸 다리 & 남쪽(+0.42) 피아노 벤치 의자 */}
          {[-0.55, 0.55].map((sx, si) => (
            <RoundedBox key={si} args={[0.06, 0.64, 0.36]} position={[sx, 0.32, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#27272A" metalness={0.6} />
            </RoundedBox>
          ))}
          <RoundedBox args={[0.68, 0.06, 0.32]} position={[0, 0.38, 0.42]} radius={0.015} castShadow>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          {[-0.26, 0.26].map((bx, bi) => (
            <RoundedBox key={bi} args={[0.04, 0.36, 0.26]} position={[bx, 0.18, 0.42]} radius={0.01}>
              <meshStandardMaterial color="#18181B" />
            </RoundedBox>
          ))}
        </group>

        {/* 🎸 오른쪽 벽면 쪽 기타리스트 스툴 & 기타 앰프 */}
        <group position={[6.92, 0.16, 0.75]}>
          <mesh position={[0, 0.20, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.40, 16]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <RoundedBox args={[0.38, 0.44, 0.46]} position={[0.38, 0.22, -0.45]} rotation={[0, -0.3, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#18181B" />
          </RoundedBox>
        </group>

        {/* 🥁 피아노와 마주 보는 북쪽 벽면 ATV aDrums artist 세트 */}
        <HighQualityAtvDrumKit position={[5.85, 0.48, -0.55]} />
      </group>

      {/* ================================================================= */}
      {/* 🎛️ 4층 연결 테라스 & 초정밀 방송실 부스 */}
      {/* ================================================================= */}
      <SmartCutawayWall wallSide="west" minOpacity={0.18}>
        <group>
          <RoundedBox args={[0.26, 5.4, 16.2]} position={[-7.4, 2.7, 0]} radius={0.02} receiveShadow>
            <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
          </RoundedBox>

          <RoundedBox args={[1.75, 0.42, 11.8]} position={[-6.42, 2.75, 0.4]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial color="#EFE3D3" roughness={0.6} />
          </RoundedBox>
          <mesh position={[-5.58, 3.24, 0.4]}>
            <boxGeometry args={[0.04, 0.62, 11.6]} />
            <meshStandardMaterial color="#BAE6FD" transparent opacity={0.38} roughness={0.1} />
          </mesh>
          <RoundedBox args={[0.07, 0.06, 11.6]} position={[-5.58, 3.56, 0.4]} radius={0.01}>
            <meshStandardMaterial color="#785A46" roughness={0.4} />
          </RoundedBox>

          <group position={[-6.35, 2.96, 3.65]}>
            <RoundedBox args={[0.96, 0.72, 2.75]} position={[0.15, 0.36, 0]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </RoundedBox>
            <RoundedBox args={[1.02, 0.06, 2.82]} position={[0.15, 0.74, 0]} radius={0.015} castShadow>
              <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
            </RoundedBox>

            <group position={[0.18, 0.78, -0.45]}>
              <RoundedBox args={[0.58, 0.09, 0.96]} rotation={[0, 0, -0.14]} radius={0.015} castShadow>
                <meshStandardMaterial color="#090A0F" metalness={0.6} roughness={0.25} />
              </RoundedBox>
              <mesh position={[-0.14, 0.055, 0.25]} rotation={[0, Math.PI / 2, 0.14]}>
                <planeGeometry args={[0.32, 0.18]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              {Array.from({ length: 12 }).map((_, fIdx) => (
                <React.Fragment key={`fader_${fIdx}`}>
                  <RoundedBox
                    args={[0.04, 0.025, 0.025]}
                    position={[0.06 + (fIdx % 3) * 0.05, 0.05, -0.40 + fIdx * 0.065]}
                    radius={0.005}
                  >
                    <meshBasicMaterial color={['#EF4444', '#FACC15', '#34D399', '#38BDF8', '#FFFFFF'][fIdx % 5]} />
                  </RoundedBox>
                  <RoundedBox
                    args={[0.04, 0.025, 0.025]}
                    position={[-0.08, 0.055, -0.40 + fIdx * 0.065]}
                    radius={0.005}
                  >
                    <meshBasicMaterial color="#E2E8F0" />
                  </RoundedBox>
                </React.Fragment>
              ))}
              <mesh position={[0.18, 0.18, -0.42]} rotation={[0.2, 0, -0.3]}>
                <cylinderGeometry args={[0.008, 0.008, 0.26, 8]} />
                <meshStandardMaterial color="#94A3B8" />
              </mesh>
            </group>

            <group position={[0.20, 0.78, 0.55]}>
              <RoundedBox args={[0.42, 0.06, 0.56]} radius={0.01} castShadow>
                <meshStandardMaterial color="#18181B" />
              </RoundedBox>
              {[-0.18, -0.06, 0.06, 0.18].map((bz, bi) => (
                <RoundedBox key={bi} args={[0.08, 0.02, 0.08]} position={[0.05, 0.035, bz]} radius={0.005}>
                  <meshBasicMaterial color={bi === 0 ? '#EF4444' : bi === 1 ? '#22C55E' : '#FACC15'} />
                </RoundedBox>
              ))}
              <mesh position={[-0.08, 0.09, 0.18]}>
                <cylinderGeometry args={[0.015, 0.025, 0.12, 10]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.8} />
              </mesh>
            </group>

            {[-0.78, 0.05, 0.85].map((mz, mi) => (
              <group
                key={`bm_${mi}`}
                position={[0.48, 1.06, mz]}
                rotation={[0, -Math.PI / 2 + (mi === 0 ? -0.18 : mi === 2 ? 0.18 : 0), 0]}
              >
                <RoundedBox args={[0.68, 0.40, 0.035]} radius={0.015} castShadow>
                  <meshStandardMaterial color="#090A0F" roughness={0.2} />
                </RoundedBox>
                <mesh position={[0, 0, 0.02]}>
                  <planeGeometry args={[0.64, 0.36]} />
                  <meshBasicMaterial map={broadcastMonitorTex} />
                </mesh>
                <mesh position={[0, -0.25, -0.02]}>
                  <cylinderGeometry args={[0.02, 0.025, 0.18, 10]} />
                  <meshStandardMaterial color="#475569" metalness={0.8} />
                </mesh>
              </group>
            ))}

            {[-1.22, 1.25].map((sz, si) => (
              <group key={`st_spk_${si}`} position={[0.38, 0.96, sz]} rotation={[0, -Math.PI / 2, 0]}>
                <RoundedBox args={[0.24, 0.36, 0.22]} radius={0.02} castShadow>
                  <meshStandardMaterial color="#18181B" />
                </RoundedBox>
                <mesh position={[0, -0.05, 0.115]}>
                  <circleGeometry args={[0.075, 20]} />
                  <meshBasicMaterial color="#FACC15" />
                </mesh>
                <mesh position={[0, 0.09, 0.115]}>
                  <circleGeometry args={[0.04, 16]} />
                  <meshBasicMaterial color="#94A3B8" />
                </mesh>
              </group>
            ))}

            <group position={[-0.45, 0, 0]}>
              <RoundedBox args={[0.42, 0.07, 0.42]} position={[0, 0.38, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#1E293B" />
              </RoundedBox>
              <RoundedBox args={[0.07, 0.48, 0.40]} position={[-0.18, 0.64, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#1E293B" />
              </RoundedBox>
              <mesh position={[0, 0.19, 0]}>
                <cylinderGeometry args={[0.03, 0.18, 0.38, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.8} />
              </mesh>
            </group>

            <RoundedBox args={[0.06, 0.18, 0.48]} position={[-0.82, 1.55, 0]} radius={0.015}>
              <meshStandardMaterial color="#EF4444" emissive="#DC2626" emissiveIntensity={2.0} />
            </RoundedBox>
          </group>
        </group>
      </SmartCutawayWall>

      {/* ================================================================= */}
      {/* 💬 인물 배치 (지면/발판/방석 완벽 밀착 & 클릭 시 대화창 오픈) */}
      {/* ================================================================= */}
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
                <meshStandardMaterial color="#18181B" />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.74, 8]} />
                <meshStandardMaterial color="#27272A" />
              </mesh>
              <mesh position={[0, 0.76, -0.03]} rotation={[0.4, 0, 0]}>
                <capsuleGeometry args={[0.022, 0.06, 8, 8]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.8} />
              </mesh>
              {pt.isLeader && (
                <RoundedBox args={[0.36, 0.24, 0.02]} position={[0, 0.62, 0.06]} rotation={[-0.4, 0, 0]} radius={0.005}>
                  <meshStandardMaterial color="#0F172A" />
                </RoundedBox>
              )}
            </group>

            <SmoothChibiAvatar
              position={[pt.x, pt.y, pt.z]}
              rotationY={pt.rotY}
              gender={pt.gender}
              hairStyle={pt.hairStyle}
              isPraiseTeam={true}
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

      {showRoomSigns && (
        <>
          <Billboard position={[-0.8, 2.52, -5.4]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onOpenSermonVideo) onOpenSermonVideo(); }}>
              <planeGeometry args={[1.25, 0.54]} />
              <meshBasicMaterial map={signs.pastor} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-0.8, 1.85, -3.5]}>
            <mesh onClick={(e) => { e.stopPropagation(); if (onOpenPraiseVideo) onOpenPraiseVideo(); }}>
              <planeGeometry args={[1.3, 0.54]} />
              <meshBasicMaterial map={signs.praiseTeam} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-4.65, 2.02, -4.65]}>
            <mesh>
              <planeGeometry args={[1.15, 0.48]} />
              <meshBasicMaterial map={signs.repPrayer} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[-6.0, 4.45, 3.65]}>
            <mesh>
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs.broadcast} transparent />
            </mesh>
          </Billboard>
        </>
      )}

      {/* ================================================================= */}
      {/* 💡 5. 은은한 2단 타원형 우물천장 간접조명 & 매립 할로겐 다운라이트 */}
      {/* ================================================================= */}
      <group position={[0, 5.45, 0]}>
        <mesh position={[0, 0.18, -1.0]}>
          <boxGeometry args={[17.0, 0.16, 16.5]} />
          <meshStandardMaterial color="#F2EAE0" roughness={0.75} />
        </mesh>

        <group position={[-0.6, -0.04, -3.5]} scale={[1.22, 1.0, 0.92]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.35, 0.22, 24, 72]} />
            <meshStandardMaterial color="#F7F1E8" roughness={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[8.2, 8.2]} />
            <meshBasicMaterial map={softCeilingGlowTex} transparent opacity={0.85} depthWrite={false} />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <torusGeometry args={[2.10, 0.18, 24, 72]} />
            <meshStandardMaterial color="#FAF5EE" roughness={0.55} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <planeGeometry args={[5.4, 5.4]} />
            <meshBasicMaterial map={softCeilingGlowTex} transparent opacity={0.92} depthWrite={false} />
          </mesh>

          {Array.from({ length: 10 }).map((_, dIdx) => {
            const ang = (dIdx / 10) * Math.PI * 2;
            const r = dIdx % 2 === 0 ? 2.72 : 1.45;
            return (
              <group key={`dl_${dIdx}`} position={[Math.cos(ang) * r, -0.02, Math.sin(ang) * r]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.10, 0.15, 20]} />
                  <meshStandardMaterial color="#CBD5E1" />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
                  <circleGeometry args={[0.10, 20]} />
                  <meshBasicMaterial color="#FFFBEB" />
                </mesh>
              </group>
            );
          })}
        </group>

        {[-3.65, 2.25].map((sx, idx) => (
          <group key={`line_spk_${idx}`} position={[sx, -0.95, -3.3]}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.95, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            <RoundedBox args={[0.78, 0.06, 0.56]} position={[0, 0.42, 0]} radius={0.01}>
              <meshStandardMaterial color="#090A0F" />
            </RoundedBox>
            <RoundedBox args={[0.76, 0.86, 0.54]} position={[0, -0.08, 0]} rotation={[0.18, 0, 0]} radius={0.03} castShadow>
              <meshStandardMaterial color="#111318" roughness={0.3} />
            </RoundedBox>
            <mesh position={[-0.26, 0.12, 0.28]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshBasicMaterial color="#38BDF8" />
            </mesh>
            <mesh position={[-0.26, -0.22, 0.22]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshBasicMaterial color="#38BDF8" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 🏢 6. 우측 채광창 4개 + 남쪽 후면: 원목 스틸십자가 출입문 + 4층 통유리 테라스 중앙 TV */}
      {/* ================================================================= */}
      <SmartCutawayWall wallSide="east">
        <RoundedBox args={[0.26, 5.4, 16.2]} position={[7.4, 2.7, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>
        {[-2.4, -0.5, 1.4, 3.3].map((wz, wi) => (
          <group key={`rwin_${wi}`} position={[7.25, 1.45, wz]}>
            <RoundedBox args={[0.08, 1.55, 0.92]} radius={0.01}>
              <meshStandardMaterial color="#6B4423" />
            </RoundedBox>
            <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.82, 1.42]} />
              <meshStandardMaterial color="#FFFBEB" emissive="#FDE68A" emissiveIntensity={0.85} />
            </mesh>
          </group>
        ))}
      </SmartCutawayWall>

      {/* 예배당 뒤편 좌측 주보 배부 데스크 */}
      <group position={[-3.6, 0, 6.45]}>
        <RoundedBox args={[1.15, 0.88, 0.52]} position={[0, 0.44, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={oakWoodTex} />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.06, 0.24]} position={[0, 0.91, 0]} radius={0.005}>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>
      </group>

      {/* 🚪 예배당 후면 벽 중앙의 '건축가급 스틸 십자가 원목 양개 출입문' */}
      <SanctuaryRearCrossDoubleDoor
        position={[0, 0, 7.05]}
        woodTex={oakWoodTex}
        onClickDoor={() => onSelectZone(ZONES_3F[6])}
      />
      {showRoomSigns && (
        <Billboard position={[0, 2.68, 6.95]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectZone(ZONES_3F[6]); }}>
            <planeGeometry args={[1.25, 0.52]} />
            <meshBasicMaterial map={signs.rearDoor} transparent />
          </mesh>
        </Billboard>
      )}

      {/* 🪟 남쪽 후면 벽 & 4층 크리스탈 투명 통유리창 + 목사님 정면 건너편 테라스 중앙 TV */}
      <SmartCutawayWall wallSide="south" minOpacity={0.22}>
        <RoundedBox args={[7.1, 2.7, 0.26]} position={[-4.85, 1.35, 7.15]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[7.1, 2.7, 0.26]} position={[4.85, 1.35, 7.15]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[16.8, 2.7, 0.26]} position={[0, 4.05, 7.15]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>

        <RoundedBox args={[14.8, 0.42, 2.2]} position={[0, 2.75, 6.0]} radius={0.025} receiveShadow>
          <meshStandardMaterial color="#EFE3D3" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 3.24, 4.92]}>
          <boxGeometry args={[14.4, 0.62, 0.04]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.36} roughness={0.1} />
        </mesh>
        <RoundedBox args={[14.4, 0.06, 0.07]} position={[0, 3.56, 4.92]} radius={0.01}>
          <meshStandardMaterial color="#785A46" roughness={0.4} />
        </RoundedBox>

        {/* 목사님 정면 건너편 4층 통유리 테라스 난간 중앙 대형 TV */}
        <group
          position={[0, 2.88, 4.82]}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSermonVideo) onOpenSermonVideo();
          }}
        >
          <RoundedBox args={[1.95, 1.05, 0.12]} radius={0.02} castShadow userData={{ keepOpaque: true }}>
            <meshStandardMaterial color="#18181B" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]} userData={{ keepOpaque: true }}>
            <planeGeometry args={[1.82, 0.92]} />
            <meshBasicMaterial map={bigScreenTex} />
          </mesh>
          <mesh position={[0, 0, 0.065]} userData={{ keepOpaque: true }}>
            <planeGeometry args={[1.82, 0.92]} />
            <meshBasicMaterial map={bigScreenTex} />
          </mesh>
        </group>

        <group position={[0, 4.18, 6.96]}>
          <RoundedBox args={[11.2, 1.96, 0.12]} radius={0.015}>
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[10.8, 1.76]} />
            <meshBasicMaterial color="#FEF3C7" transparent opacity={0.28} />
          </mesh>
          <mesh position={[0, 0, -0.07]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[10.8, 1.76]} />
            <meshBasicMaterial map={clearGlassTex} transparent opacity={0.88} />
          </mesh>
        </group>
      </SmartCutawayWall>

      {/* ================================================================= */}
      {/* 🪑 7. 정통 원목 장의자(Pews) 3열 x 6줄 */}
      {/* ================================================================= */}
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
              <RoundedBox args={[col.width - 0.10, 0.06, 0.44]} position={[0, 0.35, -0.04]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.14, 0.08, 0.42]} position={[0, 0.41, -0.05]} radius={0.025} castShadow receiveShadow>
                <meshStandardMaterial color="#7D6856" roughness={0.5} />
              </RoundedBox>

              <RoundedBox args={[col.width - 0.14, 0.26, 0.04]} position={[0, 0.18, 0.10]} radius={0.01} castShadow receiveShadow>
                <meshStandardMaterial map={oakWoodTex} roughness={0.42} />
              </RoundedBox>

              <group position={[0, 0.64, 0.20]} rotation={[0.18, 0, 0]}>
                <RoundedBox
                  args={[col.width, 0.54, 0.07]}
                  position={[0, 0, 0]}
                  radius={0.02}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial map={oakWoodTex} color={isCurrentSeatedPew ? '#FDE047' : '#FFFFFF'} roughness={0.35} />
                </RoundedBox>
                <RoundedBox args={[col.width + 0.02, 0.06, 0.09]} position={[0, 0.27, 0]} radius={0.025} castShadow>
                  <meshStandardMaterial map={oakWoodTex} roughness={0.3} />
                </RoundedBox>
                <RoundedBox args={[col.width - 0.16, 0.40, 0.04]} position={[0, -0.02, -0.045]} radius={0.015}>
                  <meshStandardMaterial color="#8E7966" roughness={0.5} />
                </RoundedBox>
                <RoundedBox args={[col.width - 0.24, 0.04, 0.12]} position={[0, -0.06, 0.08]} radius={0.01} castShadow>
                  <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
                </RoundedBox>
                <RoundedBox args={[0.24, 0.04, 0.15]} position={[-col.width * 0.26, 0.29, 0]} radius={0.008} castShadow>
                  <meshStandardMaterial color="#27272A" />
                </RoundedBox>
                <RoundedBox args={[0.24, 0.04, 0.15]} position={[col.width * 0.26, 0.29, 0]} radius={0.008} castShadow>
                  <meshStandardMaterial color="#27272A" />
                </RoundedBox>

                {hasWelcomeCover && (
                  <group position={[col.colId === 'C' ? 0.65 : -0.25, 0.16, 0]}>
                    <RoundedBox args={[0.86, 0.24, 0.11]} radius={0.015} castShadow>
                      <meshStandardMaterial color="#FFFFFF" />
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

              <mesh
                geometry={pewSideStanchionGeo}
                position={[-col.width / 2, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
              </mesh>
              <mesh
                geometry={pewSideStanchionGeo}
                position={[col.width / 2 + 0.08, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
              </mesh>
            </group>
          );
        })
      )}

      {/* 8. 성도들 렌더링 (방석에 완벽 밀착 & 클릭 시 대화창 오픈) */}
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

      {/* 9. 바닥 초록색 홀로그램 원형 마커 */}
      {ZONES_3F.map((z) => (
        <HologramZoneMarker
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isOfferingBox && onOpenOfferingModal) {
              onOpenOfferingModal();
            } else if (sel.isPraiseZone && onOpenPraiseVideo) {
              onOpenPraiseVideo();
            } else if (sel.isSermonZone && onOpenSermonVideo) {
              onOpenSermonVideo();
            } else if (sel.isSeatZone && sel.seatTarget) {
              onSitOnPew(sel.seatTarget);
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
function PlayerController3F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  emote,
  onPositionUpdate
}) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [0.35, 0, 0.32],
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
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.pos[2] !== seatedInfo.z) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: Math.PI,
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
      const step = Math.min(dist, delta * 4.0);
      const rawNx = cx + (dx / dist) * step;
      const rawNz = cz + (dz / dist) * step;
      const [nx, nz] = resolveCollision3F(rawNx, rawNz);
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
    <SmoothChibiAvatar
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

function InitialCameraSetup({ controlsRef }) {
  const { camera, size } = useThree();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isMobilePortrait = size.width < 640;
    if (isMobilePortrait) {
      camera.position.set(-9.6, 4.6, 10.4);
      camera.fov = 42;
    } else {
      camera.position.set(-7.6, 3.6, 7.8);
      camera.fov = 34;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0.2, 1.25, -1.5);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function Sanctuary3F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([0.35, 0, 0.32]);

  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);
  const initialPraise = useMemo(() => getSyncedPraiseVideo(), []);

  const [waypoints, setWaypoints] = useState([[0.35, 0.32]]);
  const [seatedInfo, setSeatedInfo] = useState({ x: 0.35, z: 0.32, rowLabel: '중앙 새가족 환영석 (3열)' });
  const [activeZone, setActiveZone] = useState(ZONES_3F[4]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

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

  const [showBannerEditModal, setShowBannerEditModal] = useState(false);
  const [bannerConfig, setBannerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('church_3f_banner_config');
      return saved ? JSON.parse(saved) : {
        leftText: '말씀과 기도로\n거룩하여지는\n좋은나무 공동체',
        rightText: '기적이 상식이 되는\n5일의 기도\n응답받는 성전',
        leftImgUrl: '',
        rightImgUrl: '',
        bgColorTop: '#ECFDF5',
        bgColorBottom: '#A7F3D0'
      };
    } catch (_) {
      return {
        leftText: '말씀과 기도로\n거룩하여지는\n좋은나무 공동체',
        rightText: '기적이 상식이 되는\n5일의 기도\n응답받는 성전',
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
  const [offeringAmount, setOfferingAmount] = useState('');
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

  const triggerEmote = (type) => {
    setEmote(type);
    setTimeout(() => setEmote(null), 2200);
  };

  const handleOpenSermonVideo = useCallback(() => {
    setMediaMode('sermon');
    setIsScreenPlaying(true);
  }, []);

  const handleOpenPraiseVideo = useCallback(() => {
    setMediaMode('praise');
    setIsScreenPlaying(true);
  }, []);

  const handleSitOnPew = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
    setMediaMode('sermon');
    setIsScreenPlaying(true);
  }, []);

  const handleStandUp = useCallback(() => {
    const curX = seatedInfo ? seatedInfo.x : 0.35;
    const curZ = seatedInfo ? seatedInfo.z : 0.32;
    const exitX = curX < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT;
    setSeatedInfo(null);
    setIsScreenPlaying(false);
    setWaypoints([[exitX, curZ - 0.35]]);
  }, [seatedInfo]);

  const handleWalkToPoint = useCallback((targetX, targetZ) => {
    const [sx, , sz] = playerIdxRef.current;
    const startX = seatedInfo ? (seatedInfo.x < 0 ? AISLE_X_LEFT : AISLE_X_RIGHT) : sx;
    const startZ = seatedInfo ? seatedInfo.z - 0.35 : sz;
    if (seatedInfo) setSeatedInfo(null);

    const path = computeSmartPath3F(startX, startZ, targetX, targetZ);
    setWaypoints(path);
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    const replies = {
      pastor_main: '사랑하는 성도님, 오늘 예배를 통해 하나님의 놀라운 평강과 응답이 삶 가운데 넘치기를 축복합니다!',
      rep_prayer_elder: '성도님 반갑습니다! 우리 교회의 부흥과 성도님 가정을 위해 함께 마음을 모아 기도하겠습니다.',
      praise_leader: '할렐루야! 우리 함께 목소리 높여 살아계신 주님을 기쁨으로 찬양해요!'
    };
    setChatReplyText(
      replies[npc.id] ||
      (npc.dialogues && npc.dialogues[0]) ||
      '할렐루야 성도님! 오늘 주일 본당에서 함께 예배드리게 되어 참 반갑고 기쁩니다 😊'
    );
    setSelectedChatNpc(npc);
    triggerEmote('wave');
  }, []);

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
      amount: offeringAmount.trim(),
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
    setOfferingAmount('');
    triggerEmote('wave');
    alert('🙏 작성하신 감사와 기도제목이 예배당 오른편 뒤벽 감사/기도함에 등록되어 영성 노트에 자동 연동되었습니다!');
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

    ctx.fillStyle = '#0284C7';
    ctx.fillRect(4, 18, 8, 66);

    ctx.fillStyle = '#D99B5E';
    ctx.fillRect(14, 6, w - 24, 20);

    ctx.fillStyle = '#6366F1';
    ctx.fillRect(14, 34, 24, 38);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(42, 34, 30, 38);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(76, 34, 24, 38);

    ctx.fillStyle = '#D97706';
    ctx.fillRect(46, 84, 22, 6);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(78, 82, 16, 8);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 7.0) / 14.0) * w;
    const my = ((cz + 6.0) / 13.5) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

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

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_3F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
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
      {/* 1. 좌측 상단: 슬림 헤더 & 찬양/감사기도함/표어배너 수정/시점리셋 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 3F 대예배당 본당
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
            onClick={handleOpenPraiseVideo}
            style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            🎤 찬양팀 유튜브
          </button>

          <button
            onClick={() => setShowOfferingModal(true)}
            style={{ backgroundColor: '#F59E0B', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            🙏 감사/기도함
          </button>

          <button
            onClick={() => setShowBannerEditModal(true)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FDE047' }}>🖼️ 표어배너 수정</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(-7.6, 3.6, 7.8);
              controlsRef.current.target.set(0.2, 1.25, -1.5);
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 3F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_3F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isOfferingBox) {
                      handleWalkToPoint(z.pos[0], z.pos[2]);
                      setShowOfferingModal(true);
                    } else if (z.isPraiseZone) handleOpenPraiseVideo();
                    else if (z.isSermonZone) handleOpenSermonVideo();
                    else if (z.isSeatZone && z.seatTarget) handleSitOnPew(z.seatTarget);
                    else {
                      handleWalkToPoint(z.pos[0], z.pos[2]);
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

      {/* 3. 설교 / 찬양 듀얼 유튜브 플레이어 모달 */}
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
                ✝️ 목사님 설교
              </button>
              <button
                onClick={() => setMediaMode('praise')}
                style={{
                  backgroundColor: mediaMode === 'praise' ? '#EC4899' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF'
                }}
                className="px-2 py-0.5 rounded text-[10px] font-black cursor-pointer shrink-0"
              >
                🎤 찬양팀 찬양
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
                title="Sanctuary Live Media"
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

      {/* 4. 하단 좌측: 접이식 3층 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '🪑', label: seatedInfo ? '일어나기' : '의자착석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnPew({ x: 0.35, z: 0.32, rowLabel: '중앙 새가족 환영석 (3열)' }); } },
              { icon: '🎤', label: '찬양유튜브', onClick: handleOpenPraiseVideo },
              { icon: '✝️', label: '설교말씀', onClick: handleOpenSermonVideo },
              { icon: '🖼️', label: '표어배너수정', onClick: () => setShowBannerEditModal(true) },
              { icon: '🙏', label: '감사/기도함', onClick: () => setShowOfferingModal(true) },
              { icon: '📝', label: '예배노트', onClick: () => setActiveScreen && setActiveScreen('sermon') }
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
            ⛪ 본당 메뉴 ▲
          </button>
        )}
      </div>

      {/* 5. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[-7.6, 3.6, 7.8]} fov={34} near={0.1} far={250} />
        <InitialCameraSetup controlsRef={controlsRef} />

        <ambientLight intensity={1.32} color="#FFF8EE" />
        <hemisphereLight args={['#FFF5E4', '#8C7A6B', 1.18]} />
        <directionalLight
          position={[-6, 9, 8]}
          intensity={1.45}
          color="#FFF3DC"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[-0.6, 4.8, -3.5]} intensity={3.2} distance={19} color="#FDE68A" />
        <pointLight position={[3.5, 3.2, 0.5]} intensity={1.5} distance={15} color="#FEF3C7" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkToPoint(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[16.0, 16.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SanctuaryMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.pos) handleWalkToPoint(z.pos[0], z.pos[2]);
            setModalZone(z);
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
        />

        <PlayerController3F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          emote={emote}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.38} scale={24} blur={2.2} far={4} />
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.07}
          minDistance={2.2}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* ================================================================= */}
      {/* 🤝 6. [메타버스 상호작용] 성도·교역자 클릭 시 열리는 1:1 대화 & 기능 연동 모달 */}
      {/* ================================================================= */}
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
                    {selectedChatNpc.role || '좋은나무교회 성도'}
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

            {/* 상대방의 대화 메시지 박스 */}
            <div
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}
              className="p-3.5 rounded-2xl border text-xs sm:text-[13px] leading-relaxed font-medium text-emerald-100"
            >
              "{chatReplyText}"
            </div>

            {/* 대화 선택지 버튼들 (누르면 즉시 대답이 바뀌며 상호작용!) */}
            <div className="space-y-1.5">
              <span style={{ color: '#9CA3AF' }} className="text-[11px] font-bold block">
                💬 인사 및 대화 나누기 (클릭 시 응답)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    q: '👋 "샬롬! 반갑습니다. 오늘도 은혜로운 주일 예배 되세요!"',
                    a: `네 ${playerName}님 반갑습니다! 오늘 주신 말씀 붙들고 한 주간도 승리하세요 😊`
                  },
                  {
                    q: '🙏 "함께 기도제목을 나누고 중보기도 하고 싶어요."',
                    a: `아멘! ${playerName}님의 가정과 일터의 기도제목을 기억하며 저도 새벽마다 함께 중보기도 하겠습니다 🙏`
                  },
                  {
                    q: '📖 "오늘 설교 말씀과 찬양이 참 은혜롭지 않나요?"',
                    a: '맞아요! 찬양할 때 마음이 뜨거워지고 목사님 말씀을 통해 큰 위로와 해답을 얻었습니다!'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatReplyText(item.a);
                      triggerEmote('wave');
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-600/30 border border-white/10 text-left text-xs font-bold cursor-pointer transition-all"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* 메타버스 공간 ↔ 앱 기능 상호호환 액션 버튼 */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              {selectedChatNpc.seated && (
                <button
                  onClick={() => {
                    handleSitOnPew({
                      x: selectedChatNpc.x + (selectedChatNpc.x < 0 ? 0.55 : -0.55),
                      z: selectedChatNpc.z,
                      rowLabel: `${selectedChatNpc.name} 옆자리`
                    });
                    setSelectedChatNpc(null);
                  }}
                  style={{ backgroundColor: '#10B981', color: '#030712' }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
                >
                  🪑 이 성도님 옆자리에 앉기
                </button>
              )}
              {selectedChatNpc.isPastorAction && (
                <button
                  onClick={() => {
                    setSelectedChatNpc(null);
                    handleOpenSermonVideo();
                  }}
                  style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
                >
                  ✝️ 담임목사님 설교 영상 보기
                </button>
              )}
              {selectedChatNpc.isPraiseAction && (
                <button
                  onClick={() => {
                    setSelectedChatNpc(null);
                    handleOpenPraiseVideo();
                  }}
                  style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
                >
                  🎤 찬양팀 유튜브 영상 보기
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  setShowOfferingModal(true);
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FDE047' }}
                className="py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                🙏 감사/기도함 열기
              </button>
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  if (setActiveScreen) setActiveScreen('sermon');
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#93C5FD' }}
                className="py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                📝 예배노트 필기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🖼️ 7. 강대상 좌·우 표어 배너 이미지/문구 실시간 수정 모달 */}
      {/* ================================================================= */}
      {showBannerEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBannerEditModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[88vh] overflow-y-auto hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span style={{ color: '#FDE047' }} className="text-sm font-black">
                🖼️ 강대상 좌·우 표어 배너 이미지 & 문구 업데이트
              </span>
              <button onClick={() => setShowBannerEditModal(false)} style={{ color: '#9CA3AF' }} className="text-xs font-bold cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">1. 좌측 스탠드 배너</span>
                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1 rounded-lg bg-emerald-500 text-stone-950 text-[11px] font-black cursor-pointer">
                    📁 이미지 업로드
                    <input type="file" accept="image/*" onChange={(e) => handleBannerImageFileUpload('left', e)} className="hidden" />
                  </label>
                  {bannerConfig.leftImgUrl && (
                    <button
                      onClick={() => handleSaveBannerConfig({ ...bannerConfig, leftImgUrl: '' })}
                      className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[11px] font-bold cursor-pointer"
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
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full p-2.5 rounded-xl border border-white/15 text-xs outline-none resize-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-400">2. 우측 스탠드 배너</span>
                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1 rounded-lg bg-sky-400 text-stone-950 text-[11px] font-black cursor-pointer">
                    📁 이미지 업로드
                    <input type="file" accept="image/*" onChange={(e) => handleBannerImageFileUpload('right', e)} className="hidden" />
                  </label>
                  {bannerConfig.rightImgUrl && (
                    <button
                      onClick={() => handleSaveBannerConfig({ ...bannerConfig, rightImgUrl: '' })}
                      className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[11px] font-bold cursor-pointer"
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
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full p-2.5 rounded-xl border border-white/15 text-xs outline-none resize-none"
              />
            </div>

            <button
              onClick={() => setShowBannerEditModal(false)}
              style={{ backgroundColor: '#10B981', color: '#030712' }}
              className="w-full py-2.5 rounded-xl font-black text-xs cursor-pointer"
            >
              강단 배너에 즉시 반영 완료
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🙏 8. 예배당 오른편 뒤벽 [감사/기도함] 클릭 시 열리는 모달 */}
      {/* ================================================================= */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowOfferingModal(false)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-md border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-left max-h-[88vh] overflow-y-auto hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: '#F59E0B', color: '#030712' }} className="px-2.5 py-1 rounded-full font-black text-xs">
                  🙏 감사/기도함
                </span>
                <span style={{ color: '#FDE047' }} className="text-xs font-bold">
                  작성자: {playerName}
                </span>
              </div>
              <button onClick={() => setShowOfferingModal(false)} style={{ color: '#9CA3AF' }} className="text-xs font-bold cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            <div className="space-y-1.5">
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block">구분 선택</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['감사제목', '중보기도', '가정·자녀', '선교·비전'].map((tName) => (
                  <button
                    key={tName}
                    onClick={() => setOfferingType(tName)}
                    style={{
                      backgroundColor: offeringType === tName ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                      color: offeringType === tName ? '#030712' : '#E5E7EB'
                    }}
                    className="py-2 rounded-xl text-[11px] font-black border border-white/10 cursor-pointer transition-all"
                  >
                    {tName}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label style={{ color: '#FCD34D' }} className="text-[11px] font-bold block mb-1">
                  ✨ 하나님께 올려드리는 감사제목 (영성노트 자동 연동)
                </label>
                <textarea
                  rows={2}
                  value={thanksNote}
                  onChange={(e) => setThanksNote(e.target.value)}
                  placeholder="예: 한 주간 가정과 일터를 평안히 지켜주심에 감사드립니다."
                  style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                  className="w-full p-2.5 rounded-xl border border-white/15 text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label style={{ color: '#93C5FD' }} className="text-[11px] font-bold block mb-1">
                  🙏 간절한 기도제목 (중보기도 & 강단 기도 연동)
                </label>
                <textarea
                  rows={2}
                  value={prayerNote}
                  onChange={(e) => setPrayerNote(e.target.value)}
                  placeholder="예: 자녀들의 믿음 성장과 건강, 교회 부흥을 위해 기도합니다."
                  style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                  className="w-full p-2.5 rounded-xl border border-white/15 text-xs outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitOfferingEnvelope}
              style={{ backgroundColor: '#10B981', color: '#030712' }}
              className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
            >
              ✉️ 감사/기도함에 등록하기 (영성노트 연동)
            </button>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <span style={{ color: '#34D399' }} className="text-[11px] font-bold block">
                🌿 감사/기도함에 올려진 성도님들의 감사·기도 나눔 ({offeringHistory.length}건)
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
                {offeringHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="p-2.5 rounded-xl border border-white/10 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#FDE047' }} className="font-black">
                        [{item.type}] {item.writer}
                      </span>
                      <span style={{ color: '#9CA3AF' }} className="text-[10px] font-mono">{item.date}</span>
                    </div>
                    <p style={{ color: '#E5E7EB' }} className="leading-snug"><b>감사:</b> {item.thanks}</p>
                    <p style={{ color: '#93C5FD' }} className="leading-snug"><b>기도:</b> {item.prayer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. 설교 / 찬양 유튜브 링크 변경 모달 */}
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
                {mediaMode === 'praise' ? '🎤 찬양팀 경배와찬양 유튜브 링크 설정' : '✝️ 담임목사님 설교 유튜브 링크 설정'}
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
                본당에 즉시 연동하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. 구역 상세 안내 & 전 층(1F·3F·4F·5F·6F) 이동 모달 */}
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
                  { fl: '3F', label: '3F 대예배당 (현재 층)' },
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
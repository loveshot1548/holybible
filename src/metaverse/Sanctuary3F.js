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
// 🎨 고해상도 캔버스 텍스처 & 리얼 원목 나뭇결(Wood Grain) 생성기
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
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 85; i++) {
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const y = (i / 85) * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.sin(i) * 5, w * 0.7, y - Math.cos(i) * 5, w, y);
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
    ctx.font = '900 44px sans-serif';
    ctx.fillText(title, w / 2, 124);
  }, 420, 175);
}

// =====================================================================
// 🚧 장의자·강단·뒤편 감사/기도함 실시간 물리 충돌(AABB) & 복도 자동 우회
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
  // 북쪽 강단 무대 및 찬양팀 단상 전체
  { minX: -8.0, maxX: 8.0, minZ: -8.0, maxZ: -3.05 },
  // 우측 그랜드 피아노 충돌 박스
  { minX: 4.3, maxX: 7.2, minZ: -4.6, maxZ: -2.7 },
  // 예배당 뒤편(후면 입구) 감사/기도함 테이블 충돌 박스
  { minX: -3.8, maxX: -2.5, minZ: 5.2, maxZ: 6.1 },
  // 장의자 3열 x 6줄 물리 충돌 박스
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
  if (x < -6.3 || x > 6.3 || z < -3.0 || z > 6.2) return true;
  for (const box of OBSTACLE_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }
  return false;
}

function resolveCollision3F(nx, nz, radius = 0.25) {
  let x = Math.max(-6.2, Math.min(6.2, nx));
  let z = Math.max(-2.95, Math.min(6.0, nz));

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
// 📍 3층 대예배당 6대 인터랙션 존 정의 ('감사/기도함' 뒤편 이동 & 악기팀 추가 반영!)
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_offering',
    code: '01',
    subCode: '감사/기도함',
    name: '예배당 뒤편 감사/기도함 & 봉투 비치대',
    prompt: '01 감사/기도함 (감사·기도제목 올리기)',
    pos: [-2.35, 0, 4.95],
    isOfferingBox: true,
    badge: '01 감사/기도함',
    title: '🙏 좋은나무교회 감사/기도함 (예배당 뒤편 입구)',
    desc: '예배당 뒤편 입구에 마련된 원목 감사/기도함과 봉투 비치대입니다. 예배드리기 전 오늘 주신 은혜에 대한 감사와 간절한 기도제목을 적어 올려드리세요!'
  },
  {
    id: 'zone_3f_praise_team',
    code: '02',
    subCode: '찬양팀',
    name: '강대상 앞 찬양팀 (전도사님·싱어·드럼·피아노)',
    prompt: '02 우리 교회 찬양 유튜브 영상 보기',
    pos: [-0.2, 0, -2.95],
    isPraiseZone: true,
    badge: '02 찬양팀·악기팀',
    title: '🎤 전도사님 찬양인도 & 싱어·피아노·드럼 찬양단',
    desc: '강대상 앞 단상의 전도사님과 남녀 싱어 4명, 그리고 우측 그랜드 피아노 반주자와 드럼 연주자가 함께 주님을 찬양하고 있습니다. 클릭하시면 찬양 유튜브가 재생됩니다!'
  },
  {
    id: 'zone_3f_pastor_pulpit',
    code: '03',
    subCode: '강대상',
    name: '중앙 강대상 담임목사님 말씀 선포',
    prompt: '03 담임목사님 주일 설교 영상 보기',
    pos: [1.2, 0, -2.95],
    isSermonZone: true,
    badge: '03 강대상·목사님',
    title: '✝️ 3층 대예배당 강대상 & 담임목사님 설교 말씀',
    desc: '강대상 뒤편 전용 발판 위에서 담임목사님이 성도들을 바라보며 생명의 말씀을 선포하고 계십니다. 클릭하시면 설교 유튜브 라이브가 열립니다.'
  },
  {
    id: 'zone_3f_welcome_pew',
    code: '04',
    subCode: '환영석',
    name: '중앙 새가족 환영 지정석 착석',
    prompt: '04 새가족 환영석에 앉아 예배드리기',
    pos: [-1.6, 0, 0.3],
    seatTarget: { x: 0.35, z: 0.32, rowLabel: '중앙 새가족 환영석 (3열)' },
    isSeatZone: true,
    badge: '04 새가족 환영석',
    title: '🪑 "좋은나무교회 환영합니다" 새가족 지정석',
    desc: '장의자 방석에 앉으시면 의자를 뚫지 않고 정자세로 착석하며, 전면 대형 설교 스크린이 자동 상영됩니다.'
  },
  {
    id: 'zone_3f_rear_ushers',
    code: '05',
    subCode: '안내위원',
    name: '예배당 뒤편 안내위원 & 주보 영접 데스크',
    prompt: '05 뒤편 안내위원 인사 & 주보 안내',
    pos: [0.4, 0, 5.2],
    badge: '05 뒤편 안내위원',
    title: '🤝 예배당 후면 안내위원단 & 새가족 영접부',
    desc: '예배당 뒤편 출입구와 감사/기도함 옆에서 안내위원들이 밝은 미소로 성도님들을 맞이하며 주보를 나눠드리고 있습니다.'
  },
  {
    id: 'zone_3f_elev',
    code: '06',
    subCode: '층간이동',
    name: '전 층 이동 엘리베이터 (1F·4F·5F·6F)',
    prompt: '06 엘리베이터 타고 다른 층으로 이동',
    pos: [2.35, 0, 5.2],
    isElevator: true,
    badge: '06 엘리베이터',
    title: '🛗 전 층 연결 스마트 엘리베이터 (1F·3F·4F·5F·6F)',
    desc: '1층 로비, 4층 영유아실(자모실), 5층 소예배·조리·댄스실, 6층 다음세대 교육관으로 즉시 이동합니다.'
  }
];

// =====================================================================
// 🎤 1. 강대상 담임목사님 (2단 발판 위로 올라가 상반신이 완벽히 보이도록 y = 0.86 설정!)
// =====================================================================
const PASTOR_NPC = {
  id: 'pastor_main',
  name: '담임목사님',
  x: -0.8,
  y: 0.86, // 강단(0.48m) + 2단 원목 발판(0.38m) = 0.86m! 강대상 위로 상반신이 선명하게 노출됨!
  z: -5.62,
  rotY: 0,
  shirt: '#1E293B',
  pants: '#0F172A',
  hair: '#18181B',
  dialogues: [
    '할렐루야! 오늘 예배하는 모든 성도님들 가정에 주님의 은혜가 충만하길 축원합니다 ✝️',
    '뒤편 감사/기도함에 올려드린 모든 기도와 감사가 하늘 보좌에 상달될 줄 믿습니다!',
    '말씀과 성령으로 세워지는 좋은나무 공동체가 됩시다 🙏'
  ]
};

// 강대상 앞 5인 찬양팀 + 우측 피아노 반주자 + 우측 아크릴 부스 드러머!
const PRAISE_TEAM_5_NPCS = [
  {
    id: 'praise_leader',
    name: '김전도사 (찬양인도)',
    isLeader: true,
    x: -0.8,
    y: 0.16,
    z: -3.55,
    rotY: 0,
    isSkirt: false,
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '다 함께 두 손을 높이 들고 전심으로 주님을 찬양합시다! 🎵',
      '피아노와 드럼 반주에 맞춰 기쁨의 박수로 찬양해요 🙌',
      '저를 클릭하시면 우리 교회 찬양 유튜브 영상이 바로 재생됩니다!'
    ]
  },
  {
    id: 'singer_f1',
    name: '박소연 (싱어·자매)',
    x: -2.3,
    y: 0.16,
    z: -3.65,
    rotY: 0.12,
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
    x: -1.55,
    y: 0.16,
    z: -3.62,
    rotY: 0.06,
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
    x: -0.05,
    y: 0.16,
    z: -3.62,
    rotY: -0.06,
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
    x: 0.7,
    y: 0.16,
    z: -3.65,
    rotY: -0.12,
    isSkirt: false,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '드럼과 피아노 반주에 맞춰 온 맘 다해 주님을 찬양합니다 🔥',
      '살아계신 주님께서 우리의 찬양을 기쁘게 받으십니다!'
    ]
  }
];

// 🎹🥁 [핵심 추가 3] 우측 그랜드 피아노 반주자 & 6각 아크릴 부스 드러머 NPC!
const BAND_INSTRUMENT_NPCS = [
  {
    id: 'sanctuary_pianist',
    name: '이자매 (피아노 반주)',
    x: 4.92,
    y: 0.02,
    z: -2.65,
    rotY: Math.PI - 0.28, // 그랜드 피아노 건반을 정면으로 바라보며 착석 연주!
    isPianist: true,
    isSkirt: true,
    shirt: '#A855F7',
    pants: '#F3E8FF',
    hair: '#451A03',
    dialogues: [
      '그랜드 피아노의 깊은 울림으로 주님의 은혜를 연주합니다 🎹',
      '목사님 설교 후 결단 찬양 반주까지 기도로 준비하고 있어요 🙏'
    ]
  },
  {
    id: 'sanctuary_drummer',
    name: '최형제 (드럼 연주)',
    x: 2.65,
    y: 0.44,
    z: -5.45,
    rotY: -0.25, // 아크릴 드럼 부스 안에서 스네어와 심벌즈를 향해 착석 연주!
    isDrummer: true,
    isSkirt: false,
    shirt: '#EF4444',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '아크릴 드럼 부스 안에서 힘찬 비트로 찬양팀을 받쳐줍니다 🥁',
      '전도사님 사인에 맞춰 크레센도로 빌드업 들어갑니다! 🔥'
    ]
  }
];

// =====================================================================
// 👥 2. 좌측 장로님석 + 다양한 남녀 성도 착석 + 좌우 복도 이동자 + 후면 안내위원단
// =====================================================================
const CONGREGATION_NPCS = [
  // [A] 좌측 장의자(PEW_COLS 'L', x = -4.25): 정장 차림의 장로님 4분 착석!
  {
    id: 'elder_1',
    name: '김장로 (시무장로)',
    x: -4.85,
    z: -2.2 - 0.08,
    seated: true,
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#94A3B8',
    dialogues: [
      '아멘! 목사님께서 발판 위에서 힘있게 선포하시는 말씀에 큰 은혜를 받습니다 🙏',
      '교회의 기둥으로서 늘 기도로 강단을 후원하겠습니다.'
    ]
  },
  {
    id: 'elder_2',
    name: '이장로 (수석장로)',
    x: -3.65,
    z: -2.2 - 0.08,
    seated: true,
    shirt: '#334155',
    pants: '#0F172A',
    hair: '#64748B',
    dialogues: [
      '찬양팀과 피아노·드럼 연주자들의 찬양이 참으로 뜨겁고 은혜롭군요 👏',
      '오늘 새가족분들이 많이 오셔서 하나님께 감사드립니다!'
    ]
  },
  {
    id: 'elder_3',
    name: '박장로 (예배위원장)',
    x: -4.85,
    z: -0.9 - 0.08,
    seated: true,
    shirt: '#1E3A8A',
    pants: '#0F172A',
    hair: '#475569',
    dialogues: [
      '예배당 들어오면서 뒤편 감사/기도함에 감사와 기도제목을 넣고 왔습니다 🙏',
      '거룩하고 신령한 주일 대예배가 되기를 기도합니다.'
    ]
  },
  {
    id: 'elder_4',
    name: '정장로 (선교위원장)',
    x: -3.65,
    z: -0.9 - 0.08,
    seated: true,
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
    x: -4.75,
    z: 0.4 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#451A03',
    dialogues: ['주님, 우리 자녀들과 다음세대에 믿음의 복을 내려주옵소서 🙏']
  },
  {
    id: 'left_m1',
    name: '강집사 (남성도)',
    x: -3.75,
    z: 1.7 - 0.08,
    seated: true,
    shirt: '#0284C7',
    pants: '#1E293B',
    hair: '#1C1917',
    dialogues: ['목사님 설교 말씀을 예배노트에 열심히 받아 적고 있습니다 📝']
  },

  // [B] 중앙 장의자(PEW_COLS 'C', x = 0.0): 남·여 성도, 권사님, 청년 다양하게 착석!
  {
    id: 'center_f1',
    name: '한권사 (여전도회)',
    x: -1.05,
    z: -2.2 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#A855F7',
    pants: '#E9D5FF',
    hair: '#5C3A21',
    dialogues: ['아멘! 오늘 찬양과 말씀이 꿀송이처럼 달고 은혜롭네요 🥰']
  },
  {
    id: 'center_m1',
    name: '윤안수집사 (남선교회)',
    x: 0.85,
    z: -2.2 - 0.08,
    seated: true,
    shirt: '#0D9488',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: ['할렐루야! 온 가족이 함께 본당에서 예배드리니 참 기쁩니다.']
  },
  {
    id: 'center_f2',
    name: '서자매 (청년부)',
    x: -0.85,
    z: -0.9 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#F43F5E',
    pants: '#FECDD3',
    hair: '#78350F',
    dialogues: ['전도사님 찬양 인도 따라 부르는데 눈물이 날 것 같아요 😭🎵']
  },
  {
    id: 'center_m2',
    name: '조형제 (청년부)',
    x: 1.15,
    z: 0.4 - 0.08,
    seated: true,
    shirt: '#22C55E',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: ['새가족 환영석 바로 옆자리라 새가족분들과 인사 나눴어요 😊']
  },
  {
    id: 'center_f3',
    name: '임집사 (여성도)',
    x: -0.95,
    z: 1.7 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#F59E0B',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: ['뒤편 감사/기도함에 넣은 가정의 기도제목이 꼭 응답되길 소망합니다 🙏']
  },
  {
    id: 'center_m3',
    name: '송성도 (남성도)',
    x: 0.95,
    z: 3.0 - 0.08,
    seated: true,
    shirt: '#3B82F6',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: ['아멘! 한 주간 세상에서 지친 마음이 말씀으로 새 힘을 얻습니다 💪']
  },

  // [C] 우측 장의자(PEW_COLS 'R', x = 4.25): 남·여 성도 다양하게 착석!
  {
    id: 'right_f1',
    name: '오권사',
    x: 3.45,
    z: -2.2 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#14B8A6',
    pants: '#CCFBF1',
    hair: '#451A03',
    dialogues: ['오른쪽 앞자리는 피아노 반주자랑 드러머 연주하는 모습까지 잘 보여서 참 좋아요 🎹🥁']
  },
  {
    id: 'right_m1',
    name: '신집사 (남성도)',
    x: 4.85,
    z: -0.9 - 0.08,
    seated: true,
    shirt: '#6366F1',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: ['창가로 따뜻한 햇살이 비치니 성전이 더욱 포근합니다 ☀️']
  },
  {
    id: 'right_f2',
    name: '유자매 (여성도)',
    x: 3.65,
    z: 0.4 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: ['아멘! 목사님 말씀 한 구절 한 구절이 제게 주시는 음성 같습니다.']
  },
  {
    id: 'right_m2',
    name: '황성도 (남성도)',
    x: 4.75,
    z: 1.7 - 0.08,
    seated: true,
    shirt: '#EAB308',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: ['할렐루야! 우리 좋은나무교회 공동체가 날마다 부흥하길 기도합니다.']
  },
  {
    id: 'right_f3',
    name: '배집사 (여성도)',
    x: 3.55,
    z: 3.0 - 0.08,
    seated: true,
    isSkirt: true,
    shirt: '#8B5CF6',
    pants: '#EDE9FE',
    hair: '#27272A',
    dialogues: ['예배 끝나고 5층 식당에서 성도님들과 맛있게 점심 애찬 나눠요 🍲']
  },

  // [D] 좌·우 복도(Aisle)를 따라 걸어 다니는 성도 2명!
  {
    id: 'walker_left_aisle',
    name: '안성도 (자리이동)',
    x: AISLE_X_LEFT,
    z: 0.5,
    patrolZ: [-1.8, 3.6],
    seated: false,
    isSkirt: false,
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#27272A',
    dialogues: [
      '예배당 뒤편 감사/기도함에 감사봉투 넣고 앞자리로 가는 길입니다 🙏',
      '집사님 샬롬! 좋은 아침입니다 😊'
    ]
  },
  {
    id: 'walker_right_aisle',
    name: '문권사 (안내·인사)',
    x: AISLE_X_RIGHT,
    z: 1.2,
    patrolZ: [-1.4, 3.8],
    seated: false,
    isSkirt: true,
    shirt: '#D8C3A5',
    pants: '#C8B294',
    hair: '#5C3A21',
    dialogues: [
      '어서 오세요~ 앞쪽 빈자리부터 차례대로 착석해 주세요 😊',
      '오늘 예배에 오신 성도님들을 주님의 이름으로 환영합니다!'
    ]
  },

  // [E] 예배당 맨 뒤편(z = 5.0 ~ 5.5)에서 성도들을 맞이하고 돌아다니는 후면 안내위원(Usher) 3명!
  {
    id: 'rear_usher_center',
    name: '홍권사 (후면안내위원)',
    x: 0.2,
    z: 5.15,
    patrolX: [-1.4, 2.0],
    seated: false,
    isSkirt: true,
    autoWave: true,
    shirt: '#E11D48',
    pants: '#FFE4E6',
    hair: '#451A03',
    dialogues: [
      '할렐루야! 좋은나무교회 3층 대예배당에 오신 것을 환영합니다 🌺',
      '입구 왼쪽 감사/기도함에서 감사와 기도제목 봉투를 작성해 넣으실 수 있어요!',
      '새가족분들은 중앙 새가족 환영석으로 안내해 드리겠습니다 😊'
    ]
  },
  {
    id: 'rear_usher_left',
    name: '구집사 (새가족안내위원)',
    x: -4.2,
    z: 5.25,
    rotY: Math.PI,
    seated: false,
    autoWave: true,
    shirt: '#1E3A8A',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '반갑습니다 성도님! 바로 옆 감사/기도함에 기도제목을 올려드려 보세요 🙏',
      '주일 주보 여기 있습니다 📖'
    ]
  },
  {
    id: 'rear_usher_right',
    name: '변집사 (헌금·안내위원)',
    x: 3.2,
    z: 5.25,
    rotY: Math.PI,
    seated: false,
    isSkirt: true,
    autoWave: true,
    shirt: '#0D9488',
    pants: '#CCFBF1',
    hair: '#5C3A21',
    dialogues: [
      '샬롬! 은혜로운 주일 예배 되시기를 축복합니다 🥰',
      '아기와 함께 오신 부모님들은 4층 온돌 유아실도 이용하실 수 있어요!'
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
    if (wallSide === 'south' && camera.position.z > 4.2) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -3.5) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 8.2) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -4.5) shouldFade = true;

    const targetOpacity = shouldFade ? minOpacity : 1.0;

    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
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
        ctx.roundRect(w / 2 + 24, h / 2 + 6, 114, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 22px sans-serif';
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
          <planeGeometry args={[0.78, 0.44]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 관절형 아바타 (목사님 설교 · 찬양팀 · 피아노반주 · 드럼연주 · 성도 · 안내위원)
// =====================================================================
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

  const patrolState = useRef({
    coord: patrolX ? position[0] : position[2],
    dir: 1,
    pauseTimer: 0
  });

  const bubbleTex = useMemo(() => {
    if (!speechBubbleText) return null;
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
      ctx.beginPath();
      ctx.roundRect(12, 10, w - 24, h - 34, 34);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h - 24);
      ctx.lineTo(w / 2 + 14, h - 24);
      ctx.lineTo(w / 2, h - 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speechBubbleText.slice(0, 28), w / 2, (h - 24) / 2 + 4);
    }, 720, 120);
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
      outerGroupRef.current.position.x = position[0] + Math.sin(t * 2.8) * 0.06;
    }

    const seatedNow = isSeated || isDrummer || isPianist;

    if (leftLegRef.current && rightLegRef.current) {
      if (seatedNow) {
        leftLegRef.current.rotation.x = -Math.PI / 2.15;
        rightLegRef.current.rotation.x = -Math.PI / 2.15;
        leftLegRef.current.position.set(-0.09, 0.21, 0.10);
        rightLegRef.current.position.set(0.09, 0.21, 0.10);
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.56;
        leftLegRef.current.rotation.x = sw;
        rightLegRef.current.rotation.x = -sw;
        leftLegRef.current.position.set(-0.09, 0.22, 0);
        rightLegRef.current.position.set(0.09, 0.22, 0);
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
        leftLegRef.current.position.set(-0.09, 0.22, 0);
        rightLegRef.current.position.set(0.09, 0.22, 0);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (isPastor) {
        rightArmRef.current.rotation.z = -1.9 + Math.sin(t * 3.2) * 0.25;
        rightArmRef.current.rotation.x = 0.35;
        leftArmRef.current.rotation.x = -0.35 + Math.cos(t * 2.4) * 0.12;
      } else if (isDrummer) {
        // 양손 드럼 스틱 역동적 타격 모션!
        leftArmRef.current.rotation.x = -1.05 + Math.sin(t * 15) * 0.42;
        rightArmRef.current.rotation.x = -1.05 + Math.cos(t * 15) * 0.42;
        leftArmRef.current.rotation.z = 0.15;
        rightArmRef.current.rotation.z = -0.15;
      } else if (isPianist) {
        // 피아노 건반 연주 모션!
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 8.5) * 0.16;
        rightArmRef.current.rotation.x = -0.82 + Math.cos(t * 8.5) * 0.16;
        leftArmRef.current.rotation.z = 0.18 + Math.sin(t * 3.2) * 0.1;
        rightArmRef.current.rotation.z = -0.18 - Math.cos(t * 3.2) * 0.1;
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
        leftArmRef.current.rotation.x = -0.38 + Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = -0.38 + Math.cos(t * 2.2) * 0.04;
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
      headGroupRef.current.rotation.x = Math.sin(t * (isDrummer || isPianist ? 5.5 : 2.8)) * 0.07;
      headGroupRef.current.rotation.y = Math.cos(t * 1.5) * 0.08;
    }
    if (rootRef.current) {
      const bounce = (walkingNow || isPraiseTeam) && !seatedNow
        ? Math.abs(Math.sin(t * (isPraiseTeam ? 5.2 : 9.5))) * 0.042
        : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (seatedNow ? 0.24 : 0) + bounce;
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
        <group ref={leftLegRef} position={[-0.09, 0.22, 0]}>
          <RoundedBox args={[0.12, 0.22, 0.13]} position={[0, -0.09, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={isSkirt ? skinColor : pantsColor} roughness={0.5} />
          </RoundedBox>
        </group>
        <group ref={rightLegRef} position={[0.09, 0.22, 0]}>
          <RoundedBox args={[0.12, 0.22, 0.13]} position={[0, -0.09, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={isSkirt ? skinColor : pantsColor} roughness={0.5} />
          </RoundedBox>
        </group>

        {isSkirt ? (
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.15, 0.25, 0.44, 24]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
        ) : (
          <RoundedBox args={[0.35, 0.36, 0.22]} position={[0, 0.38, 0]} radius={0.07} castShadow receiveShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
        )}

        <group ref={leftArmRef} position={[-0.22, 0.50, 0]}>
          <RoundedBox args={[0.10, 0.25, 0.11]} position={[0, -0.10, 0]} radius={0.045} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.22, 0.50, 0]}>
          <RoundedBox args={[0.10, 0.25, 0.11]} position={[0, -0.10, 0]} radius={0.045} castShadow>
            <meshStandardMaterial color={shirtColor} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
        </group>

        <group ref={headGroupRef} position={[0, 0.78, 0]}>
          <RoundedBox args={[0.42, 0.39, 0.39]} radius={0.12} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.46, 0.16, 0.43]} position={[0, 0.16, -0.01]} radius={0.07} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.55} />
          </RoundedBox>
          <RoundedBox args={[0.45, 0.30, 0.20]} position={[0, 0.03, -0.13]} radius={0.07} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.55} />
          </RoundedBox>

          {hasSunglasses ? (
            <group position={[0, 0.01, 0.20]}>
              <RoundedBox args={[0.13, 0.08, 0.02]} position={[-0.08, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
              <RoundedBox args={[0.13, 0.08, 0.02]} position={[0.08, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#18181B" roughness={0.2} />
              </RoundedBox>
            </group>
          ) : (
            <>
              <mesh position={[-0.085, 0.0, 0.198]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshBasicMaterial color="#18181B" />
              </mesh>
              <mesh position={[0.085, 0.0, 0.198]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshBasicMaterial color="#18181B" />
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

        {bubbleTex && (
          <Billboard position={[0, 1.44, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[2.3, 0.38]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 3층 대예배당 초정밀 3D 씬 (목사님 발판 + 후면 감사/기도함 + 피아노/드럼 연주자!)
// =====================================================================
function SanctuaryMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnPew,
  onOpenSermonVideo,
  onOpenPraiseVideo,
  onOpenOfferingModal,
  sermonTitle,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const stageWoodTex = useMemo(() => makeWoodGrainTexture('#E0AA6E', '#B87E42'), []);

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

  const standBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#D9F99D');
      grad.addColorStop(0.24, '#FFFFFF');
      grad.addColorStop(0.76, '#FFFFFF');
      grad.addColorStop(1, '#86EFAC');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#334155';
      ctx.font = '900 50px serif';
      ctx.textAlign = 'center';
      ctx.fillText('교 회', w / 2, h / 2 - 22);
      ctx.fillText('표어가', w / 2, h / 2 + 44);
    }, 256, 540);
  }, []);

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
    elders: makeRoomSignTexture('좌측 장로님석', '시무장로 · 성도 예배석', '#6366F1'),
    ushers: makeRoomSignTexture('후면 안내위원석', '새가족 영접 · 주보 배부', '#10B981')
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
      {/* 🙏 [핵심 수정 1] 예배당 뒤편(후면 입구 좌측 통로 뒤, `X: -3.15, Z: 5.55`)으로 이동한 `감사/기도함`! */}
      {/* ================================================================= */}
      <group
        position={[-3.15, 0, 5.55]}
        rotation={[0, Math.PI, 0]} // 앞쪽에서 들어오는 성도들과 정면 카메라 모두 잘 보이도록 배치
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenOfferingModal) onOpenOfferingModal();
        }}
      >
        {/* 바닥 레드벨벳 포인트 매트 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[1.65, 1.15]} />
          <meshStandardMaterial color="#7F1D1D" roughness={0.7} />
        </mesh>

        {/* 1) 좌측: 십자가 원목 감사/기도함 (투입구 슬롯 + 금장 십자가) */}
        <group position={[-0.38, 0, 0]}>
          <RoundedBox args={[0.52, 0.96, 0.48]} position={[0, 0.48, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.32} />
          </RoundedBox>
          <RoundedBox args={[0.58, 0.08, 0.54]} position={[0, 0.98, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#78350F" />
          </RoundedBox>
          <mesh position={[0, 1.025, 0]}>
            <boxGeometry args={[0.32, 0.01, 0.06]} />
            <meshBasicMaterial color="#090D16" />
          </mesh>
          {/* 앞·뒤 양면 금빛 십자가 */}
          {[-0.245, 0.245].map((cz, ci) => (
            <group key={ci} position={[0, 0, cz]}>
              <mesh position={[0, 0.56, 0]}>
                <boxGeometry args={[0.04, 0.28, 0.015]} />
                <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.61, 0]}>
                <boxGeometry args={[0.18, 0.04, 0.015]} />
                <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 우측: 감사/기도봉투 비치 테이블 & 색상별 봉투 꽂이 */}
        <group position={[0.36, 0, 0]}>
          <RoundedBox args={[0.68, 0.78, 0.46]} position={[0, 0.39, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          <RoundedBox args={[0.56, 0.16, 0.28]} position={[0, 0.84, 0]} radius={0.015} castShadow>
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
          <Billboard position={[0, 1.78, 0]}>
            <mesh>
              <planeGeometry args={[1.22, 0.52]} />
              <meshBasicMaterial map={signs.offering} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🎤 2. 정면(북쪽 -Z) 3단 우드 강단 & 목사님 전용 2단 발판 & 악기석 */}
      {/* ================================================================= */}
      <group position={[-0.6, 0, -5.2]}>
        <RoundedBox args={[10.8, 0.16, 3.5]} position={[0.4, 0.08, 0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[10.4, 0.16, 3.2]} position={[0.4, 0.24, 0.0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={stageWoodTex} roughness={0.36} />
        </RoundedBox>
        <RoundedBox args={[10.0, 0.16, 2.9]} position={[0.4, 0.40, -0.15]} radius={0.025} castShadow receiveShadow>
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

          <RoundedBox args={[1.55, 2.25, 0.08]} position={[6.1, 1.12, -1.58]} radius={0.01} castShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.45} />
          </RoundedBox>
        </SmartCutawayWall>

        {[-2.85, 2.45].map((bx, bIdx) => (
          <group key={`banner_${bIdx}`} position={[bx, 1.48, -0.95]}>
            <RoundedBox args={[0.78, 2.05, 0.04]} radius={0.015} castShadow>
              <meshStandardMaterial color="#FFFFFF" />
            </RoundedBox>
            <mesh position={[0, 0, 0.024]}>
              <planeGeometry args={[0.74, 1.98]} />
              <meshBasicMaterial map={standBannerTex} />
            </mesh>
            <RoundedBox args={[0.52, 0.05, 0.36]} position={[0, -1.02, 0]} radius={0.01}>
              <meshStandardMaterial color="#475569" />
            </RoundedBox>
          </group>
        ))}

        {/* 🌟 [핵심 수정 2] 중앙 십자가 원목 강대상 + 뒤편 담임목사님 전용 2단 원목 발판(Pulpit Riser)! */}
        <group
          position={[-0.2, 0.48, 0.05]}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSermonVideo) onOpenSermonVideo();
          }}
        >
          {/* 목사님 전용 2단 원목 발판 (강대상 바로 뒤 z = -0.46 위치, 총 높이 +0.38m) */}
          <RoundedBox args={[1.18, 0.20, 0.72]} position={[0, 0.10, -0.46]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.96, 0.18, 0.56]} position={[0, 0.29, -0.46]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#991B1B" roughness={0.75} />
          </RoundedBox>

          {/* 강대상 본체 (높이를 살짝 다듬어 목사님 상반신이 완벽히 드러나도록 조정) */}
          <RoundedBox args={[1.20, 0.12, 0.64]} position={[0, 0.06, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <RoundedBox args={[1.04, 0.72, 0.52]} position={[0, 0.44, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          <RoundedBox args={[1.18, 0.09, 0.62]} position={[0, 0.84, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} />
          </RoundedBox>
          <mesh position={[0, 0.48, 0.27]}>
            <boxGeometry args={[0.05, 0.34, 0.02]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
          <mesh position={[0, 0.54, 0.27]}>
            <boxGeometry args={[0.22, 0.05, 0.02]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>

          {[-1.05, 1.05].map((fx, fIdx) => (
            <group key={`flw_${fIdx}`} position={[fx, 0, 0.06]}>
              <RoundedBox args={[0.48, 0.46, 0.48]} position={[0, 0.23, 0]} radius={0.02} castShadow>
                <meshStandardMaterial map={oakWoodTex} />
              </RoundedBox>
              <mesh position={[0, 0.58, 0]} castShadow>
                <sphereGeometry args={[0.34, 16, 16]} />
                <meshStandardMaterial color="#15803D" roughness={0.7} />
              </mesh>
              {[
                [0, 0.78, 0, '#FFFFFF', 0.12],
                [-0.15, 0.70, 0.15, '#F472B6', 0.11],
                [0.15, 0.70, 0.15, '#FB7185', 0.11],
                [-0.16, 0.68, -0.14, '#FBCFE8', 0.11],
                [0.16, 0.68, -0.14, '#FEF08A', 0.10]
              ].map(([bx, by, bz, bcol, brad], bi) => (
                <mesh key={bi} position={[bx, by, bz]} castShadow>
                  <sphereGeometry args={[brad, 10, 10]} />
                  <meshStandardMaterial color={bcol} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* 우측 그랜드 피아노 & 드럼부스 & 건반 */}
        <group position={[5.85, 0.0, 1.35]} rotation={[0, -0.28, 0]}>
          <RoundedBox args={[1.45, 0.30, 1.75]} position={[0, 0.68, 0]} radius={0.06} castShadow receiveShadow>
            <meshStandardMaterial color="#18181B" roughness={0.15} metalness={0.25} />
          </RoundedBox>
          <RoundedBox args={[1.32, 0.06, 0.24]} position={[0, 0.64, 0.88]} radius={0.01}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {[[-0.58, -0.68], [0.58, -0.68], [0, 0.68]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.34, lz]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.68, 12]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          ))}
          <RoundedBox args={[0.76, 0.42, 0.36]} position={[0, 0.21, 1.28]} radius={0.03} castShadow>
            <meshStandardMaterial color="#27272A" />
          </RoundedBox>
        </group>

        <group position={[3.25, 0.48, -0.15]}>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((ang, ai) => (
            <mesh
              key={ai}
              position={[Math.sin(ang * 1.5) * 0.96, 0.75, Math.cos(ang * 1.5) * 0.96 - 0.1]}
              rotation={[0, ang * 1.5, 0]}
            >
              <boxGeometry args={[0.62, 1.48, 0.03]} />
              <meshStandardMaterial color="#E0F2FE" transparent opacity={0.32} roughness={0.08} />
            </mesh>
          ))}
          <mesh position={[0, 0.28, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.38, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* 드럼 의자 스툴 */}
          <mesh position={[0, 0.22, -0.45]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.42, 16]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
          {[[-0.35, 0.82, -0.05], [0.35, 0.86, -0.05], [0.0, 0.92, -0.25]].map(([cx, cy, cz], ci) => (
            <mesh key={ci} position={[cx, cy, cz]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.015, 20]} />
              <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================================================================= */}
      {/* ✝️ 3. 발판 위에 서 계신 담임목사님 + 찬양팀 5인 + 피아노 반주자 + 드러머 */}
      {/* ================================================================= */}
      <SmoothChibiAvatar
        position={[PASTOR_NPC.x, PASTOR_NPC.y, PASTOR_NPC.z]}
        rotationY={PASTOR_NPC.rotY}
        isPastor={true}
        shirtColor={PASTOR_NPC.shirt}
        pantsColor={PASTOR_NPC.pants}
        hairColor={PASTOR_NPC.hair}
        speechBubbleText={
          activeNpcChatIdx % 3 === 0
            ? `${PASTOR_NPC.name}: ${PASTOR_NPC.dialogues[(activeNpcChatIdx / 3) % PASTOR_NPC.dialogues.length | 0]}`
            : null
        }
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenSermonVideo) onOpenSermonVideo();
        }}
      />

      {PRAISE_TEAM_5_NPCS.map((pt, pIdx) => {
        const isTalking = (activeNpcChatIdx + pIdx) % 5 === 0;
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
              isPraiseTeam={true}
              isSkirt={pt.isSkirt}
              shirtColor={pt.shirt}
              pantsColor={pt.pants}
              hairColor={pt.hair}
              speechBubbleText={msg}
              seedOffset={pIdx * 1.3}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPraiseVideo) onOpenPraiseVideo();
              }}
            />
          </group>
        );
      })}

      {/* 🎹🥁 그랜드 피아노 반주자 & 아크릴 드럼 부스 드러머 렌더링 */}
      {BAND_INSTRUMENT_NPCS.map((instNpc, bIdx) => {
        const isTalking = (activeNpcChatIdx + bIdx + 2) % 4 === 0;
        const msg = isTalking ? `${instNpc.name}: ${instNpc.dialogues[activeNpcChatIdx % instNpc.dialogues.length]}` : null;

        return (
          <SmoothChibiAvatar
            key={instNpc.id}
            position={[instNpc.x, instNpc.y, instNpc.z]}
            rotationY={instNpc.rotY}
            isPianist={Boolean(instNpc.isPianist)}
            isDrummer={Boolean(instNpc.isDrummer)}
            isSkirt={Boolean(instNpc.isSkirt)}
            shirtColor={instNpc.shirt}
            pantsColor={instNpc.pants}
            hairColor={instNpc.hair}
            speechBubbleText={msg}
            seedOffset={bIdx * 2.1}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenPraiseVideo) onOpenPraiseVideo();
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
        </>
      )}

      {/* ================================================================= */}
      {/* 💡 5. 천장 2단 동심원 간접조명 우물천장 + 4단 스피커 */}
      {/* ================================================================= */}
      <group position={[0, 5.45, 0]}>
        <mesh position={[0, 0.15, -1.0]}>
          <boxGeometry args={[17.0, 0.2, 16.5]} />
          <meshStandardMaterial color="#EFE3D3" roughness={0.65} />
        </mesh>

        <group position={[-0.8, -0.08, -3.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.35, 0.26, 24, 72]} />
            <meshStandardMaterial color="#F7EFE4" roughness={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <torusGeometry args={[3.06, 0.10, 16, 72]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.9} />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.05, 0.22, 24, 72]} />
            <meshStandardMaterial color="#F7EFE4" roughness={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <torusGeometry args={[1.80, 0.09, 16, 72]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.9} />
          </mesh>
        </group>

        {[-3.85, 1.85].map((sx, idx) => (
          <group key={`line_spk_${idx}`} position={[sx, -1.05, -3.4]}>
            <mesh position={[0, 0.65, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 1.1, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            {[0.38, 0.12, -0.14, -0.40].map((sy, sIdx) => (
              <RoundedBox
                key={sIdx}
                args={[0.72, 0.24, 0.52]}
                position={[0, sy, sIdx * 0.05]}
                rotation={[0.14 + sIdx * 0.08, 0, 0]}
                radius={0.025}
                castShadow
              >
                <meshStandardMaterial color="#18181B" roughness={0.28} />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 🏢 6. 우측 채광창 4개 + 강대상 반대편(남쪽 후면) 4층 유아실 통유리창 & 주보 데스크 */}
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

      {/* 예배당 뒤편 우측 주보 배부 데스크 */}
      <group position={[3.2, 0, 5.65]}>
        <RoundedBox args={[1.15, 0.88, 0.52]} position={[0, 0.44, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={oakWoodTex} />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.06, 0.24]} position={[0, 0.91, 0]} radius={0.005}>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>
      </group>

      <SmartCutawayWall wallSide="south" minOpacity={0.14}>
        <RoundedBox args={[16.8, 5.4, 0.26]} position={[0, 2.7, 7.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6CEB5" roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[14.6, 0.42, 2.2]} position={[0, 2.75, 6.0]} radius={0.025} receiveShadow>
          <meshStandardMaterial color="#EFE3D3" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 3.24, 4.92]}>
          <boxGeometry args={[14.4, 0.62, 0.04]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.36} roughness={0.1} />
        </mesh>
        <RoundedBox args={[14.4, 0.06, 0.07]} position={[0, 3.56, 4.92]} radius={0.01}>
          <meshStandardMaterial color="#785A46" roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[1.8, 0.95, 0.10]} position={[0, 2.85, 4.84]} radius={0.02}>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>

        <group position={[0, 4.15, 7.02]}>
          <RoundedBox args={[10.6, 1.95, 0.14]} radius={0.01}>
            <meshStandardMaterial color="#27272A" />
          </RoundedBox>
          <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[10.2, 1.78]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.18} />
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

      {showRoomSigns && (
        <>
          <Billboard position={[-4.25, 1.55, -2.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.50]} />
              <meshBasicMaterial map={signs.elders} transparent />
            </mesh>
          </Billboard>
          <Billboard position={[0.4, 1.65, 5.2]}>
            <mesh>
              <planeGeometry args={[1.15, 0.50]} />
              <meshBasicMaterial map={signs.ushers} transparent />
            </mesh>
          </Billboard>
        </>
      )}

      {/* 8. 좌측 장로님들 + 중앙/우측 남녀 성도들 + 복도 이동자 + 후면 안내위원단 렌더링 */}
      {CONGREGATION_NPCS.map((npc, idx) => {
        const isSpeakingNow =
          idx === activeNpcChatIdx % CONGREGATION_NPCS.length ||
          idx === (activeNpcChatIdx + 5) % CONGREGATION_NPCS.length ||
          idx === (activeNpcChatIdx + 11) % CONGREGATION_NPCS.length;
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
            isSeated={npc.seated}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={currentMsg}
            seedOffset={idx * 1.3}
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
  const [activeZone, setActiveZone] = useState(ZONES_3F[3]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

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

  // 🙏 감사/기도함 모달 상태
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
    }, 3400);
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
    alert('🙏 작성하신 감사와 기도제목이 예배당 뒤편 감사/기도함에 등록되어 영성 노트에 자동 연동되었습니다!');
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

    // 강단 & 찬양팀 단상
    ctx.fillStyle = '#D99B5E';
    ctx.fillRect(14, 6, w - 28, 20);

    // 3열 장의자 블록
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(12, 34, 24, 38);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(42, 34, 30, 38);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(78, 34, 24, 38);

    // 뒤편 감사/기도함 & 안내위원석
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(22, 78, 16, 10);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(44, 80, 50, 8);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 7.0) / 14.0) * w;
    const my = ((cz + 6.0) / 12.5) * h;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 찬양/설교/감사·기도함 바로가기 */}
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

        <ambientLight intensity={1.3} color="#FFF8EE" />
        <hemisphereLight args={['#FFF5E4', '#8C7A6B', 1.15]} />
        <directionalLight
          position={[-6, 9, 8]}
          intensity={1.45}
          color="#FFF3DC"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[-0.8, 4.6, -3.5]} intensity={2.8} distance={18} color="#FDE047" />
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
      {/* 🙏 6. 예배당 뒤편 [감사/기도함] 클릭 시 열리는 모달 */}
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

      {/* 7. 설교 / 찬양 유튜브 링크 변경 모달 */}
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

      {/* 8. 구역 상세 안내 & 전 층(1F·3F·4F·5F·6F) 이동 모달 */}
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
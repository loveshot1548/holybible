// src/metaverse/MediaParents4F.js
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
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '3F 대예배당 담임목사님 설교 실시간 중계' };
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
            title: parsed[d]?.sermonTitle || '주일 대예배 설교 실시간 중계'
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
        title: localStorage.getItem('praise_active_video_title') || '좋은나무 찬양단 경배와 찬양 중계'
      };
    }
  } catch (_) {}
  return {
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
    title: '좋은나무 찬양단 경배와 찬양 라이브'
  };
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (온돌 마루 · 유리창 · 거울 · 타일)
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

    // 온돌 마루 쪽마루 줄눈 패턴
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

    // 은은한 나뭇결
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

function makeClearGlassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
    grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.22)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 대각선 크리스탈 유리 하이라이트
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

function makeTileGridTexture(bgHex = '#F8FAFC', lineHex = '#CBD5E1', gridCount = 8) {
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
// 📍 4층 영유아 예배실(자모실) 7대 인터랙션 존 정의
// =====================================================================
const ZONES_4F = [
  {
    id: 'zone_4f_elev',
    code: '01',
    subCode: '엘베',
    name: '4F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F·3F·5F·6F 이동)',
    pos: [-0.2, 0, 4.3],
    isElevator: true,
    badge: '01 4F 엘리베이터',
    title: '🛗 4층 영유아 예배실(자모실) 엘리베이터 홀',
    desc: '유모차를 끌고 편리하게 이동할 수 있는 4층 엘리베이터 홀입니다. 1층 로비, 3층 대예배당, 5층 친교실, 6층 교육관으로 즉시 이동합니다.'
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
    name: '좌측 온돌 마루 예배실 & 아기 침대·수유 케어존',
    prompt: '03 좌측 온돌 마루 방석에 앉아 예배드리기',
    pos: [-2.6, 0, 0.2],
    seatTarget: { x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' },
    isSeatZone: true,
    badge: '03 좌측 온돌 마루',
    title: '👶 좌측 온돌 마루 예배실 & 영아 수유·낮잠 케어존',
    desc: '따뜻한 온돌 마루 위에 원목 좌식 성경 테이블과 등받이 방석 의자, 아기 침대(모빌 포함), 수유 소파, 분유 포트·젖병 소독기 수납장이 완비되어 있습니다.'
  },
  {
    id: 'zone_4f_right_ondol',
    code: '04',
    subCode: '우측마루',
    name: '우측 온돌 마루 예배실 & 유아 플레이 매트존',
    prompt: '04 우측 온돌 마루 방석에 앉아 예배드리기',
    pos: [2.2, 0, 0.2],
    seatTarget: { x: 1.75, z: 0.45, rotY: Math.PI, rowLabel: '4F 우측 온돌 마루 예배석' },
    isSeatZone: true,
    badge: '04 우측 온돌 마루',
    title: '🧸 우측 온돌 마루 예배실 & 유아 소프트 플레이존',
    desc: '유리 파티션 우측에 분리된 온돌 마루 예배 공간입니다. 꽃잎 놀이매트와 흔들목마, 그림책 교구장이 있어 유아들과 함께 편안히 예배드릴 수 있습니다.'
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
    subCode: '파티션문',
    name: '중앙 방음 유리 파티션 & 연결 도어',
    prompt: '06 좌·우 마루 연결 파티션 안내',
    pos: [-0.15, 0, 1.1],
    badge: '06 중앙 유리 파티션',
    title: '🚪 좌·우 온돌 마루 방음 유리 파티션 & 원목 도어',
    desc: '신생아 수유/수면 구역(좌측)과 유아 돌봄 구역(우측)을 쾌적하게 분리해 주는 중앙 방음 유리 파티션입니다.'
  },
  {
    id: 'zone_4f_restroom',
    code: '07',
    subCode: '기저귀·화장실',
    name: '우측 하단 기저귀 교환대 & 전용 화장실',
    prompt: '07 기저귀 교환실 및 화장실 이동',
    pos: [3.2, 0, 3.5],
    roomTarget: [3.5, 3.5],
    badge: '07 화장실·기저귀교환',
    title: '🍼 유아 전용 기저귀 교환대 & 파우더룸 화장실 (우측 하단)',
    desc: '안전벨트 매트가 장착된 기저귀 교환대와 물티슈·로션 선반, 밝은 거울 세면대, 도자기 양변기 부스가 갖춰진 자모실 전용 위생 공간입니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체 · 중앙 파티션 · 가구 실시간 물리 충돌(AABB) & 문 통과 네비게이션
// =====================================================================
const SOLID_WALL_BOXES_4F = [
  // 1) 중앙 세로 유리 파티션 벽 (X = -0.15, 남쪽 원목 문 구간 Z: 0.75 ~ 1.95 제외하고 차단)
  { minX: -0.35, maxX: 0.05, minZ: -4.2, maxZ: 0.70 },
  { minX: -0.35, maxX: 0.05, minZ: 1.98, maxZ: 2.35 },
  // 2) 좌측 아기 침대 및 수유 수납장 충돌 박스
  { minX: -6.3, maxX: -4.6, minZ: -1.8, maxZ: 2.0 },
  // 3) 좌측 하단 계단실 경계벽 (입구 X: -3.2 ~ -2.1 구간 제외)
  { minX: -6.5, maxX: -3.25, minZ: 2.15, maxZ: 2.55 },
  // 4) 우측 하단 화장실 경계벽 (서쪽 벽 X = 2.15, 문 구간 Z: 3.0 ~ 4.0 제외)
  { minX: 2.15, maxX: 6.5, minZ: 2.05, maxZ: 2.45 },
  { minX: 1.95, maxX: 2.35, minZ: 2.1, maxZ: 2.95 },
  { minX: 1.95, maxX: 2.35, minZ: 4.05, maxZ: 6.0 },
  // 5) 하단 중앙 엘리베이터 타워
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

  // 우측 하단 화장실(X > 2.15, Z > 2.25) 출입 시 문(X: 2.15, Z: 3.5) 경유
  const startInRestroom = sx > 2.15 && sz > 2.25;
  const endInRestroom = ex > 2.15 && ez > 2.25;

  if (startInRestroom && !endInRestroom) {
    waypoints.push([2.7, 3.5]);
    waypoints.push([1.4, 3.5]);
  }

  // 좌측 마루(X < -0.15)와 우측 마루(X > -0.15) 사이 이동 시 중앙 파티션 문(X: -0.15, Z: 1.45) 경유
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
// 👥 4층 자모실 엄마·아빠 성도 & 아기들 & 안내 교사 NPC (남녀 헤어스타일 & 1:1 대화 연동)
// =====================================================================
const NPCS_4F = [
  {
    id: 'mom_left_1',
    name: '김집사 (아기엄마)',
    role: '영아부 자모실 성도',
    x: -3.55,
    y: 0.04,
    z: -0.45,
    rotY: Math.PI, // 북쪽 통유리창과 중계 TV를 바라보며 착석!
    seated: true,
    gender: 'female',
    hairStyle: 'long_wave',
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FCE7F3',
    hair: '#5C3A21',
    dialogues: [
      '통유리창 너머로 3층 본당 강대상이랑 우물천장이 한눈에 내려다보여서 현장감이 최고예요 😊',
      '온돌 마루가 따뜻하고 아기 침대랑 수유 시설까지 다 갖춰져 있어서 너무 편안합니다!'
    ]
  },
  {
    id: 'dad_left_1',
    name: '이성도 (아기아빠)',
    role: '새가족 젊은부부 성도',
    x: -2.25,
    y: 0.04,
    z: -1.45,
    rotY: Math.PI,
    seated: true,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '아기가 울어도 방음 통유리창 덕분에 마음 편히 코너 중계 TV로 말씀에 집중할 수 있네요 🙏',
      '좌식 원목 테이블 위에 성경책을 펴놓고 아내와 함께 은혜받고 있습니다!'
    ]
  },
  {
    id: 'mom_right_1',
    name: '박자매 (유아엄마)',
    role: '유아부 자모실 성도',
    x: 1.75,
    y: 0.04,
    z: -1.45,
    rotY: Math.PI,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#FACC15',
    pants: '#FEF08A',
    hair: '#78350F',
    dialogues: [
      '우측 마루는 놀이매트랑 흔들목마가 있어서 아이가 놀면서 예배드리기 딱 좋아요 🧸',
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
      '왼쪽 마루에는 아기 침대와 수유실이 있고, 오른쪽 아래에는 기저귀 교환대가 준비되어 있어요!'
    ]
  },
  // 👶 귀여운 아기 캐릭터 2명 (스케일 0.62 축소!)
  {
    id: 'baby_left',
    name: '하은이 (영아)',
    role: '예수님의 사랑받는 아기',
    x: -3.05,
    y: 0.04,
    z: -0.35,
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
      '까르르~ 엄마 아빠랑 따뜻한 온돌방에서 찬양 들으니까 너무 좋아요 🍼✨'
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
      '흔들목마도 타고 그림책도 보면서 예수님 사랑 배워요 🧸🎵'
    ]
  }
];

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
// 🚶‍♀️ 3층 본당급 유선형(Sphere/Capsule) 아바타 & 남녀 헤어스타일 & 정방향 좌식 착석
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

    if (patrolZ && outerGroupRef.current) {
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
        // 무릎을 꿇지 않고 앞쪽(+Z)으로 다리를 가지런히 뻗어 방석 위에 앉도록 음수 회전 적용!
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.085, 0.22, 0.10);
        rightLegRef.current.position.set(0.085, 0.22, 0.10);
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
      if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
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
      const bounce = walkingNow && !isSeated ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.008;
      // 온돌 좌식 방석(높이 0.08m) 위에 엉덩이가 자연스럽게 안착하도록 설정
      rootRef.current.position.y = (isSeated ? -0.05 : 0) + bounce;
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
              <planeGeometry args={[1.45, 0.32]} />
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

// =====================================================================
// 🪑 초디테일 가구: 온돌 좌식 성경 테이블 & 등받이 좌식 의자 · 아기 침대 · 흔들목마 · 양변기
// =====================================================================
function LowOndolWorshipSet({ position, cushionColor = '#F472B6', oakTex, isSelected, onClick }) {
  return (
    <group position={position} onClick={onClick}>
      {/* 1) 앞쪽(-Z): 원목 좌식 성경 테이블(앉은뱅이 책상) + 4개 다리 + 펼쳐진 성경책과 찬송가 */}
      <group position={[0, 0, -0.44]}>
        <RoundedBox args={[0.88, 0.045, 0.42]} position={[0, 0.25, 0]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial map={oakTex} roughness={0.32} />
        </RoundedBox>
        {[[-0.36, -0.15], [0.36, -0.15], [-0.36, 0.15], [0.36, 0.15]].map(([lx, lz], i) => (
          <RoundedBox key={i} args={[0.045, 0.24, 0.045]} position={[lx, 0.12, lz]} radius={0.01} castShadow>
            <meshStandardMaterial map={oakTex} roughness={0.38} />
          </RoundedBox>
        ))}
        {/* 펼쳐진 하얀 성경책 & 빨간 책갈피 끈 & 아기 젖병 */}
        <RoundedBox args={[0.28, 0.02, 0.20]} position={[-0.12, 0.28, 0]} radius={0.005} castShadow>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>
        <RoundedBox args={[0.02, 0.022, 0.22]} position={[-0.12, 0.282, 0]} radius={0.002}>
          <meshBasicMaterial color="#EF4444" />
        </RoundedBox>
        <mesh position={[0.24, 0.31, 0.04]} castShadow>
          <cylinderGeometry args={[0.028, 0.032, 0.10, 12]} />
          <meshStandardMaterial color="#FEF08A" />
        </mesh>
      </group>

      {/* 2) 뒤쪽(+Z): 폭신한 퀼팅 좌식 방석 & 등받이 좌식 의자(Zaisu) */}
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
        {/* 좌식 등받이 시트 */}
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
      {/* 침대 하부 프레임 & 폭신한 민트 매트리스 & 베개 & 이불 */}
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

      {/* 머리맡/발치 원목 헤드보드 */}
      {[-0.80, 0.80].map((cz, ci) => (
        <RoundedBox key={ci} args={[1.15, 0.78, 0.06]} position={[0, 0.45, cz]} radius={0.02} castShadow>
          <meshStandardMaterial map={oakTex} roughness={0.35} />
        </RoundedBox>
      ))}

      {/* 좌·우 안전 원목 상단 바 & 촘촘한 세로 원목 창살 7개씩 */}
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

      {/* 빙글빙글 도는 아기 침대 모빌 (별·구름·달 장식) */}
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

// =====================================================================
// 🏛️ 4층 영유아 예배실(자모실) 전체 디오라마 씬
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
  showRoomSigns
}) {
  const ondolTex = useMemo(() => makeOndolWoodTexture('#F4E2C6', '#D9BA8C'), []);
  const oakTex = useMemo(() => makeOakWoodTexture('#D49552', '#9C5E26'), []);
  const glassTex = useMemo(() => makeClearGlassTexture(), []);
  const mirrorTex = useMemo(() => makeBrightMirrorTexture(), []);
  const tileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#CBD5E1', 10), []);

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
    leftOndol: makeRoomSignTexture('좌측 온돌 마루', '영아 예배석 · 아기침대 · 수유존', '#EC4899'),
    rightOndol: makeRoomSignTexture('우측 온돌 마루', '유아 예배석 · 소프트 놀이존', '#F59E0B'),
    partition: makeRoomSignTexture('중앙 유리 파티션', '좌·우 마루 방음 분리 도어', '#10B981'),
    restroom: makeRoomSignTexture('화장실 · 기저귀교환 🍼', '유아 세면대 · 기저귀 케어룸', '#6366F1'),
    stairs: makeRoomSignTexture('4F 계단실', '3F 대예배당 직결 계단', '#64748B'),
    elevator: makeRoomSignTexture('4F 엘리베이터', '1F · 3F · 5F · 6F 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 4층 전체 베이스 바닥 & 남쪽 복도 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>

      {/* 좌·우 따뜻한 온돌 마루 바닥 데크 (높이 +0.04m) */}
      <RoundedBox args={[12.8, 0.08, 6.2]} position={[0, 0.04, -0.9]} radius={0.02} receiveShadow>
        <meshStandardMaterial map={ondolTex} roughness={0.38} />
      </RoundedBox>
      {/* 마루 앞단 원목 디딤턱 & 아기 신발 정리 매트 */}
      <RoundedBox args={[12.8, 0.09, 0.18]} position={[0, 0.045, 2.2]} radius={0.01} castShadow>
        <meshStandardMaterial map={oakTex} />
      </RoundedBox>

      {/* ================================================================= */}
      {/* 🪟 [핵심 고도화 1] 북쪽 전면 방음 통유리창 & 창문 너머로 내려다보이는 '3층 본당 대예배당' 입체 조망 뷰! */}
      {/* ================================================================= */}
      <group position={[0, 0, -4.05]}>
        {/* 🌟 통유리창 너머 아래쪽(Y: -1.8m ~ +2.2m, Z: -2.2m)에 펼쳐진 3F 대예배당 강단 & 우물천장 미니어처 뷰박스! */}
        <group position={[0, 0, -1.65]}>
          {/* 3층 본당 정면 우드 슬랫 배경벽 */}
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
          {/* 3층 본당 대형 LED 설교 스크린 & 십자가 강대상 */}
          <RoundedBox args={[3.8, 1.75, 0.08]} position={[0, 1.15, -0.88]} radius={0.02}>
            <meshBasicMaterial map={liveTvTex} />
          </RoundedBox>
          <RoundedBox args={[8.4, 0.25, 1.4]} position={[0, -0.95, -0.3]} radius={0.02}>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          <RoundedBox args={[0.95, 0.75, 0.5]} position={[0, -0.45, -0.2]} radius={0.02}>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {/* 3층 본당 2단 타원형 우물천장 간접조명 링 */}
          <mesh position={[0, 2.55, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.6, 0.12, 16, 48]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0, 2.58, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.09, 16, 48]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={1.8} />
          </mesh>
        </group>

        {/* 4층 전면 통유리창 하단 원목 선반 & 성경책/화분 장식 */}
        <RoundedBox args={[12.8, 0.58, 0.36]} position={[0, 0.32, 0.12]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={oakTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[12.9, 0.06, 0.44]} position={[0, 0.62, 0.12]} radius={0.015} castShadow>
          <meshStandardMaterial color="#9C5E26" />
        </RoundedBox>

        {/* 다크 차콜 알루미늄 통유리 창틀 기둥 5개 & 크리스탈 투명 유리창 */}
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

        {/* 📺 좌측 마루 & 우측 마루 코너에 각각 설치된 65인치 중계 벽걸이 TV 2대! */}
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
      {/* 🚪 [구역 2: 중앙 방음 유리 파티션 & 원목 출입문] (X = -0.15) */}
      {/* ================================================================= */}
      <group position={[-0.15, 0.08, 0]}>
        {/* 파티션 하단 화이트 웨인스코팅 벽 & 상단 투명 방음 유리창 */}
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

        {/* 파티션 남쪽 연결 원목 도어 (살짝 열려 있어 좌·우 마루 자유 이동!) */}
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
      {/* 👶 [구역 3: 좌측 온돌 마루] (좌식 성경 테이블 6세트 + 아기 침대 + 수유 소파 + 젖병소독기 수납장!) */}
      {/* ================================================================= */}
      <group position={[0, 0.08, 0]}>
        {/* 좌측 마루 2열 x 3줄 좌식 성경 테이블 & 등받이 방석 의자 */}
        {[-1.55, -0.55, 0.45].map((rz, rIdx) =>
          [-3.55, -2.25].map((cx, cIdx) => {
            const colors = ['#F472B6', '#38BDF8', '#4ADE80', '#FACC15', '#A78BFA', '#FB923C'];
            const cCol = colors[(rIdx * 2 + cIdx) % colors.length];
            const isSel = seatedInfo && Math.hypot(seatedInfo.x - cx, seatedInfo.z - rz) < 0.3;
            return (
              <LowOndolWorshipSet
                key={`left_mat_${rIdx}_${cIdx}`}
                position={[cx, 0, rz]}
                cushionColor={cCol}
                oakTex={oakTex}
                isSelected={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnMat({ x: cx, z: rz, rotY: Math.PI, rowLabel: `4F 좌측 온돌마루 ${rIdx + 1}열` });
                }}
              />
            );
          })
        )}

        {/* 좌측 하단 코너: 원목 아기 침대(모빌 회전) & 수유 쿠션 소파 & 분유포트·젖병소독기 수납장 */}
        <DetailedBabyCrib position={[-5.35, 0, 0.95]} oakTex={oakTex} />

        {/* 서쪽 벽면 수유용 젖병소독기·분유포트·기저귀 원목 선반장 */}
        <group position={[-5.65, 0, -1.15]}>
          <RoundedBox args={[0.58, 0.82, 1.55]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.62, 0.06, 1.62]} position={[0, 0.84, 0]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakTex} />
          </RoundedBox>
          {/* 민트색 UV 젖병소독기 & 분유 포트 */}
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
      {/* 🧸 [구역 4: 우측 온돌 마루] (좌식 성경 테이블 6세트 + 꽃잎 놀이매트 + 흔들목마 + 그림책장!) */}
      {/* ================================================================= */}
      <group position={[0, 0.08, 0]}>
        {[-1.55, -0.55, 0.45].map((rz, rIdx) =>
          [1.75, 3.05].map((cx, cIdx) => {
            const colors = ['#FACC15', '#F472B6', '#34D399', '#38BDF8', '#FB923C', '#A78BFA'];
            const cCol = colors[(rIdx * 2 + cIdx) % colors.length];
            const isSel = seatedInfo && Math.hypot(seatedInfo.x - cx, seatedInfo.z - rz) < 0.3;
            return (
              <LowOndolWorshipSet
                key={`right_mat_${rIdx}_${cIdx}`}
                position={[cx, 0, rz]}
                cushionColor={cCol}
                oakTex={oakTex}
                isSelected={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  onSitOnMat({ x: cx, z: rz, rotY: Math.PI, rowLabel: `4F 우측 온돌마루 ${rIdx + 1}열` });
                }}
              />
            );
          })
        )}

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
          {/* 귀여운 파스텔 흔들목마 */}
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
      {/* 🍼 [구역 5: 우측 하단 기저귀 교환대 & 호텔급 화장실] (거울·세면대·수전·도어부스·양변기!) */}
      {/* ================================================================= */}
      <group position={[4.15, 0, 3.85]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.9, 3.2]} />
          <meshStandardMaterial map={tileTex} roughness={0.28} />
        </mesh>

        {/* 1) 북쪽 벽면: 아기 기저귀 교환대(폭신한 안전 가드 매트 + 물티슈·로션) & 밝은 거울 세면대 */}
        <group position={[-0.45, 0, -1.22]}>
          {/* 기저귀 교환 스테이션 */}
          <RoundedBox args={[0.92, 0.76, 0.58]} position={[-0.55, 0.38, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FEF9C3" />
          </RoundedBox>
          <RoundedBox args={[0.84, 0.08, 0.52]} position={[-0.55, 0.80, 0]} radius={0.03} castShadow>
            <meshStandardMaterial color="#FBCFE8" />
          </RoundedBox>
          {/* 물티슈 팩 & 베이비 로션 보틀 */}
          <RoundedBox args={[0.18, 0.07, 0.12]} position={[-0.82, 0.86, -0.1]} radius={0.015}>
            <meshStandardMaterial color="#38BDF8" />
          </RoundedBox>

          {/* 대리석 세면대 카운터 & 밝은 크리스탈 거울 & 도자기 세면볼 2기 + 은색 수전 */}
          <RoundedBox args={[1.35, 0.74, 0.54]} position={[0.68, 0.37, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0.68, 1.18, -0.24]}>
            <planeGeometry args={[1.25, 0.76]} />
            <meshBasicMaterial map={mirrorTex} />
          </mesh>
          {[0.35, 1.0].map((sx, si) => (
            <group key={si} position={[sx, 0.75, 0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.17, 0.13, 0.08, 24]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.13, 0.11, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              <mesh position={[0, 0.08, -0.15]}>
                <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 동쪽 안쪽: 반열림 도어가 달린 양변기 큐비클 부스 2칸 */}
        {[-0.45, 0.55].map((bz, bi) => (
          <group key={bi} position={[1.15, 0, bz]}>
            <RoundedBox args={[1.15, 1.18, 0.05]} position={[0, 0.59, -0.46]} radius={0.01} castShadow>
              <meshStandardMaterial color={bi === 0 ? '#93C5FD' : '#FBCFE8'} roughness={0.35} />
            </RoundedBox>
            <RoundedBox
              args={[0.05, 1.08, 0.74]}
              position={[-0.55, 0.56, 0.05]}
              rotation={[0, 0.35, 0]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial color={bi === 0 ? '#60A5FA' : '#F472B6'} roughness={0.35} />
            </RoundedBox>
            <DetailedMiniatureToilet4F position={[0.20, 0, 0]} rotationY={-Math.PI / 2} />
          </group>
        ))}

        {/* 화장실 경계 내벽 & 출입문 */}
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
      {/* 🪜 [구역 6: 좌측 하단 계단실 & 소화기] */}
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
      {/* 🛗 [구역 7: 하단 중앙 4F 엘리베이터 홀] */}
      {/* ================================================================= */}
      <group position={[-0.2, 0, 5.25]}>
        <RoundedBox args={[3.2, 2.3, 0.35]} position={[0, 1.15, 0.25]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.45, 1.95, 0.08]} position={[0, 0.98, 0.06]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.22, 0.06]} position={[0, 2.12, 0.08]} radius={0.01}>
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
        </RoundedBox>
        {showRoomSigns && (
          <Billboard position={[0, 2.35, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elevator} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

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

      {/* 4층 NPC 렌더링 (한 번에 1명만 말풍선 표시, 클릭 시 1:1 대화 모달 오픈) */}
      {NPCS_4F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_4F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar4F
            key={npc.id}
            position={[npc.x, npc.y || 0.04, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isBaby={Boolean(npc.isBaby)}
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
function PlayerController4F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
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
      playerIdxRef.current = [seatedInfo.x, 0.08, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.pos[2] !== seatedInfo.z) {
        setRenderState({
          pos: [seatedInfo.x, 0.08, seatedInfo.z],
          rotY: seatedInfo.rotY ?? Math.PI,
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
      const [nx, nz] = resolveCollision4F(rawNx, rawNz);
      const ny = nz < 2.2 ? 0.08 : 0.0;
      playerIdxRef.current = [nx, ny, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, ny, nz],
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
    <SmoothChibiAvatar4F
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
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-2.25, 0.08, 0.45]);

  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);
  const initialPraise = useMemo(() => getSyncedPraiseVideo(), []);

  const [waypoints, setWaypoints] = useState([[-2.25, 0.45]]);
  const [seatedInfo, setSeatedInfo] = useState({ x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' });
  const [activeZone, setActiveZone] = useState(ZONES_4F[2]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  // 1:1 캐릭터 대화 모달 상태
  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  // 접이식 UI 상태
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  // 설교 / 찬양 듀얼 중계 TV 상태
  const [mediaMode, setMediaMode] = useState('sermon');
  const [sermonVideo, setSermonVideo] = useState(initialSermon);
  const [praiseVideo, setPraiseVideo] = useState(initialPraise);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editTitleInput, setEditTitleInput] = useState('');

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_4F.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const triggerEmote = (type) => {
    setEmote(type);
    setTimeout(() => setEmote(null), 2200);
  };

  const handleSitOnMat = useCallback((seatData) => {
    setSeatedInfo(seatData);
    setWaypoints([[seatData.x, seatData.z]]);
    setIsScreenPlaying(true);
  }, []);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setIsScreenPlaying(false);
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computeSmartPath4F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

  const handleSelectNpcForChat = useCallback((npc) => {
    setChatReplyText(
      (npc.dialogues && npc.dialogues[0]) ||
      '할렐루야! 4층 온돌 자모실에서 함께 예배드리게 되어 반갑습니다 😊'
    );
    setSelectedChatNpc(npc);
    triggerEmote('wave');
  }, []);

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

    // 전면 통유리창 (3F 조망)
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(8, 6, w - 16, 8);

    // 좌측 마루 & 우측 마루
    ctx.fillStyle = '#F3DFC1';
    ctx.fillRect(8, 16, 44, 46);
    ctx.fillRect(56, 16, 48, 46);

    // 좌하단 계단 & 중앙 엘베 & 우하단 기저귀/화장실
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 66, 28, 22);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(40, 74, 24, 14);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(68, 66, 36, 22);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.5) / 13.0) * w;
    const my = ((cz + 4.5) / 10.5) * h;
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
    const found = ZONES_4F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 슬림 헤더 & 간판/중계TV/3F본당보기 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 4F 영유아 예배실 (자모실)
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
            onClick={() => setIsScreenPlaying(prev => !prev)}
            style={{ backgroundColor: '#F59E0B', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            📺 {isScreenPlaying ? '중계 TV 닫기' : '중계 TV 켜기'}
          </button>

          <button
            onClick={() => onChangeFloor && onChangeFloor('3F')}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FDE047' }}>⛪ 3F 본당 내려가기</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 10.8, 10.6);
              controlsRef.current.target.set(0, 0.5, 0.0);
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 4F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_4F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnMat(z.seatTarget);
                    else if (z.isTvZone) setIsScreenPlaying(true);
                    else {
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

      {/* 4. 하단 좌측: 접이식 4층 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '👶', label: seatedInfo ? '일어나기' : '좌측마루', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnMat({ x: -2.25, z: 0.45, rotY: Math.PI, rowLabel: '4F 좌측 온돌 마루 예배석' }); } },
              { icon: '🧸', label: '우측마루', onClick: () => handleSitOnMat({ x: 1.75, z: 0.45, rotY: Math.PI, rowLabel: '4F 우측 온돌 마루 예배석' }) },
              { icon: '🪟', label: '전면통유리', onClick: () => { handleWalkTo(-1.2, -2.6); setIsScreenPlaying(true); } },
              { icon: '🍼', label: '기저귀·화장실', onClick: () => handleWalkTo(3.5, 3.5) },
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
            👶 자모실 메뉴 ▲
          </button>
        )}
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
        />

        <PlayerController4F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          emote={emote}
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

      {/* 6. 자모실 성도·교사·아기 클릭 시 열리는 1:1 대화 모달 */}
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

            <div className="space-y-1.5">
              <span style={{ color: '#9CA3AF' }} className="text-[11px] font-bold block">
                💬 인사 및 축복 나누기 (클릭 시 응답)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    q: '👋 "샬롬! 아기와 함께 예배드리는 모습이 참 아름답고 축복됩니다!"',
                    a: `감사합니다 ${playerName}님! 따뜻한 온돌 자모실 덕분에 아기랑 매주 기쁨으로 예배드려요 😊`
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

      {/* 8. 구역 상세 안내 & 전 층 이동 엘리베이터 모달 */}
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
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 (현재 층)' },
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
// src/metaverse/Dining5F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🔗 유튜브 URL에서 11자리 Video ID 추출기
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
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '5F 찬양·말씀 라이브' };
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
            title: parsed[d]?.sermonTitle || '주일 찬양 & 말씀'
          };
        }
      }
    }
  } catch (_) {}
  return { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk', title: '좋은나무 찬양 & 말씀 집회' };
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 생성기 (나뭇결 · 주방타일 · 전신거울)
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

function makeWoodGrainTexture(baseHex = '#D49552', lineHex = '#A86B2D') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineHex;
    ctx.globalAlpha = 0.15;
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

function makeStudioMirrorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E0F2FE');
    grad.addColorStop(0.35, '#F0F9FF');
    grad.addColorStop(0.5, '#FFFFFF');
    grad.addColorStop(0.7, '#BAE6FD');
    grad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 3;
    [w / 3, (w * 2) / 3].forEach((divX) => {
      ctx.beginPath();
      ctx.moveTo(divX, 0);
      ctx.lineTo(divX, h);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let x = -100; x < w + 100; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 42, 0);
      ctx.lineTo(x - 58, h);
      ctx.lineTo(x - 100, h);
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
// 🪑 [핵심 수정 1] 3줄 곡선(`︶`) 의자 18개 좌표 & 아바타 착석 정방향 각도 완벽 일치!
// - chairRotY: 의자 자체 회전각 (의자 앞면 -Z가 강대상을 향함)
// - avatarRotY: 아바타 회전각 (아바타 얼굴 +Z가 강대상을 향하도록 chairRotY + Math.PI 적용!)
// =====================================================================
const CURVED_CHAIRS_5F = (() => {
  const list = [];
  const centerX = 1.65;
  const centerZ = -4.35; // 미니 강대상 중심점
  const rows = [
    { r: 2.35, count: 5, label: '1열' },
    { r: 3.35, count: 6, label: '2열' },
    { r: 4.35, count: 7, label: '3열' }
  ];

  rows.forEach((row, rIdx) => {
    for (let i = 0; i < row.count; i++) {
      const frac = row.count === 1 ? 0.5 : i / (row.count - 1);
      const angle = -0.56 + frac * 1.18;
      const cx = centerX + Math.sin(angle) * row.r;
      const cz = centerZ + Math.cos(angle) * row.r;
      const chairRotY = Math.atan2(cx - centerX, cz - centerZ);
      const avatarRotY = chairRotY + Math.PI; // 아바타 얼굴(+Z)이 정확히 강대상을 바라봄!
      list.push({
        id: `chair_${rIdx}_${i}`,
        x: cx,
        z: cz,
        chairRotY,
        rotY: avatarRotY,
        rowLabel: `5F 소예배홀 ${row.label} ${i + 1}번 좌석`
      });
    }
  });
  return list;
})();

// =====================================================================
// 📍 5층 8대 인터랙션 존 정의
// =====================================================================
const ZONES_5F = [
  {
    id: 'zone_5f_elev',
    code: '01',
    subCode: '엘베',
    name: '5F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (전 층 이동)',
    pos: [-0.2, 0, 4.7],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 5층 친교·찬양·사역관 엘리베이터 홀',
    desc: '도면 하단 중앙에 위치한 5층 엘리베이터 홀입니다. 1층(로비), 3층(대예배당), 4층(유아실), 6층(교육관)으로 즉시 이동할 수 있습니다.'
  },
  {
    id: 'zone_5f_pulpit',
    code: '02',
    subCode: '강대상·TV',
    name: '상단 미니 강대상 & 벽걸이 대형 TV',
    prompt: '02 미니 강대상 & 찬양/말씀 TV 켜기',
    pos: [1.65, 0, -3.5],
    badge: '02 미니강대상·TV',
    title: '✝️ 5층 소예배홀 미니 강대상 & 대형 벽걸이 TV',
    desc: '2단 원목 발판 위에 서 계신 전도사님과 십자가 원목 미니 강대상, 대형 벽걸이 TV입니다.',
    actions: [
      { label: '📝 예배노트 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 열기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_5f_band',
    code: '03',
    subCode: '드럼·피아노',
    name: '우측 상단 드럼 부스 & 전자피아노',
    prompt: '03 드럼 & 전자피아노 찬양단석 보기',
    pos: [4.6, 0, -3.3],
    badge: '03 드럼·전자피아노',
    title: '🥁 우측 상단 코너 드럼 세트 & 88건반 전자피아노',
    desc: '도면 우측 상단 코너에 그려진 원형 드럼 부스와 바로 아래 전자피아노입니다. 찬양팀 드러머와 반주자가 실시간으로 리듬을 맞추며 연주하고 있습니다.'
  },
  {
    id: 'zone_5f_chairs',
    code: '04',
    subCode: '의자들',
    name: '중앙 3열 곡선 배치 의자들',
    prompt: '04 곡선 의자에 앉아 찬양·말씀 듣기',
    pos: [1.8, 0, -1.0],
    seatTarget: CURVED_CHAIRS_5F[7],
    isSeatZone: true,
    badge: '04 곡선 의자들',
    title: '🪑 미니 강대상을 향한 3열 부채꼴 곡선 의자석',
    desc: '미니 강대상을 정면으로 바라보도록 정렬된 18석의 부채꼴 곡선 의자입니다. 의자를 클릭하시면 캐릭터가 강대상을 향해 정자세로 앉아 전면 TV 영상을 시청합니다.'
  },
  {
    id: 'zone_5f_kitchen',
    code: '05',
    subCode: '조리실·배식대',
    name: '우측 하단 조리실 주방 & 소예배실 연결 배식대',
    prompt: '05 조리실 주방 & 오픈 배식대 보기',
    pos: [3.2, 0, 1.1],
    roomTarget: [3.6, 2.7],
    badge: '05 조리실·배식대',
    title: '🍲 소예배실 직결 오픈 배식구 & 5층 조리실 주방',
    desc: '조리실과 소예배실이 마주 보는 벽면에 오픈형 배식구(Serving Window)와 스텐 배식대, 5구 식판, 보온 반찬 바트가 설치되어 있어 예배 후 바로 따뜻한 애찬을 배식받을 수 있습니다.'
  },
  {
    id: 'zone_5f_meeting',
    code: '06',
    subCode: '회의실',
    name: '좌측 상단 6인 회의실 (당회·위원회실)',
    prompt: '06 회의실 들어가기 (6인 테이블)',
    pos: [-4.8, 0, -2.1],
    roomTarget: [-4.8, -2.1],
    badge: '06 회의실 (좌상단)',
    title: '📋 좌측 상단 사역자·제직 회의실 (6인 원목 테이블)',
    desc: '도면 좌측 상단에 위치한 회의실입니다. 원목 회의 테이블을 마주 보고 6개의 의자와 노트북, 커피잔이 정갈하게 배치되어 있습니다.'
  },
  {
    id: 'zone_5f_dance',
    code: '07',
    subCode: '댄스연습실',
    name: '좌측 중단 거울 댄스연습실 (워십·율동)',
    prompt: '07 전신거울 댄스연습실 들어가기',
    pos: [-4.8, 0, 0.3],
    roomTarget: [-4.6, 0.3],
    badge: '07 댄스연습실(거울)',
    title: '🪞 좌측 벽면 대형 전신거울 워십·율동 댄스연습실',
    desc: '밝게 빛나는 3연동 스튜디오 전신거울과 스트레칭 바 앞에서 워십팀 단원들이 주일 찬양 율동을 맞춰보고 있습니다.'
  },
  {
    id: 'zone_5f_rest_stairs',
    code: '08',
    subCode: '화장실·계단',
    name: '좌측 하단 화장실 & 층간 이동 계단실',
    prompt: '08 화장실 및 계단실 이동',
    pos: [-2.2, 0, 3.2],
    isElevator: true,
    badge: '08 화장실·계단',
    title: '🚻 좌측 중하단 화장실 & 좌측 하단 계단실',
    desc: '출입문을 열고 들어가면 바로 정면/우측에 세면대와 거울이 있고, 안쪽에 남·여 개별 도어 부스가 설치된 화장실 및 계단실입니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체·가구 실시간 물리 충돌 박스(AABB) & 문(Doorway) 통과 엔진
// =====================================================================
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
  // 우측 하단 조리실과 소예배실 마주 보는 배식대 벽 (Z = 1.4)
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

function getRoomDoorInfo5F(x, z) {
  if (x < -3.1) {
    if (z < -3.3) return { room: 'hall', doorIn: null, doorOut: null };
    if (z < -0.9) return { room: 'meeting', doorIn: [-4.8, -2.5], doorOut: [-4.8, -4.1], via: [-2.0, -4.1] };
    if (z < 1.4) return { room: 'dance', doorIn: [-3.7, 0.3], doorOut: [-2.2, 0.3] };
    if (z < 3.5) return { room: 'restroom', doorIn: [-3.7, 2.45], doorOut: [-2.2, 2.45] };
    return { room: 'stairs', doorIn: [-3.7, 4.55], doorOut: [-2.2, 4.55] };
  }
  if (x > 1.6 && z > 1.4) {
    return { room: 'kitchen', doorIn: [2.3, 3.05], doorOut: [0.6, 3.05] };
  }
  return { room: 'hall', doorIn: null, doorOut: null };
}

function computeSmartPath5F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision5F(rawEx, rawEz);
  const startInfo = getRoomDoorInfo5F(sx, sz);
  const endInfo = getRoomDoorInfo5F(ex, ez);

  if (startInfo.room === endInfo.room && startInfo.room !== 'hall') {
    return [[ex, ez]];
  }

  const waypoints = [];
  if (startInfo.room !== 'hall') {
    waypoints.push(startInfo.doorIn);
    waypoints.push(startInfo.doorOut);
    if (startInfo.via) waypoints.push(startInfo.via);
  }
  if (endInfo.room !== 'hall') {
    if (endInfo.via) waypoints.push(endInfo.via);
    else waypoints.push([-0.6, endInfo.doorOut[1]]);
    waypoints.push(endInfo.doorOut);
    waypoints.push(endInfo.doorIn);
  }
  waypoints.push([ex, ez]);
  return waypoints;
}

// =====================================================================
// 👥 생동감 넘치는 12인의 역할별 NPC (정방향 의자 착석 & 배식대 앞 주방장!)
// =====================================================================
const NPCS_5F = [
  // 1) 좌측 중단 '댄스연습실' 전신거울을 바라보며 안무 연습하는 워십팀 3명
  {
    id: 'dancer_1',
    name: '이하은 (워십리더)',
    x: -5.5,
    y: 0,
    z: -0.3,
    rotY: -Math.PI / 2,
    isDancer: true,
    isSkirt: true,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '하나, 둘, 셋, 넷! 밝은 전신거울 보면서 팔 각도 예쁘게 맞춰봐요 💃',
      '이번 주일 특송 찬양 율동 너무 은혜로울 것 같아요!',
      '다들 표정 밝게~ 기쁨으로 주님을 찬양해요 😊'
    ]
  },
  {
    id: 'dancer_2',
    name: '김소망 (율동팀)',
    x: -5.5,
    y: 0,
    z: 0.35,
    rotY: -Math.PI / 2,
    isDancer: true,
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '전신거울이 환하고 넓어서 동작 맞추기가 정말 좋네요 🪞',
      '후렴구에서 다 같이 점프하는 부분 다시 해봐요!'
    ]
  },
  {
    id: 'dancer_3',
    name: '박예은 (율동팀)',
    x: -5.5,
    y: 0,
    z: 0.95,
    rotY: -Math.PI / 2,
    isDancer: true,
    isSkirt: true,
    shirt: '#FACC15',
    pants: '#FDE68A',
    hair: '#78350F',
    dialogues: [
      '워십 연습하니까 몸도 마음도 성령 충만해져요 🔥',
      '다음세대 아이들도 쉽게 따라 할 수 있겠어요!'
    ]
  },

  // 2) 좌측 상단 '회의실' 6인 테이블에 마주 앉아 회의하는 위원들 (테이블 안쪽을 정면으로 바라봄!)
  {
    id: 'meeting_1',
    name: '정장로 (기획위원)',
    x: -5.44,
    y: 0,
    z: -2.72,
    rotY: 0, // 남쪽(+Z, 테이블 안쪽)을 정면으로 바라봄!
    seated: true,
    shirt: '#334155',
    pants: '#0F172A',
    hair: '#1E293B',
    dialogues: [
      '이번 달 새가족 환영회와 다음세대 여름 사역 안건을 나눕시다 📋',
      '각 부서마다 기도로 든든히 준비해 주셔서 감사합니다!'
    ]
  },
  {
    id: 'meeting_2',
    name: '최안수집사 (재정)',
    x: -4.16,
    y: 0,
    z: -1.48,
    rotY: Math.PI, // 북쪽(-Z, 테이블 안쪽)을 정면으로 바라봄!
    seated: true,
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '네 장로님! 5층 회의실이 조용하고 쾌적해서 회의하기 참 좋습니다 👍',
      '주방 봉사팀 지원 예산도 넉넉히 반영하겠습니다!'
    ]
  },

  // 3) 우측 하단 '조리실 주방' 배식대 바로 뒤에서 소예배실을 바라보며 배식 준비하는 권사님·집사님들
  {
    id: 'chef_1',
    name: '박권사 (주방장)',
    x: 3.8,
    y: 0,
    z: 2.15, // 소예배실과 마주 보는 북쪽 배식대 바로 뒤에서 좌우로 이동하며 배식!
    patrolX: [2.8, 4.8],
    isSkirt: true,
    rotY: Math.PI,
    shirt: '#F97316',
    pants: '#FFEDD5',
    hair: '#451A03',
    dialogues: [
      '소예배실 바로 앞 배식대에 따뜻한 미역국이랑 불고기 세팅 완료했어요 🍲',
      '예배 끝나면 바로 앞 배식 창구에서 식판 들고 맛있게 받아가세요 🥰',
      '간이 딱 맞아요! 오집사님 5구 식판 트레이 더 채워주세요~'
    ]
  },
  {
    id: 'chef_2',
    name: '오집사 (조리봉사)',
    x: 5.0,
    y: 0,
    z: 3.65,
    autoWave: true,
    isSkirt: true,
    rotY: Math.PI / 2,
    shirt: '#10B981',
    pants: '#D1FAE5',
    hair: '#5C3A21',
    dialogues: [
      '권사님 국솥에서 모락모락 김이 나는 게 정말 맛있어 보여요 😋',
      '배식대 창구가 소예배실이랑 마주 보고 있어서 배식 동선이 최고네요!'
    ]
  },

  // 4) 우측 상단 코너 '드럼' & '전자피아노' 찬양팀 연주자들
  {
    id: 'drummer_5f',
    name: '강형제 (드러머)',
    x: 5.3,
    y: 0,
    z: -4.4,
    seated: true,
    isDrummer: true,
    rotY: -0.4,
    shirt: '#EF4444',
    pants: '#1E293B',
    hair: '#18181B',
    dialogues: [
      '둥칫두칫! 건반 소리랑 드럼 비트 완벽하게 맞아떨어지네요 🥁',
      '오늘 찬양 집회 리허설 사운드 최고입니다!'
    ]
  },
  {
    id: 'pianist_5f',
    name: '윤자매 (반주자)',
    x: 5.2,
    y: 0,
    z: -2.25,
    seated: true,
    isPianist: true,
    isSkirt: true,
    rotY: Math.PI,
    shirt: '#A855F7',
    pants: '#F3E8FF',
    hair: '#5C3A21',
    dialogues: [
      '전자피아노 터치감이 너무 좋아서 찬양 반주할 맛 나요 🎹',
      '미니 강대상 앞 곡선 의자에 앉아서 편하게 찬양 들어보세요!'
    ]
  },

  // 5) 미니 강대상 뒤 2단 발판 위(y = 0.44)에서 인도하시는 김전도사님
  {
    id: 'pastor_5f',
    name: '김전도사 (소예배·찬양인도)',
    x: 1.65,
    y: 0.44,
    z: -4.68,
    rotY: 0,
    isPastor: true,
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#27272A',
    dialogues: [
      '사랑하는 성도 여러분, 5층 소예배·찬양홀에 오신 것을 축복합니다 ✝️',
      '강대상을 향해 정렬된 곡선 의자에 앉으시면 벽걸이 TV로 말씀과 찬양이 나옵니다!'
    ]
  },

  // 6) 🌟 [핵심 수정 1] 등받이에 등을 기대고 강대상을 정면으로 바라보며 앉아 있는 성도들!
  {
    id: 'member_5f_1',
    name: '한성도',
    x: CURVED_CHAIRS_5F[2].x,
    y: 0,
    z: CURVED_CHAIRS_5F[2].z,
    rotY: CURVED_CHAIRS_5F[2].rotY, // 강대상을 정면으로 응시!
    seated: true,
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#5C3A21',
    dialogues: [
      '이제 의자 등받이에 등을 딱 기대고 강대상을 정면으로 보며 앉았어요 👏',
      '발판 위에서 말씀 전하시는 전도사님 모습도 한눈에 잘 보입니다 🙏'
    ]
  },
  {
    id: 'member_5f_2',
    name: '서청년',
    x: CURVED_CHAIRS_5F[8].x,
    y: 0,
    z: CURVED_CHAIRS_5F[8].z,
    rotY: CURVED_CHAIRS_5F[8].rotY, // 강대상을 정면으로 응시!
    seated: true,
    isSkirt: true,
    shirt: '#F472B6',
    pants: '#FCE7F3',
    hair: '#78350F',
    dialogues: [
      '아멘! 바로 뒤쪽이 조리실 배식대라 예배 끝나고 애찬 나누기도 정말 편해요 🎶'
    ]
  },
  {
    id: 'member_5f_3',
    name: '이집사',
    x: CURVED_CHAIRS_5F[14].x,
    y: 0,
    z: CURVED_CHAIRS_5F[14].z,
    rotY: CURVED_CHAIRS_5F[14].rotY,
    seated: true,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '할렐루야~ 곡선 의자에 앉아 다 같이 찬양하니 은혜가 배가 됩니다!'
    ]
  }
];

// =====================================================================
// 👁️ 카메라 회전 시 외벽 자동 투명화 컴포넌트
// =====================================================================
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
// 🟢 바닥 초록색 홀로그램 마커
// =====================================================================
function HologramMarker5F({ zone, isSelected, onSelect }) {
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
        ctx.roundRect(w / 2 + 24, h / 2 + 6, 112, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 80, h / 2 + 28);
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
// 🚶‍♀️ 관절형 아바타 (등받이에 등을 대고 앞으로 다리를 뻗어 앉는 정밀 착석!)
// =====================================================================
function SmoothChibiAvatar5F({
  position = [0, 0, 0],
  patrolZ = null,
  patrolX = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isDancer = false,
  isDrummer = false,
  isPianist = false,
  isPastor = false,
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
          st.pauseTimer = 2.4;
        } else if (st.coord < bounds[0]) {
          st.coord = bounds[0];
          st.dir = 1;
          st.pauseTimer = 2.4;
        }
        if (patrolX) {
          outerGroupRef.current.position.x = st.coord;
          outerGroupRef.current.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          outerGroupRef.current.position.z = st.coord;
          outerGroupRef.current.rotation.y = st.dir > 0 ? 0.2 : Math.PI - 0.2;
        }
      }
    }

    if (isDancer && outerGroupRef.current) {
      outerGroupRef.current.position.z = position[2] + Math.sin(t * 3.2) * 0.14;
      outerGroupRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 1.6) * 0.22;
    }

    const seatedNow = isSeated || isDrummer || isPianist;

    // 🌟 [핵심 수정 1] 아바타 정면(+Z)으로 다리가 자연스럽게 뻗어 나오도록 rotation.x = +Math.PI / 2.15 설정!
    if (leftLegRef.current && rightLegRef.current) {
      if (seatedNow) {
        leftLegRef.current.rotation.x = Math.PI / 2.15;
        rightLegRef.current.rotation.x = Math.PI / 2.15;
        leftLegRef.current.position.set(-0.09, 0.20, 0.08);
        rightLegRef.current.position.set(0.09, 0.20, 0.08);
      } else if (walkingNow || isDancer) {
        const sw = Math.sin(t * (isDancer ? 6.4 : 9.5)) * 0.55;
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
        rightArmRef.current.rotation.z = -1.95 + Math.sin(t * 3.2) * 0.25;
        rightArmRef.current.rotation.x = 0.35;
        leftArmRef.current.rotation.x = -0.35 + Math.cos(t * 2.4) * 0.12;
      } else if (isDancer) {
        leftArmRef.current.rotation.z = 2.2 + Math.sin(t * 6.4) * 0.45;
        rightArmRef.current.rotation.z = -2.2 + Math.cos(t * 6.4) * 0.45;
        leftArmRef.current.rotation.x = -0.3;
        rightArmRef.current.rotation.x = -0.3;
      } else if (isDrummer) {
        leftArmRef.current.rotation.x = -1.0 + Math.sin(t * 14) * 0.38;
        rightArmRef.current.rotation.x = -1.0 + Math.cos(t * 14) * 0.38;
      } else if (isPianist) {
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 8.5) * 0.16;
        rightArmRef.current.rotation.x = -0.82 + Math.cos(t * 8.5) * 0.16;
      } else if (emote === 'wave' || autoWave) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (seatedNow) {
        leftArmRef.current.rotation.x = -0.42 + Math.sin(t * 2.5) * 0.05;
        rightArmRef.current.rotation.x = -0.42 + Math.cos(t * 2.5) * 0.05;
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
      headGroupRef.current.rotation.x = Math.sin(t * 2.8) * 0.06;
      headGroupRef.current.rotation.y = Math.cos(t * 1.5) * 0.08;
    }
    if (rootRef.current) {
      const bounce = (walkingNow || isDancer) && !seatedNow
        ? Math.abs(Math.sin(t * (isDancer ? 6.4 : 9.5))) * 0.055
        : Math.sin(t * 2.6) * 0.008;
      rootRef.current.position.y = (seatedNow ? 0.18 : 0) + bounce;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
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
            <cylinderGeometry args={[0.15, 0.26, 0.46, 24]} />
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
          <Billboard position={[0, 1.42, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[2.25, 0.38]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🪑 미니어처 의자 및 화장실 양변기 컴포넌트
// =====================================================================
function DetailedChair5F({ position, rotationY = 0, seatColor = '#0284C7', onClick }) {
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={onClick}
    >
      <RoundedBox args={[0.40, 0.065, 0.40]} position={[0, 0.34, 0]} radius={0.025} castShadow receiveShadow>
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[0.40, 0.34, 0.06]} position={[0, 0.54, 0.17]} rotation={[0.12, 0, 0]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.42} />
      </RoundedBox>
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.17, lz]} castShadow>
          <cylinderGeometry args={[0.018, 0.014, 0.34, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function DetailedMiniatureToilet5F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.16, 0.06]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.32, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.33, 0.07]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.135, 0.035, 12, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
      </mesh>
      <RoundedBox args={[0.34, 0.36, 0.16]} position={[0, 0.48, -0.13]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.04, 0.18]} position={[0, 0.67, -0.13]} radius={0.015}>
        <meshStandardMaterial color="#F1F5F9" roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.70, -0.13]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
    </group>
  );
}

// =====================================================================
// 🏛️ 5층 전체 초디테일 디오라마 (정방향 의자착석 + 화장실 역전 해결 + 소예배실 직결 배식대!)
// =====================================================================
function FiveFloorMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnChair,
  onToggleTvScreen,
  sermonTitle,
  activeNpcChatIdx,
  showRoomSigns
}) {
  const oakWoodTex = useMemo(() => makeWoodGrainTexture('#D49552', '#A86B2D'), []);
  const hallWoodFloorTex = useMemo(() => makeWoodGrainTexture('#E6CBA8', '#C8A273'), []);
  const kitchenTileTex = useMemo(() => makeTileGridTexture('#F8FAFC', '#E2E8F0', 10), []);
  const mirrorReflectTex = useMemo(() => makeStudioMirrorTexture(), []);

  const signs = useMemo(() => ({
    pulpit: makeRoomSignTexture('미니 강대상 · TV', '소예배 · 구역장 · 찬양홀', '#0284C7'),
    band: makeRoomSignTexture('드럼 · 전자피아노', '5F 찬양단 악기 코너', '#F59E0B'),
    chairs: makeRoomSignTexture('곡선 의자들 (18석)', '부채꼴 예배석 · 클릭 시 착석', '#10B981'),
    kitchen: makeRoomSignTexture('조리실 · 오픈 배식대', '소예배실 직결 배식 창구', '#F97316'),
    meeting: makeRoomSignTexture('회의실 (6인석)', '위원회 · 사역 기획 회의', '#6366F1'),
    dance: makeRoomSignTexture('댄스연습실 (거울)', '전신거울 · 워십 율동 연습', '#EC4899'),
    restroom: makeRoomSignTexture('화장실 🚻', '남·여 화장실 / 세면대', '#64748B'),
    elevator: makeRoomSignTexture('5F 엘리베이터', '1F · 3F · 4F · 6F 이동', '#10B981')
  }), []);

  const tvScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('5F WORSHIP & FELLOWSHIP HALL', w / 2, 65);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px serif';
      ctx.fillText(sermonTitle || '좋은나무 찬양 & 말씀 집회', w / 2, 135);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶ 의자에 앉거나 TV를 클릭하면 영상이 상영됩니다', w / 2, 195);
    }, 512, 256);
  }, [sermonTitle]);

  return (
    <group>
      {/* 1. 5층 전체 베이스 바닥 & 소예배홀 나뭇결 마루 바닥 */}
      <RoundedBox args={[14.4, 0.2, 13.6]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.75, 0.005, -1.9]} receiveShadow>
        <planeGeometry args={[9.5, 6.6]} />
        <meshStandardMaterial map={hallWoodFloorTex} roughness={0.42} />
      </mesh>
      {[2.35, 3.35, 4.35].map((rad, rIdx) => (
        <mesh key={`arc_line_${rIdx}`} rotation={[-Math.PI / 2, 0, 0]} position={[1.65, 0.009, -4.35]}>
          <ringGeometry args={[rad - 0.16, rad + 0.16, 48, 1, -Math.PI * 0.72, Math.PI * 0.44]} />
          <meshBasicMaterial color="#B87E42" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* ================================================================= */}
      {/* ✝️ [구역 1: 상단 중앙 `TV` & `미니 강대상` + 전도사님 전용 2단 발판] */}
      {/* ================================================================= */}
      <group position={[1.65, 0, -4.35]}>
        <group
          position={[0.25, 1.68, -1.05]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleTvScreen) onToggleTvScreen();
          }}
        >
          <RoundedBox args={[2.35, 1.20, 0.08]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[2.22, 1.08]} />
            <meshBasicMaterial map={tvScreenTex} />
          </mesh>
        </group>

        <RoundedBox args={[2.2, 0.10, 1.35]} position={[0, 0.05, -0.05]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={oakWoodTex} roughness={0.4} />
        </RoundedBox>

        {/* 전도사님 2단 원목+레드카펫 발판 */}
        <RoundedBox args={[1.05, 0.18, 0.58]} position={[0, 0.19, -0.34]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
        </RoundedBox>
        <RoundedBox args={[0.88, 0.16, 0.48]} position={[0, 0.36, -0.34]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#991B1B" roughness={0.7} />
        </RoundedBox>

        {/* 십자가 원목 미니 강대상 */}
        <RoundedBox args={[0.90, 0.74, 0.50]} position={[0, 0.45, 0.18]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.02, 0.08, 0.58]} position={[0, 0.84, 0.18]} radius={0.02} castShadow>
          <meshStandardMaterial map={oakWoodTex} />
        </RoundedBox>
        <mesh position={[0, 0.50, 0.44]}>
          <boxGeometry args={[0.04, 0.28, 0.02]} />
          <meshStandardMaterial color="#FDE047" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.55, 0.44]}>
          <boxGeometry args={[0.18, 0.04, 0.02]} />
          <meshStandardMaterial color="#FDE047" metalness={0.7} />
        </mesh>

        {[-0.78, 0.78].map((fx, fi) => (
          <group key={fi} position={[fx, 0.10, 0.18]}>
            <RoundedBox args={[0.32, 0.32, 0.32]} position={[0, 0.16, 0]} radius={0.02} castShadow>
              <meshStandardMaterial map={oakWoodTex} />
            </RoundedBox>
            <mesh position={[0, 0.42, 0]} castShadow>
              <sphereGeometry args={[0.24, 14, 14]} />
              <meshStandardMaterial color="#15803D" />
            </mesh>
            {[[-0.08, 0.54, 0.08, '#F472B6'], [0.08, 0.54, -0.06, '#FEF08A'], [0, 0.58, 0, '#FFFFFF']].map(([bx, by, bz, bc], bi) => (
              <mesh key={bi} position={[bx, by, bz]}>
                <sphereGeometry args={[0.08, 10, 10]} />
                <meshStandardMaterial color={bc} />
              </mesh>
            ))}
          </group>
        ))}

        {showRoomSigns && (
          <Billboard position={[0, 2.48, -0.5]}>
            <mesh>
              <planeGeometry args={[1.2, 0.52]} />
              <meshBasicMaterial map={signs.pulpit} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🥁 [구역 2: 우측 상단 코너 원형 `드럼` & `전자피아노`] */}
      {/* ================================================================= */}
      <group position={[5.2, 0, -4.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <circleGeometry args={[1.15, 32]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((ang, ai) => (
          <mesh
            key={ai}
            position={[Math.sin(ang * 1.6 - 0.5) * 0.98, 0.72, Math.cos(ang * 1.6 - 0.5) * 0.98]}
            rotation={[0, ang * 1.6 - 0.5, 0]}
          >
            <boxGeometry args={[0.58, 1.42, 0.03]} />
            <meshStandardMaterial color="#BAE6FD" transparent opacity={0.34} roughness={0.08} />
          </mesh>
        ))}
        <mesh position={[-0.15, 0.28, 0.1]} rotation={[Math.PI / 2, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.36, 20]} />
          <meshStandardMaterial color="#DC2626" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[-0.32, 0.44, -0.18]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 16]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
        {[[-0.38, 0.85, 0.25], [0.22, 0.88, -0.25], [-0.05, 0.94, 0.32]].map(([cx, cy, cz], ci) => (
          <mesh key={ci} position={[cx, cy, cz]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.20, 0.20, 0.015, 20]} />
            <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}

        <group position={[0.0, 0, 1.55]}>
          <RoundedBox args={[1.45, 0.12, 0.42]} position={[0, 0.72, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#18181B" roughness={0.2} />
          </RoundedBox>
          <RoundedBox args={[1.32, 0.04, 0.14]} position={[0, 0.77, 0.12]} radius={0.005}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          <RoundedBox args={[1.22, 0.05, 0.07]} position={[0, 0.78, 0.08]} radius={0.005}>
            <meshStandardMaterial color="#090D16" />
          </RoundedBox>
          <RoundedBox args={[1.35, 0.70, 0.06]} position={[0, 0.35, -0.14]} radius={0.01} castShadow>
            <meshStandardMaterial color="#27272A" />
          </RoundedBox>
          <RoundedBox args={[0.45, 0.26, 0.02]} position={[0, 0.88, -0.08]} rotation={[-0.25, 0, 0]} radius={0.01}>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
        </group>

        {showRoomSigns && (
          <Billboard position={[-0.2, 1.95, 0.7]}>
            <mesh>
              <planeGeometry args={[1.2, 0.52]} />
              <meshBasicMaterial map={signs.band} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🪑 [구역 3: 정방향 3열 부채꼴 곡선 `의자들` 18석] */}
      {/* ================================================================= */}
      <group>
        {CURVED_CHAIRS_5F.map((ch, idx) => {
          const isSelectedChair = seatedInfo && Math.hypot(seatedInfo.x - ch.x, seatedInfo.z - ch.z) < 0.25;
          return (
            <DetailedChair5F
              key={ch.id}
              position={[ch.x, 0, ch.z]}
              rotationY={ch.chairRotY}
              seatColor={isSelectedChair ? '#FACC15' : idx % 3 === 0 ? '#0284C7' : idx % 3 === 1 ? '#2563EB' : '#0D9488'}
              onClick={(e) => {
                e.stopPropagation();
                onSitOnChair(ch);
              }}
            />
          );
        })}

        {showRoomSigns && (
          <Billboard position={[3.2, 1.55, -0.5]}>
            <mesh>
              <planeGeometry args={[1.2, 0.52]} />
              <meshBasicMaterial map={signs.chairs} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 📋 [구역 4: 좌측 상단 `회의실` (원목 6인 테이블 + 마주 보는 정방향 의자 6석)] */}
      {/* ================================================================= */}
      <group position={[-4.8, 0, -2.1]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.4, 2.3]} />
          <meshStandardMaterial color="#DBEAFE" roughness={0.5} />
        </mesh>

        <RoundedBox args={[2.05, 0.07, 0.92]} position={[0, 0.64, 0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial map={oakWoodTex} roughness={0.32} />
        </RoundedBox>
        {[-0.68, 0.68].map((lx, li) => (
          <mesh key={li} position={[lx, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.62, 12]} />
            <meshStandardMaterial color="#64748B" metalness={0.6} />
          </mesh>
        ))}
        <RoundedBox args={[0.32, 0.02, 0.22]} position={[-0.45, 0.69, -0.18]} radius={0.005}>
          <meshStandardMaterial color="#334155" />
        </RoundedBox>
        <RoundedBox args={[0.26, 0.015, 0.18]} position={[0.45, 0.69, 0.18]} radius={0.005}>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>
        <mesh position={[0.0, 0.71, -0.15]}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
          <meshStandardMaterial color="#F59E0B" />
        </mesh>

        {[-0.64, 0.0, 0.64].map((cx, ci) => (
          <React.Fragment key={`m_ch_${ci}`}>
            <DetailedChair5F
              position={[cx, 0, -0.62]}
              rotationY={Math.PI}
              seatColor="#475569"
              onClick={(e) => {
                e.stopPropagation();
                onSitOnChair({ x: -4.8 + cx, z: -2.1 - 0.62, rotY: 0, rowLabel: '5F 회의실 북측 좌석' });
              }}
            />
            <DetailedChair5F
              position={[cx, 0, 0.62]}
              rotationY={0}
              seatColor="#475569"
              onClick={(e) => {
                e.stopPropagation();
                onSitOnChair({ x: -4.8 + cx, z: -2.1 + 0.62, rotY: Math.PI, rowLabel: '5F 회의실 남측 좌석' });
              }}
            />
          </React.Fragment>
        ))}

        {showRoomSigns && (
          <Billboard position={[0, 1.75, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.meeting} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🪞 [구역 5: 좌측 중단 `댄스연습실` & 크리스탈 전신거울] */}
      {/* ================================================================= */}
      <group position={[-4.8, 0, 0.25]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.4, 2.2]} />
          <meshStandardMaterial map={hallWoodFloorTex} roughness={0.3} />
        </mesh>

        <group position={[-1.66, 1.05, 0]}>
          <RoundedBox args={[0.06, 1.92, 2.08]} radius={0.015} castShadow>
            <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0.036, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.98, 1.80]} />
            <meshBasicMaterial map={mirrorReflectTex} />
          </mesh>
          <RoundedBox args={[0.08, 0.06, 2.02]} position={[0.04, 0.94, 0]} radius={0.01}>
            <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.5} />
          </RoundedBox>
          <mesh position={[0.16, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 1.92, 16]} />
            <meshStandardMaterial map={oakWoodTex} roughness={0.3} />
          </mesh>
          {[-0.75, 0.0, 0.75].map((bz, bi) => (
            <mesh key={bi} position={[0.09, -0.12, bz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
          ))}
        </group>

        {showRoomSigns && (
          <Billboard position={[0.2, 1.75, 0]}>
            <mesh>
              <planeGeometry args={[1.2, 0.52]} />
              <meshBasicMaterial map={signs.dance} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🚻 [구역 6: 핵심 수정 2 — 메인 출입구(우측 복도)에서 들어왔을 때 세면대가 먼저 나오고 안쪽(서쪽)에 양변기 부스가 있는 정방향 화장실!] */}
      {/* ================================================================= */}
      <group position={[-4.8, 0, 2.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.4, 2.0]} />
          <meshStandardMaterial map={kitchenTileTex} roughness={0.3} />
        </mesh>

        {/* 1) 입구 쪽(동쪽/북쪽 벽면, x = +0.55, z = -0.68): 복도 문으로 들어오자마자 바로 보이는 세면대 카운터 & 밝은 거울! */}
        <group position={[0.55, 0, -0.68]}>
          <RoundedBox args={[1.55, 0.74, 0.52]} position={[0, 0.37, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </RoundedBox>
          {/* 북쪽 벽면 밝은 거울 */}
          <mesh position={[0, 1.18, -0.23]}>
            <planeGeometry args={[1.45, 0.78]} />
            <meshBasicMaterial map={mirrorReflectTex} />
          </mesh>
          {[-0.38, 0.38].map((sx, si) => (
            <group key={si} position={[sx, 0.75, 0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.18, 0.14, 0.09, 24]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.14, 0.12, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              <mesh position={[0, 0.08, -0.16]}>
                <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 안쪽(서쪽 벽면, x = -1.15): 입구 쪽(+X 방향)을 향해 문이 열려 있어서 출입구에서 절대 뒷벽에 막히지 않는 양변기 부스 2칸! */}
        {[-0.46, 0.46].map((bz, bi) => (
          <group key={bi} position={[-1.05, 0, bz]}>
            {/* 부스 사이 칸막이 벽 */}
            <RoundedBox args={[1.15, 1.18, 0.05]} position={[0, 0.59, -0.44]} radius={0.01} castShadow>
              <meshStandardMaterial color={bi === 0 ? '#93C5FD' : '#FBCFE8'} roughness={0.35} />
            </RoundedBox>
            {/* 동쪽(복도 출입구 방향, +X)에 달린 큐비클 도어 (안이 잘 보이도록 살짝 열림) */}
            <RoundedBox
              args={[0.05, 1.08, 0.74]}
              position={[0.56, 0.56, 0.06]}
              rotation={[0, -0.35, 0]}
              radius={0.01}
              castShadow
            >
              <meshStandardMaterial color={bi === 0 ? '#60A5FA' : '#F472B6'} roughness={0.35} />
            </RoundedBox>
            {/* 서쪽 벽에 등을 대고 동쪽(입구 방향)을 바라보는 양변기 */}
            <DetailedMiniatureToilet5F position={[-0.22, 0, 0]} rotationY={Math.PI / 2} />
          </group>
        ))}

        {/* 복도 쪽 화장실 메인 출입문 */}
        <RoundedBox args={[0.08, 1.72, 0.78]} position={[1.72, 0.86, 0.15]} rotation={[0, 0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#60A5FA" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[0, 1.75, 0]}>
            <mesh>
              <planeGeometry args={[1.1, 0.50]} />
              <meshBasicMaterial map={signs.restroom} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🪜 [구역 7: 좌측 하단 `계단` + 복도 출입문] */}
      {/* ================================================================= */}
      <group position={[-4.8, 0, 4.65]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[3.4, 2.1]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`st5_${i}`}
            args={[0.32, 0.10 + i * 0.08, 1.1]}
            position={[0.65 - i * 0.30, (0.10 + i * 0.08) / 2, -0.35]}
            radius={0.01}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_5F[7]);
            }}
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#94A3B8'} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.08, 1.72, 0.78]} position={[1.72, 0.86, 0.05]} rotation={[0, 0.4, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#94A3B8" />
        </RoundedBox>
      </group>

      {/* ================================================================= */}
      {/* 🍲 [구역 8: 핵심 수정 3 — 조리실과 소예배실이 마주 보는 북쪽 벽(`Z = +1.4`)에 일체형 오픈 배식대 설치!] */}
      {/* ================================================================= */}
      <group position={[4.1, 0, 3.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[4.8, 4.2]} />
          <meshStandardMaterial map={kitchenTileTex} roughness={0.3} />
        </mesh>

        {/* 🌟 1) 조리실과 소예배실이 마주 보는 경계벽(local z = -2.2, world Z = +1.4)에 설치된 오픈형 배식대(Pass-through Serving Counter)! */}
        <group position={[-0.25, 0, -2.15]}>
          {/* 배식대 하부 원목·스테인리스 카운터 벽체 & 넓은 스텐 상판 */}
          <RoundedBox args={[2.95, 0.82, 0.86]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#E2E8F0" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[3.06, 0.07, 0.96]} position={[0, 0.85, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" metalness={0.75} roughness={0.18} />
          </RoundedBox>

          {/* 소예배실 쪽(-Z)으로 돌출된 원목 식판 트레이 레일(Tray Slide) */}
          <RoundedBox args={[2.98, 0.05, 0.28]} position={[0, 0.78, -0.54]} radius={0.015} castShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.35} />
          </RoundedBox>

          {/* 배식 창구 상부 아치형 원목 헤더 보 & 양옆 기둥 (실제 교회 식당 배식구 구조!) */}
          <RoundedBox args={[3.06, 0.28, 0.24]} position={[0, 1.98, 0]} radius={0.02} castShadow>
            <meshStandardMaterial map={oakWoodTex} roughness={0.38} />
          </RoundedBox>
          {[-1.46, 1.46].map((px, pi) => (
            <RoundedBox key={pi} args={[0.16, 1.15, 0.22]} position={[px, 1.42, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#F1F5F9" />
            </RoundedBox>
          ))}

          {/* 조리실 안쪽 줄: 보온 배식 바트(Chafing Dish) 3구 & 맛있는 반찬(불고기·김치·나물) */}
          {[-0.85, 0.0, 0.85].map((bx, bi) => (
            <group key={`bain_${bi}`} position={[bx, 0.90, 0.16]}>
              <RoundedBox args={[0.64, 0.08, 0.38]} radius={0.015} castShadow>
                <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.18} />
              </RoundedBox>
              <RoundedBox args={[0.56, 0.04, 0.32]} position={[0, 0.03, 0]} radius={0.01}>
                <meshStandardMaterial color={['#9A3412', '#DC2626', '#15803D'][bi]} roughness={0.5} />
              </RoundedBox>
            </group>
          ))}

          {/* 소예배실 바깥쪽 줄: 성도들이 바로 가져갈 수 있는 5구 스텐 식판 4세트 + 밥그릇/국그릇 */}
          {[-1.02, -0.34, 0.34, 1.02].map((tx, ti) => (
            <group key={`tray_${ti}`} position={[tx, 0.89, -0.24]}>
              <RoundedBox args={[0.46, 0.025, 0.34]} radius={0.01} castShadow>
                <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.15} />
              </RoundedBox>
              <mesh position={[-0.11, 0.03, 0.06]}>
                <cylinderGeometry args={[0.068, 0.05, 0.04, 16]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0.11, 0.03, 0.06]}>
                <cylinderGeometry args={[0.068, 0.05, 0.04, 16]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <RoundedBox args={[0.09, 0.02, 0.07]} position={[-0.12, 0.02, -0.08]} radius={0.005}>
                <meshStandardMaterial color="#EF4444" />
              </RoundedBox>
              <RoundedBox args={[0.09, 0.02, 0.07]} position={[0.0, 0.02, -0.08]} radius={0.005}>
                <meshStandardMaterial color="#FACC15" />
              </RoundedBox>
              <RoundedBox args={[0.09, 0.02, 0.07]} position={[0.12, 0.02, -0.08]} radius={0.005}>
                <meshStandardMaterial color="#22C55E" />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* 2) 동쪽 벽면: 대형 가스 화구 + 양수 들통(국솥) 2개 + 2구 싱크볼과 수전 + 상부 환기 후드 */}
        <group position={[1.82, 0, 0.1]}>
          <RoundedBox args={[0.78, 0.82, 3.6]} position={[0, 0.41, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#CBD5E1" metalness={0.65} roughness={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.82, 0.38, 2.2]} position={[0.02, 1.92, -0.5]} radius={0.02} castShadow>
            <meshStandardMaterial color="#94A3B8" metalness={0.75} roughness={0.2} />
          </RoundedBox>

          {[-1.05, -0.15].map((pz, pi) => (
            <group key={`pot_${pi}`} position={[0, 0.84, pz]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.22, 0.28, 24]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              <mesh position={[0, 0.20, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.26, 0.38, 24]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.15} />
              </mesh>
              <RoundedBox args={[0.06, 0.04, 0.64]} position={[0, 0.32, 0]} radius={0.01}>
                <meshStandardMaterial color="#1E293B" />
              </RoundedBox>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02, 20]} />
                <meshBasicMaterial color={pi === 0 ? '#15803D' : '#D97706'} />
              </mesh>
              {[[-0.08, 0.52, 0.05], [0.09, 0.62, -0.06], [0, 0.72, 0.04]].map(([sx, sy, sz], si) => (
                <mesh key={si} position={[sx, sy, sz]}>
                  <sphereGeometry args={[0.055 - si * 0.01, 10, 10]} />
                  <meshBasicMaterial color="#FFFFFF" transparent opacity={0.55 - si * 0.12} />
                </mesh>
              ))}
            </group>
          ))}

          <group position={[0, 0.83, 0.95]}>
            {[-0.28, 0.28].map((sz, si) => (
              <RoundedBox key={si} args={[0.48, 0.04, 0.46]} position={[0, 0, sz]} radius={0.01}>
                <meshStandardMaterial color="#64748B" metalness={0.8} />
              </RoundedBox>
            ))}
            <mesh position={[0.22, 0.16, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.9} />
            </mesh>
            {[0, 0.04, 0.08, 0.12, 0.16].map((py, i) => (
              <mesh key={i} position={[0, 0.03 + py, 0.68]} castShadow>
                <cylinderGeometry args={[0.16, 0.12, 0.03, 16]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
            ))}
          </group>
        </group>

        {/* 3) 남쪽 벽면: 4도어 업소용 스테인리스 냉장고 */}
        <group position={[0.15, 0, 1.55]}>
          <RoundedBox args={[1.72, 1.98, 0.72]} position={[0, 0.99, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} />
          </RoundedBox>
          <RoundedBox args={[1.66, 0.18, 0.04]} position={[0, 1.84, -0.35]} radius={0.01}>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          <RoundedBox args={[0.28, 0.08, 0.05]} position={[0, 1.84, -0.36]} radius={0.005}>
            <meshBasicMaterial color="#10B981" />
          </RoundedBox>
          {[
            [-0.41, 1.32], [0.41, 1.32],
            [-0.41, 0.48], [0.41, 0.48]
          ].map(([dx, dy], di) => (
            <group key={`fr_door_${di}`} position={[dx, dy, -0.36]}>
              <RoundedBox args={[0.78, 0.78, 0.04]} radius={0.015} castShadow>
                <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.18} />
              </RoundedBox>
              <RoundedBox
                args={[0.035, 0.36, 0.05]}
                position={[dx < 0 ? 0.30 : -0.30, 0, -0.03]}
                radius={0.01}
              >
                <meshStandardMaterial color="#475569" metalness={0.9} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* 조리실 주방 서쪽 복도 출입문 */}
        <RoundedBox args={[0.08, 1.75, 0.88]} position={[-2.48, 0.88, -0.45]} rotation={[0, -0.5, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#F97316" />
        </RoundedBox>

        {showRoomSigns && (
          <Billboard position={[-0.25, 2.38, -2.15]}>
            <mesh>
              <planeGeometry args={[1.25, 0.54]} />
              <meshBasicMaterial map={signs.kitchen} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🛗 [구역 9: 하단 중앙 `엘베` 홀] */}
      {/* ================================================================= */}
      <group position={[-0.2, 0, 5.6]}>
        <RoundedBox args={[3.2, 2.3, 0.35]} position={[0, 1.15, 0.25]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.45, 1.95, 0.08]} position={[0, 0.98, 0.06]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.015, -0.45]}>
          <boxGeometry args={[1.2, 0.02, 0.35]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
        {showRoomSigns && (
          <Billboard position={[0, 2.3, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.52]} />
              <meshBasicMaterial map={signs.elevator} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🧱 도면 내벽 (조리실 배식구 구멍이 시원하게 열려 있는 경계벽!) */}
      {/* ================================================================= */}
      <RoundedBox args={[0.16, 1.25, 3.1]} position={[-3.1, 0.62, -1.8]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[-3.1, 0.62, 1.4]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[-3.1, 0.62, 3.5]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>

      <RoundedBox args={[1.3, 1.25, 0.16]} position={[-6.0, 0.62, -3.3]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[1.1, 1.25, 0.16]} position={[-3.65, 0.62, -3.3]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[2.4, 1.25, 0.16]} position={[-5.45, 0.62, -0.9]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.25, 0.16]} position={[-4.9, 0.62, 1.4]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.25, 0.16]} position={[-4.9, 0.62, 3.5]} radius={0.01} castShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      {/* 우측 하단 조리실 주방 경계벽 (중앙 배식구 X: 2.35 ~ 5.35 구간을 오픈형 배식대로 개방하고 양옆 날개벽만 배치!) */}
      <RoundedBox args={[0.8, 1.25, 0.16]} position={[2.0, 0.62, 1.4]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[1.3, 1.25, 0.16]} position={[6.0, 0.62, 1.4]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.25, 1.1]} position={[1.6, 0.62, 1.95]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.25, 2.2]} position={[1.6, 0.62, 4.75]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>

      <SmartCutawayWall5F wallSide="north">
        <RoundedBox args={[14.4, 2.4, 0.24]} position={[0, 1.2, -5.6]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall5F>
      <SmartCutawayWall5F wallSide="west">
        <RoundedBox args={[0.24, 2.4, 12.6]} position={[-6.7, 1.2, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall5F>
      <SmartCutawayWall5F wallSide="east">
        <RoundedBox args={[0.24, 2.4, 12.6]} position={[6.7, 1.2, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall5F>

      {/* 살아 움직이며 율동·연주·요리·회의·대화하는 5층 NPC들 */}
      {NPCS_5F.map((npc, idx) => {
        const isTalking =
          idx === activeNpcChatIdx ||
          idx === (activeNpcChatIdx + 3) % NPCS_5F.length ||
          idx === (activeNpcChatIdx + 6) % NPCS_5F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
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
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.4}
          />
        );
      })}

      {/* 8대 상호작용 마커 (01 ~ 08) */}
      {ZONES_5F.map((z) => (
        <HologramMarker5F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnChair(sel.seatTarget);
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
function PlayerController5F({ waypoints, playerIdxRef, seatedInfo, playerName, emote, onPositionUpdate }) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-0.2, 0, 3.2],
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
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.rotY !== seatedInfo.rotY) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
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
      const [nx, nz] = resolveCollision5F(rawNx, rawNz);
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
    <SmoothChibiAvatar5F
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

function InitialCameraSetup5F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 14.2, 13.2);
      camera.fov = 42;
    } else {
      camera.position.set(0, 11.6, 11.0);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0.2, 0.4, -0.2);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function Fellowship5F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([-0.2, 0, 3.2]);
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [waypoints, setWaypoints] = useState([[-0.2, 3.2]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_5F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_5F.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  const handleSitOnChair = useCallback((chairData) => {
    setSeatedInfo(chairData);
    setWaypoints([[chairData.x, chairData.z]]);
    setIsScreenPlaying(true);
  }, []);

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setIsScreenPlaying(false);
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    if (seatedInfo) setSeatedInfo(null);
    const [sx, , sz] = playerIdxRef.current;
    const nextPath = computeSmartPath5F(sx, sz, tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo]);

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

    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(6, 18, 28, 18);
    ctx.fillStyle = '#DB2777';
    ctx.fillRect(6, 38, 28, 18);
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 58, 28, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(6, 76, 28, 14);

    ctx.fillStyle = '#D99B5E';
    ctx.fillRect(36, 8, 72, 48);

    ctx.fillStyle = '#EA580C';
    ctx.fillRect(64, 58, 44, 32);

    ctx.fillStyle = '#10B981';
    ctx.fillRect(38, 76, 24, 14);

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.8) / 13.6) * w;
    const my = ((cz + 5.8) / 11.8) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen]);

  const handleSaveYoutubeLink = () => {
    const vid = parseYoutubeId(videoUrlInput);
    if (!vid) {
      alert('올바른 유튜브 영상 주소(URL)를 입력해 주세요.');
      return;
    }
    setYoutubeId(vid);
    setIsScreenPlaying(true);
    localStorage.setItem('sermon_active_video_url', videoUrlInput.trim());
    localStorage.setItem('app_active_gisangogi_url', videoUrlInput.trim());
    setShowVideoModal(false);
  };

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_5F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
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
      {/* 1. 좌측 상단: 슬림 헤더 & 간판 숨김 토글 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
        >
          <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
            ◀ 5F 소예배·찬양홀 · 조리실 · 댄스실
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
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: '#FCD34D' }}>{isScreenPlaying ? '📺 TV 닫기' : '📺 찬양·말씀 TV'}</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.6, 11.0);
              controlsRef.current.target.set(0.2, 0.4, -0.2);
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 5F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-44 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_5F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnChair(z.seatTarget);
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

      {/* 3. 벽걸이 TV 라이브 영상 플레이어 */}
      {isScreenPlaying && (
        <div
          style={{ backgroundColor: '#090D16', borderColor: '#F59E0B', color: '#FFFFFF' }}
          className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[460px] border-2 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in"
        >
          <div
            style={{ backgroundColor: '#111827' }}
            className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ backgroundColor: '#E11D48', color: '#FFFFFF' }} className="px-2 py-0.5 rounded text-[10px] font-mono font-black">
                5F LIVE TV
              </span>
              <span style={{ color: '#FFFFFF' }} className="text-xs font-bold truncate">
                {seatedInfo ? `${seatedInfo.rowLabel} · ` : ''}{sermonTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowVideoModal(true)}
                style={{ color: '#FCD34D' }}
                className="text-[11px] font-bold hover:underline px-1.5 cursor-pointer"
              >
                링크변경
              </button>
              <button
                onClick={() => setIsScreenPlaying(false)}
                style={{ color: '#E5E7EB' }}
                className="text-xs font-bold px-1.5 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>
          </div>

          <div className="w-full aspect-video bg-black relative">
            {youtubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`}
                title="5F Live Worship"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
                <p style={{ color: '#D1D5DB' }} className="text-xs">등록된 유튜브 링크가 없습니다.</p>
                <button
                  onClick={() => setShowVideoModal(true)}
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

      {/* 4. 하단 좌측: 접이식 5층 주요 공간 바로가기 바 */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[68vw] sm:max-w-none">
        {showBottomDock ? (
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { icon: '🪑', label: seatedInfo ? '일어나기' : '곡선의자', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnChair(CURVED_CHAIRS_5F[7]); } },
              { icon: '🥁', label: '드럼·피아노', onClick: () => handleWalkTo(4.6, -3.3) },
              { icon: '🍲', label: '조리·배식대', onClick: () => handleWalkTo(3.6, 2.7) },
              { icon: '🪞', label: '댄스연습실', onClick: () => handleWalkTo(-4.6, 0.3) },
              { icon: '📋', label: '회의실', onClick: () => handleWalkTo(-4.8, -2.1) }
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
            🍲 5F 공간 메뉴 ▲
          </button>
        )}
      </div>

      {/* 5. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.6, 11.0]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup5F controlsRef={controlsRef} />

        <ambientLight intensity={1.35} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#94A3B8', 1.15]} />
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

        <FiveFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            const dest = z.roomTarget || [z.pos[0], z.pos[2]];
            handleWalkTo(dest[0], dest[1]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnChair={handleSitOnChair}
          onToggleTvScreen={() => setIsScreenPlaying(prev => !prev)}
          sermonTitle={sermonTitle}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
        />

        <PlayerController5F
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

      {/* 6. 유튜브 링크 설정 모달 */}
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
              <span style={{ color: '#FCD34D' }} className="text-sm font-black">📺 5층 벽걸이 TV 유튜브 연동</span>
              <button onClick={() => setShowVideoModal(false)} style={{ color: '#9CA3AF' }} className="text-xs cursor-pointer">
                ✕ 닫기
              </button>
            </div>
            <div className="space-y-2">
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block">영상 제목</label>
              <input
                type="text"
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                style={{ backgroundColor: '#030712', color: '#FFFFFF' }}
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none"
              />
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block pt-1">유튜브 영상 링크 (URL)</label>
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
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
                TV에 상영하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 구역 상세 안내 & 전 층 이동 엘리베이터 모달 */}
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

            {modalZone.actions && modalZone.actions.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {modalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setModalZone(null);
                      if (setActiveScreen) setActiveScreen(act.screen);
                    }}
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                    className="py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer shadow-md"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실)' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실 (현재 층)' },
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
// src/metaverse/MediaParents4F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🔗 유튜브 URL에서 11자리 Video ID 추출기 (예배노트 Sermon.js 호환)
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
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '주일 대예배 실황' };
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
  return { url: '', id: '', title: '기적이 상식이 되는 5일의 기도' };
};

// =====================================================================
// 🎨 고해상도 캔버스 텍스처 & 온돌 마루(Wood Flooring) 텍스처 생성기
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

// 따뜻한 헤링본/강마루 결 텍스처 생성
function makeMaruFloorTexture(baseHex = '#E5C195', plankLineHex = '#C69863') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);

    // 마루 쪽판 줄무늬
    const rows = 16;
    const rowH = h / rows;
    ctx.strokeStyle = plankLineHex;
    ctx.lineWidth = 2;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // 세로 이음매
      const cols = 4;
      for (let c = 1; c < cols; c++) {
        const x = ((c + (r % 2) * 0.5) / cols) * w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }

    // 은은한 나뭇결
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      const gy = (i / 60) * h;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(w * 0.3, gy + 4, w * 0.7, gy - 4, w, gy);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#10B981') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, 32);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = badgeColor;
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.font = '900 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 60);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 52px sans-serif';
    ctx.fillText(title, w / 2, 134);
  }, 420, 195);
}

// =====================================================================
// 📍 손그림 도면(image_3c2101.jpg) 100% 반영 — 4층 유아실 7대 인터랙션 존
// =====================================================================
const ZONES_4F = [
  {
    id: 'zone_4f_elev',
    code: '01',
    subCode: '엘베',
    name: '4F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F·3F·6F 이동)',
    pos: [0.2, 0, 4.4],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 4층 유아실(자모실) 엘리베이터 홀',
    desc: '도면 하단 중앙에 위치한 엘리베이터 홀입니다. 유모차 보관 공간과 아기 신발장이 비치되어 있으며, 1층·3층·6층으로 이동할 수 있습니다.'
  },
  {
    id: 'zone_4f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 계단실',
    prompt: '02 계단실 (3층 본당 도보 이동)',
    pos: [-2.8, 0, 4.3],
    isElevator: true,
    badge: '02 좌측 계단실',
    title: '🪜 4층 좌측 하단 계단실 (3F 본당 직결)',
    desc: '도면 좌측 하단에 위치한 계단실입니다. 한 층만 내려가면 바로 3층 대예배당 후면 로비와 연결됩니다.'
  },
  {
    id: 'zone_4f_maru_left',
    code: '03',
    subCode: '좌마루',
    name: '좌측 온돌 마루 예배실 & 코너 TV',
    prompt: '03 좌측 마루 방석에 앉아 예배드리기',
    pos: [-2.8, 0, 0.2],
    seatTarget: { x: -3.2, z: -0.6, rowLabel: '4F 좌측 마루 예배석' },
    isSeatZone: true,
    badge: '03 좌측 마루실',
    title: '👶 4층 좌측 온돌 마루 예배실 (영아·부모 쉼터)',
    desc: '따뜻한 온돌 마루 위에 좌식 방석과 아기 범퍼침대, 수유 소파가 준비된 좌측 마루방입니다. 좌측 상단 코너의 대각선 벽걸이 TV와 전면 통유리창을 통해 본당 예배를 실시간으로 함께 드립니다.'
  },
  {
    id: 'zone_4f_maru_right',
    code: '04',
    subCode: '우마루',
    name: '우측 온돌 마루 예배실 & 코너 TV',
    prompt: '04 우측 마루 방석에 앉아 예배드리기',
    pos: [3.2, 0, 0.2],
    seatTarget: { x: 3.6, z: -0.6, rowLabel: '4F 우측 마루 예배석' },
    isSeatZone: true,
    badge: '04 우측 마루실',
    title: '🧸 4층 우측 온돌 마루 예배실 (유아 놀이·예배존)',
    desc: '중앙 유리 파티션 우측에 위치한 두 번째 온돌 마루방입니다. 좌상단 코너에 대각선으로 설치된 중계 TV로 설교 말씀을 시청하며 아이들과 편하게 예배드릴 수 있습니다.'
  },
  {
    id: 'zone_4f_front_glass',
    code: '05',
    subCode: '전면유리',
    name: '상단 전면 통유리 관람창 (3F 본당 조망)',
    prompt: '05 전면 통유리창 & 중계 TV 설정',
    pos: [-1.5, 0, -4.2],
    badge: '05 전면 통유리창',
    title: '🪟 3층 대예배당이 한눈에 내려다보이는 전면 방음 통유리창',
    desc: '도면 맨 위쪽(유리 ↓)에 길게 뻗은 대형 통유리 관람창입니다. 아기가 울어도 소리가 본당으로 새어나가지 않는 완벽한 방음 시설 속에서 본당 강대상을 직접 내려다보며 예배드릴 수 있습니다.',
    actions: [
      { label: '📝 예배노트 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 열기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_4f_center_glass',
    code: '06',
    subCode: '중앙유리',
    name: '좌·우 마루 연결문 & 중앙 유리 파티션',
    prompt: '06 중앙 유리 가벽 & 마루 연결문',
    pos: [0.8, 0, 1.4],
    badge: '06 중앙 유리 가벽',
    title: '🚪 좌·우 마루 사이 중앙 유리창(유리 ↘) & 연결 통로',
    desc: '도면 중앙에 그려진 세로 가벽입니다. 위쪽에는 서로의 방이 환하게 보이는 투명 유리창이 끼워져 있고, 아래쪽 문을 통해 좌측 마루와 우측 마루를 자유롭게 오갈 수 있습니다.'
  },
  {
    id: 'zone_4f_restroom',
    code: '07',
    subCode: '화장실',
    name: '우측 하단 유아·부모 화장실 & 기저귀교환대',
    prompt: '07 화장실 및 기저귀 교환대 보기',
    pos: [3.8, 0, 3.8],
    badge: '07 유아실 화장실',
    title: '🚻 4층 전용 화장실 & 아기 기저귀 교환대 (우측 하단)',
    desc: '우측 마루 바로 아래편에 위치한 화장실입니다. 아기 비데 세면대와 기저귀 교환대, 남·여 양변기 부스가 깔끔하게 마련되어 있습니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체 충돌 방지(AABB) 및 문(Doorway) 자동 우회 네비게이션
// =====================================================================
const WALL_COLLIDERS_4F = [
  // 1) 좌·우 마루를 나누는 중앙 세로 가벽 (X = 0.8) — 연결문(Z: 1.0 ~ 2.1)만 통과 허용!
  { minX: 0.55, maxX: 1.05, minZ: -5.8, maxZ: 0.95 },
  { minX: 0.55, maxX: 1.05, minZ: 2.15, maxZ: 2.85 },
  // 2) 마루방과 하단 구역(계단/엘베/화장실)을 나누는 가로 내벽 (Z = 2.6)
  // 통과 허용 문: 좌측 마루 입구(X: -1.2 ~ 0.4), 우측 마루 입구(X: 1.3 ~ 2.4), 화장실 문(X: 3.3 ~ 4.4)
  { minX: -7.0, maxX: -1.25, minZ: 2.35, maxZ: 2.85 },
  { minX: 0.45, maxX: 1.25, minZ: 2.35, maxZ: 2.85 },
  { minX: 2.45, maxX: 3.25, minZ: 2.35, maxZ: 2.85 },
  { minX: 4.45, maxX: 7.0, minZ: 2.35, maxZ: 2.85 },
  // 3) 하단 계단실과 엘베 홀 사이 세로벽 (X = -1.6) — 문(Z: 3.8 ~ 4.8) 제외
  { minX: -1.85, maxX: -1.35, minZ: 2.6, maxZ: 3.75 },
  { minX: -1.85, maxX: -1.35, minZ: 4.85, maxZ: 6.5 },
  // 4) 하단 엘베 홀과 화장실 사이 세로벽 (X = 2.5)
  { minX: 2.25, maxX: 2.75, minZ: 2.6, maxZ: 6.5 }
];

function isBlocked4F(x, z) {
  if (x < -6.4 || x > 6.4 || z < -5.3 || z > 5.8) return true;
  for (const b of WALL_COLLIDERS_4F) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
  }
  return false;
}

function computeSmartPath4F(sx, sz, ex, ez) {
  const tx = Math.max(-6.1, Math.min(6.1, ex));
  const tz = Math.max(-5.0, Math.min(5.5, ez));

  // 직선 이동 가능 여부 확인
  let clear = true;
  for (let i = 1; i <= 16; i++) {
    const ix = sx + ((tx - sx) * i) / 16;
    const iz = sz + ((tz - sz) * i) / 16;
    if (isBlocked4F(ix, iz)) {
      clear = false;
      break;
    }
  }
  if (clear) return [[tx, tz]];

  const waypoints = [];
  let curX = sx;
  let curZ = sz;

  // 하단 엘베/계단 구역(Z > 2.6)에서 상단 마루(Z < 2.6)로 올라갈 때
  if (curZ > 2.6 && tz <= 2.6) {
    if (curX < -1.6) waypoints.push([-1.6, 4.3]); // 계단실 문 통과
    waypoints.push([-0.3, 3.4]);                  // 엘베 앞 홀
    waypoints.push([-0.3, 1.6]);                  // 좌측 마루 입구 통과
    curX = -0.3;
    curZ = 1.6;
  } else if (curZ <= 2.6 && tz > 2.6) {
    // 마루에서 하단 엘베/화장실로 내려갈 때
    if (curX > 0.8) {
      waypoints.push([0.8, 1.55]); // 중앙 가벽 연결문 통과
    }
    waypoints.push([-0.3, 1.6]);
    waypoints.push([-0.3, 3.5]);
    curX = -0.3;
    curZ = 3.5;
  }

  // 좌측 마루(X < 0.8)와 우측 마루(X > 0.8) 사이를 이동할 때는 도면의 중앙 가벽 아래쪽 연결문(X=0.8, Z=1.55)을 통과!
  if (curZ <= 2.6 && tz <= 2.6 && (curX - 0.8) * (tx - 0.8) < 0) {
    waypoints.push([curX < 0.8 ? 0.1 : 1.5, 1.55]);
    waypoints.push([tx < 0.8 ? 0.1 : 1.5, 1.55]);
  }

  waypoints.push([tx, tz]);
  return waypoints;
}

// =====================================================================
// 👥 4층 좌·우 온돌 마루에서 아기와 함께 예배드리는 부모님 & 아기 NPC들
// =====================================================================
const NPCS_4F = [
  {
    id: 'mom_left_1',
    name: '김집사 (자모)',
    x: -4.2,
    z: -1.8,
    seated: true,
    isSkirt: true,
    rotY: -0.4,
    shirt: '#F472B6',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '통유리창으로 3층 본당 강대상이 한눈에 다 보여서 참 좋네요 😊',
      '왼쪽 코너 TV에서도 설교 말씀이 선명하게 잘 나와요!'
    ]
  },
  {
    id: 'dad_left_2',
    name: '이성도 (아기아빠)',
    x: -1.8,
    z: -1.5,
    seated: true,
    rotY: -0.6,
    shirt: '#38BDF8',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '온돌 마루가 따뜻해서 아기가 새근새근 잘 자네요 👶',
      '아기가 울어도 방음이 완벽해서 마음 편히 예배드립니다 🙏'
    ]
  },
  {
    id: 'mom_right_1',
    name: '박자매 (자모)',
    x: 2.6,
    z: -1.6,
    seated: true,
    isSkirt: true,
    rotY: -0.3,
    shirt: '#FBBF24',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: [
      '우측 마루방도 코너 TV가 있어서 말씀 집중이 정말 잘 돼요 📺',
      '가운데 유리창으로 옆 마루방도 보여서 답답하지 않고 환하네요!'
    ]
  },
  {
    id: 'guide_4f',
    name: '최권사 (유아실 안내)',
    x: -0.3,
    z: 1.5,
    patrolZ: [-0.8, 2.2],
    seated: false,
    isSkirt: true,
    rotY: 0,
    shirt: '#34D399',
    pants: '#A7F3D0',
    hair: '#451A03',
    dialogues: [
      '샬롬! 4층 영유아 예배실(자모실)에 오신 부모님들 환영합니다 🥰',
      '신발을 벗고 좌측 마루나 우측 마루로 편하게 들어오세요~',
      '수유 쿠션과 기저귀 교환대도 모두 준비되어 있습니다!'
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
      ctx.arc(w / 2 - 24, h / 2, 74, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#A7F3D0';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 24, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 28, h / 2 + 6, 106, 46, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 25px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 81, h / 2 + 30);
      }
    }, 350, 220);
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
        <ringGeometry args={[0.46, 0.56, 40]} />
        <meshBasicMaterial color="#34D399" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.46, 40]} />
        <meshBasicMaterial color="#10B981" transparent opacity={isSelected ? 0.45 : 0.24} />
      </mesh>
      <Billboard position={[0.08, 0.44, 0]}>
        <mesh>
          <planeGeometry args={[0.88, 0.52]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 관절형 아바타 (온돌 마루 좌식 착석 모션 + 실시간 대화 말풍선 지원!)
// =====================================================================
function SmoothChibiAvatar4F({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isSkirt = false,
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

  const patrolState = useRef({ z: position[2], dir: 1, pauseTimer: 0 });

  const bubbleTex = useMemo(() => {
    if (!speechBubbleText) return null;
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speechBubbleText.slice(0, 27), w / 2, (h - 24) / 2 + 4);
    }, 700, 120);
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
        // 온돌 마루 좌식 방석 위에 다리를 앞으로 뻗고 편안히 앉는 자세
        leftLegRef.current.rotation.x = -Math.PI / 2.1;
        rightLegRef.current.rotation.x = -Math.PI / 2.1;
        leftLegRef.current.position.set(-0.09, 0.12, -0.10);
        rightLegRef.current.position.set(0.09, 0.12, -0.10);
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.58;
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
      if (emote === 'wave' || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.45 + Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = -0.45 + Math.cos(t * 2.2) * 0.04;
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
      rootRef.current.position.y = (isSeated ? -0.05 : 0) + bounce;
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
          <Billboard position={[0, 1.28, 0]}>
            <mesh renderOrder={12}>
              <planeGeometry args={[1.65, 0.36]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}

        {bubbleTex && (
          <Billboard position={[0, 1.44, 0]}>
            <mesh renderOrder={15}>
              <planeGeometry args={[2.4, 0.42]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🚽 미니어처 화장실 양변기 & 기저귀 교환대 컴포넌트
// =====================================================================
function DetailedMiniatureToilet4F({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.16, 0.05]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.32, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.33, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.13, 0.032, 12, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      <RoundedBox args={[0.32, 0.34, 0.15]} position={[0, 0.46, -0.13]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </RoundedBox>
    </group>
  );
}

// =====================================================================
// 🏛️ 손그림 도면(image_3c2101.jpg) 1:1 매칭 — 4층 유아실(자모실) 전체 디오라마
// =====================================================================
function FourFloorNurseryDiorama({
  activeZoneId,
  onSelectZone,
  onSitOnCushion,
  onToggleTvScreen,
  sermonTitle,
  activeNpcChatIdx
}) {
  const maruTex = useMemo(() => makeMaruFloorTexture('#E8C396', '#C89962'), []);

  const signs = useMemo(() => ({
    frontGlass: makeRoomSignTexture('전면 통유리창 (↓)', '3F 대예배당 본당 내려다보기', '#0284C7'),
    maruLeft: makeRoomSignTexture('좌측 온돌 마루', '0~24개월 아기·부모 예배실', '#F59E0B'),
    maruRight: makeRoomSignTexture('우측 온돌 마루', '유아 놀이·가족 예배실', '#EC4899'),
    centerGlass: makeRoomSignTexture('중앙 유리 파티션', '좌·우 마루 연결 통로', '#10B981'),
    restroom: makeRoomSignTexture('화장실 · 수유/기저귀', '유아 세면대 & 기저귀교환대', '#6366F1'),
    elevator: makeRoomSignTexture('4F 엘리베이터', '1F · 3F · 6F 층간 이동', '#10B981'),
    stairs: makeRoomSignTexture('4F 계단실', '3F 대예배당 직결 계단', '#64748B')
  }), []);

  // 좌·우 마루 코너에 대각선으로 걸린 예배 중계 TV 화면 텍스처
  const tvScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1D4ED8');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE · 3F 본당 예배 중계', w / 2, 65);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px serif';
      ctx.fillText(sermonTitle || '주일 대예배 말씀', w / 2, 135);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶ 터치 시 실시간 유튜브 설교 재생', w / 2, 195);
    }, 512, 256);
  }, [sermonTitle]);

  return (
    <group>
      {/* 1. 4층 전체 베이스 슬래브 */}
      <RoundedBox args={[14.4, 0.2, 12.6]} position={[0, -0.1, 0.2]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>

      {/* ================================================================= */}
      {/* 🪟 [상단: 전면 통유리 관람창 (`유리 ↓`)] (X: -6.4 ~ +6.4, Z: -5.4) */}
      {/* (너머로 3층 대예배당 본당의 따뜻한 우드 톤이 내려다보이는 구조!) */}
      {/* ================================================================= */}
      <group position={[0, 0, -5.35]}>
        {/* 하단 원목 허리벽 (높이 0.75m) */}
        <RoundedBox args={[13.6, 0.75, 0.24]} position={[0, 0.38, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#D4A373" roughness={0.45} />
        </RoundedBox>
        {/* 상단 대형 방음 통유리창 (`유리 ↓`) */}
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[12.8, 1.55, 0.08]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.38} roughness={0.08} metalness={0.2} />
        </mesh>
        {/* 다크 차콜 유리창 프레임 기둥 6개 */}
        <RoundedBox args={[13.2, 0.10, 0.26]} position={[0, 2.35, 0]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        {[-6.4, -3.8, -1.2, 0.8, 3.6, 6.4].map((fx, fi) => (
          <RoundedBox key={fi} args={[0.10, 1.65, 0.26]} position={[fx, 1.55, 0]} radius={0.01}>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
        ))}

        {/* 전면 유리창 아래 성경책/주보 선반 데스크 (좌·우 마루 각각 배치) */}
        <RoundedBox args={[5.8, 0.08, 0.45]} position={[-2.8, 0.72, 0.32]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88544" />
        </RoundedBox>
        <RoundedBox args={[4.6, 0.08, 0.45]} position={[3.6, 0.72, 0.32]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88544" />
        </RoundedBox>

        <Billboard position={[-1.5, 2.75, 0]}>
          <mesh>
            <planeGeometry args={[1.85, 0.82]} />
            <meshBasicMaterial map={signs.frontGlass} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 👶 [좌측 마루 (`마루` 1실)] (X: -6.6 ~ +0.8, Z: -5.2 ~ +2.6) */}
      {/* ================================================================= */}
      <group>
        {/* 따뜻한 온돌 강마루 바닥 (단차 0.08m 업) */}
        <RoundedBox args={[7.3, 0.08, 7.7]} position={[-2.95, 0.04, -1.3]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={maruTex} roughness={0.42} />
        </RoundedBox>

        {/* 📺 [도면 고증 1] 좌측 마루 왼쪽 위 코너 대각선 벽걸이 TV (`TV`) */}
        <group
          position={[-5.65, 1.55, -4.35]}
          rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleTvScreen) onToggleTvScreen();
          }}
        >
          <RoundedBox args={[1.65, 0.96, 0.08]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.55, 0.86]} />
            <meshBasicMaterial map={tvScreenTex} />
          </mesh>
        </group>

        {/* 좌측 마루 위 푹신한 파스텔 원형/사각 좌식 방석 6개 (클릭 시 착석하여 예배 시청!) */}
        {[
          [-4.2, -1.8, '#F472B6'], [-2.8, -1.8, '#38BDF8'], [-1.4, -1.8, '#FBBF24'],
          [-4.2, -0.5, '#34D399'], [-2.8, -0.5, '#A78BFA'], [-1.4, -0.5, '#FB7185']
        ].map(([cx, cz, ccol], ci) => (
          <group
            key={`cush_l_${ci}`}
            position={[cx, 0.10, cz]}
            onClick={(e) => {
              e.stopPropagation();
              onSitOnCushion({ x: cx, z: cz, rowLabel: `좌측 마루 ${ci + 1}번 방석` });
            }}
          >
            <RoundedBox args={[0.62, 0.09, 0.62]} radius={0.04} castShadow receiveShadow>
              <meshStandardMaterial color={ccol} roughness={0.55} />
            </RoundedBox>
            {/* 앞쪽 낮은 좌식 성경 테이블 */}
            <RoundedBox args={[0.65, 0.24, 0.32]} position={[0, 0.12, -0.52]} radius={0.015} castShadow>
              <meshStandardMaterial color="#D49552" />
            </RoundedBox>
          </group>
        ))}

        {/* 좌측 벽면 아기 범퍼침대(유아 낮잠존) & 수유 쿠션 소파 */}
        <group position={[-5.6, 0.08, 0.6]}>
          {/* 범퍼침대 외곽 쿠션 가드 */}
          <RoundedBox args={[1.4, 0.32, 1.8]} position={[0, 0.16, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color="#FFFBEB" />
          </RoundedBox>
          <RoundedBox args={[1.1, 0.08, 1.5]} position={[0, 0.12, 0]} radius={0.02}>
            <meshStandardMaterial color="#FDE68A" />
          </RoundedBox>
          {/* 아기 베개 & 이불 */}
          <RoundedBox args={[0.45, 0.08, 0.28]} position={[0, 0.18, -0.45]} radius={0.03}>
            <meshStandardMaterial color="#FBCFE8" />
          </RoundedBox>
        </group>

        {/* 좌측 마루 입구 신발 벗는 댓돌(디딤판) & 아기 신발장 */}
        <RoundedBox args={[1.4, 0.05, 0.45]} position={[-0.4, 0.025, 2.35]} radius={0.01} receiveShadow>
          <meshStandardMaterial color="#CBD5E1" />
        </RoundedBox>
        <RoundedBox args={[1.6, 0.75, 0.35]} position={[-2.6, 0.45, 2.35]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>

        <Billboard position={[-3.2, 1.95, 0.2]}>
          <mesh>
            <planeGeometry args={[1.62, 0.76]} />
            <meshBasicMaterial map={signs.maruLeft} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🚪 [중앙 세로 가벽 + 내부 유리창 (`유리 ↘`) + 연결 도어] (X: +0.8, Z: -5.2 ~ +2.6) */}
      {/* ================================================================= */}
      <group position={[0.8, 0, 0]}>
        {/* 가벽 하단 허리벽 & 상단 프레임 (Z: -5.2 ~ +0.95) */}
        <RoundedBox args={[0.16, 0.72, 6.15]} position={[0, 0.36, -2.12]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        {/* 도면 중앙의 세로 유리창 (`유리 ↘` — 좌·우 마루가 서로 훤히 보이는 구조!) */}
        <mesh position={[0, 1.38, -2.12]}>
          <boxGeometry args={[0.06, 1.25, 4.6]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.42} roughness={0.1} />
        </mesh>
        <RoundedBox args={[0.18, 0.10, 4.7]} position={[0, 2.02, -2.12]} radius={0.01}>
          <meshStandardMaterial color="#334155" />
        </RoundedBox>

        {/* 아래쪽 연결 도어 프레임 (Z: 1.0 ~ 2.1 구간이 문으로 열려 있음!) */}
        <RoundedBox args={[0.16, 2.05, 0.45]} position={[0, 1.02, 2.35]} radius={0.015} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        {/* 살짝 열려 있는 원목 타공 도어 */}
        <RoundedBox args={[0.08, 1.95, 0.95]} position={[0.25, 0.98, 1.45]} rotation={[0, 0.55, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#D49552" />
        </RoundedBox>

        <Billboard position={[0, 2.35, -0.5]}>
          <mesh>
            <planeGeometry args={[1.62, 0.74]} />
            <meshBasicMaterial map={signs.centerGlass} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🧸 [우측 마루 (`마루` 2실)] (X: +0.8 ~ +6.6, Z: -5.2 ~ +2.6) */}
      {/* ================================================================= */}
      <group>
        {/* 우측 온돌 강마루 바닥 */}
        <RoundedBox args={[5.7, 0.08, 7.7]} position={[3.75, 0.04, -1.3]} radius={0.02} receiveShadow>
          <meshStandardMaterial map={maruTex} roughness={0.42} />
        </RoundedBox>

        {/* 📺 [도면 고증 2] 우측 마루 왼쪽 위(중앙 가벽 코너) 대각선 벽걸이 TV (`TV`) */}
        <group
          position={[1.75, 1.55, -4.35]}
          rotation={[0, Math.PI / 5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleTvScreen) onToggleTvScreen();
          }}
        >
          <RoundedBox args={[1.65, 0.96, 0.08]} radius={0.02} castShadow>
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.55, 0.86]} />
            <meshBasicMaterial map={tvScreenTex} />
          </mesh>
        </group>

        {/* 우측 마루 좌식 방석 4개 & 낮은 원탁 */}
        {[
          [2.6, -1.6, '#FBBF24'], [4.2, -1.6, '#38BDF8'],
          [2.6, -0.4, '#F472B6'], [4.2, -0.4, '#34D399']
        ].map(([cx, cz, ccol], ci) => (
          <group
            key={`cush_r_${ci}`}
            position={[cx, 0.10, cz]}
            onClick={(e) => {
              e.stopPropagation();
              onSitOnCushion({ x: cx, z: cz, rowLabel: `우측 마루 ${ci + 1}번 방석` });
            }}
          >
            <RoundedBox args={[0.62, 0.09, 0.62]} radius={0.04} castShadow receiveShadow>
              <meshStandardMaterial color={ccol} roughness={0.55} />
            </RoundedBox>
            <RoundedBox args={[0.65, 0.24, 0.32]} position={[0, 0.12, -0.52]} radius={0.015} castShadow>
              <meshStandardMaterial color="#D49552" />
            </RoundedBox>
          </group>
        ))}

        {/* 우측 마루 유아 놀이 매트 & 동그란 원탁 & 그림책 수납장 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.09, 1.1]} receiveShadow>
          <circleGeometry args={[1.05, 32]} />
          <meshStandardMaterial color="#FEF08A" />
        </mesh>
        <mesh position={[4.5, 0.35, 1.1]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.05, 24]} />
          <meshStandardMaterial color="#FB7185" />
        </mesh>
        <RoundedBox args={[0.42, 0.88, 1.8]} position={[6.2, 0.52, 0.5]} radius={0.02} castShadow>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>

        <Billboard position={[3.8, 1.95, 0.2]}>
          <mesh>
            <planeGeometry args={[1.62, 0.76]} />
            <meshBasicMaterial map={signs.maruRight} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🪜 [하단 좌측: `계단` + 출입문] (X: -6.6 ~ -1.6, Z: +2.6 ~ +5.8) */}
      {/* ================================================================= */}
      <group position={[-4.2, 0, 4.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <planeGeometry args={[4.8, 3.0]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
        {/* U자형 화강암 계단 단 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <RoundedBox
            key={`st4_${i}`}
            args={[0.35, 0.10 + i * 0.08, 1.2]}
            position={[0.8 - i * 0.34, (0.10 + i * 0.08) / 2, -0.55]}
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
        {/* 계단실과 엘베 홀 사이 내벽 & 도면에 그려진 계단실 문 */}
        <RoundedBox args={[0.16, 1.4, 1.1]} position={[2.6, 0.7, -1.0]} radius={0.01} castShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[0.08, 1.75, 0.85]} position={[2.6, 0.88, 0.1]} rotation={[0, 0.4, 0]} radius={0.01} castShadow>
          <meshStandardMaterial color="#94A3B8" />
        </RoundedBox>
        <Billboard position={[0, 1.95, 0]}>
          <mesh>
            <planeGeometry args={[1.52, 0.72]} />
            <meshBasicMaterial map={signs.stairs} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🛗 [하단 중앙: `엘베` 홀] (X: -1.6 ~ +2.5, Z: +2.6 ~ +5.8) */}
      {/* ================================================================= */}
      <group position={[0.4, 0, 5.5]}>
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
        {/* 정수기 & 손소독기 */}
        <RoundedBox args={[0.45, 1.2, 0.45]} position={[-1.25, 0.6, -0.2]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <Billboard position={[0, 2.45, 0]}>
          <mesh>
            <planeGeometry args={[1.65, 0.76]} />
            <meshBasicMaterial map={signs.elevator} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🚻 [하단 우측: `화장실` & 기저귀 교환대] (X: +2.5 ~ +6.6, Z: +2.6 ~ +5.8) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.55, 0.008, 4.2]} receiveShadow>
          <planeGeometry args={[4.0, 3.1]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
        </mesh>

        {/* 아기 기저귀 교환대 (푹신한 화이트 매트 + 안전가드) & 세면대 2기 */}
        <group position={[3.15, 0, 4.4]}>
          <RoundedBox args={[0.58, 0.74, 1.9]} position={[0, 0.37, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {/* 기저귀 교환 쿠션 */}
          <RoundedBox args={[0.48, 0.08, 0.75]} position={[0, 0.78, -0.45]} radius={0.03} castShadow>
            <meshStandardMaterial color="#FEF08A" />
          </RoundedBox>
          {/* 원형 도자기 세면대 보울 */}
          <mesh position={[0.04, 0.76, 0.45]} castShadow>
            <cylinderGeometry args={[0.18, 0.14, 0.09, 24]} />
            <meshStandardMaterial color="#BAE6FD" />
          </mesh>
        </group>

        {/* 화장실 내부 양변기 부스 2칸 */}
        {[-0.55, 0.55].map((bz, bi) => (
          <group key={`wc4_${bi}`} position={[5.45, 0, 4.2 + bz * 1.2]}>
            <RoundedBox args={[1.1, 1.1, 0.06]} position={[0, 0.55, -0.52]} radius={0.01} castShadow>
              <meshStandardMaterial color="#93C5FD" />
            </RoundedBox>
            <DetailedMiniatureToilet4F position={[0.15, 0, 0]} rotationY={-Math.PI / 2} />
          </group>
        ))}

        {/* 도면에 표시된 화장실 입구 문 (`화장실` 위쪽 가로벽의 직사각형 문) */}
        <RoundedBox args={[0.85, 1.75, 0.08]} position={[3.8, 0.88, 2.6]} rotation={[0, -0.45, 0]} radius={0.015} castShadow>
          <meshStandardMaterial color="#60A5FA" />
        </RoundedBox>

        <Billboard position={[4.5, 1.95, 3.2]}>
          <mesh>
            <planeGeometry args={[1.65, 0.76]} />
            <meshBasicMaterial map={signs.restroom} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🧱 마루방과 하단 구역(계단/엘베/화장실)을 나누는 가로 내벽 (Z = +2.6) */}
      {/* ================================================================= */}
      <RoundedBox args={[5.4, 1.25, 0.16]} position={[-3.9, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[1.1, 1.25, 0.16]} position={[0.9, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.9, 1.25, 0.16]} position={[2.85, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[2.2, 1.25, 0.16]} position={[5.5, 0.62, 2.6]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      {/* 엘베 홀과 화장실 사이 세로 내벽 */}
      <RoundedBox args={[0.16, 1.25, 3.2]} position={[2.5, 0.62, 4.2]} radius={0.015} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>

      {/* 좌·우 외벽 (카메라 회전 시 자동 투명화) */}
      <SmartCutawayWall4F wallSide="west">
        <RoundedBox args={[0.24, 2.3, 11.4]} position={[-6.7, 1.15, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>
      <SmartCutawayWall4F wallSide="east">
        <RoundedBox args={[0.24, 2.3, 11.4]} position={[6.7, 1.15, 0.2]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall4F>

      {/* 4층 부모님 & 안내위원 NPC들 */}
      {NPCS_4F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % NPCS_4F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar4F
            key={npc.id}
            position={[npc.x, 0.08, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
            isSkirt={Boolean(npc.isSkirt)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.6}
          />
        );
      })}

      {/* 7대 상호작용 마커 (01 ~ 07) */}
      {ZONES_4F.map((z) => (
        <HologramMarker4F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnCushion(sel.seatTarget);
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
function PlayerController4F({ waypoints, seatedInfo, playerName, emote, onPositionUpdate }) {
  const posRef = useRef([-0.2, 0.08, 3.5]);
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [-0.2, 0.08, 3.5],
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
      posRef.current = [seatedInfo.x, 0.12, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x) {
        setRenderState({
          pos: [seatedInfo.x, 0.12, seatedInfo.z],
          rotY: Math.PI,
          walking: false
        });
      }
      return;
    }

    if (!waypoints || waypoints.length === 0) return;
    const currentTarget = waypoints[Math.min(wpIndexRef.current, waypoints.length - 1)];
    if (!currentTarget) return;

    const [cx, , cz] = posRef.current;
    const [tx, tz] = currentTarget;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.0);
      const nx = cx + (dx / dist) * step;
      const nz = cz + (dz / dist) * step;
      const ny = nz <= 2.6 ? 0.08 : 0.0;
      posRef.current = [nx, ny, nz];
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
      camera.position.set(0, 11.2, 10.6);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, -0.2);
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
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [waypoints, setWaypoints] = useState([[-2.8, -0.5]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_4F[2]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_4F.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const handleSitOnCushion = useCallback((seatData) => {
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
    const cur = seatedInfo ? [seatedInfo.x, seatedInfo.z] : (waypoints[waypoints.length - 1] || [-0.2, 3.5]);
    const nextPath = computeSmartPath4F(cur[0], cur[1], tx, tz);
    setWaypoints(nextPath);
  }, [seatedInfo, waypoints]);

  // 우측 상단 미니맵에 보내주신 4층 손그림 도면(좌·우 마루, 상단 유리, 중앙 유리, 대각선 TV 2대, 계단/엘베/화장실)을 그대로 렌더링!
  useEffect(() => {
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E2026';
    ctx.fillRect(0, 0, w, h);

    // 상단 전면 유리창 (하늘색 바)
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(10, 6, w - 20, 6);

    // 좌측 마루 & 우측 마루 (따뜻한 우드색)
    ctx.fillStyle = '#D99B5E';
    ctx.fillRect(10, 14, 52, 50);
    ctx.fillRect(66, 14, 38, 50);

    // 중앙 세로 유리 파티션
    ctx.fillStyle = '#7DD3FC';
    ctx.fillRect(62, 18, 4, 34);

    // 하단 계단 / 엘베 / 화장실
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 66, 34, 22);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(46, 68, 26, 20);
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(74, 66, 30, 22);

    // 내 위치 노란 점
    const cur = seatedInfo ? [seatedInfo.x, seatedInfo.z] : (waypoints[waypoints.length - 1] || [-2.8, -0.5]);
    const mx = ((cur[0] + 6.8) / 13.6) * w;
    const my = ((cur[1] + 5.6) / 11.6) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [waypoints, seatedInfo]);

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
    const found = ZONES_4F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  const darkPillStyle = {
    backgroundColor: 'rgba(34, 36, 42, 0.94)',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.14)'
  };

  return (
    <div
      translate="no"
      style={{ backgroundColor: '#2B2C30' }}
      className="notranslate w-full h-full relative overflow-hidden select-none font-sans"
    >
      {/* 1. 좌측 상단: 4층 유아실 헤더 & 착석/중계TV 제어 */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-md shadow-2xl border flex items-center gap-3 cursor-pointer"
        >
          <span style={{ color: '#FFFFFF' }} className="text-sm sm:text-lg font-black tracking-tight">
            ◀ 4F 영유아 예배실 (온돌 마루 자모실)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              if (seatedInfo) handleStandUp();
              else handleSitOnCushion({ x: -2.8, z: -0.5, rowLabel: '좌측 마루 예배석' });
            }}
            style={darkPillStyle}
            className="px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold border shadow-xl cursor-pointer flex items-center gap-1.5"
          >
            <span>👶</span>
            <span style={{ color: '#FFFFFF' }}>{seatedInfo ? '마루에서 일어나기' : '온돌 마루 방석에 앉기'}</span>
          </button>

          <button
            onClick={() => setIsScreenPlaying(prev => !prev)}
            style={darkPillStyle}
            className="px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold border shadow-xl cursor-pointer"
          >
            <span style={{ color: '#FCD34D' }}>{isScreenPlaying ? '📺 중계 TV 닫기' : '📺 코너 중계 TV 켜기'}</span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.2, 10.6);
              controlsRef.current.target.set(0, 0.4, -0.2);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-3 py-1.5 sm:py-2 rounded-full text-[11px] font-bold border shadow-xl cursor-pointer"
          >
            <span style={{ color: '#93C5FD' }}>🎥 시점 초기화</span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 4F 유아실 도면 미니맵 & 구역 이동 버튼 */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div style={darkPillStyle} className="p-2 rounded-2xl border shadow-2xl flex flex-col items-center">
          <canvas ref={minimapRef} width={114} height={94} className="rounded-xl" />
          <span style={{ color: '#FFFFFF' }} className="text-[10.5px] font-extrabold mt-1">
            4F 유아실 도면 맵
          </span>
        </div>

        <div
          style={darkPillStyle}
          className="p-1.5 rounded-2xl border shadow-xl flex flex-col gap-1 w-36 max-h-[44vh] overflow-y-auto hide-scrollbar"
        >
          {ZONES_4F.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                if (z.isSeatZone && z.seatTarget) handleSitOnCushion(z.seatTarget);
                else {
                  handleWalkTo(z.pos[0], z.pos[2]);
                  setActiveZone(z);
                  setModalZone(z);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left text-[11px] font-extrabold flex items-center justify-between cursor-pointer"
            >
              <span style={{ color: '#FFFFFF' }} className="truncate">{z.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 마루 방석에 앉거나 코너 TV 클릭 시 열리는 예배 중계 플레이어 */}
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
                4F 중계 TV
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
                title="4F Nursery Live Sermon"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
                <p style={{ color: '#D1D5DB' }} className="text-xs">등록된 설교 유튜브 링크가 없습니다.</p>
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

      {/* 4. 하단 중앙: 4층 5대 원형 캡슐 독 바 */}
      <div className="absolute bottom-14 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-3 pointer-events-auto max-w-[96vw] overflow-x-auto hide-scrollbar px-2 py-1">
        {[
          { icon: '👶', label: '좌측 마루', sub: '(코너TV)', onClick: () => handleSitOnCushion({ x: -2.8, z: -0.5, rowLabel: '좌측 마루 예배석' }) },
          { icon: '🧸', label: '우측 마루', sub: '(코너TV)', onClick: () => handleSitOnCushion({ x: 3.6, z: -0.5, rowLabel: '우측 마루 예배석' }) },
          { icon: '🪟', label: '전면 통유리', sub: '(본당조망)', onClick: () => { handleWalkTo(-1.5, -4.2); setModalZone(ZONES_4F[4]); } },
          { icon: '📝', label: '예배 노트', sub: '(말씀필기)', onClick: () => setActiveScreen && setActiveScreen('sermon') },
          { icon: '🛗', label: '층별 이동', sub: '(엘베)', onClick: () => setModalZone(ZONES_4F[0]) }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            style={darkPillStyle}
            className="w-[64px] h-[60px] sm:w-[86px] sm:h-[76px] shrink-0 rounded-[22px] sm:rounded-[26px] backdrop-blur-xl border shadow-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-base sm:text-xl leading-none">{item.icon}</span>
            <span style={{ color: '#FFFFFF' }} className="text-[10px] sm:text-[11px] font-extrabold leading-tight">
              {item.label}
            </span>
            <span style={{ color: '#D1D5DB' }} className="text-[8.5px] font-bold leading-none">
              {item.sub}
            </span>
          </button>
        ))}
      </div>

      {/* 5. 메인 3D 캔버스 (자유 회전·패닝·줌 100% 개방) */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.2, 10.6]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup4F controlsRef={controlsRef} />

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
          <planeGeometry args={[14.2, 12.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <FourFloorNurseryDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            handleWalkTo(z.pos[0], z.pos[2]);
            setModalZone(z);
          }}
          onSitOnCushion={handleSitOnCushion}
          onToggleTvScreen={() => setIsScreenPlaying(prev => !prev)}
          sermonTitle={sermonTitle}
          activeNpcChatIdx={activeNpcChatIdx}
        />

        <PlayerController4F
          waypoints={waypoints}
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
          maxDistance={30}
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
              <span style={{ color: '#FCD34D' }} className="text-sm font-black">📺 4층 유아실 코너 TV 유튜브 연동</span>
              <button onClick={() => setShowVideoModal(false)} style={{ color: '#9CA3AF' }} className="text-xs cursor-pointer">
                ✕ 닫기
              </button>
            </div>
            <div className="space-y-2">
              <label style={{ color: '#D1D5DB' }} className="text-[11px] font-bold block">설교 제목</label>
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

      {/* 7. 구역 상세 안내 & 엘리베이터 층간 이동 모달 */}
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
                  { fl: '4F', label: '4F 영유아 예배실 · 온돌 마루 (현재 층)' },
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
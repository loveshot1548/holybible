// src/metaverse/Education6F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

// =====================================================================
// 🎵 6층 다음세대 교육관 밝고 경쾌한 어린이 찬양 오르골 BGM (Web Audio)
// =====================================================================
let bgmInterval6F = null;
const togglePraiseBgm6F = (play) => {
  if (!play) {
    if (bgmInterval6F) clearInterval(bgmInterval6F);
    bgmInterval6F = null;
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
      step++;
    } catch (_) {}
  }, 380);
};

// =====================================================================
// 🎨 고해상도 한글 캔버스 텍스처 & 나뭇결 생성기 (<Html> 에러 원천 차단)
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

function makeRoomSignTexture(title, subTitle, badgeColor = '#0284C7') {
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
    ctx.font = '900 54px sans-serif';
    ctx.fillText(title, w / 2, 134);
  }, 420, 195);
}

// =====================================================================
// 📍 손그림 도면 100% 반영 — 6층 8대 인터랙션 존 정의
// =====================================================================
const ZONES_6F = [
  {
    id: 'zone_6f_elev',
    code: '01',
    subCode: 'ELV',
    name: '6F 엘리베이터 홀 (하단 중앙)',
    prompt: '01 엘리베이터 탑승 (1F·3F 이동)',
    pos: [0.0, 0, 4.7],
    isElevator: true,
    badge: '01 엘리베이터',
    title: '🛗 6층 다음세대 교육관 엘리베이터 홀',
    desc: '도면 하단 정중앙에 위치한 6층 엘리베이터 홀입니다. 1층 메인 로비와 3층 대예배당으로 즉시 이동할 수 있습니다.'
  },
  {
    id: 'zone_6f_stairs',
    code: '02',
    subCode: '계단',
    name: '좌측 하단 양방향 계단실 (⇄)',
    prompt: '02 계단실 (도보 층간 이동)',
    pos: [-2.2, 0, 4.3],
    isElevator: true,
    badge: '02 좌측 계단실',
    title: '🪜 6층 좌측 하단 양방향(⇄) 계단실',
    desc: '도면 좌측 하단에 위치한 위·아래층 연결 U자형 계단실입니다. 코너 소화기와 분전반이 안전하게 비치되어 있습니다.'
  },
  {
    id: 'zone_6f_infant',
    code: '03',
    subCode: '유아',
    name: '좌측 중단 유아부실 (0~3세)',
    prompt: '03 유아부 예배실 들어가기',
    pos: [-2.1, 0, 1.8],
    roomTarget: [-4.6, 1.8],
    badge: '03 유아부 (좌측)',
    title: '👶 예수님 품 안에서 자라는 유아부 (좌측 중단)',
    desc: '계단실 바로 위쪽에 위치한 유아부실입니다. 컬러 볼풀장, 미니 미끄럼틀, 꽃모양 원탁과 푹신한 놀이 매트가 꾸며져 있습니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 유아부실'
  },
  {
    id: 'zone_6f_elem_left',
    code: '04',
    subCode: '초등L',
    name: '좌측 상단 초등부 분반실',
    prompt: '04 좌측 초등부 분반실 보기',
    pos: [-2.1, 0, -1.5],
    roomTarget: [-4.6, -1.5],
    badge: '04 초등부 (좌측)',
    title: '📘 초등부 말씀 분반 & 소그룹 교육실 (좌측 상단)',
    desc: '유아부 위쪽에 위치한 초등부 소그룹 분반실입니다. 원형 모둠 테이블과 스툴 의자, 이젤 칠판에서 성경 공부가 진행됩니다.',
    schedule: '주일 오전 11:00 | 6층 좌측 초등부실'
  },
  {
    id: 'zone_6f_newfamily',
    code: '05',
    subCode: '새가족',
    name: '상단 정면 새가족반 라운지',
    prompt: '05 새가족반 영접 라운지 안내',
    pos: [-0.2, 0, -4.0],
    roomTarget: [-1.5, -5.6],
    badge: '05 새가족반 (상단)',
    title: '🤝 환영합니다! 좋은나무교회 새가족반 (상단 정면)',
    desc: '중앙 홀 맨 안쪽(북쪽 상단)에 자리한 새가족 전용 라운지입니다. 푹신한 패브릭 체어와 원목 테이블, 다과가 준비되어 있습니다.',
    schedule: '주일 오후 1:00 | 6층 상단 새가족반실'
  },
  {
    id: 'zone_6f_elem_right',
    code: '06',
    subCode: '초등R',
    name: '우측 상단 초등부 본관 (Sunday School)',
    prompt: '06 우측 초등부 본관 들어가기',
    pos: [2.1, 0, -2.0],
    roomTarget: [4.6, -2.2],
    badge: '06 초등부 (우측)',
    title: '🏫 초등부 Sunday School 메인 예배실 (우측 상단)',
    desc: '도면 우측 상단의 가장 넓은 초등부 전용 예배실입니다. 강대상, 전자피아노, 대형 스크린, 학생용 책걸상 12석이 배치되어 있습니다.',
    schedule: '주일 오전 11:00 | 6층 우측 초등부실'
  },
  {
    id: 'zone_6f_kinder',
    code: '07',
    subCode: '유치',
    name: '우측 중단 유치부실 (4~7세)',
    prompt: '07 유치부 예배실 보기',
    pos: [2.1, 0, 1.3],
    roomTarget: [4.6, 1.3],
    badge: '07 유치부 (우측)',
    title: '🎨 말씀 안에서 꿈꾸는 유치부 (우측 중단)',
    desc: '우측 초등부실과 화장실 사이에 위치한 유치부실입니다. 무지개 아치 무대와 초승달 모양 교탁, 키즈 스툴 의자들이 배치되어 있습니다.',
    schedule: '주일 오전 11:00 | 6층 우측 유치부실'
  },
  {
    id: 'zone_6f_restroom',
    code: '08',
    subCode: '화장실',
    name: '우측 하단 남·여 화장실 & 파우더룸',
    prompt: '08 6층 화장실 및 세면대 위치',
    pos: [2.1, 0, 3.8],
    badge: '08 화장실 (우측하단)',
    title: '🚻 6층 남·여 화장실 및 어린이 세면대 (우측 하단)',
    desc: '엘리베이터 우측 하단에 위치한 화장실입니다. 대형 거울과 원형 도자기 세면대 3기, 남·여 개별 양변기 부스가 깔끔하게 구비되어 있습니다.'
  }
];

// =====================================================================
// 🚧 도면 벽체 충돌 방지(AABB) 및 문(Doorway) 통과 네비게이션
// =====================================================================
const WALL_COLLIDERS_6F = [
  { minX: -3.3, maxX: -2.7, minZ: 2.5, maxZ: 6.5 },
  { minX: -3.3, maxX: -2.7, minZ: -0.6, maxZ: 1.1 },
  { minX: -3.3, maxX: -2.7, minZ: -4.8, maxZ: -2.3 },
  { minX: 2.5, maxX: 3.1, minZ: -7.0, maxZ: -2.8 },
  { minX: 2.5, maxX: 3.1, minZ: -1.1, maxZ: 0.5 },
  { minX: 2.5, maxX: 3.1, minZ: 2.1, maxZ: 3.1 },
  { minX: 2.5, maxX: 3.1, minZ: 4.5, maxZ: 6.5 },
  { minX: -7.0, maxX: -1.1, minZ: -5.0, maxZ: -4.4 },
  { minX: 0.7, maxX: 3.0, minZ: -5.0, maxZ: -4.4 }
];

function isBlocked6F(x, z) {
  if (x < -6.4 || x > 6.4 || z < -6.4 || z > 6.2) return true;
  for (const b of WALL_COLLIDERS_6F) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
  }
  return false;
}

function computePath6F(sx, sz, ex, ez) {
  const clampedX = Math.max(-6.1, Math.min(6.1, ex));
  const clampedZ = Math.max(-6.1, Math.min(5.9, ez));

  let clear = true;
  for (let i = 1; i <= 14; i++) {
    const ix = sx + ((clampedX - sx) * i) / 14;
    const iz = sz + ((clampedZ - sz) * i) / 14;
    if (isBlocked6F(ix, iz)) {
      clear = false;
      break;
    }
  }
  if (clear) return [[clampedX, clampedZ]];

  return [
    [0.0, sz],
    [0.0, clampedZ],
    [clampedX, clampedZ]
  ];
}

// =====================================================================
// 👥 6층 중앙 홀과 각 부서실에서 움직이며 대화하는 NPC들
// =====================================================================
const NPCS_6F = [
  {
    id: 'npc_6f_1',
    name: '김전도사 (초등부)',
    x: 0.6,
    z: -0.5,
    patrolZ: [-3.0, 2.2],
    shirt: '#2563EB',
    pants: '#1E293B',
    hair: '#451A03',
    dialogues: [
      '애들아 안녕! 6층 초등부 예배실은 오른쪽 위편이야 😊',
      '새가족분들은 복도 맨 안쪽 새가족반 라운지로 오세요!',
      '할렐루야! 다음세대가 말씀으로 자라가는 6층 교육관입니다.'
    ]
  },
  {
    id: 'npc_6f_2',
    name: '박교사 (유치부)',
    x: 1.75,
    z: 1.3,
    isSkirt: true,
    autoWave: true,
    rotY: -0.8,
    shirt: '#EC4899',
    pants: '#FBCFE8',
    hair: '#5C3A21',
    dialogues: [
      '우리 유치부 친구들 여기 오른쪽 방으로 모이세요 🎨',
      '무지개 무대 앞에서 선생님이랑 신나게 찬양해요!'
    ]
  },
  {
    id: 'npc_6f_3',
    name: '이교사 (유아부)',
    x: -1.75,
    z: 1.8,
    isSkirt: true,
    autoWave: true,
    rotY: 0.8,
    shirt: '#F59E0B',
    pants: '#FDE68A',
    hair: '#5C3A21',
    dialogues: [
      '아기와 부모님이 함께 드리는 유아부는 왼쪽 방입니다 👶',
      '안쪽에 귀여운 볼풀장이랑 미끄럼틀도 준비되어 있어요~'
    ]
  },
  {
    id: 'npc_6f_4',
    name: '최팀장 (새가족반)',
    x: -0.2,
    z: -3.6,
    rotY: 0,
    shirt: '#10B981',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '주일 오후 1시 새가족반 라운지에 오신 것을 환영합니다 🤝',
      '따뜻한 차 한잔 하시면서 좋은나무교회 가족이 되어보세요!'
    ]
  },
  {
    id: 'npc_6f_kid1',
    name: '다윗 (초등부)',
    x: 4.1,
    z: -2.5,
    rotY: Math.PI,
    shirt: '#38BDF8',
    pants: '#334155',
    hair: '#78350F',
    dialogues: [
      '전도사님! 오늘 성경 퀴즈 대회 빨리 시작해요 🙋‍♂️',
      '친구들아 같이 초등부 앞자리 앉자!'
    ]
  }
];

// =====================================================================
// 👁️ 카메라 시점 회전 시 앞쪽 외벽 자동 투명화 컴포넌트
// =====================================================================
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
function HologramMarker6F({ zone, isSelected, onSelect }) {
  const pulseRef = useRef();

  const badgeTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, 95);
      grad.addColorStop(0, '#34D399');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w / 2 - 22, h / 2, 76, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#A7F3D0';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 62px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 22, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 34, h / 2 + 6, 96, 46, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 82, h / 2 + 30);
      }
    }, 340, 220);
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
          <planeGeometry args={[0.84, 0.52]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 관절형 아바타 + 실시간 대화 말풍선
// =====================================================================
function SmoothChibiAvatar6F({
  position = [0, 0, 0],
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
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
      ctx.font = '900 27px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speechBubbleText.slice(0, 26), w / 2, (h - 24) / 2 + 4);
    }, 680, 120);
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
        st.z += st.dir * delta * 0.7;
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
      if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.58;
        leftLegRef.current.rotation.x = sw;
        rightLegRef.current.rotation.x = -sw;
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
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
      const bounce = walkingNow ? Math.abs(Math.sin(t * 9.5)) * 0.045 : Math.sin(t * 2.6) * 0.01;
      rootRef.current.position.y = bounce;
    }
  });

  return (
    <group ref={outerGroupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.26} />
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
              <planeGeometry args={[2.35, 0.42]} />
              <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🪑 [초디테일 미니어처 가구 모듈] 박스 형태를 탈피한 곡면 가구 컴포넌트들!
// =====================================================================
// 1) 등받이와 4개 다리가 달린 귀여운 라운지 의자
function DetailedChair({ position, rotationY = 0, seatColor = '#38BDF8', legColor = '#CBD5E1' }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 둥근 방석 */}
      <RoundedBox args={[0.38, 0.06, 0.38]} position={[0, 0.32, 0]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.45} />
      </RoundedBox>
      {/* 곡면 등받이 */}
      <RoundedBox args={[0.38, 0.32, 0.06]} position={[0, 0.49, -0.16]} radius={0.025} castShadow>
        <meshStandardMaterial color={seatColor} roughness={0.45} />
      </RoundedBox>
      {/* 원통형 다리 4개 */}
      {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.16, lz]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.32, 8]} />
          <meshStandardMaterial color={legColor} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// 2) 화장실용 초디테일 미니어처 도자기 양변기 (변기 보울 + 물탱크 + 변기 시트)
function DetailedMiniatureToilet({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 하단 도자기 베이스 */}
      <mesh position={[0, 0.16, 0.05]} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.32, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      {/* 변기 시트 & 보울 림 */}
      <mesh position={[0, 0.33, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.14, 0.035, 12, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      {/* 뒤쪽 도자기 물탱크 & 은색 레버 */}
      <RoundedBox args={[0.34, 0.36, 0.16]} position={[0, 0.48, -0.14]} radius={0.03} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.04, 0.18]} position={[0, 0.67, -0.14]} radius={0.015}>
        <meshStandardMaterial color="#F1F5F9" roughness={0.2} />
      </RoundedBox>
    </group>
  );
}

// 3) 유아부를 침범하지 않는 좌측 하단 전용 양방향(⇄) U자형 계단실
function CompactUStairwell6F({ position, onClickStairs, onClickExtinguisher }) {
  return (
    <group position={position}>
      {/* 계단실 바닥 (유아부 벽 Z=+3.1 아래쪽인 Z=+3.2 ~ +6.2 내부에만 정확히 수납!) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[3.7, 2.9]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
      </mesh>

      {/* 좌측 서쪽 계단참 & 채광 유리창 */}
      <RoundedBox args={[0.85, 0.48, 2.7]} position={[-1.35, 0.24, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" roughness={0.45} />
      </RoundedBox>

      {/* 1) 위쪽 단 (오른쪽에서 왼쪽으로 올라가는 계단 6단: ← 방향) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <RoundedBox
          key={`up_${i}`}
          args={[0.32, 0.08 + i * 0.07, 1.1]}
          position={[0.65 - i * 0.30, (0.08 + i * 0.07) / 2, -0.68]}
          radius={0.01}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            if (onClickStairs) onClickStairs();
          }}
        >
          <meshStandardMaterial color={i % 2 === 0 ? '#F8FAFC' : '#CBD5E1'} roughness={0.4} />
        </RoundedBox>
      ))}

      {/* 2) 아래쪽 단 (왼쪽에서 오른쪽으로 내려가는 계단 6단: → 방향) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <RoundedBox
          key={`dn_${i}`}
          args={[0.32, 0.45 - i * 0.07, 1.1]}
          position={[-0.85 + i * 0.30, (0.45 - i * 0.07) / 2, 0.68]}
          radius={0.01}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            if (onClickStairs) onClickStairs();
          }}
        >
          <meshStandardMaterial color={i % 2 === 0 ? '#E2E8F0' : '#94A3B8'} roughness={0.4} />
        </RoundedBox>
      ))}

      {/* 중앙 원목 손잡이 난간 & 스텐 기둥 */}
      <RoundedBox args={[1.95, 0.06, 0.06]} position={[-0.1, 0.78, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#78350F" roughness={0.35} />
      </RoundedBox>
      {[-0.85, -0.35, 0.15, 0.65].map((px, pi) => (
        <mesh key={pi} position={[px, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 10]} />
          <meshStandardMaterial color="#64748B" metalness={0.7} />
        </mesh>
      ))}

      {/* 코너 빨간 소화기 (클릭 가능) */}
      <group
        position={[1.45, 0, -1.1]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickExtinguisher) onClickExtinguisher();
        }}
      >
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.42, 16]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.093, 0.093, 0.12, 16]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 6층 전체 건축 및 7개 부서실 초디테일 미니어처 인테리어
// =====================================================================
function SixFloorMasterpieceDiorama({ activeZoneId, onSelectZone, activeNpcChatIdx }) {
  const signs = useMemo(() => ({
    newFamily: makeRoomSignTexture('새가족반', '주일 오후 1시 · 영접실', '#8B5CF6'),
    elemRight: makeRoomSignTexture('초등부 본관', '4~6학년 Sunday School', '#0284C7'),
    elemLeft: makeRoomSignTexture('초등부 분반실', '말씀 양육 · 소그룹', '#2563EB'),
    kinder: makeRoomSignTexture('유치부', '4~7세 예배 · 율동실', '#EC4899'),
    infant: makeRoomSignTexture('유아부', '0~3세 영유아 · 부모쉼터', '#F59E0B'),
    restroom: makeRoomSignTexture('화장실 🚻', '남·여 화장실 / 세면대', '#64748B'),
    elevator: makeRoomSignTexture('6F 엘리베이터', '1F 로비 · 3F 본당 이동', '#10B981')
  }), []);

  return (
    <group>
      {/* 1. 전체 6층 베이스 바닥 & 중앙 홀 바닥 (4F 글자 완전 제거하여 깨끗함!) */}
      <RoundedBox args={[14.4, 0.2, 13.8]} position={[0, -0.1, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.65} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.005, 0.2]} receiveShadow>
        <planeGeometry args={[5.8, 9.6]} />
        <meshStandardMaterial color="#525E6E" roughness={0.55} />
      </mesh>
      {/* 복도 양옆 은은한 화이트 가이드 라인 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.65, 0.008, -0.5]}>
        <planeGeometry args={[0.08, 7.8]} />
        <meshBasicMaterial color="#94A3B8" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.45, 0.008, -0.5]}>
        <planeGeometry args={[0.08, 7.8]} />
        <meshBasicMaterial color="#94A3B8" transparent opacity={0.4} />
      </mesh>

      {/* ================================================================= */}
      {/* 🤝 [방 1: 상단 정면 '새가족반 라운지'] (원목 테이블 + 라운지 소파/의자 + 커피잔 + 화분) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.0, 0.008, -5.65]} receiveShadow>
          <planeGeometry args={[9.4, 1.9]} />
          <meshStandardMaterial color="#E6D5B8" roughness={0.45} />
        </mesh>

        {/* 새가족반 4인용 라운지 테이블 2세트 + 의자 8개 + 테이블 위 찻잔과 꽃병 */}
        {[-3.8, -1.0].map((tx, idx) => (
          <group key={`nf_set_${idx}`} position={[tx, 0, -5.65]}>
            {/* 라운드 원목 상판 & 원통 다리 */}
            <RoundedBox args={[1.55, 0.06, 0.78]} position={[0, 0.58, 0]} radius={0.03} castShadow receiveShadow>
              <meshStandardMaterial color="#FDFBF7" roughness={0.3} />
            </RoundedBox>
            {[-0.55, 0.55].map((lx, li) => (
              <mesh key={li} position={[lx, 0.29, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.56, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.6} />
              </mesh>
            ))}
            {/* 테이블 위 귀여운 핑크 꽃병 & 커피잔 2개 */}
            <mesh position={[0, 0.66, 0]} castShadow>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#F472B6" />
            </mesh>
            <mesh position={[-0.38, 0.64, 0.15]}>
              <cylinderGeometry args={[0.04, 0.035, 0.07, 12]} />
              <meshStandardMaterial color="#F59E0B" />
            </mesh>
            <mesh position={[0.38, 0.64, -0.15]}>
              <cylinderGeometry args={[0.04, 0.035, 0.07, 12]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>

            {/* 앞뒤 라운지 의자 4개 */}
            <DetailedChair position={[-0.42, 0, -0.52]} rotationY={0} seatColor="#A78BFA" />
            <DetailedChair position={[0.42, 0, -0.52]} rotationY={0} seatColor="#A78BFA" />
            <DetailedChair position={[-0.42, 0, 0.52]} rotationY={Math.PI} seatColor="#818CF8" />
            <DetailedChair position={[0.42, 0, 0.52]} rotationY={Math.PI} seatColor="#818CF8" />
          </group>
        ))}

        {/* 우측 코너 초록 관엽식물 화분 */}
        <group position={[2.1, 0, -6.1]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.16, 0.44, 16]} />
            <meshStandardMaterial color="#D97706" />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#16A34A" roughness={0.6} />
          </mesh>
        </group>

        {/* 새가족반 전면 내벽 & 환영 간판 */}
        <RoundedBox args={[5.4, 1.25, 0.16]} position={[-4.1, 0.62, -4.7]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <RoundedBox args={[2.0, 1.25, 0.16]} position={[1.8, 0.62, -4.7]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
        <Billboard position={[-0.2, 1.82, -4.7]}>
          <mesh>
            <planeGeometry args={[1.62, 0.76]} />
            <meshBasicMaterial map={signs.newFamily} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 📘 [방 2: 좌측 상단 '초등부 분반실'] (원형 모둠 테이블 2세트 + 원형 스툴 의자 8개 + 이젤 칠판) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.008, -2.0]} receiveShadow>
          <planeGeometry args={[3.7, 5.0]} />
          <meshStandardMaterial color="#DBEAFE" roughness={0.5} />
        </mesh>

        {[-3.2, -0.9].map((tz, i) => (
          <group key={`round_grp_${i}`} position={[-4.9, 0, tz]}>
            {/* 둥근 원형 테이블 */}
            <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.72, 0.72, 0.06, 32]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.10, 0.28, 0.54, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.5} />
            </mesh>
            {/* 테이블 위 성경책 */}
            <RoundedBox args={[0.24, 0.04, 0.18]} position={[0.15, 0.61, 0.1]} rotation={[0, 0.4, 0]} radius={0.008}>
              <meshStandardMaterial color="#2563EB" />
            </RoundedBox>
            {/* 동그란 키즈 스툴 의자 4개 */}
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, si) => (
              <group key={si} position={[Math.cos(ang) * 0.98, 0, Math.sin(ang) * 0.98]}>
                <mesh position={[0, 0.32, 0]} castShadow>
                  <cylinderGeometry args={[0.19, 0.19, 0.07, 20]} />
                  <meshStandardMaterial color={si % 2 === 0 ? '#38BDF8' : '#F472B6'} />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                  <cylinderGeometry args={[0.04, 0.12, 0.30, 12]} />
                  <meshStandardMaterial color="#E2E8F0" />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* 코너 화이트보드 칠판 */}
        <RoundedBox args={[0.08, 1.2, 1.4]} position={[-6.65, 0.75, -2.0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>

        <Billboard position={[-3.0, 1.82, -1.5]}>
          <mesh>
            <planeGeometry args={[1.62, 0.76]} />
            <meshBasicMaterial map={signs.elemLeft} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 👶 [방 3: 좌측 중단 '유아부'] (컬러 볼풀장 + 아기 미끄럼틀 + 꽃모양 원탁 + 파스텔 러그) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.9, 0.01, 1.85]} receiveShadow>
          <planeGeometry args={[3.7, 2.4]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.6} />
        </mesh>
        {/* 동그란 파스텔 핑크/민트 놀이 러그 2개 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.3, 0.015, 1.85]} receiveShadow>
          <circleGeometry args={[0.85, 32]} />
          <meshStandardMaterial color="#A7F3D0" />
        </mesh>

        {/* 귀여운 원형 볼풀장 (토러스 튜브 + 알록달록한 컬러 볼 구슬들!) */}
        <group position={[-5.75, 0, 1.45]}>
          <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.58, 0.14, 16, 32]} />
            <meshStandardMaterial color="#38BDF8" roughness={0.35} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.56, 24]} />
            <meshStandardMaterial color="#E0F2FE" />
          </mesh>
          {/* 볼풀장 안의 알록달록 구슬 12개 */}
          {[
            [-0.2, 0.12, -0.1, '#F43F5E'], [0.18, 0.14, -0.15, '#FACC15'], [0.0, 0.15, 0.12, '#4ADE80'],
            [-0.25, 0.13, 0.18, '#A855F7'], [0.24, 0.12, 0.15, '#FB923C'], [-0.05, 0.14, -0.24, '#38BDF8'],
            [0.12, 0.18, 0.0, '#F472B6'], [-0.15, 0.17, 0.04, '#FDE047']
          ].map(([bx, by, bz, bcol], bi) => (
            <mesh key={bi} position={[bx, by, bz]} castShadow>
              <sphereGeometry args={[0.095, 12, 12]} />
              <meshStandardMaterial color={bcol} roughness={0.25} />
            </mesh>
          ))}
        </group>

        {/* 유아용 미니 미끄럼틀 */}
        <group position={[-5.8, 0, 2.55]}>
          <RoundedBox args={[0.38, 0.55, 0.38]} position={[-0.35, 0.28, 0]} radius={0.03} castShadow>
            <meshStandardMaterial color="#FBBF24" />
          </RoundedBox>
          <RoundedBox args={[0.75, 0.06, 0.34]} position={[0.1, 0.26, 0]} rotation={[0, 0, -0.48]} radius={0.02} castShadow>
            <meshStandardMaterial color="#FB7185" />
          </RoundedBox>
        </group>

        {/* 꽃모양 유아 원탁 & 아기 의자 3개 */}
        <group position={[-4.2, 0, 1.85]}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.46, 0.05, 24]} />
            <meshStandardMaterial color="#F472B6" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.08, 0.22, 0.34, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {[0, 2.1, 4.2].map((ang, ai) => (
            <mesh key={ai} position={[Math.cos(ang) * 0.65, 0.18, Math.sin(ang) * 0.65]} castShadow>
              <cylinderGeometry args={[0.15, 0.13, 0.28, 16]} />
              <meshStandardMaterial color="#FDE047" />
            </mesh>
          ))}
        </group>

        {/* 유아부 남색 문 & 초록 덩굴 조화 */}
        <RoundedBox args={[0.14, 1.85, 0.82]} position={[-3.0, 0.92, 2.38]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.22, 0.88]} position={[-2.95, 1.88, 2.38]} radius={0.03}>
          <meshStandardMaterial color="#22C55E" />
        </RoundedBox>
        <Billboard position={[-3.0, 1.82, 1.4]}>
          <mesh>
            <planeGeometry args={[1.52, 0.72]} />
            <meshBasicMaterial map={signs.infant} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🪜 [방 4: 좌측 하단 '양방향(⇄) 계단실'] (유아부를 절대 침범하지 않는 U자형 계단!) */}
      {/* ================================================================= */}
      <CompactUStairwell6F
        position={[-4.9, 0, 4.75]}
        onClickStairs={() => onSelectZone(ZONES_6F[1])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '6F 소방안전 설비',
            title: '🧯 6F 계단실 코너 소화기',
            desc: '6층 계단실 코너에 비치된 초기 진화용 분말 소화기입니다.'
          })
        }
      />

      {/* ================================================================= */}
      {/* 🏫 [방 5: 우측 상단 '초등부 본관'] (다리 달린 책상 6세트 + 의자 12개 + 강대상 + 피아노) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, -3.3]} receiveShadow>
          <planeGeometry args={[3.9, 6.5]} />
          <meshStandardMaterial color="#E0F2FE" roughness={0.5} />
        </mesh>

        {/* 초등부 우드 강단 데크 & 원목 강대상 & 벽면 대형 스크린 */}
        <RoundedBox args={[3.4, 0.12, 1.2]} position={[4.8, 0.06, -5.8]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#E6B882" />
        </RoundedBox>
        <RoundedBox args={[0.85, 0.88, 0.48]} position={[4.8, 0.50, -5.65]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C88242" />
        </RoundedBox>
        <RoundedBox args={[2.3, 1.15, 0.08]} position={[4.8, 1.65, -6.45]} radius={0.02}>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>
        {/* 우측 코너 전자피아노 */}
        <RoundedBox args={[0.95, 0.68, 0.34]} position={[6.1, 0.40, -5.5]} rotation={[0, -0.3, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>

        {/* 초등부 2열 x 3줄 학생 책상 & 등받이 의자 12석 (박스 탈피!) */}
        {[-4.3, -3.0, -1.7].map((dz, rIdx) =>
          [3.95, 5.65].map((dx, cIdx) => (
            <group key={`el_desk_${rIdx}_${cIdx}`} position={[dx, 0, dz]}>
              {/* 책상 상판 + 네 모서리 철제 다리 */}
              <RoundedBox args={[1.25, 0.05, 0.52]} position={[0, 0.58, 0]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
              </RoundedBox>
              {[[-0.54, -0.2], [0.54, -0.2], [-0.54, 0.2], [0.54, 0.2]].map(([lx, lz], li) => (
                <mesh key={li} position={[lx, 0.29, lz]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.56, 8]} />
                  <meshStandardMaterial color="#94A3B8" metalness={0.6} />
                </mesh>
              ))}
              {/* 책상 위 성경책/공책 */}
              <RoundedBox args={[0.22, 0.03, 0.16]} position={[-0.28, 0.62, 0]} radius={0.005}>
                <meshStandardMaterial color="#38BDF8" />
              </RoundedBox>
              <RoundedBox args={[0.22, 0.03, 0.16]} position={[0.28, 0.62, 0]} radius={0.005}>
                <meshStandardMaterial color="#FACC15" />
              </RoundedBox>
              {/* 학생용 의자 2개 */}
              <DetailedChair position={[-0.30, 0, 0.42]} rotationY={Math.PI} seatColor="#0284C7" />
              <DetailedChair position={[0.30, 0, 0.42]} rotationY={Math.PI} seatColor="#0284C7" />
            </group>
          ))
        )}

        {/* 초등부 유리 자동문 */}
        <mesh position={[2.8, 1.05, -2.0]}>
          <boxGeometry args={[0.08, 2.1, 1.35]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.55} />
        </mesh>
        <Billboard position={[2.8, 1.95, -2.0]}>
          <mesh>
            <planeGeometry args={[1.68, 0.78]} />
            <meshBasicMaterial map={signs.elemRight} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🎨 [방 6: 우측 중단 '유치부'] (무지개 아치 무대 + 반원형 교탁 + 키즈 스툴 6개) */}
      {/* ================================================================= */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 1.4]} receiveShadow>
          <planeGeometry args={[3.9, 2.7]} />
          <meshStandardMaterial color="#FCE7F3" roughness={0.5} />
        </mesh>

        {/* 동쪽 벽면 귀여운 무지개 아치형 율동 무대 */}
        <group position={[6.55, 0, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0.04, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.9, 32, 0, Math.PI]} />
            <meshStandardMaterial color="#FEF08A" />
          </mesh>
          {[
            [0.85, '#EF4444'],
            [0.73, '#FACC15'],
            [0.61, '#22C55E'],
            [0.49, '#38BDF8']
          ].map(([rad, col], ri) => (
            <mesh key={ri} position={[0, 0.55, 0]}>
              <torusGeometry args={[rad, 0.06, 12, 32, Math.PI]} />
              <meshStandardMaterial color={col} />
            </mesh>
          ))}
        </group>

        {/* 유치부 원형 테이블 & 알록달록 키즈 스툴 의자 6개 */}
        <group position={[4.5, 0, 1.4]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.68, 0.06, 32]} />
            <meshStandardMaterial color="#F472B6" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.12, 0.28, 0.42, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {[0, 1.05, 2.1, 3.14, 4.2, 5.25].map((ang, ki) => (
            <mesh
              key={ki}
              position={[Math.cos(ang) * 0.95, 0.22, Math.sin(ang) * 0.95]}
              castShadow
            >
              <cylinderGeometry args={[0.17, 0.15, 0.34, 20]} />
              <meshStandardMaterial color={['#FACC15', '#38BDF8', '#4ADE80', '#FB7185', '#A78BFA', '#FB923C'][ki]} />
            </mesh>
          ))}
        </group>

        {/* 복도 쪽 4단 컬러 어린이 신발장 */}
        <RoundedBox args={[0.36, 0.92, 1.05]} position={[2.55, 0.46, 0.35]} radius={0.02} castShadow>
          <meshStandardMaterial color="#E5D3B3" />
        </RoundedBox>
        <Billboard position={[2.8, 1.82, 1.3]}>
          <mesh>
            <planeGeometry args={[1.52, 0.72]} />
            <meshBasicMaterial map={signs.kinder} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🚻 [방 7: 우측 하단 '초디테일 미니어처 화장실'] (박스 완전 제거! 세면대 3기 + 거울 + 양변기 4기) */}
      {/* ================================================================= */}
      <group>
        {/* 깔끔한 밝은 테라조 타일 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, 4.6]} receiveShadow>
          <planeGeometry args={[3.9, 3.5]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
        </mesh>

        {/* 1) 좌측 세면대 파우더룸 카운터 + 대형 거울 + 원형 도자기 세면대 보울 3개 + 은색 수전 */}
        <group position={[3.35, 0, 4.85]}>
          {/* 대리석 세면대 상판 */}
          <RoundedBox args={[0.58, 0.72, 2.1]} position={[0, 0.36, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </RoundedBox>
          {/* 벽면 하늘색 빛 반사 대형 거울 */}
          <RoundedBox args={[0.04, 0.85, 1.95]} position={[-0.26, 1.18, 0]} radius={0.01}>
            <meshStandardMaterial color="#BAE6FD" metalness={0.85} roughness={0.1} />
          </RoundedBox>
          {/* 원형 세면대 보울 3개 & 수도꼭지 */}
          {[-0.65, 0.0, 0.65].map((sz, si) => (
            <group key={`sink_${si}`} position={[0.04, 0.74, sz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.18, 0.14, 0.09, 24]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.14, 0.12, 0.02, 20]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              {/* 은색 수전 */}
              <mesh position={[-0.18, 0.08, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 2) 위쪽 2칸: 남자 화장실 오픈형 큐비클 부스 + 내부 양변기 2기 */}
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`m_stall_${bi}`} position={[5.25 + bx, 0, 3.55]}>
            {/* 칸막이 측벽 */}
            <RoundedBox args={[0.06, 1.15, 1.1]} position={[-0.52, 0.58, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#93C5FD" roughness={0.4} />
            </RoundedBox>
            {/* 약간 열려 있는 파스텔 블루 화장실 문 */}
            <RoundedBox args={[0.82, 1.05, 0.05]} position={[0, 0.55, 0.52]} rotation={[0, 0.25, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#60A5FA" roughness={0.4} />
            </RoundedBox>
            {/* 내부 초디테일 백색 도자기 양변기 */}
            <DetailedMiniatureToilet position={[0, 0, -0.12]} rotationY={0} />
          </group>
        ))}

        {/* 남/여 구역 중앙 분리 파티션 벽 */}
        <RoundedBox args={[2.3, 1.22, 0.10]} position={[5.35, 0.61, 4.55]} radius={0.01} castShadow>
          <meshStandardMaterial color="#CBD5E1" />
        </RoundedBox>

        {/* 3) 아래쪽 2칸: 여자 화장실 오픈형 큐비클 부스 + 내부 양변기 2기 */}
        {[-0.55, 0.55].map((bx, bi) => (
          <group key={`f_stall_${bi}`} position={[5.25 + bx, 0, 5.65]}>
            <RoundedBox args={[0.06, 1.15, 1.1]} position={[-0.52, 0.58, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#FBCFE8" roughness={0.4} />
            </RoundedBox>
            {/* 약간 열려 있는 파스텔 핑크 화장실 문 */}
            <RoundedBox args={[0.82, 1.05, 0.05]} position={[0, 0.55, -0.52]} rotation={[0, -0.25, 0]} radius={0.01} castShadow>
              <meshStandardMaterial color="#F472B6" roughness={0.4} />
            </RoundedBox>
            {/* 내부 초디테일 백색 도자기 양변기 */}
            <DetailedMiniatureToilet position={[0, 0, 0.12]} rotationY={Math.PI} />
          </group>
        ))}

        <Billboard position={[2.8, 1.82, 3.8]}>
          <mesh>
            <planeGeometry args={[1.52, 0.72]} />
            <meshBasicMaterial map={signs.restroom} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🛗 [구역 8: 하단 정중앙 '6F 엘리베이터 홀'] */}
      {/* ================================================================= */}
      <group position={[0, 0, 5.9]}>
        <RoundedBox args={[3.4, 2.4, 0.35]} position={[0, 1.2, 0.3]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#C8B9A6" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.5, 2.05, 0.08]} position={[0, 1.02, 0.1]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        {['#EF4444', '#FACC15', '#3B82F6', '#F97316', '#10B981', '#EC4899'].map((col, idx) => (
          <mesh key={idx} position={[-0.65 + idx * 0.26, 2.15, 0.06]}>
            <coneGeometry args={[0.11, 0.22, 3]} />
            <meshStandardMaterial color={col} />
          </mesh>
        ))}
        <mesh position={[0, 0.015, -0.45]}>
          <boxGeometry args={[1.2, 0.02, 0.35]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
        <RoundedBox args={[0.46, 1.25, 0.46]} position={[-1.35, 0.62, -0.1]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <Billboard position={[0, 2.55, 0]}>
          <mesh>
            <planeGeometry args={[1.68, 0.76]} />
            <meshBasicMaterial map={signs.elevator} transparent />
          </mesh>
        </Billboard>
      </group>

      {/* ================================================================= */}
      {/* 🧱 방 경계 반높이 디오라마 내벽 (1.20m) */}
      {/* ================================================================= */}
      <RoundedBox args={[0.16, 1.20, 2.0]} position={[-3.0, 0.60, 0.3]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 2.2]} position={[-3.0, 0.60, -3.5]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 0.6]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      {/* 유아부와 계단실을 완벽히 분리하는 가로 내벽! */}
      <RoundedBox args={[3.8, 1.20, 0.16]} position={[-4.9, 0.60, 3.15]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      <RoundedBox args={[0.16, 1.20, 3.6]} position={[2.8, 0.60, -4.8]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.6]} position={[2.8, 0.60, -0.3]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[0.16, 1.20, 1.2]} position={[2.8, 0.60, 2.6]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" />
      </RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 0.0]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>
      <RoundedBox args={[4.0, 1.20, 0.16]} position={[4.8, 0.60, 2.8]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial color="#E2E8F0" />
      </RoundedBox>

      <SmartCutawayWall6F wallSide="north">
        <RoundedBox args={[14.4, 2.4, 0.24]} position={[0, 1.2, -6.7]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="west">
        <RoundedBox args={[0.24, 2.4, 13.6]} position={[-7.0, 1.2, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>
      <SmartCutawayWall6F wallSide="east">
        <RoundedBox args={[0.24, 2.4, 13.6]} position={[7.0, 1.2, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </SmartCutawayWall6F>

      {/* 살아 움직이며 대화하는 6층 교사 & 어린이 NPC들 */}
      {NPCS_6F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx || idx === (activeNpcChatIdx + 1) % NPCS_6F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;

        return (
          <SmoothChibiAvatar6F
            key={npc.id}
            position={[npc.x, 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSkirt={Boolean(npc.isSkirt)}
            autoWave={Boolean(npc.autoWave)}
            shirtColor={npc.shirt}
            pantsColor={npc.pants}
            hairColor={npc.hair}
            speechBubbleText={msg}
            seedOffset={idx * 1.5}
          />
        );
      })}

      {/* 8대 상호작용 마커 (01 ~ 08) */}
      {ZONES_6F.map((z) => (
        <HologramMarker6F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={onSelectZone}
        />
      ))}
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 플레이어 아바타 컨트롤러
// =====================================================================
function PlayerController6F({ waypoints, playerName, emote, onPositionUpdate }) {
  const posRef = useRef([0.0, 0, 3.6]);
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [0.0, 0, 3.6],
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
      posRef.current = [nx, 0, nz];
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
    <SmoothChibiAvatar6F
      position={renderState.pos}
      rotationY={renderState.rotY}
      isWalking={renderState.walking}
      hasSunglasses={true}
      emote={emote}
      shirtColor="#FACC15"
      pantsColor="#0284C7"
      hairColor="#EAB308"
      nameTagTexture={nameTagTex}
    />
  );
}

function InitialCameraSetup6F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(0, 14.5, 13.5);
      camera.fov = 42;
    } else {
      camera.position.set(0, 11.8, 11.2);
      camera.fov = 36;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.4, 0.2);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function Education6F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);

  const [waypoints, setWaypoints] = useState([[0.0, 3.6]]);
  const [activeZone, setActiveZone] = useState(ZONES_6F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_6F.length);
    }, 3600);
    return () => {
      clearInterval(timer);
      togglePraiseBgm6F(false);
    };
  }, []);

  const handleWalkTo = useCallback((tx, tz) => {
    const cur = waypoints[waypoints.length - 1] || [0, 3.6];
    const nextPath = computePath6F(cur[0], cur[1], tx, tz);
    setWaypoints(nextPath);
  }, [waypoints]);

  // 우측 상단 미니맵 렌더링 ('6F 실제 도면 맵')
  useEffect(() => {
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E2026';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(8, 6, 62, 16);
    ctx.fillStyle = '#0369A1';
    ctx.fillRect(72, 6, 34, 42);
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(8, 24, 28, 30);
    ctx.fillStyle = '#B45309';
    ctx.fillRect(8, 56, 28, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 74, 28, 16);
    ctx.fillStyle = '#9D174D';
    ctx.fillRect(72, 50, 34, 18);
    ctx.fillStyle = '#475569';
    ctx.fillRect(72, 70, 34, 20);
    ctx.fillStyle = '#059669';
    ctx.fillRect(42, 76, 24, 14);

    const cur = waypoints[waypoints.length - 1] || [0, 3.6];
    const mx = ((cur[0] + 7) / 14) * w;
    const my = ((cur[1] + 6.8) / 13.6) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints]);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_6F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
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
      {/* 1. 좌측 상단: 6층 헤더 & 찬양 BGM / 시점 초기화 */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div
          onClick={onExitHome}
          style={darkPillStyle}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-md shadow-2xl border flex items-center gap-3 cursor-pointer"
        >
          <span style={{ color: '#FFFFFF' }} className="text-sm sm:text-lg font-black tracking-tight">
            ◀ 6F 다음세대 교육관 · 새가족반
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              const next = !isMusicOn;
              setIsMusicOn(next);
              togglePraiseBgm6F(next);
            }}
            style={darkPillStyle}
            className="px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold border shadow-xl cursor-pointer"
          >
            <span style={{ color: isMusicOn ? '#F472B6' : '#FFFFFF' }}>
              {isMusicOn ? '🎵 어린이 찬양 BGM 켜짐' : '🔇 찬양 BGM 켜기'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!controlsRef.current) return;
              controlsRef.current.object.position.set(0, 11.8, 11.2);
              controlsRef.current.target.set(0, 0.4, 0.2);
              controlsRef.current.update();
            }}
            style={darkPillStyle}
            className="px-3 py-1.5 sm:py-2 rounded-full text-[11px] font-bold border shadow-xl cursor-pointer"
          >
            <span style={{ color: '#93C5FD' }}>🎥 도면 전체뷰</span>
          </button>
        </div>
      </div>

      {/* 2. 우측 상단: 6F 도면 미니맵 & 부서 바로가기 버튼 */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div style={darkPillStyle} className="p-2 rounded-2xl border shadow-2xl flex flex-col items-center">
          <canvas ref={minimapRef} width={114} height={96} className="rounded-xl" />
          <span style={{ color: '#FFFFFF' }} className="text-[10.5px] font-extrabold mt-1">
            6F 실제 도면 맵
          </span>
        </div>

        <div
          style={darkPillStyle}
          className="p-1.5 rounded-2xl border shadow-xl flex flex-col gap-1 w-36 max-h-[44vh] overflow-y-auto hide-scrollbar"
        >
          {ZONES_6F.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                const dest = z.roomTarget || [z.pos[0], z.pos[2]];
                handleWalkTo(dest[0], dest[1]);
                setActiveZone(z);
                setModalZone(z);
              }}
              className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left text-[11px] font-extrabold flex items-center justify-between cursor-pointer"
            >
              <span style={{ color: '#FFFFFF' }} className="truncate">{z.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 하단 중앙: 6층 5대 부서 바로가기 캡슐 독 바 */}
      <div className="absolute bottom-14 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-3 pointer-events-auto max-w-[96vw] overflow-x-auto hide-scrollbar px-2 py-1">
        {[
          { icon: '👶', label: '유아부', sub: '(좌측)', zone: ZONES_6F[2] },
          { icon: '🎨', label: '유치부', sub: '(우측)', zone: ZONES_6F[6] },
          { icon: '🏫', label: '초등부', sub: '(좌·우)', zone: ZONES_6F[5] },
          { icon: '🤝', label: '새가족반', sub: '(상단)', zone: ZONES_6F[4] },
          { icon: '🛗', label: '층별 이동', sub: '(엘베)', zone: ZONES_6F[0] }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              const dest = item.zone.roomTarget || [item.zone.pos[0], item.zone.pos[2]];
              handleWalkTo(dest[0], dest[1]);
              setActiveZone(item.zone);
              setModalZone(item.zone);
            }}
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

      {/* 4. 메인 3D 캔버스 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <PerspectiveCamera makeDefault position={[0, 11.8, 11.2]} fov={36} near={0.1} far={250} />
        <InitialCameraSetup6F controlsRef={controlsRef} />

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
          <planeGeometry args={[14.2, 13.6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SixFloorMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            const dest = z.roomTarget || [z.pos[0], z.pos[2]];
            handleWalkTo(dest[0], dest[1]);
            setModalZone(z);
          }}
          activeNpcChatIdx={activeNpcChatIdx}
        />

        <PlayerController6F
          waypoints={waypoints}
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
          minDistance={3.0}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 부서 상세 안내 & 층간 이동 모달 */}
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

            {modalZone.schedule && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="p-3 rounded-2xl border border-white/10 text-xs flex justify-between">
                <span style={{ color: '#9CA3AF' }} className="font-bold">모임 시간 및 위치</span>
                <span style={{ color: '#FCD34D' }} className="font-black">{modalZone.schedule}</span>
              </div>
            )}

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span style={{ color: '#34D399' }} className="text-xs font-bold block">🛗 이동하실 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 야외 주차장' },
                  { fl: '3F', label: '3F 대예배당 (본당)' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반 (현재 층)' }
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
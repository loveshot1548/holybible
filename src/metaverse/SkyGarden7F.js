// src/metaverse/SkyGarden7F.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, ContactShadows, Billboard, Sky } from '@react-three/drei';
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
// 🔔 사운드 신시사이저 (엘리베이터 차임벨 · 축도 홀리라이트)
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
// 🎨 고해상도 건축 시각화(ArchViz) 프로시저럴 텍스처 엔진
// =====================================================================
function makeCanvasTexture(drawFn, width = 512, height = 256, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

// 🏢 image_864f03.jpg & image_864ee5.jpg 완벽 고증: 현대 하이엔드 아파트 입면 텍스처
function makeArchVizApartmentTexture(frameHex = '#F8FAFC', accentHex = '#475569', isNight = false) {
  return makeCanvasTexture((ctx, w, h) => {
    // 베이스 콘크리트/알루미늄 루버 패널
    ctx.fillStyle = frameHex;
    ctx.fillRect(0, 0, w, h);

    // 좌우 수직 다크 그레이 코어 밴드 (image_864ee5.jpg 특유의 투톤 수직 라인)
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 0, 36, h);
    ctx.fillRect(w - 36, 0, 36, h);
    ctx.fillRect(w * 0.48, 0, 20, h);

    const floors = 18;
    const cols = 6;
    const fH = h / floors;
    const cW = (w - 84) / cols;

    for (let r = 0; r < floors; r++) {
      const y = r * fH;
      // 층간 화이트 수평 슬래브 띠
      ctx.fillStyle = frameHex;
      ctx.fillRect(32, y, w - 64, 5);

      for (let c = 0; c < cols; c++) {
        const x = 42 + c * cW + (c >= 3 ? 12 : 0);
        const isLit = isNight && ((r * 11 + c * 7) % 5 === 0 || (r + c) % 6 === 0);

        // 통유리 커튼월 & 발코니 유리창 (낮에는 깊이감 있는 다크 슬레이트 블루/차콜)
        const glassGrad = ctx.createLinearGradient(x, y + 6, x + cW - 10, y + fH - 3);
        if (isLit) {
          glassGrad.addColorStop(0, '#FEF08A');
          glassGrad.addColorStop(1, '#F59E0B');
        } else {
          glassGrad.addColorStop(0, '#1E293B');
          glassGrad.addColorStop(0.5, '#334155');
          glassGrad.addColorStop(1, '#0F172A');
        }
        ctx.fillStyle = glassGrad;
        ctx.fillRect(x + 3, y + 6, cW - 10, fH - 8);

        // 유리 난간 수평 바 & 세로 창살
        ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
        ctx.fillRect(x + 3, y + fH * 0.62, cW - 10, 2);
        ctx.fillRect(x + (cW - 10) / 2, y + 6, 2, fH - 8);
      }
    }
  }, 512, 1024);
}

// ☀️ image_864f03.jpg 완벽 고증: 옥상 태양광 발전 모듈(Solar Panel Grid) 텍스처
function makeSolarPanelRoofTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(10, 10, w - 20, h - 20);

    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 3;
    const rows = 4;
    const cols = 6;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(10, 10 + (r * (h - 20)) / rows);
      ctx.lineTo(w - 10, 10 + (r * (h - 20)) / rows);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(10 + (c * (w - 20)) / cols, 10);
      ctx.lineTo(10 + (c * (w - 20)) / cols, h - 10);
      ctx.stroke();
    }
  }, 256, 256);
}

// ⛪ 좋은나무교회 우측 코발트블루 유리 커튼월 타워 텍스처
function makeBlueCurtainWallTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0284C7');
    grad.addColorStop(0.45, '#1D4ED8');
    grad.addColorStop(0.8, '#0369A1');
    grad.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(0, h * 0.62);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 5;
    for (let x = 0; x <= w; x += w / 3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += h / 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, 256, 1024);
}

// 🌍 교회 좌측 외벽 대형 세계지도 선교 벽화 텍스처
function makeWorldMissionMuralTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#27272A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.fillStyle = '#52525B';
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.42, 110, 58, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.66, 45, 52, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.24, h * 0.36, 48, 44, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.30, h * 0.72, 34, 48, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E4E4E7';
    ctx.font = '900 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('온 열방에 복음을 전하는 좋은나무교회', w / 2, h - 26);
  }, 512, 360);
}

function makeWoodDeckTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#8C5832';
    ctx.fillRect(0, 0, w, h);
    const slats = 16;
    const sH = h / slats;
    for (let i = 0; i < slats; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#9A633A' : '#7D4E2B';
      ctx.fillRect(0, i * sH, w, sH - 3);
      ctx.fillStyle = '#3E2411';
      ctx.fillRect(0, (i + 1) * sH - 3, w, 3);
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
  }, 256, 256);
}

function makeRoomSignTexture(title, subTitle, badgeColor = '#10B981') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(12, 12, w - 24, h - 24, 34);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = badgeColor;
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subTitle, w / 2, 54);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px sans-serif';
    ctx.fillText(title, w / 2, 122);
  }, 440, 175);
}

// =====================================================================
// 📍 7층 하늘정원 & 펜트하우스 홀 6대 인터랙션 존 정의
// =====================================================================
const ZONES_7F = [
  {
    id: 'zone_7f_elev',
    code: '01',
    subCode: '7F엘베',
    name: '7F 옥상 펜트하우스 엘리베이터 & 계단 홀',
    prompt: '01 엘리베이터 탑승 (1F~6F 전 층 이동)',
    pos: [3.2, 0, -2.4],
    isElevator: true,
    badge: '01 7F 엘리베이터·계단',
    title: '🛗 7층 하늘정원 펜트하우스 엘리베이터 & 계단 홀',
    desc: '6층 교육관에서 올라오면 처음 도착하는 7층 실내 코어 홀입니다. 스테인리스 자동 개폐 엘리베이터와 계단실을 통해 1F~6F 모든 층으로 즉시 이동할 수 있습니다.'
  },
  {
    id: 'zone_7f_wreath',
    code: '02',
    subCode: '축하화환',
    name: '좋은나무교회 축하 3단 화환 & 비품 코너',
    prompt: '02 좋은나무교회 축하 화환 보기',
    pos: [4.2, 0, 0.2],
    badge: '02 축하화환 코너',
    title: '🌺 좋은나무교회 창립·입당 축하 3단 화환 코너',
    desc: '7층 계단실 옆에 보관된 좋은나무교회 축하 화환과 성전 관리 비품들이 정갈하게 놓여 있는 공간입니다.'
  },
  {
    id: 'zone_7f_passage_door',
    code: '03',
    subCode: '하늘정원통로',
    name: '옥상 야외 하늘정원 연결 통로 & 자동 개폐문',
    prompt: '03 문 열고 야외 하늘정원으로 나가기',
    pos: [1.6, 0, -0.5],
    isPassageDoor: true,
    badge: '03 하늘정원 출입통로',
    title: '🚪 7층 실내 코어 ➔ 야외 하늘정원 연결 통로',
    desc: '엘리베이터 홀에서 이 통로 문을 지나면 탁 트인 7층 야외 하늘정원과 김포 한강신도시(마산동) 파노라마 조감도가 펼쳐집니다!'
  },
  {
    id: 'zone_7f_pergola',
    code: '04',
    subCode: '파고라쉼터',
    name: '하늘정원 원목 파고라(Pergola) & 스트링라이트 라운지',
    prompt: '04 파고라 벤치에 앉아 커피 마시며 담소 나누기',
    pos: [-1.4, 0, -1.2],
    seatTarget: { x: -1.4, z: -1.65, rotY: 0, rowLabel: '7F 하늘정원 파고라 원목 벤치석' },
    isSeatZone: true,
    badge: '04 파고라 가든 라운지',
    title: '🌿 루프탑 원목 파고라 & 에디슨 전구 힐링 쉼터',
    desc: '따뜻한 웜화이트 스트링 라이트가 반짝이는 원목 파고라 아래에서 성도님들과 시원한 바람을 맞으며 차와 담소를 나누는 쉼터입니다.'
  },
  {
    id: 'zone_7f_observatory',
    code: '05',
    subCode: '전망대·망원경',
    name: '북쪽 김포한강8로 & 한강신도시 마스터플랜 전망대',
    prompt: '05 전망 망원경으로 교회 전경 & 주변 도시 조감도 보기',
    pos: [-1.2, 0, 3.6],
    isObservatory: true,
    badge: '05 한강신도시 전망대',
    title: '🔭 김포한강8로 & 주변 대단지 아파트·학교·공원 3D 조감도 전망대',
    desc: '전망 망원경을 클릭하면 카메라가 마스터플랜 드론 조감도로 전환되어 우리 좋은나무교회 전체 외관과 건너편 경남아너스빌, 동일스위트, e편한세상, 은여울중학교, 은여울공원 수목원을 한눈에 조망합니다!'
  },
  {
    id: 'zone_7f_prayer_cross',
    code: '06',
    subCode: '옥상기도처',
    name: '옥상 십자가 첨탑 아래 중보기도단 & 목사님 축도',
    prompt: '06 하늘정원에서 목사님 축도(홀리라이트) 받기',
    pos: [-4.2, 0, 1.8],
    isBlessingZone: true,
    badge: '06 하늘정원 기도·축도처',
    title: '✝️ 김포 땅과 열방을 품고 기도하는 하늘정원 축도처',
    desc: '이성현·방희곤·최수경 목사님과 함께 김포 한강신도시의 복음화와 가정을 위해 기도하며 하늘에서 내려오는 황금빛 축도(홀리라이트)를 받는 은혜의 자리입니다.'
  }
];

// =====================================================================
// 🚧 7층 옥상 난간 & 펜트하우스 벽체 물리 충돌(AABB) 및 통로 통과 네비게이션
// =====================================================================
const SOLID_WALL_BOXES_7F = [
  { minX: 1.75, maxX: 2.15, minZ: -4.5, maxZ: -1.38 },
  { minX: 1.75, maxX: 2.15, minZ: 0.38, maxZ: 2.2 },
  { minX: 1.8, maxX: 5.5, minZ: 1.85, maxZ: 2.25 },
  { minX: 2.4, maxX: 4.3, minZ: -4.4, maxZ: -3.1 }
];

function resolveCollision7F(nx, nz, radius = 0.28) {
  let x = Math.max(-5.6, Math.min(4.8, nx));
  let z = Math.max(-3.9, Math.min(4.1, nz));

  for (const box of SOLID_WALL_BOXES_7F) {
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

function computeSmartPath7F(sx, sz, rawEx, rawEz) {
  const [ex, ez] = resolveCollision7F(rawEx, rawEz);
  const startInside = sx > 1.95 && sz < 2.0;
  const endInside = ex > 1.95 && ez < 2.0;

  if (startInside !== endInside) {
    return [
      [2.5, -0.5],
      [1.2, -0.5],
      [ex, ez]
    ];
  }
  return [[ex, ez]];
}

// =====================================================================
// 👥 7층 하늘정원 목사님 & 성도 NPC 데이터
// =====================================================================
const NPCS_7F = [
  {
    id: 'pastor_lee_7f',
    name: '이성현 담임목사님 (하늘정원)',
    role: '좋은나무교회 담임목사 · 도시 축복기도',
    isPastor: true,
    canBless: true,
    x: -3.2,
    y: 0,
    z: 2.6,
    rotY: 0.25,
    gender: 'male',
    hairStyle: 'parted',
    shirt: '#1E293B',
    pants: '#0F172A',
    hair: '#18181B',
    dialogues: [
      '할렐루야! 7층 하늘정원에서 내려다보는 김포 한강신도시 마스터플랜 전경이 참 웅장하지요? 🌿',
      '저 건너편 경남아너스빌과 동일스위트, e편한세상, 은여울중학교의 모든 가정에 주님의 평강이 임하길 기도합니다 ✝️',
      '저를 클릭하시면 하늘정원의 축복을 담아 [✨ 거룩한 축도(홀리라이트)]를 내려드립니다 🙏'
    ]
  },
  {
    id: 'pastor_bang_7f',
    name: '방희곤 목사님',
    role: '좋은나무교회 목사 · 축도 사역',
    isPastor: true,
    canBless: true,
    x: -0.6,
    y: 0,
    z: -1.65,
    rotY: 0,
    seated: true,
    gender: 'male',
    hairStyle: 'short',
    shirt: '#0284C7',
    pants: '#1E293B',
    hair: '#27272A',
    dialogues: [
      '옥상 파고라 그늘 아래 앉아 솔솔 부는 바람을 맞으며 성도님들과 교제하니 참 평안합니다 ☕',
      '언제든 축도와 중보기도가 필요하시면 말씀해 주세요!'
    ]
  },
  {
    id: 'pastor_choi_7f',
    name: '최수경 목사님',
    role: '좋은나무교회 목사 · 축도 사역',
    isPastor: true,
    canBless: true,
    x: -2.2,
    y: 0,
    z: -1.65,
    rotY: 0,
    seated: true,
    gender: 'female',
    hairStyle: 'bob',
    isSkirt: true,
    shirt: '#8B5CF6',
    pants: '#EDE9FE',
    hair: '#3F2305',
    dialogues: [
      '상단의 [🦅 마스터플랜 드론 조감도] 버튼을 눌러보세요! 현대 건축 조감도처럼 우리 교회와 주변 아파트 단지가 한눈에 펼쳐져요 🥰'
    ]
  },
  {
    id: 'member_7f_1',
    name: '김권사 (정원가꾸기)',
    role: '하늘정원 원예봉사팀',
    x: 0.4,
    y: 0,
    z: 2.2,
    patrolZ: [-0.2, 2.8],
    gender: 'female',
    hairStyle: 'bun',
    isSkirt: true,
    autoWave: true,
    shirt: '#EC4899',
    pants: '#FCE7F3',
    hair: '#451A03',
    dialogues: [
      '아파트 옥상마다 태양광 패널과 에코 잔디 정원이 올라가 있고 단지 산책로까지 진짜 조감도 같네요! 🌺🌿'
    ]
  }
];

// =====================================================================
// ✨ 축도(Benediction) 시 하늘에서 내려쬐는 홀리라이트(Holy Light) 이펙트
// =====================================================================
function HolyLightBeamEffect7F({ targetPos, pastorName, targetName }) {
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
      ctx.fillText(`✝️ ${pastorName || '목사님'}의 7F 하늘정원 축도`, w / 2, 46);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 27px serif';
      ctx.fillText(`${targetName} 성도님과 김포 땅 위에 하나님의 크신 은혜와`, w / 2, 88);
      ctx.fillText(`하늘의 신령한 복이 영원토록 함께할지어다! 아멘 🙏`, w / 2, 126);
    }, 640, 156);
  }, [pastorName, targetName]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      beamRef.current.scale.set(pulse, 1, pulse);
      beamRef.current.material.opacity = 0.38 + Math.sin(t * 4) * 0.08;
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
    <group position={[targetPos[0], 0.05, targetPos[2]]}>
      <mesh ref={beamRef} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.92, 0.65, 6.4, 32, 1, true]} />
        <meshBasicMaterial
          color="#FDE047"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.38, 0.28, 6.4, 24, 1, true]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
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
          const rad = 0.36 + (i % 3) * 0.12;
          const py = (i / 12) * 2.2;
          return (
            <mesh key={i} position={[Math.cos(ang) * rad, py, Math.sin(ang) * rad]}>
              <sphereGeometry args={[0.042, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#FFFFFF' : '#FDE047'} />
            </mesh>
          );
        })}
      </group>

      <pointLight position={[0, 2.6, 0]} intensity={5.5} distance={6.5} color="#FDE047" />

      <Billboard position={[0, 2.35, 0]}>
        <mesh renderOrder={30}>
          <planeGeometry args={[2.5, 0.62]} />
          <meshBasicMaterial map={blessingBannerTex} transparent depthTest={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🟢 바닥 초록색 홀로그램 마커
// =====================================================================
function HologramMarker7F({ zone, isSelected, onSelect }) {
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
        ctx.roundRect(w / 2 + 24, h / 2 + 6, 118, 44, 14);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 83, h / 2 + 28);
      }
    }, 365, 220);
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
// 🚶‍♀️ 전 층 통일 유선형(Sphere/Capsule) 아바타
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

function CharacterHairStyle7F({ style = 'short', hairColor = '#27272A' }) {
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

function SmoothChibiAvatar7F({
  position = [0, 0, 0],
  targetPosition = null,
  patrolZ = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
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
        leftLegRef.current.position.set(-0.085, 0.24, 0.11);
        rightLegRef.current.position.set(0.085, 0.24, 0.11);
      } else if (emote === 'dance') {
        const kick = Math.sin(t * 14.0) * 0.65;
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
      if (emote === 'bless' || emote === 'praise') {
        leftArmRef.current.rotation.x = -2.35 + Math.sin(t * 6) * 0.15;
        rightArmRef.current.rotation.x = -2.35 - Math.sin(t * 6) * 0.15;
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
      } else if (emote === 'wave' || autoWave || (patrolZ && !walkingNow)) {
        rightArmRef.current.rotation.z = -2.35 + Math.sin(t * 10) * 0.32;
        rightArmRef.current.rotation.x = 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.42;
        rightArmRef.current.rotation.x = -0.42;
      } else if (walkingNow) {
        const sw = Math.sin(t * 9.5) * 0.48;
        leftArmRef.current.rotation.x = -sw;
        rightArmRef.current.rotation.x = sw;
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
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce + jump;
      rootRef.current.position.z = isSeated ? 0.04 : 0;
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
        <group ref={leftLegRef} position={[-0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.085, 0.22, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 12, 16]} />
            <meshStandardMaterial color={isFemale ? skinColor : pantsColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.0, 0.7, 1.35]} castShadow>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={isFemale ? '#881337' : '#18181B'} roughness={0.4} />
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
          <CharacterHairStyle7F
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

function RemoteMultiplayerAvatar7F({ peer, onClickPeer }) {
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

  return (
    <SmoothChibiAvatar7F
      position={[peer.x || 2.8, 0, peer.z || -0.5]}
      targetPosition={[peer.x || 2.8, 0, peer.z || -0.5]}
      rotationY={peer.rotY || 0}
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
// 🏙️ [조감도 `image_864f03.jpg` & `image_864ee5.jpg` 완벽 고증!]
// 현대 한국 브랜드 대단지 아파트 타워 (수직 핀 프레임 + 태양광 패널/옥상 녹화 루프탑 + L자/판상형/타워형 매스)
// =====================================================================
function ModernArchVizApartmentTower({
  position,
  rotationY = 0,
  width = 9.2,
  depth = 3.2,
  height = 26.0,
  wingWidth = 0,
  wingDepth = 0,
  roofType = 'solar', // 'solar' (image_864f03) | 'green' (image_864ee5)
  facadeTex,
  solarTex
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 1~2층 화강석 석재 포디움 기단 & 필로티 로비 */}
      <RoundedBox args={[width + 0.3, 2.2, depth + 0.3]} position={[0, 1.1, 0]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#D6D3D1" roughness={0.5} />
      </RoundedBox>

      {/* 메인 아파트 타워 코어 */}
      <mesh position={[0, height / 2 + 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial map={facadeTex} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* 건축 조감도 특유의 입체 화이트 수직 멀리언 핀(Architectural Vertical Fins) 4줄 */}
      {[-width * 0.46, -width * 0.16, width * 0.16, width * 0.46].map((fx, fi) => (
        <mesh key={fi} position={[fx, height / 2 + 2.4, 0]} castShadow>
          <boxGeometry args={[0.24, height + 0.6, depth + 0.22]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>
      ))}

      {/* 옥상 크라운 파라펫 프레임 & 옥상 녹화(Green Roof) 또는 태양광 모듈(Solar Grid) */}
      <RoundedBox args={[width + 0.36, 0.9, depth + 0.36]} position={[0, height + 2.5, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 2.98, 0]} receiveShadow>
        <planeGeometry args={[width - 0.3, depth - 0.3]} />
        {roofType === 'solar' ? (
          <meshStandardMaterial map={solarTex} metalness={0.6} roughness={0.2} />
        ) : (
          <meshStandardMaterial color="#65A30D" roughness={0.85} />
        )}
      </mesh>

      {/* 옥상 엘리베이터 권상기실 펜트하우스 코어 (평지붕 모던 박스) */}
      <RoundedBox args={[2.6, 1.6, 2.2]} position={[-width * 0.15, height + 3.7, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
      </RoundedBox>

      {/* ㄱ자/L자 꺾임 날개 동 (wingWidth가 있을 때) */}
      {wingWidth > 0 && (
        <group position={[width / 2 - wingWidth / 2, 0, depth / 2 + wingDepth / 2]}>
          <RoundedBox args={[wingWidth + 0.25, 2.2, wingDepth + 0.25]} position={[0, 1.1, 0]} radius={0.03} castShadow>
            <meshStandardMaterial color="#D6D3D1" />
          </RoundedBox>
          <mesh position={[0, height / 2 + 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[wingWidth, height, wingDepth]} />
            <meshStandardMaterial map={facadeTex} roughness={0.35} />
          </mesh>
          <RoundedBox args={[wingWidth + 0.3, 0.9, wingDepth + 0.3]} position={[0, height + 2.5, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 2.98, 0]}>
            <planeGeometry args={[wingWidth - 0.3, wingDepth - 0.3]} />
            {roofType === 'solar' ? (
              <meshStandardMaterial map={solarTex} metalness={0.6} roughness={0.2} />
            ) : (
              <meshStandardMaterial color="#65A30D" roughness={0.85} />
            )}
          </mesh>
        </group>
      )}
    </group>
  );
}

// 🏙️ `image_864f03.jpg` & `image_864ee5.jpg` 외곽의 반투명 화이트/그레이 주변 도시 컨텍스트 매스 군락 (90여 동)
function SurroundingWhiteContextCityMasses() {
  const blocks = useMemo(() => {
    const list = [];
    // 동·서·남·북 외곽을 둘러싸는 도시 블록 매스 자동 생성
    for (let i = 0; i < 88; i++) {
      const angle = (i / 88) * Math.PI * 2;
      const radius = 64 + (i % 4) * 18 + Math.sin(i * 3) * 8;
      const bx = Math.cos(angle) * radius;
      const bz = Math.sin(angle) * radius;
      const bw = 5.5 + (i % 5) * 2.2;
      const bd = 4.2 + ((i * 3) % 4) * 1.8;
      const bh = 7.0 + ((i * 7) % 6) * 4.2;
      const rot = (i % 3) * 0.45;
      list.push({ bx, bz, bw, bd, bh, rot });
    }
    return list;
  }, []);

  return (
    <group>
      {blocks.map((b, idx) => (
        <mesh
          key={idx}
          position={[b.bx, b.bh / 2, b.bz]}
          rotation={[0, b.rot, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.bw, b.bh, b.bd]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#E2E8F0' : '#CBD5E1'}
            roughness={0.75}
            transparent
            opacity={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}

// 🌳 조감도(`image_864f03.jpg`) 스타일 다층 풍성한 단지 조경수 컴포넌트
function RichMasterplanTrees({ positions = [] }) {
  const palette = ['#2D5A27', '#3A6B33', '#4D7C0F', '#1E4620', '#3F6212'];
  return (
    <group>
      {positions.map(([tx, ty, tz, s = 1.0], idx) => {
        const col1 = palette[idx % palette.length];
        const col2 = palette[(idx + 2) % palette.length];
        return (
          <group key={idx} position={[tx, ty, tz]} scale={[s, s, s]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.20, 1.4, 7]} />
              <meshStandardMaterial color="#4A3525" />
            </mesh>
            <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
              <dodecahedronGeometry args={[1.05, 1]} />
              <meshStandardMaterial color={col1} roughness={0.85} />
            </mesh>
            <mesh position={[0.35, 2.35, 0.22]} castShadow>
              <dodecahedronGeometry args={[0.78, 1]} />
              <meshStandardMaterial color={col2} roughness={0.85} />
            </mesh>
            <mesh position={[-0.32, 2.15, -0.25]} castShadow>
              <dodecahedronGeometry args={[0.72, 1]} />
              <meshStandardMaterial color={col1} roughness={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 🚗 김포한강8로 도로 위를 실시간으로 달리는 3D 도시 자동차들
function MovingCityTrafficCars() {
  const car1Ref = useRef();
  const car2Ref = useRef();
  const car3Ref = useRef();
  const busRef = useRef();

  useFrame((_, delta) => {
    if (car1Ref.current) {
      car1Ref.current.position.x += delta * 9.5;
      if (car1Ref.current.position.x > 68) car1Ref.current.position.x = -68;
    }
    if (car2Ref.current) {
      car2Ref.current.position.x -= delta * 8.2;
      if (car2Ref.current.position.x < -68) car2Ref.current.position.x = 68;
    }
    if (car3Ref.current) {
      car3Ref.current.position.x += delta * 11.5;
      if (car3Ref.current.position.x > 68) car3Ref.current.position.x = -68;
    }
    if (busRef.current) {
      busRef.current.position.x -= delta * 6.5;
      if (busRef.current.position.x < -68) busRef.current.position.x = 68;
    }
  });

  return (
    <group position={[0, -17.9, 13.5]} rotation={[0, 0.14, 0]}>
      <group ref={car1Ref} position={[-25, 0.35, 1.4]}>
        <RoundedBox args={[1.8, 0.55, 0.92]} radius={0.08} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.42, 0.84]} position={[-0.1, 0.42, 0]} radius={0.06}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
      </group>

      <group ref={car2Ref} position={[18, 0.32, -1.4]}>
        <RoundedBox args={[1.75, 0.48, 0.88]} radius={0.08} castShadow>
          <meshStandardMaterial color="#38BDF8" />
        </RoundedBox>
        <RoundedBox args={[1.0, 0.38, 0.80]} position={[0.1, 0.38, 0]} radius={0.06}>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>
      </group>

      <group ref={car3Ref} position={[5, 0.30, 1.4]}>
        <RoundedBox args={[1.7, 0.44, 0.88]} radius={0.08} castShadow>
          <meshStandardMaterial color="#EF4444" />
        </RoundedBox>
      </group>

      <group ref={busRef} position={[-12, 0.68, -1.4]}>
        <RoundedBox args={[3.8, 1.15, 1.12]} radius={0.08} castShadow>
          <meshStandardMaterial color="#16A34A" />
        </RoundedBox>
        <RoundedBox args={[3.82, 0.42, 1.14]} position={[0, 0.22, 0]} radius={0.02}>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
      </group>
    </group>
  );
}

// 🌺 7층 계단실 옆 좋은나무교회 축하 3단 화환 컴포넌트
function ChurchCelebrationWreath3D({ position, rotationY = 0, onClick }) {
  const ribbonTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('祝 좋은나무교회 부흥', w / 2, h / 2 + 8);
    }, 320, 72);
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {[-0.22, 0.22].map((lx, li) => (
        <mesh key={li} position={[lx, 0.75, -0.1]} rotation={[0.15, 0, li === 0 ? -0.12 : 0.12]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
          <meshStandardMaterial color="#166534" />
        </mesh>
      ))}
      {[0.72, 1.25].map((wy, wi) => (
        <group key={wi} position={[0, wy, 0]}>
          <mesh castShadow>
            <torusGeometry args={[wi === 0 ? 0.34 : 0.28, 0.10, 12, 24]} />
            <meshStandardMaterial color="#15803D" />
          </mesh>
          {Array.from({ length: 10 }).map((_, fi) => {
            const ang = (fi / 10) * Math.PI * 2;
            const rad = wi === 0 ? 0.34 : 0.28;
            return (
              <mesh key={fi} position={[Math.cos(ang) * rad, Math.sin(ang) * rad, 0.06]} castShadow>
                <sphereGeometry args={[0.065, 10, 10]} />
                <meshStandardMaterial color={['#EF4444', '#FACC15', '#F472B6', '#FFFFFF'][fi % 4]} />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh position={[0, 1.0, 0.14]}>
        <planeGeometry args={[0.72, 0.16]} />
        <meshBasicMaterial map={ribbonTex} />
      </mesh>
    </group>
  );
}

// 🛗 7층 브러시드 스테인리스 자동 개폐 엘리베이터
function AnimatedStainlessElevator7F({ position, rotationY = 0, playerIdxRef, forceOpen, onClickElevator, signTex, showRoomSigns }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const wasOpenRef = useRef(false);
  const steelTex = useMemo(() => makeBrushedSteelTexture(), []);

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - position[0], pz - (position[2] + 0.8));
    const isOpen = forceOpen || dist < 2.1;

    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      playElevatorDingSound();
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }

    const targetLeftX = isOpen ? -0.88 : -0.32;
    const targetRightX = isOpen ? 0.88 : 0.32;

    leftDoorRef.current.position.x = THREE.MathUtils.lerp(leftDoorRef.current.position.x, targetLeftX, delta * 6.5);
    rightDoorRef.current.position.x = THREE.MathUtils.lerp(rightDoorRef.current.position.x, targetRightX, delta * 6.5);
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickElevator) onClickElevator();
      }}
    >
      <group position={[0, 0, -0.42]}>
        <RoundedBox args={[1.62, 0.06, 0.78]} position={[0, 0.03, 0]} radius={0.01}>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[1.62, 2.12, 0.06]} position={[0, 1.06, -0.36]} radius={0.01}>
          <meshStandardMaterial color="#D49552" />
        </RoundedBox>
        <pointLight position={[0, 1.85, 0]} intensity={1.5} distance={3.2} color="#FFFBEB" />
      </group>

      <group position={[0, 1.02, 0.04]}>
        <RoundedBox ref={leftDoorRef} args={[0.64, 2.02, 0.05]} position={[-0.32, 0, 0]} radius={0.008} castShadow>
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <RoundedBox ref={rightDoorRef} args={[0.64, 2.02, 0.05]} position={[0.32, 0, 0]} radius={0.008} castShadow>
          <meshStandardMaterial map={steelTex} color="#E2E8F0" metalness={0.85} roughness={0.2} />
        </RoundedBox>
      </group>

      <RoundedBox args={[0.26, 2.28, 0.24]} position={[-0.78, 1.14, 0]} radius={0.015} castShadow>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.26, 2.28, 0.24]} position={[0.78, 1.14, 0]} radius={0.015} castShadow>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.84, 0.26, 0.25]} position={[0, 2.15, 0]} radius={0.015} castShadow>
        <meshStandardMaterial map={steelTex} color="#F1F5F9" metalness={0.88} roughness={0.18} />
      </RoundedBox>

      {showRoomSigns && (
        <Billboard position={[0, 2.55, 0]}>
          <mesh>
            <planeGeometry args={[1.18, 0.52]} />
            <meshBasicMaterial map={signTex} transparent />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// 🚪 7층 엘리베이터 홀 ➔ 야외 하늘정원 연결 통로 자동 개폐문
function AnimatedRooftopPassageDoor7F({ position, playerIdxRef, forceOpen, onClickDoor }) {
  const doorPivotRef = useRef();

  useFrame((_, delta) => {
    if (!doorPivotRef.current) return;
    const [px, , pz] = playerIdxRef.current || [0, 0, 0];
    const dist = Math.hypot(px - position[0], pz - position[2]);
    const shouldOpen = forceOpen || dist < 2.2;
    const targetRot = shouldOpen ? 1.35 : 0.15;
    doorPivotRef.current.rotation.y = THREE.MathUtils.lerp(doorPivotRef.current.rotation.y, targetRot, delta * 6.0);
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClickDoor) onClickDoor();
      }}
    >
      <RoundedBox args={[0.24, 2.32, 0.14]} position={[0, 1.16, -0.78]} radius={0.01}>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>
      <RoundedBox args={[0.24, 2.32, 0.14]} position={[0, 1.16, 0.78]} radius={0.01}>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>
      <RoundedBox args={[0.65, 0.14, 1.78]} position={[-0.15, 2.28, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#059669" />
      </RoundedBox>

      <group ref={doorPivotRef} position={[0, 1.10, -0.70]}>
        <RoundedBox args={[0.07, 2.12, 1.36]} position={[0, 0, 0.68]} radius={0.01} castShadow>
          <meshStandardMaterial color="#78350F" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.25, 0.68]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.72, 1.05]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} roughness={0.1} />
        </mesh>
        <RoundedBox args={[0.14, 0.04, 0.18]} position={[0, -0.05, 1.22]} radius={0.01}>
          <meshStandardMaterial color="#FACC15" metalness={0.85} />
        </RoundedBox>
      </group>
    </group>
  );
}

// =====================================================================
// 🏙️ 7층 하늘정원 + 좋은나무교회 전체 외관 + 건축 마스터플랜 조감도(`image_864f03.jpg` & `image_864ee5.jpg`) 씬
// =====================================================================
function SevenFloorCityRTMasterScene({
  activeZoneId,
  onSelectZone,
  onSitOnBench,
  onToggleDroneView,
  onSelectNpcForChat,
  activeNpcChatIdx,
  showRoomSigns,
  timeOfDay,
  playerIdxRef,
  isElevatorModalOpen,
  isPassageDoorForcedOpen,
  remotePeers,
  onSelectRemotePeer,
  holyLightEvent
}) {
  const isNight = timeOfDay === 'night' || timeOfDay === 'sunset';

  const woodDeckTex = useMemo(() => makeWoodDeckTexture(), []);
  const blueCurtainTex = useMemo(() => makeBlueCurtainWallTexture(), []);
  const worldMapMuralTex = useMemo(() => makeWorldMissionMuralTexture(), []);
  const solarTex = useMemo(() => makeSolarPanelRoofTexture(), []);

  // 현대 하이엔드 브랜드 아파트 외벽 텍스처 3종
  const aptModernWhiteTex = useMemo(() => makeArchVizApartmentTexture('#F8FAFC', '#334155', isNight), [isNight]);
  const aptModernSandTex = useMemo(() => makeArchVizApartmentTexture('#F5F2EB', '#57534E', isNight), [isNight]);
  const aptModernCoolGreyTex = useMemo(() => makeArchVizApartmentTexture('#F1F5F9', '#1E293B', isNight), [isNight]);

  const churchExteriorSignTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 64px serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 10;
      ctx.fillText('좋은나무교회', w / 2, h / 2 + 18);
    }, 512, 140);
  }, []);

  const purpleBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#581C87');
      grad.addColorStop(1, '#7E22CE');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#E9D5FF';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('{ 당신이 더 행복했으면 좋겠습니다 }', w / 2, h / 2 + 10);
    }, 560, 120);
  }, []);

  const cityLabels = useMemo(() => ({
    gyeongnam: makeRoomSignTexture('경남아너스빌 아파트', '976세대 · 북쪽 단지', '#3B82F6'),
    dongil: makeRoomSignTexture('동일스위트 더파크뷰 1단지', '1,021세대 · 북서쪽 단지', '#10B981'),
    daelim: makeRoomSignTexture('e편한세상 한강신도시2차', '807세대 · 동남쪽 단지', '#F59E0B'),
    school: makeRoomSignTexture('은여울중학교 🏫', '인조잔디 운동장 · 동북쪽', '#0284C7'),
    park: makeRoomSignTexture('은여울공원 · 수목원 🌲', '산책로 · 잔디마당 · 야외무대', '#16A34A')
  }), []);

  const signs7F = useMemo(() => ({
    elevator: makeRoomSignTexture('7F 엘리베이터·계단 🛗', '전 층(1F~6F) 즉시 이동', '#10B981'),
    passage: makeRoomSignTexture('하늘정원 출입통로 🚪', '클릭 시 야외 옥상으로 이동', '#059669'),
    pergola: makeRoomSignTexture('루프탑 파고라 쉼터 🌿', '클릭 시 벤치 착석 · 티타임', '#F59E0B'),
    observatory: makeRoomSignTexture('한강신도시 전망대 🔭', '클릭 시 마스터플랜 조감도', '#38BDF8'),
    blessing: makeRoomSignTexture('하늘정원 축도처 ✨', '목사님 축도(홀리라이트)', '#8B5CF6')
  }), []);

  return (
    <group>
      {/* ================================================================= */}
      {/* ⛪ PART A. 좋은나무교회 7층 전체 건물 외관 (Y = -18.0m 지면 ~ Y = 0.0m 7층 옥상) */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[12.8, 14.6, 9.6]} position={[-0.2, -7.3, 0]} radius={0.05} castShadow receiveShadow>
          <meshStandardMaterial color="#D6D3CD" roughness={0.55} />
        </RoundedBox>

        {/* 정면(북쪽 +Z 방향) 다크그레이 화강석 파사드 & 4줄 세로 슬릿 창문 & 2층 통유리창 */}
        <group position={[1.1, -6.2, 4.92]}>
          <RoundedBox args={[6.2, 12.2, 0.36]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#33363B" roughness={0.4} metalness={0.2} />
          </RoundedBox>
          <mesh position={[0, 4.15, 0.20]}>
            <planeGeometry args={[3.2, 0.88]} />
            <meshBasicMaterial map={churchExteriorSignTex} transparent />
          </mesh>
          {[-2.1, -0.7, 0.7, 2.1].map((wx, wi) => (
            <mesh key={wi} position={[wx, 1.35, 0.19]}>
              <planeGeometry args={[0.42, 3.6]} />
              <meshStandardMaterial color="#0284C7" metalness={0.85} roughness={0.1} />
            </mesh>
          ))}
          <mesh position={[0, -2.55, 0.19]}>
            <planeGeometry args={[5.4, 2.4]} />
            <meshStandardMaterial color="#0369A1" metalness={0.88} roughness={0.08} />
          </mesh>
          <mesh position={[0, -4.85, 0.20]}>
            <planeGeometry args={[4.2, 0.85]} />
            <meshBasicMaterial map={purpleBannerTex} />
          </mesh>
        </group>

        {/* 1층 필로티 주차장 기둥 & 정문 어닝 */}
        <group position={[0, -18.0, 0]}>
          {[-2.0, 0.8, 3.6].map((px, pi) => (
            <RoundedBox key={pi} args={[0.68, 3.5, 0.68]} position={[px, 1.75, 4.5]} radius={0.02} castShadow>
              <meshStandardMaterial color="#57534E" />
            </RoundedBox>
          ))}
          <RoundedBox args={[2.6, 0.45, 0.85]} position={[-3.4, 2.8, 4.95]} rotation={[0.25, 0, 0]} radius={0.02}>
            <meshStandardMaterial color="#064E3B" />
          </RoundedBox>
          <mesh position={[-4.4, 1.4, 4.92]}>
            <planeGeometry args={[0.85, 2.2]} />
            <meshBasicMaterial color="#0284C7" />
          </mesh>
        </group>

        {/* 우측(-X 코너) 코발트블루 통유리 커튼월 타워 & 최상단 크롬 십자가 첨탑 */}
        <group position={[-4.85, -7.2, 3.35]}>
          <RoundedBox args={[3.1, 21.6, 3.2]} position={[0, 0, 0]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#E7E5E0" roughness={0.4} />
          </RoundedBox>
          <mesh position={[-0.1, 0.2, 1.62]}>
            <planeGeometry args={[2.3, 19.8]} />
            <meshBasicMaterial map={blueCurtainTex} />
          </mesh>
          <mesh position={[-1.56, 0.2, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.3, 19.8]} />
            <meshBasicMaterial map={blueCurtainTex} />
          </mesh>
          <group position={[-0.6, 11.2, 1.55]}>
            <mesh position={[0, 1.6, 0]} castShadow>
              <boxGeometry args={[0.18, 3.6, 0.18]} />
              <meshStandardMaterial
                color="#F8FAFC"
                emissive={isNight ? '#FDE047' : '#CBD5E1'}
                emissiveIntensity={isNight ? 1.8 : 0.35}
                metalness={0.8}
              />
            </mesh>
            <mesh position={[0, 2.35, 0]} castShadow>
              <boxGeometry args={[1.65, 0.18, 0.18]} />
              <meshStandardMaterial
                color="#F8FAFC"
                emissive={isNight ? '#FDE047' : '#CBD5E1'}
                emissiveIntensity={isNight ? 1.8 : 0.35}
                metalness={0.8}
              />
            </mesh>
          </group>
        </group>

        {/* 좌측(+X 코너) 계단실 타워 & 대형 세계지도 선교 벽화 */}
        <group position={[5.15, -7.8, 0.4]}>
          <RoundedBox args={[2.8, 20.4, 8.8]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#A8A29E" roughness={0.55} />
          </RoundedBox>
          <mesh position={[1.42, 1.5, 0.5]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[5.8, 3.8]} />
            <meshBasicMaterial map={worldMapMuralTex} />
          </mesh>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 🌿 PART B. 7층 루프탑(옥상) 실내 펜트하우스 홀 & 야외 하늘정원 (Y = 0.0m) */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[12.6, 0.24, 9.4]} position={[-0.2, -0.12, 0]} radius={0.03} receiveShadow>
          <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.85, 0.01, 0.2]} receiveShadow>
          <planeGeometry args={[7.4, 8.4]} />
          <meshStandardMaterial map={woodDeckTex} roughness={0.45} />
        </mesh>
        <RoundedBox args={[3.4, 0.04, 3.6]} position={[-3.6, 0.02, 2.1]} radius={0.08} receiveShadow>
          <meshStandardMaterial color="#4D7C0F" roughness={0.8} />
        </RoundedBox>

        {/* 동쪽 7층 실내 엘리베이터·계단 펜트하우스 코어 & 축하 화환 & 옥상 출입 통로 */}
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.012, -1.2]} receiveShadow>
            <planeGeometry args={[3.2, 6.4]} />
            <meshStandardMaterial color="#F1F5F9" roughness={0.3} />
          </mesh>

          <AnimatedStainlessElevator7F
            position={[3.4, 0.02, -3.5]}
            rotationY={0}
            playerIdxRef={playerIdxRef}
            forceOpen={isElevatorModalOpen}
            onClickElevator={() => onSelectZone(ZONES_7F[0])}
            signTex={signs7F.elevator}
            showRoomSigns={showRoomSigns}
          />

          <group
            position={[3.8, 0, 1.1]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_7F[0]);
            }}
          >
            {Array.from({ length: 5 }).map((_, si) => (
              <RoundedBox
                key={si}
                args={[0.28, 0.12, 1.2]}
                position={[-0.6 + si * 0.28, -si * 0.06, 0]}
                radius={0.01}
              >
                <meshStandardMaterial color={si % 2 === 0 ? '#E2E8F0' : '#94A3B8'} />
              </RoundedBox>
            ))}
          </group>

          <ChurchCelebrationWreath3D
            position={[4.55, 0.02, -0.35]}
            rotationY={-Math.PI / 2}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(ZONES_7F[1]);
            }}
          />

          <RoundedBox args={[0.18, 2.35, 3.0]} position={[1.95, 1.18, -2.9]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          <RoundedBox args={[0.18, 2.35, 1.8]} position={[1.95, 1.18, 1.25]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          <RoundedBox args={[3.4, 2.35, 0.18]} position={[3.55, 1.18, 2.05]} radius={0.015} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>

          <AnimatedRooftopPassageDoor7F
            position={[1.95, 0, -0.5]}
            playerIdxRef={playerIdxRef}
            forceOpen={isPassageDoorForcedOpen}
            onClickDoor={() => onSelectZone(ZONES_7F[2])}
          />
          {showRoomSigns && (
            <Billboard position={[1.95, 2.65, -0.5]}>
              <mesh>
                <planeGeometry args={[1.22, 0.52]} />
                <meshBasicMaterial map={signs7F.passage} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 야외 하늘정원 중앙: 원목 파고라(Pergola) 캐노피 & 에디슨 스트링 라이트 */}
        <group position={[-1.4, 0, -1.65]}>
          {[
            [-1.5, -1.1],
            [1.5, -1.1],
            [-1.5, 1.1],
            [1.5, 1.1]
          ].map(([px, pz], pi) => (
            <RoundedBox key={pi} args={[0.14, 2.35, 0.14]} position={[px, 1.18, pz]} radius={0.02} castShadow>
              <meshStandardMaterial color="#5C381E" roughness={0.5} />
            </RoundedBox>
          ))}
          <RoundedBox args={[3.3, 0.12, 0.14]} position={[0, 2.32, -1.1]} radius={0.02} castShadow>
            <meshStandardMaterial color="#5C381E" />
          </RoundedBox>
          <RoundedBox args={[3.3, 0.12, 0.14]} position={[0, 2.32, 1.1]} radius={0.02} castShadow>
            <meshStandardMaterial color="#5C381E" />
          </RoundedBox>
          {[-1.3, -0.85, -0.4, 0, 0.4, 0.85, 1.3].map((rx, ri) => (
            <RoundedBox key={ri} args={[0.08, 0.10, 2.45]} position={[rx, 2.40, 0]} radius={0.015} castShadow>
              <meshStandardMaterial color="#784727" />
            </RoundedBox>
          ))}

          {[-1.1, -0.55, 0, 0.55, 1.1].map((lx, li) => (
            <React.Fragment key={li}>
              <mesh position={[lx, 2.24, -0.45]}>
                <sphereGeometry args={[0.04, 10, 10]} />
                <meshBasicMaterial color="#FEF08A" />
              </mesh>
              <mesh position={[lx, 2.24, 0.45]}>
                <sphereGeometry args={[0.04, 10, 10]} />
                <meshBasicMaterial color="#FEF08A" />
              </mesh>
            </React.Fragment>
          ))}
          <pointLight position={[0, 2.1, 0]} intensity={1.8} distance={5.0} color="#FDE047" />

          <RoundedBox args={[1.65, 0.06, 0.76]} position={[0, 0.58, 0]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color="#D49552" />
          </RoundedBox>
          {[-0.65, 0.65].map((tx, ti) => (
            <RoundedBox
              key={ti}
              args={[0.58, 0.07, 0.52]}
              position={[tx, 0.34, -0.68]}
              radius={0.02}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onSitOnBench({
                  x: -1.4 + tx,
                  z: -1.65 - 0.68,
                  rotY: 0,
                  rowLabel: '7F 하늘정원 파고라 원목 벤치석'
                });
              }}
            >
              <meshStandardMaterial color="#A86B2D" />
            </RoundedBox>
          ))}

          {showRoomSigns && (
            <Billboard position={[0, 2.75, 0]}>
              <mesh>
                <planeGeometry args={[1.25, 0.52]} />
                <meshBasicMaterial map={signs7F.pergola} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 북쪽 전망 난간: 크롬 쌍안경 전망 망원경 2대 */}
        <group
          position={[-1.2, 0, 3.85]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleDroneView) onToggleDroneView();
          }}
        >
          {[-0.65, 0.65].map((bx, bi) => (
            <group key={bi} position={[bx, 0, 0]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.08, 1.1, 14]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.2} />
              </mesh>
              <RoundedBox args={[0.22, 0.14, 0.36]} position={[0, 1.14, 0.05]} rotation={[0.2, 0, 0]} radius={0.03} castShadow>
                <meshStandardMaterial color="#0284C7" metalness={0.7} roughness={0.2} />
              </RoundedBox>
            </group>
          ))}
          {showRoomSigns && (
            <Billboard position={[0, 1.95, 0]}>
              <mesh>
                <planeGeometry args={[1.28, 0.52]} />
                <meshBasicMaterial map={signs7F.observatory} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 옥상 둘레 강화유리 & 스테인리스 안전 난간 */}
        <RoundedBox args={[12.4, 0.06, 0.08]} position={[-0.2, 1.05, 4.45]} radius={0.02}>
          <meshStandardMaterial color="#E2E8F0" metalness={0.85} />
        </RoundedBox>
        <mesh position={[-0.2, 0.52, 4.45]}>
          <boxGeometry args={[12.2, 0.98, 0.03]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.35} roughness={0.08} />
        </mesh>

        {[
          [-4.8, 0.6],
          [-4.8, -1.8],
          [0.8, 3.8],
          [3.2, 3.8]
        ].map(([px, pz], pi) => (
          <group key={pi} position={[px, 0, pz]}>
            <RoundedBox args={[1.25, 0.42, 0.65]} position={[0, 0.21, 0]} radius={0.03} castShadow>
              <meshStandardMaterial color="#F8FAFC" />
            </RoundedBox>
            <mesh position={[-0.25, 0.68, 0]} castShadow>
              <dodecahedronGeometry args={[0.36, 1]} />
              <meshStandardMaterial color="#2D5A27" />
            </mesh>
            <mesh position={[0.25, 0.58, 0.05]} castShadow>
              <sphereGeometry args={[0.24, 12, 12]} />
              <meshStandardMaterial color={pi % 2 === 0 ? '#F472B6' : '#FACC15'} />
            </mesh>
          </group>
        ))}

        {showRoomSigns && (
          <Billboard position={[-3.2, 2.05, 2.6]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectNpcForChat) onSelectNpcForChat(NPCS_7F[0]);
              }}
            >
              <planeGeometry args={[1.25, 0.52]} />
              <meshBasicMaterial map={signs7F.blessing} transparent />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* ================================================================= */}
      {/* 🏙️ PART C. 《건축 마스터플랜 조감도 (`image_864f03.jpg` & `image_864ee5.jpg`)》 스타일 주변 3D 도시 (Y = -18.0m) */}
      {/* ================================================================= */}
      <group position={[0, -18.0, 0]}>
        {/* 1) 조감도 스타일 라이트 실버그레이 어반 컨텍스트 베이스 대지 (원색 초록 잔디 완전 탈피!) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
          <planeGeometry args={[320, 320]} />
          <meshStandardMaterial color={isNight ? '#1E293B' : '#E2E4E8'} roughness={0.85} />
        </mesh>

        {/* 주변 외곽을 가득 채우는 화이트/그레이 컨텍스트 빌딩 매스 88동 (`image_864f03.jpg` 외곽 재현!) */}
        <SurroundingWhiteContextCityMasses />

        {/* 2) 도시 간선 도로망 (김포한강8로 & 단지 교차로 차콜 아스팔트 + 보도블록 연석) */}
        <group position={[0, 0.02, 13.5]} rotation={[0, 0.14, 0]}>
          {/* 보행자 보도블록 연석 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[220, 11.2]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
          </mesh>
          {/* 메인 차콜 아스팔트 도로 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[220, 8.6]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {/* 스쿨존 테라코타 레드 포장 구간 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.01, 0]} receiveShadow>
            <planeGeometry args={[34, 8.2]} />
            <meshStandardMaterial color="#88292F" roughness={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[220, 0.16]} />
            <meshBasicMaterial color="#FDE047" />
          </mesh>
          {/* 남북 교차 도로망 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-22, -0.005, 18]} receiveShadow>
            <planeGeometry args={[7.2, 110]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, -0.005, 18]} receiveShadow>
            <planeGeometry args={[7.2, 110]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
        </group>

        <MovingCityTrafficCars />

        {/* 3) 북쪽 단지(+Z): 경남아너스빌 아파트 마스터플랜 (976세대 — 샌드베이지 보행 데크 + 잔디 플라자 + 태양광 루프탑) */}
        <group position={[0, 0, 34]}>
          {/* 단지 조경 포디움 베이스 & 샌드베이지 보행 산책로 (`image_864f03.jpg` 단지 바닥 완벽 재현!) */}
          <RoundedBox args={[42, 0.25, 32]} position={[1, 0.12, 6]} radius={0.1} receiveShadow>
            <meshStandardMaterial color="#EDE8DC" roughness={0.75} />
          </RoundedBox>
          {/* 유기적인 잔디 조경 패치들 */}
          <RoundedBox args={[16, 0.28, 12]} position={[-9, 0.14, 2]} radius={0.2} receiveShadow>
            <meshStandardMaterial color="#557A2B" roughness={0.85} />
          </RoundedBox>
          <RoundedBox args={[18, 0.28, 14]} position={[10, 0.14, 9]} radius={0.2} receiveShadow>
            <meshStandardMaterial color="#4A6E22" roughness={0.85} />
          </RoundedBox>
          {/* 단지 중앙 원형 커뮤니티 광장 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.30, 5]}>
            <circleGeometry args={[4.8, 32]} />
            <meshStandardMaterial color="#D6C7B2" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.32, 5]}>
            <circleGeometry args={[3.2, 32]} />
            <meshStandardMaterial color="#5C8D32" />
          </mesh>

          <ModernArchVizApartmentTower position={[-12, 0.2, -4]} rotationY={-0.65} width={9.5} depth={3.2} height={26} wingWidth={3.2} wingDepth={4.8} roofType="solar" facadeTex={aptModernWhiteTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[2, 0.2, -3]} rotationY={0.65} width={9.5} depth={3.2} height={28} wingWidth={3.2} wingDepth={4.8} roofType="solar" facadeTex={aptModernWhiteTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[15, 0.2, 0]} rotationY={-0.55} width={9.5} depth={3.2} height={25} wingWidth={3.2} wingDepth={4.5} roofType="green" facadeTex={aptModernWhiteTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[-8, 0.2, 13]} rotationY={0.55} width={10.5} depth={3.2} height={30} wingWidth={3.2} wingDepth={5.0} roofType="solar" facadeTex={aptModernWhiteTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[10, 0.2, 15]} rotationY={-0.6} width={10.0} depth={3.2} height={27} roofType="green" facadeTex={aptModernWhiteTex} solarTex={solarTex} />

          <RichMasterplanTrees
            positions={[
              [-16, 0.2, 3, 1.1], [-5, 0.2, 3, 1.2], [7, 0.2, 4, 1.1],
              [-2, 0.2, 10, 1.3], [4, 0.2, 12, 1.0], [16, 0.2, 9, 1.2],
              [-14, 0.2, 12, 1.2], [0, 0.2, -8, 1.0], [12, 0.2, -6, 1.1]
            ]}
          />

          {showRoomSigns && (
            <Billboard position={[2, 34, 4]}>
              <mesh>
                <planeGeometry args={[5.8, 2.3]} />
                <meshBasicMaterial map={cityLabels.gyeongnam} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 4) 북서쪽 단지(좌측 +X, +Z): 동일스위트 더파크뷰 1단지 (1,021세대) & 연녹색 옥상 스트리트 상가 */}
        <group position={[40, 0, 22]}>
          <RoundedBox args={[36, 0.25, 32]} position={[2, 0.12, 12]} radius={0.1} receiveShadow>
            <meshStandardMaterial color="#E6E1D6" roughness={0.75} />
          </RoundedBox>
          <RoundedBox args={[26, 0.28, 20]} position={[2, 0.14, 14]} radius={0.2} receiveShadow>
            <meshStandardMaterial color="#4D7525" roughness={0.85} />
          </RoundedBox>

          {/* 스트리트 상가 포디움 */}
          <RoundedBox args={[18, 4.2, 4.8]} position={[-10, 2.1, -3]} rotation={[0, 0.14, 0]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#F1F5F9" />
          </RoundedBox>
          <RoundedBox args={[17.6, 0.2, 4.4]} position={[-10, 4.3, -3]} rotation={[0, 0.14, 0]} radius={0.02}>
            <meshStandardMaterial color="#65A30D" />
          </RoundedBox>

          <ModernArchVizApartmentTower position={[-6, 0.2, 8]} rotationY={0.7} width={10} depth={3.2} height={27} wingWidth={3.2} wingDepth={4.5} roofType="green" facadeTex={aptModernCoolGreyTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[8, 0.2, 6]} rotationY={-0.6} width={10.5} depth={3.2} height={29} roofType="solar" facadeTex={aptModernCoolGreyTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[0, 0.2, 22]} rotationY={0.65} width={11} depth={3.2} height={28} wingWidth={3.2} wingDepth={5.0} roofType="green" facadeTex={aptModernCoolGreyTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[15, 0.2, 18]} rotationY={0.7} width={10} depth={3.2} height={25} roofType="solar" facadeTex={aptModernCoolGreyTex} solarTex={solarTex} />

          <RichMasterplanTrees
            positions={[
              [-12, 0.2, 4, 1.1], [1, 0.2, 12, 1.3], [8, 0.2, 14, 1.1],
              [-6, 0.2, 16, 1.2], [12, 0.2, 9, 1.0]
            ]}
          />

          {showRoomSigns && (
            <Billboard position={[2, 34, 12]}>
              <mesh>
                <planeGeometry args={[6.2, 2.4]} />
                <meshBasicMaterial map={cityLabels.dongil} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 5) 동쪽 & 남동쪽 단지(우측 -X): GS더프레시·뚜레쥬르 상가 & e편한세상 한강신도시2차 (807세대) */}
        <group position={[-34, 0, -4]}>
          <RoundedBox args={[36, 0.25, 34]} position={[-4, 0.12, -4]} radius={0.1} receiveShadow>
            <meshStandardMaterial color="#EDE8DC" roughness={0.75} />
          </RoundedBox>
          <RoundedBox args={[24, 0.28, 22]} position={[-5, 0.14, -5]} radius={0.2} receiveShadow>
            <meshStandardMaterial color="#527A28" roughness={0.85} />
          </RoundedBox>

          {/* GS더프레시 & 뚜레쥬르 연도형 상가 */}
          <RoundedBox args={[7.5, 5.5, 5.5]} position={[16, 2.75, 7]} rotation={[0, 0.14, 0]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          <RoundedBox args={[6.8, 4.8, 5.2]} position={[6, 2.4, 9]} rotation={[0, 0.14, 0]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#E2E8F0" />
          </RoundedBox>

          <ModernArchVizApartmentTower position={[6, 0.2, -6]} rotationY={-0.7} width={9.5} depth={3.2} height={25} roofType="solar" facadeTex={aptModernSandTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[-6, 0.2, -2]} rotationY={-0.7} width={10} depth={3.2} height={28} wingWidth={3.2} wingDepth={4.5} roofType="green" facadeTex={aptModernSandTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[-18, 0.2, 2]} rotationY={0.65} width={10.5} depth={3.2} height={29} wingWidth={3.2} wingDepth={4.8} roofType="solar" facadeTex={aptModernSandTex} solarTex={solarTex} />
          <ModernArchVizApartmentTower position={[-4, 0.2, -18]} rotationY={0.65} width={11} depth={3.2} height={26} roofType="green" facadeTex={aptModernSandTex} solarTex={solarTex} />

          <RichMasterplanTrees
            positions={[
              [2, 0.2, 2, 1.2], [-2, 0.2, -9, 1.3], [-12, 0.2, -6, 1.1],
              [-10, 0.2, 5, 1.2], [5, 0.2, -14, 1.1]
            ]}
          />

          {showRoomSigns && (
            <Billboard position={[-6, 33, -6]}>
              <mesh>
                <planeGeometry args={[6.0, 2.3]} />
                <meshBasicMaterial map={cityLabels.daelim} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 6) 동북쪽(-X, +Z): 은여울중학교 (교사동 + 인조잔디 축구장 + 육상 트랙) */}
        <group position={[-44, 0, 36]}>
          <RoundedBox args={[28, 0.22, 24]} position={[2, 0.11, 2]} radius={0.08} receiveShadow>
            <meshStandardMaterial color="#E5E0D5" />
          </RoundedBox>
          <RoundedBox args={[16, 7.5, 4.2]} position={[4, 3.75, 10]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" />
          </RoundedBox>
          <RoundedBox args={[6.5, 6.2, 8.5]} position={[10, 3.1, 1]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#E2E8F0" />
          </RoundedBox>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.25, 0]} receiveShadow>
            <planeGeometry args={[16, 12]} />
            <meshStandardMaterial color="#D6C4A8" roughness={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.27, 0]}>
            <planeGeometry args={[11.5, 7.8]} />
            <meshStandardMaterial color="#4D7C0F" />
          </mesh>

          {showRoomSigns && (
            <Billboard position={[0, 14, 4]}>
              <mesh>
                <planeGeometry args={[5.4, 2.2]} />
                <meshBasicMaterial map={cityLabels.school} transparent />
              </mesh>
            </Billboard>
          )}
        </group>

        {/* 7) 남쪽(교회 뒤편 -Z): 은여울공원 · 수목원 · 산책로 · 야외무대 · 잔디마당 (`image_864f03.jpg` 우측 녹지 공원 감성!) */}
        <group position={[4, 0, -26]}>
          {/* 공원 베이스 녹지 매트 & 베이지 산책로 데크 */}
          <RoundedBox args={[52, 0.22, 34]} position={[4, 0.11, -4]} radius={0.3} receiveShadow>
            <meshStandardMaterial color="#3F6212" roughness={0.9} />
          </RoundedBox>
          {/* 조감도 특유의 밝은 샌드베이지 보행 산책로 라인 */}
          <RoundedBox args={[48, 0.26, 2.2]} position={[4, 0.13, 6]} rotation={[0, -0.08, 0]} radius={0.05} receiveShadow>
            <meshStandardMaterial color="#E7DFD3" />
          </RoundedBox>
          <RoundedBox args={[2.2, 0.26, 28]} position={[-2, 0.13, -4]} rotation={[0, 0.15, 0]} radius={0.05} receiveShadow>
            <meshStandardMaterial color="#E7DFD3" />
          </RoundedBox>

          {/* 원형 잔디광장 & 야외무대 돔 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.28, -8]} receiveShadow>
            <circleGeometry args={[7.2, 32]} />
            <meshStandardMaterial color="#65A30D" roughness={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.26, -8]}>
            <ringGeometry args={[7.2, 8.4, 32]} />
            <meshStandardMaterial color="#E7DFD3" />
          </mesh>
          <mesh position={[-11, 1.2, -6]} castShadow>
            <sphereGeometry args={[2.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#F8FAFC" />
          </mesh>

          <RichMasterplanTrees
            positions={[
              [6, 0.2, 8, 1.3], [12, 0.2, 9, 1.4], [18, 0.2, 4, 1.2], [22, 0.2, 8, 1.3],
              [4, 0.2, -2, 1.5], [10, 0.2, -4, 1.3], [16, 0.2, -6, 1.4], [24, 0.2, -2, 1.2],
              [-4, 0.2, 3, 1.2], [-14, 0.2, 4, 1.4], [-18, 0.2, -2, 1.3], [-16, 0.2, -12, 1.2],
              [2, 0.2, -12, 1.4], [9, 0.2, -14, 1.3], [18, 0.2, -13, 1.5]
            ]}
          />

          {showRoomSigns && (
            <Billboard position={[6, 12, -4]}>
              <mesh>
                <planeGeometry args={[5.6, 2.2]} />
                <meshBasicMaterial map={cityLabels.park} transparent />
              </mesh>
            </Billboard>
          )}
        </group>
      </group>

      {/* ================================================================= */}
      {/* 👥 PART D. 7층 하늘정원 NPC & 실시간 멀티플레이어 성도 & 축도 홀리라이트 */}
      {/* ================================================================= */}
      {NPCS_7F.map((npc, idx) => {
        const isTalking = idx === activeNpcChatIdx % NPCS_7F.length;
        const msgList = npc.dialogues || [];
        const msg = isTalking && msgList.length > 0 ? `${npc.name}: ${msgList[activeNpcChatIdx % msgList.length]}` : null;
        const isBlessingNow = holyLightEvent && holyLightEvent.pastorName === npc.name;

        return (
          <SmoothChibiAvatar7F
            key={npc.id}
            position={[npc.x, npc.y || 0, npc.z]}
            patrolZ={npc.patrolZ || null}
            rotationY={npc.rotY || 0}
            isSeated={Boolean(npc.seated)}
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

      {(remotePeers || []).map((peer) => (
        <RemoteMultiplayerAvatar7F
          key={peer.clientId}
          peer={peer}
          onClickPeer={onSelectRemotePeer}
        />
      ))}

      {holyLightEvent && (
        <HolyLightBeamEffect7F
          targetPos={holyLightEvent.targetPos}
          pastorName={holyLightEvent.pastorName}
          targetName={holyLightEvent.targetName}
        />
      )}

      {ZONES_7F.map((z) => (
        <HologramMarker7F
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(sel) => {
            if (sel.isSeatZone && sel.seatTarget) {
              onSitOnBench(sel.seatTarget);
            } else if (sel.isObservatory && onToggleDroneView) {
              onToggleDroneView();
            } else if (sel.isBlessingZone && onSelectNpcForChat) {
              onSelectNpcForChat(NPCS_7F[0]);
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
function PlayerController7F({
  waypoints,
  playerIdxRef,
  seatedInfo,
  playerName,
  playerOffice,
  avatarConfig,
  emote,
  myChatBubble,
  controlsRef,
  cameraViewMode,
  onPositionUpdate
}) {
  const wpIndexRef = useRef(0);
  const [renderState, setRenderState] = useState({
    pos: [2.8, 0, -0.5],
    rotY: -Math.PI / 2,
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
      playerIdxRef.current = [seatedInfo.x, 0, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x || renderState.rotY !== seatedInfo.rotY) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: seatedInfo.rotY ?? 0,
          walking: false
        });
      }
      if (cameraViewMode === 'follow' && controlsRef?.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(seatedInfo.x, 0.85, seatedInfo.z), delta * 4.5);
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
      const [nx, nz] = resolveCollision7F(rawNx, rawNz);
      playerIdxRef.current = [nx, 0, nz];
      const angle = Math.atan2(dx, dz);
      setRenderState({
        pos: [nx, 0, nz],
        rotY: angle,
        walking: true
      });
      onPositionUpdate(nx, nz, angle);

      if (cameraViewMode === 'follow' && controlsRef?.current) {
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
    <SmoothChibiAvatar7F
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

function InitialCameraSetup7F({ controlsRef }) {
  const { camera, size } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = size.width < 640;
    if (isMobile) {
      camera.position.set(1.5, 12.5, -13.5);
      camera.fov = 42;
    } else {
      camera.position.set(1.2, 10.5, -11.5);
      camera.fov = 38;
    }
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(-0.5, 0.5, 0.5);
      controlsRef.current.update();
    }
  }, [size.width, camera, controlsRef]);

  return null;
}

export default function SkyGarden7F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((state) => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const playerOffice = authUser?.office || localStorage.getItem('login_user_office') || '성도';
  const canPlayerBless = isAuthorizedPastor(playerName, playerOffice);

  const clientIdRef = useRef(`peer7f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const playerIdxRef = useRef([2.8, 0, -0.5]);
  const playerRotRef = useRef(-Math.PI / 2);
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

  const [waypoints, setWaypoints] = useState([[2.8, -0.5]]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_7F[2]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);
  const [myChatBubble, setMyChatBubble] = useState('');
  const [quickChatInput, setQuickChatInput] = useState('');

  const [cameraViewMode, setCameraViewMode] = useState('follow');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [isPassageDoorForcedOpen, setIsPassageDoorForcedOpen] = useState(false);

  const [remotePeers, setRemotePeers] = useState([]);
  const [selectedRemotePeer, setSelectedRemotePeer] = useState(null);
  const [holyLightEvent, setHolyLightEvent] = useState(null);

  const [selectedChatNpc, setSelectedChatNpc] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [showRoomSigns, setShowRoomSigns] = useState(true);
  const [showBottomDock, setShowBottomDock] = useState(true);

  const [activeNpcChatIdx, setActiveNpcChatIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNpcChatIdx((prev) => (prev + 1) % NPCS_7F.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

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
    const channel = supabase.channel('metaverse_skygarden_7f', {
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
      .on('broadcast', { event: 'holy_blessing_7f' }, ({ payload }) => {
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
            rotY: -Math.PI / 2,
            seated: false,
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
      }, 4200);

      if (chatText) {
        setTimeout(() => {
          setMyChatBubble('');
          broadcastMyState({ emote: null, chatMsg: '' });
        }, 5500);
      }
    },
    [broadcastMyState]
  );

  const triggerHolyBenediction7F = useCallback(
    (pastorDisplayName, targetDisplayName, targetCoords) => {
      const eventPayload = {
        pastorName: pastorDisplayName,
        targetName: targetDisplayName,
        targetPos: targetCoords || [playerIdxRef.current[0], 0, playerIdxRef.current[2]],
        ts: Date.now()
      };

      playHolyBlessingSound();
      setHolyLightEvent(eventPayload);
      triggerSocialAction('pray', `아멘! 7층 하늘정원에서 ${pastorDisplayName}의 거룩한 축도를 받습니다 🙏`);

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'holy_blessing_7f',
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

  // 🦅 건축 마스터플랜 조감도 시점 전환
  const handleToggleDroneCityView = useCallback(() => {
    if (!controlsRef.current) return;
    if (cameraViewMode === 'follow') {
      setCameraViewMode('drone');
      controlsRef.current.object.position.set(-28, 24, 34);
      controlsRef.current.target.set(0, -6, 6);
      controlsRef.current.update();
    } else {
      setCameraViewMode('follow');
      const [px, , pz] = playerIdxRef.current;
      controlsRef.current.object.position.set(px + 2, 10.5, pz - 11.5);
      controlsRef.current.target.set(px, 0.8, pz);
      controlsRef.current.update();
    }
  }, [cameraViewMode]);

  const handleSitOnBench = useCallback(
    (seatData) => {
      setSeatedInfo(seatData);
      setIsPassageDoorForcedOpen(true);
      setWaypoints([[seatData.x, seatData.z]]);
      setTimeout(() => broadcastMyState(), 100);
    },
    [broadcastMyState]
  );

  const handleStandUp = useCallback(() => {
    setSeatedInfo(null);
    setTimeout(() => broadcastMyState(), 100);
  }, [broadcastMyState]);

  const handleWalkTo = useCallback(
    (tx, tz) => {
      if (seatedInfo) setSeatedInfo(null);
      const [sx, , sz] = playerIdxRef.current;
      const nextPath = computeSmartPath7F(sx, sz, tx, tz);
      setWaypoints(nextPath);
    },
    [seatedInfo]
  );

  const handleSelectNpcForChat = useCallback(
    (npc) => {
      setChatReplyText(
        (npc.dialogues && npc.dialogues[0]) ||
          '할렐루야! 7층 루프탑 하늘정원에 오신 것을 환영합니다 🌿'
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
    ctx.fillStyle = '#8C5832';
    ctx.fillRect(10, 10, 62, 74);
    ctx.fillStyle = '#4D7C0F';
    ctx.fillRect(14, 52, 28, 28);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(74, 10, 30, 56);

    remotePeers.forEach((p) => {
      const px = (((p.x || 0) + 6.5) / 13.0) * w;
      const py = (((p.z || 0) + 5.0) / 10.0) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    });

    const [cx, , cz] = playerIdxRef.current;
    const mx = ((cx + 6.5) / 13.0) * w;
    const my = ((cz + 5.0) / 10.0) * h;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
  }, [waypoints, seatedInfo, isMapDrawerOpen, remotePeers]);

  const handlePositionUpdate = (px, pz, rotAngle) => {
    playerRotRef.current = rotAngle;
    const found = ZONES_7F.find((z) => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }

    const now = Date.now();
    if (now - lastSyncTimeRef.current > 200) {
      lastSyncTimeRef.current = now;
      broadcastMyState();
    }
  };

  // 조감도(`image_864f03.jpg`) 특유의 대기 원근감 안개 및 배경 색상
  const atmosphereColor =
    timeOfDay === 'night'
      ? '#0F172A'
      : timeOfDay === 'sunset'
      ? '#FDBA74'
      : '#DDE6F0';

  const darkPillStyle = {
    backgroundColor: 'rgba(20, 24, 32, 0.94)',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.18)'
  };

  return (
    <div
      translate="no"
      style={{ backgroundColor: atmosphereColor }}
      className="notranslate w-full h-full relative overflow-hidden select-none font-sans transition-colors duration-700"
    >
      {/* 1. 좌측 상단: 슬림 헤더 & 실시간 접속자 & 하늘정원 통로/마스터플랜 드론뷰/축도/시간대 전환 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[78vw]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            onClick={() => (onExitHome ? onExitHome() : setActiveScreen && setActiveScreen('home'))}
            style={darkPillStyle}
            className="px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-xl border flex items-center gap-2 cursor-pointer w-max"
          >
            <span style={{ color: '#FFFFFF' }} className="text-xs sm:text-sm font-black tracking-tight">
              ◀ 7F 루프탑 하늘정원 · 한강신도시 전망대
            </span>
          </div>

          <div
            style={darkPillStyle}
            className="px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300">7F 접속 {remotePeers.length + 1}명</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setIsPassageDoorForcedOpen(true);
              handleWalkTo(-1.4, 1.2);
            }}
            style={{ backgroundColor: '#10B981', color: '#030712' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            🚪 통로 열고 야외 하늘정원 나가기
          </button>

          <button
            onClick={handleToggleDroneCityView}
            style={{ backgroundColor: cameraViewMode === 'drone' ? '#F59E0B' : '#0284C7', color: cameraViewMode === 'drone' ? '#030712' : '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            {cameraViewMode === 'drone' ? '🚶‍♂️ 내 캐릭터 3인칭 시점 복귀' : '🦅 마스터플랜 교회·도시 드론 조감도'}
          </button>

          <button
            onClick={() => triggerHolyBenediction7F('이성현 담임목사님', playerName, playerIdxRef.current)}
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
            className="px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg cursor-pointer"
          >
            ✨ 하늘정원 축도(홀리라이트)
          </button>

          <button
            onClick={() =>
              setTimeOfDay((prev) => (prev === 'day' ? 'sunset' : prev === 'sunset' ? 'night' : 'day'))
            }
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span>
              {timeOfDay === 'day' ? '☀️ 낮 조감도' : timeOfDay === 'sunset' ? '🌅 노을 조감도' : '🌙 도시 야경'}
            </span>
          </button>

          <button
            onClick={() => setShowRoomSigns((prev) => !prev)}
            style={darkPillStyle}
            className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border shadow-lg cursor-pointer"
          >
            <span style={{ color: showRoomSigns ? '#34D399' : '#9CA3AF' }}>
              {showRoomSigns ? '🏷️ 도시명칭 켜짐' : '🏷️ 도시명칭 숨김'}
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
          <span>{isMapDrawerOpen ? '✕ 맵·목록 닫기' : '🗺️ 7F 맵·구역목록 ▼'}</span>
        </button>

        {isMapDrawerOpen && (
          <div
            style={darkPillStyle}
            className="p-2.5 rounded-2xl border shadow-2xl flex flex-col items-center gap-2 w-48 animate-fade-in"
          >
            <canvas ref={minimapRef} width={114} height={94} className="rounded-xl border border-white/10" />
            <div className="w-full flex flex-col gap-1 max-h-[38vh] overflow-y-auto hide-scrollbar pr-0.5">
              {ZONES_7F.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (z.isSeatZone && z.seatTarget) handleSitOnBench(z.seatTarget);
                    else if (z.isObservatory) handleToggleDroneCityView();
                    else if (z.isPassageDoor) {
                      setIsPassageDoorForcedOpen(true);
                      handleWalkTo(-1.2, 0.5);
                    } else {
                      handleWalkTo(z.pos[0], z.pos[2]);
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

      {/* 3. 하단: 하늘정원 소셜 동작 & 퀵 메뉴 바 */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div
            style={darkPillStyle}
            className="p-1 rounded-2xl border shadow-2xl flex items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {[
              { label: '🙌 도시축복만세', emote: 'praise', msg: '할렐루야! 김포 한강신도시와 온 열방 위에 하나님의 나라가 임하소서! 🙌✨' },
              { label: '🙏 중보기도', emote: 'pray', msg: '7층 하늘정원에서 우리 교회와 성도님들의 가정을 위해 간절히 기도합니다 🙏' },
              { label: '💃 기쁨의춤', emote: 'dance', msg: '선선한 루프탑 바람을 맞으며 주님을 찬양합니다! 💃🎶' },
              { label: '👋 반갑게인사', emote: 'wave', msg: '성도님 반갑습니다! 하늘정원 파고라에서 차 한잔 나누세요 👋🥰' }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => triggerSocialAction(act.emote, act.msg)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/30 text-[11px] font-black text-white whitespace-nowrap cursor-pointer transition-colors"
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
              placeholder="하늘정원 말풍선 대화 입력..."
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
                { icon: '🚪', label: '하늘정원통로', onClick: () => { setIsPassageDoorForcedOpen(true); handleWalkTo(-1.2, 0.5); } },
                { icon: '🌿', label: seatedInfo ? '일어나기' : '파고라벤치착석', onClick: () => { if (seatedInfo) handleStandUp(); else handleSitOnBench({ x: -1.4, z: -1.65, rotY: 0, rowLabel: '7F 하늘정원 파고라 벤치석' }); } },
                { icon: '🔭', label: '전망대(드론조감도)', onClick: handleToggleDroneCityView },
                { icon: '🌺', label: '축하화환', onClick: () => { handleWalkTo(3.6, 0.2); setModalZone(ZONES_7F[1]); } },
                { icon: '🛗', label: '7F엘리베이터', onClick: () => { handleWalkTo(3.2, -2.4); setModalZone(ZONES_7F[0]); } }
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
              🌿 7F 하늘정원 메뉴 ▲
            </button>
          )}
        </div>
      </div>

      {/* 4. 메인 3D 캔버스 (대기 원근법 Fog + 물리 기반 Sky 탑재!) */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: timeOfDay === 'night' ? 0.92 : 1.12 }}
      >
        <color attach="background" args={[atmosphereColor]} />
        <fog attach="fog" args={[atmosphereColor, 55, 165]} />

        {timeOfDay !== 'night' && (
          <Sky
            distance={450000}
            sunPosition={timeOfDay === 'sunset' ? [-40, 6, 30] : [-24, 38, 28]}
            inclination={0.48}
            azimuth={0.25}
          />
        )}

        <PerspectiveCamera makeDefault position={[1.2, 10.5, -11.5]} fov={38} near={0.1} far={450} />
        <InitialCameraSetup7F controlsRef={controlsRef} />

        <ambientLight
          intensity={timeOfDay === 'night' ? 0.65 : timeOfDay === 'sunset' ? 1.05 : 1.35}
          color={timeOfDay === 'night' ? '#93C5FD' : timeOfDay === 'sunset' ? '#FDBA74' : '#FFFDF9'}
        />
        <hemisphereLight
          args={[
            timeOfDay === 'night' ? '#1E3A8A' : '#F0F9FF',
            '#CBD5E1',
            timeOfDay === 'night' ? 0.55 : 1.1
          ]}
        />
        <directionalLight
          position={[-28, 42, 32]}
          intensity={timeOfDay === 'night' ? 0.65 : 1.65}
          color={timeOfDay === 'sunset' ? '#FB923C' : '#FFFBEB'}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-75}
          shadow-camera-right={75}
          shadow-camera-top={75}
          shadow-camera-bottom={-75}
          shadow-bias={-0.0005}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleWalkTo(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[12.6, 9.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SevenFloorCityRTMasterScene
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.isPassageDoor) {
              setIsPassageDoorForcedOpen(true);
              handleWalkTo(-1.2, 0.5);
            } else {
              handleWalkTo(z.pos[0], z.pos[2]);
              setModalZone(z);
            }
          }}
          onSitOnBench={handleSitOnBench}
          onToggleDroneView={handleToggleDroneCityView}
          onSelectNpcForChat={handleSelectNpcForChat}
          activeNpcChatIdx={activeNpcChatIdx}
          showRoomSigns={showRoomSigns}
          timeOfDay={timeOfDay}
          playerIdxRef={playerIdxRef}
          isElevatorModalOpen={Boolean(modalZone?.isElevator)}
          isPassageDoorForcedOpen={isPassageDoorForcedOpen}
          remotePeers={remotePeers}
          onSelectRemotePeer={(peer) => setSelectedRemotePeer(peer)}
          holyLightEvent={holyLightEvent}
        />

        <PlayerController7F
          waypoints={waypoints}
          playerIdxRef={playerIdxRef}
          seatedInfo={seatedInfo}
          playerName={playerName}
          playerOffice={playerOffice}
          avatarConfig={avatarConfig}
          emote={emote}
          myChatBubble={myChatBubble}
          controlsRef={controlsRef}
          cameraViewMode={cameraViewMode}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={16} blur={2.2} far={4} />
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.07}
          minDistance={2.8}
          maxDistance={105}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>

      {/* 5. 다른 실제 접속 성도(Remote Peer) 클릭 시 열리는 상호 호환 모달 */}
      {selectedRemotePeer && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRemotePeer(null)}
        >
          <div
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            className="w-full max-w-sm border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 block">7층 하늘정원 성도 교제</span>
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
                  triggerSocialAction('wave', `${selectedRemotePeer.name}님 반갑습니다! 하늘정원 전망이 정말 멋지네요 👋🌿`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 text-xs font-bold text-white cursor-pointer"
              >
                👋 반갑게 인사하기
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('pray', `${selectedRemotePeer.name}님과 함께 김포 한강신도시 복음화를 위해 기도합니다 🙏`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 text-xs font-bold text-white cursor-pointer"
              >
                🙏 함께 중보기도
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('praise', `${selectedRemotePeer.name}님과 함께 할렐루야 주님을 찬양합니다 🙌✨`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-amber-600/40 text-xs font-bold text-white cursor-pointer"
              >
                🙌 함께 찬양만세
              </button>
              <button
                onClick={() => {
                  triggerSocialAction('dance', `${selectedRemotePeer.name}님과 함께 루프탑에서 기쁨의 워십댄스! 💃🎶`);
                  setSelectedRemotePeer(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-pink-600/40 text-xs font-bold text-white cursor-pointer"
              >
                💃 함께 춤추기
              </button>
            </div>

            {canPlayerBless && (
              <button
                onClick={() => {
                  triggerHolyBenediction7F(
                    `${playerName} 목사님`,
                    selectedRemotePeer.name,
                    [selectedRemotePeer.x || 0, 0, selectedRemotePeer.z || 0]
                  );
                  setSelectedRemotePeer(null);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
              >
                ✨ [{selectedRemotePeer.name}] 성도에게 축도(홀리라이트) 내리기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. 목사님 & 성도 NPC 1:1 대화 및 축도 모달 */}
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
                    {selectedChatNpc.role || '7층 루프탑 하늘정원'}
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
                  triggerHolyBenediction7F(pastorName, playerName, playerIdxRef.current);
                }}
                style={{ backgroundColor: '#F59E0B', color: '#030712' }}
                className="w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg animate-pulse"
              >
                ✨ [{selectedChatNpc.name}]께 하늘정원 축도(홀리라이트) 받기 🙏
              </button>
            )}

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setSelectedChatNpc(null);
                  handleToggleDroneCityView();
                }}
                style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🦅 마스터플랜 드론 조감도로 보기
              </button>
              <button
                onClick={() => {
                  handleSitOnBench({ x: -1.4, z: -1.65, rotY: 0, rowLabel: '7F 하늘정원 파고라 벤치석' });
                  setSelectedChatNpc(null);
                }}
                style={{ backgroundColor: '#10B981', color: '#030712' }}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer"
              >
                🌿 파고라 벤치에 앉기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 구역 상세 안내 & 전 층(1F~7F) 이동 엘리베이터 모달 */}
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
                  { fl: '4F', label: '4F 영유아 예배실 (온돌 마루 자모실)' },
                  { fl: '5F', label: '5F 소예배·찬양홀 · 조리실 · 댄스실' },
                  { fl: '6F', label: '6F 다음세대 교육관 · 새가족반' },
                  { fl: '7F', label: '7F 루프탑 하늘정원 · 도시 전망대 (현재 층)' }
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
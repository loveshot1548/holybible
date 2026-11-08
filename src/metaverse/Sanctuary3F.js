// src/metaverse/Sanctuary3F.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, RoundedBox, ContactShadows, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import StairwellCore3D from './StairwellCore3D';

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
      return { url: directUrl, id: parseYoutubeId(directUrl), title: '주일 대예배 말씀' };
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
// 🎨 고해상도 한글 캔버스 텍스처 생성기 (<Html> 에러 원천 차단)
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

// =====================================================================
// 📍 3층 대예배당 6대 인터랙션 존(Trigger Zones) 정의
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_welcome_pew',
    code: '01',
    subCode: '02',
    name: '중앙 새가족 환영 지정석',
    prompt: '01 새가족 환영석에 앉아 예배드리기',
    pos: [1.35, 0, 1.35],
    seatTarget: { x: 0.0, z: -0.95, rowLabel: '중앙 새가족 환영석 (2열)' },
    isSeatZone: true,
    badge: '01 새가족 환영석',
    title: '🪑 "좋은나무교회 환영합니다" 새가족 지정석',
    desc: '등받이에 새가족 환영 커버가 씌워진 본당 중앙 명당 좌석입니다. 착석하시면 즉시 정면 대형 설교 스크린이 켜지고 예배 영상이 재생됩니다!'
  },
  {
    id: 'zone_3f_pulpit',
    code: '02',
    subCode: '03',
    name: '강대상 & 정면 대형 설교 스크린',
    prompt: '02 정면 대형 설교 스크린 켜기 / 링크 설정',
    pos: [-1.45, 0, -0.35],
    badge: '02 강대상 · 대형스크린',
    title: '📺 3층 대예배당 강대상 & 전면 대형 LED 스크린',
    desc: '세로 원목 루버 아트월 중앙에 설치된 대형 LED 설교 스크린과 십자가 강대상, 양옆 대형 꽃꽂이 화분입니다.',
    actions: [
      { label: '📝 예배노트 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 열기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_3f_right_pew',
    code: '03',
    subCode: '03',
    name: '우측 성도석 & 채광 창가',
    prompt: '03 우측 창가 성도석에 착석하기',
    pos: [2.85, 0, 3.15],
    seatTarget: { x: 3.6, z: 1.65, rowLabel: '우측 창가 성도석 (4열)' },
    isSeatZone: true,
    badge: '03 우측 성도석',
    title: '☀️ 따뜻한 햇살이 비치는 우측 성도석',
    desc: '우측 4개의 채광 창문을 통해 밝고 화사한 자연광이 들어오는 성도석 구역입니다.'
  },
  {
    id: 'zone_3f_band',
    code: '04',
    subCode: '04',
    name: '아크릴 드럼부스 & 찬양단 건반석',
    prompt: '04 찬양단 아크릴 드럼부스 & 건반 보기',
    pos: [2.8, 0, -3.2],
    badge: '04 찬양단 악기석',
    title: '🥁 6각 투명 아크릴 드럼 쉴드 & 듀얼 신디사이저',
    desc: '강단 우측에 설치된 투명 아크릴 차음벽 드럼 세트와 2단 신디사이저 건반, 악보 보면대, 바닥 웨지 모니터 스피커 구역입니다.'
  },
  {
    id: 'zone_3f_piano',
    code: '05',
    subCode: '05',
    name: '좌측 그랜드 피아노',
    prompt: '05 클래식 그랜드 피아노 안내',
    pos: [-4.8, 0, -2.8],
    badge: '05 그랜드 피아노',
    title: '🎹 강단 좌측 클래식 블랙 그랜드 피아노',
    desc: '강단 좌측 아래에 배치된 그랜드 피아노와 피아노 벤치 구역입니다.'
  },
  {
    id: 'zone_3f_elev',
    code: '06',
    subCode: '06',
    name: '1층 로비 이동 엘리베이터/계단',
    prompt: '06 엘리베이터 타고 1층 로비로 이동',
    pos: [-5.2, 0, 4.8],
    isElevator: true,
    badge: '06 1F 로비 이동',
    title: '🛗 1층 메인 로비 & 야외 주차장 이동',
    desc: '계단과 엘리베이터를 타고 1층 메인 로비로 즉시 내려갈 수 있습니다.'
  }
];

const PEW_ROWS = [-2.2, -0.9, 0.4, 1.7, 3.0, 4.3];
const PEW_COLS = [
  { colId: 'L', x: -4.2, width: 2.75, name: '좌측석' },
  { colId: 'C', x: 0.0, width: 3.45, name: '중앙석' },
  { colId: 'R', x: 4.2, width: 2.75, name: '우측석' }
];

// 본당 성도 NPC 배치 (중앙 통로 원피스 안내위원 포함)
const CONGREGATION_NPCS = [
  { id: 'usher_lady', x: -1.85, z: 0.15, seated: false, isSkirt: true, rotY: 0.45, shirt: '#F5EBE0', pants: '#E6D5C3', hair: '#6B4423' },
  { id: 'front_kid', x: -1.35, z: 1.64, seated: true, shirt: '#FBBF24', pants: '#0284C7', hair: '#78350F' },
  { id: 'c1', x: -0.95, z: -0.96, seated: true, shirt: '#C084FC', pants: '#334155', hair: '#5C3A21' },
  { id: 'c2', x: 1.05, z: 0.34, seated: true, shirt: '#34D399', pants: '#1E293B', hair: '#5C3A21' },
  { id: 'c3', x: 0.75, z: -2.26, seated: true, shirt: '#60A5FA', pants: '#1E293B', hair: '#451A03' },
  { id: 'r1', x: 3.25, z: -0.96, seated: true, shirt: '#38BDF8', pants: '#1E293B', hair: '#451A03' },
  { id: 'r2', x: 3.75, z: -2.26, seated: true, shirt: '#818CF8', pants: '#1E293B', hair: '#1C1917' },
  { id: 'r3', x: 3.85, z: 0.34, seated: true, shirt: '#FDE68A', pants: '#D6D3D1', hair: '#5C3A21' },
  { id: 'r4', x: 4.55, z: 1.64, seated: true, shirt: '#FB7185', pants: '#2563EB', hair: '#451A03' }
];

// =====================================================================
// 👁️ [필수 구조] 화면을 회전할 때 시야를 가리는 벽을 자동으로 투명하게 만드는 컴포넌트
// =====================================================================
function SmartCutawayWall({ wallSide, children }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    let shouldFade = false;
    // 카메라 위치에 따라 시야 앞쪽을 가리는 벽면 즉시 감지
    if (wallSide === 'south' && camera.position.z > 2.2) shouldFade = true;
    if (wallSide === 'west' && camera.position.x < -2.2) shouldFade = true;
    if (wallSide === 'east' && camera.position.x > 3.5) shouldFade = true;
    if (wallSide === 'north' && camera.position.z < -2.2) shouldFade = true;

    const targetOpacity = shouldFade ? 0.06 : 1.0;

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
// 🟢 바닥 초록색 홀로그램 원형 마커 + 3D 번호 배지
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
      ctx.arc(w / 2 - 16, h / 2, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, w / 2 - 16, h / 2 + 4);

      if (zone.subCode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(w / 2 + 52, h / 2 + 12, 64, 44, 16);
        ctx.fill();
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(zone.subCode, w / 2 + 84, h / 2 + 35);
      }
    }, 320, 220);
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
        <ringGeometry args={[0.55, 0.66, 48]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.55, 48]} />
        <meshBasicMaterial color="#34D399" transparent opacity={isSelected ? 0.45 : 0.25} />
      </mesh>
      <mesh position={[0, 0.20, 0]}>
        <cylinderGeometry args={[0.55, 0.60, 0.38, 32, 1, true]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Billboard position={[0.08, 0.50, 0]}>
        <mesh>
          <planeGeometry args={[0.85, 0.58]} />
          <meshBasicMaterial map={badgeTex} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// =====================================================================
// 🚶‍♀️ 부드러운 둥근 관절형 아바타 (팔·다리·손·원피스/정장·선글라스·말풍선)
// =====================================================================
function SmoothChibiAvatar({
  position = [0, 0, 0],
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isSkirt = false,
  hasSunglasses = false,
  emote = null,
  shirtColor = '#FACC15',
  pantsColor = '#2563EB',
  hairColor = '#B45309',
  skinColor = '#FFE4B5',
  nameTagTexture = null,
  promptTexture = null,
  onClickPrompt = null
}) {
  const rootRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.x = -Math.PI / 2.05;
        rightLegRef.current.rotation.x = -Math.PI / 2.05;
        leftLegRef.current.position.set(-0.09, 0.20, 0.09);
        rightLegRef.current.position.set(0.09, 0.20, 0.09);
      } else if (isWalking) {
        const sw = Math.sin(t * 10) * 0.6;
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
      if (emote === 'wave') {
        rightArmRef.current.rotation.z = -2.4 + Math.sin(t * 14) * 0.35;
        leftArmRef.current.rotation.x = 0;
      } else if (isSeated) {
        leftArmRef.current.rotation.x = -0.5;
        rightArmRef.current.rotation.x = -0.5;
        rightArmRef.current.rotation.z = -0.1;
      } else if (isWalking) {
        const sw = Math.sin(t * 10) * 0.5;
        leftArmRef.current.rotation.x = -sw;
        rightArmRef.current.rotation.x = sw;
        rightArmRef.current.rotation.z = -0.12;
      } else {
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0.14;
        rightArmRef.current.rotation.z = -0.14;
      }
    }

    if (rootRef.current) {
      const bounce = isWalking && !isSeated ? Math.abs(Math.sin(t * 10)) * 0.05 : 0;
      rootRef.current.position.y = (isSeated ? 0.16 : 0) + bounce;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.2} />
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

        <group position={[0, 0.78, 0]}>
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
            {promptTexture && (
              <mesh
                position={[0, 0.35, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClickPrompt) onClickPrompt();
                }}
              >
                <planeGeometry args={[2.1, 0.36]} />
                <meshBasicMaterial map={promptTexture} transparent depthTest={false} />
              </mesh>
            )}
            <mesh renderOrder={12}>
              <planeGeometry args={[1.55, 0.34]} />
              <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
}

// =====================================================================
// 🏛️ 3층 대예배당 화사한 오픈 탑뷰 디오라마 씬 (천장 제거 + 대형 스크린 + 투명 벽!)
// =====================================================================
function SanctuaryMasterpieceDiorama({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnPew,
  onToggleScreenPlayer,
  sermonTitle
}) {
  // 1) 장의자 등받이 '좋은나무교회 환영합니다' 한글 배너 텍스처
  const welcomeCoverTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 18);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.fillStyle = '#0F766E';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('좋은나무교회', w / 2, h / 2 - 14);
      ctx.fillStyle = '#E11D48';
      ctx.fillText('환영합니다', w / 2, h / 2 + 34);
    }, 420, 150);
  }, []);

  // 2) 강대상 양옆 '교회 표어가' 그린 수채화 배너 텍스처
  const standBannerTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ECFCCB');
      grad.addColorStop(0.22, '#FFFFFF');
      grad.addColorStop(0.78, '#FFFFFF');
      grad.addColorStop(1, '#86EFAC');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#14532D';
      ctx.font = '900 46px serif';
      ctx.textAlign = 'center';
      ctx.fillText('말씀과', w / 2, 175);
      ctx.fillText('성령으로', w / 2, 245);
      ctx.fillText('자라가는', w / 2, 315);
      ctx.fillText('좋은나무', w / 2, 385);
    }, 256, 540);
  }, []);

  // 3) 정면 대형 LED 설교 스크린 텍스처 (원래대로 큼직하게 복원!)
  const bigScreenTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1D4ED8');
      grad.addColorStop(0.6, '#1E3A8A');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 테두리 골드 라인
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌳 김포 좋은나무교회 주일 대예배', w / 2, 95);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 62px serif';
      ctx.fillText(sermonTitle || '기적이 상식이 되는 5일의 기도', w / 2, 210);

      ctx.fillStyle = '#BAE6FD';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('▶ 자리에 앉거나 스크린을 터치하면 설교 영상이 재생됩니다', w / 2, 320);
    }, 1024, 420);
  }, [sermonTitle]);

  return (
    <group>
      {/* 1. 본당 바닥 (칙칙한 검은색 대신 밝고 부드러운 웜 슬레이트 타일 카펫!) */}
      <RoundedBox args={[16.2, 0.16, 16.2]} position={[0, -0.08, 0]} radius={0.03} receiveShadow>
        <meshStandardMaterial color="#6E7682" roughness={0.65} />
      </RoundedBox>
      {/* 중앙 통로 따뜻한 베이지그레이 러너 카펫 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.15, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#828B99" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.15, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.92, 8.8]} />
        <meshStandardMaterial color="#828B99" roughness={0.7} />
      </mesh>

      {/* ================================================================= */}
      {/* 🎤 2. 정면 3단 허니오크 우드 강단 & 세로 루버벽 & 대형 LED 설교 스크린! */}
      {/* ================================================================= */}
      <group position={[0, 0, -5.4]}>
        {/* 화사한 3단 계단식 허니오크 우드 무대 */}
        <RoundedBox args={[10.8, 0.15, 3.5]} position={[0, 0.075, 0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color="#E6B882" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[10.4, 0.15, 3.2]} position={[0, 0.225, 0.0]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color="#EDC492" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[10.0, 0.15, 2.9]} position={[0, 0.375, -0.15]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color="#F3CFA2" roughness={0.32} />
        </RoundedBox>

        {/* [북쪽/정면 벽] 카메라가 북쪽 뒤로 돌아가면 자동으로 투명해짐! */}
        <SmartCutawayWall wallSide="north">
          <RoundedBox args={[16.2, 5.2, 0.26]} position={[0, 2.6, -1.65]} radius={0.02} receiveShadow>
            <meshStandardMaterial color="#F7EBDC" roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[6.8, 4.9, 0.08]} position={[0, 2.55, -1.50]} radius={0.01}>
            <meshStandardMaterial color="#9C6334" roughness={0.5} />
          </RoundedBox>
          {Array.from({ length: 35 }).map((_, i) => (
            <RoundedBox
              key={`slat_${i}`}
              args={[0.095, 4.85, 0.09]}
              position={[-3.23 + i * 0.19, 2.55, -1.44]}
              radius={0.015}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#D99B5E" roughness={0.38} />
            </RoundedBox>
          ))}

          {/* 📺 정면 초대형 LED 설교 스크린 (원래 위치 그대로 선명하게 복원!) */}
          <group
            position={[0, 3.28, -1.32]}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleScreenPlayer) onToggleScreenPlayer();
            }}
          >
            <RoundedBox args={[4.5, 2.25, 0.10]} radius={0.03} castShadow>
              <meshStandardMaterial color="#18181B" roughness={0.2} />
            </RoundedBox>
            <mesh position={[0, 0, 0.056]}>
              <planeGeometry args={[4.32, 2.08]} />
              <meshBasicMaterial map={bigScreenTex} />
            </mesh>
          </group>

          {/* 정면 우측 원목 양개 출입문 */}
          <RoundedBox args={[1.55, 2.25, 0.08]} position={[6.1, 1.12, -1.50]} radius={0.01} castShadow>
            <meshStandardMaterial color="#9E6230" roughness={0.45} />
          </RoundedBox>
        </SmartCutawayWall>

        {/* 강대상 양옆 스탠드 배너 2개 */}
        {[-2.65, 2.65].map((bx, bIdx) => (
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

        {/* 중앙 십자가 원목 강대상 & 양옆 풍성한 꽃꽂이 화분 2개 */}
        <group position={[0, 0.45, 0.15]}>
          <RoundedBox args={[1.22, 0.14, 0.68]} position={[0, 0.07, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#C88242" />
          </RoundedBox>
          <RoundedBox args={[1.06, 0.84, 0.56]} position={[0, 0.52, 0]} radius={0.025} castShadow receiveShadow>
            <meshStandardMaterial color="#D9924E" roughness={0.38} />
          </RoundedBox>
          <RoundedBox args={[1.20, 0.10, 0.66]} position={[0, 0.96, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color="#B06D30" />
          </RoundedBox>
          <mesh position={[0, 0.54, 0.29]}>
            <boxGeometry args={[0.055, 0.38, 0.02]} />
            <meshStandardMaterial color="#FDE047" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.60, 0.29]}>
            <boxGeometry args={[0.24, 0.055, 0.02]} />
            <meshStandardMaterial color="#FDE047" metalness={0.7} roughness={0.2} />
          </mesh>
          {[-0.16, 0.16].map((mx, mi) => (
            <mesh key={mi} position={[mx, 1.12, 0.08]} rotation={[0.28, 0, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.26, 8]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          ))}

          {/* 양옆 사각 원목 화분 & 화사한 핑크/화이트/옐로우 꽃송이 */}
          {[-1.05, 1.05].map((fx, fIdx) => (
            <group key={`flw_${fIdx}`} position={[fx, 0, 0.06]}>
              <RoundedBox args={[0.48, 0.46, 0.48]} position={[0, 0.23, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#D9924E" />
              </RoundedBox>
              <mesh position={[0, 0.58, 0]} castShadow>
                <sphereGeometry args={[0.34, 16, 16]} />
                <meshStandardMaterial color="#22C55E" roughness={0.6} />
              </mesh>
              {[
                [0, 0.78, 0, '#FFFFFF', 0.13],
                [-0.15, 0.70, 0.15, '#F472B6', 0.11],
                [0.15, 0.70, 0.15, '#FB7185', 0.11],
                [-0.16, 0.68, -0.14, '#FBCFE8', 0.11],
                [0.16, 0.68, -0.14, '#FEF08A', 0.10],
                [0, 0.64, 0.24, '#FFFFFF', 0.10],
                [-0.24, 0.60, 0.02, '#F43F5E', 0.09],
                [0.24, 0.60, 0.02, '#F9A8D4', 0.09]
              ].map(([bx, by, bz, bcol, brad], bi) => (
                <mesh key={bi} position={[bx, by, bz]} castShadow>
                  <sphereGeometry args={[brad, 10, 10]} />
                  <meshStandardMaterial color={bcol} roughness={0.35} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* 강단 바닥 모니터 스피커 */}
        <RoundedBox args={[0.46, 0.26, 0.36]} position={[2.2, 0.54, 1.05]} rotation={[-0.35, -0.3, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>

        {/* 🎹 3. 좌측 블랙 그랜드 피아노 & 피아노 벤치 */}
        <group position={[-5.6, 0, 1.35]} rotation={[0, 0.18, 0]}>
          <RoundedBox args={[1.45, 0.30, 1.75]} position={[0, 0.68, 0]} radius={0.06} castShadow receiveShadow>
            <meshStandardMaterial color="#1E293B" roughness={0.18} metalness={0.25} />
          </RoundedBox>
          <RoundedBox args={[1.32, 0.06, 0.24]} position={[0, 0.64, 0.88]} radius={0.01}>
            <meshStandardMaterial color="#FFFFFF" />
          </RoundedBox>
          {[[-0.58, -0.68], [0.58, -0.68], [0, 0.68]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.34, lz]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.68, 12]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
          ))}
          <RoundedBox args={[0.76, 0.42, 0.36]} position={[0, 0.21, 1.28]} radius={0.03} castShadow>
            <meshStandardMaterial color="#334155" />
          </RoundedBox>
        </group>

        {/* 🥁 4. 우측 6각 투명 아크릴 드럼 부스 + 드럼 세트 + 2단 건반 */}
        <group position={[3.35, 0.45, -0.15]}>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((ang, ai) => (
            <mesh
              key={ai}
              position={[Math.sin(ang * 1.5) * 0.96, 0.75, Math.cos(ang * 1.5) * 0.96 - 0.1]}
              rotation={[0, ang * 1.5, 0]}
            >
              <boxGeometry args={[0.62, 1.48, 0.03]} />
              <meshStandardMaterial color="#E0F2FE" transparent opacity={0.34} roughness={0.08} />
            </mesh>
          ))}
          <mesh position={[0, 0.28, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.38, 20]} />
            <meshStandardMaterial color="#991B1B" roughness={0.3} />
          </mesh>
          <mesh position={[-0.28, 0.45, 0.12]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.14, 16]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.7} />
          </mesh>
          {[[-0.35, 0.82, -0.05], [0.35, 0.86, -0.05], [0.0, 0.92, -0.25]].map(([cx, cy, cz], ci) => (
            <mesh key={ci} position={[cx, cy, cz]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.015, 20]} />
              <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>

        <group position={[5.05, 0, -0.15]} rotation={[0, -0.35, 0]}>
          <RoundedBox args={[1.28, 0.09, 0.38]} position={[0, 0.72, 0]} radius={0.015} castShadow>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          <RoundedBox args={[1.18, 0.08, 0.32]} position={[0, 0.96, -0.12]} radius={0.015} castShadow>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          <mesh position={[0, 0.36, 0]} castShadow>
            <boxGeometry args={[0.9, 0.72, 0.05]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>

        {/* 💡 5. 시야를 가리는 천장 슬래브는 완전히 제거하고, 공중에 우아한 2단 원형 조명 링과 스피커만 배치! */}
        <group position={[0, 4.95, 0.8]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.9, 0.18, 20, 64]} />
            <meshStandardMaterial color="#FFFBEB" emissive="#FDE68A" emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <torusGeometry args={[1.85, 0.15, 20, 64]} />
            <meshStandardMaterial color="#FFFBEB" emissive="#F59E0B" emissiveIntensity={0.9} />
          </mesh>
        </group>

        {[-3.1, 3.1].map((sx, idx) => (
          <group key={`line_spk_${idx}`} position={[sx, 4.05, 1.1]}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
            {[0.28, 0, -0.28].map((sy, sIdx) => (
              <RoundedBox
                key={sIdx}
                args={[0.66, 0.24, 0.48]}
                position={[0, sy, sIdx * 0.04]}
                rotation={[0.14 + sIdx * 0.08, 0, 0]}
                radius={0.025}
                castShadow
              >
                <meshStandardMaterial color="#1E293B" roughness={0.28} />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 🏢 6. 화면 회전 시 자동으로 투명해지는 동·서·남 외벽 & 2층 발코니 */}
      {/* ================================================================= */}
      {/* [동쪽/우측 벽 & 채광창 4개 & 2층 발코니 & 4층 방송실 창문] */}
      <SmartCutawayWall wallSide="east">
        <RoundedBox args={[0.24, 2.85, 16.0]} position={[7.4, 1.42, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F7EBDC" roughness={0.6} />
        </RoundedBox>
        {[-2.4, -0.5, 1.4, 3.3].map((wz, wi) => (
          <group key={`rwin_${wi}`} position={[7.25, 1.38, wz]}>
            <RoundedBox args={[0.08, 1.48, 0.90]} radius={0.01}>
              <meshStandardMaterial color="#8C5828" />
            </RoundedBox>
            <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.80, 1.36]} />
              <meshStandardMaterial color="#FFFBEB" emissive="#FEF08A" emissiveIntensity={0.95} />
            </mesh>
          </group>
        ))}

        {/* 2층 발코니 슬래브 & 강화유리 난간 */}
        <RoundedBox args={[2.2, 0.38, 13.6]} position={[6.3, 2.75, 0.4]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color="#F5EBE0" roughness={0.55} />
        </RoundedBox>
        <mesh position={[5.25, 3.22, 0.4]}>
          <boxGeometry args={[0.04, 0.58, 13.4]} />
          <meshStandardMaterial color="#BAE6FD" transparent opacity={0.35} roughness={0.1} />
        </mesh>
        <RoundedBox args={[0.07, 0.06, 13.4]} position={[5.25, 3.52, 0.4]} radius={0.01}>
          <meshStandardMaterial color="#8C5828" roughness={0.4} />
        </RoundedBox>

        {/* 4층 방송실 통유리 부스 */}
        <RoundedBox args={[0.24, 2.4, 16.0]} position={[7.4, 4.05, 0]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#F7EBDC" roughness={0.6} />
        </RoundedBox>
        <group position={[7.22, 4.05, 0.2]}>
          <RoundedBox args={[0.12, 1.85, 9.6]} radius={0.01}>
            <meshStandardMaterial color="#334155" />
          </RoundedBox>
          <mesh position={[-0.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[9.3, 1.68]} />
            <meshStandardMaterial color="#64748B" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      </SmartCutawayWall>

      {/* [서쪽/좌측 벽] 카메라가 좌측에 있을 때 자동 투명화! */}
      <SmartCutawayWall wallSide="west">
        <RoundedBox args={[0.24, 4.8, 16.0]} position={[-7.4, 2.4, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F7EBDC" roughness={0.6} />
        </RoundedBox>
      </SmartCutawayWall>

      {/* [남쪽/후면 벽] 카메라가 남쪽 뒤편에 있을 때 자동 투명화! */}
      <SmartCutawayWall wallSide="south">
        <RoundedBox args={[14.8, 4.8, 0.24]} position={[0, 2.4, 7.9]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#F7EBDC" roughness={0.6} />
        </RoundedBox>
      </SmartCutawayWall>

      {/* ================================================================= */}
      {/* 🪑 7. 화사한 허니오크 원목 + 크림베이지 쿠션 장의자(Pews) 3블록 x 6열 */}
      {/* ================================================================= */}
      {PEW_ROWS.map((rz, rIdx) =>
        PEW_COLS.map((col) => {
          const pewKey = `${col.colId}_${rIdx}`;
          const hasWelcomeCover =
            (col.colId === 'L' && (rIdx === 3 || rIdx === 4)) ||
            (col.colId === 'C' && (rIdx === 1 || rIdx === 2));
          const isCurrentSeatedPew =
            seatedInfo && Math.abs(seatedInfo.z - rz) < 0.25 && Math.abs(seatedInfo.x - col.x) < col.width * 0.6;

          return (
            <group
              key={pewKey}
              position={[col.x, 0, rz]}
              onClick={(e) => {
                e.stopPropagation();
                const clickX = Math.max(col.x - col.width * 0.36, Math.min(col.x + col.width * 0.36, e.point.x));
                onSitOnPew({
                  x: clickX,
                  z: rz - 0.05,
                  rowLabel: `${rIdx + 1}열 ${col.name}`
                });
              }}
            >
              {/* 등받이 밝은 허니오크 원목 프레임 */}
              <RoundedBox args={[col.width, 0.84, 0.09]} position={[0, 0.44, 0.22]} radius={0.025} castShadow receiveShadow>
                <meshStandardMaterial color={isCurrentSeatedPew ? '#F59E0B' : '#DF9E5E'} roughness={0.36} />
              </RoundedBox>
              {/* 뒷면 소프트 베이지 웨인스코팅 패널 */}
              <RoundedBox args={[col.width - 0.18, 0.56, 0.02]} position={[0, 0.42, 0.27]} radius={0.005}>
                <meshStandardMaterial color="#C2AA92" roughness={0.5} />
              </RoundedBox>

              {/* 푹신한 웜토프 가죽 방석 & 등쿠션 */}
              <RoundedBox args={[col.width - 0.12, 0.12, 0.46]} position={[0, 0.36, -0.02]} radius={0.03} castShadow receiveShadow>
                <meshStandardMaterial color="#B09882" roughness={0.48} />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.12, 0.46, 0.08]} position={[0, 0.58, 0.16]} radius={0.025} castShadow>
                <meshStandardMaterial color="#BDA58E" roughness={0.48} />
              </RoundedBox>

              {/* 양끝 두꺼운 원목 팔걸이 측판 */}
              <RoundedBox args={[0.10, 0.88, 0.58]} position={[-col.width / 2 + 0.05, 0.44, 0]} radius={0.025} castShadow>
                <meshStandardMaterial color="#DF9E5E" roughness={0.36} />
              </RoundedBox>
              <RoundedBox args={[0.10, 0.88, 0.58]} position={[col.width / 2 - 0.05, 0.44, 0]} radius={0.025} castShadow>
                <meshStandardMaterial color="#DF9E5E" roughness={0.36} />
              </RoundedBox>

              {/* 등받이 위 성경책 2권씩 */}
              <RoundedBox args={[0.26, 0.045, 0.18]} position={[-col.width * 0.27, 0.88, 0.22]} radius={0.008} castShadow>
                <meshStandardMaterial color="#334155" />
              </RoundedBox>
              <RoundedBox args={[0.26, 0.045, 0.18]} position={[col.width * 0.27, 0.88, 0.22]} radius={0.008} castShadow>
                <meshStandardMaterial color="#334155" />
              </RoundedBox>

              {/* '좋은나무교회 환영합니다' 하얀색 커버 배너 */}
              {hasWelcomeCover && (
                <group position={[col.colId === 'C' ? 0.65 : -0.25, 0.79, 0.22]}>
                  <RoundedBox args={[0.86, 0.25, 0.12]} radius={0.015} castShadow>
                    <meshStandardMaterial color="#FFFFFF" />
                  </RoundedBox>
                  <mesh position={[0, 0, 0.062]}>
                    <planeGeometry args={[0.82, 0.22]} />
                    <meshBasicMaterial map={welcomeCoverTex} />
                  </mesh>
                  <mesh position={[0, 0, -0.062]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[0.82, 0.22]} />
                    <meshBasicMaterial map={welcomeCoverTex} />
                  </mesh>
                </group>
              )}
            </group>
          );
        })
      )}

      {/* 8. 전 층 공통 계단실 모듈 & 코너 소화기 */}
      <StairwellCore3D
        currentFloor="3F"
        position={[-5.4, 0, 5.2]}
        onClickStairs={() => onSelectZone(ZONES_3F[5])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '3F 소방안전 설비',
            title: '🧯 3F 대예배당 계단실 코너 소화기 & IDF 단자함',
            desc: '전 층 공통 계단실 입구 코너에 비치되어 있는 초기 진화용 분말 소화기입니다.'
          })
        }
      />

      {/* 9. 성도 NPC 아바타들 */}
      {CONGREGATION_NPCS.map((npc) => (
        <SmoothChibiAvatar
          key={npc.id}
          position={[npc.x, 0, npc.z]}
          rotationY={npc.seated ? Math.PI : (npc.rotY || 0)}
          isSeated={npc.seated}
          isSkirt={Boolean(npc.isSkirt)}
          shirtColor={npc.shirt}
          pantsColor={npc.pants}
          hairColor={npc.hair}
        />
      ))}

      {/* 10. 바닥 초록색 홀로그램 원형 마커 (01 ~ 06) */}
      {ZONES_3F.map((z) => (
        <HologramZoneMarker
          key={z.id}
          zone={z}
          isSelected={activeZoneId === z.id}
          onSelect={(selectedZone) => {
            if (selectedZone.isSeatZone && selectedZone.seatTarget) {
              onSitOnPew(selectedZone.seatTarget);
            } else {
              onSelectZone(selectedZone);
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
  targetPos,
  seatedInfo,
  playerName,
  activeZone,
  emote,
  onClickPrompt,
  onPositionUpdate
}) {
  const posRef = useRef([0.0, 0, 0.8]);
  const [renderState, setRenderState] = useState({
    pos: [0.0, 0, 0.8],
    rotY: Math.PI,
    walking: false
  });

  const nameTagTex = useMemo(() => {
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 48);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#3B82F6';
      ctx.stroke();

      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.arc(52, h / 2, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`나 · ${playerName}`, w / 2 + 18, h / 2 + 2);
    }, 520, 110);
  }, [playerName]);

  const promptTex = useMemo(() => {
    if (!activeZone && !seatedInfo) return null;
    const labelText = seatedInfo ? `${seatedInfo.rowLabel} 예배 중 (일어나기)` : activeZone.prompt;
    return makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(6, 6, w - 12, h - 12, 48);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(24, 22, 66, h - 44, 18);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 40px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', 57, h / 2 + 2);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 34px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labelText.slice(0, 18), 108, h / 2 + 2);
    }, 680, 115);
  }, [activeZone, seatedInfo]);

  useFrame((_, delta) => {
    if (seatedInfo) {
      posRef.current = [seatedInfo.x, 0, seatedInfo.z];
      if (renderState.walking || renderState.pos[0] !== seatedInfo.x) {
        setRenderState({
          pos: [seatedInfo.x, 0, seatedInfo.z],
          rotY: Math.PI,
          walking: false
        });
      }
      return;
    }

    const [cx, , cz] = posRef.current;
    const [tx, , tz] = targetPos;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 3.8);
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
    } else if (renderState.walking) {
      setRenderState((prev) => ({ ...prev, walking: false }));
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
      shirtColor="#38BDF8"
      pantsColor="#2563EB"
      hairColor="#D97706"
      nameTagTexture={nameTagTex}
      promptTexture={promptTex}
      onClickPrompt={onClickPrompt}
    />
  );
}

// =====================================================================
// 🎥 착석 시 정면 대형 설교 스크린을 바라보는 예배 시점 카메라 리그
// =====================================================================
function WorshipCameraRig({ seatedInfo, controlsRef }) {
  useFrame((state) => {
    if (!controlsRef.current) return;
    const cam = state.camera;

    if (seatedInfo) {
      const desiredCamPos = new THREE.Vector3(seatedInfo.x * 0.4, 4.5, seatedInfo.z + 6.5);
      const desiredTarget = new THREE.Vector3(0, 2.0, -5.2);
      cam.position.lerp(desiredCamPos, 0.06);
      cam.zoom = THREE.MathUtils.lerp(cam.zoom, 65, 0.06);
      cam.updateProjectionMatrix();
      controlsRef.current.target.lerp(desiredTarget, 0.08);
      controlsRef.current.update();
    }
  });
  return null;
}

export default function Sanctuary3F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';

  const controlsRef = useRef();
  const minimapRef = useRef(null);
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [targetPos, setTargetPos] = useState([-1.8, 0, 1.2]);
  const [seatedInfo, setSeatedInfo] = useState(null);
  const [activeZone, setActiveZone] = useState(ZONES_3F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [emote, setEmote] = useState(null);

  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const triggerEmote = (type) => {
    setEmote(type);
    setTimeout(() => setEmote(null), 2200);
  };

  // 🪑 [핵심 복원] 의자에 앉는 즉시 설교 영상 플레이어가 자동으로 켜지고 재생됩니다!
  const handleSitOnPew = (seatData) => {
    setSeatedInfo(seatData);
    setTargetPos([seatData.x, 0, seatData.z]);
    setIsScreenPlaying(true);
  };

  const handleStandUp = () => {
    setSeatedInfo(null);
    setIsScreenPlaying(false);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'e') {
        if (seatedInfo) handleStandUp();
        else if (activeZone?.isSeatZone && activeZone.seatTarget) handleSitOnPew(activeZone.seatTarget);
        else if (activeZone) setModalZone(activeZone);
      } else if (k === '1') {
        triggerEmote('wave');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seatedInfo, activeZone]);

  useEffect(() => {
    const mini = minimapRef.current;
    if (!mini) return;
    const ctx = mini.getContext('2d');
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1E222B';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(44, -8);
    ctx.lineTo(0, 18);
    ctx.lineTo(-44, -8);
    ctx.closePath();
    ctx.fillStyle = '#64748B';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-44, -8);
    ctx.lineTo(0, -32);
    ctx.lineTo(0, -45);
    ctx.lineTo(-44, -21);
    ctx.closePath();
    ctx.fillStyle = '#F5EBE0';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(44, -8);
    ctx.lineTo(44, -21);
    ctx.lineTo(0, -45);
    ctx.closePath();
    ctx.fillStyle = '#E6CEB5';
    ctx.fill();

    ctx.strokeStyle = '#DF9E5E';
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-16 + i * 5, -12 + i * 3);
      ctx.lineTo(14 + i * 5, 2 + i * 3);
      ctx.stroke();
    }

    ctx.restore();
  }, [targetPos, seatedInfo]);

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
    const found = ZONES_3F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div translate="no" className="notranslate w-full h-full relative bg-[#F7F2EB] overflow-hidden select-none font-sans">
      
      {/* ── 1. 좌측 상단: 화사한 배경에 어울리는 다크 캡슐 헤더 ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="px-4 py-2.5 rounded-2xl bg-[#26282E]/92 backdrop-blur-md text-white shadow-xl border border-white/15 flex items-center gap-3">
          <button
            onClick={onExitHome}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            ◀ 홈
          </button>
          <span className="text-base font-black tracking-tight">3F 대예배당 본당</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (seatedInfo) handleStandUp();
              else handleSitOnPew({ x: 0.0, z: -0.95, rowLabel: '중앙 새가족 환영석 (2열)' });
            }}
            className={`px-4 py-2 rounded-full text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5 transition-all ${
              seatedInfo
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>{seatedInfo ? '🚶 자리에서 일어나기' : '🪑 새가족석 앉기 (설교자동재생)'}</span>
          </button>

          <button
            onClick={() => setIsScreenPlaying(prev => !prev)}
            className="px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg cursor-pointer"
          >
            {isScreenPlaying ? '📺 스크린 닫기' : '▶ 대형 스크린 켜기'}
          </button>

          <button
            onClick={() => setActiveScreen && setActiveScreen('sermon')}
            className="px-4 py-2 rounded-full bg-[#26282E]/92 hover:bg-black text-white text-xs font-bold border border-white/15 shadow-lg cursor-pointer"
          >
            📝 예배노트 열기
          </button>
        </div>
      </div>

      {/* ── 2. 우측 상단: [01·02·03 + 3D 미니맵 + 04~06] ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1.5">
            {ZONES_3F.slice(0, 3).map((z, idx) => (
              <button
                key={z.id}
                onClick={() => {
                  if (z.isSeatZone && z.seatTarget) handleSitOnPew(z.seatTarget);
                  else {
                    setSeatedInfo(null);
                    setTargetPos([z.pos[0], 0, z.pos[2]]);
                    setActiveZone(z);
                    setModalZone(z);
                  }
                }}
                className="w-10 h-10 rounded-full bg-[#26282E]/92 hover:bg-emerald-500 text-white hover:text-slate-950 font-mono font-black text-xs border border-white/15 shadow-xl flex items-center justify-center cursor-pointer transition-all"
              >
                0{idx + 1}
              </button>
            ))}
          </div>

          <div
            onClick={() => onChangeFloor && onChangeFloor('1F')}
            title="클릭 시 1층 로비로 이동"
            className="p-2 rounded-2xl bg-[#26282E]/92 border border-white/15 shadow-2xl flex flex-col items-start cursor-pointer hover:border-emerald-400"
          >
            <canvas ref={minimapRef} width={118} height={96} className="rounded-xl" />
            <span className="text-[11px] font-extrabold text-white pl-1 mt-1">3D 맵 (1F 이동)</span>
          </div>
        </div>

        <div className="px-2.5 py-3 rounded-2xl bg-[#26282E]/92 border border-white/15 shadow-xl flex flex-col items-center gap-1.5 text-white font-mono text-xs font-black">
          {ZONES_3F.slice(3, 6).map((z, idx) => (
            <React.Fragment key={z.id}>
              <button
                onClick={() => {
                  if (z.isElevator && onChangeFloor) onChangeFloor('1F');
                  else {
                    setSeatedInfo(null);
                    setTargetPos([z.pos[0], 0, z.pos[2]]);
                    setActiveZone(z);
                    setModalZone(z);
                  }
                }}
                className="hover:text-emerald-400 cursor-pointer"
              >
                {z.code}
              </button>
              {idx < 2 && <span className="text-[9px] text-stone-400">~</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 3. 의자에 앉거나 스크린 클릭 시 열리는 본당 전면 설교 유튜브 플레이어 ── */}
      {isScreenPlaying && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[500px] bg-slate-950 border-2 border-amber-400/80 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in">
          <div className="px-3.5 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] font-mono font-black animate-pulse">LIVE SCREEN</span>
              <span className="text-xs font-bold truncate">
                {seatedInfo ? `🪑 ${seatedInfo.rowLabel} 착석 예배 중 · ` : ''}{sermonTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowVideoModal(true)}
                className="text-[11px] font-bold text-amber-300 hover:underline px-1.5 cursor-pointer"
              >
                링크변경
              </button>
              <button
                onClick={() => setIsScreenPlaying(false)}
                className="text-xs font-bold text-slate-400 hover:text-white px-1.5 cursor-pointer"
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
                title="Sanctuary Live Sermon"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center text-white gap-2">
                <p className="text-xs text-slate-300">등록된 설교 유튜브 링크가 없습니다.</p>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  🔗 유튜브 링크 입력하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. 하단 중앙: 5대 독립 원형 캡슐 독 바 ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto">
        {[
          { icon: '📖', label: '본문 말씀', sub: '', onClick: () => setModalZone(ZONES_3F[1]) },
          { icon: '📝', label: '자유 메모장', sub: '', onClick: () => setActiveScreen && setActiveScreen('sermon') },
          { icon: '📌', label: '설교 3대지', sub: '', onClick: () => setIsScreenPlaying(prev => !prev) },
          { icon: '🔬', label: '원어 사전', sub: '(QT형)', onClick: () => setActiveScreen && setActiveScreen('interlinear') },
          { icon: '🙏', label: '감사 선포', sub: '', onClick: () => triggerEmote('wave') }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className="w-[74px] h-[68px] sm:w-[86px] sm:h-[76px] rounded-[26px] bg-[#22242A]/92 hover:bg-[#2C2F37] backdrop-blur-xl border border-white/15 shadow-[0_14px_30px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-lg sm:text-xl leading-none">{item.icon}</span>
            <span className="text-[10.5px] sm:text-[11px] font-extrabold text-white leading-tight whitespace-nowrap">
              {item.label}
            </span>
            {item.sub && (
              <span className="text-[9px] font-bold text-stone-300 leading-none -mt-0.5">
                {item.sub}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 5. 메인 3D 캔버스 — 천장 없는 화사한 오픈 탑뷰(Orthographic) + 회전 시 벽 투명화! ── */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.32 }}
      >
        <OrthographicCamera makeDefault position={[-10.5, 9.5, 11.5]} zoom={48} near={-50} far={200} />

        {/* 그림자 그늘 없이 전체를 뽀얗고 화사하게 비추는 다중 스튜디오 조명 */}
        <ambientLight intensity={1.55} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#E6D5C3', 1.25]} />
        <directionalLight
          position={[-8, 18, 12]}
          intensity={1.65}
          color="#FFF7ED"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[0, 4.2, -4.2]} intensity={2.2} distance={18} color="#FDE047" />

        <WorshipCameraRig seatedInfo={seatedInfo} controlsRef={controlsRef} />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (seatedInfo) setSeatedInfo(null);
            const cx = Math.max(-6.2, Math.min(6.2, e.point.x));
            const cz = Math.max(-3.6, Math.min(6.5, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[16.0, 16.0]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SanctuaryMasterpieceDiorama
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            setSeatedInfo(null);
            if (z.pos) setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnPew={handleSitOnPew}
          onToggleScreenPlayer={() => setIsScreenPlaying(prev => !prev)}
          sermonTitle={sermonTitle}
        />

        <PlayerController3F
          targetPos={targetPos}
          seatedInfo={seatedInfo}
          playerName={playerName}
          activeZone={activeZone}
          emote={emote}
          onClickPrompt={() => {
            if (seatedInfo) handleStandUp();
            else if (activeZone?.isSeatZone && activeZone.seatTarget) handleSitOnPew(activeZone.seatTarget);
            else if (activeZone) setModalZone(activeZone);
          }}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.28} scale={24} blur={2.2} far={4} />
        <MapControls
          ref={controlsRef}
          target={[0.2, 1.0, -0.8]}
          enableRotate={true}
          enableZoom={true}
          minZoom={32}
          maxZoom={110}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      {/* ── 6. 유튜브 링크 설정 모달 ── */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-black text-amber-300">📺 3층 대예배당 전면 스크린 유튜브 연동</span>
              <button onClick={() => setShowVideoModal(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">
                ✕ 닫기
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">설교 제목</label>
              <input
                type="text"
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-xs outline-none"
              />
              <label className="text-[11px] font-bold text-slate-300 block pt-1">유튜브 영상 링크 (URL)</label>
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-xs outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveYoutubeLink}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                본당 스크린에 상영하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. 구역 상세 안내 모달 ── */}
      {modalZone && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalZone(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                {modalZone.badge}
              </span>
              <button onClick={() => setModalZone(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                ✕ 닫기
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-black">{modalZone.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed break-keep">{modalZone.desc}</p>

            {modalZone.actions && modalZone.actions.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {modalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setModalZone(null);
                      if (setActiveScreen) setActiveScreen(act.screen);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    {act.label}
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
// src/games/jerusalem/components/GameEngine.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_SIZE = 2.0;
const HALF_MAP = (MAP_SIZE * TILE_SIZE) / 2;

const WALKER_THOUGHTS = {
  jesus: {
    name: '예수 그리스도',
    thoughts: [
      '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.',
      '나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요.',
      '누구든지 목마르거든 내게로 와서 마시라!'
    ]
  },
  disciple: {
    name: '열두 제자 & 물동이 배급원',
    thoughts: [
      '생명의 빵과 갈릴리 생선을 백성들의 집으로 부지런히 나르고 있습니다!',
      '실로암 아치 수로교의 맑은 물이 이 거리까지 시원하게 공급되고 있군요.',
      '성전 예배의 기쁨이 온 예루살렘 거리에 가득합니다!'
    ]
  },
  merchant: {
    name: '예루살렘 낙타 무역상단',
    thoughts: [
      '감람산의 순수한 올리브 기름과 가나의 포도주를 낙타에 싣고 갑니다.',
      '장터마다 곡식과 물고기가 넘쳐나니 성읍이 날마다 번창합니다!',
      '다윗의 성문 안으로 평안을 비는 순례자들이 몰려옵니다.'
    ]
  }
};

// =====================================================================
// ⛰️ 지형 고도(Elevation) 및 자연 생태계 판별기
// =====================================================================
export const getNaturalTerrainType = (r, c) => {
  if (c === MAP_SIZE - 1 || (r >= MAP_SIZE - 2 && c >= MAP_SIZE - 3)) {
    return 'water';
  }
  if (r >= 2 && r <= 6 && c >= 2 && c <= 6) {
    return 'zion_plateau';
  }
  if (c === MAP_SIZE - 2 || (r >= MAP_SIZE - 3 && c >= MAP_SIZE - 4)) {
    return 'meadow';
  }
  const hash = (r * 31 + c * 17) % 19;
  if (hash === 0) return 'palm_tree';
  if (hash === 1) return 'olive_tree';
  if (hash === 2) return 'cypress_tree';
  if (hash === 3) return 'desert_rock';
  return 'sand';
};

export const getTileElevation3D = (r, c, cell) => {
  const terrain = getNaturalTerrainType(r, c);
  if (!cell && terrain === 'water') return -0.32;
  if (terrain === 'zion_plateau') return 0.55;
  return 0.0;
};

export const gridToWorld3D = (r, c, w = 1, h = 1, elev = 0) => {
  const centerR = r + (h - 1) / 2;
  const centerC = c + (w - 1) / 2;
  const wx = (centerC - (MAP_SIZE - 1) / 2) * TILE_SIZE;
  const wz = (centerR - (MAP_SIZE - 1) / 2) * TILE_SIZE;
  return [wx, elev, wz];
};

// =====================================================================
// 🎨 고해상도 프로시저럴 텍스처 & 유기적 곡면 지오메트리(Lathe / Extrude) 캐시
// =====================================================================
function makeCanvasTex(drawFn, w = 512, h = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeAshlarWallTexture(baseHex = '#F5EBE0', mortarHex = '#D0BFA6') {
  return makeCanvasTex((ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.fillStyle = r % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, y, w, rowH);
      ctx.strokeStyle = mortarHex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const cols = 4;
      const colW = w / cols;
      for (let c = 0; c < cols; c++) {
        const x = c * colW + (r % 2) * (colW / 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
  }, 512, 512);
}

function makeBubbleBadgeTexture(icon = '🍞') {
  return makeCanvasTex((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w / 2, h / 2 - 10, 8, w / 2, h / 2 - 10, 76);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.75, '#FEF3C7');
    grad.addColorStop(1, '#FDE68A');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 14, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w / 2 - 18, h / 2 + 52);
    ctx.lineTo(w / 2 + 18, h / 2 + 52);
    ctx.lineTo(w / 2, h / 2 + 82);
    ctx.closePath();
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    ctx.font = '76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, w / 2, h / 2 - 10);
  }, 200, 200);
}

// =====================================================================
// 🏺 [유기적 3D 지오메트리 컴포넌트] — 박스(Box) 완전 배제!
// 1) 진짜 반원통 기와골(Barrel Tiles)이 얹힌 지중해식 테라코타 박공지붕
// 2) 아치 구멍이 실제로 뚫린 로마식 수로교 아치(ExtrudeGeometry)
// 3) 물결치는 장터 패브릭 캐노피 & 물레 성형 암포라 항아리(LatheGeometry)
// =====================================================================
function MediterraneanTiledRoof3D({
  width = 1.4,
  length = 1.4,
  height = 0.48,
  color = '#C84B20',
  ridgeColor = '#FDE68A',
  position = [0, 0, 0],
  rotationY = 0
}) {
  const slopeLen = Math.hypot(width / 2, height);
  const slopeAngle = Math.atan2(height, width / 2);
  const ribCount = Math.max(4, Math.floor(length / 0.24));

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 앞뒤 삼각 박공벽(Pediment Gable) */}
      {[-length / 2 + 0.04, length / 2 - 0.04].map((gz, gi) => (
        <mesh key={gi} position={[0, height / 2, gz]} rotation={[0, Math.PI / 4, 0]} scale={[width * 0.7, 1, 0.08]} castShadow>
          <coneGeometry args={[1, height, 4]} />
          <meshStandardMaterial color="#F5EBE0" roughness={0.6} />
        </mesh>
      ))}

      {/* 좌측 경사 지붕판 & 반원통 기와골(Imbrex Ribs) */}
      <group position={[-width / 4, height / 2, 0]} rotation={[0, 0, slopeAngle]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[slopeLen + 0.12, 0.05, length + 0.14]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        {Array.from({ length: ribCount }).map((_, ri) => {
          const rz = -length / 2 + 0.1 + (ri / Math.max(1, ribCount - 1)) * (length - 0.2);
          return (
            <mesh key={ri} position={[0, 0.035, rz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.038, 0.042, slopeLen + 0.14, 8, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={ri % 2 === 0 ? '#E05A2B' : '#B83D14'} roughness={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* 우측 경사 지붕판 & 반원통 기와골 */}
      <group position={[width / 4, height / 2, 0]} rotation={[0, 0, -slopeAngle]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[slopeLen + 0.12, 0.05, length + 0.14]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        {Array.from({ length: ribCount }).map((_, ri) => {
          const rz = -length / 2 + 0.1 + (ri / Math.max(1, ribCount - 1)) * (length - 0.2);
          return (
            <mesh key={ri} position={[0, 0.035, rz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.038, 0.042, slopeLen + 0.14, 8, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={ri % 2 === 0 ? '#E05A2B' : '#B83D14'} roughness={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* 상단 원통형 용마루(Ridge Tile) */}
      <mesh position={[0, height + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, length + 0.18, 10]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

// 물레 성형 암포라(Amphora) 도자기 항아리 컴포넌트
function ClayAmphora3D({ position = [0, 0, 0], scale = 1.0, color = '#C2410C' }) {
  const latheGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.08, 0.02),
      new THREE.Vector2(0.16, 0.14),
      new THREE.Vector2(0.14, 0.26),
      new THREE.Vector2(0.06, 0.34),
      new THREE.Vector2(0.09, 0.40),
      new THREE.Vector2(0.05, 0.41)
    ];
    return new THREE.LatheGeometry(pts, 14);
  }, []);

  return (
    <mesh geometry={latheGeo} position={position} scale={[scale, scale, scale]} castShadow>
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

// 🌲 유기적 지중해 자연 나무 & 바위 컴포넌트
function MediterraneanTree3D({ position, type = 'cypress', scale = 1.0 }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.6 + position[0]) * 0.03;
    }
  });

  if (type === 'palm_tree') {
    return (
      <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
        {/* 살짝 휘어진 유기적 야자수 기둥 */}
        <mesh position={[0, 0.24, 0]} rotation={[0.05, 0, -0.06]} castShadow>
          <cylinderGeometry args={[0.07, 0.11, 0.5, 10]} />
          <meshStandardMaterial color="#78350F" roughness={0.85} />
        </mesh>
        <mesh position={[0.03, 0.68, -0.02]} rotation={[-0.04, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.045, 0.07, 0.5, 10]} />
          <meshStandardMaterial color="#854D0E" roughness={0.85} />
        </mesh>
        {/* 코코넛 열매 & 7장 아치형 야자 잎사귀 */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const ang = (i * Math.PI * 2) / 7;
          return (
            <group key={i} position={[0.05, 0.92, -0.03]} rotation={[0, ang, 0]}>
              <mesh position={[0.28, -0.05, 0]} rotation={[0, 0, -0.42]} scale={[1.15, 0.12, 0.32]} castShadow>
                <sphereGeometry args={[0.32, 10, 8]} />
                <meshStandardMaterial color={i % 2 === 0 ? '#15803D' : '#22C55E'} roughness={0.55} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (type === 'olive_tree') {
    return (
      <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
        <mesh position={[0, 0.25, 0]} rotation={[0.08, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.07, 0.13, 0.5, 10]} />
          <meshStandardMaterial color="#5C381E" roughness={0.9} />
        </mesh>
        {[
          [0, 0.62, 0, 0.34, '#4D7C0F'],
          [-0.20, 0.54, 0.14, 0.25, '#65A30D'],
          [0.20, 0.56, -0.12, 0.26, '#3F6212'],
          [0.08, 0.72, 0.15, 0.22, '#84CC16']
        ].map(([lx, ly, lz, lr, col], idx) => (
          <mesh key={idx} position={[lx, ly, lz]} scale={[1.15, 0.82, 1.05]} castShadow>
            <dodecahedronGeometry args={[lr, 1]} />
            <meshStandardMaterial color={col} roughness={0.75} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === 'desert_rock') {
    return (
      <group position={position} scale={[scale, scale, scale]}>
        <mesh position={[0, 0.14, 0]} rotation={[0.2, 0.5, -0.1]} scale={[1.3, 0.75, 1.1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.28, 1]} />
          <meshStandardMaterial color="#A8A29E" roughness={0.9} />
        </mesh>
        <mesh position={[0.22, 0.09, 0.14]} rotation={[-0.3, 0.2, 0.4]} scale={[1.1, 0.65, 0.9]} castShadow>
          <dodecahedronGeometry args={[0.18, 1]} />
          <meshStandardMaterial color="#78716C" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // 기본: 다층 원추형 지중해 사이프러스(Cypress) 나무
  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.36, 8]} />
        <meshStandardMaterial color="#451A03" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.25, 0.65, 12]} />
        <meshStandardMaterial color="#14532D" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <coneGeometry args={[0.20, 0.60, 12]} />
        <meshStandardMaterial color="#15803D" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.06, 0]} castShadow>
        <coneGeometry args={[0.13, 0.48, 12]} />
        <meshStandardMaterial color="#16A34A" roughness={0.55} />
      </mesh>
    </group>
  );
}

// =====================================================================
// ⛵ 곡선 선체(`Lathe` + `Sphere`)를 가진 고대 로마/갈릴리 범선(Galley)
// =====================================================================
function SailingRomanGalley({ startZ = -14, xPos = 20.5, speed = 1.2, dir = 1 }) {
  const shipRef = useRef();

  useFrame(({ clock }, delta) => {
    if (!shipRef.current) return;
    shipRef.current.position.z += delta * speed * dir;
    if (dir > 0 && shipRef.current.position.z > 20) shipRef.current.position.z = -20;
    if (dir < 0 && shipRef.current.position.z < -20) shipRef.current.position.z = 20;

    shipRef.current.position.y = -0.24 + Math.sin(clock.elapsedTime * 2.4 + xPos) * 0.05;
    shipRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.9) * 0.04;
  });

  return (
    <group ref={shipRef} position={[xPos, -0.24, startZ]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      {/* 유선형 배 선체 (반구를 길게 늘린 형태 — 박스 아님!) */}
      <mesh position={[0, 0.22, 0]} scale={[0.52, 0.38, 1.45]} castShadow>
        <sphereGeometry args={[1.0, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#78350F" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* 갑판 */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.48, 1.38, 1]}>
        <circleGeometry args={[1.0, 20]} />
        <meshStandardMaterial color="#B45309" roughness={0.7} />
      </mesh>
      {/* 선수/선미 우아한 백조 곡선 기둥 */}
      <mesh position={[0, 0.42, 1.32]} rotation={[0.45, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.065, 0.65, 10]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.46, -1.32]} rotation={[-0.45, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.065, 0.72, 10]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.6} />
      </mesh>
      {/* 마스트 & 바람에 부풀어 오른 볼록한 돛 */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.045, 1.6, 10]} />
        <meshStandardMaterial color="#451A03" />
      </mesh>
      <mesh position={[0, 1.08, 0.1]} scale={[0.95, 0.85, 0.28]} castShadow>
        <sphereGeometry args={[0.72, 18, 14, 0, Math.PI]} />
        <meshStandardMaterial color="#FFFBEB" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* 양옆 노(Oars) 6개 */}
      {[-0.45, 0, 0.45].map((oz, oi) => (
        <React.Fragment key={oi}>
          <mesh position={[-0.52, 0.1, oz]} rotation={[0, 0, -1.1]}>
            <cylinderGeometry args={[0.012, 0.018, 0.65, 6]} />
            <meshStandardMaterial color="#D97706" />
          </mesh>
          <mesh position={[0.52, 0.1, oz]} rotation={[0, 0, 1.1]}>
            <cylinderGeometry args={[0.012, 0.018, 0.65, 6]} />
            <meshStandardMaterial color="#D97706" />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}

// =====================================================================
// 🏛️ 24종 건물별 비(非)박스 유기적 고품격 3D 건축 렌더러
// =====================================================================
function AnnoBuilding3D({
  cell,
  grid,
  textures,
  sharedGeos,
  isNight,
  onSelectBuilding
}) {
  const { r, c, type, level = 1, w = 1, h = 1 } = cell;
  const elev = getTileElevation3D(r, c, cell);
  const [wx, wy, wz] = gridToWorld3D(r, c, w, h, elev);

  const bw = w * TILE_SIZE * 0.88;
  const bh = h * TILE_SIZE * 0.88;

  const sailRef = useRef();
  const smokeRef = useRef();

  useFrame(({ clock }, delta) => {
    if (sailRef.current) {
      sailRef.current.rotation.z -= delta * 1.8;
    }
    if (smokeRef.current) {
      smokeRef.current.position.y = 2.6 + Math.sin(clock.elapsedTime * 2.2) * 0.15;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelectBuilding) onSelectBuilding(r, c, cell);
  };

  // ── 🏠 1. 5단계 진화 주택 (유목민 천막 ➔ 돔 아도비 하우스 ➔ 아치 석조가옥 ➔ 중정 기와 빌라 ➔ 황금 돔 궁정) ──
  if (type === 'house') {
    if (level === 1) {
      // Tier 1: 유목민 드리프트 천막 + 원형 러그 + 돌 화덕 모닥불 + 암포라 항아리
      return (
        <group position={[wx, wy, wz]} onClick={handleClick}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <circleGeometry args={[0.82, 24]} />
            <meshStandardMaterial color="#B91C1C" roughness={0.85} />
          </mesh>
          {/* 유선형 벨 텐트(Bell Tent) */}
          <mesh position={[-0.12, 0.22, -0.08]} castShadow>
            <cylinderGeometry args={[0.48, 0.62, 0.42, 12]} />
            <meshStandardMaterial color="#5C4033" roughness={0.8} />
          </mesh>
          <mesh position={[-0.12, 0.58, -0.08]} castShadow>
            <coneGeometry args={[0.52, 0.38, 12]} />
            <meshStandardMaterial color="#78350F" roughness={0.75} />
          </mesh>
          {/* 돌 화덕 & 모닥불 */}
          <mesh position={[0.42, 0.14, 0.35]}>
            <coneGeometry args={[0.14, 0.28, 10]} />
            <meshBasicMaterial color="#F97316" />
          </mesh>
          <ClayAmphora3D position={[0.38, 0.02, -0.32]} scale={0.7} />
        </group>
      );
    }

    if (level === 2) {
      // Tier 2: 고대 유대 돔 지붕 아도비 가옥 (네모 상자 대신 둥근 돔 지붕 + 아치 포치 + 나무 그늘막!)
      return (
        <group position={[wx, wy, wz]} onClick={handleClick}>
          {/* 둥근 모서리 마당 석재 바닥 */}
          <mesh position={[0, 0.05, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
            <cylinderGeometry args={[1.05, 1.12, 0.10, 4]} />
            <meshStandardMaterial color="#D6C5AF" roughness={0.8} />
          </mesh>
          {/* 본채 & 부드러운 반구형 진흙 돔(Mudbrick Dome) */}
          <mesh position={[-0.12, 0.45, -0.1]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.72, 0.95]} />
            <meshStandardMaterial map={textures.mudWall} roughness={0.75} />
          </mesh>
          <mesh position={[-0.12, 0.80, -0.1]} scale={[1.0, 0.62, 0.95]} castShadow>
            <sphereGeometry args={[0.48, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#E6BA8E" roughness={0.7} />
          </mesh>
          {/* 정면 아치형 출입구 */}
          <mesh position={[-0.12, 0.32, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#3E2009" />
          </mesh>
          {/* 마당 올리브 나무 & 암포라 항아리 2개 */}
          <ClayAmphora3D position={[0.48, 0.10, 0.32]} scale={0.85} />
          <ClayAmphora3D position={[0.32, 0.10, 0.46]} scale={0.7} color="#9A3412" />
          <MediterraneanTree3D position={[0.48, 0.10, -0.38]} type="olive_tree" scale={0.7} />
        </group>
      );
    }

    if (level === 3) {
      // Tier 3: 예루살렘 아치 회랑 석조 가옥 + 반원통 테라코타 기와지붕 + 사이프러스 정원
      return (
        <group position={[wx, wy, wz]} onClick={handleClick}>
          <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
            <cylinderGeometry args={[1.12, 1.18, 0.12, 4]} />
            <meshStandardMaterial map={textures.ashlarWall} />
          </mesh>
          {/* ㄱ자 복합 건물: 2층 주동 + 1층 아치 윙 */}
          <mesh position={[-0.18, 0.62, -0.15]} castShadow receiveShadow>
            <boxGeometry args={[0.96, 1.02, 0.92]} />
            <meshStandardMaterial map={textures.ashlarWall} roughness={0.5} />
          </mesh>
          <MediterraneanTiledRoof3D
            width={1.06}
            length={1.02}
            height={0.38}
            position={[-0.18, 1.13, -0.15]}
          />
          {/* 우측 1층 아치 포치 & 반구형 소형 돔 */}
          <mesh position={[0.38, 0.42, 0.15]} castShadow receiveShadow>
            <boxGeometry args={[0.62, 0.62, 0.72]} />
            <meshStandardMaterial map={textures.ashlarWall} />
          </mesh>
          <mesh position={[0.38, 0.72, 0.15]} scale={[1, 0.65, 1]} castShadow>
            <sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#FAF5EB" />
          </mesh>
          <MediterraneanTree3D position={[-0.48, 0.12, 0.52]} type="cypress" scale={0.82} />
          <ClayAmphora3D position={[0.12, 0.12, 0.55]} scale={0.75} />
        </group>
      );
    }

    if (level === 4) {
      // Tier 4: 《Anno 117》 스타일 로마-유대 아트리움 중정 빌라 (기둥 회랑 + 분수 연못 + 입체 기와지붕)
      return (
        <group position={[wx, wy, wz]} onClick={handleClick}>
          <mesh position={[0, 0.07, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
            <cylinderGeometry args={[1.16, 1.22, 0.14, 4]} />
            <meshStandardMaterial color="#F1ECE1" />
          </mesh>
          {/* 북쪽 2층 본관 + 진짜 기와골 박공지붕 */}
          <mesh position={[0, 0.74, -0.28]} castShadow receiveShadow>
            <boxGeometry args={[1.48, 1.22, 0.78]} />
            <meshStandardMaterial map={textures.ashlarWall} roughness={0.4} />
          </mesh>
          <MediterraneanTiledRoof3D
            width={1.60}
            length={0.90}
            height={0.46}
            position={[0, 1.35, -0.28]}
            rotationY={Math.PI / 2}
          />
          {/* 남쪽 중정 원형 분수 수조 & 원통 대리석 기둥 4개 */}
          <mesh position={[0, 0.18, 0.36]} castShadow>
            <cylinderGeometry args={[0.34, 0.38, 0.16, 20]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.27, 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.28, 20]} />
            <meshStandardMaterial color="#0EA5E9" roughness={0.1} metalness={0.4} />
          </mesh>
          {[-0.58, -0.22, 0.22, 0.58].map((cx, ci) => (
            <mesh key={ci} position={[cx, 0.42, 0.12]} castShadow>
              <cylinderGeometry args={[0.045, 0.055, 0.62, 12]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          ))}
          <MediterraneanTree3D position={[-0.62, 0.14, 0.48]} type="cypress" scale={0.9} />
          <MediterraneanTree3D position={[0.62, 0.14, 0.48]} type="cypress" scale={0.9} />
        </group>
      );
    }

    // Tier 5: 로마-헤롯식 황금 돔 & 열주 대리석 궁정 (최고 등급 귀족 Domus)
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        <mesh position={[0, 0.09, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
          <cylinderGeometry args={[1.20, 1.26, 0.18, 4]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* 백색 대리석 궁전 본관 */}
        <mesh position={[0, 0.82, -0.18]} castShadow receiveShadow>
          <boxGeometry args={[1.52, 1.32, 0.96]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* 양옆 테라코타 기와 날개 지붕 + 중앙 황금 판테온 돔(Golden Dome)! */}
        <MediterraneanTiledRoof3D
          width={1.64}
          length={1.06}
          height={0.42}
          color="#B91C1C"
          ridgeColor="#FACC15"
          position={[0, 1.48, -0.18]}
          rotationY={Math.PI / 2}
        />
        <mesh position={[0, 1.68, -0.18]} castShadow>
          <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* 전면 6개 대리석 코린트 원통 기둥 회랑 */}
        {[-0.62, -0.37, -0.12, 0.12, 0.37, 0.62].map((cx, ci) => (
          <mesh key={ci} position={[cx, 0.68, 0.36]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 1.05, 14]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
          </mesh>
        ))}
        <MediterraneanTree3D position={[-0.68, 0.18, 0.56]} type="cypress" scale={1.0} />
        <MediterraneanTree3D position={[0.68, 0.18, 0.56]} type="cypress" scale={1.0} />
      </group>
    );
  }

  // ── 👑 2. 헤롯 제2성전 (3x3 대성전 — 28개 원통 대리석 열주 회랑 & 아치 성문 & 황금 성소) ──
  if (type === 'temple') {
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        {/* 2단 경사 석조 성전산 기단 */}
        <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.75, 3.98, 0.44, 4]} />
          <meshStandardMaterial map={textures.ashlarWall} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
          <cylinderGeometry args={[3.55, 3.68, 0.18, 4]} />
          <meshStandardMaterial color="#F5EFE6" roughness={0.3} />
        </mesh>

        {/* 솔로몬의 행각(Royal Stoa) — 사방을 둘러싼 28개의 진짜 원통형 대리석 열주(Columns)와 기와 지붕! */}
        {[-2.25, 2.25].map((posZ, zIdx) => (
          <group key={`stoa_row_z_${zIdx}`} position={[0, 0.60, posZ]}>
            {[-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1].map((colX, ci) => (
              <mesh key={ci} position={[colX, 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.065, 0.075, 0.84, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
              </mesh>
            ))}
            <MediterraneanTiledRoof3D
              width={0.62}
              length={4.65}
              height={0.24}
              position={[0, 0.84, 0]}
              rotationY={Math.PI / 2}
            />
          </group>
        ))}
        {[-2.25, 2.25].map((posX, xIdx) => (
          <group key={`stoa_row_x_${xIdx}`} position={[posX, 0.60, 0]}>
            {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((colZ, ci) => (
              <mesh key={ci} position={[0, 0.42, colZ]} castShadow>
                <cylinderGeometry args={[0.065, 0.075, 0.84, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
              </mesh>
            ))}
            <MediterraneanTiledRoof3D
              width={0.62}
              length={3.85}
              height={0.24}
              position={[0, 0.84, 0]}
              rotationY={0}
            />
          </group>
        ))}

        {/* 내소 성소 본관(Heikhal) — 원통 코린트 황금 기둥 6개 & 아치형 성전 황금문 & 상단 황금 크라운 */}
        <group position={[0, 0.62, -0.38]}>
          {/* 성소 입구 5단 대리석 계단 */}
          {[0, 1, 2, 3].map((st) => (
            <mesh key={st} position={[0, 0.06 + st * 0.08, 1.15 - st * 0.10]} receiveShadow>
              <boxGeometry args={[1.65 - st * 0.1, 0.08, 0.22]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          ))}
          {/* 성소 백색 대리석 본체 */}
          <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.55, 2.45, 1.95]} />
            <meshStandardMaterial color="#FFFDF9" roughness={0.2} />
          </mesh>
          {/* 정면 6대 원통 황금 기둥 */}
          {[-1.02, -0.64, -0.32, 0.32, 0.64, 1.02].map((colX, ci) => (
            <group key={ci} position={[colX, 1.32, 1.02]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.085, 0.105, 2.38, 16]} />
                <meshStandardMaterial color="#FDE047" metalness={0.82} roughness={0.18} />
              </mesh>
              <mesh position={[0, 1.20, 0]}>
                <cylinderGeometry args={[0.13, 0.085, 0.12, 12]} />
                <meshStandardMaterial color="#F59E0B" metalness={0.9} />
              </mesh>
            </group>
          ))}
          {/* 아치형 성소 황금문(Golden Archway) */}
          <mesh position={[0, 0.85, 0.99]}>
            <boxGeometry args={[0.56, 1.35, 0.06]} />
            <meshStandardMaterial color="#92400E" metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.52, 0.99]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.06, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#FACC15" metalness={0.9} />
          </mesh>
          {/* 상단 순금 코니스 & 황금 첨탑 스파이크 난간 */}
          <mesh position={[0, 2.65, 0]} castShadow>
            <boxGeometry args={[2.75, 0.28, 2.15]} />
            <meshStandardMaterial color="#FACC15" metalness={0.88} roughness={0.14} />
          </mesh>
          {Array.from({ length: 9 }).map((_, si) => (
            <mesh key={si} position={[-1.2 + si * 0.3, 2.92, 1.02]} castShadow>
              <coneGeometry args={[0.045, 0.26, 8]} />
              <meshStandardMaterial color="#FEF08A" metalness={0.95} />
            </mesh>
          ))}
        </group>

        {/* 원통형 청동 바다(물두멍) & 놋번제단 연기 */}
        <mesh position={[-0.85, 0.82, 1.15]} castShadow>
          <cylinderGeometry args={[0.36, 0.24, 0.32, 20]} />
          <meshStandardMaterial color="#D97706" metalness={0.75} roughness={0.25} />
        </mesh>
        <group position={[0.78, 0.62, 1.15]}>
          <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.58, 0.44, 4]} />
            <meshStandardMaterial color="#78350F" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <coneGeometry args={[0.22, 0.38, 12]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
          <group ref={smokeRef} position={[0, 1.1, 0]}>
            {[0, 0.42, 0.85].map((sy, si) => (
              <mesh key={si} position={[Math.sin(si * 2) * 0.12, sy, 0]}>
                <sphereGeometry args={[0.16 + si * 0.08, 12, 12]} />
                <meshBasicMaterial color="#F8FAFC" transparent opacity={0.55 - si * 0.15} />
              </mesh>
            ))}
          </group>
        </group>

        <MediterraneanTree3D position={[-1.65, 0.62, 1.55]} type="cypress" scale={1.1} />
        <MediterraneanTree3D position={[1.65, 0.62, 1.55]} type="cypress" scale={1.1} />
      </group>
    );
  }

  // ── 🕍 3. 가버나움 백색회당 (원통 코린트 열주 10개 & 진짜 기와 박공지붕 & 상단 원형 장미창) ──
  if (type === 'synagogue') {
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
          <cylinderGeometry args={[2.25, 2.38, 0.24, 4]} />
          <meshStandardMaterial color="#E2E8F0" />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.45, 1.38, 2.65]} />
          <meshStandardMaterial map={textures.ashlarWall} color="#FFFFFF" roughness={0.25} />
        </mesh>
        <MediterraneanTiledRoof3D
          width={2.68}
          length={2.85}
          height={0.72}
          color="#1D4ED8"
          ridgeColor="#F8FAFC"
          position={[0, 1.61, 0]}
        />
        {/* 전면 6개 대리석 원통 기둥 & 아치 출입문 */}
        {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((cx, ci) => (
          <mesh key={ci} position={[cx, 0.90, 1.38]} castShadow>
            <cylinderGeometry args={[0.065, 0.075, 1.32, 14]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        ))}
        <MediterraneanTree3D position={[-1.38, 0.22, 1.38]} type="cypress" scale={0.95} />
        <MediterraneanTree3D position={[1.38, 0.22, 1.38]} type="cypress" scale={0.95} />
      </group>
    );
  }

  // ── 🌉 4. 실로암 수로교 (ExtrudeGeometry로 진짜 반원형 아치 구멍이 뚫린 로마 석조 수로교!) ──
  if (type === 'aqueduct') {
    const hasWest = grid[r]?.[c - 1]?.type === 'aqueduct';
    const hasEast = grid[r]?.[c + 1]?.type === 'aqueduct';
    const hasNorth = grid[r - 1]?.[c]?.type === 'aqueduct';
    const hasSouth = grid[r + 1]?.[c]?.type === 'aqueduct';
    const rotY = (hasWest || hasEast) && !hasNorth && !hasSouth ? 0 : Math.PI / 2;

    return (
      <group position={[wx, wy, wz]} rotation={[0, rotY, 0]} onClick={handleClick}>
        {/* 진짜 아치 구멍이 뚫린 압출 메쉬 */}
        <mesh geometry={sharedGeos.aqueductArch} position={[0, 0, -0.24]} castShadow receiveShadow>
          <meshStandardMaterial map={textures.ashlarWall} roughness={0.45} />
        </mesh>
        {/* 상단 흐르는 푸른 수로 물길 */}
        <mesh position={[0, 1.48, 0]}>
          <boxGeometry args={[2.02, 0.08, 0.34]} />
          <meshStandardMaterial color="#0EA5E9" roughness={0.1} metalness={0.45} />
        </mesh>
      </group>
    );
  }

  // ── 💧 5. 야곱의 우물 & ⛲ 광장 대리석 분수 (3단 원형 수반 & 물줄기) ──
  if (type === 'well' || type === 'fountain') {
    const isFountain = type === 'fountain';
    const rad = isFountain ? 1.32 : 0.64;
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
          <circleGeometry args={[rad * 1.25, 28]} />
          <meshStandardMaterial color="#F1ECE1" roughness={0.5} />
        </mesh>
        {/* 1단 원형 대리석 수조 (토러스 림 + 수면) */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[rad, rad * 1.06, 0.28, 28]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[rad, 0.07, 12, 28]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[rad * 0.92, 28]} />
          <meshStandardMaterial color="#0284C7" roughness={0.08} metalness={0.5} />
        </mesh>
        {isFountain ? (
          <>
            {/* 2단 조각 수반 & 3단 물줄기 구체 */}
            <mesh position={[0, 0.68, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.36, 0.65, 18]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, 1.02, 0]} castShadow>
              <cylinderGeometry args={[0.58, 0.18, 0.16, 20]} />
              <meshStandardMaterial color="#F8FAFC" />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.78} />
            </mesh>
            {[
              [-1.28, -1.28],
              [1.28, -1.28],
              [-1.28, 1.28],
              [1.28, 1.28]
            ].map(([tx, tz], ti) => (
              <MediterraneanTree3D key={ti} position={[tx, 0.04, tz]} type="cypress" scale={0.9} />
            ))}
          </>
        ) : (
          <>
            {/* 우물 양쪽 원통 기둥 & 기와 지붕 */}
            {[-0.48, 0.48].map((px, pi) => (
              <mesh key={pi} position={[px, 0.62, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 0.65, 10]} />
                <meshStandardMaterial color="#78350F" />
              </mesh>
            ))}
            <MediterraneanTiledRoof3D width={0.85} length={1.15} height={0.28} position={[0, 0.92, 0]} />
            <ClayAmphora3D position={[0.55, 0.04, 0.42]} scale={0.85} />
          </>
        )}
      </group>
    );
  }

  // ── 🌾 6. 밀밭 풍차 · 포도원(나무 퍼골라 덩굴 & 오크통) · 올리브원 · 어선 선착장 · 곡물창고 ──
  if (['wheat_farm', 'vineyard', 'olive_grove', 'fishery', 'granary'].includes(type)) {
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        {/* 네모 박스 바닥 대신 자연스러운 원형/타원형 경작지 마운드! */}
        <mesh position={[0, 0.04, 0]} scale={[1.0, 0.12, 1.0]} receiveShadow>
          <cylinderGeometry args={[1.72, 1.85, 0.6, 24]} />
          <meshStandardMaterial
            color={
              type === 'wheat_farm'
                ? '#D97706'
                : type === 'fishery'
                ? '#0284C7'
                : '#4D7C0F'
            }
            roughness={0.85}
          />
        </mesh>

        {type === 'wheat_farm' && (
          <>
            {/* 둥근 이랑 능선 & 황금 짚단 롤(Hay Bales) */}
            {[-1.05, -0.55, -0.05, 0.45, 0.95].map((fz, fi) => (
              <mesh key={fi} position={[0, 0.12, fz]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.14, 0.16, 2.8, 12, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={fi % 2 === 0 ? '#FACC15' : '#EAB308'} roughness={0.8} />
              </mesh>
            ))}
            {/* 테이퍼드 원통형 풍차 방앗간 & 반구형 돔 지붕 & 회전 돛 */}
            <mesh position={[0, 0.88, -0.35]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.62, 1.55, 20]} />
              <meshStandardMaterial map={textures.ashlarWall} />
            </mesh>
            <mesh position={[0, 1.64, -0.35]} castShadow>
              <sphereGeometry args={[0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#B45309" roughness={0.5} />
            </mesh>
            <group ref={sailRef} position={[0, 1.28, 0.16]}>
              {[0, 1, 2, 3].map((bi) => (
                <group key={bi} rotation={[0, 0, (bi * Math.PI) / 2]}>
                  <mesh position={[0, 0.58, 0]} castShadow>
                    <cylinderGeometry args={[0.02, 0.025, 1.15, 6]} />
                    <meshStandardMaterial color="#451A03" />
                  </mesh>
                  <mesh position={[0.09, 0.64, 0]} castShadow>
                    <planeGeometry args={[0.16, 0.92]} />
                    <meshStandardMaterial color="#FFFBEB" side={THREE.DoubleSide} />
                  </mesh>
                </group>
              ))}
            </group>
          </>
        )}

        {type === 'vineyard' && (
          <>
            {/* 네모 보라색 판자 완전 제거! ➔ 아치형 원목 포도 시렁(Trellis) 3열 & 주렁주렁 열린 보라색 포도송이 클러스터 & 와인 오크통! */}
            {[-0.85, 0.0, 0.85].map((vz, vi) => (
              <group key={vi} position={[0.25, 0.1, vz]}>
                {[-0.9, 0, 0.9].map((px, pi) => (
                  <mesh key={pi} position={[px, 0.28, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.04, 0.56, 8]} />
                    <meshStandardMaterial color="#5C381E" />
                  </mesh>
                ))}
                <mesh position={[0, 0.54, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.025, 0.025, 2.1, 8]} />
                  <meshStandardMaterial color="#78350F" />
                </mesh>
                {/* 풍성한 초록 덩굴 잎 & 보라색 포도송이 구체들 */}
                {[-0.7, -0.35, 0, 0.35, 0.7].map((gx, gi) => (
                  <group key={gi} position={[gx, 0.52, 0]}>
                    <mesh scale={[1.3, 0.7, 1.1]} castShadow>
                      <dodecahedronGeometry args={[0.18, 1]} />
                      <meshStandardMaterial color="#15803D" roughness={0.7} />
                    </mesh>
                    <mesh position={[0, -0.14, 0.05]} castShadow>
                      <sphereGeometry args={[0.09, 10, 10]} />
                      <meshStandardMaterial color="#9333EA" roughness={0.35} />
                    </mesh>
                  </group>
                ))}
              </group>
            ))}
            {/* 좌측 와이너리 석조 오두막 & 오크 와인 숙성통 */}
            <mesh position={[-1.05, 0.45, -0.75]} castShadow>
              <cylinderGeometry args={[0.45, 0.52, 0.75, 16]} />
              <meshStandardMaterial map={textures.ashlarWall} />
            </mesh>
            <mesh position={[-1.05, 0.98, -0.75]} castShadow>
              <coneGeometry args={[0.55, 0.45, 16]} />
              <meshStandardMaterial color="#B91C1C" />
            </mesh>
          </>
        )}

        {type === 'olive_grove' && (
          <>
            {/* 원형 석조 올리브 기름틀(Olive Press Millstone) & 6그루 고목 올리브 과수원 */}
            <group position={[-0.85, 0.12, -0.85]}>
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.48, 0.54, 0.28, 20]} />
                <meshStandardMaterial color="#D6C5AF" />
              </mesh>
              <mesh position={[0, 0.38, 0.18]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.14, 18]} />
                <meshStandardMaterial color="#78716C" />
              </mesh>
            </group>
            {[
              [0.65, -0.85],
              [-0.85, 0.65],
              [0.10, 0.05],
              [0.95, 0.15],
              [0.15, 0.95],
              [0.95, 0.95]
            ].map(([tx, tz], ti) => (
              <MediterraneanTree3D key={ti} position={[tx, 0.08, tz]} type="olive_tree" scale={0.92} />
            ))}
          </>
        )}

        {type === 'granary' && (
          <>
            {/* 물레 성형 곡선형 점토 곡물 사일로(Domed Beehive Silos) 3기 */}
            {[
              [-0.65, -0.35, 1.05],
              [0.65, -0.35, 1.05],
              [0.0, 0.55, 0.88]
            ].map(([sx, sz, sScale], gi) => (
              <group key={gi} position={[sx, 0.08, sz]} scale={[sScale, sScale, sScale]}>
                <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.42, 0.58, 1.24, 20]} />
                  <meshStandardMaterial map={textures.mudWall} roughness={0.65} />
                </mesh>
                <mesh position={[0, 1.22, 0]} castShadow>
                  <sphereGeometry args={[0.43, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#B45309" roughness={0.5} />
                </mesh>
              </group>
            ))}
          </>
        )}

        {type === 'fishery' && (
          <>
            {/* 원통 말뚝 목조 부두 & 곡선 선체 어선 */}
            {[-0.8, -0.3, 0.2, 0.7].map((px, pi) => (
              <mesh key={pi} position={[px, 0.24, -0.45]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 0.55, 8]} />
                <meshStandardMaterial color="#451A03" />
              </mesh>
            ))}
            <mesh position={[-0.05, 0.48, -0.45]} castShadow>
              <boxGeometry args={[1.8, 0.08, 0.55]} />
              <meshStandardMaterial color="#78350F" />
            </mesh>
            {/* 곡선 어선 */}
            <group position={[0.45, 0.18, 0.45]} rotation={[0, 0.4, 0]}>
              <mesh scale={[0.42, 0.28, 1.05]} castShadow>
                <sphereGeometry args={[0.8, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial color="#78350F" side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.55, 0]} scale={[0.7, 0.7, 0.2]} castShadow>
                <sphereGeometry args={[0.55, 14, 10, 0, Math.PI]} />
                <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} />
              </mesh>
            </group>
          </>
        )}
      </group>
    );
  }

  // ── 🍞 7. 상업 장터 (네모 지붕 완전 제거! ➔ 아치형 베두인/로마 마켓 텐트 캐노피 & 원통 광주리 & 암포라 항아리) ──
  if (['bread_market', 'fish_market', 'sacrifice_market', 'money_changer', 'caravan'].includes(type)) {
    const awningColor =
      type === 'fish_market' ? '#0284C7' :
      type === 'bread_market' ? '#EA580C' :
      type === 'sacrifice_market' ? '#9333EA' :
      type === 'money_changer' ? '#EAB308' : '#B45309';

    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        {/* 원형 모자이크 장터 광장 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
          <circleGeometry args={[bw * 0.54, 28]} />
          <meshStandardMaterial color="#F5EFE6" roughness={0.5} />
        </mesh>

        {/* 뒤쪽 아치형 석조 아케이드 & 반구형 황금/화이트 돔 */}
        <mesh position={[0, 0.52, -bh * 0.22]} castShadow receiveShadow>
          <cylinderGeometry args={[bw * 0.36, bw * 0.40, 0.88, 18]} />
          <meshStandardMaterial map={textures.ashlarWall} />
        </mesh>
        <mesh position={[0, 0.94, -bh * 0.22]} castShadow>
          <sphereGeometry args={[bw * 0.36, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={awningColor} roughness={0.45} />
        </mesh>

        {/* 앞쪽 곡선형 볼트 텐트 캐노피(Vaulted Market Awning) 2동 & 원통 나무 기둥 */}
        {[-0.55, 0.55].map((tx, ti) => (
          <group key={ti} position={[tx, 0.68, bh * 0.18]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.55, 1.0]} castShadow>
              <cylinderGeometry args={[0.46, 0.46, 0.95, 16, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={ti === 0 ? awningColor : '#FFFBEB'} side={THREE.DoubleSide} roughness={0.5} />
            </mesh>
            {[-0.38, 0.38].map((px, pi) => (
              <mesh key={pi} position={[px, -0.34, 0.38]} castShadow>
                <cylinderGeometry args={[0.025, 0.03, 0.68, 8]} />
                <meshStandardMaterial color="#451A03" />
              </mesh>
            ))}
          </group>
        ))}

        {/* 장터 매대 위 둥근 곡물/생선 자루 & 암포라 항아리들 */}
        {[-0.65, -0.22, 0.22, 0.65].map((bx, bi) => (
          <group key={bi} position={[bx, 0.18, bh * 0.22]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.16, 0.13, 0.24, 14]} />
              <meshStandardMaterial color="#A16207" />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.14, 12, 10]} />
              <meshStandardMaterial color={bi % 2 === 0 ? '#FDE047' : awningColor} />
            </mesh>
          </group>
        ))}
        <ClayAmphora3D position={[-0.95, 0.03, 0.45]} scale={0.9} />
        <ClayAmphora3D position={[0.95, 0.03, 0.45]} scale={0.85} color="#9A3412" />
      </group>
    );
  }

  // ── ✝️ 8. 골고다 언덕 · 팔복 동산 · 겟세마네 (다면체 자연 바위 암반 언덕!) ──
  if (['golgotha', 'beatitudes', 'gethsemane'].includes(type)) {
    const isGolgotha = type === 'golgotha';
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        {/* 네모 박스 대신 겹쳐진 다면체 자연 바위 언덕(Organic Rock Mound) */}
        <mesh position={[0, 0.28, 0]} scale={[1.45, 0.55, 1.35]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.15, 1]} />
          <meshStandardMaterial color={isGolgotha ? '#78716C' : '#65A30D'} roughness={0.9} />
        </mesh>
        <mesh position={[-0.25, 0.56, -0.15]} scale={[1.15, 0.65, 1.05]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.82, 1]} />
          <meshStandardMaterial color={isGolgotha ? '#57534E' : '#4D7C0F'} roughness={0.88} />
        </mesh>
        {isGolgotha ? (
          [-0.58, 0, 0.58].map((cx, ci) => (
            <group key={ci} position={[cx, 0.78, 0]}>
              <mesh position={[0, ci === 1 ? 0.58 : 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.055, ci === 1 ? 1.15 : 0.85, 8]} />
                <meshStandardMaterial color="#451A03" />
              </mesh>
              <mesh position={[0, ci === 1 ? 0.82 : 0.58, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.52, 8]} />
                <meshStandardMaterial color="#451A03" />
              </mesh>
            </group>
          ))
        ) : (
          <>
            <MediterraneanTree3D position={[-0.65, 0.68, -0.35]} type="olive_tree" scale={1.1} />
            <MediterraneanTree3D position={[0.55, 0.58, 0.35]} type="olive_tree" scale={1.05} />
            <MediterraneanTree3D position={[0.15, 0.72, -0.45]} type="cypress" scale={0.95} />
          </>
        )}
      </group>
    );
  }

  // ── 🧱 9. 원통형 망대(Tower) · 아치 성문(Gate) · 성벽(Wall) ──
  if (type === 'tower') {
    return (
      <group position={[wx, wy, wz]} onClick={handleClick}>
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.76, 1.9, 18]} />
          <meshStandardMaterial map={textures.ashlarWall} roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.15, 0]} castShadow>
          <coneGeometry args={[0.74, 0.65, 18]} />
          <meshStandardMaterial color="#B91C1C" roughness={0.45} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[wx, wy, wz]} onClick={handleClick}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[bw * 0.48, bw * 0.52, 1.1, 12]} />
        <meshStandardMaterial map={textures.ashlarWall} roughness={0.5} />
      </mesh>
    </group>
  );
}

// =====================================================================
// 🚶‍♂️ 유선형 3D 시민·제자·예수님·낙타 상단 보행자(Walker)
// =====================================================================
function AnnoWalker3D({ walker, idx, grid, onWalkerClick }) {
  const groupRef = useRef();
  const interpRef = useRef({ r: walker.r, c: walker.c });

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const prev = interpRef.current;
    prev.r += (walker.r - prev.r) * Math.min(1, delta * 5.0);
    prev.c += (walker.c - prev.c) * Math.min(1, delta * 5.0);

    const gr = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(prev.r)));
    const gc = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(prev.c)));
    const elev = getTileElevation3D(gr, gc, grid[gr]?.[gc]);
    const [wx, wy, wz] = gridToWorld3D(prev.r, prev.c, 1, 1, elev);

    const bounce = Math.abs(Math.sin(clock.elapsedTime * 7.5 + idx)) * 0.06;
    groupRef.current.position.set(wx, wy + 0.12 + bounce, wz);
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (onWalkerClick) {
          const pool = WALKER_THOUGHTS[walker.type] || WALKER_THOUGHTS.merchant;
          const randomThought = pool.thoughts[idx % pool.thoughts.length];
          onWalkerClick({ type: walker.type, name: pool.name, thought: randomThought });
        }
      }}
    >
      {walker.type === 'jesus' ? (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.22, 8, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.54, 0]} castShadow>
            <sphereGeometry args={[0.12, 14, 14]} />
            <meshStandardMaterial color="#FDE68A" />
          </mesh>
          <mesh position={[0, 0.62, -0.02]}>
            <ringGeometry args={[0.14, 0.19, 20]} />
            <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : walker.type === 'disciple' ? (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow>
            <capsuleGeometry args={[0.10, 0.20, 8, 12]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#0284C7' : '#15803D'} />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#FDE68A" />
          </mesh>
          <ClayAmphora3D position={[0, 0.58, 0]} scale={0.42} />
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.24, 8, 12]} />
            <meshStandardMaterial color="#B45309" />
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#FACC15" />
          </mesh>
          <mesh position={[0, 0.44, 0.24]} castShadow>
            <sphereGeometry args={[0.10, 12, 12]} />
            <meshStandardMaterial color="#92400E" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function HarvestBubble3D({ bubble, grid, onHarvestBubbleClick }) {
  const bRef = useRef();
  const elev = getTileElevation3D(bubble.r, bubble.c, grid[bubble.r]?.[bubble.c]);
  const [wx, wy, wz] = gridToWorld3D(bubble.r, bubble.c, 1, 1, elev);
  const badgeTex = useMemo(() => makeBubbleBadgeTexture(bubble.icon || '🍞'), [bubble.icon]);

  useFrame(({ clock }) => {
    if (bRef.current) {
      bRef.current.position.y = wy + 2.45 + Math.sin(clock.elapsedTime * 3.5 + bubble.r) * 0.14;
    }
  });

  return (
    <Billboard
      ref={bRef}
      position={[wx, wy + 2.45, wz]}
      onClick={(e) => {
        e.stopPropagation();
        if (onHarvestBubbleClick) onHarvestBubbleClick(bubble);
      }}
    >
      <mesh>
        <planeGeometry args={[1.15, 1.15]} />
        <meshBasicMaterial map={badgeTex} transparent depthTest={false} />
      </mesh>
    </Billboard>
  );
}

// =====================================================================
// 🌍 《Anno 117: Pax Romana》 유기적 해안선 섬 지형 & 도시 마스터 씬
// =====================================================================
function AnnoJerusalemScene({
  overlayMode,
  timeOfDay,
  harvestBubbles,
  onHarvestBubbleClick,
  onWalkerClick
}) {
  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const [hoverCoord, setHoverCoord] = useState(null);

  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    window.tycoonViewport = {
      scale: {
        x: 1.0,
        set: (nextScale) => {
          const factor = 1 / Math.max(0.45, Math.min(2.2, nextScale));
          camera.position.set(22 * factor, 23 * factor, 22 * factor);
          camera.updateProjectionMatrix();
        }
      },
      moveCenter: (worldX, worldY) => {
        if (!controlsRef.current) return;
        const tx = THREE.MathUtils.clamp(worldX / 35, -12, 12);
        const tz = THREE.MathUtils.clamp((worldY - 100) / 25, -12, 12);
        controlsRef.current.target.set(tx, 0, tz);
        controlsRef.current.update();
      }
    };
    return () => {
      delete window.tycoonViewport;
    };
  }, [camera]);

  const textures = useMemo(() => ({
    ashlarWall: makeAshlarWallTexture('#F5EBE0', '#D0BFA6'),
    mudWall: makeAshlarWallTexture('#D9A773', '#A47551')
  }), []);

  // 진짜 아치 구멍이 뚫린 수로교 ExtrudeGeometry 캐시
  const sharedGeos = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.0, 0);
    shape.lineTo(-1.0, 1.48);
    shape.lineTo(1.0, 1.48);
    shape.lineTo(1.0, 0);
    shape.lineTo(0.58, 0);
    shape.lineTo(0.58, 0.62);
    shape.absarc(0, 0.62, 0.58, 0, Math.PI, false);
    shape.lineTo(-0.58, 0);
    shape.closePath();

    const aqueductArch = new THREE.ExtrudeGeometry(shape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03
    });
    return { aqueductArch };
  }, []);

  const isNight = timeOfDay === 'night' || timeOfDay === 'sunset';

  const handleTileInteraction = (r, c) => {
    const clicked = grid[r]?.[c];
    if (selectedTool === 'inspect') {
      if (clicked) {
        const rootR = clicked.isRoot ? r : clicked.rootR;
        const rootC = clicked.isRoot ? c : clicked.rootC;
        const rootCell = grid[rootR]?.[rootC];
        if (rootCell) setInspectedTile({ ...rootCell, r: rootR, c: rootC });
      }
      return;
    }

    if (selectedTool === 'demolish') {
      demolishAt(r, c);
      return;
    }

    const bMeta = BUILDINGS[selectedTool];
    if (bMeta) {
      const built = buildAt(r, c, bMeta);
      if (!built && clicked) {
        const rootR = clicked.isRoot ? r : clicked.rootR;
        const rootC = clicked.isRoot ? c : clicked.rootC;
        const rootCell = grid[rootR]?.[rootC];
        if (rootCell) setInspectedTile({ ...rootCell, r: rootR, c: rootC });
      }
    }
  };

  const rootBuildings = useMemo(() => {
    const list = [];
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.isRoot && cell.type !== 'road' && cell.type !== 'plaza') {
          list.push({ ...cell, r, c });
        }
      }
    }
    return list;
  }, [grid]);

  return (
    <group>
      {/* 1. 지중해/갈릴리 에메랄드빛 대해(Ocean) & 유기적인 둥근 해안선 백사장(Organic Island Coastline) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0369A1" roughness={0.14} metalness={0.38} />
      </mesh>
      {/* 네모 판자 대신 부드럽게 경사진 팔각/원형 해안 모래톱과 암반 기단 */}
      <mesh position={[-1.2, -0.32, -1.2]} receiveShadow>
        <cylinderGeometry args={[23.5, 25.8, 0.36, 36]} />
        <meshStandardMaterial color="#E6D2B2" roughness={0.85} />
      </mesh>
      <mesh position={[-1.2, -0.16, -1.2]} receiveShadow>
        <cylinderGeometry args={[21.2, 23.2, 0.24, 36]} />
        <meshStandardMaterial color="#DFC9A6" roughness={0.82} />
      </mesh>

      {/* 바다를 항해하는 로마/갈릴리 범선 2척 */}
      <SailingRomanGalley startZ={-12} xPos={HALF_MAP + 4.2} speed={1.3} dir={1} />
      <SailingRomanGalley startZ={10} xPos={HALF_MAP + 7.2} speed={0.95} dir={-1} />

      {/* 2. 16x16 유기적 지형 마운드 & 둥근 조약돌 도로 & 자연 식생 */}
      {Array.from({ length: MAP_SIZE }).map((_, r) =>
        Array.from({ length: MAP_SIZE }).map((__, c) => {
          const cell = grid[r]?.[c];
          const terrain = getNaturalTerrainType(r, c);
          const elev = getTileElevation3D(r, c, cell);
          const [wx, wy, wz] = gridToWorld3D(r, c, 1, 1, 0);
          const isHovered = hoverCoord && hoverCoord.r === r && hoverCoord.c === c;

          if (!cell && terrain === 'water') {
            return (
              <mesh
                key={`tile_${r}_${c}`}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[wx, -0.30, wz]}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  if (!hoverCoord || hoverCoord.r !== r || hoverCoord.c !== c) setHoverCoord({ r, c });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTileInteraction(r, c);
                }}
              >
                <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
                <meshBasicMaterial color={isHovered ? '#38BDF8' : '#0284C7'} transparent opacity={isHovered ? 0.45 : 0.0} />
              </mesh>
            );
          }

          let topColor = (r + c) % 2 === 0 ? '#E5D3B3' : '#DEC9A4';
          if (terrain === 'zion_plateau') topColor = '#F3EAE0';
          if (!cell && terrain === 'meadow') topColor = (r + c) % 2 === 0 ? '#65A30D' : '#4D7C0F';
          if (isHovered) topColor = '#FDE047';

          const hasNorthRoad = ['road', 'plaza', 'gate'].includes(grid[r - 1]?.[c]?.type);
          const hasSouthRoad = ['road', 'plaza', 'gate'].includes(grid[r + 1]?.[c]?.type);
          const hasWestRoad = ['road', 'plaza', 'gate'].includes(grid[r]?.[c - 1]?.type);
          const hasEastRoad = ['road', 'plaza', 'gate'].includes(grid[r]?.[c + 1]?.type);

          return (
            <group key={`tile_${r}_${c}`} position={[wx, elev, wz]}>
              {/* 시온산 고지대는 부드러운 원추형 언덕 마운드로 융기 (네모 절벽 배제!) */}
              {elev > 0 && (
                <mesh position={[0, -elev / 2, 0]} receiveShadow castShadow>
                  <cylinderGeometry args={[TILE_SIZE * 0.78, TILE_SIZE * 0.96, elev, 16]} />
                  <meshStandardMaterial color="#D6C1A0" roughness={0.85} />
                </mesh>
              )}

              {/* 타일 바닥면 (각진 테두리 없이 매끄럽게 블렌딩) */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.01, 0]}
                receiveShadow
                onPointerMove={(e) => {
                  e.stopPropagation();
                  if (!hoverCoord || hoverCoord.r !== r || hoverCoord.c !== c) {
                    setHoverCoord({ r, c });
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTileInteraction(r, c);
                }}
              >
                <circleGeometry args={[TILE_SIZE * 0.74, 16]} />
                <meshStandardMaterial color={topColor} roughness={0.82} />
              </mesh>

              {/* 🛤️ 유기적 조약돌 로마 도로(Cobblestone Path) & 원형 광장 메달리온 */}
              {(cell?.type === 'road' || cell?.type === 'plaza') && (
                <group position={[0, 0.025, 0]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <circleGeometry args={[cell.type === 'plaza' ? 0.88 : 0.56, 20]} />
                    <meshStandardMaterial color={cell.type === 'plaza' ? '#F8FAFC' : '#B8A68E'} roughness={0.65} />
                  </mesh>
                  {cell.type === 'plaza' && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                      <ringGeometry args={[0.52, 0.64, 24]} />
                      <meshBasicMaterial color="#D97706" side={THREE.DoubleSide} />
                    </mesh>
                  )}
                  {hasNorthRoad && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]}>
                      <planeGeometry args={[0.92, 1.0]} />
                      <meshStandardMaterial color="#B8A68E" roughness={0.65} />
                    </mesh>
                  )}
                  {hasSouthRoad && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}>
                      <planeGeometry args={[0.92, 1.0]} />
                      <meshStandardMaterial color="#B8A68E" roughness={0.65} />
                    </mesh>
                  )}
                  {hasWestRoad && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0, 0]}>
                      <planeGeometry args={[1.0, 0.92]} />
                      <meshStandardMaterial color="#B8A68E" roughness={0.65} />
                    </mesh>
                  )}
                  {hasEastRoad && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0, 0]}>
                      <planeGeometry args={[1.0, 0.92]} />
                      <meshStandardMaterial color="#B8A68E" roughness={0.65} />
                    </mesh>
                  )}
                </group>
              )}

              {/* 자연 나무 & 바위 생태계 */}
              {!cell && ['palm_tree', 'olive_tree', 'cypress_tree', 'desert_rock'].includes(terrain) && (
                <MediterraneanTree3D
                  position={[0, 0.02, 0]}
                  type={terrain}
                  scale={0.95}
                />
              )}
            </group>
          );
        })
      )}

      {/* 3. 건설 프리뷰 원형/타원형 홀로그램 링 */}
      {hoverCoord && selectedTool !== 'inspect' && selectedTool !== 'demolish' && BUILDINGS[selectedTool] && (() => {
        const bMeta = BUILDINGS[selectedTool];
        const w = bMeta.w || 1;
        const h = bMeta.h || 1;
        const { r, c } = hoverCoord;
        const elev = getTileElevation3D(r, c, grid[r]?.[c]);
        const [px, py, pz] = gridToWorld3D(r, c, w, h, elev);

        let canBuild = true;
        for (let dr = 0; dr < h; dr++) {
          for (let dc = 0; dc < w; dc++) {
            if (r + dr >= MAP_SIZE || c + dc >= MAP_SIZE || grid[r + dr]?.[c + dc]) {
              canBuild = false;
            }
          }
        }

        const rad = Math.max(w, h) * TILE_SIZE * 0.48;
        return (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[px, py + 0.08, pz]}>
            <circleGeometry args={[rad, 32]} />
            <meshBasicMaterial color={canBuild ? '#34D399' : '#F87171'} transparent opacity={0.55} />
          </mesh>
        );
      })()}

      {/* 4. 오버레이 반경 링 표시 */}
      {overlayMode !== 'normal' &&
        rootBuildings.map((b) => {
          let rad = 0;
          let col = '#38BDF8';
          if (overlayMode === 'water' && ['well', 'aqueduct', 'fountain'].includes(b.type)) {
            rad = b.type === 'fountain' ? 9.5 : 7.0;
            col = '#0284C7';
          } else if (overlayMode === 'food' && ['bread_market', 'fish_market', 'wheat_farm', 'fishery', 'granary'].includes(b.type)) {
            rad = 9.0;
            col = '#22C55E';
          } else if (overlayMode === 'faith' && ['synagogue', 'temple', 'golgotha', 'beatitudes'].includes(b.type)) {
            rad = b.type === 'temple' ? 14.0 : 9.5;
            col = '#F59E0B';
          }
          if (rad <= 0) return null;
          const elev = getTileElevation3D(b.r, b.c, b);
          const [bx, by, bz] = gridToWorld3D(b.r, b.c, b.w, b.h, elev);
          return (
            <mesh key={`ov_${b.r}_${b.c}`} rotation={[-Math.PI / 2, 0, 0]} position={[bx, by + 0.12, bz]}>
              <ringGeometry args={[rad * 0.92, rad, 48]} />
              <meshBasicMaterial color={col} transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

      {/* 5. 유기적 3D 건축물 렌더링 */}
      {rootBuildings.map((cell) => (
        <AnnoBuilding3D
          key={`bldg_${cell.r}_${cell.c}`}
          cell={cell}
          grid={grid}
          textures={textures}
          sharedGeos={sharedGeos}
          isNight={isNight}
          onSelectBuilding={(r, c) => handleTileInteraction(r, c)}
        />
      ))}

      {/* 6. 3D 보행자(Walkers) 렌더링 */}
      {(walkers || []).map((wk, idx) => (
        <AnnoWalker3D
          key={wk.id || idx}
          walker={wk}
          idx={idx}
          grid={grid}
          onWalkerClick={onWalkerClick}
        />
      ))}

      {/* 7. 3D 터치 수확 버블 렌더링 */}
      {(harvestBubbles || []).map((bubble) => (
        <HarvestBubble3D
          key={bubble.id}
          bubble={bubble}
          grid={grid}
          onHarvestBubbleClick={onHarvestBubbleClick}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        screenSpacePanning={true}
        enableDamping={true}
        dampingFactor={0.07}
        minDistance={7}
        maxDistance={52}
        maxPolarAngle={Math.PI / 2.15}
      />
    </group>
  );
}

export default function GameEngine({
  overlayMode = 'normal',
  timeOfDay = 'day',
  floatingEvents = [],
  harvestBubbles = [],
  onHarvestBubbleClick,
  onWalkerClick
}) {
  const bgStyle =
    timeOfDay === 'night'
      ? '#090D16'
      : timeOfDay === 'sunset'
      ? '#2B1206'
      : '#0C4A6E';

  return (
    <div
      style={{ backgroundColor: bgStyle }}
      className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <Canvas
        shadows
        camera={{ position: [20, 21, 20], fov: 35, near: 0.1, far: 250 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: timeOfDay === 'night' ? 0.85 : 1.22 }}
      >
        <ambientLight
          intensity={timeOfDay === 'night' ? 0.55 : timeOfDay === 'sunset' ? 0.95 : 1.35}
          color={timeOfDay === 'night' ? '#93C5FD' : timeOfDay === 'sunset' ? '#FDBA74' : '#FFFBEB'}
        />
        <hemisphereLight
          args={[
            timeOfDay === 'night' ? '#1E3A8A' : '#FFF7ED',
            '#78350F',
            timeOfDay === 'night' ? 0.45 : 1.1
          ]}
        />
        <directionalLight
          position={timeOfDay === 'sunset' ? [-28, 16, 22] : [-20, 32, 24]}
          intensity={timeOfDay === 'night' ? 0.6 : 1.85}
          color={timeOfDay === 'sunset' ? '#FB923C' : '#FFFBEB'}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-26}
          shadow-camera-right={26}
          shadow-camera-top={26}
          shadow-camera-bottom={-26}
          shadow-bias={-0.0005}
        />

        <AnnoJerusalemScene
          overlayMode={overlayMode}
          timeOfDay={timeOfDay}
          harvestBubbles={harvestBubbles}
          onHarvestBubbleClick={onHarvestBubbleClick}
          onWalkerClick={onWalkerClick}
        />
      </Canvas>
    </div>
  );
}
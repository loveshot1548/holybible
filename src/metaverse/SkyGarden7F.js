// src/metaverse/SkyGarden7F.js (PART 1 — PS4 LEGO Worlds & Skylines Edition · Instanced Studs · Multi-Part Bricks)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, RoundedBox, Billboard, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { SharedChibiAvatar } from '../pages/VirtualChurchLobby';
import {
  BLOCK_CATALOG,
  PROP_CATALOG,
  NPC_CATALOG,
  CROP_CATALOG,
  ANIMAL_CATALOG,
  FISH_CATALOG,
  VILLAGE_QUESTS,
  MATERIAL_META,
  BLOCK_MAP_META,
  CROP_MAP_META,
  ANIMAL_MAP_META,
  blockKey,
  createBlockTextures,
  buildCulledGeometries,
  generateBiomeWorld,
  expandWorldTerrain,
  getSurfaceBelow,
  getSurfaceInfo,
  canPlayerMoveTo,
  isCellOccupied,
  getFenceConnections,
  detectRoomAt
} from './voxel/VoxelEngine';

const STORAGE_KEY_WORLD = 'gtc_openworld_7f_lego_v9';
const STORAGE_KEY_META = 'gtc_openworld_7f_meta_v9';

// 다양한 레고 브릭 형태(파츠) 카탈로그 — 블록 색상과 자유 조합 가능!
const LEGO_PART_SHAPES = [
  { id: 'brick_1x1', label: '1×1 기본', icon: '🧱', desc: '표준 1×1 레고 브릭' },
  { id: 'brick_1x2', label: '1×2 브릭', icon: '▬', desc: '2칸 연결 레고 브릭' },
  { id: 'brick_2x2', label: '2×2 대형', icon: '⬛', desc: '4칸 대형 기초 브릭' },
  { id: 'brick_1x4', label: '1×4 장벽', icon: '➖', desc: '4칸 긴 벽체 브릭' },
  { id: 'slope_roof', label: '경사 지붕', icon: '📐', desc: '레고 45° 슬로프 지붕 브릭' },
  { id: 'arch_gate', label: '아치 문틀', icon: '🏛️', desc: '성전/다리용 레고 아치 브릭' },
  { id: 'window_glass', label: '유리 창문', icon: '🪟', desc: '투명 창틀 레고 브릭' },
  { id: 'neon_lamp', label: '발광 브릭', icon: '💡', desc: '야경에 빛나는 레고 램프 브릭' }
];

const DEFAULT_AVATAR = {
  gender: 'male',
  hairStyle: 'parted',
  isSkirt: false,
  shirtColor: '#3B82F6',
  pantsColor: '#1E293B',
  hairColor: '#27272A'
};

const DEFAULT_META = {
  hearts: 60,
  quests: {},
  openedChests: {},
  materials: { wood: 16, stone: 16, dirt: 12, coal: 6, iron: 6, gold: 6, crystal: 4, glass: 10, cloth: 6, straw: 4, crop: 2 },
  props: { hay_bale: 2, fruit_basket: 2, well: 1, campfire: 1, fence_wood: 6 }
};

const NPC_META_MAP = NPC_CATALOG.reduce((acc, n) => { acc[n.id] = n; return acc; }, {});
const FISH_META_MAP = FISH_CATALOG.reduce((acc, f) => { acc[f.id] = f; return acc; }, {});

// =====================================================================
// 🔊 레고 딸깍(Snap) & 통합 사운드 엔진
// =====================================================================
let sharedAudioCtx = null;
function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
  return sharedAudioCtx;
}

const playSfx = (type = 'place', muted = false) => {
  if (muted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'fanfare' || type === 'harvest') {
      const notes = type === 'fanfare' ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.055, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.26);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.27);
      });
      return;
    }

    if (type === 'step' || type === 'splash' || type === 'water') {
      const dur = type === 'water' ? 0.22 : type === 'splash' ? 0.14 : 0.05;
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'step' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(type === 'water' ? 1200 : type === 'splash' ? 950 : 380, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(type === 'water' ? 0.06 : 0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start(now);
      return;
    }

    const osc = ctx.createOscillator(), gain = ctx.createGain();
    if (type === 'place') {
      // 레고 브릭 특유의 경쾌한 "딸깍(Snap)" 사운드
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    } else if (type === 'jump') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(240, now); osc.frequency.exponentialRampToValueAtTime(510, now + 0.11);
      gain.gain.setValueAtTime(0.045, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (type === 'hit') {
      osc.type = 'square'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);
      gain.gain.setValueAtTime(0.045, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (type === 'door') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
      gain.gain.setValueAtTime(0.055, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    } else {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(260, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.07);
      gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.13);
  } catch (_) {}
};

const playAnimalSfx = (animalType, muted = false) => {
  if (muted) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(animalType === 'chick' ? 1400 : animalType === 'cat' ? 680 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(animalType === 'chick' ? 1800 : 210, now + 0.16);
    gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.2);
  } catch (_) {}
};

function makeNameTagTex(label, color = '#38BDF8') {
  const canvas = document.createElement('canvas');
  canvas.width = 420; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath(); ctx.roundRect(6, 6, 408, 84, 42); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 30px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 210, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// =====================================================================
// 🧱 1. 전 지형·건물 자동 2×2 레고 스터드(Stud) InstancedMesh (단일 드로우콜 60FPS!)
// =====================================================================
function LegoWorldStuds({ blockMap }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const studData = useMemo(() => {
    const items = [];
    const offsets = [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]];
    Object.entries(blockMap || {}).forEach(([k, type]) => {
      if (type === 'water' || type === 'glass') return;
      const [x, y, z] = k.split(',').map(Number);
      // 위쪽이 비어 있거나 투명 블록일 때만 스터드 노출 (Occlusion Culling)
      const above = blockMap[blockKey(x, y + 1, z)];
      if (above && above !== 'water' && above !== 'glass') return;
      const hex = BLOCK_MAP_META[type]?.color || '#94A3B8';
      for (let i = 0; i < 4; i++) {
        items.push({ x: x + offsets[i][0], y: y + 0.54, z: z + offsets[i][1], color: hex });
      }
    });
    return items;
  }, [blockMap]);

  useEffect(() => {
    const inst = meshRef.current;
    if (!inst || studData.length === 0) return;
    for (let i = 0; i < studData.length; i++) {
      const s = studData[i];
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      tmpColor.set(s.color);
      inst.setColorAt(i, tmpColor);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [studData, dummy, tmpColor]);

  if (studData.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, studData.length]} receiveShadow>
      <cylinderGeometry args={[0.135, 0.135, 0.08, 8]} />
      <meshStandardMaterial roughness={0.20} metalness={0.04} />
    </instancedMesh>
  );
}

// =====================================================================
// 💥 2. 브릭 조립/채굴 시 통통 튀는 레고 파편 파티클 이펙트
// =====================================================================
function BrickBurstParticles({ bursts }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      if (!child.userData.vel) return;
      child.position.x += child.userData.vel[0] * delta;
      child.position.y += child.userData.vel[1] * delta;
      child.position.z += child.userData.vel[2] * delta;
      child.userData.vel[1] -= 14 * delta;
      child.rotation.x += delta * 6;
      child.rotation.z += delta * 5;
      child.scale.multiplyScalar(0.95);
    });
  });

  return (
    <group ref={groupRef}>
      {bursts.flatMap((b) =>
        b.pieces.map((p, i) => (
          <mesh key={`${b.id}_${i}`} position={[b.x, b.y, b.z]} userData={{ vel: [...p.vel] }}>
            <boxGeometry args={[0.16, 0.12, 0.16]} />
            <meshStandardMaterial color={b.color} roughness={0.18} />
          </mesh>
        ))
      )}
    </group>
  );
}

// =====================================================================
// 🧱 3. 커스텀 레고 특수 브릭 파츠 렌더러 (경사 지붕 · 아치 · 유리창 · 1×2 · 2×2 · 1×4 · 발광 브릭)
// =====================================================================
function CustomLegoPart3D({ part, mode, isNight, onRemove }) {
  const color = BLOCK_MAP_META[part.blockType]?.color || '#E11D48';

  return (
    <group
      position={[part.x, part.y, part.z]}
      rotation={[0, part.rot || 0, 0]}
      onClick={(e) => {
        if (mode !== 'break') return;
        e.stopPropagation();
        onRemove(part.id);
      }}
    >
      {part.shape === 'slope_roof' && (
        <group>
          <RoundedBox args={[0.98, 0.34, 0.98]} position={[0, -0.33, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.98, 0.34, 0.66]} position={[0, 0, -0.16]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.98, 0.34, 0.34]} position={[0, 0.33, -0.32]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          {[-0.24, 0.24].map((sx, i) => (<mesh key={i} position={[sx, 0.54, -0.32]}><cylinderGeometry args={[0.13, 0.13, 0.08, 8]} /><meshStandardMaterial color={color} roughness={0.18} /></mesh>))}
        </group>
      )}

      {part.shape === 'arch_gate' && (
        <group>
          <RoundedBox args={[0.32, 1.0, 0.96]} position={[-0.84, 0, 0]} radius={0.02} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.32, 1.0, 0.96]} position={[0.84, 0, 0]} radius={0.02} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[2.0, 0.32, 0.96]} position={[0, 0.34, 0]} radius={0.02} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          {[-0.75, -0.25, 0.25, 0.75].map((sx, i) => (<mesh key={i} position={[sx, 0.54, 0]}><cylinderGeometry args={[0.13, 0.13, 0.08, 8]} /><meshStandardMaterial color={color} roughness={0.18} /></mesh>))}
        </group>
      )}

      {part.shape === 'window_glass' && (
        <group>
          <RoundedBox args={[0.98, 0.14, 0.28]} position={[0, -0.43, 0]} radius={0.015} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.98, 0.14, 0.28]} position={[0, 0.43, 0]} radius={0.015} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.14, 0.98, 0.28]} position={[-0.42, 0, 0]} radius={0.015} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.14, 0.98, 0.28]} position={[0.42, 0, 0]} radius={0.015} castShadow><meshStandardMaterial color={color} roughness={0.18} /></RoundedBox>
          <mesh><boxGeometry args={[0.74, 0.74, 0.08]} /><meshStandardMaterial color="#BAE6FD" transparent opacity={0.48} roughness={0.08} /></mesh>
        </group>
      )}

      {part.shape === 'neon_lamp' && (
        <group>
          <RoundedBox args={[0.94, 0.94, 0.94]} radius={0.04} castShadow>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 2.2 : 0.85} roughness={0.15} />
          </RoundedBox>
          <pointLight position={[0, 0.8, 0]} intensity={isNight ? 4.2 : 1.0} distance={isNight ? 11 : 4} color={color} />
        </group>
      )}
    </group>
  );
}

// =====================================================================
// 4. 360° 아날로그 조이스틱 & 카메라 브릿지
// =====================================================================
function AnalogJoystick({ joyVecRef }) {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeIdRef = useRef(null);

  const updateFromClient = (clientX, clientY) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, maxR = rect.width * 0.36;
    let dx = clientX - cx, dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    setKnob({ x: dx, y: dy });
    joyVecRef.current = { x: dx / maxR, z: dy / maxR };
  };

  const reset = () => { activeIdRef.current = null; setKnob({ x: 0, y: 0 }); joyVecRef.current = { x: 0, z: 0 }; };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => { e.stopPropagation(); activeIdRef.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); updateFromClient(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (activeIdRef.current !== e.pointerId) return; e.stopPropagation(); updateFromClient(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (activeIdRef.current === e.pointerId) { e.stopPropagation(); reset(); } }}
      onPointerCancel={reset}
      className="absolute bottom-20 left-4 z-20 w-24 h-24 rounded-full bg-slate-900/55 border-2 border-white/25 backdrop-blur-sm flex items-center justify-center touch-none select-none shadow-xl"
    >
      <div style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} className="w-10 h-10 rounded-full bg-amber-400/90 border-2 border-white shadow-lg pointer-events-none" />
    </div>
  );
}

function CameraActionBridge({ controlsRef, playerPosRef, playerRotRef, camCommandRef }) {
  const { camera } = useThree();
  useFrame(() => {
    const cmd = camCommandRef.current;
    if (!cmd || !controlsRef.current) return;
    camCommandRef.current = null;
    const [px, py, pz] = playerPosRef.current;
    const ctrl = controlsRef.current;
    if (cmd.type === 'behind') {
      const rot = playerRotRef.current;
      camera.position.set(px - Math.sin(rot) * 6.5, py + 4.8, pz - Math.cos(rot) * 6.5);
      ctrl.target.set(px, py + 1.0, pz);
      ctrl.update();
    } else if (cmd.type === 'wide') {
      camera.position.set(px, py + 15.5, pz + 18.5);
      ctrl.target.set(px, py + 1.0, pz);
      ctrl.update();
    } else if (cmd.type === 'zoom') {
      const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * cmd.factor, 2.5, 52));
      camera.position.copy(ctrl.target).add(offset);
      ctrl.update();
    }
  });
  return null;
}
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

// =====================================================================
// 5. 유광 ABS 레고 작물 · 레고 동물 · 레고 물고기 · 레고 보물상자
// =====================================================================
const STALK_OFFSETS = [
  [-0.26, -0.26], [0, -0.26], [0.26, -0.26],
  [-0.26, 0], [0, 0], [0.26, 0],
  [-0.26, 0.26], [0, 0.26], [0.26, 0.26]
];

function GrowingCrop3D({ crop, nowTs, mode, onWaterCrop, onHarvest, onRemove }) {
  const meta = CROP_MAP_META[crop.type] || CROP_CATALOG[0];
  const elapsed = (nowTs - (crop.plantedAt || 0)) / 1000;
  const rawProgress = Math.min(1, elapsed / meta.growSec);
  const progress = crop.watered ? rawProgress : Math.min(0.35, rawProgress);
  const isRipe = crop.watered && progress >= 1;
  const scaleY = 0.24 + progress * 0.76;
  const swayRef = useRef();

  useFrame(({ clock }) => {
    if (swayRef.current) {
      swayRef.current.rotation.z = Math.sin(clock.elapsedTime * 2.2 + crop.x * 0.7) * 0.06;
    }
  });

  return (
    <group
      position={[crop.x, crop.y - 0.5, crop.z]}
      onClick={(e) => {
        e.stopPropagation();
        if (mode === 'break') onRemove(crop.id);
        else if (mode === 'water') onWaterCrop(crop);
        else if (isRipe) onHarvest(crop);
        else if (!crop.watered) onWaterCrop(crop);
      }}
    >
      <group ref={swayRef} scale={[1, scaleY, 1]}>
        {(crop.type === 'rice' || crop.type === 'wheat') && (
          <group>
            {STALK_OFFSETS.map(([ox, oz], i) => (
              <group key={i} position={[ox, 0, oz]}>
                <mesh position={[0, 0.32, 0]} castShadow><cylinderGeometry args={[0.024, 0.028, 0.64, 6]} /><meshStandardMaterial color={isRipe ? meta.color : meta.stem} roughness={0.18} /></mesh>
                {progress > 0.45 && <RoundedBox args={[0.09, 0.16, 0.09]} position={[0.03, 0.64, 0]} radius={0.015} castShadow><meshStandardMaterial color={meta.color} roughness={0.18} /></RoundedBox>}
              </group>
            ))}
          </group>
        )}

        {crop.type === 'corn' && (
          <group>
            {[[-0.18, -0.14], [0.18, 0.14], [-0.14, 0.18], [0.16, -0.16]].map(([ox, oz], i) => (
              <group key={i} position={[ox, 0, oz]}>
                <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.038, 0.045, 0.90, 6]} /><meshStandardMaterial color={meta.stem} roughness={0.18} /></mesh>
                {progress > 0.5 && <mesh position={[0.06, 0.56, 0.04]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.18, 8]} /><meshStandardMaterial color={meta.color} roughness={0.16} /></mesh>}
              </group>
            ))}
          </group>
        )}

        {crop.type === 'strawberry' && (
          <group>
            {[[-0.18, -0.15], [0.18, -0.14], [0, 0.17]].map(([ox, oz], i) => (
              <RoundedBox key={i} args={[0.24, 0.14, 0.24]} position={[ox, 0.10, oz]} radius={0.02} castShadow><meshStandardMaterial color="#16A34A" roughness={0.18} /></RoundedBox>
            ))}
            {progress > 0.55 && [[-0.20, 0.20, 0.06], [0.20, 0.20, -0.06], [0, 0.22, 0.20]].map(([bx, by, bz], i) => (
              <mesh key={i} position={[bx, by, bz]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.09, 8]} /><meshStandardMaterial color={meta.color} roughness={0.16} /></mesh>
            ))}
          </group>
        )}

        {crop.type === 'pumpkin' && (
          <group>
            <RoundedBox args={[0.42, 0.06, 0.42]} position={[0, 0.04, 0]} radius={0.015}><meshStandardMaterial color="#15803D" roughness={0.18} /></RoundedBox>
            {progress > 0.4 && (
              <group position={[0, 0.24, 0]}>
                <RoundedBox args={[0.44, 0.36, 0.44]} radius={0.05} castShadow><meshStandardMaterial color={meta.color} roughness={0.18} /></RoundedBox>
                <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.06, 0.06, 0.10, 8]} /><meshStandardMaterial color="#166534" roughness={0.18} /></mesh>
              </group>
            )}
          </group>
        )}

        {crop.type === 'sunflower' && (
          <group>
            {[[-0.16, -0.10], [0.16, 0.10]].map(([ox, oz], i) => (
              <group key={i} position={[ox, 0, oz]}>
                <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.036, 0.04, 0.84, 6]} /><meshStandardMaterial color={meta.stem} roughness={0.18} /></mesh>
                {progress > 0.5 && (
                  <group position={[0, 0.84, 0.05]} rotation={[0.25, 0, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.14, 0.07, 8]} /><meshStandardMaterial color={meta.color} roughness={0.16} /></mesh>
                    <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.04, 8]} /><meshStandardMaterial color="#4A2B14" roughness={0.2} /></mesh>
                  </group>
                )}
              </group>
            ))}
          </group>
        )}
      </group>

      {!crop.watered && <mesh position={[0, 0.85, 0]}><coneGeometry args={[0.075, 0.16, 6]} /><meshBasicMaterial color="#38BDF8" /></mesh>}
      {isRipe && <mesh position={[0, 1.14, 0]}><octahedronGeometry args={[0.09, 0]} /><meshBasicMaterial color="#FDE047" /></mesh>}
    </group>
  );
}

function RoamingAnimal3D({ animal, blockMap, mode, onPet, onRemove }) {
  const meta = ANIMAL_MAP_META[animal.type] || ANIMAL_CATALOG[0];
  const groupRef = useRef(), tailRef = useRef();
  const stateRef = useRef({ x: animal.x, z: animal.z, dirX: 0, dirZ: 0, timer: Math.random() * 2 });

  useFrame(({ clock }, delta) => {
    const st = stateRef.current;
    st.timer -= delta;
    if (st.timer <= 0) {
      if (Math.random() < 0.45) { st.dirX = 0; st.dirZ = 0; st.timer = 1.6 + Math.random() * 2; }
      else { const ang = Math.random() * Math.PI * 2; st.dirX = Math.cos(ang); st.dirZ = Math.sin(ang); st.timer = 1.8 + Math.random() * 2.2; }
    }
    const speed = animal.type === 'rabbit' || animal.type === 'fox' ? 1.45 : animal.type === 'penguin' ? 0.72 : 0.9;
    const nx = st.x + st.dirX * speed * delta, nz = st.z + st.dirZ * speed * delta;
    if (Math.hypot(nx - animal.x, nz - animal.z) < 4.2) {
      const surf = getSurfaceInfo(blockMap, nx, nz);
      if (!surf.isWater) { st.x = nx; st.z = nz; }
      else { st.dirX *= -1; st.dirZ *= -1; }
    } else { st.dirX *= -1; st.dirZ *= -1; }

    if (groupRef.current) {
      const surf = getSurfaceInfo(blockMap, st.x, st.z);
      const moving = st.dirX !== 0 || st.dirZ !== 0;
      const hop = moving ? Math.abs(Math.sin(clock.elapsedTime * 7.5)) * (animal.type === 'rabbit' ? 0.22 : 0.09) : 0;
      groupRef.current.position.set(st.x, surf.y + hop, st.z);
      if (moving) groupRef.current.rotation.y = Math.atan2(st.dirX, st.dirZ);
    }
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(clock.elapsedTime * 10) * 0.4;
  });

  const sc = (meta.scale || 0.9) * (1 + Math.min(0.28, ((animal.level || 1) - 1) * 0.06));
  const t = animal.type;

  return (
    <group ref={groupRef} position={[animal.x, 0.5, animal.z]} scale={[sc, sc, sc]} onClick={(e) => { e.stopPropagation(); if (mode === 'break') onRemove(animal.id); else onPet(animal, meta); }}>
      {t === 'penguin' ? (
        <group>
          <RoundedBox args={[0.42, 0.58, 0.36]} position={[0, 0.32, 0]} radius={0.03} castShadow><meshStandardMaterial color={meta.bodyColor} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.30, 0.42, 0.06]} position={[0, 0.28, 0.17]} radius={0.02}><meshStandardMaterial color={meta.accent} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.14, 0.08, 0.14]} position={[0, 0.48, 0.22]} radius={0.01}><meshStandardMaterial color="#EA580C" roughness={0.18} /></RoundedBox>
        </group>
      ) : t === 'chick' ? (
        <group>
          <RoundedBox args={[0.34, 0.30, 0.34]} position={[0, 0.22, 0]} radius={0.03} castShadow><meshStandardMaterial color={meta.bodyColor} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.24, 0.22, 0.24]} position={[0, 0.44, 0.08]} radius={0.02} castShadow><meshStandardMaterial color={meta.bodyColor} roughness={0.18} /></RoundedBox>
          <RoundedBox args={[0.10, 0.06, 0.10]} position={[0, 0.44, 0.22]} radius={0.01}><meshStandardMaterial color="#EA580C" roughness={0.18} /></RoundedBox>
        </group>
      ) : (
        <group>
          {/* 레고 브릭 동물 몸통 + 등 위 스터드 2개 */}
          <RoundedBox args={[0.50, 0.38, 0.72]} position={[0, 0.38, 0]} radius={0.03} castShadow><meshStandardMaterial color={meta.bodyColor} roughness={0.18} /></RoundedBox>
          {[-0.16, 0.16].map((sz, i) => (<mesh key={i} position={[0, 0.60, sz]}><cylinderGeometry args={[0.10, 0.10, 0.06, 8]} /><meshStandardMaterial color={meta.bodyColor} roughness={0.18} /></mesh>))}
          {/* 레고 브릭 머리 */}
          <RoundedBox args={[0.36, 0.34, 0.34]} position={[0, 0.54, 0.38]} radius={0.03} castShadow><meshStandardMaterial color={meta.headColor} roughness={0.18} /></RoundedBox>
          <mesh position={[-0.10, 0.58, 0.56]}><sphereGeometry args={[0.028, 6, 6]} /><meshBasicMaterial color="#18181B" /></mesh>
          <mesh position={[0.10, 0.58, 0.56]}><sphereGeometry args={[0.028, 6, 6]} /><meshBasicMaterial color="#18181B" /></mesh>
          {t === 'dog' && <RoundedBox ref={tailRef} args={[0.08, 0.22, 0.08]} position={[0, 0.50, -0.38]} rotation={[0.5, 0, 0]} radius={0.015}><meshStandardMaterial color={meta.accent} roughness={0.18} /></RoundedBox>}
          {(t === 'cat' || t === 'fox' || t === 'rabbit') && (
            <>
              <RoundedBox args={[0.09, t === 'rabbit' ? 0.28 : 0.16, 0.09]} position={[-0.12, 0.78, 0.38]} radius={0.015}><meshStandardMaterial color={meta.headColor} roughness={0.18} /></RoundedBox>
              <RoundedBox args={[0.09, t === 'rabbit' ? 0.28 : 0.16, 0.09]} position={[0.12, 0.78, 0.38]} radius={0.015}><meshStandardMaterial color={meta.headColor} roughness={0.18} /></RoundedBox>
            </>
          )}
          {t === 'cow' && <RoundedBox args={[0.52, 0.22, 0.26]} position={[0, 0.42, -0.05]} radius={0.02}><meshStandardMaterial color="#18181B" roughness={0.18} /></RoundedBox>}
          {t === 'pig' && <RoundedBox args={[0.18, 0.12, 0.09]} position={[0, 0.48, 0.58]} radius={0.015}><meshStandardMaterial color={meta.accent} roughness={0.18} /></RoundedBox>}
          {[[-0.16, 0.22], [0.16, 0.22], [-0.16, -0.22], [0.16, -0.22]].map(([lx, lz], i) => (
            <RoundedBox key={i} args={[0.12, 0.22, 0.12]} position={[lx, 0.11, lz]} radius={0.015} castShadow><meshStandardMaterial color={meta.headColor} roughness={0.2} /></RoundedBox>
          ))}
        </group>
      )}
    </group>
  );
}

function SwimmingFish3D({ fish }) {
  const meta = FISH_META_MAP[fish.type] || FISH_CATALOG[0];
  const groupRef = useRef(), tailRef = useRef(), stRef = useRef({ z: fish.z, dir: 1 });
  useFrame(({ clock }, delta) => {
    const st = stRef.current;
    st.z += st.dir * delta * 0.75;
    const [minZ, maxZ] = fish.rangeZ || [-6, 6];
    if (st.z > maxZ) { st.z = maxZ; st.dir = -1; }
    if (st.z < minZ) { st.z = minZ; st.dir = 1; }
    if (groupRef.current) {
      groupRef.current.position.set(fish.x + Math.sin(clock.elapsedTime * 1.3 + fish.z) * 0.35, 0.18 + Math.sin(clock.elapsedTime * 2.5 + fish.x) * 0.04, st.z);
      groupRef.current.rotation.y = st.dir > 0 ? 0 : Math.PI;
    }
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(clock.elapsedTime * 10) * 0.45;
  });
  const s = meta.size || 0.9;
  return (
    <group ref={groupRef} position={[fish.x, 0.18, fish.z]} scale={[s, s, s]}>
      <RoundedBox args={[0.16, 0.20, 0.36]} radius={0.03}><meshStandardMaterial color={meta.body} roughness={0.18} /></RoundedBox>
      <RoundedBox ref={tailRef} args={[0.06, 0.18, 0.16]} position={[0, 0, -0.22]} radius={0.02}><meshStandardMaterial color={meta.tail} roughness={0.18} /></RoundedBox>
    </group>
  );
}

function TreasureChest3D({ chest, opened, onOpen }) {
  const glowRef = useRef();
  useFrame(({ clock }) => { if (glowRef.current && !opened) { glowRef.current.position.y = 0.85 + Math.sin(clock.elapsedTime * 3.5) * 0.12; glowRef.current.rotation.y = clock.elapsedTime * 2; } });
  return (
    <group position={[chest.x, chest.y - 0.5, chest.z]} onClick={(e) => { e.stopPropagation(); if (!opened) onOpen(chest); }}>
      <RoundedBox args={[0.78, 0.48, 0.56]} position={[0, 0.24, 0]} radius={0.025} castShadow><meshStandardMaterial color={opened ? '#6B3410' : '#9A4B16'} roughness={0.2} /></RoundedBox>
      <RoundedBox args={[0.82, 0.12, 0.60]} position={[0, opened ? 0.58 : 0.48, opened ? -0.18 : 0]} rotation={[opened ? -0.8 : 0, 0, 0]} radius={0.02}><meshStandardMaterial color="#FACC15" metalness={0.5} roughness={0.18} /></RoundedBox>
      {!opened && (<mesh ref={glowRef} position={[0, 0.85, 0]}><octahedronGeometry args={[0.15, 0]} /><meshBasicMaterial color="#FDE047" /></mesh>)}
    </group>
  );
}

// =====================================================================
// 6. 33종 유광 ABS 레고 아이템 렌더러
// =====================================================================
function WorldProp3D({ prop, propsList, mode, isNight, onToggleDoor, onRemoveProp }) {
  const flameRef = useRef();
  const isFence = prop.type === 'fence_wood' || prop.type === 'fence_log' || prop.type === 'fence_stone';
  const conn = useMemo(() => (isFence ? getFenceConnections(prop, propsList) : null), [isFence, prop, propsList]);
  const hasAnyConn = conn && (conn.n || conn.s || conn.e || conn.w);

  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 0.9 + Math.sin(clock.elapsedTime * 11 + prop.x) * 0.16;
      flameRef.current.scale.set(s, 1 + Math.cos(clock.elapsedTime * 9) * 0.18, s);
    }
  });

  const renderFenceRail = (dx, dz, isStone, isLog) => {
    const rotY = dx !== 0 ? 0 : Math.PI / 2, px = dx * 0.26, pz = dz * 0.26;
    if (isStone) return <RoundedBox key={`${dx}_${dz}`} args={[0.52, 0.54, 0.18]} position={[px, 0.27, pz]} rotation={[0, rotY, 0]} radius={0.02}><meshStandardMaterial color="#94A3B8" roughness={0.22} /></RoundedBox>;
    return (
      <group key={`${dx}_${dz}`} position={[px, 0, pz]} rotation={[0, rotY, 0]}>
        <RoundedBox args={[0.52, 0.11, 0.08]} position={[0, 0.64, 0]} radius={0.015}><meshStandardMaterial color={isLog ? '#78350F' : '#B45309'} roughness={0.2} /></RoundedBox>
        <RoundedBox args={[0.52, 0.11, 0.08]} position={[0, 0.32, 0]} radius={0.015}><meshStandardMaterial color={isLog ? '#78350F' : '#B45309'} roughness={0.2} /></RoundedBox>
      </group>
    );
  };

  return (
    <group
      position={[prop.x, prop.y - 0.5, prop.z]}
      rotation={[0, isFence && hasAnyConn ? 0 : (prop.rot || 0), 0]}
      onClick={(e) => { e.stopPropagation(); if (mode === 'break') onRemoveProp(prop.id); else if (prop.type === 'door') onToggleDoor(prop.id); }}
    >
      {prop.type === 'hay_bale' && (
        <group>
          <RoundedBox args={[0.82, 0.62, 0.64]} position={[0, 0.31, 0]} radius={0.025} castShadow><meshStandardMaterial color="#EAB308" roughness={0.2} /></RoundedBox>
          {[-0.22, 0.22].map((sx, i) => (<mesh key={i} position={[sx, 0.65, 0]}><cylinderGeometry args={[0.12, 0.12, 0.06, 8]} /><meshStandardMaterial color="#EAB308" roughness={0.2} /></mesh>))}
        </group>
      )}
      {prop.type === 'fruit_basket' && (
        <group>
          <RoundedBox args={[0.62, 0.34, 0.62]} position={[0, 0.17, 0]} radius={0.02} castShadow><meshStandardMaterial color="#B45309" roughness={0.2} /></RoundedBox>
          {[[-0.12, '#E11D48'], [0.12, '#F97316'], [0, '#22C55E']].map(([ox, col], i) => (<mesh key={i} position={[ox, 0.38, i === 2 ? -0.10 : 0.08]}><cylinderGeometry args={[0.11, 0.11, 0.10, 8]} /><meshStandardMaterial color={col} roughness={0.16} /></mesh>))}
        </group>
      )}
      {prop.type === 'well' && (
        <group>
          <mesh position={[0, 0.32, 0]} castShadow><cylinderGeometry args={[0.48, 0.52, 0.64, 12]} /><meshStandardMaterial color="#94A3B8" roughness={0.2} /></mesh>
          <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.38, 12]} /><meshBasicMaterial color="#38BDF8" /></mesh>
          <RoundedBox args={[0.12, 1.25, 0.12]} position={[-0.40, 0.95, 0]} radius={0.015}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox>
          <RoundedBox args={[0.12, 1.25, 0.12]} position={[0.40, 0.95, 0]} radius={0.015}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox>
          <mesh position={[0, 1.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.78, 0.54, 4]} /><meshStandardMaterial color="#DC2626" roughness={0.18} /></mesh>
        </group>
      )}
      {prop.type === 'campfire' && (
        <group>
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <RoundedBox key={i} args={[0.18, 0.14, 0.18]} position={[Math.cos(a) * 0.34, 0.07, Math.sin(a) * 0.34]} radius={0.02}><meshStandardMaterial color="#64748B" roughness={0.2} /></RoundedBox>; })}
          <group ref={flameRef} position={[0, 0.30, 0]}>
            <mesh><coneGeometry args={[0.18, 0.44, 6]} /><meshBasicMaterial color="#F97316" /></mesh>
            <mesh position={[0, -0.05, 0]}><coneGeometry args={[0.10, 0.28, 6]} /><meshBasicMaterial color="#FEF08A" /></mesh>
          </group>
          <pointLight position={[0, 0.65, 0]} intensity={isNight ? 4.5 : 1.2} distance={isNight ? 12 : 5} color="#FB923C" />
        </group>
      )}
      {prop.type === 'cart' && (
        <group>
          <RoundedBox args={[0.88, 0.28, 1.15]} position={[0, 0.42, 0]} radius={0.025} castShadow><meshStandardMaterial color="#92400E" roughness={0.2} /></RoundedBox>
          <mesh position={[-0.48, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 0.08, 12]} /><meshStandardMaterial color="#18181B" roughness={0.25} /></mesh>
          <mesh position={[0.48, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 0.08, 12]} /><meshStandardMaterial color="#18181B" roughness={0.25} /></mesh>
        </group>
      )}
      {prop.type === 'bucket' && (<mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.18, 0.14, 0.34, 10]} /><meshStandardMaterial color="#0284C7" roughness={0.18} /></mesh>)}
      {(prop.type === 'flower_tulip' || prop.type === 'flower_lavender' || prop.type === 'flower_daisy' || prop.type === 'flower_rose') && (
        <group>
          {[[-0.18, -0.14], [0.16, -0.10], [0, 0.16]].map(([fx, fz], i) => (
            <group key={i} position={[fx, 0, fz]}>
              <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.028, 0.028, 0.32, 6]} /><meshStandardMaterial color="#16A34A" roughness={0.18} /></mesh>
              <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.09, 0.09, 0.07, 8]} /><meshStandardMaterial color={prop.type === 'flower_tulip' ? '#E11D48' : prop.type === 'flower_lavender' ? '#A855F7' : prop.type === 'flower_daisy' ? '#FFFFFF' : '#BE123C'} roughness={0.16} /></mesh>
            </group>
          ))}
        </group>
      )}
      {isFence && (
        <group>
          <RoundedBox args={[0.22, 0.82, 0.22]} position={[0, 0.41, 0]} radius={0.02}><meshStandardMaterial color={prop.type === 'fence_stone' ? '#64748B' : '#78350F'} roughness={0.2} /></RoundedBox>
          {hasAnyConn ? (<>{conn.e && renderFenceRail(1, 0, prop.type === 'fence_stone', prop.type === 'fence_log')}{conn.w && renderFenceRail(-1, 0, prop.type === 'fence_stone', prop.type === 'fence_log')}{conn.s && renderFenceRail(0, 1, prop.type === 'fence_stone', prop.type === 'fence_log')}{conn.n && renderFenceRail(0, -1, prop.type === 'fence_stone', prop.type === 'fence_log')}</>)
            : (<>{renderFenceRail(1, 0, prop.type === 'fence_stone', prop.type === 'fence_log')}{renderFenceRail(-1, 0, prop.type === 'fence_stone', prop.type === 'fence_log')}</>)}
        </group>
      )}
      {prop.type === 'door' && (
        <group position={[0, 0, -0.45]} rotation={[0, prop.open ? 1.4 : 0, 0]}>
          <RoundedBox args={[0.14, 1.94, 0.90]} position={[0, 0.97, 0.45]} radius={0.02} castShadow><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox>
          <mesh position={[0.09, 0.92, 0.74]}><cylinderGeometry args={[0.055, 0.055, 0.06, 8]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#FACC15" roughness={0.18} /></mesh>
        </group>
      )}
      {prop.type === 'cross' && (<group><RoundedBox args={[0.18, 1.75, 0.16]} position={[0, 0.875, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FACC15" metalness={0.45} roughness={0.18} /></RoundedBox><RoundedBox args={[0.96, 0.18, 0.16]} position={[0, 1.24, 0]} radius={0.02} castShadow><meshStandardMaterial color="#FACC15" metalness={0.45} roughness={0.18} /></RoundedBox></group>)}
      {prop.type === 'pulpit' && (<group><RoundedBox args={[0.70, 0.82, 0.42]} position={[0, 0.48, 0]} radius={0.02}><meshStandardMaterial color="#B45309" roughness={0.2} /></RoundedBox><RoundedBox args={[0.92, 0.08, 0.58]} position={[0, 0.92, 0]} rotation={[0.12, 0, 0]} radius={0.015}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox></group>)}
      {prop.type === 'offering' && (<RoundedBox args={[0.48, 0.88, 0.44]} position={[0, 0.44, 0]} radius={0.02}><meshStandardMaterial color="#B45309" roughness={0.2} /></RoundedBox>)}
      {prop.type === 'pew' && (<group><RoundedBox args={[1.85, 0.10, 0.48]} position={[0, 0.36, 0]} radius={0.02}><meshStandardMaterial color="#B45309" roughness={0.2} /></RoundedBox><RoundedBox args={[1.80, 0.05, 0.40]} position={[0, 0.43, 0]} radius={0.015}><meshStandardMaterial color="#991B1B" roughness={0.2} /></RoundedBox><RoundedBox args={[1.85, 0.46, 0.09]} position={[0, 0.64, -0.22]} radius={0.02}><meshStandardMaterial color="#92400E" roughness={0.2} /></RoundedBox></group>)}
      {prop.type === 'piano' && (<group><RoundedBox args={[1.15, 0.42, 1.25]} position={[0, 0.68, 0]} radius={0.04}><meshStandardMaterial color="#18181B" roughness={0.16} /></RoundedBox><RoundedBox args={[1.05, 0.06, 0.24]} position={[0, 0.58, 0.64]} radius={0.01}><meshStandardMaterial color="#FFFFFF" roughness={0.16} /></RoundedBox></group>)}
      {prop.type === 'drum' && (<group><mesh position={[0, 0.30, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.38, 12]} /><meshStandardMaterial color="#DC2626" roughness={0.18} /></mesh><mesh position={[0, 0.92, 0]}><cylinderGeometry args={[0.20, 0.20, 0.02, 12]} /><meshStandardMaterial color="#FACC15" roughness={0.18} /></mesh></group>)}
      {(prop.type === 'guitar_ac' || prop.type === 'guitar_el' || prop.type === 'cello') && (<RoundedBox args={[0.30, 0.52, 0.12]} position={[0, 0.40, 0]} radius={0.03}><meshStandardMaterial color={prop.type === 'guitar_el' ? '#2563EB' : '#D97706'} roughness={0.18} /></RoundedBox>)}
      {prop.type === 'synth' && (<RoundedBox args={[1.15, 0.12, 0.38]} position={[0, 0.72, 0]} radius={0.02}><meshStandardMaterial color="#18181B" roughness={0.18} /></RoundedBox>)}
      {prop.type === 'speaker' && (<RoundedBox args={[0.48, 0.84, 0.42]} position={[0, 0.42, 0]} radius={0.02}><meshStandardMaterial color="#18181B" roughness={0.2} /></RoundedBox>)}
      {prop.type === 'mic' && (<mesh position={[0, 0.58, 0]}><cylinderGeometry args={[0.02, 0.02, 1.12, 6]} /><meshStandardMaterial color="#475569" roughness={0.2} /></mesh>)}
      {prop.type === 'torch' && (<group><mesh position={[0, 0.56, 0]}><cylinderGeometry args={[0.06, 0.075, 1.12, 8]} /><meshStandardMaterial color="#4A2B14" roughness={0.2} /></mesh><RoundedBox args={[0.28, 0.32, 0.28]} position={[0, 1.18, 0]} radius={0.02}><meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={isNight ? 2.2 : 0.9} /></RoundedBox><pointLight position={[0, 1.32, 0]} intensity={isNight ? 3.8 : 0.8} distance={isNight ? 11 : 4.5} color="#FDBA74" /></group>)}
      {prop.type === 'flower' && (<group><RoundedBox args={[0.42, 0.34, 0.42]} position={[0, 0.17, 0]} radius={0.02}><meshStandardMaterial color="#B91C1C" roughness={0.18} /></RoundedBox><RoundedBox args={[0.36, 0.24, 0.36]} position={[0, 0.44, 0]} radius={0.02}><meshStandardMaterial color="#16A34A" roughness={0.18} /></RoundedBox></group>)}
      {prop.type === 'table' && (<RoundedBox args={[0.94, 0.10, 0.94]} position={[0, 0.72, 0]} radius={0.02}><meshStandardMaterial color="#D97706" roughness={0.18} /></RoundedBox>)}
      {prop.type === 'chair' && (<RoundedBox args={[0.46, 0.08, 0.46]} position={[0, 0.38, 0]} radius={0.015}><meshStandardMaterial color="#D97706" roughness={0.18} /></RoundedBox>)}
      {prop.type === 'bed' && (<RoundedBox args={[0.92, 0.32, 1.55]} position={[0, 0.20, 0]} radius={0.02}><meshStandardMaterial color="#DC2626" roughness={0.18} /></RoundedBox>)}
      {prop.type === 'window' && (<RoundedBox args={[0.92, 0.96, 0.14]} position={[0, 0.48, 0]} radius={0.02}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox>)}
      {prop.type === 'mirror' && (<RoundedBox args={[0.64, 1.48, 0.08]} position={[0, 0.74, 0]} radius={0.02}><meshStandardMaterial color="#B45309" roughness={0.2} /></RoundedBox>)}
    </group>
  );
}

// =====================================================================
// 7. 레고 물레방아 · 레고 다리 · 레고 구름 · 유광 복셀 메시 · 레고 미니피겨 NPC & PlayerRig
// =====================================================================
function AmbientWorldDetails({ biome, isNight }) {
  const cloudsRef = useRef(), wheelRef = useRef();
  const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => {
    const a = (i * 137.5) % 360, r = 42 + (i % 15) * 2;
    return [Math.cos(a) * r, 18 + (i % 18), Math.sin(a) * r];
  }), []);

  useFrame(({ clock }, delta) => {
    if (cloudsRef.current) cloudsRef.current.position.x = Math.sin(clock.elapsedTime * 0.06) * 4.5;
    if (wheelRef.current) wheelRef.current.rotation.x += delta * 0.9;
  });

  return (
    <group>
      {isNight && (
        <group>
          <mesh position={[-18, 22, -26]}><sphereGeometry args={[2.8, 16, 16]} /><meshBasicMaterial color="#FEF3C7" /></mesh>
          <pointLight position={[-16, 20, -24]} intensity={1.1} distance={80} color="#CBD5E1" />
          {stars.map(([sx, sy, sz], i) => (<mesh key={i} position={[sx, sy, sz]}><boxGeometry args={[0.18, 0.18, 0.18]} /><meshBasicMaterial color="#FFFFFF" /></mesh>))}
        </group>
      )}
      {/* 레고 브릭 구름 */}
      <group ref={cloudsRef}>
        {[[-10, 15, -8, 1.15], [8, 16.5, -12, 1.35], [14, 15.5, 6, 1.05]].map(([cx, cy, cz, s], i) => (
          <group key={i} position={[cx, cy, cz]} scale={[s, s, s]}>
            <RoundedBox args={[2.2, 0.7, 1.4]} radius={0.06}><meshStandardMaterial color={isNight ? '#334155' : '#FFFFFF'} roughness={0.22} /></RoundedBox>
            <RoundedBox args={[1.4, 0.6, 1.1]} position={[0.4, 0.5, 0]} radius={0.06}><meshStandardMaterial color={isNight ? '#334155' : '#FFFFFF'} roughness={0.22} /></RoundedBox>
          </group>
        ))}
      </group>
      {biome === 'meadow' && (
        <group>
          {/* 레고 브릭 다리 */}
          <group position={[0, 0.56, 1.5]}>
            {Array.from({ length: 13 }).map((_, i) => (<RoundedBox key={i} args={[0.44, 0.12, 2.08]} position={[-3 + i * 0.5, 0, 0]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color={i % 2 === 0 ? '#B45309' : '#92400E'} roughness={0.2} /></RoundedBox>))}
          </group>
          {/* 레고 회전 물레방아 */}
          <group position={[-2.2, 1.35, -3.5]}>
            <RoundedBox args={[0.28, 1.65, 0.28]} position={[-0.4, -0.4, 0]} radius={0.02}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox>
            <group ref={wheelRef}>
              <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.15, 0.11, 6, 14]} /><meshStandardMaterial color="#92400E" roughness={0.2} /></mesh>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<group key={i} rotation={[(i / 8) * Math.PI * 2, 0, 0]}><RoundedBox args={[0.12, 2.25, 0.12]} radius={0.015}><meshStandardMaterial color="#78350F" roughness={0.2} /></RoundedBox><RoundedBox args={[0.40, 0.18, 0.26]} position={[0, 1.18, 0]} radius={0.015}><meshStandardMaterial color="#D97706" roughness={0.18} /></RoundedBox></group>))}
            </group>
          </group>
        </group>
      )}
    </group>
  );
}

function VoxelWorldMesh({
  blockMap, mode, isInsideChapel, selectedBlock, selectedPartShape, selectedProp, selectedCrop, selectedAnimal, selectedNpcType, propRot,
  onAddLegoStructure, onMineBlock, onAddProp, onPlantCrop, onWaterSoil, onAddAnimal, onAddNpc, onWalkTo
}) {
  const [hoverTarget, setHoverTarget] = useState(null);
  const textures = useMemo(() => createBlockTextures(), []);
  const geometries = useMemo(() => buildCulledGeometries(blockMap), [blockMap]);
  useEffect(() => () => { Object.values(geometries).forEach((g) => g.dispose()); }, [geometries]);

  const computeHitCoords = (e) => {
    const n = e.face?.normal;
    if (!n) return null;
    const inX = Math.round(e.point.x - n.x * 0.45), inY = Math.round(e.point.y - n.y * 0.45), inZ = Math.round(e.point.z - n.z * 0.45);
    return { inX, inY, inZ, outX: inX + Math.round(n.x), outY: inY + Math.round(n.y), outZ: inZ + Math.round(n.z) };
  };

  return (
    <group>
      {Object.entries(geometries).map(([type, geo]) => {
        const meta = BLOCK_MAP_META[type] || BLOCK_CATALOG[0];
        const isRoofFade = isInsideChapel && (type === 'roof_red' || type === 'roof_blue');
        return (
          <mesh
            key={type}
            geometry={geo}
            castShadow={!meta.transparent && !isRoofFade}
            receiveShadow
            onPointerMove={(e) => {
              if (mode === 'walk') return;
              e.stopPropagation();
              const c = computeHitCoords(e);
              if (!c) return;
              setHoverTarget(mode === 'break' || mode === 'water' ? [c.inX, c.inY, c.inZ] : [c.outX, c.outY, c.outZ]);
            }}
            onPointerOut={() => setHoverTarget(null)}
            onClick={(e) => {
              e.stopPropagation();
              const c = computeHitCoords(e);
              if (!c) return;
              if (mode === 'walk') onWalkTo(e.point.x, e.point.z);
              else if (mode === 'build') onAddLegoStructure(c.outX, c.outY, c.outZ, selectedBlock, selectedPartShape, propRot);
              else if (mode === 'prop') onAddProp(c.outX, c.outY, c.outZ, selectedProp, propRot);
              else if (mode === 'farm') onPlantCrop(c.outX, c.outY, c.outZ, selectedCrop);
              else if (mode === 'water') onWaterSoil(c.inX, c.inY, c.inZ);
              else if (mode === 'animal') onAddAnimal(c.outX, c.outZ, selectedAnimal);
              else if (mode === 'npc') onAddNpc(c.outX, c.outY - 0.5, c.outZ, selectedNpcType, propRot);
              else if (mode === 'break') onMineBlock(c.inX, c.inY, c.inZ);
            }}
          >
            {/* 유광 ABS 플라스틱 브릭 재질 (roughness 0.22로 레고 특유의 광택 구현!) */}
            <meshStandardMaterial
              map={textures[type]}
              color={meta.transparent ? meta.color : '#FFFFFF'}
              roughness={meta.transparent ? 0.08 : 0.22}
              metalness={0.04}
              transparent={Boolean(meta.transparent) || isRoofFade}
              opacity={isRoofFade ? 0.22 : (meta.opacity ?? 1)}
              emissive={meta.emissive || '#000000'}
              emissiveIntensity={meta.emissiveIntensity || 0}
            />
          </mesh>
        );
      })}
      {mode !== 'walk' && hoverTarget && (
        <mesh position={hoverTarget}>
          <boxGeometry args={[1.04, 1.04, 1.04]} />
          <meshBasicMaterial color={mode === 'break' ? '#FB7185' : mode === 'water' ? '#38BDF8' : '#FACC15'} wireframe transparent opacity={0.95} />
        </mesh>
      )}
    </group>
  );
}

function AutonomousNpcAvatar({ npc, blockMap, mode, isBandPlaying, onSelectNpc, onRemoveNpc }) {
  const meta = NPC_META_MAP[npc.type] || NPC_CATALOG[0];
  const nameTagTex = useMemo(() => makeNameTagTex(meta.label, '#F59E0B'), [meta.label]);
  const npcGroupRef = useRef();
  const [walking, setWalking] = useState(false);
  const roamRef = useRef({ x: npc.x, z: npc.z, dx: 0, dz: 0, timer: 1 + Math.random() * 2 });

  useFrame((_, delta) => {
    if (!npc.roam || !npcGroupRef.current) return;
    const st = roamRef.current;
    st.timer -= delta;
    if (st.timer <= 0) {
      if (Math.random() < 0.5) { st.dx = 0; st.dz = 0; st.timer = 2.0; setWalking(false); }
      else { const a = Math.random() * Math.PI * 2; st.dx = Math.cos(a); st.dz = Math.sin(a); st.timer = 2.2; setWalking(true); }
    }
    if (st.dx !== 0 || st.dz !== 0) {
      const nx = st.x + st.dx * 1.05 * delta, nz = st.z + st.dz * 1.05 * delta;
      if (Math.hypot(nx - npc.x, nz - npc.z) < 3.0) {
        const surf = getSurfaceInfo(blockMap, nx, nz);
        if (!surf.isWater) { st.x = nx; st.z = nz; npcGroupRef.current.position.set(nx, surf.y, nz); npcGroupRef.current.rotation.y = Math.atan2(st.dx, st.dz); }
      }
    }
  });

  return (
    <group ref={npcGroupRef} position={[npc.x, npc.y, npc.z]} rotation={[0, npc.rot || 0, 0]} scale={meta.isKid ? [0.78, 0.78, 0.78] : [1, 1, 1]}>
      <SharedChibiAvatar
        position={[0, 0, 0]}
        isWalking={walking}
        emote={isBandPlaying && meta.isBand ? 'dance' : null}
        shirtColor={meta.shirt}
        pantsColor={meta.pants}
        hairColor={meta.hair}
        nameTagTexture={nameTagTex}
        onClick={(e) => { e.stopPropagation(); if (mode === 'break') onRemoveNpc(npc.id); else onSelectNpc(meta); }}
      />
    </group>
  );
}

function PlayerRig({ blockMap, propsList, worldRadius, walkTarget, clearWalkTarget, joyVecRef, jumpReqRef, playerPosRef, playerRotRef, playerName, avatarConfig, controlsRef, soundMuted, onSwimChange, onInsideChapelChange, onSyncPos }) {
  const playerGroupRef = useRef();
  const keysRef = useRef({});
  const vyRef = useRef(0);
  const groundedRef = useRef(true);
  const stepTimerRef = useRef(0);
  const walkingRef = useRef(false);
  const [walkingState, setWalkingState] = useState(false);
  const [swimming, setSwimming] = useState(false);
  const nameTagTex = useMemo(() => makeNameTagTex(`나 · ${playerName}`, '#38BDF8'), [playerName]);

  useEffect(() => {
    const down = (e) => { keysRef.current[e.code] = true; if (e.code === 'Space') { e.preventDefault(); jumpReqRef.current = true; } };
    const up = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [jumpReqRef]);

  useFrame(({ camera }, delta) => {
    if (!playerGroupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const speed = swimming ? 3.8 : 5.4;
    let vx = 0, vz = 0;
    const k = keysRef.current;
    if (k.KeyW || k.ArrowUp) vz -= 1;
    if (k.KeyS || k.ArrowDown) vz += 1;
    if (k.KeyA || k.ArrowLeft) vx -= 1;
    if (k.KeyD || k.ArrowRight) vx += 1;
    if (Math.abs(joyVecRef.current.x) > 0.08 || Math.abs(joyVecRef.current.z) > 0.08) { vx = joyVecRef.current.x; vz = joyVecRef.current.z; }

    const [cx, cy, cz] = playerPosRef.current;
    let wantX = cx, wantZ = cz, isMoving = false;

    if (vx !== 0 || vz !== 0) {
      if (walkTarget) clearWalkTarget();
      const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
      const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
      const move = new THREE.Vector3().addScaledVector(camDir, -vz).addScaledVector(camRight, vx);
      if (move.lengthSq() > 1) move.normalize();
      wantX = cx + move.x * speed * dt; wantZ = cz + move.z * speed * dt;
      const nextRot = Math.atan2(move.x, move.z);
      playerRotRef.current = nextRot;
      playerGroupRef.current.rotation.y = nextRot;
      isMoving = true;
    } else if (walkTarget) {
      const dx = walkTarget[0] - cx, dz = walkTarget[1] - cz, dist = Math.hypot(dx, dz);
      if (dist > 0.14) {
        const step = Math.min(dist, speed * dt);
        wantX = cx + (dx / dist) * step; wantZ = cz + (dz / dist) * step;
        const nextRot = Math.atan2(dx, dz);
        playerRotRef.current = nextRot;
        playerGroupRef.current.rotation.y = nextRot;
        isMoving = true;
      } else clearWalkTarget();
    }

    if (jumpReqRef.current) {
      jumpReqRef.current = false;
      if (groundedRef.current || swimming) { vyRef.current = 7.4; groundedRef.current = false; playSfx('jump', soundMuted); }
    }

    vyRef.current -= 20.5 * dt;
    let ny = cy + vyRef.current * dt;

    let nx = cx, nz = cz;
    if (isMoving) {
      if (canPlayerMoveTo(blockMap, propsList, Math.max(cy, ny), wantX, cz, worldRadius)) nx = wantX;
      if (canPlayerMoveTo(blockMap, propsList, Math.max(cy, ny), nx, wantZ, worldRadius)) nz = wantZ;
      if (nx === cx && nz === cz && walkTarget) clearWalkTarget();
    }

    const surf = getSurfaceBelow(blockMap, nx, ny, nz);
    if (ny <= surf.y) { ny = surf.y; vyRef.current = 0; groundedRef.current = true; }
    else groundedRef.current = false;

    if (surf.isWater !== swimming) { setSwimming(surf.isWater); onSwimChange(surf.isWater); }
    onInsideChapelChange(nx >= 5.2 && nx <= 10.8 && nz >= 2.2 && nz <= 8.8);

    const actuallyMoved = nx !== cx || nz !== cz;
    if (actuallyMoved && (groundedRef.current || surf.isWater)) {
      stepTimerRef.current += dt;
      if (stepTimerRef.current >= (surf.isWater ? 0.45 : 0.34)) { stepTimerRef.current = 0; playSfx(surf.isWater ? 'splash' : 'step', soundMuted); }
    }

    if (actuallyMoved || Math.abs(ny - cy) > 0.004) {
      playerPosRef.current = [nx, ny, nz];
      playerGroupRef.current.position.set(nx, ny, nz);
      if (walkingRef.current !== actuallyMoved) { walkingRef.current = actuallyMoved; setWalkingState(actuallyMoved); }
      if (controlsRef.current) {
        camera.position.x += nx - cx; camera.position.y += ny - cy; camera.position.z += nz - cz;
        controlsRef.current.target.set(nx, ny + 0.9, nz);
        controlsRef.current.update();
      }
      onSyncPos(nx, ny, nz);
    } else if (walkingRef.current) { walkingRef.current = false; setWalkingState(false); }
  });

  return (
    <group ref={playerGroupRef} position={[2, 0.5, 5]} rotation={[0, Math.PI, 0]}>
      <SharedChibiAvatar
        position={[0, 0, 0]}
        rotationY={0}
        isWalking={walkingState}
        gender={avatarConfig.gender}
        hairStyle={avatarConfig.hairStyle}
        isSkirt={Boolean(avatarConfig.isSkirt)}
        shirtColor={avatarConfig.shirtColor}
        pantsColor={avatarConfig.pantsColor}
        hairColor={avatarConfig.hairColor}
        nameTagTexture={nameTagTex}
      />
    </group>
  );
}

// =====================================================================
// 8. 메인 7층 레고 브릭월드 (SkyGarden7F)
// =====================================================================
export default function SkyGarden7F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore((s) => s.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '정신동';
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false), []);

  const clientIdRef = useRef(`ow7f_${playerName}_${Math.random().toString(36).slice(2, 8)}`);
  const controlsRef = useRef();
  const channelRef = useRef(null);
  const lastSyncRef = useRef(0);
  const playerPosRef = useRef([2, 0.5, 5]);
  const playerRotRef = useRef(Math.PI);
  const joyVecRef = useRef({ x: 0, z: 0 });
  const jumpReqRef = useRef(false);
  const camCommandRef = useRef(null);
  const blockHpRef = useRef({});
  const bandTimerRef = useRef(null);

  const [avatarConfig] = useState(() => {
    try { const s = localStorage.getItem('gtc_metaverse_avatar_v1'); return s ? { ...DEFAULT_AVATAR, ...JSON.parse(s) } : DEFAULT_AVATAR; }
    catch { return DEFAULT_AVATAR; }
  });

  const [world, setWorld] = useState(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_WORLD); if (saved) return JSON.parse(saved); } catch (_) {}
    return { ...generateBiomeWorld('meadow', 18), customParts: [] };
  });

  const [meta, setMeta] = useState(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_META); if (saved) return { ...DEFAULT_META, ...JSON.parse(saved) }; } catch (_) {}
    return DEFAULT_META;
  });

  const [bursts, setBursts] = useState([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNowTs(Date.now()), 1000); return () => clearInterval(t); }, []);

  const [soundMuted, setSoundMuted] = useState(false);
  const [creativeMode, setCreativeMode] = useState(true);
  const [camPreset, setCamPreset] = useState('behind');
  const [mode, setMode] = useState('walk');
  const [blockCat, setBlockCat] = useState('전체');
  const [selectedPartShape, setSelectedPartShape] = useState('brick_1x1');
  const [selectedBlock, setSelectedBlock] = useState('ivory_wall');
  const [selectedProp, setSelectedProp] = useState('hay_bale');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [selectedAnimal, setSelectedAnimal] = useState('sheep');
  const [selectedNpcType, setSelectedNpcType] = useState('pastor');
  const [propRot, setPropRot] = useState(0);

  const [isSwimming, setIsSwimming] = useState(false);
  const [isInsideChapel, setIsInsideChapel] = useState(false);
  const [isBandPlaying, setIsBandPlaying] = useState(false);
  const [walkTarget, setWalkTarget] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [toastMsg, setToastMsg] = useState('');

  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showBiomeModal, setShowBiomeModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [selectedNpcDialog, setSelectedNpcDialog] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);

  const worldRadius = world.radius || 18;

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? '' : prev)), 2800);
  }, []);

  const spawnBrickBurst = useCallback((x, y, z, color = '#FACC15') => {
    const id = `bst_${Date.now()}_${Math.random()}`;
    const pieces = Array.from({ length: 6 }).map(() => ({
      vel: [(Math.random() - 0.5) * 4.5, 2.5 + Math.random() * 3.2, (Math.random() - 0.5) * 4.5]
    }));
    setBursts((prev) => [...prev.slice(-6), { id, x, y, z, color, pieces }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 520);
  }, []);

  const updateWorld = useCallback((updater, broadcast = true) => {
    setWorld((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY_WORLD, JSON.stringify(next)); } catch (_) {}
      if (broadcast && channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'openworld_sync_7f', payload: { sender: clientIdRef.current, world: next } }).catch(() => {});
      }
      return next;
    });
  }, []);

  const updateMeta = useCallback((updater) => {
    setMeta((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY_META, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  const completeQuest = useCallback((qid) => {
    const q = VILLAGE_QUESTS.find((x) => x.id === qid);
    if (!q) return;
    setMeta((prev) => {
      if (prev.quests[qid]) return prev;
      const next = { ...prev, hearts: prev.hearts + q.reward, quests: { ...prev.quests, [qid]: true } };
      try { localStorage.setItem(STORAGE_KEY_META, JSON.stringify(next)); } catch (_) {}
      playSfx('fanfare', soundMuted);
      showToast(`🎉 퀘스트 완료: [${q.title}] ❤️ +${q.reward}`);
      return next;
    });
  }, [showToast, soundMuted]);

  const toggleBandPlay = useCallback(() => {
    if (isBandPlaying) { clearInterval(bandTimerRef.current); setIsBandPlaying(false); return; }
    setIsBandPlaying(true);
    completeQuest('q_band');
    showToast('🎵 좋은나무 레고 찬양악단 합주가 시작되었습니다!');
    let step = 0;
    const chords = [[261.63, 329.63, 392.0, 523.25], [220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66, 392.0]];
    const playStep = () => {
      if (soundMuted) return;
      try {
        const ctx = getAudioCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        chords[step % chords.length].forEach((freq, i) => {
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          osc.type = i === 0 ? 'sine' : 'triangle'; osc.frequency.setValueAtTime(freq, now + i * 0.04);
          gain.gain.setValueAtTime(0.032, now + i * 0.04); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
          osc.connect(gain); gain.connect(ctx.destination); osc.start(now + i * 0.04); osc.stop(now + 0.75);
        });
        step++;
      } catch (_) {}
    };
    playStep();
    bandTimerRef.current = setInterval(playStep, 850);
  }, [isBandPlaying, completeQuest, showToast, soundMuted]);

  useEffect(() => () => clearInterval(bandTimerRef.current), []);

  const handleExpandWorld = () => {
    const nextR = worldRadius < 24 ? 24 : worldRadius < 30 ? 30 : 30;
    if (nextR === worldRadius) return showToast('이미 최대 크기(61×61)로 확장된 레고 월드입니다!');
    updateWorld((prev) => expandWorldTerrain(prev, nextR), true);
    playSfx('fanfare', soundMuted);
    showToast(`🗺️ 레고 월드가 ${nextR * 2 + 1}×${nextR * 2 + 1} 크기로 확장되었습니다!`);
  };

  // ★ 다중 형태 레고 브릭 조립 엔진 (1×1 · 1×2 · 2×2 · 1×4 · 경사지붕 · 아치 · 유리창 · 발광브릭)
  const handleAddLegoStructure = useCallback((x, y, z, blockType, partShape, rot) => {
    if (Math.abs(x) > worldRadius || Math.abs(z) > worldRadius || y < -4 || y > 16) return;
    const color = BLOCK_MAP_META[blockType]?.color || '#FACC15';

    // 특수 조형 브릭 파츠
    if (['slope_roof', 'arch_gate', 'window_glass', 'neon_lamp'].includes(partShape)) {
      const newPart = { id: `lpt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, shape: partShape, blockType, x, y, z, rot };
      updateWorld((prev) => ({ ...prev, customParts: [...(prev.customParts || []), newPart] }));
      playSfx('place', soundMuted);
      spawnBrickBurst(x, y + 0.3, z, color);
      return;
    }

    // 멀티셀 레고 브릭 (1x1, 1x2, 2x2, 1x4)
    const dirX = Math.round(Math.cos(rot)), dirZ = Math.round(Math.sin(rot));
    const cells = [];
    if (partShape === 'brick_1x1') cells.push([x, y, z]);
    else if (partShape === 'brick_1x2') cells.push([x, y, z], [x + dirX, y, z + dirZ]);
    else if (partShape === 'brick_1x4') { for (let i = 0; i < 4; i++) cells.push([x + dirX * i, y, z + dirZ * i]); }
    else if (partShape === 'brick_2x2') cells.push([x, y, z], [x + 1, y, z], [x, y, z + 1], [x + 1, y, z + 1]);

    const validCells = cells.filter(([cx, cy, cz]) => Math.abs(cx) <= worldRadius && Math.abs(cz) <= worldRadius && !isCellOccupied(world.blocks, world.props, cx, cy, cz, playerPosRef.current));
    if (validCells.length === 0) return showToast('이미 브릭이나 캐릭터가 있는 위치입니다.');

    updateWorld((prev) => {
      const nb = { ...prev.blocks };
      validCells.forEach(([cx, cy, cz]) => { nb[blockKey(cx, cy, cz)] = blockType; });
      return { ...prev, blocks: nb };
    });
    playSfx('place', soundMuted);
    spawnBrickBurst(x, y + 0.3, z, color);
  }, [world.blocks, world.props, worldRadius, updateWorld, showToast, soundMuted, spawnBrickBurst]);

  const handleRemoveCustomPart = useCallback((id) => {
    updateWorld((prev) => ({ ...prev, customParts: (prev.customParts || []).filter((p) => p.id !== id) }));
    playSfx('break', soundMuted);
  }, [updateWorld, soundMuted]);

  const handleMineBlock = useCallback((x, y, z) => {
    if (y <= -5) return showToast('단단한 지하 암반은 부술 수 없습니다!');
    const k = blockKey(x, y, z);
    const oldType = world.blocks[k];
    if (!oldType) return;
    const bMeta = BLOCK_MAP_META[oldType];
    if (bMeta?.unbreakable) return showToast('단단한 지하 암반은 부술 수 없습니다!');

    const maxHp = bMeta?.hp || 1;
    const curHp = (blockHpRef.current[k] ?? maxHp) - 1;
    if (curHp > 0) {
      blockHpRef.current[k] = curHp;
      playSfx('hit', soundMuted);
      showToast(`⛏️ [${bMeta?.label}] 분해 중... (남은 타격 ${curHp})`);
      return;
    }

    delete blockHpRef.current[k];
    updateWorld((prev) => { const nb = { ...prev.blocks }; delete nb[k]; return { ...prev, blocks: nb }; });
    playSfx('break', soundMuted);
    spawnBrickBurst(x, y + 0.2, z, bMeta?.color || '#94A3B8');
    const dropKey = bMeta?.drop;
    if (dropKey) {
      updateMeta((prev) => ({ ...prev, materials: { ...prev.materials, [dropKey]: (prev.materials[dropKey] || 0) + 1 } }));
      if (oldType.startsWith('ore_')) { showToast(`💎 [${bMeta.label}] 채굴 성공! ${MATERIAL_META[dropKey]?.icon} +1`); completeQuest('q_mine'); }
    }
  }, [world.blocks, updateWorld, updateMeta, showToast, soundMuted, completeQuest, spawnBrickBurst]);

  const handleWaterCrop = useCallback((crop) => {
    updateWorld((prev) => ({ ...prev, blocks: { ...prev.blocks, [blockKey(crop.x, crop.y - 1, crop.z)]: 'wet_soil' }, crops: prev.crops.map((c) => (c.id === crop.id ? { ...c, watered: true, plantedAt: Date.now() - 4000 } : c)) }));
    playSfx('water', soundMuted); showToast('💧 물을 주었습니다! 레고 작물이 쑥쑥 자랍니다.'); completeQuest('q_water');
  }, [updateWorld, soundMuted, showToast, completeQuest]);

  const handleWaterSoil = useCallback((x, y, z) => {
    const t = world.blocks[blockKey(x, y, z)];
    if (t === 'farm_soil' || t === 'dirt' || t === 'grass') {
      updateWorld((prev) => ({ ...prev, blocks: { ...prev.blocks, [blockKey(x, y, z)]: 'wet_soil' }, crops: prev.crops.map((c) => (c.x === x && c.z === z ? { ...c, watered: true } : c)) }));
      playSfx('water', soundMuted); completeQuest('q_water');
    }
  }, [world.blocks, updateWorld, soundMuted, completeQuest]);

  const handlePlantCrop = useCallback((x, y, z, cropType) => {
    if (Math.abs(x) > worldRadius || Math.abs(z) > worldRadius) return;
    const below = world.blocks[blockKey(x, y - 1, z)];
    if (below !== 'farm_soil' && below !== 'wet_soil' && below !== 'grass' && below !== 'dirt') return showToast('잔디나 텃밭 브릭 위에 심어주세요!');
    if (world.crops.some((c) => c.x === x && c.z === z)) return showToast('이미 작물이 심어져 있습니다.');
    const isAlreadyWet = below === 'wet_soil';
    updateWorld((prev) => ({ ...prev, blocks: { ...prev.blocks, [blockKey(x, y - 1, z)]: isAlreadyWet ? 'wet_soil' : 'farm_soil' }, crops: [...prev.crops, { id: `cp_${Date.now()}`, type: cropType, x, y, z, plantedAt: Date.now(), watered: isAlreadyWet }] }));
    playSfx('place', soundMuted);
  }, [world.blocks, world.crops, worldRadius, updateWorld, showToast, soundMuted]);

  const handleHarvestCrop = useCallback((crop) => {
    const cMeta = CROP_MAP_META[crop.type] || CROP_CATALOG[0];
    updateWorld((prev) => ({ ...prev, crops: prev.crops.filter((c) => c.id !== crop.id) }));
    updateMeta((prev) => {
      const nextProps = { ...prev.props };
      if (cMeta.bonusProp) nextProps[cMeta.bonusProp] = (nextProps[cMeta.bonusProp] || 0) + 1;
      return { ...prev, hearts: prev.hearts + cMeta.heartReward, materials: { ...prev.materials, [cMeta.harvestMat]: (prev.materials[cMeta.harvestMat] || 0) + 2 }, props: nextProps };
    });
    playSfx('harvest', soundMuted);
    showToast(`${cMeta.icon} [${cMeta.label}] 수확! ❤️+${cMeta.heartReward}`);
    completeQuest('q_harvest');
  }, [updateWorld, updateMeta, showToast, soundMuted, completeQuest]);

  const handleAddProp = useCallback((x, y, z, type, rot) => {
    if (Math.abs(x) > worldRadius || Math.abs(z) > worldRadius || y < -4 || y > 16) return;
    if (isCellOccupied(world.blocks, world.props, x, y, z, playerPosRef.current)) return showToast('다른 브릭이나 가구와 겹칩니다.');
    if (!creativeMode) {
      const owned = meta.props[type] || 0;
      if (owned <= 0) return showToast('보유한 아이템이 없습니다! 🔨 제작대에서 만들어 주세요.');
      updateMeta((prev) => ({ ...prev, props: { ...prev.props, [type]: owned - 1 } }));
    }
    const nextProps = [...world.props, { id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, type, x, y, z, rot, open: false }];
    updateWorld((prev) => ({ ...prev, props: nextProps }));
    playSfx('place', soundMuted);
    const roomNotice = detectRoomAt(world.blocks, nextProps, x, y, z);
    if (roomNotice) { playSfx('fanfare', soundMuted); showToast(roomNotice); }
  }, [world.blocks, world.props, worldRadius, creativeMode, meta.props, updateWorld, updateMeta, showToast, soundMuted]);

  const handleToggleDoor = useCallback((id) => { updateWorld((prev) => ({ ...prev, props: prev.props.map((p) => (p.id === id ? { ...p, open: !p.open } : p)) })); playSfx('door', soundMuted); }, [updateWorld, soundMuted]);
  const handleRemoveProp = useCallback((id) => { updateWorld((prev) => ({ ...prev, props: prev.props.filter((p) => p.id !== id) })); playSfx('break', soundMuted); }, [updateWorld, soundMuted]);
  const handleRemoveCrop = useCallback((id) => { updateWorld((prev) => ({ ...prev, crops: prev.crops.filter((c) => c.id !== id) })); playSfx('break', soundMuted); }, [updateWorld, soundMuted]);
  const handleAddAnimal = useCallback((x, z, type) => { updateWorld((prev) => ({ ...prev, animals: [...prev.animals, { id: `ani_${Date.now()}`, type, x, z, level: 1 }] })); playAnimalSfx(type, soundMuted); }, [updateWorld, soundMuted]);
  const handlePetAnimal = useCallback((animal, aMeta) => {
    const nextLv = Math.min(5, (animal.level || 1) + 1);
    updateWorld((prev) => ({ ...prev, animals: prev.animals.map((a) => (a.id === animal.id ? { ...a, level: nextLv } : a)) }));
    updateMeta((prev) => ({ ...prev, hearts: prev.hearts + aMeta.heartReward }));
    playAnimalSfx(animal.type, soundMuted);
    showToast(`${aMeta.sound} ${aMeta.msg} (Lv.${nextLv} · ❤️+${aMeta.heartReward})`);
    completeQuest('q_pet');
  }, [updateWorld, updateMeta, showToast, soundMuted, completeQuest]);
  const handleRemoveAnimal = useCallback((id) => { updateWorld((prev) => ({ ...prev, animals: prev.animals.filter((a) => a.id !== id) })); playSfx('break', soundMuted); }, [updateWorld, soundMuted]);
  const handleAddNpc = useCallback((x, y, z, type, rot) => { updateWorld((prev) => ({ ...prev, npcs: [...prev.npcs, { id: `npc_${Date.now()}`, type, x, y, z, rot, roam: true }] })); playSfx('place', soundMuted); }, [updateWorld, soundMuted]);
  const handleRemoveNpc = useCallback((id) => { updateWorld((prev) => ({ ...prev, npcs: prev.npcs.filter((n) => n.id !== id) })); playSfx('break', soundMuted); }, [updateWorld, soundMuted]);

  const handleOpenChest = useCallback((chest) => {
    if (meta.openedChests[chest.id]) return;
    updateMeta((prev) => {
      const nextMats = { ...prev.materials };
      Object.entries(chest.reward || {}).forEach(([k, v]) => { nextMats[k] = (nextMats[k] || 0) + v; });
      return { ...prev, hearts: prev.hearts + (chest.hearts || 25), materials: nextMats, openedChests: { ...prev.openedChests, [chest.id]: true } };
    });
    playSfx('fanfare', soundMuted);
    showToast(`🎁 [${chest.label}] 발견! ❤️ +${chest.hearts}`);
  }, [meta.openedChests, updateMeta, showToast, soundMuted]);

  const handleCraftItem = (propItem) => {
    const recipe = propItem.recipe || {};
    for (const [mat, need] of Object.entries(recipe)) {
      if ((meta.materials[mat] || 0) < need) return showToast(`${MATERIAL_META[mat]?.label || mat} 재료가 부족합니다!`);
    }
    updateMeta((prev) => {
      const nextMats = { ...prev.materials };
      Object.entries(recipe).forEach(([m, n]) => { nextMats[m] -= n; });
      return { ...prev, materials: nextMats, props: { ...prev.props, [propItem.id]: (prev.props[propItem.id] || 0) + 1 } };
    });
    playSfx('fanfare', soundMuted);
    showToast(`🔨 [${propItem.label}] 제작 완료!`);
  };

  const handleSwitchBiome = (biomeId) => {
    updateWorld({ ...generateBiomeWorld(biomeId, worldRadius), customParts: [] }, true);
    setShowBiomeModal(false);
    playSfx('fanfare', soundMuted);
    showToast(`🌍 [${biomeId === 'meadow' ? '레고 초원 마을' : biomeId === 'desert' ? '레고 사막 오아시스' : '레고 설원 마을'}] 이동!`);
  };

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('metaverse_skygarden_7f', { config: { presence: { key: clientIdRef.current } } });
    channelRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState(), peers = [];
      Object.keys(state).forEach((k) => { if (k !== clientIdRef.current && state[k]?.length) peers.push(state[k][state[k].length - 1]); });
      setRemotePeers(peers);
    })
      .on('broadcast', { event: 'openworld_sync_7f' }, ({ payload }) => { if (payload && payload.sender !== clientIdRef.current && payload.world) setWorld(payload.world); })
      .subscribe((s) => { if (s === 'SUBSCRIBED') { const [px, py, pz] = playerPosRef.current; ch.track({ clientId: clientIdRef.current, name: playerName, x: px, y: py, z: pz, avatar: avatarConfig }); } });
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [playerName, avatarConfig]);

  const handleSyncPos = useCallback((x, y, z) => {
    const now = Date.now();
    if (now - lastSyncRef.current < 220 || !channelRef.current) return;
    lastSyncRef.current = now;
    channelRef.current.track({ clientId: clientIdRef.current, name: playerName, x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), avatar: avatarConfig }).catch(() => {});
  }, [playerName, avatarConfig]);

  const stopUiEvent = (e) => e.stopPropagation();
  const filteredBlocks = blockCat === '전체' ? BLOCK_CATALOG : BLOCK_CATALOG.filter((b) => b.cat === blockCat);
  const villageLevel = Math.floor(meta.hearts / 50) + 1;
  const isNight = timeOfDay === 'night';
  const bgHex = isNight ? '#0B1324' : timeOfDay === 'sunset' ? '#D48C5E' : world.biome === 'snow' ? '#B5D2E8' : world.biome === 'desert' ? '#D9C088' : '#7BC4EC';

  return (
    <div translate="no" style={{ backgroundColor: bgHex }} className="notranslate w-full h-full relative overflow-hidden select-none font-sans">
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-amber-400/60 text-amber-200 text-xs font-black shadow-2xl pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* 1. 슬림 상단 HUD */}
      <header onPointerDown={stopUiEvent} onTouchStart={stopUiEvent} className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto">
          <button type="button" onClick={() => (onExitHome ? onExitHome() : setActiveScreen && setActiveScreen('home'))} className="h-8 px-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs font-black cursor-pointer">◀ 7F LEGO</button>
          <button type="button" onClick={() => setShowQuestModal(true)} className="h-8 px-2.5 rounded-xl bg-amber-500 text-stone-950 text-[11px] font-black shadow-md cursor-pointer">Lv.{villageLevel} · ❤️{meta.hearts}</button>
          <button type="button" onClick={toggleBandPlay} className={`h-8 px-2 rounded-xl text-[11px] font-black cursor-pointer border ${isBandPlaying ? 'bg-pink-500 border-pink-300 text-white animate-pulse' : 'bg-slate-900/90 border-white/15 text-pink-300'}`}>🎵</button>
          <button type="button" onClick={() => setSoundMuted((m) => !m)} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-[11px] cursor-pointer">{soundMuted ? '🔇' : '🔊'}</button>
          {isSwimming && <span className="h-8 px-2 rounded-xl bg-sky-500 text-white text-[11px] font-black flex items-center">🏊</span>}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <button type="button" onClick={handleExpandWorld} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-emerald-400/40 text-emerald-300 text-[11px] font-black cursor-pointer">🗺️ 확장</button>
          <button type="button" onClick={() => { const next = camPreset === 'behind' ? 'wide' : 'behind'; setCamPreset(next); camCommandRef.current = { type: next }; }} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-sky-400/40 text-sky-300 text-[11px] font-black cursor-pointer">🎥</button>
          <button type="button" onClick={() => setShowCraftModal(true)} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-300 text-[11px] font-black cursor-pointer">🔨</button>
          <button type="button" onClick={() => setShowBiomeModal(true)} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-emerald-400/40 text-emerald-300 text-[11px] font-black cursor-pointer">🌍</button>
          <button type="button" onClick={() => setTimeOfDay((p) => (p === 'day' ? 'sunset' : p === 'sunset' ? 'night' : 'day'))} className="h-8 px-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-[11px] cursor-pointer">{timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}</button>
          <button type="button" onClick={() => setShowFloorModal(true)} className="h-8 px-2 rounded-xl bg-emerald-500 text-stone-950 text-[11px] font-black cursor-pointer">🛗</button>
        </div>
      </header>

      {/* 우측 줌 버튼 */}
      <div onPointerDown={stopUiEvent} onTouchStart={stopUiEvent} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button type="button" onClick={() => { camCommandRef.current = { type: 'zoom', factor: 0.78 }; }} className="w-9 h-9 rounded-xl bg-slate-900/85 border border-white/20 text-white font-black text-base shadow-lg cursor-pointer">＋</button>
        <button type="button" onClick={() => { camCommandRef.current = { type: 'zoom', factor: 1.28 }; }} className="w-9 h-9 rounded-xl bg-slate-900/85 border border-white/20 text-white font-black text-base shadow-lg cursor-pointer">－</button>
      </div>

      {/* 2. 하단 8단 레고 브릭 조립 독 */}
      <div onPointerDown={stopUiEvent} onPointerMove={stopUiEvent} onTouchStart={stopUiEvent} onTouchMove={stopUiEvent} onWheel={stopUiEvent} className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96vw] max-w-[680px] flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <div className="p-1 rounded-2xl bg-slate-950/92 border border-white/15 backdrop-blur-md flex items-center gap-0.5 overflow-x-auto hide-scrollbar touch-pan-x shadow-xl">
            {[
              { id: 'walk', label: '🚶 이동' }, { id: 'build', label: '🧱 레고조립' }, { id: 'prop', label: '🪑 아이템' },
              { id: 'farm', label: '🌾 농사' }, { id: 'water', label: '🪣 물주기' }, { id: 'animal', label: '🐑 동물' },
              { id: 'npc', label: '👥 피겨' }, { id: 'break', label: '⛏️ 분해' }
            ].map((m) => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap cursor-pointer shrink-0 ${mode === m.id ? (m.id === 'break' ? 'bg-rose-500 text-white' : m.id === 'build' ? 'bg-amber-400 text-stone-950' : m.id === 'water' || m.id === 'walk' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-stone-950') : 'text-slate-300'}`}>
                {m.label}
              </button>
            ))}
          </div>
          {(mode === 'build' || mode === 'prop' || mode === 'npc') && (
            <button type="button" onClick={() => setPropRot((r) => (r + Math.PI / 2) % (Math.PI * 2))} className="px-2.5 py-2 rounded-xl bg-amber-500 text-stone-950 text-[11px] font-black shadow-lg cursor-pointer">🔄 {Math.round((propRot * 180) / Math.PI)}°</button>
          )}
        </div>

        {/* 레고 브릭 파츠 형태 + 색상/재질 듀얼 선택기 */}
        {mode === 'build' && (
          <div className="p-2 rounded-2xl bg-slate-950/94 border border-amber-400/45 backdrop-blur-md space-y-1.5 shadow-2xl">
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x">
              {LEGO_PART_SHAPES.map((sp) => (
                <button key={sp.id} type="button" onClick={() => setSelectedPartShape(sp.id)} className={`px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap cursor-pointer border shrink-0 ${selectedPartShape === sp.id ? 'bg-amber-400 border-white text-stone-950' : 'bg-white/10 border-white/10 text-slate-200'}`}>
                  {sp.icon} {sp.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x">
              {['전체', '지형', '광석', '벽체', '바닥', '특수'].map((cat) => (
                <button key={cat} type="button" onClick={() => setBlockCat(cat)} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer shrink-0 ${blockCat === cat ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50' : 'text-slate-400'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x">
              {filteredBlocks.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedBlock(item.id)} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer border shrink-0 ${selectedBlock === item.id ? 'bg-emerald-500 border-emerald-300 text-stone-950 font-black' : 'bg-white/10 border-white/10 text-white'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'prop' && (
          <div className="p-1.5 rounded-2xl bg-slate-950/94 border border-emerald-400/40 flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x shadow-2xl">
            {PROP_CATALOG.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedProp(item.id)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer border shrink-0 ${selectedProp === item.id ? 'bg-emerald-500 border-emerald-300 text-stone-950 font-black' : 'bg-white/10 border-white/10 text-white'}`}>{item.icon} {item.label}</button>
            ))}
          </div>
        )}

        {mode === 'farm' && (
          <div className="p-1.5 rounded-2xl bg-slate-950/94 border border-lime-400/40 flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x shadow-2xl">
            {CROP_CATALOG.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedCrop(item.id)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer border shrink-0 ${selectedCrop === item.id ? 'bg-lime-400 border-lime-200 text-stone-950 font-black' : 'bg-white/10 border-white/10 text-white'}`}>{item.icon} {item.label}</button>
            ))}
          </div>
        )}

        {mode === 'animal' && (
          <div className="p-1.5 rounded-2xl bg-slate-950/94 border border-amber-400/40 flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x shadow-2xl">
            {ANIMAL_CATALOG.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedAnimal(item.id)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer border shrink-0 ${selectedAnimal === item.id ? 'bg-amber-400 border-amber-200 text-stone-950 font-black' : 'bg-white/10 border-white/10 text-white'}`}>{item.icon} {item.label}</button>
            ))}
          </div>
        )}

        {mode === 'npc' && (
          <div className="p-1.5 rounded-2xl bg-slate-950/94 border border-amber-400/40 flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x shadow-2xl">
            {NPC_CATALOG.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedNpcType(item.id)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer border shrink-0 ${selectedNpcType === item.id ? 'bg-amber-500 border-amber-300 text-stone-950 font-black' : 'bg-white/10 border-white/10 text-white'}`}>{item.icon} {item.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* 3. 360° 아날로그 조이스틱 & 점프 버튼 */}
      {mode === 'walk' && (
        <>
          <AnalogJoystick joyVecRef={joyVecRef} />
          <button type="button" onPointerDown={(e) => { e.stopPropagation(); jumpReqRef.current = true; }} className="absolute bottom-20 right-4 z-20 px-4 py-3 rounded-2xl bg-amber-400 border border-white/40 text-stone-950 font-black text-xs shadow-xl cursor-pointer active:scale-95">
            ⬆️ 점프
          </button>
        </>
      )}

      {/* 4. 메인 3D 레고 월드 캔버스 */}
      <Canvas
        shadows
        dpr={isMobile ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: isNight ? 0.78 : 1.05 }}
      >
        <color attach="background" args={[bgHex]} />
        <fog attach="fog" args={[bgHex, 30, 88]} />
        {!isNight && <Sky sunPosition={timeOfDay === 'sunset' ? [-20, 4, 15] : [-15, 22, 18]} inclination={0.48} azimuth={0.25} />}

        <PerspectiveCamera makeDefault position={[2, 4.9, 11.2]} fov={46} near={0.1} far={180} />
        <CameraActionBridge controlsRef={controlsRef} playerPosRef={playerPosRef} playerRotRef={playerRotRef} camCommandRef={camCommandRef} />

        <ambientLight intensity={isNight ? 0.28 : 0.88} color={isNight ? '#64748B' : '#FFFFFF'} />
        <hemisphereLight args={[isNight ? '#1E293B' : '#FFFDF7', '#94A3B8', isNight ? 0.25 : 0.65]} />
        <directionalLight position={[-14, 24, 16]} intensity={isNight ? 0.25 : 1.32} color={timeOfDay === 'sunset' ? '#F59E0B' : '#FFF8EB'} castShadow shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]} shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-bias={-0.0006} />

        <AmbientWorldDetails biome={world.biome} isNight={isNight} />

        <VoxelWorldMesh
          blockMap={world.blocks}
          mode={mode}
          isInsideChapel={isInsideChapel}
          selectedBlock={selectedBlock}
          selectedPartShape={selectedPartShape}
          selectedProp={selectedProp}
          selectedCrop={selectedCrop}
          selectedAnimal={selectedAnimal}
          selectedNpcType={selectedNpcType}
          propRot={propRot}
          onAddLegoStructure={handleAddLegoStructure}
          onMineBlock={handleMineBlock}
          onAddProp={handleAddProp}
          onPlantCrop={handlePlantCrop}
          onWaterSoil={handleWaterSoil}
          onAddAnimal={handleAddAnimal}
          onAddNpc={handleAddNpc}
          onWalkTo={(x, z) => setWalkTarget([x, z])}
        />

        {/* ★ 전 지형·건물 자동 2×2 레고 스터드(단일 드로우콜) + 커스텀 레고 파츠 + 파편 파티클 */}
        <LegoWorldStuds blockMap={world.blocks} />
        {(world.customParts || []).map((pt) => <CustomLegoPart3D key={pt.id} part={pt} mode={mode} isNight={isNight} onRemove={handleRemoveCustomPart} />)}
        <BrickBurstParticles bursts={bursts} />

        {(world.props || []).map((p) => <WorldProp3D key={p.id} prop={p} propsList={world.props || []} mode={mode} isNight={isNight} onToggleDoor={handleToggleDoor} onRemoveProp={handleRemoveProp} />)}
        {(world.crops || []).map((c) => <GrowingCrop3D key={c.id} crop={c} nowTs={nowTs} mode={mode} onWaterCrop={handleWaterCrop} onHarvest={handleHarvestCrop} onRemove={handleRemoveCrop} />)}
        {(world.animals || []).map((a) => <RoamingAnimal3D key={a.id} animal={a} blockMap={world.blocks} mode={mode} onPet={handlePetAnimal} onRemove={handleRemoveAnimal} />)}
        {(world.fish || []).map((f) => <SwimmingFish3D key={f.id} fish={f} />)}
        {(world.chests || []).map((ch) => <TreasureChest3D key={ch.id} chest={ch} opened={Boolean(meta.openedChests[ch.id])} onOpen={handleOpenChest} />)}
        {(world.npcs || []).map((n) => <AutonomousNpcAvatar key={n.id} npc={n} blockMap={world.blocks} mode={mode} isBandPlaying={isBandPlaying} onSelectNpc={setSelectedNpcDialog} onRemoveNpc={handleRemoveNpc} />)}

        <PlayerRig
          blockMap={world.blocks}
          propsList={world.props || []}
          worldRadius={worldRadius}
          walkTarget={walkTarget}
          clearWalkTarget={() => setWalkTarget(null)}
          joyVecRef={joyVecRef}
          jumpReqRef={jumpReqRef}
          playerPosRef={playerPosRef}
          playerRotRef={playerRotRef}
          playerName={playerName}
          avatarConfig={avatarConfig}
          controlsRef={controlsRef}
          soundMuted={soundMuted}
          onSwimChange={setIsSwimming}
          onInsideChapelChange={setIsInsideChapel}
          onSyncPos={handleSyncPos}
        />

        {remotePeers.map((peer) => (
          <SharedChibiAvatar key={peer.clientId} position={[peer.x || 0, peer.y || 0.5, peer.z || 0]} shirtColor={peer.avatar?.shirtColor || '#38BDF8'} pantsColor={peer.avatar?.pantsColor || '#1E293B'} hairColor={peer.avatar?.hairColor || '#27272A'} />
        ))}
        <OrbitControls ref={controlsRef} target={[2, 1.4, 5]} enableRotate={true} enablePan={true} enableZoom={true} enableDamping={true} dampingFactor={0.08} minDistance={2.5} maxDistance={52} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>

      {/* 5~9. 제작대 · 퀘스트 · 바이옴 · NPC · 층 이동 모달 */}
      {showCraftModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setShowCraftModal(false)}>
          <div className="w-full max-w-md bg-[#111827] border border-amber-400/40 text-white rounded-3xl p-5 space-y-3 shadow-2xl max-h-[84vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div><span className="text-[10.5px] font-bold text-amber-400 block">LEGO 빌리지 제작대</span><h3 className="text-base font-black">🔨 재료 조합 & 아이템 제작</h3></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCreativeMode((v) => !v)} className="px-2 py-1 rounded-lg bg-white/10 text-[10.5px] font-bold text-emerald-300 cursor-pointer">{creativeMode ? '자유모드 ON' : '채집모드 ON'}</button>
                <button type="button" onClick={() => setShowCraftModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
              {Object.entries(MATERIAL_META).map(([k, m]) => (
                <span key={k} className="px-2 py-1 rounded-lg bg-slate-900 text-[11px] font-bold">{m.icon} {m.label} <b className="text-amber-300">{meta.materials[k] || 0}</b></span>
              ))}
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 hide-scrollbar">
              {PROP_CATALOG.map((item) => {
                const entries = Object.entries(item.recipe || {});
                const ok = entries.every(([m, n]) => (meta.materials[m] || 0) >= n);
                return (
                  <div key={item.id} className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black">{item.icon} {item.label} <span className="text-emerald-400 text-[10.5px]">(보유 {meta.props[item.id] || 0})</span></div>
                      <div className="text-[10.5px] text-zinc-400">{entries.map(([m, n]) => `${MATERIAL_META[m]?.icon || ''}${MATERIAL_META[m]?.label || m}×${n}`).join(' + ')}</div>
                    </div>
                    <button type="button" onClick={() => handleCraftItem(item)} disabled={!ok} className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer ${ok ? 'bg-amber-500 text-stone-950' : 'bg-white/10 text-zinc-500'}`}>제작</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showQuestModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setShowQuestModal(false)}>
          <div className="w-full max-w-md bg-[#111827] border border-amber-400/40 text-white rounded-3xl p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div><span className="text-[10.5px] font-bold text-amber-400 block">LEGO 좋은나무 빌리지 성장</span><h3 className="text-base font-black">마을 Lv.{villageLevel} · ❤️ {meta.hearts}</h3></div>
              <button type="button" onClick={() => setShowQuestModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <div className="space-y-2">
              {VILLAGE_QUESTS.map((q) => {
                const done = Boolean(meta.quests[q.id]);
                return (
                  <div key={q.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${done ? 'bg-emerald-950/50 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>
                    <div><div className={`text-xs font-bold ${done ? 'text-emerald-300 line-through' : 'text-white'}`}>{q.title}</div><div className="text-[11px] text-zinc-400">{q.desc}</div></div>
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 ${done ? 'bg-emerald-500 text-stone-950' : 'bg-amber-500/20 text-amber-300'}`}>{done ? '완료 ✓' : `❤️+${q.reward}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showBiomeModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setShowBiomeModal(false)}>
          <div className="w-full max-w-sm bg-[#111827] border border-emerald-400/40 text-white rounded-3xl p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5"><span className="text-sm font-black">🌍 레고 바이옴 탐험</span><button type="button" onClick={() => setShowBiomeModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button></div>
            {[
              { id: 'meadow', label: '🌿 레고 초원 고원 & 비밀 동굴', desc: '동굴 터널 · 지하 광맥 · 물레방아 · 7종 동물' },
              { id: 'desert', label: '🏜️ 레고 사막 오아시스', desc: '사막여우 · 황금 모래언덕 · 지하 광맥' },
              { id: 'snow', label: '❄️ 레고 설원 얼음호수', desc: '펭귄 · 북극곰 · 하얀 설원 예배당' }
            ].map((b) => (
              <button key={b.id} type="button" onClick={() => handleSwitchBiome(b.id)} className={`w-full p-3 rounded-2xl border text-left cursor-pointer ${world.biome === b.id ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="text-xs font-black">{b.label}</div><div className="text-[11px] text-zinc-400">{b.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedNpcDialog && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedNpcDialog(null)}>
          <div className="w-full max-w-sm bg-[#111827] border border-amber-400/40 text-white rounded-3xl p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div><span className="text-[10.5px] font-bold text-amber-400 block">{selectedNpcDialog.role}</span><h3 className="text-base font-black">{selectedNpcDialog.icon} {selectedNpcDialog.label}</h3></div>
              <button type="button" onClick={() => setSelectedNpcDialog(null)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button>
            </div>
            <p className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs leading-relaxed text-amber-100">"{selectedNpcDialog.msg}"</p>
          </div>
        </div>
      )}

      {showFloorModal && onChangeFloor && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setShowFloorModal(false)}>
          <div className="w-full max-w-xs bg-[#111827] border border-white/20 text-white rounded-3xl p-5 space-y-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10"><span className="text-sm font-black">좋은나무교회 층 이동</span><button type="button" onClick={() => setShowFloorModal(false)} className="text-xs text-zinc-400 cursor-pointer">✕ 닫기</button></div>
            {[
              { fl: '1F', label: '1F LEGO 메인 로비' }, { fl: '2F', label: '2F 북카페 · 목양실 · 사무실' },
              { fl: '3F', label: '3F LEGO 대예배당 본당' }, { fl: '4F', label: '4F 영유아 예배실' },
              { fl: '5F', label: '5F 소예배 · 찬양홀' }, { fl: '6F', label: '6F 다음세대 교육관' },
              { fl: '7F', label: '7F LEGO 좋은나무 브릭월드 (현재)' }
            ].map((item) => (
              <button key={item.fl} type="button" onClick={() => { setShowFloorModal(false); onChangeFloor(item.fl); }} className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer">
                <span>{item.label}</span><span>이동 ➔</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
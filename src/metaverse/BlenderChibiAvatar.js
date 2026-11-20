// src/metaverse/BlenderChibiAvatar.js
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Billboard } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

const MODEL_PATH = '/models/chibi_base.glb';

function makeSpeechBubbleTexture(text) {
  if (!text) return null;
  const colonIdx = text.indexOf(':');
  const speakerName = colonIdx > -1 ? text.slice(0, colonIdx).trim() : '';
  const bodyText = colonIdx > -1 ? text.slice(colonIdx + 1).trim() : text;

  const words = bodyText.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const cand = current ? `${current} ${word}` : word;
    if (cand.length > 19) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = cand;
    }
  });
  if (current) lines.push(current);

  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 175;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 540, 175);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.beginPath();
  ctx.roundRect(14, 10, 512, 141, 28);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#3B82F6';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(256, 151);
  ctx.lineTo(284, 151);
  ctx.lineTo(270, 171);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  let startY = speakerName ? 44 : 54;
  if (speakerName) {
    ctx.fillStyle = '#2563EB';
    ctx.font = '900 22px sans-serif';
    ctx.fillText(speakerName, 270, startY);
    startY += 32;
  }

  ctx.fillStyle = '#0F172A';
  ctx.font = '800 24px sans-serif';
  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, 270, startY + idx * 30);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function BlenderChibiAvatar({
  position = [0, 0, 0],
  targetPosition = null,
  patrolZ = null,
  patrolX = null,
  rotationY = 0,
  isWalking = false,
  isSeated = false,
  isPraiseTeam = false,
  isPastor = false,
  isDrummer = false,
  isPianist = false,
  gender = 'male',
  hairStyle = 'short',
  isSkirt = false,
  autoWave = false,
  emote = null,
  shirtColor = '#4F46E5',
  pantsColor = '#1E293B',
  hairColor = '#3B2820',
  skinColor = '#FFE4C4',
  nameTagTexture = null,
  speechBubbleText = null,
  onClick = null,
  seedOffset = 0,
  scale = 0.78
}) {
  const outerRef = useRef();
  const modelRef = useRef();

  const { scene, animations } = useGLTF(MODEL_PATH);

  // 아바타마다 독립된 본(Skeleton)과 머티리얼을 갖도록 복제
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  const { actions } = useAnimations(animations, modelRef);

  const patrolState = useRef({
    coord: patrolX ? position[0] : position[2],
    dir: 1,
    pauseTimer: 0
  });

  // 헤어 파츠 토글 + 치마 토글 + 옷/머리/피부 색상 적용
  useEffect(() => {
    const isFemale = gender === 'female' || isSkirt;
    const activeHairName =
      hairStyle === 'bob'
        ? 'Hair_Bob'
        : hairStyle === 'long_wave' || hairStyle === 'long'
        ? 'Hair_Long'
        : hairStyle === 'bun'
        ? 'Hair_Bun'
        : 'Hair_Short';

    clonedScene.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name.startsWith('Hair_')) {
        child.visible = child.name === activeHairName;
      }
      if (child.name === 'Bottom_Skirt') {
        child.visible = isFemale;
      }

      const matName = child.material?.name || '';
      if (matName.startsWith('Mat_Shirt')) {
        child.material.color.set(shirtColor);
      } else if (matName.startsWith('Mat_Pants')) {
        child.material.color.set(pantsColor);
      } else if (matName.startsWith('Mat_Hair')) {
        child.material.color.set(hairColor);
      } else if (matName.startsWith('Mat_Skin')) {
        child.material.color.set(skinColor);
      }
    });
  }, [clonedScene, gender, hairStyle, isSkirt, shirtColor, pantsColor, hairColor, skinColor]);

  // 현재 상태에 맞는 블렌더 NLA 모션(Idle / Walk / Sit / Wave / Pray) 재생
  const targetAnimName = useMemo(() => {
    if (emote === 'pray' || emote === 'bless') return 'Pray';
    if (emote === 'wave' || emote === 'praise' || emote === 'dance' || autoWave || isPraiseTeam || isPastor) {
      return 'Wave';
    }
    if (isSeated || isDrummer || isPianist) return 'Sit';
    if (isWalking) return 'Walk';
    return 'Idle';
  }, [emote, autoWave, isPraiseTeam, isPastor, isSeated, isDrummer, isPianist, isWalking]);

  useEffect(() => {
    if (!actions) return;
    const nextAction = actions[targetAnimName] || actions['Idle'] || Object.values(actions)[0];
    if (!nextAction) return;

    Object.values(actions).forEach((act) => {
      if (act && act !== nextAction) act.fadeOut(0.2);
    });
    nextAction.reset().fadeIn(0.2).play();
  }, [actions, targetAnimName]);

  // 이동 / 순찰 / 찬양 흔들림 프레임 업데이트
  useFrame(({ clock }, delta) => {
    if (!outerRef.current) return;
    const t = clock.elapsedTime + seedOffset;

    if (targetPosition) {
      const curX = outerRef.current.position.x;
      const curZ = outerRef.current.position.z;
      const dist = Math.hypot(targetPosition[0] - curX, targetPosition[2] - curZ);
      if (dist > 0.03) {
        outerRef.current.position.x = THREE.MathUtils.lerp(curX, targetPosition[0], delta * 7.5);
        outerRef.current.position.z = THREE.MathUtils.lerp(curZ, targetPosition[2], delta * 7.5);
      }
      outerRef.current.rotation.y = THREE.MathUtils.lerp(outerRef.current.rotation.y, rotationY, delta * 8.0);
    } else if (patrolZ || patrolX) {
      const bounds = patrolX || patrolZ;
      const st = patrolState.current;
      if (st.pauseTimer > 0) {
        st.pauseTimer -= delta;
      } else {
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
          outerRef.current.position.x = st.coord;
          outerRef.current.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          outerRef.current.position.z = st.coord;
          outerRef.current.rotation.y = st.dir > 0 ? 0.15 : Math.PI - 0.15;
        }
      }
    }

    if (isPraiseTeam) {
      outerRef.current.position.x = position[0] + Math.sin(t * 2.8) * 0.05;
    }
  });

  const bubbleTex = useMemo(() => makeSpeechBubbleTexture(speechBubbleText), [speechBubbleText]);

  return (
    <group
      ref={outerRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={onClick}
    >
      {/* 바닥 그림자 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.26, 24]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.2} />
      </mesh>

      {/* 블렌더 GLB 치비 모델 (블렌더 정면 -Y -> Three.js 정면 +Z 맞춤 회전) */}
      <group ref={modelRef} scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} />
      </group>

      {nameTagTexture && (
        <Billboard position={[0, 1.32, 0]}>
          <mesh renderOrder={12}>
            <planeGeometry args={[1.55, 0.34]} />
            <meshBasicMaterial map={nameTagTexture} transparent depthTest={false} />
          </mesh>
        </Billboard>
      )}

      {bubbleTex && (
        <Billboard position={[0, 1.66, 0]}>
          <mesh renderOrder={15}>
            <planeGeometry args={[1.82, 0.59]} />
            <meshBasicMaterial map={bubbleTex} transparent depthTest={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
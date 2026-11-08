// src/metaverse/StairwellCore3D.js
import React from 'react';
import { RoundedBox } from '@react-three/drei';

export default function StairwellCore3D({
  position = [-3.0, 0, -3.2],
  onClickStairs,
  onClickExtinguisher
}) {
  return (
    <group position={position}>
      {/* 1. 계단참 화강암 바닥 & 검은색 걸레받이 몰딩 */}
      <RoundedBox args={[2.4, 0.1, 2.4]} position={[0, -0.05, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#D1D5DB" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.06, 0.12, 2.4]} position={[-1.16, 0.06, 0]} radius={0.01}>
        <meshStandardMaterial color="#18181B" />
      </RoundedBox>
      <RoundedBox args={[2.4, 0.12, 0.06]} position={[0, 0.06, 1.16]} radius={0.01}>
        <meshStandardMaterial color="#18181B" />
      </RoundedBox>

      {/* 2. 투톤 화강암 계단 7단 */}
      {Array.from({ length: 7 }).map((_, idx) => {
        const sz = -0.6 - idx * 0.28;
        const sy = idx * 0.16;
        return (
          <group
            key={idx}
            position={[0, sy, sz]}
            onClick={(e) => {
              e.stopPropagation();
              if (onClickStairs) onClickStairs();
            }}
          >
            <RoundedBox args={[1.75, 0.16, 0.04]} position={[0, 0.08, 0.12]} radius={0.01} castShadow>
              <meshStandardMaterial color="#111827" roughness={0.25} />
            </RoundedBox>
            <RoundedBox args={[1.8, 0.04, 0.3]} position={[0, 0.16, 0]} radius={0.015} receiveShadow castShadow>
              <meshStandardMaterial color="#CBD5E1" roughness={0.45} />
            </RoundedBox>
            <mesh position={[0, 0.182, 0.1]}>
              <boxGeometry args={[1.7, 0.006, 0.035]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
          </group>
        );
      })}

      {/* 우측 베이지색 철제 난간 & 갈색 핸드레일 */}
      {Array.from({ length: 6 }).map((_, rIdx) => (
        <mesh key={rIdx} position={[0.84, 0.45 + rIdx * 0.16, -0.6 - rIdx * 0.28]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.75, 12]} />
          <meshStandardMaterial color="#E5DEC9" />
        </mesh>
      ))}
      <RoundedBox
        args={[0.07, 0.07, 2.0]}
        position={[0.84, 1.25, -1.35]}
        rotation={[0.5, 0, 0]}
        radius={0.025}
        castShadow
      >
        <meshStandardMaterial color="#5C2D16" roughness={0.35} />
      </RoundedBox>

      {/* 3. 계단참 코너 블랙 프레임 격자 통유리창 */}
      <group position={[0.1, 1.9, -2.55]}>
        <mesh>
          <boxGeometry args={[1.85, 2.1, 0.04]} />
          <meshStandardMaterial color="#7DD3FC" transparent opacity={0.45} roughness={0.1} />
        </mesh>
        {[-0.85, -0.28, 0.28, 0.85].map((fx, i) => (
          <mesh key={`v_${i}`} position={[fx, 0, 0.02]}>
            <boxGeometry args={[0.05, 2.12, 0.06]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
        ))}
        {[-0.95, -0.3, 0.35, 0.95].map((fy, i) => (
          <mesh key={`h_${i}`} position={[0, fy, 0.02]}>
            <boxGeometry args={[1.88, 0.05, 0.06]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
        ))}
      </group>

      {/* 4. 좌측 벽 세로형 슬릿 채광창 */}
      <RoundedBox args={[0.14, 2.6, 2.8]} position={[-1.18, 1.3, -0.2]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" roughness={0.85} />
      </RoundedBox>
      <group position={[-1.1, 1.55, -0.9]}>
        <mesh>
          <boxGeometry args={[0.05, 1.45, 0.42]} />
          <meshStandardMaterial color="#7DD3FC" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.02, -0.35, 0]}>
          <boxGeometry args={[0.07, 0.05, 0.44]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
      </group>

      {/* 5. 벽면 매립 스테인리스 단자함 2개 (LP-6 & IDF 단자함) */}
      <RoundedBox args={[2.2, 2.6, 0.14]} position={[0, 1.3, 1.22]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.9, 0.04]} position={[0.45, 1.38, 1.14]} radius={0.01}>
        <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.62, 0.04]} position={[-0.25, 1.25, 1.14]} radius={0.01}>
        <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* 6. 코너 빨간 소화기 + 빨간 받침대 + 노란 라벨 */}
      <group
        position={[-0.88, 0, 0.88]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickExtinguisher) onClickExtinguisher();
        }}
      >
        <RoundedBox args={[0.28, 0.12, 0.28]} position={[0, 0.06, 0]} radius={0.025} castShadow>
          <meshStandardMaterial color="#DC2626" />
        </RoundedBox>
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.44, 20]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.15, 20]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
        <RoundedBox args={[0.06, 0.06, 0.14]} position={[0, 0.56, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" metalness={0.8} />
        </RoundedBox>
      </group>
    </group>
  );
}
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
      {/* 1. 계단참 포세린 화강암 바닥 & 다크 차콜 걸레받이 몰딩 */}
      <RoundedBox args={[2.4, 0.1, 2.4]} position={[0, -0.05, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#D1D5DB" roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.06, 0.12, 2.4]} position={[-1.16, 0.06, 0]} radius={0.01}>
        <meshStandardMaterial color="#18181B" />
      </RoundedBox>
      <RoundedBox args={[2.4, 0.12, 0.06]} position={[0, 0.06, 1.16]} radius={0.01}>
        <meshStandardMaterial color="#18181B" />
      </RoundedBox>

      {/* 2. 투톤 화강암 계단 7단 + 황동 논슬립(Non-slip) 안전 패드 */}
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
            {/* 챌판 (Riser) */}
            <RoundedBox args={[1.75, 0.16, 0.04]} position={[0, 0.08, 0.12]} radius={0.01} castShadow>
              <meshStandardMaterial color="#111827" roughness={0.25} />
            </RoundedBox>
            {/* 디딤판 (Tread) */}
            <RoundedBox args={[1.8, 0.04, 0.3]} position={[0, 0.16, 0]} radius={0.015} receiveShadow castShadow>
              <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
            </RoundedBox>
            {/* 황동 & 다크 논슬립 스트립 2줄 */}
            <mesh position={[0, 0.182, 0.10]}>
              <boxGeometry args={[1.68, 0.006, 0.022]} />
              <meshStandardMaterial color="#D97706" metalness={0.75} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.182, 0.07]}>
              <boxGeometry args={[1.68, 0.006, 0.016]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
          </group>
        );
      })}

      {/* 3. 우측 스테인리스 발루스터 난간 기둥 & 원통형 원목 핸드레일 */}
      {Array.from({ length: 6 }).map((_, rIdx) => (
        <mesh key={rIdx} position={[0.84, 0.45 + rIdx * 0.16, -0.6 - rIdx * 0.28]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.76, 14]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.18} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.065, 0.065, 2.05]}
        position={[0.84, 1.26, -1.35]}
        rotation={[0.5, 0, 0]}
        radius={0.03}
        castShadow
      >
        <meshStandardMaterial color="#5C2D16" roughness={0.3} />
      </RoundedBox>

      {/* 4. 계단참 코너 블랙 알루미늄 프레임 격자 채광 통유리창 */}
      <group position={[0.1, 1.9, -2.55]}>
        <mesh>
          <boxGeometry args={[1.85, 2.1, 0.04]} />
          <meshStandardMaterial
            color="#BAE6FD"
            emissive="#38BDF8"
            emissiveIntensity={0.18}
            transparent
            opacity={0.42}
            roughness={0.08}
          />
        </mesh>
        {[-0.85, -0.28, 0.28, 0.85].map((fx, i) => (
          <mesh key={`v_${i}`} position={[fx, 0, 0.02]}>
            <boxGeometry args={[0.05, 2.12, 0.06]} />
            <meshStandardMaterial color="#18181B" metalness={0.6} />
          </mesh>
        ))}
        {[-0.95, -0.3, 0.35, 0.95].map((fy, i) => (
          <mesh key={`h_${i}`} position={[0, fy, 0.02]}>
            <boxGeometry args={[1.88, 0.05, 0.06]} />
            <meshStandardMaterial color="#18181B" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* 5. 좌측 벽 세로형 슬릿 채광창 & 녹색 LED 비상구 피난유도등 */}
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

      {/* 🟢 녹색 LED 비상구 피난유도등 (EXIT Sign) */}
      <group position={[-1.09, 2.25, 0.35]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[0.38, 0.16, 0.04]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" metalness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.34, 0.12]} />
          <meshStandardMaterial color="#10B981" emissive="#059669" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* 6. 벽면 매립 스테인리스 단자함 2개 (LP-6 분전반 & IDF 통신단자함 + 키홀·명판 디테일) */}
      <RoundedBox args={[2.2, 2.6, 0.14]} position={[0, 1.3, 1.22]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" roughness={0.85} />
      </RoundedBox>
      {/* 우측 LP-6 전력 분전반 */}
      <group position={[0.45, 1.38, 1.14]}>
        <RoundedBox args={[0.56, 0.9, 0.04]} radius={0.01} castShadow>
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.06, 0.01]} position={[0, 0.34, -0.022]} radius={0.003}>
          <meshBasicMaterial color="#1E293B" />
        </RoundedBox>
        <mesh position={[-0.20, 0, -0.022]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>
      {/* 좌측 IDF 통신 단자함 */}
      <group position={[-0.25, 1.25, 1.14]}>
        <RoundedBox args={[0.42, 0.62, 0.04]} radius={0.01} castShadow>
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.14, 0.05, 0.01]} position={[0, 0.22, -0.022]} radius={0.003}>
          <meshBasicMaterial color="#0284C7" />
        </RoundedBox>
      </group>

      {/* 7. 코너 초정밀 빨간 분말소화기 (받침대 + 용기 + 노란 안전핀 + 압력게이지 + 블랙 분사호스) */}
      <group
        position={[-0.88, 0, 0.88]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickExtinguisher) onClickExtinguisher();
        }}
      >
        <RoundedBox args={[0.28, 0.10, 0.28]} position={[0, 0.05, 0]} radius={0.03} castShadow>
          <meshStandardMaterial color="#DC2626" roughness={0.4} />
        </RoundedBox>
        {/* 소화기 봄베 원통 & 상단 돔 */}
        <mesh position={[0, 0.30, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.40, 24]} />
          <meshStandardMaterial color="#EF4444" roughness={0.22} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.50, 0]} castShadow>
          <sphereGeometry args={[0.095, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#EF4444" roughness={0.22} metalness={0.2} />
        </mesh>
        {/* 노란 사용설명서 라벨 띠 */}
        <mesh position={[0, 0.31, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.15, 24]} />
          <meshStandardMaterial color="#FACC15" roughness={0.35} />
        </mesh>
        {/* 크롬 손잡이 레버 & 초록 압력게이지 & 노란 안전핀 링 */}
        <RoundedBox args={[0.04, 0.06, 0.15]} position={[0, 0.61, -0.02]} rotation={[-0.15, 0, 0]} radius={0.01}>
          <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.15} />
        </RoundedBox>
        <mesh position={[0, 0.58, 0.035]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshBasicMaterial color="#22C55E" />
        </mesh>
        {/* 측면 블랙 분사 고무호스 & 노즐 혼 */}
        <mesh position={[0.105, 0.36, 0]} rotation={[0, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.014, 0.022, 0.34, 12]} />
          <meshStandardMaterial color="#18181B" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
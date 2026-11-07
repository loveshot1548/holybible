// src/metaverse/Dining5F.js
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, RoundedBox, Html, ContactShadows } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import StairwellCore3D from './StairwellCore3D';

// =====================================================================
// 📍 5층 실제 사진 기반 6대 인터랙션 체험존(Trigger Zones) 정의
// =====================================================================
const ZONES_5F = [
  {
    id: 'zone_5f_elev',
    code: '01',
    name: '5F 입구 & 분리수거 에코존',
    prompt: '01 5층 안내 & 에코 분리수거함',
    pos: [-2.2, 0, -2.5],
    badge: '5F 입구 · 에코존',
    title: '5F 식당 | 새가족실 | 연습실 입구 & 에코 분리수거함',
    desc: '깨끗한 환경을 가꾸는 좋은나무교회 4구 분리수거함(종이·플라스틱·비닐·일반쓰레기)과 화장실이 위치한 5층 입구 복도입니다.',
    isElevator: true,
    stats: [
      { label: '층별 안내', val: '5F 식당 · 새가족실 · 연습실 · 화장실' },
      { label: '환경 캠페인', val: '깨끗한 환경은 미래를 위한 유산입니다' }
    ]
  },
  {
    id: 'zone_5f_kitchen',
    code: '02',
    name: '만나 조리실 (주방)',
    prompt: '02 만나 조리실 & 애찬 준비실 보기',
    pos: [-2.8, 0, 0.8],
    badge: '만나 주방 · 조리실',
    title: '🍳 사랑과 정성으로 주일 애찬을 준비하는 조리실',
    desc: '대형 스테인리스 싱크대와 업소용 식기세척기, 대형 가스 화구와 환기 후드가 완비된 청결한 주방 공간입니다.',
    stats: [
      { label: '주요 설비', val: '대형 싱크대 · 식기세척기 · 조리 화구' },
      { label: '봉사 안내', val: '주일 애찬 조리 및 설거지 봉사단 운영' }
    ]
  },
  {
    id: 'zone_5f_dining',
    code: '03',
    name: '만나 친교식당 & 새가족 식탁',
    prompt: '03 주일 애찬 메뉴 & 식탁 교제 안내',
    pos: [1.2, 0, 0.8],
    badge: '만나 친교식당',
    title: '🍽️ 전 성도가 식탁의 교제를 나누는 만나 홀',
    desc: '주일 예배 후 성도님들과 새가족이 따뜻한 식사를 나누며 교제하는 넓은 다목적 식당 홀입니다.',
    stats: [
      { label: '애찬 시간', val: '주일 2부 예배 후 (오후 12:30~)' },
      { label: '좌석 구성', val: '화이트 테이블 & 라탄 스툴 다수 완비' }
    ]
  },
  {
    id: 'zone_5f_practice',
    code: '04',
    name: '찬양단 연습실 & 멀티미디어 스테이지',
    prompt: '04 찬양 연습실 & 악기 세팅 확인',
    pos: [0.8, 0, 4.4],
    badge: '찬양 연습실',
    title: '🥁 찬양과 경배가 울려 퍼지는 연습실 스테이지',
    desc: '벽걸이 대형 모니터, 드럼 세트, 신디사이저 건반, PA 스피커와 악보 보면대가 갖춰진 찬양팀 연습 및 소예배 공간입니다.',
    stats: [
      { label: '음향·악기', val: '드럼 · 건반 · PA 스피커 · 대형 TV' },
      { label: '활용 안내', val: '찬양팀 리허설 · 소그룹 세미나 · 새가족 모임' }
    ]
  },
  {
    id: 'zone_5f_extinguisher',
    code: '05',
    name: '유리 파티션 코너 소방설비',
    prompt: '05 파티션 코너 소화기 위치 확인',
    pos: [-1.1, 0, -1.2],
    badge: '소방안전 설비 (유리벽 코너)',
    title: '🧯 식당 유리 파티션 코너 소화기 & 사각 스툴',
    desc: '식당 홀 유리 가벽(좋은나무교회 시트지) 안쪽 코너, 베이지색 사각 플라스틱 스툴 바로 뒤에 비치된 초기 진화용 소화기입니다.',
    stats: [
      { label: '설치 위치', val: '5F 유리 파티션 좌측 하단 모서리' },
      { label: '점검 상태', val: '정상 (압력 게이지 녹색 · 안전핀 완비)' }
    ]
  }
];

// =====================================================================
// 🧱 사진 7장(image_33~39)을 100% 구현한 5층 로우폴리 3D 인테리어
// =====================================================================
function FiveFloorArchitecture({ activeZoneId, onSelectZone }) {
  return (
    <group>
      {/* 1. 메인 홀 다크그레이 데코타일 바닥 & 좌측 주방 밝은 그레이 타일 바닥 */}
      <RoundedBox args={[9.2, 0.1, 12.2]} position={[0, -0.05, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#374151" roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[2.7, 0.11, 4.2]} position={[-3.1, -0.04, 0.8]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#9CA3AF" roughness={0.35} />
      </RoundedBox>

      {/* 화장실 입구 앞 노란 점자블록 (image_34) */}
      <RoundedBox args={[0.85, 0.02, 0.36]} position={[-3.2, 0.015, -3.5]} radius={0.005}>
        <meshStandardMaterial color="#FACC15" />
      </RoundedBox>

      {/* 2. 외벽 & 브라운 웨인스코팅 몰딩 (image_34, 36) */}
      {/* 뒤쪽(남쪽) 찬양 연습실 무대 벽 + 브라운 웨인스코팅 */}
      <RoundedBox args={[7.4, 2.8, 0.18]} position={[0.8, 1.4, 5.9]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F3F2EE" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[7.3, 0.9, 0.06]} position={[0.8, 0.45, 5.78]} radius={0.01}>
        <meshStandardMaterial color="#786655" />
      </RoundedBox>

      {/* 5F 식당|새가족실|연습실 표지판 (image_33) */}
      <Html position={[-1.9, 1.85, -3.8]} center distanceFactor={6}>
        <div className="bg-white border border-slate-300 px-2.5 py-1 rounded shadow-md flex items-center gap-2 whitespace-nowrap">
          <span className="bg-[#0F172A] text-white font-black text-xs px-1.5 py-0.5">5F</span>
          <span className="text-slate-900 font-black text-[11px]">식당 | 새가족실 | 연습실 🚺</span>
        </div>
      </Html>

      {/* 3. 복도 '좋은나무교회' 4구 분리수거함 & 흰색 빨래바구니 통 (image_34 완벽 고증!) */}
      <group position={[-2.15, 0, -2.5]}>
        <RoundedBox args={[0.48, 0.88, 1.38]} position={[0, 0.44, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.24, 1.35]} position={[0.18, 1.0, 0]} radius={0.01}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        {/* 분리수거 4칸 투입구 테두리 */}
        {[-0.45, -0.15, 0.15, 0.45].map((oz, i) => (
          <RoundedBox key={i} args={[0.32, 0.03, 0.24]} position={[0, 0.89, oz]} radius={0.005}>
            <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
          </RoundedBox>
        ))}
        {/* 옆에 놓인 흰색 플라스틱 바구니 (image_34) */}
        <mesh position={[0, 0.28, -0.92]} castShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.52, 18]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      </group>

      {/* 4. 스테인리스 프레임 + 반투명 안개시트지 유리 파티션 가벽 (image_37, 38, 39) */}
      <group position={[-1.75, 0, 1.8]}>
        {/* 반투명 프로스트 유리 */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.05, 2.3, 7.2]} />
          <meshStandardMaterial color="#E2F1EC" transparent opacity={0.52} roughness={0.2} />
        </mesh>
        {/* 스테인리스 세로 기둥 6개 */}
        {[-3.5, -2.1, -0.7, 0.7, 2.1, 3.5].map((mz, idx) => (
          <RoundedBox key={idx} args={[0.08, 2.4, 0.08]} position={[0, 1.2, mz]} radius={0.01}>
            <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
          </RoundedBox>
        ))}
        {/* 스테인리스 상단 가로 바 */}
        <RoundedBox args={[0.09, 0.08, 7.2]} position={[0, 1.95, 0]} radius={0.01}>
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* 🔥 5. 유리 파티션 코너: 빨간 받침대 소화기 + 바로 앞 베이지 사각 스툴 (image_38, 39 완벽 고증!) */}
      <group
        position={[-1.48, 0, -1.52]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_5F[4]);
        }}
      >
        {/* 빨간 플라스틱 소화기 받침대 */}
        <RoundedBox args={[0.28, 0.12, 0.28]} position={[0, 0.06, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#DC2626" />
        </RoundedBox>
        {/* 빨간 소화기 본체 */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.44, 20]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
        {/* 노란 사용법 라벨 */}
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.15, 20]} />
          <meshStandardMaterial color="#FACC15" />
        </mesh>
        {/* 소화기 바로 앞을 살짝 가리고 있는 베이지색 사각 플라스틱 스툴 의자 (image_38) */}
        <RoundedBox args={[0.34, 0.44, 0.34]} position={[0.22, 0.22, 0.22]} radius={0.03} castShadow>
          <meshStandardMaterial color="#B8A696" roughness={0.6} />
        </RoundedBox>
        <Html position={[0, 0.78, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] shadow-md whitespace-nowrap">
            🧯 파티션 코너 소화기
          </div>
        </Html>
      </group>

      {/* 6. 좌측 주방 · 조리실 설비 (스테인리스 싱크대, 식기세척기, 가스 화구, 후드 — image_35) */}
      <group position={[-3.2, 0, 0.8]}>
        {/* 싱크대 조리대 */}
        <RoundedBox args={[0.68, 0.88, 2.2]} position={[-0.8, 0.44, -0.3]} radius={0.02} castShadow>
          <meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.25} />
        </RoundedBox>
        {/* 업소용 식기세척기 */}
        <RoundedBox args={[0.68, 1.55, 0.68]} position={[-0.8, 0.77, 1.2]} radius={0.02} castShadow>
          <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        {/* 우측 대형 가스레인지 화구 & 상단 환기 후드 */}
        <RoundedBox args={[0.95, 0.82, 0.65]} position={[0.2, 0.41, 1.4]} radius={0.02} castShadow>
          <meshStandardMaterial color="#E2E8F0" metalness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.5, 0.75]} position={[0.2, 1.95, 1.4]} radius={0.02}>
          <meshStandardMaterial color="#F1F5F9" />
        </RoundedBox>
      </group>

      {/* 7. 만나 식당 화이트 접이식 테이블 8개 & 사각 스툴 의자 & 앞줄 등받이 의자 2개 (image_36, 37) */}
      {[-0.6, 0.65, 1.9, 3.15].map((tz, rIdx) =>
        [0.2, 2.25].map((tx, cIdx) => (
          <group key={`tbl_${rIdx}_${cIdx}`} position={[tx, 0, tz]}>
            {/* 화이트 테이블 상판 */}
            <RoundedBox args={[1.55, 0.055, 0.68]} position={[0, 0.72, 0]} radius={0.015} castShadow receiveShadow>
              <meshStandardMaterial color="#F8FAFC" roughness={0.35} />
            </RoundedBox>
            {/* 검은색 철제 다리 */}
            <mesh position={[-0.65, 0.36, 0]} castShadow>
              <boxGeometry args={[0.04, 0.72, 0.55]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            <mesh position={[0.65, 0.36, 0]} castShadow>
              <boxGeometry args={[0.04, 0.72, 0.55]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            {/* 테이블 아래 쏙 들어가 있는 회색/브라운 라탄 사각 스툴 의자 2개씩 */}
            <RoundedBox args={[0.32, 0.43, 0.32]} position={[-0.36, 0.215, -0.35]} radius={0.03} castShadow>
              <meshStandardMaterial color={rIdx % 2 === 0 ? '#64748B' : '#78716C'} />
            </RoundedBox>
            <RoundedBox args={[0.32, 0.43, 0.32]} position={[0.36, 0.215, -0.35]} radius={0.03} castShadow>
              <meshStandardMaterial color={rIdx % 2 === 0 ? '#64748B' : '#78716C'} />
            </RoundedBox>
          </group>
        ))
      )}

      {/* 사진 맨 앞줄(image_36)의 포인트 의자 2개: 베이지색 라운드 의자 & 블랙 암체어 */}
      <group position={[-0.15, 0, -1.25]}>
        <RoundedBox args={[0.44, 0.06, 0.44]} position={[0, 0.44, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#D6C7B2" />
        </RoundedBox>
        <RoundedBox args={[0.42, 0.42, 0.06]} position={[0, 0.68, -0.19]} radius={0.03} castShadow>
          <meshStandardMaterial color="#D6C7B2" />
        </RoundedBox>
      </group>
      <group position={[0.52, 0, -1.25]}>
        <RoundedBox args={[0.46, 0.06, 0.46]} position={[0, 0.44, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>
        <RoundedBox args={[0.46, 0.38, 0.07]} position={[0, 0.66, -0.2]} radius={0.03} castShadow>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>
      </group>

      {/* 8. 안쪽 찬양 연습실 스테이지 (벽걸이 대형 TV, 화이트 수납장, 드럼, 건반, PA 스피커 — image_36, 37) */}
      <group position={[0, 0, 5.1]}>
        {/* 벽걸이 대형 TV */}
        <RoundedBox args={[1.45, 0.85, 0.08]} position={[-0.2, 1.85, 0.68]} radius={0.01} castShadow>
          <meshStandardMaterial color="#090D16" roughness={0.15} />
        </RoundedBox>
        {/* 좌측 화이트 붙박이 수납장 & 화이트 강대상 */}
        <RoundedBox args={[0.95, 2.2, 0.6]} position={[-1.15, 1.1, 0.25]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        <RoundedBox args={[0.68, 1.08, 0.48]} position={[-0.45, 0.54, -0.35]} radius={0.02} castShadow>
          <meshStandardMaterial color="#F8FAFC" />
        </RoundedBox>
        {/* 드럼 세트 & 건반 & 블랙 PA 스피커 2대 */}
        <mesh position={[0.45, 0.38, 0.1]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.45, 20]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        <RoundedBox args={[1.1, 0.12, 0.38]} position={[1.55, 0.72, 0.1]} radius={0.01} castShadow>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.68, 0.34]} position={[-0.75, 1.35, -0.25]} radius={0.02} castShadow>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>
        <RoundedBox args={[0.38, 0.72, 0.36]} position={[2.65, 1.35, 0.3]} radius={0.02} castShadow>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>
      </group>

      {/* 9. 우측 창가 주황/화이트 제브라 콤비 블라인드 (image_36 우측) */}
      <group position={[3.65, 1.65, 1.2]}>
        {[0, 0.28, 0.56, 0.84, 1.12].map((by, i) => (
          <RoundedBox key={i} args={[0.04, 0.14, 6.2]} position={[0, by - 0.5, 0]} radius={0.005}>
            <meshStandardMaterial color={i % 2 === 0 ? '#F59E0B' : '#FEF3C7'} />
          </RoundedBox>
        ))}
      </group>

      {/* 10. 전 층 공통 계단실 모듈 & IDF 코너 소화기 결합! */}
      <StairwellCore3D
        currentFloor="5F"
        position={[-3.2, 0, -4.5]}
        onClickStairs={() => onSelectZone(ZONES_5F[0])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '계단실 소방설비',
            title: '🧯 5F 계단실 IDF 단자함 코너 소화기',
            desc: '전 층 공통 계단실 코너에 상시 비치되어 있는 분말 소화기입니다.'
          })
        }
      />

      {/* 11. 바닥 초록색 원형 체험존 마커 (01 ~ 05) */}
      {ZONES_5F.map((z) => {
        const isSelected = activeZoneId === z.id;
        return (
          <group
            key={z.id}
            position={z.pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone(z);
            }}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.45, 0.56, 32]} />
              <meshBasicMaterial color={isSelected ? '#16A34A' : '#22C55E'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
              <circleGeometry args={[0.45, 32]} />
              <meshBasicMaterial color="#22C55E" transparent opacity={isSelected ? 0.35 : 0.15} />
            </mesh>
            <Html position={[0, 0.35, 0]} center distanceFactor={8}>
              <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] border border-white shadow-md cursor-pointer">
                {z.code}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// =====================================================================
// 🚶 3D 블록형 플레이어 아바타
// =====================================================================
function PlayerAvatar5F({ targetPos, playerName, activeZone, onOpenZoneModal, onPositionUpdate }) {
  const groupRef = useRef();
  const posRef = useRef([-0.5, 0, -2.5]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
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
      groupRef.current.position.set(nx, Math.abs(Math.sin(Date.now() * 0.012)) * 0.06, nz);
      groupRef.current.rotation.y = Math.atan2(dx, dz);
      onPositionUpdate(nx, nz);
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef} position={[-0.5, 0, -2.5]}>
      <RoundedBox args={[0.38, 0.46, 0.24]} position={[0, 0.42, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color="#38BDF8" />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.38, 0.38]} position={[0, 0.84, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color="#FDE68A" />
      </RoundedBox>
      <RoundedBox args={[0.45, 0.14, 0.41]} position={[0, 1.04, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#B45309" />
      </RoundedBox>

      <Html position={[0, 1.48, 0]} center distanceFactor={8}>
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto select-none">
          {activeZone && (
            <div
              onClick={() => onOpenZoneModal(activeZone)}
              className="bg-white/95 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-full shadow-xl border-2 border-emerald-500 flex items-center gap-2 cursor-pointer whitespace-nowrap animate-bounce"
            >
              <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono font-black text-[11px] flex items-center justify-center">
                E
              </span>
              <span className="text-xs font-black">{activeZone.prompt}</span>
            </div>
          )}
          <div className="bg-white/95 text-slate-900 px-3 py-1 rounded-full shadow-md border border-slate-300 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-[11px] font-black">나 · {playerName}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function Dining5F({ onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '단단한 관제탑';

  const [targetPos, setTargetPos] = useState([0.5, 0, -1.8]);
  const [activeZone, setActiveZone] = useState(ZONES_5F[2]);
  const [modalZone, setModalZone] = useState(null);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_5F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.1) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div className="w-full h-full relative bg-[#DCE4D8] overflow-hidden select-none font-sans">
      {/* 좌측 상단: 5층 안내 헤더 */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={onExitHome}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          ◀ 홈으로
        </button>
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-lg flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-[#0F172A] text-white font-black text-xs">5F</span>
          <div>
            <div className="text-xs font-black text-slate-900">식당 | 새가족실 | 찬양 연습실</div>
            <div className="text-[10px] text-slate-500">바닥이나 초록색 원형 마커(01~05)를 클릭해 이동하세요</div>
          </div>
        </div>
      </div>

      {/* 우측 상단: 5층 구역 바로가기 미니 리모컨 */}
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white shadow-2xl flex flex-col gap-1 w-48 pointer-events-auto">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1">🗺️ 5F 주요 구역 이동</span>
        {ZONES_5F.map(z => (
          <button
            key={z.id}
            onClick={() => {
              setTargetPos([z.pos[0], 0, z.pos[2]]);
              setActiveZone(z);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="truncate">{z.badge}</span>
            <span className="text-[9.5px] font-mono text-emerald-300">{z.code}</span>
          </button>
        ))}
      </div>

      {/* 메인 2.5D 아이소메트릭 3D 캔버스 */}
      <Canvas shadows>
        <OrthographicCamera makeDefault position={[10, 11, 10]} zoom={52} near={-50} far={200} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 14, 6]} intensity={1.15} castShadow />

        {/* 바닥 클릭 이동 판정 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            const cx = Math.max(-3.8, Math.min(3.4, e.point.x));
            const cz = Math.max(-4.5, Math.min(5.0, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[9.2, 12.2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <FiveFloorArchitecture
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.pos) setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
        />

        <PlayerAvatar5F
          targetPos={targetPos}
          playerName={playerName}
          activeZone={activeZone}
          onOpenZoneModal={(z) => setModalZone(z)}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={18} blur={2} far={4} />
        <MapControls enableRotate={true} enableZoom={true} minZoom={32} maxZoom={105} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

      {/* 상세 모달 */}
      {modalZone && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalZone(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-left"
            onClick={e => e.stopPropagation()}
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

            {modalZone.stats && (
              <div className="bg-black/40 rounded-2xl p-3 border border-white/10 space-y-2">
                {modalZone.stats.map((st, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">{st.label}</span>
                    <span className="text-amber-300 font-black">{st.val}</span>
                  </div>
                ))}
              </div>
            )}

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-emerald-300 block">🛗 다른 층으로 이동하기:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 주차장' },
                  { fl: '5F', label: '5F 식당 · 새가족실 · 연습실 (현재 층)' },
                  { fl: '6F', label: '6F 다음세대 교육관' },
                  { fl: '7F', label: '7F 옥상 하늘정원' }
                ].map(item => (
                  <button
                    key={item.fl}
                    onClick={() => {
                      setModalZone(null);
                      onChangeFloor(item.fl);
                    }}
                    className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer transition-colors"
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
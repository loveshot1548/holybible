// src/metaverse/MediaParents4F.js
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, RoundedBox, Html, ContactShadows } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import StairwellCore3D from './StairwellCore3D';

// =====================================================================
// 📍 4층 실제 사진 기반 4대 인터랙션 체험존(Trigger Zones) 정의
// =====================================================================
const ZONES_4F = [
  {
    id: 'zone_4f_elev',
    code: '01',
    name: '4F 엘리베이터 홀 & 계단실',
    prompt: '01 층간 이동 엘리베이터',
    pos: [-2.5, 0, -3.8],
    badge: '4F 엘리베이터 홀',
    title: '4F 방송실 | 영유아실 엘리베이터 홀',
    desc: '4층 안내 표지판과 코너 소화기가 비치되어 있는 엘리베이터 및 계단실 입구입니다.',
    isElevator: true,
    stats: [
      { label: '층별 안내', val: '4F 방송실 · 영유아실' },
      { label: '보안/안전', val: '옥내소화전 및 소방시설 완비' }
    ]
  },
  {
    id: 'zone_4f_parents',
    code: '02',
    name: '영유아실 (부모와 아기 쉼터)',
    prompt: '02 영유아실 안내 & 이용 수칙 보기',
    pos: [1.2, 0, 0.5],
    badge: '영유아실 (Parents Room)',
    title: '👶 아기와 부모님을 위한 아늑한 쉼터 영유아실',
    desc: '12개월 이하 아이들과 부모님들이 편안하게 머물며 수유와 휴식을 취할 수 있는 따뜻한 우드톤 공간입니다.',
    stats: [
      { label: '이용 대상', val: '영유아 동반 부모님 (12개월 이하 우대)' },
      { label: '주요 시설', val: '유아 매트 · 수유 의자 · 벽걸이 모니터' }
    ]
  },
  {
    id: 'zone_4f_media',
    code: '03',
    name: '방송실 (Media Room)',
    prompt: '03 예배 영상·음향 방송실 안내',
    pos: [-1.2, 0, 1.2],
    badge: '방송실',
    title: '🎛️ 주일 예배 영상 송출 및 음향·자막 방송실',
    desc: '대형 관람창을 통해 본당 및 예배 상황을 모니터링하며 카메라, 음향, 온라인 유튜브 송출을 담당하는 핵심 제어실입니다.',
    stats: [
      { label: '담당 업무', val: '유튜브 실시간 라이브 송출 · 음향 믹싱' },
      { label: '장비 현황', val: 'HD 카메라 콘솔 · 자막기 · 디지털 믹서' }
    ]
  },
  {
    id: 'zone_4f_fire',
    code: '04',
    name: '복도 옥내소화전 설비',
    prompt: '04 옥내소화전 사용법 확인',
    pos: [-3.2, 0, 0.2],
    badge: '소방안전 설비',
    title: '🧯 4층 복도 옥내소화전 (자동화재탐지 설비)',
    desc: '비상 시 누구나 열어 초기 화재를 진압할 수 있도록 복도 벽면에 매립된 스테인리스 옥내소화전함입니다.',
    stats: [
      { label: '사용 순서', val: '함 열기 ➔ 호스 전개 ➔ 개폐밸브 개방' },
      { label: '점검 상태', val: '이상 없음 (정기 소방점검 완료)' }
    ]
  }
];

// =====================================================================
// 🧱 4층 로우폴리 3D 건축 인테리어 컴포넌트
// =====================================================================
function FourFloorArchitecture({ activeZoneId, onSelectZone }) {
  return (
    <group>
      {/* 우드톤 마루 바닥 */}
      <RoundedBox args={[8.4, 0.1, 11.0]} position={[0, -0.05, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#D4B595" roughness={0.4} />
      </RoundedBox>

      {/* 정면 따뜻한 우드 루버벽 & 하단 웨인스코팅 */}
      <RoundedBox args={[8.4, 2.8, 0.18]} position={[0, 1.4, 5.5]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#E2C9A8" roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[8.3, 0.9, 0.06]} position={[0, 0.45, 5.38]} radius={0.01}>
        <meshStandardMaterial color="#8C7355" />
      </RoundedBox>

      {/* 4F 아크릴 표지판 */}
      <Html position={[-1.8, 1.85, -4.2]} center distanceFactor={6}>
        <div className="bg-white border border-slate-300 px-2.5 py-1 rounded shadow-md flex items-center gap-2 whitespace-nowrap">
          <span className="bg-[#0F172A] text-white font-black text-xs px-1.5 py-0.5">4F</span>
          <span className="text-slate-900 font-black text-[11px]">방송실 | 영유아실</span>
        </div>
      </Html>

      {/* 영유아실 파란 문 */}
      <group position={[1.2, 0, 1.8]}>
        <RoundedBox args={[0.08, 2.1, 0.95]} position={[0, 1.05, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E3A8A" />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.9, 0.55]} position={[0.04, 1.25, 0]} radius={0.01}>
          <meshStandardMaterial color="#E0F2FE" transparent opacity={0.6} />
        </RoundedBox>
      </group>

      {/* 방송실 관람창 파티션 */}
      <group position={[-1.2, 0, 1.8]}>
        <RoundedBox args={[0.08, 2.1, 2.2]} position={[0, 1.05, 0]} radius={0.02}>
          <meshStandardMaterial color="#E0F2FE" transparent opacity={0.5} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* 복도 옥내소화전함 */}
      <RoundedBox args={[0.12, 1.2, 1.0]} position={[-3.9, 1.3, 0]} radius={0.02} castShadow>
        <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* 전 층 공통 계단실 모듈 결합 */}
      <StairwellCore3D
        currentFloor="4F"
        position={[-3.2, 0, -4.2]}
        onClickStairs={() => onSelectZone(ZONES_4F[0])}
        onClickExtinguisher={() => onSelectZone(ZONES_4F[3])}
      />

      {/* 바닥 초록색 원형 마커 */}
      {ZONES_4F.map((z) => {
        const isSelected = activeZoneId === z.id;
        return (
          <group key={z.id} position={z.pos} onClick={(e) => { e.stopPropagation(); onSelectZone(z); }}>
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
// 🚶 3D 플레이어 아바타
// =====================================================================
function PlayerAvatar4F({ targetPos, playerName, activeZone, onOpenZoneModal, onPositionUpdate }) {
  const groupRef = useRef();
  const posRef = useRef([0, 0, 0]);

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
    <group ref={groupRef} position={[0, 0, 0]}>
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

export default function MediaParents4F({ onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '단단한 관제탑';

  const [targetPos, setTargetPos] = useState([1.2, 0, 0.5]);
  const [activeZone, setActiveZone] = useState(ZONES_4F[1]);
  const [modalZone, setModalZone] = useState(null);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_4F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.1) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div className="w-full h-full relative bg-[#E2E8DF] overflow-hidden select-none font-sans">
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={onExitHome}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          ◀ 홈으로
        </button>
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-lg flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-[#0F172A] text-white font-black text-xs">4F</span>
          <div>
            <div className="text-xs font-black text-slate-900">방송실 | 영유아실</div>
            <div className="text-[10px] text-slate-500">바닥이나 초록색 원형 마커(01~04)를 클릭해 이동하세요</div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white shadow-2xl flex flex-col gap-1 w-48 pointer-events-auto">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1">🗺️ 4F 주요 구역 이동</span>
        {ZONES_4F.map(z => (
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

      <Canvas shadows>
        <OrthographicCamera makeDefault position={[10, 11, 10]} zoom={55} near={-50} far={200} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 14, 6]} intensity={1.15} castShadow />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            const cx = Math.max(-3.5, Math.min(3.2, e.point.x));
            const cz = Math.max(-4.2, Math.min(4.8, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[8.4, 10.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <FourFloorArchitecture
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.pos) setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
        />

        <PlayerAvatar4F
          targetPos={targetPos}
          playerName={playerName}
          activeZone={activeZone}
          onOpenZoneModal={(z) => setModalZone(z)}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={16} blur={2} far={4} />
        <MapControls enableRotate={true} enableZoom={true} minZoom={32} maxZoom={105} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

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
                  { fl: '4F', label: '4F 방송실 · 영유아실 (현재 층)' },
                  { fl: '5F', label: '5F 식당 · 새가족실' },
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
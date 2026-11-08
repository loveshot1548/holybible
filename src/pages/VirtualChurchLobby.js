// src/pages/VirtualChurchLobby.js
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, RoundedBox, ContactShadows } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import * as THREE from 'three';
import StairwellCore3D from '../metaverse/StairwellCore3D';

const ZONES_1F = [
  {
    id: 'zone_1f_welcome',
    code: '01',
    name: '1층 정문 로비 & 새가족 환영 데스크',
    prompt: '01 새가족 안내 데스크 & 주보 열람',
    pos: [-1.5, 0, 1.8],
    badge: '1F 환영 로비',
    title: '🏛️ 좋은나무교회 1층 정문 로비 & 새가족 데스크',
    desc: '정문과 좌측 주차장 출입구가 만나는 메인 로비입니다. 처음 오신 새가족분들은 안내 데스크와 스카이 블루 소파 라운지에서 따뜻한 환영과 안내를 받으실 수 있습니다.',
    stats: [
      { label: '주일 예배', val: '1부 09:00 / 2부 11:00 (3F 대예배당)' },
      { label: '안내 데스크', val: '새가족 등록 및 주보·예배 안내 상주' }
    ],
    actions: [
      { label: '🛗 3층 대예배당 바로 올라가기', jumpFloor: '3F' },
      { label: '📖 온라인 예배노트 열기', screen: 'sermon' }
    ]
  },
  {
    id: 'zone_1f_parking',
    code: '02',
    name: '좌측 야외 주차장 & 측면 자동문',
    prompt: '02 야외 주차장 & 차량 안내 확인',
    pos: [-6.8, 0, 0.8],
    badge: '야외 주차장',
    title: '🚗 좌측 전용 야외 주차장 & 새가족 배려 주차존',
    desc: '차량 방문 성도님들과 새가족이 편리하게 주차하고 측면 유리 자동문을 통해 1층 로비로 바로 들어오실 수 있는 구역입니다.',
    stats: [
      { label: '주차 현황', val: '여유 (새가족 전용 주차구역 운영)' },
      { label: '진입 동선', val: '주차장 ➔ 측면 자동문 ➔ 1층 로비 직결' }
    ]
  },
  {
    id: 'zone_1f_vision',
    code: '03',
    name: '곡선형 비전 갤러리 & 메인 대시보드',
    prompt: '03 좋은나무 비전 보드 & 양육 안내',
    pos: [0.2, 0, -3.5],
    badge: '비전 갤러리 홀',
    title: '🌳 말씀으로 가정을 세우는 좋은나무 비전 갤러리',
    desc: '로비 중앙에서 엘리베이터 홀로 이어지는 곡선형 갤러리 복도입니다. 정면 대형 LED 비전 보드에서 교회 표어와 양육 과정을 확인하실 수 있습니다.',
    stats: [
      { label: '교회 표어', val: '말씀과 성령으로 자라가는 공동체' },
      { label: '제자 양육', val: '성인 12주 · 청소년 10주 양육 과정' }
    ],
    actions: [
      { label: '🎓 12주 양육 커리큘럼', screen: 'trainingCurriculum' },
      { label: '🔥 오늘의 QT 바로가기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_1f_elevator',
    code: '04',
    name: '1층 스마트 엘리베이터 홀 (3F 본당 이동)',
    prompt: '04 엘리베이터 탑승 (3층 대예배당 이동)',
    pos: [4.2, 0, -2.8],
    isElevator: true,
    badge: '스마트 엘리베이터',
    title: '🛗 전 층 연결 스마트 엘리베이터 홀 (1F ➔ 3F 대예배당)',
    desc: '3층 대예배당(본당)을 비롯해 각 층으로 즉시 이동할 수 있는 메인 엘리베이터입니다. 아래 버튼을 누르시면 3층 본당으로 바로 올라갑니다!'
  },
  {
    id: 'zone_1f_stairs',
    code: '05',
    name: '우측 전 층 연결 공통 계단실 & 소화기',
    prompt: '05 계단으로 3층 대예배당 올라가기',
    pos: [4.2, 0, 2.2],
    isElevator: true,
    badge: '1F 공통 계단실',
    title: '🪜 1층 ➔ 3층 대예배당 연결 계단실 & 소방안전 설비',
    desc: '채광 좋은 코너 통유리창과 투톤 화강암 계단, IDF 단자함 및 코너 소화기가 완비된 전 층 공통 계단실입니다.'
  }
];

const LOBBY_NPCS_3D = [
  { id: 'npc_welcome', pos: [-3.2, 0, 0.8], suit: '#0284C7', hair: '#B45309' },
  { id: 'npc_guide', pos: [2.2, 0, -2.2], suit: '#2563EB', hair: '#78350F' },
  { id: 'npc_parking', pos: [-6.0, 0, 2.5], suit: '#16A34A', hair: '#92400E' }
];

function MovingRoadCars() {
  const car1Ref = useRef();
  const car2Ref = useRef();

  useFrame((_, delta) => {
    if (car1Ref.current) {
      car1Ref.current.position.x += delta * 2.8;
      if (car1Ref.current.position.x > 10) car1Ref.current.position.x = -11;
    }
    if (car2Ref.current) {
      car2Ref.current.position.x -= delta * 2.4;
      if (car2Ref.current.position.x < -11) car2Ref.current.position.x = 10;
    }
  });

  return (
    <group>
      <group ref={car1Ref} position={[-6, 0.28, 7.6]}>
        <RoundedBox args={[1.6, 0.42, 0.88]} position={[0, 0, 0]} radius={0.06} castShadow>
          <meshStandardMaterial color="#FACC15" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.34, 0.78]} position={[-0.1, 0.32, 0]} radius={0.05} castShadow>
          <meshStandardMaterial color="#FEF9C3" />
        </RoundedBox>
      </group>
      <group ref={car2Ref} position={[6, 0.28, 8.8]}>
        <RoundedBox args={[1.6, 0.42, 0.88]} position={[0, 0, 0]} radius={0.06} castShadow>
          <meshStandardMaterial color="#34D399" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.34, 0.78]} position={[0.1, 0.32, 0]} radius={0.05} castShadow>
          <meshStandardMaterial color="#ECFDF5" />
        </RoundedBox>
      </group>
    </group>
  );
}

function Lobby1FDetailedArchitecture({ activeZoneId, onSelectZone }) {
  return (
    <group>
      {/* 1. 메인 로비 크림 대리석 바닥 & 정문 로열블루 환영 러너 카펫 */}
      <RoundedBox args={[12.4, 0.1, 11.6]} position={[0.4, -0.05, -0.4]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#F5F5F0" roughness={0.25} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0.01, 2.2]} receiveShadow>
        <planeGeometry args={[2.5, 5.2]} />
        <meshStandardMaterial color="#1E3A8A" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.2, 0.012, -2.8]} receiveShadow>
        <planeGeometry args={[3.2, 3.0]} />
        <meshStandardMaterial color="#DBEAFE" roughness={0.35} />
      </mesh>

      {/* 2. 좌측 야외 주차장 아스팔트 바닥 & 주차된 자동차 3대 */}
      <RoundedBox args={[5.8, 0.1, 11.6]} position={[-8.7, -0.06, -0.4]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </RoundedBox>
      {[-3.2, -1.0, 1.2, 3.4].map((pz, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-9.5, 0.01, pz]}>
          <planeGeometry args={[2.8, 0.12]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      ))}
      {[
        { z: -2.1, col: '#FACC15', roof: '#FEF08A' },
        { z: 0.1, col: '#38BDF8', roof: '#E0F2FE' },
        { z: 2.3, col: '#F8FAFC', roof: '#E2E8F0' }
      ].map((c, idx) => (
        <group key={`pcar_${idx}`} position={[-9.5, 0.28, c.z]}>
          <RoundedBox args={[1.9, 0.44, 0.96]} radius={0.06} castShadow receiveShadow>
            <meshStandardMaterial color={c.col} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.1, 0.36, 0.84]} position={[-0.1, 0.34, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={c.roof} />
          </RoundedBox>
        </group>
      ))}

      {/* 3. 정문 앞 보도블록 인도 & 아스팔트 2차선 차도 & 횡단보도 */}
      <RoundedBox args={[18.2, 0.1, 1.8]} position={[-2.5, -0.04, 6.2]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[18.2, 0.1, 2.8]} position={[-2.5, -0.07, 8.2]} radius={0.01} receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </RoundedBox>
      {[-0.8, -0.35, 0.1, 0.55, 1.0].map((cz, i) => (
        <mesh key={`cw_${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0.01, 8.1 + cz]}>
          <planeGeometry args={[2.2, 0.24]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      ))}
      <MovingRoadCars />

      {/* 4. 북쪽 비전 갤러리 외벽 & 대형 LED 비전 보드 */}
      <RoundedBox args={[11.2, 3.0, 0.25]} position={[1.0, 1.5, -6.1]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[5.4, 1.55, 0.12]}
        position={[0.2, 1.65, -5.92]}
        radius={0.02}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[2]);
        }}
      >
        <meshStandardMaterial color="#0F172A" />
      </RoundedBox>
      {/* 비전 보드 안쪽 그린/스카이 포인트 패널 */}
      <RoundedBox args={[1.4, 0.9, 0.04]} position={[-1.5, 1.65, -5.84]} radius={0.01}>
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.35} />
      </RoundedBox>
      <RoundedBox args={[3.1, 0.9, 0.04]} position={[1.0, 1.65, -5.84]} radius={0.01}>
        <meshStandardMaterial color="#0284C7" emissive="#0284C7" emissiveIntensity={0.25} />
      </RoundedBox>

      {/* 좌측 곡선형 복도 가벽 & 주차장 연결 유리 자동문 */}
      {[-5.2, -4.3, -3.4, -2.5].map((cx, i) => (
        <RoundedBox
          key={`curve_${i}`}
          args={[1.1, 2.8, 0.22]}
          position={[cx, 1.4, -2.4 - i * 0.9]}
          rotation={[0, 0.65, 0]}
          radius={0.02}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#E2E8F0" />
        </RoundedBox>
      ))}
      <mesh position={[-5.75, 1.3, 1.5]}>
        <boxGeometry args={[0.08, 2.6, 6.8]} />
        <meshStandardMaterial color="#BAE6FD" transparent opacity={0.42} />
      </mesh>

      {/* 5. 1층 새가족 환영 데스크 & 스카이 블루 소파 라운지 */}
      <group
        position={[-3.3, 0, 1.6]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[0]);
        }}
      >
        <RoundedBox args={[2.1, 0.96, 0.82]} position={[0, 0.48, 0]} radius={0.03} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" />
        </RoundedBox>
        <RoundedBox args={[2.2, 0.08, 0.9]} position={[0, 0.98, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1E3A8A" />
        </RoundedBox>
      </group>

      <group position={[1.1, 0, 2.5]}>
        <RoundedBox args={[1.7, 0.55, 0.8]} position={[0, 0.28, 0]} radius={0.05} castShadow receiveShadow>
          <meshStandardMaterial color="#7DD3FC" />
        </RoundedBox>
        <RoundedBox args={[1.7, 0.45, 0.18]} position={[0, 0.55, 0.32]} radius={0.04} castShadow>
          <meshStandardMaterial color="#38BDF8" />
        </RoundedBox>
        <RoundedBox args={[1.0, 0.38, 0.6]} position={[0, 0.19, -0.85]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C89D66" />
        </RoundedBox>
      </group>

      {/* 6. 우측 상단 스마트 엘리베이터 타워 */}
      <group
        position={[4.5, 0, -4.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(ZONES_1F[3]);
        }}
      >
        <RoundedBox args={[2.6, 3.4, 1.8]} position={[0, 1.7, 0]} radius={0.03} castShadow receiveShadow>
          <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[0.66, 2.2, 0.08]} position={[-0.35, 1.1, 0.91]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.6} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.66, 2.2, 0.08]} position={[0.35, 1.1, 0.91]} radius={0.01}>
          <meshStandardMaterial color="#3E2723" metalness={0.6} roughness={0.3} />
        </RoundedBox>
        {/* 엘리베이터 상단 녹색 표시등 */}
        <RoundedBox args={[0.8, 0.22, 0.06]} position={[0, 2.45, 0.92]} radius={0.01}>
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
        </RoundedBox>
      </group>

      {/* 7. 전 층 공통 계단실 모듈 & 코너 소화기 */}
      <StairwellCore3D
        currentFloor="1F"
        position={[4.8, 0, 2.2]}
        onClickStairs={() => onSelectZone(ZONES_1F[4])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '1F 소방안전 설비',
            title: '🧯 1F 로비 계단실 코너 소화기 & IDF 단자함',
            desc: '1층 계단실 입구 코너에 상시 비치되어 있는 초기 진화용 분말 소화기입니다.'
          })
        }
      />

      {/* 8. 안내 NPC 아바타 3명 */}
      {LOBBY_NPCS_3D.map((npc) => (
        <group key={npc.id} position={npc.pos}>
          <RoundedBox args={[0.36, 0.44, 0.24]} position={[0, 0.42, 0]} radius={0.04} castShadow>
            <meshStandardMaterial color={npc.suit} />
          </RoundedBox>
          <RoundedBox args={[0.4, 0.36, 0.36]} position={[0, 0.82, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color="#FDE68A" />
          </RoundedBox>
          <RoundedBox args={[0.42, 0.13, 0.38]} position={[0, 1.0, 0]} radius={0.03} castShadow>
            <meshStandardMaterial color={npc.hair} />
          </RoundedBox>
        </group>
      ))}

      {/* 9. 바닥 초록색 원형 체험존 마커 (01 ~ 05) */}
      {ZONES_1F.map((z) => {
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
              <ringGeometry args={[0.45, 0.58, 32]} />
              <meshBasicMaterial color={isSelected ? '#16A34A' : '#22C55E'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
              <circleGeometry args={[0.45, 32]} />
              <meshBasicMaterial color="#22C55E" transparent opacity={isSelected ? 0.35 : 0.15} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PlayerAvatar1F({ targetPos, onPositionUpdate }) {
  const groupRef = useRef();
  const posRef = useRef([-1.5, 0, 3.8]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const [cx, , cz] = posRef.current;
    const [tx, , tz] = targetPos;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.2);
      const nx = cx + (dx / dist) * step;
      const nz = cz + (dz / dist) * step;
      posRef.current = [nx, 0, nz];
      const swing = Math.sin(state.clock.elapsedTime * 12);
      groupRef.current.position.set(nx, Math.abs(swing) * 0.05, nz);
      groupRef.current.rotation.y = Math.atan2(dx, dz);
      onPositionUpdate(nx, nz);
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef} position={[-1.5, 0, 3.8]}>
      <RoundedBox args={[0.38, 0.46, 0.24]} position={[0, 0.42, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color="#38BDF8" />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.38, 0.38]} position={[0, 0.84, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color="#FDE68A" />
      </RoundedBox>
      <RoundedBox args={[0.45, 0.14, 0.41]} position={[0, 1.04, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#B45309" />
      </RoundedBox>
      {/* 내 캐릭터 머리 위 골드 링 마커 */}
      <mesh position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.03, 12, 24]} />
        <meshBasicMaterial color="#FACC15" />
      </mesh>
    </group>
  );
}

export default function VirtualChurchLobby({ setActiveScreen, onChangeFloor }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '단단한 관제탑';

  const [targetPos, setTargetPos] = useState([-1.5, 0, 1.8]);
  const [activeZone, setActiveZone] = useState(ZONES_1F[0]);
  const [modalZone, setModalZone] = useState(null);

  const handleJumpToFloor = (fl) => {
    setModalZone(null);
    if (typeof onChangeFloor === 'function') {
      onChangeFloor(fl);
    }
  };

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_1F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.35) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div translate="no" className="notranslate w-full h-full relative bg-[#D9E6C3] overflow-hidden select-none font-sans">
      {/* 좌측 상단: 1층 메인 로비 헤더 & 3층 대예배당 직행 버튼 */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setActiveScreen && setActiveScreen('home')}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          ◀ 홈으로
        </button>

        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-lg flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">1F</span>
          <div>
            <div className="text-xs font-black text-slate-900">메인 환영 로비 & 야외 주차장 (나 · {playerName})</div>
            <div className="text-[10px] text-slate-500">바닥이나 초록색 마커를 클릭해 이동하세요</div>
          </div>
        </div>

        <button
          onClick={() => handleJumpToFloor('3F')}
          className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          🛗 3층 대예배당(본당) 바로 올라가기 ➔
        </button>
      </div>

      {/* 중앙 상단: 근접 존 [E] 상호작용 배너 (Canvas 외부 순수 React HUD) */}
      {activeZone && (
        <div
          onClick={() => setModalZone(activeZone)}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-white text-slate-900 px-4 py-2 rounded-full shadow-2xl border-2 border-emerald-500 flex items-center gap-2 cursor-pointer animate-bounce pointer-events-auto"
        >
          <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center">
            E
          </span>
          <span className="text-xs font-black">{activeZone.prompt}</span>
        </div>
      )}

      {/* 우측 상단: 1층 로비 구역 바로가기 미니 리모컨 */}
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white shadow-2xl flex flex-col gap-1 w-52 pointer-events-auto">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1">🗺️ 1F 로비 주요 구역</span>
        {ZONES_1F.map(z => (
          <button
            key={z.id}
            onClick={() => {
              setTargetPos([z.pos[0], 0, z.pos[2]]);
              setActiveZone(z);
              setModalZone(z);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="truncate">{z.badge}</span>
            <span className="text-[9.5px] font-mono text-emerald-300">{z.code}</span>
          </button>
        ))}
      </div>

            {/* 📍 src/pages/VirtualChurchLobby.js 의 <Canvas> 부분만 아래로 교체 */}
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
      >
        <OrthographicCamera makeDefault position={[12, 13, 12]} zoom={44} near={-50} far={200} />
        <ambientLight intensity={1.15} color="#FFFDF9" />
        <hemisphereLight args={['#FFFBEB', '#D6C7B2', 0.85]} />
        <directionalLight position={[10, 16, 8]} intensity={1.45} color="#FFF7ED" castShadow />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-2, 0.01, 1]}
          onClick={(e) => {
            e.stopPropagation();
            const cx = Math.max(-10.5, Math.min(5.5, e.point.x));
            const cz = Math.max(-5.2, Math.min(7.0, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[22, 18]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <Lobby1FDetailedArchitecture
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            if (z.pos) setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
        />

        <PlayerAvatar1F
          targetPos={targetPos}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={24} blur={2} far={4} />
        <MapControls enableRotate={true} enableZoom={true} minZoom={28} maxZoom={100} maxPolarAngle={Math.PI / 2.15} />
      </Canvas>

      {/* 구역 상세 안내 & 엘리베이터 층간 이동 모달 */}
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

            {modalZone.actions && modalZone.actions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {modalZone.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setModalZone(null);
                      if (act.jumpFloor) {
                        handleJumpToFloor(act.jumpFloor);
                      } else if (setActiveScreen && act.screen) {
                        setActiveScreen(act.screen);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {modalZone.isElevator && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-emerald-300 block">🛗 이동할 층을 선택하세요:</span>
                <button
                  onClick={() => handleJumpToFloor('3F')}
                  className="w-full p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-left text-xs font-black flex justify-between items-center cursor-pointer shadow-lg transition-all"
                >
                  <div>
                    <div className="text-sm font-black">3F 대예배당 (본당) 올라가기</div>
                    <div className="text-[10.5px] opacity-80">장의자 착석 모션 & 예배노트 유튜브 스크린 연동</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-black/15 font-mono">이동 ➔</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
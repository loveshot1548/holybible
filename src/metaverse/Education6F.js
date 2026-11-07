// src/metaverse/Education6F.js
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Html, ContactShadows } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import StairwellCore3D from './StairwellCore3D';

// =====================================================================
// 🎵 6층 다음세대 교육관 밝고 경쾌한 찬양 멜로디 신디사이저 (Web Audio)
// =====================================================================
let bgmInterval = null;
const togglePraiseBgm = (play) => {
  if (!play) {
    if (bgmInterval) clearInterval(bgmInterval);
    bgmInterval = null;
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 880.0];
  let step = 0;

  if (bgmInterval) clearInterval(bgmInterval);
  bgmInterval = setInterval(() => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[step % melody.length], now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
      step++;
    } catch (_) {}
  }, 380);
};

// =====================================================================
// 📍 6층 실제 사진 기반 6대 인터랙션 존(Trigger Zones) 데이터
// =====================================================================
const ZONES_6F = [
  {
    id: 'elev_6f',
    code: '01',
    name: '6F 엘리베이터 홀 (만국기 가랜드)',
    prompt: '01 엘리베이터 탑승 (층간 이동)',
    pos: [0, 0, -4.6],
    color: '#22C55E',
    isElevator: true,
    badge: '6F 엘리베이터 홀',
    title: '6층 소예배실 · 다음세대 교육관 엘리베이터 홀',
    desc: '알록달록한 가랜드가 반겨주는 6층 입구입니다. 좌측에는 5단 어린이 신발장과 정수기·손소독기가 비치되어 있습니다.'
  },
  {
    id: 'infant_room',
    code: '02',
    name: '영아부 예배실 (0~3세)',
    prompt: '02 영아부 소개 & 찬양 영상 보기',
    pos: [-1.1, 0, -0.6],
    color: '#F59E0B',
    badge: '영아부 (0~3세)',
    title: '👶 예수님 품 안에 자라는 좋은나무 영아부',
    desc: '초록 덩굴 조화와 따뜻한 말씀 포스터가 붙어 있는 남색 문입니다. 부모님과 아기들이 함께 찬양하고 말씀으로 축복받는 공간입니다.',
    schedule: '주일 오전 11:00 | 6층 영아부실',
    videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk'
  },
  {
    id: 'elementary_room',
    code: '03',
    name: '초등부 Sunday School',
    prompt: '03 초등부 예배실 & 사역 안내',
    pos: [1.1, 0, -2.2],
    color: '#38BDF8',
    badge: '초등부 (4~6학년)',
    title: '🏫 말씀과 기도로 세상의 빛이 되는 초등부',
    desc: '투명 강화유리 자동문 안쪽으로 책상과 모니터가 완비된 초등부 예배실(소예배실)입니다.',
    schedule: '주일 오전 11:00 | 6층 소예배실(초등부실)'
  },
  {
    id: 'kindergarten_room',
    code: '04',
    name: '유치부 예배실 (4~7세)',
    prompt: '04 유치부 율동·찬양 & 교육 안내',
    pos: [1.1, 0, 2.2],
    color: '#EC4899',
    badge: '유치부 (4~7세)',
    title: '🎨 말씀 안에서 꿈꾸는 좋은나무 유치부',
    desc: '복도 우측 알록달록한 어린이 신발장 옆 파란색 문입니다. 신나는 찬양 율동과 성경 동화, 공과 활동이 진행됩니다.',
    schedule: '주일 오전 11:00 | 6층 유치부실'
  },
  {
    id: 'junior_room',
    code: '05',
    name: '유년부 예배실 (초등 1~3학년)',
    prompt: '05 유년부 제자양육 소개 보기',
    pos: [-1.1, 0, 2.6],
    color: '#10B981',
    badge: '유년부 (1~3학년)',
    title: '🌱 성경의 뿌리를 단단히 내리는 유년부',
    desc: '초등 저학년 눈높이에 맞춘 성경 묵상(키즈 QT)과 분반 모임이 이루어지는 유년부 교육실입니다.',
    schedule: '주일 오전 11:00 | 6층 유년부실'
  },
  {
    id: 'new_family_room',
    code: '06',
    name: '새가족반 교육실 (주일 오후 1시)',
    prompt: '06 새가족반 안내 & 등록 과정',
    pos: [1.1, 0, 4.4],
    color: '#8B5CF6',
    badge: '새가족반',
    title: '🤝 환영합니다! 좋은나무교회 새가족반',
    desc: '깔끔한 화이트 테이블과 벽걸이 모니터가 설치된 새가족 전용 소그룹실입니다. 주일 오후 1시에 새가족 교육이 진행됩니다.',
    schedule: '주일 오후 1:00 | 6층 새가족반실'
  }
];

// =====================================================================
// 🧱 사진 10장(image_20~29)을 100% 반영한 3D 건축 & 인테리어 컴포넌트
// =====================================================================
function SixFloorArchitecture({ onSelectZone, activeZoneId }) {
  return (
    <group>
      {/* 1. 진회색 사각 데코타일 복도 바닥 & 우측 새가족실 내부 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3.8, 12.4]} />
        <meshStandardMaterial color="#4B5563" roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.1, 0.005, 4.2]} receiveShadow>
        <planeGeometry args={[2.5, 2.8]} />
        <meshStandardMaterial color="#6B7280" roughness={0.5} />
      </mesh>

      {/* 노란색 점자 블록 (엘리베이터 앞 & 소화전 앞) */}
      <mesh position={[0.45, 0.015, -4.9]} receiveShadow>
        <boxGeometry args={[0.85, 0.02, 0.35]} />
        <meshStandardMaterial color="#FACC15" />
      </mesh>
      <mesh position={[-1.25, 0.015, -3.3]} receiveShadow>
        <boxGeometry args={[0.35, 0.02, 0.8]} />
        <meshStandardMaterial color="#FACC15" />
      </mesh>

      {/* 2. 북쪽 엘리베이터 홀 베이지 대리석 벽 & 짙은 갈색 엘리베이터 문 */}
      <mesh position={[0, 1.4, -6.1]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.8, 0.2]} />
        <meshStandardMaterial color="#C8B9A6" roughness={0.3} />
      </mesh>
      {/* 엘리베이터 문 */}
      <mesh position={[0, 1.1, -5.98]}>
        <boxGeometry args={[1.45, 2.2, 0.06]} />
        <meshStandardMaterial color="#3E2723" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* 엘리베이터 위 알록달록 삼각 가랜드(만국기) */}
      {['#EF4444', '#FACC15', '#3B82F6', '#F97316', '#10B981', '#EC4899'].map((col, idx) => (
        <mesh key={idx} position={[-0.6 + idx * 0.24, 2.22, -5.92]}>
          <coneGeometry args={[0.11, 0.22, 3]} />
          <meshStandardMaterial color={col} />
        </mesh>
      ))}
      {/* 엘리베이터 좌측 정수기 & 서랍장 & 체온계 */}
      <mesh position={[-1.25, 0.45, -5.6]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.5]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>
      <mesh position={[-1.25, 1.12, -5.6]} castShadow>
        <boxGeometry args={[0.42, 0.45, 0.42]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* 3. 서쪽(좌측) 긴 복도 벽 (상단 라이트그레이 + 하단 크림 웨인스코팅) */}
      <mesh position={[-1.85, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.8, 12.4]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
      </mesh>
      <mesh position={[-1.76, 0.45, 0]} receiveShadow>
        <boxGeometry args={[0.06, 0.9, 12.4]} />
        <meshStandardMaterial color="#F3EFE6" />
      </mesh>

      {/* 엘리베이터 홀 좌측 5단 컬러 원목 신발장 (image_22) */}
      <mesh position={[-1.55, 0.65, -4.4]} castShadow>
        <boxGeometry args={[0.38, 1.3, 1.15]} />
        <meshStandardMaterial color="#E5D3B3" />
      </mesh>
      {['#84CC16', '#F87171', '#FACC15', '#38BDF8'].map((sc, i) => (
        <mesh key={i} position={[-1.53, 0.25 + i * 0.28, -4.4]}>
          <boxGeometry args={[0.36, 0.04, 1.1]} />
          <meshStandardMaterial color={sc} />
        </mesh>
      ))}

      {/* 좌측 벽 스테인리스 소화전 & 6F 소예배실|교육실 표지판 (image_21, 29) */}
      <mesh position={[-1.74, 1.1, -3.1]}>
        <boxGeometry args={[0.06, 1.15, 0.8]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html position={[-1.7, 1.75, -2.0]} transform rotation={[0, Math.PI / 2, 0]} distanceFactor={5}>
        <div className="bg-white border border-slate-300 px-2.5 py-1 rounded shadow-xs flex items-center gap-2 whitespace-nowrap">
          <span className="bg-[#0F2942] text-white font-black text-xs px-1.5 py-0.5">6F</span>
          <span className="text-slate-900 font-black text-[11px]">소예배실 | 교육실 🚹</span>
        </div>
      </Html>

      {/* 4. 좌측 벽: 영아부 남색 문 + 가로 줄무늬 창 + 초록 덩굴 조화 + 원목 주보대 (image_20, 23) */}
      <mesh position={[-1.74, 1.05, -0.6]}>
        <boxGeometry args={[0.08, 2.1, 1.0]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-1.69, 1.15, -0.6]}>
        <boxGeometry args={[0.04, 1.4, 0.62]} />
        <meshStandardMaterial color="#E2E8F0" />
      </mesh>
      {/* 초록 덩굴 조화 */}
      <mesh position={[-1.65, 1.98, -0.6]}>
        <boxGeometry args={[0.18, 0.24, 0.78]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>
      <Html position={[-1.65, 1.2, -0.6]} transform rotation={[0, Math.PI / 2, 0]} distanceFactor={4.5}>
        <div className="bg-amber-100 border-2 border-amber-300 px-2 py-2.5 rounded text-center shadow-xs">
          <div className="text-rose-600 font-black text-xs">영아부</div>
          <div className="text-[8px] text-amber-900 font-bold mt-0.5">좋은나무교회</div>
        </div>
      </Html>

      {/* 영아부 문 옆 원목 주보 데스크 & 벽걸이 원목 문서함 (image_23) */}
      <mesh position={[-1.4, 0.55, 0.55]} castShadow>
        <boxGeometry args={[0.55, 1.1, 0.85]} />
        <meshStandardMaterial color="#C89D66" />
      </mesh>
      <mesh position={[-1.68, 1.55, 0.55]} castShadow>
        <boxGeometry args={[0.2, 0.65, 0.8]} />
        <meshStandardMaterial color="#C89D66" />
      </mesh>

      {/* 좌측 안쪽: 유년부 파란 문 (image_25) */}
      <mesh position={[-1.74, 1.05, 2.6]}>
        <boxGeometry args={[0.08, 2.1, 1.0]} />
        <meshStandardMaterial color="#0284C7" />
      </mesh>
      <mesh position={[-1.69, 1.15, 2.6]}>
        <boxGeometry args={[0.04, 1.4, 0.62]} />
        <meshStandardMaterial color="#E2E8F0" />
      </mesh>
      <Html position={[-1.65, 1.2, 2.6]} transform rotation={[0, Math.PI / 2, 0]} distanceFactor={4.5}>
        <div className="bg-white border border-emerald-300 px-2.5 py-1.5 rounded text-center shadow-xs">
          <div className="text-[8px] text-emerald-700 font-bold">초등부 1~3학년</div>
          <div className="text-slate-900 font-black text-xs">유년부</div>
        </div>
      </Html>

      {/* 5. 동쪽(우측) 복도 낮은 칸막이 벽 (쿼터뷰 시야가 가리지 않도록 높이 1.35m 컷어웨이 적용!) */}
      <mesh position={[1.85, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.36, 12.4]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>

      {/* 우측 앞: 초등부(Sunday School) 유리 자동문 (image_26) */}
      <mesh position={[1.82, 1.05, -2.3]}>
        <boxGeometry args={[0.08, 2.1, 1.2]} />
        <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} />
      </mesh>
      <Html position={[1.75, 1.5, -1.4]} transform rotation={[0, -Math.PI / 2, 0]} distanceFactor={4.5}>
        <div className="bg-white border border-sky-300 px-2.5 py-1 rounded text-center shadow-xs whitespace-nowrap">
          <div className="text-slate-900 font-black text-xs">초등부</div>
          <div className="text-[8px] text-slate-500 font-mono">Sunday School</div>
        </div>
      </Html>

      {/* 우측 복도: 어린이 컬러 신발장 2개 & 빨간 소화기 (image_28) */}
      <mesh position={[1.55, 0.45, 0.2]} castShadow>
        <boxGeometry args={[0.36, 0.9, 1.2]} />
        <meshStandardMaterial color="#E5D3B3" />
      </mesh>
      <mesh position={[1.55, 0.45, 1.45]} castShadow>
        <boxGeometry args={[0.36, 0.9, 1.2]} />
        <meshStandardMaterial color="#E5D3B3" />
      </mesh>
      {/* 빨간 소화기 */}
      <mesh position={[1.55, 0.28, -0.58]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.52, 16]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>

      {/* 우측 중간: 유치부 파란 문 (image_24) */}
      <mesh position={[1.82, 1.05, 2.5]}>
        <boxGeometry args={[0.08, 2.1, 0.95]} />
        <meshStandardMaterial color="#0284C7" />
      </mesh>
      <Html position={[1.75, 1.35, 2.5]} transform rotation={[0, -Math.PI / 2, 0]} distanceFactor={4.5}>
        <div className="bg-amber-50 border border-amber-300 px-2 py-2 rounded text-center shadow-xs">
          <div className="text-slate-900 font-black text-xs">유치부</div>
        </div>
      </Html>

      {/* 우측 안쪽: 새가족반 파란 문 & 내부 접이식 흰색 테이블 + 벽걸이 TV (image_27) */}
      <mesh position={[1.82, 1.05, 4.4]}>
        <boxGeometry args={[0.08, 2.1, 0.95]} />
        <meshStandardMaterial color="#0284C7" />
      </mesh>
      <Html position={[1.75, 1.35, 4.4]} transform rotation={[0, -Math.PI / 2, 0]} distanceFactor={4.5}>
        <div className="bg-white border border-slate-300 px-2 py-1.5 rounded text-center shadow-xs whitespace-nowrap">
          <div className="text-[7px] text-slate-400">환영합니다</div>
          <div className="text-slate-900 font-black text-xs">새가족반</div>
          <div className="text-[7px] text-amber-700 font-bold">주일 오후 1시</div>
        </div>
      </Html>
      {/* 새가족반 내부 테이블 2개 & 벽걸이 모니터 */}
      <mesh position={[2.8, 0.38, 4.0]} castShadow>
        <boxGeometry args={[1.1, 0.72, 0.6]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>
      <mesh position={[2.8, 0.38, 4.75]} castShadow>
        <boxGeometry args={[1.1, 0.72, 0.6]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>
      <mesh position={[2.4, 1.35, 3.1]}>
        <boxGeometry args={[0.7, 0.45, 0.06]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* 6. 바닥 초록색 원형 체험존 마커 (레퍼런스 image_17, 18 완벽 재현!) */}
      {ZONES_6F.map((z) => {
        const isSelected = activeZoneId === z.id;
        return (
          <group key={z.id} position={z.pos} onClick={(e) => { e.stopPropagation(); onSelectZone(z); }}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.42, 0.52, 32]} />
              <meshBasicMaterial color={isSelected ? '#16A34A' : '#22C55E'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
              <circleGeometry args={[0.42, 32]} />
              <meshBasicMaterial color="#22C55E" transparent opacity={isSelected ? 0.35 : 0.15} />
            </mesh>
            <Html position={[0, 0.35, 0]} center distanceFactor={8}>
              <div
                onClick={() => onSelectZone(z)}
                className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] border border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
              >
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
// 🚶 3D 블록형 플레이어 아바타 & 클릭/WASD 이동 컨트롤러
// =====================================================================
function PlayerAvatar({ targetPos, playerName, activeZone, onOpenZoneModal, onPositionUpdate }) {
  const groupRef = useRef();
  const posRef = useRef([0, 0, -3.5]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const [cx, , cz] = posRef.current;
    const [tx, , tz] = targetPos;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 3.6);
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
    <group ref={groupRef} position={[0, 0, -3.5]}>
      {/* 몸통 */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.36, 0.45, 0.24]} />
        <meshStandardMaterial color="#38BDF8" />
      </mesh>
      {/* 머리 */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[0.42, 0.38, 0.38]} />
        <meshStandardMaterial color="#FDE68A" />
      </mesh>
      {/* 헤어 블록 */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[0.45, 0.14, 0.41]} />
        <meshStandardMaterial color="#B45309" />
      </mesh>

      {/* 레퍼런스 image_18 스타일 머리 위 네임태그 & [E] 체험 배너 */}
      <Html position={[0, 1.45, 0]} center distanceFactor={8}>
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

export default function Education6F({ onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '단단한 관제탑';

  const [targetPos, setTargetPos] = useState([0, 0, -3.5]);
  const [activeZone, setActiveZone] = useState(ZONES_6F[0]);
  const [modalZone, setModalZone] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  useEffect(() => {
    return () => togglePraiseBgm(false);
  }, []);

  const handlePositionUpdate = (px, pz) => {
    const found = ZONES_6F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 0.95) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div className="w-full h-full relative bg-[#D8DFD5] overflow-hidden select-none font-sans">
      
      {/* 좌측 상단: 현재 층 & 찬양 오디오 스위치 */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={onExitHome}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          ◀ 홈으로
        </button>
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-lg flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-[#0F2942] text-white font-black text-xs">6F</span>
          <div>
            <div className="text-xs font-black text-slate-900">다음세대 교육관 (영아·유치·유년·초등·새가족)</div>
            <div className="text-[10px] text-slate-500">바닥이나 초록색 원형 마커(01~06)를 클릭해 이동하세요</div>
          </div>
        </div>
        <button
          onClick={() => {
            const next = !isMusicOn;
            setIsMusicOn(next);
            togglePraiseBgm(next);
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black shadow-lg border cursor-pointer transition-all ${
            isMusicOn
              ? 'bg-pink-600 text-white border-pink-400 animate-pulse'
              : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-white'
          }`}
        >
          {isMusicOn ? '🎵 어린이 찬양 BGM 켜짐' : '🔇 어린이 찬양 BGM 켜기'}
        </button>
      </div>

      {/* 우측 상단: 부서별 순간이동 미니맵 리모컨 */}
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white shadow-2xl flex flex-col gap-1 w-44 pointer-events-auto">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1">🗺️ 6F 부서 바로가기</span>
        {ZONES_6F.map(z => (
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

      {/* 메인 2.5D 아이소메트릭 WebGL 3D 캔버스 */}
      <Canvas shadows>
        <OrthographicCamera makeDefault position={[9, 10, 9]} zoom={58} near={-50} far={200} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 12, 5]} intensity={1.1} castShadow />

        {/* 바닥 클릭 시 해당 지점으로 캐릭터 이동 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            const cx = Math.max(-1.3, Math.min(1.3, e.point.x));
            const cz = Math.max(-5.2, Math.min(5.4, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[3.6, 12.2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SixFloorArchitecture
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
        />

        <PlayerAvatar
          targetPos={targetPos}
          playerName={playerName}
          activeZone={activeZone}
          onOpenZoneModal={(z) => setModalZone(z)}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={16} blur={2} far={4} />
        <MapControls enableRotate={true} enableZoom={true} minZoom={35} maxZoom={110} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

      {/* 부서 상세 소개 & 홍보 영상 모달 */}
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

            {modalZone.schedule && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs flex justify-between">
                <span className="text-slate-400 font-bold">예배 시간 및 장소</span>
                <span className="text-amber-300 font-black">{modalZone.schedule}</span>
              </div>
            )}

            {modalZone.isElevator && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-emerald-300 block">🛗 이동할 층을 선택하세요:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 주차장' },
                  { fl: '6F', label: '6F 다음세대 교육관 (현재 층)' },
                  { fl: '7F', label: '7F 옥상 하늘정원 입구' }
                ].map(item => (
                  <button
                    key={item.fl}
                    onClick={() => {
                      setModalZone(null);
                      if (onChangeFloor) onChangeFloor(item.fl);
                    }}
                    className="w-full p-3 rounded-xl bg-white/10 hover:bg-emerald-600 text-left text-xs font-black flex justify-between cursor-pointer transition-colors"
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
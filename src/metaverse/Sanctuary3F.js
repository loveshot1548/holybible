// src/metaverse/Sanctuary3F.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, RoundedBox, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import StairwellCore3D from './StairwellCore3D';

// =====================================================================
// 🔗 유튜브 URL에서 11자리 Video ID 추출기 (예배노트 Sermon.js 완벽 호환)
// =====================================================================
const parseYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

// 예배노트(Sermon.js)에 저장된 최신 설교 영상 URL/ID를 자동으로 찾아오는 헬퍼
const getSyncedSermonVideo = () => {
  try {
    // 1순위: 메타버스-예배노트 공유 로컬스토리지 키
    const directUrl = localStorage.getItem('sermon_active_video_url') || localStorage.getItem('app_active_gisangogi_url');
    if (directUrl && parseYoutubeId(directUrl)) {
      return { url: directUrl, id: parseYoutubeId(directUrl) };
    }
    // 2순위: dailyData 로컬스토리지 스캔
    const rawDaily = localStorage.getItem('dailyData') || localStorage.getItem('goodtree_daily_data');
    if (rawDaily) {
      const parsed = JSON.parse(rawDaily);
      const dates = Object.keys(parsed).sort().reverse();
      for (const d of dates) {
        const vUrl = parsed[d]?.sermonVideoUrl || parsed[d]?.sermonVideoId;
        if (vUrl && parseYoutubeId(vUrl)) {
          return {
            url: vUrl,
            id: parseYoutubeId(vUrl),
            title: parsed[d]?.sermonTitle || '주일 대예배 설교 말씀',
            ref: parsed[d]?.sermonReference || ''
          };
        }
      }
    }
  } catch (_) {}
  return { url: '', id: '', title: '주일 대예배 말씀', ref: '로마서 8:28-30' };
};

// =====================================================================
// 📍 3층 대예배당 6대 인터랙션 존(Trigger Zones) 정의
// =====================================================================
const ZONES_3F = [
  {
    id: 'zone_3f_pulpit',
    code: '01',
    name: '대예배당 강대상 & 대형 스크린',
    prompt: '01 설교 영상 변경 & 예배노트 열기',
    pos: [0, 0, -3.5],
    badge: '강대상 · 설교 스크린',
    title: '✝️ 3층 대예배당 강대상 & 예배노트 실시간 연동 스크린',
    desc: '2단 원형 간접조명 우물천장 아래 세로 원목 루버벽과 대형 LED 스크린이 설치된 본당 강단입니다. 예배노트의 유튜브 링크가 정면 화면에 실시간 연동됩니다.',
    stats: [
      { label: '예배 시간', val: '주일 1부 09:00 / 2부 11:00' },
      { label: '스크린 연동', val: '예배노트(Sermon) 유튜브 링크 실시간 재생' }
    ],
    actions: [
      { label: '📖 예배노트(필기·원어·아크) 열기', screen: 'sermon' },
      { label: '🔥 오늘의 QT 바로가기', screen: 'qt' }
    ]
  },
  {
    id: 'zone_3f_welcome_pew',
    code: '02',
    name: '새가족 환영석 (중앙 장의자)',
    prompt: '02 자리에 앉아 예배 영상 시청하기',
    pos: [0, 0, -0.5],
    seatTarget: { x: 0, z: -0.95, rowLabel: '중앙 새가족 환영석 (2열)' },
    badge: '새가족 환영 지정석',
    title: '🪑 "환영합니다 좋은나무교회" 새가족 지정석 착석',
    desc: '등받이에 새가족 환영 배너가 걸려 있는 본당 정중앙 명당 좌석입니다. 착석하시면 카메라가 정면 설교 스크린 시점으로 전환됩니다!',
    isSeatZone: true
  },
  {
    id: 'zone_3f_praise_band',
    code: '03',
    name: '찬양단 악기석 & 아크릴 드럼부스',
    prompt: '03 본당 찬양팀 악기 & 음향 설비',
    pos: [3.4, 0, -2.6],
    badge: '찬양단 · 드럼부스',
    title: '🥁 투명 아크릴 드럼 쉴드 & 신디사이저 찬양단석',
    desc: '본당 우측 강단 아래에 배치된 드럼 세트(투명 차음벽 완비)와 메인/세컨드 건반, 천장 라인어레이 스피커 시스템입니다.',
    stats: [
      { label: '악기 구성', val: '아크릴 쉴드 드럼 · 듀얼 신디사이저 · 어쿠스틱 기타' },
      { label: '음향 시스템', val: '천장 플라잉 스피커 2기 & 무대 모니터 스피커 4기' }
    ]
  },
  {
    id: 'zone_3f_communion',
    code: '04',
    name: '성찬·헌금 위원석 & 좌측 출입구',
    prompt: '04 성찬 테이블 & 예배 위원 안내',
    pos: [-3.5, 0, -2.6],
    badge: '성찬 · 헌금 테이블',
    title: '🍞 강단 좌측 성찬·헌금 테이블 및 예배위원 대기석',
    desc: '십자가 문양이 새겨진 원목 헌금/성찬 테이블과 예배 순서자 대기 의자가 배치된 구역입니다.'
  },
  {
    id: 'zone_3f_rear_lobby',
    code: '05',
    name: '본당 후면 출입구 & 주보대/화환',
    prompt: '05 본당 후면 로비 & 중층 방송실 창',
    pos: [0, 0, 5.2],
    badge: '본당 후면 · 주보대',
    title: '🏛️ 본당 후면 출입구 & 2층 발코니 보조 모니터',
    desc: '성도님들이 주보를 받고 입장하는 후면 로비입니다. 위쪽으로는 4층 방송실 통유리창과 중층 난간의 보조 모니터가 보입니다.'
  },
  {
    id: 'zone_3f_elev',
    code: '06',
    name: '3F 계단실 & 엘리베이터 홀',
    prompt: '06 다른 층으로 이동 (엘리베이터)',
    pos: [-5.2, 0, 4.8],
    isElevator: true,
    badge: '3F 계단 · 엘리베이터',
    title: '🛗 3층 대예배당 엘리베이터 & 공통 계단실',
    desc: '1층 로비, 4층 방송실·영유아실, 5층 식당, 6층 교육관, 7층 하늘정원으로 이동할 수 있는 코어 계단실입니다.'
  }
];

// =====================================================================
// 🪑 본당 성도석 장의자(Pew) 좌석 배열 데이터 (클릭 시 어디든 착석 가능!)
// =====================================================================
const PEW_ROWS = [-2.2, -0.9, 0.4, 1.7, 3.0, 4.3];
const PEW_COLS = [
  { colId: 'L', x: -3.9, width: 2.5, name: '좌측석' },
  { colId: 'C', x: 0.0, width: 3.4, name: '중앙석' },
  { colId: 'R', x: 3.9, width: 2.5, name: '우측석' }
];

// =====================================================================
// 🏛️ 사진 5장(image_44~48)을 100% 재현한 3층 대예배당 초디테일 3D 모델
// =====================================================================
function SanctuaryDetailedArchitecture({
  activeZoneId,
  onSelectZone,
  seatedInfo,
  onSitOnPew,
  youtubeId,
  isScreenPlaying,
  setIsScreenPlaying,
  sermonTitle,
  onOpenVideoSetting
}) {
  return (
    <group>
      {/* 1. 본당 전체 그레이 카펫타일 바닥 */}
      <RoundedBox args={[14.2, 0.1, 15.6]} position={[0, -0.05, 0]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#64748B" roughness={0.65} />
      </RoundedBox>
      {/* 중앙 통로 레드/그레이 러너 카펫 라인 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.15, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.75, 8.2]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.15, 0.005, 1.1]} receiveShadow>
        <planeGeometry args={[0.75, 8.2]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* ================================================================= */}
      {/* 🎤 2. 정면 강대상 우드 단상(2단 계단) & 세로 루버벽 & 좌우 배너 (image_44, 47) */}
      {/* ================================================================= */}
      <group position={[0, 0, -5.6]}>
        {/* 우드 무대 메인 데크 & 앞쪽 계단단차 */}
        <RoundedBox args={[10.6, 0.36, 3.2]} position={[0, 0.18, 0]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#D4A373" roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[9.8, 0.18, 0.36]} position={[0, 0.09, 1.72]} radius={0.015} castShadow receiveShadow>
          <meshStandardMaterial color="#C69263" roughness={0.45} />
        </RoundedBox>

        {/* 정면 베이지 방음타일 벽 (좌/우 날개벽 + 중앙 스크린 상단벽) */}
        <RoundedBox args={[3.3, 4.8, 0.25]} position={[-3.65, 2.4, -1.55]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#E6CCB2" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[3.3, 4.8, 0.25]} position={[3.65, 2.4, -1.55]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color="#E6CCB2" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[4.2, 2.8, 0.22]} position={[0, 3.4, -1.52]} radius={0.02} receiveShadow>
          <meshStandardMaterial color="#EDE0D4" roughness={0.7} />
        </RoundedBox>

        {/* 강대상 뒤쪽 세로 원목 루버(Wood Slats) 알코브 배경벽 (image_44, 47 핵심 디테일!) */}
        <RoundedBox args={[4.0, 2.1, 0.15]} position={[0, 1.2, -1.58]} radius={0.01}>
          <meshStandardMaterial color="#B07D4F" roughness={0.5} />
        </RoundedBox>
        {Array.from({ length: 21 }).map((_, sIdx) => (
          <mesh key={sIdx} position={[-1.9 + sIdx * 0.19, 1.2, -1.49]} castShadow>
            <boxGeometry args={[0.06, 2.05, 0.04]} />
            <meshStandardMaterial color="#8D5B34" />
          </mesh>
        ))}

        {/* 📺 정면 대형 설교 LED 스크린 (예배노트 유튜브 영상 실시간 재생!) */}
        <RoundedBox args={[4.1, 2.3, 0.1]} position={[0, 3.25, -1.38]} radius={0.02}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
        <Html
          position={[0, 3.25, -1.31]}
          transform
          distanceFactor={3.9}
          zIndexRange={[10, 0]}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[390px] h-[215px] bg-slate-950 rounded-lg overflow-hidden border-2 border-amber-200/40 shadow-2xl flex flex-col relative select-none"
          >
            {youtubeId && isScreenPlaying ? (
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
              <div className="w-full h-full bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#0F172A] flex flex-col items-center justify-center p-4 text-center text-white relative">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold mb-1.5">
                  김포 좋은나무교회 주일예배
                </span>
                <h4 className="text-base font-serif font-black tracking-tight text-white drop-shadow">
                  {sermonTitle || '말씀으로 가정을 세우는 공동체'}
                </h4>
                <p className="text-[11px] text-sky-200 mt-1">
                  {youtubeId ? '아래 장의자에 앉거나 재생 버튼을 누르면 설교가 시작됩니다' : '예배노트(Sermon)의 유튜브 링크가 이곳에 연동됩니다'}
                </p>
                <div className="flex gap-2 mt-3">
                  {youtubeId ? (
                    <button
                      onClick={() => setIsScreenPlaying(true)}
                      className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center gap-1"
                    >
                      ▶ 본당 스크린 설교 재생
                    </button>
                  ) : null}
                  <button
                    onClick={onOpenVideoSetting}
                    className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] border border-white/25 cursor-pointer"
                  >
                    🔗 유튜브 링크 설정
                  </button>
                </div>
              </div>
            )}
          </div>
        </Html>

        {/* 강대상 좌·우 스탠드 배너 2개 (image_44, 47 고증) */}
        <group position={[-2.25, 1.15, -1.25]}>
          <RoundedBox args={[0.72, 1.85, 0.05]} radius={0.01} castShadow>
            <meshStandardMaterial color="#1E293B" />
          </RoundedBox>
          <Html position={[0, 0, 0.04]} transform distanceFactor={5}>
            <div className="w-20 h-44 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-amber-400/40 rounded flex flex-col items-center justify-center p-2 text-center text-white pointer-events-none">
              <span className="text-[8px] text-amber-300 font-mono">VISION 2026</span>
              <span className="text-xs font-serif font-black mt-1 leading-tight">말씀과<br/>성령으로<br/>자라가는<br/>교회</span>
            </div>
          </Html>
        </group>

        <group position={[2.25, 1.15, -1.25]}>
          <RoundedBox args={[0.72, 1.85, 0.05]} radius={0.01} castShadow>
            <meshStandardMaterial color="#FDE68A" />
          </RoundedBox>
          <Html position={[0, 0, 0.04]} transform distanceFactor={5}>
            <div className="w-20 h-44 bg-gradient-to-b from-amber-50 via-orange-100 to-rose-100 border border-amber-300 rounded flex flex-col items-center justify-center p-2 text-center text-slate-900 pointer-events-none">
              <span className="text-[8px] text-rose-600 font-black">WELCOME</span>
              <span className="text-xs font-serif font-black mt-1 leading-tight text-amber-950">좋은나무<br/>새가족을<br/>축복합니다</span>
            </div>
          </Html>
        </group>

        {/* 중앙 원목 강대상(Pulpit) & 강단 꽃꽂이 화분 (image_44, 47) */}
        <RoundedBox args={[0.98, 0.96, 0.58]} position={[0, 0.84, 0.15]} radius={0.025} castShadow>
          <meshStandardMaterial color="#B45309" roughness={0.45} />
        </RoundedBox>
        <RoundedBox args={[1.12, 0.08, 0.68]} position={[0, 1.34, 0.15]} radius={0.02} castShadow>
          <meshStandardMaterial color="#92400E" />
        </RoundedBox>
        {/* 강대상 앞 꽃꽂이 */}
        <mesh position={[0, 0.55, 0.55]} castShadow>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial color="#F43F5E" />
        </mesh>

        {/* 무대 앞 찬양 인도자 마이크 스탠드 3개 & 바닥 블랙 모니터 스피커 4대 (image_47) */}
        {[-1.25, 0, 1.25].map((mx, i) => (
          <group key={`mic_${i}`} position={[mx, 0.36, 1.1]}>
            <mesh position={[0, 0.52, 0]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 1.05, 10]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
              <meshStandardMaterial color="#18181B" />
            </mesh>
          </group>
        ))}
        {[-2.4, -0.85, 0.85, 2.4].map((wx, i) => (
          <RoundedBox
            key={`wedge_${i}`}
            args={[0.48, 0.24, 0.34]}
            position={[wx, 0.46, 1.42]}
            rotation={[-0.35, 0, 0]}
            radius={0.02}
            castShadow
          >
            <meshStandardMaterial color="#111827" />
          </RoundedBox>
        ))}

        {/* 강단 좌측: 원목 성찬/헌금 테이블 & 예배위원 장의자 (image_47 좌측) */}
        <RoundedBox args={[1.25, 0.78, 0.65]} position={[-3.8, 0.39, 1.95]} radius={0.02} castShadow>
          <meshStandardMaterial color="#C27838" />
        </RoundedBox>
        <RoundedBox args={[0.48, 0.92, 0.48]} position={[-4.55, 0.46, 1.95]} radius={0.02} castShadow>
          <meshStandardMaterial color="#B45309" />
        </RoundedBox>

        {/* 강단 우측: 투명 아크릴 드럼 쉴드(차음벽) + 드럼 세트 + 찬양단 건반석 (image_44, 47 우측) */}
        <group position={[3.6, 0.36, -0.3]}>
          {/* 5각 투명 아크릴 드럼 차음벽 */}
          <mesh position={[0, 0.68, 0.35]}>
            <cylinderGeometry args={[0.88, 0.88, 1.35, 6, 1, true, -Math.PI * 0.65, Math.PI * 1.3]} />
            <meshStandardMaterial color="#BAE6FD" transparent opacity={0.38} side={THREE.DoubleSide} />
          </mesh>
          {/* 드럼 킥 & 탐 & 심벌즈 */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.42, 18]} />
            <meshStandardMaterial color="#7F1D1D" />
          </mesh>
          <mesh position={[-0.32, 0.65, 0.15]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.32, 0.68, 0.15]}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
            <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* 무대 아래 우측 앞: 찬양팀 신디사이저 건반 2대 & 우퍼 스피커 (image_47 우측 하단) */}
        <RoundedBox args={[1.35, 0.1, 0.42]} position={[3.6, 0.72, 2.35]} radius={0.015} castShadow>
          <meshStandardMaterial color="#18181B" />
        </RoundedBox>
        <RoundedBox args={[0.62, 0.68, 0.52]} position={[3.5, 0.34, 1.55]} radius={0.02} castShadow>
          <meshStandardMaterial color="#0F172A" />
        </RoundedBox>

        {/* 💡 천장 2단 동심원 간접조명 우물천장(Cove Lighting) & 매달린 대형 라인어레이 스피커 2대 (image_44 핵심!) */}
        <group position={[0, 4.75, 0.2]}>
          <mesh>
            <cylinderGeometry args={[2.95, 2.95, 0.16, 40]} />
            <meshStandardMaterial color="#F5F5F4" />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[2.35, 2.35, 0.14, 40]} />
            <meshStandardMaterial color="#FEF3C7" emissive="#F59E0B" emissiveIntensity={0.75} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[1.85, 1.85, 0.1, 40]} />
            <meshStandardMaterial color="#FAFAF9" />
          </mesh>
        </group>

        {/* 천장 좌·우 플라잉 메인 스피커 (image_44, 47) */}
        {[-2.65, 2.65].map((sx, idx) => (
          <group key={`fly_spk_${idx}`} position={[sx, 3.85, 0.85]}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
            <RoundedBox args={[0.58, 0.82, 0.52]} position={[0, 0, 0]} rotation={[0.22, 0, 0]} radius={0.03} castShadow>
              <meshStandardMaterial color="#0F172A" roughness={0.3} />
            </RoundedBox>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 🪑 3. 성도석 원목+가죽쿠션 장의자(Pews) 3블록 x 6열 (클릭 시 착석 모션!) */}
      {/* ================================================================= */}
      {PEW_ROWS.map((rz, rIdx) =>
        PEW_COLS.map((col) => {
          const pewKey = `${col.colId}_${rIdx}`;
          const isWelcomeBannerPew = col.colId === 'C' && (rIdx === 1 || rIdx === 2);
          const isCurrentSeatedPew =
            seatedInfo && Math.abs(seatedInfo.z - rz) < 0.25 && Math.abs(seatedInfo.x - col.x) < col.width * 0.6;

          return (
            <group
              key={pewKey}
              position={[col.x, 0, rz]}
              onClick={(e) => {
                e.stopPropagation();
                // 클릭한 의자의 정확한 위치로 착석!
                const clickX = Math.max(col.x - col.width * 0.38, Math.min(col.x + col.width * 0.38, e.point.x));
                onSitOnPew({
                  x: clickX,
                  z: rz - 0.06,
                  rowLabel: `${rIdx + 1}열 ${col.name}`
                });
              }}
            >
              {/* 1) 등받이 원목 프레임 & 뒷면 3칸 웨인스코팅 패널 디테일 (image_46 완벽 고증!) */}
              <RoundedBox args={[col.width, 0.84, 0.08]} position={[0, 0.44, 0.22]} radius={0.015} castShadow receiveShadow>
                <meshStandardMaterial color={isCurrentSeatedPew ? '#D97706' : '#C88A52'} roughness={0.45} />
              </RoundedBox>
              {/* 뒷면 토프 브라운 3분할 패널 (image_46에 보이는 의자 뒷면 디자인) */}
              <RoundedBox args={[col.width - 0.18, 0.58, 0.02]} position={[0, 0.42, 0.265]} radius={0.005}>
                <meshStandardMaterial color="#8C7A6B" roughness={0.65} />
              </RoundedBox>

              {/* 2) 푹신한 토프 브라운 가죽 방석 & 등받이 쿠션 (image_46, 48) */}
              <RoundedBox args={[col.width - 0.12, 0.11, 0.44]} position={[0, 0.36, -0.02]} radius={0.025} castShadow receiveShadow>
                <meshStandardMaterial color="#7C6D61" roughness={0.6} />
              </RoundedBox>
              <RoundedBox args={[col.width - 0.12, 0.46, 0.07]} position={[0, 0.58, 0.16]} radius={0.02} castShadow>
                <meshStandardMaterial color="#8A796D" roughness={0.6} />
              </RoundedBox>

              {/* 3) 양끝 두꺼운 원목 측판(팔걸이) & 성경/주보 선반 */}
              <RoundedBox args={[0.08, 0.88, 0.56]} position={[-col.width / 2 + 0.04, 0.44, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#C88A52" />
              </RoundedBox>
              <RoundedBox args={[0.08, 0.88, 0.56]} position={[col.width / 2 - 0.04, 0.44, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#C88A52" />
              </RoundedBox>

              {/* 4) image_46에 찍힌 '좋은나무교회 환영합니다' 새가족 환영 커버 배너 */}
              {isWelcomeBannerPew && (
                <group position={[0, 0.78, 0.19]}>
                  <RoundedBox args={[col.width - 0.4, 0.22, 0.11]} radius={0.01}>
                    <meshStandardMaterial color="#FFFFFF" />
                  </RoundedBox>
                  <Html position={[0, 0.02, -0.06]} transform rotation={[0, 0, 0]} distanceFactor={6}>
                    <div className="bg-white/95 border border-emerald-400 px-3 py-0.5 rounded shadow-2xs flex items-center gap-2 whitespace-nowrap pointer-events-none">
                      <span className="text-[9px] font-black text-emerald-700">🌳 좋은나무교회</span>
                      <span className="text-[9.5px] font-serif font-black text-rose-600">환영합니다 (새가족석)</span>
                    </div>
                  </Html>
                </group>
              )}
            </group>
          );
        })
      )}

      {/* ================================================================= */}
      {/* 🏢 4. 좌·우·후면 2층 발코니(유리 난간) & 후면 방송실 유리창 & 보조 모니터 (image_46, 48) */}
      {/* ================================================================= */}
      {/* 좌측 벽면 (하단 화이트 몰딩 + 상단 우드 방음패널 + 2층 발코니 유리 난간) */}
      <RoundedBox args={[0.2, 4.6, 15.6]} position={[-6.95, 2.3, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial color="#E6CCB2" roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[0.08, 1.1, 15.5]} position={[-6.82, 0.55, 0]} radius={0.01}>
        <meshStandardMaterial color="#F8FAFC" />
      </RoundedBox>
      {/* 좌측 2층 발코니 돌출부 & 유리 난간 (image_44 좌상단) */}
      <RoundedBox args={[1.4, 0.42, 10.5]} position={[-6.2, 2.65, 0.5]} radius={0.02} castShadow>
        <meshStandardMaterial color="#EDE0D4" />
      </RoundedBox>
      <mesh position={[-5.55, 3.12, 0.5]}>
        <boxGeometry args={[0.04, 0.55, 10.4]} />
        <meshStandardMaterial color="#BAE6FD" transparent opacity={0.42} />
      </mesh>
      <RoundedBox args={[0.06, 0.05, 10.4]} position={[-5.55, 3.4, 0.5]} radius={0.01}>
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
      </RoundedBox>

      {/* 후면(남쪽) 1층 로비 벽 & 2층 발코니 & 4층 방송실 유리창 & 중앙 보조 TV (image_46, 48 완벽 고증!) */}
      <RoundedBox args={[14.2, 4.6, 0.2]} position={[0, 2.3, 7.7]} radius={0.02} receiveShadow>
        <meshStandardMaterial color="#E6CCB2" roughness={0.75} />
      </RoundedBox>
      {/* 후면 2층 발코니 난간 & 중앙에 걸린 보조 모니터 (image_48 상단 중앙!) */}
      <RoundedBox args={[13.8, 0.45, 2.1]} position={[0, 2.65, 6.6]} radius={0.02} castShadow>
        <meshStandardMaterial color="#EDE0D4" />
      </RoundedBox>
      <RoundedBox args={[1.6, 0.9, 0.08]} position={[0, 2.72, 5.5]} radius={0.02} castShadow>
        <meshStandardMaterial color="#0F172A" />
      </RoundedBox>
      {/* 후면 2층 위쪽 4층 방송실 연속 유리창 (image_48 좌상단 검은 프레임 유리창) */}
      <mesh position={[0, 3.75, 7.55]}>
        <boxGeometry args={[9.2, 1.35, 0.06]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.38} />
      </mesh>

      {/* 후면 1층 좌측 다단 신발장 & 스탠드 에어컨 & 우측 출입문 화환 (image_46, 48) */}
      <RoundedBox args={[1.85, 1.55, 0.38]} position={[-4.5, 0.78, 7.35]} radius={0.02} castShadow>
        <meshStandardMaterial color="#B45309" />
      </RoundedBox>
      <RoundedBox args={[0.52, 1.85, 0.45]} position={[-5.8, 0.92, 7.25]} radius={0.02} castShadow>
        <meshStandardMaterial color="#F8FAFC" />
      </RoundedBox>
      {/* 후면 우측 문 앞 축하 화환 (image_46 우측 끝) */}
      <group position={[5.2, 0, 7.1]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <torusGeometry args={[0.36, 0.11, 12, 24]} />
          <meshStandardMaterial color="#EC4899" />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.04, 0.25, 1.1, 8]} />
          <meshStandardMaterial color="#16A34A" />
        </mesh>
      </group>

      {/* 5. 전 층 공통 계단실 모듈 & IDF 코너 소화기 결합! */}
      <StairwellCore3D
        currentFloor="3F"
        position={[-5.4, 0, 4.8]}
        onClickStairs={() => onSelectZone(ZONES_3F[5])}
        onClickExtinguisher={() =>
          onSelectZone({
            badge: '3F 소방안전 설비',
            title: '🧯 3F 대예배당 계단실 코너 소화기 & IDF 단자함',
            desc: '전 층 공통 계단실 입구 코너에 비치되어 있는 초기 진화용 분말 소화기입니다.'
          })
        }
      />

      {/* 6. 바닥 초록색 원형 체험존 마커 (01 ~ 06) */}
      {ZONES_3F.map((z) => {
        const isSelected = activeZoneId === z.id;
        return (
          <group
            key={z.id}
            position={z.pos}
            onClick={(e) => {
              e.stopPropagation();
              if (z.isSeatZone && z.seatTarget) {
                onSitOnPew(z.seatTarget);
              } else {
                onSelectZone(z);
              }
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
// 🚶🪑 3D 블록형 플레이어 아바타 (보행 애니메이션 + 의자 앉기 모션 포함!)
// =====================================================================
function PlayerAvatar3F({
  targetPos,
  seatedInfo,
  playerName,
  activeZone,
  onOpenZoneModal,
  onSitOnPew,
  onStandUp,
  onPositionUpdate
}) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const posRef = useRef([0, 0, 2.2]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 🪑 1) 의자에 착석한 상태일 때: 해당 장의자 방석 위치에 고정 + 정면 강대상(북쪽, rotation.y = Math.PI) 응시 + 다리 90도 굽힘!
    if (seatedInfo) {
      posRef.current = [seatedInfo.x, 0.22, seatedInfo.z];
      groupRef.current.position.lerp(new THREE.Vector3(seatedInfo.x, 0.22, seatedInfo.z), 0.2);
      groupRef.current.rotation.y = Math.PI; // 정면 강대상 & 스크린 방향 바라보기
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = -Math.PI / 2.1;
        rightLegRef.current.rotation.x = -Math.PI / 2.1;
        leftLegRef.current.position.set(-0.09, 0.18, -0.12);
        rightLegRef.current.position.set(0.09, 0.18, -0.12);
      }
      return;
    }

    // 🚶 2) 서서 걸어 다니는 상태일 때
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.position.set(-0.09, 0.14, 0);
      rightLegRef.current.position.set(0.09, 0.14, 0);
    }

    const [cx, , cz] = posRef.current;
    const [tx, , tz] = targetPos;
    const dx = tx - cx;
    const dz = tz - cz;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, delta * 4.0);
      const nx = cx + (dx / dist) * step;
      const nz = cz + (dz / dist) * step;
      posRef.current = [nx, 0, nz];
      const walkSwing = Math.sin(state.clock.elapsedTime * 12);
      groupRef.current.position.set(nx, Math.abs(walkSwing) * 0.05, nz);
      groupRef.current.rotation.y = Math.atan2(dx, dz);
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = walkSwing * 0.5;
        rightLegRef.current.rotation.x = -walkSwing * 0.5;
      }
      onPositionUpdate(nx, nz);
    } else {
      groupRef.current.position.y = 0;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2.2]}>
      {/* 왼다리 / 오른다리 (착석 시 90도 굽혀짐) */}
      <RoundedBox ref={leftLegRef} args={[0.13, 0.26, 0.14]} position={[-0.09, 0.14, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>
      <RoundedBox ref={rightLegRef} args={[0.13, 0.26, 0.14]} position={[0.09, 0.14, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>

      {/* 몸통 */}
      <RoundedBox args={[0.38, 0.44, 0.24]} position={[0, 0.46, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color="#38BDF8" />
      </RoundedBox>
      {/* 머리 */}
      <RoundedBox args={[0.42, 0.38, 0.38]} position={[0, 0.86, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color="#FDE68A" />
      </RoundedBox>
      {/* 헤어 블록 */}
      <RoundedBox args={[0.45, 0.14, 0.41]} position={[0, 1.06, 0]} radius={0.03} castShadow>
        <meshStandardMaterial color="#B45309" />
      </RoundedBox>

      {/* 머리 위 네임태그 & 착석/상호작용 말풍선 */}
      <Html position={[0, 1.5, 0]} center distanceFactor={8}>
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto select-none">
          {seatedInfo ? (
            <div
              onClick={onStandUp}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-full shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap animate-bounce"
            >
              <span className="text-xs font-black">🙏 {seatedInfo.rowLabel} 예배 중 (클릭 시 일어나기)</span>
            </div>
          ) : (
            activeZone && (
              <div
                onClick={() => {
                  if (activeZone.isSeatZone && activeZone.seatTarget) {
                    onSitOnPew(activeZone.seatTarget);
                  } else {
                    onOpenZoneModal(activeZone);
                  }
                }}
                className="bg-white/95 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-full shadow-xl border-2 border-emerald-500 flex items-center gap-2 cursor-pointer whitespace-nowrap animate-bounce"
              >
                <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono font-black text-[11px] flex items-center justify-center">
                  E
                </span>
                <span className="text-xs font-black">{activeZone.prompt}</span>
              </div>
            )
          )}
          <div className="bg-white/95 text-slate-900 px-3 py-1 rounded-full shadow-md border border-slate-300 flex items-center gap-1.5 whitespace-nowrap">
            <span className={`w-2.5 h-2.5 rounded-full ${seatedInfo ? 'bg-amber-500 animate-ping' : 'bg-blue-600'}`} />
            <span className="text-[11px] font-black">나 · {playerName}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// =====================================================================
// 🎥 착석 시 정면 설교 스크린을 바라보는 '예배 시점' 자동 카메라 리그
// =====================================================================
function WorshipCameraRig({ seatedInfo, controlsRef }) {
  useFrame((state) => {
    if (!controlsRef.current) return;
    const cam = state.camera;

    if (seatedInfo) {
      // 의자에 앉으면 캐릭터 뒤쪽 위에서 정면 대형 스크린(z: -6.8)을 바라보도록 부드럽게 줌인!
      const desiredCamPos = new THREE.Vector3(seatedInfo.x * 0.4, 3.8, seatedInfo.z + 5.8);
      const desiredTarget = new THREE.Vector3(0, 2.3, -6.2);
      cam.position.lerp(desiredCamPos, 0.06);
      cam.zoom = THREE.MathUtils.lerp(cam.zoom, 78, 0.06);
      cam.updateProjectionMatrix();
      controlsRef.current.target.lerp(desiredTarget, 0.08);
      controlsRef.current.update();
    }
  });
  return null;
}

export default function Sanctuary3F({ setActiveScreen, onChangeFloor, onExitHome }) {
  const authUser = useAppStore(state => state.authUser);
  const playerName = authUser?.name || localStorage.getItem('login_user_name') || '단단한 관제탑';

  const controlsRef = useRef();
  const initialSermon = useMemo(() => getSyncedSermonVideo(), []);

  const [targetPos, setTargetPos] = useState([0, 0, 2.2]);
  const [seatedInfo, setSeatedInfo] = useState(null); // { x, z, rowLabel }
  const [activeZone, setActiveZone] = useState(ZONES_3F[1]);
  const [modalZone, setModalZone] = useState(null);

  // 예배노트 연동 유튜브 상태
  const [videoUrlInput, setVideoUrlInput] = useState(initialSermon.url);
  const [youtubeId, setYoutubeId] = useState(initialSermon.id);
  const [sermonTitle, setSermonTitle] = useState(initialSermon.title);
  const [isScreenPlaying, setIsScreenPlaying] = useState(Boolean(initialSermon.id));
  const [showVideoModal, setShowVideoModal] = useState(false);

  // 의자에 앉는 함수 (착석 즉시 정면 스크린 설교 재생!)
  const handleSitOnPew = (seatData) => {
    setSeatedInfo(seatData);
    setTargetPos([seatData.x, 0, seatData.z]);
    if (youtubeId) {
      setIsScreenPlaying(true);
    }
  };

  // 자리에서 일어나는 함수
  const handleStandUp = () => {
    setSeatedInfo(null);
  };

  // 키보드 E키로 즉시 착석/일어나기 토글
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e') {
        if (seatedInfo) {
          handleStandUp();
        } else {
          handleSitOnPew({ x: 0, z: -0.95, rowLabel: '중앙 새가족 환영석 (2열)' });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seatedInfo]);

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
    const found = ZONES_3F.find(z => Math.hypot(px - z.pos[0], pz - z.pos[2]) < 1.25) || null;
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  };

  return (
    <div className="w-full h-full relative bg-[#D4DDD8] overflow-hidden select-none font-sans">
      {/* ── 좌측 상단: 3층 대예배당 안내 & 착석/설교 제어 바 ── */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={onExitHome}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          ◀ 홈으로
        </button>

        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-lg flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-[#0F172A] text-white font-black text-xs">3F</span>
          <div>
            <div className="text-xs font-black text-slate-900">대예배당 본당 (예배노트 유튜브 연동)</div>
            <div className="text-[10px] text-slate-500">
              장의자를 클릭하면 자리에 앉아 정면 스크린으로 예배를 시청합니다
            </div>
          </div>
        </div>

        {/* 🪑 원터치 착석 / 기립 토글 버튼 */}
        {seatedInfo ? (
          <button
            onClick={handleStandUp}
            className="px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5 animate-pulse"
          >
            🚶 자리에서 일어나기 ({seatedInfo.rowLabel})
          </button>
        ) : (
          <button
            onClick={() => handleSitOnPew({ x: 0, z: -0.95, rowLabel: '중앙 새가족 환영석 (2열)' })}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            🪑 새가족 환영석에 앉아 예배드리기
          </button>
        )}

        <button
          onClick={() => setShowVideoModal(true)}
          className="px-3 py-2 rounded-2xl bg-slate-900/85 hover:bg-slate-900 text-amber-300 text-xs font-bold shadow-lg border border-white/15 cursor-pointer"
        >
          📺 본당 스크린 유튜브 링크 변경
        </button>

        <button
          onClick={() => setActiveScreen && setActiveScreen('sermon')}
          className="px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg cursor-pointer"
        >
          📝 예배노트 열기
        </button>
      </div>

      {/* ── 우측 상단: 3층 본당 구역 바로가기 미니 리모컨 ── */}
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white shadow-2xl flex flex-col gap-1 w-52 pointer-events-auto">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1">🗺️ 3F 본당 주요 구역</span>
        {ZONES_3F.map(z => (
          <button
            key={z.id}
            onClick={() => {
              if (z.isSeatZone && z.seatTarget) {
                handleSitOnPew(z.seatTarget);
              } else {
                setSeatedInfo(null);
                setTargetPos([z.pos[0], 0, z.pos[2]]);
                setActiveZone(z);
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-600/40 text-left text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="truncate">{z.badge}</span>
            <span className="text-[9.5px] font-mono text-emerald-300">{z.code}</span>
          </button>
        ))}
      </div>

      {/* ── 메인 2.5D 아이소메트릭 WebGL 3D 캔버스 ── */}
      <Canvas shadows>
        <OrthographicCamera makeDefault position={[11, 12, 12]} zoom={48} near={-50} far={200} />
        <ambientLight intensity={0.88} />
        <directionalLight position={[8, 15, 8]} intensity={1.15} castShadow />

        {/* 착석 시 예배 스크린 시점으로 부드럽게 이동하는 카메라 리그 */}
        <WorshipCameraRig seatedInfo={seatedInfo} controlsRef={controlsRef} />

        {/* 바닥 클릭 시 일어나서 해당 지점으로 걸어가기 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (seatedInfo) setSeatedInfo(null);
            const cx = Math.max(-5.8, Math.min(5.8, e.point.x));
            const cz = Math.max(-3.6, Math.min(6.2, e.point.z));
            setTargetPos([cx, 0, cz]);
          }}
        >
          <planeGeometry args={[14.0, 15.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <SanctuaryDetailedArchitecture
          activeZoneId={activeZone?.id}
          onSelectZone={(z) => {
            setSeatedInfo(null);
            if (z.pos) setTargetPos([z.pos[0], 0, z.pos[2]]);
            setModalZone(z);
          }}
          seatedInfo={seatedInfo}
          onSitOnPew={handleSitOnPew}
          youtubeId={youtubeId}
          isScreenPlaying={isScreenPlaying}
          setIsScreenPlaying={setIsScreenPlaying}
          sermonTitle={sermonTitle}
          onOpenVideoSetting={() => setShowVideoModal(true)}
        />

        <PlayerAvatar3F
          targetPos={targetPos}
          seatedInfo={seatedInfo}
          playerName={playerName}
          activeZone={activeZone}
          onOpenZoneModal={(z) => setModalZone(z)}
          onSitOnPew={handleSitOnPew}
          onStandUp={handleStandUp}
          onPositionUpdate={handlePositionUpdate}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={20} blur={2} far={4} />
        <MapControls
          ref={controlsRef}
          enableRotate={true}
          enableZoom={true}
          minZoom={30}
          maxZoom={110}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>

      {/* ── 본당 스크린 유튜브 링크 설정 모달 (예배노트와 양방향 연동) ── */}
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
            <p className="text-xs text-slate-300 leading-relaxed">
              예배노트(Sermon)의 유튜브 링크와 자동 연동됩니다. 아래에 주일 예배 또는 설교 유튜브 주소를 붙여넣으시면 본당 정면 대형 스크린에서 즉시 상영됩니다.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">설교 제목 (스크린 대기화면 표시용)</label>
              <input
                type="text"
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                placeholder="예: 기적이 상식이 되는 5일의 기도"
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-xs outline-none"
              />
              <label className="text-[11px] font-bold text-slate-300 block pt-1">유튜브 영상 링크 (URL)</label>
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtu.be/... 또는 https://www.youtube.com/watch?v=..."
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

      {/* ── 구역 상세 안내 모달 ── */}
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

            {modalZone.isElevator && onChangeFloor && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-emerald-300 block">🛗 다른 층으로 이동하기:</span>
                {[
                  { fl: '1F', label: '1F 메인 로비 & 주차장' },
                  { fl: '3F', label: '3F 대예배당 (현재 층)' },
                  { fl: '4F', label: '4F 방송실 · 영유아실' },
                  { fl: '5F', label: '5F 식당 · 새가족실 · 연습실' },
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
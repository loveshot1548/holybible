// src/components/ChurchSketchIcon.js
import React, { useState } from 'react';

const SKETCH_SVG_BASE = '/church_sketch_icon_set_complete/church_sketch_icons_complete/svg';

// 실제 보유하신 49개 SVG 파일명 100% 정밀 매칭
export const SKETCH_ICON_FILES = {
  // 1. 공통 및 네비게이션
  calendar: 'calendar.svg',
  download: 'download.svg',
  upload: 'upload.svg',
  share: 'share.svg',
  search: 'search.svg',
  settings: 'settings.svg',
  sliders: 'sliders.svg',
  check: 'check.svg',
  pin: 'pin.svg',
  lock: 'lock.svg',
  trash: 'trash.svg',
  clock: 'clock.svg',
  bell: 'bell.svg',
  externalLink: 'external-link.svg',
  folder: 'folder.svg',
  clipboard: 'clipboard.svg',

  // 2. 오늘의 신앙 루틴 5종 (감사 · 성경 · 큐티 · 기도 · 가정예배)
  thanks: 'hand-heart.svg',         // 감사 (마음을 담은 손길)
  bible: 'bible.svg',               // 성경 (성경책)
  qt: 'flame.svg',                  // 큐티 (말씀의 불꽃)
  prayer: 'prayer-hands.svg',       // 기도 (모은 기도손)
  family: 'church-home.svg',        // 가정예배 (가정 교회)

  // 3. 말씀과 기록 & 공동체 메뉴
  home: 'home.svg',                 // 홈
  church: 'church.svg',             // 교회/예배
  mcheyne: 'book-open.svg',         // 맥체인 성경읽기
  sermon: 'notebook.svg',           // 예배 노트 작성
  note: 'pencil.svg',               // 자유 말씀 노트
  diary: 'heart-double.svg',        // 감사 및 간증 일기 (겹하트)
  cell: 'group.svg',                // 목장 나눔 (소그룹)
  board: 'heart-plus.svg',          // 공동체 게시판 (사랑 나눔)
  communityThanks: 'heart.svg',     // 상단 공동체 감사 버튼
  communityPrayer: 'prayer-hands.svg', // 상단 공동체 기도 버튼
  message: 'message.svg',           // 소통/상담
  mail: 'mail.svg',                 // 편지/소식
  microphone: 'microphone.svg',     // 음성/설교

  // 4. 성경 연구 및 양육·훈련 도구
  practice: 'leaf.svg',             // 삶의 적용과 실천 (열매/잎사귀)
  galaxy: 'globe.svg',              // 지식 은하계 / 열방
  qtAnalytics: 'pie-chart.svg',     // 큐티 심층 분석
  sermonAnalytics: 'chart.svg',     // 설교 분석
  tracker: 'trophy.svg',            // 적용 트래커 (완주/성취)
  wiki: 'compass.svg',              // 성경 위키 (나침반)
  interlinear: 'bookmark.svg',      // 원어 성경 (책갈피 정독)
  curriculum: 'cross.svg',          // 양육 커리큘럼 (십자가 훈련)
  youth: 'sprout.svg',              // 청소년 10주 양육 (새싹)
  workbook: 'clipboard.svg',        // 4주 심화 워크북
  jericho: 'people.svg',            // 여리고 땅밟기 (함께 걷는 공동체)
  tour: 'church.svg',               // 가상교회 투어
  gift: 'gift.svg',                 // 은혜/축복
  star: 'star.svg',                 // 암송/핵심
  shield: 'shield.svg',             // 믿음의 방패
  user: 'user.svg',                 // 개인/마이
  userAdd: 'user-add.svg'           // 새가족/초대
};

export default function ChurchSketchIcon({
  name,
  fallback: FallbackIcon,
  className = 'w-5 h-5',
  isDarkMode = false,
  invertOnActive = false
}) {
  const [imgError, setImgError] = useState(false);
  const fileName = SKETCH_ICON_FILES[name];

  if (!fileName || imgError) {
    return FallbackIcon ? <FallbackIcon className={className} /> : null;
  }

  return (
    <img
      src={`${SKETCH_SVG_BASE}/${fileName}`}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} object-contain select-none pointer-events-none transition-all ${
        invertOnActive ? 'brightness-0 invert' : isDarkMode ? 'invert opacity-90' : 'opacity-90'
      }`}
    />
  );
}
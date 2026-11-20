// src/components/ChurchSketchIcon.js
import React, { useState } from 'react';

const BASE_PATH = '/church_sketch_icon_set_complete/church_sketch_icons_complete/svg';

// 앱 전역 키 + 디렉터리 65개 SVG 전체 매핑 (11/20 최신 세트 우선 적용)
const ICON_MAP = {
  // 1. 상단 · 네비게이션 · 홈
  home: 'home',
  calendar: 'calendar',
  tour: 'church',
  virtualChurch: 'church',
  houseChurch: 'house-church',
  bell: 'bell',
  settings: 'settings',
  search: 'search',

  // 2. 영적5종세트
  thanks: 'hand-heart',
  bible: 'bible',
  qt: 'flame',
  prayer: 'prayer-hands',
  family: 'family',

  // 3. 말씀과 기록
  mcheyne: 'book-open',
  note: 'note',
  sermon: 'sermon',
  diary: 'prayer-journal',
  cell: 'community',
  board: 'chat',

  // 4. 성경 연구 및 훈련 (13개 메뉴)
  practice: 'target',
  galaxy: 'globe',
  qtAnalytics: 'pie-chart',
  sermonAnalytics: 'chart',
  tracker: 'check-circle',
  wiki: 'compass',
  interlinear: 'scroll',
  curriculum: 'cross-book',
  youth: 'sprout',
  workbook: 'pencil',
  jericho: 'pin',

  // 5. 디렉터리 내 전체 65개 파일 직접 호출 지원
  'book-open': 'book-open',
  bookmark: 'bookmark',
  chart: 'chart',
  chat: 'chat',
  'check-circle': 'check-circle',
  check: 'check',
  'church-home': 'church-home',
  church: 'church',
  clipboard: 'clipboard',
  clock: 'clock',
  community: 'community',
  compass: 'compass',
  'cross-book': 'cross-book',
  cross: 'cross',
  'double-heart': 'double-heart',
  download: 'download',
  'external-link': 'external-link',
  flame: 'flame',
  folder: 'folder',
  gift: 'gift',
  globe: 'globe',
  group: 'group',
  'hand-heart': 'hand-heart',
  headphones: 'headphones',
  'heart-double': 'heart-double',
  'heart-plus': 'heart-plus',
  heart: 'heart',
  'house-church': 'house-church',
  leaf: 'leaf',
  lock: 'lock',
  mail: 'mail',
  message: 'message',
  mic: 'mic',
  microphone: 'microphone',
  notebook: 'notebook',
  pencil: 'pencil',
  people: 'people',
  person: 'person',
  'pie-chart': 'pie-chart',
  pin: 'pin',
  play: 'play',
  'prayer-hands': 'prayer-hands',
  'prayer-journal': 'prayer-journal',
  scroll: 'scroll',
  share: 'share',
  shield: 'shield',
  sliders: 'sliders',
  sprout: 'sprout',
  star: 'star',
  target: 'target',
  trash: 'trash',
  tree: 'tree',
  trophy: 'trophy',
  upload: 'upload',
  'user-add': 'user-add',
  user: 'user',
  worship: 'worship'
};

export default function ChurchSketchIcon({
  name,
  fallback: FallbackIcon = null,
  className = 'w-6 h-6',
  isDarkMode = false,
  invertOnActive = false,
  alt = ''
}) {
  const [hasError, setHasError] = useState(false);

  const fileName = ICON_MAP[name] || name;
  const src = fileName ? `${BASE_PATH}/${fileName}.svg` : null;

  if (!src || hasError) {
    if (FallbackIcon) {
      return <FallbackIcon className={className} />;
    }
    return null;
  }

  const filterClass = invertOnActive || isDarkMode ? 'brightness-0 invert' : '';

  return (
    <img
      src={src}
      alt={alt || name || 'icon'}
      onError={() => setHasError(true)}
      className={`${className} object-contain select-none pointer-events-none ${filterClass}`}
      draggable={false}
    />
  );
}
// src/engine/TemplateMacro.js
import { useNLEStore } from '../store/useNLEStore';

// 프로급 시네마틱 템플릿 3대 프리셋 정의
const TEMPLATE_PRESETS = {
  grace_worship: {
    name: '오늘의 은혜 말씀 묵상',
    duration: 12.0,
    video: {
      scaling: 'fill',
      animation: 'zoomIn',
      color: { lift: -2, gamma: 108, gain: 95, saturation: 90, temperature: 6600, tint: 2 }
    },
    caption: {
      prefix: '오늘의 은혜 묵상',
      fontSize: 26,
      color: '#FFD700',
      strokeColor: '#3A2E00',
      strokeWidth: 2.0,
      backgroundColor: 'rgba(20, 15, 5, 0.75)',
      animation: 'popIn'
    },
    bgm: {
      name: '은혜로운 피아노 BGM',
      url: 'https://actions.google.com/sounds/v1/ambiences/relaxing_music.ogg',
      volume: 75
    }
  },
  reels_dynamic: {
    name: '바이럴 트렌디 릴스',
    duration: 10.0,
    video: {
      scaling: 'fill',
      animation: 'zoomIn',
      color: { lift: -5, gamma: 115, gain: 110, saturation: 130, temperature: 6100, tint: 5 }
    },
    caption: {
      prefix: 'DAILY REELS HIGHLIGHT',
      fontSize: 28,
      color: '#FFE600',
      strokeColor: '#000000',
      strokeWidth: 3.0,
      backgroundColor: 'transparent',
      animation: 'popIn'
    },
    bgm: {
      name: '트렌디 어쿠스틱 비트',
      url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_festival.ogg',
      volume: 80
    }
  },
  bible_quote: {
    name: '시네마틱 성구 암송',
    duration: 15.0,
    video: {
      scaling: 'fill',
      animation: 'zoomOut',
      color: { lift: 0, gamma: 100, gain: 100, saturation: 105, temperature: 6500, tint: 0 }
    },
    caption: {
      prefix: '말씀과 동행하는 하루',
      fontSize: 24,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2.5,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      animation: 'popIn'
    },
    bgm: {
      name: '평안한 앰비언트 힐링',
      url: 'https://actions.google.com/sounds/v1/ambiences/relaxing_music.ogg',
      volume: 70
    }
  }
};

/**
 * 🌟 다빈치 21 / 캡컷 프로 규격 스마트 템플릿 매크로 엔진
 * @param {Object|string} mediaOrTemplate - 미디어 객체 또는 템플릿 프리셋 키 ('reels_dynamic' 등)
 * @param {string} [optionalTemplateKey] - 선택적 템플릿 키
 */
export const applyGraceTemplate = (mediaOrTemplate, optionalTemplateKey = 'grace_worship') => {
  const state = useNLEStore.getState();
  const { addClipToTrack, setPlayhead, entities, mediaPool } = state;

  // 1. 파라미터 타입 지능형 판별 (문자열이 들어와도 크래시 100% 방지)
  let targetMedia = null;
  let templateKey = 'grace_worship';

  if (typeof mediaOrTemplate === 'string') {
    templateKey = mediaOrTemplate;
    // 문자열 ID가 들어온 경우 미디어 풀의 첫 번째 에셋 자동 탐색
    targetMedia = (mediaPool && mediaPool.length > 0) ? mediaPool[0] : null;
  } else if (mediaOrTemplate && typeof mediaOrTemplate === 'object') {
    targetMedia = mediaOrTemplate;
    if (optionalTemplateKey) templateKey = optionalTemplateKey;
  }

  // 템플릿 프리셋 선정 (폴백 적용)
  const preset = TEMPLATE_PRESETS[templateKey] || TEMPLATE_PRESETS.grace_worship;
  const templateDuration = preset.duration || 10.0;
  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  // 2. 미디어가 없으면 기본 시네마틱 비디오/이미지 플레이스홀더 자동 주입
  const resolvedMedia = targetMedia || {
    id: `media_grace_${Date.now()}`,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    type: 'image',
    name: '시네마틱 은혜 묵상 배경'
  };

  // 3. 필수 트랙(V1, T1, A2) 생성 보장
  const tracks = { ...(entities.tracks || {}) };
  if (!tracks['V1']) tracks['V1'] = { id: 'V1', name: 'V1', type: 'video', clipIds: [] };
  if (!tracks['T1']) tracks['T1'] = { id: 'T1', name: 'T1', type: 'text', clipIds: [] };
  if (!tracks['A2']) tracks['A2'] = { id: 'A2', name: 'A2', type: 'audio', clipIds: [] };

  useNLEStore.setState({ entities: { ...entities, tracks } });

  // 4. [V1 트랙] 메인 비디오/이미지 클립 배치 (트랜스폼 & 컬러 사이언스 완비)
  const videoClipId = `clip_v1_${Date.now()}`;
  addClipToTrack('V1', {
    id: videoClipId,
    mediaId: resolvedMedia.id,
    url: resolvedMedia.url,
    type: resolvedMedia.type || 'image',
    name: resolvedMedia.name || '은혜 비디오',
    start: 0,
    duration: templateDuration,
    speed: 1.0,
    scaling: preset.video.scaling,
    scale: 100,
    positionX: 0,
    positionY: 0,
    rotation: 0,
    opacity: 100,
    transform: { x: 0, y: 0, scale: 100, rotate: 0 },
    crop: { left: 0, right: 0, top: 0, bottom: 0 },
    gridConfig: { mode: 'single', rows: 1, cols: 1, gap: 0 },
    animation: preset.video.animation,
    transition: 'fade',
    transitionDuration: 0.8,
    color: preset.video.color,
    trackId: 'V1'
  });

  // 5. [T1 트랙] 시네마틱 타이포그래피 자막 배치
  const textClipId = `clip_t1_${Date.now()}`;
  addClipToTrack('T1', {
    id: textClipId,
    type: 'text',
    content: `${preset.caption.prefix}\n${todayStr}`,
    start: 0.3,
    duration: Math.min(6.0, templateDuration - 0.5),
    trackId: 'T1',
    style: {
      fontSize: preset.caption.fontSize,
      preset: 'editorial',
      color: preset.caption.color,
      strokeWidth: preset.caption.strokeWidth,
      strokeColor: preset.caption.strokeColor,
      backgroundColor: preset.caption.backgroundColor,
      align: 'center',
      lineHeight: 1.35
    },
    transform: { x: 0, y: 0, scale: 100, rotate: 0 },
    animation: preset.caption.animation
  });

  // 6. [A2 트랙] 배경음악(BGM) 배치 (스마트 더킹 DSP 규격에 맞춤)
  const bgmClipId = `clip_a2_${Date.now()}`;
  addClipToTrack('A2', {
    id: bgmClipId,
    type: 'audio',
    name: preset.bgm.name,
    url: preset.bgm.url,
    start: 0,
    duration: templateDuration,
    volume: preset.bgm.volume,
    speed: 1.0,
    autoDucking: true,
    duckingAmount: -18,
    duckingAttack: 120,
    duckingRelease: 350,
    trackId: 'A2'
  });

  // 7. 프로젝트 재생 길이 및 플레이헤드 0초 완벽 동기화
  const currentMax = state.projectDuration || 10;
  useNLEStore.setState({
    projectDuration: Math.max(currentMax, templateDuration),
    selectedClipId: videoClipId,
    playhead: 0,
    isPlaying: false
  });

  setPlayhead(0);
};
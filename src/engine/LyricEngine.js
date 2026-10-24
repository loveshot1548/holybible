// src/engine/LyricEngine.js
import { useNLEStore } from '../store/useNLEStore';

// 🌟 릴스/쇼츠 바이럴 자막 스타일 3대 프리셋
export const LYRIC_STYLE_PRESETS = {
  karaoke_neon: {
    fontSize: 28,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 3.0,
    backgroundColor: 'transparent',
    preset: 'karaoke',
    animation: 'popIn'
  },
  reels_badge: {
    fontSize: 24,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    preset: 'reels_caption',
    animation: 'slideUp'
  },
  cinematic_gold: {
    fontSize: 26,
    color: '#FFD700',
    strokeColor: '#3A2E00',
    strokeWidth: 2.0,
    backgroundColor: 'rgba(18, 14, 5, 0.8)',
    preset: 'editorial',
    animation: 'popIn'
  }
};

/**
 * 1. 🌟 범용 서브타이틀 파서 (LRC, SRT, WebVTT 자동 감지 및 초정밀 파싱)
 * @param {string} rawString - 가사 또는 자막 텍스트
 * @returns {Array<{time: number, endTime?: number, text: string}>}
 */
export const parseSubtitles = (rawString) => {
  if (!rawString || typeof rawString !== 'string') return [];
  const textContent = rawString.trim();

  // [A] SRT 또는 WebVTT 포맷 감지 (00:00:12,340 --> 00:00:15,670)
  if (textContent.includes('-->')) {
    return parseSRTorVTT(textContent);
  }

  // [B] 표준 LRC 포맷 파싱 ([00:12.30]가사)
  return parseLRC(textContent);
};

/**
 * 표준 LRC 파서 (멀티 타임스탬프, offset 태그 완벽 지원)
 */
export const parseLRC = (lrcString) => {
  if (!lrcString) return [];
  const lines = lrcString.split(/\r?\n/);
  const result = [];
  let globalOffsetSec = 0;

  // 1차 패스: [offset:+/-ms] 태그 추출
  lines.forEach(line => {
    const offsetMatch = line.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
    if (offsetMatch) {
      globalOffsetSec = parseInt(offsetMatch[1], 10) / 1000;
    }
  });

  // 2차 패스: 가사 및 타임스탬프 추출 (정규식 lastIndex 버그 완벽 수정)
  lines.forEach(line => {
    // ID 태그 제외 ([ti:], [ar:], [al:], [by:] 등)
    if (/^\[(ti|ar|al|by|offset|length):/i.test(line)) return;

    const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const times = [];
    let match;

    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        const msStr = match[3].padEnd(3, '0').slice(0, 3);
        ms = parseInt(msStr, 10) / 1000;
      }
      const totalSec = Math.max(0, min * 60 + sec + ms + globalOffsetSec);
      times.push(Number(totalSec.toFixed(2)));
    }

    const cleanLineText = line.replace(/\[.*?\]/g, '').trim();
    if (cleanLineText && times.length > 0) {
      times.forEach(t => result.push({ time: t, text: cleanLineText }));
    }
  });

  return result.sort((a, b) => a.time - b.time);
};

/**
 * SRT / WebVTT 전용 타임코드 파서
 */
function parseSRTorVTT(content) {
  const normalized = content.replace(/WEBVTT[^\n]*\n/, '').trim();
  const blocks = normalized.split(/\r?\n\r?\n/);
  const result = [];

  const timeRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{2,3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{2,3})/;

  blocks.forEach(block => {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let timeLine = lines.find(l => l.includes('-->'));
    if (!timeLine) return;

    const match = timeLine.match(timeRegex);
    if (!match) return;

    const parseSec = (h = '0', m, s, ms) => {
      const hours = parseInt(h || '0', 10);
      const minutes = parseInt(m, 10);
      const seconds = parseInt(s, 10);
      const milliseconds = parseInt(ms.padEnd(3, '0').slice(0, 3), 10) / 1000;
      return hours * 3600 + minutes * 60 + seconds + milliseconds;
    };

    const startTime = parseSec(match[1], match[2], match[3], match[4]);
    const endTime = parseSec(match[5], match[6], match[7], match[8]);

    const textLines = lines.filter(l => l !== timeLine && !/^\d+$/.test(l));
    const subtitleText = textLines.join('\n').trim();

    if (subtitleText) {
      result.push({
        time: Number(startTime.toFixed(2)),
        endTime: Number(endTime.toFixed(2)),
        text: subtitleText
      });
    }
  });

  return result.sort((a, b) => a.time - b.time);
}

/**
 * 2. 🌟 가사/자막 타임라인 트랙 자동 주입 엔진 (트랙 보장, 듀레이션 자동 확장, 인스펙터 연동)
 * @param {string} rawString - LRC, SRT, VTT 문자열
 * @param {Object} [options] - 주입 옵션
 * @param {string} [options.trackId='T1'] - 대상 트랙
 * @param {boolean} [options.clearExisting=true] - 기존 자막 트랙 초기화 여부
 * @param {string} [options.presetKey='karaoke_neon'] - 자막 스타일 프리셋
 * @param {number} [options.offsetSec=0] - 전체 시차 보정(초)
 * @returns {number} 주입된 자막 클립 개수
 */
export const injectLrcToTimeline = (rawString, options = {}) => {
  const {
    trackId = 'T1',
    clearExisting = true,
    presetKey = 'karaoke_neon',
    offsetSec = 0
  } = options;

  const parsed = parseSubtitles(rawString);
  if (parsed.length === 0) return 0;

  const state = useNLEStore.getState();
  const tracks = { ...(state.entities?.tracks || {}) };
  const clips = { ...(state.entities?.clips || {}) };

  // 1. 대상 트랙(T1 등) 존재 보장
  if (!tracks[trackId]) {
    tracks[trackId] = {
      id: trackId,
      name: trackId,
      type: 'text',
      clipIds: []
    };
  }

  // 2. 기존 트랙 클립 초기화 옵션 적용
  if (clearExisting && tracks[trackId].clipIds) {
    tracks[trackId].clipIds.forEach(id => {
      delete clips[id];
    });
    tracks[trackId].clipIds = [];
  }

  const selectedPreset = LYRIC_STYLE_PRESETS[presetKey] || LYRIC_STYLE_PRESETS.karaoke_neon;
  let maxEndTime = state.projectDuration || 10;
  const newClipIds = [];

  // 3. 자막 클립 생성 및 트랜스폼/스타일 완벽 주입
  parsed.forEach((item, idx) => {
    const nextItem = parsed[idx + 1];
    const clipStartTime = Math.max(0, item.time + offsetSec);

    // 노출 지속 시간 계산 (SRT 지정 종료시간 > 다음 가사 시작 전 > 기본 3.5초)
    let clipDuration = 3.5;
    if (item.endTime && item.endTime > item.time) {
      clipDuration = item.endTime - item.time;
    } else if (nextItem) {
      const diff = (nextItem.time + offsetSec) - clipStartTime;
      clipDuration = Math.min(6.0, Math.max(0.8, diff - 0.05));
    }

    const clipId = `lyric_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`;
    const clipEnd = clipStartTime + clipDuration;
    if (clipEnd > maxEndTime) maxEndTime = clipEnd;

    const newClip = {
      id: clipId,
      type: 'text',
      content: item.text,
      start: Number(clipStartTime.toFixed(2)),
      duration: Number(clipDuration.toFixed(2)),
      trackId,
      style: {
        fontSize: selectedPreset.fontSize,
        preset: selectedPreset.preset,
        color: selectedPreset.color,
        strokeColor: selectedPreset.strokeColor,
        strokeWidth: selectedPreset.strokeWidth,
        backgroundColor: selectedPreset.backgroundColor,
        align: 'center',
        lineHeight: 1.3
      },
      // 🌟 인스펙터와 뷰어 1:1 대응을 위한 트랜스폼 기본 객체 완비
      transform: { x: 0, y: 0, scale: 100, rotate: 0 },
      opacity: 100,
      animation: selectedPreset.animation || 'popIn'
    };

    clips[clipId] = newClip;
    newClipIds.push(clipId);
  });

  // 트랙 클립 ID 배열 갱신
  tracks[trackId].clipIds = clearExisting ? newClipIds : [...(tracks[trackId].clipIds || []), ...newClipIds];

  // 4. 프로젝트 전체 재생 시간 자동 확장 및 스토어 일괄 커밋
  useNLEStore.setState({
    entities: {
      ...state.entities,
      tracks,
      clips
    },
    projectDuration: Math.max(state.projectDuration || 10, Number(maxEndTime.toFixed(1)) + 1.0)
  });

  return parsed.length;
};

/**
 * 3. 🌟 타임라인 자막을 표준 LRC 파일 문자열로 역내보내기 (Export)
 * @param {string} [trackId='T1'] - 추출할 트랙
 * @returns {string} 완성된 .lrc 파일 문자열
 */
export const exportTimelineToLRC = (trackId = 'T1') => {
  const state = useNLEStore.getState();
  const track = state.entities?.tracks?.[trackId];
  if (!track || !track.clipIds) return '';

  const textClips = track.clipIds
    .map(id => state.entities.clips[id])
    .filter(c => c && c.type === 'text')
    .sort((a, b) => (a.start || 0) - (b.start || 0));

  let lrcOutput = `[ti:Reels Studio Lyric Export]\n[by:Reels Studio Pro]\n`;

  textClips.forEach(clip => {
    const s = Math.max(0, clip.start || 0);
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const ms = Math.floor((s % 1) * 100).toString().padStart(2, '0');
    const timeTag = `[${min}:${sec}.${ms}]`;
    
    // 여러 줄 자막 한 줄 치환
    const cleanContent = (clip.content || '').replace(/\r?\n/g, ' ');
    lrcOutput += `${timeTag}${cleanContent}\n`;
  });

  return lrcOutput;
};

/**
 * 4. 🌟 타임라인 자막을 표준 SRT 파일 문자열로 역내보내기 (Export)
 * @param {string} [trackId='T1'] - 추출할 트랙
 * @returns {string} 완성된 .srt 파일 문자열
 */
export const exportTimelineToSRT = (trackId = 'T1') => {
  const state = useNLEStore.getState();
  const track = state.entities?.tracks?.[trackId];
  if (!track || !track.clipIds) return '';

  const textClips = track.clipIds
    .map(id => state.entities.clips[id])
    .filter(c => c && c.type === 'text')
    .sort((a, b) => (a.start || 0) - (b.start || 0));

  const formatSrtTime = (sec) => {
    const s = Math.max(0, sec || 0);
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const min = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
    return `${hrs}:${min}:${sc},${ms}`;
  };

  let srtOutput = '';
  textClips.forEach((clip, idx) => {
    const startSec = clip.start || 0;
    const endSec = startSec + (clip.duration || 3.5);

    srtOutput += `${idx + 1}\n`;
    srtOutput += `${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n`;
    srtOutput += `${clip.content || ''}\n\n`;
  });

  return srtOutput;
};
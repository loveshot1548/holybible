// src/engine/OpenCapReelsEngine.js
import { useNLEStore } from '../store/useNLEStore';

// 🌟 릴스 핵심 이모지 사전 (단어가 감지되면 0.1초 만에 자동 팝업)
const EMOJI_KEYWORD_MAP = {
  '하나님': '✝️', '예수': '👑', '은혜': '🕊️', '말씀': '📖', '기도': '🙏', '성령': '🔥',
  '축복': '✨', '사랑': '❤️', '믿음': '🛡️', '빛': '💡', '회개': '💧', '승리': '🏆',
  '돈': '💰', '성공': '🚀', '시간': '⏳', '위험': '⚠️', '비밀': '🤫', '폭발': '💥',
  '심장': '💓', '최고': '🥇', '생각': '🧠', '시작': '🎬', '멈춰': '🛑', '불': '🔥'
};

// 🌟 바이럴 릴스 4대 자막 테마 프리셋
export const VIRAL_CAPTION_STYLES = {
  HORMOZI_NEON: {
    id: 'HORMOZI_NEON',
    name: '호르모지 네온 옐로우 (100만뷰 바이럴)',
    fontFamily: 'Montserrat, sans-serif',
    activeColor: '#FFE600',       // 현재 발화 단어: 네온 옐로우
    inactiveColor: '#FFFFFF',     // 대기 단어: 화이트
    strokeColor: '#000000',
    strokeWidth: 6,
    activeScale: 1.25,            // 현재 단어 1.25배 팝업 바운스
    boxBg: 'transparent',
    hasGlow: true,
    glowColor: 'rgba(255, 230, 0, 0.6)'
  },
  CYBERPUNK_CYAN: {
    id: 'CYBERPUNK_CYAN',
    name: '사이버펑크 네온 시안',
    fontFamily: 'sans-serif',
    activeColor: '#00E5FF',
    inactiveColor: '#E2E8F0',
    strokeColor: '#000000',
    strokeWidth: 5,
    activeScale: 1.2,
    boxBg: 'rgba(0,0,0,0.7)',
    hasGlow: true,
    glowColor: 'rgba(0, 229, 255, 0.7)'
  },
  MINIMAL_BOX: {
    id: 'MINIMAL_BOX',
    name: '알리 압달 클린 뱃지 (미니멀 다큐)',
    fontFamily: 'sans-serif',
    activeColor: '#000000',
    inactiveColor: 'rgba(0,0,0,0.5)',
    strokeColor: 'transparent',
    strokeWidth: 0,
    activeScale: 1.05,
    boxBg: '#FFFFFF',
    hasGlow: false
  },
  SERMON_HOLY_GOLD: {
    id: 'SERMON_HOLY_GOLD',
    name: '성경·설교 홀리 골드 뱃지',
    fontFamily: 'MaruBuri, serif',
    activeColor: '#FFD700',
    inactiveColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    activeScale: 1.18,
    boxBg: 'rgba(15, 23, 42, 0.85)',
    hasGlow: true,
    glowColor: 'rgba(255, 215, 0, 0.5)'
  }
};

export class OpenCapReelsEngine {

  /**
   * 1. 텍스트 및 오디오 타임라인 기반 Word-by-Word 토큰 자동 생성
   */
  static generateWordTokensFromSentence(sentence, startSec, durationSec) {
    if (!sentence || typeof sentence !== 'string') return [];
    const rawWords = sentence.trim().split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];

    const wordDuration = durationSec / rawWords.length;
    
    return rawWords.map((wordText, idx) => {
      let matchedEmoji = null;
      for (const [key, emoji] of Object.entries(EMOJI_KEYWORD_MAP)) {
        if (wordText.includes(key)) {
          matchedEmoji = emoji;
          break;
        }
      }

      return {
        id: `token_${idx}`,
        word: wordText,
        start: Number((startSec + (idx * wordDuration)).toFixed(2)),
        end: Number((startSec + ((idx + 1) * wordDuration)).toFixed(2)),
        emoji: matchedEmoji,
        emphasis: wordText.length >= 4 || matchedEmoji !== null
      };
    });
  }

  /**
   * 2. 무음 구간 0.1초 자동 점프컷 엔진
   */
  static async autoCutSilenceFromClip(clipId) {
    const state = useNLEStore.getState();
    const clip = state.entities.clips[clipId];
    if (!clip || !clip.url) return [];

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const response = await fetch(clip.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const threshold = 0.035; // 무음 임계값
      const minSilenceSamples = sampleRate * 0.25;

      let silences = [];
      let silenceStart = null;

      for (let i = 0; i < rawData.length; i += 512) {
        const amplitude = Math.abs(rawData[i]);
        if (amplitude < threshold) {
          if (silenceStart === null) silenceStart = i;
        } else {
          if (silenceStart !== null && (i - silenceStart) >= minSilenceSamples) {
            silences.push({
              start: silenceStart / sampleRate,
              end: i / sampleRate
            });
          }
          silenceStart = null;
        }
      }

      audioCtx.close();
      return silences;
    } catch (e) {
      return [];
    }
  }

  /**
   * 3. 3.6초 주기 다이내믹 펀치 줌 계산기
   */
  static calculateDynamicPunchZoom(currentTime, totalDuration) {
    const cycleSec = 3.6;
    const cycleIndex = Math.floor(currentTime / cycleSec);
    const isZoomed = cycleIndex % 2 === 1;

    if (!isZoomed) {
      return { scale: 1.0, offsetX: 0, offsetY: 0 };
    }

    return {
      scale: 1.18,
      offsetX: 0,
      offsetY: -35
    };
  }

  /**
   * 4. 캔버스 실시간 호르모지 키네틱 자막 렌더러
   */
  static renderKineticReelsCaptions(ctx, canvasWidth, canvasHeight, currentPlayhead, captionClips, stylePreset = VIRAL_CAPTION_STYLES.HORMOZI_NEON) {
    if (!captionClips || captionClips.length === 0) return;

    const activeClip = captionClips.find(c => currentPlayhead >= c.start && currentPlayhead <= (c.start + c.duration));
    if (!activeClip || !activeClip.content) return;

    if (!activeClip._wordTokens) {
      activeClip._wordTokens = this.generateWordTokensFromSentence(activeClip.content, activeClip.start, activeClip.duration);
    }

    const tokens = activeClip._wordTokens;
    if (!tokens || tokens.length === 0) return;

    ctx.save();

    const centerY = canvasHeight * 0.72;
    const baseFontSize = activeClip.style?.fontSize ? activeClip.style.fontSize * 1.5 : 44;

    ctx.font = `900 ${baseFontSize}px ${stylePreset.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const activeWordIdx = tokens.findIndex(t => currentPlayhead >= t.start && currentPlayhead < t.end);

    const wordsText = tokens.map(t => t.word).join(' ');
    const totalTextWidth = ctx.measureText(wordsText).width;

    if (stylePreset.boxBg && stylePreset.boxBg !== 'transparent') {
      const paddingX = 24;
      const paddingY = 16;
      ctx.fillStyle = stylePreset.boxBg;
      ctx.beginPath();
      ctx.roundRect(
        (canvasWidth - totalTextWidth) / 2 - paddingX,
        centerY - (baseFontSize / 2) - paddingY,
        totalTextWidth + (paddingX * 2),
        baseFontSize + (paddingY * 2),
        16
      );
      ctx.fill();
    }

    let cursorX = (canvasWidth - totalTextWidth) / 2;

    tokens.forEach((token, idx) => {
      const isCurrent = idx === activeWordIdx;
      const wordMetrics = ctx.measureText(token.word + ' ');
      const wordCenter = cursorX + (wordMetrics.width / 2);

      ctx.save();

      if (isCurrent) {
        ctx.translate(wordCenter, centerY);
        ctx.scale(stylePreset.activeScale, stylePreset.activeScale);
        ctx.translate(-wordCenter, -centerY);

        if (stylePreset.hasGlow) {
          ctx.shadowColor = stylePreset.glowColor;
          ctx.shadowBlur = 24;
        }

        ctx.fillStyle = stylePreset.activeColor;
      } else {
        ctx.fillStyle = stylePreset.inactiveColor;
        ctx.shadowBlur = 0;
      }

      if (stylePreset.strokeWidth > 0) {
        ctx.strokeStyle = stylePreset.strokeColor;
        ctx.lineWidth = stylePreset.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(token.word, wordCenter, centerY);
      }

      ctx.fillText(token.word, wordCenter, centerY);

      if (token.emoji && isCurrent) {
        ctx.font = `${baseFontSize * 1.2}px sans-serif`;
        ctx.fillText(token.emoji, wordCenter, centerY - baseFontSize * 0.9);
      }

      ctx.restore();
      cursorX += wordMetrics.width;
    });

    ctx.restore();
  }
}
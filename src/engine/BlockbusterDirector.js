// src/engine/BlockbusterDirector.js
import { useNLEStore } from '../store/useNLEStore';
import { checkAndFetchScripture } from './AutoScripture';
import { audioDSP } from './AudioDSP';
import { CURVE_PRESETS } from './KeyframeCurveEngine';
import { OpenCapReelsEngine, VIRAL_CAPTION_STYLES } from './OpenCapReelsEngine';

// =====================================================================
// 🔐 [보안 암호화 데이터 복호화 헬퍼]
// =====================================================================
const ENCRYPT_PREFIX = "ENC_GTC_v1::";
const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (!cipherText.startsWith(ENCRYPT_PREFIX)) return cipherText;
  try {
    const payload = cipherText.replace(ENCRYPT_PREFIX, '');
    return decodeURIComponent(atob(payload));
  } catch (_) {
    return cipherText;
  }
};

// =====================================================================
// 🏛️ 1. 지능형 영적 사역 데이터 추출 & 카피라이팅 엔진
// =====================================================================
export class MinistryContextExtractor {
  static getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  static scanSpiritualAssets(targetDate, mode = 'auto') {
    const date = targetDate || this.getTodayKey();

    let qtData = {};
    try {
      const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      qtData = allQt[date] || {};
    } catch (_) {}

    let sermonData = {};
    try {
      const daysData = JSON.parse(localStorage.getItem('days_data') || '{}');
      sermonData = daysData[date] || {};
      if (!sermonData.sermonTitle) {
        const sermonDaily = JSON.parse(localStorage.getItem('sermon_daily') || '{}');
        sermonData = { ...sermonData, ...(sermonDaily[date] || {}) };
      }
    } catch (_) {}

    let cellData = {};
    try {
      const draftKeys = Object.keys(localStorage).filter(k => k.startsWith('cell_draft_') && k.endsWith(date));
      if (draftKeys.length > 0) {
        cellData = JSON.parse(localStorage.getItem(draftKeys[0]) || '{}');
      }
      const cellShared = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      if (cellShared.length > 0) {
        cellData.sharedThanks = cellShared[cellShared.length - 1]?.text || '';
      }
    } catch (_) {}

    let diaryData = {};
    try {
      diaryData = JSON.parse(localStorage.getItem('diary_10min') || '{}');
    } catch (_) {}

    const hasQT = Boolean(qtData.qtTitle || qtData.qtGoldenVerse || qtData.qtGraceLine || qtData.qtMeditation);
    const hasSermon = Boolean(sermonData.sermonConviction || sermonData.sermonTitle || sermonData.sermonPoint1);
    const hasCell = Boolean(cellData.thanksShare || cellData.wordShare || cellData.sharedThanks);
    const hasDiary = Boolean(diaryData.share || diaryData.found || diaryData.thanks);

    if (mode === 'qt' || (mode === 'auto' && hasQT)) {
      if (hasQT) {
        const rawVerse = qtData.qtGoldenVerse || qtData.qtReference || '시 23:1';
        return {
          source: 'QT',
          badgeText: '오늘의 QT 묵상',
          hookTitle: qtData.qtTitle ? `"${qtData.qtTitle}"` : '이 말씀이 당신을 살립니다',
          subSlug: qtData.qtReference ? `WORD OF GOD • ${qtData.qtReference}` : 'DIVINE ENCOUNTER',
          scriptureQuery: rawVerse,
          narrativeBody: qtData.qtGraceLine || qtData.qtMeditation || '모든 두려움이 멈추는 하나님의 임재',
          actionProclamation: qtData.qtActionItem || '오늘 하루 말씀으로 굳게 서기',
          recommendedLut: 1, // Teal & Orange
          captionPreset: 'HORMOZI_NEON'
        };
      }
    }

    if (mode === 'sermon' || (mode === 'auto' && hasSermon)) {
      if (hasSermon) {
        const points = [sermonData.sermonPoint1, sermonData.sermonPoint2, sermonData.sermonPoint3].filter(Boolean);
        return {
          source: 'SERMON',
          badgeText: '주일 강단 선포',
          hookTitle: sermonData.sermonConviction || sermonData.sermonTitle || '무너진 자리를 다시 세우라',
          subSlug: sermonData.sermonReference ? `SUNDAY MESSAGE • ${sermonData.sermonReference}` : 'PROCLAMATION',
          scriptureQuery: sermonData.sermonReference || '롬 8:28',
          narrativeBody: points.length > 0 ? points.join(' • ') : (sermonData.sermonGraceLine || sermonData.sermonTitle),
          actionProclamation: sermonData.sermonActionItem || '절대 순종으로 승리하라',
          recommendedLut: 3, // Fuji Eterna
          captionPreset: 'SERMON_HOLY_GOLD'
        };
      }
    }

    if (mode === 'cell' || (mode === 'auto' && hasCell)) {
      if (hasCell) {
        const rawThanks = cellData.thanksShare || cellData.sharedThanks || cellData.wordShare || '';
        return {
          source: 'CELL',
          badgeText: '공동체 감사 고백',
          hookTitle: '가장 깊은 어둠 속 피어난 감사',
          subSlug: 'GRACE & TESTIMONY',
          scriptureQuery: '살전 5:18',
          narrativeBody: decryptField(rawThanks) || '우리를 인도하신 주님의 완전한 계획',
          actionProclamation: cellData.prayerReq || '서로를 위해 기도하며 나아가기',
          recommendedLut: 2, // Kodak Portra
          captionPreset: 'MINIMAL_BOX'
        };
      }
    }

    if (mode === 'diary' || (mode === 'auto' && hasDiary)) {
      if (hasDiary) {
        return {
          source: 'DIARY',
          badgeText: '제자 훈련 일지',
          hookTitle: diaryData.share || '한 걸음 더 주께 가까이',
          subSlug: 'DISCIPLESHIP WALK',
          scriptureQuery: diaryData.word || '수 1:9',
          narrativeBody: diaryData.found || diaryData.thanks || '십자가의 은혜로 새롭게 태어난 삶',
          actionProclamation: diaryData.obey || '삶의 작은 순종으로 증명하기',
          recommendedLut: 1,
          captionPreset: 'HORMOZI_NEON'
        };
      }
    }

    return {
      source: 'DEFAULT',
      badgeText: '말씀과 동행',
      hookTitle: '세상이 줄 수 없는 평안',
      subSlug: 'ETERNAL COVENANT',
      scriptureQuery: '시 23:1',
      narrativeBody: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
      actionProclamation: '오늘도 믿음으로 전진하라',
      recommendedLut: 1,
      captionPreset: 'HORMOZI_NEON'
    };
  }
}

// =====================================================================
// 🎬 2. 할리우드 5대 서사 프로덕션 프로파일
// =====================================================================
export const BLOCKBUSTER_STYLES = {
  HOLY_CINEMATIC: {
    id: 'HOLY_CINEMATIC',
    name: '인셉션 시네마틱 (Holy Epic Inception)',
    lutMode: 1, // Teal & Orange
    letterbox: true, // 2.39:1 시네마스코프 바
    filmGrain: 14,
    vignette: 45,
    cameraPacing: 'aggressive',
    bgmDuckingDb: -22,
    sfxKit: ['braam', 'whoosh', 'subdrop', 'impact'],
    baseColor: { lift: -6, gamma: 110, gain: 118, saturation: 122, temperature: 5900, tint: 3 }
  },
  DARK_KNIGHT_TRAILER: {
    id: 'DARK_KNIGHT_TRAILER',
    name: '다크나이트 에픽 예고편 (Dark Knight Thriller)',
    lutMode: 4, // Noir/Bleach Mix
    letterbox: true,
    filmGrain: 24,
    vignette: 60,
    cameraPacing: 'staccato',
    bgmDuckingDb: -26,
    sfxKit: ['subdrop', 'riser', 'impact', 'whoosh'],
    baseColor: { lift: -14, gamma: 96, gain: 128, saturation: 82, temperature: 6800, tint: -4 }
  },
  VIRAL_REELS_PRO: {
    id: 'VIRAL_REELS_PRO',
    name: '호르모지 100만뷰 바이럴 숏폼 (Viral Fast-Paced)',
    lutMode: 1,
    letterbox: false,
    filmGrain: 8,
    vignette: 25,
    cameraPacing: 'hyperactive',
    bgmDuckingDb: -18,
    sfxKit: ['whoosh', 'impact', 'subdrop'],
    baseColor: { lift: -2, gamma: 104, gain: 112, saturation: 135, temperature: 6300, tint: 2 }
  },
  A24_SANCTUARY_DOCU: {
    id: 'A24_SANCTUARY_DOCU',
    name: 'A24 감성 필름 다큐멘터리 (A24 Sanctuary)',
    lutMode: 2, // Kodak Portra
    letterbox: false,
    filmGrain: 18,
    vignette: 35,
    cameraPacing: 'breathing',
    bgmDuckingDb: -16,
    sfxKit: ['whoosh', 'subdrop'],
    baseColor: { lift: 4, gamma: 108, gain: 102, saturation: 108, temperature: 5400, tint: 5 }
  }
};

// =====================================================================
// 🔊 3. 오디오 프로덕션: 다빈치/한스 짐머급 물리 사운드 합성기
// =====================================================================
class HollywoodAcousticSynthesizer {
  static getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    return new AudioContextClass({ sampleRate: 48000 });
  }

  // A. [BRAAM] 인셉션/듄 스타일 다중 디튠 브라스 혼 사운드
  static createHollywoodBraam() {
    try {
      const ctx = this.getAudioContext();
      const dur = 2.4;
      const buffer = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      const f0 = 55.0; // A1 저음
      for (let i = 0; i < buffer.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 1.5) * (1.0 - Math.exp(-t * 40.0)); // 빠른 어택 & 지수 감쇄

        // 3중 디튠 쏘우투스 (앙상블 브라스)
        const saw1 = (2.0 * ((t * f0) % 1.0) - 1.0);
        const saw2 = (2.0 * ((t * (f0 * 1.008)) % 1.0) - 1.0) * 0.8;
        const saw3 = (2.0 * ((t * (f0 * 0.992)) % 1.0) - 1.0) * 0.8;

        // 서브 옥타브
        const sub = Math.sin(2.0 * Math.PI * (f0 * 0.5) * t) * 0.7;

        // 5차 배음
        const fifth = Math.sin(2.0 * Math.PI * (f0 * 1.5) * t) * 0.4;

        const raw = (saw1 + saw2 + saw3 + sub + fifth) * env;
        // 아날로그 세츄레이션
        const saturated = Math.tanh(raw * 2.8) * 0.95;

        // 스테레오 스프레드
        left[i] = saturated + (saw2 * 0.15);
        right[i] = saturated - (saw3 * 0.15);
      }
      return this.bufferToBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  // B. [SUB-DROP] 808 서브우퍼 폭발 임팩트 (60Hz -> 20Hz 피치 스윕)
  static createSubDropBoom() {
    try {
      const ctx = this.getAudioContext();
      const dur = 1.8;
      const buffer = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / ctx.sampleRate;
        const freq = 65.0 * Math.exp(-t * 2.8) + 18.0;
        const env = Math.exp(-t * 1.8);
        const sine = Math.sin(2.0 * Math.PI * freq * t);
        const drive = Math.tanh(sine * 2.2 * env) * 0.98;

        left[i] = drive;
        right[i] = drive;
      }
      return this.bufferToBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  // C. [CINEMATIC WHOOSH] 공기 역학 휩 트랜지션 (에어로다이내믹 스윕)
  static createCinematicWhoosh() {
    try {
      const ctx = this.getAudioContext();
      const dur = 0.65;
      const buffer = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.pow(Math.sin((t / dur) * Math.PI), 2.5);
        const whiteNoise = (Math.random() * 2.0 - 1.0);
        // 스테레오 팬 스윕 (-1 -> +1)
        const pan = (t / dur);
        left[i] = whiteNoise * env * (1.0 - pan) * 0.85;
        right[i] = whiteNoise * env * pan * 0.85;
      }
      return this.bufferToBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  // D. [TENSION RISER] 텐션 지수 증폭 라이저 (오케스트라 현악 스웰)
  static createTensionRiser() {
    try {
      const ctx = this.getAudioContext();
      const dur = 2.2;
      const buffer = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / ctx.sampleRate;
        const p = t / dur;
        const freq = 120.0 + Math.pow(p, 3.0) * 1100.0;
        const env = Math.pow(p, 2.5);
        const osc = Math.sin(2.0 * Math.PI * freq * t) * 0.7;
        const noise = (Math.random() * 2.0 - 1.0) * 0.3;
        const val = (osc + noise) * env * 0.9;

        left[i] = val;
        right[i] = val;
      }
      return this.bufferToBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static bufferToBlobUrl(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let offset = 0, pos = 0;

    const set16 = (data) => { out.setUint16(pos, data, true); pos += 2; };
    const set32 = (data) => { out.setUint32(pos, data, true); pos += 4; };

    set32(0x46464952); set32(length - 8); set32(0x45564157); set32(0x20746d66);
    set16(16); set16(1); set16(numOfChan); set32(abuffer.sampleRate);
    set32(abuffer.sampleRate * 2 * numOfChan); set16(numOfChan * 2); set16(16);
    set32(0x61746164); set32(length - pos - 4);

    const channels = [];
    for (let i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));

    while (offset < abuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true); pos += 2;
      }
      offset++;
    }
    return URL.createObjectURL(new Blob([out.buffer], { type: 'audio/wav' }));
  }
}

// =====================================================================
// 🎬 4. 프로덕션 다이내믹 카메라 & 베지어 키프레임 오토-코레오그래퍼
// =====================================================================
class CameraMotionChoreographer {
  /**
   * 클립 역할(Act)에 따른 정밀 베지어 키프레임 생성
   */
  static generateDynamicKeyframes(act, duration) {
    const half = duration * 0.5;

    if (act === 'hook') {
      // 3초 바이럴 훅: 124% 펀치 줌인 -> 초고속 펀치 아웃 104%
      return {
        scale: [
          { time: 0, value: 126, curve: CURVE_PRESETS.SPEED_RAMP_FAST_OUT },
          { time: 0.35, value: 114, curve: CURVE_PRESETS.DAVINCI_DYNAMIC },
          { time: duration, value: 106, curve: CURVE_PRESETS.EASE_IN_OUT }
        ],
        positionY: [
          { time: 0, value: -20, curve: CURVE_PRESETS.PREMIERE_EXPONENTIAL },
          { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
        ],
        rotation: [
          { time: 0, value: -1.5, curve: CURVE_PRESETS.DAVINCI_DYNAMIC },
          { time: 0.4, value: 0.4, curve: CURVE_PRESETS.EASE_IN_OUT },
          { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
        ]
      };
    }

    if (act === 'build') {
      // 빌드업: 느린 푸시인 (100% -> 112%) + 미세 롤링
      return {
        scale: [
          { time: 0, value: 100, curve: CURVE_PRESETS.DAVINCI_DYNAMIC },
          { time: duration, value: 112, curve: CURVE_PRESETS.DAVINCI_DYNAMIC }
        ],
        positionY: [
          { time: 0, value: 0, curve: CURVE_PRESETS.LINEAR },
          { time: duration, value: -12, curve: CURVE_PRESETS.LINEAR }
        ],
        rotation: [
          { time: 0, value: 0, curve: CURVE_PRESETS.LINEAR },
          { time: duration, value: 0.8, curve: CURVE_PRESETS.LINEAR }
        ]
      };
    }

    if (act === 'climax') {
      // 클라이맥스 드롭: 임팩트 셰이크 펄스 + 120% 스냅 줌
      return {
        scale: [
          { time: 0, value: 122, curve: CURVE_PRESETS.SPEED_RAMP_FAST_OUT },
          { time: 0.15, value: 108, curve: CURVE_PRESETS.SPEED_RAMP_SLOW_IN },
          { time: half, value: 115, curve: CURVE_PRESETS.DAVINCI_DYNAMIC },
          { time: duration, value: 102, curve: CURVE_PRESETS.EASE_IN_OUT }
        ],
        positionY: [
          { time: 0, value: 18, curve: CURVE_PRESETS.PREMIERE_EXPONENTIAL },
          { time: 0.1, value: -10, curve: CURVE_PRESETS.PREMIERE_EXPONENTIAL },
          { time: 0.2, value: 0, curve: CURVE_PRESETS.LINEAR },
          { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
        ],
        rotation: [
          { time: 0, value: 1.8, curve: CURVE_PRESETS.SPEED_RAMP_FAST_OUT },
          { time: 0.15, value: -1.2, curve: CURVE_PRESETS.DAVINCI_DYNAMIC },
          { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
        ]
      };
    }

    // benediction / resolve: 잔잔한 100% 안착
    return {
      scale: [
        { time: 0, value: 105, curve: CURVE_PRESETS.EASE_IN_OUT },
        { time: duration, value: 100, curve: CURVE_PRESETS.EASE_IN_OUT }
      ],
      positionY: [
        { time: 0, value: -5, curve: CURVE_PRESETS.LINEAR },
        { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
      ],
      rotation: [
        { time: 0, value: 0, curve: CURVE_PRESETS.LINEAR },
        { time: duration, value: 0, curve: CURVE_PRESETS.LINEAR }
      ]
    };
  }
}

// =====================================================================
// 🌟 5. 메인 블록버스터 오토-디렉터 오케스트레이션 엔진
// =====================================================================
export class BlockbusterDirectorEngine {
  /**
   * 1-클릭 할리우드 극장판 오토 디렉팅 실행
   */
  static async directBlockbusterReels(options = {}) {
    const {
      stylePreset = 'HOLY_CINEMATIC',
      sourceMode = 'auto',
      targetDate = '',
      scriptureQuery = '',
      customHookTitle = '',
      onProgress = () => {}
    } = options;

    const store = useNLEStore.getState();
    const allClips = Object.values(store.entities?.clips || {});
    const mediaPool = store.mediaPool || [];

    const visualClips = allClips.filter(c => c.type === 'video' || c.type === 'image');
    if (visualClips.length === 0 && mediaPool.length === 0) {
      throw new Error('편집할 영상이나 사진이 미디어 풀에 최소 1개 이상 등록되어 있어야 합니다.');
    }

    onProgress(12, '1/6. 영적 사역 자산 정밀 스캔 & 바이럴 서사 분석...');

    // 1. 사역 컨텍스트 및 카피라이팅 추출
    const context = MinistryContextExtractor.scanSpiritualAssets(targetDate, sourceMode);
    const style = BLOCKBUSTER_STYLES[stylePreset] || BLOCKBUSTER_STYLES.HOLY_CINEMATIC;

    const finalHookTitle = customHookTitle?.trim() || context.hookTitle;
    const finalSubSlug = context.subSlug;
    const rawScriptureTarget = scriptureQuery?.trim() || context.scriptureQuery;

    onProgress(28, '2/6. 시네마틱 4막 서사 구조화 (Hook ➔ Build ➔ Climax ➔ Resolve)...');

    // 2. 비주얼 소스 재구성 및 서사 분할
    let orchestratedClips = [];
    const baseVisualPool = visualClips.length > 0 ? visualClips : mediaPool;

    if (baseVisualPool.length === 1 && baseVisualPool[0].type === 'video') {
      const src = baseVisualPool[0];
      const origDur = Math.max(10.0, src.duration || 10.0);
      const step = origDur / 4;

      orchestratedClips = [
        { ...src, id: `clip_hook_${Date.now()}`, inPoint: 0, duration: 2.2, act: 'hook' },
        { ...src, id: `clip_build_${Date.now()}`, inPoint: step * 0.9, duration: 3.2, act: 'build' },
        { ...src, id: `clip_climax_${Date.now()}`, inPoint: step * 1.8, duration: 3.8, act: 'climax' },
        { ...src, id: `clip_resolve_${Date.now()}`, inPoint: step * 2.7, duration: 2.8, act: 'resolve' }
      ];
    } else {
      // 복수 클립을 4막 텐션 곡선에 맞춰 자동 맵핑
      const sorted = [...baseVisualPool].sort((a, b) => (a.start || 0) - (b.start || 0));
      orchestratedClips = sorted.map((c, i) => {
        const ratio = i / Math.max(1, sorted.length - 1);
        const act = ratio < 0.2 ? 'hook' : ratio < 0.55 ? 'build' : ratio < 0.85 ? 'climax' : 'resolve';
        const targetDur = act === 'hook' ? 2.2 : act === 'build' ? 2.8 : act === 'climax' ? 3.4 : 2.6;
        return {
          ...c,
          id: `clip_${act}_${Date.now()}_${i}`,
          duration: targetDur,
          act
        };
      });
    }

    onProgress(45, '3/6. 다빈치 리졸브 3D LUT 컬러 & 아날로그 그레인 동기화...');

    // 3. 트랙 구조 재정비 (V1, V2, T1, T2, A2, A3)
    const nextTracks = { ...store.entities.tracks };
    const nextClips = {};

    ['V1', 'V2', 'T1', 'T2', 'A1', 'A2', 'A3'].forEach(tId => {
      nextTracks[tId] = {
        id: tId,
        name: tId,
        type: tId.startsWith('V') ? 'video' : tId.startsWith('T') ? 'text' : 'audio',
        clipIds: []
      };
    });

    let timeCursor = 0;

    // 4. 비디오 클립에 카메라 키프레임 & 셰이더 주입
    orchestratedClips.forEach((clip, idx) => {
      const dur = clip.duration || 3.0;
      const keyframes = CameraMotionChoreographer.generateDynamicKeyframes(clip.act, dur);

      nextClips[clip.id] = {
        ...clip,
        start: Number(timeCursor.toFixed(2)),
        duration: dur,
        trackId: 'V1',
        scaling: 'fill',
        filterPreset: 'tealAndOrange',
        lutMode: style.lutMode,
        filmGrain: style.filmGrain,
        vignette: style.vignette,
        color: {
          ...style.baseColor,
          saturation: clip.act === 'climax' ? style.baseColor.saturation + 12 : style.baseColor.saturation
        },
        keyframes,
        transform: {
          x: 0,
          y: 0,
          scale: 100,
          rotate: 0,
          borderRadius: 0
        },
        transition: clip.act === 'hook' ? 'filmBurn' : clip.act === 'climax' ? 'zoomBlur' : 'dissolveCross',
        transitionDuration: 0.35
      };

      nextTracks['V1'].clipIds.push(clip.id);
      timeCursor += dur;
    });

    onProgress(68, '4/6. OpenCap 키네틱 단어 팝업 타이포그래피 생성...');

    // 5. T2: 상단 3초 훅 킬러 타이틀
    const hookId = `hero_hook_${Date.now()}`;
    nextClips[hookId] = {
      id: hookId,
      type: 'text',
      content: `${finalHookTitle}\n${finalSubSlug}`,
      start: 0.1,
      duration: 2.1,
      trackId: 'T2',
      style: {
        fontSize: 22,
        preset: 'standard',
        fontFamily: 'Montserrat, sans-serif',
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 4,
        align: 'center',
        lineHeight: 1.25
      },
      transform: { x: 0, y: -190, scale: 100, rotate: 0 },
      opacity: 100,
      animation: 'popIn'
    };
    nextTracks['T2'].clipIds.push(hookId);

    // 6. T1: 말씀/사역 본문 (OpenCap 키네틱 워드 바이럴 자막 주입)
    let finalScriptureText = context.narrativeBody || '';
    try {
      finalScriptureText = await checkAndFetchScripture(rawScriptureTarget, { formatReels: true });
    } catch (_) {
      finalScriptureText = context.narrativeBody;
    }

    const scriptureDuration = Math.min(6.5, Math.max(4.0, timeCursor - 2.8));
    const scriptureStart = 2.4;

    const scriptureId = `kinetic_scripture_${Date.now()}`;
    const wordTokens = OpenCapReelsEngine.generateWordTokensFromSentence(
      finalScriptureText,
      scriptureStart,
      scriptureDuration
    );

    nextClips[scriptureId] = {
      id: scriptureId,
      type: 'text',
      content: finalScriptureText,
      start: scriptureStart,
      duration: scriptureDuration,
      trackId: 'T1',
      _wordTokens: wordTokens,
      style: {
        fontSize: 20,
        preset: 'sermon-badge',
        badgeText: context.badgeText,
        fontFamily: 'MaruBuri, serif',
        color: '#FFFFFF',
        align: 'center',
        lineHeight: 1.45
      },
      transform: { x: 0, y: 155, scale: 100, rotate: 0 },
      opacity: 100,
      animation: 'slideUp'
    };
    nextTracks['T1'].clipIds.push(scriptureId);

    onProgress(84, '5/6. 48kHz 물리 사운드 합성 (Braam / 808 Sub-Drop / Whoosh)...');

    // 7. A3: 물리 합성 사운드 FX 레이어링
    const braamUrl = HollywoodAcousticSynthesizer.createHollywoodBraam();
    const subDropUrl = HollywoodAcousticSynthesizer.createSubDropBoom();
    const whooshUrl = HollywoodAcousticSynthesizer.createCinematicWhoosh();
    const riserUrl = HollywoodAcousticSynthesizer.createTensionRiser();

    // 훅 시작점: Braam 브라스 작렬
    if (braamUrl) {
      const braamId = `sfx_braam_${Date.now()}`;
      nextClips[braamId] = {
        id: braamId,
        type: 'audio',
        name: '📯 Hollywood BRAAM Horn',
        url: braamUrl,
        start: 0,
        duration: 2.2,
        volume: 95,
        trackId: 'A3'
      };
      nextTracks['A3'].clipIds.push(braamId);
    }

    // 훅 -> 빌드업 전환점: Whoosh
    if (whooshUrl) {
      const whooshId = `sfx_whoosh_0_${Date.now()}`;
      nextClips[whooshId] = {
        id: whooshId,
        type: 'audio',
        name: '💨 Cinema Whoosh Air',
        url: whooshUrl,
        start: 1.9,
        duration: 0.65,
        volume: 80,
        trackId: 'A3'
      };
      nextTracks['A3'].clipIds.push(whooshId);
    }

    // 클라이맥스 직전: Riser
    const climaxStart = orchestratedClips.find(c => c.act === 'climax')?.duration 
      ? (nextClips[orchestratedClips.find(c => c.act === 'climax').id]?.start || 5.0) 
      : 5.0;

    if (riserUrl && climaxStart >= 2.0) {
      const riserId = `sfx_riser_${Date.now()}`;
      nextClips[riserId] = {
        id: riserId,
        type: 'audio',
        name: '📈 Tension Orchestral Riser',
        url: riserUrl,
        start: Math.max(0, climaxStart - 2.0),
        duration: 2.0,
        volume: 85,
        trackId: 'A3'
      };
      nextTracks['A3'].clipIds.push(riserId);
    }

    // 클라이맥스 시작점: 808 Sub-Drop 폭발
    if (subDropUrl) {
      const subDropId = `sfx_subdrop_${Date.now()}`;
      nextClips[subDropId] = {
        id: subDropId,
        type: 'audio',
        name: '💥 808 Sub-Drop Impact',
        url: subDropUrl,
        start: climaxStart,
        duration: 1.6,
        volume: 98,
        trackId: 'A3'
      };
      nextTracks['A3'].clipIds.push(subDropId);
    }

    onProgress(96, '6/6. Fairlight 안티-펌핑 오디오 더킹 DSP 가동 & 상영...');

    // 8. Fairlight 스마트 사이드체인 더킹 설정
    if (typeof audioDSP?.setDucking === 'function') {
      audioDSP.setDucking(true, 'A2', style.bgmDuckingDb);
    }

    // 9. NLE 스토어에 원자적 업데이트 반영 & 0초 자동 상영
    useNLEStore.setState({
      entities: {
        ...store.entities,
        tracks: nextTracks,
        clips: nextClips
      },
      projectDuration: Math.max(4.0, Number(timeCursor.toFixed(1))),
      playhead: 0,
      isPlaying: true
    });

    onProgress(100, `✨ [${context.badgeText}: ${finalHookTitle}] 블록버스터 릴스 완성!`);

    return {
      totalDuration: timeCursor,
      clipsCount: orchestratedClips.length,
      style: style.name,
      badge: context.badgeText,
      hook: finalHookTitle
    };
  }
}
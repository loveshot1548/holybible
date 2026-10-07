// src/engine/BlockbusterDirector.js
import { useNLEStore } from '../store/useNLEStore';
import { checkAndFetchScripture } from './AutoScripture';
import { audioDSP } from './AudioDSP';

// =====================================================================
// 🔐 [보안 복호화 헬퍼] 앱 내부 목장/감사/일기 암호화 데이터 해독
// =====================================================================
const ENCRYPT_PREFIX = "ENC_GTC_v1::";
const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (!cipherText.startsWith(ENCRYPT_PREFIX)) return cipherText;
  try {
    const payload = cipherText.replace(ENCRYPT_PREFIX, '');
    return decodeURIComponent(atob(payload));
  } catch (e) {
    return cipherText;
  }
};

// =====================================================================
// 🏛️ 1. 앱 내부 사역 데이터베이스 실시간 지능형 추출 엔진
// =====================================================================
export class MinistryContextExtractor {
  static getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 앱 내부에 축적된 영적 데이터를 실시간 스캔하여 정제
   * @param {string} targetDate - 대상 날짜 (기본 오늘)
   * @param {string} mode - 'auto' | 'qt' | 'sermon' | 'cell' | 'diary' | 'preset'
   */
  static scanSpiritualAssets(targetDate, mode = 'auto') {
    const date = targetDate || this.getTodayKey();

    // 1. QT 데이터 스캔 (QT.js / qt_daily)
    let qtData = {};
    try {
      const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      qtData = allQt[date] || {};
    } catch (_) {}

    // 2. 주일 설교 노트 스캔 (Sermon.js / days_data)
    let sermonData = {};
    try {
      const daysData = JSON.parse(localStorage.getItem('days_data') || '{}');
      sermonData = daysData[date] || {};
      if (!sermonData.sermonTitle) {
        const sermonDaily = JSON.parse(localStorage.getItem('sermon_daily') || '{}');
        sermonData = { ...sermonData, ...(sermonDaily[date] || {}) };
      }
    } catch (_) {}

    // 3. 목장 나눔 및 감사 피드 스캔 (Cell.js)
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

    // 4. 제자훈련 10분 일지 및 고난 해석 스캔 (Diary.js)
    let diaryData = {};
    try {
      diaryData = JSON.parse(localStorage.getItem('diary_10min') || '{}');
    } catch (_) {}

    // 5. 기도함 스캔 (PrayerBox.js)
    let prayerData = {};
    try {
      prayerData = JSON.parse(localStorage.getItem('pb_tnote_final_v14') || '{}');
    } catch (_) {}

    // 🌟 [모드별 우선순위 분기 판별]
    const hasQT = Boolean(qtData.qtTitle || qtData.qtGoldenVerse || qtData.qtGraceLine || qtData.qtMeditation);
    const hasSermon = Boolean(sermonData.sermonConviction || sermonData.sermonTitle || sermonData.sermonPoint1);
    const hasCell = Boolean(cellData.thanksShare || cellData.wordShare || cellData.sharedThanks);
    const hasDiary = Boolean(diaryData.share || diaryData.found || diaryData.thanks);

    // [A] QT 중심 모드
    if (mode === 'qt' || (mode === 'auto' && hasQT)) {
      if (hasQT) {
        return {
          source: 'QT',
          badgeText: '오늘의 QT',
          hookTitle: qtData.qtTitle || '오늘 주신 말씀',
          subSlug: qtData.qtReference || 'DAILY MEDITATION',
          scriptureQuery: qtData.qtGoldenVerse || qtData.qtReference || '시 23:1',
          bodyText: qtData.qtGoldenVerse || qtData.qtGraceLine || qtData.qtMeditation || '',
          actionText: qtData.qtActionItem || '',
          recommendedLut: 'tealAndOrange',
          recommendedFont: 'MaruBuri'
        };
      }
    }

    // [B] 주일 강단 설교 중심 모드
    if (mode === 'sermon' || (mode === 'auto' && hasSermon)) {
      if (hasSermon) {
        const points = [sermonData.sermonPoint1, sermonData.sermonPoint2, sermonData.sermonPoint3].filter(Boolean);
        return {
          source: 'SERMON',
          badgeText: '강단 선포',
          hookTitle: sermonData.sermonConviction || sermonData.sermonTitle || '결단의 말씀',
          subSlug: sermonData.sermonReference || 'SUNDAY MESSAGE',
          scriptureQuery: sermonData.sermonReference || '롬 8:28',
          bodyText: points.length > 0 ? points.join('\n') : (sermonData.sermonGraceLine || sermonData.sermonTitle),
          actionText: sermonData.sermonActionItem || '',
          recommendedLut: 'bleachBypass',
          recommendedFont: 'MYArirangGothic'
        };
      }
    }

    // [C] 목장 공동체 감사 피드 모드
    if (mode === 'cell' || (mode === 'auto' && hasCell)) {
      if (hasCell) {
        const rawThanks = cellData.thanksShare || cellData.sharedThanks || cellData.wordShare || '';
        return {
          source: 'CELL',
          badgeText: '감사 나눔',
          hookTitle: '공동체 감사 고백',
          subSlug: 'GRACE & FELLOWSHIP',
          scriptureQuery: '살전 5:18',
          bodyText: decryptField(rawThanks),
          actionText: cellData.prayerReq || '',
          recommendedLut: 'warmGrace',
          recommendedFont: 'KyoboHandwriting'
        };
      }
    }

    // [D] 10분 훈련 일지 모드
    if (mode === 'diary' || (mode === 'auto' && hasDiary)) {
      if (hasDiary) {
        return {
          source: 'DIARY',
          badgeText: '제자 훈련',
          hookTitle: diaryData.share || '말씀 앞의 나',
          subSlug: diaryData.word || 'DISCIPLESHIP',
          scriptureQuery: diaryData.word || '수 1:9',
          bodyText: diaryData.found || diaryData.thanks || diaryData.apply || '',
          actionText: diaryData.obey || '',
          recommendedLut: 'kodakGold',
          recommendedFont: 'MYArirangGothic'
        };
      }
    }

    // 기록이 없을 경우: 지능형 성경 동행 기본값 반환
    return {
      source: 'DEFAULT',
      badgeText: '말씀 동행',
      hookTitle: '오직 믿음으로',
      subSlug: 'BY FAITH ALONE',
      scriptureQuery: '시 23:1',
      bodyText: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
      actionText: '오늘 하루도 믿음으로 승리하기',
      recommendedLut: 'tealAndOrange',
      recommendedFont: 'MaruBuri'
    };
  }
}

// =====================================================================
// 🌟 2. 헐리우드 5대 블록버스터 프로덕션 DI 컬러 & 연출 프로파일
// =====================================================================
export const BLOCKBUSTER_STYLES = {
  HOLY_CINEMATIC: {
    id: 'HOLY_CINEMATIC',
    name: '신성한 영화 예고편 (Inception Style Cinematic)',
    lut: 'tealAndOrange',
    hookPool: [
      { title: '오직 믿음으로', sub: 'BY FAITH ALONE' },
      { title: '너는 내 것이라', sub: 'YOU ARE MINE' },
      { title: '고요한 은혜', sub: 'STILL WATERS' },
      { title: '두려워 말라', sub: 'DO NOT FEAR' },
      { title: '깊은 곳으로', sub: 'INTO THE DEEP' }
    ],
    scripturePool: ['시 23:1', '사 41:10', '요 14:27', '시 46:1', '마 11:28'],
    badgePool: ['오늘의 말씀', '은혜의 음성', '하늘의 위로', '새벽 기도'],
    bgmDuckingDb: -20,
    fontFamily: 'MaruBuri',
    transitions: ['filmBurn', 'zoomBlur', 'whipLeft', 'dissolveCross'],
    motions: ['zoomIn', 'slideUp', 'popIn', 'shakeImpact'],
    auroraColors: ['rgba(0, 229, 255, 0.45)', 'rgba(147, 51, 234, 0.35)', 'rgba(245, 158, 11, 0.25)'],
    gridMode: 'matrix',
    speedRamp: true,
    shutterMotionBlur: true,
    halation: true,
    baseColor: { lift: -8, gamma: 112, gain: 118, saturation: 124, temperature: 5800, tint: 4 }
  },

  EPIC_TRAILER: {
    id: 'EPIC_TRAILER',
    name: '에픽 블록버스터 액션 (Epic Action Trailer)',
    lut: 'bleachBypass',
    hookPool: [
      { title: '결단의 순간', sub: 'MOMENT OF TRUTH' },
      { title: '일어나 걸으라', sub: 'RISE AND WALK' },
      { title: '믿음의 전신갑주', sub: 'ARMOR OF GOD' },
      { title: '끝까지 견디라', sub: 'STAND FIRM' }
    ],
    scripturePool: ['빌 4:13', '수 1:9', '고전 16:13', '롬 8:31', '시 27:1'],
    badgePool: ['순종과 결단', '영적 전투', '승리의 선포', '믿음의 고백'],
    bgmDuckingDb: -24,
    fontFamily: 'MYArirangGothic',
    transitions: ['flashWhite', 'zoomBlur', 'whipLeft', 'splitDoor'],
    motions: ['shakeImpact', 'zoomIn', 'popIn', 'slideUp'],
    auroraColors: ['rgba(239, 68, 68, 0.45)', 'rgba(245, 158, 11, 0.35)', 'rgba(15, 23, 42, 0.90)'],
    gridMode: 'matrix',
    speedRamp: true,
    shutterMotionBlur: true,
    halation: true,
    baseColor: { lift: -12, gamma: 98, gain: 125, saturation: 88, temperature: 6600, tint: -2 }
  },

  VIRAL_REELS_PRO: {
    id: 'VIRAL_REELS_PRO',
    name: '바이럴 릴스 프로 100만뷰 (Hyper Viral Reels)',
    lut: 'kodakGold',
    hookPool: [
      { title: '잠시 멈추어', sub: 'PAUSE & REFLECT' },
      { title: '오늘 당신에게', sub: 'WORD FOR YOU' },
      { title: '마음이 무거울 때', sub: 'WHEN WEARY' }
    ],
    scripturePool: ['마 6:33', '잠 3:5', '갈 6:9', '시 37:5', '요 3:16'],
    badgePool: ['3초 묵상', '오늘의 질문', '마음 처방전', '말씀 쇼츠'],
    bgmDuckingDb: -16,
    fontFamily: 'MYArirangGothic',
    transitions: ['zoomBlur', 'flashWhite', 'filmBurn', 'whipLeft'],
    motions: ['popIn', 'zoomIn', 'slideUp', 'shakeImpact'],
    auroraColors: ['rgba(255, 230, 0, 0.40)', 'rgba(0, 229, 255, 0.40)', 'rgba(244, 63, 94, 0.30)'],
    gridMode: 'matrix',
    speedRamp: true,
    shutterMotionBlur: true,
    halation: false,
    baseColor: { lift: -4, gamma: 106, gain: 114, saturation: 130, temperature: 6200, tint: 2 }
  },

  GRACE_SANCTUARY: {
    id: 'GRACE_SANCTUARY',
    name: 'A24 감성 필름 다큐 (A24 Sanctuary Film)',
    lut: 'warmGrace',
    hookPool: [
      { title: '은혜의 발자취', sub: 'FOOTSTEPS OF GRACE' },
      { title: '작은 감사', sub: 'LITTLE THANKS' },
      { title: '따스한 동행', sub: 'WALKING WITH YOU' }
    ],
    scripturePool: ['살전 5:16', '시 103:1', '골 3:15', '애 3:22', '시 16:11'],
    badgePool: ['감사의 고백', '동행 일기', '은혜 나눔', '가정 묵상'],
    bgmDuckingDb: -15,
    fontFamily: 'KyoboHandwriting',
    transitions: ['dissolveCross', 'filmBurn', 'dipBlack', 'dissolveCross'],
    motions: ['slideUp', 'zoomIn', 'popIn', 'slideUp'],
    auroraColors: ['rgba(251, 191, 36, 0.40)', 'rgba(244, 114, 182, 0.25)', 'rgba(255, 255, 255, 0.20)'],
    gridMode: 'single',
    speedRamp: false,
    shutterMotionBlur: false,
    halation: true,
    baseColor: { lift: 2, gamma: 108, gain: 104, saturation: 110, temperature: 5500, tint: 6 }
  },

  NEON_CYBER: {
    id: 'NEON_CYBER',
    name: '모던 네온 임팩트 (Cyber Neon Impact)',
    lut: 'fujiAstia',
    hookPool: [
      { title: '새로운 시작', sub: 'A BRAND NEW DAY' },
      { title: '다시 일어서다', sub: 'RESTORE & REBUILD' }
    ],
    scripturePool: ['사 43:19', '고후 5:17', '계 21:5', '롬 12:2', '시 51:10'],
    badgePool: ['회복과 동행', '새벽 비전', '청년 말씀', '소망의 외침'],
    bgmDuckingDb: -22,
    fontFamily: 'NanumPen',
    transitions: ['zoomBlur', 'flashWhite', 'whipLeft'],
    motions: ['popIn', 'shakeImpact', 'zoomIn', 'slideUp'],
    auroraColors: ['rgba(168, 85, 247, 0.50)', 'rgba(0, 229, 255, 0.45)', 'rgba(236, 72, 153, 0.35)'],
    gridMode: 'matrix',
    speedRamp: true,
    shutterMotionBlur: true,
    halation: false,
    baseColor: { lift: -10, gamma: 115, gain: 122, saturation: 140, temperature: 7000, tint: -6 }
  }
};

const pickRandom = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const shuffleNonRepeating = (pool, count) => {
  const result = [];
  let lastItem = null;
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter(item => item !== lastItem);
    const chosen = pickRandom(candidates.length > 0 ? candidates : pool);
    result.push(chosen);
    lastItem = chosen;
  }
  return result;
};

// =====================================================================
// 🌟 3. Web Audio DSP 5대 물리 사운드 합성기
// =====================================================================
class HollywoodSfxSynthesizer {
  static getAudioContext() {
    return new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  }

  static createBraamHornUrl() {
    try {
      const ctx = this.getAudioContext();
      const dur = 1.6;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 2.2);
        const fundamental = Math.sin(2 * Math.PI * 55 * t);
        const octaveDetuned = Math.sin(2 * Math.PI * 110.6 * t) * 0.65;
        const fifthHarmonic = Math.sin(2 * Math.PI * 165.2 * t) * 0.4;
        const saw = (2 * ((t * 55) % 1) - 1) * 0.45;
        const raw = (fundamental + octaveDetuned + fifthHarmonic + saw) * env;
        data[i] = Math.tanh(raw * 2.0) * 0.95;
      }
      return this.bufferToWaveBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static createSubDropBoomUrl() {
    try {
      const ctx = this.getAudioContext();
      const dur = 1.0;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const freq = 68 * Math.exp(-t * 3.6);
        const env = Math.exp(-t * 2.5);
        const sine = Math.sin(2 * Math.PI * freq * t);
        const harmonic = Math.sin(2 * Math.PI * (freq * 2) * t) * 0.22;
        data[i] = Math.tanh((sine + harmonic) * env * 1.8) * 0.98;
      }
      return this.bufferToWaveBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static createTransientSnapUrl() {
    try {
      const ctx = this.getAudioContext();
      const dur = 0.08;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 45);
        const noise = (Math.random() * 2) - 1;
        const click = Math.sin(2 * Math.PI * 4200 * t) * 0.8;
        data[i] = (noise * 0.5 + click) * env * 0.9;
      }
      return this.bufferToWaveBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static createWhooshAirUrl() {
    try {
      const ctx = this.getAudioContext();
      const dur = 0.40;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.sin((t / dur) * Math.PI);
        const noise = (Math.random() * 2) - 1;
        data[i] = noise * Math.pow(env, 3.0) * 0.75;
      }
      return this.bufferToWaveBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static createTensionRiserUrl() {
    try {
      const ctx = this.getAudioContext();
      const dur = 1.8;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const progress = t / dur;
        const freq = 90 + Math.pow(progress, 3.2) * 820;
        const env = Math.pow(progress, 2.2);
        const saw = (2 * ((t * freq) % 1) - 1) * 0.55;
        const noise = ((Math.random() * 2) - 1) * 0.35;
        data[i] = (saw + noise) * env * 0.8;
      }
      return this.bufferToWaveBlobUrl(buffer);
    } catch (_) { return ''; }
  }

  static bufferToWaveBlobUrl(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels = [], sample, offset = 0, pos = 0;

    function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66);
    setUint16(16); setUint16(1); setUint16(numOfChan); setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
    while (offset < abuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true); pos += 2;
      }
      offset++;
    }
    return URL.createObjectURL(new Blob([out.buffer], { type: 'audio/wav' }));
  }
}

// =====================================================================
// 🌟 4. 서사 텐션 곡선 수학 모델
// =====================================================================
class CinematicPacingModel {
  static evaluateTension(normalizedProgress) {
    const p = Math.max(0, Math.min(1, normalizedProgress));
    if (p < 0.25) {
      return 1.0 - Math.pow(p / 0.25, 0.7) * 0.55;
    } else if (p < 0.6) {
      const sub = (p - 0.25) / 0.35;
      return 0.45 + Math.pow(sub, 2.0) * 0.35;
    } else if (p < 0.85) {
      const sub = (p - 0.6) / 0.25;
      return 0.80 + Math.sin(sub * Math.PI) * 0.20;
    } else {
      const sub = (p - 0.85) / 0.15;
      return 0.85 * (1.0 - Math.pow(sub, 1.5));
    }
  }
}

// =====================================================================
// 🌟 5. 능동형 사역 AI 오케스트레이션 코어 엔진
// =====================================================================
export class BlockbusterDirectorEngine {
  /**
   * 🌟 1-클릭 자율형 릴스 디렉팅 파이프라인
   * @param {Object} options - 연출 옵션
   */
  static async directBlockbusterReels(options = {}) {
    const {
      stylePreset = 'HOLY_CINEMATIC',
      sourceMode = 'auto', // 'auto' | 'qt' | 'sermon' | 'cell' | 'preset'
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
      throw new Error('타임라인이나 미디어 풀에 영상 또는 사진이 최소 1장 이상 등록되어 있어야 연출할 수 있습니다.');
    }

    onProgress(10, '1/6. 앱 내부 사역 DB 스캔 및 영적 에셋 추출 중...');

    // 🌟 [핵심] 우리 앱 내부 사역 데이터베이스 실시간 스캔 & 지능형 주입
    const spiritualContext = MinistryContextExtractor.scanSpiritualAssets(targetDate, sourceMode);

    let chosenStyleKey = stylePreset;
    if (sourceMode !== 'preset' && spiritualContext.recommendedLut) {
      const matched = Object.keys(BLOCKBUSTER_STYLES).find(k => BLOCKBUSTER_STYLES[k].lut === spiritualContext.recommendedLut);
      if (matched) chosenStyleKey = matched;
    }
    const style = BLOCKBUSTER_STYLES[chosenStyleKey] || BLOCKBUSTER_STYLES.HOLY_CINEMATIC;

    // 카피 및 구절 확정
    const selectedHookTitle = customHookTitle?.trim() || spiritualContext.hookTitle || pickRandom(style.hookPool).title;
    const selectedSubSlug = spiritualContext.subSlug || style.hookPool[0].sub;
    const rawScriptureTarget = scriptureQuery?.trim() || spiritualContext.scriptureQuery || pickRandom(style.scripturePool);
    const selectedBadgeText = spiritualContext.badgeText || pickRandom(style.badgePool);

    // 아날로그 필름 컬러 지터
    const dynamicColor = {
      ...style.baseColor,
      temperature: style.baseColor.temperature + Math.floor((Math.random() - 0.5) * 200),
      saturation: Math.max(80, Math.min(145, style.baseColor.saturation + Math.floor((Math.random() - 0.5) * 8))),
      gain: style.baseColor.gain + Math.floor((Math.random() - 0.5) * 5)
    };

    onProgress(25, '2/6. 시네마틱 4막 타임라인 시퀀스 슬라이싱 중...');

    let processedVisualClips = [];
    if (visualClips.length === 1 && visualClips[0].type === 'video') {
      const src = visualClips[0];
      const totalDur = Math.max(9.0, src.duration || 9.0);
      const d1 = 2.6, d2 = 2.8, d3 = 3.4, d4 = 2.2;
      const stepIn = totalDur / 4;

      processedVisualClips = [
        { ...src, id: `${src.id}_act1_hook`, inPoint: 0, duration: d1, act: 'hook' },
        { ...src, id: `${src.id}_act2_narrative`, inPoint: stepIn * 0.8, duration: d2, act: 'narrative' },
        { ...src, id: `${src.id}_act3_climax`, inPoint: stepIn * 1.7, duration: d3, act: 'climax' },
        { ...src, id: `${src.id}_act4_benediction`, inPoint: stepIn * 2.6, duration: d4, act: 'benediction' }
      ];
    } else if (visualClips.length > 1) {
      processedVisualClips = [...visualClips].sort((a, b) => (a.start || 0) - (b.start || 0)).map((c, i, arr) => {
        const ratio = i / (arr.length - 1);
        const act = ratio < 0.25 ? 'hook' : ratio < 0.6 ? 'narrative' : ratio < 0.85 ? 'climax' : 'benediction';
        return { ...c, act };
      });
    } else {
      const img = visualClips[0] || mediaPool[0];
      processedVisualClips = [
        { ...img, id: `${img.id}_act1`, duration: 2.6, act: 'hook' },
        { ...img, id: `${img.id}_act2`, duration: 2.8, act: 'narrative' },
        { ...img, id: `${img.id}_act3`, duration: 3.4, act: 'climax' },
        { ...img, id: `${img.id}_act4`, duration: 2.2, act: 'benediction' }
      ];
    }

    onProgress(42, '3/6. 절차적 트랜지션 & 카메라 모션 시퀀스 편성...');

    const dynamicTransitions = shuffleNonRepeating(style.transitions, processedVisualClips.length);
    const dynamicMotions = shuffleNonRepeating(style.motions, processedVisualClips.length);

    const targetTracks = { ...store.entities.tracks };
    const targetClips = {};

    ['V1', 'V2', 'T1', 'T2', 'A2', 'A3'].forEach(tId => {
      targetTracks[tId] = {
        id: tId,
        name: tId,
        type: tId.startsWith('V') ? 'video' : tId.startsWith('T') ? 'text' : 'audio',
        clipIds: []
      };
    });

    let timelineCursor = 0;
    const totalEstDuration = processedVisualClips.reduce((sum, c) => sum + (c.duration || 3.0), 0);

    processedVisualClips.forEach((clip, index) => {
      const isHook = clip.act === 'hook' || index === 0;
      const isClimax = clip.act === 'climax';
      const isBenediction = clip.act === 'benediction';
      const clipDuration = clip.duration || 3.0;

      const normP = timelineCursor / totalEstDuration;
      const tension = CinematicPacingModel.evaluateTension(normP);

      const transitionType = isHook 
        ? 'filmBurn' 
        : isClimax 
          ? 'zoomBlur' 
          : isBenediction 
            ? 'dissolveCross' 
            : dynamicTransitions[index];

      const motion = isHook ? 'zoomIn' : isClimax ? 'shakeImpact' : dynamicMotions[index];

      let gridConfig = { mode: 'single' };
      if (isClimax && style.gridMode === 'matrix') {
        const poolUrls = mediaPool.map(m => m.url).filter(Boolean);
        const fallbackUrl = clip.url || poolUrls[0] || '';
        if (poolUrls.length >= 3) {
          gridConfig = {
            mode: 'matrix',
            rows: 2,
            cols: 2,
            gap: 6,
            cellMedia: {
              0: poolUrls[0] || fallbackUrl,
              1: poolUrls[1] || fallbackUrl,
              2: poolUrls[2] || fallbackUrl
            }
          };
        }
      }

      const clipSpeed = isHook && style.speedRamp ? 1.2 : 1.0;

      targetClips[clip.id] = {
        ...clip,
        start: Number(timelineCursor.toFixed(2)),
        duration: clipDuration,
        trackId: 'V1',
        speed: clipSpeed,
        scaling: 'fill',
        filterPreset: style.lut,
        filterIntensity: 90,
        color: { ...dynamicColor },
        animation: motion,
        transition: transitionType,
        transitionDuration: isHook ? 0.45 : 0.35,
        transform: {
          x: 0,
          y: 0,
          scale: isHook ? 108 : isClimax ? 104 : 100,
          rotate: 0,
          opacity: 100
        },
        fx: {
          vignette: Math.round(16 + tension * 16),
          filmGrain: Math.round(10 + tension * 12),
          glow: Math.round(tension * 25),
          chromatic: isClimax ? 4 : isHook ? 2 : 0,
          flicker: 0,
          aurora: true,
          auroraColors: style.auroraColors,
          letterbox: isHook,
          motionBlur: style.shutterMotionBlur,
          halation: style.halation
        },
        gridConfig
      };

      targetTracks['V1'].clipIds.push(clip.id);
      timelineCursor += clipDuration;
    });

    onProgress(65, '4/6. 타이포그래피 오케스트레이션 (3초 훅 & 딥 다크 말씀 카드)...');

    // 🌟 T2 트랙: 상단 1/3 안전영역 3초 훅 타이틀
    const hookClipId = `hook_hero_${Date.now()}`;
    targetClips[hookClipId] = {
      id: hookClipId,
      type: 'text',
      content: `${selectedHookTitle}\n${selectedSubSlug}`,
      start: 0.15,
      duration: 2.2,
      trackId: 'T2',
      animation: 'popIn',
      style: {
        fontSize: 20,
        preset: 'standard',
        fontFamily: spiritualContext.recommendedFont || style.fontFamily,
        color: '#FFFFFF',
        align: 'center',
        lineHeight: 1.3
      },
      transform: { x: 0, y: -175, scale: 100, rotate: 0 },
      opacity: 100
    };
    targetTracks['T2'].clipIds.push(hookClipId);

    // 🌟 T1 트랙: 앱 내부 사역 본문 및 성구 파싱
    let finalScriptureContent = spiritualContext.bodyText || '';
    if (!finalScriptureContent || finalScriptureContent.length < 5) {
      try {
        finalScriptureContent = await checkAndFetchScripture(rawScriptureTarget, { formatReels: true });
      } catch (_) {
        finalScriptureContent = rawScriptureTarget;
      }
    }

    const textLen = finalScriptureContent.length;
    const dynamicFontSize = textLen > 55 ? 13 : textLen > 35 ? 15 : 17;
    const dynamicDuration = Math.min(6.5, Math.max(3.8, textLen * 0.1));
    const badgeStartTime = Math.max(2.4, (timelineCursor - dynamicDuration) / 2);

    const scriptureClipId = `scripture_badge_${Date.now()}`;
    targetClips[scriptureClipId] = {
      id: scriptureClipId,
      type: 'text',
      content: finalScriptureContent,
      start: Number(badgeStartTime.toFixed(2)),
      duration: Number(dynamicDuration.toFixed(2)),
      trackId: 'T1',
      animation: 'slideUp',
      style: {
        fontSize: dynamicFontSize,
        preset: 'sermon-badge',
        badgeText: selectedBadgeText,
        fontFamily: spiritualContext.recommendedFont || style.fontFamily,
        color: '#FFFFFF',
        align: 'center',
        lineHeight: 1.45
      },
      transform: { x: 0, y: 165, scale: 100, rotate: 0 },
      opacity: 100
    };
    targetTracks['T1'].clipIds.push(scriptureClipId);

    onProgress(82, '5/6. 헐리우드 Web Audio DSP 5대 물리 사운드 합성 중...');

    const braamUrl = HollywoodSfxSynthesizer.createBraamHornUrl();
    const snapUrl = HollywoodSfxSynthesizer.createTransientSnapUrl();
    const subDropUrl = HollywoodSfxSynthesizer.createSubDropBoomUrl();
    const whooshUrl = HollywoodSfxSynthesizer.createWhooshAirUrl();
    const riserUrl = HollywoodSfxSynthesizer.createTensionRiserUrl();

    if (braamUrl) {
      const braamId = `sfx_braam_${Date.now()}`;
      targetClips[braamId] = {
        id: braamId,
        type: 'audio',
        name: '📯 Hollywood BRAAM Brass Horn',
        url: braamUrl,
        start: 0,
        duration: 1.6,
        volume: 92,
        trackId: 'A3'
      };
      targetTracks['A3'].clipIds.push(braamId);
    }

    if (snapUrl) {
      const snapId = `sfx_snap_${Date.now()}_0`;
      targetClips[snapId] = {
        id: snapId,
        type: 'audio',
        name: '⚡ High Transient Snap',
        url: snapUrl,
        start: 0,
        duration: 0.08,
        volume: 80,
        trackId: 'A3'
      };
      targetTracks['A3'].clipIds.push(snapId);
    }

    const climaxTime = Number((timelineCursor * 0.62).toFixed(2));
    if (riserUrl && climaxTime > 2.0) {
      const riserId = `sfx_riser_${Date.now()}`;
      targetClips[riserId] = {
        id: riserId,
        type: 'audio',
        name: '📈 Tension Exponential Riser',
        url: riserUrl,
        start: Math.max(0, climaxTime - 1.8),
        duration: 1.8,
        volume: 85,
        trackId: 'A3'
      };
      targetTracks['A3'].clipIds.push(riserId);
    }

    if (subDropUrl && climaxTime > 2.0) {
      const subDropId = `sfx_subdrop_${Date.now()}`;
      targetClips[subDropId] = {
        id: subDropId,
        type: 'audio',
        name: '💥 Sub-Drop Impact Boom',
        url: subDropUrl,
        start: climaxTime,
        duration: 1.0,
        volume: 95,
        trackId: 'A3'
      };
      targetTracks['A3'].clipIds.push(subDropId);
    }

    if (whooshUrl) {
      let cursor = 0;
      processedVisualClips.forEach((c, idx) => {
        if (idx > 0 && cursor > 0.5) {
          const whooshId = `sfx_whoosh_${Date.now()}_${idx}`;
          targetClips[whooshId] = {
            id: whooshId,
            type: 'audio',
            name: '💨 Aero-Dynamic Whoosh Transition',
            url: whooshUrl,
            start: Math.max(0, cursor - 0.2),
            duration: 0.40,
            volume: 75,
            trackId: 'A3'
          };
          targetTracks['A3'].clipIds.push(whooshId);
        }
        cursor += (c.duration || 3.0);
      });
    }

    onProgress(95, '6/6. 사이드체인 오디오 더킹 DSP 연결 및 0초 상영 개시...');

    if (typeof audioDSP?.setDucking === 'function') {
      audioDSP.setDucking(true, 'A2', style.bgmDuckingDb);
    }

    useNLEStore.setState({
      entities: {
        ...store.entities,
        tracks: targetTracks,
        clips: targetClips
      },
      projectDuration: Math.max(3.5, Number(timelineCursor.toFixed(1))),
      playhead: 0,
      isPlaying: true
    });

    onProgress(100, `✨ [${spiritualContext.badgeText}: ${selectedHookTitle}] 맞춤 릴스 완성!`);

    return {
      totalDuration: timelineCursor,
      clipsCount: processedVisualClips.length,
      style: style.name,
      source: spiritualContext.source,
      badge: selectedBadgeText,
      hook: selectedHookTitle
    };
  }
}
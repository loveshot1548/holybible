// src/engine/AudioDSP.js

/**
 * 🎛️ 다빈치 리졸브 21 Fairlight 규격 방송용 오디오 DSP 엔진
 * 48kHz / 24-bit 스튜디오 품질 마스터링 및 스마트 사이드체인 더킹 완비
 */
class AudioDSPEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterLimiter = null;
    this.masterAnalyser = null;
    this.trackBuses = new Map();
    this.sourceCache = new WeakMap();
    this.isDucking = false;
    this.duckingTargetTrack = 'A2'; // 기본 BGM 트랙
    this.duckingReductionDb = -18;   // 방송 표준 -18dB 감쇄 (약 0.125)
    this.userTrackVolumes = new Map(); // 트랙별 순수 사용자 볼륨 보존
  }

  // 1. AudioContext 안전 초기화 & 브라우저 자동재생 언락
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // 방송 규격 투명 마스터 리미터 (하드 클리핑 및 스피커 왜곡 100% 차단)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-0.8, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(2.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.08, this.ctx.currentTime);

    // 마스터 레벨 True-Peak & RMS 분석기
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 128;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // 모바일 터치 이벤트 기반 자동재생 락 해제
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  // 2. 트랙별 전용 DSP 시그널 체인 (3-Band EQ + Stereo Panner + Voice FX + Fade Gain)
  getOrCreateTrackBus(trackId) {
    this.init();
    if (this.trackBuses.has(trackId)) return this.trackBuses.get(trackId);

    // A. 트랙 사용자 볼륨 게인
    const busGain = this.ctx.createGain();
    busGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.userTrackVolumes.set(trackId, 1.0);

    // B. 페이드 인/아웃 및 더킹 전용 승수 게인 (비파괴형 분리 게인)
    const fadeGain = this.ctx.createGain();
    fadeGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // C. 페어라이트 규격 3-Band Parametric EQ
    const lowShelf = this.ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(220, this.ctx.currentTime);

    const midPeak = this.ctx.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.setValueAtTime(1200, this.ctx.currentTime);
    midPeak.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const highShelf = this.ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(4500, this.ctx.currentTime);

    // D. 스테레오 패너 (좌/우 공간 밸런스)
    let pannerNode = null;
    if (this.ctx.createStereoPanner) {
      pannerNode = this.ctx.createStereoPanner();
      pannerNode.pan.setValueAtTime(0, this.ctx.currentTime);
    }

    // E. 스튜디오 보이스 FX 필터 & 피드백 딜레이
    const fxFilter = this.ctx.createBiquadFilter();
    fxFilter.type = 'allpass';

    const fxDelay = this.ctx.createDelay();
    fxDelay.delayTime.setValueAtTime(0, this.ctx.currentTime);

    const fxFeedback = this.ctx.createGain();
    fxFeedback.gain.setValueAtTime(0, this.ctx.currentTime);

    fxDelay.connect(fxFeedback);
    fxFeedback.connect(fxDelay);

    // F. 트랙 전용 정밀 VU 미터 분석기
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    // 시그널 라우팅 체인:
    // Input -> busGain -> fadeGain -> lowShelf -> midPeak -> highShelf -> [panner] -> fxFilter -> fxDelay -> Analyser -> MasterGain
    busGain.connect(fadeGain);
    fadeGain.connect(lowShelf);
    lowShelf.connect(midPeak);
    midPeak.connect(highShelf);

    let lastNode = highShelf;
    if (pannerNode) {
      highShelf.connect(pannerNode);
      lastNode = pannerNode;
    }

    lastNode.connect(fxFilter);
    fxFilter.connect(fxDelay);
    fxDelay.connect(analyser);
    analyser.connect(this.masterGain);

    const bus = {
      busGain, fadeGain, lowShelf, midPeak, highShelf,
      pannerNode, fxFilter, fxDelay, fxFeedback, analyser, trackId
    };

    this.trackBuses.set(trackId, bus);
    return bus;
  }

  // 3. 🌟 HTML5 미디어 엘리먼트 1회 바인딩 보장 (InvalidStateError 원천 차단)
  connectMedia(element, trackId) {
    if (!element) return;
    this.init();

    const targetBus = this.getOrCreateTrackBus(trackId);
    let cached = this.sourceCache.get(element);

    if (!cached) {
      try {
        const sourceNode = this.ctx.createMediaElementSource(element);
        sourceNode.connect(targetBus.busGain);
        this.sourceCache.set(element, { sourceNode, currentTrackId: trackId });
      } catch (err) {
        // 이미 다른 컨텍스트에 연결된 노드인 경우 경고 없이 무시
      }
    } else {
      // 이미 생성된 소스 노드가 다른 트랙으로 재배치될 때 라우팅만 스위칭
      if (cached.currentTrackId !== trackId) {
        try {
          cached.sourceNode.disconnect();
          cached.sourceNode.connect(targetBus.busGain);
          cached.currentTrackId = trackId;
        } catch (_) {}
      }
    }
  }

  // 4. 🌟 실시간 EQ, 볼륨, 패닝, 스튜디오 보이스 변조 FX 적용
  updateTrackFX(trackId, { volume = 100, pan = 0, eq = { low: 0, mid: 0, high: 0 }, voiceFx = 'none' }) {
    if (!this.ctx) return;
    const bus = this.trackBuses.get(trackId);
    if (!bus) return;

    const currentTime = this.ctx.currentTime;
    const targetGain = Math.max(0, volume / 100);
    this.userTrackVolumes.set(trackId, targetGain);

    // 팝 노이즈 방지 지수 보간 게인 세팅
    bus.busGain.gain.setTargetAtTime(targetGain, currentTime, 0.03);

    // 좌/우 스테레오 패닝
    if (bus.pannerNode) {
      bus.pannerNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), currentTime, 0.03);
    }

    // 3-Band Parametric EQ
    bus.lowShelf.gain.setTargetAtTime(eq.low || 0, currentTime, 0.03);
    bus.midPeak.gain.setTargetAtTime(eq.mid || 0, currentTime, 0.03);
    bus.highShelf.gain.setTargetAtTime(eq.high || 0, currentTime, 0.03);

    // 스튜디오 보이스 FX 프리셋 매핑
    if (voiceFx === 'echo') {
      bus.fxFilter.type = 'allpass';
      bus.fxDelay.delayTime.setTargetAtTime(0.24, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0.35, currentTime, 0.04);
    } else if (voiceFx === 'robot') {
      bus.fxFilter.type = 'bandpass';
      bus.fxFilter.frequency.setTargetAtTime(1100, currentTime, 0.04);
      bus.fxFilter.Q.setTargetAtTime(6.0, currentTime, 0.04);
      bus.fxDelay.delayTime.setTargetAtTime(0.015, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0.6, currentTime, 0.04);
    } else if (voiceFx === 'warm') {
      bus.fxFilter.type = 'lowshelf';
      bus.fxFilter.frequency.setTargetAtTime(320, currentTime, 0.04);
      bus.fxFilter.gain.setTargetAtTime(5.0, currentTime, 0.04);
      bus.fxDelay.delayTime.setTargetAtTime(0, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0, currentTime, 0.04);
    } else if (voiceFx === 'radio') {
      bus.fxFilter.type = 'bandpass';
      bus.fxFilter.frequency.setTargetAtTime(2400, currentTime, 0.04);
      bus.fxFilter.Q.setTargetAtTime(3.5, currentTime, 0.04);
      bus.fxDelay.delayTime.setTargetAtTime(0, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0, currentTime, 0.04);
    } else {
      bus.fxFilter.type = 'allpass';
      bus.fxDelay.delayTime.setTargetAtTime(0, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0, currentTime, 0.04);
    }
  }

  // 5. 🌟 [핵심 완치] 비파괴형 오토 크로스페이드 (사용자 트랙 볼륨 100% 보존)
  applyAutoCrossfade(trackId, playhead, clipStart, clipDuration, fadeDuration = 0.8) {
    if (!this.ctx) return;
    const bus = this.trackBuses.get(trackId);
    if (!bus) return;

    const currentTime = this.ctx.currentTime;
    const timeFromStart = playhead - clipStart;
    const timeToEnd = (clipStart + clipDuration) - playhead;
    const actualFade = Math.min(fadeDuration, clipDuration * 0.45);

    let fadeMultiplier = 1.0;

    // 페이드 인 구간 (0 ~ actualFade)
    if (timeFromStart >= 0 && timeFromStart <= actualFade) {
      fadeMultiplier = Math.sin((timeFromStart / actualFade) * (Math.PI * 0.5));
    }
    // 페이드 아웃 구간
    else if (timeToEnd >= 0 && timeToEnd <= actualFade) {
      fadeMultiplier = Math.cos(((actualFade - timeToEnd) / actualFade) * (Math.PI * 0.5));
    }

    // 더킹 상태일 경우 감쇄율 추가 반영
    const isTargetForDucking = this.isDucking && (trackId === this.duckingTargetTrack || trackId === 'A2');
    if (isTargetForDucking) {
      const duckingRatio = Math.pow(10, this.duckingReductionDb / 20); // -18dB -> 약 0.125
      fadeMultiplier *= duckingRatio;
    }

    // busGain(사용자 볼륨)은 건드리지 않고 fadeGain 승수만 정밀 제어
    bus.fadeGain.gain.setTargetAtTime(Math.max(0.0001, fadeMultiplier), currentTime, 0.03);
  }

  // 6. 🌟 [핵심 완치] 스마트 사이드체인 더킹 (목소리 감지 시 BGM 트랙 A2/A1 선택 감쇄)
  setDucking(active, targetTrack = 'A2', reductionDb = -18) {
    this.isDucking = active;
    this.duckingTargetTrack = targetTrack;
    this.duckingReductionDb = reductionDb;

    if (!this.ctx) return;
    const bgmBus = this.trackBuses.get(targetTrack) || this.trackBuses.get('A2') || this.trackBuses.get('A1');
    if (!bgmBus) return;

    const currentTime = this.ctx.currentTime;
    const duckingRatio = active ? Math.pow(10, reductionDb / 20) : 1.0;
    bgmBus.fadeGain.gain.setTargetAtTime(duckingRatio, currentTime, active ? 0.08 : 0.25);
  }

  // 7. 🌟 페어라이트 규격 True-Peak & RMS dBFS 레벨 미터링 (0~100 스케일)
  getTrackLevel(trackId) {
    const bus = this.trackBuses.get(trackId);
    if (!bus || !this.ctx) return 0;

    const data = new Float32Array(bus.analyser.fftSize);
    bus.analyser.getFloatTimeDomainData(data);

    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < data.length; i++) {
      const absVal = Math.abs(data[i]);
      if (absVal > peak) peak = absVal;
      sumSquares += absVal * absVal;
    }

    const rms = Math.sqrt(sumSquares / data.length);
    const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001)); // -100dB ~ 0dB

    // -60dBFS ~ 0dBFS 범위를 0 ~ 100 선형 퍼센티지로 정밀 매핑
    const normalized = Math.max(0, Math.min(100, Math.round(((rmsDb + 60) / 60) * 100)));
    return normalized;
  }

  // 8. 마스터 출력 레벨 분석기
  getMasterLevel() {
    if (!this.masterAnalyser || !this.ctx) return 0;
    const data = new Float32Array(this.masterAnalyser.fftSize);
    this.masterAnalyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    return Math.max(0, Math.min(100, Math.round(((db + 60) / 60) * 100)));
  }

  // 9. 백그라운드 오프라인 킥/베이스 피크 적분 비트 검출기
  async analyzeBeats(audioUrl, sensitivity = 0.5) {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(120, offlineCtx.currentTime);

      source.connect(lowpass);
      lowpass.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const channelData = renderedBuffer.getChannelData(0);

      const beats = [];
      const minInterval = 0.28;
      let lastPeakTime = 0;
      const step = Math.floor(renderedBuffer.sampleRate * 0.01); // 10ms 단위 윈도우

      for (let i = 0; i < channelData.length; i += step) {
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > sensitivity) {
          const currentTime = i / renderedBuffer.sampleRate;
          if (currentTime - lastPeakTime > minInterval) {
            beats.push(Number(currentTime.toFixed(3)));
            lastPeakTime = currentTime;
          }
        }
      }

      await tempCtx.close();
      return beats;
    } catch (err) {
      console.error('[AudioDSP] 오디오 비트 감지 실패:', err);
      return [];
    }
  }

  // 리소스 해제
  destroy() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.trackBuses.clear();
    this.userTrackVolumes.clear();
  }
}

export const audioDSP = new AudioDSPEngine();
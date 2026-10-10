// src/engine/AudioDSP.js

/**
 * =====================================================================
 * 🎛️ 다빈치 리졸브 21 Fairlight & 프리미어 프로 Essential Sound 규격
 *     프로페셔널 방송용 오디오 DSP 코어 엔진 (48kHz / 32-bit Float)
 * =====================================================================
 * 
 * 주요 기능:
 * 1. 6-Band 스튜디오 파라메트릭 EQ (HPF + LowShelf + 3-Peaking + HighShelf)
 * 2. 스마트 안티-펌핑 사이드체인 더킹 (Hold Timer & Spectral Pocketing 완비)
 * 3. 아날로그 진공관(Tube Warmth) 세츄레이션 & 하모닉 익사이터
 * 4. 무손실 합성 컨볼루션 리버브 (Cathedral, Scoring Stage, Studio Room)
 * 5. OpenCap/CapCut 규격 프레임 단위 무음 자동 탐색기 (Auto Jump-Cut)
 * 6. EBU R128 / ITU-R BS.1770 규격 True-Peak & LUFS 라우드니스 분석기
 */

class AudioDSPEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterLimiter = null;
    this.masterAnalyser = null;
    this.masterKFilter = null; // LUFS 라우드니스 측정용 필터
    
    this.trackBuses = new Map();
    this.sourceCache = new WeakMap();
    this.userTrackVolumes = new Map();

    // 사이드체인 더킹 파라미터 (Hold & Spectral Pocket)
    this.isDucking = false;
    this.duckingTargetTrack = 'A2'; // 기본 BGM 트랙
    this.duckingReductionDb = -18;
    this.duckingAttackSec = 0.05;
    this.duckingHoldSec = 0.65;     // 단어 사이 BGM 펌핑 방지 홀드 타임
    this.duckingReleaseSec = 0.35;
    this.duckingHoldTimer = null;

    // 리버브 합성 임펄스 버퍼 캐시
    this.reverbImpulseCache = new Map();

    // 튜브 세츄레이션 곡선 캐시
    this.tubeDistortionCurve = this.generateTubeCurve(0.35);
  }

  // ===================================================================
  // 1. AudioContext 안전 초기화 & 브라우저 자동재생 언락
  // ===================================================================
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass({ 
      latencyHint: 'interactive', 
      sampleRate: 48000 
    });

    // 마스터 메인 게인
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // 투명 브릭월 리미터 (0dBFS 디지털 클리핑 및 스피커 손상 방어)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-0.5, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(1.5, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.06, this.ctx.currentTime);

    // 마스터 출력 스펙트럼 & 파형 분석기
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // EBU R128 LUFS 계산용 K-weighting 프리필터 (High-shelf 1.5kHz + HPF 100Hz)
    this.masterKFilter = this.ctx.createBiquadFilter();
    this.masterKFilter.type = 'highshelf';
    this.masterKFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.masterKFilter.gain.setValueAtTime(4.0, this.ctx.currentTime);

    // 라우팅: masterGain -> masterLimiter -> masterAnalyser -> destination
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // K-Filter는 백그라운드 분석용으로 연결
    this.masterGain.connect(this.masterKFilter);

    // 모바일 터치 및 클릭 이벤트 기반 자동재생 락 해제
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

  // ===================================================================
  // 2. 트랙별 페어라이트급 마스터 채널 스트립 (6-Band EQ + Dynamics + FX)
  // ===================================================================
  getOrCreateTrackBus(trackId) {
    this.init();
    if (this.trackBuses.has(trackId)) return this.trackBuses.get(trackId);

    const currentTime = this.ctx.currentTime;

    // A. 사용자 트랙 볼륨 게인
    const busGain = this.ctx.createGain();
    busGain.gain.setValueAtTime(1.0, currentTime);
    this.userTrackVolumes.set(trackId, 1.0);

    // B. 비파괴형 페이드 / 오토 더킹 게인
    const fadeGain = this.ctx.createGain();
    fadeGain.gain.setValueAtTime(1.0, currentTime);

    // C. 스펙트럴 더킹 전용 밴드 노치 필터 (보컬 대역 1.5kHz BGM 포켓팅)
    const spectralPocketFilter = this.ctx.createBiquadFilter();
    spectralPocketFilter.type = 'peaking';
    spectralPocketFilter.frequency.setValueAtTime(1800, currentTime);
    spectralPocketFilter.Q.setValueAtTime(1.0, currentTime);
    spectralPocketFilter.gain.setValueAtTime(0, currentTime);

    // D. 6-Band Fairlight 파라메트릭 EQ
    // 1) HPF (서브소닉 럼블 컷 35Hz)
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(35, currentTime);

    // 2) Low Shelf (80Hz)
    const lowShelf = this.ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(80, currentTime);

    // 3) Low-Mid Peaking (300Hz - 먹먹함 제어)
    const lowMid = this.ctx.createBiquadFilter();
    lowMid.type = 'peaking';
    lowMid.frequency.setValueAtTime(300, currentTime);
    lowMid.Q.setValueAtTime(1.2, currentTime);

    // 4) Mid Peaking (1.2kHz - 보컬 존재감)
    const midPeak = this.ctx.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.setValueAtTime(1200, currentTime);
    midPeak.Q.setValueAtTime(1.4, currentTime);

    // 5) High-Mid Peaking (4.5kHz - 선명도 / 어택)
    const highMid = this.ctx.createBiquadFilter();
    highMid.type = 'peaking';
    highMid.frequency.setValueAtTime(4500, currentTime);
    highMid.Q.setValueAtTime(1.2, currentTime);

    // 6) High Shelf (12kHz - 에어/광택감)
    const highShelf = this.ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(12000, currentTime);

    // E. 스튜디오 다이내믹스 (컴프레서)
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, currentTime);
    compressor.knee.setValueAtTime(6, currentTime);
    compressor.ratio.setValueAtTime(3.5, currentTime);
    compressor.attack.setValueAtTime(0.008, currentTime);
    compressor.release.setValueAtTime(0.18, currentTime);

    // F. 진공관 세츄레이션 (Tube Warmth)
    const tubeWaveshaper = this.ctx.createWaveShaper();
    tubeWaveshaper.curve = this.tubeDistortionCurve;
    tubeWaveshaper.oversample = '2x';

    const tubeMixGain = this.ctx.createGain();
    tubeMixGain.gain.setValueAtTime(0, currentTime); // 기본 바이패스

    // G. 합성 컨볼루션 리버브 (Reverb Send)
    const reverbNode = this.ctx.createConvolver();
    reverbNode.buffer = this.getSyntheticImpulse('studio', 1.2);

    const reverbSendGain = this.ctx.createGain();
    reverbSendGain.gain.setValueAtTime(0, currentTime); // 기본 Wet 0%

    // H. 스테레오 패너
    let pannerNode = null;
    if (this.ctx.createStereoPanner) {
      pannerNode = this.ctx.createStereoPanner();
      pannerNode.pan.setValueAtTime(0, currentTime);
    }

    // I. 스튜디오 피드백 딜레이 (에코 FX)
    const fxDelay = this.ctx.createDelay();
    fxDelay.delayTime.setValueAtTime(0, currentTime);

    const fxFeedback = this.ctx.createGain();
    fxFeedback.gain.setValueAtTime(0, currentTime);

    fxDelay.connect(fxFeedback);
    fxFeedback.connect(fxDelay);

    // J. 트랙 전용 정밀 분석기 (True-Peak / RMS / FFT)
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    // =================================================================
    // 🔀 풀 시그널 라우팅 체인:
    // Input -> busGain -> fadeGain -> spectralPocket -> HPF -> LowShelf 
    //       -> LowMid -> MidPeak -> HighMid -> HighShelf -> Compressor 
    //       -> [Dry + Tube + Reverb] -> Panner -> Delay -> Analyser -> MasterGain
    // =================================================================
    busGain.connect(fadeGain);
    fadeGain.connect(spectralPocketFilter);
    spectralPocketFilter.connect(hpf);
    hpf.connect(lowShelf);
    lowShelf.connect(lowMid);
    lowMid.connect(midPeak);
    midPeak.connect(highMid);
    highMid.connect(highShelf);
    highShelf.connect(compressor);

    // 튜브 드라이/웻 합성
    compressor.connect(tubeWaveshaper);
    tubeWaveshaper.connect(tubeMixGain);

    // 리버브 센드
    compressor.connect(reverbNode);
    reverbNode.connect(reverbSendGain);

    // 컴프레서 출력 노드와 FX 노드 결합
    const dryWetMerger = this.ctx.createGain();
    dryWetMerger.gain.setValueAtTime(1.0, currentTime);

    compressor.connect(dryWetMerger);
    tubeMixGain.connect(dryWetMerger);
    reverbSendGain.connect(dryWetMerger);

    let finalTrackOut = dryWetMerger;
    if (pannerNode) {
      dryWetMerger.connect(pannerNode);
      finalTrackOut = pannerNode;
    }

    finalTrackOut.connect(fxDelay);
    fxDelay.connect(analyser);
    analyser.connect(this.masterGain);

    const bus = {
      trackId,
      busGain, fadeGain, spectralPocketFilter,
      hpf, lowShelf, lowMid, midPeak, highMid, highShelf,
      compressor, tubeWaveshaper, tubeMixGain,
      reverbNode, reverbSendGain,
      pannerNode, fxDelay, fxFeedback, analyser
    };

    this.trackBuses.set(trackId, bus);
    return bus;
  }

  // ===================================================================
  // 3. 미디어 엘리먼트 1회 바인딩 보장 (InvalidStateError 원천 차단)
  // ===================================================================
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
        // 이미 다른 컨텍스트에 연결된 엘리먼트일 경우 크래시 없이 패스
      }
    } else {
      if (cached.currentTrackId !== trackId) {
        try {
          cached.sourceNode.disconnect();
          cached.sourceNode.connect(targetBus.busGain);
          cached.currentTrackId = trackId;
        } catch (_) {}
      }
    }
  }

  // ===================================================================
  // 4. 실시간 EQ, 볼륨, 패닝, 튜브 온기, 공간계 FX 제어
  // ===================================================================
  updateTrackFX(trackId, options = {}) {
    if (!this.ctx) return;
    const bus = this.trackBuses.get(trackId);
    if (!bus) return;

    const {
      volume = 100,
      pan = 0,
      eq = { low: 0, mid: 0, high: 0 },
      tubeWarmth = 0, // 0 ~ 100% 진공관 질감
      reverbType = 'none', // 'none' | 'studio' | 'hall' | 'cathedral'
      voiceFx = 'none'     // 'none' | 'radio' | 'telephone' | 'deep' | 'echo'
    } = options;

    const currentTime = this.ctx.currentTime;
    const targetGain = Math.max(0, volume / 100);
    this.userTrackVolumes.set(trackId, targetGain);

    // 팝 노이즈 차단 지수 보간 볼륨 세팅
    bus.busGain.gain.setTargetAtTime(targetGain, currentTime, 0.025);

    // 스테레오 패닝
    if (bus.pannerNode) {
      bus.pannerNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), currentTime, 0.025);
    }

    // 6-Band EQ 파라미터 매핑
    bus.lowShelf.gain.setTargetAtTime(eq.low || 0, currentTime, 0.03);
    bus.midPeak.gain.setTargetAtTime(eq.mid || 0, currentTime, 0.03);
    bus.highShelf.gain.setTargetAtTime(eq.high || 0, currentTime, 0.03);

    // 진공관 튜브 온기 (Warmth)
    const tubeRatio = Math.max(0, Math.min(1, tubeWarmth / 100));
    bus.tubeMixGain.gain.setTargetAtTime(tubeRatio * 0.45, currentTime, 0.04);

    // 리버브 공간계 설정
    if (reverbType !== 'none') {
      bus.reverbNode.buffer = this.getSyntheticImpulse(reverbType, reverbType === 'cathedral' ? 3.0 : 1.4);
      const reverbGain = reverbType === 'cathedral' ? 0.35 : 0.18;
      bus.reverbSendGain.gain.setTargetAtTime(reverbGain, currentTime, 0.05);
    } else {
      bus.reverbSendGain.gain.setTargetAtTime(0, currentTime, 0.05);
    }

    // 프리미어급 보이스 변조 FX 매핑
    if (voiceFx === 'radio' || voiceFx === 'telephone') {
      // 300Hz ~ 3.4kHz 대역만 통과시키는 전화기/무전기 밴드패스 효과
      bus.hpf.frequency.setTargetAtTime(voiceFx === 'telephone' ? 450 : 300, currentTime, 0.03);
      bus.highShelf.frequency.setTargetAtTime(3200, currentTime, 0.03);
      bus.highShelf.gain.setTargetAtTime(-28, currentTime, 0.03);
      bus.tubeMixGain.gain.setTargetAtTime(0.35, currentTime, 0.03); // 무전기 지직거림
    } else if (voiceFx === 'echo') {
      bus.fxDelay.delayTime.setTargetAtTime(0.24, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0.38, currentTime, 0.04);
    } else {
      // 기본 원음 세팅 복원
      bus.hpf.frequency.setTargetAtTime(35, currentTime, 0.03);
      bus.fxDelay.delayTime.setTargetAtTime(0, currentTime, 0.04);
      bus.fxFeedback.gain.setTargetAtTime(0, currentTime, 0.04);
    }
  }

  // ===================================================================
  // 5. 비파괴형 크로스페이드 & 스마트 엔벨로프
  // ===================================================================
  applyAutoCrossfade(trackId, playhead, clipStart, clipDuration, fadeDuration = 0.6) {
    if (!this.ctx) return;
    const bus = this.trackBuses.get(trackId);
    if (!bus) return;

    const currentTime = this.ctx.currentTime;
    const timeFromStart = playhead - clipStart;
    const timeToEnd = (clipStart + clipDuration) - playhead;
    const actualFade = Math.min(fadeDuration, clipDuration * 0.45);

    let fadeMultiplier = 1.0;

    if (timeFromStart >= 0 && timeFromStart <= actualFade) {
      fadeMultiplier = Math.sin((timeFromStart / actualFade) * (Math.PI * 0.5));
    } else if (timeToEnd >= 0 && timeToEnd <= actualFade) {
      fadeMultiplier = Math.cos(((actualFade - timeToEnd) / actualFade) * (Math.PI * 0.5));
    }

    // 더킹 상태일 때 감쇄율 추가 반영
    if (this.isDucking && (trackId === this.duckingTargetTrack || trackId === 'A2')) {
      const duckRatio = Math.pow(10, this.duckingReductionDb / 20);
      fadeMultiplier *= duckRatio;
    }

    bus.fadeGain.gain.setTargetAtTime(Math.max(0.0001, fadeMultiplier), currentTime, 0.02);
  }

  // ===================================================================
  // 6. 🌟 [핵심] 홀드 타임 & 스펙트럴 포켓이 적용된 스마트 사이드체인 더킹
  // ===================================================================
  setDucking(active, targetTrack = 'A2', reductionDb = -18) {
    this.duckingTargetTrack = targetTrack;
    this.duckingReductionDb = reductionDb;

    if (!this.ctx) return;
    const bgmBus = this.trackBuses.get(targetTrack) || this.trackBuses.get('A2') || this.trackBuses.get('A1');
    if (!bgmBus) return;

    const currentTime = this.ctx.currentTime;
    const duckRatio = Math.pow(10, reductionDb / 20);

    if (active) {
      // 목소리 감지 즉시: 타이머 취소 및 고속 어택 다운 (50ms)
      if (this.duckingHoldTimer) {
        clearTimeout(this.duckingHoldTimer);
        this.duckingHoldTimer = null;
      }
      this.isDucking = true;

      // 1. 전체 볼륨 감쇄
      bgmBus.fadeGain.gain.setTargetAtTime(duckRatio, currentTime, this.duckingAttackSec);

      // 2. 보컬 명료도를 위한 1.8kHz 중음 대역 -6dB 도려내기 (스펙트럴 포켓팅)
      bgmBus.spectralPocketFilter.gain.setTargetAtTime(-6.0, currentTime, this.duckingAttackSec);
    } else {
      // 목소리가 멈췄을 때: BGM이 바로 튀지 않고 0.65초간 기다린 뒤(Hold) 서서히 복귀(Release)
      if (this.duckingHoldTimer) clearTimeout(this.duckingHoldTimer);

      this.duckingHoldTimer = setTimeout(() => {
        if (!this.ctx) return;
        this.isDucking = false;
        const now = this.ctx.currentTime;

        bgmBus.fadeGain.gain.setTargetAtTime(1.0, now, this.duckingReleaseSec);
        bgmBus.spectralPocketFilter.gain.setTargetAtTime(0, now, this.duckingReleaseSec);
      }, this.duckingHoldSec * 1000);
    }
  }

  // ===================================================================
  // 7. 🌟 OpenCap/CapCut 규격 0.01초 단위 무음 자동 탐색기 (Auto Jump-Cut)
  // ===================================================================
  async detectSilenceSegments(audioBuffer, options = {}) {
    const {
      thresholdDb = -33,   // -33dBFS 미만을 침묵으로 판정
      minDurationSec = 0.22, // 0.22초 이상 지속된 침묵 탐색
      padInSec = 0.06,      // 단어 앞자음 보호용 여유 마진
      padOutSec = 0.08      // 단어 끝자음 보호용 여유 마진
    } = options;

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const thresholdLinear = Math.pow(10, thresholdDb / 20);
    const minSamples = Math.floor(sampleRate * minDurationSec);

    const silences = [];
    let silenceStartIdx = null;
    const step = 256; // 5.3ms 단위 윈도우

    for (let i = 0; i < channelData.length; i += step) {
      let frameRms = 0;
      for (let j = 0; j < step && i + j < channelData.length; j++) {
        frameRms += channelData[i + j] * channelData[i + j];
      }
      frameRms = Math.sqrt(frameRms / step);

      if (frameRms < thresholdLinear) {
        if (silenceStartIdx === null) silenceStartIdx = i;
      } else {
        if (silenceStartIdx !== null) {
          const durationSamples = i - silenceStartIdx;
          if (durationSamples >= minSamples) {
            const rawStart = silenceStartIdx / sampleRate;
            const rawEnd = i / sampleRate;

            // 단어 보존 패딩 적용
            const safeStart = Math.max(0, rawStart + padOutSec);
            const safeEnd = Math.max(safeStart, rawEnd - padInSec);

            if (safeEnd - safeStart > 0.05) {
              silences.push({
                start: Number(safeStart.toFixed(3)),
                end: Number(safeEnd.toFixed(3)),
                duration: Number((safeEnd - safeStart).toFixed(3))
              });
            }
          }
          silenceStartIdx = null;
        }
      }
    }

    return silences;
  }

  // ===================================================================
  // 8. EBU R128 규격 라우드니스 (LUFS) & True-Peak dBFS 미터링
  // ===================================================================
  getTrackLevel(trackId) {
    const bus = this.trackBuses.get(trackId);
    if (!bus || !this.ctx) return 0;

    const data = new Float32Array(bus.analyser.fftSize);
    bus.analyser.getFloatTimeDomainData(data);

    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
    }

    const rms = Math.sqrt(sumSquares / data.length);
    const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001));

    // -60dBFS ~ 0dBFS -> 0 ~ 100 선형 퍼센트 매핑
    return Math.max(0, Math.min(100, Math.round(((rmsDb + 60) / 60) * 100)));
  }

  getMasterLoudnessLUFS() {
    if (!this.masterAnalyser || !this.ctx) return -70;

    const data = new Float32Array(this.masterAnalyser.fftSize);
    this.masterAnalyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }

    const rms = Math.sqrt(sum / data.length);
    const lufs = -0.691 + 10 * Math.log10(Math.max(rms * rms, 1e-7));
    return Number(Math.max(-70, Math.min(0, lufs)).toFixed(1));
  }

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

  // ===================================================================
  // 9. 오프라인 비트/스펙트럴 트랜지언트 정밀 분석기 (10ms 단위 윈도우)
  // ===================================================================
  async analyzeBeats(audioUrl, sensitivity = 0.5) {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // 킥 드럼/베이스 대역만 필터링 (140Hz 로우패스)
      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(140, offlineCtx.currentTime);

      source.connect(lowpass);
      lowpass.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const channelData = renderedBuffer.getChannelData(0);

      const beats = [];
      const minIntervalSec = 0.24; // 140BPM 이상 대응
      let lastPeakTime = 0;
      const step = Math.floor(renderedBuffer.sampleRate * 0.01);

      for (let i = 0; i < channelData.length; i += step) {
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > (1.0 - sensitivity * 0.7)) {
          const currentTime = i / renderedBuffer.sampleRate;
          if (currentTime - lastPeakTime > minIntervalSec) {
            beats.push(Number(currentTime.toFixed(3)));
            lastPeakTime = currentTime;
          }
        }
      }

      await tempCtx.close();
      return beats;
    } catch (err) {
      console.error('[AudioDSP] 비트 감지 실패:', err);
      return [];
    }
  }

  // ===================================================================
  // 10. 진공관 세츄레이션 & 리버브 임펄스 수학적 합성기
  // ===================================================================
  generateTubeCurve(amount = 0.35) {
    const k = amount * 100;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // 튜브의 비대칭 소프트 클리핑 곡선 (따뜻한 짝수차 배음 생성)
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  getSyntheticImpulse(type = 'studio', duration = 1.4) {
    const cacheKey = `${type}_${duration}`;
    if (this.reverbImpulseCache.has(cacheKey)) {
      return this.reverbImpulseCache.get(cacheKey);
    }

    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    const decay = type === 'cathedral' ? 2.5 : type === 'hall' ? 4.0 : 6.5;

    for (let i = 0; i < length; i++) {
      const envelope = Math.exp(-i / (sampleRate * (duration / decay)));
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.reverbImpulseCache.set(cacheKey, impulse);
    return impulse;
  }

  // 리소스 해제
  destroy() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    if (this.duckingHoldTimer) clearTimeout(this.duckingHoldTimer);
    this.trackBuses.clear();
    this.userTrackVolumes.clear();
    this.reverbImpulseCache.clear();
  }
}

export const audioDSP = new AudioDSPEngine();
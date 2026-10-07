// src/engine/BeatSyncEngine.js
import { useNLEStore } from '../store/useNLEStore';

export class BeatSyncEngine {
  /**
   * 🌟 1. 동적 RMS 이동 평균 기반 적응형 비트/트랜지언트(Kick & Snare) 피크 검출기
   * 볼륨이 작은 곡이나 큰 곡 모두에서 박자 뼈대를 정밀 검출
   * @param {string} audioUrl - 오디오 소스 URL
   * @param {number} sensitivity - 감도 계수 (1.1 ~ 1.8, 기본 1.35)
   * @param {number} minInterval - 최소 비트 간격 (초 단위, 릴스 권장 0.28s)
   */
  static async extractBeatTimestamps(audioUrl, sensitivity = 1.35, minInterval = 0.28) {
    if (!audioUrl) return [];

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // 저역 킥(Kick) 및 펀치 대역 격리 필터 (45Hz ~ 130Hz 밴드패스)
      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(130, offlineCtx.currentTime);

      const highpass = offlineCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(45, offlineCtx.currentTime);

      source.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(offlineCtx.destination);
      source.start(0);

      const filteredBuffer = await offlineCtx.startRendering();
      const channelData = filteredBuffer.getChannelData(0);

      const sampleRate = filteredBuffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.04); // 40ms 분석 윈도우
      const totalWindows = Math.floor(channelData.length / windowSize);

      // 각 윈도우의 순간 에너지(Instant Energy) 계산
      const energies = new Float32Array(totalWindows);
      for (let w = 0; w < totalWindows; w++) {
        let sum = 0;
        const offset = w * windowSize;
        for (let i = 0; i < windowSize; i++) {
          const val = channelData[offset + i];
          sum += val * val;
        }
        energies[w] = sum / windowSize;
      }

      // 적응형 이동 평균(Local Energy History) 대조 온셋 검출
      const historyBlocks = Math.floor(sampleRate / windowSize); // 약 1초 구간
      const beats = [];
      let lastPeakTime = -minInterval;

      for (let w = historyBlocks; w < totalWindows - historyBlocks; w++) {
        let localSum = 0;
        for (let h = w - historyBlocks; h < w + historyBlocks; h++) {
          localSum += energies[h];
        }
        const localAverage = localSum / (historyBlocks * 2);

        // 로컬 평균 에너지의 sensitivity 배 이상 튀어 오르고 양옆 윈도우보다 클 때 (Local Maximum)
        const currentEnergy = energies[w];
        if (
          currentEnergy > localAverage * sensitivity &&
          currentEnergy > energies[w - 1] &&
          currentEnergy >= energies[w + 1] &&
          currentEnergy > 0.0008
        ) {
          const currentTime = (w * windowSize) / sampleRate;
          if (currentTime - lastPeakTime >= minInterval) {
            beats.push(Number(currentTime.toFixed(3)));
            lastPeakTime = currentTime;
          }
        }
      }

      await audioCtx.close();

      // 스토어에 비트 마커 저장 (타임라인 눈금자 시각화 연동)
      useNLEStore.setState({ beatMarkers: beats });

      return beats;
    } catch (err) {
      console.error('[BeatSyncEngine] 고정밀 비트 분석 실패:', err);
      return [];
    }
  }

  /**
   * 🌟 2. 캡컷 프로 규격 스마트 비트 자동 싱크 (영상 연속 In-Point 완벽 보존)
   * @param {Array<number>} beatTimestamps - 분석된 비트 타임스탬프 배열
   */
  static autoCutToBeat(beatTimestamps) {
    if (!beatTimestamps || beatTimestamps.length === 0) {
      alert('감지된 비트가 없습니다. 다른 음악을 사용하거나 음악 볼륨을 확인해주세요.');
      return;
    }

    const state = useNLEStore.getState();
    const entities = JSON.parse(JSON.stringify(state.entities));
    const v1Track = entities.tracks?.['V1'];

    if (!v1Track || !v1Track.clipIds || v1Track.clipIds.length === 0) {
      alert('V1 트랙에 영상이나 사진을 먼저 배치해주세요.');
      return;
    }

    const currentClips = v1Track.clipIds.map(id => entities.clips[id]).filter(Boolean);

    // =========================================================================
    // [CASE 1] 다중 사진/클립이 이미 존재하는 경우: 사진 템포 비트 스냅
    // =========================================================================
    if (currentClips.length > 1) {
      let currentTime = 0;
      const updatedClipIds = [];

      currentClips.forEach((clip, idx) => {
        const targetEndTime = beatTimestamps[idx] || (currentTime + 1.2);
        const duration = Math.max(0.35, Number((targetEndTime - currentTime).toFixed(2)));

        const tf = clip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
        const color = clip.color || { lift: 0, gamma: 100, gain: 100, saturation: 100 };

        entities.clips[clip.id] = {
          ...clip,
          start: currentTime,
          duration: duration,
          beatImpact: true,
          transform: tf,
          color: color,
          crop: clip.crop || { left: 0, right: 0, top: 0, bottom: 0 },
          gridConfig: clip.gridConfig || { mode: 'single', rows: 1, cols: 1, gap: 0 },
          animation: idx % 2 === 0 ? 'zoomIn' : 'slideUp',
          transition: idx % 3 === 0 ? 'flashWhite' : idx % 3 === 1 ? 'zoomBlur' : 'whipLeft'
        };

        updatedClipIds.push(clip.id);
        currentTime += duration;
      });

      v1Track.clipIds = updatedClipIds;
      useNLEStore.setState({
        entities,
        projectDuration: Math.max(currentTime, state.projectDuration || 5),
        playhead: 0,
        isPlaying: false
      });

      alert(`⚡ 총 ${currentClips.length}장의 미디어가 BGM 비트에 맞춰 칼박 스냅 정렬되었습니다!`);
      return;
    }

    // =========================================================================
    // [CASE 2] 단일 비디오 영상 1개인 경우: 끊김 없는 연속 In-Point 비트 분할
    // =========================================================================
    const masterClip = currentClips[0];
    const newClipIds = [];
    let previousTime = 0;
    const masterDuration = masterClip.duration || 10;
    const masterInPoint = masterClip.inPoint || masterClip.mediaOffset || 0;

    // 비트 지점이 영상 길이를 넘지 않도록 필터링
    const validBeats = beatTimestamps.filter(t => t < masterDuration);
    if (validBeats.length === 0) {
      validBeats.push(Number((masterDuration * 0.5).toFixed(2)));
    }

    validBeats.forEach((beatTime, idx) => {
      if (beatTime <= previousTime) return;

      const duration = Number((beatTime - previousTime).toFixed(2));
      const subClipId = `clip_beat_${Date.now()}_${idx}`;

      const tf = masterClip.transform || { x: 0, y: 0, scale: 100, rotate: 0 };
      const color = masterClip.color || { lift: 0, gamma: 100, gain: 100, saturation: 100 };

      // 🌟 [핵심 완치] 각 조각의 원본 비디오 시작 지점(inPoint)을 연속 전진시켜 무한 반복 재생 차단
      const sliceInPoint = masterInPoint + previousTime;

      entities.clips[subClipId] = {
        ...masterClip,
        id: subClipId,
        start: previousTime,
        duration: duration,
        inPoint: sliceInPoint,
        mediaOffset: sliceInPoint,
        beatImpact: true,
        transform: tf,
        color: color,
        crop: masterClip.crop || { left: 0, right: 0, top: 0, bottom: 0 },
        gridConfig: masterClip.gridConfig || { mode: 'single', rows: 1, cols: 1, gap: 0 },
        animation: idx % 2 === 0 ? 'zoomIn' : 'none',
        transition: idx % 2 === 0 ? 'zoomBlur' : 'whipLeft'
      };

      newClipIds.push(subClipId);
      previousTime = beatTime;
    });

    // 마지막 남은 자투리 구간도 온전한 클립으로 보존
    if (previousTime < masterDuration) {
      const lastDuration = Number((masterDuration - previousTime).toFixed(2));
      const lastClipId = `clip_beat_${Date.now()}_end`;
      const sliceInPoint = masterInPoint + previousTime;

      entities.clips[lastClipId] = {
        ...masterClip,
        id: lastClipId,
        start: previousTime,
        duration: lastDuration,
        inPoint: sliceInPoint,
        mediaOffset: sliceInPoint,
        beatImpact: false,
        transform: masterClip.transform || { x: 0, y: 0, scale: 100, rotate: 0 },
        color: masterClip.color || { lift: 0, gamma: 100, gain: 100, saturation: 100 }
      };
      newClipIds.push(lastClipId);
    }

    delete entities.clips[masterClip.id];
    v1Track.clipIds = newClipIds;

    useNLEStore.setState({
      entities,
      projectDuration: Math.max(masterDuration, state.projectDuration || 5),
      playhead: 0,
      isPlaying: false
    });

    alert(`⚡ 단일 영상이 ${newClipIds.length}개의 리듬 비트 컷으로 자동 분할 및 트랜지션 합성되었습니다!`);
  }

  /**
   * 🌟 3. 종합 오디오 탐색 (A1 -> A2 -> V1 순차 자동 탐색 후 원터치 실행)
   */
  static async analyzeAndAutoSync() {
    const state = useNLEStore.getState();
    const tracks = state.entities?.tracks || {};
    const clips = state.entities?.clips || {};

    // 1. A1, A2 오디오 트랙 우선 탐색 후 V1 비디오 오디오까지 자동 검사
    const targetTrackIds = ['A1', 'A2', 'V1'];
    let targetAudioUrl = null;
    let foundTrackName = '';

    for (const tId of targetTrackIds) {
      const track = tracks[tId];
      if (track?.clipIds && track.clipIds.length > 0) {
        const firstClip = clips[track.clipIds[0]];
        if (firstClip?.url) {
          targetAudioUrl = firstClip.url;
          foundTrackName = tId;
          break;
        }
      }
    }

    if (!targetAudioUrl) {
      alert('타임라인(A1, A2, V1)에 음악 또는 영상 파일을 먼저 올려주세요.');
      return;
    }

    const beats = await this.extractBeatTimestamps(targetAudioUrl);
    if (beats && beats.length > 0) {
      this.autoCutToBeat(beats);
    } else {
      alert(`[${foundTrackName}] 트랙의 비트 에너지를 감지하지 못했습니다. 더 비트가 뚜렷한 음원을 등록해주세요.`);
    }
  }
}
// src/engine/ExportEngine.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { useNLEStore } from '../store/useNLEStore';

export function useExportEngine() {
  const ffmpegRef = useRef(new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // 1. FFmpeg v0.12 WASM 코어 안정 로드 (단일 스레드 호환 모드)
  useEffect(() => {
    let isMounted = true;
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      if (ffmpeg.loaded) {
        if (isMounted) setIsLoaded(true);
        return;
      }

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]', message));
        ffmpeg.on('progress', ({ progress }) => {
          // 트랜스코딩 구간: 70% ~ 100% 매핑
          const calculated = 70 + Math.round(progress * 30);
          if (isMounted) setExportProgress(Math.min(99, calculated));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });

        if (isMounted) setIsLoaded(true);
      } catch (err) {
        console.warn('[ExportEngine] FFmpeg WASM 로드 실패 (브라우저 네이티브 다이렉트 다운로드 모드로 전환):', err);
      }
    };

    loadFFmpeg();
    return () => { isMounted = false; };
  }, []);

  // 2. 브라우저 지원 코덱 자동 선별 (iOS 사파리 MP4 / PC 크롬 WebM 완전 대응)
  const getSupportedMimeType = () => {
    const candidateTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const t of candidateTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // 3. 타임라인 내 모든 오디오/비디오 소스 실시간 믹싱 스트림 생성
  const collectAudioStream = () => {
    try {
      const audioElements = Array.from(document.querySelectorAll('audio, video'));
      const activeAudios = audioElements.filter(el => !el.muted && el.volume > 0);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx || activeAudios.length === 0) return null;

      const actx = new AudioCtx();
      const dest = actx.createMediaStreamDestination();

      activeAudios.forEach(el => {
        try {
          const source = actx.createMediaElementSource(el);
          source.connect(dest);
          source.connect(actx.destination); // 모니터링 유지
        } catch (_) {
          // 이미 연결된 오디오 소스 건너뜀
        }
      });

      return dest.stream;
    } catch (e) {
      return null;
    }
  };

  // 4. 🌟 프로젝트 0초 동기화 녹화 및 최종 H.264 인코딩 마스터 파이프라인
  const renderProject = useCallback(async (canvasElement, customAudioStream, durationSec) => {
    if (!canvasElement) {
      alert("렌더링할 화면 요소를 찾을 수 없습니다.");
      return;
    }

    const mimeType = getSupportedMimeType();
    const targetDuration = Math.max(1, durationSec || useNLEStore.getState().projectDuration || 5);
    const store = useNLEStore.getState();

    setExportProgress(3);
    setStatusText('시네마 프레임 렌더 파이프라인 준비 중...');

    // [A] 재생헤드 0초 초기화 및 자동 동기화 재생 시작
    useNLEStore.setState({ playhead: 0, isPlaying: true });

    try {
      // 비디오 캔버스 30fps 스트림 캡처
      const videoStream = canvasElement.captureStream ? canvasElement.captureStream(30) : null;
      if (!videoStream) throw new Error('브라우저가 캔버스 비디오 스트림 캡처를 지원하지 않습니다.');

      const combinedTracks = [...videoStream.getVideoTracks()];

      // 오디오 트랙 자동 감지 합성
      const mixedAudioStream = customAudioStream || collectAudioStream();
      if (mixedAudioStream) {
        const audioTracks = mixedAudioStream.getAudioTracks();
        if (audioTracks.length > 0) {
          combinedTracks.push(audioTracks[0]);
        }
      }

      const recordStream = new MediaStream(combinedTracks);
      const recorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 12000000 } : undefined;
      const recorder = new MediaRecorder(recordStream, recorderOptions);

      const recordedChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };

      const recordStopPromise = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start(100);
      setStatusText('실시간 타임라인 시네마 녹화 중...');

      // 녹화 진행률 실시간 갱신 인터벌
      const startRecordTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startRecordTime) / 1000;
        const recordPct = Math.min(68, Math.round((elapsed / targetDuration) * 65) + 3);
        setExportProgress(recordPct);
      }, 200);

      // 전체 영상 재생 길이 동안 녹화 대기
      await new Promise(res => setTimeout(res, targetDuration * 1000));
      clearInterval(progressTimer);

      // 녹화 종료 및 재생 정지
      recorder.stop();
      useNLEStore.setState({ isPlaying: false, playhead: 0 });
      await recordStopPromise;

      const rawBlob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
      setExportProgress(70);
      setStatusText('H.264 방송 규격 트랜스코딩 중...');

      const ffmpeg = ffmpegRef.current;
      const isAlreadyMp4 = mimeType.includes('mp4');

      // [B] FFmpeg WASM을 통한 표준 H.264 MP4 변환
      if (ffmpeg.loaded && !isAlreadyMp4) {
        const inputName = 'input_temp.webm';
        const outputName = `output_${Date.now()}.mp4`;

        const arrayBuf = await rawBlob.arrayBuffer();
        await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuf));

        await ffmpeg.exec([
          '-i', inputName,
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-preset', 'ultrafast',
          '-movflags', '+faststart',
          '-c:a', 'aac',
          '-b:a', '192k',
          outputName
        ]);

        const mp4Data = await ffmpeg.readFile(outputName);
        const finalMp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' });

        // 가상 파일 소각 (메모리 누수 원천 차단)
        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});

        triggerDownload(finalMp4Blob, `GTC_REELS_${Date.now()}.mp4`);
      } else {
        // iOS 사파리거나 FFmpeg 미지원 시 캡처 원본 직접 다운로드
        const ext = isAlreadyMp4 ? 'mp4' : 'webm';
        triggerDownload(rawBlob, `GTC_REELS_${Date.now()}.${ext}`);
      }

      setExportProgress(100);
      setStatusText('내보내기 완료!');
    } catch (err) {
      console.error('[ExportEngine] 렌더링 에러:', err);
      useNLEStore.setState({ isPlaying: false });
      alert('영상 내보내기 실패: ' + err.message);
    } finally {
      setTimeout(() => {
        setExportProgress(0);
        setStatusText('');
      }, 1200);
    }
  }, []);

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return { isLoaded, exportProgress, statusText, renderProject };
}
// src/engine/ExportEngine.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { createFile } from 'mp4box';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { useNLEStore } from '../store/useNLEStore';

/**
 * =====================================================================
 * 🚀 프로페셔널 듀얼 렌더링 & 하드웨어 익스포트 마스터 엔진
 * =====================================================================
 * 
 * 1. Engine A (기본 고속): WebCodecs (VideoEncoder) + MP4Box
 *    - GPU 하드웨어 가속 H.264 High Profile (avc1.64002a)
 *    - 실시간 재생 대기 없이 1080x1920 프레임 초고속 직렬 인코딩
 *    - 비트레이트: 16 Mbps (인스타그램 릴스 / 유튜브 쇼츠 권장 최고 화질)
 * 
 * 2. Engine B (안전 폴백): MediaStream capture + FFmpeg WASM v0.12
 *    - WebCodecs 미지원 브라우저 및 구형 모바일 환경 자동 전환
 *    - libx264 yuv420p + aac 192k 무손실 트랜스코딩
 */
export function useExportEngine() {
  const ffmpegRef = useRef(new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // 1. FFmpeg WASM 폴백 코어 백그라운드 선제 적재
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
        ffmpeg.on('progress', ({ progress }) => {
          const calculated = 70 + Math.round(progress * 30);
          if (isMounted) setExportProgress(Math.min(99, calculated));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });

        if (isMounted) setIsLoaded(true);
      } catch (err) {
        // WebCodecs 가속을 기본으로 사용하므로 에러 발생 시 플래그만 true 유지
        if (isMounted) setIsLoaded(true);
      }
    };

    loadFFmpeg();
    return () => { isMounted = false; };
  }, []);

  // 2. 다운로드 트리거 유틸리티
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // 3. 브라우저 오디오 라우팅 수집기
  const collectAudioTracks = () => {
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
          source.connect(actx.destination);
        } catch (_) {}
      });

      return dest.stream;
    } catch (e) {
      return null;
    }
  };

  // 4. [Engine A] WebCodecs + MP4Box 하드웨어 가속 고속 렌더러
  const exportViaWebCodecs = async (canvasElement, targetDuration, fps = 30) => {
    const width = 1080;
    const height = 1920;
    const totalFrames = Math.ceil(targetDuration * fps);
    const mp4File = createFile();
    let videoTrackId = null;

    setStatusText('GPU 하드웨어 가속(WebCodecs) 렌더링 파이프라인 가동...');
    setExportProgress(5);

    return new Promise(async (resolve, reject) => {
      try {
        const encoder = new VideoEncoder({
          output: (chunk, metadata) => {
            if (videoTrackId === null) {
              const description = metadata.decoderConfig?.description;
              videoTrackId = mp4File.addTrack({
                timescale: 1000,
                width,
                height,
                nb_samples: totalFrames,
                avcDecoderConfigRecord: description
              });
            }

            const buffer = new ArrayBuffer(chunk.byteLength);
            chunk.copyTo(buffer);

            mp4File.addSample(videoTrackId, buffer, {
              duration: Math.round(1000 / fps),
              dts: Math.round(chunk.timestamp / 1000),
              cts: Math.round(chunk.timestamp / 1000),
              is_sync: chunk.type === 'key'
            });
          },
          error: (e) => reject(e)
        });

        encoder.configure({
          codec: 'avc1.64002a', // H.264 High Profile Level 4.2
          width,
          height,
          bitrate: 16_000_000, // 16 Mbps
          framerate: fps,
          hardwareAcceleration: 'prefer-hardware'
        });

        // 타임라인 재생헤드 제어하며 프레임 인코딩
        const state = useNLEStore.getState();
        state.setIsPlaying(false);

        for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
          const currentSec = frameIdx / fps;
          state.setPlayhead(currentSec);

          // 프레임 렌더 완료 대기
          await new Promise(r => requestAnimationFrame(r));

          const timestampMicrosec = Math.round(currentSec * 1_000_000);
          const videoFrame = new VideoFrame(canvasElement, {
            timestamp: timestampMicrosec,
            duration: Math.round((1 / fps) * 1_000_000)
          });

          const isKeyFrame = frameIdx % (fps * 2) === 0;
          encoder.encode(videoFrame, { keyFrame: isKeyFrame });
          videoFrame.close();

          const pct = Math.min(85, Math.round((frameIdx / totalFrames) * 80) + 5);
          setExportProgress(pct);
          setStatusText(`프레임 인코딩 중... (${frameIdx + 1}/${totalFrames})`);
        }

        await encoder.flush();
        encoder.close();

        setExportProgress(90);
        setStatusText('MP4 컨테이너 패키징(MP4Box Muxing) 중...');

        mp4File.onFlush = () => {
          const buffer = mp4File.getBuffer();
          const finalBlob = new Blob([buffer], { type: 'video/mp4' });
          resolve(finalBlob);
        };

        mp4File.flush();
      } catch (err) {
        reject(err);
      }
    });
  };

  // 5. [Engine B] MediaRecorder + FFmpeg WASM 안전 폴백 렌더러
  const exportViaMediaRecorder = async (canvasElement, customAudioStream, targetDuration) => {
    setStatusText('실시간 시네마 스트림 녹화 중...');
    setExportProgress(5);

    useNLEStore.setState({ playhead: 0, isPlaying: true });

    const videoStream = canvasElement.captureStream ? canvasElement.captureStream(30) : null;
    if (!videoStream) throw new Error('브라우저가 캔버스 캡처를 지원하지 않습니다.');

    const combinedTracks = [...videoStream.getVideoTracks()];
    const mixedAudioStream = customAudioStream || collectAudioTracks();
    if (mixedAudioStream) {
      const audioTracks = mixedAudioStream.getAudioTracks();
      if (audioTracks.length > 0) combinedTracks.push(audioTracks[0]);
    }

    const recordStream = new MediaStream(combinedTracks);
    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' : 'video/webm';
    const recorder = new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 16000000 });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const stopPromise = new Promise(res => { recorder.onstop = res; });
    recorder.start(100);

    const startRecordTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - startRecordTime) / 1000;
      const recordPct = Math.min(68, Math.round((elapsed / targetDuration) * 63) + 5);
      setExportProgress(recordPct);
    }, 200);

    await new Promise(res => setTimeout(res, targetDuration * 1000));
    clearInterval(progressTimer);

    recorder.stop();
    useNLEStore.setState({ isPlaying: false, playhead: 0 });
    await stopPromise;

    const rawBlob = new Blob(chunks, { type: mimeType });
    setExportProgress(70);
    setStatusText('FFmpeg H.264 방송 규격 트랜스코딩 중...');

    const ffmpeg = ffmpegRef.current;
    if (ffmpeg.loaded && !mimeType.includes('mp4')) {
      const inputName = `input_${Date.now()}.webm`;
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
      const finalBlob = new Blob([mp4Data.buffer], { type: 'video/mp4' });

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      return finalBlob;
    }

    return rawBlob;
  };

  // 6. 마스터 렌더 프로젝트 진입점 (하이브리드 자동 분기)
  const renderProject = useCallback(async (canvasElement, customAudioStream, durationSec) => {
    if (!canvasElement) {
      alert('렌더링할 화면 요소를 찾을 수 없습니다.');
      return;
    }

    const targetDuration = Math.max(1, durationSec || useNLEStore.getState().projectDuration || 5);
    const filename = `GTC_REELS_${Date.now()}.mp4`;

    try {
      let finalBlob = null;

      // WebCodecs API 지원 여부 확인
      const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

      if (hasWebCodecs) {
        try {
          finalBlob = await exportViaWebCodecs(canvasElement, targetDuration, 30);
        } catch (webCodecsErr) {
          console.warn('[ExportEngine] WebCodecs 가속 실패, 안전 폴백 엔진으로 자동 전환:', webCodecsErr);
          finalBlob = await exportViaMediaRecorder(canvasElement, customAudioStream, targetDuration);
        }
      } else {
        finalBlob = await exportViaMediaRecorder(canvasElement, customAudioStream, targetDuration);
      }

      setExportProgress(100);
      setStatusText('내보내기 완료!');
      triggerDownload(finalBlob, filename);
    } catch (err) {
      console.error('[ExportEngine] 렌더링 치명적 에러:', err);
      alert('영상 내보내기 실패: ' + err.message);
    } finally {
      useNLEStore.setState({ isPlaying: false, playhead: 0 });
      setTimeout(() => {
        setExportProgress(0);
        setStatusText('');
      }, 1500);
    }
  }, []);

  return { isLoaded, exportProgress, statusText, renderProject };
}
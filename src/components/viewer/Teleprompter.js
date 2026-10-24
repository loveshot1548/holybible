// src/components/viewer/Teleprompter.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { audioDSP } from '../../engine/AudioDSP';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgMirror = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
  </svg>
);
const SvgEyeGuide = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const SvgEdit = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);
const SvgMic = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Teleprompter({ scriptText = '', onClose = () => {} }) {
  const { addClipToTrack, playhead, setIsPlaying, projectDuration } = useNLEStore();

  const [currentScript, setCurrentScript] = useState(
    scriptText || '오늘 전하는 메시지가 많은 이들에게 큰 울림과 평안으로 전달되기를 소망합니다.'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [scrollSpeed, setScrollSpeed] = useState(32);
  const [fontSize, setFontSize] = useState(28);
  const [isMirrored, setIsMirrored] = useState(false);
  const [showEyeGuide, setShowEyeGuide] = useState(true);
  const [eyeGuidePos, setEyeGuidePos] = useState(38);
  const [targetCaptionTrack, setTargetCaptionTrack] = useState('T1');
  const [autoCaptionEnabled, setAutoCaptionEnabled] = useState(true);

  const [recognizedText, setRecognizedText] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [micLevel, setMicLevel] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const actualMimeTypeRef = useRef('audio/webm');
  const scrollRef = useRef(null);
  const recordStartTimeRef = useRef(0);
  const lastCaptionStartRef = useRef(0);
  const rafId = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const countdownTimerRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);

  // 1. STT 음성인식 초기화 및 침묵 후 끊김 방지(Auto-Restart) 파이프라인
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event) => {
        if (!autoCaptionEnabled) return;
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const currentHead = useNLEStore.getState().playhead;
            const captionStart = lastCaptionStartRef.current;
            const duration = Math.max(1.2, Number((currentHead - captionStart).toFixed(2)));

            const clipId = `stt_caption_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

            // 🌟 transform 및 style 객체를 완비하여 뷰어 런타임 크래시 100% 방지
            addClipToTrack(targetCaptionTrack, {
              id: clipId,
              type: 'text',
              content: transcript.trim(),
              start: Number(captionStart.toFixed(2)),
              duration,
              trackId: targetCaptionTrack,
              style: {
                fontSize: 26,
                fontFamily: 'Pretendard, sans-serif',
                color: '#FFFFFF',
                strokeWidth: 2.2,
                strokeColor: '#000000',
                backgroundColor: 'rgba(0,0,0,0.72)',
                align: 'center',
                lineHeight: 1.35
              },
              transform: { x: 0, y: 0, scale: 100, rotate: 0 },
              opacity: 100,
              animation: 'popIn'
            });

            // 프로젝트 길이 확장 보장
            const currentProjectDur = useNLEStore.getState().projectDuration || 10;
            if (captionStart + duration > currentProjectDur) {
              useNLEStore.setState({ projectDuration: Number((captionStart + duration + 1).toFixed(1)) });
            }

            lastCaptionStartRef.current = currentHead;
            setRecognizedText('');
          } else {
            interim += transcript;
          }
        }
        if (interim) setRecognizedText(interim);
      };

      // 🌟 화자가 말을 멈춰도 녹음 중이면 음성인식 세션 즉시 자동 복구
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('[Teleprompter STT]', e.error);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSttSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [addClipToTrack, autoCaptionEnabled, targetCaptionTrack]);

  // 2. 부드러운 텍스트 오토 스크롤 애니메이션
  const smoothScroll = useCallback(() => {
    if (scrollRef.current && isRecordingRef.current) {
      scrollRef.current.scrollTop += (scrollSpeed / 60);
      rafId.current = requestAnimationFrame(smoothScroll);
    }
  }, [scrollSpeed]);

  useEffect(() => {
    if (isRecording) {
      rafId.current = requestAnimationFrame(smoothScroll);
    } else if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isRecording, smoothScroll]);

  // 3. 마이크 실시간 음압 레벨 분석기
  const startAudioMetering = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round(avg * 1.8)));
        micAnimFrameRef.current = requestAnimationFrame(checkVolume);
      };

      micAnimFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('[Teleprompter] 오디오 미터링 초기화 실패:', err);
    }
  };

  // 4. 카운트다운 제어
  const handleInitiateSession = () => {
    if (isRecording) {
      stopRecordingSession();
      return;
    }

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(3);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          startRecordingSession();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 5. 보이스 레코딩 시작 파이프라인
  const startRecordingSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      startAudioMetering(stream);

      // 🌟 사파리 호환 코덱 선별 (MP4 / WebM 정밀 감지)
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
      let selectedMime = 'audio/webm';
      for (const t of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMime = t;
          break;
        }
      }
      actualMimeTypeRef.current = selectedMime;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // 🌟 실제 녹음된 규격 그대로 Blob 생성하여 파일 손상 원천 차단
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeTypeRef.current });
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordEnd = useNLEStore.getState().playhead;
        const totalDuration = Math.max(1, Number((recordEnd - recordStartTimeRef.current).toFixed(2)));

        const newClipId = `clip_voice_${Date.now()}`;
        addClipToTrack('A1', {
          id: newClipId,
          type: 'audio',
          name: '🎙️ 보이스오버 녹음',
          url: audioUrl,
          start: Number(recordStartTimeRef.current.toFixed(2)),
          duration: totalDuration,
          volume: 100,
          speed: 1.0,
          trackId: 'A1'
        });

        // 타임라인 프로젝트 전체 길이 자동 확장
        const currentProjectDur = useNLEStore.getState().projectDuration || 10;
        if (recordStartTimeRef.current + totalDuration > currentProjectDur) {
          useNLEStore.setState({ projectDuration: Number((recordStartTimeRef.current + totalDuration + 1).toFixed(1)) });
        }

        stream.getTracks().forEach((t) => t.stop());
        if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      const currentHead = useNLEStore.getState().playhead || 0;
      recordStartTimeRef.current = currentHead;
      lastCaptionStartRef.current = currentHead;

      isRecordingRef.current = true;
      setIsPlaying(true);
      setIsRecording(true);

      if (autoCaptionEnabled && sttSupported && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (_) {}
      }

      // 🌟 오디오 DSP 엔진 스마트 더킹 즉각 연동 (BGM -18dB 감쇄)
      if (typeof audioDSP?.setDucking === 'function') {
        audioDSP.setDucking(true, 'A2', -18);
      }
      window.dispatchEvent(new CustomEvent('gtc-ducking-trigger', { detail: { ducking: true } }));
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
    }
  };

  // 6. 녹음 종료 파이프라인
  const stopRecordingSession = () => {
    isRecordingRef.current = false;
    setIsPlaying(false);
    setIsRecording(false);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
    }

    if (sttSupported && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // 🌟 오디오 DSP 엔진 더킹 원복
    if (typeof audioDSP?.setDucking === 'function') {
      audioDSP.setDucking(false, 'A2', 0);
    }
    window.dispatchEvent(new CustomEvent('gtc-ducking-trigger', { detail: { ducking: false } }));
    setMicLevel(0);
    onClose();
  };

  // 대본 완독 예상 시간 산출
  const estimatedReadTime = useMemo(() => {
    const charCount = currentScript.replace(/\s/g, '').length;
    const estSec = Math.round(charCount / (scrollSpeed * 0.18));
    const m = Math.floor(estSec / 60);
    const s = estSec % 60;
    return `${m}분 ${s}초`;
  }, [currentScript, scrollSpeed]);

  return (
    <div className="fixed inset-0 z-[140] bg-[#07080B]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 md:p-6 select-none animate-fade-in text-zinc-100 font-sans">
      
      {/* [1] 상단 컨트롤 헤더 */}
      <div className="w-full max-w-4xl bg-[#12141C] border border-white/10 rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold mb-0.5">
              <span>스크롤 속도</span>
              <span className="text-[#00E5FF]">{scrollSpeed}</span>
            </div>
            <input 
              type="range" min="10" max="90" value={scrollSpeed}
              onChange={e => setScrollSpeed(Number(e.target.value))}
              className="w-24 md:w-32 h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold mb-0.5">
              <span>폰트 크기</span>
              <span className="text-[#00E5FF]">{fontSize}px</span>
            </div>
            <input 
              type="range" min="20" max="52" value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="w-24 md:w-32 h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          {showEyeGuide && (
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold mb-0.5">
                <span>시선 가이드 높이</span>
                <span className="text-amber-400">{eyeGuidePos}%</span>
              </div>
              <input 
                type="range" min="20" max="70" value={eyeGuidePos}
                onChange={e => setEyeGuidePos(Number(e.target.value))}
                className="w-20 md:w-28 h-1 accent-amber-400 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isEditing ? 'bg-[#00E5FF] text-black border-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="대본 내용 수정"
          >
            <SvgEdit/>
            <span>{isEditing ? '편집 완료' : '대본 수정'}</span>
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
              isMirrored ? 'bg-[#00E5FF] text-black border-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="스튜디오 빔스플리터 좌우 반전"
          >
            <SvgMirror/>
          </button>

          <button
            onClick={() => setShowEyeGuide(!showEyeGuide)}
            className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
              showEyeGuide ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="카메라 렌즈 아이라인 가이드"
          >
            <SvgEyeGuide/>
          </button>

          <select
            value={targetCaptionTrack}
            onChange={e => setTargetCaptionTrack(e.target.value)}
            className="bg-[#0A0B0E] border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-white outline-none cursor-pointer"
            title="STT 자막 삽입 대상 트랙"
          >
            <option value="T1">자막: T1</option>
            <option value="T2">자막: T2</option>
          </select>

          <button 
            onClick={() => {
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
              if (isRecording) stopRecordingSession();
              else onClose();
            }}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer ml-1"
          >
            <SvgClose/>
          </button>
        </div>
      </div>

      {/* [2] 메인 프롬프터 뷰포트 (대본 스크롤 영역) */}
      <div className="w-full max-w-3xl flex-1 max-h-[58vh] relative overflow-hidden my-3 border border-white/10 rounded-3xl bg-black/75 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />
        
        {showEyeGuide && !isEditing && (
          <div 
            style={{ top: `${eyeGuidePos}%` }}
            className="absolute inset-x-0 h-10 -translate-y-1/2 border-y border-amber-400/40 bg-amber-400/[0.04] z-10 pointer-events-none flex items-center justify-between px-4"
          >
            <span className="text-[9px] font-mono text-amber-300 font-bold tracking-wider">▲ LENS FOCUS EYE LINE</span>
            <span className="text-[9px] font-mono text-amber-300 font-bold tracking-wider">LENS FOCUS EYE LINE ▲</span>
          </div>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center animate-fade-in">
            <div className="text-8xl font-black text-[#00E5FF] font-mono animate-ping">
              {countdown}
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="h-full p-6 flex flex-col gap-3 z-30 relative bg-[#090A0E]">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-bold">
              <span>대본 입력 (줄바꿈 지원)</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentScript('오늘 전하는 메시지가 많은 이들에게 큰 울림과 평안으로 전달되기를 소망합니다.')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300"
                >
                  기본 템플릿
                </button>
              </div>
            </div>
            <textarea
              value={currentScript}
              onChange={e => setCurrentScript(e.target.value)}
              className="w-full flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-base font-bold outline-none resize-none leading-relaxed focus:border-[#00E5FF]"
              placeholder="촬영할 대본이나 내레이션 내용을 입력하세요..."
            />
          </div>
        ) : (
          <div 
            ref={scrollRef} 
            className={`h-full overflow-y-auto px-8 md:px-16 pt-52 pb-52 hide-scrollbar text-center ${
              isMirrored ? 'scale-x-[-1]' : ''
            }`}
          >
            <p 
              className="font-black text-white leading-[2.2] tracking-wide whitespace-pre-wrap font-sans transition-all drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentScript || '대본 내용이 없습니다. 상단 [대본 수정] 버튼을 눌러 내용을 입력하세요.'}
            </p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
      </div>

      {/* [3] 음성 인식 및 마이크 미터링 바 */}
      <div className="w-full max-w-xl flex flex-col items-center gap-2">
        <div className="w-64 flex items-center gap-2 bg-[#12141C] border border-white/10 px-3 py-1 rounded-full">
          <span className="p-0.5 rounded text-emerald-400"><SvgMic/></span>
          <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${micLevel}%`,
                background: 'linear-gradient(to right, #10B981 60%, #F59E0B 85%, #EF4444 100%)'
              }}
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-400 font-bold w-6 text-right">{micLevel}%</span>
        </div>

        <div className="h-6 text-center">
          {recognizedText ? (
            <span className="text-xs font-bold text-[#00E5FF] animate-pulse bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-4 py-1 rounded-full">
              🎙️ "{recognizedText}"
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 font-medium">
              {isRecording 
                ? (sttSupported ? '음성을 실시간 인식하여 T1 자막과 A1 오디오에 동시 기록 중...' : '보이스오버 오디오 녹음 진행 중...')
                : `완독 예상 시간: 약 ${estimatedReadTime} • 셔터 클릭 시 3초 후 녹음 개시`}
            </span>
          )}
        </div>
      </div>

      {/* [4] 녹음 셔터 버튼 */}
      <div className="flex flex-col items-center gap-1.5 mt-1">
        <button
          onClick={handleInitiateSession}
          className={`w-18 h-18 rounded-full flex items-center justify-center transition-all shadow-[0_0_25px_rgba(0,0,0,0.8)] cursor-pointer active:scale-95 ${
            isRecording 
              ? 'bg-black border-4 border-rose-500 ring-4 ring-rose-500/30 scale-105' 
              : 'bg-white hover:bg-zinc-200 border-4 border-[#00E5FF] ring-4 ring-[#00E5FF]/20'
          }`}
        >
          <div className={`transition-all ${isRecording ? 'w-6 h-6 rounded-md bg-rose-500' : 'w-7 h-7 rounded-full bg-black'}`} />
        </button>
        
        <span className="text-[11px] font-black text-white tracking-wider">
          {isRecording ? '녹음 정지 및 타임라인 즉시 삽입' : '3초 레디 & 보이스 녹음 시작'}
        </span>
      </div>

    </div>
  );
}
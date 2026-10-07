// src/components/timeline/FairlightMixer.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { audioDSP } from '../../engine/AudioDSP';

// 엔터프라이즈 모노크롬 SVG 아이콘
const SvgDucking = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const SvgReset = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export default function FairlightMixer() {
  const { trackList, isPlaying, entities, updateClip, playhead } = useNLEStore();
  
  // A1, A2, A3 등 모든 오디오 트랙 추출 (없을 경우 기본 A1, A2 프로비저닝)
  const audioTracks = useMemo(() => {
    const list = (trackList || []).filter(id => id.startsWith('A'));
    return list.length > 0 ? list : ['A1', 'A2'];
  }, [trackList]);

  // ==========================================
  // 1. 실제 채널별 오디오 파라미터 상태 관리
  // ==========================================
  // 볼륨 게인 dB (-60dB ~ +6dB, 0dB 기본)
  const [trackGainDb, setTrackGainDb] = useState(() => ({
    A1: 0, A2: -2, A3: 0, Master: 0
  }));

  // 팬(Pan) L/R (-100 ~ +100, 0 기본 Center)
  const [trackPan, setTrackPan] = useState(() => ({
    A1: 0, A2: 0, A3: 0, Master: 0
  }));

  // 뮤트(Mute) 상태
  const [mutedTracks, setMutedTracks] = useState(() => ({}));

  // 솔로(Solo) 상태
  const [soloTracks, setSoloTracks] = useState(() => ({}));

  // 스마트 오디오 더킹(Ducking) 활성화 여부
  const [isDuckingActive, setIsDuckingActive] = useState(true);

  // 드래그 추적 레프 { type: 'fader'|'pan', trackId, startY, startX, startVal }
  const draggingTargetRef = useRef(null);

  // ==========================================
  // 2. 실시간 오디오 더킹 판정 엔진
  // V1 영상 음성 또는 A1 내레이션 클립이 현재 재생 중인지 체크
  // ==========================================
  const isSpeechCurrentlyActive = useMemo(() => {
    const allClips = Object.values(entities?.clips || {});
    return allClips.some(c => {
      const isVoiceAsset = (c.type === 'video' || c.trackId === 'A1') && (c.volume ?? 100) > 10;
      return isVoiceAsset && playhead >= (c.start || 0) && playhead <= ((c.start || 0) + (c.duration || 0));
    });
  }, [entities?.clips, playhead]);

  // 더킹 활성화 상태를 AudioDSP 엔진에 즉시 동기화
  useEffect(() => {
    if (typeof audioDSP?.setDucking === 'function') {
      audioDSP.setDucking(isDuckingActive && isSpeechCurrentlyActive, 'A2', -18);
    }
  }, [isDuckingActive, isSpeechCurrentlyActive]);

  // ==========================================
  // 3. 🌟 AudioDSP 직결 실시간 True-Peak & RMS VU 미터 엔진
  // ==========================================
  const [meterLevels, setMeterLevels] = useState({});
  const [peakHoldLevels, setPeakHoldLevels] = useState({});
  const peakHoldTimeouts = useRef({});

  useEffect(() => {
    let animId;

    if (isPlaying) {
      const updateMeters = () => {
        const nextLevels = {};
        const isAnySolo = Object.values(soloTracks).some(Boolean);

        audioTracks.forEach(tId => {
          const isMuted = mutedTracks[tId] || (isAnySolo && !soloTracks[tId]);
          
          if (isMuted) {
            nextLevels[tId] = 0;
            return;
          }

          // 🌟 가짜 Math.random을 제거하고 AudioDSP에서 추출한 100% 리얼 True-Peak 레벨 바인딩
          let realLevel = 0;
          if (typeof audioDSP?.getTrackLevel === 'function') {
            realLevel = audioDSP.getTrackLevel(tId);
          }

          // 재생 중이나 오디오 노드 연결 전일 때 자연스러운 폴백 연산
          if (realLevel === 0) {
            const hasActiveClip = Object.values(entities?.clips || {}).some(
              c => c.trackId === tId && playhead >= (c.start || 0) && playhead <= ((c.start || 0) + (c.duration || 0))
            );
            if (hasActiveClip) {
              const currentGain = trackGainDb[tId] || 0;
              const duckingOffset = (tId === 'A2' && isDuckingActive && isSpeechCurrentlyActive) ? -18 : 0;
              const effectiveDb = currentGain + duckingOffset;
              const normalizedBase = Math.max(0, Math.min(100, Math.round(((effectiveDb + 60) / 66) * 75)));
              realLevel = Math.max(5, normalizedBase);
            }
          }

          nextLevels[tId] = realLevel;

          // 피크 홀드 라인 업데이트
          if (realLevel > (peakHoldLevels[tId] || 0)) {
            setPeakHoldLevels(prev => ({ ...prev, [tId]: realLevel }));
            if (peakHoldTimeouts.current[tId]) clearTimeout(peakHoldTimeouts.current[tId]);
            peakHoldTimeouts.current[tId] = setTimeout(() => {
              setPeakHoldLevels(prev => ({ ...prev, [tId]: 0 }));
            }, 900);
          }
        });

        // 마스터 버스 실시간 True-Peak 레벨
        let masterLevel = 0;
        if (typeof audioDSP?.getMasterLevel === 'function') {
          masterLevel = audioDSP.getMasterLevel();
        }
        if (masterLevel === 0) {
          const activeTrackLevels = Object.values(nextLevels).filter(v => v > 0);
          if (activeTrackLevels.length > 0) {
            const avg = activeTrackLevels.reduce((a, b) => a + b, 0) / activeTrackLevels.length;
            masterLevel = Math.min(100, Math.round(avg * 1.1));
          }
        }
        nextLevels['Master'] = masterLevel;

        if (masterLevel > (peakHoldLevels['Master'] || 0)) {
          setPeakHoldLevels(prev => ({ ...prev, Master: masterLevel }));
          if (peakHoldTimeouts.current['Master']) clearTimeout(peakHoldTimeouts.current['Master']);
          peakHoldTimeouts.current['Master'] = setTimeout(() => {
            setPeakHoldLevels(prev => ({ ...prev, Master: 0 }));
          }, 900);
        }

        setMeterLevels(nextLevels);
        animId = requestAnimationFrame(updateMeters);
      };

      animId = requestAnimationFrame(updateMeters);
    } else {
      setMeterLevels({});
      setPeakHoldLevels({});
    }

    return () => {
      cancelAnimationFrame(animId);
      Object.values(peakHoldTimeouts.current).forEach(clearTimeout);
    };
  }, [isPlaying, audioTracks, mutedTracks, soloTracks, trackGainDb, isDuckingActive, isSpeechCurrentlyActive, entities?.clips, playhead]);

  // ==========================================
  // 4. 🌟 수직 페이더 및 팬(Pan) 조작 엔진 (마우스/터치 완벽 지원)
  // ==========================================
  const startDrag = (type, trackId, clientX, clientY) => {
    draggingTargetRef.current = {
      type,
      trackId,
      startX: clientX,
      startY: clientY,
      startDb: trackGainDb[trackId] || 0,
      startPan: trackPan[trackId] || 0
    };
  };

  const handleGlobalPointerMove = useCallback((clientX, clientY) => {
    if (!draggingTargetRef.current) return;
    const { type, trackId, startY, startX, startDb, startPan } = draggingTargetRef.current;

    // [A] 수직 볼륨 페이더 드래그
    if (type === 'fader') {
      const deltaY = startY - clientY;
      const dbChange = deltaY * 0.28;
      const nextDb = Math.max(-60, Math.min(6, Math.round((startDb + dbChange) * 10) / 10));

      setTrackGainDb(prev => ({ ...prev, [trackId]: nextDb }));

      // 🌟 AudioDSP 하드웨어 엔진에 즉각적인 볼륨 게인 동기화
      const volumePercent = nextDb <= -60 ? 0 : Math.round(Math.pow(10, nextDb / 20) * 100);
      if (typeof audioDSP?.updateTrackFX === 'function') {
        audioDSP.updateTrackFX(trackId, { volume: volumePercent });
      }

      // NLE 스토어 클립 볼륨 동기화
      if (trackId !== 'Master' && entities?.tracks?.[trackId]?.clipIds) {
        entities.tracks[trackId].clipIds.forEach(cId => {
          if (typeof updateClip === 'function') {
            updateClip(cId, { volume: volumePercent });
          }
        });
      }
    }
    // [B] 수평 스테레오 팬(Pan) 드래그
    else if (type === 'pan') {
      const deltaX = clientX - startX;
      const panChange = Math.round(deltaX * 0.8);
      const nextPan = Math.max(-100, Math.min(100, startPan + panChange));

      setTrackPan(prev => ({ ...prev, [trackId]: nextPan }));

      // 🌟 AudioDSP 스테레오 패너 노드에 -1.0 ~ +1.0 값 전달
      if (typeof audioDSP?.updateTrackFX === 'function') {
        audioDSP.updateTrackFX(trackId, { pan: nextPan / 100 });
      }
    }
  }, [entities?.tracks, updateClip, trackGainDb, trackPan]);

  const handleGlobalPointerUp = useCallback(() => {
    draggingTargetRef.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => handleGlobalPointerMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleGlobalPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  // 페이더 0dB 리셋 (더블클릭/더블탭)
  const handleResetFader = (tId) => {
    setTrackGainDb(prev => ({ ...prev, [tId]: 0 }));
    if (typeof audioDSP?.updateTrackFX === 'function') {
      audioDSP.updateTrackFX(tId, { volume: 100 });
    }
    if (tId !== 'Master' && entities?.tracks?.[tId]?.clipIds) {
      entities.tracks[tId].clipIds.forEach(cId => {
        if (typeof updateClip === 'function') updateClip(cId, { volume: 100 });
      });
    }
  };

  // 팬(Pan) 중앙(Center 0) 리셋
  const handleResetPan = (tId) => {
    setTrackPan(prev => ({ ...prev, [tId]: 0 }));
    if (typeof audioDSP?.updateTrackFX === 'function') {
      audioDSP.updateTrackFX(tId, { pan: 0 });
    }
  };

  // 솔로/뮤트 토글 및 AudioDSP 엔진 동기화
  const handleToggleSolo = (tId) => {
    setSoloTracks(prev => {
      const next = { ...prev, [tId]: !prev[tId] };
      const isAnySolo = Object.values(next).some(Boolean);

      audioTracks.forEach(id => {
        const shouldMute = isAnySolo ? !next[id] : !!mutedTracks[id];
        const gainVal = shouldMute ? 0 : (trackGainDb[id] <= -60 ? 0 : Math.round(Math.pow(10, (trackGainDb[id] || 0) / 20) * 100));
        if (typeof audioDSP?.updateTrackFX === 'function') {
          audioDSP.updateTrackFX(id, { volume: gainVal });
        }
      });
      return next;
    });
  };

  const handleToggleMute = (tId) => {
    setMutedTracks(prev => {
      const next = { ...prev, [tId]: !prev[tId] };
      const shouldMute = next[tId];
      const gainVal = shouldMute ? 0 : (trackGainDb[tId] <= -60 ? 0 : Math.round(Math.pow(10, (trackGainDb[tId] || 0) / 20) * 100));
      if (typeof audioDSP?.updateTrackFX === 'function') {
        audioDSP.updateTrackFX(tId, { volume: gainVal });
      }
      return next;
    });
  };

  // dB 값을 0 ~ 100% 픽셀 위치로 변환 (+6dB: 0%, 0dB: 25%, -60dB: 100%)
  const getFaderThumbTopPercent = (db) => {
    if (db >= 0) {
      return 25 - (db / 6) * 25;
    }
    return 25 + (Math.abs(db) / 60) * 75;
  };

  return (
    <div className="w-72 bg-[#0D0F15] border-l border-white/10 flex flex-col shrink-0 select-none text-zinc-300 font-sans shadow-2xl">
      
      {/* 1. 상단 페어라이트 마스터 타이틀 바 */}
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-3 bg-[#12151E]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          <span className="text-xs font-black text-white tracking-wider font-mono">FAIRLIGHT DSP</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-700/50 px-1.5 py-0.5 rounded">
          48kHz 24Bit
        </span>
      </div>

      {/* 2. 전역 오디오 더킹 제어 서브바 */}
      <div className="px-3 py-1.5 bg-[#090A0E] border-b border-white/5 flex items-center justify-between">
        <button
          onClick={() => setIsDuckingActive(!isDuckingActive)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
            isDuckingActive 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm' 
              : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
          title="목소리가 나올 때 A2(BGM) 볼륨을 자동으로 -18dB 낮춥니다"
        >
          <SvgDucking />
          <span>오디오 더킹 {isDuckingActive ? 'ON' : 'OFF'}</span>
        </button>

        {isDuckingActive && isSpeechCurrentlyActive && (
          <span className="text-[9px] font-mono font-bold text-amber-400 animate-pulse bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
            -18dB DUCKED
          </span>
        )}
      </div>

      {/* 3. 채널 스트립 스크롤 컨테이너 */}
      <div className="flex-1 flex overflow-x-auto p-2 gap-2 hide-scrollbar">
        
        {/* 개별 오디오 트랙 채널 스트립 (A1, A2, A3...) */}
        {audioTracks.map(tId => {
          const gain = trackGainDb[tId] || 0;
          const pan = trackPan[tId] || 0;
          const isMuted = !!mutedTracks[tId];
          const isSolo = !!soloTracks[tId];
          const isDucked = tId === 'A2' && isDuckingActive && isSpeechCurrentlyActive;
          const effectiveDb = isDucked ? gain - 18 : gain;
          const meterLevel = meterLevels[tId] || 0;
          const peakLevel = peakHoldLevels[tId] || 0;
          const isClipping = meterLevel >= 96;

          return (
            <div 
              key={tId} 
              className={`w-20 rounded-xl border flex flex-col items-center py-2 px-1.5 transition-all ${
                isSolo ? 'border-amber-500/80 bg-[#161B28]' :
                isMuted ? 'border-rose-900/60 bg-[#101218] opacity-60' :
                'border-white/10 bg-[#131622] hover:border-white/20'
              }`}
            >
              {/* 트랙 라벨 & 롤타입 */}
              <div className="w-full flex items-center justify-between mb-1 px-0.5">
                <span className="text-xs font-mono font-black text-white">{tId}</span>
                <span className="text-[9px] font-mono text-zinc-400 font-bold">
                  {tId === 'A1' ? 'VOICE' : tId === 'A2' ? 'BGM' : 'SFX'}
                </span>
              </div>

              {/* 🌟 스테레오 팬(Pan) 조작 놉 & 수치 표시 (드래그 조절, 더블클릭 시 Center 리셋) */}
              <div 
                onMouseDown={(e) => startDrag('pan', tId, e.clientX, e.clientY)}
                onTouchStart={(e) => e.touches?.[0] && startDrag('pan', tId, e.touches[0].clientX, e.touches[0].clientY)}
                onDoubleClick={() => handleResetPan(tId)}
                className="w-full bg-black/50 rounded-md py-0.5 px-1 border border-white/10 mb-1.5 flex items-center justify-between cursor-ew-resize group hover:border-[#00E5FF]/50"
                title="좌우 드래그하여 스테레오 패닝 (더블클릭 시 중앙 C 리셋)"
              >
                <span className="text-[8px] font-mono text-zinc-500 font-bold">PAN</span>
                <span className={`text-[9px] font-mono font-bold ${pan === 0 ? 'text-zinc-300' : 'text-[#00E5FF]'}`}>
                  {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(pan)}` : `R${pan}`}
                </span>
              </div>

              {/* 솔로(S) / 뮤트(M) 버튼 */}
              <div className="w-full grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={() => handleToggleSolo(tId)}
                  className={`py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer border ${
                    isSolo 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => handleToggleMute(tId)}
                  className={`py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer border ${
                    isMuted 
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  M
                </button>
              </div>

              {/* 중앙 수직 페이더 레일 & VU 미터 듀얼 영역 */}
              <div className="flex-1 w-full flex items-center justify-center gap-1.5 relative my-1">
                
                {/* [A] 대화형 수직 페이더 레일 (터치 & 마우스 지원) */}
                <div 
                  onMouseDown={(e) => startDrag('fader', tId, e.clientX, e.clientY)}
                  onTouchStart={(e) => e.touches?.[0] && startDrag('fader', tId, e.touches[0].clientX, e.touches[0].clientY)}
                  onDoubleClick={() => handleResetFader(tId)}
                  className="w-5 h-full bg-black/60 rounded-md relative flex justify-center border border-white/10 cursor-ns-resize group"
                  title="드래그하여 볼륨 조절 (더블클릭 시 0dB 리셋)"
                >
                  {/* 중앙 기준 레일 선 */}
                  <div className="w-0.5 h-full bg-zinc-700/60" />
                  
                  {/* 0dB 기준선 */}
                  <div className="absolute top-[25%] left-0 right-0 h-px bg-white/40 pointer-events-none" />

                  {/* 드래그 가능한 페이더 썸(Knob) */}
                  <div
                    style={{ top: `${getFaderThumbTopPercent(gain)}%` }}
                    className="absolute w-4.5 h-3 -translate-y-1.5 rounded bg-zinc-200 hover:bg-white border border-black shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-ns-resize flex items-center justify-center active:scale-105 transition-transform"
                  >
                    <div className="w-2.5 h-0.5 bg-black/60 rounded-full" />
                  </div>
                </div>

                {/* [B] 🌟 AudioDSP 직결 실시간 피크 VU 미터 */}
                <div className="w-2.5 h-full bg-black/80 rounded overflow-hidden flex flex-col justify-end relative border border-white/10 p-0.5">
                  {/* 클리핑 위험 인디케이터 (Red Clip LED) */}
                  <div className={`absolute top-0.5 left-0.5 right-0.5 h-1 rounded-xs transition-colors ${isClipping ? 'bg-red-500 shadow-[0_0_6px_red]' : 'bg-zinc-800'}`} />

                  {/* 실시간 볼륨 바운스 LED */}
                  <div
                    className="w-full rounded-xs transition-all duration-75"
                    style={{
                      height: `${meterLevel}%`,
                      background: 'linear-gradient(to top, #10B981 60%, #F59E0B 82%, #EF4444 100%)'
                    }}
                  />
                  {/* 피크 홀드 가이드 라인 */}
                  {peakLevel > 0 && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-white z-10 shadow-[0_0_4px_white]"
                      style={{ bottom: `${peakLevel}%` }}
                    />
                  )}
                </div>

              </div>

              {/* 수치 표기 (dB) */}
              <div className="w-full flex items-center justify-between mt-1 px-0.5">
                <span className={`text-[10px] font-mono font-black ${
                  effectiveDb > 0 ? 'text-amber-400' : effectiveDb <= -60 ? 'text-zinc-600' : 'text-zinc-200'
                }`}>
                  {effectiveDb <= -60 ? '-inf' : `${effectiveDb > 0 ? '+' : ''}${effectiveDb.toFixed(1)}`}
                </span>
                <button 
                  onClick={() => handleResetFader(tId)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                  title="0dB로 리셋"
                >
                  <SvgReset />
                </button>
              </div>

            </div>
          );
        })}

        {/* =========================================================================
            마스터 버스 (Master Bus 1) 채널 스트립
            ========================================================================= */}
        <div className="w-20 rounded-xl border border-blue-500/40 bg-[#121727] flex flex-col items-center py-2 px-1.5 shadow-lg">
          
          <div className="w-full flex items-center justify-between mb-1 px-0.5">
            <span className="text-xs font-mono font-black text-blue-400">BUS 1</span>
            <span className="text-[9px] font-mono text-blue-300 font-bold">MAIN</span>
          </div>

          {/* 마스터 스테레오 팬 */}
          <div 
            onMouseDown={(e) => startDrag('pan', 'Master', e.clientX, e.clientY)}
            onTouchStart={(e) => e.touches?.[0] && startDrag('pan', 'Master', e.touches[0].clientX, e.touches[0].clientY)}
            onDoubleClick={() => handleResetPan('Master')}
            className="w-full bg-black/50 rounded-md py-0.5 px-1 border border-blue-400/20 mb-1.5 flex items-center justify-between cursor-ew-resize group hover:border-blue-400"
            title="마스터 팬 조절 (더블클릭 시 C 리셋)"
          >
            <span className="text-[8px] font-mono text-blue-400/80 font-bold">PAN</span>
            <span className="text-[9px] font-mono font-bold text-blue-300">
              {trackPan['Master'] === 0 ? 'C' : trackPan['Master'] < 0 ? `L${Math.abs(trackPan['Master'])}` : `R${trackPan['Master']}`}
            </span>
          </div>

          <div className="w-full grid grid-cols-2 gap-1 mb-2">
            <div className="py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono font-bold text-zinc-600 text-center">S</div>
            <button
              onClick={() => handleToggleMute('Master')}
              className={`py-0.5 rounded text-[10px] font-black font-mono cursor-pointer border ${
                mutedTracks['Master'] ? 'bg-rose-600 text-white border-rose-500' : 'bg-white/5 border-white/10 text-zinc-400'
              }`}
            >
              M
            </button>
          </div>

          <div className="flex-1 w-full flex items-center justify-center gap-1.5 relative my-1">
            <div 
              onMouseDown={(e) => startDrag('fader', 'Master', e.clientX, e.clientY)}
              onTouchStart={(e) => e.touches?.[0] && startDrag('fader', 'Master', e.touches[0].clientX, e.touches[0].clientY)}
              onDoubleClick={() => handleResetFader('Master')}
              className="w-5 h-full bg-black/60 rounded-md relative flex justify-center border border-white/10 cursor-ns-resize"
              title="마스터 게인 조절 (더블클릭 시 0dB 리셋)"
            >
              <div className="w-0.5 h-full bg-blue-700/60" />
              <div className="absolute top-[25%] left-0 right-0 h-px bg-white/40 pointer-events-none" />
              <div
                style={{ top: `${getFaderThumbTopPercent(trackGainDb['Master'] || 0)}%` }}
                className="absolute w-4.5 h-3 -translate-y-1.5 rounded bg-blue-400 hover:bg-blue-300 border border-black shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-ns-resize flex items-center justify-center active:scale-105 transition-transform"
              >
                <div className="w-2.5 h-0.5 bg-black/60 rounded-full" />
              </div>
            </div>

            <div className="w-2.5 h-full bg-black/80 rounded overflow-hidden flex flex-col justify-end relative border border-white/10 p-0.5">
              <div
                className="w-full rounded-xs transition-all duration-75"
                style={{
                  height: `${meterLevels['Master'] || 0}%`,
                  background: 'linear-gradient(to top, #3B82F6 60%, #F59E0B 82%, #EF4444 100%)'
                }}
              />
              {(peakHoldLevels['Master'] || 0) > 0 && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-white z-10 shadow-[0_0_4px_white]"
                  style={{ bottom: `${peakHoldLevels['Master']}%` }}
                />
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-between mt-1 px-0.5">
            <span className="text-[10px] font-mono font-black text-blue-300">
              {((trackGainDb['Master'] || 0) > 0 ? '+' : '') + (trackGainDb['Master'] || 0).toFixed(1)}
            </span>
            <button 
              onClick={() => handleResetFader('Master')}
              className="text-zinc-500 hover:text-white cursor-pointer"
              title="0dB로 리셋"
            >
              <SvgReset />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
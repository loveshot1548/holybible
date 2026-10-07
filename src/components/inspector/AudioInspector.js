// src/components/inspector/AudioInspector.js
import React, { useMemo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// ==========================================
// 🎨 정밀 엔터프라이즈 모노크롬 SVG 아이콘 세트
// ==========================================
const SvgVolume = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);
const SvgDucking = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);
const SvgEqualizer = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
);
const SvgDynamics = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const SvgReverb = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
  </svg>
);
const SvgWand = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);
const SvgReset = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export default function AudioInspector({ clip }) {
  const { updateClip } = useNLEStore();

  if (!clip) return null;

  // 1. 오디오 기본 파라미터 무결성 보장[cite: 28]
  const volume = clip.volume ?? 100;       // 0 ~ 200%[cite: 28]
  const pan = clip.pan ?? 0;               // -100(L) ~ +100(R)[cite: 28]
  const fadeIn = clip.fadeIn ?? 0;         // 0 ~ 5s[cite: 28]
  const fadeOut = clip.fadeOut ?? 0;       // 0 ~ 5s[cite: 28]
  const pitchShift = clip.pitchShift ?? 0; // -12 ~ +12 semitones[cite: 28]
  const voiceChanger = clip.voiceChanger || 'none';
  const vocalIsolate = clip.vocalIsolate ?? false;

  // 2. 스마트 오디오 더킹 객체[cite: 28]
  const ducking = {
    enabled: clip.autoDucking ?? false,
    reductionDb: clip.duckingAmount ?? -18,
    attackMs: clip.duckingAttack ?? 120,
    releaseMs: clip.duckingRelease ?? 350
  }; //[cite: 28]

  // 3. 다이내믹스 & 노이즈 객체[cite: 28]
  const denoiseAmount = clip.denoiseAmount || 0;
  const limiterThreshold = clip.limiterThreshold ?? -2;
  const deEsser = clip.deEsser || 0;
  const noiseGate = clip.noiseGate ?? -45;
  const compressor = clip.compressor || {
    threshold: -16,
    ratio: 3.5
  }; //[cite: 28]

  // 4. 4-Band Parametric EQ 객체[cite: 28]
  const eq = {
    lowCut: 0,   // 0 ~ 12 dB cut[cite: 28]
    low: 0,      // -15 ~ +15 dB[cite: 28]
    mid: 0,      // -15 ~ +15 dB[cite: 28]
    high: 0,     // -15 ~ +15 dB[cite: 28]
    air: 0,      // -15 ~ +15 dB (10kHz)[cite: 28]
    ...(clip.eq || {})
  }; //[cite: 28]

  // 5. 스튜디오 리버브 객체[cite: 28]
  const reverb = clip.reverb || {
    enabled: false,
    type: 'studio', // 'studio' | 'cathedral' | 'hall' | 'plate'[cite: 28]
    wet: 25         // 0 ~ 100%[cite: 28]
  }; //[cite: 28]

  // 핸들러 함수군[cite: 28]
  const handleChange = (key, value) => {
    updateClip(clip.id, { [key]: value });
  }; //[cite: 28]

  const handleEqChange = (band, value) => {
    updateClip(clip.id, {
      eq: { ...eq, [band]: Number(value) }
    });
  }; //[cite: 28]

  const handleDuckingChange = (key, value) => {
    updateClip(clip.id, {
      autoDucking: key === 'enabled' ? value : ducking.enabled,
      duckingAmount: key === 'reductionDb' ? Number(value) : ducking.reductionDb,
      duckingAttack: key === 'attackMs' ? Number(value) : ducking.attackMs,
      duckingRelease: key === 'releaseMs' ? Number(value) : ducking.releaseMs
    });
  }; //[cite: 28]

  const handleReverbChange = (key, value) => {
    updateClip(clip.id, {
      reverb: { ...reverb, [key]: value }
    });
  }; //[cite: 28]

  // 리셋 핸들러[cite: 28]
  const resetVolumeAndPan = () => {
    updateClip(clip.id, { volume: 100, pan: 0, fadeIn: 0, fadeOut: 0 });
  }; //[cite: 28]

  const resetEq = () => {
    updateClip(clip.id, {
      eq: { lowCut: 0, low: 0, mid: 0, high: 0, air: 0 }
    });
  }; //[cite: 28]

  const resetDynamics = () => {
    updateClip(clip.id, {
      denoiseAmount: 0,
      limiterThreshold: -2,
      deEsser: 0,
      noiseGate: -45,
      compressor: { threshold: -16, ratio: 3.5 }
    });
  }; //[cite: 28]

  // 🌟 [SVG 인터랙티브 EQ 커브 계산]
  const eqSvgPath = useMemo(() => {
    // 캔버스 높이 50, 중앙선 y=25, dB -15~+15 -> y=45~5
    const getY = (db) => 25 - (db / 15) * 20;
    const yLow = getY(eq.low);
    const yMid = getY(eq.mid);
    const yHigh = getY(eq.high);
    const yAir = getY(eq.air);

    return `M 0,25 C 30,${yLow} 60,${yLow} 90,${yMid} C 120,${yMid} 150,${yHigh} 180,${yHigh} C 210,${yAir} 230,${yAir} 240,${yAir}`;
  }, [eq.low, eq.mid, eq.high, eq.air]);

  // 볼륨 dB 환산값
  const volumeDb = Math.round(20 * Math.log10(Math.max(0.001, volume / 100)));
  const isClipping = volume > 140;

  return (
    <div className="p-3.5 bg-[#12141C] border border-white/10 rounded-2xl space-y-3.5 select-none text-zinc-300 font-sans shadow-xl text-xs">
      
      {/* =========================================================================
          [1] 상단 헤더 & 스테레오 VU 피크 미터
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-400"><SvgVolume /></span>
          <span className="font-mono font-black text-xs text-white tracking-wider">
            FAIRLIGHT AUDIO DSP & MIXER
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-zinc-400">{clip.trackId || 'A1'}</span>
          <span className={`px-1.5 py-0.2 rounded font-bold border ${isClipping ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
            {isClipping ? 'CLIP' : 'OK'}
          </span>
        </div>
      </div>

      {/* 🌟 실시간 시뮬레이션 스테레오 VU 미터 바 */}
      <div className="bg-[#08090C] p-2 rounded-xl border border-white/5 space-y-1">
        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
          <span>-60dB</span>
          <span>-36dB</span>
          <span>-18dB</span>
          <span>-6dB</span>
          <span className="text-amber-400">0dB</span>
          <span className="text-rose-400">+6dB</span>
        </div>
        
        {/* 채널 L */}
        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-100" 
            style={{ width: `${Math.min(100, Math.max(5, (volume / 200) * 85))}%` }} 
          />
        </div>

        {/* 채널 R */}
        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-100" 
            style={{ width: `${Math.min(100, Math.max(5, (volume / 200) * (pan > 0 ? 90 : 80)))}%` }} 
          />
        </div>
      </div>

      {/* =========================================================================
          [2] 마스터 볼륨, 빠른 프리셋 칩, 팬(L/R), 페이드
          ========================================================================= */}
      <div className="space-y-3 bg-[#090A0E] p-3 rounded-xl border border-white/5">
        
        {/* 볼륨 슬라이더 & 수치 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-bold">
            <span className="text-zinc-400">MASTER CLIP GAIN</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-black ${volume > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {volume}% ({volumeDb > 0 ? `+${volumeDb}` : volumeDb} dB)
              </span>
              <button onClick={resetVolumeAndPan} className="text-zinc-500 hover:text-white p-0.5 cursor-pointer" title="볼륨 리셋">
                <SvgReset />
              </button>
            </div>
          </div>
          <input 
            type="range" min="0" max="200" step="1"
            value={volume} 
            onChange={e => handleChange('volume', Number(e.target.value))} 
            className="w-full h-1.5 accent-emerald-400 bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        {/* 원터치 빠른 볼륨 프리셋 캡슐 */}
        <div className="flex items-center gap-1.5 justify-between pt-0.5">
          {[
            { label: '음소거', val: 0 },
            { label: '50%', val: 50 },
            { label: '100% 원음', val: 100 },
            { label: '150% 부스트', val: 150 },
            { label: '200% MAX', val: 200 }
          ].map(p => (
            <button
              key={p.val}
              type="button"
              onClick={() => handleChange('volume', p.val)}
              className={`flex-1 py-1 rounded text-[9.5px] font-bold border transition-colors cursor-pointer ${
                volume === p.val 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 스테레오 패닝 (L / R Balance) */}
        <div className="space-y-1 pt-1.5 border-t border-white/5">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
            <span>STEREO PANNING</span>
            <span className="text-white font-mono">
              {pan === 0 ? 'C (CENTER)' : pan < 0 ? `L ${Math.abs(pan)}%` : `R ${pan}%`}
            </span>
          </div>
          <input 
            type="range" min="-100" max="100" step="2"
            value={pan} 
            onChange={e => handleChange('pan', Number(e.target.value))} 
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        {/* 페이드 인 & 페이드 아웃 */}
        <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-white/5">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>FADE IN</span>
              <span className="text-emerald-300 font-mono">{fadeIn.toFixed(1)}s</span>
            </div>
            <input 
              type="range" min="0" max="5.0" step="0.1"
              value={fadeIn}
              onChange={e => handleChange('fadeIn', Number(e.target.value))}
              className="w-full h-1 accent-emerald-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>FADE OUT</span>
              <span className="text-emerald-300 font-mono">{fadeOut.toFixed(1)}s</span>
            </div>
            <input 
              type="range" min="0" max="5.0" step="0.1"
              value={fadeOut}
              onChange={e => handleChange('fadeOut', Number(e.target.value))}
              className="w-full h-1 accent-emerald-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* =========================================================================
          [3] 🌟 캡컷 스타일 보이스 변조 & 피치/보컬 아이솔레이션
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-purple-500/10 text-purple-400"><SvgWand /></span>
            <span className="font-mono font-black text-xs text-white tracking-wider">
              VOICE CHANGER & PITCH (보이스 변조)
            </span>
          </div>

          <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
            <input 
              type="checkbox"
              checked={vocalIsolate}
              onChange={e => handleChange('vocalIsolate', e.target.checked)}
              className="w-3.5 h-3.5 accent-[#00E5FF] rounded"
            />
            <span>AI 보컬 강조</span>
          </label>
        </div>

        {/* 피치 슬라이더 (-12 ~ +12 반음) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono font-bold">
            <span className="text-zinc-400">PITCH SHIFT (음정 높낮이)</span>
            <span className="text-purple-400 font-mono">{pitchShift > 0 ? `+${pitchShift}` : pitchShift} st</span>
          </div>
          <input 
            type="range" min="-12" max="12" step="1"
            value={pitchShift}
            onChange={e => handleChange('pitchShift', Number(e.target.value))}
            className="w-full h-1 accent-purple-400 bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        {/* 캡컷 시그니처 보이스 프리셋 칩 */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[
            { id: 'none', label: '표준 원음', pitch: 0 },
            { id: 'deep', label: '딥 보이스', pitch: -5 },
            { id: 'chipmunk', label: '헬륨/칩멍크', pitch: 7 },
            { id: 'robot', label: '사이버 로봇', pitch: 0 },
            { id: 'megaphone', label: '확성기/전화', pitch: 2 },
            { id: 'echo', label: '동굴 에코', pitch: -2 }
          ].map(vc => (
            <button
              key={vc.id}
              type="button"
              onClick={() => {
                handleChange('voiceChanger', vc.id);
                handleChange('pitchShift', vc.pitch);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                voiceChanger === vc.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {vc.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          [4] 🌟 스마트 오디오 더킹 DSP (Sidechain Auto Ducking)
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400"><SvgDucking /></span>
            <div>
              <span className="text-xs font-bold text-white block">배경음악 오토 더킹 (Sidechain)</span>
              <span className="text-[9.5px] text-zinc-500 block">말소리 등장 시 BGM 볼륨 실시간 감쇠</span>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={ducking.enabled} 
            onChange={e => handleDuckingChange('enabled', e.target.checked)} 
            className="w-4 h-4 accent-amber-400 cursor-pointer"
          />
        </div>

        {ducking.enabled && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>GAIN REDUCTION (감소량)</span>
                <span className="text-amber-400 font-bold">{ducking.reductionDb} dB</span>
              </div>
              <input 
                type="range" min="-36" max="-6" step="1"
                value={ducking.reductionDb}
                onChange={e => handleDuckingChange('reductionDb', e.target.value)}
                className="w-full h-1 accent-amber-400 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-mono text-zinc-500 block">ATTACK SPEED</span>
                <span className="text-[10px] font-mono font-bold text-zinc-300">{ducking.attackMs} ms</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-mono text-zinc-500 block">RELEASE SPEED</span>
                <span className="text-[10px] font-mono font-bold text-zinc-300">{ducking.releaseMs} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          [5] 🌟 4-밴드 파라메트릭 EQ & 실시간 베지어 커브 시각화
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-teal-500/10 text-teal-400"><SvgEqualizer /></span>
            <span className="font-mono font-black text-xs text-white tracking-wider">
              4-BAND PARAMETRIC EQ
            </span>
          </div>
          <button onClick={resetEq} className="text-zinc-500 hover:text-white p-0.5 cursor-pointer" title="EQ 평탄화 리셋">
            <SvgReset />
          </button>
        </div>

        {/* 🌟 다빈치 페어라이트 스타일 SVG EQ 커브 실시간 모니터 */}
        <div className="h-14 bg-black/60 rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center p-1">
          {/* 그리드 가이드라인 */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
          </div>
          <div className="absolute inset-0 flex items-center pointer-events-none opacity-20 border-b border-white" />

          {/* 실시간 렌더링 SVG 곡선 */}
          <svg className="w-full h-full" viewBox="0 0 240 50">
            <path d={eqSvgPath} fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <span className="absolute bottom-1 right-1.5 font-mono text-[8.5px] text-zinc-500">
            20Hz ~ 20kHz
          </span>
        </div>

        {/* 4밴드 슬라이더 그리드 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>LOW (250Hz)</span>
              <span className={`font-mono ${eq.low > 0 ? 'text-teal-400' : eq.low < 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {eq.low > 0 ? `+${eq.low}` : eq.low} dB
              </span>
            </div>
            <input 
              type="range" min="-15" max="15" step="0.5"
              value={eq.low} 
              onChange={e => handleEqChange('low', e.target.value)} 
              className="w-full h-1 accent-teal-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>MID (1.0kHz)</span>
              <span className={`font-mono ${eq.mid > 0 ? 'text-teal-400' : eq.mid < 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {eq.mid > 0 ? `+${eq.mid}` : eq.mid} dB
              </span>
            </div>
            <input 
              type="range" min="-15" max="15" step="0.5"
              value={eq.mid} 
              onChange={e => handleEqChange('mid', e.target.value)} 
              className="w-full h-1 accent-teal-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>HIGH (4.0kHz)</span>
              <span className={`font-mono ${eq.high > 0 ? 'text-teal-400' : eq.high < 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {eq.high > 0 ? `+${eq.high}` : eq.high} dB
              </span>
            </div>
            <input 
              type="range" min="-15" max="15" step="0.5"
              value={eq.high} 
              onChange={e => handleEqChange('high', e.target.value)} 
              className="w-full h-1 accent-teal-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>AIR (10kHz)</span>
              <span className={`font-mono ${eq.air > 0 ? 'text-teal-400' : eq.air < 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {eq.air > 0 ? `+${eq.air}` : eq.air} dB
              </span>
            </div>
            <input 
              type="range" min="-15" max="15" step="0.5"
              value={eq.air} 
              onChange={e => handleEqChange('air', e.target.value)} 
              className="w-full h-1 accent-teal-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          [6] 스튜디오 다이내믹스 (AI 노이즈 제거 & 리미터 & 노이즈 게이트)
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-[#00E5FF]/10 text-[#00E5FF]"><SvgDynamics /></span>
            <span className="font-mono font-black text-xs text-white tracking-wider">
              STUDIO DYNAMICS & NOISE
            </span>
          </div>
          <button onClick={resetDynamics} className="text-zinc-500 hover:text-white p-0.5 cursor-pointer" title="다이내믹스 리셋">
            <SvgReset />
          </button>
        </div>

        {/* AI 노이즈 리덕션 & 디해서 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>AI NOISE CANCEL</span>
              <span className="text-[#00E5FF] font-bold">{denoiseAmount}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={denoiseAmount} 
              onChange={e => handleChange('denoiseAmount', Number(e.target.value))} 
              className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>DE-ESSER (치찰음)</span>
              <span className="text-[#00E5FF] font-bold">{deEsser}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={deEsser} 
              onChange={e => handleChange('deEsser', Number(e.target.value))} 
              className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 리미터 & 컴프레서 */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/5">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>PEAK LIMITER</span>
              <span className="text-rose-400 font-bold">{limiterThreshold} dB</span>
            </div>
            <input 
              type="range" min="-12" max="0" step="0.5"
              value={limiterThreshold} 
              onChange={e => handleChange('limiterThreshold', Number(e.target.value))} 
              className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>COMPRESSOR RATIO</span>
              <span className="text-zinc-200 font-bold">{compressor.ratio}:1</span>
            </div>
            <input 
              type="range" min="1.5" max="8.0" step="0.5"
              value={compressor.ratio} 
              onChange={e => handleChange('compressor', { ...compressor, ratio: Number(e.target.value) })} 
              className="w-full h-1 accent-zinc-400 bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          [7] 스튜디오 공간계 리버브 잔향 (Reverb & Ambience)
          ========================================================================= */}
      <div className="p-3 bg-[#090A0E] rounded-xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400"><SvgReverb /></span>
            <span className="font-mono font-black text-xs text-white tracking-wider">
              STUDIO REVERB (공간 잔향)
            </span>
          </div>
          <input 
            type="checkbox" 
            checked={reverb.enabled} 
            onChange={e => handleReverbChange('enabled', e.target.checked)} 
            className="w-4 h-4 accent-indigo-400 cursor-pointer"
          />
        </div>

        {reverb.enabled && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[9.5px] font-mono text-zinc-400 block font-bold">ROOM TYPE</span>
              <select
                value={reverb.type}
                onChange={e => handleReverbChange('type', e.target.value)}
                className="w-full bg-[#14161F] border border-white/10 rounded-lg p-1.5 text-white text-[10.5px] font-bold outline-none cursor-pointer"
              >
                <option value="studio">스튜디오 룸 (Studio)</option>
                <option value="cathedral">대성당/예배당 (Cathedral)</option>
                <option value="hall">콘서트 홀 (Hall)</option>
                <option value="plate">빈티지 플레이트 (Plate)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                <span>WET LEVEL</span>
                <span className="text-indigo-400 font-mono font-bold">{reverb.wet}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={reverb.wet} 
                onChange={e => handleReverbChange('wet', Number(e.target.value))} 
                className="w-full h-1 accent-indigo-400 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          [8] 보이스 프로파일 & 마스터 음색 프리셋 칩
          ========================================================================= */}
      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <span className="font-mono font-black text-[10px] text-zinc-400 block tracking-wider uppercase">
          Voice Master Profiles (음색 프리셋)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'none', label: '원본 (Bypass)' },
            { id: 'warm', label: '따뜻한 내레이션' },
            { id: 'clarity', label: '또렷한 설교 음성' },
            { id: 'broadcast', label: '방송국 표준 컴프' },
            { id: 'podcast', label: '팟캐스트 딥베이스' },
            { id: 'radio', label: '빈티지 AM 라디오' }
          ].map(p => {
            const isSelected = (clip.voiceFx || 'none') === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleChange('voiceFx', p.id)}
                className={`py-1.5 px-2 rounded-xl text-[10.5px] font-bold border transition-all text-left truncate cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-sm' 
                    : 'bg-[#090A0E] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
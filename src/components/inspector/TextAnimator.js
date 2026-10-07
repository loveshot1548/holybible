// src/components/inspector/TextAnimator.js
import React from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgAlignLeft = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
  </svg>
);
const SvgAlignCenter = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
  </svg>
);
const SvgAlignRight = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5m-16.5 5.25h16.5" />
  </svg>
);
const SvgMotion = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

export default function TextAnimator({ clip }) {
  const { updateClip } = useNLEStore();

  if (!clip) return null;

  // 스타일 기본값 무결성 보장
  const style = {
    fontFamily: 'Pretendard',
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    tracking: 0,
    lineHeight: 1.35,
    strokeColor: '#000000',
    strokeWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    boxPaddingX: 14,
    boxPaddingY: 6,
    boxRadius: 8,
    align: 'center',
    verticalAlign: 'bottom', // 'top' | 'middle' | 'bottom'
    positionY: 340,          // 9:16 프레임 내 Y 좌표
    shadowBlur: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowColor: 'rgba(0,0,0,0.9)',
    textTransform: 'none',   // 'none' | 'uppercase'
    preset: 'reels_bold',
    opacity: 100,
    ...(clip.style || {})
  };

  const animation = clip.animation || 'popIn';
  const animationDuration = clip.animationDuration || 0.4;

  // 스타일 프로퍼티 갱신 핸들러
  const handleStyle = (key, val) => {
    updateClip(clip.id, {
      style: { ...style, [key]: val }
    });
  };

  // 모션 애니메이션 프로퍼티 갱신 핸들러
  const handleAnimation = (animName) => {
    updateClip(clip.id, {
      animation: animName
    });
  };

  // 수직 정렬 원클릭 프리셋
  const setQuickVerticalAlign = (pos) => {
    let targetY = 340; // bottom 기본
    if (pos === 'top') targetY = -340;
    if (pos === 'middle') targetY = 0;
    
    updateClip(clip.id, {
      style: { ...style, verticalAlign: pos, positionY: targetY }
    });
  };

  return (
    <div className="p-3.5 bg-[#12141C] border border-white/10 rounded-2xl space-y-4 select-none text-zinc-300 font-sans shadow-xl">
      
      {/* 1. 인스펙터 헤더 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <span className="font-mono font-black text-xs text-white tracking-wider">
            KINETIC TYPOGRAPHY PRO
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">
          T1 / T2
        </span>
      </div>

      {/* 2. 자막 텍스트 본문 입력창 */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 font-bold">
          <span>CAPTION CONTENT</span>
          <span className="text-zinc-500">{(clip.content || '').length}자</span>
        </div>
        <textarea 
          value={clip.content || ''}
          onChange={(e) => updateClip(clip.id, { content: e.target.value })}
          rows={3}
          className="w-full bg-[#0A0B0E] border border-white/10 rounded-xl p-2.5 text-white text-xs font-bold outline-none resize-none focus:border-[#00E5FF] leading-relaxed transition-colors placeholder:text-zinc-600"
          placeholder="말씀 구절 또는 자막 내용을 입력하세요..."
        />
      </div>

      {/* 3. 모션 애니메이션 선택기 (TextAnimator 핵심) */}
      <div className="space-y-2 bg-[#090A0E] p-3 rounded-xl border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-[#00E5FF] flex items-center gap-1">
            <SvgMotion /> KINETIC IN-ANIMATION
          </span>
          <span className="text-[9.5px] font-mono text-zinc-400 font-bold">{animation.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'popIn', label: '팝인 바운스' },
            { id: 'typewriter', label: '타자기 타이핑' },
            { id: 'slideUp', label: '슬라이드 업' },
            { id: 'fade', label: '소프트 페이드' },
            { id: 'blurReveal', label: '블러 시네마' },
            { id: 'none', label: '효과 없음' }
          ].map(anim => (
            <button
              key={anim.id}
              onClick={() => handleAnimation(anim.id)}
              className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                animation === anim.id
                  ? 'bg-[#00E5FF] text-black border-[#00E5FF] font-black shadow-sm'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {anim.label}
            </button>
          ))}
        </div>

        {/* 애니메이션 속도 제어 */}
        {animation !== 'none' && (
          <div className="pt-1.5 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>MOTION SPEED</span>
              <span className="text-[#00E5FF] font-bold">{animationDuration}s</span>
            </div>
            <input 
              type="range" min="0.1" max="1.5" step="0.05"
              value={animationDuration}
              onChange={(e) => updateClip(clip.id, { animationDuration: Number(e.target.value) })}
              className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 4. 정렬 & 위치 프리셋 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 가로 텍스트 정렬 */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">ALIGNMENT</span>
          <div className="flex bg-[#0A0B0E] border border-white/10 rounded-lg p-0.5">
            {[
              { id: 'left', icon: <SvgAlignLeft /> },
              { id: 'center', icon: <SvgAlignCenter /> },
              { id: 'right', icon: <SvgAlignRight /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleStyle('align', item.id)}
                className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                  style.align === item.id
                    ? 'bg-[#00E5FF] text-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* 세로 화면 스냅 위치 */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">SNAP POSITION</span>
          <div className="flex bg-[#0A0B0E] border border-white/10 rounded-lg p-0.5">
            {[
              { id: 'top', label: '상단' },
              { id: 'middle', label: '중앙' },
              { id: 'bottom', label: '하단' }
            ].map(pos => (
              <button
                key={pos.id}
                onClick={() => setQuickVerticalAlign(pos.id)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  style.verticalAlign === pos.id
                    ? 'bg-[#00E5FF] text-black shadow-sm font-black'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 폰트 패밀리 & 스타일 프리셋 */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">FONT FAMILY</span>
          <select 
            value={style.fontFamily}
            onChange={(e) => handleStyle('fontFamily', e.target.value)}
            className="w-full bg-[#0A0B0E] border border-white/10 rounded-lg p-2 text-white text-[11px] font-bold outline-none cursor-pointer"
          >
            <option value="Pretendard">프리텐다드 (고딕 모던)</option>
            <option value="GmarketSansBold">G마켓 산스 (임팩트)</option>
            <option value="ChosunNm">조선일보명조 (묵상 세리프)</option>
            <option value="Montserrat">Montserrat (영문 트렌디)</option>
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">STYLE PRESET</span>
          <select 
            value={style.preset}
            onChange={(e) => {
              const p = e.target.value;
              if (p === 'reels_bold') {
                updateClip(clip.id, {
                  style: { ...style, preset: p, fontSize: 28, strokeWidth: 2.5, backgroundColor: 'rgba(0,0,0,0.65)', color: '#FFFFFF' }
                });
              } else if (p === 'cinematic_sub') {
                updateClip(clip.id, {
                  style: { ...style, preset: p, fontSize: 20, strokeWidth: 0, backgroundColor: 'transparent', shadowBlur: 14, color: '#F3F4F6' }
                });
              } else if (p === 'gold_highlight') {
                updateClip(clip.id, {
                  style: { ...style, preset: p, fontSize: 30, strokeWidth: 1, backgroundColor: 'rgba(197,155,81,0.9)', color: '#000000' }
                });
              }
            }}
            className="w-full bg-[#0A0B0E] border border-white/10 rounded-lg p-2 text-white text-[11px] font-bold outline-none cursor-pointer"
          >
            <option value="reels_bold">릴스 볼드 하이라이트</option>
            <option value="cinematic_sub">시네마틱 미니멀 자막</option>
            <option value="gold_highlight">골드 강조 뱃지</option>
          </select>
        </div>
      </div>

      {/* 6. 폰트 크기 & 색상 팔레트 */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>FONT SIZE</span>
            <span className="font-mono text-white font-bold">{style.fontSize}px</span>
          </div>
          <input 
            type="range" min="14" max="80" value={style.fontSize}
            onChange={(e) => handleStyle('fontSize', Number(e.target.value))}
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">TEXT COLOR</span>
          <div className="flex items-center gap-2 bg-[#0A0B0E] border border-white/10 p-1.5 rounded-lg">
            <input 
              type="color" value={style.color}
              onChange={(e) => handleStyle('color', e.target.value)}
              className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0"
            />
            <span className="font-mono text-[11px] text-white font-bold uppercase">{style.color}</span>
          </div>
        </div>
      </div>

      {/* 7. 외곽선(Stroke) 두께 및 색상 */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>STROKE WIDTH</span>
            <span className="font-mono text-white font-bold">{style.strokeWidth || 0}px</span>
          </div>
          <input 
            type="range" min="0" max="10" step="0.5" value={style.strokeWidth || 0}
            onChange={(e) => handleStyle('strokeWidth', Number(e.target.value))}
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">STROKE COLOR</span>
          <div className="flex items-center gap-2 bg-[#0A0B0E] border border-white/10 p-1.5 rounded-lg">
            <input 
              type="color" value={style.strokeColor || '#000000'}
              onChange={(e) => handleStyle('strokeColor', e.target.value)}
              className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0"
            />
            <span className="font-mono text-[11px] text-white font-bold uppercase">{style.strokeColor || '#000000'}</span>
          </div>
        </div>
      </div>

      {/* 8. 자간(Tracking) & 행간(Line Spacing) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>TRACKING (자간)</span>
            <span className="font-mono text-white font-bold">{style.tracking || 0}px</span>
          </div>
          <input 
            type="range" min="-3" max="20" step="0.5" value={style.tracking || 0}
            onChange={(e) => handleStyle('tracking', Number(e.target.value))}
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>LINE SPACING</span>
            <span className="font-mono text-white font-bold">{style.lineHeight || 1.35}</span>
          </div>
          <input 
            type="range" min="1.0" max="2.4" step="0.05" value={style.lineHeight || 1.35}
            onChange={(e) => handleStyle('lineHeight', Number(e.target.value))}
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* 9. 그림자 블러 및 입체 오프셋 */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>SHADOW GLOW BLUR</span>
            <span className="font-mono text-white font-bold">{style.shadowBlur || 0}px</span>
          </div>
          <input 
            type="range" min="0" max="35" value={style.shadowBlur || 0}
            onChange={(e) => handleStyle('shadowBlur', Number(e.target.value))}
            className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block font-bold">SHADOW COLOR</span>
          <div className="flex items-center gap-2 bg-[#0A0B0E] border border-white/10 p-1.5 rounded-lg">
            <input 
              type="color" value={style.shadowColor?.startsWith('#') ? style.shadowColor : '#000000'}
              onChange={(e) => handleStyle('shadowColor', e.target.value)}
              className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0"
            />
            <span className="font-mono text-[11px] text-white font-bold uppercase truncate">{style.shadowColor}</span>
          </div>
        </div>
      </div>

      {/* 10. 캡션 배경 박스 및 패딩 라운딩 */}
      <div className="space-y-2 pt-1 border-t border-white/10">
        <span className="text-[10px] font-mono text-zinc-400 block font-bold">BACKDROP BOX & HIGHLIGHT</span>
        
        <select 
          value={style.backgroundColor}
          onChange={(e) => handleStyle('backgroundColor', e.target.value)}
          className="w-full bg-[#0A0B0E] border border-white/10 rounded-lg p-2 text-white text-[11px] font-bold outline-none cursor-pointer"
        >
          <option value="transparent">투명 (None)</option>
          <option value="rgba(0,0,0,0.75)">블랙 반투명 (75%)</option>
          <option value="rgba(0,0,0,0.95)">솔리드 딥 블랙 (95%)</option>
          <option value="rgba(197,155,81,0.85)">다빈치 앤틱 골드 (85%)</option>
          <option value="rgba(0,229,255,0.85)">네온 시안 블루 (85%)</option>
        </select>

        {style.backgroundColor !== 'transparent' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>BOX PADDING</span>
                <span className="font-mono text-white font-bold">{style.boxPaddingX || 12}px</span>
              </div>
              <input 
                type="range" min="4" max="32" value={style.boxPaddingX || 12}
                onChange={(e) => handleStyle('boxPaddingX', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>CORNER RADIUS</span>
                <span className="font-mono text-white font-bold">{style.boxRadius || 6}px</span>
              </div>
              <input 
                type="range" min="0" max="24" value={style.boxRadius || 6}
                onChange={(e) => handleStyle('boxRadius', Number(e.target.value))}
                className="w-full h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
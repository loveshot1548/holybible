import React, { useState } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// NLE 프로덕션 SVG 아이콘
const IconType = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M12 6v14m-4 0h8" />
  </svg>
);
const IconTransform = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);
const IconPalette = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);
const IconMotion = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const IconRotateReset = () => (
  <svg className="w-3 h-3 text-zinc-500 hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// 현업 숏폼 바이럴 프리셋 정의
const VIRAL_PRESETS = [
  {
    id: 'hormozi_pop',
    name: '호모지 옐로우',
    desc: '굵은 블랙 외곽선 + 옐로우 하이라이트',
    style: {
      fontFamily: 'GmarketSansBold',
      fontSize: 34,
      fontWeight: '900',
      color: '#FFE500',
      strokeColor: '#000000',
      strokeWidth: 4,
      backgroundColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 3,
      shadowOffsetY: 4,
      shadowColor: '#000000',
      tracking: -0.5,
      scale: 100,
      rotation: -1.5
    },
    animation: 'popSpring',
    animationDuration: 0.25
  },
  {
    id: 'clean_minimal',
    name: '클린 시네마틱',
    desc: '소프트 드롭섀도우 + 얇은 고딕',
    style: {
      fontFamily: 'Pretendard',
      fontSize: 22,
      fontWeight: '600',
      color: '#FFFFFF',
      strokeWidth: 0,
      backgroundColor: 'transparent',
      shadowBlur: 14,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
      shadowColor: 'rgba(0,0,0,0.85)',
      tracking: 0.5,
      scale: 100,
      rotation: 0
    },
    animation: 'fade',
    animationDuration: 0.35
  },
  {
    id: 'tiktok_box',
    name: '블랙 박스 뱃지',
    desc: '가독성 극대화 반투명 라운드 박스',
    style: {
      fontFamily: 'Pretendard',
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      strokeWidth: 0,
      backgroundColor: 'rgba(0,0,0,0.78)',
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxRadius: 8,
      shadowBlur: 0,
      scale: 100,
      rotation: 0
    },
    animation: 'slideUp',
    animationDuration: 0.3
  },
  {
    id: 'serif_story',
    name: '감성 명조',
    desc: '묵상 및 나레이션 세리프',
    style: {
      fontFamily: 'ChosunNm',
      fontSize: 23,
      fontWeight: '700',
      color: '#F4EFEA',
      strokeColor: '#000000',
      strokeWidth: 1.5,
      backgroundColor: 'transparent',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowColor: 'rgba(0,0,0,0.7)',
      scale: 100,
      rotation: 0
    },
    animation: 'blurReveal',
    animationDuration: 0.5
  }
];

export default function TextAnimator({ clip }) {
  const { updateClip } = useNLEStore();
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'transform' | 'style' | 'motion'

  if (!clip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs font-mono select-none">
        클립을 선택하면 텍스트 인스펙터가 활성화됩니다.
      </div>
    );
  }

  // 기본 스타일 속성 규격
  const style = {
    fontFamily: 'Pretendard',
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    tracking: 0,
    lineHeight: 1.35,
    strokeColor: '#000000',
    strokeWidth: 0,
    backgroundColor: 'transparent',
    boxPaddingX: 12,
    boxPaddingY: 6,
    boxRadius: 6,
    align: 'center',
    positionX: 0,
    positionY: 280, // 9:16 하단 릴스 세이프존 기본값
    scale: 100,
    rotation: 0,
    opacity: 100,
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 3,
    shadowColor: 'rgba(0,0,0,0.85)',
    ...(clip.style || {})
  };

  const animationIn = clip.animation || 'popSpring';
  const animationOut = clip.animationOut || 'fade';
  const animationDuration = clip.animationDuration ?? 0.3;
  const easing = clip.easing || 'cubic-bezier(0.16, 1, 0.3, 1)';

  const setStyleKey = (key, value) => {
    updateClip(clip.id, {
      style: { ...style, [key]: value }
    });
  };

  const applyPreset = (preset) => {
    updateClip(clip.id, {
      style: { ...style, ...preset.style },
      animation: preset.animation,
      animationDuration: preset.animationDuration
    });
  };

  // 9분할 세이프존 앵커 스냅 (Y축: -340 상단, 0 중앙, 280 하단 릴스 세이프)
  const setAnchorSnap = (x, y) => {
    updateClip(clip.id, {
      style: { ...style, positionX: x, positionY: y }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111216] border-l border-zinc-800/80 text-zinc-300 font-sans select-none text-[12px]">
      
      {/* 1. 인스펙터 서브 헤더 */}
      <div className="px-3 py-2.5 bg-[#15171D] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="font-semibold text-zinc-200 text-[11px] tracking-wide uppercase font-mono">
            Inspector : Text Overlay
          </span>
        </div>
        <button
          onClick={() => updateClip(clip.id, { style: { ...style, scale: 100, rotation: 0, positionX: 0, positionY: 280 } })}
          title="트랜스폼 초기화"
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
        >
          <IconRotateReset />
        </button>
      </div>

      {/* 2. 퀵 바이럴 프리셋 랙 */}
      <div className="p-2.5 bg-[#13151A] border-b border-zinc-800/70">
        <div className="text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">Style Presets</div>
        <div className="grid grid-cols-2 gap-1.5">
          {VIRAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-2 py-1.5 text-left rounded bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/40 hover:border-zinc-600 transition-all flex flex-col gap-0.5 group"
            >
              <span className="font-semibold text-[11px] text-zinc-200 group-hover:text-white">
                {preset.name}
              </span>
              <span className="text-[9.5px] text-zinc-500 line-clamp-1 leading-tight">
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 인스펙터 카테고리 탭 */}
      <div className="flex border-b border-zinc-800 bg-[#15171D] px-2 pt-1 gap-1">
        {[
          { id: 'text', label: '텍스트', icon: <IconType /> },
          { id: 'transform', label: '트랜스폼', icon: <IconTransform /> },
          { id: 'style', label: '스타일', icon: <IconPalette /> },
          { id: 'motion', label: '모션', icon: <IconMotion /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === tab.id
                ? 'border-blue-500 text-zinc-100 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. 탭별 컨트롤 패널 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* ================= TAB 1: TEXT ================= */}
        {activeTab === 'text' && (
          <div className="space-y-3.5">
            {/* 자막 본문 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400">
                <span>CONTENT</span>
                <span className="text-zinc-500">{(clip.content || '').length}자</span>
              </div>
              <textarea
                value={clip.content || ''}
                onChange={(e) => updateClip(clip.id, { content: e.target.value })}
                rows={3}
                placeholder="자막 내용을 입력하십시오..."
                className="w-full bg-[#16181F] border border-zinc-700/60 rounded-md p-2 text-zinc-100 text-[12px] font-normal outline-none resize-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 leading-relaxed"
              />
            </div>

            {/* 서체 패밀리 & 웨이트 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10.5px] font-mono text-zinc-400 block">FONT</label>
                <select
                  value={style.fontFamily}
                  onChange={(e) => setStyleKey('fontFamily', e.target.value)}
                  className="w-full bg-[#16181F] border border-zinc-700/60 rounded-md px-2 py-1.5 text-zinc-200 text-[11.5px] outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pretendard">Pretendard (고딕)</option>
                  <option value="GmarketSansBold">Gmarket Sans (볼드)</option>
                  <option value="ChosunNm">Chosun 명조 (감성)</option>
                  <option value="Montserrat">Montserrat (영문)</option>
                  <option value="Impact">Impact (바이럴 볼드)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-mono text-zinc-400 block">WEIGHT</label>
                <select
                  value={style.fontWeight}
                  onChange={(e) => setStyleKey('fontWeight', e.target.value)}
                  className="w-full bg-[#16181F] border border-zinc-700/60 rounded-md px-2 py-1.5 text-zinc-200 text-[11.5px] outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="400">Regular (400)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="800">Bold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
            </div>

            {/* 정렬 버튼 */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono text-zinc-400 block">ALIGN</label>
              <div className="grid grid-cols-3 gap-1 bg-[#16181F] p-1 border border-zinc-700/60 rounded-md">
                {[
                  { id: 'left', label: '좌측' },
                  { id: 'center', label: '중앙' },
                  { id: 'right', label: '우측' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStyleKey('align', item.id)}
                    className={`py-1 rounded text-[11px] font-medium transition-colors ${
                      style.align === item.id
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 폰트 크기 슬라이더 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10.5px] font-mono text-zinc-400">
                <span>SIZE</span>
                <span className="text-zinc-200 font-bold">{style.fontSize}px</span>
              </div>
              <input
                type="range" min="14" max="72" value={style.fontSize}
                onChange={(e) => setStyleKey('fontSize', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {/* 자간 / 행간 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>TRACKING</span>
                  <span>{style.tracking}px</span>
                </div>
                <input
                  type="range" min="-2" max="10" step="0.5" value={style.tracking}
                  onChange={(e) => setStyleKey('tracking', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>LINE HEIGHT</span>
                  <span>{style.lineHeight}</span>
                </div>
                <input
                  type="range" min="1.0" max="2.0" step="0.05" value={style.lineHeight}
                  onChange={(e) => setStyleKey('lineHeight', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TRANSFORM ================= */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            {/* 9분할 릴스 세이프존 앵커 프리셋 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400">
                <span>9-POINT SAFE ANCHOR</span>
                <span className="text-[10px] text-zinc-500">Instagram Safe Zone</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-[#16181F] p-2 border border-zinc-700/60 rounded-md w-36 mx-auto">
                {[
                  { x: -160, y: -320 }, { x: 0, y: -320 }, { x: 160, y: -320 },
                  { x: -160, y: 0 },    { x: 0, y: 0 },    { x: 160, y: 0 },
                  { x: -160, y: 280 },  { x: 0, y: 280 },  { x: 160, y: 280 }
                ].map((anchor, idx) => {
                  const isCurrent = Math.abs(style.positionX - anchor.x) < 20 && Math.abs(style.positionY - anchor.y) < 20;
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnchorSnap(anchor.x, anchor.y)}
                      className={`h-6 rounded flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position X / Y 정밀 입력 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>POS X (PX)</span>
                  <input
                    type="number"
                    value={style.positionX}
                    onChange={(e) => setStyleKey('positionX', Number(e.target.value))}
                    className="w-12 bg-transparent text-right font-mono text-zinc-200 outline-none"
                  />
                </div>
                <input
                  type="range" min="-300" max="300" value={style.positionX}
                  onChange={(e) => setStyleKey('positionX', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>POS Y (PX)</span>
                  <input
                    type="number"
                    value={style.positionY}
                    onChange={(e) => setStyleKey('positionY', Number(e.target.value))}
                    className="w-12 bg-transparent text-right font-mono text-zinc-200 outline-none"
                  />
                </div>
                <input
                  type="range" min="-450" max="450" value={style.positionY}
                  onChange={(e) => setStyleKey('positionY', Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Scale (%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10.5px] font-mono text-zinc-400">
                <span>SCALE</span>
                <span className="text-zinc-200 font-bold">{style.scale || 100}%</span>
              </div>
              <input
                type="range" min="30" max="250" value={style.scale || 100}
                onChange={(e) => setStyleKey('scale', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {/* Rotation (°) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10.5px] font-mono text-zinc-400">
                <span>ROTATION</span>
                <span className="text-zinc-200 font-bold">{style.rotation || 0}°</span>
              </div>
              <input
                type="range" min="-180" max="180" step="0.5" value={style.rotation || 0}
                onChange={(e) => setStyleKey('rotation', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 3: STYLE ================= */}
        {activeTab === 'style' && (
          <div className="space-y-3.5">
            {/* 기본 글자 색상 */}
            <div className="flex items-center justify-between bg-[#16181F] p-2 rounded-md border border-zinc-700/60">
              <span className="font-mono text-[11px] text-zinc-300">FILL COLOR</span>
              <div className="flex items-center gap-2">
                <input
                  type="color" value={style.color}
                  onChange={(e) => setStyleKey('color', e.target.value)}
                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0"
                />
                <span className="font-mono text-[11px] text-zinc-300 uppercase">{style.color}</span>
              </div>
            </div>

            {/* 외곽선 (Stroke) */}
            <div className="space-y-2 bg-[#16181F] p-2.5 rounded-md border border-zinc-700/60">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-300 font-medium">STROKE / OUTLINE</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color" value={style.strokeColor || '#000000'}
                    onChange={(e) => setStyleKey('strokeColor', e.target.value)}
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0"
                  />
                  <span className="font-mono text-[10.5px] text-zinc-400">{style.strokeWidth || 0}px</span>
                </div>
              </div>
              <input
                type="range" min="0" max="12" step="0.5" value={style.strokeWidth || 0}
                onChange={(e) => setStyleKey('strokeWidth', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {/* 배경 박스 (Backdrop) */}
            <div className="space-y-2 bg-[#16181F] p-2.5 rounded-md border border-zinc-700/60">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-300 font-medium">BACKDROP BOX</span>
                <select
                  value={style.backgroundColor}
                  onChange={(e) => setStyleKey('backgroundColor', e.target.value)}
                  className="bg-zinc-800 text-zinc-200 text-[10.5px] px-2 py-0.5 rounded border border-zinc-700 outline-none cursor-pointer"
                >
                  <option value="transparent">None (투명)</option>
                  <option value="rgba(0,0,0,0.75)">Black 75%</option>
                  <option value="rgba(0,0,0,0.92)">Solid Black</option>
                  <option value="#FFE500">Yellow Pop</option>
                  <option value="#FFFFFF">Solid White</option>
                </select>
              </div>

              {style.backgroundColor !== 'transparent' && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500">PADDING X</span>
                    <input
                      type="range" min="4" max="28" value={style.boxPaddingX || 12}
                      onChange={(e) => setStyleKey('boxPaddingX', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500">RADIUS</span>
                    <input
                      type="range" min="0" max="20" value={style.boxRadius || 6}
                      onChange={(e) => setStyleKey('boxRadius', Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 드롭 섀도우 (Shadow) */}
            <div className="space-y-2 bg-[#16181F] p-2.5 rounded-md border border-zinc-700/60">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-300 font-medium">DROP SHADOW</span>
                <span className="font-mono text-[10.5px] text-zinc-400">{style.shadowBlur} blur</span>
              </div>
              <input
                type="range" min="0" max="30" value={style.shadowBlur || 0}
                onChange={(e) => setStyleKey('shadowBlur', Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 4: MOTION ================= */}
        {activeTab === 'motion' && (
          <div className="space-y-4">
            {/* 인-애니메이션 (In-Animation) */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-mono text-zinc-400 block uppercase">IN-ANIMATION</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'popSpring', name: '스프링 팝업' },
                  { id: 'slideUp', name: '슬라이드 업' },
                  { id: 'typewriter', name: '타자기 연출' },
                  { id: 'blurReveal', name: '시네마 블러' },
                  { id: 'fade', name: '페이드 인' },
                  { id: 'none', name: '모션 없음' }
                ].map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => updateClip(clip.id, { animation: anim.id })}
                    className={`py-2 px-2 rounded text-left border text-[11px] font-medium transition-colors ${
                      animationIn === anim.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {anim.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 아웃-애니메이션 (Out-Animation) */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-mono text-zinc-400 block uppercase">OUT-ANIMATION</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'fade', name: '페이드' },
                  { id: 'slideDown', name: '슬라이드' },
                  { id: 'none', name: '없음' }
                ].map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => updateClip(clip.id, { animationOut: anim.id })}
                    className={`py-1.5 px-2 rounded text-center border text-[11px] transition-colors ${
                      animationOut === anim.id
                        ? 'bg-zinc-700 border-zinc-500 text-white font-medium'
                        : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {anim.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 애니메이션 속도 및 타이밍 제어 */}
            <div className="space-y-2 pt-1 border-t border-zinc-800">
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] font-mono text-zinc-400">
                  <span>TRANSITION DURATION</span>
                  <span className="text-zinc-200 font-bold">{animationDuration}s</span>
                </div>
                <input
                  type="range" min="0.1" max="1.2" step="0.05" value={animationDuration}
                  onChange={(e) => updateClip(clip.id, { animationDuration: Number(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-mono text-zinc-500 block">EASING CURVE</label>
                <select
                  value={easing}
                  onChange={(e) => updateClip(clip.id, { easing: e.target.value })}
                  className="w-full bg-[#16181F] border border-zinc-700/60 rounded px-2 py-1 text-zinc-300 text-[11px] outline-none cursor-pointer"
                >
                  <option value="cubic-bezier(0.16, 1, 0.3, 1)">Spring Elastic (바이럴 팝)</option>
                  <option value="cubic-bezier(0.4, 0, 0.2, 1)">Ease In-Out (스무스)</option>
                  <option value="cubic-bezier(0, 0, 0.2, 1)">Decelerate Ease-Out</option>
                  <option value="linear">Linear (일정 속도)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
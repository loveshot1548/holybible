// src/components/canvas/DrawingEngine.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

const getArr = (val, def = []) => Array.isArray(val) ? val : def;
const safeParse = (key, def) => { 
  try { 
    const val = localStorage.getItem(key); 
    if (!val) return def; 
    const parsed = JSON.parse(val); 
    return parsed !== null ? parsed : def; 
  } catch(e) { 
    return def; 
  } 
};

// 🌟 [핵심] 고감도 캘리그라피 & 베지에 스무딩 패스 렌더러
export const renderPath = (ctx, el) => {
  if (!el.points || el.points.length < 1) return;
  const pts = el.points;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.tool === 'fountain') {
    // 만년필: 가속도 기반 굵기 및 은은한 광택
    ctx.strokeStyle = el.color;
    ctx.shadowColor = el.color;
    ctx.shadowBlur = 1.2;
    ctx.lineWidth = el.size * 1.1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();

  } else if (el.tool === 'highlighter') {
    // 형광펜: 부드러운 텍스트 투과 멀티플라이
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.size * 3.5;
    ctx.globalAlpha = 0.35;
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

  } else if (el.tool === 'charcoal') {
    // 목탄/연필: 미세 지터 질감
    ctx.strokeStyle = el.color;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = el.size * 1.6;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const jitter = (Math.sin(i * 12.3) * 1.8);
      ctx.lineTo(pts[i].x + jitter, pts[i].y + jitter);
    }
    ctx.stroke();

  } else if (el.tool.startsWith('arrow')) {
    // 스마트 다이렉셔널 화살표
    ctx.lineWidth = el.size;
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.globalAlpha = 1.0;

    const pStart = pts[0];
    const pEnd = pts[pts.length - 1];
    const dist = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);

    if (dist > 5) {
      const angle = Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x);
      const headLen = 14 + el.size;

      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      const endX = pEnd.x - headLen * Math.cos(angle) * 0.8;
      const endY = pEnd.y - headLen * Math.sin(angle) * 0.8;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pEnd.x, pEnd.y);
      ctx.lineTo(pEnd.x - headLen * Math.cos(angle - Math.PI / 6), pEnd.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(pEnd.x - headLen * Math.cos(angle + Math.PI / 6), pEnd.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // 표준 부드러운 펜
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.size;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }
  ctx.restore();
};

export function StickerLayer({ memos, stickers, onUpdateMemos, onUpdateStickers, onPtrDown }) {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {getArr(memos).map(memo => {
        const isPink = memo.animal === '🐰';
        return (
          <div 
            key={memo.id} 
            onPointerDown={(e) => onPtrDown(e, memo, 'memo')} 
            className={`absolute shadow-xl border backdrop-blur-sm flex flex-col pointer-events-auto touch-none cursor-move rounded-2xl ${
              isPink ? 'bg-pink-50/95 border-pink-200' : 'bg-amber-50/95 border-amber-200'
            }`} 
            style={{ left: memo.x, top: memo.y, minWidth: '140px' }}
          >
            <div className={`py-1 px-2.5 font-bold text-[11px] flex justify-between items-center select-none rounded-t-2xl ${
              isPink ? 'bg-pink-100 text-pink-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span>{memo.animal || '📝'} 메모</span>
              <button 
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={() => onUpdateMemos(getArr(memos).filter(m => m.id !== memo.id))} 
                className="text-slate-400 hover:text-red-500 font-bold bg-white/80 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
              >
                ×
              </button>
            </div>
            <textarea 
              className="w-full bg-transparent resize-y h-20 p-2 text-xs outline-none text-slate-800" 
              placeholder="묵상 메모..." 
              value={memo.text} 
              onChange={(e) => onUpdateMemos(getArr(memos).map(m => m.id === memo.id ? {...m, text: e.target.value} : m))} 
              onPointerDown={(e) => e.stopPropagation()} 
            />
          </div>
        );
      })}

      {getArr(stickers).map(stk => (
        <div 
          key={stk.id} 
          onPointerDown={(e) => onPtrDown(e, stk, 'sticker')} 
          className="absolute cursor-move text-4xl hover:scale-110 transition-transform select-none pointer-events-auto touch-none group" 
          style={{ left: stk.x, top: stk.y }}
        >
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => onUpdateStickers(getArr(stickers).filter(s => s.id !== stk.id))} 
            className="absolute -top-2 -right-2 bg-white text-slate-500 border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
          >
            ×
          </button>
          {stk.isEmoji ? stk.src : <img src={stk.src} alt="" className="w-16 drop-shadow-sm pointer-events-none" draggable="false" />}
        </div>
      ))}
    </div>
  );
}

export function CanvasEngine({ 
  saveKey, 
  tool, 
  color, 
  size, 
  t = {}, 
  renderStickers, 
  children 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [elements, setElements] = useState(() => safeParse(`custom_native_canvas_${saveKey}`, []));
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // 🌟 [핵심] 렉 방지 비동기 로컬스토리지 저장 디바운싱
  const triggerDebouncedSave = useCallback((data) => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`custom_native_canvas_${saveKey}`, JSON.stringify(data));
      } catch (e) {
        console.warn('스토리지 용량 초과 방어');
      }
    }, 400);
  }, [saveKey]);

  useEffect(() => {
    setElements(safeParse(`custom_native_canvas_${saveKey}`, []));
  }, [saveKey]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
    getArr(elements).forEach(el => renderPath(ctx, el));
    if (currentPathRef.current) renderPath(ctx, currentPathRef.current);
  }, [elements]);

  useEffect(() => {
    triggerDebouncedSave(elements);
    redrawCanvas();
  }, [elements, triggerDebouncedSave, redrawCanvas]);

  // 🌟 Retina DPR 자동 계산 리사이저
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      const w = container.scrollWidth;
      const h = container.scrollHeight;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    if (tool === 'hand') return;
    const pos = getPos(e);

    if (tool === 'eraser') {
      setElements(prev => getArr(prev).filter(el => {
        if (!el.points) return true;
        return !el.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < (size * 3));
      }));
      return;
    }

    isDrawingRef.current = true;
    currentPathRef.current = { type: 'freehand', tool, color, size, points: [pos] };
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const pos = getPos(e);

    if (currentPathRef.current) {
      const pts = currentPathRef.current.points;
      if (pts.length > 0 && Math.hypot(pos.x - pts[pts.length - 1].x, pos.y - pts[pts.length - 1].y) > 2) {
        pts.push(pos);
        redrawCanvas();
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPathRef.current && currentPathRef.current.points.length > 1) {
      setElements(prev => [...getArr(prev), currentPathRef.current]);
    }
    currentPathRef.current = null;
    redrawCanvas();
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative flex-1 w-full overflow-y-auto scroll-smooth hide-scrollbar ${t.pageBg || 'bg-white dark:bg-zinc-950'}`} 
      style={{ touchAction: tool === 'hand' ? 'pan-y pan-x' : 'none' }}
    >
      <div className="relative w-full h-max min-h-full flex flex-col">
        {renderStickers && renderStickers()}
        <div className={`absolute inset-0 z-30 ${tool === 'hand' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 cursor-crosshair w-full h-full" 
            onMouseDown={handlePointerDown} 
            onMouseMove={handlePointerMove} 
            onMouseUp={handlePointerUp} 
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown} 
            onTouchMove={handlePointerMove} 
            onTouchEnd={handlePointerUp} 
          />
        </div>
        <div className="relative z-20 flex-1 flex flex-col pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
// src/components/DrawingEngine.js (또는 src/components/canvas/DrawingEngine.js)
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

// 🌟 [핵심] 필기구별 실제 물리 텍스처 & 베지에 스무딩 패스 렌더러
export const renderPath = (ctx, el) => {
  if (!el || !el.points || el.points.length < 1) return;
  const pts = el.points;
  const size = el.size || 3.5;
  const color = el.color || '#007AFF';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1) 만년필: 45도 닙 각도 및 필속 감응형 캘리그라피 리본
  if (el.tool === 'fountain') {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const baseW = Math.max(1.4, size * 1.15);

    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, baseW / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const nibFactor = 0.45 + 0.75 * Math.abs(Math.sin(angle - Math.PI / 4));
      const speedFactor = Math.max(0.55, Math.min(1.35, 1.25 - dist * 0.025));

      ctx.beginPath();
      ctx.lineWidth = baseW * nibFactor * speedFactor;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 2) 미술 연필: 종이 요철에 흑연 입자가 묻어나는 그레인 텍스처
  if (el.tool === 'pencil') {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const baseR = Math.max(1.2, size * 0.75);

    ctx.globalAlpha = 0.35;
    ctx.lineWidth = baseR * 0.85;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const steps = Math.max(1, Math.ceil(dist / 1.6));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;

        for (let g = 0; g < 3; g++) {
          const seed = Math.sin(cx * 12.9898 + cy * 78.233 + s + g * 13) * 43758.5453;
          const r1 = seed - Math.floor(seed);
          const r2 = (seed * 1.9) - Math.floor(seed * 1.9);
          ctx.globalAlpha = 0.2 + r1 * 0.35;
          ctx.fillRect(cx + (r1 - 0.5) * baseR * 2.1, cy + (r2 - 0.5) * baseR * 2.1, 1.3, 1.3);
        }
      }
    }
    ctx.restore();
    return;
  }

  // 3) 목탄 / 크레용: 거친 파스텔 드라이 브러시 질감
  if (el.tool === 'charcoal') {
    ctx.fillStyle = color;
    const spreadW = Math.max(4, size * 2.1);

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const steps = Math.max(1, Math.ceil(dist / 2));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;

        for (let b = 0; b < 5; b++) {
          const seed = Math.sin((cx + b * 11) * 29.17 + (cy - b * 7) * 53.11) * 10000;
          const r1 = seed - Math.floor(seed);
          const r2 = (seed * 2.3) - Math.floor(seed * 2.3);
          ctx.globalAlpha = 0.15 + r1 * 0.28;
          ctx.beginPath();
          ctx.arc(cx + (r1 - 0.5) * spreadW, cy + (r2 - 0.5) * spreadW, Math.max(1.1, size * 0.38), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    return;
  }

  // 4) 형광펜 (단일 패스 사선 팁 — 오프스크린 버퍼에서 alpha 1.0으로 호출됨)
  if (el.tool === 'highlighter') {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(14, size * 4.2);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 5) 스마트 다이렉셔널 화살표
  if (el.tool && el.tool.startsWith('arrow')) {
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;

    const pStart = pts[0];
    const pEnd = pts[pts.length - 1];
    const dist = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);

    if (dist > 5) {
      const angle = Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x);
      const headLen = 14 + size;

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
    ctx.restore();
    return;
  }

  // 6) 기본 부드러운 볼펜
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
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
  const hlOffscreenRef = useRef(null);
  const containerRef = useRef(null);
  const [elements, setElements] = useState(() => safeParse(`custom_native_canvas_${saveKey}`, []));
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

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
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const allEls = [...getArr(elements)];
    if (currentPathRef.current) allEls.push(currentPathRef.current);

    // 1) 형광펜 스트로크들은 오프스크린 버퍼에서 먼저 합쳐서 중첩 얼룩을 100% 방지
    const hlEls = allEls.filter(el => el?.tool === 'highlighter');
    if (hlEls.length > 0) {
      if (!hlOffscreenRef.current) {
        hlOffscreenRef.current = document.createElement('canvas');
      }
      const hlCanvas = hlOffscreenRef.current;
      if (hlCanvas.width !== canvas.width || hlCanvas.height !== canvas.height) {
        hlCanvas.width = canvas.width;
        hlCanvas.height = canvas.height;
      }
      const hlCtx = hlCanvas.getContext('2d');
      hlCtx.setTransform(1, 0, 0, 1, 0, 0);
      hlCtx.clearRect(0, 0, hlCanvas.width, hlCanvas.height);
      hlCtx.scale(dpr, dpr);

      hlEls.forEach(el => {
        hlCtx.globalAlpha = 1.0;
        renderPath(hlCtx, el);
      });

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.35;
      ctx.drawImage(hlCanvas, 0, 0);
      ctx.restore();
    }

    // 2) 일반 펜/만년필/연필/목탄 렌더링
    allEls.forEach(el => {
      if (el?.tool === 'highlighter') return;
      renderPath(ctx, el);
    });
  }, [elements]);

  useEffect(() => {
    triggerDebouncedSave(elements);
    redrawCanvas();
  }, [elements, triggerDebouncedSave, redrawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      const w = container.scrollWidth;
      const h = container.scrollHeight;

      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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
// src/components/viewer/DrawMaskOverlay.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgBrush = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.14 8.14a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);
const SvgEraser = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a2.25 2.25 0 010-3.182L9.42 3.238a2.25 2.25 0 013.182 0l8.16 8.16a2.25 2.25 0 010 3.182l-6.375 6.375a2.25 2.25 0 01-3.182 0z" />
  </svg>
);
const SvgRect = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2" />
  </svg>
);
const SvgCircle = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <ellipse cx="12" cy="12" rx="8.25" ry="8.25" />
  </svg>
);
const SvgPen = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);
const SvgLinear = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
  </svg>
);
const SvgInvert = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0l-4.5 4.5M21 12H7.5" />
  </svg>
);
const SvgUndo = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);
const SvgRedo = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function DrawMaskOverlay({ clipId, onClose }) {
  const { entities, updateClip, playhead } = useNLEStore();
  const clip = entities?.clips?.[clipId];

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const animFrameRef = useRef(null);

  const [activeTool, setActiveTool] = useState('brush');
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' | 'cutout' | 'matte'

  const [brushSize, setBrushSize] = useState(32);
  const [brushFeather, setBrushFeather] = useState(14);
  const [maskOpacity, setMaskOpacity] = useState(100);
  const [maskExpansion, setMaskExpansion] = useState(0);
  const [isInverted, setIsInverted] = useState(clip?.maskConfig?.inverted || false);

  const [shapes, setShapes] = useState(() => clip?.maskConfig?.shapes || []);
  const [historyStack, setHistoryStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [currentStroke, setCurrentStroke] = useState([]);
  const [shapeStartPos, setShapeStartPos] = useState(null);
  const [currentShapePreview, setCurrentShapePreview] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);

  const [zoomLevel, setZoomLevel] = useState(100);

  // 동영상 프레임 동기화
  useEffect(() => {
    if (clip && videoPreviewRef.current && clip.type === 'video') {
      const offsetInClip = Math.max(0, playhead - (clip.start || 0));
      videoPreviewRef.current.currentTime = offsetInClip;
    }
  }, [clip, playhead]);

  // 🌟 [핵심 1] 캔버스 리드로우 (DPR 및 반전/지우개 무손실 합성)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const strokeColor = viewMode === 'matte' ? '#FFFFFF' : 'rgba(239, 68, 68, 0.85)';
    const shadowColor = viewMode === 'matte' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(239, 68, 68, 0.9)';

    const dpr = window.devicePixelRatio || 1;
    const scaledFeather = brushFeather * dpr;

    const renderSingleShape = (s) => {
      ctx.save();
      ctx.beginPath();

      if (s.type === 'brush' || !s.type) {
        if (!s.points || s.points.length < 2) { ctx.restore(); return; }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(2, ((s.size || brushSize) + maskExpansion) * dpr);
        ctx.shadowBlur = (s.feather ?? brushFeather) * dpr;
        ctx.shadowColor = s.isEraser ? 'transparent' : shadowColor;

        if (s.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = '#000000';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = strokeColor;
        }

        ctx.moveTo(s.points[0].nx * w, s.points[0].ny * h);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].nx * w, s.points[i].ny * h);
        }
        ctx.stroke();

      } else if (s.type === 'rect') {
        const x = s.startX * w;
        const y = s.startY * h;
        const rw = (s.endX - s.startX) * w;
        const rh = (s.endY - s.startY) * h;
        const exp = maskExpansion * dpr;

        ctx.shadowBlur = scaledFeather;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = strokeColor;
        ctx.rect(x - exp, y - exp, rw + exp * 2, rh + exp * 2);
        ctx.fill();

      } else if (s.type === 'circle') {
        const cx = ((s.startX + s.endX) / 2) * w;
        const cy = ((s.startY + s.endY) / 2) * h;
        const exp = maskExpansion * dpr;
        const rx = Math.abs((s.endX - s.startX) * w / 2) + exp;
        const ry = Math.abs((s.endY - s.startY) * h / 2) + exp;

        ctx.shadowBlur = scaledFeather;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = strokeColor;
        ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
        ctx.fill();

      } else if (s.type === 'linear') {
        const grad = ctx.createLinearGradient(0, s.startY * h, 0, s.endY * h);
        grad.addColorStop(0, strokeColor);
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

      } else if (s.type === 'pen') {
        if (!s.points || s.points.length < 2) { ctx.restore(); return; }
        ctx.shadowBlur = scaledFeather;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = strokeColor;
        ctx.moveTo(s.points[0].nx * w, s.points[0].ny * h);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].nx * w, s.points[i].ny * h);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    shapes.forEach(renderSingleShape);

    if (currentStroke.length > 1) {
      renderSingleShape({
        type: 'brush',
        points: currentStroke,
        size: brushSize,
        feather: brushFeather,
        isEraser: activeTool === 'eraser'
      });
    }

    if (currentShapePreview) {
      renderSingleShape(currentShapePreview);
    }

    // 펜툴 가이드라인 렌더링
    if (polygonPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].nx * w, polygonPoints[0].ny * h);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].nx * w, polygonPoints[i].ny * h);
      }
      ctx.stroke();

      polygonPoints.forEach((pt, pIdx) => {
        ctx.beginPath();
        ctx.fillStyle = pIdx === 0 ? '#10B981' : '#00E5FF';
        ctx.arc(pt.nx * w, pt.ny * h, 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  }, [shapes, currentStroke, currentShapePreview, polygonPoints, brushSize, brushFeather, maskExpansion, activeTool, viewMode]);

  // 캔버스 크기 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = Math.round(rect.width * dpr);
        canvasRef.current.height = Math.round(rect.height * dpr);
        redrawCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(() => redrawCanvas());
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [redrawCanvas, viewMode, maskExpansion]);

  // 🌟 [핵심 2] 줌 스케일(100%~150%) 역산 정규화 좌표 도출기
  const getNormalizedPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { nx: 0, ny: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // getBoundingClientRect는 transform scale이 적용된 실제 렌더 픽셀 크기를 반환하므로
    // 직접 마우스 위치를 빼서 정규화하면 스케일과 상관없이 정확한 0.0 ~ 1.0 비율이 도출됨
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    return {
      nx: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      ny: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }

    const pos = getNormalizedPos(e);

    if (activeTool === 'pen') {
      if (polygonPoints.length > 2) {
        const startPt = polygonPoints[0];
        const dist = Math.hypot(pos.nx - startPt.nx, pos.ny - startPt.ny);
        if (dist < 0.05) {
          pushShape({ type: 'pen', points: [...polygonPoints, startPt] });
          setPolygonPoints([]);
          return;
        }
      }
      setPolygonPoints(prev => [...prev, pos]);
      return;
    }

    setIsDrawing(true);
    setShapeStartPos(pos);

    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCurrentStroke([pos]);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getNormalizedPos(e);

    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCurrentStroke(prev => [...prev, pos]);
      animFrameRef.current = requestAnimationFrame(() => redrawCanvas());
    } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'linear') {
      if (shapeStartPos) {
        setCurrentShapePreview({
          type: activeTool,
          startX: shapeStartPos.nx,
          startY: shapeStartPos.ny,
          endX: pos.nx,
          endY: pos.ny
        });
        animFrameRef.current = requestAnimationFrame(() => redrawCanvas());
      }
    }
  };

  const handlePointerUp = (e) => {
    if (e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'brush' || activeTool === 'eraser') {
      if (currentStroke.length > 1) {
        pushShape({
          type: 'brush',
          points: currentStroke,
          size: brushSize,
          feather: brushFeather,
          isEraser: activeTool === 'eraser'
        });
      }
      setCurrentStroke([]);
    } else if (currentShapePreview) {
      pushShape(currentShapePreview);
      setCurrentShapePreview(null);
      setShapeStartPos(null);
    }
  };

  const pushShape = (newShape) => {
    setShapes(prev => [...prev, newShape]);
    setHistoryStack([]);
  };

  const handleUndo = () => {
    if (shapes.length === 0) return;
    const last = shapes[shapes.length - 1];
    setHistoryStack(prev => [...prev, last]);
    setShapes(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (historyStack.length === 0) return;
    const next = historyStack[historyStack.length - 1];
    setShapes(prev => [...prev, next]);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    if (window.confirm('그려진 모든 마스크를 초기화하시겠습니까?')) {
      setShapes([]);
      setPolygonPoints([]);
      setHistoryStack([]);
    }
  };

  // 🌟 [핵심 3] CSS Mask 전용 9:16 하이레졸루션 알파 매트 생성
  const handleApply = () => {
    if (shapes.length === 0) {
      updateClip(clipId, { maskConfig: { enabled: false, shapes: [], maskDataUrl: null } });
      onClose();
      return;
    }

    // 표준 9:16 가상 버퍼 캔버스 (720x1280)
    const expCanvas = document.createElement('canvas');
    expCanvas.width = 720;
    expCanvas.height = 1280;
    const ctx = expCanvas.getContext('2d');
    const w = 720;
    const h = 1280;

    if (isInverted) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalCompositeOperation = 'source-over';
    }

    // 쉐이프 벡터 렌더링
    shapes.forEach((s) => {
      ctx.save();
      ctx.beginPath();

      if (s.type === 'brush' || !s.type) {
        if (s.points && s.points.length >= 2) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(4, (s.size || brushSize) * 2.2);
          ctx.shadowBlur = (s.feather ?? brushFeather) * 2.2;
          ctx.shadowColor = '#FFFFFF';
          ctx.strokeStyle = '#FFFFFF';
          if (s.isEraser) {
            ctx.globalCompositeOperation = isInverted ? 'source-over' : 'destination-out';
          }
          ctx.moveTo(s.points[0].nx * w, s.points[0].ny * h);
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].nx * w, s.points[i].ny * h);
          }
          ctx.stroke();
        }
      } else if (s.type === 'rect') {
        const x = s.startX * w;
        const y = s.startY * h;
        const rw = (s.endX - s.startX) * w;
        const rh = (s.endY - s.startY) * h;
        ctx.shadowBlur = brushFeather * 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.rect(x, y, rw, rh);
        ctx.fill();
      } else if (s.type === 'circle') {
        const cx = ((s.startX + s.endX) / 2) * w;
        const cy = ((s.startY + s.endY) / 2) * h;
        const rx = Math.abs((s.endX - s.startX) * w / 2);
        const ry = Math.abs((s.endY - s.startY) * h / 2);
        ctx.shadowBlur = brushFeather * 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.type === 'pen' && s.points?.length >= 2) {
        ctx.shadowBlur = brushFeather * 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.moveTo(s.points[0].nx * w, s.points[0].ny * h);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].nx * w, s.points[i].ny * h);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    const maskDataUrl = expCanvas.toDataURL('image/png');

    updateClip(clipId, {
      maskConfig: {
        enabled: true,
        inverted: isInverted,
        opacity: maskOpacity,
        feather: brushFeather,
        expansion: maskExpansion,
        shapes,
        maskDataUrl
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#07080B]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-2 sm:p-4 select-none text-zinc-100 font-sans pb-[env(safe-area-inset-bottom,8px)] pt-[env(safe-area-inset-top,8px)]">
      
      {/* 1. 상단 툴 선택 및 조절 바 */}
      <div className="w-full max-w-4xl bg-[#12141C] border border-white/10 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xl shrink-0">
        <div className="flex items-center gap-1 bg-[#0A0B0E] p-1 rounded-xl border border-white/5 overflow-x-auto hide-scrollbar">
          {[
            { id: 'brush', icon: <SvgBrush />, label: '브러시' },
            { id: 'eraser', icon: <SvgEraser />, label: '지우개' },
            { id: 'rect', icon: <SvgRect />, label: '직사각형' },
            { id: 'circle', icon: <SvgCircle />, label: '타원' },
            { id: 'pen', icon: <SvgPen />, label: '펜툴' },
            { id: 'linear', icon: <SvgLinear />, label: '리니어' }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setPolygonPoints([]); }}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeTool === tool.id
                  ? 'bg-[#00E5FF] text-black font-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tool.icon}
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold">
              <span>반경</span>
              <span className="text-[#00E5FF]">{brushSize}px</span>
            </div>
            <input 
              type="range" min="4" max="120" value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold">
              <span>페더</span>
              <span className="text-[#00E5FF]">{brushFeather}px</span>
            </div>
            <input 
              type="range" min="0" max="50" value={brushFeather}
              onChange={e => setBrushFeather(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold">
              <span>확장</span>
              <span className="text-[#00E5FF]">{maskExpansion > 0 ? `+${maskExpansion}` : maskExpansion}px</span>
            </div>
            <input 
              type="range" min="-30" max="30" value={maskExpansion}
              onChange={e => setMaskExpansion(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 accent-[#00E5FF] bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsInverted(!isInverted)}
            className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all ${
              isInverted ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
            title="마스크 영역 반전"
          >
            <SvgInvert />
            <span className="hidden sm:inline">반전</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={shapes.length === 0}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
            title="실행 취소"
          >
            <SvgUndo />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyStack.length === 0}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
            title="다시 실행"
          >
            <SvgRedo />
          </button>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer ml-1"
          >
            <SvgClose />
          </button>
        </div>
      </div>

      {/* 2. 중앙 9:16 뷰포트 (좌표 왜곡 없는 안정적 스케일링) */}
      <div 
        ref={containerRef}
        style={{ transform: `scale(${zoomLevel / 100})` }}
        className="relative flex-1 min-h-0 aspect-[9/16] border-2 border-[#00E5FF]/60 rounded-2xl overflow-hidden shadow-2xl cursor-crosshair touch-none my-1 bg-black transition-transform duration-100"
      >
        {clip && (
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            {clip.type === 'video' ? (
              <video
                ref={videoPreviewRef}
                src={clip.url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={clip.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {viewMode === 'cutout' && (
          <div 
            className="absolute inset-0 bg-[#07080B]/90 pointer-events-none"
            style={{
              maskImage: clip?.maskConfig?.maskDataUrl ? `url(${clip.maskConfig.maskDataUrl})` : 'none',
              WebkitMaskImage: clip?.maskConfig?.maskDataUrl ? `url(${clip.maskConfig.maskDataUrl})` : 'none',
              maskSize: 'cover',
              WebkitMaskSize: 'cover'
            }}
          />
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full z-20 touch-none"
        />

        <div className="absolute top-2 left-2 z-30 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] text-[#00E5FF] font-bold border border-white/10 pointer-events-none flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
          {activeTool === 'pen'
            ? '점들을 잇고 시작점을 다시 터치해 닫으세요'
            : '붉은색 마킹 영역이 마스크 투과 구역입니다'}
        </div>
      </div>

      {/* 3. 하단 프리뷰 모드 및 확정 액션 바 */}
      <div className="w-full max-w-4xl bg-[#12141C] border border-white/10 rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xl shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-zinc-400 font-bold hidden sm:inline">VIEW:</span>
          <div className="flex bg-[#0A0B0E] p-0.5 rounded-lg border border-white/5">
            {[
              { id: 'overlay', label: '오버레이' },
              { id: 'cutout', label: '컷아웃' },
              { id: 'matte', label: '알파 매트' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  viewMode === m.id
                    ? 'bg-[#00E5FF] text-black font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 ml-1 font-mono text-[9px]">
            <button onClick={() => setZoomLevel(100)} className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">100%</button>
            <button onClick={() => setZoomLevel(150)} className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">150%</button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleClearAll}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            초기화
          </button>

          <button 
            onClick={onClose} 
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-white/10"
          >
            취소
          </button>

          <button 
            onClick={handleApply} 
            className="px-5 py-1.5 bg-[#00E5FF] hover:bg-[#00cce6] text-black font-black rounded-lg text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            마스크 확정 💾
          </button>
        </div>
      </div>

    </div>
  );
}
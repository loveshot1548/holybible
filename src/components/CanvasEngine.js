// src/components/canvas/CanvasEngine.js
import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function CanvasEngine({ 
  isDrawingMode = true, 
  tool = 'pen', 
  color = '#00E5FF', 
  size = 4,
  onHistoryChange 
}) {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // 🌟 [핵심 1] Retina 고해상도(DPR) 동적 스케일링 & 찌그러짐 방지 리사이징
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    redraw(history.slice(0, historyIndex + 1));
  }, [history, historyIndex]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas, isDrawingMode]);

  // 🌟 [핵심 2] 굿노트/애플펜슬 규격 2차 베지에 곡선(Quadratic Bezier) 실시간 렌더러
  const drawSmoothStroke = (ctx, points, strokeTool, strokeColor, strokeSize) => {
    if (!points || points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (strokeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeSize * 2.5;
    } else if (strokeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = strokeSize * 3;
      ctx.strokeStyle = strokeColor;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = strokeSize;
      ctx.strokeStyle = strokeColor;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  };

  const redraw = (strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);

    strokes.forEach(stroke => {
      drawSmoothStroke(ctx, stroke.points, stroke.tool, stroke.color, stroke.size);
    });
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // 🌟 [핵심 3] 포인터 이벤트 통합 처리
  const startDrawing = (e) => {
    if (!isDrawingMode) return;
    if (e.touches && e.touches.length > 1) return; // 멀티터치 스크롤 허용
    e.preventDefault();

    isDrawing.current = true;
    const pos = getPos(e);
    currentStroke.current = [pos];

    const ctx = canvasRef.current.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? size * 2.5 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fill();
    ctx.restore();
  };

  const draw = (e) => {
    if (!isDrawing.current || !isDrawingMode) return;
    e.preventDefault();

    const pos = getPos(e);
    currentStroke.current.push(pos);

    const ctx = canvasRef.current.getContext('2d');
    const pts = currentStroke.current;
    if (pts.length > 2) {
      drawSmoothStroke(ctx, pts.slice(-3), tool, color, size);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStroke.current.length > 0) {
      const newStroke = {
        tool,
        color,
        size,
        points: currentStroke.current
      };
      const nextHistory = [...history.slice(0, historyIndex + 1), newStroke];
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      if (typeof onHistoryChange === 'function') {
        onHistoryChange({ canUndo: true, canRedo: false });
      }
    }
    currentStroke.current = [];
  };

  // 🌟 [핵심 4] 드로잉 전용 Undo/Redo 제어 메소드
  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    redraw(history.slice(0, nextIdx + 1));
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    redraw(history.slice(0, nextIdx + 1));
  }, [history, historyIndex]);

  const handleClear = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
        className={`absolute inset-0 w-full h-full ${
          isDrawingMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
      />
    </div>
  );
}
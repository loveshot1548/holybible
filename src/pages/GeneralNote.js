// src/page/GeneralNote.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

// =====================================================================
// 모던 아카데믹 라인 아이콘 (이모지 100% 배제)
// =====================================================================
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconPen = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const IconPencil = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const IconMarker = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 16V5c0-1.1.9-2 2-2h9a2 2 0 012 2v11M4 16h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" /></svg>;
const IconBrush = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 3v4" /></svg>;
const IconHighlighter = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l9.37-9.37a2.121 2.121 0 00-3-3l-9.37 9.37a2.121 2.121 0 00-.57 1.07l-.76 3.03a.5.5 0 00.61.61l3.03-.76a2.121 2.121 0 001.07-.57z" /><path d="M14 7l3 3" /></svg>;
const IconEraser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconUndo = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const IconRedo = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconSave = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const IconDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

// =====================================================================
// 🌟 2차 베지에 곡선(Quadratic Bézier) 고정밀 브러시 엔진
// =====================================================================
const renderStroke = (ctx, stroke, isDark) => {
  const { tool, color, size, points } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const resolvedColor = (isDark && color === '#1E293B') ? '#F8FAFC' : color;

  switch (tool) {
    case 'pencil':
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = Math.max(1, size * 0.85);
      ctx.globalAlpha = 0.65;
      break;

    case 'marker':
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = size * 1.5;
      ctx.globalAlpha = 0.9;
      break;

    case 'brush':
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = size * 1.8;
      ctx.shadowBlur = size * 1.2;
      ctx.shadowColor = resolvedColor;
      ctx.globalAlpha = 0.75;
      break;

    case 'highlighter':
      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      ctx.strokeStyle = color === '#1E293B' ? 'rgba(250, 204, 21, 0.45)' : color;
      ctx.lineWidth = size * 3.8;
      ctx.globalAlpha = isDark ? 0.6 : 0.45;
      break;

    case 'eraser':
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 6;
      ctx.globalAlpha = 1.0;
      break;

    case 'pen':
    default:
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = size;
      ctx.globalAlpha = 1.0;
      break;
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
    return;
  }

  // 🌟 스무딩 곡선 연산 (중간점 베지에 보간법)
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
  ctx.stroke();
  ctx.restore();
};

export default function GeneralNote({ t, isDarkMode, setActiveScreen, setIsSidebarOpen, isSidebarOpen }) {
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const ui = {
    bgApp: isDark ? 'bg-[#121214]' : 'bg-[#F9F9FB]',
    bgToolbar: isDark ? 'bg-[#1A1A1E]' : 'bg-[#FFFFFF]',
    textMain: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSub: isDark ? 'text-zinc-400' : 'text-zinc-500',
    border: isDark ? 'border-white/10' : 'border-zinc-200/80',
    activeTool: isDark ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200',
    inactiveTool: isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
  };

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);

  // 🌟 벡터 기반 드로잉 스택 (리사이즈 시 왜곡 0% 보장)
  const [strokes, setStrokes] = useState(() => {
    try {
      const saved = localStorage.getItem('gt_general_note_vector_strokes_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [redoStack, setRedoStack] = useState([]);

  const [currentTool, setCurrentTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#1E293B');
  const [strokeWidth, setStrokeWidth] = useState(3.5);
  const [paperStyle, setPaperStyle] = useState('dot'); // 'dot', 'line', 'grid', 'blank'

  const triggerHaptic = useCallback((pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }, []);

  // 🌟 전체 캔버스 60FPS 벡터 다시 그리기
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    strokes.forEach(stroke => {
      renderStroke(ctx, stroke, isDark);
    });

    if (currentPointsRef.current.length > 0) {
      renderStroke(ctx, {
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        points: currentPointsRef.current
      }, isDark);
    }
  }, [strokes, currentTool, strokeColor, strokeWidth, isDark]);

  // 🌟 Retina 디스플레이 고해상도 리사이즈 엔진
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    redraw();
  }, [redraw]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  // 획 추가 시 자동 로컬스토리지 백업
  useEffect(() => {
    try {
      localStorage.setItem('gt_general_note_vector_strokes_v3', JSON.stringify(strokes));
    } catch (_) {}
    redraw();
  }, [strokes, redraw]);

  // 🌟 포인터 좌표 정밀 추적기
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // 🌟 모바일 터치 & 펜슬 통합 포인터 핸들러
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pos = getCoordinates(e);

    isDrawingRef.current = true;
    currentPointsRef.current = [pos];
    e.target.setPointerCapture?.(e.pointerId);

    // 최초 터치 점 렌더
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      renderStroke(ctx, {
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        points: [pos]
      }, isDark);
    }
  };

  const onPointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const pos = getCoordinates(e);

    const pts = currentPointsRef.current;
    const lastPos = pts[pts.length - 1];

    // 미세 지터 방지 및 최적화
    if (!lastPos || Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y) > 2.5) {
      pts.push(pos);
      redraw();
    }
  };

  const onPointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    e.target.releasePointerCapture?.(e.pointerId);

    if (currentPointsRef.current.length > 0) {
      const newStroke = {
        id: Date.now() + Math.random(),
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        points: [...currentPointsRef.current]
      };
      setStrokes(prev => [...prev, newStroke]);
      setRedoStack([]); // 새 획을 그으면 Redo 스택 초기화
    }
    currentPointsRef.current = [];
  };

  // 🌟 실행 취소 (Undo)
  const handleUndo = () => {
    if (strokes.length === 0) return;
    triggerHaptic(15);
    const last = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, last]);
    setStrokes(prev => prev.slice(0, -1));
  };

  // 🌟 다시 실행 (Redo)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    triggerHaptic(15);
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, last]);
  };

  // 🌟 전체 지우기 (Clear)
  const handleClearAll = () => {
    if (strokes.length === 0) return;
    if (!window.confirm('필기한 모든 내용을 지우시겠습니까?')) return;
    triggerHaptic(30);
    setStrokes([]);
    setRedoStack([]);
    localStorage.removeItem('gt_general_note_vector_strokes_v3');
  };

  // 🌟 이미지로 저장 / 다운로드 (고해상도 배경 합성)
  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    triggerHaptic(20);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 1. 선택된 용지 배경 채우기
    ctx.fillStyle = isDark ? '#121214' : '#FDFCF7';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. 벡터 선 그리기
    ctx.scale(dpr, dpr);
    strokes.forEach(s => renderStroke(ctx, s, isDark));

    // 3. 파일 다운로드 트리거
    const link = document.createElement('a');
    link.download = `묵상노트_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const colorPalette = [
    { id: 'black', color: '#1E293B' },
    { id: 'red', color: '#EF4444' },
    { id: 'orange', color: '#F97316' },
    { id: 'yellow', color: '#EAB308' },
    { id: 'green', color: '#10B981' },
    { id: 'blue', color: '#0EA5E9' },
    { id: 'purple', color: '#8B5CF6' },
  ];

  const tools = [
    { id: 'pen', icon: <IconPen />, label: '볼펜' },
    { id: 'pencil', icon: <IconPencil />, label: '연필' },
    { id: 'marker', icon: <IconMarker />, label: '마커' },
    { id: 'brush', icon: <IconBrush />, label: '수채화 붓' },
    { id: 'highlighter', icon: <IconHighlighter />, label: '형광펜' },
    { id: 'eraser', icon: <IconEraser />, label: '지우개' },
  ];

  // 용지 배경 CSS
  const getPaperBackgroundStyle = () => {
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.14)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    switch (paperStyle) {
      case 'dot':
        return {
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '22px 22px'
        };
      case 'line':
        return {
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`,
          backgroundSize: '100% 28px'
        };
      case 'grid':
        return {
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        };
      case 'blank':
      default:
        return {};
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bgApp} overflow-hidden select-none touch-none`}>
      
      {/* 1. 상단 프로 헤더 */}
      <header className={`shrink-0 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b ${ui.border} bg-white/70 dark:bg-[#121214]/80 backdrop-blur-md z-30`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setActiveScreen('home')} 
            className={`p-1.5 rounded-lg ${ui.textSub} hover:${ui.textMain} hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0`}
            title="홈으로 돌아가기"
          >
            <IconArrowLeft />
          </button>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-[15px] sm:text-[16px] font-black tracking-tight ${ui.textMain} truncate`}>
                자유 노트 스케치북
              </h1>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-bold border border-indigo-500/20 shrink-0 hidden sm:inline-block">
                SMOOTH VECTOR 60FPS
              </span>
            </div>
            <span className={`text-[10.5px] font-medium ${ui.textSub} truncate hidden sm:block`}>
              2차 베지에 곡선 스무딩 & 고해상도 안티에일리어싱 필기 엔진
            </span>
          </div>
        </div>

        {/* 우측 보조 컨트롤 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 용지 스타일 선택기 */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/10 text-[10.5px] font-bold">
            {['dot', 'line', 'grid', 'blank'].map((p) => (
              <button
                key={p}
                onClick={() => { triggerHaptic(10); setPaperStyle(p); }}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  paperStyle === p
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {p === 'dot' ? '도트' : p === 'line' ? '유선' : p === 'grid' ? '모눈' : '무지'}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportImage}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-all ml-1"
            title="PNG 이미지로 다운로드"
          >
            <IconDownload />
            <span className="hidden md:inline">내보내기</span>
          </button>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-1.5 rounded-lg ${ui.textSub} hover:${ui.textMain} md:hidden cursor-pointer ml-0.5`}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 2. 능동형 모바일 최적화 툴바 (애플 메모 규격 원줄 가로 스크롤) */}
      <div className={`shrink-0 w-full ${ui.bgToolbar} border-b ${ui.border} px-2.5 py-1.5 z-20 flex items-center gap-2 sm:gap-3 overflow-x-auto hide-scrollbar flex-nowrap shadow-xs`}>
        
        {/* 브러시 도구 6종 */}
        <div className="flex items-center gap-1 shrink-0">
          {tools.map(t => (
            <button 
              key={t.id}
              onClick={() => { triggerHaptic(10); setCurrentTool(t.id); }} 
              className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTool === t.id ? ui.activeTool : ui.inactiveTool
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

        {/* 굵기 조절 슬라이더 */}
        <div className="flex items-center gap-1.5 shrink-0 px-1">
          <span className={`text-[10.5px] font-mono font-bold ${ui.textSub}`}>
            {strokeWidth.toFixed(1)}px
          </span>
          <input 
            type="range" min="1" max="24" step="0.5"
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(Number(e.target.value))} 
            className="w-16 sm:w-24 accent-indigo-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg" 
          />
        </div>

        <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

        {/* 7색 시네마 팔레트 */}
        <div className="flex items-center gap-1.5 shrink-0 px-1">
          {colorPalette.map(c => (
            <button
              key={c.id}
              onClick={() => { triggerHaptic(10); setStrokeColor(c.color); }}
              style={{ backgroundColor: c.color }}
              className={`w-5 h-5 rounded-full transition-all cursor-pointer shadow-xs ${
                strokeColor === c.color 
                  ? 'scale-125 ring-2 ring-offset-2 ring-offset-transparent ring-indigo-500' 
                  : 'opacity-80 hover:opacity-100 hover:scale-110'
              }`}
            />
          ))}
        </div>

        <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

        {/* 액션 버튼 (Undo, Redo, Clear) */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={handleUndo} 
            disabled={strokes.length === 0}
            className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${ui.inactiveTool}`} 
            title="실행 취소 (Undo)"
          >
            <IconUndo />
          </button>

          <button 
            onClick={handleRedo} 
            disabled={redoStack.length === 0}
            className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${ui.inactiveTool}`} 
            title="다시 실행 (Redo)"
          >
            <IconRedo />
          </button>

          <button 
            onClick={handleClearAll} 
            disabled={strokes.length === 0}
            className={`p-2 rounded-xl transition-all cursor-pointer hover:!text-rose-500 hover:!bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none ${ui.inactiveTool}`} 
            title="전체 지우기"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* 3. 메인 뷰포트: 전천후 스무딩 드로잉 캔버스 */}
      <div 
        ref={containerRef} 
        style={getPaperBackgroundStyle()}
        className="flex-1 relative w-full h-full overflow-hidden touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: 'none' }}
          className="absolute inset-0 z-10 w-full h-full touch-none"
        />
      </div>

    </div>
  );
}
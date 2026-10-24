import React, { useRef, useEffect, useState } from 'react';
import { safeParse, parseBibleRefExt, cleanText, getKoName } from '../utils/helpers';

export const SubPageHeader = ({ title, onBack, t, isSp=false, spTitle="", spDesc="", toggleSidebar }) => {
  if (isSp) return (
    <div className={`px-4 py-4 z-30 shrink-0 flex items-center gap-3 relative shadow-md bg-gradient-to-r from-indigo-700 to-[#9CB4D8]`}>
      {toggleSidebar && <button onClick={toggleSidebar} className="p-1 text-white text-2xl hover:opacity-80 transition-opacity">☰</button>}
      <button onClick={onBack} className="text-white text-2xl font-black p-1 hover:-translate-x-1 transition-transform pointer-events-auto">&larr;</button>
      <div className="flex flex-col"><h1 className="text-lg font-extrabold text-white leading-tight">{spTitle}</h1><p className="text-[11px] text-blue-100 font-semibold leading-none mt-0.5">{spDesc}</p></div>
    </div>
  );
  return (
    <div className={`${t.cardBg} px-5 py-4 z-30 shrink-0 flex items-center gap-3 relative border-b ${t.border} shadow-sm`}>
      {toggleSidebar && <button onClick={toggleSidebar} className={`p-1 text-2xl mr-1 hover:text-blue-500 transition-colors ${t.textMain}`}>☰</button>}
      <button onClick={onBack} className={`${t.textMain} text-2xl font-black p-1 hover:-translate-x-1 transition-transform pointer-events-auto`}>&larr;</button>
      <h1 className={`text-lg font-extrabold ${t.textMain} tracking-tight`}>{title}</h1>
    </div>
  );
};

export const RichTextEditor = ({ value, onChange, placeholder, t, isSp, bibles }) => {
    const editorRef = useRef(null);
    useEffect(() => { const s = value || ''; if (editorRef.current && editorRef.current.innerHTML !== s) editorRef.current.innerHTML = s; }, [value]);
    const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
    const exec = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current.focus(); handleInput(); };
    const insertTable = () => { const bColor = isSp ? '#cbd5e1' : (t.appBg.includes('0f172a') ? '#475569' : '#94a3b8'); exec('insertHTML', `<table style="width:100%; border-collapse:collapse; margin:10px 0;"><tbody><tr><td style="padding:8px; border:1px solid ${bColor};">내용</td><td style="padding:8px; border:1px solid ${bColor};">내용</td></tr><tr><td style="padding:8px; border:1px solid ${bColor};">내용</td><td style="padding:8px; border:1px solid ${bColor};">내용</td></tr></tbody></table><p><br></p>`); };
    const handleEditorClick = (e) => { if (e.target.classList.contains('delete-bible-btn')) { const block = e.target.closest('.bible-block'); if (block) { block.remove(); handleInput(); } } };
    const handleKeyDown = (e) => {
        try {
            if (e.key === ' ' || e.key === 'Enter') {
                const sel = window.getSelection(); if (!sel.rangeCount) return; const range = sel.getRangeAt(0); const node = range.startContainer;
                if (node.nodeType === 3) {
                    const text = node.textContent.substring(0, range.startOffset);
                    const match = text.match(/([가-힣0-9]+)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?(?:\s?(?:~|-)\s?(?:(\d+)(?:장|:))?\s?(?:(\d+)(?:절)?)?)?$/);
                    if (match) {
                        const p = parseBibleRefExt(match[0].trim());
                        if (p && p.eb) {
                            const bD = bibles.find(b => b.name === p.eb);
                            if (bD) {
                                let vsHtml = '';
                                for (let c = p.c1; c <= p.c2; c++) {
                                    const chD = bD.chapters[c - 1]; if (!chD) continue;
                                    const sIdx = (c === p.c1) ? p.v1 - 1 : 0; const eIdx = (c === p.c2) ? (p.v2 === 999 ? chD.length - 1 : p.v2 - 1) : chD.length - 1;
                                    for (let i = sIdx; i <= eIdx; i++) { if (chD[i]) vsHtml += `<div style="display:flex; gap:12px; padding:12px; border-radius:12px; margin-bottom:4px; background:rgba(148, 163, 184, 0.1);"><span style="font-weight:bold; color:#4f46e5; min-width:24px;">${i + 1}</span><span style="color:inherit;">${cleanText(chD[i])}</span></div>`; }
                                }
                                if (vsHtml) {
                                    e.preventDefault();
                                    node.textContent = text.substring(0, text.length - match[0].length) + node.textContent.substring(range.startOffset);
                                    const newRange = document.createRange(); newRange.setStart(node, text.length - match[0].length); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange);
                                    const blockBorder = isSp ? '#cbd5e1' : '#94a3b8';
                                    const blockHtml = `<div class="bible-block" contenteditable="false" style="margin:16px 0; position:relative; border:1px solid ${blockBorder}; border-radius:12px; padding:12px; background:rgba(148, 163, 184, 0.05);"><button class="delete-bible-btn" style="position:absolute; top:8px; right:8px; background:#fee2e2; color:#ef4444; border:none; border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer; font-weight:bold; z-index:10; box-shadow:0 1px 2px rgba(0,0,0,0.1);">❌ 삭제</button><div style="font-weight:800; color:#1e293b; margin-bottom:8px; padding-left:4px;">📖 ${getKoName(p.eb)} ${p.c1}장</div>${vsHtml}</div><p><br></p>`;
                                    document.execCommand('insertHTML', false, blockHtml);
                                }
                            }
                        }
                    }
                }
            }
        } catch(err) { console.error(err); }
    };
    return (
        <div className={`flex flex-col border rounded-2xl overflow-hidden w-full ${isSp ? 'bg-white/90 border-white/40' : `${t.appBg} ${t.border}`} shadow-inner min-h-[300px] h-full`}>
            <div className={`flex flex-wrap gap-1 p-2 border-b ${isSp ? 'border-white/40 bg-white/50' : `${t.border} ${t.cardBg}`} items-center sticky top-0 z-10`}>
                <button onClick={()=>exec('bold')} className={`px-2 py-1 font-extrabold rounded ${t.textMain} hover:bg-black/5 text-sm`}>B</button>
                <button onClick={()=>exec('underline')} className={`px-2 py-1 underline font-bold rounded ${t.textMain} hover:bg-black/5 text-sm`}>U</button><div className="w-px h-4 bg-slate-300 mx-1"></div>
                <select onChange={(e)=>exec('fontSize', e.target.value)} className={`px-2 py-1 text-sm font-bold rounded border outline-none ${t.inputBg} ${t.textMain}`}><option value="3">본문크기</option><option value="1">작게</option><option value="5">크게</option><option value="6">제목크기</option></select><div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={()=>exec('justifyLeft')} className={`px-2 py-1 rounded ${t.textMain} hover:bg-black/5 text-xs font-bold`}>좌측</button>
                <button onClick={()=>exec('justifyCenter')} className={`px-2 py-1 rounded ${t.textMain} hover:bg-black/5 text-xs font-bold`}>가운데</button>
                <button onClick={()=>exec('justifyRight')} className={`px-2 py-1 rounded ${t.textMain} hover:bg-black/5 text-xs font-bold`}>우측</button><div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={insertTable} className={`px-2 py-1 rounded hover:bg-blue-50 text-xs font-bold text-blue-600`}>⊞ 표삽입</button>
            </div>
            <div ref={editorRef} contentEditable={true} suppressContentEditableWarning={true} onInput={handleInput} onBlur={handleInput} onKeyDown={handleKeyDown} onClick={handleEditorClick} className={`p-5 flex-1 outline-none text-[15px] overflow-y-auto h-full ${isSp?'text-slate-800':t.textMain} break-words note-lines`} placeholder={placeholder} style={{ minHeight: '300px' }} />
        </div>
    );
};

export function CanvasEngine({ saveKey, width = 800, height = 1500, tool, color, size, children, t }) {
  const penRef = useRef(null); const highRef = useRef(null); const tempRef = useRef(null); const containerRef = useRef(null); 
  const [isDraw, setIsDraw] = useState(false);
  const startPos = useRef({x:0, y:0}); const currentPath = useRef([]);
  const lasso = useRef({ phase: 0, sx: 0, sy: 0, rx: 0, ry: 0, rw: 0, rh: 0, imgData: null });

  useEffect(() => {
    const syncCanvasSize = () => {
      const c = containerRef.current; if (!c) return; 
      const w = c.scrollWidth || window.innerWidth; const h = Math.max(c.scrollHeight, height);
      [penRef.current, highRef.current, tempRef.current].forEach(cv => { 
          if(!cv) return;
          if (cv.width !== w*2 || cv.height !== h*2) {
              cv.width = w*2; cv.height = h*2; cv.style.width = `${w}px`; cv.style.height = `${h}px`; 
              const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2); ctx.lineCap='round'; ctx.lineJoin='round'; 
          }
      });
      const saved = safeParse(`draw_${saveKey}`, {});
      if (saved.pen && penRef.current) { const img = new Image(); img.src = saved.pen; img.onload = () => { if(penRef.current) penRef.current.getContext('2d').drawImage(img, 0, 0, w, h); }; }
    };
    syncCanvasSize(); setTimeout(syncCanvasSize, 100);
    const ro = new ResizeObserver(syncCanvasSize); if(containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [saveKey, width, height]);

  const saveDrawing = () => { try { if(penRef.current) localStorage.setItem(`draw_${saveKey}`, JSON.stringify({ pen: penRef.current.toDataURL() })); } catch(e) {} };
  
  const start = (e) => { 
      if (tool==='hand' || e.target.closest('.ignore-draw')) return; e.preventDefault(); 
      const r = containerRef.current.getBoundingClientRect(); const x = e.clientX - r.left + (containerRef.current.scrollLeft || 0); const y = e.clientY - r.top + (containerRef.current.scrollTop || 0);
      startPos.current = {x, y}; currentPath.current = [{x, y}];
      if (tool === 'lasso') {
          if (lasso.current.phase === 2 && x >= lasso.current.rx && x <= lasso.current.rx + lasso.current.rw && y >= lasso.current.ry && y <= lasso.current.ry + lasso.current.rh) { lasso.current.sx = x; lasso.current.sy = y; lasso.current.phase = 3; } 
          else { if(lasso.current.phase === 2 && lasso.current.imgData) { try { penRef.current.getContext('2d').putImageData(lasso.current.imgData, lasso.current.rx*2, lasso.current.ry*2); saveDrawing(); } catch(err){} } lasso.current = { phase: 1, sx: x, sy: y, rx: 0, ry: 0, rw: 0, rh: 0, imgData: null }; tempRef.current.getContext('2d').clearRect(0,0, tempRef.current.width, tempRef.current.height); }
      }
      setIsDraw(true); 
  };

  const draw = (e) => { 
      if (!isDraw || tool==='hand') return; e.preventDefault(); 
      const r = containerRef.current.getBoundingClientRect(); const x = e.clientX - r.left + (containerRef.current.scrollLeft || 0); const y = e.clientY - r.top + (containerRef.current.scrollTop || 0);
      const pCtx = penRef.current.getContext('2d'); const hCtx = highRef.current.getContext('2d'); const tCtx = tempRef.current.getContext('2d');
      if (tool === 'eraser') {
          pCtx.globalCompositeOperation = 'destination-out'; pCtx.lineWidth = size * 5; pCtx.beginPath(); pCtx.moveTo(startPos.current.x, startPos.current.y); pCtx.lineTo(x, y); pCtx.stroke();
          hCtx.globalCompositeOperation = 'destination-out'; hCtx.lineWidth = size * 5; hCtx.beginPath(); hCtx.moveTo(startPos.current.x, startPos.current.y); hCtx.lineTo(x, y); hCtx.stroke();
          startPos.current = {x, y};
      } else if (tool === 'lasso') {
          if (lasso.current.phase === 1) { tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); tCtx.setLineDash([5,5]); tCtx.strokeStyle = '#3b82f6'; tCtx.lineWidth = 2; tCtx.strokeRect(lasso.current.sx, lasso.current.sy, x - lasso.current.sx, y - lasso.current.sy); tCtx.setLineDash([]); } 
          else if (lasso.current.phase === 3) { const dx = x - lasso.current.sx; const dy = y - lasso.current.sy; tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); if(lasso.current.imgData) tCtx.putImageData(lasso.current.imgData, (lasso.current.rx + dx)*2, (lasso.current.ry + dy)*2); tCtx.setLineDash([5,5]); tCtx.strokeStyle = '#3b82f6'; tCtx.lineWidth = 2; tCtx.strokeRect(lasso.current.rx + dx, lasso.current.ry + dy, lasso.current.rw, lasso.current.rh); tCtx.setLineDash([]); }
      } else if (tool === 'arrow') {
          tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); tCtx.strokeStyle = color; tCtx.lineWidth = size; tCtx.setLineDash([5, 5]);
          const dx = x - startPos.current.x; const dy = y - startPos.current.y; let cp1x, cp1y, cp2x, cp2y;
          if (Math.abs(dx) > Math.abs(dy)) { cp1x = startPos.current.x + dx/2; cp1y = startPos.current.y; cp2x = startPos.current.x + dx/2; cp2y = y; } else { cp1x = startPos.current.x; cp1y = startPos.current.y + dy/2; cp2x = x; cp2y = startPos.current.y + dy/2; }
          const endAngle = Math.atan2(y - cp2y, x - cp2x); const headlen = size * 3 + 12; const tipX = x; const tipY = y; const baseX = tipX - headlen * Math.cos(endAngle); const baseY = tipY - headlen * Math.sin(endAngle);
          tCtx.beginPath(); tCtx.moveTo(startPos.current.x, startPos.current.y); tCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, baseX, baseY); tCtx.stroke(); tCtx.setLineDash([]);
          tCtx.beginPath(); tCtx.fillStyle = color; tCtx.moveTo(tipX, tipY); tCtx.lineTo(tipX - headlen * Math.cos(endAngle - Math.PI / 7), tipY - headlen * Math.sin(endAngle - Math.PI / 7)); tCtx.lineTo(tipX - headlen * Math.cos(endAngle + Math.PI / 7), tipY - headlen * Math.sin(endAngle + Math.PI / 7)); tCtx.fill();
      } else {
          const lastPoint = currentPath.current[currentPath.current.length - 1]; currentPath.current.push({x, y});
          if (tool === 'chalk') {
              pCtx.fillStyle = color; const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y); const steps = Math.max(1, Math.ceil(dist / 2));
              for (let i=0; i<=steps; i++) { const px = lastPoint.x + (x - lastPoint.x) * (i/steps); const py = lastPoint.y + (y - lastPoint.y) * (i/steps); for (let j=0; j<size*3; j++) { const rx = px + (Math.random() - 0.5) * size * 2.5; const ry = py + (Math.random() - 0.5) * size * 2.5; if(Math.random() > 0.3) pCtx.fillRect(rx, ry, 1, 1); } }
          } else if (tool === 'fountain') {
              pCtx.fillStyle = color; pCtx.globalAlpha = 0.9; const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y); const steps = Math.max(1, Math.ceil(dist / 2));
              for (let i=0; i<=steps; i++) { const px = lastPoint.x + (x - lastPoint.x) * (i/steps); const py = lastPoint.y + (y - lastPoint.y) * (i/steps); pCtx.beginPath(); pCtx.ellipse(px, py, size * 0.8, size * 0.2, Math.PI / 4, 0, 2 * Math.PI); pCtx.fill(); }
          } else if (tool === 'pencil') {
              pCtx.strokeStyle = color; pCtx.lineWidth = Math.max(1, size * 0.3); pCtx.globalAlpha = 0.6; pCtx.beginPath(); pCtx.moveTo(lastPoint.x, lastPoint.y); pCtx.lineTo(x, y); pCtx.stroke();
              pCtx.beginPath(); pCtx.moveTo(lastPoint.x+Math.random()*2, lastPoint.y+Math.random()*2); pCtx.lineTo(x+Math.random()*2, y+Math.random()*2); pCtx.globalAlpha = 0.2; pCtx.stroke();
          } else if (tool === 'signpen') {
              pCtx.strokeStyle = color; pCtx.lineWidth = size * 1.5; pCtx.globalAlpha = 1.0; pCtx.lineCap = 'round'; pCtx.lineJoin = 'round'; pCtx.beginPath(); pCtx.moveTo(lastPoint.x, lastPoint.y); pCtx.lineTo(x, y); pCtx.stroke();
          } else if (tool === 'highlighter') {
              hCtx.strokeStyle = color; hCtx.lineWidth = size * 3.5; hCtx.globalAlpha = 0.15; hCtx.lineCap = 'butt'; hCtx.lineJoin = 'round'; hCtx.globalCompositeOperation = 'multiply'; hCtx.beginPath(); hCtx.moveTo(lastPoint.x, lastPoint.y); hCtx.lineTo(x, y); hCtx.stroke();
          } else {
              pCtx.strokeStyle = color; pCtx.lineWidth = size; pCtx.globalAlpha = 1.0; pCtx.lineCap = 'round'; pCtx.lineJoin = 'round'; pCtx.beginPath(); pCtx.moveTo(lastPoint.x, lastPoint.y); pCtx.lineTo(x, y); pCtx.stroke();
          }
      }
  };

  const end = (e) => {
      if(!isDraw) return; setIsDraw(false); const r = containerRef.current.getBoundingClientRect(); const x = e.clientX - r.left + (containerRef.current.scrollLeft || 0); const y = e.clientY - r.top + (containerRef.current.scrollTop || 0);
      const pCtx = penRef.current.getContext('2d'); const tCtx = tempRef.current.getContext('2d');
      if (tool === 'lasso') {
          if (lasso.current.phase === 1) {
              const rw = Math.abs(x - lasso.current.sx); const rh = Math.abs(y - lasso.current.sy);
              if (rw > 10 && rh > 10) { const rx = Math.min(x, lasso.current.sx); const ry = Math.min(y, lasso.current.sy); const imgData = pCtx.getImageData(rx*2, ry*2, rw*2, rh*2); pCtx.clearRect(rx, ry, rw, rh); lasso.current = { phase: 2, sx: 0, sy: 0, rx, ry, rw, rh, imgData }; tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); tCtx.putImageData(imgData, rx*2, ry*2); tCtx.setLineDash([5,5]); tCtx.strokeStyle = '#3b82f6'; tCtx.lineWidth = 2; tCtx.strokeRect(rx, ry, rw, rh); tCtx.setLineDash([]); } else { lasso.current.phase = 0; tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); }
          } else if (lasso.current.phase === 3) {
              const dx = x - lasso.current.sx; const dy = y - lasso.current.sy; lasso.current.rx += dx; lasso.current.ry += dy; lasso.current.phase = 2; tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); if(lasso.current.imgData) tCtx.putImageData(lasso.current.imgData, lasso.current.rx*2, lasso.current.ry*2); tCtx.setLineDash([5,5]); tCtx.strokeStyle = '#3b82f6'; tCtx.lineWidth = 2; tCtx.strokeRect(lasso.current.rx, lasso.current.ry, lasso.current.rw, lasso.current.rh); tCtx.setLineDash([]);
          }
      } else if(tool === 'arrow') { 
          const dx = x - startPos.current.x; const dy = y - startPos.current.y; let cp1x, cp1y, cp2x, cp2y;
          if (Math.abs(dx) > Math.abs(dy)) { cp1x = startPos.current.x + dx/2; cp1y = startPos.current.y; cp2x = startPos.current.x + dx/2; cp2y = y; } else { cp1x = startPos.current.x; cp1y = startPos.current.y + dy/2; cp2x = x; cp2y = startPos.current.y + dy/2; }
          const endAngle = Math.atan2(y - cp2y, x - cp2x); const headlen = size * 3 + 12; const tipX = x; const tipY = y; const baseX = tipX - headlen * Math.cos(endAngle); const baseY = tipY - headlen * Math.sin(endAngle);
          pCtx.strokeStyle = color; pCtx.lineWidth = size; pCtx.setLineDash([5, 5]); pCtx.beginPath(); pCtx.moveTo(startPos.current.x, startPos.current.y); pCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, baseX, baseY); pCtx.stroke(); pCtx.setLineDash([]);
          pCtx.beginPath(); pCtx.fillStyle = color; pCtx.moveTo(tipX, tipY); pCtx.lineTo(tipX - headlen * Math.cos(endAngle - Math.PI / 7), tipY - headlen * Math.sin(endAngle - Math.PI / 7)); pCtx.lineTo(tipX - headlen * Math.cos(endAngle + Math.PI / 7), tipY - headlen * Math.sin(endAngle + Math.PI / 7)); pCtx.fill(); tCtx.clearRect(0,0, tempRef.current.width, tempRef.current.height); saveDrawing();
      } else { saveDrawing(); }
  };
  
  return (
    <div ref={containerRef} className={`relative flex-1 ${t.pageBg} overflow-y-auto scroll-smooth hide-scrollbar transition-colors duration-300 pointer-events-auto w-full`}>
      <div className="relative w-full h-full min-h-[1500px]">
        <div className="relative z-0 w-full h-full pb-[200px] flex flex-col">{children}</div>
        <canvas ref={highRef} className={`qt-high-canvas absolute top-0 left-0 opacity-100 mix-blend-multiply z-10 ${tool === 'hand' ? 'pointer-events-none' : 'touch-none'}`} />
        <canvas ref={penRef} className={`qt-pen-canvas absolute top-0 left-0 z-20 ${tool === 'hand' ? 'pointer-events-none' : 'touch-none cursor-crosshair'}`} onPointerDown={start} onPointerMove={draw} onPointerUp={end} onPointerLeave={end} />
        <canvas ref={tempRef} className={`absolute top-0 left-0 z-30 pointer-events-none`} />
      </div>
    </div>
  );
}
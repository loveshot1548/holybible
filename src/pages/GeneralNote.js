// src/pages/GeneralNote.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

// =====================================================================
// ✒️ 하이엔드 아카데믹 라인 아이콘
// =====================================================================
const StrokeW = "2.2";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconUndo = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const IconRedo = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

// =====================================================================
// 🎨 물리 텍스처 기반 리얼 브러시 엔진 (만년필 / 연필 / 목탄 / 붓펜 / 볼펜 / 직선자)
// =====================================================================
const resolveAdaptiveColor = (color, isDark) => {
  if (!color) return isDark ? '#F8FAFC' : '#1E293B';
  const upper = color.toUpperCase();
  if (isDark && (upper === '#1E293B' || upper === '#111827' || upper === '#000000')) {
    return '#F8FAFC';
  }
  if (!isDark && (upper === '#F8FAFC' || upper === '#FFFFFF')) {
    return '#1E293B';
  }
  return color;
};

export const renderRealTextureStroke = (ctx, stroke, isDark) => {
  const { tool, color, size = 3.5, points, isRulerLine } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const resolvedColor = resolveAdaptiveColor(color, isDark);

  // ── 1) 지우개 (Eraser) ──
  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = Math.max(12, size * 5.5);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── 2) 직선 자 모드 (Ruler Snap Line) ──
  if (isRulerLine && points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    ctx.strokeStyle = resolvedColor;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── 3) 만년필 (Calligraphy Fountain Pen — 45도 닙 각도 & 필속 감응 굵기) ──
  if (tool === 'fountain') {
    ctx.strokeStyle = resolvedColor;
    ctx.fillStyle = resolvedColor;
    const baseW = Math.max(1.4, size * 1.15);

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, baseW / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const nibFactor = 0.42 + 0.78 * Math.abs(Math.sin(angle - Math.PI / 4));
      const speedFactor = Math.max(0.55, Math.min(1.35, 1.28 - dist * 0.025));
      const w = baseW * nibFactor * speedFactor;

      ctx.beginPath();
      ctx.lineWidth = w;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // ── 4) 미술 연필 (Graphite Pencil — 종이 요철에 긁히는 실제 흑연 입자 텍스처) ──
  if (tool === 'pencil') {
    ctx.fillStyle = resolvedColor;
    ctx.strokeStyle = resolvedColor;
    const baseR = Math.max(1.2, size * 0.75);

    ctx.globalAlpha = 0.35;
    ctx.lineWidth = baseR * 0.85;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const steps = Math.max(1, Math.ceil(dist / 1.5));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;

        for (let g = 0; g < 3; g++) {
          const seed = Math.sin(cx * 12.9898 + cy * 78.233 + s + g * 17) * 43758.5453;
          const r1 = seed - Math.floor(seed);
          const r2 = (seed * 1.9) - Math.floor(seed * 1.9);
          const ox = (r1 - 0.5) * baseR * 2.2;
          const oy = (r2 - 0.5) * baseR * 2.2;

          ctx.globalAlpha = 0.18 + r1 * 0.38;
          ctx.fillRect(cx + ox, cy + oy, 1.3, 1.3);
        }
      }
    }
    ctx.restore();
    return;
  }

  // ── 5) 목탄 / 크레용 (Charcoal / Crayon — 거친 드라이 브러시 파스텔 질감) ──
  if (tool === 'charcoal' || tool === 'marker') {
    ctx.fillStyle = resolvedColor;
    const spreadW = Math.max(4, size * 2.1);

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const steps = Math.max(1, Math.ceil(dist / 2));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;

        for (let b = 0; b < 6; b++) {
          const seed = Math.sin((cx + b * 11) * 29.17 + (cy - b * 7) * 53.11) * 10000;
          const r1 = seed - Math.floor(seed);
          const r2 = (seed * 2.3) - Math.floor(seed * 2.3);
          const ox = (r1 - 0.5) * spreadW;
          const oy = (r2 - 0.5) * spreadW;

          ctx.globalAlpha = 0.15 + r1 * 0.28;
          ctx.beginPath();
          ctx.arc(cx + ox, cy + oy, Math.max(1.1, size * 0.38), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    return;
  }

  // ── 6) 수채 붓펜 (Watercolor Brush Pen — 필압 테이퍼링 붓터치) ──
  if (tool === 'brush') {
    ctx.strokeStyle = resolvedColor;
    ctx.shadowColor = resolvedColor;
    ctx.shadowBlur = size * 0.6;
    const maxW = Math.max(2.5, size * 1.85);
    const total = points.length;

    if (total === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, maxW / 2, 0, Math.PI * 2);
      ctx.fillStyle = resolvedColor;
      ctx.fill();
      ctx.restore();
      return;
    }

    for (let i = 1; i < total; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const progress = i / total;
      const taper = Math.sin(progress * Math.PI);
      ctx.lineWidth = Math.max(1.1, maxW * (0.3 + 0.85 * taper));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // ── 7) 시그니처 볼펜 (Smooth Ballpoint Pen — 2차 베지에 곡선 스무딩) ──
  ctx.strokeStyle = resolvedColor;
  ctx.lineWidth = size;
  ctx.globalAlpha = 1.0;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = resolvedColor;
    ctx.fill();
    ctx.restore();
    return;
  }

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

// =====================================================================
// 🖍️ [무중첩 형광펜 전용 렌더러]
// =====================================================================
export const renderHighlighterPath = (ctx, stroke) => {
  const { color, size = 4, points } = stroke;
  if (!points || points.length === 0) return;

  const hlColor = (!color || color === '#1E293B' || color === '#111827') ? '#FACC15' : color;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = hlColor;
  ctx.fillStyle = hlColor;
  ctx.lineWidth = Math.max(14, size * 4.5);
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.fillRect(points[0].x - 3, points[0].y - ctx.lineWidth / 2, 6, ctx.lineWidth);
    ctx.restore();
    return;
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

// =====================================================================
// 🖋️ iPadOS PencilKit 급 초정밀 3D 셰이딩 SVG 필기구 렌더러
// (원통형 입체 명암, 금속 반사광, 실제 펜촉 디테일 100% 재현)
// =====================================================================
const RealisticPencilKitSVG = ({ type, activeColor }) => {
  return (
    <svg
      viewBox="0 0 28 84"
      className="w-[24px] sm:w-[27px] h-[72px] overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.16)] select-none pointer-events-none"
    >
      <defs>
        {/* 공통 3D 원통형 화이트/실버 바디 그라데이션 */}
        <linearGradient id="pkBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E4E4E7" />
          <stop offset="28%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#F4F4F5" />
          <stop offset="92%" stopColor="#D4D4D8" />
          <stop offset="100%" stopColor="#A1A1AA" />
        </linearGradient>

        {/* 금속 크롬 닙(만년필/볼펜 캡) 그라데이션 */}
        <linearGradient id="pkChromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="35%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* 연필 나무 결 원추형 그라데이션 */}
        <linearGradient id="pkWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4A373" />
          <stop offset="35%" stopColor="#FAEDCD" />
          <stop offset="75%" stopColor="#E0A96D" />
          <stop offset="100%" stopColor="#BC8A5F" />
        </linearGradient>

        {/* 지우개 핑크 러버 3D 그라데이션 */}
        <linearGradient id="pkPinkRubber" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="30%" stopColor="#FBCFE8" />
          <stop offset="70%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>

        {/* 반투명 아크릴 자 그라데이션 */}
        <linearGradient id="pkRulerGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.88)" />
          <stop offset="50%" stopColor="rgba(241,245,249,0.95)" />
          <stop offset="100%" stopColor="rgba(203,213,225,0.85)" />
        </linearGradient>
      </defs>

      {/* 1. 형광펜 (Chisel Tip Highlighter) */}
      {type === 'highlighter' && (
        <g>
          {/* 사선 치즐 팁 */}
          <path d="M9 14 L19 9 L20 22 L8 22 Z" fill={activeColor} />
          <path d="M9 14 L13 12 L13.5 22 L8 22 Z" fill="rgba(255,255,255,0.35)" />
          {/* 팁 홀더 넥 */}
          <path d="M7 22 L21 22 L22.5 29 L5.5 29 Z" fill="#D4D4D8" />
          {/* 두꺼운 원통형 바디 */}
          <rect x="4.5" y="28" width="19" height="56" rx="2" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          {/* 컬러 캡슐 링 */}
          <rect x="7.5" y="36" width="13" height="5.5" rx="2.75" fill={activeColor} />
          <rect x="7.5" y="36" width="13" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
        </g>
      )}

      {/* 2. 지우개 (Pink Rubber Eraser) */}
      {type === 'eraser' && (
        <g>
          {/* 핑크 고무 헤드 */}
          <path d="M5 32 C5 26, 23 26, 23 32 L23 48 L5 48 Z" fill="url(#pkPinkRubber)" />
          <path d="M7 29.5 C10 27.5, 18 27.5, 21 29.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* 메탈 밴드 */}
          <rect x="4.5" y="46" width="19" height="3" fill="#CBD5E1" />
          {/* 화이트 슬리브 바디 */}
          <rect x="4.5" y="48" width="19" height="36" rx="1.5" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          <rect x="8" y="56" width="12" height="2.5" rx="1.2" fill="#E4E4E7" />
        </g>
      )}

      {/* 3. 미술 연필 (Graphite Wood Pencil) */}
      {type === 'pencil' && (
        <g>
          {/* 깎인 나무 원추 */}
          <path d="M14 9 L21.5 29 L6.5 29 Z" fill="url(#pkWoodGrad)" />
          {/* 흑연 심 (뾰족한 팁) */}
          <path d="M14 9 L16.8 16.5 C15 17.5, 13 17.5, 11.2 16.5 Z" fill={activeColor} />
          <path d="M14 9 L14.8 16.8 L12.5 16.5 Z" fill="rgba(255,255,255,0.28)" />
          {/* 물결형 나무 경계선 */}
          <path d="M6.5 29 Q10.2 27.2 14 29 Q17.8 27.2 21.5 29 L21.5 84 L6.5 84 Z" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          {/* 컬러 띠 & 실버 링 */}
          <rect x="6.5" y="34" width="15" height="4.5" fill={activeColor} />
          <rect x="6.5" y="40" width="15" height="1.5" fill="#A1A1AA" />
        </g>
      )}

      {/* 4. 직선 자 (Precision Acrylic Ruler) */}
      {type === 'ruler' && (
        <g>
          <rect
            x="4"
            y="14"
            width="20"
            height="70"
            rx="2.5"
            fill="url(#pkRulerGlass)"
            stroke={activeColor === '#FACC15' ? '#F59E0B' : '#94A3B8'}
            strokeWidth={activeColor === '#FACC15' ? '1.5' : '0.8'}
          />
          {/* 세로 하이라이트 결 */}
          <rect x="6" y="15" width="2.5" height="68" fill="rgba(255,255,255,0.65)" />
          {/* 정밀 눈금 마킹 */}
          {[22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77].map((yPos, idx) => (
            <line
              key={yPos}
              x1="4.5"
              y1={yPos}
              x2={idx % 2 === 0 ? '13.5' : '10'}
              y2={yPos}
              stroke="#475569"
              strokeWidth={idx % 2 === 0 ? '1.3' : '0.9'}
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* 5. 시그니처 볼펜 / 파인라이너 (Precision Ballpoint Pen) */}
      {type === 'pen' && (
        <g>
          {/* 파인라이너 니들 팁 */}
          <rect x="12.8" y="9" width="2.4" height="5.5" rx="1.2" fill={activeColor} />
          {/* 메탈 팁 하우징 */}
          <path d="M11.5 14 L16.5 14 L18 22 L10 22 Z" fill="url(#pkChromeGrad)" />
          {/* 테이퍼드 콘 */}
          <path d="M10 22 L18 22 L21 31 L7 31 Z" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.4" />
          {/* 메인 원통 바디 */}
          <rect x="7" y="31" width="14" height="53" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          {/* 컬러 스트라이프 */}
          <rect x="7" y="36" width="14" height="5" fill={activeColor} />
          <rect x="7" y="42.5" width="14" height="1.5" fill={activeColor} opacity="0.6" />
          {/* 바디 광택 하이라이트 */}
          <rect x="9.5" y="31" width="2.2" height="53" fill="rgba(255,255,255,0.65)" />
        </g>
      )}

      {/* 6. 목탄 / 크레용 (Artist Crayon / Pastel) */}
      {type === 'charcoal' && (
        <g>
          {/* 뭉툭하고 부드러운 크레용 팁 */}
          <path d="M11.5 12 C12.5 10.5, 15.5 10.5, 16.5 12 L20.5 26 L7.5 26 Z" fill={activeColor} />
          <path d="M12.2 11.5 L14.5 26 L9.5 26 Z" fill="rgba(255,255,255,0.28)" />
          {/* 크레용 넥 */}
          <rect x="7.5" y="26" width="13" height="4" fill={activeColor} brightness="0.9" />
          {/* 페이퍼 랩 바디 */}
          <rect x="6.5" y="29" width="15" height="55" rx="1" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          {/* 크레용 시그니처 이중 줄무늬 */}
          <rect x="6.5" y="34" width="15" height="3.5" fill={activeColor} />
          <rect x="6.5" y="39.5" width="15" height="1.8" fill={activeColor} />
          <rect x="9" y="30" width="2.5" height="54" fill="rgba(255,255,255,0.5)" />
        </g>
      )}

      {/* 7. 만년필 (Classic Fountain Pen) */}
      {type === 'fountain' && (
        <g>
          {/* 다이아몬드 형태 메탈 만년필 촉(Nib) */}
          <path d="M14 7 L20 18 L17.5 27 L10.5 27 L8 18 Z" fill="url(#pkChromeGrad)" stroke="#475569" strokeWidth="0.5" />
          {/* 닙 슬릿(Slit) 및 숨구멍(Breather Hole) */}
          <line x1="14" y1="7.5" x2="14" y2="19" stroke="#1E293B" strokeWidth="0.9" />
          <circle cx="14" cy="19.5" r="1.4" fill="#1E293B" />
          {/* 닙 끝에 맺힌 현재 잉크 컬러 포인트 */}
          <path d="M14 7 L16.2 11.5 L11.8 11.5 Z" fill={activeColor} opacity="0.85" />
          {/* 메탈 칼라 링 */}
          <rect x="8.5" y="27" width="11" height="3.5" rx="0.8" fill="url(#pkChromeGrad)" />
          {/* 만년필 배럴 바디 */}
          <rect x="6.5" y="30" width="15" height="54" rx="1" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          {/* 잉크 컬러 인디케이터 링 */}
          <rect x="6.5" y="35" width="15" height="4.5" fill={activeColor} />
          <rect x="9" y="30" width="2.5" height="54" fill="rgba(255,255,255,0.6)" />
        </g>
      )}

      {/* 8. 수채 붓펜 (Watercolor Brush Marker) */}
      {type === 'brush' && (
        <g>
          {/* 유려하게 휘어지는 붓모(Flexible Bristle Tip) */}
          <path d="M14 7 C16.5 12, 19.5 18, 19.5 25 L8.5 25 C8.5 18, 11.5 12, 14 7 Z" fill={activeColor} />
          <path d="M14 7 C14.5 12, 15.5 18, 15.5 25 L11 25 C11 18, 12.5 12, 14 7 Z" fill="rgba(255,255,255,0.3)" />
          {/* 골드/실버 페룰(Ferrule) 링 */}
          <rect x="7.5" y="25" width="13" height="4.5" fill="url(#pkChromeGrad)" />
          {/* 붓펜 원통 바디 */}
          <rect x="6.5" y="29" width="15" height="55" rx="1.5" fill="url(#pkBodyGrad)" stroke="#D4D4D8" strokeWidth="0.5" />
          <rect x="6.5" y="34" width="15" height="6" fill={activeColor} />
          <rect x="9" y="29" width="2.5" height="55" fill="rgba(255,255,255,0.6)" />
        </g>
      )}
    </svg>
  );
};

// =====================================================================
// 🧰 두 번째 캡처(malssumgirok / iPadOS PencilKit) 스타일 입체 브러시 도구 정의
// =====================================================================
const PENCILKIT_BRUSHES = [
  { id: 'highlighter', label: '형광펜', defaultColor: '#FACC15' },
  { id: 'eraser', label: '지우개', defaultColor: '#F472B6' },
  { id: 'pencil', label: '미술연필', defaultColor: '#475569' },
  { id: 'ruler', label: '직선자', defaultColor: '#94A3B8' },
  { id: 'pen', label: '볼펜', defaultColor: '#0284C7' },
  { id: 'charcoal', label: '크레용/목탄', defaultColor: '#EF4444' },
  { id: 'fountain', label: '만년필', defaultColor: '#1E293B' },
  { id: 'brush', label: '수채붓펜', defaultColor: '#1E293B' }
];

const QUICK_DOT_COLORS = [
  '#1E293B', // 딥 블랙
  '#3B82F6', // 로얄 블루
  '#10B981', // 에메랄드 그린
  '#FACC15', // 형광 옐로우
  '#EF4444'  // 코랄 레드
];

export default function GeneralNote({ t, isDarkMode, setActiveScreen, setIsSidebarOpen, isSidebarOpen }) {
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const ui = {
    bgApp: isDark ? 'bg-[#121316]' : 'bg-[#F3F2EE]',
    textMain: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSub: isDark ? 'text-zinc-400' : 'text-zinc-500',
    border: isDark ? 'border-white/10' : 'border-stone-300/80'
  };

  const canvasRef = useRef(null);
  const hlOffscreenRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);

  const [strokes, setStrokes] = useState(() => {
    try {
      const saved = localStorage.getItem('gt_general_note_vector_strokes_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [redoStack, setRedoStack] = useState([]);

  const [currentTool, setCurrentTool] = useState('fountain');
  const [isRulerMode, setIsRulerMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#1E293B');
  const [strokeWidth, setStrokeWidth] = useState(3.5);
  const [paperStyle, setPaperStyle] = useState('line');
  const [showSizePopover, setShowSizePopover] = useState(false);

  const triggerHaptic = useCallback((pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }, []);

  // 🌟 전체 캔버스 60FPS 렌더링 (형광펜 무중첩 레이어 합성 + 일반 브러시 텍스처 합성)
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const logicalW = canvas.width / dpr;
    const logicalH = canvas.height / dpr;

    ctx.clearRect(0, 0, logicalW, logicalH);

    const allStrokes = [...strokes];
    if (currentPointsRef.current.length > 0) {
      allStrokes.push({
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        isRulerLine: isRulerMode,
        points: currentPointsRef.current
      });
    }

    // 1단계: 형광펜 스트로크들만 오프스크린 버퍼에 중첩 없이 단일 레이어로 플래트닝
    const hlStrokes = allStrokes.filter(s => s.tool === 'highlighter' || s.tool === 'eraser');
    const hasHighlighters = allStrokes.some(s => s.tool === 'highlighter');

    if (hasHighlighters) {
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

      hlStrokes.forEach(s => {
        if (s.tool === 'highlighter') {
          renderHighlighterPath(hlCtx, s);
        } else if (s.tool === 'eraser') {
          renderRealTextureStroke(hlCtx, s, isDark);
        }
      });

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      ctx.globalAlpha = isDark ? 0.45 : 0.36;
      ctx.drawImage(hlCanvas, 0, 0);
      ctx.restore();
    }

    // 2단계: 일반 필기구를 형광펜 위에 선명하게 렌더링
    allStrokes.forEach(s => {
      if (s.tool === 'highlighter') return;
      renderRealTextureStroke(ctx, s, isDark);
    });
  }, [strokes, currentTool, strokeColor, strokeWidth, isRulerMode, isDark]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

  useEffect(() => {
    try {
      localStorage.setItem('gt_general_note_vector_strokes_v3', JSON.stringify(strokes));
    } catch (_) {}
    redraw();
  }, [strokes, redraw]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setShowSizePopover(false);
    const pos = getCoordinates(e);

    isDrawingRef.current = true;
    currentPointsRef.current = [pos];
    e.target.setPointerCapture?.(e.pointerId);
    redraw();
  };

  const onPointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const pos = getCoordinates(e);
    const pts = currentPointsRef.current;
    const lastPos = pts[pts.length - 1];

    if (!lastPos || Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y) > 2.0) {
      pts.push(pos);
      redraw();
    }
  };

  const onPointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    e.target.releasePointerCapture?.(e.pointerId);

    if (currentPointsRef.current.length > 0) {
      const pts = currentPointsRef.current;
      const finalPoints = isRulerMode && pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : [...pts];

      const newStroke = {
        id: Date.now() + Math.random(),
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        isRulerLine: isRulerMode,
        points: finalPoints
      };
      setStrokes(prev => [...prev, newStroke]);
      setRedoStack([]);
    }
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    triggerHaptic(15);
    const last = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, last]);
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    triggerHaptic(15);
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, last]);
  };

  const handleClearAll = () => {
    if (strokes.length === 0) return;
    if (!window.confirm('필기한 모든 내용을 지우시겠습니까?')) return;
    triggerHaptic(30);
    setStrokes([]);
    setRedoStack([]);
    localStorage.removeItem('gt_general_note_vector_strokes_v3');
  };

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    triggerHaptic(20);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');

    ctx.fillStyle = isDark ? '#121316' : '#FAF8F2';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `묵상노트_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const getPaperBackgroundStyle = () => {
    const baseBg = isDark ? '#14161B' : '#F6F4EC';
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(120, 113, 108, 0.28)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(168, 162, 158, 0.32)';

    switch (paperStyle) {
      case 'dot':
        return {
          backgroundColor: baseBg,
          backgroundImage: `radial-gradient(${dotColor} 1.25px, transparent 1.25px)`,
          backgroundSize: '22px 22px'
        };
      case 'line':
        return {
          backgroundColor: baseBg,
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`,
          backgroundSize: '100% 34px',
          backgroundPosition: '0 12px'
        };
      case 'grid':
        return {
          backgroundColor: baseBg,
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        };
      case 'blank':
      default:
        return { backgroundColor: baseBg };
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto font-sans relative ${ui.bgApp} overflow-hidden select-none touch-none`}>
      
      {/* 1. 상단 심플 헤더 */}
      <header className={`shrink-0 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b ${ui.border} bg-white/85 dark:bg-[#14161B]/90 backdrop-blur-md z-30`}>
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => setActiveScreen('home')} 
            className={`p-1.5 rounded-xl ${ui.textSub} hover:${ui.textMain} hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0`}
            title="홈으로 돌아가기"
          >
            <IconArrowLeft />
          </button>
          <h1 className={`text-[15px] sm:text-[16px] font-black tracking-tight ${ui.textMain} truncate`}>
            자유 말씀 노트
          </h1>
        </div>

        {/* 우측: 용지 선택 + 전체삭제 + 저장 + 메뉴 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/5 dark:border-white/10 text-[11px] font-bold">
            {[
              { id: 'dot', label: '도트' },
              { id: 'line', label: '유선' },
              { id: 'grid', label: '모눈' },
              { id: 'blank', label: '무지' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => { triggerHaptic(10); setPaperStyle(p.id); }}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  paperStyle === p.id
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-black shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleClearAll}
            disabled={strokes.length === 0}
            className={`p-2 rounded-xl border ${ui.border} ${ui.textSub} hover:text-rose-500 disabled:opacity-30 cursor-pointer`}
            title="전체 지우기"
          >
            <IconTrash />
          </button>

          <button 
            onClick={handleExportImage}
            className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
            title="이미지로 저장"
          >
            <IconDownload />
          </button>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-1.5 rounded-xl ${ui.textSub} hover:${ui.textMain} md:hidden cursor-pointer`}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 2. 메인 뷰포트: 노트북 프레임 + 드로잉 캔버스 */}
      <div className="flex-1 relative w-full h-full p-2 sm:p-4 pb-[98px] overflow-hidden flex flex-col">
        <div 
          ref={containerRef} 
          style={getPaperBackgroundStyle()}
          className={`flex-1 relative w-full h-full rounded-[24px] shadow-inner border ${ui.border} overflow-hidden touch-none cursor-crosshair`}
        >
          {isRulerMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[11px] font-black shadow-md pointer-events-none">
              📏 직선자 반듯하게 긋기 모드 켜짐 (자 아이콘 터치 시 해제)
            </div>
          )}

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

      {/* ===================================================================== */}
      {/* 🧰 3. 하단 iPadOS PencilKit 스타일 플로팅 3D 브러시 & 컬러 도크 */}
      {/* ===================================================================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[130] w-[96vw] max-w-[490px] pointer-events-auto select-none flex flex-col items-center">
        
        {/* 굵기(Size) 조절 팝오버 (선택된 펜을 한 번 더 터치하면 열림) */}
        {showSizePopover && (
          <div className={`mb-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-center gap-3 animate-fade-in ${
            isDark ? 'bg-[#1E2028]/95 border-white/15 text-white' : 'bg-white/95 border-stone-300 text-stone-800'
          }`}>
            <span className="text-[11px] font-black whitespace-nowrap">
              {PENCILKIT_BRUSHES.find(b => b.id === currentTool)?.label || '브러시'} 굵기
            </span>
            <input 
              type="range" min="1" max="18" step="0.5"
              value={strokeWidth} 
              onChange={(e) => setStrokeWidth(Number(e.target.value))} 
              className="w-28 accent-slate-900 dark:accent-amber-400 cursor-pointer h-1.5" 
            />
            <span className="text-[11px] font-mono font-bold w-9 text-right">{strokeWidth.toFixed(1)}</span>
            <button
              type="button"
              onClick={() => setShowSizePopover(false)}
              className="text-xs font-bold opacity-50 hover:opacity-100 ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 메인 알약형 플로팅 펜슬 케이스 */}
        <div
          className={`w-full h-[72px] px-3 sm:px-4 rounded-full shadow-[0_14px_40px_rgba(0,0,0,0.16)] border backdrop-blur-2xl flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden ${
            isDark
              ? 'bg-[#1D1F27]/95 border-white/15'
              : 'bg-[#FAF9F5]/95 border-stone-300/80'
          }`}
        >
          {/* 좌측: Undo & Redo 원형 소프트 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="실행 취소"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-25 ${
                isDark ? 'bg-white/10 text-white' : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300/80'
              }`}
            >
              <IconUndo />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="다시 실행"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-25 ${
                isDark ? 'bg-white/10 text-white' : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300/80'
              }`}
            >
              <IconRedo />
            </button>
          </div>

          {/* 중앙: 초정밀 3D SVG 펜슬 세트 (선택 시 부드럽게 솟아오름) */}
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-full pt-2 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
            {PENCILKIT_BRUSHES.map((bItem) => {
              const isSelected = bItem.id === 'ruler' ? isRulerMode : currentTool === bItem.id;
              const activeTipHex = isSelected && bItem.id !== 'eraser' && bItem.id !== 'ruler'
                ? resolveAdaptiveColor(strokeColor, false)
                : (bItem.id === 'ruler' && isRulerMode ? '#FACC15' : bItem.defaultColor);

              return (
                <button
                  key={bItem.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    if (bItem.id === 'ruler') {
                      setIsRulerMode(!isRulerMode);
                      return;
                    }
                    if (currentTool === bItem.id) {
                      setShowSizePopover(!showSizePopover);
                    } else {
                      setCurrentTool(bItem.id);
                      setShowSizePopover(false);
                    }
                  }}
                  title={`${bItem.label} (한 번 더 터치하면 굵기 조절)`}
                  style={{
                    transform: isSelected ? 'translateY(3px) scale(1.06)' : 'translateY(16px) scale(0.95)',
                    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                  className="relative flex flex-col items-center justify-end h-[70px] px-0.5 cursor-pointer shrink-0 focus:outline-none"
                >
                  <RealisticPencilKitSVG type={bItem.id} activeColor={activeTipHex} />
                </button>
              );
            })}
          </div>

          {/* 우측: 2×3 컬러 팔레트 도트 + 무지개 컬러피커 */}
          <div className="grid grid-cols-3 gap-1.5 pl-2.5 border-l border-stone-300/70 dark:border-white/10 shrink-0 items-center">
            {QUICK_DOT_COLORS.map((hex) => {
              const isSelectedColor = strokeColor.toUpperCase() === hex.toUpperCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setStrokeColor(hex);
                    if (currentTool === 'eraser') setCurrentTool('fountain');
                  }}
                  style={{ backgroundColor: hex }}
                  className={`w-[18px] h-[18px] rounded-full cursor-pointer transition-all ${
                    isSelectedColor
                      ? 'scale-120 ring-2 ring-offset-2 ring-blue-500 shadow-sm'
                      : 'opacity-90 hover:opacity-100 hover:scale-110'
                  }`}
                />
              );
            })}

            {/* 6번째 도트: 무지개 커스텀 색상 선택기 */}
            <label
              title="사용자 지정 색상 선택"
              className="w-[18px] h-[18px] rounded-full cursor-pointer relative overflow-hidden shadow-xs ring-1 ring-black/20 hover:scale-110 transition-transform"
              style={{
                background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
              }}
            >
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  if (currentTool === 'eraser') setCurrentTool('fountain');
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}
// src/games/jerusalem/components/GameEngine.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_W = 84;
const TILE_H = 42;
const ORIG_X = 0;
const ORIG_Y = -180;

// =====================================================================
// 🎨 [인메모리 캔버스 베이커] 24대 고대 건축물 전수 2.5D 디오라마 팩토리
// =====================================================================
const createDioramaTexture = (app, type, w, h, level = 1) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const cw = w * TILE_W + 50;
  const ch = h * TILE_H + 130;
  canvas.width = cw;
  canvas.height = ch;

  const cx = cw / 2;
  const cy = ch - 16;

  // 바닥 아이소메트릭 다이아몬드 기준점 (S, W, N, E)
  const baseS = { x: cx, y: cy };
  const baseW = { x: cx - (w * TILE_W) / 2, y: cy - (h * TILE_H) / 2 };
  const baseE = { x: cx + (w * TILE_W) / 2, y: cy - (h * TILE_H) / 2 };
  const baseN = { x: cx, y: cy - h * TILE_H };

  // 💡 [핵심] 7개 인자 누락을 원천 차단하는 안전 타원 헬퍼
  const drawEllipse = (x, y, rx, ry, fillCol, strokeCol = '#361F12', lw = 1) => {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (fillCol) {
      ctx.fillStyle = fillCol;
      ctx.fill();
    }
    if (strokeCol) {
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  };

  // 2.5D 아이소메트릭 박스 빌더
  const drawIsoBox = (bS, bW, bE, bN, height, sunCol, shadeCol, topCol, stroke = '#361F12') => {
    // 좌벽 (햇빛면)
    ctx.beginPath();
    ctx.moveTo(bW.x, bW.y);
    ctx.lineTo(bS.x, bS.y);
    ctx.lineTo(bS.x, bS.y - height);
    ctx.lineTo(bW.x, bW.y - height);
    ctx.closePath();
    ctx.fillStyle = sunCol;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    // 우벽 (그늘면)
    ctx.beginPath();
    ctx.moveTo(bS.x, bS.y);
    ctx.lineTo(bE.x, bE.y);
    ctx.lineTo(bE.x, bE.y - height);
    ctx.lineTo(bS.x, bS.y - height);
    ctx.closePath();
    ctx.fillStyle = shadeCol;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    // 윗면 (지붕/바닥)
    ctx.beginPath();
    ctx.moveTo(bN.x, bN.y - height);
    ctx.lineTo(bE.x, bE.y - height);
    ctx.lineTo(bS.x, bS.y - height);
    ctx.lineTo(bW.x, bW.y - height);
    ctx.closePath();
    ctx.fillStyle = topCol;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };

  const drawJar = (x, y) => {
    drawEllipse(x, y - 3, 3, 4.5, '#D97706', '#361F12', 0.9);
    drawEllipse(x, y - 7, 2, 1.2, '#F59E0B', '#361F12', 0.6);
  };

  const drawCrate = (x, y) => {
    ctx.fillStyle = '#854D0E';
    ctx.fillRect(x - 4, y - 6, 8, 6);
    ctx.strokeStyle = '#361F12';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 4, y - 6, 8, 6);
  };

  const drawPalm = (x, y, trunkH = 26) => {
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + 1, y - trunkH * 0.4);
    ctx.lineTo(x + 2, y - trunkH);
    ctx.lineTo(x + 4, y - trunkH);
    ctx.lineTo(x + 1, y);
    ctx.fillStyle = '#78350F';
    ctx.fill();
    ctx.strokeStyle = '#361F12';
    ctx.lineWidth = 1;
    ctx.stroke();

    const fronds = [[-14, -5], [-9, -12], [2, -14], [12, -9], [14, -3]];
    fronds.forEach(([fx, fy]) => {
      ctx.beginPath();
      ctx.moveTo(x + 3, y - trunkH);
      ctx.lineTo(x + 3 + fx, y - trunkH + fy);
      ctx.strokeStyle = '#84CC16';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(x + 3, y - trunkH + 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#D97706';
    ctx.fill();
  };

  // ── [1. 헤롯 대성전 (3x3)] ──
  if (type === 'temple') {
    drawIsoBox(baseS, baseW, baseE, baseN, 14, '#F5EBE0', '#D6C7B2', '#FFF9EE');

    const t2S = { x: cx, y: cy - 14 };
    const t2W = { x: cx - (w * TILE_W) / 2 + 16, y: baseW.y - 14 + 8 };
    const t2E = { x: cx + (w * TILE_W) / 2 - 16, y: baseE.y - 14 + 8 };
    const t2N = { x: cx, y: baseN.y - 14 + 16 };
    drawIsoBox(t2S, t2W, t2E, t2N, 20, '#FFF8EB', '#EAD6BD', '#FFF9EE');

    const t3S = { x: cx, y: cy - 34 };
    const t3W = { x: cx - 44, y: t2W.y - 20 };
    const t3E = { x: cx + 44, y: t2E.y - 20 };
    const t3N = { x: cx, y: t2N.y - 20 };
    drawIsoBox(t3S, t3W, t3E, t3N, 65, '#FFFFFF', '#E2E8F0', '#F8FAFC');

    // 황금 코니스 파사드
    ctx.beginPath();
    ctx.moveTo(t3W.x - 3, t3W.y - 65);
    ctx.lineTo(t3S.x, t3S.y - 65);
    ctx.lineTo(t3S.x, t3S.y - 78);
    ctx.lineTo(t3W.x - 3, t3W.y - 78);
    ctx.closePath();
    ctx.fillStyle = '#FBBF24';
    ctx.fill();
    ctx.strokeStyle = '#361F12';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(t3S.x, t3S.y - 65);
    ctx.lineTo(t3E.x + 3, t3E.y - 65);
    ctx.lineTo(t3E.x + 3, t3E.y - 78);
    ctx.lineTo(t3S.x, t3S.y - 78);
    ctx.closePath();
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.stroke();

    // 대리석 열주 기둥
    for (let i = 0; i < 5; i++) {
      const r = (i + 0.5) / 5;
      const px = t2W.x + (t2S.x - t2W.x) * r;
      const py = t2W.y + (t2S.y - t2W.y) * r;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px - 3, py - 35, 6, 35);
      ctx.strokeStyle = '#361F12';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 3, py - 35, 6, 35);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(px - 4, py - 38, 8, 4);
    }

    // 번제단
    ctx.fillStyle = '#78350F';
    ctx.fillRect(t2S.x + 10, t2S.y - 12, 16, 12);
    ctx.strokeRect(t2S.x + 10, t2S.y - 12, 16, 12);
    ctx.beginPath();
    ctx.arc(t2S.x + 18, t2S.y - 13, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
  }

  // ── [2. 골고다 언덕 (2x2 암반 절벽)] ──
  else if (type === 'golgotha') {
    ctx.beginPath();
    ctx.moveTo(baseW.x, baseW.y);
    ctx.lineTo(baseW.x + 12, baseW.y - 16);
    ctx.lineTo(baseS.x - 14, baseS.y - 24);
    ctx.lineTo(baseS.x, baseS.y);
    ctx.lineTo(baseS.x + 18, baseS.y - 12);
    ctx.lineTo(baseE.x, baseE.y);
    ctx.lineTo(baseE.x + 8, baseE.y - 22);
    ctx.lineTo(baseN.x, baseN.y - 25);
    ctx.closePath();
    ctx.fillStyle = '#57534E';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#361F12';
    ctx.stroke();

    const topY = cy - 42;
    ctx.beginPath();
    ctx.moveTo(cx - 32, topY + 8);
    ctx.lineTo(cx - 20, topY - 10);
    ctx.lineTo(cx + 25, topY - 8);
    ctx.lineTo(cx + 30, topY + 12);
    ctx.lineTo(cx, topY + 18);
    ctx.closePath();
    ctx.fillStyle = '#78716C';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    drawEllipse(cx - 15, topY + 10, 5, 3, '#44403C', null);
    drawEllipse(cx + 12, topY + 8, 6, 3.5, '#44403C', null);

    // 십자가 3개
    ctx.fillStyle = '#78350F';
    ctx.fillRect(cx - 3, topY - 45, 6, 48);
    ctx.fillRect(cx - 16, topY - 37, 32, 6);
    ctx.strokeRect(cx - 16, topY - 37, 32, 6);
    ctx.strokeRect(cx - 3, topY - 45, 6, 48);
    ctx.fillStyle = '#FDF2E9';
    ctx.fillRect(cx - 5, topY - 42, 10, 4.5);
    ctx.strokeRect(cx - 5, topY - 42, 10, 4.5);

    ctx.fillStyle = '#5C381E';
    ctx.fillRect(cx - 25, topY - 28, 4.5, 32);
    ctx.fillRect(cx - 33, topY - 24, 18, 4.5);
    ctx.strokeRect(cx - 33, topY - 24, 18, 4.5);
    ctx.strokeRect(cx - 25, topY - 28, 4.5, 32);

    ctx.fillRect(cx + 20, topY - 28, 4.5, 32);
    ctx.fillRect(cx + 15, topY - 24, 18, 4.5);
    ctx.strokeRect(cx + 15, topY - 24, 18, 4.5);
    ctx.strokeRect(cx + 20, topY - 28, 4.5, 32);
  }

  // ── [3. 실로암 수로교 (1x1 뚫린 아치)] ──
  else if (type === 'aqueduct') {
    const hBridge = 32;
    ctx.fillStyle = '#FFF8EB';
    ctx.fillRect(baseW.x + 3, baseW.y - hBridge, 7, hBridge);
    ctx.strokeStyle = '#361F12';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(baseW.x + 3, baseW.y - hBridge, 7, hBridge);

    ctx.fillStyle = '#D4BC98';
    ctx.fillRect(baseS.x - 9, baseS.y - hBridge, 7, hBridge);
    ctx.strokeRect(baseS.x - 9, baseS.y - hBridge, 7, hBridge);

    ctx.beginPath();
    ctx.moveTo(baseW.x + 10, baseW.y);
    ctx.lineTo(baseW.x + 10, baseW.y - hBridge + 14);
    ctx.quadraticCurveTo(cx, baseW.y - hBridge + 6, baseS.x - 9, baseS.y - hBridge + 14);
    ctx.lineTo(baseS.x - 9, baseS.y);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#361F12';
    ctx.stroke();

    const flumeS = { x: baseS.x, y: baseS.y - hBridge };
    const flumeW = { x: baseW.x, y: baseW.y - hBridge };
    const flumeE = { x: baseE.x, y: baseE.y - hBridge };
    const flumeN = { x: baseN.x, y: baseN.y - hBridge };
    drawIsoBox(flumeS, flumeW, flumeE, flumeN, 8, '#FFF9EE', '#D4BC98', '#FFF8EB');

    ctx.beginPath();
    ctx.moveTo(flumeN.x, flumeN.y - 6);
    ctx.lineTo(flumeE.x, flumeE.y - 6);
    ctx.lineTo(flumeS.x, flumeS.y - 6);
    ctx.lineTo(flumeW.x, flumeW.y - 6);
    ctx.closePath();
    ctx.fillStyle = '#38BDF8';
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── [4. 갈릴리 밀밭 & 풍차 (2x2)] ──
  else if (type === 'wheat_farm') {
    for (let i = 0; i < 5; i++) {
      const rw = (i + 1) / 6;
      ctx.beginPath();
      ctx.moveTo(baseW.x + (baseN.x - baseW.x) * rw, baseW.y + (baseN.y - baseW.y) * rw);
      ctx.lineTo(baseS.x + (baseE.x - baseS.x) * rw, baseS.y + (baseE.y - baseS.y) * rw);
      ctx.strokeStyle = i % 2 === 0 ? '#FBBF24' : '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    const mS = { x: cx, y: cy - 6 };
    const mW = { x: cx - 22, y: cy - 17 };
    const mE = { x: cx + 22, y: cy - 17 };
    const mN = { x: cx, y: cy - 28 };
    drawIsoBox(mS, mW, mE, mN, 36, '#FAF2E6', '#D6C7B2', '#ED5E34');

    const hubX = cx;
    const hubY = cy - 42 - 18;
    ctx.beginPath();
    ctx.arc(hubX, hubY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#78350F';
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + 0.3;
      const ex = hubX + Math.cos(ang) * 22;
      const ey = hubY + Math.sin(ang) * 22;
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── [5. 가나의 포도원 (2x2)] ──
  else if (type === 'vineyard') {
    drawIsoBox(baseS, baseW, baseE, baseN, 12, '#C9B090', '#9C8265', '#D6C1A0');

    for (let i = 0; i < 4; i++) {
      const vx = baseW.x + 10 + i * 15;
      const vy = baseW.y - 8 + i * 3;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx, vy - 14);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#78350F';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(vx + 1, vy - 13, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#84CC16';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(vx - 2, vy - 7, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7E22CE';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(vx + 3, vy - 6, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#9333EA';
      ctx.fill();
    }
    drawEllipse(baseS.x - 8, baseS.y - 2, 7, 4, '#6B21A8', '#361F12', 1);
  }

  // ── [6. 시장 4종 (2x2 오픈 바자르)] ──
  else if (['bread_market', 'fish_market', 'sacrifice_market', 'caravan'].includes(type)) {
    const isBread = type === 'bread_market';
    const isFish = type === 'fish_market';
    const mainCol = isBread ? '#F59E0B' : isFish ? '#0284C7' : '#9333EA';

    const rS = { x: (baseW.x + baseS.x) / 2, y: (baseW.y + baseS.y) / 2 };
    const rW = { x: baseW.x, y: baseW.y };
    const rE = { x: (baseN.x + baseE.x) / 2, y: (baseN.y + baseE.y) / 2 };
    const rN = { x: baseN.x, y: baseN.y };
    drawIsoBox(rS, rW, rE, rN, 28, '#FFF8EB', '#D4BC98', '#EAD6BD');

    const fS = { x: baseS.x, y: baseS.y };
    const fW = rS;
    const fE = baseE;
    const fN = rE;
    drawIsoBox(fS, fW, fE, fN, 10, '#854D0E', '#5C381E', '#A16207');

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fW.x + 4, fW.y - 10);
    ctx.lineTo(fW.x + 4, fW.y - 26);
    ctx.moveTo(fS.x - 4, fS.y - 10);
    ctx.lineTo(fS.x - 4, fS.y - 26);
    ctx.stroke();

    const awnY = fW.y - 26;
    ctx.beginPath();
    ctx.moveTo(rS.x, rS.y - 22);
    ctx.lineTo(rE.x, rE.y - 22);
    ctx.lineTo(fS.x, awnY + 4);
    ctx.lineTo(fW.x, awnY);
    ctx.closePath();
    ctx.fillStyle = mainCol;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#361F12';
    ctx.stroke();

    if (isBread) {
      drawCrate(fW.x + 10, fW.y - 8);
      ctx.beginPath();
      ctx.arc(fW.x + 9, fW.y - 14, 2.5, 0, Math.PI * 2);
      ctx.arc(fW.x + 13, fW.y - 14, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();
      drawEllipse(rW.x + 8, rW.y - 2, 6, 4, '#78716C', '#361F12', 1);
      ctx.beginPath();
      ctx.arc(rW.x + 8, rW.y - 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
    } else if (isFish) {
      drawCrate(fW.x + 10, fW.y - 8);
      // 💡 [안전 교정] 7개 인자 함수로 교체
      drawEllipse(fW.x + 10, fW.y - 13, 4, 2, '#38BDF8', '#361F12', 0.8);
    } else {
      drawCrate(fW.x + 10, fW.y - 8);
      drawJar(fS.x - 6, fS.y);
    }
  }

  // ── [7. 주거 구역 5단계 (1x1)] ──
  else if (type === 'house') {
    if (level === 1) {
      ctx.beginPath();
      ctx.moveTo(baseW.x, baseW.y);
      ctx.lineTo(cx, cy - 26);
      ctx.lineTo(baseS.x, baseS.y);
      ctx.closePath();
      ctx.fillStyle = '#5C381E';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#361F12';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(baseS.x, baseS.y);
      ctx.lineTo(cx, cy - 26);
      ctx.lineTo(baseE.x, baseE.y);
      ctx.closePath();
      ctx.fillStyle = '#452310';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(baseS.x - 8, baseS.y + 3, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      drawJar(baseS.x + 6, baseS.y + 1);
    } else if (level === 2) {
      drawIsoBox(baseS, baseW, baseE, baseN, 28, '#F5D0A9', '#D4A373', '#EAD6BD');
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseW.x + 6, baseW.y - 28);
      ctx.lineTo(baseW.x + 6, baseW.y - 40);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(baseW.x + 4, baseW.y - 40);
      ctx.lineTo(baseS.x - 4, baseS.y - 36);
      ctx.lineTo(cx, baseS.y - 45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (level === 3) {
      drawIsoBox(baseS, baseW, baseE, baseN, 36, '#FFF8EB', '#D4BC98', '#E4D1B8');
      const aS = { x: cx, y: cy - 36 };
      const aW = { x: cx - 14, y: baseW.y - 36 + 7 };
      const aE = { x: cx + 14, y: baseE.y - 36 + 7 };
      const aN = { x: cx, y: baseN.y - 36 + 14 };
      drawIsoBox(aS, aW, aE, aN, 14, '#FFF9EE', '#D4BC98', '#A45A17');
    } else if (level === 4) {
      drawIsoBox(baseS, baseW, baseE, baseN, 42, '#FFF8EB', '#D4BC98', '#E4D1B8');
      const rY = cy - 42;
      const apexX = cx;
      const apexY = baseN.y - 42 - 16;
      ctx.beginPath();
      ctx.moveTo(baseW.x - 3, baseW.y - 42 + 2);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(baseS.x, rY - 8);
      ctx.closePath();
      ctx.fillStyle = '#ED5E34';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#361F12';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(baseS.x, rY - 8);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(baseE.x + 3, baseE.y - 42 + 2);
      ctx.closePath();
      ctx.fillStyle = '#B33714';
      ctx.fill();
      ctx.stroke();
    } else {
      drawIsoBox(baseS, baseW, baseE, baseN, 48, '#FFFFFF', '#E2E8F0', '#F8FAFC');
      const rY = cy - 48;
      const apexX = cx;
      const apexY = baseN.y - 48 - 18;
      ctx.beginPath();
      ctx.moveTo(baseW.x - 3, baseW.y - 48 + 2);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(baseS.x, rY - 8);
      ctx.closePath();
      ctx.fillStyle = '#ED5E34';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#361F12';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(baseS.x, rY - 8);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(baseE.x + 3, baseE.y - 48 + 2);
      ctx.closePath();
      ctx.fillStyle = '#B33714';
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── [8. 성벽, 성문, 망대, 회당 등 기타 건물] ──
  else {
    const wallH = type === 'tower' ? 52 : type === 'synagogue' ? 48 : type === 'gate' ? 38 : 28;
    const sunC = type === 'synagogue' ? '#FFFFFF' : '#CBD5E1';
    const shadeC = type === 'synagogue' ? '#CBD5E1' : '#94A3B8';
    drawIsoBox(baseS, baseW, baseE, baseN, wallH, sunC, shadeC, '#E2E8F0');

    if (type === 'synagogue') {
      ctx.beginPath();
      ctx.arc(cx, cy - wallH - 6, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();
      drawPalm(baseW.x - 4, baseW.y + 2, 28);
    } else if (type === 'gate') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - wallH);
      ctx.lineTo(cx, cy - wallH - 12);
      ctx.strokeStyle = '#361F12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx, cy - wallH - 12, 10, 6);
    } else if (type === 'tower') {
      ctx.beginPath();
      ctx.arc(cx, cy - wallH - 4, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
    }
  }

  return PIXI.Texture.from(canvas);
};

export default function GameEngine() {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const viewportRef = useRef(null);

  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const stateRef = useRef({ grid, walkers, selectedTool });
  stateRef.current = { grid, walkers, selectedTool };

  const getTileCenter = (r, c) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y
  });

  const getMultiTileBase = (r, c, w = 1, h = 1) => {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    return {
      N: { x: (c - r) * hw + ORIG_X, y: (c + r) * hh - hh + ORIG_Y },
      E: { x: (c + w - r) * hw + ORIG_X, y: (c + w + r) * hh - hh + ORIG_Y },
      S: { x: (c + w - (r + h)) * hw + ORIG_X, y: (c + w + r + h) * hh - hh + ORIG_Y },
      W: { x: (c - (r + h)) * hw + ORIG_X, y: (c + r + h) * hh - hh + ORIG_Y }
    };
  };

  const worldToTile = (wx, wy) => {
    const dx = wx - ORIG_X;
    const dy = wy - ORIG_Y;
    const yTerm = dy / (TILE_H / 2);
    const xTerm = dx / (TILE_W / 2);
    const c = Math.floor((yTerm + xTerm) / 2 + 0.5);
    const r = Math.floor((yTerm - xTerm) / 2 + 0.5);
    return { r, c };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    const app = new PIXI.Application();
    let viewport = null;

    app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0xEDE2CE,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    }).then(() => {
      if (!isMounted || !containerRef.current) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      pixiAppRef.current = app;

      viewport = new Viewport({
        screenWidth: containerRef.current.clientWidth,
        screenHeight: containerRef.current.clientHeight,
        worldWidth: MAP_SIZE * TILE_W * 3,
        worldHeight: MAP_SIZE * TILE_H * 3,
        events: app.renderer.events
      });

      viewportRef.current = viewport;
      window.tycoonViewport = viewport;

      app.stage.addChild(viewport);
      viewport
        .drag({ clampWheel: true })
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({ minScale: 0.5, maxScale: 2.4 });

      viewport.moveCenter(0, 100);

      const groundGfx = new PIXI.Graphics();
      const castShadowGfx = new PIXI.Graphics();
      const previewGfx = new PIXI.Graphics();
      const bldgContainer = new PIXI.Container();
      const fxGfx = new PIXI.Graphics();
      const walkerGfx = new PIXI.Graphics();

      viewport.addChild(groundGfx);
      viewport.addChild(castShadowGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(bldgContainer);
      viewport.addChild(fxGfx);
      viewport.addChild(walkerGfx);

      const textureCache = new Map();
      const getTexture = (type, w, h, level) => {
        const key = `${type}_${level}_${w}x${h}`;
        if (!textureCache.has(key)) {
          const tex = createDioramaTexture(app, type, w, h, level);
          textureCache.set(key, tex);
        }
        return textureCache.get(key);
      };

      let hoverTile = null;

      viewport.on('pointermove', (e) => {
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const tile = worldToTile(worldPos.x, worldPos.y);
        if (tile.r >= 0 && tile.r < MAP_SIZE && tile.c >= 0 && tile.c < MAP_SIZE) {
          hoverTile = tile;
        } else {
          hoverTile = null;
        }
      });

      let touchStartTime = 0;
      let touchStartPos = { x: 0, y: 0 };

      viewport.on('pointerdown', (e) => {
        touchStartTime = Date.now();
        touchStartPos = { x: e.global.x, y: e.global.y };
      });

      viewport.on('pointerup', (e) => {
        const elapsed = Date.now() - touchStartTime;
        const dist = Math.hypot(e.global.x - touchStartPos.x, e.global.y - touchStartPos.y);

        if (elapsed < 350 && dist < 8 && hoverTile) {
          const { r, c } = hoverTile;
          const { grid: curGrid, selectedTool: curTool } = stateRef.current;
          const clicked = curGrid[r]?.[c];

          if (curTool === 'inspect') {
            if (clicked) {
              const rootR = clicked.isRoot ? r : clicked.rootR;
              const rootC = clicked.isRoot ? c : clicked.rootC;
              setInspectedTile(curGrid[rootR]?.[rootC]);
            }
            return;
          }

          if (curTool === 'demolish') {
            demolishAt(r, c);
            return;
          }

          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            buildAt(r, c, bMeta);
          }
        }
      });

      let simTick = 0;

      app.ticker.add((time) => {
        simTick += time.deltaTime * 0.05;
        const { grid: curGrid, walkers: curWalkers, selectedTool: curTool } = stateRef.current;

        // [1] 바닥 타일 & 도로
        groundGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const { x: cx, y: cy } = getTileCenter(r, c);
            const cell = curGrid[r]?.[c];
            const isHov = hoverTile && hoverTile.r === r && hoverTile.c === c;

            groundGfx.poly([
              cx, cy - TILE_H / 2,
              cx + TILE_W / 2, cy,
              cx, cy + TILE_H / 2,
              cx - TILE_W / 2, cy
            ]);
            groundGfx.fill(cell?.type === 'road' ? 0xD6C1A0 : isHov ? 0xFDE68A : 0xF3E7CF);
            groundGfx.stroke({ width: 1.2, color: isHov ? 0xF59E0B : 0xE0CFB4 });

            if (cell?.type === 'road') {
              groundGfx.ellipse(cx - 10, cy - 3, 7, 3.5);
              groundGfx.fill(0xECE0CD);
              groundGfx.stroke({ width: 0.8, color: 0x6E4C32 });
              groundGfx.ellipse(cx + 8, cy - 2, 8, 4);
              groundGfx.fill(0xB59D7B);
              groundGfx.stroke({ width: 0.8, color: 0x6E4C32 });
            }
          }
        }

        // [2] 건설 가이드 프리뷰
        previewGfx.clear();
        if (hoverTile && curTool !== 'demolish' && curTool !== 'inspect') {
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const { r, c } = hoverTile;
            const w = bMeta.w || 1;
            const h = bMeta.h || 1;
            const base = getMultiTileBase(r, c, w, h);

            previewGfx.poly([base.N.x, base.N.y, base.E.x, base.E.y, base.S.x, base.S.y, base.W.x, base.W.y]);
            previewGfx.fill({ color: 0xFBBF24, alpha: 0.45 });
            previewGfx.stroke({ width: 3, color: 0xD97706 });
          }
        }

        // [3] 사선 투영 그림자
        castShadowGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (!cell || !cell.isRoot || cell.type === 'road') continue;

            const w = cell.w || 1;
            const h = cell.h || 1;
            const base = getMultiTileBase(r, c, w, h);
            
            let bH = 26;
            if (cell.type === 'temple') bH = 80;
            else if (cell.type === 'golgotha') bH = 45;
            else if (cell.type === 'aqueduct') bH = 34;
            else if (cell.type === 'house') bH = 16 + (cell.level || 1) * 10;

            const sDx = bH * 0.75;
            const sDy = bH * 0.38;

            castShadowGfx.poly([
              base.W.x, base.W.y,
              base.S.x, base.S.y,
              base.E.x + sDx, base.E.y + sDy,
              base.N.x + sDx, base.N.y + sDy
            ]);
            castShadowGfx.fill({ color: 0x382215, alpha: 0.28 });
          }
        }

        // [4] 깊이 정렬 & 베이킹된 스프라이트 배치
        bldgContainer.removeChildren();

        const renderQueue = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell && cell.isRoot && cell.type !== 'road') {
              renderQueue.push({ r, c, cell, depth: r + c + (cell.w || 1) + (cell.h || 1) });
            }
          }
        }
        renderQueue.sort((a, b) => a.depth - b.depth);

        renderQueue.forEach(({ r, c, cell }) => {
          const { type, level = 1, w = 1, h = 1 } = cell;
          const base = getMultiTileBase(r, c, w, h);
          const tex = getTexture(type, w, h, level);

          if (tex) {
            const spr = new PIXI.Sprite(tex);
            const ch = h * TILE_H + 130;
            spr.anchor.set(0.5, (ch - 16) / ch);
            spr.x = base.S.x;
            spr.y = base.S.y;
            bldgContainer.addChild(spr);
          }
        });

        // [5] 성전 번제단 피어오르는 연기 파티클
        fxGfx.clear();
        const templeCell = curGrid.flat().find(c => c?.type === 'temple' && c.isRoot);
        if (templeCell) {
          const tBase = getMultiTileBase(templeCell.r || 4, templeCell.c || 4, 3, 3);
          const altarX = tBase.S.x + 18;
          const altarY = tBase.S.y - 20;

          for (let i = 1; i <= 5; i++) {
            const progress = (simTick * 0.4 + i * 0.2) % 1;
            const py = altarY - progress * 65;
            const px = altarX + Math.sin(simTick + i) * (progress * 15);
            const pRadius = 4 + progress * 8.5;

            fxGfx.circle(px, py, pRadius);
            fxGfx.fill({ color: 0xFFFFFF, alpha: 0.75 - progress * 0.55 });
            fxGfx.stroke({ width: 1, color: 0x361F12, alpha: 0.35 - progress * 0.25 });
          }
        }

        // [6] 깡총깡총 걷는 순례자 & 일꾼
        walkerGfx.clear();
        curWalkers.forEach((w, wIdx) => {
          const { x: cx, y: cy } = getTileCenter(w.r, w.c);
          const bounce = Math.abs(Math.sin(simTick * 4 + wIdx)) * 3;
          const charY = cy - bounce;

          walkerGfx.ellipse(cx, cy + 2, 6, 3);
          walkerGfx.fill({ color: 0x361F12, alpha: 0.28 });

          if (w.type === 'jesus') {
            walkerGfx.circle(cx, charY - 20, 9);
            walkerGfx.fill({ color: 0xFBBF24, alpha: 0.85 });
            walkerGfx.circle(cx, charY - 18, 5.5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 4, charY - 12, 8, 13);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.stroke({ width: 1.4, color: 0x361F12 });

            walkerGfx.rect(cx - 1.5, charY - 12, 3, 13);
            walkerGfx.fill(0xEF4444);
          } else if (w.type === 'disciple') {
            walkerGfx.circle(cx, charY - 16, 5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.rect(cx - 3.5, charY - 11, 7, 11);
            walkerGfx.fill(0x0284C7);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.poly([cx + 5, charY - 18, cx + 5, charY + 1]);
            walkerGfx.stroke({ width: 1.4, color: 0x78350F });
          } else {
            walkerGfx.rect(cx - 5, charY - 8, 11, 7);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx + 6, charY - 9, 4);
            walkerGfx.fill(0x94A3B8);
            walkerGfx.stroke({ width: 1.2, color: 0x361F12 });

            walkerGfx.circle(cx - 1, charY - 10, 3.5);
            walkerGfx.fill(0xF59E0B);
            walkerGfx.stroke({ width: 1, color: 0x361F12 });
          }
        });
      });
    });

    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing touch-none">
      <div className="absolute top-2 left-2 bg-stone-900/80 text-amber-300 text-[10.5px] font-black px-3 py-1.5 rounded-full pointer-events-none z-10 backdrop-blur-xs border border-amber-400/30 shadow-lg">
        ✨ 예루살렘 타이쿤 (고전 명작 파라오 인메모리 디오라마 엔진)
      </div>
    </div>
  );
}
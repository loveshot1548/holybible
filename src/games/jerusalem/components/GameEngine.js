// src/games/jerusalem/components/GameEngine.js
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useTycoonStore, MAP_SIZE } from '../core/store';
import { BUILDINGS } from '../data/buildings';

const TILE_W = 92;
const TILE_H = 46;
const ORIG_X = 0;
const ORIG_Y = -220;

// 🏛️ 시저 3식 배회자(Walker) 대사 풀
const WALKER_THOUGHTS = {
  jesus: {
    name: '예수 그리스도',
    thoughts: [
      '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.',
      '나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요.',
      '누구든지 목마르거든 내게로 와서 마시라!'
    ]
  },
  disciple: {
    name: '열두 제자 & 물동이 배급원',
    thoughts: [
      '생명의 빵과 갈릴리 생선을 백성들의 집으로 나르고 있습니다!',
      '실로암 우물물이 이 거리까지 시원하게 공급되고 있군요.',
      '성전 예배의 기쁨이 온 예루살렘 거리에 가득합니다!'
    ]
  },
  merchant: {
    name: '예루살렘 무역 대상',
    thoughts: [
      '감람산의 순수한 올리브 기름과 가나의 포도주를 싣고 갑니다.',
      '장터마다 곡식과 물고기가 넘쳐나니 성읍이 날마다 번창합니다!',
      '다윗의 성문 안으로 평안을 비는 순례자들이 몰려옵니다.'
    ]
  }
};

// =====================================================================
// ⛰️ 2.5D 지형 고도(Elevation) 및 자연 생태계 판별기
// =====================================================================
const getNaturalTerrainType = (r, c) => {
  if (c === MAP_SIZE - 1 || (r >= MAP_SIZE - 2 && c >= MAP_SIZE - 3)) {
    return 'water';
  }
  if (r >= 2 && r <= 6 && c >= 2 && c <= 6) {
    return 'zion_plateau';
  }
  if (c === MAP_SIZE - 2 || (r >= MAP_SIZE - 3 && c >= MAP_SIZE - 4)) {
    return 'meadow';
  }
  const hash = (r * 31 + c * 17) % 19;
  if (hash === 0) return 'palm_tree';
  if (hash === 1) return 'olive_tree';
  if (hash === 2) return 'cypress_tree';
  if (hash === 3) return 'desert_rock';
  return 'sand';
};

const getTileElevation = (r, c, cell) => {
  const terrain = getNaturalTerrainType(r, c);
  if (!cell && terrain === 'water') return -10;
  if (terrain === 'zion_plateau') return 14;
  return 0;
};

// =====================================================================
// 🎨 고해상도 2.5D 카툰 시티빌더 프로시저럴 텍스처 베이커 (Canvas 2D)
// - PixiJS v8 폴리곤 찢어짐(Tearing) 원천 차단
// - 타운십/시저3 스타일의 둥글고 디테일한 카툰 셰이딩, 기와, 벽돌, 아치, 차양막 구현
// =====================================================================
const bakedCartoonTextures = new Map();

function drawIsoBox2D(ctx, cx, by, rx, ry, h, topCol, leftCol, rightCol, strokeCol = '#2B1810', lineW = 2.2) {
  // 좌측 면
  ctx.beginPath();
  ctx.moveTo(cx - rx, by - ry - h);
  ctx.lineTo(cx, by - h);
  ctx.lineTo(cx, by);
  ctx.lineTo(cx - rx, by - ry);
  ctx.closePath();
  ctx.fillStyle = leftCol;
  ctx.fill();
  ctx.lineWidth = lineW;
  ctx.strokeStyle = strokeCol;
  ctx.stroke();

  // 우측 면
  ctx.beginPath();
  ctx.moveTo(cx, by - h);
  ctx.lineTo(cx + rx, by - ry - h);
  ctx.lineTo(cx + rx, by - ry);
  ctx.lineTo(cx, by);
  ctx.closePath();
  ctx.fillStyle = rightCol;
  ctx.fill();
  ctx.stroke();

  // 상단 면
  ctx.beginPath();
  ctx.moveTo(cx, by - ry * 2 - h);
  ctx.lineTo(cx + rx, by - ry - h);
  ctx.lineTo(cx, by - h);
  ctx.lineTo(cx - rx, by - ry - h);
  ctx.closePath();
  ctx.fillStyle = topCol;
  ctx.fill();
  ctx.stroke();
}

function drawPitchedRoof2D(ctx, cx, by, rx, ry, wallH, peakH, leftRoofCol, rightRoofCol, frontGableCol = '#FFFBEB', strokeCol = '#2B1810') {
  const topY = by - wallH;
  const frontPeakX = cx - rx * 0.5;
  const frontPeakY = topY - ry * 0.5 - peakH;
  const backPeakX = cx + rx * 0.5;
  const backPeakY = topY - ry * 1.5 - peakH;

  // 서북쪽 지붕 경사면
  ctx.beginPath();
  ctx.moveTo(cx - rx, topY - ry);
  ctx.lineTo(frontPeakX, frontPeakY);
  ctx.lineTo(backPeakX, backPeakY);
  ctx.lineTo(cx, topY - ry * 2);
  ctx.closePath();
  ctx.fillStyle = leftRoofCol;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = strokeCol;
  ctx.stroke();

  // 동남쪽 지붕 경사면
  ctx.beginPath();
  ctx.moveTo(frontPeakX, frontPeakY);
  ctx.lineTo(cx, topY);
  ctx.lineTo(cx + rx, topY - ry);
  ctx.lineTo(backPeakX, backPeakY);
  ctx.closePath();
  ctx.fillStyle = rightRoofCol;
  ctx.fill();
  ctx.stroke();

  // 정면 박공 삼각벽
  ctx.beginPath();
  ctx.moveTo(cx - rx, topY - ry);
  ctx.lineTo(cx, topY);
  ctx.lineTo(frontPeakX, frontPeakY);
  ctx.closePath();
  ctx.fillStyle = frontGableCol;
  ctx.fill();
  ctx.stroke();
}

function drawIsoArchLeftWall(ctx, cx, by, rx, ry, tCenter, archW, archH, fillCol = '#1E110A') {
  const ax = cx - rx * (1 - tCenter);
  const ay = by - ry * (1 - tCenter);
  ctx.beginPath();
  ctx.moveTo(ax - archW, ay - archW * 0.5);
  ctx.lineTo(ax - archW, ay - archW * 0.5 - archH * 0.65);
  ctx.quadraticCurveTo(ax, ay - archH * 1.15, ax + archW, ay + archW * 0.5 - archH * 0.65);
  ctx.lineTo(ax + archW, ay + archW * 0.5);
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#D97706';
  ctx.stroke();
}

function drawIsoWindowsRightWall(ctx, cx, by, rx, ry, wallH, count = 2, isNight = false) {
  const winCol = isNight ? '#FACC15' : '#38BDF8';
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const wx = cx + rx * t;
    const wy = by - ry * t - wallH * 0.52;
    ctx.beginPath();
    ctx.roundRect(wx - 4, wy - 6, 8, 11, 3);
    ctx.fillStyle = winCol;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#2B1810';
    ctx.stroke();
  }
}

function getBakedBuildingTexture(type, level = 1, wTiles = 1, hTiles = 1, isNight = false) {
  const cacheKey = `${type}_${level}_${wTiles}x${hTiles}_${isNight ? 'night' : 'day'}`;
  if (bakedCartoonTextures.has(cacheKey)) {
    return bakedCartoonTextures.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  const scale = 2; // 고해상도 레티나 베이킹
  const span = Math.max(wTiles, hTiles);
  const cw = (span * TILE_W + 60) * scale;
  const ch = (span * TILE_H + 170) * scale;
  canvas.width = cw;
  canvas.height = ch;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const cx = cw / (2 * scale);
  const by = ch / scale - 18; // 바닥 남쪽 꼭짓점(S) 기준점
  const rx = (span * TILE_W) * 0.44;
  const ry = (span * TILE_H) * 0.44;

  // 1. 공통 바닥 카툰 석조 주춧돌(Plinth)
  const plinthH = type === 'temple' ? 14 : 6;
  drawIsoBox2D(ctx, cx, by, rx, ry, plinthH, '#EDE0CC', '#DFCBB0', '#BFA582', '#3E2723', 2.2);

  const pBy = by - plinthH;
  const inRx = rx * 0.84;
  const inRy = ry * 0.84;

  // ── 🏠 주택 1~5단계 진화 ──
  if (type === 'house') {
    if (level === 1) {
      // 1단계: 유목민 카툰 텐트 + 줄무늬 러그 + 모닥불
      ctx.beginPath();
      ctx.moveTo(cx - inRx, pBy - inRy);
      ctx.lineTo(cx, pBy);
      ctx.lineTo(cx, pBy - inRy - 32);
      ctx.closePath();
      ctx.fillStyle = '#78350F';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, pBy);
      ctx.lineTo(cx + inRx, pBy - inRy);
      ctx.lineTo(cx, pBy - inRy - 32);
      ctx.closePath();
      ctx.fillStyle = '#451A03';
      ctx.fill();
      ctx.stroke();

      // 텐트 황금빛 줄무늬 장식
      ctx.beginPath();
      ctx.moveTo(cx - inRx * 0.5, pBy - inRy * 0.5);
      ctx.lineTo(cx, pBy - inRy - 32);
      ctx.lineTo(cx + inRx * 0.5, pBy - inRy * 0.5);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 6, 13, isNight ? '#F59E0B' : '#1C1917');
    } else if (level === 2) {
      // 2단계: 갈릴리 흙벽돌집 + 나무 서까래 + 옥상 양탄자 & 항아리
      const wH = 26;
      drawIsoBox2D(ctx, cx, pBy, inRx, inRy, wH, '#D9A773', '#F3C697', '#C28D58', '#3E2723');
      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 6, 14, '#451A03');
      drawIsoWindowsRightWall(ctx, cx, pBy, inRx, inRy, wH, 1, isNight);

      // 돌출 나무 서까래(Vigas) 3개
      [0.25, 0.5, 0.75].forEach(t => {
        const vx = cx - inRx * (1 - t);
        const vy = pBy - inRy * (1 - t) - wH + 4;
        ctx.beginPath();
        ctx.arc(vx, vy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#451A03';
        ctx.fill();
      });

      // 옥상 점토 물항아리 2개
      ctx.beginPath();
      ctx.arc(cx - 5, pBy - inRy - wH - 3, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#B45309';
      ctx.fill();
      ctx.stroke();
    } else if (level === 3) {
      // 3단계: 석회암 평지붕 가옥 + 다락방 + 옥상 야자수 화분
      const wH = 32;
      drawIsoBox2D(ctx, cx, pBy, inRx, inRy, wH, '#EAE0D0', '#FFFDF9', '#D6C7B2', '#334155');
      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.45, 6.5, 16, '#5C2E0B');
      drawIsoWindowsRightWall(ctx, cx, pBy, inRx, inRy, wH, 2, isNight);

      // 옥상 테라코타 다락방
      drawIsoBox2D(ctx, cx, pBy - inRy * 0.4 - wH, inRx * 0.55, inRy * 0.55, 13, '#EA580C', '#FFFBEB', '#CBD5E1', '#334155', 1.8);
    } else if (level === 4) {
      // 4단계: 다윗성 2층 테라코타 기와 빌라
      const wH = 38;
      drawIsoBox2D(ctx, cx, pBy, inRx, inRy, wH, '#F8FAFC', '#FFFFFF', '#E2E8F0', '#1E293B');
      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 7, 17, '#7C2D12');
      drawIsoWindowsRightWall(ctx, cx, pBy, inRx, inRy, wH, 2, isNight);
      drawPitchedRoof2D(ctx, cx, pBy, inRx * 1.06, inRy * 1.06, wH, 16, '#EA580C', '#C2410C', '#FFFBEB', '#431407');
    } else {
      // 5단계: 로마-헤롯식 황금 대리석 궁정
      const wH = 44;
      drawIsoBox2D(ctx, cx, pBy, inRx, inRy, wH, '#FFFFFF', '#FFFFFF', '#E2E8F0', '#1E293B');
      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 8, 20, '#9A3412');
      drawIsoWindowsRightWall(ctx, cx, pBy, inRx, inRy, wH, 3, isNight);
      drawPitchedRoof2D(ctx, cx, pBy, inRx * 1.08, inRy * 1.08, wH, 19, '#FACC15', '#D97706', '#FEF08A', '#78350F');
    }
  }

  // ── 👑 헤롯 제2성전 (3x3 대성전 랜드마크) ──
  else if (type === 'temple') {
    // 1) 외소 성전 뜰 회랑 성벽
    drawIsoBox2D(ctx, cx, pBy, rx * 0.94, ry * 0.94, 18, '#F8FAFC', '#FFFFFF', '#CBD5E1', '#334155', 2.2);

    // 2) 성전 본관(Heikhal) 대리석 & 황금 성소
    const sBy = pBy - ry * 0.25 - 18;
    const sRx = rx * 0.56;
    const sRy = ry * 0.56;
    const sH = 68;
    drawIsoBox2D(ctx, cx, sBy, sRx, sRy, sH, '#FACC15', '#FFFBEB', '#E2E8F0', '#78350F', 2.5);

    // 3) 성소 전면 4대 황금 기둥과 거대한 성전 문
    [0.2, 0.4, 0.6, 0.8].forEach(t => {
      const colX = cx - sRx * (1 - t);
      const colY = sBy - sRy * (1 - t);
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.6;
      ctx.fillRect(colX - 3, colY - sH + 8, 6, sH - 8);
      ctx.strokeRect(colX - 3, colY - sH + 8, 6, sH - 8);
    });
    drawIsoArchLeftWall(ctx, cx, sBy, sRx, sRy, 0.5, 12, 42, '#7C2D12');

    // 4) 상단 황금 면류관 지붕 장식
    drawIsoBox2D(ctx, cx, sBy - sH, sRx * 1.06, sRy * 1.06, 10, '#FEF08A', '#FACC15', '#CA8A04', '#713F12', 2.2);

    // 5) 마당의 놋번제단
    ctx.beginPath();
    ctx.arc(cx + 22, pBy - 24, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#9A3412';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 22, pBy - 28, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
  }

  // ── 🕍 가버나움 백색 회당 (2x2) ──
  else if (type === 'synagogue') {
    const wH = 40;
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, wH, '#F1F5F9', '#FFFFFF', '#CBD5E1', '#1E293B');
    drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 10, 24, '#1E3A8A');
    drawIsoWindowsRightWall(ctx, cx, pBy, inRx, inRy, wH, 3, isNight);
    drawPitchedRoof2D(ctx, cx, pBy, inRx * 1.05, inRy * 1.05, wH, 18, '#0284C7', '#0369A1', '#F8FAFC', '#0C4A6E');
  }

  // ── 🌉 실로암 수로교 (1x1 아치형 교각 — 검은 줄 버그 완전 해결!) ──
  else if (type === 'aqueduct') {
    const aH = 30;
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, aH, '#38BDF8', '#F5EBE0', '#CBD5E1', '#334155');
    // 교각 아치 통로
    drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 9, 19, '#18120C');
    // 상단 푸른 수로 물길
    drawIsoBox2D(ctx, cx, pBy - aH + 2, inRx * 1.02, inRy * 1.02, 6, '#0EA5E9', '#E2E8F0', '#94A3B8', '#1E293B');
  }

  // ── 💧 야곱의 우물 & ⛲ 대리석 분수 ──
  else if (type === 'well' || type === 'fountain') {
    const centerY = pBy - inRy;
    const radX = type === 'fountain' ? 38 : 20;
    const radY = type === 'fountain' ? 21 : 11;

    // 원형 대리석 수조
    ctx.beginPath();
    ctx.ellipse(cx, centerY, radX, radY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, centerY - 2, radX * 0.78, radY * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.stroke();

    if (type === 'well') {
      // 목조 지붕 프레임
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 12, centerY);
      ctx.lineTo(cx - 12, centerY - 24);
      ctx.moveTo(cx + 12, centerY);
      ctx.lineTo(cx + 12, centerY - 24);
      ctx.stroke();
      drawPitchedRoof2D(ctx, cx, centerY + 6, 18, 9, 26, 9, '#B45309', '#78350F', '#FDE68A', '#451A03');
    } else {
      // 분수 중앙 조각 탑
      drawIsoBox2D(ctx, cx, centerY + 4, 10, 5, 26, '#38BDF8', '#FFFFFF', '#CBD5E1', '#334155', 1.8);
    }
  }

  // ── 🍞 장터 · 수산시장 · 제물시장 · 환전소 · 캐러밴 (화려한 줄무늬 천막과 상품 매대) ──
  else if (['bread_market', 'fish_market', 'sacrifice_market', 'money_changer', 'caravan'].includes(type)) {
    const awningCol =
      type === 'fish_market' ? '#0284C7' :
      type === 'bread_market' ? '#EA580C' :
      type === 'sacrifice_market' ? '#9333EA' :
      type === 'money_changer' ? '#EAB308' : '#B45309';

    // 하단 나무 카운터 매대
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, 12, '#FDE68A', '#A16207', '#78350F', '#271810');

    // 매대 위 상품 바구니 (빵, 생선, 금화 등)
    [-14, 0, 14].forEach((dx, i) => {
      ctx.beginPath();
      ctx.arc(cx + dx, pBy - inRy - 13, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = i === 1 ? '#FEF08A' : awningCol;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#271810';
      ctx.stroke();
    });

    // 4개 목조 기둥
    const postH = 28;
    [
      [cx - inRx * 0.85, pBy - inRy],
      [cx + inRx * 0.85, pBy - inRy],
      [cx, pBy - 2],
      [cx, pBy - inRy * 1.85]
    ].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px, py - 10);
      ctx.lineTo(px, py - postH);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#451A03';
      ctx.stroke();
    });

    // 상단 카툰 줄무늬 차양막 지붕
    drawPitchedRoof2D(ctx, cx, pBy, inRx * 1.06, inRy * 1.06, postH, 12, awningCol, '#FFFBEB', awningCol, '#271810');
  }

  // ── 🌾 밀밭 · 포도원 · 올리브원 · 어선 선착장 · 곡물창고 ──
  else if (['wheat_farm', 'vineyard', 'olive_grove', 'fishery', 'granary'].includes(type)) {
    const fieldC =
      type === 'wheat_farm' ? '#FACC15' :
      type === 'vineyard' ? '#4ADE80' :
      type === 'fishery' ? '#0284C7' : '#84CC16';

    drawIsoBox2D(ctx, cx, pBy, rx * 0.92, ry * 0.92, 5, fieldC, '#65A30D', '#3F6212', '#14532D');

    if (type === 'wheat_farm' || type === 'granary') {
      // 이랑 무늬 + 풍차 타워 본체
      drawIsoBox2D(ctx, cx, pBy - ry * 0.35 - 5, inRx * 0.45, inRy * 0.45, 42, '#D97706', '#FFFBEB', '#E7D8C1', '#451A03');
      drawPitchedRoof2D(ctx, cx, pBy - ry * 0.35 - 5, inRx * 0.5, inRy * 0.5, 42, 14, '#B45309', '#78350F', '#FDE68A', '#271810');
    } else if (type === 'olive_grove' || type === 'vineyard') {
      // 풍성한 카툰 과수원 나무 4그루
      [
        [cx - 22, pBy - inRy - 4],
        [cx + 22, pBy - inRy - 4],
        [cx, pBy - inRy - 16],
        [cx, pBy - inRy + 8]
      ].forEach(([tx, ty]) => {
        ctx.fillStyle = '#5C2E0B';
        ctx.fillRect(tx - 2.5, ty - 16, 5, 14);
        ctx.beginPath();
        ctx.arc(tx, ty - 20, 10, 0, Math.PI * 2);
        ctx.fillStyle = type === 'vineyard' ? '#16A34A' : '#4D7C0F';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#14532D';
        ctx.stroke();

        // 열매 송이
        ctx.beginPath();
        ctx.arc(tx + 3, ty - 19, 3, 0, Math.PI * 2);
        ctx.fillStyle = type === 'vineyard' ? '#9333EA' : '#1E293B';
        ctx.fill();
      });
    } else if (type === 'fishery') {
      // 목조 부두 & 갈릴리 돛단배
      const centerY = pBy - inRy - 6;
      ctx.beginPath();
      ctx.moveTo(cx - 20, centerY);
      ctx.lineTo(cx + 20, centerY);
      ctx.lineTo(cx + 13, centerY + 9);
      ctx.lineTo(cx - 13, centerY + 9);
      ctx.closePath();
      ctx.fillStyle = '#78350F';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, centerY - 28);
      ctx.lineTo(cx + 16, centerY - 3);
      ctx.lineTo(cx - 10, centerY - 3);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── ✝️ 골고다 언덕 · 팔복 동산 · 겟세마네 ──
  else if (['golgotha', 'beatitudes', 'gethsemane'].includes(type)) {
    const topC = type === 'golgotha' ? '#A8A29E' : '#84CC16';
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, 12, topC, '#78716C', '#57534E', '#292524');
    drawIsoBox2D(ctx, cx, pBy - inRy * 0.3 - 12, inRx * 0.65, inRy * 0.65, 12, topC, '#78716C', '#44403C', '#292524');

    const topY = pBy - inRy - 24;
    if (type === 'golgotha') {
      [[-18, 4, 22], [0, 0, 34], [18, 4, 22]].forEach(([dx, dy, ch]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx, topY + dy);
        ctx.lineTo(cx + dx, topY + dy - ch);
        ctx.moveTo(cx + dx - 8, topY + dy - ch * 0.7);
        ctx.lineTo(cx + dx + 8, topY + dy - ch * 0.7);
        ctx.lineWidth = dx === 0 ? 4 : 3;
        ctx.strokeStyle = '#451A03';
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.arc(cx, topY - 12, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#15803D';
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── 🧱 성벽 · 성문 · 망대 ──
  else if (['wall', 'gate', 'tower'].includes(type)) {
    const h = type === 'tower' ? 52 : type === 'gate' ? 38 : 28;
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, h, '#D6C7B2', '#EDE0CC', '#B8A68E', '#292524');
    // 상단 성가퀴 요철
    drawIsoBox2D(ctx, cx, pBy - h, inRx * 1.04, inRy * 1.04, 6, '#EDE0CC', '#F5EBE0', '#C8B6A6', '#292524');
    if (type === 'gate') {
      drawIsoArchLeftWall(ctx, cx, pBy, inRx, inRy, 0.5, 12, 24, '#1E110A');
    }
  } else {
    drawIsoBox2D(ctx, cx, pBy, inRx, inRy, 26, '#E7D8C1', '#F5EBE0', '#C8B6A6', '#3E2723');
  }

  const tex = PIXI.Texture.from(canvas);
  const result = {
    tex,
    anchorX: 0.5,
    anchorY: (ch / scale - 18) / (ch / scale)
  };
  bakedCartoonTextures.set(cacheKey, result);
  return result;
}

export default function GameEngine({
  overlayMode = 'normal',
  timeOfDay = 'day',
  floatingEvents = [],
  harvestBubbles = [],
  onHarvestBubbleClick,
  onWalkerClick
}) {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const viewportRef = useRef(null);

  const { grid, walkers, selectedTool, buildAt, demolishAt, setInspectedTile } = useTycoonStore();
  const stateRef = useRef({
    grid,
    walkers,
    selectedTool,
    overlayMode,
    timeOfDay,
    floatingEvents,
    harvestBubbles,
    onHarvestBubbleClick,
    onWalkerClick
  });
  stateRef.current = {
    grid,
    walkers,
    selectedTool,
    overlayMode,
    timeOfDay,
    floatingEvents,
    harvestBubbles,
    onHarvestBubbleClick,
    onWalkerClick
  };

  const walkerInterpRef = useRef(new Map());
  const floatTextPoolRef = useRef(new Map());
  const bubbleTextPoolRef = useRef(new Map());
  const bldgSpritePoolRef = useRef(new Map());
  const spawnTimeMapRef = useRef(new Map());

  const getTileCenter = (r, c, elev = 0) => ({
    x: (c - r) * (TILE_W / 2) + ORIG_X,
    y: (c + r) * (TILE_H / 2) + ORIG_Y - elev
  });

  const getMultiTileBase = (r, c, w = 1, h = 1, elev = 0) => {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    return {
      N: { x: (c - r) * hw + ORIG_X, y: (c + r) * hh - hh + ORIG_Y - elev },
      E: { x: (c + w - r) * hw + ORIG_X, y: (c + w + r) * hh - hh + ORIG_Y - elev },
      S: { x: (c + w - (r + h)) * hw + ORIG_X, y: (c + w + r + h) * hh - hh + ORIG_Y - elev },
      W: { x: (c - (r + h)) * hw + ORIG_X, y: (c + r + h) * hh - hh + ORIG_Y - elev }
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
      backgroundColor: 0x18120C,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
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
        .clampZoom({ minScale: 0.45, maxScale: 2.35 });

      viewport.moveCenter(0, 110);

      // 🌟 다층 카툰 디오라마 레이어
      const bedrockGfx = new PIXI.Graphics();
      const groundGfx = new PIXI.Graphics();
      const overlayGfx = new PIXI.Graphics();
      const castShadowGfx = new PIXI.Graphics();
      const bldgSpriteContainer = new PIXI.Container();
      bldgSpriteContainer.sortableChildren = true;
      const animPartsGfx = new PIXI.Graphics();
      const walkerGfx = new PIXI.Graphics();
      const previewGfx = new PIXI.Graphics();
      const fxGfx = new PIXI.Graphics();
      const bubbleGfx = new PIXI.Graphics();
      const bubbleTextContainer = new PIXI.Container();
      const floatTextContainer = new PIXI.Container();
      const nightGlowGfx = new PIXI.Graphics();

      viewport.addChild(bedrockGfx);
      viewport.addChild(groundGfx);
      viewport.addChild(overlayGfx);
      viewport.addChild(castShadowGfx);
      viewport.addChild(bldgSpriteContainer);
      viewport.addChild(animPartsGfx);
      viewport.addChild(walkerGfx);
      viewport.addChild(previewGfx);
      viewport.addChild(fxGfx);
      viewport.addChild(bubbleGfx);
      viewport.addChild(bubbleTextContainer);
      viewport.addChild(floatTextContainer);
      viewport.addChild(nightGlowGfx);

      let hoverTile = null;
      let isDragBuilding = false;
      let lastDragBuiltKey = '';

      viewport.on('pointermove', (e) => {
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const tile = worldToTile(worldPos.x, worldPos.y);
        if (tile.r >= 0 && tile.r < MAP_SIZE && tile.c >= 0 && tile.c < MAP_SIZE) {
          hoverTile = tile;

          const { selectedTool: curTool } = stateRef.current;
          if (isDragBuilding && ['road', 'plaza', 'wall'].includes(curTool)) {
            const tileKey = `${tile.r}-${tile.c}`;
            if (tileKey !== lastDragBuiltKey) {
              lastDragBuiltKey = tileKey;
              const bMeta = BUILDINGS[curTool];
              if (bMeta) {
                const ok = buildAt(tile.r, tile.c, bMeta);
                if (ok) spawnTimeMapRef.current.set(tileKey, Date.now());
              }
            }
          }
        } else {
          hoverTile = null;
        }
      });

      let touchStartTime = 0;
      let touchStartPos = { x: 0, y: 0 };

      viewport.on('pointerdown', (e) => {
        touchStartTime = Date.now();
        touchStartPos = { x: e.global.x, y: e.global.y };

        // 1) 수확 버블 터치 최우선 감지
        const worldPos = viewport.toWorld(e.global.x, e.global.y);
        const { harvestBubbles: curBubbles, onHarvestBubbleClick: harvestCb, grid: curGrid } = stateRef.current;
        if (curBubbles && curBubbles.length > 0 && harvestCb) {
          for (let i = 0; i < curBubbles.length; i++) {
            const b = curBubbles[i];
            const elev = getTileElevation(b.r, b.c, curGrid[b.r]?.[b.c]);
            const pos = getTileCenter(b.r, b.c, elev);
            if (Math.hypot(worldPos.x - pos.x, worldPos.y - (pos.y - 58)) < 28) {
              harvestCb(b);
              return;
            }
          }
        }

        const { selectedTool: curTool } = stateRef.current;
        if (['road', 'plaza', 'wall'].includes(curTool) && hoverTile) {
          isDragBuilding = true;
          const tKey = `${hoverTile.r}-${hoverTile.c}`;
          lastDragBuiltKey = tKey;
          viewport.plugins.pause('drag');
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const ok = buildAt(hoverTile.r, hoverTile.c, bMeta);
            if (ok) spawnTimeMapRef.current.set(tKey, Date.now());
          }
        }
      });

      viewport.on('pointerup', (e) => {
        if (isDragBuilding) {
          isDragBuilding = false;
          viewport.plugins.resume('drag');
          return;
        }

        const elapsed = Date.now() - touchStartTime;
        const dist = Math.hypot(e.global.x - touchStartPos.x, e.global.y - touchStartPos.y);

        if (elapsed < 350 && dist < 12) {
          const worldPos = viewport.toWorld(e.global.x, e.global.y);

          const {
            harvestBubbles: curBubbles,
            onHarvestBubbleClick: harvestCb,
            walkers: curWalkers,
            onWalkerClick: walkerCb,
            grid: curGrid,
            selectedTool: curTool
          } = stateRef.current;

          if (curBubbles && curBubbles.length > 0 && harvestCb) {
            for (let i = 0; i < curBubbles.length; i++) {
              const b = curBubbles[i];
              const elev = getTileElevation(b.r, b.c, curGrid[b.r]?.[b.c]);
              const pos = getTileCenter(b.r, b.c, elev);
              if (Math.hypot(worldPos.x - pos.x, worldPos.y - (pos.y - 58)) < 28) {
                harvestCb(b);
                return;
              }
            }
          }

          for (let i = 0; i < curWalkers.length; i++) {
            const wk = curWalkers[i];
            const interp = walkerInterpRef.current.get(wk.id || i) || { r: wk.r, c: wk.c };
            const elev = getTileElevation(Math.round(interp.r), Math.round(interp.c), curGrid[Math.round(interp.r)]?.[Math.round(interp.c)]);
            const wPos = getTileCenter(interp.r, interp.c, elev);
            if (Math.hypot(worldPos.x - wPos.x, worldPos.y - (wPos.y - 12)) < 24) {
              if (walkerCb) {
                const pool = WALKER_THOUGHTS[wk.type] || WALKER_THOUGHTS.merchant;
                const randomThought = pool.thoughts[i % pool.thoughts.length];
                walkerCb({ type: wk.type, name: pool.name, thought: randomThought });
              }
              return;
            }
          }

          if (hoverTile) {
            const { r, c } = hoverTile;
            const clicked = curGrid[r]?.[c];

            if (curTool === 'inspect') {
              if (clicked) {
                const rootR = clicked.isRoot ? r : clicked.rootR;
                const rootC = clicked.isRoot ? c : clicked.rootC;
                const rootCell = curGrid[rootR]?.[rootC];
                if (rootCell) setInspectedTile({ ...rootCell, r: rootR, c: rootC });
              }
              return;
            }

            if (curTool === 'demolish') {
              demolishAt(r, c);
              return;
            }

            const bMeta = BUILDINGS[curTool];
            if (bMeta) {
              const built = buildAt(r, c, bMeta);
              if (built) {
                spawnTimeMapRef.current.set(`${r}-${c}`, Date.now());
              } else if (clicked) {
                const rootR = clicked.isRoot ? r : clicked.rootR;
                const rootC = clicked.isRoot ? c : clicked.rootC;
                const rootCell = curGrid[rootR]?.[rootC];
                if (rootCell) setInspectedTile({ ...rootCell, r: rootR, c: rootC });
              }
            }
          }
        }
      });

      let simTick = 0;

      // ── 🔄 60FPS 메인 루프 ──
      app.ticker.add((time) => {
        simTick += time.deltaTime * 0.05;
        const nowMs = Date.now();
        const {
          grid: curGrid,
          walkers: curWalkers,
          selectedTool: curTool,
          overlayMode: curOverlay,
          timeOfDay: curTimeOfDay,
          floatingEvents: curFloating,
          harvestBubbles: curBubbles
        } = stateRef.current;

        const isNight = curTimeOfDay === 'night' || curTimeOfDay === 'sunset';
        if (curTimeOfDay === 'night') app.renderer.background.color = 0x090D16;
        else if (curTimeOfDay === 'sunset') app.renderer.background.color = 0x2B1206;
        else app.renderer.background.color = 0x18120C;

        // [1] 3D 디오라마 대지 암반 두께
        bedrockGfx.clear();
        const wholeMapBase = getMultiTileBase(0, 0, MAP_SIZE, MAP_SIZE, 0);
        const slabDepth = 46;

        bedrockGfx.poly([
          wholeMapBase.N.x, wholeMapBase.N.y + slabDepth + 20,
          wholeMapBase.E.x + 14, wholeMapBase.E.y + slabDepth + 20,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth + 28,
          wholeMapBase.W.x - 14, wholeMapBase.W.y + slabDepth + 20
        ]);
        bedrockGfx.fill({ color: 0x000000, alpha: 0.6 });

        bedrockGfx.poly([
          wholeMapBase.W.x, wholeMapBase.W.y,
          wholeMapBase.S.x, wholeMapBase.S.y,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth,
          wholeMapBase.W.x, wholeMapBase.W.y + slabDepth
        ]);
        bedrockGfx.fill(0x8C6D46);
        bedrockGfx.stroke({ width: 2, color: 0x3E2723 });

        bedrockGfx.poly([
          wholeMapBase.S.x, wholeMapBase.S.y,
          wholeMapBase.E.x, wholeMapBase.E.y,
          wholeMapBase.E.x, wholeMapBase.E.y + slabDepth,
          wholeMapBase.S.x, wholeMapBase.S.y + slabDepth
        ]);
        bedrockGfx.fill(0x5C4328);
        bedrockGfx.stroke({ width: 2, color: 0x271810 });

        // [2] 지형 타일 & 도로 렌더링
        groundGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            const terrain = getNaturalTerrainType(r, c);
            const elev = getTileElevation(r, c, cell);
            const { x: cx, y: cy } = getTileCenter(r, c, elev);
            const isHov = hoverTile && hoverTile.r === r && hoverTile.c === c;

            if (elev > 0) {
              const tBase = getMultiTileBase(r, c, 1, 1, 0);
              // 시온산 고지대 절벽 측면
              groundGfx.poly([
                tBase.W.x, tBase.W.y - elev,
                tBase.S.x, tBase.S.y - elev,
                tBase.S.x, tBase.S.y,
                tBase.W.x, tBase.W.y
              ]);
              groundGfx.fill(0xD6C1A0);
              groundGfx.poly([
                tBase.S.x, tBase.S.y - elev,
                tBase.E.x, tBase.E.y - elev,
                tBase.E.x, tBase.E.y,
                tBase.S.x, tBase.S.y
              ]);
              groundGfx.fill(0xA68A64);
            }

            let tileColor = (r + c) % 2 === 0 ? 0xEFE2C8 : 0xE7D6B7;
            if (terrain === 'zion_plateau') tileColor = (r + c) % 2 === 0 ? 0xFBF6EE : 0xF3E9D8;
            if (!cell) {
              if (terrain === 'water') tileColor = 0x0284C7;
              else if (terrain === 'meadow') tileColor = 0x86EFAC;
            } else if (cell.type === 'road') {
              tileColor = 0xD6C5A9;
            } else if (cell.type === 'plaza') {
              tileColor = 0xF8FAFC;
            }

            if (isHov) tileColor = 0xFDE047;

            groundGfx.poly([
              cx, cy - TILE_H / 2,
              cx + TILE_W / 2, cy,
              cx, cy + TILE_H / 2,
              cx - TILE_W / 2, cy
            ]);
            groundGfx.fill(tileColor);
            groundGfx.stroke({
              width: isHov ? 2 : 0.9,
              color: isHov ? 0xD97706 : terrain === 'water' ? 0x0369A1 : 0xCBB592
            });

            if (!cell && terrain === 'water') {
              const wave = Math.sin(simTick * 2.2 + r * 0.8 + c) * 5;
              groundGfx.moveTo(cx - 12 + wave, cy - 3);
              groundGfx.lineTo(cx + 4 + wave, cy - 3);
              groundGfx.moveTo(cx - 6 - wave, cy + 4);
              groundGfx.lineTo(cx + 10 - wave, cy + 4);
              groundGfx.stroke({ width: 1.8, color: 0xBAE6FD, alpha: 0.85 });
            }

            if (!cell && terrain === 'palm_tree') {
              const sway = Math.sin(simTick * 1.6 + r) * 2.5;
              groundGfx.ellipse(cx + 4, cy + 2, 9, 4.5);
              groundGfx.fill({ color: 0x1E140A, alpha: 0.25 });
              groundGfx.moveTo(cx, cy + 2);
              groundGfx.quadraticCurveTo(cx + 3, cy - 12, cx + sway, cy - 24);
              groundGfx.stroke({ width: 4, color: 0x78350F });
              [-8, 0, 8].forEach((dx, i) => {
                groundGfx.ellipse(cx + sway + dx, cy - 24 + Math.abs(dx) * 0.3, 7, 3.5);
                groundGfx.fill(i === 1 ? 0x22C55E : 0x15803D);
              });
            }

            if (cell?.type === 'road') {
              const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              dirs.forEach(([dr, dc]) => {
                const nb = curGrid[r + dr]?.[c + dc];
                if (nb && ['road', 'plaza', 'gate'].includes(nb.type)) {
                  const nElev = getTileElevation(r + dr, c + dc, nb);
                  const nPos = getTileCenter(r + dr, c + dc, nElev);
                  groundGfx.moveTo(cx, cy);
                  groundGfx.lineTo((cx + nPos.x) / 2, (cy + nPos.y) / 2);
                  groundGfx.stroke({ width: 20, color: 0x8C7355 });
                  groundGfx.moveTo(cx, cy);
                  groundGfx.lineTo((cx + nPos.x) / 2, (cy + nPos.y) / 2);
                  groundGfx.stroke({ width: 14, color: 0xE5D3B3 });
                }
              });
            }
          }
        }

        // [3] 오버레이 히트맵
        overlayGfx.clear();
        if (curOverlay !== 'normal') {
          for (let r = 0; r < MAP_SIZE; r++) {
            for (let c = 0; c < MAP_SIZE; c++) {
              const cell = curGrid[r]?.[c];
              if (!cell || !cell.isRoot) continue;
              const elev = getTileElevation(r, c, cell);
              const { x: cx, y: cy } = getTileCenter(r, c, elev);

              let radiusTiles = 0;
              let auraColor = 0x38BDF8;
              if (curOverlay === 'water' && ['well', 'aqueduct', 'fountain'].includes(cell.type)) {
                radiusTiles = cell.type === 'fountain' ? 4.5 : 3.5;
                auraColor = 0x0284C7;
              } else if (curOverlay === 'food' && ['bread_market', 'fish_market', 'wheat_farm', 'fishery', 'granary'].includes(cell.type)) {
                radiusTiles = 4.5;
                auraColor = 0x16A34A;
              } else if (curOverlay === 'faith' && ['synagogue', 'temple', 'golgotha', 'beatitudes'].includes(cell.type)) {
                radiusTiles = cell.type === 'temple' ? 6.5 : 4.5;
                auraColor = 0x9333EA;
              }

              if (radiusTiles > 0) {
                overlayGfx.ellipse(cx, cy, radiusTiles * (TILE_W * 0.62), radiusTiles * (TILE_H * 0.62));
                overlayGfx.fill({ color: auraColor, alpha: 0.2 });
                overlayGfx.stroke({ width: 2.5, color: auraColor, alpha: 0.85 });
              }
            }
          }
        }

        // [4 & 5] 고해상도 베이크드 카툰 스프라이트 배치 (폴리곤 찢어짐 0% 보장!)
        castShadowGfx.clear();
        animPartsGfx.clear();
        nightGlowGfx.clear();

        const activeSpriteKeys = new Set();

        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (!cell || !cell.isRoot || cell.type === 'road' || cell.type === 'plaza') continue;

            const { type, level = 1, w = 1, h = 1 } = cell;
            const elev = getTileElevation(r, c, cell);
            const base = getMultiTileBase(r, c, w, h, elev);
            const sKey = `${r}-${c}`;
            activeSpriteKeys.add(sKey);

            // 건설 스프링 바운스 애니메이션
            const builtAt = spawnTimeMapRef.current.get(sKey) || 0;
            const ageMs = nowMs - builtAt;
            let scaleY = 1.0;
            if (ageMs < 550) {
              const t = ageMs / 550;
              scaleY = Math.min(1.12, Math.sin(t * Math.PI * 0.75) * 1.12);
            }

            // 바닥 밀착 그림자
            castShadowGfx.poly([
              base.N.x, base.N.y - 2,
              base.E.x + 6, base.E.y + 2,
              base.S.x, base.S.y + 7,
              base.W.x - 6, base.W.y + 2
            ]);
            castShadowGfx.fill({ color: 0x0F0904, alpha: 0.45 });

            // 베이크드 카툰 텍스처 가져오기
            const baked = getBakedBuildingTexture(type, level, w, h, isNight);
            let spr = bldgSpritePoolRef.current.get(sKey);
            if (!spr) {
              spr = new PIXI.Sprite(baked.tex);
              bldgSpriteContainer.addChild(spr);
              bldgSpritePoolRef.current.set(sKey, spr);
            } else if (spr.texture !== baked.tex) {
              spr.texture = baked.tex;
            }

            spr.anchor.set(baked.anchorX, baked.anchorY);
            spr.x = base.S.x;
            spr.y = base.S.y;
            spr.scale.set(0.5, 0.5 * scaleY);
            spr.zIndex = (r + h) + (c + w);

            // 🎡 풍차 회전 날개
            if (type === 'wheat_farm' || type === 'granary') {
              const hubX = base.S.x;
              const hubY = base.S.y - 64 * scaleY;
              for (let bIdx = 0; bIdx < 4; bIdx++) {
                const angle = simTick * 1.6 + (bIdx * Math.PI) / 2;
                const tipX = hubX + Math.cos(angle) * 24;
                const tipY = hubY + Math.sin(angle) * 24;
                const sideX = hubX + Math.cos(angle + 0.28) * 18;
                const sideY = hubY + Math.sin(angle + 0.28) * 18;

                animPartsGfx.poly([hubX, hubY, tipX, tipY, sideX, sideY]);
                animPartsGfx.fill(0xFFFBEB);
                animPartsGfx.stroke({ width: 1.5, color: 0x451A03 });
              }
            }

            // ⛲ 분수대 물줄기
            if (type === 'fountain') {
              const fX = base.S.x;
              const fY = base.S.y - 46 * scaleY;
              for (let d = 0; d < 4; d++) {
                const t = (simTick * 1.8 + d * 0.25) % 1;
                const dropX = fX + (d % 2 === 0 ? 1 : -1) * (t * 18);
                const dropY = fY - Math.sin(t * Math.PI) * 15 + t * 14;
                animPartsGfx.circle(dropX, dropY, 3);
                animPartsGfx.fill({ color: 0xE0F2FE, alpha: 1 - t * 0.6 });
              }
            }

            if (isNight) {
              nightGlowGfx.circle(base.S.x, base.S.y - 28, type === 'temple' ? 65 : 26);
              nightGlowGfx.fill({ color: 0xF59E0B, alpha: curTimeOfDay === 'night' ? 0.24 : 0.12 });
            }
          }
        }

        // 철거된 건물 스프라이트 정리
        bldgSpritePoolRef.current.forEach((spr, key) => {
          if (!activeSpriteKeys.has(key)) {
            bldgSpriteContainer.removeChild(spr);
            spr.destroy();
            bldgSpritePoolRef.current.delete(key);
          }
        });

        // [6] 보행자(Walker) 렌더링
        walkerGfx.clear();
        curWalkers.forEach((w, wIdx) => {
          const wKey = w.id || wIdx;
          const prevInterp = walkerInterpRef.current.get(wKey) || { r: w.r, c: w.c };
          const nextR = prevInterp.r + (w.r - prevInterp.r) * 0.08;
          const nextC = prevInterp.c + (w.c - prevInterp.c) * 0.08;
          walkerInterpRef.current.set(wKey, { r: nextR, c: nextC });

          const gridR = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(nextR)));
          const gridC = Math.max(0, Math.min(MAP_SIZE - 1, Math.round(nextC)));
          const elev = getTileElevation(gridR, gridC, curGrid[gridR]?.[gridC]);
          const { x: cx, y: cy } = getTileCenter(nextR, nextC, elev);
          const bounce = Math.abs(Math.sin(simTick * 4.5 + wIdx)) * 3;
          const charY = cy - bounce;

          walkerGfx.ellipse(cx, cy + 2, 7, 3.5);
          walkerGfx.fill({ color: 0x1A0F07, alpha: 0.4 });

          if (w.type === 'jesus') {
            walkerGfx.circle(cx, charY - 21, 10);
            walkerGfx.fill({ color: 0xFBBF24, alpha: 0.85 });
            walkerGfx.circle(cx, charY - 18, 5.5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.4, color: 0x271810 });
            walkerGfx.rect(cx - 4.5, charY - 12, 9, 13);
            walkerGfx.fill(0xFFFFFF);
            walkerGfx.stroke({ width: 1.4, color: 0x271810 });
          } else if (w.type === 'disciple') {
            walkerGfx.circle(cx, charY - 16, 5);
            walkerGfx.fill(0xFDE68A);
            walkerGfx.stroke({ width: 1.4, color: 0x271810 });
            walkerGfx.rect(cx - 3.5, charY - 11, 7, 11);
            walkerGfx.fill(0x0284C7);
            walkerGfx.stroke({ width: 1.4, color: 0x271810 });
          } else {
            walkerGfx.rect(cx - 5.5, charY - 8, 11, 7);
            walkerGfx.fill(0xD97706);
            walkerGfx.stroke({ width: 1.4, color: 0x271810 });
          }
        });

        // [7] 건설 홀로그램 타일 표시
        previewGfx.clear();
        if (hoverTile && curTool !== 'demolish' && curTool !== 'inspect') {
          const bMeta = BUILDINGS[curTool];
          if (bMeta) {
            const { r, c } = hoverTile;
            const w = bMeta.w || 1;
            const h = bMeta.h || 1;
            const elev = getTileElevation(r, c, curGrid[r]?.[c]);
            const base = getMultiTileBase(r, c, w, h, elev);

            let canBuild = true;
            for (let dr = 0; dr < h; dr++) {
              for (let dc = 0; dc < w; dc++) {
                if (r + dr >= MAP_SIZE || c + dc >= MAP_SIZE || curGrid[r + dr]?.[c + dc]) {
                  canBuild = false;
                }
              }
            }

            previewGfx.poly([
              base.N.x, base.N.y,
              base.E.x, base.E.y,
              base.S.x, base.S.y,
              base.W.x, base.W.y
            ]);
            previewGfx.fill({ color: canBuild ? 0x34D399 : 0xF87171, alpha: 0.45 });
            previewGfx.stroke({ width: 2.5, color: 0xFFFFFF });
          }
        }

        // [8] 떠다니는 수확 버블(Tap-to-Harvest Bubbles) 렌더링
        bubbleGfx.clear();
        const activeBubbleIds = new Set();
        (curBubbles || []).forEach((b, bIdx) => {
          activeBubbleIds.add(b.id);
          const elev = getTileElevation(b.r, b.c, curGrid[b.r]?.[b.c]);
          const pos = getTileCenter(b.r, b.c, elev);
          const floatY = Math.sin(simTick * 3.2 + bIdx) * 4;
          const bx = pos.x;
          const by = pos.y - 58 + floatY;

          bubbleGfx.poly([bx - 5, by + 12, bx + 5, by + 12, bx, by + 20]);
          bubbleGfx.fill(0xFFFBEB);
          bubbleGfx.circle(bx, by, 16);
          bubbleGfx.fill(0xFFFBEB);
          bubbleGfx.stroke({ width: 2.5, color: 0xF59E0B });

          let bTxt = bubbleTextPoolRef.current.get(b.id);
          if (!bTxt) {
            bTxt = new PIXI.Text({
              text: b.icon || '💰',
              style: { fontSize: 16 }
            });
            bTxt.anchor.set(0.5, 0.5);
            bubbleTextContainer.addChild(bTxt);
            bubbleTextPoolRef.current.set(b.id, bTxt);
          }
          bTxt.x = bx;
          bTxt.y = by;
        });

        bubbleTextPoolRef.current.forEach((spr, id) => {
          if (!activeBubbleIds.has(id)) {
            bubbleTextContainer.removeChild(spr);
            spr.destroy();
            bubbleTextPoolRef.current.delete(id);
          }
        });

        // [9] 성전 번제단 연기 & 수확 텍스트
        fxGfx.clear();
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            const cell = curGrid[r]?.[c];
            if (cell?.type === 'temple' && cell.isRoot) {
              const elev = getTileElevation(r, c, cell);
              const tBase = getMultiTileBase(r, c, 3, 3, elev);
              const altarX = tBase.S.x + 22;
              const altarY = tBase.S.y - 34;

              for (let i = 1; i <= 5; i++) {
                const progress = (simTick * 0.4 + i * 0.2) % 1;
                const py = altarY - progress * 64;
                const px = altarX + Math.sin(simTick + i) * (progress * 14);
                fxGfx.circle(px, py, 4 + progress * 8);
                fxGfx.fill({ color: 0xFFFFFF, alpha: 0.75 - progress * 0.55 });
              }
            }
          }
        }

        const activeFloatIds = new Set();
        (curFloating || []).forEach(ev => {
          const age = nowMs - ev.createdAt;
          if (age > 2200) return;
          activeFloatIds.add(ev.id);

          let txtSpr = floatTextPoolRef.current.get(ev.id);
          if (!txtSpr) {
            txtSpr = new PIXI.Text({
              text: ev.text,
              style: {
                fontFamily: 'sans-serif',
                fontSize: 13,
                fontWeight: '900',
                fill: ev.color || '#FDE047',
                stroke: { color: '#1E140A', width: 3.5 }
              }
            });
            txtSpr.anchor.set(0.5, 0.5);
            floatTextContainer.addChild(txtSpr);
            floatTextPoolRef.current.set(ev.id, txtSpr);
          }

          const progress = age / 2200;
          const elev = getTileElevation(ev.r, ev.c, curGrid[ev.r]?.[ev.c]);
          const pos = getTileCenter(ev.r, ev.c, elev);
          txtSpr.x = pos.x;
          txtSpr.y = pos.y - 48 - progress * 38;
          txtSpr.alpha = 1 - Math.pow(progress, 2);
        });

        floatTextPoolRef.current.forEach((spr, id) => {
          if (!activeFloatIds.has(id)) {
            floatTextContainer.removeChild(spr);
            spr.destroy();
            floatTextPoolRef.current.delete(id);
          }
        });
      });
    });

    return () => {
      isMounted = false;
      floatTextPoolRef.current.clear();
      bubbleTextPoolRef.current.clear();
      bldgSpritePoolRef.current.clear();
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: false });
        pixiAppRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing touch-none" />
  );
}
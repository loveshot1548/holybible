// src/pages/BibleKnowledgeGalaxy.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getCrossReferences } from '../lib/tskHelper';
import { supabase } from '../lib/supabase';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🛡️ 모든 모바일/태블릿/PC 브라우저 100% 호환 도형 헬퍼 (둥근 사각형 & 정육각형)
// =====================================================================
function drawSafeRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawHexagonPath(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const vx = cx + radius * Math.cos(angle);
    const vy = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
}

// =====================================================================
// 🎨 TRACKTOR Segundo Cérebro 6대 시그니처 스페이스 테마 팔레트
// =====================================================================
const GALAXY_THEMES = {
  oceano: {
    id: 'oceano',
    name: 'Oceano (트랙터 시안)',
    bg: '#04080E',
    gridDot: 'rgba(56, 189, 248, 0.08)',
    orbitLine: 'rgba(45, 212, 191, 0.18)',
    textMain: '#E2F1FF',
    textSub: '#2DD4BF',
    accent: '#00F5D4',
    panelBg: 'rgba(7, 13, 22, 0.95)',
    panelBorder: 'rgba(45, 212, 191, 0.28)',
    swatches: ['#00F5D4', '#38BDF8', '#0284C7', '#6366F1', '#A855F7']
  },
  traktor: {
    id: 'traktor',
    name: 'Metálico Tracktor (골드)',
    bg: '#090806',
    gridDot: 'rgba(245, 158, 11, 0.08)',
    orbitLine: 'rgba(245, 158, 11, 0.18)',
    textMain: '#FFFBEB',
    textSub: '#FBBF24',
    accent: '#F59E0B',
    panelBg: 'rgba(16, 13, 10, 0.95)',
    panelBorder: 'rgba(245, 158, 11, 0.28)',
    swatches: ['#F59E0B', '#FBBF24', '#EA580C', '#38BDF8', '#A855F7']
  },
  rubric: {
    id: 'rubric',
    name: 'Rubric (크림슨 앰버)',
    bg: '#0A0607',
    gridDot: 'rgba(244, 63, 94, 0.08)',
    orbitLine: 'rgba(251, 113, 133, 0.18)',
    textMain: '#FFF1F2',
    textSub: '#FB7185',
    accent: '#F43F5E',
    panelBg: 'rgba(19, 10, 13, 0.95)',
    panelBorder: 'rgba(244, 63, 94, 0.28)',
    swatches: ['#FDBA74', '#FB923C', '#F43F5E', '#E11D48', '#EC4899']
  },
  neon: {
    id: 'neon',
    name: 'Neon (사이버 네온)',
    bg: '#05040A',
    gridDot: 'rgba(168, 85, 247, 0.09)',
    orbitLine: 'rgba(236, 72, 153, 0.18)',
    textMain: '#FAF5FF',
    textSub: '#F472B6',
    accent: '#22D3EE',
    panelBg: 'rgba(13, 9, 22, 0.95)',
    panelBorder: 'rgba(236, 72, 153, 0.28)',
    swatches: ['#A3E635', '#FACC15', '#22D3EE', '#EC4899', '#A855F7']
  },
  bordo: {
    id: 'bordo',
    name: 'Bordô (로즈 골드)',
    bg: '#0B0708',
    gridDot: 'rgba(253, 164, 175, 0.07)',
    orbitLine: 'rgba(244, 114, 182, 0.16)',
    textMain: '#FFF1F2',
    textSub: '#FDA4AF',
    accent: '#FB7185',
    panelBg: 'rgba(20, 12, 14, 0.95)',
    panelBorder: 'rgba(251, 113, 133, 0.26)',
    swatches: ['#FFE4E6', '#FDA4AF', '#FB7185', '#F43F5E', '#E11D48']
  },
  papel: {
    id: 'papel',
    name: 'Papel (아카데믹 다크웜)',
    bg: '#0E0D0B',
    gridDot: 'rgba(214, 211, 209, 0.08)',
    orbitLine: 'rgba(217, 119, 6, 0.20)',
    textMain: '#F5F5F4',
    textSub: '#FBBF24',
    accent: '#D97706',
    panelBg: 'rgba(23, 21, 18, 0.95)',
    panelBorder: 'rgba(217, 119, 6, 0.28)',
    swatches: ['#F5F5F4', '#D97706', '#EA580C', '#0284C7', '#6366F1']
  }
};

// =====================================================================
// 📜 성경 66권 정경 순서 및 장수 (총 1,189장: 구약 929장 / 신약 260장)
// =====================================================================
export const BIBLE_66_CANON = [
  { ko: '창세기', en: 'Genesis', abbr: '창', chaps: 50, isOT: true, sector: '모세오경' },
  { ko: '출애굽기', en: 'Exodus', abbr: '출', chaps: 40, isOT: true, sector: '모세오경' },
  { ko: '레위기', en: 'Leviticus', abbr: '레', chaps: 27, isOT: true, sector: '모세오경' },
  { ko: '민수기', en: 'Numbers', abbr: '민', chaps: 36, isOT: true, sector: '모세오경' },
  { ko: '신명기', en: 'Deuteronomy', abbr: '신', chaps: 34, isOT: true, sector: '모세오경' },
  { ko: '여호수아', en: 'Joshua', abbr: '수', chaps: 24, isOT: true, sector: '구약역사서' },
  { ko: '사사기', en: 'Judges', abbr: '삿', chaps: 21, isOT: true, sector: '구약역사서' },
  { ko: '룻기', en: 'Ruth', abbr: '룻', chaps: 4, isOT: true, sector: '구약역사서' },
  { ko: '사무엘상', en: '1 Samuel', abbr: '삼상', chaps: 31, isOT: true, sector: '구약역사서' },
  { ko: '사무엘하', en: '2 Samuel', abbr: '삼하', chaps: 24, isOT: true, sector: '구약역사서' },
  { ko: '열왕기상', en: '1 Kings', abbr: '왕상', chaps: 22, isOT: true, sector: '구약역사서' },
  { ko: '열왕기하', en: '2 Kings', abbr: '왕하', chaps: 25, isOT: true, sector: '구약역사서' },
  { ko: '역대상', en: '1 Chronicles', abbr: '대상', chaps: 29, isOT: true, sector: '구약역사서' },
  { ko: '역대하', en: '2 Chronicles', abbr: '대하', chaps: 36, isOT: true, sector: '구약역사서' },
  { ko: '에스라', en: 'Ezra', abbr: '스', chaps: 10, isOT: true, sector: '구약역사서' },
  { ko: '느헤미야', en: 'Nehemiah', abbr: '느', chaps: 13, isOT: true, sector: '구약역사서' },
  { ko: '에스더', en: 'Esther', abbr: '에', chaps: 10, isOT: true, sector: '구약역사서' },
  { ko: '욥기', en: 'Job', abbr: '욥', chaps: 42, isOT: true, sector: '시가서' },
  { ko: '시편', en: 'Psalms', abbr: '시', chaps: 150, isOT: true, sector: '시가서' },
  { ko: '잠언', en: 'Proverbs', abbr: '잠', chaps: 31, isOT: true, sector: '시가서' },
  { ko: '전도서', en: 'Ecclesiastes', abbr: '전', chaps: 12, isOT: true, sector: '시가서' },
  { ko: '아가', en: 'Song of Solomon', abbr: '아', chaps: 8, isOT: true, sector: '시가서' },
  { ko: '이사야', en: 'Isaiah', abbr: '사', chaps: 66, isOT: true, sector: '선지서' },
  { ko: '예레미야', en: 'Jeremiah', abbr: '렘', chaps: 52, isOT: true, sector: '선지서' },
  { ko: '예레미야애가', en: 'Lamentations', abbr: '애', chaps: 5, isOT: true, sector: '선지서' },
  { ko: '에스겔', en: 'Ezekiel', abbr: '겔', chaps: 48, isOT: true, sector: '선지서' },
  { ko: '다니엘', en: 'Daniel', abbr: '단', chaps: 12, isOT: true, sector: '선지서' },
  { ko: '호세아', en: 'Hosea', abbr: '호', chaps: 14, isOT: true, sector: '선지서' },
  { ko: '요엘', en: 'Joel', abbr: '욜', chaps: 3, isOT: true, sector: '선지서' },
  { ko: '아모스', en: 'Amos', abbr: '암', chaps: 9, isOT: true, sector: '선지서' },
  { ko: '오바댜', en: 'Obadiah', abbr: '옵', chaps: 1, isOT: true, sector: '선지서' },
  { ko: '요나', en: 'Jonah', abbr: '욘', chaps: 4, isOT: true, sector: '선지서' },
  { ko: '미가', en: 'Micah', abbr: '미', chaps: 7, isOT: true, sector: '선지서' },
  { ko: '나훔', en: 'Nahum', abbr: '나', chaps: 3, isOT: true, sector: '선지서' },
  { ko: '하박국', en: 'Habakkuk', abbr: '합', chaps: 3, isOT: true, sector: '선지서' },
  { ko: '스바냐', en: 'Zephaniah', abbr: '습', chaps: 3, isOT: true, sector: '선지서' },
  { ko: '학개', en: 'Haggai', abbr: '학', chaps: 2, isOT: true, sector: '선지서' },
  { ko: '스가랴', en: 'Zechariah', abbr: '슥', chaps: 14, isOT: true, sector: '선지서' },
  { ko: '말라기', en: 'Malachi', abbr: '말', chaps: 4, isOT: true, sector: '선지서' },
  { ko: '마태복음', en: 'Matthew', abbr: '마', chaps: 28, isOT: false, sector: '복음서·행전' },
  { ko: '마가복음', en: 'Mark', abbr: '막', chaps: 16, isOT: false, sector: '복음서·행전' },
  { ko: '누가복음', en: 'Luke', abbr: '눅', chaps: 24, isOT: false, sector: '복음서·행전' },
  { ko: '요한복음', en: 'John', abbr: '요', chaps: 21, isOT: false, sector: '복음서·행전' },
  { ko: '사도행전', en: 'Acts', abbr: '행', chaps: 28, isOT: false, sector: '복음서·행전' },
  { ko: '로마서', en: 'Romans', abbr: '롬', chaps: 16, isOT: false, sector: '바울서신' },
  { ko: '고린도전서', en: '1 Corinthians', abbr: '고전', chaps: 16, isOT: false, sector: '바울서신' },
  { ko: '고린도후서', en: '2 Corinthians', abbr: '고후', chaps: 13, isOT: false, sector: '바울서신' },
  { ko: '갈라디아서', en: 'Galatians', abbr: '갈', chaps: 6, isOT: false, sector: '바울서신' },
  { ko: '에베소서', en: 'Ephesians', abbr: '엡', chaps: 6, isOT: false, sector: '바울서신' },
  { ko: '빌립보서', en: 'Philippians', abbr: '빌', chaps: 4, isOT: false, sector: '바울서신' },
  { ko: '골로새서', en: 'Colossians', abbr: '골', chaps: 4, isOT: false, sector: '바울서신' },
  { ko: '데살로니가전서', en: '1 Thessalonians', abbr: '살전', chaps: 5, isOT: false, sector: '바울서신' },
  { ko: '데살로니가후서', en: '2 Thessalonians', abbr: '살후', chaps: 3, isOT: false, sector: '바울서신' },
  { ko: '디모데전서', en: '1 Timothy', abbr: '딤전', chaps: 6, isOT: false, sector: '바울서신' },
  { ko: '디모데후서', en: '2 Timothy', abbr: '딤후', chaps: 4, isOT: false, sector: '바울서신' },
  { ko: '디도서', en: 'Titus', abbr: '딛', chaps: 3, isOT: false, sector: '바울서신' },
  { ko: '빌레몬서', en: 'Philemon', abbr: '몬', chaps: 1, isOT: false, sector: '바울서신' },
  { ko: '히브리서', en: 'Hebrews', abbr: '히', chaps: 13, isOT: false, sector: '공동서신' },
  { ko: '야고보서', en: 'James', abbr: '약', chaps: 5, isOT: false, sector: '공동서신' },
  { ko: '베드로전서', en: '1 Peter', abbr: '벧전', chaps: 5, isOT: false, sector: '공동서신' },
  { ko: '베드로후서', en: '2 Peter', abbr: '벧후', chaps: 3, isOT: false, sector: '공동서신' },
  { ko: '요한일서', en: '1 John', abbr: '요일', chaps: 5, isOT: false, sector: '공동서신' },
  { ko: '요한이서', en: '2 John', abbr: '요이', chaps: 1, isOT: false, sector: '공동서신' },
  { ko: '요한삼서', en: '3 John', abbr: '요삼', chaps: 1, isOT: false, sector: '공동서신' },
  { ko: '유다서', en: 'Jude', abbr: '유', chaps: 1, isOT: false, sector: '공동서신' },
  { ko: '요한계시록', en: 'Revelation', abbr: '계', chaps: 22, isOT: false, sector: '예언서' }
];

const CANON_SECTORS = [
  { id: 'law', name: '모세오경', enSub: 'PENTATEUCH', color: '#00F5D4', angleStart: 0, angleEnd: 38, hexQ: 0, hexR: -1, books: ['창세기', '출애굽기', '레위기', '민수기', '신명기'] },
  { id: 'ot_history', name: '구약역사서', enSub: 'OT HISTORY', color: '#38BDF8', angleStart: 38, angleEnd: 100, hexQ: 1, hexR: -1, books: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'] },
  { id: 'poetry', name: '시가서', enSub: 'WISDOM & POETRY', color: '#F59E0B', angleStart: 100, angleEnd: 132, hexQ: -1, hexR: 0, books: ['욥기', '시편', '잠언', '전도서', '아가'] },
  { id: 'prophets', name: '선지서', enSub: 'PROPHETS', color: '#FB923C', angleStart: 132, angleEnd: 215, hexQ: 1, hexR: 0, books: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'] },
  { id: 'gospels', name: '복음서·행전', enSub: 'GOSPELS & ACTS', color: '#10B981', angleStart: 215, angleEnd: 248, hexQ: -1, hexR: 1, books: ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'] },
  { id: 'pauline', name: '바울서신', enSub: 'PAULINE EPISTLES', color: '#A855F7', angleStart: 248, angleEnd: 310, hexQ: 0, hexR: 1, books: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'] },
  { id: 'general', name: '공동서신', enSub: 'GENERAL EPISTLES', color: '#EC4899', angleStart: 310, angleEnd: 348, hexQ: 1, hexR: 1, books: ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서'] },
  { id: 'prophecy_nt', name: '요한계시록', enSub: 'APOCALYPSE', color: '#F43F5E', angleStart: 348, angleEnd: 360, hexQ: -1, hexR: -1, books: ['요한계시록'] }
];

// =====================================================================
// 🔍 실제 성경 DB(ko_ko.json) 기반 장·절 인덱싱 및 유효성 검증
// =====================================================================
const BIBLE_BOOK_LOOKUP = {};
if (Array.isArray(bibleData)) {
  bibleData.forEach(b => {
    if (b?.name) BIBLE_BOOK_LOOKUP[b.name] = b;
  });
}

let accChaps = 0;
const BOOK_OFFSET_MAP = {};
const KO_TO_EN_BOOK = {};
const EN_TO_KO_BOOK = {};
const ABBR_TO_KO_BOOK = {};
const GLOBAL_CHAP_LOOKUP = [];

const CANON_BOOKS_WITH_OFFSET = BIBLE_66_CANON.map((b, idx) => {
  const startGlobalChap = accChaps;
  KO_TO_EN_BOOK[b.ko] = b.en;
  EN_TO_KO_BOOK[b.en] = b.ko;
  ABBR_TO_KO_BOOK[b.abbr] = b.ko;
  const rawBookObj = BIBLE_BOOK_LOOKUP[b.en] || BIBLE_BOOK_LOOKUP[b.ko];

  for (let c = 1; c <= b.chaps; c++) {
    const chapArr = rawBookObj?.chapters?.[c - 1];
    const maxVerses = Array.isArray(chapArr) && chapArr.length > 0 ? chapArr.length : 20;
    GLOBAL_CHAP_LOOKUP.push({
      bookKo: b.ko,
      bookEn: b.en,
      abbr: b.abbr,
      chap: c,
      maxVerses,
      isOT: b.isOT,
      sector: b.sector,
      bookIdx: idx
    });
  }
  accChaps += b.chaps;
  const item = { ...b, bookIdx: idx, startGlobalChap, endGlobalChap: accChaps - 1 };
  BOOK_OFFSET_MAP[b.ko] = item;
  BOOK_OFFSET_MAP[b.en] = item;
  BOOK_OFFSET_MAP[b.abbr] = item;
  return item;
});
const TOTAL_BIBLE_CHAPTERS = accChaps; // 1,189장

const SORTED_KO_BOOK_NAMES = Object.keys(KO_TO_EN_BOOK).sort((a, b) => b.length - a.length);
const SORTED_ABBR_KEYS = Object.keys(ABBR_TO_KO_BOOK).sort((a, b) => b.length - a.length);

const getGlobalChapIndex = (bookName, chapNum = 1) => {
  const b = BOOK_OFFSET_MAP[bookName];
  if (!b) return -1;
  const clampedChap = Math.max(1, Math.min(b.chaps, Number(chapNum) || 1));
  return b.startGlobalChap + (clampedChap - 1);
};

const clampValidVerse = (bookName, chapNum, verseNum) => {
  const gIdx = getGlobalChapIndex(bookName, chapNum);
  if (gIdx < 0) return 1;
  const meta = GLOBAL_CHAP_LOOKUP[gIdx];
  const maxV = meta?.maxVerses || 20;
  return Math.max(1, Math.min(maxV, Number(verseNum) || 1));
};

// =====================================================================
// 🌟 성경신학 & OpenBible.info(TSK) 100% 검증 정경 랜드마크 아크 (105선)
// =====================================================================
const LANDMARK_ARCS = [
  ['창세기', 1, 1, '요한복음', 1, 1, 'quote', '직접 인용', '태초의 천지창조와 성육신하신 말씀(로고스)'],
  ['창세기', 1, 3, '고린도후서', 4, 6, 'theme', '인물 · 주제', '어두운 데서 빛이 비치라 말씀하신 창조주와 복음의 영광의 빛'],
  ['창세기', 1, 26, '골로새서', 1, 15, 'typology', '모형 · 그림자', '하나님의 형상대로 지음받은 인류와 보이지 아니하시는 하나님의 형상 그리스도'],
  ['창세기', 2, 2, '히브리서', 4, 4, 'quote', '직접 인용', '제칠일에 안식하신 창조의 안식과 그리스도 안에서 들어가는 영원한 안식'],
  ['창세기', 2, 7, '고린도전서', 15, 45, 'quote', '직접 인용', '산 영이 된 첫 사람 아담과 살려 주는 영이 되신 마지막 아담 그리스도'],
  ['창세기', 2, 9, '요한계시록', 22, 2, 'typology', '모형 · 그림자', '에덴의 생명나무에서 새 예루살렘 생명나무로의 구속사적 완성'],
  ['창세기', 2, 24, '에베소서', 5, 31, 'quote', '직접 인용', '둘이 한 육체가 될지니 — 그리스도와 교회의 비밀을 예표한 결혼'],
  ['창세기', 3, 15, '갈라디아서', 4, 4, 'prophecy', '예언 · 성취', '여자의 후손 원시복음 언약과 때가 차매 여자에게서 나신 그리스도'],
  ['창세기', 3, 15, '요한계시록', 12, 9, 'prophecy', '예언 · 성취', '옛 뱀 곧 사탄의 머리를 깨뜨리시는 어린양의 최종 승리'],
  ['창세기', 4, 4, '히브리서', 11, 4, 'theme', '인물 · 주제', '아벨이 믿음으로 드린 더 나은 제사와 의로운 자라 하시는 증거'],
  ['창세기', 5, 24, '히브리서', 11, 5, 'theme', '인물 · 주제', '하나님과 동행하다가 죽음을 보지 않고 옮겨진 에녹의 믿음'],
  ['창세기', 7, 1, '베드로전서', 3, 20, 'typology', '모형 · 그림자', '홍수에서 구원받은 노아의 방주와 세례로 말미암은 구원의 표상'],
  ['창세기', 12, 1, '히브리서', 11, 8, 'theme', '인물 · 주제', '갈 바를 알지 못하고 약속의 땅으로 나아간 아브라함의 순종'],
  ['창세기', 12, 3, '갈라디아서', 3, 8, 'quote', '직접 인용', '땅의 모든 족속이 너로 말미암아 복을 얻을 것이라 하신 언약 성취'],
  ['창세기', 14, 18, '히브리서', 7, 1, 'typology', '모형 · 그림자', '살렘 왕 멜기세덱의 영원한 제사장직과 대제사장 예수 그리스도'],
  ['창세기', 15, 6, '로마서', 4, 3, 'quote', '직접 인용', '아브람이 여호와를 믿으니 이를 그의 의로 여기신 이신칭의 복음'],
  ['창세기', 15, 6, '야고보서', 2, 23, 'quote', '직접 인용', '아브라함의 믿음이 행함과 함께 일하고 행함으로 온전하게 됨'],
  ['창세기', 19, 24, '베드로후서', 2, 6, 'theme', '인물 · 주제', '소돔과 고모라 성을 멸망하기로 정하사 후세에 경건하지 아니할 자들에게 본을 삼으심'],
  ['창세기', 21, 10, '갈라디아서', 4, 30, 'quote', '직접 인용', '여종과 그 아들을 내쫓으라 — 율법의 종이 아닌 약속의 자녀의 유업'],
  ['창세기', 22, 8, '요한복음', 1, 29, 'typology', '모형 · 그림자', '모리아 산의 번제할 어린양과 세상 죄를 지고 가는 하나님의 어린양'],
  ['창세기', 22, 18, '갈라디아서', 3, 16, 'quote', '직접 인용', '네 씨로 말미암아 천하 만민이 복을 받으리니 그 씨는 곧 그리스도라'],
  ['창세기', 25, 23, '로마서', 9, 12, 'quote', '직접 인용', '큰 자가 어린 자를 섬기리라 — 행위가 아닌 부르시는 이의 주권적 선택'],
  ['창세기', 28, 12, '요한복음', 1, 51, 'typology', '모형 · 그림자', '야곱의 벧엘 사닥다리와 인자 위에 오르락내리락하는 천사들'],
  ['창세기', 37, 28, '사도행전', 7, 9, 'typology', '모형 · 그림자', '형제들의 시기로 애굽에 팔린 요셉과 고난을 통해 구원을 이루신 그리스도'],
  ['창세기', 49, 10, '요한계시록', 5, 5, 'prophecy', '예언 · 성취', '유다 지파에서 난 실로(통치자의 지팡이)와 이기신 유다의 사자'],
  ['출애굽기', 3, 6, '마태복음', 22, 32, 'quote', '직접 인용', '나는 아브라함의 하나님이요 이삭의 하나님이요 야곱의 하나님이로라 — 산 자의 하나님'],
  ['출애굽기', 3, 14, '요한복음', 8, 58, 'quote', '직접 인용', '스스로 있는 자(I AM) 여호와와 예수님의 에고 에이미 신성 선포'],
  ['출애굽기', 12, 13, '고린도전서', 5, 7, 'typology', '모형 · 그림자', '출애굽 유월절 어린양의 피와 우리의 유월절 양 그리스도의 희생'],
  ['출애굽기', 12, 46, '요한복음', 19, 36, 'quote', '직접 인용', '그 뼈가 하나도 꺾이지 아니하리라 하신 유월절 규례의 십자가 성취'],
  ['출애굽기', 14, 22, '고린도전서', 10, 2, 'typology', '모형 · 그림자', '홍해 바다 가운데를 육지같이 건넌 출애굽 구원과 그리스도 안의 세례'],
  ['출애굽기', 16, 15, '요한복음', 6, 35, 'typology', '모형 · 그림자', '광야의 하늘 만나와 영원히 주리지 않는 생명의 떡 예수 그리스도'],
  ['출애굽기', 17, 6, '고린도전서', 10, 4, 'typology', '모형 · 그림자', '호렙산 생수를 낸 반석과 그들을 따르던 신령한 반석 그리스도'],
  ['출애굽기', 19, 6, '베드로전서', 2, 9, 'quote', '직접 인용', '제사장 나라요 거룩한 백성에서 왕 같은 제사장 신약 성도로'],
  ['출애굽기', 20, 12, '에베소서', 6, 2, 'quote', '직접 인용', '네 부모를 공경하라 — 약속 있는 첫 계명'],
  ['출애굽기', 24, 8, '마태복음', 26, 28, 'quote', '직접 인용', '시내산 언약의 피와 죄 사함을 얻게 하려고 흘리는 새 언약의 피'],
  ['출애굽기', 25, 40, '히브리서', 8, 5, 'quote', '직접 인용', '산에서 보인 양식대로 성막을 지으라 — 하늘에 있는 참 장막의 모형과 그림자'],
  ['출애굽기', 26, 33, '히브리서', 10, 20, 'typology', '모형 · 그림자', '지성소를 가로막던 성막 휘장과 십자가에서 찢어진 그리스도의 육체'],
  ['레위기', 11, 44, '베드로전서', 1, 16, 'quote', '직접 인용', '내가 거룩하니 너희도 거룩할지어다 — 성도의 성화 소명'],
  ['레위기', 16, 15, '히브리서', 9, 12, 'typology', '모형 · 그림자', '대속죄일 지성소 속죄제물과 자기의 피로 영원한 속죄를 이루신 주님'],
  ['레위기', 16, 27, '히브리서', 13, 12, 'typology', '모형 · 그림자', '진영 밖에서 불살라진 속죄제 짐승과 성문 밖에서 고난받으신 예수님'],
  ['레위기', 17, 11, '히브리서', 9, 22, 'theme', '인물 · 주제', '육체의 생명은 피에 있음이라 피 흘림이 없은즉 사함이 없느니라'],
  ['레위기', 19, 18, '마태복음', 22, 39, 'quote', '직접 인용', '네 이웃을 네 자신과 같이 사랑하라 하신 율법의 강령 완성'],
  ['민수기', 9, 12, '요한복음', 19, 36, 'quote', '직접 인용', '유월절 양의 뼈를 하나도 꺾지 말라 하신 말씀의 성취'],
  ['민수기', 21, 8, '요한복음', 3, 14, 'typology', '모형 · 그림자', '광야에 들린 모세의 놋뱀과 영생을 주시려 십자가에 들리신 인자'],
  ['민수기', 24, 17, '마태복음', 2, 2, 'prophecy', '예언 · 성취', '야곱에게서 한 별이 나오며 유대인의 왕으로 나신 이의 별'],
  ['신명기', 6, 4, '마가복음', 12, 29, 'quote', '직접 인용', '쉐마 이스라엘: 마음을 다하여 주 너의 하나님을 사랑하라'],
  ['신명기', 6, 13, '마태복음', 4, 10, 'quote', '직접 인용', '주 너의 하나님께 경배하고 다만 그를 섬기라'],
  ['신명기', 8, 3, '마태복음', 4, 4, 'quote', '직접 인용', '사람이 떡으로만 살 것이 아니요 하나님의 입으로 나오는 말씀으로 살 것이라'],
  ['신명기', 18, 15, '사도행전', 3, 22, 'prophecy', '예언 · 성취', '모세와 같은 선지자를 일으키시리라는 약속의 그리스도 성취'],
  ['신명기', 21, 23, '갈라디아서', 3, 13, 'quote', '직접 인용', '나무에 달린 자마다 저주 아래에 있는 자라 — 율법의 저주에서 속량하심'],
  ['신명기', 30, 14, '로마서', 10, 8, 'quote', '직접 인용', '말씀이 네게 심히 가까워 네 입에 있으며 네 마음에 있은즉 믿음의 말씀이라'],
  ['여호수아', 1, 5, '히브리서', 13, 5, 'quote', '직접 인용', '내가 과연 너희를 버리지 아니하고 너희를 떠나지 아니하리라'],
  ['여호수아', 2, 18, '히브리서', 11, 31, 'typology', '모형 · 그림자', '기생 라합의 붉은 줄 구원과 믿음으로 순종치 아니한 자들과 함께 멸망하지 않음'],
  ['룻기', 4, 14, '마태복음', 1, 5, 'theme', '인물 · 주제', '기업 무를 자 보아스와 다윗·예수 그리스도로 이어지는 구속의 계보'],
  ['사무엘상', 16, 13, '사도행전', 13, 22, 'theme', '인물 · 주제', '하나님의 마음에 맞는 사람 다윗과 그 후손으로 오신 구주 예수'],
  ['사무엘하', 7, 12, '누가복음', 1, 32, 'prophecy', '예언 · 성취', '다윗 언약의 영원한 왕위와 다윗의 보좌를 이어받으실 예수 그리스도'],
  ['사무엘하', 7, 14, '히브리서', 1, 5, 'quote', '직접 인용', '나는 그에게 아버지가 되고 그는 내게 아들이 되리니'],
  ['열왕기상', 8, 27, '사도행전', 7, 48, 'theme', '인물 · 주제', '솔로몬의 성전 봉헌 기도와 손으로 지은 전에 계시지 않는 하나님'],
  ['열왕기상', 19, 18, '로마서', 11, 4, 'quote', '직접 인용', '바알에게 무릎 꿇지 아니한 칠천 명과 은혜로 택하심을 따라 남은 자'],
  ['열왕기하', 5, 14, '누가복음', 4, 27, 'theme', '인물 · 주제', '이방인 나아만 장군의 치유와 이방인을 향한 하나님의 주권적 긍휼'],
  ['역대하', 36, 23, '마태복음', 1, 12, 'theme', '인물 · 주제', '바벨론 포로 귀환 칙령에서 그리스도의 오심으로 이어지는 구속사'],
  ['에스라', 3, 11, '고린도전서', 3, 16, 'typology', '모형 · 그림자', '무너진 성전 지대의 재건과 성령이 거하시는 하나님의 성전 된 교회'],
  ['느헤미야', 9, 6, '골로새서', 1, 16, 'theme', '인물 · 주제', '만물을 지으시고 보존하시는 오직 한 분 여호와와 만물의 창조자 그리스도'],
  ['욥기', 5, 13, '고린도전서', 3, 19, 'quote', '직접 인용', '지혜 있는 자들로 자기 궤휼에 빠지게 하시는 하나님의 지혜'],
  ['욥기', 19, 25, '요한복음', 11, 25, 'theme', '인물 · 주제', '내가 알기에는 나의 대속자가 살아계시니 부활이요 생명이신 주님'],
  ['시편', 2, 1, '사도행전', 4, 25, 'quote', '직접 인용', '어찌하여 열방이 분노하며 족속들이 허사를 경영하였는고'],
  ['시편', 2, 7, '사도행전', 13, 33, 'quote', '직접 인용', '너는 내 아들이라 오늘 내가 너를 낳았도다 — 부활로 입증되신 하나님의 아들'],
  ['시편', 8, 4, '히브리서', 2, 6, 'quote', '직접 인용', '사람이 무엇이기에 주께서 그를 생각하시며 만물을 그 발아래에 복종하게 하심'],
  ['시편', 16, 10, '사도행전', 2, 27, 'quote', '직접 인용', '주의 거룩한 자로 썩음을 당하지 않게 하실 그리스도의 부활 예언'],
  ['시편', 22, 1, '마태복음', 27, 46, 'quote', '직접 인용', '엘리 엘리 라마 사박다니 — 골고다 십자가 위에서 성취된 다윗의 시편'],
  ['시편', 22, 18, '요한복음', 19, 24, 'quote', '직접 인용', '내 겉옷을 나누며 속옷을 제비 뽑나이다 — 십자가 아래에서의 성취'],
  ['시편', 23, 1, '요한복음', 10, 11, 'theme', '인물 · 주제', '여호와는 나의 목자시니 양들을 위하여 목숨을 버리는 선한 목자'],
  ['시편', 32, 1, '로마서', 4, 7, 'quote', '직접 인용', '불법이 사함을 받고 죄가 가리어짐을 받는 사람들은 복이 있도다'],
  ['시편', 40, 6, '히브리서', 10, 5, 'quote', '직접 인용', '주께서 내게 몸을 예비하셨도다 — 단번에 드리신 그리스도의 몸'],
  ['시편', 45, 6, '히브리서', 1, 8, 'quote', '직접 인용', '하나님이여 주의 보좌는 영영하며 주의 나라의 규는 공평한 규이니이다'],
  ['시편', 69, 21, '요한복음', 19, 28, 'quote', '직접 인용', '내가 목마르다 하시며 신 포도주를 받으심으로 성경을 응하게 하심'],
  ['시편', 78, 2, '마태복음', 13, 35, 'quote', '직접 인용', '내가 입을 열어 비유로 말하며 창세부터 감추인 것들을 드러내리라'],
  ['시편', 95, 7, '히브리서', 3, 7, 'quote', '직접 인용', '오늘 너희가 그의 음성을 듣거든 너희 마음을 완고하게 하지 말라'],
  ['시편', 110, 1, '히브리서', 1, 13, 'quote', '직접 인용', '내 원수로 네 발등상이 되게 하기까지 내 우편에 앉아 있으라'],
  ['시편', 110, 4, '히브리서', 7, 17, 'quote', '직접 인용', '네가 멜기세덱의 반차를 따라 영원한 제사장이라 하셨도다'],
  ['시편', 118, 22, '베드로전서', 2, 7, 'quote', '직접 인용', '건축자들이 버린 돌이 집 모퉁이의 머릿돌이 되었나니'],
  ['잠언', 3, 11, '히브리서', 12, 5, 'quote', '직접 인용', '주께서 사랑하시는 자를 징계하시고 받으시는 아들마다 채찍질하심'],
  ['잠언', 3, 34, '야고보서', 4, 6, 'quote', '직접 인용', '하나님이 교만한 자를 물리치시고 겸손한 자에게 은혜를 주신다 하였느니라'],
  ['이사야', 6, 9, '요한복음', 12, 40, 'quote', '직접 인용', '이사야가 주의 영광을 보고 말한 것이라 — 메시아의 영광'],
  ['이사야', 7, 14, '마태복음', 1, 23, 'quote', '직접 인용', '보라 처녀가 잉태하여 아들을 낳을 것이요 그 이름을 임마누엘이라 하리라'],
  ['이사야', 9, 1, '마태복음', 4, 15, 'quote', '직접 인용', '이방의 갈릴리여 흑암에 앉은 백성이 큰 빛을 보았도다'],
  ['이사야', 9, 6, '누가복음', 2, 11, 'prophecy', '예언 · 성취', '한 아기가 우리에게 났고 기묘자라 모사라 평강의 왕이신 그리스도'],
  ['이사야', 11, 1, '로마서', 15, 12, 'quote', '직접 인용', '이새의 줄기에서 한 싹이 나며 만민을 다스리기 위하여 일어나시는 이'],
  ['이사야', 28, 16, '로마서', 9, 33, 'quote', '직접 인용', '보라 내가 시온에 시험한 돌, 귀하고 견고한 기초돌을 두노니 믿는 자는 부끄러움을 당하지 아니하리라'],
  ['이사야', 40, 3, '마태복음', 3, 3, 'quote', '직접 인용', '광야에 외치는 자의 소리여 주의 길을 준비하라'],
  ['이사야', 42, 1, '마태복음', 12, 18, 'quote', '직접 인용', '보라 내가 택한 종 곧 내 마음에 기뻐하는 바 내가 사랑하는 자로다'],
  ['이사야', 53, 4, '마태복음', 8, 17, 'quote', '직접 인용', '우리의 연약한 것을 친히 담당하시고 병을 짊어지셨도다'],
  ['이사야', 53, 5, '베드로전서', 2, 24, 'quote', '직접 인용', '그가 찔림은 우리의 허물 때문이요 그가 채찍에 맞음으로 우리는 나음을 받았도다'],
  ['이사야', 53, 7, '사도행전', 8, 32, 'quote', '직접 인용', '도수장으로 가는 양과 같이 잠잠히 고난을 받으신 하나님의 어린양'],
  ['이사야', 53, 12, '누가복음', 22, 37, 'quote', '직접 인용', '그가 범죄자 중 하나로 헤아림을 받았다 함이 이루어져야 하리니'],
  ['이사야', 55, 3, '사도행전', 13, 34, 'quote', '직접 인용', '내가 다윗에게 허락한 확실한 은혜를 너희에게 주리라'],
  ['이사야', 61, 1, '누가복음', 4, 18, 'quote', '직접 인용', '주의 성령이 내게 임하셨으니 가난한 자에게 복음을 전하게 하시려고'],
  ['이사야', 65, 17, '요한계시록', 21, 1, 'prophecy', '예언 · 성취', '보라 내가 새 하늘과 새 땅을 창조하나니 이전 것은 지나갔음이러라'],
  ['예레미야', 31, 15, '마태복음', 2, 18, 'quote', '직접 인용', '라마에서 슬퍼하며 크게 통곡하는 소리가 들리니'],
  ['예레미야', 31, 31, '히브리서', 8, 8, 'quote', '직접 인용', '내가 내 법을 그들의 생각에 두고 그들의 마음에 이것을 기록하리라 (새 언약)'],
  ['예레미야애가', 3, 22, '에베소서', 2, 4, 'theme', '인물 · 주제', '여호와의 인자와 긍휼이 무궁하시므로 우리가 진멸되지 아니함이니이다'],
  ['에스겔', 34, 23, '요한복음', 10, 16, 'prophecy', '예언 · 성취', '내가 한 목자를 그들 위에 세워 먹이게 하리니 한 무리가 되어 한 목자에게 있으리라'],
  ['에스겔', 36, 26, '요한복음', 3, 5, 'theme', '인물 · 주제', '새 영과 새 마음을 주시며 물과 성령으로 거듭나는 중생의 은혜'],
  ['에스겔', 47, 1, '요한계시록', 22, 1, 'typology', '모형 · 그림자', '성전 문지방에서 흘러나와 바다를 살리는 생명수 강과 어린양의 보좌'],
  ['다니엘', 7, 13, '마태복음', 26, 64, 'quote', '직접 인용', '인자 같은 이가 하늘 구름을 타고 와서 권능의 우편에 앉으심'],
  ['호세아', 6, 6, '마태복음', 9, 13, 'quote', '직접 인용', '나는 인애를 원하고 제사를 원하지 아니하며 — 죄인을 부르러 오신 주님'],
  ['호세아', 11, 1, '마태복음', 2, 15, 'quote', '직접 인용', '내가 내 아들을 애굽에서 불러냈다 함을 이루려 하심이라'],
  ['요엘', 2, 28, '사도행전', 2, 17, 'quote', '직접 인용', '말세에 내가 내 영을 모든 육체에 부어 주리니 (오순절 성령 강림)'],
  ['요엘', 2, 32, '로마서', 10, 13, 'quote', '직접 인용', '누구든지 주의 이름을 부르는 자는 구원을 받으리라'],
  ['아모스', 9, 11, '사도행전', 15, 16, 'quote', '직접 인용', '다윗의 무너진 장막을 다시 일으키며 이방인 구원의 문을 여심'],
  ['요나', 1, 17, '마태복음', 12, 40, 'typology', '모형 · 그림자', '밤낮 사흘 동안 큰 물고기 뱃속에 있었던 요나의 표적과 그리스도의 부활'],
  ['미가', 5, 2, '마태복음', 2, 6, 'quote', '직접 인용', '베들레헴 에브라다야 네게서 이스라엘을 다스릴 목자가 나올 것이라'],
  ['하박국', 2, 4, '로마서', 1, 17, 'quote', '직접 인용', '오직 의인은 믿음으로 말미암아 살리라 함과 같으니라'],
  ['스가랴', 9, 9, '마태복음', 21, 5, 'quote', '직접 인용', '보라 네 왕이 네게 임하시나니 겸손하여서 나귀 새끼를 탔도다'],
  ['스가랴', 11, 12, '마태복음', 27, 9, 'prophecy', '예언 · 성취', '은 삼십 개를 달아 주었기로 토기장이의 밭 값으로 주었느니라'],
  ['스가랴', 12, 10, '요한복음', 19, 37, 'quote', '직접 인용', '그들이 그 찌른 바 그를 바라보리라 — 십자가에서 창에 찔리신 주님'],
  ['스가랴', 13, 7, '마태복음', 26, 31, 'quote', '직접 인용', '목자를 치라 그리하면 양 떼가 흩어지리라 하였느니라'],
  ['말라기', 3, 1, '마가복음', 1, 2, 'quote', '직접 인용', '보라 내가 내 사자를 네 앞에 보내노니 그가 네 길을 준비하리라'],
  ['말라기', 4, 5, '마태복음', 11, 14, 'prophecy', '예언 · 성취', '크고 두려운 날이 이르기 전에 선지자 엘리야를 보내리라 — 세례 요한의 사역']
];

const CATEGORY_META = {
  quote: { label: '직접 인용', color: '#FACC15', badgeBg: 'bg-[#EAB308] text-slate-950' },
  prophecy: { label: '예언 · 성취', color: '#F472B6', badgeBg: 'bg-pink-400 text-slate-950' },
  typology: { label: '모형 · 그림자', color: '#38BDF8', badgeBg: 'bg-sky-400 text-slate-950' },
  theme: { label: '인물 · 주제', color: '#2DD4BF', badgeBg: 'bg-teal-300 text-slate-950' },
  user_sync: { label: '나의 묵상·강해', color: '#FB7185', badgeBg: 'bg-rose-400 text-slate-950' }
};

const classifyBiblicalArcCategory = (fromBookKo, fromChap, fromVerse, toBookKo, toChap, toVerse, lxxDb = {}) => {
  const ntKey = `${toBookKo}-${toChap}-${toVerse}`;
  if (lxxDb && lxxDb[ntKey]) return 'quote';

  const fromMeta = BOOK_OFFSET_MAP[fromBookKo];
  const toMeta = BOOK_OFFSET_MAP[toBookKo];
  if (!fromMeta || !toMeta) return 'theme';

  if (fromMeta.isOT && !toMeta.isOT) {
    if (fromMeta.sector === '선지서') return 'prophecy';
    if (fromMeta.sector === '모세오경' && (toBookKo === '히브리서' || toBookKo === '요한복음' || toBookKo === '요한계시록' || toBookKo === '고린도전서')) {
      return 'typology';
    }
    if (fromBookKo === '시편' && (toMeta.sector === '복음서·행전' || toBookKo === '히브리서' || toBookKo === '로마서')) {
      return 'quote';
    }
  }
  return 'theme';
};

const buildVerifiedBiblicalArcNetwork = () => {
  const arcs = [];
  const seenPairs = new Set();

  LANDMARK_ARCS.forEach(([fb, fc, fv, tb, tc, tv, cat, _, title]) => {
    const start = getGlobalChapIndex(fb, fc);
    const end = getGlobalChapIndex(tb, tc);
    if (start < 0 || end < 0 || start === end) return;

    const isSwapped = start > end;
    const fBook = isSwapped ? tb : fb;
    const fChap = isSwapped ? tc : fc;
    const fVerse = clampValidVerse(fBook, fChap, isSwapped ? tv : fv);
    const tBook = isSwapped ? fb : tb;
    const tChap = isSwapped ? fc : tc;
    const tVerse = clampValidVerse(tBook, tChap, isSwapped ? fv : tv);

    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const pairKey = `${s}:${fVerse}-${e}:${tVerse}`;
    if (seenPairs.has(pairKey)) return;
    seenPairs.add(pairKey);

    const catMeta = CATEGORY_META[cat] || CATEGORY_META.theme;

    arcs.push({
      id: `landmark_arc_${arcs.length + 1}`,
      start: s,
      end: e,
      span: e - s,
      category: cat,
      badgeLabel: catMeta.label,
      fromBook: fBook,
      fromChap: fChap,
      fromVerse: fVerse,
      toBook: tBook,
      toChap: tChap,
      toVerse: tVerse,
      title: title || `${fBook} ${fChap}:${fVerse} ➔ ${tBook} ${tChap}:${tVerse}`,
      desc: `${fBook} ${fChap}:${fVerse}의 구약 말씀과 ${tBook} ${tChap}:${tVerse}의 신약 말씀이 정경적·구속사적으로 정확히 조응하는 핵심 교차참조입니다.`,
      isLandmark: true
    });
  });

  return arcs.sort((a, b) => b.span - a.span);
};

const BASE_INTERACTIVE_ARCS = buildVerifiedBiblicalArcNetwork();

const ORIGINAL_LANGUAGE_ROOTS = [
  { id: 'root_hesed', strongs: 'H2617', original: 'חֶסֶד', pron: '헤세드', label: '헤세드 (언약적 사랑)', lang: '히브리어', meaning: '인애, 자비, 끝까지 포기하지 않으시는 하나님의 언약적 사랑', grammar: '남성 명사 (절대형)', books: ['창세기', '룻기', '시편', '호세아', '예레미야애가'], color: '#EC4899', angle: 18 },
  { id: 'root_berit', strongs: 'H1285', original: 'בְּרִית', pron: '베리트', label: '베리트 (구속 언약)', lang: '히브리어', meaning: '쪼갠 고기 사이로 지나가시며 생명을 걸고 맺으신 영원한 언약', grammar: '여성 명사', books: ['창세기', '출애굽기', '신명기', '예레미야', '히브리서'], color: '#F43F5E', angle: 48 },
  { id: 'root_shalom', strongs: 'H7965', original: 'שָׁלוֹם', pron: '샬롬', label: '샬롬 (참된 평강)', lang: '히브리어', meaning: '하나님과의 관계 회복에서 오는 완전한 평화와 무결함', grammar: '남성 명사', books: ['민수기', '사사기', '시편', '이사야', '요한복음'], color: '#06B6D4', angle: 78 },
  { id: 'root_ruah', strongs: 'H7307', original: 'רוּחַ', pron: '루아흐', label: '루아흐 (성령/생기)', lang: '히브리어', meaning: '하나님의 호흡, 마른 뼈를 군대로 일으키는 창조적 생명의 영', grammar: '공성 명사', books: ['창세기', '에스겔', '요엘', '사도행전'], color: '#10B981', angle: 108 },
  { id: 'root_qadosh', strongs: 'H6918', original: 'קָדוֹשׁ', pron: '카도시', label: '카도시 (거룩/구별)', lang: '히브리어', meaning: '세속으로부터 완전히 구별된 하나님의 절대 성결과 영광', grammar: '형용사', books: ['레위기', '이사야', '에스겔', '베드로전서'], color: '#F59E0B', angle: 138 },
  { id: 'root_torah', strongs: 'H8451', original: 'תּוֹרָה', pron: '토라', label: '토라 (과녁을 향한 말씀)', lang: '히브리어', meaning: '화살이 과녁을 정확히 맞추듯 생명의 길을 가리키는 아버지의 교훈', grammar: '여성 명사', books: ['창세기', '출애굽기', '신명기', '시편', '여호수아'], color: '#38BDF8', angle: 168 },
  { id: 'root_agape', strongs: 'G26', original: 'ἀγάπη', pron: '아가페', label: '아가페 (무조건적 사랑)', lang: '헬라어', meaning: '독생자를 아낌없이 내어주신 자기희생적이고 무조건적인 사랑', grammar: '여성 명사 (주격)', books: ['요한복음', '로마서', '고린도전서', '요한일서'], color: '#EF4899', angle: 198 },
  { id: 'root_charis', strongs: 'G5485', original: 'χάρις', pron: '카리스', label: '카리스 (값없는 은혜)', lang: '헬라어', meaning: '전적 부패한 죄인에게 값없이 거저 베푸시는 구원의 선물', grammar: '여성 명사', books: ['로마서', '에베소서', '갈라디아서', '고린도후서'], color: '#8B5CF6', angle: 228 },
  { id: 'root_pistis', strongs: 'G4102', original: 'πίστις', pron: '피스티스', label: '피스티스 (구원하는 믿음)', lang: '헬라어', meaning: '예수 그리스도를 전인격적으로 신뢰하고 생명을 의탁하는 신실함', grammar: '여성 명사', books: ['로마서', '갈라디아서', '히브리서', '야고보서'], color: '#3B82F6', angle: 258 },
  { id: 'root_basileia', strongs: 'G932', original: 'βασιλεία', pron: '바실레이아', label: '바실레이아 (하나님 나라)', lang: '헬라어', meaning: '예수 그리스도를 통해 이미 임하였고 완성될 하나님의 주권적 통치', grammar: '여성 명사', books: ['마태복음', '마가복음', '누가복음', '사도행전', '요한계시록'], color: '#10B981', angle: 288 },
  { id: 'root_stauros', strongs: 'G4716', original: 'σταυρός', pron: '스타우로스', label: '스타우로스 (십자가 대속)', lang: '헬라어', meaning: '율법의 저주를 단번에 끊으신 예수 그리스도의 피 묻은 대속 십자가', grammar: '남성 명사', books: ['마태복음', '고린도전서', '갈라디아서', '골로새서', '빌립보서'], color: '#E11D48', angle: 318 },
  { id: 'root_logos', strongs: 'G3056', original: 'λόγος', pron: '로고스', label: '로고스 (성육신 말씀)', lang: '헬라어', meaning: '태초부터 하나님과 함께 계셨고 육신이 되어 우리 가운데 거하신 말씀', grammar: '남성 명사', books: ['창세기', '요한복음', '요한일서', '요한계시록'], color: '#14B8A6', angle: 348 }
];

// =====================================================================
// 🔬 정밀 성경 구절 추출 엔진 (외부 페이지에서도 공유 가능하도록 export)
// =====================================================================
export function extractAllBibleRefsFromText(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return [];
  const clean = rawStr.replace(/<[^>]*>?/gm, ' ');
  const matchesWithPos = [];

  const fullNamesPattern = SORTED_KO_BOOK_NAMES.join('|');
  const fullRegex = new RegExp(`(${fullNamesPattern})\\s*(\\d+)\\s*(?:장|편|:)?\\s*(\\d+)?`, 'g');
  let m;
  while ((m = fullRegex.exec(clean)) !== null) {
    const bookKo = m[1];
    const chapter = parseInt(m[2], 10) || 1;
    const verse = clampValidVerse(bookKo, chapter, parseInt(m[3], 10) || 1);
    matchesWithPos.push({ index: m.index, bookKo, chapter, verse });
  }

  const abbrPattern = SORTED_ABBR_KEYS.join('|');
  const abbrRegex = new RegExp(`(?:^|[\\s(\\[])(${abbrPattern})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?`, 'g');
  while ((m = abbrRegex.exec(clean)) !== null) {
    const bookKo = ABBR_TO_KO_BOOK[m[1]];
    if (!bookKo) continue;
    const chapter = parseInt(m[2], 10) || 1;
    const verse = clampValidVerse(bookKo, chapter, parseInt(m[3], 10) || 1);
    matchesWithPos.push({ index: m.index, bookKo, chapter, verse });
  }

  matchesWithPos.sort((a, b) => a.index - b.index);
  const results = [];
  const seen = new Set();
  for (const item of matchesWithPos) {
    const key = `${item.bookKo}-${item.chapter}-${item.verse}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        bookKo: item.bookKo,
        chapter: item.chapter,
        verse: item.verse,
        label: `${item.bookKo} ${item.chapter}:${item.verse}`
      });
    }
  }
  return results;
}

export function extractBibleRefInfo(rawStr) {
  const allRefs = extractAllBibleRefsFromText(rawStr);
  if (allRefs.length > 0) return allRefs[0];

  if (rawStr && typeof rawStr === 'string') {
    for (const koName of SORTED_KO_BOOK_NAMES) {
      if (rawStr.includes(koName)) {
        const after = rawStr.slice(rawStr.indexOf(koName) + koName.length);
        const m = after.match(/(\d+)\s*(?:장|편|:)?\s*(\d+)?/);
        const ch = m && m[1] ? parseInt(m[1], 10) : 1;
        const vs = m && m[2] ? parseInt(m[2], 10) : 1;
        return { bookKo: koName, chapter: ch, verse: clampValidVerse(koName, ch, vs) };
      }
    }
  }
  return null;
}

function getScripturePreview(bookKo, chapter = 1, verse = 1, count = 2, easyDb = {}, webDb = {}) {
  try {
    const enName = KO_TO_EN_BOOK[bookKo] || bookKo;
    const bookObj = BIBLE_BOOK_LOOKUP[enName] || BIBLE_BOOK_LOOKUP[bookKo];
    if (!bookObj || !Array.isArray(bookObj.chapters)) return null;
    const chapArr = bookObj.chapters[Math.max(0, chapter - 1)];
    if (!Array.isArray(chapArr) || chapArr.length === 0) return null;
    const targetIdx = Math.max(0, Math.min(chapArr.length - 1, (verse || 1) - 1));
    return chapArr.slice(targetIdx, targetIdx + count).map((txt, idx) => {
      const vNum = targetIdx + idx + 1;
      const krvText = String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
      const easyText = easyDb?.[`${bookKo}-${chapter}-${vNum}`] || '';
      const webText = webDb?.[`${bookKo}-${chapter}-${vNum}`] || webDb?.[`${enName}-${chapter}-${vNum}`] || '';
      return { vNum, text: krvText, easyText, webText };
    });
  } catch {
    return null;
  }
}

function calcResponsiveFitZoom(width, height, mode) {
  if (!width || !height) return 0.7;
  if (mode === 'arc') return 1.0;
  const minDim = Math.min(width, height * 0.88);
  if (mode === '3d') {
    return Math.max(0.36, Math.min(0.90, (minDim / 940) * 0.94));
  }
  if (mode === 'hex') {
    return Math.max(0.34, Math.min(0.86, (minDim / 1040) * 0.94));
  }
  return Math.max(0.32, Math.min(0.84, (minDim / 1120) * 0.94));
}

export default function BibleKnowledgeGalaxy({
  setActiveScreen,
  setCurrentChapId,
  setBibleViewMode,
  setTargetVerse,
  isModalPopup = false,
  initialMode = 'arc',
  initialRefQuery = '',
  onClosePopup = null,
  onInsertInsight = null
}) {
  const store = useAppStore();
  const {
    dailyData = {},
    updateDay,
    readVerses = {},
    bibleNotes = [],
    setBibleNotes,
    generalNotes = []
  } = store;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const arcBgBufferRef = useRef(null);

  // 🚀 뷰 모드: 'arc' | '2d' (Tracktor Anéis 링 모드) | 'hex' (Tracktor 헥사곤 셀) | 'hud' (Tracktor Comando HUD) | '3d' | 'list'
  const [viewMode, setViewMode] = useState(initialMode || 'arc');

  // 📖 4대 성경 역본 모드 ('krv': 개역개정 | 'easy': 쉬운성경 | 'web': 영어 WEB | 'parallel': 한·영·쉬운 동시대조)
  const [versionMode, setVersionMode] = useState('parallel');
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});
  const [strongsDictDb, setStrongsDictDb] = useState({});
  const [liveInterlinearMap, setLiveInterlinearMap] = useState({});

  // 🌈 구속사 아크(Arc) & OpenBible.info 장별 샤딩 상태
  const [arcCategoryFilter, setArcCategoryFilter] = useState('all');
  const [arcFromBookFilter, setArcFromBookFilter] = useState('ALL');
  const [arcFromChapFilter, setArcFromChapFilter] = useState('ALL');
  const [arcToBookFilter, setArcToBookFilter] = useState('ALL');
  const [openBibleMasterArcs, setOpenBibleMasterArcs] = useState([]);
  const [openBibleShardArcs, setOpenBibleShardArcs] = useState([]);
  const [openBibleTotalRawCount, setOpenBibleTotalRawCount] = useState(344799);
  const [isShardLoading, setIsShardLoading] = useState(false);

  const [selectedArc, setSelectedArc] = useState(() => BASE_INTERACTIVE_ARCS[0]);
  const [hoveredArc, setHoveredArc] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scrubbedBookKo, setScrubbedBookKo] = useState(null);
  const [isAutoTourPlaying, setIsAutoTourPlaying] = useState(false);
  const [dynamicTskArcs, setDynamicTskArcs] = useState([]);

  const [readerModalData, setReaderModalData] = useState(null);

  const [syncTick, setSyncTick] = useState(0);
  const [lastSyncedTime, setLastSyncedTime] = useState(() => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
  const [liveClock, setLiveClock] = useState(() => new Date().toLocaleTimeString('ko-KR', { hour12: false }));

  const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);

  const [lxxQuotesDb, setLxxQuotesDb] = useState({});
  const [customUserArcs, setCustomUserArcs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('goodtree_custom_arcs') || '[]');
    } catch {
      return [];
    }
  });

  const [rawSermons, setRawSermons] = useState(null);
  const [customGalaxyNodes, setCustomGalaxyNodes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('goodtree_custom_galaxy_nodes') || '[]');
    } catch {
      return [];
    }
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [previewChap, setPreviewChap] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('all');

  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [createType, setCreateType] = useState('customArc');
  const [createBook, setCreateBook] = useState('창세기');
  const [createChap, setCreateChap] = useState(1);
  const [createVerse, setCreateVerse] = useState(1);
  const [createToBook, setCreateToBook] = useState('요한계시록');
  const [createToChap, setCreateToChap] = useState(22);
  const [createToVerse, setCreateToVerse] = useState(1);
  const [createTitle, setCreateTitle] = useState('');
  const [createBody, setCreateBody] = useState('');
  const [createApply, setCreateApply] = useState('');

  const [rotationSpeed, setRotationSpeed] = useState(0.15);
  const [orbitSpacing, setOrbitSpacing] = useState(1.0);
  const [nodeScale, setNodeScale] = useState(1.0);
  const [showOuterLabels, setShowOuterLabels] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('oceano');

  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const targetCameraRef = useRef(null);
  const planetRotRef = useRef({ yaw: 0.3, pitch: 0.25 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const globalRotationRef = useRef(0);
  const nodePositionsRef = useRef(new Map());
  const lastTouchScrubTimeRef = useRef(0);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // HUD 실시간 시계
  useEffect(() => {
    if (viewMode !== 'hud') return;
    const t = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, [viewMode]);

  // 쉬운성경, WEB 영어성경, 원어 사전 JSON 로드
  useEffect(() => {
    fetch('/data/easy_bible.json').then(r => (r.ok ? r.json() : {})).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => (r.ok ? r.json() : {})).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/strongs_korean_master.json')
      .then(r => (r.ok ? r.json() : fetch('/data/strongs_korean.json').then(res => (res.ok ? res.json() : {}))))
      .then(d => setStrongsDictDb(d || {}))
      .catch(() => {});
  }, []);

  // 선택된 아크 또는 성경 구절의 히브리어/헬라어 원어 단어 실시간 조회
  const fetchVerseInterlinear = useCallback(async (bookKo, chap, verse) => {
    if (!supabase || !bookKo) return;
    const key = `${bookKo}-${chap}-${verse}`;
    if (liveInterlinearMap[key]) return;
    try {
      const { data } = await supabase
        .from('interlinear_bible')
        .select('word_order, original_word, pronunciation, korean_trans, strongs_id, grammar')
        .eq('book', bookKo)
        .eq('chapter', Number(chap) || 1)
        .eq('verse', Number(verse) || 1)
        .order('word_order', { ascending: true })
        .limit(12);
      if (data && data.length > 0) {
        setLiveInterlinearMap(prev => ({ ...prev, [key]: data }));
      }
    } catch (_) {}
  }, [liveInterlinearMap]);

  useEffect(() => {
    if (!selectedArc) return;
    fetchVerseInterlinear(selectedArc.fromBook, selectedArc.fromChap, selectedArc.fromVerse);
    fetchVerseInterlinear(selectedArc.toBook, selectedArc.toChap, selectedArc.toVerse);
  }, [selectedArc, fetchVerseInterlinear]);

  // OpenBible 배열 항목을 정경 순서(구약 ➔ 신약)로 100% 정규화하는 헬퍼
  const normalizeOpenBibleTuple = useCallback((arr, idPrefix, idx, lxxDb) => {
    if (!Array.isArray(arr) || arr.length < 6) return null;
    const [rawFBk, rawFCh, rawFVs, rawTBk, rawTCh, rawTVs, , , rawVotes, rawCat] = arr;
    const fMeta = BOOK_OFFSET_MAP[rawFBk];
    const tMeta = BOOK_OFFSET_MAP[rawTBk];
    if (!fMeta || !tMeta) return null;

    const startIdx = getGlobalChapIndex(fMeta.ko, rawFCh);
    const endIdx = getGlobalChapIndex(tMeta.ko, rawTCh);
    if (startIdx < 0 || endIdx < 0 || startIdx === endIdx) return null;

    const isSwap = startIdx > endIdx;
    const fBk = isSwap ? tMeta.ko : fMeta.ko;
    const fCh = Number(isSwap ? rawTCh : rawFCh) || 1;
    const fVs = clampValidVerse(fBk, fCh, isSwap ? rawTVs : rawFVs);
    const tBk = isSwap ? fMeta.ko : tMeta.ko;
    const tCh = Number(isSwap ? rawFCh : rawTCh) || 1;
    const tVs = clampValidVerse(tBk, tCh, isSwap ? rawFVs : rawTVs);

    const sG = Math.min(startIdx, endIdx);
    const eG = Math.max(startIdx, endIdx);
    const votes = Number(rawVotes) || 1;
    const cat = (rawCat && CATEGORY_META[rawCat])
      ? rawCat
      : classifyBiblicalArcCategory(fBk, fCh, fVs, tBk, tCh, tVs, lxxDb);
    const catMeta = CATEGORY_META[cat] || CATEGORY_META.theme;

    return {
      id: `${idPrefix}_${idx}`,
      start: sG,
      end: eG,
      span: eG - sG,
      votes,
      category: cat,
      badgeLabel: `${catMeta.label} ★${votes}`,
      fromBook: fBk,
      fromChap: fCh,
      fromVerse: fVs,
      toBook: tBk,
      toChap: tCh,
      toVerse: tVs,
      title: `[OpenBible ★${votes}] ${fBk} ${fCh}:${fVs} ➔ ${tBk} ${tCh}:${tVs}`,
      desc: `OpenBible.info(TSK) 성경 연구 데이터셋(교차 검증 가중치 ${votes}점)에 등재된 정밀 상호참조 구절입니다.`,
      isLandmark: votes >= 70
    };
  }, []);

  const triggerRealtimeSync = useCallback((showAlert = false) => {
    fetch('/sermon_summary.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data) setRawSermons(data); })
      .catch(() => {});

    fetch('/data/lxx_quotes.json')
      .then(res => (res.ok ? res.json() : {}))
      .then(lxxData => {
        const safeLxx = lxxData || {};
        setLxxQuotesDb(safeLxx);

        fetch('/data/openbible/arc_master_index.json')
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (!data || !Array.isArray(data.masterArcs)) return;
            if (data.totalRawReferences) setOpenBibleTotalRawCount(data.totalRawReferences);
            const parsed = data.masterArcs
              .map((arr, idx) => normalizeOpenBibleTuple(arr, 'ob_master', idx, safeLxx))
              .filter(Boolean);
            setOpenBibleMasterArcs(parsed);
            arcBgBufferRef.current = null;
          })
          .catch(() => {});
      })
      .catch(() => {});

    try {
      setCustomUserArcs(JSON.parse(localStorage.getItem('goodtree_custom_arcs') || '[]'));
      setCustomGalaxyNodes(JSON.parse(localStorage.getItem('goodtree_custom_galaxy_nodes') || '[]'));
    } catch (_) {}

    arcBgBufferRef.current = null;
    setSyncTick(t => t + 1);
    setLastSyncedTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    if (showAlert) {
      showToast('🔄 OpenBible.info 정경 아크 · 4대 역본 · 개인 노트가 실시간 동기화되었습니다!');
    }
  }, [showToast, normalizeOpenBibleTuple]);

  useEffect(() => {
    triggerRealtimeSync(false);
    const onStorageChange = () => triggerRealtimeSync(false);
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [triggerRealtimeSync]);

  // 성경(Book) 또는 장(Chapter) 선택 시 분리된 OpenBible 샤드 JSON 정밀 로드
  useEffect(() => {
    const targetBookKo = scrubbedBookKo || (arcFromBookFilter !== 'ALL' ? arcFromBookFilter : null);
    if (!targetBookKo) {
      setOpenBibleShardArcs([]);
      return;
    }
    const enBook = KO_TO_EN_BOOK[targetBookKo];
    if (!enBook) return;

    setIsShardLoading(true);
    const targetUrl =
      arcFromChapFilter !== 'ALL' && !scrubbedBookKo
        ? `/data/openbible/chapters/${enBook}_${arcFromChapFilter}.json`
        : `/data/openbible/books/${enBook.replace(/\s+/g, '_')}.json`;

    fetch(targetUrl)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const rawList = Array.isArray(data) ? data : Array.isArray(data?.arcs) ? data.arcs : [];
        const converted = rawList
          .map((arr, idx) => normalizeOpenBibleTuple(arr, `ob_shard_${enBook}_${arcFromChapFilter}`, idx, lxxQuotesDb))
          .filter(Boolean);
        setOpenBibleShardArcs(converted);
        if (converted.length > 0) setSelectedArc(converted[0]);
        arcBgBufferRef.current = null;
      })
      .catch(() => setOpenBibleShardArcs([]))
      .finally(() => setIsShardLoading(false));
  }, [arcFromBookFilter, arcFromChapFilter, scrubbedBookKo, lxxQuotesDb, normalizeOpenBibleTuple]);

  // 선택된 아크 구절에 대한 TSK 실시간 보조 교차참조 로드
  useEffect(() => {
    if (!selectedArc?.fromBook || typeof getCrossReferences !== 'function') return;
    let isMounted = true;
    getCrossReferences(selectedArc.fromBook, selectedArc.fromChap, selectedArc.fromVerse)
      .then(refs => {
        if (!isMounted || !Array.isArray(refs) || refs.length === 0) return;
        const added = refs.slice(0, 8).map((r, idx) => {
          const tgtMeta = BOOK_OFFSET_MAP[r.targetBook];
          if (!tgtMeta) return null;
          const s = getGlobalChapIndex(selectedArc.fromBook, selectedArc.fromChap);
          const e = getGlobalChapIndex(tgtMeta.ko, r.targetChapter);
          if (s < 0 || e < 0 || s === e) return null;

          const isSwap = s > e;
          const fB = isSwap ? tgtMeta.ko : selectedArc.fromBook;
          const fC = Number(isSwap ? r.targetChapter : selectedArc.fromChap) || 1;
          const fV = clampValidVerse(fB, fC, isSwap ? r.targetVerse : selectedArc.fromVerse);
          const tB = isSwap ? selectedArc.fromBook : tgtMeta.ko;
          const tC = Number(isSwap ? selectedArc.fromChap : r.targetChapter) || 1;
          const tV = clampValidVerse(tB, tC, isSwap ? selectedArc.fromVerse : r.targetVerse);
          const resolvedCat = classifyBiblicalArcCategory(fB, fC, fV, tB, tC, tV, lxxQuotesDb);
          const catMeta = CATEGORY_META[resolvedCat] || CATEGORY_META.theme;

          return {
            id: `tsk_live_${fB}_${fC}_${fV}_${tB}_${tC}_${tV}_${idx}`,
            start: Math.min(s, e),
            end: Math.max(s, e),
            span: Math.abs(e - s),
            category: resolvedCat,
            badgeLabel: `TSK · ${catMeta.label}`,
            fromBook: fB,
            fromChap: fC,
            fromVerse: fV,
            toBook: tB,
            toChap: tC,
            toVerse: tV,
            title: `[TSK 교차참조] ${fB} ${fC}:${fV} ➔ ${tB} ${tC}:${tV}`,
            desc: `Treasury of Scripture Knowledge(OpenBible) 원천 데이터에 등재된 정밀 상호참조 구절(${r.label || `${tB} ${tC}:${tV}`})입니다.`,
            isLandmark: true
          };
        }).filter(Boolean);

        if (added.length > 0) {
          setDynamicTskArcs(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = added.filter(a => !existingIds.has(a.id));
            return fresh.length > 0 ? [...fresh, ...prev].slice(0, 60) : prev;
          });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedArc?.fromBook, selectedArc?.fromChap, selectedArc?.fromVerse, lxxQuotesDb]);

  useEffect(() => {
    if (selectedNode?.chapter) {
      setPreviewChap(selectedNode.chapter);
    } else {
      setPreviewChap(1);
    }
  }, [selectedNode]);

  const mergedDailyRecords = useMemo(() => {
    const merged = { ...(dailyData || {}) };
    try {
      const qtLocal = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const daysLocal = JSON.parse(localStorage.getItem('days_data') || '{}');
      Object.entries(qtLocal).forEach(([k, v]) => { merged[k] = { ...(merged[k] || {}), ...v }; });
      Object.entries(daysLocal).forEach(([k, v]) => { merged[k] = { ...(merged[k] || {}), ...v }; });
    } catch (_) {}
    return merged;
  }, [dailyData, syncTick]);

  // =====================================================================
  // 🌈 전체 아크 통합 엔진
  // =====================================================================
  const allFullArcs = useMemo(() => {
    const dynamicArcs = [...customUserArcs, ...dynamicTskArcs];
    const seenKeys = new Set();

    const pushUniqueArc = (arcObj) => {
      if (!arcObj) return;
      const key = `${arcObj.start}:${arcObj.fromVerse}-${arcObj.end}:${arcObj.toVerse}_${arcObj.category}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      dynamicArcs.push(arcObj);
    };

    const registerUserNoteArc = (idPrefix, labelBadge, titleText, bodyText, refCandidates) => {
      const refs = [];
      refCandidates.forEach(txt => {
        extractAllBibleRefsFromText(txt).forEach(r => {
          if (!refs.some(existing => existing.bookKo === r.bookKo && existing.chapter === r.chapter)) {
            refs.push(r);
          }
        });
      });

      if (refs.length === 0) return;
      const primary = refs[0];
      const startIdx = getGlobalChapIndex(primary.bookKo, primary.chapter);
      if (startIdx < 0) return;

      let targetBook = null, targetChap = null, targetVerse = null;
      if (refs.length >= 2) {
        targetBook = refs[1].bookKo;
        targetChap = refs[1].chapter;
        targetVerse = refs[1].verse;
      } else {
        const exactLandmark = LANDMARK_ARCS.find(
          ([fb, fc, , tb, tc]) =>
            (fb === primary.bookKo && fc === primary.chapter) ||
            (tb === primary.bookKo && tc === primary.chapter)
        );
        if (!exactLandmark) return;
        const isFirst = exactLandmark[0] === primary.bookKo && exactLandmark[1] === primary.chapter;
        targetBook = isFirst ? exactLandmark[3] : exactLandmark[0];
        targetChap = isFirst ? exactLandmark[4] : exactLandmark[1];
        targetVerse = isFirst ? exactLandmark[5] : exactLandmark[2];
      }

      const endIdx = getGlobalChapIndex(targetBook, targetChap);
      if (endIdx < 0 || startIdx === endIdx) return;

      const isSwap = startIdx > endIdx;
      const cleanDesc = String(bodyText || '내가 기록한 말씀 묵상에서 추출된 실제 교차참조 아크입니다.')
        .replace(/<[^>]*>?/gm, '')
        .slice(0, 150);

      pushUniqueArc({
        id: idPrefix,
        start: Math.min(startIdx, endIdx),
        end: Math.max(startIdx, endIdx),
        span: Math.abs(endIdx - startIdx),
        category: 'user_sync',
        badgeLabel: labelBadge,
        fromBook: isSwap ? targetBook : primary.bookKo,
        fromChap: isSwap ? targetChap : primary.chapter,
        fromVerse: isSwap ? targetVerse : primary.verse,
        toBook: isSwap ? primary.bookKo : targetBook,
        toChap: isSwap ? primary.chapter : targetChap,
        toVerse: isSwap ? primary.verse : targetVerse,
        title: titleText,
        desc: cleanDesc,
        isLandmark: true
      });
    };

    Object.entries(mergedDailyRecords).forEach(([dateKey, dVal]) => {
      if (!dVal) return;
      if (dVal.qtReference || dVal.qtTitle || dVal.qtMeditation) {
        registerUserNoteArc(
          `my_qt_arc_${dateKey}`,
          '🔥 나의 QT 묵상',
          `[${dateKey} QT] ${dVal.qtTitle || dVal.qtReference || '오늘의 QT'}`,
          dVal.qtMeditation || dVal.qtApplication,
          [dVal.qtReference, dVal.qtTitle, dVal.qtMeditation]
        );
      }
      if (dVal.sermonReference || dVal.sermonTitle || dVal.sermonNotes) {
        registerUserNoteArc(
          `my_sermon_arc_${dateKey}`,
          '🎙️ 나의 강해노트',
          `[${dateKey} 노트] ${dVal.sermonTitle || dVal.sermonReference || '말씀 노트'}`,
          dVal.sermonNotes,
          [dVal.sermonReference, dVal.sermonTitle, dVal.sermonNotes]
        );
      }
      if (dVal.testimony && dVal.testimony.length > 30) {
        registerUserNoteArc(
          `my_testimony_arc_${dateKey}`,
          '🙏 나의 간증일기',
          `[${dateKey} 간증] 말씀과 삶의 고백`,
          dVal.testimony,
          [dVal.testimony]
        );
      }
    });

    (Array.isArray(bibleNotes) ? bibleNotes : []).forEach((bNote, idx) => {
      const refsInCard = (bNote.verses || []).map(v => v.ref).filter(Boolean);
      registerUserNoteArc(
        `my_biblenote_arc_${bNote.id || idx}`,
        '📖 성경 묵상카드',
        `[묵상카드] ${refsInCard[0] || bNote.date || '성경 노트'}`,
        bNote.note || bNote?.verses?.[0]?.text,
        [...refsInCard, bNote.note]
      );
    });

    (Array.isArray(generalNotes) ? generalNotes : []).forEach((gNote, idx) => {
      registerUserNoteArc(
        `my_gennote_arc_${gNote.id || idx}`,
        '✍️ 자유 말씀노트',
        `[자유노트] ${gNote.title || '말씀 필기'}`,
        gNote.content,
        [gNote.title, gNote.content]
      );
    });

    Object.entries(lxxQuotesDb || {}).forEach(([ntKey, item], idx) => {
      const ntParts = ntKey.split('-');
      if (ntParts.length < 3 || !item?.otRef) return;
      const ntMeta = BOOK_OFFSET_MAP[ntParts[0]];
      const otInfo = extractBibleRefInfo(item.otRef);
      if (!ntMeta || !otInfo) return;

      const ntBook = ntMeta.ko;
      const ntChap = parseInt(ntParts[1], 10) || 1;
      const ntVerse = clampValidVerse(ntBook, ntChap, parseInt(ntParts[2], 10) || 1);

      const start = getGlobalChapIndex(otInfo.bookKo, otInfo.chapter);
      const end = getGlobalChapIndex(ntBook, ntChap);
      if (start < 0 || end < 0 || start === end) return;

      const isSwap = start > end;
      pushUniqueArc({
        id: `lxx_arc_${idx}`,
        start: Math.min(start, end),
        end: Math.max(start, end),
        span: Math.abs(end - start),
        category: 'quote',
        badgeLabel: '직접 인용 (LXX)',
        fromBook: isSwap ? ntBook : otInfo.bookKo,
        fromChap: isSwap ? ntChap : otInfo.chapter,
        fromVerse: isSwap ? ntVerse : otInfo.verse,
        toBook: isSwap ? otInfo.bookKo : ntBook,
        toChap: isSwap ? otInfo.chapter : ntChap,
        toVerse: isSwap ? otInfo.verse : ntVerse,
        title: `[70인역 직접 인용] ${item.theme || `${otInfo.bookKo} ${otInfo.chapter}:${otInfo.verse} ➔ ${ntBook} ${ntChap}:${ntVerse}`}`,
        desc: item.differenceAnalysis || `${otInfo.bookKo} ${otInfo.chapter}:${otInfo.verse} 말씀이 ${ntBook} ${ntChap}:${ntVerse}에서 직접 인용되었습니다.`,
        isLandmark: true
      });
    });

    openBibleShardArcs.forEach(a => pushUniqueArc(a));
    BASE_INTERACTIVE_ARCS.forEach(a => pushUniqueArc(a));
    openBibleMasterArcs.forEach(a => pushUniqueArc(a));

    return dynamicArcs;
  }, [lxxQuotesDb, customUserArcs, dynamicTskArcs, mergedDailyRecords, bibleNotes, generalNotes, openBibleMasterArcs, openBibleShardArcs]);

  const activeFilteredArcs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allFullArcs.filter(arc => {
      if (arcCategoryFilter !== 'all' && arc.category !== arcCategoryFilter) return false;
      if (arcFromBookFilter !== 'ALL') {
        const matchBook = arc.fromBook === arcFromBookFilter || arc.toBook === arcFromBookFilter;
        if (!matchBook) return false;
        if (arcFromChapFilter !== 'ALL') {
          const targetCh = Number(arcFromChapFilter);
          const matchChap =
            (arc.fromBook === arcFromBookFilter && arc.fromChap === targetCh) ||
            (arc.toBook === arcFromBookFilter && arc.toChap === targetCh);
          if (!matchChap) return false;
        }
      }
      if (arcToBookFilter !== 'ALL' && arc.toBook !== arcToBookFilter && arc.fromBook !== arcToBookFilter) return false;
      if (scrubbedBookKo && arc.fromBook !== scrubbedBookKo && arc.toBook !== scrubbedBookKo) return false;
      if (!q) return true;
      return (
        arc.title?.toLowerCase().includes(q) ||
        arc.desc?.toLowerCase().includes(q) ||
        arc.fromBook?.toLowerCase().includes(q) ||
        arc.toBook?.toLowerCase().includes(q)
      );
    });
  }, [allFullArcs, arcCategoryFilter, arcFromBookFilter, arcFromChapFilter, arcToBookFilter, scrubbedBookKo, searchQuery]);

  useEffect(() => {
    if (!isAutoTourPlaying || viewMode !== 'arc' || activeFilteredArcs.length === 0) return;
    const timer = setInterval(() => {
      setSelectedArc(prev => {
        const curIdx = activeFilteredArcs.findIndex(a => a.id === prev?.id);
        const nextIdx = (curIdx + 1) % activeFilteredArcs.length;
        return activeFilteredArcs[nextIdx];
      });
    }, 3800);
    return () => clearInterval(timer);
  }, [isAutoTourPlaying, viewMode, activeFilteredArcs]);

  const applyResponsiveCameraReset = useCallback((targetMode = viewMode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    const fitZoom = calcResponsiveFitZoom(w, h, targetMode);
    cameraRef.current = { x: 0, y: (targetMode === '2d' || targetMode === 'hex') && w < 640 ? -10 : 0, zoom: fitZoom };
    targetCameraRef.current = null;
    planetRotRef.current = { yaw: 0.3, pitch: 0.25 };
  }, [viewMode]);

  useEffect(() => {
    applyResponsiveCameraReset(viewMode);
  }, [viewMode, applyResponsiveCameraReset]);

  // =====================================================================
  // 🌌 TRACKTOR 2D Rings / Hexagonal Cells / 3D 은하계 네트워크 빌더
  // =====================================================================
  const galaxyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const BOOK_NODE_MAP = {};
    const BOOK_SECTOR_MAP = {};

    const bookReadCounts = {};
    Object.keys(readVerses || {}).forEach(k => {
      if (readVerses[k]) {
        const [enBk, ch] = k.split('-');
        bookReadCounts[`${enBk}-${ch}`] = true;
      }
    });

    nodes.push({
      id: 'core',
      label: '예수 그리스도 (LOGOS CORE)',
      level: 0,
      radius: 0,
      angle: 0,
      xHex: 0, yHex: 0,
      x3d: 0, y3d: 0, z3d: 0,
      size: 21,
      color: '#00F5D4',
      type: 'core',
      desc: '성경 66권(1,189장)과 신구약 구속사 아크, 원어·역본·설교·QT가 수렴하는 중심 코어입니다.'
    });

    let globalBookIdx = 0;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const HEX_CELL_RADIUS = 175;

    CANON_SECTORS.forEach((sec, sIdx) => {
      const midAngle = (sec.angleStart + sec.angleEnd) / 2;
      const secNodeId = `sector_${sec.id}`;
      const secRad = (midAngle * Math.PI) / 180;
      const secR3D = 125;

      // 헥사곤(Hex) 모드에서의 섹터 중심 좌표 (Axial Hex to Pixel 변환)
      const hexCenterDist = HEX_CELL_RADIUS * 1.82;
      const hexAngle = ((sIdx / CANON_SECTORS.length) * Math.PI * 2) - Math.PI / 2;
      const secHexX = Math.cos(hexAngle) * hexCenterDist;
      const secHexY = Math.sin(hexAngle) * hexCenterDist;

      nodes.push({
        id: secNodeId,
        label: sec.name,
        enSub: sec.enSub,
        level: 1,
        radius: 132,
        angle: midAngle,
        xHex: secHexX,
        yHex: secHexY,
        hexRadius: HEX_CELL_RADIUS * 0.88,
        x3d: secR3D * Math.cos(secRad),
        y3d: ((sIdx % 3) - 1) * 45,
        z3d: secR3D * Math.sin(secRad),
        size: 11.5,
        color: sec.color,
        type: 'sector',
        sectorId: sec.id,
        books: sec.books,
        desc: `${sec.name} (${sec.enSub} • ${sec.books.length}권)`
      });
      links.push({ source: 'core', target: secNodeId, color: sec.color, alpha: 0.35 });

      const bookCount = sec.books.length;
      const angleSpan = sec.angleEnd - sec.angleStart;
      const stepAngle = angleSpan / (bookCount + 1);

      sec.books.forEach((bookName, bIdx) => {
        const bookAngle = sec.angleStart + stepAngle * (bIdx + 1);
        const bookNodeId = `book_${bookName}`;
        BOOK_NODE_MAP[bookName] = bookNodeId;
        BOOK_SECTOR_MAP[bookName] = sec;

        const enBook = KO_TO_EN_BOOK[bookName] || bookName;
        const bObj = BIBLE_BOOK_LOOKUP[enBook] || BIBLE_BOOK_LOOKUP[bookName];
        const totalChaps = bObj?.chapters?.length || 1;
        let readChaps = 0;
        const readChapMap = {};
        for (let c = 1; c <= totalChaps; c++) {
          if (bookReadCounts[`${enBook}-${c}`]) {
            readChaps++;
            readChapMap[c] = true;
          }
        }

        // TRACKTOR Anéis 스타일: 내측 섹터 도트 매트릭스 바깥의 정교한 2중 성경 링
        const spokeRadius = 235 + (bIdx % 2) * 28;
        const subAngle = (bIdx / Math.max(1, bookCount)) * Math.PI * 2;
        const subRingR = 52 + (bIdx % 2) * 34;
        const bookHexX = secHexX + Math.cos(subAngle) * subRingR;
        const bookHexY = secHexY + Math.sin(subAngle) * subRingR;

        const i = globalBookIdx + 0.5;
        const phi = Math.acos(1 - (2 * i) / 66);
        const theta = (2 * Math.PI * i) / goldenRatio;
        const sphereR = 225;
        const x3d = sphereR * Math.sin(phi) * Math.cos(theta);
        const y3d = sphereR * Math.cos(phi);
        const z3d = sphereR * Math.sin(phi) * Math.sin(theta);
        globalBookIdx++;

        nodes.push({
          id: bookNodeId,
          label: bookName,
          bookName,
          enBookName: enBook,
          abbr: BOOK_OFFSET_MAP[bookName]?.abbr || bookName.slice(0, 1),
          totalChaps,
          readChaps,
          readChapMap,
          spokeDots: Math.min(14, Math.max(4, Math.ceil(totalChaps / 8))),
          level: 2,
          radius: spokeRadius,
          angle: bookAngle,
          xHex: bookHexX,
          yHex: bookHexY,
          x3d, y3d, z3d,
          size: 9.5,
          color: sec.color,
          type: 'book',
          sector: sec.name,
          sectorId: sec.id,
          desc: `${sec.name} • 총 ${totalChaps}장 중 ${readChaps}장 통독 완료`
        });
        links.push({ source: secNodeId, target: bookNodeId, color: sec.color, alpha: 0.28 });
      });
    });

    // 성경 66권 상호 간의 구속사 교차참조 광선 링크
    const seenBookLinks = new Set();
    LANDMARK_ARCS.forEach(([fb, , , tb, , , cat]) => {
      const srcId = BOOK_NODE_MAP[fb];
      const tgtId = BOOK_NODE_MAP[tb];
      if (!srcId || !tgtId || srcId === tgtId) return;
      const pairKey = [srcId, tgtId].sort().join('__');
      if (seenBookLinks.has(pairKey)) return;
      seenBookLinks.add(pairKey);
      links.push({
        source: srcId,
        target: tgtId,
        color: CATEGORY_META[cat]?.color || '#FACC15',
        alpha: 0.16,
        isCrossRefLink: true
      });
    });

    const outerBuckets = {};
    CANON_SECTORS.forEach(s => { outerBuckets[s.id] = []; });

    let sTotal = 0;
    const seenSermonKeys = new Set();
    const pushSermonStar = (sermon, fallbackRef = '') => {
      if (!sermon || typeof sermon !== 'object' || sTotal >= 220) return;
      const rawRef = sermon.verse || sermon.reference || sermon.ref || fallbackRef || sermon.title || '';
      const refInfo = extractBibleRefInfo(rawRef);
      if (!refInfo) return;

      const targetBookId = BOOK_NODE_MAP[refInfo.bookKo];
      const sec = BOOK_SECTOR_MAP[refInfo.bookKo];
      if (!targetBookId || !sec) return;

      const sTitle = (sermon.title || sermon.sermonTitle || `${refInfo.bookKo} ${refInfo.chapter}장 강해`).trim();
      const dedupKey = `${sermon.date || ''}_${sTitle}_${refInfo.bookKo}_${refInfo.chapter}`;
      if (seenSermonKeys.has(dedupKey)) return;
      seenSermonKeys.add(dedupKey);

      sTotal++;
      outerBuckets[sec.id].push({
        id: `sermon_${sTotal}`,
        label: sTitle,
        sermonTitle: sTitle,
        preacher: sermon.preacher || '설교 강해',
        date: sermon.date || '',
        ref: `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
        bookName: refInfo.bookKo,
        chapter: refInfo.chapter,
        verse: refInfo.verse,
        summary: sermon.summary || sermon.oneLineSummary || sermon.content || sermon.keywords || '성경 본문 강해 요약',
        parentBookId: targetBookId,
        color: sec.color,
        type: 'sermon',
        sector: sec.name,
        sectorId: sec.id
      });
    };

    if (Array.isArray(rawSermons)) {
      rawSermons.forEach(s => pushSermonStar(s));
    } else if (rawSermons && typeof rawSermons === 'object') {
      if (Array.isArray(rawSermons.sermons)) rawSermons.sermons.forEach(s => pushSermonStar(s));
      if (Array.isArray(rawSermons.items)) rawSermons.items.forEach(s => pushSermonStar(s));
      if (rawSermons.index && typeof rawSermons.index === 'object') {
        Object.entries(rawSermons.index).forEach(([refKey, val]) => {
          if (Array.isArray(val)) val.slice(0, 3).forEach(s => pushSermonStar(s, refKey));
          else if (val && typeof val === 'object') pushSermonStar(val, refKey);
        });
      }
    }

    Object.entries(mergedDailyRecords).forEach(([dateKey, dVal]) => {
      if (!dVal) return;
      if (dVal.qtTitle || dVal.qtMeditation || dVal.qtApplication || dVal.qtReference) {
        const refInfo = extractBibleRefInfo(`${dVal.qtReference || ''} ${dVal.qtTitle || ''} ${dVal.qtMeditation || ''}`);
        if (refInfo) {
          const sec = BOOK_SECTOR_MAP[refInfo.bookKo];
          const targetBookId = BOOK_NODE_MAP[refInfo.bookKo];
          if (sec && targetBookId) {
            outerBuckets[sec.id].push({
              id: `my_qt_${dateKey}`,
              label: `[QT] ${dVal.qtTitle || dateKey}`,
              date: dateKey,
              ref: dVal.qtReference || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
              bookName: refInfo.bookKo,
              chapter: refInfo.chapter,
              verse: refInfo.verse,
              summary: dVal.qtMeditation || '나의 QT 묵상 기록',
              application: dVal.qtApplication || '',
              parentBookId: targetBookId,
              color: '#F43F5E',
              type: 'qt',
              sector: sec.name,
              sectorId: sec.id
            });
          }
        }
      }

      if (dVal.sermonTitle || dVal.sermonNotes || dVal.sermonReference) {
        const refInfo = extractBibleRefInfo(`${dVal.sermonReference || ''} ${dVal.sermonTitle || ''} ${dVal.sermonNotes || ''}`);
        if (refInfo) {
          const sec = BOOK_SECTOR_MAP[refInfo.bookKo];
          const targetBookId = BOOK_NODE_MAP[refInfo.bookKo];
          if (sec && targetBookId) {
            outerBuckets[sec.id].push({
              id: `my_sermon_note_${dateKey}`,
              label: `[노트] ${dVal.sermonTitle || dateKey}`,
              date: dateKey,
              preacher: dVal.sermonPreacher || '',
              ref: dVal.sermonReference || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
              bookName: refInfo.bookKo,
              chapter: refInfo.chapter,
              verse: refInfo.verse,
              summary: String(dVal.sermonNotes || '').replace(/<[^>]*>?/gm, '').slice(0, 220),
              parentBookId: targetBookId,
              color: '#FBBF24',
              type: 'qt',
              sector: sec.name,
              sectorId: sec.id
            });
          }
        }
      }
    });

    (Array.isArray(bibleNotes) ? bibleNotes : []).forEach((bNote, idx) => {
      const firstVerseRef = bNote?.verses?.[0]?.ref || '';
      const refInfo = extractBibleRefInfo(`${firstVerseRef} ${bNote.note || ''}`);
      if (!refInfo) return;
      const sec = BOOK_SECTOR_MAP[refInfo.bookKo];
      const targetBookId = BOOK_NODE_MAP[refInfo.bookKo];
      if (!sec || !targetBookId) return;

      outerBuckets[sec.id].push({
        id: `bible_note_${bNote.id || idx}`,
        label: `[성경노트] ${firstVerseRef || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`}`,
        date: bNote.date || '',
        ref: firstVerseRef || `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
        bookName: refInfo.bookKo,
        chapter: refInfo.chapter,
        verse: refInfo.verse,
        summary: bNote.note || bNote?.verses?.[0]?.text || '성경 묵상 노트',
        parentBookId: targetBookId,
        color: '#34D399',
        type: 'qt',
        sector: sec.name,
        sectorId: sec.id
      });
    });

    (Array.isArray(generalNotes) ? generalNotes : []).forEach((gNote, idx) => {
      const refInfo = extractBibleRefInfo(`${gNote.title || ''} ${gNote.content || ''}`);
      if (!refInfo) return;
      const sec = BOOK_SECTOR_MAP[refInfo.bookKo];
      const targetBookId = BOOK_NODE_MAP[refInfo.bookKo];
      if (!sec || !targetBookId) return;

      outerBuckets[sec.id].push({
        id: `gen_note_${gNote.id || idx}`,
        label: `[자유노트] ${gNote.title || '말씀 노트'}`,
        date: gNote.updatedAt || '',
        ref: `${refInfo.bookKo} ${refInfo.chapter}:${refInfo.verse}`,
        bookName: refInfo.bookKo,
        chapter: refInfo.chapter,
        verse: refInfo.verse,
        summary: String(gNote.content || '').replace(/<[^>]*>?/gm, '').slice(0, 200),
        parentBookId: targetBookId,
        color: '#A855F7',
        type: 'qt',
        sector: sec.name,
        sectorId: sec.id
      });
    });

    (customGalaxyNodes || []).forEach((cNode, idx) => {
      const sec = BOOK_SECTOR_MAP[cNode.bookName] || CANON_SECTORS[0];
      const targetBookId = BOOK_NODE_MAP[cNode.bookName] || 'book_창세기';
      outerBuckets[sec.id].push({
        ...cNode,
        id: cNode.id || `custom_${idx}`,
        parentBookId: targetBookId,
        sector: sec.name,
        sectorId: sec.id
      });
    });

    // TRACKTOR IMG_3828 / IMG_3831 외곽 동심원 복수 링 배치
    const OUTER_RING_RADII = [375, 405, 435, 465];

    CANON_SECTORS.forEach((sec, sIdx) => {
      const items = outerBuckets[sec.id] || [];
      if (items.length === 0) return;

      const pad = 1.8;
      const startA = sec.angleStart + pad;
      const endA = sec.angleEnd - pad;
      const usableAngle = Math.max(4, endA - startA);
      const maxPerRow = Math.max(4, Math.floor(usableAngle / 2.2));

      const hexCenterDist = HEX_CELL_RADIUS * 1.82;
      const hexAngle = ((sIdx / CANON_SECTORS.length) * Math.PI * 2) - Math.PI / 2;
      const secHexX = Math.cos(hexAngle) * hexCenterDist;
      const secHexY = Math.sin(hexAngle) * hexCenterDist;

      items.forEach((item, idx) => {
        const rowIdx = Math.floor(idx / maxPerRow);
        const colIdx = idx % maxPerRow;
        const itemsInThisRow = Math.min(maxPerRow, items.length - rowIdx * maxPerRow);
        const angleStep = usableAngle / (itemsInThisRow + 1);
        const assignedAngle = startA + angleStep * (colIdx + 1);
        const assignedRadius = OUTER_RING_RADII[rowIdx % OUTER_RING_RADII.length] + Math.floor(rowIdx / 4) * 26;

        const rad = (assignedAngle * Math.PI) / 180;
        const r3d = 345 + (rowIdx % 3) * 30;
        const tilt = ((rowIdx % 3) - 1) * 0.28;
        const x3d = r3d * Math.cos(rad);
        const z3d = r3d * Math.sin(rad);
        const y3d = r3d * Math.sin(rad) * tilt + ((idx % 2 === 0 ? 1 : -1) * 14);

        const localHexAngle = (idx * 2.39996) % (Math.PI * 2);
        const localHexR = 92 + (idx % 4) * 14;

        nodes.push({
          ...item,
          level: item.type === 'sermon' ? 3 : 4,
          radius: assignedRadius,
          angle: assignedAngle,
          xHex: secHexX + Math.cos(localHexAngle) * localHexR,
          yHex: secHexY + Math.sin(localHexAngle) * localHexR,
          x3d, y3d, z3d,
          size: 8.5
        });

        links.push({
          source: item.parentBookId,
          target: item.id,
          color: item.color,
          alpha: 0.22
        });
      });
    });

    ORIGINAL_LANGUAGE_ROOTS.forEach((root, rIdx) => {
      const rad = (root.angle * Math.PI) / 180;
      const r3d = 445;
      const elev = Math.sin(rIdx * 1.1) * 135;

      nodes.push({
        id: root.id,
        label: `${root.original} ${root.pron}`,
        original: root.original,
        pron: root.pron,
        strongs: root.strongs,
        lang: root.lang,
        grammar: root.grammar,
        koreanName: root.label,
        desc: root.meaning,
        books: root.books,
        level: 5,
        radius: 520,
        angle: root.angle,
        xHex: Math.cos(rad) * 115,
        yHex: Math.sin(rad) * 115,
        x3d: r3d * Math.cos(rad),
        y3d: elev,
        z3d: r3d * Math.sin(rad),
        size: 13,
        color: root.color,
        type: 'original_word'
      });

      root.books.forEach(bName => {
        if (BOOK_NODE_MAP[bName]) {
          links.push({ source: root.id, target: BOOK_NODE_MAP[bName], color: root.color, alpha: 0.28, dashed: true });
        }
      });
    });

    return { nodes, links };
  }, [rawSermons, mergedDailyRecords, bibleNotes, generalNotes, readVerses, customGalaxyNodes]);

  useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    }
    if (!initialRefQuery) return;
    const parsedRef = extractBibleRefInfo(initialRefQuery);
    if (!parsedRef) return;

    setArcFromBookFilter(parsedRef.bookKo);
    setArcFromChapFilter('ALL');
    setScrubbedBookKo(null);

    const exactChapArc = allFullArcs.find(
      a =>
        (a.fromBook === parsedRef.bookKo && a.fromChap === parsedRef.chapter) ||
        (a.toBook === parsedRef.bookKo && a.toChap === parsedRef.chapter)
    );
    const anyBookArc = allFullArcs.find(
      a => a.fromBook === parsedRef.bookKo || a.toBook === parsedRef.bookKo
    );
    if (exactChapArc) setSelectedArc(exactChapArc);
    else if (anyBookArc) setSelectedArc(anyBookArc);

    const targetBookNode = galaxyData.nodes.find(
      n => n.type === 'book' && n.bookName === parsedRef.bookKo
    );
    if (targetBookNode) {
      setSelectedNode({ ...targetBookNode, chapter: parsedRef.chapter, verse: parsedRef.verse });
      setPreviewChap(parsedRef.chapter || 1);
    }
  }, [initialRefQuery, initialMode, allFullArcs.length, galaxyData.nodes.length]);

  const relatedOriginalRoots = useMemo(() => {
    if (!selectedNode) return ORIGINAL_LANGUAGE_ROOTS.slice(0, 4);
    if (selectedNode.type === 'original_word') {
      return ORIGINAL_LANGUAGE_ROOTS.filter(r => r.id === selectedNode.id);
    }
    const targetBook = selectedNode.bookName;
    if (targetBook) {
      const matched = ORIGINAL_LANGUAGE_ROOTS.filter(r => r.books.includes(targetBook));
      if (matched.length > 0) return matched;
    }
    return ORIGINAL_LANGUAGE_ROOTS.slice(0, 3);
  }, [selectedNode]);

  const connectedNodeIds = useMemo(() => {
    const set = new Set();
    const activeTarget = selectedNode || hoveredNode;
    if (!activeTarget) return set;
    set.add(activeTarget.id);
    galaxyData.links.forEach(l => {
      if (l.source === activeTarget.id) set.add(l.target);
      if (l.target === activeTarget.id) set.add(l.source);
    });
    return set;
  }, [selectedNode, hoveredNode, galaxyData]);

  const connectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    return galaxyData.nodes.filter(n => n.id !== selectedNode.id && connectedNodeIds.has(n.id));
  }, [selectedNode, galaxyData, connectedNodeIds]);

  const filteredListNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return galaxyData.nodes.filter(n => {
      if (n.type === 'core' || n.type === 'sector') return false;
      if (orbitFilter !== 'all' && n.type !== orbitFilter) return false;
      if (!q) return true;
      return (
        n.label?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.ref?.toLowerCase().includes(q) ||
        n.desc?.toLowerCase().includes(q) ||
        n.bookName?.toLowerCase().includes(q)
      );
    });
  }, [galaxyData.nodes, orbitFilter, searchQuery]);

  const orbitCounts = useMemo(() => {
    const counts = { all: 0, book: 0, sermon: 0, qt: 0, original_word: 0 };
    galaxyData.nodes.forEach(n => {
      if (n.type === 'core' || n.type === 'sector') return;
      counts.all++;
      if (counts[n.type] !== undefined) counts[n.type]++;
    });
    return counts;
  }, [galaxyData.nodes]);

  const theme = GALAXY_THEMES[currentTheme] || GALAXY_THEMES.oceano;

  // 📸 TRACKTOR 'Baixar PNG' 캔버스 고해상도 스냅샷 다운로드
  const handleDownloadCanvasPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `Bible_Galaxy_${viewMode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('📸 현재 은하계·아크 뷰포트가 고해상도 PNG로 저장되었습니다!');
    } catch (_) {
      showToast('스냅샷 저장 중 오류가 발생했습니다.');
    }
  }, [viewMode, showToast]);

  const getArcGeometry = useCallback((width, height) => {
    const isMobile = width < 640;
    const padX = Math.max(24, Math.round(width * (isMobile ? 0.068 : 0.055)));
    const usableW = Math.max(120, width - padX * 2);
    const maxRadiusPossible = usableW / 2;

    const topSafeMargin = isMobile ? 96 : 92;
    const bottomSafeMargin = isMobile ? 190 : 182;
    const baselineY = Math.max(topSafeMargin + 85, Math.min(height - bottomSafeMargin, height * (isMobile ? 0.54 : 0.60)));
    const availableArchHeight = Math.max(70, baselineY - topSafeMargin);
    const verticalScale = Math.max(0.28, Math.min(1.0, availableArchHeight / Math.max(1, maxRadiusPossible)));

    return { padX, usableW, baselineY, verticalScale };
  }, []);

  const bakeArcDiagramBuffer = useCallback((width, height, rawDpr) => {
    if (!width || !height || width < 20 || height < 20) return;

    const safeDpr = Math.min(rawDpr || 1, 1.75);
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, Math.round(width * safeDpr));
    offscreen.height = Math.max(1, Math.round(height * safeDpr));
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;
    oCtx.scale(safeDpr, safeDpr);

    const { padX, usableW, baselineY, verticalScale } = getArcGeometry(width, height);
    const chapToX = (globalChap) => padX + (globalChap / (TOTAL_BIBLE_CHAPTERS - 1)) * usableW;
    const hasBookFilter = arcFromBookFilter !== 'ALL' || arcToBookFilter !== 'ALL';
    const baseAlpha = hasBookFilter ? 0.42 : 0.22;

    const buckets = { violet: [], indigo: [], sky: [], teal: [], rose: [] };

    allFullArcs.forEach((th) => {
      if (arcCategoryFilter !== 'all' && th.category !== arcCategoryFilter) return;

      if (hasBookFilter) {
        const matchA = arcFromBookFilter === 'ALL' || th.fromBook === arcFromBookFilter || th.toBook === arcFromBookFilter;
        const matchB = arcToBookFilter === 'ALL' || th.toBook === arcToBookFilter || th.fromBook === arcToBookFilter;
        if (!matchA || !matchB) return;
      }

      if (th.category === 'user_sync') {
        buckets.rose.push(th);
        return;
      }

      const spanRatio = th.span / TOTAL_BIBLE_CHAPTERS;
      if (spanRatio > 0.62) buckets.violet.push(th);
      else if (spanRatio > 0.32) buckets.indigo.push(th);
      else if (spanRatio > 0.14) buckets.sky.push(th);
      else buckets.teal.push(th);
    });

    const bucketStyles = [
      { key: 'violet', color: `rgba(139, 92, 246, ${baseAlpha + 0.04})`, lw: hasBookFilter ? 1.25 : 0.95 },
      { key: 'indigo', color: `rgba(99, 102, 241, ${baseAlpha})`, lw: hasBookFilter ? 1.25 : 0.95 },
      { key: 'sky', color: `rgba(56, 189, 248, ${baseAlpha})`, lw: hasBookFilter ? 1.25 : 0.95 },
      { key: 'teal', color: `rgba(45, 212, 191, ${baseAlpha})`, lw: hasBookFilter ? 1.25 : 0.95 },
      { key: 'rose', color: 'rgba(251, 113, 133, 0.55)', lw: 1.45 }
    ];

    bucketStyles.forEach(({ key, color, lw }) => {
      const list = buckets[key];
      if (list.length === 0) return;
      oCtx.beginPath();
      for (let i = 0; i < list.length; i++) {
        const th = list[i];
        const x1 = chapToX(th.start);
        const x2 = chapToX(th.end);
        const cx = (x1 + x2) / 2;
        const rx = Math.abs(x2 - x1) / 2;
        const ry = rx * verticalScale;
        if (rx < 0.5 || ry < 0.5) continue;
        oCtx.moveTo(cx - rx, baselineY);
        oCtx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
      }
      oCtx.strokeStyle = color;
      oCtx.lineWidth = lw;
      oCtx.stroke();
    });

    oCtx.beginPath();
    oCtx.moveTo(padX, baselineY);
    oCtx.lineTo(padX + usableW, baselineY);
    oCtx.strokeStyle = 'rgba(226, 241, 255, 0.75)';
    oCtx.lineWidth = 1.2;
    oCtx.stroke();

    CANON_BOOKS_WITH_OFFSET.forEach((bk) => {
      const bx = chapToX(bk.startGlobalChap);
      oCtx.beginPath();
      oCtx.moveTo(bx, baselineY + 1);
      oCtx.lineTo(bx, baselineY + (bk.chaps >= 24 ? 9 : 5));
      oCtx.strokeStyle = bk.isOT ? 'rgba(148, 163, 184, 0.7)' : 'rgba(251, 191, 36, 0.85)';
      oCtx.lineWidth = bk.chaps >= 24 ? 1.1 : 0.65;
      oCtx.stroke();
    });

    const otEndX = chapToX(929);
    const barY = baselineY + 13;

    oCtx.beginPath();
    oCtx.moveTo(padX, barY);
    oCtx.lineTo(otEndX - 3, barY);
    oCtx.strokeStyle = '#94A3B8';
    oCtx.lineWidth = 3;
    oCtx.stroke();

    oCtx.font = 'bold 11px sans-serif';
    oCtx.fillStyle = '#E2E8F0';
    oCtx.textAlign = 'center';
    oCtx.fillText(width < 520 ? '구약 (39권 · 929장)' : '구약 (39권 · 929장 — 정경 & OpenBible 교차참조)', (padX + otEndX) / 2, barY + 16);

    oCtx.beginPath();
    oCtx.moveTo(otEndX + 3, barY);
    oCtx.lineTo(padX + usableW, barY);
    oCtx.strokeStyle = '#D97706';
    oCtx.lineWidth = 3;
    oCtx.stroke();

    oCtx.fillStyle = '#FBBF24';
    oCtx.fillText('신약 (27권)', (otEndX + padX + usableW) / 2, barY + 16);

    arcBgBufferRef.current = {
      canvas: offscreen,
      width,
      height,
      padX,
      usableW,
      baselineY,
      verticalScale,
      filterKey: `${arcCategoryFilter}_${arcFromBookFilter}_${arcFromChapFilter}_${arcToBookFilter}_${allFullArcs.length}`
    };
  }, [allFullArcs, arcCategoryFilter, arcFromBookFilter, arcFromChapFilter, arcToBookFilter, getArcGeometry]);

  const findClosestArcAtScreenPos = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const buf = arcBgBufferRef.current;
    if (!canvas || !buf) return null;

    const rect = canvas.getBoundingClientRect();
    const width = buf.width;
    const height = buf.height;
    if (!width || !height) return null;

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const zoom = cameraRef.current.zoom;
    const camX = width / 2 + cameraRef.current.x;
    const camY = height / 2 + cameraRef.current.y;
    const wx = (sx - camX) / zoom + width / 2;
    const wy = (sy - camY) / zoom + height / 2;

    const { padX, usableW, baselineY, verticalScale } = buf;
    if (wy > baselineY + 18) return null;

    const chapToX = (globalChap) => padX + (globalChap / (TOTAL_BIBLE_CHAPTERS - 1)) * usableW;

    let bestArc = null;
    let minDistance = 18 / Math.sqrt(zoom);

    for (let i = 0; i < activeFilteredArcs.length; i++) {
      const arc = activeFilteredArcs[i];
      const x1 = chapToX(arc.start);
      const x2 = chapToX(arc.end);
      const cx = (x1 + x2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = rx * verticalScale;
      if (rx < 2 || ry < 2) continue;

      const dx = wx - cx;
      const dy = baselineY - wy;
      if (dy < -10 || Math.abs(dx) > rx + 18) continue;

      const theta = Math.atan2(dy / ry, dx / rx);
      if (theta < -0.05 || theta > Math.PI + 0.05) continue;

      const ex = cx + rx * Math.cos(theta);
      const ey = baselineY - ry * Math.sin(theta);
      const dist = Math.hypot(wx - ex, wy - ey);

      if (dist < minDistance) {
        minDistance = dist;
        bestArc = arc;
      }
    }

    return bestArc;
  }, [activeFilteredArcs]);

  const renderStateRef = useRef({});
  renderStateRef.current = {
    viewMode,
    galaxyData,
    rotationSpeed,
    orbitSpacing,
    nodeScale,
    showOuterLabels,
    theme,
    searchQuery,
    orbitFilter,
    selectedNode,
    hoveredNode,
    connectedNodeIds,
    arcCategoryFilter,
    arcFromBookFilter,
    arcFromChapFilter,
    arcToBookFilter,
    allFullArcs,
    activeFilteredArcs,
    selectedArc,
    hoveredArc,
    scrubbedBookKo,
    bakeArcDiagramBuffer
  };

  useEffect(() => {
    if (viewMode === 'list') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId;
    let pulseTick = 0;

    const render = () => {
      const st = renderStateRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (!width || !height || width < 20 || height < 20) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      pulseTick += 0.022;

      // 1. 배경 채우기 + TRACKTOR 스타일 마이크로 도트 매트릭스 그리드
      ctx.fillStyle = st.theme.bg;
      ctx.fillRect(0, 0, width, height);

      if (st.viewMode !== 'arc') {
        const gridStep = 28;
        ctx.fillStyle = st.theme.gridDot || 'rgba(56, 189, 248, 0.07)';
        for (let gx = (width % gridStep) / 2; gx < width; gx += gridStep) {
          for (let gy = (height % gridStep) / 2; gy < height; gy += gridStep) {
            ctx.fillRect(gx, gy, 1.5, 1.5);
          }
        }
      }

      // =====================================================================
      // 🌈 MODE A: 성경 1,189장 구속사 아크 뷰
      // =====================================================================
      if (st.viewMode === 'arc') {
        const expectedFilterKey = `${st.arcCategoryFilter}_${st.arcFromBookFilter}_${st.arcFromChapFilter}_${st.arcToBookFilter}_${st.allFullArcs.length}`;
        if (
          !arcBgBufferRef.current ||
          arcBgBufferRef.current.width !== width ||
          arcBgBufferRef.current.height !== height ||
          arcBgBufferRef.current.filterKey !== expectedFilterKey
        ) {
          st.bakeArcDiagramBuffer(width, height, dpr);
        }

        const buf = arcBgBufferRef.current;
        if (buf && buf.canvas && buf.canvas.width > 0 && buf.canvas.height > 0) {
          ctx.save();
          const zoom = cameraRef.current.zoom;
          const camX = width / 2 + cameraRef.current.x;
          const camY = height / 2 + cameraRef.current.y;
          ctx.translate(camX, camY);
          ctx.scale(zoom, zoom);
          ctx.translate(-width / 2, -height / 2);

          ctx.drawImage(buf.canvas, 0, 0, width, height);

          const { padX, usableW, baselineY, verticalScale } = buf;
          const chapToX = (globalChap) => padX + (globalChap / (TOTAL_BIBLE_CHAPTERS - 1)) * usableW;

          if (st.scrubbedBookKo) {
            const bkMeta = BOOK_OFFSET_MAP[st.scrubbedBookKo];
            if (bkMeta) {
              ctx.beginPath();
              st.activeFilteredArcs.forEach(th => {
                const x1 = chapToX(th.start);
                const x2 = chapToX(th.end);
                const cx = (x1 + x2) / 2;
                const rx = Math.abs(x2 - x1) / 2;
                const ry = rx * verticalScale;
                if (rx < 0.5 || ry < 0.5) return;
                ctx.moveTo(cx - rx, baselineY);
                ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
              });
              ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
              ctx.lineWidth = 1.2;
              ctx.stroke();

              const bx1 = chapToX(bkMeta.startGlobalChap);
              const bx2 = chapToX(bkMeta.endGlobalChap);
              ctx.fillStyle = '#FACC15';
              ctx.fillRect(bx1, baselineY - 3, Math.max(6, bx2 - bx1), 6);

              ctx.font = 'bold 12px sans-serif';
              ctx.fillStyle = '#FEF08A';
              ctx.textAlign = 'center';
              ctx.fillText(`📖 ${bkMeta.ko} (${st.activeFilteredArcs.length}개 연결선)`, Math.min(width - 75, Math.max(75, (bx1 + bx2) / 2)), baselineY - 12);
            }
          }

          if (st.hoveredArc && st.hoveredArc.id !== st.selectedArc?.id) {
            const hx1 = chapToX(st.hoveredArc.start);
            const hx2 = chapToX(st.hoveredArc.end);
            const hcx = (hx1 + hx2) / 2;
            const hrx = Math.abs(hx2 - hx1) / 2;
            const hry = hrx * verticalScale;

            ctx.beginPath();
            ctx.ellipse(hcx, baselineY, hrx, hry, 0, Math.PI, 0, false);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.2 / Math.sqrt(zoom);
            ctx.stroke();
          }

          const activeArc = st.selectedArc || st.activeFilteredArcs[0];
          if (activeArc) {
            const x1 = chapToX(activeArc.start);
            const x2 = chapToX(activeArc.end);
            const cx = (x1 + x2) / 2;
            const rx = Math.abs(x2 - x1) / 2;
            const ry = rx * verticalScale;

            if (rx > 0.5 && ry > 0.5) {
              ctx.beginPath();
              ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
              ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
              ctx.lineWidth = 6.5 / Math.sqrt(zoom);
              ctx.stroke();

              ctx.beginPath();
              ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 2.5 / Math.sqrt(zoom);
              ctx.stroke();

              const tAngle = Math.PI - (pulseTick % Math.PI);
              const px = cx + rx * Math.cos(tAngle);
              const py = baselineY - ry * Math.sin(tAngle);

              ctx.beginPath();
              ctx.arc(px, py, 5 / Math.sqrt(zoom), 0, Math.PI * 2);
              ctx.fillStyle = '#FEF08A';
              ctx.fill();
            }

            [
              { x: x1, label: `${activeArc.fromBook} ${activeArc.fromChap}:${activeArc.fromVerse}` },
              { x: x2, label: `${activeArc.toBook} ${activeArc.toChap}:${activeArc.toVerse}` }
            ].forEach((pt, idx) => {
              ctx.beginPath();
              ctx.arc(pt.x, baselineY, 5.5 / Math.sqrt(zoom), 0, Math.PI * 2);
              ctx.fillStyle = '#FACC15';
              ctx.fill();
              ctx.lineWidth = 2 / Math.sqrt(zoom);
              ctx.strokeStyle = '#05080F';
              ctx.stroke();

              ctx.save();
              ctx.font = 'bold 11px sans-serif';
              const tw = ctx.measureText(pt.label).width + 14;
              const halfLabelWorldW = (tw / 2 + 8) / zoom;
              const safeLabelX = Math.max(halfLabelWorldW, Math.min(width - halfLabelWorldW, pt.x));

              ctx.translate(safeLabelX, baselineY - (idx === 0 ? 18 : 38) / zoom);
              ctx.scale(1 / zoom, 1 / zoom);

              ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
              drawSafeRoundRect(ctx, -tw / 2, -10, tw, 20, 6);
              ctx.fill();
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1.1;
              ctx.stroke();

              ctx.fillStyle = '#FEF08A';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(pt.label, 0, 0);
              ctx.restore();
            });
          }

          ctx.restore();
        }

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // =====================================================================
      // 🌌 MODE B/C/D/E: TRACKTOR 2D Rings / Hex Cells / HUD Comando / 3D
      // =====================================================================
      if (targetCameraRef.current && st.viewMode !== '3d') {
        cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * 0.14;
        cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * 0.14;
        cameraRef.current.zoom += (targetCameraRef.current.zoom - cameraRef.current.zoom) * 0.14;
        if (
          Math.abs(targetCameraRef.current.x - cameraRef.current.x) < 0.4 &&
          Math.abs(targetCameraRef.current.y - cameraRef.current.y) < 0.4 &&
          Math.abs(targetCameraRef.current.zoom - cameraRef.current.zoom) < 0.01
        ) {
          targetCameraRef.current = null;
        }
      }

      ctx.save();
      const camX = width / 2 + (st.viewMode !== '3d' ? cameraRef.current.x : 0);
      const camY = height / 2 + (st.viewMode !== '3d' ? cameraRef.current.y : 0);
      const zoom = cameraRef.current.zoom;

      ctx.translate(camX, camY);
      ctx.scale(zoom, zoom);

      const activeFocusNode = st.selectedNode || st.hoveredNode;
      const effectiveSpeed = activeFocusNode ? 0 : st.rotationSpeed;
      globalRotationRef.current += effectiveSpeed * 0.0022;
      const rot = globalRotationRef.current;

      const posMap = new Map();

      if (st.viewMode === '3d') {
        if (!isDraggingRef.current && !activeFocusNode) {
          planetRotRef.current.yaw += effectiveSpeed * 0.004;
        }

        const yaw = planetRotRef.current.yaw;
        const pitch = planetRotRef.current.pitch;
        const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        const fov = 750;

        [225, 345].forEach((sphereRad, idx) => {
          const r = sphereRad * st.orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = st.theme.orbitLine;
          ctx.lineWidth = idx === 0 ? 1.2 : 0.7;
          ctx.globalAlpha = idx === 0 ? 0.5 : 0.25;
          ctx.stroke();
        });

        st.galaxyData.nodes.forEach(node => {
          const sx = (node.x3d || 0) * st.orbitSpacing;
          const sy = (node.y3d || 0) * st.orbitSpacing;
          const sz = (node.z3d || 0) * st.orbitSpacing;

          const x1 = sx * cosY - sz * sinY;
          const z1 = sz * cosY + sx * sinY;
          const y2 = sy * cosP - z1 * sinP;
          const z2 = z1 * cosP + sy * sinP;

          const perspective = fov / Math.max(120, fov + z2);
          posMap.set(node.id, { x: x1 * perspective, y: y2 * perspective, zDepth: z2, perspScale: perspective, ...node });
        });
      } else if (st.viewMode === 'hex') {
        // ⬢ TRACKTOR IMG_3832: 8대 정경 섹터 육각형 허니컴 셀 렌더링
        st.galaxyData.nodes.forEach(node => {
          if (node.type === 'core') {
            posMap.set(node.id, { x: 0, y: 0, zDepth: 0, perspScale: 1, ...node });
            return;
          }
          if (node.type === 'sector') {
            const hx = node.xHex * st.orbitSpacing;
            const hy = node.yHex * st.orbitSpacing;
            const hexR = (node.hexRadius || 150) * st.orbitSpacing;

            drawHexagonPath(ctx, hx, hy, hexR);
            ctx.fillStyle = 'rgba(8, 15, 26, 0.72)';
            ctx.fill();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = node.color;
            ctx.globalAlpha = 0.65;
            ctx.stroke();

            // 헥사곤 내부 동심원 가이드
            ctx.beginPath();
            ctx.arc(hx, hy, hexR * 0.42, 0, Math.PI * 2);
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 0.75;
            ctx.globalAlpha = 0.25;
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // 섹터 상단 타이틀
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = node.color;
            ctx.textAlign = 'center';
            ctx.fillText(node.label.toUpperCase(), hx, hy - hexR * 0.68);

            posMap.set(node.id, { x: hx, y: hy, zDepth: 0, perspScale: 1, ...node });
            return;
          }

          // 섹터 중심 대비 로컬 회전 적용
          const parentSec = st.galaxyData.nodes.find(s => s.type === 'sector' && s.sectorId === node.sectorId);
          const cx = (parentSec ? parentSec.xHex : 0) * st.orbitSpacing;
          const cy = (parentSec ? parentSec.yHex : 0) * st.orbitSpacing;
          const dx = (node.xHex - (parentSec?.xHex || 0)) * st.orbitSpacing;
          const dy = (node.yHex - (parentSec?.yHex || 0)) * st.orbitSpacing;
          const localDist = Math.hypot(dx, dy);
          const localAngle = Math.atan2(dy, dx) + rot * (node.type === 'book' ? 0.5 : -0.35);

          posMap.set(node.id, {
            x: cx + Math.cos(localAngle) * localDist,
            y: cy + Math.sin(localAngle) * localDist,
            zDepth: 0,
            perspScale: 1,
            ...node
          });
        });
      } else {
        // ⭕ TRACKTOR IMG_3828 / IMG_3831 / IMG_3827: 동심원 궤도 + 섹터 도트 클러스터(Radial Dot Matrix)
        const ORBIT_RINGS = st.viewMode === 'hud'
          ? [45, 95, 185, 240, 310]
          : [58, 125, 235, 265, 375, 405, 435, 465, 520];

        ORBIT_RINGS.forEach((baseR, idx) => {
          const r = baseR * st.orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = st.theme.orbitLine;
          ctx.lineWidth = idx === 1 || idx === 4 ? 1.25 : 0.75;
          ctx.globalAlpha = idx >= 4 && idx <= 7 ? 0.38 : 0.68;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });

        // 코어 주변 오비탈 스월(Swirl) 링 연출
        ctx.save();
        ctx.rotate(pulseTick * 0.4);
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 42 * st.orbitSpacing, 26 * st.orbitSpacing, (s * Math.PI) / 3, 0, Math.PI * 1.5);
          ctx.strokeStyle = st.theme.accent;
          ctx.lineWidth = 1.1;
          ctx.globalAlpha = 0.28;
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1.0;

        st.galaxyData.nodes.forEach(node => {
          const baseRad = st.viewMode === 'hud' ? node.radius * 0.68 : node.radius;
          const adjustedRadius = baseRad * st.orbitSpacing;
          const speedFactor = node.level > 0 ? 1 / Math.sqrt(node.level) : 0;
          const angleDeg = node.angle + ((rot * 180) / Math.PI) * speedFactor;
          const angleRad = (angleDeg * Math.PI) / 180;
          posMap.set(node.id, {
            x: adjustedRadius * Math.cos(angleRad),
            y: adjustedRadius * Math.sin(angleRad),
            zDepth: 0,
            perspScale: 1,
            angleRad,
            ...node
          });
        });

        // 🌟 TRACKTOR 시그니처: 성경 각 권의 장(Chapter) 수에 비례하는 방사형 네온 도트 매트릭스 (Radial Spoke Dots)
        posMap.forEach(node => {
          if (node.type !== 'book') return;
          if (st.orbitFilter !== 'all' && st.orbitFilter !== 'book') return;
          const isSelected = activeFocusNode?.id === node.id;
          const isNeighbor = activeFocusNode && st.connectedNodeIds.has(node.id);
          const alpha = activeFocusNode && !isSelected && !isNeighbor ? 0.10 : 0.82;

          const dotCount = node.spokeDots || 6;
          const startR = (st.viewMode === 'hud' ? 88 : 138) * st.orbitSpacing;
          const endR = (st.viewMode === 'hud' ? node.radius * 0.68 - 10 : node.radius - 14) * st.orbitSpacing;
          const stepR = (endR - startR) / Math.max(1, dotCount);

          ctx.fillStyle = node.color;
          ctx.globalAlpha = alpha;
          for (let d = 0; d < dotCount; d++) {
            const dr = startR + d * stepR;
            const dotSize = (1.4 + (d / dotCount) * 1.1) * st.nodeScale;
            ctx.beginPath();
            ctx.arc(dr * Math.cos(node.angleRad), dr * Math.sin(node.angleRad), dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        });
      }

      nodePositionsRef.current = posMap;

      // 🔗 링크 및 TRACKTOR 스타일 다중 베지에 광선(Multi-Ray Bezier Beams) 렌더링
      st.galaxyData.links.forEach(link => {
        const src = posMap.get(link.source);
        const tgt = posMap.get(link.target);
        if (!src || !tgt) return;

        const isHighlightedLink = activeFocusNode && (link.source === activeFocusNode.id || link.target === activeFocusNode.id);
        if (link.isCrossRefLink && !isHighlightedLink) return;
        if (activeFocusNode && !isHighlightedLink) return;

        const backFade = st.viewMode === '3d' && (src.zDepth > 120 || tgt.zDepth > 120) ? 0.25 : 1.0;

        ctx.beginPath();
        if (isHighlightedLink && st.viewMode !== '3d') {
          // 코어(0,0) 쪽으로 살짝 휘어지는 시네마틱 베지에 광선 연출 (IMG_3831 재현)
          const ctrlX = (src.x + tgt.x) * 0.28;
          const ctrlY = (src.y + tgt.y) * 0.28;
          ctx.moveTo(src.x, src.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tgt.x, tgt.y);
        } else {
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
        }

        ctx.strokeStyle = isHighlightedLink
          ? (link.isCrossRefLink ? '#FACC15' : st.theme.accent)
          : (link.color || st.theme.orbitLine);
        ctx.globalAlpha = (isHighlightedLink ? 0.92 : (link.alpha || 0.15)) * backFade;
        ctx.lineWidth = isHighlightedLink ? 2.1 / Math.sqrt(zoom) : 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      const sortedNodes = Array.from(posMap.values()).sort((a, b) => b.zDepth - a.zDepth);
      const isSearchActive = st.searchQuery.trim().length > 0;
      const lowerQuery = st.searchQuery.toLowerCase().trim();
      const labelCandidates = [];

      sortedNodes.forEach(node => {
        if (st.viewMode === 'hex' && node.type === 'sector') return; // 헥사곤 모드에서는 섹터 테두리를 이미 그림

        const matchesFilter = st.orbitFilter === 'all' || node.type === st.orbitFilter || node.type === 'core' || (st.orbitFilter === 'book' && node.type === 'sector');
        const isMatchedSearch = isSearchActive && (
          node.label?.toLowerCase().includes(lowerQuery) ||
          node.summary?.toLowerCase().includes(lowerQuery) ||
          node.ref?.toLowerCase().includes(lowerQuery)
        );

        const isSelected = activeFocusNode?.id === node.id;
        const isNeighbor = activeFocusNode && st.connectedNodeIds.has(node.id);
        const depthAlpha = st.viewMode === '3d' ? Math.max(0.18, Math.min(1.0, (420 - node.zDepth) / 560)) : 1.0;

        let alpha = depthAlpha;
        if (!matchesFilter) alpha = 0.05;
        else if (isSearchActive && !isMatchedSearch) alpha = 0.08;
        else if (activeFocusNode && !isSelected && !isNeighbor) alpha = 0.14;

        const rSize = (node.size || 8) * st.nodeScale * node.perspScale * (isSelected ? 1.45 : isMatchedSearch ? 1.3 : 1.0);

        ctx.globalAlpha = alpha;

        // ⭕ TRACKTOR 이중 링(Double-Ringed Badge) 노드 디자인
        if (node.level >= 3 || node.type === 'core') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize, 0, Math.PI * 2);
          ctx.fillStyle = st.theme.bg;
          ctx.fill();
          ctx.lineWidth = isSelected || isMatchedSearch ? 2.4 : 1.5;
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.82, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 1.28, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#FFFFFF' : node.color;
          ctx.lineWidth = isSelected ? 1.8 : 1.0;
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        const isFrontHemisphere = st.viewMode !== '3d' || node.zDepth < 90 || isSelected || isMatchedSearch;
        if (alpha > 0.25 && isFrontHemisphere) {
          let priority = 0;
          if (isSelected) priority = 100;
          else if (isMatchedSearch) priority = 90;
          else if (isNeighbor) priority = 80;
          else if (node.type === 'core' || node.type === 'sector') priority = 70;
          else if (node.type === 'original_word') priority = 60;
          else if (node.type === 'book') priority = 50;
          else if (st.showOuterLabels || zoom > 1.65) priority = 20;

          if (priority > 0) {
            labelCandidates.push({ node, priority, rSize, isSelected, isMatchedSearch });
          }
        }
      });

      labelCandidates.sort((a, b) => b.priority - a.priority);
      const occupiedBoxes = [];

      labelCandidates.forEach(({ node, priority, rSize, isSelected, isMatchedSearch }) => {
        const screenX = camX + node.x * zoom;
        const screenY = camY + (node.y + rSize + 8 / zoom) * zoom;

        if (screenX < 28 || screenX > width - 28 || screenY < 16 || screenY > height - 16) return;

        const displayLabel = node.label.length > 14 && !isSelected ? `${node.label.slice(0, 13)}…` : node.label;
        const fontSize = isSelected ? 12 : priority >= 70 ? 11 : 10;
        const estWidth = displayLabel.length * (fontSize * 0.88) + 12;
        const estHeight = fontSize + 8;

        const box = {
          left: screenX - estWidth / 2,
          right: screenX + estWidth / 2,
          top: screenY - estHeight / 2,
          bottom: screenY + estHeight / 2
        };

        if (!isSelected) {
          const hasCollision = occupiedBoxes.some(b =>
            !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
          );
          if (hasCollision) return;
        }

        occupiedBoxes.push(box);

        ctx.save();
        ctx.translate(node.x, node.y + rSize + 8 / zoom);
        ctx.scale(1 / zoom, 1 / zoom);

        ctx.font = `${isSelected || priority >= 70 ? 'bold' : '600'} ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textMetrics = ctx.measureText(displayLabel);
        const bgW = textMetrics.width + 10;
        const bgH = fontSize + 6;

        ctx.fillStyle = isSelected ? '#0284C7' : 'rgba(5, 8, 15, 0.86)';
        drawSafeRoundRect(ctx, -bgW / 2, -bgH / 2, bgW, bgH, 5);
        ctx.fill();

        if (isSelected || isMatchedSearch) {
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : st.theme.accent;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }

        ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.level === 1 ? node.color : st.theme.textMain;
        ctx.fillText(displayLabel, 0, 1);
        ctx.restore();
      });

      // 💬 TRACKTOR 시그니처: 호버된 노드의 캔버스 인라인 플로팅 다크 툴팁 카드 (IMG_3831 / IMG_3832 재현)
      if (st.hoveredNode && st.hoveredNode.id !== 'core') {
        const hn = posMap.get(st.hoveredNode.id);
        if (hn) {
          ctx.save();
          ctx.translate(hn.x + 16 / zoom, hn.y - 16 / zoom);
          ctx.scale(1 / zoom, 1 / zoom);

          const cardW = 215;
          const cardH = 64;
          ctx.fillStyle = 'rgba(7, 12, 21, 0.96)';
          drawSafeRoundRect(ctx, 0, -cardH, cardW, cardH, 8);
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = hn.color || st.theme.accent;
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(hn.label.slice(0, 18), 10, -cardH + 20);

          ctx.font = '10.5px monospace';
          ctx.fillStyle = hn.color || st.theme.textSub;
          const subTxt = hn.type === 'book'
            ? `${hn.sector} • ${hn.totalChaps}장 (통독 ${hn.readChaps}장)`
            : (hn.ref || hn.lang || hn.sector || '');
          ctx.fillText(subTxt.slice(0, 26), 10, -cardH + 38);

          ctx.font = '9.5px monospace';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText('CLIQUE PARA INSPECIONAR ➔', 10, -cardH + 54);
          ctx.restore();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewMode]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    arcBgBufferRef.current = null;
  }, []);

  useEffect(() => {
    handleResize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, viewMode]);

  const focusCameraOnNode = useCallback((node) => {
    if (!node) return;
    setSelectedNode(node);
    const pos = nodePositionsRef.current.get(node.id);
    if (pos && viewMode !== '3d' && viewMode !== 'arc') {
      const targetZoom = Math.max(cameraRef.current.zoom, 1.08);
      targetCameraRef.current = {
        x: -pos.x * targetZoom,
        y: -pos.y * targetZoom - (window.innerWidth < 1024 ? 40 : 0),
        zoom: targetZoom
      };
    }
  }, [viewMode]);

  const handleArcPointerAction = useCallback((clientX, clientY, isClick = false) => {
    if (!isClick && Date.now() - lastTouchScrubTimeRef.current < 50) return;
    lastTouchScrubTimeRef.current = Date.now();

    const canvas = canvasRef.current;
    const buf = arcBgBufferRef.current;
    if (!canvas || !buf) return;

    const rect = canvas.getBoundingClientRect();
    const height = buf.height;
    const zoom = cameraRef.current.zoom;
    const camY = height / 2 + cameraRef.current.y;
    const wy = ((clientY - rect.top) - camY) / zoom + height / 2;

    if (Math.abs(wy - buf.baselineY) <= 24) {
      const width = buf.width;
      const camX = width / 2 + cameraRef.current.x;
      const wx = ((clientX - rect.left) - camX) / zoom + width / 2;
      const ratio = Math.max(0, Math.min(1, (wx - buf.padX) / Math.max(1, buf.usableW)));
      const targetGlobalChap = Math.round(ratio * (TOTAL_BIBLE_CHAPTERS - 1));
      const foundBook = CANON_BOOKS_WITH_OFFSET.find(
        b => targetGlobalChap >= b.startGlobalChap && targetGlobalChap <= b.endGlobalChap
      );
      if (foundBook) {
        setScrubbedBookKo(foundBook.ko);
        const firstArcForBook = allFullArcs.find(a => a.fromBook === foundBook.ko || a.toBook === foundBook.ko);
        if (firstArcForBook) setSelectedArc(firstArcForBook);
      }
      return;
    }

    const hitArc = findClosestArcAtScreenPos(clientX, clientY);
    if (hitArc) {
      if (isClick) {
        setIsAutoTourPlaying(false);
        setSelectedArc(hitArc);
      } else {
        setHoveredArc(hitArc);
      }
    } else if (!isClick) {
      setHoveredArc(null);
    }
  }, [allFullArcs, findClosestArcAtScreenPos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode === 'list') return;

    const handleNativeWheel = (e) => {
      if (e.cancelable) e.preventDefault();
      targetCameraRef.current = null;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      cameraRef.current.zoom = Math.min(4.0, Math.max(0.28, cameraRef.current.zoom * zoomFactor));
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [viewMode]);

  const handleTouchStart = (e) => {
    targetCameraRef.current = null;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
      isDraggingRef.current = false;
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragMovedRef.current = false;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchDistRef.current;
      cameraRef.current.zoom = Math.min(4.0, Math.max(0.28, cameraRef.current.zoom * ratio));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;

      if (viewMode === 'arc') {
        if (cameraRef.current.zoom > 1.05) {
          cameraRef.current.x += dx;
          cameraRef.current.y += dy;
        } else {
          handleArcPointerAction(e.touches[0].clientX, e.touches[0].clientY, true);
        }
      } else if (viewMode === '3d') {
        planetRotRef.current.yaw += dx * 0.007;
        planetRotRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, planetRotRef.current.pitch + dy * 0.007));
      } else {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
      }
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e) => {
    pinchDistRef.current = null;
    isDraggingRef.current = false;
    if (!dragMovedRef.current && e.changedTouches && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      if (viewMode === 'arc') {
        handleArcPointerAction(touch.clientX, touch.clientY, true);
      }
    }
  };

  const handleMouseDown = (e) => {
    targetCameraRef.current = null;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) {
      if (viewMode === 'arc') {
        handleArcPointerAction(e.clientX, e.clientY, false);
      } else {
        // 2D / Hex / HUD / 3D 마우스 호버 노드 감지
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const camX = width / 2 + (viewMode !== '3d' ? cameraRef.current.x : 0);
        const camY = height / 2 + (viewMode !== '3d' ? cameraRef.current.y : 0);
        const worldX = (mx - camX) / cameraRef.current.zoom;
        const worldY = (my - camY) / cameraRef.current.zoom;

        let closest = null;
        let minDist = 20 / Math.sqrt(cameraRef.current.zoom);
        nodePositionsRef.current.forEach(node => {
          if (orbitFilter !== 'all' && node.type !== orbitFilter && node.type !== 'core') return;
          if (viewMode === '3d' && node.zDepth > 180) return;
          const dist = Math.hypot(worldX - node.x, worldY - node.y);
          if (dist < minDist) {
            minDist = dist;
            closest = node;
          }
        });
        setHoveredNode(closest);
      }
      return;
    }
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 5) dragMovedRef.current = true;

    if (viewMode === 'arc') {
      if (cameraRef.current.zoom > 1.05) {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
      } else {
        handleArcPointerAction(e.clientX, e.clientY, true);
      }
    } else if (viewMode === '3d') {
      planetRotRef.current.yaw += dx * 0.0065;
      planetRotRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, planetRotRef.current.pitch + dy * 0.0065));
    } else {
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e) => {
    if (dragMovedRef.current) return;
    if (viewMode === 'arc') {
      handleArcPointerAction(e.clientX, e.clientY, true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const camX = width / 2 + (viewMode !== '3d' ? cameraRef.current.x : 0);
    const camY = height / 2 + (viewMode !== '3d' ? cameraRef.current.y : 0);

    const worldX = (clickX - camX) / cameraRef.current.zoom;
    const worldY = (clickY - camY) / cameraRef.current.zoom;

    let closestNode = null;
    let minDist = 28 / Math.sqrt(cameraRef.current.zoom);

    nodePositionsRef.current.forEach(node => {
      if (orbitFilter !== 'all' && node.type !== orbitFilter && node.type !== 'core') return;
      if (viewMode === '3d' && node.zDepth > 180) return;
      const dist = Math.hypot(worldX - node.x, worldY - node.y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    if (closestNode) {
      focusCameraOnNode(closestNode);
    } else {
      setSelectedNode(null);
    }
  };

  const handleJumpToBibleChapter = (bookKo, chap = 1, verseNum = 1) => {
    const enBook = KO_TO_EN_BOOK[bookKo] || 'Genesis';
    const targetChapId = `${enBook}-${chap}`;
    const validV = clampValidVerse(bookKo, chap, verseNum);

    if (isModalPopup || typeof setCurrentChapId !== 'function') {
      const bObj = BIBLE_BOOK_LOOKUP[enBook] || BIBLE_BOOK_LOOKUP[bookKo];
      const chapArr = bObj?.chapters?.[Math.max(0, chap - 1)] || [];
      setReaderModalData({
        mode: 'single',
        bookKo,
        enBook,
        chap,
        targetVerse: validV,
        verses: chapArr.map((t, i) => {
          const vNum = i + 1;
          return {
            vNum,
            text: String(t).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim(),
            easyText: easyBibleDb?.[`${bookKo}-${chap}-${vNum}`] || '',
            webText: webBibleDb?.[`${bookKo}-${chap}-${vNum}`] || webBibleDb?.[`${enBook}-${chap}-${vNum}`] || ''
          };
        })
      });
      return;
    }

    try {
      localStorage.setItem('bible_jump_target', targetChapId);
      localStorage.setItem('bible_jump_verse', String(validV));
    } catch (_) {}

    setCurrentChapId(targetChapId);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    if (typeof setTargetVerse === 'function') setTargetVerse(validV);
    if (typeof setActiveScreen === 'function') setActiveScreen('bible');
  };

  const handleOpenInlineReader = (bookKo, chap = 1, verseNum = 1, e) => {
    if (e) e.stopPropagation();
    const enBook = KO_TO_EN_BOOK[bookKo] || 'Genesis';
    const validV = clampValidVerse(bookKo, chap, verseNum);
    const bObj = BIBLE_BOOK_LOOKUP[enBook] || BIBLE_BOOK_LOOKUP[bookKo];
    const chapArr = bObj?.chapters?.[Math.max(0, chap - 1)] || [];
    setReaderModalData({
      mode: 'single',
      bookKo,
      enBook,
      chap,
      targetVerse: validV,
      verses: chapArr.map((t, i) => {
        const vNum = i + 1;
        return {
          vNum,
          text: String(t).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim(),
          easyText: easyBibleDb?.[`${bookKo}-${chap}-${vNum}`] || '',
          webText: webBibleDb?.[`${bookKo}-${chap}-${vNum}`] || webBibleDb?.[`${enBook}-${chap}-${vNum}`] || ''
        };
      })
    });
  };

  const handleOpenParallelComparisonReader = (arcItem, e) => {
    if (e) e.stopPropagation();
    if (!arcItem) return;

    const buildChapVerses = (bKo, ch, vs) => {
      const enBk = KO_TO_EN_BOOK[bKo] || 'Genesis';
      const validV = clampValidVerse(bKo, ch, vs);
      const bObj = BIBLE_BOOK_LOOKUP[enBk] || BIBLE_BOOK_LOOKUP[bKo];
      const chapArr = bObj?.chapters?.[Math.max(0, ch - 1)] || [];
      const verses = chapArr.map((t, i) => {
        const vNum = i + 1;
        return {
          vNum,
          text: String(t).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim(),
          easyText: easyBibleDb?.[`${bKo}-${ch}-${vNum}`] || '',
          webText: webBibleDb?.[`${bKo}-${ch}-${vNum}`] || webBibleDb?.[`${enBk}-${ch}-${vNum}`] || ''
        };
      });
      const targetObj = verses.find(v => v.vNum === validV);
      return {
        bookKo: bKo,
        enBook: enBk,
        chap: ch,
        targetVerse: validV,
        targetText: targetObj?.text || '',
        targetEasy: targetObj?.easyText || '',
        targetWeb: targetObj?.webText || '',
        verses
      };
    };

    setReaderModalData({
      mode: 'parallel',
      arcTitle: arcItem.title,
      badgeLabel: arcItem.badgeLabel,
      desc: arcItem.desc,
      left: buildChapVerses(arcItem.fromBook, arcItem.fromChap, arcItem.fromVerse),
      right: buildChapVerses(arcItem.toBook, arcItem.toChap, arcItem.toVerse)
    });
  };

  const handleJumpToInterlinear = (bookKo = '창세기', chap = 1, verse = 1) => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: bookKo,
        chapter: Number(chap) || 1,
        verse: clampValidVerse(bookKo, chap, verse)
      }));
    } catch (_) {}
    if (onClosePopup) onClosePopup();
    if (typeof setActiveScreen === 'function') setActiveScreen('interlinear');
  };

  const handleSaveNewKnowledgeNode = () => {
    if (createType === 'customArc') {
      const start = getGlobalChapIndex(createBook, createChap);
      const end = getGlobalChapIndex(createToBook, createToChap);
      if (start < 0 || end < 0 || start === end) return alert('서로 다른 두 성경 장을 선택해 주세요.');

      const fBook = start < end ? createBook : createToBook;
      const fChap = Number(start < end ? createChap : createToChap) || 1;
      const fVerse = clampValidVerse(fBook, fChap, start < end ? createVerse : createToVerse);
      const tBook = start < end ? createToBook : createBook;
      const tChap = Number(start < end ? createToChap : createChap) || 1;
      const tVerse = clampValidVerse(tBook, tChap, start < end ? createToVerse : createVerse);

      const newArc = {
        id: `user_arc_${Date.now()}`,
        start: Math.min(start, end),
        end: Math.max(start, end),
        span: Math.abs(end - start),
        category: 'user_sync',
        badgeLabel: '🔥 나의 교차참조',
        fromBook: fBook,
        fromChap: fChap,
        fromVerse: fVerse,
        toBook: tBook,
        toChap: tChap,
        toVerse: tVerse,
        title: createTitle.trim() || `${fBook} ${fChap}:${fVerse} ➔ ${tBook} ${tChap}:${tVerse} 연결`,
        desc: createBody.trim() || '직접 말씀을 묵상하며 연결한 구속사 교차참조 아크입니다.',
        isLandmark: true
      };

      const updated = [newArc, ...customUserArcs];
      setCustomUserArcs(updated);
      localStorage.setItem('goodtree_custom_arcs', JSON.stringify(updated));
      arcBgBufferRef.current = null;
      setSelectedArc(newArc);
      setIsCreatorOpen(false);
      showToast('🌈 나만의 교차참조 황금 아크가 성경 돔에 실시간 반영되었습니다!');
      return;
    }

    if (!createTitle.trim() && !createBody.trim()) {
      return alert('제목이나 묵상 내용을 입력해주세요.');
    }

    const todayKey = new Date().toISOString().split('T')[0];
    const validV = clampValidVerse(createBook, createChap, createVerse);
    const refStr = `${createBook} ${createChap}:${validV}`;
    const finalTitle = createTitle.trim() || `${refStr} 묵상`;
    const finalBody = createBody.trim();

    if (createType === 'qt' && updateDay) {
      const cur = dailyData[todayKey] || {};
      updateDay(todayKey, {
        ...cur,
        qtTitle: finalTitle,
        qtReference: refStr,
        qtMeditation: finalBody,
        qtApplication: createApply.trim(),
        checks: { ...(cur.checks || {}), QTin: true }
      });
    } else if (createType === 'sermon' && updateDay) {
      const cur = dailyData[todayKey] || {};
      updateDay(todayKey, {
        ...cur,
        sermonTitle: finalTitle,
        sermonReference: refStr,
        sermonNotes: finalBody
      });
    } else if (createType === 'bibleNote' && setBibleNotes) {
      const newBibleNote = {
        id: Date.now(),
        date: todayKey,
        verses: [{ ref: refStr, text: finalTitle }],
        note: finalBody
      };
      setBibleNotes([newBibleNote, ...(Array.isArray(bibleNotes) ? bibleNotes : [])]);
    }

    const newGalaxyNode = {
      id: `custom_star_${Date.now()}`,
      label: finalTitle,
      type: createType === 'sermon' ? 'sermon' : 'qt',
      bookName: createBook,
      chapter: Number(createChap) || 1,
      verse: validV,
      ref: refStr,
      date: todayKey,
      summary: finalBody,
      application: createApply.trim(),
      color: createType === 'qt' ? '#F43F5E' : createType === 'sermon' ? '#10B981' : '#00E5FF'
    };

    const nextCustom = [newGalaxyNode, ...customGalaxyNodes];
    setCustomGalaxyNodes(nextCustom);
    localStorage.setItem('goodtree_custom_galaxy_nodes', JSON.stringify(nextCustom));

    setCreateTitle('');
    setCreateBody('');
    setCreateApply('');
    setIsCreatorOpen(false);
    triggerRealtimeSync(false);
    showToast(`✨ [${finalTitle}] 노드가 은하계와 노트에 실시간 반영되었습니다!`);
  };

  const selectedScriptureVerses = useMemo(() => {
    if (!selectedNode?.bookName) return null;
    return getScripturePreview(
      selectedNode.bookName,
      previewChap || selectedNode.chapter || 1,
      selectedNode.verse || 1,
      3,
      easyBibleDb,
      webBibleDb
    );
  }, [selectedNode, previewChap, easyBibleDb, webBibleDb]);

  const currentDisplayArc = selectedArc || activeFilteredArcs[0] || allFullArcs[0];

  const spotlightFromVerses = useMemo(() => {
    if (!currentDisplayArc) return null;
    return getScripturePreview(
      currentDisplayArc.fromBook,
      currentDisplayArc.fromChap,
      currentDisplayArc.fromVerse,
      1,
      easyBibleDb,
      webBibleDb
    );
  }, [currentDisplayArc, easyBibleDb, webBibleDb]);

  const spotlightToVerses = useMemo(() => {
    if (!currentDisplayArc) return null;
    return getScripturePreview(
      currentDisplayArc.toBook,
      currentDisplayArc.toChap,
      currentDisplayArc.toVerse,
      1,
      easyBibleDb,
      webBibleDb
    );
  }, [currentDisplayArc, easyBibleDb, webBibleDb]);

  const fromInterlinearWords = currentDisplayArc
    ? liveInterlinearMap[`${currentDisplayArc.fromBook}-${currentDisplayArc.fromChap}-${currentDisplayArc.fromVerse}`]
    : null;
  const toInterlinearWords = currentDisplayArc
    ? liveInterlinearMap[`${currentDisplayArc.toBook}-${currentDisplayArc.toChap}-${currentDisplayArc.toVerse}`]
    : null;

  // =====================================================================
  // 🧩 우측/모바일 드로어 인스펙터 상세 내용 렌더러 (4대 역본 & 원어 통합)
  // =====================================================================
  const renderInspectorContent = () => {
    if (viewMode !== 'arc' && !selectedNode) {
      return (
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-cyan-400 uppercase">
                🌌 TRACKTOR GALAXY DIRECTORY
              </span>
              <span className="text-[10px] font-mono text-emerald-400">🔄 동기화: {lastSyncedTime}</span>
            </div>
            <h3 className="text-sm font-black text-white">성경 66권 · 강해 · QT · 원어 통합 디렉토리</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              상단 분리 탭으로 원하는 카테고리를 필터링하거나 아래 노드를 터치하면 은하계 카메라가 즉시 줌인합니다.
            </p>
          </div>

          <div className="space-y-1.5 max-h-[58vh] overflow-y-auto pr-1 hide-scrollbar">
            {filteredListNodes.slice(0, 120).map(node => (
              <button
                key={node.id}
                onClick={() => {
                  focusCameraOnNode(node);
                  setIsMobileFilterSheetOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-black/45 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                  <div className="min-w-0">
                    <div className="font-black text-white text-xs truncate">{node.label}</div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {node.ref ? `${node.ref} • ` : ''}{node.summary || node.desc}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 shrink-0">포커스 ▶</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (!selectedNode) {
      return (
        <div className="space-y-3.5 text-xs">
          <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-black text-amber-400 uppercase">
                🧭 66권 & 장별 핀셋 필터 ({activeFilteredArcs.length.toLocaleString()}개 정밀 아크)
              </span>
              {(arcFromBookFilter !== 'ALL' || arcFromChapFilter !== 'ALL' || arcToBookFilter !== 'ALL' || scrubbedBookKo) && (
                <button
                  onClick={() => {
                    setArcFromBookFilter('ALL');
                    setArcFromChapFilter('ALL');
                    setArcToBookFilter('ALL');
                    setScrubbedBookKo(null);
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                >
                  필터 초기화 ↺
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">출발 성경 A</label>
                <select
                  value={arcFromBookFilter}
                  onChange={(e) => {
                    setArcFromBookFilter(e.target.value);
                    setArcFromChapFilter('ALL');
                    setScrubbedBookKo(null);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white font-bold text-[11px] outline-none"
                >
                  <option value="ALL">전체 66권</option>
                  {BIBLE_66_CANON.map(b => <option key={b.ko} value={b.ko}>{b.ko}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-amber-400 font-bold block mb-0.5">
                  장(Chapter) 분리
                </label>
                <select
                  value={arcFromChapFilter}
                  disabled={arcFromBookFilter === 'ALL'}
                  onChange={(e) => setArcFromChapFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-amber-400/40 text-amber-300 font-bold text-[11px] outline-none disabled:opacity-40"
                >
                  <option value="ALL">전체 장</option>
                  {arcFromBookFilter !== 'ALL' &&
                    Array.from({ length: BOOK_OFFSET_MAP[arcFromBookFilter]?.chaps || 1 }, (_, i) => i + 1).map(chNum => (
                      <option key={chNum} value={chNum}>{chNum}장</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">대조 성경 B</label>
                <select
                  value={arcToBookFilter}
                  onChange={(e) => { setArcToBookFilter(e.target.value); setScrubbedBookKo(null); }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white font-bold text-[11px] outline-none"
                >
                  <option value="ALL">전체 66권</option>
                  {BIBLE_66_CANON.map(b => <option key={b.ko} value={b.ko}>{b.ko}</option>)}
                </select>
              </div>
            </div>

            <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between pt-0.5">
              <span>🌐 OpenBible.info 원본 {openBibleTotalRawCount.toLocaleString()}건 샤딩 연동</span>
              {isShardLoading && <span className="text-amber-300 animate-pulse">⚡ 장별 데이터 로드중...</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-amber-300">
                ✨ 정경 교차참조 검증 목록 ({activeFilteredArcs.length.toLocaleString()}건)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">✓ 문맥·절 100% 일치</span>
            </div>

            <div className="space-y-1.5 max-h-[45vh] lg:max-h-[52vh] overflow-y-auto pr-1 hide-scrollbar">
              {activeFilteredArcs.slice(0, 120).map((arc) => {
                const isCurr = currentDisplayArc?.id === arc.id;
                const catStyle = CATEGORY_META[arc.category] || CATEGORY_META.theme;
                return (
                  <button
                    key={arc.id}
                    onClick={() => {
                      setIsAutoTourPlaying(false);
                      setSelectedArc(arc);
                      setIsMobileFilterSheetOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      isCurr
                        ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-black/40 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${catStyle.badgeBg}`}>
                        {arc.badgeLabel}
                      </span>
                      <span className="text-[10.5px] font-mono font-bold text-amber-300">
                        {arc.fromBook} {arc.fromChap}:{arc.fromVerse} ➔ {arc.toBook} {arc.toChap}:{arc.toVerse}
                      </span>
                    </div>
                    <div className="font-black text-white text-xs truncate">{arc.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-start border-b pb-2.5" style={{ borderColor: theme.panelBorder }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/40" style={{ backgroundColor: selectedNode.color }} />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                {selectedNode.type === 'book' ? `BIBLE • ${selectedNode.sector}` :
                 selectedNode.type === 'sermon' ? `EXEGESIS • ${selectedNode.ref}` :
                 selectedNode.type === 'qt' ? `MY QT / NOTE • ${selectedNode.date || ''}` :
                 selectedNode.type === 'original_word' ? `${selectedNode.lang} • ${selectedNode.strongs}` :
                 `SECTOR • ${selectedNode.label}`}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedNode.label}</h3>
            </div>
          </div>
          <button onClick={() => { setSelectedNode(null); setScrubbedBookKo(null); }} className="text-xs text-slate-400 hover:text-white cursor-pointer p-1">✕ 목록으로</button>
        </div>

        {selectedNode.type === 'book' && (
          <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-cyan-300">
                📖 {selectedNode.bookName} 장(Chapter) 선택
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                통독 {selectedNode.readChaps}/{selectedNode.totalChaps}장
              </span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-28 overflow-y-auto pr-1 hide-scrollbar">
              {Array.from({ length: selectedNode.totalChaps || 1 }, (_, i) => i + 1).map(cNum => {
                const isRead = selectedNode.readChapMap?.[cNum];
                const isSelectedChap = previewChap === cNum;
                return (
                  <button
                    key={cNum}
                    onClick={() => setPreviewChap(cNum)}
                    onDoubleClick={() => handleJumpToBibleChapter(selectedNode.bookName, cNum, 1)}
                    className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      isSelectedChap
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black scale-105'
                        : isRead
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    {cNum}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={(e) => handleOpenInlineReader(selectedNode.bookName, previewChap, 1, e)}
                className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                📖 여기서 {previewChap}장 읽기
              </button>
              <button
                onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap, 1)}
                className="py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                🚀 {isModalPopup ? `${previewChap}장 전문 보기` : '통독365로 열기'}
              </button>
            </div>
          </div>
        )}

        {/* 4대 역본(개역개정 / 쉬운성경 / 영어 WEB) 본문 미리보기 */}
        {selectedScriptureVerses && selectedScriptureVerses.length > 0 && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-amber-400">
                📖 {selectedNode.bookName} {previewChap}장 다중역본 미리보기
              </span>
              <button
                onClick={(e) => handleOpenInlineReader(selectedNode.bookName, previewChap, selectedNode.verse || 1, e)}
                className="text-[10px] font-black text-cyan-400 hover:underline cursor-pointer"
              >
                장 전체 대조 ↗
              </button>
            </div>
            {selectedScriptureVerses.map(v => (
              <div key={v.vNum} className="space-y-1 pt-1 first:pt-0 border-t first:border-t-0 border-white/5">
                {(versionMode === 'krv' || versionMode === 'parallel') && (
                  <p className="text-xs font-serif leading-relaxed text-slate-100 break-keep select-text">
                    <b className="text-amber-400 mr-1.5 font-mono">{v.vNum}</b>
                    {v.text}
                  </p>
                )}
                {(versionMode === 'easy' || versionMode === 'parallel') && v.easyText && (
                  <p className="text-[11px] leading-relaxed text-emerald-300 break-keep select-text">
                    <span className="text-[9.5px] font-black px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 mr-1">쉬운</span>
                    {v.easyText}
                  </p>
                )}
                {(versionMode === 'web' || versionMode === 'parallel') && v.webText && (
                  <p className="text-[11px] font-serif leading-relaxed text-sky-300 break-keep select-text">
                    <span className="text-[9.5px] font-black px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 mr-1">WEB</span>
                    {v.webText}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {(selectedNode.summary || selectedNode.desc) && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-cyan-300 uppercase block">묵상 / 강해 요약 내용</span>
            <p className="leading-relaxed break-keep select-text text-slate-100">
              {selectedNode.summary || selectedNode.desc}
            </p>
            {selectedNode.application && (
              <p className="text-emerald-300 font-bold pt-1 border-t border-white/10">
                🎯 나의 적용: {selectedNode.application}
              </p>
            )}
          </div>
        )}

        {relatedOriginalRoots.length > 0 && (
          <div className="p-3 rounded-xl bg-pink-950/25 border border-pink-500/30 space-y-1.5">
            <span className="text-[10px] font-mono font-black text-pink-400 uppercase block">
              🏛️ 연결된 히브리어 · 헬라어 원어 핵심 해설
            </span>
            {relatedOriginalRoots.slice(0, 2).map(root => (
              <div key={root.id} className="space-y-0.5 pt-1 first:pt-0 border-t first:border-t-0 border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">
                    <span className="text-sm mr-1.5" style={{ color: root.color }}>{root.original}</span>
                    [{root.pron}] — {root.label}
                  </span>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">
                    {root.strongs}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{root.meaning}</p>
              </div>
            ))}
          </div>
        )}

        {connectedNeighbors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-cyan-300 block">
              📋 연결된 성경·강해·QT·원어 ({connectedNeighbors.length}건)
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 hide-scrollbar">
              {connectedNeighbors.map(nb => (
                <button
                  key={nb.id}
                  onClick={() => focusCameraOnNode(nb)}
                  className="w-full p-2 rounded-xl bg-black/45 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: nb.color }} />
                    <span className="text-xs font-bold text-white truncate">{nb.label}</span>
                    {nb.ref && <span className="text-[10px] font-mono text-cyan-400 shrink-0">({nb.ref})</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">선택 ▶</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {selectedNode.bookName && (
            <button
              onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap || selectedNode.chapter || 1, selectedNode.verse || 1)}
              className="py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              📖 {selectedNode.bookName} {previewChap}장 열기
            </button>
          )}

          {(selectedNode.bookName || selectedNode.type === 'original_word') && (
            <button
              onClick={() => handleJumpToInterlinear(selectedNode.bookName || selectedNode.books?.[0] || '창세기', previewChap || selectedNode.chapter || 1, selectedNode.verse || 1)}
              className="py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              🔬 원어 연구실 직행
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-full h-full relative overflow-hidden select-none font-sans flex flex-col" style={{ backgroundColor: theme.bg }}>
      <style>{`
        button, a, select, input {
          -webkit-tap-highlight-color: transparent !important;
          outline: none !important;
        }
      `}</style>
      
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[1200] px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-bold border border-cyan-400/40 shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🛰️ 상단 TRACKTOR Segundo Cérebro 텔레메트리 헤더 */}
      {/* ===================================================================== */}
      <div className="relative z-30 px-2.5 sm:px-4 pt-2 pb-1.5 flex flex-col gap-1.5 border-b backdrop-blur-md shrink-0" style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-[165px]">
            <button
              onClick={() => {
                if (isModalPopup && onClosePopup) onClosePopup();
                else if (typeof setActiveScreen === 'function') setActiveScreen('home');
              }}
              className={`h-8 sm:h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                isModalPopup ? 'bg-rose-500/20 border-rose-400/50 text-rose-200 hover:bg-rose-500/30' : ''
              }`}
              style={!isModalPopup ? { borderColor: theme.panelBorder, color: theme.textMain } : undefined}
            >
              {isModalPopup ? '✕ 팝업 닫기' : <>◀ <span className="hidden md:inline">홈</span></>}
            </button>

            <div className="hidden xl:flex flex-col px-2 border-r border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-black tracking-wider text-white">BIBLE GALAXY OS</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                {orbitCounts.all} NODES · {allFullArcs.length.toLocaleString()} ARCS
              </span>
            </div>

            <div 
              className="flex-1 max-w-xs h-8 sm:h-9 px-2.5 rounded-xl border flex items-center gap-1.5 bg-black/45"
              style={{ borderColor: theme.panelBorder }}
            >
              <span className="text-xs opacity-60">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="성경, 강해, QT, 원어 검색 (/)..."
                className="w-full bg-transparent outline-none text-[11.5px] sm:text-xs font-medium text-white placeholder:text-slate-400 select-text"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">✕</button>
              )}
            </div>
          </div>

          {/* 우측: 6대 뷰 모드 스위처 + 역본 스위처 + 컨트롤 */}
          <div className="flex items-center gap-1 sm:gap-1.5 justify-end ml-auto overflow-x-auto hide-scrollbar">
            {/* 4대 역본 선택기 (개역개정 / 쉬운 / 영어WEB / 동시대조) */}
            <div className="hidden md:flex p-0.5 rounded-xl border bg-black/50 shrink-0" style={{ borderColor: theme.panelBorder }}>
              {[
                { id: 'krv', label: '개역' },
                { id: 'easy', label: '쉬운' },
                { id: 'web', label: 'WEB' },
                { id: 'parallel', label: '한·영대조' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setVersionMode(v.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap ${
                    versionMode === v.id ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* TRACKTOR 6대 레이아웃 토폴로지 스위처 */}
            <div className="flex p-0.5 rounded-xl border bg-black/50 shrink-0" style={{ borderColor: theme.panelBorder }}>
              <button
                onClick={() => setViewMode('arc')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'arc' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                🌈 아크
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === '2d' ? 'bg-cyan-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                ⭕ 링궤도
              </button>
              <button
                onClick={() => setViewMode('hex')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'hex' ? 'bg-teal-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                ⬢ 헥사곤
              </button>
              <button
                onClick={() => setViewMode('hud')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'hud' ? 'bg-sky-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                🎯 HUD
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === '3d' ? 'bg-purple-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                🪐 3D
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'list' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                📋 나열
              </button>
            </div>

            <button
              onClick={() => triggerRealtimeSync(true)}
              className="h-8 sm:h-9 px-2 rounded-xl text-[10.5px] font-bold border text-emerald-300 bg-emerald-500/10 border-emerald-500/30 shrink-0 cursor-pointer flex items-center gap-1"
              title={`실시간 동기화 완료 (${lastSyncedTime})`}
            >
              <span>🔄</span>
              <span className="hidden sm:inline">동기화</span>
            </button>

            <button
              onClick={() => setIsMobileFilterSheetOpen(true)}
              className="lg:hidden h-8 sm:h-9 px-2.5 rounded-xl text-[10.5px] font-black border text-amber-300 bg-amber-500/15 border-amber-400/40 shrink-0 cursor-pointer"
            >
              🧭 목록
            </button>

            <button
              onClick={() => {
                setCreateType('customArc');
                setIsCreatorOpen(true);
              }}
              className="h-8 sm:h-9 px-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="나만의 교차참조 아크 또는 묵상 별 추가"
            >
              <span>➕</span>
            </button>

            {viewMode !== 'list' && (
              <button
                onClick={() => setIsControlOpen(!isControlOpen)}
                className={`h-8 sm:h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isControlOpen ? 'ring-2 ring-cyan-400 bg-cyan-500/20 text-white' : ''
                }`}
                style={{ borderColor: theme.panelBorder, color: theme.textMain }}
                title="TRACKTOR 스튜디오 테마 및 궤도 설정"
              >
                ⚙️ <span className="hidden xl:inline text-[11px]">스튜디오</span>
              </button>
            )}
          </div>
        </div>

        {/* 2열 서브 필터 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          {viewMode === 'arc' ? (
            <>
              {[
                { id: 'all', label: `전체 아크 (${allFullArcs.length.toLocaleString()})`, cls: 'bg-white text-slate-950' },
                { id: 'quote', label: '📜 직접 인용', cls: 'bg-[#EAB308] text-slate-950' },
                { id: 'prophecy', label: '✨ 예언 · 성취', cls: 'bg-pink-400 text-slate-950' },
                { id: 'typology', label: '🕯️ 모형 · 그림자', cls: 'bg-sky-400 text-slate-950' },
                { id: 'theme', label: '🌿 인물 · 주제', cls: 'bg-teal-300 text-slate-950' },
                { id: 'user_sync', label: '🔥 나의 묵상·강해 연결', cls: 'bg-rose-400 text-slate-950' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setArcCategoryFilter(cat.id);
                    setScrubbedBookKo(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    arcCategoryFilter === cat.id
                      ? `${cat.cls} shadow-sm scale-102`
                      : 'bg-black/35 text-slate-300 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {arcFromBookFilter !== 'ALL' && (
                <button
                  onClick={() => {
                    setArcFromBookFilter('ALL');
                    setArcFromChapFilter('ALL');
                    setScrubbedBookKo(null);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/50 cursor-pointer shrink-0"
                >
                  📍 {arcFromBookFilter} 필터 해제 ✕
                </button>
              )}
              <button
                onClick={() => setIsAutoTourPlaying(!isAutoTourPlaying)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer border shrink-0 whitespace-nowrap ml-auto ${
                  isAutoTourPlaying
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                    : 'bg-black/40 text-amber-300 border-amber-400/40'
                }`}
              >
                {isAutoTourPlaying ? '⏸ 순례 정지' : '▶️ 자동 순례'}
              </button>
            </>
          ) : (
            <>
              {[
                { id: 'all', label: `전체 (${orbitCounts.all})` },
                { id: 'book', label: `📖 성경 66권 (${orbitCounts.book})` },
                { id: 'sermon', label: `🎙️ 강해 아카이브 (${orbitCounts.sermon})` },
                { id: 'qt', label: `🔥 나의 QT·말씀노트 (${orbitCounts.qt})` },
                { id: 'original_word', label: `🏛️ 히브리·헬라 원어 (${orbitCounts.original_word})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setOrbitFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    orbitFilter === tab.id
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-xs'
                      : 'text-slate-300 bg-black/35 border-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => applyResponsiveCameraReset(viewMode)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold border text-amber-300 bg-black/35 border-amber-500/30 whitespace-nowrap shrink-0 cursor-pointer ml-auto"
              >
                🎯 화면 맞춤
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🌌 메인 바디: HUD 좌측 사이드바 + 중앙 인터랙티브 캔버스 + 우측 인스펙터 */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 🎯 TRACKTOR Comando (IMG_3827) 전용 좌측 성경 66권 텔레메트리 패널 */}
        {viewMode === 'hud' && (
          <aside
            className="hidden md:flex w-[250px] xl:w-[275px] h-full border-r flex-col justify-between p-3 shrink-0 z-20 text-left select-none"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-mono font-black text-white uppercase tracking-wider">CANON CARTEIRA</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">66 BOOKS</span>
            </div>

            <div className="flex-1 overflow-y-auto my-2 space-y-1 pr-1 hide-scrollbar">
              {galaxyData.nodes.filter(n => n.type === 'book').map((bNode) => {
                const isSel = selectedNode?.id === bNode.id;
                return (
                  <button
                    key={bNode.id}
                    onClick={() => focusCameraOnNode(bNode)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-black/35 border-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bNode.color }} />
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-bold truncate">{bNode.bookName}</div>
                        <div className="text-[9.5px] font-mono text-slate-400">{bNode.sector}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10.5px] font-mono font-black text-cyan-300 block">{bNode.totalChaps}장</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-emerald-300">
                        완독 {bNode.readChaps}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 좌측 하단 TRACKTOR AGORA 실시간 디지털 시계 위젯 */}
            <div className="pt-2.5 border-t border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                <span>⊙ AGORA TELEMETRY</span>
                <span>KST SEOUL</span>
              </div>
              <div className="text-2xl font-mono font-black tracking-widest" style={{ color: theme.accent }}>
                {liveClock}
              </div>
              <div className="flex justify-between text-[9.5px] font-mono text-slate-500 pt-0.5">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>
            </div>
          </aside>
        )}

        {/* 중앙 인터랙티브 캔버스 컨테이너 */}
        <div ref={containerRef} className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
          {viewMode !== 'list' ? (
            <>
              <canvas
                ref={canvasRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-crosshair active:cursor-grabbing touch-none"
              />

              {/* HUD 모드 상단 타이틀 오버레이 */}
              {viewMode === 'hud' && (
                <div className="relative z-20 pt-3 px-4 flex flex-col items-center text-center pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-sm sm:text-base font-mono font-black tracking-widest text-white">
                      BIBLE GALAXY COMANDO
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 tracking-widest">
                     CANONICAL NEURAL NETWORK · {allFullArcs.length.toLocaleString()} CROSS-REFS
                  </span>
                </div>
              )}

              {viewMode === 'arc' && (
                <>
                  <div className="relative z-20 pt-2 sm:pt-3 px-3 flex flex-col items-center text-center pointer-events-none">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#EAB308] opacity-90">
                      CANONICAL CROSS-REFERENCE ARCHIVE • 구약과 신약의 정경적 조응
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-[#FACC15] tracking-tight mt-0.5 drop-shadow-md">
                      성경 66권 구속사 교차 참조 ({activeFilteredArcs.length.toLocaleString()}개 검증 아크)
                    </h2>
                  </div>

                  {/* 하단 SaaS 다크 글래스모피즘 구약 ⇄ 신약 1:1 스포트라이트 독(Dock) */}
                  {currentDisplayArc && (
                    <div className="mt-auto relative z-20 pb-2 sm:pb-3 px-2 sm:px-3 flex flex-col items-center w-full max-w-3xl mx-auto pointer-events-auto">
                      <div className="w-full rounded-2xl bg-slate-950/92 backdrop-blur-2xl text-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_16px_40px_rgba(0,0,0,0.75)] border border-amber-400/40 space-y-2">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
                            {currentDisplayArc.badgeLabel}
                          </span>
                          <span className="text-[11.5px] sm:text-xs font-black text-amber-200 truncate">
                            {currentDisplayArc.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setIsAutoTourPlaying(false);
                                const idx = activeFilteredArcs.findIndex(a => a.id === currentDisplayArc.id);
                                const prevIdx = (idx - 1 + activeFilteredArcs.length) % activeFilteredArcs.length;
                                setSelectedArc(activeFilteredArcs[prevIdx]);
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-black cursor-pointer"
                            >
                              ◀
                            </button>
                            <button
                              onClick={() => {
                                setIsAutoTourPlaying(false);
                                const idx = activeFilteredArcs.findIndex(a => a.id === currentDisplayArc.id);
                                const nextIdx = (idx + 1) % activeFilteredArcs.length;
                                setSelectedArc(activeFilteredArcs[nextIdx]);
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-black cursor-pointer"
                            >
                              다음 ▶
                            </button>
                          </div>
                        </div>

                        {/* 구약(좌) vs 신약(우) 1:1 나란히 대조 카드 (개역 + 쉬운 + WEB + 원어 칩 통합) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs">
                          <div 
                            onClick={(e) => handleOpenParallelComparisonReader(currentDisplayArc, e)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-400/35 cursor-pointer transition-all min-w-0 group space-y-1"
                          >
                            <div className="flex justify-between items-center font-black text-amber-300 text-[10.5px]">
                              <span className="truncate">📜 {currentDisplayArc.fromBook} {currentDisplayArc.fromChap}:{currentDisplayArc.fromVerse}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJumpToBibleChapter(currentDisplayArc.fromBook, currentDisplayArc.fromChap, currentDisplayArc.fromVerse);
                                }}
                                className="px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/35 text-amber-200 text-[9px] font-black shrink-0"
                              >
                                본문열기➔
                              </button>
                            </div>
                            <p className="text-[11px] font-serif text-slate-100 leading-snug break-keep max-h-14 overflow-y-auto hide-scrollbar">
                              {spotlightFromVerses?.[0]?.text || currentDisplayArc.desc}
                            </p>
                            {(versionMode === 'easy' || versionMode === 'parallel') && spotlightFromVerses?.[0]?.easyText && (
                              <p className="text-[10px] text-emerald-300 leading-snug line-clamp-1">
                                [쉬운] {spotlightFromVerses[0].easyText}
                              </p>
                            )}
                            {(versionMode === 'web' || versionMode === 'parallel') && spotlightFromVerses?.[0]?.webText && (
                              <p className="text-[10px] font-serif text-sky-300 leading-snug line-clamp-1">
                                [WEB] {spotlightFromVerses[0].webText}
                              </p>
                            )}
                            {fromInterlinearWords && fromInterlinearWords.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {fromInterlinearWords.slice(0, 4).map((w, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-black/50 border border-amber-500/30 text-[9.5px] text-amber-200">
                                    <b>{w.original_word}</b> {w.korean_trans}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div 
                            onClick={(e) => handleOpenParallelComparisonReader(currentDisplayArc, e)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-400/35 cursor-pointer transition-all min-w-0 group space-y-1"
                          >
                            <div className="flex justify-between items-center font-black text-cyan-300 text-[10.5px]">
                              <span className="truncate">✝️ {currentDisplayArc.toBook} {currentDisplayArc.toChap}:{currentDisplayArc.toVerse}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJumpToBibleChapter(currentDisplayArc.toBook, currentDisplayArc.toChap, currentDisplayArc.toVerse);
                                }}
                                className="px-1.5 py-0.5 rounded bg-cyan-400/20 hover:bg-cyan-400/35 text-cyan-200 text-[9px] font-black shrink-0"
                              >
                                본문열기➔
                              </button>
                            </div>
                            <p className="text-[11px] font-serif text-slate-100 leading-snug break-keep max-h-14 overflow-y-auto hide-scrollbar">
                              {spotlightToVerses?.[0]?.text || currentDisplayArc.desc}
                            </p>
                            {(versionMode === 'easy' || versionMode === 'parallel') && spotlightToVerses?.[0]?.easyText && (
                              <p className="text-[10px] text-emerald-300 leading-snug line-clamp-1">
                                [쉬운] {spotlightToVerses[0].easyText}
                              </p>
                            )}
                            {(versionMode === 'web' || versionMode === 'parallel') && spotlightToVerses?.[0]?.webText && (
                              <p className="text-[10px] font-serif text-sky-300 leading-snug line-clamp-1">
                                [WEB] {spotlightToVerses[0].webText}
                              </p>
                            )}
                            {toInterlinearWords && toInterlinearWords.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {toInterlinearWords.slice(0, 4).map((w, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-black/50 border border-cyan-500/30 text-[9.5px] text-cyan-200">
                                    <b>{w.original_word}</b> {w.korean_trans}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] sm:text-[10.5px] font-bold text-slate-300">
                          <span className="truncate">💡 {currentDisplayArc.desc}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {onInsertInsight && (
                              <button
                                type="button"
                                onClick={() => {
                                  const fTxt = spotlightFromVerses?.[0]?.text || '';
                                  const tTxt = spotlightToVerses?.[0]?.text || '';
                                  const formatted = `\n[🌈 신구약 구속사 대조: ${currentDisplayArc.fromBook} ${currentDisplayArc.fromChap}:${currentDisplayArc.fromVerse} ➔ ${currentDisplayArc.toBook} ${currentDisplayArc.toChap}:${currentDisplayArc.toVerse}]\n• 구약: "${fTxt}"\n• 신약: "${tTxt}"\n• 구속사적 의미: ${currentDisplayArc.desc}\n`;
                                  onInsertInsight(formatted);
                                  showToast('✍️ 현재 묵상·설교 노트에 신구약 대조 강해가 삽입되었습니다!');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[10px] font-black cursor-pointer shadow-xs"
                              >
                                ✍️ 노트에 대조 삽입
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleOpenParallelComparisonReader(currentDisplayArc, e)}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black cursor-pointer shadow-xs"
                            >
                              ⚖️ 4대역본 나란히 대조
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJumpToInterlinear(currentDisplayArc.fromBook, currentDisplayArc.fromChap, currentDisplayArc.fromVerse)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black cursor-pointer"
                            >
                              🔬 원어
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            {/* ⬆️ (위쪽 코드: ⚖️ 4대역본 나란히 대조 / 🔬 원어 버튼 닫는 부분) ⬆️ */}
            </>
          ) : (
            /* ===================================================================== */
            /* 📋 리스트(나열) 뷰: 섹터별 성경 66권 · 강해 · QT · 원어 디렉토리       */
            /* ===================================================================== */
            <div className="w-full h-full overflow-y-auto px-3 py-3 pb-32 space-y-4 max-w-4xl mx-auto hide-scrollbar text-left">
              {CANON_SECTORS.map(sec => {
                const sectorItems = filteredListNodes.filter(n => n.sector === sec.name);
                if (sectorItems.length === 0) return null;
                const booksInSec = sectorItems.filter(n => n.type === 'book');
                const sermonsAndQts = sectorItems.filter(n => n.type === 'sermon' || n.type === 'qt');

                return (
                  <div 
                    key={sec.id} 
                    className="p-3.5 rounded-2xl border space-y-3 bg-slate-900/65 backdrop-blur-md"
                    style={{ borderColor: theme.panelBorder }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: sec.color }} />
                        <h3 className="text-sm font-black text-white">{sec.name}</h3>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        성경 {booksInSec.length}권 • 강해/QT {sermonsAndQts.length}건
                      </span>
                    </div>

                    {booksInSec.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {booksInSec.map(bNode => (
                          <button
                            key={bNode.id}
                            onClick={() => setSelectedNode(bNode)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selectedNode?.id === bNode.id
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md'
                                : 'bg-black/40 text-slate-200 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                            <span>{bNode.bookName}</span>
                            {bNode.readChaps > 0 && (
                              <span className="text-[9.5px] font-mono text-emerald-400">
                                ({bNode.readChaps}/{bNode.totalChaps})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {sermonsAndQts.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {sermonsAndQts.map(item => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedNode(item)}
                            className="p-2.5 rounded-xl bg-black/35 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 cursor-pointer transition-all"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{item.label}</div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                <span className="text-cyan-400 font-mono mr-1.5">{item.ref}</span>
                                {item.summary}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-cyan-400 shrink-0">열기 ▶</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 🖥️ PC / 태블릿 우측 고정 TRACKTOR Segundo Cérebro 인스펙터 사이드바    */}
        {/* ===================================================================== */}
        <aside 
          className="hidden lg:flex w-[390px] xl:w-[420px] h-full border-l p-4 flex-col overflow-y-auto hide-scrollbar shrink-0 z-20 text-left"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {renderInspectorContent()}
        </aside>
      </div>

      {/* ===================================================================== */}
      {/* ⚖️ 4대 역본(개역개정 · 쉬운성경 · WEB 영어) 구약 ⇄ 신약 나란히 대조 모달 */}
      {/* ===================================================================== */}
      {readerModalData && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div 
            className="w-full max-w-4xl rounded-3xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[88dvh] text-left overflow-hidden"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
          >
            {readerModalData.mode === 'parallel' ? (
              <>
                <div className="flex items-center justify-between border-b pb-3 mb-3 gap-2 shrink-0" style={{ borderColor: theme.panelBorder }}>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block">
                      MULTI-VERSION PARALLEL SCRIPTURE COMPARISON ({readerModalData.badgeLabel})
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white truncate">
                      ⚖️ {readerModalData.left.bookKo} {readerModalData.left.chap}:{readerModalData.left.targetVerse} ⇄ {readerModalData.right.bookKo} {readerModalData.right.chap}:{readerModalData.right.targetVerse} 나란히 대조
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleJumpToInterlinear(readerModalData.left.bookKo, readerModalData.left.chap, readerModalData.left.targetVerse)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer"
                    >
                      🔬 원어 연구실
                    </button>
                    <button
                      type="button"
                      onClick={() => setReaderModalData(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕ 닫기
                    </button>
                  </div>
                </div>

                {/* 핵심 구절 1:1 하이라이트 박스 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 shrink-0">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-400/50 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-300">
                        📜 {readerModalData.left.bookKo} {readerModalData.left.chap}:{readerModalData.left.targetVerse}
                      </span>
                      {!isModalPopup && (
                        <button
                          onClick={() => {
                            const { bookKo, chap, targetVerse } = readerModalData.left;
                            setReaderModalData(null);
                            handleJumpToBibleChapter(bookKo, chap, targetVerse);
                          }}
                          className="text-[9.5px] font-black text-cyan-300 underline cursor-pointer"
                        >
                          통독365 이동➔
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-serif text-white leading-relaxed break-keep">
                      {readerModalData.left.targetText}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-400/50 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-cyan-300">
                        ✝️ {readerModalData.right.bookKo} {readerModalData.right.chap}:{readerModalData.right.targetVerse}
                      </span>
                      {!isModalPopup && (
                        <button
                          onClick={() => {
                            const { bookKo, chap, targetVerse } = readerModalData.right;
                            setReaderModalData(null);
                            handleJumpToBibleChapter(bookKo, chap, targetVerse);
                          }}
                          className="text-[9.5px] font-black text-cyan-300 underline cursor-pointer"
                        >
                          통독365 이동➔
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-serif text-white leading-relaxed break-keep">
                      {readerModalData.right.targetText}
                    </p>
                  </div>
                </div>

                {/* 좌·우 전체 장(Chapter) 문맥 스크롤 대조 */}
                <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-hidden">
                  <div className="flex flex-col min-h-0 border rounded-2xl p-2.5 bg-black/30" style={{ borderColor: theme.panelBorder }}>
                    <div className="text-xs font-black text-amber-400 pb-2 mb-2 border-b border-white/10">
                      📜 {readerModalData.left.bookKo} {readerModalData.left.chap}장 전체 문맥
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                      {readerModalData.left.verses.map(v => {
                        const isTarget = v.vNum === readerModalData.left.targetVerse;
                        return (
                          <div
                            key={v.vNum}
                            ref={el => {
                              if (isTarget && el) {
                                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isTarget
                                ? 'bg-amber-500/25 border-amber-400 ring-1 ring-amber-400'
                                : 'bg-black/30 border-white/5'
                            }`}
                          >
                            <p className="text-[11.5px] sm:text-xs font-serif leading-relaxed text-slate-100 break-keep select-text">
                              <b className={`font-mono mr-1.5 ${isTarget ? 'text-amber-300' : 'text-slate-400'}`}>{v.vNum}</b>
                              {v.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col min-h-0 border rounded-2xl p-2.5 bg-black/30" style={{ borderColor: theme.panelBorder }}>
                    <div className="text-xs font-black text-cyan-400 pb-2 mb-2 border-b border-white/10">
                      ✝️ {readerModalData.right.bookKo} {readerModalData.right.chap}장 전체 문맥
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                      {readerModalData.right.verses.map(v => {
                        const isTarget = v.vNum === readerModalData.right.targetVerse;
                        return (
                          <div
                            key={v.vNum}
                            ref={el => {
                              if (isTarget && el) {
                                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isTarget
                                ? 'bg-cyan-500/25 border-cyan-400 ring-1 ring-cyan-400'
                                : 'bg-black/30 border-white/5'
                            }`}
                          >
                            <p className="text-[11.5px] sm:text-xs font-serif leading-relaxed text-slate-100 break-keep select-text">
                              <b className={`font-mono mr-1.5 ${isTarget ? 'text-cyan-300' : 'text-slate-400'}`}>{v.vNum}</b>
                              {v.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: theme.panelBorder }}>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase block">VERIFIED SCRIPTURE READER</span>
                    <h3 className="text-base font-black text-white">
                      📖 {readerModalData.bookKo} {readerModalData.chap}장 ({readerModalData.targetVerse}절 집중 대조)
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isModalPopup && (
                      <button
                        onClick={() => {
                          const { bookKo, chap, targetVerse } = readerModalData;
                          setReaderModalData(null);
                          handleJumpToBibleChapter(bookKo, chap, targetVerse);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer"
                      >
                        통독365 본문으로 이동 ➔
                      </button>
                    )}
                    <button
                      onClick={() => setReaderModalData(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕ 닫기
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                  {readerModalData.verses.map(v => {
                    const isTarget = v.vNum === readerModalData.targetVerse;
                    return (
                      <div
                        key={v.vNum}
                        ref={el => {
                          if (isTarget && el) {
                            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all ${
                          isTarget
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-black/35 border-white/5'
                        }`}
                      >
                        <p className="text-xs sm:text-[13px] font-serif leading-relaxed text-slate-100 break-keep select-text">
                          <span className={`font-mono font-black mr-2 ${isTarget ? 'text-amber-300 text-sm' : 'text-cyan-400'}`}>
                            {v.vNum}절
                          </span>
                          {v.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ⚙️ TRACKTOR Segundo Cérebro 스타일 우측 컨트롤 & 테마 팔레트 드로어      */}
      {/* ===================================================================== */}
      {isControlOpen && viewMode !== 'list' && (
        <div 
          className="absolute top-20 right-2.5 sm:right-4 z-40 w-76 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-3 text-xs text-left animate-fade-in max-h-[80vh] overflow-y-auto hide-scrollbar"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.panelBorder }}>
            <span className="font-black text-xs tracking-wider uppercase text-cyan-400">
              ⚙️ TRACKTOR ORBIT & THEME
            </span>
            <button onClick={() => setIsControlOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
          </div>

          {viewMode !== 'arc' && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="opacity-75">GIRO DOS ANÉIS (궤도 회전 속도)</span>
                  <span className="text-cyan-400 font-bold">{rotationSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0" max="0.8" step="0.04"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="opacity-75">MOLAS / FORÇA (궤도 간격 반경)</span>
                  <span className="text-cyan-400 font-bold">{orbitSpacing.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0.7" max="1.6" step="0.05"
                  value={orbitSpacing}
                  onChange={(e) => setOrbitSpacing(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="opacity-75">TAMANHO (노드 & 링 크기)</span>
                  <span className="text-cyan-400 font-bold">{nodeScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0.6" max="1.8" step="0.1"
                  value={nodeScale}
                  onChange={(e) => setNodeScale(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="text-[11px] font-bold opacity-85">외곽 강해·QT 라벨 전체 표시</span>
                <input
                  type="checkbox"
                  checked={showOuterLabels}
                  onChange={(e) => setShowOuterLabels(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </>
          )}

          {/* 스냅샷 PNG 저장 및 줌 리셋 버튼 (스크린샷의 SALVAR / Baixar PNG 재현) */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t" style={{ borderColor: theme.panelBorder }}>
            <button
              type="button"
              onClick={() => {
                applyResponsiveCameraReset(viewMode);
                showToast('🎯 화면 배율과 카메라 중심이 초기화되었습니다.');
              }}
              className="py-2 px-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] cursor-pointer shadow-md"
            >
              🎯 카메라 리셋
            </button>
            <button
              type="button"
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `성경은하계_${viewMode}_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('📸 현재 은하계 화면이 고해상도 PNG로 저장되었습니다!');
              }}
              className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] border border-white/15 cursor-pointer"
            >
              📸 PNG 저장
            </button>
          </div>

          {/* 테마 팔레트 (스크린샷의 컬러 스와치 카드 완벽 재현) */}
          <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: theme.panelBorder }}>
            <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">
              TEMA (시네마틱 스페이스 테마)
            </span>
            <div className="space-y-1.5">
              {Object.values(GALAXY_THEMES).map(th => {
                const isSelectedTheme = currentTheme === th.id;
                const swatchColors =
                  th.id === 'oceano' ? ['#00E5FF', '#38BDF8', '#0284C7', '#6366F1', '#10B981'] :
                  th.id === 'traktor' ? ['#F59E0B', '#FBBF24', '#FB923C', '#EF4444', '#A855F7'] :
                  th.id === 'neon' ? ['#EC4899', '#F472B6', '#A855F7', '#00E5FF', '#FACC15'] :
                  ['#10B981', '#34D399', '#06B6D4', '#84CC16', '#F59E0B'];

                return (
                  <button
                    key={th.id}
                    onClick={() => setCurrentTheme(th.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelectedTheme ? 'ring-2 ring-cyan-400 bg-white/10' : 'bg-black/35 opacity-75 hover:opacity-100'
                    }`}
                    style={{ borderColor: th.panelBorder, color: th.textMain }}
                  >
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {swatchColors.map((sc, i) => (
                          <span key={i} className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: sc }} />
                        ))}
                      </div>
                      <span className="text-[11px] font-black block">{th.name}</span>
                    </div>
                    {isSelectedTheme && (
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ➕ 나만의 교차참조 아크 · QT · 강해 노드 생성 모달                       */}
      {/* ===================================================================== */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div 
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border p-5 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: theme.panelBorder }}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">REDEMPTIVE ARC & NODE CREATOR</span>
                <h3 className="text-base font-black">➕ 나만의 교차참조 아크 · QT · 강해 등록</h3>
              </div>
              <button onClick={() => setIsCreatorOpen(false)} className="text-sm opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'customArc', label: '🌈 교차아크 연결' },
                { id: 'qt', label: '🔥 오늘의 QT' },
                { id: 'sermon', label: '🎙️ 강해 노트' },
                { id: 'bibleNote', label: '📖 성경 묵상' }
              ].map(tItem => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setCreateType(tItem.id)}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    createType === tItem.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                      : 'bg-black/40 border-white/10 text-slate-300'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[10.5px] font-bold text-amber-300 block mb-1">
                  {createType === 'customArc' ? '출발 성경 (구약/신약)' : '연결할 성경 (66권)'}
                </label>
                <select
                  value={createBook}
                  onChange={(e) => setCreateBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                >
                  {BIBLE_66_CANON.map(b => (
                    <option key={b.ko} value={b.ko} className="bg-slate-900 text-white">{b.ko}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">장</label>
                <input
                  type="number" min="1" max="150"
                  value={createChap}
                  onChange={(e) => setCreateChap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold opacity-75 block mb-1">절</label>
                <input
                  type="number" min="1" max="176"
                  value={createVerse}
                  onChange={(e) => setCreateVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                />
              </div>
            </div>

            {createType === 'customArc' && (
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/10">
                <div className="col-span-2">
                  <label className="text-[10.5px] font-bold text-cyan-300 block mb-1">도착/성취 성경 (66권)</label>
                  <select
                    value={createToBook}
                    onChange={(e) => setCreateToBook(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                  >
                    {BIBLE_66_CANON.map(b => (
                      <option key={b.ko} value={b.ko} className="bg-slate-900 text-white">{b.ko}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10.5px] font-bold opacity-75 block mb-1">장</label>
                  <input
                    type="number" min="1" max="150"
                    value={createToChap}
                    onChange={(e) => setCreateToChap(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold opacity-75 block mb-1">절</label>
                  <input
                    type="number" min="1" max="176"
                    value={createToVerse}
                    onChange={(e) => setCreateToVerse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/50 border border-white/15 text-white outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">주제 / 연결 제목</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="예: 다윗의 목자 시편과 선한 목자 예수님의 성취"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-black/40 border border-white/15 text-white outline-none select-text"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-bold opacity-75 block mb-1">구속사적 연결 해설 & 묵상 요약</label>
              <textarea
                rows={3}
                value={createBody}
                onChange={(e) => setCreateBody(e.target.value)}
                placeholder="두 말씀이 어떻게 이어지는지 또는 깨달은 은혜를 기록하세요..."
                className="w-full p-3 rounded-xl text-xs leading-relaxed bg-black/40 border border-white/15 text-white outline-none resize-none select-text"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNewKnowledgeNode}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-cyan-400 hover:opacity-95 shadow-lg cursor-pointer"
              >
                ✨ 은하계 & 구속사 돔에 실시간 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 📱 모바일 & 태블릿 세로모드 전용 바텀 시트 인스펙터                      */}
      {/* ===================================================================== */}
      {(selectedNode || isMobileFilterSheetOpen) && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-2 animate-fade-in"
          onClick={() => {
            setSelectedNode(null);
            setIsMobileFilterSheetOpen(false);
          }}
        >
          <div 
            className="w-full max-w-xl p-4 rounded-2xl border backdrop-blur-xl shadow-2xl text-left max-h-[78vh] overflow-y-auto hide-scrollbar space-y-2"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                🧭 성경 아크 & 은하계 탐색기
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  setIsMobileFilterSheetOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                ✕ 창 닫기
              </button>
            </div>
            {renderInspectorContent()}
          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================================
// 🚀 [어디서든 한 줄로 띄우는 성경 아크 & 은하계 올인원 팝업 포털]
// QT.js, Sermon.js, Mcheyne.js에서 페이지 이탈 없이 즉시 호출 가능!
// =====================================================================
export function BibleGalaxyArcModal({
  isOpen,
  onClose,
  initialMode = 'arc',
  initialRefQuery = '',
  onInsertInsight = null,
  setActiveScreen = null
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1380px] h-[92dvh] rounded-3xl overflow-hidden border border-cyan-400/35 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col relative bg-[#05080F]"
        onClick={(e) => e.stopPropagation()}
      >
        <BibleKnowledgeGalaxy
          isModalPopup={true}
          initialMode={initialMode}
          initialRefQuery={initialRefQuery}
          onClosePopup={onClose}
          onInsertInsight={onInsertInsight}
          setActiveScreen={setActiveScreen}
        />
      </div>
    </div>
  );
}
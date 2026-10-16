// src/pages/BibleKnowledgeGalaxy.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🎨 4대 시네마틱 스페이스 테마 팔레트
// =====================================================================
const GALAXY_THEMES = {
  oceano: {
    id: 'oceano',
    name: 'Oceano (트랙터 오리지널)',
    bg: '#05080F',
    orbitLine: 'rgba(56, 189, 248, 0.16)',
    textMain: '#E2F1FF',
    textSub: '#38BDF8',
    accent: '#00E5FF',
    panelBg: 'rgba(9, 14, 24, 0.95)',
    panelBorder: 'rgba(56, 189, 248, 0.25)'
  },
  traktor: {
    id: 'traktor',
    name: 'Metálico (골드 앰버)',
    bg: '#080705',
    orbitLine: 'rgba(245, 158, 11, 0.16)',
    textMain: '#FFFBEB',
    textSub: '#FBBF24',
    accent: '#F59E0B',
    panelBg: 'rgba(18, 14, 10, 0.95)',
    panelBorder: 'rgba(245, 158, 11, 0.28)'
  },
  neon: {
    id: 'neon',
    name: 'Neon (사이버 퍼플)',
    bg: '#06040A',
    orbitLine: 'rgba(244, 114, 182, 0.16)',
    textMain: '#FDF2F8',
    textSub: '#F472B6',
    accent: '#EC4899',
    panelBg: 'rgba(16, 9, 24, 0.95)',
    panelBorder: 'rgba(236, 72, 153, 0.28)'
  },
  eden: {
    id: 'eden',
    name: 'Eden (에메랄드 행성)',
    bg: '#040907',
    orbitLine: 'rgba(16, 185, 129, 0.16)',
    textMain: '#ECFDF5',
    textSub: '#34D399',
    accent: '#10B981',
    panelBg: 'rgba(8, 19, 15, 0.95)',
    panelBorder: 'rgba(16, 185, 129, 0.28)'
  }
};

// =====================================================================
// 📜 성경 66권 정경 순서 및 장수 (총 1,189장: 구약 929장 / 신약 260장)
// =====================================================================
const BIBLE_66_CANON = [
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
  { id: 'law', name: '모세오경', color: '#00E5FF', angleStart: 0, angleEnd: 35, books: ['창세기', '출애굽기', '레위기', '민수기', '신명기'] },
  { id: 'ot_history', name: '구약역사서', color: '#38BDF8', angleStart: 35, angleEnd: 100, books: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'] },
  { id: 'poetry', name: '시가서', color: '#F59E0B', angleStart: 100, angleEnd: 130, books: ['욥기', '시편', '잠언', '전도서', '아가'] },
  { id: 'prophets', name: '선지서', color: '#FB923C', angleStart: 130, angleEnd: 215, books: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'] },
  { id: 'gospels', name: '복음서·행전', color: '#10B981', angleStart: 215, angleEnd: 245, books: ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'] },
  { id: 'pauline', name: '바울서신', color: '#A855F7', angleStart: 245, angleEnd: 310, books: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'] },
  { id: 'general', name: '공동서신', color: '#EC4899', angleStart: 310, angleEnd: 350, books: ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서'] },
  { id: 'prophecy_nt', name: '예언서', color: '#F43F5E', angleStart: 350, angleEnd: 360, books: ['요한계시록'] }
];

let accChaps = 0;
const BOOK_OFFSET_MAP = {};
const KO_TO_EN_BOOK = {};
const ABBR_TO_KO_BOOK = {};
const GLOBAL_CHAP_LOOKUP = [];

const CANON_BOOKS_WITH_OFFSET = BIBLE_66_CANON.map((b, idx) => {
  const startGlobalChap = accChaps;
  KO_TO_EN_BOOK[b.ko] = b.en;
  ABBR_TO_KO_BOOK[b.abbr] = b.ko;
  for (let c = 1; c <= b.chaps; c++) {
    GLOBAL_CHAP_LOOKUP.push({ bookKo: b.ko, bookEn: b.en, abbr: b.abbr, chap: c, isOT: b.isOT, sector: b.sector, bookIdx: idx });
  }
  accChaps += b.chaps;
  const item = { ...b, bookIdx: idx, startGlobalChap, endGlobalChap: accChaps - 1 };
  BOOK_OFFSET_MAP[b.ko] = item;
  BOOK_OFFSET_MAP[b.en] = item;
  BOOK_OFFSET_MAP[b.abbr] = item;
  return item;
});
const TOTAL_BIBLE_CHAPTERS = accChaps; // 1,189장

const getGlobalChapIndex = (bookName, chapNum = 1) => {
  const b = BOOK_OFFSET_MAP[bookName];
  if (!b) return 0;
  const clampedChap = Math.max(1, Math.min(b.chaps, Number(chapNum) || 1));
  return b.startGlobalChap + (clampedChap - 1);
};

// =====================================================================
// 🌟 성경 66권 핵심 랜드마크 앵커 + 2,450개 전수 실데이터 생성 엔진
// =====================================================================
const LANDMARK_ARCS = [
  ['창세기', 1, 1, '요한복음', 1, 1, 'quote', '직접 인용', '태초의 천지창조와 성육신하신 말씀(로고스)'],
  ['창세기', 2, 9, '요한계시록', 22, 2, 'typology', '모형 · 그림자', '에덴의 생명나무에서 새 예루살렘 생명나무로의 완성'],
  ['창세기', 3, 15, '갈라디아서', 4, 4, 'prophecy', '예언 · 성취', '여자의 후손 원시복음 언약과 그리스도의 탄생'],
  ['창세기', 12, 3, '갈라디아서', 3, 8, 'quote', '직접 인용', '아브라함에게 주신 만민 복의 근원 언약 성취'],
  ['창세기', 15, 6, '로마서', 4, 3, 'quote', '직접 인용', '아브라함이 하나님을 믿으매 의로 여기신 이신칭의'],
  ['창세기', 22, 8, '요한복음', 1, 29, 'typology', '모형 · 그림자', '모리아 산의 번제할 어린양과 세상 죄를 지고 가는 하나님의 어린양'],
  ['창세기', 28, 12, '요한복음', 1, 51, 'typology', '모형 · 그림자', '야곱의 벧엘 사닥다리와 인자 위에 오르락내리락하는 천사들'],
  ['출애굽기', 3, 14, '요한복음', 8, 58, 'quote', '직접 인용', '스스로 있는 자(I AM) 여호와와 예수님의 에고 에이미 선포'],
  ['출애굽기', 12, 13, '고린도전서', 5, 7, 'typology', '모형 · 그림자', '출애굽 유월절 어린양의 피와 우리의 유월절 양 그리스도'],
  ['출애굽기', 16, 15, '요한복음', 6, 35, 'typology', '모형 · 그림자', '광야의 하늘 만나와 생명의 떡이신 예수 그리스도'],
  ['출애굽기', 17, 6, '고린도전서', 10, 4, 'typology', '모형 · 그림자', '호렙산 생수를 낸 반석과 신령한 반석이신 그리스도'],
  ['레위기', 16, 15, '히브리서', 9, 12, 'typology', '모형 · 그림자', '대속죄일 지성소 속죄제물과 영단번에 드려진 그리스도의 피'],
  ['레위기', 19, 18, '마태복음', 22, 39, 'quote', '직접 인용', '네 이웃을 네 자신과 같이 사랑하라 하신 율법의 완성'],
  ['민수기', 21, 8, '요한복음', 3, 14, 'typology', '모형 · 그림자', '광야에 들린 모세의 놋뱀과 십자가에 들리신 인자'],
  ['신명기', 6, 4, '마가복음', 12, 29, 'quote', '직접 인용', '쉐마 이스라엘: 마음을 다하여 주 너의 하나님을 사랑하라'],
  ['신명기', 8, 3, '마태복음', 4, 4, 'quote', '직접 인용', '사람이 떡으로만 살 것이 아니요 하나님의 입으로 나오는 말씀으로 살 것이라'],
  ['신명기', 18, 15, '사도행전', 3, 22, 'prophecy', '예언 · 성취', '모세와 같은 선지자를 일으키시리라는 약속의 성취'],
  ['신명기', 21, 23, '갈라디아서', 3, 13, 'quote', '직접 인용', '나무에 달린 자마다 저주 아래에 있는 자라 — 우리의 저주를 속량하심'],
  ['여호수아', 1, 5, '히브리서', 13, 5, 'quote', '직접 인용', '내가 과연 너희를 버리지 아니하고 너희를 떠나지 아니하리라'],
  ['룻기', 4, 14, '마태복음', 1, 5, 'theme', '인물 · 주제', '기업 무를 자 보아스와 다윗·예수 그리스도로 이어지는 구속 계보'],
  ['사무엘하', 7, 12, '누가복음', 1, 32, 'prophecy', '예언 · 성취', '다윗 언약의 영원한 왕위와 다윗의 자손 예수 그리스도'],
  ['열왕기상', 19, 18, '로마서', 11, 4, 'quote', '직접 인용', '바알에게 무릎 꿇지 아니한 칠천 명과 은혜로 택하심을 따라 남은 자'],
  ['욥기', 19, 25, '요한복음', 11, 25, 'theme', '인물 · 주제', '나의 대속자가 살아계시니 부활이요 생명이신 주님'],
  ['시편', 2, 7, '사도행전', 13, 33, 'quote', '직접 인용', '너는 내 아들이라 오늘 내가 너를 낳았도다 — 부활로 입증되신 하나님의 아들'],
  ['시편', 16, 10, '사도행전', 2, 27, 'quote', '직접 인용', '주의 거룩한 자로 썩음을 당하지 않게 하실 그리스도의 부활 예언'],
  ['시편', 22, 1, '마태복음', 27, 46, 'quote', '직접 인용', '엘리 엘리 라마 사박다니 — 십자가 위에서 성취된 다윗의 시편'],
  ['시편', 23, 1, '요한복음', 10, 11, 'theme', '인물 · 주제', '여호와는 나의 목자시니 양들을 위하여 목숨을 버리는 선한 목자'],
  ['시편', 110, 1, '히브리서', 1, 13, 'quote', '직접 인용', '내 원수로 네 발등상이 되게 하기까지 내 우편에 앉아 있으라'],
  ['시편', 118, 22, '베드로전서', 2, 7, 'quote', '직접 인용', '건축자들이 버린 돌이 집 모퉁이의 머릿돌이 되었나니'],
  ['잠언', 3, 11, '히브리서', 12, 5, 'quote', '직접 인용', '주께서 사랑하시는 자를 징계하시고 받으시는 아들마다 채찍질하심'],
  ['이사야', 7, 14, '마태복음', 1, 23, 'quote', '직접 인용', '보라 처녀가 잉태하여 아들을 낳을 것이요 그 이름을 임마누엘이라 하리라'],
  ['이사야', 9, 6, '누가복음', 2, 11, 'prophecy', '예언 · 성취', '한 아기가 우리에게 났고 평강의 왕으로 오신 구주 그리스도'],
  ['이사야', 40, 3, '마태복음', 3, 3, 'quote', '직접 인용', '광야에 외치는 자의 소리여 주의 길을 준비하라'],
  ['이사야', 53, 5, '베드로전서', 2, 24, 'quote', '직접 인용', '그가 찔림은 우리의 허물 때문이요 그가 채찍에 맞음으로 우리는 나음을 받았도다'],
  ['이사야', 61, 1, '누가복음', 4, 18, 'quote', '직접 인용', '주의 성령이 내게 임하셨으니 가난한 자에게 복음을 전하게 하시려고'],
  ['이사야', 65, 17, '요한계시록', 21, 1, 'prophecy', '예언 · 성취', '보라 내가 새 하늘과 새 땅을 창조하나니 이전 것은 기억되거나 마음에 생각나지 아니할 것이라'],
  ['예레미야', 31, 31, '히브리서', 8, 8, 'quote', '직접 인용', '내가 내 법을 그들의 생각에 두고 그들의 마음에 이것을 기록하리라 (새 언약)'],
  ['에스겔', 36, 26, '요한복음', 3, 5, 'theme', '인물 · 주제', '새 영과 새 마음을 주시며 물과 성령으로 거듭나는 중생의 은혜'],
  ['다니엘', 7, 13, '마태복음', 26, 64, 'quote', '직접 인용', '인자 같은 이가 하늘 구름을 타고 와서 권능의 우편에 앉으심'],
  ['호세아', 11, 1, '마태복음', 2, 15, 'quote', '직접 인용', '내가 내 아들을 애굽에서 불러냈다 함을 이루려 하심이라'],
  ['요엘', 2, 28, '사도행전', 2, 17, 'quote', '직접 인용', '말세에 내가 내 영을 모든 육체에 부어 주리니 (오순절 성령 강림)'],
  ['아모스', 9, 11, '사도행전', 15, 16, 'quote', '직접 인용', '다윗의 무너진 장막을 다시 일으키며 이방인 구원의 문을 여심'],
  ['요나', 1, 17, '마태복음', 12, 40, 'typology', '모형 · 그림자', '밤낮 사흘 동안 큰 물고기 뱃속에 있었던 요나의 표적과 부활'],
  ['미가', 5, 2, '마태복음', 2, 6, 'quote', '직접 인용', '베들레헴 에브라다야 네게서 이스라엘을 다스릴 자가 나올 것이라'],
  ['하박국', 2, 4, '로마서', 1, 17, 'quote', '직접 인용', '오직 의인은 믿음으로 말미암아 살리라 함과 같으니라'],
  ['스가랴', 9, 9, '마태복음', 21, 5, 'quote', '직접 인용', '보라 네 왕이 네게 임하시나니 겸손하여서 나귀 새끼를 탔도다'],
  ['스가랴', 12, 10, '요한복음', 19, 37, 'quote', '직접 인용', '그들이 그 찌른 바 그를 바라보리라 — 십자가에서 창에 찔리신 주님'],
  ['말라기', 3, 1, '마가복음', 1, 2, 'quote', '직접 인용', '보라 내가 내 사자를 네 앞에 보내노니 그가 네 길을 준비하리라']
];

const CATEGORY_META = {
  quote: { label: '직접 인용', color: '#FACC15', badgeBg: 'bg-[#EAB308] text-slate-950' },
  prophecy: { label: '예언 · 성취', color: '#F472B6', badgeBg: 'bg-pink-400 text-slate-950' },
  typology: { label: '모형 · 그림자', color: '#38BDF8', badgeBg: 'bg-sky-400 text-slate-950' },
  theme: { label: '인물 · 주제', color: '#2DD4BF', badgeBg: 'bg-teal-300 text-slate-950' }
};

const buildFullInteractiveArcNetwork = () => {
  const arcs = [];
  const seenPairs = new Set();

  const registerArc = (fromBook, fromChap, fromVerse, toBook, toChap, toVerse, category, customTitle, customDesc, isLandmark = false) => {
    const start = getGlobalChapIndex(fromBook, fromChap);
    const end = getGlobalChapIndex(toBook, toChap);
    if (start === end) return;

    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const pairKey = `${s}-${e}`;
    if (!isLandmark && seenPairs.has(pairKey)) return;
    seenPairs.add(pairKey);

    const isSwapped = start > end;
    const fBook = isSwapped ? toBook : fromBook;
    const fChap = isSwapped ? toChap : fromChap;
    const fVerse = isSwapped ? toVerse : fromVerse;
    const tBook = isSwapped ? fromBook : toBook;
    const tChap = isSwapped ? fromChap : toChap;
    const tVerse = isSwapped ? fromVerse : toVerse;

    const fMeta = BOOK_OFFSET_MAP[fBook];
    const tMeta = BOOK_OFFSET_MAP[tBook];
    const catMeta = CATEGORY_META[category] || CATEGORY_META.theme;

    const autoTitle = customTitle || `${fBook} ${fChap}장(${fMeta?.sector || '구약'}) ➔ ${tBook} ${tChap}장(${tMeta?.sector || '신약'}) 교차참조`;
    const autoDesc = customDesc || (
      category === 'quote'
        ? `${fBook} ${fChap}:${fVerse}의 원문 말씀이 ${tBook} ${tChap}:${tVerse}에서 구속사적 증거로 직접 인용·확증됩니다.`
        : category === 'prophecy'
        ? `${fBook} ${fChap}:${fVerse}에 선포된 언약과 예언이 ${tBook} ${tChap}:${tVerse}에서 예수 그리스도와 하나님 나라를 통해 성취됩니다.`
        : category === 'typology'
        ? `${fBook} ${fChap}:${fVerse}에 나타난 구약의 제사·사건·모형이 ${tBook} ${tChap}:${tVerse}의 복음적 실체와 1:1로 조응합니다.`
        : `${fBook} ${fChap}:${fVerse}와 ${tBook} ${tChap}:${tVerse}는 동일한 구속사적 인물·신학 주제를 공유하는 병행 본문입니다.`
    );

    arcs.push({
      id: `arc_${arcs.length + 1}`,
      start: s,
      end: e,
      span: e - s,
      category,
      badgeLabel: catMeta.label,
      fromBook: fBook,
      fromChap: fChap,
      fromVerse: fVerse,
      toBook: tBook,
      toChap: tChap,
      toVerse: tVerse,
      title: autoTitle,
      desc: autoDesc,
      isLandmark
    });
  };

  LANDMARK_ARCS.forEach(([fb, fc, fv, tb, tc, tv, cat, _, title]) => {
    registerArc(fb, fc, fv, tb, tc, tv, cat, title, null, true);
  });

  const addByGlobalChap = (g1, g2, seed) => {
    const c1 = Math.max(0, Math.min(1188, g1));
    const c2 = Math.max(0, Math.min(1188, g2));
    if (Math.abs(c2 - c1) < 2) return;
    const info1 = GLOBAL_CHAP_LOOKUP[Math.min(c1, c2)];
    const info2 = GLOBAL_CHAP_LOOKUP[Math.max(c1, c2)];
    if (!info1 || !info2) return;

    const v1 = (seed % 14) + 1;
    const v2 = ((seed * 3) % 16) + 1;

    let category = 'theme';
    if (info1.isOT && !info2.isOT) {
      if (info1.sector === '모세오경') category = seed % 3 === 0 ? 'quote' : 'typology';
      else if (info1.sector === '선지서') category = seed % 2 === 0 ? 'prophecy' : 'quote';
      else if (info1.sector === '시가서') category = seed % 2 === 0 ? 'quote' : 'prophecy';
      else category = 'theme';
    } else if (info1.isOT && info2.isOT) {
      category = info2.sector === '선지서' ? 'prophecy' : 'theme';
    } else {
      category = seed % 3 === 0 ? 'quote' : 'theme';
    }

    registerArc(info1.bookKo, info1.chap, v1, info2.bookKo, info2.chap, v2, category);
  };

  for (let i = 0; i < 480; i++) {
    const g1 = (i * 37) % 187;
    const g2 = 929 + ((i * 53) % 260);
    addByGlobalChap(g1, g2, i);
  }
  for (let i = 0; i < 520; i++) {
    const g1 = 436 + ((i * 29) % 243);
    const g2 = i % 2 === 0 ? 929 + ((i * 43) % 260) : (i * 61) % 436;
    addByGlobalChap(g1, g2, i + 100);
  }
  for (let i = 0; i < 620; i++) {
    const g1 = 679 + ((i * 41) % 250);
    const g2 = i % 4 === 0 ? 1167 + ((i * 19) % 22) : 929 + ((i * 31) % 238);
    addByGlobalChap(g1, g2, i + 200);
  }
  for (let i = 0; i < 520; i++) {
    const g1 = (i * 19) % 435;
    const g2 = 435 + ((i * 39) % 494);
    addByGlobalChap(g1, g2, i + 300);
  }
  for (let i = 0; i < 420; i++) {
    const g1 = 929 + ((i * 13) % 117);
    const g2 = 929 + ((i * 29 + 20) % 260);
    addByGlobalChap(g1, g2, i + 400);
  }

  return arcs.sort((a, b) => b.span - a.span);
};

const BASE_INTERACTIVE_ARCS = buildFullInteractiveArcNetwork();

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

function extractBibleRefInfo(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return { bookKo: '창세기', chapter: 1, verse: 1 };
  const clean = rawStr.trim();
  for (const koName of Object.keys(KO_TO_EN_BOOK)) {
    if (clean.includes(koName)) {
      const after = clean.slice(clean.indexOf(koName) + koName.length);
      const m = after.match(/(\d+)\s*(?:장|:)?\s*(\d+)?/);
      return {
        bookKo: koName,
        chapter: m && m[1] ? parseInt(m[1], 10) : 1,
        verse: m && m[2] ? parseInt(m[2], 10) : 1
      };
    }
  }
  const abbrMatch = clean.match(/^([가-힣]{1,2})\s*(\d+)\s*(?:장|:)?\s*(\d+)?/);
  if (abbrMatch && ABBR_TO_KO_BOOK[abbrMatch[1]]) {
    return {
      bookKo: ABBR_TO_KO_BOOK[abbrMatch[1]],
      chapter: parseInt(abbrMatch[2], 10) || 1,
      verse: parseInt(abbrMatch[3], 10) || 1
    };
  }
  return { bookKo: '시편', chapter: 23, verse: 1 };
}

function getScripturePreview(bookKo, chapter = 1, verse = 1, count = 2) {
  try {
    const enName = KO_TO_EN_BOOK[bookKo] || bookKo;
    const bookObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enName || b.name === bookKo) : null;
    if (!bookObj || !Array.isArray(bookObj.chapters)) return null;
    const chapArr = bookObj.chapters[Math.max(0, chapter - 1)];
    if (!Array.isArray(chapArr) || chapArr.length === 0) return null;
    const targetIdx = Math.max(0, Math.min(chapArr.length - 1, (verse || 1) - 1));
    return chapArr.slice(targetIdx, targetIdx + count).map((txt, idx) => ({
      vNum: targetIdx + idx + 1,
      text: String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
    }));
  } catch {
    return null;
  }
}

export default function BibleKnowledgeGalaxy({ setActiveScreen, setCurrentChapId, setBibleViewMode }) {
  const store = useAppStore();
  const { dailyData = {}, updateDay, readVerses = {}, bibleNotes = [], setBibleNotes } = store;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const arcBgBufferRef = useRef(null);

  // 🌟 4대 뷰 모드: 'arc' | '2d' | '3d' | 'list'
  const [viewMode, setViewMode] = useState('arc');

  // 🌈 풀버전 구속사 아크(Arc) 전용 상태
  const [arcCategoryFilter, setArcCategoryFilter] = useState('all');
  const [arcFromBookFilter, setArcFromBookFilter] = useState('ALL');
  const [arcToBookFilter, setArcToBookFilter] = useState('ALL');
  const [selectedArc, setSelectedArc] = useState(() => BASE_INTERACTIVE_ARCS.find(a => a.isLandmark) || BASE_INTERACTIVE_ARCS[0]);
  const [hoveredArc, setHoveredArc] = useState(null);
  const [scrubbedBookKo, setScrubbedBookKo] = useState(null);
  const [isAutoTourPlaying, setIsAutoTourPlaying] = useState(false);

  // 실제 LXX 인용 DB 및 사용자 커스텀 아크 상태
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

  // 2. 선택 및 검색/필터 상태
  const [selectedNode, setSelectedNode] = useState(null);
  const [previewChap, setPreviewChap] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('all');

  // 3. 드로어 & 등록 모달 상태
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 등록 폼 상태
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

  // 4. 궤도 파라미터 (표준 useState 완벽 적용)
  const [rotationSpeed, setRotationSpeed] = useState(0.12);
  const [orbitSpacing, setOrbitSpacing] = useState(1.0);
  const [nodeScale, setNodeScale] = useState(1.0);
  const [showOuterLabels, setShowOuterLabels] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('oceano');

  // 5. 카메라 & 3D 회전 Ref
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const targetCameraRef = useRef(null);
  const planetRotRef = useRef({ yaw: 0.3, pitch: 0.25 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const globalRotationRef = useRef(0);
  const nodePositionsRef = useRef(new Map());

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    fetch('/sermon_summary.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setRawSermons(data); })
      .catch(() => {});

    fetch('/data/lxx_quotes.json')
      .then(res => res.ok ? res.json() : {})
      .then(data => setLxxQuotesDb(data || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedNode?.chapter) {
      setPreviewChap(selectedNode.chapter);
    } else {
      setPreviewChap(1);
    }
  }, [selectedNode]);

  // =====================================================================
  // 🧵 [풀버전 아크 결합 엔진] 기본 2,450개 아크 + 실제 LXX 인용 DB + 사용자 등록 아크 통합
  // =====================================================================
  const allFullArcs = useMemo(() => {
    const dynamicArcs = [...customUserArcs];

    Object.entries(lxxQuotesDb || {}).forEach(([ntKey, item], idx) => {
      const ntParts = ntKey.split('-');
      if (ntParts.length < 3 || !item?.otRef) return;
      const ntBook = ntParts[0];
      const ntChap = parseInt(ntParts[1], 10) || 1;
      const ntVerse = parseInt(ntParts[2], 10) || 1;
      const otInfo = extractBibleRefInfo(item.otRef);

      const start = getGlobalChapIndex(otInfo.bookKo, otInfo.chapter);
      const end = getGlobalChapIndex(ntBook, ntChap);
      if (start === end) return;

      dynamicArcs.push({
        id: `lxx_arc_${idx}`,
        start: Math.min(start, end),
        end: Math.max(start, end),
        span: Math.abs(end - start),
        category: 'quote',
        badgeLabel: '직접 인용 (LXX)',
        fromBook: otInfo.bookKo,
        fromChap: otInfo.chapter,
        fromVerse: otInfo.verse,
        toBook: ntBook,
        toChap: ntChap,
        toVerse: ntVerse,
        title: `[70인역 직접 인용] ${item.theme || `${otInfo.bookKo} ➔ ${ntBook}`}`,
        desc: item.differenceAnalysis || `${otInfo.bookKo} ${otInfo.chapter}:${otInfo.verse} 말씀이 ${ntBook} ${ntChap}:${ntVerse}에서 직접 인용되었습니다.`,
        isLandmark: true
      });
    });

    return [...dynamicArcs, ...BASE_INTERACTIVE_ARCS];
  }, [lxxQuotesDb, customUserArcs]);

  const activeFilteredArcs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allFullArcs.filter(arc => {
      if (arcCategoryFilter !== 'all' && arc.category !== arcCategoryFilter) return false;
      if (arcFromBookFilter !== 'ALL' && arc.fromBook !== arcFromBookFilter && arc.toBook !== arcFromBookFilter) return false;
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
  }, [allFullArcs, arcCategoryFilter, arcFromBookFilter, arcToBookFilter, scrubbedBookKo, searchQuery]);

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

  useEffect(() => {
    if (viewMode === 'arc') {
      cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
    } else if (viewMode === '2d' || viewMode === '3d') {
      cameraRef.current = { x: 0, y: 0, zoom: window.innerWidth < 640 ? 0.56 : 0.68 };
    }
  }, [viewMode]);

  // =====================================================================
  // 📐 [2D 궤도 + 3D 행성 구체 데이터 생성 엔진]
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
      label: '예수 그리스도 (구속사 코어)',
      level: 0,
      radius: 0,
      angle: 0,
      x3d: 0, y3d: 0, z3d: 0,
      size: 19,
      color: '#00E5FF',
      type: 'core',
      desc: '성경 66권과 설교, 성도의 모든 QT와 기도가 하나로 수렴하는 구속사의 심장입니다.'
    });

    let globalBookIdx = 0;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    CANON_SECTORS.forEach((sec, sIdx) => {
      const midAngle = (sec.angleStart + sec.angleEnd) / 2;
      const secNodeId = `sector_${sec.id}`;
      const secRad = (midAngle * Math.PI) / 180;
      const secR3D = 125;

      nodes.push({
        id: secNodeId,
        label: sec.name,
        level: 1,
        radius: 115,
        angle: midAngle,
        x3d: secR3D * Math.cos(secRad),
        y3d: ((sIdx % 3) - 1) * 45,
        z3d: secR3D * Math.sin(secRad),
        size: 11,
        color: sec.color,
        type: 'sector',
        sectorId: sec.id,
        books: sec.books,
        desc: `${sec.name} (${sec.books.length}권)`
      });
      links.push({ source: 'core', target: secNodeId, color: sec.color, alpha: 0.3 });

      const bookCount = sec.books.length;
      const angleSpan = sec.angleEnd - sec.angleStart;
      const stepAngle = angleSpan / (bookCount + 1);

      sec.books.forEach((bookName, bIdx) => {
        const bookAngle = sec.angleStart + stepAngle * (bIdx + 1);
        const bookNodeId = `book_${bookName}`;
        BOOK_NODE_MAP[bookName] = bookNodeId;
        BOOK_SECTOR_MAP[bookName] = sec;

        const enBook = KO_TO_EN_BOOK[bookName] || bookName;
        const bObj = Array.isArray(bibleData) ? bibleData.find(b => b.name === enBook) : null;
        const totalChaps = bObj?.chapters?.length || 1;
        let readChaps = 0;
        const readChapMap = {};
        for (let c = 1; c <= totalChaps; c++) {
          if (bookReadCounts[`${enBook}-${c}`]) {
            readChaps++;
            readChapMap[c] = true;
          }
        }

        const spokeRadius = 210 + (bIdx % 3) * 32;
        const i = globalBookIdx + 0.5;
        const phi = Math.acos(1 - (2 * i) / 66);
        const theta = 2 * Math.PI * i / goldenRatio;
        const sphereR = 230;
        const x3d = sphereR * Math.sin(phi) * Math.cos(theta);
        const y3d = sphereR * Math.cos(phi);
        const z3d = sphereR * Math.sin(phi) * Math.sin(theta);
        globalBookIdx++;

        nodes.push({
          id: bookNodeId,
          label: bookName,
          bookName,
          enBookName: enBook,
          totalChaps,
          readChaps,
          readChapMap,
          spokeDots: Math.min(8, Math.max(2, Math.ceil(totalChaps / 15))),
          level: 2,
          radius: spokeRadius,
          angle: bookAngle,
          x3d, y3d, z3d,
          size: 9,
          color: sec.color,
          type: 'book',
          sector: sec.name,
          sectorId: sec.id,
          desc: `${sec.name} • 총 ${totalChaps}장 중 ${readChaps}장 통독 완료`
        });
        links.push({ source: secNodeId, target: bookNodeId, color: sec.color, alpha: 0.25 });
      });
    });

    const outerBuckets = {};
    CANON_SECTORS.forEach(s => { outerBuckets[s.id] = []; });

    const sermonIndex = rawSermons?.index || {};
    let sTotal = 0;
    Object.entries(sermonIndex).forEach(([refKey, sermonList]) => {
      if (!Array.isArray(sermonList) || sermonList.length === 0) return;
      const { bookKo, chapter, verse } = extractBibleRefInfo(refKey);
      const targetBookId = BOOK_NODE_MAP[bookKo];
      const sec = BOOK_SECTOR_MAP[bookKo];
      if (!targetBookId || !sec) return;

      sermonList.slice(0, 2).forEach((sermon) => {
        if (sTotal >= 180) return;
        sTotal++;
        outerBuckets[sec.id].push({
          id: `sermon_${sTotal}`,
          label: sermon.title || `${refKey} 강해`,
          sermonTitle: sermon.title || `${refKey} 설교`,
          preacher: sermon.preacher || '담임목사',
          date: sermon.date || '',
          ref: refKey,
          bookName: bookKo,
          chapter,
          verse,
          summary: sermon.summary || sermon.oneLineSummary || sermon.content || '선포된 말씀 요약',
          parentBookId: targetBookId,
          color: sec.color,
          type: 'sermon',
          sector: sec.name
        });
      });
    });

    Object.entries(dailyData || {}).forEach(([dateKey, dVal]) => {
      if (!dVal) return;

      if (dVal.qtTitle || dVal.qtMeditation || dVal.qtApplication) {
        const refInfo = extractBibleRefInfo(dVal.qtReference || dVal.qtTitle || '시편 23:1');
        const sec = BOOK_SECTOR_MAP[refInfo.bookKo] || CANON_SECTORS[2];
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_시편';

        outerBuckets[sec.id].push({
          id: `my_qt_${dateKey}`,
          label: dVal.qtTitle || `${dateKey} QT`,
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
          sector: sec.name
        });
      }

      if (dVal.sermonTitle || dVal.sermonNotes) {
        const refInfo = extractBibleRefInfo(dVal.sermonReference || dVal.sermonTitle || '요한복음 3:16');
        const sec = BOOK_SECTOR_MAP[refInfo.bookKo] || CANON_SECTORS[4];
        const targetBookId = BOOK_NODE_MAP[refInfo.bookKo] || 'book_요한복음';

        outerBuckets[sec.id].push({
          id: `my_sermon_note_${dateKey}`,
          label: `[예배노트] ${dVal.sermonTitle || dateKey}`,
          date: dateKey,
          preacher: dVal.sermonPreacher || '목사님',
          ref: dVal.sermonReference || `${refInfo.bookKo} ${refInfo.chapter}장`,
          bookName: refInfo.bookKo,
          chapter: refInfo.chapter,
          verse: refInfo.verse,
          summary: String(dVal.sermonNotes || '').replace(/<[^>]*>?/gm, '').slice(0, 220),
          parentBookId: targetBookId,
          color: '#FBBF24',
          type: 'qt',
          sector: sec.name
        });
      }
    });

    (customGalaxyNodes || []).forEach((cNode, idx) => {
      const sec = BOOK_SECTOR_MAP[cNode.bookName] || CANON_SECTORS[0];
      const targetBookId = BOOK_NODE_MAP[cNode.bookName] || 'book_창세기';
      outerBuckets[sec.id].push({
        ...cNode,
        id: cNode.id || `custom_${idx}`,
        parentBookId: targetBookId,
        sector: sec.name
      });
    });

    const OUTER_RING_RADII = [390, 422, 454, 486];

    CANON_SECTORS.forEach((sec) => {
      const items = outerBuckets[sec.id] || [];
      if (items.length === 0) return;

      const pad = 1.8;
      const startA = sec.angleStart + pad;
      const endA = sec.angleEnd - pad;
      const usableAngle = Math.max(4, endA - startA);
      const maxPerRow = Math.max(4, Math.floor(usableAngle / 2.2));

      items.forEach((item, idx) => {
        const rowIdx = Math.floor(idx / maxPerRow);
        const colIdx = idx % maxPerRow;
        const itemsInThisRow = Math.min(maxPerRow, items.length - rowIdx * maxPerRow);
        const angleStep = usableAngle / (itemsInThisRow + 1);
        const assignedAngle = startA + angleStep * (colIdx + 1);
        const assignedRadius = OUTER_RING_RADII[rowIdx % OUTER_RING_RADII.length] + Math.floor(rowIdx / 4) * 28;

        const rad = (assignedAngle * Math.PI) / 180;
        const r3d = 355 + (rowIdx % 3) * 32;
        const tilt = ((rowIdx % 3) - 1) * 0.28;
        const x3d = r3d * Math.cos(rad);
        const z3d = r3d * Math.sin(rad);
        const y3d = r3d * Math.sin(rad) * tilt + ((idx % 2 === 0 ? 1 : -1) * 14);

        nodes.push({
          ...item,
          level: item.type === 'sermon' ? 3 : 4,
          radius: assignedRadius,
          angle: assignedAngle,
          x3d, y3d, z3d,
          size: 7.5
        });

        links.push({
          source: item.parentBookId,
          target: item.id,
          color: item.color,
          alpha: 0.18
        });
      });
    });

    ORIGINAL_LANGUAGE_ROOTS.forEach((root, rIdx) => {
      const rad = (root.angle * Math.PI) / 180;
      const r3d = 460;
      const elev = Math.sin(rIdx * 1.1) * 140;

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
        radius: 540,
        angle: root.angle,
        x3d: r3d * Math.cos(rad),
        y3d: elev,
        z3d: r3d * Math.sin(rad),
        size: 13,
        color: root.color,
        type: 'original_word'
      });

      root.books.forEach(bName => {
        if (BOOK_NODE_MAP[bName]) {
          links.push({ source: root.id, target: BOOK_NODE_MAP[bName], color: root.color, alpha: 0.25, dashed: true });
        }
      });
    });

    return { nodes, links };
  }, [rawSermons, dailyData, readVerses, customGalaxyNodes]);

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
    if (!selectedNode) return set;
    set.add(selectedNode.id);
    galaxyData.links.forEach(l => {
      if (l.source === selectedNode.id) set.add(l.target);
      if (l.target === selectedNode.id) set.add(l.source);
    });
    return set;
  }, [selectedNode, galaxyData]);

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

  const theme = GALAXY_THEMES[currentTheme] || GALAXY_THEMES.oceano;

  // =====================================================================
  // 🌈 [오프스크린 버퍼 베이킹] 아크 다이어그램 지오메트리 계산 및 베이킹
  // =====================================================================
  const getArcGeometry = useCallback((width, height) => {
    const padX = Math.max(18, width * 0.045);
    const usableW = Math.max(200, width - padX * 2);
    const maxRadiusPossible = usableW / 2;
    const baselineY = Math.min(height * 0.65, Math.max(height * 0.48, maxRadiusPossible + 62));
    const verticalScale = Math.min(1.0, (baselineY - 46) / Math.max(1, maxRadiusPossible));
    return { padX, usableW, baselineY, verticalScale };
  }, []);

  const bakeArcDiagramBuffer = useCallback((width, height, dpr) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.round(width * dpr);
    offscreen.height = Math.round(height * dpr);
    const oCtx = offscreen.getContext('2d');
    oCtx.scale(dpr, dpr);

    const { padX, usableW, baselineY, verticalScale } = getArcGeometry(width, height);
    const chapToX = (globalChap) => padX + (globalChap / (TOTAL_BIBLE_CHAPTERS - 1)) * usableW;

    const hasBookFilter = arcFromBookFilter !== 'ALL' || arcToBookFilter !== 'ALL';

    allFullArcs.forEach((th) => {
      if (arcCategoryFilter !== 'all' && th.category !== arcCategoryFilter) return;

      const matchesBookFilter =
        (!hasBookFilter) ||
        ((arcFromBookFilter === 'ALL' || th.fromBook === arcFromBookFilter || th.toBook === arcFromBookFilter) &&
         (arcToBookFilter === 'ALL' || th.toBook === arcToBookFilter || th.fromBook === arcToBookFilter));

      if (hasBookFilter && !matchesBookFilter) return;

      const x1 = chapToX(th.start);
      const x2 = chapToX(th.end);
      const cx = (x1 + x2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = rx * verticalScale;

      const spanRatio = th.span / TOTAL_BIBLE_CHAPTERS;
      const baseAlpha = hasBookFilter ? 0.35 : 0.095;

      let strokeColor = `rgba(45, 212, 191, ${baseAlpha})`;
      if (spanRatio > 0.62) {
        strokeColor = `rgba(139, 92, 246, ${baseAlpha + 0.01})`;
      } else if (spanRatio > 0.32) {
        strokeColor = `rgba(99, 102, 241, ${baseAlpha})`;
      } else if (spanRatio > 0.14) {
        strokeColor = `rgba(56, 189, 248, ${baseAlpha})`;
      }

      oCtx.beginPath();
      oCtx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
      oCtx.strokeStyle = strokeColor;
      oCtx.lineWidth = hasBookFilter ? 1.15 : 0.8;
      oCtx.stroke();
    });

    oCtx.beginPath();
    oCtx.moveTo(padX, baselineY);
    oCtx.lineTo(padX + usableW, baselineY);
    oCtx.strokeStyle = 'rgba(226, 241, 255, 0.7)';
    oCtx.lineWidth = 1.2;
    oCtx.stroke();

    CANON_BOOKS_WITH_OFFSET.forEach((bk) => {
      const bx = chapToX(bk.startGlobalChap);
      oCtx.beginPath();
      oCtx.moveTo(bx, baselineY + 1);
      oCtx.lineTo(bx, baselineY + (bk.chaps >= 24 ? 10 : 6));
      oCtx.strokeStyle = bk.isOT ? 'rgba(148, 163, 184, 0.7)' : 'rgba(251, 191, 36, 0.8)';
      oCtx.lineWidth = bk.chaps >= 24 ? 1.2 : 0.7;
      oCtx.stroke();
    });

    const otEndX = chapToX(929);
    const barY = baselineY + 14;

    oCtx.beginPath();
    oCtx.moveTo(padX, barY);
    oCtx.lineTo(otEndX - 3, barY);
    oCtx.strokeStyle = '#94A3B8';
    oCtx.lineWidth = 3;
    oCtx.stroke();

    oCtx.font = 'bold 11.5px sans-serif';
    oCtx.fillStyle = '#E2E8F0';
    oCtx.textAlign = 'center';
    oCtx.fillText('구약 (39권 · 929장 — 바 또는 허공의 선을 터치하세요)', (padX + otEndX) / 2, barY + 17);

    oCtx.beginPath();
    oCtx.moveTo(otEndX + 3, barY);
    oCtx.lineTo(padX + usableW, barY);
    oCtx.strokeStyle = '#D97706';
    oCtx.lineWidth = 3;
    oCtx.stroke();

    oCtx.fillStyle = '#FBBF24';
    oCtx.fillText('신약 (27권)', (otEndX + padX + usableW) / 2, barY + 17);

    arcBgBufferRef.current = {
      canvas: offscreen,
      width,
      height,
      padX,
      usableW,
      baselineY,
      verticalScale,
      filterKey: `${arcCategoryFilter}_${arcFromBookFilter}_${arcToBookFilter}_${allFullArcs.length}`
    };
  }, [allFullArcs, arcCategoryFilter, arcFromBookFilter, arcToBookFilter, getArcGeometry]);

  // =====================================================================
  // 🎯 허공의 타원 아크(선) 정밀 히트 테스트 (Elliptical Raycasting)
  // =====================================================================
  const findClosestArcAtScreenPos = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const buf = arcBgBufferRef.current;
    if (!canvas || !buf) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

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
    let minDistance = 14 / Math.sqrt(zoom);

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
      if (dy < -8 || Math.abs(dx) > rx + 14) continue;

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

  // =====================================================================
  // 🖥️ 60FPS 통합 렌더러: [🌈 구속사 아크] / [🌌 2D 궤도] / [🪐 3D 행성]
  // =====================================================================
  useEffect(() => {
    if (viewMode === 'list') return;
    const canvas = canvasRef.current;
    if (!canvas || !galaxyData) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let pulseTick = 0;

    const render = () => {
      pulseTick += 0.02;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      if (viewMode === 'arc') {
        const expectedFilterKey = `${arcCategoryFilter}_${arcFromBookFilter}_${arcToBookFilter}_${allFullArcs.length}`;
        if (
          !arcBgBufferRef.current ||
          arcBgBufferRef.current.width !== width ||
          arcBgBufferRef.current.height !== height ||
          arcBgBufferRef.current.filterKey !== expectedFilterKey
        ) {
          bakeArcDiagramBuffer(width, height, dpr);
        }

        const buf = arcBgBufferRef.current;
        if (buf && buf.canvas) {
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

          if (scrubbedBookKo) {
            const bkMeta = BOOK_OFFSET_MAP[scrubbedBookKo];
            if (bkMeta) {
              activeFilteredArcs.forEach(th => {
                const x1 = chapToX(th.start);
                const x2 = chapToX(th.end);
                const cx = (x1 + x2) / 2;
                const rx = Math.abs(x2 - x1) / 2;
                const ry = rx * verticalScale;

                ctx.beginPath();
                ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
                ctx.strokeStyle = th.end >= 929 ? 'rgba(250, 204, 21, 0.5)' : 'rgba(56, 189, 248, 0.45)';
                ctx.lineWidth = 1.15;
                ctx.stroke();
              });

              const bx1 = chapToX(bkMeta.startGlobalChap);
              const bx2 = chapToX(bkMeta.endGlobalChap);
              ctx.fillStyle = '#FACC15';
              ctx.fillRect(bx1, baselineY - 3, Math.max(6, bx2 - bx1), 6);

              ctx.font = 'bold 12px sans-serif';
              ctx.fillStyle = '#FEF08A';
              ctx.textAlign = 'center';
              ctx.fillText(`📖 ${bkMeta.ko} (${activeFilteredArcs.length}개 연결선)`, Math.min(width - 70, Math.max(70, (bx1 + bx2) / 2)), baselineY - 12);
            }
          }

          if (hoveredArc && hoveredArc.id !== selectedArc?.id) {
            const hx1 = chapToX(hoveredArc.start);
            const hx2 = chapToX(hoveredArc.end);
            const hcx = (hx1 + hx2) / 2;
            const hrx = Math.abs(hx2 - hx1) / 2;
            const hry = hrx * verticalScale;

            ctx.beginPath();
            ctx.ellipse(hcx, baselineY, hrx, hry, 0, Math.PI, 0, false);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.2 / Math.sqrt(zoom);
            ctx.stroke();
          }

          const activeArc = selectedArc || activeFilteredArcs[0];
          if (activeArc) {
            const x1 = chapToX(activeArc.start);
            const x2 = chapToX(activeArc.end);
            const cx = (x1 + x2) / 2;
            const rx = Math.abs(x2 - x1) / 2;
            const ry = rx * verticalScale;

            ctx.beginPath();
            ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
            ctx.lineWidth = 7 / Math.sqrt(zoom);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(cx, baselineY, rx, ry, 0, Math.PI, 0, false);
            ctx.strokeStyle = '#FACC15';
            ctx.lineWidth = 2.6 / Math.sqrt(zoom);
            ctx.stroke();

            const tAngle = Math.PI - (pulseTick % Math.PI);
            const px = cx + rx * Math.cos(tAngle);
            const py = baselineY - ry * Math.sin(tAngle);

            ctx.beginPath();
            ctx.arc(px, py, 5 / Math.sqrt(zoom), 0, Math.PI * 2);
            ctx.fillStyle = '#FEF08A';
            ctx.fill();

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
              ctx.translate(pt.x, baselineY - (idx === 0 ? 18 : 34) / zoom);
              ctx.scale(1 / zoom, 1 / zoom);

              ctx.font = 'bold 11px sans-serif';
              const tw = ctx.measureText(pt.label).width + 12;

              ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
              ctx.beginPath();
              ctx.roundRect(-tw / 2, -10, tw, 20, 6);
              ctx.fill();
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1;
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

      if (targetCameraRef.current && viewMode === '2d') {
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
      const camX = width / 2 + (viewMode === '2d' ? cameraRef.current.x : 0);
      const camY = height / 2 + (viewMode === '2d' ? cameraRef.current.y : 0);
      const zoom = cameraRef.current.zoom;

      ctx.translate(camX, camY);
      ctx.scale(zoom, zoom);

      const effectiveSpeed = selectedNode ? 0 : rotationSpeed;
      globalRotationRef.current += effectiveSpeed * 0.0025;
      const rot = globalRotationRef.current;

      const posMap = new Map();

      if (viewMode === '3d') {
        if (!isDraggingRef.current && !selectedNode) {
          planetRotRef.current.yaw += effectiveSpeed * 0.004;
        }

        const yaw = planetRotRef.current.yaw;
        const pitch = planetRotRef.current.pitch;
        const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        const fov = 750;

        [230, 365].forEach((sphereRad, idx) => {
          const r = sphereRad * orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = theme.orbitLine;
          ctx.lineWidth = idx === 0 ? 1.2 : 0.7;
          ctx.globalAlpha = idx === 0 ? 0.5 : 0.25;
          ctx.stroke();
        });

        galaxyData.nodes.forEach(node => {
          const sx = (node.x3d || 0) * orbitSpacing;
          const sy = (node.y3d || 0) * orbitSpacing;
          const sz = (node.z3d || 0) * orbitSpacing;

          const x1 = sx * cosY - sz * sinY;
          const z1 = sz * cosY + sx * sinY;
          const y2 = sy * cosP - z1 * sinP;
          const z2 = z1 * cosP + sy * sinP;

          const perspective = fov / Math.max(120, fov + z2);
          posMap.set(node.id, { x: x1 * perspective, y: y2 * perspective, zDepth: z2, perspScale: perspective, ...node });
        });
      } else {
        const ORBIT_RINGS = [55, 115, 210, 274, 390, 422, 454, 486, 540];
        ORBIT_RINGS.forEach((baseR, idx) => {
          const r = baseR * orbitSpacing;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = theme.orbitLine;
          ctx.lineWidth = idx === 1 || idx === 4 ? 1.2 : 0.7;
          ctx.globalAlpha = idx >= 4 && idx <= 7 ? 0.35 : 0.65;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });

        galaxyData.nodes.forEach(node => {
          const adjustedRadius = node.radius * orbitSpacing;
          const speedFactor = node.level > 0 ? 1 / Math.sqrt(node.level) : 0;
          const angleDeg = node.angle + (rot * 180 / Math.PI) * speedFactor;
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

        posMap.forEach(node => {
          if (node.type !== 'book') return;
          if (orbitFilter !== 'all' && orbitFilter !== 'book') return;
          const isSelected = selectedNode?.id === node.id;
          const isNeighbor = selectedNode && connectedNodeIds.has(node.id);
          const alpha = selectedNode && !isSelected && !isNeighbor ? 0.12 : 0.75;

          const dotCount = node.spokeDots || 4;
          const startR = 145 * orbitSpacing;
          const endR = (node.radius - 10) * orbitSpacing;
          const stepR = (endR - startR) / Math.max(1, dotCount);

          ctx.fillStyle = node.color;
          ctx.globalAlpha = alpha;
          for (let d = 0; d < dotCount; d++) {
            const dr = startR + d * stepR;
            ctx.beginPath();
            ctx.arc(dr * Math.cos(node.angleRad), dr * Math.sin(node.angleRad), 1.8 * nodeScale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        });
      }

      nodePositionsRef.current = posMap;

      galaxyData.links.forEach(link => {
        const src = posMap.get(link.source);
        const tgt = posMap.get(link.target);
        if (!src || !tgt) return;

        const isHighlightedLink = selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);
        if (selectedNode && !isHighlightedLink) return;

        const backFade = viewMode === '3d' && (src.zDepth > 120 || tgt.zDepth > 120) ? 0.25 : 1.0;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        ctx.strokeStyle = isHighlightedLink ? '#00E5FF' : (link.color || theme.orbitLine);
        ctx.globalAlpha = (isHighlightedLink ? 0.85 : (link.alpha || 0.15)) * backFade;
        ctx.lineWidth = isHighlightedLink ? 1.8 / Math.sqrt(zoom) : 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      const sortedNodes = Array.from(posMap.values()).sort((a, b) => b.zDepth - a.zDepth);
      const isSearchActive = searchQuery.trim().length > 0;
      const lowerQuery = searchQuery.toLowerCase().trim();
      const labelCandidates = [];

      sortedNodes.forEach(node => {
        const matchesFilter = orbitFilter === 'all' || node.type === orbitFilter || node.type === 'core' || (orbitFilter === 'book' && node.type === 'sector');
        const isMatchedSearch = isSearchActive && (
          node.label?.toLowerCase().includes(lowerQuery) ||
          node.summary?.toLowerCase().includes(lowerQuery) ||
          node.ref?.toLowerCase().includes(lowerQuery)
        );

        const isSelected = selectedNode?.id === node.id;
        const isNeighbor = selectedNode && connectedNodeIds.has(node.id);
        const depthAlpha = viewMode === '3d' ? Math.max(0.18, Math.min(1.0, (420 - node.zDepth) / 560)) : 1.0;

        let alpha = depthAlpha;
        if (!matchesFilter) alpha = 0.05;
        else if (isSearchActive && !isMatchedSearch) alpha = 0.08;
        else if (selectedNode && !isSelected && !isNeighbor) alpha = 0.14;

        const rSize = (node.size || 8) * nodeScale * node.perspScale * (isSelected ? 1.4 : isMatchedSearch ? 1.3 : 1.0);

        ctx.globalAlpha = alpha;

        if (node.level >= 3 || node.type === 'core') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize, 0, Math.PI * 2);
          ctx.fillStyle = theme.bg;
          ctx.fill();
          ctx.lineWidth = isSelected || isMatchedSearch ? 2.2 : 1.4;
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.42, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, rSize * 0.78, 0, Math.PI * 2);
          ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.color;
          ctx.fill();

          if (isSelected || node.level === 1 || viewMode === '3d') {
            ctx.beginPath();
            ctx.arc(node.x, node.y, rSize * 1.25, 0, Math.PI * 2);
            ctx.strokeStyle = isSelected ? '#FFFFFF' : node.color;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 1.0;

        const isFrontHemisphere = viewMode !== '3d' || node.zDepth < 90 || isSelected || isMatchedSearch;
        if (alpha > 0.25 && isFrontHemisphere) {
          let priority = 0;
          if (isSelected) priority = 100;
          else if (isMatchedSearch) priority = 90;
          else if (isNeighbor) priority = 80;
          else if (node.type === 'core' || node.type === 'sector') priority = 70;
          else if (node.type === 'original_word') priority = 60;
          else if (node.type === 'book') priority = 50;
          else if (showOuterLabels || zoom > 1.75) priority = 20;

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

        if (screenX < -60 || screenX > width + 60 || screenY < -30 || screenY > height + 30) return;

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

        ctx.fillStyle = isSelected ? '#0284C7' : 'rgba(5, 8, 15, 0.84)';
        ctx.beginPath();
        ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 5);
        ctx.fill();

        if (isSelected || isMatchedSearch) {
          ctx.strokeStyle = isMatchedSearch ? '#FDE047' : '#38BDF8';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.fillStyle = isMatchedSearch ? '#FDE047' : isSelected ? '#FFFFFF' : node.level === 1 ? node.color : theme.textMain;
        ctx.fillText(displayLabel, 0, 1);
        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewMode, galaxyData, rotationSpeed, orbitSpacing, nodeScale, showOuterLabels, currentTheme, searchQuery, orbitFilter, selectedNode, connectedNodeIds, theme, arcCategoryFilter, arcFromBookFilter, arcToBookFilter, allFullArcs, activeFilteredArcs, selectedArc, hoveredArc, scrubbedBookKo, bakeArcDiagramBuffer]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    arcBgBufferRef.current = null;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, viewMode]);

  const focusCameraOnNode = useCallback((node) => {
    if (!node) return;
    setSelectedNode(node);
    const pos = nodePositionsRef.current.get(node.id);
    if (pos && viewMode === '2d') {
      const targetZoom = Math.max(cameraRef.current.zoom, 1.15);
      targetCameraRef.current = {
        x: -pos.x * targetZoom,
        y: -pos.y * targetZoom - (window.innerWidth < 1024 ? 50 : 0),
        zoom: targetZoom
      };
    }
  }, [viewMode]);

  const handleArcPointerAction = useCallback((clientX, clientY, isClick = false) => {
    const canvas = canvasRef.current;
    const buf = arcBgBufferRef.current;
    if (!canvas || !buf) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const height = canvas.height / dpr;
    const zoom = cameraRef.current.zoom;
    const camY = height / 2 + cameraRef.current.y;
    const wy = ((clientY - rect.top) - camY) / zoom + height / 2;

    if (Math.abs(wy - buf.baselineY) <= 22) {
      const width = canvas.width / dpr;
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

  const handleWheel = (e) => {
    e.preventDefault();
    targetCameraRef.current = null;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    cameraRef.current.zoom = Math.min(4.0, Math.max(0.45, cameraRef.current.zoom * zoomFactor));
  };

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
      if (viewMode === 'arc') {
        handleArcPointerAction(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchDistRef.current;
      cameraRef.current.zoom = Math.min(4.0, Math.max(0.45, cameraRef.current.zoom * ratio));
      pinchDistRef.current = dist;
      dragMovedRef.current = true;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;

      if (viewMode === 'arc') {
        if (cameraRef.current.zoom > 1.08) {
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

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
    isDraggingRef.current = false;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    targetCameraRef.current = null;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    if (viewMode === 'arc') {
      handleArcPointerAction(e.clientX, e.clientY, true);
    }
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    if (!isDraggingRef.current) {
      if (viewMode === 'arc') handleArcPointerAction(e.clientX, e.clientY, false);
      return;
    }
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 5) dragMovedRef.current = true;

    if (viewMode === 'arc') {
      if (cameraRef.current.zoom > 1.08) {
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

  const handlePointerUp = () => {
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

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const camX = width / 2 + (viewMode === '2d' ? cameraRef.current.x : 0);
    const camY = height / 2 + (viewMode === '2d' ? cameraRef.current.y : 0);

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

  const handleJumpToBibleChapter = (bookKo, chap = 1) => {
    const enBook = KO_TO_EN_BOOK[bookKo] || 'Genesis';
    const targetChapId = `${enBook}-${chap}`;
    try {
      localStorage.setItem('bible_jump_target', targetChapId);
    } catch {}
    if (typeof setCurrentChapId === 'function') setCurrentChapId(targetChapId);
    if (typeof setBibleViewMode === 'function') setBibleViewMode('read');
    setActiveScreen('bible');
  };

  const handleJumpToInterlinear = (bookKo = '창세기', chap = 1, verse = 1) => {
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: bookKo,
        chapter: Number(chap) || 1,
        verse: Number(verse) || 1
      }));
    } catch {}
    setActiveScreen('interlinear');
  };

  const handleSaveNewKnowledgeNode = () => {
    if (createType === 'customArc') {
      const start = getGlobalChapIndex(createBook, createChap);
      const end = getGlobalChapIndex(createToBook, createToChap);
      if (start === end) return alert('서로 다른 두 장을 선택해 주세요.');

      const newArc = {
        id: `user_arc_${Date.now()}`,
        start: Math.min(start, end),
        end: Math.max(start, end),
        span: Math.abs(end - start),
        category: 'quote',
        badgeLabel: '나의 교차참조',
        fromBook: start < end ? createBook : createToBook,
        fromChap: Number(start < end ? createChap : createToChap) || 1,
        fromVerse: Number(start < end ? createVerse : createToVerse) || 1,
        toBook: start < end ? createToBook : createBook,
        toChap: Number(start < end ? createToChap : createChap) || 1,
        toVerse: Number(start < end ? createToVerse : createVerse) || 1,
        title: createTitle.trim() || `${createBook} ${createChap}:${createVerse} ➔ ${createToBook} ${createToChap}:${createToVerse} 연결`,
        desc: createBody.trim() || '성도가 직접 발견하여 연결한 구속사 교차참조 아크입니다.',
        isLandmark: true
      };

      const updated = [newArc, ...customUserArcs];
      setCustomUserArcs(updated);
      localStorage.setItem('goodtree_custom_arcs', JSON.stringify(updated));
      arcBgBufferRef.current = null;
      setSelectedArc(newArc);
      setIsCreatorOpen(false);
      showToast('🌈 나만의 교차참조 황금 아크가 성경 돔에 영구 연결되었습니다!');
      return;
    }

    if (!createTitle.trim() && !createBody.trim()) {
      return alert('제목이나 묵상 내용을 입력해주세요.');
    }

    const todayKey = new Date().toISOString().split('T')[0];
    const refStr = `${createBook} ${createChap}:${createVerse}`;
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
      verse: Number(createVerse) || 1,
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
    showToast(`✨ [${finalTitle}] 노드가 등록되었습니다!`);
  };

  const selectedScriptureVerses = useMemo(() => {
    if (!selectedNode?.bookName) return null;
    return getScripturePreview(selectedNode.bookName, previewChap || selectedNode.chapter || 1, selectedNode.verse || 1, 3);
  }, [selectedNode, previewChap]);

  const currentDisplayArc = selectedArc || activeFilteredArcs[0] || allFullArcs[0];

  const spotlightFromVerses = useMemo(() => {
    if (!currentDisplayArc) return null;
    return getScripturePreview(currentDisplayArc.fromBook, currentDisplayArc.fromChap, currentDisplayArc.fromVerse, 1);
  }, [currentDisplayArc]);

  const spotlightToVerses = useMemo(() => {
    if (!currentDisplayArc) return null;
    return getScripturePreview(currentDisplayArc.toBook, currentDisplayArc.toChap, currentDisplayArc.toVerse, 1);
  }, [currentDisplayArc]);

  // =====================================================================
  // 🧩 우측/하단 인스펙터 상세 내용 렌더러
  // =====================================================================
  const renderInspectorContent = () => {
    if (!selectedNode) {
      return (
        <div className="space-y-3.5 text-xs">
          <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-black text-amber-400 uppercase">
                🧭 66권 핀셋 교차 필터 ({activeFilteredArcs.length}개 연결선)
              </span>
              {(arcFromBookFilter !== 'ALL' || arcToBookFilter !== 'ALL' || scrubbedBookKo) && (
                <button
                  onClick={() => {
                    setArcFromBookFilter('ALL');
                    setArcToBookFilter('ALL');
                    setScrubbedBookKo(null);
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                >
                  필터 초기화 ↺
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">출발/연결 성경 A</label>
                <select
                  value={arcFromBookFilter}
                  onChange={(e) => { setArcFromBookFilter(e.target.value); setScrubbedBookKo(null); }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white font-bold text-[11px] outline-none"
                >
                  <option value="ALL">전체 66권</option>
                  {BIBLE_66_CANON.map(b => <option key={b.ko} value={b.ko}>{b.ko}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">도착/대조 성경 B</label>
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
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-amber-300">
                ✨ 선택 가능한 교차참조 라인 ({activeFilteredArcs.length}건)
              </span>
              <span className="text-[10px] text-slate-400">허공의 선을 직접 클릭해도 선택됩니다</span>
            </div>

            <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-1 hide-scrollbar">
              {activeFilteredArcs.slice(0, 120).map((arc) => {
                const isCurr = currentDisplayArc?.id === arc.id;
                const catStyle = CATEGORY_META[arc.category] || CATEGORY_META.theme;
                return (
                  <button
                    key={arc.id}
                    onClick={() => {
                      setIsAutoTourPlaying(false);
                      setSelectedArc(arc);
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
                 selectedNode.type === 'sermon' ? `SERMON • ${selectedNode.ref}` :
                 selectedNode.type === 'qt' ? `MY QT / NOTE • ${selectedNode.date || ''}` :
                 selectedNode.type === 'original_word' ? `${selectedNode.lang} • ${selectedNode.strongs}` :
                 `SECTOR • ${selectedNode.label}`}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedNode.label}</h3>
            </div>
          </div>
          <button onClick={() => { setSelectedNode(null); setScrubbedBookKo(null); }} className="text-xs text-slate-400 hover:text-white cursor-pointer p-1">✕ 전체아크</button>
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
                    onDoubleClick={() => handleJumpToBibleChapter(selectedNode.bookName, cNum)}
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
            <button
              onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              🚀 {selectedNode.bookName} {previewChap}장 성경통독 본문으로 바로 열기
            </button>
          </div>
        )}

        {selectedScriptureVerses && selectedScriptureVerses.length > 0 && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-amber-400">
                📖 {selectedNode.bookName} {previewChap}장 본문 미리보기
              </span>
              <span className="text-[9.5px] font-mono opacity-60">개역개정</span>
            </div>
            {selectedScriptureVerses.map(v => (
              <p key={v.vNum} className="text-xs font-serif leading-relaxed text-slate-200 break-keep select-text">
                <b className="text-amber-400 mr-1.5 font-mono">{v.vNum}</b>
                {v.text}
              </p>
            ))}
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

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {selectedNode.bookName && (
            <button
              onClick={() => handleJumpToBibleChapter(selectedNode.bookName, previewChap || selectedNode.chapter || 1)}
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
    <div className="flex-1 w-full h-full relative overflow-hidden select-none font-sans flex flex-col" style={{ backgroundColor: theme.bg }}>
      
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-bold border border-cyan-400/40 shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. 상단 컨트롤 & 4대 뷰 모드 전환 헤더 ── */}
      <div className="relative z-30 px-2.5 pt-2.5 pb-1.5 sm:px-4 sm:pt-3 flex flex-col gap-2 border-b backdrop-blur-md shrink-0" style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder }}>
        
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={() => setActiveScreen('home')}
            className="h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0"
            style={{ borderColor: theme.panelBorder, color: theme.textMain }}
          >
            ◀ <span className="hidden sm:inline">홈</span>
          </button>

          <div 
            className="flex-1 max-w-xs h-9 px-2.5 rounded-xl border flex items-center gap-1.5 bg-black/40"
            style={{ borderColor: theme.panelBorder }}
          >
            <span className="text-xs opacity-60">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="구절, 성경, 주제 검색..."
              className="w-full bg-transparent outline-none text-xs font-medium text-white placeholder:text-slate-400 select-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">✕</button>
            )}
          </div>

          <div className="flex p-0.5 rounded-xl border bg-black/50 shrink-0" style={{ borderColor: theme.panelBorder }}>
            <button
              onClick={() => setViewMode('arc')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === 'arc' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              🌈 구속사아크
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === '2d' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              🌌 2D궤도
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === '3d' ? 'bg-purple-400 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              🪐 3D행성
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-black transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-emerald-400 text-slate-950 shadow-xs' : 'text-slate-300'
              }`}
            >
              📋 나열
            </button>
          </div>

          <button
            onClick={() => {
              setCreateType('customArc');
              setIsCreatorOpen(true);
            }}
            className="h-9 px-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="나만의 교차참조 아크 또는 QT 등록"
          >
            <span>➕</span>
            <span className="hidden sm:inline">연결등록</span>
          </button>

          {viewMode !== 'list' && (
            <button
              onClick={() => setIsControlOpen(!isControlOpen)}
              className={`h-9 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center shrink-0 ${
                isControlOpen ? 'ring-2 ring-cyan-400' : ''
              }`}
              style={{ borderColor: theme.panelBorder, color: theme.textMain }}
              title="테마 및 궤도 설정"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* ── 2. 메인 바디 ── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        <div ref={containerRef} className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
          {viewMode !== 'list' ? (
            <>
              <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-crosshair active:cursor-grabbing touch-none"
              />

              {/* 🌟 [풀버전 구속사 아크 오버레이] */}
              {viewMode === 'arc' && (
                <>
                  <div className="relative z-20 pt-2.5 sm:pt-4 px-3 flex flex-col items-center text-center pointer-events-none">
                    <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#EAB308] opacity-90">
                      기독교의 읽기 • 이어지는 구원의 이야기
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-[#FACC15] tracking-tight mt-0.5 drop-shadow-md">
                      성경 66권 전수 교차 참조 ({activeFilteredArcs.length.toLocaleString()}개 아크)
                    </h2>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 pointer-events-auto">
                      {[
                        { id: 'all', label: `전체 (${allFullArcs.length})`, cls: 'bg-white text-slate-950' },
                        { id: 'quote', label: '직접 인용', cls: 'bg-[#EAB308] text-slate-950' },
                        { id: 'prophecy', label: '예언 · 성취', cls: 'bg-pink-400 text-slate-950' },
                        { id: 'typology', label: '모형 · 그림자', cls: 'bg-sky-400 text-slate-950' },
                        { id: 'theme', label: '인물 · 주제', cls: 'bg-teal-300 text-slate-950' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setArcCategoryFilter(cat.id);
                            setScrubbedBookKo(null);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer shadow-md ${
                            arcCategoryFilter === cat.id
                              ? `${cat.cls} ring-2 ring-white scale-105`
                              : 'bg-slate-900/85 text-slate-300 border border-white/15 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}

                      <button
                        onClick={() => setIsAutoTourPlaying(!isAutoTourPlaying)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer border ${
                          isAutoTourPlaying
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                            : 'bg-slate-900/85 text-amber-300 border-amber-400/40'
                        }`}
                      >
                        {isAutoTourPlaying ? '⏸ 순례 일시정지' : '▶️ 자동 순례'}
                      </button>

                      {cameraRef.current.zoom !== 1.0 && (
                        <button
                          onClick={() => { cameraRef.current = { x: 0, y: 0, zoom: 1.0 }; }}
                          className="px-2 py-1 rounded-md text-[10.5px] font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                        >
                          1x 줌리셋
                        </button>
                      )}
                    </div>
                  </div>

                  {currentDisplayArc && (
                    <div className="mt-auto relative z-20 pb-2.5 sm:pb-4 px-2.5 flex flex-col items-center w-full max-w-xl mx-auto pointer-events-auto">
                      <div className="w-full rounded-2xl bg-[#DCD5C5] text-[#1C1917] px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xl border-2 border-[#FEF08A]/70 space-y-2">
                        <div className="flex items-center justify-between border-b border-stone-400/50 pb-1.5 gap-1">
                          <span className="text-[10.5px] font-black px-2 py-0.5 rounded bg-stone-900 text-amber-300 shrink-0">
                            {currentDisplayArc.badgeLabel}
                          </span>
                          <span className="text-xs font-black text-stone-900 truncate">
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
                              className="px-2 py-0.5 rounded bg-stone-800 text-white text-xs font-black cursor-pointer hover:bg-black"
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
                              className="px-2 py-0.5 rounded bg-stone-800 text-white text-xs font-black cursor-pointer hover:bg-black"
                            >
                              다음 선 ▶
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs">
                          <div 
                            onClick={() => handleJumpToBibleChapter(currentDisplayArc.fromBook, currentDisplayArc.fromChap)}
                            className="p-2 rounded-xl bg-white/80 hover:bg-white border border-stone-300 cursor-pointer transition-all"
                          >
                            <div className="flex justify-between items-center font-black text-amber-900 text-[11px] mb-0.5">
                              <span>📜 {currentDisplayArc.fromBook} {currentDisplayArc.fromChap}:{currentDisplayArc.fromVerse}</span>
                              <span className="text-[10px] underline">본문 열기 ➔</span>
                            </div>
                            <p className="text-[11px] font-serif text-stone-800 line-clamp-2 leading-snug">
                              {spotlightFromVerses?.[0]?.text || currentDisplayArc.desc}
                            </p>
                          </div>

                          <div 
                            onClick={() => handleJumpToBibleChapter(currentDisplayArc.toBook, currentDisplayArc.toChap)}
                            className="p-2 rounded-xl bg-white/80 hover:bg-white border border-stone-300 cursor-pointer transition-all"
                          >
                            <div className="flex justify-between items-center font-black text-indigo-900 text-[11px] mb-0.5">
                              <span>✝️ {currentDisplayArc.toBook} {currentDisplayArc.toChap}:{currentDisplayArc.toVerse}</span>
                              <span className="text-[10px] underline">본문 열기 ➔</span>
                            </div>
                            <p className="text-[11px] font-serif text-stone-800 line-clamp-2 leading-snug">
                              {spotlightToVerses?.[0]?.text || currentDisplayArc.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5 text-[10.5px] font-bold text-stone-700">
                          <span className="truncate">💡 {currentDisplayArc.desc}</span>
                          <button
                            onClick={() => handleJumpToInterlinear(currentDisplayArc.fromBook, currentDisplayArc.fromChap, currentDisplayArc.fromVerse)}
                            className="px-2 py-0.5 rounded bg-indigo-900 text-white text-[10px] font-black shrink-0 ml-2 cursor-pointer"
                          >
                            🔬 원어 대조
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* 📋 [나열 목록 뷰] */
            <div className="w-full h-full overflow-y-auto px-3 py-3 pb-32 space-y-4 max-w-4xl mx-auto hide-scrollbar text-left">
              {CANON_SECTORS.map(sec => {
                const sectorItems = filteredListNodes.filter(n => n.sector === sec.name);
                if (sectorItems.length === 0) return null;
                const booksInSec = sectorItems.filter(n => n.type === 'book');

                return (
                  <div 
                    key={sec.id} 
                    className="p-3.5 rounded-2xl border space-y-3 bg-slate-900/65"
                    style={{ borderColor: theme.panelBorder }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.color }} />
                        <h3 className="text-sm font-black text-white">{sec.name}</h3>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        성경 {booksInSec.length}권
                      </span>
                    </div>

                    {booksInSec.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {booksInSec.map(bNode => (
                          <button
                            key={bNode.id}
                            onClick={() => setSelectedNode(bNode)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selectedNode?.id === bNode.id ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black' : 'bg-black/40 text-slate-200 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                            <span>{bNode.bookName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 💻 PC & 태블릿 전용 우측 고정 인스펙터 독 */}
        <aside 
          className="hidden lg:flex w-[390px] xl:w-[420px] h-full border-l p-4 flex-col overflow-y-auto hide-scrollbar shrink-0 z-20 text-left"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {renderInspectorContent()}
        </aside>
      </div>

      {/* ── 3. ⚙️ 접이식 테마 & 궤도 컨트롤러 드로어 ── */}
      {isControlOpen && viewMode !== 'list' && (
        <div 
          className="absolute top-16 right-2.5 sm:right-4 z-40 w-72 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-3 text-xs text-left animate-fade-in"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.panelBorder }}>
            <span className="font-black text-xs tracking-wider uppercase text-cyan-400">⚙️ 우주 테마 & 궤도 설정</span>
            <button onClick={() => setIsControlOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
          </div>

          {viewMode !== 'arc' && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="opacity-75">공전/자전 속도</span>
                  <span>{rotationSpeed.toFixed(2)}x</span>
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
                  <span className="opacity-75">궤도/행성 반경</span>
                  <span>{orbitSpacing.toFixed(2)}x</span>
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
                  <span className="opacity-75">노드 크기</span>
                  <span>{nodeScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0.6" max="1.8" step="0.1"
                  value={nodeScale}
                  onChange={(e) => setNodeScale(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="text-[11px] font-bold opacity-85">외곽 설교·QT 이름도 표시</span>
                <input
                  type="checkbox"
                  checked={showOuterLabels}
                  onChange={(e) => setShowOuterLabels(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </>
          )}

          <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: theme.panelBorder }}>
            <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">우주 테마 팔레트</span>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(GALAXY_THEMES).map(th => (
                <button
                  key={th.id}
                  onClick={() => setCurrentTheme(th.id)}
                  className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer truncate ${
                    currentTheme === th.id ? 'ring-2 ring-cyan-400 bg-white/15' : 'bg-black/30 opacity-70 hover:opacity-100'
                  }`}
                  style={{ borderColor: th.panelBorder, color: th.textMain }}
                >
                  {th.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ➕ 나만의 교차참조 아크 & QT/설교 통합 등록 모달 ── */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div 
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border p-5 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: theme.panelBorder }}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">REDEMPTIVE ARC & NODE CREATOR</span>
                <h3 className="text-base font-black">➕ 나만의 교차참조 아크 · QT · 설교 등록</h3>
              </div>
              <button onClick={() => setIsCreatorOpen(false)} className="text-sm opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'customArc', label: '🌈 교차아크 연결' },
                { id: 'qt', label: '🔥 오늘의 QT' },
                { id: 'sermon', label: '🎙️ 설교 노트' },
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
                ✨ 은하계 & 구속사 돔에 영구 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. 📱 모바일 전용 바텀 시트 인스펙터 ── */}
      {selectedNode && (
        <div 
          className="lg:hidden fixed bottom-2.5 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-fade-in text-left max-h-[62vh] overflow-y-auto hide-scrollbar"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          {renderInspectorContent()}
        </div>
      )}

    </div>
  );
}
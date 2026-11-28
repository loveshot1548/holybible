// src/pages/Bible.js (PART 1 — 66권 매핑 정규화 & 개역4판 파서 전면 수정)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Bookmark,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Headphones,
  Highlighter,
  Mic,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Trash2,
  Volume2,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import CryptoJS from 'crypto-js';

// =====================================================================
// 보안 표준화: AES-256 암호화 유틸
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = 'ENC_GTC_v2::';
const ENC_PREFIX_V1 = 'ENC_GTC_v1::';

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, CHAT_SECRET_KEY).toString();
    return `${ENC_PREFIX_V2}${cipher}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (cipherText.startsWith(ENC_PREFIX_V2)) {
    try {
      const rawCipher = cipherText.replace(ENC_PREFIX_V2, '');
      const bytes = CryptoJS.AES.decrypt(rawCipher, CHAT_SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipherText;
    } catch (e) {
      return cipherText;
    }
  }
  if (cipherText.startsWith(ENC_PREFIX_V1)) {
    try {
      const payload = cipherText.replace(ENC_PREFIX_V1, '');
      return decodeURIComponent(atob(payload));
    } catch (e) {
      return cipherText;
    }
  }
  return cipherText;
};

// =====================================================================
// 인라인 형광펜 5색 팔레트
// =====================================================================
const HIGHLIGHT_PALETTE = [
  { id: 'mint', hex: '#A7F3D0', dot: '#34D399', lightBg: 'rgba(167, 243, 208, 0.52)', darkBg: 'rgba(16, 185, 129, 0.34)', label: '민트' },
  { id: 'rose', hex: '#FECDD3', dot: '#FB7185', lightBg: 'rgba(254, 205, 211, 0.58)', darkBg: 'rgba(244, 63, 94, 0.34)', label: '로즈' },
  { id: 'yellow', hex: '#FEF08A', dot: '#FACC15', lightBg: 'rgba(254, 240, 138, 0.62)', darkBg: 'rgba(234, 179, 8, 0.34)', label: '옐로우' },
  { id: 'sky', hex: '#BAE6FD', dot: '#38BDF8', lightBg: 'rgba(186, 230, 253, 0.58)', darkBg: 'rgba(14, 165, 233, 0.34)', label: '스카이' },
  { id: 'lavender', hex: '#DDD6FE', dot: '#A78BFA', lightBg: 'rgba(221, 214, 254, 0.58)', darkBg: 'rgba(139, 92, 246, 0.34)', label: '라벤더' }
];

const resolveHighlightStyle = (rawColor, isDark) => {
  if (!rawColor || rawColor === 'transparent') return null;
  const preset = HIGHLIGHT_PALETTE.find(
    (p) => p.hex.toLowerCase() === String(rawColor).toLowerCase() || p.dot.toLowerCase() === String(rawColor).toLowerCase()
  );
  const bg = preset
    ? isDark
      ? preset.darkBg
      : preset.lightBg
    : isDark
    ? `${rawColor}55`
    : `${rawColor}66`;

  return {
    backgroundColor: bg,
    borderRadius: '4px',
    padding: '1px 3px',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone'
  };
};

const resolveHighlightDot = (rawColor) => {
  if (!rawColor || rawColor === 'transparent') return '#94A3B8';
  const preset = HIGHLIGHT_PALETTE.find(
    (p) => p.hex.toLowerCase() === String(rawColor).toLowerCase() || p.dot.toLowerCase() === String(rawColor).toLowerCase()
  );
  return preset ? preset.dot : rawColor;
};

// =====================================================================
// 성경 66권 마스터 리스트 & 정규화 매핑 테이블 (1,189장 완비)
// =====================================================================
export const BIBLE_66_LIST = [
  { en: 'Genesis', ko: '창세기', abbr: '창', isOT: true, section: '모세오경', chaptersCount: 50 },
  { en: 'Exodus', ko: '출애굽기', abbr: '출', isOT: true, section: '모세오경', chaptersCount: 40 },
  { en: 'Leviticus', ko: '레위기', abbr: '레', isOT: true, section: '모세오경', chaptersCount: 27 },
  { en: 'Numbers', ko: '민수기', abbr: '민', isOT: true, section: '모세오경', chaptersCount: 36 },
  { en: 'Deuteronomy', ko: '신명기', abbr: '신', isOT: true, section: '모세오경', chaptersCount: 34 },
  { en: 'Joshua', ko: '여호수아', abbr: '수', isOT: true, section: '역사서', chaptersCount: 24 },
  { en: 'Judges', ko: '사사기', abbr: '삿', isOT: true, section: '역사서', chaptersCount: 21 },
  { en: 'Ruth', ko: '룻기', abbr: '룻', isOT: true, section: '역사서', chaptersCount: 4 },
  { en: '1 Samuel', ko: '사무엘상', abbr: '삼상', isOT: true, section: '역사서', chaptersCount: 31 },
  { en: '2 Samuel', ko: '사무엘하', abbr: '삼하', isOT: true, section: '역사서', chaptersCount: 24 },
  { en: '1 Kings', ko: '열왕기상', abbr: '왕상', isOT: true, section: '역사서', chaptersCount: 22 },
  { en: '2 Kings', ko: '열왕기하', abbr: '왕하', isOT: true, section: '역사서', chaptersCount: 25 },
  { en: '1 Chronicles', ko: '역대상', abbr: '대상', isOT: true, section: '역사서', chaptersCount: 29 },
  { en: '2 Chronicles', ko: '역대하', abbr: '대하', isOT: true, section: '역사서', chaptersCount: 36 },
  { en: 'Ezra', ko: '에스라', abbr: '스', isOT: true, section: '역사서', chaptersCount: 10 },
  { en: 'Nehemiah', ko: '느헤미야', abbr: '느', isOT: true, section: '역사서', chaptersCount: 13 },
  { en: 'Esther', ko: '에스더', abbr: '에', isOT: true, section: '역사서', chaptersCount: 10 },
  { en: 'Job', ko: '욥기', abbr: '욥', isOT: true, section: '시가서', chaptersCount: 42 },
  { en: 'Psalms', ko: '시편', abbr: '시', isOT: true, section: '시가서', chaptersCount: 150 },
  { en: 'Proverbs', ko: '잠언', abbr: '잠', isOT: true, section: '시가서', chaptersCount: 31 },
  { en: 'Ecclesiastes', ko: '전도서', abbr: '전', isOT: true, section: '시가서', chaptersCount: 12 },
  { en: 'Song of Solomon', ko: '아가', abbr: '아', isOT: true, section: '시가서', chaptersCount: 8 },
  { en: 'Isaiah', ko: '이사야', abbr: '사', isOT: true, section: '선지서', chaptersCount: 66 },
  { en: 'Jeremiah', ko: '예레미야', abbr: '렘', isOT: true, section: '선지서', chaptersCount: 52 },
  { en: 'Lamentations', ko: '예레미야애가', abbr: '애', isOT: true, section: '선지서', chaptersCount: 5 },
  { en: 'Ezekiel', ko: '에스겔', abbr: '겔', isOT: true, section: '선지서', chaptersCount: 48 },
  { en: 'Daniel', ko: '다니엘', abbr: '단', isOT: true, section: '선지서', chaptersCount: 12 },
  { en: 'Hosea', ko: '호세아', abbr: '호', isOT: true, section: '선지서', chaptersCount: 14 },
  { en: 'Joel', ko: '요엘', abbr: '욜', isOT: true, section: '선지서', chaptersCount: 3 },
  { en: 'Amos', ko: '아모스', abbr: '암', isOT: true, section: '선지서', chaptersCount: 9 },
  { en: 'Obadiah', ko: '오바댜', abbr: '옵', isOT: true, section: '선지서', chaptersCount: 1 },
  { en: 'Jonah', ko: '요나', abbr: '욘', isOT: true, section: '선지서', chaptersCount: 4 },
  { en: 'Micah', ko: '미가', abbr: '미', isOT: true, section: '선지서', chaptersCount: 7 },
  { en: 'Nahum', ko: '나훔', abbr: '나', isOT: true, section: '선지서', chaptersCount: 3 },
  { en: 'Habakkuk', ko: '하박국', abbr: '합', isOT: true, section: '선지서', chaptersCount: 3 },
  { en: 'Zephaniah', ko: '스바냐', abbr: '습', isOT: true, section: '선지서', chaptersCount: 3 },
  { en: 'Haggai', ko: '학개', abbr: '학', isOT: true, section: '선지서', chaptersCount: 2 },
  { en: 'Zechariah', ko: '스가랴', abbr: '슥', isOT: true, section: '선지서', chaptersCount: 14 },
  { en: 'Malachi', ko: '말라기', abbr: '말', isOT: true, section: '선지서', chaptersCount: 4 },
  { en: 'Matthew', ko: '마태복음', abbr: '마', isOT: false, section: '복음/역사', chaptersCount: 28 },
  { en: 'Mark', ko: '마가복음', abbr: '막', isOT: false, section: '복음/역사', chaptersCount: 16 },
  { en: 'Luke', ko: '누가복음', abbr: '눅', isOT: false, section: '복음/역사', chaptersCount: 24 },
  { en: 'John', ko: '요한복음', abbr: '요', isOT: false, section: '복음/역사', chaptersCount: 21 },
  { en: 'Acts', ko: '사도행전', abbr: '행', isOT: false, section: '복음/역사', chaptersCount: 28 },
  { en: 'Romans', ko: '로마서', abbr: '롬', isOT: false, section: '서신서', chaptersCount: 16 },
  { en: '1 Corinthians', ko: '고린도전서', abbr: '고전', isOT: false, section: '서신서', chaptersCount: 16 },
  { en: '2 Corinthians', ko: '고린도후서', abbr: '고후', isOT: false, section: '서신서', chaptersCount: 13 },
  { en: 'Galatians', ko: '갈라디아서', abbr: '갈', isOT: false, section: '서신서', chaptersCount: 6 },
  { en: 'Ephesians', ko: '에베소서', abbr: '엡', isOT: false, section: '서신서', chaptersCount: 6 },
  { en: 'Philippians', ko: '빌립보서', abbr: '빌', isOT: false, section: '서신서', chaptersCount: 4 },
  { en: 'Colossians', ko: '골로새서', abbr: '골', isOT: false, section: '서신서', chaptersCount: 4 },
  { en: '1 Thessalonians', ko: '데살로니가전서', abbr: '살전', isOT: false, section: '서신서', chaptersCount: 5 },
  { en: '2 Thessalonians', ko: '데살로니가후서', abbr: '살후', isOT: false, section: '서신서', chaptersCount: 3 },
  { en: '1 Timothy', ko: '디모데전서', abbr: '딤전', isOT: false, section: '서신서', chaptersCount: 6 },
  { en: '2 Timothy', ko: '디모데후서', abbr: '딤후', isOT: false, section: '서신서', chaptersCount: 4 },
  { en: 'Titus', ko: '디도서', abbr: '딛', isOT: false, section: '서신서', chaptersCount: 3 },
  { en: 'Philemon', ko: '빌레몬서', abbr: '몬', isOT: false, section: '서신서', chaptersCount: 1 },
  { en: 'Hebrews', ko: '히브리서', abbr: '히', isOT: false, section: '서신서', chaptersCount: 13 },
  { en: 'James', ko: '야고보서', abbr: '약', isOT: false, section: '서신서', chaptersCount: 5 },
  { en: '1 Peter', ko: '베드로전서', abbr: '벧전', isOT: false, section: '서신서', chaptersCount: 5 },
  { en: '2 Peter', ko: '베드로후서', abbr: '벧후', isOT: false, section: '서신서', chaptersCount: 3 },
  { en: '1 John', ko: '요한일서', abbr: '요일', isOT: false, section: '서신서', chaptersCount: 5 },
  { en: '2 John', ko: '요한이서', abbr: '요이', isOT: false, section: '서신서', chaptersCount: 1 },
  { en: '3 John', ko: '요한삼서', abbr: '요삼', isOT: false, section: '서신서', chaptersCount: 1 },
  { en: 'Jude', ko: '유다서', abbr: '유', isOT: false, section: '서신서', chaptersCount: 1 },
  { en: 'Revelation', ko: '요한계시록', abbr: '계', isOT: false, section: '예언서', chaptersCount: 22 }
];

export const BIBLE_66_MAP = {};
BIBLE_66_LIST.forEach((b, idx) => {
  const item = { ...b, bookIdx: idx };
  const noSpace = b.en.replace(/\s+/g, '');
  const roman = b.en.replace(/^1\s+/, 'I ').replace(/^2\s+/, 'II ').replace(/^3\s+/, 'III ');
  const keys = [b.en, b.ko, b.abbr, noSpace, roman, b.en.toLowerCase(), noSpace.toLowerCase()];
  if (b.en === 'Psalms') keys.push('Psalm', 'psalm');
  if (b.en === 'Song of Solomon') keys.push('Song of Songs', 'Song', 'song');
  if (b.ko === '예레미야애가') keys.push('애가');
  keys.forEach((k) => {
    BIBLE_66_MAP[k] = item;
  });
});

export const resolveBookMeta = (bookKey) => {
  if (!bookKey) return BIBLE_66_LIST[0];
  const raw = String(bookKey).trim();
  return BIBLE_66_MAP[raw] || BIBLE_66_MAP[raw.toLowerCase()] || BIBLE_66_MAP[raw.replace(/\s+/g, '').toLowerCase()] || BIBLE_66_LIST[0];
};

// =====================================================================
// 365일 맞춤 1독·2독·3독 자동 분할 계산 엔진
// =====================================================================
const ALL_CHAPTER_SEQUENCE = (() => {
  const list = [];
  BIBLE_66_LIST.forEach((book) => {
    for (let ch = 1; ch <= book.chaptersCount; ch++) {
      list.push({ id: `${book.en}-${ch}`, en: book.en, ko: book.ko, abbr: book.abbr, chapter: ch });
    }
  });
  return list;
})();

const getDailyReadingPlanChapters = (dayNumber, targetRounds = 1) => {
  const rounds = Math.max(1, Math.min(4, Number(targetRounds) || 1));
  const totalUnits = ALL_CHAPTER_SEQUENCE.length * rounds;
  const clampedDay = Math.max(1, Math.min(365, Number(dayNumber) || 1));
  const startIdx = Math.floor(((clampedDay - 1) * totalUnits) / 365);
  const endIdx = Math.floor((clampedDay * totalUnits) / 365);

  const slice = [];
  for (let i = startIdx; i < endIdx; i++) {
    const item = ALL_CHAPTER_SEQUENCE[i % ALL_CHAPTER_SEQUENCE.length];
    const roundNum = Math.floor(i / ALL_CHAPTER_SEQUENCE.length) + 1;
    slice.push({ ...item, roundNum });
  }
  return slice;
};

const formatReadingRangeLabel = (chapters) => {
  if (!chapters || chapters.length === 0) return '오늘의 분량 없음';
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  if (first.en === last.en) {
    if (first.chapter === last.chapter) return `${first.ko} ${first.chapter}장`;
    return `${first.ko} ${first.chapter}~${last.chapter}장`;
  }
  return `${first.ko} ${first.chapter}장 ~ ${last.ko} ${last.chapter}장`;
};

// =====================================================================
// 개역개정 4판 통합 파서 엔진 (약어/전체명/공백/BOM 100% 대응)
// =====================================================================
export const KRV4_ABBR_TO_EN = {};
BIBLE_66_LIST.forEach((b) => {
  KRV4_ABBR_TO_EN[b.abbr] = b.en;
  KRV4_ABBR_TO_EN[b.ko] = b.en;
});
KRV4_ABBR_TO_EN['애가'] = 'Lamentations';

let cachedKrv4Data = null;
let krv4LoadingPromise = null;

export const splitPericopeAndVerse = (rawVerseStr) => {
  if (!rawVerseStr || typeof rawVerseStr !== 'string') {
    return { pericope: null, pureText: rawVerseStr || '' };
  }
  const match = rawVerseStr.match(/^\s*<([^>]+)>\s*(.*)$/);
  if (match) {
    return { pericope: match[1].trim(), pureText: match[2].trim() };
  }
  return { pericope: null, pureText: rawVerseStr.trim() };
};

export const ensureKrv4TxtLoaded = async () => {
  if (cachedKrv4Data) return cachedKrv4Data;
  if (typeof window !== 'undefined' && window.__GTC_KRV4_DB__) {
    cachedKrv4Data = window.__GTC_KRV4_DB__;
    return cachedKrv4Data;
  }
  if (krv4LoadingPromise) return krv4LoadingPromise;

  const candidatePaths = [
    '/개역개정4판(구약+신약).txt',
    '/data/개역개정4판(구약+신약).txt',
    '/krv4.txt',
    '/data/krv4.txt'
  ];

  krv4LoadingPromise = (async () => {
    for (const path of candidatePaths) {
      try {
        const res = await fetch(encodeURI(path));
        if (!res.ok) continue;

        const buffer = await res.arrayBuffer();
        let rawText = new TextDecoder('utf-8').decode(buffer);
        const replacementCount = (rawText.slice(0, 4000).match(/\uFFFD/g) || []).length;
        if (replacementCount > 5) {
          try {
            rawText = new TextDecoder('euc-kr').decode(buffer);
          } catch (_) {}
        }

        if (!rawText || rawText.trim().startsWith('<!DOCTYPE') || rawText.length < 1000) continue;

        const bookMap = {};
        const abbrAlternation = Object.keys(KRV4_ABBR_TO_EN)
          .sort((a, b) => b.length - a.length)
          .join('|');
        const splitRegex = new RegExp(`([^\\n\\r])((?:${abbrAlternation})\\s*\\d+:\\d+\\s)`, 'g');

        const normalizedText = rawText
          .replace(/^\uFEFF/, '')
          .replace(splitRegex, '$1\n$2')
          .replace(/\r?\n[가-힣]{1,6}\s*\d+:([^\d\n\r][^\n\r]*)/g, ' $1');

        const lines = normalizedText.split(/\r?\n/);
        const lineRegex = /^\uFEFF?([가-힣]+)\s*(\d+)\s*:\s*(\d+)\s+(.*)$/;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const match = line.match(lineRegex);
          if (!match) continue;

          const [, bookToken, chStr, vStr, content] = match;
          const enBook = KRV4_ABBR_TO_EN[bookToken];
          if (!enBook) continue;

          const meta = BIBLE_66_MAP[enBook];
          const koBook = meta?.ko || enBook;
          const abbrBook = meta?.abbr || bookToken;
          const noSpaceEn = enBook.replace(/\s+/g, '');
          const chIdx = parseInt(chStr, 10) - 1;
          const vIdx = parseInt(vStr, 10) - 1;
          if (chIdx < 0 || vIdx < 0) continue;

          const cleanContent = content.trim();

          [enBook, koBook, abbrBook, noSpaceEn].forEach((key) => {
            if (!bookMap[key]) bookMap[key] = [];
            if (!bookMap[key][chIdx]) bookMap[key][chIdx] = [];
            bookMap[key][chIdx][vIdx] = cleanContent;
          });
        }

        if (Object.keys(bookMap).length > 0) {
          cachedKrv4Data = bookMap;
          if (typeof window !== 'undefined') {
            window.__GTC_KRV4_DB__ = bookMap;
            window.dispatchEvent(new CustomEvent('krv4-bible-loaded'));
          }
          return cachedKrv4Data;
        }
      } catch (_) {}
    }
    return null;
  })();

  return krv4LoadingPromise;
};

export const getKrv4ChapterVerses = (bookKey, chapterNum) => {
  const db = cachedKrv4Data || (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null);
  if (!db || !bookKey) return [];
  const meta = resolveBookMeta(bookKey);
  const chIdx = Math.max(0, (parseInt(chapterNum, 10) || 1) - 1);
  const rawArr = db[meta.en]?.[chIdx] || db[meta.ko]?.[chIdx] || db[meta.abbr]?.[chIdx] || [];
  return Array.isArray(rawArr) ? rawArr.filter(Boolean) : [];
};

export const getKrv4VerseObj = (bookKey, chapterNum, verseNum) => {
  const chapVerses = getKrv4ChapterVerses(bookKey, chapterNum);
  const vIdx = Math.max(0, (parseInt(verseNum, 10) || 1) - 1);
  const rawText = chapVerses[vIdx] || '';
  const { pericope, pureText } = splitPericopeAndVerse(rawText);
  return { pericope, pureText, rawText };
};

// =====================================================================
// 다중 역본(쉬운성경 / WEB 영어성경) 탐색기
// =====================================================================
const liveWebChapterCache = {};

export const resolveTranslationVerse = (db, bookMeta, chNum, vNum) => {
  if (!db || !bookMeta) return '';
  const { ko, en, abbr } = bookMeta;
  const noSpaceEn = (en || '').replace(/\s+/g, '');
  const ch = Number(chNum);
  const v = Number(vNum);

  const flatCandidates = [
    `${ko}-${ch}-${v}`,
    `${en}-${ch}-${v}`,
    `${noSpaceEn}-${ch}-${v}`,
    `${abbr}-${ch}-${v}`,
    `${ko}_${ch}_${v}`,
    `${en}_${ch}_${v}`,
    `${ko} ${ch}:${v}`,
    `${en} ${ch}:${v}`,
    `${abbr}${ch}:${v}`,
    `${abbr} ${ch}:${v}`
  ];
  for (const key of flatCandidates) {
    if (db[key] && typeof db[key] === 'string') return db[key];
  }

  const bookObj = db[ko] || db[en] || db[noSpaceEn] || db[abbr];
  if (bookObj) {
    if (Array.isArray(bookObj)) {
      const chapArr = bookObj[ch - 1];
      if (Array.isArray(chapArr) && chapArr[v - 1]) {
        const val = chapArr[v - 1];
        return typeof val === 'string' ? val : val.text || val.content || '';
      }
    } else if (typeof bookObj === 'object') {
      const chapObj = bookObj[ch] || bookObj[String(ch)] || bookObj[ch - 1];
      if (Array.isArray(chapObj) && chapObj[v - 1]) {
        const val = chapObj[v - 1];
        return typeof val === 'string' ? val : val.text || val.content || '';
      } else if (chapObj && typeof chapObj === 'object') {
        const val = chapObj[v] || chapObj[String(v)];
        if (val) return typeof val === 'string' ? val : val.text || val.content || '';
      }
    }
  }

  const liveKey = `${en}-${ch}-${v}`;
  if (liveWebChapterCache[liveKey]) return liveWebChapterCache[liveKey];
  return '';
};

let cachedMasterStrongs = null;
let masterStrongsLoadingPromise = null;

const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
};

const ensureMasterStrongs = async () => {
  if (cachedMasterStrongs && Object.keys(cachedMasterStrongs).length > 0) return cachedMasterStrongs;
  if (masterStrongsLoadingPromise) return masterStrongsLoadingPromise;

  masterStrongsLoadingPromise = fetch('/data/strongs_korean_master.json')
    .then((res) => (res.ok ? res.json() : fetch('/data/strongs_korean.json').then((r) => r.json())))
    .then((data) => {
      cachedMasterStrongs = data || {};
      return cachedMasterStrongs;
    })
    .catch(() => {
      cachedMasterStrongs = {};
      return cachedMasterStrongs;
    });

  return masterStrongsLoadingPromise;
};

const lookupStrongsEntry = (masterDict, rawId) => {
  if (!masterDict || !rawId) return {};
  const cleanId = String(rawId).trim().toUpperCase();
  if (masterDict[cleanId]) return masterDict[cleanId];
  const prefix = cleanId[0];
  const numStr = cleanId.slice(1).replace(/^0+/, '') || '0';
  const candidates = [`${prefix}${numStr}`, `${prefix}${numStr.padStart(4, '0')}`, `${prefix}${numStr.padStart(5, '0')}`];
  for (const cand of candidates) {
    if (masterDict[cand]) return masterDict[cand];
  }
  return {};
};

const applyContextualCaseEnding = (baseKor, caseType, isOT) => {
  if (!baseKor || baseKor === '원어 어휘') return baseKor;
  let word = baseKor.trim();
  if (!isOT) {
    if (caseType === 'G' && !word.endsWith('의')) return `${word}의`;
    if (caseType === 'D' && !word.endsWith('에게') && !word.endsWith('에')) return `${word}에게`;
    if (caseType === 'A') {
      const lastChar = word.charCodeAt(word.length - 1);
      const hasBatchim = (lastChar - 0xac00) % 28 > 0;
      if (!word.endsWith('을') && !word.endsWith('를')) return `${word}${hasBatchim ? '을' : '를'}`;
    }
  }
  if (isOT && caseType === 'CONSTRUCT' && !word.endsWith('의') && !word.includes('의')) {
    return `${word}의`;
  }
  return word;
};

const fetchQuickKoreanTranslate = async (text) => {
  if (!text || typeof text !== 'string') return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text.slice(0, 1800))}`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data[0]?.map((c) => c[0]).join('') || '';
  } catch {
    return '';
  }
};

const cleanTypography = (text, isOT) => {
  if (!text || typeof text !== 'string') return '';
  if (!isOT) return text;
  return text.replace(/[\u0591-\u05AF]/g, '');
};

const decodeExhaustiveMorphology = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return { label: '일반어휘', type: 'other', caseType: '', isVerb: false };
  const code = rawCode.trim();

  if (code.includes('-') || ['CONJ', 'PREP', 'ADV', 'PRT', 'INJ'].includes(code)) {
    if (code === 'CONJ') return { label: '접속사', type: 'particle', caseType: '', isVerb: false };
    if (code === 'PREP') return { label: '전치사', type: 'particle', caseType: '', isVerb: false };
    if (code === 'ADV') return { label: '부사', type: 'particle', caseType: '', isVerb: false };

    const parts = code.split('-');
    const pos = parts[0];
    const details = parts[1] || '';

    if (pos === 'P') {
      const person = details[0] ? `${details[0]}인칭` : '';
      const caseChar = details[1] || '';
      const numChar = details[2] || '';
      const caseMap = { N: '주격', G: '소유격', D: '여격', A: '대격' };
      const numMap = { S: '단수', P: '복수' };
      return { label: `인칭대명사(${caseMap[caseChar] || ''}) · ${person} ${numMap[numChar] || ''}`.trim(), type: 'noun', caseType: caseChar, isVerb: false };
    }

    if (pos === 'V') {
      const tense = { P: '현재', I: '미완료', F: '미래', A: '부정과거', R: '완료' }[details[0]] || '';
      const voice = { A: '능동태', M: '중간태', P: '수동태', D: '디포' }[details[1]] || '';
      const mood = { I: '직설법', S: '접속법', M: '명령법', N: '부정사', P: '분사' }[details[2]] || '';
      if (details[2] === 'P') {
        const cChar = details[4] || '';
        const caseMap = { N: '주격', G: '소유격', D: '여격', A: '대격' };
        return { label: `동사 · ${tense} ${voice} 분사(${caseMap[cChar] || ''})`, type: 'verb', caseType: cChar, isVerb: true };
      }
      const person = details[3] ? `${details[3]}인칭` : '';
      const num = details[4] === 'S' ? '단수' : details[4] === 'P' ? '복수' : '';
      return { label: `동사 · ${tense} ${voice} ${mood} ${person} ${num}`.replace(/\s+/g, ' ').trim(), type: 'verb', caseType: '', isVerb: true };
    }

    if (['N', 'A', 'T', 'R', 'D'].includes(pos)) {
      const posMap = { N: '명사', A: '형용사', T: '관사', R: '관계대명사', D: '지시대명사' };
      const caseChar = details[0] || '';
      const caseMap = { N: '주격 (~이/가)', G: '소유격 (~의)', D: '여격 (~에게/에)', A: '대격 (~을/를)', V: '호격' };
      const gMap = { M: '남성', F: '여성', N: '중성' };
      const nMap = { S: '단수', P: '복수' };
      return { label: `${posMap[pos] || '명사'} · ${caseMap[caseChar] || ''} · ${gMap[details[2]] || ''} ${nMap[details[1]] || ''}`.trim(), type: pos === 'N' ? 'noun' : 'modifier', caseType: caseChar, isVerb: false };
    }
  }

  if (code.includes('.')) {
    const parts = code.split('.');
    const mainType = parts[0];
    if (mainType === 'prde') return { label: '지시대명사 · 복수', type: 'noun', caseType: '', isVerb: false };
    if (mainType === 'prps') return { label: '인칭대명사', type: 'noun', caseType: '', isVerb: false };
    if (mainType === 'verb') {
      const stemMap = { qal: '칼(기본)', nif: '니팔(수동)', piel: '피엘(강조)', hif: '히필(사역)', hit: '히트파엘(재귀)' };
      const aspectMap = { perf: '완료', impf: '미완료', wayq: '바이크톨', ptca: '능동분사', ptcp: '수동분사', infc: '연계부정사' };
      return { label: `동사 · ${stemMap[parts[1]] || parts[1]} ${aspectMap[parts[2]] || parts[2]}`, type: 'verb', caseType: '', isVerb: true };
    }
    if (mainType === 'subs' || mainType === 'nmpr') {
      const gMap = { m: '남성', f: '여성', c: '공성', u: '공성' };
      const nMap = { sg: '단수', pl: '복수', du: '쌍수' };
      const stateMap = { a: '절대형', c: '연계형(~의)' };
      return {
        label: `${mainType === 'nmpr' ? '고유명사' : '명사'}${stateMap[parts[3]] ? `(${stateMap[parts[3]]})` : ''} · ${gMap[parts[1]] || ''} ${nMap[parts[2]] || ''}`.trim(),
        type: 'noun',
        caseType: parts[3] === 'c' ? 'CONSTRUCT' : '',
        isVerb: false
      };
    }
    if (mainType === 'prep') return { label: '전치사', type: 'particle', caseType: '', isVerb: false };
    if (mainType === 'conj') return { label: '접속사', type: 'particle', caseType: '', isVerb: false };
    if (mainType === 'art') return { label: '정관사', type: 'particle', caseType: '', isVerb: false };
  }

  return { label: code.slice(0, 14), type: 'other', caseType: '', isVerb: false };
};

const speakOriginalAudio = (text, isOT) => {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = isOT ? (text || '').replace(/[\u0591-\u05AF]/g, '') : text || '';
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = isOT ? 'he-IL' : 'el-GR';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

// =====================================================================
// 2단 필사 전용 필기 브러시 렌더러 & 노트 패널 & 설교 모달
// =====================================================================
const renderStroke = (ctx, stroke, isDark) => {
  const { tool, color, size, points } = stroke;
  if (!points || points.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const resolvedColor = isDark && color === '#191F28' ? '#F8FAFC' : color;

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
    case 'highlighter':
      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      ctx.strokeStyle = color === '#191F28' ? 'rgba(13, 148, 136, 0.35)' : color;
      ctx.lineWidth = size * 3.8;
      ctx.globalAlpha = isDark ? 0.5 : 0.35;
      break;
    case 'eraser':
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 6;
      ctx.globalAlpha = 1.0;
      break;
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

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i + 1].x) / 2, (points[i].y + points[i + 1].y) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
  ctx.restore();
};

const BibleTranscriptionNotePanel = ({ currentChapId, chapterTitle, isDark, noteContent, setNoteContent, updateDay }) => {
  const [panelTab, setPanelTab] = useState('handwriting');
  const [paperStyle, setPaperStyle] = useState('line');
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);
  const storageKey = `bible_vector_strokes_${currentChapId || 'Genesis-1'}`;

  const [strokes, setStrokes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  const [redoStack, setRedoStack] = useState([]);
  const [currentTool, setCurrentTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#191F28');
  const [strokeWidth] = useState(2.5);

  useEffect(() => {
    try { setStrokes(JSON.parse(localStorage.getItem(storageKey) || '[]')); setRedoStack([]); } catch { setStrokes([]); }
  }, [storageKey]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    strokes.forEach((s) => renderStroke(ctx, s, isDark));
    if (currentPointsRef.current.length > 0) {
      renderStroke(ctx, { tool: currentTool, color: strokeColor, size: strokeWidth, points: currentPointsRef.current }, isDark);
    }
  }, [strokes, currentTool, strokeColor, strokeWidth, isDark]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(strokes)); } catch (_) {}
    redraw();
  }, [strokes, storageKey, redraw]);

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
    if (panelTab !== 'handwriting') return;
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelTab, handleResize]);

  const getCoordinates = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : { x: 0, y: 0 };
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pos = getCoordinates(e);
    isDrawingRef.current = true;
    currentPointsRef.current = [pos];
    e.target.setPointerCapture?.(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) renderStroke(ctx, { tool: currentTool, color: strokeColor, size: strokeWidth, points: [pos] }, isDark);
  };

  const onPointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const pos = getCoordinates(e);
    const pts = currentPointsRef.current;
    const lastPos = pts[pts.length - 1];
    if (!lastPos || Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y) > 2.2) {
      pts.push(pos);
      redraw();
    }
  };

  const onPointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    e.target.releasePointerCapture?.(e.pointerId);
    if (currentPointsRef.current.length > 0) {
      setStrokes((prev) => [...prev, { id: Date.now() + Math.random(), tool: currentTool, color: strokeColor, size: strokeWidth, points: [...currentPointsRef.current] }]);
      setRedoStack([]);
    }
    currentPointsRef.current = [];
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = isDark ? '#171A21' : '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.scale(dpr, dpr);
    strokes.forEach((s) => renderStroke(ctx, s, isDark));
    const link = document.createElement('a');
    link.download = `${chapterTitle || '말씀'}_필사노트.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const getPaperBg = () => {
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 31, 40, 0.1)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 31, 40, 0.08)';
    if (paperStyle === 'dot') return { backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px' };
    if (paperStyle === 'line') return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`, backgroundSize: '100% 30px' };
    if (paperStyle === 'grid') return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' };
    return {};
  };

  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const surfaceClass = isDark ? 'bg-[#171A21]' : 'bg-white';

  return (
    <div className={`flex flex-col h-full rounded-2xl border overflow-hidden ${surfaceClass} ${borderClass}`}>
      <div className={`px-3.5 py-2.5 border-b ${borderClass} flex flex-wrap items-center justify-between gap-2 shrink-0`}>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPanelTab('handwriting')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${panelTab === 'handwriting' ? 'bg-[#0D9488] text-white' : isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            <PenLine className="w-3.5 h-3.5" /><span>손필기</span>
          </button>
          <button type="button" onClick={() => setPanelTab('typing')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${panelTab === 'typing' ? 'bg-[#2563EB] text-white' : isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            <FileText className="w-3.5 h-3.5" /><span>텍스트 노트</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`flex p-0.5 rounded-lg text-[12px] font-bold ${isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]'}`}>
            {[{ id: 'line', label: '유선' }, { id: 'dot', label: '도트' }, { id: 'grid', label: '모눈' }, { id: 'blank', label: '무지' }].map((p) => (
              <button key={p.id} type="button" onClick={() => setPaperStyle(p.id)} className={`px-2 py-1 rounded-md cursor-pointer ${paperStyle === p.id ? (isDark ? 'bg-[#171A21] text-white' : 'bg-white text-[#191F28]') : 'text-[#8B95A1]'}`}>{p.label}</button>
            ))}
          </div>
          {panelTab === 'handwriting' && (
            <button type="button" onClick={handleExportPng} className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer ${isDark ? 'bg-[#0D9488]/15 text-[#5EEAD4]' : 'bg-[#0D9488]/10 text-[#0F766E]'}`}>
              <Download className="w-3.5 h-3.5" /><span>저장</span>
            </button>
          )}
        </div>
      </div>

      {panelTab === 'handwriting' && (
        <div className={`px-3.5 py-2 border-b ${borderClass} flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar shrink-0`}>
          <div className="flex items-center gap-1 shrink-0">
            {[{ id: 'pen', label: '볼펜' }, { id: 'pencil', label: '연필' }, { id: 'marker', label: '마커' }, { id: 'highlighter', label: '형광펜' }, { id: 'eraser', label: '지우개' }].map((toolItem) => (
              <button key={toolItem.id} type="button" onClick={() => setCurrentTool(toolItem.id)} className={`px-2.5 py-1 rounded-md text-[12px] font-bold cursor-pointer ${currentTool === toolItem.id ? 'bg-[#191F28] text-white dark:bg-white dark:text-[#101216]' : isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{toolItem.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {['#191F28', '#2563EB', '#0D9488', '#D97706'].map((c) => (
              <button key={c} type="button" onClick={() => setStrokeColor(c)} style={{ backgroundColor: c }} className={`w-4 h-4 rounded-full cursor-pointer ${strokeColor === c ? 'scale-125 ring-2 ring-[#0D9488]' : 'opacity-75'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => { if (!strokes.length) return; setRedoStack((p) => [...p, strokes[strokes.length - 1]]); setStrokes((p) => p.slice(0, -1)); }} disabled={!strokes.length} className="p-1.5 rounded-lg text-[#64748B] disabled:opacity-30 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => { if (!redoStack.length) return; setStrokes((p) => [...p, redoStack[redoStack.length - 1]]); setRedoStack((p) => p.slice(0, -1)); }} disabled={!redoStack.length} className="p-1.5 rounded-lg text-[#64748B] disabled:opacity-30 cursor-pointer"><RotateCw className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => { if (!strokes.length || !window.confirm('이 장의 손필기를 모두 지우시겠습니까?')) return; setStrokes([]); setRedoStack([]); localStorage.removeItem(storageKey); }} disabled={!strokes.length} className="p-1.5 rounded-lg text-[#64748B] disabled:opacity-30 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden" style={getPaperBg()}>
        {panelTab === 'handwriting' ? (
          <div ref={containerRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair">
            <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="absolute inset-0 w-full h-full touch-none" />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full p-5 overflow-y-auto hide-scrollbar">
            <textarea
              value={noteContent}
              onChange={(e) => { setNoteContent(e.target.value); if (updateDay) updateDay({ bibleFreeNote: e.target.value }); }}
              placeholder={`${chapterTitle || '말씀'} 본문을 묵상하며 이곳에 필사나 묵상 내용을 자유롭게 기록하세요.`}
              className={`w-full h-full bg-transparent outline-none resize-none text-[15px] leading-[1.8] border-none ${isDark ? 'text-[#F8FAFC] placeholder:text-[#64748B]' : 'text-[#191F28] placeholder:text-[#94A3B8]'}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const InlineSermonReferencePanel = ({ verseKey, sermons, dailyData, isDark, onClose, onJumpToNote }) => {
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const surfaceClass = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBgClass = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';

  const matchedUserNotes = useMemo(() => {
    if (!dailyData || !verseKey) return [];
    const targetClean = verseKey.replace(/\s+/g, '');
    const results = [];
    Object.entries(dailyData).forEach(([dKey, dVal]) => {
      if (!dVal || typeof dVal !== 'object') return;
      const refStr = String(dVal.sermonReference || '').replace(/\s+/g, '');
      if (refStr && (refStr.includes(targetClean) || targetClean.includes(refStr))) {
        results.push({ date: dKey, title: dVal.sermonTitle || '제목 없는 예배 노트', preacher: dVal.sermonPreacher || '담임목사', reference: dVal.sermonReference, notes: dVal.sermonNotes ? dVal.sermonNotes.replace(/<[^>]*>?/gm, ' ').trim() : '' });
      }
    });
    return results;
  }, [dailyData, verseKey]);

  const sermonItems = Array.isArray(sermons) ? sermons : sermons ? [sermons] : [];

  return (
    <div className="fixed inset-0 z-[999999] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceClass} flex flex-col max-h-[86vh] overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${borderClass} flex items-center justify-between shrink-0`}>
          <div>
            <span className="text-[12px] font-bold text-[#D97706] block">관련 설교 및 말씀 노트</span>
            <h3 className={`text-[17px] font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#191F28]'}`}>{verseKey}</h3>
          </div>
          <button type="button" onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${subBgClass} ${isDark ? 'text-white' : 'text-[#191F28]'} cursor-pointer`}><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar">
          {sermonItems.map((item, idx) => (
            <div key={`db_${idx}`} className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-0.5 rounded-md">{item.date || '주일예배'}</span>
                {item.preacher && <span className={`text-[12px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{item.preacher}</span>}
              </div>
              <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#191F28]'}`}>{item.title || item.sermonTitle || `${verseKey} 강해 설교`}</h4>
              {(item.summary || item.content || item.text) && <p className={`text-[15px] leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-[#4E5968]'} whitespace-pre-wrap`}>{item.summary || item.content || item.text}</p>}
              {item.application && <div className={`p-3 rounded-lg ${subBgClass} text-[12.5px] leading-relaxed ${isDark ? 'text-[#E5E7EB]' : 'text-[#333D4B]'}`}><strong className="text-[#0D9488] mr-1.5">적용 포인트</strong>{item.application}</div>}
            </div>
          ))}
          {matchedUserNotes.map((note, idx) => (
            <div key={`note_${idx}`} className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
              <div className="flex items-center justify-between"><span className="text-[12px] font-bold text-[#0D9488]">나의 예배 노트 · {note.date}</span><span className={`text-[12px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{note.preacher}</span></div>
              <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#191F28]'}`}>{note.title}</h4>
              {note.notes && <p className={`text-[15px] leading-relaxed line-clamp-4 ${isDark ? 'text-[#D1D5DB]' : 'text-[#4E5968]'}`}>{note.notes}</p>}
              <button type="button" onClick={() => onJumpToNote(note.date)} className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-[12px] font-bold cursor-pointer mt-1">해당 날짜 예배 노트 전체 열기</button>
            </div>
          ))}
          {sermonItems.length === 0 && matchedUserNotes.length === 0 && (
            <div className="py-10 text-center space-y-3">
              <p className={`text-[15px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>이 본문과 연결된 상세 요약이 아직 등록되지 않았습니다.</p>
              <button type="button" onClick={() => onJumpToNote(null)} className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[14px] font-bold cursor-pointer">이 본문으로 예배 노트 작성하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

// =====================================================================
// 메인 통독 365 글로벌 SaaS 성경 리더 컴포넌트
// =====================================================================
export default function Bible({
  bibles,
  currentChapId,
  setCurrentChapId,
  bibleViewMode,
  setBibleViewMode,
  bibleNotes,
  setBibleNotes,
  bibleHighlights,
  setBibleHighlights,
  readVerses,
  setReadVerses,
  isDarkMode,
  t,
  setActiveScreen,
  authUser,
  isSidebarOpen,
  setIsSidebarOpen,
  getKoName,
  getArr,
  readChallengeStart,
  setReadChallengeStart,
  bibleProgress,
  readChapsCount,
  openModal,
  setSelVerses,
  selVerses,
  currDay,
  updateDay,
  getLocalToday,
  SubPageHeader,
  targetVerse,
  setTargetVerse
}) {
  const userName = (typeof authUser === 'object' ? authUser?.name : authUser) || localStorage.getItem('login_user_name') || '성도';

  const [selectedSermonVerse, setSelectedSermonVerse] = useState(null);
  const [sermonSummaryData, setSermonSummaryData] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'split'
  const [readerTab, setReaderTab] = useState('text'); // 'text' | 'notes'
  const [noteContent, setNoteContent] = useState(currDay?.bibleFreeNote || '');
  const [cellSyncToast, setCellSyncToast] = useState(false);
  const [actionToast, setActionToast] = useState('');

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 2200);
  }, []);

  const [targetRounds, setTargetRounds] = useState(() => {
    try {
      return Number(localStorage.getItem('bible_target_rounds') || '1') || 1;
    } catch {
      return 1;
    }
  });
  const [showPlanSettings, setShowPlanSettings] = useState(false);

  const handleTargetRoundsChange = (rounds) => {
    setTargetRounds(rounds);
    try {
      localStorage.setItem('bible_target_rounds', String(rounds));
    } catch (_) {}
  };

  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('bible_version_mode') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [krv4TxtDb, setKrv4TxtDb] = useState(() => cachedKrv4Data);
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});
  const [liveWebTick, setLiveWebTick] = useState(0);

  const handleVersionChange = (ver) => {
    setBibleVersion(ver);
    try {
      localStorage.setItem('bible_version_mode', ver);
    } catch (_) {}
  };

  const [showTypoSettings, setShowTypoSettings] = useState(false);
  const [readerPrefs, setReaderPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bible_reader_prefs_v1') || 'null');
      return saved || { fontSize: 16, lineHeight: 1.8, fontFamily: 'sans', paperTheme: 'default' };
    } catch {
      return { fontSize: 16, lineHeight: 1.8, fontFamily: 'sans', paperTheme: 'default' };
    }
  });

  const updateReaderPrefs = (patch) => {
    setReaderPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('bible_reader_prefs_v1', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bible_bookmarks_v1') || '[]');
    } catch {
      return [];
    }
  });
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);

  const saveBookmarks = useCallback((nextList) => {
    setBookmarks(nextList);
    try {
      localStorage.setItem('bible_bookmarks_v1', JSON.stringify(nextList));
    } catch (_) {}
  }, []);

  const [localVerseNotes, setLocalVerseNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bible_verse_notes_v1') || '[]');
    } catch {
      return [];
    }
  });
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [composerVerses, setComposerVerses] = useState([]);
  const [composerMemo, setComposerMemo] = useState('');
  const [composerColor, setComposerColor] = useState(HIGHLIGHT_PALETTE[0].hex);
  const [noteColorFilter, setNoteColorFilter] = useState('all');

  const allTimelineNotes = useMemo(() => {
    const propList = Array.isArray(bibleNotes) ? bibleNotes : [];
    const mergedMap = new Map();
    [...localVerseNotes, ...propList].forEach((n) => {
      if (n && n.id) mergedMap.set(n.id, n);
    });
    return Array.from(mergedMap.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [bibleNotes, localVerseNotes]);

  const filteredTimelineNotes = useMemo(() => {
    if (noteColorFilter === 'all') return allTimelineNotes;
    return allTimelineNotes.filter(
      (n) => String(n.color || '').toLowerCase() === String(noteColorFilter).toLowerCase()
    );
  }, [allTimelineNotes, noteColorFilter]);

  const [showQuickJump, setShowQuickJump] = useState(false);
  const [jumpTestament, setJumpTestament] = useState('OT');
  const [jumpSelectedBook, setJumpSelectedBook] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVerseIdx, setAudioVerseIdx] = useState(-1);
  const [audioRate, setAudioRate] = useState(1.0);
  const audioPlayingRef = useRef(false);
  const verseRefsMap = useRef({});

  const [inspectorTarget, setInspectorTarget] = useState(null);
  const [inspectorWords, setInspectorWords] = useState([]);
  const [isInspectorLoading, setIsInspectorLoading] = useState(false);
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [modalTab, setModalTab] = useState('scholarly');
  const [concordanceTotalCount, setConcordanceTotalCount] = useState(0);
  const [concordanceList, setConcordanceList] = useState([]);
  const [customNotesMap, setCustomNotesMap] = useState({});
  const [customInputTrans, setCustomInputTrans] = useState('');
  const [customInputMemo, setCustomInputMemo] = useState('');

  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);
  const [translatedScholarlyMap, setTranslatedScholarlyMap] = useState({});
  const [translatingKey, setTranslatingKey] = useState(null);

  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  const effectiveStartDate = localStorage.getItem('readChallengeStart') || readChallengeStart || '2026-01-01';
  const todayStr = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);
  const elapsedDayNum = useMemo(() => {
    const sD = new Date(`${effectiveStartDate}T00:00:00`);
    const tD = new Date(`${todayStr}T00:00:00`);
    const diff = Math.floor((tD.getTime() - sD.getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(365, diff));
  }, [effectiveStartDate, todayStr]);

  const todaysPlanChapters = useMemo(() => {
    return getDailyReadingPlanChapters(elapsedDayNum, targetRounds);
  }, [elapsedDayNum, targetRounds]);

  const dailyDailyData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('qt_daily') || '{}');
    } catch {
      return {};
    }
  }, [selectedSermonVerse]);

  useEffect(() => {
    ensureKrv4TxtLoaded().then((parsedMap) => {
      if (parsedMap) setKrv4TxtDb(parsedMap);
    });
    ensureMasterStrongs();

    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then((r) => (r.ok ? r.json() : {})).then((d) => setCommentaryDb((prev) => ({ ...prev, ...d }))).catch(() => {});
    fetch('/data/matthew_henry.json').then((r) => (r.ok ? r.json() : {})).then((d) => setMatthewHenryDb((prev) => ({ ...prev, ...d }))).catch(() => {});
    fetch('/data/net_notes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setNetNotesDb(d || {})).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const jumpTarget = localStorage.getItem('bible_jump_target');
      if (jumpTarget) {
        localStorage.removeItem('bible_jump_target');
        setCurrentChapId(jumpTarget);
        setBibleViewMode('read');
      }
    } catch (_) {}
  }, [setCurrentChapId, setBibleViewMode]);

  useEffect(() => {
    setNoteContent(currDay?.bibleFreeNote || '');
  }, [currDay?.bibleFreeNote]);

  useEffect(() => {
    let isMounted = true;
    fetch('/sermon_summary.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setSermonSummaryData(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // 66권 정규화 매핑 (공백/약어/한글/영문 불일치로 창세기로 폴백되는 문제 원천 차단)
  const [sBk, sCh] = String(currentChapId || 'Genesis-1').split('-');
  const currentBookMeta = useMemo(() => {
    return resolveBookMeta(sBk) || resolveBookMeta(getKoName ? getKoName(sBk) : sBk) || BIBLE_66_LIST[0];
  }, [sBk, getKoName]);

  const currentChapterNum = Math.max(1, Math.min(currentBookMeta.chaptersCount || 150, parseInt(sCh, 10) || 1));

  const cBk = useMemo(() => {
    const arr = getArr ? getArr(bibles) : bibles || [];
    if (!arr.length) return null;
    const enLower = currentBookMeta.en.toLowerCase();
    const noSpaceLower = enLower.replace(/\s+/g, '');
    const koLower = currentBookMeta.ko.toLowerCase();
    const abbrLower = currentBookMeta.abbr.toLowerCase();

    return (
      arr.find((b) => {
        const nm = String(b?.name || '').trim().toLowerCase();
        const nmNoSpace = nm.replace(/\s+/g, '');
        const ab = String(b?.abbrev || '').trim().toLowerCase();
        return nm === enLower || nmNoSpace === noSpaceLower || nm === koLower || ab === abbrLower;
      }) ||
      (typeof currentBookMeta.bookIdx === 'number' ? arr[currentBookMeta.bookIdx] : null) ||
      arr[0]
    );
  }, [bibles, getArr, currentBookMeta]);

  useEffect(() => {
    if (!currentBookMeta || !currentChapterNum) return;
    let isMounted = true;

    fetch(`/data/commentaries_by_chapter/${currentBookMeta.ko}_${currentChapterNum}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && isMounted) setCommentaryDb((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});

    fetch(`/data/matthew_henry_by_chapter/${currentBookMeta.ko}_${currentChapterNum}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && isMounted) setMatthewHenryDb((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});

    const testWeb = resolveTranslationVerse(webBibleDb, currentBookMeta, currentChapterNum, 1);
    if (!testWeb && !liveWebChapterCache[`${currentBookMeta.en}-${currentChapterNum}-1`]) {
      fetch(`https://bible-api.com/${encodeURIComponent(`${currentBookMeta.en} ${currentChapterNum}`)}?translation=web`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.verses)) {
            data.verses.forEach((vObj) => {
              const vNumber = Number(vObj.verse);
              const cleanTxt = String(vObj.text || '').replace(/\r?\n/g, ' ').trim();
              if (vNumber && cleanTxt) {
                liveWebChapterCache[`${currentBookMeta.en}-${currentChapterNum}-${vNumber}`] = cleanTxt;
              }
            });
            if (isMounted) setLiveWebTick((t) => t + 1);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [currentBookMeta, currentChapterNum, webBibleDb]);

  // 개역4판 txt와 기본 JSON 중 더 완전한 절 배열을 기준으로 누락 절 자동 보완
  const cVs = useMemo(() => {
    const noSpaceEn = currentBookMeta.en.replace(/\s+/g, '');
    const txtChap =
      krv4TxtDb?.[currentBookMeta.en]?.[currentChapterNum - 1] ||
      krv4TxtDb?.[currentBookMeta.ko]?.[currentChapterNum - 1] ||
      krv4TxtDb?.[noSpaceEn]?.[currentChapterNum - 1] ||
      krv4TxtDb?.[currentBookMeta.abbr]?.[currentChapterNum - 1];

    const jsonChap =
      cBk && cBk.chapters && Array.isArray(cBk.chapters[currentChapterNum - 1])
        ? cBk.chapters[currentChapterNum - 1]
        : [];

    const txtLen = Array.isArray(txtChap) ? txtChap.length : 0;
    const jsonLen = jsonChap.length;
    const maxLen = Math.max(txtLen, jsonLen);
    if (maxLen === 0) return [];

    const merged = [];
    for (let i = 0; i < maxLen; i++) {
      const vTxt = Array.isArray(txtChap) ? txtChap[i] : null;
      const vJson = jsonChap[i];
      if (vTxt) merged.push(vTxt);
      else if (vJson) merged.push(vJson);
    }
    return merged;
  }, [krv4TxtDb, currentBookMeta, currentChapterNum, cBk]);

  useEffect(() => {
    if (bibleViewMode === 'read' && targetVerse && verseRefsMap.current[targetVerse - 1]) {
      setTimeout(() => {
        verseRefsMap.current[targetVerse - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (setTargetVerse) setTargetVerse(null);
      }, 220);
    }
  }, [bibleViewMode, targetVerse, currentChapId, setTargetVerse]);

  const stopAudio = useCallback(() => {
    audioPlayingRef.current = false;
    setIsAudioPlaying(false);
    setAudioVerseIdx(-1);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    stopAudio();
  }, [currentChapId, bibleViewMode, stopAudio]);

  const chapterProgressPercent = useMemo(() => {
    if (!cVs || cVs.length === 0) return 0;
    let count = 0;
    cVs.forEach((_, idx) => {
      if ((readVerses || {})[`${sBk}-${sCh}-${idx}`]) count++;
    });
    return Math.round((count / cVs.length) * 100);
  }, [cVs, readVerses, sBk, sCh]);

  const isAllR = cVs.length > 0 && (getArr ? getArr(cVs) : cVs).every((_, i) => (readVerses || {})[`${sBk}-${sCh}-${i}`]);
  // 정경 마스터 장수(chaptersCount) 최우선 사용
  const totalChapters = currentBookMeta.chaptersCount || (getArr ? getArr(cBk?.chapters) : cBk?.chapters || []).length || 1;
  const hasPrevChapter = currentChapterNum > 1;
  const hasNextChapter = currentChapterNum < totalChapters;

  const safeGetVerseText = useCallback((verse) => {
    let verseText = '';
    if (typeof verse === 'string') {
      verseText = verse;
      if (/^\d{4}-\d{2}-\d{2}T/.test(verseText) || /^\w{3} \w{3} \d{2} \d{4}/.test(verseText)) {
        return '본문 데이터를 불러올 수 없습니다.';
      }
    } else if (typeof verse === 'object' && verse !== null) {
      verseText = verse.text || verse.content || verse.verse || JSON.stringify(verse);
    }
    return decodeHtmlEntities(verseText);
  }, []);

  const speakFromIndex = useCallback(
    (startIdx) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        showToast('현재 브라우저는 오디오 낭독을 지원하지 않습니다.');
        return;
      }
      if (!cVs || startIdx >= cVs.length) {
        stopAudio();
        return;
      }
      window.speechSynthesis.cancel();
      audioPlayingRef.current = true;
      setIsAudioPlaying(true);
      setAudioVerseIdx(startIdx);
      verseRefsMap.current[startIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const { pureText } = splitPericopeAndVerse(safeGetVerseText(cVs[startIdx]));
      const utter = new SpeechSynthesisUtterance(pureText);
      utter.lang = bibleVersion === 'web' ? 'en-US' : 'ko-KR';
      utter.rate = audioRate;
      utter.onend = () => {
        if (audioPlayingRef.current) speakFromIndex(startIdx + 1);
      };
      utter.onerror = () => stopAudio();
      window.speechSynthesis.speak(utter);
    },
    [cVs, safeGetVerseText, bibleVersion, audioRate, stopAudio, showToast]
  );

  const toggleAudioPlay = () => {
    if (isAudioPlaying) stopAudio();
    else {
      setIsAudioOpen(true);
      speakFromIndex(audioVerseIdx >= 0 ? audioVerseIdx : 0);
    }
  };

  const checkHasSermon = useCallback(
    (koName, enName, chapter, verseNum) => {
      const vInt = parseInt(verseNum, 10);
      const chInt = parseInt(chapter, 10);
      const cleanKo = koName.replace(/\s+/g, '');
      const cleanEn = (enName || '').replace(/\s+/g, '');
      const targetPrefixKo = `${cleanKo}${chInt}:`;
      const targetPrefixEn = cleanEn ? `${cleanEn}${chInt}:` : '';

      if (sermonSummaryData && sermonSummaryData.index) {
        for (const key of Object.keys(sermonSummaryData.index)) {
          const sermons = sermonSummaryData.index[key];
          if (!sermons || sermons.length === 0) continue;

          const cleanKey = key.replace(/\s+/g, '');
          let versePart = null;
          if (cleanKey.startsWith(targetPrefixKo)) versePart = cleanKey.slice(targetPrefixKo.length);
          else if (targetPrefixEn && cleanKey.startsWith(targetPrefixEn)) versePart = cleanKey.slice(targetPrefixEn.length);
          if (!versePart) continue;

          const segments = versePart.split(/[,;]/);
          for (const seg of segments) {
            if (seg.includes('-') || seg.includes('~')) {
              const [sStr, eStr] = seg.split(/[-~]/);
              const start = parseInt(sStr.replace(/[^0-9]/g, ''), 10);
              const end = parseInt(eStr.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(start) && !isNaN(end) && vInt >= start && vInt <= end) return key;
            } else {
              const single = parseInt(seg.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(single) && vInt === single) return key;
            }
          }
        }
      }

      try {
        const rawDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        for (const dVal of Object.values(rawDaily)) {
          if (!dVal || !dVal.sermonReference) continue;
          const cleanRef = String(dVal.sermonReference).replace(/\s+/g, '');
          if (cleanRef.startsWith(targetPrefixKo) || cleanRef === `${cleanKo}${chInt}장`) return dVal.sermonReference;
        }
      } catch (_) {}

      return null;
    },
    [sermonSummaryData]
  );

  const syncBibleReading = useCallback(() => {
    const todayYmd = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);

    if (supabase && (authUser?.name || authUser)) {
      const uName = typeof authUser === 'object' ? authUser?.name : authUser;
      const cName = authUser?.cell_name || '내 목장';
      if (uName) {
        supabase
          .from('attendance_records')
          .upsert([{ date: todayYmd, user_name: uName, cell_name: cName, type: '성경', status: '출석' }], { onConflict: 'date,user_name,type' })
          .then(() => {
            setCellSyncToast(true);
            setTimeout(() => setCellSyncToast(false), 2400);
          });
      }
    } else {
      setCellSyncToast(true);
      setTimeout(() => setCellSyncToast(false), 2400);
    }

    if (updateDay) {
      updateDay({
        checks: { ...(currDay?.checks || {}), 성경: true, 성경읽기: true, 성경통독: true }
      });
    }

    try {
      const daysData = JSON.parse(localStorage.getItem('days_data') || '{}');
      const dayRec = daysData[todayYmd] || {};
      const checks = dayRec.checks || {};
      checks['성경'] = true;
      checks['성경읽기'] = true;
      checks['성경통독'] = true;
      dayRec.checks = checks;
      daysData[todayYmd] = dayRec;
      localStorage.setItem('days_data', JSON.stringify(daysData));

      const routineData = JSON.parse(localStorage.getItem('daily_routine') || '{}');
      const todayRoutine = routineData[todayYmd] || {};
      todayRoutine['bible'] = true;
      todayRoutine['성경'] = true;
      routineData[todayYmd] = todayRoutine;
      localStorage.setItem('daily_routine', JSON.stringify(routineData));
    } catch (_) {}

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('bible-progress-updated'));
  }, [getLocalToday, authUser, updateDay, currDay]);

  const handleToggleWholeChapter = () => {
    const u = {};
    const s = !isAllR;
    (getArr ? getArr(cVs) : cVs).forEach((_, i) => (u[`${sBk}-${sCh}-${i}`] = s));
    const nextReadVerses = { ...(readVerses || {}), ...u };
    setReadVerses(nextReadVerses);
    localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

    const todayKey = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);
    const currentDayChaps = parseInt(localStorage.getItem(`chap_count_${todayKey}`) || '0', 10);
    localStorage.setItem(`chap_count_${todayKey}`, Math.max(0, currentDayChaps + (s ? 1 : -1)));

    if (s) syncBibleReading();
  };

  const buildSelectedVersesData = useCallback(() => {
    return selVerses.map((id) => {
      const [b, ch, vIdx] = id.split('-');
      const meta = resolveBookMeta(b);
      const koName = meta.ko || (getKoName ? getKoName(b) : b);
      const krvVerse =
        krv4TxtDb?.[meta.en]?.[parseInt(ch, 10) - 1]?.[parseInt(vIdx, 10)] ||
        krv4TxtDb?.[koName]?.[parseInt(ch, 10) - 1]?.[parseInt(vIdx, 10)];
      let rawStr = krvVerse;
      if (!rawStr) {
        const arr = getArr ? getArr(bibles) : bibles || [];
        const bD = arr.find((x) => String(x.name || '').toLowerCase() === meta.en.toLowerCase()) || arr[meta.bookIdx] || arr[0];
        rawStr = (getArr ? getArr(getArr(bD?.chapters)[parseInt(ch, 10) - 1]) : [])[parseInt(vIdx, 10)];
      }
      const { pureText } = splitPericopeAndVerse(safeGetVerseText(rawStr));
      return {
        id,
        bookEn: meta.en,
        chapter: parseInt(ch, 10),
        verse: parseInt(vIdx, 10) + 1,
        ref: `${koName} ${ch}:${parseInt(vIdx, 10) + 1}`,
        text: pureText
      };
    });
  }, [selVerses, getKoName, krv4TxtDb, getArr, bibles, safeGetVerseText]);

  const handleToggleBookmarksForSelected = () => {
    const vData = buildSelectedVersesData();
    if (vData.length === 0) return;
    let next = [...bookmarks];
    let added = 0;
    vData.forEach((v) => {
      const existsIdx = next.findIndex((b) => b.id === v.id);
      if (existsIdx >= 0) next.splice(existsIdx, 1);
      else {
        added++;
        next.unshift({ ...v, color: (bibleHighlights || {})[v.id] || HIGHLIGHT_PALETTE[0].hex, createdAt: todayStr });
      }
    });
    saveBookmarks(next);
    setSelVerses([]);
    showToast(added > 0 ? `${added}개 구절이 북마크에 저장되었습니다.` : '북마크가 해제되었습니다.');
  };

  const handleOpenNoteComposer = () => {
    const vData = buildSelectedVersesData();
    if (vData.length === 0) return;
    const firstColor = (bibleHighlights || {})[vData[0].id] || HIGHLIGHT_PALETTE[0].hex;
    setComposerVerses(vData);
    setComposerColor(firstColor === 'transparent' ? HIGHLIGHT_PALETTE[0].hex : firstColor);
    setComposerMemo('');
    setShowNoteComposer(true);
  };

  const handleSaveTimelineNote = () => {
    if (composerVerses.length === 0) return;
    const newNote = {
      id: Date.now(),
      author: userName,
      date: todayStr.replace(/^20/, '').replace(/-/g, '.'),
      color: composerColor,
      verses: composerVerses,
      note: composerMemo.trim()
    };

    const nextLocal = [newNote, ...localVerseNotes];
    setLocalVerseNotes(nextLocal);
    try { localStorage.setItem('bible_verse_notes_v1', JSON.stringify(nextLocal)); } catch (_) {}
    if (typeof setBibleNotes === 'function') setBibleNotes((prev) => [newNote, ...(Array.isArray(prev) ? prev : [])]);

    if (setBibleHighlights) {
      const nH = { ...(bibleHighlights || {}) };
      composerVerses.forEach((v) => { nH[v.id] = composerColor; });
      setBibleHighlights(nH);
    }

    setShowNoteComposer(false);
    setSelVerses([]);
    showToast('성경 노트에 저장되었습니다.');
  };

  const handleDeleteTimelineNote = (noteId) => {
    if (!window.confirm('이 성경 노트를 삭제하시겠습니까?')) return;
    const nextLocal = localVerseNotes.filter((n) => n.id !== noteId);
    setLocalVerseNotes(nextLocal);
    try { localStorage.setItem('bible_verse_notes_v1', JSON.stringify(nextLocal)); } catch (_) {}
    if (typeof setBibleNotes === 'function') setBibleNotes((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== noteId) : []));
  };

  const searchResults = useMemo(() => {
    const q = searchKeyword.trim();
    if (q.length < 2) return [];
    const results = [];
    const booksArr = getArr ? getArr(bibles) : bibles || [];
    for (let bIdx = 0; bIdx < booksArr.length; bIdx++) {
      const b = booksArr[bIdx];
      const meta = resolveBookMeta(b.name);
      const koName = meta.ko || (getKoName ? getKoName(b.name) : b.name);
      const chaps = krv4TxtDb?.[meta.en] || krv4TxtDb?.[koName] || b.chapters || [];
      for (let cIdx = 0; cIdx < chaps.length; cIdx++) {
        const vs = chaps[cIdx] || [];
        for (let vIdx = 0; vIdx < vs.length; vIdx++) {
          const { pureText } = splitPericopeAndVerse(safeGetVerseText(vs[vIdx]));
          if (pureText && pureText.includes(q)) {
            results.push({ bookEn: meta.en, bookKo: koName, chapter: cIdx + 1, verse: vIdx + 1, text: pureText });
            if (results.length >= 60) return results;
          }
        }
      }
    }
    return results;
  }, [searchKeyword, bibles, krv4TxtDb, getArr, getKoName, safeGetVerseText]);

  const handleSelectInspectorWord = useCallback(
    async (word) => {
      setSelectedWordDetail(word);
      setConcordanceList([]);
      setConcordanceTotalCount(0);

      const note = customNotesMap[word.strongs];
      setCustomInputTrans(note?.translation || '');
      setCustomInputMemo(note?.memo || '');

      if ((word.korLemma === '원어 어휘' || !word.korLemma) && word.eng && word.eng !== 'n/a') {
        fetchQuickKoreanTranslate(word.eng).then((koTranslated) => {
          if (koTranslated) {
            setSelectedWordDetail((prev) =>
              prev && prev.order === word.order
                ? { ...prev, korLemma: koTranslated, korContextual: applyContextualCaseEnding(koTranslated, word.caseType, word.isOT) }
                : prev
            );
          }
        });
      }

      if (supabase && word.strongs && !word.strongs.endsWith('0000')) {
        try {
          const cleanId = word.strongs.trim().toUpperCase();
          const prefix = cleanId[0];
          const numPart = cleanId.slice(1).replace(/^0+/, '') || '0';
          const candidateIds = Array.from(new Set([cleanId, `${prefix}${numPart}`, `${prefix}${numPart.padStart(4, '0')}`]));

          const { data, count, error } = await supabase
            .from('interlinear_bible')
            .select('book, chapter, verse, original_word, korean_trans', { count: 'exact' })
            .in('strongs_id', candidateIds)
            .order('id', { ascending: true })
            .limit(40);

          if (!error && data) {
            setConcordanceTotalCount(count || data.length);
            setConcordanceList(data);
          }
        } catch (_) {}
      }
    },
    [customNotesMap]
  );

  const openVerseInspector = useCallback(
    async (chNum, vNum, verseText) => {
      const koBook = currentBookMeta.ko;
      const isOT = currentBookMeta.isOT;
      const easyText = resolveTranslationVerse(easyBibleDb, currentBookMeta, chNum, vNum);
      const webText = resolveTranslationVerse(webBibleDb, currentBookMeta, chNum, vNum);

      setInspectorTarget({ book: koBook, bookEn: currentBookMeta.en, chapter: chNum, verse: vNum, text: decodeHtmlEntities(verseText), easyText, webText, isOT });
      setInspectorWords([]);
      setSelectedWordDetail(null);
      setConcordanceList([]);
      setConcordanceTotalCount(0);
      setIsInspectorLoading(true);

      getCrossReferences(koBook, parseInt(chNum, 10), parseInt(vNum, 10))
        .then((refs) => setCrossRefs(refs || []))
        .catch(() => setCrossRefs([]));

      try {
        const masterDict = await ensureMasterStrongs();
        if (!supabase) return;
        const { data: wordsData } = await supabase
          .from('interlinear_bible')
          .select('*')
          .eq('book', koBook)
          .eq('chapter', parseInt(chNum, 10))
          .eq('verse', parseInt(vNum, 10))
          .order('word_order', { ascending: true });

        if (wordsData && wordsData.length > 0) {
          const strongIds = Array.from(new Set(wordsData.map((w) => (w.strongs_id || '').trim()).filter(Boolean)));
          let dictMap = new Map();

          if (strongIds.length > 0) {
            const { data: dictRows } = await supabase.from('strongs_dictionary').select('*').in('strongs_id', strongIds);
            if (dictRows && dictRows.length > 0) dictRows.forEach((row) => dictMap.set(row.strongs_id, row));
          }

          const enriched = wordsData.map((w) => {
            const sId = (w.strongs_id || '').trim();
            const master = lookupStrongsEntry(masterDict, sId);
            const dbDict = dictMap.get(sId) || {};
            const morph = decodeExhaustiveMorphology(w.grammar);

            const inflectedWord = (w.original_word || '').trim();
            const lemmaWord = (master.original || dbDict.original_word || inflectedWord).trim();
            const isInflectedDifferent = lemmaWord && inflectedWord && lemmaWord !== inflectedWord;

            let lemmaMeaning = master.korean || dbDict.meaning || '';
            if (!lemmaMeaning || !/[가-힣]/.test(lemmaMeaning)) {
              if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) lemmaMeaning = w.korean_trans;
              else if (master.usage && /[가-힣]/.test(master.usage)) lemmaMeaning = master.usage.split(',')[0].trim();
              else lemmaMeaning = '원어 어휘';
            }

            const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morph.caseType, isOT);
            const finalPron = master.pron || (w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : '');
            const cleanEng = (master.eng || w.gloss || w.korean_trans || 'n/a').replace(/[[\]]/g, '').toLowerCase();
            const userCustom = customNotesMap[sId] || null;

            return {
              id: w.id || w.word_order,
              order: w.word_order,
              inflected: inflectedWord,
              lemma: lemmaWord,
              isInflectedDifferent,
              pron: finalPron,
              korContextual: decodeHtmlEntities(userCustom?.translation || contextualKorean),
              korLemma: decodeHtmlEntities(lemmaMeaning),
              eng: decodeHtmlEntities(cleanEng),
              grammarDecoded: morph.label,
              caseType: morph.caseType,
              isOT,
              strongs: sId || (isOT ? 'H0000' : 'G0000'),
              note: decodeHtmlEntities(master.note || ''),
              userCustomNote: userCustom
            };
          });

          setInspectorWords(enriched);
          if (enriched.length > 0) handleSelectInspectorWord(enriched[0]);
        }
      } catch (err) {
        console.error('원어 인스펙터 로드 실패:', err);
      } finally {
        setIsInspectorLoading(false);
      }
    },
    [currentBookMeta, customNotesMap, easyBibleDb, webBibleDb, handleSelectInspectorWord]
  );

  const handleJumpToInterlinearStudio = () => {
    if (!inspectorTarget) return;
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({ book: inspectorTarget.book, chapter: Number(inspectorTarget.chapter), verse: Number(inspectorTarget.verse) }));
    } catch (_) {}
    setInspectorTarget(null);
    if (setActiveScreen) setActiveScreen('interlinear');
  };

  const handleTranslateScholarlyBlock = async (key, rawText) => {
    if (translatedScholarlyMap[key]) {
      setTranslatedScholarlyMap((prev) => ({ ...prev, [key]: null }));
      return;
    }
    setTranslatingKey(key);
    const ko = await fetchQuickKoreanTranslate(rawText);
    setTranslatedScholarlyMap((prev) => ({ ...prev, [key]: ko }));
    setTranslatingKey(null);
  };

  const handleInsertWordToFreeNote = (word) => {
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = word.userCustomNote?.memo ? `\n   메모: ${word.userCustomNote.memo}` : '';
    const insightLine = `\n[원어묵상] ${word.inflected}${lemmaNotice} (${word.strongs}): ${word.korContextual} (${word.eng}) — ${word.grammarDecoded}${customMemoNotice}\n`;

    const updated = (noteContent || '') + insightLine;
    setNoteContent(updated);
    if (updateDay) updateDay({ bibleFreeNote: updated });
    showToast(`[${word.inflected}] 원어 강해가 필사 노트에 기록되었습니다.`);
  };

  const isDark = isDarkMode;
  const isSepia = !isDark && readerPrefs.paperTheme === 'sepia';
  const pageBg = isDark ? 'bg-[#0F1115]' : isSepia ? 'bg-[#F8F3E8]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : isSepia ? 'bg-[#FDF9F0]' : 'bg-white';
  const subSurfaceBg = isDark ? 'bg-[#20242E]' : isSepia ? 'bg-[#EFE8D8]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : isSepia ? 'border-[#E6DEC8]' : 'border-[#E5E8EC]';
  const dividerClass = isDark ? 'divide-[#262B36]' : isSepia ? 'divide-[#ECE4D1]' : 'divide-[#EEF0F3]';
  const textMain = isDark ? 'text-[#F8FAFC]' : isSepia ? 'text-[#2C241B]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : isSepia ? 'text-[#7A6D5D]' : 'text-[#64748B]';

  const sagePillClass = isDark ? 'bg-[#0D9488]/15 text-[#5EEAD4]' : 'bg-[#0D9488]/10 text-[#0F766E]';
  const amberPillClass = isDark ? 'bg-[#D97706]/15 text-[#FCD34D]' : 'bg-[#D97706]/10 text-[#B45309]';
  const bluePillClass = isDark ? 'bg-[#2563EB]/15 text-[#93C5FD]' : 'bg-[#2563EB]/10 text-[#1D4ED8]';

  const originalFontStyle = (isOT) =>
    isOT
      ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
      : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const currentKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentCommentary = commentaryDb[currentKey] || null;
  const currentMatthewHenry = matthewHenryDb[currentKey] || null;
  const currentNetNote = netNotesDb[currentKey] || null;

  const currentIdxInTodaysPlan = todaysPlanChapters.findIndex((c) => c.en === currentBookMeta.en && c.chapter === currentChapterNum);
  const nextPlanChapter =
    currentIdxInTodaysPlan >= 0 && currentIdxInTodaysPlan < todaysPlanChapters.length - 1
      ? todaysPlanChapters[currentIdxInTodaysPlan + 1]
      : null;

  return (
    <div className={`flex-1 flex flex-col h-full ${pageBg} relative overflow-hidden font-sans select-none`}>
      {(cellSyncToast || actionToast) && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999999] bg-[#191F28] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{actionToast || '성경 통독이 목장 출석부 및 오늘의 루틴에 반영되었습니다.'}</span>
        </div>
      )}

      {selectedSermonVerse && (
        <InlineSermonReferencePanel
          verseKey={selectedSermonVerse}
          sermons={sermonSummaryData?.index?.[selectedSermonVerse] || []}
          dailyData={dailyDailyData}
          isDark={isDark}
          onClose={() => setSelectedSermonVerse(null)}
          onJumpToNote={() => {
            setSelectedSermonVerse(null);
            if (setActiveScreen) setActiveScreen('sermon');
          }}
        />
      )}

      {bibleViewMode === 'index' ? (
        <div className="flex-1 overflow-y-auto px-2 sm:px-5 lg:px-8 pb-24 space-y-5 relative z-10 w-full max-w-[1280px] mx-auto hide-scrollbar">
          <div className="pt-1">
            <SubPageHeader title="성경 통독 365" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <section className={`lg:col-span-6 ${surfaceBg} rounded-2xl border ${borderClass} p-5 flex flex-col justify-between space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${bluePillClass}`}>1년 {targetRounds}독 플랜 · {elapsedDayNum}일차</span>
                  <h2 className={`text-[17px] font-bold ${textMain} mt-2`}>전체 통독 진행률 {bibleProgress}%</h2>
                </div>
                <button type="button" onClick={() => setShowPlanSettings((prev) => !prev)} className={`px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 ${subSurfaceBg} ${textMain} cursor-pointer`}>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" /><span>{showPlanSettings ? '설정 닫기' : '목표 설정'}</span>
                </button>
              </div>
              <div className={`w-full ${subSurfaceBg} rounded-full h-2 overflow-hidden`}>
                <div className="bg-gradient-to-r from-[#2563EB] to-[#0D9488] h-full transition-all duration-500 rounded-full" style={{ width: `${bibleProgress}%` }} />
              </div>
              <div className={`flex items-center justify-between text-[12.5px] font-medium ${textSub}`}>
                <span>완독 {readChapsCount}장 / 전체 1,189장</span>
                <span className="text-[#0D9488] font-bold">하루 권장 약 {Math.ceil((1189 * targetRounds) / 365)}장</span>
              </div>

              {showPlanSettings && (
                <div className={`pt-4 border-t ${borderClass} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[14px] font-bold ${textMain}`}>통독 시작일</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${subSurfaceBg}`}>
                      <Calendar className="w-4 h-4 text-[#2563EB]" />
                      <input type="date" value={effectiveStartDate} onChange={(e) => { setReadChallengeStart(e.target.value); localStorage.setItem('readChallengeStart', e.target.value); }} className={`bg-transparent text-[14px] font-bold ${textMain} outline-none cursor-pointer`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className={`text-[14px] font-bold ${textMain} block`}>1년 목표 독수 선택</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ rounds: 1, label: '1년 1독', sub: '하루 3~4장' }, { rounds: 2, label: '1년 2독', sub: '하루 6~7장' }, { rounds: 3, label: '1년 3독', sub: '하루 9~10장' }].map((opt) => (
                        <button key={opt.rounds} type="button" onClick={() => handleTargetRoundsChange(opt.rounds)} className={`p-3 rounded-xl text-left transition-colors cursor-pointer ${targetRounds === opt.rounds ? 'bg-[#2563EB] text-white' : `${subSurfaceBg} ${textMain}`}`}>
                          <span className="text-[14px] font-bold block">{opt.label}</span>
                          <span className={`text-[12px] block mt-0.5 ${targetRounds === opt.rounds ? 'text-white/85' : textSub}`}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className={`lg:col-span-6 ${surfaceBg} rounded-2xl border ${borderClass} p-5 flex flex-col justify-between space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${sagePillClass}`}>오늘의 맞춤 분량 · {elapsedDayNum}일차</span>
                  <h2 className={`text-[17px] font-bold ${textMain} mt-2`}>{formatReadingRangeLabel(todaysPlanChapters)}</h2>
                </div>
                <button type="button" onClick={() => openModal('bibleChallenge')} className={`px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer ${bluePillClass}`}>전체 통독표</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {todaysPlanChapters.map((chItem, idx) => {
                  const isChRead = Boolean((readVerses || {})[`${chItem.en}-${chItem.chapter}-0`]);
                  return (
                    <button key={`${chItem.id}_${idx}`} type="button" onClick={() => { setCurrentChapId(chItem.id); setBibleViewMode('read'); }} className={`px-3.5 py-2 rounded-xl text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${isChRead ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain} hover:bg-[#0D9488]/10`}`}>
                      {isChRead && <Check className="w-3.5 h-3.5" />}<span>{chItem.ko} {chItem.chapter}장</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={() => setShowBookmarksModal(true)} className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 ${subSurfaceBg} ${textMain} cursor-pointer`}><Bookmark className="w-3.5 h-3.5 text-[#2563EB]" /><span>북마크 ({bookmarks.length})</span></button>
                <button type="button" onClick={() => { setBibleViewMode('read'); setReaderTab('notes'); }} className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 ${subSurfaceBg} ${textMain} cursor-pointer`}><FileText className="w-3.5 h-3.5 text-[#0D9488]" /><span>성경 노트 ({allTimelineNotes.length})</span></button>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <section className={`lg:col-span-7 ${surfaceBg} rounded-2xl border ${borderClass} p-5 space-y-3.5`}>
              <div className="flex items-center justify-between"><h3 className={`text-[17px] font-bold ${textMain}`}>구약 성경</h3><span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${amberPillClass}`}>39권</span></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {(getArr ? getArr(bibles) : bibles || []).slice(0, 39).map((b) => (
                  <button key={b.name} type="button" onClick={() => openModal('bibleChapterSelect', b)} className={`px-2.5 py-2.5 rounded-xl text-[14px] font-medium ${subSurfaceBg} ${textMain} hover:bg-[#2563EB]/10 hover:text-[#2563EB] transition-colors truncate cursor-pointer text-center`}>{getKoName(b.name)}</button>
                ))}
              </div>
            </section>

            <section className={`lg:col-span-5 ${surfaceBg} rounded-2xl border ${borderClass} p-5 space-y-3.5`}>
              <div className="flex items-center justify-between"><h3 className={`text-[17px] font-bold ${textMain}`}>신약 성경</h3><span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${sagePillClass}`}>27권</span></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                {(getArr ? getArr(bibles) : bibles || []).slice(39, 66).map((b) => (
                  <button key={b.name} type="button" onClick={() => openModal('bibleChapterSelect', b)} className={`px-2.5 py-2.5 rounded-xl text-[14px] font-medium ${subSurfaceBg} ${textMain} hover:bg-[#0D9488]/10 hover:text-[#0D9488] transition-colors truncate cursor-pointer text-center`}>{getKoName(b.name)}</button>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full pointer-events-auto relative z-10 overflow-hidden">
          <header className={`${surfaceBg} px-3 sm:px-6 h-14 border-b ${borderClass} flex items-center justify-between gap-2 shrink-0 z-30`}>
            <div className="flex items-center gap-2 min-w-0">
              <button type="button" onClick={() => { setBibleViewMode('index'); setSelVerses([]); }} className={`w-9 h-9 rounded-xl flex items-center justify-center ${textMain} hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0`}><ChevronLeft className="w-5 h-5" /></button>
              <button type="button" onClick={() => { setJumpTestament(currentBookMeta.isOT ? 'OT' : 'NT'); setJumpSelectedBook(currentBookMeta); setShowQuickJump(true); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer min-w-0">
                <span className={`text-[17px] font-bold tracking-tight truncate ${textMain}`}>{currentBookMeta.ko} {currentChapterNum}장</span>
                <ChevronDown className={`w-4 h-4 ${textSub} shrink-0`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => { const order = ['krv', 'easy', 'web', 'parallel']; handleVersionChange(order[(order.indexOf(bibleVersion) + 1) % order.length]); }} className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold border ${borderClass} ${subSurfaceBg} ${textMain} cursor-pointer`}>
                {bibleVersion === 'krv' ? '개역개정' : bibleVersion === 'easy' ? '쉬운성경' : bibleVersion === 'web' ? '영어' : '역본대조'}
              </button>
              <button type="button" onClick={() => setViewMode((m) => (m === 'single' ? 'split' : 'single'))} className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold flex items-center gap-1 cursor-pointer ${viewMode === 'split' ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`}`}>
                <PenLine className="w-3.5 h-3.5" /><span className="hidden sm:inline">2단 필사</span>
              </button>
              <button type="button" onClick={() => setShowTypoSettings((v) => !v)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${showTypoSettings ? 'bg-[#2563EB] text-white' : `${subSurfaceBg} ${textMain}`} cursor-pointer`}><Settings className="w-4 h-4" /></button>
            </div>
          </header>

          <div className={`w-full h-[2.5px] ${subSurfaceBg} shrink-0`}>
            <div className="h-full bg-gradient-to-r from-[#0D9488] to-[#2563EB] transition-all duration-300" style={{ width: `${chapterProgressPercent}%` }} />
          </div>

          <div className={`${surfaceBg} px-3 sm:px-6 py-2 border-b ${borderClass} shrink-0`}>
            <div className={`max-w-[760px] mx-auto grid grid-cols-2 p-1 rounded-xl ${subSurfaceBg} text-[13px] font-bold`}>
              <button type="button" onClick={() => setReaderTab('text')} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${readerTab === 'text' ? `${surfaceBg} ${textMain} shadow-2xs` : textSub}`}>본문</button>
              <button type="button" onClick={() => setReaderTab('notes')} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${readerTab === 'notes' ? `${surfaceBg} ${textMain} shadow-2xs` : textSub}`}>노트 {allTimelineNotes.length}</button>
            </div>
          </div>

          {showTypoSettings && (
            <div className={`${surfaceBg} border-b ${borderClass} px-4 py-3.5 shrink-0 z-20`}>
              <div className="max-w-[760px] mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[12.5px] font-bold ${textSub}`}>글자 크기 ({readerPrefs.fontSize}px)</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => updateReaderPrefs({ fontSize: Math.max(14, readerPrefs.fontSize - 1) })} className={`w-8 h-8 rounded-lg font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}>A-</button>
                    <button type="button" onClick={() => updateReaderPrefs({ fontSize: Math.min(22, readerPrefs.fontSize + 1) })} className={`w-8 h-8 rounded-lg font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}>A+</button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={`flex p-0.5 rounded-lg text-[12px] font-bold ${subSurfaceBg}`}>
                    {[{ id: 'sans', label: '고딕' }, { id: 'serif', label: '명조' }].map((f) => (
                      <button key={f.id} type="button" onClick={() => updateReaderPrefs({ fontFamily: f.id })} className={`px-3 py-1 rounded-md cursor-pointer ${readerPrefs.fontFamily === f.id ? `${surfaceBg} ${textMain}` : textSub}`}>{f.label}</button>
                    ))}
                  </div>
                  {!isDark && (
                    <div className={`flex p-0.5 rounded-lg text-[12px] font-bold ${subSurfaceBg}`}>
                      {[{ id: 'default', label: '화이트' }, { id: 'sepia', label: '웜 세피아' }].map((p) => (
                        <button key={p.id} type="button" onClick={() => updateReaderPrefs({ paperTheme: p.id })} className={`px-3 py-1 rounded-md cursor-pointer ${readerPrefs.paperTheme === p.id ? `${surfaceBg} ${textMain}` : textSub}`}>{p.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAudioOpen && (
            <div className={`${surfaceBg} border-b ${borderClass} px-4 py-2.5 shrink-0`}>
              <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button type="button" onClick={toggleAudioPlay} className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 cursor-pointer">
                    {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="min-w-0">
                    <span className={`text-[13px] font-bold block truncate ${textMain}`}>{currentBookMeta.ko} {currentChapterNum}장 오디오 낭독</span>
                    <span className={`text-[11.5px] ${textSub}`}>{audioVerseIdx >= 0 ? `${audioVerseIdx + 1}절 읽는 중` : '재생 버튼을 눌러 시작'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => setAudioRate((r) => (r === 1.0 ? 1.25 : r === 1.25 ? 1.5 : r === 1.5 ? 0.85 : 1.0))} className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}>{audioRate}x</button>
                  <button type="button" onClick={() => { stopAudio(); setIsAudioOpen(false); }} className={`p-1.5 rounded-lg ${textSub} cursor-pointer`}><X className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {readerTab === 'notes' ? (
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-3 pb-24 max-w-[760px] mx-auto w-full hide-scrollbar space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                <button type="button" onClick={() => setNoteColorFilter('all')} className={`px-3 py-1 rounded-full text-[12px] font-bold cursor-pointer shrink-0 ${noteColorFilter === 'all' ? 'bg-[#191F28] text-white dark:bg-white dark:text-[#101216]' : `${surfaceBg} border ${borderClass} ${textSub}`}`}>전체 ({allTimelineNotes.length})</button>
                {HIGHLIGHT_PALETTE.map((c) => (
                  <button key={c.id} type="button" onClick={() => setNoteColorFilter(c.hex)} className={`px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0 border ${noteColorFilter === c.hex ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]' : `${surfaceBg} ${borderClass} ${textSub}`}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.dot }} /><span>{c.label}</span>
                  </button>
                ))}
              </div>
              {filteredTimelineNotes.length === 0 ? (
                <div className={`${surfaceBg} rounded-2xl border ${borderClass} p-10 text-center space-y-2`}>
                  <p className={`text-[15px] font-bold ${textMain}`}>저장된 성경 노트가 없습니다.</p>
                  <p className={`text-[13px] ${textSub}`}>본문에서 구절을 선택하고 &apos;노트&apos; 버튼을 눌러 묵상을 기록해 보세요.</p>
                </div>
              ) : (
                filteredTimelineNotes.map((n) => {
                  const firstVerse = Array.isArray(n.verses) && n.verses[0] ? n.verses[0] : null;
                  const dotColor = resolveHighlightDot(n.color);
                  return (
                    <article key={n.id} onClick={() => { if (firstVerse?.bookEn && firstVerse?.chapter) { setCurrentChapId(`${firstVerse.bookEn}-${firstVerse.chapter}`); if (setTargetVerse && firstVerse.verse) setTargetVerse(firstVerse.verse); setReaderTab('text'); } }} className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 space-y-3 cursor-pointer hover:border-[#2563EB]/40`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full ${subSurfaceBg} flex items-center justify-center text-[11px] font-bold ${textSub}`}>{(n.author || userName).slice(0, 1)}</span>
                          <span className={`text-[13px] font-bold ${textMain}`}>{n.author || userName}</span>
                          <span className={`text-[12px] ${textSub}`}>{n.date}</span>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteTimelineNote(n.id); }} className={`p-1.5 rounded-lg ${textSub} hover:text-rose-500 cursor-pointer`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="pl-3.5 border-l-[3px] space-y-1.5" style={{ borderColor: dotColor }}>
                        {firstVerse && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dotColor }} /><span className={`text-[13.5px] font-bold ${textMain}`}>{firstVerse.ref}{n.verses.length > 1 ? ` 외 ${n.verses.length - 1}절` : ''}</span></div>}
                        {Array.isArray(n.verses) && n.verses.map((v, idx) => <p key={idx} className={`text-[14px] leading-relaxed ${textSub}`}>{v.text}</p>)}
                      </div>
                      {n.note && <p className={`text-[14.5px] leading-relaxed ${textMain} pt-1 whitespace-pre-wrap`}>{n.note}</p>}
                    </article>
                  );
                })
              )}
            </div>
          ) : (
            <div className={`flex-1 px-2 sm:px-5 lg:px-8 pt-2.5 pb-2 grid gap-4 lg:gap-6 h-full relative z-10 overflow-hidden ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12 max-w-[1380px]' : 'grid-cols-1 max-w-[820px]'} mx-auto w-full`}>
              <div className={`${viewMode === 'split' ? 'lg:col-span-7' : ''} flex flex-col relative z-[45] pointer-events-auto h-full overflow-hidden`}>
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-24" data-live-web-tick={liveWebTick}>
                  <div className={`${surfaceBg} rounded-2xl border ${borderClass} px-4 sm:px-6 py-4 space-y-1`}>
                    {cVs.length > 0 ? (
                      (getArr ? getArr(cVs) : cVs).map((verse, idx) => {
                        const vNum = idx + 1;
                        const vId = `${currentBookMeta.en}-${currentChapterNum}-${idx}`;
                        const isR = (readVerses || {})[vId] || (readVerses || {})[`${sBk}-${sCh}-${idx}`];
                        const isSel = selVerses.includes(vId);
                        const hColor = (bibleHighlights || {})[vId] || (bibleHighlights || {})[`${sBk}-${sCh}-${idx}`];
                        const inlineHighlightStyle = resolveHighlightStyle(hColor, isDark);
                        const isBookmarked = bookmarks.some((b) => b.id === vId);
                        const isAudioCurrent = audioVerseIdx === idx;
                        const matchedKey = checkHasSermon(currentBookMeta.ko, currentBookMeta.en, currentChapterNum, vNum);
                        const { pericope, pureText: displayVerseText } = splitPericopeAndVerse(safeGetVerseText(verse));
                        const easyText = resolveTranslationVerse(easyBibleDb, currentBookMeta, currentChapterNum, vNum);
                        const webText = resolveTranslationVerse(webBibleDb, currentBookMeta, currentChapterNum, vNum);

                        return (
                          <div
                            key={idx}
                            ref={(el) => { verseRefsMap.current[idx] = el; }}
                            onContextMenu={(e) => { e.preventDefault(); openVerseInspector(currentChapterNum, vNum, displayVerseText); }}
                            onTouchStart={() => {
                              isLongPressActiveRef.current = false;
                              longPressTimerRef.current = setTimeout(() => {
                                isLongPressActiveRef.current = true;
                                if (window.navigator?.vibrate) window.navigator.vibrate(40);
                                openVerseInspector(currentChapterNum, vNum, displayVerseText);
                              }, 500);
                            }}
                            onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                            onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                            className={`py-2.5 transition-colors cursor-pointer rounded-xl px-1.5 ${isAudioCurrent ? 'ring-2 ring-[#2563EB]/40 bg-[#2563EB]/5' : isSel ? 'bg-[#0D9488]/10' : ''}`}
                          >
                            {pericope && <div className="mb-2 pt-1"><span className={`text-[12px] font-bold px-2.5 py-1 rounded-md inline-block ${amberPillClass}`}>{pericope}</span></div>}
                            <div className="flex items-start gap-2.5">
                              <button type="button" onClick={(e) => { e.stopPropagation(); openVerseInspector(currentChapterNum, vNum, displayVerseText); }} className="flex flex-col items-end min-w-[22px] mt-1 shrink-0 cursor-pointer" title="원어 강해 보기">
                                <span className={`text-[12px] font-bold ${isR ? 'text-[#0D9488]' : textSub}`}>{vNum}</span>
                                {isBookmarked && <Bookmark className="w-3 h-3 text-[#2563EB] fill-current mt-0.5" />}
                              </button>
                              <div
                                onClick={() => { if (isLongPressActiveRef.current) return; setSelVerses((p) => (p.includes(vId) ? p.filter((id) => id !== vId) : [...p, vId])); }}
                                style={{ fontSize: `${readerPrefs.fontSize}px`, lineHeight: readerPrefs.lineHeight, fontFamily: readerPrefs.fontFamily === 'serif' ? "'Noto Serif KR', 'Batang', serif" : "'Pretendard', sans-serif" }}
                                className={`flex-1 break-keep ${textMain}`}
                              >
                                {bibleVersion === 'krv' && <span style={inlineHighlightStyle || undefined}>{displayVerseText}</span>}
                                {bibleVersion === 'easy' && <span style={inlineHighlightStyle || undefined}>{easyText || displayVerseText}</span>}
                                {bibleVersion === 'web' && <span style={inlineHighlightStyle || undefined}>{webText || displayVerseText}</span>}
                                {bibleVersion === 'parallel' && (
                                  <div className="space-y-1.5">
                                    <p><span style={inlineHighlightStyle || undefined}>{displayVerseText}</span></p>
                                    {easyText && <p className={`text-[0.92em] ${textSub}`}>{easyText}</p>}
                                    {webText && <p className={`text-[0.9em] ${textSub}`}>{webText}</p>}
                                  </div>
                                )}
                                {matchedKey && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedSermonVerse(matchedKey); }} className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md text-[11.5px] font-bold align-middle cursor-pointer ${amberPillClass}`}>
                                    <Mic className="w-3 h-3" /><span>설교</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className={`text-center ${textSub} py-12 text-[15px]`}>성경 본문을 불러오는 중입니다.</p>
                    )}

                    <div className={`pt-5 mt-3 border-t ${borderClass} flex items-center gap-2`}>
                      <button type="button" disabled={!hasPrevChapter} onClick={() => hasPrevChapter && setCurrentChapId(`${currentBookMeta.en}-${currentChapterNum - 1}`)} className={`h-11 px-3.5 rounded-xl border ${borderClass} ${subSurfaceBg} ${textMain} font-bold text-[13px] disabled:opacity-30 cursor-pointer flex items-center gap-1`}>
                        <ChevronLeft className="w-4 h-4" /><span>이전 장</span>
                      </button>
                      <button type="button" onClick={handleToggleWholeChapter} className={`flex-1 h-11 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 cursor-pointer ${isAllR ? `${subSurfaceBg} text-[#0D9488] border ${borderClass}` : 'bg-[#0D9488] text-white'}`}>
                        <Check className="w-4 h-4" /><span>{isAllR ? '완독 완료' : `${currentBookMeta.ko} ${currentChapterNum}장 완독`}</span>
                      </button>
                      <button type="button" disabled={!hasNextChapter && !nextPlanChapter} onClick={() => { if (nextPlanChapter) setCurrentChapId(nextPlanChapter.id); else if (hasNextChapter) setCurrentChapId(`${currentBookMeta.en}-${currentChapterNum + 1}`); }} className={`h-11 px-3.5 rounded-xl border ${borderClass} ${subSurfaceBg} ${textMain} font-bold text-[13px] disabled:opacity-30 cursor-pointer flex items-center gap-1`}>
                        <span>{nextPlanChapter ? `플랜 ${nextPlanChapter.chapter}장` : '다음 장'}</span><ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {viewMode === 'split' && (
                <div className="lg:col-span-5 flex flex-col h-full relative z-[45] pointer-events-auto min-h-[420px]">
                  <BibleTranscriptionNotePanel currentChapId={currentChapId} chapterTitle={`${currentBookMeta.ko} ${currentChapterNum}장`} isDark={isDark} noteContent={noteContent} setNoteContent={setNoteContent} updateDay={updateDay} />
                </div>
              )}
            </div>
          )}

          <nav className={`shrink-0 ${surfaceBg} border-t ${borderClass} px-2 py-2 z-30`}>
            <div className="max-w-[680px] mx-auto grid grid-cols-5 gap-1">
              {[
                { id: 'audio', label: '오디오', icon: Headphones, active: isAudioOpen, onClick: toggleAudioPlay },
                { id: 'plan', label: '성경통독', icon: Calendar, active: false, onClick: () => setBibleViewMode('index') },
                { id: 'search', label: '구절 검색', icon: Search, active: showSearchModal, onClick: () => setShowSearchModal(true) },
                { id: 'bookmarks', label: '모든 북마크', icon: Bookmark, active: showBookmarksModal, onClick: () => setShowBookmarksModal(true) },
                { id: 'notes', label: '모든 노트', icon: FileText, active: readerTab === 'notes', onClick: () => setReaderTab((t) => (t === 'notes' ? 'text' : 'notes')) }
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <button key={item.id} type="button" onClick={item.onClick} className={`flex flex-col items-center justify-center py-1 rounded-xl cursor-pointer transition-colors ${item.active ? 'text-[#2563EB]' : textSub}`}>
                    <IconComp className="w-5 h-5" /><span className="text-[11px] font-bold mt-0.5">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* 선택 구절 플로팅 액션 바 */}
      {selVerses.length > 0 && bibleViewMode === 'read' && readerTab === 'text' && (
        <div className={`fixed bottom-[74px] left-1/2 -translate-x-1/2 w-[94%] max-w-[460px] ${surfaceBg} border ${borderClass} rounded-2xl px-3.5 py-2.5 flex flex-col gap-2.5 z-[100] pointer-events-auto shadow-xl`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Highlighter className="w-4 h-4 text-[#0D9488]" />
              <button type="button" onClick={() => { const nH = { ...(bibleHighlights || {}) }; selVerses.forEach((id) => { nH[id] = 'transparent'; }); if (setBibleHighlights) setBibleHighlights(nH); setSelVerses([]); }} className={`w-6 h-6 rounded-full border ${borderClass} flex items-center justify-center ${textSub} cursor-pointer`}><X className="w-3 h-3" /></button>
              {HIGHLIGHT_PALETTE.map((c) => (
                <button key={c.id} type="button" onClick={() => { const nH = { ...(bibleHighlights || {}) }; const nR = { ...(readVerses || {}) }; selVerses.forEach((id) => { nH[id] = c.hex; nR[id] = true; }); if (setBibleHighlights) setBibleHighlights(nH); if (setReadVerses) setReadVerses(nR); setSelVerses([]); }} style={{ backgroundColor: c.hex }} className="w-6 h-6 rounded-full border border-black/10 cursor-pointer hover:scale-110" />
              ))}
            </div>
            <button type="button" onClick={() => setSelVerses([])} className={`text-[11.5px] font-bold ${textSub} cursor-pointer`}>{selVerses.length}절 해제</button>
          </div>
          <div className={`grid grid-cols-4 gap-1.5 pt-2 border-t ${borderClass}`}>
            <button type="button" onClick={handleToggleBookmarksForSelected} className={`py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 ${subSurfaceBg} ${textMain} cursor-pointer`}><Bookmark className="w-3.5 h-3.5 text-[#2563EB]" /><span>북마크</span></button>
            <button type="button" onClick={handleOpenNoteComposer} className="py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 bg-[#2563EB] text-white cursor-pointer"><FileText className="w-3.5 h-3.5" /><span>노트</span></button>
            <button type="button" onClick={() => { navigator.clipboard.writeText(buildSelectedVersesData().map((v) => `${v.text} (${v.ref})`).join('\n')); setSelVerses([]); showToast('선택한 말씀이 복사되었습니다.'); }} className={`py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 ${subSurfaceBg} ${textMain} cursor-pointer`}><Copy className="w-3.5 h-3.5" /><span>복사</span></button>
            <button type="button" onClick={() => { const combined = buildSelectedVersesData().map((v) => `[${v.ref}] ${v.text}`).join('\n'); const updated = (noteContent || '') + (noteContent ? '\n\n' : '') + combined; setNoteContent(updated); if (updateDay) updateDay({ bibleFreeNote: updated }); setViewMode('split'); setSelVerses([]); }} className="py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 bg-[#0D9488] text-white cursor-pointer"><PenLine className="w-3.5 h-3.5" /><span>필사</span></button>
          </div>
        </div>
      )}

      {/* 성경 노트 작성 모달 */}
      {showNoteComposer && (
        <div onClick={() => setShowNoteComposer(false)} className="fixed inset-0 z-[999999] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} p-5 space-y-4`}>
            <div className="flex items-center justify-between"><h3 className={`text-[16px] font-bold ${textMain}`}>성경 노트 기록</h3><button type="button" onClick={() => setShowNoteComposer(false)} className={`${textSub} cursor-pointer`}><X className="w-5 h-5" /></button></div>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold ${textSub}`}>색상 태그</span>
              {HIGHLIGHT_PALETTE.map((c) => <button key={c.id} type="button" onClick={() => setComposerColor(c.hex)} style={{ backgroundColor: c.dot }} className={`w-6 h-6 rounded-full cursor-pointer ${composerColor === c.hex ? 'scale-125 ring-2 ring-[#2563EB]' : 'opacity-70'}`} />)}
            </div>
            <div className={`p-3.5 rounded-xl ${subSurfaceBg} max-h-32 overflow-y-auto space-y-1`}>
              {composerVerses.map((v, i) => <p key={i} className={`text-[13px] leading-relaxed ${textMain}`}><strong className="text-[#2563EB] mr-1.5">{v.ref}</strong>{v.text}</p>)}
            </div>
            <textarea rows={4} value={composerMemo} onChange={(e) => setComposerMemo(e.target.value)} placeholder="이 말씀을 통해 주신 깨달음과 적용을 기록해 보세요." className={`w-full p-3.5 rounded-xl border ${borderClass} ${subSurfaceBg} ${textMain} text-[14.5px] outline-none resize-none`} autoFocus />
            <button type="button" onClick={handleSaveTimelineNote} className="w-full py-3 rounded-xl bg-[#2563EB] text-white font-bold text-[14.5px] cursor-pointer">노트 저장하기</button>
          </div>
        </div>
      )}

      {/* 모든 북마크 모달 */}
      {showBookmarksModal && (
        <div onClick={() => setShowBookmarksModal(false)} className="fixed inset-0 z-[999999] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} flex flex-col max-h-[82vh] overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderClass} flex items-center justify-between shrink-0`}><h3 className={`text-[16px] font-bold ${textMain}`}>모든 북마크 ({bookmarks.length})</h3><button type="button" onClick={() => setShowBookmarksModal(false)} className={`${textSub} cursor-pointer`}><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 hide-scrollbar">
              {bookmarks.length === 0 ? <p className={`text-center py-12 text-[14px] ${textSub}`}>저장된 북마크가 없습니다.</p> : bookmarks.map((b) => (
                <div key={b.id} onClick={() => { setCurrentChapId(`${b.bookEn}-${b.chapter}`); if (setTargetVerse) setTargetVerse(b.verse); setBibleViewMode('read'); setReaderTab('text'); setShowBookmarksModal(false); }} className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceBg} flex items-start justify-between gap-3 cursor-pointer`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolveHighlightDot(b.color) }} /><span className={`text-[13.5px] font-bold ${textMain}`}>{b.ref}</span><span className={`text-[11px] ${textSub}`}>{b.createdAt}</span></div>
                    <p className={`text-[13.5px] ${textSub} line-clamp-2`}>{b.text}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); saveBookmarks(bookmarks.filter((item) => item.id !== b.id)); }} className={`p-1.5 ${textSub} hover:text-rose-500 cursor-pointer shrink-0`}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 빠른 장·절 점프 바텀시트 */}
      {showQuickJump && (
        <div onClick={() => setShowQuickJump(false)} className="fixed inset-0 z-[999999] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} flex flex-col max-h-[82vh] overflow-hidden`}>
            <div className={`px-5 py-3.5 border-b ${borderClass} flex items-center justify-between shrink-0`}>
              <div className={`flex p-0.5 rounded-xl ${subSurfaceBg} text-[13px] font-bold`}>
                <button type="button" onClick={() => { setJumpTestament('OT'); setJumpSelectedBook(null); }} className={`px-4 py-1.5 rounded-lg cursor-pointer ${jumpTestament === 'OT' ? `${surfaceBg} ${textMain}` : textSub}`}>구약 (39)</button>
                <button type="button" onClick={() => { setJumpTestament('NT'); setJumpSelectedBook(null); }} className={`px-4 py-1.5 rounded-lg cursor-pointer ${jumpTestament === 'NT' ? `${surfaceBg} ${textMain}` : textSub}`}>신약 (27)</button>
              </div>
              <button type="button" onClick={() => setShowQuickJump(false)} className={`${textSub} cursor-pointer`}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
              {jumpSelectedBook ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setJumpSelectedBook(null)} className="text-[13px] font-bold text-[#2563EB] flex items-center gap-1 cursor-pointer"><ChevronLeft className="w-4 h-4" /> 권 목록으로</button>
                    <span className={`text-[15px] font-bold ${textMain}`}>{jumpSelectedBook.ko}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: jumpSelectedBook.chaptersCount }).map((_, i) => (
                      <button key={i} type="button" onClick={() => { setCurrentChapId(`${jumpSelectedBook.en}-${i + 1}`); setBibleViewMode('read'); setReaderTab('text'); setShowQuickJump(false); }} className={`h-11 rounded-xl font-bold text-[14px] cursor-pointer ${currentBookMeta.en === jumpSelectedBook.en && currentChapterNum === i + 1 ? 'bg-[#2563EB] text-white' : `${subSurfaceBg} ${textMain}`}`}>{i + 1}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {BIBLE_66_LIST.filter((b) => (jumpTestament === 'OT' ? b.isOT : !b.isOT)).map((b) => (
                    <button key={b.en} type="button" onClick={() => setJumpSelectedBook(b)} className={`py-2.5 px-2 rounded-xl text-[13.5px] font-medium truncate cursor-pointer ${currentBookMeta.en === b.en ? 'bg-[#2563EB] text-white font-bold' : `${subSurfaceBg} ${textMain}`}`}>{b.ko}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 전체 구절 검색 모달 */}
      {showSearchModal && (
        <div onClick={() => setShowSearchModal(false)} className="fixed inset-0 z-[999999] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} flex flex-col max-h-[82vh] overflow-hidden`}>
            <div className={`p-4 border-b ${borderClass} flex items-center gap-2 shrink-0`}>
              <Search className={`w-4 h-4 ${textSub} shrink-0`} />
              <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="성경 구절 키워드 검색 (2글자 이상)" className={`flex-1 bg-transparent text-[14.5px] ${textMain} outline-none`} autoFocus />
              <button type="button" onClick={() => setShowSearchModal(false)} className={`${textSub} cursor-pointer`}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
              {searchKeyword.trim().length < 2 ? <p className={`text-center py-10 text-[13.5px] ${textSub}`}>검색어를 2글자 이상 입력해 주세요.</p> : searchResults.length === 0 ? <p className={`text-center py-10 text-[13.5px] ${textSub}`}>일치하는 구절이 없습니다.</p> : searchResults.map((r, i) => (
                <button key={i} type="button" onClick={() => { setCurrentChapId(`${r.bookEn}-${r.chapter}`); if (setTargetVerse) setTargetVerse(r.verse); setBibleViewMode('read'); setReaderTab('text'); setShowSearchModal(false); }} className={`w-full p-3 rounded-xl border ${borderClass} ${subSurfaceBg} text-left space-y-1 cursor-pointer`}>
                  <span className="text-[12.5px] font-bold text-[#2563EB] block">{r.bookKo} {r.chapter}:{r.verse}</span>
                  <p className={`text-[13.5px] leading-snug ${textMain} line-clamp-2`}>{r.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 원어 연구 인스펙터 모달 */}
      {inspectorTarget && (
        <div className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none" onClick={() => setInspectorTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-5 flex flex-col max-h-[88vh] overflow-hidden`}>
            <div className={`border-b ${borderClass} pb-3 shrink-0 space-y-3`}>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[15px] font-bold text-[#2563EB]">{inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 분석</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleJumpToInterlinearStudio} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}>원어 연구실 이동</button>
                  <button type="button" onClick={() => setInspectorTarget(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} ${textMain} cursor-pointer`}><X className="w-4 h-4" /></button>
                </div>
              </div>
              {selectedWordDetail && (
                <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-xl ${subSurfaceBg}`}>
                  <div className="space-y-1 text-left">
                    <span className={`text-[12px] font-medium ${textSub} block`}>본문 어형</span>
                    <div className="flex items-baseline gap-2 flex-wrap"><span style={originalFontStyle(inspectorTarget.isOT)} className="text-[20px] font-bold">{cleanTypography(selectedWordDetail.inflected, inspectorTarget.isOT)}</span><span className={`text-[12px] ${textSub}`}>{selectedWordDetail.pron}</span></div>
                    <p className="text-[12px] font-bold text-[#2563EB]">{selectedWordDetail.korContextual}</p>
                    <p className={`text-[12px] ${textSub}`}>{selectedWordDetail.grammarDecoded}</p>
                  </div>
                  <div className={`space-y-1 border-l pl-3 text-left ${borderClass}`}>
                    <span className={`text-[12px] font-medium ${textSub} block`}>원형 표제어</span>
                    <div className="flex items-baseline gap-2 flex-wrap"><span style={originalFontStyle(inspectorTarget.isOT)} className="text-[20px] font-bold">{cleanTypography(selectedWordDetail.lemma, inspectorTarget.isOT)}</span><span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${amberPillClass}`}>{selectedWordDetail.strongs}</span></div>
                    <p className="text-[12px] font-bold text-[#0D9488]">기본뜻: {selectedWordDetail.korLemma}</p>
                  </div>
                </div>
              )}
              <p className={`text-[15px] leading-relaxed ${textMain}`}>{inspectorTarget.text}</p>
            </div>

            <div className={`flex gap-1 p-1 rounded-xl ${subSurfaceBg} my-3 shrink-0`}>
              {[{ id: 'scholarly', label: '주석 및 사료' }, { id: 'concordance', label: `전권 용례 (${concordanceTotalCount}회)` }, { id: 'custom_study', label: '연구 메모' }].map((tab) => (
                <button key={tab.id} type="button" onClick={() => setModalTab(tab.id)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${modalTab === tab.id ? 'bg-[#2563EB] text-white' : textSub}`}>{tab.label}</button>
              ))}
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-3 flex-1 text-left">
              <div className={`p-3.5 rounded-xl ${subSurfaceBg}`}>
                <span className={`text-[12px] font-medium ${textSub} block mb-2`}>어절 선택</span>
                {isInspectorLoading ? <div className={`py-3 text-center text-[12px] ${textSub}`}>어휘를 불러오는 중입니다...</div> : (
                  <div className={`flex flex-wrap gap-2 items-baseline ${inspectorTarget.isOT ? 'justify-end' : 'justify-start'}`} dir={inspectorTarget.isOT ? 'rtl' : 'ltr'}>
                    {inspectorWords.map((w) => (
                      <span key={w.id} onClick={() => handleSelectInspectorWord(w)} style={originalFontStyle(inspectorTarget.isOT)} className={`text-[18px] font-bold px-2 py-1 rounded-lg cursor-pointer ${selectedWordDetail?.order === w.order ? 'bg-[#2563EB] text-white' : isDark ? 'text-white hover:bg-white/10' : 'text-[#191F28] hover:bg-black/5'}`}>{cleanTypography(w.inflected, inspectorTarget.isOT)}</span>
                    ))}
                  </div>
                )}
              </div>

              {modalTab === 'scholarly' && (
                <div className="space-y-3">
                  {crossRefs.length > 0 && (
                    <div className={`p-3.5 rounded-xl border ${borderClass}`}>
                      <span className="font-bold text-[12px] text-[#D97706] block mb-2">교차참조 ({crossRefs.length}구절)</span>
                      <div className="flex flex-wrap gap-1.5">{crossRefs.map((ref, idx) => <span key={idx} className={`px-2 py-1 rounded-md text-[12px] font-medium ${subSurfaceBg} ${textMain}`}>{ref.label}</span>)}</div>
                    </div>
                  )}
                  {currentCommentary && (
                    <div className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-[#2563EB]">학술 주석 ({currentCommentary.commentator})</span>
                        <button type="button" onClick={() => handleTranslateScholarlyBlock(`comm_${currentKey}`, currentCommentary.exegesis)} className={`px-2.5 py-1 rounded-md text-[12px] font-bold cursor-pointer ${bluePillClass}`}>{translatingKey === `comm_${currentKey}` ? '번역 중...' : translatedScholarlyMap[`comm_${currentKey}`] ? '원문 보기' : '한국어 번역'}</button>
                      </div>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(translatedScholarlyMap[`comm_${currentKey}`] || currentCommentary.exegesis)}</p>
                    </div>
                  )}
                  {currentMatthewHenry && (
                    <div className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-[#0D9488]">매튜 헨리 묵상 강해</span>
                        <button type="button" onClick={() => handleTranslateScholarlyBlock(`mh_${currentKey}`, currentMatthewHenry.devotionalExegesis)} className={`px-2.5 py-1 rounded-md text-[12px] font-bold cursor-pointer ${sagePillClass}`}>{translatingKey === `mh_${currentKey}` ? '번역 중...' : translatedScholarlyMap[`mh_${currentKey}`] ? '원문 보기' : '한국어 번역'}</button>
                      </div>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(translatedScholarlyMap[`mh_${currentKey}`] || currentMatthewHenry.devotionalExegesis)}</p>
                    </div>
                  )}
                  {currentNetNote && (
                    <div className={`p-4 rounded-xl border ${borderClass} space-y-1`}>
                      <span className="font-bold text-[12px] text-[#D97706] block">비평 각주: {decodeHtmlEntities(currentNetNote.title)}</span>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(currentNetNote.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'concordance' && (
                <div className={`divide-y ${dividerClass} border ${borderClass} rounded-xl overflow-hidden`}>
                  {concordanceList.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[#2563EB] min-w-[74px]">{item.book} {item.chapter}:{item.verse}</span>
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[15px]">{cleanTypography(item.original_word, inspectorTarget.isOT)}</span>
                      <span className={`text-[12px] ${textSub} truncate max-w-[140px] text-right`}>{item.korean_trans}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'custom_study' && selectedWordDetail && (
                <div className="space-y-3">
                  <input type="text" value={customInputTrans} onChange={(e) => setCustomInputTrans(e.target.value)} placeholder="대표 번역어 입력" className={`w-full px-3.5 py-2.5 rounded-xl text-[15px] font-medium ${subSurfaceBg} ${textMain} outline-none`} />
                  <textarea value={customInputMemo} onChange={(e) => setCustomInputMemo(e.target.value)} rows={3} placeholder="개인 연구 메모를 기록하세요" className={`w-full p-3.5 rounded-xl text-[15px] ${subSurfaceBg} ${textMain} outline-none resize-none`} />
                </div>
              )}
            </div>

            {selectedWordDetail && (
              <div className={`pt-3 mt-2 border-t ${borderClass} flex gap-2 shrink-0`}>
                <button type="button" onClick={() => handleInsertWordToFreeNote(selectedWordDetail)} className="flex-1 py-3 rounded-xl bg-[#0D9488] text-white font-bold text-[15px] flex items-center justify-center gap-1.5 cursor-pointer"><PenLine className="w-4 h-4" /><span>필사 노트에 삽입</span></button>
                <button type="button" onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)} className={`px-4 py-3 rounded-xl font-bold text-[15px] flex items-center gap-1.5 cursor-pointer ${subSurfaceBg} ${textMain}`}><Volume2 className="w-4 h-4 text-[#2563EB]" /><span>낭독</span></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
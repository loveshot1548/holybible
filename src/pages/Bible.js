// src/pages/Bible.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Globe,
  Highlighter,
  Layers,
  Mic,
  PenLine,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  Sparkles,
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
// 성경 66권 마스터 리스트 & 장수 데이터 (1,189장 완비)
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
  { en: 'Revelation', ko: '요한계시록', abbr: '계', isOT: false, section: '서신서', chaptersCount: 22 }
];

export const BIBLE_66_MAP = {};
BIBLE_66_LIST.forEach((b) => {
  BIBLE_66_MAP[b.en] = b;
  BIBLE_66_MAP[b.ko] = b;
  BIBLE_66_MAP[b.abbr] = b;
});

// =====================================================================
// 365일 맞춤 1독·2독·N독 자동 분할 계산 엔진
// =====================================================================
const ALL_CHAPTER_SEQUENCE = (() => {
  const list = [];
  BIBLE_66_LIST.forEach((book) => {
    for (let ch = 1; ch <= book.chaptersCount; ch++) {
      list.push({
        id: `${book.en}-${ch}`,
        en: book.en,
        ko: book.ko,
        abbr: book.abbr,
        chapter: ch
      });
    }
  });
  return list; // 총 1,189장
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
// 개역개정 4판 통합 파서 엔진
// =====================================================================
export const KRV4_ABBR_TO_EN = {};
BIBLE_66_LIST.forEach((b) => {
  KRV4_ABBR_TO_EN[b.abbr] = b.en;
});

let cachedKrv4Data = null;
let krv4LoadingPromise = null;

export const splitPericopeAndVerse = (rawVerseStr) => {
  if (!rawVerseStr || typeof rawVerseStr !== 'string') {
    return { pericope: null, pureText: rawVerseStr || '' };
  }
  const match = rawVerseStr.match(/^\s*<([^>]+)>\s*(.*)$/);
  if (match) {
    return {
      pericope: match[1].trim(),
      pureText: match[2].trim()
    };
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
        const normalizedText = rawText
          .replace(
            /([^\n\r])((?:창|출|레|민|신|수|삿|룻|삼상|삼하|왕상|왕하|대상|대하|스|느|에|욥|시|잠|전|아|사|렘|애|겔|단|호|욜|암|옵|욘|미|나|합|습|학|슥|말|마|막|눅|요|행|롬|고전|고후|갈|엡|빌|골|살전|살후|딤전|딤후|딛|몬|히|약|벧전|벧후|요일|요이|요삼|유|계)\d+:\d+\s)/g,
            '$1\n$2'
          )
          .replace(/\r?\n[가-힣]{1,2}\d+:([^\d\n\r][^\n\r]*)/g, ' $1');

        const lines = normalizedText.split(/\r?\n/);
        const lineRegex = /^([가-힣]{1,2})(\d+):(\d+)\s+(.*)$/;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const match = line.match(lineRegex);
          if (!match) continue;

          const [, abbr, chStr, vStr, content] = match;
          const enBook = KRV4_ABBR_TO_EN[abbr];
          if (!enBook) continue;

          const koBook = BIBLE_66_MAP[enBook]?.ko || enBook;
          const chIdx = parseInt(chStr, 10) - 1;
          const vIdx = parseInt(vStr, 10) - 1;
          if (chIdx < 0 || vIdx < 0) continue;

          const cleanContent = content.trim();

          [enBook, koBook, abbr].forEach((key) => {
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
  const chIdx = Math.max(0, (parseInt(chapterNum, 10) || 1) - 1);
  const rawArr = db[bookKey]?.[chIdx] || db[BIBLE_66_MAP[bookKey]?.ko]?.[chIdx] || [];
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
  const ch = Number(chNum);
  const v = Number(vNum);

  const flatCandidates = [
    `${ko}-${ch}-${v}`,
    `${en}-${ch}-${v}`,
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

  const bookObj = db[ko] || db[en] || db[abbr];
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
      const cStr = caseMap[caseChar] || '';
      const gnStr = `${gMap[details[2]] || ''} ${nMap[details[1]] || ''}`;
      return { label: `${posMap[pos] || '명사'} · ${cStr} · ${gnStr}`.trim(), type: pos === 'N' ? 'noun' : 'modifier', caseType: caseChar, isVerb: false };
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
      const stateStr = stateMap[parts[3]] ? `(${stateMap[parts[3]]})` : '';
      return {
        label: `${mainType === 'nmpr' ? '고유명사' : '명사'}${stateStr} · ${gMap[parts[1]] || ''} ${nMap[parts[2]] || ''}`.trim(),
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
// 2단 필사 전용 필기 브러시 렌더러
// =====================================================================
const renderStroke = (ctx, stroke, isDark) => {
  const { tool, color, size, points } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const resolvedColor = isDark && color === '#191F28' ? '#F9FAFB' : color;

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
      ctx.strokeStyle = color === '#191F28' ? 'rgba(49, 130, 246, 0.35)' : color;
      ctx.lineWidth = size * 3.8;
      ctx.globalAlpha = isDark ? 0.5 : 0.35;
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
// 2단 필사 전용 필기 & 텍스트 노트 패널 (토스 스타일 · 이모지 0%)
// =====================================================================
const BibleTranscriptionNotePanel = ({ currentChapId, chapterTitle, isDark, noteContent, setNoteContent, updateDay }) => {
  const [panelTab, setPanelTab] = useState('handwriting');
  const [paperStyle, setPaperStyle] = useState('line');

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);

  const storageKey = `bible_vector_strokes_${currentChapId || 'Genesis-1'}`;

  const [strokes, setStrokes] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [redoStack, setRedoStack] = useState([]);

  const [currentTool, setCurrentTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#191F28');
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setStrokes(saved ? JSON.parse(saved) : []);
      setRedoStack([]);
    } catch {
      setStrokes([]);
    }
  }, [storageKey]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    strokes.forEach((s) => renderStroke(ctx, s, isDark));

    if (currentPointsRef.current.length > 0) {
      renderStroke(
        ctx,
        {
          tool: currentTool,
          color: strokeColor,
          size: strokeWidth,
          points: currentPointsRef.current
        },
        isDark
      );
    }
  }, [strokes, currentTool, strokeColor, strokeWidth, isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(strokes));
    } catch (_) {}
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
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pos = getCoordinates(e);
    isDrawingRef.current = true;
    currentPointsRef.current = [pos];
    e.target.setPointerCapture?.(e.pointerId);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      renderStroke(ctx, { tool: currentTool, color: strokeColor, size: strokeWidth, points: [pos] }, isDark);
    }
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
      const newStroke = {
        id: Date.now() + Math.random(),
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        points: [...currentPointsRef.current]
      };
      setStrokes((prev) => [...prev, newStroke]);
      setRedoStack([]);
    }
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack((p) => [...p, last]);
    setStrokes((p) => p.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((p) => p.slice(0, -1));
    setStrokes((p) => [...p, last]);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (!window.confirm('이 장의 손필기를 모두 지우시겠습니까?')) return;
    setStrokes([]);
    setRedoStack([]);
    localStorage.removeItem(storageKey);
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.fillStyle = isDark ? '#181B20' : '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.scale(dpr, dpr);
    strokes.forEach((s) => renderStroke(ctx, s, isDark));

    const link = document.createElement('a');
    link.download = `${chapterTitle || '말씀'}_필사노트.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const colorPalette = [
    { id: 'dark', color: '#191F28' },
    { id: 'blue', color: '#3182F6' },
    { id: 'gray', color: '#6B7684' },
    { id: 'navy', color: '#1E3A8A' }
  ];

  const tools = [
    { id: 'pen', label: '볼펜' },
    { id: 'pencil', label: '연필' },
    { id: 'marker', label: '마커' },
    { id: 'highlighter', label: '형광펜' },
    { id: 'eraser', label: '지우개' }
  ];

  const getPaperBg = () => {
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 31, 40, 0.1)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 31, 40, 0.08)';

    switch (paperStyle) {
      case 'dot':
        return { backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px' };
      case 'line':
        return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`, backgroundSize: '100% 30px' };
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

  const borderClass = isDark ? 'border-[#262A32]' : 'border-[#E5E8EB]';
  const surfaceClass = isDark ? 'bg-[#181B20]' : 'bg-white';

  return (
    <div className={`flex flex-col h-full rounded-3xl border overflow-hidden ${surfaceClass} ${borderClass}`}>
      <div className={`px-3.5 py-2.5 border-b ${borderClass} flex flex-wrap items-center justify-between gap-2 shrink-0`}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPanelTab('handwriting')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              panelTab === 'handwriting'
                ? 'bg-[#3182F6] text-white'
                : isDark
                ? 'text-[#9BA3B0] hover:text-white'
                : 'text-[#6B7684] hover:text-[#191F28]'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>손필기</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelTab('typing')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              panelTab === 'typing'
                ? 'bg-[#3182F6] text-white'
                : isDark
                ? 'text-[#9BA3B0] hover:text-white'
                : 'text-[#6B7684] hover:text-[#191F28]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>텍스트 노트</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`flex p-0.5 rounded-xl text-[12px] font-bold ${isDark ? 'bg-[#22262E]' : 'bg-[#F2F4F6]'}`}>
            {[
              { id: 'line', label: '유선' },
              { id: 'dot', label: '도트' },
              { id: 'grid', label: '모눈' },
              { id: 'blank', label: '무지' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaperStyle(p.id)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  paperStyle === p.id
                    ? isDark
                      ? 'bg-[#181B20] text-white'
                      : 'bg-white text-[#191F28]'
                    : 'text-[#8B95A1]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {panelTab === 'handwriting' && (
            <button
              type="button"
              onClick={handleExportPng}
              className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold bg-[#3182F6]/10 text-[#3182F6] flex items-center gap-1 cursor-pointer"
              title="이미지로 저장"
            >
              <Download className="w-3.5 h-3.5" />
              <span>저장</span>
            </button>
          )}
        </div>
      </div>

      {panelTab === 'handwriting' && (
        <div className={`px-3.5 py-2 border-b ${borderClass} flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar shrink-0`}>
          <div className="flex items-center gap-1 shrink-0">
            {tools.map((toolItem) => (
              <button
                key={toolItem.id}
                type="button"
                onClick={() => setCurrentTool(toolItem.id)}
                className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
                  currentTool === toolItem.id
                    ? 'bg-[#3182F6] text-white'
                    : isDark
                    ? 'text-[#9BA3B0] hover:text-white'
                    : 'text-[#6B7684] hover:text-[#191F28]'
                }`}
              >
                {toolItem.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {colorPalette.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setStrokeColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                  strokeColor === c.color ? 'scale-125 ring-2 ring-[#3182F6]' : 'opacity-75 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-lg text-[#6B7684] disabled:opacity-30 cursor-pointer"
              title="실행 취소"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-[#6B7684] disabled:opacity-30 cursor-pointer"
              title="다시 실행"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-lg text-[#6B7684] disabled:opacity-30 cursor-pointer"
              title="전체 지우기"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden" style={getPaperBg()}>
        {panelTab === 'handwriting' ? (
          <div ref={containerRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="absolute inset-0 w-full h-full touch-none"
            />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full p-5 overflow-y-auto hide-scrollbar">
            <textarea
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                if (updateDay) updateDay({ bibleFreeNote: e.target.value });
              }}
              placeholder={`${chapterTitle || '말씀'} 본문을 묵상하며 이곳에 필사나 묵상 내용을 자유롭게 기록하세요.`}
              className={`w-full h-full bg-transparent outline-none resize-none text-[15px] leading-[1.85] border-none ${
                isDark ? 'text-[#F9FAFB] placeholder:text-[#6B7684]' : 'text-[#191F28] placeholder:text-[#8B95A1]'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// 설교 상세 인라인/모달 뷰어 (설교 버튼 클릭 시 빈 화면 없이 즉시 내용 표시)
// =====================================================================
const InlineSermonReferencePanel = ({ verseKey, sermons, dailyData, isDark, onClose, onJumpToNote }) => {
  const borderClass = isDark ? 'border-[#262A32]' : 'border-[#E5E8EB]';
  const surfaceClass = isDark ? 'bg-[#181B20]' : 'bg-white';
  const subBgClass = isDark ? 'bg-[#22262E]' : 'bg-[#F2F4F6]';

  // localStorage의 dailyData(예배노트)에서 해당 본문과 매칭되는 설교 노트도 함께 탐색
  const matchedUserNotes = useMemo(() => {
    if (!dailyData || !verseKey) return [];
    const targetClean = verseKey.replace(/\s+/g, '');
    const results = [];
    Object.entries(dailyData).forEach(([dKey, dVal]) => {
      if (!dVal || typeof dVal !== 'object') return;
      const refStr = String(dVal.sermonReference || '').replace(/\s+/g, '');
      if (refStr && (refStr.includes(targetClean) || targetClean.includes(refStr))) {
        results.push({
          date: dKey,
          title: dVal.sermonTitle || '제목 없는 예배 노트',
          preacher: dVal.sermonPreacher || '담임목사',
          reference: dVal.sermonReference,
          notes: dVal.sermonNotes ? dVal.sermonNotes.replace(/<[^>]*>?/gm, ' ').trim() : '',
          applyQuestions: Array.isArray(dVal.applyQuestions) ? dVal.applyQuestions.filter(Boolean) : []
        });
      }
    });
    return results;
  }, [dailyData, verseKey]);

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border ${borderClass} ${surfaceClass} flex flex-col max-h-[86vh] overflow-hidden`}
      >
        <div className={`px-5 py-4 border-b ${borderClass} flex items-center justify-between shrink-0`}>
          <div>
            <span className="text-[12px] font-bold text-[#3182F6] block">관련 설교 및 말씀 노트</span>
            <h3 className={`text-[18px] font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#191F28]'}`}>
              {verseKey}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${subBgClass} ${isDark ? 'text-white' : 'text-[#191F28]'} cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar">
          {/* 1. 아카이브 DB(sermon_summary.json) 설교 목록 */}
          {sermonListSafe(sermons).map((item, idx) => (
            <div key={`db_${idx}`} className={`p-4 rounded-2xl border ${borderClass} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-[#3182F6] bg-[#3182F6]/10 px-2.5 py-0.5 rounded-lg">
                  {item.date || '주일예배'}
                </span>
                {item.preacher && (
                  <span className={`text-[12px] font-medium ${isDark ? 'text-[#9BA3B0]' : 'text-[#6B7684]'}`}>
                    {item.preacher}
                  </span>
                )}
              </div>
              <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#191F28]'}`}>
                {item.title || item.sermonTitle || `${verseKey} 강해 설교`}
              </h4>
              {(item.summary || item.content || item.text) && (
                <p className={`text-[15px] leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-[#4E5968]'} whitespace-pre-wrap`}>
                  {item.summary || item.content || item.text}
                </p>
              )}
              {item.application && (
                <div className={`p-3 rounded-xl ${subBgClass} text-[12px] leading-relaxed ${isDark ? 'text-[#E5E7EB]' : 'text-[#333D4B]'}`}>
                  <strong className="text-[#3182F6] mr-1.5">적용 포인트</strong>
                  {item.application}
                </div>
              )}
            </div>
          ))}

          {/* 2. 사용자가 직접 작성한 예배노트(dailyData) 매칭 결과 */}
          {matchedUserNotes.map((note, idx) => (
            <div key={`note_${idx}`} className={`p-4 rounded-2xl border ${borderClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#3182F6]">나의 예배 노트 · {note.date}</span>
                <span className={`text-[12px] ${isDark ? 'text-[#9BA3B0]' : 'text-[#6B7684]'}`}>{note.preacher}</span>
              </div>
              <h4 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#191F28]'}`}>{note.title}</h4>
              {note.notes && (
                <p className={`text-[15px] leading-relaxed line-clamp-4 ${isDark ? 'text-[#D1D5DB]' : 'text-[#4E5968]'}`}>
                  {note.notes}
                </p>
              )}
              <button
                type="button"
                onClick={() => onJumpToNote(note.date)}
                className="w-full py-2.5 rounded-xl bg-[#3182F6] text-white text-[12px] font-bold cursor-pointer mt-1"
              >
                해당 날짜 예배 노트 전체 열기
              </button>
            </div>
          ))}

          {sermonListSafe(sermons).length === 0 && matchedUserNotes.length === 0 && (
            <div className="py-10 text-center space-y-3">
              <p className={`text-[15px] font-medium ${isDark ? 'text-[#9BA3B0]' : 'text-[#6B7684]'}`}>
                이 본문과 연결된 상세 요약이 아직 등록되지 않았습니다.
              </p>
              <button
                type="button"
                onClick={() => onJumpToNote(null)}
                className="px-5 py-2.5 rounded-xl bg-[#3182F6] text-white text-[15px] font-bold cursor-pointer"
              >
                이 본문으로 예배 노트 작성하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function sermonListSafe(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return [val];
  return [];
}

// =====================================================================
// 메인 통독 365 컴포넌트 (토스 디자인 시스템 · 3단계 타이포 · 맞춤 독수 플랜)
// =====================================================================
export default function Bible({
  bibles,
  currentChapId,
  setCurrentChapId,
  bibleViewMode,
  setBibleViewMode,
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
  SubPageHeader
}) {
  const [selectedSermonVerse, setSelectedSermonVerse] = useState(null);
  const [sermonSummaryData, setSermonSummaryData] = useState(null);
  const [viewMode, setViewMode] = useState('single');
  const [noteContent, setNoteContent] = useState(currDay?.bibleFreeNote || '');
  const [cellSyncToast, setCellSyncToast] = useState(false);

  // 365일 맞춤 통독 목표 독수 설정 (1독 / 2독 / 3독) & 설정 패널 열림 상태
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

  // 기본 성경 역본을 개역개정 4판('krv')으로 설정
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

  // 원어 연구 인스펙터 상태
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

  // 학술 데이터베이스 상태
  const [lxxDb, setLxxDb] = useState({});
  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);
  const [translatedScholarlyMap, setTranslatedScholarlyMap] = useState({});
  const [translatingKey, setTranslatingKey] = useState(null);

  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  // 시작일 & 경과일수 계산 및 오늘의 맞춤 통독 분량 산출
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
    fetch('/data/lxx_quotes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setLxxDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then((r) => (r.ok ? r.json() : {})).then((d) => setCommentaryDb((prev) => ({ ...prev, ...d }))).catch(() => {});
    fetch('/data/matthew_henry.json').then((r) => (r.ok ? r.json() : {})).then((d) => setMatthewHenryDb((prev) => ({ ...prev, ...d }))).catch(() => {});
    fetch('/data/net_notes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then((r) => (r.ok ? r.json() : {})).then((d) => setTargumPeshittaDb(d || {})).catch(() => {});
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

  const [sBk, sCh] = String(currentChapId || 'Genesis-1').split('-');
  const cBk = (getArr ? getArr(bibles) : bibles || []).find((b) => b.name === sBk) || (bibles && bibles[0]);
  const currentChapterNum = parseInt(sCh, 10) || 1;

  const currentBookMeta = useMemo(() => {
    return BIBLE_66_MAP[sBk] || BIBLE_66_MAP[getKoName ? getKoName(sBk) : sBk] || BIBLE_66_LIST[0];
  }, [sBk, getKoName]);

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

  const cVs = useMemo(() => {
    const txtChap =
      krv4TxtDb?.[currentBookMeta.en]?.[currentChapterNum - 1] ||
      krv4TxtDb?.[currentBookMeta.ko]?.[currentChapterNum - 1] ||
      krv4TxtDb?.[currentBookMeta.abbr]?.[currentChapterNum - 1];
    if (Array.isArray(txtChap) && txtChap.length > 0) {
      return txtChap.filter(Boolean);
    }
    return cBk && cBk.chapters && Array.isArray(cBk.chapters[currentChapterNum - 1]) ? cBk.chapters[currentChapterNum - 1] : [];
  }, [krv4TxtDb, currentBookMeta, currentChapterNum, cBk]);

  const isAllR = cVs.length > 0 && (getArr ? getArr(cVs) : cVs).every((_, i) => (readVerses || {})[`${sBk}-${sCh}-${i}`]);
  const totalChapters = krv4TxtDb?.[currentBookMeta.en]?.length || (getArr ? getArr(cBk?.chapters) : cBk?.chapters || []).length;
  const hasPrevChapter = currentChapterNum > 1;
  const hasNextChapter = currentChapterNum < totalChapters;

  // 설교 매칭 검사기 (sermon_summary.json + 사용자 예배 노트 동시 검색)
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
          if (cleanKey.startsWith(targetPrefixKo)) {
            versePart = cleanKey.slice(targetPrefixKo.length);
          } else if (targetPrefixEn && cleanKey.startsWith(targetPrefixEn)) {
            versePart = cleanKey.slice(targetPrefixEn.length);
          }

          if (!versePart) continue;

          const segments = versePart.split(/[,;]/);
          for (const seg of segments) {
            if (seg.includes('-') || seg.includes('~')) {
              const [sStr, eStr] = seg.split(/[-~]/);
              const start = parseInt(sStr.replace(/[^0-9]/g, ''), 10);
              const end = parseInt(eStr.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(start) && !isNaN(end) && vInt >= start && vInt <= end) {
                return key;
              }
            } else {
              const single = parseInt(seg.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(single) && vInt === single) {
                return key;
              }
            }
          }
        }
      }

      // 사용자 예배노트(qt_daily)에서도 해당 장·절 본문 검색
      try {
        const rawDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        for (const dVal of Object.values(rawDaily)) {
          if (!dVal || !dVal.sermonReference) continue;
          const cleanRef = String(dVal.sermonReference).replace(/\s+/g, '');
          if (cleanRef.startsWith(targetPrefixKo) || cleanRef === `${cleanKo}${chInt}장`) {
            return dVal.sermonReference;
          }
        }
      } catch (_) {}

      return null;
    },
    [sermonSummaryData]
  );

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
        checks: {
          ...(currDay?.checks || {}),
          성경: true,
          성경읽기: true,
          성경통독: true
        }
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

  // =====================================================================
  // 원어 강해 인스펙터
  // =====================================================================
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
                ? {
                    ...prev,
                    korLemma: koTranslated,
                    korContextual: applyContextualCaseEnding(koTranslated, word.caseType, word.isOT)
                  }
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

      setInspectorTarget({
        book: koBook,
        bookEn: currentBookMeta.en,
        chapter: chNum,
        verse: vNum,
        text: decodeHtmlEntities(verseText),
        easyText,
        webText,
        isOT
      });
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
            if (dictRows && dictRows.length > 0) {
              dictRows.forEach((row) => dictMap.set(row.strongs_id, row));
            }
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
              if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
                lemmaMeaning = w.korean_trans;
              } else if (master.usage && /[가-힣]/.test(master.usage)) {
                lemmaMeaning = master.usage.split(',')[0].trim();
              } else {
                lemmaMeaning = '원어 어휘';
              }
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
          if (enriched.length > 0) {
            handleSelectInspectorWord(enriched[0]);
          }
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
      localStorage.setItem(
        'interlinear_jump',
        JSON.stringify({
          book: inspectorTarget.book,
          chapter: Number(inspectorTarget.chapter),
          verse: Number(inspectorTarget.verse)
        })
      );
    } catch (_) {}
    setInspectorTarget(null);
    if (setActiveScreen) {
      setActiveScreen('interlinear');
    }
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
    alert(`[${word.inflected}] 원어 강해가 2단 필사 노트에 기록되었습니다.`);
  };

  // 토스 디자인 시스템 컬러 토큰 (다크/라이트 완벽 호환 · 단일 포인트 블루 #3182F6)
  const isDark = isDarkMode;
  const pageBg = isDark ? 'bg-[#101216]' : 'bg-[#F4F6FA]';
  const surfaceBg = isDark ? 'bg-[#181B20]' : 'bg-white';
  const subSurfaceBg = isDark ? 'bg-[#22262E]' : 'bg-[#F2F4F6]';
  const borderClass = isDark ? 'border-[#262A32]' : 'border-[#E5E8EB]';
  const dividerClass = isDark ? 'divide-[#262A32]' : 'divide-[#F2F4F6]';
  const textMain = isDark ? 'text-[#F9FAFB]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#9BA3B0]' : 'text-[#6B7684]';

  const originalFontStyle = (isOT) =>
    isOT
      ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
      : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const currentKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentCommentary = commentaryDb[currentKey] || null;
  const currentMatthewHenry = matthewHenryDb[currentKey] || null;
  const currentNetNote = netNotesDb[currentKey] || null;
  const currentTargumPeshitta = targumPeshittaDb[currentKey] || null;

  const currentHebrewSyntax = useMemo(() => {
    if (inspectorTarget?.isOT && inspectorWords && inspectorWords.length > 0) {
      return analyzeHebrewSyntaxFromWords(inspectorWords);
    }
    return null;
  }, [inspectorTarget, inspectorWords]);

  // 현재 본문 읽기 화면에서 오늘의 통독 분량 중 다음 읽을 장 찾기
  const currentIdxInTodaysPlan = todaysPlanChapters.findIndex((c) => c.en === sBk && c.chapter === currentChapterNum);
  const nextPlanChapter =
    currentIdxInTodaysPlan >= 0 && currentIdxInTodaysPlan < todaysPlanChapters.length - 1
      ? todaysPlanChapters[currentIdxInTodaysPlan + 1]
      : null;

  return (
    <div className={`flex-1 flex flex-col h-full ${pageBg} relative overflow-hidden font-sans select-none`}>
      {/* 목장모임 출석 연동 토스트 알림 */}
      {cellSyncToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999999] bg-[#3182F6] text-white text-[12px] font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>성경 통독이 목장 모임 출석부 및 오늘의 루틴에 반영되었습니다.</span>
        </div>
      )}

      {/* 설교 상세 모달 (설교 버튼 클릭 시 즉시 표시) */}
      {selectedSermonVerse && (
        <InlineSermonReferencePanel
          verseKey={selectedSermonVerse}
          sermons={sermonSummaryData?.index?.[selectedSermonVerse] || []}
          dailyData={dailyDailyData}
          isDark={isDark}
          onClose={() => setSelectedSermonVerse(null)}
          onJumpToNote={(targetDate) => {
            setSelectedSermonVerse(null);
            if (setActiveScreen) setActiveScreen('sermon');
          }}
        />
      )}

      {bibleViewMode === 'index' ? (
        // ===============================================================
        // 1. 성경 통독 365 홈 & 66권 목차 (토스 스타일 · 맞춤 독수 플랜 포함)
        // ===============================================================
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 space-y-5 relative z-10 w-full max-w-[760px] mx-auto hide-scrollbar">
          <div className="pt-1">
            <SubPageHeader
              title="성경 통독 365"
              onBack={() => setActiveScreen('home')}
              t={t}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* 통독 진행률 및 맞춤 1독·2독·3독 설정 카드 (중첩 박스 없이 단일 카드 + 구분선) */}
          <section className={`${surfaceBg} rounded-3xl border ${borderClass} overflow-hidden`}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-bold text-[#3182F6] bg-[#3182F6]/10 px-2.5 py-1 rounded-lg">
                    1년 {targetRounds}독 플랜 · {elapsedDayNum}일차
                  </span>
                  <h2 className={`text-[18px] font-bold ${textMain} mt-2`}>
                    전체 통독 진행률 {bibleProgress}%
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanSettings((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 ${subSurfaceBg} ${textMain} cursor-pointer`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#3182F6]" />
                  <span>{showPlanSettings ? '설정 닫기' : '목표 설정'}</span>
                </button>
              </div>

              <div className={`w-full ${subSurfaceBg} rounded-full h-2 overflow-hidden`}>
                <div className="bg-[#3182F6] h-full transition-all duration-500 rounded-full" style={{ width: `${bibleProgress}%` }} />
              </div>

              <div className={`flex items-center justify-between text-[12px] font-medium ${textSub}`}>
                <span>완독 {readChapsCount}장 / 전체 1,189장</span>
                <span>하루 권장 약 {Math.ceil((1189 * targetRounds) / 365)}장</span>
              </div>

              {/* 접이식 통독 목표 설정 패널 (시작일 & 1독/2독/3독 선택) */}
              {showPlanSettings && (
                <div className={`pt-4 border-t ${borderClass} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[15px] font-bold ${textMain}`}>통독 시작일</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${subSurfaceBg}`}>
                      <Calendar className="w-4 h-4 text-[#3182F6]" />
                      <input
                        type="date"
                        value={effectiveStartDate}
                        onChange={(e) => {
                          setReadChallengeStart(e.target.value);
                          localStorage.setItem('readChallengeStart', e.target.value);
                        }}
                        className={`bg-transparent text-[15px] font-bold ${textMain} outline-none cursor-pointer`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`text-[15px] font-bold ${textMain} block`}>1년 목표 독수 선택</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { rounds: 1, label: '1년 1독', sub: '하루 3~4장' },
                        { rounds: 2, label: '1년 2독', sub: '하루 6~7장' },
                        { rounds: 3, label: '1년 3독', sub: '하루 9~10장' }
                      ].map((opt) => {
                        const active = targetRounds === opt.rounds;
                        return (
                          <button
                            key={opt.rounds}
                            type="button"
                            onClick={() => handleTargetRoundsChange(opt.rounds)}
                            className={`p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#3182F6] border-[#3182F6] text-white'
                                : `${subSurfaceBg} border-transparent ${textMain}`
                            }`}
                          >
                            <span className="text-[15px] font-bold block">{opt.label}</span>
                            <span className={`text-[12px] block mt-0.5 ${active ? 'text-white/85' : textSub}`}>
                              {opt.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 오늘의 맞춤 통독 분량 바로가기 (구분선으로 연결) */}
            <div className={`border-t ${borderClass} p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[12px] font-medium ${textSub} block`}>오늘의 맞춤 통독 분량 ({elapsedDayNum}일차)</span>
                  <span className={`text-[15px] font-bold ${textMain} mt-0.5 block`}>
                    {formatReadingRangeLabel(todaysPlanChapters)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('bibleChallenge')}
                  className="text-[12px] font-bold text-[#3182F6] cursor-pointer"
                >
                  전체 통독표
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {todaysPlanChapters.map((chItem, idx) => {
                  const totalV = BIBLE_66_MAP[chItem.en]?.chaptersCount || 1;
                  const isChRead =
                    cBk &&
                    Array.from({ length: 1 }).every((_, vi) => Boolean((readVerses || {})[`${chItem.en}-${chItem.chapter}-${vi}`]));
                  return (
                    <button
                      key={`${chItem.id}_${idx}`}
                      type="button"
                      onClick={() => {
                        setCurrentChapId(chItem.id);
                        setBibleViewMode('read');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isChRead
                          ? 'bg-[#3182F6] text-white'
                          : `${subSurfaceBg} ${textMain} hover:bg-[#3182F6]/10 hover:text-[#3182F6]`
                      }`}
                    >
                      {isChRead && <Check className="w-3.5 h-3.5" />}
                      <span>
                        {chItem.ko} {chItem.chapter}장
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 구약 성경 39권 리스트 카드 */}
          <section className={`${surfaceBg} rounded-3xl border ${borderClass} p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-[18px] font-bold ${textMain}`}>구약 성경</h3>
              <span className={`text-[12px] font-medium ${textSub}`}>39권</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(getArr ? getArr(bibles) : bibles || []).slice(0, 39).map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => openModal('bibleChapterSelect', b)}
                  className={`px-3 py-2.5 rounded-xl text-[15px] font-medium ${subSurfaceBg} ${textMain} hover:bg-[#3182F6]/10 hover:text-[#3182F6] transition-colors truncate cursor-pointer text-center`}
                >
                  {getKoName(b.name)}
                </button>
              ))}
            </div>
          </section>

          {/* 신약 성경 27권 리스트 카드 */}
          <section className={`${surfaceBg} rounded-3xl border ${borderClass} p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-[18px] font-bold ${textMain}`}>신약 성경</h3>
              <span className={`text-[12px] font-medium ${textSub}`}>27권</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(getArr ? getArr(bibles) : bibles || []).slice(39, 66).map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => openModal('bibleChapterSelect', b)}
                  className={`px-3 py-2.5 rounded-xl text-[15px] font-medium ${subSurfaceBg} ${textMain} hover:bg-[#3182F6]/10 hover:text-[#3182F6] transition-colors truncate cursor-pointer text-center`}
                >
                  {getKoName(b.name)}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        // ===============================================================
        // 2. 성경 본문 읽기 & 2단 필사 뷰포트 (표준 가독성 규격 & 모바일 최적화)
        // ===============================================================
        <div className="flex-1 flex flex-col h-full pointer-events-auto relative z-10 overflow-hidden">
          <div className="pt-1">
            <SubPageHeader
              title={`${currentBookMeta.ko} ${sCh}장`}
              onBack={() => {
                setBibleViewMode('index');
                setSelVerses([]);
              }}
              t={t}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* 상단 역본 및 보기 모드 컨트롤 바 */}
          <div className={`${surfaceBg} px-4 py-2.5 border-b ${borderClass} flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar shrink-0`}>
            <div className={`flex p-0.5 rounded-xl text-[12px] font-bold ${subSurfaceBg} shrink-0`}>
              {[
                { id: 'krv', label: '개역개정' },
                { id: 'easy', label: '쉬운성경' },
                { id: 'web', label: '영어' },
                { id: 'parallel', label: '대조' }
              ].map((ver) => (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => handleVersionChange(ver.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    bibleVersion === ver.id ? 'bg-[#3182F6] text-white' : textSub
                  }`}
                >
                  {ver.label}
                </button>
              ))}
            </div>

            <div className={`flex p-0.5 rounded-xl text-[12px] font-bold ${subSurfaceBg} shrink-0`}>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'single' ? (isDark ? 'bg-[#181B20] text-white' : 'bg-white text-[#191F28]') : textSub
                }`}
              >
                읽기 모드
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  viewMode === 'split' ? 'bg-[#3182F6] text-white' : textSub
                }`}
              >
                <PenLine className="w-3 h-3" />
                <span>2단 필사</span>
              </button>
            </div>
          </div>

          {/* 본문 & 필사 영역 */}
          <div
            className={`flex-1 px-3 sm:px-5 pt-3 pb-2 grid gap-4 h-full relative z-10 overflow-hidden ${
              viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 max-w-[1400px]' : 'grid-cols-1 max-w-[760px]'
            } mx-auto w-full`}
          >
            {/* 성경 본문 리스트 영역 */}
            <div className="flex flex-col relative z-[45] pointer-events-auto h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto hide-scrollbar pb-3" data-live-web-tick={liveWebTick}>
                <div className={`${surfaceBg} rounded-3xl border ${borderClass} px-4 sm:px-6 py-4 divide-y ${dividerClass}`}>
                  {cVs.length > 0 ? (
                    (getArr ? getArr(cVs) : cVs).map((verse, idx) => {
                      const vNum = idx + 1;
                      const vId = `${sBk}-${sCh}-${idx}`;
                      const isR = (readVerses || {})[vId];
                      const isSel = selVerses.includes(vId);
                      const hColor = (bibleHighlights || {})[vId];

                      const koName = currentBookMeta.ko;
                      const matchedKey = checkHasSermon(koName, currentBookMeta.en, sCh, vNum);
                      const rawVerseStr = safeGetVerseText(verse);
                      const { pericope, pureText: displayVerseText } = splitPericopeAndVerse(rawVerseStr);

                      const easyText = resolveTranslationVerse(easyBibleDb, currentBookMeta, currentChapterNum, vNum);
                      const webText = resolveTranslationVerse(webBibleDb, currentBookMeta, currentChapterNum, vNum);

                      return (
                        <div
                          key={idx}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openVerseInspector(currentChapterNum, vNum, displayVerseText);
                          }}
                          onTouchStart={() => {
                            isLongPressActiveRef.current = false;
                            longPressTimerRef.current = setTimeout(() => {
                              isLongPressActiveRef.current = true;
                              if (window.navigator?.vibrate) window.navigator.vibrate(40);
                              openVerseInspector(currentChapterNum, vNum, displayVerseText);
                            }, 500);
                          }}
                          onTouchMove={() => {
                            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                          }}
                          onTouchEnd={() => {
                            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                          }}
                          className={`py-3 transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-[#3182F6]/10 rounded-xl px-2'
                              : isR && (!hColor || hColor === 'transparent')
                              ? 'opacity-45'
                              : ''
                          }`}
                          style={hColor && hColor !== 'transparent' ? { backgroundColor: `${hColor}33`, borderRadius: '10px', paddingLeft: '8px', paddingRight: '8px' } : {}}
                        >
                          {/* 단락 소제목 */}
                          {pericope && (
                            <div className="mb-2 pt-1">
                              <span className="text-[12px] font-bold text-[#3182F6] bg-[#3182F6]/10 px-2.5 py-1 rounded-lg inline-block">
                                {pericope}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openVerseInspector(currentChapterNum, vNum, displayVerseText);
                              }}
                              className="text-[12px] font-bold text-[#3182F6] mt-1 min-w-[22px] text-right shrink-0 cursor-pointer hover:underline"
                              title="원어 강해 보기"
                            >
                              {vNum}
                            </button>

                            <div
                              onClick={() => {
                                if (isLongPressActiveRef.current) return;
                                const willBeRead = !isR;
                                const nextReadVerses = { ...(readVerses || {}), [vId]: willBeRead };
                                setReadVerses(nextReadVerses);
                                localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

                                const allVersesReadNow = cVs.every((_, cIdx) => (cIdx === idx ? willBeRead : nextReadVerses[`${sBk}-${sCh}-${cIdx}`]));
                                if (allVersesReadNow) {
                                  const todayKey = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);
                                  const curCount = parseInt(localStorage.getItem(`chap_count_${todayKey}`) || '0', 10);
                                  localStorage.setItem(`chap_count_${todayKey}`, Math.max(0, curCount + 1));
                                }

                                if (willBeRead) syncBibleReading();
                                setSelVerses((p) => (p.includes(vId) ? p.filter((id) => id !== vId) : [...p, vId]));
                              }}
                              className={`flex-1 text-[15px] leading-[1.75] break-keep ${textMain}`}
                            >
                              {bibleVersion === 'krv' && <span>{displayVerseText}</span>}
                              {bibleVersion === 'easy' && <span>{easyText || displayVerseText}</span>}
                              {bibleVersion === 'web' && <span>{webText || displayVerseText}</span>}
                              {bibleVersion === 'parallel' && (
                                <div className="space-y-1.5">
                                  <p>{displayVerseText}</p>
                                  {easyText && (
                                    <p className={`text-[15px] ${textSub} pl-2.5 border-l-2 border-[#3182F6]/40`}>
                                      {easyText}
                                    </p>
                                  )}
                                  {webText && (
                                    <p className={`text-[15px] ${textSub} pl-2.5 border-l-2 border-[#8B95A1]/40`}>
                                      {webText}
                                    </p>
                                  )}
                                </div>
                              )}

                              {matchedKey && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSermonVerse(matchedKey);
                                  }}
                                  className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md text-[12px] font-bold bg-[#3182F6]/10 text-[#3182F6] hover:bg-[#3182F6]/20 align-middle cursor-pointer"
                                >
                                  <Mic className="w-3 h-3" />
                                  <span>설교</span>
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
                </div>
              </div>

              {/* 하단 고정 장 이동 & 완독 바 */}
              <div className={`shrink-0 pt-2 pb-3 px-1 border-t ${borderClass} ${pageBg} flex items-center justify-between gap-2 z-30`}>
                <button
                  type="button"
                  disabled={!hasPrevChapter}
                  onClick={() => hasPrevChapter && setCurrentChapId(`${sBk}-${currentChapterNum - 1}`)}
                  className={`h-11 px-3.5 ${surfaceBg} border ${borderClass} rounded-2xl font-bold text-[15px] ${textMain} flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 shrink-0`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">이전</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWholeChapter}
                  className={`flex-1 h-11 rounded-2xl font-bold text-[15px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAllR
                      ? `${subSurfaceBg} text-[#3182F6] border ${borderClass}`
                      : 'bg-[#3182F6] text-white'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{isAllR ? '완독 완료 (취소 가능)' : `${currentBookMeta.ko} ${sCh}장 완독`}</span>
                </button>

                {nextPlanChapter ? (
                  <button
                    type="button"
                    onClick={() => setCurrentChapId(nextPlanChapter.id)}
                    className="h-11 px-3.5 bg-[#3182F6]/10 text-[#3182F6] rounded-2xl font-bold text-[12px] flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    title="오늘의 통독 플랜 다음 장"
                  >
                    <span>플랜 {nextPlanChapter.chapter}장</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!hasNextChapter}
                    onClick={() => hasNextChapter && setCurrentChapId(`${sBk}-${currentChapterNum + 1}`)}
                    className={`h-11 px-3.5 ${surfaceBg} border ${borderClass} rounded-2xl font-bold text-[15px] ${textMain} flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 shrink-0`}
                  >
                    <span className="hidden sm:inline">다음</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 우측: 2단 필사 노트 패널 */}
            {viewMode === 'split' && (
              <div className="flex flex-col h-full relative z-[45] pointer-events-auto min-h-[420px]">
                <BibleTranscriptionNotePanel
                  currentChapId={currentChapId}
                  chapterTitle={`${currentBookMeta.ko} ${sCh}장`}
                  isDark={isDark}
                  noteContent={noteContent}
                  setNoteContent={setNoteContent}
                  updateDay={updateDay}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 선택 구절 하단 플로팅 형광펜 & 필사 담기 바 */}
      {selVerses.length > 0 && bibleViewMode === 'read' && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 ${surfaceBg} border ${borderClass} rounded-2xl px-4 py-2.5 flex items-center gap-2.5 z-[100] pointer-events-auto shadow-lg`}
        >
          <Highlighter className="w-4 h-4 text-[#3182F6]" />
          {['transparent', '#93C5FD', '#FDE047', '#BBF7D0'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                const nH = { ...bibleHighlights };
                const nR = { ...readVerses };
                selVerses.forEach((id) => {
                  nH[id] = c;
                  if (c !== 'transparent') nR[id] = true;
                });
                if (setBibleHighlights) setBibleHighlights(nH);
                if (setReadVerses) setReadVerses(nR);
                setSelVerses([]);
              }}
              className={`w-6 h-6 rounded-full border flex items-center justify-center text-[12px] cursor-pointer ${
                c === 'transparent' ? `${borderClass} ${textSub}` : 'border-transparent'
              }`}
              style={{ backgroundColor: c !== 'transparent' ? c : undefined }}
            >
              {c === 'transparent' ? <X className="w-3 h-3" /> : ''}
            </button>
          ))}

          <div className={`w-[1px] h-4 ${isDark ? 'bg-[#262A32]' : 'bg-[#E5E8EB]'}`} />

          <button
            type="button"
            onClick={() => {
              const vData = selVerses.map((id) => {
                const [b, ch, vIdx] = id.split('-');
                const koName = getKoName ? getKoName(b) : b;
                const krvVerse =
                  krv4TxtDb?.[b]?.[parseInt(ch, 10) - 1]?.[parseInt(vIdx, 10)] ||
                  krv4TxtDb?.[koName]?.[parseInt(ch, 10) - 1]?.[parseInt(vIdx, 10)];
                let rawStr = krvVerse;
                if (!rawStr) {
                  const bD = (getArr ? getArr(bibles) : bibles || []).find((x) => x.name === b) || (bibles && bibles[0]);
                  rawStr = (getArr ? getArr(getArr(bD?.chapters)[parseInt(ch, 10) - 1]) : [])[parseInt(vIdx, 10)];
                }
                const { pureText } = splitPericopeAndVerse(safeGetVerseText(rawStr));
                return { id, ref: `${koName} ${ch}:${parseInt(vIdx, 10) + 1}`, text: pureText };
              });
              const combinedText = vData.map((v) => `[${v.ref}] ${v.text}`).join('\n');
              const updated = (noteContent || '') + (noteContent ? '\n\n' : '') + combinedText;
              setNoteContent(updated);
              if (updateDay) updateDay({ bibleFreeNote: updated });
              setViewMode('split');
              setSelVerses([]);
            }}
            className="bg-[#3182F6] text-white text-[12px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer"
          >
            필사 노트로 담기
          </button>
        </div>
      )}

      {/* 원어 연구 인스펙터 모달 (토스식 깔끔한 시트 디자인 · 이모지 0%) */}
      {inspectorTarget && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border ${borderClass} ${surfaceClass} ${textMain} p-5 flex flex-col max-h-[88vh] overflow-hidden`}
          >
            <div className={`border-b ${borderClass} pb-3 shrink-0 space-y-3`}>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[15px] font-bold text-[#3182F6]">
                  {inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 분석
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleJumpToInterlinearStudio}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${subSurfaceBg} ${textMain} cursor-pointer`}
                  >
                    원어 연구실 이동
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTarget(null)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${subSurfaceBg} ${textMain} cursor-pointer`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedWordDetail && (
                <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-2xl ${subSurfaceBg}`}>
                  <div className="space-y-1 text-left">
                    <span className={`text-[12px] font-medium ${textSub} block`}>본문 어형</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-[20px] font-bold">
                        {cleanTypography(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      </span>
                      <span className={`text-[12px] ${textSub}`}>{selectedWordDetail.pron}</span>
                    </div>
                    <p className="text-[12px] font-bold text-[#3182F6]">
                      {selectedWordDetail.korContextual}
                    </p>
                    <p className={`text-[12px] ${textSub}`}>{selectedWordDetail.grammarDecoded}</p>
                  </div>

                  <div className={`space-y-1 border-l pl-3 text-left ${borderClass}`}>
                    <span className={`text-[12px] font-medium ${textSub} block`}>원형 표제어</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-[20px] font-bold">
                        {cleanTypography(selectedWordDetail.lemma, inspectorTarget.isOT)}
                      </span>
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-md bg-[#3182F6]/10 text-[#3182F6]">
                        {selectedWordDetail.strongs}
                      </span>
                    </div>
                    <p className="text-[12px] font-bold">기본뜻: {selectedWordDetail.korLemma}</p>
                  </div>
                </div>
              )}

              <p className={`text-[15px] leading-relaxed ${textMain}`}>{inspectorTarget.text}</p>
            </div>

            {/* 탭 선택 */}
            <div className={`flex gap-1 p-1 rounded-2xl ${subSurfaceBg} my-3 shrink-0`}>
              {[
                { id: 'scholarly', label: '주석 및 사료' },
                { id: 'concordance', label: `전권 용례 (${concordanceTotalCount}회)` },
                { id: 'custom_study', label: '연구 메모' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-colors ${
                    modalTab === tab.id ? 'bg-[#3182F6] text-white' : textSub
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 본문 스크롤 */}
            <div className="overflow-y-auto hide-scrollbar space-y-3 flex-1 text-left">
              <div className={`p-3.5 rounded-2xl ${subSurfaceBg}`}>
                <span className={`text-[12px] font-medium ${textSub} block mb-2`}>어절 선택</span>
                {isInspectorLoading ? (
                  <div className={`py-3 text-center text-[12px] ${textSub}`}>어휘를 불러오는 중입니다...</div>
                ) : (
                  <div
                    className={`flex flex-wrap gap-2 items-baseline ${inspectorTarget.isOT ? 'justify-end' : 'justify-start'}`}
                    dir={inspectorTarget.isOT ? 'rtl' : 'ltr'}
                  >
                    {inspectorWords.map((w) => (
                      <span
                        key={w.id}
                        onClick={() => handleSelectInspectorWord(w)}
                        style={originalFontStyle(inspectorTarget.isOT)}
                        className={`text-[18px] font-bold px-2 py-1 rounded-xl cursor-pointer transition-colors ${
                          selectedWordDetail?.order === w.order
                            ? 'bg-[#3182F6] text-white'
                            : isDark
                            ? 'text-white hover:bg-white/10'
                            : 'text-[#191F28] hover:bg-black/5'
                        }`}
                      >
                        {cleanTypography(w.inflected, inspectorTarget.isOT)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {modalTab === 'scholarly' && (
                <div className="space-y-3">
                  {crossRefs.length > 0 && (
                    <div className={`p-3.5 rounded-2xl border ${borderClass}`}>
                      <span className="font-bold text-[12px] text-[#3182F6] block mb-2">
                        교차참조 ({crossRefs.length}구절)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {crossRefs.map((ref, idx) => (
                          <span key={idx} className={`px-2 py-1 rounded-lg text-[12px] font-medium ${subSurfaceBg} ${textMain}`}>
                            {ref.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentCommentary && (
                    <div className={`p-4 rounded-2xl border ${borderClass} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-[#3182F6]">
                          학술 주석 ({currentCommentary.commentator})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTranslateScholarlyBlock(`comm_${currentKey}`, currentCommentary.exegesis)}
                          className="px-2.5 py-1 rounded-lg bg-[#3182F6]/10 text-[#3182F6] text-[12px] font-bold cursor-pointer"
                        >
                          {translatingKey === `comm_${currentKey}`
                            ? '번역 중...'
                            : translatedScholarlyMap[`comm_${currentKey}`]
                            ? '원문 보기'
                            : '한국어 번역'}
                        </button>
                      </div>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>
                        {decodeHtmlEntities(translatedScholarlyMap[`comm_${currentKey}`] || currentCommentary.exegesis)}
                      </p>
                    </div>
                  )}

                  {currentMatthewHenry && (
                    <div className={`p-4 rounded-2xl border ${borderClass} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-[#3182F6]">매튜 헨리 묵상 강해</span>
                        <button
                          type="button"
                          onClick={() => handleTranslateScholarlyBlock(`mh_${currentKey}`, currentMatthewHenry.devotionalExegesis)}
                          className="px-2.5 py-1 rounded-lg bg-[#3182F6]/10 text-[#3182F6] text-[12px] font-bold cursor-pointer"
                        >
                          {translatingKey === `mh_${currentKey}`
                            ? '번역 중...'
                            : translatedScholarlyMap[`mh_${currentKey}`]
                            ? '원문 보기'
                            : '한국어 번역'}
                        </button>
                      </div>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>
                        {decodeHtmlEntities(translatedScholarlyMap[`mh_${currentKey}`] || currentMatthewHenry.devotionalExegesis)}
                      </p>
                    </div>
                  )}

                  {currentNetNote && (
                    <div className={`p-4 rounded-2xl border ${borderClass} space-y-1`}>
                      <span className="font-bold text-[12px] text-[#3182F6] block">
                        비평 각주: {decodeHtmlEntities(currentNetNote.title)}
                      </span>
                      <p className={`text-[15px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(currentNetNote.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'concordance' && (
                <div className={`divide-y ${dividerClass} border ${borderClass} rounded-2xl overflow-hidden`}>
                  {concordanceList.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[#3182F6] min-w-[74px]">
                        {item.book} {item.chapter}:{item.verse}
                      </span>
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[15px]">
                        {cleanTypography(item.original_word, inspectorTarget.isOT)}
                      </span>
                      <span className={`text-[12px] ${textSub} truncate max-w-[140px] text-right`}>{item.korean_trans}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'custom_study' && selectedWordDetail && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customInputTrans}
                    onChange={(e) => setCustomInputTrans(e.target.value)}
                    placeholder="대표 번역어 입력"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-[15px] font-medium ${subSurfaceBg} ${textMain} outline-none`}
                  />
                  <textarea
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    rows={3}
                    placeholder="개인 연구 메모를 기록하세요"
                    className={`w-full p-3.5 rounded-xl text-[15px] ${subSurfaceBg} ${textMain} outline-none resize-none`}
                  />
                </div>
              )}
            </div>

            {/* 하단 액션 바 */}
            {selectedWordDetail && (
              <div className={`pt-3 mt-2 border-t ${borderClass} flex gap-2 shrink-0`}>
                <button
                  type="button"
                  onClick={() => handleInsertWordToFreeNote(selectedWordDetail)}
                  className="flex-1 py-3 rounded-2xl bg-[#3182F6] text-white font-bold text-[15px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PenLine className="w-4 h-4" />
                  <span>필사 노트에 삽입</span>
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className={`px-4 py-3 rounded-2xl font-bold text-[15px] flex items-center gap-1.5 cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  <Volume2 className="w-4 h-4 text-[#3182F6]" />
                  <span>낭독</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
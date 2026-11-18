// src/pages/Sermon.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import { BibleGalaxyArcModal, BIBLE_66_CANON, extractBibleRefInfo } from '../pages/BibleKnowledgeGalaxy';
import {
  ensureKrv4TxtLoaded,
  getKrv4ChapterVerses,
  splitPericopeAndVerse
} from '../pages/Bible';
import bibleData from '../ko_ko.json';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ClipboardPaste,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  HandHeart,
  Image as ImageIcon,
  Link2,
  List,
  Maximize2,
  Menu,
  MessageCircle,
  Mic,
  Minimize2,
  PenTool,
  Pin,
  Save,
  Search,
  Share2,
  Target,
  Trash2,
  Video,
  Volume2,
  X
} from 'lucide-react';

// =====================================================================
// 암호화 유틸리티 (AES-256 표준 및 구버전 호환)
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

const extractBibleReferences = (text) => {
  if (!text) return [];
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)];
  return Array.from(new Set(matches.map((m) => m[0].trim())));
};

// =====================================================================
// 성경 66권 메타데이터 및 약어 매핑
// =====================================================================
const BIBLE_ABBR_TO_KO = {
  창: '창세기', 출: '출애굽기', 레: '레위기', 민: '민수기', 신: '신명기',
  수: '여호수아', 삿: '사사기', 룻: '룻기', 삼상: '사무엘상', 삼하: '사무엘하',
  왕상: '열왕기상', 왕하: '열왕기하', 대상: '역대상', 대하: '역대하',
  스: '에스라', 느: '느헤미야', 에: '에스더', 욥: '욥기', 시: '시편',
  잠: '잠언', 전: '전도서', 아: '아가', 사: '이사야', 렘: '예레미야',
  애: '예레미야애가', 겔: '에스겔', 단: '다니엘', 호: '호세아', 욜: '요엘',
  암: '아모스', 옵: '오바댜', 욘: '요나', 미: '미가', 나: '나훔',
  합: '하박국', 습: '스바냐', 학: '학개', 슥: '스가랴', 말: '말라기',
  마: '마태복음', 막: '마가복음', 눅: '누가복음', 요: '요한복음', 행: '사도행전',
  롬: '로마서', 고전: '고린도전서', 고후: '고린도후서', 갈: '갈라디아서',
  엡: '에베소서', 빌: '빌립보서', 골: '골로새서', 살전: '데살로니가전서',
  살후: '데살로니가후서', 딤전: '디모데전서', 딤후: '디모데후서', 딛: '디도서',
  몬: '빌레몬서', 히: '히브리서', 약: '야고보서', 벧전: '베드로전서',
  벧후: '베드로후서', 요일: '요한일서', 요이: '요한이서', 요삼: '요한삼서',
  유: '유다서', 계: '요한계시록'
};

const BIBLE_66_MAP = {
  Genesis: { ko: '창세기', isOT: true }, 창세기: { ko: '창세기', isOT: true },
  Exodus: { ko: '출애굽기', isOT: true }, 출애굽기: { ko: '출애굽기', isOT: true },
  Leviticus: { ko: '레위기', isOT: true }, 레위기: { ko: '레위기', isOT: true },
  Numbers: { ko: '민수기', isOT: true }, 민수기: { ko: '민수기', isOT: true },
  Deuteronomy: { ko: '신명기', isOT: true }, 신명기: { ko: '신명기', isOT: true },
  Joshua: { ko: '여호수아', isOT: true }, 여호수아: { ko: '여호수아', isOT: true },
  Judges: { ko: '사사기', isOT: true }, 사사기: { ko: '사사기', isOT: true },
  Ruth: { ko: '룻기', isOT: true }, 룻기: { ko: '룻기', isOT: true },
  '1 Samuel': { ko: '사무엘상', isOT: true }, 사무엘상: { ko: '사무엘상', isOT: true },
  '2 Samuel': { ko: '사무엘하', isOT: true }, 사무엘하: { ko: '사무엘하', isOT: true },
  '1 Kings': { ko: '열왕기상', isOT: true }, 열왕기상: { ko: '열왕기상', isOT: true },
  '2 Kings': { ko: '열왕기하', isOT: true }, 열왕기하: { ko: '열왕기하', isOT: true },
  '1 Chronicles': { ko: '역대상', isOT: true }, 역대상: { ko: '역대상', isOT: true },
  '2 Chronicles': { ko: '역대하', isOT: true }, 역대하: { ko: '역대하', isOT: true },
  Ezra: { ko: '에스라', isOT: true }, 에스라: { ko: '에스라', isOT: true },
  Nehemiah: { ko: '느헤미야', isOT: true }, 느헤미야: { ko: '느헤미야', isOT: true },
  Esther: { ko: '에스더', isOT: true }, 에스더: { ko: '에스더', isOT: true },
  Job: { ko: '욥기', isOT: true }, 욥기: { ko: '욥기', isOT: true },
  Psalms: { ko: '시편', isOT: true }, 시편: { ko: '시편', isOT: true },
  Proverbs: { ko: '잠언', isOT: true }, 잠언: { ko: '잠언', isOT: true },
  Ecclesiastes: { ko: '전도서', isOT: true }, 전도서: { ko: '전도서', isOT: true },
  'Song of Solomon': { ko: '아가', isOT: true }, 아가: { ko: '아가', isOT: true },
  Isaiah: { ko: '이사야', isOT: true }, 이사야: { ko: '이사야', isOT: true },
  Jeremiah: { ko: '예레미야', isOT: true }, 예레미야: { ko: '예레미야', isOT: true },
  Lamentations: { ko: '예레미야애가', isOT: true }, 예레미야애가: { ko: '예레미야애가', isOT: true },
  Ezekiel: { ko: '에스겔', isOT: true }, 에스겔: { ko: '에스겔', isOT: true },
  Daniel: { ko: '다니엘', isOT: true }, 다니엘: { ko: '다니엘', isOT: true },
  Hosea: { ko: '호세아', isOT: true }, 호세아: { ko: '호세아', isOT: true },
  Joel: { ko: '요엘', isOT: true }, 요엘: { ko: '요엘', isOT: true },
  Amos: { ko: '아모스', isOT: true }, 아모스: { ko: '아모스', isOT: true },
  Obadiah: { ko: '오바댜', isOT: true }, 오바댜: { ko: '오바댜', isOT: true },
  Jonah: { ko: '요나', isOT: true }, 요나: { ko: '요나', isOT: true },
  Micah: { ko: '미가', isOT: true }, 미가: { ko: '미가', isOT: true },
  Nahum: { ko: '나훔', isOT: true }, 나훔: { ko: '나훔', isOT: true },
  Habakkuk: { ko: '하박국', isOT: true }, 하박국: { ko: '하박국', isOT: true },
  Zephaniah: { ko: '스바냐', isOT: true }, 스바냐: { ko: '스바냐', isOT: true },
  Haggai: { ko: '학개', isOT: true }, 학개: { ko: '학개', isOT: true },
  Zechariah: { ko: '스가랴', isOT: true }, 스가랴: { ko: '스가랴', isOT: true },
  Malachi: { ko: '말라기', isOT: true }, 말라기: { ko: '말라기', isOT: true },
  Matthew: { ko: '마태복음', isOT: false }, 마태복음: { ko: '마태복음', isOT: false },
  Mark: { ko: '마가복음', isOT: false }, 마가복음: { ko: '마가복음', isOT: false },
  Luke: { ko: '누가복음', isOT: false }, 누가복음: { ko: '누가복음', isOT: false },
  John: { ko: '요한복음', isOT: false }, 요한복음: { ko: '요한복음', isOT: false },
  Acts: { ko: '사도행전', isOT: false }, 사도행전: { ko: '사도행전', isOT: false },
  Romans: { ko: '로마서', isOT: false }, 로마서: { ko: '로마서', isOT: false },
  '1 Corinthians': { ko: '고린도전서', isOT: false }, 고린도전서: { ko: '고린도전서', isOT: false },
  '2 Corinthians': { ko: '고린도후서', isOT: false }, 고린도후서: { ko: '고린도후서', isOT: false },
  Galatians: { ko: '갈라디아서', isOT: false }, 갈라디아서: { ko: '갈라디아서', isOT: false },
  Ephesians: { ko: '에베소서', isOT: false }, 에베소서: { ko: '에베소서', isOT: false },
  Philippians: { ko: '빌립보서', isOT: false }, 빌립보서: { ko: '빌립보서', isOT: false },
  Colossians: { ko: '골로새서', isOT: false }, 골로새서: { ko: '골로새서', isOT: false },
  '1 Thessalonians': { ko: '데살로니가전서', isOT: false }, 데살로니가전서: { ko: '데살로니가전서', isOT: false },
  '2 Thessalonians': { ko: '데살로니가후서', isOT: false }, 데살로니가후서: { ko: '데살로니가후서', isOT: false },
  '1 Timothy': { ko: '디모데전서', isOT: false }, 디모데전서: { ko: '디모데전서', isOT: false },
  '2 Timothy': { ko: '디모데후서', isOT: false }, 디모데후서: { ko: '디모데후서', isOT: false },
  Titus: { ko: '디도서', isOT: false }, 디도서: { ko: '디도서', isOT: false },
  Philemon: { ko: '빌레몬서', isOT: false }, 빌레몬서: { ko: '빌레몬서', isOT: false },
  Hebrews: { ko: '히브리서', isOT: false }, 히브리서: { ko: '히브리서', isOT: false },
  James: { ko: '야고보서', isOT: false }, 야고보서: { ko: '야고보서', isOT: false },
  '1 Peter': { ko: '베드로전서', isOT: false }, 베드로전서: { ko: '베드로전서', isOT: false },
  '2 Peter': { ko: '베드로후서', isOT: false }, 베드로후서: { ko: '베드로후서', isOT: false },
  '1 John': { ko: '요한일서', isOT: false }, 요한일서: { ko: '요한일서', isOT: false },
  '2 John': { ko: '요한이서', isOT: false }, 요한이서: { ko: '요한이서', isOT: false },
  '3 John': { ko: '요한삼서', isOT: false }, 요한삼서: { ko: '요한삼서', isOT: false },
  Jude: { ko: '유다서', isOT: false }, 유다서: { ko: '유다서', isOT: false },
  Revelation: { ko: '요한계시록', isOT: false }, 요한계시록: { ko: '요한계시록', isOT: false }
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
      const caseMap = { N: '주격', G: '소유격', D: '여격', A: '대격', V: '호격' };
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
      const stateMap = { a: '절대형', c: '연계형' };
      const stateStr = stateMap[parts[3]] ? `(${stateMap[parts[3]]})` : '';
      return { label: `${mainType === 'nmpr' ? '고유명사' : '명사'}${stateStr} · ${gMap[parts[1]] || ''} ${nMap[parts[2]] || ''}`.trim(), type: 'noun', caseType: parts[3] === 'c' ? 'CONSTRUCT' : '', isVerb: false };
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
// 성경 구절 정밀 파서 및 스페이스바 자동완성 엔진
// =====================================================================
const parseFlexibleBibleRef = (refString) => {
  if (!refString || typeof refString !== 'string') return null;
  const trimmed = refString.trim();
  if (!trimmed) return null;

  const regex = /^([가-힣a-zA-Z0-9\s]+?)\s*(\d+)\s*(?:장|:)\s*(?:(\d+)\s*(?:[-~]\s*(\d+))?\s*절?)?$/;
  const match = trimmed.match(regex);

  let rawBook = '';
  let chapter = 1;
  let startV = null;
  let endV = null;

  if (match) {
    rawBook = match[1].trim().replace(/\s+/g, '');
    chapter = parseInt(match[2], 10) || 1;
    if (match[3]) {
      startV = parseInt(match[3], 10);
      endV = match[4] ? parseInt(match[4], 10) : startV;
    }
  } else {
    const fallbackInfo = extractBibleRefInfo(trimmed);
    if (!fallbackInfo) return null;
    rawBook = fallbackInfo.bookKo;
    chapter = fallbackInfo.chapter || 1;
    const rangeMatch = trimmed.match(/:\s*(\d+)\s*[-~]\s*(\d+)/);
    if (rangeMatch) {
      startV = parseInt(rangeMatch[1], 10);
      endV = parseInt(rangeMatch[2], 10);
    } else if (fallbackInfo.verse && /:|절/.test(trimmed)) {
      startV = fallbackInfo.verse;
      endV = startV;
    }
  }

  const bookKo = BIBLE_ABBR_TO_KO[rawBook] || rawBook;
  const canonMeta = BIBLE_66_CANON.find(
    (b) => b.ko === bookKo || b.en.toLowerCase() === rawBook.toLowerCase() || b.ko.startsWith(rawBook)
  );
  if (!canonMeta) return null;

  return {
    bookKo: canonMeta.ko,
    bookEn: canonMeta.en,
    chapter,
    startV,
    endV,
    hasSpecificVerse: startV !== null
  };
};

const getLocalScriptureVerses = (refString, krv4Db = null) => {
  const parsed = parseFlexibleBibleRef(refString);
  if (!parsed) return { parsed: null, verses: [], allChapterVerses: [], isKrv4: false };

  const chIdx = Math.max(0, (parsed.chapter || 1) - 1);
  const activeKrv4 = krv4Db || (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null);
  let chapArr =
    activeKrv4?.[parsed.bookEn]?.[chIdx] ||
    activeKrv4?.[parsed.bookKo]?.[chIdx] ||
    getKrv4ChapterVerses(parsed.bookEn, parsed.chapter || 1);

  let isKrv4 = Array.isArray(chapArr) && chapArr.length > 0;

  if (!isKrv4) {
    const rawBook = (Array.isArray(bibleData) ? bibleData : []).find((b) => b.name === parsed.bookEn || b.name === parsed.bookKo);
    chapArr = rawBook?.chapters?.[chIdx] || [];
  }

  const startV = parsed.hasSpecificVerse ? parsed.startV : 1;
  const endV = parsed.hasSpecificVerse ? parsed.endV : chapArr.length;

  const allChapterVerses = chapArr.map((txt, idx) => {
    const rawStr = String(txt || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
    const { pericope, pureText } = splitPericopeAndVerse(rawStr);
    const vNum = idx + 1;
    return {
      vNum,
      pericope,
      text: pureText,
      rawText: rawStr,
      isHighlight: vNum >= startV && vNum <= endV
    };
  });

  const filteredVerses = parsed.hasSpecificVerse
    ? allChapterVerses.filter((v) => v.vNum >= startV && v.vNum <= endV)
    : allChapterVerses;

  return {
    parsed: {
      ...parsed,
      startV: startV || 1,
      endV: endV || chapArr.length,
      displayLabel: parsed.hasSpecificVerse
        ? `${parsed.bookKo} ${parsed.chapter}:${startV}${endV > startV ? `-${endV}` : ''}`
        : `${parsed.bookKo} ${parsed.chapter}장`
    },
    verses: filteredVerses,
    allChapterVerses,
    isKrv4
  };
};

const resolveInlineVerseAutoComplete = (rawTextBeforeCursor, krv4Db = null) => {
  if (!rawTextBeforeCursor) return null;
  const match = rawTextBeforeCursor.match(/(?:^|[\s\n(>])([가-힣]{1,6})\s*(\d+):(\d+)(?:[-~](\d+))?$/);
  if (!match) return null;

  const fullMatchedToken = match[0].replace(/^[\s\n(>]/, '');
  const [, bookToken, chStr, vStartStr, vEndStr] = match;
  const refQuery = `${bookToken} ${chStr}:${vStartStr}${vEndStr ? `-${vEndStr}` : ''}`;

  const scriptData = getLocalScriptureVerses(refQuery, krv4Db);
  if (!scriptData.parsed || scriptData.verses.length === 0) return null;

  const combinedVerseText = scriptData.verses
    .map((v) => (scriptData.verses.length > 1 ? `(${v.vNum}) ${v.text}` : v.text))
    .join(' ');

  return {
    matchedToken: fullMatchedToken,
    refLabel: scriptData.parsed.displayLabel,
    verseText: combinedVerseText,
    formattedPlain: `[${scriptData.parsed.displayLabel}] ${combinedVerseText} `,
    formattedHtml: `<b>[${scriptData.parsed.displayLabel}]</b> ${combinedVerseText}&nbsp;`
  };
};

const searchBibleByKeyword = (keyword, maxResults = 45, krv4Db = null) => {
  const kw = (keyword || '').trim();
  if (!kw || kw.length < 2) return [];
  const results = [];
  const activeKrv4 = krv4Db || (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null);

  if (activeKrv4 && Object.keys(activeKrv4).length > 0) {
    for (let bIdx = 0; bIdx < BIBLE_66_CANON.length; bIdx++) {
      const canon = BIBLE_66_CANON[bIdx];
      const chaps = activeKrv4[canon.en] || activeKrv4[canon.ko] || [];
      for (let cIdx = 0; cIdx < chaps.length; cIdx++) {
        const verses = chaps[cIdx] || [];
        for (let vIdx = 0; vIdx < verses.length; vIdx++) {
          if (!verses[vIdx]) continue;
          const rawV = String(verses[vIdx]).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
          const { pericope, pureText } = splitPericopeAndVerse(rawV);
          if (pureText.includes(kw) || (pericope && pericope.includes(kw))) {
            results.push({
              ref: `${canon.ko} ${cIdx + 1}:${vIdx + 1}`,
              bookKo: canon.ko,
              chapter: cIdx + 1,
              verse: vIdx + 1,
              pericope,
              text: pureText,
              isKrv4: true
            });
            if (results.length >= maxResults) return results;
          }
        }
      }
    }
    if (results.length > 0) return results;
  }

  const books = Array.isArray(bibleData) ? bibleData : [];
  for (let bIdx = 0; bIdx < books.length; bIdx++) {
    const bookObj = books[bIdx];
    const canon = BIBLE_66_CANON.find((c) => c.en === bookObj.name || c.ko === bookObj.name);
    const koBook = canon ? canon.ko : bookObj.name;
    const chaps = bookObj.chapters || [];

    for (let cIdx = 0; cIdx < chaps.length; cIdx++) {
      const verses = chaps[cIdx] || [];
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const rawV = String(verses[vIdx]).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
        const { pericope, pureText } = splitPericopeAndVerse(rawV);
        if (pureText.includes(kw)) {
          results.push({
            ref: `${koBook} ${cIdx + 1}:${vIdx + 1}`,
            bookKo: koBook,
            chapter: cIdx + 1,
            verse: vIdx + 1,
            pericope,
            text: pureText,
            isKrv4: false
          });
          if (results.length >= maxResults) return results;
        }
      }
    }
  }
  return results;
};

// =====================================================================
// 고정밀 유튜브 자막·적용질문 OCR 전처리 및 판독 엔진
// =====================================================================
let tesseractLoaderPromise = null;
const ensureTesseractLoaded = () => {
  if (typeof window !== 'undefined' && window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }
  if (tesseractLoaderPromise) return tesseractLoaderPromise;

  tesseractLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
  return tesseractLoaderPromise;
};

const OCR_CROP_REGIONS = {
  question_box: {
    label: '하단 적용질문·설교자막',
    xRatio: 0.04,
    yRatio: 0.54,
    wRatio: 0.86,
    hRatio: 0.36
  },
  subtitle_bottom: {
    label: '하단 1~2줄 자막',
    xRatio: 0.08,
    yRatio: 0.66,
    wRatio: 0.82,
    hRatio: 0.24
  },
  center_banner: {
    label: '중앙 타이틀·구절',
    xRatio: 0.06,
    yRatio: 0.22,
    wRatio: 0.88,
    hRatio: 0.50
  },
  full: {
    label: '영상 전체 영역',
    xRatio: 0.03,
    yRatio: 0.10,
    wRatio: 0.94,
    hRatio: 0.80
  }
};

const detectYoutubePlayerBoundsInScreenshot = (sourceCanvas) => {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  if (sw >= sh * 1.15) {
    return { x: 0, y: 0, w: sw, h: sh, isMobilePortrait: false };
  }

  const ctx = sourceCanvas.getContext('2d');
  const sampleW = 60;
  const stepX = Math.max(1, Math.floor(sw / sampleW));
  const rowDarkness = new Float32Array(sh);

  const imgData = ctx.getImageData(0, 0, sw, sh).data;
  for (let y = 0; y < sh; y++) {
    let darkCount = 0;
    let totalSampled = 0;
    for (let x = Math.floor(sw * 0.08); x < Math.floor(sw * 0.92); x += stepX) {
      const idx = (y * sw + x) * 4;
      const r = imgData[idx],
        g = imgData[idx + 1],
        b = imgData[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 95) darkCount++;
      totalSampled++;
    }
    rowDarkness[y] = totalSampled > 0 ? darkCount / totalSampled : 0;
  }

  const expectedVideoH = Math.floor(sw * 0.5625);
  let bestStartY = Math.floor(sh * 0.18);
  let maxScore = -1;

  const minSearchY = Math.floor(sh * 0.06);
  const maxSearchY = Math.max(minSearchY + 10, Math.floor(sh * 0.72) - expectedVideoH);

  for (let y = minSearchY; y <= maxSearchY; y += 4) {
    let sum = 0;
    for (let dy = 0; dy < expectedVideoH; dy += 4) {
      sum += rowDarkness[y + dy] || 0;
    }
    if (sum > maxScore) {
      maxScore = sum;
      bestStartY = y;
    }
  }

  if (maxScore < (expectedVideoH / 4) * 0.18) {
    bestStartY = Math.floor(sh * 0.22);
  }

  return {
    x: Math.floor(sw * 0.02),
    y: bestStartY,
    w: Math.floor(sw * 0.96),
    h: Math.min(sh - bestStartY, Math.floor(expectedVideoH * 1.08)),
    isMobilePortrait: true
  };
};

const createHighAccuracyOcrImage = (sourceCanvas, cropMode = 'question_box', playerRect = null, customBox = null) => {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  let cropX = 0,
    cropY = 0,
    cropW = sw,
    cropH = sh;

  if (customBox && customBox.w > 0.05 && customBox.h > 0.03) {
    cropX = Math.max(0, Math.floor(sw * customBox.x));
    cropY = Math.max(0, Math.floor(sh * customBox.y));
    cropW = Math.min(sw - cropX, Math.max(60, Math.floor(sw * customBox.w)));
    cropH = Math.min(sh - cropY, Math.max(30, Math.floor(sh * customBox.h)));
  } else {
    let baseX = 0,
      baseY = 0,
      baseW = sw,
      baseH = sh;
    if (playerRect && playerRect.width > 120 && window.innerWidth > 0 && window.innerHeight > 0) {
      const scaleX = sw / window.innerWidth;
      const scaleY = sh / window.innerHeight;
      baseX = Math.max(0, Math.floor(playerRect.left * scaleX));
      baseY = Math.max(0, Math.floor(playerRect.top * scaleY));
      baseW = Math.min(sw - baseX, Math.floor(playerRect.width * scaleX));
      baseH = Math.min(sh - baseY, Math.floor(playerRect.height * scaleY));
    } else {
      const detected = detectYoutubePlayerBoundsInScreenshot(sourceCanvas);
      baseX = detected.x;
      baseY = detected.y;
      baseW = detected.w;
      baseH = detected.h;
    }

    const region = OCR_CROP_REGIONS[cropMode] || OCR_CROP_REGIONS.question_box;
    cropX = Math.floor(baseX + baseW * region.xRatio);
    cropW = Math.max(80, Math.floor(baseW * region.wRatio));
    cropY = Math.floor(baseY + baseH * region.yRatio);
    cropH = Math.max(40, Math.floor(baseH * region.hRatio));
  }

  const targetScale = Math.min(2.4, 1600 / Math.max(1, cropW));
  const pad = 28;
  const innerW = Math.max(360, Math.floor(cropW * targetScale));
  const innerH = Math.max(110, Math.floor(cropH * targetScale));
  const outW = innerW + pad * 2;
  const outH = innerH + pad * 2;

  const procCanvas = document.createElement('canvas');
  procCanvas.width = outW;
  procCanvas.height = outH;
  const ctx = procCanvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, pad, pad, innerW, innerH);

  const imgData = ctx.getImageData(pad, pad, innerW, innerH);
  const data = imgData.data;

  let totalLum = 0;
  const pixelCount = innerW * innerH;
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgLum = totalLum / pixelCount;
  const isDarkSubtitleBox = avgLum < 170;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (isDarkSubtitleBox) {
      const isBrightText = lum > 142 || (r > 165 && g > 150) || (g > 170 && b > 170);
      const val = isBrightText ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    } else {
      const val = lum < 132 ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, pad, pad);

  return {
    preprocessedDataUrl: procCanvas.toDataURL('image/png'),
    croppedPreviewUrl: (() => {
      const prevC = document.createElement('canvas');
      prevC.width = Math.max(1, cropW);
      prevC.height = Math.max(1, cropH);
      prevC.getContext('2d').drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return prevC.toDataURL('image/jpeg', 0.92);
    })()
  };
};

const cleanKoreanOcrText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map((line) =>
      line
        .replace(/[|¦_~`^\\/<>{}[\]§¶©®™£¥€$@#%&*+=]/g, ' ')
        .replace(/\b[a-zA-Z]{1,3}\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((line) => {
      if (line.length < 2) return false;
      const koreanChars = (line.match(/[가-힣]/g) || []).length;
      return koreanChars >= 2;
    })
    .join('\n');
};

export default function Sermon({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  SubPageHeader,
  date,
  isGisangogi,
  authUser,
  renderToolbar,
  sermonEditorRef,
  handleStickerAdd,
  handleMemoAdd,
  handleFileUpload,
  CanvasEngine,
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  StickerLayer,
  currDay = {},
  updateDay,
  onPtrDown,
  openModal,
  downloadSermonWord,
  gisangogiUrl,
  setGisangogiUrl,
  getArr,
  ymdStr,
  extractVideoId,
  handleUpdateSharedQt,
  handleUpdateSharedSermon,
  globalSharedQt = {},
  setDailyData,
  findBibleText,
  logUserAction,
  dailyData = {}
}) {
  if (!SubPageHeader) return null;

  const safeDay = currDay || {};
  const isSp = isGisangogi ? isGisangogi(date) : false;

  const [showToolbar, setShowToolbar] = useState(false);
  const rootSermonFullscreenRef = useRef(null);
  const ytPlayerBoxRef = useRef(null);
  const cinemaPlayerBoxRef = useRef(null);
  const captureInputRef = useRef(null);
  const pasteZoneRef = useRef(null);

  const [isSanctuaryMode, setIsSanctuaryMode] = useState(() => {
    return localStorage.getItem('sermon_sanctuary_mode') === 'true';
  });

  const [isVideoPinned, setIsVideoPinned] = useState(false);
  const [showOutlineBuilder, setShowOutlineBuilder] = useState(true);
  const [actionToast, setActionToast] = useState(null);
  const [linkedRefs, setLinkedRefs] = useState([]);
  const [activeBacklink, setActiveBacklink] = useState(null);

  const [minimizedModals, setMinimizedModals] = useState({
    ocr: false,
    finder: false,
    inspector: false
  });

  // 실시간 음성 받아쓰기(STT) 상태
  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const [sttTargetField, setSttTargetField] = useState('notes');
  const [sttInterimText, setSttInterimText] = useState('');
  const sermonRecRef = useRef(null);
  const sttTargetRef = useRef('notes');
  useEffect(() => {
    sttTargetRef.current = sttTargetField;
  }, [sttTargetField]);

  // 전체화면 시네마 워크스테이션 & 원어·아크·말씀찾기 상태
  const [isLiveCinemaMode, setIsLiveCinemaMode] = useState(false);
  const [cinemaHudTab, setCinemaHudTab] = useState('outline');
  const [isCinemaUiHidden, setIsCinemaUiHidden] = useState(false);
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcModalInitialMode, setArcModalInitialMode] = useState('arc');
  const [selectedWordVerse, setSelectedWordVerse] = useState(1);
  const [customRefQuery, setCustomRefQuery] = useState('');

  // 개역개정 4판 DB 로드 상태 & 말씀·예시구절 멀티 검색 팝업 상태
  const [krv4TxtDb, setKrv4TxtDb] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [isBibleFinderOpen, setIsBibleFinderOpen] = useState(false);
  const [finderMode, setFinderMode] = useState('ref');
  const [finderRefInput, setFinderRefInput] = useState('');
  const [showFullChapterInFinder, setShowFullChapterInFinder] = useState(false);
  const [finderVersionMode, setFinderVersionMode] = useState('krv4');
  const [finderKeyword, setFinderKeyword] = useState('');
  const [finderKeywordResults, setFinderKeywordResults] = useState([]);

  // 10대 학술 원어 강해 모달 상태
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

  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});
  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);

  // =====================================================================
  // 유튜브 자막·적용질문 스마트 OCR 스튜디오 상태
  // =====================================================================
  const [isOcrStudioOpen, setIsOcrStudioOpen] = useState(false);
  const [studioDraftItem, setStudioDraftItem] = useState(null);
  const [sermonCaptures, setSermonCaptures] = useState(() => {
    if (Array.isArray(safeDay.sermonCaptures)) return safeDay.sermonCaptures;
    try {
      const saved = JSON.parse(localStorage.getItem(`sermon_captures_${date}`) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [ocrLoadingId, setOcrLoadingId] = useState(null);
  const [ocrCropPreset, setOcrCropPreset] = useState('question_box');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`sermon_captures_${date}`) || '[]');
      setSermonCaptures(Array.isArray(safeDay.sermonCaptures) ? safeDay.sermonCaptures : saved);
    } catch {
      setSermonCaptures([]);
    }
  }, [date, safeDay.sermonCaptures]);

  const syncCapturesToDay = useCallback(
    (nextCaptures) => {
      setSermonCaptures(nextCaptures);
      try {
        localStorage.setItem(`sermon_captures_${date}`, JSON.stringify(nextCaptures));
      } catch (_) {}
      if (updateDay) {
        updateDay({ sermonCaptures: nextCaptures });
      }
    },
    [date, updateDay]
  );

  useEffect(() => {
    ensureKrv4TxtLoaded().then((parsedMap) => {
      if (parsedMap) setKrv4TxtDb(parsedMap);
    });
    ensureMasterStrongs();
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then((r) => (r.ok ? r.json() : {})).then((d) => setCommentaryDb(d || {})).catch(() => {});
    fetch('/data/matthew_henry.json').then((r) => (r.ok ? r.json() : {})).then((d) => setMatthewHenryDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then((r) => (r.ok ? r.json() : {})).then((d) => setTargumPeshittaDb(d || {})).catch(() => {});

    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const activeReferenceStr = useMemo(() => {
    return (
      (customRefQuery && customRefQuery.trim()) ||
      (safeDay.sermonReference && safeDay.sermonReference.trim()) ||
      (globalSharedQt?.[date]?.sermonData?.reference && globalSharedQt[date].sermonData.reference.trim()) ||
      ''
    );
  }, [customRefQuery, safeDay.sermonReference, globalSharedQt, date]);

  const localScriptureData = useMemo(() => {
    return getLocalScriptureVerses(activeReferenceStr, krv4TxtDb);
  }, [activeReferenceStr, krv4TxtDb]);

  const finderScriptureData = useMemo(() => {
    return getLocalScriptureVerses(finderRefInput || activeReferenceStr, krv4TxtDb);
  }, [finderRefInput, activeReferenceStr, krv4TxtDb]);

  useEffect(() => {
    if (localScriptureData.parsed?.startV) {
      setSelectedWordVerse(localScriptureData.parsed.startV);
    }
  }, [localScriptureData.parsed?.bookKo, localScriptureData.parsed?.chapter, localScriptureData.parsed?.startV]);

  // 능동형 UI: 예배 노트 작성 완성도 실시간 계산
  const sermonCompletionPercent = useMemo(() => {
    let score = 0;
    if ((safeDay.sermonTitle || globalSharedQt?.[date]?.sermonData?.title || '').trim()) score += 20;
    if ((safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || '').trim()) score += 20;
    if ((safeDay.sermonPoint1 || safeDay.sermonPoint2 || safeDay.sermonPoint3 || '').trim()) score += 20;
    if ((safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '').trim()) score += 20;
    if ((safeDay.sermonGraceLine || safeDay.sermonConviction || '').trim()) score += 20;
    return score;
  }, [safeDay, globalSharedQt, date]);

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2600);
  }, []);

  // =====================================================================
  // 성경구절 적고 스페이스바(Space) 누르면 즉시 개역개정 4판 구절 자동완성
  // =====================================================================
  const handleSpacebarVerseAutoCompleteOnInput = useCallback(
    (e, fieldKey, currentVal, customSetter = null) => {
      if (e.key !== ' ' && e.code !== 'Space') return;
      const targetEl = e.target;
      const cursorPos = targetEl.selectionStart ?? (currentVal || '').length;
      const textBefore = (currentVal || '').slice(0, cursorPos);
      const textAfter = (currentVal || '').slice(cursorPos);

      const resolved = resolveInlineVerseAutoComplete(textBefore, krv4TxtDb);
      if (!resolved) return;

      e.preventDefault();
      const replacedBefore = textBefore.slice(0, textBefore.length - resolved.matchedToken.length) + resolved.formattedPlain;
      const nextValue = replacedBefore + textAfter;

      if (customSetter) {
        customSetter(nextValue);
      } else if (updateDay) {
        updateDay({ [fieldKey]: nextValue });
      }
      showToast(`[${resolved.refLabel}] 개역개정 4판 본문이 자동 완성되었습니다.`);
    },
    [krv4TxtDb, updateDay, showToast]
  );

  const handleEditorContainerKeyDown = useCallback(
    (e) => {
      if (e.key !== ' ' && e.code !== 'Space') return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      const textBefore = (node.textContent || '').slice(0, range.startOffset);
      const resolved = resolveInlineVerseAutoComplete(textBefore, krv4TxtDb);
      if (!resolved) return;

      e.preventDefault();
      const tokenLen = resolved.matchedToken.length;
      const beforeToken = (node.textContent || '').slice(0, range.startOffset - tokenLen);
      const afterCursor = (node.textContent || '').slice(range.startOffset);

      const replacementText = `[${resolved.refLabel}] ${resolved.verseText} `;
      node.textContent = beforeToken + replacementText + afterCursor;

      const newCursorOffset = beforeToken.length + replacementText.length;
      const newRange = document.createRange();
      newRange.setStart(node, Math.min(newCursorOffset, node.textContent.length));
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      const editableRoot = node.parentElement?.closest('[contenteditable="true"]');
      if (editableRoot && updateDay) {
        updateDay({ sermonNotes: editableRoot.innerHTML });
      }
      showToast(`[${resolved.refLabel}] 개역개정 4판 말씀이 노트에 자동 입력되었습니다.`);
    },
    [krv4TxtDb, updateDay, showToast]
  );

  // =====================================================================
  // 원어 어절 선택 및 10대 학술 원어 강해 로드
  // =====================================================================
  const handleSelectInspectorWord = useCallback(
    async (word) => {
      setSelectedWordDetail(word);
      setConcordanceList([]);
      setConcordanceTotalCount(0);

      const note = customNotesMap[word.strongs];
      setCustomInputTrans(note?.translation || '');
      setCustomInputMemo(note?.memo || '');

      if (supabase && word.strongs && !word.strongs.endsWith('0000')) {
        try {
          const { data, count, error } = await supabase
            .from('interlinear_bible')
            .select('book, chapter, verse, original_word, korean_trans', { count: 'exact' })
            .eq('strongs_id', word.strongs)
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

  const openMcheyneStyleVerseInspector = useCallback(
    async (customRefStr, targetVerseNum) => {
      setMinimizedModals((prev) => ({ ...prev, inspector: false }));
      const queryStr = (customRefStr && customRefStr.trim()) || activeReferenceStr || '창세기 1:1';
      const scriptData = getLocalScriptureVerses(queryStr, krv4TxtDb);
      const parsed = scriptData.parsed || { bookKo: '창세기', bookEn: 'Genesis', chapter: 1, startV: 1 };

      const koBook = parsed.bookKo || '창세기';
      const chNum = parsed.chapter || 1;
      const vNum = targetVerseNum || parsed.startV || 1;
      const bookInfo = BIBLE_66_MAP[koBook] || BIBLE_66_MAP[parsed.bookEn] || { ko: koBook, isOT: true };
      const isOT = bookInfo.isOT;

      const foundVerseObj = scriptData.allChapterVerses?.find((v) => v.vNum === Number(vNum)) || scriptData.verses[0];
      const verseText = foundVerseObj?.text || `${koBook} ${chNum}장 ${vNum}절 말씀`;

      const easyKey = `${koBook}-${chNum}-${vNum}`;
      const easyText = easyBibleDb[easyKey] || '';
      const webText = webBibleDb[easyKey] || webBibleDb[`${parsed.bookEn}-${chNum}-${vNum}`] || '';

      setInspectorTarget({
        book: koBook,
        bookEn: parsed.bookEn,
        chapter: chNum,
        verse: vNum,
        pericope: foundVerseObj?.pericope || null,
        text: decodeHtmlEntities(verseText),
        easyText,
        webText,
        isOT,
        allChapterVerses: scriptData.allChapterVerses || scriptData.verses
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
          const strongIds = Array.from(new Set(wordsData.map((w) => w.strongs_id).filter(Boolean)));
          let dictMap = new Map();

          if (strongIds.length > 0) {
            const { data: dictRows } = await supabase
              .from('strongs_dictionary')
              .select('*')
              .in('strongs_id', strongIds);

            if (dictRows && dictRows.length > 0) {
              dictRows.forEach((row) => dictMap.set(row.strongs_id, row));
            }
          }

          const enriched = wordsData.map((w) => {
            const sId = (w.strongs_id || '').trim();
            const master = masterDict?.[sId] || {};
            const dbDict = dictMap.get(sId) || {};
            const morph = decodeExhaustiveMorphology(w.grammar);

            const inflectedWord = (w.original_word || '').trim();
            const lemmaWord = (master.original || dbDict.original_word || inflectedWord).trim();
            const isInflectedDifferent = lemmaWord && inflectedWord && lemmaWord !== inflectedWord;

            const lemmaMeaning = master.korean || dbDict.meaning || w.korean_trans || '원어 어휘';
            const finalPron = master.pron || (w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : '');
            const cleanEng = (master.eng || w.gloss || w.korean_trans || 'n/a').toLowerCase();
            const userCustom = customNotesMap[sId] || null;

            return {
              id: w.id || w.word_order,
              order: w.word_order,
              inflected: inflectedWord,
              lemma: lemmaWord,
              isInflectedDifferent,
              pron: finalPron,
              korContextual: decodeHtmlEntities(userCustom?.translation || lemmaMeaning),
              korLemma: decodeHtmlEntities(lemmaMeaning),
              eng: decodeHtmlEntities(cleanEng),
              grammarDecoded: morph.label,
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
        console.error('원어 인스펙터 로드 오류:', err);
      } finally {
        setIsInspectorLoading(false);
      }
    },
    [activeReferenceStr, krv4TxtDb, easyBibleDb, webBibleDb, customNotesMap, handleSelectInspectorWord]
  );

  const handleInsertWordToSermonNote = (word) => {
    if (!word || !inspectorTarget) return;
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice =
      customInputMemo || word.userCustomNote?.memo ? `<br/>↳ 연구 메모: ${customInputMemo || word.userCustomNote?.memo}` : '';
    const htmlSnippet = `<p><b>[${inspectorTarget.book} ${inspectorTarget.chapter}:${inspectorTarget.verse} 원어강해] ${word.inflected}${lemmaNotice} (${word.strongs})</b>: ${customInputTrans || word.korContextual} — <i>${word.grammarDecoded}</i>${customMemoNotice}</p>`;

    const prev = safeDay.sermonNotes || '';
    updateDay && updateDay({ sermonNotes: prev + htmlSnippet });
    showToast(`[${word.inflected}] 원어 강해가 설교 필기장에 삽입되었습니다.`);
  };

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
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsLiveCinemaMode(false);
    if (setActiveScreen) setActiveScreen('interlinear');
  };

  // =====================================================================
  // 유튜브 자막·적용질문 스마트 OCR 엔진 (붙여넣기 & 사진 불러오기 완벽 복구)
  // =====================================================================
  const [touchCropBox, setTouchCropBox] = useState(null);
  const touchStartRef = useRef(null);
  const fullPreviewImgRef = useRef(null);

  const runOcrOnCaptureItem = useCallback(
    async (captureItem, customPreset, customTouchBox = null) => {
      if (!captureItem || !captureItem.imageUrl) return;
      const activePreset = customPreset || ocrCropPreset;
      setOcrLoadingId(captureItem.id);
      showToast('자막·적용질문 텍스트를 판독 중입니다...');

      try {
        const Tesseract = await ensureTesseractLoaded();

        let targetImgUrl = captureItem.preprocessedUrl || captureItem.subtitleCropUrl || captureItem.imageUrl;
        let nextSubCropUrl = captureItem.subtitleCropUrl;

        if ((customPreset || customTouchBox) && captureItem.imageUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = captureItem.imageUrl;
          });
          const tempC = document.createElement('canvas');
          tempC.width = img.width;
          tempC.height = img.height;
          tempC.getContext('2d').drawImage(img, 0, 0);
          const reCropped = createHighAccuracyOcrImage(tempC, activePreset, captureItem.playerRect || null, customTouchBox);
          targetImgUrl = reCropped.preprocessedDataUrl;
          nextSubCropUrl = reCropped.croppedPreviewUrl;
        }

        const result = await Tesseract.recognize(targetImgUrl, 'kor+eng');
        const cleaned = cleanKoreanOcrText(result?.data?.text || '');

        const finalExtracted =
          cleaned || '자막을 명확히 인식하지 못했습니다. 아래 원본 화면 위에서 글자 부분만 드래그하여 영역을 지정해 보세요.';

        const updatedItem = {
          ...captureItem,
          subtitleCropUrl: nextSubCropUrl || captureItem.subtitleCropUrl,
          ocrText: finalExtracted
        };

        setStudioDraftItem(updatedItem);

        setSermonCaptures((prev) => {
          const exists = prev.some((item) => item.id === updatedItem.id);
          const updated = exists ? prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)) : [updatedItem, ...prev];
          try {
            localStorage.setItem(`sermon_captures_${date}`, JSON.stringify(updated));
          } catch (_) {}
          if (updateDay) updateDay({ sermonCaptures: updated });
          return updated;
        });

        showToast('자막·적용질문 텍스트 추출이 완료되었습니다.');
      } catch (err) {
        console.error('OCR Error:', err);
        showToast('텍스트 판독 중 오류가 발생했습니다.');
      } finally {
        setOcrLoadingId(null);
      }
    },
    [ocrCropPreset, date, updateDay, showToast]
  );

  const processCapturedCanvasToItem = useCallback(
    async (sourceCanvas, label = '자막 스캔', playerRect = null) => {
      const fullDataUrl = sourceCanvas.toDataURL('image/jpeg', 0.9);
      const { preprocessedDataUrl, croppedPreviewUrl } = createHighAccuracyOcrImage(sourceCanvas, ocrCropPreset, playerRect, null);

      const newItem = {
        id: `cap_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        label,
        imageUrl: fullDataUrl,
        subtitleCropUrl: croppedPreviewUrl,
        preprocessedUrl: preprocessedDataUrl,
        playerRect: playerRect ? { left: playerRect.left, top: playerRect.top, width: playerRect.width, height: playerRect.height } : null,
        ocrText: '자막 박스에서 글자를 판독하고 있습니다...'
      };

      setTouchCropBox(null);
      setStudioDraftItem(newItem);
      setMinimizedModals((prev) => ({ ...prev, ocr: false }));
      setIsOcrStudioOpen(true);

      const nextList = [newItem, ...sermonCaptures];
      syncCapturesToDay(nextList);

      await runOcrOnCaptureItem(newItem);
    },
    [ocrCropPreset, sermonCaptures, syncCapturesToDay, runOcrOnCaptureItem]
  );

  // 이미지 파일/Blob 공통 디코더 (모바일·PC 모두 안정 동작)
  const decodeBlobOrFileToOcr = useCallback(
    (blobOrFile, label = '이미지 자막 스캔') => {
      if (!blobOrFile) return;
      const objectUrl = URL.createObjectURL(blobOrFile);
      const img = new Image();
      img.onload = async () => {
        const maxDim = 2200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        await processCapturedCanvasToItem(canvas, label, null);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        showToast('이미지를 불러올 수 없습니다.');
      };
      img.src = objectUrl;
    },
    [processCapturedCanvasToItem, showToast]
  );

  // 전역 Ctrl+V 붙여넣기 이벤트 수신 (스캐너 모달 오픈 여부 무관하게 즉시 처리)
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            decodeBlobOrFileToOcr(blob, '클립보드 붙여넣기 스캔');
            return;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [decodeBlobOrFileToOcr]);

  const handleToggleOcrStudioModal = () => {
    setMinimizedModals((prev) => ({ ...prev, ocr: false }));
    setIsOcrStudioOpen((prev) => {
      const next = !prev;
      if (next && sermonCaptures.length > 0 && !studioDraftItem) {
        setStudioDraftItem(sermonCaptures[0]);
      }
      return next;
    });
  };

  // 클립보드 버튼 클릭 시 클립보드 읽기 + 권한 제한 시 붙여넣기 전용 영역 포커스
  const handleReadClipboardImageForOcr = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((tp) => tp.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            decodeBlobOrFileToOcr(blob, '클립보드 붙여넣기 스캔');
            return;
          }
        }
        showToast('클립보드에 복사된 이미지가 없습니다. 화면 캡처 후 다시 시도하세요.');
        return;
      }
    } catch (_) {
      // 모바일/사파리 등 브라우저 클립보드 읽기 권한 제한 시 전용 붙여넣기 영역 포커스
    }
    if (pasteZoneRef.current) {
      pasteZoneRef.current.focus();
      showToast('아래 점선 영역을 길게 눌러 [붙여넣기] 하거나 Ctrl+V를 누르세요.');
    } else if (captureInputRef.current) {
      captureInputRef.current.click();
    }
  };

  const handleDirectTabCapture = async () => {
    if (isCapturingScreen) return;

    const isMobileOrTablet =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== 'function';

    if (isMobileOrTablet) {
      setMinimizedModals((prev) => ({ ...prev, ocr: false }));
      setIsOcrStudioOpen(true);
      showToast('스캐너가 열렸습니다. [사진 불러오기] 또는 [붙여넣기]를 선택하세요.');
      return;
    }

    if (isOcrStudioOpen) {
      setIsOcrStudioOpen(false);
      await new Promise((r) => setTimeout(r, 320));
    }

    setIsCapturingScreen(true);
    try {
      const activePlayerEl = isLiveCinemaMode ? cinemaPlayerBoxRef.current : ytPlayerBoxRef.current;
      const playerRect = activePlayerEl ? activePlayerEl.getBoundingClientRect() : null;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: true
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((r) => setTimeout(r, 300));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stream.getTracks().forEach((track) => track.stop());
      await processCapturedCanvasToItem(canvas, '실시간 자막 캡처', playerRect);
    } catch (err) {
      showToast('화면 캡처가 취소되었습니다.');
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const handleUploadCaptureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    decodeBlobOrFileToOcr(file, '불러온 사진 자막 스캔');
    e.target.value = '';
  };

  const handleDispatchOcrTextToField = (targetField, rawText, capItem) => {
    const text = (rawText || '').trim();
    if (!text) return alert('전송할 텍스트가 없습니다.');

    if (targetField === 'apply') {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const curQuestions = getArr ? [...getArr(safeDay.applyQuestions)] : [];
      const nextQuestions = [...curQuestions, ...lines];
      updateDay && updateDay({ applyQuestions: nextQuestions });
      showToast(`추출된 문장 ${lines.length}건이 적용 질문에 등록되었습니다.`);
    } else if (targetField === 'conviction') {
      updateDay && updateDay({ sermonConviction: text.replace(/\n/g, ' ') });
      showToast('추출된 문장이 핵심 한 문장 요약에 등록되었습니다.');
    } else if (targetField === 'point1' || targetField === 'point2' || targetField === 'point3') {
      const keyMap = { point1: 'sermonPoint1', point2: 'sermonPoint2', point3: 'sermonPoint3' };
      const labelMap = { point1: '제1대지', point2: '제2대지', point3: '제3대지' };
      const fieldKey = keyMap[targetField];
      const existing = safeDay[fieldKey] ? `${safeDay[fieldKey]} / ` : '';
      updateDay && updateDay({ [fieldKey]: existing + text.replace(/\n/g, ' ') });
      showToast(`추출된 문장이 ${labelMap[targetField]}에 입력되었습니다.`);
    } else {
      const prev = safeDay.sermonNotes || '';
      const timeStr = capItem?.timestamp || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const snippet = `<div style="margin:10px 0; padding:12px; border:1px solid #cbd5e1; border-radius:10px; background:rgba(15,23,42,0.03);"><p><b>[자막·질문 스캔 (${timeStr})]</b></p><p>${text.replace(/\n/g, '<br/>')}</p></div><p><br/></p>`;
      updateDay && updateDay({ sermonNotes: prev + snippet });
      showToast('추출된 텍스트가 설교 필기장 본문에 삽입되었습니다.');
    }
  };

  const handleInsertVerseToSermonNotes = (refLabel, verseText) => {
    const prev = safeDay.sermonNotes || '';
    const { pureText } = splitPericopeAndVerse(verseText);
    const snippet = `<div style="margin:8px 0; padding:10px 14px; border-left:3px solid #D97706; background:rgba(217,119,6,0.06); border-radius:6px;"><p><b>[${refLabel} · 개역개정4판]</b> ${pureText}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast(`[${refLabel}] 개역개정 4판 말씀이 설교 필기장에 삽입되었습니다.`);
  };

  const handleOpenKrv4ScriptureView = (refStr) => {
    const targetRef = (refStr && refStr.trim()) || activeReferenceStr;
    if (findBibleText && targetRef) {
      try {
        findBibleText(targetRef);
      } catch (_) {}
    }
    setFinderRefInput(targetRef || '');
    setShowFullChapterInFinder(false);
    setFinderMode('ref');
    setMinimizedModals((prev) => ({ ...prev, finder: false }));
    setIsBibleFinderOpen(true);
  };

  const enterLiveCinemaFullscreen = async (defaultTab = 'outline') => {
    setIsLiveCinemaMode(true);
    setIsCinemaUiHidden(false);
    setCinemaHudTab(defaultTab);
    setTimeout(async () => {
      try {
        if (rootSermonFullscreenRef.current && rootSermonFullscreenRef.current.requestFullscreen) {
          await rootSermonFullscreenRef.current.requestFullscreen();
        }
      } catch (_) {}
    }, 80);
  };

  const exitLiveCinemaFullscreen = async () => {
    setIsLiveCinemaMode(false);
    setIsCinemaUiHidden(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (_) {}
  };

  useEffect(() => {
    const plainText = (safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '');
    const combinedText = `${safeDay.sermonReference || ''} ${plainText}`;
    const detected = extractBibleReferences(combinedText);
    setLinkedRefs(detected);
  }, [safeDay.sermonNotes, safeDay.sermonReference]);

  // =====================================================================
  // 영상 URL 관리
  // =====================================================================
  const currentMonthNum = useMemo(() => {
    if (date && date.length >= 7) {
      return parseInt(date.substring(5, 7), 10) || 11;
    }
    return new Date().getMonth() + 1;
  }, [date]);

  const [monthlyGisanUrls, setMonthlyGisanUrls] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('monthly_gisangogi_urls') || '{}');
    } catch {
      return {};
    }
  });

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const activeMonthGisanUrl = useMemo(() => {
    if (monthlyGisanUrls[currentMonthNum]) return monthlyGisanUrls[currentMonthNum];
    const perMonthLocal = localStorage.getItem(`app_active_gisangogi_url_${currentMonthNum}`);
    if (perMonthLocal) return perMonthLocal;
    return gisangogiUrl || '';
  }, [monthlyGisanUrls, currentMonthNum, gisangogiUrl]);

  const [inputUrl, setInputUrl] = useState(activeMonthGisanUrl);

  useEffect(() => {
    setInputUrl(activeMonthGisanUrl);
  }, [activeMonthGisanUrl, date]);

  const handleApplyCurrentMonthGisanVideo = () => {
    const target = inputUrl.trim();
    if (!target) return alert('유튜브 링크를 입력해주세요.');

    const updatedMap = { ...monthlyGisanUrls, [currentMonthNum]: target };
    setMonthlyGisanUrls(updatedMap);
    localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(updatedMap));
    localStorage.setItem(`app_active_gisangogi_url_${currentMonthNum}`, target);

    if (setGisangogiUrl) setGisangogiUrl(target);
    if (updateDay) updateDay({ sermonVideoUrl: target });
    if (handleUpdateSharedSermon) handleUpdateSharedSermon(date, target);

    showToast(`${currentMonthNum}월 특별집회 영상 링크가 저장되었습니다.`);
  };

  const gisanVidId = extractVideoId ? extractVideoId(activeMonthGisanUrl) : null;
  const rawTarget = globalSharedQt?.[date]?.sermon || globalSharedQt?.[date]?.sermonData?.sermon || safeDay?.sermonVideoId || safeDay?.sermonVideoUrl;
  const currentVideoId = extractVideoId ? extractVideoId(rawTarget) : rawTarget;

  const activeYoutubeId = isSp ? gisanVidId || currentVideoId : currentVideoId;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const toggleSanctuaryMode = () => {
    const next = !isSanctuaryMode;
    setIsSanctuaryMode(next);
    localStorage.setItem('sermon_sanctuary_mode', String(next));
  };

  const handleShareVideo = () => {
    const targetUrl = safeDay.sermonVideoUrl || (safeDay.sermonVideoId ? `https://youtu.be/${safeDay.sermonVideoId}` : '');
    if (!targetUrl) return alert('공유할 유튜브 링크를 먼저 입력해주세요.');

    if (handleUpdateSharedQt) {
      handleUpdateSharedQt(date, 'sermon', targetUrl);
    } else if (handleUpdateSharedSermon) {
      handleUpdateSharedSermon(date, targetUrl);
    }

    if (navigator.share) {
      navigator
        .share({
          title: safeDay.sermonTitle || '예배 설교 영상',
          url: targetUrl
        })
        .catch(() => {});
    }
    showToast('예배 영상 링크가 공유되었습니다.');
  };

  const handleActionItemSync = (val) => {
    if (updateDay) {
      updateDay({ sermonActionItem: val, sermonActionCompleted: false });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const filtered = saved.filter((item) => item.date !== date || item.source !== 'sermon');
      if (val.trim()) {
        filtered.push({
          id: `sermon_${date}_${Date.now()}`,
          date: date,
          source: 'sermon',
          text: val.trim(),
          completed: false,
          graceLine: safeDay.sermonGraceLine || ''
        });
      }
      localStorage.setItem('apply_tracker_items', JSON.stringify(filtered));
    } catch (e) {}
  };

  const handleGraceLineSync = (val) => {
    if (updateDay) {
      updateDay({ sermonGraceLine: val });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const updated = saved.map((item) => {
        if (item.date === date && item.source === 'sermon') {
          return { ...item, graceLine: val };
        }
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSendDeclarationToCell = (text) => {
    if (!text || !text.trim()) return alert('전송할 감사 내용이 없습니다.');
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({
        id: Date.now(),
        date: date,
        source: 'sermon_declaration',
        text: encryptField(text.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      showToast('목장 모임 감사나눔으로 전송되었습니다.');
    } catch (e) {
      alert('전송 중 오류가 발생했습니다.');
    }
  };

  const inlineActionSendToTracker = () => {
    const textToPush = safeDay.sermonActionItem || safeDay.sermonGraceLine || safeDay.sermonTitle || '설교 결단 및 적용';
    handleActionItemSync(textToPush);
    showToast('적용 트래커에 반영되었습니다.');
  };

  const inlineActionSendToPrayer = () => {
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_sermon_${Date.now()}`,
        title: `[예배 결단] ${safeDay.sermonTitle || safeDay.sermonReference || date}`,
        content: encryptField(safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 중 결단한 기도 제목'),
        date: date,
        answered: false
      };
      localStorage.setItem('prayer_items', JSON.stringify([newPrayer, ...prayers]));
      showToast('나의 기도함에 보관되었습니다.');
    } catch (e) {
      showToast('기도함 저장 중 오류가 발생했습니다.');
    }
  };

  const inlineActionSendToCounseling = async () => {
    try {
      const counselingPayload = {
        user_name: authUser?.name || '성도',
        cell_name: authUser?.cell_name || '소속 목장',
        title: `[설교 나눔 요청] ${safeDay.sermonReference || date}`,
        content: encryptField(`설교 제목: ${safeDay.sermonTitle}\n본문: ${safeDay.sermonReference}\n나눔 내용: ${safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 관련 깊은 나눔이 필요합니다.'}`),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('counseling_qna').insert([counselingPayload]);
      }
      showToast('담당 교역자에게 1:1 상담이 요청되었습니다.');
    } catch (e) {
      showToast('상담 요청 전송 중 오류가 발생했습니다.');
    }
  };

  // =====================================================================
  // 실시간 STT(음성 필기) 엔진
  // =====================================================================
  const toggleSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('현재 브라우저에서 음성 인식을 지원하지 않습니다.');

    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      setSttInterimText('');
      if (sermonRecRef.current) {
        try {
          sermonRecRef.current.stop();
        } catch (e) {}
        sermonRecRef.current = null;
      }
      return;
    }

    try {
      const rec = new SR();
      rec.lang = 'ko-KR';
      rec.continuous = true;
      rec.interimResults = true;
      sermonRecRef.current = rec;

      rec.onresult = (ev) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          const transcript = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) {
            finalChunk += transcript.trim() + ' ';
          } else {
            interimChunk += transcript;
          }
        }

        setSttInterimText(interimChunk);

        if (finalChunk && setDailyData) {
          const target = sttTargetRef.current;
          setDailyData((prev) => {
            const d = prev[date] || {};
            if (target === 'conviction') {
              return { ...prev, [date]: { ...d, sermonConviction: ((d.sermonConviction || '') + ' ' + finalChunk).trim() } };
            } else if (target === 'point1') {
              return { ...prev, [date]: { ...d, sermonPoint1: ((d.sermonPoint1 || '') + ' ' + finalChunk).trim() } };
            } else if (target === 'point2') {
              return { ...prev, [date]: { ...d, sermonPoint2: ((d.sermonPoint2 || '') + ' ' + finalChunk).trim() } };
            } else if (target === 'point3') {
              return { ...prev, [date]: { ...d, sermonPoint3: ((d.sermonPoint3 || '') + ' ' + finalChunk).trim() } };
            } else if (target === 'apply') {
              const curArr = Array.isArray(d.applyQuestions) ? [...d.applyQuestions] : [];
              if (curArr.length === 0) curArr.push(finalChunk.trim());
              else curArr[curArr.length - 1] = (curArr[curArr.length - 1] + ' ' + finalChunk).trim();
              return { ...prev, [date]: { ...d, applyQuestions: curArr } };
            } else {
              const prevNotes = d.sermonNotes || '';
              return { ...prev, [date]: { ...d, sermonNotes: prevNotes + `<p>${finalChunk.trim()}</p>` } };
            }
          });
        }
      };

      rec.onend = () => {
        setIsSpeechRecording(false);
        setSttInterimText('');
        sermonRecRef.current = null;
      };

      rec.start();
      setIsSpeechRecording(true);
    } catch (err) {
      setIsSpeechRecording(false);
      setSttInterimText('');
    }
  }, [isSpeechRecording, date, setDailyData]);

  useEffect(() => {
    return () => {
      if (sermonRecRef.current) {
        try {
          sermonRecRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // =====================================================================
  // 3색 조화 팔레트 (메인 블루 #2563EB + 세이지 그린 #0D9488 + 웜 앰버 #D97706)
  // =====================================================================
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subSurfaceBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const dividerClass = isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  const sagePillClass = isDark
    ? 'bg-[#0D9488]/15 text-[#5EEAD4] hover:bg-[#0D9488]/25'
    : 'bg-[#0D9488]/10 text-[#0F766E] hover:bg-[#0D9488]/15';
  const amberPillClass = isDark
    ? 'bg-[#D97706]/15 text-[#FCD34D] hover:bg-[#D97706]/25'
    : 'bg-[#D97706]/10 text-[#B45309] hover:bg-[#D97706]/15';
  const bluePillClass = isDark
    ? 'bg-[#2563EB]/15 text-[#93C5FD] hover:bg-[#2563EB]/25'
    : 'bg-[#2563EB]/10 text-[#1D4ED8] hover:bg-[#2563EB]/15';

  const originalFontStyle = (isOT) =>
    isOT
      ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
      : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const currentInspectorKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentCommentary = commentaryDb[currentInspectorKey] || null;
  const currentMatthewHenry = matthewHenryDb[currentInspectorKey] || null;

  const currentHebrewSyntax = useMemo(() => {
    if (inspectorTarget?.isOT && inspectorWords && inspectorWords.length > 0) {
      return analyzeHebrewSyntaxFromWords(inspectorWords);
    }
    return null;
  }, [inspectorTarget, inspectorWords]);

  const renderStickersCallback = useCallback(
    function () {
      if (!StickerLayer) return null;
      return (
        <StickerLayer
          stickers={safeDay.stickers}
          memos={safeDay.memos}
          onUpdateStickers={function (s) {
            if (updateDay) updateDay({ stickers: s });
          }}
          onUpdateMemos={function (m) {
            if (updateDay) updateDay({ memos: m });
          }}
          onPtrDown={onPtrDown}
        />
      );
    },
    [StickerLayer, safeDay.stickers, safeDay.memos, updateDay, onPtrDown]
  );

  const handleRichTextChange = useCallback(
    function (htmlVal) {
      if (updateDay) updateDay({ sermonNotes: htmlVal });
    },
    [updateDay]
  );

  const BacklinkPanel = () => {
    if (!activeBacklink) return null;

    const relatedEntries = Object.entries(dailyData || {})
      .filter(([dKey, dVal]) => {
        if (dKey === date) return false;
        const fullText = `${dVal.sermonNotes || ''} ${dVal.qtMeditation || ''} ${dVal.qtGraceLine || ''}`;
        return fullText.includes(activeBacklink);
      })
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <div className={`absolute top-0 right-0 h-full w-full max-w-[360px] z-[200] shadow-xl flex flex-col border-l ${borderClass} ${surfaceBg}`}>
        <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#0D9488]" />
            <h3 className={`text-[15px] font-bold ${textMain}`}>{activeBacklink} 관련 기록</h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveBacklink(null)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} ${textMain} cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto px-5 divide-y ${dividerClass} hide-scrollbar pointer-events-auto`}>
          {relatedEntries.length === 0 ? (
            <div className={`py-12 text-center text-[14px] ${textSub}`}>과거 예배·묵상 기록이 없습니다.</div>
          ) : (
            relatedEntries.map(([dKey, dVal]) => (
              <div key={dKey} className="py-4 space-y-1.5">
                <span className={`text-[12px] font-medium ${textSub} block`}>{dKey}</span>
                <p className={`text-[14px] leading-relaxed line-clamp-4 ${textMain}`}>
                  {(dVal.sermonNotes || dVal.qtMeditation || dVal.qtGraceLine || '').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const displayedFinderVerses = useMemo(() => {
    if (showFullChapterInFinder) {
      return finderScriptureData.allChapterVerses || finderScriptureData.verses;
    }
    return finderScriptureData.verses;
  }, [showFullChapterInFinder, finderScriptureData]);

  return (
    <div
      ref={rootSermonFullscreenRef}
      className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none ${pageBg}`}
    >
      <BacklinkPanel />

      {/* 숨겨진 사진 파일 업로드 인풋 (모바일 갤러리 / PC 파일 탐색기 호환) */}
      <input
        type="file"
        ref={captureInputRef}
        accept="image/*"
        onChange={handleUploadCaptureFile}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* 1. 상단 글로벌 헤더 바 */}
      {/* ===================================================================== */}
      <header className={`shrink-0 px-3 sm:px-6 h-14 flex items-center justify-between gap-2 z-20 border-b relative ${borderClass} ${surfaceBg}`}>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#191F28]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className={`text-[17px] font-bold tracking-tight whitespace-nowrap ${textMain}`}>예배 노트</h1>
            <span className={`hidden sm:inline-block text-[12px] font-bold px-2 py-0.5 rounded-md ${sagePillClass}`}>
              완성도 {sermonCompletionPercent}%
            </span>
          </div>
          {krv4TxtDb && (
            <span className={`hidden md:inline-block px-2 py-0.5 rounded-md text-[12px] font-bold ${amberPillClass}`}>
              개역개정 4판
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => enterLiveCinemaFullscreen('outline')}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${bluePillClass}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>전체화면 노트</span>
          </button>

          <button
            type="button"
            onClick={toggleSanctuaryMode}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isSanctuaryMode ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`
            }`}
          >
            {isSanctuaryMode ? '본당 집중' : '일반 뷰'}
          </button>

          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              showToolbar ? 'bg-[#191F28] text-white dark:bg-white dark:text-[#101216]' : `${subSurfaceBg} ${textMain}`
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{showToolbar ? '도구 닫기' : '서식'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#191F28]'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 능동형 작성 완성도 헤어라인 인디케이터 */}
      <div className={`w-full h-[2px] ${subSurfaceBg} shrink-0`}>
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#0D9488] transition-all duration-500"
          style={{ width: `${sermonCompletionPercent}%` }}
        />
      </div>

      {/* 토스트 알림 */}
      {actionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999999] bg-[#191F28] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#0D9488]" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 서식 툴바 */}
      {showToolbar && (
        <div className={`relative z-20 w-full px-3 sm:px-6 py-2 border-b ${borderClass} ${surfaceBg} shrink-0 overflow-x-auto hide-scrollbar`}>
          {renderToolbar && renderToolbar(sermonEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. 본문 뷰포트 레이아웃 (모바일 풀폭 / PC·태블릿 12컬럼 2단 와이드) */}
      {/* ===================================================================== */}
      {CanvasEngine && (
        <CanvasEngine
          key={`sermon_${date}`}
          saveKey={`sermon_${date}`}
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          t={t}
          renderStickers={renderStickersCallback}
        >
          <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2 sm:px-5 lg:px-8 pt-3 sm:pt-5 pb-32 relative z-10 max-w-[1380px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* =============================================================== */}
              {/* [좌측 5컬럼] 일자·저장 + 대형 예배 영상 + 자막 스캔 보관함 */}
              {/* =============================================================== */}
              <div className="lg:col-span-5 space-y-4">
                {/* 일자 바 & 아카이브/Word 저장 제어 */}
                <div className={`${surfaceBg} px-4 py-3 rounded-2xl border ${borderClass} flex justify-between items-center gap-2`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${textMain}`}>{date}</span>
                    <span className={`text-[12px] font-medium ${textSub} truncate`}>
                      {isSp ? '특별집회 설교 노트' : '주일 예배 설교 노트'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 shrink-0 ignore-draw">
                    <button
                      type="button"
                      onClick={() => openModal && openModal('sermonList')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer whitespace-nowrap ${subSurfaceBg} ${textMain}`}
                    >
                      <List className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>노트 목록</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadSermonWord}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-[#2563EB] cursor-pointer whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Word 저장</span>
                    </button>
                  </div>
                </div>

                {/* 유튜브 예배 영상 시청 섹션 */}
                {!isSanctuaryMode && (
                  <section
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`${surfaceBg} rounded-2xl border ${borderClass} overflow-hidden ignore-draw transition-all ${
                      isVideoPinned ? 'sticky top-2 z-30 shadow-xl' : ''
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${borderClass} flex items-center justify-between gap-2 flex-wrap`}>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#2563EB]" />
                        <span className={`text-[15px] font-bold ${textMain}`}>
                          {isSp ? `${currentMonthNum}월 특별집회 영상` : '주일 예배 영상'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <a
                          href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1 whitespace-nowrap ${bluePillClass}`}
                        >
                          <span>설교 검색</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={handleShareVideo}
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${subSurfaceBg} ${textMain}`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>공유</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsVideoPinned(!isVideoPinned)}
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                            isVideoPinned ? 'bg-[#0D9488] text-white' : `${subSurfaceBg} ${textMain}`
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{isVideoPinned ? '고정 해제' : '상단고정'}</span>
                        </button>

                        {isSp && (
                          <button
                            type="button"
                            onClick={() => setShowMonthlyModal(true)}
                            className={`px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer whitespace-nowrap ${amberPillClass}`}
                          >
                            월별 링크
                          </button>
                        )}
                      </div>
                    </div>

                    {!isLiveCinemaMode && (
                      <div
                        ref={ytPlayerBoxRef}
                        className={`w-full ${isVideoPinned ? 'max-h-[220px]' : ''} aspect-video bg-black relative`}
                      >
                        {activeYoutubeId ? (
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${activeYoutubeId}?rel=0&enablejsapi=1&playsinline=1`}
                            title="Sermon Video"
                            frameBorder="0"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
                            <Video className="w-8 h-8 text-white/30" />
                            <p className="text-[13.5px] font-medium text-white/60">
                              개역개정 4판 성경 본문 유튜브나 주일 예배 설교 영상을 검색해 주소를 붙여넣으세요.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`개역개정 4판 ${activeReferenceStr || '성경'} 낭독`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-[#D97706] text-white text-[12px] font-bold inline-flex items-center gap-1"
                              >
                                <span>본문 낭독 유튜브</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12px] font-bold inline-flex items-center gap-1"
                              >
                                <span>김포좋은나무교회 설교</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-3.5 space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="유튜브 설교 주소(URL) 붙여넣기"
                          value={isSp ? inputUrl : safeDay.sermonVideoUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value.trim();
                            if (isSp) {
                              setInputUrl(url);
                            } else {
                              let vId = extractVideoId ? extractVideoId(url) : null;
                              if (!vId) {
                                const fallbackMatch = url.match(/([a-zA-Z0-9_-]{11})/);
                                if (fallbackMatch) vId = fallbackMatch[1];
                              }
                              updateDay({ sermonVideoUrl: url, sermonVideoId: vId || '' });
                            }
                          }}
                          className={`flex-1 min-w-0 px-3.5 py-2 rounded-xl text-[14px] outline-none ${subSurfaceBg} ${textMain}`}
                        />
                        {isSp && (
                          <button
                            type="button"
                            onClick={handleApplyCurrentMonthGisanVideo}
                            className="shrink-0 px-3.5 py-2 bg-[#2563EB] text-white text-[12px] font-bold rounded-xl cursor-pointer"
                          >
                            저장
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={handleDirectTabCapture}
                          className={`py-2 px-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer ${amberPillClass}`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>자막 즉시캡처</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleOcrStudioModal}
                          className={`py-2 px-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer ${subSurfaceBg} ${textMain}`}
                        >
                          <span>{isOcrStudioOpen ? '스캔창 닫기' : '스캔창 열기'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => enterLiveCinemaFullscreen('outline')}
                          className={`py-2 px-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer ${bluePillClass}`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>워크스테이션</span>
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* 유튜브 자막·적용질문 OCR 스캔 보관함 (사진 불러오기 & 붙여넣기 지원) */}
                <section
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 space-y-3 ignore-draw`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${amberPillClass}`}>OCR</span>
                      <span className={`text-[15px] font-bold ${textMain}`}>
                        자막 · 적용질문 스캔 보관함 ({sermonCaptures.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => captureInputRef.current?.click()}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer ${amberPillClass}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>사진 불러오기</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleOcrStudioModal}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                      >
                        {isOcrStudioOpen ? '닫기' : '스캔창'}
                      </button>
                    </div>
                  </div>

                  {/* 모바일·PC 공용 클립보드 붙여넣기 드롭존 */}
                  <div
                    ref={pasteZoneRef}
                    tabIndex={0}
                    onClick={handleReadClipboardImageForOcr}
                    className={`p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-colors outline-none focus:border-[#D97706] ${
                      isDark ? 'border-[#333B4A] bg-[#20242E]/60 text-[#94A3B8]' : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-[#D97706]">
                      <ClipboardPaste className="w-4 h-4" />
                      <span>캡처 이미지 붙여넣기 (Ctrl+V) 또는 터치하여 불러오기</span>
                    </div>
                    <p className="text-[12px] mt-0.5">화면 캡처 후 붙여넣거나 사진 파일을 선택하면 자막을 자동 판독합니다.</p>
                  </div>

                  {sermonCaptures.length > 0 && (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                      {sermonCaptures.map((cap) => (
                        <div key={cap.id} className={`p-3 rounded-xl ${subSurfaceBg} space-y-2`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {cap.subtitleCropUrl && (
                                <img src={cap.subtitleCropUrl} alt="crop" className="h-7 w-14 object-cover rounded bg-black" />
                              )}
                              <span className="text-[12px] font-bold text-[#D97706]">
                                {cap.label} ({cap.timestamp})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setStudioDraftItem(cap);
                                  setMinimizedModals((prev) => ({ ...prev, ocr: false }));
                                  setIsOcrStudioOpen(true);
                                }}
                                className="text-[12px] font-bold text-[#2563EB] cursor-pointer"
                              >
                                영역 재조정
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = sermonCaptures.filter((item) => item.id !== cap.id);
                                  syncCapturesToDay(next);
                                }}
                                className={`text-[12px] font-bold ${textSub} cursor-pointer`}
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={cap.ocrText || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const next = sermonCaptures.map((item) => (item.id === cap.id ? { ...item, ocrText: val } : item));
                              syncCapturesToDay(next);
                            }}
                            className={`w-full p-2.5 rounded-lg border text-[13.5px] outline-none resize-none ${surfaceBg} ${textMain} ${borderClass}`}
                          />

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className={`text-[12px] font-medium ${textSub} mr-1`}>삽입:</span>
                            {[
                              { label: '적용질문', field: 'apply', cls: sagePillClass },
                              { label: '핵심요약', field: 'conviction', cls: amberPillClass },
                              { label: '제1대지', field: 'point1', cls: bluePillClass },
                              { label: '제2대지', field: 'point2', cls: bluePillClass },
                              { label: '제3대지', field: 'point3', cls: bluePillClass },
                              { label: '필기장 본문', field: 'notes', cls: sagePillClass }
                            ].map((btn) => (
                              <button
                                key={btn.field}
                                type="button"
                                onClick={() => handleDispatchOcrTextToField(btn.field, cap.ocrText, cap)}
                                className={`px-2 py-0.5 rounded text-[11.5px] font-bold cursor-pointer ${btn.cls}`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* =============================================================== */}
              {/* [우측 7컬럼] 설교 정보 + 3대지 구조화 + 적용 질문 + 본문 에디터 */}
              {/* =============================================================== */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. 설교 메타데이터 & 성경 연구 툴바 */}
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 sm:p-5 space-y-3.5`}>
                  <div>
                    <label className={`text-[12px] font-bold ${textSub} block mb-1`}>설교 제목</label>
                    <input
                      type="text"
                      value={safeDay.sermonTitle || globalSharedQt?.[date]?.sermonData?.title || ''}
                      onChange={(e) => updateDay({ sermonTitle: e.target.value })}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-[15px] font-bold outline-none ${subSurfaceBg} ${textMain}`}
                      placeholder="설교 제목을 입력하세요"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label className={`text-[12px] font-bold ${textSub} block mb-1`}>설교자</label>
                      <input
                        type="text"
                        value={safeDay.sermonPreacher || globalSharedQt?.[date]?.sermonData?.preacher || ''}
                        onChange={(e) => updateDay({ sermonPreacher: e.target.value })}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                        placeholder="예: 담임목사"
                      />
                    </div>
                    <div className="sm:col-span-7 ignore-draw">
                      <label className={`text-[12px] font-bold ${textSub} block mb-1`}>설교 본문 구절</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || ''}
                          onChange={(e) => {
                            setCustomRefQuery(e.target.value);
                            updateDay && updateDay({ sermonReference: e.target.value });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleOpenKrv4ScriptureView(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference);
                            }
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          placeholder="예: 창 1:1-5, 요 3:16"
                          className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-[14px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenKrv4ScriptureView(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference)}
                          className={`shrink-0 px-3 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${amberPillClass}`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>본문 보기</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4대 성경 연구 툴바 (3색 조화) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 ignore-draw" onPointerDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isBibleFinderOpen) setIsBibleFinderOpen(false);
                        else {
                          setFinderRefInput(activeReferenceStr);
                          setShowFullChapterInFinder(false);
                          setMinimizedModals((prev) => ({ ...prev, finder: false }));
                          setIsBibleFinderOpen(true);
                        }
                      }}
                      className={`py-2.5 px-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isBibleFinderOpen ? 'bg-[#D97706] text-white' : amberPillClass
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isBibleFinderOpen ? '말씀찾기 닫기' : '개역개정4판 찾기'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (inspectorTarget) setInspectorTarget(null);
                        else openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse);
                      }}
                      className={`py-2.5 px-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        inspectorTarget ? 'bg-[#2563EB] text-white' : bluePillClass
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{inspectorTarget ? '원어강해 닫기' : '원어 강해'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isArcModalOpen && arcModalInitialMode === 'arc') setIsArcModalOpen(false);
                        else {
                          setArcModalInitialMode('arc');
                          setIsArcModalOpen(true);
                        }
                      }}
                      className={`py-2.5 px-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isArcModalOpen && arcModalInitialMode === 'arc' ? 'bg-[#0D9488] text-white' : sagePillClass
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>신구약 아크</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isArcModalOpen && arcModalInitialMode === '2d') setIsArcModalOpen(false);
                        else {
                          setArcModalInitialMode('2d');
                          setIsArcModalOpen(true);
                        }
                      }}
                      className={`py-2.5 px-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isArcModalOpen && arcModalInitialMode === '2d' ? 'bg-[#0D9488] text-white' : sagePillClass
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>말씀 은하계</span>
                    </button>
                  </div>

                  {/* 핵심 요약 한 문장 */}
                  <div className="pt-0.5 ignore-draw" onPointerDown={(e) => e.stopPropagation()}>
                    <label className="text-[12px] font-bold text-[#D97706] block mb-1">
                      핵심 요절 및 설교 한 문장 요약 (구절 입력 후 스페이스바 자동완성)
                    </label>
                    <input
                      type="text"
                      value={safeDay.sermonConviction || ''}
                      onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                      onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonConviction', safeDay.sermonConviction || '')}
                      placeholder="설교 중 가장 중심이 되는 핵심 문장을 기록하세요 (예: 요3:16 + 스페이스바)"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                    />
                  </div>

                  {linkedRefs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5 ignore-draw">
                      {linkedRefs.map((ref) => (
                        <button
                          key={ref}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBacklink(ref);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1 cursor-pointer ${
                            activeBacklink === ref ? 'bg-[#0D9488] text-white' : sagePillClass
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>{ref} 과거 기록 대조</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {/* 2. 설교 3대지 구조화 빌더 */}
                <section className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 sm:p-5 space-y-3`}>
                  <div onClick={() => setShowOutlineBuilder(!showOutlineBuilder)} className="flex justify-between items-center cursor-pointer select-none">
                    <span className={`text-[16px] font-bold ${textMain}`}>설교 대지 구조화 (3-Point Outline)</span>
                    <ChevronDown className={`w-4 h-4 text-[#8B95A1] transition-transform ${showOutlineBuilder ? 'rotate-180' : ''}`} />
                  </div>

                  {showOutlineBuilder && (
                    <div className={`space-y-3 pt-3 border-t ${borderClass} ignore-draw`} onPointerDown={(e) => e.stopPropagation()}>
                      {[
                        { key: 'sermonPoint1', label: '제1대지: 본문 관찰 및 하나님의 성품', ph: '첫 번째 대지 핵심 내용을 입력하세요 (예: 창1:1 + 스페이스바)' },
                        { key: 'sermonPoint2', label: '제2대지: 직면한 나의 모습과 회개', ph: '두 번째 대지 핵심 내용을 입력하세요' },
                        { key: 'sermonPoint3', label: '제3대지: 구속사적 결단과 순종', ph: '세 번째 대지 핵심 내용을 입력하세요' }
                      ].map((pt) => (
                        <div key={pt.key} className="space-y-1">
                          <span className={`text-[12px] font-bold ${textSub} block`}>{pt.label}</span>
                          <input
                            type="text"
                            value={safeDay[pt.key] || ''}
                            onChange={(e) => updateDay && updateDay({ [pt.key]: e.target.value })}
                            onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, pt.key, safeDay[pt.key] || '')}
                            placeholder={pt.ph}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 3. 설교 적용 질문 (목장 나눔 질문) & 나의 결단 */}
                <section
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 sm:p-5 space-y-3.5 ignore-draw`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-[16px] font-bold ${textMain}`}>설교 적용 질문 & 목장 나눔</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleDirectTabCapture}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${amberPillClass}`}
                      >
                        + 영상 적용질문 캡처
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = getArr ? [...getArr(safeDay.applyQuestions)] : [];
                          updateDay && updateDay({ applyQuestions: [...cur, ''] });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${sagePillClass}`}
                      >
                        + 질문 추가
                      </button>
                    </div>
                  </div>

                  <div className={`divide-y ${dividerClass}`}>
                    {((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || ['']).map((qText, qIdx) => (
                      <div key={qIdx} className="py-3 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold shrink-0 ${sagePillClass}`}>
                            Q{qIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={qText || ''}
                            onChange={(e) => {
                              const nextQ = [...((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || [''])];
                              nextQ[qIdx] = e.target.value;
                              updateDay && updateDay({ applyQuestions: nextQ });
                            }}
                            placeholder="유튜브 화면에서 스캔한 적용질문이나 나눔 질문을 입력하세요"
                            className={`flex-1 bg-transparent text-[15px] font-bold outline-none ${textMain}`}
                          />
                          {qIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextQ = [...(getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions)].filter((_, i) => i !== qIdx);
                                updateDay && updateDay({ applyQuestions: nextQ });
                              }}
                              className={`text-[12px] font-bold ${textSub} cursor-pointer`}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={(safeDay.applyAnswers && safeDay.applyAnswers[qIdx]) || ''}
                          onChange={(e) => {
                            const nextA = { ...(safeDay.applyAnswers || {}), [qIdx]: e.target.value };
                            updateDay && updateDay({ applyAnswers: nextA });
                          }}
                          onKeyDown={(e) => {
                            const curAns = (safeDay.applyAnswers && safeDay.applyAnswers[qIdx]) || '';
                            handleSpacebarVerseAutoCompleteOnInput(e, null, curAns, (nextVal) => {
                              const nextA = { ...(safeDay.applyAnswers || {}), [qIdx]: nextVal };
                              updateDay && updateDay({ applyAnswers: nextA });
                            });
                          }}
                          placeholder="질문에 대한 나의 묵상과 삶의 적용 답변을 기록하세요 ('창1:1' + 스페이스바 자동완성 지원)"
                          className={`w-full p-3 rounded-xl text-[14px] outline-none resize-none ${subSurfaceBg} ${textMain}`}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. 설교 본문 리치 텍스트 에디터 (스페이스바 구절 자동완성 + STT) */}
                <section
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`${surfaceBg} rounded-2xl border ${borderClass} p-4 sm:p-5 space-y-3.5 ignore-draw`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-[#2563EB]" />
                      <span className={`text-[16px] font-bold ${textMain}`}>설교 본문 노트 & 실시간 음성 필기</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={sttTargetField}
                        onChange={(e) => setSttTargetField(e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold outline-none ${subSurfaceBg} ${textMain}`}
                      >
                        <option value="notes">음성입력: 본문 필기장</option>
                        <option value="conviction">음성입력: 핵심 한문장</option>
                        <option value="point1">음성입력: 제1대지</option>
                        <option value="point2">음성입력: 제2대지</option>
                        <option value="point3">음성입력: 제3대지</option>
                        <option value="apply">음성입력: 적용질문</option>
                      </select>

                      <button
                        type="button"
                        onClick={toggleSpeechRecognition}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
                          isSpeechRecording ? 'bg-[#D97706] text-white' : 'bg-[#0D9488] text-white'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{isSpeechRecording ? '음성 중지' : '음성 받아쓰기'}</span>
                      </button>
                    </div>
                  </div>

                  {isSpeechRecording && sttInterimText && (
                    <div className={`px-3.5 py-2 rounded-xl text-[13px] font-medium ${sagePillClass}`}>
                      인식 중: {sttInterimText}
                    </div>
                  )}

                  <div
                    onKeyDownCapture={handleEditorContainerKeyDown}
                    className={`min-h-[340px] rounded-xl overflow-hidden border ${borderClass}`}
                  >
                    <RichTextEditor
                      ref={sermonEditorRef}
                      value={safeDay.sermonNotes || ''}
                      onChange={handleRichTextChange}
                      placeholder="설교 말씀을 들으며 은혜받은 내용과 묵상을 기록하세요. ('창1:1' 입력 후 스페이스바를 누르면 개역개정 4판 구절이 자동으로 완성됩니다)"
                      isDarkMode={isDark}
                    />
                  </div>

                  {/* 하단 실천 결단 & 목장/기도함 연동 바 */}
                  <div className={`pt-3 border-t ${borderClass} space-y-2.5`}>
                    <input
                      type="text"
                      value={safeDay.sermonGraceLine || ''}
                      onChange={(e) => handleGraceLineSync(e.target.value)}
                      onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonGraceLine', safeDay.sermonGraceLine || '', handleGraceLineSync)}
                      placeholder="오늘 나에게 주신 한 줄 은혜 고백 및 감사 선포를 입력하세요"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium outline-none ${subSurfaceBg} ${textMain}`}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={inlineActionSendToTracker}
                        className="py-2.5 px-3 rounded-xl bg-[#0D9488] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>적용 트래커</span>
                      </button>
                      <button
                        type="button"
                        onClick={inlineActionSendToPrayer}
                        className="py-2.5 px-3 rounded-xl bg-[#2563EB] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <HandHeart className="w-3.5 h-3.5" />
                        <span>나의 기도함</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendDeclarationToCell(safeDay.sermonGraceLine || safeDay.sermonConviction)}
                        className={`py-2.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${sagePillClass}`}
                      >
                        <span>목장 감사나눔</span>
                      </button>
                      <button
                        type="button"
                        onClick={inlineActionSendToCounseling}
                        className={`py-2.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${amberPillClass}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>1:1 나눔 요청</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </CanvasEngine>
      )}

      {/* 최소화된 팝업들을 우측 하단 작은 캡슐로 모아 보여주는 독 바 */}
      <div className="fixed bottom-4 right-4 z-[9999999] flex flex-wrap items-center gap-2 pointer-events-auto">
        {isOcrStudioOpen && minimizedModals.ocr && (
          <div className="px-3.5 py-2 rounded-full bg-[#D97706] text-white font-bold text-[12px] shadow-lg flex items-center gap-2">
            <button type="button" onClick={() => setMinimizedModals((prev) => ({ ...prev, ocr: false }))} className="cursor-pointer">
              자막 OCR 스캔창 펼치기
            </button>
            <button type="button" onClick={() => setIsOcrStudioOpen(false)} className="px-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {isBibleFinderOpen && minimizedModals.finder && (
          <div className="px-3.5 py-2 rounded-full bg-[#0D9488] text-white font-bold text-[12px] shadow-lg flex items-center gap-2">
            <button type="button" onClick={() => setMinimizedModals((prev) => ({ ...prev, finder: false }))} className="cursor-pointer">
              개역개정4판 본문창 펼치기
            </button>
            <button type="button" onClick={() => setIsBibleFinderOpen(false)} className="px-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {inspectorTarget && minimizedModals.inspector && (
          <div className="px-3.5 py-2 rounded-full bg-[#2563EB] text-white font-bold text-[12px] shadow-lg flex items-center gap-2">
            <button type="button" onClick={() => setMinimizedModals((prev) => ({ ...prev, inspector: false }))} className="cursor-pointer">
              원어 강해 펼치기
            </button>
            <button type="button" onClick={() => setInspectorTarget(null)} className="px-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 8. 유튜브 자막·적용질문 스마트 OCR 스튜디오 모달 */}
      {/* ===================================================================== */}
      {isOcrStudioOpen && !minimizedModals.ocr && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsOcrStudioOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-5 flex flex-col max-h-[88vh] overflow-hidden`}
          >
            <div className={`flex items-center justify-between border-b ${borderClass} pb-3 shrink-0`}>
              <div>
                <span className="text-[12px] font-bold text-[#D97706] block">유튜브 설교 자막 · 적용질문 스캐너</span>
                <h3 className="text-[17px] font-bold tracking-tight">캡처 이미지 텍스트 추출</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinimizedModals((prev) => ({ ...prev, ocr: true }))}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  접기
                </button>
                <button
                  type="button"
                  onClick={() => setIsOcrStudioOpen(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-4 py-4 flex-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => captureInputRef.current?.click()}
                  className={`p-3.5 rounded-xl text-left cursor-pointer transition-colors ${amberPillClass}`}
                >
                  <div className="text-[13px] font-bold flex items-center gap-1.5 mb-1">
                    <ImageIcon className="w-4 h-4" />
                    <span>1. 사진 불러오기</span>
                  </div>
                  <div className="text-[11.5px] opacity-85">갤러리 스크린샷이나 캡처 사진 파일을 선택합니다</div>
                </button>

                <button
                  type="button"
                  onClick={handleReadClipboardImageForOcr}
                  className={`p-3.5 rounded-xl text-left cursor-pointer transition-colors ${bluePillClass}`}
                >
                  <div className="text-[13px] font-bold flex items-center gap-1.5 mb-1">
                    <ClipboardPaste className="w-4 h-4" />
                    <span>2. 클립보드 붙여넣기</span>
                  </div>
                  <div className="text-[11.5px] opacity-85">방금 복사한 화면 캡처 이미지를 즉시 읽어옵니다</div>
                </button>

                <button
                  type="button"
                  onClick={handleDirectTabCapture}
                  className={`p-3.5 rounded-xl text-left cursor-pointer transition-colors ${sagePillClass}`}
                >
                  <div className="text-[13px] font-bold flex items-center gap-1.5 mb-1">
                    <Camera className="w-4 h-4" />
                    <span>3. PC 화면 자동캡처</span>
                  </div>
                  <div className="text-[11.5px] opacity-85">재생 중인 유튜브 탭 화면을 바로 찍어 추출합니다</div>
                </button>
              </div>

              {/* 모바일·PC 공용 붙여넣기 입력 박스 (권한 제한 우회용) */}
              <div
                contentEditable
                suppressContentEditableWarning
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.startsWith('image/')) {
                      const blob = items[i].getAsFile();
                      if (blob) {
                        e.preventDefault();
                        e.currentTarget.innerHTML = '';
                        decodeBlobOrFileToOcr(blob, '직접 붙여넣기 자막 스캔');
                        return;
                      }
                    }
                  }
                }}
                onInput={(e) => {
                  e.currentTarget.innerHTML = '';
                }}
                className={`p-3.5 rounded-xl border border-dashed text-center text-[13px] outline-none focus:border-[#2563EB] ${borderClass} ${subSurfaceBg} ${textSub}`}
              >
                이곳을 터치(또는 길게 누르기)한 뒤 [붙여넣기]를 누르면 캡처 이미지가 즉시 인식됩니다.
              </div>

              <div className="space-y-1.5">
                <span className={`text-[12px] font-bold ${textSub} block`}>스캔 영역 선택</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.entries(OCR_CROP_REGIONS).map(([key, reg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setOcrCropPreset(key);
                        if (studioDraftItem) {
                          runOcrOnCaptureItem(studioDraftItem, key);
                        }
                      }}
                      className={`px-2.5 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${
                        ocrCropPreset === key ? 'bg-[#D97706] text-white' : `${subSurfaceBg} ${textMain}`
                      }`}
                    >
                      {reg.label}
                    </button>
                  ))}
                </div>
              </div>

              {studioDraftItem?.imageUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[12px] font-bold text-[#D97706]">
                      아래 원본 화면에서 추출할 자막 부분만 드래그하여 재인식할 수 있습니다.
                    </span>
                    {ocrLoadingId && <span className="text-[12px] font-bold text-[#0D9488]">판독 중...</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      className="relative rounded-xl overflow-hidden border border-white/15 bg-black select-none touch-none flex items-center justify-center max-h-56"
                      onPointerDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                        touchStartRef.current = { x, y };
                        setTouchCropBox({ x, y, w: 0.01, h: 0.01 });
                        e.currentTarget.setPointerCapture?.(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (!touchStartRef.current) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                        const x = Math.min(touchStartRef.current.x, curX);
                        const y = Math.min(touchStartRef.current.y, curY);
                        const w = Math.abs(curX - touchStartRef.current.x);
                        const h = Math.abs(curY - touchStartRef.current.y);
                        setTouchCropBox({ x, y, w, h });
                      }}
                      onPointerUp={(e) => {
                        e.currentTarget.releasePointerCapture?.(e.pointerId);
                        const finalBox = touchCropBox;
                        touchStartRef.current = null;
                        if (finalBox && finalBox.w > 0.06 && finalBox.h > 0.03) {
                          runOcrOnCaptureItem(studioDraftItem, null, finalBox);
                        }
                      }}
                    >
                      <img
                        ref={fullPreviewImgRef}
                        src={studioDraftItem.imageUrl}
                        alt="Full Capture"
                        draggable={false}
                        className="max-h-56 w-full object-contain pointer-events-none"
                      />
                      {touchCropBox && (
                        <div
                          style={{
                            left: `${touchCropBox.x * 100}%`,
                            top: `${touchCropBox.y * 100}%`,
                            width: `${touchCropBox.w * 100}%`,
                            height: `${touchCropBox.h * 100}%`
                          }}
                          className="absolute border-2 border-[#D97706] bg-[#D97706]/25 pointer-events-none rounded"
                        />
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-black flex flex-col items-center justify-center gap-1">
                      <span className="text-[11px] text-[#94A3B8]">도려낸 자막 영역</span>
                      <img
                        src={studioDraftItem.subtitleCropUrl || studioDraftItem.imageUrl}
                        alt="Cropped Subtitle"
                        className="max-h-44 w-auto object-contain rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`text-[12px] font-bold ${textSub} block`}>추출된 설교 자막 · 적용질문 텍스트</label>
                <textarea
                  rows={3}
                  value={studioDraftItem?.ocrText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudioDraftItem((prev) =>
                      prev ? { ...prev, ocrText: val } : { id: `cap_${Date.now()}`, ocrText: val, timestamp: '직접입력' }
                    );
                  }}
                  placeholder="유튜브 영상에서 캡처된 자막이나 적용질문이 이곳에 표시됩니다."
                  className={`w-full p-3.5 rounded-xl text-[14.5px] leading-relaxed outline-none resize-none ${subSurfaceBg} ${textMain}`}
                />
              </div>
            </div>

            <div className={`pt-3 border-t ${borderClass} flex flex-wrap items-center justify-between gap-1.5 shrink-0`}>
              {[
                { label: '적용질문 칸에 넣기', field: 'apply', cls: 'bg-[#0D9488] text-white' },
                { label: '핵심요약', field: 'conviction', cls: amberPillClass },
                { label: '제1대지', field: 'point1', cls: bluePillClass },
                { label: '제2대지', field: 'point2', cls: bluePillClass },
                { label: '제3대지', field: 'point3', cls: bluePillClass },
                { label: '설교노트 본문', field: 'notes', cls: 'bg-[#2563EB] text-white' }
              ].map((act) => (
                <button
                  key={act.field}
                  type="button"
                  onClick={() => {
                    handleDispatchOcrTextToField(act.field, studioDraftItem?.ocrText, studioDraftItem);
                    setIsOcrStudioOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer ${act.cls}`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. 개역개정 4판 말씀·예시 구절 뷰어 모달 */}
      {/* ===================================================================== */}
      {isBibleFinderOpen && !minimizedModals.finder && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsBibleFinderOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-5 flex flex-col max-h-[86vh] overflow-hidden`}
          >
            <div className={`flex items-center justify-between border-b ${borderClass} pb-3`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[17px] font-bold">설교 본문 · 말씀 구절 뷰어</span>
                <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${amberPillClass}`}>개역개정 4판</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinimizedModals((prev) => ({ ...prev, finder: true }))}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  접기
                </button>
                <button
                  type="button"
                  onClick={() => setIsBibleFinderOpen(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 my-3 flex-wrap">
              <div className={`flex p-0.5 rounded-lg ${subSurfaceBg} flex-1`}>
                <button
                  type="button"
                  onClick={() => setFinderMode('ref')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-bold cursor-pointer ${
                    finderMode === 'ref' ? 'bg-[#2563EB] text-white' : textSub
                  }`}
                >
                  구절 주소로 보기
                </button>
                <button
                  type="button"
                  onClick={() => setFinderMode('keyword')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-bold cursor-pointer ${
                    finderMode === 'keyword' ? 'bg-[#0D9488] text-white' : textSub
                  }`}
                >
                  단어·키워드로 검색
                </button>
              </div>

              {finderMode === 'ref' && (
                <div className={`flex p-0.5 rounded-lg ${subSurfaceBg} text-[12px] font-bold`}>
                  <button
                    type="button"
                    onClick={() => setFinderVersionMode('krv4')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${finderVersionMode === 'krv4' ? 'bg-[#D97706] text-white' : textSub}`}
                  >
                    개역개정4판
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinderVersionMode('parallel')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      finderVersionMode === 'parallel' ? 'bg-[#D97706] text-white' : textSub
                    }`}
                  >
                    3역본 대조
                  </button>
                </div>
              )}
            </div>

            {finderMode === 'ref' ? (
              <div className="space-y-3 overflow-y-auto hide-scrollbar flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={finderRefInput}
                    onChange={(e) => {
                      setFinderRefInput(e.target.value);
                      setShowFullChapterInFinder(false);
                    }}
                    placeholder="설교 본문 구절을 입력하세요 (예: 창 1:1, 요 3:16, 롬 8:28-30)"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-[15px] font-bold outline-none ${subSurfaceBg} ${textMain}`}
                  />
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`개역개정 4판 ${finderRefInput || activeReferenceStr || '성경'} 낭독`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-3 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1 shrink-0 ${amberPillClass}`}
                  >
                    <span>유튜브 듣기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {finderScriptureData.parsed && (
                  <div className={`px-3.5 py-2.5 rounded-xl ${subSurfaceBg} flex flex-wrap items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#D97706]">{finderScriptureData.parsed.displayLabel}</span>
                      <span className={`text-[12px] ${textSub}`}>({displayedFinderVerses.length}개 구절)</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {finderScriptureData.parsed.hasSpecificVerse && (
                        <button
                          type="button"
                          onClick={() => setShowFullChapterInFinder((prev) => !prev)}
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${
                            showFullChapterInFinder ? 'bg-[#0D9488] text-white' : `${surfaceBg} ${textMain}`
                          }`}
                        >
                          {showFullChapterInFinder ? '선택 구절만 보기' : `${finderScriptureData.parsed.chapter}장 전체 보기`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const combined = displayedFinderVerses.map((v) => `${v.vNum}. ${v.text}`).join('\n');
                          handleInsertVerseToSermonNotes(finderScriptureData.parsed.displayLabel, combined);
                          setIsBibleFinderOpen(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-[12px] font-bold cursor-pointer"
                      >
                        필기장 일괄 삽입
                      </button>
                    </div>
                  </div>
                )}

                <div className={`divide-y ${dividerClass} border ${borderClass} rounded-xl overflow-hidden max-h-64 overflow-y-auto hide-scrollbar text-left`}>
                  {displayedFinderVerses.length === 0 ? (
                    <div className={`py-10 text-center text-[14px] ${textSub}`}>
                      성경 구절 주소를 입력하면 내가 적은 구절만 즉시 표시됩니다.
                    </div>
                  ) : (
                    displayedFinderVerses.map((v) => {
                      const koBook = finderScriptureData.parsed?.bookKo || '';
                      const chNum = finderScriptureData.parsed?.chapter || 1;
                      const easyText = easyBibleDb[`${koBook}-${chNum}-${v.vNum}`] || '';
                      const webText =
                        webBibleDb[`${koBook}-${chNum}-${v.vNum}`] || webBibleDb[`${finderScriptureData.parsed?.bookEn}-${chNum}-${v.vNum}`] || '';

                      return (
                        <div
                          key={v.vNum}
                          onClick={() => handleInsertVerseToSermonNotes(`${koBook} ${chNum}:${v.vNum}`, v.text)}
                          className="p-3.5 text-[15px] leading-relaxed cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        >
                          {v.pericope && (
                            <div className={`mb-1.5 px-2 py-0.5 rounded text-[12px] font-bold inline-block ${amberPillClass}`}>
                              {v.pericope}
                            </div>
                          )}
                          <div>
                            <span className="mr-2 font-bold text-[#D97706]">{v.vNum}</span>
                            <span>{v.text}</span>
                          </div>

                          {finderVersionMode === 'parallel' && (
                            <div className={`mt-2 pt-2 border-t ${borderClass} space-y-1 text-[14px] ${textSub}`}>
                              {easyText && <p>쉬운성경: {easyText}</p>}
                              {webText && <p>WEB: {webText}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto hide-scrollbar flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={finderKeyword}
                    onChange={(e) => setFinderKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setFinderKeywordResults(searchBibleByKeyword(finderKeyword, 45, krv4TxtDb));
                    }}
                    placeholder="찾을 성경 단어 입력 (예: 태초, 언약, 사랑, 기도, 은혜)"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-[15px] outline-none ${subSurfaceBg} ${textMain}`}
                  />
                  <button
                    type="button"
                    onClick={() => setFinderKeywordResults(searchBibleByKeyword(finderKeyword, 45, krv4TxtDb))}
                    className="px-4 py-2.5 rounded-xl bg-[#0D9488] text-white text-[13px] font-bold cursor-pointer"
                  >
                    검색
                  </button>
                </div>
                <div className={`divide-y ${dividerClass} border ${borderClass} rounded-xl overflow-hidden max-h-64 overflow-y-auto hide-scrollbar text-left`}>
                  {finderKeywordResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleInsertVerseToSermonNotes(res.ref, res.text)}
                      className="p-3.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <div className="text-[12px] font-bold text-[#0D9488] mb-0.5">{res.ref}</div>
                      <p className="text-[14.5px] leading-relaxed">{res.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. 원어 강해 인스펙터 모달 */}
      {/* ===================================================================== */}
      {inspectorTarget && !minimizedModals.inspector && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-5 flex flex-col max-h-[85vh] overflow-hidden`}
          >
            <div className={`flex justify-between items-center border-b ${borderClass} pb-3`}>
              <span className="text-[15px] font-bold text-[#2563EB]">
                {inspectorTarget.book} {inspectorTarget.chapter}:{inspectorTarget.verse} 원어 강해
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleJumpToInterlinearStudio}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${bluePillClass}`}
                >
                  원어 스튜디오 이동
                </button>
                <button
                  type="button"
                  onClick={() => setMinimizedModals((prev) => ({ ...prev, inspector: true }))}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  접기
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTarget(null)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-3.5 py-4 flex-1 text-left">
              {inspectorTarget.pericope && (
                <div className={`px-2.5 py-1 rounded-md text-[12px] font-bold inline-block ${amberPillClass}`}>
                  {inspectorTarget.pericope}
                </div>
              )}
              <p className={`text-[15px] leading-relaxed ${textMain}`}>{inspectorTarget.text}</p>

              <div className={`p-3.5 rounded-xl ${subSurfaceBg}`}>
                <span className={`text-[12px] font-medium ${textSub} block mb-2`}>원어 어절 선택</span>
                {isInspectorLoading ? (
                  <div className={`py-3 text-center text-[12px] ${textSub}`}>원어 형태소 로딩 중...</div>
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
                        className={`text-[18px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
                          selectedWordDetail?.order === w.order ? 'bg-[#2563EB] text-white' : `${surfaceBg} ${textMain}`
                        }`}
                      >
                        {cleanTypography(w.inflected, inspectorTarget.isOT)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedWordDetail && (
                <div className={`p-4 rounded-xl ${subSurfaceBg} space-y-2 text-[14.5px]`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D97706]">
                      {selectedWordDetail.strongs} · {selectedWordDetail.pron}
                    </span>
                    <span className={`text-[12px] ${textSub}`}>{selectedWordDetail.grammarDecoded}</span>
                  </div>
                  <div className="font-bold text-[#0D9488]">
                    문맥 뜻: {selectedWordDetail.korContextual} (원형: {selectedWordDetail.lemma})
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInsertWordToSermonNote(selectedWordDetail)}
                      className="flex-1 py-2.5 rounded-xl bg-[#0D9488] text-white font-bold text-[14px] cursor-pointer"
                    >
                      설교 필기장에 원어 강해 삽입
                    </button>
                    <button
                      type="button"
                      onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-1.5 cursor-pointer ${surfaceBg} ${textMain}`}
                    >
                      <Volume2 className="w-4 h-4 text-[#2563EB]" />
                      <span>발음</span>
                    </button>
                  </div>
                </div>
              )}

              {currentHebrewSyntax && (
                <div className={`p-3.5 rounded-xl border ${borderClass} space-y-1`}>
                  <span className="font-bold text-[12px] text-[#0D9488] block">히브리어 구문론 분석</span>
                  <p className={`text-[14px] leading-relaxed ${textMain}`}>{currentHebrewSyntax.summary}</p>
                </div>
              )}

              {currentCommentary && (
                <div className={`p-3.5 rounded-xl border ${borderClass} space-y-1`}>
                  <span className="font-bold text-[12px] text-[#2563EB] block">학술 주석 ({currentCommentary.commentator})</span>
                  <p className={`text-[14.5px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(currentCommentary.exegesis)}</p>
                </div>
              )}

              {currentMatthewHenry && (
                <div className={`p-3.5 rounded-xl border ${borderClass} space-y-1`}>
                  <span className="font-bold text-[12px] text-[#0D9488] block">매튜 헨리 강해</span>
                  <p className={`text-[14.5px] leading-relaxed ${textMain}`}>{decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 11. 신구약 아크 & 말씀 은하계 모달 */}
      {/* ===================================================================== */}
      {isArcModalOpen && BibleGalaxyArcModal && (
        <div className="fixed inset-0 z-[999999]">
          <BibleGalaxyArcModal
            isOpen={isArcModalOpen}
            onClose={function () {
              setIsArcModalOpen(false);
            }}
            initialViewMode={arcModalInitialMode}
            focusReference={activeReferenceStr}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 12. 전체화면 라이브 시네마 워크스테이션 모달 */}
      {/* ===================================================================== */}
      {isLiveCinemaMode && (
        <div className="fixed inset-0 z-[99998] bg-[#0F1115] text-white flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col relative bg-black min-h-[40vh]">
            <div className={`px-4 py-3 ${surfaceBg} border-b ${borderClass} flex flex-wrap items-center justify-between gap-2 z-10`}>
              <span className={`text-[15px] font-bold truncate ${textMain}`}>
                {safeDay.sermonTitle || '예배 설교 전체화면 워크스테이션'}
              </span>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleDirectTabCapture}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${amberPillClass}`}
                >
                  자막 즉시캡처
                </button>
                <button
                  type="button"
                  onClick={handleToggleOcrStudioModal}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  {isOcrStudioOpen ? '스캔창 닫기' : '스캔창 열기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isBibleFinderOpen) setIsBibleFinderOpen(false);
                    else {
                      setFinderRefInput(activeReferenceStr);
                      setShowFullChapterInFinder(false);
                      setMinimizedModals((prev) => ({ ...prev, finder: false }));
                      setIsBibleFinderOpen(true);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${bluePillClass}`}
                >
                  개역개정4판 찾기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectorTarget) setInspectorTarget(null);
                    else openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${sagePillClass}`}
                >
                  원어강해
                </button>
                <button
                  type="button"
                  onClick={() => setIsCinemaUiHidden(!isCinemaUiHidden)}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${subSurfaceBg} ${textMain}`}
                >
                  {isCinemaUiHidden ? '필기창 열기' : '영상만 보기'}
                </button>
                <button
                  type="button"
                  onClick={exitLiveCinemaFullscreen}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12px] font-bold cursor-pointer"
                >
                  종료
                </button>
              </div>
            </div>

            <div ref={cinemaPlayerBoxRef} className="flex-1 relative w-full h-full">
              {activeYoutubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&rel=0&playsinline=1`}
                  title="Cinema Sermon Video"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-[15px]">
                  등록된 유튜브 설교 영상이 없습니다.
                </div>
              )}
            </div>
          </div>

          {!isCinemaUiHidden && (
            <div className={`w-full lg:w-[460px] h-[52vh] lg:h-full ${surfaceBg} border-t lg:border-t-0 lg:border-l ${borderClass} flex flex-col shrink-0`}>
              <div className={`px-4 py-3 border-b ${borderClass} flex items-center gap-1`}>
                {[
                  { id: 'outline', label: '3대지·요약' },
                  { id: 'apply', label: '적용질문' },
                  { id: 'notes', label: '설교노트' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCinemaHudTab(tab.id)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${
                      cinemaHudTab === tab.id ? 'bg-[#2563EB] text-white' : textSub
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar text-left">
                {cinemaHudTab === 'outline' && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[12px] font-bold text-[#D97706] block mb-1">설교 본문 구절</span>
                      <input
                        type="text"
                        value={safeDay.sermonReference || ''}
                        onChange={(e) => {
                          setCustomRefQuery(e.target.value);
                          updateDay && updateDay({ sermonReference: e.target.value });
                        }}
                        placeholder="예: 고전 7:29-40 또는 벧전 3:7"
                        className={`w-full px-3.5 py-2.5 rounded-xl ${subSurfaceBg} ${textMain} text-[14.5px] outline-none`}
                      />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-[#D97706] block mb-1">핵심 한 문장 요약</span>
                      <input
                        type="text"
                        value={safeDay.sermonConviction || ''}
                        onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                        onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonConviction', safeDay.sermonConviction || '')}
                        placeholder="핵심 요약 문장 입력 ('창1:1' + 스페이스바 자동완성)"
                        className={`w-full px-3.5 py-2.5 rounded-xl ${subSurfaceBg} ${textMain} text-[14.5px] outline-none`}
                      />
                    </div>
                    {[
                      { key: 'sermonPoint1', label: '제1대지' },
                      { key: 'sermonPoint2', label: '제2대지' },
                      { key: 'sermonPoint3', label: '제3대지' }
                    ].map((pt) => (
                      <div key={pt.key}>
                        <span className={`text-[12px] font-bold ${textSub} block mb-1`}>{pt.label}</span>
                        <textarea
                          rows={2}
                          value={safeDay[pt.key] || ''}
                          onChange={(e) => updateDay && updateDay({ [pt.key]: e.target.value })}
                          onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, pt.key, safeDay[pt.key] || '')}
                          className={`w-full p-3 rounded-xl ${subSurfaceBg} ${textMain} text-[14.5px] outline-none resize-none`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {cinemaHudTab === 'apply' && (
                  <div className="space-y-3">
                    {((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || ['']).map((qText, qIdx) => (
                      <div key={qIdx} className={`p-3.5 rounded-xl ${subSurfaceBg} space-y-2`}>
                        <input
                          type="text"
                          value={qText || ''}
                          onChange={(e) => {
                            const nextQ = [...((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || [''])];
                            nextQ[qIdx] = e.target.value;
                            updateDay && updateDay({ applyQuestions: nextQ });
                          }}
                          placeholder={`적용질문 Q${qIdx + 1}`}
                          className={`w-full bg-transparent text-[14.5px] font-bold outline-none ${textMain}`}
                        />
                        <textarea
                          rows={2}
                          value={(safeDay.applyAnswers && safeDay.applyAnswers[qIdx]) || ''}
                          onChange={(e) => {
                            const nextA = { ...(safeDay.applyAnswers || {}), [qIdx]: e.target.value };
                            updateDay && updateDay({ applyAnswers: nextA });
                          }}
                          placeholder="나의 적용과 실천 결단 입력"
                          className={`w-full p-2.5 rounded-lg ${surfaceBg} ${textMain} text-[14px] outline-none resize-none`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {cinemaHudTab === 'notes' && (
                  <div
                    onKeyDownCapture={handleEditorContainerKeyDown}
                    className={`h-full min-h-[300px] rounded-xl overflow-hidden border ${borderClass}`}
                  >
                    <RichTextEditor
                      value={safeDay.sermonNotes || ''}
                      onChange={handleRichTextChange}
                      placeholder="영상을 보며 자유롭게 필기하세요... ('창1:1' + 스페이스바 자동완성 지원)"
                      isDarkMode={isDark}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 13. 월별 특별집회 유튜브 링크 설정 모달 */}
      {/* ===================================================================== */}
      {showMonthlyModal && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 flex items-center justify-center p-4"
          onClick={() => setShowMonthlyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-5 space-y-4 text-left`}
          >
            <div className={`flex items-center justify-between border-b ${borderClass} pb-3`}>
              <span className="text-[16px] font-bold">월별 특별집회 유튜브 링크 관리</span>
              <button
                type="button"
                onClick={() => setShowMonthlyModal(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${subSurfaceBg} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mNum) => (
                <div key={mNum} className="flex items-center gap-2">
                  <span className="w-12 text-[13px] font-bold shrink-0">{mNum}월</span>
                  <input
                    type="text"
                    value={monthlyGisanUrls[mNum] || ''}
                    onChange={(e) => {
                      const next = { ...monthlyGisanUrls, [mNum]: e.target.value.trim() };
                      setMonthlyGisanUrls(next);
                      localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(next));
                    }}
                    placeholder={`${mNum}월 특별집회 유튜브 URL`}
                    className={`flex-1 px-3 py-2 rounded-xl text-[13.5px] outline-none ${subSurfaceBg} ${textMain}`}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('월별 특별집회 링크가 저장되었습니다.');
                setShowMonthlyModal(false);
              }}
              className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-[14px] font-bold cursor-pointer"
            >
              저장 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
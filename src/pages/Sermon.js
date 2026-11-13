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

// =====================================================================
// 암호화 유틸리티 (AES-256 표준 및 구버전 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

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
  return Array.from(new Set(matches.map(m => m[0].trim())));
};

// =====================================================================
// 성경 66권 메타데이터 및 약어 매핑 (스페이스바 자동완성 & 정밀 구절 파서용)
// =====================================================================
const BIBLE_ABBR_TO_KO = {
  "창": "창세기", "출": "출애굽기", "레": "레위기", "민": "민수기", "신": "신명기",
  "수": "여호수아", "삿": "사사기", "룻": "룻기", "삼상": "사무엘상", "삼하": "사무엘하",
  "왕상": "열왕기상", "왕하": "열왕기하", "대상": "역대상", "대하": "역대하",
  "스": "에스라", "느": "느헤미야", "에": "에스더", "욥": "욥기", "시": "시편",
  "잠": "잠언", "전": "전도서", "아": "아가", "사": "이사야", "렘": "예레미야",
  "애": "예레미야애가", "겔": "에스겔", "단": "다니엘", "호": "호세아", "욜": "요엘",
  "암": "아모스", "옵": "오바댜", "욘": "요나", "미": "미가", "나": "나훔",
  "합": "하박국", "습": "스바냐", "학": "학개", "슥": "스가랴", "말": "말라기",
  "마": "마태복음", "막": "마가복음", "눅": "누가복음", "요": "요한복음", "행": "사도행전",
  "롬": "로마서", "고전": "고린도전서", "고후": "고린도후서", "갈": "갈라디아서",
  "엡": "에베소서", "빌": "빌립보서", "골": "골로새서", "살전": "데살로니가전서",
  "살후": "데살로니가후서", "딤전": "디모데전서", "딤후": "디모데후서", "딛": "디도서",
  "몬": "빌레몬서", "히": "히브리서", "약": "야고보서", "벧전": "베드로전서",
  "벧후": "베드로후서", "요일": "요한일서", "요이": "요한이서", "요삼": "요한삼서",
  "유": "유다서", "계": "요한계시록"
};

const BIBLE_66_MAP = {
  "Genesis": { ko: "창세기", isOT: true }, "창세기": { ko: "창세기", isOT: true },
  "Exodus": { ko: "출애굽기", isOT: true }, "출애굽기": { ko: "출애굽기", isOT: true },
  "Leviticus": { ko: "레위기", isOT: true }, "레위기": { ko: "레위기", isOT: true },
  "Numbers": { ko: "민수기", isOT: true }, "민수기": { ko: "민수기", isOT: true },
  "Deuteronomy": { ko: "신명기", isOT: true }, "신명기": { ko: "신명기", isOT: true },
  "Joshua": { ko: "여호수아", isOT: true }, "여호수아": { ko: "여호수아", isOT: true },
  "Judges": { ko: "사사기", isOT: true }, "사사기": { ko: "사사기", isOT: true },
  "Ruth": { ko: "룻기", isOT: true }, "룻기": { ko: "룻기", isOT: true },
  "1 Samuel": { ko: "사무엘상", isOT: true }, "사무엘상": { ko: "사무엘상", isOT: true },
  "2 Samuel": { ko: "사무엘하", isOT: true }, "사무엘하": { ko: "사무엘하", isOT: true },
  "1 Kings": { ko: "열왕기상", isOT: true }, "열왕기상": { ko: "열왕기상", isOT: true },
  "2 Kings": { ko: "열왕기하", isOT: true }, "열왕기하": { ko: "열왕기하", isOT: true },
  "1 Chronicles": { ko: "역대상", isOT: true }, "역대상": { ko: "역대상", isOT: true },
  "2 Chronicles": { ko: "역대하", isOT: true }, "역대하": { ko: "역대하", isOT: true },
  "Ezra": { ko: "에스라", isOT: true }, "에스라": { ko: "에스라", isOT: true },
  "Nehemiah": { ko: "느헤미야", isOT: true }, "느헤미야": { ko: "느헤미야", isOT: true },
  "Esther": { ko: "에스더", isOT: true }, "에스더": { ko: "에스더", isOT: true },
  "Job": { ko: "욥기", isOT: true }, "욥기": { ko: "욥기", isOT: true },
  "Psalms": { ko: "시편", isOT: true }, "시편": { ko: "시편", isOT: true },
  "Proverbs": { ko: "잠언", isOT: true }, "잠언": { ko: "잠언", isOT: true },
  "Ecclesiastes": { ko: "전도서", isOT: true }, "전도서": { ko: "전도서", isOT: true },
  "Song of Solomon": { ko: "아가", isOT: true }, "아가": { ko: "아가", isOT: true },
  "Isaiah": { ko: "이사야", isOT: true }, "이사야": { ko: "이사야", isOT: true },
  "Jeremiah": { ko: "예레미야", isOT: true }, "예레미야": { ko: "예레미야", isOT: true },
  "Lamentations": { ko: "예레미야애가", isOT: true }, "예레미야애가": { ko: "예레미야애가", isOT: true },
  "Ezekiel": { ko: "에스겔", isOT: true }, "에스겔": { ko: "에스겔", isOT: true },
  "Daniel": { ko: "다니엘", isOT: true }, "다니엘": { ko: "다니엘", isOT: true },
  "Hosea": { ko: "호세아", isOT: true }, "호세아": { ko: "호세아", isOT: true },
  "Joel": { ko: "요엘", isOT: true }, "요엘": { ko: "요엘", isOT: true },
  "Amos": { ko: "아모스", isOT: true }, "아모스": { ko: "아모스", isOT: true },
  "Obadiah": { ko: "오바댜", isOT: true }, "오바댜": { ko: "오바댜", isOT: true },
  "Jonah": { ko: "요나", isOT: true }, "요나": { ko: "요나", isOT: true },
  "Micah": { ko: "미가", isOT: true }, "미가": { ko: "미가", isOT: true },
  "Nahum": { ko: "나훔", isOT: true }, "나훔": { ko: "나훔", isOT: true },
  "Habakkuk": { ko: "하박국", isOT: true }, "하박국": { ko: "하박국", isOT: true },
  "Zephaniah": { ko: "스바냐", isOT: true }, "스바냐": { ko: "스바냐", isOT: true },
  "Haggai": { ko: "학개", isOT: true }, "학개": { ko: "학개", isOT: true },
  "Zechariah": { ko: "스가랴", isOT: true }, "스가랴": { ko: "스가랴", isOT: true },
  "Malachi": { ko: "말라기", isOT: true }, "말라기": { ko: "말라기", isOT: true },
  "Matthew": { ko: "마태복음", isOT: false }, "마태복음": { ko: "마태복음", isOT: false },
  "Mark": { ko: "마가복음", isOT: false }, "마가복음": { ko: "마가복음", isOT: false },
  "Luke": { ko: "누가복음", isOT: false }, "누가복음": { ko: "누가복음", isOT: false },
  "John": { ko: "요한복음", isOT: false }, "요한복음": { ko: "요한복음", isOT: false },
  "Acts": { ko: "사도행전", isOT: false }, "사도행전": { ko: "사도행전", isOT: false },
  "Romans": { ko: "로마서", isOT: false }, "로마서": { ko: "로마서", isOT: false },
  "1 Corinthians": { ko: "고린도전서", isOT: false }, "고린도전서": { ko: "고린도전서", isOT: false },
  "2 Corinthians": { ko: "고린도후서", isOT: false }, "고린도후서": { ko: "고린도후서", isOT: false },
  "Galatians": { ko: "갈라디아서", isOT: false }, "갈라디아서": { ko: "갈라디아서", isOT: false },
  "Ephesians": { ko: "에베소서", isOT: false }, "에베소서": { ko: "에베소서", isOT: false },
  "Philippians": { ko: "빌립보서", isOT: false }, "빌립보서": { ko: "빌립보서", isOT: false },
  "Colossians": { ko: "골로새서", isOT: false }, "골로새서": { ko: "골로새서", isOT: false },
  "1 Thessalonians": { ko: "데살로니가전서", isOT: false }, "데살로니가전서": { ko: "데살로니가전서", isOT: false },
  "2 Thessalonians": { ko: "데살로니가후서", isOT: false }, "데살로니가후서": { ko: "데살로니가후서", isOT: false },
  "1 Timothy": { ko: "디모데전서", isOT: false }, "디모데전서": { ko: "디모데전서", isOT: false },
  "2 Timothy": { ko: "디모데후서", isOT: false }, "디모데후서": { ko: "디모데후서", isOT: false },
  "Titus": { ko: "디도서", isOT: false }, "디도서": { ko: "디도서", isOT: false },
  "Philemon": { ko: "빌레몬서", isOT: false }, "빌레몬서": { ko: "빌레몬서", isOT: false },
  "Hebrews": { ko: "히브리서", isOT: false }, "히브리서": { ko: "히브리서", isOT: false },
  "James": { ko: "야고보서", isOT: false }, "야고보서": { ko: "야고보서", isOT: false },
  "1 Peter": { ko: "베드로전서", isOT: false }, "베드로전서": { ko: "베드로전서", isOT: false },
  "2 Peter": { ko: "베드로후서", isOT: false }, "베드로후서": { ko: "베드로후서", isOT: false },
  "1 John": { ko: "요한일서", isOT: false }, "요한일서": { ko: "요한일서", isOT: false },
  "2 John": { ko: "요한이서", isOT: false }, "요한이서": { ko: "요한이서", isOT: false },
  "3 John": { ko: "요한삼서", isOT: false }, "요한삼서": { ko: "요한삼서", isOT: false },
  "Jude": { ko: "유다서", isOT: false }, "유다서": { ko: "유다서", isOT: false },
  "Revelation": { ko: "요한계시록", isOT: false }, "요한계시록": { ko: "요한계시록", isOT: false }
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
    .then(res => res.ok ? res.json() : fetch('/data/strongs_korean.json').then(r => r.json()))
    .then(data => {
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
    const clean = isOT ? (text || '').replace(/[\u0591-\u05AF]/g, '') : (text || '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = isOT ? 'he-IL' : 'el-GR';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

// =====================================================================
// 🌟 [핵심 해결 1 & 2]
// - 내가 적은 구절(예: 창 1:1, 롬 8:28-30)만 정확히 추출하는 파서!
// - 에디터나 입력창에서 '창1:1 ' 치고 스페이스바 누르면 즉시 본문으로 변환하는 엔진!
// =====================================================================
const parseFlexibleBibleRef = (refString) => {
  if (!refString || typeof refString !== 'string') return null;
  const trimmed = refString.trim();
  if (!trimmed) return null;

  // 예: "창 1:1-3", "창세기1:1", "요 3장 16절", "고전 13:4~7", "창 1장"
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
    b => b.ko === bookKo || b.en.toLowerCase() === rawBook.toLowerCase() || b.ko.startsWith(rawBook)
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

  // 1순위: 개역개정 4판(public/개역개정4판(구약+신약).txt)에서 조회
  const activeKrv4 = krv4Db || (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null);
  let chapArr =
    activeKrv4?.[parsed.bookEn]?.[chIdx] ||
    activeKrv4?.[parsed.bookKo]?.[chIdx] ||
    getKrv4ChapterVerses(parsed.bookEn, parsed.chapter || 1);

  let isKrv4 = Array.isArray(chapArr) && chapArr.length > 0;

  // 2순위 폴백: ko_ko.json
  if (!isKrv4) {
    const rawBook = (Array.isArray(bibleData) ? bibleData : []).find(
      b => b.name === parsed.bookEn || b.name === parsed.bookKo
    );
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

  // 🌟 사용자가 절을 지정했으면(예: 창 1:1 또는 롬 8:28-30) 장 전체가 아니라 '내가 적은 그 절만' 정확히 반환!
  const filteredVerses = parsed.hasSpecificVerse
    ? allChapterVerses.filter(v => v.vNum >= startV && v.vNum <= endV)
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

// ⌨️ [스페이스바 성경구절 자동완성 엔진] 텍스트 끝에 '창1:1' 또는 '요3:16-18' 입력 후 스페이스바 누르면 개역개정 4판 구절로 즉시 변환!
const resolveInlineVerseAutoComplete = (rawTextBeforeCursor, krv4Db = null) => {
  if (!rawTextBeforeCursor) return null;
  // 문장 맨 끝에 위치한 성경 구절 패턴 감지 (예: "창1:1", "창 1:1-3", "요한복음3:16")
  const match = rawTextBeforeCursor.match(/(?:^|[\s\n(>])([가-힣]{1,6})\s*(\d+):(\d+)(?:[-~](\d+))?$/);
  if (!match) return null;

  const fullMatchedToken = match[0].replace(/^[\s\n(>]/, '');
  const [, bookToken, chStr, vStartStr, vEndStr] = match;
  const refQuery = `${bookToken} ${chStr}:${vStartStr}${vEndStr ? `-${vEndStr}` : ''}`;

  const scriptData = getLocalScriptureVerses(refQuery, krv4Db);
  if (!scriptData.parsed || scriptData.verses.length === 0) return null;

  const combinedVerseText = scriptData.verses
    .map(v => (scriptData.verses.length > 1 ? `(${v.vNum}) ${v.text}` : v.text))
    .join(' ');

  return {
    matchedToken: fullMatchedToken,
    refLabel: scriptData.parsed.displayLabel,
    verseText: combinedVerseText,
    formattedPlain: `[${scriptData.parsed.displayLabel}] ${combinedVerseText} `,
    formattedHtml: `<b>[${scriptData.parsed.displayLabel}]</b> ${combinedVerseText}&nbsp;`
  };
};

// 단어·키워드 검색 시에도 개역개정 4판 66권 전체를 최우선 검색!
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
    const canon = BIBLE_66_CANON.find(c => c.en === bookObj.name || c.ko === bookObj.name);
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
    label: '하단 적용질문·설교자막 박스',
    desc: '유튜브 영상 중하단에 뜨는 파란색/어두운 자막 박스(2~4줄)를 정밀 추출합니다.',
    xRatio: 0.04, yRatio: 0.54, wRatio: 0.86, hRatio: 0.36
  },
  subtitle_bottom: {
    label: '하단 1~2줄 자막 바',
    desc: '영상 맨 아래쪽에 나오는 한 줄 또는 두 줄 설교 자막만 집중 추출합니다.',
    xRatio: 0.08, yRatio: 0.66, wRatio: 0.82, hRatio: 0.24
  },
  center_banner: {
    label: '중앙 타이틀·성경구절 배너',
    desc: '화면 중앙에 크게 표시되는 설교 제목, 대지 타이틀, 성경 본문 구절을 추출합니다.',
    xRatio: 0.06, yRatio: 0.22, wRatio: 0.88, hRatio: 0.50
  },
  full: {
    label: '유튜브 영상 전체 영역',
    desc: '상하단 컨트롤 바를 제외한 유튜브 영상 전체의 모든 글자를 추출합니다.',
    xRatio: 0.03, yRatio: 0.10, wRatio: 0.94, hRatio: 0.80
  }
};

// 모바일 세로형 전체 스크린샷 속에서 '유튜브 영상 박스'의 상하좌우 위치를 자동 감지하는 비전 알고리즘
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
      const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
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

  let cropX = 0, cropY = 0, cropW = sw, cropH = sh;

  if (customBox && customBox.w > 0.05 && customBox.h > 0.03) {
    cropX = Math.max(0, Math.floor(sw * customBox.x));
    cropY = Math.max(0, Math.floor(sh * customBox.y));
    cropW = Math.min(sw - cropX, Math.max(60, Math.floor(sw * customBox.w)));
    cropH = Math.min(sh - cropY, Math.max(30, Math.floor(sh * customBox.h)));
  } else {
    let baseX = 0, baseY = 0, baseW = sw, baseH = sh;
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
    const r = data[i], g = data[i + 1], b = data[i + 2];
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
    .map(line =>
      line
        .replace(/[|¦_~`^\\/<>{}[\]§¶©®™£¥€$@#%&*+=]/g, ' ')
        .replace(/\b[a-zA-Z]{1,3}\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(line => {
      if (line.length < 2) return false;
      const koreanChars = (line.match(/[가-힣]/g) || []).length;
      return koreanChars >= 2;
    })
    .join('\n');
};

// =====================================================================
// 모던 SaaS 라인 아이콘 세트
// =====================================================================
const StrokeWidth = "1.8";
const IconArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 9l5 3-5 3V9z" /></svg>;
const IconShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconMic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const IconDocument = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconTool = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconChevronDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}><polyline points="6 9 12 15 18 9" /></svg>;
const IconMaximize = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>;
const IconCamera = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IconBookOpen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

export default function Sermon({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, SubPageHeader, date, isGisangogi, authUser,
  renderToolbar, sermonEditorRef, handleStickerAdd, handleMemoAdd, handleFileUpload, CanvasEngine, tool, setTool,
  color, setColor, size, setSize, StickerLayer, currDay = {}, updateDay, onPtrDown, openModal, downloadSermonWord,
  gisangogiUrl, setGisangogiUrl, getArr, toggleAiDetect, isAiDetecting, ymdStr, extractVideoId, handleUpdateSharedQt, handleUpdateSharedSermon,
  globalSharedQt = {}, setDailyData, bibles, findBibleText, logUserAction, dailyData = {}
}) {
  if (!SubPageHeader) return null;

  const safeDay = currDay || {};
  const isSp = isGisangogi ? isGisangogi(date) : false;

  const [showToolbar, setShowToolbar] = useState(false);
  const rootSermonFullscreenRef = useRef(null);
  const ytPlayerBoxRef = useRef(null);
  const cinemaPlayerBoxRef = useRef(null);
  const captureInputRef = useRef(null);

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
  useEffect(() => { sttTargetRef.current = sttTargetField; }, [sttTargetField]);

  // 전체화면 시네마 워크스테이션 & 원어·아크·말씀찾기 상태
  const [isLiveCinemaMode, setIsLiveCinemaMode] = useState(false);
  const [cinemaHudTab, setCinemaHudTab] = useState('outline');
  const [isCinemaUiHidden, setIsCinemaUiHidden] = useState(false);
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcModalInitialMode, setArcModalInitialMode] = useState('arc');
  const [selectedWordVerse, setSelectedWordVerse] = useState(1);
  const [customRefQuery, setCustomRefQuery] = useState('');

  // 📖 개역개정 4판 DB 로드 상태 & 말씀·예시구절 멀티 검색 팝업 상태 (로마서 8장 하드코딩 완전 제거!)
  const [krv4TxtDb, setKrv4TxtDb] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [isBibleFinderOpen, setIsBibleFinderOpen] = useState(false);
  const [finderMode, setFinderMode] = useState('ref');
  const [finderRefInput, setFinderRefInput] = useState('');
  const [showFullChapterInFinder, setShowFullChapterInFinder] = useState(false);
  const [finderVersionMode, setFinderVersionMode] = useState('krv4'); // 'krv4' | 'parallel'
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

  const syncCapturesToDay = useCallback((nextCaptures) => {
    setSermonCaptures(nextCaptures);
    try {
      localStorage.setItem(`sermon_captures_${date}`, JSON.stringify(nextCaptures));
    } catch (_) {}
    if (updateDay) {
      updateDay({ sermonCaptures: nextCaptures });
    }
  }, [date, updateDay]);

  useEffect(() => {
    ensureKrv4TxtLoaded().then((parsedMap) => {
      if (parsedMap) setKrv4TxtDb(parsedMap);
    });
    ensureMasterStrongs();
    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => r.ok ? r.json() : {}).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then(r => r.ok ? r.json() : {}).then(d => setCommentaryDb(d || {})).catch(() => {});
    fetch('/data/matthew_henry.json').then(r => r.ok ? r.json() : {}).then(d => setMatthewHenryDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});

    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // 🌟 로마서 8:28 하드코딩 완전 제거! 사용자가 적은 설교 본문 구절만 정확히 참조
  const activeReferenceStr = useMemo(() => {
    return (customRefQuery && customRefQuery.trim()) ||
           (safeDay.sermonReference && safeDay.sermonReference.trim()) ||
           (globalSharedQt?.[date]?.sermonData?.reference && globalSharedQt[date].sermonData.reference.trim()) ||
           '';
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

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2600);
  }, []);

  // =====================================================================
  // ⌨️ [핵심 복원] 성경구절 적고 스페이스바(Space) 누르면 즉시 개역개정 4판 구절이 자동으로 적히는 기능!
  // =====================================================================
  const handleSpacebarVerseAutoCompleteOnInput = useCallback((e, fieldKey, currentVal, customSetter = null) => {
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
    showToast(`✨ [${resolved.refLabel}] 개역개정 4판 본문이 자동 완성되었습니다!`);
  }, [krv4TxtDb, updateDay, showToast]);

  // RichTextEditor(설교 본문 노트) 내부에서도 '창1:1' 치고 스페이스바 누르면 즉시 개역개정 4판 본문으로 자동 변환!
  const handleEditorContainerKeyDown = useCallback((e) => {
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

    // RichTextEditor의 onChange 동기화 트리거
    const editableRoot = node.parentElement?.closest('[contenteditable="true"]');
    if (editableRoot && updateDay) {
      updateDay({ sermonNotes: editableRoot.innerHTML });
    }
    showToast(`✨ [${resolved.refLabel}] 개역개정 4판 말씀이 노트에 자동 입력되었습니다!`);
  }, [krv4TxtDb, updateDay, showToast]);

  // =====================================================================
  // 원어 어절 선택 및 10대 학술 원어 강해 로드
  // =====================================================================
  const handleSelectInspectorWord = useCallback(async (word) => {
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
  }, [customNotesMap]);

  const openMcheyneStyleVerseInspector = useCallback(async (customRefStr, targetVerseNum) => {
    setMinimizedModals(prev => ({ ...prev, inspector: false }));
    const queryStr = (customRefStr && customRefStr.trim()) || activeReferenceStr || '창세기 1:1';
    const scriptData = getLocalScriptureVerses(queryStr, krv4TxtDb);
    const parsed = scriptData.parsed || { bookKo: '창세기', bookEn: 'Genesis', chapter: 1, startV: 1 };

    const koBook = parsed.bookKo || '창세기';
    const chNum = parsed.chapter || 1;
    const vNum = targetVerseNum || parsed.startV || 1;
    const bookInfo = BIBLE_66_MAP[koBook] || BIBLE_66_MAP[parsed.bookEn] || { ko: koBook, isOT: true };
    const isOT = bookInfo.isOT;

    const foundVerseObj = scriptData.allChapterVerses?.find(v => v.vNum === Number(vNum)) || scriptData.verses[0];
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
      .then(refs => setCrossRefs(refs || []))
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
        const strongIds = Array.from(new Set(wordsData.map(w => w.strongs_id).filter(Boolean)));
        let dictMap = new Map();

        if (strongIds.length > 0) {
          const { data: dictRows } = await supabase
            .from('strongs_dictionary')
            .select('*')
            .in('strongs_id', strongIds);

          if (dictRows && dictRows.length > 0) {
            dictRows.forEach(row => dictMap.set(row.strongs_id, row));
          }
        }

        const enriched = wordsData.map(w => {
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
      console.error("원어 인스펙터 로드 오류:", err);
    } finally {
      setIsInspectorLoading(false);
    }
  }, [activeReferenceStr, krv4TxtDb, easyBibleDb, webBibleDb, customNotesMap, handleSelectInspectorWord]);

  const handleInsertWordToSermonNote = (word) => {
    if (!word || !inspectorTarget) return;
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = (customInputMemo || word.userCustomNote?.memo) ? `<br/>↳ 연구 메모: ${customInputMemo || word.userCustomNote?.memo}` : '';
    const htmlSnippet = `<p><b>[${inspectorTarget.book} ${inspectorTarget.chapter}:${inspectorTarget.verse} 원어강해] ${word.inflected}${lemmaNotice} (${word.strongs})</b>: ${customInputTrans || word.korContextual} — <i>${word.grammarDecoded}</i>${customMemoNotice}</p>`;

    const prev = safeDay.sermonNotes || '';
    updateDay && updateDay({ sermonNotes: prev + htmlSnippet });
    showToast(`[${word.inflected}] 원어 강해가 설교 필기장에 삽입되었습니다.`);
  };

  const handleJumpToInterlinearStudio = () => {
    if (!inspectorTarget) return;
    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: inspectorTarget.book,
        chapter: Number(inspectorTarget.chapter),
        verse: Number(inspectorTarget.verse)
      }));
    } catch (_) {}
    setInspectorTarget(null);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsLiveCinemaMode(false);
    if (setActiveScreen) setActiveScreen('interlinear');
  };

  // =====================================================================
  // 팝업 가림 없이 유튜브 영상 자막만 도려내는 스마트 OCR 엔진
  // =====================================================================
  const [touchCropBox, setTouchCropBox] = useState(null);
  const touchStartRef = useRef(null);
  const fullPreviewImgRef = useRef(null);

  const runOcrOnCaptureItem = useCallback(async (captureItem, customPreset, customTouchBox = null) => {
    if (!captureItem || !captureItem.imageUrl) return;
    const activePreset = customPreset || ocrCropPreset;
    setOcrLoadingId(captureItem.id);
    showToast('유튜브 자막·적용질문 텍스트를 정밀 판독 중입니다...');

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
        const reCropped = createHighAccuracyOcrImage(
          tempC,
          activePreset,
          captureItem.playerRect || null,
          customTouchBox
        );
        targetImgUrl = reCropped.preprocessedDataUrl;
        nextSubCropUrl = reCropped.croppedPreviewUrl;
      }

      const result = await Tesseract.recognize(targetImgUrl, 'kor+eng');
      const cleaned = cleanKoreanOcrText(result?.data?.text || '');

      const finalExtracted = cleaned || '자막을 명확히 인식하지 못했습니다. 아래 원본 화면 위에서 자막 부분만 손가락으로 드래그하여 영역을 지정해 보세요!';

      const updatedItem = {
        ...captureItem,
        subtitleCropUrl: nextSubCropUrl || captureItem.subtitleCropUrl,
        ocrText: finalExtracted
      };

      setStudioDraftItem(updatedItem);

      setSermonCaptures(prev => {
        const exists = prev.some(item => item.id === updatedItem.id);
        const updated = exists
          ? prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
          : [updatedItem, ...prev];
        try {
          localStorage.setItem(`sermon_captures_${date}`, JSON.stringify(updated));
        } catch (_) {}
        if (updateDay) updateDay({ sermonCaptures: updated });
        return updated;
      });

      showToast('자막·적용질문 텍스트 추출 완료!');
    } catch (err) {
      console.error('OCR Error:', err);
      showToast('텍스트 판독 중 오류가 발생했습니다.');
    } finally {
      setOcrLoadingId(null);
    }
  }, [ocrCropPreset, date, updateDay, showToast]);

  const processCapturedCanvasToItem = useCallback(async (sourceCanvas, label = '유튜브 자막 스캔', playerRect = null) => {
    const fullDataUrl = sourceCanvas.toDataURL('image/jpeg', 0.90);
    const { preprocessedDataUrl, croppedPreviewUrl } = createHighAccuracyOcrImage(sourceCanvas, ocrCropPreset, playerRect, null);

    const newItem = {
      id: `cap_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label,
      imageUrl: fullDataUrl,
      subtitleCropUrl: croppedPreviewUrl,
      preprocessedUrl: preprocessedDataUrl,
      playerRect: playerRect ? { left: playerRect.left, top: playerRect.top, width: playerRect.width, height: playerRect.height } : null,
      ocrText: '유튜브 자막 박스에서 글자를 정밀 판독 중입니다...'
    };

    setTouchCropBox(null);
    setStudioDraftItem(newItem);
    setMinimizedModals(prev => ({ ...prev, ocr: false }));
    setIsOcrStudioOpen(true);

    const nextList = [newItem, ...sermonCaptures];
    syncCapturesToDay(nextList);

    await runOcrOnCaptureItem(newItem);
  }, [ocrCropPreset, sermonCaptures, syncCapturesToDay, runOcrOnCaptureItem]);

  const handleToggleOcrStudioModal = () => {
    setMinimizedModals(prev => ({ ...prev, ocr: false }));
    setIsOcrStudioOpen(prev => {
      const next = !prev;
      if (next && sermonCaptures.length > 0 && !studioDraftItem) {
        setStudioDraftItem(sermonCaptures[0]);
      }
      return next;
    });
  };

  const handleReadClipboardImageForOcr = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(tp => tp.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = async () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              canvas.getContext('2d').drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              await processCapturedCanvasToItem(canvas, '클립보드 자막 스캔', null);
            };
            img.src = url;
            return;
          }
        }
      }
      if (captureInputRef.current) {
        captureInputRef.current.click();
      }
    } catch (err) {
      if (captureInputRef.current) {
        captureInputRef.current.click();
      }
    }
  };

  const handleDirectTabCapture = async () => {
    if (isCapturingScreen) return;

    const isMobileOrTablet =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== 'function';

    if (isMobileOrTablet) {
      if (captureInputRef.current) {
        captureInputRef.current.click();
        showToast('📱 방금 찍은 유튜브 스크린샷 사진을 선택하면 자막만 자동 추출됩니다!');
      } else {
        setMinimizedModals(prev => ({ ...prev, ocr: false }));
        setIsOcrStudioOpen(true);
      }
      return;
    }

    if (isOcrStudioOpen) {
      setIsOcrStudioOpen(false);
      await new Promise(r => setTimeout(r, 320));
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
      await new Promise(r => setTimeout(r, 300));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stream.getTracks().forEach(track => track.stop());
      await processCapturedCanvasToItem(canvas, '유튜브 실시간 자막 캡처', playerRect);
    } catch (err) {
      showToast('화면 캡처가 취소되었습니다.');
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const handleUploadCaptureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
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
      await processCapturedCanvasToItem(canvas, '모바일 스크린샷 자막 스캔', null);
    };
    img.src = objectUrl;
    e.target.value = '';
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = async () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              await processCapturedCanvasToItem(canvas, '클립보드 붙여넣기 스캔', null);
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processCapturedCanvasToItem]);

  const handleDispatchOcrTextToField = (targetField, rawText, capItem) => {
    const text = (rawText || '').trim();
    if (!text) return alert('전송할 텍스트가 없습니다.');

    if (targetField === 'apply') {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const curQuestions = getArr ? [...getArr(safeDay.applyQuestions)] : [];
      const nextQuestions = [...curQuestions, ...lines];
      updateDay && updateDay({ applyQuestions: nextQuestions });
      showToast(`추출된 문장 ${lines.length}건이 [설교 적용 질문]에 등록되었습니다.`);
    } else if (targetField === 'conviction') {
      updateDay && updateDay({ sermonConviction: text.replace(/\n/g, ' ') });
      showToast('추출된 문장이 [핵심 한 문장 요약]에 등록되었습니다.');
    } else if (targetField === 'point1' || targetField === 'point2' || targetField === 'point3') {
      const keyMap = { point1: 'sermonPoint1', point2: 'sermonPoint2', point3: 'sermonPoint3' };
      const labelMap = { point1: '제1대지', point2: '제2대지', point3: '제3대지' };
      const fieldKey = keyMap[targetField];
      const existing = safeDay[fieldKey] ? `${safeDay[fieldKey]} / ` : '';
      updateDay && updateDay({ [fieldKey]: existing + text.replace(/\n/g, ' ') });
      showToast(`추출된 문장이 [${labelMap[targetField]}]에 입력되었습니다.`);
    } else {
      const prev = safeDay.sermonNotes || '';
      const timeStr = capItem?.timestamp || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const snippet = `<div style="margin:10px 0; padding:12px; border:1px solid #cbd5e1; border-radius:10px; background:rgba(15,23,42,0.03);"><p><b>[유튜브 자막·질문 스캔 (${timeStr})]</b></p><p>${text.replace(/\n/g, '<br/>')}</p></div><p><br/></p>`;
      updateDay && updateDay({ sermonNotes: prev + snippet });
      showToast('추출된 텍스트가 [설교 필기장 본문]에 삽입되었습니다.');
    }
  };

  const handleInsertVerseToSermonNotes = (refLabel, verseText) => {
    const prev = safeDay.sermonNotes || '';
    const { pureText } = splitPericopeAndVerse(verseText);
    const snippet = `<div style="margin:8px 0; padding:10px 14px; border-left:3px solid #d97706; background:rgba(245,158,11,0.06); border-radius:6px;"><p><b>[${refLabel} · 개역개정4판]</b> ${pureText}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast(`[${refLabel}] 개역개정 4판 말씀이 설교 필기장에 삽입되었습니다.`);
  };

  // 🌟 [핵심 해결 1] 본문 보기 클릭 시:
  // 1) 기존 findBibleText 프롭도 호출하여 기존 구조와 100% 호환 유지
  // 2) 내가 적은 본문 구절(예: 창 1:1-3)만 정확히 필터링하여 개역개정 4판 모달 오픈!
  const handleOpenKrv4ScriptureView = (refStr) => {
    const targetRef = (refStr && refStr.trim()) || activeReferenceStr;
    if (findBibleText && targetRef) {
      try { findBibleText(targetRef); } catch (_) {}
    }
    setFinderRefInput(targetRef || '');
    setShowFullChapterInFinder(false); // 장 전체가 아니라 내가 적은 구절만 먼저 딱 뜨도록 설정!
    setFinderMode('ref');
    setMinimizedModals(prev => ({ ...prev, finder: false }));
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
    if (!target) return alert("유튜브 링크를 입력해주세요.");

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

  const activeYoutubeId = isSp ? (gisanVidId || currentVideoId) : currentVideoId;

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const toggleSanctuaryMode = () => {
    const next = !isSanctuaryMode;
    setIsSanctuaryMode(next);
    localStorage.setItem('sermon_sanctuary_mode', String(next));
  };

  const handleShareVideo = () => {
    const targetUrl = safeDay.sermonVideoUrl || (safeDay.sermonVideoId ? `https://youtu.be/${safeDay.sermonVideoId}` : '');
    if (!targetUrl) return alert("공유할 유튜브 링크를 먼저 입력해주세요.");
    
    if (handleUpdateSharedQt) {
      handleUpdateSharedQt(date, 'sermon', targetUrl);
    } else if (handleUpdateSharedSermon) {
      handleUpdateSharedSermon(date, targetUrl);
    }
    
    if (navigator.share) {
      navigator.share({
        title: safeDay.sermonTitle || '예배 설교 영상',
        url: targetUrl
      }).catch(() => {});
    }
    showToast("예배 영상 링크가 공유되었습니다.");
  };

  const handleActionItemSync = (val) => {
    if (updateDay) {
      updateDay({ sermonActionItem: val, sermonActionCompleted: false });
    }
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const filtered = saved.filter(item => item.date !== date || item.source !== 'sermon');
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
      const updated = saved.map(item => {
        if (item.date === date && item.source === 'sermon') {
          return { ...item, graceLine: val };
        }
        return item;
      });
      localStorage.setItem('apply_tracker_items', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSendDeclarationToCell = (text) => {
    if (!text || !text.trim()) return alert("전송할 감사 내용이 없습니다.");
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({
        id: Date.now(),
        date: date,
        source: 'sermon_declaration',
        text: encryptField(text.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      showToast("목장 모임 [감사나눔]으로 전송되었습니다.");
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const inlineActionSendToTracker = () => {
    const textToPush = safeDay.sermonActionItem || safeDay.sermonGraceLine || safeDay.sermonTitle || '설교 결단 및 적용';
    handleActionItemSync(textToPush);
    showToast("적용 트래커에 반영되었습니다.");
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
      showToast("나의 기도함에 보관되었습니다.");
    } catch (e) {
      showToast("기도함 저장 중 오류가 발생했습니다.");
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
      showToast("담당 교역자에게 1:1 상담이 요청되었습니다.");
    } catch (e) {
      showToast("상담 요청 전송 중 오류가 발생했습니다.");
    }
  };

  // =====================================================================
  // 세밀화된 실시간 STT(음성 필기) 엔진
  // =====================================================================
  const toggleSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("현재 브라우저에서 음성 인식을 지원하지 않습니다.");

    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      setSttInterimText('');
      if (sermonRecRef.current) {
        try { sermonRecRef.current.stop(); } catch (e) {}
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
          setDailyData(prev => {
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
        try { sermonRecRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const originalFontStyle = (isOT) => isOT
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

  const renderStickersCallback = useCallback(function () {
    if (!StickerLayer) return null;
    return (
      <StickerLayer
        stickers={safeDay.stickers}
        memos={safeDay.memos}
        onUpdateStickers={function (s) { if (updateDay) updateDay({ stickers: s }); }}
        onUpdateMemos={function (m) { if (updateDay) updateDay({ memos: m }); }}
        onPtrDown={onPtrDown}
      />
    );
  }, [StickerLayer, safeDay.stickers, safeDay.memos, updateDay, onPtrDown]);

  const handleRichTextChange = useCallback(function (htmlVal) {
    if (updateDay) updateDay({ sermonNotes: htmlVal });
  }, [updateDay]);

  const BacklinkPanel = () => {
    if (!activeBacklink) return null;
    const isDarkTheme = isDarkMode;

    const relatedEntries = Object.entries(dailyData || {}).filter(([dKey, dVal]) => {
      if (dKey === date) return false;
      const fullText = `${dVal.sermonNotes || ''} ${dVal.qtMeditation || ''} ${dVal.qtGraceLine || ''}`;
      return fullText.includes(activeBacklink);
    }).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] z-[200] shadow-2xl flex flex-col transition-transform animate-fade-in ${isDarkTheme ? 'bg-[#121418] border-l border-white/10' : 'bg-white border-l border-stone-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-white/10' : 'border-stone-200'}`}>
          <h3 className={`text-[14px] font-bold ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>{activeBacklink} 관련 기록</h3>
          <button onClick={() => setActiveBacklink(null)} className={`p-1.5 rounded-full hover:bg-stone-500/20 transition-colors ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar pointer-events-auto">
          {relatedEntries.length === 0 ? (
            <div className={`py-10 text-center text-[12px] font-medium ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
              과거 예배/묵상 기록이 없습니다.
            </div>
          ) : (
            relatedEntries.map(([dKey, dVal]) => (
              <div key={dKey} className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                <span className={`text-[10px] font-mono ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>{dKey}</span>
                <p className={`text-[12.5px] font-serif leading-relaxed line-clamp-4 ${isDarkTheme ? 'text-stone-200' : 'text-stone-700'}`}>
                  {(dVal.sermonNotes || dVal.qtMeditation || dVal.qtGraceLine || '').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 말씀 찾기 모달에서 보여줄 절 목록 (내가 적은 절만 표시 vs 장 전체 펼치기)
  const displayedFinderVerses = useMemo(() => {
    if (showFullChapterInFinder) {
      return finderScriptureData.allChapterVerses || finderScriptureData.verses;
    }
    return finderScriptureData.verses;
  }, [showFullChapterInFinder, finderScriptureData]);

  return (
    <div
      ref={rootSermonFullscreenRef}
      className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0C0E12]' : 'bg-[#F8F9FA]'}`}
    >
      <BacklinkPanel/>

      <input
        ref={captureInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadCaptureFile}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* 1. 상단 글로벌 헤더 바 */}
      {/* ===================================================================== */}
      <header className={`shrink-0 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 z-20 border-b relative ${isDark ? 'border-white/10 bg-[#12141A]' : 'border-stone-200/90 bg-white'}`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-stone-100'}`}
          >
            <IconArrowLeft/>
          </button>
          <h1 className={`text-[15.5px] sm:text-[16.5px] font-bold tracking-tight whitespace-nowrap shrink-0 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            예배 노트
          </h1>
          {krv4TxtDb && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0">
              개역개정 4판
            </span>
          )}
          {isSanctuaryMode && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${isDark ? 'bg-white/10 text-stone-200 border-white/15' : 'bg-stone-100 text-stone-700 border-stone-300'}`}>
              집중모드
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => enterLiveCinemaFullscreen('outline')}
            className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              isDark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-black'
            }`}
          >
            <IconMaximize/> <span>전체화면 노트</span>
          </button>

          <button 
            onClick={toggleSanctuaryMode}
            className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              isSanctuaryMode 
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent' 
                : (isDark ? 'bg-white/5 border-white/15 text-stone-300 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50')
            }`}
          >
            <span>{isSanctuaryMode ? '본당 집중' : '일반 뷰'}</span>
          </button>

          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              showToolbar
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent'
                : (isDark ? 'bg-white/5 text-stone-300 border-white/15' : 'bg-white text-stone-700 border-stone-200')
            }`}
          >
            <IconTool/> <span>{showToolbar ? '도구 닫기' : '서식'}</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-stone-100'}`}
          >
            <IconMenu/>
          </button>
        </div>
      </header>

      {/* 토스트 알림 */}
      {actionToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[9999999] bg-stone-900 text-white text-[12px] font-bold px-4 py-2 rounded-lg shadow-2xl border border-white/15 flex items-center gap-2 whitespace-nowrap">
          <span>✓</span> {actionToast}
        </div>
      )}

      {/* 서식 툴바 */}
      {showToolbar && (
        <div className={`relative z-20 w-full px-2 py-1.5 border-b shrink-0 overflow-x-auto hide-scrollbar ${isDark ? 'border-white/10 bg-[#12141A]' : 'border-stone-200 bg-white'}`}>
          {renderToolbar && renderToolbar(sermonEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}
      
      {/* ===================================================================== */}
      {/* 2. 본문 뷰포트 레이아웃 */}
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
          <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-3 sm:px-5 py-3.5 pb-32 relative z-10 space-y-3.5 max-w-4xl mx-auto">
            
            {/* 일자 바 & 아카이브/저장 제어 */}
            <div className={`px-4 py-2.5 rounded-xl border flex justify-between items-center gap-2 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[14px] font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-stone-900'}`}>{date}</span>
                <span className="text-[11px] text-stone-400 font-medium truncate">
                  {isSp ? '특별집회 설교 노트' : '주일 예배 설교 노트'}
                </span>
              </div>

              <div className="flex gap-1.5 shrink-0 ignore-draw">
                <button
                  onClick={() => openModal && openModal('sermonList')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                    isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/15' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <IconList/> <span>노트 목록</span>
                </button>
                <button
                  onClick={downloadSermonWord}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 cursor-pointer hover:opacity-90 whitespace-nowrap"
                >
                  <IconSave/> <span>Word 저장</span>
                </button>
              </div>
            </div>

            {/* 설교 메타데이터 & 성경 연구 툴바 */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
              <input 
                type="text" 
                value={safeDay.sermonTitle || globalSharedQt?.[date]?.sermonData?.title || ''} 
                onChange={e => updateDay({ sermonTitle: e.target.value })} 
                onPointerDown={e => e.stopPropagation()} 
                className={`w-full px-3.5 py-2.5 rounded-lg text-[15px] font-bold outline-none border transition-all ${
                  isDark ? 'bg-[#0E1015] border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                }`} 
                placeholder="설교 제목을 입력하세요" 
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input 
                  type="text" 
                  value={safeDay.sermonPreacher || globalSharedQt?.[date]?.sermonData?.preacher || ''} 
                  onChange={e => updateDay({ sermonPreacher: e.target.value })} 
                  onPointerDown={e => e.stopPropagation()} 
                  className={`sm:col-span-5 px-3.5 py-2 rounded-lg text-[13px] font-medium outline-none border transition-all ${
                    isDark ? 'bg-[#0E1015] border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                  }`} 
                  placeholder="설교자 (예: 담임목사)" 
                />
                <div className="sm:col-span-7 flex gap-1.5 ignore-draw items-center">
                  <input 
                    type="text" 
                    value={safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || ''} 
                    onChange={e => {
                      setCustomRefQuery(e.target.value);
                      updateDay && updateDay({ sermonReference: e.target.value });
                    }} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOpenKrv4ScriptureView(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference);
                      }
                    }}
                    onPointerDown={e => e.stopPropagation()} 
                    placeholder="설교 본문 구절 입력 (예: 창 1:1-5, 요 3:16)" 
                    className={`flex-1 min-w-0 px-3.5 py-2 rounded-lg text-[13px] font-medium outline-none border transition-all ${
                      isDark ? 'bg-[#0E1015] border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                    }`} 
                  />
                  <button 
                    onClick={() => handleOpenKrv4ScriptureView(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference)} 
                    className={`shrink-0 px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isDark ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <IconBookOpen/> <span>본문 보기</span>
                  </button>
                </div>
              </div>

              {/* 4대 성경 연구 툴바 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    if (isBibleFinderOpen) setIsBibleFinderOpen(false);
                    else {
                      setFinderRefInput(activeReferenceStr);
                      setShowFullChapterInFinder(false);
                      setMinimizedModals(prev => ({ ...prev, finder: false }));
                      setIsBibleFinderOpen(true);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    isBibleFinderOpen
                      ? 'bg-amber-500 text-stone-950 border-amber-500'
                      : isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <IconSearch/> <span>{isBibleFinderOpen ? '말씀찾기 닫기' : '개역개정4판 찾기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectorTarget) setInspectorTarget(null);
                    else openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    inspectorTarget
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <IconBookOpen/> <span>{inspectorTarget ? '원어강해 닫기' : '원어 강해'}</span>
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
                  className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    isArcModalOpen && arcModalInitialMode === 'arc'
                      ? 'bg-emerald-500 text-stone-950 border-emerald-500'
                      : isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
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
                  className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    isArcModalOpen && arcModalInitialMode === '2d'
                      ? 'bg-emerald-500 text-stone-950 border-emerald-500'
                      : isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <span>말씀 은하계</span>
                </button>
              </div>

              {/* 핵심 요약 한 문장 (스페이스바 구절 자동완성 지원) */}
              <div className="pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
                <div className={`p-3 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50/80 border-stone-200/90'}`}>
                  <span className={`text-[11px] font-bold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    핵심 요절 및 설교 한 문장 요약 <span className="text-[10px] text-amber-500 ml-1">(팁: '창1:1' 치고 스페이스바 누르면 구절 자동완성!)</span>
                  </span>
                  <input 
                    type="text" 
                    value={safeDay.sermonConviction || ''} 
                    onChange={e => updateDay && updateDay({ sermonConviction: e.target.value })} 
                    onKeyDown={e => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonConviction', safeDay.sermonConviction || '')}
                    placeholder="설교 중 가장 중심이 되는 핵심 문장을 기록하세요 (예: 요3:16 + 스페이스바)" 
                    className={`w-full bg-transparent outline-none text-[13.5px] font-medium ${isDark ? 'text-white placeholder:text-stone-600' : 'text-stone-900 placeholder:text-stone-400'}`} 
                  />
                </div>
              </div>

              {linkedRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5 ignore-draw">
                  {linkedRefs.map(ref => (
                    <button 
                      key={ref}
                      onClick={(e) => { e.stopPropagation(); setActiveBacklink(ref); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                        activeBacklink === ref 
                          ? (isDark ? 'bg-white text-stone-900 border-white' : 'bg-stone-900 text-white border-stone-900')
                          : (isDark ? 'bg-black/40 border-white/10 text-stone-300 hover:text-white' : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900')
                      }`}
                    >
                      {ref} 과거 기록 대조
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* 3. 유튜브 예배 영상 시청 섹션 */}
            {/* ===================================================================== */}
            {!isSanctuaryMode && (
              <div
                onPointerDown={e => e.stopPropagation()}
                className={`p-4 rounded-xl border flex flex-col gap-3 ignore-draw transition-all ${
                  isVideoPinned ? 'sticky top-2 z-30 shadow-2xl ring-1 ring-stone-400/30' : ''
                } ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <IconVideo/>
                    <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      {isSp ? `${currentMonthNum}월 특별집회 영상 시청` : '주일 예배 영상 시청'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`개역개정 4판 ${activeReferenceStr || '성경'} 낭독`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border flex items-center gap-1 transition-colors whitespace-nowrap ${
                        isDark ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      <span>개역개정4판 본문유튜브</span> <IconExternal/>
                    </a>

                    <a
                      href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border flex items-center gap-1 transition-colors whitespace-nowrap ${
                        isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>설교 영상 검색</span> <IconExternal/>
                    </a>

                    <button
                      type="button"
                      onClick={handleShareVideo}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                        isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <IconShare/> <span>공유</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoPinned(!isVideoPinned)}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border cursor-pointer transition-colors whitespace-nowrap ${
                        isVideoPinned
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent'
                          : (isDark ? 'bg-white/5 border-white/15 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-600')
                      }`}
                    >
                      {isVideoPinned ? '상단고정 해제' : '영상 상단고정'}
                    </button>

                    {isSp && (
                      <button
                        type="button"
                        onClick={() => setShowMonthlyModal(true)}
                        className="text-[11px] font-bold text-stone-500 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        월별 링크 설정
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-1.5 flex-1">
                    <input 
                      type="text" 
                      placeholder="유튜브 설교 또는 실시간 스트리밍 주소(URL) 붙여넣기" 
                      value={isSp ? inputUrl : (safeDay.sermonVideoUrl || '')} 
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
                      className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium outline-none border ${
                        isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                      }`} 
                    />
                    {isSp && (
                      <button
                        onClick={handleApplyCurrentMonthGisanVideo}
                        className="shrink-0 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11.5px] font-bold rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        저장
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={handleDirectTabCapture}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11.5px] font-black flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <IconCamera/> <span>영상 자막 즉시캡처</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleOcrStudioModal}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer whitespace-nowrap ${
                        isOcrStudioOpen
                          ? 'bg-rose-600 text-white border-rose-500'
                          : isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isOcrStudioOpen ? '스캔창 닫기 ✕' : '스캔창 열기'}
                    </button>

                    <button
                      type="button"
                      onClick={() => enterLiveCinemaFullscreen('outline')}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <IconMaximize/> <span>전체화면 워크스테이션</span>
                    </button>
                  </div>
                </div>

                {!isLiveCinemaMode && (
                  <div
                    ref={ytPlayerBoxRef}
                    className={`w-full ${isVideoPinned ? 'max-h-[210px] sm:max-h-[260px]' : ''} aspect-video rounded-xl overflow-hidden bg-[#0A0C10] relative border border-black/10 dark:border-white/10`}
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                        <p className="text-[12.5px] font-medium text-stone-400">
                          개역개정 4판 성경 본문 유튜브나 주일 예배 설교 영상을 검색하여 주소를 붙여넣으세요.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`개역개정 4판 ${activeReferenceStr || '성경'} 낭독`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-[11.5px] font-black flex items-center gap-1.5 shadow-sm"
                          >
                            <span>📖 개역개정 4판 {activeReferenceStr ? `(${activeReferenceStr})` : ''} 유튜브 찾기</span> <IconExternal/>
                          </a>
                          <a
                            href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-bold border border-white/15 flex items-center gap-1.5"
                          >
                            <span>김포좋은나무교회 설교 검색</span> <IconExternal/>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* 4. 유튜브 자막·적용질문 OCR 스캔 보관함 */}
            {/* ===================================================================== */}
            <div
              onPointerDown={e => e.stopPropagation()}
              className={`p-4 rounded-xl border flex flex-col gap-3 ignore-draw ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-stone-900 text-white'}`}>
                    OCR STUDIO
                  </span>
                  <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    유튜브 자막 · 적용질문 스캔 보관함 ({sermonCaptures.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDirectTabCapture}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-black bg-amber-500 text-stone-950 hover:bg-amber-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <IconCamera/> <span>영상 자막 바로캡처</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleOcrStudioModal}
                    className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 text-white border-white/15' : 'bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    {isOcrStudioOpen ? '스캔창 닫기' : '스캔창 열기'}
                  </button>
                </div>
              </div>

              {sermonCaptures.length === 0 ? (
                <div
                  onClick={handleDirectTabCapture}
                  className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-colors ${
                    isDark ? 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-stone-400' : 'border-stone-300 bg-stone-50/70 hover:bg-stone-100 text-stone-500'
                  }`}
                >
                  <p className="text-[12px] font-bold">PC 화면 직접 캡처 및 모바일/태블릿 스크린샷 자막 자동 인식 지원</p>
                  <p className="text-[11px] opacity-80 mt-0.5">유튜브 영상에 자막이나 적용질문이 나올 때 클릭하면 자막만 정밀 추출합니다</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                  {sermonCaptures.map((cap) => (
                    <div
                      key={cap.id}
                      className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50 border-stone-200'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {cap.subtitleCropUrl && (
                            <img src={cap.subtitleCropUrl} alt="crop" className="h-7 w-16 object-cover rounded border border-white/20 bg-black" />
                          )}
                          <span className="text-[11px] font-mono font-bold text-amber-500">{cap.label} ({cap.timestamp})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStudioDraftItem(cap);
                              setMinimizedModals(prev => ({ ...prev, ocr: false }));
                              setIsOcrStudioOpen(true);
                            }}
                            className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                          >
                            영역 재조정
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = sermonCaptures.filter(item => item.id !== cap.id);
                              syncCapturesToDay(next);
                            }}
                            className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
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
                          const next = sermonCaptures.map(item => item.id === cap.id ? { ...item, ocrText: val } : item);
                          syncCapturesToDay(next);
                        }}
                        className={`w-full p-2 rounded-lg border text-[12.5px] font-medium outline-none resize-none ${
                          isDark ? 'bg-[#161922] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'
                        }`}
                      />

                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] font-bold text-stone-400 mr-1">원터치 넣기:</span>
                        {[
                          { label: '+ 적용질문', field: 'apply' },
                          { label: '+ 핵심요약', field: 'conviction' },
                          { label: '+ 제1대지', field: 'point1' },
                          { label: '+ 제2대지', field: 'point2' },
                          { label: '+ 제3대지', field: 'point3' },
                          { label: '+ 필기장 본문', field: 'notes' }
                        ].map((btn) => (
                          <button
                            key={btn.field}
                            type="button"
                            onClick={() => handleDispatchOcrTextToField(btn.field, cap.ocrText, cap)}
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold border cursor-pointer transition-colors ${
                              isDark ? 'bg-white/5 border-white/10 text-stone-200 hover:bg-white/15' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* 5. 설교 3대지 구조화 빌더 (스페이스바 구절 자동완성 지원) */}
            {/* ===================================================================== */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
              <div 
                onClick={() => setShowOutlineBuilder(!showOutlineBuilder)}
                className="flex justify-between items-center cursor-pointer select-none"
              >
                <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  설교 대지 구조화 (3-Point Outline)
                </span>
                <IconChevronDown className={showOutlineBuilder ? 'w-4 h-4 text-stone-400 transition-transform rotate-180' : 'w-4 h-4 text-stone-400 transition-transform'} />
              </div>

              {showOutlineBuilder && (
                <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-white/10 ignore-draw" onPointerDown={e => e.stopPropagation()}>
                  {[
                    { key: 'sermonPoint1', label: '제1대지: 본문 관찰 및 하나님의 성품', code: 'POINT 01', ph: '첫 번째 대지 핵심 내용을 입력하세요 (예: 창1:1 + 스페이스바)' },
                    { key: 'sermonPoint2', label: '제2대지: 직면한 나의 모습과 회개', code: 'POINT 02', ph: '두 번째 대지 핵심 내용을 입력하세요' },
                    { key: 'sermonPoint3', label: '제3대지: 구속사적 결단과 순종', code: 'POINT 03', ph: '세 번째 대지 핵심 내용을 입력하세요' }
                  ].map((pt) => (
                    <div key={pt.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11.5px] font-bold text-stone-500">
                        <span>{pt.label}</span>
                        <span className="text-[10px] font-mono opacity-60">{pt.code}</span>
                      </div>
                      <input 
                        type="text" 
                        value={safeDay[pt.key] || ''} 
                        onChange={e => updateDay && updateDay({ [pt.key]: e.target.value })} 
                        onKeyDown={e => handleSpacebarVerseAutoCompleteOnInput(e, pt.key, safeDay[pt.key] || '')}
                        placeholder={pt.ph} 
                        className={`w-full px-3.5 py-2 rounded-lg border text-[13px] font-medium outline-none ${
                          isDark ? 'bg-[#0E1015] border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                        }`} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* 6. 설교 적용 질문 (목장 나눔 질문) & 나의 결단 */}
            {/* ===================================================================== */}
            <div
              onPointerDown={e => e.stopPropagation()}
              className={`p-4 rounded-xl border flex flex-col gap-3 ignore-draw ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  설교 적용 질문 & 목장 나눔
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDirectTabCapture}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    + 영상 적용질문 바로캡처
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = getArr ? [...getArr(safeDay.applyQuestions)] : [];
                      updateDay && updateDay({ applyQuestions: [...cur, ''] });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-stone-100 border-stone-200 text-stone-800'
                    }`}
                  >
                    + 질문 추가
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || ['']).map((qText, qIdx) => (
                  <div key={qIdx} className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-mono font-bold shrink-0">
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
                        className={`flex-1 bg-transparent text-[13px] font-bold outline-none ${isDark ? 'text-white' : 'text-stone-900'}`}
                      />
                      {qIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextQ = [...(getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions)].filter((_, i) => i !== qIdx);
                            updateDay && updateDay({ applyQuestions: nextQ });
                          }}
                          className="text-xs text-rose-500 font-bold px-1 cursor-pointer"
                        >
                          ✕
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
                      className={`w-full p-2.5 rounded-lg border text-[12.5px] outline-none resize-none ${
                        isDark ? 'bg-[#161922] border-white/10 text-stone-200' : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 7. 설교 본문 리치 텍스트 에디터 (스페이스바 구절 자동완성 + STT 완벽 지원!) */}
            {/* ===================================================================== */}
            <div
              onPointerDown={e => e.stopPropagation()}
              className={`p-4 rounded-xl border flex flex-col gap-3 ignore-draw ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconDocument/>
                  <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    설교 본문 노트 & 실시간 음성 필기
                  </span>
                  <span className="text-[10.5px] font-bold text-amber-500">
                    (⌨️ 본문에서 '창1:1', '롬8:28' 치고 스페이스바 누르면 구절 즉시 자동완성!)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <select
                    value={sttTargetField}
                    onChange={(e) => setSttTargetField(e.target.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border outline-none ${
                      isDark ? 'bg-[#0E1015] border-white/15 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
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
                    className={`px-3 py-1 rounded-lg text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isSpeechRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-900 text-white hover:bg-black'
                    }`}
                  >
                    <IconMic/>
                    <span>{isSpeechRecording ? '음성 받아쓰기 중지' : '음성 받아쓰기 시작'}</span>
                  </button>
                </div>
              </div>

              {isSpeechRecording && sttInterimText && (
                <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
                  인식 중: {sttInterimText}
                </div>
              )}

              {/* 스페이스바 자동완성 감지 래퍼 */}
              <div
                onKeyDownCapture={handleEditorContainerKeyDown}
                className="min-h-[320px] rounded-xl overflow-hidden border border-stone-200 dark:border-white/10"
              >
                <RichTextEditor
                  ref={sermonEditorRef}
                  value={safeDay.sermonNotes || ''}
                  onChange={handleRichTextChange}
                  placeholder="설교 말씀을 들으며 은혜받은 내용과 묵상을 기록하세요. (예: '창1:1' 입력 후 스페이스바를 누르면 개역개정 4판 구절이 자동으로 완성됩니다!)"
                  isDarkMode={isDark}
                />
              </div>

              {/* 하단 실천 결단 & 목장/기도함 연동 바 */}
              <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                <input
                  type="text"
                  value={safeDay.sermonGraceLine || ''}
                  onChange={(e) => handleGraceLineSync(e.target.value)}
                  onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonGraceLine', safeDay.sermonGraceLine || '', handleGraceLineSync)}
                  placeholder="오늘 나에게 주신 한 줄 은혜 고백 및 감사 선포를 입력하세요"
                  className={`w-full px-3 py-2 rounded-lg border text-[13px] font-medium outline-none ${
                    isDark ? 'bg-[#161922] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'
                  }`}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={inlineActionSendToTracker}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    🎯 적용 트래커 등록
                  </button>
                  <button
                    type="button"
                    onClick={inlineActionSendToPrayer}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    🙏 나의 기도함 보관
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendDeclarationToCell(safeDay.sermonGraceLine || safeDay.sermonConviction)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    🌿 목장 감사나눔 전송
                  </button>
                  <button
                    type="button"
                    onClick={inlineActionSendToCounseling}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    💬 교역자 1:1 나눔 요청
                  </button>
                </div>
              </div>
            </div>

          </div>
        </CanvasEngine>
      )}

      {/* ===================================================================== */}
      {/* 📌 최소화된 팝업들을 우측 하단 작은 캡슐로 모아 보여주는 독 바 */}
      {/* ===================================================================== */}
      <div className="fixed bottom-4 right-4 z-[9999999] flex flex-wrap items-center gap-2 pointer-events-auto">
        {isOcrStudioOpen && minimizedModals.ocr && (
          <div className="px-3.5 py-2 rounded-full bg-amber-500 text-stone-950 font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20">
            <button onClick={() => setMinimizedModals(prev => ({ ...prev, ocr: false }))} className="cursor-pointer">
              📷 자막 OCR 스캔창 펼치기 ▲
            </button>
            <button onClick={() => setIsOcrStudioOpen(false)} className="px-1 text-stone-900 font-bold cursor-pointer">✕</button>
          </div>
        )}
        {isBibleFinderOpen && minimizedModals.finder && (
          <div className="px-3.5 py-2 rounded-full bg-sky-500 text-stone-950 font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20">
            <button onClick={() => setMinimizedModals(prev => ({ ...prev, finder: false }))} className="cursor-pointer">
              📖 개역개정4판 본문창 펼치기 ▲
            </button>
            <button onClick={() => setIsBibleFinderOpen(false)} className="px-1 text-stone-900 font-bold cursor-pointer">✕</button>
          </div>
        )}
        {inspectorTarget && minimizedModals.inspector && (
          <div className="px-3.5 py-2 rounded-full bg-indigo-600 text-white font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20">
            <button onClick={() => setMinimizedModals(prev => ({ ...prev, inspector: false }))} className="cursor-pointer">
              🔬 원어 강해 펼치기 ▲
            </button>
            <button onClick={() => setInspectorTarget(null)} className="px-1 text-white font-bold cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 8. 유튜브 자막·적용질문 스마트 OCR 스튜디오 모달 */}
      {/* ===================================================================== */}
      {isOcrStudioOpen && !minimizedModals.ocr && (
        <div
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsOcrStudioOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[86vh] overflow-hidden ${
              isDark ? 'bg-[#101522] border-white/15 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block">
                  YOUTUBE SUBTITLE & QUESTION SCANNER
                </span>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                  유튜브 설교 자막 · 적용질문 스캐너
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinimizedModals(prev => ({ ...prev, ocr: true }))}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  _ 화면 안 가리게 접기
                </button>
                <button
                  type="button"
                  onClick={() => setIsOcrStudioOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-500 text-xs font-bold cursor-pointer"
                >
                  닫기 ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-3.5 py-3.5 flex-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDirectTabCapture}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50' : 'bg-amber-50 hover:bg-amber-100 border-amber-300'
                  }`}
                >
                  <div className="text-xs font-black mb-0.5 text-amber-600 dark:text-amber-300">📷 1. 유튜브 영상 자막 캡처</div>
                  <div className="text-[10.5px] opacity-85">PC는 화면 자동 캡처 / 모바일·태블릿은 스크린샷 즉시 스캔</div>
                </button>

                <button
                  type="button"
                  onClick={handleReadClipboardImageForOcr}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 border-white/15' : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5">📋 2. 복사한 캡처 붙여넣기</div>
                  <div className="text-[10.5px] opacity-75">방금 찍은 스크린샷(클립보드)에서 자막만 추출합니다</div>
                </button>

                <button
                  type="button"
                  onClick={() => captureInputRef.current?.click()}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 border-white/15' : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5">🖼️ 3. 캡처 이미지 파일 열기</div>
                  <div className="text-[10.5px] opacity-75">갤러리에 저장된 유튜브 캡처 사진을 불러와 추출합니다</div>
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold block">스캔 영역 선택 (클릭 시 해당 위치만 다시 판독)</span>
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
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                        ocrCropPreset === key
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                          : isDark ? 'bg-white/5 border-white/10 text-stone-300' : 'bg-stone-100 border-stone-200 text-stone-700'
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
                    <span className="text-xs font-bold text-amber-500">
                      👆 아래 원본 화면에서 추출할 자막 부분만 손가락(또는 마우스)으로 드래그하세요!
                    </span>
                    {ocrLoadingId && (
                      <span className="text-xs font-mono font-bold text-emerald-400 animate-pulse">
                        자막 글자 판독 중...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      className="relative rounded-xl overflow-hidden border border-white/20 bg-black select-none touch-none flex items-center justify-center max-h-56"
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
                          className="absolute border-2 border-amber-400 bg-amber-400/25 pointer-events-none rounded"
                        />
                      )}
                    </div>

                    <div className="p-2 rounded-xl border border-white/15 bg-black flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] font-mono text-stone-400">도려낸 자막 영역</span>
                      <img
                        src={studioDraftItem.subtitleCropUrl || studioDraftItem.imageUrl}
                        alt="Cropped Subtitle"
                        className="max-h-44 w-auto object-contain rounded border border-amber-400/60"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  추출된 설교 자막 · 적용질문 텍스트 (자유롭게 수정 가능)
                </label>
                <textarea
                  rows={3}
                  value={studioDraftItem?.ocrText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudioDraftItem(prev => prev ? { ...prev, ocrText: val } : { id: `cap_${Date.now()}`, ocrText: val, timestamp: '직접입력' });
                  }}
                  placeholder="유튜브 영상에서 캡처된 자막이나 적용질문이 이곳에 표시됩니다."
                  className={`w-full p-3 rounded-2xl border text-[13px] leading-relaxed outline-none resize-none ${
                    isDark ? 'bg-[#0E1015] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
              {[
                { label: '적용질문 칸에 넣기', field: 'apply', primary: true },
                { label: '핵심요약', field: 'conviction' },
                { label: '제1대지', field: 'point1' },
                { label: '제2대지', field: 'point2' },
                { label: '제3대지', field: 'point3' },
                { label: '설교노트 본문', field: 'notes' }
              ].map((act) => (
                <button
                  key={act.field}
                  type="button"
                  onClick={() => {
                    handleDispatchOcrTextToField(act.field, studioDraftItem?.ocrText, studioDraftItem);
                    setIsOcrStudioOpen(false);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    act.primary
                      ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                      : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. [SaaS 멀티바이블 고도화] 내가 적은 구절만 딱 보여주는 개역개정 4판 말씀·예시 모달 */}
      {/* ===================================================================== */}
      {isBibleFinderOpen && !minimizedModals.finder && (
        <div
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBibleFinderOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[86vh] overflow-hidden ${
              isDark ? 'bg-[#121620] border-white/15 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold">📖 설교 본문 · 말씀 구절 뷰어</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-black border border-amber-500/30">
                  개역개정 4판 표준
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMinimizedModals(prev => ({ ...prev, finder: true }))}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  _ 접기
                </button>
                <button
                  onClick={() => setIsBibleFinderOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-500 text-xs font-bold cursor-pointer"
                >
                  닫기 ✕
                </button>
              </div>
            </div>

            {/* 상단 모드 탭 & 역본 대조 토글 */}
            <div className="flex items-center justify-between gap-2 my-3 flex-wrap">
              <div className="flex gap-1.5 flex-1">
                <button
                  onClick={() => setFinderMode('ref')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer ${finderMode === 'ref' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-100 dark:bg-white/5 text-stone-500'}`}
                >
                  구절 주소로 보기
                </button>
                <button
                  onClick={() => setFinderMode('keyword')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer ${finderMode === 'keyword' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-100 dark:bg-white/5 text-stone-500'}`}
                >
                  단어·키워드로 검색
                </button>
              </div>

              {finderMode === 'ref' && (
                <div className="flex p-0.5 rounded-lg border border-stone-200 dark:border-white/10 text-[11px] font-bold">
                  <button
                    onClick={() => setFinderVersionMode('krv4')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${finderVersionMode === 'krv4' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400'}`}
                  >
                    개역개정4판
                  </button>
                  <button
                    onClick={() => setFinderVersionMode('parallel')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${finderVersionMode === 'parallel' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400'}`}
                  >
                    3역본 동시대조
                  </button>
                </div>
              )}
            </div>

            {finderMode === 'ref' ? (
              <div className="space-y-3 overflow-y-auto hide-scrollbar flex-1">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={finderRefInput}
                    onChange={(e) => {
                      setFinderRefInput(e.target.value);
                      setShowFullChapterInFinder(false);
                    }}
                    placeholder="설교 본문 구절을 입력하세요 (예: 창 1:1, 요 3:16, 롬 8:28-30)"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold outline-none ${isDark ? 'bg-[#0E1015] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`}
                  />
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`개역개정 4판 ${finderRefInput || activeReferenceStr || '성경'} 낭독`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-black flex items-center gap-1 shrink-0"
                  >
                    <span>🎬 유튜브 듣기</span> <IconExternal/>
                  </a>
                </div>

                {/* 내가 적은 절만 깔끔하게 표시 + 전체 복사/일괄 삽입/전후 문맥 토글 컨트롤 바 */}
                {finderScriptureData.parsed && (
                  <div className={`px-3 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                    isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-500">
                        📌 {finderScriptureData.parsed.displayLabel}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        ({displayedFinderVerses.length}개 구절 표시 중)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {finderScriptureData.parsed.hasSpecificVerse && (
                        <button
                          type="button"
                          onClick={() => setShowFullChapterInFinder(prev => !prev)}
                          className={`px-2 py-1 rounded text-[10.5px] font-bold border cursor-pointer ${
                            showFullChapterInFinder
                              ? 'bg-sky-500 text-stone-950 border-sky-500'
                              : isDark ? 'bg-white/5 border-white/15 text-stone-300' : 'bg-white border-stone-200 text-stone-700'
                          }`}
                        >
                          {showFullChapterInFinder ? '선택 구절만 보기' : `${finderScriptureData.parsed.chapter}장 전체 문맥 보기`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const combined = displayedFinderVerses.map(v => `${v.vNum}. ${v.text}`).join('\n');
                          handleInsertVerseToSermonNotes(finderScriptureData.parsed.displayLabel, combined);
                          setIsBibleFinderOpen(false);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500 text-stone-950 text-[10.5px] font-black cursor-pointer"
                      >
                        + 표시된 구절 전체 필기장 삽입
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 hide-scrollbar text-left">
                  {displayedFinderVerses.length === 0 ? (
                    <div className="py-10 text-center text-xs text-stone-400">
                      위에 성경 구절 주소(예: <b>창 1:1</b>, <b>요 3:16</b>, <b>시 23:1-6</b>)를 입력하시면 내가 적은 구절만 즉시 나타납니다.
                    </div>
                  ) : (
                    displayedFinderVerses.map((v) => {
                      const koBook = finderScriptureData.parsed?.bookKo || '';
                      const chNum = finderScriptureData.parsed?.chapter || 1;
                      const easyText = easyBibleDb[`${koBook}-${chNum}-${v.vNum}`] || '';
                      const webText = webBibleDb[`${koBook}-${chNum}-${v.vNum}`] || webBibleDb[`${finderScriptureData.parsed?.bookEn}-${chNum}-${v.vNum}`] || '';

                      return (
                        <div
                          key={v.vNum}
                          onClick={() => handleInsertVerseToSermonNotes(`${koBook} ${chNum}:${v.vNum}`, v.text)}
                          className={`p-3 rounded-xl border text-xs font-serif leading-relaxed cursor-pointer transition-colors ${
                            v.isHighlight
                              ? isDark ? 'bg-amber-500/15 border-amber-500/40 text-amber-100' : 'bg-amber-50/90 border-amber-300 text-stone-900'
                              : isDark ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {v.pericope && (
                            <div className="mb-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-sans font-extrabold text-[11px] inline-block">
                              📌 {v.pericope}
                            </div>
                          )}
                          <div className="text-[13.5px]">
                            <b className="mr-1.5 font-mono text-amber-500">{v.vNum}</b>
                            {v.text}
                            <span className="ml-2 text-[10px] font-sans font-bold text-sky-500">[+ 클릭 시 필기장 삽입]</span>
                          </div>

                          {finderVersionMode === 'parallel' && (
                            <div className="mt-2 pt-2 border-t border-dashed border-stone-300 dark:border-white/15 space-y-1">
                              {easyText && (
                                <p className="text-[12px] font-sans text-emerald-700 dark:text-emerald-300">
                                  <b>[쉬운]</b> {easyText}
                                </p>
                              )}
                              {webText && (
                                <p className="text-[12px] font-serif text-sky-700 dark:text-sky-300">
                                  <b>[WEB]</b> {webText}
                                </p>
                              )}
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
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={finderKeyword}
                    onChange={(e) => setFinderKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setFinderKeywordResults(searchBibleByKeyword(finderKeyword, 45, krv4TxtDb));
                    }}
                    placeholder="찾을 성경 단어 입력 (예: 태초, 언약, 사랑, 기도, 은혜)"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold outline-none ${isDark ? 'bg-[#0E1015] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`}
                  />
                  <button
                    onClick={() => setFinderKeywordResults(searchBibleByKeyword(finderKeyword, 45, krv4TxtDb))}
                    className="px-3.5 py-2 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
                  >
                    검색
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 hide-scrollbar text-left">
                  {finderKeywordResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleInsertVerseToSermonNotes(res.ref, res.text)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'}`}
                    >
                      <div className="font-bold text-amber-500 mb-0.5">
                        {res.ref} <span className="text-[10px] text-emerald-500 ml-1">[개역개정4판]</span>
                        {res.pericope && <span className="ml-1.5 text-[10.5px] text-amber-400">📌 &lt;{res.pericope}&gt;</span>}
                        <span className="text-[10px] text-sky-500 ml-1.5">[+ 필기장 삽입]</span>
                      </div>
                      <p className="font-serif leading-relaxed">{res.text}</p>
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
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
              isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-mono font-bold text-amber-500">
                {inspectorTarget.book} {inspectorTarget.chapter}:{inspectorTarget.verse} 원어 강해 (개역개정 4판 기준)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleJumpToInterlinearStudio}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  원어 스튜디오 이동
                </button>
                <button
                  onClick={() => setMinimizedModals(prev => ({ ...prev, inspector: true }))}
                  className="px-2.5 py-1 rounded bg-stone-200 dark:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  _ 접기
                </button>
                <button
                  onClick={() => setInspectorTarget(null)}
                  className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-500 text-xs font-bold cursor-pointer"
                >
                  닫기 ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-3 py-3 flex-1 text-left">
              {inspectorTarget.pericope && (
                <div className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 text-xs font-bold inline-block">
                  📌 {inspectorTarget.pericope}
                </div>
              )}
              <p className="text-xs font-serif leading-relaxed">
                <span className="text-[10px] font-sans font-bold text-amber-500 mr-1.5">[개역개정4판]</span>
                {inspectorTarget.text}
              </p>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141A26] border-slate-700' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-bold text-stone-400 block mb-1.5">원어 어절 선택</span>
                {isInspectorLoading ? (
                  <div className="py-3 text-center text-xs text-stone-400">원어 형태소 로딩 중...</div>
                ) : (
                  <div className="flex flex-wrap gap-2 items-baseline">
                    {inspectorWords.map((w) => (
                      <span
                        key={w.id}
                        onClick={() => handleSelectInspectorWord(w)}
                        style={originalFontStyle(inspectorTarget.isOT)}
                        className={`text-lg font-bold px-2 py-0.5 rounded cursor-pointer ${
                          selectedWordDetail?.order === w.order ? 'bg-amber-500 text-stone-950' : 'hover:bg-white/10'
                        }`}
                      >
                        {cleanTypography(w.inflected, inspectorTarget.isOT)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedWordDetail && (
                <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-stone-50 border-stone-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-500">{selectedWordDetail.strongs} · {selectedWordDetail.pron}</span>
                    <span className="text-[11px] text-stone-400">{selectedWordDetail.grammarDecoded}</span>
                  </div>
                  <div className="font-bold">문맥 뜻: {selectedWordDetail.korContextual} (원형: {selectedWordDetail.lemma})</div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleInsertWordToSermonNote(selectedWordDetail)}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                    >
                      설교 필기장에 원어 강해 삽입
                    </button>
                    <button
                      onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      className="px-3 py-2 rounded-lg bg-stone-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                    >
                      🔊 발음
                    </button>
                  </div>
                </div>
              )}

              {currentHebrewSyntax && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1">
                  <span className="font-bold block">📜 히브리어 구문론 분석</span>
                  <p className="leading-relaxed">{currentHebrewSyntax.summary}</p>
                </div>
              )}

              {currentCommentary && (
                <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs space-y-1">
                  <span className="font-bold block">📖 학술 주석 ({currentCommentary.commentator})</span>
                  <p className="font-serif leading-relaxed">{decodeHtmlEntities(currentCommentary.exegesis)}</p>
                </div>
              )}

              {currentMatthewHenry && (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1">
                  <span className="font-bold block">🌿 매튜 헨리 강해</span>
                  <p className="font-serif leading-relaxed">{decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}</p>
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
            onClose={function () { setIsArcModalOpen(false); }}
            initialViewMode={arcModalInitialMode}
            focusReference={activeReferenceStr}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 12. 전체화면 라이브 시네마 워크스테이션 모달 */}
      {/* ===================================================================== */}
      {isLiveCinemaMode && (
        <div className="fixed inset-0 z-[99998] bg-[#06080D] text-white flex flex-col lg:flex-row overflow-hidden animate-fade-in">
          <div className="flex-1 flex flex-col relative bg-black min-h-[38vh]">
            <div className="px-3 sm:px-4 py-2 bg-[#0C0F17] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-black shrink-0">
                  WORKSTATION
                </span>
                <span className="text-xs sm:text-sm font-bold truncate">
                  {safeDay.sermonTitle || '예배 설교 전체화면 워크스테이션'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleDirectTabCapture}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black cursor-pointer"
                >
                  📷 영상 자막 즉시캡처
                </button>
                <button
                  type="button"
                  onClick={handleToggleOcrStudioModal}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    isOcrStudioOpen ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-amber-300'
                  }`}
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
                      setMinimizedModals(prev => ({ ...prev, finder: false }));
                      setIsBibleFinderOpen(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    isBibleFinderOpen ? 'bg-sky-500 text-stone-950' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  📖 개역개정4판 찾기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectorTarget) setInspectorTarget(null);
                    else openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    inspectorTarget ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  🔬 원어강해
                </button>
                <button
                  type="button"
                  onClick={() => setIsArcModalOpen(!isArcModalOpen)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    isArcModalOpen ? 'bg-emerald-500 text-stone-950' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  🌈 신구약아크
                </button>
                <button
                  type="button"
                  onClick={() => setIsCinemaUiHidden(!isCinemaUiHidden)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                >
                  {isCinemaUiHidden ? '필기창 열기' : '영상만 보기'}
                </button>
                <button
                  type="button"
                  onClick={exitLiveCinemaFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  종료 ✕
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
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                  등록된 유튜브 설교 영상이 없습니다.
                </div>
              )}
            </div>
          </div>

          {!isCinemaUiHidden && (
            <div className="w-full lg:w-[440px] h-[54vh] lg:h-full bg-[#0E121B] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0">
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-1">
                {[
                  { id: 'outline', label: '3대지·요약' },
                  { id: 'apply', label: '적용질문' },
                  { id: 'notes', label: '설교노트' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCinemaHudTab(tab.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      cinemaHudTab === tab.id ? 'bg-white text-stone-950' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar text-left">
                {cinemaHudTab === 'outline' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 block mb-1">설교 본문 구절 (개역개정4판·원어·아크 연동)</label>
                      <input
                        type="text"
                        value={safeDay.sermonReference || ''}
                        onChange={(e) => {
                          setCustomRefQuery(e.target.value);
                          updateDay && updateDay({ sermonReference: e.target.value });
                        }}
                        placeholder="예: 고전 7:29-40 또는 벧전 3:7"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 block mb-1">핵심 한 문장 요약</label>
                      <input
                        type="text"
                        value={safeDay.sermonConviction || ''}
                        onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                        onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, 'sermonConviction', safeDay.sermonConviction || '')}
                        placeholder="핵심 요약 문장 입력 ('창1:1' + 스페이스바 자동완성)"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white outline-none"
                      />
                    </div>
                    {[
                      { key: 'sermonPoint1', label: '제1대지' },
                      { key: 'sermonPoint2', label: '제2대지' },
                      { key: 'sermonPoint3', label: '제3대지' }
                    ].map((pt) => (
                      <div key={pt.key}>
                        <label className="text-[11px] font-bold text-stone-300 block mb-1">{pt.label}</label>
                        <textarea
                          rows={2}
                          value={safeDay[pt.key] || ''}
                          onChange={(e) => updateDay && updateDay({ [pt.key]: e.target.value })}
                          onKeyDown={(e) => handleSpacebarVerseAutoCompleteOnInput(e, pt.key, safeDay[pt.key] || '')}
                          className="w-full p-2.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {cinemaHudTab === 'apply' && (
                  <div className="space-y-2.5">
                    {((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || ['']).map((qText, qIdx) => (
                      <div key={qIdx} className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                        <input
                          type="text"
                          value={qText || ''}
                          onChange={(e) => {
                            const nextQ = [...((getArr ? getArr(safeDay.applyQuestions) : safeDay.applyQuestions) || [''])];
                            nextQ[qIdx] = e.target.value;
                            updateDay && updateDay({ applyQuestions: nextQ });
                          }}
                          placeholder={`적용질문 Q${qIdx + 1}`}
                          className="w-full bg-transparent text-xs font-bold text-amber-300 outline-none"
                        />
                        <textarea
                          rows={2}
                          value={(safeDay.applyAnswers && safeDay.applyAnswers[qIdx]) || ''}
                          onChange={(e) => {
                            const nextA = { ...(safeDay.applyAnswers || {}), [qIdx]: e.target.value };
                            updateDay && updateDay({ applyAnswers: nextA });
                          }}
                          placeholder="나의 적용과 실천 결단 입력"
                          className="w-full p-2 rounded bg-black/60 border border-white/10 text-xs text-white outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {cinemaHudTab === 'notes' && (
                  <div
                    onKeyDownCapture={handleEditorContainerKeyDown}
                    className="h-full min-h-[260px] rounded-xl overflow-hidden border border-white/15"
                  >
                    <RichTextEditor
                      value={safeDay.sermonNotes || ''}
                      onChange={handleRichTextChange}
                      placeholder="영상을 보며 자유롭게 필기하세요... ('창1:1' + 스페이스바 자동완성 지원)"
                      isDarkMode={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 13. 월별 특별집회(기상고기) 유튜브 링크 설정 모달 */}
      {/* ===================================================================== */}
      {showMonthlyModal && (
        <div
          className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMonthlyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 text-left ${
              isDark ? 'bg-[#121620] border-white/15 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
              <span className="text-sm font-bold">📅 월별 특별집회 유튜브 링크 관리</span>
              <button onClick={() => setShowMonthlyModal(false)} className="text-xs font-bold text-stone-400 cursor-pointer">
                닫기 ✕
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mNum) => (
                <div key={mNum} className="flex items-center gap-2">
                  <span className="w-12 text-xs font-bold shrink-0">{mNum}월</span>
                  <input
                    type="text"
                    value={monthlyGisanUrls[mNum] || ''}
                    onChange={(e) => {
                      const next = { ...monthlyGisanUrls, [mNum]: e.target.value.trim() };
                      setMonthlyGisanUrls(next);
                      localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(next));
                    }}
                    placeholder={`${mNum}월 특별집회 유튜브 URL`}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#0E1015] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                showToast('월별 특별집회 링크가 저장되었습니다.');
                setShowMonthlyModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
            >
              저장 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
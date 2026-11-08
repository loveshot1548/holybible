// src/components/Sermon.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import { BibleGalaxyArcModal, BIBLE_66_CANON, extractBibleRefInfo } from '../pages/BibleKnowledgeGalaxy';
import bibleData from '../ko_ko.json';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 암호화 (구버전 Base64 호환)
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

// 💡 [옵시디언형 지식 그래프] 성경 구절 정밀 정규식 추출기
const extractBibleReferences = (text) => {
  if (!text) return [];
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)];
  return Array.from(new Set(matches.map(m => m[0].trim())));
};

// =====================================================================
// 📜 [맥체인 10대 학술 원어 강해 엔진 동일 이식]
// =====================================================================
const BIBLE_66_MAP = {
  "Genesis": { ko: "창세기", isOT: true, section: "모세오경" }, "창세기": { ko: "창세기", isOT: true, section: "모세오경" },
  "Exodus": { ko: "출애굽기", isOT: true, section: "모세오경" }, "출애굽기": { ko: "출애굽기", isOT: true, section: "모세오경" },
  "Leviticus": { ko: "레위기", isOT: true, section: "모세오경" }, "레위기": { ko: "레위기", isOT: true, section: "모세오경" },
  "Numbers": { ko: "민수기", isOT: true, section: "모세오경" }, "민수기": { ko: "민수기", isOT: true, section: "모세오경" },
  "Deuteronomy": { ko: "신명기", isOT: true, section: "모세오경" }, "신명기": { ko: "신명기", isOT: true, section: "모세오경" },
  "Joshua": { ko: "여호수아", isOT: true, section: "역사서" }, "여호수아": { ko: "여호수아", isOT: true, section: "역사서" },
  "Judges": { ko: "사사기", isOT: true, section: "역사서" }, "사사기": { ko: "사사기", isOT: true, section: "역사서" },
  "Ruth": { ko: "룻기", isOT: true, section: "역사서" }, "룻기": { ko: "룻기", isOT: true, section: "역사서" },
  "1 Samuel": { ko: "사무엘상", isOT: true, section: "역사서" }, "사무엘상": { ko: "사무엘상", isOT: true, section: "역사서" },
  "2 Samuel": { ko: "사무엘하", isOT: true, section: "역사서" }, "사무엘하": { ko: "사무엘하", isOT: true, section: "역사서" },
  "1 Kings": { ko: "열왕기상", isOT: true, section: "역사서" }, "열왕기상": { ko: "열왕기상", isOT: true, section: "역사서" },
  "2 Kings": { ko: "열왕기하", isOT: true, section: "역사서" }, "열왕기하": { ko: "열왕기하", isOT: true, section: "역사서" },
  "1 Chronicles": { ko: "역대상", isOT: true, section: "역사서" }, "역대상": { ko: "역대상", isOT: true, section: "역사서" },
  "2 Chronicles": { ko: "역대하", isOT: true, section: "역사서" }, "역대하": { ko: "역대하", isOT: true, section: "역사서" },
  "Ezra": { ko: "에스라", isOT: true, section: "역사서" }, "에스라": { ko: "에스라", isOT: true, section: "역사서" },
  "Nehemiah": { ko: "느헤미야", isOT: true, section: "역사서" }, "느헤미야": { ko: "느헤미야", isOT: true, section: "역사서" },
  "Esther": { ko: "에스더", isOT: true, section: "역사서" }, "에스더": { ko: "에스더", isOT: true, section: "역사서" },
  "Job": { ko: "욥기", isOT: true, section: "시가서" }, "욥기": { ko: "욥기", isOT: true, section: "시가서" },
  "Psalms": { ko: "시편", isOT: true, section: "시가서" }, "시편": { ko: "시편", isOT: true, section: "시가서" },
  "Proverbs": { ko: "잠언", isOT: true, section: "시가서" }, "잠언": { ko: "잠언", isOT: true, section: "시가서" },
  "Ecclesiastes": { ko: "전도서", isOT: true, section: "시가서" }, "전도서": { ko: "전도서", isOT: true, section: "시가서" },
  "Song of Solomon": { ko: "아가", isOT: true, section: "시가서" }, "아가": { ko: "아가", isOT: true, section: "시가서" },
  "Isaiah": { ko: "이사야", isOT: true, section: "선지서" }, "이사야": { ko: "이사야", isOT: true, section: "선지서" },
  "Jeremiah": { ko: "예레미야", isOT: true, section: "선지서" }, "예레미야": { ko: "예레미야", isOT: true, section: "선지서" },
  "Lamentations": { ko: "예레미야애가", isOT: true, section: "선지서" }, "예레미야애가": { ko: "예레미야애가", isOT: true, section: "선지서" },
  "Ezekiel": { ko: "에스겔", isOT: true, section: "선지서" }, "에스겔": { ko: "에스겔", isOT: true, section: "선지서" },
  "Daniel": { ko: "다니엘", isOT: true, section: "선지서" }, "다니엘": { ko: "다니엘", isOT: true, section: "선지서" },
  "Hosea": { ko: "호세아", isOT: true, section: "선지서" }, "호세아": { ko: "호세아", isOT: true, section: "선지서" },
  "Joel": { ko: "요엘", isOT: true, section: "선지서" }, "요엘": { ko: "요엘", isOT: true, section: "선지서" },
  "Amos": { ko: "아모스", isOT: true, section: "선지서" }, "아모스": { ko: "아모스", isOT: true, section: "선지서" },
  "Obadiah": { ko: "오바댜", isOT: true, section: "선지서" }, "오바댜": { ko: "오바댜", isOT: true, section: "선지서" },
  "Jonah": { ko: "요나", isOT: true, section: "선지서" }, "요나": { ko: "요나", isOT: true, section: "선지서" },
  "Micah": { ko: "미가", isOT: true, section: "선지서" }, "미가": { ko: "미가", isOT: true, section: "선지서" },
  "Nahum": { ko: "나훔", isOT: true, section: "선지서" }, "나훔": { ko: "나훔", isOT: true, section: "선지서" },
  "Habakkuk": { ko: "하박국", isOT: true, section: "선지서" }, "하박국": { ko: "하박국", isOT: true, section: "선지서" },
  "Zephaniah": { ko: "스바냐", isOT: true, section: "선지서" }, "스바냐": { ko: "스바냐", isOT: true, section: "선지서" },
  "Haggai": { ko: "학개", isOT: true, section: "선지서" }, "학개": { ko: "학개", isOT: true, section: "선지서" },
  "Zechariah": { ko: "스가랴", isOT: true, section: "선지서" }, "스가랴": { ko: "스가랴", isOT: true, section: "선지서" },
  "Malachi": { ko: "말라기", isOT: true, section: "선지서" }, "말라기": { ko: "말라기", isOT: true, section: "선지서" },
  "Matthew": { ko: "마태복음", isOT: false, section: "복음/역사" }, "마태복음": { ko: "마태복음", isOT: false, section: "복음/역사" },
  "Mark": { ko: "마가복음", isOT: false, section: "복음/역사" }, "마가복음": { ko: "마가복음", isOT: false, section: "복음/역사" },
  "Luke": { ko: "누가복음", isOT: false, section: "복음/역사" }, "누가복음": { ko: "누가복음", isOT: false, section: "복음/역사" },
  "John": { ko: "요한복음", isOT: false, section: "복음/역사" }, "요한복음": { ko: "요한복음", isOT: false, section: "복음/역사" },
  "Acts": { ko: "사도행전", isOT: false, section: "복음/역사" }, "사도행전": { ko: "사도행전", isOT: false, section: "복음/역사" },
  "Romans": { ko: "로마서", isOT: false, section: "서신서" }, "로마서": { ko: "로마서", isOT: false, section: "서신서" },
  "1 Corinthians": { ko: "고린도전서", isOT: false, section: "서신서" }, "고린도전서": { ko: "고린도전서", isOT: false, section: "서신서" },
  "2 Corinthians": { ko: "고린도후서", isOT: false, section: "서신서" }, "고린도후서": { ko: "고린도후서", isOT: false, section: "서신서" },
  "Galatians": { ko: "갈라디아서", isOT: false, section: "서신서" }, "갈라디아서": { ko: "갈라디아서", isOT: false, section: "서신서" },
  "Ephesians": { ko: "에베소서", isOT: false, section: "서신서" }, "에베소서": { ko: "에베소서", isOT: false, section: "서신서" },
  "Philippians": { ko: "빌립보서", isOT: false, section: "서신서" }, "빌립보서": { ko: "빌립보서", isOT: false, section: "서신서" },
  "Colossians": { ko: "골로새서", isOT: false, section: "서신서" }, "골로새서": { ko: "골로새서", isOT: false, section: "서신서" },
  "1 Thessalonians": { ko: "데살로니가전서", isOT: false, section: "서신서" }, "데살로니가전서": { ko: "데살로니가전서", isOT: false, section: "서신서" },
  "2 Thessalonians": { ko: "데살로니가후서", isOT: false, section: "서신서" }, "데살로니가후서": { ko: "데살로니가후서", isOT: false, section: "서신서" },
  "1 Timothy": { ko: "디모데전서", isOT: false, section: "서신서" }, "디모데전서": { ko: "디모데전서", isOT: false, section: "서신서" },
  "2 Timothy": { ko: "디모데후서", isOT: false, section: "서신서" }, "디모데후서": { ko: "디모데후서", isOT: false, section: "서신서" },
  "Titus": { ko: "디도서", isOT: false, section: "서신서" }, "디도서": { ko: "디도서", isOT: false, section: "서신서" },
  "Philemon": { ko: "빌레몬서", isOT: false, section: "서신서" }, "빌레몬서": { ko: "빌레몬서", isOT: false, section: "서신서" },
  "Hebrews": { ko: "히브리서", isOT: false, section: "서신서" }, "히브리서": { ko: "히브리서", isOT: false, section: "서신서" },
  "James": { ko: "야고보서", isOT: false, section: "서신서" }, "야고보서": { ko: "야고보서", isOT: false, section: "서신서" },
  "1 Peter": { ko: "베드로전서", isOT: false, section: "서신서" }, "베드로전서": { ko: "베드로전서", isOT: false, section: "서신서" },
  "2 Peter": { ko: "베드로후서", isOT: false, section: "서신서" }, "베드로후서": { ko: "베드로후서", isOT: false, section: "서신서" },
  "1 John": { ko: "요한일서", isOT: false, section: "서신서" }, "요한일서": { ko: "요한일서", isOT: false, section: "서신서" },
  "2 John": { ko: "요한이서", isOT: false, section: "서신서" }, "요한이서": { ko: "요한이서", isOT: false, section: "서신서" },
  "3 John": { ko: "요한삼서", isOT: false, section: "서신서" }, "요한삼서": { ko: "요한삼서", isOT: false, section: "서신서" },
  "Jude": { ko: "유다서", isOT: false, section: "서신서" }, "유다서": { ko: "유다서", isOT: false, section: "서신서" },
  "Revelation": { ko: "요한계시록", isOT: false, section: "서신서" }, "요한계시록": { ko: "요한계시록", isOT: false, section: "서신서" }
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
    const clean = isOT ? (text || '').replace(/[\u0591-\u05AF]/g, '') : (text || '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = isOT ? 'he-IL' : 'el-GR';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

// 📖 내장 성경 DB(ko_ko.json)에서 설교 본문 구절들을 즉시 추출하는 헬퍼
const getLocalScriptureVerses = (refString) => {
  if (!refString) return { parsed: null, verses: [] };
  const info = extractBibleRefInfo(refString);
  if (!info) return { parsed: null, verses: [] };

  const canonMeta = BIBLE_66_CANON.find(b => b.ko === info.bookKo);
  if (!canonMeta) return { parsed: info, verses: [] };

  const rawBook = (Array.isArray(bibleData) ? bibleData : []).find(
    b => b.name === canonMeta.en || b.name === canonMeta.ko
  );
  const chapArr = rawBook?.chapters?.[Math.max(0, (info.chapter || 1) - 1)] || [];

  const rangeMatch = String(refString).match(/:\s*(\d+)\s*[-~]\s*(\d+)/);
  const startV = rangeMatch ? parseInt(rangeMatch[1], 10) : (info.verse || 1);
  const endV = rangeMatch ? parseInt(rangeMatch[2], 10) : Math.min(chapArr.length, startV + 6);

  const verses = chapArr.map((txt, idx) => ({
    vNum: idx + 1,
    text: String(txt).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim(),
    isHighlight: idx + 1 >= startV && idx + 1 <= endV
  }));

  return {
    parsed: { ...info, bookEn: canonMeta.en, startV, endV },
    verses
  };
};

// 🔍 성경 66권 키워드(단어) 본문 검색 엔진 (예시 말씀 찾기용)
const searchBibleByKeyword = (keyword, maxResults = 40) => {
  const kw = (keyword || '').trim();
  if (!kw || kw.length < 2) return [];
  const results = [];
  const books = Array.isArray(bibleData) ? bibleData : [];

  for (let bIdx = 0; bIdx < books.length; bIdx++) {
    const bookObj = books[bIdx];
    const canon = BIBLE_66_CANON.find(c => c.en === bookObj.name || c.ko === bookObj.name);
    const koBook = canon ? canon.ko : bookObj.name;
    const chaps = bookObj.chapters || [];

    for (let cIdx = 0; cIdx < chaps.length; cIdx++) {
      const verses = chaps[cIdx] || [];
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const cleanV = String(verses[vIdx]).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
        if (cleanV.includes(kw)) {
          results.push({
            ref: `${koBook} ${cIdx + 1}:${vIdx + 1}`,
            bookKo: koBook,
            chapter: cIdx + 1,
            verse: vIdx + 1,
            text: cleanV
          });
          if (results.length >= maxResults) return results;
        }
      }
    }
  }
  return results;
};

// =====================================================================
// 🔍 [초고도화 OCR] 2.5배 업스케일링 + 적응형 흑백 이진화(Binarization) 전처리 엔진
// (유튜브 하단 자막 박스의 배경 노이즈를 제거하고 한글 인식률을 극대화합니다!)
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

// =====================================================================
// 🔍 [초고도화 OCR v2] 사이드바/하단 독(Dock) UI 자동 배제 + 소프트 그레이스케일 보정
// (글자 깨짐을 유발하던 강제 흑백 이진화를 제거하여 괄호 영문·한글 조사 인식률 극대화!)
// =====================================================================
const createHighAccuracyOcrImage = (sourceCanvas, cropMode = 'question_box') => {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  // 1) 좌우 사이드바 아이콘(14%) 및 최하단 독 바/유튜브 재생바(14%)를 완전히 피해서 중앙 자막 박스만 정밀 크롭!
  let cropX = Math.floor(sw * 0.14);
  let cropW = Math.floor(sw * 0.72);
  let cropY = Math.floor(sh * 0.50);
  let cropH = Math.floor(sh * 0.36);

  if (cropMode === 'subtitle_bottom') {
    cropX = Math.floor(sw * 0.15);
    cropW = Math.floor(sw * 0.70);
    cropY = Math.floor(sh * 0.62);
    cropH = Math.floor(sh * 0.24);
  } else if (cropMode === 'full') {
    cropX = Math.floor(sw * 0.08);
    cropW = Math.floor(sw * 0.84);
    cropY = Math.floor(sh * 0.12);
    cropH = Math.floor(sh * 0.74);
  }

  // 2) 글자 획이 뭉개지지 않도록 부드러운 2.0배 고화질 업스케일링
  const scale = 2.0;
  const outW = Math.max(400, Math.floor(cropW * scale));
  const outH = Math.max(150, Math.floor(cropH * scale));

  const procCanvas = document.createElement('canvas');
  procCanvas.width = outW;
  procCanvas.height = outH;
  const ctx = procCanvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  // 3) 강제 이진화(0/255) 대신 부드러운 그레이스케일 색반전(Soft Grayscale Inversion) 적용!
  // -> 얇은 영문 괄호 (happen)나 '피', '를'의 자소 간격이 뭉개지지 않고 원래 폰트 모양 그대로 보존됨
  const imgData = ctx.getImageData(0, 0, outW, outH);
  const data = imgData.data;

  let totalLum = 0;
  const pixelCount = outW * outH;
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgLum = totalLum / pixelCount;
  const isDarkBg = avgLum < 140; // 어두운 자막 박스 위 흰 글씨인지 판별

  for (let i = 0; i < data.length; i += 4) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // 어두운 배경 위 흰 글씨면 부드럽게 반전시켜 '흰 종이 위 검은 글씨'로 변환
    if (isDarkBg) {
      lum = 255 - lum;
    }

    // 글자 획의 부드러운 경계(Anti-aliasing)는 살리면서 배경 노이즈만 살짝 날리는 소프트 대비 보정
    let contrasted = (lum - 128) * 1.45 + 128;
    if (contrasted > 220) contrasted = 255; // 밝은 회색 배경은 깨끗한 순백색으로 정리
    if (contrasted < 45) contrasted = 0;    // 진한 글씨는 선명한 검은색으로 정리

    const finalVal = Math.max(0, Math.min(255, Math.round(contrasted)));
    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  return {
    preprocessedDataUrl: procCanvas.toDataURL('image/png'),
    croppedPreviewUrl: (() => {
      const prevC = document.createElement('canvas');
      prevC.width = cropW;
      prevC.height = cropH;
      prevC.getContext('2d').drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return prevC.toDataURL('image/jpeg', 0.92);
    })()
  };
};

// OCR 결과에서 테두리선 오인식 숫자열(92202000 등)과 기호 파편을 깔끔하게 제거하는 정밀 클리너
const cleanKoreanOcrText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map(line =>
      line
        .replace(/[|¦_~`^\\/<>{}[\]§¶©®™;]/g, ' ')
        .replace(/\b\d{5,}\b/g, '') // 자막 박스 테두리선을 읽은 긴 외계어 숫자열(예: 92202000) 자동 삭제!
        .replace(/^[-—=+\s]+/, '')  // 줄 맨 앞의 깨진 기호(- ole 등) 제거
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(line => {
      if (line.length < 2) return false;
      // 한글이 최소 1글자 이상 들어있거나, 3글자 이상의 정상 영단어가 있는 줄만 남김 ('- ole' 같은 파편 줄 자동 제거)
      const hasKorean = /[가-힣]/.test(line);
      const hasValidWord = /[a-zA-Z]{4,}/.test(line);
      return hasKorean || hasValidWord;
    })
    .join('\n');
};

const StrokeWidth = "1.8";
const IconArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 9l5 3-5 3V9z" /></svg>;
const IconShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconMic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const IconPen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const IconHeart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconDocument = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconTool = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconChevronDown = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}><polyline points="6 9 12 15 18 9" /></svg>;
const IconMaximize = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>;
const IconCamera = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;

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
  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const sermonRecRef = useRef(null);
  const rootSermonFullscreenRef = useRef(null);
  const captureInputRef = useRef(null);

  const [isSanctuaryMode, setIsSanctuaryMode] = useState(() => {
    return localStorage.getItem('sermon_sanctuary_mode') === 'true';
  });

  const [showOutlineBuilder, setShowOutlineBuilder] = useState(true);
  const [actionToast, setActionToast] = useState(null);
  const [linkedRefs, setLinkedRefs] = useState([]);
  const [activeBacklink, setActiveBacklink] = useState(null);

  // =====================================================================
  // 📺 [초고도화 1] 라이브 시네마 전체화면 HUD & 맥체인형 10대 학술 원어 강해 상태
  // =====================================================================
  const [isLiveCinemaMode, setIsLiveCinemaMode] = useState(false);
  const [cinemaHudTab, setCinemaHudTab] = useState('outline'); // 'scripture' | 'finder' | 'memo' | 'outline' | 'captures' | 'thanks' | null
  const [isCinemaUiHidden, setIsCinemaUiHidden] = useState(false);
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcModalInitialMode, setArcModalInitialMode] = useState('arc');
  const [selectedWordVerse, setSelectedWordVerse] = useState(1);
  const [customRefQuery, setCustomRefQuery] = useState('');

  // 📖 [초고도화 3] 성경말씀 & 예시구절 멀티 검색 팝업 상태 (본문 + 인용구절 + 단어 검색)
  const [isBibleFinderOpen, setIsBibleFinderOpen] = useState(false);
  const [finderMode, setFinderMode] = useState('ref'); // 'ref'(구절/성경선택) | 'keyword'(단어검색)
  const [finderRefInput, setFinderRefInput] = useState('로마서 8:28-30');
  const [finderBookKo, setFinderBookKo] = useState('로마서');
  const [finderChapter, setFinderChapter] = useState(8);
  const [finderKeyword, setFinderKeyword] = useState('');
  const [finderKeywordResults, setFinderKeywordResults] = useState([]);

  // 🏛️ 맥체인(Mcheyne.js) 동일 10대 학술 원어 강해 인스펙터 모달 상태
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
  // 📸 [초고도화 2] 유튜브 예배 영상 화면 캡처 & 고정밀 OCR 자막 추출 상태
  // =====================================================================
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
  // OCR 크롭 프리셋: 'subtitle_bottom'(하단 자막바 30%) | 'question_box'(하단 적용질문 박스 46%) | 'full'(전체화면)
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

  const activeReferenceStr = useMemo(() => {
    return (customRefQuery && customRefQuery.trim()) || safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || '열왕기하 21:1';
  }, [customRefQuery, safeDay.sermonReference, globalSharedQt, date]);

  const localScriptureData = useMemo(() => {
    return getLocalScriptureVerses(activeReferenceStr);
  }, [activeReferenceStr]);

  // 예시 말씀 찾기 팝업용 구절 데이터
  const finderScriptureData = useMemo(() => {
    return getLocalScriptureVerses(finderRefInput);
  }, [finderRefInput]);

  useEffect(() => {
    if (localScriptureData.parsed?.startV) {
      setSelectedWordVerse(localScriptureData.parsed.startV);
    }
  }, [localScriptureData.parsed?.bookKo, localScriptureData.parsed?.chapter, localScriptureData.parsed?.startV]);

  const showToast = useCallback((msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2800);
  }, []);

  // =====================================================================
  // 🏛️ [맥체인 동일] 원어 어절 클릭 시 전권 용례(Concordance) 및 상세 데이터 로드
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

  // 🏛️ [맥체인 동일] 특정 성경 구절의 10대 학술 원어 강해 모달 오픈
  const openMcheyneStyleVerseInspector = useCallback(async (customRefStr, targetVerseNum) => {
    const queryStr = customRefStr || activeReferenceStr || '열왕기하 21:1';
    const scriptData = getLocalScriptureVerses(queryStr);
    const parsed = scriptData.parsed || { bookKo: '열왕기하', bookEn: '2 Kings', chapter: 21, startV: 1 };

    const koBook = parsed.bookKo || '열왕기하';
    const chNum = parsed.chapter || 1;
    const vNum = targetVerseNum || parsed.startV || 1;
    const bookInfo = BIBLE_66_MAP[koBook] || BIBLE_66_MAP[parsed.bookEn] || { ko: koBook, isOT: true, section: '구약' };
    const isOT = bookInfo.isOT;

    const foundVerseObj = scriptData.verses.find(v => v.vNum === Number(vNum)) || scriptData.verses[0];
    const verseText = foundVerseObj?.text || `${koBook} ${chNum}장 ${vNum}절 말씀`;

    const easyKey = `${koBook}-${chNum}-${vNum}`;
    const easyText = easyBibleDb[easyKey] || '';
    const webText = webBibleDb[easyKey] || webBibleDb[`${parsed.bookEn}-${chNum}-${vNum}`] || '';

    setInspectorTarget({
      book: koBook,
      bookEn: parsed.bookEn,
      chapter: chNum,
      verse: vNum,
      text: decodeHtmlEntities(verseText),
      easyText,
      webText,
      isOT,
      allChapterVerses: scriptData.verses
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
  }, [activeReferenceStr, easyBibleDb, webBibleDb, customNotesMap, handleSelectInspectorWord]);

  const handleInsertWordToSermonNote = (word) => {
    if (!word || !inspectorTarget) return;
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = (customInputMemo || word.userCustomNote?.memo) ? `<br/>↳ ✍️ 연구 메모: ${customInputMemo || word.userCustomNote?.memo}` : '';
    const htmlSnippet = `<p><b>📖 [${inspectorTarget.book} ${inspectorTarget.chapter}:${inspectorTarget.verse} 원어강해] ${word.inflected}${lemmaNotice} (${word.strongs})</b>: ${customInputTrans || word.korContextual} — <i>${word.grammarDecoded}</i>${customMemoNotice}</p>`;

    const prev = safeDay.sermonNotes || '';
    updateDay && updateDay({ sermonNotes: prev + htmlSnippet });
    showToast(`✍️ [${word.inflected}] 원어 강해가 설교 필기장에 삽입되었습니다!`);
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
  // 📸 [고정밀 OCR 엔진] 2.2x 업스케일링 + 흑백 이진화 이미지로 한글 자막 정확도 극대화
  // =====================================================================
  const runOcrOnCaptureItem = useCallback(async (captureItem) => {
    if (!captureItem || !captureItem.imageUrl) return;
    setOcrLoadingId(captureItem.id);
    showToast('🔍 고해상도 흑백 이진화 필터로 한글 자막을 정밀 판독 중입니다...');

    try {
      const Tesseract = await ensureTesseractLoaded();
      // 전처리된 고대비 흑백 이미지(preprocessedUrl)를 최우선으로 사용하여 인식률 향상
      const targetImg = captureItem.preprocessedUrl || captureItem.subtitleCropUrl || captureItem.imageUrl;

      const result = await Tesseract.recognize(targetImg, 'kor+eng');
      const cleaned = cleanKoreanOcrText(result?.data?.text || '');

      const finalExtracted = cleaned || '자막 텍스트를 명확히 인식하지 못했습니다. 우측 입력란에서 직접 수정하거나 다른 영역 모드로 캡처해 보세요.';

      setSermonCaptures(prev => {
        const updated = prev.map(item =>
          item.id === captureItem.id ? { ...item, ocrText: finalExtracted } : item
        );
        try {
          localStorage.setItem(`sermon_captures_${date}`, JSON.stringify(updated));
        } catch (_) {}
        if (updateDay) updateDay({ sermonCaptures: updated });
        return updated;
      });

      showToast('✨ 한글 자막 OCR 텍스트 추출이 완료되었습니다!');
    } catch (err) {
      console.error('OCR Error:', err);
      showToast('⚠️ OCR 판독 중 오류가 발생했습니다. 직접 메모를 입력해 주세요.');
    } finally {
      setOcrLoadingId(null);
    }
  }, [date, updateDay, showToast]);

  const processCapturedCanvasToItem = useCallback(async (sourceCanvas, label = '예배 영상 자막 캡처') => {
    const fullDataUrl = sourceCanvas.toDataURL('image/jpeg', 0.88);
    const { preprocessedDataUrl, croppedPreviewUrl } = createHighAccuracyOcrImage(sourceCanvas, ocrCropPreset);

    const newItem = {
      id: `cap_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label,
      imageUrl: fullDataUrl,
      subtitleCropUrl: croppedPreviewUrl,
      preprocessedUrl: preprocessedDataUrl,
      ocrText: ''
    };

    const nextList = [newItem, ...sermonCaptures];
    syncCapturesToDay(nextList);

    if (isLiveCinemaMode) {
      setCinemaHudTab('captures');
      setIsCinemaUiHidden(false);
    }

    await runOcrOnCaptureItem(newItem);
  }, [ocrCropPreset, sermonCaptures, syncCapturesToDay, isLiveCinemaMode, runOcrOnCaptureItem]);

  const handleCaptureYoutubeScreen = async () => {
    if (isCapturingScreen) return;
    setIsCapturingScreen(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false,
          preferCurrentTab: true
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        await new Promise(r => setTimeout(r, 160));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop());

        await processCapturedCanvasToItem(canvas, '유튜브 실시간 자막 캡처');
      } else {
        captureInputRef.current?.click();
      }
    } catch (err) {
      showToast('💡 화면 공유가 취소되었거나 모바일인 경우 [🖼️ 이미지 불러오기]를 이용해 주세요.');
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const handleUploadCaptureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        await processCapturedCanvasToItem(canvas, '스크린샷 이미지 캡처');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
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
              await processCapturedCanvasToItem(canvas, '클립보드 붙여넣기 캡처');
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

  const handleSendOcrToApplyQuestions = (text) => {
    if (!text || !text.trim()) return alert('추출된 텍스트가 없습니다.');
    const curQuestions = getArr ? [...getArr(safeDay.applyQuestions)] : [];
    const nextQuestions = [...curQuestions, text.trim()];
    updateDay && updateDay({ applyQuestions: nextQuestions });
    showToast('📌 추출된 자막이 [설교 속 구속사적 적용 질문]에 자동 등록되었습니다!');
  };

  const handleSendOcrToSermonNotes = (capItem) => {
    if (!capItem) return;
    const prev = safeDay.sermonNotes || '';
    const snippet = `<div style="margin:10px 0; padding:12px; border:1px solid #334155; border-radius:12px; background:rgba(15,23,42,0.05);"><p><b>📸 [예배 영상 자막 캡처 (${capItem.timestamp})]</b></p><p>${(capItem.ocrText || '').replace(/\n/g, '<br/>')}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast('✍️ 추출된 자막 텍스트가 설교 필기장 본문에 삽입되었습니다!');
  };

  // 📖 예시 말씀 검색 팝업에서 선택한 구절을 설교 필기장에 인용구 블록으로 삽입
  const handleInsertVerseToSermonNotes = (refLabel, verseText) => {
    const prev = safeDay.sermonNotes || '';
    const snippet = `<div style="margin:8px 0; padding:10px 14px; border-left:4px solid #F59E0B; background:rgba(245,158,11,0.08); border-radius:8px;"><p><b>📖 [${refLabel}]</b> ${verseText}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast(`📖 [${refLabel}] 말씀이 설교 필기장에 삽입되었습니다!`);
  };

  // =====================================================================
  // 🖥️ [핵심 수정] 전체화면 진입 시 rootSermonFullscreenRef 전체를 Fullscreen으로 만들어
  // 원어 강해·신구약 아크·말씀찾기 모달이 모두 유튜브 영상 "위(앞)"에 뜨도록 보장!
  // =====================================================================
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
  // 🌟 [월별 기상오기 링크 관리 엔진]
  // =====================================================================
  const currentMonthNum = useMemo(() => {
    if (date && date.length >= 7) {
      return parseInt(date.substring(5, 7), 10) || 10;
    }
    return new Date().getMonth() + 1;
  }, [date]);

  const [monthlyGisanUrls, setMonthlyGisanUrls] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('monthly_gisangogi_urls') || '{}');
      return saved;
    } catch {
      return {};
    }
  });

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const activeMonthGisanUrl = useMemo(() => {
    if (monthlyGisanUrls[currentMonthNum]) {
      return monthlyGisanUrls[currentMonthNum];
    }
    const perMonthLocal = localStorage.getItem(`app_active_gisangogi_url_${currentMonthNum}`);
    if (perMonthLocal) return perMonthLocal;

    const globalLocal = localStorage.getItem('app_active_gisangogi_url');
    if (globalLocal) return globalLocal;

    return gisangogiUrl || safeDay.sermonVideoUrl || '';
  }, [monthlyGisanUrls, currentMonthNum, gisangogiUrl, safeDay.sermonVideoUrl]);

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
    localStorage.setItem('app_active_gisangogi_url', target);

    if (setGisangogiUrl) setGisangogiUrl(target);
    if (updateDay) updateDay({ sermonVideoUrl: target });
    if (handleUpdateSharedSermon) handleUpdateSharedSermon(date, target);

    showToast(`🎬 ${currentMonthNum}월 기상오기 영상 링크가 성공적으로 변경되었습니다!`);
  };

  const gisanUrlToUse = activeMonthGisanUrl;
  const gisanVidId = extractVideoId ? extractVideoId(gisanUrlToUse) : null;
  
  const rawTarget = globalSharedQt?.[date]?.sermon || globalSharedQt?.[date]?.sermonData?.sermon || safeDay?.sermonVideoId || safeDay?.sermonVideoUrl;
  const currentVideoId = extractVideoId ? extractVideoId(rawTarget) : rawTarget;
  const activeYoutubeId = isSp ? (gisanVidId || currentVideoId) : (currentVideoId || gisanVidId);

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
    alert("예배 영상이 실시간 공유되었습니다!");
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
      showToast("🙏 목장 모임 [감사나눔]으로 전송되었습니다!");
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const inlineActionSendToTracker = () => {
    const textToPush = safeDay.sermonActionItem || safeDay.sermonGraceLine || safeDay.sermonTitle || '설교 결단 및 적용';
    handleActionItemSync(textToPush);
    showToast("🌿 오늘의 적용 트래커에 성공적으로 반영되었습니다!");
  };

  const inlineActionSendToPrayer = () => {
    try {
      const prayers = JSON.parse(localStorage.getItem('prayer_items') || '[]');
      const newPrayer = {
        id: `prayer_sermon_${Date.now()}`,
        title: `[예배 은혜 연계] ${safeDay.sermonTitle || safeDay.sermonReference || date} 결단의 기도`,
        content: encryptField(safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 중 결단한 기도 제목'),
        date: date,
        answered: false
      };
      localStorage.setItem('prayer_items', JSON.stringify([newPrayer, ...prayers]));
      showToast("🙏 나의 기도함에 은혜가 안전하게 보관되었습니다!");
    } catch (e) {
      showToast("기도함 저장 중 오류가 발생했습니다.");
    }
  };

  const inlineActionSendToCounseling = async () => {
    try {
      const counselingPayload = {
        user_name: authUser?.name || '성도',
        cell_name: authUser?.cell_name || '소속 목장',
        title: `[심층 설교 상담 요청] ${safeDay.sermonReference || date}`,
        content: encryptField(`설교 제목: ${safeDay.sermonTitle}\n본문: ${safeDay.sermonReference}\n상담/나눔 내용: ${safeDay.sermonGraceLine || safeDay.sermonConviction || '설교 말씀 관련 깊은 나눔이 필요합니다.'}`),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('counseling_qna').insert([counselingPayload]);
      }
      showToast("💌 담당 목자/사역자에게 1:1 심층 상담이 비공개로 요청되었습니다.");
    } catch (e) {
      showToast("심층 상담 전송 중 오류가 발생했습니다.");
    }
  };

  const toggleSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("마이크 미지원 브라우저입니다.");

    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      if (sermonRecRef.current) {
        try { sermonRecRef.current.stop(); } catch(e) {}
        sermonRecRef.current = null;
      }
      return;
    }

    try {
      const rec = new SR();
      rec.lang = 'ko-KR';
      rec.continuous = true;
      sermonRecRef.current = rec;

      rec.onresult = (ev) => {
        let final = '';
        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' ';
        }
        if (final) {
          if (setDailyData) {
            setDailyData(prev => {
              const d = prev[date] || {};
              return { ...prev, [date]: { ...d, sermonNotes: (d.sermonNotes || '') + final } };
            });
          }
        }
      };

      rec.onend = () => {
        setIsSpeechRecording(false);
        sermonRecRef.current = null;
      };

      rec.start();
      setIsSpeechRecording(true);
    } catch(err) {
      setIsSpeechRecording(false);
    }
  }, [isSpeechRecording, date, setDailyData]);

  useEffect(() => {
    return () => {
      if (sermonRecRef.current) {
        try { sermonRecRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const originalFontStyle = (isOT) => isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const currentInspectorKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentCommentary = commentaryDb[currentInspectorKey] || null;
  const currentMatthewHenry = matthewHenryDb[currentInspectorKey] || null;
  const currentNetNote = netNotesDb[currentInspectorKey] || null;
  const currentTargumPeshitta = targumPeshittaDb[currentInspectorKey] || null;

  const currentHebrewSyntax = useMemo(() => {
    if (inspectorTarget?.isOT && inspectorWords && inspectorWords.length > 0) {
      return analyzeHebrewSyntaxFromWords(inspectorWords);
    }
    return null;
  }, [inspectorTarget, inspectorWords]);

  const BacklinkPanel = () => {
    if (!activeBacklink) return null;
    const isDarkTheme = isDarkMode;

    const relatedEntries = Object.entries(dailyData || {}).filter(([dKey, dVal]) => {
      if (dKey === date) return false;
      const fullText = `${dVal.sermonNotes || ''} ${dVal.qtMeditation || ''} ${dVal.qtGraceLine || ''}`;
      return fullText.includes(activeBacklink);
    }).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] z-[200] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col transition-transform animate-fade-in ${isDarkTheme ? 'bg-[#121418] border-l border-white/10' : 'bg-white border-l border-stone-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-white/10' : 'border-stone-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-md ${isDarkTheme ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-700'}`}>🔗</span>
            <h3 className={`text-[14px] font-bold ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>{activeBacklink} 관련 기록</h3>
          </div>
          <button onClick={() => setActiveBacklink(null)} className={`p-1.5 rounded-full hover:bg-stone-500/20 transition-colors ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pointer-events-auto">
          {relatedEntries.length === 0 ? (
            <div className={`py-10 flex flex-col items-center gap-2 text-[12px] font-medium ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
              과거 예배/묵상 기록이 없습니다.
            </div>
          ) : (
            relatedEntries.map(([dKey, dVal]) => (
              <div key={dKey} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                <span className={`text-[10px] font-mono tracking-widest ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>{dKey}</span>
                <p className={`text-[13px] font-serif leading-relaxed line-clamp-4 ${isDarkTheme ? 'text-stone-200' : 'text-stone-700'}`}>
                  {(dVal.sermonNotes || dVal.qtMeditation || dVal.qtGraceLine || '').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={rootSermonFullscreenRef}
      className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0b0c0f]' : 'bg-[#fbfbf9]'}`}
    >
      <BacklinkPanel />

      {/* 숨겨진 캡처 이미지 파일 입력기 */}
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadCaptureFile}
        className="hidden"
      />
      
      {/* 앰비언트 배경 글로우 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20" style={{ transform: 'translate3d(0,0,0)' }}>
        <div 
          className="absolute -top-[10%] -left-[10%] w-[700px] max-w-[85vw] h-[700px] max-h-[85vw] rounded-full blur-[90px]" 
          style={{ background: 'radial-gradient(circle, rgba(186, 215, 201, 0.4) 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[800px] max-w-[90vw] h-[800px] max-h-[90vw] rounded-full blur-[95px]" 
          style={{ background: 'radial-gradient(circle, rgba(214, 218, 235, 0.35) 0%, transparent 70%)' }} 
        />
      </div>

      {/* 1. 상단 글로벌 헤더 바 */}
      <header className={`shrink-0 px-3 sm:px-4 py-2.5 flex items-center justify-between z-20 border-b relative backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#121418]/90' : 'border-stone-200/80 bg-white/90'}`}>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-black/5'}`}>
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <h1 className={`text-[15.5px] sm:text-[16px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>예배 노트</h1>
            {isSanctuaryMode && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/10 text-stone-200 border-white/15' : 'bg-stone-100 text-stone-700 border-stone-300'}`}>
                집중 모드
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {/* 📺 전체화면 + 노트/원어/캡처 HUD 버튼 */}
          <button
            onClick={() => enterLiveCinemaFullscreen('outline')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-stone-100 text-stone-900 hover:bg-white' : 'bg-stone-900 text-white hover:bg-black'
            }`}
          >
            <IconMaximize /> <span>라이브 전체화면 노트</span>
          </button>

          {/* 📖 성경말씀 & 예시구절 멀티 검색 팝업 버튼 */}
          <button
            onClick={() => setIsBibleFinderOpen(true)}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-amber-300 hover:bg-white/10' : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <IconSearch /> <span>말씀·예시구절 찾기</span>
          </button>

          {/* 📸 화면 캡처 & OCR 자막 추출 버튼 */}
          <button
            onClick={handleCaptureYoutubeScreen}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <IconCamera /> <span>화면캡처·OCR</span>
          </button>

          {/* 🔬 맥체인형 10대 학술 원어 강해 팝업 버튼 */}
          <button
            onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span>🔬</span> <span className="hidden xs:inline">원어 강해</span>
          </button>

          {/* 🌈 신구약 아크 팝업 버튼 */}
          <button
            onClick={() => {
              setArcModalInitialMode('arc');
              setIsArcModalOpen(true);
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span>🌈</span> <span className="hidden xs:inline">신구약 아크</span>
          </button>

          <button 
            onClick={toggleSanctuaryMode}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              isSanctuaryMode 
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs' 
                : (isDark ? 'bg-white/5 border-white/15 text-stone-300 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100')
            }`}
          >
            <span>{isSanctuaryMode ? '🏛️ 본당 집중' : '일반'}</span>
          </button>

          <button onClick={() => setShowToolbar(!showToolbar)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${showToolbar ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent shadow-xs' : (isDark ? 'bg-white/5 text-stone-300 border-white/15' : 'bg-white text-stone-700 border-stone-200')}`}>
            <IconTool /> {showToolbar ? '도구 닫기' : '도구'}
          </button>
          
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-black/5'}`}>
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 인라인 액션 토스트 알림 플로터 (전체화면 중에도 최상단 표시) */}
      {actionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999999] bg-stone-900 text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-2xl border border-white/20 animate-bounce flex items-center gap-2">
          <span>✨</span> {actionToast}
        </div>
      )}

      {/* 그리기 및 서식 도구 모음 */}
      {showToolbar && (
        <div className={`relative z-20 w-full px-2 py-1.5 border-b backdrop-blur-xl shrink-0 overflow-x-auto hide-scrollbar animate-fade-in ${isDark ? 'border-white/10 bg-[#121418]/90' : 'border-stone-200 bg-white/90'}`}>
          {renderToolbar && renderToolbar(sermonEditorRef, true, handleStickerAdd, handleMemoAdd, handleFileUpload)}
        </div>
      )}
      
      {/* 2. 본문 뷰포트 레이아웃 */}
      {CanvasEngine && (
      <CanvasEngine key={`sermon_${date}`} saveKey={`sermon_${date}`} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} renderStickers={() => StickerLayer ? <StickerLayer memos={safeDay.memos} stickers={safeDay.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} /> : null}>
        <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-2 sm:px-4 py-3 pb-32 relative z-10 space-y-3 max-w-4xl mx-auto">
          
          {/* 일자 바 & 아카이브/저장 제어 */}
          <div className={`px-3.5 py-2 rounded-xl border backdrop-blur-md flex justify-between items-center ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[13.5px] font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{date}</span>
              <span className="text-[10.5px] text-stone-400 font-mono">주일 대예배 설교</span>
            </div>

            <div className="flex gap-1.5 ignore-draw">
              <button onClick={() => openModal && openModal('sermonList')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/15' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}>
                <IconList /> 목록
              </button>
              <button onClick={downloadSermonWord} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 cursor-pointer hover:opacity-90">
                <IconSave /> Word 저장
              </button>
            </div>
          </div>

          {/* 설교 메타데이터 & 성경 본문 매핑 + 4대 연구 버튼 바 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <input 
              type="text" 
              value={safeDay.sermonTitle || globalSharedQt?.[date]?.sermonData?.title || ''} 
              onChange={e => updateDay({ sermonTitle: e.target.value })} 
              onPointerDown={e => e.stopPropagation()} 
              className={`w-full px-3 py-2 rounded-lg text-[14.5px] font-serif font-bold outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
              placeholder="설교 제목을 입력하세요." 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input 
                type="text" 
                value={safeDay.sermonPreacher || globalSharedQt?.[date]?.sermonData?.preacher || ''} 
                onChange={e => updateDay({ sermonPreacher: e.target.value })} 
                onPointerDown={e => e.stopPropagation()} 
                className={`w-full px-3 py-2 rounded-lg text-[12.5px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                placeholder="설교자 (예: 담임목사)" 
              />
              <div className="flex gap-1.5 ignore-draw items-center">
                <input 
                  type="text" 
                  value={safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || ''} 
                  onChange={e => {
                    setCustomRefQuery(e.target.value);
                    updateDay && updateDay({ sermonReference: e.target.value });
                  }} 
                  onPointerDown={e => e.stopPropagation()} 
                  placeholder="본문 (예: 왕하 21:1, 롬 8:28)" 
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-[12.5px] font-medium outline-none border transition-all ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-900 focus:border-stone-400'}`} 
                />
                <button 
                  onClick={() => {
                    setFinderRefInput(safeDay.sermonReference || activeReferenceStr);
                    setIsBibleFinderOpen(true);
                  }} 
                  className={`shrink-0 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <IconSearch /> 말씀찾기
                </button>
              </div>
            </div>

            {/* 🔬 4대 성경 연구 직결 바 (말씀·예시찾기 / 원어 강해 / 신구약 아크 / 말씀 은하계) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setFinderRefInput(activeReferenceStr);
                  setIsBibleFinderOpen(true);
                }}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-amber-300' : 'bg-amber-50/80 hover:bg-amber-100 border-amber-200 text-amber-900'
                }`}
              >
                <span>📖</span> <span>말씀·예시구절 찾기</span>
              </button>
              <button
                type="button"
                onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>📜</span> <span>원어 강해 (맥체인형)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('arc');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>🌈</span> <span>신구약 아크 대조</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('2d');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>🌌</span> <span>말씀 은하계</span>
              </button>
            </div>

            {/* 오늘 나를 찌른 말씀의 앵커 (Conviction) */}
            <div className="pt-1 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-black/25 border-white/10' : 'bg-stone-50/70 border-stone-200/80'}`}>
                <span className={`text-[10.5px] font-bold font-serif ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  ⚡ 오늘 나를 찌른 설교 한마디 (회개와 결단의 앵커)
                </span>
                <input 
                  type="text" 
                  value={safeDay.sermonConviction || ''} 
                  onChange={e => updateDay && updateDay({ sermonConviction: e.target.value })} 
                  placeholder="설교 중 마음에 깊이 와닿았던 단 한 문장을 적어두고 묵상하세요..." 
                  className={`w-full bg-transparent outline-none text-[13px] font-serif font-medium leading-relaxed ${isDark ? 'text-white placeholder:text-stone-500' : 'text-stone-900 placeholder:text-stone-400'}`} 
                />
              </div>
            </div>

            {/* 지식 그래프 백링크 태그 */}
            {linkedRefs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5 animate-fade-in ignore-draw">
                {linkedRefs.map(ref => (
                  <button 
                    key={ref}
                    onClick={(e) => { e.stopPropagation(); setActiveBacklink(ref); }}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      activeBacklink === ref 
                        ? (isDark ? 'bg-white text-stone-900 border-white' : 'bg-stone-900 text-white border-stone-900')
                        : (isDark ? 'bg-black/40 border-white/10 text-stone-300 hover:text-white' : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900')
                    }`}
                  >
                    🔗 {ref} 과거 묵상 대조
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 설교 3대지 구조화 빌더 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div 
              onClick={() => setShowOutlineBuilder(!showOutlineBuilder)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-stone-300' : 'bg-stone-700'}`} />
                <span className={`text-[13px] font-serif font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  설교 대지 구조화 빌더 (3-Point Outline)
                </span>
              </div>
              <IconChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showOutlineBuilder ? 'rotate-180' : ''}`} />
            </div>

            {showOutlineBuilder && (
              <div className="space-y-2 pt-1 border-t border-dashed border-stone-200 dark:border-white/10 animate-fade-in ignore-draw" onPointerDown={e => e.stopPropagation()}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제1대지: 본문 관찰 및 하나님의 성품</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT I</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint1 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint1: e.target.value })} 
                    placeholder="예: 우리를 먼저 찾아오시고 부르시는 하나님의 긍휼" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제2대지: 직면한 나의 우상과 회개의 자리</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT II</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint2 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint2: e.target.value })} 
                    placeholder="예: 여전히 내 지혜와 능력을 의지하려 했던 교만의 죄" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif font-bold text-stone-500">
                    <span>제3대지: 구속사적 결단과 십자가의 은혜</span>
                    <span className="text-[9.5px] font-mono opacity-60">POINT III</span>
                  </div>
                  <input 
                    type="text" 
                    value={safeDay.sermonPoint3 || ''} 
                    onChange={e => updateDay && updateDay({ sermonPoint3: e.target.value })} 
                    placeholder="예: 내 권리를 포기하고 지체를 섬기는 십자가의 순종" 
                    className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🌟 영상 시청 및 원터치 화면 캡처/OCR 진입 섹션 */}
          {!isSanctuaryMode && (
            <div className={`p-3.5 rounded-xl border backdrop-blur-md flex flex-col gap-2.5 ignore-draw ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
              <div className="flex justify-between items-center px-0.5 flex-wrap gap-1.5">
                <span className={`text-[12.5px] font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  <IconVideo /> {isSp ? `${currentMonthNum}월 기상오기 실황` : '주일 예배 영상 시청'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={handleCaptureYoutubeScreen}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <IconCamera /> <span>영상 자막 캡처·OCR</span>
                  </button>
                  <button
                    onClick={() => enterLiveCinemaFullscreen('outline')}
                    className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <IconMaximize /> 전체화면 + 노트/원어/캡처
                  </button>
                  <button 
                    onClick={() => setShowMonthlyModal(true)}
                    className="text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    📅 기상오기 관리
                  </button>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="유튜브 라이브 또는 설교 링크 붙여넣기..." 
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
                  onPointerDown={e => e.stopPropagation()} 
                  className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[12px] font-medium outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                />
                {isSp ? (
                  <button
                    onClick={handleApplyCurrentMonthGisanVideo}
                    className="shrink-0 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    저장
                  </button>
                ) : (
                  <button 
                    onClick={handleShareVideo} 
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                      isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200'
                    }`}
                  >
                    <IconShare /> 공유
                  </button>
                )}
              </div>

              {!isLiveCinemaMode && (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative shadow-inner">
                  {activeYoutubeId ? (
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeYoutubeId}?rel=0&enablejsapi=1`} title="Sermon Video" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full"></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white/50">영상을 검색해 링크를 붙여넣으세요.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* 📸 [초고도화 섹션] 예배 영상 자막 캡처 & 고정밀 OCR 텍스트 추출란 */}
          {/* ===================================================================== */}
          <div
            onPointerDown={e => e.stopPropagation()}
            className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md space-y-3 ignore-draw ${
              isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <IconCamera />
                <span className={`font-serif font-bold text-[13.5px] ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  예배 영상 자막 캡처 & 고정밀 OCR 추출란 ({sermonCaptures.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* OCR 크롭 영역 선택 */}
                <select
                  value={ocrCropPreset}
                  onChange={(e) => setOcrCropPreset(e.target.value)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold outline-none cursor-pointer ${
                    isDark ? 'bg-black/40 border-white/15 text-stone-200' : 'bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <option value="question_box">🎯 하단 질문·자막박스(46%)</option>
                  <option value="subtitle_bottom">📏 하단 좁은 자막바(30%)</option>
                  <option value="full">🖼️ 화면 전체 인식(100%)</option>
                </select>

                <button
                  type="button"
                  onClick={handleCaptureYoutubeScreen}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  📸 지금 화면 캡처
                </button>
                <button
                  type="button"
                  onClick={() => captureInputRef.current?.click()}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                    isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  🖼️ 이미지 불러오기
                </button>
              </div>
            </div>

            {sermonCaptures.length === 0 ? (
              <div className={`py-6 px-4 rounded-xl border border-dashed text-center text-xs space-y-1 ${
                isDark ? 'border-white/10 text-stone-400 bg-black/20' : 'border-stone-200 text-stone-500 bg-stone-50/50'
              }`}>
                <p className="font-bold">유튜브 영상 하단에 적용질문이나 자막 박스가 뜰 때 [📸 지금 화면 캡처]를 눌러보세요!</p>
                <p className="text-[11px] opacity-80">2.2배 업스케일링 및 흑백 반전 이진화 필터가 적용되어 한글 자막을 선명하게 읽어냅니다.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 hide-scrollbar">
                {sermonCaptures.map((cap) => (
                  <div
                    key={cap.id}
                    className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-3 items-start ${
                      isDark ? 'bg-black/35 border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="sm:col-span-5 flex flex-col gap-1.5">
                      <div className="relative rounded-lg overflow-hidden border border-white/15 bg-black aspect-video">
                        <img src={cap.subtitleCropUrl || cap.imageUrl} alt="Sermon Capture" className="w-full h-full object-contain" />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] font-bold">
                          {cap.timestamp}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => runOcrOnCaptureItem(cap)}
                          disabled={ocrLoadingId === cap.id}
                          className="flex-1 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-[10.5px] font-bold cursor-pointer"
                        >
                          {ocrLoadingId === cap.id ? '🔍 정밀 판독 중...' : '🔄 OCR 다시 읽기'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = sermonCaptures.filter(item => item.id !== cap.id);
                            syncCapturesToDay(filtered);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-[10.5px] font-bold cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-7 flex flex-col gap-2 h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            🔍 고정밀 OCR 추출 텍스트 (직접 편집 가능)
                          </span>
                          {ocrLoadingId === cap.id && (
                            <span className="text-[10px] font-bold text-indigo-400 animate-pulse">흑백 이진화 리딩 중...</span>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={cap.ocrText || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = sermonCaptures.map(item =>
                              item.id === cap.id ? { ...item, ocrText: val } : item
                            );
                            syncCapturesToDay(next);
                          }}
                          placeholder="OCR 추출 결과가 여기에 표시됩니다..."
                          className={`w-full p-2.5 rounded-lg border text-xs font-serif leading-relaxed outline-none resize-none ${
                            isDark ? 'bg-[#121418] border-white/15 text-white' : 'bg-white border-stone-200 text-stone-900'
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendOcrToApplyQuestions(cap.ocrText)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold cursor-pointer"
                        >
                          📌 적용질문란에 추가
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendOcrToSermonNotes(cap)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          ✍️ 설교 필기장에 삽입
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!cap.ocrText) return;
                            updateDay && updateDay({ sermonConviction: cap.ocrText.replace(/\n/g, ' ') });
                            showToast('⚡ [나를 찌른 설교 한마디]에 반영되었습니다!');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            isDark ? 'bg-white/5 border-white/10 text-stone-300 hover:text-white' : 'bg-stone-100 border-stone-200 text-stone-700'
                          }`}
                        >
                          ⚡ 핵심 한마디로 지정
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 스마트 말씀 필기장 */}
          <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md space-y-2.5 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-white/10">
              <span className={`font-serif font-bold text-[13.5px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconDocument /> 설교 필기 및 말씀 묵상
              </span>
              <button 
                onClick={toggleSpeechRecognition}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center cursor-pointer ${
                  isSpeechRecording 
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse' 
                    : (isDark ? 'bg-white/10 border-white/10 text-white hover:bg-white/15' : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200')
                }`}
              >
                <IconMic className="mr-1 w-3.5 h-3.5" /> {isSpeechRecording ? '음성인식 작동중...' : '음성 필기'}
              </button>
            </div>

            <div className="w-full bg-transparent">
              <RichTextEditor 
                ref={sermonEditorRef} 
                value={safeDay.sermonNotes} 
                onChange={(val) => updateDay({ sermonNotes: val })} 
                t={t} 
                isSp={isSp} 
                bibles={bibles} 
                placeholder="[말씀 필기 팁]
1. 툴바를 이용해 표 생성과 형광펜 정렬이 가능합니다.
2. '로마서 8:28' 입력 후 스페이스바를 누르면 성경 본문이 자동 완성됩니다." 
              />
            </div>
            
            {/* 한줄 은혜 및 실천 결단 */}
            <div className="pt-2.5 space-y-1.5 ignore-draw border-t border-stone-200 dark:border-white/10">
              <span className="font-bold text-[11.5px] text-stone-500 flex items-center gap-1">
                <IconTarget /> 설교 핵심 은혜 및 삶의 실천 목표 (트래커 자동 연동)
              </span>

              <input 
                type="text" 
                value={safeDay.sermonGraceLine || ''} 
                onChange={(e) => handleGraceLineSync(e.target.value)} 
                placeholder="오늘 말씀에서 깨달은 하나님의 마음을 한 줄로 적어보세요." 
                className={`w-full px-3 py-2 rounded-lg border text-[12.5px] font-serif font-medium outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                onPointerDown={e => e.stopPropagation()} 
              />
              <input 
                type="text" 
                value={safeDay.sermonActionItem || ''} 
                onChange={(e) => handleActionItemSync(e.target.value)} 
                onBlur={(e) => { 
                  if (logUserAction && authUser?.name && e.target.value) {
                    logUserAction(authUser.name, '예배노트', 'write', `[실천목표] ${e.target.value}`);
                  }
                }} 
                placeholder="구체적인 실천 결단 (예: 직장에서 먼저 양보하고 온유하게 답하기)" 
                className={`w-full px-3 py-2 rounded-lg border text-[12.5px] font-bold outline-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`} 
                onPointerDown={e => e.stopPropagation()} 
              />
            </div>

            {/* 원스트림 인라인 연동 액션 허브 */}
            <div className={`p-3 rounded-xl border flex flex-col gap-2 mt-3 ${isDark ? 'bg-stone-900/60 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex justify-between items-center border-b pb-1.5 border-stone-200 dark:border-white/10">
                <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  🌱 원스트림 신앙 연동 액션
                </span>
                <span className="text-[10px] text-stone-400">페이지 이동 없이 즉시 보관</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button 
                  onClick={inlineActionSendToTracker}
                  className="py-2 px-2.5 rounded-lg bg-[#526359] hover:bg-[#435249] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  🌿 트래커에 결단 심기
                </button>
                <button 
                  onClick={inlineActionSendToPrayer}
                  className="py-2 px-2.5 rounded-lg bg-[#6B6177] hover:bg-[#594F64] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  🙏 나의 기도함에 저장
                </button>
                <button 
                  onClick={inlineActionSendToCounseling}
                  className="py-2 px-2.5 rounded-lg bg-[#506375] hover:bg-[#415160] text-white text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  💌 1:1 심층상담 요청
                </button>
              </div>
            </div>

          </div>

          {/* 나의 감사 선포 */}
          <div className={`p-3.5 rounded-xl border backdrop-blur-md ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`}>
            <div className="flex justify-between items-center mb-2">
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className={`font-bold text-[13px] flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconHeart /> 나의 감사 선포
              </span>
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className="text-[11px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-white cursor-pointer">
                선포문 작성 / 편집
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : []).map((q, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border flex justify-between items-center ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`}>
                  <div className="flex gap-2 items-start min-w-0 pr-2">
                    <span className="font-bold text-[11.5px] text-stone-400 mt-0.5">{i + 1}.</span>
                    <span className="text-[12.5px] font-medium leading-relaxed truncate">{q || <span className="opacity-40 text-stone-400">말씀을 듣고 일어난 감사를 고백하세요.</span>}</span>
                  </div>
                  {q && q.trim() && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendDeclarationToCell(q); }}
                      className={`shrink-0 px-2.5 py-1 rounded text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-white/10 hover:bg-white text-stone-200 hover:text-stone-900' : 'bg-stone-200 hover:bg-stone-900 text-stone-800 hover:text-white'
                      }`}
                      title="목장 모임 감사 피드로 전송"
                    >
                      <IconSend /> 목장으로
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 나의 적용 질문 */}
          <div className={`p-3.5 rounded-xl border backdrop-blur-md cursor-pointer transition-colors hover:border-stone-400 ${isDark ? 'bg-[#181A20]/85 border-white/10' : 'bg-white/90 border-stone-200/80 shadow-2xs'}`} onClick={() => openModal && openModal('applyQuestion', safeDay, updateDay)}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-[13px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconPen /> 설교 속 구속사적 적용 질문
              </span>
              <button onClick={(e) => { e.stopPropagation(); toggleAiDetect && toggleAiDetect(); }} className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${isAiDetecting ? 'bg-stone-900 text-white border-stone-900 animate-pulse' : (isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-800')}`}>
                <IconMic /> {isAiDetecting ? '듣는중...' : '음성인식'}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(getArr && getArr(safeDay.applyQuestions).length > 0) ? getArr(safeDay.applyQuestions).map((q, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border flex gap-2 items-start ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-stone-50/70 border-stone-200 text-stone-900'}`}>
                  <span className="font-bold text-[11.5px] text-stone-400 mt-0.5">{i + 1}.</span>
                  <span className="text-[12.5px] font-serif font-medium leading-relaxed whitespace-pre-wrap">{q}</span>
                </div>
              )) : <div className={`text-center py-2.5 rounded-lg text-[12px] font-medium border ${isDark ? 'bg-black/30 border-white/10 text-stone-400' : 'bg-stone-50/70 border-stone-200 text-stone-500'}`}>기록된 적용 질문이 없습니다.</div>}
            </div>
          </div>

        </div>
      </CanvasEngine>
      )}

      {/* ===================================================================== */}
      {/* 📺 [핵심 기능 1] 라이브 시네마 전체화면 (유튜브 위에 원어·아크·말씀찾기 동시 표시!) */}
      {/* ===================================================================== */}
      {isLiveCinemaMode && (
        <div className="fixed inset-0 z-[99980] bg-black flex flex-col justify-between overflow-hidden select-none font-sans">
          {/* 1) 배경 유튜브 라이브 풀스크린 영상 */}
          <div className="absolute inset-0 w-full h-full bg-black">
            {activeYoutubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&rel=0&playsinline=1`}
                title="Live Worship Fullscreen"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-3 p-6 text-center bg-[#0D0F12]">
                <span className="text-3xl">📺</span>
                <p className="text-sm font-bold text-white">등록된 유튜브 영상 링크가 없습니다.</p>
                <input
                  type="text"
                  placeholder="여기에 유튜브 라이브 링크를 붙여넣으세요..."
                  value={safeDay.sermonVideoUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    let vId = extractVideoId ? extractVideoId(url) : null;
                    if (!vId) {
                      const m = url.match(/([a-zA-Z0-9_-]{11})/);
                      if (m) vId = m[1];
                    }
                    updateDay && updateDay({ sermonVideoUrl: url, sermonVideoId: vId || '' });
                  }}
                  className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[#181B20] border border-white/20 text-white text-xs outline-none"
                />
              </div>
            )}
          </div>

          {/* 👁️ [영상 집중 클린뷰] 화면 숨김 시 우측 하단 작은 캡슐만 표시 */}
          {isCinemaUiHidden ? (
            <div className="relative z-30 mt-auto ml-auto p-4 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleCaptureYoutubeScreen}
                className="px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-2xl flex items-center gap-1.5 cursor-pointer"
              >
                📸 자막 캡처·OCR
              </button>
              <button
                onClick={() => setIsCinemaUiHidden(false)}
                className="px-4 py-2 rounded-full bg-[#141619]/90 hover:bg-[#141619] text-stone-100 text-xs font-bold border border-white/20 shadow-2xl flex items-center gap-2 cursor-pointer"
              >
                <span>👁️ 예배노트 패널 켜기</span>
              </button>
            </div>
          ) : (
            <>
              {/* 2) 상단 정갈한 상태 바 */}
              <div className="relative z-20 px-4 py-2.5 bg-[#121418]/95 border-b border-white/10 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-950 text-[10px] font-mono font-bold shrink-0">
                    LIVE WORKSTATION
                  </span>
                  <span className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                    {safeDay.sermonTitle || '주일 예배 실황'}
                  </span>
                  <span className="text-xs font-mono text-amber-300 shrink-0">
                    ({activeReferenceStr})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsBibleFinderOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1F2229] hover:bg-[#2A2E37] text-amber-300 text-xs font-bold border border-amber-400/30 cursor-pointer"
                  >
                    📖 말씀·예시찾기
                  </button>
                  <button
                    onClick={handleCaptureYoutubeScreen}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    📸 자막캡처·OCR
                  </button>
                  <button
                    onClick={() => setIsCinemaUiHidden(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1F2229] hover:bg-[#2A2E37] text-stone-200 text-xs font-bold border border-white/15 cursor-pointer"
                  >
                    👁️ 화면 숨기기
                  </button>
                  <button
                    onClick={exitLiveCinemaFullscreen}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-bold cursor-pointer"
                  >
                    ✕ 전체화면 닫기
                  </button>
                </div>
              </div>

              {/* 3) 우측 플로팅 워크스테이션 카드 */}
              {cinemaHudTab && (
                <div className="relative z-20 ml-auto mr-3 sm:mr-5 my-auto w-[94vw] sm:w-[460px] max-h-[72vh] rounded-2xl bg-[#14161A] border border-white/15 shadow-[0_28px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden pointer-events-auto animate-fade-in text-stone-100">
                  
                  <div className="px-4 py-3 bg-[#1B1E24] border-b border-white/10 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        {cinemaHudTab === 'scripture' && '📖 설교 본문 말씀 (절 클릭 시 맥체인 원어강해)'}
                        {cinemaHudTab === 'memo' && '📝 자유 설교 메모장'}
                        {cinemaHudTab === 'outline' && '📌 설교 3대지 & 실천 결단'}
                        {cinemaHudTab === 'captures' && `📸 자막 캡처 & 고정밀 OCR (${sermonCaptures.length})`}
                        {cinemaHudTab === 'thanks' && '🙏 나의 감사 선포'}
                      </span>
                      <button
                        onClick={() => setCinemaHudTab(null)}
                        className="text-[11px] font-bold text-stone-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer"
                      >
                        접기 ✕
                      </button>
                    </div>

                    {cinemaHudTab === 'scripture' && (
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={customRefQuery || safeDay.sermonReference || ''}
                          onChange={(e) => {
                            setCustomRefQuery(e.target.value);
                            updateDay && updateDay({ sermonReference: e.target.value });
                          }}
                          placeholder="구절 입력 (예: 열왕기하 21:1, 롬 8:28)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                        />
                        <button
                          onClick={() => setIsBibleFinderOpen(true)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs shrink-0 cursor-pointer"
                        >
                          🔍 예시말씀
                        </button>
                        <button
                          onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shrink-0 cursor-pointer"
                        >
                          📜 원어강해
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar text-left text-xs">
                    {/* [탭 A] 📖 본문 말씀 */}
                    {cinemaHudTab === 'scripture' && (
                      <div className="space-y-2">
                        {localScriptureData.verses.length === 0 ? (
                          <p className="text-stone-400 py-8 text-center">상단 입력창에 성경 구절(예: 열왕기하 21:1, 롬 8:28)을 입력해 주세요.</p>
                        ) : (
                          localScriptureData.verses.map(v => {
                            const koBook = localScriptureData.parsed?.bookKo || '성경';
                            const ch = localScriptureData.parsed?.chapter || 1;
                            return (
                              <div
                                key={v.vNum}
                                className={`p-3 rounded-xl border transition-all ${
                                  v.isHighlight
                                    ? 'bg-[#22262E] border-stone-400 text-white'
                                    : 'bg-[#191C22] border-white/5 text-stone-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                                  <span className="font-mono font-bold text-amber-300">
                                    {koBook} {ch}:{v.vNum}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openMcheyneStyleVerseInspector(`${koBook} ${ch}:${v.vNum}`, v.vNum)}
                                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer"
                                    >
                                      📖 원어강해
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomRefQuery(`${koBook} ${ch}:${v.vNum}`);
                                        setArcModalInitialMode('arc');
                                        setIsArcModalOpen(true);
                                      }}
                                      className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer"
                                    >
                                      🌈 아크
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInsertVerseToSermonNotes(`${koBook} ${ch}:${v.vNum}`, v.text)}
                                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-stone-200 font-bold text-[10px] cursor-pointer"
                                    >
                                      + 노트삽입
                                    </button>
                                  </div>
                                </div>
                                <span className="font-serif text-[13px] leading-relaxed block">{v.text}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* [탭 B] 📝 자유 설교 메모장 */}
                    {cinemaHudTab === 'memo' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">⚡ 나를 찌른 설교 한마디</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="오늘 마음에 깊이 남은 한 문장..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-stone-300">✍️ 설교 노트 자유 필기 (본문 자동 연동)</label>
                            <button
                              onClick={toggleSpeechRecognition}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer ${
                                isSpeechRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-stone-200'
                              }`}
                            >
                              🎤 {isSpeechRecording ? '음성인식 중...' : '음성 받아쓰기'}
                            </button>
                          </div>
                          <textarea
                            rows={9}
                            value={(safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '')}
                            onChange={(e) => updateDay && updateDay({ sermonNotes: e.target.value })}
                            placeholder="영상을 보면서 자유롭게 말씀을 필기하세요..."
                            className="w-full p-3 rounded-xl bg-[#0E1013] border border-white/15 text-white text-[13px] font-serif leading-relaxed outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* [탭 C] 📌 설교 3대지 & 결단 */}
                    {cinemaHudTab === 'outline' && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">⚡ 나를 찌른 설교 한마디</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="오늘 마음에 와닿은 핵심 문장..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">1. 제1대지 (본문 관찰 및 하나님의 성품)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint1 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint1: e.target.value })}
                            placeholder="제1대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">2. 제2대지 (직면한 죄와 회개)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint2 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint2: e.target.value })}
                            placeholder="제2대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">3. 제3대지 (십자가 은혜와 순종)</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint3 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint3: e.target.value })}
                            placeholder="제3대지 핵심 요약..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">🎯 이번 주 실천 결단 (트래커 연동)</label>
                          <input
                            type="text"
                            value={safeDay.sermonActionItem || ''}
                            onChange={(e) => handleActionItemSync(e.target.value)}
                            placeholder="구체적인 순종 실천 1가지..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                          />
                        </div>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={inlineActionSendToTracker}
                            className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-white text-stone-900 font-bold text-[11.5px] cursor-pointer"
                          >
                            ✓ 트래커 반영
                          </button>
                          <button
                            onClick={inlineActionSendToPrayer}
                            className="flex-1 py-2 rounded-lg bg-[#252932] hover:bg-[#2F3440] text-stone-100 border border-white/10 font-bold text-[11.5px] cursor-pointer"
                          >
                            🙏 기도함 보관
                          </button>
                        </div>
                      </div>
                    )}

                    {/* [탭 D] 📸 실시간 화면 캡처 & 고정밀 OCR */}
                    {cinemaHudTab === 'captures' && (
                      <div className="space-y-3">
                        <div className="flex gap-1.5">
                          <select
                            value={ocrCropPreset}
                            onChange={(e) => setOcrCropPreset(e.target.value)}
                            className="px-2 py-1.5 rounded-xl bg-[#0E1013] border border-white/15 text-white text-[11px] font-bold outline-none"
                          >
                            <option value="question_box">하단 질문박스(46%)</option>
                            <option value="subtitle_bottom">하단 자막바(30%)</option>
                            <option value="full">전체화면(100%)</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleCaptureYoutubeScreen}
                            className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            📸 지금 캡처 + 자동 OCR
                          </button>
                        </div>

                        {sermonCaptures.length === 0 ? (
                          <p className="text-stone-400 py-8 text-center">
                            영상 하단에 적용질문이나 자막이 나올 때 위 캡처 버튼을 누르면 자동으로 글자를 읽어옵니다.
                          </p>
                        ) : (
                          sermonCaptures.map(cap => (
                            <div key={cap.id} className="p-3 rounded-xl bg-[#0E1013] border border-white/15 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10.5px] text-amber-300 font-bold">📸 {cap.timestamp} 캡처</span>
                                <button
                                  onClick={() => runOcrOnCaptureItem(cap)}
                                  className="text-[10px] font-bold text-indigo-300 hover:underline cursor-pointer"
                                >
                                  {ocrLoadingId === cap.id ? '🔍 정밀 판독 중...' : '🔄 OCR 재실행'}
                                </button>
                              </div>
                              <img src={cap.subtitleCropUrl || cap.imageUrl} alt="cap" className="w-full rounded-lg border border-white/10 max-h-28 object-contain bg-black" />
                              <textarea
                                rows={3}
                                value={cap.ocrText || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = sermonCaptures.map(item =>
                                    item.id === cap.id ? { ...item, ocrText: val } : item
                                  );
                                  syncCapturesToDay(next);
                                }}
                                placeholder="추출된 자막 텍스트..."
                                className="w-full p-2 rounded-lg bg-[#181B22] border border-white/15 text-white text-xs font-serif outline-none resize-none"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSendOcrToApplyQuestions(cap.ocrText)}
                                  className="flex-1 py-1.5 rounded-lg bg-stone-100 text-stone-950 font-bold text-[11px] cursor-pointer"
                                >
                                  📌 적용질문 등록
                                </button>
                                <button
                                  onClick={() => handleSendOcrToSermonNotes(cap)}
                                  className="flex-1 py-1.5 rounded-lg bg-white/10 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  ✍️ 필기장 삽입
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* [탭 E] 🙏 감사 선포 */}
                    {cinemaHudTab === 'thanks' && (
                      <div className="space-y-2.5">
                        <span className="text-[11px] text-stone-300 font-bold block">말씀을 들으며 고백하는 감사 선포</span>
                        {(getArr ? getArr(safeDay.thanksDeclarations, ['', '', '']) : ['', '']).map((q, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <span className="text-stone-400 font-bold w-4">{idx + 1}.</span>
                            <input
                              type="text"
                              value={q || ''}
                              onChange={(e) => {
                                const arr = [...(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : ['', ''])];
                                arr[idx] = e.target.value;
                                updateDay && updateDay({ thanksDeclarations: arr });
                              }}
                              placeholder="감사 제목을 입력하세요..."
                              className="flex-1 px-3 py-2 rounded-lg bg-[#0E1013] border border-white/15 text-white text-xs outline-none"
                            />
                            {q && q.trim() && (
                              <button
                                onClick={() => handleSendDeclarationToCell(q)}
                                className="px-2.5 py-2 rounded-lg bg-stone-200 hover:bg-white text-stone-900 font-bold text-[10.5px] shrink-0 cursor-pointer"
                              >
                                목장전송
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4) 하단 중앙 컨트롤 독(Dock) 바 — 영상 시청 중 모든 팝업 원터치 호출 */}
              <div className="relative z-20 pb-3.5 pt-2 px-3 flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto">
                <div className="flex flex-wrap items-center gap-1 bg-[#14161A]/95 border border-white/15 p-1.5 rounded-full shadow-2xl">
                  {[
                    { id: 'scripture', label: '📖 본문말씀' },
                    { id: 'memo', label: '📝 자유메모장' },
                    { id: 'outline', label: '📌 설교3대지' },
                    { id: 'captures', label: `📸 자막캡처(${sermonCaptures.length})` },
                    { id: 'thanks', label: '🙏 감사선포' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setCinemaHudTab(prev => (prev === btn.id ? null : btn.id))}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                        cinemaHudTab === btn.id
                          ? 'bg-white text-stone-950 shadow-xs'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}

                  <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                  <button
                    onClick={() => setIsBibleFinderOpen(true)}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-emerald-300 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    🔍 말씀·예시찾기
                  </button>

                  <button
                    onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-amber-300 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    📜 원어강해
                  </button>

                  <button
                    onClick={() => {
                      setArcModalInitialMode('arc');
                      setIsArcModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-stone-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    🌈 신구약 아크
                  </button>

                  <button
                    onClick={() => setIsCinemaUiHidden(true)}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-bold text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    👁️ 숨기기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 📖 [신규 핵심 기능 3] 성경말씀 & 설교 중 예시구절 멀티 검색 팝업 */}
      {/* (rootSermonFullscreenRef 내부에 렌더링되어 유튜브 전체화면 위에서도 완벽히 뜹니다!) */}
      {/* ===================================================================== */}
      {isBibleFinderOpen && (
        <div
          className="fixed inset-0 z-[999992] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none"
          onClick={() => setIsBibleFinderOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[86vh] rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col overflow-hidden text-left ${
              isDark ? 'bg-[#12151E] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3 mb-3 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block">
                  SCRIPTURE & ILLUSTRATION VERSE FINDER
                </span>
                <h3 className="text-base font-black">
                  📖 성경 본문 & 설교 예시 말씀 즉시 찾기
                </h3>
              </div>
              <button
                onClick={() => setIsBibleFinderOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>

            {/* 검색 모드 탭 ('구절/목차로 찾기' vs '단어/키워드로 찾기') */}
            <div className="flex gap-1.5 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setFinderMode('ref')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  finderMode === 'ref'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800/70 text-stone-500'
                }`}
              >
                📖 구절 입력 · 66권 목차로 찾기
              </button>
              <button
                type="button"
                onClick={() => setFinderMode('keyword')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  finderMode === 'keyword'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800/70 text-stone-500'
                }`}
              >
                🔍 설교 중 들린 단어(키워드)로 찾기
              </button>
            </div>

            {finderMode === 'ref' ? (
              <>
                {/* 1) 직접 구절 타이핑 & 66권 드롭다운 선택 */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3 shrink-0">
                  <div className="flex gap-1.5 flex-1">
                    <input
                      type="text"
                      value={finderRefInput}
                      onChange={(e) => setFinderRefInput(e.target.value)}
                      placeholder="예: 시편 23:1-6, 요 3:16, 롬 8:28"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-black/40 border-slate-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomRefQuery(finderRefInput);
                        updateDay && updateDay({ sermonReference: finderRefInput });
                        showToast(`📖 설교 본문이 [${finderRefInput}]으로 설정되었습니다.`);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shrink-0 cursor-pointer"
                    >
                      본문지정
                    </button>
                  </div>

                  {/* 성경 66권 & 장 빠른 선택기 */}
                  <div className="flex gap-1.5">
                    <select
                      value={finderBookKo}
                      onChange={(e) => {
                        const bk = e.target.value;
                        setFinderBookKo(bk);
                        setFinderChapter(1);
                        setFinderRefInput(`${bk} 1:1`);
                      }}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'
                      }`}
                    >
                      {BIBLE_66_CANON.map(b => (
                        <option key={b.ko} value={b.ko}>{b.ko}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={finderChapter}
                      onChange={(e) => {
                        const ch = Math.max(1, Number(e.target.value) || 1);
                        setFinderChapter(ch);
                        setFinderRefInput(`${finderBookKo} ${ch}:1`);
                      }}
                      className={`w-16 px-2 py-2 rounded-xl border text-xs font-bold text-center outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'
                      }`}
                    />
                    <span className="self-center text-xs font-bold text-stone-400">장</span>
                  </div>
                </div>

                {/* 구절 리스트 결과 */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                  {finderScriptureData.verses.map(v => {
                    const refLabel = `${finderScriptureData.parsed?.bookKo || finderBookKo} ${finderScriptureData.parsed?.chapter || finderChapter}:${v.vNum}`;
                    return (
                      <div
                        key={v.vNum}
                        className={`p-3 rounded-xl border transition-all ${
                          v.isHighlight
                            ? (isDark ? 'bg-amber-950/30 border-amber-500/60' : 'bg-amber-50 border-amber-300')
                            : (isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                            {refLabel}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleInsertVerseToSermonNotes(refLabel, v.text)}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10.5px] font-bold cursor-pointer"
                            >
                              ✍️ 필기장에 인용 삽입
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                openMcheyneStyleVerseInspector(refLabel, v.vNum);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10.5px] font-bold cursor-pointer"
                            >
                              📜 원어강해
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomRefQuery(refLabel);
                                setArcModalInitialMode('arc');
                                setIsArcModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10.5px] font-black cursor-pointer"
                            >
                              🌈 아크
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-[13px] font-serif leading-relaxed">{v.text}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* 2) 설교 중 들린 단어/키워드로 성경 전권 검색 */}
                <div className="flex gap-2 mb-3 shrink-0">
                  <input
                    type="text"
                    value={finderKeyword}
                    onChange={(e) => setFinderKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setFinderKeywordResults(searchBibleByKeyword(finderKeyword));
                      }
                    }}
                    placeholder="설교 중 들린 성경 단어를 입력하세요 (예: 합력하여 선을, 여호와는 나의 목자, 독생자)"
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDark ? 'bg-black/40 border-slate-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setFinderKeywordResults(searchBibleByKeyword(finderKeyword))}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    🔍 단어 검색
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                  {finderKeywordResults.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400">
                      단어를 입력하고 [🔍 단어 검색]을 누르면 성경 66권에서 해당 구절을 즉시 찾아줍니다.
                    </div>
                  ) : (
                    finderKeywordResults.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-black text-xs text-amber-500">{item.ref}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleInsertVerseToSermonNotes(item.ref, item.text)}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10.5px] font-bold cursor-pointer"
                            >
                              ✍️ 필기장에 인용 삽입
                            </button>
                            <button
                              type="button"
                              onClick={() => openMcheyneStyleVerseInspector(item.ref, item.verse)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10.5px] font-bold cursor-pointer"
                            >
                              📜 원어강해
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-[13px] font-serif leading-relaxed">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🏛️ [핵심 기능 2] 맥체인(Mcheyne.js) 100% 동일 '원어 강해 & 10대 학술 사료' 모달 */}
      {/* (rootSermonFullscreenRef 안쪽에 위치하여 유튜브 전체화면 위에서도 가려지지 않고 뜹니다!) */}
      {/* ===================================================================== */}
      {inspectorTarget && (
        <div
          className="fixed inset-0 z-[999995] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="border-b pb-2.5 border-stone-200 dark:border-slate-800 shrink-0 space-y-2">
              <div className="flex justify-between items-center flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 강해
                  </span>
                  {inspectorTarget.allChapterVerses && inspectorTarget.allChapterVerses.length > 0 && (
                    <select
                      value={inspectorTarget.verse}
                      onChange={(e) => {
                        const nextV = Number(e.target.value);
                        setSelectedWordVerse(nextV);
                        openMcheyneStyleVerseInspector(`${inspectorTarget.book} ${inspectorTarget.chapter}:${nextV}`, nextV);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border outline-none cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-100 border-stone-300 text-stone-800'
                      }`}
                    >
                      {inspectorTarget.allChapterVerses.map(v => (
                        <option key={v.vNum} value={v.vNum}>{v.vNum}절</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const refStr = `${inspectorTarget.book} ${inspectorTarget.chapter}:${inspectorTarget.verse}`;
                      setCustomRefQuery(refStr);
                      setInspectorTarget(null);
                      setArcModalInitialMode('arc');
                      setIsArcModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>🌈</span> 신구약 아크 ➔
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToInterlinearStudio}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>🔬</span> 원어성경연구실 ➔
                  </button>
                  <button
                    onClick={() => setInspectorTarget(null)}
                    className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer"
                  >
                    닫기 ✕
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={customRefQuery}
                  onChange={(e) => setCustomRefQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customRefQuery.trim()) {
                      openMcheyneStyleVerseInspector(customRefQuery.trim());
                    }
                  }}
                  placeholder="다른 구절 원어 검색 (예: 열왕기하 21:1, 창세기 1:1, 로마서 8:28)"
                  className={`flex-1 px-2.5 py-1 rounded-lg border text-[11.5px] font-bold outline-none ${
                    isDark ? 'bg-black/40 border-slate-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => openMcheyneStyleVerseInspector(customRefQuery || activeReferenceStr)}
                  className="px-3 py-1 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] font-bold cursor-pointer shrink-0"
                >
                  구절 이동
                </button>
              </div>

              {selectedWordDetail && (
                <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#161D2B] border-slate-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">본문 출현형 (INFLECTED)</span>
                    <div className="flex items-baseline gap-2">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold text-stone-900 dark:text-slate-100">
                        {cleanTypography(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      </span>
                      <span className="text-xs font-mono text-stone-500 dark:text-slate-300">{selectedWordDetail.pron}</span>
                    </div>
                    <p className="text-xs font-bold">
                      번역: <span className="underline underline-offset-2 text-indigo-700 dark:text-indigo-300">{selectedWordDetail.korContextual}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5 border-l pl-2.5 text-left border-stone-200 dark:border-slate-700">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">원형 표제어 (LEMMA)</span>
                    <div className="flex items-baseline gap-2">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold text-stone-900 dark:text-slate-100">
                        {cleanTypography(selectedWordDetail.lemma, inspectorTarget.isOT)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        {selectedWordDetail.strongs}
                      </span>
                    </div>
                    <p className="text-xs font-bold">
                      기본뜻: <b className="text-stone-800 dark:text-slate-200">{selectedWordDetail.korLemma}</b>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <p className="text-[12.5px] font-serif font-medium leading-relaxed">
                  <span className="text-[9.5px] font-bold text-stone-400 mr-1">[개역]</span>
                  {inspectorTarget.text}
                </p>
                {inspectorTarget.easyText && (
                  <p className="text-[12px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                    <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mr-1">[쉬운]</span>
                    {inspectorTarget.easyText}
                  </p>
                )}
                {inspectorTarget.webText && (
                  <p className="text-[11.5px] font-serif leading-relaxed text-blue-800 dark:text-blue-300">
                    <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 mr-1">[WEB]</span>
                    {inspectorTarget.webText}
                  </p>
                )}
              </div>
            </div>

            <div className={`flex gap-1 overflow-x-auto hide-scrollbar p-1 rounded-xl border my-2 shrink-0 ${
              isDark ? 'bg-black/40 border-slate-800' : 'bg-stone-100 border-stone-200'
            }`}>
              <button
                type="button"
                onClick={() => setModalTab('scholarly')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  modalTab === 'scholarly' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                📜 10대 학술 사료
              </button>
              <button
                type="button"
                onClick={() => setModalTab('concordance')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  modalTab === 'concordance' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                📊 전권 용례 ({concordanceTotalCount}회)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('custom_study')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  modalTab === 'custom_study' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                ✍️ 연구 메모
              </button>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-2 flex-1 text-xs text-left">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#141A26] border-slate-700' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider block mb-1">어절 선택</span>
                {isInspectorLoading ? (
                  <div className="py-3 text-center text-stone-400">어휘 로딩 중...</div>
                ) : (
                  <div className={`flex flex-wrap gap-x-2 gap-y-1 items-baseline ${inspectorTarget.isOT ? 'justify-end' : 'justify-start'}`} dir={inspectorTarget.isOT ? 'rtl' : 'ltr'}>
                    {inspectorWords.map(w => (
                      <span
                        key={w.id}
                        onClick={() => handleSelectInspectorWord(w)}
                        style={originalFontStyle(inspectorTarget.isOT)}
                        className={`text-[19px] sm:text-[22px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                          selectedWordDetail?.order === w.order 
                            ? 'bg-amber-600 text-white ring-2 ring-amber-500' 
                            : isDark ? 'text-slate-100 hover:bg-white/10' : 'text-stone-900 hover:bg-black/5'
                        }`}
                      >
                        {cleanTypography(w.inflected, inspectorTarget.isOT)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {modalTab === 'scholarly' && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border bg-sky-50/70 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/60 text-sky-950 dark:text-sky-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px]">🔗 교차참조 (TSK) - {crossRefs.length}개</span>
                      <span className="text-[9.5px] opacity-75">클릭 시 아크 대조 오픈</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto hide-scrollbar">
                      {crossRefs.map((ref, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomRefQuery(ref.label);
                            setInspectorTarget(null);
                            setArcModalInitialMode('arc');
                            setIsArcModalOpen(true);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-white hover:bg-amber-100 dark:bg-black/40 dark:hover:bg-amber-950/50 border-stone-200 dark:border-slate-700 cursor-pointer transition-colors"
                        >
                          {ref.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentHebrewSyntax && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60 text-amber-950 dark:text-amber-200">
                      <span className="font-bold text-[11px] block">📜 BHS 히브리어 구문론 구조</span>
                      {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                        <div key={idx} className="p-1 rounded bg-white dark:bg-[#121824] flex justify-between text-[11px]">
                          <span style={originalFontStyle(true)} className="font-bold">{c.unit}</span>
                          <span className="text-stone-500">{c.role}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentCommentary && (
                    <div className="p-2.5 rounded-xl border bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/60 text-indigo-950 dark:text-indigo-200">
                      <span className="font-bold text-[11px] block mb-0.5">📖 학술 주석 ({currentCommentary.commentator})</span>
                      <p className="text-[11.5px] leading-relaxed font-serif">{decodeHtmlEntities(currentCommentary.exegesis)}</p>
                    </div>
                  )}

                  {currentMatthewHenry && (
                    <div className="p-2.5 rounded-xl border bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200">
                      <span className="font-bold text-[11px] block mb-0.5">🌿 매튜 헨리 묵상 강해</span>
                      <p className="text-[11.5px] leading-relaxed font-serif">{decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}</p>
                    </div>
                  )}

                  {currentTargumPeshitta && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-orange-50/70 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/60 text-orange-950 dark:text-orange-200">
                      <span className="font-bold text-[11px] block">🏺 고대 아람어 타르굼 & 시리아 페시타</span>
                      {currentTargumPeshitta.targumAramaic && (
                        <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-right text-[14px] font-bold" dir="rtl">{currentTargumPeshitta.targumAramaic}</p>
                      )}
                      {currentTargumPeshitta.peshittaSyriac && (
                        <p style={{ fontFamily: "'Estrangelo Edessa', serif" }} className="text-right text-[15px] font-bold" dir="rtl">{currentTargumPeshitta.peshittaSyriac}</p>
                      )}
                    </div>
                  )}

                  {currentNetNote && (
                    <div className="p-2.5 rounded-xl border bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 text-rose-950 dark:text-rose-200">
                      <span className="font-bold text-[11px] block mb-0.5">🔍 NET Bible 비평 각주: {decodeHtmlEntities(currentNetNote.title)}</span>
                      <p className="text-[11.5px] leading-relaxed font-serif">{decodeHtmlEntities(currentNetNote.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'concordance' && (
                <div className="space-y-1">
                  {concordanceList.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg border flex items-center justify-between bg-white dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                      <span className="font-bold min-w-[70px]">{item.book} {item.chapter}:{item.verse}</span>
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[15px]">{cleanTypography(item.original_word, inspectorTarget.isOT)}</span>
                      <span className="text-stone-600 dark:text-slate-300 truncate max-w-[120px] text-right font-medium">{item.korean_trans}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'custom_study' && selectedWordDetail && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInputTrans}
                    onChange={(e) => setCustomInputTrans(e.target.value)}
                    placeholder="대표 번역어..."
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border outline-none border-stone-300 dark:border-slate-700 bg-white dark:bg-black/50"
                  />
                  <textarea
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    rows={3}
                    placeholder="신학 연구 메모..."
                    className="w-full p-2 rounded-lg text-xs font-medium border outline-none resize-none border-stone-300 dark:border-slate-700 bg-white dark:bg-black/50"
                  />
                </div>
              )}
            </div>

            {selectedWordDetail && (
              <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertWordToSermonNote(selectedWordDetail)}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[12px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📝 묵상 노트에 강해 삽입
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className="px-4 py-2.5 rounded-lg font-bold text-[12px] flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700"
                >
                  🔊 낭독
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🌈 [핵심 기능 4] 구속사 아크 & 성경 은하계 올인원 팝업 (rootFullscreen 내부!) */}
      {/* ===================================================================== */}
      <BibleGalaxyArcModal
        isOpen={isArcModalOpen}
        onClose={() => setIsArcModalOpen(false)}
        initialMode={arcModalInitialMode}
        initialRefQuery={activeReferenceStr}
        setActiveScreen={setActiveScreen}
        onInsertInsight={(formattedText) => {
          const prev = safeDay.sermonNotes || '';
          const htmlSnippet = `<p>${formattedText.replace(/\n/g, '<br/>')}</p>`;
          updateDay && updateDay({ sermonNotes: prev + htmlSnippet });
          setIsArcModalOpen(false);
          showToast('🌈 신구약 구속사 아크 대조 내용이 설교 필기장에 삽입되었습니다!');
        }}
      />

      {/* ===================================================================== */}
      {/* 📅 [기존 모달 유지] 1~12월 기상오기 링크 사용자 전체 관리 모달          */}
      {/* ===================================================================== */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-[99995] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#16181D] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
            <div className="px-5 py-3.5 border-b border-stone-200 dark:border-white/10 flex justify-between items-center bg-stone-50 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span className="font-bold text-[14px]">1월~12월 월별 기상오기 영상 링크 관리</span>
              </div>
              <button onClick={() => setShowMonthlyModal(false)} className="text-xs font-bold text-stone-400 hover:text-stone-800 dark:hover:text-white p-1 cursor-pointer">
                닫기 ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 hide-scrollbar text-[12px]">
              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
                각 월에 상영될 기상오기 또는 홍보영상 유튜브 링크를 입력하세요. 저장 시 해당 월의 예배 노트에 자동으로 반영됩니다.
              </p>

              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const isCurrent = m === currentMonthNum;
                const mUrl = monthlyGisanUrls[m] || '';

                return (
                  <div key={m} className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${isCurrent ? 'border-stone-500 bg-stone-100/60 dark:bg-white/10' : (isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50/50')}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-stone-800 dark:bg-white' : 'bg-stone-300'}`} />
                        {m}월 기상오기 영상 {isCurrent && <b className="text-stone-700 dark:text-stone-200 text-[10px]">[이번 달]</b>}
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <input 
                        type="text" 
                        value={mUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMonthlyGisanUrls(prev => ({ ...prev, [m]: val }));
                        }}
                        placeholder={`https://youtu.be/... (${m}월 유튜브 링크)`}
                        className={`flex-1 px-2.5 py-1.5 text-[11.5px] rounded-lg border outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 border-t border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black/20 flex gap-2">
              <button 
                onClick={() => setShowMonthlyModal(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-white/10 font-bold text-[12px] cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5"
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(monthlyGisanUrls));
                  if (monthlyGisanUrls[currentMonthNum]) {
                    localStorage.setItem(`app_active_gisangogi_url_${currentMonthNum}`, monthlyGisanUrls[currentMonthNum]);
                    localStorage.setItem('app_active_gisangogi_url', monthlyGisanUrls[currentMonthNum]);
                    if (setGisangogiUrl) setGisangogiUrl(monthlyGisanUrls[currentMonthNum]);
                    if (updateDay) updateDay({ sermonVideoUrl: monthlyGisanUrls[currentMonthNum] });
                  }
                  setShowMonthlyModal(false);
                  showToast("✨ 1~12월 기상오기 링크가 모두 저장되었습니다!");
                }}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-[12px] cursor-pointer"
              >
                전체 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
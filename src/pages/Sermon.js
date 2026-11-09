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

// 성경 구절 정밀 정규식 추출기
const extractBibleReferences = (text) => {
  if (!text) return [];
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)];
  return Array.from(new Set(matches.map(m => m[0].trim())));
};

// =====================================================================
// 성경 66권 메타데이터 및 원어 형태소 해석기
// =====================================================================
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

// 내장 성경 DB에서 설교 본문 구절 추출
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

// 성경 66권 키워드 검색 엔진
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
// 고정밀 OCR 엔진 (패딩 여백 확보 + 소프트 그레이스케일 + PSM 단일 블록)
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

const createHighAccuracyOcrImage = (sourceCanvas, cropMode = 'question_box') => {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  // 좌우 사이드바 및 하단 컨트롤 바를 완전히 배제하고 중앙 자막 영역만 크롭
  let cropX = Math.floor(sw * 0.15);
  let cropW = Math.floor(sw * 0.70);
  let cropY = Math.floor(sh * 0.52);
  let cropH = Math.floor(sh * 0.34);

  if (cropMode === 'subtitle_bottom') {
    cropX = Math.floor(sw * 0.16);
    cropW = Math.floor(sw * 0.68);
    cropY = Math.floor(sh * 0.64);
    cropH = Math.floor(sh * 0.22);
  } else if (cropMode === 'full') {
    cropX = Math.floor(sw * 0.10);
    cropW = Math.floor(sw * 0.80);
    cropY = Math.floor(sh * 0.14);
    cropH = Math.floor(sh * 0.72);
  }

  const scale = 2.2;
  const pad = 28; // Tesseract 인식률 향상을 위한 외곽 순백색 여백(Padding)
  const innerW = Math.max(420, Math.floor(cropW * scale));
  const innerH = Math.max(140, Math.floor(cropH * scale));
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
  const isDarkBg = avgLum < 145;

  for (let i = 0; i < data.length; i += 4) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (isDarkBg) {
      lum = 255 - lum;
    }
    // 글자 획의 안티앨리어싱을 보존하면서 배경 노이즈만 제거하는 소프트 S-커브 대비
    let contrasted = (lum - 128) * 1.55 + 128;
    if (contrasted > 215) contrasted = 255;
    if (contrasted < 50) contrasted = 0;

    const finalVal = Math.max(0, Math.min(255, Math.round(contrasted)));
    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, pad, pad);

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

const cleanKoreanOcrText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map(line =>
      line
        .replace(/[|¦_~`^\\/<>{}[\]§¶©®™;]/g, ' ')
        .replace(/\b\d{5,}\b/g, '')
        .replace(/^[-—=+\s]+/, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(line => {
      if (line.length < 2) return false;
      const hasKorean = /[가-힣]/.test(line);
      const hasValidWord = /[a-zA-Z]{3,}/.test(line);
      return hasKorean || hasValidWord;
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
const IconPen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const IconHeart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconDocument = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconTool = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
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
  const captureInputRef = useRef(null);

  const [isSanctuaryMode, setIsSanctuaryMode] = useState(() => {
    return localStorage.getItem('sermon_sanctuary_mode') === 'true';
  });

  // 스크롤 시에도 유튜브 영상을 상단에 고정해 보면서 필기할 수 있는 PIP 고정 모드
  const [isVideoPinned, setIsVideoPinned] = useState(false);

  const [showOutlineBuilder, setShowOutlineBuilder] = useState(true);
  const [actionToast, setActionToast] = useState(null);
  const [linkedRefs, setLinkedRefs] = useState([]);
  const [activeBacklink, setActiveBacklink] = useState(null);

  // =====================================================================
  // 고도화된 실시간 음성 받아쓰기(STT) 상태 (타겟 지정 및 실시간 프리뷰 지원)
  // =====================================================================
  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const [sttTargetField, setSttTargetField] = useState('notes'); // 'notes' | 'conviction' | 'point1' | 'point2' | 'point3' | 'apply'
  const [sttInterimText, setSttInterimText] = useState('');
  const sermonRecRef = useRef(null);
  const sttTargetRef = useRef('notes');
  useEffect(() => { sttTargetRef.current = sttTargetField; }, [sttTargetField]);

  // =====================================================================
  // 전체화면 시네마 워크스테이션 & 원어·아크·말씀찾기 상태
  // =====================================================================
  const [isLiveCinemaMode, setIsLiveCinemaMode] = useState(false);
  const [cinemaHudTab, setCinemaHudTab] = useState('outline'); // 'scripture' | 'memo' | 'outline' | 'captures' | 'thanks' | null
  const [isCinemaUiHidden, setIsCinemaUiHidden] = useState(false);
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcModalInitialMode, setArcModalInitialMode] = useState('arc');
  const [selectedWordVerse, setSelectedWordVerse] = useState(1);
  const [customRefQuery, setCustomRefQuery] = useState('');

  // 성경말씀 & 예시구절 멀티 검색 팝업 상태
  const [isBibleFinderOpen, setIsBibleFinderOpen] = useState(false);
  const [finderMode, setFinderMode] = useState('ref');
  const [finderRefInput, setFinderRefInput] = useState('로마서 8:28-30');
  const [finderBookKo, setFinderBookKo] = useState('로마서');
  const [finderChapter, setFinderChapter] = useState(8);
  const [finderKeyword, setFinderKeyword] = useState('');
  const [finderKeywordResults, setFinderKeywordResults] = useState([]);

  // 맥체인 동일 10대 학술 원어 강해 모달 상태
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
  // 화면 캡처 & OCR 자막 추출 상태
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
    return (customRefQuery && customRefQuery.trim()) || safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference || '로마서 8:28';
  }, [customRefQuery, safeDay.sermonReference, globalSharedQt, date]);

  const localScriptureData = useMemo(() => {
    return getLocalScriptureVerses(activeReferenceStr);
  }, [activeReferenceStr]);

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
    setTimeout(() => setActionToast(null), 2600);
  }, []);

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
    const queryStr = customRefStr || activeReferenceStr || '로마서 8:28';
    const scriptData = getLocalScriptureVerses(queryStr);
    const parsed = scriptData.parsed || { bookKo: '로마서', bookEn: 'Romans', chapter: 8, startV: 28 };

    const koBook = parsed.bookKo || '로마서';
    const chNum = parsed.chapter || 1;
    const vNum = targetVerseNum || parsed.startV || 1;
    const bookInfo = BIBLE_66_MAP[koBook] || BIBLE_66_MAP[parsed.bookEn] || { ko: koBook, isOT: false };
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
  // 화면 캡처 및 OCR 실행 핸들러
  // =====================================================================
  const runOcrOnCaptureItem = useCallback(async (captureItem) => {
    if (!captureItem || !captureItem.imageUrl) return;
    setOcrLoadingId(captureItem.id);
    showToast('자막 텍스트를 추출하고 있습니다...');

    try {
      const Tesseract = await ensureTesseractLoaded();
      const targetImg = captureItem.preprocessedUrl || captureItem.subtitleCropUrl || captureItem.imageUrl;

      const result = await Tesseract.recognize(targetImg, 'kor+eng');
      const cleaned = cleanKoreanOcrText(result?.data?.text || '');

      const finalExtracted = cleaned || '자막을 명확히 인식하지 못했습니다. 우측 입력란에서 직접 수정하거나 다른 영역 모드로 캡처해 주세요.';

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

      showToast('자막 텍스트 추출이 완료되었습니다.');
    } catch (err) {
      console.error('OCR Error:', err);
      showToast('텍스트 판독 중 오류가 발생했습니다.');
    } finally {
      setOcrLoadingId(null);
    }
  }, [date, updateDay, showToast]);

  const processCapturedCanvasToItem = useCallback(async (sourceCanvas, label = '예배 영상 캡처') => {
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

        await processCapturedCanvasToItem(canvas, '실시간 자막 캡처');
      } else {
        captureInputRef.current?.click();
      }
    } catch (err) {
      showToast('모바일이거나 화면 공유가 취소된 경우 [이미지 불러오기]를 이용해 주세요.');
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
        await processCapturedCanvasToItem(canvas, '이미지 업로드 캡처');
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
              await processCapturedCanvasToItem(canvas, '클립보드 캡처');
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
    if (!text || !text.trim()) return alert('등록할 텍스트가 없습니다.');
    const curQuestions = getArr ? [...getArr(safeDay.applyQuestions)] : [];
    const nextQuestions = [...curQuestions, text.trim()];
    updateDay && updateDay({ applyQuestions: nextQuestions });
    showToast('추출된 텍스트가 [적용 질문]에 등록되었습니다.');
  };

  const handleSendOcrToSermonNotes = (capItem) => {
    if (!capItem) return;
    const prev = safeDay.sermonNotes || '';
    const snippet = `<div style="margin:10px 0; padding:12px; border:1px solid #cbd5e1; border-radius:10px; background:rgba(15,23,42,0.03);"><p><b>[예배 영상 캡처 (${capItem.timestamp})]</b></p><p>${(capItem.ocrText || '').replace(/\n/g, '<br/>')}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast('추출된 텍스트가 설교 필기장 본문에 삽입되었습니다.');
  };

  const handleInsertVerseToSermonNotes = (refLabel, verseText) => {
    const prev = safeDay.sermonNotes || '';
    const snippet = `<div style="margin:8px 0; padding:10px 14px; border-left:3px solid #334155; background:rgba(15,23,42,0.04); border-radius:6px;"><p><b>[${refLabel}]</b> ${verseText}</p></div><p><br/></p>`;
    updateDay && updateDay({ sermonNotes: prev + snippet });
    showToast(`[${refLabel}] 말씀이 설교 필기장에 삽입되었습니다.`);
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
  // 영상 URL 관리 (기상오기 종료 후에도 기상오기 영상이 뜨던 버그 수정!)
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

  // [핵심 수정] 기상오기 기간(isSp === true)일 때만 기상오기 영상을 사용하고, 평상시에는 절대 기상오기 홍보영상으로 폴백하지 않음!
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
  // 세밀화된 실시간 STT(음성 필기) 엔진 — 필드 타겟팅 & 실시간 미리보기 지원
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

  return (
    <div
      ref={rootSermonFullscreenRef}
      className={`flex-1 flex flex-col h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0C0E12]' : 'bg-[#F8F9FA]'}`}
    >
      <BacklinkPanel />

      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadCaptureFile}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* 1. 상단 글로벌 헤더 바 (모바일 타이틀 세로 찌그러짐 현상 100% 해결!) */}
      {/* ===================================================================== */}
      <header className={`shrink-0 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 z-20 border-b relative ${isDark ? 'border-white/10 bg-[#12141A]' : 'border-stone-200/90 bg-white'}`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-stone-100'}`}
          >
            <IconArrowLeft />
          </button>
          <h1 className={`text-[15.5px] sm:text-[16.5px] font-bold tracking-tight whitespace-nowrap shrink-0 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            예배 노트
          </h1>
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
            <IconMaximize /> <span>전체화면 노트</span>
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
            <IconTool /> <span>{showToolbar ? '도구 닫기' : '서식'}</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDark ? 'text-white hover:bg-white/10' : 'text-stone-800 hover:bg-stone-100'}`}
          >
            <IconMenu />
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
      <CanvasEngine key={`sermon_${date}`} saveKey={`sermon_${date}`} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} renderStickers={() => StickerLayer ? <StickerLayer memos={safeDay.memos} stickers={safeDay.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} /> : null}>
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
                <IconList /> <span>노트 목록</span>
              </button>
              <button
                onClick={downloadSermonWord}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 cursor-pointer hover:opacity-90 whitespace-nowrap"
              >
                <IconSave /> <span>Word 저장</span>
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
                  onPointerDown={e => e.stopPropagation()} 
                  placeholder="본문 구절 (예: 롬 8:28-30)" 
                  className={`flex-1 min-w-0 px-3.5 py-2 rounded-lg text-[13px] font-medium outline-none border transition-all ${
                    isDark ? 'bg-[#0E1015] border-white/10 text-white focus:border-stone-400' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                  }`} 
                />
                <button 
                  onClick={() => findBibleText && findBibleText(safeDay.sermonReference || globalSharedQt?.[date]?.sermonData?.reference)} 
                  className={`shrink-0 px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  <IconBookOpen /> <span>본문 보기</span>
                </button>
              </div>
            </div>

            {/* 4대 성경 연구 툴바 (모바일 2x2 그리드, 태블릿/PC 4열 그리드, 깔끔한 무채색 SaaS 버튼) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setFinderRefInput(activeReferenceStr);
                  setIsBibleFinderOpen(true);
                }}
                className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <IconSearch /> <span>말씀·예시 찾기</span>
              </button>
              <button
                type="button"
                onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <IconBookOpen /> <span>원어 강해</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('arc');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>신구약 아크</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArcModalInitialMode('2d');
                  setIsArcModalOpen(true);
                }}
                className={`py-2 px-2.5 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#0E1015] hover:bg-white/10 border-white/15 text-stone-100' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <span>말씀 은하계</span>
              </button>
            </div>

            {/* 핵심 요약 한 문장 */}
            <div className="pt-0.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <div className={`p-3 rounded-lg border flex flex-col gap-1 text-left ${isDark ? 'bg-[#0E1015] border-white/10' : 'bg-stone-50/80 border-stone-200/90'}`}>
                <span className={`text-[11px] font-bold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  핵심 요절 및 설교 한 문장 요약
                </span>
                <input 
                  type="text" 
                  value={safeDay.sermonConviction || ''} 
                  onChange={e => updateDay && updateDay({ sermonConviction: e.target.value })} 
                  placeholder="설교 중 가장 중심이 되는 핵심 문장을 기록하세요" 
                  className={`w-full bg-transparent outline-none text-[13.5px] font-medium ${isDark ? 'text-white placeholder:text-stone-600' : 'text-stone-900 placeholder:text-stone-400'}`} 
                />
              </div>
            </div>

            {/* 지식 그래프 백링크 태그 */}
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
          {/* 3. 유튜브 예배 영상 시청 섹션 (유튜브 검색 ↗ · 공유 복구 & 기상오기 버그 해결 & 상단 고정 PIP 지원!) */}
          {/* ===================================================================== */}
          {!isSanctuaryMode && (
            <div
              onPointerDown={e => e.stopPropagation()}
              className={`p-4 rounded-xl border flex flex-col gap-3 ignore-draw transition-all ${
                isVideoPinned ? 'sticky top-2 z-30 shadow-2xl ring-1 ring-stone-400/30' : ''
              } ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}
            >
              {/* 상단 타이틀 & 유튜브 검색 / 공유 / 상단고정 제어줄 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <IconVideo />
                  <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {isSp ? `${currentMonthNum}월 특별집회 영상 시청` : '주일 예배 영상 시청'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border flex items-center gap-1 transition-colors whitespace-nowrap ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>유튜브 검색</span> <IconExternal />
                  </a>

                  <button
                    type="button"
                    onClick={handleShareVideo}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold border flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <IconShare /> <span>공유</span>
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

              {/* 유튜브 URL 입력창 & 작업 단축 버튼 */}
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

                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCaptureYoutubeScreen}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg border text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/15' : 'bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200'
                    }`}
                  >
                    <IconCamera /> <span>자막 캡처·OCR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => enterLiveCinemaFullscreen('outline')}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <IconMaximize /> <span>전체화면 워크스테이션</span>
                  </button>
                </div>
              </div>

              {/* 유튜브 플레이어 뷰포트 */}
              {!isLiveCinemaMode && (
                <div className={`w-full ${isVideoPinned ? 'max-h-[210px] sm:max-h-[260px]' : ''} aspect-video rounded-xl overflow-hidden bg-[#0A0C10] relative border border-black/10 dark:border-white/10`}>
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <p className="text-[12.5px] font-medium text-stone-400">
                        우측 상단의 [유튜브 검색]으로 설교 영상을 찾아 주소를 붙여넣으세요.
                      </p>
                      <a
                        href={`https://www.youtube.com/results?search_query=김포좋은나무교회+${ymdStr}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-bold border border-white/15 flex items-center gap-1.5"
                      >
                        <span>김포좋은나무교회 설교 검색하기</span> <IconExternal />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 설교 3대지 구조화 빌더 */}
          <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
            <div 
              onClick={() => setShowOutlineBuilder(!showOutlineBuilder)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                설교 대지 구조화 (3-Point Outline)
              </span>
              <IconChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showOutlineBuilder ? 'rotate-180' : ''}`} />
            </div>

            {showOutlineBuilder && (
              <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-white/10 ignore-draw" onPointerDown={e => e.stopPropagation()}>
                {[
                  { key: 'sermonPoint1', label: '제1대지: 본문 관찰 및 하나님의 성품', code: 'POINT 01', ph: '첫 번째 대지 핵심 내용을 입력하세요' },
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
          {/* 4. 화면 캡처 및 자막 텍스트(OCR) 추출 보관함 */}
          {/* ===================================================================== */}
          <div
            onPointerDown={e => e.stopPropagation()}
            className={`p-4 rounded-xl border space-y-3 ignore-draw ${
              isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <IconCamera />
                <span className={`font-bold text-[13.5px] ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  화면 캡처 및 자막 텍스트 추출 ({sermonCaptures.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={ocrCropPreset}
                  onChange={(e) => setOcrCropPreset(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold outline-none cursor-pointer ${
                    isDark ? 'bg-[#0E1015] border-white/15 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <option value="question_box">하단 자막·질문박스 영역</option>
                  <option value="subtitle_bottom">하단 좁은 자막바 영역</option>
                  <option value="full">전체 화면 영역</option>
                </select>

                <button
                  type="button"
                  onClick={handleCaptureYoutubeScreen}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <IconCamera /> <span>화면 캡처</span>
                </button>
                <button
                  type="button"
                  onClick={() => captureInputRef.current?.click()}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer whitespace-nowrap ${
                    isDark ? 'bg-white/5 border-white/15 text-stone-200 hover:bg-white/10' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  이미지 불러오기
                </button>
              </div>
            </div>

            {sermonCaptures.length === 0 ? (
              <div className={`py-6 px-4 rounded-xl border border-dashed text-center text-xs space-y-1 ${
                isDark ? 'border-white/10 text-stone-400 bg-[#0E1015]' : 'border-stone-200 text-stone-500 bg-stone-50/60'
              }`}>
                <p className="font-bold">영상 하단에 적용 질문이나 자막이 표시될 때 [화면 캡처]를 클릭하세요.</p>
                <p className="text-[11px] opacity-80">캡처된 이미지에서 텍스트를 자동 추출하여 적용 질문이나 본문 노트에 바로 삽입할 수 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 hide-scrollbar">
                {sermonCaptures.map((cap) => (
                  <div
                    key={cap.id}
                    className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-3 items-start ${
                      isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="sm:col-span-5 flex flex-col gap-1.5">
                      <div className="relative rounded-lg overflow-hidden border border-white/15 bg-black aspect-video">
                        <img src={cap.subtitleCropUrl || cap.imageUrl} alt="Capture" className="w-full h-full object-contain" />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] font-bold">
                          {cap.timestamp}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => runOcrOnCaptureItem(cap)}
                          disabled={ocrLoadingId === cap.id}
                          className={`flex-1 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                            isDark ? 'bg-white/5 border-white/15 text-stone-200' : 'bg-white border-stone-200 text-stone-700'
                          }`}
                        >
                          {ocrLoadingId === cap.id ? '판독 중...' : '텍스트 재추출'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = sermonCaptures.filter(item => item.id !== cap.id);
                            syncCapturesToDay(filtered);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-7 flex flex-col gap-2 h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                            추출된 텍스트 (수정 가능)
                          </span>
                          {ocrLoadingId === cap.id && (
                            <span className="text-[10.5px] font-bold text-amber-500 animate-pulse">인식 중...</span>
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
                          placeholder="추출된 자막 텍스트가 표시됩니다..."
                          className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed outline-none resize-none ${
                            isDark ? 'bg-[#161922] border-white/15 text-white' : 'bg-white border-stone-200 text-stone-900'
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendOcrToApplyQuestions(cap.ocrText)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold cursor-pointer"
                        >
                          적용질문에 등록
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendOcrToSermonNotes(cap)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          필기장 본문에 삽입
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* 5. 설교 필기장 & 실시간 음성 받아쓰기(STT) 타겟팅 컨트롤 */}
          {/* ===================================================================== */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
            <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-stone-200 dark:border-white/10">
              <span className={`font-bold text-[14px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconDocument /> <span>설교 필기 및 말씀 묵상</span>
              </span>

              {/* 세밀화된 STT 타겟 선택 및 녹음 제어 */}
              <div className="flex items-center gap-1.5 ignore-draw" onPointerDown={e => e.stopPropagation()}>
                <select
                  value={sttTargetField}
                  onChange={(e) => setSttTargetField(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-bold outline-none cursor-pointer ${
                    isDark ? 'bg-[#0E1015] border-white/15 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                  title="음성 인식 텍스트가 입력될 위치를 선택합니다"
                >
                  <option value="notes">본문 필기장에 입력</option>
                  <option value="conviction">핵심 한 문장에 입력</option>
                  <option value="point1">제1대지에 입력</option>
                  <option value="point2">제2대지에 입력</option>
                  <option value="point3">제3대지에 입력</option>
                  <option value="apply">적용 질문에 입력</option>
                </select>

                <button 
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSpeechRecording 
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse' 
                      : (isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/15' : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200')
                  }`}
                >
                  <IconMic /> <span>{isSpeechRecording ? '음성 받아쓰기 중지' : '실시간 음성 필기'}</span>
                </button>
              </div>
            </div>

            {/* 실시간 STT 인식 중간 문장 미리보기 바 */}
            {isSpeechRecording && (
              <div className={`px-3.5 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="font-bold shrink-0">실시간 음성 인식 중:</span>
                  <span className="truncate italic">
                    {sttInterimText || '말씀 소리를 듣고 있습니다...'}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full bg-transparent">
              <RichTextEditor 
                ref={sermonEditorRef} 
                value={safeDay.sermonNotes} 
                onChange={(val) => updateDay({ sermonNotes: val })} 
                t={t} 
                isSp={isSp} 
                bibles={bibles} 
                placeholder="설교 말씀을 기록하세요. 본문 중에 '로마서 8:28' 입력 후 스페이스바를 누르면 말씀 구절이 자동 삽입됩니다." 
              />
            </div>
            
            {/* 한줄 은혜 및 실천 결단 */}
            <div className="pt-3 space-y-2 ignore-draw border-t border-stone-200 dark:border-white/10">
              <span className="font-bold text-[12px] text-stone-500 flex items-center gap-1.5">
                <IconTarget /> <span>설교 핵심 은혜 및 삶의 실천 목표 (적용 트래커 연동)</span>
              </span>

              <input 
                type="text" 
                value={safeDay.sermonGraceLine || ''} 
                onChange={(e) => handleGraceLineSync(e.target.value)} 
                placeholder="오늘 말씀에서 깨달은 핵심 은혜를 한 줄로 정리해 보세요" 
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] font-medium outline-none ${
                  isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`} 
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
                placeholder="이번 주 구체적인 삶의 실천 결단 1가지" 
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] font-bold outline-none ${
                  isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`} 
                onPointerDown={e => e.stopPropagation()} 
              />
            </div>

            {/* 신앙 연동 액션 허브 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 ignore-draw" onPointerDown={e => e.stopPropagation()}>
              <button 
                onClick={inlineActionSendToTracker}
                className={`py-2.5 px-3 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white' : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                }`}
              >
                적용 트래커에 등록
              </button>
              <button 
                onClick={inlineActionSendToPrayer}
                className={`py-2.5 px-3 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white' : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                }`}
              >
                나의 기도함에 보관
              </button>
              <button 
                onClick={inlineActionSendToCounseling}
                className={`py-2.5 px-3 rounded-lg border text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white' : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                }`}
              >
                1:1 목양 상담 요청
              </button>
            </div>
          </div>

          {/* 나의 감사 선포 */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`}>
            <div className="flex justify-between items-center mb-2.5">
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className={`font-bold text-[13.5px] flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconHeart /> <span>나의 감사 선포</span>
              </span>
              <span onClick={() => openModal && openModal('thanksDeclaration', safeDay, updateDay)} className="text-[11.5px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-white cursor-pointer">
                작성 및 편집
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {(getArr ? getArr(safeDay.thanksDeclarations, ['', '']) : []).map((q, i) => (
                <div key={i} className={`px-3.5 py-2.5 rounded-lg border flex justify-between items-center ${isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`}>
                  <div className="flex gap-2 items-start min-w-0 pr-2">
                    <span className="font-bold text-[12px] text-stone-400 mt-0.5">{i + 1}.</span>
                    <span className="text-[13px] font-medium leading-relaxed truncate">{q || <span className="opacity-45 text-stone-400">말씀을 통해 깨달은 감사를 기록하세요</span>}</span>
                  </div>
                  {q && q.trim() && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendDeclarationToCell(q); }}
                      className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-white/10 hover:bg-white text-stone-200 hover:text-stone-900' : 'bg-stone-200 hover:bg-stone-900 text-stone-800 hover:text-white'
                      }`}
                    >
                      <IconSend /> <span>목장 공유</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 설교 속 적용 질문 */}
          <div className={`p-4 rounded-xl border cursor-pointer transition-colors hover:border-stone-400 ${isDark ? 'bg-[#161922] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'}`} onClick={() => openModal && openModal('applyQuestion', safeDay, updateDay)}>
            <div className="flex justify-between items-center mb-2.5">
              <span className={`font-bold text-[13.5px] flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                <IconPen /> <span>설교 적용 질문</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleAiDetect && toggleAiDetect(); }}
                className={`flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  isAiDetecting ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : (isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-stone-100 border-stone-200 text-stone-800')
                }`}
              >
                <IconMic /> <span>{isAiDetecting ? '질문 감지 중...' : '적용질문 음성감지'}</span>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(getArr && getArr(safeDay.applyQuestions).length > 0) ? getArr(safeDay.applyQuestions).map((q, i) => (
                <div key={i} className={`px-3.5 py-2.5 rounded-lg border flex gap-2 items-start ${isDark ? 'bg-[#0E1015] border-white/10 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`}>
                  <span className="font-bold text-[12px] text-stone-400 mt-0.5">{i + 1}.</span>
                  <span className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{q}</span>
                </div>
              )) : (
                <div className={`text-center py-3 rounded-lg text-[12.5px] font-medium border ${isDark ? 'bg-[#0E1015] border-white/10 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                  등록된 적용 질문이 없습니다. (터치하여 직접 추가하거나 화면 캡처로 등록하세요)
                </div>
              )}
            </div>
          </div>

        </div>
      </CanvasEngine>
      )}

      {/* ===================================================================== */}
      {/* 6. 전체화면 라이브 워크스테이션 (배경 비침 없는 고가독성 다크 스튜디오 UI) */}
      {/* ===================================================================== */}
      {isLiveCinemaMode && (
        <div className="fixed inset-0 z-[99980] bg-black flex flex-col justify-between overflow-hidden select-none font-sans">
          {/* 배경 유튜브 풀스크린 */}
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
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-3 p-6 text-center bg-[#0B0D11]">
                <p className="text-sm font-bold text-white">등록된 유튜브 영상 링크가 없습니다.</p>
                <input
                  type="text"
                  placeholder="유튜브 라이브 또는 설교 URL 붙여넣기"
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
                  className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[#161920] border border-white/20 text-white text-xs outline-none"
                />
              </div>
            )}
          </div>

          {isCinemaUiHidden ? (
            <div className="relative z-30 mt-auto ml-auto p-4 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleCaptureYoutubeScreen}
                className="px-3.5 py-2 rounded-lg bg-white text-stone-950 text-xs font-bold shadow-2xl flex items-center gap-1.5 cursor-pointer"
              >
                <IconCamera /> <span>자막 캡처</span>
              </button>
              <button
                onClick={() => setIsCinemaUiHidden(false)}
                className="px-4 py-2 rounded-lg bg-[#111318] text-white text-xs font-bold border border-white/25 shadow-2xl cursor-pointer"
              >
                노트 패널 열기
              </button>
            </div>
          ) : (
            <>
              {/* 상단 상태 바 */}
              <div className="relative z-20 px-4 py-2.5 bg-[#0F1116] border-b border-white/15 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-bold shrink-0">
                    LIVE
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {safeDay.sermonTitle || '주일 예배 실황 노트'}
                  </span>
                  <span className="text-xs font-mono text-stone-300 shrink-0">
                    [{activeReferenceStr}]
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsBibleFinderOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1C2029] hover:bg-[#262B36] text-stone-100 text-xs font-bold border border-white/15 cursor-pointer"
                  >
                    말씀·예시 찾기
                  </button>
                  <button
                    onClick={handleCaptureYoutubeScreen}
                    className="px-3 py-1.5 rounded-lg bg-[#1C2029] hover:bg-[#262B36] text-stone-100 text-xs font-bold border border-white/15 flex items-center gap-1 cursor-pointer"
                  >
                    <IconCamera /> <span>자막 캡처</span>
                  </button>
                  <button
                    onClick={() => setIsCinemaUiHidden(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1C2029] hover:bg-[#262B36] text-stone-300 text-xs font-bold border border-white/15 cursor-pointer"
                  >
                    화면 숨김
                  </button>
                  <button
                    onClick={exitLiveCinemaFullscreen}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-200 text-stone-950 text-xs font-bold cursor-pointer"
                  >
                    전체화면 종료
                  </button>
                </div>
              </div>

              {/* 우측 불투명 스튜디오 워크스테이션 패널 (배경 비침 0%, 최상급 가독성!) */}
              {cinemaHudTab && (
                <div className="relative z-20 ml-auto mr-3 sm:mr-5 my-auto w-[94vw] sm:w-[440px] max-h-[74vh] rounded-2xl bg-[#111318] border border-white/25 shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden pointer-events-auto text-white">
                  
                  <div className="px-4 py-3 bg-[#181B22] border-b border-white/15 flex flex-col gap-2.5 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold text-white">
                        {cinemaHudTab === 'scripture' && '본문 말씀 및 원어 대조'}
                        {cinemaHudTab === 'memo' && '실시간 설교 자유 필기'}
                        {cinemaHudTab === 'outline' && '설교 3대지 및 실천 결단'}
                        {cinemaHudTab === 'captures' && `자막 캡처 및 텍스트 추출 (${sermonCaptures.length})`}
                        {cinemaHudTab === 'thanks' && '나의 감사 선포'}
                      </span>
                      <button
                        onClick={() => setCinemaHudTab(null)}
                        className="text-[11px] font-bold text-stone-300 hover:text-white px-2.5 py-1 rounded bg-white/10 cursor-pointer"
                      >
                        패널 접기
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
                          placeholder="구절 입력 (예: 롬 8:28)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                        />
                        <button
                          onClick={() => setIsBibleFinderOpen(true)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 cursor-pointer"
                        >
                          예시말씀 검색
                        </button>
                        <button
                          onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                          className="px-3 py-1.5 rounded-lg bg-white text-stone-950 font-bold text-xs shrink-0 cursor-pointer"
                        >
                          원어 강해
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar text-left text-xs">
                    {cinemaHudTab === 'scripture' && (
                      <div className="space-y-2">
                        {localScriptureData.verses.length === 0 ? (
                          <p className="text-stone-400 py-8 text-center">상단 입력창에 성경 구절을 입력해 주세요.</p>
                        ) : (
                          localScriptureData.verses.map(v => {
                            const koBook = localScriptureData.parsed?.bookKo || '성경';
                            const ch = localScriptureData.parsed?.chapter || 1;
                            return (
                              <div
                                key={v.vNum}
                                className={`p-3 rounded-xl border transition-all ${
                                  v.isHighlight
                                    ? 'bg-[#1F242F] border-white/40 text-white'
                                    : 'bg-[#161920] border-white/10 text-stone-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                                  <span className="font-mono font-bold text-white">
                                    {koBook} {ch}:{v.vNum}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openMcheyneStyleVerseInspector(`${koBook} ${ch}:${v.vNum}`, v.vNum)}
                                      className="px-2 py-0.5 rounded bg-white text-stone-950 font-bold text-[10.5px] cursor-pointer"
                                    >
                                      원어강해
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomRefQuery(`${koBook} ${ch}:${v.vNum}`);
                                        setArcModalInitialMode('arc');
                                        setIsArcModalOpen(true);
                                      }}
                                      className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-bold text-[10.5px] cursor-pointer"
                                    >
                                      신구약 아크
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInsertVerseToSermonNotes(`${koBook} ${ch}:${v.vNum}`, v.text)}
                                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-stone-200 font-bold text-[10.5px] cursor-pointer"
                                    >
                                      노트삽입
                                    </button>
                                  </div>
                                </div>
                                <span className="font-serif text-[13.5px] leading-relaxed block text-white">{v.text}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {cinemaHudTab === 'memo' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">핵심 한 문장 요약</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="설교 핵심 문장 기록..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-stone-300">설교 본문 노트 (자동 동기화)</label>
                            <button
                              onClick={() => {
                                setSttTargetField('notes');
                                toggleSpeechRecognition();
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                isSpeechRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/15 text-white'
                              }`}
                            >
                              {isSpeechRecording ? '음성인식 중지' : '실시간 음성 필기'}
                            </button>
                          </div>
                          {isSpeechRecording && sttInterimText && (
                            <div className="mb-2 px-2.5 py-1.5 rounded bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200">
                              인식 중: {sttInterimText}
                            </div>
                          )}
                          <textarea
                            rows={10}
                            value={(safeDay.sermonNotes || '').replace(/<[^>]*>?/gm, '')}
                            onChange={(e) => updateDay && updateDay({ sermonNotes: e.target.value })}
                            placeholder="영상을 시청하며 자유롭게 말씀을 필기하세요..."
                            className="w-full p-3 rounded-xl bg-[#0B0D11] border border-white/20 text-white text-[13.5px] leading-relaxed outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {cinemaHudTab === 'outline' && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">핵심 한 문장 요약</label>
                          <input
                            type="text"
                            value={safeDay.sermonConviction || ''}
                            onChange={(e) => updateDay && updateDay({ sermonConviction: e.target.value })}
                            placeholder="설교 핵심 문장..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">1. 제1대지</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint1 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint1: e.target.value })}
                            placeholder="제1대지 핵심 내용..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">2. 제2대지</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint2 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint2: e.target.value })}
                            placeholder="제2대지 핵심 내용..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">3. 제3대지</label>
                          <input
                            type="text"
                            value={safeDay.sermonPoint3 || ''}
                            onChange={(e) => updateDay && updateDay({ sermonPoint3: e.target.value })}
                            placeholder="제3대지 핵심 내용..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-300 block mb-1">이번 주 실천 결단</label>
                          <input
                            type="text"
                            value={safeDay.sermonActionItem || ''}
                            onChange={(e) => handleActionItemSync(e.target.value)}
                            placeholder="구체적인 실천 목표 1가지..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {cinemaHudTab === 'captures' && (
                      <div className="space-y-3">
                        <div className="flex gap-1.5">
                          <select
                            value={ocrCropPreset}
                            onChange={(e) => setOcrCropPreset(e.target.value)}
                            className="px-2.5 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-[11px] font-bold outline-none"
                          >
                            <option value="question_box">하단 질문박스 영역</option>
                            <option value="subtitle_bottom">하단 자막바 영역</option>
                            <option value="full">전체 화면 영역</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleCaptureYoutubeScreen}
                            className="flex-1 py-2 rounded-lg bg-white text-stone-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <IconCamera /> <span>지금 화면 캡처</span>
                          </button>
                        </div>

                        {sermonCaptures.map(cap => (
                          <div key={cap.id} className="p-3 rounded-xl bg-[#0B0D11] border border-white/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10.5px] text-stone-300 font-bold">{cap.timestamp} 캡처</span>
                              <button
                                onClick={() => runOcrOnCaptureItem(cap)}
                                className="text-[10.5px] font-bold text-white hover:underline cursor-pointer"
                              >
                                {ocrLoadingId === cap.id ? '판독 중...' : '텍스트 재추출'}
                              </button>
                            </div>
                            <img src={cap.subtitleCropUrl || cap.imageUrl} alt="cap" className="w-full rounded border border-white/10 max-h-28 object-contain bg-black" />
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
                              className="w-full p-2.5 rounded-lg bg-[#161922] border border-white/20 text-white text-xs outline-none resize-none"
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleSendOcrToApplyQuestions(cap.ocrText)}
                                className="flex-1 py-1.5 rounded-lg bg-white text-stone-950 font-bold text-[11px] cursor-pointer"
                              >
                                적용질문 등록
                              </button>
                              <button
                                onClick={() => handleSendOcrToSermonNotes(cap)}
                                className="flex-1 py-1.5 rounded-lg bg-white/15 text-white font-bold text-[11px] cursor-pointer"
                              >
                                필기장 삽입
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cinemaHudTab === 'thanks' && (
                      <div className="space-y-2.5">
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
                              placeholder="감사 제목 입력..."
                              className="flex-1 px-3 py-2 rounded-lg bg-[#0B0D11] border border-white/20 text-white text-xs outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 하단 컨트롤 독 바 */}
              <div className="relative z-20 pb-4 pt-2 px-3 flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto">
                <div className="flex flex-wrap items-center gap-1 bg-[#111318] border border-white/25 p-1.5 rounded-xl shadow-2xl">
                  {[
                    { id: 'scripture', label: '본문말씀' },
                    { id: 'memo', label: '자유필기' },
                    { id: 'outline', label: '설교3대지' },
                    { id: 'captures', label: `자막캡처(${sermonCaptures.length})` },
                    { id: 'thanks', label: '감사선포' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setCinemaHudTab(prev => (prev === btn.id ? null : btn.id))}
                      className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                        cinemaHudTab === btn.id
                          ? 'bg-white text-stone-950'
                          : 'text-stone-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}

                  <div className="w-[1px] h-4 bg-white/20 mx-1" />

                  <button
                    onClick={() => setIsBibleFinderOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                  >
                    말씀·예시찾기
                  </button>

                  <button
                    onClick={() => openMcheyneStyleVerseInspector(activeReferenceStr, selectedWordVerse)}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                  >
                    원어강해
                  </button>

                  <button
                    onClick={() => {
                      setArcModalInitialMode('arc');
                      setIsArcModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                  >
                    신구약 아크
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. 성경말씀 & 설교 예시구절 멀티 검색 모달 (불투명 고대비 가독성) */}
      {/* ===================================================================== */}
      {isBibleFinderOpen && (
        <div
          className="fixed inset-0 z-[999992] bg-black/75 flex items-center justify-center p-3 animate-fade-in select-none"
          onClick={() => setIsBibleFinderOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[86vh] rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col overflow-hidden text-left ${
              isDark ? 'bg-[#12151C] border-white/20 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/15 pb-3 mb-3 shrink-0">
              <h3 className="text-[15px] font-bold">
                성경 본문 및 설교 인용 말씀 찾기
              </h3>
              <button
                onClick={() => setIsBibleFinderOpen(false)}
                className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>

            <div className="flex gap-1.5 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setFinderMode('ref')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  finderMode === 'ref'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-500'
                }`}
              >
                구절 입력 · 성경 66권 목차
              </button>
              <button
                type="button"
                onClick={() => setFinderMode('keyword')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  finderMode === 'keyword'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-500'
                }`}
              >
                단어(키워드)로 구절 찾기
              </button>
            </div>

            {finderMode === 'ref' ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2 mb-3 shrink-0">
                  <div className="flex gap-1.5 flex-1">
                    <input
                      type="text"
                      value={finderRefInput}
                      onChange={(e) => setFinderRefInput(e.target.value)}
                      placeholder="예: 시편 23:1-6, 요 3:16, 롬 8:28"
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomRefQuery(finderRefInput);
                        updateDay && updateDay({ sermonReference: finderRefInput });
                        showToast(`설교 본문이 [${finderRefInput}]으로 변경되었습니다.`);
                      }}
                      className="px-3 py-2 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs shrink-0 cursor-pointer"
                    >
                      설교본문 지정
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <select
                      value={finderBookKo}
                      onChange={(e) => {
                        const bk = e.target.value;
                        setFinderBookKo(bk);
                        setFinderChapter(1);
                        setFinderRefInput(`${bk} 1:1`);
                      }}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                        isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'
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
                      className={`w-16 px-2 py-2 rounded-lg border text-xs font-bold text-center outline-none ${
                        isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'
                      }`}
                    />
                    <span className="self-center text-xs font-bold text-stone-400">장</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                  {finderScriptureData.verses.map(v => {
                    const refLabel = `${finderScriptureData.parsed?.bookKo || finderBookKo} ${finderScriptureData.parsed?.chapter || finderChapter}:${v.vNum}`;
                    return (
                      <div
                        key={v.vNum}
                        className={`p-3 rounded-xl border transition-all ${
                          v.isHighlight
                            ? (isDark ? 'bg-[#1E2330] border-white/40' : 'bg-stone-100 border-stone-400')
                            : (isDark ? 'bg-[#0B0D11] border-white/10' : 'bg-stone-50 border-stone-200')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs">
                            {refLabel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleInsertVerseToSermonNotes(refLabel, v.text)}
                              className="px-2.5 py-1 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-bold cursor-pointer"
                            >
                              필기장에 인용 삽입
                            </button>
                            <button
                              type="button"
                              onClick={() => openMcheyneStyleVerseInspector(refLabel, v.vNum)}
                              className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-stone-300 text-stone-800'
                              }`}
                            >
                              원어강해
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomRefQuery(refLabel);
                                setArcModalInitialMode('arc');
                                setIsArcModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-stone-300 text-stone-800'
                              }`}
                            >
                              신구약 아크
                            </button>
                          </div>
                        </div>
                        <p className="text-[13.5px] font-serif leading-relaxed">{v.text}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
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
                    placeholder="찾으실 성경 단어나 구절 일부를 입력하세요 (예: 합력하여 선을, 여호와는 나의 목자)"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
                      isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setFinderKeywordResults(searchBibleByKeyword(finderKeyword))}
                    className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    검색
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                  {finderKeywordResults.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400">
                      단어를 입력하고 [검색]을 누르면 성경 66권 전체에서 해당 구절을 찾아줍니다.
                    </div>
                  ) : (
                    finderKeywordResults.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-[#0B0D11] border-white/10' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs">{item.ref}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleInsertVerseToSermonNotes(item.ref, item.text)}
                              className="px-2.5 py-1 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-bold cursor-pointer"
                            >
                              필기장에 인용 삽입
                            </button>
                            <button
                              type="button"
                              onClick={() => openMcheyneStyleVerseInspector(item.ref, item.verse)}
                              className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-stone-300 text-stone-800'
                              }`}
                            >
                              원어강해
                            </button>
                          </div>
                        </div>
                        <p className="text-[13.5px] font-serif leading-relaxed">{item.text}</p>
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
      {/* 8. 원어 강해 & 10대 학술 사료 모달 */}
      {/* ===================================================================== */}
      {inspectorTarget && (
        <div
          className="fixed inset-0 z-[999995] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#11141C] border-white/20 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="border-b pb-3 border-stone-200 dark:border-white/15 shrink-0 space-y-2.5">
              <div className="flex justify-between items-center flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold">
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
                      className={`px-2 py-0.5 rounded text-[11.5px] font-bold border outline-none cursor-pointer ${
                        isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-100 border-stone-300 text-stone-800'
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-stone-100 border-stone-300 text-stone-800'
                    }`}
                  >
                    신구약 아크 ➔
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToInterlinearStudio}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-900 dark:bg-white text-white dark:text-stone-900 cursor-pointer"
                  >
                    원어연구실 전체열기 ➔
                  </button>
                  <button
                    onClick={() => setInspectorTarget(null)}
                    className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white px-2 py-1 cursor-pointer"
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
                  placeholder="다른 성경 구절 검색 (예: 창세기 1:1, 로마서 8:28)"
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                    isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => openMcheyneStyleVerseInspector(customRefQuery || activeReferenceStr)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer shrink-0"
                >
                  조회
                </button>
              </div>

              {selectedWordDetail && (
                <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl border ${
                  isDark ? 'bg-[#181C26] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">본문 출현형 (INFLECTED)</span>
                    <div className="flex items-baseline gap-2">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold">
                        {cleanTypography(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      </span>
                      <span className="text-xs font-mono text-stone-400">{selectedWordDetail.pron}</span>
                    </div>
                    <p className="text-xs font-bold">
                      번역: <span className="underline underline-offset-2">{selectedWordDetail.korContextual}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5 border-l pl-3 text-left border-stone-200 dark:border-white/15">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">원형 표제어 (LEMMA)</span>
                    <div className="flex items-baseline gap-2">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold">
                        {cleanTypography(selectedWordDetail.lemma, inspectorTarget.isOT)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200 dark:bg-white/15">
                        {selectedWordDetail.strongs}
                      </span>
                    </div>
                    <p className="text-xs font-bold">
                      기본뜻: <b>{selectedWordDetail.korLemma}</b>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <p className="text-[13px] font-serif font-medium leading-relaxed">
                  <span className="text-[10px] font-bold text-stone-400 mr-1.5">[개역]</span>
                  {inspectorTarget.text}
                </p>
                {inspectorTarget.easyText && (
                  <p className="text-[12.5px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                    <span className="text-[10px] font-bold mr-1.5">[쉬운]</span>
                    {inspectorTarget.easyText}
                  </p>
                )}
              </div>
            </div>

            <div className={`flex gap-1 p-1 rounded-xl border my-2.5 shrink-0 ${
              isDark ? 'bg-[#0B0D11] border-white/15' : 'bg-stone-100 border-stone-200'
            }`}>
              {[
                { id: 'scholarly', label: '학술 사료 및 주석' },
                { id: 'concordance', label: `성경 전권 용례 (${concordanceTotalCount}회)` },
                { id: 'custom_study', label: '개인 연구 메모' }
              ].map(tb => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setModalTab(tb.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-bold whitespace-nowrap cursor-pointer ${
                    modalTab === tb.id ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-2.5 flex-1 text-xs text-left">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#181C26] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5">어절 선택 (터치하여 형태소 분석)</span>
                {isInspectorLoading ? (
                  <div className="py-3 text-center text-stone-400">원어 데이터를 불러오는 중...</div>
                ) : (
                  <div className={`flex flex-wrap gap-x-2.5 gap-y-1.5 items-baseline ${inspectorTarget.isOT ? 'justify-end' : 'justify-start'}`} dir={inspectorTarget.isOT ? 'rtl' : 'ltr'}>
                    {inspectorWords.map(w => (
                      <span
                        key={w.id}
                        onClick={() => handleSelectInspectorWord(w)}
                        style={originalFontStyle(inspectorTarget.isOT)}
                        className={`text-[20px] sm:text-[22px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all ${
                          selectedWordDetail?.order === w.order 
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950' 
                            : isDark ? 'text-stone-100 hover:bg-white/10' : 'text-stone-900 hover:bg-black/5'
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
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0B0D11] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[11.5px]">교차참조 (TSK) — {crossRefs.length}개 구절</span>
                      <span className="text-[10px] text-stone-400">클릭 시 아크 대조</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto hide-scrollbar">
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
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                            isDark ? 'bg-[#181C26] border-white/15 text-stone-200 hover:bg-white/15' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          {ref.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentHebrewSyntax && (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0B0D11] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block">BHS 히브리어 구문론 구조</span>
                      {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                        <div key={idx} className={`p-1.5 rounded flex justify-between text-[11.5px] ${isDark ? 'bg-[#181C26]' : 'bg-white'}`}>
                          <span style={originalFontStyle(true)} className="font-bold">{c.unit}</span>
                          <span className="text-stone-400">{c.role}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentCommentary && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0B0D11] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block mb-1">학술 주석 ({currentCommentary.commentator})</span>
                      <p className="text-[12px] leading-relaxed font-serif">{decodeHtmlEntities(currentCommentary.exegesis)}</p>
                    </div>
                  )}

                  {currentMatthewHenry && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0B0D11] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block mb-1">매튜 헨리 강해</span>
                      <p className="text-[12px] leading-relaxed font-serif">{decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'concordance' && (
                <div className="space-y-1.5">
                  {concordanceList.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg border flex items-center justify-between ${isDark ? 'bg-[#0B0D11] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold min-w-[80px]">{item.book} {item.chapter}:{item.verse}</span>
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[16px]">{cleanTypography(item.original_word, inspectorTarget.isOT)}</span>
                      <span className="text-stone-500 dark:text-stone-300 truncate max-w-[140px] text-right font-medium">{item.korean_trans}</span>
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
                    placeholder="개인 정의 번역어..."
                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold border outline-none ${isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'}`}
                  />
                  <textarea
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    rows={3}
                    placeholder="단어 묵상 및 연구 메모..."
                    className={`w-full p-3 rounded-lg text-xs font-medium border outline-none resize-none ${isDark ? 'bg-[#0B0D11] border-white/20 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'}`}
                  />
                </div>
              )}
            </div>

            {selectedWordDetail && (
              <div className="pt-3 border-t border-stone-200 dark:border-white/15 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertWordToSermonNote(selectedWordDetail)}
                  className="flex-1 py-2.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold text-xs cursor-pointer"
                >
                  설교 필기장에 원어 강해 삽입
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className={`px-4 py-2.5 rounded-lg font-bold text-xs border cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-stone-100 border-stone-300 text-stone-800'
                  }`}
                >
                  발음 듣기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. 신구약 구속사 아크 & 성경 은하계 모달 */}
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
          showToast('신구약 구속사 아크 대조 내용이 설교 필기장에 삽입되었습니다.');
        }}
      />

      {/* ===================================================================== */}
      {/* 10. 월별 특별집회(기상오기) 링크 관리 모달 */}
      {/* ===================================================================== */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-[99995] flex items-center justify-center p-3 bg-black/65 animate-fade-in select-none">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#14171F] border-white/15 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
            <div className="px-5 py-3.5 border-b border-stone-200 dark:border-white/10 flex justify-between items-center">
              <span className="font-bold text-[14px]">월별 특별집회 영상 링크 관리</span>
              <button onClick={() => setShowMonthlyModal(false)} className="text-xs font-bold text-stone-400 hover:text-stone-800 dark:hover:text-white p-1 cursor-pointer">
                닫기 ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 hide-scrollbar text-[12px]">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const isCurrent = m === currentMonthNum;
                const mUrl = monthlyGisanUrls[m] || '';

                return (
                  <div key={m} className={`p-2.5 rounded-xl border flex flex-col gap-1 ${isCurrent ? 'border-stone-500 bg-stone-100/60 dark:bg-white/10' : (isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50/50')}`}>
                    <span className="font-bold text-[12px]">
                      {m}월 영상 {isCurrent && <b className="text-[10.5px] ml-1">[현재 월]</b>}
                    </span>
                    <input 
                      type="text" 
                      value={mUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMonthlyGisanUrls(prev => ({ ...prev, [m]: val }));
                      }}
                      placeholder={`https://youtu.be/... (${m}월 유튜브 링크)`}
                      className={`w-full px-2.5 py-1.5 text-[11.5px] rounded-lg border outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 border-t border-stone-200 dark:border-white/10 flex gap-2">
              <button 
                onClick={() => setShowMonthlyModal(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-white/15 font-bold text-[12px] cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('monthly_gisangogi_urls', JSON.stringify(monthlyGisanUrls));
                  if (monthlyGisanUrls[currentMonthNum]) {
                    localStorage.setItem(`app_active_gisangogi_url_${currentMonthNum}`, monthlyGisanUrls[currentMonthNum]);
                    if (setGisangogiUrl) setGisangogiUrl(monthlyGisanUrls[currentMonthNum]);
                  }
                  setShowMonthlyModal(false);
                  showToast("월별 영상 링크가 저장되었습니다.");
                }}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-[12px] cursor-pointer"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
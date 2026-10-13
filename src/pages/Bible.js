// src/components/Bible.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import VersePopup from '../components/VersePopup';
import { supabase } from '../lib/supabase';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 암호화
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

// =====================================================================
// 📜 [성경 66권 한글-영문 명칭 & 정경 분류 마스터 맵]
// =====================================================================
const BIBLE_66_MAP = {
  // 구약 39권
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

  // 신약 27권
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

// =====================================================================
// 🌟 [2차 베지에 곡선 고정밀 브러시 렌더러] GeneralNote 엔진 이식
// =====================================================================
const renderStroke = (ctx, stroke, isDark) => {
  const { tool, color, size, points } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const resolvedColor = (isDark && color === '#1E293B') ? '#F8FAFC' : color;

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
    case 'brush':
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = size * 1.8;
      ctx.shadowBlur = size * 1.2;
      ctx.shadowColor = resolvedColor;
      ctx.globalAlpha = 0.75;
      break;
    case 'highlighter':
      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      ctx.strokeStyle = color === '#1E293B' ? 'rgba(250, 204, 21, 0.45)' : color;
      ctx.lineWidth = size * 3.8;
      ctx.globalAlpha = isDark ? 0.6 : 0.45;
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
// 🏛️ [2단 필사 전용 고성능 필기 & 타이핑 노트 패널]
// =====================================================================
const BibleTranscriptionNotePanel = ({ currentChapId, chapterTitle, isDark, noteContent, setNoteContent, updateDay }) => {
  const [panelTab, setPanelTab] = useState('handwriting'); // 'handwriting' | 'typing'
  const [paperStyle, setPaperStyle] = useState('line'); // 'dot', 'line', 'grid', 'blank'

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
  const [strokeColor, setStrokeColor] = useState('#1E293B');
  const [strokeWidth, setStrokeWidth] = useState(3.0);

  // 장 변경 시 해당 장의 필기 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setStrokes(saved ? JSON.parse(saved) : []);
      setRedoStack([]);
    } catch {
      setStrokes([]);
    }
  }, [storageKey]);

  // 획 변경 시 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(strokes));
    } catch (_) {}
    redraw();
  }, [strokes, storageKey]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    strokes.forEach(s => renderStroke(ctx, s, isDark));

    if (currentPointsRef.current.length > 0) {
      renderStroke(ctx, {
        tool: currentTool,
        color: strokeColor,
        size: strokeWidth,
        points: currentPointsRef.current
      }, isDark);
    }
  }, [strokes, currentTool, strokeColor, strokeWidth, isDark]);

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
      setStrokes(prev => [...prev, newStroke]);
      setRedoStack([]);
    }
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack(p => [...p, last]);
    setStrokes(p => p.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(p => p.slice(0, -1));
    setStrokes(p => [...p, last]);
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

    ctx.fillStyle = isDark ? '#121620' : '#FFFDF9';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.scale(dpr, dpr);
    strokes.forEach(s => renderStroke(ctx, s, isDark));

    const link = document.createElement('a');
    link.download = `${chapterTitle || '말씀'}_필사노트.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const colorPalette = [
    { id: 'black', color: '#1E293B' },
    { id: 'red', color: '#EF4444' },
    { id: 'orange', color: '#F97316' },
    { id: 'yellow', color: '#EAB308' },
    { id: 'green', color: '#10B981' },
    { id: 'blue', color: '#0EA5E9' },
    { id: 'purple', color: '#8B5CF6' }
  ];

  const tools = [
    { id: 'pen', label: '볼펜' },
    { id: 'pencil', label: '연필' },
    { id: 'marker', label: '마커' },
    { id: 'brush', label: '붓' },
    { id: 'highlighter', label: '형광펜' },
    { id: 'eraser', label: '지우개' }
  ];

  const getPaperBg = () => {
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    switch (paperStyle) {
      case 'dot':
        return { backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px' };
      case 'line':
        return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`, backgroundSize: '100% 28px' };
      case 'grid':
        return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' };
      case 'blank':
      default:
        return {};
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border overflow-hidden ${
      isDark ? 'bg-[#121620] border-slate-700/80' : 'bg-white border-stone-200/90 shadow-2xs'
    }`}>
      {/* 1. 상단 모드 스위처 & 툴바 헤더 */}
      <div className={`p-2 sm:p-2.5 border-b flex flex-wrap items-center justify-between gap-1.5 shrink-0 ${
        isDark ? 'bg-[#181F2C] border-slate-700' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanelTab('handwriting')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              panelTab === 'handwriting'
                ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-stone-900 text-white shadow-xs')
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ✍️ 필기 캔버스
          </button>
          <button
            onClick={() => setPanelTab('typing')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              panelTab === 'typing'
                ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-stone-900 text-white shadow-xs')
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ⌨️ 텍스트 타이핑
          </button>
        </div>

        {/* 용지 선택기 */}
        <div className="flex items-center gap-1">
          <div className={`flex p-0.5 rounded-lg border text-[10px] font-bold ${
            isDark ? 'bg-black/30 border-slate-700' : 'bg-stone-200/70 border-stone-300'
          }`}>
            {['dot', 'line', 'grid', 'blank'].map(p => (
              <button
                key={p}
                onClick={() => setPaperStyle(p)}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  paperStyle === p ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs' : 'text-stone-500'
                }`}
              >
                {p === 'dot' ? '도트' : p === 'line' ? '유선' : p === 'grid' ? '모눈' : '무지'}
              </button>
            ))}
          </div>

          {panelTab === 'handwriting' && (
            <button
              onClick={handleExportPng}
              className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
              title="PNG 이미지 저장"
            >
              저장
            </button>
          )}
        </div>
      </div>

      {/* 2. 손필기 전용 정밀 제어 툴바 */}
      {panelTab === 'handwriting' && (
        <div className={`px-2 py-1.5 border-b flex items-center justify-between gap-1.5 overflow-x-auto hide-scrollbar shrink-0 text-xs ${
          isDark ? 'bg-[#151B27] border-slate-700/60' : 'bg-stone-100/70 border-stone-200'
        }`}>
          {/* 브러시 6종 */}
          <div className="flex items-center gap-1 shrink-0">
            {tools.map(t => (
              <button
                key={t.id}
                onClick={() => setCurrentTool(t.id)}
                className={`px-2 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  currentTool === t.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 굵기 */}
          <div className="flex items-center gap-1 shrink-0 px-1">
            <span className="text-[10px] font-mono text-stone-400">{strokeWidth.toFixed(1)}px</span>
            <input
              type="range" min="1" max="18" step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-14 sm:w-20 accent-indigo-600 cursor-pointer h-1"
            />
          </div>

          {/* 팔레트 */}
          <div className="flex items-center gap-1 shrink-0">
            {colorPalette.map(c => (
              <button
                key={c.id}
                onClick={() => setStrokeColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                  strokeColor === c.color ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Undo / Redo / Clear */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            <button onClick={handleUndo} disabled={strokes.length === 0} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-stone-500 disabled:opacity-30 cursor-pointer">
              ↩ 취소
            </button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-stone-500 disabled:opacity-30 cursor-pointer">
              ↪ 다시
            </button>
            <button onClick={handleClear} disabled={strokes.length === 0} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-500 disabled:opacity-30 cursor-pointer">
              비우기
            </button>
          </div>
        </div>
      )}

      {/* 3. 본문 뷰포트 (손필기 캔버스 vs 텍스트 타이핑) */}
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
          <div className="absolute inset-0 w-full h-full p-4 overflow-y-auto hide-scrollbar">
            <textarea
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                if (updateDay) updateDay({ bibleFreeNote: e.target.value });
              }}
              placeholder={`[${chapterTitle || '말씀'}] 본문을 묵상하며 이곳에 자유롭게 타이핑 필사나 묵상 노트를 적으세요.\n\n(원어 인스펙터에서 '필사 노트에 주석 삽입'을 누르면 이곳에 정밀 강해가 기록됩니다.)`}
              className={`w-full h-full bg-transparent outline-none resize-none text-[14px] leading-[2.1] font-medium border-none ${
                isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default function Bible({
  bibles, currentChapId, setCurrentChapId, bibleViewMode, setBibleViewMode,
  bibleHighlights, setBibleHighlights,
  readVerses, setReadVerses, isDarkMode, t, setActiveScreen, authUser,
  isSidebarOpen, setIsSidebarOpen, getKoName,
  getArr, readChallengeStart, setReadChallengeStart, 
  bibleProgress, readChapsCount, openModal, 
  setSelVerses, selVerses, currDay, updateDay, cleanText, getLocalToday,
  SubPageHeader
}) {
  
  const [selectedSermonVerse, setSelectedSermonVerse] = useState(null);
  const [sermonSummaryData, setSermonSummaryData] = useState(null);
  const [viewMode, setViewMode] = useState('single'); 
  const [noteContent, setNoteContent] = useState(currDay?.bibleFreeNote || '');

  // 📖 성경 번역본 모드: 'krv'(개역개정) | 'easy'(쉬운성경) | 'web'(World English Bible) | 'parallel'(동시대조)
  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('bible_version_mode') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});

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

  // 10대 학술 데이터베이스 상태
  const [lxxDb, setLxxDb] = useState({});
  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);

  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  useEffect(() => {
    ensureMasterStrongs();

    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => r.ok ? r.json() : {}).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/lxx_quotes.json').then(r => r.ok ? r.json() : {}).then(d => setLxxDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then(r => r.ok ? r.json() : {}).then(d => setCommentaryDb(d || {})).catch(() => {});
    fetch('/data/matthew_henry.json').then(r => r.ok ? r.json() : {}).then(d => setMatthewHenryDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    setNoteContent(currDay?.bibleFreeNote || '');
  }, [currDay?.bibleFreeNote]);

  useEffect(() => {
    let isMounted = true;
    fetch("/sermon_summary.json")
      .then(res => res.json())
      .then(data => { 
        if (isMounted) setSermonSummaryData(data); 
      })
      .catch(err => { 
        if (isMounted) console.error("설교 데이터 로드 실패:", err); 
      });
    return () => { isMounted = false; };
  }, []);

  const [sBk, sCh] = String(currentChapId || "Genesis-1").split('-');
  const cBk = (getArr ? getArr(bibles) : bibles || []).find(b => b.name === sBk) || (bibles && bibles[0]);
  const cVs = (cBk && cBk.chapters && Array.isArray(cBk.chapters[parseInt(sCh, 10)-1])) ? cBk.chapters[parseInt(sCh, 10)-1] : [];
  const isAllR = cVs.length > 0 && (getArr ? getArr(cVs) : cVs).every((_, i) => (readVerses||{})[`${sBk}-${sCh}-${i}`]);

  // =====================================================================
  // 🌟 [핵심 개선 1] 설교 인용 정밀 파싱 (도배 차단)
  // 장 전체 포괄 매칭을 배제하고, 정확히 인용된 특정 절 및 범위에만 1:1 매칭
  // =====================================================================
  const checkHasSermon = useCallback((koName, enName, chapter, verseNum) => {
    if (!sermonSummaryData || !sermonSummaryData.index) return null;
    const vInt = parseInt(verseNum, 10);
    const chInt = parseInt(chapter, 10);
    const cleanKo = koName.replace(/\s+/g, '');
    const cleanEn = (enName || '').replace(/\s+/g, '');
    
    const targetPrefixKo = `${cleanKo}${chInt}:`;
    const targetPrefixEn = cleanEn ? `${cleanEn}${chInt}:` : '';

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

      // '창세기 1장' 처럼 절 번호 없이 장 전체로만 되어 있는 건 무차별 도배 방지를 위해 개별 절에 붙이지 않음
      if (!versePart) continue;

      // 쉼표나 세미콜론으로 구분된 복수 구절/범위 정밀 파싱 (예: "16-18,21" or "16~18")
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
    return null;
  }, [sermonSummaryData]);

  // 본문 실시간 엔티티 디코딩
  const safeGetVerseText = useCallback((verse) => {
    let verseText = "";
    if (typeof verse === 'string') {
       verseText = verse;
       if (/^\d{4}-\d{2}-\d{2}T/.test(verseText) || /^\w{3} \w{3} \d{2} \d{4}/.test(verseText)) {
          return "데이터 오류: 날짜 형식 변환 오류입니다.";
       }
    } else if (typeof verse === 'object' && verse !== null) {
       verseText = verse.text || verse.content || verse.verse || JSON.stringify(verse);
    }
    const cleaned = cleanText ? cleanText(verseText) || verseText : verseText;
    return decodeHtmlEntities(cleaned);
  }, [cleanText]);

  const syncBibleReading = () => {
    const todayYmd = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);
    
    if (supabase && (authUser?.name || authUser)) {
      const uName = typeof authUser === 'object' ? authUser?.name : authUser;
      if (uName) {
        supabase.from('attendance_records').upsert({
          date: todayYmd,
          user_name: uName,
          cell_name: authUser?.cell_name || '내 목장',
          type: '성경',
          status: '출석'
        }, { onConflict: 'date,user_name,type' }).then();
      }
    }

    if (updateDay) updateDay({ checks: { ...(currDay?.checks||{}), '성경읽기': true } });
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('bible-progress-updated'));
  };

  // 원어 연구 인스펙터 오픈
  const openVerseInspector = useCallback(async (chNum, vNum, verseText) => {
    const rawBookName = sBk || 'Genesis';
    const bookInfo = BIBLE_66_MAP[rawBookName] || { ko: (getKoName ? getKoName(rawBookName) : rawBookName) || rawBookName, isOT: true, section: '구약' };
    const koBook = bookInfo.ko;
    const isOT = bookInfo.isOT;

    const easyKey = `${koBook}-${chNum}-${vNum}`;
    const easyText = easyBibleDb[easyKey] || '';
    const webKey = `${koBook}-${chNum}-${vNum}`;
    const webText = webBibleDb[webKey] || webBibleDb[`${rawBookName}-${chNum}-${vNum}`] || '';

    setInspectorTarget({
      book: koBook,
      chapter: chNum,
      verse: vNum,
      text: decodeHtmlEntities(verseText),
      easyText: easyText,
      webText: webText,
      isOT
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
      console.error("원어 인스펙터 로드 실패:", err);
    } finally {
      setIsInspectorLoading(false);
    }
  }, [sBk, getKoName, customNotesMap, easyBibleDb, webBibleDb]);

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

  // 필사 노트에 원어 강해 삽입
  const handleInsertWordToFreeNote = (word) => {
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = word.userCustomNote?.memo ? `\n   ↳ ✍️ 연구 메모: ${word.userCustomNote.memo}` : '';
    const insightLine = `\n[원어묵상] ${word.inflected}${lemmaNotice} (${word.strongs}): ${word.korContextual} — ${word.grammarDecoded}${customMemoNotice}\n`;
    
    const updated = (noteContent || '') + insightLine;
    setNoteContent(updated);
    if (updateDay) updateDay({ bibleFreeNote: updated });
    alert(`[${word.inflected}] 원어 강해가 2단 필사 노트에 기록되었습니다.`);
  };

  const isDark = isDarkMode;
  const ui = {
    bgBody: isDark ? 'bg-[#0B0F17]' : 'bg-[#F9F9F6]', 
    textMain: isDark ? 'text-slate-100' : 'text-stone-900', 
    textSub: isDark ? 'text-slate-400' : 'text-stone-600', 
    glassCard: isDark ? 'bg-[#121824] border border-[#20293A] shadow-sm' : 'bg-white border border-stone-200/90 shadow-2xs',
    bgSubCard: isDark ? 'bg-[#161D2B] border border-[#20293A]' : 'bg-stone-50 border border-stone-200',
  };

  const originalFontStyle = (isOT) => isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const currentKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentLxx = lxxDb[currentKey] || null;
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

  return (
    <div className={`flex-1 flex flex-col h-full ${ui.bgBody} relative overflow-hidden font-sans select-none`}>
       
       {bibleViewMode === 'sermonDetail' ? (
          <div className={`flex-1 flex flex-col h-full overflow-y-auto ${ui.bgBody} relative z-10`}>
             <div>
                <SubPageHeader 
                   title={`설교 아카이브 (${selectedSermonVerse})`} 
                   onBack={() => setBibleViewMode('read')} 
                   t={t} 
                   toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                />
             </div>
             <div className="p-2 sm:p-4 max-w-3xl w-full mx-auto pb-24">
                <VersePopup verse={selectedSermonVerse} />
             </div>
          </div>
       ) : bibleViewMode === 'index' ? (
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-24 space-y-3 relative z-10 w-full max-w-5xl mx-auto hide-scrollbar">
             <div className="pt-1"><SubPageHeader title="성경 전체 66권" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             
             <div className={`${ui.glassCard} p-4 sm:p-5 rounded-2xl text-center shadow-2xs relative z-[45] pointer-events-auto`}>
                <span className={`text-[12px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-700'} mb-2 flex items-center justify-center gap-1.5`}>📅 말씀과 함께하는 365일 기간 설정</span>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <input type="date" value={readChallengeStart} onChange={(e)=>setReadChallengeStart(e.target.value)} className={`${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900'} text-[12px] font-bold px-3 py-1.5 rounded-xl outline-none shadow-inner`} />
                </div>
                <div className={`w-full ${isDark ? 'bg-black/30' : 'bg-stone-100'} rounded-full h-2.5 overflow-hidden shadow-inner mb-2`}><div className={`bg-amber-600 h-full transition-all duration-700 rounded-full`} style={{width:`${bibleProgress}%`}}></div></div>
                <div className={`flex justify-between text-[11px] font-bold ${ui.textMain} px-1`}><span>완독: {readChapsCount}장</span><span className={isDark ? 'text-slate-300' : 'text-stone-700'}>진행도 {bibleProgress}%</span></div>
                <button onClick={() => { openModal('bibleChallenge'); }} className={`w-full mt-3 py-2.5 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'} text-[12.5px] font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border`}>📖 365 통독표 상세보기</button>
             </div>
             
             <div className="mt-3 relative z-[45] pointer-events-auto">
               <h3 className={`font-bold ${ui.textMain} text-[14px] mb-2 border-b ${isDark ? 'border-white/10' : 'border-stone-200'} pb-1.5`}>구약 성경</h3>
               <div className="flex flex-wrap gap-1.5">
                 {(getArr ? getArr(bibles) : bibles || []).slice(0, 39).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border ${ui.bgSubCard} ${ui.textMain} shadow-2xs hover:border-stone-400 transition-all whitespace-nowrap cursor-pointer`}>{getKoName(b.name)}</button>)}
               </div>
             </div>
             
             <div className="mt-4 relative z-[45] pointer-events-auto">
               <h3 className={`font-bold ${ui.textMain} text-[14px] mb-2 border-b ${isDark ? 'border-white/10' : 'border-stone-200'} pb-1.5`}>신약 성경</h3>
               <div className="flex flex-wrap gap-1.5">
                 {(getArr ? getArr(bibles) : bibles || []).slice(39, 66).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border ${ui.bgSubCard} ${ui.textMain} shadow-2xs hover:border-stone-400 transition-all whitespace-nowrap cursor-pointer`}>{getKoName(b.name)}</button>)}
               </div>
             </div>
          </div>
       ) : (
          <div className="flex-1 flex flex-col h-full pointer-events-auto relative z-10">
             <div className="pt-1"><SubPageHeader title="성경 본문" onBack={()=>{setBibleViewMode('index'); setSelVerses([]);}} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             
             {/* 상단 컨트롤 바 */}
             <div className={`${ui.glassCard} px-2.5 sm:px-4 py-1.5 shadow-2xs z-[60] border-b flex flex-col gap-1.5 relative pointer-events-auto rounded-none border-t-0 border-l-0 border-r-0`}>
               <div className="flex justify-between items-center flex-wrap gap-1.5">
                 <span className={`font-bold text-[15px] sm:text-[16px] ${ui.textMain}`}>{getKoName(sBk)} {sCh}장</span>
                 
                 <div className="flex items-center gap-1.5 flex-wrap">
                   {/* 4대 역본 스위치 */}
                   <div className={`flex p-0.5 rounded-lg border text-[10.5px] font-bold ${isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'}`}>
                      <button 
                        onClick={() => handleVersionChange('krv')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'krv' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : ui.textSub}`}
                        title="개역개정 단독"
                      >
                        개역개정
                      </button>
                      <button 
                        onClick={() => handleVersionChange('easy')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'easy' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : ui.textSub}`}
                        title="쉬운성경"
                      >
                        쉬운성경
                      </button>
                      <button 
                        onClick={() => handleVersionChange('web')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'web' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : ui.textSub}`}
                        title="WEB 영어"
                      >
                        WEB
                      </button>
                      <button 
                        onClick={() => handleVersionChange('parallel')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'parallel' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : ui.textSub}`}
                        title="동시대조"
                      >
                        동시대조
                      </button>
                   </div>

                   {/* 본문 집중 / 2단 필사 토글 */}
                   <div className={`flex gap-1 ${isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'} p-0.5 rounded-lg border`}>
                      <button 
                        onClick={() => setViewMode('single')}
                        className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'single' ? (isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-stone-900 shadow-xs') : ui.textSub}`}
                      >
                        본문 집중
                      </button>
                      <button 
                        onClick={() => setViewMode('split')}
                        className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'split' ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs') : ui.textSub}`}
                      >
                        ✍️ 2단 필사
                      </button>
                   </div>
                 </div>
               </div>
             </div>

             {/* 🌟 메인 성경 뷰포트 (어설픈 다꾸 제거, 순수 집중 리딩 + 우측 고성능 필사 노트) */}
             <div className={`flex-1 px-2 sm:px-3 md:px-4 pt-1.5 pb-20 grid gap-3 h-full relative z-10 overflow-hidden ${
               viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 max-w-[1500px]' : 'grid-cols-1 max-w-4xl'
             } mx-auto w-full`}>
                 
                 {/* 좌측: 성경 본문 스트림 */}
                 <div className="flex flex-col relative z-[45] pointer-events-auto h-full overflow-y-auto hide-scrollbar">
                     <div className={`${ui.glassCard} rounded-2xl p-3 sm:p-5 min-h-[400px]`}>
                     {cVs.length > 0 ? (getArr ? getArr(cVs) : cVs).map((verse, idx) => { 
                        const vId = `${sBk}-${sCh}-${idx}`; 
                        const isR = (readVerses||{})[vId]; 
                        const isSel = selVerses.includes(vId); 
                        const hColor = (bibleHighlights||{})[vId];

                        const koName = getKoName(sBk) || BIBLE_66_MAP[sBk]?.ko || sBk;
                        
                        // 🌟 [정밀 파싱] 설교에 정말 인용된 구절만 매칭
                        const matchedKey = checkHasSermon(koName, sBk, sCh, idx + 1);
                        const displayVerseText = safeGetVerseText(verse);

                        const easyKey = `${koName}-${sCh}-${idx + 1}`;
                        const easyText = easyBibleDb[easyKey] || '';
                        const webKey = `${koName}-${sCh}-${idx + 1}`;
                        const webText = webBibleDb[webKey] || webBibleDb[`${sBk}-${sCh}-${idx + 1}`] || '';

                        return (
                          <div 
                            key={idx} 
                            onContextMenu={(e) => {
                              e.preventDefault();
                              openVerseInspector(sCh, idx + 1, displayVerseText);
                            }}
                            onTouchStart={() => {
                              isLongPressActiveRef.current = false;
                              longPressTimerRef.current = setTimeout(() => {
                                isLongPressActiveRef.current = true;
                                if (window.navigator?.vibrate) window.navigator.vibrate(40);
                                openVerseInspector(sCh, idx + 1, displayVerseText);
                              }, 500);
                            }}
                            onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                            onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                            className={`py-1.5 px-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSel ? 'bg-amber-100 dark:bg-amber-950/40' : isR && (!hColor || hColor === 'transparent') ? 'opacity-35 line-through' : 'hover:bg-stone-50 dark:hover:bg-white/5'
                            }`}
                            style={hColor && hColor !== 'transparent' ? { backgroundColor: `${hColor}33`, borderLeft: `3px solid ${hColor}` } : {}}
                          >
                             <div className="flex items-start gap-2">
                               <span 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   openVerseInspector(sCh, idx + 1, displayVerseText);
                                 }}
                                 className="font-bold font-mono text-[12px] sm:text-[13px] text-amber-700 dark:text-amber-400 mt-0.5 min-w-[20px] text-right shrink-0 select-none cursor-pointer hover:underline"
                                 title="원어 분해 및 10대 학술 사료"
                               >
                                 {idx + 1}
                               </span>

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
                                   setSelVerses(p => p.includes(vId) ? p.filter(id=>id!==vId) : [...p, vId]);
                                 }}
                                 className="flex-1 text-[14.5px] sm:text-[15.5px] leading-[1.8] font-serif break-keep text-stone-900 dark:text-slate-100"
                               >
                                  {bibleVersion === 'krv' && <span>{displayVerseText}</span>}
                                  {bibleVersion === 'easy' && <span className="font-sans font-medium">{easyText || displayVerseText}</span>}
                                  {bibleVersion === 'web' && <span className="text-[14px] sm:text-[15px]">{webText || "Loading WEB..."}</span>}
                                  {bibleVersion === 'parallel' && (
                                    <div className="space-y-1">
                                      <div>{displayVerseText}</div>
                                      {easyText && (
                                        <div className="text-[13.5px] sm:text-[14px] font-sans text-emerald-800 dark:text-emerald-300">
                                          <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mr-1">[쉬운]</span>
                                          {easyText}
                                        </div>
                                      )}
                                      {webText && (
                                        <div className="text-[13px] sm:text-[13.5px] text-blue-800 dark:text-blue-300">
                                          <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 mr-1">[WEB]</span>
                                          {webText}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 본문 인라인 배지 */}
                                  <span className="inline-flex items-center gap-1 ml-2 align-middle select-none">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openVerseInspector(sCh, idx + 1, displayVerseText);
                                      }}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
                                      title="원어 분해 및 10대 학술 사료"
                                    >
                                      <span>📖</span> 원어
                                    </button>

                                    {/* 🌟 인용된 구절에만 나타나는 설교 배지 */}
                                    {matchedKey && (
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSermonVerse(matchedKey);
                                          setBibleViewMode('sermonDetail');
                                        }}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
                                        title="인용 설교 보기"
                                      >
                                        <span>✍️</span> 설교
                                      </button>
                                    )}
                                  </span>
                               </div>
                             </div>
                          </div>
                        );
                     }) : <p className={`text-center ${ui.textSub} mt-6 text-[13px] font-bold`}>데이터를 불러올 수 없습니다.</p>}
                     </div>

                     {/* 하단 장 이동 및 완독 버튼 */}
                     <div className="flex justify-between mt-3 gap-2 relative z-[45] pointer-events-auto">
                         <button onClick={()=>{if(parseInt(sCh, 10)>1)setCurrentChapId(`${sBk}-${parseInt(sCh, 10)-1}`)}} className={`w-11 h-11 ${ui.glassCard} rounded-xl font-bold text-[14px] shadow-2xs ${ui.textMain} flex items-center justify-center hover:opacity-80 cursor-pointer`}>{"<"}</button>
                         <button 
                           onClick={()=>{
                             const u={}; 
                             const s=!isAllR;
                             (getArr ? getArr(cVs) : cVs).forEach((_, i)=>u[`${sBk}-${sCh}-${i}`]=s);
                             const nextReadVerses = { ...(readVerses || {}), ...u };
                             setReadVerses(nextReadVerses);
                             localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

                             const todayKey = getLocalToday ? getLocalToday() : new Date().toISOString().slice(0, 10);
                             const currentDayChaps = parseInt(localStorage.getItem(`chap_count_${todayKey}`) || '0', 10);
                             localStorage.setItem(`chap_count_${todayKey}`, Math.max(0, currentDayChaps + (s ? 1 : -1)));

                             if (s) syncBibleReading();
                           }} 
                           className={`flex-1 h-11 rounded-xl font-bold text-[13px] shadow-2xs transition-transform active:scale-[0.98] cursor-pointer ${isAllR ? (isDark ? 'bg-white/10 text-slate-400' : 'bg-stone-200 text-stone-700') : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                         >
                           장 모두 읽음 표시
                         </button>
                         <button onClick={()=>{if(parseInt(sCh, 10)<(getArr?getArr(cBk.chapters):cBk.chapters||[]).length)setCurrentChapId(`${sBk}-${parseInt(sCh, 10)+1}`)}} className={`w-11 h-11 ${ui.glassCard} rounded-xl font-bold text-[14px] shadow-2xs ${ui.textMain} flex items-center justify-center hover:opacity-80 cursor-pointer`}>{">"}</button>
                     </div>
                 </div>

                 {/* 🌟 [핵심 개선 2] 우측: 2단 필사 전용 베지에 손필기 & 타이핑 노트 패널 */}
                 {viewMode === 'split' && (
                   <div className="flex flex-col h-full relative z-[45] pointer-events-auto min-h-[450px]">
                     <BibleTranscriptionNotePanel
                       currentChapId={currentChapId}
                       chapterTitle={`${getKoName(sBk)} ${sCh}장`}
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

       {/* 선택 구절 하단 플로팅 툴바 */}
       {selVerses.length > 0 && bibleViewMode === 'read' && (
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 ${ui.glassCard} rounded-full px-4 py-2 flex items-center gap-2 z-[100] animate-fade-in-up pointer-events-auto shadow-2xl`}>
             {['transparent', '#fef08a', '#bfdbfe', '#fecaca', '#e9d5ff', '#bbf7d0'].map(c => ( 
               <button 
                 key={c} 
                 onClick={() => { 
                   const nH = {...bibleHighlights}; 
                   const nR = {...readVerses}; 
                   selVerses.forEach(id => { 
                     nH[id] = c; 
                     if(c!=='transparent') nR[id]=true; 
                   }); 
                   if(setBibleHighlights) setBibleHighlights(nH); 
                   if(setReadVerses) setReadVerses(nR); 
                   setSelVerses([]); 
                 }} 
                 className={`w-6 h-6 rounded-full shadow-sm border hover:scale-110 transition-transform flex items-center justify-center text-[10px] cursor-pointer ${c === 'transparent' ? 'border-rose-500' : 'border-transparent'}`} 
                 style={{backgroundColor: c !== 'transparent' ? c : (isDarkMode ? '#0B1120' : '#ffffff')}}
               >
                 {c === 'transparent' ? '✕' : ''}
               </button> 
             ))}
             
             <div className={`w-[1px] h-4 ${isDark ? 'bg-white/10' : 'bg-stone-200'} mx-1`} />

             <button 
               onClick={() => { 
                 const vData = selVerses.map(id => { 
                   const [b, ch, vIdx] = id.split('-'); 
                   const bD = (getArr ? getArr(bibles) : bibles || []).find(x => x.name === b) || (bibles && bibles[0]); 
                   const verseRaw = (getArr ? getArr(getArr(bD?.chapters)[parseInt(ch, 10)-1]) : [])[parseInt(vIdx, 10)]; 
                   const verseText = safeGetVerseText(verseRaw); 
                   return { id, ref: `${getKoName(b)} ${ch}:${parseInt(vIdx, 10)+1}`, text: verseText }; 
                 }); 
                 const combinedText = vData.map(v => `[${v.ref}] ${v.text}`).join('\n');
                 const updated = (noteContent || '') + (noteContent ? '\n\n' : '') + combinedText;
                 setNoteContent(updated);
                 if (updateDay) updateDay({ bibleFreeNote: updated });
                 setViewMode('split');
                 setSelVerses([]);
               }} 
               className="bg-stone-900 dark:bg-slate-100 text-white dark:text-stone-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap transition-transform active:scale-95 cursor-pointer"
             >
               필사 노트로 담기
             </button>
          </div>
       )}

       {/* ===================================================================== */}
       {/* 🏛️ [원어 연구 인스펙터 모달]                                           */}
       {/* ===================================================================== */}
       {inspectorTarget && (
        <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            
            <div className="border-b pb-2.5 border-stone-200 dark:border-slate-800 shrink-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 강해
                </span>
                
                <button onClick={() => setInspectorTarget(null)} className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer">
                  닫기 ✕
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
                <p className={`text-[12.5px] font-serif font-medium leading-relaxed ${ui.textMain}`}>
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

            {/* 탭바 */}
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

            {/* 본문 스크롤 */}
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
                    <span className="font-bold text-[11px] block mb-1">🔗 교차참조 (TSK) - {crossRefs.length}개</span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto hide-scrollbar">
                      {crossRefs.map((ref, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-white dark:bg-black/40 border-stone-200 dark:border-slate-700">
                          {ref.label}
                        </span>
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

            {/* 하단 사역 액션 바 */}
            {selectedWordDetail && (
              <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertWordToFreeNote(selectedWordDetail)}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📝 2단 필사 노트에 강해 삽입
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className="px-3 py-2 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700"
                >
                  🔊 낭독
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
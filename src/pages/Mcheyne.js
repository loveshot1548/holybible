// src/pages/Mcheyne.js (또는 src/components/Mcheyne.js)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
// 🏛️ [맥체인 전용 고성능 필기 & 타이핑 노트 패널]
// =====================================================================
const McheyneTranscriptionNotePanel = ({ currentPlanKey, planTitle, isDark, noteContent, setNoteContent, updateDay }) => {
  const [panelTab, setPanelTab] = useState('handwriting'); // 'handwriting' | 'typing'
  const [paperStyle, setPaperStyle] = useState('line'); // 'dot', 'line', 'grid', 'blank'

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);

  const storageKey = `mcheyne_vector_strokes_${currentPlanKey || 'default'}`;

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

  // 플랜 또는 날짜 변경 시 해당 필기 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setStrokes(saved ? JSON.parse(saved) : []);
      setRedoStack([]);
    } catch {
      setStrokes([]);
    }
  }, [storageKey]);

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
    if (!window.confirm('이 플랜의 손필기를 모두 지우시겠습니까?')) return;
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
    link.download = `${planTitle || '맥체인'}_묵상노트.png`;
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

          <div className="flex items-center gap-1 shrink-0 px-1">
            <span className="text-[10px] font-mono text-stone-400">{strokeWidth.toFixed(1)}px</span>
            <input
              type="range" min="1" max="18" step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-14 sm:w-20 accent-indigo-600 cursor-pointer h-1"
            />
          </div>

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
                if (updateDay) updateDay({ mcheyneNote: e.target.value });
              }}
              placeholder={`[${planTitle || '맥체인'}] 말씀을 묵상하며 이곳에 자유롭게 타이핑 필사나 묵상 노트를 적으세요.\n\n(원어 인스펙터에서 '묵상 노트에 주석 삽입'을 누르면 이곳에 정밀 강해가 기록됩니다.)`}
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

// UI 아이콘
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;
const IconDocument = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconMinimize = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const IconMaximize = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const IconPlay = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>;
const IconStop = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>;
const IconMic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconCheckCircle = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function Mcheyne({
  isDarkMode, setActiveScreen, setIsSidebarOpen, isSidebarOpen, date, currDay = {}, ymdStr,
  bibles = [], mcheyneActivePlan = [], mcheynePlanIdx, setMcheynePlanIdx, readVerses = {}, setReadVerses,
  ttsRate, setTtsRate, isSpeaking, updateDay, getArr, cleanText, toggleTTS, authUser
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'single' | 'split'
  const [noteContent, setNoteContent] = useState(currDay?.mcheyneNote || '');

  const [partnerActivity, setPartnerActivity] = useState(false);
  const isMoHana = (authUser?.name || authUser) === '모하나';
  const MY_NAME = "정신동";

  // 📖 성경 번역본 모드: 'krv'(개역개정) | 'easy'(쉬운성경) | 'web'(World English Bible) | 'parallel'(동시대조)
  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('mcheyne_bible_version_mode') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});

  const handleVersionChange = (ver) => {
    setBibleVersion(ver);
    try {
      localStorage.setItem('mcheyne_bible_version_mode', ver);
    } catch (_) {}
  };

  // 10대 학술 사료 및 인스펙터 상태
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
    setNoteContent(currDay?.mcheyneNote || '');
  }, [currDay?.mcheyneNote]);

  // 파트너 동행 묵상 감지 기능
  useEffect(() => {
    if (!isMoHana || !supabase) return;
    let isMounted = true;

    const fetchActivity = async () => {
      try {
        const { data } = await supabase.from('user_activity').select('*').eq('user_name', MY_NAME).maybeSingle();
        if (data && isMounted) {
          const lastUpdated = new Date(data.updated_at).getTime();
          setPartnerActivity(Date.now() - lastUpdated < 5 * 60 * 1000);
        }
      } catch(e) {}
    };
    
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    
    const sub = supabase.channel('mcheyne_partner_fixed_chan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity', filter: `user_name=eq.${MY_NAME}` }, payload => {
        if (payload.new && isMounted) setPartnerActivity(true);
      }).subscribe();
      
    return () => { 
      isMounted = false;
      clearInterval(interval); 
      supabase.removeChannel(sub); 
    };
  }, [isMoHana]);

  // 오디오 녹음 기능
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `맥체인묵상녹음_${ymdStr}_${Date.now()}.mp4`; 
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("마이크 권한이 거부되었거나 지원하지 않는 브라우저입니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  const mpList = mcheyneActivePlan || []; 
  const mp = mpList[mcheynePlanIdx] || mpList[0]; 
  const mBookD = mp ? ((getArr ? getArr(bibles) : bibles || []).find(b => b.name === mp.book) || bibles[0]) : bibles[0]; 

  const parsedPlanDetail = useMemo(() => {
    if (!mp) return { chapters: [1], verseRange: null };
    const rawStr = String(mp.chapterString || '1').trim();

    if (rawStr.includes(':')) {
      const [chapPart, versePart] = rawStr.split(':');
      const chap = parseInt(chapPart, 10) || 1;
      let startV = 1, endV = 999;
      if (versePart.includes('-') || versePart.includes('~')) {
        const [sv, ev] = versePart.split(/[-~]/);
        startV = parseInt(sv, 10) || 1;
        endV = parseInt(ev, 10) || 999;
      } else {
        startV = parseInt(versePart, 10) || 1;
        endV = startV;
      }
      return { chapters: [chap], verseRange: { [chap]: { start: startV, end: endV } } };
    }

    if (rawStr.includes('-') || rawStr.includes('~')) {
      const [sc, ec] = rawStr.split(/[-~]/);
      const startC = parseInt(sc, 10) || 1;
      const endC = parseInt(ec, 10) || startC;
      const chaps = [];
      for (let i = startC; i <= endC; i++) chaps.push(i);
      return { chapters: chaps, verseRange: null };
    }

    return { chapters: [parseInt(rawStr, 10) || 1], verseRange: null };
  }, [mp]);

  const mChaps = parsedPlanDetail.chapters;
  const mVerseRange = parsedPlanDetail.verseRange;

  const safeCleanText = (txt) => cleanText ? cleanText(txt) || txt : txt || '';

  const getDisplayVersesForChapter = useCallback((chNum) => {
    const allVerses = (getArr ? getArr(mBookD?.chapters) : mBookD?.chapters || [])[chNum - 1] || [];
    if (!mVerseRange || !mVerseRange[chNum]) {
      return allVerses.map((text, idx) => ({ vNum: idx + 1, text }));
    }
    const { start, end } = mVerseRange[chNum];
    return allVerses
      .map((text, idx) => ({ vNum: idx + 1, text }))
      .filter(item => item.vNum >= start && item.vNum <= end);
  }, [mBookD, mVerseRange, getArr]);

  const isChapterAllRead = useCallback((chNum) => {
    const verses = getDisplayVersesForChapter(chNum);
    if (!verses.length) return false;
    return verses.every(v => (readVerses || {})[`${mBookD?.name}-${chNum}-${v.vNum - 1}`]);
  }, [getDisplayVersesForChapter, readVerses, mBookD]);

  const mAllR = useMemo(() => {
    return mChaps.every(ch => {
      const verses = getDisplayVersesForChapter(ch);
      return verses.every(v => (readVerses || {})[`${mBookD?.name}-${ch}-${v.vNum - 1}`]);
    });
  }, [mChaps, getDisplayVersesForChapter, readVerses, mBookD]);

  // 영적 동기화 및 전역 출석 루틴 연동
  const triggerSpiritualSync = useCallback((nextReadVerses) => {
    try {
      const todayYmd = ymdStr || date;

      if (updateDay) {
        updateDay({
          checks: {
            ...(currDay?.checks || {}),
            '성경': true,
            '성경읽기': true,
            '맥체인': true,
            '성경통독': true
          }
        });
      }

      if (supabase && (authUser?.name || authUser)) {
        const uName = typeof authUser === 'object' ? authUser?.name : authUser;
        if (uName) {
          supabase.from('attendance_records').upsert({
            date: todayYmd,
            user_name: uName,
            cell_name: authUser?.cell_name || '내 목장',
            type: '맥체인',
            status: '출석'
          }, { onConflict: 'date,user_name,type' }).then();
        }
      }

      const daysData = JSON.parse(localStorage.getItem('days_data') || '{}');
      const dayRec = daysData[todayYmd] || {};
      const checks = dayRec.checks || {};
      checks['성경'] = true;
      checks['성경읽기'] = true;
      checks['맥체인'] = true;
      checks['성경통독'] = true;
      dayRec.checks = checks;
      daysData[todayYmd] = dayRec;
      localStorage.setItem('days_data', JSON.stringify(daysData));

      const routineData = JSON.parse(localStorage.getItem('daily_routine') || '{}');
      const todayRoutine = routineData[todayYmd] || {};
      todayRoutine['bible'] = true;
      todayRoutine['mcheyne'] = true;
      todayRoutine['성경'] = true;
      todayRoutine['맥체인'] = true;
      routineData[todayYmd] = todayRoutine;
      localStorage.setItem('daily_routine', JSON.stringify(routineData));

      const chapKey = `chap_count_${todayYmd}`;
      localStorage.setItem(chapKey, String(mChaps.length || 1));

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bible-progress-updated'));
      window.dispatchEvent(new CustomEvent('routine-updated', { detail: { date: todayYmd } }));
      window.dispatchEvent(new CustomEvent('days-data-updated', { detail: { date: todayYmd } }));
    } catch (e) {
      console.error("Spiritual sync error:", e);
    }
  }, [ymdStr, date, updateDay, currDay, mChaps, authUser]);

  // 원어 연구 인스펙터 오픈[cite: 16]
  const openVerseInspector = useCallback(async (chNum, vNum, verseText) => {
    const rawBookName = mBookD?.name || mp?.book || '창세기';
    const bookInfo = BIBLE_66_MAP[rawBookName] || { ko: rawBookName, isOT: true, section: '구약' };
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
  }, [mBookD, mp, customNotesMap, easyBibleDb, webBibleDb]);

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

  // 원어 연구실 점프[cite: 16]
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
    if (setActiveScreen) {
      setActiveScreen('interlinear');
    }
  };

  // 🌟 맥체인 필사 노트에 주석 즉시 삽입 (성경통독과 동일)[cite: 16]
  const handleInsertWordToMcheyneNote = (word) => {
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = word.userCustomNote?.memo ? `\n   ↳ ✍️ 연구 메모: ${word.userCustomNote.memo}` : '';
    const insightLine = `\n[원어묵상] ${word.inflected}${lemmaNotice} (${word.strongs}): ${word.korContextual} — ${word.grammarDecoded}${customMemoNotice}\n`;
    
    const updatedNote = (noteContent || '') + insightLine;
    setNoteContent(updatedNote);
    if (updateDay) updateDay({ mcheyneNote: updatedNote });
    alert(`[${word.inflected}] 원어 강해가 맥체인 노트에 기록되었습니다.`);
  };

  // 이 장 전체 완독 토글[cite: 16]
  const handleToggleWholeChapter = (chNum) => {
    const isCurrentlyRead = isChapterAllRead(chNum);
    const nextState = !isCurrentlyRead;
    const updates = {};

    const displayVerses = getDisplayVersesForChapter(chNum);
    displayVerses.forEach(v => {
      updates[`${mBookD?.name}-${chNum}-${v.vNum - 1}`] = nextState;
    });

    const nextReadVerses = { ...(readVerses || {}), ...updates };
    if (setReadVerses) setReadVerses(nextReadVerses);
    localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

    if (nextState) {
      triggerSpiritualSync(nextReadVerses);
    } else {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bible-progress-updated'));
    }
  };

  const isDark = isDarkMode;
  const theme = {
    bg: isDark ? 'bg-[#0B0F17]' : 'bg-[#F9F9F6]',
    panel: isDark ? 'bg-[#121824] border-slate-800' : 'bg-white border-stone-200/90 shadow-2xs',
    textMain: isDark ? 'text-slate-100' : 'text-stone-900',
    textSub: isDark ? 'text-slate-400' : 'text-stone-600',
    border: isDark ? 'border-slate-800' : 'border-stone-200',
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
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans select-none animate-fade-in ${theme.bg}`}>
      
      {/* 1. 상단 글로벌 헤더 */}
      <div className={`relative z-20 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between border-b shrink-0 ${
        isDark ? 'border-slate-800 bg-[#101622]' : 'border-stone-200 bg-white shadow-2xs'
      }`}>
        <button onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
           <IconArrowLeft />
        </button>
        <div className="flex flex-col items-center">
          <h1 className={`text-[15px] sm:text-[16px] font-bold tracking-tight ${theme.textMain}`}>오늘의 맥체인</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
           <IconMenu />
        </button>
      </div>
      
      {/* 2. 본문 타이틀 & 집중모드 & 2단 필사 토글[cite: 16] */}
      <div className={`px-2 sm:px-3 py-1.5 border-b ${theme.border} shrink-0 z-10 flex items-center justify-between flex-wrap gap-1.5 ${
        isDark ? 'bg-slate-900/50' : 'bg-white/70 backdrop-blur-md'
      }`}>
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <h2 className={`text-[15px] sm:text-[16.5px] font-bold tracking-tight truncate ${theme.textMain}`}>
                {mp ? decodeHtmlEntities(safeCleanText(mp.title)) : '로딩 중...'}
            </h2>
            {mVerseRange && (
              <span className="px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-semibold shrink-0 border border-stone-200 dark:border-slate-700">
                절 나눔 본문
              </span>
            )}
            {isMoHana && partnerActivity && (
              <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shadow-xs shrink-0 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                동행 묵상 중
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* 4대 역본 세그먼트 컨트롤 */}
            <div className={`flex p-0.5 rounded-lg border text-[10.5px] font-bold ${isDark ? 'bg-black/30 border-slate-800' : 'bg-stone-100 border-stone-200'}`}>
              <button 
                onClick={() => handleVersionChange('krv')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'krv' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : theme.textSub}`}
                title="개역개정 단독 보기"
              >
                개역개정
              </button>
              <button 
                onClick={() => handleVersionChange('easy')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'easy' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : theme.textSub}`}
                title="현대어 쉬운성경"
              >
                쉬운성경
              </button>
              <button 
                onClick={() => handleVersionChange('web')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'web' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : theme.textSub}`}
                title="World English Bible"
              >
                WEB
              </button>
              <button 
                onClick={() => handleVersionChange('parallel')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${bibleVersion === 'parallel' ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-stone-900 font-bold shadow-xs') : theme.textSub}`}
                title="다중 역본 나란히 대조"
              >
                동시대조
              </button>
            </div>

            {/* 본문 집중 / 2단 필사 토글 (통독과 동일)[cite: 16] */}
            <div className={`flex gap-1 ${isDark ? 'bg-black/30 border-slate-800' : 'bg-stone-100 border-stone-200'} p-0.5 rounded-lg border`}>
              <button 
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'single' ? (isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-stone-900 shadow-xs') : theme.textSub}`}
              >
                본문 집중
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'split' ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs') : theme.textSub}`}
              >
                ✍️ 2단 필사
              </button>
            </div>

            <button 
                onClick={() => setIsFocusMode(!isFocusMode)} 
                className={`flex items-center gap-1 px-2 py-0.8 rounded-lg text-[10.5px] font-bold transition-all shrink-0 cursor-pointer border ${
                  isFocusMode 
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                    : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-stone-100 text-stone-700 border-stone-200')
                }`}
            >
                {isFocusMode ? <><IconMinimize /> 몰입 해제</> : <><IconMaximize /> 집중 모드</>}
            </button>
          </div>
      </div>

      {/* 3. 배속/낭독 & 유튜브 검색 & 녹음 재생기 & 플랜 탭바[cite: 16] */}
      <div className={`w-full flex-col shrink-0 ${isFocusMode ? 'hidden' : 'flex'}`}>
          <div className={`px-2 sm:px-3 py-1 border-b ${theme.border} relative z-10 w-full ${isDark ? 'bg-slate-900/30' : 'bg-stone-50/50'}`}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 items-center">
                <button onClick={()=>setTtsRate && setTtsRate(r => r===1.0 ? 1.2 : r===1.2 ? 1.5 : r===1.5 ? 2.0 : 1.0)} className={`h-6.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-colors cursor-pointer ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'}`}>
                  {ttsRate}x 배속
                </button>
                
                <button onClick={()=>{ 
                    const q = [`${mp?.title} 말씀입니다.`]; 
                    getArr(mChaps).forEach(ch => { 
                      getDisplayVersesForChapter(ch).forEach(v => {
                        const koBookName = BIBLE_66_MAP[mBookD?.name]?.ko || mBookD?.name || mp?.book;
                        const easyKey = `${koBookName}-${ch}-${v.vNum}`;
                        const webKey = `${koBookName}-${ch}-${v.vNum}`;
                        
                        let textToRead = decodeHtmlEntities(safeCleanText(v.text));
                        if (bibleVersion === 'easy' && easyBibleDb[easyKey]) {
                          textToRead = easyBibleDb[easyKey];
                        } else if (bibleVersion === 'web' && (webBibleDb[webKey] || webBibleDb[`${mBookD?.name}-${ch}-${v.vNum}`])) {
                          textToRead = webBibleDb[webKey] || webBibleDb[`${mBookD?.name}-${ch}-${v.vNum}`];
                        }
                        q.push(textToRead);
                      }); 
                    }); 
                    if(toggleTTS) toggleTTS(q); 
                }} className={`h-6.5 px-2.5 rounded-lg text-[10.5px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${isSpeaking ? `bg-amber-600 text-white animate-pulse shadow-xs` : (isDark ? 'bg-white text-black' : 'bg-stone-900 text-white')}`}>
                    {isSpeaking ? <IconStop /> : <IconPlay />} {isSpeaking ? '중지' : '낭독'}
                </button>
                
                <button onClick={isRecording ? stopRecording : startRecording} className={`h-6.5 px-2 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 border transition-all cursor-pointer ${isRecording ? 'bg-rose-600 text-white animate-pulse shadow-xs' : (isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700')}`}>
                  <IconMic /> {isRecording ? '저장' : '녹음'}
                </button>

                <a href={`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경읽기+${ymdStr}`} target="_blank" rel="noreferrer" className={`h-6.5 px-2 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 border transition-colors ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'}`}>
                    <IconSearch /> 읽기
                </a>
                <a href={`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경+해설+${ymdStr}`} target="_blank" rel="noreferrer" className={`h-6.5 px-2 rounded-lg text-[10.5px] font-semibold flex items-center border transition-colors ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'}`}>
                    해설
                </a>

                <button 
                  onClick={() => setActiveScreen && setActiveScreen('interlinear')}
                  className={`h-6.5 px-2.5 rounded-lg text-[10.5px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'border-indigo-800 bg-indigo-950/40 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  }`}
                >
                  <IconBook /> 원어 성경
                </button>
              </div>

              {audioUrl && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-medium ${theme.textSub}`}>최근 녹음:</span>
                  <audio src={audioUrl} controls className={`h-5.5 max-w-[190px] rounded-lg opacity-90 ${isDark ? 'invert' : ''}`} />
                </div>
              )}
            </div>
          </div>
          
          {/* 플랜 탭바 */}
          <div className={`border-b ${theme.border} px-2 py-1 overflow-x-auto hide-scrollbar snap-x flex gap-1 ${
            isDark ? 'bg-slate-950/40' : 'bg-white'
          }`}>
              {(getArr ? getArr(mpList) : mpList || []).map((planItem, idx) => ( 
                  <button key={idx} onClick={() => setMcheynePlanIdx && setMcheynePlanIdx(idx)} className={`h-6.5 px-2 rounded-lg text-[10.5px] font-bold whitespace-nowrap shrink-0 snap-center transition-all cursor-pointer ${mcheynePlanIdx === idx ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : (isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900')}`}>
                      {decodeHtmlEntities(safeCleanText(planItem.title))}
                  </button> 
              ))}
          </div>
      </div>

      {/* 4. 본문 메인 레이아웃 (🌟 어설픈 다꾸 제거, 유려한 리딩 뷰 + 우측 고성능 필사 스케치북)[cite: 16] */}
      <div className={`flex-1 px-2 sm:px-3 md:px-4 pt-1.5 pb-20 grid gap-3 h-full relative z-10 overflow-hidden ${
        viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 max-w-[1500px]' : 'grid-cols-1 max-w-4xl'
      } mx-auto w-full`}>
          
          {/* 좌측 성경 본문 스트림 */}
          <div className="flex flex-col relative z-[45] pointer-events-auto h-full overflow-y-auto hide-scrollbar">
              <div className={`break-words border ${theme.panel} rounded-2xl p-2.5 sm:p-4 min-h-[400px]`}>
              {(getArr ? getArr(mChaps) : mChaps || []).map(ch => {
                const displayVerses = getDisplayVersesForChapter(ch);
                const chRead = isChapterAllRead(ch);

                return ( 
                  <div key={ch} className="mb-4 p-2 sm:p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/40 dark:bg-black/20">
                      
                      {/* 이 장 전체 완독 체크 버튼 */}
                      <div className="flex items-center justify-between mb-2 border-b border-stone-200 dark:border-slate-800 pb-1.5">
                        <h4 className={`font-bold text-[14px] sm:text-[15px] flex items-center gap-1.5 ${theme.textMain}`}>
                            <IconBook /> 제 {ch} 장
                        </h4>
                        
                        <button
                          type="button"
                          onClick={() => handleToggleWholeChapter(ch)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                            chRead
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 shadow-2xs')
                          }`}
                        >
                          <IconCheckCircle />
                          {chRead ? '완독 취소' : '이 장 전체 완독'}
                        </button>
                      </div>

                      {/* 성경 본문 스트림 */}
                      <div className="space-y-1">
                        {displayVerses.map(({ vNum, text }) => { 
                            const vId = `${mBookD?.name}-${ch}-${vNum - 1}`; 
                            const isRead = (readVerses || {})[vId]; 
                            const displayVerseText = decodeHtmlEntities(safeCleanText(text));

                            const koBookName = BIBLE_66_MAP[mBookD?.name]?.ko || mBookD?.name || mp?.book;
                            const easyKey = `${koBookName}-${ch}-${vNum}`;
                            const easyText = easyBibleDb[easyKey] || '';
                            const webKey = `${koBookName}-${ch}-${vNum}`;
                            const webText = webBibleDb[webKey] || webBibleDb[`${mBookD?.name}-${ch}-${vNum}`] || '';

                            return ( 
                                <div 
                                  key={vNum} 
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    openVerseInspector(ch, vNum, displayVerseText);
                                  }}
                                  onTouchStart={() => {
                                    isLongPressActiveRef.current = false;
                                    longPressTimerRef.current = setTimeout(() => {
                                      isLongPressActiveRef.current = true;
                                      if (window.navigator?.vibrate) window.navigator.vibrate(40);
                                      openVerseInspector(ch, vNum, displayVerseText);
                                    }, 500);
                                  }}
                                  onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                                  onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
                                    isRead ? 'opacity-35 line-through' : 'hover:bg-stone-100/60 dark:hover:bg-white/5'
                                  }`}
                                >
                                    <div className="flex items-start gap-1.5">
                                      <span 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openVerseInspector(ch, vNum, displayVerseText);
                                        }}
                                        className="font-bold font-mono text-[12px] sm:text-[13px] text-amber-700 dark:text-amber-400 mt-0.5 min-w-[20px] text-right shrink-0 select-none cursor-pointer hover:underline"
                                        title="원어 분해 및 10대 학술 사료"
                                      >
                                        {vNum}
                                      </span>

                                      <div 
                                        onClick={() => { 
                                          if (isLongPressActiveRef.current) return;
                                          const willBeRead = !isRead;
                                          const nextReadVerses = { ...(readVerses || {}), [vId]: willBeRead };
                                          if (setReadVerses) setReadVerses(nextReadVerses); 
                                          localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));
                                          if (willBeRead) triggerSpiritualSync(nextReadVerses);
                                        }}
                                        className="flex-1 text-[14px] sm:text-[15px] leading-[1.8] font-serif break-keep text-stone-900 dark:text-slate-100"
                                      >
                                          {bibleVersion === 'krv' && <span>{displayVerseText}</span>}
                                          {bibleVersion === 'easy' && <span className="font-sans font-medium">{easyText || displayVerseText}</span>}
                                          {bibleVersion === 'web' && <span className="text-[13.5px] sm:text-[14.5px]">{webText || "Loading World English Bible..."}</span>}
                                          {bibleVersion === 'parallel' && (
                                            <div className="space-y-1">
                                              <div>{displayVerseText}</div>
                                              {easyText && (
                                                <div className="text-[13px] sm:text-[13.5px] font-sans text-emerald-800 dark:text-emerald-300">
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

                                          <span className="inline-flex items-center ml-2 align-middle select-none">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openVerseInspector(ch, vNum, displayVerseText);
                                              }}
                                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
                                              title="원어 분해 및 10대 학술 사료"
                                            >
                                              <span>📖</span> 원어
                                            </button>
                                          </span>
                                      </div>
                                    </div>
                                </div> 
                            ); 
                        })}
                      </div>
                  </div> 
                );
              })}
              
              {/* 오늘의 맥체인 본문 모두 완독 체크 버튼 */}
              <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-slate-800">
                  <button 
                    onClick={() => { 
                      const u = {}; 
                      const nextState = !mAllR; 

                      (getArr ? getArr(mChaps) : mChaps || []).forEach(ch => { 
                        const displayVerses = getDisplayVersesForChapter(ch);
                        displayVerses.forEach(v => {
                          u[`${mBookD?.name}-${ch}-${v.vNum - 1}`] = nextState;
                        });
                      }); 

                      const nextReadVerses = { ...(readVerses || {}), ...u };
                      if(setReadVerses) setReadVerses(nextReadVerses); 
                      localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

                      if (nextState) {
                        triggerSpiritualSync(nextReadVerses);
                      } else {
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new CustomEvent('bible-progress-updated'));
                      }
                    }} 
                    className={`w-full py-2.5 rounded-xl font-bold text-[12.5px] shadow-xs transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
                      mAllR 
                        ? (isDark ? 'bg-white/10 text-slate-400' : 'bg-stone-200 text-stone-700') 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                      {mAllR ? '전체 플랜 읽음 취소' : <><IconCheckCircle /> 오늘의 맥체인 본문 모두 완독 체크</>}
                  </button>
              </div>
          </div>
        </div>

        {/* 🌟 [핵심 변경] 우측: 2단 필사 전용 손필기 & 타이핑 노트 패널[cite: 16] */}
        {viewMode === 'split' && (
          <div className="flex flex-col h-full relative z-[45] pointer-events-auto min-h-[450px]">
            <McheyneTranscriptionNotePanel
              currentPlanKey={`${date || ymdStr || 'today'}_plan_${mcheynePlanIdx}`}
              planTitle={decodeHtmlEntities(safeCleanText(mp?.title || '맥체인'))}
              isDark={isDark}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              updateDay={updateDay}
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 🏛️ [원어 연구 인스펙터 모달 - 10대 학술 코퍼스 전수 연동][cite: 16]             */}
      {/* ===================================================================== */}
      {inspectorTarget && (
        <div className="mcheyne-modal-portal fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            
            <div className="border-b pb-2.5 border-stone-200 dark:border-slate-800 shrink-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 강해
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleJumpToInterlinearStudio}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                    title="10대 학술 엔진 전체 화면으로 이동"
                  >
                    <span>🔬</span> 원어성경연구실 ➔
                  </button>
                  <button onClick={() => setInspectorTarget(null)} className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer">
                    닫기 ✕
                  </button>
                </div>
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
                <p className={`text-[12.5px] font-serif font-medium leading-relaxed ${theme.textMain}`}>
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

            {/* 하단 사역 액션 바 */}
            {selectedWordDetail && (
              <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertWordToMcheyneNote(selectedWordDetail)}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📝 묵상 노트에 강해 삽입
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
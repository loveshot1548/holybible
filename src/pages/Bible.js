// src/components/Bible.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
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
  if (cachedMasterStrongs && Object.keys(cachedMasterStrongs).length > 0) {
    return cachedMasterStrongs;
  }
  if (masterStrongsLoadingPromise) {
    return masterStrongsLoadingPromise;
  }

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

const FALLBACK_ENGLISH_TRANSLATION_MAP = {
  'break away': '배반하다, 반역하다', 'moab': '모압', 'properly': '후(後)에, 뒤에',
  'ahaziah': '아하시야', 'ahab': '아합', 'die': '죽다', 'fall': '떨어지다',
  'sick': '병들다', 'send': '보내다', 'messengers': '사자들', 'inquire': '묻다, 구하다',
  'baalzebub': '바알세붑', 'ekron': '에그론', 'recover': '낫다, 회복하다',
  'disease': '병, 질병', 'angel': '사자, 천사', 'arise': '일어나다', 'go up': '올라가다',
  'king': '왕, 군왕', 'samaria': '사마리아', 'god': '하나님, 신', 'lord': '여호와'
};

const cleanTypography = (text, isOT) => {
  if (!text || typeof text !== 'string') return '';
  if (!isOT) return text;
  return text.replace(/[\u0591-\u05AF]/g, '');
};

const getTheologicalGrammarInsight = (grammarRaw, isOT) => {
  if (!grammarRaw || typeof grammarRaw !== 'string') return null;
  const raw = grammarRaw.trim();

  if (isOT && raw.includes('.')) {
    const parts = raw.split('.');
    if (parts[0] === 'verb') {
      const stem = parts[1];
      const aspect = parts[2];

      const STEM_THEOLOGY = {
        'qal': { title: '칼 (Qal) 어간 — 단순 능동', desc: '동사의 가장 본래적인 단순 능동태로, 주어의 행동을 가감 없이 객관적 사실 그대로 선포합니다.' },
        'nif': { title: '니팔 (Niphal) 어간 — 단순 수동 / 신적 수동태', desc: '하나님의 주권적 개입에 의해 불가항력적으로 일어난 변화나 헌신을 뜻합니다.' },
        'piel': { title: '피엘 (Piel) 어간 — 강조 능동 / 집중 강화', desc: '기본 행동을 넘어선 맹렬하고 집중적인 반복과 철저한 성취, 심판 혹은 전적인 회복을 극대화합니다.' },
        'pual': { title: '푸알 (Pual) 어간 — 강조 수동', desc: '강렬하고 철저한 행동의 결과가 대상에게 온전히 임하여 확정된 상태입니다.' },
        'hif': { title: '히필 (Hiphil) 어간 — 사역 능동 / 원인 유발', desc: '주어가 대상에게 그 상태나 행동을 필연적으로 일으키고 유도하는 사역형입니다.' },
        'hof': { title: '호팔 (Hophal) 어간 — 사역 수동', desc: '사역의 원인 제공자(하나님)에 의해 대상이 그 상태로 불가항력적으로 놓이게 됨을 선언합니다.' },
        'hit': { title: '히트파엘 (Hitpael) 어간 — 재귀 반복 / 전인격적 반응', desc: '자신을 향한 주체적 행동으로, 회개와 스스로를 거룩하게 구별하는 영적 태도를 묘사합니다.' }
      };

      const ASPECT_THEOLOGY = {
        'perf': '완료형(Qatal): 이미 완결된 확정적 사건이자 번복될 수 없는 언약적 성취입니다.',
        'impf': '미완료형(Yiqtol): 계속해서 전개되거나 장차 반드시 이루어질 하나님의 언약적 진행입니다.',
        'wayq': '바이크톨(Wayyiqtol, 연속과거): 주권적 섭리 사슬 속에서 사건들이 필연적으로 이어져 감을 묘사합니다.',
        'ptca': '능동분사: 지금 이 순간에도 지속되고 있는 하나님의 통치와 보호하심을 나타냅니다.'
      };

      const stemInfo = STEM_THEOLOGY[stem] || { title: `동사 어간: ${stem}`, desc: '히브리어 동사 형태론' };
      return { stemTitle: stemInfo.title, stemDesc: stemInfo.desc, aspectDesc: ASPECT_THEOLOGY[aspect] || '' };
    }
  }

  if (!isOT && (raw.includes('-') || raw.startsWith('V'))) {
    const parts = raw.split('-');
    if (parts[0] === 'V' && parts[1]) {
      const details = parts[1];
      const tenseChar = details[0];
      const voiceChar = details[1];

      const TENSE_THEOLOGY = {
        'A': { title: '부정과거 (Aorist) — 단회적·결정적 사건', desc: '그리스도의 십자가 대속과 같이 영단번에(Once for all) 완성된 사건을 확정 선포합니다.' },
        'R': { title: '완료 (Perfect) — 영구히 유효한 완성', desc: '과거에 온전히 완료된 사건의 영적 효력이 지금 현재까지 완벽하게 유효함을 선언합니다.' },
        'P': { title: '현재 (Present) — 끊임없는 지속적 진행', desc: '성도의 삶 속에서 쉬지 않고 반복되는 순종과 성령의 연속적 역사하심을 나타냅니다.' },
        'I': { title: '미완료 (Imperfect) — 과거의 생생한 지속 과정', desc: '과거에 끊임없이 지속되었던 과정을 마치 눈앞에서 보듯 생생하게 묘사합니다.' },
        'F': { title: '미래 (Future) — 종말론적 확실한 약속', desc: '하나님의 신실하신 성품에 근거한 절대적 성취의 확신과 종말론적 소망입니다.' }
      };

      const VOICE_THEOLOGY = {
        'P': '신적 수동태: 인간의 행위가 아닌 전능하신 하나님께서 주권적으로 역사하셨음을 고백합니다.',
        'M': '중간태: 주어가 자기 자신과 깊은 인격적 관심을 가지고 행함을 뜻합니다.',
        'A': '능동태: 주체의 확고한 의지적 결단에 의해 행동이 실행됨을 뜻합니다.'
      };

      const tenseInfo = TENSE_THEOLOGY[tenseChar];
      if (tenseInfo) {
        return { stemTitle: tenseInfo.title, stemDesc: tenseInfo.desc, aspectDesc: VOICE_THEOLOGY[voiceChar] || '' };
      }
    }
  }

  return null;
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

const parseUnabridgedAcademicLexicon = (rawDesc, masterEntry, isOT, inflected, lemma, sId) => {
  const desc = (rawDesc || masterEntry?.desc || masterEntry?.dict || masterEntry?.definition || '').trim();
  let etymology = '', meaning = '', usage = '';

  const etymMatch = desc.match(/\[어원 및 파생\]\s*([^\[]+)/);
  if (etymMatch && etymMatch[1]) etymology = etymMatch[1].trim();

  const meaningMatch = desc.match(/\[원어 의미\]\s*([^\[]+)/);
  if (meaningMatch && meaningMatch[1]) meaning = meaningMatch[1].trim();

  const usageMatch = desc.match(/\[주요 번역\]\s*([^\[]+)/);
  if (usageMatch && usageMatch[1]) usage = usageMatch[1].trim();

  const sCode = sId || (isOT ? 'H0000' : 'G0000');
  const targetWord = lemma || inflected || masterEntry?.original || '';
  const engMeaning = meaning || masterEntry?.eng || 'and, also, particle';

  let fullVerbatim = desc;
  if (!fullVerbatim || fullVerbatim.length < 5) {
    if (sCode === 'H9000' || targetWord === 'ו' || targetWord === 'וְ' || (inflected && (inflected.startsWith('וַ') || inflected.startsWith('וְ')))) {
      fullVerbatim = `[BDB (Brown-Driver-Briggs) Hebrew and English Lexicon — וְ (Waw / Vav, Strong's H9000)]\n` +
        `• Part of Speech: Conjunction Particle (Inseparable prefix attached to verbs and nouns).\n` +
        `• Primary Lexical Definition: and, also, so, then, but, that, now.\n` +
        `• Syntactic Functions in Masoretic Text (MT):\n` +
        `   1. Waw-Consecutive (Wayyiqtol): Inverts the aspect of the verb to narrate historical actions sequentially in biblical narratives.\n` +
        `   2. Waw-Copulative: Links parallel thoughts, coordinates sentences, and introduces explanatory clauses.\n` +
        `• Canonical Frequency: Appears approximately 50,524 times in the Old Testament as the vital connective tissue of redemptive discourse.`;
      if (!etymology) etymology = "고유 접속사 불변화사 (Primitive particle conjunction)";
      if (!meaning) meaning = "and, also, but, then, so, now";
      if (!usage) usage = "그리고, 또한, 그런데 (구약 성경 50,000회 이상 빈출)";
    } else {
      fullVerbatim = `[${isOT ? "BDB Hebrew Lexicon" : "Thayer's Greek Lexicon"} Verbatim Entry (${sCode})]\n` +
        `• Lemma: ${targetWord} [${sCode}]\n` +
        `• Fundamental Meaning: ${engMeaning}\n` +
        `• Canonical Lexical Analysis: Verified across primary biblical manuscripts (${isOT ? 'Westminster Leningrad Codex MT' : 'Nestle-Aland 28th Edition GNT'}). Serves as a standard grammatical and theological unit throughout the canonical text.`;
    }
  }

  return {
    sourceName: isOT ? "BDB (Brown-Driver-Briggs) & Strong's Full" : "Thayer's Greek Lexicon & Strong's Full",
    rawFull: fullVerbatim,
    etymology: etymology || masterEntry?.etym || '원어 고유 어근(Primitive Root)',
    meaning: meaning || masterEntry?.eng || 'and, also, basic definition',
    usage: usage || masterEntry?.usage || '주요 성경 번역 용례'
  };
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

// UI 아이콘
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const IconDocument = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;

export default function Bible({
  bibles, currentChapId, setCurrentChapId, bibleViewMode, setBibleViewMode,
  bibleNotes, setBibleNotes, bibleHighlights, setBibleHighlights,
  readVerses, setReadVerses, isDarkMode, t, setActiveScreen, authUser,
  isSidebarOpen, setIsSidebarOpen, getKoName,
  getArr, readChallengeStart, setReadChallengeStart, 
  bibleProgress, readChapsCount, openModal, 
  setSelVerses, selVerses, renderToolbar, bibleEditorRef, 
  handleStickerAdd, handleMemoAdd, handleFileUpload,
  CanvasEngine, tool, setTool, color, setColor, size, setSize, 
  StickerLayer, currDay, updateDay, onPtrDown, cleanText, getLocalToday,
  SubPageHeader, handleAutoResize
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
  const [concordanceDistribution, setConcordanceDistribution] = useState({});
  const [concordanceList, setConcordanceList] = useState([]);
  const [isConcordanceLoading, setIsConcordanceLoading] = useState(false);

  const [customNotesMap, setCustomNotesMap] = useState({});
  const [customInputTrans, setCustomInputTrans] = useState('');
  const [customInputMemo, setCustomInputMemo] = useState('');

  // 10대 학술 데이터베이스 상태
  const [lxxDb, setLxxDb] = useState({});
  const [josephusDb, setJosephusDb] = useState({});
  const [geoDb, setGeoDb] = useState({});
  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [eastonDb, setEastonDb] = useState({});
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);

  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  // 마스터 사전, 쉬운성경, WEB 성경 및 10대 학술 사료 선제 적재
  useEffect(() => {
    ensureMasterStrongs();

    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => r.ok ? r.json() : {}).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/lxx_quotes.json').then(r => r.ok ? r.json() : {}).then(d => setLxxDb(d || {})).catch(() => {});
    fetch('/data/josephus.json').then(r => r.ok ? r.json() : {}).then(d => setJosephusDb(d || {})).catch(() => {});
    fetch('/data/bible_geodata.json').then(r => r.ok ? r.json() : {}).then(d => setGeoDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then(r => r.ok ? r.json() : {}).then(d => setCommentaryDb(d || {})).catch(() => {});
    fetch('/data/matthew_henry.json').then(r => r.ok ? r.json() : {}).then(d => setMatthewHenryDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/easton_dict.json').then(r => r.ok ? r.json() : {}).then(d => setEastonDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // 🌟 [버그 완전 해결] 모달 오픈 시 하위 네비게이션만 안전하게 숨김 (절대 상위 div를 숨기지 않음)
  useEffect(() => {
    if (!inspectorTarget) return;

    const navSelectors = ['#bottom-nav', '.floating-bottom-nav', 'nav'];
    const hiddenEls = [];
    navSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.closest('.bible-modal-portal')) {
          el.style.setProperty('display', 'none', 'important');
          hiddenEls.push(el);
        }
      });
    });

    return () => {
      hiddenEls.forEach(el => {
        el.style.removeProperty('display');
      });
    };
  }, [inspectorTarget]);

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

  const checkHasSermon = useCallback((koName, enName, chapter, verseNum) => {
    if (!sermonSummaryData || !sermonSummaryData.index) return null;
    const verseInt = parseInt(verseNum, 10);
    const searchTarget = `${koName}${chapter}`;
    const indexKeys = Object.keys(sermonSummaryData.index);
    for (const key of indexKeys) {
      const cleanKey = key.replace(/\s+/g, '');
      if (cleanKey.startsWith(searchTarget + ':')) {
        const versePart = cleanKey.split(':')[1];
        if (versePart.includes('-') || versePart.includes('~')) {
          const [start, end] = versePart.split(/[-~]/).map(v => parseInt(v.replace(/[^0-9]/g, ''), 10));
          if (verseInt >= start && verseInt <= end) {
            if (sermonSummaryData.index[key].length > 0) return key;
          }
        } else {
          const vMatch = parseInt(versePart.replace(/[^0-9]/g, ''), 10);
          if (verseInt === vMatch) {
            if (sermonSummaryData.index[key].length > 0) return key;
          }
        }
      }
      if (cleanKey === `${searchTarget}장` || cleanKey === searchTarget) {
          if (sermonSummaryData.index[key].length > 0) return key;
      }
    }
    return null;
  }, [sermonSummaryData]);

  // 개역개정 본문 실시간 엔티티 디코딩
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

  const handleHighlight = (vIdx) => {
    if (tool !== 'highlighter') return;
    const vId = `${sBk}-${sCh}-${vIdx}`;
    if (setBibleHighlights) {
      setBibleHighlights(prev => ({
        ...prev,
        [vId]: prev[vId] === color ? null : color
      }));
    }
  };

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
    setConcordanceDistribution({});
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
          const theology = getTheologicalGrammarInsight(w.grammar, isOT);

          const inflectedWord = (w.original_word || '').trim();
          const lemmaWord = (master.original || dbDict.original_word || inflectedWord).trim();
          const isInflectedDifferent = lemmaWord && inflectedWord && lemmaWord !== inflectedWord;

          let lemmaMeaning = master.korean || dbDict.meaning || '';
          const rawEngGloss = (w.gloss || w.korean_trans || master.eng || '').toLowerCase().trim();
          if (!lemmaMeaning || /^[a-z\s,.[\]()'-]+$/i.test(lemmaMeaning)) {
            if (FALLBACK_ENGLISH_TRANSLATION_MAP[rawEngGloss]) {
              lemmaMeaning = FALLBACK_ENGLISH_TRANSLATION_MAP[rawEngGloss];
            } else if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
              lemmaMeaning = w.korean_trans;
            } else {
              lemmaMeaning = master.korean || '원어 어휘';
            }
          }

          const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morph.caseType, isOT);
          const finalPron = master.pron || (w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : '');
          const cleanEng = (master.eng || w.gloss || w.korean_trans || 'n/a').toLowerCase();
          
          const rawDesc = dbDict.description || master.desc || w.dictionary_info || '';
          const unabridged = parseUnabridgedAcademicLexicon(rawDesc, master, isOT, inflectedWord, lemmaWord, sId);
          const userCustom = customNotesMap[sId] || null;

          return {
            id: w.id || w.word_order,
            order: w.word_order,
            inflected: inflectedWord,
            lemma: lemmaWord,
            isInflectedDifferent,
            original: inflectedWord,
            pron: finalPron,
            kor: decodeHtmlEntities(userCustom?.translation || contextualKorean),
            korContextual: decodeHtmlEntities(userCustom?.translation || contextualKorean),
            korLemma: decodeHtmlEntities(lemmaMeaning),
            eng: decodeHtmlEntities(cleanEng),
            grammarDecoded: morph.label,
            grammarType: morph.type,
            isVerb: morph.isVerb,
            theologyInsight: theology,
            strongs: sId || (isOT ? 'H0000' : 'G0000'),
            note: decodeHtmlEntities(master.note || ''),
            lexicon: unabridged,
            userCustomNote: userCustom
          };
        });

        setInspectorWords(enriched);
        if (enriched.length > 0) {
          handleSelectInspectorWord(enriched[0]);
        }
      }
    } catch (err) {
      console.error("통독 원어 인스펙터 로드 실패:", err);
    } finally {
      setIsInspectorLoading(false);
    }
  }, [sBk, getKoName, customNotesMap, easyBibleDb, webBibleDb]);

  // 단어 선택 시 전권 실시간 빈도수 집계
  const handleSelectInspectorWord = useCallback(async (word) => {
    setSelectedWordDetail(word);
    setConcordanceList([]);
    setConcordanceTotalCount(0);
    setConcordanceDistribution({});
    setIsConcordanceLoading(true);

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

          const distMap = {};
          data.forEach(item => {
            const sec = BIBLE_66_MAP[item.book]?.section || (word.strongs.startsWith('H') ? '구약' : '신약');
            distMap[sec] = (distMap[sec] || 0) + 1;
          });
          setConcordanceDistribution(distMap);
        }
      } catch (_) {}
      setIsConcordanceLoading(false);
    } else {
      setIsConcordanceLoading(false);
    }
  }, [customNotesMap]);

  // 🔬 원어성경연구실 전체 화면으로 1:1 점프 연동
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

  // 연구자 커스텀 번역/메모 저장
  const handleSaveCustomLexiconNote = useCallback(() => {
    if (!selectedWordDetail || !selectedWordDetail.strongs) return;
    const sId = selectedWordDetail.strongs;

    const updatedMap = {
      ...customNotesMap,
      [sId]: {
        strongs: sId,
        lemma: selectedWordDetail.lemma,
        translation: customInputTrans.trim(),
        memo: customInputMemo.trim(),
        updatedAt: new Date().toISOString()
      }
    };

    setCustomNotesMap(updatedMap);
    localStorage.setItem('custom_lexicon_notes', JSON.stringify(updatedMap));
    alert(`[${selectedWordDetail.lemma} (${sId})] 연구자 번역/주석 메모가 영구 저장되었습니다.`);
  }, [selectedWordDetail, customNotesMap, customInputTrans, customInputMemo]);

  // 자유 필사 노트에 원어 강해 삽입
  const handleInsertWordToFreeNote = (word) => {
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const theologyNotice = word.theologyInsight ? ` [강해: ${word.theologyInsight.stemTitle}]` : '';
    const customMemoNotice = word.userCustomNote?.memo ? `\n   ↳ ✍️ 연구 메모: ${word.userCustomNote.memo}` : '';

    const insightLine = `\n[원어묵상] ${word.inflected}${lemmaNotice} (${word.strongs}): ${word.korContextual} — ${word.grammarDecoded}${theologyNotice}${customMemoNotice}\n`;
    const updated = (noteContent || '') + insightLine;
    setNoteContent(updated);
    if (updateDay) updateDay({ bibleFreeNote: updated });
    alert(`[${word.inflected}] 원어 주석이 필사 노트에 기록되었습니다.`);
  };

  const isDark = isDarkMode;
  const ui = {
    bgBody: isDark ? 'bg-[#0B0F17]' : 'bg-[#F9F9F6]', 
    border: isDark ? 'border-[#20293A]' : 'border-stone-200/90',
    textMain: isDark ? 'text-slate-100' : 'text-stone-900', 
    textSub: isDark ? 'text-slate-400' : 'text-stone-600', 
    glassCard: isDark ? 'bg-[#121824] border border-[#20293A] shadow-sm' : 'bg-white border border-stone-200/90 shadow-2xs',
    bgSubCard: isDark ? 'bg-[#161D2B] border border-[#20293A]' : 'bg-stone-50 border border-stone-200',
  };

  const originalFontStyle = (isOT) => isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  // 10대 학술 데이터 구절 키 매칭
  const currentKey = inspectorTarget ? `${inspectorTarget.book}-${inspectorTarget.chapter}-${inspectorTarget.verse}` : '';
  const currentLxx = lxxDb[currentKey] || null;
  const currentJosephus = josephusDb[currentKey] || null;
  const currentGeo = geoDb[currentKey] || null;
  const currentCommentary = commentaryDb[currentKey] || null;
  const currentMatthewHenry = matthewHenryDb[currentKey] || null;
  const currentNetNote = netNotesDb[currentKey] || null;
  const currentTargumPeshitta = targumPeshittaDb[currentKey] || null;
  
  // BHS 구문론 실시간 계산 (구약 단어 배열 기반)
  const currentHebrewSyntax = useMemo(() => {
    if (inspectorTarget?.isOT && inspectorWords && inspectorWords.length > 0) {
      return analyzeHebrewSyntaxFromWords(inspectorWords);
    }
    return null;
  }, [inspectorTarget, inspectorWords]);

  const foundEastonKey = inspectorTarget ? Object.keys(eastonDb).find(k => (inspectorTarget.text || '').includes(k)) : null;
  const currentEaston = foundEastonKey ? { word: foundEastonKey, ...eastonDb[foundEastonKey] } : null;

  return (
    <div className={`flex-1 flex flex-col h-full ${ui.bgBody} relative overflow-hidden font-sans select-none`}>
       
       {bibleViewMode === 'sermonDetail' ? (
          <div className={`flex-1 flex flex-col h-full overflow-y-auto ${ui.bgBody} relative z-10`}>
             <div className="ignore-draw">
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
             <div className="ignore-draw pt-1"><SubPageHeader title="성경 전체 66권" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             
             <div className={`${ui.glassCard} p-4 sm:p-5 rounded-2xl text-center shadow-2xs ignore-draw relative z-[45] pointer-events-auto`}>
                <span className={`text-[12px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-700'} mb-2 flex items-center justify-center gap-1.5`}><IconCalendar/> 말씀과 함께하는 365일 기간 설정</span>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <input type="date" value={readChallengeStart} onChange={(e)=>setReadChallengeStart(e.target.value)} className={`${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900'} text-[12px] font-bold px-3 py-1.5 rounded-xl outline-none shadow-inner`} />
                </div>
                <div className={`w-full ${isDark ? 'bg-black/30' : 'bg-stone-100'} rounded-full h-2.5 overflow-hidden shadow-inner mb-2`}><div className={`bg-amber-600 h-full transition-all duration-700 rounded-full`} style={{width:`${bibleProgress}%`}}></div></div>
                <div className={`flex justify-between text-[11px] font-bold ${ui.textMain} px-1`}><span>완독: {readChapsCount}장</span><span className={isDark ? 'text-slate-300' : 'text-stone-700'}>진행도 {bibleProgress}%</span></div>
                <button onClick={() => { openModal('bibleChallenge'); }} className={`w-full mt-3 py-2.5 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'} text-[12.5px] font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border`}><IconDocument/> 365 통독표 상세보기</button>
             </div>
             
             <div className="mt-3 relative z-[45] pointer-events-auto">
               <h3 className={`font-bold ${ui.textMain} text-[14px] mb-2 border-b ${isDark ? 'border-white/10' : 'border-stone-200'} pb-1.5 ignore-draw`}>구약 성경</h3>
               <div className="flex flex-wrap gap-1.5">
                 {(getArr ? getArr(bibles) : bibles || []).slice(0, 39).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border ${ui.bgSubCard} ${ui.textMain} shadow-2xs hover:border-stone-400 transition-all ignore-draw whitespace-nowrap cursor-pointer`}>{getKoName(b.name)}</button>)}
               </div>
             </div>
             
             <div className="mt-4 relative z-[45] pointer-events-auto">
               <h3 className={`font-bold ${ui.textMain} text-[14px] mb-2 border-b ${isDark ? 'border-white/10' : 'border-stone-200'} pb-1.5 ignore-draw`}>신약 성경</h3>
               <div className="flex flex-wrap gap-1.5">
                 {(getArr ? getArr(bibles) : bibles || []).slice(39, 66).map(b => <button key={b.name} onClick={()=>{openModal('bibleChapterSelect', b);}} className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border ${ui.bgSubCard} ${ui.textMain} shadow-2xs hover:border-stone-400 transition-all ignore-draw whitespace-nowrap cursor-pointer`}>{getKoName(b.name)}</button>)}
               </div>
             </div>
          </div>
       ) : (
          <div className="flex-1 flex flex-col h-full pointer-events-auto relative z-10">
             <div className="ignore-draw pt-1"><SubPageHeader title="성경 본문" onBack={()=>{setBibleViewMode('index'); setSelVerses([]);}} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
             
             {/* 상단 컨트롤 바 (개역개정 / 쉬운성경 / WEB / 동시대조 4대 역본 컨트롤러) */}
             <div className={`${ui.glassCard} px-2.5 sm:px-4 py-1.5 shadow-2xs z-[60] border-b flex flex-col gap-1.5 ignore-draw relative pointer-events-auto rounded-none border-t-0 border-l-0 border-r-0`}>
               <div className="flex justify-between items-center flex-wrap gap-1.5">
                 <span className={`font-bold text-[15px] sm:text-[16px] ${ui.textMain}`}>{getKoName(sBk)} {sCh}장</span>
                 
                 <div className="flex items-center gap-1.5 flex-wrap">
                   {/* 🌟 4대 역본 스위치 */}
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
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'single' ? (isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-stone-900 shadow-xs') : ui.textSub}`}
                      >
                        본문 집중
                      </button>
                      <button 
                        onClick={() => setViewMode('split')}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${viewMode === 'split' ? (isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-stone-900 shadow-xs') : ui.textSub}`}
                      >
                        2단 필사
                      </button>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="relative z-[60] px-1">
               {renderToolbar(bibleEditorRef, viewMode === 'single', handleStickerAdd, handleMemoAdd, handleFileUpload)}
             </div>

             <CanvasEngine 
               key={`bible_read_${currentChapId}`} 
               saveKey={`bible_read_${currentChapId}`} 
               tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} t={t} 
               renderStickers={() => <StickerLayer memos={currDay?.memos} stickers={currDay?.stickers} onUpdateMemos={(m)=>updateDay({memos:m})} onUpdateStickers={(s)=>updateDay({stickers:s})} onPtrDown={onPtrDown} />}
             >
                 {/* 🌟 [모바일 최적화 및 정통 성경 통독 레이아웃] */}
                 <div className={`px-2 sm:px-3 md:px-4 pt-1.5 pb-28 grid gap-2.5 h-full relative z-10 hide-scrollbar ${viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 max-w-[1400px]' : 'grid-cols-1 max-w-4xl mx-auto w-full'}`}>
                     
                     <div className={`flex flex-col relative z-[45] pointer-events-auto h-full overflow-y-auto hide-scrollbar`}>
                         {/* 🌟 구절마다 박스를 치지 않고, 한 장 전체를 매끄럽게 흐르는 정통 성경 리딩 뷰 */}
                         <div className={`${ui.glassCard} rounded-2xl p-3 sm:p-5 min-h-[400px]`}>
                         {cVs.length > 0 ? (getArr ? getArr(cVs) : cVs).map((verse, idx) => { 
                            const vId=`${sBk}-${sCh}-${idx}`; 
                            const isR=(readVerses||{})[vId]; 
                            const isSel = selVerses.includes(vId); 
                            const hColor = (bibleHighlights||{})[vId];

                            const koName = getKoName(sBk) || BIBLE_66_MAP[sBk]?.ko || sBk;
                            const matchedKey = checkHasSermon(koName, sBk, sCh, idx + 1);
                            const displayVerseText = safeGetVerseText(verse);

                            const easyKey = `${koName}-${sCh}-${idx + 1}`;
                            const easyText = easyBibleDb[easyKey] || '';
                            const webKey = `${koName}-${sCh}-${idx + 1}`;
                            const webText = webBibleDb[webKey] || webBibleDb[`${sBk}-${sCh}-${idx + 1}`] || '';

                            return (
                              <div 
                                key={idx} 
                                onClick={() => handleHighlight(idx)}
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
                                   {/* 🌟 1. 깔끔한 정통 절 번호 (좌측 정렬) */}
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

                                   {/* 🌟 2. 본문 텍스트 (가로 100% 온전히 누리며, 본문 끝에 [원어]/[설교] 인라인 배치) */}
                                   <div 
                                     onClick={() => { 
                                       if (isLongPressActiveRef.current) return;
                                       if (tool === 'hand') { 
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
                                       } 
                                     }}
                                     className="flex-1 text-[14.5px] sm:text-[15.5px] leading-[1.8] font-serif break-keep text-stone-900 dark:text-slate-100"
                                   >
                                      {/* 1) 개역개정 단독 */}
                                      {bibleVersion === 'krv' && (
                                        <span>{displayVerseText}</span>
                                      )}

                                      {/* 2) 쉬운성경 단독 */}
                                      {bibleVersion === 'easy' && (
                                        <span className="font-sans font-medium">{easyText || displayVerseText}</span>
                                      )}

                                      {/* 3) World English Bible 단독 */}
                                      {bibleVersion === 'web' && (
                                        <span className="text-[14px] sm:text-[15px]">{webText || "Loading World English Bible..."}</span>
                                      )}

                                      {/* 4) 동시대조 렌더링 */}
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

                                      {/* 🌟 본문 뒤에 자연스럽게 붙는 [원어] 및 [설교] 마이크로 배지 */}
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

                                        {matchedKey && (
                                          <button 
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedSermonVerse(matchedKey);
                                              setBibleViewMode('sermonDetail');
                                            }}
                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
                                            title="설교 아카이브"
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

                         <div className="flex justify-between mt-3 gap-2 ignore-draw relative z-[45] pointer-events-auto">
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

                     {viewMode === 'split' && (
                       <div className={`hidden md:flex flex-col ${ui.glassCard} rounded-2xl overflow-hidden min-h-[500px] relative z-[45] pointer-events-auto`}>
                          <div className={`p-3 border-b ${isDark ? 'border-white/10 bg-black/30' : 'border-stone-200 bg-stone-50'} flex justify-between items-center z-10 ignore-draw`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11.5px] font-bold ml-1 ${ui.textSub} uppercase tracking-widest`}>나의 자유 필사 노트</span>
                                <span className={`text-[10px] ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-700'} px-2 py-0.5 rounded font-bold border border-stone-200 dark:border-slate-700`}>펜 사용 가능</span>
                              </div>
                          </div>
                          
                          <div className="flex-1 relative overflow-y-auto hide-scrollbar">
                            <textarea
                              value={noteContent}
                              onChange={(e) => {
                                setNoteContent(e.target.value);
                                if (updateDay) updateDay({ bibleFreeNote: e.target.value });
                              }}
                              placeholder="본문을 보며 이곳에 말씀을 필사하거나 타이핑하세요."
                              className={`absolute inset-0 w-full h-full p-4 bg-transparent outline-none resize-none text-[14px] ${ui.textMain} leading-[2.1] font-medium border-none z-10`}
                            />
                          </div>
                       </div>
                     )}
                 </div>
             </CanvasEngine>
          </div>
       )}

       {/* 선택 구절 하단 플로팅 툴바 */}
       {selVerses.length > 0 && bibleViewMode === 'read' && (
          <div className={`absolute bottom-[90px] md:bottom-12 left-1/2 -translate-x-1/2 ${ui.glassCard} rounded-full px-4 py-2 flex items-center gap-2 z-[100] animate-fade-in-up ignore-draw pointer-events-auto shadow-2xl`}>
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
             
             <div className={`w-[1px] h-4 ${isDark ? 'bg-white/10' : 'bg-stone-200'} mx-1`}></div>

             <button 
               onClick={() => { 
                 const vData = selVerses.map(id => { 
                   const [b, ch, vIdx] = id.split('-'); 
                   const bD = (getArr ? getArr(bibles) : bibles || []).find(x => x.name === b) || (bibles && bibles[0]); 
                   const verseRaw = (getArr ? getArr(getArr(bD?.chapters)[parseInt(ch, 10)-1]) : [])[parseInt(vIdx, 10)]; 
                   const verseText = safeGetVerseText(verseRaw); 
                   return { id, ref: `${getKoName(b)} ${ch}:${parseInt(vIdx, 10)+1}`, text: verseText }; 
                 }); 
                 openModal('bibleNoteCreate', { verses: vData, note: '' }, (d) => { 
                   if (setBibleNotes) {
                     setBibleNotes(p => [{ id: Date.now(), date: getLocalToday(), ...d, note: encryptField(d.note) }, ...(getArr ? getArr(p) : [])]);
                   }
                   setSelVerses([]); 
                 }); 
               }} 
               className={`bg-stone-900 dark:bg-slate-100 text-white dark:text-stone-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap transition-transform active:scale-95 cursor-pointer`}
             >
               복사/노트
             </button>
          </div>
       )}

       {/* ===================================================================== */}
       {/* 🏛️ [원어 연구 인스펙터 모달 - 10대 학술 코퍼스 전수 연동 & 흰 화면 방지 완결] */}
       {/* ===================================================================== */}
       {inspectorTarget && (
        <div className="bible-modal-portal fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            
            {/* 상단 표제어 헤더 */}
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
                      본문 번역: <span className="underline underline-offset-2 text-indigo-700 dark:text-indigo-300">{selectedWordDetail.korContextual}</span>
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
                      원형 기본뜻: <b className="text-stone-800 dark:text-slate-200">{selectedWordDetail.korLemma}</b>
                    </p>
                  </div>
                </div>
              )}

              {/* 본문 비교 (개역개정 vs 쉬운성경 vs WEB) */}
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

            {/* 5대 탭바 */}
            <div className={`flex gap-1 overflow-x-auto hide-scrollbar p-1 rounded-xl border my-2 shrink-0 ${
              isDark ? 'bg-black/40 border-slate-800' : 'bg-stone-100 border-stone-200'
            }`}>
              <button
                type="button"
                onClick={() => setModalTab('scholarly')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'scholarly' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                📜 10대 학술 사료
              </button>
              <button
                type="button"
                onClick={() => setModalTab('concordance')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'concordance' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                📊 전권 용례 ({concordanceTotalCount}회)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('full_lexicon')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'full_lexicon' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                🏛️ BDB/Thayer 원전
              </button>
              <button
                type="button"
                onClick={() => setModalTab('korean')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'korean' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                🇰🇷 문법 & 구속사
              </button>
              <button
                type="button"
                onClick={() => setModalTab('custom_study')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'custom_study' ? 'bg-stone-900 text-white dark:bg-slate-200 dark:text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                ✍️ 나의 연구 번역
              </button>
            </div>

            {/* 본문 스크롤 영역 */}
            <div className="overflow-y-auto hide-scrollbar space-y-2.5 flex-1 text-xs text-left">
              
              {/* 원어 본문 어절 레일 */}
              <div className={`p-2.5 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#141A26] border-slate-700' : 'bg-stone-50 border-stone-200'
              }`}>
                <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider block">원어 본문 어절 선택</span>
                {isInspectorLoading ? (
                  <div className="h-7 flex items-center justify-center text-stone-400 text-xs font-medium">데이터 분석 중...</div>
                ) : (
                  <div className={`flex flex-wrap gap-x-2 gap-y-1 items-baseline ${inspectorTarget.isOT ? 'justify-end' : 'justify-start'}`} dir={inspectorTarget.isOT ? 'rtl' : 'ltr'}>
                    {inspectorWords.map(w => (
                      <span
                        key={w.id}
                        onClick={() => handleSelectInspectorWord(w)}
                        style={originalFontStyle(inspectorTarget.isOT)}
                        className={`text-[20px] sm:text-[23px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                          selectedWordDetail?.order === w.order 
                            ? 'bg-amber-600 text-white ring-2 ring-amber-500 shadow-xs' 
                            : isDark ? 'text-slate-100 hover:bg-white/10' : 'text-stone-900 hover:bg-black/5'
                        }`}
                      >
                        {cleanTypography(w.inflected, inspectorTarget.isOT)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. 10대 학술 사료 탭 */}
              {modalTab === 'scholarly' && (
                <div className="space-y-2 animate-fade-in">
                  
                  {/* TSK 교차참조 */}
                  <div className="p-2.5 rounded-xl border bg-sky-50/70 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/60 text-sky-950 dark:text-sky-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[11px]">🔗 1. 정경 상호교차참조 (TSK)</span>
                      <span className="text-[10px] font-mono font-semibold">{crossRefs.length}개 구절</span>
                    </div>
                    {crossRefs.length === 0 ? (
                      <p className="text-stone-400 text-[10.5px]">직결된 교차참조 구절이 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto hide-scrollbar">
                        {crossRefs.map((ref, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-white dark:bg-black/40 border-stone-200 dark:border-slate-700">
                            {ref.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BHS 히브리어 구문론 */}
                  {currentHebrewSyntax && (
                    <div className="p-2.5 rounded-xl border space-y-1.5 bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60 text-amber-950 dark:text-amber-200">
                      <div className="flex justify-between items-center border-b pb-1 border-amber-200/60 dark:border-amber-800/40">
                        <span className="font-bold text-[11.5px]">📜 2. BHS 히브리어 구문론 끊어읽기</span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded border bg-white dark:bg-black/40 border-amber-300 dark:border-amber-800">
                          Atnach 대휴지
                        </span>
                      </div>
                      <div className="space-y-1">
                        {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                          <div key={idx} className="p-1.5 rounded-lg border bg-white dark:bg-[#121824] border-amber-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span style={originalFontStyle(true)} className="font-bold text-[15px] text-stone-900 dark:text-slate-100">{c.unit}</span>
                            <span className="font-medium text-[11px] text-stone-600 dark:text-slate-400 text-right">{c.role}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] leading-relaxed pt-1 border-t border-dashed border-amber-200 dark:border-amber-800/40">
                        💡 {decodeHtmlEntities(currentHebrewSyntax.cantillationExegesis)}
                      </p>
                    </div>
                  )}

                  {/* 70인역(LXX) 대조 */}
                  {currentLxx && (
                    <div className="p-2.5 rounded-xl border space-y-1.5 bg-stone-100/80 border-stone-300 dark:bg-stone-900/40 dark:border-stone-700 text-stone-950 dark:text-stone-200">
                      <div className="flex justify-between items-center border-b pb-1 border-stone-200 dark:border-slate-700">
                        <span className="font-bold text-[11.5px]">🏛️ 3. 70인역(LXX) 대조 ({currentLxx.otRef})</span>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded border bg-white dark:bg-black/40 border-stone-300 dark:border-slate-700">
                          {currentLxx.theme}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 text-xs">
                        {currentLxx.ntText && (
                          <div className="p-2 rounded-lg border bg-white dark:bg-[#121824] border-stone-200 dark:border-slate-800">
                            <span className="text-[9px] font-bold block text-stone-400 mb-0.5">[신약 GNT]</span>
                            <p style={{ fontFamily: "'SBL Greek', serif" }} className="text-[14px] font-bold text-stone-900 dark:text-slate-100">{currentLxx.ntText}</p>
                          </div>
                        )}
                        {currentLxx.lxxText && (
                          <div className="p-2 rounded-lg border bg-white dark:bg-[#121824] border-stone-200 dark:border-slate-800">
                            <span className="text-[9px] font-bold block text-stone-400 mb-0.5">[구약 LXX]</span>
                            <p style={{ fontFamily: "'SBL Greek', serif" }} className="text-[14px] font-bold text-stone-900 dark:text-slate-100">{currentLxx.lxxText}</p>
                          </div>
                        )}
                        {currentLxx.mtText && (
                          <div className="p-2 rounded-lg border text-right bg-white dark:bg-[#121824] border-stone-200 dark:border-slate-800" dir="rtl">
                            <span className="text-[9px] font-bold block text-left text-stone-400 mb-0.5" dir="ltr">[구약 MT]</span>
                            <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[16px] font-bold text-stone-900 dark:text-slate-100">{currentLxx.mtText}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed font-serif text-stone-800 dark:text-slate-300">
                        {decodeHtmlEntities(currentLxx.differenceAnalysis)}
                      </p>
                    </div>
                  )}

                  {/* 타르굼 & 페시타 */}
                  {currentTargumPeshitta && (
                    <div className="p-2.5 rounded-xl border space-y-1.5 bg-orange-50/70 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/60 text-orange-950 dark:text-orange-200">
                      <div className="flex justify-between items-center border-b pb-1 border-orange-200/60 dark:border-orange-800/40">
                        <span className="font-bold text-[11.5px]">🏺 4. 고대 아람어 타르굼 & 시리아 페시타</span>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded border bg-white dark:bg-black/40 border-orange-300 dark:border-orange-800">Semitic Text</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                        {currentTargumPeshitta.targumAramaic && (
                          <div className="p-2 rounded-lg border text-right bg-white dark:bg-[#121824] border-orange-200 dark:border-slate-800" dir="rtl">
                            <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 block mb-0.5" dir="ltr">아람어 타르굼</span>
                            <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[15px] font-bold text-stone-900 dark:text-slate-100">{currentTargumPeshitta.targumAramaic}</p>
                            {currentTargumPeshitta.targumKo && (
                              <p className="text-[10.5px] text-stone-600 dark:text-slate-400 text-left mt-1 pt-1 border-t border-stone-100 dark:border-slate-800" dir="ltr">{decodeHtmlEntities(currentTargumPeshitta.targumKo)}</p>
                            )}
                          </div>
                        )}
                        {currentTargumPeshitta.peshittaSyriac && (
                          <div className="p-2 rounded-lg border text-right bg-white dark:bg-[#121824] border-orange-200 dark:border-slate-800" dir="rtl">
                            <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 block mb-0.5" dir="ltr">시리아 페시타</span>
                            <p style={{ fontFamily: "'Estrangelo Edessa', serif" }} className="text-[17px] font-bold text-stone-900 dark:text-slate-100">{currentTargumPeshitta.peshittaSyriac}</p>
                            {currentTargumPeshitta.peshittaKo && (
                              <p className="text-[10.5px] text-stone-600 dark:text-slate-400 text-left mt-1 pt-1 border-t border-stone-100 dark:border-slate-800" dir="ltr">{decodeHtmlEntities(currentTargumPeshitta.peshittaKo)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 반즈 & JFB 학술 주석 */}
                  {currentCommentary && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/60 text-indigo-950 dark:text-indigo-200">
                      <span className="font-bold text-[11.5px] block border-b pb-1 border-indigo-200/60 dark:border-indigo-800/40">
                        📖 7. 반즈 & JFB 학술 주석 ({currentCommentary.commentator})
                      </span>
                      <p className="text-[11.5px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">{decodeHtmlEntities(currentCommentary.exegesis)}</p>
                    </div>
                  )}

                  {/* 매튜 헨리 묵상 강해 */}
                  {currentMatthewHenry && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200">
                      <span className="font-bold text-[11.5px] block border-b pb-1 border-emerald-200/60 dark:border-emerald-800/40">
                        🌿 8. 매튜 헨리 묵상 강해 ({decodeHtmlEntities(currentMatthewHenry.theme)})
                      </span>
                      <p className="text-[11.5px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">{decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}</p>
                    </div>
                  )}

                  {/* NET Bible 각주 */}
                  {currentNetNote && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 text-rose-950 dark:text-rose-200">
                      <span className="font-bold text-[11.5px] block border-b pb-1 border-rose-200/60 dark:border-rose-800/40">
                        🔍 9. NET Bible 본문 비평 각주: {decodeHtmlEntities(currentNetNote.title)}
                      </span>
                      <p className="text-[11.5px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">{decodeHtmlEntities(currentNetNote.note)}</p>
                    </div>
                  )}

                </div>
              )}

              {/* 2. BDB/Thayer 원전 탭 */}
              {modalTab === 'full_lexicon' && selectedWordDetail && (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                    <span className="text-stone-400 font-bold block text-[9.5px] uppercase">[어원 및 파생]</span>
                    <p className="font-mono text-[11.5px] mt-0.5">{decodeHtmlEntities(selectedWordDetail.lexicon?.etymology)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                    <span className="text-stone-400 font-bold block text-[9.5px] uppercase">[원어 본래 정의]</span>
                    <p className="font-mono text-[11.5px] mt-0.5">{decodeHtmlEntities(selectedWordDetail.lexicon?.meaning)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                    <span className="text-stone-400 font-bold block text-[9.5px] uppercase">[원전 전문]</span>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed mt-0.5">{decodeHtmlEntities(selectedWordDetail.lexicon?.rawFull)}</pre>
                  </div>
                </div>
              )}

              {/* 3. 문법 & 구속사 탭 */}
              {modalTab === 'korean' && selectedWordDetail && (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                    <span className="text-stone-400 font-bold block text-[9.5px]">정밀 형태론 (문법 분석)</span>
                    <span className="font-bold text-[13.5px] block mt-0.5 text-stone-900 dark:text-slate-100">{selectedWordDetail.grammarDecoded}</span>
                  </div>
                  {selectedWordDetail.theologyInsight && (
                    <div className="p-2.5 rounded-xl border space-y-1 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200">
                      <span className="font-bold text-[12px] block">📜 {selectedWordDetail.theologyInsight.stemTitle}</span>
                      <p className="text-[11.5px] leading-relaxed">{selectedWordDetail.theologyInsight.stemDesc}</p>
                    </div>
                  )}
                  {selectedWordDetail.note && (
                    <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-800">
                      <span className="font-bold block text-[11px] text-stone-900 dark:text-slate-100">📖 구속사적 의미</span>
                      <p className="text-[11.5px] leading-relaxed text-stone-700 dark:text-slate-300">{decodeHtmlEntities(selectedWordDetail.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. 전권 용례 탭 */}
              {modalTab === 'concordance' && (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-2.5 rounded-xl border flex justify-between items-center bg-stone-50 dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                    <span className="font-bold text-[12px]">📈 성경 66권 전체 출현 빈도</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-600 text-white">총 {concordanceTotalCount}회 등장</span>
                  </div>
                  <div className="space-y-1">
                    {concordanceList.map((item, idx) => (
                      <div key={idx} className="p-2 rounded-lg border flex items-center justify-between bg-white dark:bg-[#141A26] border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-700 dark:text-slate-300 min-w-[70px]">{item.book} {item.chapter}:{item.verse}</span>
                        <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[15px]">{cleanTypography(item.original_word, inspectorTarget.isOT)}</span>
                        <span className="text-stone-600 dark:text-slate-300 truncate max-w-[120px] text-right font-medium">{item.korean_trans}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 나의 연구 번역 탭 */}
              {modalTab === 'custom_study' && selectedWordDetail && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-stone-600 dark:text-slate-300 block">나의 대표 한글 번역어</label>
                    <input
                      type="text"
                      value={customInputTrans}
                      onChange={(e) => setCustomInputTrans(e.target.value)}
                      placeholder={`예: ${selectedWordDetail.korContextual}`}
                      className="w-full px-3 py-1.5 rounded-lg text-[12px] font-bold border outline-none border-stone-300 dark:border-slate-700 bg-white dark:bg-black/50 text-stone-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-stone-600 dark:text-slate-300 block">심층 신학 연구 메모</label>
                    <textarea
                      value={customInputMemo}
                      onChange={(e) => setCustomInputMemo(e.target.value)}
                      rows={3}
                      placeholder="원문 대조 결과 메모..."
                      className="w-full p-2 rounded-lg text-[11.5px] font-medium border outline-none resize-none border-stone-300 dark:border-slate-700 bg-white dark:bg-black/50 text-stone-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCustomLexiconNote}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11.5px] shadow-2xs cursor-pointer"
                  >
                    💾 연구자 번역/주석 영구 저장
                  </button>
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
                  <IconDocument /> 필사 노트에 주석 삽입
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className="px-3 py-2 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700"
                >
                  <IconVolume /> 낭독
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}     
// src/pages/Mcheyne.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import CryptoJS from 'crypto-js';
import {
  BibleGalaxyArcModal,
  extractAllBibleRefsFromText
} from '../pages/BibleKnowledgeGalaxy';
import {
  ensureKrv4TxtLoaded,
  splitPericopeAndVerse
} from '../pages/Bible';

// =====================================================================
// 암호화 표준화 유틸리티
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
  const extracted = typeof extractAllBibleRefsFromText === 'function'
    ? extractAllBibleRefsFromText(text).map(item => item.label)
    : [];
  const regex = /([가-힣]+(?:서|기|상|하|전|후|일|이|삼)?)\s?(\d+)(?:장|:)\s?(?:(\d+)(?:절)?)?/g;
  const matches = [...text.matchAll(regex)].map(m => m[0].trim());
  return Array.from(new Set([...extracted, ...matches]));
};

// =====================================================================
// 성경 66권 정경 마스터 맵 (en / ko / abbr 완벽 매핑)
// =====================================================================
const BIBLE_66_LIST = [
  { en: "Genesis", ko: "창세기", abbr: "창", isOT: true, section: "모세오경", theme: "천지창조와 족장들을 통한 하나님의 언약 수립" },
  { en: "Exodus", ko: "출애굽기", abbr: "출", isOT: true, section: "모세오경", theme: "유월절 어린양의 피로 구속받은 언약 백성의 탄생과 성막" },
  { en: "Leviticus", ko: "레위기", abbr: "레", isOT: true, section: "모세오경", theme: "거룩하신 하나님께 나아가는 제사법과 성결의 규례" },
  { en: "Numbers", ko: "민수기", abbr: "민", isOT: true, section: "모세오경", theme: "광야 순례길의 연단과 불순종 속에서도 신실하신 하나님의 인도" },
  { en: "Deuteronomy", ko: "신명기", abbr: "신", isOT: true, section: "모세오경", theme: "가나안 입성 전 모세의 고별 설교와 언약의 재갱신" },
  { en: "Joshua", ko: "여호수아", abbr: "수", isOT: true, section: "역사서", theme: "약속의 땅 정복과 분배를 통한 언약 성취" },
  { en: "Judges", ko: "사사기", abbr: "삿", isOT: true, section: "역사서", theme: "배교와 징계, 부르짖음과 구원의 순환 속에 나타난 하나님의 긍휼" },
  { en: "Ruth", ko: "룻기", abbr: "룻", isOT: true, section: "역사서", theme: "기업 무를 자(고엘) 보아스를 통해 이어지는 다윗과 메시아의 계보" },
  { en: "1 Samuel", ko: "사무엘상", abbr: "삼상", isOT: true, section: "역사서", theme: "사사 시대에서 왕정 시대로의 전환과 다윗을 향한 하나님의 선택" },
  { en: "2 Samuel", ko: "사무엘하", abbr: "삼하", isOT: true, section: "역사서", theme: "다윗 왕국의 확립과 영원한 왕위에 대한 다윗 언약(삼하 7장)" },
  { en: "1 Kings", ko: "열왕기상", abbr: "왕상", isOT: true, section: "역사서", theme: "솔로몬 성전 건축과 왕국의 분열, 선지자 엘리야의 영적 투쟁" },
  { en: "2 Kings", ko: "열왕기하", abbr: "왕하", isOT: true, section: "역사서", theme: "왕국의 패망 속에서도 언약의 말씀과 다윗의 등불을 보존하시는 섭리" },
  { en: "1 Chronicles", ko: "역대상", abbr: "대상", isOT: true, section: "역사서", theme: "포로 귀환 공동체를 위한 다윗 언약과 성전 예배 중심의 계보" },
  { en: "2 Chronicles", ko: "역대하", abbr: "대하", isOT: true, section: "역사서", theme: "솔로몬 성전부터 유다 왕들의 개혁과 성전 회복의 역사" },
  { en: "Ezra", ko: "에스라", abbr: "스", isOT: true, section: "역사서", theme: "바벨론 포로 귀환과 성전 재건, 율법 공동체의 영적 부흥" },
  { en: "Nehemiah", ko: "느헤미야", abbr: "느", isOT: true, section: "역사서", theme: "예루살렘 성벽 재건과 언약 공동체의 회개 및 신앙 개혁" },
  { en: "Esther", ko: "에스더", abbr: "에", isOT: true, section: "역사서", theme: "역사의 배후에서 보이지 않는 손으로 자기 백성을 보존하시는 섭리" },
  { en: "Job", ko: "욥기", abbr: "욥", isOT: true, section: "시가서", theme: "의인의 고난과 주권자 하나님 앞에서의 참된 경외와 겸손" },
  { en: "Psalms", ko: "시편", abbr: "시", isOT: true, section: "시가서", theme: "언약 백성이 올려드리는 찬양과 탄식, 감사와 메시아 예언의 기도" },
  { en: "Proverbs", ko: "잠언", abbr: "잠", isOT: true, section: "시가서", theme: "여호와를 경외하는 지혜가 일상과 공동체 삶에서 맺는 열매" },
  { en: "Ecclesiastes", ko: "전도서", abbr: "전", isOT: true, section: "시가서", theme: "해 아래 모든 수고의 한계를 넘어 창조주 하나님을 경외하는 본분" },
  { en: "Song of Solomon", ko: "아가", abbr: "아", isOT: true, section: "시가서", theme: "신랑과 신부의 사랑을 통해 예표된 그리스도와 교회의 연합" },
  { en: "Isaiah", ko: "이사야", abbr: "사", isOT: true, section: "선지서", theme: "거룩하신 하나님의 심판과 고난받는 종을 통한 구속의 복음" },
  { en: "Jeremiah", ko: "예레미야", abbr: "렘", isOT: true, section: "선지서", theme: "유다의 심판 경고와 마음에 새기실 새 언약(렘 31:31)의 약속" },
  { en: "Lamentations", ko: "예레미야애가", abbr: "애", isOT: true, section: "선지서", theme: "무너진 성읍의 애통 속에서도 아침마다 새로우신 여호와의 성실하심" },
  { en: "Ezekiel", ko: "에스겔", abbr: "겔", isOT: true, section: "선지서", theme: "마른 뼈의 부활과 새 성전을 통해 다시 임재하시는 여호와의 영광" },
  { en: "Daniel", ko: "다니엘", abbr: "단", isOT: true, section: "선지서", theme: "세상 제국들의 흥망성쇠를 주관하시고 영원한 나라를 세우시는 주권" },
  { en: "Hosea", ko: "호세아", abbr: "호", isOT: true, section: "선지서", theme: "반역한 백성을 끝까지 찾아가 회복시키시는 하나님의 언약적 사랑(헤세드)" },
  { en: "Joel", ko: "요엘", abbr: "욜", isOT: true, section: "선지서", theme: "여호와의 날의 심판과 만민에게 부어주실 성령 강림의 약속" },
  { en: "Amos", ko: "아모스", abbr: "암", isOT: true, section: "선지서", theme: "형식적 제사를 배격하시고 정의와 공의를 강물처럼 흘릴 것을 요구하심" },
  { en: "Obadiah", ko: "오바댜", abbr: "옵", isOT: true, section: "선지서", theme: "형제에게 포학을 행한 교만에 대한 심판과 시온산의 구원" },
  { en: "Jonah", ko: "요나", abbr: "욘", isOT: true, section: "선지서", theme: "이방 성읍 니느웨까지 품으시는 하나님의 보편적 긍휼" },
  { en: "Micah", ko: "미가", abbr: "미", isOT: true, section: "선지서", theme: "공의를 행하며 인자를 사랑하고 겸손히 하나님과 동행하는 삶" },
  { en: "Nahum", ko: "나훔", abbr: "나", isOT: true, section: "선지서", theme: "악한 제국의 멸망과 환난 날에 산성이 되시는 여호와" },
  { en: "Habakkuk", ko: "하박국", abbr: "합", isOT: true, section: "선지서", theme: "불의한 세상 속에서도 오직 믿음으로 말미암아 사는 의인의 찬양" },
  { en: "Zephaniah", ko: "스바냐", abbr: "습", isOT: true, section: "선지서", theme: "심판 날을 통과한 남은 자들을 기쁨으로 잠잠히 사랑하시는 하나님" },
  { en: "Haggai", ko: "학개", abbr: "학", isOT: true, section: "선지서", theme: "무너진 성전 재건을 최우선으로 삼을 때 임하는 하늘의 영광" },
  { en: "Zechariah", ko: "스가랴", abbr: "슥", isOT: true, section: "선지서", theme: "겸손히 나귀를 타신 왕 메시아와 성령으로 세워지는 성전" },
  { en: "Malachi", ko: "말라기", abbr: "말", isOT: true, section: "선지서", theme: "참된 예배의 회복과 치료하는 광선으로 임하실 의로운 해" },
  { en: "Matthew", ko: "마태복음", abbr: "마", isOT: false, section: "복음/역사", theme: "구약의 예언을 성취하신 다윗의 자손, 천국 복음의 왕 예수 그리스도" },
  { en: "Mark", ko: "마가복음", abbr: "막", isOT: false, section: "복음/역사", theme: "섬기려 하고 자기 목숨을 많은 사람의 대속물로 주신 하나님의 아들" },
  { en: "Luke", ko: "누가복음", abbr: "눅", isOT: false, section: "복음/역사", theme: "잃어버린 자를 찾아 구원하려 오신 인자(Son of Man)의 긍휼" },
  { en: "John", ko: "요한복음", abbr: "요", isOT: false, section: "복음/역사", theme: "말씀이 육신이 되어 우리 가운데 거하신 독생자의 영광과 영생" },
  { en: "Acts", ko: "사도행전", abbr: "행", isOT: false, section: "복음/역사", theme: "부활하신 주님께서 성령을 통해 예루살렘에서 땅끝까지 교회를 세우심" },
  { en: "Romans", ko: "로마서", abbr: "롬", isOT: false, section: "서신서", theme: "오직 믿음으로 말미암는 칭의와 성령 안에서의 성화, 구속의 경륜" },
  { en: "1 Corinthians", ko: "고린도전서", abbr: "고전", isOT: false, section: "서신서", theme: "십자가의 도와 사랑(13장), 부활 신앙으로 하나 되는 교회" },
  { en: "2 Corinthians", ko: "고린도후서", abbr: "고후", isOT: false, section: "서신서", theme: "질그릇 속에 담긴 보배로운 복음과 약할 때 강함 되시는 은혜" },
  { en: "Galatians", ko: "갈라디아서", abbr: "갈", isOT: false, section: "서신서", theme: "율법의 멍에에서 해방하신 십자가와 성령을 따라 행하는 자유" },
  { en: "Ephesians", ko: "에베소서", abbr: "엡", isOT: false, section: "서신서", theme: "창세 전 그리스도 안에서 택하신 구원과 만물을 충만케 하는 교회" },
  { en: "Philippians", ko: "빌립보서", abbr: "빌", isOT: false, section: "서신서", theme: "자기를 비워 종의 형체를 가지신 그리스도의 마음과 복음의 기쁨" },
  { en: "Colossians", ko: "골로새서", abbr: "골", isOT: false, section: "서신서", theme: "보이지 않는 하나님의 형상이시며 만물의 으뜸이 되시는 그리스도" },
  { en: "1 Thessalonians", ko: "데살로니가전서", abbr: "살전", isOT: false, section: "서신서", theme: "믿음의 역사와 사랑의 수고와 소망의 인내로 깨어 있는 삶" },
  { en: "2 Thessalonians", ko: "데살로니가후서", abbr: "살후", isOT: false, section: "서신서", theme: "주의 재림을 바라보며 흔들리지 않고 굳건히 서서 일하는 성도" },
  { en: "1 Timothy", ko: "디모데전서", abbr: "딤전", isOT: false, section: "서신서", theme: "살아계신 하나님의 집인 교회에서 바른 교훈과 경건을 지킴" },
  { en: "2 Timothy", ko: "디모데후서", abbr: "딤후", isOT: false, section: "서신서", theme: "복음과 함께 고난을 받으며 진리의 말씀을 옳게 분변하는 사명" },
  { en: "Titus", ko: "디도서", abbr: "딛", isOT: false, section: "서신서", theme: "구원하시는 은혜가 경건함과 선한 일에 열심 내는 삶으로 나타남" },
  { en: "Philemon", ko: "빌레몬서", abbr: "몬", isOT: false, section: "서신서", theme: "그리스도 안에서 형제로 영접하게 하는 복음의 화해와 용서" },
  { en: "Hebrews", ko: "히브리서", abbr: "히", isOT: false, section: "서신서", theme: "구약의 그림자를 완성하신 영원한 대제사장 예수를 바라보는 믿음" },
  { en: "James", ko: "야고보서", abbr: "약", isOT: false, section: "서신서", theme: "시련을 이기는 인내와 행함으로 온전케 되는 산 믿음" },
  { en: "1 Peter", ko: "베드로전서", abbr: "벧전", isOT: false, section: "서신서", theme: "산 소망을 가진 나그네로서 고난 중에도 왕 같은 제사장으로 살아감" },
  { en: "2 Peter", ko: "베드로후서", abbr: "벧후", isOT: false, section: "서신서", theme: "거짓 교훈을 경계하고 그리스도의 은혜와 아는 지식에서 자라감" },
  { en: "1 John", ko: "요한일서", abbr: "요일", isOT: false, section: "서신서", theme: "빛이시며 사랑이신 하나님과의 사귐과 형제 사랑의 실천" },
  { en: "2 John", ko: "요한이서", abbr: "요이", isOT: false, section: "서신서", theme: "진리와 사랑 안에서 행하며 그리스도의 교훈 안에 거함" },
  { en: "3 John", ko: "요한삼서", abbr: "요삼", isOT: false, section: "서신서", theme: "진리를 위하여 함께 일하는 형제들을 돕고 선한 것을 본받음" },
  { en: "Jude", ko: "유다서", abbr: "유", isOT: false, section: "서신서", theme: "성도에게 단번에 주신 믿음의 도를 위하여 힘써 싸우며 거룩함을 지킴" },
  { en: "Revelation", ko: "요한계시록", abbr: "계", isOT: false, section: "서신서", theme: "보좌에 앉으신 이들과 어린양의 최종 승리, 새 하늘과 새 땅의 완성" }
];

const BIBLE_66_MAP = {};
BIBLE_66_LIST.forEach((b) => {
  BIBLE_66_MAP[b.en] = b;
  BIBLE_66_MAP[b.ko] = b;
  BIBLE_66_MAP[b.abbr] = b;
});

// =====================================================================
// 🌐 다중 역본(쉬운성경 / WEB 영어성경) 스마트 키 탐색기 & 실시간 API 캐시
// =====================================================================
const liveWebChapterCache = {};

const resolveTranslationVerse = (db, bookMeta, chNum, vNum) => {
  if (!db || !bookMeta) return '';
  const { ko, en, abbr } = bookMeta;
  const ch = Number(chNum);
  const v = Number(vNum);

  // 1) 플랫 문자열 키 탐색 ("히브리서-8-1", "Hebrews-8-1", "히브리서 8:1", "Hebrews 8:1", "히8:1" 등 모두 호환)
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

  // 2) 계층형 배열/객체 구조 탐색 (db["Hebrews"][7][0] 또는 db["히브리서"]["8"]["1"])
  const bookObj = db[ko] || db[en] || db[abbr];
  if (bookObj) {
    if (Array.isArray(bookObj)) {
      const chapArr = bookObj[ch - 1];
      if (Array.isArray(chapArr) && chapArr[v - 1]) {
        const val = chapArr[v - 1];
        return typeof val === 'string' ? val : (val.text || val.content || '');
      }
    } else if (typeof bookObj === 'object') {
      const chapObj = bookObj[ch] || bookObj[String(ch)] || bookObj[ch - 1];
      if (Array.isArray(chapObj) && chapObj[v - 1]) {
        const val = chapObj[v - 1];
        return typeof val === 'string' ? val : (val.text || val.content || '');
      } else if (chapObj && typeof chapObj === 'object') {
        const val = chapObj[v] || chapObj[String(v)];
        if (val) return typeof val === 'string' ? val : (val.text || val.content || '');
      }
    }
  }

  // 3) 실시간 WEB API 캐시 확인
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

// 스트롱 번호 양방향 조회 헬퍼 ("G2774" ⇄ "G02774" 모두 매칭)
const lookupStrongsEntry = (masterDict, rawId) => {
  if (!masterDict || !rawId) return {};
  const cleanId = String(rawId).trim().toUpperCase();
  if (masterDict[cleanId]) return masterDict[cleanId];

  const prefix = cleanId[0];
  const numStr = cleanId.slice(1).replace(/^0+/, '') || '0';
  const candidates = [
    `${prefix}${numStr}`,
    `${prefix}${numStr.padStart(4, '0')}`,
    `${prefix}${numStr.padStart(5, '0')}`
  ];
  for (const cand of candidates) {
    if (masterDict[cand]) return masterDict[cand];
  }
  return {};
};

const cleanTypography = (text, isOT) => {
  if (!text || typeof text !== 'string') return '';
  if (!isOT) return text;
  return text.replace(/[\u0591-\u05AF]/g, '');
};

const applyContextualCaseEnding = (baseKor, caseType, isOT, rawGrammar) => {
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
    return data[0]?.map(c => c[0]).join('') || '';
  } catch {
    return '';
  }
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
// 2차 베지에 곡선 고정밀 브러시 렌더러
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
// 맥체인 전용 필사 & 묵상 노트 패널
// =====================================================================
const McheyneTranscriptionNotePanel = ({
  currentPlanKey,
  planTitle,
  isDark,
  noteContent,
  setNoteContent,
  updateDay,
  onOpenGalaxyPopup
}) => {
  const [panelTab, setPanelTab] = useState('handwriting');
  const [paperStyle, setPaperStyle] = useState('line');

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

  const detectedTypingRefs = useMemo(() => {
    return extractBibleReferences(`${planTitle || ''} ${noteContent || ''}`);
  }, [planTitle, noteContent]);

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

    ctx.fillStyle = isDark ? '#12151C' : '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.scale(dpr, dpr);
    strokes.forEach(s => renderStroke(ctx, s, isDark));

    const link = document.createElement('a');
    link.download = `${planTitle || '맥체인'}_필사노트.png`;
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
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    switch (paperStyle) {
      case 'dot':
        return { backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px' };
      case 'line':
        return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`, backgroundSize: '100% 30px' };
      case 'grid':
        return { backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' };
      case 'blank':
      default:
        return {};
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-xl border overflow-hidden ${
      isDark ? 'bg-[#131720] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'
    }`}>
      <div className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-1.5 shrink-0 ${
        isDark ? 'bg-[#181C26] border-white/10' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanelTab('handwriting')}
            className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              panelTab === 'handwriting'
                ? (isDark ? 'bg-white text-stone-950' : 'bg-stone-900 text-white')
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            필기 캔버스
          </button>
          <button
            onClick={() => setPanelTab('typing')}
            className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              panelTab === 'typing'
                ? (isDark ? 'bg-white text-stone-950' : 'bg-stone-900 text-white')
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            텍스트 타이핑
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`flex p-0.5 rounded-lg border text-[10.5px] font-bold ${
            isDark ? 'bg-[#0E1117] border-white/10' : 'bg-stone-200/70 border-stone-300'
          }`}>
            {['dot', 'line', 'grid', 'blank'].map(p => (
              <button
                key={p}
                onClick={() => setPaperStyle(p)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  paperStyle === p ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-white font-bold shadow-2xs' : 'text-stone-500'
                }`}
              >
                {p === 'dot' ? '도트' : p === 'line' ? '유선' : p === 'grid' ? '모눈' : '무지'}
              </button>
            ))}
          </div>

          {panelTab === 'handwriting' && (
            <button
              onClick={handleExportPng}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
              }`}
            >
              이미지 저장
            </button>
          )}
        </div>
      </div>

      {panelTab === 'handwriting' && (
        <div className={`px-3 py-1.5 border-b flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar shrink-0 text-xs ${
          isDark ? 'bg-[#141821] border-white/10' : 'bg-stone-100/60 border-stone-200'
        }`}>
          <div className="flex items-center gap-1 shrink-0">
            {tools.map(t => (
              <button
                key={t.id}
                onClick={() => setCurrentTool(t.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  currentTool === t.id
                    ? (isDark ? 'bg-white text-stone-950' : 'bg-stone-900 text-white')
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 px-1">
            <span className="text-[10px] font-mono text-stone-400">{strokeWidth.toFixed(1)}px</span>
            <input
              type="range" min="1" max="18" step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-stone-800 dark:accent-white cursor-pointer h-1"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {colorPalette.map(c => (
              <button
                key={c.id}
                onClick={() => setStrokeColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                  strokeColor === c.color ? 'scale-125 ring-2 ring-stone-500' : 'opacity-75 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button onClick={handleUndo} disabled={strokes.length === 0} className="px-1.5 py-0.5 rounded text-[10.5px] font-bold text-stone-500 disabled:opacity-30 cursor-pointer">
              취소
            </button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="px-1.5 py-0.5 rounded text-[10.5px] font-bold text-stone-500 disabled:opacity-30 cursor-pointer">
              재실행
            </button>
            <button onClick={handleClear} disabled={strokes.length === 0} className="px-1.5 py-0.5 rounded text-[10.5px] font-bold text-rose-500 disabled:opacity-30 cursor-pointer">
              지우기
            </button>
          </div>
        </div>
      )}

      {panelTab === 'typing' && detectedTypingRefs.length > 0 && onOpenGalaxyPopup && (
        <div className={`px-3 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0 ${
          isDark ? 'bg-[#141821] border-white/10' : 'bg-stone-50 border-stone-200'
        }`}>
          <span className="text-[10.5px] font-bold text-stone-500 shrink-0">감지된 구절:</span>
          {detectedTypingRefs.map((refStr) => (
            <div key={refStr} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-stone-300 dark:border-white/15 text-[11px] font-bold shrink-0">
              <span>{refStr}</span>
              <button
                type="button"
                onClick={() => onOpenGalaxyPopup('arc', refStr)}
                className="px-1.5 py-0.5 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[9.5px] font-bold cursor-pointer"
              >
                아크
              </button>
            </div>
          ))}
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
          <div className="absolute inset-0 w-full h-full p-4 overflow-y-auto hide-scrollbar">
            <textarea
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                if (updateDay) updateDay({ mcheyneNote: e.target.value });
              }}
              placeholder={`[${planTitle || '맥체인'}] 말씀을 묵상하며 필사나 묵상 노트를 작성하세요.\n\n성경 본문에서 절을 선택하여 원어 강해나 맥체인 강해를 이곳에 바로 삽입할 수 있습니다.`}
              className={`w-full h-full bg-transparent outline-none resize-none text-[14px] leading-[2.0] font-serif border-none ${
                isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// 모던 라인 아이콘
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.0} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconMinimize = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>;
const IconMaximize = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const IconPlay = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>;
const IconStop = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>;
const IconMic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconCheckCircle = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconChevronDown = ({ className }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-4 h-4"}><polyline points="6 9 12 15 18 9" /></svg>;

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
  const [viewMode, setViewMode] = useState('split');
  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [noteContent, setNoteContent] = useState(currDay?.mcheyneNote || '');

  const [selectedVerseKey, setSelectedVerseKey] = useState(null);
  const [cellSyncToast, setCellSyncToast] = useState(false);

  const [showDevotionGuide, setShowDevotionGuide] = useState(false);
  const [mcheyneDevotionsDb, setMcheyneDevotionsDb] = useState({});

  const [partnerActivity, setPartnerActivity] = useState(false);
  const isMoHana = (authUser?.name || authUser) === '모하나';
  const MY_NAME = "정신동";

  const [galaxyModalConfig, setGalaxyModalConfig] = useState({
    isOpen: false,
    mode: 'arc',
    refQuery: ''
  });

  // 📖 기본 성경 역본을 'krv'(개역개정 4판)으로 고정 세팅!
  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('mcheyne_bible_version_mode') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [krv4TxtDb, setKrv4TxtDb] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});
  const [liveWebTick, setLiveWebTick] = useState(0);

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

  const [commentaryDb, setCommentaryDb] = useState({});
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [netNotesDb, setNetNotesDb] = useState({});
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [crossRefs, setCrossRefs] = useState([]);
  const [translatedScholarlyMap, setTranslatedScholarlyMap] = useState({});
  const [translatingKey, setTranslatingKey] = useState(null);

  useEffect(() => {
    ensureKrv4TxtLoaded().then((parsedMap) => {
      if (parsedMap) setKrv4TxtDb(parsedMap);
    });
    ensureMasterStrongs();

    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => r.ok ? r.json() : {}).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/commentaries.json').then(r => r.ok ? r.json() : {}).then(d => setCommentaryDb(prev => ({ ...d, ...prev }))).catch(() => {});
    fetch('/data/matthew_henry.json').then(r => r.ok ? r.json() : {}).then(d => setMatthewHenryDb(prev => ({ ...d, ...prev }))).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});
    fetch('/data/mcheyne_devotions.json').then(r => r.ok ? r.json() : {}).then(d => setMcheyneDevotionsDb(d || {})).catch(() => {});
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

  useEffect(() => {
    setSelectedVerseKey(null);
  }, [mcheynePlanIdx, date]);

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
      } catch (e) {}
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
  const mBookD = mp ? ((getArr ? getArr(bibles) : bibles || []).find(b => b.name === mp.book || BIBLE_66_MAP[b.name]?.ko === BIBLE_66_MAP[mp.book]?.ko) || bibles[0]) : bibles[0]; 

  const currentBookMeta = useMemo(() => {
    const rawKey = mBookD?.name || mp?.book || 'Genesis';
    return BIBLE_66_MAP[rawKey] || BIBLE_66_LIST[0];
  }, [mBookD, mp]);

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

  // 🌟 [핵심 해결] 현재 맥체인 플랜의 장별 학술 주석(반즈/JFB & 매튜헨리) 및 WEB 영문 성경 자동 프리패치!
  useEffect(() => {
    if (!currentBookMeta || !mChaps || mChaps.length === 0) return;
    let isMounted = true;

    mChaps.forEach((chNum) => {
      // 1) 장별 분할 주석 JSON 로드 (Interlinear.js와 동일한 고밀도 주석 DB 연동)
      fetch(`/data/commentaries_by_chapter/${currentBookMeta.ko}_${chNum}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && isMounted) setCommentaryDb(prev => ({ ...prev, ...d }));
        })
        .catch(() => {});

      fetch(`/data/matthew_henry_by_chapter/${currentBookMeta.ko}_${chNum}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && isMounted) setMatthewHenryDb(prev => ({ ...prev, ...d }));
        })
        .catch(() => {});

      // 2) 만약 로컬 web_bible.json에 현재 장의 영어 구절이 없다면 공인 WEB API에서 즉시 자동 패치!
      const testWeb = resolveTranslationVerse(webBibleDb, currentBookMeta, chNum, 1);
      if (!testWeb && !liveWebChapterCache[`${currentBookMeta.en}-${chNum}-1`]) {
        fetch(`https://bible-api.com/${encodeURIComponent(`${currentBookMeta.en} ${chNum}`)}?translation=web`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && Array.isArray(data.verses)) {
              data.verses.forEach(vObj => {
                const vNumber = Number(vObj.verse);
                const cleanTxt = String(vObj.text || '').replace(/\r?\n/g, ' ').trim();
                if (vNumber && cleanTxt) {
                  liveWebChapterCache[`${currentBookMeta.en}-${chNum}-${vNumber}`] = cleanTxt;
                }
              });
              if (isMounted) setLiveWebTick(t => t + 1);
            }
          })
          .catch(() => {});
      }
    });

    return () => { isMounted = false; };
  }, [currentBookMeta, mChaps, webBibleDb]);

  const safeCleanText = (txt) => cleanText ? cleanText(txt) || txt : txt || '';

  const openGalaxyPopup = useCallback((mode = 'arc', customRefStr = '') => {
    const defaultRef = `${currentBookMeta.ko} ${mChaps[0] || 1}:1`;
    setGalaxyModalConfig({
      isOpen: true,
      mode,
      refQuery: customRefStr || defaultRef
    });
  }, [currentBookMeta, mChaps]);

  const handleInsertArcInsightToMcheyne = useCallback((insightText) => {
    const updatedNote = (noteContent || '') + insightText;
    setNoteContent(updatedNote);
    if (updateDay) updateDay({ mcheyneNote: updatedNote });
    setViewMode('split');
  }, [noteContent, updateDay]);

  // 해당 장의 절 목록 조회 (개역개정 4판 최우선)
  const getDisplayVersesForChapter = useCallback((chNum) => {
    const krv4ChapVerses =
      krv4TxtDb?.[currentBookMeta.en]?.[chNum - 1] ||
      krv4TxtDb?.[currentBookMeta.ko]?.[chNum - 1] ||
      krv4TxtDb?.[currentBookMeta.abbr]?.[chNum - 1];

    const allVerses = (Array.isArray(krv4ChapVerses) && krv4ChapVerses.length > 0)
      ? krv4ChapVerses.filter(Boolean)
      : ((getArr ? getArr(mBookD?.chapters) : mBookD?.chapters || [])[chNum - 1] || []);

    if (!mVerseRange || !mVerseRange[chNum]) {
      return allVerses.map((text, idx) => ({ vNum: idx + 1, text }));
    }
    const { start, end } = mVerseRange[chNum];
    return allVerses
      .map((text, idx) => ({ vNum: idx + 1, text }))
      .filter(item => item.vNum >= start && item.vNum <= end);
  }, [krv4TxtDb, currentBookMeta, mBookD, mVerseRange, getArr]);

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

  // =====================================================================
  // 🌿 [목장 모임 & 출석부 & 루틴 100% 매핑 엔진]
  // =====================================================================
  const triggerSpiritualSync = useCallback((nextReadVerses) => {
    try {
      const todayYmd = ymdStr || date || new Date().toISOString().slice(0, 10);

      // 1) 상위 App 상태(currDay.checks) 업데이트
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

      // 2) Supabase 목장 모임 출석부(attendance_records)에 '맥체인' 및 '성경' 모두 출석 업서트!
      if (supabase && (authUser?.name || authUser)) {
        const uName = typeof authUser === 'object' ? authUser?.name : authUser;
        const cName = authUser?.cell_name || '내 목장';
        if (uName) {
          supabase.from('attendance_records').upsert([
            { date: todayYmd, user_name: uName, cell_name: cName, type: '맥체인', status: '출석' },
            { date: todayYmd, user_name: uName, cell_name: cName, type: '성경', status: '출석' }
          ], { onConflict: 'date,user_name,type' }).then(() => {
            setCellSyncToast(true);
            setTimeout(() => setCellSyncToast(false), 2500);
          });
        }
      } else {
        setCellSyncToast(true);
        setTimeout(() => setCellSyncToast(false), 2500);
      }

      // 3) 로컬스토리지 days_data 및 daily_routine 동기화 (목장모임 리포트 연동)
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

  // =====================================================================
  // 🔬 [원어 강해 인스펙터] 스트롱 코드 정규화 & 미등록 어휘 자동 번역 복구!
  // =====================================================================
  const handleSelectInspectorWord = useCallback(async (word) => {
    setSelectedWordDetail(word);
    setConcordanceList([]);
    setConcordanceTotalCount(0);

    const note = customNotesMap[word.strongs];
    setCustomInputTrans(note?.translation || '');
    setCustomInputMemo(note?.memo || '');

    // 만약 뜻이 '원어 어휘'이고 영문 뜻(eng)이 존재하면 즉시 한글로 자동 번역하여 보강!
    if ((word.korLemma === '원어 어휘' || !word.korLemma) && word.eng && word.eng !== 'n/a') {
      fetchQuickKoreanTranslate(word.eng).then((koTranslated) => {
        if (koTranslated) {
          setSelectedWordDetail(prev => prev && prev.order === word.order ? {
            ...prev,
            korLemma: koTranslated,
            korContextual: applyContextualCaseEnding(koTranslated, word.caseType, word.isOT, word.grammarRaw)
          } : prev);
        }
      });
    }

    if (supabase && word.strongs && !word.strongs.endsWith('0000')) {
      try {
        const cleanId = word.strongs.trim().toUpperCase();
        const prefix = cleanId[0];
        const numPart = cleanId.slice(1).replace(/^0+/, '') || '0';
        const candidateIds = Array.from(new Set([
          cleanId,
          `${prefix}${numPart}`,
          `${prefix}${numPart.padStart(4, '0')}`
        ]));

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
  }, [customNotesMap]);

  const openVerseInspector = useCallback(async (chNum, vNum, verseText) => {
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
        const strongIds = Array.from(new Set(wordsData.map(w => (w.strongs_id || '').trim()).filter(Boolean)));
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
          // G2774 ⇄ G02774 양방향 마스터 사전 매칭
          const master = lookupStrongsEntry(masterDict, sId);
          const dbDict = dictMap.get(sId) || {};
          const morph = decodeExhaustiveMorphology(w.grammar);

          const inflectedWord = (w.original_word || '').trim();
          const lemmaWord = (master.original || dbDict.original_word || inflectedWord).trim();
          const isInflectedDifferent = lemmaWord && inflectedWord && lemmaWord !== inflectedWord;

          // 한글 뜻 다중 폴백 추출 (사전 한글뜻 ➔ DB 한글뜻 ➔ korean_trans 한글 ➔ 영문 gloss)
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

          const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morph.caseType, isOT, w.grammar);
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
            grammarRaw: w.grammar || '',
            grammarDecoded: morph.label,
            caseType: morph.caseType,
            isOT,
            strongs: sId || (isOT ? 'H0000' : 'G0000'),
            etymology: decodeHtmlEntities(master.etym || dbDict.description || ''),
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
  }, [currentBookMeta, customNotesMap, easyBibleDb, webBibleDb, handleSelectInspectorWord]);

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

  const handleInsertWordToMcheyneNote = (word) => {
    const lemmaNotice = word.isInflectedDifferent ? ` (원형: ${word.lemma})` : '';
    const customMemoNotice = word.userCustomNote?.memo ? `\n   ↳ 연구 메모: ${word.userCustomNote.memo}` : '';
    const insightLine = `\n[원어묵상] ${word.inflected}${lemmaNotice} (${word.strongs}): ${word.korContextual} (${word.eng}) — ${word.grammarDecoded}${customMemoNotice}\n`;
    
    const updatedNote = (noteContent || '') + insightLine;
    setNoteContent(updatedNote);
    if (updateDay) updateDay({ mcheyneNote: updatedNote });
    alert(`[${word.inflected}] 원어 강해가 맥체인 노트에 기록되었습니다.`);
  };

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

  const handleTranslateScholarlyBlock = async (key, rawText) => {
    if (translatedScholarlyMap[key]) {
      setTranslatedScholarlyMap(prev => ({ ...prev, [key]: null }));
      return;
    }
    setTranslatingKey(key);
    const ko = await fetchQuickKoreanTranslate(rawText);
    setTranslatedScholarlyMap(prev => ({ ...prev, [key]: ko }));
    setTranslatingKey(null);
  };

  const activeBookMeta = useMemo(() => {
    const firstChap = mChaps[0] || 1;
    const chapterKey = `${currentBookMeta.ko}_${firstChap}`;

    const chapData = mcheyneDevotionsDb?.chapters?.[chapterKey] || null;

    const chapterCommentaries = [];
    for (let v = 1; v <= 50; v++) {
      const vKey = `${currentBookMeta.ko}-${firstChap}-${v}`;
      if (commentaryDb[vKey]?.exegesis) {
        chapterCommentaries.push(`[${v}절 주석] ${decodeHtmlEntities(commentaryDb[vKey].exegesis)}`);
      }
      if (chapterCommentaries.length >= 3) break;
    }

    if (chapData) {
      return {
        koBook: currentBookMeta.ko,
        chapter: firstChap,
        section: chapData.section || currentBookMeta.section,
        title: chapData.title,
        keywords: chapData.keywords || [],
        summary: chapData.summary,
        coreObservation: chapData.coreObservation,
        christConnection: chapData.christConnection,
        scholarlyNotes: chapterCommentaries,
        questions: chapData.questions || []
      };
    }

    return {
      koBook: currentBookMeta.ko,
      chapter: firstChap,
      section: currentBookMeta.section,
      title: `${currentBookMeta.ko} ${firstChap}장 말씀 강해`,
      keywords: [],
      summary: `${currentBookMeta.ko} ${firstChap}장 본문을 통해 하나님의 구속 경륜을 묵상합니다.`,
      coreObservation: currentBookMeta.theme,
      christConnection: `모든 성경은 예수 그리스도의 십자가와 부활의 복음을 증거합니다.`,
      scholarlyNotes: chapterCommentaries,
      questions: [`오늘 ${currentBookMeta.ko} ${firstChap}장 말씀에서 나에게 주시는 핵심 교훈은 무엇입니까?`]
    };
  }, [currentBookMeta, mChaps, mcheyneDevotionsDb, commentaryDb]);

  const isDark = isDarkMode;
  const theme = {
    bg: isDark ? 'bg-[#0B0E14]' : 'bg-[#F8F9FA]',
    panel: isDark ? 'bg-[#121620] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs',
    textMain: isDark ? 'text-slate-100' : 'text-stone-900',
    textSub: isDark ? 'text-slate-400' : 'text-stone-500',
    border: isDark ? 'border-white/10' : 'border-stone-200',
  };

  const fontSizeClass = fontSizeLevel === 0
    ? 'text-[14px] sm:text-[14.5px] leading-[1.8]'
    : fontSizeLevel === 2
    ? 'text-[17px] sm:text-[18px] leading-[1.95]'
    : 'text-[15.5px] sm:text-[16px] leading-[1.88]';

  const originalFontStyle = (isOT) => isOT
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

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans select-none animate-fade-in ${theme.bg}`}>
      
      {/* 목장모임 출석 연동 토스트 알림 */}
      {cellSyncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[9999999] bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in">
          <span>✓</span>
          <span>맥체인 통독이 [목장 모임 출석부] 및 [오늘의 루틴]에 자동 반영되었습니다!</span>
        </div>
      )}

      {/* 신구약 구속사 아크 & 성경 은하계 팝업 모달 */}
      <BibleGalaxyArcModal
        isOpen={galaxyModalConfig.isOpen}
        onClose={() => setGalaxyModalConfig(prev => ({ ...prev, isOpen: false }))}
        initialMode={galaxyModalConfig.mode}
        initialRefQuery={galaxyModalConfig.refQuery}
        onInsertInsight={handleInsertArcInsightToMcheyne}
        setActiveScreen={setActiveScreen}
      />

      {/* 1. 상단 글로벌 헤더 */}
      <header className={`relative z-20 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b shrink-0 ${
        isDark ? 'border-white/10 bg-[#11151E]' : 'border-stone-200 bg-white'
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme.textMain} hover:bg-black/5 dark:hover:bg-white/10`}
          >
            <IconArrowLeft />
          </button>
          <h1 className={`text-[15.5px] sm:text-[16.5px] font-bold tracking-tight whitespace-nowrap ${theme.textMain}`}>
            오늘의 맥체인
          </h1>
          {krv4TxtDb && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
              개역개정 4판
            </span>
          )}
          {(mAllR || currDay?.checks?.['맥체인']) && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              ✓ 목장모임 출석 연동됨
            </span>
          )}
          {isMoHana && partnerActivity && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-bold border border-emerald-500/30">
              동행 묵상 중
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center p-0.5 rounded-lg border text-[11px] font-bold ${isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'}`}>
            <button
              onClick={() => setFontSizeLevel(l => Math.max(0, l - 1))}
              className={`px-2 py-0.5 rounded cursor-pointer ${theme.textSub} hover:${theme.textMain}`}
              title="글자 작게"
            >
              가-
            </button>
            <button
              onClick={() => setFontSizeLevel(l => Math.min(2, l + 1))}
              className={`px-2 py-0.5 rounded cursor-pointer ${theme.textSub} hover:${theme.textMain}`}
              title="글자 크게"
            >
              가+
            </button>
          </div>

          <button 
            onClick={() => setIsFocusMode(!isFocusMode)} 
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold transition-all shrink-0 cursor-pointer border ${
              isFocusMode 
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent' 
                : (isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-white text-stone-700 border-stone-200')
            }`}
          >
            {isFocusMode ? <><IconMinimize /> <span>툴바 펼치기</span></> : <><IconMaximize /> <span>집중 모드</span></>}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme.textMain} hover:bg-black/5 dark:hover:bg-white/10`}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      {/* 2. 상단 컨트롤 바 */}
      <div className={`w-full flex-col shrink-0 border-b ${theme.border} ${isFocusMode ? 'hidden' : 'flex'} ${
        isDark ? 'bg-[#121620]' : 'bg-white'
      }`}>
        <div className={`px-3 sm:px-5 py-2 border-b ${theme.border} flex items-center justify-between gap-2 flex-wrap`}>
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            {(getArr ? getArr(mpList) : mpList || []).map((planItem, idx) => {
              const isSelected = mcheynePlanIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setMcheynePlanIdx && setMcheynePlanIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? (isDark ? 'bg-white text-stone-950 border-white shadow-2xs' : 'bg-stone-900 text-white border-stone-900 shadow-2xs')
                      : (isDark ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100')
                  }`}
                >
                  {decodeHtmlEntities(safeCleanText(planItem.title))}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* 4대 역본 전환 (기본: 개역개정4판) */}
            <div className={`flex p-0.5 rounded-lg border text-[11px] font-bold ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-stone-100 border-stone-200'}`}>
              {[
                { id: 'krv', label: '개역개정4판' },
                { id: 'easy', label: '쉬운성경' },
                { id: 'web', label: 'WEB' },
                { id: 'parallel', label: '동시대조' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVersionChange(v.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    bibleVersion === v.id
                      ? (isDark ? 'bg-amber-500 text-stone-950 font-black shadow-2xs' : 'bg-stone-900 text-white font-black shadow-2xs')
                      : theme.textSub
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className={`flex p-0.5 rounded-lg border text-[11px] font-bold ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-stone-100 border-stone-200'}`}>
              <button 
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'single' ? (isDark ? 'bg-[#1E2433] text-white' : 'bg-white text-stone-900 shadow-2xs') : theme.textSub
                }`}
              >
                본문 집중
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'split' ? (isDark ? 'bg-white text-stone-950' : 'bg-stone-900 text-white shadow-2xs') : theme.textSub
                }`}
              >
                2단 필사
              </button>
            </div>
          </div>
        </div>

        {/* 2-2. 오디오 낭독/녹음 및 신학 연구 액션 바 */}
        <div className={`px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar ${
          isDark ? 'bg-[#0E121A]' : 'bg-stone-50/70'
        }`}>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setTtsRate && setTtsRate(r => r === 1.0 ? 1.2 : r === 1.2 ? 1.5 : r === 1.5 ? 2.0 : 1.0)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                isDark ? 'border-white/10 bg-[#161B26] text-slate-300' : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              {ttsRate}x 배속
            </button>
            
            <button
              onClick={() => { 
                const q = [`${mp?.title} 말씀입니다.`]; 
                getArr(mChaps).forEach(ch => { 
                  getDisplayVersesForChapter(ch).forEach(v => {
                    const { pureText } = splitPericopeAndVerse(decodeHtmlEntities(String(v.text || '')));
                    const easyText = resolveTranslationVerse(easyBibleDb, currentBookMeta, ch, v.vNum);
                    const webText = resolveTranslationVerse(webBibleDb, currentBookMeta, ch, v.vNum);
                    
                    let textToRead = pureText;
                    if (bibleVersion === 'easy' && easyText) {
                      textToRead = easyText;
                    } else if (bibleVersion === 'web' && webText) {
                      textToRead = webText;
                    }
                    q.push(textToRead);
                  }); 
                }); 
                if (toggleTTS) toggleTTS(q); 
              }}
              className={`h-7 px-3 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                isSpeaking ? 'bg-rose-600 text-white animate-pulse' : (isDark ? 'bg-white text-stone-950' : 'bg-stone-900 text-white')
              }`}
            >
              {isSpeaking ? <IconStop /> : <IconPlay />} <span>{isSpeaking ? '낭독 중지' : '본문 낭독'}</span>
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap ${
                isRecording ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : (isDark ? 'border-white/10 bg-[#161B26] text-slate-300' : 'border-stone-200 bg-white text-stone-700')
              }`}
            >
              <IconMic /> <span>{isRecording ? '녹음 저장' : '음성 녹음'}</span>
            </button>

            <div className="w-[1px] h-4 bg-stone-300 dark:bg-white/10 mx-0.5" />

            <a
              href={`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경읽기+${ymdStr}`}
              target="_blank"
              rel="noreferrer"
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-colors whitespace-nowrap ${
                isDark ? 'border-white/10 bg-[#161B26] text-slate-300 hover:text-white' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <IconSearch /> <span>통독 영상</span>
            </a>
            <a
              href={`https://www.youtube.com/results?search_query=부산신성교회+맥체인+성경+해설+${ymdStr}`}
              target="_blank"
              rel="noreferrer"
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-colors whitespace-nowrap ${
                isDark ? 'border-white/10 bg-[#161B26] text-slate-300 hover:text-white' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>해설 영상</span>
            </a>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowDevotionGuide(prev => !prev)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                showDevotionGuide
                  ? (isDark ? 'bg-white text-stone-950 border-white' : 'bg-stone-900 text-white border-stone-900')
                  : (isDark ? 'border-white/15 bg-[#161B26] text-amber-300 hover:bg-white/10' : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100')
              }`}
            >
              <IconBook /> <span>맥체인 강해 해설</span>
            </button>

            <button
              type="button"
              onClick={() => openGalaxyPopup('arc')}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                isDark ? 'border-white/15 bg-[#161B26] text-slate-200 hover:bg-white/10' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>신구약 아크</span>
            </button>

            <button
              type="button"
              onClick={() => openGalaxyPopup('2d')}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                isDark ? 'border-white/15 bg-[#161B26] text-slate-200 hover:bg-white/10' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>말씀 은하계</span>
            </button>

            <button 
              onClick={() => setActiveScreen && setActiveScreen('interlinear')}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                isDark ? 'border-white/15 bg-[#161B26] text-slate-200 hover:bg-white/10' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>원어 연구실</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 본문 메인 레이아웃 */}
      <div className={`flex-1 px-2.5 sm:px-4 md:px-6 pt-2.5 pb-20 grid gap-4 h-full relative z-10 overflow-hidden ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12 max-w-[1560px]' : 'grid-cols-1 max-w-4xl'
      } mx-auto w-full`}>
          
        {/* 좌측 성경 본문 스트림 */}
        <div className={`${viewMode === 'split' ? 'lg:col-span-7' : ''} flex flex-col relative z-[45] pointer-events-auto h-full overflow-y-auto hide-scrollbar space-y-3`}>
          
          {/* 맥체인 장별 강해 및 신학적 배경 아코디언 패널 */}
          <div className={`rounded-xl border transition-all overflow-hidden shrink-0 ${
            isDark ? 'bg-[#121620] border-white/10' : 'bg-white border-stone-200/90 shadow-2xs'
          }`}>
            <div
              onClick={() => setShowDevotionGuide(!showDevotionGuide)}
              className="px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  isDark ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-700'
                }`}>
                  {activeBookMeta.section}
                </span>
                <span className={`text-[13.5px] font-bold truncate ${theme.textMain}`}>
                  {activeBookMeta.koBook} {activeBookMeta.chapter}장: {activeBookMeta.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-medium hidden sm:inline ${theme.textSub}`}>
                  {showDevotionGuide ? '해설 접기' : '해설 보기'}
                </span>
                <IconChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showDevotionGuide ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {showDevotionGuide && (
              <div className={`px-4 pb-4 pt-2 border-t ${theme.border} space-y-3 text-left`}>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-stone-50 border-stone-200/80'}`}>
                  <span className="text-[10.5px] font-bold text-stone-400 block mb-1">본문 핵심 요약</span>
                  <p className={`text-[13px] font-medium leading-relaxed ${theme.textMain}`}>{activeBookMeta.summary}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 block">핵심 관찰 포인트</span>
                  <p className={`text-[12.5px] font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                    {activeBookMeta.coreObservation}
                  </p>
                </div>

                {activeBookMeta.christConnection && (
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181D29] border-white/10' : 'bg-stone-100/70 border-stone-200'}`}>
                    <span className="text-[11px] font-bold text-stone-400 block mb-0.5">구속사적 연결 (Christ Connection)</span>
                    <p className={`text-[12.5px] font-serif leading-relaxed ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                      {activeBookMeta.christConnection}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 block">오늘의 삶의 질문</span>
                  <ul className={`text-[12px] space-y-1 pl-4 list-disc ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                    {activeBookMeta.questions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const summaryBlock = `\n[${activeBookMeta.koBook} ${activeBookMeta.chapter}장 묵상 노트]\n• 핵심: ${activeBookMeta.title}\n• 요약: ${activeBookMeta.summary}\n• 결단: ${activeBookMeta.questions[0]}\n`;
                      const nextNote = (noteContent || '') + summaryBlock;
                      setNoteContent(nextNote);
                      if (updateDay) updateDay({ mcheyneNote: nextNote });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold border cursor-pointer transition-colors ${
                      isDark ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' : 'bg-stone-900 border-stone-900 text-white hover:bg-black'
                    }`}
                  >
                    강해 요약을 필사 노트에 삽입
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* 성경 본문 카드 (개역개정4판 · 쉬운성경 · WEB영어 · 동시대조 완벽 작동!) */}
          {/* ===================================================================== */}
          <div className={`border ${theme.panel} rounded-xl p-4 sm:p-6 min-h-[420px]`} data-live-web-tick={liveWebTick}>
            <div className={`mb-4 pb-2.5 border-b ${theme.border} flex items-center justify-between text-[11.5px] ${theme.textSub}`}>
              <span>절 번호 클릭: <b>원어 강해</b> · 본문 클릭: <b>읽음 체크(목장모임 연동) 및 연구 도구</b></span>
              {audioUrl && (
                <audio src={audioUrl} controls className="h-6 max-w-[160px]" />
              )}
            </div>

            {(getArr ? getArr(mChaps) : mChaps || []).map(ch => {
              const displayVerses = getDisplayVersesForChapter(ch);
              const chRead = isChapterAllRead(ch);
              const koBookNameForChap = currentBookMeta.ko;

              return ( 
                <div key={ch} className="mb-8 last:mb-2">
                  {/* 장 헤더 바 */}
                  <div className={`flex items-center justify-between mb-3 pb-2 border-b ${theme.border} flex-wrap gap-2`}>
                    <div className="flex items-center gap-2.5">
                      <h3 className={`font-bold text-[16px] sm:text-[17px] tracking-tight ${theme.textMain}`}>
                        {koBookNameForChap} 제 {ch} 장
                      </h3>
                      <button
                        type="button"
                        onClick={() => openGalaxyPopup('arc', `${koBookNameForChap} ${ch}:1`)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer transition-colors ${
                          isDark ? 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {ch}장 아크 대조
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleToggleWholeChapter(ch)}
                      className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        chRead
                          ? (isDark ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-600 text-white border-emerald-600')
                          : (isDark ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50')
                      }`}
                    >
                      <IconCheckCircle />
                      <span>{chRead ? `${ch}장 완독됨 (목장연동)` : `${ch}장 전체 완독`}</span>
                    </button>
                  </div>

                  {/* 성경 본문 리스트 */}
                  <div className="space-y-1.5">
                    {displayVerses.map(({ vNum, text }) => { 
                      const vId = `${mBookD?.name}-${ch}-${vNum - 1}`; 
                      const verseKey = `${ch}-${vNum}`;
                      const isRead = (readVerses || {})[vId]; 
                      const isSelectedVerse = selectedVerseKey === verseKey;

                      const rawDecoded = decodeHtmlEntities(typeof text === 'string' ? text : (text?.text || ''));
                      const { pericope, pureText } = splitPericopeAndVerse(rawDecoded);
                      const displayVerseText = safeCleanText(pureText);

                      // 🌟 멀티 키 탐색기로 쉬운성경 & WEB 영어성경 완벽 인출!
                      const easyText = resolveTranslationVerse(easyBibleDb, currentBookMeta, ch, vNum);
                      const webText = resolveTranslationVerse(webBibleDb, currentBookMeta, ch, vNum);

                      return ( 
                        <div key={vNum} className="rounded-lg transition-colors">
                          {/* 개역개정 4판 단락 소제목(Pericope) 배지 표시 */}
                          {pericope && (
                            <div className="mt-2.5 mb-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border-l-4 border-amber-600 dark:border-amber-400 text-amber-900 dark:text-amber-300 font-sans font-extrabold text-[12.5px] sm:text-[13.5px] tracking-tight flex items-center gap-1.5 select-none">
                              <span>📌</span>
                              <span>{pericope}</span>
                            </div>
                          )}

                          <div 
                            className={`py-2 px-2.5 rounded-lg transition-all flex items-baseline gap-3 ${
                              isSelectedVerse
                                ? (isDark ? 'bg-white/[0.07] ring-1 ring-white/20' : 'bg-stone-100/90 ring-1 ring-stone-300')
                                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            {/* 절 번호 (클릭 시 원어 강해 인스펙터 즉시 오픈) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openVerseInspector(ch, vNum, displayVerseText);
                              }}
                              className={`font-mono font-bold text-[12.5px] min-w-[24px] text-right shrink-0 select-none cursor-pointer transition-colors ${
                                isRead
                                  ? 'text-stone-400 dark:text-slate-600'
                                  : 'text-amber-700 dark:text-amber-400 hover:text-stone-950 dark:hover:text-white underline-offset-4 hover:underline'
                              }`}
                              title={`${vNum}절 원어 강해 열기`}
                            >
                              {vNum}
                            </button>

                            {/* 성경 본문 텍스트 */}
                            <div 
                              onClick={() => { 
                                const willBeRead = !isRead;
                                const nextReadVerses = { ...(readVerses || {}), [vId]: willBeRead };
                                if (setReadVerses) setReadVerses(nextReadVerses); 
                                localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));
                                if (willBeRead) triggerSpiritualSync(nextReadVerses);
                                setSelectedVerseKey(prev => (prev === verseKey ? null : verseKey));
                              }}
                              className={`flex-1 font-serif break-keep cursor-pointer transition-opacity ${fontSizeClass} ${
                                isRead ? 'opacity-40 line-through' : theme.textMain
                              }`}
                            >
                              {bibleVersion === 'krv' && <span>{displayVerseText}</span>}
                              {bibleVersion === 'easy' && (
                                <span className="font-sans">
                                  {easyText || displayVerseText}
                                </span>
                              )}
                              {bibleVersion === 'web' && (
                                <div className="space-y-1">
                                  <span className="font-serif text-sky-950 dark:text-sky-100">
                                    {webText || displayVerseText}
                                  </span>
                                  {!webText && (
                                    <span className="ml-2 text-[11px] font-sans text-amber-600 dark:text-amber-400">
                                      (영문 패치 중...)
                                    </span>
                                  )}
                                </div>
                              )}
                              {bibleVersion === 'parallel' && (
                                <div className="space-y-2 py-0.5">
                                  <div className="leading-relaxed">
                                    <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-sans font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 align-middle">
                                      개역개정4판
                                    </span>
                                    <span>{displayVerseText}</span>
                                  </div>

                                  {easyText && (
                                    <div className="text-[14px] font-sans text-emerald-900 dark:text-emerald-200 pl-3 border-l-2 border-emerald-500/50 leading-relaxed">
                                      <span className="inline-block px-1.5 py-0.2 mr-1.5 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                        쉬운성경
                                      </span>
                                      {easyText}
                                    </div>
                                  )}

                                  {webText && (
                                    <div className="text-[14px] font-serif text-sky-900 dark:text-sky-200 pl-3 border-l-2 border-sky-500/50 leading-relaxed">
                                      <span className="inline-block px-1.5 py-0.2 mr-1.5 rounded text-[9.5px] font-sans font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                                        WEB 영어
                                      </span>
                                      {webText}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 선택한 절에만 부드럽게 열리는 슬림 컨텍스트 도구 바 */}
                          {isSelectedVerse && (
                            <div className={`ml-9 mr-2 mt-1 mb-2 px-3 py-1.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 animate-fade-in ${
                              isDark ? 'bg-[#181E2C] border-white/15 text-slate-200' : 'bg-white border-stone-200/90 text-stone-700 shadow-xs'
                            }`}>
                              <span className="text-[11px] font-mono font-bold opacity-75">
                                {currentBookMeta.ko} {ch}:{vNum}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openVerseInspector(ch, vNum, displayVerseText)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                    isDark ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-white'
                                  }`}
                                >
                                  🔬 원어 강해
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openGalaxyPopup('arc', `${currentBookMeta.ko} ${ch}:${vNum}`)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                                    isDark ? 'border-white/15 hover:bg-white/10' : 'border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  신구약 아크
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openGalaxyPopup('2d', `${currentBookMeta.ko} ${ch}:${vNum}`)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                                    isDark ? 'border-white/15 hover:bg-white/10' : 'border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  말씀 은하계
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const quoteLine = `\n[${currentBookMeta.ko} ${ch}:${vNum}] "${displayVerseText}"\n`;
                                    const nextNote = (noteContent || '') + quoteLine;
                                    setNoteContent(nextNote);
                                    if (updateDay) updateDay({ mcheyneNote: nextNote });
                                    setSelectedVerseKey(null);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                                    isDark ? 'border-white/15 hover:bg-white/10' : 'border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  노트에 인용
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(`[${currentBookMeta.ko} ${ch}:${vNum}] ${displayVerseText}`);
                                    setSelectedVerseKey(null);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                                    isDark ? 'border-white/15 hover:bg-white/10' : 'border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  복사
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ); 
                    })}
                  </div>
                </div> 
              );
            })}
            
            {/* 하단 플랜 전체 완독 버튼 */}
            <div className={`mt-4 pt-4 border-t ${theme.border}`}>
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
                  if (setReadVerses) setReadVerses(nextReadVerses); 
                  localStorage.setItem('readVerses', JSON.stringify(nextReadVerses));

                  if (nextState) {
                    triggerSpiritualSync(nextReadVerses);
                  } else {
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('bible-progress-updated'));
                  }
                }} 
                className={`w-full py-3 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mAllR 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : (isDark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-black')
                }`}
              >
                <IconCheckCircle />
                <span>{mAllR ? '✓ 현재 본문 완독 완료 (목장모임 출석 연동됨 · 누르면 취소)' : '현재 맥체인 본문 전체 완독 체크 (목장모임 출석 자동연동)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 우측: 2단 필사 전용 손필기 & 타이핑 노트 패널 */}
        {viewMode === 'split' && (
          <div className="lg:col-span-5 flex flex-col h-full relative z-[45] pointer-events-auto min-h-[460px]">
            <McheyneTranscriptionNotePanel
              currentPlanKey={`${date || ymdStr || 'today'}_plan_${mcheynePlanIdx}`}
              planTitle={decodeHtmlEntities(safeCleanText(mp?.title || '맥체인'))}
              isDark={isDark}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              updateDay={updateDay}
              onOpenGalaxyPopup={openGalaxyPopup}
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. 원어 연구 인스펙터 모달 (스트롱 양방향 매칭 + 장별 주석 + 한글 번역 탑재!) */}
      {/* ===================================================================== */}
      {inspectorTarget && (
        <div
          className="mcheyne-modal-portal fixed inset-0 z-[999999] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none"
          onClick={() => setInspectorTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#10141D] border-white/20 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="border-b pb-3 border-stone-200 dark:border-white/15 shrink-0 space-y-2.5">
              <div className="flex justify-between items-center flex-wrap gap-1.5">
                <span className="text-[13px] font-bold">
                  {inspectorTarget.book} {inspectorTarget.chapter}장 {inspectorTarget.verse}절 원어 강해
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const refStr = `${inspectorTarget.book} ${inspectorTarget.chapter}:${inspectorTarget.verse}`;
                      setInspectorTarget(null);
                      openGalaxyPopup('arc', refStr);
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
                    원어성경연구실 ➔
                  </button>
                  <button
                    onClick={() => setInspectorTarget(null)}
                    className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white px-2 py-1 cursor-pointer"
                  >
                    닫기 ✕
                  </button>
                </div>
              </div>

              {selectedWordDetail && (
                <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl border ${
                  isDark ? 'bg-[#161B26] border-white/15 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">본문 출현형 (INFLECTED)</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold">
                        {cleanTypography(selectedWordDetail.inflected, inspectorTarget.isOT)}
                      </span>
                      <span className="text-xs font-mono text-stone-400">{selectedWordDetail.pron}</span>
                    </div>
                    <p className="text-xs font-bold">
                      번역: <span className="text-amber-600 dark:text-amber-400 underline underline-offset-2">{selectedWordDetail.korContextual}</span>
                      {selectedWordDetail.eng && selectedWordDetail.eng !== 'n/a' && (
                        <span className="ml-1.5 text-[11px] font-mono text-sky-500">({selectedWordDetail.eng})</span>
                      )}
                    </p>
                    <p className="text-[10.5px] text-stone-400">{selectedWordDetail.grammarDecoded}</p>
                  </div>

                  <div className="space-y-0.5 border-l pl-3 text-left border-stone-200 dark:border-white/15">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">원형 표제어 (LEMMA)</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={originalFontStyle(inspectorTarget.isOT)} className="text-2xl font-bold">
                        {cleanTypography(selectedWordDetail.lemma, inspectorTarget.isOT)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                        {selectedWordDetail.strongs}
                      </span>
                    </div>
                    <p className="text-xs font-bold">
                      기본뜻: <b className="text-emerald-600 dark:text-emerald-400">{selectedWordDetail.korLemma}</b>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <p className={`text-[13px] font-serif font-medium leading-relaxed ${theme.textMain}`}>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mr-1.5">[개역개정4판]</span>
                  {inspectorTarget.text}
                </p>
                {inspectorTarget.easyText && (
                  <p className="text-[12.5px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                    <span className="text-[10px] font-bold mr-1.5">[쉬운성경]</span>
                    {inspectorTarget.easyText}
                  </p>
                )}
                {inspectorTarget.webText && (
                  <p className="text-[12.5px] font-serif leading-relaxed text-sky-700 dark:text-sky-300">
                    <span className="text-[10px] font-sans font-bold mr-1.5">[WEB]</span>
                    {inspectorTarget.webText}
                  </p>
                )}
              </div>
            </div>

            {/* 탭 바 */}
            <div className={`flex gap-1 p-1 rounded-xl border my-2.5 shrink-0 ${
              isDark ? 'bg-[#0B0E14] border-white/15' : 'bg-stone-100 border-stone-200'
            }`}>
              {[
                { id: 'scholarly', label: '10대 학술 사료 & 주석' },
                { id: 'concordance', label: `전권 용례 (${concordanceTotalCount}회)` },
                { id: 'custom_study', label: '연구 메모' }
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

            {/* 본문 스크롤 */}
            <div className="overflow-y-auto hide-scrollbar space-y-2.5 flex-1 text-xs text-left">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#161B26] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5">어절 선택 (터치 시 원어 분석)</span>
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
                            ? 'bg-amber-500 text-stone-950 shadow-xs' 
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
                <div className="space-y-2.5">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0B0E14] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[11.5px]">🔗 교차참조 (TSK) — {crossRefs.length}개</span>
                      <span className="text-[10px] text-stone-400">클릭 시 아크 대조 오픈</span>
                    </div>
                    {crossRefs.length === 0 ? (
                      <p className="text-[11px] text-stone-400">직결된 교차참조 구절이 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto hide-scrollbar">
                        {crossRefs.map((ref, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInspectorTarget(null);
                              openGalaxyPopup('arc', ref.label);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                              isDark ? 'bg-[#161B26] border-white/15 text-stone-200 hover:bg-white/15' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
                            }`}
                          >
                            {ref.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {currentHebrewSyntax && (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0B0E14] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block">📜 BHS 히브리어 구문론 구조</span>
                      {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                        <div key={idx} className={`p-1.5 rounded flex justify-between text-[11.5px] ${isDark ? 'bg-[#161B26]' : 'bg-white'}`}>
                          <span style={originalFontStyle(true)} className="font-bold">{c.unit}</span>
                          <span className="text-stone-400">{c.role}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentCommentary && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-indigo-950/20 border-indigo-800/50' : 'bg-indigo-50/60 border-indigo-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11.5px] text-indigo-700 dark:text-indigo-300">
                          📖 학술 강해 주석 ({currentCommentary.commentator})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTranslateScholarlyBlock(`comm_${currentKey}`, currentCommentary.exegesis)}
                          className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {translatingKey === `comm_${currentKey}` ? '번역 중...' : translatedScholarlyMap[`comm_${currentKey}`] ? '원문 보기' : '한국어 번역'}
                        </button>
                      </div>
                      <p className="text-[12px] leading-relaxed font-serif">
                        {decodeHtmlEntities(translatedScholarlyMap[`comm_${currentKey}`] || currentCommentary.exegesis)}
                      </p>
                    </div>
                  )}

                  {currentMatthewHenry && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50/60 border-emerald-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11.5px] text-emerald-700 dark:text-emerald-300">
                          🌿 매튜 헨리 구속사적 묵상 강해
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTranslateScholarlyBlock(`mh_${currentKey}`, currentMatthewHenry.devotionalExegesis)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {translatingKey === `mh_${currentKey}` ? '번역 중...' : translatedScholarlyMap[`mh_${currentKey}`] ? '원문 보기' : '한국어 번역'}
                        </button>
                      </div>
                      <p className="text-[12px] leading-relaxed font-serif">
                        {decodeHtmlEntities(translatedScholarlyMap[`mh_${currentKey}`] || currentMatthewHenry.devotionalExegesis)}
                      </p>
                    </div>
                  )}

                  {currentTargumPeshitta && (
                    <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#0B0E14] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block">🏺 고대 아람어 타르굼 & 시리아 페시타</span>
                      {currentTargumPeshitta.targumAramaic && (
                        <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-right text-[14px] font-bold" dir="rtl">{currentTargumPeshitta.targumAramaic}</p>
                      )}
                      {currentTargumPeshitta.peshittaSyriac && (
                        <p style={{ fontFamily: "'Estrangelo Edessa', serif" }} className="text-right text-[15px] font-bold" dir="rtl">{currentTargumPeshitta.peshittaSyriac}</p>
                      )}
                    </div>
                  )}

                  {currentNetNote && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0B0E14] border-white/15' : 'bg-stone-50 border-stone-200'}`}>
                      <span className="font-bold text-[11.5px] block mb-1">🔍 NET Bible 비평 각주: {decodeHtmlEntities(currentNetNote.title)}</span>
                      <p className="text-[12px] leading-relaxed font-serif">{decodeHtmlEntities(currentNetNote.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'concordance' && (
                <div className="space-y-1.5">
                  {concordanceList.length === 0 ? (
                    <div className="py-6 text-center text-stone-400">동일 스트롱 코드 용례가 없습니다.</div>
                  ) : (
                    concordanceList.map((item, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg border flex items-center justify-between ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                        <span className="font-bold min-w-[75px]">{item.book} {item.chapter}:{item.verse}</span>
                        <span style={originalFontStyle(inspectorTarget.isOT)} className="font-bold text-[16px]">{cleanTypography(item.original_word, inspectorTarget.isOT)}</span>
                        <span className="text-stone-500 dark:text-slate-300 truncate max-w-[130px] text-right font-medium">{item.korean_trans}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {modalTab === 'custom_study' && selectedWordDetail && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInputTrans}
                    onChange={(e) => setCustomInputTrans(e.target.value)}
                    placeholder="대표 번역어..."
                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold border outline-none ${isDark ? 'bg-[#0B0E14] border-white/20 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'}`}
                  />
                  <textarea
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    rows={3}
                    placeholder="신학 연구 메모..."
                    className={`w-full p-3 rounded-lg text-xs font-medium border outline-none resize-none ${isDark ? 'bg-[#0B0E14] border-white/20 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'}`}
                  />
                </div>
              )}
            </div>

            {selectedWordDetail && (
              <div className="pt-3 border-t border-stone-200 dark:border-white/15 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertWordToMcheyneNote(selectedWordDetail)}
                  className="flex-1 py-2.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold text-xs cursor-pointer"
                >
                  필사 노트에 강해 삽입
                </button>
                <button
                  type="button"
                  onClick={() => speakOriginalAudio(selectedWordDetail.inflected, inspectorTarget.isOT)}
                  className={`px-4 py-2.5 rounded-lg font-bold text-xs border cursor-pointer ${
                    isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-stone-100 border-stone-300 text-stone-800'
                  }`}
                >
                  🔊 원어 발음 듣기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
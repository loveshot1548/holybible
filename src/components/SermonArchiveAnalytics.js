// src/components/SermonArchiveAnalytics.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// =====================================================================
// 전역 성경 약어 사전 및 캐논 66권 매핑
// =====================================================================
const BIBLE_ABBREV_MAP = {
  "창세기": "창세기", "창": "창세기", "출애굽기": "출애굽기", "출": "출애굽기", "레위기": "레위기", "레": "레위기", 
  "민수기": "민수기", "민": "민수기", "신명기": "신명기", "신": "신명기", "여호수아": "여호수아", "수": "여호수아", 
  "사사기": "사사기", "삿": "사사기", "룻기": "룻기", "룻": "룻기", "사무엘상": "사무엘상", "삼상": "사무엘상", 
  "사무엘하": "사무엘하", "삼하": "사무엘하", "열왕기상": "열왕기상", "왕상": "열왕기상", "열왕기하": "열왕기하", "왕하": "열왕기하", 
  "역대상": "역대상", "대상": "역대상", "역대하": "역대하", "대하": "역대하", "에스라": "에스라", "스": "에스라", 
  "느헤미야": "느헤미야", "느": "느헤미야", "에스더": "에스더", "에": "에스더", "욥기": "욥기", "욥": "욥기", 
  "시편": "시편", "시": "시편", "잠언": "잠언", "잠": "잠언", "전도서": "전도서", "전": "전도서", "아가": "아가", "아": "아가", 
  "이사야": "이사야", "사": "이사야", "예레미야": "예레미야", "렘": "예레미야", "예레미야애가": "예레미야애가", "애": "예레미야애가", 
  "에스겔": "에스겔", "겔": "에스겔", "다니엘": "다니엘", "단": "다니엘", "호세아": "호세아", "호": "호세아", 
  "요엘": "요엘", "욜": "요엘", "아모스": "아모스", "암": "아모스", "오바댜": "오바댜", "옵": "오바댜", "요나": "요나", "욘": "요나", 
  "미가": "미가", "미": "미가", "나훔": "나훔", "나": "나훔", "하박국": "하박국", "합": "하박국", "스바냐": "스바냐", "습": "스바냐", 
  "학개": "학개", "학": "학개", "스가랴": "스가랴", "슥": "스가랴", "말라기": "말라기", "말": "말라기", 
  "마태복음": "마태복음", "마": "마태복음", "마가복음": "마가복음", "막": "마가복음", "누가복음": "누가복음", "눅": "누가복음", 
  "요한복음": "요한복음", "요": "요한복음", "사도행전": "사도행전", "행": "사도행전", "로마서": "로마서", "롬": "로마서", 
  "고린도전서": "고린도전서", "고전": "고린도전서", "고린도후서": "고린도후서", "고후": "고린도후서", "갈라디아서": "갈라디아서", "갈": "갈라디아서", 
  "에베소서": "에베소서", "엡": "에베소서", "빌립보서": "빌립보서", "빌": "빌립보서", "골로새서": "골로새서", "골": "골로새서", 
  "데살로니가전서": "데살로니가전서", "살전": "데살로니가전서", "데살로니가후서": "데살로니가후서", "살후": "데살로니가후서", 
  "디모데전서": "디모데전서", "딤전": "디모데전서", "디모데후서": "디모데후서", "딤후": "디모데후서", "디도서": "디도서", "딛": "디도서", 
  "빌레몬서": "빌레몬서", "몬": "빌레몬서", "히브리서": "히브리서", "히": "히브리서", "야고보서": "야고보서", "약": "야고보서", 
  "베드로전서": "베드로전서", "벧전": "베드로전서", "베드로후서": "베드로후서", "벧후": "베드로후서", "요한일서": "요한일서", "요일": "요한일서", 
  "요한이서": "요한이서", "요이": "요한이서", "요한삼서": "요한삼서", "요삼": "요한삼서", "유다서": "유다서", "유": "유다서", "요한계시록": "요한계시록", "계": "요한계시록"
};

const BIBLE_BOOKS_ORDER = Array.from(new Set(Object.values(BIBLE_ABBREV_MAP)));
const BIBLE_KEYS = Object.keys(BIBLE_ABBREV_MAP).sort((a, b) => b.length - a.length).join('|');
const BIBLE_VERSE_SINGLE_REGEX = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`);

// 성경 7대 문맥 분류군
const BIBLE_CANON_GROUPS = {
  "모세오경": ["창세기", "출애굽기", "레위기", "민수기", "신명기"],
  "역사서": ["여호수아", "사사기", "룻기", "사무엘상", "사무엘하", "열왕기상", "열왕기하", "역대상", "역대하", "에스라", "느헤미야", "에스더"],
  "시가서": ["욥기", "시편", "잠언", "전도서", "아가"],
  "예언서": ["이사야", "예레미야", "예레미야애가", "에스겔", "다니엘", "호세아", "요엘", "아모스", "오바댜", "요나", "미가", "나훔", "하박국", "스바냐", "학개", "스가랴", "말라기"],
  "복음/역사": ["마태복음", "마가복음", "누가복음", "요한복음", "사도행전"],
  "바울서신": ["로마서", "고린도전서", "고린도후서", "갈라디아서", "에베소서", "빌립보서", "골로새서", "데살로니가전서", "데살로니가후서", "디모데전서", "디모데후서", "디도서", "빌레몬서"],
  "공동서신/계시록": ["히브리서", "야고보서", "베드로전서", "베드로후서", "요한일서", "요한이서", "요한삼서", "유다서", "요한계시록"]
};

const isOTBook = (bookName) => {
  const clean = BIBLE_ABBREV_MAP[bookName] || bookName;
  const idx = BIBLE_BOOKS_ORDER.indexOf(clean);
  return idx >= 0 && idx <= 38;
};

const getCanonGroup = (bookName) => {
  const clean = BIBLE_ABBREV_MAP[bookName] || bookName;
  for (const [group, list] of Object.entries(BIBLE_CANON_GROUPS)) {
    if (list.includes(clean)) return group;
  }
  return "기타";
};

// 💡 [핵심] 8자리 연속 날짜(20261004) 및 정규 날짜 완벽 추출기
function extractStandardDate(rec, title, raw) {
  if (rec.date && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)) return rec.date;

  const targetStr = `${title || ''} ${rec.filename || ''} ${rec.date || ''} ${raw ? raw.slice(0, 300) : ''}`;
  
  // 1) 20261004 (8자리 연속)
  const compactMatch = targetStr.match(/20\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (compactMatch) {
    const s = compactMatch[0];
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  // 2) 2026-10-04, 2026.10.04, 2026_10_04, 2026/10/04
  const sepMatch = targetStr.match(/(20\d{2})[-._/](\d{1,2})[-._/](\d{1,2})/);
  if (sepMatch) {
    return `${sepMatch[1]}-${sepMatch[2].padStart(2, '0')}-${sepMatch[3].padStart(2, '0')}`;
  }

  // 3) 2026년 10월 4일
  const korMatch = targetStr.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
  if (korMatch) {
    return `${korMatch[1]}-${korMatch[2].padStart(2, '0')}-${korMatch[3].padStart(2, '0')}`;
  }

  return rec.date || "2026-01-01";
}

// 💡 날짜 문자열로부터 연간 주차(1~52주) 수학적 정밀 산출
function getWeekNumber(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diffDays = Math.floor((d - startOfYear) / 86400000);
  const week = Math.floor((diffDays + startOfYear.getDay()) / 7) + 1;
  return Math.min(52, Math.max(1, week));
}

// 주차 번호에 해당하는 시작일~종료일 텍스트 반환
function getWeekDateRange(year, weekNum) {
  const jan1 = new Date(year, 0, 1);
  const startDayOffset = jan1.getDay();
  const firstWeekStart = new Date(year, 0, 1 - startDayOffset);
  const weekStart = new Date(firstWeekStart.getTime() + (weekNum - 1) * 7 * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(weekStart)}~${fmt(weekEnd)}`;
}

function parseBibleReference(text) {
  if (!text) return null;
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)(?:\\s*장|\\s*편|\\s*:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`);
  const match = text.match(regex);
  if (!match) return null;
  const rawBook = match[1].trim();
  const book = BIBLE_ABBREV_MAP[rawBook] || rawBook;
  const chapter = parseInt(match[2], 10) || 1;
  const startVerse = match[3] ? parseInt(match[3], 10) : 1;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
  return { book, chapter, startVerse, endVerse, raw: match[0].trim() };
}

function extractVerses(text) {
  if (!text) return [];
  const matches = [];
  let match;
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~)\\s*(\\d+))?(?:절)?`, 'g');
  while ((match = regex.exec(text)) !== null) {
    const book = match[1].trim();
    if (BIBLE_ABBREV_MAP[book]) matches.push(match[0].trim().replace(/\s+/g, ' '));
  }
  return [...new Set(matches)];
}

function extractTheologicalTags(text) {
  if (!text) return [];
  const tags = new Set();
  if (text.includes('구원') || text.includes('십자가') || text.includes('보혈') || text.includes('칭의')) tags.add('구원론');
  if (text.includes('주권') || text.includes('섭리') || text.includes('창조')) tags.add('신론');
  if (text.includes('말씀') || text.includes('성경') || text.includes('묵상')) tags.add('말씀론');
  if (text.includes('예수') || text.includes('성육신') || text.includes('부활')) tags.add('기독론');
  if (text.includes('고난') || text.includes('상처') || text.includes('연단')) tags.add('고난의신비');
  if (text.includes('성령') || text.includes('은사') || text.includes('열매')) tags.add('성령론');
  if (text.includes('공동체') || text.includes('목장') || text.includes('지체') || text.includes('예배')) tags.add('교회론');
  if (text.includes('죄') || text.includes('회개') || text.includes('타락') || text.includes('탐심')) tags.add('인간론/회개');
  if (text.includes('가정') || text.includes('부부') || text.includes('자녀')) tags.add('언약가정');
  if (text.includes('기도') || text.includes('간구') || text.includes('주기도문')) tags.add('기도론');
  if (text.includes('직장') || text.includes('재물') || text.includes('헌금') || text.includes('일터')) tags.add('청지기론');
  if (text.includes('전도') || text.includes('영혼') || text.includes('선교') || text.includes('파송')) tags.add('선교/제자도');
  return Array.from(tags);
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// 아이콘 콤포넌트
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconChevronUp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const IconChevronDown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconCopy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconUnlock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconShare = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;

const DISCIPLESHIP_12WEEKS_CURRICULUM = {
  1: {
    title: "구원론 (Soteriology): 칭의와 전가된 의",
    themeKey: "구원론",
    keywords: ['구원', '십자가', '칭의', '의롭다', '전가', '율법', '행위', '은혜', '보혈', '대속'],
    verse: "로마서 3:24-26, 에베소서 2:8-9",
    academicContext: "칭의(Justification)는 도덕적 갱신이 아닌, 그리스도의 완전한 순종이 죄인에게 법정적으로 전가(Imputation)되는 객관적 사건입니다.",
    principle: "복음은 인간의 종교적 열심을 요구하지 않습니다. 오직 그리스도의 대속적 죽음만을 의지하는 훈련을 시작합니다.",
    reportPrompt: "[소논고 작성] 나의 행위가 아닌 '전가된 의'로 믿음의 확신을 얻은 구체적 과정을 신학적으로 진술하시오.",
    coreQuestions: ["구원의 확신을 나의 감정 기복이나 도덕적 성취에서 찾고 있지 않습니까?", "범죄했을 때 절망하기보다 즉시 십자가 은혜로 달려갑니까?"],
  },
  2: {
    title: "신론 (Theology Proper): 하나님의 절대 주권과 섭리",
    themeKey: "신론",
    keywords: ['주권', '섭리', '뜻', '계획', '창조', '합력', '통치', '작정', '전능'],
    verse: "로마서 8:28, 이사야 45:7",
    academicContext: "하나님의 섭리(Providence)는 우연을 배제합니다. 신자의 삶 속 고난과 성취 모두 하나님의 작정 안에 속해 있음을 고백합니다.",
    principle: "해석되지 않는 고난 앞에서도 선하신 통치자 하나님께 순복하는 훈련입니다.",
    reportPrompt: "[소논고 작성] 이해되지 않았던 고난을 '합력하여 선을 이루시는' 하나님의 주권적 섭리의 관점에서 재해석하시오.",
    coreQuestions: ["내 계획이 무너졌을 때 하나님의 선하신 주권으로 해석합니까?", "삶의 통제권이 주님께 있음을 온전히 인정합니까?"],
  },
  3: {
    title: "말씀론 (Bibliology): 계시 의존 사색과 영적 분별",
    themeKey: "말씀론",
    keywords: ['말씀', '성경', '묵상', '큐티', '진리', '계시', '권위', '조명', '영감'],
    verse: "디모데후서 3:16-17, 히브리서 4:12",
    academicContext: "성경의 완전 영감과 무오성을 전제로 본문의 문맥에 기초하여 성령의 조명을 구합니다.",
    principle: "말씀이 나의 숨은 죄와 동기를 찔러 쪼개어 수술하도록 내 삶의 절대 기준으로 세웁니다.",
    reportPrompt: "[소논고 작성] 말씀이 내 내면의 어떤 '숨은 동기'를 찔러 쪼개었는지 분석하여 기술하시오.",
    coreQuestions: ["말씀을 읽을 때 위로의 구절만 편식하지 않습니까?", "세상 가치관보다 기록된 말씀을 최종 권위로 삼습니까?"],
  },
  4: {
    title: "기독론 (Christology): 십자가와 자기 부인",
    themeKey: "기독론",
    keywords: ['예수', '성육신', '부활', '자기부인', '십자가', '내려놓음', '포기', '낮아짐'],
    verse: "갈라디아서 2:20, 빌립보서 2:5-8",
    academicContext: "그리스도의 비하와 성육신을 본받아 오늘 내 삶 속에서 철저한 자기 부인(Kenosis)을 실천합니다.",
    principle: "매일 정욕과 자아를 십자가에 못 박고 오직 내 안에 그리스도가 사시도록 주권을 이양합니다.",
    reportPrompt: "[소논고 작성] 나의 권리나 자존심을 내려놓고 그리스도의 십자가를 본받아 자기를 부인한 사례를 기록하시오.",
    coreQuestions: ["갈등 상황에서 자존심보다 십자가의 낮아지심을 선택합니까?", "오늘 내가 포기해야 할 자아는 무엇입니까?"],
  },
  5: {
    title: "인간론 (Anthropology): 전적 타락과 참된 회개",
    themeKey: "인간론/회개",
    keywords: ['죄', '회개', '타락', '탐심', '교만', '이기심', '돌이킴', '자아', '본성'],
    verse: "시편 51:10-12, 예레미야 17:9",
    academicContext: "인간의 전적 부패를 직면하고 감상적 후회가 아닌 영적 방향의 완전한 전환(Metanoia)을 이룹니다.",
    principle: "갈등의 원인을 남 탓하지 않고, 내 안의 교만과 이기심을 정직히 직면하여 통회합니다.",
    reportPrompt: "[소논고 작성] 상대방을 탓하던 마음을 멈추고 내 안의 죄성을 발견하여 회개한 과정을 진술하시오.",
    coreQuestions: ["문제가 생겼을 때 '내 안의 들보'를 먼저 찾습니까?", "죄의 고리를 끊어낼 구체적 안전장치를 세웠습니까?"],
  },
  6: {
    title: "기도론 (Theology of Prayer): 언약적 기도와 순종",
    themeKey: "기도론",
    keywords: ['기도', '간구', '주기도문', '응답', '부르짖음', '무릎', '기다림'],
    verse: "요한일서 5:14, 마태복음 6:9-10",
    academicContext: "기도는 조물주를 조종하는 수단이 아니라 하나님의 언약적 뜻에 나를 굴복시키는 행위입니다.",
    principle: "육적 필요를 넘어 하나님 나라와 그의 의를 먼저 구하는 영의 기도로 성숙해집니다.",
    reportPrompt: "[소논고 작성] 내 기도의 목록을 '하나님 나라를 구하는 언약적 기도'로 재편성한 결단을 기록하시오.",
    coreQuestions: ["내 뜻을 관철시키려 기도합니까, 주님의 뜻에 순종하려 기도합니까?", "응답의 지연 앞에서도 주님을 신뢰합니까?"],
  },
  7: {
    title: "고난의 신학 (Theologia Crucis): 연단과 성화",
    themeKey: "고난의신비",
    keywords: ['고난', '상처', '연단', '아픔', '눈물', '광야', '인내', '환난', '시련'],
    verse: "베드로전서 4:12-13, 야고보서 1:2-4",
    academicContext: "고난은 저주가 아니라 불순물을 제거하고 거룩함(Sanctification)으로 이끄시는 은혜의 방편입니다.",
    principle: "고난 앞에서 원망을 멈추고 하나님이 나를 빚어가시는 성화의 목적을 묻습니다.",
    reportPrompt: "[소논고 작성] 현재 겪고 있는 고난을 십자가 신학의 관점에서 성화의 도구로 재해석하시오.",
    coreQuestions: ["이해할 수 없는 고난 속에서 나를 거룩하게 하시는 손길을 봅니까?", "십자가의 무게를 정직하게 감당합니까?"],
  },
  8: {
    title: "성령론 (Pneumatology): 내주하심과 거룩한 전쟁",
    themeKey: "성령론",
    keywords: ['성령', '은사', '열매', '충만', '영적 전쟁', '혈기', '전신갑주', '마귀', '사탄'],
    verse: "갈라디아서 5:16-17, 에베소서 6:10-12",
    academicContext: "성령 충만은 전 인격이 성령의 지배를 받는 상태이며 육체의 소욕을 거스르는 거룩한 전투입니다.",
    principle: "혈과 육의 갈등 배후를 영적으로 분별하며 성령의 열매(절제, 온유)로 대적합니다.",
    reportPrompt: "[소논고 작성] 갈등 상황에서 혈기를 죽이고 성령의 열매를 맺은 과정을 기술하시오.",
    coreQuestions: ["분노가 올라올 때 즉시 성령께 통제권을 내어드립니까?", "내 삶이 성령의 열매를 맺고 있습니까?"],
  },
  9: {
    title: "청지기론 (Stewardship): 일터 신학과 소명",
    themeKey: "청지기론",
    keywords: ['직장', '재물', '헌금', '일터', '청지기', '소명', '돈', '성공', '노동'],
    verse: "골로새서 3:23-24, 마태복음 6:24",
    academicContext: "직장과 일터의 노동은 세속적인 것이 아니라 하나님을 예배하는 거룩한 성직(Vocation)입니다.",
    principle: "재능과 재물이 내 것이 아님을 인정하고 하나님 나라를 위해 청지기로 살아갑니다.",
    reportPrompt: "[소논고 작성] 일터를 하나님이 파송하신 사명지로 재인식하며 내린 재정적/시간적 결단을 적으시오.",
    coreQuestions: ["직장을 하나님이 보내신 사역의 현장으로 대합니까?", "재정을 탐심 없이 이웃을 위해 흘려보냅니까?"],
  },
  10: {
    title: "언약 가정 (Covenant Family): 신앙의 전수와 영적 제사장",
    themeKey: "언약가정",
    keywords: ['가정', '부부', '자녀', '언약', '부모', '자식', '결혼', '가족', '배우자'],
    verse: "신명기 6:4-7, 에베소서 5:22-33",
    academicContext: "가정은 하나님이 세우신 최초의 교회이며 신앙 전수의 거룩한 보루입니다.",
    principle: "세속적 성공보다 신앙 전수를 최우선으로 삼고 말씀으로 가정을 인도합니다.",
    reportPrompt: "[소논고 작성] 가정을 '언약적 공동체'로 세우기 위해 결단한 영적 실천 지침을 작성하시오.",
    coreQuestions: ["부부 관계에서 십자가의 희생과 연합을 실천합니까?", "자녀 양육의 최종 목표가 신실한 믿음의 사람입니까?"],
  },
  11: {
    title: "교회론 (Ecclesiology): 유기적 몸과 은사의 섬김",
    themeKey: "교회론",
    keywords: ['공동체', '목장', '지체', '예배', '봉사', '섬김', '교제', '몸', '은사'],
    verse: "고린도전서 12:27, 에베소서 4:15-16",
    academicContext: "교회는 그리스도를 머리로 한 한 몸이며, 은사는 지체를 세우기 위해 주어졌습니다.",
    principle: "소비자 신앙을 버리고 이름 없는 섬김의 자리에서 지체를 세우는 지체로 헌신합니다.",
    reportPrompt: "[소논고 작성] 몸 된 교회를 세우기 위해 내가 감당해야 할 이름 없는 섬김의 자리를 논하시오.",
    coreQuestions: ["보이지 않는 섬김의 자리에서 묵묵히 봉사합니까?", "목장 안에서 상처를 두려워하지 않고 진실히 교제합니까?"],
  },
  12: {
    title: "선교와 제자도 (Missiology): 영적 재생산과 증인의 삶",
    themeKey: "선교/제자도",
    keywords: ['전도', '영혼', '선교', '파송', '제자', '증인', '복음 전파', '태신자', '재생산'],
    verse: "마태복음 28:19-20, 사도행전 1:8",
    academicContext: "제자도의 최종 지향점은 영혼 구원과 또 다른 제자를 세우는 영적 재생산(Multiplication)입니다.",
    principle: "삶의 현장에서 태신자를 품고 기도하며, 복음을 전파하는 증인의 삶으로 파송받습니다.",
    reportPrompt: "[소논고 작성] 내가 품고 기도하는 태신자(VIP)를 향한 전도 전략과 제자 양육의 결단문을 작성하시오.",
    coreQuestions: ["눈물로 복음을 전할 태신자를 마음에 품고 있습니까?", "누군가를 말씀으로 양육하는 영적 부모로 헌신하겠습니까?"],
  }
};

const HighlightedText = ({ text, searchHighlight }) => {
  if (!text) return null;
  if (!searchHighlight) return <>{text}</>;
  const escaped = searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.2 rounded-xs font-bold">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// 본문 및 성경 구절 정밀 파서
const SermonContentParser = ({ text, searchTerm, isDark, onVerseClick, onOpenInterlinear, activeReference }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const baseBook = activeReference?.book || "갈라디아서";
  let activeChapter = activeReference?.chapter || 1;

  return lines.map((line, idx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2"></div>;
    trimmed = trimmed.replace(/#말씀묵상/g, '').trim();
    if (!trimmed) return null;

    const chapInline = trimmed.match(/(?:제\s*)?(\d+)\s*장/);
    if (chapInline && chapInline[1] && trimmed.length < 30) {
      activeChapter = parseInt(chapInline[1], 10);
    }

    if (trimmed.match(/^(적용:|적용 질문|Q\.|질문:|적용 포인트)/) || (trimmed.endsWith('?') && trimmed.length < 90 && !trimmed.match(/^\d+/))) {
      return (
        <div key={idx} className={`my-2.5 p-3 rounded-xl border-l-3 text-left ${isDark ? 'border-amber-500/70 bg-[#161D2B] text-stone-200' : 'border-amber-600 bg-amber-50/70 text-stone-800'}`}>
          <span className="text-[9.5px] font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold block mb-1 uppercase">REFLECTION QUESTION</span>
          <p className="text-[13px] sm:text-[14px] font-serif font-bold leading-relaxed break-keep">
            {trimmed.replace(/^(적용:|적용 질문|Q\.|질문:|적용 포인트)/g, '').trim()}
          </p>
        </div>
      );
    }

    const versePrefixMatch = trimmed.match(/^(\d{1,3})(?:[\.\s]|(?=[가-힣]))(.*)/);
    if (versePrefixMatch && !trimmed.includes('~') && !trimmed.includes(':') && versePrefixMatch[2].length > 10) {
      const vNum = parseInt(versePrefixMatch[1], 10);
      const vContent = versePrefixMatch[2].trim();

      return (
        <div key={idx} className={`my-1.5 p-2.5 rounded-xl border flex items-start justify-between gap-2 text-left transition-all ${
          isDark ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
        }`}>
          <div className="flex items-start gap-2 flex-1">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
              {vNum}절
            </span>
            <p className={`text-[13.5px] sm:text-[14px] font-serif font-medium leading-[1.8] break-keep ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              <HighlightedText text={vContent} searchHighlight={searchTerm} />
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenInterlinear) onOpenInterlinear(baseBook, activeChapter, vNum);
            }}
            className="px-2 py-0.8 rounded-md text-[10.5px] font-semibold border bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
            title="원어 분해 팝업 열기"
          >
            <span>📖</span> 원어
          </button>
        </div>
      );
    }

    const verseMatch = trimmed.match(BIBLE_VERSE_SINGLE_REGEX);
    if (verseMatch && trimmed.length < 80) {
      return (
        <div key={idx} className="my-1.5 text-left flex items-center gap-1.5 flex-wrap">
          <button 
            onClick={() => onVerseClick && onVerseClick(verseMatch[0].trim())}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-serif font-bold transition-all cursor-pointer border ${isDark ? 'bg-white/5 border-white/10 text-stone-200 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-stone-800 hover:bg-slate-200'}`}
          >
            <IconBook /> {trimmed}
          </button>
        </div>
      );
    }

    if (trimmed.match(/^(\d+\.\s*|첫째|둘째|셋째|들어가며|결론)/) || (trimmed.endsWith(':') && trimmed.length < 40)) {
      return (
        <h4 key={idx} className={`mt-4 mb-1.5 text-[14.5px] sm:text-[15.5px] font-serif font-bold tracking-tight text-left flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-stone-900'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
          <HighlightedText text={trimmed} searchHighlight={searchTerm} />
        </h4>
      );
    }

    return (
      <p key={idx} className={`text-[13.5px] sm:text-[14px] leading-[1.9] font-serif font-normal text-left break-keep mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
         <HighlightedText text={trimmed} searchHighlight={searchTerm} />
      </p>
    );
  });
};

const SermonCard = ({ record, searchTerm, onNavigateVerse, setSelectedTag, onVersePopup, onOpenInterlinear, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cleanRawText = decodeHtmlEntities(record.raw_text?.replace(/<[^>]*>?/gm, ''))?.replace(/#말씀묵상/g, '');
  const isLongText = cleanRawText.length > 220;

  const activeReference = useMemo(() => {
    const combined = `${record.title || ''} ${record.mappedVerse || ''} ${cleanRawText?.slice(0, 300) || ''}`;
    const parsed = parseBibleReference(combined);
    if (parsed) {
      return { book: parsed.book, chapter: parsed.chapter, verse: parsed.startVerse };
    }
    const detectedBook = record.detectedBook && record.detectedBook !== '기타 말씀' ? record.detectedBook : '갈라디아서';
    return { book: detectedBook, chapter: 1, verse: 1 };
  }, [record, cleanRawText]);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border text-left transition-all overflow-hidden break-words ${isDark ? 'bg-[#111827] border-[#1f2937] shadow-xs' : 'bg-white border-slate-200/80 shadow-xs'}`}>
      <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200 dark:border-white/10 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-stone-400">
            {record.date}
          </span>
          <button 
            onClick={() => onNavigateVerse && onNavigateVerse(activeReference.book)}
            className="px-2 py-0.5 rounded-md text-[11px] font-serif font-bold text-slate-800 dark:text-stone-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
          >
            {activeReference.book} {activeReference.chapter}장
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => onOpenInterlinear && onOpenInterlinear(activeReference.book, activeReference.chapter, activeReference.verse)}
            className="px-2 py-1 rounded-md text-[10.5px] font-bold border flex items-center gap-1 transition-all cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs"
            title="원어 분해 팝업 열기"
          >
            <span>🔬</span> 원어 연동
          </button>

          <button 
            onClick={() => { 
              navigator.clipboard.writeText(`[${record.date} 예배노트]\n본문: ${activeReference.book} ${activeReference.chapter}장\n제목: ${record.title}\n설교: ${record.preacher}\n\n${cleanRawText}`); 
              alert('설교 전문이 클립보드에 복사되었습니다.'); 
            }} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
            title="클립보드 복사"
          >
            <IconCopy />
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
         <h2 className="text-[16px] sm:text-[17.5px] font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-snug break-keep">
           <HighlightedText text={record.title} searchHighlight={searchTerm} />
         </h2>
         <p className="text-[11.5px] font-medium text-slate-400">
            {record.preacher}
         </p>
      </div>

      <div className="relative mt-2.5">
        <div className={`transition-all duration-300 ${!isExpanded && isLongText ? 'max-h-[160px] overflow-hidden' : ''}`}>
          <SermonContentParser 
            text={cleanRawText} 
            searchTerm={searchTerm} 
            isDark={isDark} 
            onVerseClick={onVersePopup} 
            onOpenInterlinear={onOpenInterlinear}
            activeReference={activeReference}
          />
        </div>
        {!isExpanded && isLongText && (
          <div className={`absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t ${isDark ? 'from-[#111827]' : 'from-white'} to-transparent pointer-events-none`}></div>
        )}
      </div>
      
      {isLongText && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex items-center gap-1 text-[11.5px] font-serif font-bold text-slate-500 hover:text-slate-900 dark:hover:text-stone-200 pt-2 cursor-pointer transition-colors"
        >
          {isExpanded ? <><IconChevronUp /> 내용 접기</> : <><IconChevronDown /> 설교 본문 전체 읽기</>}
        </button>
      )}

      {record.tags && record.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 mt-2 border-t border-dashed border-slate-200 dark:border-white/10">
          {record.tags.filter(tag => tag !== '말씀묵상').map((tag, tIdx) => (
            <button 
              key={tIdx} 
              onClick={() => setSelectedTag && setSelectedTag(tag)} 
              className="text-[10.5px] px-2 py-0.5 rounded font-mono font-medium text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-100 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 원어 성경 인라인 연동 팝업 모달
const InterlinearQuickModal = ({ target, onClose, onJumpStudio, getBibleText, isDark }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const isOT = isOTBook(target.book);
  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const speakWord = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/[\u0591-\u05AF]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = isOT ? 'he-IL' : 'el-GR';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg("");

    const fetchWords = async () => {
      try {
        if (!supabase) throw new Error("Supabase 연결 객체를 찾을 수 없습니다.");
        const { data, error } = await supabase
          .from('interlinear_bible')
          .select('*')
          .eq('book', target.book)
          .eq('chapter', target.chapter)
          .eq('verse', target.verse)
          .order('word_order', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(`${target.book} ${target.chapter}:${target.verse}에 해당하는 원어 분해 데이터가 존재하지 않습니다.`);
        }

        if (isMounted) {
          setWords(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || "원어 데이터를 불러오지 못했습니다.");
          setLoading(false);
        }
      }
    };

    fetchWords();
    return () => { isMounted = false; };
  }, [target]);

  const verseKorean = getBibleText(`${target.book} ${target.chapter}:${target.verse}`) || `${target.book} ${target.chapter}장 ${target.verse}절`;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fade-in select-none">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
        isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="px-4 py-3 border-b flex justify-between items-center shrink-0 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <span className="text-[12px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {isOT ? '구약 히브리어 (BHS)' : '신약 헬라어 (GNT)'}
            </span>
            <h3 className="font-serif font-bold text-[15px] sm:text-[16px]">
              {target.book} {target.chapter}장 {target.verse}절 원어 분해
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <IconX />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto hide-scrollbar space-y-3.5 text-left flex-1">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold text-slate-400 block mb-1 font-mono uppercase">[개역개정 본문]</span>
            <p className="text-[13.5px] sm:text-[14.5px] font-serif leading-[1.8] font-medium break-keep">
              {verseKorean}
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-[13px]">
              ⏳ 히브리어/헬라어 원어 형태소 파싱 중...
            </div>
          ) : errorMsg ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-[12.5px] text-rose-500 font-medium">{errorMsg}</p>
              <button
                type="button"
                onClick={() => onJumpStudio(target.book, target.chapter, target.verse)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer"
              >
                원어 연구실 전체 화면에서 열기 ➔
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-1">
                <span>1:1 형태론 전수 분해 ({words.length}개 어절)</span>
                <span className="font-mono">터치 시 발음 듣기</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" dir={isOT ? 'rtl' : 'ltr'}>
                {words.map((w, wIdx) => (
                  <div
                    key={w.id || wIdx}
                    onClick={() => speakWord(w.original_word)}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200/90 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <div className={isOT ? 'text-right' : 'text-left'}>
                      <div className="flex items-center justify-between gap-1">
                        <span style={originalFontStyle} className="text-[20px] font-bold leading-tight block">
                          {w.original_word}
                        </span>
                        <span className="text-slate-400 p-0.5"><IconVolume /></span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5" dir="ltr">
                        {w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : ''}
                      </span>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1.5"></div>

                    <div className="text-left" dir="ltr">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-[12.5px] text-amber-700 dark:text-amber-300 truncate block">
                          {w.korean_trans || w.gloss || '원어 어휘'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {w.strongs_id}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-stone-400 block truncate mt-0.5">
                        {w.grammar}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t shrink-0 flex items-center justify-between gap-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const nextV = Math.max(1, target.verse - 1);
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, nextV, true), 50);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            >
              ◀ 이전 절
            </button>
            <button
              type="button"
              onClick={() => {
                const nextV = target.verse + 1;
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, nextV, true), 50);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            >
              다음 절 ▶
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onJumpStudio(target.book, target.chapter, target.verse, false);
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <span>🔬</span> 원어 연구실 전체 화면 이동 ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SermonArchiveAnalytics({ onBack, onNavigateVerse, bibles, t, isDarkMode, dailyData = {}, updateDay, setActiveScreen }) {
  const [sermonData, setSermonData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [filterMonth, setFilterMonth] = useState(""); 
  
  // 🌟 연도 선택 상태 (기본 2026)
  const [selectedYear, setSelectedYear] = useState("2026");
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isSecretMode, setIsSecretMode] = useState(false);

  const [sermonPopup, setSermonPopup] = useState(null);
  const [popupVerse, setPopupVerse] = useState(null);
  const [popupVerseText, setPopupVerseText] = useState("");
  const [interlinearTarget, setInterlinearTarget] = useState(null);

  // 주차 클릭 상세 팝업 상태 { weekNum, dateRange, sermons }
  const [weekDetailModal, setWeekDetailModal] = useState(null);

  const [reportData, setReportData] = useState(() => {
    try {
      const saved = localStorage.getItem('goodtree_report_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const handleSaveReport = (week, text) => {
    const newData = { ...reportData, [week]: text };
    setReportData(newData);
    try { localStorage.setItem('goodtree_report_data_v2', JSON.stringify(newData)); } catch {}
  };

  const toggleAction = useCallback((sermonDate, qIdx) => {
    if (!updateDay) return;
    const dayData = (dailyData && dailyData[sermonDate]) || {};
    const completed = dayData.completedActions || [];
    const newCompleted = completed.includes(qIdx) 
      ? completed.filter(i => i !== qIdx) 
      : [...completed, qIdx];
    updateDay(sermonDate, { ...dayData, completedActions: newCompleted });
  }, [dailyData, updateDay]);

  const handleSaveActionMemo = useCallback((sermonDate, qIdx, memoText) => {
    if (!updateDay) return;
    const dayData = (dailyData && dailyData[sermonDate]) || {};
    const actionMemos = dayData.actionMemos || {};
    updateDay(sermonDate, { ...dayData, actionMemos: { ...actionMemos, [qIdx]: memoText } });
  }, [dailyData, updateDay]);

  const isDark = isDarkMode;

  const handleJumpToInterlinear = useCallback((book, chapter, verse, reopenPopup = false) => {
    const cleanBook = BIBLE_ABBREV_MAP[book] || book || '갈라디아서';
    const cNum = Number(chapter) || 1;
    const vNum = Number(verse) || 1;

    try {
      localStorage.setItem('interlinear_jump', JSON.stringify({
        book: cleanBook,
        chapter: cNum,
        verse: vNum
      }));
    } catch (_) {}

    if (reopenPopup) {
      setInterlinearTarget({ book: cleanBook, chapter: cNum, verse: vNum });
      return;
    }

    if (typeof setActiveScreen === 'function') {
      setActiveScreen('interlinear');
    } else if (typeof onNavigateVerse === 'function') {
      onNavigateVerse(`${cleanBook} ${cNum}:${vNum}`);
    } else {
      window.dispatchEvent(new CustomEvent('NAVIGATE_INTERLINEAR', { detail: { book: cleanBook, chapter: cNum, verse: vNum } }));
    }
  }, [setActiveScreen, onNavigateVerse]);

  const handleOpenInterlinearModal = useCallback((book, chapter, verse) => {
    const cleanBook = BIBLE_ABBREV_MAP[book] || book || '갈라디아서';
    const cNum = Number(chapter) || 1;
    const vNum = Number(verse) || 1;
    setInterlinearTarget({ book: cleanBook, chapter: cNum, verse: vNum });
  }, []);

  const getBibleTextLocal = useCallback((verseQuery) => {
    if (!bibles) return "성경 데이터를 찾을 수 없습니다.";
    if (!verseQuery) return "";
    const parsed = parseBibleReference(verseQuery);
    if (!parsed) return `구절 형식을 해석할 수 없습니다: ${verseQuery}`;
    
    const { book, chapter, startVerse, endVerse } = parsed;
    const list = Array.isArray(bibles) ? bibles : [];
    const targetBook = list.find(b => b?.name === book || b?.name === BIBLE_ABBREV_MAP[book]) || list[BIBLE_BOOKS_ORDER.indexOf(book)];
    
    if (!targetBook || !targetBook.chapters) return `${book} 본문을 불러올 수 없습니다.`;
    const chapterData = targetBook.chapters[chapter - 1]; 
    if (!chapterData) return `${book} ${chapter}장을 찾을 수 없습니다.`;

    let results = [];
    for (let v = startVerse; v <= endVerse; v++) {
      const verseData = chapterData[v - 1];
      if (verseData) {
        const rawText = typeof verseData === 'string' ? verseData : (verseData.text || verseData.content || JSON.stringify(verseData));
        const clean = decodeHtmlEntities(rawText);
        results.push(`${v}. ${clean}`);
      }
    }
    return results.join("\n\n");
  }, [bibles]);

  useEffect(() => {
    let isMounted = true;
    fetch("/sermon_summary.json")
      .then(res => res.json())
      .then(data => { if (isMounted) { setSermonData(data); setLoading(false); } })
      .catch(err => { if (isMounted) { console.error("데이터 로드 실패:", err); setLoading(false); } });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (popupVerse) {
      setPopupVerseText(getBibleTextLocal(popupVerse));
    } else {
      setPopupVerseText("");
    }
  }, [popupVerse, getBibleTextLocal]);

  // 💡 [핵심] 설교 데이터 날짜 정밀 정규화 및 주차 인덱싱
  const enrichedSermonRecords = useMemo(() => {
    if (!sermonData) return [];
    let rawList = [];
    if (Array.isArray(sermonData)) rawList = sermonData;
    else if (sermonData.sermons && Array.isArray(sermonData.sermons)) rawList = sermonData.sermons;
    else if (sermonData.index) Object.keys(sermonData.index).forEach(verse => (sermonData.index[verse] || []).forEach(rec => rawList.push(rec)));

    const parsed = rawList.map((rec, index) => {
      const raw = (rec.raw_text || (rec.paragraphs ? rec.paragraphs.join("\n") : "") || JSON.stringify(rec)).replace(/#말씀묵상/g, '');
      const title = rec.title || rec.filename || `설교 ${index + 1}`;

      let detectedBook = "기타 말씀";
      const parsedRef = parseBibleReference(`${title} ${raw.slice(0, 200)}`);
      if (parsedRef) {
        detectedBook = parsedRef.book;
      }

      let tags = (rec.tags && rec.tags.length > 0 ? rec.tags : ["말씀묵상"]).filter(t => t !== '말씀묵상');

      // 날짜 정밀 추출
      const date = extractStandardDate(rec, title, raw);
      const timestamp = new Date(date).getTime() || 0;
      const year = date.split('-')[0] || "2026";
      const weekNum = getWeekNumber(date) || 1;

      const dayData = (dailyData && dailyData[date]) || {};
      const userQuestions = dayData.applyQuestions || [];
      const jsonQuestions = (raw.match(/(?:적용:|적용 질문:|Q\.|질문:|적용 포인트).*?(?=\n|$)/g) || []).map(q => q.replace(/^(적용:|적용 질문:|Q\.|질문:|적용 포인트)\s*/, '').trim());
      const mergedQuestions = Array.from(new Set([...userQuestions, ...jsonQuestions])).filter(q => q.length > 0);

      const citedVerses = extractVerses(raw);
      const theoTags = extractTheologicalTags(raw);

      return {
        ...rec, 
        title, 
        date, 
        year,
        weekNum,
        preacher: rec.preacher || "담임목사",
        mappedVerse: rec.mappedVerse || detectedBook, 
        detectedBook, 
        tags, 
        raw_text: raw, 
        timestamp,
        questions: jsonQuestions,
        applyQuestions: mergedQuestions || [],
        completedActions: dayData.completedActions || [],
        actionMemos: dayData.actionMemos || {},
        theoTags: theoTags.length > 0 ? theoTags : tags,
        citedVerses
      };
    });

    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  }, [sermonData, dailyData]);

  // 가용 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = new Set(enrichedSermonRecords.map(r => r.year).filter(y => y && y.length === 4));
    if (years.size === 0) years.add("2026");
    return Array.from(years).sort().reverse();
  }, [enrichedSermonRecords]);

  // 선택된 연도의 설교만 필터
  const yearFilteredRecords = useMemo(() => {
    return enrichedSermonRecords.filter(r => r.year === selectedYear);
  }, [enrichedSermonRecords, selectedYear]);

  // 💡 [대변혁] 52주 연간 텔레메트리 주차별 실측 매트릭스 엔진
  const { weekMatrix, quarterlyAnalytics } = useMemo(() => {
    const sermonsByWeek = new Map();
    yearFilteredRecords.forEach(s => {
      const w = s.weekNum;
      if (!sermonsByWeek.has(w)) sermonsByWeek.set(w, []);
      sermonsByWeek.get(w).push(s);
    });

    // 1~52주 매트릭스 타일 배열
    const matrix = Array.from({ length: 52 }, (_, i) => {
      const weekNum = i + 1;
      const dateRange = getWeekDateRange(selectedYear, weekNum);
      const sermons = sermonsByWeek.get(weekNum) || [];
      const quarter = Math.ceil(weekNum / 13);
      return {
        weekNum,
        quarter,
        dateRange,
        sermons,
        hasSermon: sermons.length > 0,
        count: sermons.length,
        primaryBook: sermons[0]?.detectedBook || null
      };
    });

    // 분기별(Q1~Q4) 디테일 분리 분석
    const quarters = [1, 2, 3, 4].map(q => {
      const qWeeks = matrix.filter(w => w.quarter === q);
      const qSermons = qWeeks.flatMap(w => w.sermons);
      const qBooks = new Map();
      const qThemes = new Map();
      let qOT = 0, qNT = 0;

      qSermons.forEach(s => {
        qBooks.set(s.detectedBook, (qBooks.get(s.detectedBook) || 0) + 1);
        if (isOTBook(s.detectedBook)) qOT++; else qNT++;
        (s.theoTags || []).forEach(t => qThemes.set(t, (qThemes.get(t) || 0) + 1));
      });

      const topBooks = Array.from(qBooks.entries()).sort((a, b) => b[1] - a[1]);
      const topThemes = Array.from(qThemes.entries()).sort((a, b) => b[1] - a[1]);
      const totalS = qSermons.length;
      const activeWeeks = qWeeks.filter(w => w.hasSermon).length;

      return {
        quarter: q,
        name: `${q}분기 (${(q - 1) * 3 + 1}월 ~ ${q * 3}월)`,
        weeksLabel: `${(q - 1) * 13 + 1}W ~ ${q * 13}W`,
        totalSermons: totalS,
        activeWeeks,
        occupancyRate: Math.round((activeWeeks / 13) * 100),
        otCount: qOT,
        ntCount: qNT,
        otRate: totalS > 0 ? Math.round((qOT / totalS) * 100) : 0,
        ntRate: totalS > 0 ? Math.round((qNT / totalS) * 100) : 0,
        topBook: topBooks[0]?.[0] || '미정',
        topBookCount: topBooks[0]?.[1] || 0,
        topTheme: topThemes[0]?.[0] || '미정',
        topBooksList: topBooks.slice(0, 3)
      };
    });

    return { weekMatrix: matrix, quarterlyAnalytics: quarters };
  }, [yearFilteredRecords, selectedYear]);

  // 연간 종합 통계 엔진 (선택 연도 기준)
  const { 
    bookList, tagList, citedVerseStats, stats, 
    trainingStats, aggregateHub, theologicalStats, 
    canonCoverage, canonGroupStats, spiritualHealthScore,
    monthlyPulseStats, annualDiscourseTelemetry 
  } = useMemo(() => {
    const books = new Set(), tags = new Set(), citedVerses = new Map();
    let otCount = 0, ntCount = 0;
    let word = 0, prayer = 0, fellowship = 0, ministry = 0, worship = 0;
    let totalQ = 0, completedQ = 0;

    const canonGroupCounts = {
      "모세오경": 0, "역사서": 0, "시가서": 0, "예언서": 0,
      "복음/역사": 0, "바울서신": 0, "공동서신/계시록": 0
    };

    const monthlyPulse = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sermonCount: 0,
      verseCitations: 0,
      totalLength: 0
    }));

    const themeCounts = {};

    yearFilteredRecords.forEach(rec => {
      const book = rec.detectedBook || "기타";
      if (book !== '기타 말씀') {
        books.add(book);
        const grp = getCanonGroup(book);
        if (canonGroupCounts[grp] !== undefined) canonGroupCounts[grp]++;
      }
      if (Array.isArray(rec.tags)) rec.tags.forEach(t => { if (t !== '말씀묵상') tags.add(t); });
      if (Array.isArray(rec.citedVerses)) rec.citedVerses.forEach(v => citedVerses.set(v, (citedVerses.get(v) || 0) + 1));
      if (Array.isArray(rec.theoTags)) {
        rec.theoTags.forEach(t => { themeCounts[t] = (themeCounts[t] || 0) + 1; });
      }

      if (isOTBook(book)) otCount++; else ntCount++;

      const m = parseInt(rec.date.split('-')[1], 10);
      if (m >= 1 && m <= 12) {
        monthlyPulse[m - 1].sermonCount++;
        monthlyPulse[m - 1].verseCitations += (rec.citedVerses?.length || 0);
        monthlyPulse[m - 1].totalLength += (rec.raw_text?.length || 0);
      }

      const qCount = rec.applyQuestions.length;
      const cCount = rec.completedActions.length;
      totalQ += qCount;
      completedQ += cCount;

      if (rec.raw_text?.length > 50) word += 5;
      if (qCount > 0) prayer += 10;
      if (rec.theoTags.includes('교회론') || rec.theoTags.includes('언약가정')) fellowship += 15;
      if (rec.title?.includes('예배') || rec.title?.includes('주일')) worship += 10;
      ministry += (cCount * 5);
    });

    const totalTestament = otCount + ntCount || 1;
    const otPercent = Math.round((otCount / totalTestament) * 100);
    const ntPercent = Math.round((ntCount / totalTestament) * 100);

    const sortedCitedVerses = Array.from(citedVerses.entries()).sort((a, b) => b[1] - a[1]); 
    const normalize = (val) => Math.min(Math.max(val, 5), 100);
    const currentWeek = Math.min(Math.floor((completedQ) / 4) + 1, 12);
    const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const canonCoverage = Math.min(100, Math.round((books.size / 66) * 100));

    const actionRate = totalQ === 0 ? 0 : Math.round((completedQ / totalQ) * 100);
    const balancePenalty = Math.abs(50 - ntPercent) * 0.4;
    const spiritualHealthScore = Math.min(100, Math.max(30, Math.round((canonCoverage * 0.4) + (actionRate * 0.4) + 20 - balancePenalty)));

    const canonTotal = Object.values(canonGroupCounts).reduce((a, b) => a + b, 0) || 1;
    const canonGroupStats = Object.entries(canonGroupCounts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / canonTotal) * 100)
    })).sort((a, b) => b.count - a.count);

    const sortedBooks = Array.from(books).sort();
    const sortedTags = Array.from(tags).sort();

    return { 
      bookList: sortedBooks, 
      tagList: sortedTags, 
      citedVerseStats: sortedCitedVerses, 
      stats: { otPercent, ntPercent },
      trainingStats: {
        word: normalize(word), prayer: normalize(prayer), fellowship: normalize(fellowship),
        ministry: normalize(ministry), worship: normalize(worship),
        totalQ, completedQ, 
        completionRate: actionRate,
        currentWeek
      },
      aggregateHub: { sermonCount: yearFilteredRecords.length },
      theologicalStats: sortedThemes,
      canonCoverage,
      canonGroupStats,
      spiritualHealthScore,
      monthlyPulseStats: monthlyPulse,
      annualDiscourseTelemetry: {
        totalVersesCited: sortedCitedVerses.reduce((acc, cur) => acc + cur[1], 0),
        topBook: sortedBooks[0] || '갈라디아서',
        topTheme: sortedThemes[0]?.[0] || '구원론'
      }
    };
  }, [yearFilteredRecords]);

  const currentWeekCurriculum = DISCIPLESHIP_12WEEKS_CURRICULUM[selectedWeek] || DISCIPLESHIP_12WEEKS_CURRICULUM[1];
  
  const matchedSermonReferences = useMemo(() => {
    const scored = enrichedSermonRecords.map(r => {
      let score = 0;
      let matchedKws = [];
      
      if (r.theoTags && r.theoTags.includes(currentWeekCurriculum.themeKey)) {
        score += 100;
        matchedKws.push(`#${currentWeekCurriculum.themeKey}`);
      }

      if (currentWeekCurriculum.keywords) {
        currentWeekCurriculum.keywords.forEach(kw => {
          if (r.title && r.title.includes(kw)) {
            score += 30;
            if (!matchedKws.includes(kw)) matchedKws.push(kw);
          }
          if (r.raw_text) {
             const regex = new RegExp(kw, 'gi');
             const matches = r.raw_text.match(regex);
             if (matches) {
               score += (matches.length * 3); 
               if (!matchedKws.includes(kw)) matchedKws.push(kw);
             }
          }
        });
      }
      return { 
        ...r, 
        relevanceScore: score, 
        matchedKws: matchedKws.slice(0, 3)
      }; 
    });

    return scored
      .filter(r => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore || b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [enrichedSermonRecords, currentWeekCurriculum]);

  const filteredRecords = useMemo(() => {
    return enrichedSermonRecords.filter(rec => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || rec.title?.toLowerCase().includes(term) || rec.preacher?.toLowerCase().includes(term) || rec.date?.includes(term) || rec.detectedBook?.toLowerCase().includes(term) || rec.raw_text?.toLowerCase().includes(term);
      const matchesBook = selectedBook === 'all' || rec.detectedBook === selectedBook;
      const matchesTag = selectedTag === 'all' || (Array.isArray(rec.tags) && rec.tags.includes(selectedTag));
      const matchesDate = !filterMonth || rec.date.startsWith(filterMonth);
      return matchesSearch && matchesBook && matchesTag && matchesDate;
    }).sort((a, b) => b.timestamp - a.timestamp); 
  }, [enrichedSermonRecords, searchTerm, selectedBook, selectedTag, filterMonth]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full text-[13px] font-mono ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
        성경 주석 및 설교 데이터 인덱싱 중...
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto overflow-hidden font-sans select-none ${isDark ? 'bg-[#0b0f19] text-gray-100' : 'bg-[#f8fafc] text-slate-900'} w-full`}>
      
      {/* 1. 상단 글로벌 헤더 바 */}
      <header className={`px-3 sm:px-6 py-3 flex items-center justify-between border-b shrink-0 z-20 ${isDark ? 'border-[#1f2937] bg-[#111827]/90 text-white' : 'border-slate-200 bg-white/95 text-slate-900'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
            <IconArrowLeft />
          </button>
          <div className="flex flex-col text-left">
            <h1 className="text-[16px] sm:text-[17.5px] font-bold tracking-tight flex items-center gap-2">
              설교 심층 담론 관제 센터 <span className="text-sky-500 dark:text-sky-400 text-xs font-mono font-semibold">[Hermeneutics Telemetry]</span>
            </h1>
            <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">EXECUTIVE SERMON DISCOURSE ANALYTICS & PATTERN MATRIX</span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className={`flex p-1 rounded-lg border text-[11.5px] font-bold ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? (isDark ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'bg-slate-900 text-white shadow-xs font-extrabold') 
                : (isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            연간 분석 대시보드
          </button>
          <button 
            onClick={() => setActiveTab('training')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'training' 
                ? (isDark ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'bg-slate-900 text-white shadow-xs font-extrabold') 
                : (isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            제자훈련소
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'list' 
                ? (isDark ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'bg-slate-900 text-white shadow-xs font-extrabold') 
                : (isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            설교 검색
          </button>
        </div>
      </header>

      {/* 2. 메인 뷰포트 */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-3 sm:px-6 py-4 pb-28 w-full max-w-7xl mx-auto space-y-4">
        
        {/* ========================================================================= */}
        {/* TAB 1: 연간 분석 대시보드 (관제센터 메인 스타일 고도화)                   */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fade-in w-full text-left">
            
            {/* 0. 연도 셀렉터 컨트롤 바 */}
            <div className={`p-3 rounded-xl border flex justify-between items-center ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-2xs'}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-gray-200">연간 분석 기준 연도</span>
              </div>
              <div className="flex gap-1">
                {availableYears.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedYear === y 
                        ? (isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white')
                        : (isDark ? 'bg-slate-800 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    {y}년도
                  </button>
                ))}
              </div>
            </div>

            {/* 1. 관제 벤토 인디케이터 그리드 (4대 핵심 KPI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* 카드 1. 담론 건전성 종합 지수 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400 uppercase tracking-widest">DISCOURSE HEALTH</span>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-bold font-mono ${spiritualHealthScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                      {spiritualHealthScore >= 80 ? 'EXCELLENT' : 'BALANCED'}
                    </span>
                  </div>
                  <h3 className="text-[13.5px] font-bold text-slate-700 dark:text-gray-300 mt-1">영적 담론 건전성 지수</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-[32px] font-mono font-black ${spiritualHealthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {spiritualHealthScore}
                    </span>
                    <span className="text-[13px] font-bold text-slate-400 dark:text-gray-500 font-mono">/ 100 pts</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                  <span>캐논 범위 & 실천 전환 가중치</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">안정적 선포</span>
                </div>
              </div>

              {/* 카드 2. 성경 66권 캐논 커버리지 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400 uppercase tracking-widest">CANON DENSITY</span>
                    <span className="text-[10.5px] font-mono text-sky-600 dark:text-sky-400 font-bold">{bookList.length} / 66 Books</span>
                  </div>
                  <h3 className="text-[13.5px] font-bold text-slate-700 dark:text-gray-300 mt-1">{selectedYear} 강해 커버리지</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-[32px] font-mono font-black text-sky-600 dark:text-sky-400">{canonCoverage}</span>
                    <span className="text-[13px] font-bold text-slate-400 dark:text-gray-500 font-mono">%</span>
                  </div>
                </div>
                <div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-sky-500 h-full transition-all duration-700" style={{ width: `${canonCoverage}%` }}></div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                    <span>주력 선포 권역:</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200">{annualDiscourseTelemetry.topBook}</span>
                  </div>
                </div>
              </div>

              {/* 카드 3. 신구약 구속사 밸런스 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400 uppercase tracking-widest">TESTAMENT RATIO</span>
                    <span className="text-[10.5px] font-mono text-purple-600 dark:text-purple-400 font-bold">OT : NT Balance</span>
                  </div>
                  <h3 className="text-[13.5px] font-bold text-slate-700 dark:text-gray-300 mt-1">신구약 말씀 대조 비중</h3>
                  <div className="flex justify-between items-baseline mt-2 font-mono">
                    <span className="text-[20px] font-black text-amber-600 dark:text-amber-300">구약 {stats.otPercent}%</span>
                    <span className="text-[20px] font-black text-purple-600 dark:text-purple-400">신약 {stats.ntPercent}%</span>
                  </div>
                </div>
                <div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex mt-2">
                    <div className="bg-amber-500 h-full" style={{ width: `${stats.otPercent}%` }}></div>
                    <div className="bg-purple-500 h-full" style={{ width: `${stats.ntPercent}%` }}></div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                    <span>언약의 연속성 대조</span>
                    <span className="font-mono text-purple-600 dark:text-purple-300 font-bold">복음 중심 밸런스</span>
                  </div>
                </div>
              </div>

              {/* 카드 4. 제자도 실천 완수율 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400 uppercase tracking-widest">ACTION CONVERSION</span>
                    <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{trainingStats.completedQ} / {trainingStats.totalQ} Done</span>
                  </div>
                  <h3 className="text-[13.5px] font-bold text-slate-700 dark:text-gray-300 mt-1">설교 적용 실천 완수율</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-[32px] font-mono font-black text-emerald-600 dark:text-emerald-400">{trainingStats.completionRate}</span>
                    <span className="text-[13px] font-bold text-slate-400 dark:text-gray-500 font-mono">%</span>
                  </div>
                </div>
                <div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${trainingStats.completionRate}%` }}></div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                    <span>적용 질문 실천 이행</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-300">능동적 순종</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 2. 💡 [핵심] 실제 날짜 기반 52주 연간 설교 텔레메트리 히트맵 매트릭스 */}
            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
              <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> {selectedYear}년 52주 연간 설교 텔레메트리 히트맵 매트릭스
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                    실제 선포 일자 기준 1~52주 배치 밀도 및 분기별(Q1~Q4) 담론 연속성 (주차 타일 클릭 시 해당 주간 설교 전문 팝업)
                  </p>
                </div>
                
                {/* 쿼터 범례 */}
                <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span> 선포 주간</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800"></span> 대기 주간</span>
                </div>
              </div>

              {/* 52주 분기별 그리드 (13열 인라인 고정) */}
              <div className="pt-3.5 space-y-3">
                {[
                  { quarter: 1, range: [1, 13], label: "1분기 (1W ~ 13W)" },
                  { quarter: 2, range: [14, 26], label: "2분기 (14W ~ 26W)" },
                  { quarter: 3, range: [27, 39], label: "3분기 (27W ~ 39W)" },
                  { quarter: 4, range: [40, 52], label: "4분기 (40W ~ 52W)" }
                ].map(({ quarter, range, label }) => (
                  <div key={quarter} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 w-28 shrink-0">{label}</span>
                    
                    <div 
                      className="flex-1 w-full"
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', 
                        gap: '6px' 
                      }}
                    >
                      {Array.from({ length: 13 }, (_, idx) => {
                        const weekNum = range[0] + idx;
                        const tileData = weekMatrix[weekNum - 1];
                        const hasSermon = tileData && tileData.hasSermon;

                        return (
                          <button
                            key={weekNum}
                            type="button"
                            onClick={() => {
                              if (hasSermon) {
                                setWeekDetailModal(tileData);
                              }
                            }}
                            className={`p-1 sm:p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[46px] select-none ${
                              hasSermon
                                ? (isDark
                                    ? 'bg-sky-950/40 hover:bg-sky-900/60 border-sky-800 hover:border-sky-400 text-sky-300'
                                    : 'bg-sky-50/80 hover:bg-sky-100 border-sky-200 hover:border-sky-400 text-sky-800 shadow-2xs')
                                : (isDark
                                    ? 'bg-slate-900/40 border-slate-800/60 opacity-30 text-gray-600'
                                    : 'bg-slate-100 border-slate-200/60 opacity-40 text-slate-400')
                            }`}
                            title={hasSermon 
                              ? `${weekNum}주차 [${tileData.dateRange}]: ${tileData.sermons.map(s => s.title).join(', ')}`
                              : `${weekNum}주차 [${tileData?.dateRange}]: 대기 주간`}
                          >
                            <span className="text-[9px] font-mono font-bold opacity-60">{weekNum}W</span>
                            <span className="text-[10.5px] font-bold truncate max-w-full">
                              {hasSermon ? (tileData.primaryBook.slice(0, 2) + (tileData.count > 1 ? `(${tileData.count})` : '')) : '-'}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${hasSermon ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 💡 [신규 고도화] 분기별(Q1~Q4) 디테일 분리 분석 벤토 패널 */}
            <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {selectedYear}년 분기별(Q1~Q4) 디테일 분류 및 분리 분석
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                  각 분기별 선포 강도, 주간 강해 가동률, 주력 강해 성경 및 신구약 선포 비율 분리 비교
                </p>
              </div>

              <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {quarterlyAnalytics.map(q => (
                  <div 
                    key={q.quarter}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">{q.weeksLabel}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          q.totalSermons > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {q.activeWeeks}주 가동
                        </span>
                      </div>
                      
                      <h4 className="text-[14px] font-bold text-slate-900 dark:text-white mt-1">{q.name}</h4>

                      <div className="mt-2.5 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-gray-400">선포 설교 수:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-gray-200">{q.totalSermons}편</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-gray-400">주력 강해 성경:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">{q.topBook} ({q.topBookCount}회)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-gray-400">핵심 신학 테마:</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">#{q.topTheme}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between text-[10.5px] font-mono font-medium mb-1">
                        <span className="text-amber-600">구약 {q.otRate}%</span>
                        <span className="text-purple-600">신약 {q.ntRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: `${q.otRate}%` }}></div>
                        <div className="bg-purple-500 h-full" style={{ width: `${q.ntRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 2열 정밀 분석: 성경 7대 문맥 스펙트럼 & 12개월 월별 펄스 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span> 성경 7대 문맥 분류군 스펙트럼
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">CANON DISTRIBUTION</span>
                  </div>

                  <div className="pt-3 space-y-2">
                    {canonGroupStats.map((grp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-700 dark:text-gray-300 font-bold">{grp.name}</span>
                          <span className="font-mono text-slate-400 dark:text-gray-400">{grp.count}편 ({grp.pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${
                              idx === 0 ? 'bg-sky-500' : idx === 1 ? 'bg-purple-500' : idx === 2 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${grp.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                  <span>최다 선포 문맥군:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">{canonGroupStats[0]?.name} ({canonGroupStats[0]?.pct}%)</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> {selectedYear}년 월별 선포 펄스 추이
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">1월 ~ 12월 텔레메트리</span>
                  </div>

                  <div className="pt-4 grid grid-cols-12 gap-1.5 items-end h-36">
                    {monthlyPulseStats.map((item) => {
                      const maxVal = Math.max(...monthlyPulseStats.map(m => m.sermonCount), 1);
                      const heightPct = Math.max(15, Math.round((item.sermonCount / maxVal) * 100));

                      return (
                        <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[9px] font-mono text-slate-400 dark:text-gray-400 font-bold">{item.sermonCount > 0 ? item.sermonCount : ''}</span>
                          <div 
                            className={`w-full rounded-t transition-all ${
                              item.sermonCount > 0 
                                ? 'bg-amber-500 hover:bg-amber-400' 
                                : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                            style={{ height: `${heightPct}%` }}
                            title={`${item.month}월: 설교 ${item.sermonCount}편, 구절 인용 ${item.verseCitations}회`}
                          ></div>
                          <span className="text-[9.5px] font-mono text-slate-400 dark:text-gray-400">{item.month}M</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-gray-400 flex justify-between items-center">
                  <span>총 구절 인용 합계:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{annualDiscourseTelemetry.totalVersesCited}회 성경 본문 인용</span>
                </div>
              </div>

            </div>

            {/* 5. 하단 2열: 핵심 신학 테마 분포 & 최다 인용 구절 클라우드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 핵심 구속사 신학 테마 분포
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">TOP 6 THEOLOGY</span>
                </div>

                <div className="pt-3 space-y-2">
                  {theologicalStats.map(([theme, count], idx) => {
                    const maxVal = theologicalStats[0][1] || 1;
                    const pct = Math.round((count / maxVal) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-700 dark:text-gray-300 font-bold">#{theme}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{count}회</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> 최다 인용 핵심 구절 텔레메트리
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">TOP SCRIPTURES</span>
                </div>

                <div className="pt-3 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                  {citedVerseStats.slice(0, 18).map(([verse, count], idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSearchTerm(verse); setActiveTab('list'); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isDark 
                          ? 'border-slate-700 bg-slate-800/80 hover:bg-sky-900/40 hover:border-sky-400 text-gray-200' 
                          : 'border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700'
                      }`}
                    >
                      <span>{verse}</span>
                      <span className="font-mono text-sky-600 dark:text-sky-400 font-bold text-[9.5px]">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: 제자 양육 훈련소 */}
        {activeTab === 'training' && (
          <div className="flex flex-col lg:flex-row gap-3 w-full">
            <div className={`w-full lg:w-72 xl:w-80 p-3.5 sm:p-4 rounded-xl border flex flex-col gap-4 shrink-0 text-left ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">제자훈련 지표</span>
                <button 
                  onClick={() => setIsSecretMode(!isSecretMode)} 
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {isSecretMode ? <IconLock /> : <IconUnlock />} {isSecretMode ? '보안 모드' : '일반 모드'}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-gray-400">
                  <span>12주차 마스터 코스</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono">{selectedWeek}주차 선택됨</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeek(w)}
                      className={`py-1.5 rounded-md text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        selectedWeek === w 
                          ? (isDark ? 'bg-blue-600 text-white border-transparent shadow-xs' : 'bg-slate-900 text-white border-transparent shadow-xs') 
                          : (isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-gray-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700')
                      }`}
                    >
                      {w}주
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 block">영적 성장 5대 밸런스</span>
                <div className="space-y-1.5">
                  {[
                    { label: '말씀 (Word)', val: trainingStats.word },
                    { label: '기도 (Prayer)', val: trainingStats.prayer },
                    { label: '예배 (Worship)', val: trainingStats.worship },
                    { label: '교제 (Fellowship)', val: trainingStats.fellowship },
                    { label: '사역 (Ministry)', val: trainingStats.ministry }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[10.5px] font-medium">
                        <span className="text-slate-700 dark:text-gray-300">{item.label}</span>
                        <span className="font-mono text-slate-400 dark:text-gray-400">{item.val}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500" style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`flex-1 p-3.5 sm:p-5 rounded-xl border flex flex-col gap-4 text-left ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
              <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  DISCIPLESHIP WEEK {selectedWeek} · #{currentWeekCurriculum.themeKey}
                </span>
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                  {currentWeekCurriculum.title}
                </h2>
                <p className="text-[12.5px] font-bold text-slate-600 dark:text-gray-300">
                  📖 {currentWeekCurriculum.verse}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-lg border space-y-1 ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACADEMIC CONTEXT</span>
                  <p className="text-[12px] leading-relaxed text-slate-700 dark:text-gray-300">{currentWeekCurriculum.academicContext}</p>
                </div>
                <div className={`p-3 rounded-lg border space-y-1 ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">PRACTICE PRINCIPLE</span>
                  <p className="text-[12px] font-bold leading-relaxed text-slate-800 dark:text-gray-200">{currentWeekCurriculum.principle}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[11.5px] font-bold text-slate-500 dark:text-gray-400">주차별 심층 신학 논고</span>
                  <span className="text-[10px] font-mono text-slate-400">자동 저장</span>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-gray-400">{currentWeekCurriculum.reportPrompt}</p>
                <textarea
                  rows={4}
                  value={reportData[selectedWeek] || ""}
                  onChange={(e) => handleSaveReport(selectedWeek, e.target.value)}
                  placeholder="십자가의 은혜와 말씀에 근거하여 삶의 해석을 정직히 기록하세요..."
                  className={`w-full p-3 text-[12.5px] leading-relaxed rounded-xl border outline-none resize-none transition-all ${
                    isDark 
                      ? 'bg-black/40 border-slate-700 text-white placeholder-gray-600 focus:border-sky-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                  } ${isSecretMode ? 'blur-xs hover:blur-none transition-all' : ''}`}
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">연계된 설교 말씀 실천 일지</span>
                  <span className="text-[10.5px] font-mono text-slate-400">총 {matchedSermonReferences.length}편 매칭</span>
                </div>

                {matchedSermonReferences.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    현재 주차 테마와 직접 매칭된 설교가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchedSermonReferences.map((sermon, sIdx) => (
                      <div key={sIdx} className={`p-3 rounded-xl border space-y-2 ${isDark ? 'border-slate-700/60 bg-slate-900/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-400">{sermon.date}</span>
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{sermon.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setSermonPopup(sermon)} className={`px-2 py-0.5 rounded text-[10.5px] font-bold border cursor-pointer ${isDark ? 'border-slate-700 bg-slate-800 text-gray-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-slate-950'}`}>
                              원문 보기
                            </button>
                            <button onClick={() => {
                              const shareText = `[제자훈련 ${selectedWeek}주차 나눔]\n설교: ${sermon.title}\n적용 과제:\n` + (sermon.applyQuestions || []).map((q, i) => `${i+1}. ${q}`).join('\n');
                              navigator.clipboard.writeText(shareText); alert('목장 나눔 텍스트가 복사되었습니다!');
                            }} className={`px-2 py-0.5 rounded text-[10.5px] font-bold border cursor-pointer ${isDark ? 'border-slate-700 bg-slate-800 text-gray-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-slate-950'}`}>
                              <IconShare />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {(sermon.applyQuestions || []).map((qText, qIdx) => {
                            const isDone = (sermon.completedActions || []).includes(qIdx);
                            const savedMemo = (sermon.actionMemos && sermon.actionMemos[qIdx]) || "";

                            return (
                              <div key={qIdx} className={`p-2.5 rounded-lg border transition-all ${isDone ? (isDark ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-slate-300') : (isDark ? 'bg-transparent border-slate-800' : 'bg-white/60 border-slate-200/60')}`}>
                                <div className="flex items-start gap-2 cursor-pointer" onClick={() => toggleAction(sermon.date, qIdx)}>
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'}`}>
                                    {isDone && <IconCheck />}
                                  </div>
                                  <p className={`text-[12px] leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-gray-200'} ${isSecretMode ? 'blur-xs' : ''}`}>
                                    {qText}
                                  </p>
                                </div>

                                {isDone && (
                                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                    <textarea
                                      rows={2}
                                      defaultValue={savedMemo}
                                      onBlur={(e) => handleSaveActionMemo(sermon.date, qIdx, e.target.value)}
                                      placeholder="실천한 내용과 은혜를 기록하세요..."
                                      className={`w-full p-2 text-[11.5px] rounded-md border outline-none ${isDark ? 'bg-black/40 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 설교 검색 */}
        {activeTab === 'list' && (
          <div className="space-y-3 animate-fade-in w-full text-left">
            <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-slate-200/90 shadow-xs'}`}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'border-slate-700 bg-black/30' : 'border-slate-200 bg-slate-50'}`}>
                <IconSearch />
                <input
                  type="text"
                  placeholder="설교 제목, 본문 구절, 설교자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent outline-none text-[12.5px] ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <input 
                  type="month" 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)} 
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono border outline-none cursor-pointer ${isDark ? 'border-slate-700 bg-black/30 text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-800'}`} 
                />
                
                <select 
                  value={selectedBook} 
                  onChange={(e) => setSelectedBook(e.target.value)} 
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] border outline-none cursor-pointer ${isDark ? 'border-slate-700 bg-black/30 text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-800'}`} 
                >
                  <option value="all">전체 성경 66권</option>
                  {bookList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <select 
                  value={selectedTag} 
                  onChange={(e) => setSelectedTag(e.target.value)} 
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono border outline-none cursor-pointer ${isDark ? 'border-slate-700 bg-black/30 text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-800'}`} 
                >
                  <option value="all">전체 신학 테마</option>
                  {tagList.map(t => <option key={t} value={t}>#{t}</option>)}
                </select>
              </div>
            </div>

            {(searchTerm || selectedBook !== 'all' || selectedTag !== 'all' || filterMonth) && (
              <div className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-[11.5px] ${isDark ? 'bg-slate-800 text-gray-200' : 'bg-slate-100 text-slate-700'}`}>
                <span>조회된 설교 <b>{filteredRecords.length}</b>편</span>
                <button 
                  onClick={() => { setSearchTerm(''); setSelectedBook('all'); setSelectedTag('all'); setFilterMonth(''); }}
                  className="font-bold hover:underline cursor-pointer text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  필터 초기화 ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {filteredRecords.length === 0 ? (
                <div className={`col-span-full py-16 text-center text-[12.5px] border border-dashed rounded-xl ${isDark ? 'text-gray-400 border-slate-800' : 'text-slate-400 border-slate-200'}`}>
                  조건에 일치하는 설교 기록이 없습니다.
                </div>
              ) : (
                filteredRecords.map((record, index) => (
                  <SermonCard 
                    key={index} 
                    record={record} 
                    searchTerm={searchTerm} 
                    onNavigateVerse={onNavigateVerse} 
                    setSelectedTag={setSelectedTag} 
                    onVersePopup={setPopupVerse} 
                    onOpenInterlinear={handleOpenInterlinearModal}
                    isDark={isDark} 
                  />
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* 3. 💡 [신규] 52주 주차 타일 클릭 시 해당 주간 설교 모음 팝업 모달 */}
      {weekDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1050] flex items-center justify-center p-3 select-none">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[80vh] overflow-hidden ${isDark ? 'bg-[#111827] border-[#1f2937] text-gray-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="text-left">
                <span className="text-[10.5px] font-mono text-sky-600 dark:text-sky-400 font-bold">{selectedYear}년 {weekDetailModal.weekNum}주차 ({weekDetailModal.dateRange})</span>
                <h3 className="font-bold text-[14.5px] text-slate-900 dark:text-white mt-0.5">선포된 강해 설교 ({weekDetailModal.sermons.length}편)</h3>
              </div>
              <button onClick={() => setWeekDetailModal(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <IconX />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 text-left">
              {weekDetailModal.sermons.map((s, idx) => (
                <div key={idx} className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{s.date} 선포</span>
                      <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">{s.title}</h4>
                      <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">📖 {s.detectedBook} 본문</span>
                    </div>
                    <button
                      onClick={() => {
                        setSermonPopup(s);
                        setWeekDetailModal(null);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
                    >
                      전문 보기
                    </button>
                  </div>
                  <p className="text-[11.5px] text-slate-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {decodeHtmlEntities(s.raw_text?.replace(/<[^>]*>?/gm, ''))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 설교 원문 전문 팝업 모달 */}
      {sermonPopup && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[1100] flex items-center justify-center p-3 select-none">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#111827] border-[#1f2937] text-gray-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-mono text-slate-400">{sermonPopup.date}</span>
                <h3 className="font-bold text-[14.5px] truncate max-w-md">{sermonPopup.title}</h3>
              </div>
              <button onClick={() => setSermonPopup(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <IconX />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto hide-scrollbar space-y-4 text-left">
              <div className="flex gap-1.5 flex-wrap items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                    📖 {sermonPopup.detectedBook}
                  </span>
                  {(sermonPopup.theoTags || []).map((tag, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-medium border ${isDark ? 'border-slate-800 text-gray-400' : 'border-slate-200 text-slate-600'}`}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenInterlinearModal(sermonPopup.detectedBook, 1, 1);
                    setSermonPopup(null);
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60 flex items-center gap-1 cursor-pointer"
                >
                  <span>🔬</span> 원어 연동 팝업 ➔
                </button>
              </div>

              <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                <SermonContentParser 
                  text={(sermonPopup.raw_text || '').replace(/#말씀묵상/g, '')}
                  searchTerm={searchTerm}
                  isDark={isDark} 
                  onVerseClick={setPopupVerse}
                  onOpenInterlinear={(b, c, v) => {
                    handleOpenInterlinearModal(b, c, v);
                    setSermonPopup(null);
                  }}
                  activeReference={{ book: sermonPopup.detectedBook, chapter: 1, verse: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 성경 구절 인라인 팝업 모달 */}
      {popupVerse && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[1150] flex items-center justify-center p-3 select-none">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col max-h-[75vh] overflow-hidden ${isDark ? 'bg-[#111827] border-[#1f2937] text-gray-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[14.5px] text-left">📖 {popupVerse}</h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseBibleReference(popupVerse);
                    const b = parsed ? parsed.book : "갈라디아서";
                    const c = parsed ? parsed.chapter : 1;
                    const v = parsed ? parsed.startVerse : 1;
                    handleOpenInterlinearModal(b, c, v);
                    setPopupVerse(null);
                  }}
                  className="px-2 py-0.5 rounded text-[10.5px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60 flex items-center gap-1 cursor-pointer"
                >
                  <span>🔬</span> 원어 연동 ➔
                </button>
                <button onClick={() => setPopupVerse(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  <IconX />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto hide-scrollbar text-left">
              <p className="text-[13.5px] leading-[2.1] whitespace-pre-wrap text-slate-800 dark:text-gray-200">
                {popupVerseText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. 원어 성경 연동 팝업 모달 */}
      {interlinearTarget && (
        <InterlinearQuickModal
          target={interlinearTarget}
          onClose={() => setInterlinearTarget(null)}
          onJumpStudio={(b, c, v, reopen) => handleJumpToInterlinear(b, c, v, reopen)}
          getBibleText={getBibleTextLocal}
          isDark={isDark}
        />
      )}

    </div>
  );
}
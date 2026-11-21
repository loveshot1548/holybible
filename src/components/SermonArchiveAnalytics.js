// src/components/SermonArchiveAnalytics.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Lock,
  Unlock,
  Search,
  Share2,
  Volume2,
  X
} from 'lucide-react';
import ChurchSketchIcon from './ChurchSketchIcon';
import { supabase } from '../lib/supabase';

// =====================================================================
// 전역 성경 약어 사전 및 정경 66권 매핑
// =====================================================================
const BIBLE_ABBREV_MAP = {
  창세기: '창세기', 창: '창세기', 출애굽기: '출애굽기', 출: '출애굽기', 레위기: '레위기', 레: '레위기',
  민수기: '민수기', 민: '민수기', 신명기: '신명기', 신: '신명기', 여호수아: '여호수아', 수: '여호수아',
  사사기: '사사기', 삿: '사사기', 룻기: '룻기', 룻: '룻기', 사무엘상: '사무엘상', 삼상: '사무엘상',
  사무엘하: '사무엘하', 삼하: '사무엘하', 열왕기상: '열왕기상', 왕상: '열왕기상', 열왕기하: '열왕기하', 왕하: '열왕기하',
  역대상: '역대상', 대상: '역대상', 역대하: '역대하', 대하: '역대하', 에스라: '에스라', 스: '에스라',
  느헤미야: '느헤미야', 느: '느헤미야', 에스더: '에스더', 에: '에스더', 욥기: '욥기', 욥: '욥기',
  시편: '시편', 시: '시편', 잠언: '잠언', 잠: '잠언', 전도서: '전도서', 전: '전도서', 아가: '아가', 아: '아가',
  이사야: '이사야', 사: '이사야', 예레미야: '예레미야', 렘: '예레미야', 예레미야애가: '예레미야애가', 애: '예레미야애가',
  에스겔: '에스겔', 겔: '에스겔', 다니엘: '다니엘', 단: '다니엘', 호세아: '호세아', 호: '호세아',
  요엘: '요엘', 욜: '요엘', 아모스: '아모스', 암: '아모스', 오바댜: '오바댜', 옵: '오바댜', 요나: '요나', 욘: '요나',
  미가: '미가', 미: '미가', 나훔: '나훔', 나: '나훔', 하박국: '하박국', 합: '하박국', 스바냐: '스바냐', 습: '스바냐',
  학개: '학개', 학: '학개', 스가랴: '스가랴', 슥: '스가랴', 말라기: '말라기', 말: '말라기',
  마태복음: '마태복음', 마: '마태복음', 마가복음: '마가복음', 막: '마가복음', 누가복음: '누가복음', 눅: '누가복음',
  요한복음: '요한복음', 요: '요한복음', 사도행전: '사도행전', 행: '사도행전', 로마서: '로마서', 롬: '로마서',
  고린도전서: '고린도전서', 고전: '고린도전서', 고린도후서: '고린도후서', 고후: '고린도후서', 갈라디아서: '갈라디아서', 갈: '갈라디아서',
  에베소서: '에베소서', 엡: '에베소서', 빌립보서: '빌립보서', 빌: '빌립보서', 골로새서: '골로새서', 골: '골로새서',
  데살로니가전서: '데살로니가전서', 살전: '데살로니가전서', 데살로니가후서: '데살로니가후서', 살후: '데살로니가후서',
  디모데전서: '디모데전서', 딤전: '디모데전서', 디모데후서: '디모데후서', 딤후: '디모데후서', 디도서: '디도서', 딛: '디도서',
  빌레몬서: '빌레몬서', 몬: '빌레몬서', 히브리서: '히브리서', 히: '히브리서', 야고보서: '야고보서', 약: '야고보서',
  베드로전서: '베드로전서', 벧전: '베드로전서', 베드로후서: '베드로후서', 벧후: '베드로후서', 요한일서: '요한일서', 요일: '요한일서',
  요한이서: '요한이서', 요이: '요한이서', 요한삼서: '요한삼서', 요삼: '요한삼서', 유다서: '유다서', 유: '유다서', 요한계시록: '요한계시록', 계: '요한계시록'
};

const BIBLE_BOOKS_ORDER = Array.from(new Set(Object.values(BIBLE_ABBREV_MAP)));
const BIBLE_KEYS = Object.keys(BIBLE_ABBREV_MAP).sort((a, b) => b.length - a.length).join('|');
const BIBLE_VERSE_SINGLE_REGEX = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~|–)\\s*(\\d+))?(?:절)?`);

const BIBLE_CANON_GROUPS = {
  모세오경: ['창세기', '출애굽기', '레위기', '민수기', '신명기'],
  역사서: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'],
  시가서: ['욥기', '시편', '잠언', '전도서', '아가'],
  예언서: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'],
  '복음/역사': ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'],
  바울서신: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'],
  '공동서신/계시록': ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서', '요한계시록']
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
  return '기타';
};

// =====================================================================
// 노션 DB · 검수 기록 · 녹취 메타 제거 & 뭉친 성경절 자동 분할 엔진
// =====================================================================
function sanitizeAndSplitSermonText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  const rawLines = rawText.split('\n');
  const outLines = [];
  let skipAdminSection = false;

  for (let rawLine of rawLines) {
    let t = rawLine.trim();
    if (!t) {
      if (!skipAdminSection) outLines.push('');
      continue;
    }

    const plain = t.replace(/\*\*/g, '').trim();

    if (/^(?:0[1-9]\s*|[IVX]+\.\s*|\d+\.\s*)?(?:노션\s*DB|DB\s*입력|검수\s*기록|녹취\s*안내|문서\s*메타|성경\s*구절\s*색인\s*표)/i.test(plain)) {
      skipAdminSection = true;
      continue;
    }
    if (/^(?:[IVX]{1,4}[\.\s]+|0[1-9]\s+)/.test(plain) && !/노션|DB|검수|녹취/.test(plain)) {
      skipAdminSection = false;
    }
    if (skipAdminSection) continue;

    if (t.includes('|') && /노션|DB|검수자|검수일|녹취|파일명|문서번호/.test(t)) continue;

    if (/노션\s*DB|검수\s*기록|성경구절\s*색인|성경\s*구절\s*색인|녹취록/.test(t)) {
      t = t
        .replace(/노션\s*DB\s*입력\s*정보/g, '')
        .replace(/노션\s*DB/g, '')
        .replace(/검수\s*기록/g, '')
        .replace(/성경\s*구절\s*색인/g, '')
        .replace(/적용\s*질문/g, '')
        .replace(/녹취록?/g, '')
        .replace(/(\s*[·|/]\s*)+/g, ' ')
        .replace(/^[\s·|/\-]+|[\s·|/\-]+$/g, '')
        .trim();
      if (!t || t.length < 3) continue;
    }

    t = t.replace(/우리들\s*교회|부산신성교회|김포\s*좋은나무교회|좋은나무교회/g, '').trim();
    if (!t) continue;

    const verseStartMatch = plain.match(/^\[?(\d{1,3})(?:절)?\]?\s+([가-힣].+)/);
    const isNumberedHeading = /^\d{1,2}\.\s+/.test(plain) || /^◆\s*\d+/.test(plain);

    if (verseStartMatch && !isNumberedHeading) {
      const startVerseNum = parseInt(verseStartMatch[1], 10);
      const nextVersePattern = new RegExp(`\\s+${startVerseNum + 1}\\s+[가-힣]`);
      if (nextVersePattern.test(plain)) {
        const chunks = plain.split(/(?<=[가-힣\.!\?”"'])\s+(?=\d{1,3}\s+[가-힣])/);
        if (chunks.length > 1) {
          chunks.forEach((chunk) => {
            const cm = chunk.trim().match(/^\[?(\d{1,3})(?:절)?\]?\s+(.+)$/);
            if (cm) outLines.push(`[${cm[1]}절] ${cm[2].trim()}`);
            else outLines.push(chunk.trim());
          });
          continue;
        }
      }
    }

    outLines.push(t);
  }

  return outLines.join('\n');
}

function extractStandardDate(rec, title, raw) {
  if (rec.date && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)) return rec.date;
  const targetStr = `${title || ''} ${rec.filename || ''} ${rec.date || ''} ${raw ? raw.slice(0, 300) : ''}`;

  const compactMatch = targetStr.match(/20\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (compactMatch) {
    const s = compactMatch[0];
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  const sepMatch = targetStr.match(/(20\d{2})[-._/](\d{1,2})[-._/](\d{1,2})/);
  if (sepMatch) return `${sepMatch[1]}-${sepMatch[2].padStart(2, '0')}-${sepMatch[3].padStart(2, '0')}`;

  const korMatch = targetStr.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
  if (korMatch) return `${korMatch[1]}-${korMatch[2].padStart(2, '0')}-${korMatch[3].padStart(2, '0')}`;

  return rec.date || '2026-01-01';
}

function getWeekNumber(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diffDays = Math.floor((d - startOfYear) / 86400000);
  return Math.min(52, Math.max(1, Math.floor((diffDays + startOfYear.getDay()) / 7) + 1));
}

function getWeekDateRange(year, weekNum) {
  const jan1 = new Date(year, 0, 1);
  const firstWeekStart = new Date(year, 0, 1 - jan1.getDay());
  const weekStart = new Date(firstWeekStart.getTime() + (weekNum - 1) * 7 * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(weekStart)}~${fmt(weekEnd)}`;
}

function parseBibleReference(text) {
  if (!text) return null;
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)(?:\\s*장|\\s*편|\\s*:)\\s*(\\d+)?(?:\\s*(?:-|~|–)\\s*(\\d+))?(?:절)?`);
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
  const regex = new RegExp(`(?:^|[^가-힣])(${BIBLE_KEYS})\\s*(\\d+)\\s*(?:장|편|:)\\s*(\\d+)?(?:\\s*(?:-|~|–)\\s*(\\d+))?(?:절)?`, 'g');
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
  if (text.includes('공동체') || text.includes('지체') || text.includes('예배')) tags.add('교회론');
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

const DISCIPLESHIP_12WEEKS_CURRICULUM = {
  1: {
    title: '구원론 (Soteriology): 칭의와 전가된 의',
    themeKey: '구원론',
    keywords: ['구원', '십자가', '칭의', '의롭다', '전가', '율법', '행위', '은혜', '보혈', '대속'],
    verse: '로마서 3:24-26, 에베소서 2:8-9',
    academicContext: '칭의(Justification)는 도덕적 갱신이 아닌, 그리스도의 완전한 순종이 죄인에게 법정적으로 전가(Imputation)되는 객관적 사건입니다.',
    principle: '복음은 인간의 종교적 열심을 요구하지 않습니다. 오직 그리스도의 대속적 죽음만을 의지하는 훈련을 시작합니다.',
    reportPrompt: '[성찰 기록] 나의 행위가 아닌 전가된 의로 믿음의 확신을 얻은 구체적 과정을 신학적으로 진술하시오.'
  },
  2: {
    title: '신론 (Theology Proper): 하나님의 절대 주권과 섭리',
    themeKey: '신론',
    keywords: ['주권', '섭리', '뜻', '계획', '창조', '합력', '통치', '작정', '전능'],
    verse: '로마서 8:28, 이사야 45:7',
    academicContext: '하나님의 섭리(Providence)는 우연을 배제합니다. 신자의 삶 속 고난과 성취 모두 하나님의 작정 안에 속해 있음을 고백합니다.',
    principle: '해석되지 않는 고난 앞에서도 선하신 통치자 하나님께 순복하는 훈련입니다.',
    reportPrompt: '[성찰 기록] 이해되지 않았던 고난을 합력하여 선을 이루시는 하나님의 주권적 섭리의 관점에서 재해석하시오.'
  },
  3: {
    title: '말씀론 (Bibliology): 계시 의존 사색과 영적 분별',
    themeKey: '말씀론',
    keywords: ['말씀', '성경', '묵상', '큐티', '진리', '계시', '권위', '조명', '영감'],
    verse: '디모데후서 3:16-17, 히브리서 4:12',
    academicContext: '성경의 완전 영감과 무오성을 전제로 본문의 문맥에 기초하여 성령의 조명을 구합니다.',
    principle: '말씀이 나의 숨은 죄와 동기를 찔러 쪼개어 수술하도록 내 삶의 절대 기준으로 세웁니다.',
    reportPrompt: '[성찰 기록] 말씀이 내 내면의 어떤 숨은 동기를 찔러 쪼개었는지 분석하여 기술하시오.'
  },
  4: {
    title: '기독론 (Christology): 십자가와 자기 부인',
    themeKey: '기독론',
    keywords: ['예수', '성육신', '부활', '자기부인', '십자가', '내려놓음', '포기', '낮아짐'],
    verse: '갈라디아서 2:20, 빌립보서 2:5-8',
    academicContext: '그리스도의 비하와 성육신을 본받아 오늘 내 삶 속에서 철저한 자기 부인(Kenosis)을 실천합니다.',
    principle: '매일 정욕과 자아를 십자가에 못 박고 오직 내 안에 그리스도가 사시도록 주권을 이양합니다.',
    reportPrompt: '[성찰 기록] 나의 권리나 자존심을 내려놓고 그리스도의 십자가를 본받아 자기를 부인한 사례를 기록하시오.'
  },
  5: {
    title: '인간론 (Anthropology): 전적 타락과 참된 회개',
    themeKey: '인간론/회개',
    keywords: ['죄', '회개', '타락', '탐심', '교만', '이기심', '돌이킴', '자아', '본성'],
    verse: '시편 51:10-12, 예레미야 17:9',
    academicContext: '인간의 전적 부패를 직면하고 감상적 후회가 아닌 영적 방향의 완전한 전환(Metanoia)을 이룹니다.',
    principle: '갈등의 원인을 남 탓하지 않고, 내 안의 교만과 이기심을 정직히 직면하여 통회합니다.',
    reportPrompt: '[성찰 기록] 상대방을 탓하던 마음을 멈추고 내 안의 죄성을 발견하여 회개한 과정을 진술하시오.'
  },
  6: {
    title: '기도론 (Theology of Prayer): 언약적 기도와 순종',
    themeKey: '기도론',
    keywords: ['기도', '간구', '주기도문', '응답', '부르짖음', '무릎', '기다림'],
    verse: '요한일서 5:14, 마태복음 6:9-10',
    academicContext: '기도는 조물주를 조종하는 수단이 아니라 하나님의 언약적 뜻에 나를 굴복시키는 행위입니다.',
    principle: '육적 필요를 넘어 하나님 나라와 그의 의를 먼저 구하는 영의 기도로 성숙해집니다.',
    reportPrompt: '[성찰 기록] 내 기도의 목록을 하나님 나라를 구하는 언약적 기도로 재편성한 결단을 기록하시오.'
  },
  7: {
    title: '고난의 신학 (Theologia Crucis): 연단과 성화',
    themeKey: '고난의신비',
    keywords: ['고난', '상처', '연단', '아픔', '눈물', '광야', '인내', '환난', '시련'],
    verse: '베드로전서 4:12-13, 야고보서 1:2-4',
    academicContext: '고난은 저주가 아니라 불순물을 제거하고 거룩함(Sanctification)으로 이끄시는 은혜의 방편입니다.',
    principle: '고난 앞에서 원망을 멈추고 하나님이 나를 빚어가시는 성화의 목적을 묻습니다.',
    reportPrompt: '[성찰 기록] 현재 겪고 있는 고난을 십자가 신학의 관점에서 성화의 도구로 재해석하시오.'
  },
  8: {
    title: '성령론 (Pneumatology): 내주하심과 거룩한 전쟁',
    themeKey: '성령론',
    keywords: ['성령', '은사', '열매', '충만', '영적 전쟁', '혈기', '전신갑주', '마귀', '사탄'],
    verse: '갈라디아서 5:16-17, 에베소서 6:10-12',
    academicContext: '성령 충만은 전 인격이 성령의 지배를 받는 상태이며 육체의 소욕을 거스르는 거룩한 전투입니다.',
    principle: '혈과 육의 갈등 배후를 영적으로 분별하며 성령의 열매(절제, 온유)로 대적합니다.',
    reportPrompt: '[성찰 기록] 갈등 상황에서 혈기를 죽이고 성령의 열매를 맺은 과정을 기술하시오.'
  },
  9: {
    title: '청지기론 (Stewardship): 일터 신학과 소명',
    themeKey: '청지기론',
    keywords: ['직장', '재물', '헌금', '일터', '청지기', '소명', '돈', '성공', '노동'],
    verse: '골로새서 3:23-24, 마태복음 6:24',
    academicContext: '직장과 일터의 노동은 세속적인 것이 아니라 하나님을 예배하는 거룩한 성직(Vocation)입니다.',
    principle: '재능과 재물이 내 것이 아님을 인정하고 하나님 나라를 위해 청지기로 살아갑니다.',
    reportPrompt: '[성찰 기록] 일터를 하나님이 파송하신 사명지로 재인식하며 내린 재정적/시간적 결단을 적으시오.'
  },
  10: {
    title: '언약 가정 (Covenant Family): 신앙의 전수와 영적 제사장',
    themeKey: '언약가정',
    keywords: ['가정', '부부', '자녀', '언약', '부모', '자식', '결혼', '가족', '배우자'],
    verse: '신명기 6:4-7, 에베소서 5:22-33',
    academicContext: '가정은 하나님이 세우신 최초의 교회이며 신앙 전수의 거룩한 보루입니다.',
    principle: '세속적 성공보다 신앙 전수를 최우선으로 삼고 말씀으로 가정을 인도합니다.',
    reportPrompt: '[성찰 기록] 가정을 언약적 공동체로 세우기 위해 결단한 영적 실천 지침을 작성하시오.'
  },
  11: {
    title: '교회론 (Ecclesiology): 유기적 몸과 은사의 섬김',
    themeKey: '교회론',
    keywords: ['공동체', '지체', '예배', '봉사', '섬김', '교제', '몸', '은사'],
    verse: '고린도전서 12:27, 에베소서 4:15-16',
    academicContext: '성도는 그리스도를 머리로 한 한 몸이며, 은사는 이웃과 지체를 세우기 위해 주어졌습니다.',
    principle: '소비자 신앙을 버리고 이름 없는 섬김의 자리에서 이웃을 세우는 지체로 헌신합니다.',
    reportPrompt: '[성찰 기록] 주님의 몸 된 공동체와 이웃을 세우기 위해 내가 감당해야 할 이름 없는 섬김의 자리를 논하시오.'
  },
  12: {
    title: '선교와 제자도 (Missiology): 영적 재생산과 증인의 삶',
    themeKey: '선교/제자도',
    keywords: ['전도', '영혼', '선교', '파송', '제자', '증인', '복음 전파', '태신자', '재생산'],
    verse: '마태복음 28:19-20, 사도행전 1:8',
    academicContext: '제자도의 최종 지향점은 영혼 구원과 또 다른 제자를 세우는 영적 재생산(Multiplication)입니다.',
    principle: '삶의 현장에서 한 영혼을 품고 기도하며, 복음을 전파하는 증인의 삶으로 파송받습니다.',
    reportPrompt: '[성찰 기록] 내가 품고 기도하는 영혼(VIP)을 향한 복음 전파와 삶의 결단문을 작성하시오.'
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
          <mark key={i} className="bg-[#FEF08A] text-[#111827] px-0.5 rounded font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// =====================================================================
// 설교 본문 및 성경 구절 정밀 파서
// =====================================================================
const SermonContentParser = ({ text, searchTerm, isDark, onVerseClick, onOpenInterlinear, activeReference }) => {
  if (!text) return null;
  const sanitized = sanitizeAndSplitSermonText(text);
  const lines = sanitized.split('\n');

  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#4E5968]';

  let currentBook = activeReference?.book || '야고보서';
  let currentChapter = activeReference?.chapter || 1;

  return lines.map((line, idx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2" />;
    trimmed = trimmed.replace(/#말씀묵상/g, '').trim();
    if (!trimmed) return null;

    const cleanNoBold = trimmed.replace(/\*\*/g, '').trim();

    const inlineRef = parseBibleReference(cleanNoBold);
    if (inlineRef) {
      currentBook = inlineRef.book;
      currentChapter = inlineRef.chapter;
    } else {
      const chapOnly = cleanNoBold.match(/(?:제\s*)?(\d+)\s*장/);
      if (chapOnly && chapOnly[1] && cleanNoBold.length < 30) {
        currentChapter = parseInt(chapOnly[1], 10);
      }
    }

    // 1) 적용 질문 박스
    if (
      cleanNoBold.match(/^(적용:|적용 질문|Q\d*[\.\)]|질문:|적용 포인트)/) ||
      (cleanNoBold.endsWith('?') && cleanNoBold.length < 110)
    ) {
      return (
        <div key={idx} className={`my-2.5 p-3 rounded-xl border-l-4 border-[#D97706] ${subBg} text-left`}>
          <span className="text-[10.5px] font-mono font-bold text-[#D97706] block mb-1">적용 질문</span>
          <p className={`text-[13.5px] font-bold leading-relaxed break-keep ${textMain}`}>
            {cleanNoBold.replace(/^(적용:|적용 질문:?|Q\.|질문:|적용 포인트)/g, '').trim()}
          </p>
        </div>
      );
    }

    // 2) 소제목
    const isMajorOrNumberedHeading =
      /^(?:◆\s*)?(?:\d{1,2}\.\s+[가-힣A-Za-z]|0[1-9]\s+[가-힣]|[IVX]{1,4}[\.\s]+[가-힣]|첫째|둘째|셋째|들어가며|도입\s|결론)/.test(cleanNoBold) ||
      (cleanNoBold.endsWith(':') && cleanNoBold.length < 45);

    if (isMajorOrNumberedHeading && cleanNoBold.length < 75) {
      const displayHeading = cleanNoBold.replace(/^◆\s*/, '');
      return (
        <h4 key={idx} className={`mt-4 mb-1.5 text-[15px] font-bold tracking-tight text-left flex items-center gap-2 ${textMain}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
          <HighlightedText text={displayHeading} searchHighlight={searchTerm} />
        </h4>
      );
    }

    // 3) 성경 구절 인용 배지
    const verseMatch = cleanNoBold.match(BIBLE_VERSE_SINGLE_REGEX);
    if (verseMatch && cleanNoBold.length < 85) {
      return (
        <div key={idx} className="my-1.5 text-left">
          <button
            type="button"
            onClick={() => onVerseClick && onVerseClick(verseMatch[0].trim())}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold border ${borderClass} ${subBg} ${textMain} hover:border-[#2563EB] cursor-pointer`}
          >
            <ChurchSketchIcon name="bible" className="w-3.5 h-3.5" isDarkMode={isDark} />
            <span>{cleanNoBold}</span>
          </button>
        </div>
      );
    }

    // 4) 실제 성경 본문 절 카드
    const explicitVerseMatch = cleanNoBold.match(/^\[?(\d{1,3})\s*절?\]?\s+([가-힣].+)/);
    const hasDotAfterNumber = /^\d+\.\s/.test(cleanNoBold);

    if (explicitVerseMatch && !hasDotAfterNumber && explicitVerseMatch[2].length > 8) {
      const vNum = parseInt(explicitVerseMatch[1], 10);
      const vContent = explicitVerseMatch[2].trim();
      const capturedBook = currentBook;
      const capturedChap = currentChapter;

      return (
        <div key={idx} className={`my-1.5 p-2.5 rounded-xl border ${borderClass} ${subBg} flex items-start justify-between gap-2 text-left`}>
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#D97706]/15 text-[#D97706] shrink-0 mt-0.5">
              {vNum}절
            </span>
            <p className={`text-[13.5px] leading-[1.75] break-keep ${textMain}`}>
              <HighlightedText text={vContent} searchHighlight={searchTerm} />
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenInterlinear) onOpenInterlinear(capturedBook, capturedChap, vNum);
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#2563EB]/10 text-[#2563EB] shrink-0 cursor-pointer hover:bg-[#2563EB]/20"
            title={`${capturedBook} ${capturedChap}:${vNum} 원어 분해 열기`}
          >
            원어
          </button>
        </div>
      );
    }

    // 5) 일반 문단
    return (
      <p key={idx} className={`text-[13.5px] leading-[1.8] text-left break-keep mb-2 ${textSub}`}>
        <HighlightedText text={cleanNoBold} searchHighlight={searchTerm} />
      </p>
    );
  });
};

const SermonCard = ({ record, searchTerm, onNavigateVerse, setSelectedTag, onVersePopup, onOpenInterlinear, onCopyToast, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cleanRawText = useMemo(() => {
    const decoded = decodeHtmlEntities(record.raw_text?.replace(/<[^>]*>?/gm, ''))?.replace(/#말씀묵상/g, '');
    return sanitizeAndSplitSermonText(decoded);
  }, [record.raw_text]);

  const isLongText = cleanRawText.length > 220;

  const activeReference = useMemo(() => {
    const combined = `${record.main_scripture || ''} ${record.verse || ''} ${record.title || ''} ${record.mappedVerse || ''} ${cleanRawText?.slice(0, 400) || ''}`;
    const parsed = parseBibleReference(combined);
    if (parsed) return { book: parsed.book, chapter: parsed.chapter, verse: parsed.startVerse };
    const detectedBook = record.detectedBook && record.detectedBook !== '기타 말씀' ? record.detectedBook : '야고보서';
    return { book: detectedBook, chapter: 1, verse: 1 };
  }, [record, cleanRawText]);

  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  return (
    <article className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} text-left space-y-2.5`}>
      <div className={`flex justify-between items-center pb-2 border-b ${borderClass} gap-2`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${subBg} ${textSub}`}>{record.date}</span>
          <button
            type="button"
            onClick={() => onNavigateVerse && onNavigateVerse(activeReference.book)}
            className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-[#2563EB]/10 text-[#2563EB] cursor-pointer"
          >
            {activeReference.book} {activeReference.chapter}장
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenInterlinear && onOpenInterlinear(activeReference.book, activeReference.chapter, activeReference.verse)}
            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#0D9488]/10 text-[#0D9488] cursor-pointer"
          >
            원어 연동
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`[${record.date} 말씀 강해]\n본문: ${activeReference.book} ${activeReference.chapter}장\n제목: ${record.title}\n\n${cleanRawText}`);
              if (onCopyToast) onCopyToast('설교 전문이 복사되었습니다.');
            }}
            className={`p-1.5 rounded-lg ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer`}
            title="복사"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h2 className={`text-[15.5px] font-bold leading-snug break-keep ${textMain}`}>
        <HighlightedText text={record.title} searchHighlight={searchTerm} />
      </h2>

      <div className="relative">
        <div className={!isExpanded && isLongText ? 'max-h-[168px] overflow-hidden' : ''}>
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
          <div className={`absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t ${isDark ? 'from-[#171A21]' : 'from-white'} to-transparent pointer-events-none`} />
        )}
      </div>

      {isLongText && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1 text-[12px] font-bold ${textSub} hover:text-[#2563EB] cursor-pointer`}
        >
          {isExpanded ? <><ChevronUp className="w-4 h-4" /> 접기</> : <><ChevronDown className="w-4 h-4" /> 전체 읽기</>}
        </button>
      )}

      {record.tags && record.tags.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${borderClass}`}>
          {record.tags
            .filter((tag) => tag !== '말씀묵상')
            .map((tag, tIdx) => (
              <button
                key={tIdx}
                type="button"
                onClick={() => setSelectedTag && setSelectedTag(tag)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer`}
              >
                #{tag}
              </button>
            ))}
        </div>
      )}
    </article>
  );
};

// 원어 성경 인라인 연동 팝업 모달
const InterlinearQuickModal = ({ target, onClose, onJumpStudio, getBibleText, isDark }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const isOT = isOTBook(target.book);
  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  const speakWord = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[\u0591-\u05AF]/g, ''));
      utterance.lang = isOT ? 'he-IL' : 'el-GR';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    const fetchWords = async () => {
      try {
        if (!supabase) throw new Error('Supabase 연결을 찾을 수 없습니다.');
        const { data, error } = await supabase
          .from('interlinear_bible')
          .select('*')
          .eq('book', target.book)
          .eq('chapter', target.chapter)
          .eq('verse', target.verse)
          .order('word_order', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(`${target.book} ${target.chapter}:${target.verse} 원어 데이터가 없습니다.`);
        }
        if (isMounted) {
          setWords(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || '원어 데이터를 불러오지 못했습니다.');
          setLoading(false);
        }
      }
    };

    fetchWords();
    return () => {
      isMounted = false;
    };
  }, [target]);

  const verseKorean = getBibleText(`${target.book} ${target.chapter}:${target.verse}`) || `${target.book} ${target.chapter}장 ${target.verse}절`;
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1200] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[86vh] overflow-hidden`}
      >
        <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB]">
              {isOT ? 'BHS 히브리어' : 'NA28 헬라어'}
            </span>
            <h3 className="font-bold text-[15px]">
              {target.book} {target.chapter}장 {target.verse}절
            </h3>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto hide-scrollbar space-y-3 text-left flex-1">
          <div className={`p-3 rounded-xl border ${borderClass} ${subBg}`}>
            <span className={`text-[10.5px] font-bold ${textSub} block mb-1`}>개역개정 본문</span>
            <p className="text-[14px] leading-[1.75] break-keep">{verseKorean}</p>
          </div>

          {loading ? (
            <div className={`py-10 text-center text-[13px] ${textSub}`}>원어 형태소 불러오는 중...</div>
          ) : errorMsg ? (
            <div className="py-8 text-center space-y-2.5">
              <p className="text-[13px] text-rose-500 font-medium">{errorMsg}</p>
              <button
                type="button"
                onClick={() => onJumpStudio(target.book, target.chapter, target.verse)}
                className="px-4 py-2 rounded-xl text-[12.5px] font-bold bg-[#2563EB] text-white cursor-pointer"
              >
                원어 연구실에서 열기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" dir={isOT ? 'rtl' : 'ltr'}>
              {words.map((w, wIdx) => (
                <div
                  key={w.id || wIdx}
                  onClick={() => speakWord(w.original_word)}
                  className={`p-2.5 rounded-xl border ${borderClass} ${subBg} flex flex-col justify-between cursor-pointer hover:border-[#2563EB]`}
                >
                  <div className={isOT ? 'text-right' : 'text-left'}>
                    <div className="flex items-center justify-between gap-1">
                      <span style={originalFontStyle} className="text-[19px] font-bold truncate">
                        {w.original_word}
                      </span>
                      <Volume2 className={`w-3.5 h-3.5 ${textSub} shrink-0`} />
                    </div>
                    <span className={`text-[10.5px] font-mono ${textSub} block mt-0.5 truncate`} dir="ltr">
                      {w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : ''}
                    </span>
                  </div>
                  <div className={`my-1.5 border-t ${borderClass}`} />
                  <div className="text-left" dir="ltr">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className="font-bold text-[12.5px] text-[#0D9488] truncate">{w.korean_trans || w.gloss || '원어 어휘'}</span>
                      <span className={`text-[10px] font-mono ${textSub} shrink-0`}>{w.strongs_id}</span>
                    </div>
                    <span className={`text-[10.5px] ${textSub} block truncate mt-0.5`}>{w.grammar}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-3 border-t ${borderClass} shrink-0 flex items-center justify-between gap-2`}>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                const nextV = Math.max(1, target.verse - 1);
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, nextV, true), 50);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border ${borderClass} ${subBg} cursor-pointer`}
            >
              이전 절
            </button>
            <button
              type="button"
              onClick={() => {
                const nextV = target.verse + 1;
                onClose();
                setTimeout(() => onJumpStudio(target.book, target.chapter, nextV, true), 50);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border ${borderClass} ${subBg} cursor-pointer`}
            >
              다음 절
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onJumpStudio(target.book, target.chapter, target.verse, false);
            }}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-[#2563EB] text-white cursor-pointer"
          >
            원어 연구실 이동
          </button>
        </div>
      </div>
    </div>
  );
};
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

export default function SermonArchiveAnalytics({
  onBack,
  onNavigateVerse,
  bibles,
  t,
  isDarkMode,
  dailyData = {},
  updateDay,
  setActiveScreen
}) {
  // iOS 야간 다크모드 자동 감지 + 앱 테마 100% 호환
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : systemDark;

  const [sermonData, setSermonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isSecretMode, setIsSecretMode] = useState(false);

  const [sermonPopup, setSermonPopup] = useState(null);
  const [popupVerse, setPopupVerse] = useState(null);
  const [popupVerseText, setPopupVerseText] = useState('');
  const [interlinearTarget, setInterlinearTarget] = useState(null);
  const [weekDetailModal, setWeekDetailModal] = useState(null);

  const [reportData, setReportData] = useState(() => {
    try {
      const saved = localStorage.getItem('goodtree_report_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSaveReport = (week, text) => {
    const newData = { ...reportData, [week]: text };
    setReportData(newData);
    try {
      localStorage.setItem('goodtree_report_data_v2', JSON.stringify(newData));
    } catch (_) {}
  };

  const toggleAction = useCallback(
    (sermonDate, qIdx) => {
      if (!updateDay) return;
      const dayData = (dailyData && dailyData[sermonDate]) || {};
      const completed = dayData.completedActions || [];
      const newCompleted = completed.includes(qIdx) ? completed.filter((i) => i !== qIdx) : [...completed, qIdx];
      updateDay(sermonDate, { ...dayData, completedActions: newCompleted });
    },
    [dailyData, updateDay]
  );

  const handleSaveActionMemo = useCallback(
    (sermonDate, qIdx, memoText) => {
      if (!updateDay) return;
      const dayData = (dailyData && dailyData[sermonDate]) || {};
      const actionMemos = dayData.actionMemos || {};
      updateDay(sermonDate, { ...dayData, actionMemos: { ...actionMemos, [qIdx]: memoText } });
    },
    [dailyData, updateDay]
  );

  const handleJumpToInterlinear = useCallback(
    (book, chapter, verse, reopenPopup = false) => {
      const cleanBook = BIBLE_ABBREV_MAP[book] || book || '야고보서';
      const cNum = Number(chapter) || 1;
      const vNum = Number(verse) || 1;

      try {
        localStorage.setItem('interlinear_jump', JSON.stringify({ book: cleanBook, chapter: cNum, verse: vNum }));
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
    },
    [setActiveScreen, onNavigateVerse]
  );

  const handleOpenInterlinearModal = useCallback((book, chapter, verse) => {
    const cleanBook = BIBLE_ABBREV_MAP[book] || book || '야고보서';
    setInterlinearTarget({ book: cleanBook, chapter: Number(chapter) || 1, verse: Number(verse) || 1 });
  }, []);

  const getBibleTextLocal = useCallback(
    (verseQuery) => {
      if (!bibles) return '성경 데이터를 찾을 수 없습니다.';
      if (!verseQuery) return '';
      const parsed = parseBibleReference(verseQuery);
      if (!parsed) return `구절 형식을 해석할 수 없습니다: ${verseQuery}`;

      const { book, chapter, startVerse, endVerse } = parsed;
      const list = Array.isArray(bibles) ? bibles : [];
      const targetBook = list.find((b) => b?.name === book || b?.name === BIBLE_ABBREV_MAP[book]) || list[BIBLE_BOOKS_ORDER.indexOf(book)];

      if (!targetBook || !targetBook.chapters) return `${book} 본문을 불러올 수 없습니다.`;
      const chapterData = targetBook.chapters[chapter - 1];
      if (!chapterData) return `${book} ${chapter}장을 찾을 수 없습니다.`;

      const results = [];
      for (let v = startVerse; v <= endVerse; v++) {
        const verseData = chapterData[v - 1];
        if (verseData) {
          const rawText = typeof verseData === 'string' ? verseData : verseData.text || verseData.content || JSON.stringify(verseData);
          results.push(`${v}. ${decodeHtmlEntities(rawText)}`);
        }
      }
      return results.join('\n\n');
    },
    [bibles]
  );

  useEffect(() => {
    let isMounted = true;
    fetch('/sermon_summary.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setSermonData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (popupVerse) setPopupVerseText(getBibleTextLocal(popupVerse));
    else setPopupVerseText('');
  }, [popupVerse, getBibleTextLocal]);

  const enrichedSermonRecords = useMemo(() => {
    if (!sermonData) return [];
    let rawList = [];
    if (Array.isArray(sermonData)) rawList = sermonData;
    else if (sermonData.sermons && Array.isArray(sermonData.sermons)) rawList = sermonData.sermons;
    else if (sermonData.index) {
      Object.keys(sermonData.index).forEach((v) => (sermonData.index[v] || []).forEach((rec) => rawList.push(rec)));
    }

    return rawList
      .map((rec, index) => {
        const rawDirty = (rec.raw_text || (rec.paragraphs ? rec.paragraphs.join('\n') : '') || JSON.stringify(rec)).replace(/#말씀묵상/g, '');
        const raw = sanitizeAndSplitSermonText(rawDirty);
        const title = (rec.title || rec.filename || `말씀 강해 ${index + 1}`).replace(/우리들\s*교회|좋은나무교회/g, '').trim();

        let detectedBook = '기타 말씀';
        let detectedChapter = 1;
        let detectedVerse = 1;

        const parsedRef = parseBibleReference(`${rec.main_scripture || ''} ${rec.verse || ''} ${title} ${raw.slice(0, 350)}`);
        if (parsedRef) {
          detectedBook = parsedRef.book;
          detectedChapter = parsedRef.chapter;
          detectedVerse = parsedRef.startVerse;
        }

        const tags = (rec.tags && rec.tags.length > 0 ? rec.tags : ['말씀묵상']).filter((tg) => tg !== '말씀묵상');
        const date = extractStandardDate(rec, title, raw);
        const timestamp = new Date(date).getTime() || 0;
        const year = date.split('-')[0] || '2026';
        const weekNum = getWeekNumber(date) || 1;

        const dayData = (dailyData && dailyData[date]) || {};
        const userQuestions = dayData.applyQuestions || [];
        const parserQuestions = Array.isArray(rec.application_questions) ? rec.application_questions : [];
        const regexQuestions = (raw.match(/(?:적용:|적용 질문:|Q\.|질문:|적용 포인트).*?(?=\n|$)/g) || []).map((q) =>
          q.replace(/^(적용:|적용 질문:|Q\.|질문:|적용 포인트)\s*/, '').trim()
        );
        const mergedQuestions = Array.from(new Set([...userQuestions, ...parserQuestions, ...regexQuestions])).filter(
          (q) => q.length > 4 && !/노션|DB|검수|색인/.test(q)
        );

        const citedVerses = extractVerses(raw);
        const theoTags = extractTheologicalTags(raw);

        return {
          ...rec,
          title,
          date,
          year,
          weekNum,
          preacher: rec.preacher ? rec.preacher.replace(/우리들\s*교회|좋은나무교회/g, '').trim() : '말씀 강해',
          mappedVerse: rec.mappedVerse || `${detectedBook} ${detectedChapter}:${detectedVerse}`,
          detectedBook,
          detectedChapter,
          detectedVerse,
          tags,
          raw_text: raw,
          timestamp,
          questions: mergedQuestions,
          applyQuestions: mergedQuestions,
          completedActions: dayData.completedActions || [],
          actionMemos: dayData.actionMemos || {},
          theoTags: theoTags.length > 0 ? theoTags : tags,
          citedVerses
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sermonData, dailyData]);

  const availableYears = useMemo(() => {
    const years = new Set(enrichedSermonRecords.map((r) => r.year).filter((y) => y && y.length === 4));
    if (years.size === 0) years.add('2026');
    return Array.from(years).sort().reverse();
  }, [enrichedSermonRecords]);

  const yearFilteredRecords = useMemo(() => {
    return enrichedSermonRecords.filter((r) => r.year === selectedYear);
  }, [enrichedSermonRecords, selectedYear]);

  const { weekMatrix, quarterlyAnalytics } = useMemo(() => {
    const sermonsByWeek = new Map();
    yearFilteredRecords.forEach((s) => {
      if (!sermonsByWeek.has(s.weekNum)) sermonsByWeek.set(s.weekNum, []);
      sermonsByWeek.get(s.weekNum).push(s);
    });

    const matrix = Array.from({ length: 52 }, (_, i) => {
      const weekNum = i + 1;
      const sermons = sermonsByWeek.get(weekNum) || [];
      return {
        weekNum,
        quarter: Math.ceil(weekNum / 13),
        dateRange: getWeekDateRange(selectedYear, weekNum),
        sermons,
        hasSermon: sermons.length > 0,
        count: sermons.length,
        primaryBook: sermons[0]?.detectedBook || null
      };
    });

    const quarters = [1, 2, 3, 4].map((q) => {
      const qWeeks = matrix.filter((w) => w.quarter === q);
      const qSermons = qWeeks.flatMap((w) => w.sermons);
      const qBooks = new Map();
      const qThemes = new Map();
      let qOT = 0;
      let qNT = 0;

      qSermons.forEach((s) => {
        qBooks.set(s.detectedBook, (qBooks.get(s.detectedBook) || 0) + 1);
        if (isOTBook(s.detectedBook)) qOT++;
        else qNT++;
        (s.theoTags || []).forEach((tg) => qThemes.set(tg, (qThemes.get(tg) || 0) + 1));
      });

      const topBooks = Array.from(qBooks.entries()).sort((a, b) => b[1] - a[1]);
      const topThemes = Array.from(qThemes.entries()).sort((a, b) => b[1] - a[1]);
      const totalS = qSermons.length;
      const activeWeeks = qWeeks.filter((w) => w.hasSermon).length;

      return {
        quarter: q,
        name: `${q}분기 (${(q - 1) * 3 + 1}~${q * 3}월)`,
        weeksLabel: `${(q - 1) * 13 + 1}W~${q * 13}W`,
        totalSermons: totalS,
        activeWeeks,
        otRate: totalS > 0 ? Math.round((qOT / totalS) * 100) : 0,
        ntRate: totalS > 0 ? Math.round((qNT / totalS) * 100) : 0,
        topBook: topBooks[0]?.[0] || '미정',
        topBookCount: topBooks[0]?.[1] || 0,
        topTheme: topThemes[0]?.[0] || '미정'
      };
    });

    return { weekMatrix: matrix, quarterlyAnalytics: quarters };
  }, [yearFilteredRecords, selectedYear]);

  const {
    bookList,
    tagList,
    citedVerseStats,
    stats,
    trainingStats,
    theologicalStats,
    canonCoverage,
    canonGroupStats,
    spiritualHealthScore,
    monthlyPulseStats,
    annualDiscourseTelemetry
  } = useMemo(() => {
    const books = new Set();
    const tags = new Set();
    const citedVerses = new Map();
    let otCount = 0;
    let ntCount = 0;
    let word = 0;
    let prayer = 0;
    let fellowship = 0;
    let ministry = 0;
    let worship = 0;
    let totalQ = 0;
    let completedQ = 0;

    const canonGroupCounts = {
      모세오경: 0,
      역사서: 0,
      시가서: 0,
      예언서: 0,
      '복음/역사': 0,
      바울서신: 0,
      '공동서신/계시록': 0
    };

    const monthlyPulse = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sermonCount: 0,
      verseCitations: 0
    }));

    const themeCounts = {};

    yearFilteredRecords.forEach((rec) => {
      const book = rec.detectedBook || '기타';
      if (book !== '기타 말씀') {
        books.add(book);
        const grp = getCanonGroup(book);
        if (canonGroupCounts[grp] !== undefined) canonGroupCounts[grp]++;
      }
      if (Array.isArray(rec.tags)) rec.tags.forEach((tg) => { if (tg !== '말씀묵상') tags.add(tg); });
      if (Array.isArray(rec.citedVerses)) rec.citedVerses.forEach((v) => citedVerses.set(v, (citedVerses.get(v) || 0) + 1));
      if (Array.isArray(rec.theoTags)) rec.theoTags.forEach((tg) => { themeCounts[tg] = (themeCounts[tg] || 0) + 1; });

      if (isOTBook(book)) otCount++;
      else ntCount++;

      const m = parseInt(rec.date.split('-')[1], 10);
      if (m >= 1 && m <= 12) {
        monthlyPulse[m - 1].sermonCount++;
        monthlyPulse[m - 1].verseCitations += rec.citedVerses?.length || 0;
      }

      const qCount = rec.applyQuestions.length;
      const cCount = rec.completedActions.length;
      totalQ += qCount;
      completedQ += cCount;

      if (rec.raw_text?.length > 50) word += 5;
      if (qCount > 0) prayer += 10;
      if (rec.theoTags.includes('교회론') || rec.theoTags.includes('언약가정')) fellowship += 15;
      if (rec.title?.includes('예배') || rec.title?.includes('주일')) worship += 10;
      ministry += cCount * 5;
    });

    const totalTestament = otCount + ntCount || 1;
    const otPercent = Math.round((otCount / totalTestament) * 100);
    const ntPercent = Math.round((ntCount / totalTestament) * 100);

    const sortedCitedVerses = Array.from(citedVerses.entries()).sort((a, b) => b[1] - a[1]);
    const normalize = (val) => Math.min(Math.max(val, 5), 100);
    const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const coverage = Math.min(100, Math.round((books.size / 66) * 100));

    const actionRate = totalQ === 0 ? 0 : Math.round((completedQ / totalQ) * 100);
    const balancePenalty = Math.abs(50 - ntPercent) * 0.4;
    const healthScore = Math.min(100, Math.max(30, Math.round(coverage * 0.4 + actionRate * 0.4 + 20 - balancePenalty)));

    const canonTotal = Object.values(canonGroupCounts).reduce((a, b) => a + b, 0) || 1;
    const groupStats = Object.entries(canonGroupCounts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / canonTotal) * 100) }))
      .sort((a, b) => b.count - a.count);

    const sortedBooks = Array.from(books).sort();

    return {
      bookList: sortedBooks,
      tagList: Array.from(tags).sort(),
      citedVerseStats: sortedCitedVerses,
      stats: { otPercent, ntPercent },
      trainingStats: {
        word: normalize(word),
        prayer: normalize(prayer),
        fellowship: normalize(fellowship),
        ministry: normalize(ministry),
        worship: normalize(worship),
        totalQ,
        completedQ,
        completionRate: actionRate
      },
      theologicalStats: sortedThemes,
      canonCoverage: coverage,
      canonGroupStats: groupStats,
      spiritualHealthScore: healthScore,
      monthlyPulseStats: monthlyPulse,
      annualDiscourseTelemetry: {
        totalVersesCited: sortedCitedVerses.reduce((acc, cur) => acc + cur[1], 0),
        topBook: sortedBooks[0] || '갈라디아서'
      }
    };
  }, [yearFilteredRecords]);

  const currentWeekCurriculum = DISCIPLESHIP_12WEEKS_CURRICULUM[selectedWeek] || DISCIPLESHIP_12WEEKS_CURRICULUM[1];

  const matchedSermonReferences = useMemo(() => {
    return enrichedSermonRecords
      .map((r) => {
        let score = 0;
        if (r.theoTags && r.theoTags.includes(currentWeekCurriculum.themeKey)) score += 100;
        if (currentWeekCurriculum.keywords) {
          currentWeekCurriculum.keywords.forEach((kw) => {
            if (r.title && r.title.includes(kw)) score += 30;
            if (r.raw_text) {
              const matches = r.raw_text.match(new RegExp(kw, 'gi'));
              if (matches) score += matches.length * 3;
            }
          });
        }
        return { ...r, relevanceScore: score };
      })
      .filter((r) => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore || b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [enrichedSermonRecords, currentWeekCurriculum]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return enrichedSermonRecords.filter((rec) => {
      const matchesSearch =
        !term ||
        rec.title?.toLowerCase().includes(term) ||
        rec.preacher?.toLowerCase().includes(term) ||
        rec.date?.includes(term) ||
        rec.detectedBook?.toLowerCase().includes(term) ||
        rec.raw_text?.toLowerCase().includes(term);
      const matchesBook = selectedBook === 'all' || rec.detectedBook === selectedBook;
      const matchesTag = selectedTag === 'all' || (Array.isArray(rec.tags) && rec.tags.includes(selectedTag));
      const matchesDate = !filterMonth || rec.date.startsWith(filterMonth);
      return matchesSearch && matchesBook && matchesTag && matchesDate;
    });
  }, [enrichedSermonRecords, searchTerm, selectedBook, selectedTag, filterMonth]);

  // 글로벌 SaaS 3색 조화 토큰 (다크/라이트 100% 호환)
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const inputClass = isDark
    ? 'bg-[#20242E] border-[#262B36] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#2563EB]'
    : 'bg-[#F8F9FA] border-[#E5E8EC] text-[#191F28] placeholder:text-[#94A3B8] focus:border-[#2563EB]';

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full text-[13px] ${pageBg} ${textSub}`}>
        설교 강해 데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 flex flex-col h-full w-full overflow-hidden font-sans select-none ${pageBg} ${textMain}`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 슬림 상단 고정 헤더 & 탭 */}
      <header className={`px-3 sm:px-5 py-2.5 border-b ${borderClass} ${surfaceBg} shrink-0 z-20 space-y-2`}>
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 ${textMain}`}
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <ChurchSketchIcon name="chart" className="w-5 h-5 shrink-0" isDarkMode={isDark} />
            <h1 className="text-[15.5px] font-bold tracking-tight truncate">설교 분석 · 영성훈련</h1>
          </div>

          <div className={`hidden sm:flex p-0.5 rounded-lg ${subBg} border ${borderClass} text-[12px] font-bold`}>
            {[
              { id: 'dashboard', label: '연간 분석' },
              { id: 'training', label: '셀프 영성훈련' },
              { id: 'list', label: '강해 검색' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
                  activeTab === tab.id ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 모바일 전용 3단 탭 */}
        <div className={`grid grid-cols-3 sm:hidden p-0.5 rounded-xl ${subBg} border ${borderClass} text-[12px] font-bold`}>
          {[
            { id: 'dashboard', label: '연간 분석' },
            { id: 'training', label: '영성훈련' },
            { id: 'list', label: '강해 검색' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeTab === tab.id ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. 메인 스크롤 뷰포트 (위에서 아래로 흐르는 구조) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-3.5 text-left">
          {/* TAB 1: 연간 분석 대시보드 */}
          {activeTab === 'dashboard' && (
            <>
              {/* 연도 선택 바 */}
              <div className={`p-3 rounded-xl border ${borderClass} ${surfaceBg} flex items-center justify-between gap-2`}>
                <span className="text-[13px] font-bold">기준 연도</span>
                <div className="flex gap-1">
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setSelectedYear(y)}
                      className={`px-3 py-1 rounded-lg text-[12px] font-mono font-bold cursor-pointer ${
                        selectedYear === y ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub}`
                      }`}
                    >
                      {y}년
                    </button>
                  ))}
                </div>
              </div>

              {/* 4대 핵심 KPI 카드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1.5`}>
                  <span className={`text-[11px] font-bold ${textSub} block`}>영적 담론 건전성</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[26px] font-mono font-bold text-[#0D9488]">{spiritualHealthScore}</span>
                    <span className={`text-[11.5px] font-mono ${textSub}`}>/100</span>
                  </div>
                  <p className={`text-[11px] ${textSub}`}>캐논 범위 · 실천 가중치</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${textSub}`}>강해 커버리지</span>
                    <span className="text-[11px] font-mono font-bold text-[#2563EB]">{bookList.length}/66권</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[26px] font-mono font-bold text-[#2563EB]">{canonCoverage}</span>
                    <span className={`text-[12px] font-mono ${textSub}`}>%</span>
                  </div>
                  <p className={`text-[11px] ${textSub} truncate`}>주력: {annualDiscourseTelemetry.topBook}</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1.5`}>
                  <span className={`text-[11px] font-bold ${textSub} block`}>신구약 말씀 비중</span>
                  <div className="flex items-baseline justify-between font-mono font-bold text-[15px] pt-1">
                    <span className="text-[#D97706]">구약 {stats.otPercent}%</span>
                    <span className="text-[#2563EB]">신약 {stats.ntPercent}%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${subBg}`}>
                    <div className="bg-[#D97706] h-full" style={{ width: `${stats.otPercent}%` }} />
                    <div className="bg-[#2563EB] h-full" style={{ width: `${stats.ntPercent}%` }} />
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${textSub}`}>적용 실천 완수율</span>
                    <span className="text-[11px] font-mono font-bold text-[#0D9488]">
                      {trainingStats.completedQ}/{trainingStats.totalQ}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[26px] font-mono font-bold text-[#0D9488]">{trainingStats.completionRate}</span>
                    <span className={`text-[12px] font-mono ${textSub}`}>%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${subBg}`}>
                    <div className="bg-[#0D9488] h-full" style={{ width: `${trainingStats.completionRate}%` }} />
                  </div>
                </div>
              </div>

              {/* 52주 연간 강해 히트맵 (모바일 가로 스크롤 보호) */}
              <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[14.5px] font-bold">{selectedYear}년 52주 강해 히트맵</h2>
                    <p className={`text-[11.5px] ${textSub}`}>주차 타일을 누르면 해당 주간의 설교 목록을 바로 확인합니다.</p>
                  </div>
                  <div className={`flex items-center gap-3 text-[11px] ${textSub}`}>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />강해 주간</span>
                    <span className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-xs ${subBg}`} />대기 주간</span>
                  </div>
                </div>

                <div className="overflow-x-auto hide-scrollbar pb-1">
                  <div className="min-w-[560px] space-y-2">
                    {[
                      { quarter: 1, start: 1, label: '1분기 (1~13W)' },
                      { quarter: 2, start: 14, label: '2분기 (14~26W)' },
                      { quarter: 3, start: 27, label: '3분기 (27~39W)' },
                      { quarter: 4, start: 40, label: '4분기 (40~52W)' }
                    ].map(({ quarter, start, label }) => (
                      <div key={quarter} className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-bold w-24 shrink-0 ${textSub}`}>{label}</span>
                        <div className="flex-1 grid grid-cols-13 gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                          {Array.from({ length: 13 }, (_, idx) => {
                            const weekNum = start + idx;
                            const tile = weekMatrix[weekNum - 1];
                            const has = tile?.hasSermon;
                            return (
                              <button
                                key={weekNum}
                                type="button"
                                onClick={() => has && setWeekDetailModal(tile)}
                                className={`p-1 rounded-lg border text-center min-h-[42px] flex flex-col items-center justify-center transition-colors ${
                                  has
                                    ? 'bg-[#2563EB]/12 border-[#2563EB]/40 text-[#2563EB] cursor-pointer hover:bg-[#2563EB]/20'
                                    : `${subBg} ${borderClass} ${textSub} opacity-45`
                                }`}
                              >
                                <span className="text-[9px] font-mono opacity-75">{weekNum}W</span>
                                <span className="text-[10.5px] font-bold truncate max-w-full">
                                  {has ? tile.primaryBook.slice(0, 2) : '-'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 분기별(Q1~Q4) 요약 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {quarterlyAnalytics.map((q) => (
                  <div key={q.quarter} className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#2563EB]">{q.weeksLabel}</span>
                      <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${subBg} ${textSub}`}>{q.activeWeeks}주 가동</span>
                    </div>
                    <h3 className="text-[14px] font-bold">{q.name}</h3>
                    <div className={`space-y-1 text-[12px] ${textSub}`}>
                      <div className="flex justify-between">
                        <span>강해 수</span>
                        <b className={textMain}>{q.totalSermons}편</b>
                      </div>
                      <div className="flex justify-between">
                        <span>주력 본문</span>
                        <b className="text-[#2563EB]">{q.topBook} ({q.topBookCount})</b>
                      </div>
                      <div className="flex justify-between">
                        <span>핵심 테마</span>
                        <b className="text-[#0D9488]">#{q.topTheme}</b>
                      </div>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${subBg}`}>
                      <div className="bg-[#D97706] h-full" style={{ width: `${q.otRate}%` }} />
                      <div className="bg-[#2563EB] h-full" style={{ width: `${q.ntRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 성경 7대 문맥 & 월별 펄스 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <h3 className="text-[14px] font-bold">성경 7대 문맥 분류군</h3>
                  <div className="space-y-2">
                    {canonGroupStats.map((grp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="font-bold">{grp.name}</span>
                          <span className={`font-mono ${textSub}`}>{grp.count}편 ({grp.pct}%)</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${subBg}`}>
                          <div className="h-full bg-[#2563EB]" style={{ width: `${grp.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} flex flex-col justify-between space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold">{selectedYear}년 월별 강해 추이</h3>
                    <span className={`text-[11.5px] font-mono ${textSub}`}>인용 {annualDiscourseTelemetry.totalVersesCited}회</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5 items-end h-36 pt-2">
                    {monthlyPulseStats.map((item) => {
                      const maxVal = Math.max(...monthlyPulseStats.map((m) => m.sermonCount), 1);
                      const heightPct = Math.max(12, Math.round((item.sermonCount / maxVal) * 100));
                      return (
                        <div key={item.month} className="flex flex-col items-center gap-1 h-full justify-end">
                          <span className={`text-[9.5px] font-mono font-bold ${textSub}`}>{item.sermonCount > 0 ? item.sermonCount : ''}</span>
                          <div
                            className={`w-full rounded-t ${item.sermonCount > 0 ? 'bg-[#0D9488]' : subBg}`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className={`text-[9.5px] font-mono ${textSub}`}>{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* 신학 테마 & 최다 인용 구절 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <h3 className="text-[14px] font-bold">핵심 신학 테마 Top 6</h3>
                  <div className="space-y-2">
                    {theologicalStats.map(([theme, count], idx) => {
                      const pct = Math.round((count / (theologicalStats[0]?.[1] || 1)) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[12px]">
                            <span className="font-bold">#{theme}</span>
                            <span className="font-mono font-bold text-[#0D9488]">{count}회</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${subBg}`}>
                            <div className="bg-[#0D9488] h-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className={`p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-2.5`}>
                  <h3 className="text-[14px] font-bold">최다 인용 구절</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {citedVerseStats.slice(0, 18).map(([verse, count], idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchTerm(verse);
                          setActiveTab('list');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border ${borderClass} ${subBg} hover:border-[#2563EB] cursor-pointer flex items-center gap-1`}
                      >
                        <span>{verse}</span>
                        <span className="font-mono text-[#2563EB] font-bold text-[10px]">({count})</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 2: 셀프 영성훈련 */}
          {activeTab === 'training' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              <aside className={`lg:col-span-4 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-4`}>
                <div className={`flex items-center justify-between pb-2.5 border-b ${borderClass}`}>
                  <span className="text-[14px] font-bold">12주 영성훈련 코스</span>
                  <button
                    type="button"
                    onClick={() => setIsSecretMode(!isSecretMode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${borderClass} ${subBg} flex items-center gap-1 cursor-pointer`}
                  >
                    {isSecretMode ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isSecretMode ? '보안 ON' : '일반'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeek(w)}
                      className={`py-2 rounded-lg text-[12px] font-mono font-bold cursor-pointer transition-colors ${
                        selectedWeek === w ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub}`
                      }`}
                    >
                      {w}주
                    </button>
                  ))}
                </div>

                <div className={`pt-3 border-t ${borderClass} space-y-2`}>
                  <span className={`text-[12px] font-bold ${textSub} block`}>영적 성장 5대 밸런스</span>
                  {[
                    { label: '말씀 (Word)', val: trainingStats.word },
                    { label: '기도 (Prayer)', val: trainingStats.prayer },
                    { label: '예배 (Worship)', val: trainingStats.worship },
                    { label: '사랑 (Fellowship)', val: trainingStats.fellowship },
                    { label: '실천 (Practice)', val: trainingStats.ministry }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11.5px]">
                        <span className="font-medium">{item.label}</span>
                        <span className={`font-mono ${textSub}`}>{item.val}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${subBg}`}>
                        <div className="h-full bg-[#2563EB]" style={{ width: `${item.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <section className={`lg:col-span-8 p-4 rounded-xl border ${borderClass} ${surfaceBg} space-y-4`}>
                <div className={`pb-3 border-b ${borderClass} space-y-1`}>
                  <span className="text-[11px] font-mono font-bold text-[#2563EB]">
                    WEEK {selectedWeek} · #{currentWeekCurriculum.themeKey}
                  </span>
                  <h2 className="text-[18px] font-bold leading-snug">{currentWeekCurriculum.title}</h2>
                  <p className="text-[13px] font-bold text-[#0D9488]">{currentWeekCurriculum.verse}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-1`}>
                    <span className={`text-[10.5px] font-mono font-bold ${textSub} block`}>신학적 배경</span>
                    <p className="text-[13px] leading-relaxed">{currentWeekCurriculum.academicContext}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-1`}>
                    <span className={`text-[10.5px] font-mono font-bold ${textSub} block`}>실천 원리</span>
                    <p className="text-[13px] font-bold leading-relaxed">{currentWeekCurriculum.principle}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold">주차별 심층 성찰 기록</span>
                    <span className={`text-[11px] ${textSub}`}>자동 저장</span>
                  </div>
                  <p className={`text-[12px] ${textSub}`}>{currentWeekCurriculum.reportPrompt}</p>
                  <textarea
                    rows={4}
                    value={reportData[selectedWeek] || ''}
                    onChange={(e) => handleSaveReport(selectedWeek, e.target.value)}
                    placeholder="말씀에 근거하여 삶의 해석과 결단을 기록하세요..."
                    className={`w-full p-3 text-[13.5px] leading-relaxed rounded-xl border outline-none resize-none select-text ${inputClass} ${
                      isSecretMode ? 'blur-xs hover:blur-none transition-all' : ''
                    }`}
                  />
                </div>

                <div className={`pt-3 border-t ${borderClass} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-bold">연계 강해 실천 일지</span>
                    <span className={`text-[11.5px] font-mono ${textSub}`}>{matchedSermonReferences.length}편 매칭</span>
                  </div>

                  {matchedSermonReferences.length === 0 ? (
                    <div className={`p-8 text-center text-[13px] ${textSub} border border-dashed ${borderClass} rounded-xl`}>
                      현재 주차 테마와 매칭된 강해가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {matchedSermonReferences.map((sermon, sIdx) => (
                        <div key={sIdx} className={`p-3.5 rounded-xl border ${borderClass} ${subBg} space-y-2.5`}>
                          <div className={`flex items-center justify-between gap-2 pb-2 border-b ${borderClass}`}>
                            <div className="min-w-0">
                              <span className={`text-[10.5px] font-mono ${textSub} block`}>{sermon.date}</span>
                              <span className="text-[13.5px] font-bold truncate block">{sermon.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSermonPopup(sermon)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${borderClass} ${surfaceBg} cursor-pointer`}
                              >
                                전문
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const shareText = `[영성훈련 ${selectedWeek}주차]\n${sermon.title}\n` + (sermon.applyQuestions || []).map((q, i) => `${i + 1}. ${q}`).join('\n');
                                  navigator.clipboard.writeText(shareText);
                                  showToast('묵상 나눔 텍스트가 복사되었습니다.');
                                }}
                                className={`p-1.5 rounded-lg border ${borderClass} ${surfaceBg} cursor-pointer`}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {(sermon.applyQuestions || []).map((qText, qIdx) => {
                              const isDone = (sermon.completedActions || []).includes(qIdx);
                              const savedMemo = (sermon.actionMemos && sermon.actionMemos[qIdx]) || '';
                              return (
                                <div key={qIdx} className={`p-2.5 rounded-lg border ${borderClass} ${surfaceBg} space-y-2`}>
                                  <div className="flex items-start gap-2 cursor-pointer" onClick={() => toggleAction(sermon.date, qIdx)}>
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                        isDone ? 'bg-[#0D9488] border-[#0D9488] text-white' : borderClass
                                      }`}
                                    >
                                      {isDone && <Check className="w-3 h-3" />}
                                    </div>
                                    <p className={`text-[12.5px] leading-snug ${isDone ? 'line-through opacity-55' : ''} ${isSecretMode ? 'blur-xs' : ''}`}>
                                      {qText}
                                    </p>
                                  </div>
                                  {isDone && (
                                    <textarea
                                      rows={2}
                                      defaultValue={savedMemo}
                                      onBlur={(e) => handleSaveActionMemo(sermon.date, qIdx, e.target.value)}
                                      placeholder="실천한 내용과 은혜를 기록하세요..."
                                      className={`w-full p-2 text-[12px] rounded-lg border outline-none select-text ${inputClass}`}
                                    />
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
              </section>
            </div>
          )}

          {/* TAB 3: 강해 검색 */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className={`p-3.5 rounded-xl border ${borderClass} ${surfaceBg} space-y-2`}>
                <div className={`flex items-center gap-2 px-3 h-10 rounded-xl border ${inputClass}`}>
                  <Search className={`w-4 h-4 ${textSub} shrink-0`} />
                  <input
                    type="text"
                    placeholder="강해 제목, 성경 구절, 키워드 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent outline-none text-[13.5px] select-text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className={`h-9 px-2.5 rounded-lg text-[12.5px] font-mono border outline-none cursor-pointer ${inputClass}`}
                  />
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    className={`h-9 px-2.5 rounded-lg text-[12.5px] border outline-none cursor-pointer ${inputClass}`}
                  >
                    <option value="all">전체 성경 66권</option>
                    {bookList.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className={`h-9 px-2.5 rounded-lg text-[12.5px] border outline-none cursor-pointer ${inputClass}`}
                  >
                    <option value="all">전체 신학 테마</option>
                    {tagList.map((tg) => (
                      <option key={tg} value={tg}>#{tg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(searchTerm || selectedBook !== 'all' || selectedTag !== 'all' || filterMonth) && (
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] ${subBg}`}>
                  <span>조회된 강해 <b>{filteredRecords.length}</b>편</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedBook('all');
                      setSelectedTag('all');
                      setFilterMonth('');
                    }}
                    className="font-bold text-[#2563EB] cursor-pointer"
                  >
                    필터 초기화
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.length === 0 ? (
                  <div className={`col-span-full py-14 text-center text-[13px] ${textSub} border border-dashed ${borderClass} rounded-xl`}>
                    조건에 일치하는 강해 기록이 없습니다.
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
                      onCopyToast={showToast}
                      isDark={isDark}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. 52주 주차 상세 모달 */}
      {weekDetailModal && (
        <div
          onClick={() => setWeekDetailModal(null)}
          className="fixed inset-0 bg-black/60 z-[1050] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[82vh] overflow-hidden`}
          >
            <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center shrink-0`}>
              <div className="text-left">
                <span className="text-[11px] font-mono font-bold text-[#2563EB]">
                  {selectedYear}년 {weekDetailModal.weekNum}주차 ({weekDetailModal.dateRange})
                </span>
                <h3 className="font-bold text-[15px]">수록된 강해 ({weekDetailModal.sermons.length}편)</h3>
              </div>
              <button type="button" onClick={() => setWeekDetailModal(null)} className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 text-left hide-scrollbar">
              {weekDetailModal.sermons.map((s, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border ${borderClass} ${subBg} space-y-1.5`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className={`text-[11px] font-mono ${textSub}`}>{s.date}</span>
                      <h4 className="text-[14px] font-bold">{s.title}</h4>
                      <span className="text-[12px] font-bold text-[#0D9488]">{s.detectedBook} {s.detectedChapter}장</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSermonPopup(s);
                        setWeekDetailModal(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold bg-[#2563EB] text-white cursor-pointer shrink-0"
                    >
                      전문 보기
                    </button>
                  </div>
                  <p className={`text-[12.5px] ${textSub} line-clamp-2 leading-relaxed`}>
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
        <div
          onClick={() => setSermonPopup(null)}
          className="fixed inset-0 bg-black/65 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[86vh] overflow-hidden`}
          >
            <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center shrink-0 gap-2`}>
              <div className="text-left min-w-0">
                <span className={`text-[11px] font-mono ${textSub}`}>{sermonPopup.date}</span>
                <h3 className="font-bold text-[15px] truncate">{sermonPopup.title}</h3>
              </div>
              <button type="button" onClick={() => setSermonPopup(null)} className={`p-1.5 rounded-lg ${subBg} cursor-pointer shrink-0`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto hide-scrollbar space-y-3 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-[#2563EB]/10 text-[#2563EB]">
                    {sermonPopup.detectedBook} {sermonPopup.detectedChapter || 1}장
                  </span>
                  {(sermonPopup.theoTags || []).map((tag, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${subBg} ${textSub}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenInterlinearModal(sermonPopup.detectedBook, sermonPopup.detectedChapter || 1, sermonPopup.detectedVerse || 1);
                    setSermonPopup(null);
                  }}
                  className="px-3 py-1 rounded-lg text-[11.5px] font-bold bg-[#0D9488] text-white cursor-pointer"
                >
                  원어 연동
                </button>
              </div>

              <SermonContentParser
                text={(sermonPopup.raw_text || '').replace(/#말씀묵상/g, '')}
                searchTerm={searchTerm}
                isDark={isDark}
                onVerseClick={setPopupVerse}
                onOpenInterlinear={(b, c, v) => {
                  handleOpenInterlinearModal(b, c, v);
                  setSermonPopup(null);
                }}
                activeReference={{
                  book: sermonPopup.detectedBook,
                  chapter: sermonPopup.detectedChapter || 1,
                  verse: sermonPopup.detectedVerse || 1
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. 성경 구절 인라인 팝업 모달 */}
      {popupVerse && (
        <div
          onClick={() => setPopupVerse(null)}
          className="fixed inset-0 bg-black/65 z-[1150] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[75vh] overflow-hidden`}
          >
            <div className={`px-4 py-3 border-b ${borderClass} flex justify-between items-center shrink-0`}>
              <h3 className="font-bold text-[15px]">{popupVerse}</h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseBibleReference(popupVerse);
                    handleOpenInterlinearModal(parsed?.book || '야고보서', parsed?.chapter || 1, parsed?.startVerse || 1);
                    setPopupVerse(null);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0D9488] text-white cursor-pointer"
                >
                  원어 연동
                </button>
                <button type="button" onClick={() => setPopupVerse(null)} className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto hide-scrollbar text-left">
              <p className="text-[14px] leading-[1.9] whitespace-pre-wrap break-keep">{popupVerseText}</p>
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
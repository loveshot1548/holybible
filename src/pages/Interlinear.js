// src/pages/Interlinear.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Volume2,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import ChurchSketchIcon from '../components/ChurchSketchIcon';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import { tokenizeGrammarCode } from '../lib/biblicalGrammarWiki';
import GrammarWikiModal from '../lib/GrammarWikiModal';
import { supabase } from '../lib/supabase';
import { ensureKrv4TxtLoaded, splitPericopeAndVerse } from '../pages/Bible';

// =====================================================================
// 성경 66권 정경 마스터 데이터 (구약 39권 / 신약 27권, 1,189장)
// =====================================================================
export const BIBLE_66_BOOKS = [
  { ko: '창세기', en: 'Genesis', abbr: '창', isOT: true, maxChap: 50, section: '모세오경', era: 'B.C. 1446년경 (창조~족장 시대)', empire: '원역사 / 애굽 중왕국' },
  { ko: '출애굽기', en: 'Exodus', abbr: '출', isOT: true, maxChap: 40, section: '모세오경', era: 'B.C. 1446년경 (출애굽과 광야 여정)', empire: '애굽 신왕국(18왕조)' },
  { ko: '레위기', en: 'Leviticus', abbr: '레', isOT: true, maxChap: 27, section: '모세오경', era: 'B.C. 1445년경 (시내산 율법 수여)', empire: '애굽 신왕국' },
  { ko: '민수기', en: 'Numbers', abbr: '민', isOT: true, maxChap: 36, section: '모세오경', era: 'B.C. 1445-1406 (40년 광야 방랑)', empire: '가나안 진입기' },
  { ko: '신명기', en: 'Deuteronomy', abbr: '신', isOT: true, maxChap: 34, section: '모세오경', era: 'B.C. 1406년경 (모압 평지 고별 설교)', empire: '고대 근동 정복기' },
  { ko: '여호수아', en: 'Joshua', abbr: '수', isOT: true, maxChap: 24, section: '역사서', era: 'B.C. 1406-1375 (가나안 정복과 분배)', empire: '가나안 도시국가기' },
  { ko: '사사기', en: 'Judges', abbr: '삿', isOT: true, maxChap: 21, section: '역사서', era: 'B.C. 1375-1050 (사사 통치기)', empire: '블레셋 / 가나안 족속' },
  { ko: '룻기', en: 'Ruth', abbr: '룻', isOT: true, maxChap: 4, section: '역사서', era: 'B.C. 1100년경 (사사 시대 말기)', empire: '사사 시대' },
  { ko: '사무엘상', en: '1 Samuel', abbr: '삼상', isOT: true, maxChap: 31, section: '역사서', era: 'B.C. 1050-1010 (왕정 수립과 사울 통치)', empire: '통일왕국 태동기' },
  { ko: '사무엘하', en: '2 Samuel', abbr: '삼하', isOT: true, maxChap: 24, section: '역사서', era: 'B.C. 1010-970 (다윗 왕조의 번영)', empire: '이스라엘 통일왕국' },
  { ko: '열왕기상', en: '1 Kings', abbr: '왕상', isOT: true, maxChap: 22, section: '역사서', era: 'B.C. 970-853 (솔로몬과 분열왕국 초기)', empire: '남북 분열왕국기' },
  { ko: '열왕기하', en: '2 Kings', abbr: '왕하', isOT: true, maxChap: 25, section: '역사서', era: 'B.C. 853-586 (북이스라엘/남유다 멸망)', empire: '앗수르 / 신바벨론' },
  { ko: '역대상', en: '1 Chronicles', abbr: '대상', isOT: true, maxChap: 29, section: '역사서', era: 'B.C. 450년경 기록 (다윗 언약 계승)', empire: '페르시아 제국' },
  { ko: '역대하', en: '2 Chronicles', abbr: '대하', isOT: true, maxChap: 36, section: '역사서', era: 'B.C. 450년경 기록 (솔로몬 성전~귀환령)', empire: '페르시아 제국' },
  { ko: '에스라', en: 'Ezra', abbr: '스', isOT: true, maxChap: 10, section: '역사서', era: 'B.C. 538-450 (1·2차 포로 귀환)', empire: '페르시아 제국' },
  { ko: '느헤미야', en: 'Nehemiah', abbr: '느', isOT: true, maxChap: 13, section: '역사서', era: 'B.C. 445-420 (3차 귀환과 성벽 재건)', empire: '페르시아 제국' },
  { ko: '에스더', en: 'Esther', abbr: '에', isOT: true, maxChap: 10, section: '역사서', era: 'B.C. 483-473 (페르시아 수산궁 구원)', empire: '페르시아 제국' },
  { ko: '욥기', en: 'Job', abbr: '욥', isOT: true, maxChap: 42, section: '시가서', era: 'B.C. 2000년경 배경 (족장 시대 고난)', empire: '우르 제3왕조 / 족장 시대' },
  { ko: '시편', en: 'Psalms', abbr: '시', isOT: true, maxChap: 150, section: '시가서', era: 'B.C. 1410-430 (모세~포로 귀환기)', empire: '통일왕국 / 포로후기' },
  { ko: '잠언', en: 'Proverbs', abbr: '잠', isOT: true, maxChap: 31, section: '시가서', era: 'B.C. 970-700 (솔로몬과 히스기야 시대)', empire: '이스라엘 왕정기' },
  { ko: '전도서', en: 'Ecclesiastes', abbr: '전', isOT: true, maxChap: 12, section: '시가서', era: 'B.C. 935년경 (솔로몬 노년의 지혜)', empire: '이스라엘 왕정기' },
  { ko: '아가', en: 'Song of Solomon', abbr: '아', isOT: true, maxChap: 8, section: '시가서', era: 'B.C. 960년경 (언약적 사랑)', empire: '이스라엘 왕정기' },
  { ko: '이사야', en: 'Isaiah', abbr: '사', isOT: true, maxChap: 66, section: '선지서', era: 'B.C. 740-681 (남유다 4대 왕기 예언)', empire: '앗수르 제국 발흥기' },
  { ko: '예레미야', en: 'Jeremiah', abbr: '렘', isOT: true, maxChap: 52, section: '선지서', era: 'B.C. 627-580 (예루살렘 함락기)', empire: '신바벨론 제국' },
  { ko: '예레미야애가', en: 'Lamentations', abbr: '애', isOT: true, maxChap: 5, section: '선지서', era: 'B.C. 586년경 (예루살렘 파괴 비가)', empire: '신바벨론 제국' },
  { ko: '에스겔', en: 'Ezekiel', abbr: '겔', isOT: true, maxChap: 48, section: '선지서', era: 'B.C. 593-571 (그발 강가 포로지)', empire: '신바벨론 제국' },
  { ko: '다니엘', en: 'Daniel', abbr: '단', isOT: true, maxChap: 12, section: '선지서', era: 'B.C. 605-536 (바벨론/페르시아 궁정)', empire: '바벨론 / 메대-페르시아' },
  { ko: '호세아', en: 'Hosea', abbr: '호', isOT: true, maxChap: 14, section: '선지서', era: 'B.C. 755-715 (북이스라엘 말기)', empire: '앗수르 침공기' },
  { ko: '요엘', en: 'Joel', abbr: '욜', isOT: true, maxChap: 3, section: '선지서', era: 'B.C. 835년경 (여호와의 날)', empire: '남유다 요아스 왕조' },
  { ko: '아모스', en: 'Amos', abbr: '암', isOT: true, maxChap: 9, section: '선지서', era: 'B.C. 760-750 (여로보암 2세 번영기)', empire: '남북 왕국 전성기' },
  { ko: '오바댜', en: 'Obadiah', abbr: '옵', isOT: true, maxChap: 1, section: '선지서', era: 'B.C. 586년경 (에돔 심판 선고)', empire: '신바벨론 제국기' },
  { ko: '요나', en: 'Jonah', abbr: '욘', isOT: true, maxChap: 4, section: '선지서', era: 'B.C. 780-760 (니느웨 회개)', empire: '앗수르 제국' },
  { ko: '미가', en: 'Micah', abbr: '미', isOT: true, maxChap: 7, section: '선지서', era: 'B.C. 735-700 (베들레헴 탄생 예언)', empire: '앗수르 위협기' },
  { ko: '나훔', en: 'Nahum', abbr: '나', isOT: true, maxChap: 3, section: '선지서', era: 'B.C. 663-612 (니느웨 몰락)', empire: '앗수르 제국 멸망기' },
  { ko: '하박국', en: 'Habakkuk', abbr: '합', isOT: true, maxChap: 3, section: '선지서', era: 'B.C. 607년경 (의인은 믿음으로 살리라)', empire: '갈대아(바벨론) 발흥기' },
  { ko: '스바냐', en: 'Zephaniah', abbr: '습', isOT: true, maxChap: 3, section: '선지서', era: 'B.C. 630년경 (요시야 종교개혁)', empire: '신바벨론 제국 전야' },
  { ko: '학개', en: 'Haggai', abbr: '학', isOT: true, maxChap: 2, section: '선지서', era: 'B.C. 520년 (제2성전 재건 촉구)', empire: '페르시아 제국' },
  { ko: '스가랴', en: 'Zechariah', abbr: '슥', isOT: true, maxChap: 14, section: '선지서', era: 'B.C. 520-480 (메시아 왕국 예언)', empire: '페르시아 제국' },
  { ko: '말라기', en: 'Malachi', abbr: '말', isOT: true, maxChap: 4, section: '선지서', era: 'B.C. 430년경 (구약 마지막 선지자)', empire: '페르시아 제국' },
  { ko: '마태복음', en: 'Matthew', abbr: '마', isOT: false, maxChap: 28, section: '복음서', era: 'A.D. 55-65년경 (유대인을 위한 메시아)', empire: '로마 제국' },
  { ko: '마가복음', en: 'Mark', abbr: '막', isOT: false, maxChap: 16, section: '복음서', era: 'A.D. 50-60년경 (고난받는 종 예수)', empire: '로마 제국' },
  { ko: '누가복음', en: 'Luke', abbr: '눅', isOT: false, maxChap: 24, section: '복음서', era: 'A.D. 60-62년경 (인자로 오신 구주)', empire: '로마 제국' },
  { ko: '요한복음', en: 'John', abbr: '요', isOT: false, maxChap: 21, section: '복음서', era: 'A.D. 85-90년경 (말씀이 육신이 되심)', empire: '로마 제국' },
  { ko: '사도행전', en: 'Acts', abbr: '행', isOT: false, maxChap: 28, section: '역사서', era: 'A.D. 62-64년경 (성령의 행전)', empire: '로마 제국' },
  { ko: '로마서', en: 'Romans', abbr: '롬', isOT: false, maxChap: 16, section: '서신서', era: 'A.D. 57년경 (고린도 집필, 이신칭의)', empire: '로마 제국' },
  { ko: '고린도전서', en: '1 Corinthians', abbr: '고전', isOT: false, maxChap: 16, section: '서신서', era: 'A.D. 55년경 (에베소 집필)', empire: '로마 제국' },
  { ko: '고린도후서', en: '2 Corinthians', abbr: '고후', isOT: false, maxChap: 13, section: '서신서', era: 'A.D. 56년경 (마게도냐 집필)', empire: '로마 제국' },
  { ko: '갈라디아서', en: 'Galatians', abbr: '갈', isOT: false, maxChap: 6, section: '서신서', era: 'A.D. 48-49년경 (오직 은혜)', empire: '로마 제국' },
  { ko: '에베소서', en: 'Ephesians', abbr: '엡', isOT: false, maxChap: 6, section: '서신서', era: 'A.D. 60-62년경 (로마 옥중, 교회론)', empire: '로마 제국' },
  { ko: '빌립보서', en: 'Philippians', abbr: '빌', isOT: false, maxChap: 4, section: '서신서', era: 'A.D. 61-62년경 (주 안의 기쁨)', empire: '로마 제국' },
  { ko: '골로새서', en: 'Colossians', abbr: '골', isOT: false, maxChap: 4, section: '서신서', era: 'A.D. 60-62년경 (만유의 으뜸 그리스도)', empire: '로마 제국' },
  { ko: '데살로니가전서', en: '1 Thessalonians', abbr: '살전', isOT: false, maxChap: 5, section: '서신서', era: 'A.D. 51년경 (재림의 소망)', empire: '로마 제국' },
  { ko: '데살로니가후서', en: '2 Thessalonians', abbr: '살후', isOT: false, maxChap: 3, section: '서신서', era: 'A.D. 51-52년경 (주의 날)', empire: '로마 제국' },
  { ko: '디모데전서', en: '1 Timothy', abbr: '딤전', isOT: false, maxChap: 6, section: '서신서', era: 'A.D. 63-65년경 (목회 규범)', empire: '로마 제국' },
  { ko: '디모데후서', en: '2 Timothy', abbr: '딤후', isOT: false, maxChap: 4, section: '서신서', era: 'A.D. 66-67년경 (바울의 유언)', empire: '로마 제국' },
  { ko: '디도서', en: 'Titus', abbr: '딛', isOT: false, maxChap: 3, section: '서신서', era: 'A.D. 63-65년경 (그레데 목회 지침)', empire: '로마 제국' },
  { ko: '빌레몬서', en: 'Philemon', abbr: '몬', isOT: false, maxChap: 1, section: '서신서', era: 'A.D. 60-62년경 (용서와 형제애)', empire: '로마 제국' },
  { ko: '히브리서', en: 'Hebrews', abbr: '히', isOT: false, maxChap: 13, section: '서신서', era: 'A.D. 67-69년경 (대제사장 그리스도)', empire: '로마 제국' },
  { ko: '야고보서', en: 'James', abbr: '약', isOT: false, maxChap: 5, section: '서신서', era: 'A.D. 45-48년경 (행함이 있는 믿음)', empire: '로마 제국' },
  { ko: '베드로전서', en: '1 Peter', abbr: '벧전', isOT: false, maxChap: 5, section: '서신서', era: 'A.D. 64년경 (고난 속의 산 소망)', empire: '로마 제국' },
  { ko: '베드로후서', en: '2 Peter', abbr: '벧후', isOT: false, maxChap: 3, section: '서신서', era: 'A.D. 66-67년경 (주의 재림)', empire: '로마 제국' },
  { ko: '요한일서', en: '1 John', abbr: '요일', isOT: false, maxChap: 5, section: '서신서', era: 'A.D. 85-95년경 (사랑과 진리)', empire: '로마 제국' },
  { ko: '요한이서', en: '2 John', abbr: '요이', isOT: false, maxChap: 1, section: '서신서', era: 'A.D. 85-95년경 (진리 안의 사랑)', empire: '로마 제국' },
  { ko: '요한삼서', en: '3 John', abbr: '요삼', isOT: false, maxChap: 1, section: '서신서', era: 'A.D. 85-95년경 (진리를 영접하는 환대)', empire: '로마 제국' },
  { ko: '유다서', en: 'Jude', abbr: '유', isOT: false, maxChap: 1, section: '서신서', era: 'A.D. 65-80년경 (믿음의 도를 위한 싸움)', empire: '로마 제국' },
  { ko: '요한계시록', en: 'Revelation', abbr: '계', isOT: false, maxChap: 22, section: '서신서', era: 'A.D. 95년경 (어린양의 최종 승리)', empire: '로마 제국' }
];

export const BOOK_SECTION_LOOKUP = {};
BIBLE_66_BOOKS.forEach((b) => {
  BOOK_SECTION_LOOKUP[b.ko] = b.section;
  BOOK_SECTION_LOOKUP[b.en] = b.section;
});

// =====================================================================
// Strong's ID 정규화 및 100% 매칭 조회 엔진 (H430 / H0430 / H00430)
// =====================================================================
let cachedMasterStrongs = null;

export const getStrongsCandidates = (rawId) => {
  if (!rawId || typeof rawId !== 'string') return [];
  const clean = rawId.trim().toUpperCase().replace(/[^HG0-9]/g, '');
  if (clean.length < 2) return [rawId.trim()];
  const prefix = clean[0];
  const numPart = clean.slice(1).replace(/^0+/, '') || '0';
  return Array.from(
    new Set([
      rawId.trim().toUpperCase(),
      `${prefix}${numPart}`,
      `${prefix}${numPart.padStart(4, '0')}`,
      `${prefix}${numPart.padStart(5, '0')}`
    ])
  );
};

export const lookupStrongsMaster = (masterDict, rawId) => {
  if (!masterDict || !rawId) return {};
  const candidates = getStrongsCandidates(rawId);
  for (const cand of candidates) {
    if (masterDict[cand]) return masterDict[cand];
  }
  return {};
};

// =====================================================================
// 영한·한영 신학 어휘 사전 & 번역 헬퍼
// =====================================================================
const BIBLICAL_ENG_KOR_LEXICON = {
  god: { kor: '하나님, 참 신', orig: 'אֱלֹהִים (Elohim) / θεός (Theos)', strongs: 'H430 / G2316', pos: '명사', theology: '유일무이하신 천지만물의 창조주이자 구속주 하나님' },
  lord: { kor: '주, 여호와', orig: 'יְהוָה (YHWH) / κύριος (Kyrios)', strongs: 'H3068 / G2962', pos: '명사', theology: '언약의 주권자 여호와, 만유의 주재이신 예수 그리스도' },
  beginning: { kor: '태초, 시작', orig: 'רֵאשִׁית (Reshit) / ἀρχή (Arche)', strongs: 'H7225 / G746', pos: '명사', theology: '시간과 물질 창조의 절대적 출발점이자 그리스도 안에서의 새 창조' },
  created: { kor: '창조하셨다', orig: 'בָּרָא (Bara) / κτίζω (Ktizo)', strongs: 'H1254 / G2936', pos: '동사', theology: '무(無)로부터의 절대적 신적 창조. 하나님만이 주어가 되시는 고유 행위' },
  heavens: { kor: '하늘들, 궁창', orig: 'שָׁמַיִם (Shamayim) / οὐρανός (Ouranos)', strongs: 'H8064 / G3772', pos: '명사', theology: '하나님의 보좌와 영광이 깃든 영역이자 광대한 우주 공간' },
  earth: { kor: '땅, 지구, 세상', orig: 'אֶרֶץ (Erets) / γῆ (Ge)', strongs: 'H776 / G1093', pos: '명사', theology: '인간을 위해 지으신 삶의 터전이자 장차 새 하늘과 새 땅으로 갱신될 피조세계' },
  spirit: { kor: '영, 성령, 숨결', orig: 'רוּחַ (Ruach) / πνεῦμα (Pneuma)', strongs: 'H7307 / G4151', pos: '명사', theology: '생명을 불어넣으시는 하나님의 창조적 영' },
  covenant: { kor: '언약, 약조', orig: 'בְּרִית (Berit) / διαθήκη (Diatheke)', strongs: 'H1285 / G1242', pos: '명사', theology: '하나님께서 피로써 백성과 맺으신 불변의 구속사적 약속' },
  grace: { kor: '은혜, 은총', orig: 'חֵן (Chen) / χάρις (Charis)', strongs: 'H2580 / G5485', pos: '명사', theology: '자격 없는 죄인에게 거저 주시는 하나님의 주권적 구원의 선물' },
  faith: { kor: '믿음, 신뢰, 충성', orig: 'אֱמוּנָה (Emunah) / πίστις (Pistis)', strongs: 'H530 / G4102', pos: '명사', theology: '보이지 않는 하나님과 그리스도의 구속 사역을 전인격적으로 의지함' },
  righteousness: { kor: '의, 공의, 의로움', orig: 'צְדָקָה (Tsedaqah) / δικαιοσύνη (Dikaiosyne)', strongs: 'H6666 / G1343', pos: '명사', theology: '하나님의 거룩한 기준에 부합함, 그리스도로부터 성도에게 전가된 완전한 의' },
  salvation: { kor: '구원, 건지심', orig: 'יְשׁוּעָה (Yeshuah) / σωτηρία (Soteria)', strongs: 'H3444 / G4991', pos: '명사', theology: '죄와 사망의 권세에서 그리스도의 십자가 대속으로 해방되는 전인적 구원' },
  holy: { kor: '거룩한, 성결한', orig: 'קָדוֹשׁ (Qadosh) / ἅγιος (Hagios)', strongs: 'H6918 / G40', pos: '형용사', theology: '세속과 구별된 하나님의 초월적 속성이며 성도에게 요구되는 영적 상태' },
  peace: { kor: '평안, 평화, 샬롬', orig: 'שָׁלוֹם (Shalom) / εἰρήνη (Eirene)', strongs: 'H7965 / G1515', pos: '명사', theology: '하나님과의 관계 회복에서 오는 온전한 안식과 번영' },
  light: { kor: '빛, 광명', orig: 'אוֹר (Or) / φῶς (Phos)', strongs: 'H216 / G5457', pos: '명사', theology: '어둠을 물리치시는 하나님의 영광, 진리, 예수 그리스도의 임재' },
  darkness: { kor: '어둠, 흑암', orig: 'חֹשֶׁךְ (Choshek) / σκοτία (Skotia)', strongs: 'H2822 / G4653', pos: '명사', theology: '빛과 질서가 없는 혼돈의 상태, 영적 무지와 죄의 세력' },
  flesh: { kor: '육체, 육신', orig: 'בָּשָׂר (Basar) / σάρξ (Sarx)', strongs: 'H1320 / G4561', pos: '명사', theology: '연약한 인간 본성 또는 하나님을 거스르는 타락한 정욕' },
  blood: { kor: '피, 보혈', orig: 'דָּם (Dam) / αἷμα (Haima)', strongs: 'H1818 / G129', pos: '명사', theology: '생명의 근원이자 죄 사함을 위한 언약적 대속의 표징' },
  sin: { kor: '죄, 허물', orig: 'חַטָּאת (Chattat) / ἁμαρτία (Hamartia)', strongs: 'H2403 / G266', pos: '명사', theology: '하나님의 법과 거룩한 과녁에서 벗어남' },
  repent: { kor: '회개하다, 돌이키다', orig: 'שׁוּב (Shuv) / μετανοέω (Metanoeo)', strongs: 'H7725 / G3340', pos: '동사', theology: '생각과 삶의 방향을 전인격적으로 하나님께로 돌이킴' },
  love: { kor: '사랑, 인애, 아가페', orig: 'חֶסֶד (Chesed) / ἀγάπη (Agape)', strongs: 'H2617 / G26', pos: '명사/동사', theology: '자기를 내어주시는 하나님의 무조건적이고 영원한 언약적 사랑' },
  word: { kor: '말씀, 로고스, 사건', orig: 'דָּבָר (Davar) / λόγος (Logos)', strongs: 'H1697 / G3056', pos: '명사', theology: '천지를 창조하시고 육신이 되어 우리 가운데 거하신 살아있는 하나님의 말씀' }
};

const ENG_STOP_WORDS = new Set(['the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'it', 'with', 'as', 'was', 'on', 'be', 'at', 'by', 'from', 'or', 'an']);

async function fetchKoreanTranslation(text, targetLang = 'ko') {
  if (!text || typeof text !== 'string') return '';
  const rawParagraphs = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = rawParagraphs.length > 0 ? rawParagraphs : [text.trim()];

  const translatedChunks = await Promise.all(
    chunks.map(async (para) => {
      if (!para) return '';
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(para.slice(0, 2200))}`;
        const res = await fetch(url);
        if (!res.ok) return para;
        const data = await res.json();
        return data[0]?.map((chunk) => chunk[0]).join('') || para;
      } catch {
        return para;
      }
    })
  );
  return translatedChunks.filter(Boolean).join('\n\n');
}

async function fetchEnglishWordLexicon(queryWord) {
  const raw = (queryWord || '').trim();
  if (!raw) return null;

  const isKoreanQuery = /[가-힣]/.test(raw);
  const cleanEng = raw.toLowerCase().replace(/[^a-z]/g, '');

  if (!isKoreanQuery && BIBLICAL_ENG_KOR_LEXICON[cleanEng]) {
    return { word: cleanEng, ...BIBLICAL_ENG_KOR_LEXICON[cleanEng], isTheological: true };
  }

  if (isKoreanQuery) {
    const matchedEntry = Object.entries(BIBLICAL_ENG_KOR_LEXICON).find(([_, v]) => v.kor.includes(raw));
    if (matchedEntry) {
      return { word: `${raw} -> ${matchedEntry[0]}`, ...matchedEntry[1], isTheological: true };
    }
  }

  try {
    const sl = isKoreanQuery ? 'ko' : 'en';
    const tl = isKoreanQuery ? 'en' : 'ko';
    const targetQ = isKoreanQuery ? raw : cleanEng || raw;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&q=${encodeURIComponent(targetQ)}`;
    const res = await fetch(url);
    if (!res.ok) return { word: targetQ, kor: targetQ, pos: '어휘', theology: null };
    const data = await res.json();

    const translatedText = data[0]?.map((c) => c[0]).join('') || targetQ;
    let posStr = isKoreanQuery ? '한영 사전' : '영한 사전';
    const definitions = [];

    if (data[1] && Array.isArray(data[1])) {
      posStr = data[1].map((p) => p[0]).join(', ');
      data[1].forEach((posGroup) => {
        if (posGroup[1] && Array.isArray(posGroup[1])) {
          definitions.push(`[${posGroup[0]}] ${posGroup[1].slice(0, 5).join(', ')}`);
        }
      });
    }

    return {
      word: targetQ,
      kor: translatedText,
      pos: posStr,
      details: definitions.join('\n'),
      theology: null,
      isTheological: false
    };
  } catch {
    return { word: raw, kor: raw, pos: '단어', theology: null };
  }
}

// =====================================================================
// 원어 조판 & 텍스트 정제 엔진
// =====================================================================
export const decodeHtmlEntities = (text) => {
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

export const stripHebrewVowels = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/[\u0591-\u05C7]/g, '');
};

export const cleanTypography = (text, isOT, mode = 'vowels') => {
  if (!text || typeof text !== 'string') return '';
  if (!isOT) return text;
  if (mode === 'consonants') return stripHebrewVowels(text);
  if (mode === 'vowels') return text.replace(/[\u0591-\u05AF]/g, '');
  return text;
};

export const assembleLiteralTranslation = (wordsList) => {
  if (!wordsList || !Array.isArray(wordsList) || wordsList.length === 0) return '';
  const orderedWords = [...wordsList].sort((a, b) => (a.word_order || 0) - (b.word_order || 0));
  const englishTokens = orderedWords.map((w) => w.eng).filter((e) => e && e !== 'n/a' && e !== '-');
  return englishTokens.join(' ').replace(/\s+/g, ' ').trim();
};

// =====================================================================
// 정밀 형태론 파서 (헬라어 Robinson + 히브리어 ETCBC / OSHM 통합)
// =====================================================================
export const decodeExhaustiveMorphology = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') {
    return { pos: '어휘', label: '일반어휘', type: 'other', caseType: '', isVerb: false };
  }
  const code = rawCode.trim();

  // 1. 헬라어 Robinson 형태론 코드 (예: V-AAI-3S, N-GSM, T-NSM, PREP, CONJ)
  if (code.includes('-') || ['CONJ', 'PREP', 'ADV', 'PRT', 'INJ', 'COND'].includes(code)) {
    const simpleMap = {
      CONJ: '접속사',
      PREP: '전치사',
      ADV: '부사',
      PRT: '불변사',
      INJ: '감탄사',
      COND: '조건접속사'
    };
    if (simpleMap[code]) {
      return { pos: simpleMap[code], label: simpleMap[code], type: 'particle', caseType: '', isVerb: false };
    }

    const parts = code.split('-');
    const pos = parts[0];
    const details = parts[1] || '';
    const extra = parts[2] || '';

    const caseMap = { N: '주격', G: '소유격', D: '여격', A: '대격', V: '호격' };
    const numMap = { S: '단수', P: '복수' };
    const genMap = { M: '남성', F: '여성', N: '중성' };

    if (pos === 'V') {
      const tenseMap = { P: '현재', I: '미완료', F: '미래', A: '부정과거', R: '완료', L: '과거완료' };
      const voiceMap = { A: '능동태', M: '중간태', P: '수동태', E: '중간/수동', D: '디포', O: '수동디포', N: '중간/수동디포' };
      const moodMap = { I: '직설법', S: '접속법', M: '명령법', N: '부정사', P: '분사', O: '희구법' };

      const tense = tenseMap[details[0]] || '';
      const voice = voiceMap[details[1]] || '';
      const mood = moodMap[details[2]] || '';

      if (details[2] === 'P') {
        const cChar = extra[0] || details[4] || '';
        const nChar = extra[1] || details[5] || '';
        const gChar = extra[2] || details[6] || '';
        const label = `동사 · ${tense} ${voice} 분사(${caseMap[cChar] || ''} ${genMap[gChar] || ''} ${numMap[nChar] || ''})`.replace(/\s+/g, ' ').trim();
        return { pos: '동사(분사)', label, type: 'verb', caseType: cChar, isVerb: true };
      }

      const person = extra[0] && /[123]/.test(extra[0]) ? `${extra[0]}인칭` : details[3] && /[123]/.test(details[3]) ? `${details[3]}인칭` : '';
      const num = numMap[extra[1]] || numMap[details[4]] || '';
      const label = `동사 · ${tense} ${voice} ${mood} ${person} ${num}`.replace(/\s+/g, ' ').trim();
      return { pos: '동사', label, type: 'verb', caseType: '', isVerb: true };
    }

    if (pos === 'P') {
      const person = /[123]/.test(details[0]) ? `${details[0]}인칭` : '';
      const cChar = /[NGDAV]/.test(details[1]) ? details[1] : details[0];
      const nChar = /[SP]/.test(details[2]) ? details[2] : details[1];
      const label = `인칭대명사 · ${person} ${caseMap[cChar] || ''} ${numMap[nChar] || ''}`.replace(/\s+/g, ' ').trim();
      return { pos: '대명사', label, type: 'noun', caseType: cChar, isVerb: false };
    }

    if (['N', 'A', 'T', 'R', 'D', 'C', 'X', 'I', 'F'].includes(pos)) {
      const posNameMap = {
        N: '명사', A: '형용사', T: '관사', R: '관계대명사', D: '지시대명사',
        C: '상호대명사', X: '부정대명사', I: '의문대명사', F: '재귀대명사'
      };
      const cChar = details[0] || '';
      const nChar = details[1] || '';
      const gChar = details[2] || '';
      const posName = posNameMap[pos] || '명사';
      const label = `${posName} · ${caseMap[cChar] || ''} · ${genMap[gChar] || ''} ${numMap[nChar] || ''}`.replace(/\s+/g, ' ').trim();
      return { pos: posName, label, type: pos === 'N' ? 'noun' : 'modifier', caseType: cChar, isVerb: false };
    }
  }

  // 2. 히브리어 ETCBC 점(.) 표기 형태론 (예: verb.qal.perf.p3.m.sg, subs.m.sg.c)
  if (code.includes('.')) {
    const parts = code.split('.');
    const mainType = parts[0];

    if (mainType === 'verb') {
      const stemMap = { qal: '칼(단순능동)', nif: '니팔(수동)', piel: '피엘(강조)', pual: '푸알(강조수동)', hif: '히필(사역)', hof: '호팔(사역수동)', hit: '히트파엘(재귀)' };
      const aspectMap = { perf: '완료(Qatal)', impf: '미완료(Yiqtol)', wayq: '바이크톨(연속과거)', ptca: '능동분사', ptcp: '수동분사', infc: '연계부정사', infa: '절대부정사', impv: '명령형' };
      const pMap = { p1: '1인칭', p2: '2인칭', p3: '3인칭' };
      const gMap = { m: '남성', f: '여성', u: '공성' };
      const nMap = { sg: '단수', pl: '복수' };
      const extraTokens = parts.slice(3).map((tk) => pMap[tk] || gMap[tk] || nMap[tk] || '').filter(Boolean).join(' ');
      const label = `동사 · ${stemMap[parts[1]] || parts[1]} ${aspectMap[parts[2]] || parts[2] || ''} ${extraTokens}`.replace(/\s+/g, ' ').trim();
      return { pos: '동사', label, type: 'verb', caseType: '', isVerb: true };
    }

    if (mainType === 'subs' || mainType === 'nmpr' || mainType === 'adjv') {
      const posName = mainType === 'nmpr' ? '고유명사' : mainType === 'adjv' ? '형용사' : '명사';
      const gMap = { m: '남성', f: '여성', c: '공성', u: '공성' };
      const nMap = { sg: '단수', pl: '복수', du: '쌍수' };
      const stateMap = { a: '절대형', c: '연계형(~의)', d: '한정형' };
      const stateStr = stateMap[parts[3]] ? `(${stateMap[parts[3]]})` : '';
      const label = `${posName}${stateStr} · ${gMap[parts[1]] || ''} ${nMap[parts[2]] || ''}`.replace(/\s+/g, ' ').trim();
      return { pos: posName, label, type: 'noun', caseType: parts[3] === 'c' ? 'CONSTRUCT' : '', isVerb: false };
    }

    const etcbcSimple = {
      prep: '전치사', conj: '접속사', art: '정관사', prde: '지시대명사',
      prps: '인칭대명사', prin: '의문대명사', advb: '부사', nega: '부정불변사', intj: '감탄사'
    };
    if (etcbcSimple[mainType]) {
      return { pos: etcbcSimple[mainType], label: etcbcSimple[mainType], type: mainType.startsWith('pr') ? 'noun' : 'particle', caseType: '', isVerb: false };
    }
  }

  // 3. 히브리어 OSHM 코드 지원 (예: HVqp3ms, HNcmsa)
  if (/^H[A-Z]/.test(code)) {
    const core = code.split('/').pop().replace(/^H/, '');
    if (core.startsWith('V')) {
      const stemMap = { q: '칼', N: '니팔', p: '피엘', P: '푸알', h: '히필', H: '호팔', t: '히트파엘' };
      const conjMap = { p: '완료', i: '미완료', w: '바이크톨', v: '명령', r: '능동분사', s: '수동분사', c: '연계부정사', a: '절대부정사' };
      const label = `동사 · ${stemMap[core[1]] || ''} ${conjMap[core[2]] || ''}`.replace(/\s+/g, ' ').trim();
      return { pos: '동사', label, type: 'verb', caseType: '', isVerb: true };
    }
    if (core.startsWith('N')) {
      const isConstruct = core.endsWith('c');
      return { pos: '명사', label: `명사${isConstruct ? '(연계형)' : '(절대형)'}`, type: 'noun', caseType: isConstruct ? 'CONSTRUCT' : '', isVerb: false };
    }
  }

  return { pos: '어휘', label: code.slice(0, 18), type: 'other', caseType: '', isVerb: false };
};

export const getTheologicalGrammarInsight = (grammarRaw, isOT) => {
  if (!grammarRaw || typeof grammarRaw !== 'string') return null;
  const raw = grammarRaw.trim();

  if (isOT && raw.includes('.')) {
    const parts = raw.split('.');
    if (parts[0] === 'verb') {
      const stem = parts[1];
      const aspect = parts[2];

      const STEM_THEOLOGY = {
        qal: { title: '칼(Qal) 어간 — 단순 능동', desc: '동사의 가장 본래적인 단순 능동태로 주어의 행동을 사실 그대로 선포합니다.' },
        nif: { title: '니팔(Niphal) 어간 — 수동 / 신적 수동태', desc: '단순 수동 혹은 재귀형으로, 하나님의 주권적 개입을 암시합니다.' },
        piel: { title: '피엘(Piel) 어간 — 강조 능동', desc: '강렬하고 집중적인 반복과 철저한 완결을 뜻합니다.' },
        pual: { title: '푸알(Pual) 어간 — 강조 수동', desc: '피엘의 수동태로 대상에게 온전히 행동의 결과가 임한 상태입니다.' },
        hif: { title: '히필(Hiphil) 어간 — 사역 능동', desc: '주어가 대상에게 그 상태나 행동을 필연적으로 일으키는 사역형입니다.' },
        hof: { title: '호팔(Hophal) 어간 — 사역 수동', desc: '사역의 원인 제공자에 의해 불가항력적으로 이끌려감을 선포합니다.' },
        hit: { title: '히트파엘(Hitpael) 어간 — 재귀 반복', desc: '언약 백성이 하나님 앞에서 전인격적으로 반응하고 자복하는 태도를 묘사합니다.' }
      };

      const ASPECT_THEOLOGY = {
        perf: '완료형(Qatal): 이미 완결된 확정적 사건이자 언약적 성취를 선언합니다.',
        impf: '미완료형(Yiqtol): 계속 전개되거나 장차 이루어질 진행을 뜻합니다.',
        wayq: '바이크톨(Wayyiqtol): 섭리 속에서 구속사적 사건들이 연속됨을 묘사합니다.',
        ptca: '능동분사: 현재 지속되고 있는 주권적 통치를 표현합니다.',
        ptcp: '수동분사: 지속되는 수동적 상태를 나타냅니다.',
        infc: '연계부정사: 목적이나 결과를 이끄는 부정사입니다.'
      };

      const stemInfo = STEM_THEOLOGY[stem] || { title: `동사 어간: ${stem}`, desc: '히브리어 동사 형태론' };
      return { stemTitle: stemInfo.title, stemDesc: stemInfo.desc, aspectDesc: ASPECT_THEOLOGY[aspect] || '', category: 'HEBREW_BINYAN' };
    }
  }

  if (!isOT && (raw.includes('-') || raw.startsWith('V'))) {
    const parts = raw.split('-');
    if (parts[0] === 'V' && parts[1]) {
      const details = parts[1];
      const tenseChar = details[0];
      const voiceChar = details[1];

      const TENSE_THEOLOGY = {
        A: { title: '부정과거(Aorist) — 단회적·결정적 사건', desc: '그리스도의 십자가 대속과 같이 영단번에 완성된 사건을 선포합니다.' },
        R: { title: '완료(Perfect) — 영구히 유효한 완성', desc: '과거에 완료된 사건의 영적 효력이 현재까지 지속됨을 선언합니다.' },
        P: { title: '현재(Present) — 지속적 진행', desc: '삶 속에서 끊임없이 지속되는 성령의 역사를 나타냅니다.' },
        I: { title: '미완료(Imperfect) — 과거의 지속 과정', desc: '과거의 한 시점에서 지속되었던 과정을 생생하게 묘사합니다.' },
        F: { title: '미래(Future) — 종말론적 확실한 약속', desc: '하나님의 신실하심에 근거한 절대적 성취의 확신입니다.' }
      };

      const VOICE_THEOLOGY = {
        P: '신적 수동태(Passivum Divinum): 인간의 행위가 아니라 하나님께서 주권적으로 역사하셨음을 고백합니다.',
        M: '중간태(Middle Voice): 주어가 자기 자신과 깊은 인격적 연관을 맺고 행함을 뜻합니다.',
        A: '능동태(Active Voice): 주체의 확고한 의지적 결단에 의해 행동이 실행됨을 뜻합니다.'
      };

      const tenseInfo = TENSE_THEOLOGY[tenseChar];
      if (tenseInfo) {
        return { stemTitle: tenseInfo.title, stemDesc: tenseInfo.desc, aspectDesc: VOICE_THEOLOGY[voiceChar] || '', category: 'GREEK_TENSE' };
      }
    }
  }
  return null;
};

export const applyContextualCaseEnding = (baseKor, caseType, isOT, rawGrammar) => {
  if (!baseKor || baseKor === '원어 어휘') return baseKor;
  const word = baseKor.trim();

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

export const parseUnabridgedAcademicLexicon = (rawDesc, masterEntry, isOT) => {
  const desc = rawDesc || masterEntry?.desc || '';
  const etymMatch = desc.match(/\[어원 및 파생\]\s*([^\[]+)/);
  const meaningMatch = desc.match(/\[원어 의미\]\s*([^\[]+)/);
  const usageMatch = desc.match(/\[주요 번역\]\s*([^\[]+)/);

  const rootFromMaster = masterEntry?.root || masterEntry?.original || '';

  return {
    sourceName: isOT ? "BDB & Strong's Lexicon" : "Thayer's & Strong's Lexicon",
    root: rootFromMaster,
    rawFull: desc || '등록된 원전 사전 텍스트가 없습니다.',
    etymology: (etymMatch && etymMatch[1]?.trim()) || masterEntry?.etym || '원어 고유 어근 (Primitive Root)',
    meaning: (meaningMatch && meaningMatch[1]?.trim()) || masterEntry?.eng || '원문 문맥적 기본 정의',
    usage: (usageMatch && usageMatch[1]?.trim()) || masterEntry?.usage || '성경 본문 주요 번역 용례'
  };
};

export const speakAudio = (text, langCode = 'he-IL') => {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = (text || '').replace(/[\u0591-\u05AF]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

export const renderParagraphBlocks = (rawContent, textColorClass = '') => {
  if (!rawContent) return null;
  const decoded = decodeHtmlEntities(rawContent);
  const paras = decoded.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);

  if (paras.length <= 1) {
    return <p className={`text-[13.5px] leading-[1.8] break-keep ${textColorClass}`}>{decoded}</p>;
  }

  return paras.map((para, idx) => (
    <p key={idx} className={`text-[13.5px] leading-[1.8] break-keep mb-2 last:mb-0 ${textColorClass}`}>
      {para}
    </p>
  ));
};
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

export default function Interlinear({
  isDarkMode,
  setActiveScreen,
  setIsSidebarOpen,
  isSidebarOpen,
  bibles,
  getArr
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

  // 1. 권 / 장 / 절 네비게이션 상태
  const [selectedBookIndex, setSelectedBookIndex] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.book) {
        const idx = BIBLE_66_BOOKS.findIndex((b) => b.ko === jump.book || b.en === jump.book);
        if (idx !== -1) return idx;
      }
    } catch (_) {}
    return 0;
  });

  const [chapter, setChapter] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.chapter) return Number(jump.chapter);
    } catch (_) {}
    return 1;
  });

  const [verse, setVerse] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.verse) {
        const v = Number(jump.verse);
        localStorage.removeItem('interlinear_jump');
        return v;
      }
    } catch (_) {}
    return 1;
  });

  // 2. 역본 & DB 상태
  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('interlinear_bible_version') || 'parallel';
    } catch (_) {
      return 'parallel';
    }
  });
  const [krv4TxtDb, setKrv4TxtDb] = useState(() => (typeof window !== 'undefined' ? window.__GTC_KRV4_DB__ : null));
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});

  const handleVersionChange = (ver) => {
    setBibleVersion(ver);
    try {
      localStorage.setItem('interlinear_bible_version', ver);
    } catch (_) {}
  };

  const [webStudyMode, setWebStudyMode] = useState('word');
  const [bilingualSearchInput, setBilingualSearchInput] = useState('');
  const [translatedClauses, setTranslatedClauses] = useState([]);
  const [isClauseTranslating, setIsClauseTranslating] = useState(false);

  // 3. 조판 · 오디오 · 워크플로우 상태
  const [typographyMode, setTypographyMode] = useState('vowels');
  const [workflowMode, setWorkflowMode] = useState('exegesis');
  const [playingAudioType, setPlayingAudioType] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  }, []);

  // 4. 원어 어절 & 3중 교차 하이라이트 상태
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dictLoaded, setDictLoaded] = useState(false);

  const [activeWordOrder, setActiveWordOrder] = useState(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [modalTab, setModalTab] = useState('korean');

  const [selectedWebLexiconWord, setSelectedWebLexiconWord] = useState(null);
  const [isWebLexiconLoading, setIsWebLexiconLoading] = useState(false);
  const [selectedGrammarWikiKey, setSelectedGrammarWikiKey] = useState(null);

  const [concordanceTotalCount, setConcordanceTotalCount] = useState(0);
  const [concordanceDistribution, setConcordanceDistribution] = useState({});
  const [concordanceList, setConcordanceList] = useState([]);
  const [isConcordanceLoading, setIsConcordanceLoading] = useState(false);

  const [translatedMap, setTranslatedMap] = useState({});
  const [translatingKeys, setTranslatingKeys] = useState({});

  const handleToggleTranslation = async (key, rawText) => {
    if (translatedMap[key]) {
      setTranslatedMap((prev) => ({ ...prev, [key]: null }));
      return;
    }
    setTranslatingKeys((prev) => ({ ...prev, [key]: true }));
    const result = await fetchKoreanTranslation(rawText);
    setTranslatedMap((prev) => ({ ...prev, [key]: result }));
    setTranslatingKeys((prev) => ({ ...prev, [key]: false }));
  };

  const [customNotesMap, setCustomNotesMap] = useState({});
  const [customInputTrans, setCustomInputTrans] = useState('');
  const [customInputMemo, setCustomInputMemo] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // 5. 10대 학술 아코디언 개폐 상태
  const [openPanels, setOpenPanels] = useState({
    tsk: true,
    hebrewSyntax: true,
    lxx: false,
    targumPeshitta: false,
    josephus: false,
    geo: false,
    commentary: true,
    matthewHenry: false,
    netNotes: false,
    easton: false
  });
  const togglePanel = (key) => setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleWorkflowModeChange = (mode) => {
    setWorkflowMode(mode);
    if (mode === 'qt') {
      setOpenPanels({ tsk: true, hebrewSyntax: false, lxx: false, targumPeshitta: false, josephus: false, geo: true, commentary: false, matthewHenry: true, netNotes: false, easton: false });
    } else if (mode === 'exegesis') {
      setOpenPanels({ tsk: true, hebrewSyntax: true, lxx: false, targumPeshitta: false, josephus: false, geo: false, commentary: true, matthewHenry: false, netNotes: false, easton: true });
    } else if (mode === 'academic') {
      setOpenPanels({ tsk: false, hebrewSyntax: false, lxx: true, targumPeshitta: true, josephus: true, geo: false, commentary: false, matthewHenry: false, netNotes: true, easton: false });
    } else {
      setOpenPanels({ tsk: true, hebrewSyntax: true, lxx: true, targumPeshitta: true, josephus: true, geo: true, commentary: true, matthewHenry: true, netNotes: true, easton: true });
    }
  };

  const scrollToPanel = (panelKey) => {
    setOpenPanels((prev) => ({ ...prev, [panelKey]: true }));
    setTimeout(() => {
      const el = document.getElementById(`panel-${panelKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  // 6. 10대 학술 코퍼스 데이터베이스 상태
  const [crossRefs, setCrossRefs] = useState([]);
  const [isTskLoading, setIsTskLoading] = useState(false);
  const [lxxDatabase, setLxxDatabase] = useState({});
  const [currentLxxParallel, setCurrentLxxParallel] = useState(null);
  const [josephusDb, setJosephusDb] = useState({});
  const [currentJosephus, setCurrentJosephus] = useState(null);
  const [geoDb, setGeoDb] = useState({});
  const [currentGeoData, setCurrentGeoData] = useState(null);
  const [commentaryDb, setCommentaryDb] = useState({});
  const [currentCommentary, setCurrentCommentary] = useState(null);
  const [matthewHenryDb, setMatthewHenryDb] = useState({});
  const [currentMatthewHenry, setCurrentMatthewHenry] = useState(null);
  const [netNotesDb, setNetNotesDb] = useState({});
  const [currentNetNote, setCurrentNetNote] = useState(null);
  const [eastonDb, setEastonDb] = useState({});
  const [currentEaston, setCurrentEaston] = useState(null);
  const [targumPeshittaDb, setTargumPeshittaDb] = useState({});
  const [currentTargumPeshitta, setCurrentTargumPeshitta] = useState(null);
  const [currentHebrewSyntax, setCurrentHebrewSyntax] = useState(null);

  // 7. 현재 도서 메타데이터 & 개역개정 4판 본문
  const currentBookMeta = BIBLE_66_BOOKS[selectedBookIndex] || BIBLE_66_BOOKS[0];
  const isOT = currentBookMeta.isOT;

  const safeGetArr = getArr || ((a) => (Array.isArray(a) ? a : []));
  const currentBookData = useMemo(() => {
    const list = safeGetArr(bibles);
    return list.find((b) => b?.name === currentBookMeta.en || b?.name === currentBookMeta.ko) || {};
  }, [bibles, currentBookMeta, safeGetArr]);

  const krv4CurrentBookChaps = useMemo(() => {
    return krv4TxtDb?.[currentBookMeta.en] || krv4TxtDb?.[currentBookMeta.ko] || null;
  }, [krv4TxtDb, currentBookMeta]);

  const chaptersCount = krv4CurrentBookChaps?.length || currentBookData?.chapters?.length || currentBookMeta.maxChap;
  const versesCount = useMemo(() => {
    const krv4Chap = krv4CurrentBookChaps?.[chapter - 1];
    if (Array.isArray(krv4Chap) && krv4Chap.length > 0) return krv4Chap.filter(Boolean).length;
    return currentBookData?.chapters?.[chapter - 1]?.length || 35;
  }, [krv4CurrentBookChaps, chapter, currentBookData]);

  const getKrvVerseObjByNum = useCallback(
    (vNum) => {
      const krv4Chap = krv4CurrentBookChaps?.[chapter - 1];
      let raw = '';
      if (Array.isArray(krv4Chap) && krv4Chap[vNum - 1]) {
        raw = krv4Chap[vNum - 1];
      } else if (currentBookData?.chapters?.[chapter - 1]) {
        const v = currentBookData.chapters[chapter - 1][vNum - 1];
        raw = v ? (typeof v === 'string' ? v : v.text || v.content || '') : '';
      }
      return splitPericopeAndVerse(decodeHtmlEntities(raw));
    },
    [krv4CurrentBookChaps, currentBookData, chapter]
  );

  const currentVerseObj = useMemo(() => getKrvVerseObjByNum(verse), [getKrvVerseObjByNum, verse]);
  const koVersePericope = currentVerseObj.pericope;
  const koVerseText = currentVerseObj.pureText || `${currentBookMeta.ko} ${chapter}장 ${verse}절`;

  const easyVerseText = useMemo(() => easyBibleDb[`${currentBookMeta.ko}-${chapter}-${verse}`] || '', [currentBookMeta.ko, chapter, verse, easyBibleDb]);

  const getWebVerseByNum = useCallback(
    (vNum) => {
      return webBibleDb[`${currentBookMeta.ko}-${chapter}-${vNum}`] || webBibleDb[`${currentBookMeta.en}-${chapter}-${vNum}`] || '';
    },
    [currentBookMeta, chapter, webBibleDb]
  );

  const webVerseText = useMemo(() => getWebVerseByNum(verse), [getWebVerseByNum, verse]);
  const enVerseText = useMemo(() => {
    if (!words || words.length === 0) return '';
    return decodeHtmlEntities(words.map((w) => w.eng).filter((e) => e && e !== 'n/a' && e !== '-').join(' '));
  }, [words]);
  const literalVerseText = useMemo(() => assembleLiteralTranslation(words), [words]);

  const paragraphContextVerses = useMemo(() => {
    const startV = Math.max(1, verse - 1);
    const endV = Math.min(versesCount, verse + 2);
    const list = [];
    for (let v = startV; v <= endV; v++) {
      const vObj = getKrvVerseObjByNum(v);
      list.push({
        vNum: v,
        isCurrent: v === verse,
        pericope: vObj.pericope,
        krv: vObj.pureText,
        web: getWebVerseByNum(v)
      });
    }
    return list;
  }, [verse, versesCount, getKrvVerseObjByNum, getWebVerseByNum]);

  useEffect(() => {
    if (webStudyMode !== 'clauses') return;
    const targetEng = webVerseText || enVerseText;
    if (!targetEng) {
      setTranslatedClauses([]);
      return;
    }
    let cancelled = false;
    const rawClauses = targetEng.split(/(?<=[,;:.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    setIsClauseTranslating(true);
    Promise.all(rawClauses.map(async (clause) => ({ eng: clause, kor: await fetchKoreanTranslation(clause, 'ko') }))).then((results) => {
      if (!cancelled) {
        setTranslatedClauses(results);
        setIsClauseTranslating(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [webStudyMode, webVerseText, enVerseText]);

  // 8. 3중 교차 하이라이트 매칭기
  const activeWordObj = useMemo(() => {
    if (activeWordOrder === null) return null;
    return words.find((w) => w.word_order === activeWordOrder) || null;
  }, [words, activeWordOrder]);

  const findMatchingWordOrderForEnglishToken = useCallback(
    (engToken) => {
      const clean = (engToken || '').toLowerCase().replace(/[^a-z]/g, '');
      if (!clean || clean.length < 2 || ENG_STOP_WORDS.has(clean)) return null;
      for (const w of words) {
        const glossTokens = (w.eng || '').toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 2 && !ENG_STOP_WORDS.has(t));
        if (glossTokens.some((gt) => gt === clean || (clean.length >= 4 && (gt.startsWith(clean.slice(0, 4)) || clean.startsWith(gt.slice(0, 4)))))) {
          return w.word_order;
        }
      }
      return null;
    },
    [words]
  );

  const findMatchingWordOrderForKoreanToken = useCallback(
    (korToken) => {
      const clean = (korToken || '').replace(/[^가-힣]/g, '');
      if (!clean || clean.length < 1) return null;
      for (const w of words) {
        const roots = `${w.korContextual || ''} ${w.korLemma || ''}`
          .split(/[,/()\s~]+/)
          .map((r) => r.replace(/(하다|되다|이다|으로|에게|에서|을|를|이|가|은|는|의)$/g, '').trim())
          .filter((r) => r.length >= 1);
        for (const rt of roots) {
          if (rt.length >= 2 && clean.includes(rt)) return w.word_order;
          if (rt.length === 1 && clean.startsWith(rt)) return w.word_order;
        }
      }
      return null;
    },
    [words]
  );

  const handleSpeakFullVerse = (type) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (playingAudioType === type) {
      setPlayingAudioType(null);
      return;
    }
    let textToSpeak = '';
    let lang = 'ko-KR';
    if (type === 'orig') {
      textToSpeak = words.map((w) => w.inflected).join(' ').replace(/[\u0591-\u05AF]/g, '');
      lang = isOT ? 'he-IL' : 'el-GR';
    } else if (type === 'web') {
      textToSpeak = webVerseText || enVerseText;
      lang = 'en-US';
    } else {
      textToSpeak = koVerseText;
      lang = 'ko-KR';
    }
    if (!textToSpeak.trim()) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = type === 'orig' ? 0.82 : 0.95;
    utterance.onend = () => setPlayingAudioType(null);
    utterance.onerror = () => setPlayingAudioType(null);
    setPlayingAudioType(type);
    window.speechSynthesis.speak(utterance);
  };

  const handleWordClickInWeb = async (rawWord, matchedOrder = null) => {
    const clean = rawWord.trim().replace(/^[^a-zA-Z가-힣]+|[^a-zA-Z가-힣]+$/g, '');
    if (!clean) return;
    if (matchedOrder !== null) setActiveWordOrder(matchedOrder);
    else {
      const autoOrder = findMatchingWordOrderForEnglishToken(clean);
      if (autoOrder !== null) setActiveWordOrder(autoOrder);
    }
    setIsWebLexiconLoading(true);
    setSelectedWebLexiconWord({ word: clean, kor: '사전 조회 중...', pos: '조회 중' });
    const data = await fetchEnglishWordLexicon(clean);
    setSelectedWebLexiconWord(data);
    setIsWebLexiconLoading(false);
  };

  const renderInteractiveKoreanText = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((token, idx) => {
      if (/^\s+$/.test(token)) return <span key={idx}>{token}</span>;
      const matchedOrder = findMatchingWordOrderForKoreanToken(token);
      const isHighlighted = matchedOrder !== null && activeWordOrder === matchedOrder;
      return (
        <span
          key={idx}
          onMouseEnter={() => { if (matchedOrder !== null) setActiveWordOrder(matchedOrder); }}
          onClick={(e) => {
            e.stopPropagation();
            if (matchedOrder !== null) setActiveWordOrder(matchedOrder);
          }}
          className={`rounded px-0.5 transition-colors ${matchedOrder !== null ? 'cursor-pointer' : ''} ${
            isHighlighted
              ? 'bg-[#FDE047] text-[#111827] font-bold'
              : matchedOrder !== null
              ? 'hover:bg-[#3B82F6]/15 underline decoration-dotted decoration-[#3B82F6]/45 underline-offset-4'
              : ''
          }`}
        >
          {token}
        </span>
      );
    });
  };

  const renderInteractiveWebText = (text) => {
    if (!text) return 'WEB 본문 로딩 중...';
    return text.split(/(\s+|[.,;!?()[\]"]+)/).map((token, idx) => {
      if (!/^[a-zA-Z'-]+$/.test(token.trim())) return <span key={idx}>{token}</span>;
      const matchedOrder = findMatchingWordOrderForEnglishToken(token);
      const isHighlighted = matchedOrder !== null && activeWordOrder === matchedOrder;
      return (
        <span
          key={idx}
          onMouseEnter={() => { if (matchedOrder !== null) setActiveWordOrder(matchedOrder); }}
          onClick={(e) => {
            e.stopPropagation();
            handleWordClickInWeb(token, matchedOrder);
          }}
          className={`cursor-pointer rounded px-0.5 transition-colors ${
            isHighlighted
              ? 'bg-[#38BDF8] text-[#0F172A] font-bold'
              : 'hover:bg-[#3B82F6]/15 underline decoration-dotted decoration-[#3B82F6]/45 underline-offset-4'
          }`}
        >
          {token}
        </span>
      );
    });
  };

  // 9. 초기 데이터 로드
  useEffect(() => {
    ensureKrv4TxtLoaded().then((parsedMap) => {
      if (parsedMap) setKrv4TxtDb(parsedMap);
    });
    fetch('/data/easy_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then((r) => (r.ok ? r.json() : {})).then((d) => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/lxx_quotes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setLxxDatabase(d || {})).catch(() => {});
    fetch('/data/josephus.json').then((r) => (r.ok ? r.json() : {})).then((d) => setJosephusDb(d || {})).catch(() => {});
    fetch('/data/bible_geodata.json').then((r) => (r.ok ? r.json() : {})).then((d) => setGeoDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then((r) => (r.ok ? r.json() : {})).then((d) => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/easton_dict.json').then((r) => (r.ok ? r.json() : {})).then((d) => setEastonDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then((r) => (r.ok ? r.json() : {})).then((d) => setTargumPeshittaDb(d || {})).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentBookMeta.ko) return;
    fetch(`/data/commentaries_by_chapter/${currentBookMeta.ko}_${chapter}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setCommentaryDb(d || {}))
      .catch(() => setCommentaryDb({}));

    fetch(`/data/matthew_henry_by_chapter/${currentBookMeta.ko}_${chapter}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setMatthewHenryDb(d || {}))
      .catch(() => setMatthewHenryDb({}));
  }, [currentBookMeta.ko, chapter]);

  const handlePrevVerse = useCallback(() => {
    if (verse > 1) setVerse((v) => v - 1);
    else if (chapter > 1) {
      setChapter((c) => c - 1);
      setVerse(1);
    } else if (selectedBookIndex > 0) {
      setSelectedBookIndex((idx) => idx - 1);
      setChapter(1);
      setVerse(1);
    }
  }, [verse, chapter, selectedBookIndex]);

  const handleNextVerse = useCallback(() => {
    if (verse < versesCount) setVerse((v) => v + 1);
    else if (chapter < chaptersCount) {
      setChapter((c) => c + 1);
      setVerse(1);
    } else if (selectedBookIndex < BIBLE_66_BOOKS.length - 1) {
      setSelectedBookIndex((idx) => idx + 1);
      setChapter(1);
      setVerse(1);
    }
  }, [verse, versesCount, chapter, chaptersCount, selectedBookIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (selectedWordDetail || isLibraryOpen || selectedGrammarWikiKey || selectedWebLexiconWord) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevVerse();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextVerse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevVerse, handleNextVerse, selectedWordDetail, isLibraryOpen, selectedGrammarWikiKey, selectedWebLexiconWord]);

  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayingAudioType(null);

    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    setCurrentLxxParallel(lxxDatabase[key] || null);
    setCurrentJosephus(josephusDb[key] || null);
    setCurrentGeoData(geoDb[key] || null);
    setCurrentCommentary(commentaryDb[key] || null);
    setCurrentMatthewHenry(matthewHenryDb[key] || null);
    setCurrentNetNote(netNotesDb[key] || null);
    setCurrentTargumPeshitta(targumPeshittaDb[key] || null);

    const foundEastonKey = Object.keys(eastonDb).find((k) => {
      if ((koVerseText || '').includes(k)) return true;
      const lowerK = k.toLowerCase();
      if ((enVerseText || '').toLowerCase().split(/\s+/).some((w) => w.replace(/[^a-z]/g, '') === lowerK)) return true;
      if ((webVerseText || '').toLowerCase().split(/\s+/).some((w) => w.replace(/[^a-z]/g, '') === lowerK)) return true;
      return false;
    });
    setCurrentEaston(foundEastonKey ? { word: foundEastonKey, ...eastonDb[foundEastonKey] } : null);
  }, [currentBookMeta.ko, chapter, verse, lxxDatabase, josephusDb, geoDb, commentaryDb, matthewHenryDb, netNotesDb, eastonDb, targumPeshittaDb, koVerseText, enVerseText, webVerseText]);

  useEffect(() => {
    if (isOT && words && words.length > 0) {
      setCurrentHebrewSyntax(analyzeHebrewSyntaxFromWords(words));
    } else {
      setCurrentHebrewSyntax(null);
    }
  }, [isOT, words]);

  useEffect(() => {
    let isMounted = true;
    setIsTskLoading(true);
    getCrossReferences(currentBookMeta.ko, chapter, verse)
      .then((refs) => {
        if (isMounted) {
          setCrossRefs(refs || []);
          setIsTskLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCrossRefs([]);
          setIsTskLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [currentBookMeta.ko, chapter, verse]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (cachedMasterStrongs) {
      setDictLoaded(true);
      return;
    }
    fetch('/data/strongs_korean_master.json')
      .then(async (res) => (res.ok ? res.json() : fetch('/data/strongs_korean.json').then((r) => r.json())))
      .then((data) => {
        cachedMasterStrongs = data || {};
        setDictLoaded(true);
      })
      .catch(() => {
        cachedMasterStrongs = {};
        setDictLoaded(true);
      });
  }, []);

  // 10. 원어 어절 & 사전 100% 정밀 매칭 로더
  useEffect(() => {
    if (!dictLoaded) return;
    let isMounted = true;

    const fetchInterlinearData = async () => {
      if (!supabase) return;
      setIsLoading(true);
      setActiveWordOrder(null);
      setSelectedWordDetail(null);
      setConcordanceList([]);

      try {
        const { data: wordsData, error: wordsError } = await supabase
          .from('interlinear_bible')
          .select('*')
          .eq('book', currentBookMeta.ko)
          .eq('chapter', chapter)
          .eq('verse', verse)
          .order('word_order', { ascending: true });

        if (wordsError || !wordsData || wordsData.length === 0) {
          if (isMounted) setWords([]);
          setIsLoading(false);
          return;
        }

        // 모든 후보 Strong's ID(0-패딩 포함)로 사전 조회 정확도 100% 확보
        const allCandidates = Array.from(
          new Set(wordsData.flatMap((w) => getStrongsCandidates(w.strongs_id)))
        );
        const dictMap = new Map();

        if (allCandidates.length > 0) {
          const { data: dictRows } = await supabase
            .from('strongs_dictionary')
            .select('*')
            .in('strongs_id', allCandidates);

          if (dictRows && dictRows.length > 0) {
            dictRows.forEach((row) => {
              getStrongsCandidates(row.strongs_id).forEach((cand) => dictMap.set(cand, row));
            });
          }
        }

        if (!isMounted) return;

        const enrichedWords = wordsData.map((w) => {
          const sId = (w.strongs_id || '').trim().toUpperCase();
          const masterEntry = lookupStrongsMaster(cachedMasterStrongs, sId);
          const dbDict = dictMap.get(sId) || {};
          const morphInfo = decodeExhaustiveMorphology(w.grammar);
          const theologyInsight = getTheologicalGrammarInsight(w.grammar, isOT);

          const inflectedWord = (w.original_word || '').trim();
          const lemmaWord = (masterEntry.original || dbDict.original_word || inflectedWord).trim();
          const isInflectedDifferent = Boolean(lemmaWord && inflectedWord && lemmaWord !== inflectedWord);

          let lemmaMeaning = masterEntry.korean || dbDict.meaning || '';
          if (!lemmaMeaning || !/[가-힣]/.test(lemmaMeaning)) {
            if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) lemmaMeaning = w.korean_trans;
            else if (masterEntry.usage && /[가-힣]/.test(masterEntry.usage)) lemmaMeaning = masterEntry.usage.split(',')[0].trim();
            else lemmaMeaning = '원어 어휘';
          }

          const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morphInfo.caseType, isOT, w.grammar);
          const finalPron = masterEntry.pron || (w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : '');
          const cleanEng = (masterEntry.eng || w.gloss || w.korean_trans || 'n/a').replace(/[[\]]/g, '').toLowerCase();
          const rawDescriptionText = dbDict.description || masterEntry.desc || w.dictionary_info || '';
          const unabridgedLexicon = parseUnabridgedAcademicLexicon(rawDescriptionText, masterEntry, isOT);
          const userCustomNote = customNotesMap[sId] || null;

          return {
            id: w.id || w.word_order,
            word_order: w.word_order,
            inflected: inflectedWord,
            lemma: lemmaWord,
            isInflectedDifferent,
            korContextual: decodeHtmlEntities(userCustomNote?.translation || contextualKorean),
            korLemma: decodeHtmlEntities(lemmaMeaning),
            pron: finalPron,
            eng: decodeHtmlEntities(cleanEng),
            grammarRaw: w.grammar || '',
            grammarPos: morphInfo.pos,
            grammarDecoded: morphInfo.label,
            grammarType: morphInfo.type,
            isVerb: morphInfo.isVerb,
            theologyInsight,
            strongs: sId || (isOT ? 'H0000' : 'G0000'),
            note: decodeHtmlEntities(masterEntry.note || ''),
            lexicon: unabridgedLexicon,
            userCustomNote
          };
        });

        const uniqueMap = new Map();
        enrichedWords.forEach((w) => {
          if (!uniqueMap.has(w.word_order)) uniqueMap.set(w.word_order, w);
        });

        if (isMounted) {
          const sortedList = Array.from(uniqueMap.values()).sort((a, b) => a.word_order - b.word_order);
          setWords(sortedList);
          if (sortedList.length > 0) setActiveWordOrder(sortedList[0].word_order);
        }
      } catch (_) {
        if (isMounted) setWords([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInterlinearData();
    return () => {
      isMounted = false;
    };
  }, [currentBookMeta, chapter, verse, isOT, dictLoaded, customNotesMap]);

  const handleSelectWord = useCallback(
    async (word, openModalImmediately = true) => {
      setActiveWordOrder(word.word_order);
      if (!openModalImmediately) return;

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
          const candidates = getStrongsCandidates(word.strongs);
          const listPromise = supabase
            .from('interlinear_bible')
            .select('book, chapter, verse, original_word, korean_trans', { count: 'exact' })
            .in('strongs_id', candidates)
            .order('id', { ascending: true })
            .limit(60);

          const distPromise = supabase
            .from('interlinear_bible')
            .select('book')
            .in('strongs_id', candidates);

          const [listRes, distRes] = await Promise.all([listPromise, distPromise]);

          if (!listRes.error && listRes.data) {
            setConcordanceTotalCount(listRes.count || listRes.data.length);
            setConcordanceList(listRes.data);
          }

          if (!distRes.error && distRes.data) {
            const fullDist = {};
            distRes.data.forEach((item) => {
              const sec = BOOK_SECTION_LOOKUP[item.book] || (word.strongs.startsWith('H') ? '구약 기타' : '신약 기타');
              fullDist[sec] = (fullDist[sec] || 0) + 1;
            });
            setConcordanceDistribution(fullDist);
          }
        } catch (_) {
        } finally {
          setIsConcordanceLoading(false);
        }
      } else {
        setIsConcordanceLoading(false);
      }
    },
    [customNotesMap]
  );

  const handleJumpToConcordanceVerse = useCallback((targetBook, targetChapter, targetVerse) => {
    const bookIdx = BIBLE_66_BOOKS.findIndex((b) => b.ko === targetBook || b.en === targetBook);
    if (bookIdx !== -1) {
      setSelectedBookIndex(bookIdx);
      setChapter(Number(targetChapter));
      setVerse(Number(targetVerse));
      setSelectedWordDetail(null);
      setIsLibraryOpen(false);
    }
  }, []);

  const handleSaveCustomLexiconNote = useCallback(() => {
    if (!selectedWordDetail || !selectedWordDetail.strongs) return;
    const sId = selectedWordDetail.strongs;
    const updatedMap = {
      ...customNotesMap,
      [sId]: {
        strongs: sId,
        lemma: selectedWordDetail.lemma,
        book: currentBookMeta.ko,
        chapter,
        verse,
        translation: customInputTrans.trim(),
        memo: customInputMemo.trim(),
        updatedAt: new Date().toISOString()
      }
    };
    setCustomNotesMap(updatedMap);
    localStorage.setItem('custom_lexicon_notes', JSON.stringify(updatedMap));
    showToast(`${selectedWordDetail.lemma} (${sId}) 연구 메모가 저장되었습니다.`);
  }, [selectedWordDetail, customNotesMap, customInputTrans, customInputMemo, currentBookMeta.ko, chapter, verse, showToast]);

  const handleCopyComprehensiveReport = useCallback(() => {
    let report = `# [원어 강해 리포트] ${currentBookMeta.ko} ${chapter}장 ${verse}절\n`;
    report += `> ${currentBookMeta.era} | ${currentBookMeta.empire}\n\n`;
    report += `- 개역개정 4판: ${koVerseText}\n`;
    if (literalVerseText) report += `- 원어 어순 직역: ${literalVerseText}\n`;
    if (webVerseText) report += `- WEB: ${webVerseText}\n\n`;
    words.forEach((w) => {
      report += `- ${w.inflected} (${w.lemma}) [${w.strongs}] | ${w.eng} | ${w.korContextual} | ${w.grammarDecoded}\n`;
    });
    navigator.clipboard.writeText(decodeHtmlEntities(report));
    showToast('원어 강해 리포트가 클립보드에 복사되었습니다.');
  }, [currentBookMeta, chapter, verse, koVerseText, literalVerseText, webVerseText, words, showToast]);

  const handleInsertToQT = useCallback(
    (word) => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        const todayData = allQt[today] || {};
        const insightText = `\n[원어묵상] ${word.inflected} (${word.lemma}, ${word.strongs}): ${word.korContextual} (${word.eng}) — ${word.grammarDecoded}\n`;
        allQt[today] = { ...todayData, qtMeditation: (todayData.qtMeditation || '') + insightText };
        localStorage.setItem('qt_daily', JSON.stringify(allQt));
        showToast('오늘 QT 묵상에 원어 연구 내용이 담겼습니다.');
      } catch (_) {}
    },
    [showToast]
  );

  const handleInsertToSermon = useCallback(
    (word) => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const allDaily = JSON.parse(localStorage.getItem('days_data') || '{}');
        const todayData = allDaily[today] || {};
        const insightHtml = `<p><b>[원어강해] ${word.inflected} (${word.lemma}, ${word.strongs})</b>: ${word.korContextual} (${word.eng}) — <i>${word.grammarDecoded}</i></p>`;
        allDaily[today] = { ...todayData, sermonNotes: (todayData.sermonNotes || '') + insightHtml };
        localStorage.setItem('days_data', JSON.stringify(allDaily));
        showToast('예배 설교노트에 원어 강해가 반영되었습니다.');
      } catch (_) {}
    },
    [showToast]
  );

  // =====================================================================
  // 다크/라이트 100% 호환 컴팩트 스타일 토큰 (AI스러움 배제)
  // =====================================================================
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 flex flex-col w-full max-w-full h-full ${pageBg} ${textMain} relative overflow-hidden font-sans select-none`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[9999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 슬림 고정 상단 헤더 */}
      <header className={`w-full px-3 sm:px-5 h-12 border-b ${borderClass} ${surfaceBg} shrink-0 flex items-center justify-between gap-2 z-30`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg md:hidden ${textMain} cursor-pointer`}
            aria-label="메뉴"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-lg ${textMain} hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer`}
            aria-label="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <ChurchSketchIcon name="scroll" className="w-5 h-5 shrink-0" isDarkMode={isDark} />
          <h1 className="text-[15px] font-bold tracking-tight truncate">원어 성경 연구</h1>
          <span className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded ${subBg} ${textSub} shrink-0`}>
            {isOT ? 'HEB·RTL' : 'GRK·LTR'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className={`h-8 px-2.5 rounded-lg text-[11.5px] font-bold border ${borderClass} ${subBg} flex items-center gap-1 cursor-pointer`}
          >
            <ChurchSketchIcon name="book-open" className="w-3.5 h-3.5" isDarkMode={isDark} />
            <span>서재</span>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('interlinear_jump', JSON.stringify({ book: currentBookMeta.ko, chapter, verse }));
              } catch (_) {}
              setActiveScreen('interlinear_kids');
            }}
            className={`h-8 px-2.5 rounded-lg text-[11.5px] font-bold border ${borderClass} ${subBg} cursor-pointer`}
          >
            키즈
          </button>
          <button
            type="button"
            onClick={handleCopyComprehensiveReport}
            className={`h-8 px-2.5 rounded-lg text-[11.5px] font-bold bg-[#2563EB] text-white flex items-center gap-1 cursor-pointer`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">리포트</span>
          </button>
        </div>
      </header>

      {/* 2. 컴팩트 권/장/절 네비게이션 바 (항상 상단 고정) */}
      <div className={`w-full px-3 sm:px-5 py-2 border-b ${borderClass} ${surfaceBg} shrink-0 z-20`}>
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[540px]">
            <select
              value={selectedBookIndex}
              onChange={(e) => {
                setSelectedBookIndex(Number(e.target.value));
                setChapter(1);
                setVerse(1);
              }}
              className={`flex-1 min-w-0 h-8 px-2 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[13px] font-bold outline-none cursor-pointer`}
            >
              <optgroup label="구약 성경 (39권)">
                {BIBLE_66_BOOKS.slice(0, 39).map((b, idx) => (
                  <option key={b.ko} value={idx}>{b.ko} ({b.en})</option>
                ))}
              </optgroup>
              <optgroup label="신약 성경 (27권)">
                {BIBLE_66_BOOKS.slice(39).map((b, idx) => (
                  <option key={b.ko} value={idx + 39}>{b.ko} ({b.en})</option>
                ))}
              </optgroup>
            </select>

            <select
              value={chapter}
              onChange={(e) => {
                setChapter(Number(e.target.value));
                setVerse(1);
              }}
              className={`w-[68px] h-8 px-1.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[13px] font-bold text-center outline-none cursor-pointer shrink-0`}
            >
              {Array.from({ length: chaptersCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}장</option>
              ))}
            </select>

            <select
              value={verse}
              onChange={(e) => setVerse(Number(e.target.value))}
              className={`w-[68px] h-8 px-1.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[13px] font-bold text-center outline-none cursor-pointer shrink-0`}
            >
              {Array.from({ length: versesCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}절</option>
              ))}
            </select>
          </div>

          <span className={`hidden xl:inline-block text-[12px] ${textSub} truncate`}>
            {currentBookMeta.era} · {currentBookMeta.empire}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrevVerse}
              className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[12px] font-bold flex items-center cursor-pointer`}
              title="이전 절"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextVerse}
              className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[12px] font-bold flex items-center cursor-pointer`}
              title="다음 절"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. 메인 능동형 워크스페이스 (PC/태블릿 2단 와이드 · 모바일 1단 콤팩트) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-5 pt-2.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* 좌측 7컬럼: 본문 대조 + 원어 뷰어 + 1:1 어절 형태론 분해 */}
          <div className="lg:col-span-7 space-y-2.5 min-w-0">
            {/* A. 다중 역본 & 오디오 & 3중 교차 매칭 카드 */}
            <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3 space-y-2.5`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-[15.5px] font-bold">
                    {currentBookMeta.ko} {chapter}:{verse}
                  </h2>
                  {koVersePericope && (
                    <span className="px-2 py-0.5 rounded bg-[#D97706]/15 text-[#D97706] text-[11px] font-bold truncate">
                      {koVersePericope}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { id: 'orig', label: isOT ? '히브리어' : '헬라어' },
                    { id: 'web', label: 'WEB' },
                    { id: 'krv', label: '개역개정' }
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => handleSpeakFullVerse(aud.id)}
                      className={`h-7 px-2 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer ${
                        playingAudioType === aud.id
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : `${borderClass} ${subBg} ${textSub}`
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingAudioType === aud.id ? '정지' : aud.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 역본 전환 탭 */}
              <div className={`flex p-0.5 rounded-lg ${subBg} text-[11.5px] font-bold overflow-x-auto hide-scrollbar gap-0.5`}>
                {[
                  { id: 'parallel', label: '동시대조' },
                  { id: 'trilingual', label: '3중 어절표' },
                  { id: 'web', label: 'WEB 스튜디오' },
                  { id: 'krv', label: '개역개정4판' },
                  { id: 'literal', label: '원어직역' },
                  { id: 'easy', label: '쉬운성경' }
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVersionChange(v.id)}
                    className={`flex-1 px-2.5 py-1.5 rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                      bibleVersion === v.id ? `${surfaceBg} ${textMain} shadow-2xs` : textSub
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* 활성 어절 3중 매칭 요약 스트립 */}
              {activeWordObj && (
                <div className={`p-2.5 rounded-xl border ${borderClass} ${subBg} space-y-2`}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-[#2563EB] text-white font-mono font-bold shrink-0">
                        {activeWordObj.strongs}
                      </span>
                      <span className="font-bold text-[#0D9488] shrink-0">{activeWordObj.grammarPos}</span>
                      <span className={`${textSub} truncate`}>{activeWordObj.grammarDecoded}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectWord(activeWordObj, true)}
                      className="text-[#2563EB] font-bold shrink-0 cursor-pointer hover:underline"
                    >
                      사전 상세
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div
                      onClick={() => speakAudio(activeWordObj.inflected, isOT ? 'he-IL' : 'el-GR')}
                      className={`p-1.5 rounded-lg ${surfaceBg} border ${borderClass} cursor-pointer min-w-0`}
                    >
                      <span className={`text-[10px] font-mono ${textSub} block truncate`}>{activeWordObj.pron || '원어'}</span>
                      <span style={originalFontStyle} className="text-[17px] font-bold block truncate">
                        {cleanTypography(activeWordObj.inflected, isOT, typographyMode)}
                      </span>
                    </div>
                    <div
                      onClick={() => handleWordClickInWeb(activeWordObj.eng, activeWordObj.word_order)}
                      className={`p-1.5 rounded-lg ${surfaceBg} border ${borderClass} cursor-pointer min-w-0`}
                    >
                      <span className={`text-[10px] ${textSub} block`}>영문 직역</span>
                      <span className="text-[13px] font-bold text-[#2563EB] block truncate mt-0.5">{activeWordObj.eng}</span>
                    </div>
                    <div
                      onClick={() => handleSelectWord(activeWordObj, true)}
                      className={`p-1.5 rounded-lg ${surfaceBg} border ${borderClass} cursor-pointer min-w-0`}
                    >
                      <span className={`text-[10px] ${textSub} block`}>한글 뜻</span>
                      <span className="text-[13px] font-bold text-[#0D9488] block truncate mt-0.5">{activeWordObj.korContextual}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 역본 본문 출력 */}
              <div className="space-y-2 text-left">
                {bibleVersion === 'krv' && (
                  <p className="text-[15.5px] leading-[1.8] break-keep">{renderInteractiveKoreanText(koVerseText)}</p>
                )}

                {bibleVersion === 'literal' && (
                  <div className={`p-2.5 rounded-lg ${subBg}`}>
                    <span className="text-[10.5px] font-mono font-bold text-[#0D9488] block mb-1">원어 어순 직역</span>
                    <p className="text-[14.5px] leading-[1.8]">{renderInteractiveWebText(literalVerseText || koVerseText)}</p>
                  </div>
                )}

                {bibleVersion === 'easy' && (
                  <p className="text-[15.5px] leading-[1.8] break-keep">{renderInteractiveKoreanText(easyVerseText || koVerseText)}</p>
                )}

                {bibleVersion === 'trilingual' && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5" dir={isOT ? 'rtl' : 'ltr'}>
                    {words.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => handleSelectWord(w, true)}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                          activeWordOrder === w.word_order ? 'border-[#2563EB] bg-[#2563EB]/10' : `${borderClass} ${subBg}`
                        }`}
                      >
                        <div style={originalFontStyle} className="text-[17px] font-bold truncate">
                          {cleanTypography(w.inflected, isOT, typographyMode)}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#2563EB] truncate" dir="ltr">{w.eng}</div>
                        <div className="text-[11.5px] font-bold text-[#0D9488] truncate" dir="ltr">{w.korContextual}</div>
                      </div>
                    ))}
                  </div>
                )}

                {bibleVersion === 'web' && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className={`flex p-0.5 rounded-lg ${subBg} text-[11px] font-bold`}>
                        {[
                          { id: 'word', label: '단어 매칭' },
                          { id: 'clauses', label: '절 직독직해' },
                          { id: 'paragraph', label: '전후 문단' }
                        ].map((sm) => (
                          <button
                            key={sm.id}
                            type="button"
                            onClick={() => setWebStudyMode(sm.id)}
                            className={`px-2.5 py-1 rounded-md cursor-pointer ${
                              webStudyMode === sm.id ? `${surfaceBg} ${textMain}` : textSub
                            }`}
                          >
                            {sm.label}
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (bilingualSearchInput.trim()) handleWordClickInWeb(bilingualSearchInput.trim());
                        }}
                        className="flex items-center gap-1 w-full sm:w-56"
                      >
                        <input
                          type="text"
                          value={bilingualSearchInput}
                          onChange={(e) => setBilingualSearchInput(e.target.value)}
                          placeholder="영/한 어휘 검색..."
                          className={`flex-1 h-7 px-2.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[11.5px] outline-none select-text`}
                        />
                        <button type="submit" className="h-7 px-2.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold cursor-pointer">
                          검색
                        </button>
                      </form>
                    </div>

                    {webStudyMode === 'word' && (
                      <div className="space-y-1.5">
                        <p className="text-[15px] leading-[1.8]">{renderInteractiveWebText(webVerseText || enVerseText)}</p>
                        <p className={`text-[13.5px] ${textSub} pt-1.5 border-t ${borderClass}`}>{renderInteractiveKoreanText(koVerseText)}</p>
                      </div>
                    )}

                    {webStudyMode === 'clauses' && (
                      <div className="space-y-1.5">
                        {isClauseTranslating ? (
                          <div className={`py-4 text-center text-[12px] ${textSub}`}>직독직해 분석 중...</div>
                        ) : (
                          translatedClauses.map((cl, idx) => (
                            <div key={idx} className={`p-2 rounded-lg border ${borderClass} ${subBg} space-y-1`}>
                              <p className="text-[13.5px] font-medium">{renderInteractiveWebText(cl.eng)}</p>
                              <p className="text-[12.5px] text-[#0D9488] font-medium">{cl.kor}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {webStudyMode === 'paragraph' && (
                      <div className="space-y-1.5">
                        {paragraphContextVerses.map((pv) => (
                          <div
                            key={pv.vNum}
                            onClick={() => setVerse(pv.vNum)}
                            className={`p-2.5 rounded-lg border cursor-pointer ${
                              pv.isCurrent ? 'border-[#2563EB] bg-[#2563EB]/5' : `${borderClass} ${subBg} opacity-80`
                            }`}
                          >
                            <span className="text-[11px] font-mono font-bold text-[#2563EB] block">
                              {currentBookMeta.en} {chapter}:{pv.vNum}
                            </span>
                            <p className="text-[13.5px] leading-snug mt-0.5">{pv.isCurrent ? renderInteractiveWebText(pv.web || enVerseText) : pv.web}</p>
                            <p className={`text-[12.5px] ${textSub} mt-0.5`}>{pv.krv}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {bibleVersion === 'parallel' && (
                  <div className="space-y-1.5">
                    <div className={`p-2.5 rounded-lg border ${borderClass} ${subBg}`}>
                      <span className="text-[10.5px] font-bold text-[#2563EB] block mb-0.5">개역개정 4판</span>
                      <p className="text-[15px] leading-[1.75] break-keep">{renderInteractiveKoreanText(koVerseText)}</p>
                    </div>
                    {easyVerseText && (
                      <div className={`p-2.5 rounded-lg border ${borderClass}`}>
                        <span className="text-[10.5px] font-bold text-[#0D9488] block mb-0.5">쉬운성경</span>
                        <p className="text-[14px] leading-[1.7] break-keep">{renderInteractiveKoreanText(easyVerseText)}</p>
                      </div>
                    )}
                    <div className={`p-2.5 rounded-lg border ${borderClass}`}>
                      <span className={`text-[10.5px] font-bold ${textSub} block mb-0.5`}>WEB (영단어 클릭 시 사전 오픈)</span>
                      <p className="text-[14px] leading-[1.7]">{renderInteractiveWebText(webVerseText || enVerseText)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 원어 원문 뷰어 */}
              <div className={`pt-2.5 border-t ${borderClass} space-y-2`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-[11px] font-mono font-bold ${textSub}`}>
                    {isOT ? 'BHS 히브리어 원문 (RTL)' : 'NA28 헬라어 원문 (LTR)'}
                  </span>
                  <div className={`flex p-0.5 rounded-lg ${subBg} text-[10.5px] font-bold`}>
                    {[
                      { id: 'vowels', label: '모음부호', show: true },
                      { id: 'consonants', label: '자음만', show: isOT },
                      { id: 'full', label: '악센트', show: isOT },
                      { id: 'phonetic', label: '한글독음', show: true }
                    ]
                      .filter((m) => m.show)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setTypographyMode(m.id)}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            typographyMode === m.id ? `${surfaceBg} text-[#2563EB]` : textSub
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                  </div>
                </div>

                {isLoading ? (
                  <div className={`py-4 text-center text-[12px] ${textSub}`}>원어 형태소를 불러오는 중입니다...</div>
                ) : typographyMode === 'phonetic' ? (
                  <p className="text-[14.5px] leading-relaxed">
                    {words.map((w) => (w.pron ? w.pron.replace(/[[\]]/g, '') : w.eng)).join(' ')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 items-baseline" dir={isOT ? 'rtl' : 'ltr'}>
                    {words.map((w) => (
                      <span
                        key={w.id}
                        onMouseEnter={() => setActiveWordOrder(w.word_order)}
                        onClick={() => handleSelectWord(w, true)}
                        style={originalFontStyle}
                        className={`text-[22px] sm:text-[26px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                          activeWordOrder === w.word_order
                            ? 'bg-[#2563EB] text-white'
                            : `${textMain} hover:bg-black/5 dark:hover:bg-white/10`
                        }`}
                      >
                        {cleanTypography(w.inflected, isOT, typographyMode)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* B. 단어별 1:1 형태론 · 어근 · 문법 분해 그리드 */}
            {!isLoading && words.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12.5px] font-bold">형태론 · 어근 분해 ({words.length}어절)</span>
                  <span className={`text-[11px] ${textSub}`}>어절 터치 시 렉시콘 · 문법 태그 터치 시 대백과</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" dir={isOT ? 'rtl' : 'ltr'}>
                  {words.map((word) => {
                    const isSelected = activeWordOrder === word.word_order;
                    const grammarTokens = tokenizeGrammarCode(word.grammarRaw, isOT);

                    return (
                      <div
                        key={word.id}
                        onMouseEnter={() => setActiveWordOrder(word.word_order)}
                        onClick={() => handleSelectWord(word, true)}
                        className={`rounded-xl p-2.5 border transition-colors cursor-pointer flex flex-col justify-between min-w-0 ${
                          isSelected ? 'border-[#2563EB] bg-[#2563EB]/8' : `${surfaceBg} ${borderClass} hover:border-[#2563EB]/50`
                        }`}
                      >
                        <div className={isOT ? 'text-right' : 'text-left'}>
                          <div className={`flex items-center justify-between gap-1 ${isOT ? 'flex-row-reverse' : ''}`}>
                            <span style={originalFontStyle} className="text-[20px] font-bold truncate">
                              {cleanTypography(word.inflected, isOT, typographyMode)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakAudio(word.inflected, isOT ? 'he-IL' : 'el-GR');
                              }}
                              className={`p-1 ${textSub} hover:text-[#2563EB] cursor-pointer shrink-0`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className={`text-[10.5px] font-mono ${textSub} block truncate`} dir="ltr">
                            {word.pron}
                          </span>
                          {word.isInflectedDifferent && (
                            <span className={`text-[10px] ${textSub} block truncate`} dir="ltr">
                              원형: <b style={originalFontStyle}>{cleanTypography(word.lemma, isOT, typographyMode)}</b>
                            </span>
                          )}
                        </div>

                        <div className={`my-1.5 border-t ${borderClass}`} />

                        <div className="text-left space-y-0.5 mb-1.5" dir="ltr">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[12.5px] font-bold truncate">{word.korContextual}</span>
                            <span className={`text-[10px] font-mono ${textSub} shrink-0`}>{word.strongs}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#2563EB] block truncate">{word.eng}</span>
                        </div>

                        <div className="flex flex-wrap gap-1" dir="ltr">
                          {grammarTokens.map((tok, tIdx) => (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGrammarWikiKey(tok.key);
                              }}
                              className={`text-[10px] px-1.5 py-0.5 rounded ${subBg} ${textSub} hover:text-[#2563EB] font-bold cursor-pointer truncate max-w-full`}
                            >
                              {tok.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* 우측 5컬럼: 10대 학술 연구 코퍼스 (PC 고정 사이드 패널 / 모바일 하단 스택) */}
          <aside className={`lg:col-span-5 ${surfaceBg} rounded-xl border ${borderClass} p-3 space-y-2.5 lg:sticky lg:top-2.5`}>
            <div className={`flex items-center justify-between gap-2 pb-2 border-b ${borderClass}`}>
              <div className="flex items-center gap-1.5">
                <ChurchSketchIcon name="compass" className="w-4 h-4" isDarkMode={isDark} />
                <span className="text-[13px] font-bold">학술 연구 코퍼스</span>
              </div>

              <div className={`flex p-0.5 rounded-lg ${subBg} text-[10.5px] font-bold`}>
                {[
                  { id: 'exegesis', label: '강해' },
                  { id: 'qt', label: 'QT' },
                  { id: 'academic', label: '사본' },
                  { id: 'all', label: '전체' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleWorkflowModeChange(m.id)}
                    className={`px-2 py-1 rounded-md cursor-pointer ${
                      workflowMode === m.id ? 'bg-[#2563EB] text-white' : textSub
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 빠른 이동 칩 */}
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {[
                { key: 'tsk', label: `TSK (${crossRefs.length})`, show: crossRefs.length > 0 },
                { key: 'hebrewSyntax', label: 'BHS 구문', show: Boolean(currentHebrewSyntax) },
                { key: 'commentary', label: '학술주석', show: Boolean(currentCommentary) },
                { key: 'matthewHenry', label: '매튜헨리', show: Boolean(currentMatthewHenry) },
                { key: 'lxx', label: '70인역', show: Boolean(currentLxxParallel) },
                { key: 'targumPeshitta', label: '타르굼', show: Boolean(currentTargumPeshitta) },
                { key: 'josephus', label: '요세푸스', show: Boolean(currentJosephus) },
                { key: 'geo', label: currentGeoData?.placeKo || '지리', show: Boolean(currentGeoData) },
                { key: 'netNotes', label: '사본비평', show: Boolean(currentNetNote) },
                { key: 'easton', label: currentEaston?.word || '백과', show: Boolean(currentEaston) }
              ]
                .filter((c) => c.show)
                .map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => scrollToPanel(c.key)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${subBg} ${textSub} hover:text-[#2563EB] shrink-0 cursor-pointer`}
                  >
                    {c.label}
                  </button>
                ))}
            </div>

            <div className="space-y-2">
              {/* 1. TSK 상호교차참조 */}
              <div id="panel-tsk" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => togglePanel('tsk')}
                  className={`w-full px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg} cursor-pointer`}
                >
                  <span>1. 상호교차참조 (TSK · {crossRefs.length})</span>
                  {openPanels.tsk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openPanels.tsk && (
                  <div className="p-2.5 flex flex-wrap gap-1.5">
                    {isTskLoading ? (
                      <span className={`text-[12px] ${textSub}`}>조회 중...</span>
                    ) : crossRefs.length === 0 ? (
                      <span className={`text-[12px] ${textSub}`}>연결된 교차참조가 없습니다.</span>
                    ) : (
                      crossRefs.map((ref, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleJumpToConcordanceVerse(ref.targetBook, ref.targetChapter, ref.targetVerse)}
                          className={`px-2 py-1 rounded-md text-[11.5px] font-bold border ${borderClass} ${subBg} hover:border-[#2563EB] hover:text-[#2563EB] cursor-pointer`}
                        >
                          {ref.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 2. BHS 히브리어 구문론 */}
              {currentHebrewSyntax && (
                <div id="panel-hebrewSyntax" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => togglePanel('hebrewSyntax')}
                    className={`w-full px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg} cursor-pointer`}
                  >
                    <span>2. BHS 히브리어 구문론</span>
                    {openPanels.hebrewSyntax ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openPanels.hebrewSyntax && (
                    <div className="p-2.5 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                          <div key={idx} className={`p-2 rounded-lg border ${borderClass}`} dir="rtl">
                            <div className="flex justify-between items-center gap-1">
                              <span style={originalFontStyle} className="font-bold text-[15px]">{c.unit}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${subBg} ${textSub}`} dir="ltr">{c.pauseType}</span>
                            </div>
                            <p className={`text-[11.5px] ${textSub} text-left mt-0.5`} dir="ltr">{c.role}</p>
                          </div>
                        ))}
                      </div>
                      <p className={`text-[12.5px] leading-relaxed ${textSub}`}>
                        {decodeHtmlEntities(currentHebrewSyntax.cantillationExegesis)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. 70인역(LXX) */}
              {currentLxxParallel && (
                <div id="panel-lxx" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => togglePanel('lxx')}
                    className={`w-full px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg} cursor-pointer`}
                  >
                    <span>3. 70인역(LXX) 대조 ({currentLxxParallel.otRef})</span>
                    {openPanels.lxx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openPanels.lxx && (
                    <div className="p-2.5 space-y-2 text-[12.5px]">
                      <div className={`p-2 rounded-lg border ${borderClass}`}>
                        <span className={`text-[10px] font-bold ${textSub} block`}>LXX</span>
                        <p style={{ fontFamily: "'SBL Greek', serif" }} className="text-[14.5px] font-bold">{currentLxxParallel.lxxText}</p>
                      </div>
                      <p className={textSub}>{decodeHtmlEntities(currentLxxParallel.differenceAnalysis)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. 타르굼 & 페시타 */}
              {currentTargumPeshitta && (
                <div id="panel-targumPeshitta" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => togglePanel('targumPeshitta')}
                    className={`w-full px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg} cursor-pointer`}
                  >
                    <span>4. 아람어 타르굼 & 페시타</span>
                    {openPanels.targumPeshitta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openPanels.targumPeshitta && (
                    <div className="p-2.5 space-y-2">
                      {currentTargumPeshitta.targumAramaic && (
                        <div className={`p-2 rounded-lg border ${borderClass}`} dir="rtl">
                          <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[15px] font-bold">{currentTargumPeshitta.targumAramaic}</p>
                          {currentTargumPeshitta.targumKo && <p className={`text-[12px] ${textSub} text-left mt-1`} dir="ltr">{decodeHtmlEntities(currentTargumPeshitta.targumKo)}</p>}
                        </div>
                      )}
                      {currentTargumPeshitta.peshittaSyriac && (
                        <div className={`p-2 rounded-lg border ${borderClass}`} dir="rtl">
                          <p className="text-[15px] font-bold">{currentTargumPeshitta.peshittaSyriac}</p>
                          {currentTargumPeshitta.peshittaKo && <p className={`text-[12px] ${textSub} text-left mt-1`} dir="ltr">{decodeHtmlEntities(currentTargumPeshitta.peshittaKo)}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 5. 요세푸스 사료 */}
              {currentJosephus && (
                <div id="panel-josephus" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => togglePanel('josephus')}
                    className={`w-full px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg} cursor-pointer`}
                  >
                    <span>5. 요세푸스 1세기 사료</span>
                    {openPanels.josephus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openPanels.josephus && (
                    <div className="p-2.5 space-y-1">
                      <span className="text-[12.5px] font-bold block">{decodeHtmlEntities(currentJosephus.historicalEvent)}</span>
                      <p className={`text-[12.5px] leading-relaxed ${textSub}`}>{decodeHtmlEntities(currentJosephus.summary)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 6. 성경 역사 지리학 */}
              {currentGeoData && (
                <div id="panel-geo" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-3 py-2 flex items-center justify-between text-[12.5px] font-bold ${subBg}`}>
                    <span onClick={() => togglePanel('geo')} className="cursor-pointer flex-1">
                      6. 역사 지리 ({currentGeoData.placeKo})
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${currentGeoData.lat},${currentGeoData.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#2563EB] flex items-center gap-0.5 mr-2"
                    >
                      <span>지도</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button type="button" onClick={() => togglePanel('geo')} className="cursor-pointer">
                      {openPanels.geo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {openPanels.geo && (
                    <div className="p-2.5 space-y-1">
                      <span className="text-[12.5px] font-bold block">{currentGeoData.placeKo} ({currentGeoData.placeEn})</span>
                      <p className={`text-[12.5px] leading-relaxed ${textSub}`}>{decodeHtmlEntities(currentGeoData.historicalSignificance)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 7. 학술 강해 주석 */}
              {currentCommentary && (
                <div id="panel-commentary" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-3 py-2 flex items-center justify-between gap-2 text-[12.5px] font-bold ${subBg}`}>
                    <span onClick={() => togglePanel('commentary')} className="cursor-pointer flex-1 truncate">
                      7. 학술 주석 ({currentCommentary.commentator})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`comm_${chapter}_${verse}`, currentCommentary.exegesis)}
                      className="px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] text-[10.5px] font-bold cursor-pointer shrink-0"
                    >
                      {translatingKeys[`comm_${chapter}_${verse}`] ? '번역 중...' : translatedMap[`comm_${chapter}_${verse}`] ? '원문' : '한국어 번역'}
                    </button>
                    <button type="button" onClick={() => togglePanel('commentary')} className="cursor-pointer">
                      {openPanels.commentary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {openPanels.commentary && (
                    <div className="p-3 space-y-2">
                      {renderParagraphBlocks(translatedMap[`comm_${chapter}_${verse}`] || currentCommentary.exegesis, textMain)}
                      {currentCommentary.theologicalNote && (
                        <div className={`pt-2 border-t ${borderClass}`}>
                          <span className="text-[11px] font-bold text-[#2563EB] block mb-1">교리 및 구속사적 의미</span>
                          {renderParagraphBlocks(currentCommentary.theologicalNote, textSub)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 8. 매튜 헨리 묵상 강해 */}
              {currentMatthewHenry && (
                <div id="panel-matthewHenry" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-3 py-2 flex items-center justify-between gap-2 text-[12.5px] font-bold ${subBg}`}>
                    <span onClick={() => togglePanel('matthewHenry')} className="cursor-pointer flex-1 truncate">
                      8. 매튜 헨리 묵상 강해
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`mh_${chapter}_${verse}`, currentMatthewHenry.devotionalExegesis)}
                      className="px-2 py-0.5 rounded bg-[#0D9488]/15 text-[#0D9488] text-[10.5px] font-bold cursor-pointer shrink-0"
                    >
                      {translatingKeys[`mh_${chapter}_${verse}`] ? '번역 중...' : translatedMap[`mh_${chapter}_${verse}`] ? '원문' : '한국어 번역'}
                    </button>
                    <button type="button" onClick={() => togglePanel('matthewHenry')} className="cursor-pointer">
                      {openPanels.matthewHenry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {openPanels.matthewHenry && (
                    <div className="p-3 space-y-2">
                      {renderParagraphBlocks(translatedMap[`mh_${chapter}_${verse}`] || currentMatthewHenry.devotionalExegesis, textMain)}
                      {currentMatthewHenry.practicalApplication && (
                        <div className={`pt-2 border-t ${borderClass}`}>
                          <span className="text-[11px] font-bold text-[#0D9488] block mb-1">삶의 적용</span>
                          {renderParagraphBlocks(currentMatthewHenry.practicalApplication, textSub)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 9. NET Bible 본문 비평 각주 */}
              {currentNetNote && (
                <div id="panel-netNotes" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-3 py-2 flex items-center justify-between gap-2 text-[12.5px] font-bold ${subBg}`}>
                    <span onClick={() => togglePanel('netNotes')} className="cursor-pointer flex-1 truncate">
                      9. NET 사본 비평 각주
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`net_${chapter}_${verse}`, currentNetNote.note)}
                      className="px-2 py-0.5 rounded bg-[#D97706]/15 text-[#D97706] text-[10.5px] font-bold cursor-pointer shrink-0"
                    >
                      {translatingKeys[`net_${chapter}_${verse}`] ? '번역 중...' : translatedMap[`net_${chapter}_${verse}`] ? '원문' : '한국어 번역'}
                    </button>
                    <button type="button" onClick={() => togglePanel('netNotes')} className="cursor-pointer">
                      {openPanels.netNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {openPanels.netNotes && (
                    <div className="p-3 space-y-1">
                      <span className="text-[12.5px] font-bold block">{decodeHtmlEntities(currentNetNote.title)}</span>
                      {renderParagraphBlocks(translatedMap[`net_${chapter}_${verse}`] || currentNetNote.note, textSub)}
                    </div>
                  )}
                </div>
              )}

              {/* 10. 이스톤 성경 백과사전 */}
              {currentEaston && (
                <div id="panel-easton" className={`rounded-xl border ${borderClass} overflow-hidden`}>
                  <div className={`px-3 py-2 flex items-center justify-between gap-2 text-[12.5px] font-bold ${subBg}`}>
                    <span onClick={() => togglePanel('easton')} className="cursor-pointer flex-1 truncate">
                      10. 이스톤 백과사전 ({currentEaston.word})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`easton_${chapter}_${verse}`, currentEaston.definition)}
                      className="px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] text-[10.5px] font-bold cursor-pointer shrink-0"
                    >
                      {translatingKeys[`easton_${chapter}_${verse}`] ? '번역 중...' : translatedMap[`easton_${chapter}_${verse}`] ? '원문' : '한국어 번역'}
                    </button>
                    <button type="button" onClick={() => togglePanel('easton')} className="cursor-pointer">
                      {openPanels.easton ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {openPanels.easton && (
                    <div className="p-3">
                      {renderParagraphBlocks(translatedMap[`easton_${chapter}_${verse}`] || currentEaston.definition, textSub)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* WEB 영한/한영 사전 모달 */}
      {selectedWebLexiconWord && (
        <div
          onClick={() => setSelectedWebLexiconWord(null)}
          className="fixed inset-0 z-[999999] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-4 flex flex-col max-h-[82vh] overflow-hidden`}
          >
            <div className={`flex justify-between items-center pb-2.5 border-b ${borderClass}`}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#2563EB]">영한 · 신학 사전</span>
                <span className={`text-[11px] px-2 py-0.5 rounded ${subBg} ${textSub}`}>{selectedWebLexiconWord.pos}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => speakAudio(selectedWebLexiconWord.word, 'en-US')}
                  className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setSelectedWebLexiconWord(null)} className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`p-3 my-2.5 rounded-xl ${subBg} space-y-1`}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[20px] font-bold">{selectedWebLexiconWord.word}</h3>
                <span className="text-[14px] font-bold text-[#0D9488]">{selectedWebLexiconWord.kor}</span>
              </div>
              {selectedWebLexiconWord.orig && (
                <p className={`text-[12px] font-mono ${textSub}`}>
                  대응 원어: {selectedWebLexiconWord.orig} ({selectedWebLexiconWord.strongs})
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-[13px] hide-scrollbar">
              {isWebLexiconLoading ? (
                <div className={`py-6 text-center ${textSub}`}>사전 데이터 조회 중...</div>
              ) : (
                <>
                  {selectedWebLexiconWord.theology && (
                    <div className={`p-3 rounded-xl border ${borderClass}`}>
                      <span className="text-[11px] font-bold text-[#D97706] block mb-1">성경적 용례</span>
                      <p className="leading-relaxed">{selectedWebLexiconWord.theology}</p>
                    </div>
                  )}
                  {selectedWebLexiconWord.details && (
                    <div className={`p-3 rounded-xl border ${borderClass}`}>
                      <span className={`text-[11px] font-bold ${textSub} block mb-1`}>품사별 정의</span>
                      <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">{selectedWebLexiconWord.details}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 원어 단어 심층 렉시콘 모달 (문법·품사·어근·어원·전권 용례) */}
      {selectedWordDetail && (
        <div
          onClick={() => setSelectedWordDetail(null)}
          className="fixed inset-0 z-[999999] bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-4 flex flex-col max-h-[88vh] overflow-hidden`}
          >
            <div className={`flex justify-between items-center pb-2.5 border-b ${borderClass}`}>
              <span className="text-[12px] font-mono font-bold text-[#2563EB]">
                {selectedWordDetail.strongs} · {selectedWordDetail.lexicon?.sourceName}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => speakAudio(selectedWordDetail.inflected, isOT ? 'he-IL' : 'el-GR')}
                  className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setSelectedWordDetail(null)} className={`p-1.5 rounded-lg ${subBg} cursor-pointer`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-xl ${subBg} my-2.5 grid grid-cols-2 gap-3`}>
              <div className="min-w-0">
                <span className={`text-[10.5px] ${textSub} block`}>본문 어형</span>
                <span style={originalFontStyle} className="text-[22px] font-bold block truncate">{selectedWordDetail.inflected}</span>
                <span className={`text-[11.5px] font-mono ${textSub} block truncate`}>{selectedWordDetail.pron}</span>
              </div>
              <div className={`border-l ${borderClass} pl-3 min-w-0`}>
                <span className={`text-[10.5px] ${textSub} block`}>원형 · 어근</span>
                <span style={originalFontStyle} className="text-[20px] font-bold block truncate">{selectedWordDetail.lemma}</span>
                <span className="text-[12.5px] font-bold text-[#0D9488] block truncate">{selectedWordDetail.korContextual} ({selectedWordDetail.eng})</span>
              </div>
            </div>

            <div className={`flex p-0.5 rounded-xl ${subBg} text-[12px] font-bold mb-2.5 shrink-0`}>
              {[
                { id: 'korean', label: '문법 · 어근' },
                { id: 'full_lexicon', label: 'BDB / Thayer' },
                { id: 'concordance', label: `전권 용례 (${concordanceTotalCount})` },
                { id: 'custom_study', label: '연구 메모' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg cursor-pointer ${
                    modalTab === tab.id ? `${surfaceBg} text-[#2563EB]` : textSub
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-[13px] hide-scrollbar">
              {modalTab === 'korean' && (
                <>
                  <div className={`p-3 rounded-xl border ${borderClass} space-y-1`}>
                    <span className={`text-[11px] font-bold ${textSub} block`}>품사 및 정밀 형태론</span>
                    <p className="font-bold text-[14px]">{selectedWordDetail.grammarDecoded}</p>
                    <p className={`text-[11.5px] font-mono ${textSub}`}>코드: {selectedWordDetail.grammarRaw || 'N/A'}</p>
                  </div>
                  {selectedWordDetail.theologyInsight && (
                    <div className={`p-3 rounded-xl border ${borderClass} space-y-1`}>
                      <span className="text-[12px] font-bold text-[#D97706] block">{selectedWordDetail.theologyInsight.stemTitle}</span>
                      <p className="leading-relaxed">{selectedWordDetail.theologyInsight.stemDesc}</p>
                      {selectedWordDetail.theologyInsight.aspectDesc && (
                        <p className={`text-[12px] ${textSub} pt-1 border-t ${borderClass}`}>{selectedWordDetail.theologyInsight.aspectDesc}</p>
                      )}
                    </div>
                  )}
                  {selectedWordDetail.note && (
                    <div className={`p-3 rounded-xl border ${borderClass}`}>
                      <span className="text-[11px] font-bold text-[#0D9488] block mb-1">구속사적 의미</span>
                      <p className="leading-relaxed">{selectedWordDetail.note}</p>
                    </div>
                  )}
                </>
              )}

              {modalTab === 'full_lexicon' && (
                <>
                  <div className={`p-3 rounded-xl border ${borderClass}`}>
                    <span className={`text-[11px] font-bold ${textSub} block`}>어원 및 파생 (Etymology)</span>
                    <p className="mt-1 leading-relaxed">{decodeHtmlEntities(selectedWordDetail.lexicon?.etymology)}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${borderClass}`}>
                    <span className={`text-[11px] font-bold ${textSub} block`}>기본 정의 (Definition)</span>
                    <p className="mt-1 leading-relaxed">{decodeHtmlEntities(selectedWordDetail.lexicon?.meaning)}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${borderClass}`}>
                    <span className={`text-[11px] font-bold ${textSub} block`}>원전 사전 전문</span>
                    <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed mt-1">
                      {decodeHtmlEntities(selectedWordDetail.lexicon?.rawFull)}
                    </pre>
                  </div>
                </>
              )}

              {modalTab === 'concordance' && (
                <div className="space-y-2">
                  {Object.keys(concordanceDistribution).length > 0 && (
                    <div className={`p-2.5 rounded-xl border ${borderClass} flex flex-wrap gap-1.5`}>
                      {Object.entries(concordanceDistribution).map(([secName, cnt]) => (
                        <span key={secName} className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${subBg}`}>
                          {secName} <b className="text-[#2563EB]">{cnt}</b>
                        </span>
                      ))}
                    </div>
                  )}
                  {isConcordanceLoading ? (
                    <div className={`py-6 text-center ${textSub}`}>전권 용례 조회 중...</div>
                  ) : (
                    concordanceList.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleJumpToConcordanceVerse(item.book, item.chapter, item.verse)}
                        className={`p-2.5 rounded-xl border ${borderClass} flex items-center justify-between gap-2 cursor-pointer hover:border-[#2563EB]`}
                      >
                        <span className="font-bold text-[12.5px] text-[#2563EB] shrink-0">
                          {item.book} {item.chapter}:{item.verse}
                        </span>
                        <span style={originalFontStyle} className="font-bold text-[16px] truncate">
                          {cleanTypography(item.original_word, isOT, typographyMode)}
                        </span>
                        <span className={`text-[12px] ${textSub} truncate max-w-[110px] shrink-0`}>{item.korean_trans}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {modalTab === 'custom_study' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInputTrans}
                    onChange={(e) => setCustomInputTrans(e.target.value)}
                    placeholder="나만의 한국어 대표 번역어"
                    className={`w-full p-2.5 rounded-xl border ${borderClass} ${subBg} ${textMain} text-[13px] outline-none select-text`}
                  />
                  <textarea
                    rows={3}
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    placeholder="심층 신학 연구 메모를 기록하세요"
                    className={`w-full p-2.5 rounded-xl border ${borderClass} ${subBg} ${textMain} text-[13px] outline-none resize-none select-text`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomLexiconNote}
                    className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-[13px] cursor-pointer"
                  >
                    연구 메모 저장
                  </button>
                </div>
              )}
            </div>

            <div className={`pt-2.5 mt-2 border-t ${borderClass} grid grid-cols-2 gap-2 shrink-0`}>
              <button
                type="button"
                onClick={() => handleInsertToQT(selectedWordDetail)}
                className="py-2.5 rounded-xl bg-[#0D9488] text-white font-bold text-[12.5px] cursor-pointer"
              >
                QT 묵상에 삽입
              </button>
              <button
                type="button"
                onClick={() => handleInsertToSermon(selectedWordDetail)}
                className="py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-[12.5px] cursor-pointer"
              >
                설교노트에 삽입
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나의 연구 서재 모달 */}
      {isLibraryOpen && (
        <div
          onClick={() => setIsLibraryOpen(false)}
          className="fixed inset-0 z-[999999] bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} p-4 flex flex-col max-h-[80vh]`}
          >
            <div className={`flex justify-between items-center pb-2.5 mb-2.5 border-b ${borderClass}`}>
              <h3 className="font-bold text-[15px]">나의 원어 연구 서재</h3>
              <button type="button" onClick={() => setIsLibraryOpen(false)} className={`p-1 ${textSub} cursor-pointer`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[12.5px] hide-scrollbar">
              {Object.keys(customNotesMap).length === 0 ? (
                <div className={`py-8 text-center ${textSub}`}>저장된 연구 메모가 없습니다.</div>
              ) : (
                Object.values(customNotesMap).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.book && item.chapter && item.verse) {
                        handleJumpToConcordanceVerse(item.book, item.chapter, item.verse);
                      }
                    }}
                    className={`p-3 rounded-xl border ${borderClass} ${subBg} cursor-pointer space-y-1`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>{item.lemma} ({item.strongs})</span>
                      <span className="text-[#2563EB]">{item.book} {item.chapter}:{item.verse}</span>
                    </div>
                    {item.translation && <p className="font-medium">번역: {item.translation}</p>}
                    {item.memo && <p className={textSub}>{item.memo}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 문법 대백과 모달 */}
      {selectedGrammarWikiKey && (
        <GrammarWikiModal
          encyclopediaKey={selectedGrammarWikiKey}
          onClose={() => setSelectedGrammarWikiKey(null)}
          isDarkMode={isDark}
        />
      )}
    </div>
  );
}
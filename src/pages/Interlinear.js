// src/pages/Interlinear.js (PART 1)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import { tokenizeGrammarCode } from '../lib/biblicalGrammarWiki';
import GrammarWikiModal from '../lib/GrammarWikiModal';

// =====================================================================
// 📜 성경 66권 정경 메타데이터 & 구속사 연대기 마스터 맵
// =====================================================================
const BIBLE_66_BOOKS = [
  // 구약 39권
  { ko: "창세기", en: "Genesis", isOT: true, maxChap: 50, section: "모세오경", era: "B.C. 1446년경 (창조~족장 시대)", empire: "원역사 / 애굽 중왕국" },
  { ko: "출애굽기", en: "Exodus", isOT: true, maxChap: 40, section: "모세오경", era: "B.C. 1446년경 (출애굽과 광야 여정)", empire: "애굽 신왕국(18왕조)" },
  { ko: "레위기", en: "Leviticus", isOT: true, maxChap: 27, section: "모세오경", era: "B.C. 1445년경 (시내산 율법 수여)", empire: "애굽 신왕국" },
  { ko: "민수기", en: "Numbers", isOT: true, maxChap: 36, section: "모세오경", era: "B.C. 1445-1406 (40년 광야 방랑)", empire: "가나안 진입기" },
  { ko: "신명기", en: "Deuteronomy", isOT: true, maxChap: 34, section: "모세오경", era: "B.C. 1406년경 (모압 평지 고별 설교)", empire: "고대 근동 정복기" },
  { ko: "여호수아", en: "Joshua", isOT: true, maxChap: 24, section: "역사서", era: "B.C. 1406-1375 (가나안 정복과 분배)", empire: "가나안 도시국가기" },
  { ko: "사사기", en: "Judges", isOT: true, maxChap: 21, section: "역사서", era: "B.C. 1375-1050 (사사 통치 암흑기)", empire: "블레셋 / 가나안 족속" },
  { ko: "룻기", en: "Ruth", isOT: true, maxChap: 4, section: "역사서", era: "B.C. 1100년경 (사사 시대 말기)", empire: "사사 시대" },
  { ko: "사무엘상", en: "1 Samuel", isOT: true, maxChap: 31, section: "역사서", era: "B.C. 1050-1010 (왕정 수립과 사울 통치)", empire: "통일왕국 태동기" },
  { ko: "사무엘하", en: "2 Samuel", isOT: true, maxChap: 24, section: "역사서", era: "B.C. 1010-970 (다윗 왕조의 번영)", empire: "이스라엘 통일왕국" },
  { ko: "열왕기상", en: "1 Kings", isOT: true, maxChap: 22, section: "역사서", era: "B.C. 970-853 (솔로몬과 분열왕국 초기)", empire: "남북 분열왕국기" },
  { ko: "열왕기하", en: "2 Kings", isOT: true, maxChap: 25, section: "역사서", era: "B.C. 853-586 (북이스라엘/남유다 멸망)", empire: "앗수르 / 신바벨론" },
  { ko: "역대상", en: "1 Chronicles", isOT: true, maxChap: 29, section: "역사서", era: "B.C. 450년경 기록 (다윗 언약 계승)", empire: "페르시아(바사) 제국" },
  { ko: "역대하", en: "2 Chronicles", isOT: true, maxChap: 36, section: "역사서", era: "B.C. 450년경 기록 (솔로몬 성전~귀환령)", empire: "페르시아 제국" },
  { ko: "에스라", en: "Ezra", isOT: true, maxChap: 10, section: "역사서", era: "B.C. 538-450 (1·2차 포로 귀환 및 성전)", empire: "페르시아 제국 (고레스/아닥사스다)" },
  { ko: "느헤미야", en: "Nehemiah", isOT: true, maxChap: 13, section: "역사서", era: "B.C. 445-420 (3차 귀환과 성벽 재건)", empire: "페르시아 제국" },
  { ko: "에스더", en: "Esther", isOT: true, maxChap: 10, section: "역사서", era: "B.C. 483-473 (페르시아 수산궁 구원)", empire: "페르시아 제국 (아하수에로 1세)" },
  { ko: "욥기", en: "Job", isOT: true, maxChap: 42, section: "시가서", era: "B.C. 2000년경 배경 (족장 시대 고난)", empire: "우르 제3왕조 / 족장 시대" },
  { ko: "시편", en: "Psalms", isOT: true, maxChap: 150, section: "시가서", era: "B.C. 1410-430 (모세부터 포로 귀환기까지)", empire: "통일왕국 / 포로후기" },
  { ko: "잠언", en: "Proverbs", isOT: true, maxChap: 31, section: "시가서", era: "B.C. 970-700 (솔로몬과 히스기야 시대)", empire: "이스라엘 왕정기" },
  { ko: "전도서", en: "Ecclesiastes", isOT: true, maxChap: 12, section: "시가서", era: "B.C. 935년경 (솔로몬 노년의 지혜)", empire: "이스라엘 왕정기" },
  { ko: "아가", en: "Song of Solomon", isOT: true, maxChap: 8, section: "시가서", era: "B.C. 960년경 (솔로몬 청년기 언약적 사랑)", empire: "이스라엘 왕정기" },
  { ko: "이사야", en: "Isaiah", isOT: true, maxChap: 66, section: "선지서", era: "B.C. 740-681 (남유다 4대 왕기 예언)", empire: "앗수르 제국 발흥기" },
  { ko: "예레미야", en: "Jeremiah", isOT: true, maxChap: 52, section: "선지서", era: "B.C. 627-580 (예루살렘 함락 눈물의 선지자)", empire: "신바벨론 제국 (느부갓네살)" },
  { ko: "예레미야애가", en: "Lamentations", isOT: true, maxChap: 5, section: "선지서", era: "B.C. 586년경 (예루살렘 파괴 비가)", empire: "신바벨론 제국" },
  { ko: "에스겔", en: "Ezekiel", isOT: true, maxChap: 48, section: "선지서", era: "B.C. 593-571 (그발 강가 바벨론 포로지)", empire: "신바벨론 제국" },
  { ko: "다니엘", en: "Daniel", isOT: true, maxChap: 12, section: "선지서", era: "B.C. 605-536 (바벨론/페르시아 궁정 예언)", empire: "바벨론 / 메대-페르시아" },
  { ko: "호세아", en: "Hosea", isOT: true, maxChap: 14, section: "선지서", era: "B.C. 755-715 (북이스라엘 말기 언약적 사랑)", empire: "앗수르 침공기" },
  { ko: "요엘", en: "Joel", isOT: true, maxChap: 3, section: "선지서", era: "B.C. 835년경 (메뚜기 재앙과 여호와의 날)", empire: "남유다 요아스 왕조" },
  { ko: "아모스", en: "Amos", isOT: true, maxChap: 9, section: "선지서", era: "B.C. 760-750 (여로보암 2세 번영기 정의 선포)", empire: "남북 왕국 전성기" },
  { ko: "오바댜", en: "Obadiah", isOT: true, maxChap: 1, section: "선지서", era: "B.C. 586년경 (에돔을 향한 심판 선고)", empire: "신바벨론 제국기" },
  { ko: "요나", en: "Jonah", isOT: true, maxChap: 4, section: "선지서", era: "B.C. 780-760 (앗수르 수도 니느웨 회개)", empire: "앗수르 제국" },
  { ko: "미가", en: "Micah", isOT: true, maxChap: 7, section: "선지서", era: "B.C. 735-700 (베들레헴 탄생 예언)", empire: "앗수르 위협기" },
  { ko: "나훔", en: "Nahum", isOT: true, maxChap: 3, section: "선지서", era: "B.C. 663-612 (니느웨의 최후 몰락)", empire: "앗수르 제국 멸망기" },
  { ko: "하박국", en: "Habakkuk", isOT: true, maxChap: 3, section: "선지서", era: "B.C. 607년경 (의인은 믿음으로 살리라)", empire: "갈대아(바벨론) 발흥기" },
  { ko: "스바냐", en: "Zephaniah", isOT: true, maxChap: 3, section: "선지서", era: "B.C. 630년경 (요시야 종교개혁 배경)", empire: "신바벨론 제국 전야" },
  { ko: "학개", en: "Haggai", isOT: true, maxChap: 2, section: "선지서", era: "B.C. 520년 (제2성전 재건 촉구)", empire: "페르시아 제국 (다리오 1세)" },
  { ko: "스가랴", en: "Zechariah", isOT: true, maxChap: 14, section: "선지서", era: "B.C. 520-480 (메시아 왕국과 종말론적 승리)", empire: "페르시아 제국" },
  { ko: "말라기", en: "Malachi", isOT: true, maxChap: 4, section: "선지서", era: "B.C. 430년경 (구약의 마지막 예언자)", empire: "페르시아 제국 (중간기 직전)" },

  // 신약 27권
  { ko: "마태복음", en: "Matthew", isOT: false, maxChap: 28, section: "복음서", era: "A.D. 55-65년경 (유대인을 위한 메시아)", empire: "로마 제국 (네로/클라우디우스)" },
  { ko: "마가복음", en: "Mark", isOT: false, maxChap: 16, section: "복음서", era: "A.D. 50-60년경 (고난받는 종 예수)", empire: "로마 제국" },
  { ko: "누가복음", en: "Luke", isOT: false, maxChap: 24, section: "복음서", era: "A.D. 60-62년경 (인자로 오신 구주)", empire: "로마 제국" },
  { ko: "요한복음", en: "John", isOT: false, maxChap: 21, section: "복음서", era: "A.D. 85-90년경 (말씀이 육신이 되심)", empire: "로마 제국 (도미티아누스)" },
  { ko: "사도행전", en: "Acts", isOT: false, maxChap: 28, section: "역사서", era: "A.D. 62-64년경 (성령의 행전과 복음 확산)", empire: "로마 제국" },
  { ko: "로마서", en: "Romans", isOT: false, maxChap: 16, section: "서신서", era: "A.D. 57년경 (고린도 집필, 이신칭의)", empire: "로마 제국" },
  { ko: "고린도전서", en: "1 Corinthians", isOT: false, maxChap: 16, section: "서신서", era: "A.D. 55년경 (에베소 집필, 교회 회복)", empire: "로마 제국" },
  { ko: "고린도후서", en: "2 Corinthians", isOT: false, maxChap: 13, section: "서신서", era: "A.D. 56년경 (마게도냐 집필, 사도권 변호)", empire: "로마 제국" },
  { ko: "갈라디아서", en: "Galatians", isOT: false, maxChap: 6, section: "서신서", era: "A.D. 48-49년경 (안디옥 집필, 오직 은혜)", empire: "로마 제국" },
  { ko: "에베소서", en: "Ephesians", isOT: false, maxChap: 6, section: "서신서", era: "A.D. 60-62년경 (로마 옥중, 교회론 완성)", empire: "로마 제국" },
  { ko: "빌립보서", en: "Philippians", isOT: false, maxChap: 4, section: "서신서", era: "A.D. 61-62년경 (로마 옥중, 주 안의 기쁨)", empire: "로마 제국" },
  { ko: "골로새서", en: "Colossians", isOT: false, maxChap: 4, section: "서신서", era: "A.D. 60-62년경 (로마 옥중, 만유의 으뜸 그리스도)", empire: "로마 제국" },
  { ko: "데살로니가전서", en: "1 Thessalonians", isOT: false, maxChap: 5, section: "서신서", era: "A.D. 51년경 (고린도 집필, 재림의 소망)", empire: "로마 제국" },
  { ko: "데살로니가후서", en: "2 Thessalonians", isOT: false, maxChap: 3, section: "서신서", era: "A.D. 51-52년경 (주의 날과 근면한 삶)", empire: "로마 제국" },
  { ko: "디모데전서", en: "1 Timothy", isOT: false, maxChap: 6, section: "서신서", era: "A.D. 63-65년경 (마게도냐 집필, 목회 규범)", empire: "로마 제국" },
  { ko: "디모데후서", en: "2 Timothy", isOT: false, maxChap: 4, section: "서신서", era: "A.D. 66-67년경 (로마 지하감옥, 바울의 유언)", empire: "로마 제국 (네로 박해기)" },
  { ko: "디도서", en: "Titus", isOT: false, maxChap: 3, section: "서신서", era: "A.D. 63-65년경 (그레데 교회 목회 지침)", empire: "로마 제국" },
  { ko: "빌레몬서", en: "Philemon", isOT: false, maxChap: 1, section: "서신서", era: "A.D. 60-62년경 (오네시모 용서와 형제애)", empire: "로마 제국" },
  { ko: "히브리서", en: "Hebrews", isOT: false, maxChap: 13, section: "서신서", era: "A.D. 67-69년경 (대제사장 그리스도의 우월성)", empire: "로마 제국 (성전 멸망 직전)" },
  { ko: "야고보서", en: "James", isOT: false, maxChap: 5, section: "서신서", era: "A.D. 45-48년경 (행함이 있는 참된 믿음)", empire: "로마 제국" },
  { ko: "베드로전서", en: "1 Peter", isOT: false, maxChap: 5, section: "서신서", era: "A.D. 64년경 (로마 집필, 고난 속의 산 소망)", empire: "로마 제국 (네로 박해기)" },
  { ko: "베드로후서", en: "2 Peter", isOT: false, maxChap: 3, section: "서신서", era: "A.D. 66-67년경 (거짓 교사 경계와 주의 재림)", empire: "로마 제국" },
  { ko: "요한일서", en: "1 John", isOT: false, maxChap: 5, section: "서신서", era: "A.D. 85-95년경 (에베소 집필, 사랑과 진리)", empire: "로마 제국" },
  { ko: "요한이서", en: "2 John", isOT: false, maxChap: 1, section: "서신서", era: "A.D. 85-95년경 (진리 안에서의 사랑과 경계)", empire: "로마 제국" },
  { ko: "요한삼서", en: "3 John", isOT: false, maxChap: 1, section: "서신서", era: "A.D. 85-95년경 (진리를 영접하는 환대)", empire: "로마 제국" },
  { ko: "유다서", en: "Jude", isOT: false, maxChap: 1, section: "서신서", era: "A.D. 65-80년경 (믿음의 도를 위한 힘써 싸움)", empire: "로마 제국" },
  { ko: "요한계시록", en: "Revelation", isOT: false, maxChap: 22, section: "서신서", era: "A.D. 95년경 (밧모섬 유배, 어린양의 최종 승리)", empire: "로마 제국 (도미티아누스)" }
];

const BOOK_SECTION_LOOKUP = {};
BIBLE_66_BOOKS.forEach(b => { BOOK_SECTION_LOOKUP[b.ko] = b.section; });

// 🌟 [핵심 신학 영한 사전 DB] 주요 성경 단어 구속사적 뜻풀이 내장
const BIBLICAL_ENG_KOR_LEXICON = {
  "god": { kor: "하나님, 참 신", pos: "명사", theology: "유일무이하신 천지만물의 창조주이자 구속주 하나님 (Elohim / Theos)" },
  "lord": { kor: "주, 여호와", pos: "명사", theology: "언약의 주권자 여호와(YHWH), 만유의 주재이신 예수 그리스도(Kyrios)" },
  "beginning": { kor: "태초, 시작", pos: "명사", theology: "시간과 물질 창조의 절대적 출발점이자 그리스도 안에서의 새 창조" },
  "created": { kor: "창조하셨다", pos: "동사", theology: "무(無)로부터의 절대적 신적 창조 (Bara). 하나님만이 주어가 되시는 고유 행위" },
  "heavens": { kor: "하늘들, 궁창", pos: "명사", theology: "하나님의 보좌와 영광이 깃든 영역이자 광대한 우주 공간" },
  "earth": { kor: "땅, 지구, 세상", pos: "명사", theology: "인간을 위해 지으신 삶의 터전이자 장차 새 하늘과 새 땅으로 갱신될 피조세계" },
  "spirit": { kor: "영, 성령, 숨결", pos: "명사", theology: "생명을 불어넣으시는 하나님의 영 (Ruach / Pneuma)" },
  "covenant": { kor: "언약, 약조", pos: "명사", theology: "하나님께서 피로써 백성과 맺으신 불변의 구속사적 약속 (Berith / Diatheke)" },
  "grace": { kor: "은혜, 은총", pos: "명사", theology: "자격 없는 죄인에게 거저 주시는 하나님의 주권적 구원의 선물 (Charis / Chesed)" },
  "faith": { kor: "믿음, 신뢰", pos: "명사", theology: "보이지 않는 하나님과 그리스도의 구속 사역을 전인격적으로 의지함 (Pistis / Emunah)" },
  "righteousness": { kor: "의, 공의", pos: "명사", theology: "하나님의 거룩한 기준에 부합함, 그리스도로부터 성도에게 전가된 완전한 의" },
  "salvation": { kor: "구원, 건지심", pos: "명사", theology: "죄와 사망의 권세에서 그리스도의 십자가 대속으로 해방되는 전인적 구원" },
  "holy": { kor: "거룩한, 성결한", pos: "형용사", theology: "세속과 구별된 하나님의 초월적 속성이며 성도에게 요구되는 영적 상태" },
  "peace": { kor: "평안, 평화, 샬롬", pos: "명사", theology: "하나님과의 관계 회복에서 오는 온전한 안식과 번영 (Shalom / Eirene)" },
  "light": { kor: "빛, 광명", pos: "명사", theology: "어둠을 물리치시는 하나님의 영광, 진리, 예수 그리스도의 임재" },
  "darkness": { kor: "어둠, 흑암", pos: "명사", theology: "빛과 질서가 없는 혼돈의 상태, 영적 무지와 죄의 세력" },
  "flesh": { kor: "육체, 육신", pos: "명사", theology: "연약한 인간 본성 또는 하나님을 거스르는 타락한 정욕 (Sarx / Basar)" },
  "blood": { kor: "피, 보혈", pos: "명사", theology: "생명의 근원이자 죄 사함을 위한 언약적 대속의 표징" },
  "sin": { kor: "죄, 과녁을 벗어남", pos: "명사", theology: "하나님의 법과 거룩한 기준에서 벗어남 (Hamartia / Chata)" },
  "repent": { kor: "회개하다, 돌이키다", pos: "동사", theology: "생각과 삶의 방향을 전인격적으로 하나님께로 돌이킴 (Metanoeo / Shub)" },
  "love": { kor: "사랑, 아가페", pos: "명사/동사", theology: "자기를 내어주시는 하나님의 무조건적이고 영원한 언약적 사랑 (Agape / Ahavah)" }
};

const FALLBACK_ENGLISH_TRANSLATION_MAP = {
  'break away': '배반하다, 반역하다', 'moab': '모압', 'properly': '후(後)에, 뒤에',
  'ahaziah': '아하시야', 'ahab': '아합', 'die': '죽다, 사망하다', 'fall': '떨어지다, 넘어지다',
  'sick': '병들다, 앓다', 'send': '보내다, 파견하다', 'messengers': '사자들, 전령들',
  'inquire': '묻다, 구하다', 'baalzebub': '바알세붑', 'ekron': '에그론', 'recover': '낫다, 회복하다',
  'disease': '병, 질병', 'angel': '사자, 천사', 'arise': '일어나다', 'go up': '올라가다',
  'meet': '만나다', 'king': '왕, 군왕', 'samaria': '사마리아', 'god': '하나님, 신'
};

// 실시간 단락별 영한 번역 엔진
async function fetchKoreanTranslation(text) {
  if (!text || typeof text !== 'string') return '';
  const rawParagraphs = text.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);
  const chunks = rawParagraphs.length > 0 ? rawParagraphs : [text.trim()];

  const translatedChunks = await Promise.all(
    chunks.map(async (para) => {
      if (!para) return '';
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(para.slice(0, 2200))}`;
        const res = await fetch(url);
        if (!res.ok) return para;
        const data = await res.json();
        return data[0]?.map(chunk => chunk[0]).join('') || para;
      } catch {
        return para;
      }
    })
  );

  return translatedChunks.filter(Boolean).join('\n\n');
}

// 실시간 영한 단어 사전 인출기
async function fetchEnglishWordLexicon(word) {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return null;

  if (BIBLICAL_ENG_KOR_LEXICON[clean]) {
    return {
      word: clean,
      ...BIBLICAL_ENG_KOR_LEXICON[clean],
      isTheological: true
    };
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&dt=bd&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (!res.ok) return { word: clean, kor: clean, pos: '단어', theology: null };
    const data = await res.json();

    const translatedText = data[0]?.[0]?.[0] || clean;
    let posStr = '단어';
    let definitions = [];

    if (data[1] && Array.isArray(data[1])) {
      posStr = data[1].map(p => p[0]).join(', ');
      data[1].forEach(posGroup => {
        if (posGroup[1] && Array.isArray(posGroup[1])) {
          definitions.push(`[${posGroup[0]}] ${posGroup[1].slice(0, 3).join(', ')}`);
        }
      });
    }

    return {
      word: clean,
      kor: translatedText,
      pos: posStr,
      details: definitions.join('\n'),
      theology: null,
      isTheological: false
    };
  } catch (e) {
    return { word: clean, kor: clean, pos: '단어', theology: null };
  }
}

// 아이콘 세트
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;

let cachedMasterStrongs = null;

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

const cleanTypography = (text, isOT, mode = 'vowels') => {
  if (!text || typeof text !== 'string') return '';
  if (!isOT) return text;
  if (mode === 'consonants') return text.replace(/[\u0591-\u05C7]/g, '');
  if (mode === 'vowels') return text.replace(/[\u0591-\u05AF]/g, '');
  return text;
};

// 🌟 [완전 복원] 어간 및 시제, 신학적 통찰 데이터 전수 복원
const getTheologicalGrammarInsight = (grammarRaw, isOT) => {
  if (!grammarRaw || typeof grammarRaw !== 'string') return null;
  const raw = grammarRaw.trim();

  if (isOT && raw.includes('.')) {
    const parts = raw.split('.');
    if (parts[0] === 'verb') {
      const stem = parts[1];
      const aspect = parts[2];

      const STEM_THEOLOGY = {
        'qal': { title: '칼 (Qal) 어간 — 단순 능동 (Simple Active)', desc: '동사의 가장 본래적인 단순 능동태로, 주어의 행동을 객관적 사실 그대로 확정 선포합니다.' },
        'nif': { title: '니팔 (Niphal) 어간 — 단순 수동 / 신적 수동태 (Divine Passive)', desc: '단순 수동 혹은 주어가 스스로 행동에 내맡기는 재귀형입니다. 하나님의 주권적 개입을 뜻합니다.' },
        'piel': { title: '피엘 (Piel) 어간 — 강조 능동 / 강화 (Intensive Active)', desc: '강렬하고 집중적인 반복과 철저한 완결을 뜻합니다. 심판이나 전적인 회복의 역사를 극대화합니다.' },
        'pual': { title: '푸알 (Pual) 어간 — 강조 수동 (Intensive Passive)', desc: '피엘의 수동태로, 강렬한 행동의 결과가 대상에게 온전히 임한 상태입니다.' },
        'hif': { title: '히필 (Hiphil) 어간 — 사역 능동 / 원인 유발 (Causative Active)', desc: '주어가 대상에게 그 상태나 행동을 필연적으로 일으키고 유도하는 사역형입니다.' },
        'hof': { title: '호팔 (Hophal) 어간 — 사역 수동 (Causative Passive)', desc: '사역의 원인 제공자(하나님)에 의해 불가항력적으로 이끌려감을 선포합니다.' },
        'hit': { title: '히트파엘 (Hitpael) 어간 — 재귀 반복 / 전인격적 반응 (Reflexive Intensive)', desc: '언약 백성이 하나님 앞에서 전인격적으로 회개하고 자복하는 영적 태도를 묘사합니다.' }
      };

      const ASPECT_THEOLOGY = {
        'perf': '완료형(Qatal): 이미 완결된 확정적 사건이자 언약적 성취를 선언합니다.',
        'impf': '미완료형(Yiqtol): 아직 끝나지 않고 계속해서 전개되거나 장차 반드시 이루어질 진행을 뜻합니다.',
        'wayq': '바이크톨(Wayyiqtol, 연속과거): 섭리 사슬 속에서 구속사적 사건들이 오차 없이 이어져 감을 묘사합니다.',
        'ptca': '능동분사: 지금 이 순간에도 섭리 가운데 지속되고 있는 하나님의 통치를 표현합니다.'
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
        'A': { title: '부정과거 (Aorist) — 단회적·결정적 사건 (Once-for-all Action)', desc: '그리스도의 십자가 대속과 같이 영단번에(Once for all) 완성된 사건을 선포합니다.' },
        'R': { title: '완료 (Perfect) — 영구히 유효한 완성 (State of Completion)', desc: '과거에 완료된 사건의 법적·영적 효력이 지금 현재까지 완전무결하게 유효함을 선언합니다.' },
        'P': { title: '현재 (Present) — 끊임없는 지속적 진행 (Linear Action)', desc: '매일의 삶 속에서 쉬지 않고 끊임없이 지속되는 성령의 연속적 역사하심을 나타냅니다.' },
        'I': { title: '미완료 (Imperfect) — 과거의 생생한 지속 과정 (Continuous Past)', desc: '과거의 한 시점에서 끊임없이 지속되었던 과정을 생생하게 묘사합니다.' },
        'F': { title: '미래 (Future) — 종말론적 확실한 약속 (Eschatological Certainty)', desc: '하나님의 신실하신 성품에 근거한 절대적 성취의 확신과 소망을 나타냅니다.' }
      };

      const VOICE_THEOLOGY = {
        'P': '신적 수동태 (Passivum Divinum): 인간의 행위가 아니라 하나님께서 주권적으로 역사하셨음을 고백합니다.',
        'M': '중간태 (Middle Voice): 주어가 자기 자신과 깊은 인격적 연관을 맺고 행함을 뜻합니다.',
        'A': '능동태 (Active Voice): 주체의 확고한 의지적 결단에 의해 행동이 실행됨을 뜻합니다.'
      };

      const tenseInfo = TENSE_THEOLOGY[tenseChar];
      if (tenseInfo) {
        return { stemTitle: tenseInfo.title, stemDesc: tenseInfo.desc, aspectDesc: VOICE_THEOLOGY[voiceChar] || '', category: 'GREEK_TENSE' };
      }
    }
  }

  return null;
};

// 🌟 [완전 복원] 대명사(R, D, C, X, I) 파싱 포함 형태론 디코더
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

    if (['R', 'D', 'C', 'X', 'I'].includes(pos)) {
      const pName = { R: '관계대명사', D: '지시대명사', C: '상호대명사', X: '부정대명사', I: '의문대명사' }[pos];
      const caseChar = details[0] || '';
      const caseMap = { N: '주격', G: '소유격', D: '여격', A: '대격' };
      const gChar = details[2] === 'M' ? '남성' : details[2] === 'F' ? '여성' : '중성';
      const nChar = details[1] === 'S' ? '단수' : '복수';
      return { label: `${pName}(${caseMap[caseChar] || ''}) · ${gChar} ${nChar}`.trim(), type: 'noun', caseType: caseChar, isVerb: false };
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

    if (['N', 'A', 'T'].includes(pos)) {
      const posMap = { N: '명사', A: '형용사', T: '관사' };
      const caseChar = details[0] || '';
      const caseMap = { N: '주격 (~이/가)', G: '소유격 (~의)', D: '여격 (~에게/에)', A: '대격 (~을/를)', V: '호격' };
      const gMap = { M: '남성', F: '여성', N: '중성' };
      const nMap = { S: '단수', P: '복수' };
      const cStr = caseMap[caseChar] || '';
      const gnStr = `${gMap[details[2]] || ''} ${nMap[details[1]] || ''}`;
      return { label: `${posMap[pos]} · ${cStr} · ${gnStr}`.trim(), type: pos === 'N' ? 'noun' : 'modifier', caseType: caseChar, isVerb: false };
    }
  }

  if (code.includes('.')) {
    const parts = code.split('.');
    const mainType = parts[0];

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

// 🌟 [완전 복원] 히브리어 방향격(he) 처리 포함 격변화 로직
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

  if (isOT) {
    if (caseType === 'CONSTRUCT' && !word.endsWith('의') && !word.includes('의')) return `${word}의`;
    if (rawGrammar && rawGrammar.includes('he') && word.includes('애굽')) return '애굽으로 (방향격)';
  }

  return word;
};

const parseUnabridgedAcademicLexicon = (rawDesc, masterEntry, isOT) => {
  const desc = rawDesc || masterEntry?.desc || '';
  let etymology = '', meaning = '', usage = '';

  const etymMatch = desc.match(/\[어원 및 파생\]\s*([^\[]+)/);
  if (etymMatch && etymMatch[1]) etymology = etymMatch[1].trim();

  const meaningMatch = desc.match(/\[원어 의미\]\s*([^\[]+)/);
  if (meaningMatch && meaningMatch[1]) meaning = meaningMatch[1].trim();

  const usageMatch = desc.match(/\[주요 번역\]\s*([^\[]+)/);
  if (usageMatch && usageMatch[1]) usage = usageMatch[1].trim();

  return {
    sourceName: isOT ? "BDB & Strong's Full" : "Thayer's & Strong's Full",
    rawFull: desc || '영문 사전 원전 데이터가 없습니다.',
    etymology: etymology || masterEntry?.etym || '원어 고유 어근(Primitive Root)',
    meaning: meaning || masterEntry?.eng || '원문 문맥적 기본 정의',
    usage: usage || masterEntry?.usage || '주요 성경 번역 용례 (Occurrences)'
  };
};

const speakAudio = (text, langCode = 'he-IL') => {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[\u0591-\u05AF]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

const renderParagraphBlocks = (rawContent, textColorClass = '') => {
  if (!rawContent) return null;
  const decoded = decodeHtmlEntities(rawContent);
  const paras = decoded.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);

  if (paras.length <= 1) {
    return <p className={`leading-[1.8] break-keep ${textColorClass}`}>{decoded}</p>;
  }

  return paras.map((para, idx) => (
    <p key={idx} className={`leading-[1.85] break-keep mb-2 last:mb-0 text-[12.5px] sm:text-[13px] ${textColorClass}`}>
      {para}
    </p>
  ));
};
// src/pages/Interlinear.js (PART 2 - 계속)

export default function Interlinear({
  t, isDarkMode, setActiveScreen, setIsSidebarOpen, isSidebarOpen, 
  bibles, getKoName, getArr
}) {
  const [selectedBookIndex, setSelectedBookIndex] = useState(() => {
    try {
      const jump = JSON.parse(localStorage.getItem('interlinear_jump') || '{}');
      if (jump?.book) {
        const idx = BIBLE_66_BOOKS.findIndex(b => b.ko === jump.book || b.en === jump.book);
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

  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('interlinear_bible_version') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [easyBibleDb, setEasyBibleDb] = useState({});
  const [webBibleDb, setWebBibleDb] = useState({});

  const handleVersionChange = (ver) => {
    setBibleVersion(ver);
    try {
      localStorage.setItem('interlinear_bible_version', ver);
    } catch (_) {}
  };

  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dictLoaded, setDictLoaded] = useState(false);

  const [activeWordOrder, setActiveWordOrder] = useState(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [modalTab, setModalTab] = useState('concordance');

  // 🌟 [신규] WEB 영단어 사전 상태
  const [selectedWebLexiconWord, setSelectedWebLexiconWord] = useState(null);
  const [isWebLexiconLoading, setIsWebLexiconLoading] = useState(false);

  const [selectedGrammarWikiKey, setSelectedGrammarWikiKey] = useState(null);
  const [typographyMode, setTypographyMode] = useState('vowels');

  const [concordanceTotalCount, setConcordanceTotalCount] = useState(0);
  const [concordanceDistribution, setConcordanceDistribution] = useState({});
  const [concordanceList, setConcordanceList] = useState([]);
  const [isConcordanceLoading, setIsConcordanceLoading] = useState(false);

  const [translatedMap, setTranslatedMap] = useState({});
  const [translatingKeys, setTranslatingKeys] = useState({});

  const handleToggleTranslation = async (key, rawText) => {
    if (translatedMap[key]) {
      setTranslatedMap(prev => ({ ...prev, [key]: null }));
      return;
    }
    setTranslatingKeys(prev => ({ ...prev, [key]: true }));
    const result = await fetchKoreanTranslation(rawText);
    setTranslatedMap(prev => ({ ...prev, [key]: result }));
    setTranslatingKeys(prev => ({ ...prev, [key]: false }));
  };

  const [customNotesMap, setCustomNotesMap] = useState({});
  const [customInputTrans, setCustomInputTrans] = useState('');
  const [customInputMemo, setCustomInputMemo] = useState('');

  // 10대 학술 아코디언 상태
  const [openPanels, setOpenPanels] = useState({
    tsk: false, hebrewSyntax: true, lxx: false, targumPeshitta: false, josephus: false,
    geo: false, commentary: true, matthewHenry: true, netNotes: false, easton: false
  });
  const togglePanel = (key) => setOpenPanels(prev => ({ ...prev, [key]: !prev[key] }));

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // 10대 학술 데이터베이스 상태
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

  const currentBookMeta = BIBLE_66_BOOKS[selectedBookIndex] || BIBLE_66_BOOKS[0];
  const isOT = currentBookMeta.isOT;

  const safeGetArr = getArr || ((a) => Array.isArray(a) ? a : []);
  const currentBookData = useMemo(() => {
    const list = safeGetArr(bibles);
    return list.find(b => b?.name === currentBookMeta.en || b?.name === currentBookMeta.ko) || {};
  }, [bibles, currentBookMeta, safeGetArr]);
  
  const chaptersCount = currentBookData?.chapters?.length || currentBookMeta.maxChap;
  const versesCount = currentBookData?.chapters?.[chapter - 1]?.length || 35;

  const koVerseText = useMemo(() => {
    if (!currentBookData?.chapters?.[chapter - 1]) return `${currentBookMeta.ko} ${chapter}장 ${verse}절`;
    const v = currentBookData.chapters[chapter - 1][verse - 1];
    const raw = v ? (typeof v === 'string' ? v : v.text || v.content || '') : `${currentBookMeta.ko} ${chapter}장 ${verse}절`;
    return decodeHtmlEntities(raw);
  }, [currentBookData, currentBookMeta, chapter, verse]);

  const easyVerseText = useMemo(() => {
    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    return easyBibleDb[key] || '';
  }, [currentBookMeta.ko, chapter, verse, easyBibleDb]);

  const webVerseText = useMemo(() => {
    const keyKo = `${currentBookMeta.ko}-${chapter}-${verse}`;
    const keyEn = `${currentBookMeta.en}-${chapter}-${verse}`;
    return webBibleDb[keyKo] || webBibleDb[keyEn] || '';
  }, [currentBookMeta, chapter, verse, webBibleDb]);

  const enVerseText = useMemo(() => {
    if (!words || words.length === 0) return '';
    return decodeHtmlEntities(words.map(w => w.eng).filter(e => e && e !== 'n/a' && e !== '-').join(' '));
  }, [words]);

  // WEB 단어 터치 시 영한 사전 오픈
  const handleWordClickInWeb = async (rawWord) => {
    const clean = rawWord.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!clean || clean.length < 2) return;

    setIsWebLexiconLoading(true);
    setSelectedWebLexiconWord({ word: clean, kor: '사전 데이터 조회 중...', pos: '조회 중...' });
    const data = await fetchEnglishWordLexicon(clean);
    setSelectedWebLexiconWord(data);
    setIsWebLexiconLoading(false);
  };

  const renderInteractiveWebText = (text) => {
    if (!text) return "WEB 본문 로딩 중...";
    const tokens = text.split(/(\s+|[.,;!?()[\]"]+)/);

    return tokens.map((token, idx) => {
      const isWord = /^[a-zA-Z'-]+$/.test(token.trim());
      if (!isWord) return <span key={idx}>{token}</span>;

      return (
        <span
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            handleWordClickInWeb(token);
          }}
          className="cursor-pointer hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300 rounded px-0.5 transition-colors underline decoration-dotted decoration-blue-400/50 underline-offset-4"
          title="터치하여 영한 사전 및 성경적 뜻풀이 보기"
        >
          {token}
        </span>
      );
    });
  };

  useEffect(() => {
    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/web_bible.json').then(r => r.ok ? r.json() : {}).then(d => setWebBibleDb(d || {})).catch(() => {});
    fetch('/data/lxx_quotes.json').then(r => r.ok ? r.json() : {}).then(d => setLxxDatabase(d || {})).catch(() => {});
    fetch('/data/josephus.json').then(r => r.ok ? r.json() : {}).then(d => setJosephusDb(d || {})).catch(() => {});
    fetch('/data/bible_geodata.json').then(r => r.ok ? r.json() : {}).then(d => setGeoDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/easton_dict.json').then(r => r.ok ? r.json() : {}).then(d => setEastonDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});
  }, []);
  
  useEffect(() => {
    const bookName = currentBookMeta.ko;
    const chapterNum = chapter;
    if (!bookName) return;

    fetch(`/data/commentaries_by_chapter/${bookName}_${chapterNum}.json`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setCommentaryDb(d || {}))
      .catch(() => setCommentaryDb({}));

    fetch(`/data/matthew_henry_by_chapter/${bookName}_${chapterNum}.json`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setMatthewHenryDb(d || {}))
      .catch(() => setMatthewHenryDb({}));
  }, [currentBookMeta.ko, chapter]);

  useEffect(() => {
    try {
      const jumpStr = localStorage.getItem('interlinear_jump');
      if (jumpStr) {
        const jump = JSON.parse(jumpStr);
        localStorage.removeItem('interlinear_jump');
        if (jump?.book) {
          const idx = BIBLE_66_BOOKS.findIndex(b => b.ko === jump.book || b.en === jump.book);
          if (idx !== -1) setSelectedBookIndex(idx);
        }
        if (jump?.chapter) setChapter(Number(jump.chapter));
        if (jump?.verse) setVerse(Number(jump.verse));
      }
    } catch (_) {}
  }, []);

  const handlePrevVerse = useCallback(() => {
    if (verse > 1) setVerse(v => v - 1);
    else if (chapter > 1) { setChapter(c => c - 1); setVerse(1); }
    else if (selectedBookIndex > 0) { setSelectedBookIndex(idx => idx - 1); setChapter(1); setVerse(1); }
  }, [verse, chapter, selectedBookIndex]);

  const handleNextVerse = useCallback(() => {
    if (verse < versesCount) setVerse(v => v + 1);
    else if (chapter < chaptersCount) { setChapter(c => c + 1); setVerse(1); }
    else if (selectedBookIndex < BIBLE_66_BOOKS.length - 1) { setSelectedBookIndex(idx => idx + 1); setChapter(1); setVerse(1); }
  }, [verse, versesCount, chapter, chaptersCount, selectedBookIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (selectedWordDetail || isLibraryOpen || selectedGrammarWikiKey || selectedWebLexiconWord) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevVerse(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextVerse(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevVerse, handleNextVerse, selectedWordDetail, isLibraryOpen, selectedGrammarWikiKey, selectedWebLexiconWord]);

  useEffect(() => {
    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    setCurrentLxxParallel(lxxDatabase[key] || null);
    setCurrentJosephus(josephusDb[key] || null);
    setCurrentGeoData(geoDb[key] || null);
    setCurrentCommentary(commentaryDb[key] || null);
    setCurrentMatthewHenry(matthewHenryDb[key] || null);
    setCurrentNetNote(netNotesDb[key] || null);
    setCurrentTargumPeshitta(targumPeshittaDb[key] || null);

    const foundEastonKey = Object.keys(eastonDb).find(k => (koVerseText || '').includes(k));
    setCurrentEaston(foundEastonKey ? { word: foundEastonKey, ...eastonDb[foundEastonKey] } : null);
  }, [currentBookMeta.ko, chapter, verse, lxxDatabase, josephusDb, geoDb, commentaryDb, matthewHenryDb, netNotesDb, eastonDb, targumPeshittaDb, koVerseText]);
  
  useEffect(() => {
    if (isOT && words && words.length > 0) {
      const dynamicSyntax = analyzeHebrewSyntaxFromWords(words);
      setCurrentHebrewSyntax(dynamicSyntax);
    } else {
      setCurrentHebrewSyntax(null);
    }
  }, [isOT, words]);

  useEffect(() => {
    let isMounted = true;
    setIsTskLoading(true);

    getCrossReferences(currentBookMeta.ko, chapter, verse)
      .then(refs => {
        if (isMounted) { setCrossRefs(refs || []); setIsTskLoading(false); }
      })
      .catch(() => {
        if (isMounted) { setCrossRefs([]); setIsTskLoading(false); }
      });

    return () => { isMounted = false; };
  }, [currentBookMeta.ko, chapter, verse]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_lexicon_notes');
      if (saved) setCustomNotesMap(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // 네비게이션 가림 안전 해제
  useEffect(() => {
    const navSelectors = ['#bottom-nav', '.floating-bottom-nav', 'nav'];
    const hiddenEls = [];
    navSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.closest('.interlinear-modal-portal')) {
          el.style.setProperty('display', 'none', 'important');
          hiddenEls.push(el);
        }
      });
    });

    return () => {
      hiddenEls.forEach(el => el.style.removeProperty('display'));
    };
  }, []);

  useEffect(() => {
    if (cachedMasterStrongs) {
      setDictLoaded(true);
      return;
    }
    fetch('/data/strongs_korean_master.json')
      .then(async (res) => {
        if (!res.ok) return fetch('/data/strongs_korean.json').then(r => r.json());
        return res.json();
      })
      .then(data => {
        cachedMasterStrongs = data || {};
        setDictLoaded(true);
      })
      .catch(() => {
        cachedMasterStrongs = {};
        setDictLoaded(true);
      });
  }, []);

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

        if (!isMounted) return;

        const enrichedWords = wordsData.map(w => {
          const sId = (w.strongs_id || '').trim();
          const masterEntry = cachedMasterStrongs?.[sId] || {};
          const dbDict = dictMap.get(sId) || {};
          const morphInfo = decodeExhaustiveMorphology(w.grammar);
          const theologyInsight = getTheologicalGrammarInsight(w.grammar, isOT);

          const inflectedWord = (w.original_word || '').trim();
          const lemmaWord = (masterEntry.original || dbDict.original_word || inflectedWord).trim();
          const isInflectedDifferent = lemmaWord && inflectedWord && lemmaWord !== inflectedWord;

          let lemmaMeaning = masterEntry.korean || dbDict.meaning || '';
          const rawEngGloss = (w.gloss || w.korean_trans || masterEntry.eng || '').toLowerCase().trim();
          
          if (!lemmaMeaning || /^[a-z\s,.[\]()'-]+$/i.test(lemmaMeaning)) {
            if (FALLBACK_ENGLISH_TRANSLATION_MAP[rawEngGloss]) {
              lemmaMeaning = FALLBACK_ENGLISH_TRANSLATION_MAP[rawEngGloss];
            } else if (w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
              lemmaMeaning = w.korean_trans;
            } else {
              lemmaMeaning = masterEntry.korean || '원어 어휘';
            }
          }

          // 🌟 방향격(rawGrammar)을 포함한 완전 복원
          const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morphInfo.caseType, isOT, w.grammar);
          let finalPron = masterEntry.pron || (w.pronunciation ? `[${w.pronunciation.replace(/[[\]]/g, '')}]` : '');
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
            original_word: inflectedWord,
            pron: finalPron,
            kor: decodeHtmlEntities(userCustomNote?.translation || contextualKorean),
            eng: decodeHtmlEntities(cleanEng),
            grammarRaw: w.grammar || '',
            grammarDecoded: morphInfo.label,
            grammarType: morphInfo.type,
            isVerb: morphInfo.isVerb,
            theologyInsight: theologyInsight,
            strongs: sId || (isOT ? 'H0000' : 'G0000'),
            note: decodeHtmlEntities(masterEntry.note || ''),
            lexicon: unabridgedLexicon,
            userCustomNote: userCustomNote
          };
        });

        const uniqueMap = new Map();
        enrichedWords.forEach(w => {
          if (!uniqueMap.has(w.word_order)) uniqueMap.set(w.word_order, w);
        });

        if (isMounted) {
          setWords(Array.from(uniqueMap.values()).sort((a, b) => a.word_order - b.word_order));
        }
      } catch (err) {
        if (isMounted) setWords([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInterlinearData();
    return () => { isMounted = false; };
  }, [currentBookMeta, chapter, verse, isOT, dictLoaded, customNotesMap]);

  const handleSelectWord = useCallback(async (word) => {
    setActiveWordOrder(word.word_order);
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
        const listPromise = supabase
          .from('interlinear_bible')
          .select('book, chapter, verse, original_word, korean_trans', { count: 'exact' })
          .eq('strongs_id', word.strongs)
          .order('id', { ascending: true })
          .limit(60);

        const distPromise = supabase
          .from('interlinear_bible')
          .select('book')
          .eq('strongs_id', word.strongs);

        const [listRes, distRes] = await Promise.all([listPromise, distPromise]);

        if (!listRes.error && listRes.data) {
          setConcordanceTotalCount(listRes.count || listRes.data.length);
          setConcordanceList(listRes.data);
        }

        if (!distRes.error && distRes.data) {
          const fullDist = {};
          distRes.data.forEach(item => {
            const sec = BOOK_SECTION_LOOKUP[item.book] || (word.strongs.startsWith('H') ? '구약' : '신약');
            fullDist[sec] = (fullDist[sec] || 0) + 1;
          });
          setConcordanceDistribution(fullDist);
        }
      } catch (e) {
        console.error("Concordance error:", e);
      } finally {
        setIsConcordanceLoading(false);
      }
    } else {
      setIsConcordanceLoading(false);
    }
  }, [customNotesMap]);

  const handleJumpToConcordanceVerse = useCallback((targetBook, targetChapter, targetVerse) => {
    const bookIdx = BIBLE_66_BOOKS.findIndex(b => b.ko === targetBook || b.en === targetBook);
    if (bookIdx !== -1) {
      setSelectedBookIndex(bookIdx);
      setChapter(Number(targetChapter));
      setVerse(Number(targetVerse));
      setSelectedWordDetail(null);
      setIsLibraryOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    alert(`[${selectedWordDetail.lemma} (${sId})] 연구자 번역 및 주석 메모가 영구 저장되었습니다.`);
  }, [selectedWordDetail, customNotesMap, customInputTrans, customInputMemo, currentBookMeta.ko, chapter, verse]);

  const handleCopyComprehensiveReport = useCallback(() => {
    let report = `# 📖 [원어 강해 종합 학술 리포트] ${currentBookMeta.ko} ${chapter}장 ${verse}절\n`;
    report += `> **연대 및 배경:** ${currentBookMeta.era} | ${currentBookMeta.empire}\n\n`;
    report += `### 📜 정경 본문 대조\n`;
    report += `- **개역개정:** ${koVerseText}\n`;
    if (easyVerseText) report += `- **쉬운성경:** ${easyVerseText}\n`;
    if (webVerseText) report += `- **WEB Bible:** ${webVerseText}\n`;
    if (enVerseText) report += `- **영어직역:** "${enVerseText}"\n\n`;
    
    report += `### 🔍 단어별 1:1 원어 분해:\n`;
    words.forEach(w => {
      report += `- **${w.inflected}** (${w.lemma}) [${w.strongs}]: ${w.korContextual} | *${w.grammarDecoded}*\n`;
    });
    report += `\n`;

    if (currentHebrewSyntax) {
      report += `### 📜 BHS 히브리어 구문론:\n`;
      currentHebrewSyntax.clauseHierarchy.forEach(c => {
        report += `- **${c.unit}** ➔ ${c.role} (${c.pauseType})\n`;
      });
      report += `- 강해: ${currentHebrewSyntax.cantillationExegesis}\n\n`;
    }

    navigator.clipboard.writeText(decodeHtmlEntities(report));
    alert("📋 학술 서식이 포함된 종합 리포트가 클립보드에 복사되었습니다!");
  }, [currentBookMeta, chapter, verse, koVerseText, easyVerseText, webVerseText, enVerseText, words, currentHebrewSyntax]);

  // 🌟 [완전 복원] QT 및 설교노트에 원어 주석 즉시 삽입 핸들러
  const handleInsertToQT = useCallback((word) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const allQt = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const todayData = allQt[today] || {};
      const lemmaNotice = word.isInflectedDifferent ? `(원형: ${word.lemma})` : '';
      const customTransNotice = word.userCustomNote?.translation ? ` [나의 번역: ${word.userCustomNote.translation}]` : '';
      const customMemoNotice = word.userCustomNote?.memo ? `\n   ↳ 💡 연구 메모: ${word.userCustomNote.memo}` : '';
      const theologyNotice = word.theologyInsight ? ` [문법 강해: ${word.theologyInsight.stemTitle}]` : '';

      const insightText = `\n[원어묵상] ${word.inflected} ${lemmaNotice} - ${word.korContextual} [${word.strongs}] (${word.grammarDecoded})${theologyNotice}${customTransNotice}${customMemoNotice}\n`;
      
      allQt[today] = { ...todayData, qtMeditation: (todayData.qtMeditation || '') + insightText };
      localStorage.setItem('qt_daily', JSON.stringify(allQt));
      alert(`[${word.inflected}] 원어 묵상 및 연구자 주석이 오늘 QT 일지에 기록되었습니다.`);
    } catch (_) {}
  }, []);

  const handleInsertToSermon = useCallback((word) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const allDaily = JSON.parse(localStorage.getItem('days_data') || '{}');
      const todayData = allDaily[today] || {};
      const lemmaNotice = word.isInflectedDifferent ? `(원형: ${word.lemma} - ${word.korLemma})` : '';
      const customMemoBlock = word.userCustomNote?.memo 
        ? `<br/>  ↳ <b>✍ 연구자 강해 메모</b>: <i>${word.userCustomNote.memo}</i>` 
        : '';
      const theologyNotice = word.theologyInsight 
        ? `<br/>  ↳ <b>${word.theologyInsight.stemTitle}</b>: <i>${word.theologyInsight.stemDesc}</i>` 
        : '';

      const insightHtml = `<p><b>[원어강해] ${word.inflected} ${lemmaNotice} [${word.strongs}]</b>: ${word.korContextual} — <i>${word.grammarDecoded}</i>${theologyNotice}${customMemoBlock}</p>`;
      
      allDaily[today] = { ...todayData, sermonNotes: (todayData.sermonNotes || '') + insightHtml };
      localStorage.setItem('days_data', JSON.stringify(allDaily));
      alert(`[${word.inflected}] 원어 강해 주석이 설교노트에 반영되었습니다.`);
    } catch (_) {}
  }, []);

  // 🌟 은은한 학술 파스텔 틴트 팔레트
  const isDark = isDarkMode;
  const theme = {
    bg: isDark ? 'bg-[#0B0F17]' : 'bg-[#F9F9F6]',
    panel: isDark ? 'bg-[#121824] border-slate-800' : 'bg-white border-stone-200/90 shadow-2xs',
    textMain: isDark ? 'text-slate-100' : 'text-stone-900',
    textSub: isDark ? 'text-slate-400' : 'text-stone-600',
    border: isDark ? 'border-slate-800' : 'border-stone-200',

    tsk: isDark ? 'bg-sky-950/20 border-sky-900/60 text-sky-200' : 'bg-sky-50/70 border-sky-200/80 text-sky-950',
    bhs: isDark ? 'bg-amber-950/20 border-amber-900/60 text-amber-200' : 'bg-amber-50/70 border-amber-200/80 text-amber-950',
    lxx: isDark ? 'bg-stone-900/40 border-stone-700 text-stone-200' : 'bg-stone-100/80 border-stone-300/80 text-stone-950',
    aramaic: isDark ? 'bg-orange-950/20 border-orange-900/60 text-orange-200' : 'bg-orange-50/70 border-orange-200/80 text-orange-950',
    josephus: isDark ? 'bg-yellow-950/20 border-yellow-900/50 text-yellow-200' : 'bg-yellow-50/60 border-yellow-200/80 text-yellow-950',
    geo: isDark ? 'bg-teal-950/20 border-teal-900/60 text-teal-200' : 'bg-teal-50/70 border-teal-200/80 text-teal-950',
    comm: isDark ? 'bg-indigo-950/20 border-indigo-900/60 text-indigo-200' : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950',
    mh: isDark ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200' : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
    net: isDark ? 'bg-rose-950/20 border-rose-900/60 text-rose-200' : 'bg-rose-50/70 border-rose-200/80 text-rose-950',
    easton: isDark ? 'bg-purple-950/20 border-purple-900/60 text-purple-200' : 'bg-purple-50/70 border-purple-200/80 text-purple-950'
  };

  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto ${theme.bg} relative font-sans overflow-hidden select-none`}>
      
      {/* 1. 상단 슬림 네비게이션 헤더 */}
      <header className={`px-2.5 sm:px-4 py-2 border-b z-[60] sticky top-0 shrink-0 flex items-center justify-between ${
        isDark ? 'bg-[#101622] border-slate-800' : 'bg-white border-stone-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`${theme.textMain} p-1 md:hidden opacity-80 cursor-pointer`}><IconMenu/></button>
          <button onClick={() => setActiveScreen('home')} className={`${theme.textMain} p-1 opacity-80 cursor-pointer`}><IconBack/></button>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <h1 className={`text-[15px] sm:text-[16px] font-bold tracking-tight truncate ${theme.textMain}`}>
              원어 성경 연구
            </h1>
            <span className={`text-[11px] font-mono font-medium hidden sm:inline ${theme.textSub}`}>
              (Logos Exegetical Suite)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-100 border-stone-200 text-stone-800'
            }`}
          >
            📚 서재
          </button>
          
          <button
            type="button"
            onClick={handleCopyComprehensiveReport}
            className={`hidden sm:flex px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer items-center gap-1 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-100 border-stone-200 text-stone-800'
            }`}
          >
            📋 리포트 복사
          </button>

          {isOT && (
            <div className={`hidden sm:flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
              isDark ? 'bg-black/30 border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              <button type="button" onClick={() => setTypographyMode('vowels')} className={`px-2 py-0.5 rounded ${typographyMode === 'vowels' ? 'bg-stone-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : theme.textSub}`}>모음</button>
              <button type="button" onClick={() => setTypographyMode('full')} className={`px-2 py-0.5 rounded ${typographyMode === 'full' ? 'bg-stone-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : theme.textSub}`}>악센트</button>
              <button type="button" onClick={() => setTypographyMode('consonants')} className={`px-2 py-0.5 rounded ${typographyMode === 'consonants' ? 'bg-stone-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : theme.textSub}`}>자음</button>
            </div>
          )}

          <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-md border font-bold ${
            isOT 
              ? (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/60' : 'bg-amber-50 text-amber-800 border-amber-200')
              : (isDark ? 'bg-blue-950/40 text-blue-300 border-blue-900/60' : 'bg-blue-50 text-blue-800 border-blue-200')
          }`}>
            {isOT ? '구약 (RTL)' : '신약 (LTR)'}
          </span>
        </div>
      </header>

      {/* 2. 메인 뷰포트 (타이트한 여백 px-2 sm:px-3) */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 pt-2 pb-24 w-full hide-scrollbar space-y-2.5 max-w-5xl mx-auto">
        
        {/* 권/장/절 선택 & 전후절 이동 바 */}
        <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${theme.panel}`}>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 max-w-md">
              <select 
                value={selectedBookIndex} 
                onChange={(e) => { setSelectedBookIndex(Number(e.target.value)); setChapter(1); setVerse(1); }} 
                className={`flex-1 bg-transparent text-[14px] font-bold ${theme.textMain} outline-none cursor-pointer`}
              >
                <optgroup label="구약 성경 (39권)">
                  {BIBLE_66_BOOKS.slice(0, 39).map((b, idx) => (
                    <option key={b.ko} value={idx} className="text-black">{b.ko} ({b.en})</option>
                  ))}
                </optgroup>
                <optgroup label="신약 성경 (27권)">
                  {BIBLE_66_BOOKS.slice(39).map((b, idx) => (
                    <option key={b.ko} value={idx + 39} className="text-black">{b.ko} ({b.en})</option>
                  ))}
                </optgroup>
              </select>
              <select 
                value={chapter} 
                onChange={(e) => { setChapter(Number(e.target.value)); setVerse(1); }} 
                className={`w-18 bg-transparent text-[14px] font-bold ${theme.textMain} outline-none cursor-pointer`}
              >
                {Array.from({ length: chaptersCount }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}장</option>)}
              </select>
              <select 
                value={verse} 
                onChange={(e) => setVerse(Number(e.target.value))} 
                className={`w-18 bg-transparent text-[14px] font-bold ${theme.textMain} outline-none cursor-pointer`}
              >
                {Array.from({ length: versesCount }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}절</option>)}
              </select>
            </div>

            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrevVerse}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-100 border-stone-200 text-stone-800'}`}
              >
                ◀ 이전 절
              </button>
              <button
                type="button"
                onClick={handleNextVerse}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-100 border-stone-200 text-stone-800'}`}
              >
                다음 절 ▶
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-dashed border-stone-200 dark:border-slate-800">
            <span className="font-serif text-stone-600 dark:text-slate-400">
              ⏳ <b>시대:</b> {currentBookMeta.era}
            </span>
            <span className="font-mono text-stone-500 dark:text-slate-400 hidden sm:inline">
              🏛 {currentBookMeta.empire}
            </span>
          </div>
        </div>

        {/* 🌟 다중 역본 & 원문 통합 뷰어 */}
        <div className={`p-3 sm:p-4 rounded-2xl border space-y-3 ${theme.panel}`}>
          
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-slate-800">
            <h2 className={`text-[15px] sm:text-[16px] font-bold ${theme.textMain}`}>
              {currentBookMeta.ko} {chapter}장 {verse}절
            </h2>

            <div className={`flex p-0.5 rounded-lg border text-[10.5px] font-bold ${
              isDark ? 'bg-black/40 border-slate-800' : 'bg-stone-100 border-stone-200'
            }`}>
              {['krv', 'easy', 'web', 'parallel'].map((vKey) => (
                <button
                  key={vKey}
                  type="button"
                  onClick={() => handleVersionChange(vKey)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    bibleVersion === vKey
                      ? (isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-stone-900 shadow-2xs font-bold')
                      : theme.textSub
                  }`}
                >
                  {vKey === 'krv' ? '개역개정' : vKey === 'easy' ? '쉬운성경' : vKey === 'web' ? 'WEB' : '동시대조'}
                </button>
              ))}
            </div>
          </div>

          {/* 본문 텍스트 영역 */}
          <div className="text-left space-y-2">
            {bibleVersion === 'krv' && (
              <p className={`text-[15px] sm:text-[16px] font-serif font-medium leading-[1.8] break-keep ${theme.textMain}`}>
                {koVerseText}
              </p>
            )}

            {bibleVersion === 'easy' && (
              <p className={`text-[15px] sm:text-[16px] font-sans font-medium leading-[1.8] break-keep ${theme.textMain}`}>
                {easyVerseText || koVerseText}
              </p>
            )}

            {/* 🌟 WEB 영어 성경 (영단어 터치 시 한글 사전 뜻풀이 엔진 연동) */}
            {bibleVersion === 'web' && (
              <div className="space-y-1">
                <p className={`text-[14.5px] sm:text-[15.5px] font-serif leading-[1.75] ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                  {renderInteractiveWebText(webVerseText || enVerseText)}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block pt-1">
                  💡 영단어를 터치하면 품사·성경적 뜻풀이·원어민 낭독이 열립니다.
                </span>
              </div>
            )}

            {bibleVersion === 'parallel' && (
              <div className="space-y-1.5 pt-0.5">
                <div className={`p-2.5 rounded-lg border text-left ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                  <span className="text-[9.5px] font-bold text-stone-400 block mb-0.5">[개역개정]</span>
                  <p className={`text-[14px] sm:text-[15px] font-serif font-medium leading-[1.8] break-keep ${theme.textMain}`}>
                    {koVerseText}
                  </p>
                </div>
                {easyVerseText && (
                  <div className={`p-2.5 rounded-lg border text-left ${isDark ? 'bg-emerald-950/15 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-200'}`}>
                    <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">[쉬운성경]</span>
                    <p className={`text-[13.5px] sm:text-[14px] leading-[1.7] break-keep ${theme.textMain}`}>
                      {easyVerseText}
                    </p>
                  </div>
                )}
                <div className={`p-2.5 rounded-lg border text-left ${isDark ? 'bg-blue-950/15 border-blue-900/40' : 'bg-blue-50/50 border-blue-200'}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9.5px] font-bold text-blue-700 dark:text-blue-400">[World English Bible - WEB]</span>
                    <span className="text-[9px] text-blue-500 font-bold">터치하여 단어 뜻풀이</span>
                  </div>
                  <p className={`text-[13.5px] sm:text-[14px] font-serif leading-[1.7] ${theme.textMain}`}>
                    {renderInteractiveWebText(webVerseText || enVerseText)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 원어 원문 뷰어 */}
          <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${theme.textSub}`}>
                {isOT ? 'MASORETIC TEXT (BHS) · 히브리어 원문' : 'NESTLE-ALAND 28 (GNT) · 헬라어 원문'}
              </span>
              <span className="text-[10px] font-mono text-stone-400 font-semibold">
                {isOT ? '오른쪽 ➔ 왼쪽 (RTL)' : '왼쪽 ➔ 오른쪽 (LTR)'}
              </span>
            </div>

            {isLoading ? (
              <div className="py-4 text-center text-xs text-stone-400 font-mono">원어 형태소 파싱 중...</div>
            ) : (
              <div 
                className={`w-full flex flex-wrap gap-x-2.5 gap-y-2 items-baseline ${
                  isOT ? 'justify-start text-right' : 'justify-start text-left'
                }`} 
                dir={isOT ? 'rtl' : 'ltr'}
              >
                {words.map((w) => {
                  const isHighlighted = activeWordOrder === w.word_order;
                  const renderedText = cleanTypography(w.inflected, isOT, typographyMode);

                  return (
                    <span
                      key={w.id}
                      onClick={() => handleSelectWord(w)}
                      style={originalFontStyle}
                      className={`text-[23px] sm:text-[26px] font-bold px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                        isHighlighted
                          ? 'bg-amber-500/25 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500 shadow-xs'
                          : `${theme.textMain} hover:bg-stone-200/50 dark:hover:bg-slate-800`
                      }`}
                    >
                      {renderedText}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 단어별 1:1 분해 카드 그리드 */}
        {!isLoading && words.length > 0 && (
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center px-1">
              <span className={`text-[12px] font-bold uppercase tracking-tight ${theme.textMain}`}>
                단어별 1:1 분해 ({words.length}개 어절)
              </span>
              <span className="text-[10px] font-mono text-stone-400">10-CORE EXEGESIS SUITE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2" dir={isOT ? 'rtl' : 'ltr'}>
              {words.map((word) => {
                const isSelected = activeWordOrder === word.word_order;
                const displayInflected = cleanTypography(word.inflected, isOT, typographyMode);
                const displayLemma = cleanTypography(word.lemma, isOT, typographyMode);

                return (
                  <div 
                    key={word.id} 
                    onClick={() => handleSelectWord(word)}
                    className={`rounded-xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/80 bg-amber-50/50 dark:bg-amber-950/20'
                        : `${theme.panel} hover:border-stone-400 dark:hover:border-slate-600`
                    }`}
                  >
                    <div className={`mb-1 ${isOT ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center ${isOT ? 'justify-between flex-row-reverse' : 'justify-between'} gap-1`}>
                        <span 
                          style={originalFontStyle}
                          className={`text-[20px] sm:text-[22px] font-bold ${theme.textMain} block leading-snug`} 
                          dir={isOT ? 'rtl' : 'ltr'}
                        >
                          {displayInflected}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); speakAudio(word.inflected, isOT ? 'he-IL' : 'el-GR'); }}
                          className="p-0.5 text-stone-400 hover:text-stone-800 dark:hover:text-white cursor-pointer"
                          title="원어 발음 듣기"
                        >
                          <IconVolume />
                        </button>
                      </div>
                      
                      <span className={`text-[10px] font-mono font-medium block mt-0.5 ${theme.textSub}`} dir="ltr">
                        {word.pron}
                      </span>

                      {word.isInflectedDifferent && (
                        <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400 block truncate mt-0.5" dir="ltr">
                          원형: <b style={originalFontStyle} className="text-stone-800 dark:text-stone-200">{displayLemma}</b>
                        </span>
                      )}
                    </div>
                    
                    <div className="w-full h-px bg-stone-200 dark:bg-slate-800 my-1"></div>
                    
                    <div className="flex-1 flex flex-col mb-1 text-left" dir="ltr">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[12.5px] font-bold ${theme.textMain} truncate block`}>
                          {word.korContextual}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 shrink-0">
                          {word.strongs}
                        </span>
                      </div>
                      <span className={`text-[10px] ${theme.textSub} truncate font-medium mt-0.5`}>
                        {word.isInflectedDifferent ? `(${word.korLemma})` : word.eng}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1" dir="ltr">
                      {tokenizeGrammarCode(word.grammarRaw, isOT).slice(0, 2).map((tok, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGrammarWikiKey(tok.key);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold cursor-pointer ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                          }`}
                        >
                          {tok.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 10대 학술 연구 코퍼스 아코디언 디렉토리 (10개 패널 전수 복원) */}
        <div className={`p-3 sm:p-4 rounded-xl border space-y-2.5 ${theme.panel}`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-slate-800">
            <span className={`text-[12px] font-bold uppercase tracking-tight ${theme.textMain}`}>
              10대 학술 연구 코퍼스 (Exegetical Corpus)
            </span>
            <span className="text-[10px] font-mono text-stone-400">클릭하여 펼치기/접기</span>
          </div>

          <div className="space-y-2 text-left">
            
            {/* 1. TSK 상호교차참조 */}
            <div className={`rounded-xl border ${theme.tsk} overflow-hidden`}>
              <button 
                type="button"
                onClick={() => togglePanel('tsk')}
                className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
              >
                <span>🔗 1. 정경 상호교차참조 (TSK Cross-References)</span>
                <span className="text-[10.5px] font-mono font-semibold">
                  {crossRefs.length}개 구절 {openPanels.tsk ? '▲' : '▼'}
                </span>
              </button>
              {openPanels.tsk && (
                <div className="p-2.5 pt-0 border-t border-sky-200/50 dark:border-sky-800/40">
                  {isTskLoading ? (
                    <div className="text-[11px] text-stone-400 py-1">교차참조 탐색 중...</div>
                  ) : crossRefs.length === 0 ? (
                    <div className="text-[11px] text-stone-400 py-1">직결된 교차참조 구절이 없습니다.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {crossRefs.map((ref, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const bIdx = BIBLE_66_BOOKS.findIndex(b => b.ko === ref.targetBook);
                            if (bIdx !== -1) {
                              setSelectedBookIndex(bIdx);
                              setChapter(ref.targetChapter);
                              setVerse(ref.targetVerse);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={`px-2 py-0.8 rounded-md text-[10.5px] font-medium border cursor-pointer ${
                            isDark ? 'bg-sky-950/40 border-sky-800 text-sky-200' : 'bg-white border-sky-200 text-sky-900 shadow-2xs'
                          }`}
                        >
                          📖 {ref.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. BHS 히브리어 구문론 */}
            {currentHebrewSyntax && (
              <div className={`rounded-xl border ${theme.bhs} overflow-hidden`}>
                <button 
                  type="button"
                  onClick={() => togglePanel('hebrewSyntax')}
                  className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
                >
                  <span>📜 2. BHS 히브리어 문장 구조 구문론 끊어읽기</span>
                  <span className="text-[10px] font-mono font-semibold">Atnach 대휴지 {openPanels.hebrewSyntax ? '▲' : '▼'}</span>
                </button>
                {openPanels.hebrewSyntax && (
                  <div className="p-2.5 pt-0 border-t border-amber-200/60 dark:border-amber-800/40 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1.5">
                      {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border text-right ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-amber-200/90 shadow-2xs'}`} dir="rtl">
                          <div className="flex justify-between items-center mb-0.5">
                            <span style={originalFontStyle} className="font-bold text-[16px] text-stone-900 dark:text-stone-100">{c.unit}</span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-amber-300 font-semibold" dir="ltr">{c.pauseType}</span>
                          </div>
                          <p className="text-[11px] font-medium text-left text-stone-600 dark:text-slate-400" dir="ltr">{c.role}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11.5px] leading-relaxed font-serif text-stone-800 dark:text-slate-300 pt-0.5">
                      💡 {decodeHtmlEntities(currentHebrewSyntax.cantillationExegesis)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. 70인역(LXX) 대조 */}
            {currentLxxParallel && (
              <div className={`rounded-xl border ${theme.lxx} overflow-hidden`}>
                <button 
                  type="button"
                  onClick={() => togglePanel('lxx')}
                  className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
                >
                  <span>🏛️ 3. 70인역(LXX) 신·구약 인용 대조 ({currentLxxParallel.otRef})</span>
                  <span className="text-[10px] font-mono font-semibold">{currentLxxParallel.theme} {openPanels.lxx ? '▲' : '▼'}</span>
                </button>
                {openPanels.lxx && (
                  <div className="p-2.5 pt-0 border-t border-stone-200 dark:border-slate-800 space-y-1.5 pt-1.5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 text-xs">
                      <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-stone-200'}`}>
                        <span className="text-[9px] font-bold block text-stone-400 mb-0.5">[신약 GNT]</span>
                        <p style={{ fontFamily: "'SBL Greek', serif" }} className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100">{currentLxxParallel.ntText || "인용"}</p>
                      </div>
                      <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-stone-200'}`}>
                        <span className="text-[9px] font-bold block text-stone-400 mb-0.5">[구약 LXX]</span>
                        <p style={{ fontFamily: "'SBL Greek', serif" }} className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100">{currentLxxParallel.lxxText}</p>
                      </div>
                      <div className={`p-2 rounded-lg border text-right ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-stone-200'}`} dir="rtl">
                        <span className="text-[9px] font-bold block text-left text-stone-400 mb-0.5" dir="ltr">[구약 MT]</span>
                        <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[16px] font-bold text-stone-900 dark:text-stone-100">{currentLxxParallel.mtText || "인용"}</p>
                      </div>
                    </div>
                    <p className="text-[11.5px] font-serif leading-relaxed text-stone-800 dark:text-slate-300">
                      {decodeHtmlEntities(currentLxxParallel.differenceAnalysis)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. 고대 아람어 타르굼 & 시리아 페시타 */}
            {currentTargumPeshitta && (
              <div className={`rounded-xl border ${theme.aramaic} overflow-hidden`}>
                <button 
                  type="button"
                  onClick={() => togglePanel('targumPeshitta')}
                  className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
                >
                  <span>🏺 4. 고대 아람어 타르굼(Targum) & 시리아 페시타(Peshitta) 대조군</span>
                  <span className="text-[10px] font-mono font-semibold">Semitic Text {openPanels.targumPeshitta ? '▲' : '▼'}</span>
                </button>
                {openPanels.targumPeshitta && (
                  <div className="p-2.5 pt-0 border-t border-orange-200/60 dark:border-orange-800/40 space-y-1.5 pt-1.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                      {currentTargumPeshitta.targumAramaic && (
                        <div className={`p-2.5 rounded-lg border text-right ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-orange-200/80'}`} dir="rtl">
                          <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 block mb-0.5" dir="ltr">아람어 타르굼 역본</span>
                          <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[16px] font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
                            {currentTargumPeshitta.targumAramaic}
                          </p>
                          {currentTargumPeshitta.targumKo && (
                            <p className="text-[11px] text-stone-700 dark:text-slate-300 text-left mt-1 pt-1 border-t border-stone-100 dark:border-slate-800" dir="ltr">
                              {decodeHtmlEntities(currentTargumPeshitta.targumKo)}
                            </p>
                          )}
                        </div>
                      )}
                      {currentTargumPeshitta.peshittaSyriac && (
                        <div className={`p-2.5 rounded-lg border text-right ${isDark ? 'bg-[#121824] border-slate-700' : 'bg-white border-orange-200/80'}`} dir="rtl">
                          <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 block mb-0.5" dir="ltr">시리아 페시타 역본</span>
                          <p style={{ fontFamily: "'Estrangelo Edessa', serif" }} className="text-[18px] font-bold text-stone-900 dark:text-stone-100 leading-loose">
                            {currentTargumPeshitta.peshittaSyriac}
                          </p>
                          {currentTargumPeshitta.peshittaKo && (
                            <p className="text-[11px] text-stone-700 dark:text-slate-300 text-left mt-1 pt-1 border-t border-stone-100 dark:border-slate-800" dir="ltr">
                              {decodeHtmlEntities(currentTargumPeshitta.peshittaKo)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 5. 요세푸스 사료 패널 (완전 복원) */}
            {currentJosephus && (
              <div className={`rounded-xl border ${theme.josephus} overflow-hidden`}>
                <button 
                  type="button"
                  onClick={() => togglePanel('josephus')}
                  className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
                >
                  <span>📜 5. 요세푸스(Josephus) 1세기 고대 유대 역사 사료</span>
                  <span className="text-[10px] font-mono font-semibold">{currentJosephus.work} {openPanels.josephus ? '▲' : '▼'}</span>
                </button>
                {openPanels.josephus && (
                  <div className="p-2.5 pt-0 border-t border-yellow-200/60 dark:border-yellow-800/40 space-y-1 pt-1.5">
                    <span className="text-[12px] font-bold block text-yellow-950 dark:text-yellow-200">
                      ⚔️ {decodeHtmlEntities(currentJosephus.historicalEvent)}
                    </span>
                    <p className="text-[12px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">
                      {decodeHtmlEntities(currentJosephus.summary)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 6. 성경 역사 지리학 및 OpenBible GPS 패널 (완전 복원) */}
            {currentGeoData && (
              <div className={`rounded-xl border ${theme.geo} overflow-hidden`}>
                <div className="p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px]">
                  <span onClick={() => togglePanel('geo')} className="cursor-pointer flex-1">
                    🗺️ 6. 성경 역사 지리학 및 고고학 유적 좌표 (OpenBible)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${currentGeoData.lat},${currentGeoData.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] px-2 py-0.5 rounded font-bold border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 hover:underline"
                    >
                      📍 지도 위성 보기 ↗
                    </a>
                    <span onClick={() => togglePanel('geo')} className="cursor-pointer opacity-60">{openPanels.geo ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openPanels.geo && (
                  <div className="p-2.5 pt-0 border-t border-teal-200/60 dark:border-teal-800/40 space-y-1 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12.5px] text-teal-950 dark:text-teal-200">{currentGeoData.placeKo} ({currentGeoData.placeEn})</span>
                      <span className="text-[10.5px] text-stone-500">| {currentGeoData.region}</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">
                      {decodeHtmlEntities(currentGeoData.historicalSignificance)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. 반즈 & JFB 학술 주석 */}
            {currentCommentary && (
              <div className={`rounded-xl border ${theme.comm} overflow-hidden`}>
                <div className="p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px]">
                  <span onClick={() => togglePanel('commentary')} className="cursor-pointer flex-1">
                    📖 7. 역사문법적 학술 강해 주석 ({currentCommentary.commentator})
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`comm_${chapter}_${verse}`, currentCommentary.exegesis)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        translatedMap[`comm_${chapter}_${verse}`]
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {translatingKeys[`comm_${chapter}_${verse}`] ? '단락별 번역 중...' : translatedMap[`comm_${chapter}_${verse}`] ? '원문' : '🌐 한국어 번역'}
                    </button>
                    <span onClick={() => togglePanel('commentary')} className="cursor-pointer opacity-60">{openPanels.commentary ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openPanels.commentary && (
                  <div className="p-3 pt-0 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-2 pt-2">
                    <div className="space-y-1 text-left">
                      {renderParagraphBlocks(
                        translatedMap[`comm_${chapter}_${verse}`] || currentCommentary.exegesis,
                        theme.textMain
                      )}
                    </div>
                    {currentCommentary.theologicalNote && (
                      <div className="pt-2 border-t border-dashed border-indigo-200 dark:border-indigo-800/40 text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-800 dark:text-indigo-300 mb-0.5">
                          [교리 및 구속사적 의미]
                        </span>
                        {renderParagraphBlocks(currentCommentary.theologicalNote, "text-stone-700 dark:text-slate-300 text-[12px]")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 8. 매튜 헨리 묵상 강해 */}
            {currentMatthewHenry && (
              <div className={`rounded-xl border ${theme.mh} overflow-hidden`}>
                <div className="p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px]">
                  <span onClick={() => togglePanel('matthewHenry')} className="cursor-pointer flex-1">
                    🌿 8. 매튜 헨리(Matthew Henry) 구속사적 묵상 강해
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`mh_${chapter}_${verse}`, currentMatthewHenry.devotionalExegesis)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        translatedMap[`mh_${chapter}_${verse}`]
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {translatingKeys[`mh_${chapter}_${verse}`] ? '단락별 번역 중...' : translatedMap[`mh_${chapter}_${verse}`] ? '원문' : '🌐 한국어 번역'}
                    </button>
                    <span onClick={() => togglePanel('matthewHenry')} className="cursor-pointer opacity-60">{openPanels.matthewHenry ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openPanels.matthewHenry && (
                  <div className="p-3 pt-0 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2 pt-2">
                    <div className="space-y-1 text-left">
                      {renderParagraphBlocks(
                        translatedMap[`mh_${chapter}_${verse}`] || currentMatthewHenry.devotionalExegesis,
                        theme.textMain
                      )}
                    </div>
                    {currentMatthewHenry.practicalApplication && (
                      <div className="pt-2 border-t border-dashed border-emerald-200 dark:border-emerald-800/40 text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800 dark:text-emerald-300 mb-0.5">
                          [삶의 실천과 순종 권면]
                        </span>
                        {renderParagraphBlocks(currentMatthewHenry.practicalApplication, "text-stone-700 dark:text-slate-300 text-[12px]")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 9. NET Bible 본문 비평 각주 */}
            {currentNetNote && (
              <div className={`rounded-xl border ${theme.net} overflow-hidden`}>
                <div className="p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px]">
                  <span onClick={() => togglePanel('netNotes')} className="cursor-pointer flex-1">
                    🔍 9. NET Bible 사본/원문 비평 각주
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTranslation(`net_${chapter}_${verse}`, currentNetNote.note)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        translatedMap[`net_${chapter}_${verse}`]
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white dark:bg-slate-800 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {translatingKeys[`net_${chapter}_${verse}`] ? '번역 중...' : translatedMap[`net_${chapter}_${verse}`] ? '원문' : '🌐 한국어 번역'}
                    </button>
                    <span onClick={() => togglePanel('netNotes')} className="cursor-pointer opacity-60">{openPanels.netNotes ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openPanels.netNotes && (
                  <div className="p-3 pt-0 border-t border-rose-200/60 dark:border-rose-800/40 space-y-1 pt-2">
                    <span className="font-bold text-[12px] block text-stone-900 dark:text-slate-100">📌 {decodeHtmlEntities(currentNetNote.title)}</span>
                    <div className="text-left">
                      {renderParagraphBlocks(
                        translatedMap[`net_${chapter}_${verse}`] || currentNetNote.note,
                        theme.textMain
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 10. 이스톤 성경 백과사전 패널 (완전 복원) */}
            {currentEaston && (
              <div className={`rounded-xl border ${theme.easton} overflow-hidden`}>
                <button 
                  type="button"
                  onClick={() => togglePanel('easton')}
                  className="w-full p-2.5 flex items-center justify-between font-serif font-bold text-[12.5px] cursor-pointer"
                >
                  <span>📚 10. 이스톤(Easton's) 성경 백과사전 [{currentEaston.word}]</span>
                  <span className="text-[10px] font-mono font-semibold">Biblical Encyclopedia {openPanels.easton ? '▲' : '▼'}</span>
                </button>
                {openPanels.easton && (
                  <div className="p-2.5 pt-0 border-t border-purple-200/60 dark:border-purple-800/40 space-y-1 pt-1.5">
                    <p className="text-[12px] leading-relaxed font-serif text-stone-800 dark:text-slate-200">
                      {decodeHtmlEntities(currentEaston.definition)}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </main>

      {/* 🌟 WEB 영단어 사전 & 성경적 뜻풀이 시트 */}
      {selectedWebLexiconWord && (
        <div className="interlinear-modal-portal fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-4 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-2.5 border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  📖 WEB English-Korean Lexicon
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
                  {selectedWebLexiconWord.pos}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => speakAudio(selectedWebLexiconWord.word, 'en-US')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold border border-stone-300 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                  title="미국식 원어민 발음"
                >
                  <IconVolume /> 발음
                </button>
                <button
                  onClick={() => setSelectedWebLexiconWord(null)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 my-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-left">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold font-serif text-blue-950 dark:text-blue-100">
                  {selectedWebLexiconWord.word}
                </h3>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  {selectedWebLexiconWord.kor}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 text-xs text-left hide-scrollbar flex-1">
              {isWebLexiconLoading ? (
                <div className="py-6 text-center text-stone-400 font-medium">영한 사전 뜻풀이 인출 중...</div>
              ) : (
                <>
                  {selectedWebLexiconWord.theology && (
                    <div className="p-2.5 rounded-xl border bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40">
                      <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5 text-[10.5px]">
                        ✨ 성경적 의미 및 구속사적 용례
                      </span>
                      <p className="text-[12px] leading-relaxed text-stone-800 dark:text-slate-200">
                        {selectedWebLexiconWord.theology}
                      </p>
                    </div>
                  )}

                  {selectedWebLexiconWord.details && (
                    <div className="p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-800">
                      <span className="font-bold text-stone-500 dark:text-slate-400 block mb-0.5 text-[10.5px]">
                        📚 품사별 사전 정의
                      </span>
                      <pre className="whitespace-pre-wrap font-sans text-[11.5px] leading-relaxed text-stone-700 dark:text-slate-300">
                        {selectedWebLexiconWord.details}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => setSelectedWebLexiconWord(null)}
                className="w-full py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-slate-200 dark:text-stone-900 text-white font-bold text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 원어 단어 상세 심층 모달 (히브리어/헬라어) */}
      {selectedWordDetail && (
        <div className="interlinear-modal-portal fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fade-in select-none">
          <div className={`w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            
            <div className="border-b pb-2.5 border-stone-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-mono text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {selectedWordDetail.strongs} · {selectedWordDetail.lexicon?.sourceName}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => speakAudio(selectedWordDetail.inflected, isOT ? 'he-IL' : 'el-GR')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold border border-stone-300 dark:border-slate-700 cursor-pointer"
                >
                  <IconVolume />
                </button>
                <button onClick={() => setSelectedWordDetail(null)} className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border my-2 flex justify-between items-baseline ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-stone-50 border-stone-200'
            }`}>
              <div>
                <span style={originalFontStyle} className="text-2xl font-bold block">{selectedWordDetail.inflected}</span>
                <span className="text-xs font-mono text-stone-500 dark:text-slate-400">{selectedWordDetail.pron}</span>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-bold block">{selectedWordDetail.korContextual}</span>
                <span className="text-xs text-stone-500 dark:text-slate-400">원형: {selectedWordDetail.korLemma}</span>
              </div>
            </div>

            <div className="flex gap-1 border-b border-stone-200 dark:border-slate-800 pb-2 mb-2 shrink-0 text-[11px] font-bold">
              {[
                { id: 'concordance', label: `📊 전권 용례 (${concordanceTotalCount})` },
                { id: 'full_lexicon', label: '🏛️ BDB/Thayer' },
                { id: 'korean', label: '🇰🇷 문법/구속사' },
                { id: 'custom_study', label: '✍️ 나의 번역' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    modalTab === tab.id 
                      ? 'bg-amber-600 text-white font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-900' 
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-2 flex-1 text-xs text-left">
              {modalTab === 'concordance' && (
                <div className="space-y-2">
                  {isConcordanceLoading ? (
                    <div className="py-6 text-center text-stone-400">성경 66권에서 용례 인출 중...</div>
                  ) : (
                    concordanceList.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleJumpToConcordanceVerse(item.book, item.chapter, item.verse)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="font-bold text-stone-800 dark:text-slate-200">{item.book} {item.chapter}:{item.verse}</span>
                        <span style={originalFontStyle} className="font-bold text-[15px]">{cleanTypography(item.original_word, isOT, typographyMode)}</span>
                        <span className="text-stone-500 truncate max-w-[120px]">{item.korean_trans}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {modalTab === 'full_lexicon' && (
                <div className="space-y-1.5">
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">[어원 및 파생]</span>
                    <p className="mt-0.5 font-mono">{decodeHtmlEntities(selectedWordDetail.lexicon?.etymology)}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">[원어 본래 정의]</span>
                    <p className="mt-0.5 font-mono">{decodeHtmlEntities(selectedWordDetail.lexicon?.meaning)}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">[원전 전문]</span>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed mt-0.5">{decodeHtmlEntities(selectedWordDetail.lexicon?.rawFull)}</pre>
                  </div>
                </div>
              )}

              {modalTab === 'korean' && (
                <div className="space-y-1.5">
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-[10px] font-bold text-stone-400 block">형태론 분석</span>
                    <span className="text-sm font-bold block mt-0.5">{selectedWordDetail.grammarDecoded}</span>
                  </div>
                  {selectedWordDetail.theologyInsight && (
                    <div className={`p-2.5 rounded-lg border space-y-1 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200`}>
                      <span className="font-bold block">📜 {selectedWordDetail.theologyInsight.stemTitle}</span>
                      <p className="leading-relaxed">{selectedWordDetail.theologyInsight.stemDesc}</p>
                      {selectedWordDetail.theologyInsight.aspectDesc && (
                        <p className="text-[11px] pt-1 border-t border-dashed border-amber-300 dark:border-amber-700/50 font-semibold">
                          ↳ {selectedWordDetail.theologyInsight.aspectDesc}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedWordDetail.note && (
                    <div className={`p-2.5 rounded-lg border bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-800`}>
                      <span className="font-bold block text-[11px] text-stone-900 dark:text-slate-100">📖 구속사적 의미</span>
                      <p className="text-[11.5px] leading-relaxed text-stone-700 dark:text-slate-300">{decodeHtmlEntities(selectedWordDetail.note)}</p>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'custom_study' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInputTrans}
                    onChange={(e) => setCustomInputTrans(e.target.value)}
                    placeholder="나만의 한국어 번역어..."
                    className={`w-full p-2 rounded-lg border text-xs font-bold outline-none ${
                      isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-300 bg-white'
                    }`}
                  />
                  <textarea
                    rows={3}
                    value={customInputMemo}
                    onChange={(e) => setCustomInputMemo(e.target.value)}
                    placeholder="심층 신학 연구 메모..."
                    className={`w-full p-2 rounded-lg border text-xs outline-none resize-none ${
                      isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-300 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomLexiconNote}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    💾 영구 저장
                  </button>
                </div>
              )}
            </div>

            {/* 🌟 [완전 복원] QT 및 설교노트에 원어 주석 즉시 삽입 액션 바 */}
            <div className="pt-2.5 border-t border-stone-200 dark:border-slate-800 mt-2 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleInsertToQT(selectedWordDetail)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🌿</span> QT 묵상에 삽입
              </button>
              <button
                type="button"
                onClick={() => handleInsertToSermon(selectedWordDetail)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>📖</span> 설교노트에 삽입
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. 나의 연구 서재 모달 */}
      {isLibraryOpen && (
        <div className="interlinear-modal-portal fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none">
          <div className={`w-full max-w-md rounded-2xl border p-4 shadow-2xl flex flex-col max-h-[80vh] ${
            isDark ? 'bg-[#0F141F] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-2 mb-2 border-stone-200 dark:border-slate-800">
              <h3 className="font-bold text-sm">📚 나의 원어 연구 서재</h3>
              <button onClick={() => setIsLibraryOpen(false)} className="text-xs font-bold text-stone-400 p-1 cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs hide-scrollbar text-left">
              {Object.keys(customNotesMap).length === 0 ? (
                <div className="py-8 text-center text-stone-400">저장된 연구 메모가 없습니다.</div>
              ) : (
                Object.values(customNotesMap).map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (item.book && item.chapter && item.verse) {
                        handleJumpToConcordanceVerse(item.book, item.chapter, item.verse);
                      }
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer ${
                      isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>{item.lemma} ({item.strongs})</span>
                      <span className="font-mono text-stone-400">{item.book} {item.chapter}:{item.verse} ➔</span>
                    </div>
                    {item.translation && <p className="text-stone-700 dark:text-slate-300 mt-0.5 font-medium">번역: "{item.translation}"</p>}
                    {item.memo && <p className="text-stone-500 dark:text-slate-400 mt-0.5">↳ {item.memo}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. 문법 대백과 모달 */}
      {selectedGrammarWikiKey && (
        <GrammarWikiModal
          encyclopediaKey={selectedGrammarWikiKey}
          onClose={() => setSelectedGrammarWikiKey(null)}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
}
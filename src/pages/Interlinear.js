// src/pages/Interlinear.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCrossReferences } from '../lib/tskHelper';
import { analyzeHebrewSyntaxFromWords } from '../lib/hebrewSyntaxEngine';
import { tokenizeGrammarCode } from '../lib/biblicalGrammarWiki';
import GrammarWikiModal from '../lib/GrammarWikiModal';

const BIBLE_66_BOOKS = [
  // 구약 39권
  { ko: "창세기", en: "Genesis", isOT: true, maxChap: 50, section: "모세오경" },
  { ko: "출애굽기", en: "Exodus", isOT: true, maxChap: 40, section: "모세오경" },
  { ko: "레위기", en: "Leviticus", isOT: true, maxChap: 27, section: "모세오경" },
  { ko: "민수기", en: "Numbers", isOT: true, maxChap: 36, section: "모세오경" },
  { ko: "신명기", en: "Deuteronomy", isOT: true, maxChap: 34, section: "모세오경" },
  { ko: "여호수아", en: "Joshua", isOT: true, maxChap: 24, section: "역사서" },
  { ko: "사사기", en: "Judges", isOT: true, maxChap: 21, section: "역사서" },
  { ko: "룻기", en: "Ruth", isOT: true, maxChap: 4, section: "역사서" },
  { ko: "사무엘상", en: "1 Samuel", isOT: true, maxChap: 31, section: "역사서" },
  { ko: "사무엘하", en: "2 Samuel", isOT: true, maxChap: 24, section: "역사서" },
  { ko: "열왕기상", en: "1 Kings", isOT: true, maxChap: 22, section: "역사서" },
  { ko: "열왕기하", en: "2 Kings", isOT: true, maxChap: 25, section: "역사서" },
  { ko: "역대상", en: "1 Chronicles", isOT: true, maxChap: 29, section: "역사서" },
  { ko: "역대하", en: "2 Chronicles", isOT: true, maxChap: 36, section: "역사서" },
  { ko: "에스라", en: "Ezra", isOT: true, maxChap: 10, section: "역사서" },
  { ko: "느헤미야", en: "Nehemiah", isOT: true, maxChap: 13, section: "역사서" },
  { ko: "에스더", en: "Esther", isOT: true, maxChap: 10, section: "역사서" },
  { ko: "욥기", en: "Job", isOT: true, maxChap: 42, section: "시가서" },
  { ko: "시편", en: "Psalms", isOT: true, maxChap: 150, section: "시가서" },
  { ko: "잠언", en: "Proverbs", isOT: true, maxChap: 31, section: "시가서" },
  { ko: "전도서", en: "Ecclesiastes", isOT: true, maxChap: 12, section: "시가서" },
  { ko: "아가", en: "Song of Solomon", isOT: true, maxChap: 8, section: "시가서" },
  { ko: "이사야", en: "Isaiah", isOT: true, maxChap: 66, section: "선지서" },
  { ko: "예레미야", en: "Jeremiah", isOT: true, maxChap: 52, section: "선지서" },
  { ko: "예레미야애가", en: "Lamentations", isOT: true, maxChap: 5, section: "선지서" },
  { ko: "에스겔", en: "Ezekiel", isOT: true, maxChap: 48, section: "선지서" },
  { ko: "다니엘", en: "Daniel", isOT: true, maxChap: 12, section: "선지서" },
  { ko: "호세아", en: "Hosea", isOT: true, maxChap: 14, section: "선지서" },
  { ko: "요엘", en: "Joel", isOT: true, maxChap: 3, section: "선지서" },
  { ko: "아모스", en: "Amos", isOT: true, maxChap: 9, section: "선지서" },
  { ko: "오바댜", en: "Obadiah", isOT: true, maxChap: 1, section: "선지서" },
  { ko: "요나", en: "Jonah", isOT: true, maxChap: 4, section: "선지서" },
  { ko: "미가", en: "Micah", isOT: true, maxChap: 7, section: "선지서" },
  { ko: "나훔", en: "Nahum", isOT: true, maxChap: 3, section: "선지서" },
  { ko: "하박국", en: "Habakkuk", isOT: true, maxChap: 3, section: "선지서" },
  { ko: "스바냐", en: "Zephaniah", isOT: true, maxChap: 3, section: "선지서" },
  { ko: "학개", en: "Haggai", isOT: true, maxChap: 2, section: "선지서" },
  { ko: "스가랴", en: "Zechariah", isOT: true, maxChap: 14, section: "선지서" },
  { ko: "말라기", en: "Malachi", isOT: true, maxChap: 4, section: "선지서" },

  // 신약 27권
  { ko: "마태복음", en: "Matthew", isOT: false, maxChap: 28, section: "복음/역사" },
  { ko: "마가복음", en: "Mark", isOT: false, maxChap: 16, section: "복음/역사" },
  { ko: "누가복음", en: "Luke", isOT: false, maxChap: 24, section: "복음/역사" },
  { ko: "요한복음", en: "John", isOT: false, maxChap: 21, section: "복음/역사" },
  { ko: "사도행전", en: "Acts", isOT: false, maxChap: 28, section: "복음/역사" },
  { ko: "로마서", en: "Romans", isOT: false, maxChap: 16, section: "서신서" },
  { ko: "고린도전서", en: "1 Corinthians", isOT: false, maxChap: 16, section: "서신서" },
  { ko: "고린도후서", en: "2 Corinthians", isOT: false, maxChap: 13, section: "서신서" },
  { ko: "갈라디아서", en: "Galatians", isOT: false, maxChap: 6, section: "서신서" },
  { ko: "에베소서", en: "Ephesians", isOT: false, maxChap: 6, section: "서신서" },
  { ko: "빌립보서", en: "Philippians", isOT: false, maxChap: 4, section: "서신서" },
  { ko: "골로새서", en: "Colossians", isOT: false, maxChap: 4, section: "서신서" },
  { ko: "데살로니가전서", en: "1 Thessalonians", isOT: false, maxChap: 5, section: "서신서" },
  { ko: "데살로니가후서", en: "2 Thessalonians", isOT: false, maxChap: 3, section: "서신서" },
  { ko: "디모데전서", en: "1 Timothy", isOT: false, maxChap: 6, section: "서신서" },
  { ko: "디모데후서", en: "2 Timothy", isOT: false, maxChap: 4, section: "서신서" },
  { ko: "디도서", en: "Titus", isOT: false, maxChap: 3, section: "서신서" },
  { ko: "빌레몬서", en: "Philemon", isOT: false, maxChap: 1, section: "서신서" },
  { ko: "히브리서", en: "Hebrews", isOT: false, maxChap: 13, section: "서신서" },
  { ko: "야고보서", en: "James", isOT: false, maxChap: 5, section: "서신서" },
  { ko: "베드로전서", en: "1 Peter", isOT: false, maxChap: 5, section: "서신서" },
  { ko: "베드로후서", en: "2 Peter", isOT: false, maxChap: 3, section: "서신서" },
  { ko: "요한일서", en: "1 John", isOT: false, maxChap: 5, section: "서신서" },
  { ko: "요한이서", en: "2 John", isOT: false, maxChap: 1, section: "서신서" },
  { ko: "요한삼서", en: "3 John", isOT: false, maxChap: 1, section: "서신서" },
  { ko: "유다서", en: "Jude", isOT: false, maxChap: 1, section: "서신서" },
  { ko: "요한계시록", en: "Revelation", isOT: false, maxChap: 22, section: "서신서" }
];

const BOOK_SECTION_LOOKUP = {};
BIBLE_66_BOOKS.forEach(b => { BOOK_SECTION_LOOKUP[b.ko] = b.section; });

const FALLBACK_ENGLISH_TRANSLATION_MAP = {
  'break away': '배반하다, 반역하다', 'moab': '모압', 'properly': '후(後)에, 뒤에',
  'ahaziah': '아하시야', 'ahab': '아합', 'die': '죽다, 사망하다', 'fall': '떨어지다, 넘어지다',
  'sick': '병들다, 앓다', 'send': '보내다, 파견하다', 'messengers': '사자들, 전령들',
  'inquire': '묻다, 구하다', 'baalzebub': '바알세붑', 'ekron': '에그론', 'recover': '낫다, 회복하다',
  'disease': '병, 질병', 'angel': '사자, 천사', 'arise': '일어나다', 'go up': '올라가다',
  'meet': '만나다', 'king': '왕, 군왕', 'samaria': '사마리아', 'god': '하나님, 신'
};

const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;

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
    sourceName: isOT ? "BDB (Brown-Driver-Briggs) & Strong's Full" : "Thayer's Greek Lexicon & Strong's Full",
    rawFull: desc || '영문 사전 원전 데이터가 없습니다.',
    etymology: etymology || masterEntry?.etym || '원어 고유 어근(Primitive Root)',
    meaning: meaning || masterEntry?.eng || '원문 문맥적 기본 정의',
    usage: usage || masterEntry?.usage || '주요 성경 번역 용례 (Occurrences)'
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

  // 📖 성경 번역본 모드: 'krv'(개역개정) | 'easy'(쉬운성경) | 'parallel'(동시대조)
  const [bibleVersion, setBibleVersion] = useState(() => {
    try {
      return localStorage.getItem('interlinear_bible_version') || 'krv';
    } catch (_) {
      return 'krv';
    }
  });
  const [easyBibleDb, setEasyBibleDb] = useState({});

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

  const [selectedGrammarWikiKey, setSelectedGrammarWikiKey] = useState(null);
  const [typographyMode, setTypographyMode] = useState('vowels');

  const [concordanceTotalCount, setConcordanceTotalCount] = useState(0);
  const [concordanceDistribution, setConcordanceDistribution] = useState({});
  const [concordanceList, setConcordanceList] = useState([]);
  const [isConcordanceLoading, setIsConcordanceLoading] = useState(false);

  const [customNotesMap, setCustomNotesMap] = useState({});
  const [customInputTrans, setCustomInputTrans] = useState('');
  const [customInputMemo, setCustomInputMemo] = useState('');

  // 10대 학술 아코디언 상태
  const [openPanels, setOpenPanels] = useState({
    tsk: true, lxx: true, josephus: true, geo: true, commentary: true,
    matthewHenry: true, netNotes: true, easton: true, targumPeshitta: true, hebrewSyntax: true
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

  // 개역개정 본문 실시간 엔티티 디코딩
  const koVerseText = useMemo(() => {
    if (!currentBookData?.chapters?.[chapter - 1]) return `${currentBookMeta.ko} ${chapter}장 ${verse}절`;
    const v = currentBookData.chapters[chapter - 1][verse - 1];
    const raw = v ? (typeof v === 'string' ? v : v.text || v.content || '') : `${currentBookMeta.ko} ${chapter}장 ${verse}절`;
    return decodeHtmlEntities(raw);
  }, [currentBookData, currentBookMeta, chapter, verse]);

  // 쉬운성경 본문 실시간 조회
  const easyVerseText = useMemo(() => {
    const key = `${currentBookMeta.ko}-${chapter}-${verse}`;
    return easyBibleDb[key] || '';
  }, [currentBookMeta.ko, chapter, verse, easyBibleDb]);

  const enVerseText = useMemo(() => {
    if (!words || words.length === 0) return '';
    return decodeHtmlEntities(words.map(w => w.eng).filter(e => e && e !== 'n/a' && e !== '-').join(' '));
  }, [words]);

  // 10대 데이터셋 & 쉬운성경 사전 로드
  useEffect(() => {
    fetch('/data/easy_bible.json').then(r => r.ok ? r.json() : {}).then(d => setEasyBibleDb(d || {})).catch(() => {});
    fetch('/data/lxx_quotes.json').then(r => r.ok ? r.json() : {}).then(d => setLxxDatabase(d || {})).catch(() => {});
    fetch('/data/josephus.json').then(r => r.ok ? r.json() : {}).then(d => setJosephusDb(d || {})).catch(() => {});
    fetch('/data/bible_geodata.json').then(r => r.ok ? r.json() : {}).then(d => setGeoDb(d || {})).catch(() => {});
    //fetch('/data/commentaries.json').then(r => r.ok ? r.json() : {}).then(d => setCommentaryDb(d || {})).catch(() => {});
    //fetch('/data/matthew_henry.json').then(r => r.ok ? r.json() : {}).then(d => setMatthewHenryDb(d || {})).catch(() => {});
    fetch('/data/net_notes.json').then(r => r.ok ? r.json() : {}).then(d => setNetNotesDb(d || {})).catch(() => {});
    fetch('/data/easton_dict.json').then(r => r.ok ? r.json() : {}).then(d => setEastonDb(d || {})).catch(() => {});
    fetch('/data/targum_peshitta.json').then(r => r.ok ? r.json() : {}).then(d => setTargumPeshittaDb(d || {})).catch(() => {});
  }, []);
  
  // 🌟 성경 책과 장(Chapter)이 바뀔 때마다 깃허브에 올라간 장별 분할 파일과 정확히 매칭하여 로드
  useEffect(() => {
    const bookName = currentBookMeta.ko; // 예: "창세기", "사도행전"
    const chapterNum = chapter;           // 현재 장 번호
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
      if (selectedWordDetail || isLibraryOpen || selectedGrammarWikiKey) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevVerse(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextVerse(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevVerse, handleNextVerse, selectedWordDetail, isLibraryOpen, selectedGrammarWikiKey]);

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

  useEffect(() => {
    const hideFloatingNavElements = () => {
      const allDivs = document.querySelectorAll('div, nav');
      allDivs.forEach(el => {
        if (el.innerText && el.innerText.includes('홈') && el.innerText.includes('목장모임') && el.innerText.includes('감사/간증')) {
          el.style.setProperty('display', 'none', 'important');
          el.setAttribute('data-hidden-by-interlinear', 'true');
        }
      });
      const classSelectors = ['nav', '[class*="fixed bottom"]', '.floating-bottom-nav', '#bottom-nav'];
      classSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.closest('.interlinear-modal-portal')) {
            el.style.setProperty('display', 'none', 'important');
            el.setAttribute('data-hidden-by-interlinear', 'true');
          }
        });
      });
    };

    hideFloatingNavElements();
    const intervalTimer = setInterval(hideFloatingNavElements, 300);

    return () => {
      clearInterval(intervalTimer);
      document.querySelectorAll('[data-hidden-by-interlinear]').forEach(el => {
        el.style.removeProperty('display');
        el.removeAttribute('data-hidden-by-interlinear');
      });
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

          const contextualKorean = applyContextualCaseEnding(lemmaMeaning, morphInfo.caseType, isOT, w.grammar);

          let finalPron = masterEntry.pron || '';
          if (!finalPron && w.pronunciation) {
            finalPron = `[${w.pronunciation.replace(/[[\]]/g, '')}]`;
          }

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
        const { data, count, error } = await supabase
          .from('interlinear_bible')
          .select('book, chapter, verse, original_word, korean_trans', { count: 'exact' })
          .eq('strongs_id', word.strongs)
          .order('id', { ascending: true })
          .limit(60);

        if (!error && data) {
          setConcordanceTotalCount(count || data.length);
          setConcordanceList(data);

          const distMap = {};
          data.forEach(item => {
            const sec = BOOK_SECTION_LOOKUP[item.book] || (word.strongs.startsWith('H') ? '구약' : '신약');
            distMap[sec] = (distMap[sec] || 0) + 1;
          });
          setConcordanceDistribution(distMap);
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

  const handleCopyLexiconRaw = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(decodeHtmlEntities(text));
    alert("📋 학술 사전 원전 전문이 클립보드에 복사되었습니다.");
  }, []);

  const handleCopyComprehensiveReport = useCallback(() => {
    let report = `## [원어 강해 종합 리포트] ${currentBookMeta.ko} ${chapter}장 ${verse}절\n\n`;
    report += `**개역개정:** ${koVerseText}\n`;
    if (easyVerseText) report += `**쉬운성경:** ${easyVerseText}\n`;
    if (enVerseText) report += `**영어직역:** "${enVerseText}"\n\n`;
    
    report += `### 📖 단어별 원어 분해:\n`;
    words.forEach(w => {
      report += `- **${w.inflected}** (${w.lemma}) [${w.strongs}]: ${w.korContextual} | *${w.grammarDecoded}*\n`;
    });
    report += `\n`;

    if (currentHebrewSyntax) {
      report += `### 📜 BHS 히브리어 구문론 끊어읽기:\n`;
      currentHebrewSyntax.clauseHierarchy.forEach(c => {
        report += `- **${c.unit}** ➔ ${c.role} (${c.pauseType})\n`;
      });
      report += `- 강해: ${currentHebrewSyntax.cantillationExegesis}\n\n`;
    }
    if (currentLxxParallel) {
      report += `### 🏛️ 70인역(LXX) 대조 (${currentLxxParallel.otRef}):\n`;
      report += `- GNT: ${currentLxxParallel.ntText}\n- LXX: ${currentLxxParallel.lxxText}\n- MT: ${currentLxxParallel.mtText}\n`;
      report += `- 주해: ${currentLxxParallel.differenceAnalysis}\n\n`;
    }
    if (currentTargumPeshitta) {
      report += `### 🏺 고대 아람어 타르굼 & 시리아 페시타 대조:\n`;
      if (currentTargumPeshitta.targumKo) report += `- 아람어: ${currentTargumPeshitta.targumKo}\n`;
      if (currentTargumPeshitta.peshittaKo) report += `- 시리아어: ${currentTargumPeshitta.peshittaKo}\n`;
      report += `- 비평: ${currentTargumPeshitta.academicNote}\n\n`;
    }
    if (currentJosephus) {
      report += `### 📜 요세푸스 1세기 사료 (${currentJosephus.work}):\n- ${currentJosephus.historicalEvent}: ${currentJosephus.summary}\n\n`;
    }
    if (currentGeoData) {
      report += `### 🗺 고고학 지리: ${currentGeoData.placeKo} (${currentGeoData.placeEn}) [GPS: ${currentGeoData.lat}, ${currentGeoData.lng}]\n- ${currentGeoData.historicalSignificance}\n\n`;
    }
    if (currentCommentary) {
      report += `### 📖 반즈 & JFB 주석 (${currentCommentary.commentator}):\n- 문맥 주해: ${currentCommentary.exegesis}\n- 교리: ${currentCommentary.theologicalNote}\n\n`;
    }
    if (currentMatthewHenry) {
      report += `### 🌿 매튜 헨리 묵상 주석 (${currentMatthewHenry.theme}):\n- 강해: ${currentMatthewHenry.devotionalExegesis}\n- 실천 적용: ${currentMatthewHenry.practicalApplication}\n\n`;
    }
    if (currentNetNote) {
      report += `### 🔍 NET Bible 본문 비평 각주:\n- ${currentNetNote.title}: ${currentNetNote.note}\n\n`;
    }

    navigator.clipboard.writeText(decodeHtmlEntities(report));
    alert("📋 10대 학술 엔진 및 쉬운성경이 총망라된 원어 강해 종합 리포트가 복사되었습니다!");
  }, [currentBookMeta.ko, chapter, verse, koVerseText, easyVerseText, enVerseText, words, currentHebrewSyntax, currentLxxParallel, currentTargumPeshitta, currentJosephus, currentGeoData, currentCommentary, currentMatthewHenry, currentNetNote]);

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
        ? `<br/>  ↳ <b>${word.theologyInsight.stemTitle}</b>: <i>${word.theologyInsight.stemDesc} ${word.theologyInsight.aspectDesc}</i>` 
        : '';

      const insightHtml = `<p><b>[원어강해] ${word.inflected} ${lemmaNotice} [${word.strongs}]</b>: ${word.korContextual} — <i>${word.grammarDecoded}</i>${theologyNotice}${customMemoBlock}</p>`;
      
      allDaily[today] = { ...todayData, sermonNotes: (todayData.sermonNotes || '') + insightHtml };
      localStorage.setItem('days_data', JSON.stringify(allDaily));
      alert(`[${word.inflected}] 원어 강해 주석이 설교노트에 반영되었습니다.`);
    } catch (_) {}
  }, []);

  const isDark = isDarkMode;
  const bgBody = isDark ? 'bg-[#0B0F17]' : 'bg-[#F8FAFC]';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const glassCard = isDark 
    ? 'bg-[#121824] border border-[#20293A] shadow-sm' 
    : 'bg-white border border-slate-200/90 shadow-xs';
  const bgSubCard = isDark ? 'bg-[#161D2B]' : 'bg-white';

  const getBadgeClass = (type, isVerb) => {
    if (isVerb) return isDark ? 'bg-indigo-950/70 text-indigo-200 border-indigo-800 font-bold' : 'bg-indigo-50/80 text-indigo-900 border-indigo-200 font-bold';
    if (type === 'verb') return isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200 font-medium';
    if (type === 'noun') return isDark ? 'bg-slate-800/90 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200 font-medium';
    return isDark ? 'bg-slate-800/60 text-slate-300 border-slate-700' : 'bg-slate-100/70 text-slate-700 border-slate-200';
  };

  const originalFontStyle = isOT
    ? { fontFamily: "'SBL Hebrew', 'Taamey Frank CLM', 'Ezra SIL', serif", direction: 'rtl' }
    : { fontFamily: "'SBL Greek', 'Cardo', 'Times New Roman', serif", direction: 'ltr' };

  return (
    <div className={`flex-1 flex flex-col h-full pointer-events-auto ${bgBody} relative font-sans overflow-hidden select-none`}>
      
      <style>{`
        nav, div[class*="fixed bottom"], div[class*="fixed"][class*="bottom-"], .floating-bottom-nav, #bottom-nav {
          display: none !important;
        }
      `}</style>

      {/* 상단 헤더 바 */}
      <div className={`px-3 sm:px-4 py-2.5 sm:py-3 ${isDark ? 'border-[#20293A] bg-[#101622]' : 'border-slate-200 bg-white'} border-b z-[60] sticky top-0 shadow-2xs flex flex-col gap-1.5`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`${textMain} p-1 md:hidden opacity-80 hover:opacity-100 cursor-pointer`}><IconMenu/></button>
            <button onClick={() => setActiveScreen('home')} className={`${textMain} p-1 opacity-80 hover:opacity-100 cursor-pointer`}><IconBack/></button>
            <h1 className={`text-[15px] sm:text-[16px] font-bold tracking-tight truncate ${textMain}`}>
              원어 성경 연구 <span className="hidden sm:inline text-xs font-medium text-slate-400 dark:text-slate-500">(10-Core Exegetical Suite)</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
              }`}
            >
              📚 나의 연구 서재
            </button>
            <button
              type="button"
              onClick={handleCopyComprehensiveReport}
              className={`hidden sm:flex px-2.5 py-1 rounded-lg text-[11px] font-semibold border items-center gap-1 transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
              }`}
            >
              📋 리포트 복사
            </button>

            {isOT && (
              <div className={`hidden sm:flex items-center p-0.5 rounded-lg border text-[10px] font-semibold ${
                isDark ? 'bg-black/30 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button type="button" onClick={() => setTypographyMode('vowels')} className={`px-2 py-0.5 rounded transition-all ${typographyMode === 'vowels' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>표준(모음)</button>
                <button type="button" onClick={() => setTypographyMode('full')} className={`px-2 py-0.5 rounded transition-all ${typographyMode === 'full' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>원전(악센트)</button>
                <button type="button" onClick={() => setTypographyMode('consonants')} className={`px-2 py-0.5 rounded transition-all ${typographyMode === 'consonants' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>자음만</button>
              </div>
            )}

            <span className={`text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md border font-bold ${
              isOT ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {isOT ? '구약 (RTL)' : '신약 (LTR)'}
            </span>
          </div>
        </div>

        {isOT && (
          <div className={`sm:hidden flex items-center justify-between p-1 rounded-lg border text-[11px] font-semibold ${
            isDark ? 'bg-black/30 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`text-[10px] font-medium pl-1 ${textSub}`}>악센트 표기:</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setTypographyMode('vowels')} className={`px-2.5 py-0.5 rounded transition-all ${typographyMode === 'vowels' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>표준 (모음)</button>
              <button type="button" onClick={() => setTypographyMode('full')} className={`px-2.5 py-0.5 rounded transition-all ${typographyMode === 'full' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>원전 (전체)</button>
              <button type="button" onClick={() => setTypographyMode('consonants')} className={`px-2.5 py-0.5 rounded transition-all ${typographyMode === 'consonants' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : textSub}`}>자음만</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pb-16 w-full hide-scrollbar space-y-3.5 relative z-10 max-w-6xl mx-auto pt-3">
        
        {/* 권/장/절 선택 바 */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className={`flex gap-2 p-1.5 sm:p-2 ${glassCard} rounded-xl shadow-xs flex-1 max-w-xl`}>
            <select 
              value={selectedBookIndex} 
              onChange={(e) => { setSelectedBookIndex(Number(e.target.value)); setChapter(1); setVerse(1); }} 
              className={`flex-1 bg-transparent text-[13px] font-bold ${textMain} outline-none cursor-pointer pl-1`}
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
              className={`w-18 bg-transparent text-[13px] font-bold ${textMain} outline-none cursor-pointer`}
            >
              {Array.from({ length: chaptersCount }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}장</option>)}
            </select>
            <select 
              value={verse} 
              onChange={(e) => setVerse(Number(e.target.value))} 
              className={`w-18 bg-transparent text-[13px] font-bold ${textMain} outline-none cursor-pointer`}
            >
              {Array.from({ length: versesCount }, (_, i) => <option key={i+1} value={i+1} className="text-black">{i+1}절</option>)}
            </select>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrevVerse}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isDark ? 'bg-[#161D2B] border-[#222B3D] text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              ◀ 이전 절
            </button>
            <button
              type="button"
              onClick={handleNextVerse}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isDark ? 'bg-[#161D2B] border-[#222B3D] text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              다음 절 ▶
            </button>
          </div>
        </div>

        {/* 상단 통합 본문 & 10대 학술 모듈 */}
        <div className={`${glassCard} rounded-2xl p-4 sm:p-6 space-y-4`}>
          <div className={`border-b ${isDark ? 'border-[#20293A]' : 'border-slate-200'} pb-2.5 flex flex-wrap justify-between items-center gap-2`}>
            <div className="flex items-center gap-2">
              <h2 className={`text-[16px] sm:text-[17px] font-bold ${textMain}`}>
                {currentBookMeta.ko} {chapter}장 {verse}절
              </h2>
              <div className="flex flex-wrap gap-1">
                {crossRefs.length > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">TSK {crossRefs.length}</span>}
                {currentHebrewSyntax && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">BHS 구문론</span>}
                {currentLxxParallel && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">LXX 대조</span>}
                {currentTargumPeshitta && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">타르굼/페시타</span>}
                {currentJosephus && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">요세푸스</span>}
                {currentGeoData && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">GPS 지리</span>}
                {currentCommentary && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">반즈 주석</span>}
                {currentMatthewHenry && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">매튜 헨리</span>}
                {currentNetNote && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">NET 비평</span>}
                {currentEaston && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">이스톤 백과</span>}
              </div>
            </div>
            <span className={`text-[11px] font-medium ${textSub}`}>단어 터치 시 동기화 (← → 로 구절 이동)</span>
          </div>
          
          {/* 🌟 번역본 스왑 & 병렬 대조 세그먼트 스위치 */}
          <div className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                {bibleVersion === 'easy' ? '쉬운성경 본문' : bibleVersion === 'parallel' ? '개역개정 & 쉬운성경 대조' : '개역개정 본문'}
              </span>
              
              <div className={`flex p-0.5 rounded-lg border text-[10.5px] font-bold ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => handleVersionChange('krv')}
                  className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    bibleVersion === 'krv' 
                      ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-slate-900 shadow-2xs font-bold') 
                      : textSub
                  }`}
                >
                  개역개정
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionChange('easy')}
                  className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    bibleVersion === 'easy' 
                      ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-slate-900 shadow-2xs font-bold') 
                      : textSub
                  }`}
                >
                  쉬운성경
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionChange('parallel')}
                  className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    bibleVersion === 'parallel' 
                      ? (isDark ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-white text-slate-900 shadow-2xs font-bold') 
                      : textSub
                  }`}
                >
                  동시대조
                </button>
              </div>
            </div>

            {/* 본문 렌더링 (스왑 / 동시대조) */}
            {bibleVersion === 'krv' && (
              <p className={`text-[15.5px] sm:text-[16.5px] font-semibold leading-[1.8] break-keep ${textMain}`}>
                {koVerseText}
              </p>
            )}

            {bibleVersion === 'easy' && (
              <p className={`text-[15.5px] sm:text-[16.5px] font-semibold leading-[1.8] break-keep ${textMain}`}>
                {easyVerseText || koVerseText}
              </p>
            )}

            {bibleVersion === 'parallel' && (
              <div className="space-y-2 pt-0.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">[개역개정]</span>
                  <p className={`text-[15px] sm:text-[16px] font-semibold leading-[1.8] break-keep ${textMain}`}>
                    {koVerseText}
                  </p>
                </div>
                {easyVerseText && (
                  <div className={`p-3 rounded-xl border text-left ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">[쉬운성경]</span>
                    <p className={`text-[14px] sm:text-[15px] font-medium leading-[1.7] break-keep ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {easyVerseText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 영어 직역 대조 */}
          {enVerseText && (
            <div className={`pt-2.5 border-t border-dashed text-left ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSub}`}>
                영어 직역 대조
              </span>
              <p className={`text-[13px] sm:text-[13.5px] font-medium leading-[1.7] italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                "{enVerseText}"
              </p>
            </div>
          )}
          
          {/* 원어 원문 */}
          <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSub}`}>
                {isOT ? '원어 원문 (히브리어 BHS · 우측 RTL)' : '원어 원문 (헬라어 NA28 · 좌측 LTR)'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                {isOT ? '오른쪽 ➔ 왼쪽' : '왼쪽 ➔ 오른쪽'}
              </span>
            </div>

            {isLoading ? (
              <div className="h-12 flex items-center justify-center text-[12px] font-medium text-slate-400">
                원어 데이터 로딩 중...
              </div>
            ) : (
              <div 
                className={`w-full flex flex-wrap gap-x-3 gap-y-2 items-baseline ${
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
                      className={`text-[23px] sm:text-[27px] transition-all px-2 py-0.5 rounded-lg cursor-pointer ${
                        isHighlighted
                          ? (isDark ? 'bg-slate-800 text-white ring-2 ring-slate-600 shadow-sm' : 'bg-slate-900 text-white ring-2 ring-slate-900 shadow-sm')
                          : `${textMain} hover:bg-slate-100 dark:hover:bg-slate-800/60`
                      }`}
                    >
                      {renderedText}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1. TSK 상호참조 패널 */}
          <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'}`}>
            <div onClick={() => togglePanel('tsk')} className="flex justify-between items-center mb-2 cursor-pointer select-none">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMain}`}>
                🔗 1. 정경 상호교차참조 (TSK Cross-References)
                <span className="text-[10px] opacity-50">{openPanels.tsk ? '▼ 접기' : '▶ 펼치기'}</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                연결 성구 {crossRefs.length}개
              </span>
            </div>

            {openPanels.tsk && (
              isTskLoading ? (
                <div className="text-[11px] text-slate-400 py-1 font-mono">교차참조 탐색 중...</div>
              ) : crossRefs.length === 0 ? (
                <div className={`text-[11.5px] py-0.5 ${textSub}`}>직결된 교차참조 구절이 없습니다.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto hide-scrollbar py-0.5">
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isDark 
                          ? 'bg-[#161D2B] hover:bg-slate-800 border-slate-700 text-slate-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>📖</span> {ref.label}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 2. BHS 히브리어 구문론 패널 */}
          {currentHebrewSyntax && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in`}>
              <div onClick={() => togglePanel('hebrewSyntax')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">📜</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    2. BHS 히브리어 문장 구조 구문론 끊어읽기
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.hebrewSyntax ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  Atnach 대휴지
                </span>
              </div>

              {openPanels.hebrewSyntax && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentHebrewSyntax.clauseHierarchy.map((c, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg border text-right ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`} dir="rtl">
                        <div className="flex justify-between items-center mb-1">
                          <span style={originalFontStyle} className="font-bold text-[17px] text-slate-900 dark:text-slate-100">{c.unit}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold" dir="ltr">{c.pauseType}</span>
                        </div>
                        <p className={`text-[11.5px] font-medium text-left ${textSub}`} dir="ltr">{c.role}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[11.5px] leading-relaxed font-medium pt-1 border-t border-dashed text-left ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                    💡 {decodeHtmlEntities(currentHebrewSyntax.cantillationExegesis)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. 70인역(LXX) 대조 패널 */}
          {currentLxxParallel && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2.5 animate-fade-in`}>
              <div onClick={() => togglePanel('lxx')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">🏛️</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    3. 70인역(LXX) 신·구약 인용 대조 ({currentLxxParallel.otRef})
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.lxx ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {currentLxxParallel.theme}
                </span>
              </div>

              {openPanels.lxx && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    <div className={`p-3 rounded-xl border space-y-1 text-left ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-bold block uppercase text-slate-400 dark:text-slate-500">[신약 헬라어 (GNT) · LTR]</span>
                      <p style={{ fontFamily: "'SBL Greek', 'Cardo', serif" }} className="text-[16px] font-serif font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                        {currentLxxParallel.ntText || "본문 인용"}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 text-left ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-bold block uppercase text-slate-400 dark:text-slate-500">[구약 70인역 (LXX) · LTR]</span>
                      <p style={{ fontFamily: "'SBL Greek', 'Cardo', serif" }} className="text-[16px] font-serif font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                        {currentLxxParallel.lxxText}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 text-right ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`} dir="rtl">
                      <span className="text-[10px] font-bold block uppercase text-left text-slate-400 dark:text-slate-500" dir="ltr">[구약 마소라 (MT) · RTL]</span>
                      <p style={{ fontFamily: "'SBL Hebrew', 'Ezra SIL', serif" }} className="text-[18px] font-serif font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                        {currentLxxParallel.mtText || "본문 인용"}
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1 text-left ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                    <span className={`text-[10.5px] font-bold block uppercase tracking-wider ${textSub}`}>
                      📜 원전 이문 분석 및 구속사적 의미
                    </span>
                    <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {decodeHtmlEntities(currentLxxParallel.differenceAnalysis)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. 고대 아람어 타르굼 & 시리아 페시타 패널 */}
          {currentTargumPeshitta && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in`}>
              <div onClick={() => togglePanel('targumPeshitta')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">🏺</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    4. 고대 아람어 타르굼(Targum) & 시리아 페시타(Peshitta) 대조군
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.targumPeshitta ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  Semitic Text
                </span>
              </div>

              {openPanels.targumPeshitta && (
                <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <div className={`grid gap-3 text-xs ${currentTargumPeshitta.targumAramaic ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentTargumPeshitta.targumAramaic && (
                      <div className={`p-3 rounded-xl border text-right ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`} dir="rtl">
                        <div className="flex justify-between items-center mb-1.5" dir="ltr">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">아람어 타르굼 역본 (Targum)</span>
                          <span className="text-[10px] font-mono text-slate-400">RTL</span>
                        </div>
                        <p style={{ fontFamily: "'SBL Hebrew', serif" }} className="text-[18px] font-serif font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                          {currentTargumPeshitta.targumAramaic}
                        </p>
                        {currentTargumPeshitta.targumKo && (
                          <p className={`text-[11.5px] font-medium mt-2 pt-2 border-t text-left ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`} dir="ltr">
                            {decodeHtmlEntities(currentTargumPeshitta.targumKo)}
                          </p>
                        )}
                      </div>
                    )}

                    {currentTargumPeshitta.peshittaSyriac ? (
                      <div className={`p-3 rounded-xl border text-right ${isDark ? 'bg-[#121824] border-slate-700/60' : 'bg-white border-slate-200'}`} dir="rtl">
                        <div className="flex justify-between items-center mb-1.5" dir="ltr">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">고대 시리아 페시타 역본 (Peshitta)</span>
                          <span className="text-[10px] font-mono text-slate-400">RTL</span>
                        </div>
                        <p style={{ fontFamily: "'Estrangelo Edessa', 'East Syriac Adiabene', serif" }} className="text-[20px] font-serif font-bold text-slate-900 dark:text-slate-100 leading-loose py-0.5">
                          {currentTargumPeshitta.peshittaSyriac}
                        </p>
                        {currentTargumPeshitta.peshittaKo && (
                          <p className={`text-[11.5px] font-medium mt-2 pt-2 border-t text-left ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`} dir="ltr">
                            {decodeHtmlEntities(currentTargumPeshitta.peshittaKo)}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {currentTargumPeshitta.academicNote && (
                    <p className={`text-[11.5px] leading-relaxed font-medium pt-2 border-t border-dashed text-left ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                      💡 {decodeHtmlEntities(currentTargumPeshitta.academicNote)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. 요세푸스 사료 패널 */}
          {currentJosephus && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('josephus')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">📜</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    5. 요세푸스(Josephus) 1세기 고대 유대 역사 사료 대조
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.josephus ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {currentJosephus.work}
                </span>
              </div>

              {openPanels.josephus && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <span className={`text-[12.5px] font-bold block ${textMain}`}>
                    ⚔️ {decodeHtmlEntities(currentJosephus.historicalEvent)}
                  </span>
                  <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {decodeHtmlEntities(currentJosephus.summary)}
                  </p>
                  {currentJosephus.primarySourceText && (
                    <div className={`mt-2 p-2.5 rounded-lg border text-xs italic ${isDark ? 'bg-[#121824] border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                      "{decodeHtmlEntities(currentJosephus.primarySourceText)}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. 지리학 & OpenBible GPS 패널 */}
          {currentGeoData && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('geo')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">🗺️</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    6. 성경 역사 지리학 및 고고학 유적 좌표 (OpenBible)
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.geo ? '▼' : '▶'}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${currentGeoData.lat},${currentGeoData.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded border flex items-center gap-1 transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  📍 구글 지도 위성 보기 ↗
                </a>
              </div>

              {openPanels.geo && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13.5px] font-bold ${textMain}`}>
                        {currentGeoData.placeKo} ({currentGeoData.placeEn})
                      </span>
                      <span className={`text-[11px] ${textSub}`}>| {currentGeoData.region}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${isDark ? 'bg-black/40 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200'}`}>
                      GPS: {currentGeoData.lat}, {currentGeoData.lng}
                    </span>
                  </div>
                  <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {decodeHtmlEntities(currentGeoData.historicalSignificance)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 7. 반즈 & JFB 학술 주석 패널 */}
          {currentCommentary && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('commentary')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">📖</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    7. 역사문법적 학술 강해 주석 ({currentCommentary.commentator})
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.commentary ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {decodeHtmlEntities(currentCommentary.title)}
                </span>
              </div>

              {openPanels.commentary && (
                <div className={`p-3.5 sm:p-4 rounded-xl border space-y-3 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <div className="space-y-1">
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${textSub}`}>
                      [원어 문법 및 문맥 주해 / Exegesis]
                    </span>
                    <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {decodeHtmlEntities(currentCommentary.exegesis)}
                    </p>
                  </div>
                  <div className={`space-y-1 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${textSub}`}>
                      [교리 및 구속사적 의미 / Theological Note]
                    </span>
                    <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {decodeHtmlEntities(currentCommentary.theologicalNote)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. 매튜 헨리 묵상 강해 패널 */}
          {currentMatthewHenry && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('matthewHenry')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">🌿</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    8. 매튜 헨리(Matthew Henry) 구속사적 묵상 강해
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.matthewHenry ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {decodeHtmlEntities(currentMatthewHenry.theme)}
                </span>
              </div>

              {openPanels.matthewHenry && (
                <div className={`p-3.5 sm:p-4 rounded-xl border space-y-3 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <div className="space-y-1">
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${textSub}`}>
                      [영혼의 묵상 강해 / Devotional Exegesis]
                    </span>
                    <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {decodeHtmlEntities(currentMatthewHenry.devotionalExegesis)}
                    </p>
                  </div>
                  <div className={`space-y-1 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${textSub}`}>
                      [삶의 실천과 순종 권면 / Practical Application]
                    </span>
                    <p className={`text-[12.5px] sm:text-[13px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {decodeHtmlEntities(currentMatthewHenry.practicalApplication)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. NET Bible 본문 비평 각주 패널 */}
          {currentNetNote && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('netNotes')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">🔍</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    9. NET Bible 사본/원문 비평 각주
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.netNotes ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  Textual Criticism
                </span>
              </div>

              {openPanels.netNotes && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <span className={`text-[11.5px] font-bold block ${textMain}`}>
                    📌 {decodeHtmlEntities(currentNetNote.title)}
                  </span>
                  <p className={`text-[12px] sm:text-[12.5px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {decodeHtmlEntities(currentNetNote.note)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 10. 이스톤 성경 백과사전 패널 */}
          {currentEaston && (
            <div className={`pt-3 border-t ${isDark ? 'border-[#20293A]' : 'border-slate-200'} space-y-2 animate-fade-in text-left`}>
              <div onClick={() => togglePanel('easton')} className="flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">📚</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-tight ${textMain}`}>
                    10. 이스톤(Easton's) 성경 백과사전 [{currentEaston.word}]
                  </span>
                  <span className="text-[10px] opacity-50">{openPanels.easton ? '▼' : '▶'}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  Biblical Encyclopedia
                </span>
              </div>

              {openPanels.easton && (
                <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200 shadow-2xs'}`}>
                  <p className={`text-[12px] sm:text-[12.5px] leading-relaxed break-keep font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {decodeHtmlEntities(currentEaston.definition)}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 단어별 1:1 분해 카드 그리드 */}
        {!isLoading && words.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className={`text-[12px] font-bold uppercase tracking-tight ${textMain}`}>
                단어별 1:1 분해 ({words.length}개 어절)
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">10-CORE SCHOLARLY SUITE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3" dir={isOT ? 'rtl' : 'ltr'}>
              {words.map((word) => {
                const isSelected = activeWordOrder === word.word_order;
                const hasCustom = !!word.userCustomNote;
                const displayInflected = cleanTypography(word.inflected, isOT, typographyMode);
                const displayLemma = cleanTypography(word.lemma, isOT, typographyMode);

                return (
                  <div 
                    key={word.id} 
                    onClick={() => handleSelectWord(word)}
                    className={`${bgSubCard} rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                      isSelected 
                        ? (isDark ? 'border-slate-400 ring-2 ring-slate-500/80 bg-[#1A2234]' : 'border-slate-900 ring-2 ring-slate-900 bg-slate-50')
                        : isDark ? 'border-[#20293A] hover:border-slate-600' : 'border-slate-200 hover:border-slate-400 hover:shadow-xs'
                    }`}
                  >
                    {/* 상단 원어 표제어 */}
                    <div className={`mb-1.5 ${isOT ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center ${isOT ? 'justify-between flex-row-reverse' : 'justify-between'} gap-1`}>
                        <span 
                          style={originalFontStyle}
                          className={`text-[21px] sm:text-[23px] font-bold ${textMain} block leading-snug`} 
                          dir={isOT ? 'rtl' : 'ltr'}
                        >
                          {displayInflected}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); speakOriginalAudio(word.inflected, isOT); }}
                          className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                          }`}
                          title="원어 발음 듣기"
                        >
                          <IconVolume />
                        </button>
                      </div>
                      
                      <span className={`text-[10.5px] font-medium font-mono tracking-wider block min-h-[14px] mt-0.5 ${textSub} ${isOT ? 'text-right' : 'text-left'}`} dir="ltr">
                        {word.pron}
                      </span>

                      {word.isInflectedDifferent ? (
                        <div className={`mt-1 flex items-center ${isOT ? 'justify-end' : 'justify-start'}`} dir="ltr">
                          <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border truncate ${
                            isDark ? 'bg-black/40 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 font-semibold'
                          }`}>
                            원형: <b style={originalFontStyle} className="text-[11px] text-slate-800 dark:text-slate-200">{displayLemma}</b>
                          </span>
                        </div>
                      ) : (
                        <div className="min-h-[16px] mt-1"></div>
                      )}
                    </div>
                    
                    <div className={`w-full h-px ${isDark ? 'bg-[#20293A]' : 'bg-slate-100'} mb-1.5`}></div>
                    
                    {/* 한글 번역어 및 Strongs 코드 */}
                    <div className="flex-1 flex flex-col mb-1.5 text-left" dir="ltr">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[13.5px] font-bold ${textMain} truncate block`}>
                          {word.korContextual}
                        </span>
                        <span className="text-[9.5px] font-mono font-semibold text-slate-400 shrink-0">
                          {word.strongs}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className={`text-[10px] ${textSub} truncate font-medium`}>
                          {word.isInflectedDifferent ? `(${word.korLemma})` : word.eng}
                        </span>
                        {hasCustom && (
                          <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 shrink-0">
                            ✍️연구자
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 형태론 문법 칩 */}
                    <div className="flex flex-col gap-1" dir="ltr">
                      <div className="flex flex-wrap gap-1">
                        {tokenizeGrammarCode(word.grammarRaw, isOT).map((tok, tIdx) => (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGrammarWikiKey(tok.key);
                            }}
                            className={`text-[9px] px-1.5 py-0.5 rounded border leading-tight font-semibold cursor-pointer transition-all hover:scale-105 flex items-center gap-0.5 ${getBadgeClass(word.grammarType, word.isVerb)}`}
                          >
                            <span>{tok.label}</span>
                            <span className="opacity-60 text-[8px]">📖</span>
                          </button>
                        ))}
                      </div>

                      {word.theologyInsight && (
                        <span className={`text-[9px] font-mono font-semibold truncate text-center rounded px-1 py-0.5 border ${
                          isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          ✨ {word.theologyInsight.stemTitle.split('—')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 나의 연구 서재 모달 */}
      {isLibraryOpen && (
        <div className="interlinear-modal-portal fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in select-none">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[85vh] ${
            isDark ? 'bg-[#0F141F] border-[#242E42] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 mb-3 border-slate-700/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <h3 className="font-bold text-sm">나의 원어 연구 서재 (독자 번역 & 강해 메모)</h3>
              </div>
              <button onClick={() => setIsLibraryOpen(false)} className="text-xs font-bold text-slate-400 hover:text-white p-1 cursor-pointer">✕ 닫기</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs hide-scrollbar">
              {Object.keys(customNotesMap).length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">아직 저장된 연구자 번역/주석 메모가 없습니다.<br/>단어를 누르고 4번째 탭 [✍️ 나의 연구 번역]에서 메모를 남겨보세요.</div>
              ) : (
                Object.values(customNotesMap).map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (item.book && item.chapter && item.verse) {
                        handleJumpToConcordanceVerse(item.book, item.chapter, item.verse);
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                      isDark ? 'bg-[#161D2B] border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100">{item.lemma} <span className="text-[10px] font-mono text-slate-400">({item.strongs})</span></span>
                      {item.book && <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-black/20 font-bold">{item.book} {item.chapter}:{item.verse} ➔</span>}
                    </div>
                    {item.translation && <p className="font-semibold text-slate-800 dark:text-slate-200">번역: "{decodeHtmlEntities(item.translation)}"</p>}
                    {item.memo && <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed break-keep">↳ {decodeHtmlEntities(item.memo)}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 단어 상세 모달 */}
      {selectedWordDetail && (
        <div className="interlinear-modal-portal fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
          <div className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#0F141F] border-[#242E42] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className={`border-b pb-3.5 shrink-0 space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10.5px] font-mono font-bold uppercase tracking-wider ${textSub}`}>
                  {selectedWordDetail.lexicon?.sourceName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakOriginalAudio(selectedWordDetail.inflected, isOT)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <IconVolume /> 낭독
                  </button>
                  <button onClick={() => setSelectedWordDetail(null)} className={`text-xs font-bold p-1 cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'
                  }`}>
                    닫기 ✕
                  </button>
                </div>
              </div>

              {/* 모달 상단 인포박스 */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800">
                <div className={`space-y-0.5 ${isOT ? 'text-right' : 'text-left'}`}>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">본문 출현형 (INFLECTED)</span>
                  <div className={`flex items-baseline ${isOT ? 'justify-end flex-row-reverse' : 'justify-start'} gap-2`}>
                    <span style={originalFontStyle} className="text-2xl font-bold text-slate-100">
                      {cleanTypography(selectedWordDetail.inflected, isOT, typographyMode)}
                    </span>
                    <span className="text-xs font-mono text-slate-300">{selectedWordDetail.pron}</span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    본문 번역: <span className="text-slate-300 underline underline-offset-2">{selectedWordDetail.korContextual}</span>
                  </p>
                </div>

                <div className={`space-y-0.5 border-l border-slate-700/60 pl-2.5 ${isOT ? 'text-right' : 'text-left'}`}>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">원형 표제어 (LEMMA)</span>
                  <div className={`flex items-baseline ${isOT ? 'justify-end flex-row-reverse' : 'justify-start'} gap-2`}>
                    <span style={originalFontStyle} className="text-2xl font-bold text-slate-100">
                      {cleanTypography(selectedWordDetail.lemma, isOT, typographyMode)}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 text-slate-200">
                      {selectedWordDetail.strongs}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    원형 기본뜻: <b className="text-slate-300">{selectedWordDetail.korLemma}</b>
                  </p>
                </div>
              </div>
            </div>

            <div className={`flex gap-1.5 overflow-x-auto hide-scrollbar p-1 rounded-xl border my-2.5 shrink-0 ${
              isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setModalTab('concordance')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'concordance' 
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-200 dark:text-slate-900' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 전권 용례 ({concordanceTotalCount}회)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('full_lexicon')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'full_lexicon' 
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-200 dark:text-slate-900' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏛️ BDB/Thayer 원전
              </button>
              <button
                type="button"
                onClick={() => setModalTab('korean')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'korean' 
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-200 dark:text-slate-900' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇰🇷 문법 & 구속사
              </button>
              <button
                type="button"
                onClick={() => setModalTab('custom_study')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  modalTab === 'custom_study' 
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-200 dark:text-slate-900' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✍️ 나의 연구 번역
              </button>
            </div>

            <div className="overflow-y-auto hide-scrollbar space-y-3 flex-1 text-xs">
              {modalTab === 'concordance' && (
                <div className="space-y-3 animate-fade-in">
                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-[13px] ${isDark ? 'text-white' : 'text-slate-900'}`}>📈 성경 66권 전체 출현 통계</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs">총 {concordanceTotalCount}회 등장</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className={`text-[10px] font-bold block ${textSub}`}>정경 분류별 출현 분포도</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {Object.entries(concordanceDistribution).map(([secName, count]) => {
                          const percent = Math.round((count / (concordanceTotalCount || 1)) * 100);
                          return (
                            <div key={secName} className={`p-2 rounded-lg border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{secName}</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{count}회</span>
                              </div>
                              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                <div className="bg-slate-700 dark:bg-slate-300 h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block pl-0.5 ${textSub}`}>구절 터치 시 즉시 본문 이동</span>
                    {isConcordanceLoading ? (
                      <div className="py-8 text-center text-slate-400 font-medium text-xs">성경 66권에서 용례 인출 중...</div>
                    ) : concordanceList.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">검색된 용례가 없습니다.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {concordanceList.map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleJumpToConcordanceVerse(item.book, item.chapter, item.verse)}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group shadow-2xs ${
                              isDark ? 'border-slate-800 bg-[#161D2B] hover:bg-slate-800/80 hover:border-slate-600' : 'border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[80px]">{item.book} {item.chapter}:{item.verse}</span>
                              <span style={originalFontStyle} className={`font-bold text-[16px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {cleanTypography(item.original_word, isOT, typographyMode)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`truncate max-w-[140px] text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.korean_trans}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">이동 ➔</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'full_lexicon' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">UNABRIDGED ACADEMIC TEXT</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLexiconRaw(selectedWordDetail.lexicon?.rawFull)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      📋 원문 복사
                    </button>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-slate-500 font-bold block text-[10.5px] uppercase">[ETYMOLOGY & DERIVATION / 어원 및 파생]</span>
                    <p className={`font-mono text-[12px] leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.etymology)}</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-slate-500 font-bold block text-[10.5px] uppercase">[SEMANTIC DEFINITION / 원어 본래 정의]</span>
                    <p className={`font-mono text-[12px] leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.meaning)}</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-slate-500 font-bold block text-[10.5px] uppercase">[BIBLICAL TRANSLATION OCCURRENCES / 전 성경 번역 분포]</span>
                    <p className={`font-mono text-[11.5px] leading-relaxed font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.usage)}</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <span className={`font-bold block text-[9.5px] ${textSub}`}>[COMPLETE VERBATIM TEXT (전문)]</span>
                    <pre className={`whitespace-pre-wrap font-mono text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.rawFull)}</pre>
                  </div>
                </div>
              )}

              {modalTab === 'korean' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-bold block mb-0.5 text-[10px] ${textSub}`}>정밀 형태론 (문법 분석)</span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-[13.5px]">{selectedWordDetail.grammarDecoded}</span>
                      {tokenizeGrammarCode(selectedWordDetail.grammarRaw, isOT).map((tok, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => setSelectedGrammarWikiKey(tok.key)}
                          className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                        >
                          {tok.label} 📖
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedWordDetail.theologyInsight && (
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
                    }`}>
                      <div className={`flex items-center gap-1.5 border-b pb-1.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className="font-bold text-[12.5px] text-slate-900 dark:text-slate-100">📜 {selectedWordDetail.theologyInsight.stemTitle}</span>
                      </div>
                      <p className={`text-[12px] leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedWordDetail.theologyInsight.stemDesc}</p>
                      {selectedWordDetail.theologyInsight.aspectDesc && (
                        <p className={`text-[11.5px] pt-1 border-t border-dashed font-semibold ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                          ↳ {selectedWordDetail.theologyInsight.aspectDesc}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedWordDetail.note && (
                    <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'}`}>
                      <span className="font-bold block text-[11.5px] text-slate-900 dark:text-slate-100">📖 신학적 주석 및 구속사적 의미</span>
                      <p className={`text-[12px] leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.note)}</p>
                    </div>
                  )}

                  <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#161D2B] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className={`font-bold block text-[10px] ${textSub}`}>[어원]</span>
                      <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.etymology)}</p>
                    </div>
                    <div>
                      <span className={`font-bold block text-[10px] ${textSub}`}>[원어 의미]</span>
                      <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{decodeHtmlEntities(selectedWordDetail.lexicon?.meaning)}</p>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'custom_study' && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'}`}>
                    <span className="font-bold text-[11.5px] block mb-0.5 text-slate-900 dark:text-slate-100">✍️ 연구자 독자 번역 및 주석 메모장</span>
                    <p className={`text-[11px] leading-relaxed ${textSub}`}>
                      나만의 한국어 번역어와 신학 주석을 저장하세요. 단어 카드와 설교노트에 즉시 반영됩니다.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      나의 대표 한글 번역어 (단어 카드에 즉시 반영)
                    </label>
                    <input
                      type="text"
                      value={customInputTrans}
                      onChange={(e) => setCustomInputTrans(e.target.value)}
                      placeholder={`예: ${selectedWordDetail.korContextual}`}
                      className={`w-full px-3 py-2 rounded-xl text-[13px] font-bold border outline-none transition-all ${
                        isDark ? 'border-slate-700 bg-black/60 text-white focus:border-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      심층 신학 연구 메모 (QT / 설교노트에 함께 삽입)
                    </label>
                    <textarea
                      value={customInputMemo}
                      onChange={(e) => setCustomInputMemo(e.target.value)}
                      rows={3}
                      placeholder="원문 대조 결과 메모 입력..."
                      className={`w-full p-2.5 rounded-xl text-[12px] font-medium border outline-none resize-none leading-relaxed transition-all ${
                        isDark ? 'border-slate-700 bg-black/60 text-white focus:border-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500 shadow-2xs'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCustomLexiconNote}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12px] shadow-sm transition-all cursor-pointer"
                  >
                    💾 연구자 번역/주석 영구 저장
                  </button>
                </div>
              )}
            </div>

            <div className={`flex gap-2 pt-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => handleInsertToQT(selectedWordDetail)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🌿</span> QT 묵상에 삽입
              </button>
              <button
                type="button"
                onClick={() => handleInsertToSermon(selectedWordDetail)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconBook /> 설교노트에 삽입
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 로고스급 성경 66권 원어 문법 대백과 모달 */}
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
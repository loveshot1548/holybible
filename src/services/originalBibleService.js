// src/services/originalBibleService.js
import { supabase } from '../lib/supabase';

let strongsCache = null;

// 1. strongs_korean.json 메모리 캐싱 로더
export async function loadStrongsKorean() {
  if (strongsCache) return strongsCache;
  try {
    const res = await fetch('/data/strongs_korean.json');
    if (res.ok) {
      strongsCache = await res.json();
      return strongsCache;
    }
  } catch (e) {
    console.warn("strongs_korean.json 로드 실패, fallback 모드로 전환");
  }
  strongsCache = {};
  return strongsCache;
}

// 2. 단어 품사 형태론 정밀 번역
export function parseMorphology(code) {
  if (!code) return { label: '일반 어휘', type: 'other' };
  const c = code.trim();

  // 신약 헬라어 (로빈슨)
  if (c.includes('-')) {
    const [pos, details = ''] = c.split('-');
    if (pos === 'V') {
      const tense = { P:'현재', I:'미완료', F:'미래', A:'부정과거', R:'완료' }[details[0]] || '';
      const voice = { A:'능동태', M:'중간태', P:'수동태', D:'디포넌트' }[details[1]] || '';
      const mood = { I:'직설법', S:'접속법', M:'명령법', N:'부정사', P:'분사' }[details[2]] || '';
      const person = details[3] ? `${details[3]}인칭` : '';
      const num = details[4] === 'S' ? '단수' : details[4] === 'P' ? '복수' : '';
      return { label: `동사 · ${tense} ${voice} ${mood} ${person} ${num}`.replace(/\s+/g, ' ').trim(), type: 'verb' };
    }
    if (['N', 'A', 'T', 'P', 'R', 'D'].includes(pos)) {
      const posMap = { N:'명사', A:'형용사', T:'관사', P:'인칭대명사', R:'관계대명사', D:'지시대명사' };
      const caseMap = { N:'주격 (~이/가)', G:'소유격 (~의)', D:'여격 (~에게/에)', A:'대격 (~을/를)', V:'호격' };
      const genderMap = { M:'남성', F:'여성', N:'중성' };
      const numMap = { S:'단수', P:'복수' };
      return { 
        label: `${posMap[pos]} · ${caseMap[details[0]] || ''} · ${genderMap[details[2]] || ''} ${numMap[details[1]] || ''}`.replace(/\s+/g, ' ').trim(), 
        type: pos === 'N' ? 'noun' : 'modifier' 
      };
    }
    if (pos === 'CONJ') return { label: '접속사', type: 'particle' };
    if (pos === 'PREP') return { label: '전치사', type: 'particle' };
  }

  // 구약 히브리어 (ETCBC)
  if (c.includes('.')) {
    const parts = c.split('.');
    if (parts[0] === 'verb') {
      const stemMap = { qal:'칼(기본)', nif:'니팔', piel:'피엘', hif:'히필', hit:'히트파엘' };
      const aspectMap = { perf:'완료', impf:'미완료', wayq:'바이크톨(연속과거)', infc:'부정사', ptca:'분사' };
      return { label: `동사 · ${stemMap[parts[1]] || parts[1]} ${aspectMap[parts[2]] || parts[2]}`, type: 'verb' };
    }
    if (parts[0] === 'subs' || parts[0] === 'nmpr') {
      const g = parts[1] === 'm' ? '남성' : parts[1] === 'f' ? '여성' : '공성';
      const n = parts[2] === 'sg' ? '단수' : parts[2] === 'pl' ? '복수' : '';
      return { label: `${parts[0] === 'nmpr' ? '고유명사' : '명사'} · ${g} ${n}`.trim(), type: 'noun' };
    }
    if (parts[0] === 'prep') return { label: '전치사', type: 'particle' };
    if (parts[0] === 'conj') return { label: '접속사', type: 'particle' };
  }

  return { label: c, type: 'other' };
}

// 3. 특정 장/절의 완전한 원어 인터리니어 데이터셋 조립
export async function getVerseInterlinearData(bookKoName, chapter, verse, isOT = false) {
  const dict = await loadStrongsKorean();

  let wordsData = [];
  if (supabase) {
    const { data } = await supabase
      .from('interlinear_bible')
      .select('*')
      .eq('book', bookKoName)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .order('word_order', { ascending: true });
    if (data) wordsData = data;
  }

  return wordsData.map(w => {
    const sId = (w.strongs_id || '').trim();
    const entry = dict[sId] || {};
    const morph = parseMorphology(w.grammar);

    // 한글 의미 우선순위: strongs_korean.json -> DB dictionary -> gloss
    let finalKor = entry.meaning || entry.korean || '';
    if (!finalKor && w.korean_trans && /[가-힣]/.test(w.korean_trans)) {
      finalKor = w.korean_trans;
    }
    if (!finalKor) {
      finalKor = w.gloss || '원어 어휘';
    }

    return {
      id: w.id || w.word_order,
      order: w.word_order,
      original: w.original_word || '',
      pron: entry.pronunciation || (w.pronunciation ? `[${w.pronunciation.replace(/[\[\]]/g, '')}]` : ''),
      kor: finalKor,
      eng: (w.gloss || w.korean_trans || '').replace(/[[\]]/g, '').toLowerCase(),
      strongs: sId || (isOT ? 'H0000' : 'G0000'),
      morphLabel: morph.label,
      morphType: morph.type,
      etymology: entry.derivation || entry.etymology || '',
      explanation: entry.explanation || entry.description || w.dictionary_info || ''
    };
  });
}
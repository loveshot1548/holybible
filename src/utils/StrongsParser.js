// src/utils/StrongsParser.js
/**
 * [성경 66권 통합 원어 해석 & 형태론 & 발음 엔진]
 * 1. 스트롱 사전 description 텍스트 해체 및 한글 의미 추출
 * 2. 헬라어/히브리어 자모 규칙 기반 한글 발음 자동 생성기
 * 3. 신구약 정밀 문법(로빈슨 & ETCBC) 디코더
 * 4. 스트롱 코드 기반 성경 전체 성구 상호참조(Concordance) 역추적기
 * 5. 웹 음성 합성(TTS) 원어 낭독 엔진
 */

// =====================================================================
// 1. 주요 빈출 원어 한글 발음 및 핵심 의미 큐레이션 사전
// =====================================================================
const KNOWN_WORDS = {
  // --- 구약 히브리어 대표 어휘 ---
  'H430': { pron: '엘로힘', kor: '하나님, 전능자' },
  'H3068': { pron: '야훼 (여호와)', kor: '스스로 계신 자, 언약의 주' },
  'H7225': { pron: '베레쉬트', kor: '태초에, 시작' },
  'H1254': { pron: '바라', kor: '창조하다 (무에서 유로)' },
  'H8064': { pron: '샤마임', kor: '하늘, 천국' },
  'H776': { pron: '에레츠', kor: '땅, 세상' },
  'H216': { pron: '오르', kor: '빛, 광명' },
  'H2822': { pron: '호셰크', kor: '어둠, 흑암' },
  'H4325': { pron: '마임', kor: '물, 바다' },
  'H7307': { pron: '루아흐', kor: '영, 성령, 바람, 호흡' },
  'H120': { pron: '아담', kor: '사람, 흙으로 빚은 자' },
  'H2416': { pron: '하임 / 하야', kor: '생명, 살아있는' },
  'H7965': { pron: '샬롬', kor: '평강, 온전한 평안' },
  'H2617': { pron: '헤세드', kor: '인애, 언약적 사랑, 긍휼' },
  'H571': { pron: '에메트', kor: '진리, 신실함' },
  'H1285': { pron: '베리트', kor: '언약, 계약' },
  'H8451': { pron: '토라', kor: '율법, 하나님의 가르침' },
  'H6944': { pron: '코데쉬', kor: '거룩함, 구별됨' },
  'H9003': { pron: '베', kor: '~안에, ~에서 (전치사)' },
  'H9000': { pron: '베 / 바', kor: '그리고, 또한 (접속사)' },
  'H9009': { pron: '하', kor: '그 (정관사)' },
  'H853': { pron: '에트', kor: '~을/를 (목적격 표지어)' },

  // --- 신약 헬라어 대표 어휘 ---
  'G2424': { pron: '이에수스', kor: '예수 (구원자)' },
  'G5547': { pron: '크리스토스', kor: '그리스도 (기름 부음 받은 자)' },
  'G2316': { pron: '테오스', kor: '하나님' },
  'G2962': { pron: '퀴리오스', kor: '주, 주인' },
  'G3056': { pron: '로고스', kor: '말씀, 도, 신적 계시' },
  'G4151': { pron: '프뉴마', kor: '성령, 영, 바람' },
  'G40': { pron: '하기오스', kor: '거룩한, 성도' },
  'G26': { pron: '아가페', kor: '무조건적인 신적 사랑' },
  'G4102': { pron: '피스티스', kor: '믿음, 신실함' },
  'G5485': { pron: '카리스', kor: '은혜, 값없는 선물' },
  'G1515': { pron: '에이레네', kor: '평강, 화평' },
  'G1680': { pron: '엘피스', kor: '소망, 확신' },
  'G932': { pron: '바실레이아', kor: '하나님 나라, 통치' },
  'G2222': { pron: '조에', kor: '영원한 생명' },
  'G4074': { pron: '페트로스', kor: '베드로 (반석)' },
  'G652': { pron: '아포스톨로스', kor: '사도 (보내심을 받은 자)' },
  'G5207': { pron: '휘오스', kor: '아들' },
  'G3962': { pron: '파테르', kor: '아버지' },
  'G2532': { pron: '카이', kor: '그리고, 또한 (접속사)' },
  'G3588': { pron: '호 / 토 / 톤', kor: '그 (정관사)' },
  'G1161': { pron: '데', kor: '그러나, 그리고' }
};

// =====================================================================
// 2. 헬라어 / 히브리어 자모 규칙 기반 한글 발음(음역) 변환기
// =====================================================================
const GREEK_CHAR_MAP = {
  'α': '아', 'β': '베', 'γ': '그', 'δ': '드', 'ε': '에', 'ζ': '즈',
  'η': '에', 'θ': '테', 'ι': '이', 'κ': '크', 'λ': '르', 'μ': '므',
  'ν': '느', 'ξ': '크스', 'ο': '오', 'π': '프', 'ρ': '르', 'σ': '스',
  'ς': '스', 'τ': '트', 'υ': '위', 'φ': '피', 'χ': '키', 'ψ': '프스', 'ω': '오'
};

const HEBREW_CHAR_MAP = {
  'א': '아', 'ב': '베', 'ג': '게', 'ד': '데', 'ה': '헤', 'ו': '바',
  'ז': '제', 'ח': '헤', 'ט': '테', 'י': '이', 'כ': '카', 'ך': '크',
  'ל': '라', 'מ': '메', 'ם': '엠', 'נ': '네', 'ן': '은', 'ס': '사',
  'ע': '아', 'פ': '페', 'ף': '프', 'צ': '차', 'ץ': '츠', 'ק': '코',
  'ר': '레', 'ש': '샤', 'ת': '타'
};

export const generatePhoneticKorean = (word, strongsId, isOT) => {
  if (strongsId && KNOWN_WORDS[strongsId]?.pron) {
    return KNOWN_WORDS[strongsId].pron;
  }
  if (!word || typeof word !== 'string') return '';

  // 악센트 부호, 숨표, 니쿠드 제거
  const clean = word.normalize('NFD').replace(/[\u0300-\u036f\u0590-\u05cf]/g, '').trim();

  let result = '';
  const map = isOT ? HEBREW_CHAR_MAP : GREEK_CHAR_MAP;

  for (let char of clean.toLowerCase()) {
    if (map[char]) {
      result += map[char];
    }
  }

  // 발음 부드럽게 압축
  return result ? `[${result.replace(/(.)\1+/g, '$1').slice(0, 5)}]` : '';
};

// =====================================================================
// 3. 스트롱 사전 description 텍스트 정밀 해체기
// =====================================================================
export const parseStrongsDescription = (desc, strongsId, rawGloss) => {
  if (strongsId && KNOWN_WORDS[strongsId]?.kor) {
    return {
      meaning: KNOWN_WORDS[strongsId].kor,
      etymology: desc ? desc.slice(0, 150) : '어원 정보',
      fullText: desc || ''
    };
  }

  if (!desc || typeof desc !== 'string') {
    return {
      meaning: rawGloss || '원어 단어',
      etymology: '등록된 어원 정보가 없습니다.',
      fullText: ''
    };
  }

  let meaning = '';
  let etymology = '';

  // [원어 의미] 정규식 추출
  const meaningMatch = desc.match(/\[원어 의미\]\s*([^;,\n\[\]]+)/);
  if (meaningMatch && meaningMatch[1]) {
    meaning = meaningMatch[1].trim();
  }

  // [어원 및 파생] 정규식 추출
  const etymMatch = desc.match(/\[어원 및 파생\]\s*([^\[\]]+)/);
  if (etymMatch && etymMatch[1]) {
    etymology = etymMatch[1].trim();
  }

  // fallback 한글화
  if (!meaning || meaning.length < 2) {
    meaning = rawGloss || '성경 고유어';
  }

  return {
    meaning: meaning.replace(/[<>"]/g, ''),
    etymology: etymology || desc.slice(0, 120),
    fullText: desc
  };
};

// =====================================================================
// 4. 형태론 문법(Morphology) 디코더
// =====================================================================
export const decodeMorphology = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return { label: '일반 어휘', type: 'other' };
  const code = rawCode.trim();

  // 신약 로빈슨 코드 (V-AAI-3S, N-NSM, CONJ 등)
  if (code.includes('-') || ['CONJ', 'PREP', 'ADV', 'PRT', 'INJ', 'HEB', 'ARAM'].includes(code)) {
    if (code === 'CONJ') return { label: '[접속사] 문장 연결사', type: 'particle' };
    if (code === 'PREP') return { label: '[전치사]', type: 'particle' };
    if (code === 'ADV') return { label: '[부사]', type: 'particle' };
    if (code === 'PRT' || code === 'PRT-N') return { label: '[불변화사/부정어]', type: 'particle' };

    const parts = code.split('-');
    const pos = parts[0];
    const details = parts[1] || '';

    if (pos === 'V') {
      const tenseMap = { 'P': '현재', 'I': '미완료', 'F': '미래', 'A': '부정과거', 'R': '완료', 'L': '과거완료', '2A': '제2부정과거' };
      const voiceMap = { 'A': '능동태', 'M': '중간태', 'P': '수동태', 'E': '중간/수동태', 'D': '디포넌트' };
      const moodMap = { 'I': '직설법', 'S': '접속법', 'O': '희구법', 'M': '명령법', 'N': '부정사', 'P': '분사' };

      const tense = tenseMap[details[0]] || '';
      const voice = voiceMap[details[1]] || '';
      const mood = moodMap[details[2]] || '';
      const person = details[3] ? `${details[3]}인칭` : '';
      const number = details[4] === 'S' ? '단수' : details[4] === 'P' ? '복수' : '';

      return { label: `[동사] ${tense} ${voice} ${mood} ${person} ${number}`.replace(/\s+/g, ' ').trim(), type: 'verb' };
    }

    if (['N', 'A', 'T', 'P', 'R', 'D'].includes(pos)) {
      const posName = pos === 'N' ? '명사' : pos === 'A' ? '형용사' : pos === 'T' ? '관사' : pos === 'P' ? '인칭대명사' : pos === 'R' ? '관계대명사' : '지시대명사';
      const caseMap = { 'N': '주격', 'G': '소유격', 'D': '여격', 'A': '대격', 'V': '호격' };
      const genderMap = { 'M': '남성', 'F': '여성', 'N': '중성' };
      const numberMap = { 'S': '단수', 'P': '복수' };

      const c = caseMap[details[0]] || '';
      const n = numberMap[details[1]] || '';
      const g = genderMap[details[2]] || '';

      return { label: `[${posName}] ${g} ${c} ${n}`.replace(/\s+/g, ' ').trim(), type: pos === 'N' ? 'noun' : 'modifier' };
    }
  }

  // 구약 ETCBC/WIVU 코드 (verb.qal.wayq.p3.m.sg, subs.m.pl.a 등)
  if (code.includes('.')) {
    const parts = code.split('.');
    const mainType = parts[0];

    if (mainType === 'verb') {
      const stemMap = { 'qal': '칼(기본능동)', 'nif': '니팔(수동/재귀)', 'piel': '피엘(강의능동)', 'pual': '푸알(강의수동)', 'hif': '히필(사역능동)', 'hof': '호팔(사역수동)', 'hit': '히트파엘(재귀)' };
      const aspectMap = { 'perf': '완료', 'impf': '미완료', 'wayq': '바이크톨(연속완료)', 'impv': '명령', 'infa': '부정사', 'infc': '연계형부정사', 'ptca': '능동분사', 'ptcp': '수동분사' };
      
      const stem = stemMap[parts[1]] || parts[1];
      const aspect = aspectMap[parts[2]] || parts[2];
      return { label: `[동사] ${stem} ${aspect}`.trim(), type: 'verb' };
    }

    if (mainType === 'subs' || mainType === 'nmpr') {
      const gender = parts[1] === 'm' ? '남성' : parts[1] === 'f' ? '여성' : '공성';
      const number = parts[2] === 'sg' ? '단수' : parts[2] === 'pl' ? '복수' : '쌍수';
      const state = parts[3] === 'a' ? '절대형' : parts[3] === 'c' ? '연계형' : '';
      return { label: `[${mainType === 'nmpr' ? '고유명사' : '명사'}] ${gender} ${number} ${state}`.trim(), type: 'noun' };
    }

    if (mainType === 'prep') return { label: '[전치사]', type: 'particle' };
    if (mainType === 'conj') return { label: '[접속사]', type: 'particle' };
    if (mainType === 'art') return { label: '[정관사]', type: 'particle' };
  }

  return { label: code, type: 'other' };
};

// =====================================================================
// 5. 성구 상호참조(Concordance) 역조회 쿼리 헬퍼
// =====================================================================
export const fetchStrongsConcordance = async (supabaseClient, strongsId, limit = 5) => {
  if (!supabaseClient || !strongsId || strongsId === 'G0000' || strongsId === 'H0000') {
    return [];
  }
  try {
    const { data, error } = await supabaseClient
      .from('interlinear_bible')
      .select('book, chapter, verse, original_word, korean_trans')
      .eq('strongs_id', strongsId)
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (_) {
    return [];
  }
};

// =====================================================================
// 6. 원어 음성 합성(TTS) 낭독 헬퍼
// =====================================================================
export const speakOriginalWord = (text, isOT) => {
  if (!('speechSynthesis' in window)) {
    alert("현재 브라우저는 음성 낭독을 지원하지 않습니다.");
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = isOT ? 'he-IL' : 'el-GR';
  utterance.rate = 0.85;

  // 모바일 OS 음성 미지원 시 에러 핸들링
  utterance.onerror = () => {
    console.warn("Native Greek/Hebrew voice engine missing on this device.");
  };

  window.speechSynthesis.speak(utterance);
};
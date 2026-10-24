// src/lib/hebrewSyntaxEngine.js

// 27대 마소라 억양 악센트(Ṭe'amim) 유니코드 매핑
const ACCENTS = {
  // 제1급: 대휴지 (Emperors) - 절/대주제 분할
  ATNACH: '\u0591',      // ֑ (아트나흐: 전반부 대휴지)
  SILLUQ: '\u05BD',      // ֽ (실룩: 절 종결 대휴지)

  // 제2급: 주분리 (Kings) - 절 내 핵심 통사구 분할
  SEGOLTA: '\u0592',     // ֒ (세골타)
  ZAQEF_QATON: '\u0594', // ֔ (자케프 카톤)
  ZAQEF_GADOL: '\u0595', // ֕ (자케프 가돌)
  TIFCHA: '\u0596',      // ֖ (팁하: 대휴지 직전 분리)

  // 제3급: 차분리 (Dukes) - 세부 부사구/수식구 한정
  REVIA: '\u0597',       // ֗ (레비아)
  PASHTA: '\u0599',      // ֤ (파쉬타)
  YETIV: '\u059A',       // ֚ (예티브)
  TEVIR: '\u059B',       // ֛ (테비르)
  ZARQA: '\u0598',       // ֘ (자르카)

  // 제4급: 소분리 (Counts)
  GERESH: '\u059C',      // ֜ (게레쉬)
  GARSHAYIM: '\u059E',   // ֞ (가르샤임)
  PAZER: '\u05A1',       // ֡ (파제르)
  TELISHA_G: '\u05A0'    // ֠ (텔리샤 그돌라)
};

function getWordAccent(text) {
  if (!text) return { level: 5, name: '연결 사슬', type: '종속 결합' };
  if (text.includes(ACCENTS.ATNACH)) return { level: 1, name: '아트나흐 (Atnach)', type: '전반부 대휴지 (A부 종결)' };
  if (text.includes(ACCENTS.SILLUQ)) return { level: 1, name: '실룩 (Silluq)', type: '절 종결 대휴지 (B부 종결)' };
  if (text.includes(ACCENTS.TIFCHA)) return { level: 2, name: '팁하 (Tifcha)', type: '대휴지 선행 서술 마디 분할' };
  if (text.includes(ACCENTS.ZAQEF_QATON) || text.includes(ACCENTS.ZAQEF_GADOL)) return { level: 2, name: '자케프 (Zaqef)', type: '핵심 주어/목적어구 분할' };
  if (text.includes(ACCENTS.SEGOLTA)) return { level: 2, name: '세골타 (Segolta)', type: '전반부 주분리' };
  if (text.includes(ACCENTS.REVIA)) return { level: 3, name: '레비아 (Revia)', type: '수식 부사구 한정' };
  if (text.includes(ACCENTS.PASHTA) || text.includes(ACCENTS.YETIV)) return { level: 3, name: '파쉬타/예티브', type: '어구 분리' };
  if (text.includes(ACCENTS.TEVIR)) return { level: 3, name: '테비르 (Tevir)', type: '보조 분리' };
  return { level: 5, name: '연결부호(Sharath)', type: '단어 결합 사슬' };
}

export function analyzeHebrewSyntaxFromWords(words) {
  if (!words || !Array.isArray(words) || words.length === 0) return null;

  const clauseHierarchy = [];
  let currentUnitWords = [];
  let atnachFoundIndex = -1;

  words.forEach((w, idx) => {
    const rawWord = w.inflected || w.original_word || '';
    currentUnitWords.push(rawWord);
    const accent = getWordAccent(rawWord);

    if (rawWord.includes(ACCENTS.ATNACH)) {
      atnachFoundIndex = idx;
    }

    // Level 1 또는 2 분리 악센트에서 하나의 구문 마디로 분할
    if (accent.level <= 2 || idx === words.length - 1) {
      const partPrefix = atnachFoundIndex === -1 ? '[A부 선행절]' : (idx <= atnachFoundIndex ? '[A부 선행절]' : '[B부 귀결절]');
      clauseHierarchy.push({
        unit: currentUnitWords.join(' '),
        pauseType: accent.name,
        role: `${partPrefix} ${accent.type} (제${idx + 1}어절 매듭)`
      });
      currentUnitWords = [];
    }
  });

  const cantillationExegesis = atnachFoundIndex !== -1
    ? `본 절은 마소라 악센트 체계에 따라 제${atnachFoundIndex + 1}어절의 아트나흐(Atnach, ֑) 대휴지에서 전반부와 후반부로 엄격히 양분됩니다. 전반부(A부)는 주권적 사건의 신적 기원을 확정하며, 후반부(B부)는 그에 따른 역사적 실행과 대상을 한정합니다.`
    : `본 절은 단일 대휴지(Silluq, ֽ) 완결 구문으로, 서술의 지체 없이 사건 전체를 하나의 완결된 역사적 사실로 압축 선포합니다.`;

  return {
    clauseHierarchy,
    cantillationExegesis
  };
}
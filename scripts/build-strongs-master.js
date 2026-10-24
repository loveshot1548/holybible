// scripts/build-strongs-master.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://fenzodpldsxdttzgztcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-';

const targetDir = path.join(__dirname, '../public/data');
const targetFile = path.join(targetDir, 'strongs_korean_master.json');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// =====================================================================
// 🏛️ [성경 66권 공인 핵심 렉시콘 마스터 (노이즈 방지 기준점)]
// =====================================================================
const CANONICAL_MASTER_MAP = {
  // --- 구약 핵심 표제어 및 특수 접두사 ---
  'H9000': { k: '그리고, 또한', p: '베/바', e: 'and, also', n: '연속 접속사' },
  'H9009': { k: '그 (정관사)', p: '하', e: 'the', n: '지정 정관사' },
  'H9003': { k: '~안에, ~에서', p: '베', e: 'in, with', n: '장소/수단 전치사' },
  'H9005': { k: '~에게, 위하여', p: '레', e: 'to, for', n: '방향/목적 전치사' },
  'H9002': { k: '~처럼, 같이', p: '케', e: 'as, like', n: '비교 전치사' },
  'H9008': { k: '~로부터, ~보다', p: '메/민', e: 'from, out of', n: '분리 전치사' },
  'H853':  { k: '(목적격: ~을/를)', p: '에트', e: 'direct object marker', n: '목적격 표지어' },
  'H854':  { k: '~와 함께', p: '에트', e: 'with', n: '동반 전치사' },
  'H7225': { k: '태초에, 시작', p: '레쉬트', e: 'beginning, chief', n: '창조의 시초' },
  'H1254': { k: '창조하다', p: '바라', e: 'create', n: '하나님의 무(無)에서의 창조' },
  'H430':  { k: '하나님', p: '엘로힘', e: 'God', n: '창조주 전능자 (장엄 복수형)' },
  'H8064': { k: '하늘', p: '샤마임', e: 'heavens, sky', n: '천체와 하나님의 보좌' },
  'H776':  { k: '땅, 세상', p: '에레츠', e: 'earth, land', n: '피조 세계' },
  'H1961': { k: '되다, 있다', p: '하야', e: 'be, become', n: '존재의 발생' },
  'H8414': { k: '혼돈', p: '토후', e: 'formless, confusion', n: '형태가 없는 황폐함' },
  'H922':  { k: '공허', p: '보후', e: 'emptiness, void', n: '비어 있는 상태' },
  'H2822': { k: '흑암, 어둠', p: '호셰크', e: 'darkness', n: '원초적 어둠' },
  'H5921': { k: '~위에', p: '알', e: 'upon, above', n: '표면 전치사' },
  'H6440': { k: '얼굴, 표면', p: '파님', e: 'face, surface', n: '앞면과 수면' },
  'H8415': { k: '깊음, 심연', p: '테홈', e: 'abyss, deep', n: '태고의 바다' },
  'H7307': { k: '영(神), 호흡', p: '루아흐', e: 'spirit, wind', n: '하나님의 성령' },
  'H7363': { k: '운행하다, 품다', p: '라하프', e: 'hover, move', n: '품어 보호하심' },
  'H4325': { k: '물', p: '마임', e: 'water', n: '원초적 생명수' },
  'H559':  { k: '말씀하다, 이르다', p: '아마르', e: 'say, speak', n: '창조의 명령' },
  'H216':  { k: '빛', p: '오르', e: 'light', n: '최초의 창조물' },
  'H428':  { k: '이들 (이러하니)', p: '엘레', e: 'these', n: '지시대명사' },
  'H8034': { k: '이름, 명성', p: '쉠', e: 'name', n: '존재의 본질' },
  'H1121': { k: '아들, 자손', p: '벤', e: 'son', n: '계승자' },
  'H3478': { k: '이스라엘', p: '이스라엘', e: 'Israel', n: '하나님과 겨루어 이긴 자' },
  'H935':  { k: '오다, 들어가다', p: '보', e: 'come, enter', n: '도착과 이동' },
  'H4714': { k: '애굽 (이집트)', p: '미츠라임', e: 'Egypt', n: '세상 권세의 땅' },
  'H3290': { k: '야곱', p: '야아코브', e: 'Jacob', n: '언약의 족장' },
  'H376':  { k: '사람, 각 사람', p: '이쉬', e: 'man, each', n: '개인' },
  'H1004': { k: '집, 권속', p: '바이트', e: 'house', n: '가문' },
  'H3068': { k: '여호와', p: '야훼', e: 'YHWH, the LORD', n: '스스로 계신 언약의 하나님' },
  'H4872': { k: '모세', p: '모셰', e: 'Moses', n: '물에서 건져낸 자' },
  'H168':  { k: '회막, 장막', p: '오헬', e: 'tent, tabernacle', n: '거룩한 성막' },
  'H4150': { k: '정한 절기, 회막', p: '모에드', e: 'appointed time', n: '정하신 만남' },

  // --- 신약 핵심 표제어 ---
  'G3972': { k: '바울', p: '파울로스', e: 'Paul', n: '작은 자, 이방인의 사도' },
  'G1198': { k: '갇힌 자 (죄수)', p: '데스미오스', e: 'prisoner', n: '복음을 위해 결박당한 자' },
  'G5547': { k: '그리스도', p: '크리스토스', e: 'Christ', n: '기름 부음 받은 자 (메시아)' },
  'G2424': { k: '예수', p: '이에수스', e: 'Jesus', n: '자기 백성을 구원할 자' },
  'G2532': { k: '그리고, 또한', p: '카이', e: 'and, also', n: '접속사' },
  'G5095': { k: '디모데', p: '티모테오스', e: 'Timothy', n: '하나님을 공경하는 자' },
  'G3588': { k: '그 (정관사)', p: '호/투/토', e: 'the', n: '정관사' },
  'G80':   { k: '형제', p: '아델포스', e: 'brother', n: '영적 가족' },
  'G5371': { k: '빌레몬', p: '필레몬', e: 'Philemon', n: '사랑을 베푸는 자' },
  'G27':   { k: '사랑받는 자', p: '아가페토스', e: 'beloved', n: '존귀한 성도' },
  'G4904': { k: '동역자', p: '쉬네르고스', e: 'fellow worker', n: '함께 일하는 자' },
  'G1473': { k: '우리, 우리의', p: '헤몬', e: 'we, our', n: '1인칭 복수 대명사' },
  'G2385': { k: '야고보', p: '이아코보스', e: 'James', n: '주의 형제' },
  'G2316': { k: '하나님', p: '테오스', e: 'God', n: '유일하신 참 하나님' },
  'G2962': { k: '주 (주님)', p: '퀴리오스', e: 'Lord', n: '최고 권세자, 주인' },
  'G1401': { k: '종 (청지기)', p: '둘로스', e: 'servant, bondman', n: '그리스도께 속한 종' },
  'G1427': { k: '열두 (12)', p: '도데카', e: 'twelve', n: '언약의 완전수' },
  'G5443': { k: '지파', p: '필레', e: 'tribe', n: '이스라엘 12지파' },
  'G1290': { k: '디아스포라 (흩어진 자)', p: '디아스포라', e: 'dispersion', n: '세상에 흩어진 나그네' },
  'G5463': { k: '문안하다, 기뻐하다', p: '카이로', e: 'greet, rejoice', n: '은혜의 인사' },
  'G4074': { k: '베드로', p: '페트로스', e: 'Peter', n: '반석' },
  'G652':  { k: '사도', p: '아포스톨로스', e: 'apostle', n: '보내심을 받은 자' },
  'G4102': { k: '믿음', p: '피스티스', e: 'faith', n: '전인격적 신뢰' },
  'G5485': { k: '은혜', p: '카리스', e: 'grace', n: '값없는 호의' },
  'G1515': { k: '평강', p: '에이레네', e: 'peace', n: '온전한 화평' },
  'G26':   { k: '사랑', p: '아가페', e: 'love', n: '신적 희생적 사랑' }
};

// =====================================================================
// 💡 [영문 발음기호 ➔ 자연스러운 한글 음역 룰셋]
// =====================================================================
const PRONUNCIATION_TRANSLIT_RULES = {
  'desmios': '데스미오스', 'christou': '크리스투', 'iesou': '이에수',
  'paulos': '파울로스', 'timotheos': '티모테오스', 'adelphos': '아델포스',
  'philemoni': '필레모니', 'agapeto': '아가페토', 'synergo': '쉬네르고',
  'hemon': '헤몬', 'bane': '베네', 'shame': '쉐모트', 'yis-raw-ale': '이스라엘',
  'yah-ak-obe': '야곱', 'eesh': '이쉬', 'ale-leh': '엘레', 'baw-raw': '바라',
  'el-o-heem': '엘로힘', 'yeh-ho-vaw': '여호와', 'ray-sheeth': '레쉬트',
  'shaw-mah-yim': '샤마임', 'eh-rets': '에레츠', 'kho-shek': '호셰크',
  'teh-home': '테홈', 'roo-akh': '루아흐', 'paw-neem': '파님', 'ma-yim': '마임'
};

function formatCleanPron(raw) {
  if (!raw) return '';
  const clean = raw.replace(/[[\]']/g, '').trim().toLowerCase();
  if (PRONUNCIATION_TRANSLIT_RULES[clean]) {
    return `[${PRONUNCIATION_TRANSLIT_RULES[clean]}]`;
  }
  return `[${raw.replace(/[[\]]/g, '').trim()}]`;
}

// =====================================================================
// 💡 [어원 찌꺼기 완벽 필터 정규식 엔진]
// =====================================================================
function cleanDescriptionNoise(desc) {
  if (!desc) return { meaning: '원어 어휘', etym: '', usage: '' };

  let etym = '';
  let meaning = '';
  let usage = '';

  const etymMatch = desc.match(/\[어원 및 파생\]\s*([^\[]+)/);
  if (etymMatch && etymMatch[1]) {
    etym = etymMatch[1].trim()
      .replace(/from\s+([HG0-9]+)/gi, '$1번 어근에서 유래')
      .replace(/a primitive root/gi, '고유 기본 어근')
      .replace(/plural of an unused noun/gi, '단독 사용되지 않는 명사의 복수형');
  }

  const meaningMatch = desc.match(/\[원어 의미\]\s*([^\[]+)/);
  let rawMeaning = meaningMatch && meaningMatch[1] ? meaningMatch[1].trim() : desc.slice(0, 100);

  // 핵심: (little), from H1121, of Latin origin 등 괄호/어원 접두사 박멸
  rawMeaning = rawMeaning.replace(/^\([^)]*\)[,;\s]*/, '');
  rawMeaning = rawMeaning.replace(/^from\s+[HG0-9]+[^;]*;\s*/i, '');
  rawMeaning = rawMeaning.replace(/^of\s+[a-z\s]+origin;\s*/i, '');
  rawMeaning = rawMeaning.replace(/\([^)]*\)/g, '');
  rawMeaning = rawMeaning.replace(/\[.*?\]/g, '');
  rawMeaning = rawMeaning.replace(/^(a|an|the|to)\s+/i, '');

  const firstTerm = rawMeaning.split(/[,;]/)[0].trim();
  meaning = firstTerm.length > 0 ? firstTerm : '원어 단어';

  const usageMatch = desc.match(/\[주요 번역\]\s*([^\[]+)/);
  if (usageMatch && usageMatch[1]) {
    usage = usageMatch[1].trim()
      .replace(/\[phrase\]/gi, '')
      .replace(/\[idiom\]/gi, '')
      .replace(/\(.*?\)/g, '')
      .split(',')
      .slice(0, 6)
      .map(w => w.trim())
      .filter(Boolean)
      .join(', ');
  }

  return { meaning, etym, usage };
}

// Supabase REST 배치 호출
function fetchSupabaseBatch(offset, limit = 1000) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/strongs_dictionary?select=strongs_id,original_word,pronunciation,description&order=strongs_id.asc&offset=${offset}&limit=${limit}`;
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 구글 번역 엔진
function translateWord(text) {
  return new Promise((resolve) => {
    if (!text || text.trim().length === 0 || text === '원어 단어') return resolve('원어 어휘');
    const query = encodeURIComponent(text.trim());
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${query}`;

    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const translated = parsed[0].map(item => item[0]).join('');
          resolve(translated.trim());
        } catch (_) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

// 메인 실행 파이프라인
async function run() {
  console.log("🚀 [1단계] 성경 66권 스트롱 마스터 데이터셋 구축을 시작합니다...");
  const masterDict = {};
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  let totalRows = 0;

  // 1. Supabase에서 14,000건 전수 수집
  while (hasMore) {
    try {
      console.log(`📦 데이터 수신 중: [${offset + 1} ~ ${offset + limit}]...`);
      const rows = await fetchSupabaseBatch(offset, limit);

      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      for (let r of rows) {
        const sId = (r.strongs_id || '').trim();
        if (!sId) continue;

        // 표준 마스터에 이미 정의된 핵심 단어 우선 처리
        if (CANONICAL_MASTER_MAP[sId]) {
          const c = CANONICAL_MASTER_MAP[sId];
          masterDict[sId] = {
            strongs: sId,
            original: r.original_word || '',
            pron: `[${c.p}]`,
            korean: c.k,
            eng: c.e,
            note: c.n,
            etym: c.n,
            usage: c.k
          };
          continue;
        }

        const cleaned = cleanDescriptionNoise(r.description);
        masterDict[sId] = {
          strongs: sId,
          original: r.original_word || '',
          pron: formatCleanPron(r.pronunciation),
          eng: cleaned.meaning.toLowerCase(),
          korean: '', // 다음 단계에서 정밀 번역
          etym: cleaned.etym,
          usage: cleaned.usage
        };
      }

      totalRows += rows.length;
      if (rows.length < limit) hasMore = false;
      else offset += limit;
    } catch (err) {
      console.error("수신 오류:", err);
      break;
    }
  }

  // 특수 접두사(H9000~H9009) 누락 방지 강제 주입
  Object.keys(CANONICAL_MASTER_MAP).forEach(key => {
    if (!masterDict[key]) {
      const c = CANONICAL_MASTER_MAP[key];
      masterDict[key] = {
        strongs: key,
        original: '',
        pron: `[${c.p}]`,
        korean: c.k,
        eng: c.e,
        note: c.n,
        etym: c.n,
        usage: c.k
      };
    }
  });

  console.log(`✨ 총 ${Object.keys(masterDict).length}개 어휘 수집 완료. 한글 정제 번역을 병렬 실행합니다...`);

  // 2. 비어있는 한글 의미 일괄 번역 (25개씩 병렬 배치)
  const targets = Object.keys(masterDict).filter(id => !masterDict[id].korean);
  for (let i = 0; i < targets.length; i += 25) {
    const batch = targets.slice(i, i + 25);
    await Promise.all(batch.map(async (id) => {
      const item = masterDict[id];
      if (item.eng && item.eng !== '원어 어휘' && item.eng !== '원어 단어') {
        const ko = await translateWord(item.eng);
        item.korean = ko || item.eng;
      } else {
        item.korean = '원어 어휘';
      }
    }));
    if (i % 250 === 0) {
      process.stdout.write(`⚡ ${i} / ${targets.length} 어휘 번역 완료...\r`);
    }
  }

  // 3. 최종 JSON 저장
  fs.writeFileSync(targetFile, JSON.stringify(masterDict, null, 2), 'utf-8');
  console.log(`\n🎉 1단계 완료: ${targetFile} 마스터 사전이 완벽히 구축되었습니다!`);
}

run();
// scripts/build-strongs.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// bibleApi.js의 Supabase 연결 정보
const SUPABASE_URL = 'https://fenzodpldsxdttzgztcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-';

const targetDir = path.join(__dirname, '../public/data');
const targetFile = path.join(targetDir, 'strongs_korean.json');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 🏛️ [성경 핵심 공인 인명/지명/신학 표제어 표준 사전]
const CORE_CANONICAL = {
  // 신약 주요 어휘 (G)
  'G3972': { k: '바울', p: '파울로스', n: '작은 자. 이방인의 사도' },
  'G1198': { k: '갇힌 자 (죄수)', p: '데스미오스', n: '복음을 위해 결박당한 자' },
  'G5547': { k: '그리스도', p: '크리스토스', n: '기름 부음 받은 자 (메시아)' },
  'G2424': { k: '예수', p: '이에수스', n: '자기 백성을 구원할 자' },
  'G2532': { k: '그리고, 또한', p: '카이', n: '접속사' },
  'G5095': { k: '디모데', p: '티모테오스', n: '하나님을 공경하는 자' },
  'G3588': { k: '그 (정관사)', p: '호/투/토', n: '정관사' },
  'G80':   { k: '형제', p: '아델포스', n: '영적 가족 된 성도' },
  'G5371': { k: '빌레몬', p: '필레몬', n: '사랑을 베푸는 자, 골로새 교회의 주역' },
  'G27':   { k: '사랑하는 자', p: '아가페토스', n: '주 안에서 존귀하고 보배로운 자' },
  'G4904': { k: '동역자', p: '쉬네르고스', n: '함께 일하는 동역자' },
  'G1473': { k: '우리, 우리의', p: '헤몬', n: '인칭대명사' },
  'G2385': { k: '야고보', p: '이아코보스', n: '주의 형제 예루살렘 교회 지도자' },
  'G2316': { k: '하나님', p: '테오스', n: '유일하신 참 하나님' },
  'G2962': { k: '주 (주님)', p: '퀴리오스', n: '최고 권세자, 주인' },
  'G1401': { k: '종 (청지기)', p: '둘로스', n: '그리스도께 속한 종' },
  'G1427': { k: '열두 (12)', p: '도데카', n: '언약의 완전수' },
  'G5443': { k: '지파', p: '필레', n: '이스라엘 지파 및 교회 공동체' },
  'G1290': { k: '디아스포라 (흩어진 자)', p: '디아스포라', n: '세상에 흩어진 나그네 성도' },
  'G5463': { k: '문안하노라 (기뻐하라)', p: '카이로', n: '은혜의 인사말' },
  'G4074': { k: '베드로', p: '페트로스', n: '반석' },
  'G652':  { k: '사도', p: '아포스톨로스', n: '보내심을 받은 자' },

  // 구약 주요 어휘 (H)
  'H9000': { k: '그리고, 또한', p: '베/바', n: '접속사' },
  'H9009': { k: '그 (정관사)', p: '하', n: '정관사' },
  'H9003': { k: '~안에, ~에서', p: '베', n: '전치사' },
  'H9005': { k: '~에게, ~을 위하여', p: '레', n: '전치사' },
  'H853':  { k: '(목적격 표지)', p: '에트', n: '~을/를' },
  'H854':  { k: '~와 함께', p: '에트', n: '동반 전치사' },
  'H428':  { k: '이들 (이러하니)', p: '엘레', n: '지시대명사' },
  'H8034': { k: '이름, 명성', p: '쉠', n: '존재의 본질과 이름' },
  'H1121': { k: '아들, 자손', p: '벤', n: '자녀, 계승자' },
  'H3478': { k: '이스라엘', p: '이스라엘', n: '하나님과 겨루어 이긴 자' },
  'H935':  { k: '이르다, 오다, 들어가다', p: '보', n: '도착과 진입' },
  'H4714': { k: '애굽 (이집트)', p: '미츠라임', n: '세상 권세의 땅' },
  'H3290': { k: '야곱', p: '야아코브', n: '발꿈치를 잡은 자' },
  'H376':  { k: '각 사람, 사람, 남편', p: '이쉬', n: '개인, 남성' },
  'H1004': { k: '집, 권속', p: '바이트', n: '가정, 성전' },
  'H3068': { k: '여호와 (스스로 계신 자)', p: '야훼', n: '언약의 하나님' },
  'H430':  { k: '하나님', p: '엘로힘', n: '창조주 전능자' },
  'H4872': { k: '모세', p: '모셰', n: '물에서 건져낸 자' },
  'H7121': { k: '부르시다', p: '카라', n: '소명하고 칭하다' },
  'H1696': { k: '말씀하시다', p: '다바르', n: '선포하다' },
  'H559':  { k: '이르시다', p: '아마르', n: '말하다' },
  'H413':  { k: '~에게, ~로', p: '엘', n: '방향 전치사' },
  'H168':  { k: '회막, 장막', p: '오헬', n: '거룩한 성막' },
  'H4150': { k: '정한 절기, 만남의 장소', p: '모에드', n: '정하신 때와 회막' }
};

// Supabase 일괄 조회 (1,000건 단위 페이징)
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

// 구글 번역 엔진 (오류 시 원문 반환)
function translateText(text) {
  return new Promise((resolve) => {
    if (!text || text.trim().length === 0) return resolve('');
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

// 라틴 음역 기호를 자연스러운 한글 발음으로 변환
function formatPron(raw) {
  if (!raw) return '';
  const clean = raw.replace(/[[\]']/g, '').trim().toLowerCase();
  const MAP = {
    'desmios': '데스미오스', 'christou': '크리스투', 'iesou': '이에수',
    'paulos': '파울로스', 'timotheos': '티모테오스', 'adelphos': '아델포스',
    'philemoni': '필레모니', 'agapeto': '아가페토', 'synergo': '쉬네르고',
    'hemon': '헤몬', 'bane': '베네', 'shame': '쉐모트', 'yis-raw-ale': '이스라엘',
    'yah-ak-obe': '야곱', 'eesh': '이쉬', 'ale-leh': '엘레', 'baw-raw': '바라',
    'el-o-heem': '엘로힘', 'yeh-ho-vaw': '여호와', 'ray-sheeth': '레쉬트'
  };
  if (MAP[clean]) return `[${MAP[clean]}]`;
  return `[${raw.replace(/[[\]]/g, '')}]`;
}

// 💡 어원 노이즈((little, a son (as builder...) 정제기[cite: 14, 17]
function extractCleanMeaning(desc) {
  if (!desc) return '';
  
  // 1. [원어 의미] 블록 확인
  const meaningMatch = desc.match(/\[원어 의미\]\s*([^;\n\r]+)/);
  let raw = meaningMatch && meaningMatch[1] ? meaningMatch[1].trim() : desc.slice(0, 80);

  // 2. 괄호로 시작하는 어원 설명 제거 e.g. "(little); Paul" -> "Paul"[cite: 14]
  raw = raw.replace(/^\([^)]*\)[,;\s]*/, '');
  raw = raw.replace(/^from\s+[HG0-9]+[^;]*;\s*/i, '');
  raw = raw.replace(/\([^)]*\)/g, ''); // 내부 보조 괄호 제거
  raw = raw.replace(/\[.*?\]/g, '');   // 내부 대괄호 제거
  raw = raw.replace(/^(a|an|the|to)\s+/i, ''); // 관사/부정사 접두어 정리

  const firstTerm = raw.split(/[,;]/)[0].trim();
  return firstTerm.length > 0 ? firstTerm : '원어 단어';
}

async function run() {
  console.log("🚀 Supabase에서 14,000단어 추출 및 정제 작업을 시작합니다...");
  const resultDict = {};
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    try {
      console.log(`📦 [${offset + 1} ~ ${offset + limit}] 수신 중...`);
      const rows = await fetchSupabaseBatch(offset, limit);

      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      for (let row of rows) {
        const sId = row.strongs_id;
        const desc = row.description || '';
        
        // 표준 사전 우선 반영
        if (CORE_CANONICAL[sId]) {
          resultDict[sId] = {
            strongs: sId,
            original: row.original_word || '',
            pron: `[${CORE_CANONICAL[sId].p}]`,
            korean: CORE_CANONICAL[sId].k,
            note: CORE_CANONICAL[sId].n,
            desc: desc
          };
          continue;
        }

        const cleanEng = extractCleanMeaning(desc);
        resultDict[sId] = {
          strongs: sId,
          original: row.original_word || '',
          pron: formatPron(row.pronunciation),
          rawEng: cleanEng,
          korean: '', // 번역 단계에서 채움
          desc: desc
        };
      }

      totalProcessed += rows.length;
      if (rows.length < limit) hasMore = false;
      else offset += limit;
    } catch (err) {
      console.error("수신 중 오류:", err);
      break;
    }
  }

  console.log(`✨ 총 ${totalProcessed}개 어휘 추출 완료. 한글 정제 번역을 적용합니다...`);

  const idsToTranslate = Object.keys(resultDict).filter(id => !resultDict[id].korean);
  for (let i = 0; i < idsToTranslate.length; i += 25) {
    const batch = idsToTranslate.slice(i, i + 25);
    await Promise.all(batch.map(async (id) => {
      const item = resultDict[id];
      if (item.rawEng && item.rawEng !== '원어 단어') {
        const ko = await translateText(item.rawEng);
        item.korean = ko || item.rawEng;
      } else {
        item.korean = '원어 어휘';
      }
    }));
    if (i % 250 === 0) {
      process.stdout.write(`⚡ ${i} / ${idsToTranslate.length} 어휘 번역 완료...\r`);
    }
  }

  fs.writeFileSync(targetFile, JSON.stringify(resultDict, null, 2), 'utf-8');
  console.log(`\n🎉 14,000단어 사전 구축 완료: ${targetFile}`);
}

run();
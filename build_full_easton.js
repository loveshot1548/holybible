// build_full_easton.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const OUT_FILE = path.join(DATA_DIR, 'easton_dict.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const HF_URL = "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Easton's%20Bible%20Dictionary.jsonl";

async function run() {
  console.log("==================================================================");
  console.log("⏳ 이스톤 성경 백과사전 4,000개 표제어 전수 완본 다운로드 및 파싱 중...");
  console.log("==================================================================");

  try {
    const res = await fetch(HF_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!res.ok) {
      throw new Error(`다운로드 실패 HTTP ${res.status}: ${res.statusText}`);
    }

    let rawText = await res.text();
    rawText = rawText.replace(/^\uFEFF/, ''); // BOM 제거
    console.log(`📦 다운로드 완료 (${(Buffer.byteLength(rawText) / (1024 * 1024)).toFixed(2)} MB). 파싱 진행 중...`);

    const lines = rawText.split('\n');
    const fullDict = {};

    // 1. 기존 핵심 한글 표제어(101개) 먼저 보존 병합
    if (fs.existsSync(OUT_FILE)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
        Object.assign(fullDict, oldData);
      } catch (_) {}
    }

    let parsedCount = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line.trim());
        
        // 표제어 추출 (term)
        const word = (item.term || item.word || item.headword || item.title || '').trim();
        
        // 본문 추출 (definitions 배열 또는 단일 문자열)
        let defRaw = item.definitions || item.definition || item.text || item.content || item.desc || '';
        let definition = '';

        if (Array.isArray(defRaw)) {
          definition = defRaw
            .map(d => typeof d === 'string' ? d.trim() : JSON.stringify(d))
            .filter(Boolean)
            .join('\n\n');
        } else if (typeof defRaw === 'string') {
          definition = defRaw.trim();
        }

        if (word && definition) {
          fullDict[word] = { definition };
          parsedCount++;
        }
      } catch (_) {}
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(fullDict, null, 2), 'utf-8');

    const sizeMb = (fs.statSync(OUT_FILE).size / (1024 * 1024)).toFixed(2);
    console.log("==================================================================");
    console.log(`✅ [성공] 이스톤 성경 백과사전 4,000개 전수 완본 구축 완료!`);
    console.log(`📊 등록 표제어: 총 ${Object.keys(fullDict).length}개 (영문 완본: ${parsedCount}개, 파일 크기: ${sizeMb} MB)`);
    console.log(`📁 저장 경로: ${OUT_FILE}`);
    console.log("==================================================================");
  } catch (err) {
    console.error("❌ 오류 발생:", err.message);
  }
}

run();
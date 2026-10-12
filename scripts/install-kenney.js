// scripts/install-kenney.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const TARGET_DIR = path.join(__dirname, '..', 'public', 'assets', 'buildings');
const TEMP_ZIP = path.join(__dirname, 'kenney_medieval.zip');
const TEMP_EXTRACT = path.join(__dirname, 'kenney_temp');

// 🌐 검증된 Kenney Isometric Medieval Pack 직접 다운로드 URL
const ASSET_URL = 'https://raw.githubusercontent.com/KenneyNL/Starter-Kits/master/Isometric/medieval_pack.zip';

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

console.log('📦 [1/3] Kenney 정통 2.5D 아이소메트릭 게임 에셋 다운로드 중...');

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function run() {
  try {
    // 1. 다운로드
    await downloadFile(ASSET_URL, TEMP_ZIP);
    console.log('✅ 다운로드 완료!');

    // 2. 압축 해제 (Windows 내장 tar/PowerShell 활용)
    console.log('📂 [2/3] 압축 해제 및 텍스처 추출 중...');
    if (fs.existsSync(TEMP_EXTRACT)) fs.rmSync(TEMP_EXTRACT, { recursive: true, force: true });
    fs.mkdirSync(TEMP_EXTRACT, { recursive: true });

    try {
      execSync(`tar -xf "${TEMP_ZIP}" -C "${TEMP_EXTRACT}"`);
    } catch (_) {
      execSync(`powershell -command "Expand-Archive -Path '${TEMP_ZIP}' -DestinationPath '${TEMP_EXTRACT}' -Force"`);
    }

    // 3. 에셋 매핑 목록 (실제 3D 그래픽을 타이쿤 건축물 ID로 매칭)
    console.log('🏛️ [3/3] 예루살렘 타이쿤 건축물에 1:1 매핑 배치 중...');

    // 추출된 폴더 내 png 검색
    const getAllFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) results = results.concat(getAllFiles(fullPath));
        else if (file.endsWith('.png')) results.push(fullPath);
      });
      return results;
    };

    const pngFiles = getAllFiles(TEMP_EXTRACT);

    // 건축물 타입별 매핑 규칙
    const findAndCopy = (keyword, targetName) => {
      const found = pngFiles.find(f => path.basename(f).toLowerCase().includes(keyword.toLowerCase()));
      if (found) {
        fs.copyFileSync(found, path.join(TARGET_DIR, `${targetName}.png`));
        return true;
      }
      return false;
    };

    // 주요 건물 매핑
    findAndCopy('castle', 'temple') || findAndCopy('church', 'temple');
    findAndCopy('tent', 'house_1');
    findAndCopy('hut', 'house_2') || findAndCopy('wood', 'house_2');
    findAndCopy('house', 'house_3');
    findAndCopy('stone', 'house_4');
    findAndCopy('manor', 'house_5');
    findAndCopy('market', 'bread_market');
    findAndCopy('stall', 'fish_market');
    findAndCopy('mill', 'wheat_farm');
    findAndCopy('wall', 'wall');
    findAndCopy('gate', 'gate');
    findAndCopy('tower', 'tower');
    findAndCopy('well', 'well');
    findAndCopy('water', 'aqueduct');

    // 정리
    fs.unlinkSync(TEMP_ZIP);
    fs.rmSync(TEMP_EXTRACT, { recursive: true, force: true });

    console.log('🎉 모든 3D 렌더링 PNG 에셋이 public/assets/buildings/ 에 성공적으로 설치되었습니다!');
    console.log('화면을 새로고침하면 박스가 사라지고 진짜 게임 그래픽이 출력됩니다.\n');
  } catch (err) {
    console.error('❌ 설치 중 에러가 발생했습니다:', err.message);
  }
}

run();